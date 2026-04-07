from __future__ import annotations

import io
from datetime import datetime

from fastapi import APIRouter, Response
from typing import Optional

from pydantic import BaseModel, Field
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer

router = APIRouter()


class RecipeRequest(BaseModel):
    ingredient: str = Field(..., min_length=1)
    medical_conditions: str = ""
    calorie_target_kcal: Optional[int] = None
    patient_group: str = "adult"
    product_label_context: str = ""


class RecipeExportRequest(RecipeRequest):
    variant_index: int = 0


HOUSEHOLD_MEASURE_REFERENCE = {
    "oatmeal": {"grams": 10, "unit": "sdm"},
    "minyak zaitun": {"grams": 5, "unit": "sdt"},
    "minyak kanola": {"grams": 5, "unit": "sdt"},
    "gula": {"grams": 4, "unit": "sdt"},
    "garam": {"grams": 5, "unit": "sdt"},
    "pisang": {"grams": 80, "unit": "buah kecil"},
    "susu rendah lemak": {"grams": 200, "unit": "gelas belimbing"},
    "susu": {"grams": 200, "unit": "gelas belimbing"},
    "air": {"grams": 200, "unit": "gelas belimbing"},
    "nasi putih": {"grams": 100, "unit": "centong sedang"},
    "nasi merah": {"grams": 100, "unit": "centong sedang"},
    "mie rebus": {"grams": 150, "unit": "mangkuk sedang"},
    "bubur": {"grams": 200, "unit": "mangkuk sedang"},
    "brokoli": {"grams": 15, "unit": "sdm"},
    "pepaya": {"grams": 80, "unit": "potong sedang"},
    "bayam": {"grams": 15, "unit": "sdm"},
    "wortel": {"grams": 5, "unit": "sdm"},
    "kacang panjang": {"grams": 15, "unit": "sdm"},
    "buncis": {"grams": 15, "unit": "sdm"},
    "kangkung": {"grams": 15, "unit": "sdm"},
    "kol": {"grams": 15, "unit": "sdm"},
    "selada": {"grams": 15, "unit": "sdm"},
    "tomat": {"grams": 40, "unit": "buah kecil"},
    "jeruk": {"grams": 90, "unit": "buah kecil"},
    "buah potong": {"grams": 15, "unit": "sdm"},
    "tahu": {"grams": 50, "unit": "potong sedang"},
    "timun": {"grams": 50, "unit": "potong sedang"},
    "papaya": {"grams": 80, "unit": "potong sedang"},
    "sayur bening": {"grams": 150, "unit": "mangkuk sedang"},
    "semangka": {"grams": 100, "unit": "potong sedang"},
    "sup sayur": {"grams": 180, "unit": "mangkuk sedang"},
    "kentang rebus": {"grams": 90, "unit": "buah sedang"},
    "apel": {"grams": 80, "unit": "buah kecil"},
    "roti gandum": {"grams": 30, "unit": "lembar"},
    "roti tawar": {"grams": 30, "unit": "lembar"},
    "alpukat": {"grams": 50, "unit": "buah sedang"},
    "oat nasi": {"grams": 100, "unit": "mangkuk sedang"},
    "salad sayur": {"grams": 120, "unit": "mangkuk sedang"},
    "melon": {"grams": 100, "unit": "potong sedang"},
    "pir": {"grams": 90, "unit": "buah kecil"},
    "mangga": {"grams": 100, "unit": "potong sedang"},
    "pepes ikan": {"grams": 60, "unit": "potong sedang"},
    "buah campur": {"grams": 15, "unit": "sdm"},
    "yogurt plain": {"grams": 100, "unit": "cup kecil"},
    "tempe": {"grams": 50, "unit": "potong sedang"},
    "tempe goreng": {"grams": 50, "unit": "potong sedang"},
    "ayam": {"grams": 40, "unit": "potong kecil"},
    "ayam rebus": {"grams": 40, "unit": "potong kecil"},
    "telur": {"grams": 55, "unit": "butir sedang"},
    "putih telur": {"grams": 30, "unit": "butir"},
    "ikan": {"grams": 50, "unit": "potong sedang"},
    "ikan kembung": {"grams": 50, "unit": "potong sedang"},
    "ikan nila": {"grams": 50, "unit": "potong sedang"},
    "udang": {"grams": 10, "unit": "ekor sedang"},
}

MEASUREMENT_SOURCE_LABELS = [
    "Takaran rumah tangga (URT) edukatif menggunakan padanan umum Indonesia seperti sdm, sdt, gelas belimbing, centong, mangkuk, potong, dan buah.",
    "Acuan edukasi menggabungkan praktik URT yang lazim dipakai pada konseling gizi Indonesia serta pendekatan household measures yang dipakai luas secara global untuk edukasi porsi.",
    "Untuk presisi klinis, penimbangan dalam gram tetap menjadi acuan utama.",
]


def _to_household_measure(name: str, grams: int) -> tuple[str, str]:
    reference = HOUSEHOLD_MEASURE_REFERENCE.get(name.lower())
    if not reference:
        return (f"{grams} g", "Acuan utama tetap gram; padanan URT spesifik untuk bahan ini belum tersedia.")
    base_grams = reference["grams"]
    unit = reference["unit"]
    quantity = grams / base_grams
    label = f"{quantity:.1f} {unit}"
    label = label.replace(".0 ", " ")
    note = "Padanan URT ini bersifat edukatif praktis; bila tersedia alat ukur, gram tetap dipakai sebagai acuan utama."
    return label, note


def _normalize_ingredients(items: list[dict]) -> list[dict]:
    normalized = []
    for item in items:
        grams = int(item["grams"])
        measure, note = _to_household_measure(item["name"], grams)
        normalized.append(
            {
                "name": item["name"],
                "grams": grams,
                "household_measure": measure,
                "measure_note": note,
            }
        )
    return normalized


def _condition_modifiers(conditions_text: str) -> list[str]:
    conditions = conditions_text.lower()
    modifiers = []
    if "diabetes" in conditions or "dm" in conditions:
        modifiers.append("gunakan karbohidrat lebih terkontrol dan pilih bahan ber-GI lebih rendah")
    if "hipertensi" in conditions:
        modifiers.append("batasi garam, kaldu instan, dan bumbu tinggi natrium")
    if "ckd" in conditions or "ginjal" in conditions:
        modifiers.append("kendalikan protein, natrium, dan hindari kuah pekat/olahan sangat asin")
    if "dyslip" in conditions:
        modifiers.append("utamakan lemak sehat dan kurangi santan pekat atau gorengan")
    if "gout" in conditions or "asam urat" in conditions:
        modifiers.append("hindari bahan tinggi purin seperti jeroan, sarden, dan kaldu daging pekat")
    if "tidak direkomendasikan" in conditions or "status merah" in conditions:
        modifiers.append("hindari produk kemasan yang baru dinilai kurang sesuai; prioritaskan bahan segar dan masakan rumahan")
    if "hati-hati" in conditions or "status kuning" in conditions:
        modifiers.append("batasi produk kemasan tertentu dan perhatikan takaran per saji")
    return modifiers


def _meal_title(meal_type: str, ingredient: str) -> str:
    titles = {
        "breakfast": f"Sarapan {ingredient.title()} Seimbang",
        "morning_snack": "Snack Pagi Ringan",
        "lunch": f"Makan Siang {ingredient.title()} dan Nasi",
        "afternoon_snack": "Snack Sore Terarah",
        "dinner": f"Makan Malam {ingredient.title()} Ringan",
    }
    return titles[meal_type]


def _build_variant(
    variant_name: str,
    ingredient: str,
    calorie_target: int,
    modifier_text: str,
    breakfast_items: list[dict],
    lunch_items: list[dict],
    dinner_items: list[dict],
    snack_items: list[dict],
    notes: list[str],
) -> dict:
    portions = [
        ("breakfast", "07:00", 0.22, 16, 30, 8, breakfast_items),
        ("morning_snack", "10:00", 0.10, 6, 18, 5, snack_items),
        ("lunch", "12:30", 0.30, 22, 38, 10, lunch_items),
        ("afternoon_snack", "15:30", 0.10, 6, 18, 5, snack_items),
        ("dinner", "18:30", 0.28, 18, 28, 8, dinner_items),
    ]
    meals = []
    for meal_type, schedule, ratio, protein, carbs, fat, ingredients in portions:
        calories = round(calorie_target * ratio)
        if meal_type == "breakfast":
            instructions = [
                "Utamakan kombinasi karbohidrat, protein, dan buah agar energi pagi lebih stabil.",
                "Gunakan teknik masak rendah minyak dan rendah garam.",
            ]
        elif meal_type == "lunch":
            instructions = [
                f"Masak {ingredient} dengan metode kukus, panggang, rebus, atau tumis ringan.",
                "Lengkapi dengan sayur dan sumber karbohidrat utama.",
            ]
        elif meal_type == "dinner":
            instructions = [
                "Pilih porsi malam yang tetap seimbang tetapi lebih ringan daripada siang.",
                "Hindari garam, gula, dan minyak berlebih menjelang malam.",
            ]
        else:
            instructions = [
                "Gunakan snack sederhana untuk menjaga kestabilan asupan tanpa berlebihan.",
                "Pilih buah, susu/yogurt, atau protein ringan sesuai kebutuhan.",
            ]
        meals.append(
            {
                "meal_type": meal_type,
                "schedule_time": schedule,
                "title": _meal_title(meal_type, ingredient),
                "ingredients": _normalize_ingredients(ingredients),
                "instructions": instructions,
                "nutrition": {"calories": calories, "protein": protein, "carbs": carbs, "fat": fat},
                "personalization_notes": modifier_text,
            }
        )
    return {
        "variant_name": variant_name,
        "day_plan_notes": notes,
        "recipes": meals,
        "total_planned_calories": sum(item["nutrition"]["calories"] for item in meals),
    }


@router.post("/generate")
def generate_recipes(payload: RecipeRequest) -> dict:
    ingredient = payload.ingredient.strip().lower()
    calorie_target = payload.calorie_target_kcal or 1800
    modifiers = _condition_modifiers(payload.medical_conditions)
    modifier_text = "; ".join(modifiers) if modifiers else "ikuti pola makan seimbang dan teknik masak rendah minyak"
    variants = [
        _build_variant(
            "Varian Seimbang Harian",
            ingredient,
            calorie_target,
            modifier_text,
            breakfast_items=[
                {"name": ingredient, "grams": 70},
                {"name": "oatmeal", "grams": 40},
                {"name": "pisang", "grams": 80},
                {"name": "susu rendah lemak", "grams": 200},
            ],
            lunch_items=[
                {"name": ingredient, "grams": 100},
                {"name": "nasi merah", "grams": 120},
                {"name": "brokoli", "grams": 80},
                {"name": "pepaya", "grams": 80},
            ],
            dinner_items=[
                {"name": ingredient, "grams": 90},
                {"name": "bayam", "grams": 80},
                {"name": "wortel", "grams": 50},
                {"name": "jeruk", "grams": 90},
            ],
            snack_items=[
                {"name": "buah potong", "grams": 100},
                {"name": "tahu", "grams": 60},
            ],
            notes=[
                "Pola ini mendekati konsep 4 sehat 5 sempurna: ada sumber karbohidrat, lauk/protein, sayur, buah, dan tambahan susu rendah lemak.",
            ],
        ),
        _build_variant(
            "Varian Nusantara Ringan",
            ingredient,
            calorie_target,
            modifier_text,
            breakfast_items=[
                {"name": "nasi merah", "grams": 90},
                {"name": ingredient, "grams": 60},
                {"name": "timun", "grams": 50},
                {"name": "papaya", "grams": 80},
            ],
            lunch_items=[
                {"name": ingredient, "grams": 100},
                {"name": "sayur bening", "grams": 150},
                {"name": "nasi merah", "grams": 110},
                {"name": "semangka", "grams": 100},
            ],
            dinner_items=[
                {"name": ingredient, "grams": 80},
                {"name": "sup sayur", "grams": 180},
                {"name": "kentang rebus", "grams": 90},
                {"name": "apel", "grams": 80},
            ],
            snack_items=[
                {"name": "pisang", "grams": 80},
                {"name": "susu rendah lemak", "grams": 180},
            ],
            notes=[
                "Varian ini lebih dekat dengan pola rumahan Indonesia dan tetap dibuat lebih ringan.",
            ],
        ),
        _build_variant(
            "Varian Tinggi Serat & Buah",
            ingredient,
            calorie_target,
            modifier_text,
            breakfast_items=[
                {"name": "roti gandum", "grams": 60},
                {"name": ingredient, "grams": 70},
                {"name": "alpukat", "grams": 50},
                {"name": "susu rendah lemak", "grams": 180},
            ],
            lunch_items=[
                {"name": ingredient, "grams": 100},
                {"name": "oat nasi", "grams": 100},
                {"name": "salad sayur", "grams": 120},
                {"name": "melon", "grams": 100},
            ],
            dinner_items=[
                {"name": ingredient, "grams": 85},
                {"name": "brokoli", "grams": 90},
                {"name": "wortel", "grams": 60},
                {"name": "pir", "grams": 90},
            ],
            snack_items=[
                {"name": "buah campur", "grams": 120},
                {"name": "yogurt plain", "grams": 100},
            ],
            notes=[
                "Varian ini menekankan buah, sayur, dan serat yang lebih tinggi untuk pola makan yang lebih variatif.",
            ],
        ),
    ]

    return {
        "recipes": variants[0]["recipes"],
        "plan_variants": variants,
        "modifier_notes": modifiers,
        "plan_type": "daily_meal_plan",
        "target_calories": calorie_target,
        "total_planned_calories": variants[0]["total_planned_calories"],
        "clarification": "Total seluruh slot makan dalam rencana harian ini yang ditujukan mendekati target kalori harian, bukan satu menu saja.",
        "measurement_guidance": "Takaran rumah tangga seperti sdm, gelas, mangkuk, buah, atau potong ditampilkan sebagai padanan praktis edukatif. Untuk presisi klinis dan konseling gizi, gram tetap menjadi acuan utama.",
        "measurement_sources": MEASUREMENT_SOURCE_LABELS,
    }


@router.post("/export-plan-pdf")
def export_recipe_plan_pdf(payload: RecipeExportRequest):
    generated = generate_recipes(payload)
    variants = generated["plan_variants"]
    selected = variants[max(0, min(payload.variant_index, len(variants) - 1))]

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=18 * mm, leftMargin=18 * mm, topMargin=18 * mm, bottomMargin=18 * mm)
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(name="RecipeTitle", parent=styles["Title"], fontSize=22, leading=28, textColor=colors.HexColor("#102A6D"))
    body_style = ParagraphStyle(name="RecipeBody", parent=styles["BodyText"], fontSize=11, leading=16, textColor=colors.HexColor("#10233F"))
    sub_style = ParagraphStyle(name="RecipeSub", parent=styles["Heading2"], fontSize=14, leading=18, textColor=colors.HexColor("#1F4E94"))
    story = [
        Paragraph("NutriCore AI", title_style),
        Paragraph(f"Ringkasan Recipe - {selected['variant_name']}", sub_style),
        Paragraph(f"Bahan utama: {payload.ingredient.title()}", body_style),
        Paragraph(f"Target energi harian: {generated['target_calories']} kkal", body_style),
        Paragraph(f"Total rencana menu: {selected['total_planned_calories']} kkal", body_style),
        Paragraph(f"Kondisi medis: {payload.medical_conditions or '-'}", body_style),
        Spacer(1, 8),
    ]
    for meal in selected["recipes"]:
        story.append(Paragraph(f"{meal['schedule_time']} - {meal['title']}", sub_style))
        story.append(Paragraph(f"Estimasi: {meal['nutrition']['calories']} kkal | Protein {meal['nutrition']['protein']} g | Karbohidrat {meal['nutrition']['carbs']} g | Lemak {meal['nutrition']['fat']} g", body_style))
        for ingredient in meal["ingredients"]:
            story.append(Paragraph(f"• {ingredient['name']} {ingredient['grams']} g ({ingredient['household_measure']})", body_style))
        story.append(Spacer(1, 6))
    doc.build(story)
    filename = f"nutricore-recipe-{datetime.now().strftime('%Y%m%d-%H%M%S')}.pdf"
    return Response(content=buffer.getvalue(), media_type="application/pdf", headers={"Content-Disposition": f'attachment; filename="{filename}"'})

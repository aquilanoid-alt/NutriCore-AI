from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel, Field
from app.services.product_label_ocr import extract_text_from_data_url, parse_product_label_text

router = APIRouter()


class ProductLabelInput(BaseModel):
    product_name: str = Field(..., min_length=1)
    serving_size_g: float = 0
    calories_kcal: float = 0
    carbs_g: float = 0
    sugar_g: float = 0
    sodium_mg: float = 0
    saturated_fat_g: float = 0
    protein_g: float = 0
    fiber_g: float = 0
    medical_conditions: str = ""
    calorie_target_kcal: float = 0


class ProductLabelScanInput(BaseModel):
    image_data_url: str = Field(..., min_length=20)
    crop_left: float = 0.0
    crop_top: float = 0.0
    crop_right: float = 1.0
    crop_bottom: float = 1.0


def _status_payload(level: str, title: str, reason: str, serving: str) -> dict:
    color_map = {"green": "#2FB34A", "yellow": "#F5B301", "red": "#D94F45"}
    return {
        "status": level,
        "status_label": title,
        "status_color": color_map[level],
        "reason": reason,
        "recommended_serving": serving,
    }


@router.post("/analyze")
def analyze_product_label(payload: ProductLabelInput) -> dict:
    conditions = (payload.medical_conditions or "").lower()
    reasons: list[str] = []
    severity = 0

    if payload.sugar_g >= 10:
        severity = max(severity, 2)
        reasons.append(f"Gula per saji {payload.sugar_g:g} g tergolong tinggi.")
    elif payload.sugar_g >= 5:
        severity = max(severity, 1)
        reasons.append(f"Gula per saji {payload.sugar_g:g} g perlu dibatasi.")

    if payload.sodium_mg >= 300:
        severity = max(severity, 2)
        reasons.append(f"Natrium per saji {payload.sodium_mg:g} mg cukup tinggi.")
    elif payload.sodium_mg >= 140:
        severity = max(severity, 1)
        reasons.append(f"Natrium per saji {payload.sodium_mg:g} mg perlu diperhatikan.")

    if payload.saturated_fat_g >= 4:
        severity = max(severity, 2)
        reasons.append(f"Lemak jenuh {payload.saturated_fat_g:g} g cukup tinggi.")
    elif payload.saturated_fat_g >= 2:
        severity = max(severity, 1)
        reasons.append(f"Lemak jenuh {payload.saturated_fat_g:g} g perlu dibatasi.")

    if payload.carbs_g >= 30:
        severity = max(severity, 1)
        reasons.append(f"Karbohidrat per saji {payload.carbs_g:g} g perlu dihitung ke target harian.")

    if ("diabetes" in conditions or "dm" in conditions) and payload.sugar_g > 5:
        severity = max(severity, 2)
        reasons.append("Kandungan gula kurang sesuai untuk kontrol glukosa.")
    if ("diabetes" in conditions or "dm" in conditions) and payload.carbs_g > 25:
        severity = max(severity, 2)
        reasons.append("Karbohidrat per saji cukup tinggi untuk kontrol glukosa bila porsinya tidak dibatasi.")
    if "hipertensi" in conditions and payload.sodium_mg > 140:
        severity = max(severity, 2)
        reasons.append("Kandungan natrium kurang sesuai untuk hipertensi.")
    if ("ckd" in conditions or "ginjal" in conditions) and payload.sodium_mg > 140:
        severity = max(severity, 2)
        reasons.append("Kandungan natrium kurang sesuai untuk gangguan ginjal.")
    if ("dyslip" in conditions or "kolesterol" in conditions) and payload.saturated_fat_g > 2:
        severity = max(severity, 2)
        reasons.append("Lemak jenuh kurang sesuai untuk dislipidemia.")

    if payload.fiber_g >= 3 and severity == 0:
        reasons.append("Serat cukup baik untuk membantu kualitas pola makan.")
    if payload.protein_g >= 5 and severity <= 1:
        reasons.append("Protein per saji cukup membantu sebagai nilai tambah produk.")

    if severity == 2:
        result = _status_payload(
            "red",
            "Tidak Direkomendasikan",
            " ".join(reasons) or "Komposisi produk kurang sesuai untuk kondisi individu.",
            "Bila ingin dikonsumsi, sebaiknya dihindari atau maksimal 1/2 saji dan tidak rutin.",
        )
    elif severity == 1:
        result = _status_payload(
            "yellow",
            "Hati-hati",
            " ".join(reasons) or "Produk masih bisa dipertimbangkan dengan pembatasan porsi.",
            "Maksimal 1 saji kecil, tidak terlalu sering, dan sesuaikan dengan target harian.",
        )
    else:
        result = _status_payload(
            "green",
            "Direkomendasikan",
            " ".join(reasons) or "Komposisi produk relatif lebih aman untuk digunakan sebagai pilihan sesekali.",
            "1 saji sesuai label umumnya masih dapat diterima dalam target harian.",
        )

    result["summary"] = (
        f"{payload.product_name}: {result['status_label']}. "
        f"{result['reason']} Anjuran: {result['recommended_serving']}"
    )
    return result


@router.post("/scan-image")
def scan_product_label_image(payload: ProductLabelScanInput) -> dict:
    text = extract_text_from_data_url(
        payload.image_data_url,
        crop_left=payload.crop_left,
        crop_top=payload.crop_top,
        crop_right=payload.crop_right,
        crop_bottom=payload.crop_bottom,
    )
    return parse_product_label_text(text)

from __future__ import annotations

from typing import Literal, Optional, Tuple

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.services.who_growth import compute_zscore, load_who_table

router = APIRouter()

PatientGroup = Literal[
    "infant",
    "toddler",
    "child_adolescent",
    "adult",
    "elderly",
    "pregnant",
    "lactating",
]
Sex = Literal["male", "female"]
ActivityLevel = Literal["sedentary", "light", "moderate", "active", "very_active"]


class AssessmentInput(BaseModel):
    patient_group: PatientGroup
    sex: Sex
    goal: Optional[str] = None
    age_months: Optional[int] = None
    age_years: Optional[int] = None
    weight_kg: Optional[float] = None
    height_cm: Optional[float] = None
    length_cm: Optional[float] = None
    head_circumference_cm: Optional[float] = None
    muac_cm: Optional[float] = None
    waist_cm: Optional[float] = None
    edema: bool = False
    recent_weight_loss: bool = False
    activity_level: Optional[ActivityLevel] = None
    pregnancy_trimester: Optional[Literal["first", "second", "third"]] = None
    gestational_age_weeks: Optional[int] = None
    pre_pregnancy_weight_kg: Optional[float] = None
    breastfeeding_exclusive: Optional[bool] = None
    breastfeeding_child_age_months: Optional[int] = None
    clinical_context: Optional[str] = None
    medical_conditions: Optional[str] = None


class AssessmentOutput(BaseModel):
    patient_group: PatientGroup
    metrics: dict
    nutrition_targets: dict
    disease_diet_rules: list[str]
    growth_charts: list[dict]
    soap_note: dict
    icd10_codes: list[dict]
    report_profile: dict
    status_summary: str
    risk_flags: list[str]
    recommendations: list[str]
    monitoring_plan: list[str]
    guideline_notes: list[str]


def _bmi(weight_kg: Optional[float], height_cm: Optional[float]) -> Optional[float]:
    if not weight_kg or not height_cm or height_cm <= 0:
        return None
    height_m = height_cm / 100
    return round(weight_kg / (height_m * height_m), 2)


def _adult_bmi_classification(bmi: Optional[float]) -> Optional[str]:
    if bmi is None:
        return None
    if bmi < 18.5:
        return "Kurus"
    if bmi < 23:
        return "Normal"
    if bmi < 25:
        return "Overweight"
    return "Obesitas"


def _adult_energy_estimate(
    weight_kg: Optional[float],
    height_cm: Optional[float],
    age_years: Optional[int],
    sex: Sex,
    activity_level: Optional[ActivityLevel],
) -> Tuple[Optional[float], Optional[float]]:
    if not weight_kg or not height_cm or not age_years:
        return None, None
    if sex == "male":
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age_years + 5
    else:
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age_years - 161
    factor_map = {
        "sedentary": 1.2,
        "light": 1.375,
        "moderate": 1.55,
        "active": 1.725,
        "very_active": 1.9,
    }
    factor = factor_map.get(activity_level or "sedentary", 1.2)
    return round(bmr, 0), round(bmr * factor, 0)


def _resolve_child_age_months(payload: AssessmentInput) -> Optional[int]:
    if payload.patient_group in {"infant", "toddler"}:
        return payload.age_months
    if payload.patient_group == "child_adolescent":
        if payload.age_months is not None:
            return payload.age_months
        if payload.age_years is not None:
            return payload.age_years * 12
    return None


def _pick_child_file(prefix: str, sex: Sex, variant: str) -> str:
    sex_label = "boys" if sex == "male" else "girls"
    return f"{prefix}_{sex_label}_{variant}.xlsx"


def _read_age_indicator(
    prefix: str,
    sex: Sex,
    variant: str,
    age_months: Optional[int],
    value: Optional[float],
) -> Tuple[Optional[float], Optional[str]]:
    if age_months is None or value is None:
        return None, None
    table = load_who_table(_pick_child_file(prefix, sex, variant))
    reference = table.nearest_row(float(age_months))
    if reference is None:
        return None, None
    return compute_zscore(value, reference), table.filename


def _read_size_indicator(
    prefix: str,
    sex: Sex,
    variant: str,
    stature_cm: Optional[float],
    value: Optional[float],
) -> Tuple[Optional[float], Optional[str]]:
    if stature_cm is None or value is None:
        return None, None
    table = load_who_table(_pick_child_file(prefix, sex, variant))
    reference = table.nearest_row(float(stature_cm))
    if reference is None:
        return None, None
    return compute_zscore(value, reference), table.filename


def _classify_weight_for_age(z_score: float) -> str:
    if z_score < -3:
        return "Gizi buruk berat badan menurut umur (severe underweight)"
    if z_score < -2:
        return "Gizi kurang berat badan menurut umur (underweight)"
    if z_score > 2:
        return "Berat badan di atas kisaran umur"
    return "Normal"


def _classify_height_for_age(z_score: float) -> str:
    if z_score < -3:
        return "Stunting berat"
    if z_score < -2:
        return "Stunting"
    if z_score > 3:
        return "Tinggi di atas kisaran umur"
    return "Normal"


def _classify_weight_for_height(z_score: float) -> str:
    if z_score < -3:
        return "Gizi buruk / severe wasting"
    if z_score < -2:
        return "Gizi kurang / wasting"
    if z_score > 3:
        return "Obesitas"
    if z_score > 2:
        return "Overweight"
    return "Normal"


def _classify_bmi_for_age(z_score: float, age_months: Optional[int]) -> str:
    if z_score < -3:
        return "Gizi buruk / severe thinness"
    if z_score < -2:
        return "Gizi kurang / thinness"
    if age_months is not None and age_months <= 60:
        if z_score > 3:
            return "Obesitas"
        if z_score > 2:
            return "Overweight"
        if z_score > 1:
            return "Risiko overweight"
        return "Normal"
    if z_score > 2:
        return "Obesitas"
    if z_score > 1:
        return "Overweight"
    return "Normal"


def _classify_head_circumference(z_score: float) -> str:
    if z_score < -3:
        return "Mikrosefali berat"
    if z_score < -2:
        return "Mikrosefali"
    if z_score > 3:
        return "Makrosefali berat"
    if z_score > 2:
        return "Makrosefali"
    return "Dalam kisaran normal"


def _child_status_summary(statuses: list[str]) -> str:
    abnormalities = [
        item
        for item in statuses
        if " Normal " not in f" {item} " and "Dalam kisaran normal" not in item
    ]
    if abnormalities:
        return "Status gizi anak menunjukkan: " + "; ".join(abnormalities) + "."
    return "Parameter pertumbuhan utama berada dalam kisaran normal menurut referensi WHO yang tersedia."


def _round_target(value: float | None) -> int | None:
    if value is None:
        return None
    return int(round(value))


def _extract_ckd_stage(conditions_text: str) -> Optional[int]:
    for stage in range(1, 6):
        if f"stage {stage}" in conditions_text or f"stadium {stage}" in conditions_text:
            return stage
    return None


def _build_growth_chart(
    title: str,
    table_filename: str,
    x_value: float,
    patient_y: float,
    x_label: str,
    y_label: str,
    window_size: int = 9,
) -> Optional[dict]:
    table = load_who_table(table_filename)
    if not table.rows:
        return None
    nearest_index = min(range(len(table.rows)), key=lambda index: abs(table.rows[index].key - x_value))
    start = max(nearest_index - window_size // 2, 0)
    end = min(start + window_size, len(table.rows))
    start = max(end - window_size, 0)
    points = []
    for row in table.rows[start:end]:
        points.append(
            {
                "x": round(row.key, 2),
                "sd_minus_3": row.extra_values.get("SD3neg"),
                "sd_minus_2": row.extra_values.get("SD2neg"),
                "median": row.extra_values.get("SD0"),
                "sd_plus_2": row.extra_values.get("SD2"),
                "sd_plus_3": row.extra_values.get("SD3"),
            }
        )
    return {
        "title": title,
        "x_label": x_label,
        "y_label": y_label,
        "patient_point": {"x": round(x_value, 2), "y": round(patient_y, 2)},
        "reference_points": points,
    }


def _build_soap_note(
    payload: AssessmentInput,
    status_summary: str,
    metrics: dict,
    risk_flags: list[str],
    recommendations: list[str],
    monitoring_plan: list[str],
) -> dict:
    subjective_parts = []
    if payload.medical_conditions:
        subjective_parts.append(f"Kondisi medis dicatat: {payload.medical_conditions}.")
    if payload.clinical_context:
        subjective_parts.append(f"Konteks klinis: {payload.clinical_context}.")
    if payload.recent_weight_loss:
        subjective_parts.append("Ada riwayat penurunan berat badan.")
    if payload.patient_group == "pregnant" and payload.gestational_age_weeks:
        subjective_parts.append(f"Kehamilan {payload.gestational_age_weeks} minggu ({payload.pregnancy_trimester or 'trimester belum dicatat'}).")
    if payload.patient_group == "lactating" and payload.breastfeeding_child_age_months is not None:
        subjective_parts.append(f"Ibu menyusui dengan usia anak {payload.breastfeeding_child_age_months} bulan.")

    objective_parts = []
    for key in [
        "bmi",
        "bmi_classification",
        "muac_cm",
        "waist_cm",
        "weight_for_age_status",
        "height_for_age_status",
        "weight_for_height_status",
        "bmi_for_age_status",
        "head_circumference_status",
        "gestational_weight_gain_kg",
    ]:
        if key in metrics:
            objective_parts.append(f"{key}={metrics[key]}")
    if risk_flags:
        objective_parts.append("Red flags: " + "; ".join(risk_flags))

    assessment_parts = [status_summary]
    if payload.patient_group == "elderly":
        assessment_parts.append("Kelompok lansia memerlukan perhatian pada risiko malnutrisi, kehilangan massa otot, dan hidrasi.")
    if payload.patient_group == "pregnant":
        assessment_parts.append("Interpretasi kehamilan mempertimbangkan LILA, trimester, dan kenaikan berat badan.")

    return {
        "subjective": " ".join(subjective_parts) or "Data subjektif utama belum lengkap.",
        "objective": ". ".join(objective_parts) or "Data objektif utama belum lengkap.",
        "assessment": " ".join(assessment_parts),
        "plan": " ".join(recommendations[:4] + monitoring_plan[:2]) or "Lanjutkan pemantauan dan sesuaikan intervensi klinis.",
    }


def _build_icd10_codes(payload: AssessmentInput, metrics: dict, risk_flags: list[str]) -> list[dict]:
    conditions_text = (payload.medical_conditions or "").lower()
    codes: list[dict] = []

    def add_code(code: str, label: str, reason: str) -> None:
        if not any(item["code"] == code for item in codes):
            codes.append({"code": code, "label": label, "reason": reason})

    bmi_class = str(metrics.get("bmi_classification", ""))
    if bmi_class == "Obesitas" or "Obesitas" in str(metrics.get("bmi_for_age_status", "")):
        add_code("E66.9", "Obesity, unspecified", "Antropometri menunjukkan obesitas/overweight bermakna.")
    if any(term in str(metrics.get("weight_for_height_status", "")) for term in ["Gizi buruk", "Gizi kurang"]) or any(
        term in str(metrics.get("bmi_for_age_status", "")) for term in ["Gizi buruk", "Gizi kurang"]
    ):
        add_code("E46", "Unspecified protein-calorie malnutrition", "Antropometri anak mengarah ke malnutrisi.")
    if "Stunting" in str(metrics.get("height_for_age_status", "")):
        add_code("R62.8", "Other lack of expected normal physiological development", "TB/U mengarah ke stunting/perawakan pendek kronis.")
    if "hipertensi" in conditions_text:
        add_code("I10", "Essential (primary) hypertension", "Riwayat/diagnosis hipertensi dicatat.")
    if "diabetes" in conditions_text or "dm" in conditions_text:
        add_code("E11.9", "Type 2 diabetes mellitus without complications", "Riwayat/diagnosis diabetes dicatat.")
    if "ckd" in conditions_text or "ginjal" in conditions_text:
        stage = _extract_ckd_stage(conditions_text)
        stage_map = {1: "N18.1", 2: "N18.2", 3: "N18.3", 4: "N18.4", 5: "N18.5"}
        add_code(stage_map.get(stage, "N18.9"), "Chronic kidney disease", "Riwayat/diagnosis CKD dicatat.")
    if payload.patient_group == "pregnant":
        add_code("Z34.9", "Supervision of normal pregnancy, unspecified", "Kehamilan memerlukan pemantauan nutrisi dan antenatal.")
        if any("KEK" in flag for flag in risk_flags):
            add_code("O99.8", "Other specified diseases and conditions complicating pregnancy", "Ada risiko KEK/LILA rendah pada kehamilan.")
    if payload.patient_group == "elderly" and payload.muac_cm is not None and payload.muac_cm < 23.5:
        add_code("E46", "Unspecified protein-calorie malnutrition", "LILA rendah pada lansia mengarah ke risiko malnutrisi.")

    return codes


def _build_report_profile(payload: AssessmentInput, status_summary: str) -> dict:
    templates = {
        "infant": {
            "title": "Laporan Klinis Bayi",
            "focus": ["Pertumbuhan serial", "ASI/MPASI", "Lingkar kepala", "Tanda infeksi / red flag"],
        },
        "toddler": {
            "title": "Laporan Klinis Balita",
            "focus": ["Status BB/U, TB/U, BB/TB", "Pola makan keluarga", "Perkembangan dan infeksi berulang"],
        },
        "pregnant": {
            "title": "Laporan Klinis Ibu Hamil",
            "focus": ["Trimester", "LILA", "Kenaikan BB", "Risiko KEK / hipertensi / DM gestasional"],
        },
        "elderly": {
            "title": "Laporan Klinis Lansia",
            "focus": ["IMT dan LILA", "Penurunan BB", "Hidrasi", "Fungsi makan dan komorbid"],
        },
    }
    template = templates.get(payload.patient_group, {"title": "Laporan Klinis Umum", "focus": ["Status gizi", "Kondisi klinis", "Rencana tindak lanjut"]})
    return {
        "title": template["title"],
        "focus": template["focus"],
        "summary": status_summary,
    }


def _build_nutrition_targets(payload: AssessmentInput, metrics: dict) -> Tuple[dict, list[str]]:
    conditions_text = (payload.medical_conditions or "").lower()
    goal_text = (payload.goal or "").lower()
    ckd_stage = _extract_ckd_stage(conditions_text)
    notes: list[str] = []
    weight = payload.weight_kg
    calorie_target: Optional[float] = None
    protein_g: Optional[float] = None
    carbs_g: Optional[float] = None
    fat_g: Optional[float] = None
    sodium_mg: Optional[int] = None
    fluid_ml: Optional[int] = None

    if payload.patient_group in {"adult", "elderly"}:
        estimated_energy = metrics.get("estimated_energy_kcal")
        if isinstance(estimated_energy, (int, float)):
            calorie_target = float(estimated_energy)

        if calorie_target is None and weight is not None:
            calorie_target = 25 * weight

        if weight is not None:
            protein_factor = 0.8
            if payload.patient_group == "elderly":
                protein_factor = 1.0
            if any(flag in conditions_text for flag in ["ckd", "ginjal"]):
                protein_factor = 0.8 if ckd_stage in {1, 2, None} else 0.6
                notes.append("Protein diturunkan karena ada gangguan ginjal / CKD.")
            elif any(goal in conditions_text for goal in ["obes", "diabetes"]):
                protein_factor = 1.0
            protein_g = weight * protein_factor

        sodium_mg = 1500 if any(flag in conditions_text for flag in ["hipertensi", "heart", "jantung", "cardio"]) else 2000
        if any(flag in conditions_text for flag in ["ckd", "ginjal"]):
            sodium_mg = min(sodium_mg, 1500)

        if weight is not None:
            fluid_ml = int(weight * 30)
            if payload.patient_group == "elderly":
                fluid_ml = int(weight * 25)
            if any(flag in conditions_text for flag in ["ckd", "ginjal"]) and ckd_stage in {4, 5}:
                fluid_ml = int(weight * 25)
                notes.append("Cairan dibuat lebih konservatif karena CKD stadium lanjut memerlukan individualisasi lebih ketat.")
        else:
            fluid_ml = 2000

    elif payload.patient_group == "pregnant":
        estimated_energy = metrics.get("estimated_energy_kcal")
        base_energy = float(estimated_energy) if isinstance(estimated_energy, (int, float)) else (30 * weight if weight else None)
        trimester_extra = {"first": 0, "second": 340, "third": 452}
        calorie_target = (base_energy or 0) + trimester_extra.get(payload.pregnancy_trimester or "first", 0) if base_energy is not None else None
        if weight is not None:
            trimester_protein_factor = {"first": 1.0, "second": 1.1, "third": 1.2}
            protein_g = weight * trimester_protein_factor.get(payload.pregnancy_trimester or "first", 1.1)
            fluid_ml = int(weight * 30) + 300
        sodium_mg = 2000
        notes.append("Tambahan energi dan protein kehamilan mengikuti pendekatan trimester umum dari panduan antenatal dan praktik AKG.")

    elif payload.patient_group == "lactating":
        estimated_energy = metrics.get("estimated_energy_kcal")
        base_energy = float(estimated_energy) if isinstance(estimated_energy, (int, float)) else (30 * weight if weight else None)
        lactation_extra = 500 if payload.breastfeeding_exclusive else 330
        calorie_target = (base_energy or 0) + lactation_extra if base_energy is not None else None
        if weight is not None:
            protein_g = weight * 1.2
            fluid_ml = int(weight * 35) + 700
        sodium_mg = 2000
        notes.append("Tambahan energi menyusui disesuaikan untuk masa ASI eksklusif atau menyusui lanjutan.")

    elif payload.patient_group in {"infant", "toddler", "child_adolescent"}:
        child_age_months = _resolve_child_age_months(payload)
        if weight is not None:
            if payload.patient_group == "infant":
                calorie_target = weight * 95
                protein_g = weight * 1.5
            elif payload.patient_group == "toddler":
                calorie_target = weight * 85
                protein_g = weight * 1.2
            else:
                years = (child_age_months or 0) / 12
                calorie_target = weight * (70 if years < 10 else 45)
                protein_g = weight * (1.0 if years >= 10 else 1.1)
            fluid_ml = 1500
            if child_age_months is not None:
                if child_age_months <= 10:
                    fluid_ml = int(weight * 100)
                elif child_age_months <= 20:
                    fluid_ml = int(1000 + (weight - 10) * 50)
                else:
                    fluid_ml = int(1500 + max(weight - 20, 0) * 20)
        sodium_mg = 1200 if payload.patient_group == "child_adolescent" else 1000
        notes.append("Target anak ini adalah estimasi awal untuk skrining dan edukasi; penyesuaian klinis tetap diperlukan.")

    if calorie_target is not None:
        if "weight loss" in goal_text:
            calorie_target -= 300
        elif "weight gain" in goal_text:
            calorie_target += 300

    if calorie_target is not None:
        if protein_g is None and weight is not None:
            protein_g = weight * 0.8
        protein_kcal = (protein_g or 0) * 4
        if any(flag in conditions_text for flag in ["diabetes", "dm"]):
            carb_ratio = 0.4
            notes.append("Karbohidrat dibuat lebih terkontrol karena ada diabetes / DM.")
        elif payload.patient_group in {"pregnant", "lactating"}:
            carb_ratio = 0.5
        else:
            carb_ratio = 0.5
        fat_ratio = 0.3
        if any(flag in conditions_text for flag in ["dyslip", "jantung", "heart", "cardio"]):
            fat_ratio = 0.25
            notes.append("Lemak dibuat lebih konservatif karena ada risiko kardiometabolik.")
        if any(flag in conditions_text for flag in ["hipertensi"]):
            notes.append("Natrium dibatasi lebih ketat karena ada hipertensi.")
        remaining_kcal = max(calorie_target - protein_kcal, 0)
        carbs_g = (remaining_kcal * carb_ratio) / 4
        fat_g = (remaining_kcal * fat_ratio) / 9

    targets = {
        "calorie_target_kcal": _round_target(calorie_target),
        "protein_g": _round_target(protein_g),
        "carbs_g": _round_target(carbs_g),
        "fat_g": _round_target(fat_g),
        "sodium_mg": sodium_mg,
        "fluid_ml": fluid_ml,
    }
    return targets, notes


def _build_disease_diet_rules(payload: AssessmentInput, nutrition_targets: dict) -> list[str]:
    conditions_text = (payload.medical_conditions or "").lower()
    ckd_stage = _extract_ckd_stage(conditions_text)
    rules: list[str] = []

    if "ckd" in conditions_text or "ginjal" in conditions_text:
        if ckd_stage in {1, 2, None}:
            rules.append(
                f"CKD stadium awal: protein awal sekitar {nutrition_targets.get('protein_g', '-')} g/hari, natrium dibatasi, dan cairan perlu disesuaikan dengan kondisi klinis."
            )
        elif ckd_stage == 3:
            rules.append(
                f"CKD stadium 3: protein dibuat lebih konservatif sekitar {nutrition_targets.get('protein_g', '-')} g/hari; evaluasi natrium, cairan, dan monitor kalium/fosfor."
            )
        else:
            rules.append(
                "CKD stadium lanjut: pembatasan protein, natrium, cairan, kalium, dan fosfor harus lebih individual dan sebaiknya dikonfirmasi dengan tenaga medis/gizi."
            )

    if "diabetes" in conditions_text or "dm" in conditions_text:
        rules.append(
            f"DM: karbohidrat awal dikontrol sekitar {nutrition_targets.get('carbs_g', '-')} g/hari dengan pembagian merata, pilih sumber ber-GI lebih rendah, dan hindari gula sederhana berlebih."
        )

    if "hipertensi" in conditions_text:
        rules.append(
            f"Hipertensi: natrium awal dibatasi sekitar {nutrition_targets.get('sodium_mg', '-')} mg/hari, utamakan masak segar dan batasi makanan ultra-proses."
        )

    if "dyslip" in conditions_text:
        rules.append(
            "Dislipidemia: prioritaskan lemak tak jenuh, kurangi gorengan/santan pekat, dan tingkatkan serat larut dari oat, kacang, sayur, dan buah yang sesuai kondisi."
        )

    if "gout" in conditions_text or "asam urat" in conditions_text:
        rules.append(
            "Gout/asam urat: hindari jeroan, kaldu daging pekat, sarden/ikan tinggi purin tertentu, batasi gorengan, dan optimalkan hidrasi bila tidak ada kontraindikasi."
        )

    if payload.patient_group == "pregnant":
        trimester = payload.pregnancy_trimester or "trimester belum dicatat"
        rules.append(
            f"Kehamilan {trimester}: energi dan protein ditambah bertahap sesuai trimester, dengan fokus kecukupan zat besi, folat, protein, dan pemantauan kenaikan berat badan."
        )

    return rules


@router.post("/analyze", response_model=AssessmentOutput)
def analyze_status_gizi(payload: AssessmentInput) -> AssessmentOutput:
    metrics: dict = {}
    nutrition_targets: dict = {}
    growth_charts: list[dict] = []
    risk_flags: list[str] = []
    recommendations: list[str] = []
    monitoring_plan: list[str] = []
    guideline_notes: list[str] = []
    status_summary = "Penilaian awal belum lengkap."

    current_length_or_height = payload.height_cm or payload.length_cm
    bmi = _bmi(payload.weight_kg, payload.height_cm)
    bmr, tdee = _adult_energy_estimate(
        payload.weight_kg, payload.height_cm, payload.age_years, payload.sex, payload.activity_level
    )

    if payload.muac_cm is not None:
        metrics["muac_cm"] = payload.muac_cm
    if payload.waist_cm is not None:
        metrics["waist_cm"] = payload.waist_cm

    if payload.patient_group in {"adult", "elderly"}:
        if bmi is not None:
            metrics["bmi"] = bmi
            metrics["bmi_classification"] = _adult_bmi_classification(bmi)
        if bmr is not None:
            metrics["bmr_kcal"] = bmr
            metrics["estimated_energy_kcal"] = tdee
        if bmi is not None:
            status_summary = f"Status gizi dewasa berdasarkan IMT: {metrics['bmi_classification']} (IMT {bmi})."
        if payload.waist_cm is not None:
            central = (payload.sex == "male" and payload.waist_cm >= 90) or (payload.sex == "female" and payload.waist_cm >= 80)
            if central:
                risk_flags.append("Obesitas sentral berdasarkan lingkar perut.")
        if payload.muac_cm is not None and payload.muac_cm < 23.5:
            risk_flags.append("LILA rendah, pertimbangkan skrining malnutrisi lebih lanjut.")
        if payload.recent_weight_loss:
            risk_flags.append("Ada riwayat penurunan berat badan, evaluasi risiko malnutrisi.")
        recommendations.extend(
            [
                "Gunakan hasil IMT, lingkar perut, dan riwayat penurunan BB sebagai dasar skrining awal.",
                "Lakukan pemantauan berkala berat badan, lingkar perut, dan asupan makan.",
            ]
        )
        if tdee:
            recommendations.append(f"Estimasi kebutuhan energi harian awal sekitar {int(tdee)} kkal/hari, sesuaikan dengan kondisi klinis.")
        monitoring_plan.extend(
            [
                "Pantau berat badan dan lingkar perut pada setiap kunjungan.",
                "Tambahkan penilaian pola makan, aktivitas, dan komorbid metabolik.",
            ]
        )
        guideline_notes.extend(
            [
                "WHO Fact Sheet Obesity and Overweight, 8 Desember 2025.",
                "Untuk populasi Asia, aplikasi ini memakai cut-off IMT 18.5, 23, dan 25 seperti yang Anda minta untuk praktik lokal.",
            ]
        )

    elif payload.patient_group == "pregnant":
        if bmi is not None:
            metrics["bmi"] = bmi
            metrics["bmi_classification"] = _adult_bmi_classification(bmi)
        if bmr is not None:
            metrics["bmr_kcal"] = bmr
            metrics["estimated_energy_kcal"] = tdee
        status_summary = "Penilaian gizi kehamilan memprioritaskan IMT, LILA, kenaikan berat badan, dan konteks trimester."
        if payload.sex != "female":
            risk_flags.append("Input kehamilan idealnya menggunakan jenis kelamin perempuan.")
        if payload.muac_cm is not None and payload.muac_cm < 23.5:
            risk_flags.append("LILA < 23,5 cm: risiko KEK pada ibu hamil.")
        if payload.pre_pregnancy_weight_kg and payload.weight_kg:
            metrics["gestational_weight_gain_kg"] = round(payload.weight_kg - payload.pre_pregnancy_weight_kg, 2)
        if payload.pregnancy_trimester == "second":
            recommendations.append("Trimester 2: pertimbangkan tambahan energi dan protein secara bertahap sesuai status gizi ibu.")
        if payload.pregnancy_trimester == "third":
            recommendations.append("Trimester 3: pemantauan kenaikan berat badan, edema, tekanan darah, dan asupan protein perlu lebih ketat.")
        recommendations.extend(
            [
                "Gunakan IMT pra-hamil, LILA, dan kenaikan berat badan selama kehamilan sebagai dasar interpretasi.",
                "Pastikan pemantauan tekanan darah, edema, Hb, dan asupan energi/protein terintegrasi.",
                "Jadwalkan tindak lanjut sesuai trimester dan kondisi klinis.",
            ]
        )
        monitoring_plan.extend(
            [
                "Pantau berat badan ibu, LILA, tekanan darah, dan gejala klinis setiap kunjungan.",
                "Tinjau ulang target energi, protein, cairan, dan edukasi makan sesuai trimester.",
            ]
        )
        guideline_notes.extend(
            [
                "WHO antenatal care: delapan kontak selama kehamilan untuk pengalaman kehamilan yang positif.",
                "Kemenkes/BKPK: LILA <23,5 cm pada ibu hamil menunjukkan risiko KEK.",
            ]
        )

    elif payload.patient_group == "lactating":
        if bmi is not None:
            metrics["bmi"] = bmi
            metrics["bmi_classification"] = _adult_bmi_classification(bmi)
        if bmr is not None:
            metrics["bmr_kcal"] = bmr
            metrics["estimated_energy_kcal"] = tdee
        status_summary = "Penilaian ibu menyusui memadukan status gizi ibu dengan dukungan laktasi dan kebutuhan nutrisi tambahan."
        if payload.sex != "female":
            risk_flags.append("Input menyusui idealnya menggunakan jenis kelamin perempuan.")
        recommendations.extend(
            [
                "Pertahankan asupan energi, protein, cairan, dan pola makan seimbang selama masa menyusui.",
                "Dukung menyusui eksklusif 6 bulan bila memungkinkan, lalu lanjutkan hingga 2 tahun atau lebih dengan MPASI sesuai usia anak.",
            ]
        )
        if payload.breastfeeding_exclusive:
            recommendations.append("Status menyusui eksklusif tercatat: pertahankan dukungan ASI eksklusif sampai 6 bulan.")
        monitoring_plan.extend(
            [
                "Pantau status gizi ibu, berat badan, hidrasi, dan kondisi menyusui.",
                "Pantau usia anak dan kebutuhan dukungan menyusui lanjutan.",
            ]
        )
        guideline_notes.extend(
            [
                "WHO breastfeeding: ASI eksklusif 6 bulan, lanjutkan sampai 2 tahun atau lebih dengan MPASI.",
            ]
        )

    elif payload.patient_group in {"infant", "toddler", "child_adolescent"}:
        child_age_months = _resolve_child_age_months(payload)
        stature_cm = payload.length_cm if payload.patient_group in {"infant", "toddler"} else payload.height_cm
        child_statuses: list[str] = []
        used_tables: list[str] = []
        has_stunting = False
        has_wasting = False
        has_overweight = False

        if payload.edema:
            risk_flags.append("Edema bilateral: red flag gizi buruk, perlu evaluasi/rujukan segera.")
        if payload.muac_cm is not None:
            if payload.muac_cm < 11.5:
                risk_flags.append("MUAC <11,5 cm: severe acute malnutrition / gizi buruk.")
            elif payload.muac_cm < 12.5:
                risk_flags.append("MUAC 11,5–12,5 cm: risiko gizi kurang / wasting.")
        if payload.patient_group in {"infant", "toddler"} and payload.head_circumference_cm is not None:
            metrics["head_circumference_cm"] = payload.head_circumference_cm

        if child_age_months is not None and payload.weight_kg is not None:
            if child_age_months <= 60:
                weight_age_z, table_name = _read_age_indicator("wfa", payload.sex, "0_5_zscores", child_age_months, payload.weight_kg)
            elif child_age_months <= 120:
                weight_age_z, table_name = _read_age_indicator("wfa", payload.sex, "5_10_zscores", child_age_months, payload.weight_kg)
            else:
                weight_age_z, table_name = None, None
            if weight_age_z is not None:
                metrics["weight_for_age_zscore"] = weight_age_z
                metrics["weight_for_age_status"] = _classify_weight_for_age(weight_age_z)
                child_statuses.append(f"BB/U {metrics['weight_for_age_status']} ({weight_age_z} SD)")
                if table_name:
                    chart = _build_growth_chart("Growth Chart BB/U", table_name, float(child_age_months), float(payload.weight_kg), "Usia (bulan)", "Berat (kg)")
                    if chart:
                        growth_charts.append(chart)
            if table_name:
                used_tables.append(table_name)

        if child_age_months is not None and stature_cm is not None:
            if child_age_months <= 24:
                stature_age_z, table_name = _read_age_indicator("lhfa", payload.sex, "0_2_zscores", child_age_months, stature_cm)
            elif child_age_months <= 60:
                stature_age_z, table_name = _read_age_indicator("lhfa", payload.sex, "2_5_zscores", child_age_months, stature_cm)
            else:
                stature_age_z, table_name = _read_age_indicator("hfa", payload.sex, "5_19_zscores", child_age_months, stature_cm)
            if stature_age_z is not None:
                metrics["height_for_age_zscore"] = stature_age_z
                metrics["height_for_age_status"] = _classify_height_for_age(stature_age_z)
                child_statuses.append(f"TB/U {metrics['height_for_age_status']} ({stature_age_z} SD)")
                has_stunting = "Stunting" in str(metrics["height_for_age_status"])
                if table_name:
                    chart = _build_growth_chart("Growth Chart TB/U", table_name, float(child_age_months), float(stature_cm), "Usia (bulan)", "Panjang/Tinggi (cm)")
                    if chart:
                        growth_charts.append(chart)
            if table_name:
                used_tables.append(table_name)

        if payload.weight_kg is not None and stature_cm is not None:
            if payload.patient_group in {"infant", "toddler"} and child_age_months is not None and child_age_months <= 24:
                weight_length_z, table_name = _read_size_indicator("wfl", payload.sex, "0_2_zscores", stature_cm, payload.weight_kg)
            elif payload.patient_group in {"infant", "toddler"} and child_age_months is not None and child_age_months <= 60:
                weight_length_z, table_name = _read_size_indicator("wfh", payload.sex, "2_5_zscores", stature_cm, payload.weight_kg)
            else:
                weight_length_z, table_name = None, None
            if weight_length_z is not None:
                metrics["weight_for_height_zscore"] = weight_length_z
                metrics["weight_for_height_status"] = _classify_weight_for_height(weight_length_z)
                child_statuses.append(f"BB/TB {metrics['weight_for_height_status']} ({weight_length_z} SD)")
                status_text = str(metrics["weight_for_height_status"])
                has_wasting = "wasting" in status_text.lower() or "Gizi kurang" in status_text or "Gizi buruk" in status_text
                has_overweight = "Overweight" in status_text or "Obesitas" in status_text
            if table_name:
                used_tables.append(table_name)

        if bmi is not None and child_age_months is not None:
            metrics["bmi"] = bmi
            if child_age_months <= 24:
                bmi_age_z, table_name = _read_age_indicator("bmi", payload.sex, "0_2_zscores", child_age_months, bmi)
            elif child_age_months <= 60:
                bmi_age_z, table_name = _read_age_indicator("bmi", payload.sex, "2_5_zscores", child_age_months, bmi)
            else:
                bmi_age_z, table_name = _read_age_indicator("bmi", payload.sex, "5_19_zscores", child_age_months, bmi)
            if bmi_age_z is not None:
                metrics["bmi_for_age_zscore"] = bmi_age_z
                metrics["bmi_for_age_status"] = _classify_bmi_for_age(bmi_age_z, child_age_months)
                child_statuses.append(f"IMT/U {metrics['bmi_for_age_status']} ({bmi_age_z} SD)")
                status_text = str(metrics["bmi_for_age_status"])
                has_wasting = has_wasting or "thinness" in status_text.lower() or "Gizi kurang" in status_text or "Gizi buruk" in status_text
                has_overweight = has_overweight or "Overweight" in status_text or "Obesitas" in status_text
                if table_name:
                    chart = _build_growth_chart("Growth Chart IMT/U", table_name, float(child_age_months), float(bmi), "Usia (bulan)", "IMT")
                    if chart:
                        growth_charts.append(chart)
            if table_name:
                used_tables.append(table_name)

        if payload.patient_group in {"infant", "toddler"} and payload.head_circumference_cm is not None and child_age_months is not None:
            head_z, table_name = _read_age_indicator("hcfa", payload.sex, "0_5_zscores", child_age_months, payload.head_circumference_cm)
            if head_z is not None:
                metrics["head_circumference_for_age_zscore"] = head_z
                metrics["head_circumference_status"] = _classify_head_circumference(head_z)
                child_statuses.append(f"Lingkar kepala/U {metrics['head_circumference_status']} ({head_z} SD)")
                if table_name:
                    chart = _build_growth_chart(
                        "Growth Chart Lingkar Kepala/U",
                        table_name,
                        float(child_age_months),
                        float(payload.head_circumference_cm),
                        "Usia (bulan)",
                        "Lingkar kepala (cm)",
                    )
                    if chart:
                        growth_charts.append(chart)
            if table_name:
                used_tables.append(table_name)

        if child_age_months is not None:
            metrics["age_months_resolved"] = child_age_months
        if payload.patient_group == "child_adolescent" and child_age_months is not None:
            metrics["age_years_approx"] = round(child_age_months / 12, 1)

        status_summary = _child_status_summary(child_statuses)
        recommendations.extend(
            [
                "Gunakan growth chart WHO dan plot serial pada setiap kunjungan untuk melihat tren pertumbuhan, bukan hanya satu titik data.",
                "Pantau berat, panjang/tinggi, MUAC, dan lingkar kepala sesuai kelompok usia.",
            ]
        )
        if has_stunting:
            recommendations.append("Temuan mengarah ke stunting: evaluasi riwayat asupan jangka panjang, infeksi berulang, dan lingkungan tumbuh kembang.")
        if has_wasting:
            recommendations.append("Temuan mengarah ke wasting/gizi kurang: nilai asupan akut, penyakit infeksi, dehidrasi, dan kebutuhan rujukan.")
        if has_overweight:
            recommendations.append("Temuan mengarah ke overweight/obesitas: lakukan edukasi makan keluarga, kualitas camilan, screen time, dan aktivitas fisik sesuai usia.")
        if payload.edema or (payload.muac_cm is not None and payload.muac_cm < 11.5):
            recommendations.append("Karena ada red flag berat, prioritaskan evaluasi klinis dan rujukan segera sesuai protokol gizi buruk.")
        monitoring_plan.extend(
            [
                "Plot pertumbuhan pada setiap kunjungan.",
                "Tinjau riwayat asupan, penyakit infeksi, dan perkembangan anak.",
            ]
        )
        guideline_notes.extend(
            [
                "WHO Child Growth Standards 2006 untuk 0–5 tahun.",
                "WHO Growth Reference 2007 untuk 5–19 tahun.",
                "MUAC <11,5 cm dan edema bilateral merupakan red flag penting untuk severe acute malnutrition.",
            ]
        )
        if used_tables:
            guideline_notes.append("Tabel WHO yang dipakai: " + ", ".join(sorted(set(used_tables))) + ".")

    if payload.medical_conditions:
        recommendations.append(f"Kondisi medis yang dicatat: {payload.medical_conditions}")
    if payload.clinical_context:
        recommendations.append(f"Konteks klinis tambahan: {payload.clinical_context}")

    if current_length_or_height is not None:
        metrics["stature_cm"] = current_length_or_height

    nutrition_targets, target_notes = _build_nutrition_targets(payload, metrics)
    disease_diet_rules = _build_disease_diet_rules(payload, nutrition_targets)
    if target_notes:
        recommendations.extend(target_notes)
    soap_note = _build_soap_note(payload, status_summary, metrics, risk_flags, recommendations, monitoring_plan)
    icd10_codes = _build_icd10_codes(payload, metrics, risk_flags)
    report_profile = _build_report_profile(payload, status_summary)
    if icd10_codes:
        guideline_notes.append("Kode ICD-10 di aplikasi bersifat pendamping awal dan tetap perlu finalisasi klinis oleh tenaga kesehatan.")

    return AssessmentOutput(
        patient_group=payload.patient_group,
        metrics=metrics,
        nutrition_targets=nutrition_targets,
        disease_diet_rules=disease_diet_rules,
        growth_charts=growth_charts,
        soap_note=soap_note,
        icd10_codes=icd10_codes,
        report_profile=report_profile,
        status_summary=status_summary,
        risk_flags=risk_flags,
        recommendations=recommendations,
        monitoring_plan=monitoring_plan,
        guideline_notes=guideline_notes,
    )

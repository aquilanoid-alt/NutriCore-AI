from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter()


class DailyTrackingInput(BaseModel):
    food_text: str = Field(..., min_length=1)
    calorie_target_kcal: int = 1800
    protein_g: int = 60
    carbs_g: int = 225
    fat_g: int = 60
    goal: str = "Maintenance"


FOOD_LOOKUP = {
    "nasi putih": {"calories": 175, "protein": 3.5, "carbs": 40, "fat": 0.3},
    "nasi merah": {"calories": 149, "protein": 3.0, "carbs": 32, "fat": 1.1},
    "tempe": {"calories": 154, "protein": 14, "carbs": 9, "fat": 8},
    "tempe goreng": {"calories": 220, "protein": 12, "carbs": 10, "fat": 15},
    "tahu": {"calories": 76, "protein": 8, "carbs": 2, "fat": 4.8},
    "ayam": {"calories": 165, "protein": 31, "carbs": 0, "fat": 3.6},
    "ikan": {"calories": 128, "protein": 22, "carbs": 0, "fat": 4},
    "telur": {"calories": 78, "protein": 6.5, "carbs": 0.6, "fat": 5.3},
}


def _match_food(token: str) -> dict | None:
    normalized = token.strip().lower()
    for name, nutrition in FOOD_LOOKUP.items():
        if normalized == name or normalized in name:
            return {"name": name, **nutrition}
    return None


@router.post("/analyze-day")
def analyze_day(payload: DailyTrackingInput) -> dict:
    tokens = [token.strip() for token in payload.food_text.replace(",", "+").split("+") if token.strip()]
    items = []
    totals = {"calories": 0.0, "protein": 0.0, "carbs": 0.0, "fat": 0.0}

    for token in tokens:
        food = _match_food(token)
        if not food:
            items.append({"name": token, "matched": False})
            continue
        items.append({**food, "matched": True})
        for key in totals:
            totals[key] += float(food[key])

    targets = {
        "calories": payload.calorie_target_kcal,
        "protein": payload.protein_g,
        "carbs": payload.carbs_g,
        "fat": payload.fat_g,
    }
    adherence = {
        key: round((totals[key] / targets[key]) * 100, 1) if targets[key] else 0
        for key in totals
    }
    goal_text = payload.goal.lower()
    if "weight loss" in goal_text:
        exercise_text = "Olahraga ringan-sedang 30 menit setelah makan sore atau pagi hari."
        schedule = [
            {"time": "06:30", "activity": "Bangun, minum air, peregangan 5-10 menit"},
            {"time": "07:00", "activity": "Sarapan terarah sesuai target"},
            {"time": "10:00", "activity": "Snack pagi ringan"},
            {"time": "12:30", "activity": "Makan siang"},
            {"time": "15:30", "activity": "Snack sore terkontrol"},
            {"time": "16:30", "activity": "Jalan cepat / sepeda statis ringan 30 menit"},
            {"time": "18:30", "activity": "Makan malam lebih ringan"},
            {"time": "21:00", "activity": "Persiapan tidur, batasi camilan larut malam"},
        ]
    elif "weight gain" in goal_text:
        exercise_text = "Fokus aktivitas ringan dan latihan kekuatan dasar 20-30 menit 3 kali/minggu."
        schedule = [
            {"time": "06:30", "activity": "Bangun dan hidrasi"},
            {"time": "07:00", "activity": "Sarapan padat nutrisi"},
            {"time": "10:00", "activity": "Snack tinggi protein ringan"},
            {"time": "12:30", "activity": "Makan siang utama"},
            {"time": "15:30", "activity": "Snack sore"},
            {"time": "17:00", "activity": "Latihan kekuatan ringan / resistance band 20 menit"},
            {"time": "18:30", "activity": "Makan malam seimbang"},
            {"time": "21:00", "activity": "Snack kecil bila dibutuhkan sesuai target"},
        ]
    else:
        exercise_text = "Olahraga ringan 20-30 menit sesuai toleransi dan kondisi klinis."
        schedule = [
            {"time": "06:30", "activity": "Bangun dan hidrasi"},
            {"time": "07:00", "activity": "Sarapan"},
            {"time": "10:00", "activity": "Snack pagi"},
            {"time": "12:30", "activity": "Makan siang"},
            {"time": "15:30", "activity": "Snack sore"},
            {"time": "17:00", "activity": "Jalan santai / senam ringan 20-30 menit"},
            {"time": "18:30", "activity": "Makan malam"},
            {"time": "21:00", "activity": "Waktu istirahat"},
        ]
    return {
        "items": items,
        "totals": {key: round(value, 1) for key, value in totals.items()},
        "targets": targets,
        "adherence_percent": adherence,
        "exercise_recommendation": exercise_text,
        "daily_schedule": schedule,
    }

from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter()


FOODS = [
    {"name": "nasi putih", "serving_g": 100, "calories": 175, "protein": 3.5, "carbs": 40, "fat": 0.3, "gi": 73},
    {"name": "nasi merah", "serving_g": 100, "calories": 149, "protein": 3.0, "carbs": 32, "fat": 1.1, "gi": 55},
    {"name": "tempe", "serving_g": 80, "calories": 154, "protein": 14, "carbs": 9, "fat": 8, "gi": 15},
    {"name": "tempe goreng", "serving_g": 80, "calories": 220, "protein": 12, "carbs": 10, "fat": 15, "gi": 20},
    {"name": "tahu", "serving_g": 100, "calories": 76, "protein": 8, "carbs": 2, "fat": 4.8, "gi": 15},
    {"name": "ayam dada", "serving_g": 100, "calories": 165, "protein": 31, "carbs": 0, "fat": 3.6, "gi": 0},
    {"name": "ikan", "serving_g": 100, "calories": 128, "protein": 22, "carbs": 0, "fat": 4, "gi": 0},
    {"name": "telur", "serving_g": 55, "calories": 78, "protein": 6.5, "carbs": 0.6, "fat": 5.3, "gi": 0},
    {"name": "brokoli", "serving_g": 100, "calories": 34, "protein": 2.8, "carbs": 7, "fat": 0.4, "gi": 15},
    {"name": "bayam", "serving_g": 100, "calories": 23, "protein": 2.9, "carbs": 3.6, "fat": 0.4, "gi": 15},
    {"name": "pisang", "serving_g": 100, "calories": 89, "protein": 1.1, "carbs": 23, "fat": 0.3, "gi": 51},
    {"name": "oatmeal", "serving_g": 40, "calories": 150, "protein": 5, "carbs": 27, "fat": 3, "gi": 55},
]


class FoodParseInput(BaseModel):
    text: str = Field(..., min_length=1)


def _find_food(term: str) -> dict | None:
    normalized = term.strip().lower()
    for food in FOODS:
        if food["name"] == normalized:
            return food
    for food in FOODS:
        if normalized in food["name"]:
            return food
    return None


@router.get("/search")
def search_foods(q: str = "") -> dict:
    query = q.strip().lower()
    results = [food for food in FOODS if not query or query in food["name"]]
    return {"items": results[:20]}


@router.post("/parse-entry")
def parse_food_entry(payload: FoodParseInput) -> dict:
    tokens = [token.strip() for token in payload.text.replace(",", "+").split("+") if token.strip()]
    parsed_items = []
    totals = {"calories": 0.0, "protein": 0.0, "carbs": 0.0, "fat": 0.0}

    for token in tokens:
        food = _find_food(token)
        if not food:
            parsed_items.append({"query": token, "matched": False})
            continue
        parsed_items.append({**food, "matched": True, "query": token})
        for key in totals:
            totals[key] += float(food[key])

    return {
        "items": parsed_items,
        "totals": {key: round(value, 1) for key, value in totals.items()},
        "recognized_count": sum(1 for item in parsed_items if item.get("matched")),
    }

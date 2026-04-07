from __future__ import annotations

import base64
import re
import subprocess
import tempfile
from pathlib import Path
from io import BytesIO

from PIL import Image


SWIFT_OCR_SCRIPT = Path(__file__).resolve().parent / "vision_ocr.swift"


def _decode_image_data_url(image_data_url: str) -> bytes:
    if "," not in image_data_url:
        raise ValueError("Invalid image data")
    _, encoded = image_data_url.split(",", 1)
    return base64.b64decode(encoded)


def _crop_image_bytes(image_bytes: bytes, crop_left: float, crop_top: float, crop_right: float, crop_bottom: float) -> bytes:
    image = Image.open(BytesIO(image_bytes)).convert("RGBA")
    width, height = image.size
    left = int(width * max(0.0, min(1.0, crop_left)))
    top = int(height * max(0.0, min(1.0, crop_top)))
    right = int(width * max(0.0, min(1.0, crop_right)))
    bottom = int(height * max(0.0, min(1.0, crop_bottom)))
    if right <= left or bottom <= top:
        return image_bytes
    cropped = image.crop((left, top, right, bottom))
    output = BytesIO()
    cropped.save(output, format="PNG")
    return output.getvalue()


def _enhance_image_bytes(image_bytes: bytes, scale: int = 3) -> bytes:
    image = Image.open(BytesIO(image_bytes)).convert("L")
    width, height = image.size
    enlarged = image.resize((max(width * scale, width), max(height * scale, height)), Image.Resampling.LANCZOS)
    output = BytesIO()
    enlarged.save(output, format="PNG")
    return output.getvalue()


def _ocr_image_bytes(image_bytes: bytes) -> str:
    with tempfile.NamedTemporaryFile(suffix=".png", delete=True) as temp_image:
        temp_image.write(image_bytes)
        temp_image.flush()
        result = subprocess.run(
            ["swift", str(SWIFT_OCR_SCRIPT), temp_image.name],
            capture_output=True,
            text=True,
            check=False,
        )
        if result.returncode != 0:
            return ""
        return result.stdout.strip()


def _score_ocr_text(text: str) -> int:
    score = 0
    score += len(text)
    keywords = [
        "informasi nilai gizi",
        "takaran saji",
        "energi total",
        "karbohidrat",
        "gula",
        "natrium",
        "protein",
        "serat",
        "lemak jenuh",
    ]
    lowered = text.lower()
    for keyword in keywords:
        if keyword in lowered:
            score += 80
    score += len(re.findall(r"\d+(?:[.,]\d+)?", text)) * 12
    return score


def _generate_candidate_crops(image_bytes: bytes, crop_left: float, crop_top: float, crop_right: float, crop_bottom: float) -> list[bytes]:
    candidates: list[bytes] = []
    candidates.append(image_bytes)
    candidates.append(_crop_image_bytes(image_bytes, crop_left, crop_top, crop_right, crop_bottom))
    candidates.append(_crop_image_bytes(image_bytes, 0.0, 0.18, 1.0, 1.0))
    candidates.append(_crop_image_bytes(image_bytes, 0.0, 0.05, 1.0, 0.95))
    candidates.append(_crop_image_bytes(image_bytes, 0.15, 0.12, 0.85, 0.95))
    return candidates


def extract_text_from_data_url(
    image_data_url: str,
    crop_left: float = 0.0,
    crop_top: float = 0.0,
    crop_right: float = 1.0,
    crop_bottom: float = 1.0,
) -> str:
    image_bytes = _decode_image_data_url(image_data_url)
    candidates = _generate_candidate_crops(image_bytes, crop_left, crop_top, crop_right, crop_bottom)
    best_text = ""
    best_score = -1
    for candidate in candidates:
        for variant in (candidate, _enhance_image_bytes(candidate)):
            text = _ocr_image_bytes(variant)
            score = _score_ocr_text(text)
            if score > best_score:
                best_score = score
                best_text = text
    if not best_text.strip():
        raise RuntimeError("OCR failed")
    return best_text.strip()


def _find_number(patterns: list[str], text: str) -> float | None:
    for pattern in patterns:
        match = re.search(pattern, text, flags=re.IGNORECASE)
        if match:
            value = match.group(1).replace(",", ".")
            try:
                return float(value)
            except ValueError:
                continue
    return None


def _normalize_ocr_text(text: str) -> str:
    normalized = text.replace("\r", "\n")
    substitutions = {
        "energl": "energi",
        "energii": "energi",
        "takaransaji": "takaran saji",
        "takaransaji": "takaran saji",
        "informasinilaigizi": "informasi nilai gizi",
        "informasi nilaiglzl": "informasi nilai gizi",
        "informasi nilal gizi": "informasi nilai gizi",
        "lemakjenuh": "lemak jenuh",
        "gulatotal": "gula total",
        "seratpangan": "serat pangan",
        "karbohidrattotal": "karbohidrat total",
        "garam(natrium)": "natrium",
    }
    for source, target in substitutions.items():
        normalized = normalized.replace(source, target)
        normalized = normalized.replace(source.upper(), target.upper())
    normalized = re.sub(r"(?<=\d)\s+(?=(?:kkal|kal|mg|g|ml)\b)", "", normalized, flags=re.IGNORECASE)
    normalized = re.sub(r"[ \t]+", " ", normalized)
    return normalized


def _guess_product_name(lines: list[str]) -> str:
    ignored_fragments = (
        "informasi nilai gizi",
        "nutrition facts",
        "nutrition information",
        "jumlah sajian",
        "takaran saji",
        "sajian per kemasan",
        "serving size",
        "energi total",
        "nutrition",
        "akg",
    )
    for raw_line in lines:
        line = raw_line.strip(" :-")
        compact = line.lower()
        if len(line) < 3:
            continue
        if any(fragment in compact for fragment in ignored_fragments):
            continue
        if re.fullmatch(r"[\d\s.,/%]+", line):
            continue
        return line
    return "Produk dari label"


def _find_line_number(lines: list[str], keywords: tuple[str, ...]) -> float | None:
    for line in lines:
        lowered = line.lower()
        if any(keyword in lowered for keyword in keywords):
            match = re.search(r"(\d+(?:[.,]\d+)?)", line)
            if match:
                try:
                    return float(match.group(1).replace(",", "."))
                except ValueError:
                    continue
    return None


def parse_product_label_text(text: str) -> dict:
    compact = _normalize_ocr_text(text)
    lines = [line.strip() for line in compact.splitlines() if line.strip()]
    product_name = _guess_product_name(lines)
    serving_size = _find_number(
        [
            r"(?:takaran saji|serving size|per sajian)\D{0,18}(\d+(?:[.,]\d+)?)\s*(?:g|gr|gram|ml|mL)",
            r"(?:takaran per saji|takaran penyajian)\D{0,18}(\d+(?:[.,]\d+)?)\s*(?:g|gr|gram|ml|mL)",
        ],
        compact,
    )
    calories = _find_number(
        [
            r"(?:energi total|jumlah energi|energy|calories?|kalori total)\D{0,18}(\d+(?:[.,]\d+)?)\s*k?kal",
            r"(?:energi total|jumlah energi|energy|calories?|kalori total)\D{0,18}(\d+(?:[.,]\d+)?)",
        ],
        compact,
    )
    sugar = _find_number(
        [
            r"(?:gula(?: total)?|total sugar|sugars?)\D{0,18}(\d+(?:[.,]\d+)?)\s*g",
            r"(?:gula)\D{0,24}(\d+(?:[.,]\d+)?)",
        ],
        compact,
    )
    carbs = _find_number(
        [
            r"(?:karbohidrat(?: total)?|total carbohydrate|carbohydrate|karbo)\D{0,18}(\d+(?:[.,]\d+)?)\s*g",
        ],
        compact,
    )
    sodium = _find_number(
        [
            r"(?:natrium|sodium|garam)\D{0,18}(\d+(?:[.,]\d+)?)\s*mg",
            r"(?:salt)\D{0,18}(\d+(?:[.,]\d+)?)\s*mg",
        ],
        compact,
    )
    saturated_fat = _find_number(
        [
            r"(?:lemak jenuh|saturated fat|sat fat)\D{0,18}(\d+(?:[.,]\d+)?)\s*g",
        ],
        compact,
    )
    protein = _find_number(
        [
            r"(?:protein)\D{0,18}(\d+(?:[.,]\d+)?)\s*g",
        ],
        compact,
    )
    fiber = _find_number(
        [
            r"(?:serat pangan|serat|dietary fiber|fiber)\D{0,18}(\d+(?:[.,]\d+)?)\s*g",
        ],
        compact,
    )
    if serving_size is None:
        serving_size = _find_line_number(lines, ("takaran saji", "serving size", "per sajian"))
    if calories is None:
        calories = _find_line_number(lines, ("energi total", "jumlah energi", "energy", "calories"))
    if carbs is None:
        carbs = _find_line_number(lines, ("karbohidrat", "carbohydrate", "total carbohydrate"))
    if sugar is None:
        sugar = _find_line_number(lines, ("gula", "sugars", "total sugar"))
    if sodium is None:
        sodium = _find_line_number(lines, ("natrium", "sodium", "garam"))
    if saturated_fat is None:
        saturated_fat = _find_line_number(lines, ("lemak jenuh", "saturated fat", "sat fat"))
    if protein is None:
        protein = _find_line_number(lines, ("protein",))
    if fiber is None:
        fiber = _find_line_number(lines, ("serat", "fiber"))
    extracted_count = sum(value is not None for value in [serving_size, calories, carbs, sugar, sodium, saturated_fat, protein, fiber])
    return {
        "ocr_text": text,
        "product_name": product_name,
        "serving_size_g": serving_size,
        "calories_kcal": calories,
        "carbs_g": carbs,
        "sugar_g": sugar,
        "sodium_mg": sodium,
        "saturated_fat_g": saturated_fat,
        "protein_g": protein,
        "fiber_g": fiber,
        "confidence_label": "tinggi" if extracted_count >= 5 else "sedang" if extracted_count >= 3 else "rendah",
    }

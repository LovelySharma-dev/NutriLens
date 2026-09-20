import re
from typing import Any


NUTRIENT_PATTERNS = {
    "energy": [
        r"\benergy\b",
        r"\bcalories?\b",
        r"\bkcal\b",
    ],
    "fat": [
        r"\btotal\s+fat\b",
        r"(?<!saturated\s)\bfat\b",
    ],
    "saturatedFat": [
        r"\bsaturates?\b",
        r"\bsaturated\s+fat\b",
    ],
    "carbohydrates": [
        r"\bcarbohydrates?\b",
        r"\bcarbs?\b",
    ],
    "sugars": [
        r"\bsugars?\b",
    ],
    "fiber": [
        r"\bfib(?:re|er)\b",
        r"\bdietary\s+fiber\b",
    ],
    "proteins": [
        r"\bproteins?\b",
    ],
    "salt": [
        r"\bsalt\b",
    ],
}


def normalize_text(text: str) -> str:
    text = text.replace("\r\n", "\n")
    text = text.replace("\r", "\n")

    return text


def extract_serving_size(text: str) -> float | None:
    patterns = [
        r"serving\s+size\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*g",
        r"serves?\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*g",
    ]

    for pattern in patterns:
        match = re.search(
            pattern,
            text,
            flags=re.IGNORECASE,
        )

        if match:
            return float(match.group(1))

    return None


def extract_ingredients(text: str) -> list[str]:
    match = re.search(
        r"ingredients?\s*:\s*(.*?)(?=\n(?:allergy|nutrition|storage|$))",
        text,
        flags=re.IGNORECASE | re.DOTALL,
    )

    if not match:
        return []

    raw = match.group(1)

    raw = raw.replace("\n", " ")

    ingredients = re.split(
        r"[,;]",
        raw,
    )

    cleaned = []

    for ingredient in ingredients:
        ingredient = ingredient.strip()

        if ingredient:
            cleaned.append(ingredient)

    return cleaned


def extract_allergens(text: str) -> list[str]:
    known_terms = [
        "milk",
        "soy",
        "wheat",
        "gluten",
        "barley",
        "peanut",
        "mustard",
        "celery",
        "sesame",
        "nuts",
    ]

    lower_text = text.lower()

    detected = []

    for term in known_terms:
        if term in lower_text:
            detected.append(term)

    return detected

def extract_claims(text: str) -> list[str]:
    claim_patterns = [
        r"\bsuitable\s+for\s+vegetarians?\b",
        r"\bvegan\b",
        r"\bvegetarian\b",
        r"\bhigh\s+in\s+protein\b",
        r"\blow\s+fat\b",
        r"\blow\s+sugar\b",
        r"\bno\s+added\s+sugar\b",
        r"\bsource\s+of\s+fiber\b",
        r"\bhigh\s+fiber\b",
        r"\bgluten[-\s]?free\b",
        r"\borganic\b",
        r"\bnatural\b",
    ]

    claims = []

    for pattern in claim_patterns:
        matches = re.findall(
            pattern,
            text,
            flags=re.IGNORECASE,
        )

        for match in matches:
            claim = (
                match
                if isinstance(match, str)
                else match[0]
            )

            claim = claim.strip()

            if claim and claim not in claims:
                claims.append(claim)

    return claims
def extract_nutrition_lines(
    text: str,
) -> dict[str, dict[str, Any]]:
    nutrition: dict[str, dict[str, Any]] = {}

    lines = [
        line.strip()
        for line in text.splitlines()
        if line.strip()
    ]

    for line in lines:
        lower_line = line.lower()

        nutrient_name = None

        for nutrient, patterns in NUTRIENT_PATTERNS.items():
            if any(
                re.search(
                    pattern,
                    lower_line,
                    flags=re.IGNORECASE,
                )
                for pattern in patterns
            ):
                nutrient_name = nutrient
                break

        if nutrient_name is None:
            continue

        value_match = re.search(
            r"(\d+(?:\.\d+)?)\s*(kcal|kj|g|mg)?",
            line,
            flags=re.IGNORECASE,
        )

        if not value_match:
            continue

        value = float(value_match.group(1))
        unit = value_match.group(2) or ""

        nutrition[nutrient_name] = {
            "value": value,
            "unit": unit,
            "sourceText": line,
        }

    return nutrition

def _detection_center_y(detection: dict[str, Any]) -> float:
    box = detection["boundingBox"]
    return sum(point[1] for point in box) / len(box)


def _detection_left_x(detection: dict[str, Any]) -> float:
    box = detection["boundingBox"]
    return min(point[0] for point in box)


def _detection_right_x(detection: dict[str, Any]) -> float:
    box = detection["boundingBox"]
    return max(point[0] for point in box)


def _detection_height(detection: dict[str, Any]) -> float:
    box = detection["boundingBox"]

    ys = [point[1] for point in box]

    return max(ys) - min(ys)

def _is_horizontal_detection(
    detection: dict[str, Any],
) -> bool:
    box = detection["boundingBox"]

    x_values = [point[0] for point in box]
    y_values = [point[1] for point in box]

    width = max(x_values) - min(x_values)
    height = max(y_values) - min(y_values)

    if height == 0:
        return True

    # Nutrition table text is predominantly horizontal.
    # Rotated/diagonal detections have a much different
    # width/height relationship.
    return width >= height * 1.2

def _normalize_nutrient_label(text: str) -> str | None:
    normalized = text.lower().strip()

    # Common OCR variations found in food labels.
    normalized = normalized.replace(":", "")
    normalized = normalized.replace(";", "")

    if re.search(r"\benergy\b|\bcalories?\b|\bkcal\b", normalized):
        return "energy"

    if re.search(r"\bsaturates?\b|\bsaturated\s+fat\b", normalized):
        return "saturatedFat"

    if re.search(
        r"\bcarbohydrates?\b|\bcarbs?\b|sarbochdrate|carbohyd",
        normalized,
    ):
        return "carbohydrates"

    if re.search(r"\bsugars?\b", normalized):
        return "sugars"

    if re.search(r"\bfib(?:re|er)\b|\bdietary\s+fiber\b", normalized):
        return "fiber"

    if re.search(r"\bproteins?\b", normalized):
        return "proteins"

    if re.search(r"\bsalt\b", normalized):
        return "salt"

    if re.fullmatch(r"fat", normalized):
        return "fat"

    if re.search(r"\btotal\s+fat\b", normalized):
        return "fat"

    return None


def _extract_numeric_value(text: str) -> tuple[float, str] | None:
    """
    Extract a numeric value and optional unit from an OCR detection.

    Examples:
        '12.9g' -> (12.9, 'g')
        '1.5g'  -> (1.5, 'g')
        '440 kcal' -> (440, 'kcal')
        '0.35g(6%*)' -> (0.35, 'g')
    """

    # OCR sometimes produces decimal punctuation or extra symbols.
    cleaned = text.strip().replace(",", ".")

    match = re.search(
        r"(\d+(?:\.\d+)?)\s*(kcal|kj|g|mg)?",
        cleaned,
        flags=re.IGNORECASE,
    )

    if not match:
        return None

    try:
        value = float(match.group(1))
    except ValueError:
        return None

    unit = match.group(2) or ""

    return value, unit.lower()


def extract_nutrition_from_detections(
    detections: list[dict[str, Any]],
) -> dict[str, dict[str, Any]]:
    """
    Extract nutrition values using EasyOCR bounding boxes.

    The parser looks for a nutrient label and then searches for a
    numeric detection positioned to the right on approximately the
    same horizontal row.
    """

    nutrition: dict[str, dict[str, Any]] = {}

    nutrient_detections = []
    numeric_detections = []

    for detection in detections:
        text = str(detection.get("text", "")).strip()

        if not text:
            continue

        nutrient_name = _normalize_nutrient_label(text)

        if nutrient_name:
            nutrient_detections.append(
                {
                    **detection,
                    "nutrientName": nutrient_name,
                }
            )

        numeric_value = _extract_numeric_value(text)

        if (
         numeric_value
         and _is_horizontal_detection(detection)
         and _detection_left_x(detection) < 720
        ):
            value, unit = numeric_value

            numeric_detections.append(
                {
                    **detection,
                    "value": value,
                    "unit": unit,
                }
            )

    for nutrient in nutrient_detections:
        nutrient_name = nutrient["nutrientName"]

        nutrient_y = _detection_center_y(nutrient)
        nutrient_right_x = _detection_right_x(nutrient)
        nutrient_height = max(
            _detection_height(nutrient),
            10,
        )

        candidates = []

        for numeric in numeric_detections:
            numeric_y = _detection_center_y(numeric)
            numeric_left_x = _detection_left_x(numeric)

            # Numeric value should normally be to the right.
            if numeric_left_x < nutrient_right_x:
                continue

            # Compare vertical distance.
            vertical_distance = abs(numeric_y - nutrient_y)

            # Allow a reasonable row tolerance based on OCR box height.
            row_tolerance = max(
                nutrient_height * 1.5,
                15,
            )

            if vertical_distance > row_tolerance:
                continue

            horizontal_distance = (
                numeric_left_x - nutrient_right_x
            )

            candidates.append(
                (
                    vertical_distance,
                    horizontal_distance,
                    numeric,
                )
            )

        if not candidates:
            continue

        # Prefer the closest value on the same row.
        candidates.sort(
            key=lambda item: (
                item[0],
                item[1],
            )
        )

        _, _, best_match = candidates[0]

        nutrition[nutrient_name] = {
            "value": best_match["value"],
            "unit": best_match["unit"],
            "sourceText": (
                f'{nutrient["text"]} {best_match["text"]}'
            ),
            "confidence": min(
                float(nutrient.get("confidence", 0)),
                float(best_match.get("confidence", 0)),
            ),
        }

    return nutrition

def parse_label(
    text: str,
    detections: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:

    normalized = normalize_text(text)

    if detections:
        nutrition = extract_nutrition_from_detections(
            detections
        )

        # Fall back to the original line parser if
        # spatial parsing did not find anything.
        if not nutrition:
            nutrition = extract_nutrition_lines(normalized)
    else:
        nutrition = extract_nutrition_lines(normalized)

    nutrition_quality = {
        "featuresDetected": len(nutrition),
        "requiredFeatures": 8,
        "complete": len(nutrition) == 8,
    }

    return {
        "productName": extract_product_name(normalized),
        "servingSizeGrams": extract_serving_size(normalized),
        "nutrition": nutrition,
        "nutritionQuality": nutrition_quality,
        "ingredients": extract_ingredients(normalized),
        "allergens": extract_allergens(normalized),
        "claims": extract_claims(normalized),
    }
def extract_product_name(text: str) -> str | None:
    lines = [
        line.strip()
        for line in text.splitlines()
        if line.strip()
    ]

    for line in lines:
        if "crisps" in line.lower():
            return line

    return None
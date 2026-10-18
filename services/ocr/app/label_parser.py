import copy
import re
from typing import Any


NUTRIENT_PATTERNS = {
    "energy": [
        r"\benergy\b",
        r"\bcalories?\b",
        r"\bkcal\b",
        r"ऊर्जा",
        r"ஆற்றல்",
        r"শক্তি",
    ],
    "fat": [
        r"\btotal\s+fat\b",
        r"(?<!saturated\s)\bfat\b",
        r"वसा",
        r"स्निग्धांश",
        r"கொழுப்பு",
        r"চর্বি",
    ],
    "saturatedFat": [
        r"\bsaturates?\b",
        r"\bsaturated\s+fat\b",
        r"संतृप्त",
        r"நிறைவுற்ற",
        r"স্যাচুরেটেড",
    ],
    "carbohydrates": [
        r"\bcarbohydrates?\b",
        r"\bcarbs?\b",
        r"कार्बोहाइड्रेट",
        r"कर्बोदके",
        r"கார்போஹைட்ரேட்",
        r"কার্বোহাইড্রেট",
    ],
    "sugars": [
        r"\bsugars?\b",
        r"शर्करा",
        r"चीनी",
        r"साखर",
        r"சர்க்கரை",
        r"চিনি",
    ],
    "fiber": [
        r"\bfib(?:re|er)\b",
        r"\bdietary\s+fiber\b",
        r"फाइबर",
        r"रेशा",
        r"तंतू",
        r"நார்ச்சத்து",
        r"ফাইবার",
    ],
    "proteins": [
        r"\bproteins?\b",
        r"प्रोटीन",
        r"प्रथिने",
        r"புரதம்",
        r"প্রোটিন",
    ],
    "salt": [
        r"\bsalt\b",
        r"नमक",
        r"मीठ",
        r"உப்பு",
        r"লবণ",
    ],
    "sodium": [
        r"\bsodium\b",
    ],
}

# Saturated fat is checked before fat so "संतृप्त वसा" is not stored as total fat.
NUTRIENT_ORDER = (
    "saturatedFat",
    "energy",
    "carbohydrates",
    "sugars",
    "fiber",
    "proteins",
    "salt",
    "sodium",
    "fat",
)


def normalize_text(text: str) -> str:
    text = text.replace("\r\n", "\n")
    text = text.replace("\r", "\n")

    return text


def extract_serving_size(text: str) -> float | None:
    patterns = [
        r"(?:serving\s+size|per\s+serving|per\s+portion|portion\s+size|serving)\s*[:\-]?\s*(\d+(?:[.,]\d+)?)\s*(?:grams?|gms?|g)\b",
        r"(\d+(?:[.,]\d+)?)\s*(?:grams?|gms?|g)\s+serving",
    ]

    for pattern in patterns:
        match = re.search(
            pattern,
            text,
            flags=re.IGNORECASE,
        )

        if match:
            return float(match.group(1).replace(",", "."))

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
        "almond",
        "cashew",
        "egg",
        "fish",
        "lactose",
        "shellfish",
        "crustacean",
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


def column_order(text: str) -> str:
    lower = text.lower()
    per_100 = re.search(r"per\s*100\s*g|/\s*100\s*g|\b100\s*g\b", lower)
    portion = re.search(
        r"per\s+(?:serving|portion|serve)|\bserving\b|\bportion\b",
        lower,
    )
    if per_100 and portion:
        if portion.start() < per_100.start():
            return "portion-then-100"
        return "100-then-portion"
    if per_100:
        return "per100-only"
    if portion:
        return "portion-only"
    return "unknown"


def _collapse_readings(readings: list[tuple[float, str]]) -> list[tuple[float, str]]:
    collapsed: list[tuple[float, str]] = []
    index = 0
    while index < len(readings):
        value, unit = readings[index]
        nxt = readings[index + 1] if index + 1 < len(readings) else None
        if unit == "kj" and nxt and nxt[1] == "kcal":
            collapsed.append((nxt[0], "kcal"))
            index += 2
            continue
        if unit == "kj":
            collapsed.append((round(value / 4.184, 1), "kcal"))
        else:
            collapsed.append((value, unit))
        index += 1
    return collapsed


_UNIT_PATTERN = r"(?:kcal|kj|grams?|gms?|mg|mcg|µg|μg|g)"
_AMOUNT_LINE = re.compile(
    rf"^(?:\d+(?:[.,]\d+)?(?:\s*{_UNIT_PATTERN})?[\s,/]*){{1,4}}$",
    re.IGNORECASE,
)
_BASIS_PHRASE = re.compile(
    r"\b(?:per|each|/)\s*100\s*(?:grams?|gms?|g|ml)\b",
    re.IGNORECASE,
)
_UNIT_ONLY = re.compile(rf"^{_UNIT_PATTERN}$", re.IGNORECASE)


def _canonical_unit(unit: str) -> str:
    compact = re.sub(r"\s+", "", unit).lower()
    if compact in {"g", "gm", "gms", "gram", "grams"}:
        return "g"
    if compact in {"mg", "mcg", "µg", "μg", "kcal", "kj"}:
        return compact
    return compact


def _prepare_amount_text(text: str) -> str:
    cleaned = (
        text.replace("\u00a0", " ")
        .replace("\u202f", " ")
        .replace("\u2009", " ")
    )
    return _BASIS_PHRASE.sub(" ", cleaned)


def _readings_in_text(text: str) -> list[tuple[float, str]]:
    found: list[tuple[float, str]] = []
    for match in re.finditer(
        rf"(\d+(?:[.,]\d+)?)\s*({_UNIT_PATTERN})?(?![A-Za-z])",
        _prepare_amount_text(text),
        flags=re.IGNORECASE,
    ):
        unit = _canonical_unit(match.group(2) or "")
        if unit == "%":
            continue
        found.append((float(match.group(1).replace(",", ".")), unit))
    return _collapse_readings(found)


def _pack(reading: tuple[float, str] | None) -> dict[str, Any] | None:
    if reading is None:
        return None
    value, unit = reading
    return {"value": value, "unit": unit}


def _apply_columns(
    entry: dict[str, Any],
    readings: list[tuple[float, str]],
    order: str,
) -> dict[str, Any]:
    portion = None
    per_100 = None
    assumed = False

    if order == "portion-then-100" and len(readings) >= 2:
        portion, per_100 = readings[0], readings[1]
    elif order == "100-then-portion" and len(readings) >= 2:
        per_100, portion = readings[0], readings[1]
    elif order == "per100-only" and readings:
        per_100 = readings[0]
        if len(readings) >= 2:
            portion = readings[1]
    elif order == "portion-only" and readings:
        portion = readings[0]
        if len(readings) >= 2:
            per_100 = readings[1]
    elif order == "portion-then-100" and len(readings) == 1:
        portion = readings[0]
    elif order == "100-then-portion" and len(readings) == 1:
        per_100 = readings[0]
    elif len(readings) >= 2:
        portion, per_100 = readings[0], readings[1]
        assumed = True
    elif len(readings) == 1 and order == "unknown":
        entry["basis"] = "single"

    entry["perPortion"] = _pack(portion)
    entry["per100g"] = _pack(per_100)
    entry["assumedColumnOrder"] = assumed

    if per_100 is not None:
        entry["value"] = per_100[0]
        entry["unit"] = per_100[1] or entry.get("unit", "")
        entry["basis"] = "per100g"
    elif portion is not None:
        entry["value"] = portion[0]
        entry["unit"] = portion[1] or entry.get("unit", "")
        entry["basis"] = "perPortion"
    else:
        entry.setdefault("basis", "single")

    return entry


def extract_nutrition_lines(
    text: str,
    order: str = "unknown",
) -> dict[str, dict[str, Any]]:
    nutrition: dict[str, dict[str, Any]] = {}

    lines = [
        line.strip()
        for line in text.splitlines()
        if line.strip()
    ]

    index = 0
    while index < len(lines):
        line = lines[index]
        lower_line = line.lower()

        nutrient_name = None

        for nutrient in NUTRIENT_ORDER:
            patterns = NUTRIENT_PATTERNS[nutrient]
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
            index += 1
            continue

        source = line
        readings = _readings_in_text(line)
        step = 1
        # A packet often prints the name on one line and "9 g" on the next.
        if not readings:
            extra: list[str] = []
            look = index + 1
            while look < len(lines) and look <= index + 2 and _AMOUNT_LINE.fullmatch(lines[look]):
                extra.append(lines[look])
                look += 1
            if extra:
                source = " ".join([line, *extra])
                readings = _readings_in_text(" ".join(extra))
                step = 1 + len(extra)

        if readings:
            nutrition[nutrient_name] = _apply_columns(
                {
                    "value": readings[0][0],
                    "unit": readings[0][1],
                    "sourceText": source,
                },
                readings,
                order,
            )
        index += step

    # Fallback: Look for energy/fat values in the entire text if not found
    if "energy" not in nutrition:
        # More lenient pattern for OCR errors (e.g., "2O00" instead of "2000")
        energy_match = re.search(
            r"(\d{3,4}[O0]\d{2})\s*[kK][cC][aA][lL]",
            text,
            flags=re.IGNORECASE,
        )
        if energy_match:
            value_str = energy_match.group(1).replace('O', '0')
            nutrition["energy"] = {
                "value": float(value_str),
                "unit": "kcal",
                "sourceText": energy_match.group(0),
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

    if re.search(r"\bsalt\b|\bnamak\b|नमक|मीठ|உப்பு|লবণ", normalized):
        return "salt"

    if re.search(r"\bsodium\b", normalized):
        return "sodium"

    if re.search(r"ऊर्जा|ஆற்றல்|শক্তি|calories?", normalized):
        return "energy"

    if re.search(r"संतृप्त|நிறைவுற்ற|স্যাচুরেটেড|saturated", normalized):
        return "saturatedFat"

    if re.search(r"कार्बोहाइड्रेट|कर्बोदके|கார்போஹைட்ரேட்|কার্বোহাইড্রেট|carbohyd", normalized):
        return "carbohydrates"

    if re.search(r"शर्करा|चीनी|साखर|சர்க்கரை|চিনি|sugars?", normalized):
        return "sugars"

    if re.search(r"फाइबर|रेशा|तंतू|நார்ச்சத்து|ফাইবার|fib(?:re|er)", normalized):
        return "fiber"

    if re.search(r"प्रोटीन|प्रथिने|புரதம்|প্রোটিন|proteins?", normalized):
        return "proteins"

    if re.search(r"वसा|स्निग्धांश|கொழுப்பு|চর্বি", normalized) and "संतृप्त" not in normalized and "நிறைவுற்ற" not in normalized and "স্যাচুরেটেড" not in normalized:
        return "fat"

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
        '9 g'   -> (9.0, 'g')
        '9 gm'  -> (9.0, 'g')
        '440 kcal' -> (440, 'kcal')
        '0.35g(6%*)' -> (0.35, 'g')
    """

    cleaned = _prepare_amount_text(text.strip())

    match = re.search(
        rf"(\d+(?:[.,]\d+)?)\s*({_UNIT_PATTERN})?(?![A-Za-z])",
        cleaned,
        flags=re.IGNORECASE,
    )

    if not match:
        return None

    try:
        value = float(match.group(1).replace(",", "."))
    except ValueError:
        return None

    unit = _canonical_unit(match.group(2) or "")

    return value, unit


def _attach_neighbor_units(
    numeric_detections: list[dict[str, Any]],
    detections: list[dict[str, Any]],
) -> None:
    """Join a bare '9' box with a neighbouring 'g' or 'gm' box."""
    for numeric in numeric_detections:
        if numeric.get("unit"):
            continue
        right = _detection_right_x(numeric)
        center_y = _detection_center_y(numeric)
        height = max(_detection_height(numeric), 8)
        best = None
        best_gap = 10**9
        for detection in detections:
            text = re.sub(r"\s+", "", str(detection.get("text", "")).strip())
            if not _UNIT_ONLY.fullmatch(text):
                continue
            gap = _detection_left_x(detection) - right
            if gap < -4 or gap > height * 3:
                continue
            if abs(_detection_center_y(detection) - center_y) > height:
                continue
            if gap < best_gap:
                best = detection
                best_gap = gap
        if best is not None:
            numeric["unit"] = _canonical_unit(str(best.get("text", "")))
            numeric["text"] = f"{numeric.get('text', '')} {best.get('text', '')}".strip()


def extract_nutrition_from_detections(
    detections: list[dict[str, Any]],
    order: str = "unknown",
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
        ):
            value, unit = numeric_value

            numeric_detections.append(
                {
                    **detection,
                    "value": value,
                    "unit": unit,
                }
            )

    _attach_neighbor_units(numeric_detections, detections)

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
            nutrient_left = _detection_left_x(nutrient)
            for numeric in numeric_detections:
                below = _detection_center_y(numeric) - nutrient_y
                if below <= 0 or below > nutrient_height * 3:
                    continue
                if abs(_detection_left_x(numeric) - nutrient_left) > nutrient_height * 4:
                    continue
                candidates.append((below, 0, numeric))

        if not candidates:
            continue

        candidates.sort(key=lambda item: _detection_left_x(item[2]))
        chosen = candidates[:2]
        readings = _collapse_readings([
            (item[2]["value"], item[2]["unit"])
            for item in chosen
        ])
        best_match = chosen[0][2]
        nutrition[nutrient_name] = _apply_columns(
            {
                "value": best_match["value"],
                "unit": best_match["unit"],
                "sourceText": (
                    f'{nutrient["text"]} '
                    + " ".join(item[2]["text"] for item in chosen)
                ),
                "confidence": min(
                    float(nutrient.get("confidence", 0)),
                    min(float(item[2].get("confidence", 0)) for item in chosen),
                ),
            },
            readings,
            order,
        )

    return nutrition

def _finalize_nutrition(
    nutrition: dict[str, dict[str, Any]],
) -> dict[str, dict[str, Any]]:
    def convert_kj(packet: dict[str, Any] | None) -> None:
        if packet and str(packet.get("unit", "")).lower() == "kj":
            packet["value"] = round(float(packet["value"]) / 4.184, 1)
            packet["unit"] = "kcal"

    for entry in nutrition.values():
        convert_kj(entry)
        convert_kj(entry.get("perPortion"))
        convert_kj(entry.get("per100g"))

    sodium = nutrition.get("sodium")
    if sodium and "salt" not in nutrition:
        unit = str(sodium.get("unit", "")).lower()
        amount = float(sodium["value"])
        grams = amount / 1000 if unit == "mg" else amount
        nutrition["salt"] = {
            "value": round(grams * 2.5, 3),
            "unit": "g",
            "sourceText": f"estimated from sodium: {sodium.get('sourceText', '')}",
            "confidence": sodium.get("confidence", 0.5),
        }

    nutrition.pop("sodium", None)
    return nutrition


def _packet_identity(entry: dict[str, Any], key: str) -> tuple[float, str] | None:
    packet = entry.get(key)
    if not isinstance(packet, dict) or packet.get("value") is None:
        return None
    return round(float(packet["value"]), 3), str(packet.get("unit") or "").lower()


def readers_disagree(
    spatial: dict[str, dict[str, Any]],
    lines: dict[str, dict[str, Any]],
) -> list[str]:
    """Nutrients where the box reader and the line reader stored different columns."""
    if not spatial or not lines:
        return []
    names: list[str] = []
    for name in sorted(set(spatial) & set(lines)):
        for key in ("perPortion", "per100g"):
            if _packet_identity(spatial[name], key) != _packet_identity(lines[name], key):
                names.append(name)
                break
    return names


def parse_label(
    text: str,
    detections: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:

    normalized = normalize_text(text)
    order = column_order(normalized)
    line_nutrition = extract_nutrition_lines(normalized, order)
    spatial_nutrition: dict[str, dict[str, Any]] = {}

    if detections:
        spatial_nutrition = extract_nutrition_from_detections(
            detections,
            order,
        )

    line_done = _finalize_nutrition(copy.deepcopy(line_nutrition)) if line_nutrition else {}
    spatial_done = (
        _finalize_nutrition(copy.deepcopy(spatial_nutrition))
        if spatial_nutrition
        else {}
    )
    disagreements = readers_disagree(spatial_done, line_done)
    nutrition = spatial_done or line_done

    nutrition_quality = {
        "featuresDetected": len(nutrition),
        "requiredFeatures": 8,
        "complete": len(nutrition) == 8,
    }

    return {
        "productName": extract_product_name(normalized),
        "servingSizeGrams": extract_serving_size(normalized),
        "columnOrder": order,
        "readersDisagree": disagreements,
        "nutrition": nutrition,
        "nutritionQuality": nutrition_quality,
        "ingredients": extract_ingredients(normalized),
        "allergens": extract_allergens(normalized),
        "claims": extract_claims(normalized),
    }
def extract_product_name(text: str) -> str | None:
    skip = re.compile(
        r"ingredient|nutrition|energy|serving|per\s+100|allergen|storage|kcal|protein|carbohydrate|sodium|salt|sugar|\bfat\b|fibre|fiber",
        flags=re.IGNORECASE,
    )

    for raw_line in text.splitlines():
        line = raw_line.strip()
        if len(line) < 3 or len(line) > 80 or skip.search(line):
            continue
        if re.fullmatch(r"[\d\W_]+", line):
            continue
        if re.search(r"[A-Za-z\u0900-\u097F]{3}", line):
            return line

    return None
"""Score each nutrient instead of one OCR percentage.

A swapped 9 g and 18 g is `swapped`, not a near miss. Counts stay separate.
`wrong_value` is reported beside the five study labels so a plain wrong
digit is not hidden inside correct or invented.
"""

from __future__ import annotations

from typing import Any

LABELS = (
    "correct",
    "missed",
    "swapped",
    "wrong_unit",
    "invented",
    "wrong_value",
)

_GRAMS = {"g", "gm", "gms", "gram", "grams"}


def _slot(entry: dict[str, Any] | None, key: str) -> tuple[float, str] | None:
    if not entry:
        return None
    packet = entry.get(key)
    if not isinstance(packet, dict) or packet.get("value") is None:
        return None
    return float(packet["value"]), str(packet.get("unit") or "").lower()


def _energy(slot: tuple[float, str] | None) -> bool:
    return bool(slot and slot[1] in {"kcal", "kj"})


def _close(left: float, right: float, energy: bool) -> bool:
    tolerance = 1.0 if energy else max(0.05, abs(right) * 0.02)
    return abs(left - right) <= tolerance


def _numbers_match(
    left: tuple[float, str] | None,
    right: tuple[float, str] | None,
) -> bool:
    if left is None or right is None:
        return left is right
    return _close(left[0], right[0], _energy(left) or _energy(right))


def _units_compatible(left: str, right: str) -> bool:
    if not left or not right or left == right:
        return True
    return left in _GRAMS and right in _GRAMS


def _slots_match(
    left: tuple[float, str] | None,
    right: tuple[float, str] | None,
) -> bool:
    if left is None or right is None:
        return left is right
    return _numbers_match(left, right) and _units_compatible(left[1], right[1])


def _converts(predicted: tuple[float, str], expected: tuple[float, str]) -> bool:
    value, unit = predicted
    target, target_unit = expected
    energy = unit in {"kcal", "kj"} or target_unit in {"kcal", "kj"}
    candidates = (
        (value / 1000, "mg", "g"),
        (value * 1000, "g", "mg"),
        (value / 4.184, "kj", "kcal"),
        (value * 4.184, "kcal", "kj"),
    )
    for converted, source_unit, dest_unit in candidates:
        if unit == source_unit and (not target_unit or target_unit == dest_unit):
            if _close(converted, target, energy or dest_unit == "kcal"):
                return True
    if unit and target_unit and unit != target_unit and not _units_compatible(unit, target_unit):
        if _close(value, target, energy):
            return True
    return False


def _unit_problem(
    expected: tuple[float, str] | None,
    predicted: tuple[float, str] | None,
) -> bool:
    if expected is None or predicted is None:
        return False
    if _slots_match(expected, predicted):
        return False
    return _converts(predicted, expected)


def classify_nutrient(
    expected: dict[str, Any] | None,
    predicted: dict[str, Any] | None,
) -> str | None:
    expected_portion = _slot(expected, "perPortion")
    expected_hundred = _slot(expected, "per100g")
    predicted_portion = _slot(predicted, "perPortion")
    predicted_hundred = _slot(predicted, "per100g")
    expected_any = expected_portion is not None or expected_hundred is not None
    predicted_any = predicted_portion is not None or predicted_hundred is not None

    if not expected_any and not predicted_any:
        return None
    if not expected_any and predicted_any:
        return "invented"
    if expected_any and not predicted_any:
        return "missed"
    if _slots_match(expected_portion, predicted_portion) and _slots_match(
        expected_hundred, predicted_hundred
    ):
        return "correct"
    crossed = _numbers_match(expected_portion, predicted_hundred) and _numbers_match(
        expected_hundred, predicted_portion
    )
    straight = _numbers_match(expected_portion, predicted_portion) and _numbers_match(
        expected_hundred, predicted_hundred
    )
    if crossed and not straight:
        return "swapped"
    if _unit_problem(expected_portion, predicted_portion) or _unit_problem(
        expected_hundred, predicted_hundred
    ):
        return "wrong_unit"
    return "wrong_value"


def score_fields(
    expected: dict[str, Any],
    predicted: dict[str, Any],
) -> dict[str, Any]:
    nutrients: dict[str, str] = {}
    for name in sorted(set(expected) | set(predicted)):
        label = classify_nutrient(expected.get(name), predicted.get(name))
        if label:
            nutrients[name] = label
    counts = {label: 0 for label in LABELS}
    for label in nutrients.values():
        counts[label] += 1
    return {
        "counts": counts,
        "nutrients": nutrients,
        "scored": len(nutrients),
        "note": "Counts are separate. A single accuracy percentage is not computed.",
    }


def fields_from_parse(nutrition: dict[str, Any]) -> dict[str, Any]:
    return {
        name: {
            "perPortion": entry.get("perPortion"),
            "per100g": entry.get("per100g"),
        }
        for name, entry in nutrition.items()
        if isinstance(entry, dict)
    }

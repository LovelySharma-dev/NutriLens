"""Error labels for a label read.

Field labels from `score_fields` stay as they are. This module adds the
study taxonomy beside them. `wrong_value` has no taxonomy code: a wrong
digit is not relabeled as an OCR substitution unless the character
alignment says so.

Primary code order is a reporting choice. Allergen misses are listed
first. It is not a severity model and not a probability.
"""

from __future__ import annotations

from typing import Any

TAXONOMY = (
    "ocr_substitution",
    "omitted_text",
    "incorrect_table_association",
    "ingredient_boundary_error",
    "unit_conversion_error",
    "allergen_miss",
    "unsupported_inference",
)

PRIMARY_PRIORITY = (
    "allergen_miss",
    "incorrect_table_association",
    "unit_conversion_error",
    "unsupported_inference",
    "ingredient_boundary_error",
    "omitted_text",
    "ocr_substitution",
)

FIELD_TO_TAXONOMY = {
    "swapped": "incorrect_table_association",
    "wrong_unit": "unit_conversion_error",
    "invented": "unsupported_inference",
    "missed": "omitted_text",
}


def _alignment(reference: list[Any], hypothesis: list[Any]) -> dict[str, int]:
    """Edit counts over a sequence. Insertions are extra hypothesis items."""
    rows = len(reference) + 1
    cols = len(hypothesis) + 1
    distance = [[0] * cols for _ in range(rows)]
    for index in range(1, rows):
        distance[index][0] = index
    for index in range(1, cols):
        distance[0][index] = index
    for i in range(1, rows):
        for j in range(1, cols):
            substitution = 0 if reference[i - 1] == hypothesis[j - 1] else 1
            distance[i][j] = min(
                distance[i - 1][j] + 1,
                distance[i][j - 1] + 1,
                distance[i - 1][j - 1] + substitution,
            )
    i, j = rows - 1, cols - 1
    substitutions = deletions = insertions = 0
    while i > 0 or j > 0:
        if i > 0 and j > 0 and distance[i][j] == distance[i - 1][j - 1] + (
            reference[i - 1] != hypothesis[j - 1]
        ):
            if reference[i - 1] != hypothesis[j - 1]:
                substitutions += 1
            i -= 1
            j -= 1
        elif i > 0 and distance[i][j] == distance[i - 1][j] + 1:
            deletions += 1
            i -= 1
        else:
            insertions += 1
            j -= 1
    return {
        "distance": distance[-1][-1],
        "substitutions": substitutions,
        "deletions": deletions,
        "insertions": insertions,
        "reference_length": len(reference),
    }


def levenshtein_ops(reference: str, hypothesis: str) -> dict[str, int]:
    return _alignment(list(reference), list(hypothesis))


def word_ops(reference: str, hypothesis: str) -> dict[str, int]:
    return _alignment(reference.split(), hypothesis.split())


def ingredient_boundary(expected: list[str], parsed: list[str]) -> bool:
    """True when tokens were joined or split, not merely substituted."""
    exp = [token.casefold() for token in expected]
    got = [token.casefold() for token in parsed]
    if exp == got:
        return False
    for index in range(len(exp) - 1):
        joined = f"{exp[index]} {exp[index + 1]}"
        if joined in got and exp[index] not in got and exp[index + 1] not in got:
            return True
    for index in range(len(got) - 1):
        joined = f"{got[index]} {got[index + 1]}"
        if joined in exp and got[index] not in exp and got[index + 1] not in exp:
            return True
    return False


def assign_errors(
    *,
    field_labels: dict[str, str],
    reference_text: str | None,
    observed_text: str | None,
    expected_ingredients: list[str],
    parsed_ingredients: list[str],
    expected_allergens: list[str],
    parsed_allergens: list[str],
) -> list[dict[str, str]]:
    codes: list[tuple[str, str]] = []
    for nutrient, label in sorted(field_labels.items()):
        code = FIELD_TO_TAXONOMY.get(label)
        if code:
            codes.append((code, f"{nutrient} field label is {label}"))

    if isinstance(reference_text, str) and isinstance(observed_text, str):
        edits = levenshtein_ops(reference_text, observed_text)
        if edits["substitutions"]:
            codes.append(("ocr_substitution", f"{edits['substitutions']} character substitutions"))
        if edits["deletions"]:
            codes.append(("omitted_text", f"{edits['deletions']} reference characters absent from observed_text"))

    if ingredient_boundary(expected_ingredients, parsed_ingredients):
        codes.append(("ingredient_boundary_error", "ingredient tokens were joined or split"))

    found = {item.casefold() for item in parsed_allergens}
    missed = [item for item in expected_allergens if item.casefold() not in found]
    if missed:
        codes.append(("allergen_miss", "missing annotated allergens: " + ", ".join(missed)))

    seen: set[str] = set()
    unique: list[tuple[str, str]] = []
    for code, detail in codes:
        if code in seen:
            continue
        seen.add(code)
        unique.append((code, detail))

    primary = next((code for code in PRIMARY_PRIORITY if code in seen), None)
    return [
        {"code": code, "role": "primary" if code == primary else "secondary", "detail": detail}
        for code, detail in unique
    ]

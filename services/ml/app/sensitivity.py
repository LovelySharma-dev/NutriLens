"""One-cell letter stability for a complete per-100 g table.

The grid is fixed. Each nutrient is multiplied by 0.5, 0.8, 0.9, 1.1, 1.2,
or 1.5. A probe that breaks a ceiling or a fat/sugar relationship is rejected
and is not a letter change. The nearest flip is the accepted probe with the
smallest absolute distance from 1 that changes the letter.

The screening letter copies the shelf formula in apps/web/app/lib/safety.ts.
It is a separate rule. It is not the forest letter.
"""

from __future__ import annotations

from typing import Any

import pandas as pd

from app.explain import FEATURES

FACTORS = (0.5, 0.8, 0.9, 1.1, 1.2, 1.5)

CEILINGS = {
    "energy_100g": 900.0,
    "fat_100g": 100.0,
    "saturated-fat_100g": 100.0,
    "carbohydrates_100g": 100.0,
    "sugars_100g": 100.0,
    "fiber_100g": 100.0,
    "proteins_100g": 100.0,
    "salt_100g": 15.0,
}

LETTERS = ("a", "b", "c", "d", "e")

NOTE = (
    "Each nutrient was multiplied by a fixed factor. "
    "Probes outside the per 100 g ceilings are rejected and are not counted as letter changes. "
    "This grid is not an accuracy."
)


def implausible_issues(values: dict[str, float]) -> list[dict[str, Any]]:
    issues: list[dict[str, Any]] = []
    for feature, ceiling in CEILINGS.items():
        if values[feature] > ceiling:
            issues.append({
                "feature": feature,
                "value": values[feature],
                "ceiling": ceiling,
            })
    if values["saturated-fat_100g"] > values["fat_100g"] + 0.5:
        issues.append({
            "feature": "saturated-fat_100g",
            "value": values["saturated-fat_100g"],
            "ceiling": values["fat_100g"],
        })
    if values["sugars_100g"] > values["carbohydrates_100g"] + 0.5:
        issues.append({
            "feature": "sugars_100g",
            "value": values["sugars_100g"],
            "ceiling": values["carbohydrates_100g"],
        })
    return issues


def screening_letter(nutrients: dict[str, float]) -> str:
    """Mirror of screeningGrade in apps/web/app/lib/safety.ts. Returns A–E."""
    score = 0
    sugars = nutrients["sugars"]
    saturated = nutrients["saturatedFat"]
    salt = nutrients["salt"]
    energy = nutrients["energy"]
    if sugars >= 22.5:
        score += 2
    elif sugars >= 5:
        score += 1
    if saturated >= 5:
        score += 2
    elif saturated >= 1.5:
        score += 1
    if salt >= 1.5:
        score += 2
    elif salt >= 0.3:
        score += 1
    if energy >= 400:
        score += 2
    elif energy >= 250:
        score += 1
    if nutrients["fiber"] >= 6:
        score -= 1
    if nutrients["proteins"] >= 12:
        score -= 1
    if score <= 0:
        return "A"
    if score == 1:
        return "B"
    if score == 2:
        return "C"
    if score <= 4:
        return "D"
    return "E"


def margin_bucket(margin: float) -> str:
    if margin < 0.15:
        return "close"
    if margin < 0.40:
        return "mid"
    return "wide"


def letter_margin(probabilities: dict[str, float], grade: str) -> float:
    predicted = float(probabilities[grade])
    others = [float(value) for label, value in probabilities.items() if label != grade]
    runner = max(others) if others else 0.0
    return predicted - runner


def _frame(values: dict[str, float]) -> pd.DataFrame:
    return pd.DataFrame(
        [[values[feature] for feature in FEATURES]],
        columns=FEATURES,
    )


def probe_one_cell(model, values: dict[str, float], grade: str, probabilities: dict[str, float]) -> dict[str, Any]:
    """Run the fixed one-cell grid. `grade` is the forest letter already predicted."""
    margin = letter_margin(probabilities, str(grade))
    probes: list[dict[str, Any]] = []

    for feature in FEATURES:
        original = float(values[feature])
        for factor in FACTORS:
            trial = dict(values)
            trial[feature] = round(original * factor, 6)
            if implausible_issues(trial):
                probes.append({
                    "feature": feature,
                    "factor": factor,
                    "fromValue": original,
                    "toValue": trial[feature],
                    "status": "rejected",
                    "grade": None,
                })
                continue
            new_grade = str(model.predict(_frame(trial))[0])
            probes.append({
                "feature": feature,
                "factor": factor,
                "fromValue": original,
                "toValue": trial[feature],
                "status": "flip" if new_grade != str(grade) else "stable",
                "grade": new_grade,
            })

    flips = [row for row in probes if row["status"] == "flip"]
    nearest = None
    if flips:
        nearest_row = min(
            flips,
            key=lambda row: (abs(row["factor"] - 1), FEATURES.index(row["feature"]), row["factor"]),
        )
        nearest = {
            "feature": nearest_row["feature"],
            "factor": nearest_row["factor"],
            "fromValue": nearest_row["fromValue"],
            "toValue": nearest_row["toValue"],
            "grade": nearest_row["grade"],
        }

    accepted = [row for row in probes if row["status"] != "rejected"]
    return {
        "grid": list(FACTORS),
        "margin": round(margin, 4),
        "marginBucket": margin_bucket(margin),
        "nearestFlip": nearest,
        "accepted": len(accepted),
        "rejected": len(probes) - len(accepted),
        "flips": len(flips),
        "stable": len(accepted) - len(flips),
        "note": NOTE,
        "probes": probes,
    }


def sensitivity_public(detail: dict[str, Any]) -> dict[str, Any]:
    """Drop the full probe list. The report shows the summary and the nearest flip."""
    return {key: value for key, value in detail.items() if key != "probes"}

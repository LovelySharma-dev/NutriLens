"""Local explanations for the Nutri-Score forest.

Impurity importance is a global training statistic. A shopper needs a
reason for this label, so each feature is compared with the Open Food
Facts median used at training time. When the shap package is installed,
TreeSHAP replaces that occlusion estimate.
"""

from __future__ import annotations

from typing import Any

import pandas as pd

FEATURES = [
    "energy_100g",
    "fat_100g",
    "saturated-fat_100g",
    "carbohydrates_100g",
    "sugars_100g",
    "fiber_100g",
    "proteins_100g",
    "salt_100g",
]

MEDIANS = {
    "energy_100g": 380.0,
    "fat_100g": 8.5,
    "saturated-fat_100g": 3.2,
    "carbohydrates_100g": 20.0,
    "sugars_100g": 5.5,
    "fiber_100g": 2.8,
    "proteins_100g": 8.0,
    "salt_100g": 0.7,
}

_explainer: Any = None


def _frame(values: dict[str, float]) -> pd.DataFrame:
    return pd.DataFrame(
        [[values[feature] for feature in FEATURES]],
        columns=FEATURES,
    )


def _class_index(model, grade: str) -> int:
    classes = [str(label) for label in model.classes_]
    return classes.index(grade)


def _occlusion(model, values: dict[str, float], grade: str) -> list[dict[str, Any]]:
    index = _class_index(model, grade)
    base = float(model.predict_proba(_frame(values))[0][index])
    rows = []

    for feature in FEATURES:
        swapped = dict(values)
        swapped[feature] = MEDIANS[feature]
        altered = float(model.predict_proba(_frame(swapped))[0][index])
        rows.append({
            "feature": feature,
            "value": values[feature],
            "baseline": MEDIANS[feature],
            "contribution": round(base - altered, 4),
        })

    rows.sort(key=lambda row: abs(row["contribution"]), reverse=True)
    return rows


def _shap_rows(model, values: dict[str, float], grade: str) -> list[dict[str, Any]] | None:
    global _explainer

    try:
        import shap
    except Exception:
        return None

    try:
        if _explainer is None:
            _explainer = shap.TreeExplainer(model)

        raw = _explainer.shap_values(_frame(values))
        index = _class_index(model, grade)

        if isinstance(raw, list):
            vector = raw[index][0]
        else:
            array = getattr(raw, "values", raw)
            if getattr(array, "ndim", 0) == 3:
                vector = array[0, :, index]
            else:
                vector = array[0]

        rows = []
        for feature, contribution in zip(FEATURES, vector):
            rows.append({
                "feature": feature,
                "value": values[feature],
                "baseline": MEDIANS[feature],
                "contribution": round(float(contribution), 4),
            })
        rows.sort(key=lambda row: abs(row["contribution"]), reverse=True)
        return rows
    except Exception:
        return None


def explain_prediction(model, values: dict[str, float], grade: str) -> dict[str, Any]:
    shap_rows = _shap_rows(model, values, grade)
    if shap_rows is not None:
        return {
            "method": "shap",
            "grade": grade,
            "features": shap_rows,
            "note": "TreeSHAP values for the predicted Nutri-Score class. Positive values push toward that class.",
        }

    return {
        "method": "occlusion",
        "grade": grade,
        "features": _occlusion(model, values, grade),
        "note": "Each nutrient was replaced with the Open Food Facts median. The change in predicted-class probability is the local contribution. TreeSHAP is used when the shap package imports.",
    }

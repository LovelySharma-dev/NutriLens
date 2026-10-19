"""Measure letter stability and screening agreement on named complete tables.

Writes apps/web/app/lib/letter-stability.json. The tables are the twelve
authored reference foods and eight constructed complete tables. They are not
photographs, and the script does not report an OCR accuracy.
"""

from __future__ import annotations

import json
from collections import Counter
from datetime import date
from pathlib import Path

import joblib
import sklearn

from app.sensitivity import implausible_issues, probe_one_cell, screening_letter

ROOT = Path(__file__).resolve().parents[2]
CATALOG_PATH = ROOT / "apps" / "web" / "app" / "lib" / "catalog.json"
OUTPUT_PATH = ROOT / "apps" / "web" / "app" / "lib" / "letter-stability.json"
MODEL_PATH = Path(__file__).resolve().parent / "nutritrust_random_forest.joblib"

CONSTRUCTED = [
    {
        "id": "low-staple",
        "per100g": {"energy": 180, "fat": 1.5, "saturatedFat": 0.3, "carbohydrates": 30, "sugars": 2, "fiber": 8, "proteins": 12, "salt": 0.05},
    },
    {
        "id": "one-medium-sugar",
        "per100g": {"energy": 200, "fat": 2, "saturatedFat": 0.4, "carbohydrates": 35, "sugars": 8, "fiber": 2, "proteins": 5, "salt": 0.1},
    },
    {
        "id": "two-medium",
        "per100g": {"energy": 200, "fat": 6, "saturatedFat": 2, "carbohydrates": 40, "sugars": 8, "fiber": 2, "proteins": 5, "salt": 0.15},
    },
    {
        "id": "high-sugar-and-salt",
        "per100g": {"energy": 200, "fat": 2, "saturatedFat": 0.4, "carbohydrates": 40, "sugars": 24, "fiber": 1, "proteins": 4, "salt": 0.5},
    },
    {
        "id": "dense-snack",
        "per100g": {"energy": 500, "fat": 28, "saturatedFat": 10, "carbohydrates": 45, "sugars": 28, "fiber": 1, "proteins": 5, "salt": 1.8},
    },
    {
        "id": "printed-zero-fiber",
        "per100g": {"energy": 220, "fat": 3, "saturatedFat": 0.8, "carbohydrates": 40, "sugars": 3, "fiber": 0, "proteins": 7, "salt": 0.2},
    },
    {
        "id": "protein-offset",
        "per100g": {"energy": 420, "fat": 12, "saturatedFat": 2, "carbohydrates": 30, "sugars": 6, "fiber": 8, "proteins": 22, "salt": 0.4},
    },
    {
        "id": "salt-at-medium-line",
        "per100g": {"energy": 240, "fat": 4, "saturatedFat": 1.4, "carbohydrates": 25, "sugars": 4, "fiber": 3, "proteins": 8, "salt": 0.3},
    },
]


def to_model(nutrients: dict[str, float]) -> dict[str, float]:
    return {
        "energy_100g": float(nutrients["energy"]),
        "fat_100g": float(nutrients["fat"]),
        "saturated-fat_100g": float(nutrients["saturatedFat"]),
        "carbohydrates_100g": float(nutrients["carbohydrates"]),
        "sugars_100g": float(nutrients["sugars"]),
        "fiber_100g": float(nutrients["fiber"]),
        "proteins_100g": float(nutrients["proteins"]),
        "salt_100g": float(nutrients["salt"]),
    }


def check_rules() -> None:
    zeros = to_model({
        "energy": 0, "fat": 0, "saturatedFat": 0, "carbohydrates": 0,
        "sugars": 0, "fiber": 0, "proteins": 0, "salt": 0,
    })
    assert implausible_issues(zeros) == []
    salty = dict(zeros)
    salty["salt_100g"] = 20
    assert any(issue["feature"] == "salt_100g" for issue in implausible_issues(salty))
    sweet = dict(zeros)
    sweet["carbohydrates_100g"] = 10
    sweet["sugars_100g"] = 30
    assert any(issue["feature"] == "sugars_100g" for issue in implausible_issues(sweet))
    chana = {
        "energy": 360, "fat": 6, "saturatedFat": 0.6, "carbohydrates": 58,
        "sugars": 3, "fiber": 17, "proteins": 19, "salt": 0.15,
    }
    assert screening_letter(chana) == "A"


def predict_letter(model, values: dict[str, float]) -> tuple[str, dict[str, float]]:
    import pandas as pd
    from app.explain import FEATURES

    frame = pd.DataFrame([[values[feature] for feature in FEATURES]], columns=FEATURES)
    grade = str(model.predict(frame)[0])
    probabilities = model.predict_proba(frame)[0]
    mapped = {
        str(label): float(probability)
        for label, probability in zip(model.classes_, probabilities)
    }
    return grade, mapped


def measure_row(model, row_id: str, nutrients: dict[str, float]) -> dict:
    values = to_model(nutrients)
    issues = implausible_issues(values)
    if issues:
        raise SystemExit(f"{row_id} is implausible and cannot be graded: {issues}")
    grade, probabilities = predict_letter(model, values)
    detail = probe_one_cell(model, values, grade, probabilities)
    screening = screening_letter(nutrients)
    return {
        "id": row_id,
        "forest": grade,
        "screening": screening,
        "agree": grade.lower() == screening.lower(),
        "steps": abs("abcde".index(grade.lower()) - "ABCDE".index(screening)),
        "margin": detail["margin"],
        "marginBucket": detail["marginBucket"],
        "nearestFlip": detail["nearestFlip"],
        "accepted": detail["accepted"],
        "rejected": detail["rejected"],
        "flips": detail["flips"],
        "stable": detail["stable"],
        "per100g": {
            "energy": nutrients["energy"],
            "fat": nutrients["fat"],
            "saturatedFat": nutrients["saturatedFat"],
            "carbohydrates": nutrients["carbohydrates"],
            "sugars": nutrients["sugars"],
            "fiber": nutrients["fiber"],
            "proteins": nutrients["proteins"],
            "salt": nutrients["salt"],
        },
    }


def summarize(rows: list[dict]) -> dict:
    buckets: dict[str, dict] = {}
    for name in ("close", "mid", "wide"):
        chosen = [row for row in rows if row["marginBucket"] == name]
        accepted = sum(row["accepted"] for row in chosen)
        flips = sum(row["flips"] for row in chosen)
        buckets[name] = {
            "tables": len(chosen),
            "tablesWithAFlip": sum(1 for row in chosen if row["nearestFlip"] is not None),
            "accepted": accepted,
            "rejected": sum(row["rejected"] for row in chosen),
            "flips": flips,
            "stable": sum(row["stable"] for row in chosen),
            "flipShareOfAccepted": None if accepted == 0 else round(flips / accepted, 4),
        }
    nearest = Counter(
        row["nearestFlip"]["feature"]
        for row in rows
        if row["nearestFlip"] is not None
    )
    accepted = sum(row["accepted"] for row in rows)
    flips = sum(row["flips"] for row in rows)
    return {
        "tables": len(rows),
        "exactLetterAgreement": sum(1 for row in rows if row["agree"]),
        "meanAbsoluteLetterSteps": round(sum(row["steps"] for row in rows) / len(rows), 4) if rows else None,
        "forestLetters": dict(Counter(row["forest"] for row in rows)),
        "screeningLetters": dict(Counter(row["screening"] for row in rows)),
        "accepted": accepted,
        "rejected": sum(row["rejected"] for row in rows),
        "flips": flips,
        "stable": sum(row["stable"] for row in rows),
        "flipShareOfAccepted": None if accepted == 0 else round(flips / accepted, 4),
        "tablesWithAFlip": sum(1 for row in rows if row["nearestFlip"] is not None),
        "nearestFlipByFeature": dict(nearest),
        "byMarginBucket": buckets,
    }


def main() -> None:
    check_rules()
    model = joblib.load(MODEL_PATH)
    catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    shelf_rows = [measure_row(model, item["id"], item["per100g"]) for item in catalog]
    constructed_rows = [measure_row(model, item["id"], item["per100g"]) for item in CONSTRUCTED]
    payload = {
        "ranOn": date.today().isoformat(),
        "model": "services/ml/nutritrust_random_forest.joblib",
        "scikitLearn": sklearn.__version__,
        "publishedForestRetrained": False,
        "task": "complete per 100 g tables, not photographs",
        "grid": [0.5, 0.8, 0.9, 1.1, 1.2, 1.5],
        "marginBuckets": {
            "close": "margin < 0.15",
            "mid": "0.15 <= margin < 0.40",
            "wide": "margin >= 0.40",
        },
        "note": (
            "Exact letter agreement compares the random-forest letter with the screening letter. "
            "A flip is an accepted one-cell probe whose letter differs from the unperturbed table. "
            "Rejected probes break a ceiling and are left out of the flip share. "
            "These counts are not an OCR accuracy and not a clearance."
        ),
        "corpora": {
            "reference-shelf": {
                "kind": "twelve authored foods in apps/web/app/lib/catalog.json",
                "rows": shelf_rows,
                "summary": summarize(shelf_rows),
            },
            "constructed-bands": {
                "kind": "eight constructed complete tables, not products and not photographs",
                "rows": constructed_rows,
                "summary": summarize(constructed_rows),
            },
        },
    }
    OUTPUT_PATH.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "output": str(OUTPUT_PATH),
        "reference-shelf": payload["corpora"]["reference-shelf"]["summary"],
        "constructed-bands": payload["corpora"]["constructed-bands"]["summary"],
    }, indent=2))


if __name__ == "__main__":
    main()

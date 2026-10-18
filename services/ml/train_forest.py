"""Train a new forest only from a CSV you supply.

The published artifact stays services/ml/nutritrust_random_forest.joblib
unless --replace is passed. Metrics printed here describe that CSV's
held-out table split. They are not a photograph score.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, balanced_accuracy_score, f1_score
from sklearn.model_selection import train_test_split

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
TARGET = "nutrition_grade_fr"
PUBLISHED = Path(__file__).resolve().parent / "nutritrust_random_forest.joblib"


def train(frame: pd.DataFrame, random_state: int = 42) -> tuple[RandomForestClassifier, dict]:
    missing = [column for column in [*FEATURES, TARGET] if column not in frame.columns]
    if missing:
        raise SystemExit(f"CSV is missing columns: {', '.join(missing)}")
    cleaned = frame.dropna(subset=[*FEATURES, TARGET])
    if len(cleaned) < 500:
        raise SystemExit("Need at least 500 complete rows. Refusing to publish a tiny split.")
    labels = cleaned[TARGET].astype(str).str.lower()
    train_x, test_x, train_y, test_y = train_test_split(
        cleaned[FEATURES],
        labels,
        test_size=0.2,
        random_state=random_state,
        stratify=labels,
    )
    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=None,
        max_features="log2",
        min_samples_leaf=1,
        min_samples_split=2,
        class_weight="balanced",
        random_state=random_state,
    )
    model.fit(train_x, train_y)
    predicted = model.predict(test_x)
    metrics = {
        "task": "held-out nutrition table on the CSV passed to this script",
        "rows": int(len(cleaned)),
        "accuracy": round(float(accuracy_score(test_y, predicted)), 4),
        "balanced_accuracy": round(float(balanced_accuracy_score(test_y, predicted)), 4),
        "macro_f1": round(float(f1_score(test_y, predicted, average="macro")), 4),
        "note": "Not a photographed-label score and not a replacement for the published 0.9487 figure unless --replace was used.",
    }
    return model, metrics


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", required=True, help="CSV with the eight per-100 g columns and nutrition_grade_fr")
    parser.add_argument("--output", help="Where to write the new joblib. Defaults beside the CSV.")
    parser.add_argument("--replace", action="store_true", help="Overwrite the published forest")
    args = parser.parse_args()

    frame = pd.read_csv(args.data)
    model, metrics = train(frame)
    destination = Path(args.output) if args.output else Path(args.data).with_suffix(".joblib")
    if args.replace:
        destination = PUBLISHED
    import joblib
    joblib.dump(model, destination)
    metrics_path = destination.with_suffix(".metrics.json")
    metrics_path.write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    print(json.dumps({"wrote": str(destination), "metrics": metrics}, indent=2))


if __name__ == "__main__":
    main()

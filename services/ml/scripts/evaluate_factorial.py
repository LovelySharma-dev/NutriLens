"""Chance-corrected agreement of three letters on a declared nutrient grid.

The grid is not a sample of packaged food and not a set of photographs.
Fat is saturated fat plus a pad. Carbohydrate is sugars plus a pad.
Energy is the 4/4/9/2 estimate of those macros, so the energy check is not failed by the design.

Writes apps/web/app/lib/factorial-agreement.json.
"""

from __future__ import annotations

import json
import math
import random
import sys
from collections import Counter
from datetime import date
from pathlib import Path

import joblib
import pandas as pd
import sklearn

SERVICE_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SERVICE_ROOT))

from app.explain import FEATURES
from app.sensitivity import FACTORS, implausible_issues, margin_bucket, screening_letter

ROOT = SERVICE_ROOT.parents[1]
OUTPUT_PATH = ROOT / "apps" / "web" / "app" / "lib" / "factorial-agreement.json"
MODEL_PATH = SERVICE_ROOT / "nutritrust_random_forest.joblib"
CATALOG_PATH = ROOT / "apps" / "web" / "app" / "lib" / "catalog.json"

ENERGY_KJ = [335, 670, 1005, 1340, 1675, 2010, 2345, 2680, 3015, 3350]
SUGARS_G = [4.5, 9, 13.5, 18, 22.5, 27, 31.5, 36, 40, 45]
SATURATED_FAT_G = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
SODIUM_MG = [90, 180, 270, 360, 450, 540, 630, 720, 810, 900]
FIBER_G = [0.9, 1.9, 2.8, 3.7, 4.7]
PROTEIN_G = [1.6, 3.2, 4.8, 6.4, 8]
LETTER_ORDER = "abcde"

SUGAR_LEVELS = (2, 8, 24)
SAT_LEVELS = (0.5, 2.5, 8)
SALT_LEVELS = (0.1, 0.6, 1.8)
FIBER_LEVELS = (1, 7)
PROTEIN_LEVELS = (4, 14)
FAT_PADS = (4, 10)
CARB_PADS = (12, 35)


def points_above(value: float, thresholds: list[float]) -> int:
    score = 0
    for limit in thresholds:
        if value > limit:
            score += 1
        else:
            break
    return score


def formula_report(nutrients: dict[str, float]) -> dict:
    """Mirror of formulaGrade in apps/web/app/lib/readingAudit.ts."""
    energy_kj = nutrients["energy"] * 4.184
    sodium_mg = nutrients["salt"] / 2.5 * 1000
    negative = (
        points_above(energy_kj, ENERGY_KJ)
        + points_above(nutrients["sugars"], SUGARS_G)
        + points_above(nutrients["saturatedFat"], SATURATED_FAT_G)
        + points_above(sodium_mg, SODIUM_MG)
    )
    fiber_points = points_above(nutrients["fiber"], FIBER_G)
    protein_points = points_above(nutrients["proteins"], PROTEIN_G)
    protein_counted = negative < 11
    positive = fiber_points + (protein_points if protein_counted else 0)
    score = negative - positive
    if score <= -1:
        letter = "A"
    elif score <= 2:
        letter = "B"
    elif score <= 10:
        letter = "C"
    elif score <= 18:
        letter = "D"
    else:
        letter = "E"
    estimated = 4 * nutrients["proteins"] + 4 * nutrients["carbohydrates"] + 9 * nutrients["fat"] + 2 * nutrients["fiber"]
    gap = abs(nutrients["energy"] - estimated)
    divergent = gap / max(estimated, 1) > 0.1 and gap > 30
    return {"letter": letter, "score": score, "divergent": divergent}


def check_formula() -> None:
    chana = formula_report({
        "energy": 360, "fat": 6, "saturatedFat": 0.6, "carbohydrates": 58,
        "sugars": 3, "fiber": 17, "proteins": 19, "salt": 0.15,
    })
    assert chana["letter"] == "A" and chana["score"] == -6
    counted = formula_report({
        "energy": 100, "fat": 1, "saturatedFat": 0.5, "carbohydrates": 10,
        "sugars": 2, "fiber": 0, "proteins": 20, "salt": 0.1,
    })
    assert counted["letter"] == "A" and counted["score"] == -4
    zero_table = {
        "energy": 0, "fat": 0, "saturatedFat": 0, "carbohydrates": 0,
        "sugars": 0, "fiber": 0, "proteins": 0, "salt": 0,
    }
    zeros = formula_report(zero_table)
    assert zeros["letter"] == "B"
    assert screening_letter(zero_table) == "A"


def wilson(k: int, n: int) -> dict:
    z = 1.96
    if n == 0:
        return {"k": 0, "n": 0, "p": None, "low": None, "high": None}
    p = k / n
    z2 = z * z
    denom = 1 + z2 / n
    center = (p + z2 / (2 * n)) / denom
    margin = z * math.sqrt(p * (1 - p) / n + z2 / (4 * n * n)) / denom
    return {
        "k": k,
        "n": n,
        "p": round(p, 4),
        "low": round(max(0.0, center - margin), 4),
        "high": round(min(1.0, center + margin), 4),
    }


def confusion(left: list[str], right: list[str]) -> list[list[int]]:
    matrix = [[0] * 5 for _ in range(5)]
    for a, b in zip(left, right):
        matrix[LETTER_ORDER.index(a.lower())][LETTER_ORDER.index(b.lower())] += 1
    return matrix


def cohen_kappa(left: list[str], right: list[str]) -> dict:
    n = len(left)
    matrix = confusion(left, right)
    agreed = sum(matrix[i][i] for i in range(5))
    po = agreed / n
    row = [sum(matrix[i]) for i in range(5)]
    col = [sum(matrix[r][c] for r in range(5)) for c in range(5)]
    pe = sum((row[i] / n) * (col[i] / n) for i in range(5))
    kappa = 1.0 if pe == 1 else (po - pe) / (1 - pe)
    return {
        "agreed": agreed,
        "n": n,
        "observed": round(po, 4),
        "chance": round(pe, 4),
        "kappa": round(kappa, 4),
        "wilson": wilson(agreed, n),
    }


def factorial_rows() -> list[dict[str, float]]:
    """Energy is the 4/4/9/2 estimate, so the energy check is not failed by construction."""
    rows = []
    for sugars in SUGAR_LEVELS:
        for saturated in SAT_LEVELS:
            for salt in SALT_LEVELS:
                for fiber in FIBER_LEVELS:
                    for protein in PROTEIN_LEVELS:
                        for fat_pad in FAT_PADS:
                            for carb_pad in CARB_PADS:
                                fat = saturated + fat_pad
                                carbohydrates = sugars + carb_pad
                                energy = 4 * protein + 4 * carbohydrates + 9 * fat + 2 * fiber
                                rows.append({
                                    "energy": float(energy),
                                    "fat": float(fat),
                                    "saturatedFat": float(saturated),
                                    "carbohydrates": float(carbohydrates),
                                    "sugars": float(sugars),
                                    "fiber": float(fiber),
                                    "proteins": float(protein),
                                    "salt": float(salt),
                                })
    return rows


def model_frame(rows: list[dict[str, float]]) -> pd.DataFrame:
    mapped = {
        "energy_100g": [row["energy"] for row in rows],
        "fat_100g": [row["fat"] for row in rows],
        "saturated-fat_100g": [row["saturatedFat"] for row in rows],
        "carbohydrates_100g": [row["carbohydrates"] for row in rows],
        "sugars_100g": [row["sugars"] for row in rows],
        "fiber_100g": [row["fiber"] for row in rows],
        "proteins_100g": [row["proteins"] for row in rows],
        "salt_100g": [row["salt"] for row in rows],
    }
    return pd.DataFrame(mapped, columns=FEATURES)


def probe_grid(model, frame: pd.DataFrame, grades: list[str]) -> dict:
    n = len(frame)
    accepted = [0] * n
    rejected = [0] * n
    flips = [0] * n
    nearest: list[dict | None] = [None] * n
    by_bucket = {
        name: {"tables": 0, "tablesWithAFlip": 0, "accepted": 0, "flips": 0}
        for name in ("close", "mid", "wide")
    }
    probabilities = model.predict_proba(frame)
    classes = [str(label) for label in model.classes_]
    margins = []
    buckets = []
    for index in range(n):
        grade = grades[index]
        class_index = classes.index(grade)
        predicted = float(probabilities[index][class_index])
        others = [float(probabilities[index][i]) for i in range(len(classes)) if i != class_index]
        margin = predicted - (max(others) if others else 0.0)
        bucket = margin_bucket(margin)
        margins.append(round(margin, 4))
        buckets.append(bucket)
        by_bucket[bucket]["tables"] += 1

    for feature_index, feature in enumerate(FEATURES):
        original = frame[feature].to_numpy()
        for factor in FACTORS:
            trial = frame.copy()
            trial[feature] = [round(float(value) * factor, 6) for value in original]
            predicted = [str(label) for label in model.predict(trial)]
            for index in range(n):
                values = {name: float(trial.iloc[index][name]) for name in FEATURES}
                if implausible_issues(values):
                    rejected[index] += 1
                    continue
                accepted[index] += 1
                by_bucket[buckets[index]]["accepted"] += 1
                if predicted[index] == grades[index]:
                    continue
                flips[index] += 1
                by_bucket[buckets[index]]["flips"] += 1
                candidate = {
                    "feature": feature,
                    "factor": factor,
                    "grade": predicted[index],
                }
                current = nearest[index]
                if current is None or (abs(factor - 1), feature_index, factor) < (
                    abs(current["factor"] - 1),
                    FEATURES.index(current["feature"]),
                    current["factor"],
                ):
                    nearest[index] = candidate

    for index, item in enumerate(nearest):
        if item is not None:
            by_bucket[buckets[index]]["tablesWithAFlip"] += 1
    for item in by_bucket.values():
        item["flipShareOfAccepted"] = None if item["accepted"] == 0 else round(item["flips"] / item["accepted"], 4)
        item["tablesWithAFlipWilson"] = wilson(item["tablesWithAFlip"], item["tables"])
    return {
        "accepted": sum(accepted),
        "rejected": sum(rejected),
        "flips": sum(flips),
        "tablesWithAFlip": sum(1 for item in nearest if item is not None),
        "tablesWithAFlipWilson": wilson(sum(1 for item in nearest if item is not None), n),
        "nearestFlipByFeature": dict(Counter(item["feature"] for item in nearest if item is not None)),
        "byMarginBucket": by_bucket,
    }


def linear_weighted_kappa(left: list[str], right: list[str]) -> float:
    """Linear weights: a one-letter miss counts as 1/4 of an A-versus-E miss."""
    n = len(left)
    matrix = confusion(left, right)
    row = [sum(matrix[i]) for i in range(5)]
    col = [sum(matrix[r][c] for r in range(5)) for c in range(5)]
    observed = 0.0
    chance = 0.0
    for i in range(5):
        for j in range(5):
            weight = abs(i - j) / 4
            observed += weight * matrix[i][j] / n
            chance += weight * (row[i] / n) * (col[j] / n)
    if chance == 0:
        return 1.0
    return round(1 - observed / chance, 4)


def off_diagonal(left: list[str], right: list[str], left_name: str, right_name: str) -> list[dict]:
    matrix = confusion(left, right)
    cells = []
    for i in range(5):
        for j in range(5):
            if i == j or matrix[i][j] == 0:
                continue
            cells.append({
                left_name: LETTER_ORDER[i].upper(),
                right_name: LETTER_ORDER[j].upper(),
                "n": matrix[i][j],
                "steps": abs(i - j),
            })
    cells.sort(key=lambda cell: (-cell["n"], cell["steps"]))
    return cells[:5]


def odd_reader(forest: list[str], screen: list[str], formula: list[str]) -> dict:
    counts = {"allThree": 0, "formulaOdd": 0, "screeningOdd": 0, "forestOdd": 0, "allDiffer": 0}
    for a, b, c in zip(forest, screen, formula):
        ab = a.lower() == b.lower()
        ac = a.lower() == c.lower()
        bc = b.lower() == c.lower()
        if ab and ac:
            counts["allThree"] += 1
        elif ab and not ac:
            counts["formulaOdd"] += 1
        elif ac and not ab:
            counts["screeningOdd"] += 1
        elif bc:
            counts["forestOdd"] += 1
        else:
            counts["allDiffer"] += 1
    counts["n"] = len(forest)
    return counts


def permutation_null(left: list[str], right: list[str], draws: int = 1000, seed: int = 18) -> dict:
    """Shuffle the second reader. Keeps both letter frequencies. Seed is fixed."""
    rng = random.Random(seed)
    observed = cohen_kappa(left, right)["kappa"]
    nulls = []
    pool = list(right)
    for _ in range(draws):
        rng.shuffle(pool)
        nulls.append(cohen_kappa(left, pool)["kappa"])
    nulls.sort()
    at_or_above = sum(1 for value in nulls if value >= observed)
    return {
        "draws": draws,
        "seed": seed,
        "observedKappa": observed,
        "nullMedian": nulls[draws // 2],
        "nullPercentile95": nulls[int(draws * 0.95) - 1],
        "nullsAtOrAboveObserved": at_or_above,
        "note": "The shuffle keeps each reader's letter counts and breaks the pairing. It is a check that the observed kappa is not a frequency accident.",
    }


def pair_block(left: list[str], right: list[str], steps: list[int]) -> dict:
    right_harsher = 0
    right_milder = 0
    for a, b in zip(left, right):
        gap = LETTER_ORDER.index(b.lower()) - LETTER_ORDER.index(a.lower())
        if gap >= 2:
            right_harsher += 1
        elif gap <= -2:
            right_milder += 1
    return {
        **cohen_kappa(left, right),
        "meanAbsoluteLetterSteps": round(sum(steps) / len(steps), 4),
        "withinOneLetter": wilson(sum(1 for step in steps if step <= 1), len(steps)),
        "linearWeightedKappa": linear_weighted_kappa(left, right),
        "rightHarsherByTwoOrMore": right_harsher,
        "rightMilderByTwoOrMore": right_milder,
    }


def measure_catalog(model) -> dict:
    catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    nutrients = [item["per100g"] for item in catalog]
    frame = model_frame(nutrients)
    forest = [str(label) for label in model.predict(frame)]
    screen = [screening_letter(row).lower() for row in nutrients]
    formula = [formula_report(row)["letter"].lower() for row in nutrients]
    steps = [abs(LETTER_ORDER.index(a) - LETTER_ORDER.index(b)) for a, b in zip(forest, screen)]
    return {
        "n": len(catalog),
        "forestScreen": pair_block(forest, screen, steps),
        "note": "Twelve authored foods. The Wilson interval on this n is wide. It is not the cited grid.",
    }


def main() -> None:
    check_formula()
    model = joblib.load(MODEL_PATH)
    rows = factorial_rows()
    frame = model_frame(rows)
    for index in range(len(rows)):
        values = {name: float(frame.iloc[index][name]) for name in FEATURES}
        issues = implausible_issues(values)
        if issues:
            raise SystemExit(f"Factorial row {index} broke a ceiling: {issues}")
    forest = [str(label) for label in model.predict(frame)]
    screen = [screening_letter(row) for row in rows]
    formula = [formula_report(row) for row in rows]
    formula_letters = [item["letter"] for item in formula]
    screen_steps = [abs(LETTER_ORDER.index(a) - LETTER_ORDER.index(b.lower())) for a, b in zip(forest, screen)]
    formula_steps = [abs(LETTER_ORDER.index(a) - LETTER_ORDER.index(b.lower())) for a, b in zip(forest, formula_letters)]
    screen_formula_steps = [abs(LETTER_ORDER.index(a.lower()) - LETTER_ORDER.index(b.lower())) for a, b in zip(screen, formula_letters)]
    three = sum(
        1 for a, b, c in zip(forest, screen, formula_letters)
        if a.lower() == b.lower() == c.lower()
    )
    probes = probe_grid(model, frame, forest)
    payload = {
        "ranOn": date.today().isoformat(),
        "model": "services/ml/nutritrust_random_forest.joblib",
        "scikitLearn": sklearn.__version__,
        "publishedForestRetrained": False,
        "task": "declared factorial grid of complete per 100 g tables, not photographs and not a food sample",
        "design": {
            "sugarsG": list(SUGAR_LEVELS),
            "saturatedFatG": list(SAT_LEVELS),
            "saltG": list(SALT_LEVELS),
            "fiberG": list(FIBER_LEVELS),
            "proteinsG": list(PROTEIN_LEVELS),
            "fatPadsG": list(FAT_PADS),
            "carbohydratePadsG": list(CARB_PADS),
            "fatRule": "saturated fat + fat pad",
            "carbohydrateRule": "sugars + carbohydrate pad",
            "energyRule": "4*protein + 4*carbohydrate + 9*fat + 2*fiber",
            "tables": len(rows),
        },
        "letters": {
            "forest": dict(Counter(forest)),
            "screening": dict(Counter(screen)),
            "formula": dict(Counter(formula_letters)),
        },
        "energyCheckFlagged": sum(1 for item in formula if item["divergent"]),
        "threeWayAgreement": {**wilson(three, len(rows)), "kappaNotDefined": "Kappa is reported on pairs. Three-way agreement is a count."},
        "pairs": {
            "forestScreen": pair_block(forest, [item.lower() for item in screen], screen_steps),
            "forestFormula": pair_block(forest, [item.lower() for item in formula_letters], formula_steps),
            "screenFormula": pair_block([item.lower() for item in screen], [item.lower() for item in formula_letters], screen_formula_steps),
        },
        "probes": probes,
        "anatomy": {
            "oddReader": odd_reader(forest, screen, formula_letters),
            "forestScreenOffDiagonal": off_diagonal(forest, [item.lower() for item in screen], "forest", "screening"),
            "forestScreenPermutation": permutation_null(forest, [item.lower() for item in screen]),
            "weightNote": "Linear weighted kappa gives a one-letter miss one quarter of the weight of an A-versus-E miss. Unweighted kappa treats those misses as equal.",
        },
        "shelf": measure_catalog(model),
        "note": (
            "Observed agreement is the share of tables with the same letter. "
            "Chance agreement is what the two letter frequencies would produce if the letters were paired at random. "
            "Kappa subtracts that chance. Wilson intervals use z = 1.96. "
            "Landis and Koch bands are a label, not a cutoff. "
            "This grid is not an OCR accuracy and not a clearance."
        ),
    }
    OUTPUT_PATH.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "tables": len(rows),
        "pairs": payload["pairs"],
        "threeWay": payload["threeWayAgreement"],
        "energyCheckFlagged": payload["energyCheckFlagged"],
        "letters": payload["letters"],
        "probes": {
            "tablesWithAFlip": probes["tablesWithAFlipWilson"],
            "nearest": probes["nearestFlipByFeature"],
            "buckets": probes["byMarginBucket"],
        },
        "shelfForestScreen": payload["shelf"]["forestScreen"],
        "anatomy": payload["anatomy"],
    }, indent=2))


if __name__ == "__main__":
    main()

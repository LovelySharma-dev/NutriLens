"""Published-formula reading audit.

The random forest imitates an Open Food Facts letter. This module
computes a different letter from the 2017 Nutri-Score general-foods
point table, then checks whether the printed energy agrees with the
EU 1169/2011 conversion factors. Fruit, vegetable, and nut percent is
unknown and counted as zero. Beverages, cheeses, and added fats are
not given their own tables.
"""

from __future__ import annotations

from statistics import median
from typing import Any


FORMULA_ID = "nutri-score-2017-general-foods"
KCAL_TO_KJ = 4.184
SALT_TO_SODIUM = 2.5

ENERGY_KJ = (335, 670, 1005, 1340, 1675, 2010, 2345, 2680, 3015, 3350)
SUGARS_G = (4.5, 9, 13.5, 18, 22.5, 27, 31.5, 36, 40, 45)
SATURATED_FAT_G = (1, 2, 3, 4, 5, 6, 7, 8, 9, 10)
SODIUM_MG = (90, 180, 270, 360, 450, 540, 630, 720, 810, 900)
FIBER_G = (0.9, 1.9, 2.8, 3.7, 4.7)
PROTEIN_G = (1.6, 3.2, 4.8, 6.4, 8.0)

LETTERS = "ABCDE"
REQUIRED = (
    "energy",
    "fat",
    "saturatedFat",
    "carbohydrates",
    "sugars",
    "fiber",
    "proteins",
    "salt",
)

# Smallest step used when searching for a letter change.
FLIP_STEPS = {
    "energy": 1.0,
    "sugars": 0.1,
    "saturatedFat": 0.1,
    "salt": 0.01,
    "fiber": 0.1,
    "proteins": 0.1,
}

LIMITATIONS = (
    "2017 general-foods table. Beverages, cheeses, and added fats are not scored on their own tables.",
    "Fruit, vegetable, and nut percent is unknown and counted as 0. Protein points are dropped when negative points are 11 or more.",
    "Kilocalories are multiplied by 4.184 to reach kilojoules. Salt grams are divided by 2.5 to reach sodium grams.",
    "This letter is not the random-forest letter and not the screening grade.",
)


def points_above(value: float, thresholds: tuple[float, ...]) -> int:
    """Points for a value that scores 0 at or below the first threshold."""
    score = 0
    for limit in thresholds:
        if value > limit:
            score += 1
        else:
            break
    return score


def letter_for(score: int) -> str:
    if score <= -1:
        return "A"
    if score <= 2:
        return "B"
    if score <= 10:
        return "C"
    if score <= 18:
        return "D"
    return "E"


def margin_for(score: int) -> dict[str, Any]:
    """Nutri-Score points between this score and the nearest other letter."""
    if score <= -1:
        return {"points": -score, "toward": ["B"]}
    bands = (
        (2, score - (-1), ["A"], 3 - score, ["C"]),
        (10, score - 2, ["B"], 11 - score, ["D"]),
        (18, score - 10, ["C"], 19 - score, ["E"]),
    )
    for ceiling, down, down_letters, up, up_letters in bands:
        if score <= ceiling:
            if down < up:
                return {"points": down, "toward": down_letters}
            if up < down:
                return {"points": up, "toward": up_letters}
            return {"points": down, "toward": down_letters + up_letters}
    return {"points": score - 18, "toward": ["D"]}


def _ready(table: dict[str, Any]) -> bool:
    for key in REQUIRED:
        value = table.get(key)
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            return False
        if value != value or value in (float("inf"), float("-inf")):
            return False
    return True


def formula_grade(table: dict[str, Any]) -> dict[str, Any]:
    if not _ready(table):
        return {"status": "unchecked", "reason": "missing"}

    energy_kj = float(table["energy"]) * KCAL_TO_KJ
    sodium_mg = float(table["salt"]) / SALT_TO_SODIUM * 1000
    negative_parts = {
        "energy": points_above(energy_kj, ENERGY_KJ),
        "sugars": points_above(float(table["sugars"]), SUGARS_G),
        "saturatedFat": points_above(float(table["saturatedFat"]), SATURATED_FAT_G),
        "sodium": points_above(sodium_mg, SODIUM_MG),
    }
    fiber_points = points_above(float(table["fiber"]), FIBER_G)
    protein_points = points_above(float(table["proteins"]), PROTEIN_G)
    fruit_points = 0
    negative = sum(negative_parts.values())
    protein_counted = not (negative >= 11 and fruit_points < 5)
    positive = fiber_points + fruit_points + (protein_points if protein_counted else 0)
    score = negative - positive
    return {
        "status": "ready",
        "id": FORMULA_ID,
        "letter": letter_for(score),
        "score": score,
        "negativePoints": negative,
        "positivePoints": positive,
        "proteinCounted": protein_counted,
        "proteinPoints": protein_points,
        "fruitPercentKnown": False,
        "energyKj": round(energy_kj, 1),
        "sodiumMg": round(sodium_mg, 1),
        "points": {
            **negative_parts,
            "fiber": fiber_points,
            "protein": protein_points,
            "fruit": fruit_points,
        },
        "margin": margin_for(score),
        "limitations": list(LIMITATIONS),
    }


def screening_grade(table: dict[str, Any]) -> dict[str, Any]:
    """Same bands as the shelf screening grade in apps/web/app/lib/safety.ts."""
    if not _ready(table):
        return {"status": "unchecked", "reason": "missing"}
    score = 0
    if table["sugars"] >= 22.5:
        score += 2
    elif table["sugars"] >= 5:
        score += 1
    if table["saturatedFat"] >= 5:
        score += 2
    elif table["saturatedFat"] >= 1.5:
        score += 1
    if table["salt"] >= 1.5:
        score += 2
    elif table["salt"] >= 0.3:
        score += 1
    if table["energy"] >= 400:
        score += 2
    elif table["energy"] >= 250:
        score += 1
    if table["fiber"] >= 6:
        score -= 1
    if table["proteins"] >= 12:
        score -= 1
    if score <= 0:
        letter = "A"
    elif score == 1:
        letter = "B"
    elif score == 2:
        letter = "C"
    elif score <= 4:
        letter = "D"
    else:
        letter = "E"
    return {
        "status": "ready",
        "letter": letter,
        "note": "Screening grade from the UK-style bands already used on the shelf. Not the 2017 Nutri-Score formula.",
    }


def atwater(table: dict[str, Any]) -> dict[str, Any]:
    """EU 1169/2011 factors, with the Lean double threshold.

    Alcohol and polyols are omitted because this table does not carry them.
    A missing fiber is unchecked. A printed zero is used.
    Divergent means the gap is above 10% and above 30 kcal. The check does
    not say which of the two energy descriptions is wrong.
    """
    if not _ready(table):
        return {"status": "unchecked", "reason": "missing"}
    estimated = (
        4 * float(table["proteins"])
        + 4 * float(table["carbohydrates"])
        + 9 * float(table["fat"])
        + 2 * float(table["fiber"])
    )
    stated = float(table["energy"])
    gap = abs(stated - estimated)
    relative = gap / max(estimated, 1)
    divergent = relative > 0.10 and gap > 30
    return {
        "status": "divergent" if divergent else "coherent",
        "statedKcal": round(stated, 1),
        "estimatedKcal": round(estimated, 1),
        "gapKcal": round(gap, 1),
        "relativeGap": round(relative, 4),
        "rule": "divergent when the gap is above 10% and above 30 kcal",
        "factors": "4 protein, 4 carbohydrate, 9 fat, 2 fiber",
        "omitted": ["alcohol", "polyols"],
    }


def letter_distance(left: str, right: str) -> int:
    return abs(LETTERS.index(left.upper()) - LETTERS.index(right.upper()))


def _plausible(table: dict[str, Any]) -> bool:
    if table["sugars"] > table["carbohydrates"] + 0.5:
        return False
    if table["saturatedFat"] > table["fat"] + 0.5:
        return False
    if table["energy"] > 900 or table["salt"] > 15:
        return False
    if any(table[key] < 0 for key in REQUIRED):
        return False
    if any(table[key] > 100 for key in ("fat", "saturatedFat", "carbohydrates", "sugars", "fiber", "proteins")):
        return False
    return True


def _bounds(nutrient: str, table: dict[str, Any]) -> tuple[float, float]:
    if nutrient == "energy":
        return 0.0, 900.0
    if nutrient == "salt":
        return 0.0, 15.0
    if nutrient == "sugars":
        return 0.0, min(100.0, float(table["carbohydrates"]) + 0.5)
    if nutrient == "saturatedFat":
        return 0.0, min(100.0, float(table["fat"]) + 0.5)
    return 0.0, 100.0


def nutrient_flips(table: dict[str, Any]) -> list[dict[str, Any]]:
    """Smallest in-ceiling change of one nutrient that changes the formula letter."""
    base = formula_grade(table)
    if base["status"] != "ready":
        return []
    found: list[dict[str, Any]] = []
    for nutrient, step in FLIP_STEPS.items():
        low, high = _bounds(nutrient, table)
        current = float(table[nutrient])
        steps = 1
        hit: dict[str, Any] | None = None
        while True:
            delta = round(steps * step, 4)
            candidates = []
            if current + delta <= high + 1e-9:
                candidates.append(("increase", delta, round(current + delta, 4)))
            if current - delta >= low - 1e-9:
                candidates.append(("decrease", delta, round(current - delta, 4)))
            for direction, size, value in candidates:
                trial = dict(table)
                trial[nutrient] = value
                if not _plausible(trial):
                    continue
                graded = formula_grade(trial)
                if graded["letter"] != base["letter"]:
                    hit = {
                        "nutrient": nutrient,
                        "direction": direction,
                        "delta": size,
                        "nextLetter": graded["letter"],
                        "unit": "kcal" if nutrient == "energy" else "g",
                        "step": step,
                    }
                    break
            if hit or (current + delta > high and current - delta < low):
                break
            steps += 1
            if steps > 20000:
                break
        if hit:
            found.append(hit)
    return found


def serving_illusion(
    serving_grams: float | None,
    portion_kcal: float | None,
    per100_kcal: float | None,
) -> dict[str, Any] | None:
    """Compare a printed portion with the per-100 g energy column.

    A disagreement uses the same 10% and 30 kcal rule as the Atwater check,
    after the portion energy is scaled to 100 g. It does not say which
    column was read wrong.
    """
    if serving_grams is None or serving_grams <= 0:
        return None
    share = serving_grams / 100
    scaled_portion = None if per100_kcal is None else round(per100_kcal * share, 1)
    columns_disagree = None
    implied_per100 = None
    if portion_kcal is not None and per100_kcal is not None:
        implied_per100 = portion_kcal * (100 / serving_grams)
        gap = abs(implied_per100 - per100_kcal)
        relative = gap / max(abs(per100_kcal), 1)
        columns_disagree = relative > 0.10 and gap > 30
    return {
        "servingGrams": serving_grams,
        "shareOf100g": round(share, 4),
        "scaledPortionKcal": scaled_portion,
        "printedPortionKcal": None if portion_kcal is None else round(portion_kcal, 1),
        "impliedPer100gKcal": None if implied_per100 is None else round(implied_per100, 1),
        "columnsDisagree": columns_disagree,
        "rule": "columns disagree when the scaled gap is above 10% and above 30 kcal",
    }


def audit_table(table: dict[str, Any], *, flips: bool = True) -> dict[str, Any]:
    formula = formula_grade(table)
    screening = screening_grade(table)
    energy = atwater(table)
    if formula["status"] != "ready" or screening["status"] != "ready":
        return {
            "status": "unchecked",
            "reason": "missing",
            "formula": formula,
            "screening": screening,
            "atwater": energy,
            "flips": [],
        }
    distance = letter_distance(formula["letter"], screening["letter"])
    return {
        "status": "ready",
        "formula": formula,
        "screening": screening,
        "lettersAgree": distance == 0,
        "letterDistance": distance,
        "atwater": energy,
        "flips": nutrient_flips(table) if flips else [],
    }


def summarize(rows: list[dict[str, Any]], *, forest_letters: list[str | None] | None = None) -> dict[str, Any]:
    """Counts for a cohort. Each row needs formula, screening, atwater, flips, and an id."""
    formula_letters: dict[str, int] = {letter: 0 for letter in LETTERS}
    screening_letters: dict[str, int] = {letter: 0 for letter in LETTERS}
    confusion: dict[str, dict[str, int]] = {
        formula_letter: {screening_letter: 0 for screening_letter in LETTERS}
        for formula_letter in LETTERS
    }
    agree = adjacent = far = 0
    coherent = divergent = unchecked = 0
    protein_counted = protein_dropped = 0
    margin_bins = {"1": 0, "2": 0, "3-5": 0, "6+": 0}
    margins: list[int] = []
    flip_deltas: dict[str, list[float]] = {name: [] for name in FLIP_STEPS}
    items = []
    for row in rows:
        formula_letter = row["formula"]["letter"]
        screening_letter = row["screening"]["letter"]
        formula_letters[formula_letter] += 1
        screening_letters[screening_letter] += 1
        confusion[formula_letter][screening_letter] += 1
        distance = row["letterDistance"]
        if distance == 0:
            agree += 1
        elif distance == 1:
            adjacent += 1
        else:
            far += 1
        status = row["atwater"]["status"]
        if status == "coherent":
            coherent += 1
        elif status == "divergent":
            divergent += 1
        else:
            unchecked += 1
        points = int(row["formula"]["margin"]["points"])
        margins.append(points)
        if row["formula"]["proteinCounted"]:
            protein_counted += 1
        else:
            protein_dropped += 1
        if points <= 1:
            margin_bins["1"] += 1
        elif points == 2:
            margin_bins["2"] += 1
        elif points <= 5:
            margin_bins["3-5"] += 1
        else:
            margin_bins["6+"] += 1
        for flip in row["flips"]:
            flip_deltas[flip["nutrient"]].append(float(flip["delta"]))
        items.append({
            "id": row.get("id"),
            "formula": formula_letter,
            "score": row["formula"]["score"],
            "margin": points,
            "screening": screening_letter,
            "atwater": status,
            "proteinCounted": row["formula"]["proteinCounted"],
        })

    forest = None
    if forest_letters is not None:
        forest_confusion: dict[str, dict[str, int]] = {
            formula_letter: {forest_letter: 0 for forest_letter in LETTERS}
            for formula_letter in LETTERS
        }
        forest_agree = forest_adjacent = forest_far = forest_missing = 0
        fragile_n = fragile_agree = 0
        settled_n = settled_agree = 0
        for index, raw in enumerate(forest_letters):
            if raw is None:
                forest_missing += 1
                continue
            forest_letter = raw.upper()
            formula_letter = rows[index]["formula"]["letter"]
            forest_confusion[formula_letter][forest_letter] += 1
            distance = letter_distance(formula_letter, forest_letter)
            if distance == 0:
                forest_agree += 1
            elif distance == 1:
                forest_adjacent += 1
            else:
                forest_far += 1
            points = int(rows[index]["formula"]["margin"]["points"])
            if points <= 1:
                fragile_n += 1
                fragile_agree += int(distance == 0)
            if points >= 5:
                settled_n += 1
                settled_agree += int(distance == 0)
            items[index]["forest"] = forest_letter
        compared = forest_agree + forest_adjacent + forest_far
        forest = {
            "compared": compared,
            "missing": forest_missing,
            "agree": forest_agree,
            "adjacent": forest_adjacent,
            "far": forest_far,
            "confusion": forest_confusion,
            "margin1": {"n": fragile_n, "agree": fragile_agree},
            "margin5OrMore": {"n": settled_n, "agree": settled_agree},
        }

    flips = {}
    for name, deltas in flip_deltas.items():
        flips[name] = {
            "canFlip": len(deltas),
            "medianAbsDelta": None if not deltas else round(float(median(deltas)), 4),
            "unit": "kcal" if name == "energy" else "g",
            "step": FLIP_STEPS[name],
        }
    return {
        "n": len(rows),
        "formulaLetters": formula_letters,
        "screeningLetters": screening_letters,
        "formulaScreening": {"agree": agree, "adjacent": adjacent, "far": far, "confusion": confusion},
        "atwater": {"coherent": coherent, "divergent": divergent, "unchecked": unchecked},
        "proteinCounted": protein_counted,
        "proteinDropped": protein_dropped,
        "margin": {
            "bins": margin_bins,
            "median": None if not margins else float(median(margins)),
            "min": None if not margins else min(margins),
            "max": None if not margins else max(margins),
        },
        "flips": flips,
        "forest": forest,
        "rows": items,
    }

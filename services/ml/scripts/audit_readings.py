"""Count formula letters, screening letters, and Atwater checks.

The coherent lattice sets energy to the 4/4/9/2 estimate. The unit-swap
lattice stores that estimate times 4.184 when the result is still at or
under 900 kcal, which imitates a kilojoule figure written into the
kilocalorie cell. Neither lattice is a photograph set, and neither is a
sample of Open Food Facts.

Writes docs/research/reading-audit.json.
"""

from __future__ import annotations

import json
from itertools import product
from pathlib import Path

import pandas as pd

from app.explain import FEATURES
from app.reading_audit import KCAL_TO_KJ, audit_table, summarize


ROOT = Path(__file__).resolve().parents[2]
CATALOG_PATH = ROOT / "apps" / "web" / "app" / "lib" / "catalog.json"
MODEL_PATH = Path(__file__).resolve().parent / "nutritrust_random_forest.joblib"
OUTPUT_PATH = ROOT / "docs" / "research" / "reading-audit.json"

PROTEINS = (2.0, 8.0, 16.0, 25.0)
CARBS = (5.0, 20.0, 45.0, 70.0)
SUGAR_FRACS = (0.05, 0.4, 0.9)
FATS = (1.0, 8.0, 20.0, 40.0)
SAT_FRACS = (0.2, 0.6)
FIBERS = (0.0, 3.0, 8.0)


def _macros(proteins: float, carbs: float, sugar_frac: float, fat: float, sat_frac: float, fiber: float) -> dict | None:
    sugars = round(sugar_frac * carbs, 1)
    saturated = round(sat_frac * fat, 1)
    if fat + carbs + proteins > 100:
        return None
    if sugars > carbs or saturated > fat:
        return None
    if fat + carbs + proteins + fiber > 105:
        return None
    return {
        "fat": fat,
        "saturatedFat": saturated,
        "carbohydrates": carbs,
        "sugars": sugars,
        "fiber": fiber,
        "proteins": proteins,
        "salt": round(0.05 + (0.15 * sat_frac) + (0.02 * proteins), 2),
    }


def lattices() -> tuple[list[dict], list[dict]]:
    coherent: list[dict] = []
    swapped: list[dict] = []
    for proteins, carbs, sugar_frac, fat, sat_frac, fiber in product(
        PROTEINS, CARBS, SUGAR_FRACS, FATS, SAT_FRACS, FIBERS,
    ):
        macros = _macros(proteins, carbs, sugar_frac, fat, sat_frac, fiber)
        if macros is None:
            continue
        estimated = round(
            4 * macros["proteins"] + 4 * macros["carbohydrates"] + 9 * macros["fat"] + 2 * macros["fiber"],
            1,
        )
        if estimated > 900:
            continue
        stamp = (
            f"p{proteins}-c{carbs}-sf{sugar_frac}-f{fat}-sat{sat_frac}-fi{fiber}"
        )
        coherent.append({"id": f"coherent-{stamp}", **macros, "energy": estimated})
        kilojoule_as_kcal = round(estimated * KCAL_TO_KJ, 1)
        if kilojoule_as_kcal <= 900:
            swapped.append({"id": f"kj-as-kcal-{stamp}", **macros, "energy": kilojoule_as_kcal})
    return coherent, swapped


def _audit_rows(tables: list[dict], *, flips: bool = True) -> list[dict]:
    audited = []
    for table in tables:
        result = audit_table(table, flips=flips)
        result["id"] = table["id"]
        audited.append(result)
    return audited


def _load_forest():
    if not MODEL_PATH.exists():
        return None, "model file was not on disk"
    try:
        import joblib
    except Exception as error:
        return None, f"joblib did not import: {error}"
    return joblib.load(MODEL_PATH), "loaded nutritrust_random_forest.joblib; the file was not retrained"


def _forest_letters(model, tables: list[dict]) -> list[str] | None:
    if model is None:
        return None
    frame = pd.DataFrame(
        [
            {
                "energy_100g": row["energy"],
                "fat_100g": row["fat"],
                "saturated-fat_100g": row["saturatedFat"],
                "carbohydrates_100g": row["carbohydrates"],
                "sugars_100g": row["sugars"],
                "fiber_100g": row["fiber"],
                "proteins_100g": row["proteins"],
                "salt_100g": row["salt"],
            }
            for row in tables
        ],
        columns=FEATURES,
    )
    return [str(letter) for letter in model.predict(frame)]


def _cohort(tables: list[dict], forest: list[str] | None, *, keep: str, flips: bool = True) -> dict:
    summary = summarize(_audit_rows(tables, flips=flips), forest_letters=forest)
    rows = summary.pop("rows")
    if not flips:
        summary["flips"] = None
    if keep == "all":
        summary["rows"] = rows
    else:
        summary["disagreementExamples"] = [
            item for item in rows if item.get("forest") and item["formula"] != item["forest"]
        ][:8]
    return summary


def main() -> None:
    catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    catalog_tables = [{"id": item["id"], **item["per100g"]} for item in catalog]
    coherent, swapped = lattices()
    model, forest_note = _load_forest()
    catalog_forest = _forest_letters(model, catalog_tables)
    coherent_forest = _forest_letters(model, coherent)

    import sklearn
    payload = {
        "formula": "nutri-score-2017-general-foods",
        "sklearn": {
            "loadedWith": sklearn.__version__,
            "pickledWith": "1.6.1",
            "note": "Loading the published joblib emitted InconsistentVersionWarning. Forest letters in this file are what that load predicted. They are not a new held-out accuracy.",
        },
        "fruitPercent": "unknown, counted as 0",
        "atwaterRule": "divergent when the gap is above 10% and above 30 kcal; alcohol and polyols omitted",
        "notAPhotographSet": True,
        "notAnOpenFoodFactsSample": True,
        "forest": forest_note,
        "catalog": _cohort(catalog_tables, catalog_forest, keep="all"),
        "coherentLattice": {
            **_cohort(coherent, coherent_forest, keep="examples"),
            "note": "Energy is the 4/4/9/2 estimate rounded to 0.1 kcal. Salt is 0.05 + 0.15*saturated-fat fraction + 0.02*protein, so salt is not independent of the other axes.",
        },
        "unitSwapLattice": {
            **_cohort(swapped, None, keep="examples", flips=False),
            "note": "Energy is the Atwater estimate times 4.184, kept only when that value is still at or under 900 kcal. This checks the rule. It is not a rate of kilojoule mix-ups in the wild.",
        },
    }
    OUTPUT_PATH.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    brief = {
        "catalog": payload["catalog"]["n"],
        "catalogFormulaScreening": payload["catalog"]["formulaScreening"],
        "catalogAtwater": payload["catalog"]["atwater"],
        "catalogForest": None if payload["catalog"]["forest"] is None else {
            key: payload["catalog"]["forest"][key]
            for key in ("compared", "agree", "adjacent", "far", "margin1", "margin5OrMore")
        },
        "coherent": payload["coherentLattice"]["n"],
        "coherentFormulaScreening": payload["coherentLattice"]["formulaScreening"],
        "coherentAtwater": payload["coherentLattice"]["atwater"],
        "coherentMargin": payload["coherentLattice"]["margin"],
        "coherentFlips": payload["coherentLattice"]["flips"],
        "coherentForest": None if payload["coherentLattice"]["forest"] is None else {
            key: payload["coherentLattice"]["forest"][key]
            for key in ("compared", "agree", "adjacent", "far", "margin1", "margin5OrMore")
        },
        "unitSwap": payload["unitSwapLattice"]["n"],
        "unitSwapAtwater": payload["unitSwapLattice"]["atwater"],
        "wrote": str(OUTPUT_PATH),
    }
    print(json.dumps(brief, indent=2))


if __name__ == "__main__":
    main()

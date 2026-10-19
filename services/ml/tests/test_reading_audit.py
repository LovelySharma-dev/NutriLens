"""Locks the 2017 foods table, the Atwater double threshold, and the zero table."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.reading_audit import atwater, audit_table, formula_grade, letter_for, points_above, serving_illusion
from app.reading_audit import ENERGY_KJ, SUGARS_G


def test_threshold_is_strictly_above():
    assert points_above(335, ENERGY_KJ) == 0
    assert points_above(335.1, ENERGY_KJ) == 1
    assert points_above(4.5, SUGARS_G) == 0
    assert points_above(4.51, SUGARS_G) == 1
    assert points_above(45, SUGARS_G) == 9
    assert points_above(45.1, SUGARS_G) == 10


def test_letter_bands():
    assert letter_for(-1) == "A"
    assert letter_for(0) == "B"
    assert letter_for(2) == "B"
    assert letter_for(3) == "C"
    assert letter_for(10) == "C"
    assert letter_for(11) == "D"
    assert letter_for(18) == "D"
    assert letter_for(19) == "E"


def _table(**overrides):
    base = {
        "energy": 100,
        "fat": 1,
        "saturatedFat": 0.5,
        "carbohydrates": 10,
        "sugars": 2,
        "fiber": 0,
        "proteins": 20,
        "salt": 0.1,
    }
    base.update(overrides)
    return base


def test_protein_is_counted_when_negative_points_are_under_11():
    graded = formula_grade(_table())
    assert graded["proteinCounted"] is True
    assert graded["letter"] == "A"
    assert graded["score"] == -4


def test_protein_is_dropped_when_negative_points_reach_11_and_fruit_is_unknown():
    graded = formula_grade(_table(
        energy=600,
        fat=10,
        saturatedFat=6,
        carbohydrates=40,
        sugars=30,
        proteins=20,
        salt=2,
    ))
    assert graded["proteinCounted"] is False
    assert graded["proteinPoints"] == 5
    assert graded["positivePoints"] == 0
    assert graded["negativePoints"] >= 11


def test_all_zero_table_is_formula_b_and_screening_a():
    zeros = {key: 0 for key in (
        "energy", "fat", "saturatedFat", "carbohydrates", "sugars", "fiber", "proteins", "salt",
    )}
    audited = audit_table(zeros)
    assert audited["formula"]["letter"] == "B"
    assert audited["formula"]["score"] == 0
    assert audited["screening"]["letter"] == "A"
    assert audited["lettersAgree"] is False
    assert audited["atwater"]["status"] == "coherent"


def test_atwater_needs_both_gates():
    coherent_gap = atwater(_table(energy=131, fat=1, carbohydrates=10, proteins=20, fiber=0))
    # 4*20 + 4*10 + 9*1 = 129. Gap 2.
    assert coherent_gap["status"] == "coherent"

    # Estimated 192. Gap 21 is above 10% and still under 30 kcal, so it stays coherent.
    band = atwater(_table(energy=213, fat=8, carbohydrates=20, proteins=10, fiber=0, saturatedFat=1, sugars=1))
    # estimated = 40 + 80 + 72 = 192. Gap 21. Relative about 0.109. Absolute under 30.
    assert band["gapKcal"] == 21
    assert band["status"] == "coherent"

    over_both = atwater(_table(energy=223, fat=8, carbohydrates=20, proteins=10, fiber=0, saturatedFat=1, sugars=1))
    assert over_both["gapKcal"] == 31
    assert over_both["status"] == "divergent"

    missing = dict(_table())
    missing["fiber"] = None
    assert atwater(missing)["status"] == "unchecked"


def test_printed_fiber_zero_is_used():
    used = atwater(_table(fiber=0, energy=129, fat=1, carbohydrates=10, proteins=20))
    assert used["estimatedKcal"] == 129
    assert used["status"] == "coherent"


def test_serving_columns_use_the_same_double_threshold():
    quiet = serving_illusion(30, 60, 200)
    # Implied per 100 g = 200. Gap 0.
    assert quiet["columnsDisagree"] is False
    assert quiet["shareOf100g"] == 0.3

    loud = serving_illusion(30, 30, 200)
    # Implied per 100 g = 100. Gap 100 against 200.
    assert loud["columnsDisagree"] is True

    assert serving_illusion(None, 30, 200) is None


def test_one_nutrient_step_can_leave_the_letter():
    # Score 0 is B and one point from A. Raising protein or fiber can add a point.
    audited = audit_table(_table(proteins=0, energy=0, fat=0, saturatedFat=0, carbohydrates=0, sugars=0, fiber=0, salt=0))
    assert audited["formula"]["letter"] == "B"
    assert audited["formula"]["margin"]["points"] == 1
    protein = next(item for item in audited["flips"] if item["nutrient"] == "proteins")
    assert protein["direction"] == "increase"
    assert protein["nextLetter"] == "A"

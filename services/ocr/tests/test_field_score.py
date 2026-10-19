import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.field_score import score_fields
from app.reading_policy import decide_reading


def test_swap_is_not_correct():
    expected = {
        "proteins": {
            "perPortion": {"value": 9, "unit": "g"},
            "per100g": {"value": 18, "unit": "g"},
        }
    }
    swapped = {
        "proteins": {
            "perPortion": {"value": 18, "unit": "g"},
            "per100g": {"value": 9, "unit": "g"},
        }
    }
    scored = score_fields(expected, swapped)
    assert scored["nutrients"]["proteins"] == "swapped"
    assert scored["counts"]["correct"] == 0
    assert "accuracy" not in scored


def test_other_labels():
    expected = {
        "salt": {"perPortion": None, "per100g": {"value": 1, "unit": "g"}},
        "sugars": {"perPortion": None, "per100g": {"value": 5, "unit": "g"}},
        "fiber": {"perPortion": None, "per100g": {"value": 2, "unit": "g"}},
    }
    predicted = {
        "salt": {"perPortion": None, "per100g": {"value": 1000, "unit": "mg"}},
        "energy": {"perPortion": None, "per100g": {"value": 100, "unit": "kcal"}},
        "sugars": {"perPortion": None, "per100g": {"value": 9, "unit": "g"}},
    }
    scored = score_fields(expected, predicted)
    assert scored["nutrients"]["salt"] == "wrong_unit"
    assert scored["nutrients"]["energy"] == "invented"
    assert scored["nutrients"]["fiber"] == "missed"
    assert scored["nutrients"]["sugars"] == "wrong_value"


def test_abstain_names_the_signal():
    decision = decide_reading("unknown", 0.4, ["proteins"])
    assert decision["disposition"] == "abstain"
    assert decision["confidence"]["calibrated"] is False
    assert decision["confidence"]["source"] == "mean_box_confidence"
    assert "column_headings_missing" in decision["reasons"]
    assert "mean_box_confidence_low" in decision["reasons"]
    assert "column_readers_disagree" in decision["reasons"]

    ready = decide_reading("portion-then-100", 0.8, [])
    assert ready["disposition"] == "grade"


if __name__ == "__main__":
    test_swap_is_not_correct()
    test_other_labels()
    test_abstain_names_the_signal()
    print("field score checks passed")

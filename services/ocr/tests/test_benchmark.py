import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.benchmark_eval import evaluate, score_case
from app.benchmark_schema import validate_case, validate_collection
from app.error_taxonomy import TAXONOMY, word_ops


FIXTURES = Path(__file__).resolve().parents[1] / "benchmarks" / "fixtures"


def _load(name: str) -> dict:
    return json.loads((FIXTURES / name).read_text(encoding="utf-8"))


def _codes(row: dict) -> set[str]:
    return {error["code"] for error in row["errors"]}


def _primary(row: dict) -> str | None:
    for error in row["errors"]:
        if error["role"] == "primary":
            return error["code"]
    return None


def test_fixtures_match_the_schema_and_do_not_leak():
    cases = [_load(path.name) for path in sorted(FIXTURES.glob("*.json"))]
    assert cases
    for case in cases:
        assert case["source"] == "synthetic_fixture"
        assert validate_case(case) == []
    collection = validate_collection(cases)
    assert collection["accepted"] is True
    assert collection["split_leakage_product_ids"] == []
    assert set(collection["statistics"]["by_split"]) == {"train", "calibration", "validation", "test"}


def test_same_product_in_two_splits_is_rejected():
    first = _load("fx-clean.json")
    second = _load("fx-swap.json")
    second["product_id"] = first["product_id"]
    second["image_id"] = "fx-swap-copy"
    collection = validate_collection([first, second])
    assert collection["accepted"] is False
    assert first["product_id"] in collection["split_leakage_product_ids"]


def test_duplicate_image_id_is_rejected():
    first = _load("fx-clean.json")
    second = dict(first)
    collection = validate_collection([first, second])
    assert "fx-clean-protein" in collection["duplicate_image_ids"]


def test_taxonomy_on_each_fixture():
    clean = score_case(_load("fx-clean.json"))
    assert clean["field"]["nutrients"]["proteins"] == "correct"
    assert clean["end_to_end_success"] is True
    assert clean["text_errors"]["cer"]["rate"] == 0
    assert clean["errors"] == []

    substitution = score_case(_load("fx-substitution.json"))
    assert substitution["field"]["nutrients"]["proteins"] == "correct"
    assert "ocr_substitution" in _codes(substitution)
    assert substitution["end_to_end_success"] is False

    swap = score_case(_load("fx-swap.json"))
    assert swap["field"]["nutrients"]["proteins"] == "swapped"
    assert _primary(swap) == "incorrect_table_association"

    unit = score_case(_load("fx-unit.json"))
    assert unit["field"]["nutrients"]["salt"] == "wrong_unit"
    assert _primary(unit) == "unit_conversion_error"

    omitted = score_case(_load("fx-omitted.json"))
    assert omitted["field"]["nutrients"]["proteins"] == "missed"
    assert "omitted_text" in _codes(omitted)
    assert "ocr_substitution" in _codes(omitted)

    allergen = score_case(_load("fx-allergen.json"))
    assert _primary(allergen) == "allergen_miss"
    assert allergen["allergens"]["hits"] == 0

    boundary = score_case(_load("fx-boundary.json"))
    assert "ingredient_boundary_error" in _codes(boundary)
    assert _primary(boundary) == "ingredient_boundary_error"

    invented = score_case(_load("fx-invented.json"))
    assert invented["field"]["nutrients"]["salt"] == "invented"
    assert invented["field"]["nutrients"]["proteins"] == "correct"
    assert _primary(invented) == "unsupported_inference"

    for code in _codes(invented) | _codes(boundary) | _codes(allergen):
        assert code in TAXONOMY


def test_word_error_is_token_distance():
    ops = word_ops("oats milk", "rice milk")
    assert ops["distance"] == 1
    assert ops["reference_length"] == 2


def test_photographed_cohort_is_empty_and_separate():
    report = evaluate()
    assert report["invalid_cases"] == []
    assert report["easyocr_invoked"] is False
    assert report["photographed"]["cases"] == 0
    assert report["photographed"]["cer"]["status"] == "unavailable"
    assert report["photographed"]["field_prf"]["status"] == "unavailable"
    assert report["photographed"]["allergen_recall"]["status"] == "unavailable"
    assert report["photographed"]["end_to_end_success"]["status"] == "unavailable"
    assert report["synthetic_fixture"]["cases"] == 8
    assert "precision" in report["synthetic_fixture"]["field_prf"]
    assert "not photographed-label evidence" in report["synthetic_note"]
    constructed = report["constructed_lines"]["languages"]["en"]["counts"]
    assert constructed["correct"] == 5
    assert "CER and WER are unavailable" in report["constructed_note"]


if __name__ == "__main__":
    test_fixtures_match_the_schema_and_do_not_leak()
    test_same_product_in_two_splits_is_rejected()
    test_duplicate_image_id_is_rejected()
    test_taxonomy_on_each_fixture()
    test_word_error_is_token_distance()
    test_photographed_cohort_is_empty_and_separate()
    print("benchmark checks passed")

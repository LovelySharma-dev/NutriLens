import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.calibration import (
    MIN_CALIBRATION_ROWS,
    brier_score,
    coverage_risk_curve,
    evaluate_held_out,
    expected_calibration_error,
    fit_probability_map,
    negative_log_likelihood,
    ocr_score_status,
    temperature_scaling_status,
)


def test_perfectly_balanced_bin_has_zero_ece():
    scores = [0.5] * 10
    outcomes = [1, 1, 1, 1, 1, 0, 0, 0, 0, 0]
    result = expected_calibration_error(scores, outcomes, bins=1)
    assert result["status"] == "computed"
    assert result["ece"] == 0.0


def test_brier_and_nll_on_a_known_pair():
    brier = brier_score([1.0, 0.0], [1, 0])
    assert brier["brier"] == 0.0
    nll = negative_log_likelihood([0.5, 0.5], [1, 0])
    assert nll["status"] == "computed"
    assert nll["nll"] > 0


def test_coverage_risk_abstains_on_the_low_score():
    curve = coverage_risk_curve([0.9, 0.4], [1, 0], steps=2)
    at_half = next(row for row in curve["curve"] if row["threshold"] == 0.5)
    assert at_half["accepted"] == 1
    assert at_half["coverage"] == 0.5
    assert at_half["risk"] == 0.0


def test_a_large_caller_sample_fits_and_is_not_installed():
    scores = [0.2] * 100 + [0.8] * 100
    outcomes = [0] * 100 + [1] * 100
    fitted = fit_probability_map(scores, outcomes)
    assert fitted["status"] == "fit_on_caller_sample"
    assert fitted["method"] == "platt"
    assert fitted["probabilitiesCalibrated"] is False
    assert "not installed" in fitted["reason"]


def test_small_samples_are_not_fit():
    refused = fit_probability_map([0.2, 0.8], [0, 1])
    assert refused["status"] == "unvalidated"
    assert refused["probabilitiesCalibrated"] is False
    assert refused["method"] is None
    assert refused["rows"] < MIN_CALIBRATION_ROWS


def test_temperature_and_ocr_scores_stay_uncalibrated():
    assert temperature_scaling_status()["status"] == "unsupported"
    assert ocr_score_status()["probabilitiesCalibrated"] is False


def test_repository_split_is_unvalidated():
    report = evaluate_held_out()
    assert report["rows"] == 0
    assert report["status"] == "unvalidated"
    assert report["probabilitiesCalibrated"] is False
    assert report["ece"]["status"] == "unavailable"
    assert report["brier"]["status"] == "unavailable"
    assert report["nll"]["status"] == "unavailable"
    assert report["coverageRisk"]["status"] == "unavailable"
    assert report["fit"]["method"] is None


def test_ocr_scores_in_a_file_are_rejected(tmp_path):
    path = tmp_path / "boxes.json"
    path.write_text(
        '{"split":"calibration","scoreSource":"mean_box_confidence","score":0.9,"outcome":1}\n',
        encoding="utf-8",
    )
    report = evaluate_held_out(tmp_path)
    assert report["status"] == "unvalidated"
    assert report["ece"]["status"] == "unavailable"

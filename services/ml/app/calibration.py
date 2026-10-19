"""Calibration and selective-prediction infrastructure.

The published forest exposes `predict_proba` vote shares, not logits.
EasyOCR box scores are a different number. This module will fit Platt
scaling or isotonic regression only when a caller passes a labeled
held-out split that clears the sample gate. Temperature scaling is
refused because there are no logits.

An empty `services/ml/calibration/labels` directory means the NutriLens
map is unvalidated. A unit test may still pass arrays into these
functions. Those arrays are not the photographed calibration set.
"""

from __future__ import annotations

import json
import math
from pathlib import Path

MIN_CALIBRATION_ROWS = 200
MIN_CLASS_ROWS = 20
ISOTONIC_MIN_ROWS = 1000
LABELS_DIR = Path(__file__).resolve().parents[1] / "calibration" / "labels"
ACCEPTED_SCORE_SOURCES = frozenset({"forest_vote_share"})


def temperature_scaling_status() -> dict:
    return {
        "method": "temperature_scaling",
        "status": "unsupported",
        "probabilitiesCalibrated": False,
        "reason": (
            "The published RandomForestClassifier returns a vote share from "
            "predict_proba. The joblib does not expose logits, so temperature "
            "scaling is not applied."
        ),
    }


def ocr_score_status() -> dict:
    return {
        "source": "mean_box_confidence",
        "kind": "heuristic",
        "probabilitiesCalibrated": False,
        "reason": (
            "EasyOCR box scores are not classifier probabilities. Platt scaling, "
            "isotonic regression, and temperature scaling are not fit on them."
        ),
    }


def _as_pairs(scores: list[float], outcomes: list[int]) -> tuple[list[float], list[int]] | dict:
    if len(scores) != len(outcomes):
        return {"status": "invalid", "reason": "scores and outcomes have different lengths"}
    cleaned_scores: list[float] = []
    cleaned_outcomes: list[int] = []
    for score, outcome in zip(scores, outcomes):
        if isinstance(outcome, bool) or outcome not in (0, 1):
            return {"status": "invalid", "reason": "outcomes must be 0 or 1"}
        if not isinstance(score, (int, float)) or not math.isfinite(float(score)):
            return {"status": "invalid", "reason": "scores must be finite numbers"}
        if not 0.0 <= float(score) <= 1.0:
            return {"status": "invalid", "reason": "scores must lie in [0, 1]"}
        cleaned_scores.append(float(score))
        cleaned_outcomes.append(int(outcome))
    return cleaned_scores, cleaned_outcomes


def sample_gate(outcomes: list[int]) -> dict:
    positives = sum(outcomes)
    negatives = len(outcomes) - positives
    if (
        len(outcomes) < MIN_CALIBRATION_ROWS
        or positives < MIN_CLASS_ROWS
        or negatives < MIN_CLASS_ROWS
    ):
        return {
            "status": "unvalidated",
            "probabilitiesCalibrated": False,
            "rows": len(outcomes),
            "positives": positives,
            "negatives": negatives,
            "minimumRows": MIN_CALIBRATION_ROWS,
            "minimumPerClass": MIN_CLASS_ROWS,
            "reason": (
                f"Need at least {MIN_CALIBRATION_ROWS} labeled rows and "
                f"{MIN_CLASS_ROWS} of each outcome before a probability map is fit. "
                f"This split has {len(outcomes)} rows, {positives} correct, {negatives} incorrect."
            ),
        }
    return {
        "status": "sufficient",
        "rows": len(outcomes),
        "positives": positives,
        "negatives": negatives,
    }


def expected_calibration_error(
    scores: list[float],
    outcomes: list[int],
    *,
    bins: int = 10,
) -> dict:
    paired = _as_pairs(scores, outcomes)
    if isinstance(paired, dict):
        return paired
    scores, outcomes = paired
    if not scores:
        return {"status": "unavailable", "reason": "No labeled scores."}
    total = len(scores)
    diagram = []
    ece = 0.0
    for index in range(bins):
        lower = index / bins
        upper = (index + 1) / bins
        chosen = [
            position
            for position, score in enumerate(scores)
            if (lower <= score < upper) or (index == bins - 1 and score == upper)
        ]
        if not chosen:
            diagram.append({"bin": index, "lower": lower, "upper": upper, "count": 0})
            continue
        confidence = sum(scores[position] for position in chosen) / len(chosen)
        frequency = sum(outcomes[position] for position in chosen) / len(chosen)
        ece += (len(chosen) / total) * abs(frequency - confidence)
        diagram.append({
            "bin": index,
            "lower": lower,
            "upper": upper,
            "count": len(chosen),
            "meanScore": round(confidence, 4),
            "outcomeFrequency": round(frequency, 4),
        })
    return {"status": "computed", "ece": round(ece, 4), "bins": bins, "reliabilityDiagram": diagram}


def brier_score(scores: list[float], outcomes: list[int]) -> dict:
    paired = _as_pairs(scores, outcomes)
    if isinstance(paired, dict):
        return paired
    scores, outcomes = paired
    if not scores:
        return {"status": "unavailable", "reason": "No labeled scores."}
    total = sum((score - outcome) ** 2 for score, outcome in zip(scores, outcomes)) / len(scores)
    return {"status": "computed", "brier": round(total, 4), "rows": len(scores)}


def negative_log_likelihood(scores: list[float], outcomes: list[int]) -> dict:
    paired = _as_pairs(scores, outcomes)
    if isinstance(paired, dict):
        return paired
    scores, outcomes = paired
    if not scores:
        return {"status": "unavailable", "reason": "No labeled scores."}
    total = 0.0
    for score, outcome in zip(scores, outcomes):
        clipped = min(max(score, 1e-12), 1 - 1e-12)
        total += outcome * math.log(clipped) + (1 - outcome) * math.log(1 - clipped)
    return {"status": "computed", "nll": round(-total / len(scores), 4), "rows": len(scores)}


def coverage_risk_curve(
    scores: list[float],
    outcomes: list[int],
    *,
    steps: int = 20,
) -> dict:
    paired = _as_pairs(scores, outcomes)
    if isinstance(paired, dict):
        return paired
    scores, outcomes = paired
    if not scores:
        return {"status": "unavailable", "reason": "No labeled scores."}
    curve = []
    total = len(scores)
    for step in range(steps + 1):
        threshold = step / steps
        accepted = [index for index, score in enumerate(scores) if score >= threshold]
        if not accepted:
            curve.append({
                "threshold": round(threshold, 4),
                "accepted": 0,
                "coverage": 0.0,
                "risk": None,
            })
            continue
        errors = sum(1 for index in accepted if outcomes[index] == 0)
        curve.append({
            "threshold": round(threshold, 4),
            "accepted": len(accepted),
            "coverage": round(len(accepted) / total, 4),
            "risk": round(errors / len(accepted), 4),
        })
    return {
        "status": "computed",
        "rows": total,
        "definition": "Risk is the share of accepted rows whose outcome is 0. Coverage is accepted divided by all rows.",
        "curve": curve,
    }


def fit_probability_map(scores: list[float], outcomes: list[int]) -> dict:
    """Fit only past the sample gate. The return value is not installed as the product map."""
    paired = _as_pairs(scores, outcomes)
    if isinstance(paired, dict):
        return {**paired, "probabilitiesCalibrated": False}
    scores, outcomes = paired
    gate = sample_gate(outcomes)
    if gate["status"] != "sufficient":
        return {**gate, "method": None}
    method = "isotonic" if len(outcomes) >= ISOTONIC_MIN_ROWS else "platt"
    try:
        if method == "platt":
            from sklearn.linear_model import LogisticRegression

            model = LogisticRegression()
            model.fit([[score] for score in scores], outcomes)
            coefficient = float(model.coef_[0][0])
            intercept = float(model.intercept_[0])
            fitted = {"coefficient": round(coefficient, 4), "intercept": round(intercept, 4)}
        else:
            from sklearn.isotonic import IsotonicRegression

            model = IsotonicRegression(out_of_bounds="clip")
            model.fit(scores, outcomes)
            fitted = {"thresholds": len(model.X_thresholds_)}
    except Exception as error:
        return {
            "status": "unvalidated",
            "probabilitiesCalibrated": False,
            "method": method,
            "reason": f"The fit raised {type(error).__name__}: {error}",
        }
    return {
        "status": "fit_on_caller_sample",
        "probabilitiesCalibrated": False,
        "method": method,
        "fitted": fitted,
        "rows": len(outcomes),
        "reason": (
            "This map was fit on arrays passed to fit_probability_map. "
            "It is not installed, and it is not a NutriLens photographed calibration "
            "unless those arrays are the held-out split."
        ),
    }


def load_label_rows(directory: Path | None = None) -> list[dict]:
    root = directory or LABELS_DIR
    if not root.exists():
        return []
    rows = []
    for path in sorted(root.glob("*.json")):
        payload = json.loads(path.read_text(encoding="utf-8"))
        if isinstance(payload, list):
            rows.extend(payload)
        elif isinstance(payload, dict):
            rows.append(payload)
    return rows


def evaluate_held_out(directory: Path | None = None) -> dict:
    rows = load_label_rows(directory)
    base = {
        "task": "held-out calibration of NutriLens scores",
        "labelDirectory": str(directory or LABELS_DIR),
        "temperatureScaling": temperature_scaling_status(),
        "ocrScores": ocr_score_status(),
        "probabilitiesCalibrated": False,
    }
    if not rows:
        return {
            **base,
            "status": "unvalidated",
            "rows": 0,
            "ece": {"status": "unavailable", "reason": "No held-out calibration labels are stored."},
            "brier": {"status": "unavailable", "reason": "No held-out calibration labels are stored."},
            "nll": {"status": "unavailable", "reason": "No held-out calibration labels are stored."},
            "coverageRisk": {"status": "unavailable", "reason": "No held-out calibration labels are stored."},
            "fit": {
                "status": "unvalidated",
                "method": None,
                "probabilitiesCalibrated": False,
                "reason": "The calibration label directory has no rows, so no map was fit.",
            },
        }

    rejected = [
        row for row in rows
        if row.get("scoreSource") not in ACCEPTED_SCORE_SOURCES or row.get("split") != "calibration"
    ]
    accepted = [
        row for row in rows
        if row.get("scoreSource") in ACCEPTED_SCORE_SOURCES and row.get("split") == "calibration"
    ]
    if len(accepted) != len(rows) or any(row.get("productSplitLeak") for row in rows):
        return {
            **base,
            "status": "unvalidated",
            "rows": len(rows),
            "acceptedRows": len(accepted),
            "rejectedRows": len(rejected),
            "ece": {"status": "unavailable", "reason": "Rows failed the score-source or split check."},
            "brier": {"status": "unavailable", "reason": "Rows failed the score-source or split check."},
            "nll": {"status": "unavailable", "reason": "Rows failed the score-source or split check."},
            "coverageRisk": {"status": "unavailable", "reason": "Rows failed the score-source or split check."},
            "fit": {
                "status": "unvalidated",
                "method": None,
                "probabilitiesCalibrated": False,
                "reason": "Only forest vote shares in the calibration split are eligible, and OCR scores are excluded.",
            },
        }

    scores = [float(row["score"]) for row in accepted]
    outcomes = [int(row["outcome"]) for row in accepted]
    gate = sample_gate(outcomes)
    if gate["status"] != "sufficient":
        return {
            **base,
            "status": "unvalidated",
            "rows": len(accepted),
            "ece": {"status": "unavailable", "reason": gate["reason"]},
            "brier": {"status": "unavailable", "reason": gate["reason"]},
            "nll": {"status": "unavailable", "reason": gate["reason"]},
            "coverageRisk": {"status": "unavailable", "reason": gate["reason"]},
            "fit": {**gate, "method": None},
        }
    return {
        **base,
        "status": "computed",
        "rows": len(accepted),
        "ece": expected_calibration_error(scores, outcomes),
        "brier": brier_score(scores, outcomes),
        "nll": negative_log_likelihood(scores, outcomes),
        "coverageRisk": coverage_risk_curve(scores, outcomes),
        "fit": fit_probability_map(scores, outcomes),
        "note": "probabilitiesCalibrated stays false until a fit is reviewed and installed. This script does not install one.",
    }

"""Score annotated label rows with the existing parser and field scorer.

Photographed rows, synthetic fixtures, and constructed text lines are
three cohorts. Metrics from one cohort are not copied into another.
Character and word error rates are computed only when a row stores both
a reference transcription (`ocr_text`) and a separate hypothesis
(`observed_text`). This module does not call EasyOCR.
"""

from __future__ import annotations

import csv
import json
from collections import Counter
from pathlib import Path
from typing import Any

from app.benchmark_schema import SCHEMA_VERSION, validate_case, validate_collection
from app.error_taxonomy import assign_errors, levenshtein_ops, word_ops
from app.field_score import LABELS, fields_from_parse, score_fields
from app.label_parser import parse_label
from scripts.score_constructed import NOTE as CONSTRUCTED_NOTE
from scripts.score_constructed import score_constructed

SERVICE_ROOT = Path(__file__).resolve().parents[1]
PHOTOGRAPHED = SERVICE_ROOT / "benchmarks" / "photographed"
FIXTURES = SERVICE_ROOT / "benchmarks" / "fixtures"
REPORT_DIR = SERVICE_ROOT / "benchmarks" / "reports"


def load_cases(directory: Path) -> list[tuple[Path, dict[str, Any]]]:
    rows: list[tuple[Path, dict[str, Any]]] = []
    if not directory.exists():
        return rows
    for path in sorted(directory.glob("*.json")):
        rows.append((path, json.loads(path.read_text(encoding="utf-8"))))
    return rows


def _parser_input(case: dict[str, Any]) -> tuple[str | None, str]:
    observed = case.get("observed_text")
    if isinstance(observed, str):
        return observed, "observed_text"
    if isinstance(case.get("ocr_text"), str):
        return case["ocr_text"], "ocr_text_as_parser_input"
    return None, "unavailable"


def _rate(numerator: int, denominator: int) -> dict[str, Any] | None:
    if denominator <= 0:
        return None
    return {
        "numerator": numerator,
        "denominator": denominator,
        "rate": round(numerator / denominator, 4),
    }


def _prf(true_positive: int, false_positive: int, false_negative: int) -> dict[str, Any]:
    precision = _rate(true_positive, true_positive + false_positive)
    recall = _rate(true_positive, true_positive + false_negative)
    f1 = None
    if precision and recall and (precision["rate"] + recall["rate"]) > 0:
        harmonic = 2 * precision["rate"] * recall["rate"] / (precision["rate"] + recall["rate"])
        f1 = round(harmonic, 4)
    return {
        "true_positive": true_positive,
        "false_positive": false_positive,
        "false_negative": false_negative,
        "precision": precision,
        "recall": recall,
        "f1": f1,
    }


def _tokens(values: list[Any]) -> list[str]:
    return [str(value).casefold() for value in values]


def score_case(case: dict[str, Any]) -> dict[str, Any]:
    parser_text, parser_source = _parser_input(case)
    parsed = parse_label(parser_text or "")
    expected = case.get("nutrition") if isinstance(case.get("nutrition"), dict) else {}
    field = score_fields(expected, fields_from_parse(parsed["nutrition"]))
    reference = case.get("ocr_text") if isinstance(case.get("ocr_text"), str) else None
    observed = case.get("observed_text") if isinstance(case.get("observed_text"), str) else None
    text_errors = None
    if reference is not None and observed is not None and reference != "":
        characters = levenshtein_ops(reference, observed)
        words = word_ops(reference, observed)
        text_errors = {
            "cer": _rate(characters["distance"], characters["reference_length"]),
            "wer": _rate(words["distance"], words["reference_length"]),
            "note": "Edit distance between ocr_text and observed_text. This is not an EasyOCR run.",
        }
    expected_allergens = [str(item) for item in case.get("allergens") or []]
    parsed_allergens = [str(item) for item in parsed.get("allergens") or []]
    found = set(_tokens(parsed_allergens))
    allergen_hits = sum(1 for item in expected_allergens if item.casefold() in found)
    expected_ingredients = [str(item) for item in case.get("ingredients") or []]
    parsed_ingredients = [str(item) for item in parsed.get("ingredients") or []]
    errors = assign_errors(
        field_labels=field["nutrients"],
        reference_text=reference,
        observed_text=observed,
        expected_ingredients=expected_ingredients,
        parsed_ingredients=parsed_ingredients,
        expected_allergens=expected_allergens,
        parsed_allergens=parsed_allergens,
    )
    ingredients_match = _tokens(expected_ingredients) == _tokens(parsed_ingredients)
    nutrition_ok = (
        field["scored"] > 0
        and field["counts"]["correct"] == field["scored"]
        and field["counts"]["invented"] == 0
    ) or (field["scored"] == 0 and not expected)
    allergens_ok = allergen_hits == len(expected_allergens)
    end_to_end = bool(nutrition_ok and ingredients_match and allergens_ok)
    return {
        "image_id": case.get("image_id"),
        "product_id": case.get("product_id"),
        "source": case.get("source"),
        "split": case.get("split"),
        "parser_input": parser_source,
        "field": field,
        "text_errors": text_errors,
        "allergens": {
            "expected": len(expected_allergens),
            "hits": allergen_hits,
            "predicted": len(parsed_allergens),
        },
        "ingredients_match": ingredients_match,
        "errors": errors,
        "end_to_end_success": end_to_end,
        "parsed_allergens": parsed_allergens,
        "parsed_ingredients": parsed_ingredients,
    }


def _unavailable(reason: str) -> dict[str, Any]:
    return {"status": "unavailable", "reason": reason}


def summarize_rows(rows: list[dict[str, Any]], *, cohort: str, empty_reason: str) -> dict[str, Any]:
    if not rows:
        return {
            "cohort": cohort,
            "cases": 0,
            "field_counts": {label: 0 for label in LABELS},
            "field_prf": _unavailable(empty_reason),
            "cer": _unavailable(empty_reason),
            "wer": _unavailable(empty_reason),
            "numeric_per100g": _unavailable(empty_reason),
            "unit_normalization_errors": _unavailable(empty_reason),
            "allergen_recall": _unavailable(empty_reason),
            "end_to_end_success": _unavailable(empty_reason),
            "taxonomy": {},
            "rows": [],
        }

    counts = {label: 0 for label in LABELS}
    true_positive = false_positive = false_negative = 0
    cer_distance = cer_length = 0
    wer_distance = wer_length = 0
    cer_cases = 0
    numeric_hits = numeric_expected = 0
    unit_errors = 0
    allergen_hits = allergen_expected = 0
    successes = 0
    taxonomy: Counter[str] = Counter()

    for row in rows:
        field_counts = row["field"]["counts"]
        for label, count in field_counts.items():
            counts[label] += count
        true_positive += field_counts["correct"]
        false_positive += (
            field_counts["swapped"]
            + field_counts["wrong_unit"]
            + field_counts["wrong_value"]
            + field_counts["invented"]
        )
        false_negative += (
            field_counts["missed"]
            + field_counts["swapped"]
            + field_counts["wrong_unit"]
            + field_counts["wrong_value"]
        )
        unit_errors += field_counts["wrong_unit"]
        text_errors = row["text_errors"]
        if text_errors and text_errors["cer"] and text_errors["wer"]:
            cer_cases += 1
            cer_distance += text_errors["cer"]["numerator"]
            cer_length += text_errors["cer"]["denominator"]
            wer_distance += text_errors["wer"]["numerator"]
            wer_length += text_errors["wer"]["denominator"]
        allergen_hits += row["allergens"]["hits"]
        allergen_expected += row["allergens"]["expected"]
        if row["end_to_end_success"]:
            successes += 1
        for error in row["errors"]:
            taxonomy[error["code"]] += 1
        for nutrient, label in row["field"]["nutrients"].items():
            if label == "correct":
                numeric_hits += 1
                numeric_expected += 1
            elif label in {"missed", "swapped", "wrong_unit", "wrong_value"}:
                numeric_expected += 1

    no_hypothesis = "No row stored both ocr_text and observed_text, so edit distance was not computed."
    no_fields = "No nutrition field was scored."
    no_allergens = "No allergens were annotated, so recall has an empty denominator."
    return {
        "cohort": cohort,
        "cases": len(rows),
        "field_counts": counts,
        "field_prf": _prf(true_positive, false_positive, false_negative) if (true_positive + false_positive + false_negative) else _unavailable(no_fields),
        "cer": _rate(cer_distance, cer_length) if cer_cases else _unavailable(no_hypothesis),
        "wer": _rate(wer_distance, wer_length) if cer_cases else _unavailable(no_hypothesis),
        "cer_cases": cer_cases,
        "numeric_per100g": _rate(numeric_hits, numeric_expected) if numeric_expected else _unavailable(no_fields),
        "unit_normalization_errors": {"count": unit_errors, "scored_fields": sum(counts.values())},
        "allergen_recall": _rate(allergen_hits, allergen_expected) if allergen_expected else _unavailable(no_allergens),
        "end_to_end_success": _rate(successes, len(rows)),
        "taxonomy": dict(sorted(taxonomy.items())),
        "rows": rows,
    }


def _strip_rows(summary: dict[str, Any]) -> dict[str, Any]:
    public = dict(summary)
    public["rows"] = [
        {
            "image_id": row["image_id"],
            "product_id": row["product_id"],
            "split": row["split"],
            "parser_input": row["parser_input"],
            "nutrients": row["field"]["nutrients"],
            "text_errors": row["text_errors"],
            "allergens": row["allergens"],
            "ingredients_match": row["ingredients_match"],
            "errors": row["errors"],
            "end_to_end_success": row["end_to_end_success"],
        }
        for row in summary["rows"]
    ]
    return public


def evaluate() -> dict[str, Any]:
    photographed_files = load_cases(PHOTOGRAPHED)
    fixture_files = load_cases(FIXTURES)
    photographed_cases = []
    fixture_cases = []
    invalid: list[dict[str, Any]] = []

    for path, case in photographed_files:
        errors = validate_case(case, path=path)
        if case.get("source") != "photographed":
            errors.append("files in benchmarks/photographed must use source photographed")
        if errors:
            invalid.append({"file": str(path.relative_to(SERVICE_ROOT)), "errors": errors})
        else:
            photographed_cases.append(case)

    for path, case in fixture_files:
        errors = validate_case(case, path=path)
        if case.get("source") != "synthetic_fixture":
            errors.append("files in benchmarks/fixtures must use source synthetic_fixture")
        if errors:
            invalid.append({"file": str(path.relative_to(SERVICE_ROOT)), "errors": errors})
        else:
            fixture_cases.append(case)

    photographed_summary = summarize_rows(
        [score_case(case) for case in photographed_cases],
        cohort="photographed",
        empty_reason=(
            "benchmarks/photographed has no valid annotated photographs. "
            "End-to-end rates on real packets are unmeasured."
        ),
    )
    fixture_summary = summarize_rows(
        [score_case(case) for case in fixture_cases],
        cohort="synthetic_fixture",
        empty_reason="benchmarks/fixtures has no synthetic rows.",
    )
    return {
        "schema_version": SCHEMA_VERSION,
        "easyocr_invoked": False,
        "invalid_cases": invalid,
        "photographed_validation": validate_collection(photographed_cases),
        "fixture_validation": validate_collection(fixture_cases),
        "photographed": _strip_rows(photographed_summary),
        "synthetic_fixture": _strip_rows(fixture_summary),
        "synthetic_note": (
            "Synthetic fixture metrics are parser checks on authored text. "
            "They are not photographed-label evidence."
        ),
        "constructed_lines": score_constructed(),
        "constructed_note": CONSTRUCTED_NOTE + " CER and WER are unavailable: each file has one text field and no separate OCR hypothesis.",
        "unavailable_on_photographs": [
            "character error rate",
            "word error rate",
            "field precision, recall, and F1",
            "numeric per-100 g accuracy",
            "unit-normalization error count",
            "allergen recall",
            "end-to-end task success",
            "error-taxonomy rates",
        ],
    }


def _metric_line(name: str, value: Any) -> str:
    if isinstance(value, dict) and value.get("status") == "unavailable":
        return f"- {name}: unavailable. {value['reason']}"
    if isinstance(value, dict) and "rate" in value:
        return f"- {name}: {value['numerator']} / {value['denominator']} = {value['rate']}"
    if isinstance(value, dict) and "precision" in value:
        precision = value["precision"]["rate"] if value["precision"] else "unavailable"
        recall = value["recall"]["rate"] if value["recall"] else "unavailable"
        return (
            f"- {name}: precision {precision}, recall {recall}, F1 {value['f1']}. "
            f"Counts tp {value['true_positive']}, fp {value['false_positive']}, fn {value['false_negative']}."
        )
    if isinstance(value, dict) and "count" in value:
        return f"- {name}: {value['count']} of {value['scored_fields']} scored fields"
    return f"- {name}: {json.dumps(value, ensure_ascii=False)}"


def render_markdown(report: dict[str, Any]) -> str:
    photo = report["photographed"]
    synthetic = report["synthetic_fixture"]
    lines = [
        "# Baseline evaluation",
        "",
        "Generated by `services/ocr/scripts/score_benchmark.py`.",
        f"Schema `{report['schema_version']}`. EasyOCR invoked: {str(report['easyocr_invoked']).lower()}.",
        "",
        "## Photographed labels",
        "",
        f"Valid rows: {photo['cases']}.",
        "",
    ]
    if photo["cases"] == 0:
        lines.append("No photographed ground truth is in the repository. The following are unmeasured:")
        lines.append("")
        for name in report["unavailable_on_photographs"]:
            lines.append(f"- {name}")
        lines.append("")
    else:
        lines.extend(_cohort_lines(photo))
    lines.extend([
        "## Synthetic fixtures",
        "",
        report["synthetic_note"],
        "",
        "Condition labels on these rows are slots in the schema. They are not measurements of blur, glare, or occlusion on a photograph.",
        "",
    ])
    lines.extend(_cohort_lines(synthetic))
    constructed = report["constructed_lines"]
    lines.extend([
        "## Constructed text lines",
        "",
        report["constructed_note"],
        "",
        f"Cases: {len(constructed['cases'])}.",
        "",
    ])
    for language, bucket in sorted(constructed["languages"].items()):
        counts = bucket["counts"]
        lines.append(
            f"- {language}: {bucket['cases']} cases, correct {counts['correct']}, "
            f"missed {counts['missed']}, swapped {counts['swapped']}, "
            f"wrong_unit {counts['wrong_unit']}, invented {counts['invented']}, "
            f"wrong_value {counts['wrong_value']}"
        )
    lines.extend([
        "",
        "## Validation",
        "",
        f"Invalid files: {len(report['invalid_cases'])}.",
        f"Fixture collection accepted: {str(report['fixture_validation']['accepted']).lower()}.",
        f"Photographed collection accepted: {str(report['photographed_validation']['accepted']).lower()}.",
        "",
        "Split leakage is a shared `product_id` in more than one of train, calibration, validation, and test.",
        "",
    ])
    return "\n".join(lines) + "\n"


def _cohort_lines(summary: dict[str, Any]) -> list[str]:
    if summary["cases"] == 0:
        return ["No rows.", ""]
    return [
        f"Cases: {summary['cases']}.",
        "",
        _metric_line("Field precision / recall / F1", summary["field_prf"]),
        _metric_line("Character error rate", summary["cer"]),
        _metric_line("Word error rate", summary["wer"]),
        _metric_line("Numeric field match", summary["numeric_per100g"]),
        _metric_line("Unit-normalization errors", summary["unit_normalization_errors"]),
        _metric_line("Allergen recall", summary["allergen_recall"]),
        _metric_line("End-to-end task success", summary["end_to_end_success"]),
        f"- Taxonomy counts: {json.dumps(summary['taxonomy'], ensure_ascii=False)}",
        "",
        "End-to-end success on a row means every scored nutrition field is `correct`, the ingredient tokens match, and every annotated allergen was returned by `extract_allergens`. It does not mean the food is safe. Grade disposition is not part of this rate: these rows have no EasyOCR box confidence.",
        "",
    ]


def write_reports(report: dict[str, Any]) -> dict[str, str]:
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    json_path = REPORT_DIR / "baseline.json"
    csv_path = REPORT_DIR / "baseline_fields.csv"
    markdown_path = SERVICE_ROOT.parents[1] / "docs" / "evaluation" / "BASELINE_REPORT.md"
    markdown_path.parent.mkdir(parents=True, exist_ok=True)
    json_path.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    with csv_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=[
            "cohort", "image_id", "product_id", "split", "nutrient", "field_label", "end_to_end_success",
        ])
        writer.writeheader()
        for cohort_name in ("photographed", "synthetic_fixture"):
            for row in report[cohort_name]["rows"]:
                nutrients = row["nutrients"] or {"": ""}
                for nutrient, label in nutrients.items():
                    writer.writerow({
                        "cohort": cohort_name,
                        "image_id": row["image_id"],
                        "product_id": row["product_id"],
                        "split": row["split"],
                        "nutrient": nutrient,
                        "field_label": label,
                        "end_to_end_success": row["end_to_end_success"],
                    })
    markdown_path.write_text(render_markdown(report), encoding="utf-8")
    return {"json": str(json_path), "csv": str(csv_path), "markdown": str(markdown_path)}

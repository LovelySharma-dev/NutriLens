"""Photographed-label annotation schema, version photographed-label-1.

Synthetic fixtures and real photographs share this schema. A row's
`source` decides which report section may cite it. Validation never
turns a missing photograph into a score.
"""

from __future__ import annotations

import hashlib
from collections import Counter
from pathlib import Path
from typing import Any

SCHEMA_VERSION = "photographed-label-1"
SOURCES = frozenset({"photographed", "synthetic_fixture"})
SPLITS = frozenset({"train", "calibration", "validation", "test"})
CONDITIONS = frozenset({
    "blur",
    "glare",
    "rotation",
    "low_light",
    "perspective",
    "curvature",
    "crop",
    "occlusion",
})
SYNTHETIC_CONSENT = "synthetic-not-a-real-package"
REQUIRED = (
    "schema_version",
    "image_id",
    "product_id",
    "source",
    "image_source",
    "license",
    "consent",
    "annotation_version",
    "split",
    "conditions",
    "ocr_text",
    "nutrition",
    "ingredients",
    "allergens",
)


def _nonempty_string(value: Any) -> bool:
    return isinstance(value, str) and bool(value.strip())


def validate_case(case: dict[str, Any], *, path: Path | None = None) -> list[str]:
    """Return human-readable errors. An empty list means the row is usable."""
    errors: list[str] = []
    if not isinstance(case, dict):
        return ["case is not an object"]

    for key in REQUIRED:
        if key not in case:
            errors.append(f"missing {key}")

    if case.get("schema_version") != SCHEMA_VERSION:
        errors.append(f"schema_version must be {SCHEMA_VERSION}")
    if not _nonempty_string(case.get("image_id")):
        errors.append("image_id must be a non-empty string")
    if not _nonempty_string(case.get("product_id")):
        errors.append("product_id must be a non-empty string")
    if case.get("source") not in SOURCES:
        errors.append(f"source must be one of {sorted(SOURCES)}")
    if not _nonempty_string(case.get("image_source")):
        errors.append("image_source must name where the image came from")
    if not _nonempty_string(case.get("license")):
        errors.append("license is required")
    if not _nonempty_string(case.get("consent")):
        errors.append("consent is required")
    if not _nonempty_string(case.get("annotation_version")):
        errors.append("annotation_version is required")
    if case.get("split") not in SPLITS:
        errors.append(f"split must be one of {sorted(SPLITS)}")

    conditions = case.get("conditions")
    if not isinstance(conditions, list):
        errors.append("conditions must be a list")
    else:
        unknown = sorted({item for item in conditions if item not in CONDITIONS})
        if unknown:
            errors.append(f"unknown conditions: {', '.join(unknown)}")

    ocr_text = case.get("ocr_text")
    if not isinstance(ocr_text, str) or ocr_text == "":
        errors.append("ocr_text must be a non-empty reference transcription")
        ocr_text = ""

    if "observed_text" in case and case["observed_text"] is not None and not isinstance(case["observed_text"], str):
        errors.append("observed_text must be a string or null")

    if not isinstance(case.get("nutrition"), dict):
        errors.append("nutrition must be an object")
    if not isinstance(case.get("ingredients"), list):
        errors.append("ingredients must be a list")
    if not isinstance(case.get("allergens"), list):
        errors.append("allergens must be a list")

    source = case.get("source")
    if source == "synthetic_fixture" and case.get("consent") != SYNTHETIC_CONSENT:
        errors.append(f"synthetic_fixture consent must be {SYNTHETIC_CONSENT}")
    if source == "photographed" and case.get("consent") == SYNTHETIC_CONSENT:
        errors.append("photographed consent cannot use the synthetic fixture sentence")
    if source == "photographed" and str(case.get("license", "")).strip().lower() in {"", "unknown", "n/a", "none"}:
        errors.append("photographed license is missing")

    spans = case.get("ingredient_spans", [])
    if spans is None:
        spans = []
    if not isinstance(spans, list):
        errors.append("ingredient_spans must be a list")
    else:
        for index, span in enumerate(spans):
            if not isinstance(span, dict):
                errors.append(f"ingredient_spans[{index}] is not an object")
                continue
            start, end, text = span.get("start"), span.get("end"), span.get("text")
            if not isinstance(start, int) or not isinstance(end, int) or not isinstance(text, str):
                errors.append(f"ingredient_spans[{index}] needs integer start, end, and text")
                continue
            if start < 0 or end < start or end > len(ocr_text) or ocr_text[start:end] != text:
                errors.append(f"ingredient_spans[{index}] does not match ocr_text")

    image_path = case.get("image_path")
    if image_path not in (None, "") :
        if not isinstance(image_path, str):
            errors.append("image_path must be a string or null")
        elif path is None:
            errors.append("image_path is set but the case has no file location")
        else:
            resolved = (path.parent / image_path).resolve()
            if not resolved.is_file():
                errors.append(f"image file not found: {image_path}")
            else:
                digest = case.get("image_sha256")
                if _nonempty_string(digest):
                    actual = hashlib.sha256(resolved.read_bytes()).hexdigest()
                    if actual != digest:
                        errors.append("image_sha256 does not match the file")

    return errors


def validate_collection(cases: list[dict[str, Any]]) -> dict[str, Any]:
    """Split leakage, duplicate ids, and dataset statistics.

    `product_id` is the split key. Two rows for one physical package, or
    one synthetic product, must share a single split.
    """
    id_counts: Counter[str] = Counter()
    hash_counts: Counter[str] = Counter()
    splits_for_product: dict[str, set[str]] = {}
    row_errors: list[dict[str, Any]] = []

    for case in cases:
        image_id = str(case.get("image_id", ""))
        if image_id:
            id_counts[image_id] += 1
        digest = case.get("image_sha256")
        if isinstance(digest, str) and digest.strip():
            hash_counts[digest] += 1
        product_id = case.get("product_id")
        split = case.get("split")
        if isinstance(product_id, str) and product_id and isinstance(split, str):
            splits_for_product.setdefault(product_id, set()).add(split)
        errors = validate_case(case)
        if errors:
            row_errors.append({"image_id": image_id, "errors": errors})

    duplicate_ids = sorted(image_id for image_id, count in id_counts.items() if count > 1)
    duplicate_hashes = sorted(digest for digest, count in hash_counts.items() if count > 1)
    leakage = sorted(
        product_id
        for product_id, splits in splits_for_product.items()
        if len(splits) > 1
    )

    return {
        "schema_version": SCHEMA_VERSION,
        "cases": len(cases),
        "row_errors": row_errors,
        "duplicate_image_ids": duplicate_ids,
        "duplicate_image_sha256": duplicate_hashes,
        "split_leakage_product_ids": leakage,
        "statistics": dataset_statistics(cases),
        "accepted": not row_errors and not duplicate_ids and not duplicate_hashes and not leakage,
    }


def dataset_statistics(cases: list[dict[str, Any]]) -> dict[str, Any]:
    by_source: Counter[str] = Counter()
    by_split: Counter[str] = Counter()
    by_condition: Counter[str] = Counter()
    missing_observed = 0
    missing_image = 0
    missing_hash = 0
    for case in cases:
        by_source[str(case.get("source"))] += 1
        by_split[str(case.get("split"))] += 1
        conditions = case.get("conditions")
        if isinstance(conditions, list) and conditions:
            for condition in conditions:
                by_condition[str(condition)] += 1
        else:
            by_condition["(none)"] += 1
        if not isinstance(case.get("observed_text"), str):
            missing_observed += 1
        if not case.get("image_path"):
            missing_image += 1
        if not case.get("image_sha256"):
            missing_hash += 1
    return {
        "by_source": dict(sorted(by_source.items())),
        "by_split": dict(sorted(by_split.items())),
        "by_condition": dict(sorted(by_condition.items())),
        "missing_observed_text": missing_observed,
        "missing_image_path": missing_image,
        "missing_image_sha256": missing_hash,
    }

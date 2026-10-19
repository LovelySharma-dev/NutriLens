# Dataset card: photographed-label-1

**Date:** 19 October 2026  
**Schema:** `photographed-label-1`, checked by `validate_case` and `validate_collection` in `services/ocr/app/benchmark_schema.py`.

## What is in the repository

| Cohort | Path | Rows | What it is |
| --- | --- | --- | --- |
| Photographed | `services/ocr/benchmarks/photographed/` | 0 images, 0 JSON annotations | Reserved for real packets. Empty on purpose. |
| Synthetic fixtures | `services/ocr/benchmarks/fixtures/` | 8 JSON files | Authored text used by `services/ocr/tests/test_benchmark.py`. Not photographs. |
| Constructed lines | `services/ocr/benchmarks/constructed/` | 25 JSON files | Text lines for `parse_label`. Not photographs. |

No image file was added for this schema. `docs/samples/sample_food_label.jpg` and `docs/samples/images.jpg` are still unannotated and are not part of this dataset.

## Row fields

Required: `schema_version`, `image_id`, `product_id`, `source` (`photographed` or `synthetic_fixture`), `image_source`, `license`, `consent`, `annotation_version`, `split` (`train`, `calibration`, `validation`, `test`), `conditions`, `ocr_text`, `nutrition`, `ingredients`, `allergens`.

Optional: `observed_text` (hypothesis separate from the reference), `image_path`, `image_sha256`, `ingredient_spans` (`start`/`end` into `ocr_text`), `parsing_errors`, `language`, `reading`.

`conditions` may be empty. Otherwise each item is one of `blur`, `glare`, `rotation`, `low_light`, `perspective`, `curvature`, `crop`, `occlusion`. On a synthetic fixture these are schema slots, not a measurement that the text was blurred or occluded.

## Splits and leakage

`product_id` is the split key. `validate_collection` rejects a product id that appears in more than one split, a repeated `image_id`, and a repeated `image_sha256`. A file under `benchmarks/photographed/` must use `source: photographed`. A file under `benchmarks/fixtures/` must use `source: synthetic_fixture` and `consent: synthetic-not-a-real-package`.

## Permissions

Do not commit a photograph until `license` and `consent` say the repository may keep it. Do not scrape or copy a restricted dataset into `benchmarks/photographed/`. Synthetic rows use `license: internal-synthetic`.

## What can be scored today

`python scripts/score_benchmark.py` from `services/ocr` runs `parse_label` and `score_fields`. It does not call EasyOCR.

Photographed CER, WER, field precision/recall/F1, numeric match, unit errors, allergen recall, and end-to-end success are unavailable because that directory has no rows. The numbers that do exist are in `docs/evaluation/BASELINE_REPORT.md`, and the synthetic section of that report is not a real-world result.

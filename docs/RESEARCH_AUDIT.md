# NutriLens research audit

**Date:** 19 October 2026  
**Update:** The schema and `score_benchmark` from section 1.1 are now implemented. Photographed metrics are still unmeasured; see `docs/evaluation/BASELINE_REPORT.md`. `extractOcrController` no longer stores an invented label when OCR fails.  
**Scope:** The inspection below was written before that implementation.  
**Direction:** Uncertainty-aware food label intelligence: calibrated prediction, selective abstention, and evaluation on real photographs of packaged labels.  
**Product:** NutriLens. Repository name: NutriTrust.

Every number in this file is tied to the check that produced it. This repository does not contain a photographed-label accuracy, an expected calibration error, a Brier score, or a claim-verification rate. Those quantities are not estimated here.

Companions already in the tree: `docs/research/NUTRILENS_FINDINGS.md`, `docs/research/NUTRILENS_PAPER.md`.

## 1. Smallest architecture changes

The current pipeline can host both a real-photo benchmark and an abstention layer. A new service, a new OCR engine, a retrained forest, and a calibration fit are not required for the first increment. Calibration stays unwarranted until a calibration split of photographed correctness labels exists.

### 1.1 Real-photo benchmark

Keep the scorer that already exists.

| Keep | Role |
| --- | --- |
| `services/ocr/app/field_score.py` `classify_nutrient`, `score_fields`, `fields_from_parse`, `LABELS` | Field labels `correct`, `missed`, `swapped`, `wrong_unit`, `invented`, `wrong_value`. `score_fields` does not emit an accuracy percentage. |
| `services/ocr/scripts/score_constructed.py` `load_cases`, `score_constructed` | Scores `services/ocr/benchmarks/constructed/*.json` by calling `parse_label` then `fields_from_parse` then `score_fields`. |
| `services/ocr/app/label_parser.py` `parse_label` | The parser the constructed scorer and the live OCR route both use. |

Add files beside that scorer. Do not point them at a new backend.

1. `services/ocr/benchmarks/photographed/` for real packets, and `services/ocr/benchmarks/fixtures/` for synthetic rows used only by tests. Leave `benchmarks/constructed/` as the text-line set it already is.
2. A schema checker, `services/ocr/app/benchmark_schema.py`, with one function `validate_case`. Required keys on every row: `image_id`, `product_id`, `source`, `license`, `consent`, `annotation_version`, `split`, `conditions`, `ocr_text`, `nutrition`, `ingredients`, `allergens`. `source` is `photographed` or `synthetic_fixture`. `split` is `train`, `calibration`, `validation`, or `test`. `conditions` is a list drawn from `blur`, `glare`, `rotation`, `low_light`, `perspective`, `curvature`, `crop`, `occlusion`. `product_id` is the split key: two rows with the same `product_id` must share one split.
3. `services/ocr/scripts/score_benchmark.py` `score_benchmark`. It calls `validate_case`, then the same `parse_label` → `fields_from_parse` → `score_fields` chain as `score_constructed`. Photographed rows and `synthetic_fixture` rows are written to separate JSON and CSV sections. If `benchmarks/photographed/` is empty, the photographed section is an empty list and the report says end-to-end rates are unmeasured. Constructed-line counts must not be copied into that section.
4. Character and word error rates as two functions next to `score_fields`, using the reference `ocr_text` and the hypothesis text. Skip a row when either string is absent. Do not add an OCR or edit-distance package for this. `easyocr` is already the live engine in `services/ocr/app/main.py` `extract_text`; the benchmark script should call `parse_label` on stored hypothesis text so a metric run does not require a GPU or a model download. An optional image pass can call `extract_text` later. It is not part of the smallest schema.
5. One behavior fix before any photograph is scored through the API: `extractOcrController` in `services/api/src/controllers/ocr.controller.ts`. The `catch` around `extractLabelWithOcr` currently returns `status: "success"`, `engine: "Fallback-Engine"`, `confidence: 0.88`, and a fixed `parsedLabel` (serving size 50, energy 440 kcal, sugars 24 g, fat 6 g, saturated fat 2 g, protein 16 g, salt 0.6 g, ingredients, allergen `"Milk"`, claim `"High Protein"`). That branch should return the existing error JSON (`status: "error"`) and write no scan. `apps/web/app/dashboard/page.tsx` already throws when `ocrResponse.ok` is false or `ocrResult.status !== "success"`.

Provenance rule for any file placed under `benchmarks/photographed/`: `license` and `consent` are required, and the checker rejects a row that lacks them. Do not scrape or commit a restricted image to satisfy the schema.

### 1.2 Uncertainty-aware abstention

Abstention already exists. Extend it. Do not wrap EasyOCR scores in temperature scaling, Platt scaling, or isotonic regression. `decide_reading` already sets `confidence.calibrated` to `False`. `predict_nutri_score` returns `predict_proba` as `probabilities`. That vector is a forest vote share. Nothing in the repository fits a map from that share to a frequency of correctness.

| Keep | Role |
| --- | --- |
| `services/ocr/app/reading_policy.py` `MEAN_BOX_ABSTAIN` (0.55), `READING_POLICY_VERSION` (`"reading-policy-1"`), `decide_reading` | Three reasons: `column_headings_missing`, `mean_box_confidence_low`, `column_readers_disagree`. Disposition `abstain` or `grade`. |
| `services/api/src/services/reading-policy.ts` `abstainReasons`, `describeAbstain` | Same three reasons, mirrored for `analyzeScan`. |
| `services/ml/app/main.py` `predict_nutri_score` | HTTP 422 with `reason: "missing"` or `reason: "implausible"`. `imputedFeatures` is `None`. |
| `services/api/src/services/nutrition-prediction.service.ts` `predictNutrition`, `describeWithheldGrade`, `findImplausibleNutrition` | Withholds when `getMissingNutritionFeatures` is non-empty, serving size was not read, or a ceiling fails. |
| `services/ml/app/sensitivity.py` `CEILINGS`, `implausible_issues` | Energy 900 kcal; fat, saturated fat, carbohydrates, sugars, fiber, protein 100 g; salt 15 g. Saturated fat may not exceed fat, and sugars may not exceed carbohydrates, by more than 0.5 g. |

Add optional fields. Do not rename `disposition`, `nutritionPrediction.status`, or `imputedFeatures`.

1. In `decide_reading`, add `decision` and `reasons` while leaving `disposition` in place.
   - `insufficient_evidence` when the OCR call failed, `combined_text` is empty, or `predictNutrition` returns a `withheld` object because a required feature or the serving size is missing.
   - `review_required` when `decide_reading` already appends any of its three reasons, when `findImplausibleNutrition` / `implausible_issues` is non-empty, or when a nutrient `sourceText` starts with `"estimated from sodium:"` (`label_parser.py`, inside `_finalize_nutrition`).
   - `reliable` only when the grade path would return a letter and none of those reasons fired. `reliable` means the table passed these rules. It does not mean the food is safe, and `confidence.calibrated` stays `false`.
2. Mirror the same `decision` string in `abstainReasons` / `describeAbstain`, and attach it in `analyzeScan` next to the existing `nutritionPrediction.status` (`READY`, `WITHHELD`, `UNAVAILABLE`). `WITHHELD` remains the status whenever `decision` is `review_required` or `insufficient_evidence`.
3. On the ML JSON from `predict_nutri_score`, add `probabilitiesCalibrated: false`. Do not transform `probabilities`.
4. In `apps/web/app/components/DashboardSection.tsx`, stop this fallback:

```125:125:apps/web/app/components/DashboardSection.tsx
  const healthRiskLevel = nutritionPrediction?.healthRisk?.level || analysis.nutritionPrediction?.healthRisk?.level || analysis.riskLevel;
```

`analysis.riskLevel` is the claim-verification average inside `analyzeScan` (thresholds 0.8 and 0.5). The nutrient screen is `predict_nutri_score`'s `healthRisk` and `calculateHealthRisk`. Those are different objects. The header chip that reads `Real-time API Verified` should follow `decision`, and a `CLEAR` personal fit (`applyProfile` in `recommendation.service.ts`) should not use the same green treatment as a nutrient screen. `CLEAR` means the saved profile strings were not found in the extracted text.

OCR box scores below 0.15 are dropped in `_read_pass` before the mean is computed. The 0.55 cutoff is also the trigger for extra passes in `extract_text`. Leave both numbers as named constants. Changing them is a policy version bump (`reading-policy-1`), not a calibration.

## 2. Pipeline, with the symbols that run

```text
apps/web/app/dashboard/page.tsx
  POST /api/v1/ocr/extract          field name "file"
    services/api/src/routes/ocr.routes.ts          multer memory, 10 MB
    extractOcrController                         services/api/src/controllers/ocr.controller.ts
      extractLabelWithOcr                        services/api/src/services/ocr.client.service.ts
        POST {OCR_SERVICE_URL}/ocr               default http://localhost:8001
          extract_text                           services/ocr/app/main.py
            prepare_variants                     services/ocr/app/preprocess.py
            _read_pass / _merge                  drop box score < 0.15
            detections_to_lines                  services/ocr/app/reading_order.py
            parse_label                          services/ocr/app/label_parser.py
            decide_reading                       services/ocr/app/reading_policy.py
      createScanFromOcrResult                    services/api/src/services/scan.service.ts
  POST /api/v1/analysis/scan/:scanId
    analyzeScanController                        passes body.profile and body.reading
    analyzeScan                                  services/api/src/services/analysis.service.ts
      analyzeIngredients                         ingredient-analysis.service.ts
      extractAllergensFromText                   analysis.service.ts (narrower list)
      mapNutritionFactsToInput                   nutrition-fact-mapper.service.ts
      getMissingNutritionFeatures                nutrition-feature-validation.service.ts
      predictNutrition                           nutrition-prediction.service.ts
        predictNutriScore                        ml-client.service.ts → POST /predict
          predict_nutri_score                    services/ml/app/main.py
            explain_prediction                   services/ml/app/explain.py
            probe_one_cell                       services/ml/app/sensitivity.py
            audit_table                          services/ml/app/reading_audit.py
      describeAbstain                            reading-policy.ts
      generateRecommendations / applyProfile     recommendation.service.ts
      calculateTrustScore                        trust.service.ts
```

`prepare_variants` transposes EXIF, converts to RGB, and Lanczos-upscales when the long edge is under 1400 px. The first array is contrast 1.55, sharpness 1.8, then `ImageFilter.SHARPEN`. If the first-pass mean is below 0.55 or fewer than eight boxes survive, `extract_text` also reads the autocontrast grayscale and the original pixels. `_merge` keeps the higher score for a repeated string. The response `text` is `detections_to_lines`. `createScanFromOcrResult` stores `rawOcrText` and nutrition rows. It does not set `Scan.imageUrl`.

`parse_label` sets `columnOrder` via `column_order`, nutrition via `extract_nutrition_from_detections` when boxes exist and otherwise `extract_nutrition_lines`, disagreements via `readers_disagree`, allergens via `extract_allergens`, and claims via `extract_claims`. Claims are regex hits. They are stored as text by `createScanFromOcrResult` and are not verified.

`services/api/src/services/ocr.service.ts` `extractTextFromImage` returns `text: ""` and `confidence: 0`, with a comment that an OCR engine will be connected later. No other file calls it. The live path is `extractLabelWithOcr`.

Ports and entrypoints: Next.js `apps/web` :3000, Express `services/api/src/server.ts` :4000, ML `services/ml/app/main.py` :8000, OCR `services/ocr/app/main.py` :8001. Auth is local scrypt in `services/api/src/services/auth.service.ts` (`registerUser`, `loginUser`, `requestReset`), file `services/api/data/users.json`. `@insforge/sdk` `createClient` is used from `requestReset` for mail. Prisma in `services/api/prisma/schema.prisma` is the scan store. Postgres is not required for email sign-in.

Routes mounted in `services/api/src/app.ts`: `/health`, `/api/v1/auth`, `/labels`, `/ocr`, `/nutrition`, `/evidence`, `/trust`, `/reports`, `/database`, `/scans`, `/ingredients`, `/claims`, `/verifications`, `/analysis`, `/scan-ingredients`, `/health-risk`, `/studio`.

## 3. Gaps that are in the code

**G1. No photographed benchmark.** `services/ocr/benchmarks/constructed/` has 25 JSON files, each with `"source": "constructed-lines"`. `score_constructed` prints a note that these counts are text lines. `docs/samples/sample_food_label.jpg` and `docs/samples/images.jpg` have no annotation beside them. There is no `product_id` split. `services/ml/training/train_forest.py` `train` uses `train_test_split(..., test_size=0.2, stratify=labels)`. The training CSV is not in the repository. `nutritrust_random_forest.joblib` is present. `nutritrust_model_metadata.json` records the forest settings and does not record split ids or the 0.9487 metrics. Those metrics appear in `README.md` and `docs/research/NUTRILENS_FINDINGS.md` as a held-out table score from an earlier run. This inspection did not recompute them.

**G2. OCR failure is stored as a successful invented label.** See `extractOcrController`, section 1.1. A non-OK response from `extractLabelWithOcr` is thrown and then caught by that same fallback. Multer in `ocr.routes.ts` limits size to 10 MB and sets no `fileFilter`. `extract_text` rejects a non-`image/` content type with HTTP 400, which the fallback currently turns into a fake label.

**G3. Uncertainty is labeled uncalibrated, and several different scores can still be read as one risk.**

- `MEAN_BOX_ABSTAIN` is 0.55 and `calibrated` is `False`.
- `predict_nutri_score` sets `healthRisk.level` to `LOW` when no flag is `HIGH` or `MEDIUM`, including when `health_risk_flags` is empty. Flags are only sugars (≥ 5 / ≥ 22.5 g), saturated fat (≥ 1.5 / ≥ 5 g), salt (≥ 0.3 / ≥ 1.5 g), and energy (≥ 250 / ≥ 400 kcal). Total fat is not a flag.
- `calculateHealthRisk` returns `overallLevel: "UNKNOWN"` when `factors` is empty, because a factor is appended only for medium and high bands.
- `analyzeScan` sets report `riskLevel` from the mean verification score, or `UNKNOWN` when there are no verifications. `DashboardSection` then uses that string as the last fallback for the nutrient screen.
- `calculateTrustScore` uses status fallbacks `VERIFIED` 1, `UNCERTAIN` 0.5, `FLAGGED` 0, and sets confidence to `min(count / 5, 1)`. A scan does not create `Verification` rows. `createVerification` runs only from `POST /api/v1/verifications`.
- No reliability diagram, ECE, Brier score, or negative log-likelihood is computed anywhere in the tree.

**G4. Claim UI and copy are not the evidence schema.** `Claim`, `Evidence`, and `Verification` exist in `schema.prisma`. Evidence has `title`, `source`, `url`, `type`, `description`, `retrievedAt`. It has no jurisdiction, document version, effective date, or section. `apps/web/app/components/ClaimVerificationSection.tsx` renders a constant `CLAIMS` array of four hard-coded items. `HorizontalScrollSection.tsx` says claims are checked against scientific literature and FSSAI standards. `FooterSection.tsx` shows the text `FSSAI Informed`. No regulation passage is stored. `prd.md` uses `"authority": "FSSAI"` as an example with the placeholder title "Applicable regulation title".

**G5. Allergen lists differ.**

| Symbol | Coverage |
| --- | --- |
| `extract_allergens` | 18 substrings, including almond, cashew, egg, fish, lactose, shellfish, crustacean |
| `extractAllergensFromText` | 11 substrings. Those seven are absent. `analyzeScan` unions this list into `ingredientAnalysis.allergens` when `rawOcrText` matches |
| `INGREDIENT_RULES` inside `analyzeIngredients` | Includes whey, casein, caseinate, groundnut |
| `applyProfile` and `apps/web/app/lib/matcher-audit.ts` | Profile containment. The locked fixture misses casein, whey, and groundnut, and false-alarms on coconut milk, gluten-free, and peanut-free |

`applyProfile` status `CLEAR` means no overlap with the profile list. It does not mean the packet is free of that allergen.

**G6. The published forest cannot be re-split here.** Metadata: `RandomForestClassifier`, 200 estimators, `max_features` `log2`, `class_weight` `balanced`, `random_state` 42, `max_depth` null, `min_samples_leaf` 1. Target `nutrition_grade_fr`, classes a–e. Features are the eight per-100 g columns in `services/ml/app/explain.py` `FEATURES`. `services/ml/requirements.txt` pins `scikit-learn==1.9.1`. The findings brief says the joblib was written with 1.6.1. This inspection did not load the joblib.

**G7. Dependencies and tests do not cover the upload.** Listed in section 4. `opencv-python-headless` is in `services/ocr/requirements.txt`. No file under `services/ocr` imports `cv2`. `pytest` is in neither Python requirements file.

## 4. Tests and dependencies

### Dependencies that are declared

| File | What it pins or ranges |
| --- | --- |
| Root `package.json` | pnpm workspace, `turbo` `^2.10.13`. Scripts: `dev`, `build`, `lint`. No `test` script. |
| `apps/web/package.json` | Next `16.3.5`, React `19.2.8`, Tailwind 4, `recharts`, Three.js. Scripts: `dev`, `build`, `start`, `lint`. No `test` script. |
| `services/api/package.json` | Express `^5.2.1`, Prisma `7.10.0`, `@insforge/sdk` `^1.5.2`, `multer` `^2.4.0`, `pg`. Scripts: `dev`, `build`, `start`, `postinstall` (`prisma generate`). No `test` script. |
| `services/ocr/requirements.txt` | `easyocr>=1.7.2`, `opencv-python-headless>=4.10.0`, `pillow>=10.4.0`, FastAPI, uvicorn, numpy. No pytest. |
| `services/ml/requirements.txt` | Pinned stack, including `scikit-learn==1.9.1`, `shap==0.49.1`, `joblib==1.6.0`. No pytest line. |

Virtual environments present during this inspection: `services/ocr/.venv` (Python 3.14.0) and `services/ml/.venv311` (Python 3.11.9). Pytest was installed into those two environments on 19 October 2026 so the suites could run. That install is not in a requirements file.

### Checks executed on 19 October 2026

All of these exited 0. No HTTP server was started. EasyOCR was not invoked. The joblib was not loaded.

| Command | Result |
| --- | --- |
| `services/ocr/.venv` `python -m pytest -q --tb=line` | 3 passed (`tests/test_field_score.py`: swap, other labels, abstain policy) |
| `services/ml/.venv311` `python -m pytest -q --tb=line` | 9 passed (`tests/test_reading_audit.py`) |
| `services/ocr/.venv` `python scripts/score_constructed.py` | 25 constructed cases. Each of en, hi, bn, mr, ta had 5 nutrients labeled `correct`. Every other `LABELS` count was 0. |
| `tsx` on `services/api/src/services/grade-refusal.test.ts` | passed. Portion salt 0.2 g on a 30 g serving stays off the per-100 g salt field. Salt 20 g produces one plausibility issue. |
| `reading-policy.test.ts` | passed. Unknown columns, confidence 0.4, and a protein disagreement abstain. The message says the figure is not a calibrated probability. |
| `barcode.test.ts` | passed |
| `ingredient-analysis.test.ts` | exited 0 |
| `nutrition-normalization.test.ts` | exited 0 |
| `apps/web/app/lib/household.test.ts` | passed |
| `matcher-audit.test.ts` | passed: 4 hit, 3 miss, 3 false alarm, 2 clear |
| `letter-stability.test.ts` | passed. Locks `letter-stability.json`: shelf forest vs screening 6 of 12; constructed tables 3 of 8. |
| `readingAudit.test.ts` | passed |
| `factorial-agreement.test.ts` | passed. Locks `factorial-agreement.json`: forest vs screening agreement 145 of 432, kappa 0.1555. That file is an agreement grid, not a photograph score. |

`pytest.ini` in each Python service sets `testpaths = tests`, so only those directories are collected when pytest is started inside the service.

### Inherited measurements, not re-run here

| Figure | Where it is recorded | What it is |
| --- | --- | --- |
| Accuracy 0.9487, balanced accuracy 0.9461, macro F1 0.9467, weighted F1 0.9488, ROC-AUC 0.9960, PR-AUC 0.9853 | `README.md`, findings brief F1 | Held-out nutrition-table classification from the training run that produced the published forest. CSV absent. |
| 984-table lattice, formula and forest share a letter on 678 of 984 | `docs/research/reading-audit.json`, findings brief F14 | Synthetic lattice. Findings brief: forest column loaded under scikit-learn 1.9.1 from a 1.6.1 pickle. |
| One-cell grid and 2017 formula counts | `apps/web/app/lib/letter-stability.json` | Complete authored tables. `letter-stability.test.ts` locks them. The probability gap is described there as uncalibrated. |

## 5. Behavior later edits have to preserve

- `parse_label` keeps a printed zero. `predict_nutri_score` does not fill a missing feature from the occlusion medians in `explain.py`.
- Portion and per-100 g stay distinct. `mapNutritionFactsToInput` is covered by `grade-refusal.test.ts`.
- `score_fields` keeps the six labels separate.
- `decide_reading` keeps `calibrated: false` until a calibration split exists.
- `READING_POLICY_VERSION` changes when a threshold changes.
- The published joblib is not replaced. `train_forest.py` writes over it only with `--replace`.
- `/terms` and the studio copy keep the statement that a preference match is not a medical clearance.
- `audit_table` / `formula_grade`, `screening_letter`, and `predictedGrade` stay three different letters.
- Existing JSON fields used by `dashboard/page.tsx` stay present. New decision fields are additive.

## 6. What this inspection did not do

- Did not open or score `docs/samples/sample_food_label.jpg` or `docs/samples/images.jpg`.
- Did not start the four servers or post a file through `extractOcrController`.
- Did not reload `nutritrust_random_forest.joblib` or regenerate the 984-row lattice.
- Did not modify application source. Pytest in the two virtual environments is the only environment change from the inspection.

## 7. Next increment, after this audit

Implement section 1 in this order: schema and `score_benchmark`, the `extractOcrController` error path, then the optional `decision` field on `decide_reading` and `analyzeScan`, then the dashboard fallback. Stop before Phase 3 evidence-graph work, personalization storage, and degradation suites. Those need the benchmark writer and the decision field to exist first.

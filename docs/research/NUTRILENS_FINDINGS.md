# NutriLens findings brief

**Product:** NutriLens (repository name NutriTrust)  
**Author:** Lovely Sharma, TeamRocket.exe  
**Date:** 17 October 2026  
**Audience:** a downstream model asked to write, extend, or answer questions about this prototype  
**Companion:** `docs/research/NUTRILENS_PAPER.md`

This document lists what the prototype actually does and what has been checked. It is a findings brief, not a clinical study and not an end-to-end accuracy paper.

## Instructions for the model that reads this

Keep every number attached to the task it was measured on. The 94.87% figure is a held-out nutrition-table classification score from an earlier training run. It is not a photograph score, not a Hindi-label score, and not a personal-fit score.

Do not write that a food was found safe, that a manufacturer committed fraud, that a person should change a diet, or that a missing nutrient was filled in. A preference match is a string and threshold check against a saved profile. The grade is withheld when a required per-100 g number is missing or physically implausible. A printed zero is kept.

If a later draft needs a citation, use only the references at the end. Do not invent a photographed-label benchmark. None exists in this repository.

## 1. What the system is

NutriLens photographs a packaged-food label, reads it with EasyOCR, separates a portion column from a per-100 g column, and predicts a Nutri-Score letter with a random forest trained to imitate Open Food Facts `nutrition_grade_fr`. A second, rule-based screen marks sugars, saturated fat, salt, and energy as low, medium, or high. Ingredient text is matched against a saved allergen and diet profile. A twelve-item reference shelf lists foods that pass that same preference check. A barcode lookup can ask Open Food Facts and then run the same check.

Four processes:

| Process | Role | Default port |
| --- | --- | --- |
| Next.js web app | Landing page, kitchen studio, scan, report, terms, copyright | 3000 |
| Express API | OCR proxy, analysis, profile and history store, barcode proxy | 4000 |
| FastAPI ML | Random-forest grade, local explanation, health-screen flags | 8000 |
| FastAPI OCR | EasyOCR, image passes, label parse | 8001 |

PostgreSQL stores scans, label rows, claims, and reports through Prisma. Profile, scan memory, and the shelf also live in the browser. When the API is up, profile and history are copied to `services/api/data/store.json`.

The product may say that a claim is poorly supported by the extracted table, or that a saved allergen appears in the extracted text. It does not diagnose disease, prescribe a diet, or declare a food safe.

## 2. Findings

Each finding states the result, the evidence in this repository, and the boundary of the claim.

### F1. The published grade model is a balanced random forest on eight per-100 g columns

The artifact is `services/ml/nutritrust_random_forest.joblib`, described by `services/ml/nutritrust_model_metadata.json`.

| Setting | Value |
| --- | --- |
| Algorithm | `RandomForestClassifier` |
| Target | `nutrition_grade_fr` |
| Classes | a, b, c, d, e |
| Estimators | 200 |
| `max_depth` | unlimited |
| `max_features` | `log2` |
| `min_samples_leaf` | 1 |
| `min_samples_split` | 2 |
| `class_weight` | `balanced` |
| `random_state` | 42 |

Features, in model order: `energy_100g`, `fat_100g`, `saturated-fat_100g`, `carbohydrates_100g`, `sugars_100g`, `fiber_100g`, `proteins_100g`, `salt_100g`.

The evaluation recorded with that training run, and repeated in the README, is:

| Metric | Value |
| --- | --- |
| Accuracy | 0.9487 |
| Balanced accuracy | 0.9461 |
| Macro F1 | 0.9467 |
| Weighted F1 | 0.9488 |
| ROC-AUC | 0.9960 |
| PR-AUC | 0.9853 |

**Boundary.** These numbers describe a held-out table task on Open Food Facts world food facts. The forest was not retrained for this paper. It was not re-scored on phone photographs, on Hindi, Tamil, Bengali, or Marathi labels, or on personal-fit decisions. A downstream draft must not call 94.87% an end-to-end accuracy.

### F2. A missing nutrient withholds the grade. A printed zero does not

Earlier behavior replaced every zero, and every missing field, with an Open Food Facts median (fiber 2.8 g, salt 0.7 g, and the other medians in F3). A product that truly contained no fiber was moved toward the middle of the training set, which can change the letter.

Current behavior, in `services/ml/app/main.py` and `describeWithheldGrade` in `services/api/src/services/normalization.service.ts`:

- `null` or a missing required feature returns HTTP 422 with reason `missing`. The message says the grade is withheld and that nothing was filled from a median.
- A value of `0` is a measured zero. `findImplausibleNutrition` on an all-zero table returns no issues (`services/api/src/services/grade-refusal.test.ts`).
- The predict response sets `imputedFeatures` to `null`. No feature is imputed at inference.

**Boundary.** Withholding is safer than silent imputation. It also means a partially read table produces no letter. Completeness is eight features (`nutritionQuality.requiredFeatures` in the parser). There is still no calibrated probability that the table itself is correct.

### F3. Physically impossible per-100 g values also withhold the grade

Ceilings in both the API normalizer and the ML service:

| Feature | Ceiling |
| --- | --- |
| Energy | 900 kcal |
| Fat, saturated fat, carbohydrates, sugars, fiber, protein | 100 g |
| Salt | 15 g |

Two relationship checks use a 0.5 g tolerance: saturated fat may not exceed total fat, and sugars may not exceed carbohydrates. The salt ceiling of 15 g exists because a milligram or percent figure misread as grams is the usual way a salt cell becomes absurd. A printed zero stays inside every ceiling.

A constructed check sends salt at 20 g per 100 g and expects one issue on `salt_100g`, and expects the withheld-grade sentence to name salt and to say a median was not used.

**Boundary.** These ceilings catch unit disasters. They do not prove the remaining numbers were read from the correct column.

### F4. The explanation is local to this packet, and the method is named

Global impurity importance answers which column mattered during training. It is not shown as the reason for one packet.

`services/ml/app/explain.py` does one of two things:

1. If `shap` imports and `TreeExplainer` succeeds, the response is `method: "shap"`. Positive values push toward the predicted class.
2. Otherwise each of the eight features is replaced in turn by its training median, and the change in predicted-class probability is recorded. The response is `method: "occlusion"`. That is eight extra predictions. The note tells the caller to install `shap` to switch methods.

Occlusion baselines stored in code:

| Feature | Median |
| --- | --- |
| Energy | 380 kcal |
| Fat | 8.5 g |
| Saturated fat | 3.2 g |
| Carbohydrates | 20 g |
| Sugars | 5.5 g |
| Fiber | 2.8 g |
| Protein | 8 g |
| Salt | 0.7 g |

A positive contribution means the real value increased the probability of the predicted grade relative to that median. If explanation code throws, the method is `unavailable` and the grade is still returned.

**Boundary.** Occlusion is an acceptable stand-in, not TreeSHAP. The medians are a baseline for explanation. They are not written into the nutrient table.

### F5. Nutrient screens are a separate rule layer, not the forest

Thresholds used by the ML health flags and by the shelf screening grade:

| Nutrient | Medium | High |
| --- | --- | --- |
| Sugars | ≥ 5.0 g / 100 g | ≥ 22.5 g / 100 g |
| Saturated fat | ≥ 1.5 g / 100 g | ≥ 5.0 g / 100 g |
| Salt | ≥ 0.3 g / 100 g | ≥ 1.5 g / 100 g |
| Energy | ≥ 250 kcal / 100 g | ≥ 400 kcal / 100 g |

Overall screen level is high if any flag is high, otherwise medium if any flag is medium, otherwise low. The shelf's `screeningGrade` adds 2 points for a high band and 1 for a medium band, then subtracts 1 when fiber is at least 6 g or protein is at least 12 g. Score 0 or below is A, 1 is B, 2 is C, 3–4 is D, 5 or more is E. That letter is labeled a screening grade so it is not confused with the random-forest letter on a real scan.

**Boundary.** These are screening bands. They are not a diagnosis and they are not the official Nutri-Score point formula.

### F6. The parser refuses three ways of inventing a nutrient

Checked by construction of lines, and recorded in the working paper's verification section:

- A daily reference such as "/2000 kcal" is not stored as the product's energy.
- The literal token "6 g" is not assumed to be total fat.
- A printed zero stays zero (see F2).

Two conversions are explicit and named in the source text:

- Kilojoules are divided by 4.184 and stored as kilocalories. When a row prints both kJ and kcal, the kcal figure is kept and the kJ figure is not converted on top of it.
- If salt is absent and sodium is present, salt in grams is sodium grams times 2.5. Milligrams of sodium are divided by 1000 first. The source text says the salt figure was estimated. The sodium field is then removed so it is not graded as a ninth nutrient.

**Boundary.** The 2.5 factor assumes sodium chloride. It is wrong for some sodium compounds. The estimate is marked, not hidden.

### F7. Portion and per-100 g are different columns

`column_order` returns `portion-then-100`, `100-then-portion`, `per100-only`, `portion-only`, or `unknown` from heading text.

Spatial pairing matches a nutrient word to numbers on the same row to its right. If the amount is printed under the word, the nearest amount below is used. A bare numeral box is joined to a neighbouring unit box, so a split "9" and "g" can become 9 g. Amounts may use a space, "gm", "gram", or a comma decimal. A nutrient name on its own line is paired with the next one or two lines when those lines contain only amounts. The phrase "per 100 g" is stripped before the numbers are read, so the column heading is not stored as a nutrient.

When headings do not say which column is which, the left number is shown as the portion and the right number as per 100 g, and the screen says that assumption was made. The grade uses the per-100 g figure. A portion-only salt value is not copied into the per-100 g salt field: the grade-refusal fixture maps a 0.2 g salt portion on a 30 g serving as undefined salt, while saturated fat 2 g and energy 110 kcal on a 100 g basis are kept.

Serving-size scaling, when a gram serving is known, is `per_100g = per_serving × (100 / serving_size_grams)`. If the serving size was not read, the API withholds the grade rather than scaling or filling.

**Boundary.** A correct digit on the wrong column is a wrong table. `field_score.py` keeps that case as `swapped` and does not fold it into one accuracy number. Photograph precision and recall are still unmeasured. The constructed-line result is in section 3.

### F8. OCR is multi-pass, and confidence is an average of boxes

`prepare_variants` applies EXIF transpose, converts to RGB, and upscales with Lanczos when the long edge is under 1400 pixels, to a long edge of 1400. The first pass is contrast 1.55, sharpness 1.8, then a sharpen filter. If mean confidence is below 0.55 or fewer than eight boxes survive, a grayscale autocontrast pass (cutoff 1) and the original pixels are read as well. Duplicate strings keep the higher confidence. The response reports `passes` as 1 or 3.

Boxes are grouped into visual lines by vertical overlap. The line tolerance is the maximum of 12 pixels and 0.65 times the median box height. Lines are ordered left to right. That reconstructed text is what ingredient and claim patterns see. If spatial parsing finds no nutrients, the parser falls back to the line parser.

English is always included in the reader language list so numerals and Latin nutrient names survive when a second language is requested. Supported OCR codes: English, Hindi, French, Spanish, German, Tamil, Bengali, Marathi. Interface languages are a separate set: English, Hindi, Spanish, French.

The product name is the first short non-nutrient line (3 to 80 characters, containing at least three Latin or Devanagari letters), not only a line that contains the word "crisps."

**Boundary.** Mean box confidence is not a calibrated probability of a correct table. The grade is withheld when that average is below 0.55, when the two column headings are missing, or when the line reader and the box reader disagree. How often that happens on photographs has not been measured. Glare, handwriting, and severely curved bottles still fail.

### F9. Allergens, claims, and the trust score are string and evidence checks

The OCR allergen list is containment over 18 terms: milk, soy, wheat, gluten, barley, peanut, mustard, celery, sesame, nuts, almond, cashew, egg, fish, lactose, shellfish, crustacean, and the word "nuts". Claim patterns cover vegetarian, vegan, high in protein, low fat, low sugar, no added sugar, source of fiber, high fiber, gluten-free, organic, and natural.

The profile allergen toggles are milk, gluten, wheat, peanut, tree nuts, soy, egg, sesame, fish, shellfish, and mustard. "Tree nuts" also matches almond, cashew, walnut, pistachio, or hazelnut.

`applyProfile` compares that list, plus diet word lists, with the extracted ingredient and allergen text:

- A hit produces a high-severity recommendation that names the overlap. Status is `CONFLICT`.
- A profile with allergens and no overlap produces an informational note that OCR may have missed a panel. Status is `CLEAR`.
- No usable profile leaves status `NO_PROFILE` and does not add a personal recommendation.

Diet word lists: animal terms (chicken, mutton, beef, pork, fish, gelatin, meat, prawn); dairy and egg terms including honey, whey, dahi, curd, ghee; Jain root terms (onion, garlic, potato, carrot, and radish on the shelf). Vegan checks animal plus dairy and egg. Vegetarian and Jain check animal terms. Jain also checks roots.

The trust score is the average of claim-verification scores on the report. Status fallbacks are verified 1, uncertain 0.5, flagged 0. If a verification already has a numeric score, that score is used. Confidence is `min(number of verifications / 5, 1)`. If there are no verifications, overall score is null, confidence is 0, and the methodology string says no claim verifications were available. The score is an average of the claim evidence that exists. It is not a safety percentage.

**Boundary.** Matching is string containment. It misses unseen synonyms and can false-alarm on a shared stem. Absence of a word in the OCR text is not absence of the allergen on the packet.

### F10. The shelf is a preference match on twelve authored foods

`apps/web/app/lib/catalog.json` holds twelve reference foods with per-100 g values, allergen lists, and ingredient strings. `safeShelf` keeps a food only when `assessFit` returns no reason. Reasons are an allergen hit, a diet-word hit, a nutrient screen miss, an additive flag, or screening grade D or E.

Screen misses on the shelf:

- Diabetic screen: sugars at least 5 g / 100 g.
- Low-sodium screen: salt at least 0.3 g / 100 g.
- High-protein screen: protein under 10 g / 100 g.
- Avoid-additives: the authored `additives` flag is true.

A compare view places two reference foods side by side. A barcode field asks the API for Open Food Facts `/api/v2/product/{code}.json` with a NutriLens user agent, then runs the same fit function. The browser tries the public API directly if the NutriLens API is down. The fit sentence says the check used the available public record.

Completed scans are kept on the device (up to 40) and posted to the API history (up to 50) when the API accepts them.

**Boundary.** Twelve authored rows remain a demonstration beside the household shelf. They are not a census of Indian packaged food. Open Food Facts rows can be incomplete or stale. A GS1 check digit runs before lookup. No week-later answers are stored in this repository, so agreement is not yet a measured rate.

### F11. Access and language are extra channels, not extra nutrition evidence

Stored with profile preferences: high contrast, two larger text steps, reduced motion (also skips the navbar entrance and uses an instant scroll to the report), and the system cursor instead of the decorative ring. The ring is also off for coarse pointers and for `prefers-reduced-motion`.

Vision support speaks the shelf or the finished scan in `en-IN`, `hi-IN`, `es-ES`, or `fr-FR`. Hearing support shows the same utterance as an on-screen caption. A visually hidden live region is always updated. A skip link targets the studio. Toggles expose `aria-pressed`. Speech is an extra channel. No result is conveyed by sound alone.

Email sign-in exists. Forgot-password answers the same way whether or not that email is registered. Without a mail server, the reset code is shown on the reset page for this machine. `/terms` states the limits of a reading. `/copyright` names what belongs to this prototype and what stays with Open Food Facts and Nutri-Score.

**Boundary.** Login, terms, and captions change who can open the dashboard and how a result is announced. They do not change the nutrition model, and they are not a regulatory filing.

## 3. What was actually checked

| Check | Result |
| --- | --- |
| 400 mg sodium | Stored as 1.0 g estimated salt, source text names the estimate |
| Bare "6 g" | Not stored as fat |
| Product name | Taken from the following non-nutrient line |
| "Protein" then "9 g" and "18 g" | 9 g portion and 18 g per 100 g |
| "9 gm" | Read as grams |
| Heading "per 100 g" | Not stored as a nutrient |
| Portion salt 0.2 g on 30 g, with other nutrients already per 100 g | Salt stays undefined; saturated fat and energy are kept |
| Salt 20 g / 100 g | One plausibility issue; grade sentence names it and refuses a median |
| All-zero table | Not implausible |
| API and web `tsc --noEmit` | Passed at the time of the working paper |
| Browser studio | Profile, shelf, history, compare, and barcode tabs rendered, with language and access controls. Turning on milk wrote that allergen into local storage and set the toggle to pressed |
| Protein 9 g / 18 g reversed | Field label `swapped`; the scored object has no accuracy field |
| Five constructed protein lines, one each in English, Hindi, Marathi, Tamil, and Bengali | `score_constructed.py` on 17 October 2026: `proteins` is `correct` once per file; every other count is 0. These are text lines, not photographs |

The random forest was not re-scored on a new photograph set. End-to-end OCR still depends on EasyOCR model files and on the photo.

## 4. What is still unmeasured

The tools below exist. The measurements do not. A draft must not fill the gaps with estimated percentages.

- The field scorer in `services/ocr/app/field_score.py` labels each nutrient as correct, missed, swapped, wrong unit, invented, or a plain wrong value, and it does not collapse those counts into one accuracy percentage. `services/ocr/benchmarks/constructed/` holds one constructed text line each for English, Hindi, Tamil, Bengali, and Marathi. Those counts are constructed lines. No photographed packet has been scored, so end-to-end precision and recall are still unknown.
- The grade is withheld when the two column headings are missing, when mean box confidence is below 0.55, or when the line reader and the box reader disagree. Mean box confidence is named as an uncalibrated average of OCR boxes. The 0.55 cutoff is the same heuristic already used to run a second image pass. It is not a calibrated probability, and the share of photographs that abstain has not been measured.
- The portion table lets a person change one per 100 g cell and asks the model for the letter on the raw read and the letter after that correction.
- A household shelf stores scans the person confirms. Seven days later the studio asks whether the preference check still agrees. The agreement count uses only those answers. No week-later answers are stored in this repository.
- Barcode text is checked with the GS1 check digit before lookup. When the box reader and the line reader disagree on a shared nutrient, the grade is withheld.
- Password reset tries InsForge mail, then SMTP. If neither sends, the code is shown on the reset page for this machine.
- `services/ml/train_forest.py` can train the same forest from a CSV. The published `nutritrust_random_forest.joblib` was not replaced. TreeSHAP is used when `shap` imports; otherwise the response says occlusion.
- Hindi, Tamil, Bengali, and Marathi each have a constructed-line case in the scorer. They have not been scored as photographed sets.
- The terms and copyright pages say they describe the prototype and are not an approval.

The highest-value measurements still missing are a photographed-label run of the field scorer, a calibration of the 0.55 abstain cutoff, and week-later answers from a household.

## 5. Claims that are in bounds, and claims that are not

In bounds:

- The held-out table metrics in F1, with the task named in the same sentence.
- Grade refusal instead of median fill, including the zero-versus-missing distinction.
- Local explanation by occlusion or TreeSHAP, with the method named.
- Screening thresholds and the separate screening grade on the shelf.
- Sodium-to-salt and kilojoule conversions, with the assumptions named.
- Preference matching by string containment, including its miss and false-alarm modes.
- The twelve-item shelf as a demonstration.

Out of bounds:

- Any new accuracy, F1, or OCR percentage.
- "Safe", "cleared", "medical", "fraud", or "clinically validated".
- A sentence that email login or the terms page improved nutrition performance.
- Treating the screening grade and the random-forest grade as the same number.

## References

Groover, M. "The Hidden Challenge of Building an OCR System That Works in the Real World." DEV, https://dev.to/michael_groover_1fe970a66/the-hidden-challenge-of-building-an-ocr-system-that-works-in-the-real-world-2i5j

Particual. "How I Built a Fast, Offline-First Gluten Detection PWA Using Web OCR & Open Food Facts." DEV, https://dev.to/particual_fa18b6a17d860df/how-i-built-a-fast-offline-first-gluten-detection-pwa-using-web-ocr-open-food-facts-26og

Rajput, S. "Feature Importance in Random Forests: The Company That Fired the Wrong Employee Because It Measured the Wrong Thing." DEV, https://dev.to/sachin_krrajput/feature-importance-in-random-forests-the-company-that-fired-the-wrong-employee-because-it-measured-3cdh

Hexisteme. "The Dedicated OCR Engine Lost to the General-Purpose Model — 300× Slower." DEV, https://dev.to/hexisteme/the-dedicated-ocr-engine-lost-to-the-general-purpose-model-300x-slower-2bf7

Pertu, D. "450 label words the test suite will not let us ship without." DEV, https://dev.to/daniel_pertu/450-label-words-the-test-suite-will-not-let-us-ship-without-4102

Open Food Facts. Product API v2. https://world.openfoodfacts.org

Nutri-Score and the Open Food Facts `nutrition_grade_fr` field, as used by the training metadata in this repository.

# NutriLens findings brief

**Product:** NutriLens (repository name NutriTrust)  
**Author:** Lovely Sharma, TeamRocket.exe  
**Date:** 18 October 2026  
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

**Boundary.** These are screening bands. They are not a diagnosis. The 2017 point formula is a third letter, measured in F13.

### F12. A fixed one-cell grid moves few wide-margin letters

`services/ml/scripts/evaluate_findings.py` wrote `apps/web/app/lib/letter-stability.json` on 18 October 2026. The forest was loaded with scikit-learn 1.6.1 and was not replaced. Each of the eight nutrients was multiplied by 0.5, 0.8, 0.9, 1.1, 1.2, and 1.5. A probe outside a ceiling was rejected. Margin is the predicted-class probability minus the next class. Close is below 0.15, mid is below 0.40, and wide is 0.40 or more.

| Corpus | Tables | Forest matches screening | Mean letter steps | Accepted | Flips | Rejected |
| --- | --- | --- | --- | --- | --- | --- |
| Reference shelf | 12 | 6 | 0.5 | 564 | 6 | 12 |
| Constructed tables | 8 | 3 | 0.875 | 382 | 11 | 2 |

On the shelf, the wide bucket is 1 flip in 469 accepted probes across 10 tables. The mid bucket is 5 flips in 95 accepted probes across 2 tables. There is no close-margin shelf food. On the constructed tables, the one close table (`two-medium`) has 7 flips in 48 accepted probes. The same script under scikit-learn 1.9.1 printed the same summary counts. The cited run is 1.6.1.

The three shelf foods with a flip all move first on saturated fat. Plain dahi ×1.5 goes from A to B. Peanut butter ×0.5 goes from C to A, away from screening D. Jaggery cookies ×1.1 goes from D to E, which is the screening letter. A printed fiber of 0 stays 0 on this grid.

**Boundary.** These are complete tables, not photographs and not corrections a person typed. The margin is not a calibrated probability. The aggregate flip share is not the headline.

### F13. The 2017 foods formula, the screen, and the forest disagree in different places

`apps/web/app/lib/readingAudit.ts` scores the 2017 general-foods table. Kilocalories are multiplied by 4.184. Salt grams become sodium milligrams by dividing by 2.5 and multiplying by 1000. A point is counted only when the value is strictly above the threshold. Fruit percent is unknown and counted as 0, so protein points drop when negative points are 11 or more. Beverages, cheeses, and added fats are not on their own tables.

An energy check estimates kilocalories as 4×protein + 4×carbohydrate + 9×fat + 2×fiber, omitting alcohol and polyols. It flags a gap above 10% and above 30 kcal. The formula letter still uses the stated energy.

On the same tables as F12, checked by `apps/web/app/lib/letter-stability.test.ts`:

| Corpus | Formula matches forest | Formula matches screening | Energy check flagged |
| --- | --- | --- | --- |
| Reference shelf | 9 of 12 | 9 of 12 | 0 of 12 |
| Constructed tables | 7 of 8 | 3 of 8 | 4 of 8 |

Six shelf foods agree on all three letters. Brown rice, plain dahi, and almond drink put the formula with the forest and against the screen. Peanut butter, masala chips, and jaggery cookies put the formula with the screen and against the forest. `protein-offset` is forest A, formula A, and screening D, with forest margin 0.82 and no accepted flip. `two-medium` is the only table where all three letters differ: forest B, screening C, formula A. Its energy check is flagged.

**Boundary.** The formula letter is not a clearance and not the forest letter. Flagged energy checks were still given a formula letter.

### F14. On a 984-table lattice, forest disagreements cluster next to the formula boundary

`services/ml/scripts/audit_readings.py` wrote `docs/research/reading-audit.json` on 18 October 2026. The coherent cohort sets energy to the 4/4/9/2 estimate. Protein is 2, 8, 16, or 25 g; carbohydrate 5, 20, 45, or 70 g; sugars 5%, 40%, or 90% of carbohydrate; fat 1, 8, 20, or 40 g; saturated fat 20% or 60% of fat; fibre 0, 3, or 8 g. Rows with fat + carbohydrate + protein above 100 g, or those three plus fibre above 105 g, are dropped. Salt is `0.05 + 0.15 × saturated-fat fraction + 0.02 × protein`. 984 tables remain. This is not a food sample.

All 984 pass the Atwater rule in F13. Formula and screening share a letter on 542, differ by one letter on 390, and differ by two or more on 52. Formula and forest share a letter on 678, differ by one on 288, and differ by two or more on 18. The forest column was predicted by scikit-learn 1.9.1 from a joblib pickled with 1.6.1, and that load warned the unpickle may be invalid. The twelve shelf letters from this load match the 1.6.1 letters in F12. The 984 forest letters were not re-run under 1.6.1.

Of 130 formula-B tables, the forest said A on 76. Of 307 formula-D tables, it said C on 141. Of 46 formula-E tables, it said D on 37 and E on 9. The 18 wider gaps are formula C read as forest A. Formula A agreed on 282 of 283. Protein points were counted on 500 tables and dropped on 484.

Formula margin is Nutri-Score points to the nearest other letter, not the probability margin in F12. Median margin is 2. One-point tables: 293, and the forest matched 163 of them. Margin of 5 or more: 94, and the forest matched 88. Median one-nutrient moves, among tables where that nutrient could change the formula letter: energy 129.5 kcal (976), sugars 6.9 g (654), saturated fat 2.0 g (732), salt 0.49 g (949), fibre 2.1 g (666), protein 6.4 g (372).

A second cohort writes the Atwater estimate times 4.184 into the kilocalorie cell when the result is still at or under 900 kcal. 282 tables qualify, and all 282 are divergent. The cohort was built to fail the rule.

An all-zero table, outside the lattice, is formula B and screening A.

**Boundary.** Do not cite 678/984 as an accuracy. Salt on this lattice is not an independent axis. The unit-swap cohort is a check of the threshold, not a rate of kilojoule mix-ups. The forest column in this finding was not re-run under scikit-learn 1.6.1. F15 is a different grid.

### F15. On 432 declared tables, forest–screening agreement is close to chance

`services/ml/scripts/evaluate_factorial.py` wrote `apps/web/app/lib/factorial-agreement.json` on 18 October 2026. The forest was loaded with scikit-learn 1.6.1 and was not replaced. This grid is not the 984-table lattice in F14. Salt is its own axis here.

Sugars are 2, 8, or 24 g. Saturated fat is 0.5, 2.5, or 8 g. Salt is 0.1, 0.6, or 1.8 g. Fibre is 1 or 7 g. Protein is 4 or 14 g. Fat is saturated fat plus 4 g or 10 g. Carbohydrate is sugars plus 12 g or 35 g. Energy is 4×protein + 4×carbohydrate + 9×fat + 2×fiber. That is 432 tables. The energy check flags 0 of 432 because energy is the estimate. The grid is not a food sample and not a photograph set.

Cohen's kappa is (observed agreement − chance agreement) / (1 − chance agreement). Chance agreement multiplies the two readers' shares of each letter and adds those products. Kappa measures agreement beyond that chance. It does not say which letter is correct. Landis and Koch band names are a label, not a cutoff. The Wilson interval uses z = 1.96 and is an interval on the share of tables that share a letter. It is not an interval on kappa.

| Pair | Same letter | Observed | Chance | Kappa | Wilson 95% on the observed share | Mean letter steps |
| --- | ---: | ---: | ---: | ---: | --- | ---: |
| Forest and screening | 145 of 432 | 0.3356 | 0.2133 | 0.1555 | 0.2927 to 0.3815 | 0.7755 |
| Forest and formula | 335 of 432 | 0.7755 | 0.2716 | 0.6918 | 0.7338 to 0.8123 | 0.2292 |
| Screening and formula | 198 of 432 | 0.4583 | 0.2255 | 0.3006 | 0.4119 to 0.5055 | 0.5648 |

Screening is harsher than the forest by two or more letters on 45 tables and milder on 1. The formula is harsher than the forest by two or more on 1 table and milder on 1. The formula is milder than screening by two or more on 10 tables and harsher on 0. All three letters agree on 141 of 432 (Wilson 0.2839 to 0.372).

Letter counts: forest A 111, B 45, C 169, D 105, E 2; screening A 51, B 63, C 85, D 160, E 73; formula A 88, B 57, C 146, D 130, E 11.

On the twelve reference foods, forest and screening agree on 6 of 12. Observed agreement is 0.5, chance agreement is 0.3472, kappa is 0.234, and the Wilson interval is 0.2538 to 0.7462.

The one-cell factors in F12 were applied to all 432 tables. A probe moves the forest letter on 318 of 432 tables (Wilson 0.6926 to 0.7755). Close margin: 896 flips in 4486 accepted probes, share 0.1997, and 93 of 94 tables flip. Mid: 252 of 5374, share 0.0469, and 101 of 113 tables flip. Wide: 184 of 10732, share 0.0171, and 124 of 225 tables flip. The nearest accepted flip is saturated fat on 113 tables, salt on 90, and sugars on 78. The shelf in F12 has no close-margin food. This grid does, and the flip share falls as the margin widens.

**Boundary.** Do not cite 145/432 or 335/432 as an accuracy. Do not cite kappa as correctness. Do not cite the shelf interval as a precise rate. The margin is not calibrated. The energy check passes by construction.

### F17. The small kappa is a one-letter shift, and the screen is the odd reader

On the same 432 tables as F15, linear weighted kappa gives a miss of *d* letters the weight *d* / 4. An A-versus-B miss weighs 0.25. An A-versus-E miss weighs 1. Forest versus screening: unweighted kappa 0.1555, linear weighted kappa 0.4617, and 386 of 432 tables are within one letter (Wilson 0.8609 to 0.9192). The largest mismatch is forest C with screening D, 104 tables, then forest D with screening E, 63 tables.

When the three letters are not the same, screening is the odd letter on 194 tables, the forest on 57, and the formula on 4. All three differ on 36.

A shuffle of the screening letters, 1000 draws, seed 18, keeps the letter counts and breaks the pairing. Null median kappa is −0.0004. The 95th percentile is 0.0408. Zero draws reached 0.1555.

**Boundary.** Weighted kappa is still agreement, not correctness. The weight is a choice. A kappa of 0.80 is not a cutoff here. The shuffle is a pairing check, not a confidence interval on kappa.

### F16. The matcher misses synonyms and alarms on negated stems

`apps/web/app/lib/matcher-audit.ts` holds twelve constructed lines. `matcher-audit.test.ts` checks them. A hit is a conflict the line should raise. A miss is a synonym the containment check does not see. A false alarm is a shared stem the check treats as the allergen. A clear line raises no personal conflict.

| Mode | Count | Lines |
| --- | ---: | --- |
| Hit | 4 | milk powder; almonds against tree nuts; mustard seeds; chicken stock against vegetarian |
| Miss | 3 | casein; whey protein; groundnut oil |
| False alarm | 3 | coconut milk; gluten-free oats; peanut-free sauce |
| Clear | 2 | rice; chickpeas against soy and vegan |

**Boundary.** Twelve constructed strings are not a photographed ingredient corpus. A clear line is not an absence of the allergen on a packet. Do not collapse the four modes into one accuracy.

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
| Constructed lines for protein, sugars, salt, energy, and fat, in en, hi, mr, ta, bn | `services/ocr/scripts/score_constructed.py` on 18 October 2026: five `correct` nutrients per language; every other count is 0. Text lines, not photographs |
| One-cell grid and three-letter check, 18 October 2026 | See F12 and F13. `letter-stability.test.ts` passed against `letter-stability.json` |
| Coherent lattice of 984 tables, and 282 kilojoule-as-kilocalorie rows | See F14. `readingAudit.test.ts` passed the threshold locks |
| Factorial of 432 tables, scikit-learn 1.6.1, 18 October 2026 | See F15 and F17. `factorial-agreement.test.ts` locks the kappa, the weighted kappa, the odd-reader counts, the shuffle null, and the flip-share figures |
| Matcher fixture, 12 lines | See F16. `matcher-audit.test.ts` passed: 4 hits, 3 misses, 3 false alarms, 2 clears |

The random forest was not re-scored on a new photograph set. End-to-end OCR still depends on EasyOCR model files and on the photo.

## 4. What is still unmeasured

F12, F13, F14, and F15 are measured on complete tables. F16 is a twelve-line string fixture. The items below are still unmeasured. A draft must not fill them with estimated percentages.

- The field scorer in `services/ocr/app/field_score.py` labels each nutrient as correct, missed, swapped, wrong unit, invented, or a plain wrong value, and it does not collapse those counts into one accuracy percentage. `services/ocr/benchmarks/constructed/` holds text lines for protein, sugars, salt, energy, and fat in English, Hindi, Tamil, Bengali, and Marathi. Those counts are constructed lines. No photographed packet has been scored, so end-to-end precision and recall are still unknown.
- The grade is withheld when the two column headings are missing, when mean box confidence is below 0.55, or when the line reader and the box reader disagree. Mean box confidence is named as an uncalibrated average of OCR boxes. The 0.55 cutoff is the same heuristic already used to run a second image pass. It is not a calibrated probability, and the share of photographs that abstain has not been measured.
- The portion table lets a person change one per 100 g cell and asks the model for the letter on the raw read and the letter after that correction.
- A household shelf stores scans the person confirms. Seven days later the studio asks whether the preference check still agrees. The agreement count uses only those answers. No week-later answers are stored in this repository.
- Barcode text is checked with the GS1 check digit before lookup. When the box reader and the line reader disagree on a shared nutrient, the grade is withheld.
- Password reset tries InsForge mail, then SMTP. If neither sends, the code is shown on the reset page for this machine.
- `services/ml/training/train_forest.py` can train the same forest from a CSV. The published `nutritrust_random_forest.joblib` was not replaced. TreeSHAP is used when `shap` imports; otherwise the response says occlusion.
- Hindi, Tamil, Bengali, and Marathi have constructed lines for five nutrients. They have not been scored as photographed sets. The 984-table forest column in F14 was not re-run under scikit-learn 1.6.1. The 432-table grid in F15 was run under 1.6.1. It does not replace the F14 forest column, and it is not a photograph set.
- The matcher fixture in F16 is twelve constructed strings. It is not a photographed ingredient corpus.
- The terms and copyright pages say they describe the prototype and are not an approval.

The highest-value measurements still missing are a photographed-label run of the field scorer, a calibration of the 0.55 abstain cutoff, and week-later answers from a household. F12, F13, F14, F15, F16, and F17 do not fill those gaps.

## 5. Claims that are in bounds, and claims that are not

In bounds:

- The held-out table metrics in F1, with the task named in the same sentence.
- Grade refusal instead of median fill, including the zero-versus-missing distinction.
- Local explanation by occlusion or TreeSHAP, with the method named.
- Screening thresholds and the separate screening grade on the shelf.
- The one-cell grid in F12, with the margin bucket named in the same sentence.
- The three-letter counts in F13, with fruit percent counted as zero named in the same sentence.
- The 984-table lattice and the 282-row unit-swap check in F14, with the scikit-learn load named in the same sentence.
- The 432-table factorial in F15, with kappa, chance agreement, and the Wilson interval on the matching share named together.
- The letter-distance reading in F17, with the weight *d* / 4 named, and with the statement that 0.80 is not a cutoff.
- The twelve-line matcher counts in F16, with hits, misses, and false alarms kept separate.
- Sodium-to-salt and kilojoule conversions, with the assumptions named.
- Preference matching by string containment, including its miss and false-alarm modes.
- The twelve-item shelf as a demonstration.

Out of bounds:

- Any new accuracy, F1, or OCR percentage.
- "Safe", "cleared", "medical", "fraud", or "clinically validated".
- A sentence that email login or the terms page improved nutrition performance.
- Treating the screening grade, the formula letter, and the random-forest grade as the same number.
- Citing the grid flip share without its margin bucket, or citing it as an OCR accuracy.
- Citing 6 of 12, or 145 of 432, as an accuracy, or citing kappa, weighted or unweighted, as a measure of which letter is correct.
- Treating a kappa of 0.80 as a pass mark on this grid.
- Collapsing the matcher fixture into one accuracy.

## References

Groover, M. "The Hidden Challenge of Building an OCR System That Works in the Real World." DEV, https://dev.to/michael_groover_1fe970a66/the-hidden-challenge-of-building-an-ocr-system-that-works-in-the-real-world-2i5j

Particual. "How I Built a Fast, Offline-First Gluten Detection PWA Using Web OCR & Open Food Facts." DEV, https://dev.to/particual_fa18b6a17d860df/how-i-built-a-fast-offline-first-gluten-detection-pwa-using-web-ocr-open-food-facts-26og

Rajput, S. "Feature Importance in Random Forests: The Company That Fired the Wrong Employee Because It Measured the Wrong Thing." DEV, https://dev.to/sachin_krrajput/feature-importance-in-random-forests-the-company-that-fired-the-wrong-employee-because-it-measured-3cdh

Hexisteme. "The Dedicated OCR Engine Lost to the General-Purpose Model — 300× Slower." DEV, https://dev.to/hexisteme/the-dedicated-ocr-engine-lost-to-the-general-purpose-model-300x-slower-2bf7

Pertu, D. "450 label words the test suite will not let us ship without." DEV, https://dev.to/daniel_pertu/450-label-words-the-test-suite-will-not-let-us-ship-without-4102

Parshvi. "Flip Rate Lies When the Model Saturates: A Confidence-Stratified Methodology for Deletion-Based XAI Evaluation." DEV, https://dev.to/parshvi1508/flip-rate-lies-when-the-model-saturates-a-confidence-stratified-methodology-for-deletion-based-xai-4g7o

Kundalia, R. "Why 95 Reviews Beats 20 Reviews — Even When Both Score 95%." DEV, https://dev.to/rajkundalia/why-95-reviews-beats-20-reviews-even-when-both-score-95-2cp9

Peretz, O. "Inter-Rater Agreement and Cohen's Kappa: When Your Labels Are Opinions." DEV, https://dev.to/ofri-peretz/inter-rater-agreement-and-cohens-kappa-when-your-labels-are-opinions-2jdk

Wahiduddin, Faishal. "Calibrating an LLM-as-Judge for a Vision Check to κ 0.80." DEV, https://dev.to/faishalwahiduddin/calibrating-an-llm-as-judge-for-a-vision-check-to-k-080-2h50

Open Food Facts. Product API v2. https://world.openfoodfacts.org

Nutri-Score and the Open Food Facts `nutrition_grade_fr` field, as used by the training metadata in this repository.

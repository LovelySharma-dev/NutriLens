# Product Requirements Document (PRD)

## NutriTrust — Evidence-Grounded Food-Label Analysis



> Important product boundary: The system detects potential inconsistencies and plausibility concerns. It must not accuse a manufacturer of fraud or confirm a legal violation unless the evidence and applicable regulation support that conclusion.



# 1. Executive Summary

NutriTrust is a multimodal food-label analysis platform that helps users understand packaged-food labels by combining:

* image upload and camera capture,

* OCR,

* nutrition-table extraction,

* ingredient-list parsing,

* marketing-claim detection,

* serving-size normalization,

* allergen and additive identification,

* rule-based regulatory checks,

* category-based plausibility analysis,

* evidence-linked explanations,

* confidence-aware results.

The platform’s central innovation is Label Manipulation Fingerprinting: identifying different types of potential label inconsistencies rather than only calculating a nutrition score.

The system will examine three major patterns:

1. Claim–nutrition inconsistency

2. Serving-size plausibility concerns

3. Ingredient-order plausibility concerns

Each result will be linked to:

* the extracted evidence,

* the applicable jurisdiction,

* the relevant rule or regulation,

* the source reference,

* the confidence level,

* and the limitations of the analysis.

# 2. Product Vision

## Vision statement

> Make packaged-food labels easier to understand by converting complex label information into transparent, evidence-backed, and confidence-aware explanations.

## Product promise

NutriTrust should answer:

* What does this label actually say?

* What nutrients are present?

* What claims are being made?

* Do the claims appear consistent with the nutrition table?

* How much would the user consume if they ate the entire package?

* Are the ingredients and allergens clearly identified?

* Which findings are supported by regulations?

* Which findings are only statistical or heuristic warnings?

* How confident is the system in its result?

## Non-goals

NutriTrust will not:

* diagnose diseases,

* prescribe diets or medication,

* determine a manufacturer’s intent,

* legally prosecute or accuse a company,

* guarantee that a product is safe,

* replace a doctor, dietitian, regulator, or official laboratory,

* automatically classify every unusual label as fraudulent.

# 3. Problem Statement

Packaged-food labels contain several types of information:

* marketing claims,

* nutrition tables,

* serving-size information,

* ingredient lists,

* allergen declarations,

* additive codes,

* health-related statements.

Users often struggle to connect these sections. A product may display a positive claim on the front of the package while the nutrition table tells a more complicated story.

Existing food-scanning applications commonly focus on:

* barcode lookup,

* calorie display,

* nutrition scoring,

* ingredient searching,

* allergen identification.

NutriTrust will focus on the relationship between different label sections and provide an auditable explanation for each potential concern.

# 4. Product Objectives

## Primary objectives

1. Extract structured information from food-label images.

2. Identify marketing and nutrition-related claims.

3. Compare claims against extracted nutrition values.

4. Normalize serving-level values to package-level values.

5. Identify unusual serving sizes using category references.

6. Analyze ingredient ordering as a plausibility signal.

7. Link findings to regulatory or evidence sources.

8. Display uncertainty and extraction confidence.

9. Provide a fast, understandable user experience.

10. Generate reproducible data for research evaluation.

## Secondary objectives

* Barcode-based product lookup.

* Allergen and additive detection.

* SHAP-based explanation for any trained predictive model.

* Product comparison.

* Scan history.

* Multilingual support.

* Research dataset annotation tools.

## Success criteria

The MVP will be considered successful if it can:

* process a complete product label from multiple images,

* extract key nutrition and serving fields,

* identify at least a limited set of claims,

* produce evidence-linked findings,

* show uncertainty when information is missing,

* and complete the workflow reliably on a predefined evaluation set.

# 5. Target Users

## 5.1 Primary consumer

A person who wants to understand whether a packaged food matches its front-of-pack claims.

### Needs

* simple explanations,

* quick scanning,

* clear warnings,

* no technical terminology,

* package-level nutrition values,

* allergen visibility.

## 5.2 Allergy-sensitive user

A user who needs to identify potential allergens.

### Needs

* allergen highlighting,

* ingredient evidence,

* “may contain” detection,

* multilingual ingredient support,

* high-visibility warnings.

## 5.3 Health-conscious user

A user comparing products based on:

* sugar,

* salt,

* saturated fat,

* protein,

* fiber,

* serving size.

## 5.4 Research evaluator

A faculty member, reviewer, or researcher assessing:

* extraction quality,

* detector performance,

* regulatory grounding,

* model confidence,

* reproducibility,

* system latency.

## 5.5 Hackathon judge

A judge who needs to understand the innovation quickly.

### Needs

* clear problem statement,

* compelling demonstration,

* visible evidence chain,

* measurable technical contribution,

* working end-to-end flow.

# 6. Product Scope

## MVP scope

### Included

* multi-image upload,

* mobile camera capture,

* image-quality assessment,

* OCR,

* text-region classification,

* nutrition extraction,

* serving-size extraction,

* ingredient extraction,

* claim extraction,

* claim–nutrition checking,

* package-level normalization,

* serving-size plausibility warnings,

* ingredient-order plausibility warnings,

* allergen detection,

* additive detection,

* evidence panel,

* confidence display,

* basic result export,

* optional barcode lookup.

### Excluded from MVP

* full social features,

* medical personalization,

* advanced diet planning,

* native Android/iOS applications,

* automated legal complaint filing,

* automatic manufacturer accusations,

* large-scale recommendation engine,

* real-time video processing,

* support for every global jurisdiction,

* fully autonomous regulatory interpretation.

# 7. Core Product Concept

## Label Manipulation Fingerprinting

The system does not produce one unexplained “fake label” score. Instead, it creates a fingerprint composed of separate signals.

```

Product label

    |

    +-- Claim fingerprint

    |     +-- claim detected

    |     +-- nutrition value

    |     +-- applicable threshold

    |     +-- consistency result

    |

    +-- Serving fingerprint

    |     +-- declared serving size

    |     +-- package weight

    |     +-- servings per package

    |     +-- category reference

    |

    +-- Ingredient fingerprint

          +-- ingredient sequence

          +-- ingredient positions

          +-- category profile

          +-- plausibility warning

```

## Output categories

Every finding must use one of these statuses:

* Supported

* Potential inconsistency

* Plausibility warning

* Insufficient evidence

* Not applicable

* Unable to determine

# 8. User Journey

## Main flow

```

Landing page

    ↓

Start scan

    ↓

Upload or capture images

    ↓

Image-quality check

    ↓

Select image regions

    ↓

OCR and extraction

    ↓

User reviews extracted data

    ↓

System performs analysis

    ↓

Results dashboard

    ↓

Evidence details

    ↓

Compare or export result

```

## User journey details

### Step 1: Start scan

The user selects:

* Upload images,

* Use camera,

* Scan barcode,

* Enter product manually.

### Step 2: Capture label sections

The interface recommends three images:

1. Front-of-pack image

2. Nutrition table image

3. Ingredients and allergen image

The user may skip a section, but the system must clearly explain which analyses will be unavailable.

### Step 3: Image-quality check

The system evaluates:

* blur,

* glare,

* low contrast,

* excessive rotation,

* cropped text,

* insufficient resolution,

* unreadable characters.

Possible outcomes:

* Good quality

* Acceptable quality

* Retake recommended

* Cannot process

### Step 4: Review extraction

The user sees extracted fields and can correct:

* energy,

* sugar,

* fat,

* saturated fat,

* protein,

* fiber,

* salt or sodium,

* serving size,

* package weight,

* ingredients,

* claims.

User corrections must be stored separately from raw OCR output.

### Step 5: Analyze

The backend runs:

* claim detection,

* nutrition normalization,

* regulatory checks,

* serving-size analysis,

* ingredient analysis,

* allergen and additive detection,

* optional ML inference.

### Step 6: Results

The user sees:

* overall summary,

* key concerns,

* nutrition overview,

* serving-size comparison,

* ingredient analysis,

* allergens,

* additives,

* evidence and confidence.

# 9. Functional Requirements

## FR-001: User input

The system shall allow users to upload one or more product-label images.

### Acceptance criteria

* Supports JPG, JPEG, PNG, and WebP.

* Supports at least three images per scan.

* Shows upload progress.

* Allows image removal and replacement.

* Preserves image-to-region association.

## FR-002: Camera capture

The system shall support mobile-browser camera capture where browser permissions and hardware allow it.

### Acceptance criteria

* Uses a visible camera action.

* Explains camera permission requirements.

* Provides a fallback to file upload.

* Allows retaking an image.

* Does not silently fail if camera access is unavailable.

## FR-003: Barcode scanning

The system may scan a barcode and query an external product database.

### Acceptance criteria

* Barcode scanning is optional.

* The user can continue without a barcode.

* The product result is marked as externally sourced.

* The system does not treat external database data as ground truth.

* Conflicts between scanned label data and database data are displayed explicitly.

## FR-004: Image-quality assessment

The system shall assess whether an image is suitable for extraction.

### Initial checks

* image dimensions,

* blur estimate,

* brightness,

* contrast,

* glare,

* rotation,

* text density,

* crop completeness.

### Acceptance criteria

* A low-quality image receives a visible explanation.

* The user can proceed with a warning if desired.

* The system records quality metrics for evaluation.

## FR-005: OCR

The system shall extract:

* recognized text,

* text confidence,

* bounding boxes,

* page or image identifier,

* detected language where possible.

### Requirements

* OCR must preserve spatial coordinates.

* Raw OCR output must be retained.

* OCR results must be versioned.

* OCR confidence must be available to downstream modules.

* OCR failures must not be confused with missing label information.

## FR-006: Region classification

The system shall classify extracted text or image areas into:

* front-of-pack claims,

* nutrition table,

* ingredients,

* allergen statement,

* serving information,

* package information,

* other text.

### Initial implementation

Use a hybrid method:

* image position,

* keyword patterns,

* layout information,

* table detection,

* user correction.

A learned region classifier may be added later.

## FR-007: Nutrition extraction

The system shall extract, where available:

* energy,

* total fat,

* saturated fat,

* trans fat,

* carbohydrate,

* total sugars,

* added sugars,

* protein,

* fiber,

* sodium,

* salt,

* serving size,

* servings per package,

* per-100-g values,

* per-100-ml values,

* per-serving values.

### Acceptance criteria

* Values are stored with units.

* Original text is retained.

* Parsed values are normalized.

* Ambiguous values are flagged.

* The system identifies whether the value is per serving, per 100 g, per 100 ml, or per package.

## FR-008: Unit normalization

The system shall convert compatible values into common units.

### Examples

* grams to milligrams,

* kilograms to grams,

* milliliters to liters,

* per serving to per package,

* per 100 g to per declared serving.

### Requirements

* The conversion formula must be logged.

* The original value must remain available.

* Invalid or impossible conversions must be rejected.

* Missing package weight must prevent package-level calculation.

## FR-009: Ingredient extraction

The system shall extract and segment the ingredient list.

### Requirements

* Identify ingredient-list boundaries.

* Normalize punctuation and separators.

* Preserve original ingredient order.

* Recognize parenthetical sub-ingredients.

* Identify percentages when explicitly listed.

* Mark uncertain ingredient tokens.

* Support “contains” and “may contain” statements separately.

## FR-010: Claim extraction

The system shall identify claims from front-of-pack and supporting text.

### Initial claim categories

* no added sugar,

* sugar-free,

* low sugar,

* low fat,

* fat-free,

* low sodium,

* high protein,

* source of protein,

* source of fiber,

* high fiber,

* multigrain,

* natural,

* whole grain,

* immunity,

* healthy,

* zero trans fat,

* cholesterol-free.

### Requirements

* Claims must include the original text span.

* Claim detection must support synonyms.

* OCR uncertainty must be retained.

* Unrecognized claims must be displayed as unverified text rather than discarded.

# 10. Core Detection Modules

## 10.1 Claim–nutrition consistency detector

### Purpose

Compare detected claims against:

* extracted nutrition values,

* ingredient evidence,

* applicable rules,

* product category,

* jurisdiction.

### Inputs

* claim text,

* claim category,

* nutrition values,

* ingredients,

* serving basis,

* jurisdiction,

* regulatory rule version.

### Outputs

JSON

```

{

  "detector": "claim_nutrition_consistency",

  "claim": "low_fat",

  "observed_value": 8.4,

  "unit": "g/100g",

  "expected_condition": "applicable threshold",

  "status": "potential_inconsistency",

  "confidence": 0.91,

  "evidence": [

    {

      "type": "nutrition_value",

      "field": "fat_per_100g",

      "value": 8.4

    }

  ],

  "rule_reference": "REGULATION_RULE_ID"

}

```

### Acceptance criteria

* Every supported claim has a rule or explanation.

* Missing values produce “insufficient evidence.”

* Naturally occurring sugar is not automatically treated as added sugar.

* Claims are evaluated according to jurisdiction.

* The result includes the exact extracted value used.

## 10.2 Serving-size plausibility detector

### Purpose

Identify declared serving sizes that appear unusually small or large relative to:

* package size,

* product category,

* reference distribution,

* number of servings per package.

### Calculations

#### Number of servings

Servings per Package=Package WeightDeclared Serving Size\text{Servings per Package} = \frac{\text{Package Weight}} {\text{Declared Serving Size}}Servings per Package=Declared Serving SizePackage Weight

#### Whole-package nutrient amount

Package Nutrient=Nutrient per Serving×Servings per Package\text{Package Nutrient} = \text{Nutrient per Serving} \times \text{Servings per Package}Package Nutrient=Nutrient per Serving×Servings per Package

#### Category deviation

z=x−μcσcz = \frac{x-\mu_c}{\sigma_c}z=σcx−μc

Where:

* xxx is the declared serving size,

* μc\mu_cμc is the category mean or median,

* σc\sigma_cσc is the category dispersion.

### Output language

Preferred:

> “The declared serving size is substantially below the reference range for this product category.”

Avoid:

> “The manufacturer manipulated the serving size.”

### Acceptance criteria

* The system displays the declared serving size.

* The system displays the package-level equivalent.

* The reference category is visible.

* The reference sample size is visible.

* Unknown product categories produce “unable to determine.”

* No intent is inferred.

## 10.3 Ingredient-order plausibility detector

### Purpose

Identify ingredient sequences that differ substantially from expected patterns for a product category.

### Inputs

* ingredient sequence,

* product category,

* ingredient positions,

* known ingredient synonyms,

* category reference profiles.

### Possible methods

* ingredient-frequency profiles,

* TF-IDF,

* ingredient-position features,

* cosine similarity,

* category prototypes,

* anomaly detection,

* one-class classification.

### Output language

> “The ingredient sequence differs from the expected pattern for this category. This is a plausibility warning, not proof of mislabeling.”

### Acceptance criteria

* Incomplete ingredient lists are marked as insufficient.

* OCR uncertainty reduces confidence.

* The system never claims that ingredient order alone proves illegality.

* Product category is shown.

* The reason for the warning is inspectable.

## 10.4 Regulatory evidence engine

### Purpose

Attach structured evidence to each rule-based finding.

### Regulatory record schema

JSON

```

{

  "rule_id": "IN_CLAIM_LOW_FAT_001",

  "jurisdiction": "IN",

  "authority": "FSSAI",

  "regulation_name": "Applicable regulation title",

  "topic": "nutrition_claim",

  "claim": "low_fat",

  "condition": {

    "field": "fat_per_100g",

    "operator": "<=",

    "value": 3

  },

  "source_url": "https://example.org/source",

  "effective_date": "YYYY-MM-DD",

  "version": "1.0",

  "legal_status": "regulatory",

  "notes": "Interpretation limitations"

}

```

### Requirements

* Rules must be versioned.

* Rules must have a jurisdiction.

* Rules must have a source.

* Rules must distinguish legal requirements from guidance.

* The engine must not silently apply Indian rules to products intended for another jurisdiction.

* The user must be able to inspect the rule used.

## 10.5 Allergen detector

### Detect

* milk,

* soy,

* wheat,

* gluten-related terms,

* peanuts,

* tree nuts,

* sesame,

* egg,

* fish,

* shellfish,

* mustard,

* other jurisdiction-specific allergens.

### Requirements

* Detect direct ingredient mentions.

* Detect “contains” statements.

* Detect “may contain” statements.

* Distinguish confirmed presence from precautionary statements.

* Display the source text.

## 10.6 Additive detector

### Detect

* additive names,

* E-numbers,

* preservatives,

* colors,

* stabilizers,

* emulsifiers,

* sweeteners,

* flavor enhancers.

### Requirements

* Additive recognition must not automatically imply that the additive is harmful.

* The system should distinguish:

  * detected,

  * function,

  * regulatory status,

  * evidence availability.

* Risk language must be cautious and evidence-based.

## 10.7 Optional nutrition-grade module

The system may display a nutrition grade as an auxiliary feature.

### Requirements

* Clearly identify whether the grade is calculated or retrieved.

* Do not present a model-derived grade as an official regulatory classification.

* If a deterministic scoring formula exists, prefer implementing and documenting it.

* If a Random Forest model is retained, report it as a baseline.

* Check for target leakage before reporting accuracy.

# 11. Confidence and Uncertainty Requirements

Every major output should include confidence information.

## Confidence dimensions

* OCR confidence,

* extraction confidence,

* claim confidence,

* product-category confidence,

* rule applicability confidence,

* detector confidence,

* evidence quality.

## Confidence levels

|

Level

|

Meaning

|

| --- | --- |

|

High

|

Strong extraction and clear rule or evidence

|

|

Medium

|

Some uncertainty or indirect evidence

|

|

Low

|

OCR, category, or rule applicability is uncertain

|

|

Unknown

|

Not enough information

|

## Required behavior

The system must lower confidence when:

* OCR text is incomplete,

* numbers are ambiguous,

* units are missing,

* serving size is unavailable,

* product category is uncertain,

* the claim is not recognized,

* the ingredient list is cropped,

* the rule is not applicable to the jurisdiction.

# 12. Trust Summary

The product may display a summary score, but it must not hide individual findings.

## Suggested summary categories

* No major inconsistency detected

* Potential inconsistency detected

* Multiple concerns detected

* Insufficient information

* Manual verification recommended

## Optional score

A user-facing score may be calculated from:

* claim consistency,

* evidence quality,

* serving-size plausibility,

* ingredient plausibility,

* extraction completeness.

However, the score must:

* be clearly labeled as a system-generated indicator,

* not be called a legal compliance score,

* not be presented as medical advice,

* show the contributing factors,

* be calibrated and evaluated separately.

# 13. Frontend Requirements

## Technology

* Next.js

* TypeScript

* Tailwind CSS

* Component library or custom accessible components

* Charting library for explanations

* Responsive design

## Main screens

### 13.1 Landing page

Content:

* product explanation,

* “Start scanning” button,

* supported input methods,

* limitation statement,

* example result.

### 13.2 Scan setup page

Features:

* upload images,

* camera capture,

* barcode option,

* product name,

* jurisdiction selection,

* language selection.

### 13.3 Capture guidance page

Shows:

* front-of-pack guide,

* nutrition-table guide,

* ingredients guide,

* image-quality tips.

### 13.4 Extraction review page

Displays:

* raw OCR text,

* extracted fields,

* editable values,

* confidence indicators,

* missing-field warnings,

* image-region references.

### 13.5 Results dashboard

Sections:

1. Summary

2. Key findings

3. Nutrition table

4. Serving-size analysis

5. Claims analysis

6. Ingredients

7. Allergens

8. Additives

9. Evidence

10. Model explanation

11. Export

### 13.6 Evidence panel

Each finding must show:

* finding title,

* status,

* severity,

* confidence,

* extracted evidence,

* expected condition,

* rule reference,

* source,

* limitations,

* user correction option.

### 13.7 Comparison page

Compare two products by:

* sugar,

* salt,

* saturated fat,

* protein,

* fiber,

* serving size,

* package-level totals,

* detected claims,

* potential concerns.

# 14. Backend Requirements

## Proposed architecture

```

Next.js frontend

       |

       v

Node.js / Express API

       |

       +--> MongoDB

       |

       +--> Python FastAPI ML service

       |

       +--> External product database

       |

       +--> Regulatory knowledge base

```

## API endpoints

### Scan management

```

POST   /api/scans

GET    /api/scans/:scanId

DELETE /api/scans/:scanId

```

### Image management

```

POST   /api/scans/:scanId/images

DELETE /api/scans/:scanId/images/:imageId

POST   /api/scans/:scanId/quality-check

```

### Processing

```

POST /api/scans/:scanId/ocr

POST /api/scans/:scanId/extract

POST /api/scans/:scanId/analyze

POST /api/scans/:scanId/reprocess

```

### Results

```

GET /api/scans/:scanId/results

GET /api/scans/:scanId/evidence

GET /api/scans/:scanId/export

```

### Product lookup

```

POST /api/products/barcode

GET  /api/products/:productId

```

### Knowledge base

```

GET /api/rules

GET /api/rules/:ruleId

GET /api/allergens

GET /api/additives

GET /api/categories

```

### Optional user features

```

POST   /api/auth/register

POST   /api/auth/login

GET    /api/users/me

GET    /api/users/me/history

```

Authentication should be postponed until the core scan pipeline works.

# 15. Python ML Service

## FastAPI endpoints

```

POST /ocr

POST /extract/nutrition

POST /extract/ingredients

POST /extract/claims

POST /analyze/serving-size

POST /analyze/ingredients

POST /predict/nutrition-grade

POST /explain

GET  /health

```

## ML service responsibilities

* OCR preprocessing,

* OCR inference,

* table extraction,

* text normalization,

* feature generation,

* statistical anomaly detection,

* model inference,

* SHAP explanation,

* confidence estimation.

## Node.js responsibilities

* authentication,

* request orchestration,

* database access,

* file metadata,

* API validation,

* response assembly,

* user history,

* knowledge-base access.

# 16. Database Design

## 16.1 Scan collection

JSON

```

{

  "_id": "scan_id",

  "user_id": "optional_user_id",

  "status": "completed",

  "created_at": "timestamp",

  "jurisdiction": "IN",

  "language": "en",

  "product": {

    "name": "optional",

    "brand": "optional",

    "barcode": "optional",

    "category": "optional"

  },

  "images": [],

  "extraction": {},

  "analysis": {},

  "system_version": "1.0.0"

}

```

## 16.2 Image collection

JSON

```

{

  "_id": "image_id",

  "scan_id": "scan_id",

  "type": "nutrition_table",

  "file_reference": "storage_reference",

  "quality": {

    "blur": 0.12,

    "glare": 0.03,

    "rotation": 0,

    "status": "acceptable"

  },

  "ocr_reference": "ocr_id"

}

```

## 16.3 OCR result

JSON

```

{

  "_id": "ocr_id",

  "image_id": "image_id",

  "engine": "paddleocr",

  "engine_version": "version",

  "text": [],

  "language": "en",

  "average_confidence": 0.92

}

```

## 16.4 Nutrition record

JSON

```

{

  "energy": {

    "value": 150,

    "unit": "kcal",

    "basis": "per_serving",

    "confidence": 0.94,

    "source_text": "150 kcal"

  },

  "sugars": {

    "value": 12,

    "unit": "g",

    "basis": "per_100g",

    "confidence": 0.88,

    "source_text": "Sugars 12 g"

  }

}

```

## 16.5 Claim record

JSON

```

{

  "claim_text": "No added sugar",

  "claim_type": "no_added_sugar",

  "source_region": "front_of_pack",

  "confidence": 0.96,

  "status": "detected"

}

```

## 16.6 Finding record

JSON

```

{

  "finding_id": "finding_id",

  "type": "claim_nutrition_consistency",

  "status": "potential_inconsistency",

  "severity": "medium",

  "confidence": 0.84,

  "evidence": [],

  "rule_reference": "rule_id",

  "limitations": []

}

```

## 16.7 Regulatory rule

JSON

```

{

  "rule_id": "rule_id",

  "jurisdiction": "IN",

  "authority": "FSSAI",

  "topic": "nutrition_claim",

  "rule_text": "Structured rule description",

  "conditions": {},

  "source_url": "source_url",

  "version": "1.0",

  "effective_date": "date",

  "status": "active"

}

```

# 17. Data and Dataset Requirements

## Product dataset

Each product should ideally contain:

* front label image,

* nutrition-table image,

* ingredient image,

* product name,

* brand,

* category,

* package weight,

* serving size,

* serving count,

* nutrition ground truth,

* ingredients ground truth,

* claims ground truth,

* language,

* jurisdiction.

## Annotation labels

### Extraction labels

* nutrition field spans,

* numeric values,

* units,

* serving-size spans,

* ingredient spans,

* claim spans,

* allergen spans.

### Detection labels

* consistent,

* inconsistent,

* plausible,

* unusual,

* insufficient evidence,

* not applicable.

### Annotation protocol

Each product should be reviewed by at least two annotators when possible.

Record:

* annotator decisions,

* disagreements,

* final adjudication,

* reason for decision,

* evidence used.

# 18. Model Training Plan

## Stage 1: No custom model

Begin with:

* pretrained OCR,

* rule-based parsing,

* dictionaries,

* regex,

* fuzzy matching,

* deterministic normalization.

This gets the MVP working quickly.

## Stage 2: Train extraction models

Train only after collecting annotated examples.

Potential tasks:

* nutrition field extraction,

* claim classification,

* ingredient entity recognition,

* product-category classification.

## Stage 3: Train plausibility models

### Serving-size model

Possible features:

* product category,

* serving size,

* package weight,

* servings per package,

* product type,

* packaging format.

### Ingredient-order model

Possible features:

* ingredient identity,

* position,

* normalized position,

* ingredient frequency,

* category,

* ingredient count,

* TF-IDF representation.

Possible models:

* logistic regression,

* random forest,

* gradient boosting,

* isolation forest,

* one-class SVM.

Start with interpretable models before deep learning.

## Stage 4: Explainability

Use SHAP for compatible tree-based models.

SHAP should explain:

* feature contribution,

* direction of contribution,

* relative importance,

* model limitations.

Do not use SHAP to explain a rule-based regulatory decision. A rule should display its actual condition directly.

# 19. Research Evaluation Requirements

## Extraction metrics

* field-level precision,

* field-level recall,

* field-level F1,

* numeric-value accuracy,

* unit accuracy,

* serving-size accuracy,

* ingredient segmentation F1,

* claim extraction F1.

## Detector metrics

* precision,

* recall,

* F1,

* false-positive rate,

* false-negative rate,

* confusion matrix,

* calibration error.

## System metrics

* OCR latency,

* extraction latency,

* rule-engine latency,

* total scan time,

* memory usage,

* API failure rate,

* successful scan rate.

## Robustness tests

Test against:

* blur,

* glare,

* low light,

* rotation,

* perspective distortion,

* multilingual text,

* small fonts,

* incomplete images,

* dense ingredient lists,

* unusual nutrition-table layouts.

## Ablation study

Compare:

1. Claim rules only

2. Claim rules + serving-size analysis

3. Claim rules + ingredient plausibility

4. Claim rules + regulatory evidence

5. Full system

## Baselines

Possible baselines:

* keyword-only claim matching,

* OCR without region separation,

* nutrition-only analysis,

* simple category-average serving-size rule,

* non-explainable classifier.

# 20. Non-Functional Requirements

## Performance

* Initial page load should be optimized for mobile.

* Basic UI actions should respond immediately.

* Processing should show progress states.

* The user must not see a frozen interface during OCR.

* Long-running tasks should be asynchronous.

## Reliability

* Failed OCR must produce a recoverable error.

* Partial extraction must be preserved.

* A single missing image must not crash the entire scan.

* External API failure must not prevent manual analysis.

## Security

* Validate uploaded file types.

* Limit file size.

* Sanitize filenames.

* Avoid exposing internal file paths.

* Use secure API authentication if accounts are enabled.

* Do not store personal data unnecessarily.

* Delete images according to a documented retention policy.

## Accessibility

* Keyboard-accessible controls.

* Visible focus states.

* Screen-reader labels.

* High-contrast warnings.

* Do not rely only on color.

* Mobile-friendly touch targets.

* Plain-language explanations.

## Privacy

* Explain whether images are stored.

* Provide deletion controls where user accounts exist.

* Avoid collecting health conditions unless absolutely necessary.

* Do not infer sensitive medical information.

* Do not sell scan data.

# 21. Regulatory and Evidence Requirements

The system must maintain a distinction between:

## Regulatory evidence

A source that defines a legal or official requirement.

## Scientific evidence

A study, dataset, or technical source supporting an interpretation.

## Heuristic evidence

A statistical pattern or category-based observation.

## User-provided evidence

A value corrected or entered manually by the user.

Each finding should show its evidence type.

### Example

```

Finding:

Potential serving-size anomaly

Evidence type:

Statistical reference

Not a legal violation:

Yes

Reason:

Declared serving size is below the reference range for this category.

Confidence:

0.68

```

# 22. Error Handling

## OCR failure

Display:

> “The text could not be read reliably. Try taking a closer, brighter image.”

## Missing nutrition table

Display:

> “Nutrition-based claim checks are unavailable because no readable nutrition table was found.”

## Missing package weight

Display:

> “Whole-package calculations cannot be completed without package weight.”

## Ambiguous unit

Display:

> “The system found a numeric value but could not reliably identify its unit.”

## Unknown claim

Display:

> “This claim was detected but is not yet supported by the current rule library.”

## Unknown jurisdiction

Display:

> “Regulatory verification is unavailable for this jurisdiction. The result is limited to non-regulatory analysis.”

## Incomplete ingredient list

Display:

> “Ingredient-order analysis is unavailable because the complete ingredient list was not captured.”

# 23. MVP Prioritization

## P0 — Must have

* image upload,

* multi-image scan,

* OCR,

* nutrition extraction,

* serving-size extraction,

* ingredient extraction,

* claim extraction,

* claim–nutrition consistency,

* package-level calculation,

* evidence panel,

* confidence display,

* error handling,

* working demo.

## P1 — Should have

* image-quality assessment,

* allergen detection,

* additive detection,

* serving-size plausibility,

* barcode lookup,

* product comparison,

* exportable report.

## P2 — Could have

* ingredient-order anomaly model,

* multilingual support,

* SHAP explanations,

* scan history,

* user accounts,

* feedback-based correction,

* category-specific dashboards.

## P3 — Future

* personalized recommendations,

* mobile application,

* advanced multimodal model,

* broader international regulations,

* crowd-sourced annotation,

* researcher dashboard,

* product database contribution workflow.

# 24. Recommended Development Sequence

## Sprint 1 — Foundation

* repository setup,

* frontend shell,

* backend shell,

* Python service,

* database schema,

* file upload,

* scan ID generation.

## Sprint 2 — OCR and extraction

* OCR integration,

* image preprocessing,

* text-region grouping,

* nutrition parser,

* serving-size parser,

* ingredient parser,

* claim parser.

## Sprint 3 — Core analysis

* unit normalization,

* claim rules,

* evidence schema,

* finding generation,

* confidence calculation,

* results API.

## Sprint 4 — Product differentiation

* serving-size plausibility,

* ingredient-order plausibility,

* allergen detection,

* additive detection,

* barcode lookup.

## Sprint 5 — Frontend polish

* extraction review,

* results dashboard,

* evidence drawer,

* comparison view,

* loading states,

* error states,

* responsive design.

## Sprint 6 — Evaluation and presentation

* test dataset,

* manual annotations,

* baseline comparison,

* ablation study,

* latency measurement,

* demo script,

* research figures,

* documentation.

# 25. Hackathon Demo Script

## Demo scenario

Use a real packaged-food product with:

* a front-of-pack claim,

* a nutrition table,

* a serving size,

* an ingredient list.

### Demonstration sequence

1. Upload front label.

2. Upload nutrition table.

3. Upload ingredient list.

4. System checks image quality.

5. OCR extracts the text.

6. User confirms or corrects extracted values.

7. System identifies claims.

8. System compares claims with nutrition values.

9. System calculates whole-package nutrition.

10. System identifies serving-size plausibility.

11. System displays ingredient and allergen information.

12. User opens the evidence panel.

13. System shows the exact extracted values, rule, source, and confidence.

14. User compares the product with another product.

## Strong demo message

> “We are not simply giving a food score. We are showing how different parts of a label relate to each other, what the evidence supports, and where the system is uncertain.”

# 26. Risks and Mitigation

|

Risk

|

Impact

|

Mitigation

|

| --- | --- | --- |

|

OCR errors

|

High

|

Multi-image input, confidence, user correction

|

|

Incorrect regulatory interpretation

|

Very high

|

Versioned rule base, source review, cautious language

|

|

False accusations

|

Very high

|

Use “potential concern,” not “fraud”

|

|

Serving-size ground truth ambiguity

|

High

|

Use reference ranges, not intent labels

|

|

Ingredient-order ambiguity

|

High

|

Treat as plausibility warning

|

|

Small dataset

|

High

|

Narrow scope and report limitations

|

|

Overly broad feature scope

|

High

|

Prioritize P0 features

|

|

External API downtime

|

Medium

|

Graceful fallback

|

|

Model leakage

|

High

|

Product-level train/test split

|

|

Unexplained trust score

|

High

|

Show component contributions

|

|

Poor hackathon reliability

|

High

|

Demo mode and fixed evaluation samples

|

|

Multilingual OCR failure

|

Medium

|

Start with English/Hinglish, expand incrementally

|

# 27. Product Analytics

Track only non-sensitive technical events.

## Suggested events

* scan_started,

* image_uploaded,

* image_quality_failed,

* ocr_completed,

* extraction_completed,

* user_corrected_field,

* analysis_completed,

* evidence_opened,

* comparison_started,

* export_requested,

* scan_failed.

## Metrics

* scan completion rate,

* average processing time,

* extraction correction rate,

* most common failed fields,

* detector activation frequency,

* evidence-panel usage,

* comparison usage,

* user-reported incorrect findings.

# 28. Definition of Done

A feature is complete when:

* its API contract is documented,

* validation exists,

* loading and error states exist,

* the feature works on mobile and desktop,

* logs are available,

* tests cover normal and invalid input,

* the output includes confidence where relevant,

* the feature does not make unsupported legal or medical claims,

* the feature is demonstrated on real product images,

* its limitations are documented.

# 29. Final MVP Acceptance Criteria

The first public demonstration is ready when the system can:

* accept at least three label images,

* identify image quality problems,

* perform OCR,

* extract a minimum of five nutrition fields,

* extract serving size and package weight when available,

* identify at least five claim types,

* normalize per-serving and per-package values,

* run at least one regulatory claim check,

* display at least one evidence-linked finding,

* distinguish rule-based findings from heuristic warnings,

* show confidence and missing-data warnings,

* recover from incomplete or unreadable input,

* complete the workflow without manual developer intervention.

# 30. Final Product Positioning

## Short description

> NutriTrust is an evidence-grounded food-label intelligence platform that detects potential inconsistencies between marketing claims, nutrition tables, serving sizes, and ingredient lists, then explains each finding using extracted evidence, regulatory references, and confidence-aware analysis.

## One-line hackathon pitch

> NutriTrust does not merely scan what a food label says—it checks how the label’s claims, numbers, serving sizes, and ingredients fit together, and shows the evidence behind every warning.

## Most important implementation rule

Build the product around this order:

```

Reliable extraction

      ↓

Transparent normalization

      ↓

Small, defensible rule engine

      ↓

Evidence-linked findings

      ↓

Statistical plausibility detectors

      ↓

Advanced ML and polish

```

Do not begin by training a large model or building authentication. The first milestone is a reliable, evidence-producing scan pipeline.
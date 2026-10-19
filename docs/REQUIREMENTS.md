# NutriLens — Project Requirements

## 1. Functional Requirements

### FR-01 — Label Image Input
The system shall accept a food-label image through upload and/or camera-oriented frontend input.

### FR-02 — OCR
The system shall use EasyOCR to detect text from the uploaded label image.

The OCR response shall preserve:
- detected text
- confidence
- bounding box

### FR-03 — Label Parsing
The system shall convert OCR output into structured label data containing:
- product name
- serving size when confidently detected
- nutrition facts
- ingredients
- allergens
- claims

The parser shall avoid inventing values when OCR information is ambiguous.

### FR-04 — Nutrition Validation
The system shall validate the presence of the required nutrition features before sending data to the ML model:

```text
energy
fat
saturatedFat
carbohydrates
sugars
fiber
proteins
salt
```

### FR-05 — Serving-Size Normalization
When a serving size in grams is available, per-serving nutrition shall be convertible to a per-100g representation using:

```text
per_100g = per_serving × (100 / serving_size_grams)
```

If serving size is unavailable or ambiguous, the system shall not fabricate it.

### FR-06 — ML Nutrition Prediction
The system shall provide Random Forest nutrition-grade prediction when all required features are available.

### FR-07 — Health-Risk Screening
The system shall calculate rule-based nutrition screening levels using the configured project thresholds.

The result shall be presented as screening information, not medical diagnosis.

### FR-08 — Ingredient Analysis
The system shall analyze ingredient text for configured:
- allergens
- preservatives
- colors
- additives
- sweeteners
- flavouring agents
- raising agents
- other configured categories

### FR-09 — Claim Verification
The system shall support:
- label claims
- evidence
- verification
- verification scores
- flagged claims

### FR-10 — Trust Score
The system shall calculate and expose an evidence-verification trust score using the project's configured methodology.

### FR-11 — Recommendations
The system shall generate structured recommendations with:
- type
- severity
- title
- message
- reason
- action

### FR-12 — Web Dashboard
The frontend shall display the analysis in a clear, responsive dashboard.

### FR-13 — API Separation
The architecture shall keep:
- Next.js frontend
- Express API
- Python OCR service
- Python ML service
- PostgreSQL

as separate logical components.

---

## 2. Non-Functional Requirements

### NFR-01 — Explainability
Major outputs shall expose understandable reasons or supporting information.

### NFR-02 — Conservative AI Behavior
The system shall not treat uncertain OCR extraction as verified nutrition data.

### NFR-03 — Performance
The local demo should provide a practical response time for typical food-label images, subject to OCR/model hardware.

### NFR-04 — Reliability
Each service shall provide a health endpoint where applicable.

### NFR-05 — Maintainability
The project shall use TypeScript for the Node/Express layer and Python for OCR/ML.

### NFR-06 — Security
Secrets shall be stored in environment variables and shall not be committed to Git.

### NFR-07 — Data Integrity
The system shall validate nutrition values before normalization and prediction.

### NFR-08 — Responsive UI
The web interface shall work on desktop and mobile layouts.

### NFR-09 — Accessibility
The frontend should support keyboard navigation, readable contrast, and reduced-motion preferences.

---

## 3. Technical Requirements

### Runtime

- Node.js 20+ recommended
- pnpm
- Python 3.11/3.12 recommended
- PostgreSQL
- Git

### Ports

```text
3000  Next.js
4000  Express
8000  ML
8001  OCR
5432  PostgreSQL
```

### Environment

API:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/nutrilens
OCR_SERVICE_URL=http://localhost:8001
ML_SERVICE_URL=http://localhost:8000
PORT=4000
```

Frontend:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

---

## 4. Model Requirements

Dataset:

```text
openfoodfacts/world-food-facts
```

Target:

```text
nutrition_grade_fr
```

Features:

```text
energy_100g
fat_100g
saturated-fat_100g
carbohydrates_100g
sugars_100g
fiber_100g
proteins_100g
salt_100g
```

Model:

```text
RandomForestClassifier
n_estimators=200
max_features=log2
class_weight=balanced
random_state=42
```

---

## 5. OCR Requirements

Current language:

```text
English
```

OCR output shall include:

```text
text
confidence
detections
boundingBox
parsedLabel
```

Future multilingual targets:

```text
Hindi
French
Italian
```

These should be implemented through language-specific dictionaries/parsers rather than changing the downstream analysis schema.

---

## 6. API Requirements

### OCR

```http
POST /api/v1/ocr/extract
```

Request:

```text
multipart/form-data
file=<image>
```

### Analysis

```http
POST /api/v1/analysis/scan/:scanId
```

### Health

```text
GET /health
GET http://localhost:8000/health
GET http://localhost:8001/health
```

---

## 7. Demo Acceptance Criteria

A successful final demo should demonstrate:

1. Image input.
2. OCR extraction.
3. Structured label parsing.
4. Ingredient/allergen/claim detection.
5. Nutrition completeness validation.
6. Nutrition normalization when applicable.
7. ML nutrition-grade prediction for complete nutrition data.
8. Health screening.
9. Evidence verification.
10. Trust score.
11. Explainable recommendations.
12. Responsive frontend presentation.

---

## 8. Submission Requirements

Before final submission:

- README must be complete.
- Team names must be added.
- Screenshots must be added.
- Demo commands must work.
- `.env` must not be committed.
- Large model files must not be pushed through normal Git.
- All required services must have documented startup instructions.
- Final branch must be pushed to the team's GitHub repository.

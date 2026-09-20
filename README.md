# NutriLens

**Label Samjhega India, Tabhi Sahi Chunega India.**

NutriLens is an evidence-grounded food-label analysis platform designed to help users understand packaged-food labels before making consumption decisions. It combines OCR, structured label parsing, nutrition normalization, machine-learning-based Nutri-Score prediction, rule-based health-risk screening, ingredient/allergen analysis, claim verification, trust scoring, and explainable recommendations.

> **Project status:** Major-project / hackathon prototype. The current prototype supports English food-label OCR. Multilingual OCR and broader personalization are planned extensions.

---

## 1. Problem Statement

Packaged-food labels contain nutrition facts, ingredients, allergens, additives, and marketing claims, but this information can be difficult to interpret quickly. Users may miss important ingredients, misunderstand serving sizes, or rely on claims without checking supporting evidence.

NutriLens addresses this problem by turning a food-label image into structured, explainable information:

```text
Food Label Image
      ↓
OCR
      ↓
Structured Label Data
      ↓
Ingredients / Nutrition / Claims
      ↓
Nutrition Normalization
      ↓
ML Nutri-Score Prediction
      ↓
Health-Risk Screening
      ↓
Ingredient & Allergen Analysis
      ↓
Evidence / Claim Verification
      ↓
Trust Score
      ↓
Explainable Recommendations
```

---

## 2. Objectives

- Extract useful information from food-label images.
- Structure ingredients, nutrition facts, allergens, and claims.
- Normalize nutrition values to a common per-100g basis when serving-size information is available.
- Predict a nutrition grade using a Random Forest model trained on OpenFoodFacts data.
- Screen nutrition values using transparent rule-based thresholds.
- Detect potential allergens and additive categories.
- Verify label claims against available evidence.
- Produce a trust score and explainable recommendations.
- Provide a clear web dashboard suitable for consumer understanding and project demonstration.

---

## 3. Key Features

### OCR & Label Understanding
- Image upload / camera-oriented workflow.
- EasyOCR-based text recognition.
- OCR confidence and bounding-box information.
- Spatial nutrition-table parsing.
- Structured label output.
- Conservative extraction: ambiguous nutrition values are not treated as complete.

### Nutrition Intelligence
- Eight ML features:
  - Energy
  - Fat
  - Saturated fat
  - Carbohydrates
  - Sugars
  - Fiber
  - Proteins
  - Salt
- Serving-size to per-100g normalization.
- Random Forest nutrition-grade prediction.
- Prediction probabilities.
- Feature validation before ML execution.

### Health Screening
Current screening thresholds are implemented as project rules:
- Sugars: >= 22.5 g HIGH, >= 5 g MEDIUM
- Saturated fat: >= 5 g HIGH, >= 1.5 g MEDIUM
- Salt: >= 1.5 g HIGH, >= 0.3 g MEDIUM
- Energy: >= 400 kcal HIGH, >= 250 kcal MEDIUM

The health-risk output is a **screening indicator, not a medical diagnosis**.

### Ingredient Intelligence
- Ingredient tokenization.
- Potential allergen detection.
- Preservative detection.
- Color detection.
- Additive detection.
- Sweetener detection.
- Flavouring / raising-agent categories.
- INS/E-number pattern detection.

Detected additives are reported as categories/findings; detection alone is not treated as proof that an ingredient is harmful.

### Claim Verification
- Claims can be stored against label data.
- Evidence can be attached to claims.
- Verification status and scores are supported.
- Flagged claims can trigger recommendations.

### Trust & Recommendations
- Evidence-verification trust score.
- Confidence and methodology information.
- Structured recommendation engine with:
  - Type
  - Severity
  - Title
  - Message
  - Reason
  - Action

---

## 4. ML Model

### Dataset

The nutrition model was trained using the Kaggle/OpenFoodFacts dataset:

`openfoodfacts/world-food-facts`

Source file:

`en.openfoodfacts.org.products.tsv`

### Input Features

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

Target:

```text
nutrition_grade_fr
```

The existing nutrition-score field is not used as an input feature.

### Model

```text
Algorithm: RandomForestClassifier
Estimators: 200
max_features: log2
class_weight: balanced
random_state: 42
```

### Reported evaluation

| Metric | Value |
|---|---:|
| Accuracy | 0.9487 |
| Balanced Accuracy | 0.9461 |
| Macro Precision | 0.9474 |
| Macro Recall | 0.9461 |
| Macro F1 | 0.9467 |
| Weighted F1 | 0.9488 |
| ROC-AUC | 0.9960 |
| PR-AUC | 0.9853 |

These are evaluation results for the project's prepared train/test split and should not be interpreted as a guarantee of performance on every real-world label.

---

## 5. Tech Stack

### Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS
- Three.js
- React Three Fiber
- Drei
- GSAP
- Framer Motion
- Lucide React
- Recharts

### Backend
- Node.js
- Express
- TypeScript
- Prisma
- PostgreSQL

### AI / ML
- Python
- FastAPI
- Uvicorn
- scikit-learn
- Random Forest
- joblib

### OCR
- Python
- EasyOCR
- Pillow
- OpenCV
- NumPy
- FastAPI

### Data
- PostgreSQL
- OpenFoodFacts / Kaggle nutrition dataset

---

## 6. Repository Structure

```text
NutriTrust/
├── apps/
├── packages/
├── services/
│   ├── api/                 # Express API + Prisma
│   ├── ml/                  # Python ML service + trained model
│   └── ocr/                 # Python EasyOCR service + parser
├── web/                     # Next.js frontend
├── prisma/                  # If used by root tooling
├── README.md
├── REQUIREMENTS.md
├── package.json
├── pnpm-workspace.yaml
├── run-all.cmd
├── run-api.cmd
├── run-ml.cmd
├── run-ocr.cmd
├── run-web.cmd
├── install-all.cmd
├── health-check.cmd
└── stop-all.cmd
```

The exact contents of `apps/` and `packages/` may evolve with the monorepo.

---

## 7. Prerequisites

Install:

- Windows 10/11
- Node.js 20+ recommended
- pnpm
- Python 3.11/3.12 recommended for ML/OCR compatibility
- PostgreSQL 18 or compatible PostgreSQL version
- Git

Check:

```powershell
node --version
pnpm --version
python --version
psql --version
```

---

## 8. Environment Variables

### API

Create:

`services/api/.env`

Example:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/nutrilens
OCR_SERVICE_URL=http://localhost:8001
ML_SERVICE_URL=http://localhost:8000
PORT=4000
```

Use your actual PostgreSQL credentials.

### Frontend

Create the web environment file expected by the frontend:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

Never commit real passwords, API keys, or private credentials.

---

## 9. Installation

From the repository root:

```powershell
pnpm install
```

For the API:

```powershell
cd services/api
pnpm install
```

For OCR:

```powershell
cd services/ocr
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
```

For ML:

```powershell
cd services/ml
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
```

---

## 10. Database Setup

Make sure PostgreSQL is running and the `nutrilens` database exists.

Then from:

```text
services/api
```

run the Prisma migration workflow configured for the project.

For a development database, use the project's existing Prisma configuration and migrations.

Do not run destructive database reset commands against a submission/demo database unless the team intentionally wants to erase its data.

---

## 11. Running the Project

The services use these ports:

| Service | Port |
|---|---:|
| Next.js | 3000 |
| Express API | 4000 |
| ML FastAPI | 8000 |
| OCR FastAPI | 8001 |
| PostgreSQL | 5432 |

### Option A — Run services individually

API:

```powershell
cd services/api
pnpm dev
```

ML:

```powershell
cd services/ml
.\.venv\Scripts\activate
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

OCR:

```powershell
cd services/ocr
.\.venv\Scripts\activate
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

Frontend:

```powershell
cd web
pnpm dev
```

Open the frontend at:

```text
http://localhost:3000
```

### Option B — Windows CMD launchers

From the repository root:

```cmd
run-api.cmd
run-ml.cmd
run-ocr.cmd
run-web.cmd
```

Or launch the complete local stack:

```cmd
run-all.cmd
```

---

## 12. Health Checks

API:

```text
http://localhost:4000/health
```

ML:

```text
http://localhost:8000/health
```

OCR:

```text
http://localhost:8001/health
```

Expected OCR health response:

```json
{
  "status": "ok",
  "service": "ocr",
  "engine": "easyocr",
  "modelLoaded": true
}
```

---

## 13. OCR API

The browser-facing API is:

```http
POST /api/v1/ocr/extract
```

Send:

```text
multipart/form-data
file=<image>
```

Example:

```powershell
curl.exe -X POST "http://localhost:4000/api/v1/ocr/extract" -F "file=@sample_food_label.jpg"
```

The response contains:

- Raw OCR text
- OCR confidence
- OCR detections
- Bounding boxes
- Parsed product name
- Nutrition values
- Nutrition quality
- Ingredients
- Allergens
- Claims

The parser intentionally reports incomplete nutrition when required fields cannot be extracted confidently.

---

## 14. Analysis API

The existing analysis endpoint is:

```http
POST /api/v1/analysis/scan/:scanId
```

A known demo scan used during development is:

```text
25c77823-2897-4b31-b8a5-78d2766abe0e
```

The analysis pipeline combines:

```text
Label Data
  ↓
Ingredient Analysis
  ↓
Nutrition Mapping
  ↓
Normalization
  ↓
ML Prediction
  ↓
Health-Risk Screening
  ↓
Claim Verification
  ↓
Trust Score
  ↓
Recommendations
```

---

## 15. Important Safety / Interpretation Notes

NutriLens distinguishes several types of outputs:

### ML Prediction
The Random Forest model predicts a nutrition grade from the configured nutrition features.

### Health-Risk Screening
Rule-based thresholds identify nutrition values that cross configured screening thresholds. This is not medical advice or diagnosis.

### Evidence Verification
Claim verification reflects the available evidence and verification rules in the system.

### Trust Score
The trust score summarizes the configured evidence-verification results. It should not be interpreted as a universal product safety score.

### OCR
OCR is probabilistic. Low-confidence or ambiguous extraction should be reviewed rather than silently converted into facts.

---

## 16. Demo Flow

Recommended hackathon demonstration:

1. Open NutriLens.
2. Show the problem: food labels contain information that is difficult to interpret quickly.
3. Upload/capture a food-label image.
4. Show OCR processing.
5. Show extracted ingredients, allergens, and claims.
6. Show nutrition extraction and confidence/completeness.
7. Show normalization to 100g when serving information is available.
8. Show Random Forest nutrition-grade prediction.
9. Show health-risk screening.
10. Show ingredient/allergen findings.
11. Show evidence verification and trust score.
12. Show explainable recommendations.

For a guaranteed demo, keep the existing known backend demo scan available in addition to live OCR.

---

## 17. Current OCR Limitation

The current OCR prototype is optimized for English labels.

Consumer-captured labels can contain:

- unusual layouts
- rotated text
- low resolution
- glare
- perspective distortion
- OCR spelling errors
- separated nutrition-table columns

Therefore the parser uses conservative extraction and exposes confidence/completeness rather than guessing missing values.

Future versions can add:

- Hindi
- French
- Italian
- automatic language detection
- stronger table reconstruction
- multilingual ingredient dictionaries

---

## 18. Future Enhancements

- Multilingual OCR.
- Better nutrition-table reconstruction.
- Automatic serving-size detection.
- Barcode/product lookup.
- Broader regulatory evidence sources.
- Controlled personalized recommendations.
- User preference profiles.
- Offline model retraining pipeline with validation and model versioning.
- Production object storage for uploaded images.
- Authentication and authorization hardening.
- Automated tests and CI/CD.

---

## 19. Team

### Team Rocket.exe

| Member | Role |
|---|---|
| Member 1 | Add team member name and contribution |
| Member 2 | Add team member name and contribution |
| Member 3 | Add team member name and contribution |
| Member 4 | Add team member name and contribution |

> Replace the placeholders above with the final names and roles before submission.

---

## 20. Screenshots / Demo

Add final screenshots before submission.

Recommended screenshots:

```text
docs/screenshots/
├── home-dashboard.png
├── label-upload.png
├── ocr-result.png
├── nutrition-analysis.png
├── ingredient-analysis.png
├── trust-score.png
└── recommendations.png
```

Recommended demo evidence:

- Landing page
- Label upload/camera
- OCR result
- Nutrition intelligence
- Health screening
- Ingredient/allergen analysis
- Claim verification
- Trust score
- Recommendations

---

## 21. Development Notes

The project is a monorepo using pnpm workspaces.

Keep these services running together during development:

```text
Next.js       :3000
Express       :4000
ML service    :8000
OCR service   :8001
PostgreSQL    :5432
```

Do not commit:

- `.env`
- Python virtual environments
- generated caches
- large temporary OCR files
- the ~509 MB Random Forest `.joblib` model through normal Git

The trained model artifact should be handled through Git LFS, an artifact/model registry, or another appropriate large-file mechanism if it must be distributed with the project.

---

## 22. License / Academic Use

This repository is a college major-project / hackathon prototype. Add the team's final license, institutional information, and third-party dataset/model attribution required by the project submission rules.

---

## 23. Final Submission Checklist

- [ ] README updated
- [ ] Team member names added
- [ ] Roles/contributions added
- [ ] Screenshots added
- [ ] Demo flow tested
- [ ] API health checked
- [ ] OCR health checked
- [ ] ML health checked
- [ ] Database connected
- [ ] `.env` excluded from Git
- [ ] Large `.joblib` model excluded from normal Git
- [ ] No hard-coded passwords/API keys
- [ ] Final Git push completed

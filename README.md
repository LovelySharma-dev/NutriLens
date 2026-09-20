<div align="center">

<!-- Header Banner -->
<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12,24,30,42&height=220&section=header&text=NutriTrust&fontSize=65&fontColor=ffffff&animation=twinkling&desc=Label%20Samjhega%20India%2C%20Tabhi%20Sahi%20Chunega%20India%20🇮🇳&descSize=20&descAlignY=72" width="100%" alt="NutriTrust Header Banner"/>

<!-- Typing Animation -->
<a href="https://git.io/typing-svg">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=24&pause=1000&color=00F0FF&center=true&vCenter=true&width=700&lines=%F0%9F%9A%80+Welcome+to+NutriTrust+by+TeamRocket.exe;%F0%9F%A4%96+AI-Powered+Food+Label+Analysis+%26+Trust+Platform;%F0%9F%94%8D+EasyOCR+%2B+ML+Nutri-Score+(94.87%25+Acc)+%2B+Claim+Verification;%F0%9F%8D%8E+Empowering+Smarter+%26+Healthier+Dietary+Decisions" alt="Typing SVG" />
</a>

<br/>

<!-- Status Badges -->
<p align="center">
  <img src="https://img.shields.io/badge/Team-TeamRocket.exe-FF0055?style=for-the-badge&logo=rocket&logoColor=white" alt="Team Name" />
  <img src="https://img.shields.io/badge/Developer-Lovely%20Sharma%20(Solo)-00C853?style=for-the-badge&logo=github&logoColor=white" alt="Solo Developer" />
  <img src="https://img.shields.io/badge/ML%20Accuracy-94.87%25-7C4DFF?style=for-the-badge&logo=scikitlearn&logoColor=white" alt="ML Accuracy" />
  <img src="https://img.shields.io/badge/Status-Active%20Prototype-00E5FF?style=for-the-badge&logo=git&logoColor=white" alt="Project Status" />
  <img src="https://img.shields.io/badge/License-MIT-FFD600?style=for-the-badge&logo=open-source-initiative&logoColor=black" alt="License" />
</p>

<div align="center">
<img src="https://user-images.githubusercontent.com/74038190/212284158-e840e285-664b-44d7-b79b-e264b5e54825.gif" width="100%">
</div>

<!-- Web App Hero Showcase -->
<p align="center">
  <img src="docs/screenshots/hero-dashboard.png" width="95%" alt="NutriTrust Web App Dashboard Preview" />
</p>

---

</div>

## 📌 Table of Contents
- [📖 Project Overview](#-project-overview)
- [⚠️ Problem Statement](#️-problem-statement)
- [✨ Key Features](#-key-features)
- [🛠️ Tech Stack](#️-tech-stack)
- [🧠 Machine Learning Model](#-machine-learning-model)
- [🔄 System Architecture & Data Flow](#-system-architecture--data-flow)
- [🚀 How to Run & Use the Project](#-how-to-run--use-the-project)
- [📸 Screenshots & Demo Details](#-screenshots--demo-details)
- [👥 Team Details](#-team-details)
- [🔮 Future Roadmap](#-future-roadmap)

---

## 📖 Project Overview

**NutriTrust** (also known as *NutriLens*) is an evidence-grounded food-label intelligence platform designed to decode packaged-food labels before consumers make purchasing or consumption decisions. 

By combining **EasyOCR text extraction**, **spatial label parsing**, **nutrition normalization (per 100g)**, **Random Forest ML Nutri-Score prediction**, **rule-based health screening**, **allergen/additive detection**, and **claim verification**, NutriTrust translates complex, confusing labels into an instant, transparent **Trust Score** with explainable dietary recommendations.

> 💡 *"Label Samjhega India, Tabhi Sahi Chunega India."* — Empowering users to make informed, healthy choices backed by machine learning and scientific evidence.

---

## ⚠️ Problem Statement

<div align="center">

| ❌ The Problem with Food Labels Today | ✅ The NutriTrust Solution |
| :--- | :--- |
| **Misleading Marketing Claims**: Products boast *"100% Natural"* or *"Zero Added Sugar"* while hiding harmful substitutes. | **Evidence-Based Claim Verification**: Cross-references label claims against actual parsed ingredients & nutrition stats. |
| **Complex Serving Math**: Nutrition tables use arbitrary serving sizes (e.g., 15g) to artificially inflate healthiness. | **Per-100g Normalization**: Converts all serving sizes to a standardized 100g baseline for honest comparison. |
| **Hidden Harmful Additives**: INS/E-numbers (preservatives, colors, artificial sweeteners) are obscured in tiny fine print. | **Instant Allergen & Additive Scanner**: Automatically flags E-numbers, synthetic colors, preservatives, and allergens. |
| **Lack of Medical Context**: High sodium and saturated fats are presented as raw numbers without risk warnings. | **ML Nutri-Score & Health Screening**: Predicts standardized Nutri-Grades (A-E) & flags high-risk nutrients. |

</div>

---

## ✨ Key Features

```text
📸 Image Upload ──► 🔍 EasyOCR ──► 📐 Normalizer ──► 🧠 ML Nutri-Score ──► 🛡️ Health Screening ──► ⭐ Trust Score & Advice
```

### 🔍 1. Smart OCR & Spatial Label Parsing
- Upload food label photos directly or capture via camera.
- Powered by **EasyOCR** & **OpenCV** with spatial bounding-box text localization.
- Conservative & reliable extraction: ambiguous values are never fabricated.

### 📊 2. ML Nutri-Score Prediction (94.87% Accuracy)
- Machine Learning classification model predicting standard **Nutri-Score Grades (A, B, C, D, E)**.
- Evaluates 8 core nutritional parameters: *Energy, Fat, Saturated Fat, Carbohydrates, Sugars, Fiber, Proteins, and Salt*.
- Displays prediction probability breakdown.

<p align="center">
  <img src="docs/screenshots/nutri-score-analysis.png" width="90%" alt="ML Nutri-Score Feature Preview" />
</p>

### 🛡️ 3. Health-Risk Screening Engine
- Transparent, rule-based screening thresholds to flag excessive nutrients:
  - 🍬 **Sugars**: `≥ 22.5g` (HIGH Risk), `≥ 5.0g` (MEDIUM Risk)
  - 🧈 **Saturated Fat**: `≥ 5.0g` (HIGH Risk), `≥ 1.5g` (MEDIUM Risk)
  - 🧂 **Salt**: `≥ 1.5g` (HIGH Risk), `≥ 0.3g` (MEDIUM Risk)
  - ⚡ **Energy**: `≥ 400 kcal` (HIGH Risk), `≥ 250 kcal` (MEDIUM Risk)

<p align="center">
  <img src="docs/screenshots/health-risk-screening.png" width="90%" alt="Health Screening Feature Preview" />
</p>

### 🧪 4. Ingredient & Allergen Intelligence
- Automatic pattern matching for **INS / E-Numbers**.
- Instant categorization of:
  - 🚨 **Allergens** (Nuts, Soy, Dairy, Gluten, Gluten derivatives)
  - 🧪 **Preservatives & Synthetic Colors**
  - 🍬 **Artificial Sweeteners & Flavoring Agents**

<p align="center">
  <img src="docs/screenshots/ingredient-taxonomy.png" width="90%" alt="Ingredient Taxonomy Feature Preview" />
</p>

### ✅ 5. Claim Verification & Evidence Engine
- Verifies package claims (e.g., *"High Protein"*, *"Low Fat"*, *"Sugar Free"*) against detected values.
- Flags false or misleading claims that fail verification criteria.

<p align="center">
  <img src="docs/screenshots/claim-verification-graph.png" width="90%" alt="Claim Verification Feature Preview" />
</p>

### ⭐ 6. Trust Score & Explainable Recommendations
- Generates a holistic **Trust Score (0–100%)** based on verification & data completeness.
- Provides actionable recommendations with severity, rationale, and recommended consumer action.

### 💻 7. Interactive 3D Web Dashboard
- Sleek modern interface built with **Next.js 16**, **Three.js**, **GSAP**, and **Tailwind CSS**.
- Interactive data visualizations with **Recharts** and **Framer Motion**.

---

## 🛠️ Tech Stack

<div align="center">

### 🎨 Technologies Used

<!-- Animated Tech Icons -->
<a href="https://skillicons.dev">
  <img src="https://skillicons.dev/icons?i=nextjs,react,ts,tailwind,nodejs,express,postgres,py,fastapi,sklearn,git" alt="Tech Stack Icons" />
</a>

<br/><br/>

| Layer | Technologies & Tools |
| :--- | :--- |
| **Frontend UI** | Next.js 16, React 19, TypeScript, Tailwind CSS, Three.js, React Three Fiber, GSAP, Framer Motion, Recharts |
| **Backend API** | Node.js, Express, TypeScript, Prisma ORM, PostgreSQL |
| **AI / ML Service** | Python 3.11, FastAPI, Scikit-Learn (Random Forest), joblib, Uvicorn |
| **OCR Service** | Python 3.11, EasyOCR, OpenCV, NumPy, Pillow, FastAPI |
| **Database & Monorepo** | PostgreSQL 18, Turborepo, pnpm Workspaces |

</div>

---

## 🧠 Machine Learning Model

The core nutrition classifier was trained on the Kaggle / OpenFoodFacts global dataset (`openfoodfacts/world-food-facts`).

```text
Algorithm       : RandomForestClassifier (200 Estimators)
Target Variable : nutrition_grade_fr (A, B, C, D, E)
Key Inputs      : energy_100g, fat_100g, saturated-fat_100g, carbohydrates_100g, 
                  sugars_100g, fiber_100g, proteins_100g, salt_100g
```

### 📈 Model Evaluation Metrics

| Metric | Score | Metric | Score |
| :--- | :---: | :--- | :---: |
| **Accuracy** | `0.9487` (94.87%) | **ROC-AUC** | `0.9960` (99.60%) |
| **Balanced Accuracy** | `0.9461` | **PR-AUC** | `0.9853` |
| **Macro F1** | `0.9467` | **Weighted F1** | `0.9488` |

---

## 🔄 System Architecture & Data Flow

```mermaid
flowchart TD
    A["📸 Food Label Image"] --> B["🔍 OCR Service (EasyOCR / FastAPI :8001)"]
    B --> C["🧩 Label Parser (Bounding Boxes & Text)"]
    C --> D["⚖️ Nutrition Normalizer (Per 100g Baseline)"]
    
    D --> E["🧠 ML Service (Random Forest / FastAPI :8000)"]
    D --> F["🛡️ Health Screening Rule Engine"]
    C --> G["🧪 Ingredient & Allergen Analyzer"]
    
    E --> H["📊 Nutri-Score Grade (A-E)"]
    F --> I["⚠️ Risk Flags (Sugars, Fat, Salt)"]
    G --> J["🚨 Allergen & Additive Report"]
    
    H & I & J --> K["✅ Claim Verification & Trust Score Engine"]
    K --> L["💻 Next.js 3D Web Dashboard (:3000)"]
```

---

## 🚀 How to Run & Use the Project

### 📋 Prerequisites

Ensure you have the following installed on your system:
- **Node.js**: `v20.x` or higher
- **pnpm**: `v9.x` or `v11.x` (`npm i -g pnpm`)
- **Python**: `v3.11.x` or `v3.12.x`
- **PostgreSQL**: `v16+` or `v18`
- **Git**

```powershell
# Verify installation versions
node --version
pnpm --version
python --version
psql --version
```

---

### ⚡ Quick Start (Windows Script Launchers)

If you are on Windows, you can start all microservices simultaneously with a single command from the project root:

```cmd
:: Launch all 4 services at once (Web, API, ML, OCR)
run-all.cmd
```

Alternatively, you can launch individual services separately:
```cmd
run-web.cmd    :: Next.js Frontend (http://localhost:3000)
run-api.cmd    :: Express API Service (http://localhost:4000)
run-ml.cmd     :: Python ML Service (http://localhost:8000)
run-ocr.cmd    :: Python OCR Service (http://localhost:8001)
```

To stop all background services cleanly:
```cmd
stop-all.cmd
```

---

### 🛠️ Manual Step-by-Step Installation

<details>
<summary><b>👉 Click to expand full step-by-step setup instructions</b></summary>

<br/>

#### Step 1: Clone Repository & Install Dependencies
```powershell
git clone https://github.com/YourRepo/NutriTrust.git
cd NutriTrust
pnpm install
```

#### Step 2: Configure Environment Variables

Create `services/api/.env`:
```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/nutrilens
OCR_SERVICE_URL=http://localhost:8001
ML_SERVICE_URL=http://localhost:8000
PORT=4000
```

Create `apps/web/.env`:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

#### Step 3: Database Migration
Ensure PostgreSQL is running, then migrate Prisma schemas:
```powershell
cd services/api
pnpm install
npx prisma migrate dev
```

#### Step 4: Setup Python Virtual Environments & Services

**OCR Service Setup (`:8001`)**:
```powershell
cd services/ocr
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

**ML Service Setup (`:8000`)**:
```powershell
cd services/ml
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Step 5: Start Express API & Next.js Web App

**Express Backend (`:4000`)**:
```powershell
cd services/api
pnpm dev
```

**Next.js Frontend (`:3000`)**:
```powershell
cd apps/web
pnpm dev
```

Now open **http://localhost:3000** in your browser! 🎉

</details>

---

### 🏥 Microservice Port Map & Health Checks

| Service | Port | Health Check Endpoint | Status Indicator |
| :--- | :---: | :--- | :---: |
| **Next.js Frontend** | `:3000` | `http://localhost:3000` | `🟢 Active` |
| **Express API** | `:4000` | `http://localhost:4000/health` | `🟢 Active` |
| **Python ML FastAPI** | `:8000` | `http://localhost:8000/health` | `🟢 Active` |
| **Python OCR FastAPI** | `:8001` | `http://localhost:8001/health` | `🟢 Active` |
| **PostgreSQL Database** | `:5432` | `localhost:5432/nutrilens` | `🟢 Active` |

---

## 📸 Screenshots & Demo Details

### 🖥️ Web Interface Gallery (11 Showcase Screens)

<div align="center">

#### 🌟 1. 3D Interactive Hero Landing Page
<img src="docs/screenshots/hero-dashboard.png" width="95%" alt="NutriTrust Hero Landing Page" />

<br/><br/>

#### ⚠️ 2. Consumer Dilemma & Packaging Fine Print Analysis
<img src="docs/screenshots/label-dilemma.png" width="95%" alt="NutriTrust Consumer Dilemma" />

<br/><br/>

#### 📸 3. Live Label Scan & Image Drop Portal
<img src="docs/screenshots/scan-label-portal.png" width="95%" alt="NutriTrust Label Scan Portal" />

<br/><br/>

#### 🔄 4. End-to-End 9-Stage Data Processing Pipeline
<img src="docs/screenshots/intelligence-pipeline.png" width="95%" alt="NutriTrust 9-Stage Processing Pipeline" />

<br/><br/>

#### 🔍 5. Interactive Feature Exploration Cards
<img src="docs/screenshots/feature-cards.png" width="95%" alt="NutriTrust Feature Exploration Cards" />

<br/><br/>

#### 📊 6. Nutrition Normalization Engine & ML Nutri-Score Prediction
<img src="docs/screenshots/nutri-score-analysis.png" width="95%" alt="NutriTrust ML Nutri-Score Analysis" />

<br/><br/>

#### 🛡️ 7. Targeted Nutrient Risk Analysis & Health Screening
<img src="docs/screenshots/health-risk-screening.png" width="95%" alt="NutriTrust Health Risk Screening" />

<br/><br/>

#### 🧪 8. Ingredient Tokenization & Additive Functional Categories
<img src="docs/screenshots/ingredient-taxonomy.png" width="95%" alt="NutriTrust Ingredient Taxonomy" />

<br/><br/>

#### ⚖️ 9. Evidence-Grounded Claim Audit Graph
<img src="docs/screenshots/claim-verification-graph.png" width="95%" alt="NutriTrust Claim Audit Graph" />

<br/><br/>

#### 👤 10. Consumer Customization & Personalized Health Parameters
<img src="docs/screenshots/consumer-customization.png" width="95%" alt="NutriTrust Consumer Customization" />

<br/><br/>

#### 🎯 11. Platform Footer & Public Trust Mission
<img src="docs/screenshots/footer-cta.png" width="95%" alt="NutriTrust Platform Footer" />

</div>

<br/>

### 🧪 Sample Food Label Test

A sample test image is included in the repository for instant testing:
📁 [`sampleData/sample_food_label.jpg`](sampleData/sample_food_label.jpg)

<div align="center">

| Sample Food Label Image | OCR & Analysis Endpoint |
| :---: | :---: |
| <img src="sampleData/sample_food_label.jpg" width="350" alt="Sample Food Label" /> | `POST /api/v1/ocr/extract` |

</div>

#### Test OCR API via cURL:
```powershell
curl.exe -X POST "http://localhost:4000/api/v1/ocr/extract" `
  -F "file=@sampleData/sample_food_label.jpg"
```

### 🎬 Recommended Demo Flow
1. **Landing Page**: Introduce the core mission (*"Label Samjhega India, Tabhi Sahi Chunega India"*).
2. **Label Capture/Upload**: Upload `sample_food_label.jpg` or capture a custom packaged food item.
3. **OCR Processing**: View bounding boxes and spatial text recognition confidence.
4. **Structured Nutrition & Normalization**: Observe automatic per-serving to per-100g conversion.
5. **ML Nutri-Score & Health Screening**: Review predicted Nutri-Grade (A-E) and sugar/fat/salt risk badges.
6. **Ingredient & Allergen Scan**: Inspect identified additives, INS/E-numbers, and potential allergens.
7. **Trust Score & Recommendations**: Explain the final verified Trust Score and personalized advice.

---

## 👥 Team Details

<div align="center">

### 🚀 Team Name: `TeamRocket.exe`

| Avatar | Team Member | Role | Socials / Contact |
| :---: | :--- | :--- | :---: |
| 🧑‍💻 | **Lovely Sharma**  | Full-Stack Developer, AI/ML Engineer, OCR Architect | [![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/LovelySharma-dev) |

<br/>

> 🏆 Built with passion 

</div>

---

## 🔮 Future Roadmap

- [ ] **Multilingual OCR Engine**: Support for Hindi, regional Indian languages, French, and Spanish labels.
- [ ] **Enhanced Table Reconstruction**: Graph-based deep learning algorithms for heavily distorted labels.
- [ ] **Barcode Lookup Integration**: Fallback product database retrieval when labels are damaged.
- [ ] **Personalized Health Profiles**: Custom dietary constraint warnings (e.g., Diabetic-friendly, Vegan, Keto, Hypertension).
- [ ] **Mobile Native Application**: React Native / Flutter implementation with direct camera scanning.

---

<div align="center">

Made with ❤️ by **TeamRocket.exe** (Lovely Sharma)

</div>

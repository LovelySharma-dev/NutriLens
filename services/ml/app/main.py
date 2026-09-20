from pathlib import Path

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field


BASE_DIR = Path(__file__).resolve().parent.parent

MODEL_PATH = BASE_DIR / "nutritrust_random_forest.joblib"
METADATA_PATH = BASE_DIR / "nutritrust_model_metadata.json"


FEATURES = [
    "energy_100g",
    "fat_100g",
    "saturated-fat_100g",
    "carbohydrates_100g",
    "sugars_100g",
    "fiber_100g",
    "proteins_100g",
    "salt_100g",
]


app = FastAPI(
    title="NutriLens ML Service",
    version="1.0.0",
)


model = None


class NutritionInput(BaseModel):
    energy_100g: float = Field(ge=0)
    fat_100g: float = Field(ge=0)
    saturated_fat_100g: float = Field(ge=0)
    carbohydrates_100g: float = Field(ge=0)
    sugars_100g: float = Field(ge=0)
    fiber_100g: float = Field(ge=0)
    proteins_100g: float = Field(ge=0)
    salt_100g: float = Field(ge=0)


@app.on_event("startup")
def load_model():
    global model

    if not MODEL_PATH.exists():
        raise RuntimeError(
            f"Model file not found: {MODEL_PATH}"
        )

    model = joblib.load(MODEL_PATH)

    print("NutriTrust Random Forest loaded.")
    print(f"Model path: {MODEL_PATH}")
    print(f"Classes: {model.classes_}")
    print(f"Features: {FEATURES}")


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "NutriLens ML Service",
        "modelLoaded": model is not None,
    }


@app.post("/predict")
def predict_nutri_score(data: NutritionInput):
    if model is None:
        raise HTTPException(
            status_code=503,
            detail="ML model is not loaded",
        )

    values = {
        "energy_100g": data.energy_100g,
        "fat_100g": data.fat_100g,
        "saturated-fat_100g": data.saturated_fat_100g,
        "carbohydrates_100g": data.carbohydrates_100g,
        "sugars_100g": data.sugars_100g,
        "fiber_100g": data.fiber_100g,
        "proteins_100g": data.proteins_100g,
        "salt_100g": data.salt_100g,
    }

    features = pd.DataFrame(
        [[values[feature] for feature in FEATURES]],
        columns=FEATURES,
    )

    prediction = model.predict(features)[0]
    probabilities = model.predict_proba(features)[0]

    probability_map = {
        str(label): float(probability)
        for label, probability in zip(
            model.classes_,
            probabilities,
        )
    }

    return {
        "predictedGrade": str(prediction),
        "probabilities": probability_map,
        "model": {
            "type": "RandomForestClassifier",
            "estimators": len(model.estimators_),
        },
    }
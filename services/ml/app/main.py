from pathlib import Path

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from app.explain import FEATURES, MEDIANS, explain_prediction


BASE_DIR = Path(__file__).resolve().parent.parent

MODEL_PATH = BASE_DIR / "nutritrust_random_forest.joblib"
METADATA_PATH = BASE_DIR / "nutritrust_model_metadata.json"


app = FastAPI(
    title="NutriLens ML Service",
    version="1.0.0",
)


model = None


class NutritionInput(BaseModel):
    energy_100g: float | None = Field(default=None, ge=0)
    fat_100g: float | None = Field(default=None, ge=0)
    saturated_fat_100g: float | None = Field(default=None, ge=0)
    carbohydrates_100g: float | None = Field(default=None, ge=0)
    sugars_100g: float | None = Field(default=None, ge=0)
    fiber_100g: float | None = Field(default=None, ge=0)
    proteins_100g: float | None = Field(default=None, ge=0)
    salt_100g: float | None = Field(default=None, ge=0)


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

    # A printed zero is a real value. Only absent fields use the median.
    missing_features = []
    for feature in FEATURES:
        if values[feature] is None:
            values[feature] = MEDIANS[feature]
            missing_features.append(feature)

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

    # Calculate health risk flags based on thresholds
    health_risk_flags = []
    if values["sugars_100g"] >= 22.5:
        health_risk_flags.append({
            "nutrient": "sugars",
            "value": values["sugars_100g"],
            "level": "HIGH"
        })
    elif values["sugars_100g"] >= 5.0:
        health_risk_flags.append({
            "nutrient": "sugars",
            "value": values["sugars_100g"],
            "level": "MEDIUM"
        })

    if values["saturated-fat_100g"] >= 5.0:
        health_risk_flags.append({
            "nutrient": "saturatedFat",
            "value": values["saturated-fat_100g"],
            "level": "HIGH"
        })
    elif values["saturated-fat_100g"] >= 1.5:
        health_risk_flags.append({
            "nutrient": "saturatedFat",
            "value": values["saturated-fat_100g"],
            "level": "MEDIUM"
        })

    if values["salt_100g"] >= 1.5:
        health_risk_flags.append({
            "nutrient": "salt",
            "value": values["salt_100g"],
            "level": "HIGH"
        })
    elif values["salt_100g"] >= 0.3:
        health_risk_flags.append({
            "nutrient": "salt",
            "value": values["salt_100g"],
            "level": "MEDIUM"
        })

    if values["energy_100g"] >= 400:
        health_risk_flags.append({
            "nutrient": "energy",
            "value": values["energy_100g"],
            "level": "HIGH"
        })
    elif values["energy_100g"] >= 250:
        health_risk_flags.append({
            "nutrient": "energy",
            "value": values["energy_100g"],
            "level": "MEDIUM"
        })

    # Determine overall risk level
    if any(flag["level"] == "HIGH" for flag in health_risk_flags):
        risk_level = "HIGH"
    elif any(flag["level"] == "MEDIUM" for flag in health_risk_flags):
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    explanation = None
    try:
        explanation = explain_prediction(model, values, str(prediction))
    except Exception as error:
        explanation = {
            "method": "unavailable",
            "grade": str(prediction),
            "features": [],
            "note": f"Explanation failed: {error}",
        }

    return {
        "predictedGrade": str(prediction),
        "probabilities": probability_map,
        "healthRisk": {
            "level": risk_level,
            "flags": health_risk_flags,
        },
        "imputedFeatures": missing_features if missing_features else None,
        "explanation": explanation,
        "model": {
            "type": "RandomForestClassifier",
            "estimators": len(model.estimators_),
        },
    }
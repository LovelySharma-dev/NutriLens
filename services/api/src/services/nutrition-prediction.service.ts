import {
  normalizeTo100g,
  validateNutrition,
  type NutritionInput,
} from "./normalization.service.js";

import {
  predictNutriScore,
  type MlPredictionResult,
} from "./ml-client.service.js";

import {
  calculateHealthRisk,
  type HealthRiskResult,
} from "./health-risk.service.js";

export interface NutritionPredictionInput {
  servingSizeGrams: number;
  nutrition: NutritionInput;
}

export interface NutritionPredictionResult {
  servingSizeGrams: number;
  normalizedNutrition: ReturnType<typeof normalizeTo100g>;
  prediction: MlPredictionResult;
  healthRisk: HealthRiskResult;
}

export async function predictNutrition(
  input: NutritionPredictionInput,
): Promise<NutritionPredictionResult> {
  const normalizedNutrition = normalizeTo100g(
    input.nutrition,
    input.servingSizeGrams,
  );

  const validationErrors =
    validateNutrition(normalizedNutrition);

  if (validationErrors.length > 0) {
    throw new Error(
      `Invalid nutrition data: ${validationErrors.join("; ")}`,
    );
  }

  const requiredFeatures = [
    "energy_100g",
    "fat_100g",
    "saturated_fat_100g",
    "carbohydrates_100g",
    "sugars_100g",
    "fiber_100g",
    "proteins_100g",
    "salt_100g",
  ] as const;

  const missingFeatures = requiredFeatures.filter(
    (feature) =>
      normalizedNutrition[feature] === undefined,
  );

  const prediction = await predictNutriScore({
    energy_100g: normalizedNutrition.energy_100g ?? null,
    fat_100g: normalizedNutrition.fat_100g ?? null,
    saturated_fat_100g:
      normalizedNutrition.saturated_fat_100g ?? null,
    carbohydrates_100g:
      normalizedNutrition.carbohydrates_100g ?? null,
    sugars_100g: normalizedNutrition.sugars_100g ?? null,
    fiber_100g: normalizedNutrition.fiber_100g ?? null,
    proteins_100g: normalizedNutrition.proteins_100g ?? null,
    salt_100g: normalizedNutrition.salt_100g ?? null,
  });

  const healthRisk = calculateHealthRisk({
    energy_100g: normalizedNutrition.energy_100g,
    sugars_100g: normalizedNutrition.sugars_100g,
    saturated_fat_100g:
      normalizedNutrition.saturated_fat_100g,
    salt_100g: normalizedNutrition.salt_100g,
  });

  return {
    servingSizeGrams: input.servingSizeGrams,
    normalizedNutrition,
    prediction,
    healthRisk,
  };
}

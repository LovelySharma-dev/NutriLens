import {
  describeWithheldGrade,
  findImplausibleNutrition,
  normalizeTo100g,
  validateNutrition,
  type NormalizedNutrition,
  type NutritionInput,
  type PlausibilityIssue,
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

export interface WithheldGrade {
  missingFeatures: string[];
  implausible: PlausibilityIssue[];
  message: string;
}

export interface NutritionPredictionResult {
  servingSizeGrams: number;
  normalizedNutrition: ReturnType<typeof normalizeTo100g>;
  prediction: MlPredictionResult | null;
  healthRisk: HealthRiskResult;
  withheld: WithheldGrade | null;
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
  const implausible = findImplausibleNutrition(normalizedNutrition);
  const screened = screenableNutrition(normalizedNutrition, implausible);
  const healthRisk = calculateHealthRisk({
    energy_100g: screened.energy_100g,
    sugars_100g: screened.sugars_100g,
    saturated_fat_100g: screened.saturated_fat_100g,
    salt_100g: screened.salt_100g,
  });

  if (missingFeatures.length > 0 || implausible.length > 0) {
    return {
      servingSizeGrams: input.servingSizeGrams,
      normalizedNutrition,
      prediction: null,
      healthRisk,
      withheld: {
        missingFeatures: [...missingFeatures],
        implausible,
        message: describeWithheldGrade(missingFeatures, implausible),
      },
    };
  }

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

  return {
    servingSizeGrams: input.servingSizeGrams,
    normalizedNutrition,
    prediction,
    healthRisk,
    withheld: null,
  };
}

export async function compareNutritionReads(input: {
  servingSizeGrams: number;
  raw: NutritionInput;
  corrected: NutritionInput;
}) {
  const [raw, corrected] = await Promise.all([
    predictNutrition({ servingSizeGrams: input.servingSizeGrams, nutrition: input.raw }),
    predictNutrition({ servingSizeGrams: input.servingSizeGrams, nutrition: input.corrected }),
  ]);

  return {
    raw: gradeLetter(raw),
    corrected: gradeLetter(corrected),
    note: "These are model letters on the raw read and on the one corrected cell. They are not a clearance.",
  };
}

function gradeLetter(result: NutritionPredictionResult) {
  return {
    grade: result.prediction?.predictedGrade ?? null,
    withheld: result.withheld?.message ?? null,
  };
}

function screenableNutrition(
  nutrition: NormalizedNutrition,
  implausible: PlausibilityIssue[],
): NormalizedNutrition {
  const screened: NormalizedNutrition = { ...nutrition };
  for (const issue of implausible) {
    delete screened[issue.feature];
  }
  return screened;
}

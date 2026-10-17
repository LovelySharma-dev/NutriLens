export interface MlNutritionInput {
  energy_100g: number | null;
  fat_100g: number | null;
  saturated_fat_100g: number | null;
  carbohydrates_100g: number | null;
  sugars_100g: number | null;
  fiber_100g: number | null;
  proteins_100g: number | null;
  salt_100g: number | null;
}

export interface MlPredictionResult {
  predictedGrade: string;
  probabilities: Record<string, number>;
  model: {
    type: string;
    estimators: number;
  };
  imputedFeatures?: string[] | null;
  explanation?: {
    method: string;
    grade: string;
    note?: string;
    features: Array<{
      feature: string;
      value: number;
      baseline: number;
      contribution: number;
    }>;
  } | null;
  healthRisk?: {
    level: string;
    flags: Array<{ nutrient: string; value: number; level: string }>;
  };
}

const ML_SERVICE_URL =
  process.env.ML_SERVICE_URL ?? "http://localhost:8000";

export async function predictNutriScore(
  nutrition: MlNutritionInput,
): Promise<MlPredictionResult> {
  const response = await fetch(
    `${ML_SERVICE_URL}/predict`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(nutrition),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `ML service prediction failed (${response.status}): ${errorText}`,
    );
  }

  return (await response.json()) as MlPredictionResult;
}
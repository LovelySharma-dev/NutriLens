export interface MlNutritionInput {
  energy_100g: number;
  fat_100g: number;
  saturated_fat_100g: number;
  carbohydrates_100g: number;
  sugars_100g: number;
  fiber_100g: number;
  proteins_100g: number;
  salt_100g: number;
}

export interface MlPredictionResult {
  predictedGrade: string;
  probabilities: Record<string, number>;
  model: {
    type: string;
    estimators: number;
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
import type { NutritionInput } from "./normalization.service.js";

export const REQUIRED_NUTRITION_FEATURES = [
  "energy",
  "fat",
  "saturatedFat",
  "carbohydrates",
  "sugars",
  "fiber",
  "proteins",
  "salt",
] as const;

export type RequiredNutritionFeature =
  (typeof REQUIRED_NUTRITION_FEATURES)[number];

export function getMissingNutritionFeatures(
  nutrition: NutritionInput,
): RequiredNutritionFeature[] {
  return REQUIRED_NUTRITION_FEATURES.filter(
    (feature) => nutrition[feature] === undefined,
  );
}

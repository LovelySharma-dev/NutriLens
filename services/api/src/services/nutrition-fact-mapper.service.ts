import type { NutritionInput } from "./normalization.service.js";

interface NutritionFactRecord {
  nutrient: string;
  value: number | null;
  unit: string | null;
  servingSize: string | null;
}

function parseServingSizeGrams(
  servingSize: string | null,
): number | undefined {
  if (!servingSize) {
    return undefined;
  }

  const match = servingSize.match(
    /(\d+(?:\.\d+)?)\s*g/i,
  );

  if (!match) {
    return undefined;
  }

  const grams = Number(match[1]);

  return Number.isFinite(grams) && grams > 0
    ? grams
    : undefined;
}

function normalizeNutrientName(
  nutrient: string,
): string {
  return nutrient
    .trim()
    .replace(/([a-z\d])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .replace(/[_-]/g, " ")
    .replace(/\./g, "")
    .replace(/\s+/g, " ");
}

const NUTRIENT_ALIASES: Record<string, keyof NutritionInput> = {
  calories: "energy",
  calorie: "energy",
  energy: "energy",
  kcal: "energy",
  fat: "fat",
  "total fat": "fat",
  "saturated fat": "saturatedFat",
  saturatedfat: "saturatedFat",
  "sat fat": "saturatedFat",
  saturates: "saturatedFat",
  carbohydrates: "carbohydrates",
  carbohydrate: "carbohydrates",
  "total carbohydrates": "carbohydrates",
  carbs: "carbohydrates",
  sugars: "sugars",
  sugar: "sugars",
  "total sugars": "sugars",
  "of which sugars": "sugars",
  fiber: "fiber",
  fibre: "fiber",
  "dietary fiber": "fiber",
  "dietary fibre": "fiber",
  protein: "proteins",
  proteins: "proteins",
  salt: "salt",
};

export function mapNutritionFactsToInput(
  facts: NutritionFactRecord[],
): {
  nutrition: NutritionInput;
  servingSizeGrams?: number;
} {
  const nutrition: NutritionInput = {};
  let servingSizeGrams: number | undefined;

  for (const fact of facts) {
    if (fact.value === null) {
      continue;
    }

    const value = Number(fact.value);

    if (!Number.isFinite(value)) {
      continue;
    }

    const name = normalizeNutrientName(fact.nutrient);

    if (name.startsWith("portion:")) {
      continue;
    }

    const parsedServingSize =
      parseServingSizeGrams(fact.servingSize);

    if (
      servingSizeGrams === undefined &&
      parsedServingSize !== undefined
    ) {
      servingSizeGrams = parsedServingSize;
    }

    const field = NUTRIENT_ALIASES[name];
    if (!field) {
      continue;
    }

    const alreadyPer100g = fact.servingSize === "100g";
    if (nutrition[field] === undefined || alreadyPer100g) {
      nutrition[field] = value;
    }
  }

  return {
    nutrition,
    servingSizeGrams,
  };
}

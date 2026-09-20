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
    .toLowerCase()
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ");
}

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

    const parsedServingSize =
      parseServingSizeGrams(fact.servingSize);

    if (
      servingSizeGrams === undefined &&
      parsedServingSize !== undefined
    ) {
      servingSizeGrams = parsedServingSize;
    }

    if (
      name === "calories" ||
      name === "energy"
    ) {
      nutrition.energy = value;
    } else if (
      name === "fat" ||
      name === "total fat"
    ) {
      nutrition.fat = value;
    } else if (
      name === "saturated fat" ||
      name === "saturated-fat"
    ) {
      nutrition.saturatedFat = value;
    } else if (
      name === "carbohydrates" ||
      name === "total carbohydrates" ||
      name === "carbohydrate"
    ) {
      nutrition.carbohydrates = value;
    } else if (
      name === "sugars" ||
      name === "total sugars"
    ) {
      nutrition.sugars = value;
    } else if (name === "fiber" || name === "dietary fiber") {
      nutrition.fiber = value;
    } else if (name === "protein") {
      nutrition.proteins = value;
    } else if (name === "salt") {
      nutrition.salt = value;
    }
  }

  return {
    nutrition,
    servingSizeGrams,
  };
}

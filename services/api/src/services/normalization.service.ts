// ============================================================
// NutriLens - Nutrition Normalization Service
// ============================================================
//
// Purpose:
// Convert nutrition values from a declared serving size
// into a common per-100g representation.
//
// The ML model was trained using Open Food Facts *_100g
// features, so the API must provide the same representation.
//
// Example:
//
// Serving size = 30 g
// Sugar        = 6 g
//
// Per 100 g:
// 6 * (100 / 30) = 20 g
// ============================================================

export interface NutritionInput {
  energy?: number;
  fat?: number;
  saturatedFat?: number;
  carbohydrates?: number;
  sugars?: number;
  fiber?: number;
  proteins?: number;
  salt?: number;
}

export interface NormalizedNutrition {
  energy_100g?: number;
  fat_100g?: number;
  saturated_fat_100g?: number;
  carbohydrates_100g?: number;
  sugars_100g?: number;
  fiber_100g?: number;
  proteins_100g?: number;
  salt_100g?: number;
}

export function normalizeTo100g(
  nutrition: NutritionInput,
  servingSizeGrams: number,
): NormalizedNutrition {
  if (!Number.isFinite(servingSizeGrams)) {
    throw new Error("Serving size must be a valid number");
  }

  if (servingSizeGrams <= 0) {
    throw new Error("Serving size must be greater than 0");
  }

  const factor = 100 / servingSizeGrams;

  return {
    energy_100g:
      nutrition.energy !== undefined
        ? nutrition.energy * factor
        : undefined,

    fat_100g:
      nutrition.fat !== undefined
        ? nutrition.fat * factor
        : undefined,

    saturated_fat_100g:
      nutrition.saturatedFat !== undefined
        ? nutrition.saturatedFat * factor
        : undefined,

    carbohydrates_100g:
      nutrition.carbohydrates !== undefined
        ? nutrition.carbohydrates * factor
        : undefined,

    sugars_100g:
      nutrition.sugars !== undefined
        ? nutrition.sugars * factor
        : undefined,

    fiber_100g:
      nutrition.fiber !== undefined
        ? nutrition.fiber * factor
        : undefined,

    proteins_100g:
      nutrition.proteins !== undefined
        ? nutrition.proteins * factor
        : undefined,

    salt_100g:
      nutrition.salt !== undefined
        ? nutrition.salt * factor
        : undefined,
  };
}


// ============================================================
// Nutrition Validation
// ============================================================
//
// Checks whether the normalized values are usable by the
// ML pipeline.
//
// This is NOT medical validation.
// It is data-quality validation.
// ============================================================

export function validateNutrition(
  nutrition: NormalizedNutrition,
): string[] {
  const errors: string[] = [];

  const values = Object.entries(nutrition);

  for (const [name, value] of values) {
    if (value === undefined) {
      continue;
    }

    if (!Number.isFinite(value)) {
      errors.push(`${name} must be a valid number`);
      continue;
    }

    if (value < 0) {
      errors.push(`${name} cannot be negative`);
    }
  }

  return errors;
}
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

const NUTRIENT_LABELS: Record<keyof NormalizedNutrition, string> = {
  energy_100g: "Energy",
  fat_100g: "Fat",
  saturated_fat_100g: "Saturated fat",
  carbohydrates_100g: "Carbohydrates",
  sugars_100g: "Sugars",
  fiber_100g: "Fiber",
  proteins_100g: "Protein",
  salt_100g: "Salt",
};

// Physical ceilings for a per-100 g table. Salt stops at 15 g because a
// higher figure on a packaged-food panel is almost always milligrams or a
// percent read as grams. A printed zero stays inside every ceiling.
const CEILINGS: Record<keyof NormalizedNutrition, number> = {
  energy_100g: 900,
  fat_100g: 100,
  saturated_fat_100g: 100,
  carbohydrates_100g: 100,
  sugars_100g: 100,
  fiber_100g: 100,
  proteins_100g: 100,
  salt_100g: 15,
};

export interface PlausibilityIssue {
  feature: keyof NormalizedNutrition;
  value: number;
  message: string;
}

export function findImplausibleNutrition(
  nutrition: NormalizedNutrition,
): PlausibilityIssue[] {
  const issues: PlausibilityIssue[] = [];

  for (const feature of Object.keys(CEILINGS) as Array<keyof NormalizedNutrition>) {
    const value = nutrition[feature];
    if (value === undefined || !Number.isFinite(value) || value < 0) {
      continue;
    }

    const ceiling = CEILINGS[feature];
    if (value > ceiling) {
      const unit = feature === "energy_100g" ? "kcal" : "g";
      issues.push({
        feature,
        value,
        message: `${NUTRIENT_LABELS[feature]} is ${value} ${unit} per 100 g, above the ${ceiling} ${unit} ceiling.`,
      });
    }
  }

  const fat = nutrition.fat_100g;
  const saturatedFat = nutrition.saturated_fat_100g;
  if (
    fat !== undefined &&
    saturatedFat !== undefined &&
    saturatedFat > fat + 0.5
  ) {
    issues.push({
      feature: "saturated_fat_100g",
      value: saturatedFat,
      message: `Saturated fat is ${saturatedFat} g per 100 g, higher than total fat ${fat} g.`,
    });
  }

  const carbohydrates = nutrition.carbohydrates_100g;
  const sugars = nutrition.sugars_100g;
  if (
    carbohydrates !== undefined &&
    sugars !== undefined &&
    sugars > carbohydrates + 0.5
  ) {
    issues.push({
      feature: "sugars_100g",
      value: sugars,
      message: `Sugars are ${sugars} g per 100 g, higher than carbohydrates ${carbohydrates} g.`,
    });
  }

  return issues;
}

const MISSING_LABELS: Record<string, string> = {
  energy: "energy",
  fat: "fat",
  saturatedFat: "saturated fat",
  carbohydrates: "carbohydrates",
  sugars: "sugars",
  fiber: "fiber",
  proteins: "protein",
  salt: "salt",
  energy_100g: "energy",
  fat_100g: "fat",
  saturated_fat_100g: "saturated fat",
  carbohydrates_100g: "carbohydrates",
  sugars_100g: "sugars",
  fiber_100g: "fiber",
  proteins_100g: "protein",
  salt_100g: "salt",
};

export function describeWithheldGrade(
  missing: string[],
  implausible: PlausibilityIssue[],
): string {
  const parts: string[] = ["Grade withheld."];

  if (missing.length > 0) {
    const names = missing.map((feature) => MISSING_LABELS[feature] ?? feature);
    parts.push(`Missing ${names.join(", ")}.`);
  }

  for (const issue of implausible) {
    parts.push(issue.message);
  }

  parts.push("Missing or impossible numbers are not replaced with a training median.");
  return parts.join(" ");
}
export type RiskLevel =
  | "LOW"
  | "MEDIUM"
  | "HIGH";

export interface HealthRiskInput {
  energy_100g?: number;
  sugars_100g?: number;
  saturated_fat_100g?: number;
  salt_100g?: number;
}

export interface HealthRiskFactor {
  nutrient: string;
  value: number;
  unit: string;
  level: RiskLevel;
  message: string;
}

export interface HealthRiskResult {
  overallLevel: RiskLevel | "UNKNOWN";
  factors: HealthRiskFactor[];
}

function getOverallLevel(
  factors: HealthRiskFactor[],
): RiskLevel | "UNKNOWN" {
  if (factors.length === 0) {
    return "UNKNOWN";
  }

  if (
    factors.some((factor) => factor.level === "HIGH")
  ) {
    return "HIGH";
  }

  if (
    factors.some(
      (factor) => factor.level === "MEDIUM",
    )
  ) {
    return "MEDIUM";
  }

  return "LOW";
}

export function calculateHealthRisk(
  nutrition: HealthRiskInput,
): HealthRiskResult {
  const factors: HealthRiskFactor[] = [];

  if (nutrition.sugars_100g !== undefined) {
    if (nutrition.sugars_100g >= 22.5) {
      factors.push({
        nutrient: "sugars",
        value: nutrition.sugars_100g,
        unit: "g/100g",
        level: "HIGH",
        message: "High sugar content detected.",
      });
    } else if (nutrition.sugars_100g >= 5) {
      factors.push({
        nutrient: "sugars",
        value: nutrition.sugars_100g,
        unit: "g/100g",
        level: "MEDIUM",
        message: "Moderate sugar content detected.",
      });
    }
  }

  if (
    nutrition.saturated_fat_100g !== undefined
  ) {
    if (nutrition.saturated_fat_100g >= 5) {
      factors.push({
        nutrient: "saturated_fat",
        value: nutrition.saturated_fat_100g,
        unit: "g/100g",
        level: "HIGH",
        message:
          "High saturated fat content detected.",
      });
    } else if (
      nutrition.saturated_fat_100g >= 1.5
    ) {
      factors.push({
        nutrient: "saturated_fat",
        value: nutrition.saturated_fat_100g,
        unit: "g/100g",
        level: "MEDIUM",
        message:
          "Moderate saturated fat content detected.",
      });
    }
  }

  if (nutrition.salt_100g !== undefined) {
    if (nutrition.salt_100g >= 1.5) {
      factors.push({
        nutrient: "salt",
        value: nutrition.salt_100g,
        unit: "g/100g",
        level: "HIGH",
        message: "High salt content detected.",
      });
    } else if (nutrition.salt_100g >= 0.3) {
      factors.push({
        nutrient: "salt",
        value: nutrition.salt_100g,
        unit: "g/100g",
        level: "MEDIUM",
        message: "Moderate salt content detected.",
      });
    }
  }

  if (nutrition.energy_100g !== undefined) {
    if (nutrition.energy_100g >= 400) {
      factors.push({
        nutrient: "energy",
        value: nutrition.energy_100g,
        unit: "kcal/100g",
        level: "HIGH",
        message: "High energy density detected.",
      });
    } else if (nutrition.energy_100g >= 250) {
      factors.push({
        nutrient: "energy",
        value: nutrition.energy_100g,
        unit: "kcal/100g",
        level: "MEDIUM",
        message:
          "Moderate energy density detected.",
      });
    }
  }

  return {
    overallLevel: getOverallLevel(factors),
    factors,
  };
}
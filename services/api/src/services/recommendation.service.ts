export type RecommendationType =
  | "HEALTH"
  | "ALLERGEN"
  | "ADDITIVE"
  | "NUTRITION"
  | "VERIFICATION";

export type RecommendationSeverity =
  | "INFO"
  | "MEDIUM"
  | "HIGH";

export interface Recommendation {
  type: RecommendationType;
  severity: RecommendationSeverity;
  title: string;
  message: string;
  reason: string;
  action: string;
}

export interface RecommendationInput {
  healthRisk?: {
    overallLevel: "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN";
    factors: Array<{
      nutrient: string;
      value: number;
      unit: string;
      level: "LOW" | "MEDIUM" | "HIGH";
      message: string;
    }>;
  } | null;

  ingredientAnalysis?: {
    allergens: Array<unknown>;
    preservatives: Array<unknown>;
    colors: Array<unknown>;
    additives: Array<unknown>;
    sweeteners: Array<unknown>;
  } | null;

  flaggedClaims: number;
  claimsAnalyzed: number;
  nutritionFactsAvailable: boolean;
}

export function generateRecommendations(
  input: RecommendationInput,
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // Missing-data recommendations
  if (input.claimsAnalyzed === 0) {
    recommendations.push({
      type: "VERIFICATION",
      severity: "INFO",
      title: "No claims detected",
      message:
        "No label claims were available for evidence verification.",
      reason:
        "The extracted label data did not contain any claims.",
      action:
        "Additional label analysis may be required to identify claims.",
    });
  }

  if (!input.nutritionFactsAvailable) {
    recommendations.push({
      type: "NUTRITION",
      severity: "INFO",
      title: "Nutrition information unavailable",
      message:
        "Nutrition information was not available in the extracted label data.",
      reason:
        "No nutrition facts were available for analysis.",
      action:
        "Review or rescan the nutrition section of the product label.",
    });
  }

  if (input.healthRisk) {
    for (const factor of input.healthRisk.factors) {
      if (factor.level === "HIGH") {
        recommendations.push({
          type: "HEALTH",
          severity: "HIGH",
          title: `High ${factor.nutrient.replace(/_/g, " ")} content`,
          message: factor.message,
          reason: `${factor.nutrient.replace(/_/g, " ")} is ${factor.value} ${factor.unit}.`,
          action:
            "Consider comparing this product with alternatives containing lower levels of this nutrient.",
        });
      } else if (factor.level === "MEDIUM") {
        recommendations.push({
          type: "NUTRITION",
          severity: "MEDIUM",
          title: `Moderate ${factor.nutrient.replace(/_/g, " ")} content`,
          message: factor.message,
          reason: `${factor.nutrient.replace(/_/g, " ")} is ${factor.value} ${factor.unit}.`,
          action:
            "Review the nutrition information and compare with similar products if this nutrient is a concern.",
        });
      }
    }
  }

  if (
    input.ingredientAnalysis &&
    input.ingredientAnalysis.allergens.length > 0
  ) {
    recommendations.push({
      type: "ALLERGEN",
      severity: "HIGH",
      title: "Potential allergen detected",
      message:
        `${input.ingredientAnalysis.allergens.length} potential allergen(s) were detected in the ingredient list.`,
      reason:
        "The ingredient analysis identified ingredient terms associated with known allergen categories.",
      action:
        "Check the ingredient list and allergen declaration carefully before consuming if the ingredient is relevant to you.",
    });
  }

  if (
    input.ingredientAnalysis &&
    (
      input.ingredientAnalysis.preservatives.length > 0 ||
      input.ingredientAnalysis.colors.length > 0 ||
      input.ingredientAnalysis.additives.length > 0 ||
      input.ingredientAnalysis.sweeteners.length > 0
    )
  ) {
    recommendations.push({
      type: "ADDITIVE",
      severity: "INFO",
      title: "Food additives detected",
      message:
        "One or more food additives were identified in the ingredient list.",
      reason:
        "The ingredient analysis matched one or more additive categories.",
      action:
        "Review the identified additives and their supporting regulatory or scientific evidence.",
    });
  }

  if (input.flaggedClaims > 0) {
    recommendations.push({
      type: "VERIFICATION",
      severity: "HIGH",
      title: "Claim requires review",
      message:
        `${input.flaggedClaims} claim(s) were flagged during evidence verification.`,
      reason:
        "Available evidence verification did not support the claim sufficiently.",
      action:
        "Review the evidence and verification explanation before relying on the claim.",
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      type: "VERIFICATION",
      severity: "INFO",
      title: "No immediate issues identified",
      message:
        "No recommendation-triggering findings were detected by the current analysis rules.",
      reason:
        "The configured nutrition, ingredient, and claim checks did not produce a recommendation.",
      action:
        "Review the complete analysis for additional product information.",
    });
  }

  return recommendations;
}
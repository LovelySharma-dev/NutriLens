import prisma from "../config/database.js";
import { getMissingNutritionFeatures } from "./nutrition-feature-validation.service.js";
import { calculateTrustScore } from "./trust.service.js";
import { analyzeIngredients } from "./ingredient-analysis.service.js";
import { mapNutritionFactsToInput } from "./nutrition-fact-mapper.service.js";
import { predictNutrition } from "./nutrition-prediction.service.js";
import { generateRecommendations } from "./recommendation.service.js";

export async function analyzeScan(scanId: string) {
  const scan = await prisma.scan.findUnique({
    where: { id: scanId },
    include: {
      labelData: {
        include: {
          ingredients: true,
          nutritionFacts: true,
          claims: {
            include: {
              verifications: true,
            },
          },
        },
      },
      report: true,
    },
  });

  if (!scan) {
    throw new Error("Scan not found");
  }

  if (!scan.labelData) {
    throw new Error("Label data not found for this scan");
  }

  const claims = scan.labelData.claims;
  const ingredients = scan.labelData.ingredients;

  const ingredientText = ingredients
    .map((ingredient) => ingredient.name)
    .join(", ");

  const ingredientAnalysis =
    ingredients.length > 0 ? analyzeIngredients(ingredientText) : null;

  const nutritionMapping = mapNutritionFactsToInput(
    scan.labelData.nutritionFacts,
  );

  const missingNutritionFeatures = getMissingNutritionFeatures(
    nutritionMapping.nutrition,
  );

  const nutritionPredictionStatus =
    missingNutritionFeatures.length === 0 ? "READY" : "INCOMPLETE";

  let nutritionPrediction = null;

  if (
    nutritionPredictionStatus === "READY" &&
    nutritionMapping.servingSizeGrams !== undefined
  ) {
    nutritionPrediction = await predictNutrition({
      servingSizeGrams: nutritionMapping.servingSizeGrams,
      nutrition: nutritionMapping.nutrition,
    });
  }
  const verificationScores = claims.flatMap((claim) =>
    claim.verifications.map(
      (verification) =>
        verification.score ??
        (
          {
            VERIFIED: 1,
            UNCERTAIN: 0.5,
            FLAGGED: 0,
          } as const
        )[verification.status],
    ),
  );

  const averageScore =
    verificationScores.length > 0
      ? verificationScores.reduce((sum, score) => sum + score, 0) /
        verificationScores.length
      : null;

  let riskLevel = "UNKNOWN";

  if (averageScore !== null) {
    if (averageScore >= 0.8) {
      riskLevel = "LOW";
    } else if (averageScore >= 0.5) {
      riskLevel = "MEDIUM";
    } else {
      riskLevel = "HIGH";
    }
  }

  const flaggedClaims = claims.filter((claim) =>
    claim.verifications.some(
      (verification) => verification.status === "FLAGGED",
    ),
  );

  const structuredRecommendations = generateRecommendations({
    healthRisk: nutritionPrediction?.healthRisk ?? null,
    ingredientAnalysis,
    flaggedClaims: flaggedClaims.length,
    claimsAnalyzed: claims.length,
    nutritionFactsAvailable: scan.labelData.nutritionFacts.length > 0,
  });

  const summary =
    claims.length > 0
      ? `Analyzed ${claims.length} label claim(s) using available evidence verification.`
      : "Label analysis completed, but no claims were available for verification.";

  const reportRecommendations = structuredRecommendations.map(
    (recommendation) => recommendation.message,
  );

  const report = await prisma.report.upsert({
    where: { scanId },
    update: {
      summary,
      riskLevel,
      recommendations: reportRecommendations,
    },
    create: {
      scanId,
      summary,
      riskLevel,
      recommendations: reportRecommendations,
    },
  });
  const trustScore = await calculateTrustScore(report.id);

  return {
    scanId,
    report,
    trustScore,
    analysis: {
      claimsAnalyzed: claims.length,
      verificationsAnalyzed: verificationScores.length,
      flaggedClaims: flaggedClaims.length,
      averageScore,
      riskLevel,

      ingredientsAnalyzed: ingredients.length,
      ingredientAnalysis,

      nutrition: {
        factsAnalyzed: scan.labelData.nutritionFacts.length,
        mappedInput: nutritionMapping.nutrition,
        servingSizeGrams: nutritionMapping.servingSizeGrams,
      },
      nutritionPrediction: {
        status: nutritionPredictionStatus,
        missingFeatures: missingNutritionFeatures,
        result: nutritionPrediction,
      },

      recommendations: structuredRecommendations,
    },
  };
}

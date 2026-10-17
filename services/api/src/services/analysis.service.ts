import prisma from "../config/database.js";
import { getMissingNutritionFeatures } from "./nutrition-feature-validation.service.js";
import { calculateTrustScore } from "./trust.service.js";
import { analyzeIngredients } from "./ingredient-analysis.service.js";
import { mapNutritionFactsToInput } from "./nutrition-fact-mapper.service.js";
import { predictNutrition } from "./nutrition-prediction.service.js";
import { generateRecommendations, applyProfile, type ConsumerProfile } from "./recommendation.service.js";

function extractAllergensFromText(text: string): string[] {
  const knownTerms = [
    "milk",
    "soy",
    "wheat",
    "gluten",
    "barley",
    "peanut",
    "mustard",
    "celery",
    "sesame",
    "nuts",
  ];

  const lowerText = text.toLowerCase();
  const detected: string[] = [];

  for (const term of knownTerms) {
    if (lowerText.includes(term)) {
      detected.push(term);
    }
  }

  return detected;
}

export async function analyzeScan(
  scanId: string,
  profile?: ConsumerProfile,
) {
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

  let ingredientAnalysis;

  if (ingredients.length > 0) {
    ingredientAnalysis = analyzeIngredients(ingredientText);

    // Merge allergens from OCR result with detected allergens
    if (scan.labelData.rawOcrText) {
      const ocrAllergens = extractAllergensFromText(scan.labelData.rawOcrText);
      if (ocrAllergens.length > 0) {
        ingredientAnalysis.allergens = [
          ...new Set([
            ...ingredientAnalysis.allergens.map((a: any) => a.ingredient),
            ...ocrAllergens,
          ]),
        ].map((allergen) => ({
          ingredient: allergen,
          category: "ALLERGEN" as const,
          matchedTerm: allergen,
          concern: "Potential allergen requiring consumer-specific attention.",
        }));
      }
    }
  } else {
    ingredientAnalysis = null;
  }

  const nutritionMapping = mapNutritionFactsToInput(
    scan.labelData.nutritionFacts,
  );

  const missingNutritionFeatures = getMissingNutritionFeatures(
    nutritionMapping.nutrition,
  );

  const nutritionPredictionStatus =
    missingNutritionFeatures.length === 0 ? "READY" : "INCOMPLETE";

  let nutritionPrediction = null;

  // Always attempt ML prediction - service now handles partial data with imputation
  if (nutritionMapping.servingSizeGrams !== undefined) {
    try {
      nutritionPrediction = await predictNutrition({
        servingSizeGrams: nutritionMapping.servingSizeGrams,
        nutrition: nutritionMapping.nutrition,
      });
    } catch (error) {
      console.warn("ML prediction failed:", error);
      nutritionPrediction = null;
    }
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
    healthRisk: nutritionPrediction?.prediction?.healthRisk ?? nutritionPrediction?.healthRisk ?? null,
    ingredientAnalysis: ingredientAnalysis ? {
      ...ingredientAnalysis,
      allergenFound: ingredientAnalysis.allergens.length > 0,
      allergens: ingredientAnalysis.allergens.map((a: any) => a.ingredient),
      additivesCount: ingredientAnalysis.additives.length,
    } : null,
    flaggedClaims: flaggedClaims.length,
    claimsAnalyzed: claims.length,
    nutritionFactsAvailable: scan.labelData.nutritionFacts.length > 0,
  });

  const personalized = applyProfile(
    structuredRecommendations,
    profile,
    `${ingredientText} ${scan.labelData.rawOcrText ?? ""}`,
  );

  const summary =
    claims.length > 0
      ? `Analyzed ${claims.length} label claim(s) using available evidence verification.`
      : "Label analysis completed, but no claims were available for verification.";

  const reportRecommendations = personalized.recommendations.map(
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
        result: nutritionPrediction ? {
          predictedGrade: nutritionPrediction.prediction.predictedGrade,
          probabilities: nutritionPrediction.prediction.probabilities,
          healthRisk: nutritionPrediction.prediction.healthRisk,
          explanation: nutritionPrediction.prediction.explanation ?? null,
          imputedFeatures: nutritionPrediction.prediction.imputedFeatures ?? null,
        } : null,
      },

      personalFit: personalized.personalFit,
      recommendations: personalized.recommendations,
    },
  };
}

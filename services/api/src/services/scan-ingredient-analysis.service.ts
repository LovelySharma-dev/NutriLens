import prisma from "../config/database.js";
import { analyzeIngredients } from "./ingredient-analysis.service.js";

export async function analyzeScanIngredients(scanId: string) {
  if (!scanId) {
    throw new Error("Scan ID is required");
  }

  const scan = await prisma.scan.findUnique({
    where: {
      id: scanId,
    },
    include: {
      labelData: {
        include: {
          ingredients: {
            orderBy: {
              position: "asc",
            },
          },
        },
      },
    },
  });

  if (!scan) {
    throw new Error("Scan not found");
  }

  if (!scan.labelData) {
    throw new Error("Label data not found for this scan");
  }

  const ingredients = scan.labelData.ingredients;

  if (ingredients.length === 0) {
    throw new Error("No ingredients found for this scan");
  }

  const ingredientText = ingredients
    .map((ingredient) => ingredient.name)
    .join(", ");

  const analysis = analyzeIngredients(ingredientText);

  return {
    scanId,
    labelDataId: scan.labelData.id,
    ingredientCount: ingredients.length,
    analysis,
  };
}
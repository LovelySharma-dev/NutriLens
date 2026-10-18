import prisma from "../config/database.js";
import type { OcrResult } from "./ocr.client.service.js";

export interface CreateScanInput {
  userId?: string;
  imageUrl?: string;
}

export async function createScan(input: CreateScanInput) {
  return prisma.scan.create({
    data: {
      userId: input.userId,
      imageUrl: input.imageUrl,
      status: "PENDING",
    },
  });
}

export async function createScanFromOcrResult(ocrResult: OcrResult) {
  const parsed = ocrResult.parsedLabel;

  const nutritionEntries = Object.entries(parsed.nutrition || {}).flatMap(
    ([nutrient, detail]) => {
      const per100 = detail.per100g?.value;
      const portion = detail.perPortion?.value;
      const portionLabel = parsed.servingSizeGrams
        ? `${parsed.servingSizeGrams}g`
        : undefined;
      const rows = [];

      if (typeof per100 === "number") {
        rows.push({
          nutrient,
          value: per100,
          unit: detail.per100g?.unit || detail.unit,
          servingSize: "100g",
        });
      } else {
        rows.push({
          nutrient,
          value: detail.value,
          unit: detail.unit,
          servingSize: portionLabel,
        });
      }

      if (typeof portion === "number") {
        rows.push({
          nutrient: `portion:${nutrient}`,
          value: portion,
          unit: detail.perPortion?.unit || detail.unit,
          servingSize: portionLabel,
        });
      }

      return rows;
    },
  );

  const ingredientEntries = (parsed.ingredients || []).map((name, idx) => ({
    name,
    position: idx + 1,
  }));

  // Normalize allergens from OCR result
  const normalizedAllergens = (parsed.allergens || []).map((a: string) =>
    a.toLowerCase().trim()
  );

  const claimEntries = (parsed.claims || []).map((text) => ({
    text,
  }));

  return prisma.scan.create({
    data: {
      status: "PROCESSING",
      labelData: {
        create: {
          productName: parsed.productName ?? "Scanned Food Label",
          rawOcrText: ocrResult.text,
          ingredients: {
            create: ingredientEntries,
          },
          nutritionFacts: {
            create: nutritionEntries,
          },
          claims: {
            create: claimEntries,
          },
        },
      },
    },
    include: {
      labelData: {
        include: {
          ingredients: true,
          nutritionFacts: true,
          claims: true,
        },
      },
    },
  });
}

export async function getScanById(scanId: string) {
  return prisma.scan.findUnique({
    where: {
      id: scanId,
    },
    include: {
      labelData: {
        include: {
          ingredients: true,
          nutritionFacts: true,
          claims: true,
        },
      },
      report: {
        include: {
          trustScore: true,
        },
      },
    },
  });
}

export async function getRecentScans(limit = 20) {
  return prisma.scan.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
    include: {
      labelData: true,
      report: true,
    },
  });
}
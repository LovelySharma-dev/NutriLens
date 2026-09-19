import prisma from "../config/database.js";

export interface CreateNutritionInput {
  labelDataId: string;
  nutrient: string;
  value?: number;
  unit?: string;
  servingSize?: string;
}

export async function createNutritionFact(input: CreateNutritionInput) {
  return prisma.nutritionFact.create({
    data: {
      labelDataId: input.labelDataId,
      nutrient: input.nutrient,
      value: input.value,
      unit: input.unit,
      servingSize: input.servingSize,
    },
  });
}

export async function getNutritionFactsByLabelDataId(
  labelDataId: string,
) {
  return prisma.nutritionFact.findMany({
    where: {
      labelDataId,
    },
  });
}
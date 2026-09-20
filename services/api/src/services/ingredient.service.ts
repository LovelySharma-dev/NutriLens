import prisma from "../config/database.js";

export interface CreateIngredientInput {
  labelDataId: string;
  name: string;
  position?: number;
  confidence?: number;
}

export async function createIngredient(input: CreateIngredientInput) {
  return prisma.ingredient.create({
    data: {
      labelDataId: input.labelDataId,
      name: input.name,
      position: input.position,
      confidence: input.confidence,
    },
  });
}

export async function getIngredientsByLabelDataId(labelDataId: string) {
  return prisma.ingredient.findMany({
    where: {
      labelDataId,
    },
    orderBy: {
      position: "asc",
    },
  });
}
import type { Request, Response } from "express";

import {
  createNutritionFact,
  getNutritionFactsByLabelDataId,
} from "../services/nutrition.service.js";

interface CreateNutritionInput {
  labelDataId: string;
  nutrient: string;
  value?: number;
  unit?: string;
  servingSize?: string;
}

export async function createNutritionController(
  req: Request<{}, {}, CreateNutritionInput>,
  res: Response,
) {
  try {
    const { labelDataId, nutrient, value, unit, servingSize } = req.body;

    if (!labelDataId || !nutrient) {
      res.status(400).json({
        status: "error",
        message: "labelDataId and nutrient are required",
      });
      return;
    }

    const nutritionFact = await createNutritionFact({
      labelDataId,
      nutrient,
      value,
      unit,
      servingSize,
    });

    res.status(201).json({
      status: "success",
      data: nutritionFact,
    });
  } catch (error) {
    console.error("Create nutrition fact error:", error);

    res.status(500).json({
      status: "error",
      message: "Failed to create nutrition fact",
    });
  }
}


export async function getNutritionController(req: Request<{ labelDataId: string }>, res: Response) {
    try{
        const nutritionFacts = await getNutritionFactsByLabelDataId(req.params.labelDataId)

        res.json({
            status: "success",
            data: nutritionFacts
        })
    }catch(error){
        console.error("Get nutrition facts error:", error);

    res.status(500).json({
      status: "error",
      message: "Failed to retrieve nutrition facts",
    });
    }
}
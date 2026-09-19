import type { Request, Response } from "express";

import {
  createIngredient,
  getIngredientsByLabelDataId,
} from "../services/ingredient.service.js";

interface CreateIngredientRequestBody {
  labelDataId: string;
  name: string;
  position?: number;
  confidence?: number;
}

export async function createIngredientController(
  req: Request<{}, {}, CreateIngredientRequestBody>,
  res: Response,
) {
  try {
    const { labelDataId, name, position, confidence } = req.body;

    if (!labelDataId || !name) {
      res.status(400).json({
        status: "error",
        message: "labelDataId and name are required",
      });

      return;
    }

    const ingredient = await createIngredient({
      labelDataId,
      name,
      position,
      confidence,
    });
     res.status(201).json({
      status: "success",
      data: ingredient,
    });
  } catch (error) {
    console.error("Create ingredient error:", error);

    res.status(500).json({
      status: "error",
      message: "Failed to create ingredient",
    });
  }
}

export async function getIngredientsController(
  req: Request<{ labelDataId: string }>,
  res: Response,
) {
  try {
    const ingredients = await getIngredientsByLabelDataId(
      req.params.labelDataId,
    );

    res.json({
      status: "success",
      data: ingredients,
    });
  } catch (error) {
    console.error("Get ingredients error:", error);

    res.status(500).json({
      status: "error",
      message: "Failed to retrieve ingredients",
    });
  }
}

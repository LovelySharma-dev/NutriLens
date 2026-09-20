import { Request, Response } from "express";
import { analyzeIngredients } from "../services/ingredient-analysis.service.js";

export async function analyzeIngredientList(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const { ingredientsText } = req.body;

    if (
      typeof ingredientsText !== "string" ||
      !ingredientsText.trim()
    ) {
      res.status(400).json({
        status: "error",
        message: "ingredientsText is required",
      });
      return;
    }

    const result = analyzeIngredients(ingredientsText);

    res.json({
      status: "success",
      data: result,
    });
  } catch (error) {
    console.error("Ingredient analysis error:", error);

    res.status(500).json({
      status: "error",
      message: "Failed to analyze ingredients",
    });
  }
}
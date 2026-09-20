import { Request, Response } from "express";
import { predictNutrition } from "../services/nutrition-prediction.service.js";

export async function predictNutritionController(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const { servingSizeGrams, nutrition } = req.body;

    if (
      typeof servingSizeGrams !== "number" ||
      !Number.isFinite(servingSizeGrams) ||
      servingSizeGrams <= 0
    ) {
      res.status(400).json({
        status: "error",
        message: "servingSizeGrams must be a positive number",
      });
      return;
    }

    if (
      !nutrition ||
      typeof nutrition !== "object"
    ) {
      res.status(400).json({
        status: "error",
        message: "nutrition object is required",
      });
      return;
    }

    const result = await predictNutrition({
      servingSizeGrams,
      nutrition,
    });

    res.json({
      status: "success",
      data: result,
    });
  } catch (error) {
    console.error("Nutrition prediction error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to predict Nutri-Score";

    if (
      message.startsWith("Invalid nutrition data") ||
      message.startsWith("Missing required nutrition features")
    ) {
      res.status(400).json({
        status: "error",
        message,
      });
      return;
    }

    res.status(502).json({
      status: "error",
      message: "Nutrition ML prediction service unavailable",
    });
  }
}
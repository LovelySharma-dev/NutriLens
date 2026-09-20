import { Request, Response } from "express";
import { analyzeScanIngredients } from "../services/scan-ingredient-analysis.service.js";

export async function analyzeScanIngredientsController(
  req: Request,
  res: Response,
): Promise<void> {
  try {
   const scanId = req.params.scanId;

if (typeof scanId !== "string") {
  res.status(400).json({
    status: "error",
    message: "Invalid scanId",
  });
  return;
}

    const result = await analyzeScanIngredients(scanId);

    res.json({
      status: "success",
      data: result,
    });
  } catch (error) {
    console.error("Scan ingredient analysis error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to analyze scan ingredients";

    if (
      message === "Scan not found" ||
      message === "Label data not found for this scan" ||
      message === "No ingredients found for this scan"
    ) {
      res.status(404).json({
        status: "error",
        message,
      });
      return;
    }

    res.status(500).json({
      status: "error",
      message: "Failed to analyze scan ingredients",
    });
  }
}
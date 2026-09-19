import type { Request, Response } from "express";
import { analyzeScan } from "../services/analysis.service.js";

export async function analyzeScanController(
  req: Request<{ scanId: string }>,
  res: Response,
) {
  try {
    const result = await analyzeScan(req.params.scanId);

    res.json({
      status: "success",
      data: result,
    });
  } catch (error) {
    console.error("Analysis error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to analyze scan";

    res.status(500).json({
      status: "error",
      message,
    });
  }
}
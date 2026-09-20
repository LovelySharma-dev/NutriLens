import { Request, Response } from "express";
import {
  calculateHealthRisk,
  type HealthRiskInput,
} from "../services/health-risk.service.js";

export async function analyzeHealthRiskController(
  req: Request,
  res: Response
) {
  try {
    const input = req.body as HealthRiskInput;

    if (!input || typeof input !== "object") {
      return res.status(400).json({
        status: "error",
        message: "Health risk input is required",
      });
    }

    const result = calculateHealthRisk(input);

    return res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      status: "error",
      message:
        error instanceof Error ? error.message : "Health risk analysis failed",
    });
  }
}

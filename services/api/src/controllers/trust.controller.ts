import type { Request, Response } from "express";

import {
  calculateTrustScore,
  getTrustScore,
} from "../services/trust.service.js";

export async function calculateTrustScoreController(
  req: Request<{ reportId: string }>,
  res: Response,
) {
  try {
    const trustScore = await calculateTrustScore(
      req.params.reportId,
    );

    res.json({
      status: "success",
      data: trustScore,
    });
  } catch (error) {
    console.error("Calculate trust score error:", error);

    if (
      error instanceof Error &&
      error.message === "Report not found"
    ) {
      res.status(404).json({
        status: "error",
        message: "Report not found",
      });
      return;
    }

    res.status(500).json({
      status: "error",
      message: "Failed to calculate trust score",
    });
  }
}

export async function getTrustScoreController(
  req: Request<{ reportId: string }>,
  res: Response,
) {
  try {
    const trustScore = await getTrustScore(
      req.params.reportId,
    );

    if (!trustScore) {
      res.status(404).json({
        status: "error",
        message: "Trust score not found",
      });
      return;
    }

    res.json({
      status: "success",
      data: trustScore,
    });
  } catch (error) {
    console.error("Get trust score error:", error);

    res.status(500).json({
      status: "error",
      message: "Failed to retrieve trust score",
    });
  }
}
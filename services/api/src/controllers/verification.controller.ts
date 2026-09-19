import type { Request, Response } from "express";

import {
  createVerification,
  getVerificationById,
  getVerificationByClaimId,
} from "../services/verification.service.js";

interface CreateVerificationRequestBody {
  claimId: string;
  evidenceId: string;
  status: "VERIFIED" | "FLAGGED" | "UNCERTAIN";
  score?: number;
  explanation?: string;
}

export async function createVerificationController(
  req: Request<{}, {}, CreateVerificationRequestBody>,
  res: Response,
) {
  try {
    const { claimId, evidenceId, status, score, explanation } = req.body;

    if (!claimId || !evidenceId || !status) {
      res.status(400).json({
        status: "error",
        message: "claimId, evidenceId and status are required",
      });
      return;
    }

    const verification = await createVerification({
      claimId,
      evidenceId,
      status,
      score,
      explanation,
    });

    res.status(201).json({
      status: "success",
      data: verification,
    });
  } catch (error) {
    console.error("Create verification error:", error);

    res.status(500).json({
      status: "error",
      message: "Failed to create verification",
    });
  }
}

export async function getVerificationController(
  req: Request<{ id: string }>,
  res: Response,
) {
  try {
    const verification = await getVerificationById(req.params.id);

    if (!verification) {
      res.status(404).json({
        status: "error",
        message: "Verification not found",
      });
      return;
    }

    res.json({
      status: "success",
      data: verification,
    });
  } catch (error) {
    console.error("Get verification error:", error);

    res.status(500).json({
      status: "error",
      message: "Failed to retrieve verification",
    });
  }
}

export async function getClaimVerificationsController(
  req: Request<{ claimId: string }>,
  res: Response,
) {
  try {
    const verifications = await getVerificationByClaimId(req.params.claimId);

    res.json({
      status: "success",
      data: verifications,
    });
  } catch (error) {
    console.error("Get claim verifications error:", error);

    res.status(500).json({
      status: "error",
      message: "Failed to retrieve verifications",
    });
  }
}

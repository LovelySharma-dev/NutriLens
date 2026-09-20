import type { Request, Response } from "express";
import { createClaim, getClaimsByLabelDataId } from "../services/claim.service.js";

interface CreateClaimRequestBody {
  labelDataId: string;
  text: string;
  category?: string;
  confidence?: number;
}

export async function createClaimController(
  req: Request<{}, {}, CreateClaimRequestBody>,
  res: Response,
) {
  try {
    const { labelDataId, text, category, confidence } = req.body;

    if (!labelDataId || !text) {
      res.status(400).json({
        status: "error",
        message: "labelDataId and text are required",
      });

      return;
    }

    const claim = await createClaim({
      labelDataId,
      text,
      category,
      confidence,
    });

    res.status(201).json({
      status: "success",
      data: claim,
    });
  } catch (error) {
    console.error("Create claim error:", error);

    res.status(500).json({
      status: "error",
      message: "Failed to create claim",
    });
  }
}


export async function getClaimsController(
  req: Request<{ labelDataId: string }>,
  res: Response,
) {
    try {
        const claims = await getClaimsByLabelDataId(
            req.params.labelDataId
        )

        res.json({
            status: "success",
            data: claims
        })
    } catch (error) {
        console.error("Get claims error:", error);

    res.status(500).json({
      status: "error",
      message: "Failed to retrieve claims",
    });
    }
}
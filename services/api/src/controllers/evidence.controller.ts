import type { Request, Response } from "express";

import {
  createEvidence,
  getEvidence,
  getEvidenceById,
} from "../services/evidence.service.js";

interface CreateEvidenceRequestBody {
  title: string;
  source?: string;
  url?: string;
  type: "RESEARCH" | "REGULATION" | "DATABASE" | "MANUFACTURER" | "OTHER";
  description?: string;
}

export async function createEvidenceController(
  req: Request<{}, {}, CreateEvidenceRequestBody>,
  res: Response,
) {
  try {
    const { title, source, url, type, description } = req.body;

    if (!title || !type) {
      res.status(400).json({
        status: "error",
        message: "title and type are required",
      });

      return;
    }

    const evidence = await createEvidence({
      title,
      source,
      url,
      type,
      description,
    });

    res.status(201).json({
      status: "success",
      data: evidence,
    });
  } catch (error) {
    console.error("Create evidence error:", error);

    res.status(500).json({
      status: "error",
      message: "Failed to create evidence",
    });
  }
}

export async function getEvidenceController(
  req: Request<{ id: string }>,
  res: Response,
) {
  try {
    const evidence = await getEvidenceById(req.params.id);

    if (!evidence) {
      res.status(404).json({
        status: "error",
        message: "Evidence not found",
      });

      return;
    }

    res.json({
      status: "success",
      data: evidence,
    });
  } catch (error) {
    console.error("Get evidence error:", error);

    res.status(500).json({
      status: "error",
      message: "Failed to retrieve evidence",
    });
  }
}

export async function getEvidenceListController(_req: Request, res: Response) {
  try {
    const evidence = await getEvidence();

    res.json({
      status: "success",
      data: evidence,
    });
  } catch (error) {
    console.error("Get evidence list error:", error);

    res.status(500).json({
      status: "error",
      message: "Failed to retrieve evidence",
    });
  }
}

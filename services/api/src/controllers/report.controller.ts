import type { Request, Response } from "express";

import {
  createReport,
  getReportByScanId,
} from "../services/report.service.js";

interface CreateReportRequestBody {
  scanId: string;
  summary?: string;
  riskLevel?: string;
  recommendations?: string[];
}

export async function createReportController(
  req: Request<{}, {}, CreateReportRequestBody>,
  res: Response,
) {
  try {
    const {
      scanId,
      summary,
      riskLevel,
      recommendations,
    } = req.body;

    if (!scanId) {
      res.status(400).json({
        status: "error",
        message: "scanId is required",
      });
      return;
    }

    const report = await createReport({
      scanId,
      summary,
      riskLevel,
      recommendations,
    });

    res.status(201).json({
      status: "success",
      data: report,
    });
  } catch (error) {
    console.error("Create report error:", error);

    res.status(500).json({
      status: "error",
      message: "Failed to create report",
    });
  }
}

export async function getReportController(
  req: Request<{ scanId: string }>,
  res: Response,
) {
  try {
    const report = await getReportByScanId(req.params.scanId);

    if (!report) {
      res.status(404).json({
        status: "error",
        message: "Report not found",
      });
      return;
    }

    res.json({
      status: "success",
      data: report,
    });
  } catch (error) {
    console.error("Get report error:", error);

    res.status(500).json({
      status: "error",
      message: "Failed to retrieve report",
    });
  }
}
import type { Request, Response } from "express";

import {
  createLabelData,
  getLabelDataByScanId,
} from "../services/label.service.js";

interface CreateLabelRequestBody {
  scanId: string;
  productName?: string;
  brand?: string;
  rawOcrText?: string;
}

export async function createLabelController(
  req: Request<{}, {}, CreateLabelRequestBody>,
  res: Response,
) {
  try {
    const { scanId, productName, brand, rawOcrText } = req.body;

    if (!scanId) {
      res.status(400).json({
        status: "error",
        message: "scanId is required",
      });
      return;
    }

    const labelData = await createLabelData({
      scanId,
      productName,
      brand,
      rawOcrText,
    });

    res.status(201).json({
      status: "success",
      data: labelData,
    });
  } catch (error) {
    console.error("Create label data error:", error);

    res.status(500).json({
      status: "error",
      message: "Failed to create label data",
    });
  }
}

export async function getLabelController(
  req: Request<{ scanId: string }>,
  res: Response,
) {
  try {
    const labelData = await getLabelDataByScanId(req.params.scanId);

    if (!labelData) {
      res.status(404).json({
        status: "error",
        message: "Label data not found",
      });

      return;
    }

    res.json({
      status: "success",
      data: labelData,
    });
  } catch (error) {
    console.error("Get label data error:", error);

    res.status(500).json({
      status: "error",
      message: "Failed to retrieve label data",
    });
  }
}

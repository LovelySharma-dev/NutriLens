import type { Request, Response } from "express";
import { extractLabelWithOcr } from "../services/ocr.client.service.js";

export async function extractOcrController(
  req: Request,
  res: Response,
) {
  try {
    if (!req.file) {
      res.status(400).json({
        status: "error",
        message: "Image file is required",
      });
      return;
    }

    const result = await extractLabelWithOcr(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
    );

    res.json({
      status: "success",
      data: result,
    });
  } catch (error) {
    console.error("OCR error:", error);

    res.status(500).json({
      status: "error",
      message: "Failed to extract OCR text",
    });
  }
}
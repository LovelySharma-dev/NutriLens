import type { Request, Response } from "express";
import { extractTextFromImage } from "../services/ocr.service.js";

export async function extractOcrController(
  req: Request,
  res: Response,
) {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      res.status(400).json({
        status: "error",
        message: "imageUrl is required",
      });
      return;
    }

    const result = await extractTextFromImage(imageUrl);

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
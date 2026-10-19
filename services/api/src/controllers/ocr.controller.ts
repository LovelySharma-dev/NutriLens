import type { Request, Response } from "express";
import { extractLabelWithOcr, type OcrResult } from "../services/ocr.client.service.js";
import { ocrUnavailableBody, uploadRejection } from "../services/ocr-failure.js";
import { createScanFromOcrResult } from "../services/scan.service.js";

export async function extractOcrController(
  req: Request,
  res: Response,
) {
  try {
    const file = req.file;
    const rejected = uploadRejection(file);
    if (rejected || !file) {
      const body = rejected?.body ?? { status: "error" as const, message: "Image file is required" };
      res.status(rejected?.status ?? 400).json(body);
      return;
    }

    let ocrResult: OcrResult;

    try {
      ocrResult = await extractLabelWithOcr(
        file.buffer,
        file.originalname,
        file.mimetype,
        String(req.body?.languages || req.query?.languages || "en"),
      );
    } catch (ocrErr) {
      const detail = ocrErr instanceof Error ? ocrErr.message : "request failed";
      console.warn(`OCR service unavailable: ${detail}`);
      res.status(503).json(ocrUnavailableBody());
      return;
    }

    const createdScan = await createScanFromOcrResult(ocrResult);

    res.json({
      status: "success",
      data: {
        ...ocrResult,
        scanId: createdScan.id,
      },
    });
  } catch (error) {
    console.error("OCR controller error:", error);

    res.status(500).json({
      status: "error",
      message: "Failed to extract OCR text",
    });
  }
}
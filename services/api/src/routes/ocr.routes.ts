import { Router } from "express";
import multer from "multer";
import { extractOcrController } from "../controllers/ocr.controller.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

router.post(
  "/extract",
  upload.single("file"),
  extractOcrController,
);

export default router;
import { Router } from "express";
import { extractOcrController } from "../controllers/ocr.controller.js";

const router = Router();

router.post("/extract", extractOcrController);

export default router;
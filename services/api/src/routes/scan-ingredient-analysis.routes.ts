import { Router } from "express";
import { analyzeScanIngredientsController } from "../controllers/scan-ingredient-analysis.controller.js";

const router = Router();

router.post(
  "/:scanId/analyze",
  analyzeScanIngredientsController,
);

export default router;
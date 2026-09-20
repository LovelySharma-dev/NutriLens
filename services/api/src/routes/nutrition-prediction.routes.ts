import { Router } from "express";
import { predictNutritionController } from "../controllers/nutrition-prediction.controller.js";

const router = Router();

router.post(
  "/predict",
  predictNutritionController,
);

export default router;
import { Router } from "express";
import {
  compareNutritionController,
  predictNutritionController,
} from "../controllers/nutrition-prediction.controller.js";

const router = Router();

router.post(
  "/predict",
  predictNutritionController,
);

router.post(
  "/compare",
  compareNutritionController,
);

export default router;
import { Router } from "express";

import {
  createNutritionController,
  getNutritionController,
} from "../controllers/nutrition.controller.js";

const router = Router()

router.post("/", createNutritionController);

router.get(
  "/label/:labelDataId",
  getNutritionController,
);

export default router
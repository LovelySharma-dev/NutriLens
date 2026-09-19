import { Router } from "express";

import {
  createIngredientController,
  getIngredientsController,
} from "../controllers/ingredient.controller.js";

const router = Router();

router.post("/", createIngredientController);

router.get(
  "/label/:labelDataId",
  getIngredientsController,
);

export default router;
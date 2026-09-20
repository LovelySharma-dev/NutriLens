import { Router } from "express";
import { analyzeIngredientList } from "../controllers/ingredient-analysis.controller.js";

const router = Router();

router.post("/analyze", analyzeIngredientList);

export default router;
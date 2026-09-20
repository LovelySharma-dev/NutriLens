import { Router } from "express";
import { analyzeHealthRiskController } from "../controllers/health-risk.controller.js";

const router = Router();

router.post("/analyze", analyzeHealthRiskController);

export default router;
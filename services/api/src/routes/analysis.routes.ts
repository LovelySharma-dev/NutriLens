import { Router } from "express";
import { analyzeScanController } from "../controllers/analysis.controller.js";

const router = Router();

router.post("/scan/:scanId", analyzeScanController);

export default router;
import { Router } from "express";

import {
  calculateTrustScoreController,
  getTrustScoreController,
} from "../controllers/trust.controller.js";

const router = Router();

router.post(
  "/calculate/:reportId",
  calculateTrustScoreController,
);

router.get(
  "/:reportId",
  getTrustScoreController,
);

export default router;
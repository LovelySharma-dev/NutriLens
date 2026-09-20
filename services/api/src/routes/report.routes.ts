import { Router } from "express";

import {
  createReportController,
  getReportController,
} from "../controllers/report.controller.js";

const router = Router();

router.post("/", createReportController);

router.get(
  "/scan/:scanId",
  getReportController,
);

export default router;
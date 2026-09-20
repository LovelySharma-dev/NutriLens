import { Router } from "express";

import {
  createLabelController,
  getLabelController,
} from "../controllers/label.controller.js";

const router = Router();

router.post("/", createLabelController);

router.get("/scan/:scanId", getLabelController);

export default router;
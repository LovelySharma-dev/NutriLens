import { Router } from "express";

import { createScanController, getRecentScansController, getScanController } from "../controllers/scan.controller.js";

const router = Router()

router.post("/", createScanController)

router.get("/", getRecentScansController)

router.get("/:id", getScanController)

export default router
import { Router } from "express";
import {
  createEvidenceController,
  getEvidenceController,
  getEvidenceListController,
} from "../controllers/evidence.controller.js";
const router = Router()

router.post("/", createEvidenceController);

router.get("/", getEvidenceListController);

router.get("/:id", getEvidenceController);

export default router
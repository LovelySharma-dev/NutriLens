import { Router } from "express";

import {
  createClaimController,
  getClaimsController,
} from "../controllers/claim.controller.js";

const router = Router();

router.post("/", createClaimController);

router.get(
  "/label/:labelDataId",
  getClaimsController,
);

export default router;
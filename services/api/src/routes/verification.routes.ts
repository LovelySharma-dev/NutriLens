import {Router} from "express";

import {
    createVerificationController,
    getVerificationController, getClaimVerificationsController} from "../controllers/verification.controller.js";

const router = Router()

router.post("/", createVerificationController)
router.get("/:id", getVerificationController)
router.get("/claim/:claimId", getClaimVerificationsController)

export default router;
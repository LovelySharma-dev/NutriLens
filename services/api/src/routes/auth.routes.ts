import { Router } from "express";

const router = Router();

router.get("/", (_req, res) => {
    res.json({
        module: "auth",
        message: "Authentication module is ready for implementation"
    })
})

export default router;
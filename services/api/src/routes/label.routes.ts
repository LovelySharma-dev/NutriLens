import { Router } from "express";

const router = Router()

router.get("/", (_req, res) => {
    res.json({
        module: "labels",
        message: "Label verification module is ready for implementation"
    })
})

export default router
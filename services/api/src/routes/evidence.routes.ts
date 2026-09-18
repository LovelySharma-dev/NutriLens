import { Router } from "express";

const router = Router()

router.get("/", (_req, res) => {
    res.json({
        module: "evidence",
        message: "Evidence module is ready for implemetation"
    })
})

export default router
import { Router } from "express";

const router = Router()

router.get("/", (_req, res) => {
    res.json({
        module: "nutrition",
        message: "Nutrition module is ready for implemetation"
    })
})

export default router
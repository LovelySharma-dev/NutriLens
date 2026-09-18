
import express from "express"
import cors from "cors"
import healthRoutes from "./routes/health.routes.js"
import authRoutes from "./routes/auth.routes.js"
import labelRoutes from "./routes/label.routes.js"
import ocrRoutes from "./routes/ocr.routes.js";
import nutritionRoutes from "./routes/nutrition.routes.js"
import evidenceRoutes from "./routes/evidence.routes.js"
import trustRoutes from "./routes/trust.routes.js"
import reportRoutes from "./routes/report.routes.js"


const app = express()

app.use(cors())
app.use(express.json())

app.get("/", (_req, res) => {
    res.json({
        message: "Welcome to NutriLens API",
        version: "1.0.0"
    })
})

app.use("/health", healthRoutes)
app.use("/api/v1/auth", authRoutes)
app.use("/api/v1/labels", labelRoutes)
app.use("/api/v1/ocr", ocrRoutes)
app.use("/api/v1/nutrition", nutritionRoutes)
app.use("/api/v1/evidence", evidenceRoutes)
app.use("/api/v1/trust", trustRoutes)
app.use("/api/v1/reports", reportRoutes)


export default app
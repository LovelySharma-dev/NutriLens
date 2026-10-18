import { Router } from "express";
import { addHistory, getProfile, listHistory, lookupBarcode, saveProfile } from "../services/studio.service.js";

const router = Router();

router.get("/profile", async (_req, res) => {
  res.json({ status: "success", data: await getProfile() });
});

router.put("/profile", async (req, res) => {
  const profile = await saveProfile(req.body ?? {});
  res.json({ status: "success", data: profile });
});

router.get("/history", async (_req, res) => {
  res.json({ status: "success", data: await listHistory() });
});

router.post("/history", async (req, res) => {
  const body = req.body ?? {};
  const saved = await addHistory({
    id: typeof body.id === "string" ? body.id : undefined,
    productName: String(body.productName ?? "Scanned label"),
    grade: body.grade ?? null,
    riskLevel: body.riskLevel ?? null,
    trustScore: typeof body.trustScore === "number" ? body.trustScore : null,
    allergens: Array.isArray(body.allergens) ? body.allergens.map(String) : [],
    summary: String(body.summary ?? ""),
    personalStatus: String(body.personalStatus ?? "NO_PROFILE"),
  });
  res.status(201).json({ status: "success", data: saved });
});

router.get("/barcode/:code", async (req, res) => {
  try {
    const product = await lookupBarcode(req.params.code);
    res.json({ status: "success", data: product });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lookup failed";
    const status = message.startsWith("Check digit") || message.startsWith("Enter a barcode") ? 400 : 404;
    res.status(status).json({ status: "error", message });
  }
});

export default router;

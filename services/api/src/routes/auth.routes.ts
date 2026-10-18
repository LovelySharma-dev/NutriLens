import { Router } from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
  requestReset,
  resetPassword,
  userFromToken,
} from "../services/auth.service.js";

const router = Router();

function bearer(header: string | undefined) {
  if (!header?.startsWith("Bearer ")) return undefined;
  return header.slice("Bearer ".length).trim();
}

router.post("/register", async (req, res) => {
  try {
    const data = await registerUser(req.body ?? {});
    res.status(201).json({ status: "success", data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create the account.";
    res.status(400).json({ status: "error", message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const data = await loginUser(req.body ?? {});
    res.json({ status: "success", data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not sign in.";
    res.status(401).json({ status: "error", message });
  }
});

router.post("/forgot", async (req, res) => {
  const data = await requestReset(req.body?.email);
  res.json({ status: "success", data });
});

router.post("/reset", async (req, res) => {
  try {
    const data = await resetPassword(req.body ?? {});
    res.json({ status: "success", data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not reset the password.";
    res.status(400).json({ status: "error", message });
  }
});

router.get("/me", async (req, res) => {
  const user = await userFromToken(bearer(req.header("authorization")));
  if (!user) {
    res.status(401).json({ status: "error", message: "Sign in required." });
    return;
  }
  res.json({ status: "success", data: user });
});

router.post("/logout", async (req, res) => {
  await logoutUser(bearer(req.header("authorization")));
  res.json({ status: "success" });
});

export default router;

import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

type ResetCode = {
  codeHash: string;
  expiresAt: string;
};

type Session = {
  tokenHash: string;
  expiresAt: string;
};

type UserRecord = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  reset: ResetCode | null;
  sessions: Session[];
};

type AuthStore = {
  users: UserRecord[];
};

const storePath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../data/users.json",
);

const DUMMY_HASH = hashPassword("not-a-real-password");
const GENERIC_RESET = "If an account exists for that email, a reset code is ready.";

function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  const hash = scryptSync(password, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

function passwordsMatch(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const next = scryptSync(password, salt, 32);
  const previous = Buffer.from(hash, "hex");
  if (next.length !== previous.length) return false;
  return timingSafeEqual(next, previous);
}

function safeHashEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function hashToken(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function readStore(): Promise<AuthStore> {
  try {
    const raw = await readFile(storePath, "utf8");
    const parsed = JSON.parse(raw) as AuthStore;
    return { users: Array.isArray(parsed.users) ? parsed.users : [] };
  } catch {
    return { users: [] };
  }
}

async function writeStore(store: AuthStore) {
  await mkdir(path.dirname(storePath), { recursive: true });
  await writeFile(storePath, JSON.stringify(store, null, 2));
}

function publicUser(user: UserRecord) {
  return { id: user.id, email: user.email, name: user.name };
}

export async function registerUser(input: { email?: string; password?: string; name?: string }) {
  const email = normalizeEmail(String(input.email ?? ""));
  const password = String(input.password ?? "");
  const name = String(input.name ?? "").slice(0, 80);

  if (!validEmail(email)) {
    throw new Error("Enter a valid email address.");
  }
  if (password.length < 8) {
    throw new Error("Use at least 8 characters for the password.");
  }

  const store = await readStore();
  if (store.users.some((user) => user.email === email)) {
    throw new Error("That email is already registered. Sign in, or reset the password.");
  }

  const user: UserRecord = {
    id: randomBytes(16).toString("hex"),
    email,
    name,
    passwordHash: hashPassword(password),
    reset: null,
    sessions: [],
  };
  store.users.push(user);
  await writeStore(store);
  return issueSession(store, user);
}

export async function loginUser(input: { email?: string; password?: string }) {
  const email = normalizeEmail(String(input.email ?? ""));
  const password = String(input.password ?? "");
  const store = await readStore();
  const user = store.users.find((item) => item.email === email);
  const hash = user?.passwordHash ?? DUMMY_HASH;
  const matches = passwordsMatch(password, hash);

  if (!user || !matches) {
    throw new Error("Email or password is incorrect.");
  }

  return issueSession(store, user);
}

async function issueSession(store: AuthStore, user: UserRecord) {
  const token = randomBytes(32).toString("hex");
  user.sessions = [
    {
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    },
    ...user.sessions,
  ].slice(0, 5);
  await writeStore(store);
  return { token, user: publicUser(user) };
}

export async function userFromToken(token: string | undefined) {
  if (!token) return null;
  const store = await readStore();
  const tokenHash = hashToken(token);
  const now = Date.now();
  for (const user of store.users) {
    const session = user.sessions.find(
      (item) => item.tokenHash === tokenHash && Date.parse(item.expiresAt) > now,
    );
    if (session) return publicUser(user);
  }
  return null;
}

export async function logoutUser(token: string | undefined) {
  if (!token) return;
  const store = await readStore();
  const tokenHash = hashToken(token);
  for (const user of store.users) {
    user.sessions = user.sessions.filter((item) => item.tokenHash !== tokenHash);
  }
  await writeStore(store);
}

export async function requestReset(emailInput: string | undefined) {
  const email = normalizeEmail(String(emailInput ?? ""));
  const store = await readStore();
  const user = validEmail(email)
    ? store.users.find((item) => item.email === email)
    : undefined;

  let devCode: string | undefined;
  if (user) {
    const code = String(randomBytes(3).readUIntBE(0, 3) % 1000000).padStart(6, "0");
    user.reset = {
      codeHash: hashToken(`${user.id}:${code}`),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    };
    await writeStore(store);
    const sent = await sendResetEmail(user.email, code);
    if (!sent && process.env.NODE_ENV !== "production") {
      devCode = code;
    }
  } else {
    passwordsMatch("unused", DUMMY_HASH);
  }

  return {
    message: GENERIC_RESET,
    devCode,
  };
}

export async function resetPassword(input: { email?: string; code?: string; password?: string }) {
  const email = normalizeEmail(String(input.email ?? ""));
  const code = String(input.code ?? "").trim();
  const password = String(input.password ?? "");
  if (!validEmail(email) || password.length < 8 || !/^\d{6}$/.test(code)) {
    throw new Error("The reset code is invalid or expired.");
  }

  const store = await readStore();
  const user = store.users.find((item) => item.email === email);
  const reset = user?.reset;
  const matches = Boolean(
    user &&
    reset &&
    Date.parse(reset.expiresAt) > Date.now() &&
    safeHashEqual(hashToken(`${user.id}:${code}`), reset.codeHash),
  );

  if (!user || !matches) {
    throw new Error("The reset code is invalid or expired.");
  }

  user.passwordHash = hashPassword(password);
  user.reset = null;
  user.sessions = [];
  await writeStore(store);
  return { message: "Password updated. Sign in with the new password." };
}

async function sendResetEmail(email: string, code: string) {
  if (await sendWithInsforge(email, code)) return true;
  return sendWithSmtp(email, code);
}

async function sendWithInsforge(email: string, code: string) {
  const baseUrl = process.env.INSFORGE_URL || process.env.NEXT_PUBLIC_INSFORGE_URL;
  const anonKey = process.env.INSFORGE_ANON_KEY || process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;
  if (!baseUrl || !anonKey) return false;

  try {
    const { createClient } = await import("@insforge/sdk");
    const insforge = createClient({ baseUrl, anonKey });
    const { error } = await insforge.emails.send({
      to: email,
      subject: "Your NutriLens reset code",
      html: `<p>Your NutriLens password reset code is <strong>${code}</strong>. It expires in 15 minutes. If you did not ask for this, ignore the email.</p>`,
      from: "NutriLens",
    });
    if (error) {
      console.warn("InsForge reset email failed:", error.message);
      return false;
    }
    return true;
  } catch (error) {
    console.warn("InsForge reset email failed:", error);
    return false;
  }
}

async function sendWithSmtp(email: string, code: string) {
  const host = process.env.SMTP_HOST;
  if (!host) return false;

  try {
    // @ts-ignore Optional mail dependency. The reset code is shown locally when this import is unavailable.
    const nodemailer = await import("nodemailer");
    const transport = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
    await transport.sendMail({
      from: process.env.SMTP_FROM ?? "NutriLens <no-reply@localhost>",
      to: email,
      subject: "Your NutriLens reset code",
      text: `Your NutriLens password reset code is ${code}. It expires in 15 minutes. If you did not ask for this, ignore the email.`,
    });
    return true;
  } catch (error) {
    console.warn("Reset email failed:", error);
    return false;
  }
}

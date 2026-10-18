import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkBarcode } from "./barcode.js";

export interface StoredProfile {
  name: string;
  allergens: string[];
  diets: string[];
  avoidAdditives: boolean;
  updatedAt: string;
}

export interface HistoryEntry {
  id: string;
  createdAt: string;
  productName: string;
  grade: string | null;
  riskLevel: string | null;
  trustScore: number | null;
  allergens: string[];
  summary: string;
  personalStatus: string;
}

interface StoreShape {
  profile: StoredProfile;
  history: HistoryEntry[];
}

const EMPTY_PROFILE: StoredProfile = {
  name: "",
  allergens: [],
  diets: [],
  avoidAdditives: false,
  updatedAt: new Date(0).toISOString(),
};

const storePath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../data/store.json",
);

async function readStore(): Promise<StoreShape> {
  try {
    const raw = await readFile(storePath, "utf8");
    const parsed = JSON.parse(raw) as StoreShape;
    return {
      profile: parsed.profile ?? EMPTY_PROFILE,
      history: Array.isArray(parsed.history) ? parsed.history : [],
    };
  } catch {
    return { profile: EMPTY_PROFILE, history: [] };
  }
}

async function writeStore(store: StoreShape) {
  await mkdir(path.dirname(storePath), { recursive: true });
  await writeFile(storePath, JSON.stringify(store, null, 2));
}

export async function getProfile() {
  return (await readStore()).profile;
}

export async function saveProfile(input: Partial<StoredProfile>) {
  const store = await readStore();
  store.profile = {
    name: String(input.name ?? "").slice(0, 80),
    allergens: asStringList(input.allergens),
    diets: asStringList(input.diets),
    avoidAdditives: Boolean(input.avoidAdditives),
    updatedAt: new Date().toISOString(),
  };
  await writeStore(store);
  return store.profile;
}

export async function listHistory() {
  return (await readStore()).history;
}

export async function addHistory(entry: Omit<HistoryEntry, "id" | "createdAt"> & { id?: string }) {
  const store = await readStore();
  const saved: HistoryEntry = {
    id: entry.id ?? crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    productName: entry.productName || "Scanned label",
    grade: entry.grade,
    riskLevel: entry.riskLevel,
    trustScore: entry.trustScore,
    allergens: entry.allergens ?? [],
    summary: entry.summary ?? "",
    personalStatus: entry.personalStatus ?? "NO_PROFILE",
  };
  store.history = [saved, ...store.history].slice(0, 50);
  await writeStore(store);
  return saved;
}

function asStringList(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).slice(0, 40)).filter(Boolean).slice(0, 20);
}

export async function lookupBarcode(code: string) {
  const checked = checkBarcode(code);
  if (!checked.ok) {
    throw new Error(checked.reason);
  }
  const cleaned = checked.digits;

  const response = await fetch(
    `https://world.openfoodfacts.org/api/v2/product/${cleaned}.json`,
    {
      headers: {
        "User-Agent": "NutriLens/1.1 (food label research; local)",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Product lookup failed (${response.status}).`);
  }

  const payload = await response.json() as {
    status?: number;
    product?: {
      product_name?: string;
      brands?: string;
      allergens_tags?: string[];
      ingredients_text?: string;
      nutriments?: Record<string, number>;
    };
  };

  if (payload.status !== 1 || !payload.product) {
    throw new Error("No public product record was found for that barcode.");
  }

  const nutriments = payload.product.nutriments ?? {};
  const allergens = (payload.product.allergens_tags ?? []).map((tag) =>
    tag.replace(/^en:/, "").replace(/-/g, " "),
  );

  return {
    barcode: cleaned,
    name: payload.product.product_name || "Unknown product",
    brand: payload.product.brands || "",
    allergens,
    ingredients: (payload.product.ingredients_text || "")
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
      .slice(0, 40),
    per100g: {
      energy: numberOrZero(nutriments["energy-kcal_100g"]),
      fat: numberOrZero(nutriments.fat_100g),
      saturatedFat: numberOrZero(nutriments["saturated-fat_100g"]),
      carbohydrates: numberOrZero(nutriments.carbohydrates_100g),
      sugars: numberOrZero(nutriments.sugars_100g),
      fiber: numberOrZero(nutriments.fiber_100g),
      proteins: numberOrZero(nutriments.proteins_100g),
      salt: numberOrZero(nutriments.salt_100g),
    },
    source: "Open Food Facts",
  };
}

function numberOrZero(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

import catalogJson from "./catalog.json";

export type Nutrients = {
  energy: number;
  fat: number;
  saturatedFat: number;
  carbohydrates: number;
  sugars: number;
  fiber: number;
  proteins: number;
  salt: number;
};

export type CatalogProduct = {
  id: string;
  name: string;
  brand: string;
  category: string;
  per100g: Nutrients;
  allergens: string[];
  ingredients: string[];
  tags: string[];
  additives: boolean;
};

export type DietId =
  | "vegan"
  | "vegetarian"
  | "jain"
  | "diabetic-screen"
  | "low-sodium"
  | "high-protein";

export type ConsumerProfile = {
  name: string;
  allergens: string[];
  diets: DietId[];
  avoidAdditives: boolean;
};

export type Fit = {
  safe: boolean;
  grade: "A" | "B" | "C" | "D" | "E";
  reasons: string[];
};

export const CATALOG = catalogJson as CatalogProduct[];

export const ALLERGEN_OPTIONS = [
  "milk",
  "gluten",
  "wheat",
  "peanut",
  "tree nuts",
  "soy",
  "egg",
  "sesame",
  "fish",
  "shellfish",
  "mustard",
] as const;

const ANIMAL = ["chicken", "mutton", "beef", "pork", "fish", "gelatin", "meat", "prawn"];
const DAIRY_EGG = ["milk", "dahi", "curd", "butter", "ghee", "cheese", "lactose", "egg", "honey", "whey"];
const ROOTS = ["onion", "garlic", "potato", "carrot", "radish"];

export function screeningGrade(n: Nutrients): Fit["grade"] {
  let score = 0;
  if (n.sugars >= 22.5) score += 2;
  else if (n.sugars >= 5) score += 1;
  if (n.saturatedFat >= 5) score += 2;
  else if (n.saturatedFat >= 1.5) score += 1;
  if (n.salt >= 1.5) score += 2;
  else if (n.salt >= 0.3) score += 1;
  if (n.energy >= 400) score += 2;
  else if (n.energy >= 250) score += 1;
  if (n.fiber >= 6) score -= 1;
  if (n.proteins >= 12) score -= 1;
  if (score <= 0) return "A";
  if (score === 1) return "B";
  if (score === 2) return "C";
  if (score <= 4) return "D";
  return "E";
}

function blob(product: { allergens: string[]; ingredients: string[] }) {
  return [...product.allergens, ...product.ingredients].join(" ").toLowerCase();
}

export function assessFit(
  product: {
    per100g: Nutrients;
    allergens: string[];
    ingredients: string[];
    additives?: boolean;
  },
  profile: ConsumerProfile,
): Fit {
  const grade = screeningGrade(product.per100g);
  const text = blob(product);
  const reasons: string[] = [];

  for (const allergen of profile.allergens) {
    const needle = allergen.toLowerCase();
    if (text.includes(needle) || (needle === "tree nuts" && /almond|cashew|walnut|pistachio|hazelnut/.test(text))) {
      reasons.push(`Contains ${allergen}, which is on your avoid list.`);
    }
  }

  if (profile.diets.includes("vegan")) {
    const hit = [...ANIMAL, ...DAIRY_EGG].find((term) => text.includes(term));
    if (hit) reasons.push(`Not marked vegan: ingredient text mentions ${hit}.`);
  } else if (profile.diets.includes("vegetarian") || profile.diets.includes("jain")) {
    const hit = ANIMAL.find((term) => text.includes(term));
    if (hit) reasons.push(`Not marked vegetarian: ingredient text mentions ${hit}.`);
  }

  if (profile.diets.includes("jain")) {
    const hit = ROOTS.find((term) => text.includes(term));
    if (hit) reasons.push(`Jain screen: ingredient text mentions ${hit}.`);
  }

  if (profile.diets.includes("diabetic-screen") && product.per100g.sugars >= 5) {
    reasons.push(`Sugars are ${product.per100g.sugars} g/100g, above the low-sugar screen of 5 g.`);
  }

  if (profile.diets.includes("low-sodium") && product.per100g.salt >= 0.3) {
    reasons.push(`Salt is ${product.per100g.salt} g/100g, above the low-salt screen of 0.3 g.`);
  }

  if (profile.diets.includes("high-protein") && product.per100g.proteins < 10) {
    reasons.push(`Protein is ${product.per100g.proteins} g/100g, below the 10 g high-protein screen.`);
  }

  if (profile.avoidAdditives && product.additives) {
    reasons.push("This reference item is marked as containing added colours or flavourings.");
  }

  if (grade === "D" || grade === "E") {
    reasons.push(`Screening grade ${grade} from sugars, saturated fat, salt, and energy.`);
  }

  return { safe: reasons.length === 0, grade, reasons };
}

export function safeShelf(profile: ConsumerProfile) {
  return CATALOG.map((product) => ({
    product,
    fit: assessFit(product, profile),
  })).filter((item) => item.fit.safe);
}

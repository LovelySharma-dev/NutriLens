export type IngredientCategory =
  | "ALLERGEN"
  | "PRESERVATIVE"
  | "COLOR"
  | "ADDITIVE"
  | "SWEETENER"
  | "FLAVOURING_AGENT"
  | "RAISING_AGENT"
  | "OTHER";

export interface IngredientMatch {
  ingredient: string;
  category: IngredientCategory;
  matchedTerm: string;
  concern: string;
}


export interface AdditiveCodeMatch {
  ingredient: string;
  code: string;
  name?: string;
  category: "ADDITIVE_CODE";
  mappedCategory?: IngredientCategory;
  concern: string;
}

export interface IngredientAnalysisResult {
  ingredients: string[];
  matches: IngredientMatch[];
  allergens: IngredientMatch[];
  preservatives: IngredientMatch[];
  colors: IngredientMatch[];
  additives: IngredientMatch[];
  sweeteners: IngredientMatch[];
  flavouringAgents: IngredientMatch[];
  raisingAgents: IngredientMatch[];
  additiveCodes: AdditiveCodeMatch[];
}

/**
 * Initial explainable ingredient knowledge base.
 *
 * This is intentionally rule-based.
 * It is not a medical diagnosis or a claim that every
 * detected ingredient is harmful.
 */
const INGREDIENT_RULES: Array<{
  category: IngredientCategory;
  terms: string[];
  concern: string;
}> = [
  {
    category: "ALLERGEN",
    terms: [
      "milk",
      "milk powder",
      "whey",
      "casein",
      "caseinate",
      "soy",
      "soya",
      "soybean",
      "wheat",
      "gluten",
      "peanut",
      "groundnut",
      "almond",
      "cashew",
      "walnut",
      "hazelnut",
      "pistachio",
    ],
    concern: "Potential allergen requiring consumer-specific attention.",
  },
  {
    category: "PRESERVATIVE",
    terms: [
      "sodium benzoate",
      "benzoic acid",
      "potassium sorbate",
      "sorbic acid",
      "sodium metabisulphite",
      "sodium metabisulfite",
      "sulphur dioxide",
      "sulfur dioxide",
      "potassium metabisulfite",
    ],
    concern:
      "Preservative detected; verify permitted use and relevant evidence.",
  },
  {
    category: "COLOR",
    terms: [
      "tartrazine",
      "sunset yellow",
      "sunset yellow fcf",
      "allura red",
      "brilliant blue",
      "ponceau 4r",
      "carmoisine",
      "erythrosine",
      "indigo carmine",
      "caramel color",
      "caramel colour",
    ],
    concern:
      "Food colouring agent detected; verify its regulatory status and evidence.",
  },
  {
    category: "SWEETENER",
    terms: [
      "aspartame",
      "sucralose",
      "saccharin",
      "acesulfame potassium",
      "acesulfame k",
      "steviol glycosides",
      "sorbitol",
      "maltitol",
      "xylitol",
      "erythritol",
    ],
    concern:
      "Sweetening agent detected; consumer-specific considerations may apply.",
  },
  {
    category: "FLAVOURING_AGENT",
    terms: [
      "artificial flavour",
      "artificial flavor",
      "natural flavour",
      "natural flavor",
      "nature identical flavour",
      "nature identical flavor",
      "flavouring",
      "flavoring",
    ],
    concern: "Flavouring agent declared on the ingredient list.",
  },
  {
    category: "RAISING_AGENT",
    terms: [
      "baking soda",
      "sodium bicarbonate",
      "baking powder",
      "ammonium bicarbonate",
      "raising agent",
      "raising agents",
    ],
    concern: "Raising agent detected in the ingredient list.",
  },
  {
    category: "ADDITIVE",
    terms: [
      "emulsifier",
      "emulsifying salt",
      "stabilizer",
      "stabiliser",
      "thickener",
      "acidity regulator",
      "anticaking agent",
      "anti-caking agent",
      "humectant",
      "gelling agent",
      "firming agent",
      "sequestrant",
      "antioxidant",
    ],
    concern:
      "Food additive category detected; verify its specific identity and permitted use.",
  },
];

const ADDITIVE_CODE_MAP: Record<
  string,
  {
    name: string;
    category: IngredientCategory;
  }
> = {
  "102": {
    name: "Tartrazine",
    category: "COLOR",
  },
  "110": {
    name: "Sunset Yellow FCF",
    category: "COLOR",
  },
  "122": {
    name: "Carmoisine",
    category: "COLOR",
  },
  "124": {
    name: "Ponceau 4R",
    category: "COLOR",
  },
  "129": {
    name: "Allura Red AC",
    category: "COLOR",
  },
  "133": {
    name: "Brilliant Blue FCF",
    category: "COLOR",
  },
  "150": {
    name: "Caramel colours",
    category: "COLOR",
  },
  "211": {
    name: "Sodium benzoate",
    category: "PRESERVATIVE",
  },
  "202": {
    name: "Potassium sorbate",
    category: "PRESERVATIVE",
  },
  "220": {
    name: "Sulfur dioxide",
    category: "PRESERVATIVE",
  },
  "221": {
    name: "Sodium sulfite",
    category: "PRESERVATIVE",
  },
  "223": {
    name: "Sodium metabisulfite",
    category: "PRESERVATIVE",
  },
  "322": {
    name: "Lecithins",
    category: "ADDITIVE",
  },
  "330": {
    name: "Citric acid",
    category: "ADDITIVE",
  },
  "415": {
    name: "Xanthan gum",
    category: "ADDITIVE",
  },
  "440": {
    name: "Pectins",
    category: "ADDITIVE",
  },
  "450": {
    name: "Diphosphates",
    category: "RAISING_AGENT",
  },
  "500": {
    name: "Sodium carbonates",
    category: "RAISING_AGENT",
  },
  "950": {
    name: "Acesulfame potassium",
    category: "SWEETENER",
  },
  "951": {
    name: "Aspartame",
    category: "SWEETENER",
  },
  "952": {
    name: "Cyclamic acid",
    category: "SWEETENER",
  },
  "954": {
    name: "Saccharins",
    category: "SWEETENER",
  },
  "955": {
    name: "Sucralose",
    category: "SWEETENER",
  },
};

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[()[\]{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function splitIngredients(text: string): string[] {
  return text
    .split(/[,;|]/)
    .map((ingredient) => ingredient.trim())
    .filter(Boolean);
}
function detectAdditiveCode(
  ingredient: string,
): AdditiveCodeMatch | null {
  const normalized = normalizeText(ingredient);

  const match = normalized.match(
    /\b(?:ins|e)\s*-?\s*(\d{3,4}[a-z]?)\b/i,
  );

  if (!match) {
    return null;
  }

  const code = match[1].toUpperCase();
  const mapped = ADDITIVE_CODE_MAP[code];

  return {
    ingredient,
    code,
    name: mapped?.name,
    category: "ADDITIVE_CODE",
    mappedCategory: mapped?.category,
    concern: mapped
      ? `${mapped.name} identified as ${mapped.category.toLowerCase().replace("_", " ")}; verify regulatory status and relevant evidence.`
      : "Additive code detected; corresponding ingredient could not be identified by the current knowledge base.",
  };
}

export function analyzeIngredients(
  ingredientsText: string,
): IngredientAnalysisResult {
  if (!ingredientsText || !ingredientsText.trim()) {
    throw new Error("Ingredients text is required");
  }

  const ingredients = splitIngredients(ingredientsText);

  const matches: IngredientMatch[] = [];
  const additiveCodes: AdditiveCodeMatch[] = [];

  for (const ingredient of ingredients) {
    const additiveCode = detectAdditiveCode(ingredient);

    if (additiveCode) {
      additiveCodes.push(additiveCode);
    }
    const normalizedIngredient = normalizeText(ingredient);

    for (const rule of INGREDIENT_RULES) {
      const matchingTerm = [...rule.terms]
        .sort((a, b) => b.length - a.length)
        .find((term) => normalizedIngredient.includes(normalizeText(term)));

      if (matchingTerm) {
        matches.push({
          ingredient,
          category: rule.category,
          matchedTerm: matchingTerm,
          concern: rule.concern,
        });
      }
    }
  }

  return {
    ingredients,
    matches,
    additiveCodes,
    allergens: matches.filter((match) => match.category === "ALLERGEN"),
    preservatives: matches.filter((match) => match.category === "PRESERVATIVE"),
    colors: matches.filter((match) => match.category === "COLOR"),
    additives: matches.filter((match) => match.category === "ADDITIVE"),
    sweeteners: matches.filter((match) => match.category === "SWEETENER"),
    flavouringAgents: matches.filter(
      (match) => match.category === "FLAVOURING_AGENT",
    ),
    raisingAgents: matches.filter(
      (match) => match.category === "RAISING_AGENT",
    ),
  };
}

/**
 * 2017 Nutri-Score general-foods table, plus the EU 1169/2011 energy check.
 * Fruit percent is unknown and counted as 0. This is not the forest letter
 * and not the shelf screening grade.
 */

export type AuditNutrients = {
  energy: number;
  fat: number;
  saturatedFat: number;
  carbohydrates: number;
  sugars: number;
  fiber: number;
  proteins: number;
  salt: number;
};

export type FormulaLetter = "A" | "B" | "C" | "D" | "E";

const KCAL_TO_KJ = 4.184;
const SALT_TO_SODIUM = 2.5;
const ENERGY_KJ = [335, 670, 1005, 1340, 1675, 2010, 2345, 2680, 3015, 3350];
const SUGARS_G = [4.5, 9, 13.5, 18, 22.5, 27, 31.5, 36, 40, 45];
const SATURATED_FAT_G = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const SODIUM_MG = [90, 180, 270, 360, 450, 540, 630, 720, 810, 900];
const FIBER_G = [0.9, 1.9, 2.8, 3.7, 4.7];
const PROTEIN_G = [1.6, 3.2, 4.8, 6.4, 8];
const LETTERS = "ABCDE";
const REQUIRED: (keyof AuditNutrients)[] = [
  "energy", "fat", "saturatedFat", "carbohydrates", "sugars", "fiber", "proteins", "salt",
];

export const FLIP_STEPS: Record<"energy" | "sugars" | "saturatedFat" | "salt" | "fiber" | "proteins", number> = {
  energy: 1,
  sugars: 0.1,
  saturatedFat: 0.1,
  salt: 0.01,
  fiber: 0.1,
  proteins: 0.1,
};

export const FORMULA_LIMITATIONS = [
  "2017 general-foods table. Beverages, cheeses, and added fats are not scored on their own tables.",
  "Fruit, vegetable, and nut percent is unknown and counted as 0. Protein points are dropped when negative points are 11 or more.",
  "Kilocalories are multiplied by 4.184 to reach kilojoules. Salt grams are divided by 2.5 to reach sodium grams.",
  "This letter is not the random-forest letter and not the screening grade.",
];

export function pointsAbove(value: number, thresholds: number[]) {
  let score = 0;
  for (const limit of thresholds) {
    if (value > limit) score += 1;
    else break;
  }
  return score;
}

export function letterFor(score: number): FormulaLetter {
  if (score <= -1) return "A";
  if (score <= 2) return "B";
  if (score <= 10) return "C";
  if (score <= 18) return "D";
  return "E";
}

export function marginFor(score: number): { points: number; toward: FormulaLetter[] } {
  if (score <= -1) return { points: -score, toward: ["B"] };
  const bands: Array<[number, number, FormulaLetter[], number, FormulaLetter[]]> = [
    [2, score - -1, ["A"], 3 - score, ["C"]],
    [10, score - 2, ["B"], 11 - score, ["D"]],
    [18, score - 10, ["C"], 19 - score, ["E"]],
  ];
  for (const [ceiling, down, downLetters, up, upLetters] of bands) {
    if (score <= ceiling) {
      if (down < up) return { points: down, toward: downLetters };
      if (up < down) return { points: up, toward: upLetters };
      return { points: down, toward: [...downLetters, ...upLetters] };
    }
  }
  return { points: score - 18, toward: ["D"] };
}

function ready(table: Partial<AuditNutrients> | null | undefined): table is AuditNutrients {
  if (!table) return false;
  return REQUIRED.every((key) => {
    const value = table[key];
    return typeof value === "number" && Number.isFinite(value);
  });
}

export function screeningLetter(table: AuditNutrients): FormulaLetter {
  let score = 0;
  if (table.sugars >= 22.5) score += 2;
  else if (table.sugars >= 5) score += 1;
  if (table.saturatedFat >= 5) score += 2;
  else if (table.saturatedFat >= 1.5) score += 1;
  if (table.salt >= 1.5) score += 2;
  else if (table.salt >= 0.3) score += 1;
  if (table.energy >= 400) score += 2;
  else if (table.energy >= 250) score += 1;
  if (table.fiber >= 6) score -= 1;
  if (table.proteins >= 12) score -= 1;
  if (score <= 0) return "A";
  if (score === 1) return "B";
  if (score === 2) return "C";
  if (score <= 4) return "D";
  return "E";
}

export type FormulaGrade = {
  status: "ready";
  letter: FormulaLetter;
  score: number;
  negativePoints: number;
  positivePoints: number;
  proteinCounted: boolean;
  proteinPoints: number;
  energyKj: number;
  sodiumMg: number;
  margin: { points: number; toward: FormulaLetter[] };
  limitations: string[];
};

export function formulaGrade(table: Partial<AuditNutrients> | null): FormulaGrade | { status: "unchecked"; reason: "missing" } {
  if (!ready(table)) return { status: "unchecked", reason: "missing" };
  const energyKj = table.energy * KCAL_TO_KJ;
  const sodiumMg = table.salt / SALT_TO_SODIUM * 1000;
  const negativeParts = {
    energy: pointsAbove(energyKj, ENERGY_KJ),
    sugars: pointsAbove(table.sugars, SUGARS_G),
    saturatedFat: pointsAbove(table.saturatedFat, SATURATED_FAT_G),
    sodium: pointsAbove(sodiumMg, SODIUM_MG),
  };
  const fiberPoints = pointsAbove(table.fiber, FIBER_G);
  const proteinPoints = pointsAbove(table.proteins, PROTEIN_G);
  const negative = negativeParts.energy + negativeParts.sugars + negativeParts.saturatedFat + negativeParts.sodium;
  const proteinCounted = !(negative >= 11);
  const positive = fiberPoints + (proteinCounted ? proteinPoints : 0);
  const score = negative - positive;
  return {
    status: "ready",
    letter: letterFor(score),
    score,
    negativePoints: negative,
    positivePoints: positive,
    proteinCounted,
    proteinPoints,
    energyKj: roundTo(energyKj, 1),
    sodiumMg: roundTo(sodiumMg, 1),
    margin: marginFor(score),
    limitations: FORMULA_LIMITATIONS,
  };
}

export type AtwaterReport = {
  status: "coherent" | "divergent" | "unchecked";
  reason?: "missing";
  statedKcal?: number;
  estimatedKcal?: number;
  gapKcal?: number;
  relativeGap?: number;
};

export function atwater(table: Partial<AuditNutrients> | null): AtwaterReport {
  if (!ready(table)) return { status: "unchecked", reason: "missing" };
  const estimated = 4 * table.proteins + 4 * table.carbohydrates + 9 * table.fat + 2 * table.fiber;
  const gap = Math.abs(table.energy - estimated);
  const relative = gap / Math.max(estimated, 1);
  return {
    status: relative > 0.1 && gap > 30 ? "divergent" : "coherent",
    statedKcal: roundTo(table.energy, 1),
    estimatedKcal: roundTo(estimated, 1),
    gapKcal: roundTo(gap, 1),
    relativeGap: roundTo(relative, 4),
  };
}

export type NutrientFlip = {
  nutrient: keyof typeof FLIP_STEPS;
  direction: "increase" | "decrease";
  delta: number;
  nextLetter: FormulaLetter;
  unit: "kcal" | "g";
};

function plausible(table: AuditNutrients) {
  if (table.sugars > table.carbohydrates + 0.5) return false;
  if (table.saturatedFat > table.fat + 0.5) return false;
  if (table.energy > 900 || table.salt > 15) return false;
  if (REQUIRED.some((key) => table[key] < 0)) return false;
  if (["fat", "saturatedFat", "carbohydrates", "sugars", "fiber", "proteins"].some((key) => table[key as keyof AuditNutrients] > 100)) {
    return false;
  }
  return true;
}

function bounds(nutrient: keyof typeof FLIP_STEPS, table: AuditNutrients): [number, number] {
  if (nutrient === "energy") return [0, 900];
  if (nutrient === "salt") return [0, 15];
  if (nutrient === "sugars") return [0, Math.min(100, table.carbohydrates + 0.5)];
  if (nutrient === "saturatedFat") return [0, Math.min(100, table.fat + 0.5)];
  return [0, 100];
}

export function nutrientFlips(table: AuditNutrients): NutrientFlip[] {
  const base = formulaGrade(table);
  if (base.status !== "ready") return [];
  const found: NutrientFlip[] = [];
  (Object.keys(FLIP_STEPS) as Array<keyof typeof FLIP_STEPS>).forEach((nutrient) => {
    const step = FLIP_STEPS[nutrient];
    const [low, high] = bounds(nutrient, table);
    const current = table[nutrient];
    let steps = 1;
    let hit: NutrientFlip | null = null;
    while (!hit) {
      const delta = roundTo(steps * step, 4);
      const candidates: Array<["increase" | "decrease", number, number]> = [];
      if (current + delta <= high + 1e-9) candidates.push(["increase", delta, roundTo(current + delta, 4)]);
      if (current - delta >= low - 1e-9) candidates.push(["decrease", delta, roundTo(current - delta, 4)]);
      for (const [direction, size, value] of candidates) {
        const trial = { ...table, [nutrient]: value };
        if (!plausible(trial)) continue;
        const graded = formulaGrade(trial);
        if (graded.status === "ready" && graded.letter !== base.letter) {
          hit = {
            nutrient,
            direction,
            delta: size,
            nextLetter: graded.letter,
            unit: nutrient === "energy" ? "kcal" : "g",
          };
          break;
        }
      }
      if (hit || (current + delta > high && current - delta < low)) break;
      steps += 1;
      if (steps > 20000) break;
    }
    if (hit) found.push(hit);
  });
  return found;
}

export function servingIllusion(
  servingGrams: number | null | undefined,
  portionKcal: number | null | undefined,
  per100Kcal: number | null | undefined,
) {
  if (servingGrams == null || servingGrams <= 0) return null;
  const share = servingGrams / 100;
  let columnsDisagree: boolean | null = null;
  let impliedPer100: number | null = null;
  if (portionKcal != null && per100Kcal != null) {
    impliedPer100 = portionKcal * (100 / servingGrams);
    const gap = Math.abs(impliedPer100 - per100Kcal);
    const relative = gap / Math.max(Math.abs(per100Kcal), 1);
    columnsDisagree = relative > 0.1 && gap > 30;
  }
  return {
    servingGrams,
    shareOf100g: roundTo(share, 4),
    scaledPortionKcal: per100Kcal == null ? null : roundTo(per100Kcal * share, 1),
    printedPortionKcal: portionKcal == null ? null : roundTo(portionKcal, 1),
    impliedPer100gKcal: impliedPer100 == null ? null : roundTo(impliedPer100, 1),
    columnsDisagree,
  };
}

export function auditTable(table: Partial<AuditNutrients> | null) {
  const formula = formulaGrade(table);
  if (!ready(table) || formula.status !== "ready") {
    return { status: "unchecked" as const, reason: "missing" as const, formula, atwater: atwater(table), flips: [] as NutrientFlip[] };
  }
  const screening = screeningLetter(table);
  const distance = Math.abs(LETTERS.indexOf(formula.letter) - LETTERS.indexOf(screening));
  return {
    status: "ready" as const,
    formula,
    screening,
    lettersAgree: distance === 0,
    letterDistance: distance,
    atwater: atwater(table),
    flips: nutrientFlips(table),
  };
}

function roundTo(value: number, digits: number) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

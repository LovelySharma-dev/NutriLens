import { assessFit, type ConsumerProfile, type Nutrients } from "./safety";

/**
 * Named lines for the string matcher. A hit is a conflict the fixture expects.
 * A miss is a synonym the containment check does not see. A false alarm is a
 * shared stem the check treats as the allergen. These lines are not a census
 * of ingredient labels.
 */
export type MatcherExpect = "hit" | "miss" | "false-alarm" | "clear";

export type MatcherCase = {
  id: string;
  text: string;
  profile: ConsumerProfile;
  expect: MatcherExpect;
};

const BLANK: Nutrients = {
  energy: 100,
  fat: 1,
  saturatedFat: 0.2,
  carbohydrates: 10,
  sugars: 1,
  fiber: 1,
  proteins: 5,
  salt: 0.1,
};

export const MATCHER_CASES: MatcherCase[] = [
  { id: "milk-powder", text: "milk powder", profile: { name: "", allergens: ["milk"], diets: [], avoidAdditives: false }, expect: "hit" },
  { id: "almonds", text: "roasted almonds", profile: { name: "", allergens: ["tree nuts"], diets: [], avoidAdditives: false }, expect: "hit" },
  { id: "mustard-seeds", text: "mustard seeds", profile: { name: "", allergens: ["mustard"], diets: [], avoidAdditives: false }, expect: "hit" },
  { id: "chicken", text: "chicken stock", profile: { name: "", allergens: [], diets: ["vegetarian"], avoidAdditives: false }, expect: "hit" },
  { id: "casein", text: "casein", profile: { name: "", allergens: ["milk"], diets: [], avoidAdditives: false }, expect: "miss" },
  { id: "whey", text: "whey protein", profile: { name: "", allergens: ["milk"], diets: [], avoidAdditives: false }, expect: "miss" },
  { id: "groundnut", text: "groundnut oil", profile: { name: "", allergens: ["peanut"], diets: [], avoidAdditives: false }, expect: "miss" },
  { id: "coconut-milk", text: "coconut milk", profile: { name: "", allergens: ["milk"], diets: [], avoidAdditives: false }, expect: "false-alarm" },
  { id: "gluten-free", text: "gluten-free oats", profile: { name: "", allergens: ["gluten"], diets: [], avoidAdditives: false }, expect: "false-alarm" },
  { id: "peanut-free", text: "peanut-free sauce", profile: { name: "", allergens: ["peanut"], diets: [], avoidAdditives: false }, expect: "false-alarm" },
  { id: "plain-rice", text: "rice", profile: { name: "", allergens: ["milk", "gluten", "peanut"], diets: [], avoidAdditives: false }, expect: "clear" },
  { id: "chickpeas", text: "chickpeas", profile: { name: "", allergens: ["soy"], diets: ["vegan"], avoidAdditives: false }, expect: "clear" },
];

export function matcherOutcome(item: MatcherCase): "conflict" | "clear" {
  const fit = assessFit(
    { per100g: BLANK, allergens: [], ingredients: [item.text], additives: false },
    item.profile,
  );
  const personal = fit.reasons.some((reason) => !reason.startsWith("Screening grade"));
  return personal ? "conflict" : "clear";
}

export function matcherAudit(cases: MatcherCase[] = MATCHER_CASES) {
  const rows = cases.map((item) => {
    const outcome = matcherOutcome(item);
    const passed =
      (item.expect === "hit" && outcome === "conflict")
      || (item.expect === "miss" && outcome === "clear")
      || (item.expect === "false-alarm" && outcome === "conflict")
      || (item.expect === "clear" && outcome === "clear");
    return { ...item, outcome, passed };
  });
  const count = (expect: MatcherExpect) => rows.filter((row) => row.expect === expect).length;
  return {
    rows,
    hits: count("hit"),
    misses: count("miss"),
    falseAlarms: count("false-alarm"),
    clears: count("clear"),
    failed: rows.filter((row) => !row.passed).map((row) => row.id),
  };
}

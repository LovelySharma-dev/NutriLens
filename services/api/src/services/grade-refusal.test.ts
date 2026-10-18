import assert from "node:assert/strict";
import { mapNutritionFactsToInput } from "./nutrition-fact-mapper.service.js";
import {
  describeWithheldGrade,
  findImplausibleNutrition,
} from "./normalization.service.js";

const mapped = mapNutritionFactsToInput([
  { nutrient: "saturatedFat", value: 2, unit: "g", servingSize: "100g" },
  { nutrient: "energy", value: 110, unit: "kcal", servingSize: "100g" },
  { nutrient: "portion:salt", value: 0.2, unit: "g", servingSize: "30g" },
]);

assert.equal(mapped.nutrition.saturatedFat, 2);
assert.equal(mapped.nutrition.energy, 110);
assert.equal(mapped.nutrition.salt, undefined);
assert.equal(mapped.servingSizeGrams, 100);

const issues = findImplausibleNutrition({
  energy_100g: 110,
  fat_100g: 1.5,
  saturated_fat_100g: 0.3,
  carbohydrates_100g: 23,
  sugars_100g: 9,
  fiber_100g: 2,
  proteins_100g: 3,
  salt_100g: 20,
});

assert.equal(issues.length, 1);
assert.equal(issues[0]?.feature, "salt_100g");

const zero = findImplausibleNutrition({
  energy_100g: 0,
  fat_100g: 0,
  saturated_fat_100g: 0,
  carbohydrates_100g: 0,
  sugars_100g: 0,
  fiber_100g: 0,
  proteins_100g: 0,
  salt_100g: 0,
});
assert.equal(zero.length, 0);

const message = describeWithheldGrade(["energy_100g", "fat_100g"], issues);
assert.match(message, /Grade withheld/);
assert.match(message, /energy/);
assert.match(message, /median/);
assert.match(message, /Salt is 20 g/);

console.log("grade refusal checks passed");

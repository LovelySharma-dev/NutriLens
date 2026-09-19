import {
  normalizeTo100g,
  validateNutrition,
} from "./normalization.service.js";

const nutrition = {
  energy: 120,
  fat: 3,
  saturatedFat: 1,
  carbohydrates: 18,
  sugars: 6,
  fiber: 2,
  proteins: 3,
  salt: 0.3,
};

const normalized = normalizeTo100g(
  nutrition,
  30,
);

console.log("Normalized nutrition:");
console.log(normalized);

const errors = validateNutrition(normalized);

console.log("\nValidation errors:");
console.log(errors);
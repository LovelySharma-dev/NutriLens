import { analyzeIngredients } from "./ingredient-analysis.service.js";

const ingredients = `
Wheat flour, sugar, milk powder, cocoa,
sodium benzoate (INS 211),
tartrazine (INS 102),
soy lecithin (E322),
sucralose (E955),
artificial flavour,
baking powder
`;

const result = analyzeIngredients(ingredients);

console.log(JSON.stringify(result, null, 2));
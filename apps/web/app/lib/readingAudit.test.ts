import assert from "node:assert/strict";
import { atwater, auditTable, formulaGrade, letterFor, pointsAbove, servingIllusion } from "./readingAudit.ts";

assert.equal(pointsAbove(335, [335, 670, 1005, 1340, 1675, 2010, 2345, 2680, 3015, 3350]), 0);
assert.equal(pointsAbove(335.1, [335, 670, 1005, 1340, 1675, 2010, 2345, 2680, 3015, 3350]), 1);
assert.equal(letterFor(-1), "A");
assert.equal(letterFor(0), "B");
assert.equal(letterFor(2), "B");
assert.equal(letterFor(3), "C");
assert.equal(letterFor(19), "E");

const counted = formulaGrade({
  energy: 100, fat: 1, saturatedFat: 0.5, carbohydrates: 10, sugars: 2, fiber: 0, proteins: 20, salt: 0.1,
});
assert.equal(counted.status, "ready");
if (counted.status === "ready") {
  assert.equal(counted.proteinCounted, true);
  assert.equal(counted.letter, "A");
  assert.equal(counted.score, -4);
}

const zeros = auditTable({
  energy: 0, fat: 0, saturatedFat: 0, carbohydrates: 0, sugars: 0, fiber: 0, proteins: 0, salt: 0,
});
assert.equal(zeros.status, "ready");
if (zeros.status === "ready") {
  assert.equal(zeros.formula.letter, "B");
  assert.equal(zeros.screening, "A");
  assert.equal(zeros.lettersAgree, false);
  assert.equal(zeros.atwater.status, "coherent");
  const protein = zeros.flips.find((item) => item.nutrient === "proteins");
  assert.equal(protein?.direction, "increase");
  assert.equal(protein?.nextLetter, "A");
}

const band = atwater({
  energy: 213, fat: 8, saturatedFat: 1, carbohydrates: 20, sugars: 1, fiber: 0, proteins: 10, salt: 0.1,
});
assert.equal(band.gapKcal, 21);
assert.equal(band.status, "coherent");

const over = atwater({
  energy: 223, fat: 8, saturatedFat: 1, carbohydrates: 20, sugars: 1, fiber: 0, proteins: 10, salt: 0.1,
});
assert.equal(over.gapKcal, 31);
assert.equal(over.status, "divergent");
assert.equal(atwater({ energy: 100, fat: 1, saturatedFat: 0, carbohydrates: 10, sugars: 1, fiber: null as unknown as number, proteins: 8, salt: 0.1 }).status, "unchecked");

const quiet = servingIllusion(30, 60, 200);
assert.equal(quiet?.columnsDisagree, false);
assert.equal(quiet?.shareOf100g, 0.3);
assert.equal(servingIllusion(30, 30, 200)?.columnsDisagree, true);
assert.equal(servingIllusion(null, 30, 200), null);

console.log("reading audit checks passed");

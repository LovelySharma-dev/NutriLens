import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CATALOG, screeningGrade } from "./safety";
import { auditTable } from "./readingAudit";

type Row = {
  id: string;
  forest: string;
  screening: string;
  agree: boolean;
  per100g: {
    energy: number;
    fat: number;
    saturatedFat: number;
    carbohydrates: number;
    sugars: number;
    fiber: number;
    proteins: number;
    salt: number;
  };
};

const findings = JSON.parse(readFileSync(new URL("./letter-stability.json", import.meta.url), "utf8")) as {
  scikitLearn: string;
  corpora: Record<string, { rows: Row[]; summary: { exactLetterAgreement: number; tables: number } }>;
};

assert.equal(findings.scikitLearn, "1.6.1");

for (const row of findings.corpora["reference-shelf"].rows) {
  const product = CATALOG.find((item) => item.id === row.id);
  assert.ok(product, row.id);
  assert.equal(screeningGrade(product.per100g), row.screening);
}

const pairs: Record<string, { formulaScreen: number; formulaForest: number; divergent: number }> = {};

for (const [name, corpus] of Object.entries(findings.corpora)) {
  let formulaScreen = 0;
  let formulaForest = 0;
  let divergent = 0;
  for (const row of corpus.rows) {
    const audit = auditTable(row.per100g);
    assert.equal(audit.status, "ready");
    if (audit.status !== "ready") continue;
    assert.equal(audit.screening, row.screening, `${name} ${row.id} screening`);
    if (audit.formula.letter === row.screening) formulaScreen += 1;
    if (audit.formula.letter.toLowerCase() === row.forest.toLowerCase()) formulaForest += 1;
    if (audit.atwater.status === "divergent") divergent += 1;
    console.log(`${name}\t${row.id}\tforest ${row.forest}\tscreen ${row.screening}\tformula ${audit.formula.letter}\tscore ${audit.formula.score}\tatwater ${audit.atwater.status}`);
  }
  pairs[name] = { formulaScreen, formulaForest, divergent };
  console.log(`${name} formula-screen ${formulaScreen}/${corpus.rows.length} formula-forest ${formulaForest}/${corpus.rows.length}`);
  assert.equal(corpus.summary.exactLetterAgreement, corpus.rows.filter((row) => row.agree).length);
}

assert.equal(findings.corpora["reference-shelf"].summary.exactLetterAgreement, 6);
assert.equal(findings.corpora["reference-shelf"].summary.tables, 12);
assert.equal(findings.corpora["constructed-bands"].summary.exactLetterAgreement, 3);
assert.equal(findings.corpora["constructed-bands"].summary.tables, 8);
assert.equal(pairs["reference-shelf"].formulaScreen, 9);
assert.equal(pairs["reference-shelf"].formulaForest, 9);
assert.equal(pairs["reference-shelf"].divergent, 0);
assert.equal(pairs["constructed-bands"].formulaScreen, 3);
assert.equal(pairs["constructed-bands"].formulaForest, 7);
assert.equal(pairs["constructed-bands"].divergent, 4);

console.log("letter stability checks passed");

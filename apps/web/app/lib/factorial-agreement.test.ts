import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { matcherAudit } from "./matcher-audit";

const grid = JSON.parse(readFileSync(new URL("./factorial-agreement.json", import.meta.url), "utf8")) as {
  scikitLearn: string;
  publishedForestRetrained: boolean;
  energyCheckFlagged: number;
  design: { tables: number };
  threeWayAgreement: { k: number; n: number };
  pairs: {
    forestScreen: { agreed: number; kappa: number; chance: number; linearWeightedKappa: number; withinOneLetter: { k: number }; wilson: { low: number; high: number } };
    forestFormula: { agreed: number; kappa: number };
    screenFormula: { agreed: number; kappa: number };
  };
  probes: {
    tablesWithAFlip: number;
    byMarginBucket: {
      close: { flipShareOfAccepted: number };
      wide: { flipShareOfAccepted: number };
    };
  };
  shelf: { forestScreen: { agreed: number; n: number; wilson: { low: number; high: number } } };
  anatomy: {
    oddReader: { screeningOdd: number; formulaOdd: number };
    forestScreenOffDiagonal: Array<{ n: number }>;
    forestScreenPermutation: { draws: number; nullsAtOrAboveObserved: number };
  };
};

assert.equal(grid.scikitLearn, "1.6.1");
assert.equal(grid.publishedForestRetrained, false);
assert.equal(grid.design.tables, 432);
assert.equal(grid.energyCheckFlagged, 0);
assert.equal(grid.pairs.forestScreen.agreed, 145);
assert.equal(grid.pairs.forestScreen.chance, 0.2133);
assert.equal(grid.pairs.forestScreen.kappa, 0.1555);
assert.equal(grid.pairs.forestScreen.wilson.low, 0.2927);
assert.equal(grid.pairs.forestScreen.wilson.high, 0.3815);
assert.equal(grid.pairs.forestFormula.agreed, 335);
assert.equal(grid.pairs.forestFormula.kappa, 0.6918);
assert.equal(grid.pairs.screenFormula.agreed, 198);
assert.equal(grid.pairs.screenFormula.kappa, 0.3006);
assert.equal(grid.threeWayAgreement.k, 141);
assert.equal(grid.threeWayAgreement.n, 432);
assert.equal(grid.probes.tablesWithAFlip, 318);
assert.ok(grid.probes.byMarginBucket.close.flipShareOfAccepted > grid.probes.byMarginBucket.wide.flipShareOfAccepted);
assert.equal(grid.pairs.forestScreen.linearWeightedKappa, 0.4617);
assert.equal(grid.pairs.forestScreen.withinOneLetter.k, 386);
assert.equal(grid.anatomy.oddReader.screeningOdd, 194);
assert.equal(grid.anatomy.oddReader.formulaOdd, 4);
assert.equal(grid.anatomy.forestScreenOffDiagonal[0].n, 104);
assert.equal(grid.anatomy.forestScreenPermutation.nullsAtOrAboveObserved, 0);
assert.equal(grid.anatomy.forestScreenPermutation.draws, 1000);
assert.equal(grid.shelf.forestScreen.agreed, 6);
assert.equal(grid.shelf.forestScreen.n, 12);
assert.ok(grid.shelf.forestScreen.wilson.high - grid.shelf.forestScreen.wilson.low > 0.4);

const audit = matcherAudit();
assert.deepEqual(audit.failed, []);
assert.equal(audit.hits, 4);
assert.equal(audit.misses, 3);
assert.equal(audit.falseAlarms, 3);
assert.equal(audit.clears, 2);

console.log("factorial agreement checks passed");

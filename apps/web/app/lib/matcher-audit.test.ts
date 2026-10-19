import assert from "node:assert/strict";
import { matcherAudit } from "./matcher-audit";

const audit = matcherAudit();
assert.deepEqual(audit.failed, []);
assert.equal(audit.hits, 4);
assert.equal(audit.misses, 3);
assert.equal(audit.falseAlarms, 3);
assert.equal(audit.clears, 2);

for (const row of audit.rows) {
  console.log(`${row.id}\t${row.expect}\t${row.outcome}`);
}
console.log("matcher audit checks passed");

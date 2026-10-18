import assert from "node:assert/strict";
import { agreementSummary } from "./household";

const now = Date.parse("2026-10-17T00:00:00.000Z");
const summary = agreementSummary([
  { followUpAt: "2026-10-10T00:00:00.000Z", weekLaterAgrees: true },
  { followUpAt: "2026-10-11T00:00:00.000Z", weekLaterAgrees: false },
  { followUpAt: "2026-10-12T00:00:00.000Z", weekLaterAgrees: null },
  { followUpAt: "2026-10-20T00:00:00.000Z", weekLaterAgrees: true },
], now);

assert.equal(summary.due, 3);
assert.equal(summary.answered, 2);
assert.equal(summary.agrees, 1);
assert.equal(summary.measured, true);

const empty = agreementSummary([], now);
assert.equal(empty.measured, false);
assert.equal(empty.answered, 0);

console.log("household agreement checks passed");

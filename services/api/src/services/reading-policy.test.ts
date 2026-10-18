import assert from "node:assert/strict";
import { abstainReasons, describeAbstain } from "./reading-policy.js";

assert.deepEqual(abstainReasons(undefined), []);
assert.deepEqual(
  abstainReasons({ columnOrder: "unknown", meanBoxConfidence: 0.9, readersDisagree: [] }),
  ["column_headings_missing"],
);
assert.deepEqual(
  abstainReasons({ columnOrder: "portion-then-100", meanBoxConfidence: 0.4 }),
  ["mean_box_confidence_low"],
);
assert.deepEqual(
  abstainReasons({ columnOrder: "per100-only", meanBoxConfidence: 0.8, readersDisagree: ["proteins"] }),
  ["column_readers_disagree"],
);

const message = describeAbstain({
  columnOrder: "unknown",
  meanBoxConfidence: 0.42,
  readersDisagree: ["proteins"],
});
assert.match(message ?? "", /not a calibrated probability/);
assert.match(message ?? "", /disagree on proteins/);
assert.match(message ?? "", /column headings were not read/);

console.log("reading policy checks passed");

import assert from "node:assert/strict";
import { checkBarcode } from "./barcode.js";

const valid = checkBarcode("4006381333931");
assert.equal(valid.ok, true);

const shifted = checkBarcode("4006381333932");
assert.equal(shifted.ok, false);
assert.match(shifted.reason ?? "", /end in 1/);

const shortCode = checkBarcode("12345");
assert.equal(shortCode.ok, false);

const ean8 = checkBarcode("73513537");
assert.equal(ean8.ok, true);

console.log("barcode checks passed");

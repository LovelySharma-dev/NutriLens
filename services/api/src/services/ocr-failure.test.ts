import assert from "node:assert/strict";
import { ocrUnavailableBody, uploadRejection } from "./ocr-failure.js";

assert.equal(uploadRejection(undefined)?.status, 400);
assert.equal(uploadRejection({ mimetype: "text/plain", size: 12 })?.status, 400);
assert.equal(uploadRejection({ mimetype: "image/jpeg", size: 0 })?.status, 400);
assert.equal(uploadRejection({ mimetype: "image/jpeg", size: 12 }), null);

const body = ocrUnavailableBody();
assert.equal(body.status, "error");
assert.match(body.message, /No nutrition values were inferred/);
assert.equal("nutrition" in body, false);

console.log("ocr failure checks passed");

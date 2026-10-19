import assert from "node:assert/strict";
import { decideUncertainty } from "./uncertainty.js";

const complete = {
  reading: {
    columnOrder: "portion-then-100",
    meanBoxConfidence: 0.9,
    readersDisagree: [],
  },
  missingFeatures: [],
  servingSizeRead: true,
  implausibleCount: 0,
  ingredientCount: 3,
  allergenMentionCount: 1,
  rawText: "Ingredients: oats, milk",
  topVoteShare: 0.99,
};

const ready = decideUncertainty(complete);
assert.equal(ready.decision, "reliable");
assert.equal(ready.probabilitiesCalibrated, false);
assert.equal(ready.calibrationStatus, "unvalidated");
assert.equal(ready.decisionScore.calibrated, false);
assert.equal(ready.decisionScore.kind, "uncalibrated_vote_share");
assert.equal(ready.ocr.kind, "heuristic");
assert.match(ready.summary, /not a safety clearance/);

const confidentButIncomplete = decideUncertainty({
  ...complete,
  servingSizeRead: false,
  missingFeatures: ["salt"],
  topVoteShare: 0.99,
});
assert.equal(confidentButIncomplete.decision, "insufficient_evidence");
assert.ok(confidentButIncomplete.reasons.includes("missing_serving_size"));
assert.ok(confidentButIncomplete.reasons.includes("missing_required_nutrient"));
assert.equal(confidentButIncomplete.completeness.servingSizeRead, false);
assert.equal(confidentButIncomplete.completeness.present, 7);

const lowBox = decideUncertainty({
  ...complete,
  reading: { ...complete.reading, meanBoxConfidence: 0.4 },
});
assert.equal(lowBox.decision, "review_required");
assert.ok(lowBox.reasons.includes("mean_box_confidence_low"));
assert.match(lowBox.summary, /not a calibrated probability/);

const noAllergenWord = decideUncertainty({ ...complete, allergenMentionCount: 0 });
assert.equal(noAllergenWord.decision, "review_required");
assert.equal(noAllergenWord.allergen.status, "none_detected");
assert.ok(noAllergenWord.reasons.includes("ambiguous_allergen"));

const noIngredients = decideUncertainty({ ...complete, ingredientCount: 0, allergenMentionCount: 0 });
assert.equal(noIngredients.decision, "insufficient_evidence");
assert.equal(noIngredients.allergen.status, "not_read");

const emptyScan = decideUncertainty({ rawText: "   ", ingredientCount: 0, servingSizeRead: false });
assert.equal(emptyScan.decision, "insufficient_evidence");
assert.ok(emptyScan.reasons.includes("unreadable_text"));
assert.equal(emptyScan.decisionScore.topVoteShare, null);

console.log("uncertainty checks passed");

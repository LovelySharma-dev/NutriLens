import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import DashboardSection from "../components/DashboardSection";
import { PreferencesProvider } from "../components/PreferencesProvider";
import { decisionPresentation } from "./uncertainty";

for (const decision of ["reliable", "review_required", "insufficient_evidence", undefined]) {
  assert.equal(decisionPresentation(decision).safeClaim, false);
}

assert.equal(decisionPresentation("reliable").title, "Rules passed");
assert.match(decisionPresentation("reliable").detail, /not a safety clearance/);
assert.equal(decisionPresentation("review_required").title, "Review required");
assert.equal(decisionPresentation("insufficient_evidence").title, "Insufficient evidence");
assert.match(decisionPresentation("insufficient_evidence").detail, /not treated as zero/);

function panel(decision: "reliable" | "review_required" | "insufficient_evidence") {
  const data = {
    scanId: "scan-1",
    trustScore: { score: 0.5, confidence: 0.2 },
    analysis: {
      riskLevel: "LOW",
      nutrition: { mappedInput: { energy: 100, sugars: 1, protein: 9, fat: 2, saturatedFat: 1, salt: 0.2 } },
      nutritionPrediction: {
        status: decision === "reliable" ? "READY" : "WITHHELD",
        result: decision === "reliable"
          ? { predictedGrade: "B", healthRisk: { level: "LOW", flags: [] } }
          : null,
        healthRisk: { level: "LOW", flags: [] },
      },
      personalFit: { status: "CLEAR", reasons: [] },
      recommendations: [],
      uncertainty: {
        decision,
        summary: decision === "reliable"
          ? "The reading rules passed. This is not a safety clearance."
          : `${decision} summary`,
        reasons: decision === "reliable" ? [] : ["missing_serving_size"],
        probabilitiesCalibrated: false,
        calibrationStatus: "unvalidated",
        ocr: { value: 0.9, kind: "heuristic", calibrated: false },
        completeness: { present: decision === "insufficient_evidence" ? 7 : 8, required: 8, servingSizeRead: decision !== "insufficient_evidence" },
        allergen: { status: decision === "review_required" ? "none_detected" : "mention_found", kind: "heuristic" },
        decisionScore: { topVoteShare: 0.99, kind: "uncalibrated_vote_share", calibrated: false },
      },
    },
  };
  return renderToStaticMarkup(createElement(PreferencesProvider, null, createElement(DashboardSection, { data: data as never })));
}

const reliableHtml = panel("reliable");
assert.match(reliableHtml, /Rules passed/);
assert.match(reliableHtml, /not a safety clearance/);
assert.match(reliableHtml, /uncalibrated_vote_share/);
assert.match(reliableHtml, />B</);
assert.doesNotMatch(reliableHtml, /Real-time API Verified/);

const reviewHtml = panel("review_required");
assert.match(reviewHtml, /Review required/);
assert.match(reviewHtml, /Grade withheld/);
assert.doesNotMatch(reviewHtml, />A</);

const incompleteHtml = panel("insufficient_evidence");
assert.match(incompleteHtml, /Insufficient evidence/);
assert.match(incompleteHtml, /serving missing/);
assert.match(incompleteHtml, /Nutrient screen, not a safety clearance/);
assert.match(incompleteHtml, /not a safety clearance/);

console.log("uncertainty presentation checks passed");

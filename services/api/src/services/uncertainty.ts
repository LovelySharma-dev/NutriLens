import { MEAN_BOX_ABSTAIN, abstainReasons, type ReadingSignal } from "./reading-policy.js";

export const REQUIRED_NUTRIENT_COUNT = 8;

export type DecisionState = "reliable" | "review_required" | "insufficient_evidence";

export type UncertaintyInput = {
  reading?: ReadingSignal | null;
  missingFeatures?: string[];
  servingSizeRead?: boolean;
  implausibleCount?: number;
  ingredientCount?: number;
  allergenMentionCount?: number;
  rawText?: string | null;
  modelUnavailable?: boolean;
  topVoteShare?: number | null;
};

export type UncertaintyReport = {
  decision: DecisionState;
  summary: string;
  reasons: string[];
  probabilitiesCalibrated: false;
  calibrationStatus: "unvalidated";
  ocr: {
    value: number | null;
    source: "mean_box_confidence";
    kind: "heuristic";
    calibrated: false;
    abstainBelow: number;
  };
  fieldExtraction: {
    columnOrder: string | null;
    readersDisagree: string[];
    kind: "heuristic";
  };
  allergen: {
    status: "not_read" | "none_detected" | "mention_found";
    kind: "heuristic";
  };
  completeness: {
    present: number;
    required: number;
    servingSizeRead: boolean;
  };
  decisionScore: {
    topVoteShare: number | null;
    source: "forest_vote_share";
    kind: "uncalibrated_vote_share";
    calibrated: false;
  };
  nutrientScreenIsNotMedicalRisk: true;
};

const INSUFFICIENT = new Set([
  "unreadable_text",
  "missing_serving_size",
  "missing_required_nutrient",
  "ingredient_list_missing",
  "model_unavailable",
]);

function reasonSentences(reasons: string[], reading?: ReadingSignal | null) {
  const sentences: string[] = [];
  if (reasons.includes("unreadable_text")) {
    sentences.push("The label text was empty or no text boxes were read.");
  }
  if (reasons.includes("missing_serving_size")) {
    sentences.push("The serving size was not read, so nothing was scaled or filled from a median.");
  }
  if (reasons.includes("missing_required_nutrient")) {
    sentences.push("A required per-100 g nutrient is missing. The missing value was not treated as zero.");
  }
  if (reasons.includes("ingredient_list_missing")) {
    sentences.push("No ingredient list was read, so allergen evidence is incomplete.");
  }
  if (reasons.includes("model_unavailable")) {
    sentences.push("The grade model did not return a score.");
  }
  if (reasons.includes("column_headings_missing")) {
    sentences.push("The two column headings were not read.");
  }
  if (reasons.includes("mean_box_confidence_low")) {
    const shown = typeof reading?.meanBoxConfidence === "number"
      ? reading.meanBoxConfidence.toFixed(2)
      : "low";
    sentences.push(
      `Mean box confidence is ${shown}, below ${MEAN_BOX_ABSTAIN}. That figure is an average of OCR boxes, not a calibrated probability.`,
    );
  }
  if (reasons.includes("column_readers_disagree")) {
    const names = (reading?.readersDisagree ?? []).join(", ") || "a nutrient";
    sentences.push(`The line reader and the box reader disagree on ${names}.`);
  }
  if (reasons.includes("inconsistent_nutrition")) {
    sentences.push("A nutrient is outside the per-100 g ceiling or breaks a fat or sugar relation.");
  }
  if (reasons.includes("estimated_salt")) {
    sentences.push("Salt was estimated from sodium. That estimate is not a printed salt cell.");
  }
  if (reasons.includes("ambiguous_allergen")) {
    sentences.push("No allergen string was found. Absence of a word is not absence of the allergen.");
  }
  return sentences;
}

export function decideUncertainty(input: UncertaintyInput): UncertaintyReport {
  const reading = input.reading;
  const reasons = [...abstainReasons(reading)];
  const rawText = input.rawText ?? "";
  if (!rawText.trim() || reading?.meanBoxConfidence === 0) {
    reasons.push("unreadable_text");
  }
  if (input.servingSizeRead === false) reasons.push("missing_serving_size");
  if ((input.missingFeatures?.length ?? 0) > 0) reasons.push("missing_required_nutrient");
  if ((input.implausibleCount ?? 0) > 0) reasons.push("inconsistent_nutrition");
  if ((reading?.estimatedNutrients ?? []).length > 0 || rawText.includes("estimated from sodium")) {
    reasons.push("estimated_salt");
  }
  const ingredientCount = input.ingredientCount ?? 0;
  const allergenMentionCount = input.allergenMentionCount ?? 0;
  let allergenStatus: UncertaintyReport["allergen"]["status"] = "mention_found";
  if (ingredientCount === 0) {
    allergenStatus = "not_read";
    reasons.push("ingredient_list_missing");
  } else if (allergenMentionCount === 0) {
    allergenStatus = "none_detected";
    reasons.push("ambiguous_allergen");
  }
  if (input.modelUnavailable) reasons.push("model_unavailable");

  const unique = [...new Set(reasons)];
  let decision: DecisionState = "reliable";
  if (unique.some((reason) => INSUFFICIENT.has(reason))) decision = "insufficient_evidence";
  else if (unique.length > 0) decision = "review_required";

  const missing = input.missingFeatures?.length ?? 0;
  const present = Math.max(0, REQUIRED_NUTRIENT_COUNT - missing);
  const lead = decision === "reliable"
    ? "The reading rules passed. This is not a safety clearance, and the grade probability is an uncalibrated vote share."
    : decision === "review_required"
      ? "Review required. The grade is withheld."
      : "Insufficient evidence. The grade is withheld.";
  const summary = [lead, ...reasonSentences(unique, reading)].join(" ");

  return {
    decision,
    summary,
    reasons: unique,
    probabilitiesCalibrated: false,
    calibrationStatus: "unvalidated",
    ocr: {
      value: typeof reading?.meanBoxConfidence === "number" ? reading.meanBoxConfidence : null,
      source: "mean_box_confidence",
      kind: "heuristic",
      calibrated: false,
      abstainBelow: MEAN_BOX_ABSTAIN,
    },
    fieldExtraction: {
      columnOrder: reading?.columnOrder ?? null,
      readersDisagree: reading?.readersDisagree ?? [],
      kind: "heuristic",
    },
    allergen: { status: allergenStatus, kind: "heuristic" },
    completeness: {
      present,
      required: REQUIRED_NUTRIENT_COUNT,
      servingSizeRead: input.servingSizeRead === true,
    },
    decisionScore: {
      topVoteShare: typeof input.topVoteShare === "number" ? input.topVoteShare : null,
      source: "forest_vote_share",
      kind: "uncalibrated_vote_share",
      calibrated: false,
    },
    nutrientScreenIsNotMedicalRisk: true,
  };
}

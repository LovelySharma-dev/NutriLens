export const MEAN_BOX_ABSTAIN = 0.55;
export const READING_POLICY_VERSION = "reading-policy-1";

export type ReadingSignal = {
  columnOrder?: string | null;
  meanBoxConfidence?: number | null;
  readersDisagree?: string[];
  estimatedNutrients?: string[];
};

export function abstainReasons(reading?: ReadingSignal | null) {
  if (!reading) return [];
  const reasons: string[] = [];
  if (reading.columnOrder === "unknown") reasons.push("column_headings_missing");
  if (
    typeof reading.meanBoxConfidence === "number" &&
    Number.isFinite(reading.meanBoxConfidence) &&
    reading.meanBoxConfidence < MEAN_BOX_ABSTAIN
  ) {
    reasons.push("mean_box_confidence_low");
  }
  if (reading.readersDisagree && reading.readersDisagree.length > 0) {
    reasons.push("column_readers_disagree");
  }
  return reasons;
}

export function describeAbstain(reading?: ReadingSignal | null) {
  const reasons = abstainReasons(reading);
  if (reasons.length === 0) return null;
  const parts = ["Grade withheld."];
  if (reasons.includes("column_headings_missing")) {
    parts.push("The two column headings were not read, so the grade is not taken from this table.");
  }
  if (reasons.includes("mean_box_confidence_low")) {
    const shown = typeof reading?.meanBoxConfidence === "number"
      ? reading.meanBoxConfidence.toFixed(2)
      : "low";
    parts.push(
      `Mean box confidence is ${shown}, below ${MEAN_BOX_ABSTAIN}. That figure is an average of OCR boxes, not a calibrated probability of a correct table.`,
    );
  }
  if (reasons.includes("column_readers_disagree")) {
    const names = (reading?.readersDisagree ?? []).join(", ") || "a nutrient";
    parts.push(`The line reader and the box reader disagree on ${names}.`);
  }
  parts.push("The reading is still shown. Correct one cell to compare a new grade with the raw read.");
  return parts.join(" ");
}

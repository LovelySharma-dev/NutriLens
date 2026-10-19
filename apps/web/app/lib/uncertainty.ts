export type DecisionState = "reliable" | "review_required" | "insufficient_evidence";

export function decisionPresentation(decision: string | undefined) {
  if (decision === "reliable") {
    return {
      title: "Rules passed",
      detail: "The reading rules passed. This is not a safety clearance. Grade probabilities are uncalibrated.",
      tone: "neutral" as const,
      safeClaim: false,
    };
  }
  if (decision === "review_required") {
    return {
      title: "Review required",
      detail: "The grade is withheld until a person checks the flagged evidence.",
      tone: "review" as const,
      safeClaim: false,
    };
  }
  if (decision === "insufficient_evidence") {
    return {
      title: "Insufficient evidence",
      detail: "A required part of the label was not read. Missing values were not treated as zero.",
      tone: "incomplete" as const,
      safeClaim: false,
    };
  }
  return {
    title: "Result received",
    detail: "No uncertainty record was attached to this response.",
    tone: "neutral" as const,
    safeClaim: false,
  };
}

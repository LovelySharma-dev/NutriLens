"""When to withhold a grade without hiding the reading.

Mean box confidence is the average of EasyOCR box scores. It is not a
calibrated probability that the table is correct. The threshold matches
the second image pass already used in the OCR service. Policy version
is separate from the forest so a threshold change is visible.
"""

from __future__ import annotations

MEAN_BOX_ABSTAIN = 0.55
READING_POLICY_VERSION = "reading-policy-1"


def decide_reading(
    column_order: str | None,
    mean_box_confidence: float | None,
    readers_disagree: list[str] | None,
    box_count: int | None = None,
) -> dict:
    reasons: list[str] = []
    if box_count == 0 or mean_box_confidence == 0:
        reasons.append("unreadable_text")
    if column_order == "unknown":
        reasons.append("column_headings_missing")
    if (
        isinstance(mean_box_confidence, (int, float))
        and float(mean_box_confidence) < MEAN_BOX_ABSTAIN
    ):
        reasons.append("mean_box_confidence_low")
    disagreed = list(readers_disagree or [])
    if disagreed:
        reasons.append("column_readers_disagree")

    if "unreadable_text" in reasons:
        decision = "insufficient_evidence"
    elif reasons:
        decision = "review_required"
    else:
        decision = "reliable"

    return {
        "policyVersion": READING_POLICY_VERSION,
        "disposition": "abstain" if reasons else "grade",
        "decision": decision,
        "decisionNote": (
            "Reading-only decision. A high forest vote share cannot override it. "
            "reliable means these reading rules passed, not that the food is safe."
        ),
        "reasons": reasons,
        "readersDisagree": disagreed,
        "confidence": {
            "value": mean_box_confidence,
            "source": "mean_box_confidence",
            "kind": "heuristic",
            "calibrated": False,
            "abstainBelow": MEAN_BOX_ABSTAIN,
        },
    }

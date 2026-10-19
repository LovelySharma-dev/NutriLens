import json
import sys
from pathlib import Path

SERVICE_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SERVICE_ROOT))

from app.field_score import fields_from_parse, score_fields
from app.label_parser import parse_label

BENCHMARKS = SERVICE_ROOT / "benchmarks" / "constructed"
NOTE = (
    "These counts are constructed text lines, not photographs. "
    "Do not cite them as end-to-end OCR accuracy, precision, or recall."
)


def load_cases() -> list[dict]:
    cases = []
    for path in sorted(BENCHMARKS.glob("*.json")):
        cases.append(json.loads(path.read_text(encoding="utf-8")))
    return cases


def score_constructed(cases: list[dict] | None = None) -> dict:
    grouped: dict[str, dict] = {}
    rows = []
    for case in cases if cases is not None else load_cases():
        parsed = parse_label(case["text"])
        scored = score_fields(case["expected"], fields_from_parse(parsed["nutrition"]))
        language = case["language"]
        bucket = grouped.setdefault(language, {
            "cases": 0,
            "counts": {label: 0 for label in scored["counts"]},
            "source": "constructed-lines",
        })
        bucket["cases"] += 1
        for label, count in scored["counts"].items():
            bucket["counts"][label] += count
        rows.append({
            "id": case["id"],
            "language": language,
            "source": case.get("source", "constructed-lines"),
            "nutrients": scored["nutrients"],
        })
    return {
        "source": "constructed-lines",
        "note": NOTE,
        "languages": grouped,
        "cases": rows,
    }


if __name__ == "__main__":
    print(json.dumps(score_constructed(), indent=2, ensure_ascii=False))

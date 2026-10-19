"""Write the photographed, synthetic, and constructed baseline reports.

From services/ocr:

    python scripts/score_benchmark.py

EasyOCR is not called. An empty benchmarks/photographed directory is a
successful run with photographed metrics marked unavailable.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

SERVICE_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SERVICE_ROOT))

from app.benchmark_eval import evaluate, write_reports


def main() -> None:
    report = evaluate()
    if report["invalid_cases"]:
        print(json.dumps(report["invalid_cases"], indent=2))
        raise SystemExit(1)
    paths = write_reports(report)
    print(json.dumps({
        "schema_version": report["schema_version"],
        "photographed_cases": report["photographed"]["cases"],
        "synthetic_cases": report["synthetic_fixture"]["cases"],
        "constructed_cases": len(report["constructed_lines"]["cases"]),
        "reports": paths,
    }, indent=2))


if __name__ == "__main__":
    main()

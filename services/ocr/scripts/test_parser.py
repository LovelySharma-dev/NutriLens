import json
import sys
from pathlib import Path

SERVICE_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SERVICE_ROOT))

from app.label_parser import parse_label


with open(SERVICE_ROOT / "ocr_test.json", "r", encoding="utf-8-sig") as file:
    ocr_result = json.load(file)


parsed = parse_label(
    ocr_result["text"],
    ocr_result["detections"],
)


print(json.dumps(
    parsed,
    indent=2,
    ensure_ascii=False,
))

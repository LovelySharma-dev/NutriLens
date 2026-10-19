import json

from app.label_parser import parse_label


with open("ocr_test.json", "r", encoding="utf-8-sig") as file:
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

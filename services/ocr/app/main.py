from fastapi import FastAPI, File, Query, UploadFile, HTTPException
from PIL import Image
import easyocr
import numpy as np
import io

from app.label_parser import parse_label
from app.preprocess import prepare_variants
from app.reading_order import detections_to_lines
from app.reading_policy import decide_reading


ALLOWED_LANGUAGES = {"en", "hi", "fr", "es", "de", "ta", "bn", "mr"}

app = FastAPI(
    title="NutriLens OCR Service",
    version="1.1.0",
)

_readers: dict[tuple[str, ...], easyocr.Reader] = {}


def get_reader(languages: list[str]) -> easyocr.Reader:
    key = tuple(languages)
    reader = _readers.get(key)
    if reader is None:
        reader = easyocr.Reader(languages, gpu=False)
        _readers[key] = reader
    return reader


def _box(points) -> list[list[int]]:
    return [[int(point[0]), int(point[1])] for point in points]


def _merge(existing: list[dict], fresh: list[dict]) -> list[dict]:
    best: dict[str, dict] = {}
    for item in [*existing, *fresh]:
        key = " ".join(str(item["text"]).lower().split())
        if not key:
            continue
        previous = best.get(key)
        if previous is None or item["confidence"] > previous["confidence"]:
            best[key] = item
    return list(best.values())


def _read_pass(reader: easyocr.Reader, image: np.ndarray) -> list[dict]:
    results = reader.readtext(image, detail=1, paragraph=False)
    detected = []
    for bounding_box, text, confidence in results:
        cleaned = " ".join(str(text).split())
        score = float(confidence)
        if not cleaned or score < 0.15:
            continue
        detected.append({
            "text": cleaned,
            "confidence": round(score, 4),
            "boundingBox": _box(bounding_box),
        })
    return detected


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "ocr",
        "engine": "easyocr",
        "languages": sorted(ALLOWED_LANGUAGES),
        "modelLoaded": True,
    }


@app.post("/ocr")
async def extract_text(
    file: UploadFile = File(...),
    languages: str = Query("en"),
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are supported")

    requested = [part.strip().lower() for part in languages.split(",") if part.strip()]
    if not requested:
        requested = ["en"]
    unknown = [code for code in requested if code not in ALLOWED_LANGUAGES]
    if unknown:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported language code: {', '.join(unknown)}",
        )
    if "en" not in requested:
        requested = ["en", *requested]

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded image is empty")

    try:
        image = Image.open(io.BytesIO(contents))
        reader = get_reader(requested)
        variants = prepare_variants(image)

        detections = _read_pass(reader, variants[0])
        confidences = [item["confidence"] for item in detections]
        average = sum(confidences) / len(confidences) if confidences else 0
        passes = 1

        # A weak first pass is the usual case for glare, blur, or a small photo.
        if average < 0.55 or len(detections) < 8:
            passes = len(variants)
            for variant in variants[1:]:
                detections = _merge(detections, _read_pass(reader, variant))
            confidences = [item["confidence"] for item in detections]
            average = sum(confidences) / len(confidences) if confidences else 0
        combined_text = detections_to_lines(detections)
        parsed_label = parse_label(combined_text, detections)
        parsed_label["reading"] = decide_reading(
            parsed_label.get("columnOrder"),
            round(average, 4),
            parsed_label.get("readersDisagree") or [],
            len(detections),
        )

        return {
            "status": "success",
            "text": combined_text,
            "confidence": round(average, 4),
            "engine": "easyocr",
            "languages": requested,
            "passes": passes,
            "detections": detections,
            "parsedLabel": parsed_label,
        }
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"OCR failed: {error}") from error

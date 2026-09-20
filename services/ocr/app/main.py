from fastapi import FastAPI, File, UploadFile, HTTPException
from PIL import Image
import easyocr
import numpy as np
import io
from app.label_parser import parse_label

app = FastAPI(
    title="NutriLens OCR Service",
    version="1.0.0",
)


# Load OCR model once when the service starts.
# This avoids loading the model for every image.
reader = easyocr.Reader(
    ["en"],
    gpu=False,
)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "ocr",
        "engine": "easyocr",
        "modelLoaded": True,
    }


@app.post("/ocr")
async def extract_text(file: UploadFile = File(...)):
    if not file.content_type:
        raise HTTPException(
            status_code=400,
            detail="File type is missing",
        )

    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Only image files are supported",
        )

    contents = await file.read()

    if not contents:
        raise HTTPException(
            status_code=400,
            detail="Uploaded image is empty",
        )

    try:
        image = Image.open(
            io.BytesIO(contents)
        ).convert("RGB")

        image_array = np.array(image)

        results = reader.readtext(
            image_array,
            detail=1,
            paragraph=False,
        )

        detected_text = []
        confidence_values = []

        for bounding_box, text, confidence in results:
            detected_text.append({
                "text": text,
                "confidence": round(
                    float(confidence),
                    4,
                ),
                "boundingBox": [
                    [int(point[0]), int(point[1])]
                    for point in bounding_box
                ],
            })

            confidence_values.append(
                float(confidence)
            )

        combined_text = "\n".join(
            item["text"]
            for item in detected_text
        )

        average_confidence = (
            sum(confidence_values)
            / len(confidence_values)
            if confidence_values
            else 0
        )
        parsed_label = parse_label(
            combined_text,
            detected_text,
        )
        return {
            "status": "success",
            "text": combined_text,
            "confidence": round(
                average_confidence,
                4,
            ),
            "engine": "easyocr",
            "detections": detected_text,
            "parsedLabel": parsed_label,
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"OCR failed: {str(error)}",
        )
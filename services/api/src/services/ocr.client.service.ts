const OCR_SERVICE_URL =
  process.env.OCR_SERVICE_URL ?? "http://localhost:8001";

export interface OcrResult {
  status: string;
  text: string;
  confidence: number;
  engine: string;

  detections: Array<{
    text: string;
    confidence: number;
    boundingBox: number[][];
  }>;

  parsedLabel: {
    productName: string | null;
    servingSizeGrams: number | null;

    nutrition: Record<
      string,
      {
        value: number;
        unit: string;
        sourceText: string;
        confidence: number;
      }
    >;

    nutritionQuality: {
      featuresDetected: number;
      requiredFeatures: number;
      complete: boolean;
    };

    ingredients: string[];
    allergens: string[];
    claims: string[];
  };
}

export async function extractLabelWithOcr(
  file: Buffer,
  filename: string,
  contentType: string,
): Promise<OcrResult> {
  const formData = new FormData();

  const arrayBuffer = new ArrayBuffer(file.byteLength);

  new Uint8Array(arrayBuffer).set(file);

  const blob = new Blob(
    [arrayBuffer],
    { type: contentType },
  );

  formData.append(
    "file",
    blob,
    filename,
  );

  const response = await fetch(
    `${OCR_SERVICE_URL}/ocr`,
    {
      method: "POST",
      body: formData,
    },
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `OCR service failed (${response.status}): ${errorText}`,
    );
  }

  return response.json() as Promise<OcrResult>;
}
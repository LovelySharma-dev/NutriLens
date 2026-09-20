export interface OcrResult {
  text: string;
  confidence: number;
}

export async function extractTextFromImage(
  imageUrl: string,
): Promise<OcrResult> {
  if (!imageUrl) throw new Error("Image url is required");

  // OCR engine will be connected in the next stage.
  // This function defines the interface used by the rest
  // of the NutriTrust pipeline.

  return {
    text: "",
    confidence: 0,
  };
}

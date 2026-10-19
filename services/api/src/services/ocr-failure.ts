export function uploadRejection(file: { mimetype?: string; size?: number } | undefined) {
  if (!file) {
    return { status: 400, body: { status: "error" as const, message: "Image file is required" } };
  }
  if (!file.mimetype?.startsWith("image/")) {
    return { status: 400, body: { status: "error" as const, message: "Only image files are supported" } };
  }
  if (!file.size) {
    return { status: 400, body: { status: "error" as const, message: "Uploaded image is empty" } };
  }
  return null;
}

export function ocrUnavailableBody() {
  return {
    status: "error" as const,
    message: "OCR service unavailable. No nutrition values were inferred.",
  };
}

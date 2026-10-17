"""Image passes that make real label photos easier to read.

Food labels are rarely clean scans. A second, contrast-stretched pass
recovers faint table text without replacing the original pixels.
"""

from __future__ import annotations

from PIL import Image, ImageEnhance, ImageFilter, ImageOps
import numpy as np


def prepare_variants(image: Image.Image) -> list[np.ndarray]:
    image = ImageOps.exif_transpose(image).convert("RGB")
    width, height = image.size
    long_edge = max(width, height)

    if long_edge < 1400:
        scale = 1400 / long_edge
        image = image.resize(
            (max(1, int(width * scale)), max(1, int(height * scale))),
            Image.Resampling.LANCZOS,
        )

    enhanced = ImageEnhance.Contrast(image).enhance(1.55)
    enhanced = ImageEnhance.Sharpness(enhanced).enhance(1.8)
    enhanced = enhanced.filter(ImageFilter.SHARPEN)

    gray = ImageOps.autocontrast(ImageOps.grayscale(enhanced), cutoff=1)
    gray_rgb = gray.convert("RGB")

    return [np.array(enhanced), np.array(gray_rgb), np.array(image)]

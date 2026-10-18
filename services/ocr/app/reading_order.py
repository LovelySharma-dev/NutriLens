"""Group OCR boxes into visual lines so the parser sees table rows."""

from __future__ import annotations

from statistics import median
from typing import Any


def _center_y(detection: dict[str, Any]) -> float:
    box = detection["boundingBox"]
    return sum(point[1] for point in box) / len(box)


def _left_x(detection: dict[str, Any]) -> float:
    return min(point[0] for point in detection["boundingBox"])


def _height(detection: dict[str, Any]) -> float:
    ys = [point[1] for point in detection["boundingBox"]]
    return max(ys) - min(ys)


def detections_to_lines(detections: list[dict[str, Any]]) -> str:
    if not detections:
        return ""

    heights = [height for item in detections if (height := _height(item)) > 0]
    tolerance = max(12.0, (median(heights) if heights else 16.0) * 0.65)

    ordered = sorted(detections, key=lambda item: (_center_y(item), _left_x(item)))
    lines: list[list[dict[str, Any]]] = []
    anchor_y: float | None = None

    for item in ordered:
        y = _center_y(item)
        if anchor_y is None or abs(y - anchor_y) > tolerance:
            lines.append([item])
            anchor_y = y
            continue

        lines[-1].append(item)
        anchor_y = (anchor_y * (len(lines[-1]) - 1) + y) / len(lines[-1])

    rendered: list[str] = []
    for line in lines:
        line.sort(key=_left_x)
        text = " ".join(str(item.get("text", "")).strip() for item in line)
        text = " ".join(text.split())
        if text:
            rendered.append(text)

    return "\n".join(rendered)

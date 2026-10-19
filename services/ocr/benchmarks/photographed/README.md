# Photographed labels

This directory is intentionally empty of images and annotations.

A real packet belongs here only when the file is one JSON object per image, schema `photographed-label-1`, with `source` set to `photographed`, a `product_id` that does not appear in another split, and a `license` and `consent` that allow this repository to store the image. Do not download or commit a restricted dataset to fill the directory.

Until those rows exist, `python scripts/score_benchmark.py` reports photographed character error rate, field scores, allergen recall, and end-to-end success as unavailable. Synthetic fixtures in `../fixtures/` are not a substitute.

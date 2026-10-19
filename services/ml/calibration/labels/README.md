# Held-out calibration labels

This directory is empty of label files on purpose.

A future row is one JSON object, or a JSON list, with `split` set to `calibration`, `scoreSource` set to `forest_vote_share`, `score` in `[0, 1]`, `outcome` of `1` (correct) or `0` (incorrect), and a `product_id` that does not appear in train, validation, or test. EasyOCR box scores are not accepted here. Synthetic fixture rows must not be copied into this directory and then described as photographed calibration.

`python scripts/evaluate_calibration.py` from `services/ml` reads only `*.json` files. With none present, the report states that calibration is unvalidated and does not invent ECE, Brier, NLL, or a coverage-risk curve.

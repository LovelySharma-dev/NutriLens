# Error taxonomy

Codes are assigned by `assign_errors` in `services/ocr/app/error_taxonomy.py`. They sit beside the field labels from `score_fields` (`correct`, `missed`, `swapped`, `wrong_unit`, `invented`, `wrong_value`). A `wrong_value` digit is not renamed to an OCR substitution unless the character alignment also records substitutions.

| Code | When it is applied |
| --- | --- |
| `ocr_substitution` | Character alignment between `ocr_text` and `observed_text` contains substitutions. |
| `omitted_text` | That alignment deletes reference characters, or a nutrition field is `missed`. |
| `incorrect_table_association` | `score_fields` labels the nutrient `swapped`. |
| `ingredient_boundary_error` | Annotated ingredient tokens were joined into one parsed token, or one annotated token was split in two. A substituted word is not a boundary error. |
| `unit_conversion_error` | `score_fields` labels the nutrient `wrong_unit`. |
| `allergen_miss` | An annotated allergen is absent from `parse_label` → `extract_allergens` on the parser input. |
| `unsupported_inference` | `score_fields` labels a nutrient `invented`. |

If `observed_text` is missing, character codes are not assigned. The parser then reads `ocr_text`, and the report says CER and WER are unavailable.

When several codes apply, one is marked `primary` in this order: allergen miss, incorrect table association, unit conversion, unsupported inference, ingredient boundary, omitted text, OCR substitution. The order is a reporting choice, not a severity model.

End-to-end success on a row means every scored nutrition field is `correct`, ingredient tokens match, and every annotated allergen was found. It does not include a grade disposition, because these rows have no EasyOCR box confidence, and it does not mean the food is safe.

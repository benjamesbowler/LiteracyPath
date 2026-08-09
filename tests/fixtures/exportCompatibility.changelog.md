# Export compatibility decisions

## 2026-08-09 — student EL literal-observation cutover

Approved semantic snapshot change for the Student EL workbook only:

- 187 unobserved letter-name and letter-sound cells now render as neutral blanks
  instead of red `Not checked` cells.
- One independently observed correct fixture result now renders as `Yes` with
  the positive fill instead of `Not enough results`.
- The associated summary sentence uses the same literal `Yes` result.
- Sheet names, row count, cell count, formulas, the class EL workbook and the
  Guided Reading workbook are unchanged.

This aligns the export with the current teacher-observation contract: these
cells report the latest literal observation (`Yes`, `No`, or blank), not a
longitudinal mastery conclusion inferred from a single check.

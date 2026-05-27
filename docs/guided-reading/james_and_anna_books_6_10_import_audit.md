# James and Anna Level B Books 6-10 Import Audit

Generated: 2026-05-27

## Source

- Source parent folder: `/Users/benjaminbowler/Desktop/LiteracyPath/Our Guided Reading Books Literacy Path/James and Anna 1-10 B`
- Image pack folder: `/Users/benjaminbowler/Desktop/LiteracyPath/Our Guided Reading Books Literacy Path/James and Anna 1-10 B/Kimi_Agent_James & Anna Book 6-10 Images`
- Target folder: `public/guided-reading/series/james-and-anna/`
- App data file: `src/data/guidedReadingSeriesBooks.js`

## Import Summary

| Book ID | Title | Expected story pages | Imported story pages | Cover status | Image count | QA status |
| --- | --- | ---: | ---: | --- | ---: | --- |
| `ja-b-06` | James and Anna visit Grandma's Farm | 12 | 12 | Delivered cover used | 13 | needs_review |
| `ja-b-07` | James and Anna and the School Play | 13 | 13 | Delivered cover used | 14 | needs_review |
| `ja-b-08` | Chips's Play Date | 12 | 12 | Delivered cover used | 13 | needs_review |
| `ja-b-09` | James and Anna's New Bikes | 13 | 13 | Delivered cover used | 14 | needs_review |
| `ja-b-10` | James, Anna and Chips go Camping | 14 | 14 | Delivered cover used | 15 | needs_review |

Expected total image assets: 69.
Imported total image assets: 69.

## Text Extraction

- Story text was extracted from the matching DOCX `PAGE` sections only.
- Title page text was not imported as a reading page.
- `PAGE` labels were not imported as reading text.
- `[ ILLUSTRATION ]` markers were not imported as reading text.
- Illustration prompts, series character reference, image-generation reference, book-wide setting notes, QA notes, and prompt headings were excluded from student-facing text.
- App story page counts match the DOCX story page counts.

## Image Alignment

- `book-06/page-001.webp` through `book-06/page-012.webp` align to Book 6 pages 1-12.
- `book-07/page-001.webp` through `book-07/page-013.webp` align to Book 7 pages 1-13.
- `book-08/page-001.webp` through `book-08/page-012.webp` align to Book 8 pages 1-12.
- `book-09/page-001.webp` through `book-09/page-013.webp` align to Book 9 pages 1-13.
- `book-10/page-001.webp` through `book-10/page-014.webp` align to Book 10 pages 1-14.

## Missing Images

None.

## Questionable Covers / Pages

- Covers were present in the delivered image pack and were used as `cover.webp`.
- Source QA notes mark the pack as ready for use, with optional review suggested for:
  - Book 7 pages 001, 002, 005, and 006: minor embedded narrative text artifacts.
  - Book 9 page 012: bike accent colours may differ slightly from the intended pure red/purple.
  - Book 10 page 008: James appears orange-ish inside the sleeping bag, but this was considered acceptable in source QA.

## Visibility / Release Status

- Imported records are `status: "teacher_preview"`.
- Imported records are `qaStatus: "needs_review"`.
- Imported records are `teacherPreviewOnly: true`.
- Imported records are `active: false`.
- These books are not fully student-live.

## Validation Notes

- Books 1-5 were not overwritten.
- Bob and Nan Level A assets were not touched.
- Aiden and Betty Level C assets were not touched.
- Guided-reading validation should include James and Anna Books 1-10 after this import.

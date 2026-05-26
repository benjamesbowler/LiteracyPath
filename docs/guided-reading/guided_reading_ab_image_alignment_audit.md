# Guided Reading A/B Image Alignment Audit

Date: 2026-05-26

## Summary

The Level C guided story image override table was removed because those books already had an approved one-to-one page order. They now use:

- `/guided-reading/pages/gs-c-01/page-001.webp` through `page-010.webp`
- `/guided-reading/pages/gs-c-02/page-001.webp` through `page-010.webp`
- `/guided-reading/pages/gs-c-03/page-001.webp` through `page-010.webp`
- `/guided-reading/pages/gs-c-04/page-001.webp` through `page-010.webp`
- `/guided-reading/pages/gs-c-06/page-001.webp` through `page-010.webp`

The actual mismatch was in the regenerated Level A/B books. These books were pointing at the nested remake images under `/guided-reading/pages/{bookId}/page-00N.webp`, but the text-matched page set is the original regenerated set under `/guided-reading/regen/pages/{bookId}-page-0N.png`.

## Repointed A/B Books

The following books were repointed back to the text-matched regenerated page images:

| Book ID | Title | Runtime page image pattern |
|---|---|---|
| `gr-a-01` | The Red Hat | `/guided-reading/regen/pages/gr-a-01-page-0N.png` |
| `gr-a-02` | The Mess | `/guided-reading/regen/pages/gr-a-02-page-0N.png` |
| `gr-a-03` | The Map | `/guided-reading/regen/pages/gr-a-03-page-0N.png` |
| `gr-a-04` | The Box | `/guided-reading/regen/pages/gr-a-04-page-0N.png` |
| `gr-b-06` | The Picnic | `/guided-reading/regen/pages/gr-b-06-page-0N.png` |
| `gr-b-07` | The Lost Dog | `/guided-reading/regen/pages/gr-b-07-page-0N.png` |
| `gr-b-08` | The Big Hill | `/guided-reading/regen/pages/gr-b-08-page-0N.png` |
| `gr-b-09` | The Rainy Day | `/guided-reading/regen/pages/gr-b-09-page-0N.png` |

## Notes

- No Level C story text was changed.
- No Level A/B story text was changed.
- No books were hidden or disabled.
- The nested remake images remain on disk for future QA, but these eight A/B books no longer use them at runtime because their page scenes were less aligned to the current text.
- Remaining image-quality review can now happen against pages that at least match the correct story text.

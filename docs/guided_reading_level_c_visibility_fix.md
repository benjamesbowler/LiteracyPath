# Guided Reading Level C Visibility Fix

Generated: 2026-05-25T11:02:36.878Z

## Root Cause

The Level C pilot books were present in the `guidedReadingBooks` data export and passed the basic approved/page filters, but they were easy to miss because they only appeared after navigating Fiction > Level C. Review-mode state had no dedicated shelf or badge, so content could be technically loaded while feeling invisible in the UI.

## Filters Fixed

- Added a dedicated Level C Guided Story Pilot shelf above the normal category/level flow.
- Review-mode books still remain in the regular Fiction > Level C shelf.
- Missing page narration no longer affects shelf visibility; page audio remains optional and hidden when absent.
- Cover fallback logic remains in place, but the five pilot covers are required and checked.

## Routing Fixes

- Pilot cards call the same reader-opening path as the regular shelf.
- The reader receives the same page data, page images, notes, marking, and navigation controls.

## Fallback Behavior

- Missing cover: fallback cover renders, but this audit flags it.
- Missing narration/page audio: book remains visible; Read Page button is hidden for pages without audio.
- Missing page image: book remains diagnosable, but this audit fails because review books must have page art.

## Remaining Review-Mode Limitations

- Exact page narration audio is still pending for these pilot stories.
- These are labeled Review/Audio Pending in the UI until narration is approved.

## Level C Pilot Visibility

| ID | Title | Type | Level | Review | QA | Pages | Cover | Missing Page Images | Discoverable | Hidden Reason |
|---|---|---|---|---:|---|---:|---:|---|---:|---|
| gs-c-01 | The Lion and the Little Mouse | Fiction | C | yes | needs_image_alignment_review | 10 | yes | none | yes | none |
| gs-c-02 | The Crow and the Water Jar | Fiction | C | yes | needs_image_alignment_review | 10 | yes | none | yes | none |
| gs-c-03 | The Fox and the High Grapes | Fiction | C | yes | needs_image_alignment_review | 10 | yes | none | yes | none |
| gs-c-04 | The Dog and the River Shadow | Fiction | C | yes | needs_image_alignment_review | 10 | yes | none | yes | none |
| gs-c-06 | The Bell in the Tree | Fiction | C | yes | needs_image_alignment_review | 10 | yes | none | yes | none |

Visible Fiction Level C shelf books: gs-c-01, gs-c-02, gs-c-03, gs-c-04, gs-c-06

## Result

PASS: all five Level C pilot books are discoverable, have covers, have page images, and can route through the reader.

# Guided Reading Level C Visibility Fix

Generated: 2026-05-26T06:17:21.699Z

## Root Cause

The Level C pilot books were present in the `guidedReadingBooks` data export. They are now approved app-guided-reading books and should appear as normal Fiction Level C books, not as draft, current, or pilot-only entries.

## Filters Fixed

- Level C pilot books remain in the regular Fiction > Level C shelf.
- Approved Level C books no longer require review-mode visibility to be discoverable.
- Missing page narration no longer affects shelf visibility; page audio remains optional and hidden when absent.
- Cover fallback logic remains in place, but the five pilot covers are required and checked.

## Routing Fixes

- Level C cards call the same reader-opening path as the regular shelf.
- The reader receives the same page data, page images, notes, marking, and navigation controls.

## Fallback Behavior

- Missing cover: fallback cover renders, but this audit flags it.
- Missing narration/page audio: book remains visible; Read Page button is hidden for pages without audio.
- Missing page image: book remains diagnosable, but this audit fails because review books must have page art.

## Remaining Limitations

- Exact page narration audio is still pending for these pilot stories.
- These books are not labeled as Current/Pilot/Draft in the student shelf.

## Level C Pilot Visibility

| ID | Title | Type | Level | Review Mode | QA | Pages | Cover | Missing Page Images | Discoverable | Hidden Reason |
|---|---|---|---|---:|---|---:|---:|---|---:|---|
| gs-c-01 | The Lion and the Little Mouse | Fiction | C | no | approved | 10 | yes | none | yes | none |
| gs-c-02 | The Crow and the Water Jar | Fiction | C | no | approved | 10 | yes | none | yes | none |
| gs-c-03 | The Fox and the High Grapes | Fiction | C | no | approved | 10 | yes | none | yes | none |
| gs-c-04 | The Dog and the River Shadow | Fiction | C | no | approved | 10 | yes | none | yes | none |
| gs-c-06 | The Bell in the Tree | Fiction | C | no | approved | 10 | yes | none | yes | none |

Visible Fiction Level C shelf books: gs-c-01, gs-c-02, gs-c-03, gs-c-04, gs-c-06

## Result

PASS: all five Level C books are approved Fiction Level C entries, discoverable, have covers, have page images, and can route through the reader.

# App Performance Audit

Generated: 2026-05-29

Scope: lightweight investigation and safe guardrails. No Guided Reading content, assessment scoring, Supabase schema, mastery thresholds, or teacher dashboard behavior was intentionally changed.

## Current Large Build Chunks

Existing `dist/` output was inspected rather than running a new build.

| Chunk | Size | Likely Cause |
| --- | ---: | --- |
| `index-IjEGnPps.js` | 1.6 MB | Main app state plus broad assessment runtime imports. |
| `admin-media-inventory-KGaxYUct.js` | 1.3 MB | Public media inventory/admin QA data. |
| `guided-reading-data-CfnXl8mu.js` | 1.0 MB | Guided Reading book metadata/page text imported as one data chunk. |
| `exceljs.min-CjgIwHka.js` | 908 KB | Excel export library. It is correctly loaded by dynamic import in export helpers. |
| `question-bank-extra-CLZ6zgkC.js` | 902 KB | Template expansions and extra/generated question-bank data. |
| `audio-manifest-BCfLNgTG.js` | 758 KB | Audio preference/manifest data imported by many runtime media helpers. |
| `generated-early-skills-DY3YEyCB.js` | 538 KB | Generated early skill bank. |

Static asset payload is much larger than JavaScript:

- `public/guided-reading/`: about 1.0 GB
- `public/images/`: about 539 MB
- `public/media/`: about 130 MB
- existing `dist/`: about 2.2 GB

## Likely Slow Paths

| Area | Risk | Notes |
| --- | --- | --- |
| Main `App.jsx` question bank assembly | High | Many banks are imported and normalized in the main app module. This can make startup and button transitions expensive. |
| Audio preference manifest | Medium | Large manifest is imported by several helpers and can enter assessment/runtime chunks. Split runtime-approved audio from QA/replacement history later. |
| Guided Reading data | Medium | Guided Reading is chunked, but full book/page data is still a large single module. |
| Admin media inventory | Medium | Already chunked, but `AdminDashboardPage` statically imports it once the admin page loads. Keep it out of student flow. |
| Dashboard summaries | Medium | Large localStorage/report summaries should run only when dashboard sections are visible and should be memoized. |
| Excel exports | Low | Current helpers use `await import("exceljs")`, which is the right pattern. |

## Safe Fixes Confirmed

- `AdminDashboardPage` is lazy-loaded from `src/App.jsx`.
- Excel export helpers use dynamic `import("exceljs")`.
- Vite manually chunks React, Supabase, admin media inventory, audio manifest, guided-reading data, question-bank-extra, and generated early skills.

## Immediate Safe Recommendations

1. Keep Codex away from full builds unless requested. Use targeted node checks during feature work.
2. Keep ExcelJS dynamic-only. Add a contract check so future static imports fail.
3. Keep admin media inventory out of student flow; load it only in admin/media QA contexts.
4. Memoize teacher dashboard report summaries and parse saved report/history data only when dashboard is open.
5. Do not split Guided Reading data in this urgent bugfix pass. Plan a separate shelf-summary/full-book lazy-loading pass.
6. Do not split assessment question banks in this urgent bugfix pass. Plan a separate active-skill dynamic import pass.

## Future Code-Splitting Plan

Low-risk sequence:

1. Create lightweight Guided Reading shelf metadata and dynamically import full series/book page arrays only when opening a book.
2. Split assessment question banks by skill family and dynamically import the active skill bank.
3. Split `audioPreferenceManifest` into:
   - runtime-approved exact-word lookup
   - admin QA/replacement history
   - deprecated/review-needed paths
4. Move media QA inventory loading into the exact admin tab that needs it.
5. Add a simple performance smoke script that checks chunk names/sizes after human-run builds.

## What Not To Change In This Pass

- Do not change assessment scoring, thresholds, or selectors.
- Do not change Guided Reading content/data.
- Do not remove media/source assets.
- Do not rewrite dashboard features.
- Do not run broad cleanup or `git add .`.

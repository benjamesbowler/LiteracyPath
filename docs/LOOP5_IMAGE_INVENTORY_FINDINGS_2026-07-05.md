# Loop 5 — Art & Image Pipeline Findings (2026-07-05)

Source: `docs/validation/app_image_inventory_audit.json` (8,816 images inventoried).
This loop **audits and flags only** — no media was overwritten, generated, or deleted.

## Inventory summary

| Metric | Result |
| --- | --- |
| Total images on disk | 8,816 |
| Orphans (present but unused by app) | **0** |
| Format split | webp 7,943 · png 796 · svg 77 |
| Non-webp raster in app areas | 339 |

By area (non-webp raster): guided_reading 322 · generated 13 · assessment 4.

## Missing referenced images

Spot-checked the most visible child surface: all **38 Story Stop cover images**
referenced in `questStoryQuestions.generated.js` exist on disk (0 missing). This is
now locked by a unit test (`tests/unit/questCovers.test.js`) so a future missing
cover fails CI instead of rendering broken to a child.

Broader missing-image safety is already handled at runtime: the shared media
components render with graceful `onError` fallbacks and `alt` text —
`WordImage.jsx` (`onError → setFailed`, `alt={word}`), `LearnCardMedia.jsx`
(`onError`, decorative `alt=""`), plus `StoryQuestPlayer`, `LearnDeckPlayer`,
`GamePlayer`, `ArcadePracticeGame`, `AdventureGame`, `BookQuiz`, `RewardsPage`.

## Flags (no action taken — owned by the import pipeline)

- **322 legacy guided-reading cover PNGs** (e.g. `public/guided-reading/covers/gr-e-*-cover.png`).
  Already tolerated by `check:repo-hygiene` as "existing tracked legacy non-webp".
  Converting to webp is an import-pipeline job, not an app-code change — flagged, not touched.
- **13 generated + 4 assessment PNGs** — small, likely intentional; left as-is.

## Art requests

**None this pass.** Zero orphans, zero missing referenced covers, fallbacks in
place. No missing or off-style asset was identified that requires new art, so no
`ART_REQUEST_*.md` was created (writing a request doc with nothing to request
would be noise).

## Verified

- `tests/unit/questCovers.test.js` — every Story Stop cover exists on disk.
- Unit suite green; no media folders written to.

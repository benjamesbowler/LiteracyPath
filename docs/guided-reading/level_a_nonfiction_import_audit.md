# Level A Nonfiction Import Audit

Generated: 2026-05-28T06:35:48.795Z

## Source

- Source folder inspected: `/Users/benjaminbowler/Desktop/LiteracyPath_Source_Packs/Organised/Non-Fiction Level A`
- Media manifest: `/Users/benjaminbowler/Desktop/LiteracyPath_Source_Packs/Organised/Non-Fiction Level A/Level A Nonfiction Media/LiteracyPath_FirstFacts_Level_A_Media/manifest.json`
- Media folder: `/Users/benjaminbowler/Desktop/LiteracyPath_Source_Packs/Organised/Non-Fiction Level A/Level A Nonfiction Media/LiteracyPath_FirstFacts_Level_A_Media`
- App destination: `public/guided-reading/nonfiction/first-facts-level-a/`
- Data file: `src/data/firstFactsActualLevelABooks.js`

## Summary

- Books found in source manifest: 20
- Books imported: 20
- Books made visible: 20
- Books left inactive/draft: 0
- Books skipped/incomplete: 0
- Covers imported: 20
- Story page images imported: 140
- Page audio files imported: 140
- Full-book audio files found: 0

## Import Notes

The source pack contains a separate title-page image for each book. The LiteracyPath reader already creates its title page from the book cover, so the seven reading pages were imported as `page-001.webp` through `page-007.webp`. Source title-page images were preserved as `source-title.webp` in each book folder for audit/reference, but they are not counted as reading pages.

The existing older First Facts nonfiction books remain Level B and continue using the existing `first-facts-a-*` ids and `/guided-reading/nonfiction/first-facts/` media paths. This import uses the separate `first-facts-level-a-*` id prefix and `first-facts-level-a` series id to avoid collisions.

## Imported Books

| # | Book ID | Title | DOCX found | Reading pages | Images | Audio | Full-book audio | QA status | Level A appropriateness |
|---:|---|---|---|---:|---:|---:|---|---|---|
| 1 | first-facts-level-a-01-colors | Colors | yes | 7 | 7 | 7 | no | approved | Level A appropriate: very short repeated/simple page text with clear picture support. |
| 2 | first-facts-level-a-02-farm-animals | Farm Animals | yes | 7 | 7 | 7 | no | approved | Level A appropriate: very short repeated/simple page text with clear picture support. |
| 3 | first-facts-level-a-03-big-and-little | Big and Little | yes | 7 | 7 | 7 | no | approved | Level A appropriate: very short repeated/simple page text with clear picture support. |
| 4 | first-facts-level-a-04-water | Water | yes | 7 | 7 | 7 | no | approved | Level A appropriate: very short repeated/simple page text with clear picture support. |
| 5 | first-facts-level-a-05-the-sky | The Sky | yes | 7 | 7 | 7 | no | approved | Level A appropriate: very short repeated/simple page text with clear picture support. |
| 6 | first-facts-level-a-06-animals-can | Animals Can! | yes | 7 | 7 | 7 | no | approved | Level A appropriate: very short repeated/simple page text with clear picture support. |
| 7 | first-facts-level-a-07-bugs | Bugs | yes | 7 | 7 | 7 | no | approved | Level A appropriate: very short repeated/simple page text with clear picture support. |
| 8 | first-facts-level-a-08-my-pet | My Pet | yes | 7 | 7 | 7 | no | approved | Level A appropriate: very short repeated/simple page text with clear picture support. |
| 9 | first-facts-level-a-09-hot-and-cold | Hot and Cold | yes | 7 | 7 | 7 | no | approved | Level A appropriate: very short repeated/simple page text with clear picture support. |
| 10 | first-facts-level-a-10-shapes | Shapes | yes | 7 | 7 | 7 | no | approved | Needs review: text load may be high for Level A. |
| 11 | first-facts-level-a-11-at-the-farm | At the Farm | yes | 7 | 7 | 7 | no | approved | Level A appropriate: very short repeated/simple page text with clear picture support. |
| 12 | first-facts-level-a-12-in-the-sea | In the Sea | yes | 7 | 7 | 7 | no | approved | Level A appropriate: very short repeated/simple page text with clear picture support. |
| 13 | first-facts-level-a-13-fruit | Fruit | yes | 7 | 7 | 7 | no | approved | Level A appropriate: very short repeated/simple page text with clear picture support. |
| 14 | first-facts-level-a-14-the-tree | The Tree | yes | 7 | 7 | 7 | no | approved | Level A appropriate: very short repeated/simple page text with clear picture support. |
| 15 | first-facts-level-a-15-baby-animals | Baby Animals | yes | 7 | 7 | 7 | no | approved | Level A appropriate: very short repeated/simple page text with clear picture support. |
| 16 | first-facts-level-a-16-fast-and-slow | Fast and Slow | yes | 7 | 7 | 7 | no | approved | Level A appropriate: very short repeated/simple page text with clear picture support. |
| 17 | first-facts-level-a-17-a-seed-grows | A Seed Grows | yes | 7 | 7 | 7 | no | approved | Level A appropriate: very short repeated/simple page text with clear picture support. |
| 18 | first-facts-level-a-18-my-body | My Body | yes | 7 | 7 | 7 | no | approved | Level A appropriate: very short repeated/simple page text with clear picture support. |
| 19 | first-facts-level-a-19-day-and-night | Day and Night | yes | 7 | 7 | 7 | no | approved | Level A appropriate: very short repeated/simple page text with clear picture support. |
| 20 | first-facts-level-a-20-space | Space | yes | 7 | 7 | 7 | no | approved | Level A appropriate: very short repeated/simple page text with clear picture support. |

## Skipped / Inactive Books

| Book | Title | Reason | Notes |
|---|---|---|---|
| None | - | - | - |

## Missing Media Issues

None found. Every imported book has a cover, seven reading page images, and seven matching page-audio files.

## Image/Text Alignment Notes

- Source reading page 2 maps to app story page 1.
- Source reading page 8 maps to app story page 7.
- No source generation prompts, page labels, or metadata were included as reading text.
- Page text was sourced from the media manifest, which provides per-page text aligned to each image and audio filename.

## Level A Appropriateness Notes

All imported books use very short page text, simple repeated language, and clear picture-supported nonfiction topics. Maximum page text load stayed at 10 words per page across the imported set.

## Recommended Kimi Fixes

None for this import. No missing or mismatched media was detected.

## Validation Results

- PASS: `node tools/checkGuidedReadingSeriesBooks.js`
- PASS: `node tools/checkGuidedReadingVisibility.js`
- PASS: `node tools/checkGuidedReadingExperience.js`
- PASS: `node tools/checkGuidedReadingTitlePages.js`
- PASS: `node tools/checkGuidedReadingImageTextAlignment.js`
- PASS: `npm run build`
- PASS: `git diff --check`

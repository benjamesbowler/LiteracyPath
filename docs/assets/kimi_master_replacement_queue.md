# Kimi Master Replacement Queue

Generated: 2026-06-02

This is the active source of truth for unresolved Kimi media work. Use this file first. Older request docs are archived when their unresolved items are represented here, or retained beside this file when they contain long active detail tables that should not be duplicated.

## Global QA Rules

- Create only the listed assets. Do not regenerate unrelated app media.
- No embedded text, labels, captions, fake writing, source marks, signatures, logos, or watermarks unless the app itself explicitly renders text separately.
- Keep target filenames and folder structure exactly.
- Match existing app style for the matching skill, story, or book series.
- Prefer WebP for images unless the active app path is PNG.
- Audio must be clean, child-friendly, warm, clear American English unless the request says otherwise.

## Active Queue Summary

| Priority | Area | Count / Scope | Source detail |
| --- | --- | ---: | --- |
| P1 | Assessment images | 4 destination paths for 1 target word | This file |
| P1 | Assessment audio | 565 generated review/replacement rows; 0 missing/broken active-audio rows | `docs/assets/replacement_assessment_audio_request.md` |
| P1 | Story Quests images | 1 known quality replacement | This file |
| P2 | Story Quests audio | 0 active unresolved items | `docs/assets/story_quest_asset_audit.md` |
| P1 | Guided Reading images | 33 confirmed problem-text image replacements | `docs/assets/kimi_guided_reading_problem_text_image_replacement_request.md` |
| P1 | Guided Reading whole-book audio | 116 missing MP3 + 116 missing sync JSON files | `docs/assets/kimi_missing_whole_book_audio_request.md` |

## Assessment Images

### P1 — Bud Image Replacement

- Area: Assessment images
- Skill/book/area: CVC and Short Vowels; shared Initial Sounds and Minimal Pairs media
- Current path(s):
  - `public/images/child-mode/cvc/bud.png`
  - `public/images/child-mode/initial-sounds/bud.png`
  - `public/images/child-mode/minimal-pairs/bud.png`
- Required target path(s): same as current paths
- Reason: current bud image is visually ambiguous and blocked from live assessment cards. Clean audio exists at `public/audio/child-mode/words/bud.mp3`.
- Exact generation requirements: create a simple natural cartoon flower bud on a clean white or very simple background. It must clearly show an unopened bud, not a confusing full flower. Use natural green and petal colors with a kindergarten-readable object shape. No face, eyes, smile, sparkles, rainbow colors, shadows, text, labels, logo, source mark, or watermark.
- Naming convention: replace each listed PNG path exactly.
- Output format: PNG.
- QA notes: verify that the image reads as "bud" without relying on audio or answer text.

## Assessment Audio

### P1 — Assessment Audio Review / Replacement Batch

- Area: Assessment audio
- Skill/book/area: active assessment question-bank audio, especially old/original and high-use human-review items
- Current path(s): see `docs/assets/replacement_assessment_audio_request.md`
- Required target path(s): see `docs/assets/replacement_assessment_audio_request.md`
- Reason: current audit found 0 missing/broken active-audio rows, but still flags 135 old/original active rows and 78 high-use human-review rows, with 565 total generated review/replacement rows.
- Exact generation requirements: use the voice standard and per-row script in `docs/assets/replacement_assessment_audio_request.md`. Each MP3 must say exactly the expected script in the table row, with no extra words, effects, or music.
- Naming convention: use the exact target replacement path from each row.
- Output format: MP3.
- QA notes: do not treat this as a missing-audio emergency batch; prioritize rows marked active, old/original, and high-use human review.

## Story Quests Images

### P1 — Meadow Pals / Brave Tiny Rescue `p05_big_tree.webp`

- Area: Story Quests images
- Story/book/skill: Meadow Pals / Brave Tiny Rescue
- Current app path: `public/images/story-quests/meadow-pals/brave-tiny-rescue/p05_big_tree.webp`
- Required target path: `public/images/story-quests/meadow-pals/brave-tiny-rescue/p05_big_tree.webp`
- Reason: no-watermark archive contained `p05_big_tree.png`, but the visible source mark remained and the app expects `.webp`. Do not convert, wire, or use the marked PNG.
- Exact generation requirements: create a clean no-watermark Brave/Tiny Rescue style page image for the same story scene intent: a big tree rescue moment on Sunny Meadow Farm, matching the Brave and Tiny quest character style, warm bright kindergarten cartoon look, consistent characters, no text in image.
- Naming convention: deliver exactly `p05_big_tree.webp`.
- Output format: WebP preferred and required for the active path.
- QA notes: no watermark, no source mark, no text, no logo, no signature. The Story Quest asset audit currently finds no missing referenced Story Quest files; this is a quality replacement item.

## Story Quests Audio

No active unresolved Story Quest audio item is currently carried forward. `docs/assets/story_quest_asset_audit.md` reports 0 missing referenced Story Quest audio files.

## Guided Reading Images

### P1 — Confirmed Problem-Text Image Replacements

- Area: Guided Reading images
- Story/book/skill: Guided Reading page illustrations across James and Anna, Moonwood Tales, Meadow Pals, First Facts, and main Guided Reading books
- Current path(s): see each output path in `docs/assets/kimi_guided_reading_problem_text_image_replacement_request.md`
- Required target path(s): same as each listed output path
- Reason: 33 guided-reading page images were confirmed to contain problematic embedded text, labels, captions, speech bubbles, diagram words, AI artifact writing, or source-like marks.
- Exact generation requirements: use the exact per-page prompt in `docs/assets/kimi_guided_reading_problem_text_image_replacement_request.md`. Match the original book style and story moment, but remove all readable text from the image.
- Naming convention: replace each listed path exactly.
- Output format: WebP unless a listed path is PNG.
- QA notes: the app renders reading text separately, so generated illustrations must contain no readable text at all.

## Guided Reading Whole-Book Audio

### P1 — Missing Whole-Book Narration and Sync JSON

- Area: Guided Reading whole-book audio
- Story/book/skill: Guided Reading full-book narration
- Current path(s): missing for every row in `docs/assets/kimi_missing_whole_book_audio_request.md`
- Required target path(s): 116 MP3 files and 116 sync JSON files listed in `docs/assets/kimi_missing_whole_book_audio_request.md`
- Reason: local existence check confirmed all 116 requested whole-book MP3 paths and all 116 matching sync JSON paths are still missing.
- Exact generation requirements: narrate each book exactly from the page text in `docs/assets/kimi_missing_whole_book_audio_request.md`. Make one full-book MP3 per book and one matching sync JSON file if page-boundary timing can be measured.
- Naming convention: use each listed `Required whole-book MP3 path` and `Required sync JSON path` exactly.
- Output format: MP3 and JSON.
- QA notes: do not create page images, word audio, page-level narration, browser-TTS output, or placeholder audio. Sync JSON must use `bookId`, `title`, `audioPath`, `syncAccuracy`, `durationMs`, and `pageTimings`.

## Resolved / Superseded

The Story Quest asset audit reports all currently referenced Story Quest image/audio files exist. Older Story Quest Kimi build docs are superseded by imported assets plus the single active `p05_big_tree.webp` quality item above.

Strict missing-media Kimi docs that reported no rows are superseded by current audits and may be archived.

Assessment missing-image docs that only carried the `bud` manual QA item are superseded by the active `bud` item above and may be archived.

## Still Active Detail Docs

These files are intentionally not archived because they contain long active request tables or full page text needed by Kimi:

- `docs/assets/replacement_assessment_audio_request.md`
- `docs/assets/kimi_guided_reading_problem_text_image_replacement_request.md`
- `docs/assets/kimi_missing_whole_book_audio_request.md`
- `docs/assets/kimi_media_replacement_request.md`


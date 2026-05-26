# Stabilization Pass Report

Date: 2026-05-25

## Scope

This pass focused on assessment media quality, High Frequency Words coverage, validation gates, admin visibility, and activating the Level C Guided Reading pilot books for review. Supabase/auth/class/scoring logic was not changed.

## Media Audit

| Metric | Result |
|---|---:|
| Public assessment images scanned | 872 |
| Active image-backed assessment mappings scanned | 1690 |
| Confirmed active rainbow/over-stylized mappings | 0 |
| Known unsuitable images still active | 0 |
| Excluded weird target words still active | 0 |
| Known semantic conflict failures | 0 |
| Manual-review image candidates from color heuristic | 49 |

## Media Replacements

| Metric | Result |
|---|---:|
| Confirmed bad images replaced with approved assets | 9 |
| Files preserved under `_rejected` | 46 |
| Files copied into dated rejected archive `public/media/_rejected/2026-05-25` | 23 |
| Confirmed active bad media remaining | 0 |
| Kimi replacement request rows for confirmed bad active assets | 0 |
| Kimi manual-review candidate rows | 49 |

Replaced targets:

- Initial Sounds: `acorn`, `gum`, `hat`, `jam`, `leg`, `nut`, `sun`, `wig`
- Shared short-u image: `nut`

Generated/updated:

- `docs/assets/image_quality_visual_audit.md`
- `docs/assets/media_replacement_log.md`
- `docs/assets/rejected_media_manifest.md`
- `docs/assets/kimi_strict_media_replacement_request.md`
- `docs/assets/kimi_image_replacement_request.md`

## High Frequency Words

| Metric | Before | After |
|---|---:|---:|
| Canonical HFW coverage visible to validation | ambiguous / alias-dependent | `high_frequency_words` |
| Active HFW questions | 194 existing runtime questions | 194 validated runtime questions |
| Unique HFW target words | 127 | 127 |
| Sample round size | not explicitly gated | 15/15 |
| Structural failures | not gated separately | 0 |

The registry now treats `high_frequency_words` as canonical and accepts aliases: `sight_words`, `highFrequencyWords`, `hfw`, `hfw_1_25`, `hfw_26_50`, and `hfw_51_100`.

Generated:

- `tools/checkHighFrequencyWordsCoverage.js`
- `docs/validation/high_frequency_words_coverage_audit.md`

## Admin Coverage

The admin content coverage table now exposes:

- total questions
- runtime-selectable questions
- missing image count
- missing audio count
- bad media count
- active/inactive count
- zero/below-30 warnings through the runtime-selectable count
- an aggregate `High Frequency Words` row, so HFW cannot disappear behind split legacy labels

## Guided Reading Fiction Status

This earlier stabilization pass briefly activated imported fiction pilot books for review. That state was superseded on 2026-05-26: all Guided Reading fiction books and fiction-only assets were permanently removed, and the active Guided Reading shelf now uses nonfiction books only. See `docs/guided-reading/fiction_removal_audit.md` for the current source of truth.

## Validation Results

Passed:

- `npm run build`
- `npm run validate:initial-sounds`
- `npm run validate:initial-sounds-media`
- `npm run check:initial-sound-progression`
- `npm run check:final-sound-progression`
- `npm run validate:skill-banks`
- `npm run check:skill-progression`
- `npm run validate:answer-options`
- `npm run check:hfw-coverage`
- `npm run check:media-quality`
- `npm run validate:guided-reading`
- `npm run validate:guided-reading-regen`
- `npm run validate:guided-stories`
- `node tools/auditQuestionBank.js`
- `node tools/checkRuntimeQuestionCoverage.js`
- `node tools/checkRepeatSelection.js`
- `node tools/auditImageQuality.js`

## Remaining Manual QA

- Review the 49 image color-heuristic candidates in `docs/assets/kimi_strict_media_replacement_request.md`. They are not confirmed bad by static checks, so they were not blocked automatically.
- Guided Reading Level C pilot books need exact narration audio before they should be treated as production-ready.
- Some non-Initial-Sounds skills still have expansion warnings, but no active runtime media failures were found.

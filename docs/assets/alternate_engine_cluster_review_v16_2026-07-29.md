# Alternate-engine ending-cluster review V16 — 2026-07-29

## V15 review result

The supplied V15 review contained 18 rows:

- 8 Yes
- 0 Maybe
- 9 No
- 1 unrated

Five patterns had at least one approved candidate: `fr`, `ft`, `lp`, `tr` and
`tw`. The selected candidates were `fr B`, `ft A`, `lp A`, `tr A` and `tw A`.
Where both candidates passed, the less processed or more literal phonics cue was
selected.

All five selected files were normalized against the existing production pattern
bank before installation. The bank median was -25.345 LUFS. Both approved `ft`
candidates were about 25 LU quieter than that median, while the other approved
candidates were within roughly 1–3 LU. The installed clips were normalized to a
-25.3 LUFS target and registered in `approvedPhonicsPatternAudio.js`.

## V16 alternate models

The four patterns still unresolved were `ct`, `nd`, `pt` and `xt`. Each now has
two direct-IPA candidates:

- A: Google `en-US-Studio-O`
- B: Google `en-US-Neural2-F`

This compares two separate Google acoustic-model families while retaining the
existing authenticated Google Cloud project and credits. Each engine receives a
complete IPA syllable (`/əkt/`, `/ənd/`, `/əpt/` or `/əkst/`) because Google
requires a vowel in every synthesized syllable. A mild 120 ms opening fade makes
that support vowel quieter without the severe consonant-level loss seen in the
earlier V15 ending-cluster treatment.

All eight review files are mono 24 kHz MP3s and were normalized to -25.3 LUFS.
Measured results range from -25.69 to -25.79 LUFS.

## Review

The listening form is:

`outputs/019fa860-9b95-77b1-9e50-ff7ce1c92ea3/production-review-remaining/2026-07-29-v16-alternate-engine/ALTERNATE_ENGINE_ENDING_CLUSTERS_V16_REVIEW.html`

The form persists Yes/Maybe/No ratings and notes, and exports
`alternate-engine-ending-clusters-v16-review.csv`.

No V16 candidate is installed until the exported review is reconciled.

## Provider fallback

If neither Google model succeeds for a pattern, the next controlled trial should
use Microsoft Azure Speech with an American female Neural or DragonHD voice and
an explicit IPA `<phoneme>` tag. ElevenLabs v3 also accepts IPA, but its own
guidance recommends multiple generations because the same IPA can vary, making
it less suitable as the first deterministic phonics fallback.

## Evidence

- `v15-review-decisions.json`
- `v15-loudness-report.json`
- `v15-installed-loudness-report.json`
- `alternate-engine-ending-clusters-v16-manifest.json`
- `alternate-engine-ending-clusters-v16-review-blank.csv`
- `audio/` — 8 distinct, volume-matched mono 24 kHz MP3 files
- generator: `tools/generateAlternateEngineEndingClusters.mjs`
- installer: `tools/installReviewedV15PatternAudio.mjs`

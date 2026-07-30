# Manual vowel removal V17 — 2026-07-29

## V16 review result

The eight-row V16 review contained:

- 1 Yes: `nd B`
- 3 Maybe: `ct A`, `pt B`, `xt A`
- 4 No

The `nd B` candidate was installed unchanged because it was explicitly approved.
The reviewer notes on `ct A` and `pt B` identified the remaining opening vowel as
the defect. `xt A` was retained as the strongest source for manual editing.

## Manual waveform edits

The source spectrograms contain a visible voiced-vowel region followed by a
low-energy consonant closure and then the consonant release. The V17 candidates
physically remove the samples before that boundary rather than fading or
resynthesizing them.

Each remaining pattern has two candidates:

- A starts at the end of the vowel and preserves the silent consonant closure.
- B starts later at the consonant burst/release, guaranteeing no residual
  opening vowel but producing a tighter cue.

The manual cut points are:

| Pattern | Source | A cut | B cut |
| --- | --- | ---: | ---: |
| `ct` | Studio-O V16 A | 245 ms | 275 ms |
| `pt` | Neural2-F V16 B | 265 ms | 345 ms |
| `xt` | Studio-O V16 A | 215 ms | 245 ms |

A 60 ms silent lead-in was added so the audio player does not clip the first
consonant transient. All six candidates are mono 24 kHz MP3s and are normalized
to the production loudness target.

Post-edit spectrograms confirm that the opening voiced-vowel formants are absent.

## Review

The listening form is:

`outputs/019fa860-9b95-77b1-9e50-ff7ce1c92ea3/production-review-remaining/2026-07-29-v17-manual-vowel-removal/MANUAL_VOWEL_REMOVAL_V17_REVIEW.html`

It persists Yes/Maybe/No ratings and exports
`manual-vowel-removal-v17-review.csv`.

## Evidence

- V16 source: `v16-review-decisions.json`
- `manual-vowel-removal-v17-manifest.json`
- `manual-vowel-removal-v17-review-blank.csv`
- `audio/` — 6 distinct manually cut clips
- `spectrograms/` — source and edited spectral checks
- generator: `tools/generateManualVowelRemovalReview.mjs`

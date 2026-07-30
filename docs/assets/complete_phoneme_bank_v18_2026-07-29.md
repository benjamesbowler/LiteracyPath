# Complete phoneme bank V18 — 2026-07-29

## V17 production result

The reviewer explicitly approved all six manually cut V17 candidates. Where both
cuts passed, the A version was selected because it preserves the silent
consonant closure and therefore retains more of the complete cluster.

The installed production files are:

- `ct` A: -25.45 LUFS
- `pt` A: -25.58 LUFS
- `xt` A: -25.55 LUFS

The production pattern-bank median after installation is -25.57 LUFS. All three
selected clips are therefore within 0.13 LU of that median. The production bank
now contains 49 approved pattern/phoneme clips.

## Complete-bank review

V18 contains all 49 approved production phonemes. Each review copy is normalized
to a -25.6 LUFS target so pronunciation decisions are not biased toward a louder
file. The resulting review copies range from -26.18 to -25.14 LUFS.

Every row also reports its original production loudness. The source bank ranges
from -35.02 to -20.98 LUFS, so the review can identify both pronunciation-method
problems and later volume-remastering work.

The 49 rows are classified as:

- 40 standard existing approved phonemes
- 5 `REDO PRIORITY` legacy opening-fade clips: `ft`, `lb`, `lp`, `nk`, `rk`
- 1 `CHECK` mild opening-fade clip: `nd`
- 3 `NEW FORMULA` manual-cut references: `ct`, `pt`, `xt`

The older fade-treated clips are not automatically rejected. The classification
simply makes them easy to reassess against the new manual-cut references.

## Review

The listening form is:

`outputs/019fa860-9b95-77b1-9e50-ff7ce1c92ea3/production-review-remaining/2026-07-29-v18-complete-phoneme-bank/COMPLETE_PHONEME_BANK_V18_REVIEW.html`

It persists Yes/Maybe/Needs edit/No ratings and notes, and exports
`complete-phoneme-bank-v18-review.csv`. The `Needs edit` rating and filter
separates clips that need the new surgical treatment from clips that require
complete replacement.

## Evidence

- V17 decisions: `v17-review-decisions.json`
- V17 production loudness: `v17-installed-loudness-report.json`
- `complete-phoneme-bank-v18-manifest.json`
- `complete-phoneme-bank-v18-review-blank.csv`
- `audio/` — 49 distinct level-matched review copies
- installer: `tools/installReviewedV17PatternAudio.mjs`
- generator: `tools/generateCompletePhonemeBankReview.mjs`

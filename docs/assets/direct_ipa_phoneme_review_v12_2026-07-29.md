# Direct IPA phoneme review V12 — 2026-07-29

## Outcome

All 33 phonics-pattern clips rejected in the V10 human listening review were
regenerated with Google Cloud Text-to-Speech using:

- voice: `en-US-Chirp3-HD-Leda`
- input: SSML `<phoneme alphabet="ipa">`
- encoding: MP3, mono, 24 kHz
- quota project: `project-3c66c1c8-cc9e-4d6d-bdf`

The batch contains exactly 33 distinct, decodable MP3 files. No production audio
was replaced during generation.

## Review

The human-ear review form is:

`outputs/019fa860-9b95-77b1-9e50-ff7ce1c92ea3/production-review-remaining/2026-07-29-v12-direct-ipa/DIRECT_IPA_MISSING_PHONEMES_REVIEW.html`

Each row provides audio playback, the target IPA and anchor word, explicit
Yes/Maybe/No controls, an optional note field, persistent local progress and CSV
export. Blank rows remain unreviewed.

Approve a clip only when it contains the isolated target sound without a spoken
letter name, anchor word or added schwa.

## Generated evidence

- `direct-ipa-missing-phonemes-v12-manifest.json`
- `direct-ipa-missing-phonemes-v12-review-blank.csv`
- `audio/` — 33 MP3 files

The reusable generator is `tools/generateDirectIpaPhonemeReview.mjs`.

## Next decision

Reconcile the exported CSV after human review. If this direct-IPA method is
accepted consistently, generate a complete replacement set for the app's phoneme
inventory with the same voice and synthesis method, then review that full set
before changing runtime paths.

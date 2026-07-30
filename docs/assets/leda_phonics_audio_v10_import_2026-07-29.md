# Leda phonics audio V10 import — 2026-07-29

## Outcome

The V10 listening review contained 67 candidates:

- 18 marked **Yes** and imported into `public/audio/production/en-US/pattern/`
- 33 marked **No** and retained as the regeneration queue
- 16 left blank and retained as unreviewed

No blank rating was treated as approval.

The approved clips are registered in
`src/data/approvedPhonicsPatternAudio.js` and
`src/data/audioPreferenceManifest.js`. Safe, unambiguous spellings are preferred
by `graphemeAudioPath`; context-sensitive clips remain available only by exact
pattern and anchor.

`ew as in few` is not a generic `ew` default because `ew as in grew` has a
different sound. `or as in word` is not a generic `or` default because the
sound differs from `or` in words such as `fork`.

## Regeneration decision

Keep Google Chirp 3 HD Leda as the production voice. Regenerate the 33 rejected
items using direct IPA in SSML `<phoneme>` markup rather than literal cue text.
This keeps the accepted voice while replacing the unreliable technique that
made Leda read approximations such as written-out phonetic hints.

Use Azure Speech or Amazon Polly only as pronunciation-control benchmarks. They
cannot preserve Leda's identity.

## Rights decision

Do not extract audio from Phonics World. Its terms prohibit extracting app
assets. Public-domain or CC0 speech datasets may be useful as pronunciation
evidence, but they do not provide a voice-consistent replacement for Leda.

## Evidence

- Source review: `Downloads/phonetic-cue-trials-v10.csv`
- Decision data and workbook:
  `outputs/019fa860-9b95-77b1-9e50-ff7ce1c92ea3/production-review-remaining/2026-07-29-v11/`
- Focused tests:
  `tests/unit/audioPreference.test.js`,
  `tests/unit/elQuestEngine.test.js`

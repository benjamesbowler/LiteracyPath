# App-wide reviewed phoneme audio mapping — 2026-07-29

## Outcome

All runtime sound prompts now resolve through one reviewed phoneme bank:

- Sound Seekers, including the 2D, pixel and encounter shells;
- all Arcade games that play a letter, grapheme or phoneme;
- CVC and letter-learning activities;
- student assessment questions and sound answer tiles;
- teacher assessment media and media-preference records;
- guided-reading segmented decoding support;
- EL Skills Quest and presentation output.

Whole-word recordings, instructions, assessment passages, reports and guided
books remain separate exact-text assets. They are not phoneme fallbacks.

## Runtime inventory

The active bank contains:

- 35 canonical atomic MP3 files in `/audio/phonemes/`;
- 48 explicitly registered, human-reviewed pattern MP3 files in
  `/audio/production/en-US/pattern/`.

The resolver verifies that a file exists in the generated audio manifest and is
not blocklisted before returning it. Missing audio returns an empty path; the
caller hides its Listen control or stays silent. Browser speech is never used.
The remaining student-rail browser-speech escape hatch was also removed, so a
missing reviewed navigation recording can no longer trigger a synthetic voice.

## Permanent legacy deletion

The superseded clean-human grapheme tree was physically deleted:

`public/audio/child-mode/clean-human/graphemes/`

This removed 69 legacy MP3 files. The runtime resolver contains no reference to
that directory, and a regression test fails if the directory or a reference to
it returns.

The eight unresolved V23 files were also physically deleted from the canonical
bank: B, short E, J, NK, CH, SH, TH and ZZ. Three stale production candidates
that were not approved by the final review history were deleted as well.

## Known silent sounds

Sound Seekers' integrity gate now records every intentional gap. There are 47:

- the eight final V23 deferrals;
- 23 advanced grapheme recordings removed with the legacy bank;
- 16 pre-existing alternative or higher-phonics gaps.

These sounds do not fall back to old files. They stay silent until a new
recording is approved.

## Verification

- 40 focused unit and routing tests pass.
- Sound Seekers integrity passes across 40 stops, 103 taught sounds and 431
  decodable words, with the 47 intentional silent gaps reported.
- CVC and Phonics Learn media gates pass; B, E and J are reported as optional
  silent recordings.
- Assessment source and browser evidence gates pass.
- The production build completes successfully.

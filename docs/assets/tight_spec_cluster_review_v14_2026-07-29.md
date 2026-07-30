# Tight-spec consonant-cluster review V14 — 2026-07-29

## V13 decision

The completed V13 human-ear review contained 29 rated consonant clusters:

- 10 Yes: `bl`, `cl`, `cr`, `dr`, `gl`, `gr`, `pl`, `pr`, `sl`, `st`
- 19 No: `ct`, `fl`, `fr`, `ft`, `lb`, `lp`, `nd`, `nk`, `pt`, `rk`,
  `scr`, `sm`, `sn`, `sp`, `spl`, `sw`, `tr`, `tw`, `xt`
- 0 Maybe
- 0 blank

The 10 V13 passes were copied into the production pattern-audio directory and
registered as approved clips. The two earlier V12 passes, `ar — as in car` and
`ew — as in grew`, were installed at the same time. No rejected V13 clip was
installed.

## Tight generation specification

The 19 failures were regenerated with Google Chirp 3 HD Leda using a full
syllable in one IPA `<phoneme>` instruction.

Ten onset blends use a joined cluster followed by a short schwa:

- `fluh`, `fruh`, `scruh`, `smuh`, `snuh`
- `spuh`, `spluh`, `swuh`, `truh`, `twuh`

The full-syllable constraint is intended to prevent letter-name readings such
as “ess pee” and long-/oo/ readings such as “smoo” or “troo”.

Nine ending clusters use a reduced support schwa before the consonants:

- `ukt`, `uft`, `ulb`, `ulp`, `und`
- `unk`, `upt`, `urk`, `ukst`

The generated ending-cluster audio is trimmed, then given a 180 ms fade-in so
the opening support vowel is materially quieter than the target consonants.
The review form explicitly rejects a prominent opening vowel.

## Review

The listening form is:

`outputs/019fa860-9b95-77b1-9e50-ff7ce1c92ea3/production-review-remaining/2026-07-29-v14-tight-spec/TIGHT_SPEC_CONSONANT_REDOS_REVIEW.html`

It contains exactly 19 unrated rows with playback, Yes/Maybe/No controls,
optional notes, persistent local progress and CSV export as
`tight-spec-consonant-redos-v14-review.csv`.

These V14 candidates remain outside production until the exported human review
is reconciled.

## Evidence

- `v13-review-decisions.json`
- `tight-spec-consonant-redos-v14-manifest.json`
- `tight-spec-consonant-redos-v14-review-blank.csv`
- `audio/` — 19 distinct mono 24 kHz MP3 files
- `raw-audio/` — unprocessed synthesis for audit comparison
- generator: `tools/generateTightSpecPhonemeRedo.mjs`

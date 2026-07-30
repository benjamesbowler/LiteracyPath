# Targeted consonant alternatives V15 — 2026-07-29

## V14 review result

The V14 human-ear review contained 19 fully rated rows:

- 10 Yes: `fl`, `lb`, `nk`, `rk`, `scr`, `sm`, `sn`, `sp`, `spl`, `sw`
- 1 Maybe: `tr`
- 8 No: `ct`, `fr`, `ft`, `lp`, `nd`, `pt`, `tw`, `xt`
- 0 blank

There were no written notes. The 10 Yes clips were copied into the production
pattern-audio directory and registered as approved defaults. The Maybe clip was
not installed.

## V15 targeted alternatives

The nine unresolved patterns each receive two materially different candidates,
for 18 review rows in total.

The onset blends `fr`, `tr` and `tw` were resynthesized with Leda:

- A uses a short American STRUT vowel `/ʌ/`.
- B uses an alternative central-vowel treatment for `fr` and `tw`.
- B for `tr` uses the natural affricated American onset `[tʃɹ]`.

The ending clusters `ct`, `ft`, `lp`, `nd`, `pt` and `xt` reuse the same Leda
source syllables but apply stronger suppression than V14:

- A uses a 340 ms exponential fade for an almost inaudible support vowel.
- B uses a 270 ms exponential fade plus low-frequency reduction to suppress
  voiced vowel energy while retaining consonant definition.

## Review

The listening form is:

`outputs/019fa860-9b95-77b1-9e50-ff7ce1c92ea3/production-review-remaining/2026-07-29-v15-targeted-redos/TARGETED_CONSONANT_ALTERNATIVES_V15_REVIEW.html`

Review both versions of every pattern. Either, both or neither candidate may be
approved. The form persists ratings and exports
`targeted-consonant-alternatives-v15-review.csv`.

No V15 candidate is installed until that exported review is reconciled.

## Evidence

- `v14-review-decisions.json`
- `targeted-consonant-alternatives-v15-manifest.json`
- `targeted-consonant-alternatives-v15-review-blank.csv`
- `audio/` — 18 distinct mono 24 kHz MP3 files
- generator: `tools/generateTargetedClusterAlternatives.mjs`

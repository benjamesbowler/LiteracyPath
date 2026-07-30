# Reviewed Leda atomic phonemes V21 — 2026-07-29

## Review outcome

The two completed V20 reviews were reconciled before any production file was
changed.

The two-remake review contained:

- `ou` — **Yes**;
- `it` — **No**, because the manual cut removed the final `/t/`.

The 43-sound same-Leda review contained:

- 24 **Yes**;
- 9 **Needs edit**;
- 10 **No**.

The 24 approved sounds were `c`, `d`, `f`, `g`, `h`, `i`, `k`, `l`, `m`, `n`,
`p`, `q`, `u`, `v`, `w`, `x`, `all`, `ang`, `ck`, `ff`, `ing`, `qu`, `ung`
and `wh`.

## Installed audio

Only clips rated **Yes** were installed.

- Approved letter sounds now replace their corresponding files in
  `public/audio/phonemes/`.
- The same approved clips also replace the existing clean-human fallback files
  for consonants and short vowels.
- Approved `ck`, `ff`, `qu` and `wh` clips also replace their clean-human
  digraph fallback files.
- `all`, `ang`, `ing` and `ung` are installed in the primary phoneme bank,
  where those runtime files exist.
- The approved `ou — as in out` repair is installed in the reviewed production
  pattern bank and registered as `lp_repair_8bbcb0d3ea`.

The installer verifies the review decision and source checksum before each copy,
then verifies the installed checksum. It installed 25 approved source clips to
45 live files.

No **Maybe**, **Needs edit**, or **No** clip was installed.

## Remaining review batch

Twenty unresolved sounds received targeted V21 replacements:

- `it` keeps the complete naturally spoken word so the final `/t/` is not cut;
- short A, E and O are cut from `Africa`, `elephant` and `octopus`;
- pure `s`, `ss`, `th`, `z` and `zz` sounds are cut from `snake`, `hiss`,
  `thin`, `zebra` and `buzz`;
- `ll`, `ng`, and `nk` are taken from the endings of `dull`, `sing`, and
  `sink`;
- `ong` is taken from the natural ending of `song`;
- the remaining Needs-edit consonants use plain-text Leda cues instead of the
  previous direct-IPA route.

All 20 review files are mono 24 kHz MP3s. They are independently hashed,
peak-safe, and average-level checked. Nineteen sit within 0.2 dB of one another;
the very short unvoiced `s` candidate is 0.6 dB below the bank median.

The human-ear form is:

`outputs/019fa860-9b95-77b1-9e50-ff7ce1c92ea3/production-review-remaining/2026-07-29-v21-targeted-atomic-redos/TARGETED_ATOMIC_REDOS_V21_REVIEW.html`

It contains only the 20 unresolved sounds and provides persistent Yes, Maybe,
Needs edit, and No ratings, notes, filtering, sequential playback, and CSV
export. No V21 candidate is eligible for installation until this review is
returned.

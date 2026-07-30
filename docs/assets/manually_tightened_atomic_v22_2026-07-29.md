# Manually tightened atomic phonemes V22 — 2026-07-29

## V21 review outcome

The 20-row V21 human-ear review contained:

- 6 **Yes**;
- 11 **Needs edit**;
- 3 **No**.

The approved clips were `it`, short O, S, LL, Z and `ong`.

The rejected SS clip had the same `/s/` target as the approved S clip. The
approved snake-source S recording therefore replaces both `s` and `ss`; the
rejected hiss-source recording is not used.

## Installed audio

Only reviewed **Yes** sources were installed.

- `it` replaces its exact-context production pattern clip.
- short O replaces the primary phoneme file and clean-human vowel fallback.
- the approved S source replaces primary and fallback files for both `s` and
  `ss`.
- LL and Z replace their primary and clean-human fallback files.
- `ong` replaces its primary phoneme file.

Six approved source clips resolved seven sound keys and produced 12 installed
runtime files. The installer verifies the review decision, source checksum and
installed checksum before reporting success.

No V21 Needs-edit or No clip was installed.

## V22 editing method

Thirteen sounds remained unresolved.

The V22 pass uses visible sound boundaries and physical cuts:

- A from `Africa` stops before `/f/`;
- E from `elephant` stops before `/l/`;
- unvoiced TH from `thin` stops before the vowel;
- NK from `sink` begins after the vowel;
- ZZ from `buzz` begins after the vowel;
- NG uses a new Leda source word, `long`, and retains only its sustained final
  `/ŋ/`;
- B, J, R, T, Y, CH and SH reuse the same Leda takes but remove stretched
  support-vowel tails.

The final spectrogram check shows each selected sound as an isolated block with
the rejected neighbouring energy outside the edit boundary.

All 13 candidates are mono 24 kHz MP3s, independently hashed, peak-safe and
average-level matched within 0.1 dB.

## Human review

The clean review form is:

`outputs/019fa860-9b95-77b1-9e50-ff7ce1c92ea3/production-review-remaining/2026-07-29-v22-manually-tightened-atomic/MANUALLY_TIGHTENED_ATOMIC_V22_REVIEW.html`

It contains only the 13 unresolved sounds. It provides persistent Yes, Maybe,
Needs edit and No ratings, notes, filtering, sequential playback and CSV
export. No V22 clip is installed before the returned human-ear review.

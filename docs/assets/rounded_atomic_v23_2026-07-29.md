# Rounded atomic phonemes V23 — 2026-07-29

## V22 review outcome

The 13-row V22 human-ear review contained:

- 4 **Yes**;
- 4 **Needs edit**;
- 5 **No**.

The approved sounds were short A, NG, T and Y. Those four approved source clips
were installed to eight live runtime files: each primary phoneme file and its
existing clean-human fallback.

No Needs-edit or No V22 clip was installed.

## Nine remaining sounds

The V22 notes identified two different failure modes:

1. Some cuts still contained a neighbouring sound.
2. Other cuts ended so abruptly that the correct sound resembled a glitch.

V23 changes method accordingly:

- E is a new natural Leda “eh” take instead of another `elephant` cut.
- NK comes from a new `uhnk` source with the opening vowel removed.
- B comes from `but`, with the final T removed.
- J comes from `just`, cut before S/T.
- pure TH and ZZ are physically time-expanded from clean source-only segments,
  so they last longer without adding a vowel.
- R, CH and SH retain more of their natural support-vowel tail and use longer
  rounded fades instead of hard endings.

All nine clips are mono 24 kHz MP3s, independently hashed and peak-safe. Eight
are within 0.2 dB of one another; the extended unvoiced ZZ clip is 0.4 dB below
the bank median.

## Human review

The clean review form is:

`outputs/019fa860-9b95-77b1-9e50-ff7ce1c92ea3/production-review-remaining/2026-07-29-v23-rounded-atomic/ROUNDED_ATOMIC_V23_REVIEW.html`

It contains only the nine unresolved sounds and opens with no pre-filled
ratings. No V23 clip is installed before the returned human-ear review.

## Final review and installation outcome

The returned V23 review contained:

- 1 **Yes**: R;
- 4 **Needs edit**: B, J, CH and SH;
- 4 **No**: short E, NK, TH and ZZ.

Only the approved R source was installed. Its checksum was verified before and
after copying it to the canonical phoneme bank.

At the owner's direction, the eight unresolved runtime files were then
physically deleted instead of retained as fallbacks. They remain silent until a
new recording passes human review.

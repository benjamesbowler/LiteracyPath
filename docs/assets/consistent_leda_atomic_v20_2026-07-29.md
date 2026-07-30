# Consistent Leda atomic phoneme review V20 — 2026-07-29

## Outcome

The 49-row V18 full-bank review was reconciled without overwriting any unapproved
production audio:

- 26 clips rated **Yes** remain approved and unchanged.
- 21 clips rated **Needs edit** remain preserved for targeted refinement.
- the two clips rated **No** received full Leda remakes:
  - `it` is synthesized as the natural word “it”;
  - `ou` is synthesized from “how”, then the opening `/h/` samples are physically
    removed at the measured spectrogram boundary.

A separate same-voice review now covers all 43 files in the app's primary legacy
phoneme bank:

- 26 A–Z sounds, including `ah`, `buh`, `kuh`, `duh`, `eh`, `fuh`, `guh`, `huh`;
- 17 additional legacy human recordings such as `ch`, `sh`, `th`, `ng`, `qu`,
  `ff`, `ll`, `wh`, and the `-ng` families.

## Short-vowel method

The previous isolated-Leda vowel trials failed human review. V20 does not repeat
that method. The five short vowels are taken from naturally spoken Leda anchor
words and cut at measured spectral boundaries:

| Sound | Anchor source | Target |
| --- | --- | --- |
| short A | `apple` | `/æ/` |
| short E | `egg` | `/ɛ/` |
| short I | `igloo` | `/ɪ/` |
| short O | `on` | `/ɑ/` |
| short U | `up` | `/ʌ/` |

`x` is similarly cut from the end of “box” to retain `/ks/` without a spoken
letter name.

## Level and file checks

All 45 new review MP3s (43 legacy replacements plus two V18 remakes) are:

- mono MP3 at 24 kHz;
- non-empty and independently hashed;
- average-level matched within 0.2 dB across the bank;
- peak-safe, with no clip exceeding the configured ceiling.

Average level is used for the final consistency gate because EBU integrated LUFS
is unstable for sub-half-second isolated phonemes. LUFS and true peak are still
recorded in the manifest as secondary measurements.

## Human review gate

Nothing in `public/audio/phonemes/` or the approved production pattern bank was
replaced in this pass. Approval remains an explicit human-ear gate.

Review files:

- `outputs/019fa860-9b95-77b1-9e50-ff7ce1c92ea3/production-review-remaining/2026-07-29-v20-consistent-leda-atomic/CONSISTENT_LEDA_ATOMIC_V20_REVIEW.html`
- `outputs/019fa860-9b95-77b1-9e50-ff7ce1c92ea3/production-review-remaining/2026-07-29-v20-consistent-leda-atomic/V18_TWO_REMAKES_REVIEW.html`

Both forms provide persistent Yes / Maybe / Needs edit / No ratings, optional
notes, filtering, sequential playback, and CSV export.

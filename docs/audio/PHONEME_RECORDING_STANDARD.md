# Phoneme recording standard

LiteracyPath uses original human recordings for instructional sound-only cues.
Synthetic voices, browser speech, and recordings copied, trimmed or transformed
from another publisher are not acceptable sources for this bank.

## Production path

1. Contract one adult performer with phonics-teaching expertise and a neutral US
   English voice. Obtain written performer consent and commercial-use rights for
   the recordings before production use.
2. Run `npm run prepare:phoneme-recording`. The generated pack is placed in the
   ignored `.artifacts/phoneme-recording` directory and is not part of product
   documentation or runtime authority.
3. Record every take as an individual lossless file. Anchor words guide the
   performer but are not spoken. Stop sounds stay short; continuous sounds may
   be held naturally; consonants do not receive a trailing schwa.
4. Complete `rights.json`, place the takes in a private incoming directory and
   run `npm run check:phoneme-recording -- --input /absolute/path/to/incoming`.
5. A phonics specialist listens to every take in context and records the outcome
   in the generated technical review. Automated checks cannot approve
   pronunciation, accent suitability, word contamination or teaching quality.
6. Only reviewed, rights-cleared masters may be normalized and installed into
   the public audio bank. Installation is intentionally separate from this
   intake tool so a recording cannot become live merely by passing file checks.

## Acceptance rules

- The file contains the requested isolated sound and no spoken letter name,
  anchor word, instruction or room noise that distracts from it.
- Stops such as /b/, /d/, /k/, /p/ and /t/ have no audible trailing vowel.
- Continuous sounds are steady and not unnaturally stretched.
- Alternative values are separate takes. In particular, voiced and unvoiced
  `th`, both common long-u values, and both values taught for `ew` must not be
  collapsed into one ambiguous recording.
- The same performer, microphone position and recording space are used across
  the set. Processing must not introduce clipping, pumping or metallic noise.
- The performer release identifies the owner and permits commercial use in the
  app. The signed release is retained privately, not under `public/`.

The Read Naturally phonics page may be consulted by a teacher as a pronunciation
reference. Its audio files are not source assets: they must not be downloaded
into this repository, edited into new clips, redistributed, or supplied to a
voice-generation system.

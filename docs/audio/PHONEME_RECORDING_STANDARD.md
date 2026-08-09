# Phoneme recording standard

LiteracyPath uses reviewed, rights-cleared recordings for instructional
sound-only cues. A controlled AI-generated candidate may be considered when it
passes the same phonics review as a recording and is disclosed as AI-generated.
Browser speech and recordings copied, trimmed or transformed from another
publisher are not acceptable sources for this bank.

## Controlled AI candidate path

Create an ignored local Python environment once with Python 3.12, then install
`tools/phoneme-kokoro-requirements.txt` into it at
`.artifacts/kokoro-venv`. Model weights and generated audio remain outside Git.

1. Run `npm run pilot:phoneme-kokoro` to generate multiple lossless candidates
   for representative difficult sounds with the Apache-licensed Kokoro model.
   The local pipeline generates an original anchor word from phoneme tokens,
   uses the model's predicted phone timings to isolate the requested sound and
   never reads a letter name. `npm run pilot:phoneme-ai` remains an optional
   native-audio ensemble route when API credits are available.
2. Each candidate is normalized consistently and checked for duration and
   format. `npm run review:phoneme-kokoro` runs the optional independent
   Wav2Vec2 phoneme recognizer over the full anchor and isolated clip to rank or
   reject obvious failures. Recognition of a very short isolated consonant is
   advisory, not an approval signal.
3. Generated review pages are placed under the ignored `.artifacts` directory.
   Automated checks never install audio or declare a candidate production-ready.
4. Listen to the shortlist in context. A candidate is accepted only when the
   isolated sound is unambiguous for the curriculum value. Keep the model,
   voice, prompt and review result with the selected master.
5. Before release, add a clear grown-up-facing disclosure that the applicable
   instructional voice cues are AI-generated.

For phonemes that remain unstable, generate several original candidates with a
phoneme-native or explicit IPA/SSML engine. Do not fall back to scraping or
cutting recordings from the open web: availability is not a licence, and
coarticulation makes arbitrary word cuts poor isolated teaching sounds.

## Production path

1. Contract one adult performer with phonics-teaching expertise and a neutral US
  English voice when the controlled AI route does not produce an acceptable
  candidate. Obtain written performer consent and commercial-use rights for the
  recordings before production use.
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

If a Sound Seekers cue is missing in future, run `npm run
prepare:missing-phoneme-recording`. This creates a focused pack for only the
cues listed by the runtime's `NEEDS_AUDIO` authority. The list is currently
empty: the reviewed Leda `/ʊ/` cue as in `book` and natural `/aʊ/` interjection
as in `cow` completed the final two gaps. Check any future returned files with
`npm run check:missing-phoneme-recording -- --input
/absolute/path/to/incoming`. The focused command still requires completed rights
metadata and human phonics review.

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

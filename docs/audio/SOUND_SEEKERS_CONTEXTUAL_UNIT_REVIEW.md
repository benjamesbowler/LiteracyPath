# Sound Seekers contextual unit review

This is a direct human-release gate. Five contextual sound keys cover 21
explicit pronunciation records and remain unavailable from the public phoneme
bank until a phonics specialist selects a reviewed, rights-cleared master.

| Key | IPA | ARPABET | Word anchors | Candidate method |
| --- | --- | --- | --- | --- |
| `schwa` | /ə/ | AH0 | a, again, amuse, complete, different, giant, listen, manure, obscure, the | Google Chirp3 HD Leda explicit IPA/SSML, three rate/pitch variants. |
| `ear_lax` | /ɪr/ | IH R | clear, dear, fear, near, year | Google Chirp3 HD Leda explicit IPA/SSML, three rate/pitch variants. |
| `ed_id` | /ɪd/ | IH D | landed, wanted | Google Chirp3 HD Leda explicit IPA/SSML, three rate/pitch variants. |
| `ure_no_y` | /ʊr/ | UH R | manure, sure | Google Chirp3 HD Leda explicit IPA/SSML, three rate/pitch variants. |
| `once_onset` | /w/ | W | one, once | Google Chirp3 HD Leda explicit IPA/SSML, three rate/pitch variants. |

Run `node tools/generateSoundSeekersContextualUnitAudio.mjs` to create the
ignored `.artifacts/sound-seekers-contextual-unit-candidates` review pack. It
writes 15 unapproved local candidate clips and a listening page; it never
creates public audio, changes an audio manifest, clears a blocker, or claims
approval. Use the
explicit IPA/SSML route permitted by
[`PHONEME_RECORDING_STANDARD.md`](PHONEME_RECORDING_STANDARD.md) to render
multiple original candidates from the plan. The preferred Kokoro route was
attempted but its `espeakng-loader` wheel requested an inaccessible build-time
data path, so the current pack uses this explicit IPA/SSML fallback. Preserve
model, voice, SSML/IPA input, rate, pitch, and technical checks with each
candidate.

A reviewer must listen in isolation and in the intended learning context. They
must reject a spoken letter name, whole anchor word, trailing vowel on a stop,
coarticulation that changes the target, unclear isolation, wrong contextual
value, unsuitable accent, clipping, or distracting noise. Automated duration,
format, signal, or recognizer results are only triage and do not approve a
recording.

Before a later authorized installation, retain performer/model provenance and
commercial-use rights, record the phonics reviewer’s decision, add the required
grown-up-facing disclosure for AI-generated instructional cues, and update the
public bank only with the selected reviewed master. Until then the five keys
remain fail-closed and the 21 release blockers are intentional.

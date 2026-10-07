# Sound Seekers contextual unit review

The 7 October listening review resolved the five contextual sound keys across
22 explicit pronunciation units. The product owner accepted the exact normalized
standard takes for `schwa`, `ear_lax`, `ed_id` and `ure_no_y`. All three generated
`once_onset` candidates were rejected for speaking the letter name “double-u”.
That onset now reuses the existing approved `/audio/phonemes/w.mp3` without
modification: the first sound in one/once is the same /w/ as the atomic cue.

The selected-master hashes, original synthesis input, voice/model, normalization,
review outcome, rights reference and rejected candidate hashes are retained in
[`contextual-source.json`](../../public/audio/phonemes/reviewed/contextual-source.json).
The grown-up disclosure is available at `/legal.html#learning-audio`. Unreviewed
future candidates still require the current recording-standard listening gate.

| Key | IPA | ARPABET | Word anchors | Candidate method |
| --- | --- | --- | --- | --- |
| `schwa` | /ə/ | AH0 | a, again, amuse, complete, different, giant, listen, manure, obscure, the, umbrella | Google Chirp3 HD Leda explicit IPA/SSML, three rate/pitch variants. |
| `ear_lax` | /ɪr/ | IH R | clear, dear, fear, near, year | Google Chirp3 HD Leda explicit IPA/SSML, three rate/pitch variants. |
| `ed_id` | /ɪd/ | IH D | landed, wanted | Google Chirp3 HD Leda explicit IPA/SSML, three rate/pitch variants. |
| `ure_no_y` | /ʊr/ | UH R | manure, sure | Google Chirp3 HD Leda explicit IPA/SSML, three rate/pitch variants. |
| `once_onset` | /w/ | W | one, once | Unchanged approved atomic /w/ recording; generated letter-name takes rejected. |

The retained `node tools/generateSoundSeekersContextualUnitAudio.mjs` created an
ignored `.artifacts/sound-seekers-contextual-unit-candidates` review pack. It
generated 15 unapproved local candidate clips and a listening page; it never
creates public audio, changes an audio manifest, clears a blocker, or claims
approval. With no remaining blockers it exits without generating or spending.
For a future reviewed pack, use the
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

For any future installation, retain performer/model provenance and commercial-use
rights, record the human reviewer’s decision, add the grown-up-facing disclosure
for AI-generated instructional cues, and update the public bank only with the
selected reviewed master. A rejected take cannot become live through a file or
signal check. The current five keys resolve through the approved bank and the
pronunciation corpus has no remaining audio blockers.

# Kimi Audio Request — Learn Area & Game Arcade (replace all browser TTS)

Audit date: 2026-06-10. Scope: Phonics Learn flow (`src/components/learn/phonics/**`) and Game Arcade (`src/components/learn/games/**`).

All audio must be a **clean, neutral, natural human voice matching the existing `clean-human` library** (same voice/character as `public/audio/child-mode/clean-human/**` — listen to `phrases/great-job.mp3` and `graphemes/consonants/b.mp3` for the reference voice and pacing). Browser TTS, robotic delivery, odd intonation, clipped endings, and spelled-out letters are not acceptable. Child-friendly phonics-teacher pacing.

**Technical spec:** MP3, mono, 44.1 kHz, normalized ≈ −16 LUFS, leading/trailing silence trimmed to < 80 ms, no fade-out clipping of final consonants. Deliver in the folder structure given in the Filename column.

## Why each item is needed (audit findings)

1. `public/phonics/audio/letters/` is **empty** — every letter-name button in the Trace the Letter step (`StepTracer` → `letterNameAudio: /phonics/audio/letters/<l>-name.mp3`) falls back to robotic browser TTS for **all 26 letters**.
2. `clean-human/graphemes/consonants/` is missing **k, q, x** (and `PHONIC_AUDIO_BY_LETTER` in `src/data/phonicsLessons.js` has no K/Q/X entries) — those letter-sound buttons speak via TTS.
3. Game Arcade word audio resolver covers 117/121 game words; **clock, men, stamp** have no MP3 anywhere ("shirt" exists and is a code fix, see appendix).
4. Game Arcade **sentences are always TTS** — `speak(sentence)` in Word Hopscotch / Reading Race has no MP3 path at all (8 sentences + replay button).
5. Two Learn-flow prompts are hardcoded TTS-only: `playCue("", "Watch the magic! Change one sound!")` and `playCue("", "Learn 6 letters first!")`.
6. Game instruction lines are currently silent text; recording them lets every game open with spoken instructions (and supports pre-readers, which is the entire audience).

## Request table

| # | Area | Required audio text (speak exactly) | Filename required | Pronunciation notes | Priority |
|---|---|---|---|---|---|
| 1–26 | Learn / Trace step | The letter NAME, one file per letter: "A", "B", "C" … "Z" | `phonics/audio/letters/a-name.mp3` … `z-name.mp3` | Letter names, not sounds ("double-u" for W, "zee" for Z — match existing US-English library). Bright, friendly, one word only. | high |
| 27 | Learn / letter sounds | The /k/ sound | `audio/child-mode/clean-human/graphemes/consonants/k.mp3` | Pure phoneme "k" (unvoiced stop), NO added vowel ("k", not "kuh"). Match length/energy of existing `t.mp3`. | high |
| 28 | Learn / letter sounds | The /kw/ sound for Q | `audio/child-mode/clean-human/graphemes/consonants/q.mp3` | "kw" as in "queen" onset. No added vowel. | high |
| 29 | Learn / letter sounds | The /ks/ sound for X | `audio/child-mode/clean-human/graphemes/consonants/x.mp3` | "ks" as in "fox" ending. No added vowel. | high |
| 30 | Games / words | "clock" | `audio/child-mode/clean-human/words/clock.mp3` | Whole word, natural. | high |
| 31 | Games / words | "men" | `audio/child-mode/clean-human/words/men.mp3` | Whole word, natural. | high |
| 32 | Games / words | "stamp" | `audio/child-mode/clean-human/words/stamp.mp3` | Whole word; final /mp/ fully audible. | high |
| 33 | Games / sentences | "The cat sat on the mat." | `audio/learn-games/sentences/the-cat-sat-on-the-mat.mp3` | Natural read-aloud pace, slight emphasis on content words. | high |
| 34 | Games / sentences | "I see a big dog." | `audio/learn-games/sentences/i-see-a-big-dog.mp3` | Same style. | high |
| 35 | Games / sentences | "We can run and play." | `audio/learn-games/sentences/we-can-run-and-play.mp3` | Same style. | high |
| 36 | Games / sentences | "The little bird can fly." | `audio/learn-games/sentences/the-little-bird-can-fly.mp3` | Same style. | high |
| 37 | Games / sentences | "She has a red hat." | `audio/learn-games/sentences/she-has-a-red-hat.mp3` | Same style. | high |
| 38 | Games / sentences | "They went to the park." | `audio/learn-games/sentences/they-went-to-the-park.mp3` | Same style. | high |
| 39 | Games / sentences | "The children played happily outside." | `audio/learn-games/sentences/the-children-played-happily-outside.mp3` | Same style. | high |
| 40 | Games / sentences | "Which book would you like to read?" | `audio/learn-games/sentences/which-book-would-you-like-to-read.mp3` | Rising question intonation. | high |
| 41 | Learn / CVC Word Magic | "Watch the magic! Change one sound!" | `audio/child-mode/phrases/watch-the-magic.mp3` | Playful, energetic — matches `you-found-it.mp3` energy. | high |
| 42 | Learn / locked island | "Learn six letters first!" | `audio/child-mode/phrases/learn-six-letters-first.mp3` | Encouraging, not scolding. (Text says "6"; speak "six".) | medium |
| 43 | Games / instructions | "Build the word you hear." | `audio/learn-games/instructions/build-the-word-you-hear.mp3` | Calm instruction voice (matches `listen-and-find.mp3`). | medium |
| 44 | Games / instructions | "Touch each sound, then blend the word." | `audio/learn-games/instructions/touch-each-sound-then-blend-the-word.mp3` | Same style. | medium |
| 45 | Games / instructions | "Load the train in sound order." | `audio/learn-games/instructions/load-the-train-in-sound-order.mp3` | Same style. | medium |
| 46 | Games / instructions | "Find the matching sight words." | `audio/learn-games/instructions/find-the-matching-sight-words.mp3` | Same style. | medium |
| 47 | Games / instructions | "Find the rhyming words." | `audio/learn-games/instructions/find-the-rhyming-words.mp3` | Same style. | medium |
| 48 | Games / instructions | "Pick a beginning sound to build each word family." | `audio/learn-games/instructions/pick-a-beginning-sound.mp3` | Same style. | medium |
| 49 | Games / instructions | "Listen, then tap the matching word." | `audio/learn-games/instructions/listen-then-tap-the-matching-word.mp3` | Same style. | medium |
| 50 | Games / instructions | "Hop on the next word in the sentence." | `audio/learn-games/instructions/hop-on-the-next-word.mp3` | Same style. | medium |
| 51 | Games / instructions | "Read the sentence and choose the focus word." | `audio/learn-games/instructions/read-the-sentence-and-choose.mp3` | Same style. | medium |
| 52 | Learn / Trace step (new demo) | "Watch me first." | `audio/child-mode/phrases/watch-me-first.mp3` | For the upcoming stroke-order demo. | medium |
| 53 | Learn / Trace step (new demo) | "Now you try!" | `audio/child-mode/phrases/now-you-try.mp3` | Upbeat. | medium |
| 54 | Learn / Trace step (new demo) | "Start at the top." | `audio/child-mode/phrases/start-at-the-top.mp3` | Calm guidance. | medium |

Total: 54 files. Items 1–42 remove every currently audible TTS occurrence; 43–54 complete spoken support for pre-readers and the planned tracer demo.

**Reuse note (do NOT re-record):** great-job, try-again, you-found-it, well-done, amazing-work, listen-carefully, excellent-listening already exist in `audio/child-mode/phrases/` and `clean-human/phrases/` and stay as-is. Short-vowel phonemes `short_a`–`short_u` already exist in `clean-human/graphemes/short_vowels/` — the robotic vowel sound children currently hear is a code bug (see appendix), not missing audio.

---

## Appendix — code fixes required when importing (for Codex, not Kimi)

1. **Vowel phonemes**: `getLetterSoundCue` (`src/components/learn/phonics/cvc/cvcHelpers.js`) returns `generated:phoneme:short_*` (synthesized sawtooth) even though real recordings exist at `clean-human/graphemes/short_vowels/short_*.mp3`; and `speakPhoneme` in `src/utils/learnGamesAudio.js` skips `generated:` sources and speaks "ah" via TTS. Point both at the real MP3 files; keep the synth only as offline fallback.
2. **`speakWord` candidate paths** (`src/utils/learnGamesAudio.js`): add `/audio/child-mode/clean-human/phrases/<slug>.mp3` to the candidate list (fixes "shirt" and ~40 other words that exist only there), and add the new `/audio/learn-games/sentences/` + `/instructions/` resolution for `speak(sentence)` before any TTS fallback.
3. Wire `letterNameAudio` and K/Q/X `phonicAudio` automatically once files land (paths already point at the right filenames — verify with `npm run check:phonics-learn-media`).
4. Replace the two `playCue("", …)` calls with the new phrase files (keep current text as `fallbackText`).
5. After import: run `npm run check:assessment-prompt-audio-quality` and add the new folders to whatever audio-size/quality manifest checks apply (`check:media-quality`).

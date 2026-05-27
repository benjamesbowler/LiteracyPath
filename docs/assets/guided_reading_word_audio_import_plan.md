# Guided Reading Word Audio Import Plan

Generated: 2026-05-27T10:50:16.097Z

## Goal

Replace inconsistent word-by-word Guided Reading audio with one deduped, consistent neutral soft light female voice set.

## Destination

- Copy generated word audio files to `public/guided-reading/audio/words/`.
- Each file should use the slug from `docs/assets/guided_reading_unique_word_audio_inventory.json`.
- Example: `public/guided-reading/audio/words/apple.mp3`.

## Resolver Plan

- Add a Guided Reading word-audio resolver that normalizes clicked words the same way as the inventory generator.
- Resolve word-click audio from `/guided-reading/audio/words/{slug}.mp3`.
- Do not change page narration or full-book narration paths.
- Do not reuse page/full-book narration for word clicks.
- Keep page/full-book narration replacement separate from word-level audio replacement.

## Fallback Behavior

- If a word audio file is missing, do not crash the reader.
- Optionally use browser speech synthesis only as a temporary fallback while showing no per-word speaker icons.
- Log missing word audio in development/admin validation.

## Validation

- Suggested future validator: `tools/checkGuidedReadingWordAudioCoverage.js`.
- It should scan all Guided Reading book page text.
- It should normalize and slug every clickable word.
- It should verify `public/guided-reading/audio/words/{slug}.mp3` exists for every unique word.
- It should report missing word audio by word, occurrence count, and books used in.
- It should flag contractions, hyphenated words, numbers, character names, and unusual terms for human pronunciation review.

## Import Steps Later

1. Receive Kimi-generated MP3s.
2. Copy them into `public/guided-reading/audio/words/`.
3. Run the future coverage validator.
4. Spot-check flagged words.
5. Only then wire the reader to prefer the new word-audio folder.

## Do Not Do During Import

- Do not alter book text.
- Do not overwrite page narration.
- Do not overwrite full-book narration.
- Do not generate duplicate files for repeated words.
- Do not mix voices within the word-level set.

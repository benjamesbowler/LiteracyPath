# Kimi Audio Request — re-record 3 short words (gold voice, whole words)

Every existing recording of **am**, **ax** and **of** in the app is defective:
they were generated as SEGMENTED sound-it-out clips ("a … m") instead of the
whole word, or say only the first sound. Verified by ear on 2026-07-04.

The app currently BLOCKS these three words from voice-led rounds
(`src/data/knownBadWordAudio.js`) so nothing wrong plays. Importing these
recordings and deleting the blocklist entries restores them everywhere.

**Attach these reference clips so the voice matches exactly:**
- `public/audio/child-mode/clean-human/words/at.mp3` (known good)
- `public/audio/child-mode/clean-human/words/in.mp3` (known good)

**Rules (non-negotiable):**

> - Same warm female **gold narrator** as the reference clips.
> - Say each word ONCE, as a single natural whole word — NOT sounded out,
>   NOT spelled, no letter names, no pauses inside the word.
> - "am" rhymes with "ham". "ax" rhymes with "tax". "of" sounds like "uv"
>   (the normal English word, as in "a cup of tea").
> - Clean-room quality, no music, no effects, ~1 second including silence,
>   MP3, same loudness as the reference clips.

## Files to deliver (3 recordings, copied to every path below)

`am.mp3` — one recording, saved to each of:
- `public/audio/child-mode/clean-human/words/am.mp3`
- `public/audio/child-mode/words/am.mp3`
- `public/audio/child-mode/clean-human/hfw/am.mp3`
- `public/guided-reading/audio/words/am.mp3`

`ax.mp3` — one recording, saved to each of:
- `public/audio/child-mode/clean-human/words/ax.mp3`
- `public/audio/child-mode/words/ax.mp3`

`of.mp3` — one recording, saved to each of:
- `public/audio/child-mode/clean-human/words/of.mp3`
- `public/audio/child-mode/words/of.mp3`
- `public/audio/child-mode/clean-human/hfw/of.mp3`
- `public/audio/child-mode/hfw/of.mp3`
- `public/guided-reading/audio/words/of.mp3`

(`public/media/initial-sounds/audio/a/ax.mp3` is an assessment INITIAL-SOUND
clip — it is meant to say only /a/? No: verify separately in the media QA
pipeline before touching it; it is NOT part of this request.)

## After import
1. Listen-check each file (`docs/previews/audio_word_chooser.html`).
2. Delete `"am"`, `"ax"`, `"of"` from `src/data/knownBadWordAudio.js`.
3. Run the final gate; the quest and games pick the words up automatically.

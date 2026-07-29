# Media production request — Skills assessments v3

Generated 2026-07-29T22:19:55.007Z by `tools/assessmentRebuild/gate.mjs`. Regenerate after any bank change — never edit by hand. Machine-readable copy: `MEDIA_REQUEST.json`.

## What is needed (spec for Codex)

1. **Audio for everything.** Recorded human audio (or approved premium TTS), child-friendly voice, natural full sentences, no isolated phonemes, no robotic notation:
   - **Instruction/prompt audio** for every item (`spokenPrompt`) — including instructions, 472 unique lines.
   - **Sentence audio** (0 lines) and **passage read-aloud** (527 passages).
   - **Word audio** for every choice/target word: 306 unique words.
   - File convention: follow `public/audio/child-mode/` existing layout; wire via `audioPreferenceManifest`.
2. **Images for everything.** 81 unique word/scene slots; 0 have NO existing asset (listed in the JSON with alt text). House style: flat, warm, no embedded text, answer-neutral (an image must never reveal the answer of the item it appears in — see docs/skills-assessment-rebuild/AUTHORING_STANDARDS.md).
3. **Delivery.** Land assets under `public/`, register them (media registry / audio manifest), then run `npm run check:audit:assessment-rebuild -- --write` — items tagged `mediaTier: "audio-required"` unlock automatically once their audio resolves.

## Per-skill volume

| Skill | Items | Instruction lines | Word recordings | Image slots | Missing images |
|---|---|---|---|---|---|
| cause_effect | 64 | 64 | 0 | 0 | 0 |
| context_clues | 64 | 64 | 64 | 0 | 0 |
| digraphs | 60 | 60 | 276 | 132 | 0 |
| inference | 64 | 64 | 34 | 0 | 0 |
| key_details | 71 | 71 | 48 | 0 | 0 |
| long_vowels_silent_e | 68 | 68 | 188 | 28 | 0 |
| main_idea | 64 | 64 | 0 | 0 | 0 |
| sentence_comprehension | 72 | 72 | 15 | 0 | 0 |
| sequencing | 64 | 64 | 1 | 0 | 0 |
| theme_higher_comprehension | 64 | 64 | 0 | 0 | 0 |

## Missing images (top of queue)


# Media production request — Skills assessments v3

Generated 2026-07-30T04:17:11.557Z by `tools/assessmentRebuild/gate.mjs`. Regenerate after any bank change — never edit by hand. Machine-readable copy: `MEDIA_REQUEST.json`.

## What is needed (spec for Codex)

1. **Audio for everything.** Recorded human audio (or approved premium TTS), child-friendly voice, natural full sentences, no isolated phonemes, no robotic notation:
   - **Instruction/prompt audio** for every item (`spokenPrompt`) — including instructions, 78 unique lines.
   - **Sentence audio** (30 lines) and **passage read-aloud** (0 passages).
   - **Word audio** for every choice/target word: 170 unique words.
   - File convention: follow `public/audio/child-mode/` existing layout; wire via `audioPreferenceManifest`.
2. **Images for everything.** 0 unique word/scene slots; 0 have NO existing asset (listed in the JSON with alt text). House style: flat, warm, no embedded text, answer-neutral (an image must never reveal the answer of the item it appears in — see docs/skills-assessment-rebuild/AUTHORING_STANDARDS.md).
3. **Delivery.** Land assets under `public/`, register them (media registry / audio manifest), then run `npm run check:audit:assessment-rebuild -- --write` — items tagged `mediaTier: "audio-required"` unlock automatically once their audio resolves.

## Per-skill volume

| Skill | Items | Instruction lines | Word recordings | Image slots | Missing images |
|---|---|---|---|---|---|
| prefixes_suffixes | 78 | 78 | 268 | 0 | 0 |

## Missing images (top of queue)


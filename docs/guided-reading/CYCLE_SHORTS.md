# Cycle Shorts

There is one Sunny Meadow Farm supported-reading passage per teaching cycle,
with three unscored, four-choice comprehension questions and exact sentence
evidence. Each of the 135 weekday Present decks ends with the same week's
complete story followed by its three questions. The story-specific picture and
complete passage remain visible with each question; the teacher reads the choices and deliberately reveals
answers/evidence after discussion. Rereading the same short across the week
is intentional. The added ending uses the existing reading block; actual
classroom duration remains unmeasured.

Children open **Books → Cycle Shorts**. Teachers open **Guided Reading → Cycle
Shorts**. The collection reuses the comprehension workspace, including exact
Leda narration, optional word marks, full-screen paging, student retry and
private teacher answer/evidence reveals. Existing assignment locks still hide
the child doorway. No independent book level, hosted result, score, stars or
mastery is assigned. These are supported reading resources rather than new
A–H catalogue books or synchronized class sessions.

`src/content/cycle-shorts/passages.js` owns the 27-week selection and new text.
Five existing passage/question sets are reused unchanged: `muddy-pot-lid`
(cycle 14), `muddy-tub-boats` (19), `muddy-ten-eggs` (20), `muddy-ring` (23) and
`muddy-mat` (25). Their existing story scenes are reused only with the same
complete text. Twenty-two new passages fill curriculum gaps; each has its own clean cartoon
three-panel comic showing the story’s events. Present shows the same picture
on the reading slide and all three question slides. Guided Reading uses the
same source-text-checked picture resolver, replacing the old character-only
portrait. Pictures provide supported ESL comprehension, not independent decoding
evidence. A failed image offers retry while the complete text remains available. All remain
in Sunny Meadow Farm; no Dino or Moonwood cast is introduced.

The first five stories have 15–24 words; later stories remain under 50 words.
Authored focus examples appear in their stories. Current and cumulative sight
words come from `elSkillsBlockCycles.js`. Bold/marked words show sound examples
and familiar sight words; sound examples can still need adult decoding help.
Present emphasis respects its Monday/Tuesday sound and Wednesday/Thursday
sight-word introduction schedule. Guided Reading uses the full week's words.
Support words and character names remain explicit. Neither emphasis nor a
cycle number promises complete independent decodability.

The exact titles, stories, question prompts and atomic answer clips use the
existing generator, with a separate output family to avoid changing the
172-passage comprehension bank or its audio provenance:

```sh
node tools/generateComprehensionLedaAudio.mjs --cycle-shorts --plan
node tools/generateComprehensionLedaAudio.mjs --cycle-shorts
node tools/generateComprehensionLedaAudio.mjs --cycle-shorts --check
node tools/checkComprehensionLedaAudio.mjs --cycle-shorts
node tools/generateAudioManifest.js
node --test tests/unit/cycleShorts.test.js
npx playwright test tests/release/cycle-shorts.spec.js --project=desktop
```

Generated signal and browser receipts live in ignored `.artifacts/cycle-shorts/`.
They do not establish human listening, physical-iPad or observed classroom use.
When a revised story receives a new narration path, the previous recording can
remain in `compatibilityClips` with its original text and byte hash for readers
using a cached lesson.

The existing Linux visual-baseline workflow has a `cycle-shorts` scope. It refreshes only the six Books baselines, then verifies Books, comprehension and the Cycle Shorts flow. It runs no database setup or hosted-data writes and does not claim the unrelated whole-product device matrix passed.

Visual-baseline runners and the shared CI browser job are pinned to Ubuntu 24.04. The November 2026 `ubuntu-latest` runner moved to 26.04, which the locked Playwright 1.60.0 dependency installer rejects before any tests run. The pin keeps native Linux capture on a supported runtime.

`tools/authoring/cycleShortPictures.mjs` owns exact scene panels and generation
prompts. `docs/content/cycle-short-images/provenance.json` records source and
accepted asset hashes, character reference, tool and actual visual inspection.
`tools/generateCycleShortPictures.mjs <sources.json>` encodes accepted built-in
image outputs and derives lean runtime metadata; `--check` decodes all 22 new
comics and rejects stale text, prompts, references or bytes. Existing reused
passages keep their comprehension picture provenance. New story pictures are
stored under `/images/comprehension/cycle-shorts/`.

Cycles 6, 7 and 24 retain their illustrated sequences after the November 11
wording revisions. The provenance file keeps the original generation text and
prompts, with a separate review of each revised story against its installed
image. `node tools/generateCycleShortPictures.mjs --sync-reviewed` verifies
those bindings and writes the current picture lookup from the existing files.

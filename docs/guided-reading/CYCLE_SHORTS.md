# Cycle Shorts

There is one Sunny Meadow Farm supported-reading passage per teaching cycle,
with three unscored, four-choice comprehension questions and exact sentence
evidence. Each of the 135 weekday Present decks ends with the same week's
complete story followed by its three questions. The passage remains visible
beside each question; the teacher reads the choices and deliberately reveals
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
complete text. Twenty-two new passages fill curriculum gaps; they show the
approved Muddy character portrait, explicitly as character identification,
without implying that a reused picture depicts an unshown event. All remain
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

The existing Linux visual-baseline workflow has a `cycle-shorts` scope. It refreshes only the six Books baselines, then verifies Books, comprehension and the Cycle Shorts flow. It runs no database setup or hosted-data writes and does not claim the unrelated whole-product device matrix passed.

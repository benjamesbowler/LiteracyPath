# Adventure Map distinct mechanics design

**Date:** 2026-09-02  
**Status:** Approved for implementation  
**Scope:** `src/components/elQuest/*`, Adventure Map practice progress, recorded Adventure Map instructions, and scoped Adventure Map tests/styles.

## Outcome

Adventure Map must stop presenting many labels over the same answer grid. Every child-facing station must have a truthful literacy purpose, a recognisably different play loop, specific corrective feedback, and a visible world reaction. The redesign keeps the exact teacher-assigned cycle, learner/session identity, map route, trusted-gesture audio start, and return flow stable.

The user explicitly approved resetting current Adventure Map progress. The redesign therefore starts a fresh Adventure Map practice record at schema version 2. It does not reset assessment, Guided Reading, Story Quest, Arcade, profile, session, teacher assignment, or the assigned cycle.

Adventure Map remains practice-and-play evidence. Nothing in this surface may set formal EL placement, mark a skill Secure, or claim oral-reading fluency from silent screen interaction.

## Current defects to remove

1. `letters`, `sounds`, `hunt`, `quick`, `play`, `poem`, `story`, and `chain` share the same single-choice renderer.
2. Letter Spot, Sound Hunt, Word Play, Poem, Story, Trace, Spell It, and the global builder can silently fall back to another mechanic while retaining the original station title.
3. Generic boolean answers produce generic feedback and cannot explain the selected contrast.
4. Cycle Check retries until correct, so final correct count is always total and the stored best score is misleading.
5. Sound Catch can present equivalent spellings such as `f` and `ff` as if only one were correct.
6. Sound Hunt captions allow print matching instead of listening to picture names.
7. Poem and story answer choices can reveal or detach the answer from the text being practised.
8. Word Build and Word Play operate on JavaScript characters rather than taught graphemes.
9. Word Chains prints the target word in the prompt.
10. Speedy Words displays the answer and uses a timer that does not produce defensible fluency evidence.
11. Spell It is the same mechanic as Word Build and can degrade into copying.
12. Untracked transition timers may advance after Stop.

## Product invariants

- Teacher `lockedCycleId`, `initialCycleId`, and `initialStationId` continue to resolve through the existing Adventure Map route.
- The assigned cycle is never changed by a mechanic.
- Every printed decoding or encoding target remains within taught print through that cycle. The EL high-frequency-word sequence remains a separate authorised strand.
- All required controls meet the existing 56px target rule and work with touch, pointer, and keyboard.
- No required action is drag-only. Spatial placement also has tap/select/place and keyboard activation paths.
- The complete round view fits 1024×694 and 1024×650 without hiding Stop, replay, prompt, required controls, or feedback.
- Reduced motion replaces travel and bounce with immediate state changes while retaining the learning event.
- Sound-off and missing-audio states remain truthful. A round requiring auditory discrimination is unavailable unless its cue exists; it does not expose the answer as fallback text.
- Recorded instructions use the existing trusted-gesture, replay, preload, and cancellation flow.
- Success changes the game world, not merely the button colour.

## Runtime architecture

### Stable outer controller

`ElSkillsQuest` remains responsible for:

- cycle locking and station selection;
- progress load/save and v2 migration;
- station and round sequencing;
- instruction audio orchestration;
- first-attempt/support counters;
- cancellation of pending audio and transitions;
- station/cycle celebrations and return navigation.

It must no longer contain a growing per-type renderer conditional.

### Mechanic registry

Create `src/components/elQuest/mechanics/adventureMechanics.jsx` exporting:

```js
export const ADVENTURE_MECHANICS = Object.freeze({
  letterPair: LetterPressMechanic,
  soundGate: SoundGateMechanic,
  sceneHunt: SceneHuntMechanic,
  wordWindow: WordWindowMechanic,
  soundBoxes: SoundBoxesMechanic,
  wordMachine: WordMachineMechanic,
  poemSpotlight: PoemSpotlightMechanic,
  coverClue: CoverClueMechanic,
  letterTrace: LetterTraceMechanic,
  patternSort: PatternSortMechanic,
  wordChain: WordChainMechanic,
  phraseFlow: PhraseFlowMechanic,
  heartWord: HeartWordMechanic
});
```

Dispatch uses `round.mechanicId`, including mixed Cycle Quest rounds. `stationId` is not a sufficient dispatch key because the check contains multiple mechanics.

Every mechanic receives the same interface:

```js
{
  round,
  disabled,
  supportLevel,
  onCommit(outcome),
  onRequestReplay(),
  reducedMotion
}
```

`onCommit` returns semantic information:

```js
{
  correct: Boolean,
  selected: String | Array,
  feedback: String,
  evidence: {
    construct: String,
    target: String,
    response: String | Array,
    supportLevel: Number
  }
}
```

The outer controller owns the attempt count and decides when to advance.

### Shared round frame

Create `AdventureRoundFrame.jsx` for the compact header, progress, instruction, replay, feedback live region, Stop action, mechanic stage, and world-success layer. The frame preserves the Adventure Map world behind a smaller, shaped play surface rather than a dominant generic white worksheet card.

### Pure generation helpers

Keep cycle-bounded content generation in `elQuestEngine.js`, but give every round:

- `mechanicId`;
- `construct`;
- `instruction`;
- an explicit target structure required by its mechanic;
- no cross-mechanic fallback.

If an intended station cannot be generated truthfully for a cycle, `stationsForCycle(cycle)` must return a truthful replacement definition for the same stable slot, or omit the slot. `buildStationRounds` must never substitute a different mechanic behind the requested station title.

## Station contracts

### Letter Spot / Code Spot

- Single-letter cycles: **Letter Spot**, mechanic `letterPair`.
- Child action: pair uppercase and lowercase forms using two press slots.
- Later pattern cycles without single-letter focus: stable ID `letters`, child-facing title **Code Spot**, mechanic `patternSort`; child finds the taught grapheme inside words.
- Evidence: visual letter or grapheme identity only, not sound knowledge.

### Sound Catch

- Mechanic: `soundGate`.
- Child hears a phoneme or authorised spoken word cue and commits a grapheme magnet into a gate.
- Distractors must not share the same sound in the given context.
- Equivalent spellings are accepted together only when the prompt genuinely asks for the sound; otherwise a word-position context makes one spelling uniquely correct.
- Evidence: heard phoneme to grapheme mapping, with replay/support recorded.

### Sound Hunt

- Mechanic: `sceneHunt`.
- Child explores three to five illustrated objects, taps any object to hear its name, then tags every object with the target onset.
- Printed object labels are hidden by default and exposed only through an explicit support control.
- Cycles without a viable illustrated onset set use a truthful **Sound Sort** replacement in the same stable slot, never Sound Catch under a Hunt title.
- Evidence: spoken-word onset discrimination; picture naming support is recorded.

### Quick Words

- Mechanic: `wordWindow`.
- Child sees and hears an authorised high-frequency word, closes the window, then recognises it among close spellings.
- A reveal after commitment highlights the differing sequence.
- Evidence: independent recognition versus recognition after replay/reveal; never phonics mastery.

### Word Build

- Mechanic: `soundBoxes`.
- Segment authorised words into grapheme units. `sh`, `ch`, `th`, `wh`, `ck`, `ng`, `ff`, `ss`, `zz`, and `ll` remain one tile when taught as a unit.
- Child fills one sound box at a time and blends the finished word.
- Correct prefix stays in place after an error.
- Evidence: ordered grapheme encoding and support level.

### Word Play

- Mechanic: `wordMachine`.
- Each round declares exactly one operation: `substituteOnset`, `removeOnset`, or `joinCompound`.
- Operations use grapheme or spoken-word chunks rather than raw character slicing.
- The machine physically shows before and after forms.
- Evidence remains separated by operation.

### Poem Time / Poem Play

- Mechanic: `poemSpotlight`.
- The actual poem lines are interactive.
- Rounds ask the child to find an occurrence, follow a repeated refrain, identify an objective rhyme/pattern, or mark a phrase scoop.
- No detached answer grid and no prompt containing the answer to be tapped.
- Evidence: supported connected-print tracking and pattern noticing; no oral-fluency claim.

### Cover Clue (replaces Story Stop)

- Stable ID remains `story`; child-facing title becomes **Cover Clue**.
- Mechanic: `coverClue`.
- The current authoritative bank supplies covers, printed titles, and character ownership, but not story excerpts or objective comprehension evidence. The child therefore hears or sees an authorised title/name strip, inspects a small book rack, and places the strip on the matching cover.
- The answer is never repeated as a detached generic choice below the same visible title. Covers and title strips are separate spatial pieces, and support may reveal the title on every cover.
- Evidence: supported cover/title association only, not comprehension or independent decoding.
- A future Story Sleuth mechanic requires separately authored excerpt, answer, and objective clue records; it must not be inferred from cover art.

### Letter Trace

- Mechanic: `letterTrace`.
- Retain watch → trace and add a model-faded independent attempt.
- Feedback uses scorer dimensions such as start, order, direction, and coverage.
- A non-drawing accessibility route is labelled supported formation practice, not handwriting evidence.

### Pattern Power

- Mechanic: `patternSort`.
- Child sorts word tiles into explicit pattern bins, highlights the grapheme, then applies it to one authorised transfer word.
- Families come from an explicit taught-pattern inventory, not inference from HFW membership.

### Word Chains

- Mechanic: `wordChain`.
- The previous word persists as grapheme tiles.
- Child hears the next word, identifies the changing position, and replaces one grapheme.
- The target answer is absent from the printed prompt.

### Phrase Flow (replaces Speedy Words)

- Stable ID remains `speed`; child-facing title becomes **Phrase Flow**.
- Mechanic: `phraseFlow`.
- A short meaningful phrase reveals in authored chunks. The child follows the model, chooses the natural phrase boundary, and performs an echo-read routine.
- The game records model/replay support only. It does not score oral accuracy or speed.

### Heart Word Studio (replaces Spell It)

- Stable ID remains `spell`; child-facing title becomes **Heart Word Studio**.
- Mechanic: `heartWord`.
- Child studies the exact authorised HFW, hides the model, spells from memory, reveals the first differing position, and repairs it.
- This is orthographic-memory practice and remains distinct from phoneme-box Word Build.

### Cycle Quest (replaces Cycle Check)

- Stable ID remains `check`; child-facing title becomes **Cycle Quest**.
- Build a deterministic, balanced blueprint with one item per eligible cycle construct before any repeated construct. The blueprint shrinks when a construct lacks valid cycle-bounded content and reports its sampled-construct manifest.
- Record the first committed response before feedback.
- After a miss, provide the correction ladder and require successful recovery.
- Stars:
  - 3: every blueprint item correct independently on first attempt;
  - 2: at least 70% correct independently on first attempt;
  - 1: mission completed with supported recovery;
  - 0: mission not completed.
- `bestScore` becomes independent-first-attempt percentage, 0–100.
- The result screen describes practice/recovery and must not say formal mastery or assessment.

## Correction ladder

1. First miss: identify the selected response and explain the exact contrast.
2. Second miss: isolate or highlight the relevant sound, grapheme, word part, line, or clue.
3. Third miss: model the correct action, then require the child to repeat it.

Support use is recorded in the current run. The initial v2 implementation persists only station completion and Cycle Quest summary; it does not add student-response telemetry or new hosted-data fields.

## Progress version and reset

Use:

```js
const ADVENTURE_PROGRESS_VERSION = 2;
```

On local or hydrated progress load:

- if `progress.adventureVersion !== 2`, replace only the Adventure Map `cycles` record with `{}` and set `adventureVersion: 2`;
- retain no v1 station booleans, stars, best scores, or plays;
- save the v2 marker locally and queue the complete v2 `el_quest` payload;
- if an old cloud v1 row later hydrates, normalisation must discard its cycles before it reaches the component;
- v2 cloud/local rows continue forward-merging normally.

This is a one-time product-version reset, not an account or teacher-commanded destructive reset.

## Visual direction

- Preserve each cycle’s Meadow, Dinosaur Valley, or Moonwood setting as the visible world.
- Use a compact instruction plaque and shaped mechanic stage instead of one large white card.
- Each mechanic gets a recognisable silhouette and action metaphor: press, gate, scene search, shutter, sound boxes, machine, spotlight, evidence board, writing trail, sorting bench, chain path, phrase trail, or memory studio.
- Reuse existing world scenes, covers, verified picture art, and pal assets. Do not introduce placeholder images or a second visual style.
- Success changes the stage: paired signs light, gates open, caught sounds collect, objects glow, shutters stamp, bridges complete, machines transform, poem marks remain, clue pins connect, trails grow, bins fill, chains extend, phrases travel, and repaired spellings seal.
- Motion remains short, interruptible, and absent under reduced motion.

## Testing contract

### Unit

- All 27 cycles expose a truthful, non-empty set of eligible stations; every station definition returned for a cycle has non-empty rounds.
- Every round has a registered `mechanicId` and declared construct.
- No station builder returns a round from another station mechanic unless the station definition itself is truthfully renamed.
- Sound-choice equivalence includes taught alternate spellings and never marks one of two equally valid choices wrong.
- Grapheme segmentation treats taught multi-letter graphemes as units.
- Word Play operations are phoneme/grapheme aware.
- Cycle Quest is balanced and scores first attempts, not eventual completion.
- Progress v1 becomes empty v2 once; v2 progress survives reload and hydration.
- Semantic outcomes produce construct-specific feedback.

### Browser

- Complete at least one round for every mechanic with pointer/touch.
- Complete every non-drawing mechanic with keyboard.
- Stop during success and coaching delay; no later advance or celebration occurs.
- Spoken instruction plays from a trusted station tap, replay works, and Stop cancels it.
- Every live station fits 1024×768, 1024×694, and 1024×650.
- Reduced-motion mode has no required animation and remains completeable.
- Visual identity checks assert distinct stage structures rather than only different colours.

### Human gates

- Direct visual review of every mechanic at 1024×694.
- Human listening of every new/changed recorded instruction and target sequence.
- Physical iPad Safari touch, rotation, audio, keyboard-access alternative, and Stop testing.
- Child play observation before claiming classroom readiness.

## Cleanup and release

- Remove obsolete generic mechanic components, dead CSS, old timer code, and temporary screenshots after the new registry owns all live rounds.
- Preserve unrelated worktree files and generated evidence required by existing release checks.
- Run the scoped unit/browser suite, full build, existing public gates proportionate to the changed surface, and inspect the final diff.
- Commit only named Adventure Map/spec/plan/audio/test paths and push to `origin/main` after verification.

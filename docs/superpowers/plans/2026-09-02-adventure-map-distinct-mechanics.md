# Adventure Map distinct mechanics implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Adventure Map's repeated answer-grid activities with truthful, distinct literacy mechanics across all 27 cycles while preserving exact teacher cycle assignment and resetting only obsolete Adventure Map v1 progress.

**Architecture:** Keep `ElSkillsQuest` as the route, cycle-lock, audio, run-state, persistence, and celebration owner. Generate typed rounds with `mechanicId` and `construct`, dispatch them through focused mechanic components, and score Cycle Quest from independent first attempts followed by supported recovery. Version `el_quest` progress at Adventure Map v2 so an old cloud or local record cannot resurrect obsolete stars or station completions.

**Tech Stack:** React 18, Vite, vanilla CSS, Node test runner, Playwright, existing Leda audio manifest and progress queue.

**Spec:** `docs/superpowers/specs/2026-09-02-adventure-map-distinct-mechanics-design.md`

## Global constraints

- Preserve `lockedCycleId`, `initialCycleId`, `initialStationId`, learner identity, and all non-Adventure progress.
- Reset only `el_quest.cycles` whose `adventureVersion` is not exactly `2`.
- Keep Adventure Map evidence practice-only; never claim Secure placement or oral fluency.
- Never silently return another station mechanic from `buildStationRounds`.
- Every required action has touch/pointer and keyboard activation, with no required drag-only path.
- Keep required controls at least 56px and fit the live round at 1024×694 and 1024×650.
- Use existing verified images, covers, world scenes, pal art, and recorded-audio infrastructure; add no placeholder media.
- Use tests first for every production behavior.

---

### Task 1: Adventure Map v2 progress boundary

**Files:**
- Create: `src/components/elQuest/adventureProgress.js`
- Modify: `src/components/elQuest/ElSkillsQuest.jsx`
- Modify: `src/utils/progressMerge.js`
- Test: `tests/unit/adventureMapProgress.test.js`
- Test: `tests/unit/progressMerge.test.js`

**Interfaces:**
- Produces: `ADVENTURE_PROGRESS_VERSION`, `normalizeAdventureProgress(value)`, and `isCurrentAdventureProgress(value)`.
- Consumes: existing `loadQuestProgress`, `saveQuestProgress`, and `computeHydratedValue` paths.

- [ ] **Step 1: Write failing normalisation tests**

```js
test("v1 Adventure Map progress resets only its cycle records", () => {
  assert.deepEqual(normalizeAdventureProgress({
    v: 1,
    cycles: { cycle1: { stars: 3, stations: { letters: true } } },
    unrelatedMarker: "keep"
  }), {
    v: 1,
    adventureVersion: 2,
    cycles: {},
    unrelatedMarker: "keep"
  });
});

test("v2 Adventure Map progress survives normalisation", () => {
  const current = { adventureVersion: 2, cycles: { cycle1: { stars: 2 } } };
  assert.deepEqual(normalizeAdventureProgress(current), current);
});
```

- [ ] **Step 2: Run tests and confirm they fail because the module does not exist**

Run: `node --test tests/unit/adventureMapProgress.test.js`  
Expected: FAIL resolving `adventureProgress.js`.

- [ ] **Step 3: Implement the pure boundary**

```js
export const ADVENTURE_PROGRESS_VERSION = 2;

export function isCurrentAdventureProgress(value) {
  return Number(value?.adventureVersion) === ADVENTURE_PROGRESS_VERSION;
}

export function normalizeAdventureProgress(value) {
  const source = value && typeof value === "object" ? value : {};
  if (isCurrentAdventureProgress(source)) return { cycles: {}, ...source };
  return { ...source, adventureVersion: ADVENTURE_PROGRESS_VERSION, cycles: {} };
}
```

- [ ] **Step 4: Apply normalisation on local load, hydration, and `el_quest` cloud merge**

`loadQuestProgress` normalises parsed values. The hydration handler normalises the merged value before state update. `computeHydratedValue("el_quest", ...)` normalises both local and incoming payloads before merging so v1 cloud cycles cannot return after a local v2 reset.

- [ ] **Step 5: Run focused progress tests**

Run: `node --test tests/unit/adventureMapProgress.test.js tests/unit/progressMerge.test.js`  
Expected: PASS.

- [ ] **Step 6: Commit the boundary**

```bash
git add src/components/elQuest/adventureProgress.js src/components/elQuest/ElSkillsQuest.jsx src/utils/progressMerge.js tests/unit/adventureMapProgress.test.js tests/unit/progressMerge.test.js
git commit -m "feat: reset Adventure Map progress for v2"
```

### Task 2: Typed round and truthful station contracts

**Files:**
- Modify: `src/components/elQuest/elQuestEngine.js`
- Create: `src/components/elQuest/adventureRoundModel.js`
- Test: `tests/unit/adventureMapMechanicContracts.test.js`
- Modify: `tests/unit/elQuestEngine.test.js`
- Modify: `tests/unit/gamePlaythroughs.test.js`

**Interfaces:**
- Produces: `ADVENTURE_MECHANIC_IDS`, `segmentTaughtGraphemes(word, cycle)`, `scoreCycleQuest(firstAttempts, total)`, and rounds containing `mechanicId`, `construct`, and mechanic-specific data.
- Consumes: cycle data, verified picture words, poem data, story question data, and existing audio resolvers.

- [ ] **Step 1: Write a failing all-cycle registry contract**

```js
for (const cycle of elSkillsBlockCycles.filter(item => item.cycleNumber)) {
  test(`cycle ${cycle.cycleNumber} exposes typed, truthful rounds`, () => {
    for (const station of stationsForCycle(cycle)) {
      const rounds = buildStationRounds(cycle, station.id);
      assert.ok(rounds.length > 0, `${station.id} is empty`);
      for (const round of rounds) {
        assert.ok(ADVENTURE_MECHANIC_IDS.includes(round.mechanicId));
        assert.equal(typeof round.construct, "string");
        assert.ok(station.mechanicIds.includes(round.mechanicId));
      }
    }
  });
}
```

- [ ] **Step 2: Run it and confirm failure on missing typed fields**

Run: `node --test tests/unit/adventureMapMechanicContracts.test.js`  
Expected: FAIL because current rounds have no `mechanicId` or `construct`.

- [ ] **Step 3: Define round model constants and grapheme segmentation**

```js
export const ADVENTURE_MECHANIC_IDS = Object.freeze([
  "letterPair", "soundGate", "sceneHunt", "wordWindow", "soundBoxes",
  "wordMachine", "poemSpotlight", "storySleuth", "letterTrace",
  "patternSort", "wordChain", "phraseFlow", "heartWord"
]);

const MULTI = ["sh", "ch", "th", "wh", "ck", "ng", "ff", "ss", "zz", "ll"];
export function segmentTaughtGraphemes(word, taught = []) {
  const allowed = new Set(taught);
  const result = [];
  for (let index = 0; index < word.length;) {
    const pair = word.slice(index, index + 2);
    if (MULTI.includes(pair) && allowed.has(pair)) {
      result.push(pair);
      index += 2;
    } else {
      result.push(word[index]);
      index += 1;
    }
  }
  return result;
}
```

- [ ] **Step 4: Replace cross-mechanic fallbacks with truthful station variants**

`stationsForCycle` computes stable-slot definitions. `letters` becomes Code Spot when no single-letter form exists. `hunt` becomes Sound Sort when no verified scene pool exists. Empty poem/story content is omitted instead of substituted. `buildStationRounds` throws a descriptive development error for an unknown/empty definition rather than returning Sound Catch or Speedy Words.

- [ ] **Step 5: Make every generator emit its declared mechanic data**

Examples:

```js
{
  mechanicId: "sceneHunt",
  construct: "initial_phoneme_discrimination",
  targetGrapheme: entry.spelling,
  objects: choices.map(word => ({ word, matches: sharesSound(onsetGrapheme(word), entry.spelling) }))
}
```

```js
{
  mechanicId: "soundBoxes",
  construct: "phoneme_grapheme_encoding",
  word,
  graphemes: segmentTaughtGraphemes(word, taughtGraphemesThrough(cycle.cycleNumber))
}
```

- [ ] **Step 6: Add sound-equivalence and answer-leakage tests**

Test 200 generated Cycle 24 Sound Gate rounds and assert no unaccepted choice shares the target sound. Assert Word Chain prompts omit the target, poem prompts omit the target token to tap, and Phrase Flow never exposes a speed timer.

- [ ] **Step 7: Run engine and playthrough tests**

Run: `node --test tests/unit/adventureMapMechanicContracts.test.js tests/unit/elQuestEngine.test.js tests/unit/gamePlaythroughs.test.js tests/unit/elQuestFluency.test.js`  
Expected: PASS.

- [ ] **Step 8: Commit typed generation**

```bash
git add src/components/elQuest/elQuestEngine.js src/components/elQuest/adventureRoundModel.js tests/unit/adventureMapMechanicContracts.test.js tests/unit/elQuestEngine.test.js tests/unit/gamePlaythroughs.test.js
git commit -m "feat: type Adventure Map learning rounds"
```

### Task 3: Semantic feedback and first-attempt run scoring

**Files:**
- Create: `src/components/elQuest/adventureRunState.js`
- Test: `tests/unit/adventureMapRunState.test.js`

**Interfaces:**
- Produces: `createAdventureRun(total)`, `recordAdventureOutcome(state, outcome)`, `feedbackForOutcome(round, outcome, attempt)`, and `cycleQuestResult(state)`.
- Consumes: semantic mechanic outcomes.

- [ ] **Step 1: Write failing run-state tests**

```js
test("a recovered item keeps its failed first attempt", () => {
  let state = createAdventureRun(2);
  state = recordAdventureOutcome(state, { roundIndex: 0, correct: false, selected: "m" });
  state = recordAdventureOutcome(state, { roundIndex: 0, correct: true, selected: "s" });
  assert.equal(state.firstAttempts[0], false);
  assert.equal(state.completed, 1);
  assert.equal(cycleQuestResult(state).stars, 1);
});

test("seven of ten independent first attempts earn two stars", () => {
  const result = cycleQuestResult({ total: 10, completed: 10, firstAttempts: [true, true, true, true, true, true, true, false, false, false] });
  assert.deepEqual(result, { stars: 2, independentPercent: 70 });
});
```

- [ ] **Step 2: Run and confirm the missing module failure**

Run: `node --test tests/unit/adventureMapRunState.test.js`  
Expected: FAIL resolving `adventureRunState.js`.

- [ ] **Step 3: Implement immutable attempt tracking and rubric**

Record only the first commit for each round in `firstAttempts`, increment completion only on a correct commit, and calculate 3/2/1/0 stars exactly as the approved spec states.

- [ ] **Step 4: Implement construct-specific feedback templates**

Templates name the selected response and target contrast. They return direct strings such as `“m starts moon. Listen for /s/ at the start of sun.”`, never `“Almost! Try again.”`.

- [ ] **Step 5: Run run-state tests**

Run: `node --test tests/unit/adventureMapRunState.test.js`  
Expected: PASS.

- [ ] **Step 6: Commit run state**

```bash
git add src/components/elQuest/adventureRunState.js tests/unit/adventureMapRunState.test.js
git commit -m "feat: score Adventure Map first attempts"
```

### Task 4: Shared frame and mechanic registry

**Files:**
- Create: `src/components/elQuest/AdventureRoundFrame.jsx`
- Create: `src/components/elQuest/mechanics/AdventureMechanicRenderer.jsx`
- Create: `src/components/elQuest/mechanics/adventureMechanics.jsx`
- Modify: `src/components/elQuest/ElSkillsQuest.jsx`
- Test: `tests/unit/adventureMapMechanicRegistry.test.js`
- Modify: `tests/unit/phonicsHubPresentation.test.js`

**Interfaces:**
- Produces: `AdventureRoundFrame`, `AdventureMechanicRenderer`, and `ADVENTURE_MECHANICS`.
- Consumes: the uniform mechanic props defined in the spec.

- [ ] **Step 1: Write a failing registry completeness test**

```js
test("every declared mechanic resolves to a component", () => {
  for (const id of ADVENTURE_MECHANIC_IDS) {
    assert.equal(typeof ADVENTURE_MECHANICS[id], "function", id);
  }
});
```

- [ ] **Step 2: Run and confirm the registry is absent**

Run: `node --test tests/unit/adventureMapMechanicRegistry.test.js`  
Expected: FAIL resolving the registry.

- [ ] **Step 3: Create the shared frame**

The frame renders semantic `header`, progress, replay button, `role="status"` feedback, Stop button, and the mechanic stage. It receives handlers and children; it owns no progress or audio state.

- [ ] **Step 4: Create registry dispatch with explicit unknown-mechanic failure**

```jsx
export function AdventureMechanicRenderer({ round, ...props }) {
  const Mechanic = ADVENTURE_MECHANICS[round.mechanicId];
  if (!Mechanic) return <p role="alert">This activity is not available.</p>;
  return <Mechanic round={round} {...props} />;
}
```

- [ ] **Step 5: Integrate the frame into `ElSkillsQuest`**

Replace the generic round conditional with the renderer. Preserve trusted station-tap audio, exact cycle lock, celebration, and navigation. Track semantic outcomes through `adventureRunState`.

- [ ] **Step 6: Run registry and presentation tests**

Run: `node --test tests/unit/adventureMapMechanicRegistry.test.js tests/unit/phonicsHubPresentation.test.js tests/unit/adventureMapQuestLock.test.js`  
Expected: PASS.

- [ ] **Step 7: Commit the frame**

```bash
git add src/components/elQuest/AdventureRoundFrame.jsx src/components/elQuest/mechanics/AdventureMechanicRenderer.jsx src/components/elQuest/mechanics/adventureMechanics.jsx src/components/elQuest/ElSkillsQuest.jsx tests/unit/adventureMapMechanicRegistry.test.js tests/unit/phonicsHubPresentation.test.js
git commit -m "refactor: add Adventure Map mechanic registry"
```

### Task 5: Letter, sound, and scene mechanics

**Files:**
- Create: `src/components/elQuest/mechanics/CodeMechanics.jsx`
- Test: `tests/unit/adventureMapCodeMechanics.test.js`
- Test: `tests/release/adventure-map-distinct-mechanics.spec.js`

**Interfaces:**
- Produces: `LetterPressMechanic`, `SoundGateMechanic`, and `SceneHuntMechanic`.
- Consumes: uniform mechanic props; verified child word assets; `playCueAudio` only through provided replay/object-audio callbacks.

- [ ] **Step 1: Write failing component source/behavior contracts**

Assert distinct `data-mechanic-stage` values, two-slot letter pairing, explicit Sound Gate commit, multi-object Hunt tagging, hidden default captions, and button-based keyboard activation.

- [ ] **Step 2: Run and confirm failures on missing components**

Run: `node --test tests/unit/adventureMapCodeMechanics.test.js`  
Expected: FAIL resolving `CodeMechanics.jsx`.

- [ ] **Step 3: Implement Letter Press**

Render the model form as a sign and candidate partner presses. A correct press lights both signs; a wrong press reports the selected letter through `onCommit`.

- [ ] **Step 4: Implement Sound Gate**

Render grapheme magnets separately from the gate. Selecting a magnet previews it; pressing the gate commits it. Accept every value in `round.acceptedAnswers`.

- [ ] **Step 5: Implement Scene Hunt**

Render objective picture buttons in a scene. Object taps play names and toggle tags; a separate Check action commits all tags. The Labels support control sets support level and reveals text.

- [ ] **Step 6: Run code-mechanic tests**

Run: `node --test tests/unit/adventureMapCodeMechanics.test.js`  
Expected: PASS.

- [ ] **Step 7: Commit code mechanics**

```bash
git add src/components/elQuest/mechanics/CodeMechanics.jsx tests/unit/adventureMapCodeMechanics.test.js tests/release/adventure-map-distinct-mechanics.spec.js
git commit -m "feat: add distinct letter and sound games"
```

### Task 6: Word recognition, encoding, and manipulation mechanics

**Files:**
- Create: `src/components/elQuest/mechanics/WordMechanics.jsx`
- Test: `tests/unit/adventureMapWordMechanics.test.js`

**Interfaces:**
- Produces: `WordWindowMechanic`, `SoundBoxesMechanic`, and `WordMachineMechanic`.
- Consumes: typed word-window, grapheme, and operation data.

- [ ] **Step 1: Write failing tests for three different state machines**

Verify Word Window requires close-before-choice, Sound Boxes preserves a correct prefix and places grapheme units, and Word Machine exposes add/remove/swap/join pieces rather than a generic answer grid.

- [ ] **Step 2: Run and confirm missing-component failures**

Run: `node --test tests/unit/adventureMapWordMechanics.test.js`  
Expected: FAIL resolving `WordMechanics.jsx`.

- [ ] **Step 3: Implement Word Window**

Use Study → Close window → Choose → Reveal. Replays and reopening study increase support level and do not claim independent recognition.

- [ ] **Step 4: Implement Sound Boxes**

Use one visible box per grapheme, a reusable tile bank, remove controls, and a final Blend/Check commit. Never clear a correct prefix after one wrong tile.

- [ ] **Step 5: Implement Word Machine**

Render operation-specific trays for onset substitution, onset removal, and compound joining. Animate the resulting before/after word only after commitment.

- [ ] **Step 6: Run word-mechanic tests**

Run: `node --test tests/unit/adventureMapWordMechanics.test.js`  
Expected: PASS.

- [ ] **Step 7: Commit word mechanics**

```bash
git add src/components/elQuest/mechanics/WordMechanics.jsx tests/unit/adventureMapWordMechanics.test.js
git commit -m "feat: add distinct Adventure Map word games"
```

### Task 7: Poem, story, and formation mechanics

**Files:**
- Create: `src/components/elQuest/mechanics/TextMechanics.jsx`
- Move/refactor from: `src/components/elQuest/ElSkillsQuest.jsx`
- Test: `tests/unit/adventureMapTextMechanics.test.js`
- Modify: `tests/release/letter-trace-formation.spec.js`

**Interfaces:**
- Produces: `PoemSpotlightMechanic`, `StorySleuthMechanic`, and `LetterTraceMechanic`.
- Consumes: exact poem tokens/line indices, authored story clue records, existing `LetterWriter`, and trace scoring.

- [ ] **Step 1: Write failing tests for direct text interaction**

Assert poem targets are buttons in their original line rather than detached choices; story responses reference objective clue IDs; trace advances from guided to faded model and reports scorer-specific feedback.

- [ ] **Step 2: Run and confirm failures**

Run: `node --test tests/unit/adventureMapTextMechanics.test.js`  
Expected: FAIL resolving `TextMechanics.jsx`.

- [ ] **Step 3: Implement Poem Spotlight**

Tokenise while preserving punctuation and line structure. Only matching occurrences commit correct; wrong word taps identify the selected word and keep the poem context visible.

- [ ] **Step 4: Implement Story Sleuth**

Render the cover/scene and objective clue buttons. The response and clue are distinct steps; the round commits only after the child connects a response to the authored supporting clue.

- [ ] **Step 5: Extract and extend Letter Trace**

Retain existing watch/clear/check behavior, add guided/faded phases, pass semantic trace outcomes, and expose the supported non-drawing route without calling it handwriting.

- [ ] **Step 6: Run text and trace tests**

Run: `node --test tests/unit/adventureMapTextMechanics.test.js`  
Expected: PASS. Then run: `npx playwright test tests/release/letter-trace-formation.spec.js --project=chromium`  
Expected: PASS.

- [ ] **Step 7: Commit text mechanics**

```bash
git add src/components/elQuest/mechanics/TextMechanics.jsx src/components/elQuest/ElSkillsQuest.jsx tests/unit/adventureMapTextMechanics.test.js tests/release/letter-trace-formation.spec.js
git commit -m "feat: make Adventure poems stories and tracing interactive"
```

### Task 8: Pattern, chain, phrase, and heart-word mechanics

**Files:**
- Create: `src/components/elQuest/mechanics/FluencyMechanics.jsx`
- Test: `tests/unit/adventureMapFluencyMechanics.test.js`
- Modify: `tests/unit/elQuestFluency.test.js`

**Interfaces:**
- Produces: `PatternSortMechanic`, `WordChainMechanic`, `PhraseFlowMechanic`, and `HeartWordMechanic`.
- Consumes: explicit pattern bins, grapheme-chain transitions, phrase chunks, and exact HFW spellings.

- [ ] **Step 1: Write failing fluency-mechanic contracts**

Assert Pattern Sort uses labelled bins and transfer, Word Chain commits a position then a grapheme, Phrase Flow contains no timer or automatic fluency score, and Heart Word hides its model before spelling.

- [ ] **Step 2: Run and confirm failures**

Run: `node --test tests/unit/adventureMapFluencyMechanics.test.js`  
Expected: FAIL resolving `FluencyMechanics.jsx`.

- [ ] **Step 3: Implement Pattern Sort**

Tap a word then a bin; retain sorted tiles; finish with one transfer choice using an authorised word.

- [ ] **Step 4: Implement Word Chain**

Show the previous grapheme tiles, select the changed position, then choose the replacement grapheme. Append the corrected word to a visible chain.

- [ ] **Step 5: Implement Phrase Flow**

Reveal phrase chunks in order through a self-paced trail. Ask for the natural authored break and then provide a model/echo-read completion action. Record support only.

- [ ] **Step 6: Implement Heart Word Studio**

Use Study → Hide → Spell → Reveal/repair. Highlight the first differing position and preserve all preceding correct letters.

- [ ] **Step 7: Run fluency tests**

Run: `node --test tests/unit/adventureMapFluencyMechanics.test.js tests/unit/elQuestFluency.test.js`  
Expected: PASS.

- [ ] **Step 8: Commit fluency mechanics**

```bash
git add src/components/elQuest/mechanics/FluencyMechanics.jsx tests/unit/adventureMapFluencyMechanics.test.js tests/unit/elQuestFluency.test.js
git commit -m "feat: rebuild Adventure Map fluency stations"
```

### Task 9: Cycle Quest, cancellation, and persistence integration

**Files:**
- Modify: `src/components/elQuest/ElSkillsQuest.jsx`
- Modify: `src/components/elQuest/elQuestEngine.js`
- Test: `tests/unit/adventureMapCycleQuest.test.js`
- Modify: `tests/unit/adventureMapQuestLock.test.js`
- Modify: `tests/release/adventure-map-session-lock.spec.js`

**Interfaces:**
- Consumes: typed rounds, run state, v2 progress, registry.
- Produces: balanced Cycle Quest completion and interruptible transitions.

- [ ] **Step 1: Write failing balanced-blueprint and cancellation tests**

Assert a standard Cycle Quest includes one item per available construct before repeats; its summary persists independent percentage and recovery count; a Stop action clears every pending success/coaching timer.

- [ ] **Step 2: Run and confirm current scoring/cancellation failures**

Run: `node --test tests/unit/adventureMapCycleQuest.test.js`  
Expected: FAIL because current check samples randomly and stores eventual-correct count.

- [ ] **Step 3: Implement deterministic balanced blueprint**

Take the first seeded round from each station definition, then fill to the target length by round-robin station index. Do not call `shuffleItems(everything).slice(0, 10)`.

- [ ] **Step 4: Persist defensible result**

Store `stars`, `bestScore` as independent percentage, `bestIndependent`, `recoveries`, `plays`, and `lastPlayedAt` under Adventure Map v2. Use monotonic best fields while allowing latest recoveries to remain descriptive.

- [ ] **Step 5: Track and cancel all transitions**

Use a single `transitionTimerRef`; clear it together with instruction and coach timers in Stop, unmount, station restart, and cycle change. Lock both correct and wrong commits until feedback settles.

- [ ] **Step 6: Run Cycle Quest and lock tests**

Run: `node --test tests/unit/adventureMapCycleQuest.test.js tests/unit/adventureMapQuestLock.test.js`  
Expected: PASS. Then run: `npx playwright test tests/release/adventure-map-session-lock.spec.js --project=chromium`  
Expected: PASS.

- [ ] **Step 7: Commit integration**

```bash
git add src/components/elQuest/ElSkillsQuest.jsx src/components/elQuest/elQuestEngine.js tests/unit/adventureMapCycleQuest.test.js tests/unit/adventureMapQuestLock.test.js tests/release/adventure-map-session-lock.spec.js
git commit -m "feat: add balanced Adventure Cycle Quest"
```

### Task 10: Visual system, instructions, and release verification

**Files:**
- Modify: `src/styles/skills-block-quest.css`
- Modify: `src/styles/ui-quality-pass.css`
- Modify: `src/components/elQuest/adventureRoundAudio.js`
- Modify: `src/data/generated/adventureMapInstructionAudio.generated.js`
- Modify/Create: recorded instruction assets produced by `tools/generateAdventureMapInstructionAudio.mjs`
- Modify: `tests/unit/adventureMapInstructionAudio.test.js`
- Modify: `tests/release/adventure-map-spoken-instructions.spec.js`
- Modify: `tests/release/student-activity-viewport.spec.js`
- Modify: `tests/release/adventure-map-distinct-mechanics.spec.js`

**Interfaces:**
- Consumes: final registered stages and exact instruction strings.
- Produces: distinct, compact responsive stages and complete audio coverage.

- [ ] **Step 1: Add failing visual-identity and viewport assertions**

For each mechanic, assert a unique `data-mechanic-stage`, no generic `.sbq-answer-grid` fallback, visible Stop/replay/commit controls, minimum target size, no horizontal overflow, and stage fit at 1024×768, 1024×694, and 1024×650.

- [ ] **Step 2: Run and confirm failures before CSS changes**

Run: `npx playwright test tests/release/adventure-map-distinct-mechanics.spec.js tests/release/student-activity-viewport.spec.js --project=chromium`  
Expected: FAIL on missing stage identities or new short-height layout.

- [ ] **Step 3: Implement the mechanic-stage visual system**

Use a compact instruction plaque, visible world backdrop, stage-specific silhouettes, tinted world-consistent shadows, clear focus/pressed states, 56px controls, short motion, reduced-motion replacements, and short-height layout rules. Remove obsolete timer and generic-grid CSS after no live mechanic uses it.

- [ ] **Step 4: Update exact instruction resolver and tests**

Map every mechanic instruction to a stable text key. Ensure target/content audio remains separate from instructions and Stop cancels the whole sequence.

- [ ] **Step 5: Generate new recorded instructions**

Run: `node tools/generateAdventureMapInstructionAudio.mjs`  
Expected: generated mapping and audio files for every new instruction with no missing manifest entries.

- [ ] **Step 6: Run unit and browser verification**

Run:

```bash
node --test \
  tests/unit/adventureMapProgress.test.js \
  tests/unit/adventureMapMechanicContracts.test.js \
  tests/unit/adventureMapRunState.test.js \
  tests/unit/adventureMapMechanicRegistry.test.js \
  tests/unit/adventureMapCodeMechanics.test.js \
  tests/unit/adventureMapWordMechanics.test.js \
  tests/unit/adventureMapTextMechanics.test.js \
  tests/unit/adventureMapFluencyMechanics.test.js \
  tests/unit/adventureMapCycleQuest.test.js \
  tests/unit/adventureMapInstructionAudio.test.js \
  tests/unit/elQuestEngine.test.js \
  tests/unit/gamePlaythroughs.test.js \
  tests/unit/elQuestFluency.test.js \
  tests/unit/adventureMapQuestLock.test.js \
  tests/unit/progressMerge.test.js

npx playwright test \
  tests/release/adventure-map-distinct-mechanics.spec.js \
  tests/release/adventure-map-spoken-instructions.spec.js \
  tests/release/student-activity-viewport.spec.js \
  tests/release/adventure-map-session-lock.spec.js \
  tests/release/letter-trace-formation.spec.js \
  --project=chromium

npm run build
```

Expected: zero failed tests and build exit 0.

- [ ] **Step 7: Perform direct visual and listening review**

Capture every mechanic at 1024×694, inspect legibility/action identity/overflow/focus, and listen to every changed instruction plus representative targets. Record physical iPad and child-play gates as open unless directly completed.

- [ ] **Step 8: Cleanup and inspect the exact diff**

Remove temporary screenshots, abandoned files, superseded generic components, and dead CSS created by this task. Preserve unrelated `tmp/pdfs/raz_c_audit/*`. Run `git status --short`, `git diff --check`, and review named paths only.

- [ ] **Step 9: Commit and push**

```bash
git add docs/superpowers/specs/2026-09-02-adventure-map-distinct-mechanics-design.md \
  docs/superpowers/plans/2026-09-02-adventure-map-distinct-mechanics.md \
  src/components/elQuest src/styles/skills-block-quest.css src/styles/ui-quality-pass.css \
  src/utils/progressMerge.js src/data/generated/adventureMapInstructionAudio.generated.js \
  tests/unit tests/release
git commit -m "feat: rebuild Adventure Map mini-games"
git push origin main
```

Only stage actual named files from the final diff; do not stage all of `tests/unit`, `tests/release`, or unrelated `tmp/` content if other work appeared concurrently.


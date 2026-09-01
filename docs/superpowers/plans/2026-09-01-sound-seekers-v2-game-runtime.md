# Sound Seekers v2 Game Runtime Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build one production 2D Sound Seekers runtime in which six genuinely different game actions directly perform the intended literacy work.

**Architecture:** Pure challenge and mission reducers own answers, evidence emissions, checkpoints, replay, and world state. One Phaser `AUTO` scene renders traversal and world transformations, while a synchronized semantic DOM action layer supplies readable instructions, focus order, switch/keyboard/touch/pointer control, and the persistent Word Workbench. Full, simplified, low-power, extended-response, and reduced-motion profiles change presentation or motor demand only; they use the same reducers and completion rules.

**Tech Stack:** React 19, Phaser 4 `AUTO`, CSS, Node `node:test`, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-01-sound-seekers-proper-educational-game-design.md`

## Global Constraints

- `src/features/soundSeekers/SoundSeekersGame.jsx` is the sole production child-game orchestrator; PixelWorld, Trail2D, and QuestHub do not remain alternate child runtimes.
- The renderer never calculates learning correctness and child-facing view models never expose `isCorrect` or an answer key.
- One input emits at most one literacy decision; proximity, travel, timing, pickup, animation, repair, and reward inputs emit none.
- The six power IDs are exactly `echo_search`, `contrast_sort`, `word_forge`, `blend_bridge`, `memory_delivery`, and `story_power`.
- Each power owns a distinct initial state, valid inputs, reducer transitions, correction hook, completion rule, and checkpoint.
- Word Forge plays the whole word once and does not pre-say the answer sound before the first independent attempt.
- Blend Bridge requires a final blend-to-meaning decision; grapheme activation alone does not complete it.
- Motor assistance never reveals, removes, narrows, or changes the literacy answer, evidence domain, support level, or completion threshold.
- Every required action is reachable with touch, pointer, keyboard, and switch-compatible focus; primary targets are at least 56 CSS pixels.
- At 320 CSS pixels and 200% zoom, the active instruction, cue replay, current task, and required controls remain usable without clipping.
- Reduced motion replaces movement with opacity, outline, and a clear final state; it does not remove cause-and-effect feedback.

---

### Task 1: Implement the six pure Sound Power reducers, deterministic replay, and motor-assist invariants

**Files:**
- Create: `src/features/soundSeekers/engine/powers/contracts.js`
- Create: `src/features/soundSeekers/engine/powers/echoSearch.js`
- Create: `src/features/soundSeekers/engine/powers/contrastSort.js`
- Create: `src/features/soundSeekers/engine/powers/wordForge.js`
- Create: `src/features/soundSeekers/engine/powers/blendBridge.js`
- Create: `src/features/soundSeekers/engine/powers/memoryDelivery.js`
- Create: `src/features/soundSeekers/engine/powers/storyPower.js`
- Create: `src/features/soundSeekers/engine/powers/index.js`
- Create: `src/features/soundSeekers/engine/replayDeck.js`
- Create: `src/features/soundSeekers/engine/motorAssists.js`
- Create: `tests/unit/soundSeekersPowerReducers.test.js`
- Create: `tests/unit/soundSeekersReplayDeck.test.js`
- Create: `tests/unit/soundSeekersMotorAssists.test.js`

**Interfaces:**
- Consumes: validated challenge objects, Task 1 foundation evidence functions, Task 4 correction records, and deterministic integer seeds.
- Produces: `SOUND_POWER_REGISTRY`, where each power implements `createState(challenge,{seed,resume})`, `reduce(state,input,context)`, `view(state,challenge,assists)`, and `checkpoint(state)`; also `createReplayVariant(deck,seed,replayOrdinal)` and `normalizeMotorAssists(raw)`.

- [ ] **Step 1: Write failing behavioral-distinction and invariance tests**

```js
test("the six powers cannot complete through one shared input sequence", () => {
  const inputs = [{ type: "confirm", token: "sh" }];
  const completions = Object.values(SOUND_POWER_REGISTRY).map(power => {
    let state = power.createState(fixtures[power.id], { seed: 9, resume: null });
    for (const input of inputs) state = power.reduce(state, input, context).state;
    return state.status === "complete";
  });
  assert.notEqual(new Set(completions).size, 1);
});

test("movement and exploration never emit literacy evidence", () => {
  for (const [powerId, fixture] of Object.entries(fixtures)) {
    const power = SOUND_POWER_REGISTRY[powerId];
    const state = power.createState(fixture, { seed: 3, resume: null });
    for (const input of [{ type: "move", dx: 1, dy: 0 }, { type: "probe" }, { type: "collect", id: "leaf" }]) {
      assert.deepEqual(power.reduce(state, input, context).events.filter(e => e.type === "literacy-decision"), []);
    }
  }
});

test("motor assists leave answer and evidence contracts invariant", () => {
  const baseline = structuredClone(seedContext.challenge);
  for (const key of ["autoTravel", "slowerMovement", "noDamageTravel", "largerTargets", "simplifiedScene", "extendedResponse", "reducedEffects"]) {
    const assists = normalizeMotorAssists({ [key]: true });
    const assistedContext = { challenge: structuredClone(seedContext.challenge), assists };
    assert.equal(assistedContext.challenge.expectedToken, baseline.expectedToken);
    assert.equal(assistedContext.challenge.recordsDomain, baseline.recordsDomain);
    assert.deepEqual(assistedContext.challenge.optionTokens, baseline.optionTokens);
  }
});
```

- [ ] **Step 2: Run the reducer tests and confirm the red state**

Run: `node --test tests/unit/soundSeekersPowerReducers.test.js tests/unit/soundSeekersReplayDeck.test.js tests/unit/soundSeekersMotorAssists.test.js`

Expected: FAIL because the power registry and reducers do not exist.

- [ ] **Step 3: Implement the six exact transition models**

```js
export const SOUND_POWER_REGISTRY = Object.freeze({
  echo_search: echoSearch,
  contrast_sort: contrastSort,
  word_forge: wordForge,
  blend_bridge: blendBridge,
  memory_delivery: memoryDelivery,
  story_power: storyPower
});
```

Implement these decision points:

- Echo Search: exploration/probe reveals stable candidates; an explicit candidate confirmation emits the phoneme/grapheme decision and uncovers the world source.
- Contrast Sort: four to six stable items remain until each reversible bin placement emits its own decision; completion requires the full authored set.
- Word Forge: each stable-rack tile placement emits one position decision; slots and duplicate physical tiles persist; completion transitions to an explicit sweep/read payoff.
- Blend Bridge: ordered segment activation plays support audio but emits no correctness; the final meaning destination emits one `word_decoding` decision and constructs the path.
- Memory Delivery: cue receipt/replay and travel emit nothing; explicit recipient use emits the decision, and the answer is absent from the travel overlay.
- Story Power: only an authored text-supported response emits `connected_text_transfer`; `narrative_choice` branches persist but emit no correctness.

Replay must preserve target and pronunciation while changing only audited content IDs, candidate positions, route IDs, recipients, and set-piece variant. The same seed and ordinal reproduce the same variant; a deck exhausts before repeating. Do not use reaction windows for correctness.

- [ ] **Step 4: Run reducer, replay, assist, evidence, and correction tests**

Run: `node --test tests/unit/soundSeekersPowerReducers.test.js tests/unit/soundSeekersReplayDeck.test.js tests/unit/soundSeekersMotorAssists.test.js tests/unit/soundSeekersEvidence.test.js tests/unit/questCorrection.test.js`

Expected: PASS with six distinct completion traces and no motor evidence.

- [ ] **Step 5: Commit the Sound Power engine**

```bash
git add src/features/soundSeekers/engine/powers src/features/soundSeekers/engine/replayDeck.js src/features/soundSeekers/engine/motorAssists.js tests/unit/soundSeekersPowerReducers.test.js tests/unit/soundSeekersReplayDeck.test.js tests/unit/soundSeekersMotorAssists.test.js
git commit -m "feat: add six Sound Seekers powers"
```

### Task 2: Build the persistent accessible Word Workbench

**Files:**
- Create: `src/features/soundSeekers/ui/WordWorkbench.jsx`
- Create: `src/features/soundSeekers/ui/WordWorkbench.css`
- Create: `src/features/soundSeekers/ui/MeaningPayoff.jsx`
- Create: `tests/unit/soundSeekersWordWorkbench.test.js`
- Create: `tests/browser/sound-seekers-word-workbench.spec.js`

**Interfaces:**
- Consumes: the `word_forge` view model and dispatch callback from Task 1, pronunciation and meaning records from the foundation, and `audioDelivery` replay callbacks.
- Produces: `<WordWorkbench model onInput onReplayWholeWord />` with accessible slots, stable rack buttons, blend sweep, and `<MeaningPayoff meaning effect reducedMotion />`.

- [ ] **Step 1: Write failing persistent-slot and browser interaction tests**

```js
test("hot, ship, moon, cake, and pop retain completed authored grapheme slots", () => {
  for (const word of ["hot", "ship", "moon", "cake", "pop"]) {
    const challenge = wordForgeFixture(word);
    let state = wordForge.createState(challenge, { seed: 4, resume: null });
    for (const unit of getPronunciation(word).units) {
      state = wordForge.reduce(state, { type: "place_tile", tileId: nextTile(state, unit.grapheme).id }, context).state;
      assert.deepEqual(state.slots.filter(slot => slot.placed).map(slot => slot.grapheme), getPronunciation(word).units.slice(0, state.currentIndex).map(unit => unit.grapheme));
    }
  }
});

test("a wrong tile preserves earlier slots and the stable rack", () => {
  const before = stateAfterFirstCorrectShipTile();
  const after = wordForge.reduce(before, { type: "place_tile", tileId: "wrong-i-position" }, context).state;
  assert.deepEqual(after.slots[0], before.slots[0]);
  assert.deepEqual(after.rack.map(tile => tile.id), before.rack.map(tile => tile.id));
});
```

Browser assertion:

```js
await page.getByRole("button", { name: "sh grapheme tile" }).click();
await expect(page.getByRole("group", { name: "Sound boxes for ship" })).toContainText("sh");
await expect(page.getByRole("button", { name: "i grapheme tile" })).toBeVisible();
await page.reload();
await expect(page.getByRole("group", { name: "Sound boxes for ship" })).toContainText("sh");
```

- [ ] **Step 2: Run focused tests and confirm the red state**

Run: `node --test tests/unit/soundSeekersWordWorkbench.test.js`

Expected: FAIL because the component and finalized checkpoint presentation do not exist.

- [ ] **Step 3: Implement one DOM workbench for every presentation profile**

```jsx
export default function WordWorkbench({ model, onInput, onReplayWholeWord }) {
  return (
    <section className="ss-workbench" aria-label={`Build ${model.word}`}>
      <button className="ss-replay" onClick={onReplayWholeWord} aria-label={`Hear ${model.word} again`} />
      <div role="group" aria-label={`Sound boxes for ${model.word}`}>
        {model.slots.map(slot => <SoundBox key={slot.id} slot={slot} />)}
      </div>
      <div className="ss-tile-rack" role="group" aria-label="Grapheme tiles">
        {model.rack.map(tile => <button key={tile.id} onClick={() => onInput({ type: "place_tile", tileId: tile.id })} aria-label={`${tile.label} grapheme tile`}>{tile.label}</button>)}
      </div>
    </section>
  );
}
```

Show target meaning without leaking an untaught decoding answer, a whole-word replay button, one box per authored unit, the current highlighted box, all prior placements, a stable rack with duplicate tile instances, correction state, and final sweep/blend. Use 56px minimum buttons, strong focus rings, live-region feedback that does not announce the answer early, reduced-motion alternatives, and responsive layouts at 320px/200% zoom. Do not make full and simplified workbenches separate components.

- [ ] **Step 4: Run unit and browser workbench checks**

Run: `node --test tests/unit/soundSeekersWordWorkbench.test.js`

Expected: PASS for the five fixtures, digraphs, split digraphs, repeated letters, wrong answers, and resume.

Run: `npx playwright test tests/browser/sound-seekers-word-workbench.spec.js --config=playwright.quest.config.js`

Expected: PASS for pointer, keyboard, reload, 320px, 200% zoom, and reduced motion.

- [ ] **Step 5: Commit the Word Workbench**

```bash
git add src/features/soundSeekers/ui/WordWorkbench.jsx src/features/soundSeekers/ui/WordWorkbench.css src/features/soundSeekers/ui/MeaningPayoff.jsx tests/unit/soundSeekersWordWorkbench.test.js tests/browser/sound-seekers-word-workbench.spec.js
git commit -m "feat: build persistent Sound Seekers workbench"
```

### Task 3: Build the checkpointed expedition mission reducer and persistent world state

**Files:**
- Create: `src/features/soundSeekers/engine/createChallenge.js`
- Create: `src/features/soundSeekers/engine/createMissionPlan.js`
- Create: `src/features/soundSeekers/engine/missionReducer.js`
- Create: `src/features/soundSeekers/engine/worldState.js`
- Create: `tests/unit/soundSeekersMissionReducer.test.js`
- Create: `tests/unit/soundSeekersWorldState.test.js`
- Create: `tests/unit/soundSeekersPlaythrough.test.js`

**Interfaces:**
- Consumes: the content plan's `getExpedition(stopId)`, `getConnectedText(sceneId)`, `getBiomeKit(chapterId)`, heart-word deck; foundation teach/director/evidence functions; Task 1 power registry.
- Produces: `createMissionPlan({stopId,state,seed,replayOrdinal})`, `createMissionState(plan,resume)`, `reduceMission(state,input,context)`, `checkpointMission(state)`, `deriveWorldState(campaign,biomeKit)`, and `completeMission(gameState,missionResult)`.

- [ ] **Step 1: Write failing expedition-loop, resume, and repair tests**

```js
test("a mission follows arrival, teach, use, deepen, wonder, transfer, payoff", () => {
  const plan = createMissionPlan({ stopId: "s1", state: freshState(), seed: 2, replayOrdinal: 0 });
  assert.deepEqual(plan.phases.map(phase => phase.kind), ["arrival", "teach", "challenge", "challenge", "wonder", "transfer", "payoff"]);
});

test("checkpoint resume keeps safe state but does not replay evidence", () => {
  const before = missionAfterOneCorrectForgePosition();
  const restored = createMissionState(before.plan, checkpointMission(before));
  assert.deepEqual(restored.activity.state.slots, before.activity.state.slots);
  assert.deepEqual(restored.pendingEvents, []);
});

test("completed repair and reward are idempotent across reload and replay", () => {
  const once = completeMission(freshState(), result("s1", "seed-lanterns", "lens-glow"));
  const twice = completeMission(once, result("s1", "seed-lanterns", "lens-glow"));
  assert.deepEqual(twice.trail.repairs, once.trail.repairs);
  assert.deepEqual(twice.rewards.claimedIds, once.rewards.claimedIds);
});
```

- [ ] **Step 2: Run mission tests and confirm the red state**

Run: `node --test tests/unit/soundSeekersMissionReducer.test.js tests/unit/soundSeekersWorldState.test.js tests/unit/soundSeekersPlaythrough.test.js`

Expected: FAIL because the mission planner and reducer do not exist.

- [ ] **Step 3: Implement the atomic mission state machine**

```js
export function reduceMission(state, input, context) {
  if (input.type === "resume") return { state: restoreSafeCheckpoint(state, input.checkpoint), events: [] };
  const phase = state.plan.phases[state.phaseIndex];
  const result = reducePhase(phase, state.activity, input, context);
  return advanceOnlyWhenComplete(state, result);
}
```

Arrival establishes a visible resident problem; teach is independently checkpointed; use and deepen invoke authored powers; wonder is a non-evidence set piece representing the construct; transfer uses word/text/novel application; payoff commits completed stop, repair, journal entry, relationship beat, and reward exactly once. Increment `journeyStep` exactly once in `completeMission`. Save after every completed learning loop. The checkpoint includes mission ID, attempt ID, seed, replay ordinal, phase/activity IDs, teach index, completed phase IDs, current power state, branch choices, collected IDs, and next decision ordinal. A restored correct position stays visible but never emits fresh evidence.

- [ ] **Step 4: Run deterministic full-route simulations**

Run: `node --test tests/unit/soundSeekersMissionReducer.test.js tests/unit/soundSeekersWorldState.test.js tests/unit/soundSeekersPlaythrough.test.js`

Expected: PASS for fresh, assisted-perfect, all-first-wrong, reload-every-phase, and two-route-circuit simulations; no simulation gets stuck and no motor action changes readiness.

- [ ] **Step 5: Commit the expedition engine**

```bash
git add src/features/soundSeekers/engine/createChallenge.js src/features/soundSeekers/engine/createMissionPlan.js src/features/soundSeekers/engine/missionReducer.js src/features/soundSeekers/engine/worldState.js tests/unit/soundSeekersMissionReducer.test.js tests/unit/soundSeekersWorldState.test.js tests/unit/soundSeekersPlaythrough.test.js
git commit -m "feat: add checkpointed Sound Seekers expeditions"
```

### Task 4: Build the single Phaser world scene and semantic action layer

**Files:**
- Create: `src/features/soundSeekers/runtime/SoundSeekersStage.jsx`
- Create: `src/features/soundSeekers/runtime/soundSeekersScene.js`
- Create: `src/features/soundSeekers/runtime/inputBridge.js`
- Create: `src/features/soundSeekers/runtime/sceneViewModel.js`
- Create: `src/features/soundSeekers/ui/ActionLayer.jsx`
- Create: `src/features/soundSeekers/ui/MissionHud.jsx`
- Create: `tests/unit/soundSeekersSceneViewModel.test.js`
- Create: `tests/unit/soundSeekersInputBridge.test.js`

**Interfaces:**
- Consumes: mission `scene` and `action` view models, biome kit layers, cast SVG sprites, motor assists, and `onInput(input)`.
- Produces: `<SoundSeekersStage model assists onInput />`, `createSoundSeekersScene(config)`, `createInputBridge({canvas,actionRoot,dispatch})`, and `<ActionLayer activity onInput />`.

- [ ] **Step 1: Write failing scene-salience and input-parity tests**

```js
test("scene view model keeps interactables above decorative contrast", () => {
  const view = createSceneViewModel({ biome: biome("forge-settlement"), activity: echoFixture, assists: {} });
  assert.ok(view.interactables.every(item => item.contrastPriority > view.decorationsMaxPriority));
  assert.equal(view.layers.length >= 3, true);
});

test("pointer, touch, keyboard, and switch focus dispatch the same semantic input", () => {
  const dispatched = inputParityTrace("confirm_candidate", "source-2");
  assert.deepEqual(dispatched.pointer, dispatched.touch);
  assert.deepEqual(dispatched.pointer, dispatched.keyboard);
  assert.deepEqual(dispatched.pointer, dispatched.switchFocus);
});
```

- [ ] **Step 2: Run renderer adapter tests and confirm the red state**

Run: `node --test tests/unit/soundSeekersSceneViewModel.test.js tests/unit/soundSeekersInputBridge.test.js`

Expected: FAIL because the scene and input adapters do not exist.

- [ ] **Step 3: Implement one renderer with presentation profiles**

```jsx
export function SoundSeekersStage({ model, assists, onInput }) {
  const canvasRef = useRef(null);
  useSoundSeekersScene(canvasRef, model.scene, assists, onInput);
  return (
    <div className="ss-stage" data-scene-profile={assists.simplifiedScene ? "simplified" : "full"}>
      <canvas ref={canvasRef} aria-hidden="true" />
      <ActionLayer activity={model.activity} onInput={onInput} />
    </div>
  );
}
```

Phaser `AUTO` hosts one scene in WebGL or Canvas. It renders three or more kit layers, persistent repaired landmarks, a matched avatar/resident cast, route material, interaction rings, task-camera changes, restrained particles, anticipation/contact/reaction poses, and reduced-motion replacements. The scene consumes world state and emits semantic navigation/probe/collection inputs only. The DOM action layer renders the instruction, cue replay, stable choices/workbench/sort bins/story actions, correction, and live feedback with no hidden completion controls. The input bridge maps WASD/arrows, pointer joystick, touch, enter/space, escape/back, focus navigation, and switch-style sequential activation without duplicate dispatch.

- [ ] **Step 4: Run renderer adapter tests and build**

Run: `node --test tests/unit/soundSeekersSceneViewModel.test.js tests/unit/soundSeekersInputBridge.test.js`

Expected: PASS, including one physical action/one dispatch and simplified-scene invariants.

Run: `npm run build`

Expected: PASS with one Sound Seekers runtime chunk and no eager Phaser load on unrelated routes.

- [ ] **Step 5: Commit the renderer and action layer**

```bash
git add src/features/soundSeekers/runtime src/features/soundSeekers/ui/ActionLayer.jsx src/features/soundSeekers/ui/MissionHud.jsx tests/unit/soundSeekersSceneViewModel.test.js tests/unit/soundSeekersInputBridge.test.js
git commit -m "feat: build unified Sound Seekers 2d stage"
```

### Task 5: Assemble the child game, campaign map, settings, journal, rewards, and preview route

**Files:**
- Create: `src/features/soundSeekers/SoundSeekersGame.jsx`
- Create: `src/features/soundSeekers/SoundSeekersRoute.jsx`
- Create: `src/features/soundSeekers/sound-seekers.css`
- Create: `src/features/soundSeekers/ui/CampaignMap.jsx`
- Create: `src/features/soundSeekers/ui/TeachAllSequence.jsx`
- Create: `src/features/soundSeekers/ui/RewardReveal.jsx`
- Create: `src/features/soundSeekers/ui/FieldJournal.jsx`
- Create: `src/features/soundSeekers/ui/SettingsSheet.jsx`
- Modify: `src/quest-preview.jsx`
- Modify: `preview/quest.jsx`
- Create: `tests/unit/soundSeekersGameContract.test.js`

**Interfaces:**
- Consumes: `loadQuestProgress`, `saveQuestProgress`, app audio/accessibility values, content catalogs, mission reducer, stage, and feature UI.
- Produces: `<SoundSeekersRoute progressScopeKey isSoundEnabled onExit initialStop initialPhase accessibilitySettings />` and `<SoundSeekersGame state onStateChange ... />`.

- [ ] **Step 1: Write failing orchestration and safe-save tests**

```js
test("game exposes one ordered view flow and saves after each learning loop", () => {
  const source = read("src/features/soundSeekers/SoundSeekersGame.jsx");
  assert.match(source, /CampaignMap/);
  assert.match(source, /TeachAllSequence/);
  assert.match(source, /SoundSeekersStage/);
  assert.match(source, /saveQuestProgress/);
  assert.doesNotMatch(source, /QuestPixelWorld|QuestTrail2D|QuestHub/);
});

test("preview seeds real v2 checkpoints rather than bypassing reducers", () => {
  const preview = createPreviewState({ stopId: "s4", phaseId: "primary", powerId: "word_forge" });
  assert.equal(preview.v, 2);
  assert.equal(preview.checkpoint.stopId, "s4");
  assert.equal(preview.checkpoint.powerId, "word_forge");
});
```

- [ ] **Step 2: Run the orchestration test and confirm the red state**

Run: `node --test tests/unit/soundSeekersGameContract.test.js`

Expected: FAIL because the new orchestrator and preview seeding do not exist.

- [ ] **Step 3: Implement the full route-owned game flow**

```jsx
export default function SoundSeekersRoute({ progressScopeKey, isSoundEnabled, onExit, initialStop, initialPhase, accessibilitySettings }) {
  const [state, setState] = useState(() => loadQuestProgress(progressScopeKey));
  const commit = useCallback(next => setState(saveQuestProgress(progressScopeKey, next)), [progressScopeKey]);
  return createPortal(<SoundSeekersGame state={state} onStateChange={commit} onExit={onExit} initialStop={initialStop} initialPhase={initialPhase} accessibilitySettings={accessibilitySettings} isSoundEnabled={isSoundEnabled} />, document.body);
}
```

The campaign map shows all eight chapters, visible repairs, the next authored problem, and resume. Teach-all, active expedition, wonder, payoff, journal, reward, settings, and exit are views within one game orchestrator. The HUD behaves as a trail tool rather than a quiz modal. Reward unlocks and journal pages are derived/idempotent; no currency is the primary stop purpose. Settings expose motor assists separately from learning support. Preview parameters seed a real plan/checkpoint so screenshot and browser tests exercise production code.

- [ ] **Step 4: Run contract, game engine, and build checks**

Run: `node --test tests/unit/soundSeekersGameContract.test.js tests/unit/soundSeekersMissionReducer.test.js tests/unit/soundSeekersWorldState.test.js tests/unit/soundSeekersPlaythrough.test.js`

Expected: PASS.

Run: `npm run build`

Expected: PASS without React hook warnings or missing asset URLs.

- [ ] **Step 5: Commit the complete child orchestrator**

```bash
git add src/features/soundSeekers/SoundSeekersGame.jsx src/features/soundSeekers/SoundSeekersRoute.jsx src/features/soundSeekers/sound-seekers.css src/features/soundSeekers/ui src/quest-preview.jsx preview/quest.jsx tests/unit/soundSeekersGameContract.test.js
git commit -m "feat: assemble the new Sound Seekers game"
```

### Task 6: Prove all six powers, accessibility modes, inputs, resume, and world change in the browser

**Files:**
- Create: `tests/browser/sound-seekers-six-powers.spec.js`
- Create: `tests/browser/sound-seekers-mission-resume.spec.js`
- Create: `tests/browser/sound-seekers-evidence-integrity.spec.js`
- Create: `tests/browser/sound-seekers-world-change.spec.js`
- Create: `tests/browser/sound-seekers-motor-assists.spec.js`
- Rewrite: `tests/browser/quest-accessibility.spec.js`
- Rewrite: `tests/browser/quest-input-collision.spec.js`
- Modify: `playwright.quest.config.js`

**Interfaces:**
- Consumes: production preview URLs for `stop`, `phase`, `power`, `profile`, `seed`, and `resumeAt`.
- Produces: behavioral release evidence from visible child interactions only.

- [ ] **Step 1: Write the browser matrix before changing runtime behavior**

```js
for (const power of ["echo_search", "contrast_sort", "word_forge", "blend_bridge", "memory_delivery", "story_power"]) {
  test(`${power} completes through its own visible interaction`, async ({ page }) => {
    await page.goto(`/quest-preview.html?stop=s1&power=${power}&seed=11`);
    await playPowerThroughVisibleControls(page, power);
    await expect(page.getByTestId("world-payoff")).toHaveAttribute("data-power", power);
  });
}

test("movement, timing, collection, and repair create zero literacy events", async ({ page }) => {
  await page.goto("/quest-preview.html?stop=s1&power=echo_search&seed=11");
  await moveProbeAndCollectWithoutConfirming(page);
  await expect(page.getByTestId("evidence-count")).toHaveText("0");
});
```

- [ ] **Step 2: Run the new browser matrix and confirm the red state**

Run: `npx playwright test tests/browser/sound-seekers-six-powers.spec.js tests/browser/sound-seekers-mission-resume.spec.js tests/browser/sound-seekers-evidence-integrity.spec.js tests/browser/sound-seekers-world-change.spec.js tests/browser/sound-seekers-motor-assists.spec.js tests/browser/quest-accessibility.spec.js tests/browser/quest-input-collision.spec.js --config=playwright.quest.config.js`

Expected: FAIL until all production-visible hooks and behaviors meet the matrix.

- [ ] **Step 3: Close only behavior gaps exposed by the matrix**

Add stable semantic test IDs only to states a child can already see. Cover exact visible/spoken instruction, cue lifecycle, per-position evidence, teach-all ordering, the correction transfer, repair persistence, reload during every power, pointer/touch/keyboard/switch focus parity, 56px targets, phone portrait/landscape, 320px width, 200% zoom, reduced motion, simplified scene, extended response, auto-travel, slower movement, and no-damage travel. Tests must not invoke hidden completion functions or write evidence directly.

- [ ] **Step 4: Run the runtime browser and unit gates together**

Run: `node --test tests/unit/soundSeekers*.test.js`

Expected: PASS with pristine output.

Run: `npx playwright test tests/browser/sound-seekers-*.spec.js tests/browser/quest-accessibility.spec.js tests/browser/quest-input-collision.spec.js --config=playwright.quest.config.js`

Expected: PASS in configured Chromium, Firefox, and WebKit projects when those projects are present; emulated WebKit remains distinct from physical-iPad proof.

- [ ] **Step 5: Commit behavioral game proof**

```bash
git add tests/browser/sound-seekers-six-powers.spec.js tests/browser/sound-seekers-mission-resume.spec.js tests/browser/sound-seekers-evidence-integrity.spec.js tests/browser/sound-seekers-world-change.spec.js tests/browser/sound-seekers-motor-assists.spec.js tests/browser/quest-accessibility.spec.js tests/browser/quest-input-collision.spec.js playwright.quest.config.js src/features/soundSeekers
git commit -m "test: prove Sound Seekers gameplay behavior"
```

# Sound Seekers v2 Game Runtime Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build one production 2D Sound Seekers runtime in which six genuinely different game actions directly perform the intended literacy work.

**Architecture:** Pure challenge and mission reducers own answers, evidence emissions, checkpoints, replay, and world state. One Phaser `AUTO` scene renders traversal and world transformations, while a synchronized semantic DOM action layer supplies readable instructions, focus order, switch/keyboard/touch/pointer control, and the persistent Word Workbench. Full, simplified, low-power, extended-response, and reduced-motion profiles change presentation or motor demand only; they use the same reducers and completion rules.

**Tech Stack:** React 19, Phaser 4 `AUTO`, CSS, Node `node:test`, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-01-sound-seekers-proper-educational-game-design.md`

**Required dependencies:** Complete the authored-content and art contracts in `docs/superpowers/plans/2026-09-01-sound-seekers-v2-content-and-art.md` before this runtime plan starts. This plan consumes its validated expeditions, connected text, biome kits, cast assets, pronunciation/meaning records, and required audio manifest; it must not invent stand-in content or assets. After the production route has replaced the legacy runtime and this plan's behavioral evidence passes, the dependent retirement and cleanup work belongs to `docs/superpowers/plans/2026-09-01-sound-seekers-v2-cutover-and-release.md`, not to a parallel legacy path here.

## Global Constraints

- `src/features/soundSeekers/SoundSeekersGame.jsx` is the sole production child-game orchestrator; PixelWorld, Trail2D, and QuestHub do not remain alternate child runtimes.
- The renderer never calculates learning correctness and child-facing view models never expose `isCorrect` or an answer key.
- One input emits at most one literacy decision; proximity, travel, timing, pickup, animation, repair, and reward inputs emit none.
- The six power IDs are exactly `echo_search`, `contrast_sort`, `word_forge`, `blend_bridge`, `memory_delivery`, and `story_power`.
- Each power owns a distinct initial state, valid inputs, reducer transitions, correction hook, completion rule, and checkpoint.
- Word Forge plays the whole word once and does not pre-say the answer sound before the first independent attempt.
- Word Forge and Blend Bridge consume the expedition's ordered `unitTargetIds`, already copied from canonical pronunciation-unit `evidenceTargetId` metadata. Runtime code never segments spelling or imports legacy `segmentWord`/`evidenceTargetFor` authority.
- Blend Bridge requires a final blend-to-meaning decision; grapheme activation alone does not complete it.
- Motor assistance never reveals, removes, narrows, or changes the literacy answer, evidence domain, support level, or completion threshold.
- Every required action is reachable with touch, pointer, keyboard, and switch-compatible focus; primary targets are at least 56 CSS pixels.
- At 320 CSS pixels and 200% zoom, the active instruction, cue replay, current task, and required controls remain usable without clipping.
- Reduced motion replaces movement with opacity, outline, and a clear final state; it does not remove cause-and-effect feedback.
- Reducers return frozen `{ state, events }` results. A recordable explicit answer may create at most one event through `createLiteracyDecision`; state transitions, timing, travel, collision, collection, animation, repair, and rewards create none.
- `challengeContract.js`, `evidence.js`, and `questMastery.js` remain the shared validity, practice-ledger, and numeric-readiness authorities. Runtime code must use `toChildChallengeView`, `createLiteracyDecision`, and `appendEvidence`; it must not reconstruct those contracts or calculate mastery.
- Every event is immutable practice evidence with the deterministic ID `${attemptId}:${ordinal}`, a valid child-local `sessionDay`, normalized `at`, `journeyStep`, `support`, and audio-delivery metadata. It cannot set a formal assessment or `SECURE` status, and required audio is independent only when delivery is completed with zero support and no reveal.
- Generated browser traces, screenshots, videos, and run summaries belong under ignored `.artifacts/sound-seekers-v2/`, never under `docs/` or in a task commit.
- Preview requests resolve through one canonical authored fixture map. A stop/phase/power triple that is not present in the expedition catalog is an error state that cannot create, complete, persist, or emit evidence; tests never pair every power arbitrarily with `s1`.

The runtime validates exact authored decision tuples, never a one-domain-per-power map. The current required tuples are: `echo-search-find-source/echo_search/reveal_matching_grapheme/phoneme_to_grapheme`; Contrast Sort `contrast-sort-place-sound/contrast_sort/place_sound_token/grapheme_to_phoneme`, `contrast-sort-place-decoded-word/contrast_sort/place_decoded_word_token/word_decoding`, and `contrast-sort-place-heart-word/contrast_sort/place_heart_word_token/heart_word_mapping`; `word-forge-place-tile/word_forge/place_grapheme_tile/word_segmentation_encoding`; Blend Bridge `blend-bridge-choose-meaning/blend_bridge/choose_blended_meaning/word_decoding` and `blend-bridge-choose-novel-meaning/blend_bridge/choose_novel_decoded_meaning/novel_decoding`; Memory Delivery `memory-delivery-deliver-sound/memory_delivery/deliver_sound_cue/phoneme_to_grapheme`, `memory-delivery-deliver-decoded-word/memory_delivery/deliver_decoded_word_cue/word_decoding`, `memory-delivery-deliver-heart-word/memory_delivery/deliver_heart_word_cue/heart_word_mapping`, and `memory-delivery-follow-decoded-instruction/memory_delivery/follow_decoded_instruction/connected_text_transfer`; and `story-power-choose-story-action/story_power/choose_story_action/connected_text_transfer`.

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
- Consumes: `validateQuestChallenge`/`isRecordableQuestChallenge`, `toChildChallengeView`, `createLiteracyDecision`, `appendEvidence`, Task 1 foundation correction records, Task 2 content-deck records already chosen by the mission/challenge factory, and deterministic integer seeds. A reducer context supplies only the current validated challenge, `attemptId`, next immutable `ordinal`, `journeyStep`, trusted child-local `sessionDay`, support state, audio-delivery status, and a deterministic `now`; it never receives motor or device telemetry.
- Produces: frozen `SOUND_POWER_REGISTRY` entries implementing `createState(challenge,{seed,resume})`, `reduce(state,input,context) -> Object.freeze({ state, events })`, `view(state,challenge,assists)`, and `checkpoint(state)`; also `createReplayVariant(deck,seed,replayOrdinal)` and `normalizeMotorAssists(raw)`. `view` must derive through `toChildChallengeView` and omit `expectedToken`, `isCorrect`, answer keys, internal IDs, and correction flags.
- A reducer accepts only a challenge whose `(instructionId,powerId,expectedAction,recordsDomain)` equals one current instruction contract. Contrast Sort therefore supports its three exact variants, Memory Delivery its four, and Blend Bridge its ordinary plus novel-boss variants. A decision has exactly one declared domain and no completed word or mission fans out credit to another position, target, or domain.

- [ ] **Step 1: Write failing behavioral-distinction and invariance tests**

```js
test("every exact authored decision variant completes only with its own transcript", () => {
  const required = Object.values(SOUND_SEEKERS_INSTRUCTIONS).filter(item => item.phase === "decision");
  assert.deepEqual(authoredDecisionVariantFixtures.map(item => pickDecisionTuple(item)), required.map(pickDecisionTuple));
  for (const fixture of authoredDecisionVariantFixtures) {
    assert.equal(playVariant(fixture, fixture.positiveTranscript).state.status, "complete");
    assert.equal(playVariant(fixture, fixture.positiveTranscript).events.length, fixture.expectedDecisionCount);
    for (const foreign of authoredDecisionVariantFixtures.filter(item => item.id !== fixture.id)) {
      assert.notEqual(playVariant(fixture, foreign.positiveTranscript).state.status, "complete");
    }
  }
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

test("only explicit answers emit one immutable practice event with truthful attempt metadata", () => {
  for (const [powerId, fixture] of Object.entries(fixtures)) {
    const result = playUntilFirstDecision(powerId, fixture, contextFor({
      attemptId: fixture.attemptId, ordinal: 0, sessionDay: "2026-09-01", now: "2026-09-01T09:00:00.000Z"
    }));
    assert.equal(result.events.length, 1);
    assert.equal(result.events[0].id, `${fixture.attemptId}:0`);
    assert.equal(result.events[0].evidenceKind, "practice");
    assert.equal(Object.isFrozen(result.events[0]), true);
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

Implement these decision points through the evidence API only. A reducer validates its authored challenge before creating state, calls `createLiteracyDecision` only for its named explicit answer input, increments the ordinal only when that factory returns an event, and uses `appendEvidence` at the mission boundary to deduplicate immutable IDs:

- Echo Search: exploration/probe reveals stable candidates; an explicit candidate confirmation emits the `phoneme_to_grapheme` decision and uncovers the world source.
- Contrast Sort: four to six stable items remain until every reversible placement is complete. Its exact instruction selects sound-to-bin (`grapheme_to_phoneme`), decoded-word-pattern (`word_decoding`), or heart-pattern (`heart_word_mapping`) input; a transcript for either sibling variant is rejected.
- Word Forge: each stable-rack tile placement emits one `word_segmentation_encoding` position decision; slots and duplicate physical tiles persist; completion transitions to an explicit sweep/read payoff.
- Blend Bridge: ordered segment activation plays support audio but emits no correctness; the ordinary final meaning destination emits `word_decoding`, while only `blend-bridge-choose-novel-meaning` in an authored controlled boss emits `novel_decoding`. Each rejects the other's final-action transcript.
- Memory Delivery: cue receipt/replay and travel emit nothing; the exact instruction selects delivery of a remembered sound (`phoneme_to_grapheme`), decoded word (`word_decoding`), heart word (`heart_word_mapping`), or decoded instruction (`connected_text_transfer`). The answer is absent from the travel overlay and sibling-variant transcripts are rejected.
- Story Power: only an authored text-supported response emits `connected_text_transfer`; `narrative_choice` branches persist but emit no correctness. The distinct authored controlled novel-decoding boss in the mission plan uses a real controlled word by default and emits one `novel_decoding` decision, never a decorative reskin of Story Power. An imaginary name is permitted only under the content plan's reviewed authored exception.

Replay must preserve target and pronunciation while changing only audited content IDs, candidate positions, route IDs, recipients, and set-piece variant. The same seed and ordinal reproduce the same variant; a deck exhausts before repeating. Do not use reaction windows for correctness.

The reducer registry does not schedule deck content. `createMissionPlan.js`/`createChallenge.js` pass one result from the content plan's `serveContentDeck()`, and the owning reducer checks that result's category and consumer contract: `memoryDelivery` accepts `heartWords` and implements distinct transcripts for `recognition`, `heart_part_mapping`, `encoding`, and `sentence_use`; `storyPower` accepts `stories`; `contrastSort` accepts `alternatives`; `wordForge` accepts `morphology`; and a transfer challenge accepts only its authored record's named power/domain. Each accepted result is returned to the mission transaction for exactly one `recordContentDeckUse()` call; reducers never mutate deck state themselves.

- [ ] **Step 4: Run reducer, replay, assist, evidence, and correction tests**

Run: `node --test tests/unit/soundSeekersPowerReducers.test.js tests/unit/soundSeekersReplayDeck.test.js tests/unit/soundSeekersMotorAssists.test.js tests/unit/soundSeekersEvidence.test.js tests/unit/questCorrection.test.js`

Expected: PASS with one positive trace for every derived decision contract, every positive cross-variant rejection (including siblings sharing a power), exact tuple/domain evidence, frozen child-safe views, and no motor evidence.

- [ ] **Step 5: Commit the Sound Power engine**

```bash
git add src/features/soundSeekers/engine/powers/contracts.js src/features/soundSeekers/engine/powers/echoSearch.js src/features/soundSeekers/engine/powers/contrastSort.js src/features/soundSeekers/engine/powers/wordForge.js src/features/soundSeekers/engine/powers/blendBridge.js src/features/soundSeekers/engine/powers/memoryDelivery.js src/features/soundSeekers/engine/powers/storyPower.js src/features/soundSeekers/engine/powers/index.js src/features/soundSeekers/engine/replayDeck.js src/features/soundSeekers/engine/motorAssists.js tests/unit/soundSeekersPowerReducers.test.js tests/unit/soundSeekersReplayDeck.test.js tests/unit/soundSeekersMotorAssists.test.js
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
```

Keep the browser interaction in this task in-memory. A real route reload is deferred to Task 6, after Task 3 owns checkpoint normalization and Task 5 owns the v2 store route.

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

Show target meaning without leaking an untaught decoding answer, a whole-word replay button, one box per authored unit, the current highlighted box, all prior placements, a stable rack with duplicate tile instances, correction state, and final sweep/blend. Assert that Word Forge plays only the whole-word cue on its explicit replay control, never pre-says the answer sound before the first independent placement, and records required-audio completion truthfully in the reducer context. Use 56px minimum buttons, strong focus rings, live-region feedback that does not announce the answer early, reduced-motion alternatives, and responsive layouts at 320px/200% zoom. Do not make full and simplified workbenches separate components.

- [ ] **Step 4: Run unit and browser workbench checks**

Run: `node --test tests/unit/soundSeekersWordWorkbench.test.js`

Expected: PASS for the five fixtures, digraphs, split digraphs, repeated letters, wrong answers, and resume.

Run: `npx playwright test tests/browser/sound-seekers-word-workbench.spec.js --config=playwright.quest.config.js`

Expected: PASS for pointer, keyboard, exact whole-word replay/no first-attempt answer leak, 320px, 200% zoom, and reduced motion. Reload proof is a Task 6 production-route test.

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
- Modify: `src/features/soundSeekers/engine/stateV2.js`
- Create: `tests/unit/soundSeekersMissionReducer.test.js`
- Create: `tests/unit/soundSeekersWorldState.test.js`
- Create: `tests/unit/soundSeekersPlaythrough.test.js`

**Interfaces:**
- Consumes: the content plan's `getExpedition(stopId)`, `getConnectedText(sceneId)`, `getBiomeKit(chapterId)`, `createReviewTargetSequence()`, and five-category `serveContentDeck()`/`recordContentDeckUse()`/checkpoint-resume APIs; foundation teach/director/evidence functions; Task 1 power registry.
- Produces: `createMissionPlan({stopId,state,seed,replayOrdinal})`, `createMissionState(plan,resume)`, `reduceMission(state,input,context)`, `checkpointMission(state)`, `deriveWorldState(campaign,biomeKit)`, and `completeMission(gameState,missionResult)`. Task 3 is the sole transaction authority that appends reducer events to v2 state, advances a phase/mission, derives confusion/reporting context, and applies idempotent repair/journal/reward effects.

- [ ] **Step 1: Write failing expedition-loop, resume, and repair tests**

```js
test("a mission follows arrival, teach, use, deepen, wonder, transfer, payoff", () => {
  const plan = createMissionPlan({ stopId: "s1", state: freshState(), seed: 2, replayOrdinal: 0 });
  assert.deepEqual(plan.phases.filter(phase => phase.kind !== "content_opportunity").map(phase => phase.kind), ["arrival", "teach", "challenge", "challenge", "wonder", "transfer", "payoff"]);
  assert.deepEqual(plan.phases.filter(phase => phase.kind === "content_opportunity").map(phase => phase.id), ["s1-heart-1", "s1-heart-2"]);
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

test("an atomic answer append advances once without duplicate evidence or cross-target credit", () => {
  const once = reduceMission(activeForgeMission(), forgeAnswer(), context);
  const retried = reduceMission(once.state, forgeAnswer(), context);
  assert.deepEqual(retried.state.evidence, once.state.evidence);
  assert.equal(once.state.evidence.at(-1).id, "attempt-s1-forge:0");
  assert.deepEqual(creditedTargets(once.state.evidence), ["ship:position-0"]);
});

test("review stops and every deck category resume with the same next authored content", () => {
  for (const stopId of ["s8", "s17"]) {
    const plan = createMissionPlan({ stopId, state: practicedState(), seed: 19, replayOrdinal: 0 });
    assert.deepEqual(plan.review.targetIds, createReviewTargetSequence({
      stopId, state: practicedState(), seed: 19, count: plan.review.slotCount
    }).targetIds);
    assert.equal(plan.review.targetIds.every(id => taughtStrictlyBefore(id, stopId)), true);
  }
  for (const category of CONTENT_DECK_CATEGORIES) {
    assertNextServeMatchesAfterMissionCheckpoint(category);
  }
});

test("a real forty-stop mission run serves and records every heart-word opportunity without replacing phase powers", () => {
  let game = freshState();
  const words = new Set(), activities = new Set(), visits = new Set();
  for (const expedition of SOUND_SEEKERS_EXPEDITIONS) {
    const originalPhaseTuples = new Map(expedition.phases.filter(item => item.powerId).map(item => [item.id, pickDecisionTuple(item)]));
    const plan = createMissionPlan({ stopId: expedition.stopId, state: game, seed: expedition.stopIndex, replayOrdinal: 0 });
    const completed = playMissionThroughPublicReducers(plan, game);
    game = completeMission(game, completed);
    for (const opportunity of completed.contentOpportunities) {
      visits.add(opportunity.visitId); words.add(opportunity.recordId); activities.add(opportunity.activityType);
      assert.equal(game.evidence.some(event => event.contentVisitId === opportunity.visitId && event.domain === "heart_word_mapping"), true);
    }
    for (const [phaseId, tuple] of originalPhaseTuples) assert.deepEqual(pickDecisionTuple(plan.phases.find(item => item.id === phaseId)), tuple);
  }
  assert.equal(visits.size, 80);
  assert.equal(words.size, 60);
  assert.deepEqual(activities, new Set(HEART_WORD_ACTIVITY_TYPES));
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

Arrival establishes a visible resident problem; teach is independently checkpointed; use and deepen invoke authored powers; wonder is a non-evidence set piece representing the construct; transfer uses word/text/novel application; payoff commits completed stop, repair, journal entry, relationship beat, and reward exactly once. `createMissionPlan` resolves `s8`/`s17` only through `createReviewTargetSequence()` and selects content only through `serveContentDeck()` for a phase's declared category/slot. It inserts each of the expedition's two heart-word opportunity records immediately after its authored `afterPhaseId` as its own stop-qualified `content_opportunity` subphase using the exact Memory Delivery heart-word tuple; it never mutates or replaces the parent phase's power or tuple. It routes `heartWords` to Memory Delivery, `stories` to Story Power, `alternatives` to the record's exact Contrast Sort variant, `morphology` to Word Forge, and `transfer` to its record's exact named tuple, including Blend Bridge novel bosses; an invalid producer/consumer pairing fails before a child view is created. `reduceMission` atomically appends only the returned immutable event through `appendEvidence`, calls `recordContentDeckUse()` exactly once for the accepted result, advances its phase, derives confusion/reporting context from the ledger, and applies effects; a duplicate event or visit ID is a no-op and a completion may not credit other positions, targets, domains, or decks. Increment `journeyStep` exactly once in `completeMission`. Save after every completed learning loop. Extend `stateV2.normalizeCheckpoint` with a content-versioned, allowlisted checkpoint schema: mission/stop ID, attempt ID, seed, replay ordinal, exact stop-qualified phase/activity IDs, teach index, completed phase IDs, current power state, branch choices, collected IDs, content-deck checkpoint/selected visit ID, next decision ordinal, and no answer key or pending/replayable event. Invalid, incompatible, or stale checkpoints normalize to `null`. A restored correct position stays visible but never emits fresh evidence or re-records deck use.

- [ ] **Step 4: Run deterministic full-route simulations**

Run: `node --test tests/unit/soundSeekersMissionReducer.test.js tests/unit/soundSeekersWorldState.test.js tests/unit/soundSeekersPlaythrough.test.js tests/unit/soundSeekersStateV2.test.js`

Expected: PASS for fresh, assisted-perfect, all-first-wrong, reload-every-phase, two-route-circuit, and the real 40-stop/80-opportunity campaign simulation; all 60 heart words and four activity types are served and recorded without any parent phase power being overridden, no simulation gets stuck, and no motor action changes readiness.

- [ ] **Step 5: Commit the expedition engine**

```bash
git add src/features/soundSeekers/engine/createChallenge.js src/features/soundSeekers/engine/createMissionPlan.js src/features/soundSeekers/engine/missionReducer.js src/features/soundSeekers/engine/worldState.js src/features/soundSeekers/engine/stateV2.js tests/unit/soundSeekersMissionReducer.test.js tests/unit/soundSeekersWorldState.test.js tests/unit/soundSeekersPlaythrough.test.js
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
- Create: `tests/unit/soundSeekersStageLifecycle.test.js`

**Interfaces:**
- Consumes: mission `scene` and `action` view models, biome kit layers, cast SVG sprites, motor assists, and `onInput(input)`.
- Produces: `<SoundSeekersStage model assists onInput />`, `createSoundSeekersScene(config)`, `createInputBridge({canvas,actionRoot,dispatch})`, and `<ActionLayer activity onInput />`. The stage owns one guarded Phaser instance per mounted canvas; the semantic DOM layer remains the accessible action authority and usable fallback.

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

test("stage mount, Strict Mode remount, model changes, and unmount create no duplicate scene or dispatch", () => {
  const trace = lifecycleTrace({ strictMode: true, replaceModel: true, unmount: true });
  assert.deepEqual(trace, { created: 2, destroyed: 2, activeListeners: 0, duplicateDispatches: 0 });
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

Phaser `AUTO` hosts one scene in WebGL or Canvas. Create it only after the browser canvas ref exists; retain model/input callbacks in refs, update the instance without reconstructing it on every React render, remove every Phaser/DOM listener and call `destroy(true)` on cleanup, and guard late callbacks after unmount. Under React Strict Mode, a remount may create a fresh scene only after the old scene is destroyed. If Phaser initialization or the canvas renderer fails, retain the semantic DOM action layer and an explicit non-canvas scene summary; never leave a blank or trapped child surface. It renders three or more kit layers, persistent repaired landmarks, a matched avatar/resident cast, route material, interaction rings, task-camera changes, restrained particles, anticipation/contact/reaction poses, and reduced-motion replacements. The scene consumes world state and emits semantic navigation/probe/collection inputs only. The DOM action layer renders the instruction, cue replay, stable choices/workbench/sort bins/story actions, correction, and live feedback with no hidden completion controls. The input bridge maps WASD/arrows, pointer joystick, touch, enter/space, escape/back, focus navigation, and switch-style sequential activation to the same semantic input, deduplicates one physical action, and never makes canvas hit-testing the only path to a learning action.

- [ ] **Step 4: Run renderer adapter tests and build**

Run: `node --test tests/unit/soundSeekersSceneViewModel.test.js tests/unit/soundSeekersInputBridge.test.js tests/unit/soundSeekersStageLifecycle.test.js`

Expected: PASS, including one physical action/one dispatch and simplified-scene invariants.

Run: `npm run build`

Expected: PASS with one Sound Seekers runtime chunk and no eager Phaser load on unrelated routes.

- [ ] **Step 5: Commit the renderer and action layer**

```bash
git add src/features/soundSeekers/runtime/SoundSeekersStage.jsx src/features/soundSeekers/runtime/soundSeekersScene.js src/features/soundSeekers/runtime/inputBridge.js src/features/soundSeekers/runtime/sceneViewModel.js src/features/soundSeekers/ui/ActionLayer.jsx src/features/soundSeekers/ui/MissionHud.jsx tests/unit/soundSeekersSceneViewModel.test.js tests/unit/soundSeekersInputBridge.test.js tests/unit/soundSeekersStageLifecycle.test.js
git commit -m "feat: build unified Sound Seekers 2d stage"
```

### Task 5: Assemble the child game, campaign map, settings, journal, rewards, and preview route

**Files:**
- Create: `src/features/soundSeekers/SoundSeekersGame.jsx`
- Create: `src/features/soundSeekers/SoundSeekersRoute.jsx`
- Create: `src/features/soundSeekers/runtime/soundSeekersProgressController.js`
- Create: `src/features/soundSeekers/runtime/useSoundSeekersProgressController.js`
- Create: `src/features/soundSeekers/preview/previewFixtures.js`
- Create: `src/features/soundSeekers/sound-seekers.css`
- Create: `src/features/soundSeekers/ui/CampaignMap.jsx`
- Create: `src/features/soundSeekers/ui/TeachAllSequence.jsx`
- Create: `src/features/soundSeekers/ui/RewardReveal.jsx`
- Create: `src/features/soundSeekers/ui/FieldJournal.jsx`
- Create: `src/features/soundSeekers/ui/SettingsSheet.jsx`
- Create: `src/features/soundSeekers/ui/CreatorSheet.jsx`
- Modify: `src/components/AppSurface.jsx`
- Modify: `src/components/StudentSoundTrailPage.jsx`
- Modify: `src/utils/questStore.js`
- Modify: `src/features/soundSeekers/engine/stateV2.js`
- Modify: `src/quest-preview.jsx`
- Modify: `preview/quest.jsx`
- Create: `tests/unit/soundSeekersGameContract.test.js`
- Create: `tests/unit/soundSeekersCreatorIntegration.test.js`
- Create: `tests/unit/soundSeekersProgressController.test.js`
- Create: `tests/unit/soundSeekersPreviewFixtures.test.js`
- Create: `tests/browser/sound-seekers-persistence-controller.spec.js`

**Interfaces:**
- Consumes: `loadSoundSeekersV2Progress`, `saveSoundSeekersV2Progress`, `questProgressStorageKey`, `computeHydratedValue("phonics_quest","__all__",...)`, `normalizeAllowlistedSettings`, `createCharacterAppearance`, `<SoundSeekersCharacterCreator>`, the shared `<SoundSeekersCharacter>`, app audio/accessibility values, content catalogs, mission reducer, stage, and feature UI. `loadQuestProgress`/`saveQuestProgress` remain the legacy `QuestRoot` bridge only until the separate cutover-and-release plan removes its last consumer.
- Produces: `createSoundSeekersProgressController({ progressScopeKey, load, save, eventTarget, storage })`, `reconcileSoundSeekersHydration(current,stored,{resetApplied})`, `useSoundSeekersProgressController(progressScopeKey)`, `<SoundSeekersRoute progressScopeKey isSoundEnabled onExit initialFixtureId accessibilitySettings />`, `<SoundSeekersGame state onStateChange ... />`, `SOUND_SEEKERS_PREVIEW_FIXTURES`, `resolveSoundSeekersPreviewFixture(request)`, and `<CreatorSheet appearance onChange />`.
- The controller is the sole v2 route persistence owner. Its public instance has `getSnapshot()`, `subscribe(listener)`, `commit(update,{flush})`, `flush()`, and `dispose()`. It loads once per scope and writes through `saveSoundSeekersV2Progress`. The real `lp-progress-hydrated` event is a notification shaped `{ studentId, rows, resetApplied }`; it does not carry a trusted `stored` payload. Accept it only when `String(detail.studentId)` exactly equals the active `progressScopeKey`, then re-read normalized v2 state with `loadSoundSeekersV2Progress(progressScopeKey)` from `questProgressStorageKey(progressScopeKey)`. Replace current state with that re-read value when `resetApplied === true`; otherwise reconcile current and re-read stored state through `computeHydratedValue("phonics_quest","__all__",...)`. For cross-tab sync, accept only a real `StorageEvent` whose `key` equals that exact scoped key, whose `storageArea` is the active `window.localStorage`, and whose `newValue` is non-null; then re-read through the same v2 loader and reconcile. Ignore wrong-student hydration, wrong-key/wrong-storage-area storage events, old-scope callbacks after a scope change, and all callbacks after disposal. Flush the current safe checkpoint on unmount/scope change and never synthesize evidence. The teacher assignment is accepted only from the normalized stored/hydrated payload, survives local commit/reload/cross-tab merge, and remains stripped from child cloud uploads by the existing sanitizer; it is not a route prop or child-owned field.
- This task owns the actual production-route switch. When it commits, the production `renderQuest` branch lazy-loads `SoundSeekersRoute`; the cutover plan only verifies that fact and records the manifest. It must not perform a second route switch or require `QuestRoot` to be present.

- [ ] **Step 1: Write failing orchestration and safe-save tests**

```js
test("the production student route mounts the v2 game and persists each completed loop through the v2 store", () => {
  const app = renderStudentPhonicsQuest({ progressScopeKey: "student-1" });
  await app.getByRole("button", { name: "Begin expedition" }).click();
  await completeVisibleLearningLoop(app);
  assert.equal(v2StoreCalls.load, 1);
  assert.equal(v2StoreCalls.save, 1);
  assert.equal(v2StoreCalls.lastState.v, 2);
  assert.equal(app.queryByTestId("legacy-quest-root"), null);
});

test("preview persistence fixture resolves the real authored s1 Word Forge tuple", () => {
  const authored = getExpedition("s1").phases.find(phase => phase.id === "s1-secondary");
  assert.deepEqual(
    pickAuthoredFixtureIds(authored),
    { stopId: "s1", phaseId: "s1-secondary", powerId: "word_forge", contentId: "mat" }
  );
  const fixture = resolveSoundSeekersPreviewFixture({ fixtureId: "s1-secondary-word-forge" });
  assert.deepEqual(
    pickAuthoredFixtureIds(fixture),
    { stopId: "s1", phaseId: "s1-secondary", powerId: "word_forge", contentId: "mat" }
  );
  assertAuthoredStopPhaseContentTuple(fixture);
  const preview = createPreviewState({ fixtureId: fixture.id });
  assert.equal(preview.v, 2);
  assert.equal(preview.checkpoint.stopId, "s1");
  assert.equal(preview.checkpoint.phaseId, "s1-secondary");
  assert.equal(preview.checkpoint.powerId, "word_forge");
  assert.equal(preview.checkpoint.contentId, "mat");
});

test("saved creator appearance renders identically in the creator and expedition world", () => {
  const route = renderSoundSeekersWithAppearance({
    bodyShapeId: "round-scout",
    paletteTokenId: "river-gardens",
    accessoryIds: ["trail-satchel", "leaf-pin"]
  });
  assert.equal(route.creatorPreview.dataset.appearanceSignature, route.worldAvatar.dataset.appearanceSignature);
  assert.equal(route.savedState.settings.characterAppearance.bodyShapeId, "round-scout");
  assert.equal(route.evidence.length, 0);
});

test("child commits cannot replace or clear the teacher-owned assignment", () => {
  const controller = createControllerWithStoredV2({ assignment: validTeacherAssignment() });
  controller.commit({ ...stateWithOnePracticeEvent(controller.getSnapshot()), assignment: attackerAssignment() });
  assert.deepEqual(controller.getSnapshot().assignment, validTeacherAssignment());
  controller.commit({ assignment: null });
  assert.deepEqual(controller.getSnapshot().assignment, validTeacherAssignment());
});

test("the real hydration notice re-reads exact scoped storage, reconciles, and replaces on reset", () => {
  const scope = "student-1";
  const controller = createControllerWithStoredV2(scope, { assignment: validTeacherAssignment() });
  writeV2AtKey(questProgressStorageKey(scope), concurrentV2DeckState({ assignment: replacementTeacherAssignment() }));
  dispatchHydrated({ studentId: scope, rows: [{ area: "phonics_quest", key: "__all__" }], resetApplied: false });
  assert.deepEqual(lastV2Load(), { scopeKey: scope, storageKey: questProgressStorageKey(scope) });
  assert.deepEqual(controller.getSnapshot().assignment, replacementTeacherAssignment());

  const beforeStaleNotice = controller.getSnapshot();
  dispatchHydrated({ studentId: "student-2", rows: [], resetApplied: true });
  assert.strictEqual(controller.getSnapshot(), beforeStaleNotice);

  const reset = freshResetV2({ assignment: null });
  writeV2AtKey(questProgressStorageKey(scope), reset);
  dispatchHydrated({ studentId: scope, rows: [{ area: "phonics_quest", key: "__all__" }], resetApplied: true });
  assert.deepEqual(controller.getSnapshot(), normalizeSoundSeekersState(reset));
  assert.equal(controller.getSnapshot().assignment, null);
  controller.commit(stateWithOnePracticeEvent(controller.getSnapshot()));
  assert.equal(lastCloudUploadHas("assignment"), false);
});

test("a real StorageEvent reconciles only its exact key, value, storage area, and live scope", async ({ page }) => {
  await mountV2Controller(page, { progressScopeKey: "student-1" });
  await page.evaluate(({ key, value }) => {
    window.localStorage.setItem(key, value);
    window.dispatchEvent(new StorageEvent("storage", {
      key,
      newValue: value,
      storageArea: window.localStorage
    }));
  }, { key: questProgressStorageKey("student-1"), value: JSON.stringify(concurrentV2DeckState()) });
  await expectV2State(page, reconcileExpectedState());
  await dispatchWrongKeyWrongStorageAndOldScopeEvents(page);
  await expectV2State(page, reconcileExpectedState());
});

test("preview has one canonical authored stop phase content fixture per decision-contract variant", () => {
  const required = Object.values(SOUND_SEEKERS_INSTRUCTIONS).filter(item => item.phase === "decision");
  assert.deepEqual(SOUND_SEEKERS_PREVIEW_FIXTURES.map(pickDecisionTuple), required.map(pickDecisionTuple));
  for (const fixture of SOUND_SEEKERS_PREVIEW_FIXTURES) {
    assert.equal(resolveSoundSeekersPreviewFixture({ fixtureId: fixture.id }), fixture);
    assert.match(fixture.phaseId, new RegExp(`^${fixture.stopId}-`));
    assert.ok(fixture.contentId);
    assertAuthoredStopPhaseContentTuple(fixture);
  }
  assert.throws(() => resolveSoundSeekersPreviewFixture({ stopId: "s1", phaseId: "s1-primary", powerId: "story_power" }));
});
```

- [ ] **Step 2: Run the orchestration test and confirm the red state**

Run: `node --test tests/unit/soundSeekersGameContract.test.js tests/unit/soundSeekersCreatorIntegration.test.js tests/unit/soundSeekersProgressController.test.js tests/unit/soundSeekersPreviewFixtures.test.js`

Expected: FAIL because the new orchestrator, real v2 persistence controller, and canonical preview fixture map do not exist.

- [ ] **Step 3: Implement the full route-owned game flow**

```jsx
export default function SoundSeekersRoute({ progressScopeKey, isSoundEnabled, onExit, initialFixtureId, accessibilitySettings }) {
  const { state, commitState } = useSoundSeekersProgressController(progressScopeKey);
  return createPortal(<SoundSeekersGame state={state} onStateChange={commitState} onExit={onExit} initialFixtureId={initialFixtureId} accessibilitySettings={accessibilitySettings} isSoundEnabled={isSoundEnabled} />, document.body);
}
```

Replace the production `AppSurface`/`StudentSoundTrailPage` `renderQuest` branch with the lazy `SoundSeekersRoute`, carrying the existing scope key, app sound preference, accessibility settings, and return-to-trail behavior. This is the sole production switch: the unit contract must fail before the branch changes and pass only when a first production visit mounts v2 without a `QuestRoot`. Retain the full-screen portal deliberately, but on open move focus to the new route's labelled main/action heading; on exit, restore focus to the initiating trail control, and do not let a canvas steal focus from the semantic action layer. The campaign map shows all eight chapters, visible repairs, the next authored problem, and resume. Teach-all, active expedition, wonder, payoff, journal, reward, creator, settings, and exit are views within one game orchestrator. The HUD behaves as a trail tool rather than a quiz modal. Reward unlocks and journal pages are derived/idempotent; no currency is the primary stop purpose.

`CreatorSheet` exposes every SS-19 body, palette, and accessory option from Task 4, previews through `<SoundSeekersCharacter>`, and persists the normalized selection as the cosmetic-only `settings.characterAppearance`. The expedition scene passes that same normalized object to the same component and exposes the same `appearanceSignature`; it must not copy SVG markup or maintain a parallel Phaser-only avatar definition. Changing appearance emits no evidence and leaves challenges, answers, motor assists, difficulty, repair, reward, and readiness unchanged.

Settings expose motor assists separately from learning support, and `stateV2.normalizeAllowlistedSettings` must add and validate only the named runtime presentation/motor fields (`autoTravel`, `slowerMovement`, `noDamageTravel`, `largerTargets`, `simplifiedScene`, and `extendedResponse`) plus the schema-checked cosmetic `characterAppearance`, without accepting learning support, answer, evidence, or mastery fields. `previewFixtures.js` authors one fixture for every current recordable decision-contract tuple, each pointing to one actual expedition stop, exact stop-qualified phase/subphase ID, content ID/slot, instruction, power, expected action, and domain. This necessarily includes all three Contrast Sort variants, all four Memory Delivery variants, both Blend Bridge variants including the novel-decoding boss, and the other three contracts. It validates every fixture against exact expedition and content-catalog foreign keys, and positive/cross-variant tests reject any sibling transcript even when `powerId` matches. Preview accepts `fixtureId`; redundant `stop`/`phase`/`power` parameters must match that fixture exactly. Any unknown or mismatched request renders an explicit non-playable error with no save/evidence. Valid preview parameters seed the fixture's real plan/checkpoint so screenshot and browser tests exercise production code.

- [ ] **Step 4: Run contract, game engine, and build checks**

Run: `node --test tests/unit/soundSeekersGameContract.test.js tests/unit/soundSeekersCreatorIntegration.test.js tests/unit/soundSeekersProgressController.test.js tests/unit/soundSeekersPreviewFixtures.test.js tests/unit/soundSeekersMissionReducer.test.js tests/unit/soundSeekersWorldState.test.js tests/unit/soundSeekersPlaythrough.test.js tests/unit/questStoreCompatibility.test.js tests/unit/progressMerge.test.js tests/unit/progressQueue.test.js`

Expected: PASS.

Run: `npx playwright test tests/browser/sound-seekers-persistence-controller.spec.js --config=playwright.quest.config.js`

Expected: PASS for delayed cloud hydrate, teacher reset replacement, two-tab storage reconciliation, scope change/unmount flush, fresh reload, assignment preservation in stored state, assignment exclusion from child uploads, stale event rejection, and zero duplicate evidence/deck visits.

Run: `npm run build`

Expected: PASS without React hook warnings, portal/focus leaks, missing asset URLs, or an eager Phaser load on an unrelated route.

- [ ] **Step 5: Commit the complete child orchestrator**

```bash
git add src/features/soundSeekers/SoundSeekersGame.jsx src/features/soundSeekers/SoundSeekersRoute.jsx src/features/soundSeekers/runtime/soundSeekersProgressController.js src/features/soundSeekers/runtime/useSoundSeekersProgressController.js src/features/soundSeekers/preview/previewFixtures.js src/features/soundSeekers/sound-seekers.css src/features/soundSeekers/ui/CampaignMap.jsx src/features/soundSeekers/ui/TeachAllSequence.jsx src/features/soundSeekers/ui/RewardReveal.jsx src/features/soundSeekers/ui/FieldJournal.jsx src/features/soundSeekers/ui/SettingsSheet.jsx src/features/soundSeekers/ui/CreatorSheet.jsx src/components/AppSurface.jsx src/components/StudentSoundTrailPage.jsx src/utils/questStore.js src/features/soundSeekers/engine/stateV2.js src/quest-preview.jsx preview/quest.jsx tests/unit/soundSeekersGameContract.test.js tests/unit/soundSeekersCreatorIntegration.test.js tests/unit/soundSeekersProgressController.test.js tests/unit/soundSeekersPreviewFixtures.test.js tests/browser/sound-seekers-persistence-controller.spec.js
git commit -m "feat: assemble the new Sound Seekers game"
```

### Task 6: Prove all six powers, accessibility modes, inputs, resume, and world change in the browser

**Files:**
- Create: `tests/browser/sound-seekers-six-powers.spec.js`
- Create: `tests/browser/sound-seekers-mission-resume.spec.js`
- Create: `tests/browser/sound-seekers-evidence-integrity.spec.js`
- Create: `tests/browser/sound-seekers-world-change.spec.js`
- Create: `tests/browser/sound-seekers-motor-assists.spec.js`
- Create: `tests/browser/sound-seekers-character-creator.spec.js`
- Rewrite: `tests/browser/quest-accessibility.spec.js`
- Rewrite: `tests/browser/quest-input-collision.spec.js`
- Modify: `playwright.quest.config.js`

**Interfaces:**
- Consumes: production preview URLs for canonical `fixtureId` plus presentation-only `profile`, deterministic `seed`, and fixture-valid `resumeAt`; any redundant `stop`, `phase`, or `power` must match the resolved fixture.
- Produces: behavioral release evidence from visible child interactions only.

- [ ] **Step 1: Write the browser matrix before changing runtime behavior**

```js
for (const fixture of SOUND_SEEKERS_DECISION_PREVIEW_FIXTURES) {
  test(`${fixture.id} persists its exact visible learning action and payoff`, async ({ page }) => {
    await page.goto(`/quest-preview.html?fixture=${fixture.id}&seed=11`);
    await playDecisionVariantThroughVisibleControls(page, fixture);
    await expect(page.getByTestId("world-payoff")).toHaveAttribute("data-power", fixture.powerId);
    await expect(readPersistedV2Evidence(page)).resolves.toEqual([expectedEventFor(fixture)]);
  });
}

test("movement, timing, collection, and repair create zero literacy events", async ({ page }) => {
  await page.goto(`/quest-preview.html?fixture=${canonicalPreviewFixtureForInstruction("echo-search-find-source").id}&seed=11`);
  await moveProbeAndCollectWithoutConfirming(page);
  await expect(readPersistedV2Evidence(page)).resolves.toEqual([]);
});

test("creator and production world render the same saved appearance", async ({ page }) => {
  await page.goto(`/quest-preview.html?fixture=${canonicalPreviewFixtureForInstruction("echo-search-find-source").id}&view=creator&seed=11`);
  await chooseCreatorAppearance(page, { body: "round-scout", palette: "river-gardens", accessories: ["trail-satchel", "leaf-pin"] });
  const previewSignature = await page.getByTestId("creator-character-preview").getAttribute("data-appearance-signature");
  await page.getByRole("button", { name: "Return to expedition" }).click();
  await expect(page.getByTestId("world-avatar")).toHaveAttribute("data-appearance-signature", previewSignature);
  await expect(readPersistedV2Evidence(page)).resolves.toEqual([]);
});

test("an arbitrary stop phase power mismatch is non-playable and cannot save", async ({ page }) => {
  await page.goto("/quest-preview.html?fixture=power-echo-search&stop=s1&phase=s1-primary&power=story_power&seed=11");
  await expect(page.getByRole("alert")).toContainText("Preview fixture does not match authored content");
  await expect(readPersistedV2Evidence(page)).resolves.toEqual([]);
});
```

The expected event checks the exact immutable ID, one legitimate declared domain, target/position, practice kind, support/reveal/audio truth, and no formal-assessment or `SECURE` status. It does not accept a decorative scene change, a generic evidence counter, a completion toast, or direct storage mutation as proof.

- [ ] **Step 2: Run the new browser matrix and confirm the red state**

Run: `npx playwright test tests/browser/sound-seekers-six-powers.spec.js tests/browser/sound-seekers-mission-resume.spec.js tests/browser/sound-seekers-evidence-integrity.spec.js tests/browser/sound-seekers-world-change.spec.js tests/browser/sound-seekers-motor-assists.spec.js tests/browser/sound-seekers-character-creator.spec.js tests/browser/quest-accessibility.spec.js tests/browser/quest-input-collision.spec.js --config=playwright.quest.config.js`

Expected: FAIL until all production-visible hooks and behaviors meet the matrix.

- [ ] **Step 3: Close only behavior gaps exposed by the matrix**

Add stable semantic test IDs only to states a child can already see. Cover exact visible/spoken instruction and completed required-audio cue lifecycle; per-position evidence; teach-all ordering; the correction transfer; repair persistence; real reload/resume during every power; creator/world appearance parity; pointer/touch/keyboard/switch-focus parity; 56px targets; phone portrait/landscape; 320px width; 200% zoom; reduced motion; simplified scene; extended response; auto-travel; slower movement; and no-damage travel. Every authored decision variant's test must drive its own positive transcript from its exact stop/phase/content fixture, inspect the persisted v2 ledger rather than only a shared payoff, and reject every foreign variant transcript—including variants sharing the same power. Include an attempted re-submit/reload retry that proves event-ID dedupe. Tests must not invoke hidden completion functions, inject answers, or write evidence directly.

Task 6 is proof-only. If this matrix exposes a product behavior gap, stop and return the change to the exact owning Task 1–5 file list and commit before resuming Task 6; do not make an unlisted source edit here. Generated Playwright output goes to `.artifacts/sound-seekers-v2/runtime-browser/<run-id>/` and remains ignored.

- [ ] **Step 4: Run the runtime browser and unit gates together**

Run: `node --test tests/unit/soundSeekers*.test.js`

Expected: PASS with pristine output.

Run: `npx playwright test tests/browser/sound-seekers-*.spec.js tests/browser/quest-accessibility.spec.js tests/browser/quest-input-collision.spec.js --config=playwright.quest.config.js`

Configure named Chromium, Firefox, and WebKit projects in `playwright.quest.config.js` (with the small portrait viewport included where appropriate), then expect PASS in each. Emulated WebKit remains distinct from physical-iPad proof.

- [ ] **Step 5: Commit behavioral game proof**

```bash
git add tests/browser/sound-seekers-six-powers.spec.js tests/browser/sound-seekers-mission-resume.spec.js tests/browser/sound-seekers-evidence-integrity.spec.js tests/browser/sound-seekers-world-change.spec.js tests/browser/sound-seekers-motor-assists.spec.js tests/browser/sound-seekers-character-creator.spec.js tests/browser/quest-accessibility.spec.js tests/browser/quest-input-collision.spec.js playwright.quest.config.js
git commit -m "test: prove Sound Seekers gameplay behavior"
```

**Direct-gate boundary:** Automated unit, browser, offline, accessibility, visual-semantic, and build evidence are necessary but do not prove human listening, physical-device/iPad behavior, observed-child use, authenticated hosted storage, deployment, or production operation. Record those independently in the dependent cutover-and-release plan; do not mark them passed from local automation.

# Sound Seekers v2 Game Runtime Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build one production 2D Sound Seekers runtime in which six genuinely different game actions directly perform the intended literacy work.

**Architecture:** Pure power reducers emit only canonical child-response intents; they never construct learning evidence or decide correctness. The mission commit boundary validates those intents and issues the only nonforgeable current-attempt result a power may consume to correct or advance; the mission reducer likewise issues the only nonforgeable completion transition. Deck-backed work delegates to the exact Task 2 pending-attempt reducers, while Task 3 connected-text presentation transitions and Task 4 scene capabilities remain the only authority for later visual states. The real Task 4 React/SVG components own the authored world, cast, landmarks, options, and meaning visuals; one Phaser `AUTO` scene may own traversal geometry and transient non-semantic effects but may not render a second world or character system. One runtime audio controller owns every instruction, cue, narration, correction, meaning, and material-effect playback.

**Tech Stack:** React 19, Phaser 4 `AUTO`, CSS, Node `node:test`, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-01-sound-seekers-proper-educational-game-design.md`

**Required dependencies:** Do not start runtime implementation until all six tasks in `docs/superpowers/plans/2026-09-01-sound-seekers-v2-content-and-art.md` are committed, their named focused gates pass at those commits, and every dependency path is clean. Import the committed exports and exact object shapes; do not restate an illustrative plan shape. In particular, Task 2's placement and story/transfer reducers, Task 3's connected-text presentation reducer, Task 4's `SceneVisual`/capability and creator-option authorities, Task 5's accepted manifest, and Task 6's aggregate content/art gate must exist. If any named export is absent or dirty, stop rather than stub it. After the production route has replaced the legacy runtime and this plan's behavioral evidence passes, retirement and cleanup belong only to `docs/superpowers/plans/2026-09-01-sound-seekers-v2-cutover-and-release.md`.

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
- Power reducers return frozen `{ state, responseIntents }` results. A response intent is a child response awaiting canonical validation, never a learning event, evidence payload, correctness/support result, deck mutation, or completion shortcut. After emitting it, the power is `awaiting_mission_commit`; only the exact branded result issued for that mission, phase, current attempt, and reducer revision may move it to correction or completion. One explicit answer input creates at most one response intent; state transitions, timing, travel, collision, collection, animation, repair, and rewards create none.
- `challengeContract.js`, `evidence.js`, and `questMastery.js` remain the shared validity, practice-ledger, and numeric-readiness authorities. Runtime code must use `toChildChallengeView`, `createLiteracyDecision`, and `appendEvidence`; it must not reconstruct those contracts or calculate mastery.
- Only the mission evidence boundary or the canonical Task 2 atomic transaction reducers may call `createLiteracyDecision`/`appendEvidence`. Every resulting event uses the canonical evidence schema and deterministic ID `${attemptId}:${ordinal}`, a valid child-local `sessionDay`, normalized `at`, `journeyStep`, canonically derived support, and audio-delivery metadata. No caller supplies correctness, support, an event, a content use, or a completion. Runtime code never adds `contentVisitId`, a UI phase, a presentation capability, motor data, or another invented property. Non-heart events omit `activityType`; canonical irrelevant word/position/connected-text/boss identities retain their foundation-defined nulls.
- All 200 records in `SOUND_SEEKERS_INTERACTION_CONTEXTS` are executable runtime inputs. The runtime preserves each record's child decision, visible step, construct, input/correction model, object and recipient roles, physical expression, and consequence; it may not collapse them into a generic receive-cue/approach-object action or treat a renamed context as a new mechanic.
- A fresh campaign executes every one of the 103 authored teach entries, in exact route order, before any scored use of that target. Each presentation is the full current `createTeachSequence()` item—exactly `{stopId,targetId,teachIndex,scored,instructionId,childText,childAudio,targetAudio,targetAudioSequence,targetAudioAlternates,graphemeDisplay,childLabel,mouthCue,morphologyCue,anchorWord,anchorEvidence,anchorImage,workedExample,alternateExamples}`—and proves completed delivery for every required non-null instruction, target, sequence, and alternate audio reference. A count-only target-ID or invented summary-field test is insufficient. It also executes exactly one replayable, consequence-free, non-recording first-use rehearsal for each of the six powers. Teach/rehearsal completion is never converted into evidence.
- The exact five `CONTENT_DECK_PLACEMENTS` are inserted after their declared teach phase/order. Each child action is materialized through singular `materializeContentPlacementChallenge()` and committed immediately through `commitContentPlacementResponse()`; no provisional response batch exists. A third miss must pass through `completeContentPlacementCorrectionModel()` before that already-fresh supported attempt can respond. Every stop's story and transfer are one composite transaction completed only through `beginStoryTransferTransaction()`, `checkpointStoryTransferTransaction()`, `resumeStoryTransferTransaction()`, `materializeStoryTransferChallenge()`, `completeStoryTransferTransaction()`, and, after a third miss, `completeStoryTransferCorrectionModel()`.
- Task 3 `connectedTextPresentation.js` is the only source of connected-text presentation transitions. Every authenticated wrong story attempt advances it to an exact-current `correction` transition, but that transition authorizes no Task 4 scene access, repair, relationship change, or world payoff. Only the fresh correct attempt's completed reciprocal pair and matching event may advance through `action`, `resolved`, and direct `meaning_support`; Task 4 `issueSceneVisualAccess()` is the only post-choice visual-capability issuer. Checkpoints persist neither brands nor capabilities; resume rehydrates the canonical Task 2 state, replays the strict Task 3 checkpoint, and issues fresh Task 4 access only for an exact-current eligible transition. Scene replacement, route leave, and unmount call `closeConnectedTextPresentation()` on the exact active presentation before discarding it.
- `SceneVisual`, `LayeredBiome`, `Landmark`, and `SoundSeekersCharacter` are the sole production world/cast renderers. Phaser owns only traversal geometry, camera coordinates, and transient non-semantic effects and returns semantic navigation intents; it must not import a second cast, biome, landmark, option, meaning, or avatar renderer.
- One runtime audio controller owns instruction, target cue, whole-word, scene text/prompt, correction, meaning, ducking, interruption, replay, failure, and unmount cleanup. Phaser, reducers, views, and leaf components request playback through that owner and never create `Audio` elements, call the cue player, or mark delivery complete themselves.
- Adaptive selection is deterministic, taught-only, catalog-bound, confusion-directed, monotonic-journey-step based, answer-position balanced under the committed 1,000-seed gate, and frozen for an active attempt/resume. It preserves the canonical teacher next-action description naming the construct and selected-versus-intended confusion. It never uses reaction time, travel, collision, device, reward, cosmetic, motor-assist, or presentation state; it cannot change an answer set, domain, target, challenge identity, or option order after the attempt starts. A wrong event may influence a later canonically eligible review only after the active attempt has finished; it never rematerializes or rerolls that attempt.
- Generated browser traces, screenshots, videos, and run summaries belong under ignored `.artifacts/sound-seekers-v2/`, never under `docs/` or in a task commit.
- Preview requests resolve through the sole collection export `SOUND_SEEKERS_PREVIEW_FIXTURES`. Its legal actor transcripts enumerate only child-visible semantic controls and all legal public choices; they contain no expected token, correct branch, answer map, support/evidence object, commit result, or completion. A stop/phase/power triple that is not present in the expedition catalog is an error state that cannot create, complete, persist, or emit evidence; tests never pair every power arbitrarily with `s1`.
- Every successful meaningful action has one authored game-feel sequence: anticipation, visible contact, the construct-specific literacy effect, resident eyeline/reaction, restrained material sound, and a clear settled state. A successful Wonder/payoff additionally persists the exact repair across route revisit and reload. Reduced motion replaces motion but preserves contact, literacy cause, reaction, material cue, and final repair; none of these presentation steps emits evidence.

Every task below stages only its literal file list with `git add -- <paths>`, then runs `git diff --cached --name-status` and `git diff --cached --check` before committing. The cached list must exactly equal that task's declared paths and must never include either implementation plan, another task's files, `.artifacts`, browser traces, storage dumps, audio temporaries, or a human-gate record not created by that task.

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
- Consumes: `validateQuestChallenge`/`isRecordableQuestChallenge`, `toChildChallengeView`, foundation correction records, a committed Task 1 action plus its exact `SOUND_SEEKERS_INTERACTION_CONTEXTS[action.contextId]`, Task 2 content already chosen by the mission factory, and deterministic integer seeds. A reducer context contains the current validated challenge and public interaction model only; it never receives evidence arrays, `createLiteracyDecision`, deck mutation functions, motor/device telemetry, or a correctness setter.
- Produces: frozen `SOUND_POWER_REGISTRY` entries implementing `createState(challenge,{seed,resume,interaction})`, `reduce(state,input,context) -> Object.freeze({ state, responseIntents })`, `view(state,challenge,assists)`, and `checkpoint(state)`; `createInteractionRuntimeModel(action,context)`, `canonicalResponseIntent(challenge,response)`, `createReplayVariant(deck,seed,replayOrdinal)`, and `normalizeMotorAssists(raw)`. The only recordable intent shape is exactly `{kind:"challenge_response",challengeId,response:{kind:"literacy-answer",token}}`; the s38 application uses the Task 2 exact non-recording response and no evidence intent. An answer input leaves the power in `awaiting_mission_commit`; Task 3 adds the branded-result consumption hook without changing this intent shape. `view` derives through `toChildChallengeView` and omits `expectedToken`, `isCorrect`, answer keys, internal catalog data, and correction authority.
- A reducer accepts only a challenge whose `(instructionId,powerId,expectedAction,recordsDomain)` equals one current instruction contract. Contrast Sort therefore supports its three exact variants, Memory Delivery its four, and Blend Bridge its ordinary plus novel-boss variants. A decision has exactly one declared domain and no completed word or mission fans out credit to another position, target, or domain.

- [ ] **Step 1: Write failing behavioral-distinction and invariance tests**

```js
test("every exact authored decision variant emits only its own pending response intent", () => {
  const required = Object.values(SOUND_SEEKERS_INSTRUCTIONS).filter(item => item.phase === "decision");
  assert.deepEqual(authoredDecisionVariantFixtures.map(item => pickDecisionTuple(item)), required.map(pickDecisionTuple));
  for (const fixture of authoredDecisionVariantFixtures) {
    assert.equal(playVariant(fixture, fixture.positiveTranscript).state.status, "awaiting_mission_commit");
    assert.equal(playVariant(fixture, fixture.positiveTranscript).responseIntents.length, fixture.expectedDecisionCount);
    for (const foreign of authoredDecisionVariantFixtures.filter(item => item.id !== fixture.id)) {
      assert.notEqual(playVariant(fixture, foreign.positiveTranscript).state.status, "awaiting_mission_commit");
    }
  }
});

test("movement and exploration never emit response intents", () => {
  for (const [powerId, fixture] of Object.entries(fixtures)) {
    const power = SOUND_POWER_REGISTRY[powerId];
    const state = power.createState(fixture, { seed: 3, resume: null });
    for (const input of [{ type: "move", dx: 1, dy: 0 }, { type: "probe" }, { type: "collect", id: "leaf" }]) {
      assert.deepEqual(power.reduce(state, input, context).responseIntents, []);
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

test("only explicit answers emit one canonical response intent and no reducer imports evidence", () => {
  for (const [powerId, fixture] of Object.entries(fixtures)) {
    const result = playUntilFirstDecision(powerId, fixture, contextFor({
      attemptId: fixture.attemptId, ordinal: 0, sessionDay: "2026-09-01", now: "2026-09-01T09:00:00.000Z"
    }));
    assert.deepEqual(result.responseIntents, [{
      kind: "challenge_response",
      challengeId: fixture.challengeId,
      response: { kind: "literacy-answer", token: fixture.expectedToken }
    }]);
    assert.equal(Object.isFrozen(result.responseIntents[0]), true);
  }
  assertPowerModulesDoNotImportEvidenceOrDeckMutators();
});

test("all two hundred authored interaction contexts become construct-specific actions", () => {
  const actions = SOUND_SEEKERS_EXPEDITIONS.flatMap(expedition => [
    ...expedition.phases.filter(phase => phase.powerId),
    ...expedition.heartWordOpportunities
  ]);
  assert.equal(actions.length, 200);
  assert.equal(Object.keys(SOUND_SEEKERS_INTERACTION_CONTEXTS).length, 200);
  for (const action of actions) {
    const context = SOUND_SEEKERS_INTERACTION_CONTEXTS[action.contextId];
    const runtime = createInteractionRuntimeModel(action, context);
    assertInteractionPreservesAuthoredMechanics(runtime, context);
    assert.equal(runtime.validInputs.includes("approach_and_complete"), false);
    assert.equal(playInteraction(runtime, authoredTranscriptFor(context)).state.status, "complete");
    assert.equal(playInteraction(runtime, transcriptForDifferentConstruct(context)).state.status === "complete", false);
  }
});

test("pending intent and every motor presentation preserve the same semantic transcript", () => {
  for (const fixture of allTwoHundredInteractionFixtures()) {
    const baseline = transcriptThroughPendingIntent(fixture, normalizeMotorAssists({}));
    for (const key of MOTOR_ASSIST_KEYS) {
      const assisted = transcriptThroughPendingIntent(fixture, normalizeMotorAssists({ [key]: true }));
      assert.deepEqual(assisted.responseIntents, baseline.responseIntents);
      assert.deepEqual(assisted.semanticSteps, baseline.semanticSteps);
      assert.equal(assisted.state.status, "awaiting_mission_commit");
    }
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

Implement each reducer as an interaction-state machine that validates its authored challenge and exact interaction context before creating state. A named explicit answer produces only `canonicalResponseIntent(challenge,response)` and enters `awaiting_mission_commit`; a second answer, a caller `correct`/`support`/`event` input, or a plain completion command cannot advance it. No power imports `evidence.js`, `contentDeckTransactions.js`, `recordContentDeckUse()`, or a state persistence module in this task. Attempt IDs, ordinals, dates, support, audio delivery, evidence IDs, and correctness stay outside power state. Task 3 will add the sole mission-brand validator import and current-attempt result hook to these same modules.

- Echo Search: exploration/probe reveals stable candidates; an explicit candidate confirmation emits one response intent and uncovers the world source only after the mission boundary confirms it.
- Contrast Sort: four to six stable items remain until every reversible placement is complete. Its exact instruction selects sound-to-bin (`grapheme_to_phoneme`), decoded-word-pattern (`word_decoding`), or heart-pattern (`heart_word_mapping`) input; a transcript for either sibling variant is rejected.
- Word Forge: each stable-rack tile placement emits one position response intent; slots and duplicate physical tiles persist; completion transitions to an explicit sweep/read payoff only after canonical commit.
- Blend Bridge: ordered segment activation plays support audio but emits no correctness; the ordinary final meaning destination emits `word_decoding`, while only `blend-bridge-choose-novel-meaning` in an authored controlled boss emits `novel_decoding`. Each rejects the other's final-action transcript.
- Memory Delivery: cue receipt/replay and travel emit nothing; the exact instruction selects delivery of a remembered sound (`phoneme_to_grapheme`), decoded word (`word_decoding`), heart word (`heart_word_mapping`), or decoded instruction (`connected_text_transfer`). The answer is absent from the travel overlay and sibling-variant transcripts are rejected.
- Story Power: only an authored text-supported response emits a response intent; `narrative_choice` produces the exact narrative token for Task 2 checkpointing and no correctness intent. The distinct authored controlled novel-decoding boss uses its actual transfer action/power rather than a decorative Story Power reskin.

Replay must preserve target and pronunciation while changing only audited content IDs, candidate positions, route IDs, recipients, and set-piece variant. The same seed and ordinal reproduce the same variant; a deck exhausts before repeating. Do not use reaction windows for correctness.

The reducer registry does not schedule or mutate deck content. `createMissionPlan.js`/`createChallenge.js` supply a child-safe challenge already materialized by its owner. `memoryDelivery` implements distinct transcripts for the four heart activities; alternative/morphology/story/transfer responses return to their Task 2 transaction owner. Only heart-word completion may ultimately call `recordContentDeckUse()`, and that call belongs to the mission commit boundary after canonical rehydration; non-heart categories can be mutated only by one-response `commitContentPlacementResponse()` or `completeStoryTransferTransaction()`. The two correction-model APIs change only their Task 2 checkpoint stage and never emit a response intent, event, receipt, use, or mission advance.

`createInteractionRuntimeModel()` consumes every semantic field of the exact Task 1 context. Its frozen output contains the context ID, construct/activity focus, one visible immediate `decisionSteps` sequence, stable object/recipient roles, input/correction/consequence models, physical action roles/expression, and a context-specific semantic-input allowlist. It rejects unknown fields, missing referenced objects, mismatched action/context IDs, compound hidden actions, and any generic fallback. Tests compare normalized semantic transcripts—not narrative nouns—so reskins cannot masquerade as mechanically different actions and distinct constructs cannot collapse to one click path.

- [ ] **Step 4: Run reducer, replay, assist, evidence, and correction tests**

Run: `node --test tests/unit/soundSeekersPowerReducers.test.js tests/unit/soundSeekersReplayDeck.test.js tests/unit/soundSeekersMotorAssists.test.js tests/unit/soundSeekersEvidence.test.js tests/unit/questCorrection.test.js`

Expected: PASS with all 12 decision variants and all 200 authored interaction contexts executable through their pending-intent boundary, cross-construct/cross-variant transcripts rejected, response-intent parity across every motor assist, frozen child-safe views, and zero evidence/deck mutation import in a power reducer.

- [ ] **Step 5: Commit the Sound Power engine**

```bash
git add -- src/features/soundSeekers/engine/powers/contracts.js src/features/soundSeekers/engine/powers/echoSearch.js src/features/soundSeekers/engine/powers/contrastSort.js src/features/soundSeekers/engine/powers/wordForge.js src/features/soundSeekers/engine/powers/blendBridge.js src/features/soundSeekers/engine/powers/memoryDelivery.js src/features/soundSeekers/engine/powers/storyPower.js src/features/soundSeekers/engine/powers/index.js src/features/soundSeekers/engine/replayDeck.js src/features/soundSeekers/engine/motorAssists.js tests/unit/soundSeekersPowerReducers.test.js tests/unit/soundSeekersReplayDeck.test.js tests/unit/soundSeekersMotorAssists.test.js
git diff --cached --name-status
git diff --cached --check
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
- Consumes: the `word_forge` child-safe view model and semantic dispatch callback from Task 1, pronunciation records from the foundation, an optional post-commit meaning-payoff model supplied by the later mission/visual integration, and replay-request callbacks supplied by the single runtime audio controller. It never imports correctness, evidence, a Task 2 mutation, cue playback, or audio-delivery mutation directly.
- Produces: `<WordWorkbench model meaningPayoff onInput onReplayWholeWord onReplayMeaning />` with accessible slots, stable rack buttons, blend sweep, and `<MeaningPayoff support visual reducedMotion onReplay />`. `meaningPayoff` is `null` until a later task supplies the exact Task 3 support plus Task 4 visual after an authenticated successful Word Forge or Blend Bridge commit; this component never resolves or unlocks it itself.

- [ ] **Step 1: Write failing persistent-slot and browser interaction tests**

```js
test("hot, ship, moon, cake, and pop render the power-owned persistent slots and emit one UI intent", () => {
  for (const word of ["hot", "ship", "moon", "cake", "pop"]) {
    const model = wordForgeViewFixture(word, { completedUnitCount: 1 });
    const inputs = [];
    const view = renderWordWorkbench({ model, onInput: input => inputs.push(input) });
    const tile = model.rack.at(-1);
    view.clickTile(tile.id);
    assert.deepEqual(inputs, [{ type: "place_tile", tileId: tile.id }]);
    assert.deepEqual(view.readSlots(), model.slots);
    assert.deepEqual(view.readRackIds(), model.rack.map(item => item.id));
    assertNoCorrectnessEvidenceOrCompletionAuthority(view.propsAndDom());
  }
});

test("the workbench never decides whether a tile is right and renders only the next power-owned model", () => {
  const before = wordForgeViewFixture("ship", { completedUnitCount: 1, status: "ready" });
  const awaiting = wordForgeViewFixture("ship", { completedUnitCount: 1, status: "awaiting_mission_commit" });
  const inputs = [];
  const view = renderWordWorkbench({ model: before, onInput: input => inputs.push(input) });
  view.clickTile("ship-rack-i");
  assert.deepEqual(inputs, [{ type: "place_tile", tileId: "ship-rack-i" }]);
  assert.deepEqual(view.readSlots(), before.slots);
  view.rerender({ model: awaiting });
  assert.deepEqual(view.readSlots(), awaiting.slots);
  assert.deepEqual(view.readRackIds(), awaiting.rack.map(tile => tile.id));
  assert.equal(view.hasMeaningPayoff(), false);
});
```

Browser assertion:

```js
const beforeSlots = await visibleWorkbenchSlots(page);
await page.getByRole("button", { name: "sh grapheme tile" }).click();
await expect.poll(() => emittedWorkbenchInputs(page)).toEqual([
  { type: "place_tile", tileId: "ship-rack-sh" }
]);
await expect.poll(() => visibleWorkbenchSlots(page)).toEqual(beforeSlots);
await expect(page.getByRole("button", { name: "i grapheme tile" })).toBeVisible();
```

Keep the browser interaction in this task in-memory and use a controlled child-safe model harness. It proves rendering and one-control/one-intent dispatch only; it may not infer tile correctness, append evidence, advance a slot, or reveal meaning. Mission-authorized placement, correction, immediate post-success meaning, and real route reload are deferred to Tasks 3, 4, and 6.

- [ ] **Step 2: Run focused tests and confirm the red state**

Run: `node --test tests/unit/soundSeekersWordWorkbench.test.js`

Expected: FAIL because the component, controlled child-safe harness, and accessible payoff shell do not exist.

- [ ] **Step 3: Implement one DOM workbench for every presentation profile**

```jsx
export default function WordWorkbench({ model, meaningPayoff = null, onInput, onReplayWholeWord, onReplayMeaning }) {
  return (
    <section className="ss-workbench" aria-label={model.instructionLabel}>
      <button className="ss-replay" onClick={onReplayWholeWord} aria-label="Hear the whole word again" />
      <div role="group" aria-label="Sound boxes">
        {model.slots.map(slot => <SoundBox key={slot.id} slot={slot} />)}
      </div>
      <div className="ss-tile-rack" role="group" aria-label="Grapheme tiles">
        {model.rack.map(tile => <button key={tile.id} onClick={() => onInput({ type: "place_tile", tileId: tile.id })} aria-label={`${tile.label} grapheme tile`}>{tile.label}</button>)}
      </div>
      {meaningPayoff && <MeaningPayoff {...meaningPayoff} onReplay={onReplayMeaning} />}
    </section>
  );
}
```

Show an answer-neutral target picture/action cue without leaking an untaught decoding answer, a whole-word replay button, one box per authored unit, the current highlighted box, all prior placements, a stable rack with duplicate tile instances, correction state, and final sweep/blend. Before success, visible text and accessible names use the canonical instruction label and “whole word”/“sound boxes”; they never expose the target's printed spelling through `model.word`, an ARIA label, title, data attribute, or hidden text. The component requests only audio; the Task 4 controller decides playback and delivery truth. It never pre-says the answer sound before the first independent placement and never derives a completed slot from the clicked tile. After a later authenticated advance, the orchestrator supplies the exact Task 3 public meaning support and Task 4 visual immediately to `MeaningPayoff`; that same payoff is used for Word Forge and Blend Bridge and is absent before success. Use 56px minimum buttons, strong focus rings, live-region feedback that exactly matches the controller's visible/spoken correction transcript without announcing the answer early, reduced-motion alternatives, and responsive layouts at 320px/200% zoom. Full, simplified, canvas-fallback, and motor-assisted profiles use this same component and semantic transcript.

- [ ] **Step 4: Run unit and browser workbench checks**

Run: `node --test tests/unit/soundSeekersWordWorkbench.test.js`

Expected: PASS for the five child-safe fixture models, digraphs, split digraphs, repeated letters, stable rack/slots across controlled rerender, exactly one semantic UI intent per activation, and no component-owned correctness/evidence/meaning unlock.

Run: `npx playwright test tests/browser/sound-seekers-word-workbench.spec.js --config=playwright.quest.config.js`

Expected: PASS for pointer, keyboard, exact whole-word replay/no first-attempt answer leak, 320px, 200% zoom, and reduced motion. Reload proof is a Task 6 production-route test.

- [ ] **Step 5: Commit the Word Workbench**

```bash
git add -- src/features/soundSeekers/ui/WordWorkbench.jsx src/features/soundSeekers/ui/WordWorkbench.css src/features/soundSeekers/ui/MeaningPayoff.jsx tests/unit/soundSeekersWordWorkbench.test.js tests/browser/sound-seekers-word-workbench.spec.js
git diff --cached --name-status
git diff --cached --check
git commit -m "feat: build persistent Sound Seekers workbench"
```

### Task 3: Build the checkpointed expedition mission reducer and persistent world state

**Files:**
- Create: `src/features/soundSeekers/engine/createChallenge.js`
- Create: `src/features/soundSeekers/engine/createMissionPlan.js`
- Create: `src/features/soundSeekers/engine/missionResponseCommit.js`
- Create: `src/features/soundSeekers/engine/missionReducer.js`
- Create: `src/features/soundSeekers/engine/worldState.js`
- Modify: `src/features/soundSeekers/engine/stateV2.js`
- Modify: `src/features/soundSeekers/engine/powers/contracts.js`
- Modify: `src/features/soundSeekers/engine/powers/echoSearch.js`
- Modify: `src/features/soundSeekers/engine/powers/contrastSort.js`
- Modify: `src/features/soundSeekers/engine/powers/wordForge.js`
- Modify: `src/features/soundSeekers/engine/powers/blendBridge.js`
- Modify: `src/features/soundSeekers/engine/powers/memoryDelivery.js`
- Modify: `src/features/soundSeekers/engine/powers/storyPower.js`
- Modify: `src/features/soundSeekers/engine/powers/index.js`
- Create: `tests/unit/soundSeekersMissionReducer.test.js`
- Create: `tests/unit/soundSeekersWorldState.test.js`
- Create: `tests/unit/soundSeekersPlaythrough.test.js`

**Interfaces:**
- Consumes Task 1 `SOUND_SEEKERS_EXPEDITIONS`, all 200 `SOUND_SEEKERS_INTERACTION_CONTEXTS`, `getExpedition(stopId)`, `createReviewTargetSequence()`, `createTeachSequence()`/`reduceTeachSequence()`, and exact heart bindings. Consumes Task 2 `getContentDeckPlacements(stopId)`, `serveContentDeck()`, `rehydrateServedContentInstance()`, `projectBoundContentResolverInputs()`, heart-only `recordContentDeckUse()`, `beginContentPlacementAttempt()`, `resumeContentPlacementAttempt()`, singular `materializeContentPlacementChallenge()`, `commitContentPlacementResponse()`, `completeContentPlacementCorrectionModel()`, `beginStoryTransferTransaction()`, `checkpointStoryTransferTransaction()`, `resumeStoryTransferTransaction()`, `materializeStoryTransferChallenge()`, `materializeBossTransferChallenge()`, `projectBossTransferOptionsForChild()`, `completeStoryTransferTransaction()`, `completeStoryTransferCorrectionModel()`, and full-state `validContentDeckUses(state,category)`. Consumes Task 3 `toChildConnectedTextScene()`, `createConnectedTextChallenge()`, `SOUND_SEEKERS_NARRATIVE_BRANCH_OUTCOMES`, `resolveNarrativeBranchOutcome(sceneId,narrativeChoiceToken)`, `getCastRelationshipBeat(relationshipBeatId)`, `getMeaningSupport()`, and exact `beginConnectedTextPresentation()`, `reduceConnectedTextPresentation()`, `checkpointConnectedTextPresentation()`, `rehydrateConnectedTextPresentation()`, and `closeConnectedTextPresentation()` lifecycle APIs; Task 4 `issueSceneVisualAccess()` is the only later-visual seam. Also consumes foundation challenge/evidence/director/correction APIs and Task 1 runtime power response intents.
- Produces `createMissionPlan({stopId,state,seed,replayOrdinal})`, `createMissionState(plan,resume)`, `reduceMission(state,input,context)`, `commitMissionResponse(state,responseIntents,context)`, `assertCurrentMissionCommitResult(result,expected)`, `validateCurrentMissionTransition(transition,expected)`, `checkpointMission(state)`, `deriveWorldState(campaign,biomeKit)`, `deriveNarrativeBranchState(campaign,sceneId)`, `deriveResidentRequest(campaign,stopId)`, and `completeMission(gameState,completion)`. `reduceMission()` returns exactly frozen `{state,responseIntents,transition,completion}`. `transition` is `null` before a commit; after the mission atomically applies a commit result through the current power, it is that same branded object advanced in private metadata from `issued` to `applied` and bound to the finalized state revision. It is read-only game-feel authority, not reusable power-transition authority. Before payoff `completion` is `null`; final payoff emits the same exact recursively frozen `{kind:"sound_seekers_mission_completion",missionId,stopId,journeyStep,completedPhaseIds}` shape, now branded and current-state-bound. `completeMission()` validates the exact object identity and private current-state metadata, then returns exactly `{nextState,summary}`, deriving repair, relationship, consequence, narrative branch, cast callback, journal, reward, route, and journey changes from canonical content and valid Task 2 uses rather than caller fields.
- `missionResponseCommit.js` is the sole runtime response-to-state boundary and owns a module-private `WeakSet` plus `WeakMap` for issued commit results. `commitMissionResponse()` accepts the exact current frozen response-intent set and only canonical time/session/audio inputs; it rejects caller `correct`, `support`, event, use, outcome, correction, or completion fields. It returns only the recursively frozen branded `commitResult`; the candidate state is held exclusively in that module's private metadata and is never returned, projected, serialized, or caller-readable. `commitResult` has exactly `{kind:"sound_seekers_mission_commit_result",missionId,phaseId,attemptId,attemptOrdinal,outcome,supportLevel,correctionRecordIds,nextAttemptId}` where `outcome` is `retry`, `model_required`, `continue`, or `advance`. `retry` names an ordinary/heart miss or Task 2 retry; `model_required` mirrors the Task 2 third-miss outcome; placement `next_challenge` maps only to `continue`; and only an ordinary/heart success or Task 2 `completed` maps to `advance`. `correctionRecordIds` is a frozen ordered string array. `nextAttemptId` is the exact fresh/current Task 2 string for `retry`, `model_required`, and `continue`, and exact `null` for `advance`—the key is never omitted. Its private metadata binds the candidate state, original response-intent object identities, challenge identities, current mission revision, exact canonical reducer outcome, and resulting event/use identities; none of those private values is exposed or serialized. Only `missionReducer.js` may consume that metadata after successful power application and finalize the candidate.
- Every power gains `applyMissionCommitResult(state,result,context)`. It first calls `assertCurrentMissionCommitResult()` with its exact mission, phase, attempt, and reducer revision, then and only then enters the named correction state or advances. A literal, `Object.freeze()` lookalike, spread clone, `structuredClone`, JSON round-trip, previously consumed result, stale revision/attempt, or cross-mission/phase/power result throws without changing state. After that one application, `missionReducer.js` marks the same result `applied`, binds it to the finalized mission revision, and exposes it only as `transition`; `validateCurrentMissionTransition()` accepts only that applied/current binding for read-only Task 4 presentation and never permits a second power transition. `missionResponseCommit.js` imports no power implementation; the power modules may import only its assertion function, avoiding a cycle. Source tests require `commitMissionResponse()` to be called only by `missionReducer.js` and evidence/deck mutation APIs only by this boundary or Task 2 transactions.

- [ ] **Step 1: Write failing expedition-loop, resume, and repair tests**

```js
test("mission plans insert exact opportunities, five placements, and one composite story flow", () => {
  for (const expedition of SOUND_SEEKERS_EXPEDITIONS) {
    const plan = createMissionPlan({ stopId: expedition.stopId, state: freshState(), seed: expedition.stopIndex, replayOrdinal: 0 });
    assertMissionPreservesBasePhaseTuples(plan, expedition);
    assertExactHeartOpportunityOrder(plan, expedition.heartWordOpportunities);
    assertExactPlacementOrder(plan, getContentDeckPlacements(expedition.stopId));
    assert.equal(plan.phases.filter(phase => phase.kind === "story_transfer").length, 1);
    assert.equal(plan.phases.find(phase => phase.kind === "story_transfer").id, `${expedition.stopId}-transfer`);
  }
  assert.deepEqual(allRuntimePlacements().map(item => item.placementId), [
    "s16-alternative", "s28-alternative", "s29-alternative", "s37-alternative", "s38-morphology"
  ]);
});

test("fresh execution presents all 103 exact teach contracts first and rehearses each power once without evidence", () => {
  const run = playFortyStopsThroughPublicMissionReducers({ mode: "fresh" });
  assert.equal(run.teachCompletions.length, 103);
  assert.deepEqual(run.teachCompletions.map(item => pickTeachPresentation(item)), allCanonicalTeachPresentationTuples());
  for (const item of run.teachCompletions) {
    assert.deepEqual(Object.keys(pickTeachPresentation(item)).sort(), [
      "alternateExamples", "anchorEvidence", "anchorImage", "anchorWord", "childAudio",
      "childLabel", "childText", "graphemeDisplay", "instructionId", "morphologyCue",
      "mouthCue", "scored", "stopId", "targetAudio", "targetAudioAlternates",
      "targetAudioSequence", "targetId", "teachIndex", "workedExample"
    ]);
    assertEveryRequiredTeachAudioCompleted(item);
  }
  assert.equal(run.teachCompletions.every(item => item.scored === false), true);
  assertEveryScoredTargetWasPreviouslyTaught(run.transcript);
  assert.deepEqual(run.onboardingCompletions.map(item => item.powerId).sort(), Object.values(SOUND_POWER_IDS).sort());
  assert.equal(run.onboardingCompletions.every(item => item.consequenceFree && item.recordsDomain === null), true);
  assert.equal(run.onboardingCompletions.some(item => run.evidenceIds.includes(item.id)), false);
});

test("all 200 interaction contexts run their authored mechanics and correction transcript", () => {
  const run = playFortyStopsThroughPublicMissionReducers({ mode: "all-first-wrong" });
  assert.deepEqual(new Set(run.interactionContextIds), new Set(Object.keys(SOUND_SEEKERS_INTERACTION_CONTEXTS)));
  assert.equal(run.interactionContextIds.length, 200);
  assertEveryContextUsedItsAuthoredDecisionInputCorrectionAndConsequence(run);
  assertCorrectionTranscriptParity(run, ["full", "simplified", "reduced-motion", "motor-assisted"]);
});

test("power response intents commit only at their canonical owner", () => {
  const ordinary = submitThroughMissionReducer(activeOrdinaryMission(), [ordinaryResponseIntent()], context);
  assert.deepEqual(Object.keys(ordinary).sort(), ["completion", "responseIntents", "state", "transition"]);
  assert.deepEqual(ordinary.responseIntents, []);
  assert.equal(ordinary.completion, null);
  assert.equal(ordinary.state.evidence.length, 1);
  assert.equal(ordinary.transition.outcome, "advance");
  assert.deepEqual(Object.keys(ordinary.state.evidence[0]).includes("contentVisitId"), false);

  const heart = submitThroughMissionReducer(activeHeartMission(), [heartResponseIntent()], context);
  assert.equal(heart.state.evidence.length, 1);
  assert.equal(validContentDeckUses(heart.state, "heartWords").length, 1);

  const placement = activePlacementMission();
  const placementIntent = currentPlacementResponseIntent(placement);
  const placed = submitThroughMissionReducer(placement, [placementIntent], context);
  assert.equal(placed.state.evidence.length, placement.state.evidence.length + 1);
  assert.equal(placed.transition.outcome, "continue");
  assert.equal(placed.state.checkpoint.contentPlacement.targetOrdinal, placement.expectedNextTargetOrdinal);
  assert.deepEqual(placed.state.checkpoint.mission.pendingResponseIntents, undefined);
  assertPlacementResponseWasMaterializedAndCommittedExactlyOnce([
    "materializeContentPlacementChallenge", "commitContentPlacementResponse"
  ]);
  assert.throws(() => commitMissionResponse(activePlacementMission(), [placementIntent, placementIntent], context));
  assert.throws(() => recordContentDeckUse(storyState().contentDecks, storyServed(), storyBinding()));
  assertPlacementResponsesCommitOneAtATimeOnlyThroughCommitContentPlacementResponse();
  assertStoryResponsesCommitOnlyThroughCompleteStoryTransferTransaction();
});

test("only a current branded mission result can correct or advance a power", () => {
  const pending = activeOrdinaryMission({ selectedToken: "short_e", expectedToken: "short_i" });
  const committed = commitMissionResponse(pending, [pending.responseIntent], context);
  assert.deepEqual(pickPublicCommitResult(committed), {
    kind: "sound_seekers_mission_commit_result",
    missionId: pending.missionId,
    phaseId: pending.phaseId,
    attemptId: pending.attemptId,
    attemptOrdinal: 0,
    outcome: "retry",
    supportLevel: 1,
    correctionRecordIds: [pending.firstMissCorrectionId],
    nextAttemptId: `${pending.missionId}:${pending.phaseId}:attempt:1`
  });
  const applied = applyThroughMissionReducer(pending, committed);
  assert.equal(applied.activity.status, "correction");
  assert.strictEqual(applied.transition, committed);
  assert.equal(validateCurrentMissionTransition(applied.transition, applied.identity), true);
  for (const forged of [
    { ...committed }, Object.freeze({ ...committed }),
    structuredClone(committed), JSON.parse(JSON.stringify(committed))
  ]) assert.throws(() => pending.power.applyMissionCommitResult(pending.activity, forged, pending.identity));
  assert.throws(() => otherMission().power.applyMissionCommitResult(otherMission().activity, committed, otherMission().identity));
  assert.throws(() => pending.power.applyMissionCommitResult(pending.activity, committed, { ...pending.identity, revision: pending.identity.revision + 1 }));
  assert.throws(() => pending.power.applyMissionCommitResult(pending.activity, committed, pending.identity), /consumed|stale/i);
});

test("three misses record truthful fresh attempts, model once, then advance only on the supported attempt", () => {
  const traces = correctionLadderForEveryDecisionVariantAndMotorProfile();
  for (const trace of traces) {
    assert.deepEqual(trace.attemptOrdinals, [0, 1, 2, 3]);
    assert.equal(new Set(trace.attemptIds).size, 4);
    assert.deepEqual(trace.eventSupportLevels, [0, 1, 2, 3]);
    assert.deepEqual(trace.commitOutcomes, ["retry", "retry", "model_required", "advance"]);
    assert.deepEqual(trace.corrections.map(item => item.step), ["name_and_replay", "isolate_position", "model_once"]);
    assert.equal(trace.modelCount, 1);
    assert.equal(trace.modelEvidenceCount, 0);
    assert.equal(trace.thirdCorrection.requiresFreshAttempt, true);
    assert.equal(trace.thirdCorrection.attemptId, trace.modelCompletion.attemptId);
    assert.equal(trace.modelCompletion.receiptsAdded, 0);
    assertCheckpointAttemptAndCorrectionParity(trace.reloads);
    assertMotorProfilesShareVisibleSpokenAndSemanticCorrection(trace.profiles);
    assertLaterReviewUsesSameConstructInDifferentEligibleDomain(trace.laterReview);
  }
});

test("all forty story bridges checkpoint then complete through the real composite reducer", () => {
  const run = playFortyStopsThroughPublicMissionReducers({ mode: "fresh" });
  assert.equal(validContentDeckUses(run.state, "heartWords").length, 81);
  assert.equal(validContentDeckUses(run.state, "stories").length, 40);
  assert.equal(validContentDeckUses(run.state, "transfer").length, 40);
  assert.equal(validContentDeckUses(run.state, "alternatives").length, 4);
  assert.equal(validContentDeckUses(run.state, "morphology").length, 1);
  assert.equal(run.heartVisits.length, 80);
  assert.equal(run.state.evidence.filter(event => event.domain === "connected_text_transfer").length, 32);
  assert.equal(run.state.evidence.filter(event => event.domain === "novel_decoding").length, 8);
  assert.equal(run.alternativeEvents.length, 8);
  assert.equal(run.storyCheckpoints.length, 40);
  assert.equal(run.storyCheckpoints.filter(item => item.narrativeChoiceToken === null).length, 32);
  assert.equal(run.storyCheckpoints.filter(item => item.narrativeChoiceToken !== null).length, 8);
  assertPresentationTransitionsAreBrandedAndSceneAccessIsCurrent(run);
});

test("Task 2 wrong composites retain evidence and issue correction presentation only; model precedes final success", () => {
  const run = playFortyStopsThroughPublicMissionReducers({ mode: "three-misses-then-correct" });
  assert.equal(run.state.evidence.filter(event => event.domain === "connected_text_transfer").length, 128);
  assert.equal(run.state.evidence.filter(event => event.domain === "novel_decoding").length, 32);
  assert.equal(run.alternativeEvents.length, 32); // four attempts across the exact eight assessed targets
  assert.equal(validContentDeckUses(run.state, "stories").length, 40);
  assert.equal(validContentDeckUses(run.state, "transfer").length, 40);
  assert.equal(validContentDeckUses(run.state, "alternatives").length, 4);
  assert.equal(run.wrongStoryAttempts.every(item => item.storyUsesAdded === 0 && item.transferUsesAdded === 0), true);
  assert.equal(run.wrongStoryAttempts.every(item => item.presentationTransitionsAdded === 1), true);
  assert.equal(run.wrongStoryAttempts.every(item => item.presentationTransition.phase === "correction"), true);
  assert.equal(run.wrongStoryAttempts.every(item => item.presentationTransition.postDecisionSemanticId === null), true);
  assert.equal(run.wrongStoryAttempts.every(item => item.presentationTransition.storyOutcomeId === null), true);
  assert.equal(run.wrongStoryAttempts.every(item => item.presentationTransition.meaningSemanticId === null), true);
  assert.equal(run.wrongStoryAttempts.every(item => item.sceneAccessAdded === 0 && item.worldPayoffsAdded === 0), true);
  assert.equal(run.thirdMisses.every(item => item.transactionStage === "model_pending"), true);
  assert.equal(run.thirdMisses.every(item => item.correctResponseRejectedBeforeModel), true);
  assert.equal(run.storyCorrectionModels.every(item => item.owner === "completeStoryTransferCorrectionModel"), true);
  assert.equal(run.storyCorrectionModels.every(item => item.eventsAdded === 0 && item.receiptsAdded === 0 && item.usesAdded === 0), true);
  assert.equal(run.storyCorrectionModels.every(item => item.beforeAttemptId === item.afterAttemptId && item.supportLevel === 3 && item.revealed), true);
  for (const boss of run.bossTransactions) {
    assert.equal(new Set(boss.attemptCheckpoints.map(item => item.narrativeChoiceToken)).size, 1);
    assert.equal(boss.storyUse.narrativeChoiceToken, boss.attemptCheckpoints[0].narrativeChoiceToken);
    assert.equal(boss.transferUse.narrativeChoiceToken, boss.attemptCheckpoints[0].narrativeChoiceToken);
    assert.equal(boss.challengeSource, "materializeBossTransferChallenge");
  }
});

test("narrative branches and resident callback requests are derived from valid history and survive reload", () => {
  assert.equal(SOUND_SEEKERS_NARRATIVE_BRANCH_OUTCOMES.length, 16);
  for (const bossStopId of ["s5", "s10", "s15", "s20", "s25", "s30", "s35", "s40"]) {
    const [leftToken, rightToken] = childNarrativeTokensForStop(bossStopId);
    const left = completeBossAndReload({ stopId: bossStopId, narrativeChoiceToken: leftToken });
    const right = completeBossAndReload({ stopId: bossStopId, narrativeChoiceToken: rightToken });
    const leftBranch = deriveNarrativeBranchState(left.reloadedState, left.sceneId);
    const rightBranch = deriveNarrativeBranchState(right.reloadedState, right.sceneId);
    assert.equal(leftBranch.choiceToken, leftToken);
    assert.equal(rightBranch.choiceToken, rightToken);
    assert.notEqual(leftBranch.storyOutcomeId, rightBranch.storyOutcomeId);
    assert.notEqual(leftBranch.postDecisionSemanticId, rightBranch.postDecisionSemanticId);
    assert.equal(left.reloadedState.trail.storyOutcomes[left.sceneId], leftBranch.storyOutcomeId);
    assert.equal(right.reloadedState.trail.storyOutcomes[right.sceneId], rightBranch.storyOutcomeId);
    assert.deepEqual(leftBranch, resolveNarrativeBranchOutcome(left.sceneId, leftToken));
    assert.deepEqual(rightBranch, resolveNarrativeBranchOutcome(right.sceneId, rightToken));
    assert.deepEqual(leftBranch, deriveNarrativeBranchState(left.reloadedAgainState, left.sceneId));
  }

  for (const stopId of laterStopsWithCastCallbacks()) {
    const fixture = completePriorChapterHelpThenReload(stopId);
    const beat = getCastRelationshipBeat(getExpedition(stopId).payoff.relationshipBeatId);
    const request = deriveResidentRequest(fixture.reloadedState, stopId);
    assert.equal(request.residentId, beat.residentId);
    assert.deepEqual(request.callbackRepairIds, beat.callbackRepairIds);
    assert.deepEqual(request.callbackLines, beat.callbackLines);
    assert.equal(request.callbackLines.every(line =>
      line.repairId && fixture.reloadedState.trail.repairs[line.repairId] === true), true);
    assertResidentRequestNamesConcreteEarlierRepair(request);
  }
});

test("mission checkpoints persist identities but no served, answer, event, brand, or capability authority", () => {
  for (const fixture of checkpointFixturesForEveryPowerAndTransactionStage()) {
    const checkpoint = checkpointMission(fixture.state);
    assertExactMissionCheckpointShape(checkpoint);
    assertNoPrivateCheckpointAuthority(checkpoint, [
      "servedInstance", "catalogRecord", "answerTokensByActivity", "expectedToken", "correct",
      "evidence", "sceneAccess", "presentationTransition"
    ]);
    const restored = createMissionState(fixture.plan, checkpoint);
    assertRehydratedFromCanonicalTask2AndTask3Authorities(restored, fixture);
    assert.equal(restored.pendingResponseIntents.length, 0);
  }
});

test("adaptive choices are taught-only, deterministic, attempt-stable, and telemetry-blind", () => {
  for (const stopId of ["s8", "s17"]) {
    const base = createMissionPlan({ stopId, state: practicedState(), seed: 19, replayOrdinal: 0 });
    assert.equal(base.review.targetIds.every(id => taughtStrictlyBefore(id, stopId)), true);
    assert.deepEqual(createMissionPlan({ stopId, state: structuredClone(practicedState()), seed: 19, replayOrdinal: 0 }).review, base.review);
    assert.deepEqual(planAfterAddingOnlyMotorTimingAndCosmeticTelemetry(base), base);
    assertActiveAttemptCannotRerollTargetOptionsOrDomain(base);
  }
  const confused = practicedStateWithRecentConfusion({ selected: "short_e", intended: "short_i" });
  const directed = createMissionPlan({ stopId: "s8", state: confused, seed: 19, replayOrdinal: 0 });
  assert.equal(directed.review.contrastTargetId, "short_e");
  assert.equal(directed.review.reason, "recent_confusion");
  assertTeacherActionNamesConstructAndConfusion(directed.review.teacherAction, { selected: "short_e", intended: "short_i" });
  assertTeacherActionOmitsTelemetryCoinsAndMasteryClaim(directed.review.teacherAction);
  assertAnswerPositionsBalanced(createPlansForSeeds(confused, "s8", 0, 999), { maxCountDifference: 50 });
});

test("all eight chapter Wonders preserve literacy cause, game feel, and repaired reload state", () => {
  const run = playFortyStopsThroughPublicMissionReducers({ mode: "fresh" });
  assert.deepEqual(run.chapterWonderEffectIds, SOUND_SEEKERS_CHAPTERS.map(chapter => getBiomeKit(chapter.id).wonderEffectId));
  for (const wonder of run.chapterWonders) {
    assert.deepEqual(wonder.gameFeelKinds, ["anticipation", "contact", "literacy_effect", "resident_reaction", "repair", "settled"]);
    assert.equal(wonder.residentEyelineTargetId, wonder.contactTargetId);
    assert.equal(wonder.materialSoundCount, 1);
    assert.equal(wonder.literacyEffect.construct, wonder.committedConstruct);
    assert.equal(wonder.evidenceAddedByPresentation, 0);
    assertRepairPersistsAfterReloadAndRouteRevisit(wonder);
  }
});

test("canonical mission completion derives durable outputs and is idempotent", () => {
  const finished = finishedMission("s1");
  assert.deepEqual(finished.completion, {
    kind: "sound_seekers_mission_completion",
    missionId: finished.state.plan.id,
    stopId: "s1",
    journeyStep: finished.state.plan.journeyStep,
    completedPhaseIds: finished.state.plan.phases.map(phase => phase.id)
  });
  const once = completeMission(finished.gameStateBeforeCommit, finished.completion);
  const twice = completeMission(once.nextState, finished.completion);
  assert.deepEqual(twice.nextState, once.nextState);
  assert.deepEqual(twice.summary, once.summary);
  assert.throws(() => completeMission(finished.gameStateBeforeCommit, { ...finished.completion, stopId: "s2" }));
  for (const forged of [
    { ...finished.completion }, Object.freeze({ ...finished.completion }),
    structuredClone(finished.completion), JSON.parse(JSON.stringify(finished.completion))
  ]) assert.throws(() => completeMission(finished.gameStateBeforeCommit, forged));
  assert.throws(() => completeMission(stateForDifferentCurrentMission(), finished.completion));
});
```

- [ ] **Step 2: Run mission tests and confirm the red state**

Run: `node --test tests/unit/soundSeekersMissionReducer.test.js tests/unit/soundSeekersWorldState.test.js tests/unit/soundSeekersPlaythrough.test.js`

Expected: FAIL because the mission planner and reducer do not exist.

- [ ] **Step 3: Implement the atomic mission state machine**

```js
export function reduceMission(state, input, context) {
  if (input.type === "resume") {
    return Object.freeze({
      state: restoreSafeCheckpoint(state, input.checkpoint),
      responseIntents: Object.freeze([]),
      transition: null,
      completion: null
    });
  }
  const phase = state.plan.phases[state.phaseIndex];
  const result = reducePhase(phase, state.activity, input, context);
  return advanceOnlyWhenCanonicallyCommitted(state, result);
}
```

Arrival establishes a visible resident problem. Teach runs the real `createTeachSequence()` state through every unfinished item before a scored phase can materialize. For a fresh route, the mission trace is joined bijectively to the 103 authored stop-teach records and rejects any changed order or any changed field in the exact 19-field presentation contract above. It requests every canonical `childAudio`, `targetAudio`, `targetAudioSequence`, and `targetAudioAlternates` reference through the sole audio controller and requires each required delivery to complete truthfully; it never invents a generic `audioKey`. Teach remains unscored and adds no evidence. Stop completion makes that immutable curriculum history available to later mission creation. A Task 1 action carrying `onboarding` receives one `power_onboarding` rehearsal immediately before its first scored attempt; the rehearsal uses the same semantic controls and correction language but substitutes no answer, emits no response intent/evidence, changes no world consequence, and can be replayed. Completed stops plus the local active checkpoint determine whether it has already run, so no new hosted authority is invented.

`createMissionPlan()` begins from the exact expedition phases, then performs only these validated insertions:

1. Insert each Task 1 heart opportunity immediately after its exact `afterPhaseId`.
2. Insert only `getContentDeckPlacements(stopId)` in `(afterPhaseId,order,placementId)` order. This yields exactly four assessed alternative subphases and the one non-assessed s38 morphology subphase, all after teach and before the unchanged surrounding challenge tuples.
3. Replace the presentation of the existing transfer phase with one `story_transfer` composite carrying that same Task 1 transfer action; do not add a second transfer or a separate story evidence phase.
4. Insert each of the six fixed first-use onboarding rehearsals immediately before its owning action.

Heart owner entry calls `serveContentDeck()` with the exact owner binding, derives Task 1 resolver inputs only through `projectBoundContentResolverInputs()`, and materializes the child challenge. Each current response constructs one truthful foundation event. A wrong event is appended, creates no heart use, advances the mission-owned attempt ordinal/ID, and produces a branded `retry` result; only a correct current attempt may add the owner use and produce `advance`. The shared `s6-primary` action rehydrates the already completed `s6-heart-1` owner visit and records its distinct shared action-use ID only on its own correct attempt; it never serves a second visit. No event contains `contentVisitId`.

Each placement serves its exact registered owner, calls `beginContentPlacementAttempt()`, and exposes exactly one current child action through singular `materializeContentPlacementChallenge()`. Resume uses `resumeContentPlacementAttempt()` and discards every old challenge/object reference. One child response intent is committed immediately and exactly once through `commitContentPlacementResponse()`; there is no provisional array, complete-set buffer, partial-set rollback, or wait for later targets. The returned `next_challenge` outcome retains already completed target ordinals and materializes only the next target. A wrong response atomically appends its one truthful event and receipt, adds no use, retains the same target, advances the fresh Task 2 attempt ID, and returns `retry` or, on the third miss, `model_required`. While `stage:"model_pending"`, a response is rejected. The mission must present the returned correction, call `completeContentPlacementCorrectionModel()` exactly once for that canonical third-miss correction, verify that it adds no event/receipt/use and preserves the already-fresh attempt ID, then rematerialize support 3/revealed true. Only the final correct target adds the one placement use and clears the checkpoint. The s38 response remains exactly `{challengeId,kind:"non-recording-complete",action:"introduce_word_ending"}` and produces one exposure use plus zero evidence and one receipt in that same one-response flow.

Every stop enters its composite through `beginStoryTransferTransaction()`, begins the exact Task 3 presentation, presents `toChildConnectedTextScene()`, and then calls `checkpointStoryTransferTransaction()`: `narrativeChoiceToken:null` for the 32 assessed connected-text scenes and one real route-ordered child narrative token for the eight boss bridges. That token is written once before the first boss attempt and remains byte-identical through every wrong/fresh attempt and both final uses. Resume calls `resumeStoryTransferTransaction()` plus `rehydrateConnectedTextPresentation()`, never retains a served/presentation object, and makes every pre-reload presentation state/transition/access stale. The 32 non-boss final actions use `createConnectedTextChallenge()`; all 40 ultimately consume object-identical `materializeStoryTransferChallenge()` output, while the eight bosses additionally use `materializeBossTransferChallenge()` plus `projectBossTransferOptionsForChild()`, never a literal word token, singleton option list, or fabricated challenge. Each wrong `completeStoryTransferTransaction()` result appends its one event/receipt, adds neither use, retains the same narrative token, and advances Task 3 with that authenticated evidence to an exact-current `correction` transition. That transition drives the visible/spoken correction only: `issueSceneVisualAccess()` rejects it and no post-choice visual, branch consequence, repair, relationship change, or world payoff occurs. A third wrong leaves Task 2 at `model_pending`; the mission rejects a correct response until it calls `completeStoryTransferCorrectionModel()` once, adds no event/receipt/use/transition, preserves the already-fresh attempt ID, and resumes at support 3/revealed true. Only `completed:true` on the later current response atomically writes both reciprocal uses plus its final event and permits Task 3 to advance in order through `action`, `resolved`, and direct `meaning_support`; only those exact-current eligible transitions may be passed to `issueSceneVisualAccess()`. Scene replacement, leaving the connected-text phase, route exit, and unmount call `closeConnectedTextPresentation()` with the exact current state before dropping it; beginning/rehydrating another presentation defensively invalidates the old lifecycle as well.

For an ordinary non-deck challenge, `commitMissionResponse()` calls the foundation challenge/instruction/evidence validators and appends the single returned canonical event. For heart, placement, and story-transfer phases it uses the owners above and maps their exact canonical outcomes without re-evaluating an answer: placement `retry`/`model_required` stay in the same target, `next_challenge` advances only to that placement's next target, and `completed` advances the mission phase; story `retry`/`model_required` remain in the transaction and `completed` advances. The model-completion inputs call their exact Task 2 API directly and emit no response intent or evidence-bearing mission commit. The boundary never accepts an event-like or outcome-like object from a power, view, Phaser, audio, preview, browser hook, or caller context. Every response path builds a complete local candidate and commit result, then `reduceMission()` validates/consumes that exact result through the current power, marks it applied against the finalized candidate revision, and returns it once as `transition`. If power consumption or final binding fails, neither candidate nor transition is returned. A validation failure leaves the input byte-equivalent; an identical same-revision retry returns the same in-memory result object, but once power-consumed it is stale for mutation and remains valid only as the one read-only current transition. No response fans out to another target/domain/deck, and no mission-owned queue can delay or combine placement responses.

The correction ladder is driven only by committed wrong events and `nextCorrection()`. Attempt 0 begins at support 0. First miss names the selected response and replays the relevant contrast; attempt 1 is fresh at support 1. Second miss isolates the important sound/position and reduces irrelevant presentation load without removing an answer; attempt 2 is fresh at support 2. Third miss creates the already-fresh attempt 3 in `model_pending`; its one model-only step has zero response/evidence/receipt/use and changes only the checkpoint stage to `response_pending` while retaining that attempt ID. Only then may attempt 3 respond at support 3/revealed true. The supported correct event never rewrites a miss. Wrong evidence is part of immutable history, but it cannot rematerialize or reorder the active challenge/options; only after the active loop finishes may later planning use the confusion to choose the same construct in another legitimate eligible domain. Full, simplified, reduced-motion, and every motor profile resolve the same correction record, visible/spoken text, support, attempt IDs, and checkpoint; only presentation changes.

The exact mission checkpoint is rooted at `checkpoint.mission` and contains only `{schemaVersion:1,kind:"sound_seekers_mission",contentVersion,missionId,stopId,journeyStep,attemptId,attemptOrdinal,missionRevision,seed,replayOrdinal,phaseId,completedPhaseIds,teach:{teachIndex,teachTargetId},nextDecisionOrdinal,activity:{kind,actionId,challengeId,powerCheckpoint},activeContent,connectedTextPresentation}`. For ordinary/heart work, attempt IDs are exactly `${missionId}:${phaseId}:attempt:${attemptOrdinal}`; placement/story phases mirror the Task 2 pending attempt ID/ordinal exactly. An ordinary/heart `powerCheckpoint` may retain its semantic state plus a canonical correction record ID and model-step pending/consumed flag, but no support/correctness value supplied by a caller. Placement/story support, reveal, correction, and model truth are never copied there: their Task 2 checkpoint persists only stage/identity/ordinals and resume rederives the rest from valid attempt receipts/evidence. `activeContent` is `null` or one strict identity descriptor: heart `{kind:"heart",category:"heartWords",visitId,actionUseId}`, placement `{kind:"placement",placementId,visitId}`, or story `{kind:"story_transfer",transactionId}`. `connectedTextPresentation` is either `null` or the strict Task 3 serializable checkpoint. Task 2-owned sibling placement/story checkpoints remain byte-for-byte under their own authority and are never copied into `checkpoint.mission`. Served instances, catalog records, resolver sources, answers, expected tokens, response intents, commit results/applied transitions/private metadata, evidence payloads, derived correctness/phase, presentation brands/transitions, completion brands, Task 4 capabilities, audio objects, and interaction contexts are forbidden. Resume rehydrates all of them from canonical state/catalog/history, discards every old object reference, and reissues fresh visual access or final completion only after current-state validation.

`completeMission()` and `deriveWorldState()` consume only full-state `validContentDeckUses()` output. At each boss they call `resolveNarrativeBranchOutcome(sceneId,narrativeChoiceToken)` only after the reciprocal final story/transfer pair proves that persisted token. The normalized v2 mutation is exactly `trail.storyOutcomes[sceneId] = outcome.storyOutcomeId`; it never persists a caller-authored token, consequence, evaluator key, or render semantic. `deriveNarrativeBranchState()` rederives and deep-compares the complete exact `{sceneId,token,storyOutcomeId,postDecisionSemanticId}` Task 3 record on every display/reload, so different legal boss tokens produce different branch outcome/semantic records and a tampered stored outcome fails closed. `deriveResidentRequest()` calls `getCastRelationshipBeat(getExpedition(stopId).payoff.relationshipBeatId)` and exposes that beat's exact resident plus ordered `callbackLines` only when every `callbackRepairId` and every callback line's `repairId` already exists in the reloaded `trail.repairs`. It rejects future/cross-chapter/missing repairs and never fabricates generic memory copy. Thus a later resident visibly remembers each concrete earlier help after reload rather than resetting to first-meeting dialogue.

`missionReducer.js` owns a second module-private `WeakSet`/`WeakMap` for the exact completion object. It issues a completion only from a current final mission revision whose every phase has canonical commit history. `completeMission()` accepts only that same in-memory object and matching current game state; literal/frozen/clone/serialized/stale/cross-mission completion objects fail. It resolves the expedition/chapter itself, increments monotonic `journeyStep` once, and idempotently derives completed stop, repair, relationship, consequence, journal, route cursor, chapter coverage, and reward. Reusing the same genuine object against its already-committed matching state returns the existing result; using it against any diverged state fails. Its frozen summary remains exactly `{kind:"sound_seekers_mission_committed",stopId,journeyStep,repairId,relationshipBeatId,consequenceId}`. Callers cannot supply or override those IDs. Save after every canonically completed learning loop; a restored final position revalidates and receives a fresh brand but emits no fresh intent/evidence/use.

Adaptive selection uses only immutable v2 evidence/confusions, taught history, teacher-owned assignment constraints, deterministic seed/replay ordinal, canonical eligibility, and monotonic journey step. `s8`/`s17` resolve only through `createReviewTargetSequence()` and the committed `selectNextChallenge()` result. The plan preserves its named target, homogeneous comparison-family contrast, support, reason, legitimate alternate-domain later-review choice, and teacher next action; the latter must name the construct and selected-versus-intended confusion and cannot mention time, travel, coins, rewards, or formal mastery. Actual mission options pass the same 0–999 deterministic position-balance gate as the foundation, with maximum position-count difference 50. A selected plan freezes target/options/domain/content/interaction identity for its entire attempt and checkpoint. Reaction time, motor path, misses caused only by input access, collisions, device/frame rate, rewards, cosmetics, presentation profile, audio latency, and newly appended wrong evidence cannot reroll that active challenge or its option order. After the current loop resolves, the immutable wrong evidence may affect a later eligible review only. Correction may increase canonically recorded support and alter scaffolding only; it cannot remove choices, change the answer, or reroll content mid-attempt.

- [ ] **Step 4: Run deterministic full-route simulations**

Run: `node --test tests/unit/soundSeekersMissionReducer.test.js tests/unit/soundSeekersWorldState.test.js tests/unit/soundSeekersPlaythrough.test.js tests/unit/soundSeekersStateV2.test.js tests/unit/soundSeekersPowerReducers.test.js tests/unit/soundSeekersMotorAssists.test.js tests/unit/soundSeekersTeachSequence.test.js tests/unit/soundSeekersLearningDirector.test.js tests/unit/questCorrection.test.js`

Expected: PASS for fresh, assisted-perfect, all-first-wrong, three-misses-then-correct, reload-every-phase, two-route-circuit, and the real accumulating 40-stop campaign: all 103 exact teach presentations first, six consequence-free onboarding rehearsals, all 200 authored interaction contexts, exactly 80 heart visits, 81 valid heart uses, 40 valid story uses, 40 valid transfer uses, four valid alternative uses, one valid morphology use, and the exact five placement phases. The perfect route has 32 connected-text plus 8 novel-decoding story events and 8 alternative-target events; one miss then fresh success has 64/16 and 16 alternative events; three misses then model then fresh success has 128/32 and 32 alternative events, while final use counts remain `81/40/4/1/40`. Every placement action commits immediately, every wrong story response yields one Task 3 correction transition but zero Task 4 access/payoff, every third miss consumes exactly one zero-evidence model step before success, and every scene replacement/leave/unmount closes its presentation. All 16 authored branch outcomes across both legal choices at the eight bosses, reloaded cast callback requests, Wonders, direct Word Forge/Blend Bridge meaning moments, the complete correction ladder, branded mission/Task 3/Task 4 authority, canonical completion summaries, persistent repair, no stuck simulation, and no motor/telemetry effect on readiness are required.

- [ ] **Step 5: Commit the expedition engine**

```bash
git add -- src/features/soundSeekers/engine/createChallenge.js src/features/soundSeekers/engine/createMissionPlan.js src/features/soundSeekers/engine/missionResponseCommit.js src/features/soundSeekers/engine/missionReducer.js src/features/soundSeekers/engine/worldState.js src/features/soundSeekers/engine/stateV2.js src/features/soundSeekers/engine/powers/contracts.js src/features/soundSeekers/engine/powers/echoSearch.js src/features/soundSeekers/engine/powers/contrastSort.js src/features/soundSeekers/engine/powers/wordForge.js src/features/soundSeekers/engine/powers/blendBridge.js src/features/soundSeekers/engine/powers/memoryDelivery.js src/features/soundSeekers/engine/powers/storyPower.js src/features/soundSeekers/engine/powers/index.js tests/unit/soundSeekersMissionReducer.test.js tests/unit/soundSeekersWorldState.test.js tests/unit/soundSeekersPlaythrough.test.js
git diff --cached --name-status
git diff --cached --check
git commit -m "feat: add checkpointed Sound Seekers expeditions"
```

### Task 4: Build one authored world renderer, Phaser traversal adapter, semantic action layer, and audio owner

**Files:**
- Create: `src/features/soundSeekers/runtime/SoundSeekersStage.jsx`
- Create: `src/features/soundSeekers/runtime/soundSeekersScene.js`
- Create: `src/features/soundSeekers/runtime/inputBridge.js`
- Create: `src/features/soundSeekers/runtime/sceneViewModel.js`
- Create: `src/features/soundSeekers/runtime/soundSeekersAudioController.js`
- Create: `src/features/soundSeekers/runtime/useSoundSeekersAudioController.js`
- Create: `src/features/soundSeekers/ui/ActionLayer.jsx`
- Create: `src/features/soundSeekers/ui/MissionHud.jsx`
- Create: `tests/unit/soundSeekersSceneViewModel.test.js`
- Create: `tests/unit/soundSeekersInputBridge.test.js`
- Create: `tests/unit/soundSeekersStageLifecycle.test.js`
- Create: `tests/unit/soundSeekersAudioController.test.js`

**Interfaces:**
- Consumes the actual content/art exports `<SceneVisual>`, `<LayeredBiome>`, `<Landmark>`, `<SoundSeekersCharacter>`, all ten canonical poses, `getBiomeKit()`, route/landmark/character catalogs, `SOUND_SEEKERS_MEANING_VISUALS`, `resolveMeaningVisual(semanticId)`, `issueSceneVisualAccess()`, `validateSceneVisualAccess()`, Task 3 `getMeaningSupport()`, child scenes and branded presentation transitions, only a current applied mission transition accepted by `validateCurrentMissionTransition()`, the mission scene/action view models, motor assists, instruction/audio/material manifests, `createAudioDelivery()`/`reduceAudioDelivery()`, the shared cue player/music ducking boundary, and `onInput(input)`.
- Produces `<SoundSeekersStage model assists audioController onInput />`, traversal-only `createSoundSeekersScene(config)`, `createInputBridge({canvas,actionRoot,dispatch})`, `createSceneViewModel(input)`, `createMeaningPayoffModel({powerId,wordId,missionTransition})`, `createGameFeelSequence(model,commitResult)`, `<ActionLayer activity onInput onAudioRequest />`, `createSoundSeekersAudioController({cuePlayer,music,clock})`, and `useSoundSeekersAudioController(options)`. The stage owns one guarded Phaser instance per mounted canvas, but Task 4's React/SVG components remain the only world/cast/option/meaning renderer and semantic DOM controls remain usable when Phaser fails.
- The audio controller public surface is exactly `{getSnapshot,subscribe,request,replay,cancel,dispose}`. `request({cueId,audioKey,visibleText,spokenText,kind,requiresAudio})` validates the canonical instruction/scene/meaning record, owns one active delivery, ducks/restores music, and reports the exact `audioDelivery` lifecycle. It exposes no completion setter. Leaf components emit requests; only the controller calls the cue player.

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

test("React owns every world and cast visual while Phaser is traversal-only", () => {
  const ownership = parseRuntimeRenderImports();
  assert.deepEqual(ownership.react, ["SceneVisual", "LayeredBiome", "Landmark", "SoundSeekersCharacter"]);
  assert.deepEqual(ownership.phaserForbidden, []);
  assertNoSecondBiomeCastLandmarkOptionMeaningOrAvatarCatalog();
  assertSceneVisualReceivesOnlyChildSceneAndCurrentIssuedAccess();
});

test("one audio controller owns playback and correction transcript parity", async () => {
  const controller = createSoundSeekersAudioController(fakeCanonicalAudioDependencies());
  const full = await playCorrectionThroughController(controller, correctionFixture(), { profile: "full" });
  const simplified = await playCorrectionThroughController(controller, correctionFixture(), { profile: "simplified" });
  assert.deepEqual(full.spokenText, full.visibleText);
  assert.deepEqual(simplified.spokenText, full.spokenText);
  assert.deepEqual(full.deliveryStatuses, ["unavailable", "loading", "started", "completed"]);
  assertOneActiveVoiceAndBalancedMusicDucking(full);
  assertOnlyAudioControllerImportsCuePlayerOrCreatesAudio();
});

test("a committed literacy action has the complete game-feel sequence and reduced equivalent", () => {
  const committed = realCurrentMissionTransitionThroughReducer();
  const full = createGameFeelSequence(actionModel(), committed);
  const reduced = createGameFeelSequence(actionModel({ reducedMotion: true }), committed);
  assert.deepEqual(full.steps.map(step => step.kind), [
    "anticipation", "contact", "literacy_effect", "resident_reaction", "repair", "settled"
  ]);
  assert.equal(full.steps.find(step => step.kind === "resident_reaction").eyelineTargetId, full.steps.find(step => step.kind === "contact").targetId);
  assert.equal(full.steps.filter(step => step.materialSoundId).length, 1);
  assert.equal(full.steps.find(step => step.kind === "literacy_effect").construct, actionModel().committedConstruct);
  assert.deepEqual(reduced.semanticFinalState, full.semanticFinalState);
  assert.equal(reduced.continuousMotion, false);
  for (const forged of forgedClonedStaleAndCrossMissionCommitResults(committed)) {
    assert.throws(() => createGameFeelSequence(actionModel(), forged));
  }
});

test("every Word Forge and Blend Bridge success immediately joins Task 3 support to its Task 4 meaning visual", () => {
  for (const action of allAuthoredWordForgeAndBlendBridgeActions()) {
    const pending = currentMissionBeforeResponse(action);
    assert.throws(() => createMeaningPayoffModel({
      powerId: action.powerId, wordId: action.wordId, missionTransition: pending.transition
    }));
    const committed = commitCorrectResponseThroughMissionReducer(pending);
    const payoff = createMeaningPayoffModel({
      powerId: action.powerId, wordId: action.wordId, missionTransition: committed.transition
    });
    assert.strictEqual(payoff.support, getMeaningSupport(action.wordId));
    assert.strictEqual(payoff.visual, resolveMeaningVisual(payoff.support.visualSemanticId));
    assert.equal(payoff.visual.wordId, action.wordId);
    assert.equal(payoff.audioRequest.audioKey, payoff.support.audioKey);
    assert.equal(payoff.evidenceAdded, 0);
    assert.equal(payoff.immediateBeforeNextMissionAction, true);
    for (const forged of forgedClonedStaleAndCrossMissionCommitResults(committed.transition)) {
      assert.throws(() => createMeaningPayoffModel({
        powerId: action.powerId, wordId: action.wordId, missionTransition: forged
      }));
    }
  }
});
```

- [ ] **Step 2: Run renderer adapter tests and confirm the red state**

Run: `node --test tests/unit/soundSeekersSceneViewModel.test.js tests/unit/soundSeekersInputBridge.test.js tests/unit/soundSeekersStageLifecycle.test.js tests/unit/soundSeekersAudioController.test.js`

Expected: FAIL because the scene and input adapters do not exist.

- [ ] **Step 3: Implement one renderer with presentation profiles**

```jsx
export function SoundSeekersStage({ model, assists, audioController, onInput }) {
  const canvasRef = useRef(null);
  useSoundSeekersScene(canvasRef, model.traversal, assists, onInput);
  return (
    <div className="ss-stage" data-scene-profile={assists.simplifiedScene ? "simplified" : "full"}>
      {model.childScene
        ? <SceneVisual {...model.sceneVisualProps} onChoose={token => onInput({ type: "choose", token })} />
        : <LayeredBiome {...model.biomeProps} />}
      <canvas ref={canvasRef} aria-hidden="true" data-ss-phaser-role="traversal-only" />
      {!model.childScene && <ActionLayer activity={model.activity} onInput={onInput} onAudioRequest={audioController.request} />}
    </div>
  );
}
```

`sceneViewModel.js` joins only canonical Task 4 IDs. For connected text it passes the exact Task 3 child scene, current attempt/revision, and an access object issued directly from the current branded Task 3 transition into `SceneVisual`; it never passes a phase boolean or projection literal. For other phases it passes the real kit, route, landmark states, and canonical character appearances to `LayeredBiome`/`Landmark`/`SoundSeekersCharacter`. The same components and appearance serialization are used in campaign, creator, preview, simplified, fallback, and reduced-motion views.

For every authored Word Forge and Blend Bridge action, the successful current applied mission transition pauses the loop at an immediate `meaning_payoff` presentation before the next mission action. `createMeaningPayoffModel()` accepts only that exact-current `advance` transition, the action's canonical `wordId`, and one of the two exact power IDs. It joins `getMeaningSupport(wordId)` directly to Task 4 `resolveMeaningVisual(support.visualSemanticId)`, requires identical `wordId`, and returns the exact support, exact visual, and canonical meaning-audio request for `<MeaningPayoff>`. It rejects pending/retry/model-required, literal, cloned, serialized, stale, cross-action, wrong-word, and other-power inputs. The payoff gives the child the support's definition/action/contrast, direct reviewed visual, and replayable oral meaning immediately after the literacy decision; it is absent before success, emits no evidence, and cannot be skipped by renderer failure because the same DOM model renders in fallback/reduced/simplified profiles.

`createGameFeelSequence()` accepts only a current applied mission transition validated by `validateCurrentMissionTransition()` and its canonical finalized model. A current `advance` returns exactly one frozen six-step sequence: `anticipation` uses the shared anticipate pose before contact; `contact` uses the authored object/recipient and contact pose; `literacy_effect` names the committed construct and the kit's phoneme-ripple, grapheme-reveal, word-assembly, blend-path, remembered-cue, or text-action effect; `resident_reaction` uses the react pose with eyeline fixed to the contacted target; `repair` uses the repair pose, exact landmark resolved state, and one manifest-backed route/prop material sound; `settled` uses the clear recover/idle final pose. Placement `continue` authorizes the same anticipation/contact/construct effect/reaction/settled feedback for that one correct target but no repair or Wonder because the placement is unfinished. A current `retry` or `model_required` authorizes only the canonical correction/model reaction and never repair/Wonder. Reduced motion removes tweening/particles/squash but keeps contact outline, literacy-effect final state, eyeline/reaction, material cue, and every allowed settled/repair state. No step creates a response intent/evidence event, and the sequence cannot be issued from an issued-but-unapplied, literal, cloned, serialized, stale, or cross-mission result.

Phaser `AUTO` hosts one traversal-only scene. Create it only after the browser canvas ref exists; retain model/input callbacks in refs, update without reconstructing on React renders, remove every listener/tween and call `destroy(true)` on cleanup, and guard late callbacks after unmount. It may calculate avatar coordinates, route bounds, camera easing, interaction-ring proximity, and transient non-semantic particles. It may not import or draw biome layers, backgrounds, landmarks, residents, player/cast sprites, choices, graphemes, meanings, repairs, consequences, or correctness. React positions the one canonical `<SoundSeekersCharacter>` from those coordinates. If Phaser/WebGL/Canvas fails, the Task 4 code-native world and semantic controls remain complete; auto-travel/focus controls replace traversal without changing the learning response.

The DOM action layer renders instruction, replay, stable choices/workbench/sort bins, correction, and live feedback with no hidden completion control. Connected-text options render only through `SceneVisual`, never a duplicate `ActionLayer` list. Input maps pointer, touch with cancellation, mouse, arrows/WASD, Enter, Space, Escape/back, Tab/Shift+Tab, and single-switch sequential scan/activate to the same semantic inputs, deduplicating one physical action. Drag actions have tap/place and keyboard/switch equivalents. The controller uses one visible/spoken transcript record for instruction and correction, so canvas fallback, assist profiles, and input modes cannot drift.

The audio controller serializes requests, cancels stale phase/attempt cues, rejects a source/text/key mismatch, and reports `unavailable`, `loading`, `started`, `completed`, `interrupted`, or `failed` truthfully. Instructional speech ducks music and restores it once; narration, prompt, target, whole-word, isolated-scaffold, correction, post-decision meaning, and restrained material-effect requests cannot overlap. A material request must match the current canonical kit/contact/repair step and never substitutes for required instructional delivery. Muting or failure never becomes completed required audio. Unmount/scope/phase changes cancel and clean up. Reducers receive only the frozen delivery snapshot attached to their canonical response commit.

- [ ] **Step 4: Run renderer adapter tests and build**

Run: `node --test tests/unit/soundSeekersSceneViewModel.test.js tests/unit/soundSeekersInputBridge.test.js tests/unit/soundSeekersStageLifecycle.test.js tests/unit/soundSeekersAudioController.test.js tests/unit/soundSeekersSceneVisualAccess.test.js tests/unit/soundSeekersConnectedTextPresentation.test.js`

Expected: PASS, including one physical action/one semantic dispatch, one React-owned visual/cast path, genuine mission/Task 3/Task 4 capability checks, immediate direct Task 3 support plus Task 4 meaning visuals for every Word Forge/Blend Bridge success, anticipation/contact/literacy-effect/eyeline/reaction/material-sound/repair sequencing, controller-only audio, correction transcript parity, lifecycle cleanup, Phaser failure, reduced-motion equivalence, and simplified-scene invariants.

Run the production build in a fresh validated OS-temporary root, with failure-safe exact cleanup:

```bash
(
  set -e
  runtime_task4_build_root="$(node tools/shootSoundSeekersV2Content.mjs --create-build-root)"
  cleanup_runtime_task4_build_root() { node tools/shootSoundSeekersV2Content.mjs --clean-build-root "$runtime_task4_build_root"; }
  trap cleanup_runtime_task4_build_root EXIT INT TERM
  npx vite build --outDir "$runtime_task4_build_root/production"
  cleanup_runtime_task4_build_root
  trap - EXIT INT TERM
)
```

The tool-created root must be absent afterward. This step neither creates nor removes project `dist/` or `dist-quest-offline/`; any pre-existing directories remain byte-identical.

Expected: PASS with one Sound Seekers runtime chunk and no eager Phaser load on unrelated routes.

- [ ] **Step 5: Commit the renderer and action layer**

```bash
git add -- src/features/soundSeekers/runtime/SoundSeekersStage.jsx src/features/soundSeekers/runtime/soundSeekersScene.js src/features/soundSeekers/runtime/inputBridge.js src/features/soundSeekers/runtime/sceneViewModel.js src/features/soundSeekers/runtime/soundSeekersAudioController.js src/features/soundSeekers/runtime/useSoundSeekersAudioController.js src/features/soundSeekers/ui/ActionLayer.jsx src/features/soundSeekers/ui/MissionHud.jsx tests/unit/soundSeekersSceneViewModel.test.js tests/unit/soundSeekersInputBridge.test.js tests/unit/soundSeekersStageLifecycle.test.js tests/unit/soundSeekersAudioController.test.js
git diff --cached --name-status
git diff --cached --check
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
- Consumes: `loadSoundSeekersV2Progress`, `saveSoundSeekersV2Progress`, `questProgressStorageKey`, `computeHydratedValue("phonics_quest","__all__",...)`, `normalizeAllowlistedSettings`, the canonical mission completion/checkpoint APIs, `deriveNarrativeBranchState()`, `deriveResidentRequest()`, the exact connected-text presentation close lifecycle, the one runtime audio controller, Task 4 `SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS`, `createCharacterAppearance`, `serializeCharacterAppearance`, `appearanceSignature`, `<SoundSeekersCharacterCreator>`, the shared `<SoundSeekersCharacter>`, app sound/accessibility values, content catalogs, stage, and feature UI. `loadQuestProgress`/`saveQuestProgress` remain the legacy `QuestRoot` bridge only until the separate cutover-and-release plan removes its last consumer.
- Produces: `createSoundSeekersProgressController({ progressScopeKey, load, save, eventTarget, storage })`, `reconcileSoundSeekersHydration(current,stored,{resetApplied})`, `useSoundSeekersProgressController(progressScopeKey)`, `<SoundSeekersRoute progressScopeKey isSoundEnabled onExit initialFixtureId accessibilitySettings />`, `<SoundSeekersGame state onStateChange audioController ... />`, the sole fixture collection export `SOUND_SEEKERS_PREVIEW_FIXTURES`, `resolveSoundSeekersPreviewFixture(request)`, and `<CreatorSheet appearance onChange />`.
- The controller is the sole v2 route persistence owner. Its public instance has `getSnapshot()`, `subscribe(listener)`, `commit(update,{flush})`, `flush()`, and `dispose()`. It loads once per scope and writes through `saveSoundSeekersV2Progress`. The real `lp-progress-hydrated` event is a notification shaped `{ studentId, rows, resetApplied }`; it does not carry a trusted `stored` payload. Accept it only when `String(detail.studentId)` exactly equals the active `progressScopeKey`, then re-read normalized v2 state with `loadSoundSeekersV2Progress(progressScopeKey)` from `questProgressStorageKey(progressScopeKey)`. Replace current state with that re-read value when `resetApplied === true`; otherwise reconcile current and re-read stored state through `computeHydratedValue("phonics_quest","__all__",...)`. For cross-tab sync, accept only a real `StorageEvent` whose `key` equals that exact scoped key, whose `storageArea` is the active `window.localStorage`, and whose `newValue` is non-null; then re-read through the same v2 loader and reconcile. Ignore wrong-student hydration, wrong-key/wrong-storage-area storage events, old-scope callbacks after a scope change, and all callbacks after disposal. Flush the current safe checkpoint on unmount/scope change and never synthesize evidence. The teacher assignment is accepted only from the normalized stored/hydrated payload, survives local commit/reload/cross-tab merge, and remains stripped from child cloud uploads by the existing sanitizer; it is not a route prop or child-owned field.
- Persistence accepts only normalized v2 reducer output, the exact `checkpoint.mission` descriptor, and Task 2's separately owned placement/story-transfer checkpoints. Its only narrative-branch field is the allowlisted `trail.storyOutcomes` map whose exact `sceneId -> storyOutcomeId` entries are derived by `completeMission()` from a valid final reciprocal pair and revalidated against `SOUND_SEEKERS_NARRATIVE_BRANCH_OUTCOMES` on load/merge; it never stores the narrative token, branch record, `postDecisionSemanticId`, or presentation transition. It also never stores a served instance, catalog record, answer/expected token, response intent, mission commit result/transition/private metadata, pending evidence object, presentation transition/brand, mission completion/brand, Task 4 capability, audio controller/delivery object, interaction context, motor trace, raw timing, or derived correctness/support. The child cloud sanitizer additionally removes the teacher assignment and any unknown field. Preview, Phaser, UI, audio, and query parameters cannot call `commit()` with an event-like object or manufacture a mission result/transition/completion.
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
  assert.equal(preview.checkpoint.mission.stopId, "s1");
  assert.equal(preview.checkpoint.mission.phaseId, "s1-secondary");
  assert.equal(preview.checkpoint.mission.activity.actionId, authored.id);
  assertExactMissionCheckpointShape(preview.checkpoint);
  assertNoPrivateCheckpointAuthority(preview.checkpoint);
});

test("every canonical creator option serializes and renders identically in creator and world", () => {
  for (const raw of canonicalCreatorAppearanceCases(SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS)) {
    const appearance = createCharacterAppearance(raw);
    const route = renderSoundSeekersWithAppearance(appearance);
    assert.equal(route.creatorPreview.dataset.appearanceSignature, appearanceSignature(appearance));
    assert.equal(route.worldAvatar.dataset.appearanceSignature, appearanceSignature(appearance));
    assert.equal(route.creatorPreview.dataset.serializedAppearance, serializeCharacterAppearance(appearance));
    assert.equal(route.worldAvatar.dataset.serializedAppearance, serializeCharacterAppearance(appearance));
    assert.deepEqual(route.savedState.settings.characterAppearance, appearance);
    assert.equal(route.evidence.length, 0);
  }
});

test("the route creates one audio owner and visible and spoken correction remain one transcript", () => {
  const route = renderSoundSeekersRouteWithFakeAudio();
  assert.equal(route.audioControllersCreated, 1);
  const correction = route.playWrongThenCorrect();
  assert.equal(correction.visibleText, correction.spokenText);
  route.unmount();
  assert.deepEqual(route.audioCleanup, { active: 0, listeners: 0, musicDuckDepth: 0 });
});

test("scene replacement, phase leave, route exit, and unmount close the exact current presentation", () => {
  for (const leaveKind of ["scene-replacement", "phase-leave", "route-exit", "unmount"]) {
    const route = renderAtLiveConnectedTextPresentation();
    const active = route.currentPresentation();
    route.performLeave(leaveKind);
    assert.deepEqual(route.presentationCloseCalls, [{
      api: "closeConnectedTextPresentation", presentation: active
    }]);
    assert.equal(route.currentSceneAccessValid(), false);
    assert.throws(() => route.checkpointPresentation(active));
  }
});

test("boss branch outcome and resident callback memory render from reloaded durable state", () => {
  const first = completeBossNarrativeChoiceThroughVisibleGame({ stopId: "s5", choiceOrdinal: 0 });
  const second = completeBossNarrativeChoiceThroughVisibleGame({ stopId: "s5", choiceOrdinal: 1 });
  const firstReload = reloadProductionRoute(first.savedState);
  const secondReload = reloadProductionRoute(second.savedState);
  const firstOutcome = resolveNarrativeBranchOutcome(first.sceneId, first.narrativeChoiceToken);
  const secondOutcome = resolveNarrativeBranchOutcome(second.sceneId, second.narrativeChoiceToken);
  assert.notEqual(firstOutcome.storyOutcomeId, secondOutcome.storyOutcomeId);
  assert.notEqual(firstOutcome.postDecisionSemanticId, secondOutcome.postDecisionSemanticId);
  assert.equal(firstReload.state.trail.storyOutcomes[first.sceneId], firstOutcome.storyOutcomeId);
  assert.equal(secondReload.state.trail.storyOutcomes[second.sceneId], secondOutcome.storyOutcomeId);
  assert.equal(firstReload.world.postDecisionSemanticId, firstOutcome.postDecisionSemanticId);
  assert.equal(secondReload.world.postDecisionSemanticId, secondOutcome.postDecisionSemanticId);
  assert.equal(firstReload.fieldJournal.storyOutcomeId, firstOutcome.storyOutcomeId);
  assert.equal(secondReload.fieldJournal.storyOutcomeId, secondOutcome.storyOutcomeId);

  const callback = reloadAtLaterChapterStop(completePriorChapterRepairs());
  const beat = getCastRelationshipBeat(getExpedition(callback.stopId).payoff.relationshipBeatId);
  assert.deepEqual(callback.residentRequest.callbackRepairIds, beat.callbackRepairIds);
  assert.deepEqual(callback.residentRequest.callbackLines, beat.callbackLines);
  assertResidentRequestNamesVisiblePriorRepair(callback.residentRequest, callback.state.trail.repairs);
});

test("Word Forge and Blend Bridge show reviewed meaning before the next action", () => {
  for (const fixture of authoredWordForgeAndBlendBridgeRouteFixtures()) {
    const route = renderFixtureBeforeDecision(fixture);
    assert.equal(route.queryMeaningPayoff(), null);
    route.completeCurrentDecisionThroughVisibleControls();
    const payoff = route.getMeaningPayoff();
    assert.strictEqual(payoff.support, getMeaningSupport(fixture.wordId));
    assert.strictEqual(payoff.visual, resolveMeaningVisual(payoff.support.visualSemanticId));
    assert.equal(route.nextMissionActionStarted, false);
    route.activateMeaningReplay();
    assert.equal(route.lastAudioRequest.audioKey, payoff.support.audioKey);
    assert.equal(route.meaningEvidenceAdded, 0);
    route.continueFromMeaning();
    assert.equal(route.nextMissionActionStarted, true);
  }
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
    assert.deepEqual(fixture.legalActorTranscripts, deriveAllLegalActorTranscriptsFromChildView(fixture));
    assertNoKeys(fixture, ["expectedToken", "correct", "answerMap", "privateAnswerMap", "supportLevel", "event", "commitResult", "missionTransition", "completion"]);
    assertEveryPublicChoiceHasEqualShapeAndOneLegalActorTranscript(fixture);
  }
  assert.throws(() => resolveSoundSeekersPreviewFixture({ stopId: "s1", phaseId: "s1-primary", powerId: "story_power" }));
});

test("the child route renders the exact teach corpus and every chapter Wonder/repair", () => {
  const route = playFreshRouteThroughVisibleGame();
  assert.equal(route.teachPresentations.length, 103);
  assert.deepEqual(route.teachPresentations.map(pickTeachPresentation), allCanonicalTeachPresentationTuples());
  route.teachPresentations.forEach(assertEveryRequiredTeachAudioCompleted);
  assert.equal(route.teachEvidence.length, 0);
  assert.deepEqual(route.chapterWonderEffectIds, SOUND_SEEKERS_CHAPTERS.map(chapter => getBiomeKit(chapter.id).wonderEffectId));
  assertEveryWonderHasCompleteGameFeelAndPersistentReloadedRepair(route);
});

test("route storage and cloud payloads contain no private runtime authority", () => {
  const route = completeAndCheckpointEveryTransactionStage();
  for (const payload of [route.localPayload, route.cloudPayload]) {
    assertNoPrivateRuntimeAuthority(payload);
    assertNoKeys(payload, ["expectedToken", "answerTokensByActivity", "servedInstance", "catalogRecord",
      "missionCommitResult", "commitResult", "missionTransition", "missionCompletion", "presentationTransition", "sceneAccess",
      "responseIntents", "audioController", "audioDelivery", "interactionContext", "motorTrace",
      "rawTiming", "isCorrect", "supportLevel"]);
  }
  assert.equal("assignment" in route.localPayload, true);
  assert.equal("assignment" in route.cloudPayload, false);
});
```

- [ ] **Step 2: Run the orchestration test and confirm the red state**

Run: `node --test tests/unit/soundSeekersGameContract.test.js tests/unit/soundSeekersCreatorIntegration.test.js tests/unit/soundSeekersProgressController.test.js tests/unit/soundSeekersPreviewFixtures.test.js`

Expected: FAIL because the new orchestrator, real v2 persistence controller, and canonical preview fixture map do not exist.

- [ ] **Step 3: Implement the full route-owned game flow**

```jsx
export default function SoundSeekersRoute({ progressScopeKey, isSoundEnabled, onExit, initialFixtureId, accessibilitySettings }) {
  const { state, commitState } = useSoundSeekersProgressController(progressScopeKey);
  const audioController = useSoundSeekersAudioController({ enabled: isSoundEnabled, progressScopeKey });
  return createPortal(<SoundSeekersGame state={state} onStateChange={commitState} audioController={audioController} onExit={onExit} initialFixtureId={initialFixtureId} accessibilitySettings={accessibilitySettings} />, document.body);
}
```

Replace the production `AppSurface`/`StudentSoundTrailPage` `renderQuest` branch with the lazy `SoundSeekersRoute`, carrying the existing scope key, app sound preference, accessibility settings, and return-to-trail behavior. This is the sole production switch: the unit contract must fail before the branch changes and pass only when a first production visit mounts v2 without a `QuestRoot`. Retain the full-screen portal deliberately, but on open move focus to the new route's labelled main/action heading; on exit, restore focus to the initiating trail control, and do not let a canvas steal focus from the semantic action layer. The campaign map shows all eight chapters, visible repairs, branch-specific boss outcomes, the next authored resident problem/request, and resume. Teach-all, active expedition, wonder, payoff, journal, reward, creator, settings, and exit are views within one game orchestrator. The HUD behaves as a trail tool rather than a quiz modal. Reward unlocks, journal pages, narrative branch outcomes, and resident callback requests are derived/idempotent from valid durable history; no currency is the primary stop purpose. Before replacing a connected-text scene, leaving its phase, exiting the route, or unmounting, the orchestrator dispatches the exact lifecycle close so the mission reducer calls `closeConnectedTextPresentation()` with its exact current presentation and invalidates all old access.

`TeachAllSequence` renders the complete current 19-field `createTeachSequence()` item rather than reconstructing or renaming any field: child text, canonical instruction/target/sequence/alternate audio requests, child label, grapheme display, mouth and morphology cues, anchor word/evidence/image, worked example, and alternate examples remain available together. It cannot mark the item complete until every required canonical audio delivery for that presentation is truthfully complete, but replay remains unscored. The orchestrator enters each of the eight canonical chapter Wonder effects only after its owning literacy commit, runs the Task 4 game-feel sequence, commits the exact payoff repair, and shows that same repaired landmark after map return and reload.

After an authenticated Word Forge or Blend Bridge advance, the orchestrator renders the Task 4 `createMeaningPayoffModel()` result immediately in the same loop and does not begin the next mission action until the child continues. It uses the exact Task 3 support, direct Task 4 visual, and controller-owned meaning audio; no route-local definition, image map, or generic fallback replaces them. Boss field-journal entries and post-boss world presentation consume the derived `storyOutcomeId`/`postDecisionSemanticId` for the selected legal narrative branch. A later stop's arrival consumes `deriveResidentRequest()` so the exact resident names the concrete repaired result(s) from its Task 3 relationship beat after reload.

`CreatorSheet` imports and iterates `SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS` directly; there is no route-local list, fallback ID, inferred cross-slot accessory, or copied validation allowlist. It previews through `<SoundSeekersCharacter>` and persists only `createCharacterAppearance(raw)` as cosmetic `settings.characterAppearance`. Creator and expedition DOM expose both the byte-identical `serializeCharacterAppearance(appearance)` and `appearanceSignature(appearance)`. The expedition passes that same normalized object to that same component; it must not copy SVG markup or maintain a Phaser-only avatar. Changing appearance emits no response intent/evidence and leaves challenges, answers, motor assists, difficulty, repair, reward, and readiness unchanged.

Settings expose motor assists separately from learning support, and `stateV2.normalizeAllowlistedSettings` must add and validate only the named runtime presentation/motor fields (`autoTravel`, `slowerMovement`, `noDamageTravel`, `largerTargets`, `simplifiedScene`, and `extendedResponse`) plus the schema-checked cosmetic `characterAppearance`, without accepting learning support, answer, evidence, mastery, telemetry, or timing fields. `previewFixtures.js` exports no alternate `SOUND_SEEKERS_DECISION_PREVIEW_FIXTURES`, boss map, answer fixture, or alias collection. Every recursively frozen `SOUND_SEEKERS_PREVIEW_FIXTURES` record has exactly `{id,stopId,phaseId,actionId,contextId,contentId,slotId,instructionId,powerId,expectedAction,recordsDomain,legalActorTranscripts}` and points to one actual expedition/content tuple. `legalActorTranscripts` is derived only from `toChildChallengeView()` plus the public interaction model and contains one equal-shape transcript per legal child-visible path/control/choice; it may contain public opaque option tokens needed to activate those displayed controls, but never identifies which succeeds or includes an expected token/correct index. This necessarily covers all three Contrast Sort variants, all four Memory Delivery variants, both Blend Bridge variants including the novel-decoding boss, and the other three contracts. Preview accepts `fixtureId`; redundant `stop`/`phase`/`power` parameters must match that fixture exactly. Any unknown or mismatched request renders an explicit non-playable error with no save, response intent, evidence, deck visit/use, commit result, or completion. Valid parameters seed the fixture's real plan/checkpoint so browser tests exercise production code; the browser actor may try legal child-visible transcripts and observe the same public correction/advance UI as a child, but cannot inject an event, result, support, private answer, or completed reducer state.

- [ ] **Step 4: Run contract, game engine, and build checks**

Run: `node --test tests/unit/soundSeekersGameContract.test.js tests/unit/soundSeekersCreatorIntegration.test.js tests/unit/soundSeekersProgressController.test.js tests/unit/soundSeekersPreviewFixtures.test.js tests/unit/soundSeekersMissionReducer.test.js tests/unit/soundSeekersWorldState.test.js tests/unit/soundSeekersPlaythrough.test.js tests/unit/questStoreCompatibility.test.js tests/unit/progressMerge.test.js tests/unit/progressQueue.test.js`

Expected: PASS, including immediate Word Forge/Blend Bridge meaning payoff, two distinct persisted outcomes for each legal boss branch, reloaded concrete cast callbacks/resident requests, and exact-current connected-text close on replacement/leave/exit/unmount.

Run: `npx playwright test tests/browser/sound-seekers-persistence-controller.spec.js --config=playwright.quest.config.js`

Expected: PASS for delayed cloud hydrate, teacher reset replacement, two-tab storage reconciliation, scope change/unmount flush, fresh reload, assignment preservation in stored state, assignment exclusion from child uploads, stale event rejection, and zero duplicate evidence/deck visits.

Run the production build in a fresh validated OS-temporary root, with failure-safe exact cleanup:

```bash
(
  set -e
  runtime_task5_build_root="$(node tools/shootSoundSeekersV2Content.mjs --create-build-root)"
  cleanup_runtime_task5_build_root() { node tools/shootSoundSeekersV2Content.mjs --clean-build-root "$runtime_task5_build_root"; }
  trap cleanup_runtime_task5_build_root EXIT INT TERM
  npx vite build --outDir "$runtime_task5_build_root/production"
  cleanup_runtime_task5_build_root
  trap - EXIT INT TERM
)
```

The tool-created root must be absent afterward. This step neither creates nor removes project `dist/` or `dist-quest-offline/`; any pre-existing directories remain byte-identical.

Expected: PASS without React hook warnings, portal/focus leaks, missing asset URLs, or an eager Phaser load on an unrelated route.

- [ ] **Step 5: Commit the complete child orchestrator**

```bash
git add -- src/features/soundSeekers/SoundSeekersGame.jsx src/features/soundSeekers/SoundSeekersRoute.jsx src/features/soundSeekers/runtime/soundSeekersProgressController.js src/features/soundSeekers/runtime/useSoundSeekersProgressController.js src/features/soundSeekers/preview/previewFixtures.js src/features/soundSeekers/sound-seekers.css src/features/soundSeekers/ui/CampaignMap.jsx src/features/soundSeekers/ui/TeachAllSequence.jsx src/features/soundSeekers/ui/RewardReveal.jsx src/features/soundSeekers/ui/FieldJournal.jsx src/features/soundSeekers/ui/SettingsSheet.jsx src/features/soundSeekers/ui/CreatorSheet.jsx src/components/AppSurface.jsx src/components/StudentSoundTrailPage.jsx src/utils/questStore.js src/features/soundSeekers/engine/stateV2.js src/quest-preview.jsx preview/quest.jsx tests/unit/soundSeekersGameContract.test.js tests/unit/soundSeekersCreatorIntegration.test.js tests/unit/soundSeekersProgressController.test.js tests/unit/soundSeekersPreviewFixtures.test.js tests/browser/sound-seekers-persistence-controller.spec.js
git diff --cached --name-status
git diff --cached --check
git commit -m "feat: assemble the new Sound Seekers game"
```

### Task 6: Prove all six powers, accessibility modes, inputs, resume, and world change in the browser

**Dependency stop:** Start only after Tasks 1–5 of this runtime plan are committed and clean and the committed content/art Task 6 aggregate, asset, audio, visual-semantic, gallery-isolation, and offline gates pass. Use those authorities directly; do not add a browser-only catalog, creator list, answer map, transition, evidence factory, asset scanner, or completion hook.

**Files:**
- Create: `tests/browser/sound-seekers-six-powers.spec.js`
- Create: `tests/browser/sound-seekers-mission-resume.spec.js`
- Create: `tests/browser/sound-seekers-evidence-integrity.spec.js`
- Create: `tests/browser/sound-seekers-world-change.spec.js`
- Create: `tests/browser/sound-seekers-motor-assists.spec.js`
- Create: `tests/browser/sound-seekers-character-creator.spec.js`
- Create: `tests/browser/sound-seekers-forty-stop-campaign.spec.js`
- Create: `tests/browser/sound-seekers-audio-owner.spec.js`
- Create: `tests/browser/sound-seekers-privacy.spec.js`
- Rewrite: `tests/browser/quest-accessibility.spec.js`
- Rewrite: `tests/browser/quest-input-collision.spec.js`
- Modify: `tests/quest-offline/quest-offline.spec.js`
- Modify: `playwright.quest.config.js`

**Interfaces:**
- Consumes the real production `SoundSeekersRoute`, only Task 5's recursively frozen `SOUND_SEEKERS_PREVIEW_FIXTURES` plus each record's answer-neutral `legalActorTranscripts`, the complete v2 persistence ledger/checkpoints, Task 4 `SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS` plus appearance serialization/signature, the single runtime audio controller, Task 5's exact accepted background manifest, exact Task 1/3 audio provenance, and the content/art aggregate gates. There is no browser-only fixture alias, answer/expected-event map, boss option map, or alternate preview collection. Presentation-only `profile`, deterministic `seed`, and fixture-valid `resumeAt` may alter only their declared dimensions; redundant `stop`, `phase`, or `power` must equal the resolved fixture.
- Produces behavioral evidence only from visible child controls, persisted canonical state, network/cache observations, and sanitized synthetic-run summaries. Test code never calls a reducer completion, constructs a response intent/event/use/visit, injects an answer, imports a private answer authority, retains a capability, or mutates storage to skip gameplay.
- `playwright.quest.config.js` defines named `chromium`, `firefox`, and `webkit` projects, bounded navigation/action/test timeouts, and an ignored output root `.artifacts/sound-seekers-v2/runtime-browser/playwright/`. Trace, video, screenshot, DOM snapshot, request body, and storage-state capture are off for this privacy-sensitive matrix. Only deterministic synthetic fixture IDs, pass/fail/count summaries, and source hashes may survive a successful run.

- [ ] **Step 1: Write the browser matrix before changing runtime behavior**

```js
for (const fixture of SOUND_SEEKERS_PREVIEW_FIXTURES) {
  test(`${fixture.id} persists its exact visible learning action and payoff`, async ({ page }) => {
    await page.goto(`/quest-preview.html?fixture=${fixture.id}&seed=11`);
    const before = await readPersistedV2Evidence(page);
    const visibleAttemptTrace = await tryLegalActorTranscriptsUntilAdvance(
      page,
      fixture.legalActorTranscripts
    );
    expect(visibleAttemptTrace.outcomes.at(-1)).toBe("advance");
    expect(visibleAttemptTrace.outcomes.slice(0, -1).every(value => value === "correction")).toBe(true);
    await expect(page.getByTestId("world-payoff")).toHaveAttribute("data-power", fixture.powerId);
    const after = await readPersistedV2Evidence(page);
    assertCanonicalEvidenceMatchesVisibleAttempts({
      fixture,
      visibleAttemptTrace,
      events: canonicalEvidenceDelta(before, after)
    });
  });
}

test("movement, timing, collection, and repair create zero literacy events", async ({ page }) => {
  const fixture = SOUND_SEEKERS_PREVIEW_FIXTURES.find(
    item => item.instructionId === "echo-search-find-source"
  );
  await page.goto(`/quest-preview.html?fixture=${fixture.id}&seed=11`);
  await moveProbeAndCollectWithoutConfirming(page);
  await expect(readPersistedV2Evidence(page)).resolves.toEqual([]);
});

test("every canonical creator choice round-trips identically in creator and world", async ({ page }) => {
  for (const raw of canonicalCreatorAppearanceCases(SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS)) {
    await openCreatorFromVisibleRoute(page);
    await chooseCreatorAppearanceThroughVisibleControls(page, raw);
    const creator = await readVisibleAppearanceIdentity(page, "creator-character-preview");
    await page.getByRole("button", { name: "Return to expedition" }).click();
    const world = await readVisibleAppearanceIdentity(page, "world-avatar");
    expect(world).toEqual(creator);
    expect(creator.serialized).toBe(serializeCharacterAppearance(createCharacterAppearance(raw)));
    expect(creator.signature).toBe(appearanceSignature(createCharacterAppearance(raw)));
  }
  await expect(readPersistedV2Evidence(page)).resolves.toEqual([]);
});

test("an arbitrary stop phase power mismatch is non-playable and cannot save", async ({ page }) => {
  await page.goto("/quest-preview.html?fixture=power-echo-search&stop=s1&phase=s1-primary&power=story_power&seed=11");
  await expect(page.getByRole("alert")).toContainText("Preview fixture does not match authored content");
  await expect(readPersistedV2Evidence(page)).resolves.toEqual([]);
});

test("one accumulating visible campaign completes all forty authored stops", async ({ page }) => {
  test.setTimeout(12 * 60_000);
  await openFreshProductionCampaign(page, { seed: 11, syntheticScope: true });
  const transcript = await playAllFortyStopsThroughVisibleControls(page);
  expect(transcript.stopIds).toEqual(SOUND_SEEKERS_EXPEDITIONS.map(item => item.stopId));
  expect(transcript.teachPresentations).toEqual(allAuthoredTeachPresentationsInRouteOrder());
  expect(transcript.teachPresentations).toHaveLength(103);
  expect(transcript.onboardingPowerIds).toEqual(allSixPowerIdsInFirstUseOrder());
  expect(transcript.interactionContextIds).toEqual(allTwoHundredContextIdsInRouteOrder());
  expect(transcript.placementIds).toEqual(CONTENT_DECK_PLACEMENTS.map(item => item.placementId));
  expect(transcript.storyTransactionCount).toBe(40);
  expect(transcript.assessedStoryDomains).toEqual({ connected_text_transfer: 32, novel_decoding: 8 });
  expect(transcript.missionCompletionCount).toBe(40);
  await expectCanonicalCampaignLedger(page, {
    heartVisits: 80, heartOwnerUses: 80, sharedHeartUses: 1, heartUses: 81,
    storyUses: 40, alternativeUses: 4, morphologyUses: 1, transferUses: 40,
    alternativeEvents: 8
  });
});

test("Word Forge and Blend Bridge show their direct reviewed meaning immediately after success", async ({ page }) => {
  for (const fixture of authoredWordForgeAndBlendBridgeRouteFixtures()) {
    await openFreshFixtureScope(page, fixture);
    await expect(page.getByTestId("meaning-payoff")).toHaveCount(0);
    await completeCurrentDecisionThroughVisibleControls(page, fixture.legalActorTranscripts);
    const payoff = page.getByTestId("meaning-payoff");
    await expect(payoff).toHaveAttribute("data-word-id", fixture.wordId);
    await expect(payoff).toHaveAttribute("data-meaning-semantic-id", getMeaningSupport(fixture.wordId).visualSemanticId);
    await expect(page.getByTestId("next-mission-action")).toHaveCount(0);
    await payoff.getByRole("button", { name: /hear the meaning again/i }).click();
    await expectMeaningAudioRequest(page, getMeaningSupport(fixture.wordId).audioKey);
    await expectMeaningEvidenceDelta(page, 0);
  }
});

test("both legal boss branches and later cast callback memory survive production reload", async ({ page }) => {
  for (const stopId of ["s5", "s10", "s15", "s20", "s25", "s30", "s35", "s40"]) {
    const outcomes = [];
    for (const choiceOrdinal of [0, 1]) {
      await openFreshBossScope(page, { stopId, choiceOrdinal });
      await completeBossThroughVisibleControls(page);
      await page.reload();
      outcomes.push(await readVisiblePersistedNarrativeOutcome(page));
      await expectNarrativeChoiceEvidenceDelta(page, 0);
    }
    expect(outcomes[0].storyOutcomeId).not.toBe(outcomes[1].storyOutcomeId);
    expect(outcomes[0].postDecisionSemanticId).not.toBe(outcomes[1].postDecisionSemanticId);
  }

  for (const stopId of laterStopsWithCastCallbacks()) {
    await completeRequiredPriorRepairsAndReloadAt(page, stopId);
    const request = await readVisibleResidentRequest(page);
    const beat = getCastRelationshipBeat(getExpedition(stopId).payoff.relationshipBeatId);
    expect(request.callbackRepairIds).toEqual(beat.callbackRepairIds);
    expect(request.callbackLines).toEqual(beat.callbackLines);
    for (const line of beat.callbackLines) {
      await expect(page.getByText(line.text, { exact: true })).toBeVisible();
    }
  }
});
```

`assertCanonicalEvidenceMatchesVisibleAttempts()` groups the actual persisted events by the public attempt IDs observed through correction/advance states, then validates each event through the canonical evidence authority against the fixture's public curriculum tuple. It requires every immediately committed response action to contribute exactly its authored event count, every correction attempt to contain its truthful `correct:false` event, the final advance attempt to contain only its truthful `correct:true` event(s), fresh monotonically increasing attempt ordinals/IDs, one legitimate declared domain, exact target/position, practice kind, support/reveal/audio truth, canonical null/omission rules, and no formal-assessment or `SECURE` status. It derives no expected token, answer index, or correct actor transcript and never imports `expectedEventFor()` or an equivalent private map. It never expects `contentVisitId` or `activityType` on a non-heart event. A decorative scene change, generic counter, completion toast, emitted response intent, or direct storage mutation is not evidence.

- [ ] **Step 2: Run the new browser matrix and confirm the red state**

Run:

```bash
npx playwright test tests/browser/sound-seekers-six-powers.spec.js tests/browser/sound-seekers-mission-resume.spec.js tests/browser/sound-seekers-evidence-integrity.spec.js tests/browser/sound-seekers-world-change.spec.js tests/browser/sound-seekers-motor-assists.spec.js tests/browser/sound-seekers-character-creator.spec.js tests/browser/sound-seekers-forty-stop-campaign.spec.js tests/browser/sound-seekers-audio-owner.spec.js tests/browser/sound-seekers-privacy.spec.js tests/browser/quest-accessibility.spec.js tests/browser/quest-input-collision.spec.js --config=playwright.quest.config.js --project=chromium
```

Expected: FAIL until all production-visible hooks and behaviors meet the matrix.

- [ ] **Step 3: Prove response, resume, correction, audio, and authority boundaries**

Add stable semantic test IDs only to states a child can already perceive. Drive each exact decision-contract variant through its own child-visible legal actor transcripts, inspect the persisted ledger, and reject every foreign transcript including siblings with the same power. Exercise each of the 200 authored contexts through its own declared physical/semantic action; assert its child decision, step order, input model, object/recipient roles, correction, physical expression, and consequence, and reject a generic approach/collect/complete substitute. For every assessed decision variant, exercise first miss, second miss, third miss, the single consequence-free model step, and a later fresh correct attempt. Require support levels `0/1/2/3`, distinct monotonically increasing current-attempt IDs, exactly one model presentation, one checkpoint/resume at every rung, and no event for the model. Full, simplified, reduced-motion, pointer, touch, keyboard, switch, and every motor-assist profile must preserve the exact correction record, visible/spoken text, attempt/support history, and committed evidence transcript; only presentation and motor mechanics may differ. After the supported success, schedule the same confusion in a different eligible domain and prove that later-review correction without rewriting any prior miss.

Reload from a real persisted checkpoint before and after every power state, teach entry, first-use rehearsal, heart owner/shared action, every one-action placement response, every placement/story retry and `model_pending`/model-consumed boundary, every story checkpoint, all Task 3 presentation states including every correction, payoff, branch consequence, and mission completion. Each reload discards served/catalog/challenge objects, old Task 3 state/transition objects, Task 4 capabilities, response intents, mission commit results/completions, and audio objects; it rehydrates Task 2 identities, strictly replays the Task 3 checkpoint, and issues fresh current access only for an eligible exact-current transition. The same normalized old-attempt reducer call is idempotent, but the old response intent/result cannot drive the fresh attempt. An altered transaction/context/attempt/revision/phase/visit/use descriptor fails closed without partial evidence, deck state, or world change. Scene replacement, phase leave, route exit, and unmount each exercise `closeConnectedTextPresentation()` with the exact current state and prove the old state, transition, and access are immediately invalid.

Across the four alternative placements, drive each of the exact eight authored targets one action at a time. For every target, one visible response immediately calls singular `materializeContentPlacementChallenge()`/`commitContentPlacementResponse()` and appends exactly that target's one event; the route never holds a provisional response or waits for a complete set. In the three-miss campaign, each target's first three responses persist truthful wrong events at attempts `0/1/2`, the third leaves fresh attempt `3` at `model_pending`, a visible model step calls `completeContentPlacementCorrectionModel()` with zero new event/receipt/use and the same attempt ID, and only then may the fresh correct response advance. Earlier correct targets remain visible/credited while later targets run, and only the eighth correct target creates the placement's one final use. The perfect/one-miss/three-miss campaigns therefore have exactly `8/16/32` alternative events and four final alternative uses; s38 separately has one morphology use, zero evidence, and one receipt.

For every story/transfer transaction, submit three wrong current attempts, consume the exact one model step, then submit one fresh correct attempt. Each miss adds its one truthful event/receipt and neither reciprocal use, and it must immediately produce an exact-current Task 3 `correction` transition. That correction renders visible/spoken feedback but is rejected by `issueSceneVisualAccess()` and adds zero world payoff. The third miss rejects a correct response until `completeStoryTransferCorrectionModel()` consumes the independently rederived correction with zero new event/receipt/use/transition and the same attempt-3 ID. Only the final correct attempt creates the pair and permits Task 3 `action`/`resolved`/direct-meaning transitions. At all eight bosses the exact checkpointed nonempty `narrativeChoiceToken` remains byte-identical across all four attempts and both final uses, and every rematerialized three-option challenge comes only from object-identical `materializeStoryTransferChallenge()`/`materializeBossTransferChallenge()` plus `projectBossTransferOptionsForChild()`. The 32 non-boss tokens remain `null`.

Audio tests instrument the one public controller surface, not `Audio` or the cue player. Require one active voice, balanced duck/restore, cancel on phase/scope/unmount, exact visible/spoken instruction and correction parity, and truthful `unavailable/loading/started/completed/interrupted/failed` delivery. Muted, interrupted, unavailable, mismatched-source, or failed required audio never qualifies as completed independent delivery. A source scan and runtime instrumentation prove no Phaser/view/leaf/reducer creates another playback owner.

At every final phase, assert that the route accepts only the exact same in-memory, privately branded completion object issued for the current final mission revision and matching current game state. Its public projection remains exactly `{kind:"sound_seekers_mission_completion",missionId,stopId,journeyStep,completedPhaseIds}`, and `completeMission()` alone persists the derived canonical `sound_seekers_mission_committed` summary. Literal, frozen literal, spread, structured clone, JSON round-trip, stale, cross-mission, cross-revision, query-string, preview-helper, UI-prop, response-intent, and browser-callback inputs all fail before mutation. A reload discards the old completion and may issue a fresh brand only after canonical checkpoint/state revalidation; exact replay against the already committed matching state is idempotent. No caller can supply repairs, relationships, consequences, support, evidence, visits/uses, or completion IDs.

- [ ] **Step 4: Prove all input and accessibility modes**

For every semantic control kind, drive pointer, real touch with cancellation, keyboard arrows/WASD plus Enter/Space/Escape, Tab and Shift+Tab, and single-switch scan/activate. Drag interactions also expose tap/place and keyboard/switch alternatives. One physical action produces one semantic input. Cover visible focus, logical order, labelled regions/instructions/errors/status, 56 CSS-pixel primary targets, 8 CSS-pixel separation, phone portrait/landscape, 320 CSS pixels, genuine 200% browser zoom, reduced motion, simplified scene, extended response, auto-travel, slower movement, no-damage travel, audio replay, mute, Phaser/WebGL/Canvas failure, and background failure. Presentation/motor changes may change layout/motion/time allowance only; response intents, answer set, instruction, target/domain, correction, evidence, content selection, readiness, and completion stay equal.

The real Task 4 React components remain the only world/cast/scene/option/meaning DOM across all profiles and fallbacks. Tests assert Task 3 branded action/resolved/meaning transition to Task 4 capability access for all 40 scenes, assert every correction transition is visible but cannot issue access, and reject literal, frozen, cloned, serialized, stale, cross-attempt, cross-scene, wrong-revision, and wrong-phase authority. Every authored Word Forge and Blend Bridge success must show its exact `getMeaningSupport(wordId)` record joined directly to the Task 4 visual with that same `visualSemanticId` before the next action; the payoff is absent pre-success, uses controller-owned oral support, and emits zero evidence in full, fallback, simplified, and reduced-motion profiles. Phaser owns traversal only; failure leaves the complete code-native scene and controls playable.

- [ ] **Step 5: Prove deterministic adaptation and the full accumulating campaign**

The perfect 40-stop test uses one fresh synthetic learner and one accumulating production v2 state. It completes exactly 103 route-ordered teach presentations before their first scored use and deep-compares every presentation's full exact 19-field `createTeachSequence()` record, child-visible rendering, and provenance-backed completion for every required instruction/target/sequence/alternate audio reference. It also completes six first-use non-recording rehearsals, all 200 interaction contexts, exactly 80 heart visits and 81 valid heart uses including the distinct shared `s6-primary` use, the five post-teach placements at `s16/s28/s29/s37/s38`, exactly 40 valid story uses, 40 valid transfer uses, four valid alternative uses, one valid morphology use, 32 connected-text-transfer events, eight novel-decoding events, eight perfect-route alternative-target events, and 40 canonical mission completions. It calls `coverageStatus(run.state)` for exact record coverage `{heartWords:60,stories:40,alternatives:4,morphology:1,transfer:40}` and calls full-state `validContentDeckUses(run.state,category)` for exact runtime totals `81/40/4/1/40`; no deck-only projection may satisfy the gate. No stop runs in a fresh reset state and no context/ID collision is masked.

Run a separate accumulating production-route campaign that deliberately misses every assessed story/transfer and each of the eight alternative targets three times, consumes every one-time model through visible controls, then answers the same fresh attempt correctly. Require exactly 128 connected-text events, 32 novel-decoding events, and 32 alternative-target events, while final valid use counts remain exact `81/40/4/1/40` and heart visits remain `80`. Group by transaction and by `(placementId,targetOrdinal)` to prove attempt ordinals `0/1/2/3`, fresh IDs, three immediately persisted wrong events/receipts, the zero-evidence same-attempt model consumption, the final correct event, no use/pair before the final required action, one unchanged boss narrative token per boss, and exact final reciprocal pairing. At every miss snapshot the target, ordered options, private expected token, instruction/power/action/domain tuple, attempt ID, and challenge ID before persistence/reload. Require the target/options/key/action tuple to remain byte-identical, while the next retry's attempt and attempt-bound challenge IDs change to their exact canonical fresh values. During the model-only transition, require the already-fresh attempt/challenge IDs themselves to remain byte-identical across persistence/reload because no response attempt was consumed. A separate later-review witness, created only after that loop resolves, must select each recorded confusion in another canonically eligible domain, expose the construct and selected-versus-intended confusion in the teacher action, and never cite time, travel, rewards, or formal mastery.

Repeat plan creation from the same pre-attempt checkpoint/seed/replay ordinal and require byte-identical target/options/domain/content/context. Across literal seeds `0..999` from fresh eligible states, prove deterministic option-position maximum imbalance `50`, selection from the actual highest-priority confusion family, a legitimate contrast set, and a teacher action naming the exact construct plus selected-versus-intended response. Change only eligible immutable evidence/taught history/teacher assignment/journey step and require the exact deterministic alternate-domain change; changing an ineligible or presentation-only value must not. Reaction time, travel/collision, input access, frame rate/device, rewards/cosmetics, audio latency, motor assists, density/motion profile, a wrong event appended during the current loop, and reload cannot reroll an active attempt or influence its selector. That wrong event may influence only a later eligible review after the active loop resolves. `s8`/`s17` use only `createReviewTargetSequence()`, strict prior targets, uniqueness, count, and fail-closed replay/resume.

For each of the eight boss narrative bridges, complete the production route once through each of its two legal visible choices in isolated synthetic scopes. After save/reload, require different canonical `storyOutcomeId` and `postDecisionSemanticId` values for the two branches, exact equality with `resolveNarrativeBranchOutcome()`, exact `trail.storyOutcomes[sceneId]` persistence of only the `storyOutcomeId`, rederivation of the matching post-decision semantic for field-journal/world display, and zero narrative correctness evidence. Then enter every later cast beat with callbacks after a real reload: `deriveResidentRequest()` must consume `getCastRelationshipBeat()`, every `callbackRepairId` and ordered `callbackLines[].repairId` must already exist in `trail.repairs`, the same resident must speak each exact concrete callback line, and missing/future/cross-chapter repairs must fail closed rather than show generic dialogue.

For each of the eight chapter Wonders, assert the public game-feel sequence in exact order `anticipation → contact → literacy_effect → resident_reaction → repair → settled`: the anticipation pose aims at the future contact, the contact frame and resident eyeline share one semantic target, the literacy effect names the committed construct, exactly one canonical material sound plays, the resident reaction follows contact, and the repair remains visible after reload and route revisit. Reduced motion reaches the same settled frame, literacy consequence, material sound ownership, and persistent repair without continuous movement.

- [ ] **Step 6: Prove a complete production-route offline campaign**

Extend the already committed content/art offline test; do not replace its exact eight-background/two-audio hash/range cases. Create one fresh marker-bound OS-temporary root only through `shootSoundSeekersV2Content.mjs --create-build-root`, build to its exact `offline` child, and clean only that same validated root in `finally` through `--clean-build-root`. Never use project `dist/`, `dist-quest-offline/`, a caller path, a reused directory, `rm`, or a glob. While online, the production route derives one deduplicated warm list from Task 5's exact eight accepted asset records plus every Task 1 instruction and Task 3 scene-text/prompt/meaning provenance URL required by the 40-stop route. It sends the public warm request once, requires exact requested/completed equality and zero failures, and verifies every cached complete status-200 body against its canonical SHA-256. No directory scan or literal copied inventory is permitted; shell precache still contains no v2 media.

After closing the page and setting the same browser context offline, reopen the production route, resume its real persisted state, and drive all 40 stops through visible controls with required audio enabled. Close/reopen at least once in each chapter and at each composite transaction stage. Require zero same-origin request failures for warmed required media, all 40 canonical completions, identical final content/evidence/world state to the online deterministic run, and no retained authority object. Preserve the committed warmed-background/MP3 full-body range behavior and genuine unwarmed 206 non-cache/offline-fail case. Give this single bounded campaign a 12-minute ceiling, each navigation 30 seconds, each visible action/audio wait 15 seconds, browser/context close 10 seconds, and server shutdown 10 seconds; every failure tears down without an unbounded wait.

Run:

```bash
runtime_build_root="$(node tools/shootSoundSeekersV2Content.mjs --create-build-root)"
cleanup_runtime_build_root() { node tools/shootSoundSeekersV2Content.mjs --clean-build-root "$runtime_build_root"; }
trap cleanup_runtime_build_root EXIT INT TERM
QUEST_RELEASE_PREVIEW=true npx vite build --outDir "$runtime_build_root/offline"
QUEST_OFFLINE_DIST="$runtime_build_root/offline" npm run check:quest-offline
QUEST_OFFLINE_DIST="$runtime_build_root/offline" npm run test:quest-offline -- --grep "Sound Seekers v2 media|Sound Seekers v2 complete offline campaign"
cleanup_runtime_build_root
trap - EXIT INT TERM
```

Expected: PASS for the pre-existing exact media/range proof and the complete 40-stop production-route offline campaign. This remains loopback Chromium evidence, not physical-iPad proof.

- [ ] **Step 7: Enforce privacy and artifact boundaries**

Use only synthetic scope IDs. Scan the rendered DOM/attributes, console/page errors, requests and request bodies, local/session storage, IndexedDB, CacheStorage metadata, service-worker messages, globals, history, URLs, and the exact runtime artifact root. Public child/browser surfaces must contain no expected tokens, answer maps, misconception/rationale maps, served/catalog records, resolver sources, evidence factories, mission commit-result/applied-transition/completion brands or private metadata, derived support/correctness authorities, Task 3 brands/transitions, Task 4 capability objects, private scene keys, raw motor/timing paths, audio objects, teacher assignment in uploads, real child identifier, or secret. Canonical evidence and structural content ledgers may exist only in their normalized persisted v2 location and cloud-safe shape; child projections never expose them. The only fixture actor data is each `SOUND_SEEKERS_PREVIEW_FIXTURES` record's child-visible equal-shape `legalActorTranscripts`; no serialized fixture or summary may mark the successful path.

Successful tests write one canonical JSON summary per project with only `{schemaVersion:1,runId,project,sourceHashes,fixtureIds,counts,status:"passed"}` and no timestamps, random IDs, paths outside the repo, DOM, storage, response bodies, screenshots, videos, traces, or answers. `runId` is content-addressed from canonical source hashes/project/fixture IDs. Write under `.artifacts/sound-seekers-v2/runtime-browser/<runId>.partial/`, validate, then atomically rename; remove only that exact partial on failure. A complete run with an invalid/extra/orphan file fails without overwrite. The artifact root is ignored and never staged; `--check` is read-only. Playwright's own output root is cleaned after a passing run, and failed privacy-sensitive artifacts remain disabled rather than retained.

Task 6 is proof-only. If the matrix exposes a product gap, return it to the exact owning Task 1–5 file list and commit there before resuming; do not make an unlisted source edit here.

- [ ] **Step 8: Run the complete runtime and inherited content/art gates**

Run unit, static, asset/audio, visual, quest, production-isolation, build, browser, and offline gates with bounded commands:

```bash
npm run check:sound-seekers-content
npm run check:sound-seekers-art
npm run check:quest
npm test
npm run lint
node --test tests/unit/soundSeekers*.test.js
runtime_build_root="$(node tools/shootSoundSeekersV2Content.mjs --create-build-root)"
cleanup_runtime_build_root() { node tools/shootSoundSeekersV2Content.mjs --clean-build-root "$runtime_build_root"; }
trap cleanup_runtime_build_root EXIT INT TERM
npx vite build --outDir "$runtime_build_root/production"
npx playwright test tests/browser/sound-seekers-six-powers.spec.js tests/browser/sound-seekers-mission-resume.spec.js tests/browser/sound-seekers-evidence-integrity.spec.js tests/browser/sound-seekers-world-change.spec.js tests/browser/sound-seekers-motor-assists.spec.js tests/browser/sound-seekers-character-creator.spec.js tests/browser/sound-seekers-forty-stop-campaign.spec.js tests/browser/sound-seekers-audio-owner.spec.js tests/browser/sound-seekers-privacy.spec.js tests/browser/quest-accessibility.spec.js tests/browser/quest-input-collision.spec.js --config=playwright.quest.config.js
QUEST_RELEASE_PREVIEW=true npx vite build --outDir "$runtime_build_root/offline"
QUEST_OFFLINE_DIST="$runtime_build_root/offline" npm run check:quest-offline
QUEST_OFFLINE_DIST="$runtime_build_root/offline" npm run test:quest-offline -- --grep "Sound Seekers v2 media|Sound Seekers v2 complete offline campaign"
cleanup_runtime_build_root
trap - EXIT INT TERM
npx eslint playwright.quest.config.js tests/browser/sound-seekers-six-powers.spec.js tests/browser/sound-seekers-mission-resume.spec.js tests/browser/sound-seekers-evidence-integrity.spec.js tests/browser/sound-seekers-world-change.spec.js tests/browser/sound-seekers-motor-assists.spec.js tests/browser/sound-seekers-character-creator.spec.js tests/browser/sound-seekers-forty-stop-campaign.spec.js tests/browser/sound-seekers-audio-owner.spec.js tests/browser/sound-seekers-privacy.spec.js tests/browser/quest-accessibility.spec.js tests/browser/quest-input-collision.spec.js tests/quest-offline/quest-offline.spec.js
git diff --check
```

Expected: PASS in Chromium, Firefox, and WebKit for the runtime matrix, with the 40-stop accumulating campaign additionally repeated in Chromium and the full offline campaign in the loopback Chromium offline harness. The production bundle and offline shell contain no content-art gallery, preview answer authority, legacy `QuestRoot` dependency for the v2 route, second world/cast catalog, or second audio owner. Emulated WebKit is not physical-iPad proof.

- [ ] **Step 9: Clean, stage the exact proof paths, inspect, and commit**

The validated `--clean-build-root` call has already removed the one marker-bound OS-temporary build root in `finally`; assert that exact recorded root no longer exists. This task never creates or removes repository `dist/` or `dist-quest-offline/`; any pre-existing directory there remains untouched. Remove only the exact task-owned Playwright output and validated partial runtime runs created by this task. Preserve the one validated ignored synthetic summary run for review. Confirm no server/process/port, trace, video, screenshot, storage dump, response-body dump, orphan file, or partial run remains.

```bash
git add -- tests/browser/sound-seekers-six-powers.spec.js tests/browser/sound-seekers-mission-resume.spec.js tests/browser/sound-seekers-evidence-integrity.spec.js tests/browser/sound-seekers-world-change.spec.js tests/browser/sound-seekers-motor-assists.spec.js tests/browser/sound-seekers-character-creator.spec.js tests/browser/sound-seekers-forty-stop-campaign.spec.js tests/browser/sound-seekers-audio-owner.spec.js tests/browser/sound-seekers-privacy.spec.js tests/browser/quest-accessibility.spec.js tests/browser/quest-input-collision.spec.js tests/quest-offline/quest-offline.spec.js playwright.quest.config.js
git diff --cached --name-status
git diff --cached --check
git commit -m "test: prove complete Sound Seekers gameplay"
```

The cached list must contain exactly those 13 files and nothing else. It must not contain either plan, source code, content/art data/assets/audio/provenance/human-review records, generated output, `.artifacts`, `dist`, traces, screenshots, videos, storage dumps, or secrets.

**Direct-gate boundary:** Automated unit, browser, offline, accessibility, visual-semantic, and build evidence are necessary but do not prove human listening, physical-device/iPad behavior, observed-child use, authenticated hosted storage, deployment, or production operation. Record those independently in the dependent cutover-and-release plan; do not mark them passed from local automation.

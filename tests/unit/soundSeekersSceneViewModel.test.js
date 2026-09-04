import test from "node:test";
import assert from "node:assert/strict";

import { getBiomeKit } from "../../src/features/soundSeekers/content/biomeKits.js";
import { SOUND_SEEKERS_CHAPTERS } from "../../src/features/soundSeekers/content/chapters/index.js";
import {
  SOUND_SEEKERS_EXPEDITIONS,
  getExpedition
} from "../../src/features/soundSeekers/content/expeditions.js";
import { getMeaningSupport } from "../../src/features/soundSeekers/content/meaningSupport.js";
import { resolveSceneVisualSemantic } from "../../src/features/soundSeekers/content/sceneVisualSemantics.js";
import { getInstructionContract } from "../../src/features/soundSeekers/content/instructionContracts.js";
import { createMissionPlan } from "../../src/features/soundSeekers/engine/createMissionPlan.js";
import {
  createMissionState,
  reduceMission
} from "../../src/features/soundSeekers/engine/missionReducer.js";
import { validateSceneVisualAccess } from "../../src/features/soundSeekers/engine/sceneVisualAccess.js";
import {
  createSoundSeekersState,
  normalizeSoundSeekersState
} from "../../src/features/soundSeekers/engine/stateV2.js";
import { validateWorldScenePresentation } from "../../src/features/soundSeekers/engine/worldState.js";
import {
  createGameFeelSequence,
  createMeaningPayoffModel,
  createSceneViewModel
} from "../../src/features/soundSeekers/runtime/sceneViewModel.js";
import {
  createSoundSeekersAudioController,
  createSoundSeekersCorrectionAudioRequest
} from "../../src/features/soundSeekers/runtime/soundSeekersAudioController.js";
import { createCharacterAppearance } from "../../src/features/soundSeekers/visual/characterCustomization.js";
import { resolveMeaningVisual } from "../../src/features/soundSeekers/visual/sceneVisualCatalog.js";
import { questChapterMaterialSfxEntry } from "../../src/utils/questActionAudio.js";
import { installSoundSeekersProductionAudioDouble } from "../helpers/soundSeekersProductionAudioDouble.js";

installSoundSeekersProductionAudioDouble();

const APPEARANCE = createCharacterAppearance({
  schemaVersion: 1,
  bodyShapeId: "body-shape-kite",
  paletteTokenId: "player-palette-river",
  accessories: {
    back: "gear-back-field-pack",
    head: "gear-head-leaf-cap",
    neck: "gear-neck-scout-scarf",
    held: "gear-held-listening-shell"
  }
});

let clock = 0;
const AUDIO_SCOPE_KEY = "scene-view-model-test";
const audioController = createSoundSeekersAudioController({
  scopeKey: AUDIO_SCOPE_KEY,
  clock: () => clock
});

function exactInstructionAudio(mission) {
  const challenge = mission.activity?.powerChallenge || mission.challenge;
  if (!challenge || challenge.requiresAudio === false) {
    return { audio: { status: "completed" } };
  }
  const contract = getInstructionContract(challenge.instructionId);
  assert.ok(contract, `missing instruction ${challenge.instructionId}`);
  const audioAuthority = Object.freeze({
    scopeKey: AUDIO_SCOPE_KEY,
    missionId: mission.plan.id,
    phaseId: mission.phaseId,
    attemptId: mission.attemptId
  });
  audioController.request(Object.freeze({
    cueId: `instruction:${contract.instructionId}`,
    audioKey: contract.childAudio,
    visibleText: contract.childText,
    spokenText: contract.childText,
    kind: "instruction",
    requiresAudio: true
  }), audioAuthority);
  return { audio: audioController.getSnapshot().delivery, audioAuthority };
}

function contextFor(mission) {
  const at = new Date(Date.UTC(2026, 8, 3) + clock++ * 1000).toISOString();
  return {
    gameState: mission.gameState,
    at,
    sessionDay: "2026-09-03",
    ...exactInstructionAudio(mission)
  };
}

function replayState(stopId) {
  const initial = createSoundSeekersState();
  return normalizeSoundSeekersState({
    ...initial,
    trail: {
      ...initial.trail,
      journeyStep: Number(stopId.slice(1)),
      completedStopIds: [stopId]
    }
  });
}

function planFor(stopId) {
  return createMissionPlan({
    stopId,
    state: replayState(stopId),
    seed: Number(stopId.slice(1)),
    replayOrdinal: 1
  });
}

function powerInputsForToken(mission, token) {
  const challenge = mission.activity.powerChallenge || mission.challenge;
  if (challenge.powerId === "echo_search") {
    const candidate = challenge.presentation.candidates.find(item => item.token === token);
    return [
      { type: "probe", candidateId: candidate.id },
      { type: "confirm_candidate", candidateId: candidate.id }
    ];
  }
  if (challenge.powerId === "contrast_sort") {
    const bin = challenge.presentation.bins.find(item => item.token === token);
    return [{
      type: challenge.expectedAction,
      itemId: challenge.presentation.items[0].id,
      binId: bin.id
    }];
  }
  if (challenge.powerId === "word_forge") {
    const tile = challenge.presentation.rack.find(item => item.token === token);
    return [{ type: "place_tile", tileId: tile.id }];
  }
  if (challenge.powerId === "blend_bridge") {
    const choice = challenge.presentation.choices.find(item => item.token === token);
    return [
      ...challenge.presentation.segments.map(segment => ({
        type: "activate_segment",
        segmentId: segment.id
      })),
      { type: "sweep_blend" },
      { type: challenge.expectedAction, choiceId: choice.id, token: choice.token }
    ];
  }
  if (challenge.powerId === "memory_delivery") {
    const recipient = challenge.presentation.recipients.find(item => item.token === token);
    return [
      { type: "receive_cue" },
      { type: "move", dx: 1, dy: 0 },
      { type: "arrive" },
      { type: challenge.expectedAction, recipientId: recipient.id }
    ];
  }
  if (challenge.powerId === "story_power") {
    const choice = challenge.presentation.choices.find(item => item.token === token);
    return [
      { type: "read_text" },
      { type: challenge.expectedAction, choiceId: choice.id, token: choice.token }
    ];
  }
  throw new Error(`Unsupported test power: ${challenge.powerId}`);
}

function correctInputs(mission) {
  const challenge = mission.activity.powerChallenge || mission.challenge;
  return powerInputsForToken(mission, challenge.expectedToken);
}

function driveInputs(mission, inputs) {
  let result = null;
  for (const input of inputs) {
    result = reduceMission(mission, input, contextFor(mission));
    mission = result.state;
  }
  return { mission, result };
}

function finishCurrentPhase(mission) {
  const phase = mission.plan.phases[mission.phaseIndex];
  if (["arrival", "wonder", "payoff"].includes(phase.kind)) {
    return reduceMission(mission, { type: `complete_${phase.kind}` }, contextFor(mission)).state;
  }
  if (phase.kind === "teach") {
    const sequence = mission.activity.sequence;
    return reduceMission(mission, {
      type: "complete-teach",
      teachIndex: sequence.teachIndex,
      targetId: sequence.teachTargetId,
      audioDeliveries: []
    }, contextFor(mission)).state;
  }
  if (["challenge", "content_opportunity", "content_placement"].includes(phase.kind)) {
    if (phase.category === "morphology") {
      const committed = reduceMission(mission, {
        type: "place_tile",
        tileId: "morphology-ending-tile"
      }, contextFor(mission));
      return reduceMission(committed.state, {
        type: "complete_morphology_payoff"
      }, contextFor(committed.state)).state;
    }
    return driveInputs(mission, correctInputs(mission)).mission;
  }
  if (phase.kind === "story_transfer") {
    if (!mission.challenge) {
      return reduceMission(mission, {
        type: "choose_narrative_route",
        choiceId: mission.activity.childScene.choice.options[0].visualSemanticId
      }, contextFor(mission)).state;
    }
    const committed = driveInputs(mission, correctInputs(mission)).mission;
    if (committed.activity.presentation.phase !== "action") return committed;
    const resolved = reduceMission(committed, { type: "action_completed" }, contextFor(committed)).state;
    const semantic = resolveSceneVisualSemantic(resolved.presentationTransition.postDecisionSemanticId);
    const meaning = reduceMission(resolved, {
      type: "meaning_requested",
      meaningSemanticId: semantic.meaningSemanticIds[0]
    }, contextFor(resolved)).state;
    return reduceMission(meaning, {
      type: "complete_story_transfer"
    }, contextFor(meaning)).state;
  }
  throw new Error(`Unsupported test phase: ${phase.id}`);
}

function driveToPhase(plan, phaseId) {
  let mission = createMissionState(plan);
  for (let guard = 0; guard < 300 && mission.phaseId !== phaseId; guard += 1) {
    const before = mission;
    mission = finishCurrentPhase(mission);
    assert.notStrictEqual(mission, before, `phase ${before.phaseId} did not move`);
  }
  assert.equal(mission.phaseId, phaseId);
  return mission;
}

function commitToken(mission, token) {
  const driven = driveInputs(mission, powerInputsForToken(mission, token));
  assert.ok(driven.result.transition);
  return driven.result;
}

function commitCorrect(mission) {
  const challenge = mission.activity.powerChallenge || mission.challenge;
  return commitToken(mission, challenge.expectedToken);
}

function assertEqualControlShape(controls, label) {
  if (controls.length < 2) return;
  const shape = Object.keys(controls[0]).sort();
  for (const item of controls) {
    assert.deepEqual(Object.keys(item).sort(), shape, `${label} outer control shape`);
  }
  const inputShape = Object.keys(controls[0].input).sort();
  for (const item of controls) {
    assert.deepEqual(Object.keys(item.input).sort(), inputShape, `${label} input shape`);
  }
}

function assertSceneChoiceContract(view, { enabled = view.sceneOptionsEnabled } = {}) {
  assert.equal(typeof view.sceneOptionsEnabled, "boolean");
  assert.equal(Object.isFrozen(view.sceneChoiceControls), true);
  if (!enabled) {
    assert.deepEqual(view.sceneChoiceControls, []);
    return;
  }
  assert.equal(view.sceneChoiceControls.length, view.childScene.choice.options.length);
  assert.deepEqual(
    view.sceneChoiceControls.map(item => item.token).sort(),
    view.childScene.choice.options.map(item => item.token).sort()
  );
  for (const item of view.sceneChoiceControls) {
    assert.deepEqual(Object.keys(item).sort(), ["input", "token"]);
    assert.equal(Object.isFrozen(item), true);
    assert.equal(Object.isFrozen(item.input), true);
  }
  assertEqualControlShape(view.sceneChoiceControls, `${view.phaseId} scene choices`);
}

function reduceVisibleSceneInput(mission, input) {
  const reduced = reduceMission(mission, input, contextFor(mission));
  assert.notStrictEqual(reduced.state, mission, `${mission.phaseId}:${input.type} must move the real reducer`);
  return reduced;
}

function chooseVisibleSceneToken(mission, token, missionTransition = null) {
  const view = createSceneViewModel({
    missionState: mission,
    missionTransition,
    appearance: APPEARANCE
  });
  assertSceneChoiceContract(view, { enabled: true });
  const control = view.sceneChoiceControls.find(item => item.token === token);
  assert.ok(control, `${mission.phaseId}:${token} must have one visible scene mapping`);
  return reduceVisibleSceneInput(mission, control.input);
}

function commitConnectedResponseThroughModel(mission, responseToken) {
  for (let guard = 0; guard < 20; guard += 1) {
    const view = createSceneViewModel({ missionState: mission, appearance: APPEARANCE });
    assert.equal(containsForbiddenAuthority(view), false, `${mission.phaseId}: no answer authority`);
    if (view.sceneOptionsEnabled) {
      const control = view.sceneChoiceControls.find(item => item.token === responseToken)
        || (!mission.challenge ? view.sceneChoiceControls[0] : null);
      assert.ok(control, `${mission.phaseId}: current visible route needs a canonical mapping`);
      const reduced = reduceVisibleSceneInput(mission, control.input);
      if (reduced.transition) return reduced;
      mission = reduced.state;
      continue;
    }
    assertSceneChoiceContract(view, { enabled: false });
    assert.ok(view.sceneActivity, `${mission.phaseId}: disabled story options need an action surface`);
    assert.equal(Object.isFrozen(view.sceneActivity), true);
    assert.ok(view.sceneActivity.controls.length > 0);
    assertEqualControlShape(view.sceneActivity.controls, `${mission.phaseId} scene activity`);
    const responseControl = view.sceneActivity.controls
      .find(item => item.input.token === responseToken);
    const control = responseControl || (view.sceneActivity.controls.length === 1
      ? view.sceneActivity.controls[0] : null);
    assert.ok(control, `${mission.phaseId}: scene activity must expose the next exact action`);
    const reduced = reduceVisibleSceneInput(mission, control.input);
    if (reduced.transition) return reduced;
    mission = reduced.state;
  }
  throw new Error(`${mission.phaseId}: model-exposed scene controls did not commit`);
}

function containsForbiddenAuthority(value, seen = new Set()) {
  const forbidden = new Set([
    "answer", "answers", "correct", "correctness", "expectedAnswer",
    "expectedToken", "evidence", "score"
  ]);
  if (!value || typeof value !== "object" || seen.has(value)) return false;
  seen.add(value);
  return Object.entries(value).some(([key, child]) => (
    forbidden.has(key) || containsForbiddenAuthority(child, seen)
  ));
}

test("scene view models join the exact current mission to canonical world, avatar, HUD, controls, and salience", () => {
  const plan = planFor("s1");
  const mission = driveToPhase(plan, "s1-primary");
  const expedition = getExpedition("s1");
  const kit = getBiomeKit(expedition.chapterId);
  const view = createSceneViewModel({
    missionState: mission,
    appearance: APPEARANCE,
    assists: { simplifiedScene: true, largerTargets: true }
  });

  assert.equal(Object.isFrozen(view), true);
  assert.strictEqual(view.layers, kit.layers);
  assert.strictEqual(view.biomeProps.kit, kit);
  assert.equal(validateWorldScenePresentation(view.biomeProps.scenePresentation, {
    chapterId: expedition.chapterId,
    stopId: expedition.stopId,
    route: view.biomeProps.scenePresentation.route,
    landmark: view.biomeProps.scenePresentation.landmark
  }), true);
  assert.deepEqual(Reflect.ownKeys(view.avatar).sort(), ["appearance", "characterId", "pose"]);
  assert.equal(view.avatar.characterId, "player");
  assert.equal(view.avatar.pose, "idle");
  assert.deepEqual(view.avatar.appearance, APPEARANCE);
  assert.equal(view.biomeProps.densityProfile, "simplified");
  assert.equal(view.biomeProps.motionProfile, "full");
  assert.equal(view.traversal.routeId, view.biomeProps.scenePresentation.route.id);
  assert.deepEqual(view.traversal.bounds, { minX: 0, maxX: 1, minY: 0, maxY: 1 });
  assert.equal(view.hud.title, expedition.title);
  assert.equal(view.hud.locationLabel, SOUND_SEEKERS_CHAPTERS[0].title);
  assert.equal(view.hud.progress.total, plan.phases.length);
  assert.equal(view.activity.id, mission.phaseId);
  assert.equal(view.activity.controls.length > 1, true);
  assert.equal(view.sceneOptionsEnabled, false);
  assert.deepEqual(view.sceneChoiceControls, []);
  assert.equal(view.sceneActivity, null);
  assert.equal(containsForbiddenAuthority(view), false);
  assert.equal(view.interactables.length > 0, true);
  assert.equal(view.interactables.every(item => (
    item.contrastPriority > view.decorationsMaxPriority
  )), true);
  assert.equal(view.salience.interactiveMinPriority > view.salience.decorationsMaxPriority, true);

  assert.throws(() => createSceneViewModel({
    missionState: structuredClone(mission),
    appearance: APPEARANCE
  }), /current|exact|mission/u);
  assert.throws(() => createSceneViewModel({
    missionState: mission,
    appearance: APPEARANCE,
    biome: kit
  }), /unknown|contract|authority/u);
});

test("connected-text models preserve exact nested identities and issue access only from the live Task 3 transition", () => {
  const plan = planFor("s1");
  const transfer = plan.phases.find(phase => phase.kind === "story_transfer");
  let mission = driveToPhase(plan, transfer.id);
  const challenge = mission.activity.powerChallenge || mission.challenge;
  const wrong = challenge.optionTokens.find(token => token !== challenge.expectedToken);
  const missed = commitToken(mission, wrong);
  const correctionView = createSceneViewModel({
    missionState: missed.state,
    missionTransition: missed.transition,
    appearance: APPEARANCE
  });
  assert.strictEqual(correctionView.transition, missed.state.presentationTransition);
  assert.equal(correctionView.transition.phase, "correction");
  assert.equal(correctionView.sceneVisualProps.sceneAccess, null);
  mission = missed.state;
  const committed = commitCorrect(mission);
  mission = committed.state;
  const view = createSceneViewModel({
    missionState: mission,
    missionTransition: committed.transition,
    appearance: APPEARANCE
  });

  assert.strictEqual(view.childScene, mission.activity.childScene);
  assert.strictEqual(view.presentation, mission.activity.presentation);
  assert.strictEqual(view.transition, mission.presentationTransition);
  assert.equal(view.avatar, null);
  assert.equal(view.biomeProps, null);
  assert.equal(view.activity, null);
  assert.equal(validateSceneVisualAccess(view.sceneVisualProps.sceneAccess, {
    sceneId: view.childScene.id,
    attemptId: view.sceneVisualProps.activeAttemptId,
    reducerRevision: view.sceneVisualProps.reducerRevision
  }), true);

  const oldAccess = view.sceneVisualProps.sceneAccess;
  mission = reduceMission(mission, { type: "action_completed" }, contextFor(mission)).state;
  assert.equal(validateSceneVisualAccess(oldAccess, {
    sceneId: view.childScene.id,
    attemptId: view.sceneVisualProps.activeAttemptId,
    reducerRevision: view.sceneVisualProps.reducerRevision
  }), false);
  assert.throws(
    () => createGameFeelSequence(view, committed.transition),
    /current|stale|transition/u
  );

  const resolved = createSceneViewModel({ missionState: mission, appearance: APPEARANCE });
  assert.strictEqual(resolved.childScene, mission.activity.childScene);
  assert.strictEqual(resolved.presentation, mission.activity.presentation);
  assert.strictEqual(resolved.transition, mission.presentationTransition);
  assert.equal(validateSceneVisualAccess(resolved.sceneVisualProps.sceneAccess, {
    sceneId: resolved.childScene.id,
    attemptId: resolved.sceneVisualProps.activeAttemptId,
    reducerRevision: resolved.sceneVisualProps.reducerRevision
  }), true);
});

test("teach models expose the exact full TeachAllSequence item and no counterfeit completion button", () => {
  const plan = createMissionPlan({
    stopId: "s1",
    state: createSoundSeekersState(),
    seed: 1,
    replayOrdinal: 0
  });
  let mission = createMissionState(plan);
  mission = reduceMission(mission, { type: "complete_arrival" }, contextFor(mission)).state;
  assert.equal(mission.phaseId, "s1-teach");
  assert.ok(mission.activity.sequence.currentItem);

  const view = createSceneViewModel({ missionState: mission, appearance: APPEARANCE });
  assert.strictEqual(view.activity.teachItem, mission.activity.sequence.currentItem);
  assert.equal(Object.isFrozen(view.activity.teachItem), true);
  assert.deepEqual(
    Object.keys(view.activity.teachItem),
    Object.keys(mission.activity.sequence.currentItem)
  );
  assert.equal(view.activity.controls.some(item => (
    ["complete_teach", "complete-teach"].includes(item.input.type)
  )), false);
  assert.equal(view.activity.controls.some(item => item.label === "I am ready"), false);
  assert.equal(containsForbiddenAuthority(view), false);

  const alreadyTaughtPlan = planFor("s1");
  let alreadyTaught = createMissionState(alreadyTaughtPlan);
  alreadyTaught = reduceMission(
    alreadyTaught,
    { type: "complete_arrival" },
    contextFor(alreadyTaught)
  ).state;
  assert.equal(alreadyTaught.phaseId, "s1-teach");
  const alreadyTaughtView = createSceneViewModel({
    missionState: alreadyTaught,
    appearance: APPEARANCE
  });
  assert.equal(alreadyTaughtView.activity.teachItem, null);
  assert.deepEqual(alreadyTaughtView.activity.controls.map(item => item.input), [{
    type: "complete-teach",
    teachIndex: alreadyTaught.activity.sequence.teachIndex,
    targetId: null,
    audioDeliveries: []
  }]);
  assert.notStrictEqual(
    reduceMission(
      alreadyTaught,
      alreadyTaughtView.activity.controls[0].input,
      contextFor(alreadyTaught)
    ).state,
    alreadyTaught
  );
});

test("all forty connected-text routes are playable only through model-exposed canonical controls", () => {
  const transfers = SOUND_SEEKERS_EXPEDITIONS.map(expedition => ({
    expedition,
    action: expedition.phases.find(phase => phase.kind === "transfer")
  }));
  assert.equal(transfers.length, 40);
  assert.deepEqual(
    Object.fromEntries(["story_power", "memory_delivery", "blend_bridge"].map(powerId => [
      powerId,
      transfers.filter(item => item.action.powerId === powerId).length
    ])),
    { story_power: 31, memory_delivery: 1, blend_bridge: 8 }
  );

  for (const { expedition, action } of transfers) {
    const plan = planFor(expedition.stopId);
    let mission = driveToPhase(plan, action.id);
    let view = createSceneViewModel({ missionState: mission, appearance: APPEARANCE });
    assert.strictEqual(view.childScene, mission.activity.childScene, action.id);
    assert.equal(containsForbiddenAuthority(view), false, action.id);

    if (expedition.transfer.boss) {
      assert.equal(mission.activity.status, "narrative_choice_pending", action.id);
      assertSceneChoiceContract(view, { enabled: true });
      assert.equal(view.sceneChoiceControls.length, 2, action.id);
      assert.equal(view.sceneChoiceControls.every(item => (
        item.input.type === "choose_narrative_route"
        && Object.keys(item.input).length === 2
      )), true, action.id);
      const routeToken = view.sceneChoiceControls[0].token;
      mission = chooseVisibleSceneToken(mission, routeToken).state;
      view = createSceneViewModel({ missionState: mission, appearance: APPEARANCE });
      assert.equal(view.childScene.choice.options.length, 2, action.id);
      assertSceneChoiceContract(view, { enabled: false });
      assert.ok(view.sceneActivity, action.id);
      for (let guard = 0;
        guard < 10 && view.sceneActivity.controls[0].input.type !== action.expectedAction;
        guard += 1) {
        assert.equal(view.sceneActivity.controls.length, 1, action.id);
        mission = reduceVisibleSceneInput(mission, view.sceneActivity.controls[0].input).state;
        view = createSceneViewModel({ missionState: mission, appearance: APPEARANCE });
      }
      assert.equal(view.childScene.choice.options.length, 2, action.id);
      assert.equal(view.sceneActivity.controls.length, 3, action.id);
      assert.equal(view.sceneActivity.controls.every(item => (
        item.input.type === action.expectedAction
        && Object.keys(item.input).length === 3
      )), true, action.id);
      assert.deepEqual(
        view.sceneActivity.controls.map(item => item.input.token).sort(),
        mission.challenge.optionTokens.slice().sort(),
        action.id
      );
      assertEqualControlShape(view.sceneActivity.controls, `${action.id} boss challenge choices`);
    } else {
      assertSceneChoiceContract(view, { enabled: false });
      assert.ok(view.sceneActivity, action.id);
      if (action.powerId === "story_power") {
        assert.deepEqual(view.sceneActivity.controls.map(item => item.input), [
          { type: "read_text" }
        ], action.id);
      } else {
        assert.equal(action.powerId, "memory_delivery", action.id);
        assert.deepEqual(view.sceneActivity.controls.map(item => item.input), [
          { type: "receive_cue" }
        ], action.id);
      }
    }

    let challenge = mission.activity.powerChallenge || mission.challenge;
    const wrongToken = challenge.optionTokens.find(token => token !== challenge.expectedToken);
    const missed = commitConnectedResponseThroughModel(mission, wrongToken);
    assert.equal(missed.transition.outcome, "retry", action.id);
    assert.equal(missed.state.presentationTransition.phase, "correction", action.id);
    view = createSceneViewModel({
      missionState: missed.state,
      missionTransition: missed.transition,
      appearance: APPEARANCE
    });
    assert.strictEqual(view.childScene, missed.state.activity.childScene, action.id);
    assert.equal(view.sceneVisualProps.sceneAccess, null, action.id);
    assertSceneChoiceContract(view, { enabled: false });
    assert.ok(view.sceneActivity.correction, action.id);
    assert.equal(view.sceneActivity.correction.visibleText,
      view.sceneActivity.correction.spokenText, action.id);

    challenge = missed.state.activity.powerChallenge || missed.state.challenge;
    const succeeded = commitConnectedResponseThroughModel(missed.state, challenge.expectedToken);
    assert.equal(succeeded.transition.outcome, "advance", action.id);
    assert.equal(succeeded.state.presentationTransition.phase, "action", action.id);
    view = createSceneViewModel({
      missionState: succeeded.state,
      missionTransition: succeeded.transition,
      appearance: APPEARANCE
    });
    assertSceneChoiceContract(view, { enabled: false });
    assert.deepEqual(view.sceneActivity.controls.map(item => item.input), [
      { type: "action_completed" }
    ], action.id);

    mission = reduceVisibleSceneInput(succeeded.state, view.sceneActivity.controls[0].input).state;
    view = createSceneViewModel({ missionState: mission, appearance: APPEARANCE });
    assert.equal(mission.activity.presentation.phase, "resolved", action.id);
    assertSceneChoiceContract(view, { enabled: false });
    assert.equal(view.sceneActivity.controls.length >= 1, true, action.id);
    assert.equal(view.sceneActivity.controls.every(item => (
      item.input.type === "meaning_requested"
      && typeof item.input.meaningSemanticId === "string"
    )), true, action.id);
    assertEqualControlShape(view.sceneActivity.controls, `${action.id} meaning choices`);

    mission = reduceVisibleSceneInput(mission, view.sceneActivity.controls[0].input).state;
    view = createSceneViewModel({ missionState: mission, appearance: APPEARANCE });
    assert.equal(mission.activity.presentation.phase, "meaning_support", action.id);
    assertSceneChoiceContract(view, { enabled: false });
    assert.deepEqual(view.sceneActivity.controls.map(item => item.input), [
      { type: "complete_story_transfer" }
    ], action.id);

    const completed = reduceVisibleSceneInput(mission, view.sceneActivity.controls[0].input).state;
    assert.notEqual(completed.phaseId, action.id, action.id);
    assert.equal(createSceneViewModel({
      missionState: completed,
      appearance: APPEARANCE
    }).childScene, null, action.id);
  }
});

test("both visible narrative routes at every boss enter their exact playable blend challenge", () => {
  const bosses = SOUND_SEEKERS_EXPEDITIONS.filter(expedition => expedition.transfer.boss);
  assert.equal(bosses.length, 8);
  for (const expedition of bosses) {
    const action = expedition.phases.find(phase => phase.kind === "transfer");
    for (let optionIndex = 0; optionIndex < 2; optionIndex += 1) {
      let mission = driveToPhase(planFor(expedition.stopId), action.id);
      const narrative = createSceneViewModel({ missionState: mission, appearance: APPEARANCE });
      assertSceneChoiceContract(narrative, { enabled: true });
      const mapping = narrative.sceneChoiceControls[optionIndex];
      const option = narrative.childScene.choice.options.find(item => item.token === mapping.token);
      assert.ok(option, `${action.id}: narrative option ${optionIndex}`);
      assert.deepEqual(mapping.input, {
        type: "choose_narrative_route",
        choiceId: option.visualSemanticId
      });
      mission = reduceVisibleSceneInput(mission, mapping.input).state;
      assert.ok(mission.challenge, `${action.id}: narrative option ${optionIndex} challenge`);
      assert.equal(
        mission.gameState.checkpoint.storyTransfer.narrativeChoiceToken,
        option.token,
        `${action.id}: narrative option ${optionIndex} persisted route`
      );
      const blend = createSceneViewModel({ missionState: mission, appearance: APPEARANCE });
      assertSceneChoiceContract(blend, { enabled: false });
      assert.equal(blend.sceneActivity.controls.length, 1);
      assert.equal(blend.sceneActivity.controls[0].input.type, "activate_segment");
      reduceVisibleSceneInput(mission, blend.sceneActivity.controls[0].input);
    }
  }
});

test("game-feel models bind exact commit outcomes, six-step repair, material audio, and reduced-motion semantics", () => {
  const plan = planFor("s1");
  const pending = driveToPhase(plan, "s1-primary");
  const committed = commitCorrect(pending);
  const fullModel = createSceneViewModel({
    missionState: committed.state,
    missionTransition: committed.transition,
    appearance: APPEARANCE
  });
  const reducedModel = createSceneViewModel({
    missionState: committed.state,
    missionTransition: committed.transition,
    appearance: APPEARANCE,
    reducedMotion: true
  });
  const full = createGameFeelSequence(fullModel, committed.transition);
  const reduced = createGameFeelSequence(reducedModel, committed.transition);
  const material = questChapterMaterialSfxEntry("seedwake-meadow");

  assert.deepEqual(full.steps.map(step => step.kind), [
    "anticipation",
    "contact",
    "literacy_effect",
    "resident_reaction",
    "repair",
    "settled"
  ]);
  assert.equal(full.steps.find(step => step.kind === "contact").targetId, fullModel.contactTargetId);
  assert.equal(
    full.steps.find(step => step.kind === "resident_reaction").eyelineTargetId,
    full.steps.find(step => step.kind === "contact").targetId
  );
  assert.equal(full.steps.find(step => step.kind === "literacy_effect").construct,
    fullModel.committedConstruct);
  assert.equal(full.steps.filter(step => step.materialSoundId).length, 1);
  const repair = full.steps.find(step => step.kind === "repair");
  assert.equal(repair.materialSoundId, material.key);
  assert.equal(repair.materialAudioKey, material.src);
  assert.deepEqual(repair.audioRequest, {
    cueId: "material:seedwake-meadow",
    audioKey: material.src,
    visibleText: "The Seedwake Meadow repair settles into place.",
    spokenText: "The Seedwake Meadow repair settles into place.",
    kind: "material_effect",
    requiresAudio: false
  });
  assert.deepEqual(reduced.semanticFinalState, full.semanticFinalState);
  assert.equal(full.continuousMotion, true);
  assert.equal(reduced.continuousMotion, false);
  assert.equal(reduced.particles, false);
  assert.equal(reduced.squashAndStretch, false);
  assert.equal(reduced.contactOutline, true);
  assert.equal(Object.isFrozen(full.steps), true);
  assert.equal(full.steps.every(Object.isFrozen), true);

  assert.throws(() => createGameFeelSequence({ ...fullModel }, committed.transition), /model|exact/u);
  assert.throws(() => createGameFeelSequence(fullModel, { ...committed.transition }), /transition|exact/u);

  const advancedAgain = reduceMission(committed.state, { type: "receive_cue" }, contextFor(committed.state));
  assert.notStrictEqual(advancedAgain.state, committed.state);
  assert.throws(
    () => createGameFeelSequence(fullModel, committed.transition),
    /current|stale|transition/u
  );
});

test("continue, retry, and model-required game-feel cannot smuggle repair or Wonder", () => {
  const placementPlan = planFor("s16");
  const placement = placementPlan.phases.find(phase => phase.kind === "content_placement");
  const placementMission = driveToPhase(placementPlan, placement.id);
  const continued = commitCorrect(placementMission);
  assert.equal(continued.transition.outcome, "continue");
  const continueModel = createSceneViewModel({
    missionState: continued.state,
    missionTransition: continued.transition,
    appearance: APPEARANCE
  });
  const continueFeel = createGameFeelSequence(continueModel, continued.transition);
  assert.deepEqual(continueFeel.steps.map(step => step.kind), [
    "anticipation", "contact", "literacy_effect", "resident_reaction", "settled"
  ]);
  assert.equal(continueFeel.steps.some(step => (
    step.kind === "repair" || step.wonderId || step.materialSoundId
  )), false);

  const retryPlan = planFor("s1");
  let mission = driveToPhase(retryPlan, "s1-primary");
  const correctionModes = ["retry", "narrow", "teach"];
  for (const [missIndex, expectedOutcome] of ["retry", "retry", "model_required"].entries()) {
    const challenge = mission.activity.powerChallenge || mission.challenge;
    const wrong = challenge.optionTokens.find(token => token !== challenge.expectedToken);
    const missed = commitToken(mission, wrong);
    assert.equal(missed.transition.outcome, expectedOutcome);
    const model = createSceneViewModel({
      missionState: missed.state,
      missionTransition: missed.transition,
      appearance: APPEARANCE
    });
    const feel = createGameFeelSequence(model, missed.transition);
    const correctionRequest = createSoundSeekersCorrectionAudioRequest(correctionModes[missIndex]);
    assert.deepEqual(model.activity.correction, {
      mode: correctionModes[missIndex],
      visibleText: correctionRequest.visibleText,
      spokenText: correctionRequest.spokenText,
      audioRequest: correctionRequest
    });
    assert.deepEqual(feel.steps.map(step => step.kind), [
      expectedOutcome === "model_required" ? "model_reaction" : "correction_reaction"
    ]);
    assert.equal(feel.steps.some(step => step.materialSoundId || step.wonderId), false);
    mission = missed.state;
  }
  assert.throws(
    () => createGameFeelSequence(continueModel, mission.presentationTransition),
    /transition|exact|current/u
  );
});

test("every authored Word Forge and Blend Bridge success gets the exact immediate meaning support", () => {
  const actions = SOUND_SEEKERS_EXPEDITIONS.flatMap(expedition => expedition.phases
    .filter(action => ["word_forge", "blend_bridge"].includes(action.powerId) && action.wordId)
    .map(action => ({ expedition, action })));
  assert.equal(actions.length, 48);

  for (const { expedition, action } of actions) {
    const plan = planFor(expedition.stopId);
    let pending = driveToPhase(plan, action.id);
    if (pending.activity.status === "narrative_choice_pending") {
      pending = finishCurrentPhase(pending);
      assert.equal(pending.phaseId, action.id);
    }
    const pendingView = createSceneViewModel({
      missionState: pending,
      appearance: APPEARANCE,
      assists: { reducedMotion: true, simplifiedScene: true }
    });
    assert.equal(pendingView.chapterId, expedition.chapterId, action.id);
    assert.equal(pendingView.sceneVisualProps?.motionProfile
      ?? pendingView.biomeProps?.motionProfile, "reduced", action.id);
    assert.equal(pendingView.sceneVisualProps?.densityProfile
      ?? pendingView.biomeProps?.densityProfile, "simplified", action.id);
    assert.equal(pendingView.childScene ? pendingView.activity === null
      : pendingView.activity.controls.length > 0, true, action.id);
    assert.throws(() => createMeaningPayoffModel({
      powerId: action.powerId,
      wordId: action.wordId,
      missionTransition: null
    }), /transition|current|applied/u);

    const committed = commitCorrect(pending);
    assert.equal(committed.transition.outcome, "advance", action.id);
    const payoff = createMeaningPayoffModel({
      powerId: action.powerId,
      wordId: action.wordId,
      missionTransition: committed.transition
    });
    const support = getMeaningSupport(action.wordId);
    const transcript = `${support.childDefinition} ${support.ellSupport.oralBridge} ${support.actionPrompt}`;
    assert.strictEqual(payoff.support, support, action.id);
    assert.strictEqual(payoff.visual, resolveMeaningVisual(support.visualSemanticId), action.id);
    assert.equal(payoff.visual.wordId, action.wordId, action.id);
    assert.deepEqual(payoff.audioRequest, {
      cueId: `meaning:${action.wordId}`,
      audioKey: `quest/meaning/${action.wordId}`,
      visibleText: transcript,
      spokenText: transcript,
      kind: "meaning_support",
      requiresAudio: true
    }, action.id);
    assert.equal(payoff.evidenceAdded, 0);
    assert.equal(payoff.immediateBeforeNextMissionAction, true);
    assert.equal(Object.isFrozen(payoff), true);

    assert.throws(() => createMeaningPayoffModel({
      powerId: action.powerId,
      wordId: action.wordId,
      missionTransition: structuredClone(committed.transition)
    }), /transition|current|applied/u);
    assert.throws(() => createMeaningPayoffModel({
      powerId: action.powerId === "word_forge" ? "blend_bridge" : "word_forge",
      wordId: action.wordId,
      missionTransition: committed.transition
    }), /action|power|transition/u);
    const otherWord = actions.find(candidate => candidate.action.wordId !== action.wordId).action.wordId;
    assert.throws(() => createMeaningPayoffModel({
      powerId: action.powerId,
      wordId: otherWord,
      missionTransition: committed.transition
    }), /action|word|transition/u);

    if (action.id === "s1-secondary") {
      const newer = reduceMission(committed.state, { type: "receive_cue" }, contextFor(committed.state));
      assert.notStrictEqual(newer.state, committed.state);
      assert.throws(() => createMeaningPayoffModel({
        powerId: action.powerId,
        wordId: action.wordId,
        missionTransition: committed.transition
      }), /current|stale|transition/u);
    }
  }
});

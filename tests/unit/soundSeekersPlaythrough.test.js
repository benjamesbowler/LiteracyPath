import test from "node:test";
import assert from "node:assert/strict";

import { SOUND_SEEKERS_EXPEDITIONS } from "../../src/features/soundSeekers/content/expeditions.js";
import { createMissionPlan } from "../../src/features/soundSeekers/engine/createMissionPlan.js";
import {
  checkpointMission,
  completeMission,
  createMissionState,
  reduceMission
} from "../../src/features/soundSeekers/engine/missionReducer.js";
import { validContentDeckUses } from "../../src/features/soundSeekers/engine/contentCoverage.js";
import {
  recordContentDeckUse,
  serveContentDeck
} from "../../src/features/soundSeekers/engine/contentDeckScheduler.js";
import { createSoundSeekersState } from "../../src/features/soundSeekers/engine/stateV2.js";
import { normalizeSoundSeekersState } from "../../src/features/soundSeekers/engine/stateV2.js";
import { resolveSceneVisualSemantic } from "../../src/features/soundSeekers/content/sceneVisualSemantics.js";
import {
  issueWordWorkbenchAccess,
  projectCurrentWordWorkbenchModel,
  projectWordWorkbenchAccess
} from "../../src/features/soundSeekers/engine/workbenchAccess.js";

function completedTeachInput(item, sequence = null) {
  return {
    type: "complete-teach", teachIndex: item?.teachIndex ?? sequence?.teachIndex,
    targetId: item?.targetId ?? null,
    audioDeliveries: item ? [item.childAudio, item.targetAudio, ...item.targetAudioSequence,
      ...item.targetAudioAlternates.map(alternate => alternate.targetAudio)]
      .filter(Boolean).map((id, index) => ({
        id, status: "completed", session: index + 1,
        startedAt: index * 10, completedAt: index * 10 + 5
      })) : []
  };
}

function driveInputs(mission, inputs, context) {
  let result = null;
  for (const input of inputs) {
    result = reduceMission(mission, input, { ...context, gameState: mission.gameState });
    mission = result.state;
  }
  return { mission, result };
}

function driveToPhase(plan, targetPhaseId) {
  let mission = createMissionState(plan);
  let clock = 0;
  for (let guard = 0; guard < 200 && mission.phaseId !== targetPhaseId; guard += 1) {
    const phase = plan.phases[mission.phaseIndex];
    const context = {
      gameState: mission.gameState,
      at: new Date(Date.UTC(2026, 8, 3) + clock++ * 1000).toISOString(),
      sessionDay: "2026-09-03",
      audio: { status: "completed" }
    };
    let inputs;
    if (phase.kind === "teach") inputs = [completedTeachInput(
      mission.activity.sequence.currentItem, mission.activity.sequence
    )];
    else if (phase.kind === "power_onboarding" || phase.kind === "challenge"
      || phase.kind === "content_opportunity") inputs = correctPowerInputs(mission);
    else if (phase.kind === "content_placement") inputs = phase.category === "morphology"
      ? [{ type: "place_tile", tileId: "morphology-ending-tile" }]
      : correctPowerInputs(mission);
    else if (phase.kind === "story_transfer") inputs = mission.challenge
      ? correctPowerInputs(mission)
      : [{ type: "choose_narrative_route",
        choiceId: mission.activity.childScene.choice.options[0].visualSemanticId }];
    else inputs = [{ type: `complete_${phase.kind}` }];
    mission = driveInputs(mission, inputs, context).mission;
    if (phase.kind === "content_placement" && phase.category === "morphology"
      && mission.phaseId === phase.id) {
      mission = reduceMission(mission, { type: "complete_morphology_payoff" }, {
        ...context, gameState: mission.gameState
      }).state;
    }
    if (phase.kind === "story_transfer" && mission.phaseId === phase.id
      && mission.activity.presentation.phase === "action") {
      mission = reduceMission(mission, { type: "action_completed" }, {
        ...context, gameState: mission.gameState
      }).state;
      const semantic = resolveSceneVisualSemantic(mission.presentationTransition.postDecisionSemanticId);
      mission = reduceMission(mission, {
        type: "meaning_requested", meaningSemanticId: semantic.meaningSemanticIds[0]
      }, { ...context, gameState: mission.gameState }).state;
      mission = reduceMission(mission, { type: "complete_story_transfer" }, {
        ...context, gameState: mission.gameState
      }).state;
    }
  }
  assert.equal(mission.phaseId, targetPhaseId);
  return mission;
}

test("the two-route circuit preserves a monotonic visit clock", () => {
  let state = createSoundSeekersState();
  const visits = [...SOUND_SEEKERS_EXPEDITIONS, ...SOUND_SEEKERS_EXPEDITIONS];
  for (const [index, expedition] of visits.entries()) {
    state = { ...state, trail: { ...state.trail, journeyStep: index + 1 } };
    const plan = createMissionPlan({ stopId: expedition.stopId, state, seed: index, replayOrdinal: index > 39 ? 1 : 0 });
    assert.equal(plan.journeyStep, index + 1);
    assert.equal(plan.stopId, expedition.stopId);
  }
  assert.equal(createMissionPlan({ stopId: "s1", state: {
    ...state, trail: { ...state.trail, journeyStep: 41 }
  }, seed: 41, replayOrdinal: 1 }).id.startsWith("mission:41:s1:"), true);
});

test("the first ordinary and heart-word loops commit one response and one owner use each", () => {
  const gameState = createSoundSeekersState();
  const plan = createMissionPlan({ stopId: "s1", state: gameState, seed: 1, replayOrdinal: 0 });
  let mission = createMissionState(plan);
  const context = {
    gameState,
    at: "2026-09-03T01:00:00.000Z",
    sessionDay: "2026-09-03",
    audio: { status: "completed" }
  };
  mission = reduceMission(mission, { type: "complete_arrival" }, context).state;
  while (mission.phaseId === "s1-teach") mission = reduceMission(mission,
    completedTeachInput(mission.activity.sequence.currentItem), context).state;
  assert.equal(reduceMission(mission, { type: "complete_onboarding" }, context).state, mission);
  mission = driveInputs(mission, correctPowerInputs(mission), context).mission;
  const echoChoice = mission.challenge.presentation.candidates.find(item => item.token === mission.challenge.expectedToken);
  mission = reduceMission(mission, { type: "probe", candidateId: echoChoice.id }, context).state;
  mission = reduceMission(mission, { type: "confirm_candidate", candidateId: echoChoice.id }, context).state;
  mission = driveInputs(mission, correctPowerInputs(mission), context).mission;
  mission = reduceMission(mission, { type: "receive_cue" }, context).state;
  mission = reduceMission(mission, { type: "move", dx: 1, dy: 0 }, context).state;
  mission = reduceMission(mission, { type: "arrive" }, context).state;
  const recipient = mission.challenge.presentation.recipients.find(item => item.token === mission.challenge.expectedToken);
  mission = reduceMission(mission, {
    type: mission.challenge.expectedAction, recipientId: recipient.id
  }, { ...context, gameState: mission.gameState }).state;
  assert.equal(mission.phaseId, "s1-secondary-onboarding");
  assert.equal(mission.gameState.evidence.length, 2);
  assert.equal(validContentDeckUses(mission.gameState, "heartWords").length, 1);
});

test("a heart-word miss keeps the owner visit and issues a fresh canonical attempt", () => {
  const gameState = createSoundSeekersState();
  const plan = createMissionPlan({ stopId: "s1", state: gameState, seed: 1, replayOrdinal: 0 });
  const heart = plan.phases.find(item => item.kind === "content_opportunity");
  let mission = driveToPhase(plan, heart.id);
  const visitId = mission.activeContent.served.visitId;
  const context = {
    gameState: mission.gameState,
    at: "2026-09-03T01:30:00.000Z",
    sessionDay: "2026-09-03",
    audio: { status: "completed" }
  };
  mission = reduceMission(mission, { type: "receive_cue" }, context).state;
  mission = reduceMission(mission, { type: "move", dx: 1, dy: 0 }, context).state;
  mission = reduceMission(mission, { type: "arrive" }, context).state;
  const wrong = mission.challenge.presentation.recipients.find(item => item.token !== mission.challenge.expectedToken);
  const missed = reduceMission(mission, {
    type: mission.challenge.expectedAction, recipientId: wrong.id
  }, context);
  assert.equal(missed.transition.outcome, "retry");
  assert.equal(missed.state.attemptOrdinal, 1);
  assert.equal(missed.state.activeContent.served.visitId, visitId);
  assert.equal(validContentDeckUses(missed.state.gameState, "heartWords").length, 0);
});

test("s6 primary reuses its owner heart visit and records only the distinct shared action use", () => {
  const initial = createSoundSeekersState();
  const s6 = SOUND_SEEKERS_EXPEDITIONS.find(item => item.stopId === "s6");
  const owner = s6.heartWordOpportunities[0];
  const action = s6.phases.find(item => item.id === "s6-primary");
  const served = serveContentDeck(initial.contentDecks, {
    binding: owner.contentBinding,
    visitId: "visit:6:s6-heart-1",
    stopId: "s6",
    journeyStep: 6,
    seed: 6
  });
  const seeded = normalizeSoundSeekersState({
    ...initial,
    trail: { ...initial.trail, journeyStep: 6 },
    contentDecks: recordContentDeckUse(served.nextState, served, owner.contentBinding)
  });
  const plan = createMissionPlan({ stopId: "s6", state: seeded, seed: 6, replayOrdinal: 0 });
  let mission = driveToPhase(plan, action.id);
  assert.equal(Object.keys(mission.gameState.contentDecks.heartWords.visits).length, 1);
  const bin = mission.challenge.presentation.bins.find(item => item.token === mission.challenge.expectedToken);
  const result = reduceMission(mission, {
    type: action.expectedAction,
    itemId: mission.challenge.presentation.items[0].id,
    binId: bin.id
  }, {
    gameState: mission.gameState,
    at: "2026-09-03T01:45:00.000Z",
    sessionDay: "2026-09-03",
    audio: { status: "completed" }
  });
  assert.equal(result.transition.outcome, "advance");
  assert.equal(Object.keys(result.state.gameState.contentDecks.heartWords.visits).length, 1);
  assert.equal(validContentDeckUses(result.state.gameState, "heartWords")
    .some(use => use.actionUseId === "s6-primary:content-use"), true);
});

test("a placement commits each target immediately and records its use only after the final target", () => {
  const initial = createSoundSeekersState();
  const gameState = normalizeSoundSeekersState({
    ...initial, trail: { ...initial.trail, journeyStep: 16 }
  });
  const plan = createMissionPlan({ stopId: "s16", state: gameState, seed: 16, replayOrdinal: 0 });
  const placement = plan.phases.find(item => item.kind === "content_placement");
  let mission = driveToPhase(plan, placement.id);
  assert.equal(mission.activity.kind, "contrast_sort_state");
  assert.equal(mission.challenge.presentation.items.length >= 4, true);
  assert.equal(mission.challenge.presentation.bins.length, 3);
  const context = {
    gameState: mission.gameState,
    at: "2026-09-03T03:00:00.000Z",
    sessionDay: "2026-09-03",
    audio: { status: "completed" }
  };
  const firstBin = mission.challenge.presentation.bins
    .find(bin => bin.token === mission.challenge.expectedToken);
  const first = reduceMission(mission, {
    type: mission.challenge.expectedAction,
    itemId: mission.challenge.presentation.items[0].id,
    binId: firstBin.id
  }, context);
  assert.equal(first.transition.outcome, "continue");
  assert.equal(validContentDeckUses(first.state.gameState, "alternatives").length, 0);
  mission = first.state;
  const secondBin = mission.challenge.presentation.bins
    .find(bin => bin.token === mission.challenge.expectedToken);
  const second = reduceMission(mission, {
    type: mission.challenge.expectedAction,
    itemId: mission.challenge.presentation.items[0].id,
    binId: secondBin.id
  }, { ...context, gameState: mission.gameState });
  assert.equal(second.transition.outcome, "advance");
  assert.equal(validContentDeckUses(second.state.gameState, "alternatives").length, 1);
  assert.equal(second.state.gameState.evidence.length, 2);
});

test("story transfer remains one composite through action, resolution, and meaning payoff", () => {
  const gameState = createSoundSeekersState();
  const plan = createMissionPlan({ stopId: "s1", state: gameState, seed: 1, replayOrdinal: 0 });
  const story = plan.phases.find(item => item.kind === "story_transfer");
  let mission = driveToPhase(plan, story.id);
  const context = {
    gameState: mission.gameState,
    at: "2026-09-03T04:00:00.000Z",
    sessionDay: "2026-09-03",
    audio: { status: "completed" }
  };
  assert.equal(mission.activity.kind, "story_power_state");
  let answered;
  for (const input of correctPowerInputs(mission)) {
    answered = reduceMission(mission, input, { ...context, gameState: mission.gameState });
    mission = answered.state;
  }
  assert.equal(answered.transition.outcome, "advance");
  assert.equal(mission.activity.presentation.phase, "action");
  mission = reduceMission(mission, { type: "action_completed" }, context).state;
  assert.equal(mission.activity.presentation.phase, "resolved");
  const semantic = resolveSceneVisualSemantic(mission.presentationTransition.postDecisionSemanticId);
  mission = reduceMission(mission, {
    type: "meaning_requested", meaningSemanticId: semantic.meaningSemanticIds[0]
  }, context).state;
  assert.equal(mission.activity.presentation.phase, "meaning_support");
  mission = reduceMission(mission, { type: "complete_story_transfer" }, context).state;
  assert.equal(mission.phaseId, "s1-payoff");
  assert.equal(validContentDeckUses(mission.gameState, "stories").length, 1);
  assert.equal(validContentDeckUses(mission.gameState, "transfer").length, 1);
});

test("a boss waits for an authenticated child narrative choice and preserves it across reload", () => {
  const base = createSoundSeekersState();
  const gameState = normalizeSoundSeekersState({ ...base, trail: { ...base.trail, journeyStep: 5 } });
  const plan = createMissionPlan({ stopId: "s5", state: gameState, seed: 5, replayOrdinal: 0 });
  const story = plan.phases.find(item => item.kind === "story_transfer");
  let mission = driveToPhase(plan, story.id);
  assert.equal(mission.challenge, null);
  assert.equal(mission.activity.status, "narrative_choice_pending");
  const choice = mission.activity.childScene.choice.options[1];
  assert.equal(reduceMission(mission, {
    type: "choose_narrative_route", choiceId: "forged"
  }, { gameState: mission.gameState }).state, mission);
  mission = reduceMission(mission, {
    type: "choose_narrative_route", choiceId: choice.visualSemanticId
  }, { gameState: mission.gameState }).state;
  assert.equal(mission.challenge.powerId, "blend_bridge");
  assert.equal(mission.gameState.checkpoint.storyTransfer.narrativeChoiceToken, choice.token);
  const checkpoint = checkpointMission(mission);
  const saved = normalizeSoundSeekersState({
    ...mission.gameState,
    checkpoint: { ...mission.gameState.checkpoint, contentVersion: mission.gameState.contentVersion,
      mission: checkpoint }
  });
  assert.ok(saved.checkpoint, JSON.stringify(checkpoint));
  const restoredPlan = createMissionPlan({ stopId: "s5", state: saved, seed: 5, replayOrdinal: 0 });
  const restored = createMissionState(restoredPlan, saved.checkpoint.mission);
  assert.equal(restored.gameState.checkpoint.storyTransfer.narrativeChoiceToken, choice.token);
  assert.equal(restored.challenge.powerId, "blend_bridge");
});

test("placement and story reload retain exact Task 2 progress but reissue object authority", () => {
  const initial = createSoundSeekersState();
  const placementState = normalizeSoundSeekersState({
    ...initial, trail: { ...initial.trail, journeyStep: 16 }
  });
  const placementPlan = createMissionPlan({ stopId: "s16", state: placementState, seed: 16, replayOrdinal: 0 });
  const placement = placementPlan.phases.find(item => item.kind === "content_placement");
  let mission = driveToPhase(placementPlan, placement.id);
  const placementDriven = driveInputs(mission, correctPowerInputs(mission), {
    gameState: mission.gameState, at: "2026-09-03T07:00:00.000Z",
    sessionDay: "2026-09-03", audio: { status: "completed" }
  });
  mission = placementDriven.mission;
  const oldPlacementChallenge = mission.challenge;
  const placementCheckpoint = checkpointMission(mission);
  const savedPlacement = normalizeSoundSeekersState({
    ...mission.gameState,
    checkpoint: { ...mission.gameState.checkpoint, mission: placementCheckpoint }
  });
  const restoredPlacementPlan = createMissionPlan({
    stopId: "s16", state: savedPlacement, seed: 16, replayOrdinal: 0
  });
  const restoredPlacement = createMissionState(restoredPlacementPlan, savedPlacement.checkpoint.mission);
  assert.equal(restoredPlacement.attemptId, mission.attemptId);
  assert.notStrictEqual(restoredPlacement.challenge, oldPlacementChallenge);

  const storyState = createSoundSeekersState();
  const storyPlan = createMissionPlan({ stopId: "s1", state: storyState, seed: 1, replayOrdinal: 0 });
  const story = storyPlan.phases.find(item => item.kind === "story_transfer");
  mission = driveToPhase(storyPlan, story.id);
  const wrong = mission.challenge.optionTokens.find(token => token !== mission.challenge.expectedToken);
  mission = driveInputs(mission, powerInputsForToken(mission, wrong), {
    gameState: mission.gameState, at: "2026-09-03T07:30:00.000Z",
    sessionDay: "2026-09-03", audio: { status: "completed" }
  }).mission;
  const oldPresentation = mission.activity.presentation;
  const oldStoryChallenge = mission.challenge;
  const storyCheckpoint = checkpointMission(mission);
  const savedStory = normalizeSoundSeekersState({
    ...mission.gameState,
    checkpoint: { ...mission.gameState.checkpoint, mission: storyCheckpoint }
  });
  const restoredStoryPlan = createMissionPlan({ stopId: "s1", state: savedStory, seed: 1, replayOrdinal: 0 });
  const restoredStory = createMissionState(restoredStoryPlan, savedStory.checkpoint.mission);
  assert.equal(restoredStory.attemptId, mission.attemptId);
  assert.equal(restoredStory.activity.presentation.phase, "correction");
  assert.notStrictEqual(restoredStory.activity.presentation, oldPresentation);
  assert.notStrictEqual(restoredStory.challenge, oldStoryChallenge);
});

test("ordinary reload rederives correction and model state from exact canonical attempt evidence", () => {
  const gameState = createSoundSeekersState();
  const plan = createMissionPlan({ stopId: "s1", state: gameState, seed: 1, replayOrdinal: 0 });
  const ordinary = plan.phases.find(item => item.id === "s1-primary");
  let mission = driveToPhase(plan, ordinary.id);
  const wrong = mission.challenge.optionTokens.find(token => token !== mission.challenge.expectedToken);
  mission = driveInputs(mission, powerInputsForToken(mission, wrong), {
    gameState: mission.gameState,
    at: "2026-09-03T07:45:00.000Z",
    sessionDay: "2026-09-03",
    audio: { status: "completed" }
  }).mission;
  const checkpoint = checkpointMission(mission);
  assert.equal(checkpoint.activity.powerCheckpoint.correction, null);
  const saved = normalizeSoundSeekersState({
    ...mission.gameState,
    checkpoint: { ...mission.gameState.checkpoint, contentVersion: mission.gameState.contentVersion,
      mission: checkpoint }
  });
  assert.ok(saved.checkpoint, JSON.stringify(checkpoint));
  const restoredPlan = createMissionPlan({ stopId: "s1", state: saved, seed: 1, replayOrdinal: 0 });
  const restored = createMissionState(restoredPlan, saved.checkpoint.mission);
  assert.equal(restored.correctionState.missCount, 1);
  assert.equal(restored.activity.correction.supportLevel, 1);
  assert.equal(restored.modelPending, false);

  const forgedEvidence = saved.evidence.map((event, index) => index === saved.evidence.length - 1
    ? { ...event, supportLevel: 3 } : event);
  const forged = normalizeSoundSeekersState({ ...saved, evidence: forgedEvidence });
  const forgedPlan = createMissionPlan({ stopId: "s1", state: forged, seed: 1, replayOrdinal: 0 });
  assert.throws(() => createMissionState(forgedPlan, forged.checkpoint.mission), /correction evidence/u);
});

test("a story third miss blocks responses until one zero-evidence Task 2 model step", () => {
  const gameState = createSoundSeekersState();
  const plan = createMissionPlan({ stopId: "s1", state: gameState, seed: 1, replayOrdinal: 0 });
  const story = plan.phases.find(item => item.kind === "story_transfer");
  let mission = driveToPhase(plan, story.id);
  const context = {
    gameState: mission.gameState, at: "2026-09-03T08:00:00.000Z",
    sessionDay: "2026-09-03", audio: { status: "completed" }
  };
  const outcomes = [];
  for (let index = 0; index < 3; index += 1) {
    const wrong = mission.challenge.optionTokens.find(token => token !== mission.challenge.expectedToken);
    const driven = driveInputs(mission, powerInputsForToken(mission, wrong), context);
    const result = driven.result;
    outcomes.push(result.transition.outcome);
    mission = driven.mission;
  }
  assert.deepEqual(outcomes, ["retry", "retry", "model_required"]);
  assert.equal(mission.activity.status, "model_pending");
  assert.equal(mission.gameState.checkpoint.storyTransfer.stage, "model_pending");
  const eventCount = mission.gameState.evidence.length;
  const blocked = reduceMission(mission, { type: "read_text" }, context);
  assert.strictEqual(blocked.state, mission);
  const modeled = reduceMission(mission, { type: "complete_correction_model" }, context);
  assert.equal(modeled.state.activity.status, "active");
  assert.equal(modeled.state.gameState.evidence.length, eventCount);
  assert.equal(modeled.state.gameState.checkpoint.storyTransfer.attemptId, mission.attemptId);
  const correct = modeled.state.challenge.expectedToken;
  const completedDriven = driveInputs(modeled.state,
    powerInputsForToken(modeled.state, correct), context);
  const completed = completedDriven.result;
  assert.equal(completed.transition.outcome, "advance");
  assert.equal(completed.state.activity.presentation.phase, "action");
});

test("s38 morphology stays unscored and reveals its derivation only after the applied commit", () => {
  const initial = createSoundSeekersState();
  const gameState = normalizeSoundSeekersState({
    ...initial, trail: { ...initial.trail, journeyStep: 38 }
  });
  const plan = createMissionPlan({ stopId: "s38", state: gameState, seed: 38, replayOrdinal: 0 });
  const phase = plan.phases.find(item => item.placementId === "s38-morphology");
  let mission = driveToPhase(plan, phase.id);
  const beforeModel = projectCurrentWordWorkbenchModel(mission);
  assert.throws(() => issueWordWorkbenchAccess({ missionState: mission, model: beforeModel,
    transition: Object.freeze({}) }));
  const committed = reduceMission(mission, {
    type: "place_tile", tileId: "morphology-ending-tile"
  }, {
    gameState: mission.gameState,
    at: "2026-09-03T05:00:00.000Z",
    sessionDay: "2026-09-03",
    audio: { status: "unavailable" }
  });
  mission = committed.state;
  assert.equal(committed.transition.outcome, "advance");
  assert.equal(mission.phaseId, "s38-morphology");
  assert.equal(mission.gameState.evidence.length, 0);
  assert.equal(validContentDeckUses(mission.gameState, "morphology").length, 1);
  const model = projectCurrentWordWorkbenchModel(mission);
  const access = issueWordWorkbenchAccess({
    missionState: mission, model, transition: committed.transition
  });
  assert.deepEqual(projectWordWorkbenchAccess(access, model).morphology, {
    kind: "morphology_introduction", baseWord: "cat", ending: "s",
    derivedWord: "cats", meaning: "more than one"
  });
  mission = reduceMission(mission, { type: "complete_morphology_payoff" }, {
    gameState: mission.gameState
  }).state;
  assert.notEqual(mission.phaseId, "s38-morphology");
  assert.equal(projectWordWorkbenchAccess(access, model), null);
});

function correctPowerInputs(mission) {
  const challenge = mission.activity.powerChallenge || mission.challenge;
  return powerInputsForToken(mission, challenge.expectedToken);
}

function powerInputsForToken(mission, token) {
  const challenge = mission.activity.powerChallenge || mission.challenge;
  if (challenge.powerId === "echo_search") {
    const candidate = challenge.presentation.candidates.find(item => item.token === token);
    return [{ type: "probe", candidateId: candidate.id },
      { type: "confirm_candidate", candidateId: candidate.id }];
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
      ...challenge.presentation.segments.map(segment => ({ type: "activate_segment", segmentId: segment.id })),
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
  throw new Error(`unsupported power in route fixture: ${challenge.powerId}`);
}

test("all forty public missions complete two accumulating routes with exact deck and story totals", () => {
  let campaign = createSoundSeekersState();
  let clock = 0;
  const onboarding = new Set();
  let teachCount = 0;
  for (const route of [0, 1]) for (const expedition of SOUND_SEEKERS_EXPEDITIONS) {
    const plan = createMissionPlan({
      stopId: expedition.stopId,
      state: campaign,
      seed: expedition.stopIndex + route * 40,
      replayOrdinal: route
    });
    let mission = createMissionState(plan);
    let completion = null;
    for (let guard = 0; guard < 600 && !completion; guard += 1) {
      const phase = plan.phases[mission.phaseIndex];
      const context = {
        gameState: mission.gameState,
        at: new Date(Date.UTC(2026, 8, 3) + clock++ * 1000).toISOString(),
        sessionDay: "2026-09-03",
        audio: { status: "completed" }
      };
      const onboardingEvidenceCount = phase.kind === "power_onboarding"
        ? mission.gameState.evidence.length : null;
      const onboardingUseCount = phase.kind === "power_onboarding"
        ? ["heartWords", "stories", "alternatives", "morphology", "transfer"]
          .reduce((count, category) => count + validContentDeckUses(mission.gameState, category).length, 0)
        : null;
      let inputs;
      if (phase.kind === "teach") {
        if (mission.activity.sequence.currentItem) teachCount += 1;
        inputs = [completedTeachInput(mission.activity.sequence.currentItem, mission.activity.sequence)];
      } else if (phase.kind === "power_onboarding") {
        onboarding.add(phase.powerId);
        assert.equal(phase.consequenceFree, true);
        assert.equal(phase.recordsDomain, null);
        assert.equal(mission.activity.powerId, phase.powerId);
        assert.match(mission.activity.kind, /_state$/u);
        inputs = correctPowerInputs(mission);
      } else if (phase.kind === "challenge" || phase.kind === "content_opportunity") {
        inputs = correctPowerInputs(mission);
      } else if (phase.kind === "content_placement") {
        inputs = phase.category === "morphology"
          ? [{ type: "place_tile", tileId: "morphology-ending-tile" }]
          : correctPowerInputs(mission);
      } else if (phase.kind === "story_transfer") {
        inputs = mission.challenge
          ? correctPowerInputs(mission)
          : [{
            type: "choose_narrative_route",
            choiceId: mission.activity.childScene.choice.options[0].visualSemanticId
          }];
      } else {
        inputs = [{ type: `complete_${phase.kind}` }];
      }
      for (const input of inputs) {
        const reduced = reduceMission(mission, input, { ...context, gameState: mission.gameState });
        mission = reduced.state;
        completion = reduced.completion || completion;
      }
      if (onboardingEvidenceCount !== null) {
        assert.equal(mission.gameState.evidence.length, onboardingEvidenceCount);
        assert.equal(["heartWords", "stories", "alternatives", "morphology", "transfer"]
          .reduce((count, category) => count + validContentDeckUses(mission.gameState, category).length, 0),
        onboardingUseCount);
      }
      if (phase.kind === "content_placement" && phase.category === "morphology"
        && mission.phaseId === phase.id && mission.activity.status === "awaiting_mission_commit") {
        mission = reduceMission(mission, { type: "complete_morphology_payoff" }, {
          ...context, gameState: mission.gameState
        }).state;
      }
      if (phase.kind === "story_transfer" && mission.phaseId === phase.id
        && mission.activity.presentation.phase === "action") {
        mission = reduceMission(mission, { type: "action_completed" }, {
          ...context, gameState: mission.gameState
        }).state;
        const semantic = resolveSceneVisualSemantic(mission.presentationTransition.postDecisionSemanticId);
        mission = reduceMission(mission, {
          type: "meaning_requested", meaningSemanticId: semantic.meaningSemanticIds[0]
        }, { ...context, gameState: mission.gameState }).state;
        const left = reduceMission(mission, { type: "complete_story_transfer" }, {
          ...context, gameState: mission.gameState
        });
        mission = left.state;
        completion = left.completion || completion;
      }
    }
    assert.ok(completion, `${expedition.stopId} did not complete at ${mission.phaseId}:${mission.activity?.status}:${mission.challenge?.targetId}`);
    campaign = completeMission(mission.gameState, completion).nextState;
    if (expedition.stopId === "s40") {
      assert.equal(campaign.trail.routeCursor, 1);
      assert.equal(campaign.trail.journeyStep, route === 0 ? 41 : 81);
    }
  }
  assert.equal(teachCount, 103);
  assert.deepEqual([...onboarding].sort(), [
    "blend_bridge", "contrast_sort", "echo_search", "memory_delivery", "story_power", "word_forge"
  ]);
  assert.equal(validContentDeckUses(campaign, "heartWords").length, 162);
  assert.equal(validContentDeckUses(campaign, "stories").length, 80);
  assert.equal(validContentDeckUses(campaign, "transfer").length, 80);
  assert.equal(validContentDeckUses(campaign, "alternatives").length, 8);
  assert.equal(validContentDeckUses(campaign, "morphology").length, 2);
  assert.equal(campaign.evidence.filter(event => event.domain === "connected_text_transfer").length, 64);
  assert.equal(campaign.evidence.filter(event => event.domain === "novel_decoding").length, 16);
  assert.equal(campaign.trail.journeyStep, 81);
});

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { CONTENT_DECK_PLACEMENTS, getContentDeckPlacements } from "../../src/features/soundSeekers/content/contentDeckBindings.js";
import { SOUND_SEEKERS_EXPEDITIONS } from "../../src/features/soundSeekers/content/expeditions.js";
import { createMissionPlan } from "../../src/features/soundSeekers/engine/createMissionPlan.js";
import {
  checkpointMission,
  closeCurrentMissionPresentation,
  createMissionState,
  projectCurrentMissionSceneModel,
  reduceMission,
  validateCurrentMissionTransition
} from "../../src/features/soundSeekers/engine/missionReducer.js";
import * as missionReducerModule from "../../src/features/soundSeekers/engine/missionReducer.js";
import * as missionCommitModule from "../../src/features/soundSeekers/engine/missionResponseCommit.js";
import {
  issueWordWorkbenchAccess,
  projectCurrentWordWorkbenchModel,
  projectWordWorkbenchAccess
} from "../../src/features/soundSeekers/engine/workbenchAccess.js";
import * as workbenchAccessModule from "../../src/features/soundSeekers/engine/workbenchAccess.js";
import { echoSearch } from "../../src/features/soundSeekers/engine/powers/index.js";
import { getPronunciation } from "../../src/features/soundSeekers/content/pronunciationLexicon.js";
import { getInstructionContract } from "../../src/features/soundSeekers/content/instructionContracts.js";
import { createSoundSeekersState, normalizeSoundSeekersState } from "../../src/features/soundSeekers/engine/stateV2.js";
import { createSoundSeekersAudioController } from "../../src/features/soundSeekers/runtime/soundSeekersAudioController.js";
import { installSoundSeekersProductionAudioDouble } from "../helpers/soundSeekersProductionAudioDouble.js";

installSoundSeekersProductionAudioDouble();

function recursivelyFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.values(value).forEach(recursivelyFreeze);
  return Object.freeze(value);
}

function completedTeachInput(mission) {
  const item = mission.activity.sequence.currentItem;
  const audioAuthority = {
    scopeKey: "mission-reducer-test",
    missionId: mission.plan.id,
    phaseId: mission.phaseId,
    attemptId: mission.attemptId
  };
  const controller = createSoundSeekersAudioController({
    scopeKey: audioAuthority.scopeKey,
    clock: () => 0
  });
  const audioKeys = [...new Set([item.childAudio, item.targetAudio, ...item.targetAudioSequence,
    ...item.targetAudioAlternates.map(alternate => alternate.targetAudio)].filter(Boolean))];
  const audioDeliveries = audioKeys.map((audioKey, ordinal) => {
    controller.request({ cueId: `teach:${item.stopId}:${item.teachIndex}:${item.targetId}:${ordinal}`,
      audioKey, visibleText: item.childText, spokenText: item.childText,
      kind: "teach", requiresAudio: true }, audioAuthority);
    return controller.getSnapshot().delivery;
  });
  return {
    input: { type: "complete-teach", teachIndex: item.teachIndex, targetId: item.targetId, audioDeliveries },
    audioAuthority
  };
}

function completeCurrentTeach(mission, gameState = mission.gameState) {
  const completed = completedTeachInput(mission);
  return reduceMission(mission, completed.input, {
    gameState,
    audioAuthority: completed.audioAuthority
  }).state;
}

function authorizedMissionAudio(mission) {
  if (mission.challenge?.requiresAudio === false) {
    return { audio: { status: "completed" } };
  }
  const contract = getInstructionContract(mission.challenge.instructionId);
  const audioAuthority = {
    scopeKey: "mission-scored-test",
    missionId: mission.plan.id,
    phaseId: mission.phaseId,
    attemptId: mission.attemptId
  };
  const controller = createSoundSeekersAudioController({
    scopeKey: audioAuthority.scopeKey,
    clock: () => 0
  });
  controller.request({
    cueId: `instruction:${contract.instructionId}`,
    audioKey: contract.childAudio,
    visibleText: contract.childText,
    spokenText: contract.childText,
    kind: "instruction",
    requiresAudio: true
  }, audioAuthority);
  return { audio: controller.getSnapshot().delivery, audioAuthority };
}

function finishEchoOnboarding(mission, gameState) {
  const candidate = mission.challenge.presentation.candidates
    .find(item => item.token === mission.challenge.expectedToken);
  mission = reduceMission(mission, { type: "probe", candidateId: candidate.id }, { gameState }).state;
  return reduceMission(mission, { type: "confirm_candidate", candidateId: candidate.id }, { gameState }).state;
}

function driveToPhase(plan, phaseId) {
  let mission = createMissionState(plan);
  for (let guard = 0; guard < 100 && mission.phaseId !== phaseId; guard += 1) {
    const phase = plan.phases[mission.phaseIndex];
    if (phase.kind === "arrival" || phase.kind === "wonder" || phase.kind === "payoff") {
      mission = reduceMission(mission, { type: `complete_${phase.kind}` }, {
        gameState: mission.gameState
      }).state;
    } else if (phase.kind === "teach") {
      mission = completeCurrentTeach(mission);
    } else if (["power_onboarding", "challenge", "content_opportunity"].includes(phase.kind)) {
      const challenge = mission.activity.powerChallenge || mission.challenge;
      let inputs;
      if (challenge.powerId === "word_forge") {
        const tile = challenge.presentation.rack.find(item => item.token === challenge.expectedToken);
        inputs = [{ type: "place_tile", tileId: tile.id }];
      } else if (challenge.powerId === "echo_search") {
        const candidate = challenge.presentation.candidates
          .find(item => item.token === challenge.expectedToken);
        inputs = [{ type: "probe", candidateId: candidate.id },
          { type: "confirm_candidate", candidateId: candidate.id }];
      } else if (challenge.powerId === "memory_delivery") {
        const recipient = challenge.presentation.recipients.find(item => item.token === challenge.expectedToken);
        inputs = [{ type: "receive_cue" }, { type: "move", dx: 1, dy: 0 },
          { type: "arrive" }, { type: challenge.expectedAction, recipientId: recipient.id }];
      } else if (challenge.powerId === "story_power") {
        const choice = challenge.presentation.choices.find(item => item.token === challenge.expectedToken);
        inputs = [{ type: "read_text" }, {
          type: challenge.expectedAction,
          choiceId: choice.id,
          token: choice.token
        }];
      } else throw new Error(`unsupported power ${challenge.powerId}`);
      for (const input of inputs) mission = reduceMission(mission, input, {
        gameState: mission.gameState,
        at: "2026-09-03T00:00:00.000Z",
        sessionDay: "2026-09-03",
        ...authorizedMissionAudio(mission)
      }).state;
    } else throw new Error(`unsupported pre-target phase ${phase.id}`);
  }
  assert.equal(mission.phaseId, phaseId);
  return mission;
}

test("mission plans preserve the expedition and insert every canonical learning opportunity", () => {
  const onboardingPowers = new Set();
  const placementIds = [];
  for (const expedition of SOUND_SEEKERS_EXPEDITIONS) {
    const plan = createMissionPlan({
      stopId: expedition.stopId,
      state: createSoundSeekersState(),
      seed: expedition.stopIndex,
      replayOrdinal: 0
    });
    assert.equal(Object.isFrozen(plan), true);
    assert.equal(plan.stopId, expedition.stopId);
    assert.equal(plan.phases.filter(phase => phase.kind === "story_transfer").length, 1);
    assert.equal(plan.phases.find(phase => phase.kind === "story_transfer").id,
      `${expedition.stopId}-transfer`);
    assert.deepEqual(
      plan.phases.filter(phase => !["power_onboarding", "content_opportunity", "content_placement"].includes(phase.kind))
        .map(phase => [phase.id, phase.kind === "story_transfer" ? "transfer" : phase.kind, phase.recordsDomain]),
      expedition.phases.map(phase => [phase.id, phase.kind, phase.recordsDomain])
    );
    assert.deepEqual(
      plan.phases.filter(phase => phase.kind === "content_opportunity").map(phase => phase.id),
      expedition.heartWordOpportunities.map(item => item.id)
    );
    assert.deepEqual(
      plan.phases.filter(phase => phase.kind === "content_placement").map(phase => phase.placementId),
      getContentDeckPlacements(expedition.stopId).map(item => item.placementId)
    );
    for (const phase of plan.phases.filter(item => item.kind === "power_onboarding")) {
      const next = plan.phases[plan.phases.indexOf(phase) + 1];
      assert.equal(next.id, phase.ownerActionId);
      assert.equal(next.powerId, phase.powerId);
      onboardingPowers.add(phase.powerId);
    }
    placementIds.push(...plan.phases.filter(phase => phase.kind === "content_placement")
      .map(phase => phase.placementId));
  }
  assert.deepEqual([...onboardingPowers].sort(), [
    "blend_bridge", "contrast_sort", "echo_search", "memory_delivery", "story_power", "word_forge"
  ]);
  assert.deepEqual(placementIds, CONTENT_DECK_PLACEMENTS.map(item => item.placementId));
});

test("mission checkpoint persistence strips every unknown and privileged field", () => {
  const base = createSoundSeekersState();
  const mission = {
    schemaVersion: 1,
    kind: "sound_seekers_mission",
    contentVersion: base.contentVersion,
    missionId: "mission:1:s1:0:1",
    stopId: "s1",
    journeyStep: 1,
    attemptId: "mission:1:s1:0:1:s1-arrival:attempt:0",
    attemptOrdinal: 0,
    missionRevision: 0,
    seed: 1,
    replayOrdinal: 0,
    phaseId: "s1-arrival",
    completedPhaseIds: [],
    responseEvidence: [],
    teach: { teachIndex: 0, teachTargetId: null, answer: "forged" },
    nextDecisionOrdinal: 0,
    activity: { kind: "arrival", actionId: "s1-arrival", challengeId: null, powerCheckpoint: null },
    activeContent: null,
    connectedTextPresentation: null,
    expectedToken: "forged"
  };
  const normalized = normalizeSoundSeekersState({
    ...base,
    checkpoint: { contentVersion: base.contentVersion, mission }
  });
  assert.equal(normalized.checkpoint.mission, undefined);

  delete mission.expectedToken;
  delete mission.teach.answer;
  delete mission.responseEvidence;
  const accepted = normalizeSoundSeekersState({
    ...base,
    checkpoint: { contentVersion: base.contentVersion, mission }
  });
  assert.deepEqual(accepted.checkpoint.mission, mission);
});

test("a persisted completed scored phase safely replays without answer-derived authority", () => {
  const gameState = createSoundSeekersState();
  const plan = createMissionPlan({ stopId: "s1", state: gameState, seed: 1, replayOrdinal: 0 });
  const phase = plan.phases.find(item => item.id === "s1-primary");
  let mission = driveToPhase(plan, phase.id);
  const candidate = mission.challenge.presentation.candidates
    .find(item => item.token === mission.challenge.expectedToken);
  mission = reduceMission(mission, { type: "probe", candidateId: candidate.id }, {
    gameState: mission.gameState
  }).state;
  const committed = reduceMission(mission, { type: "confirm_candidate", candidateId: candidate.id }, {
    gameState: mission.gameState,
    at: "2026-09-03T03:00:00.000Z",
    sessionDay: "2026-09-03",
    audio: { status: "completed" }
  });
  const checkpoint = checkpointMission(committed.state);
  const persistedState = normalizeSoundSeekersState({
    ...committed.state.gameState,
    checkpoint: {
      ...committed.state.gameState.checkpoint,
      contentVersion: committed.state.gameState.contentVersion,
      mission: checkpoint
    }
  });
  const resumedPlan = createMissionPlan({
    stopId: "s1", state: persistedState, seed: 1, replayOrdinal: 0
  });
  const resumed = createMissionState(resumedPlan, persistedState.checkpoint.mission);
  assert.equal(resumed.phaseId, phase.id);
  assert.equal(resumed.attemptOrdinal, 0);
  assert.equal(resumed.modelPending, false);
  assert.equal(resumed.gameState.evidence.some(event => event.journeyStep === plan.journeyStep), false);
  assert.equal(Object.hasOwn(checkpoint, "responseEvidence"), false);
});

test("completed curriculum suppresses only onboarding that has genuinely run", () => {
  const initial = createSoundSeekersState();
  const state = {
    ...initial,
    trail: { ...initial.trail, completedStopIds: ["s1"] }
  };
  const plan = createMissionPlan({ stopId: "s2", state, seed: 2, replayOrdinal: 0 });
  const introduced = new Set(SOUND_SEEKERS_EXPEDITIONS[0].phases.filter(item => item.powerId)
    .map(item => item.powerId));
  for (const phase of plan.phases.filter(item => item.kind === "power_onboarding")) {
    assert.equal(introduced.has(phase.powerId), false);
  }
});

test("an ordinary response commits once, advances, and exposes only an applied transition", () => {
  const gameState = createSoundSeekersState();
  const plan = createMissionPlan({ stopId: "s1", state: gameState, seed: 1, replayOrdinal: 0 });
  let mission = createMissionState(plan);
  mission = reduceMission(mission, { type: "complete_arrival" }, { gameState }).state;
  while (mission.phaseId === "s1-teach") {
    mission = completeCurrentTeach(mission, gameState);
  }
  assert.equal(mission.activity.onboarding, true);
  mission = finishEchoOnboarding(mission, gameState);
  const answerCandidate = mission.challenge.presentation.candidates
    .find(candidate => candidate.token === mission.challenge.expectedToken);
  mission = reduceMission(mission, { type: "probe", candidateId: answerCandidate.id }, { gameState }).state;
  const committed = reduceMission(mission, {
    type: "confirm_candidate", candidateId: answerCandidate.id
  }, {
    gameState: mission.gameState,
    at: "2026-09-03T00:00:00.000Z",
    sessionDay: "2026-09-03",
    audio: { status: "completed" }
  });
  assert.equal(committed.transition.outcome, "advance");
  assert.equal(committed.responseIntents.length, 0);
  assert.equal(committed.state.phaseId, "s1-heart-1-onboarding");
  assert.equal(validateCurrentMissionTransition(committed.transition, {
    missionId: plan.id,
    phaseId: "s1-primary",
    revision: committed.state.missionRevision
  }), true);
  assert.equal(validateCurrentMissionTransition({ ...committed.transition }, {
    missionId: plan.id, revision: committed.state.missionRevision
  }), false);
  const committedCheckpoint = checkpointMission(committed.state);
  assert.equal(committedCheckpoint.phaseId, "s1-heart-1-onboarding");
  assert.equal(Object.hasOwn(committedCheckpoint, "responseEvidence"), false);
  const recipient = committed.state.challenge.presentation.recipients[0];
  const changed = reduceMission(committed.state, { type: "receive_cue" }, {
    gameState: committed.state.gameState
  });
  assert.notStrictEqual(changed.state, committed.state);
  assert.equal(validateCurrentMissionTransition(committed.transition, {
    missionId: plan.id,
    phaseId: "s1-primary",
    revision: committed.state.missionRevision
  }), false, "an applied transition becomes stale when its final mission revision is no longer current");
  void recipient;
});

test("required scored mission audio rejects literals and consumes one exact bound delivery", () => {
  const reachPlacement = seed => {
    const gameState = createSoundSeekersState();
    const plan = createMissionPlan({ stopId: "s16", state: gameState, seed, replayOrdinal: 0 });
    return driveToPhase(plan, "s16-alternative");
  };
  const answer = mission => {
    const itemId = mission.activity.items[0].id;
    const bin = mission.challenge.presentation.bins
      .find(candidate => candidate.token === mission.challenge.expectedToken);
    return { type: mission.challenge.expectedAction, itemId, binId: bin.id };
  };

  const literalMission = reachPlacement(16);
  assert.throws(() => reduceMission(literalMission, answer(literalMission), {
    gameState: literalMission.gameState,
    at: "2026-09-03T05:00:00.000Z",
    sessionDay: "2026-09-03",
    audio: Object.freeze({ status: "completed" })
  }), /audio|evidence/u);

  const authorizedMission = reachPlacement(17);
  const authority = authorizedMissionAudio(authorizedMission);
  const advanced = reduceMission(authorizedMission, answer(authorizedMission), {
    gameState: authorizedMission.gameState,
    at: "2026-09-03T05:00:00.000Z",
    sessionDay: "2026-09-03",
    ...authority
  });
  assert.equal(advanced.transition.outcome, "continue");
  assert.throws(() => reduceMission(authorizedMission, answer(authorizedMission), {
    gameState: authorizedMission.gameState,
    at: "2026-09-03T05:00:00.000Z",
    sessionDay: "2026-09-03",
    ...authority
  }), /current|stale|consumed/u);
});

test("the current mission scene projection is child-safe, assisted, and canonically targeted", () => {
  const gameState = createSoundSeekersState();
  const plan = createMissionPlan({ stopId: "s1", state: gameState, seed: 1, replayOrdinal: 0 });
  let mission = createMissionState(plan);
  mission = reduceMission(mission, { type: "complete_arrival" }, { gameState }).state;
  while (mission.phaseId === "s1-teach") {
    mission = completeCurrentTeach(mission);
  }
  mission = finishEchoOnboarding(mission, gameState);
  const model = projectCurrentMissionSceneModel(mission, { largerTargets: true });
  assert.equal(Object.isFrozen(model), true);
  assert.equal(model.kind, "sound_seekers_mission_scene_model");
  assert.equal(model.contactTargetId, null);
  assert.equal(model.activity.motor.targetScale, "large");
  const serialized = JSON.stringify(model);
  for (const forbidden of ["expectedToken", "optionTokens", "candidateTokens", "evidence",
    "responseIntents", "narrativeChoiceToken", "token\""]) {
    assert.equal(serialized.includes(forbidden), false, forbidden);
  }
  const candidate = mission.challenge.presentation.candidates[0];
  const changed = reduceMission(mission, { type: "probe", candidateId: candidate.id }, {
    gameState: mission.gameState
  }).state;
  assert.notStrictEqual(changed, mission);
  assert.throws(() => projectCurrentMissionSceneModel(mission), /current|stale/u);
});

test("mission commits reject frozen literal state, caller authority, and public candidate access", () => {
  const gameState = createSoundSeekersState();
  const plan = createMissionPlan({ stopId: "s1", state: gameState, seed: 1, replayOrdinal: 0 });
  let mission = createMissionState(plan);
  mission = reduceMission(mission, { type: "complete_arrival" }, { gameState }).state;
  while (mission.phaseId === "s1-teach") {
    mission = completeCurrentTeach(mission, gameState);
  }
  mission = finishEchoOnboarding(mission, gameState);
  const candidate = mission.challenge.presentation.candidates
    .find(item => item.token === mission.challenge.expectedToken);
  const probed = echoSearch.reduce(mission.activity, { type: "probe", candidateId: candidate.id }, {
    challenge: mission.challenge
  });
  const answered = echoSearch.reduce(probed.state, {
    type: "confirm_candidate", candidateId: candidate.id
  }, { challenge: mission.challenge });
  const forgedState = recursivelyFreeze({ ...mission, activity: answered.state });
  const commitContext = recursivelyFreeze({
    challenge: mission.challenge,
    gameState: mission.gameState,
    at: "2026-09-03T00:00:00.000Z",
    sessionDay: "2026-09-03",
    audio: { status: "completed" }
  });
  void forgedState;
  void commitContext;
  assert.deepEqual(Object.keys(missionCommitModule), [], "the commit module exposes no authority factory");
  assert.deepEqual(Object.keys(missionReducerModule).sort(), [
    "checkpointMission", "closeCurrentMissionPresentation", "completeMission", "createMissionState", "currentMissionOwnsPowerPair",
    "exactCurrentMissionPowerBinding", "issueWordWorkbenchAccess", "projectCurrentMissionSceneModel",
    "projectCurrentWordWorkbenchModel", "projectWordWorkbenchAccess", "reduceMission",
    "validateCurrentMissionTransition"
  ]);
  assert.equal(Object.hasOwn(missionReducerModule, "projectMissionWorkbenchAuthority"), false);
  assert.deepEqual(Object.keys(workbenchAccessModule).sort(), [
    "issueWordWorkbenchAccess", "projectCurrentWordWorkbenchModel", "projectWordWorkbenchAccess"
  ]);

  assert.throws(() => reduceMission(mission, { type: "probe", candidateId: candidate.id }, {
    gameState, correct: true
  }), /caller|context|authority|unknown/i);
  assert.throws(() => reduceMission(mission, { type: "probe", candidateId: candidate.id }, {
    gameState, assists: { largerTargets: true, answer: true }
  }), /assist|unknown|context/u);
});

test("a Word Forge miss reissues a fresh attempt and only its exact current view gets correction access", () => {
  const gameState = createSoundSeekersState();
  const plan = createMissionPlan({ stopId: "s3", state: gameState, seed: 3, replayOrdinal: 0 });
  const action = plan.phases.find(item => item.powerId === "word_forge" && item.kind === "challenge");
  let mission = driveToPhase(plan, action.id);
  const staleModel = projectCurrentWordWorkbenchModel(mission);
  const wrongTile = mission.challenge.presentation.rack
    .find(tile => tile.token !== mission.challenge.expectedToken);
  const committed = reduceMission(mission, { type: "place_tile", tileId: wrongTile.id }, {
    gameState: mission.gameState,
    at: "2026-09-03T02:00:00.000Z",
    sessionDay: "2026-09-03",
    audio: { status: "completed" }
  });
  mission = committed.state;
  assert.equal(committed.transition.outcome, "retry");
  assert.equal(mission.attemptOrdinal, 1);
  const currentModel = projectCurrentWordWorkbenchModel(mission);
  assert.throws(() => issueWordWorkbenchAccess({
    missionState: mission,
    model: recursivelyFreeze(structuredClone(currentModel)),
    pronunciation: getPronunciation(action.wordId),
    transition: committed.transition
  }), /exact final current mission child view/u);
  assert.equal(Object.hasOwn(workbenchAccessModule, "registerCurrentWorkbenchMissionState"), false);
  assert.equal(Object.hasOwn(workbenchAccessModule, "registerWordWorkbenchModel"), false);
  const access = issueWordWorkbenchAccess({
    missionState: mission,
    model: currentModel,
    pronunciation: getPronunciation(action.wordId),
    transition: committed.transition
  });
  assert.equal(projectWordWorkbenchAccess(access, currentModel).correctionPresentation.visibleText,
    projectWordWorkbenchAccess(access, currentModel).correctionPresentation.spokenText);
  assert.equal(projectWordWorkbenchAccess(access, staleModel), null);
  assert.throws(() => issueWordWorkbenchAccess({
    missionState: mission, model: currentModel,
    pronunciation: getPronunciation("ship"), transition: committed.transition
  }));
});

test("an ordinary third miss creates one fresh model-only attempt before a supported answer", () => {
  const gameState = createSoundSeekersState();
  const plan = createMissionPlan({ stopId: "s3", state: gameState, seed: 3, replayOrdinal: 0 });
  const action = plan.phases.find(item => item.powerId === "word_forge" && item.kind === "challenge");
  let mission = driveToPhase(plan, action.id);
  const context = {
    gameState,
    at: "2026-09-03T06:00:00.000Z",
    sessionDay: "2026-09-03",
    audio: { status: "completed" }
  };
  const outcomes = [];
  const supportLevels = [];
  for (let miss = 0; miss < 3; miss += 1) {
    const wrong = mission.challenge.presentation.rack.find(tile => tile.token !== mission.challenge.expectedToken);
    const result = reduceMission(mission, { type: "place_tile", tileId: wrong.id }, {
      ...context, gameState: mission.gameState
    });
    outcomes.push(result.transition.outcome);
    supportLevels.push(result.transition.supportLevel);
    mission = result.state;
  }
  assert.deepEqual(outcomes, ["retry", "retry", "model_required"]);
  assert.deepEqual(supportLevels, [1, 2, 3]);
  assert.equal(mission.attemptOrdinal, 3);
  assert.equal(mission.modelPending, true);
  const correct = mission.challenge.presentation.rack.find(tile => tile.token === mission.challenge.expectedToken);
  assert.strictEqual(reduceMission(mission, { type: "place_tile", tileId: correct.id }, context).state, mission);
  const savedMission = checkpointMission(mission);
  const savedState = normalizeSoundSeekersState({
    ...mission.gameState,
    checkpoint: { contentVersion: mission.gameState.contentVersion, mission: savedMission }
  });
  const modeled = reduceMission(mission, { type: "complete_correction_model" }, context);
  assert.equal(modeled.state.modelPending, false);
  assert.equal(modeled.state.attemptId, mission.attemptId);
  const modeledCheckpoint = checkpointMission(modeled.state);
  assert.equal(modeledCheckpoint.activity.powerCheckpoint.correction, null);
  const modeledSave = normalizeSoundSeekersState({
    ...modeled.state.gameState,
    checkpoint: { contentVersion: modeled.state.gameState.contentVersion, mission: modeledCheckpoint }
  });
  const restoredPlan = createMissionPlan({ stopId: "s3", state: savedState, seed: 3, replayOrdinal: 0 });
  const safeReplay = createMissionState(restoredPlan, savedState.checkpoint.mission);
  assert.equal(safeReplay.phaseId, plan.phases.find(item => item.recordsDomain).id);
  assert.equal(safeReplay.modelPending, false);
  assert.equal(safeReplay.attemptOrdinal, 0);
  assert.equal(safeReplay.gameState.evidence.some(event => event.journeyStep === plan.journeyStep), false);
  const modeledPlan = createMissionPlan({ stopId: "s3", state: modeledSave, seed: 3, replayOrdinal: 0 });
  const failClosedReload = createMissionState(modeledPlan, modeledSave.checkpoint.mission);
  assert.equal(failClosedReload.modelPending, false,
    "a model consumed before saving never repeats after reload");
  assert.equal(failClosedReload.attemptOrdinal, 0);
});

test("checkpoint reload restarts a fresh earliest scored power authority", () => {
  const gameState = createSoundSeekersState();
  const plan = createMissionPlan({ stopId: "s3", state: gameState, seed: 3, replayOrdinal: 0 });
  const action = plan.phases.find(item => item.powerId === "word_forge" && item.kind === "challenge");
  const mission = driveToPhase(plan, action.id);
  const oldModel = projectCurrentWordWorkbenchModel(mission);
  const savedMission = checkpointMission(mission);
  const savedState = normalizeSoundSeekersState({
    ...mission.gameState,
    checkpoint: { contentVersion: mission.gameState.contentVersion, mission: savedMission }
  });
  const restoredPlan = createMissionPlan({ stopId: "s3", state: savedState, seed: 3, replayOrdinal: 0 });
  assert.throws(() => createMissionState(restoredPlan, recursivelyFreeze(structuredClone(savedState.checkpoint.mission))),
    /exact normalized current checkpoint/u);
  const restored = createMissionState(restoredPlan, savedState.checkpoint.mission);
  assert.notStrictEqual(restored.activity, mission.activity);
  assert.notStrictEqual(restored.challenge, mission.challenge);
  assert.equal(restored.phaseId, plan.phases.find(item => item.recordsDomain).id);
  assert.equal(restored.attemptOrdinal, 0);
  assert.equal(restored.modelPending, false);
  assert.throws(() => issueWordWorkbenchAccess({
    missionState: restored,
    model: oldModel,
    pronunciation: getPronunciation(action.wordId)
  }));
  const checkpointMutations = [
    checkpoint => { checkpoint.activity.powerCheckpoint.rack[0].selected = true; },
    checkpoint => { checkpoint.activity.powerCheckpoint.slots[0].token = "private"; },
    checkpoint => { checkpoint.activity.powerCheckpoint.correction = { mode: "caller" }; },
    checkpoint => {
      checkpoint.activity.powerCheckpoint.revision = 1;
      checkpoint.activity.powerCheckpoint.semanticSteps = [{ type: "place_tile" }];
    },
    checkpoint => { checkpoint.responseEvidence = []; },
    checkpoint => { checkpoint.completedPhaseIds.push(checkpoint.completedPhaseIds[0]); }
  ];
  for (const mutate of checkpointMutations) {
    const changed = structuredClone(savedMission);
    mutate(changed);
    const normalized = normalizeSoundSeekersState({
      ...mission.gameState,
      checkpoint: { contentVersion: mission.gameState.contentVersion, mission: changed }
    });
    assert.equal(normalized.checkpoint.mission, undefined);
  }
  const forgedMission = structuredClone(savedMission);
  forgedMission.activity.powerCheckpoint.correction = { answer: "ship" };
  const rejected = normalizeSoundSeekersState({
    ...gameState,
    checkpoint: { contentVersion: gameState.contentVersion, mission: forgedMission }
  });
  assert.equal(rejected.checkpoint.mission, undefined);
});

test("route cleanup closes only the exact current connected-text presentation once", () => {
  const gameState = createSoundSeekersState();
  const plan = createMissionPlan({ stopId: "s1", state: gameState, seed: 41, replayOrdinal: 0 });
  const mission = driveToPhase(plan, "s1-transfer");
  assert.equal(closeCurrentMissionPresentation(mission), true);
  assert.equal(closeCurrentMissionPresentation(mission), false);
  assert.equal(closeCurrentMissionPresentation, missionReducerModule.closeCurrentMissionPresentation);
  assert.throws(() => closeCurrentMissionPresentation(
    recursivelyFreeze(structuredClone(mission))
  ), /exact current revision/u);
});

test("mission response ownership stays acyclic and outside every power reducer", () => {
  const engineRoot = new URL("../../src/features/soundSeekers/engine/", import.meta.url);
  const responseSource = fs.readFileSync(new URL("missionResponseCommit.js", engineRoot), "utf8");
  const reducerSource = fs.readFileSync(new URL("missionReducer.js", engineRoot), "utf8");
  assert.equal(responseSource.includes("./powers/"), false);
  assert.match(reducerSource, /commitMissionResponse\(/u);
  for (const name of [
    "echoSearch.js", "contrastSort.js", "wordForge.js", "blendBridge.js",
    "memoryDelivery.js", "storyPower.js"
  ]) {
    const source = fs.readFileSync(new URL(`powers/${name}`, engineRoot), "utf8");
    assert.equal(source.includes("commitMissionResponse"), false);
    assert.equal(source.includes("appendEvidence"), false);
    assert.equal(source.includes("recordContentDeckUse"), false);
    assert.equal(source.includes("commitContentPlacementResponse"), false);
    assert.equal(source.includes("completeStoryTransferTransaction"), false);
  }
});

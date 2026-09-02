import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { CONTENT_DECK_PLACEMENTS, getContentDeckPlacements } from "../../src/features/soundSeekers/content/contentDeckBindings.js";
import { SOUND_SEEKERS_EXPEDITIONS } from "../../src/features/soundSeekers/content/expeditions.js";
import { createMissionPlan } from "../../src/features/soundSeekers/engine/createMissionPlan.js";
import {
  checkpointMission,
  createMissionState,
  reduceMission
} from "../../src/features/soundSeekers/engine/missionReducer.js";
import { validateCurrentMissionTransition } from "../../src/features/soundSeekers/engine/missionResponseCommit.js";
import { issueWordWorkbenchAccess, projectWordWorkbenchAccess } from "../../src/features/soundSeekers/engine/workbenchAccess.js";
import { wordForge } from "../../src/features/soundSeekers/engine/powers/index.js";
import { getPronunciation } from "../../src/features/soundSeekers/content/pronunciationLexicon.js";
import { createSoundSeekersState, normalizeSoundSeekersState } from "../../src/features/soundSeekers/engine/stateV2.js";

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
  const accepted = normalizeSoundSeekersState({
    ...base,
    checkpoint: { contentVersion: base.contentVersion, mission }
  });
  assert.deepEqual(accepted.checkpoint.mission, mission);
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
    mission = reduceMission(mission, { type: "complete-teach" }, { gameState }).state;
  }
  assert.equal(mission.activity.kind, "power_onboarding");
  mission = reduceMission(mission, { type: "complete_onboarding" }, { gameState }).state;
  const answerCandidate = mission.challenge.presentation.candidates
    .find(candidate => candidate.token === mission.challenge.expectedToken);
  mission = reduceMission(mission, { type: "probe", candidateId: answerCandidate.id }, { gameState }).state;
  const committed = reduceMission(mission, {
    type: "confirm_candidate", candidateId: answerCandidate.id
  }, {
    gameState,
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
  assert.equal(checkpointMission(committed.state).phaseId, "s1-heart-1-onboarding");
});

test("a Word Forge miss reissues a fresh attempt and only its exact current view gets correction access", () => {
  const gameState = createSoundSeekersState();
  const plan = createMissionPlan({ stopId: "s3", state: gameState, seed: 3, replayOrdinal: 0 });
  const action = plan.phases.find(item => item.powerId === "word_forge" && item.kind === "challenge");
  let mission = createMissionState(plan, {
    kind: "sound_seekers_mission", missionId: plan.id, contentVersion: plan.contentVersion,
    stopId: plan.stopId, journeyStep: plan.journeyStep, phaseId: action.id,
    completedPhaseIds: [], missionRevision: 4, attemptOrdinal: 0,
    attemptId: `${plan.id}:${action.id}:attempt:0`, nextDecisionOrdinal: 0
  });
  const staleModel = wordForge.view(mission.activity, mission.challenge);
  const wrongTile = mission.challenge.presentation.rack
    .find(tile => tile.token !== mission.challenge.expectedToken);
  const committed = reduceMission(mission, { type: "place_tile", tileId: wrongTile.id }, {
    gameState,
    at: "2026-09-03T02:00:00.000Z",
    sessionDay: "2026-09-03",
    audio: { status: "completed" }
  });
  mission = committed.state;
  assert.equal(committed.transition.outcome, "retry");
  assert.equal(mission.attemptOrdinal, 1);
  const currentModel = wordForge.view(mission.activity, mission.challenge);
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
  let mission = createMissionState(plan, {
    kind: "sound_seekers_mission", missionId: plan.id, contentVersion: plan.contentVersion,
    stopId: plan.stopId, journeyStep: plan.journeyStep, phaseId: action.id,
    completedPhaseIds: [], missionRevision: 4, attemptOrdinal: 0,
    attemptId: `${plan.id}:${action.id}:attempt:0`, nextDecisionOrdinal: 0
  });
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
  const evidenceCount = mission.gameState.evidence.length;
  const correct = mission.challenge.presentation.rack.find(tile => tile.token === mission.challenge.expectedToken);
  assert.strictEqual(reduceMission(mission, { type: "place_tile", tileId: correct.id }, context).state, mission);
  const savedMission = checkpointMission(mission);
  const savedState = normalizeSoundSeekersState({
    ...mission.gameState,
    checkpoint: { contentVersion: mission.gameState.contentVersion, mission: savedMission }
  });
  const restoredPlan = createMissionPlan({ stopId: "s3", state: savedState, seed: 3, replayOrdinal: 0 });
  mission = createMissionState(restoredPlan, savedState.checkpoint.mission);
  assert.equal(mission.modelPending, true);
  assert.strictEqual(reduceMission(mission, { type: "place_tile", tileId: correct.id }, context).state, mission);
  const modeled = reduceMission(mission, { type: "complete_correction_model" }, context);
  assert.equal(modeled.state.modelPending, false);
  assert.equal(modeled.state.attemptId, mission.attemptId);
  assert.equal(modeled.state.gameState.evidence.length, evidenceCount);
  assert.equal(checkpointMission(modeled.state).activity.powerCheckpoint.correction, null);
  const finished = reduceMission(modeled.state, { type: "place_tile", tileId: correct.id }, {
    ...context, gameState: modeled.state.gameState
  });
  assert.equal(finished.transition.outcome, "advance");
  assert.deepEqual(finished.state.gameState.evidence.map(event => event.supportLevel), [0, 1, 2, 3]);
});

test("checkpoint reload rehydrates a fresh ordinary power authority", () => {
  const gameState = createSoundSeekersState();
  const plan = createMissionPlan({ stopId: "s3", state: gameState, seed: 3, replayOrdinal: 0 });
  const action = plan.phases.find(item => item.powerId === "word_forge" && item.kind === "challenge");
  const mission = createMissionState(plan, {
    kind: "sound_seekers_mission", missionId: plan.id, contentVersion: plan.contentVersion,
    stopId: plan.stopId, journeyStep: plan.journeyStep, phaseId: action.id,
    completedPhaseIds: [], missionRevision: 4, attemptOrdinal: 0,
    attemptId: `${plan.id}:${action.id}:attempt:0`, nextDecisionOrdinal: 0
  });
  const oldModel = wordForge.view(mission.activity, mission.challenge);
  const savedMission = checkpointMission(mission);
  const savedState = normalizeSoundSeekersState({
    ...gameState,
    checkpoint: { contentVersion: gameState.contentVersion, mission: savedMission }
  });
  const restoredPlan = createMissionPlan({ stopId: "s3", state: savedState, seed: 3, replayOrdinal: 0 });
  const restored = createMissionState(restoredPlan, savedState.checkpoint.mission);
  assert.notStrictEqual(restored.activity, mission.activity);
  assert.notStrictEqual(restored.challenge, mission.challenge);
  assert.deepEqual(checkpointMission(restored).activity.powerCheckpoint,
    savedMission.activity.powerCheckpoint);
  assert.throws(() => issueWordWorkbenchAccess({
    missionState: restored,
    model: oldModel,
    pronunciation: getPronunciation(action.wordId)
  }));
  const forgedMission = structuredClone(savedMission);
  forgedMission.activity.powerCheckpoint.correction = { answer: "ship" };
  const rejected = normalizeSoundSeekersState({
    ...gameState,
    checkpoint: { contentVersion: gameState.contentVersion, mission: forgedMission }
  });
  assert.equal(rejected.checkpoint.mission, undefined);
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

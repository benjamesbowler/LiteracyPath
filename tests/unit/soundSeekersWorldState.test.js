import test from "node:test";
import assert from "node:assert/strict";

import { getBiomeKit } from "../../src/features/soundSeekers/content/biomeKits.js";
import { getExpedition } from "../../src/features/soundSeekers/content/expeditions.js";
import {
  completeMission,
  createMissionState,
  reduceMission
} from "../../src/features/soundSeekers/engine/missionReducer.js";
import { createMissionPlan } from "../../src/features/soundSeekers/engine/createMissionPlan.js";
import {
  deriveNarrativeBranchState,
  deriveResidentRequest,
  deriveWorldState
} from "../../src/features/soundSeekers/engine/worldState.js";
import { createSoundSeekersState } from "../../src/features/soundSeekers/engine/stateV2.js";
import { resolveSceneVisualSemantic } from "../../src/features/soundSeekers/content/sceneVisualSemantics.js";
import { createSoundSeekersAudioController } from "../../src/features/soundSeekers/runtime/soundSeekersAudioController.js";
import { installSoundSeekersProductionAudioDouble } from "../helpers/soundSeekersProductionAudioDouble.js";

installSoundSeekersProductionAudioDouble();

function teachInput(item) {
  const controller = createSoundSeekersAudioController({ clock: () => 0 });
  const audioKeys = [...new Set([item.childAudio, item.targetAudio, ...item.targetAudioSequence,
    ...item.targetAudioAlternates.map(alternate => alternate.targetAudio)].filter(Boolean))];
  const audioDeliveries = audioKeys.map((audioKey, ordinal) => {
    controller.request({ cueId: `teach:${item.stopId}:${item.teachIndex}:${item.targetId}:${ordinal}`,
      audioKey, visibleText: item.childText, spokenText: item.childText,
      kind: "teach", requiresAudio: true });
    return controller.getSnapshot().delivery;
  });
  return { type: "complete-teach", teachIndex: item.teachIndex, targetId: item.targetId, audioDeliveries };
}

function correctInputs(mission) {
  const challenge = mission.activity.powerChallenge || mission.challenge;
  if (challenge.powerId === "echo_search") {
    const candidate = challenge.presentation.candidates.find(item => item.token === challenge.expectedToken);
    return [{ type: "probe", candidateId: candidate.id },
      { type: "confirm_candidate", candidateId: candidate.id }];
  }
  if (challenge.powerId === "memory_delivery") {
    const recipient = challenge.presentation.recipients.find(item => item.token === challenge.expectedToken);
    return [{ type: "receive_cue" }, { type: "move", dx: 1, dy: 0 }, { type: "arrive" },
      { type: challenge.expectedAction, recipientId: recipient.id }];
  }
  if (challenge.powerId === "word_forge") {
    const tile = challenge.presentation.rack.find(item => item.token === challenge.expectedToken);
    return [{ type: "place_tile", tileId: tile.id }];
  }
  if (challenge.powerId === "story_power") {
    const choice = challenge.presentation.choices.find(item => item.token === challenge.expectedToken);
    return [{ type: "read_text" },
      { type: challenge.expectedAction, choiceId: choice.id, token: choice.token }];
  }
  throw new Error(`unsupported s1 power ${challenge.powerId}`);
}

function completeS1(plan) {
  let mission = createMissionState(plan);
  let completion = null;
  for (let guard = 0; guard < 100 && !completion; guard += 1) {
    const phase = plan.phases[mission.phaseIndex];
    const context = {
      gameState: mission.gameState,
      at: new Date(Date.UTC(2026, 8, 3) + guard * 1000).toISOString(),
      sessionDay: "2026-09-03", audio: { status: "completed" }
    };
    const inputs = phase.kind === "teach" ? [teachInput(mission.activity.sequence.currentItem)]
      : ["power_onboarding", "challenge", "content_opportunity", "story_transfer"].includes(phase.kind)
        ? correctInputs(mission) : [{ type: `complete_${phase.kind}` }];
    for (const input of inputs) {
      const reduced = reduceMission(mission, input, { ...context, gameState: mission.gameState });
      mission = reduced.state;
      completion = reduced.completion || completion;
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
      const reduced = reduceMission(mission, { type: "complete_story_transfer" }, {
        ...context, gameState: mission.gameState
      });
      mission = reduced.state;
      completion = reduced.completion || completion;
    }
  }
  return { mission, completion };
}

test("world state exposes only canonical repaired consequences", () => {
  const initial = createSoundSeekersState();
  const expedition = getExpedition("s1");
  const campaign = {
    ...initial,
    trail: {
      ...initial.trail,
      completedStopIds: ["s1"],
      repairs: { [expedition.payoff.repairId]: true, forged: true }
    }
  };
  const world = deriveWorldState(campaign, getBiomeKit(expedition.chapterId));
  assert.equal(Object.isFrozen(world), true);
  assert.deepEqual(world.repairs, [{
    stopId: "s1",
    repairId: expedition.payoff.repairId,
    consequenceId: expedition.payoff.consequenceId,
    relationshipBeatId: expedition.payoff.relationshipBeatId
  }]);
});

test("resident callbacks require every exact earlier repair", () => {
  const initial = createSoundSeekersState();
  const request = deriveResidentRequest(initial, "s2");
  assert.equal(request, null);
  const repaired = {
    ...initial,
    trail: { ...initial.trail, repairs: { "wake-seeds": true } }
  };
  const recalled = deriveResidentRequest(repaired, "s2");
  assert.equal(recalled.stopId, "s2");
  assert.deepEqual(recalled.callbackRepairIds, ["wake-seeds"]);
  assert.deepEqual(recalled.callbackLines.map(item => item.repairId), ["wake-seeds"]);
});

test("narrative branch state fails closed without reciprocal authenticated history", () => {
  const initial = createSoundSeekersState();
  const forged = {
    ...initial,
    trail: { ...initial.trail, storyOutcomes: { "scene-s5": "forged" } }
  };
  assert.equal(deriveNarrativeBranchState(forged, "scene-s5"), null);
});

test("mission completion applies one canonical normalized repair and rejects forged completion", () => {
  const initial = createSoundSeekersState();
  const plan = createMissionPlan({ stopId: "s1", state: initial, seed: 1, replayOrdinal: 0 });
  const finished = completeS1(plan);
  assert.equal(Object.isFrozen(finished.completion), true);
  assert.throws(() => completeMission(initial, { ...finished.completion }));
  const committed = completeMission(finished.mission.gameState, finished.completion);
  assert.equal(committed.nextState.trail.repairs["wake-seeds"], true);
  assert.equal(committed.nextState.trail.journeyStep, 2);
  assert.equal(committed.nextState.checkpoint, null);
  assert.deepEqual(completeMission(committed.nextState, finished.completion), committed);
});

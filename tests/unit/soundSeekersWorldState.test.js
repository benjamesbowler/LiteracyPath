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
  const payoff = plan.phases.at(-1);
  const mission = createMissionState(plan, {
    kind: "sound_seekers_mission", missionId: plan.id, contentVersion: plan.contentVersion,
    stopId: plan.stopId, journeyStep: plan.journeyStep, phaseId: payoff.id,
    completedPhaseIds: plan.phases.slice(0, -1).map(phase => phase.id),
    missionRevision: 20, attemptOrdinal: 0,
    attemptId: `${plan.id}:${payoff.id}:attempt:0`, nextDecisionOrdinal: 8
  });
  const finished = reduceMission(mission, { type: "complete_payoff" }, { gameState: initial });
  assert.equal(Object.isFrozen(finished.completion), true);
  assert.throws(() => completeMission(initial, { ...finished.completion }));
  const committed = completeMission(initial, finished.completion);
  assert.equal(committed.nextState.trail.repairs["wake-seeds"], true);
  assert.equal(committed.nextState.trail.journeyStep, 2);
  assert.equal(committed.nextState.checkpoint, null);
  assert.deepEqual(completeMission(committed.nextState, finished.completion), committed);
});

import { getContentDeckPlacements } from "../content/contentDeckBindings.js";
import { SOUND_SEEKERS_EXPEDITIONS, getExpedition } from "../content/expeditions.js";
import { createReviewTargetSequence } from "../content/reviewSequences.js";
import { isSoundSeekersV2 } from "./stateV2.js";

const planSources = new WeakMap();

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

function clone(value) {
  return structuredClone(value);
}

function previouslyIntroducedPowers(state) {
  const completed = new Set(state.trail.completedStopIds);
  return new Set(SOUND_SEEKERS_EXPEDITIONS
    .filter(expedition => completed.has(expedition.stopId))
    .flatMap(expedition => [...expedition.phases, ...expedition.heartWordOpportunities])
    .map(action => action.powerId)
    .filter(Boolean));
}

function onboardingFor(action) {
  return {
    id: `${action.id}-onboarding`,
    kind: "power_onboarding",
    ownerActionId: action.id,
    powerId: action.powerId,
    instructionId: action.instructionId,
    expectedAction: action.expectedAction,
    recordsDomain: null,
    consequenceFree: true
  };
}

export function createMissionPlan({ stopId, state, seed, replayOrdinal } = {}) {
  const expedition = getExpedition(stopId);
  if (!expedition || !isSoundSeekersV2(state)
    || !Number.isInteger(seed) || !Number.isInteger(replayOrdinal) || replayOrdinal < 0
    || !Number.isInteger(state.trail?.journeyStep) || state.trail.journeyStep < 1) {
    throw new Error("mission plan requires a canonical stop, state, seed, and replay ordinal");
  }
  const introduced = previouslyIntroducedPowers(state);
  const insertedInPlan = new Set();
  const placements = getContentDeckPlacements(expedition.stopId);
  const phases = [];

  const appendAction = action => {
    if (action.powerId && action.onboarding && !introduced.has(action.powerId)
      && !insertedInPlan.has(action.powerId)) {
      phases.push(onboardingFor(action));
      insertedInPlan.add(action.powerId);
    }
    phases.push(action);
  };

  for (const base of expedition.phases) {
    let action = base.kind === "transfer" ? { ...clone(base), kind: "story_transfer" } : clone(base);
    if (action.targetSourceId) {
      const review = createReviewTargetSequence({
        stopId: expedition.stopId, state, seed, count: 1
      });
      if (review.sourceId !== action.targetSourceId) {
        throw new Error(`${action.id}: adaptive review source is not canonical`);
      }
      action = { ...action, targetIds: [...review.targetIds] };
    }
    appendAction(action);

    const after = [
      ...placements.filter(item => item.afterPhaseId === base.id)
        .map(item => ({ ...clone(item), id: item.placementId, kind: "content_placement" })),
      ...expedition.heartWordOpportunities.filter(item => item.afterPhaseId === base.id).map(clone)
    ];
    for (const inserted of after) appendAction(inserted);
  }

  if (phases.filter(phase => phase.kind === "story_transfer").length !== 1
    || phases.some(phase => phase.kind === "transfer")) {
    throw new Error("mission plan must contain one composite story transfer");
  }
  const plan = deepFreeze({
    kind: "sound_seekers_mission_plan",
    id: `mission:${state.trail.journeyStep}:${expedition.stopId}:${replayOrdinal}:${seed}`,
    contentVersion: state.contentVersion,
    stopId: expedition.stopId,
    chapterId: expedition.chapterId,
    journeyStep: state.trail.journeyStep,
    seed,
    replayOrdinal,
    phases
  });
  planSources.set(plan, state);
  return plan;
}

export function currentGameStateForMissionPlan(plan) {
  return planSources.get(plan) || null;
}

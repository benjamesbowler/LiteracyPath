import { QUEST_STOPS } from "../../../data/questSequence.js";
import { selectNextChallenge } from "../engine/learningDirector.js";

export const SOUND_SEEKERS_REVIEW_SOURCE_ID = "sound-seekers-prior-target-adaptive-v1";

const REVIEW_STOP_IDS = new Set(QUEST_STOPS
  .filter(stop => stop.teach.length === 0)
  .map(stop => stop.id));

function reviewStopFor(stopId) {
  const normalized = String(stopId || "").trim();
  const stop = QUEST_STOPS.find(candidate => candidate.id === normalized);
  if (!stop || !REVIEW_STOP_IDS.has(stop.id)) {
    throw new Error(`${normalized || "(missing)"}: not a Sound Seekers review stop`);
  }
  return stop;
}

export function reviewCandidateTargetIds(stopId) {
  const reviewStop = reviewStopFor(stopId);
  const targetIds = [...new Set(QUEST_STOPS
    .filter(stop => stop.index < reviewStop.index)
    .flatMap(stop => stop.teach.map(target => target.id)))];
  if (targetIds.length === 0) throw new Error(`${reviewStop.id}: review stop has no prior targets`);
  return Object.freeze(targetIds);
}

function adaptiveContext(state, candidates, eligibleTargets, seed) {
  const instructionalState = state && typeof state === "object" ? state : {};
  return {
    taught: candidates,
    eligibleTargets,
    evidence: Array.isArray(instructionalState.evidence) ? instructionalState.evidence : [],
    journeyStep: instructionalState.trail?.journeyStep ?? instructionalState.journeyStep,
    lastSeenByTarget: instructionalState.lastSeenByTarget,
    reviewHistory: instructionalState.reviewHistory,
    decayedTargets: instructionalState.decayedTargets,
    accuracyByTarget: instructionalState.accuracyByTarget,
    comparisonFamilies: instructionalState.comparisonFamilies,
    targets: instructionalState.targets,
    seed
  };
}

export function createReviewTargetSequence({ stopId, state = {}, seed, count } = {}) {
  const reviewStop = reviewStopFor(stopId);
  const candidates = reviewCandidateTargetIds(reviewStop.id);
  if (!Number.isInteger(count) || count <= 0) {
    throw new Error(`${reviewStop.id}: review count must be a positive integer`);
  }
  if (count > candidates.length) {
    throw new Error(`${reviewStop.id}: review count ${count} exceeds ${candidates.length} candidates`);
  }

  const targetIds = [];
  let eligibleTargets = [...candidates];
  for (let slotIndex = 0; slotIndex < count; slotIndex += 1) {
    const choice = selectNextChallenge(adaptiveContext(
      state,
      candidates,
      eligibleTargets,
      `${String(seed ?? "")}:${reviewStop.id}:${slotIndex}`
    ));
    if (!choice || !eligibleTargets.includes(choice.targetId)) {
      throw new Error(`${reviewStop.id}: adaptive review could not fill slot ${slotIndex}`);
    }
    targetIds.push(choice.targetId);
    eligibleTargets = eligibleTargets.filter(targetId => targetId !== choice.targetId);
  }

  return Object.freeze({
    sourceId: SOUND_SEEKERS_REVIEW_SOURCE_ID,
    stopId: reviewStop.id,
    targetIds: Object.freeze(targetIds)
  });
}

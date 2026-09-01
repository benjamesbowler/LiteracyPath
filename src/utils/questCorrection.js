import { isEvidenceDomain } from "../features/soundSeekers/engine/challengeContract.js";

export const CORRECTION_MODES = Object.freeze({
  DISCOVER: "discover",
  RETRY: "retry",
  NARROW: "narrow",
  TEACH: "teach",
  GUIDED: "guided"
});

function v2MissCount(previous) {
  return Math.max(0, Math.floor(Number(previous?.missCount ?? previous?.misses) || 0));
}

function laterReviewDomain(previous, miss) {
  const priorDomain = typeof previous?.domain === "string" ? previous.domain : null;
  if (!isEvidenceDomain(priorDomain)) return null;
  const domains = Array.isArray(miss?.eligibleDomains) ? miss.eligibleDomains : [];
  return domains.find(domain => typeof domain === "string" && domain !== priorDomain && isEvidenceDomain(domain)) || null;
}

// v2 correction is a view-independent record for both full and simplified
// scenes. The mounted legacy route continues to use the helpers below.
export function nextCorrection(previous = {}, miss = {}) {
  const missCount = v2MissCount(previous) + 1;
  const selected = typeof miss.selected === "string" ? miss.selected : null;
  const intended = typeof miss.intended === "string" ? miss.intended : null;
  const position = typeof miss.position === "string"
    ? miss.position
    : typeof previous.position === "string" ? previous.position : null;
  const later = missCount > 3;
  const reviewDomain = later ? laterReviewDomain(previous, miss) : null;

  return Object.freeze({
    missCount,
    selected,
    intended,
    domain: typeof previous.domain === "string" ? previous.domain : null,
    position,
    supportLevel: missCount === 1 ? 1 : missCount === 2 ? 2 : 3,
    nameSelected: missCount >= 1,
    replayContrast: missCount === 1,
    isolatePosition: missCount >= 2 ? position : null,
    reduceIrrelevantLoad: missCount === 2,
    modelOnce: missCount === 3,
    requiresFreshAttempt: missCount >= 3,
    queueIsomorphicReview: Boolean(reviewDomain),
    reviewDomain,
    reviewTargetId: reviewDomain ? intended : null
  });
}

export function correctionKey(encounter, beatIndex = 0, stageIndex = 0) {
  return `${encounter?.id || "none"}:${beatIndex}:${stageIndex}`;
}

// The assistance level a child had at the moment they answered, from the
// correction mode that was ACTIVE before the attempt. Feeds recordAttempt's
// promptLevel: 0 = independent evidence, 1 = narrowed, 2 = answer shown.
export function promptLevelForMode(mode) {
  if (mode === CORRECTION_MODES.NARROW) return 1;
  if (mode === CORRECTION_MODES.TEACH || mode === CORRECTION_MODES.GUIDED) return 2;
  return 0;
}

export function normalizeCorrection(value) {
  const misses = Math.max(0, Math.floor(Number(value?.misses) || 0));
  const allowedModes = new Set(Object.values(CORRECTION_MODES));
  return {
    misses,
    mode: allowedModes.has(value?.mode) ? value.mode : CORRECTION_MODES.DISCOVER,
    lastWrongId: typeof value?.lastWrongId === "string" ? value.lastWrongId : null
  };
}

export function recordCorrectionMiss(value, choiceId = null) {
  const current = normalizeCorrection(value);
  const misses = current.misses + 1;
  return {
    misses,
    mode: misses >= 3
      ? CORRECTION_MODES.TEACH
      : misses === 2
        ? CORRECTION_MODES.NARROW
        : CORRECTION_MODES.RETRY,
    lastWrongId: typeof choiceId === "string" ? choiceId : current.lastWrongId
  };
}

export function completeTeachBack(value) {
  const current = normalizeCorrection(value);
  return { ...current, mode: CORRECTION_MODES.GUIDED };
}

function narrowedIds(items, lastWrongId) {
  const correct = items.find(item => item.correct);
  const lastWrong = items.find(item => item.id === lastWrongId && !item.correct);
  const distractor = lastWrong || items.find(item => !item.correct);
  return [correct?.id, distractor?.id].filter(Boolean);
}

export function correctionPresentation(stage, value) {
  const correction = normalizeCorrection(value);
  const items = stage?.items || [];
  const correct = items.find(item => item.correct) || null;
  let visibleIds = items.map(item => item.id);
  let prompt = stage?.prompt || "Try again.";
  let help = stage?.help || "Look and listen carefully.";

  if (correction.mode === CORRECTION_MODES.RETRY) {
    help = "That one does not match. Listen, then try the same task again.";
  } else if (correction.mode === CORRECTION_MODES.NARROW) {
    visibleIds = narrowedIds(items, correction.lastWrongId);
    help = "Two choices now. Compare them carefully.";
  } else if (correction.mode === CORRECTION_MODES.TEACH) {
    visibleIds = correct ? [correct.id] : [];
    prompt = correct ? `This is ${correct.label}.` : prompt;
    help = "Watch the answer glow and listen once more.";
  } else if (correction.mode === CORRECTION_MODES.GUIDED) {
    visibleIds = narrowedIds(items, correction.lastWrongId);
    prompt = correct ? `Now find ${correct.label}.` : prompt;
    help = "You have seen it. Walk to the matching answer.";
  }

  return {
    ...correction,
    visibleIds,
    correctId: correct?.id || null,
    prompt,
    help,
    needsLaterReview: correction.misses >= 3
  };
}

export function nextQueuedReview(queue = [], reviewed = []) {
  const done = new Set(reviewed);
  return queue.find(index => Number.isInteger(index) && !done.has(index)) ?? null;
}

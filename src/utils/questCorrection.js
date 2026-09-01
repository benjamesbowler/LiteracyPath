import {
  isEvidenceDomain,
  nextEligibleEvidencePath,
  validateEvidencePath
} from "../features/soundSeekers/engine/evidenceEligibility.js";

export const CORRECTION_MODES = Object.freeze({
  DISCOVER: "discover",
  RETRY: "retry",
  NARROW: "narrow",
  TEACH: "teach",
  GUIDED: "guided"
});

function isRecord(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function nonEmptyString(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function answerToken(value) {
  if (typeof value === "string" && value.length > 0) return value;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function exactPosition(value) {
  if (value === null || value === undefined) return { valid: true, value: null };
  if (Number.isInteger(value) && value >= 0) return { valid: true, value };
  if (typeof value === "string" && value.trim()) return { valid: true, value };
  return { valid: false, value: null };
}

function v2MissCount(previous) {
  const value = previous?.missCount ?? previous?.misses ?? 0;
  return Number.isInteger(value) && value >= 0 ? value : null;
}

function sameIdentity(previousValue, missValue) {
  return previousValue === null || missValue === null || previousValue === missValue;
}

function resolvedOptionalString(previous, miss, key) {
  const previousValue = previous[key] === null || previous[key] === undefined
    ? null
    : nonEmptyString(previous[key]);
  const missedValue = miss[key] === null || miss[key] === undefined
    ? null
    : nonEmptyString(miss[key]);
  if ((hasOwn(previous, key) && previous[key] !== null && !previousValue)
    || (hasOwn(miss, key) && miss[key] !== null && !missedValue)
    || !sameIdentity(previousValue, missedValue)) {
    return { valid: false, value: null };
  }
  return { valid: true, value: previousValue || missedValue };
}

// v2 correction is a view-independent record for both full and simplified
// scenes. The mounted legacy route continues to use the helpers below.
export function nextCorrection(previous = {}, miss = {}) {
  if (!isRecord(previous) || !isRecord(miss)) return null;
  if ((hasOwn(previous, "evidenceKind") && previous.evidenceKind !== "practice")
    || (hasOwn(miss, "evidenceKind") && miss.evidenceKind !== "practice")) return null;
  if (hasOwn(miss, "eligibleDomains") && !Array.isArray(miss.eligibleDomains)) return null;

  const previousMissCount = v2MissCount(previous);
  const selected = answerToken(miss.selected);
  const intended = answerToken(miss.intended);
  if (previousMissCount === null || selected === null || intended === null) return null;

  const previousTargetId = nonEmptyString(previous.targetId);
  const missedTargetId = nonEmptyString(miss.targetId);
  if ((hasOwn(previous, "targetId") && !previousTargetId)
    || (hasOwn(miss, "targetId") && !missedTargetId)) return null;
  const targetId = previousTargetId || missedTargetId;
  if (!targetId || !sameIdentity(previousTargetId, missedTargetId)) return null;

  const previousDomain = isEvidenceDomain(previous.domain) ? previous.domain : null;
  const missedDomain = isEvidenceDomain(miss.domain) ? miss.domain : null;
  if ((hasOwn(previous, "domain") && !previousDomain)
    || (hasOwn(miss, "domain") && !missedDomain)) return null;
  const domain = previousDomain || missedDomain;
  if (!domain || !sameIdentity(previousDomain, missedDomain)) return null;

  const wordIdentity = resolvedOptionalString(previous, miss, "wordId");
  const activityIdentity = resolvedOptionalString(previous, miss, "activityType");
  const connectedTextIdentity = resolvedOptionalString(previous, miss, "connectedTextId");
  const bossTransferIdentity = resolvedOptionalString(previous, miss, "bossTransferId");
  if (!wordIdentity.valid || !activityIdentity.valid || !connectedTextIdentity.valid || !bossTransferIdentity.valid) return null;
  const wordId = wordIdentity.value;
  const activityType = activityIdentity.value;
  const connectedTextId = connectedTextIdentity.value;
  const bossTransferId = bossTransferIdentity.value;

  const previousPosition = exactPosition(previous.position);
  const missedPosition = exactPosition(miss.position);
  if (!previousPosition.valid || !missedPosition.valid) return null;
  const position = hasOwn(miss, "position") ? missedPosition.value : previousPosition.value;
  const construct = {
    targetId,
    domain,
    wordId,
    position,
    activityType,
    connectedTextId,
    bossTransferId
  };
  if (!validateEvidencePath(construct).valid) return null;
  const missCount = previousMissCount + 1;
  const later = missCount > 3;
  const reviewPath = later ? nextEligibleEvidencePath(construct, { domain, activityType }) : null;
  const reviewDomain = reviewPath?.domain || null;
  const reviewActivityType = reviewPath?.activityType || null;
  const review = reviewPath ? Object.freeze({
    targetId,
    ...(wordId ? { wordId } : {}),
    ...(position !== null ? { position } : {}),
    ...(connectedTextId ? { connectedTextId } : {}),
    ...(bossTransferId ? { bossTransferId } : {}),
    ...(reviewActivityType ? { activityType: reviewActivityType } : {}),
    domain: reviewDomain,
    evidenceKind: "practice"
  }) : null;

  return Object.freeze({
    evidenceKind: "practice",
    missCount,
    targetId,
    wordId,
    activityType,
    connectedTextId,
    bossTransferId,
    selected,
    intended,
    domain,
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
    reviewActivityType,
    reviewTargetId: review?.targetId || null,
    reviewWordId: review?.wordId || null,
    reviewPosition: review?.position ?? null,
    reviewConnectedTextId: review?.connectedTextId || null,
    reviewBossTransferId: review?.bossTransferId || null,
    reviewEvidenceKind: review?.evidenceKind || null,
    review
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

import {
  normalizeHeartWordActivityType,
  normalizeSoundSeekersEvidenceEvent
} from "./evidenceEligibility.js";

export { normalizeSoundSeekersEvidenceEvent };

export const CONTENT_DECK_CATEGORIES = Object.freeze([
  "heartWords",
  "stories",
  "alternatives",
  "morphology",
  "transfer"
]);

const CATEGORY_SET = new Set(CONTENT_DECK_CATEGORIES);
const COMPOSITE_CATEGORIES = new Set(["stories", "transfer"]);
const CHECKPOINT_STAGES = new Set(["narrative_choice_pending", "response_pending", "model_pending"]);

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function trimCanonicalWhitespace(value) {
  return value.replace(/^[ \t\n\r\f\v]+|[ \t\n\r\f\v]+$/gu, "");
}

function stringId(value) {
  if (typeof value !== "string") return null;
  const normalized = trimCanonicalWhitespace(value);
  return normalized ? normalized : null;
}

function compareCanonicalIds(left, right) {
  const leftPoints = [...left];
  const rightPoints = [...right];
  const length = Math.min(leftPoints.length, rightPoints.length);
  for (let index = 0; index < length; index += 1) {
    const difference = leftPoints[index].codePointAt(0) - rightPoints[index].codePointAt(0);
    if (difference) return difference;
  }
  return leftPoints.length - rightPoints.length;
}

function nullableString(value) {
  if (value === null) return null;
  return stringId(value);
}

function nonNegativeInteger(value) {
  return Number.isSafeInteger(value) && value >= 0 ? value : null;
}

function positiveInteger(value) {
  return Number.isSafeInteger(value) && value > 0 ? value : null;
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

function canonicalJson(value) {
  if (Array.isArray(value)) return value.map(canonicalJson);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonicalJson(value[key])]));
}

function immutableFingerprint(value) {
  return JSON.stringify(canonicalJson(value));
}

function visitConflict(visitId) {
  return Object.freeze({ kind: "visit_conflict", visitId });
}

function deckUseConflict(useId) {
  return Object.freeze({ kind: "use_conflict", useId });
}

function receiptConflict(attemptId) {
  return Object.freeze({ kind: "attempt_receipt_conflict", attemptId });
}

function normalizeCanonicalStringArray(value, compare = compareCanonicalIds) {
  if (!Array.isArray(value)) return null;
  const strings = value.map(stringId);
  if (strings.some(item => item === null) || new Set(strings).size !== strings.length) return null;
  return Object.freeze([...strings].sort(compare));
}

function attemptIdParts(value) {
  const id = stringId(value);
  if (!id) return null;
  if (id.startsWith("content-placement-attempt:")) {
    const match = /^(.*):(\d+):(\d+)$/u.exec(id);
    return match ? { decisionOrdinal: Number(match[2]), attemptOrdinal: Number(match[3]), id } : null;
  }
  if (id.startsWith("story-transfer-attempt:")) {
    const match = /^(.*):(\d+)$/u.exec(id);
    return match ? { decisionOrdinal: 0, attemptOrdinal: Number(match[2]), id } : null;
  }
  return null;
}

function attemptOrderParts(value) {
  const content = /^content-placement-attempt:.*:(\d+):(\d+)$/u.exec(value);
  if (content) return [0, BigInt(content[1]), BigInt(content[2]), value];
  const story = /^story-transfer-attempt:.*:(\d+)$/u.exec(value);
  if (story) return [1, 0n, BigInt(story[1]), value];
  return [2, 0n, 0n, value];
}

function compareAttemptIds(left, right) {
  const a = attemptOrderParts(left);
  const b = attemptOrderParts(right);
  if (a[0] !== b[0]) return a[0] - b[0];
  if (a[1] !== b[1]) return a[1] < b[1] ? -1 : 1;
  if (a[2] !== b[2]) return a[2] < b[2] ? -1 : 1;
  return compareCanonicalIds(a[3], b[3]);
}

export function normalizeContentDeckVisit(category, entryId, raw) {
  if (typeof entryId !== "string" || !entryId
    || entryId !== trimCanonicalWhitespace(entryId)) return null;
  const visitId = stringId(entryId);
  if (!visitId || !CATEGORY_SET.has(category)) return null;
  const value = asObject(raw);
  if (value.kind === "visit_conflict") return visitConflict(visitId);
  const hasTargetId = Object.prototype.hasOwnProperty.call(value, "targetId");
  const hasWordId = Object.prototype.hasOwnProperty.call(value, "wordId");
  const targetIdIsCanonical = hasTargetId
    && (value.targetId === null || stringId(value.targetId) !== null);
  const wordIdIsCanonical = hasWordId
    && (value.wordId === null || stringId(value.wordId) !== null);

  const normalized = {
    kind: "visit",
    visitId: stringId(value.visitId),
    contentInstanceId: stringId(value.contentInstanceId),
    visitOwnerId: stringId(value.visitOwnerId),
    ownerActionUseId: stringId(value.ownerActionUseId),
    category: stringId(value.category),
    slotId: stringId(value.slotId),
    recordId: stringId(value.recordId),
    contentId: stringId(value.contentId),
    targetId: nullableString(value.targetId),
    wordId: nullableString(value.wordId),
    stopId: stringId(value.stopId),
    journeyStep: positiveInteger(value.journeyStep)
  };
  const requiredStrings = [
    normalized.visitId,
    normalized.contentInstanceId,
    normalized.visitOwnerId,
    normalized.ownerActionUseId,
    normalized.slotId,
    normalized.recordId,
    normalized.contentId,
    normalized.stopId
  ];
  let valid = value.kind === "visit"
    && normalized.visitId === visitId
    && normalized.category === category
    && requiredStrings.every(Boolean)
    && targetIdIsCanonical
    && wordIdIsCanonical
    && normalized.journeyStep !== null;

  if (category === "heartWords") {
    const activityType = normalizeHeartWordActivityType(value.ownerActivityType);
    valid = valid && Boolean(normalized.targetId && normalized.wordId && activityType);
    if (activityType) normalized.ownerActivityType = activityType;
  } else if (category === "stories") {
    valid = valid && Boolean(normalized.targetId) && normalized.wordId === null;
  } else if (category === "alternatives") {
    valid = valid && normalized.targetId === null && normalized.wordId === null;
  } else if (category === "morphology") {
    valid = valid && normalized.targetId === null && Boolean(normalized.wordId);
  } else if (category === "transfer") {
    valid = valid && Boolean(normalized.targetId);
  }
  return valid ? deepFreeze(normalized) : visitConflict(visitId);
}

export function normalizeContentDeckUse(category, entryId, raw) {
  if (typeof entryId !== "string" || !entryId
    || entryId !== trimCanonicalWhitespace(entryId)) return null;
  const useId = stringId(entryId);
  if (!useId || !CATEGORY_SET.has(category)) return null;
  const value = asObject(raw);
  if (value.kind === "use_conflict") return deckUseConflict(useId);

  const normalized = {
    kind: "use",
    useId: stringId(value.useId),
    visitId: stringId(value.visitId),
    contentInstanceId: stringId(value.contentInstanceId),
    visitOwnerId: stringId(value.visitOwnerId),
    actionUseId: stringId(value.actionUseId),
    category: stringId(value.category),
    slotId: stringId(value.slotId),
    recordId: stringId(value.recordId),
    journeyStep: positiveInteger(value.journeyStep)
  };
  let valid = value.kind === "use"
    && normalized.useId === useId
    && normalized.category === category
    && Object.values(normalized).every(item => item !== null);

  if (category === "heartWords") {
    const activityType = normalizeHeartWordActivityType(value.activityType);
    valid = valid && Boolean(activityType);
    if (activityType) normalized.activityType = activityType;
  } else {
    const attemptReceiptIds = normalizeCanonicalStringArray(
      value.attemptReceiptIds,
      compareAttemptIds
    );
    valid = valid && Boolean(attemptReceiptIds?.length);
    if (attemptReceiptIds) normalized.attemptReceiptIds = attemptReceiptIds;
    if (COMPOSITE_CATEGORIES.has(category)) {
      normalized.transactionId = stringId(value.transactionId);
      normalized.pairedUseId = stringId(value.pairedUseId);
      normalized.evidenceEventId = stringId(value.evidenceEventId);
      const hasNarrativeChoiceToken = Object.prototype.hasOwnProperty.call(
        value,
        "narrativeChoiceToken"
      );
      normalized.narrativeChoiceToken = nullableString(value.narrativeChoiceToken);
      valid = valid
        && hasNarrativeChoiceToken
        && Boolean(normalized.transactionId && normalized.pairedUseId && normalized.evidenceEventId)
        && (value.narrativeChoiceToken === null || normalized.narrativeChoiceToken !== null);
    }
  }
  return valid ? deepFreeze(normalized) : deckUseConflict(useId);
}

function normalizeLedger(category, raw, kind) {
  const values = asObject(raw);
  const normalize = kind === "visits" ? normalizeContentDeckVisit : normalizeContentDeckUse;
  const result = {};
  for (const entryId of Object.keys(values).sort()) {
    const normalized = normalize(category, entryId, values[entryId]);
    if (normalized) result[entryId] = normalized;
  }
  return result;
}

function normalizeDeck(category, raw) {
  const value = asObject(raw);
  return {
    visits: normalizeLedger(category, value.visits, "visits"),
    uses: normalizeLedger(category, value.uses, "uses")
  };
}

export function createContentDeckState(raw = {}) {
  const value = asObject(raw);
  return Object.fromEntries(CONTENT_DECK_CATEGORIES.map(category => [
    category,
    normalizeDeck(category, value[category])
  ]));
}

function unionImmutableEntry(entryId, left, right, { idKey, conflictKind, marker }) {
  if (left && left[idKey] !== entryId) left = marker(entryId);
  if (right && right[idKey] !== entryId) right = marker(entryId);
  if (!left) return right;
  if (!right) return left;
  if (left.kind === conflictKind || right.kind === conflictKind) return marker(entryId);
  return immutableFingerprint(left) === immutableFingerprint(right) ? left : marker(entryId);
}

function unionLedger(left, right, options) {
  const result = {};
  const keys = [...new Set([...Object.keys(left), ...Object.keys(right)])].sort();
  for (const key of keys) result[key] = unionImmutableEntry(key, left[key], right[key], options);
  return result;
}

export function mergeContentDeckState(left, right) {
  const local = createContentDeckState(left);
  const remote = createContentDeckState(right);
  return Object.fromEntries(CONTENT_DECK_CATEGORIES.map(category => [category, {
    visits: unionLedger(local[category].visits, remote[category].visits, {
      idKey: "visitId",
      conflictKind: "visit_conflict",
      marker: visitConflict
    }),
    uses: unionLedger(local[category].uses, remote[category].uses, {
      idKey: "useId",
      conflictKind: "use_conflict",
      marker: deckUseConflict
    })
  }]));
}

export function checkpointContentDecks(contentDecks) {
  return createContentDeckState(contentDecks);
}

export function resumeContentDecks(checkpoint) {
  return createContentDeckState(checkpoint);
}

export function validContentDeckVisits(contentDecks, category) {
  if (!CATEGORY_SET.has(category)) return Object.freeze([]);
  const deck = createContentDeckState(contentDecks)[category];
  const groups = new Map();
  for (const visit of Object.values(deck.visits)) {
    if (visit.kind !== "visit") continue;
    const claim = `${visit.category}\u0000${visit.contentInstanceId}\u0000${visit.journeyStep}`;
    const entries = groups.get(claim) || [];
    entries.push(visit);
    groups.set(claim, entries);
  }
  return Object.freeze([...groups.values()]
    .filter(entries => entries.length === 1)
    .flat()
    .sort((left, right) => left.journeyStep - right.journeyStep
      || compareCanonicalIds(left.visitId, right.visitId)));
}

export function normalizeAttemptReceipt(entryId, raw) {
  if (typeof entryId !== "string" || !entryId
    || entryId !== trimCanonicalWhitespace(entryId)) return null;
  const attemptId = stringId(entryId);
  if (!attemptId) return null;
  const value = asObject(raw);
  if (value.kind === "attempt_receipt_conflict") return receiptConflict(attemptId);
  const operation = value.operation === "content_placement" || value.operation === "story_transfer"
    ? value.operation
    : null;
  const decisionOrdinal = nonNegativeInteger(value.decisionOrdinal);
  const attemptOrdinal = nonNegativeInteger(value.attemptOrdinal);
  const correctionRecordIds = normalizeCanonicalStringArray(value.correctionRecordIds);
  const eventIds = normalizeCanonicalStringArray(value.eventIds);
  const useIds = normalizeCanonicalStringArray(value.useIds);
  const parts = attemptIdParts(value.attemptId);
  const inputSha256 = typeof value.inputSha256 === "string"
    && /^[a-f0-9]{64}$/u.test(value.inputSha256)
    ? value.inputSha256
    : null;
  const normalized = {
    kind: "attempt_receipt",
    attemptId: stringId(value.attemptId),
    operation,
    subjectId: stringId(value.subjectId),
    decisionOrdinal,
    attemptOrdinal,
    inputSha256,
    completed: value.completed,
    correctionRecordIds,
    eventIds,
    useIds
  };
  const valid = value.kind === "attempt_receipt"
    && normalized.attemptId === attemptId
    && Boolean(operation && normalized.subjectId && inputSha256)
    && decisionOrdinal !== null
    && attemptOrdinal !== null
    && typeof value.completed === "boolean"
    && correctionRecordIds !== null
    && eventIds !== null
    && useIds !== null
    && parts !== null
    && parts.decisionOrdinal === decisionOrdinal
    && parts.attemptOrdinal === attemptOrdinal
    && (operation === "story_transfer"
      ? attemptId === `story-transfer-attempt:${normalized.subjectId}:${attemptOrdinal}`
        && decisionOrdinal === 0
      : attemptId.endsWith(`:${normalized.subjectId}:${decisionOrdinal}:${attemptOrdinal}`));
  return valid ? deepFreeze(normalized) : receiptConflict(attemptId);
}

export function normalizeAttemptReceipts(raw = {}) {
  const value = asObject(raw);
  const result = {};
  for (const attemptId of Object.keys(value).sort(compareAttemptIds)) {
    const normalized = normalizeAttemptReceipt(attemptId, value[attemptId]);
    if (normalized) result[attemptId] = normalized;
  }
  return result;
}

export function mergeAttemptReceipts(left, right) {
  return unionLedger(normalizeAttemptReceipts(left), normalizeAttemptReceipts(right), {
    idKey: "attemptId",
    conflictKind: "attempt_receipt_conflict",
    marker: receiptConflict
  });
}

function exactPlacementDescriptor(raw, contentDecks) {
  const value = asObject(raw);
  const placementId = stringId(value.placementId);
  const category = stringId(value.category);
  const visitId = stringId(value.visitId);
  const stopId = stringId(value.stopId);
  const journeyStep = positiveInteger(value.journeyStep);
  const stage = CHECKPOINT_STAGES.has(value.stage) ? value.stage : null;
  const targetOrdinal = nonNegativeInteger(value.targetOrdinal);
  const attemptOrdinal = nonNegativeInteger(value.attemptOrdinal);
  const attemptId = stringId(value.attemptId);
  if (value.kind !== "content_placement"
    || !placementId
    || !new Set(["alternatives", "morphology"]).has(category)
    || !visitId
    || !stopId
    || journeyStep === null
    || !stage
    || targetOrdinal === null
    || attemptOrdinal === null
    || attemptId !== `content-placement-attempt:${visitId}:${placementId}:${targetOrdinal}:${attemptOrdinal}`) {
    return null;
  }
  const visit = validContentDeckVisits(contentDecks, category)
    .find(item => item.visitId === visitId);
  if (!visit || visit.stopId !== stopId || visit.journeyStep !== journeyStep) return null;
  return Object.freeze({
    kind: "content_placement",
    placementId,
    category,
    visitId,
    stopId,
    journeyStep,
    stage,
    targetOrdinal,
    attemptOrdinal,
    attemptId
  });
}

function exactStoryDescriptor(raw, contentDecks) {
  const value = asObject(raw);
  const transactionId = stringId(value.transactionId);
  const stopId = stringId(value.stopId);
  const journeyStep = positiveInteger(value.journeyStep);
  const storyVisitId = stringId(value.storyVisitId);
  const transferVisitId = stringId(value.transferVisitId);
  const stage = CHECKPOINT_STAGES.has(value.stage) ? value.stage : null;
  const attemptOrdinal = nonNegativeInteger(value.attemptOrdinal);
  const attemptId = stringId(value.attemptId);
  const hasToken = Object.prototype.hasOwnProperty.call(value, "narrativeChoiceToken");
  const narrativeChoiceToken = nullableString(value.narrativeChoiceToken);
  if (value.kind !== "story_transfer"
    || !transactionId
    || !stopId
    || journeyStep === null
    || !storyVisitId
    || !transferVisitId
    || !stage
    || attemptOrdinal === null
    || !hasToken
    || (value.narrativeChoiceToken !== null && narrativeChoiceToken === null)
    || attemptId !== `story-transfer-attempt:${transactionId}:${attemptOrdinal}`) {
    return null;
  }
  const storyVisit = validContentDeckVisits(contentDecks, "stories")
    .find(item => item.visitId === storyVisitId);
  const transferVisit = validContentDeckVisits(contentDecks, "transfer")
    .find(item => item.visitId === transferVisitId);
  if (!storyVisit || !transferVisit
    || storyVisit.stopId !== stopId
    || transferVisit.stopId !== stopId
    || storyVisit.journeyStep !== journeyStep
    || transferVisit.journeyStep !== journeyStep
    || (transferVisit.wordId === null && (narrativeChoiceToken !== null || stage === "narrative_choice_pending"))
    || (transferVisit.wordId !== null
      && ((stage === "narrative_choice_pending") !== (narrativeChoiceToken === null)))) return null;
  return Object.freeze({
    kind: "story_transfer",
    transactionId,
    stopId,
    journeyStep,
    stage,
    storyVisitId,
    transferVisitId,
    narrativeChoiceToken,
    attemptOrdinal,
    attemptId
  });
}

export function normalizeContentDeckCheckpoint(raw, contentDecks) {
  const value = asObject(raw);
  if (!stringId(value.contentVersion)) return null;
  const normalized = Object.fromEntries(Object.entries(value)
    .filter(([key]) => !["contentPlacement", "storyTransfer"].includes(key)));
  if (value.contentPlacement !== undefined) {
    const descriptor = exactPlacementDescriptor(value.contentPlacement, contentDecks);
    if (descriptor) normalized.contentPlacement = descriptor;
  }
  if (value.storyTransfer !== undefined) {
    const descriptor = exactStoryDescriptor(value.storyTransfer, contentDecks);
    if (descriptor) normalized.storyTransfer = descriptor;
  }
  return normalized;
}

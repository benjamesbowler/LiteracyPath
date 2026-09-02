import {
  CONTENT_DECK_PLACEMENTS,
  getContentDeckActionBindings,
  getContentDeckOwnerBinding
} from "../content/contentDeckBindings.js";
import {
  CONTENT_DECK_CATEGORIES,
  getContentDeckCatalog
} from "../content/contentDeckCatalogs.js";
import { rehydrateServedContentInstance } from "./contentDeckScheduler.js";
import {
  createContentDeckState,
  normalizeAttemptReceipts,
  validContentDeckVisits
} from "./contentDeckState.js";

const COVERAGE_TOTALS = Object.freeze({
  heartWords: 60,
  stories: 40,
  alternatives: 4,
  morphology: 1,
  transfer: 40
});

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

function asState(raw) {
  const value = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  return {
    ...value,
    contentDecks: createContentDeckState(value.contentDecks),
    attemptReceipts: normalizeAttemptReceipts(value.attemptReceipts),
    evidence: Array.isArray(value.evidence) ? value.evidence : []
  };
}

function receiptOrder(left, right) {
  return left.operation.localeCompare(right.operation)
    || left.subjectId.localeCompare(right.subjectId)
    || left.decisionOrdinal - right.decisionOrdinal
    || left.attemptOrdinal - right.attemptOrdinal
    || left.attemptId.localeCompare(right.attemptId);
}

function expectedAttemptId(receipt) {
  if (receipt.operation === "story_transfer") {
    return `story-transfer-attempt:${receipt.subjectId}:${receipt.attemptOrdinal}`;
  }
  return receipt.attemptId.endsWith(
    `:${receipt.subjectId}:${receipt.decisionOrdinal}:${receipt.attemptOrdinal}`
  ) ? receipt.attemptId : null;
}

function exactArray(left, right) {
  return Array.isArray(left)
    && Array.isArray(right)
    && left.length === right.length
    && left.every((value, index) => value === right[index]);
}

function validEventForReceipt(event, receipt) {
  if (!event
    || event.evidenceKind === "conflict"
    || event.conflicted === true
    || event.id !== `${receipt.attemptId}:0`
    || typeof event.correct !== "boolean") return false;
  const expectedSupport = Math.min(receipt.attemptOrdinal, 3);
  return event.supportLevel === expectedSupport
    && event.revealed === (receipt.attemptOrdinal >= 3);
}

function receiptResultShape(receipt, event, referencedUses) {
  if (receipt.operation === "story_transfer") {
    if (!event) return false;
    if (event.correct) {
      return receipt.completed === true
        && receipt.correctionRecordIds.length === 0
        && receipt.useIds.length === 2
        && referencedUses.length === 2;
    }
    return receipt.completed === false
      && exactArray(receipt.correctionRecordIds, [`content-correction:${receipt.attemptId}`])
      && receipt.useIds.length === 0;
  }

  if (!event) {
    return receipt.decisionOrdinal === 0
      && receipt.attemptOrdinal === 0
      && receipt.completed === true
      && receipt.correctionRecordIds.length === 0
      && receipt.eventIds.length === 0
      && receipt.useIds.length === 1
      && referencedUses[0]?.category === "morphology";
  }
  if (event.correct) {
    return receipt.correctionRecordIds.length === 0
      && receipt.useIds.length <= 1
      && (!receipt.useIds.length || receipt.completed === true);
  }
  return receipt.completed === false
    && exactArray(receipt.correctionRecordIds, [`content-correction:${receipt.attemptId}`])
    && receipt.useIds.length === 0;
}

export function validAttemptReceipts(rawState) {
  const state = asState(rawState);
  const evidenceById = new Map(state.evidence.map(event => [event?.id, event]));
  const rawUses = new Map(CONTENT_DECK_CATEGORIES.flatMap(category =>
    Object.values(state.contentDecks[category].uses).map(use => [use.useId, use])));
  const receipts = Object.values(state.attemptReceipts)
    .filter(receipt => receipt.kind === "attempt_receipt")
    .sort(receiptOrder);
  const preliminary = [];
  const eventOwners = new Map();
  const useOwners = new Map();

  for (const receipt of receipts) {
    if (expectedAttemptId(receipt) !== receipt.attemptId) continue;
    const events = receipt.eventIds.map(eventId => evidenceById.get(eventId));
    const uses = receipt.useIds.map(useId => rawUses.get(useId));
    if (events.some(event => !event) || uses.some(use => !use || use.kind !== "use")) continue;
    const event = events[0] || null;
    if (receipt.eventIds.length > 1
      || (event && !validEventForReceipt(event, receipt))
      || !receiptResultShape(receipt, event, uses)) continue;
    if (receipt.eventIds.some(id => eventOwners.has(id))
      || receipt.useIds.some(id => useOwners.has(id))) continue;
    preliminary.push(receipt);
    receipt.eventIds.forEach(id => eventOwners.set(id, receipt.attemptId));
    receipt.useIds.forEach(id => useOwners.set(id, receipt.attemptId));
  }

  const bySubject = new Map();
  for (const receipt of preliminary) {
    const key = `${receipt.operation}\u0000${receipt.subjectId}`;
    const group = bySubject.get(key) || [];
    group.push(receipt);
    bySubject.set(key, group);
  }
  const valid = [];
  for (const group of bySubject.values()) {
    group.sort(receiptOrder);
    let expectedDecision = 0;
    let expectedAttempt = 0;
    let closed = false;
    for (const receipt of group) {
      if (closed || receipt.decisionOrdinal !== expectedDecision
        || receipt.attemptOrdinal !== expectedAttempt) break;
      const event = receipt.eventIds.length ? evidenceById.get(receipt.eventIds[0]) : null;
      valid.push(receipt);
      if (receipt.completed) {
        closed = true;
      } else if (event?.correct) {
        expectedDecision += 1;
        expectedAttempt = 0;
      } else {
        expectedAttempt += 1;
      }
    }
  }
  return deepFreeze(valid.sort(receiptOrder));
}

function parentValid(use, visit) {
  return Boolean(visit
    && use.category === visit.category
    && use.visitId === visit.visitId
    && use.contentInstanceId === visit.contentInstanceId
    && use.visitOwnerId === visit.visitOwnerId
    && use.slotId === visit.slotId
    && use.recordId === visit.recordId
    && use.journeyStep === visit.journeyStep);
}

function validReceiptChain(use, validReceipts) {
  const receipts = use.attemptReceiptIds.map(id => validReceipts.get(id));
  if (receipts.some(receipt => !receipt)) return null;
  if (receipts.some(receipt => receipt.operation === "content_placement"
    ? receipt.subjectId !== use.visitOwnerId
    : receipt.subjectId !== use.transactionId)) return null;
  const final = receipts.at(-1);
  if (!final?.completed || !final.useIds.includes(use.useId)) return null;
  if (receipts.slice(0, -1).some(receipt => receipt.useIds.includes(use.useId))) return null;
  const completeGroup = [...validReceipts.values()]
    .filter(receipt => receipt.operation === final.operation
      && receipt.subjectId === final.subjectId)
    .sort(receiptOrder);
  if (!exactArray(completeGroup.map(receipt => receipt.attemptId), use.attemptReceiptIds)) return null;
  if (final.operation === "content_placement") {
    const placement = CONTENT_DECK_PLACEMENTS.find(item => item.placementId === final.subjectId);
    if (placement && final.decisionOrdinal !== Math.max(placement.challengeTargetIds.length - 1, 0)) {
      return null;
    }
  }
  return receipts;
}

function rawValidUses(rawState, category) {
  const state = asState(rawState);
  if (!CONTENT_DECK_CATEGORIES.includes(category)) return [];
  const visits = new Map(validContentDeckVisits(state.contentDecks, category)
    .map(visit => [visit.visitId, visit]));
  const receiptMap = new Map(validAttemptReceipts(state)
    .map(receipt => [receipt.attemptId, receipt]));
  const parentCandidates = Object.values(state.contentDecks[category].uses)
    .filter(use => use.kind === "use" && parentValid(use, visits.get(use.visitId)));
  const claims = new Map();
  for (const use of parentCandidates) {
    const claim = `${use.visitId}\u0000${use.actionUseId}`;
    const group = claims.get(claim) || [];
    group.push(use);
    claims.set(claim, group);
  }
  const candidates = [...claims.values()].filter(group => group.length === 1).flat();
  if (category === "heartWords") {
    return candidates.filter(use => {
      const visit = visits.get(use.visitId);
      if (use.actionUseId === visit.ownerActionUseId) return true;
      const owner = state.contentDecks.heartWords.uses[`${visit.visitId}:${visit.ownerActionUseId}`];
      return owner?.kind === "use" && parentValid(owner, visit);
    });
  }
  const chained = candidates.filter(use => validReceiptChain(use, receiptMap));
  if (!new Set(["stories", "transfer"]).has(category)) return chained;
  return chained.filter(use => {
    const reciprocalCategory = category === "stories" ? "transfer" : "stories";
    const pair = state.contentDecks[reciprocalCategory].uses[use.pairedUseId];
    const pairVisits = new Map(validContentDeckVisits(state.contentDecks, reciprocalCategory)
      .map(visit => [visit.visitId, visit]));
    if (!pair || pair.kind !== "use" || !parentValid(pair, pairVisits.get(pair.visitId))) return false;
    if (pair.pairedUseId !== use.useId
      || pair.transactionId !== use.transactionId
      || pair.evidenceEventId !== use.evidenceEventId
      || pair.narrativeChoiceToken !== use.narrativeChoiceToken
      || pair.journeyStep !== use.journeyStep
      || !exactArray(pair.attemptReceiptIds, use.attemptReceiptIds)
      || !validReceiptChain(pair, receiptMap)) return false;
    const transferUse = category === "transfer" ? use : pair;
    const transferVisit = pairVisits.get(pair.visitId)?.category === "transfer"
      ? pairVisits.get(pair.visitId)
      : visits.get(use.visitId);
    const token = use.narrativeChoiceToken;
    if (transferVisit?.wordId === null && token !== null) return false;
    if (transferVisit?.wordId !== null && (typeof token !== "string" || !token)) return false;
    const finalReceipt = receiptMap.get(use.attemptReceiptIds.at(-1));
    return finalReceipt?.eventIds[0] === use.evidenceEventId
      && new Set(finalReceipt.useIds).size === 2
      && finalReceipt.useIds.includes(use.useId)
      && finalReceipt.useIds.includes(pair.useId);
  });
}

export function validContentDeckUses(state, category) {
  return deepFreeze(rawValidUses(state, category)
    .sort((left, right) => left.journeyStep - right.journeyStep
      || left.useId.localeCompare(right.useId)));
}

export function deriveContentDeckRecordStats(state, category, recordId) {
  const uses = validContentDeckUses(state, category).filter(use => use.recordId === recordId);
  const steps = uses.map(use => use.journeyStep);
  const activityCounts = {};
  const activityLastServed = {};
  if (category === "heartWords") {
    for (const use of uses) {
      activityCounts[use.activityType] = (activityCounts[use.activityType] || 0) + 1;
      activityLastServed[use.activityType] = Math.max(
        activityLastServed[use.activityType] || 0,
        use.journeyStep
      );
    }
  }
  return deepFreeze({
    firstServedStep: steps.length ? Math.min(...steps) : null,
    lastServedStep: steps.length ? Math.max(...steps) : null,
    useCount: uses.length,
    activityCounts,
    activityLastServed
  });
}

export function coverageStatus(rawState) {
  const state = asState(rawState);
  const categories = {};
  for (const category of CONTENT_DECK_CATEGORIES) {
    const catalogIds = new Set(getContentDeckCatalog(category).map(record => record.recordId));
    const covered = new Set();
    for (const use of validContentDeckUses(state, category)) {
      const served = rehydrateServedContentInstance(state.contentDecks, {
        category,
        visitId: use.visitId
      });
      if (!served || !catalogIds.has(use.recordId)) continue;
      const bindings = getContentDeckActionBindings(category, use.contentInstanceId);
      const binding = bindings.find(item => item.actionUseId === use.actionUseId);
      const owner = getContentDeckOwnerBinding(category, use.slotId);
      if (!binding || !owner || served.ownerActionUseId !== owner.actionUseId) continue;
      covered.add(use.recordId);
    }
    categories[category] = {
      coveredRecordCount: covered.size,
      totalRecordCount: COVERAGE_TOTALS[category]
    };
  }
  return deepFreeze({
    complete: CONTENT_DECK_CATEGORIES.every(category =>
      categories[category].coveredRecordCount === categories[category].totalRecordCount),
    categories
  });
}

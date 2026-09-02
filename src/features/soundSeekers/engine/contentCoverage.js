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
  normalizeSoundSeekersEvidenceEvent,
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

function canonicalJson(value) {
  if (Array.isArray(value)) return value.map(canonicalJson);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort()
    .map(key => [key, canonicalJson(value[key])]));
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

function asState(raw) {
  const value = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  return {
    ...value,
    contentDecks: createContentDeckState(value.contentDecks),
    attemptReceipts: normalizeAttemptReceipts(value.attemptReceipts),
    evidence: (Array.isArray(value.evidence) ? value.evidence : [])
      .map(normalizeSoundSeekersEvidenceEvent)
      .filter(Boolean)
  };
}

function receiptOrder(left, right) {
  return compareCanonicalIds(left.operation, right.operation)
    || compareCanonicalIds(left.subjectId, right.subjectId)
    || left.decisionOrdinal - right.decisionOrdinal
    || left.attemptOrdinal - right.attemptOrdinal
    || compareCanonicalIds(left.attemptId, right.attemptId);
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

  const placement = CONTENT_DECK_PLACEMENTS.find(item => item.placementId === receipt.subjectId);
  if (!event) {
    return placement?.category !== "alternatives"
      && receipt.decisionOrdinal === 0
      && receipt.attemptOrdinal === 0
      && receipt.completed === true
      && receipt.correctionRecordIds.length === 0
      && receipt.eventIds.length === 0
      && receipt.useIds.length === 1
      && referencedUses[0]?.category === "morphology";
  }
  if (placement?.category === "morphology") return false;
  if (event.correct) {
    if (placement?.category === "alternatives") {
      const finalOrdinal = placement.challengeTargetIds.length - 1;
      if (receipt.decisionOrdinal < finalOrdinal) {
        return receipt.correctionRecordIds.length === 0
          && receipt.useIds.length === 0
          && receipt.completed === false;
      }
      return receipt.decisionOrdinal === finalOrdinal
        && receipt.correctionRecordIds.length === 0
        && receipt.useIds.length === 1
        && receipt.completed === true
        && referencedUses[0]?.category === "alternatives";
    }
    return receipt.correctionRecordIds.length === 0
      && ((receipt.useIds.length === 0 && receipt.completed === false)
        || (receipt.useIds.length === 1
          && receipt.completed === true
          && referencedUses[0]?.category === "alternatives"));
  }
  return receipt.completed === false
    && exactArray(receipt.correctionRecordIds, [`content-correction:${receipt.attemptId}`])
    && receipt.useIds.length === 0;
}

export function validAttemptReceipts(rawState) {
  const state = asState(rawState);
  const evidenceGroups = new Map();
  for (const event of state.evidence) {
    if (!event?.id) continue;
    const group = evidenceGroups.get(event.id) || [];
    group.push(event);
    evidenceGroups.set(event.id, group);
  }
  const evidenceById = new Map([...evidenceGroups]
    .map(([id, group]) => {
      const hasConflict = group.some(event =>
        event.evidenceKind === "conflict" || event.conflicted === true);
      const distinctPayloads = new Set(group.map(event => JSON.stringify(canonicalJson(event))));
      return [id, !hasConflict && distinctPayloads.size === 1 ? group[0] : null];
    }));
  const rawUseGroups = new Map();
  for (const category of CONTENT_DECK_CATEGORIES) {
    for (const use of Object.values(state.contentDecks[category].uses)) {
      if (use?.kind !== "use") continue;
      const group = rawUseGroups.get(use.useId) || [];
      group.push(use);
      rawUseGroups.set(use.useId, group);
    }
  }
  const rawUses = new Map([...rawUseGroups]
    .map(([id, group]) => [id, group.length === 1 ? group[0] : null]));
  const receipts = Object.values(state.attemptReceipts)
    .filter(receipt => receipt.kind === "attempt_receipt")
    .sort(receiptOrder);
  const eventClaimCounts = new Map();
  const useClaimCounts = new Map();
  const ordinalClaimCounts = new Map();
  for (const receipt of receipts) {
    const ordinalClaim = [
      receipt.operation,
      receipt.subjectId,
      receipt.decisionOrdinal,
      receipt.attemptOrdinal
    ].join("\u0000");
    ordinalClaimCounts.set(ordinalClaim, (ordinalClaimCounts.get(ordinalClaim) || 0) + 1);
    for (const eventId of receipt.eventIds) {
      eventClaimCounts.set(eventId, (eventClaimCounts.get(eventId) || 0) + 1);
    }
    for (const useId of receipt.useIds) {
      useClaimCounts.set(useId, (useClaimCounts.get(useId) || 0) + 1);
    }
  }
  const preliminary = [];

  for (const receipt of receipts) {
    const ordinalClaim = [
      receipt.operation,
      receipt.subjectId,
      receipt.decisionOrdinal,
      receipt.attemptOrdinal
    ].join("\u0000");
    if (ordinalClaimCounts.get(ordinalClaim) !== 1) continue;
    if (expectedAttemptId(receipt) !== receipt.attemptId) continue;
    const events = receipt.eventIds.map(eventId => evidenceById.get(eventId));
    const uses = receipt.useIds.map(useId => rawUses.get(useId));
    if (events.some(event => !event) || uses.some(use => !use || use.kind !== "use")) continue;
    const event = events[0] || null;
    if (receipt.eventIds.length > 1
      || (event && !validEventForReceipt(event, receipt))
      || !receiptResultShape(receipt, event, uses)) continue;
    if (receipt.eventIds.some(id => eventClaimCounts.get(id) !== 1)
      || receipt.useIds.some(id => useClaimCounts.get(id) !== 1)) continue;
    preliminary.push(receipt);
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

function structurallyUniqueUseCandidates(state, category) {
  const visits = new Map(validContentDeckVisits(state.contentDecks, category)
    .map(visit => [visit.visitId, visit]));
  const claims = new Map();
  for (const use of Object.values(state.contentDecks[category].uses)) {
    if (use.kind !== "use") continue;
    const claim = `${use.visitId}\u0000${use.actionUseId}`;
    const group = claims.get(claim) || [];
    group.push(use);
    claims.set(claim, group);
  }
  const candidates = [...claims.values()]
    .filter(group => group.length === 1)
    .flat()
    .filter(use => parentValid(use, visits.get(use.visitId)));
  return { visits, candidates, candidateUseIds: new Set(candidates.map(use => use.useId)) };
}

function rawValidUses(rawState, category) {
  const state = asState(rawState);
  if (!CONTENT_DECK_CATEGORIES.includes(category)) return [];
  const { visits, candidates, candidateUseIds } = structurallyUniqueUseCandidates(
    state, category);
  const receiptMap = new Map(validAttemptReceipts(state)
    .map(receipt => [receipt.attemptId, receipt]));
  if (category === "heartWords") {
    return candidates.filter(use => {
      const visit = visits.get(use.visitId);
      if (use.actionUseId === visit.ownerActionUseId) {
        return use.activityType === visit.ownerActivityType;
      }
      const owner = state.contentDecks.heartWords.uses[`${visit.visitId}:${visit.ownerActionUseId}`];
      return owner?.kind === "use"
        && candidateUseIds.has(owner.useId)
        && parentValid(owner, visit)
        && owner.activityType === visit.ownerActivityType;
    });
  }
  const chained = candidates.filter(use => validReceiptChain(use, receiptMap));
  if (!new Set(["stories", "transfer"]).has(category)) return chained;
  return chained.filter(use => {
    const reciprocalCategory = category === "stories" ? "transfer" : "stories";
    const reciprocal = structurallyUniqueUseCandidates(state, reciprocalCategory);
    const pair = state.contentDecks[reciprocalCategory].uses[use.pairedUseId];
    const pairVisit = reciprocal.visits.get(pair?.visitId);
    const currentVisit = visits.get(use.visitId);
    if (!pair
      || pair.kind !== "use"
      || !reciprocal.candidateUseIds.has(pair.useId)
      || !parentValid(pair, pairVisit)
      || pairVisit.stopId !== currentVisit.stopId) return false;
    if (pair.pairedUseId !== use.useId
      || pair.transactionId !== use.transactionId
      || pair.evidenceEventId !== use.evidenceEventId
      || pair.narrativeChoiceToken !== use.narrativeChoiceToken
      || pair.journeyStep !== use.journeyStep
      || !exactArray(pair.attemptReceiptIds, use.attemptReceiptIds)
      || !validReceiptChain(pair, receiptMap)) return false;
    const transferVisit = pairVisit?.category === "transfer" ? pairVisit : currentVisit;
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
      || compareCanonicalIds(left.useId, right.useId)));
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
      if (!binding || !owner || served.ownerActionUseId !== owner.actionUseId
        || (category === "heartWords"
          && use.activityType !== binding.requiredActivityType)) continue;
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

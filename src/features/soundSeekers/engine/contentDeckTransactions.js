import { toChildChallengeView } from "./challengeContract.js";
import {
  CONTENT_DECK_PLACEMENTS,
  getContentDeckOwnerBinding
} from "../content/contentDeckBindings.js";
import { getContentDeckCatalogRecord } from "../content/contentDeckCatalogs.js";
import {
  validAttemptReceipts,
  validContentDeckUses
} from "./contentCoverage.js";
import {
  rehydrateServedContentInstance,
  serveContentDeck
} from "./contentDeckScheduler.js";
import {
  createContentDeckState,
  normalizeAttemptReceipts,
  normalizeContentDeckCheckpoint
} from "./contentDeckState.js";
import {
  appendEvidence,
  createLiteracyDecision
} from "./evidence.js";
import { bossNovelTargetId } from "./evidenceEligibility.js";
import { SOUND_SEEKERS_EXPEDITIONS } from "../content/expeditions.js";
import {
  assertInstructionMatchesChallenge,
  getInstructionContract
} from "../content/instructionContracts.js";
import { nextCorrection } from "../../../utils/questCorrection.js";

const CHALLENGE_CACHE = new WeakMap();

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function stringId(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
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

function sameValue(left, right) {
  return JSON.stringify(canonicalJson(left)) === JSON.stringify(canonicalJson(right));
}

function rotateRight(value, amount) {
  return (value >>> amount) | (value << (32 - amount));
}

function sha256(value) {
  const bytes = new TextEncoder().encode(value);
  const bitLength = bytes.length * 8;
  const paddedLength = Math.ceil((bytes.length + 9) / 64) * 64;
  const data = new Uint8Array(paddedLength);
  data.set(bytes);
  data[bytes.length] = 0x80;
  const view = new DataView(data.buffer);
  view.setUint32(paddedLength - 8, Math.floor(bitLength / 0x100000000), false);
  view.setUint32(paddedLength - 4, bitLength >>> 0, false);
  const constants = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];
  const hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];
  const words = new Uint32Array(64);
  for (let offset = 0; offset < data.length; offset += 64) {
    for (let index = 0; index < 16; index += 1) words[index] = view.getUint32(offset + index * 4, false);
    for (let index = 16; index < 64; index += 1) {
      const a = words[index - 15];
      const b = words[index - 2];
      const s0 = rotateRight(a, 7) ^ rotateRight(a, 18) ^ (a >>> 3);
      const s1 = rotateRight(b, 17) ^ rotateRight(b, 19) ^ (b >>> 10);
      words[index] = (words[index - 16] + s0 + words[index - 7] + s1) >>> 0;
    }
    let [a, b, c, d, e, f, g, h] = hash;
    for (let index = 0; index < 64; index += 1) {
      const s1 = rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25);
      const choice = (e & f) ^ (~e & g);
      const t1 = (h + s1 + choice + constants[index] + words[index]) >>> 0;
      const s0 = rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22);
      const majority = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (s0 + majority) >>> 0;
      h = g; g = f; f = e; e = (d + t1) >>> 0;
      d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    hash[0] = (hash[0] + a) >>> 0;
    hash[1] = (hash[1] + b) >>> 0;
    hash[2] = (hash[2] + c) >>> 0;
    hash[3] = (hash[3] + d) >>> 0;
    hash[4] = (hash[4] + e) >>> 0;
    hash[5] = (hash[5] + f) >>> 0;
    hash[6] = (hash[6] + g) >>> 0;
    hash[7] = (hash[7] + h) >>> 0;
  }
  return hash.map(word => word.toString(16).padStart(8, "0")).join("");
}

function inputSha256(value) {
  return sha256(JSON.stringify(canonicalJson(value)));
}

function normalizedState(raw) {
  const state = asObject(raw);
  const contentDecks = createContentDeckState(state.contentDecks);
  return {
    ...state,
    contentDecks,
    attemptReceipts: normalizeAttemptReceipts(state.attemptReceipts),
    evidence: Array.isArray(state.evidence) ? state.evidence : [],
    checkpoint: normalizeContentDeckCheckpoint(state.checkpoint, contentDecks)
  };
}

function withCheckpoint(state, key, descriptor) {
  return {
    ...state,
    checkpoint: {
      ...asObject(state.checkpoint),
      contentVersion: state.contentVersion || "sound-seekers-v2",
      [key]: descriptor
    }
  };
}

function withoutCheckpoint(state, key) {
  const checkpoint = { ...asObject(state.checkpoint) };
  delete checkpoint[key];
  return { ...state, checkpoint: Object.keys(checkpoint).length > 1 ? checkpoint : null };
}

function cacheChallenge(state, key, challenge) {
  if (!state || typeof state !== "object") return challenge;
  const cache = CHALLENGE_CACHE.get(state) || new Map();
  cache.set(key, challenge);
  CHALLENGE_CACHE.set(state, cache);
  return challenge;
}

function cachedChallenge(state, key) {
  return CHALLENGE_CACHE.get(state)?.get(key) || null;
}

function placementById(placementId) {
  const placement = CONTENT_DECK_PLACEMENTS.find(item => item.placementId === placementId);
  if (!placement) throw new Error("content placement identity is not registered");
  return placement;
}

function expeditionByStop(stopId) {
  const expedition = SOUND_SEEKERS_EXPEDITIONS.find(item => item.stopId === stopId);
  if (!expedition) throw new Error("story transfer stop is not registered");
  return expedition;
}

function placementAttemptId(descriptor, targetOrdinal = descriptor.targetOrdinal,
  attemptOrdinal = descriptor.attemptOrdinal) {
  return `content-placement-attempt:${descriptor.visitId}:${descriptor.placementId}:${targetOrdinal}:${attemptOrdinal}`;
}

function storyAttemptId(transactionId, attemptOrdinal) {
  return `story-transfer-attempt:${transactionId}:${attemptOrdinal}`;
}

function placementAttemptIdFromChallengeId(challengeId) {
  const value = stringId(challengeId);
  const marker = ":challenge:";
  const markerIndex = value?.lastIndexOf(marker) ?? -1;
  return markerIndex > 0 ? value.slice(0, markerIndex) : null;
}

function attemptView(descriptor, supportLevel, revealed) {
  return Object.freeze({
    attemptId: descriptor.attemptId,
    ...(descriptor.kind === "content_placement" ? { targetOrdinal: descriptor.targetOrdinal } : {}),
    attemptOrdinal: descriptor.attemptOrdinal,
    supportLevel,
    revealed
  });
}

function eventById(state, id) {
  return state.evidence.find(event => event?.id === id && event.evidenceKind !== "conflict") || null;
}

function receiptsFor(state, operation, subjectId) {
  return validAttemptReceipts(state)
    .filter(receipt => receipt.operation === operation && receipt.subjectId === subjectId)
    .sort((left, right) => left.decisionOrdinal - right.decisionOrdinal
      || left.attemptOrdinal - right.attemptOrdinal
      || (left.attemptId < right.attemptId ? -1 : left.attemptId > right.attemptId ? 1 : 0));
}

function correctionFromMiss(previous, { event, challenge, receipt }) {
  const correction = nextCorrection(previous || {}, {
    selected: event.confusion,
    intended: challenge.expectedToken,
    targetId: challenge.targetId,
    domain: challenge.recordsDomain,
    wordId: challenge.wordId ?? null,
    position: challenge.position ?? null,
    activityType: challenge.activityType ?? null,
    connectedTextId: challenge.connectedTextId ?? null,
    bossTransferId: challenge.bossTransferId ?? null,
    evidenceKind: "practice"
  });
  if (!correction) throw new Error("correction history cannot be reconstructed");
  return deepFreeze({
    ...correction,
    correctionRecordId: `content-correction:${receipt.attemptId}`
  });
}

function historicalResponse(event, challenge) {
  if (!event || typeof event.correct !== "boolean") {
    throw new Error("attempt receipt event history is invalid");
  }
  const token = event.correct ? challenge.expectedToken : event.confusion;
  const response = canonicalResponse({ kind: "literacy-answer", token });
  if (!challenge.optionTokens.includes(response.token)
    || event.correct !== (response.token === challenge.expectedToken)
    || event.confusion !== (event.correct ? null : response.token)) {
    throw new Error("attempt receipt event has an impossible correct/confusion relation");
  }
  return response;
}

function assertHistoricalReceiptCanonical(state, descriptor, receipt, challenge, event) {
  if (!event) return;
  const response = historicalResponse(event, challenge);
  const audio = { status: event.cueDelivery };
  const canonicalInput = descriptor.kind === "content_placement"
    ? canonicalPlacementInput(descriptor, {
      response,
      audio,
      at: event.at,
      sessionDay: event.sessionDay
    }, challenge)
    : canonicalStoryInput(descriptor, {
      response,
      audio,
      at: event.at,
      sessionDay: event.sessionDay
    }, challenge);
  const canonicalEvent = createLiteracyDecision({
    challenge,
    response,
    support: {
      level: Math.min(descriptor.attemptOrdinal, 3),
      revealed: descriptor.attemptOrdinal >= 3
    },
    audio,
    journeyStep: descriptor.journeyStep,
    ordinal: 0,
    at: event.at,
    sessionDay: event.sessionDay
  });
  if (!canonicalEvent || !sameValue(event, canonicalEvent)) {
    throw new Error("attempt receipt event does not match its fresh canonical challenge");
  }
  if (inputSha256(canonicalInput) !== receipt.inputSha256) {
    throw new Error("attempt receipt historical input fingerprint is divergent");
  }
}

function placementChallengeForDescriptor(state, descriptor) {
  const placement = placementById(descriptor.placementId);
  const served = rehydrateServedContentInstance(state.contentDecks, {
    category: placement.category,
    visitId: descriptor.visitId
  });
  if (!served
    || served.stopId !== placement.stopId
    || served.journeyStep !== descriptor.journeyStep
    || served.visitOwnerId !== placement.placementId) {
    throw new Error("content placement cannot rehydrate its canonical visit identity");
  }
  const record = getContentDeckCatalogRecord(placement.category, served.recordId);
  if (!record) throw new Error("content placement catalog record is missing");
  if (placement.category === "morphology") {
    if (descriptor.targetOrdinal !== 0) throw new Error("morphology has one non-recording target");
    const challenge = deepFreeze({
      challengeId: `${descriptor.attemptId}:challenge:0:morphology`,
      attemptId: descriptor.attemptId,
      targetOrdinal: 0,
      recordsDomain: null,
      powerId: placement.powerId,
      expectedAction: placement.expectedAction,
      instructionId: placement.instructionId,
      wordId: record.wordId,
      position: null,
      optionTokens: [],
      childText: record.childText,
      requiresAudio: false
    });
    assertInstructionMatchesChallenge(getInstructionContract(challenge.instructionId), challenge);
    return challenge;
  }
  const targetId = placement.challengeTargetIds[descriptor.targetOrdinal];
  const decision = record.comparisonFamilies.find(item => item.targetId === targetId);
  if (!decision) throw new Error("content placement target ordinal is outside the authored comparison family");
  const challenge = deepFreeze({
    challengeId: `${descriptor.attemptId}:challenge:${descriptor.targetOrdinal}:${targetId}`,
    attemptId: descriptor.attemptId,
    targetOrdinal: descriptor.targetOrdinal,
    targetId,
    recordsDomain: placement.recordsDomain,
    powerId: placement.powerId,
    expectedAction: placement.expectedAction,
    instructionId: placement.instructionId,
    position: null,
    optionTokens: decision.optionTokens,
    expectedToken: decision.expectedToken,
    childText: "Put this item with the matching sound.",
    requiresAudio: true
  });
  assertInstructionMatchesChallenge(getInstructionContract(challenge.instructionId), challenge);
  return challenge;
}

function replayPlacementHistory(state, descriptor, { throughAttemptId = null } = {}) {
  const receipts = receiptsFor(state, "content_placement", descriptor.placementId);
  let previousCorrection = null;
  let currentDecision = 0;
  let currentAttempt = 0;
  let found = false;
  for (const receipt of receipts) {
    if (receipt.decisionOrdinal !== currentDecision || receipt.attemptOrdinal !== currentAttempt) break;
    const historicalDescriptor = {
      ...descriptor,
      targetOrdinal: receipt.decisionOrdinal,
      attemptOrdinal: receipt.attemptOrdinal,
      attemptId: receipt.attemptId,
      stage: "response_pending"
    };
    const challenge = placementChallengeForDescriptor(state, historicalDescriptor);
    const event = receipt.eventIds.length ? eventById(state, receipt.eventIds[0]) : null;
    assertHistoricalReceiptCanonical(
      state,
      historicalDescriptor,
      receipt,
      challenge,
      event
    );
    let correction = null;
    if (event && !event.correct) {
      correction = correctionFromMiss(previousCorrection, { event, challenge, receipt });
      if (!receipt.correctionRecordIds.includes(correction.correctionRecordId)) {
        throw new Error("placement receipt correction history is inconsistent");
      }
      previousCorrection = correction;
      currentAttempt += 1;
    } else if (event?.correct) {
      previousCorrection = null;
      currentDecision += 1;
      currentAttempt = 0;
    } else if (receipt.eventIds.length === 0 && receipt.completed) {
      currentDecision += 1;
    }
    if (receipt.attemptId === throughAttemptId) {
      found = true;
      return { receipts, previousCorrection, currentDecision, currentAttempt, receipt, event, challenge, correction, found };
    }
  }
  return { receipts, previousCorrection, currentDecision, currentAttempt, found };
}

function assertPlacementDescriptorHistory(state, descriptor) {
  const history = replayPlacementHistory(state, descriptor);
  if (history.currentDecision !== descriptor.targetOrdinal
    || history.currentAttempt !== descriptor.attemptOrdinal) {
    throw new Error("content placement attempt does not match its receipt history");
  }
  if (descriptor.stage === "model_pending" && descriptor.attemptOrdinal !== 3) {
    throw new Error("content placement model is pending only after the third miss");
  }
  if (descriptor.attemptOrdinal >= 3
    && (!history.previousCorrection || history.previousCorrection.missCount < 3)) {
    throw new Error("content placement modeled support lacks a valid correction history");
  }
  return history;
}

export function beginContentPlacementAttempt(rawState, { placementId, visitId } = {}) {
  const state = normalizedState(rawState);
  const placement = placementById(placementId);
  if (state.checkpoint?.contentPlacement) {
    const pending = state.checkpoint.contentPlacement;
    if (pending.placementId !== placementId || pending.visitId !== visitId) {
      throw new Error("a different content placement is already pending");
    }
    const resumed = resumeContentPlacementAttempt(state, { placementId, visitId });
    return { nextState: state, attempt: resumed.attempt, challenge: resumed.challenge, correction: resumed.correction };
  }
  if (state.checkpoint?.storyTransfer) throw new Error("a story transfer is already pending");
  const served = rehydrateServedContentInstance(state.contentDecks, {
    category: placement.category,
    visitId
  });
  if (!served || served.visitOwnerId !== placement.placementId) {
    throw new Error("content placement requires its registered owner visit");
  }
  const descriptor = Object.freeze({
    kind: "content_placement",
    placementId: placement.placementId,
    category: placement.category,
    visitId: served.visitId,
    stopId: served.stopId,
    journeyStep: served.journeyStep,
    stage: "response_pending",
    targetOrdinal: 0,
    attemptOrdinal: 0,
    attemptId: `content-placement-attempt:${served.visitId}:${placement.placementId}:0:0`
  });
  const nextState = withCheckpoint(state, "contentPlacement", descriptor);
  const challenge = cacheChallenge(nextState, descriptor.attemptId,
    placementChallengeForDescriptor(nextState, descriptor));
  return Object.freeze({
    nextState,
    attempt: attemptView(descriptor, 0, false),
    challenge,
    correction: null
  });
}

export function resumeContentPlacementAttempt(rawState, { placementId, visitId } = {}) {
  const state = normalizedState(rawState);
  const descriptor = state.checkpoint?.contentPlacement;
  if (!descriptor
    || descriptor.kind !== "content_placement"
    || descriptor.placementId !== placementId
    || descriptor.visitId !== visitId
    || descriptor.attemptId !== placementAttemptId(descriptor)) {
    throw new Error("content placement resume identity is invalid");
  }
  placementById(placementId);
  rehydrateServedContentInstance(state.contentDecks, { category: descriptor.category, visitId });
  const history = assertPlacementDescriptorHistory(state, descriptor);
  const revealed = descriptor.attemptOrdinal >= 3 && descriptor.stage === "response_pending";
  const supportLevel = Math.min(descriptor.attemptOrdinal, 3);
  const challenge = descriptor.stage === "response_pending"
    ? materializeContentPlacementChallenge(rawState, { placementId, visitId })
    : null;
  return Object.freeze({
    attempt: attemptView(descriptor, supportLevel, revealed),
    challenge,
    served: rehydrateServedContentInstance(state.contentDecks, {
      category: descriptor.category,
      visitId
    }),
    correction: history.previousCorrection
  });
}

export function materializeContentPlacementChallenge(rawState, { placementId, visitId } = {}) {
  const state = normalizedState(rawState);
  const descriptor = state.checkpoint?.contentPlacement;
  if (!descriptor || descriptor.placementId !== placementId || descriptor.visitId !== visitId) {
    throw new Error("content placement challenge identity is invalid");
  }
  if (descriptor.stage !== "response_pending") throw new Error("content placement model is pending");
  assertPlacementDescriptorHistory(state, descriptor);
  const canonical = placementChallengeForDescriptor(state, descriptor);
  const cached = cachedChallenge(rawState, descriptor.attemptId);
  if (cached) {
    if (!sameValue(cached, canonical)) {
      throw new Error("cached content placement challenge no longer matches current authority");
    }
    return cached;
  }
  return cacheChallenge(rawState, descriptor.attemptId, canonical);
}

function canonicalResponse(response) {
  if (response?.kind === "literacy-answer"
    && (typeof response.token === "string" || typeof response.token === "number")) {
    return { kind: "literacy-answer", token: response.token };
  }
  if (response?.kind === "non-recording-complete") {
    const challengeId = stringId(response.challengeId);
    const action = stringId(response.action);
    if (challengeId && action) return { challengeId, kind: response.kind, action };
  }
  throw new Error("attempt response cannot be canonicalized");
}

function canonicalAudio(audio) {
  return { status: stringId(audio?.status) || "unavailable" };
}

function canonicalUtcTimestamp(at) {
  if (typeof at !== "string") throw new Error("attempt time must be RFC 3339 UTC");
  const parsed = new Date(at);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString() !== at) {
    throw new Error("attempt time must be RFC 3339 UTC");
  }
  return at;
}

function canonicalSessionDay(sessionDay) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(String(sessionDay || ""));
  if (!match) throw new Error("attempt session day is invalid");
  const date = new Date(`${sessionDay}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== sessionDay) {
    throw new Error("attempt session day is invalid");
  }
  return sessionDay;
}

function canonicalCorrection(descriptor) {
  return {
    supportLevel: Math.min(descriptor.attemptOrdinal, 3),
    revealed: descriptor.attemptOrdinal >= 3,
    modelStep: descriptor.attemptOrdinal < 3
      ? "not_required"
      : descriptor.stage === "model_pending" ? "pending" : "consumed"
  };
}

function canonicalPlacementInput(descriptor, input, challenge) {
  return canonicalJson({
    schemaVersion: 1,
    operation: "content_placement",
    subject: { placementId: descriptor.placementId, visitId: descriptor.visitId },
    attempt: {
      attemptId: descriptor.attemptId,
      decisionOrdinal: descriptor.targetOrdinal,
      attemptOrdinal: descriptor.attemptOrdinal
    },
    correction: canonicalCorrection(descriptor),
    challenge,
    response: canonicalResponse(input.response),
    audio: canonicalAudio(input.audio),
    at: canonicalUtcTimestamp(input.at),
    sessionDay: canonicalSessionDay(input.sessionDay)
  });
}

function addReceipt(state, receipt) {
  if (Object.prototype.hasOwnProperty.call(state.attemptReceipts, receipt.attemptId)) {
    throw new Error("immutable attempt receipt identity is already occupied");
  }
  return {
    ...state,
    attemptReceipts: normalizeAttemptReceipts({
      ...state.attemptReceipts,
      [receipt.attemptId]: receipt
    })
  };
}

function addNonHeartUses(state, category, uses) {
  for (const use of uses) {
    if (Object.prototype.hasOwnProperty.call(state.contentDecks[category].uses, use.useId)) {
      throw new Error("immutable content use identity is already occupied");
    }
  }
  return {
    ...state,
    contentDecks: createContentDeckState({
      ...state.contentDecks,
      [category]: {
        ...state.contentDecks[category],
        uses: Object.fromEntries([
          ...Object.entries(state.contentDecks[category].uses),
          ...uses.map(use => [use.useId, use])
        ])
      }
    })
  };
}

function baseNonHeartUse(served, binding, attemptReceiptIds) {
  return {
    kind: "use",
    useId: `${served.visitId}:${binding.actionUseId}`,
    visitId: served.visitId,
    contentInstanceId: served.contentInstanceId,
    visitOwnerId: served.visitOwnerId,
    actionUseId: binding.actionUseId,
    category: served.category,
    slotId: served.slotId,
    recordId: served.recordId,
    journeyStep: served.journeyStep,
    attemptReceiptIds
  };
}

function outcomeForReceipt(state, receipt, event, correction) {
  if (receipt.completed) return { outcome: "completed", completed: true, correction: null };
  if (event?.correct) return { outcome: "next_challenge", completed: false, correction: null };
  return {
    outcome: receipt.attemptOrdinal === 2 ? "model_required" : "retry",
    completed: false,
    correction
  };
}

function assertIdempotentReceiptDependencies(state, receipt) {
  if (!validAttemptReceipts(state).some(item => item.attemptId === receipt.attemptId)) {
    throw new Error("attempt receipt dependency chain is invalid");
  }
  if (!receipt.completed) return;
  if (receipt.operation === "content_placement") {
    const placement = placementById(receipt.subjectId);
    const validUseIds = new Set(validContentDeckUses(state, placement.category)
      .map(use => use.useId));
    if (!receipt.useIds.length || receipt.useIds.some(useId => !validUseIds.has(useId))) {
      throw new Error("completed placement receipt dependency chain is invalid");
    }
    return;
  }
  const validUseIds = new Set([
    ...validContentDeckUses(state, "stories"),
    ...validContentDeckUses(state, "transfer")
  ].map(use => use.useId));
  if (receipt.useIds.length !== 2 || receipt.useIds.some(useId => !validUseIds.has(useId))) {
    throw new Error("completed story receipt dependency chain is invalid");
  }
}

export function commitContentPlacementResponse(rawState, input = {}) {
  const state = normalizedState(rawState);
  const suppliedAttemptId = placementAttemptIdFromChallengeId(input.challenge?.challengeId);
  const existing = suppliedAttemptId ? state.attemptReceipts[suppliedAttemptId] : null;
  if (existing?.kind === "attempt_receipt") {
    if (stringId(input.placementId) !== existing.subjectId) {
      throw new Error("content placement retry subject identity is invalid");
    }
    assertIdempotentReceiptDependencies(state, existing);
    const placement = placementById(existing.subjectId);
    const descriptor = {
      kind: "content_placement",
      placementId: placement.placementId,
      category: placement.category,
      visitId: input.visitId,
      stopId: placement.stopId,
      journeyStep: rehydrateServedContentInstance(state.contentDecks, {
        category: placement.category,
        visitId: input.visitId
      })?.journeyStep,
      stage: "response_pending",
      targetOrdinal: existing.decisionOrdinal,
      attemptOrdinal: existing.attemptOrdinal,
      attemptId: existing.attemptId
    };
    const history = replayPlacementHistory(state, descriptor, { throughAttemptId: existing.attemptId });
    if (!history.found) throw new Error("attempt receipt is outside the canonical replay chain");
    const challenge = placementChallengeForDescriptor(state, descriptor);
    if (!sameValue(input.challenge, challenge)) {
      throw new Error("content placement retry challenge is not canonical");
    }
    const canonical = canonicalPlacementInput(descriptor, input, challenge);
    if (inputSha256(canonical) !== existing.inputSha256) {
      throw new Error("attempt receipt input fingerprint is divergent");
    }
    const event = existing.eventIds.length ? eventById(state, existing.eventIds[0]) : null;
    return deepFreeze({
      nextState: state,
      event,
      ...outcomeForReceipt(state, existing, event, history.correction)
    });
  }
  const descriptor = state.checkpoint?.contentPlacement;
  if (!descriptor || descriptor.placementId !== input.placementId || descriptor.visitId !== input.visitId) {
    throw new Error("content placement response identity is invalid");
  }
  if (descriptor.stage !== "response_pending") throw new Error("content placement model is pending");
  const history = assertPlacementDescriptorHistory(state, descriptor);
  const challenge = materializeContentPlacementChallenge(rawState, input);
  if (!sameValue(input.challenge, challenge)) throw new Error("content placement challenge is not canonical or was tampered");
  const placement = placementById(descriptor.placementId);
  const receiptIdsBefore = history.receipts.map(receipt => receipt.attemptId);

  if (placement.category === "morphology") {
    const expectedResponse = {
      challengeId: challenge.challengeId,
      kind: "non-recording-complete",
      action: "introduce_word_ending"
    };
    if (!sameValue(input.response, expectedResponse)) throw new Error("morphology completion response is invalid");
    const binding = getContentDeckOwnerBinding(placement.category, placement.slotId);
    const served = rehydrateServedContentInstance(state.contentDecks, {
      category: placement.category,
      visitId: descriptor.visitId
    });
    const receiptIds = [...receiptIdsBefore, descriptor.attemptId];
    const use = deepFreeze(baseNonHeartUse(served, binding, receiptIds));
    const canonical = canonicalPlacementInput(descriptor, input, challenge);
    const receipt = deepFreeze({
      kind: "attempt_receipt",
      attemptId: descriptor.attemptId,
      operation: "content_placement",
      subjectId: placement.placementId,
      decisionOrdinal: 0,
      attemptOrdinal: 0,
      inputSha256: inputSha256(canonical),
      completed: true,
      correctionRecordIds: [],
      eventIds: [],
      useIds: [use.useId]
    });
    let nextState = addReceipt(state, receipt);
    nextState = addNonHeartUses(nextState, placement.category, [use]);
    nextState = withoutCheckpoint(nextState, "contentPlacement");
    if (validContentDeckUses(nextState, "morphology").every(item => item.useId !== use.useId)) {
      throw new Error("morphology receipt/use candidate failed structural validation");
    }
    return deepFreeze({ nextState, event: null, outcome: "completed", completed: true, correction: null });
  }

  if (input.response?.kind !== "literacy-answer"
    || !challenge.optionTokens.includes(input.response.token)) {
    throw new Error("content placement response is outside the canonical options");
  }
  const support = {
    level: Math.min(descriptor.attemptOrdinal, 3),
    revealed: descriptor.attemptOrdinal >= 3
  };
  const event = createLiteracyDecision({
    challenge,
    response: input.response,
    support,
    audio: input.audio,
    journeyStep: descriptor.journeyStep,
    ordinal: 0,
    at: input.at,
    sessionDay: input.sessionDay
  });
  if (!event) throw new Error("content placement evidence input is invalid");
  if (state.evidence.some(item => item.id === event.id)) throw new Error("immutable event exists without its attempt receipt");
  const wrong = !event.correct;
  const correction = wrong
    ? correctionFromMiss(history.previousCorrection, {
      event,
      challenge,
      receipt: { attemptId: descriptor.attemptId }
    })
    : null;
  const isFinalTarget = descriptor.targetOrdinal === placement.challengeTargetIds.length - 1;
  let use = null;
  const receiptIds = [...receiptIdsBefore, descriptor.attemptId];
  if (!wrong && isFinalTarget) {
    const served = rehydrateServedContentInstance(state.contentDecks, {
      category: placement.category,
      visitId: descriptor.visitId
    });
    use = deepFreeze(baseNonHeartUse(served, placement.contentBinding, receiptIds));
  }
  const canonical = canonicalPlacementInput(descriptor, input, challenge);
  const receipt = deepFreeze({
    kind: "attempt_receipt",
    attemptId: descriptor.attemptId,
    operation: "content_placement",
    subjectId: placement.placementId,
    decisionOrdinal: descriptor.targetOrdinal,
    attemptOrdinal: descriptor.attemptOrdinal,
    inputSha256: inputSha256(canonical),
    completed: Boolean(!wrong && isFinalTarget),
    correctionRecordIds: correction ? [correction.correctionRecordId] : [],
    eventIds: [event.id],
    useIds: use ? [use.useId] : []
  });
  let nextState = {
    ...state,
    evidence: appendEvidence(state.evidence, event)
  };
  nextState = addReceipt(nextState, receipt);
  if (wrong) {
    const attemptOrdinal = descriptor.attemptOrdinal + 1;
    nextState = withCheckpoint(nextState, "contentPlacement", Object.freeze({
      ...descriptor,
      stage: attemptOrdinal === 3 ? "model_pending" : "response_pending",
      attemptOrdinal,
      attemptId: placementAttemptId(descriptor, descriptor.targetOrdinal, attemptOrdinal)
    }));
    return deepFreeze({
      nextState,
      event,
      outcome: attemptOrdinal === 3 ? "model_required" : "retry",
      completed: false,
      correction
    });
  }
  if (!isFinalTarget) {
    const targetOrdinal = descriptor.targetOrdinal + 1;
    nextState = withCheckpoint(nextState, "contentPlacement", Object.freeze({
      ...descriptor,
      stage: "response_pending",
      targetOrdinal,
      attemptOrdinal: 0,
      attemptId: placementAttemptId(descriptor, targetOrdinal, 0)
    }));
    return deepFreeze({ nextState, event, outcome: "next_challenge", completed: false, correction: null });
  }
  nextState = addNonHeartUses(nextState, placement.category, [use]);
  nextState = withoutCheckpoint(nextState, "contentPlacement");
  if (validContentDeckUses(nextState, "alternatives").every(item => item.useId !== use.useId)) {
    throw new Error("alternative receipt/use candidate failed structural validation");
  }
  return deepFreeze({ nextState, event, outcome: "completed", completed: true, correction: null });
}

export function completeContentPlacementCorrectionModel(rawState, { placementId, visitId } = {}) {
  const state = normalizedState(rawState);
  const descriptor = state.checkpoint?.contentPlacement;
  if (!descriptor || descriptor.placementId !== placementId || descriptor.visitId !== visitId) {
    throw new Error("content placement model identity is invalid");
  }
  if (descriptor.stage !== "model_pending" || descriptor.attemptOrdinal !== 3) {
    throw new Error("content placement model requires the exact third-miss stage");
  }
  const history = assertPlacementDescriptorHistory(state, descriptor);
  if (!history.previousCorrection?.modelOnce || history.previousCorrection.missCount !== 3) {
    throw new Error("content placement third-miss correction history is invalid");
  }
  const nextDescriptor = Object.freeze({ ...descriptor, stage: "response_pending" });
  const nextState = withCheckpoint(state, "contentPlacement", nextDescriptor);
  const challenge = cacheChallenge(nextState, nextDescriptor.attemptId,
    placementChallengeForDescriptor(nextState, nextDescriptor));
  return deepFreeze({
    nextState,
    attempt: attemptView(nextDescriptor, 3, true),
    challenge,
    correction: history.previousCorrection
  });
}

function storyTransactionFor(state, descriptor) {
  const expedition = expeditionByStop(descriptor.stopId);
  const storyVisitId = descriptor.storyVisitId;
  const transferVisitId = descriptor.transferVisitId;
  return deepFreeze({
    kind: "story_transfer",
    transactionId: descriptor.transactionId,
    stopId: descriptor.stopId,
    journeyStep: descriptor.journeyStep,
    boss: expedition.transfer.boss,
    storyVisitId,
    storyUseId: `${storyVisitId}:${descriptor.stopId}-story:content-use`,
    transferVisitId,
    transferUseId: `${transferVisitId}:${descriptor.stopId}-transfer:content-use`
  });
}

export function beginStoryTransferTransaction(rawState, { stopId, journeyStep, seed } = {}) {
  let state = normalizedState(rawState);
  if (state.checkpoint?.storyTransfer || state.checkpoint?.contentPlacement) {
    throw new Error("another content transaction is already pending");
  }
  const expedition = expeditionByStop(stopId);
  if (!Number.isSafeInteger(journeyStep) || journeyStep <= 0) {
    throw new Error("story transfer journey step is invalid");
  }
  const transactionId = `story-transfer:${journeyStep}:${stopId}`;
  const storyBinding = getContentDeckOwnerBinding("stories", `story-slot-${stopId}`);
  const transferBinding = getContentDeckOwnerBinding("transfer", `transfer-slot-${stopId}`);
  const storyVisitId = `visit:${transactionId}:story`;
  const transferVisitId = `visit:${transactionId}:transfer`;
  const storyServed = serveContentDeck(state.contentDecks, {
    binding: storyBinding,
    visitId: storyVisitId,
    stopId,
    journeyStep,
    seed
  });
  const transferServed = serveContentDeck(storyServed.nextState, {
    binding: transferBinding,
    visitId: transferVisitId,
    stopId,
    journeyStep,
    seed
  });
  state = { ...state, contentDecks: transferServed.nextState };
  const descriptor = {
    transactionId,
    stopId,
    journeyStep,
    storyVisitId,
    transferVisitId
  };
  const transaction = storyTransactionFor(state, descriptor);
  if (transaction.boss !== expedition.transfer.boss) throw new Error("story transfer boss identity mismatch");
  return deepFreeze({ nextState: state, transaction });
}

export function checkpointStoryTransferTransaction(rawState, {
  transactionId,
  narrativeChoiceToken
} = {}) {
  const state = normalizedState(rawState);
  if (state.checkpoint?.storyTransfer || state.checkpoint?.contentPlacement) {
    throw new Error("another content transaction is already pending");
  }
  const match = /^story-transfer:(\d+):(s(?:[1-9]|[1-3][0-9]|40))$/u.exec(String(transactionId || ""));
  if (!match) throw new Error("story transfer transaction identity is invalid");
  const journeyStep = Number(match[1]);
  const stopId = match[2];
  const expedition = expeditionByStop(stopId);
  const token = stringId(narrativeChoiceToken);
  if (expedition.transfer.boss ? !token : narrativeChoiceToken !== null) {
    throw new Error(expedition.transfer.boss
      ? "boss story transfer needs a nonempty narrative token"
      : "non-boss story transfer narrative token must be null");
  }
  const storyVisitId = `visit:${transactionId}:story`;
  const transferVisitId = `visit:${transactionId}:transfer`;
  const story = rehydrateServedContentInstance(state.contentDecks, {
    category: "stories", visitId: storyVisitId
  });
  const transfer = rehydrateServedContentInstance(state.contentDecks, {
    category: "transfer", visitId: transferVisitId
  });
  if (!story || !transfer || story.stopId !== stopId || transfer.stopId !== stopId
    || story.journeyStep !== journeyStep || transfer.journeyStep !== journeyStep) {
    throw new Error("story transfer visits cannot be rehydrated");
  }
  const descriptor = Object.freeze({
    kind: "story_transfer",
    transactionId,
    stopId,
    journeyStep,
    stage: "response_pending",
    storyVisitId,
    transferVisitId,
    narrativeChoiceToken: expedition.transfer.boss ? token : null,
    attemptOrdinal: 0,
    attemptId: storyAttemptId(transactionId, 0)
  });
  return withCheckpoint(state, "storyTransfer", descriptor);
}

function storyChallengeForDescriptor(state, descriptor) {
  const expedition = expeditionByStop(descriptor.stopId);
  const record = getContentDeckCatalogRecord("transfer", `transfer:${descriptor.stopId}`);
  const transferServed = rehydrateServedContentInstance(state.contentDecks, {
    category: "transfer",
    visitId: descriptor.transferVisitId
  });
  if (!record || !transferServed || transferServed.recordId !== record.recordId) {
    throw new Error("story transfer canonical record cannot be rehydrated");
  }
  const boss = expedition.transfer.boss;
  if (boss && bossNovelTargetId({
    wordId: record.wordId,
    bossTransferId: record.bossTransferId
  }) !== record.targetId) throw new Error("boss transfer identity is inconsistent");
  const challenge = deepFreeze({
    challengeId: `${descriptor.attemptId}:${boss ? "boss" : "transfer"}`,
    attemptId: descriptor.attemptId,
    targetId: record.targetId,
    recordsDomain: record.recordsDomain,
    powerId: record.powerId,
    expectedAction: record.expectedAction,
    instructionId: record.instructionId,
    ...(boss ? {
      wordId: record.wordId,
      position: "whole",
      bossTransferId: record.bossTransferId,
      connectedTextId: null
    } : { connectedTextId: record.connectedTextId }),
    optionTokens: record.decisionContract.optionTokens,
    expectedToken: record.decisionContract.expectedToken,
    childText: boss ? "Blend the new word. Choose its picture." : "Choose the action that matches the story.",
    requiresAudio: false
  });
  assertInstructionMatchesChallenge(getInstructionContract(challenge.instructionId), challenge);
  return challenge;
}

function replayStoryHistory(state, descriptor, { throughAttemptId = null } = {}) {
  const receipts = receiptsFor(state, "story_transfer", descriptor.transactionId);
  let previousCorrection = null;
  let currentAttempt = 0;
  for (const receipt of receipts) {
    if (receipt.decisionOrdinal !== 0 || receipt.attemptOrdinal !== currentAttempt) break;
    const historical = { ...descriptor, attemptOrdinal: receipt.attemptOrdinal,
      attemptId: receipt.attemptId, stage: "response_pending" };
    const challenge = storyChallengeForDescriptor(state, historical);
    const event = receipt.eventIds.length ? eventById(state, receipt.eventIds[0]) : null;
    assertHistoricalReceiptCanonical(state, historical, receipt, challenge, event);
    let correction = null;
    if (event && !event.correct) {
      correction = correctionFromMiss(previousCorrection, { event, challenge, receipt });
      if (!receipt.correctionRecordIds.includes(correction.correctionRecordId)) {
        throw new Error("story receipt correction history is inconsistent");
      }
      previousCorrection = correction;
      currentAttempt += 1;
    } else if (event?.correct) {
      currentAttempt += 1;
    }
    if (receipt.attemptId === throughAttemptId) {
      return { receipts, previousCorrection, currentAttempt, receipt, event, challenge, correction, found: true };
    }
  }
  return { receipts, previousCorrection, currentAttempt, found: false };
}

function assertStoryDescriptorHistory(state, descriptor) {
  const history = replayStoryHistory(state, descriptor);
  if (history.receipts.some(receipt => receipt.completed)
    || history.currentAttempt !== descriptor.attemptOrdinal) {
    throw new Error("story transfer attempt does not match its receipt history");
  }
  if (descriptor.stage === "model_pending" && descriptor.attemptOrdinal !== 3) {
    throw new Error("story transfer model is pending only after the third miss");
  }
  if (descriptor.attemptOrdinal >= 3
    && (!history.previousCorrection || history.previousCorrection.missCount < 3)) {
    throw new Error("story transfer modeled support lacks a valid correction history");
  }
  return history;
}

export function resumeStoryTransferTransaction(rawState, { transactionId } = {}) {
  const state = normalizedState(rawState);
  const descriptor = state.checkpoint?.storyTransfer;
  if (!descriptor || descriptor.transactionId !== transactionId
    || descriptor.attemptId !== storyAttemptId(transactionId, descriptor.attemptOrdinal)) {
    throw new Error("story transfer resume identity is invalid");
  }
  const history = assertStoryDescriptorHistory(state, descriptor);
  const storyServed = rehydrateServedContentInstance(state.contentDecks, {
    category: "stories", visitId: descriptor.storyVisitId
  });
  const transferServed = rehydrateServedContentInstance(state.contentDecks, {
    category: "transfer", visitId: descriptor.transferVisitId
  });
  if (!storyServed || !transferServed) throw new Error("story transfer visits are invalid");
  const revealed = descriptor.attemptOrdinal >= 3 && descriptor.stage === "response_pending";
  const result = {
    transaction: storyTransactionFor(state, descriptor),
    attempt: attemptView(descriptor, Math.min(descriptor.attemptOrdinal, 3), revealed),
    storyServed,
    transferServed,
    correction: history.previousCorrection
  };
  return deepFreeze(result);
}

export function materializeStoryTransferChallenge(rawState, { transactionId } = {}) {
  const state = normalizedState(rawState);
  const descriptor = state.checkpoint?.storyTransfer;
  if (!descriptor || descriptor.transactionId !== transactionId) {
    throw new Error("story transfer challenge identity is invalid");
  }
  if (descriptor.stage !== "response_pending") throw new Error("story transfer model is pending");
  assertStoryDescriptorHistory(state, descriptor);
  const canonical = storyChallengeForDescriptor(state, descriptor);
  const cached = cachedChallenge(rawState, descriptor.attemptId);
  if (cached) {
    if (!sameValue(cached, canonical)) {
      throw new Error("cached story transfer challenge no longer matches current authority");
    }
    return cached;
  }
  return cacheChallenge(rawState, descriptor.attemptId, canonical);
}

export function materializeBossTransferChallenge(rawState, { transactionId } = {}) {
  const descriptor = rawState?.checkpoint?.storyTransfer;
  const expedition = expeditionByStop(descriptor?.stopId);
  if (!expedition.transfer.boss) throw new Error("story transfer is not a boss decision");
  return materializeStoryTransferChallenge(rawState, { transactionId });
}

export function projectBossTransferOptionsForChild(rawState, { transactionId } = {}) {
  const challenge = materializeBossTransferChallenge(rawState, { transactionId });
  const state = normalizedState(rawState);
  const record = getContentDeckCatalogRecord("transfer", `transfer:${state.checkpoint.storyTransfer.stopId}`);
  if (!record?.bossDecision
    || !sameValue(challenge.optionTokens, record.bossDecision.options.map(option => option.token))) {
    throw new Error("canonical boss decision options are invalid");
  }
  return record.bossDecision.options;
}

function canonicalStoryInput(descriptor, input, challenge) {
  return canonicalJson({
    schemaVersion: 1,
    operation: "story_transfer",
    subject: { transactionId: descriptor.transactionId },
    attempt: {
      attemptId: descriptor.attemptId,
      decisionOrdinal: 0,
      attemptOrdinal: descriptor.attemptOrdinal
    },
    correction: canonicalCorrection(descriptor),
    challenge,
    response: canonicalResponse(input.response),
    audio: canonicalAudio(input.audio),
    at: canonicalUtcTimestamp(input.at),
    sessionDay: canonicalSessionDay(input.sessionDay)
  });
}

function storyIdempotentResult(state, input, receipt) {
  if (stringId(input.transactionId) !== receipt.subjectId) {
    throw new Error("story transfer retry subject identity is invalid");
  }
  assertIdempotentReceiptDependencies(state, receipt);
  const checkpoint = state.checkpoint?.storyTransfer;
  const stopId = checkpoint?.stopId
    || /^story-transfer:\d+:(s\d+)$/u.exec(receipt.subjectId)?.[1];
  const journeyStep = checkpoint?.journeyStep
    || Number(/^story-transfer:(\d+):/u.exec(receipt.subjectId)?.[1]);
  const descriptor = {
    kind: "story_transfer",
    transactionId: receipt.subjectId,
    stopId,
    journeyStep,
    storyVisitId: `visit:${receipt.subjectId}:story`,
    transferVisitId: `visit:${receipt.subjectId}:transfer`,
    narrativeChoiceToken: state.contentDecks.stories.uses[receipt.useIds[0]]?.narrativeChoiceToken
      ?? checkpoint?.narrativeChoiceToken
      ?? null,
    stage: "response_pending",
    attemptOrdinal: receipt.attemptOrdinal,
    attemptId: receipt.attemptId
  };
  const challenge = storyChallengeForDescriptor(state, descriptor);
  if (!sameValue(input.challenge, challenge)) {
    throw new Error("story transfer retry challenge is not canonical");
  }
  const canonical = canonicalStoryInput(descriptor, input, challenge);
  if (inputSha256(canonical) !== receipt.inputSha256) {
    throw new Error("attempt receipt input fingerprint is divergent");
  }
  const history = replayStoryHistory(state, descriptor, { throughAttemptId: receipt.attemptId });
  if (!history.found) throw new Error("attempt receipt is outside the canonical replay chain");
  const event = receipt.eventIds.length ? eventById(state, receipt.eventIds[0]) : null;
  return deepFreeze({ nextState: state, event,
    ...outcomeForReceipt(state, receipt, event, history.correction) });
}

export function completeStoryTransferTransaction(rawState, input = {}) {
  const state = normalizedState(rawState);
  const suppliedAttemptId = stringId(input.challenge?.attemptId);
  const existing = suppliedAttemptId ? state.attemptReceipts[suppliedAttemptId] : null;
  if (existing?.kind === "attempt_receipt" && existing.operation === "story_transfer") {
    return storyIdempotentResult(state, input, existing);
  }
  const descriptor = state.checkpoint?.storyTransfer;
  if (!descriptor || descriptor.transactionId !== input.transactionId) {
    throw new Error("story transfer response identity is invalid");
  }
  if (descriptor.stage !== "response_pending") throw new Error("story transfer model is pending");
  const history = assertStoryDescriptorHistory(state, descriptor);
  const challenge = materializeStoryTransferChallenge(rawState, input);
  if (!sameValue(input.challenge, challenge)) throw new Error("fresh materialized story challenge is not canonical");
  if (input.response?.kind !== "literacy-answer"
    || !challenge.optionTokens.includes(input.response.token)) {
    throw new Error("story transfer response is outside the canonical options");
  }
  const event = createLiteracyDecision({
    challenge,
    response: input.response,
    support: {
      level: Math.min(descriptor.attemptOrdinal, 3),
      revealed: descriptor.attemptOrdinal >= 3
    },
    audio: input.audio,
    journeyStep: descriptor.journeyStep,
    ordinal: 0,
    at: input.at,
    sessionDay: input.sessionDay
  });
  if (!event) throw new Error("story transfer evidence input is invalid");
  if (state.evidence.some(item => item.id === event.id)) throw new Error("immutable event exists without its attempt receipt");
  const wrong = !event.correct;
  const correction = wrong
    ? correctionFromMiss(history.previousCorrection, {
      event,
      challenge,
      receipt: { attemptId: descriptor.attemptId }
    })
    : null;
  let storyUse = null;
  let transferUse = null;
  const receiptIds = [...history.receipts.map(receipt => receipt.attemptId), descriptor.attemptId];
  if (!wrong) {
    const storyServed = rehydrateServedContentInstance(state.contentDecks, {
      category: "stories", visitId: descriptor.storyVisitId
    });
    const transferServed = rehydrateServedContentInstance(state.contentDecks, {
      category: "transfer", visitId: descriptor.transferVisitId
    });
    const storyBinding = getContentDeckOwnerBinding("stories", storyServed.slotId);
    const transferBinding = getContentDeckOwnerBinding("transfer", transferServed.slotId);
    const transaction = storyTransactionFor(state, descriptor);
    storyUse = {
      ...baseNonHeartUse(storyServed, storyBinding, receiptIds),
      transactionId: descriptor.transactionId,
      pairedUseId: transaction.transferUseId,
      evidenceEventId: event.id,
      narrativeChoiceToken: descriptor.narrativeChoiceToken
    };
    transferUse = {
      ...baseNonHeartUse(transferServed, transferBinding, receiptIds),
      transactionId: descriptor.transactionId,
      pairedUseId: transaction.storyUseId,
      evidenceEventId: event.id,
      narrativeChoiceToken: descriptor.narrativeChoiceToken
    };
    storyUse = deepFreeze(storyUse);
    transferUse = deepFreeze(transferUse);
  }
  const canonical = canonicalStoryInput(descriptor, input, challenge);
  const receipt = deepFreeze({
    kind: "attempt_receipt",
    attemptId: descriptor.attemptId,
    operation: "story_transfer",
    subjectId: descriptor.transactionId,
    decisionOrdinal: 0,
    attemptOrdinal: descriptor.attemptOrdinal,
    inputSha256: inputSha256(canonical),
    completed: !wrong,
    correctionRecordIds: correction ? [correction.correctionRecordId] : [],
    eventIds: [event.id],
    useIds: wrong ? [] : [storyUse.useId, transferUse.useId]
  });
  let nextState = { ...state, evidence: appendEvidence(state.evidence, event) };
  nextState = addReceipt(nextState, receipt);
  if (wrong) {
    const attemptOrdinal = descriptor.attemptOrdinal + 1;
    nextState = withCheckpoint(nextState, "storyTransfer", Object.freeze({
      ...descriptor,
      stage: attemptOrdinal === 3 ? "model_pending" : "response_pending",
      attemptOrdinal,
      attemptId: storyAttemptId(descriptor.transactionId, attemptOrdinal)
    }));
    return deepFreeze({
      nextState,
      event,
      outcome: attemptOrdinal === 3 ? "model_required" : "retry",
      completed: false,
      correction
    });
  }
  nextState = addNonHeartUses(nextState, "stories", [storyUse]);
  nextState = addNonHeartUses(nextState, "transfer", [transferUse]);
  nextState = withoutCheckpoint(nextState, "storyTransfer");
  if (!validContentDeckUses(nextState, "stories").some(use => use.useId === storyUse.useId)
    || !validContentDeckUses(nextState, "transfer").some(use => use.useId === transferUse.useId)) {
    throw new Error("story transfer reciprocal receipt/use candidate failed structural validation");
  }
  return deepFreeze({ nextState, event, outcome: "completed", completed: true, correction: null });
}

export function completeStoryTransferCorrectionModel(rawState, { transactionId } = {}) {
  const state = normalizedState(rawState);
  const descriptor = state.checkpoint?.storyTransfer;
  if (!descriptor || descriptor.transactionId !== transactionId) {
    throw new Error("story transfer model identity is invalid");
  }
  if (descriptor.stage !== "model_pending" || descriptor.attemptOrdinal !== 3) {
    throw new Error("story transfer model requires the exact third-miss stage");
  }
  const history = assertStoryDescriptorHistory(state, descriptor);
  if (!history.previousCorrection?.modelOnce || history.previousCorrection.missCount !== 3) {
    throw new Error("story transfer third-miss correction history is invalid");
  }
  const nextDescriptor = Object.freeze({ ...descriptor, stage: "response_pending" });
  const nextState = withCheckpoint(state, "storyTransfer", nextDescriptor);
  const challenge = cacheChallenge(nextState, nextDescriptor.attemptId,
    storyChallengeForDescriptor(nextState, nextDescriptor));
  return deepFreeze({
    nextState,
    attempt: attemptView(nextDescriptor, 3, true),
    challenge,
    correction: history.previousCorrection
  });
}

void toChildChallengeView;

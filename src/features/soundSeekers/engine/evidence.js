import { isRecordableQuestChallenge } from "./challengeContract.js";
import {
  EVIDENCE_DOMAINS,
  normalizeHeartWordActivityType
} from "./evidenceEligibility.js";
import { getInstructionContract } from "../content/instructionContracts.js";
import { consumeCompletedAudioDeliveryReceipt } from "./audioControllerAuthority.js";

import {
  AUDIO_COMPLETED,
  isValidSessionDay,
  localSessionDayFor,
  normalizedEvidenceAt
} from "./evidenceReadPolicy.js";
export { evidenceIsIndependent, isValidSessionDay, localSessionDayFor } from "./evidenceReadPolicy.js";

function finiteNonNegative(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : fallback;
}

function responseToken(response) {
  return typeof response?.token === "string" || typeof response?.token === "number"
    ? response.token
    : null;
}

function eventId(event) {
  return typeof event?.id === "string" && event.id ? event.id : null;
}

function sessionDayFor(sessionDay, at) {
  if (sessionDay !== undefined && sessionDay !== null) {
    return isValidSessionDay(sessionDay) ? sessionDay : null;
  }
  return localSessionDayFor(at);
}

function instructionAudioRequest(challenge) {
  const contract = getInstructionContract(challenge?.instructionId);
  if (!contract) return null;
  return Object.freeze({
    cueId: `instruction:${contract.instructionId}`,
    audioKey: contract.childAudio,
    visibleText: contract.childText,
    spokenText: contract.childText,
    kind: "instruction",
    requiresAudio: true
  });
}

function deriveLiteracyDecision({
  challenge,
  response,
  support = {},
  cueDelivery = "unavailable",
  journeyStep = null,
  ordinal,
  at = null,
  sessionDay
} = {}) {
  if (!isRecordableQuestChallenge(challenge) || response?.kind !== "literacy-answer") return null;
  if (!Number.isInteger(ordinal) || ordinal < 0) return null;
  const token = responseToken(response);
  if (token === null) return null;
  const eventAt = normalizedEvidenceAt(at);
  if (!eventAt) return null;
  const resolvedSessionDay = sessionDayFor(sessionDay, eventAt);
  if (!resolvedSessionDay) return null;

  const correct = token === challenge.expectedToken;
  const supportLevel = finiteNonNegative(support?.level);
  const event = {
    id: `${challenge.attemptId}:${ordinal}`,
    target: challenge.targetId,
    domain: challenge.recordsDomain,
    correct,
    supportLevel,
    revealed: Boolean(support?.revealed),
    cueDelivery,
    audioRequired: challenge.requiresAudio !== false,
    confusion: correct ? null : token,
    word: challenge.wordId || null,
    position: challenge.position ?? null,
    connectedTextId: challenge.connectedTextId || null,
    bossTransferId: challenge.bossTransferId || null,
    mechanic: challenge.powerId || null,
    journeyStep: Number.isFinite(Number(journeyStep)) ? Number(journeyStep) : null,
    at: eventAt,
    sessionDay: resolvedSessionDay,
    evidenceKind: "practice"
  };
  if (challenge.recordsDomain === EVIDENCE_DOMAINS.HEART_WORD_MAPPING) {
    const activityType = normalizeHeartWordActivityType(challenge.activityType);
    if (!activityType) return null;
    event.activityType = activityType;
  }
  return Object.freeze(event);
}

// One explicit answer is the only input accepted by this boundary. Movement,
// timing, collisions, rewards, and reducer transitions do not enter here.
export function createLiteracyDecision({
  challenge,
  response,
  support = {},
  audio = {},
  audioAuthority,
  journeyStep = null,
  ordinal,
  at = null,
  sessionDay
} = {}) {
  let cueDelivery = typeof audio?.status === "string" ? audio.status : "unavailable";
  if (challenge?.requiresAudio !== false) {
    const request = instructionAudioRequest(challenge);
    if (!request || !consumeCompletedAudioDeliveryReceipt(
      audio, request, audioAuthority
    )) return null;
    cueDelivery = AUDIO_COMPLETED;
  }
  return deriveLiteracyDecision({
    challenge,
    response,
    support,
    cueDelivery,
    journeyStep,
    ordinal,
    at,
    sessionDay
  });
}

export function storedLiteracyDecisionMatches(event, input = {}) {
  const expected = deriveLiteracyDecision({
    ...input,
    cueDelivery: typeof event?.cueDelivery === "string" ? event.cueDelivery : "unavailable"
  });
  return Boolean(expected && event
    && JSON.stringify(expected) === JSON.stringify(event));
}

// Idempotency is by immutable event ID, including duplicate delivery retries.
export function appendEvidence(events, event) {
  const result = [];
  const ids = new Set();
  for (const item of Array.isArray(events) ? events : []) {
    const id = eventId(item);
    if (id && !ids.has(id)) {
      ids.add(id);
      result.push(item);
    }
  }
  const id = eventId(event);
  if (id && !ids.has(id)) result.push(event);
  return result;
}

// Flat keys fit the v2 persisted count-map and retain both the target and the
// selected distractor without pretending a wrong answer belongs to another one.
export function deriveConfusions(events) {
  const confusions = {};
  for (const event of Array.isArray(events) ? events : []) {
    if (
      event?.evidenceKind === "practice"
      && event.correct === false
      && typeof event.target === "string"
      && event.target
      && (typeof event.confusion === "string" || typeof event.confusion === "number")
    ) {
      const key = `${event.target}:${event.confusion}`;
      confusions[key] = (confusions[key] || 0) + 1;
    }
  }
  return confusions;
}

import { isRecordableQuestChallenge } from "./challengeContract.js";

const AUDIO_COMPLETED = "completed";

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

// One explicit answer is the only input accepted by this boundary. Movement,
// timing, collisions, rewards, and reducer transitions do not enter here.
export function createLiteracyDecision({
  challenge,
  response,
  support = {},
  audio = {},
  journeyStep = null,
  ordinal,
  at = null
} = {}) {
  if (!isRecordableQuestChallenge(challenge) || response?.kind !== "literacy-answer") return null;
  if (!Number.isInteger(ordinal) || ordinal < 0) return null;
  const token = responseToken(response);
  if (token === null) return null;

  const correct = token === challenge.expectedToken;
  const supportLevel = finiteNonNegative(support?.level);
  const event = {
    id: `${challenge.attemptId}:${ordinal}`,
    target: challenge.targetId,
    domain: challenge.recordsDomain,
    correct,
    supportLevel,
    revealed: Boolean(support?.revealed),
    cueDelivery: typeof audio?.status === "string" ? audio.status : "unavailable",
    audioRequired: challenge.requiresAudio !== false,
    confusion: correct ? null : token,
    word: challenge.wordId || null,
    position: challenge.position ?? null,
    mechanic: challenge.powerId || null,
    journeyStep: Number.isFinite(Number(journeyStep)) ? Number(journeyStep) : null,
    at,
    evidenceKind: "practice"
  };
  return Object.freeze(event);
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

export function evidenceIsIndependent(event) {
  if (!event || event.evidenceKind !== "practice") return false;
  if (finiteNonNegative(event.supportLevel) !== 0 || event.revealed === true) return false;
  return event.audioRequired === false || event.cueDelivery === AUDIO_COMPLETED;
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

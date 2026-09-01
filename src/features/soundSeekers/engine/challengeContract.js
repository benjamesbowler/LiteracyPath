import {
  EVIDENCE_DOMAINS,
  EVIDENCE_DOMAIN_VALUES,
  isEvidenceDomain,
  validateEvidencePath
} from "./evidenceEligibility.js";

export { EVIDENCE_DOMAINS, EVIDENCE_DOMAIN_VALUES, isEvidenceDomain };

// The answer key belongs to the reducer-side challenge only. Renderers receive
// a small, safe view model and can never decide whether a child is correct.
const CHILD_CHALLENGE_FIELDS = Object.freeze([
  "challengeId",
  "targetId",
  "recordsDomain",
  "powerId",
  "wordId",
  "position",
  "activityType",
  "connectedTextId",
  "bossTransferId",
  "optionTokens",
  "childText",
  "instruction",
  "prompt",
  "cue",
  "requiresAudio"
]);

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isToken(value) {
  return typeof value === "string" || typeof value === "number";
}

// A non-recording challenge is valid only when it has no answer key. This
// keeps narrative or travel steps safely outside the learning ledger.
export function validateQuestChallenge(challenge) {
  const value = challenge && typeof challenge === "object" && !Array.isArray(challenge)
    ? challenge
    : null;
  const errors = [];
  if (!value) return { valid: false, errors: ["challenge must be an object"] };

  const recordable = value.recordsDomain !== null && value.recordsDomain !== undefined;
  if (recordable) {
    if (!isNonEmptyString(value.attemptId)) errors.push("recordable challenge needs attemptId");
    if (!isNonEmptyString(value.targetId)) errors.push("recordable challenge needs targetId");
    if (!isEvidenceDomain(value.recordsDomain)) errors.push("recordsDomain is not allowed");
    const eligibility = validateEvidencePath(value);
    if (!eligibility.valid) errors.push(...eligibility.errors);
    if (!isToken(value.expectedToken) || String(value.expectedToken).length === 0) {
      errors.push("recordable challenge needs expectedToken");
    }
    if (Object.prototype.hasOwnProperty.call(value, "isCorrect")) {
      errors.push("challenge must not carry renderer correctness");
    }
    if (value.optionTokens !== undefined && (
      !Array.isArray(value.optionTokens)
      || !value.optionTokens.every(isToken)
      || !value.optionTokens.some(token => token === value.expectedToken)
    )) {
      errors.push("optionTokens must include the internal expectedToken");
    }
  } else if (Object.prototype.hasOwnProperty.call(value, "expectedToken")) {
    errors.push("non-recording challenge must not carry expectedToken");
  }

  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors) });
}

export function isRecordableQuestChallenge(challenge) {
  return Boolean(challenge?.recordsDomain) && validateQuestChallenge(challenge).valid;
}

export function toChildChallengeView(challenge) {
  const validation = validateQuestChallenge(challenge);
  if (!validation.valid) return null;
  const view = {};
  for (const key of CHILD_CHALLENGE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(challenge, key)) view[key] = challenge[key];
  }
  return Object.freeze(view);
}

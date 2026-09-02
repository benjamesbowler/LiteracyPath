import {
  isRecordableQuestChallenge,
  toChildChallengeView,
  validateQuestChallenge
} from "../challengeContract.js";
import {
  assertInstructionMatchesChallenge,
  getInstructionContract
} from "../../content/instructionContracts.js";
import { SOUND_SEEKERS_INTERACTION_CONTEXTS } from "../../content/expeditions.js";

const INTERACTION_CONTEXT_FIELDS = Object.freeze([
  "id", "chapterId", "semanticRule", "childDecision", "decisionSteps", "objectIds",
  "objectRoles", "recipientId", "recipientRole", "physicalExpression", "consequenceId",
  "consequence", "activityFocus", "decisionModel", "inputPattern",
  "failureOrCorrectionModel", "learningConsequenceModel", "mechanicRoles",
  "physicalActionRoles", "contentCategory", "mechanicFamilyId", "constructId",
  "decisionConstruct", "inputConstruct", "correctionConstruct", "physicalActionConstruct",
  "evidenceConstruct", "cognitiveSignature"
]);
const INTERACTION_CONTEXT_FIELD_SET = new Set(INTERACTION_CONTEXT_FIELDS);

const INPUTS_BY_POWER = Object.freeze({
  echo_search: Object.freeze(["probe", "confirm_candidate", "replay_cue"]),
  contrast_sort: Object.freeze(["reverse_placement", "replay_cue"]),
  word_forge: Object.freeze(["place_tile", "replay_word", "sweep_word"]),
  blend_bridge: Object.freeze(["activate_segment", "sweep_blend", "replay_cue"]),
  memory_delivery: Object.freeze(["receive_cue", "replay_cue", "move", "arrive"]),
  story_power: Object.freeze(["read_text", "replay_text", "narrative_choice"])
});

const SAFE_CORRECTION_FIELDS = Object.freeze([
  "supportLevel", "mode", "replayContrast", "isolatePosition", "reduceIrrelevantLoad",
  "modelOnce", "requiresFreshAttempt", "queueIsomorphicReview"
]);

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function deepFreezeClone(value) {
  if (Array.isArray(value)) return Object.freeze(value.map(deepFreezeClone));
  if (isPlainObject(value)) {
    return Object.freeze(Object.fromEntries(Object.entries(value).map(([key, item]) => [key, deepFreezeClone(item)])));
  }
  return value;
}

export function isRecursivelyFrozen(value, seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) return true;
  seen.add(value);
  return Object.isFrozen(value) && Object.values(value).every(item => isRecursivelyFrozen(item, seen));
}

function exactKeys(value, allowed) {
  return Object.keys(value).every(key => allowed.includes(key));
}

function oneImmediateAction(step) {
  const text = String(step || "").trim();
  return Boolean(text) && !/,|;|\b(?:and|then)\b/iu.test(text);
}

function normalizedRole(value) {
  return String(value || "")
    .trim()
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/gu, "_")
    .replace(/^_+|_+$/gu, "");
}

function assertContextShape(context) {
  if (!isPlainObject(context)) throw new Error("interaction context is required");
  for (const key of Object.keys(context)) {
    if (!INTERACTION_CONTEXT_FIELD_SET.has(key)) throw new Error(`unknown interaction field: ${key}`);
  }
  for (const key of INTERACTION_CONTEXT_FIELDS) {
    if (!Object.hasOwn(context, key)) throw new Error(`interaction context is missing ${key}`);
  }
  const hasObjects = Array.isArray(context.objectIds) && context.objectIds.length > 0
    && Array.isArray(context.objectRoles) && context.objectRoles.length > 0;
  const hasRecipient = Boolean(String(context.recipientId || "").trim())
    && Boolean(String(context.recipientRole || "").trim());
  if (!hasObjects && !hasRecipient) throw new Error(`${context.id || "interaction"}: meaningful object or recipient is required`);
  if (!Array.isArray(context.decisionSteps) || context.decisionSteps.length === 0
    || context.decisionSteps.some(step => !oneImmediateAction(step))) {
    throw new Error(`${context.id || "interaction"}: decision steps must each contain one immediate action`);
  }
  if (!Array.isArray(context.mechanicRoles) || context.mechanicRoles.length === 0
    || !Array.isArray(context.physicalActionRoles) || context.physicalActionRoles.length === 0) {
    throw new Error(`${context.id || "interaction"}: mechanic and physical action roles are required`);
  }
}

function assertActionContextContract(action, context) {
  if (!isPlainObject(action)) throw new Error("authored action is required");
  if (action.contextId !== context.id) throw new Error(`${action.id || "action"}: interaction context does not match`);
  const canonical = SOUND_SEEKERS_INTERACTION_CONTEXTS[context.id];
  if (!canonical || canonical !== context) throw new Error(`${context.id}: interaction context is not the exact authored context`);
  const instruction = getInstructionContract(action.instructionId);
  if (!instruction || instruction.phase !== "decision") throw new Error(`${action.id || "action"}: decision instruction is required`);
  if (instruction.powerId !== action.powerId
    || instruction.expectedAction !== action.expectedAction
    || instruction.recordsDomain !== action.recordsDomain) {
    throw new Error(`${action.id || "action"}: action does not match its instruction contract`);
  }
}

export function createInteractionRuntimeModel(action, context) {
  assertContextShape(context);
  assertActionContextContract(action, context);
  const validInputs = [...(INPUTS_BY_POWER[action.powerId] || []), action.expectedAction];
  const uniqueInputs = [...new Set(validInputs)];
  const semanticInputAllowlist = uniqueInputs.map((type, index) => ({
    type,
    contextId: context.id,
    role: context.physicalActionRoles[index % context.physicalActionRoles.length],
    semanticId: `${context.id}:${normalizedRole(type)}`
  }));
  return deepFreezeClone({
    kind: "sound_seekers_interaction_runtime",
    actionId: action.id,
    configurationId: action.configurationId,
    powerId: action.powerId,
    instructionId: action.instructionId,
    expectedAction: action.expectedAction,
    recordsDomain: action.recordsDomain,
    contextId: context.id,
    ...Object.fromEntries(INTERACTION_CONTEXT_FIELDS.filter(key => key !== "id").map(key => [key, context[key]])),
    validInputs: uniqueInputs,
    semanticInputAllowlist
  });
}

function isToken(value) {
  return (typeof value === "string" && value.length > 0) || (typeof value === "number" && Number.isFinite(value));
}

function isExactS38MorphologyChallenge(challenge) {
  const attemptId = String(challenge?.attemptId || "");
  return challenge?.instructionId === "morphology-teach"
    && challenge?.powerId === "word_forge"
    && challenge?.expectedAction === "introduce_word_ending"
    && challenge?.recordsDomain === null
    && challenge?.targetOrdinal === 0
    && /^content-placement-attempt:.+:s38-morphology:0:0$/u.test(attemptId)
    && challenge?.challengeId === `${attemptId}:challenge:0:morphology`;
}

function validateMorphologyInteraction(interaction) {
  const keys = ["kind", "baseWord", "ending", "derivedWord", "meaning"];
  if (!isPlainObject(interaction) || !isRecursivelyFrozen(interaction)) {
    throw new Error("s38 morphology interaction must be recursively frozen");
  }
  if (!exactKeys(interaction, keys) || keys.some(key => !Object.hasOwn(interaction, key))
    || interaction.kind !== "morphology_introduction"
    || keys.slice(1).some(key => typeof interaction[key] !== "string" || !interaction[key].trim())
    || `${interaction.baseWord}${interaction.ending}` !== interaction.derivedWord) {
    throw new Error("s38 morphology interaction is invalid");
  }
  return interaction;
}

export function validatePowerChallenge(challenge, powerId, interaction) {
  const validation = validateQuestChallenge(challenge);
  if (!validation.valid) throw new Error(`invalid power challenge: ${validation.errors.join("; ")}`);
  const instruction = getInstructionContract(challenge.instructionId);
  if (!instruction) throw new Error("power challenge needs an instruction contract");
  assertInstructionMatchesChallenge(instruction, challenge);
  if (challenge.powerId !== powerId) throw new Error(`${powerId}: challenge belongs to another power`);
  if (isRecordableQuestChallenge(challenge)) {
    if (instruction.phase !== "decision") throw new Error(`${powerId}: recordable challenge needs a decision instruction`);
    if (!isPlainObject(interaction) || !interaction.action || !interaction.context) {
      throw new Error(`${powerId}: exact authored interaction is required`);
    }
    const runtime = createInteractionRuntimeModel(interaction.action, interaction.context);
    if (runtime.powerId !== powerId
      || runtime.instructionId !== challenge.instructionId
      || runtime.expectedAction !== challenge.expectedAction
      || runtime.recordsDomain !== challenge.recordsDomain) {
      throw new Error(`${powerId}: challenge and interaction contract do not match`);
    }
    return Object.freeze({ instruction, runtime, morphology: null });
  }
  if (!isExactS38MorphologyChallenge(challenge)) throw new Error("only the exact s38 morphology challenge may be unscored");
  return Object.freeze({ instruction, runtime: null, morphology: validateMorphologyInteraction(interaction) });
}

export function canonicalResponseIntent(challenge, response) {
  if (!isRecordableQuestChallenge(challenge)) throw new Error("canonical response intent needs a recordable challenge");
  const instruction = getInstructionContract(challenge.instructionId);
  if (!instruction) throw new Error("canonical response intent needs an instruction contract");
  assertInstructionMatchesChallenge(instruction, challenge);
  if (!isPlainObject(response) || !exactKeys(response, ["kind", "token"])
    || response.kind !== "literacy-answer" || !isToken(response.token)) {
    throw new Error("canonical response must be one literacy-answer token");
  }
  return deepFreezeClone({
    kind: "challenge_response",
    challengeId: challenge.challengeId,
    response: { kind: "literacy-answer", token: response.token }
  });
}

export function canonicalMorphologyIntent(challenge) {
  if (!isExactS38MorphologyChallenge(challenge) || validateQuestChallenge(challenge).valid !== true) {
    throw new Error("content response is restricted to the exact s38 morphology challenge");
  }
  return deepFreezeClone({
    kind: "content_response",
    challengeId: challenge.challengeId,
    response: {
      challengeId: challenge.challengeId,
      kind: "non-recording-complete",
      action: "introduce_word_ending"
    }
  });
}

export function projectCorrection(correction) {
  if (!isPlainObject(correction)) return null;
  const projected = {};
  for (const key of SAFE_CORRECTION_FIELDS) {
    if (Object.hasOwn(correction, key)) projected[key] = correction[key];
  }
  return Object.keys(projected).length ? deepFreezeClone(projected) : null;
}

export function createCommonState(powerId, challenge, options = {}) {
  if (!Number.isInteger(options.seed)) throw new Error(`${powerId}: integer seed is required`);
  const authority = validatePowerChallenge(challenge, powerId, options.interaction);
  const resume = isPlainObject(options.resume) ? options.resume : {};
  if (Object.hasOwn(resume, "powerId") && (resume.powerId !== powerId
    || resume.challengeId !== challenge.challengeId
    || resume.instructionId !== challenge.instructionId
    || resume.expectedAction !== challenge.expectedAction
    || resume.recordsDomain !== challenge.recordsDomain
    || resume.interactionContextId !== (authority.runtime?.contextId || null))) {
    throw new Error(`${powerId}: resume checkpoint identity is stale or mismatched`);
  }
  const status = ["active", "awaiting_mission_commit"].includes(resume.status)
    ? resume.status
    : "active";
  const revision = Number.isInteger(resume.revision) && resume.revision >= 0 ? resume.revision : 0;
  const semanticSteps = Array.isArray(resume.semanticSteps)
    && resume.semanticSteps.every(step => typeof step === "string")
    ? resume.semanticSteps
    : [];
  return {
    kind: `${powerId}_state`,
    powerId,
    challengeId: challenge.challengeId,
    instructionId: challenge.instructionId,
    expectedAction: challenge.expectedAction,
    recordsDomain: challenge.recordsDomain,
    interactionContextId: authority.runtime?.contextId || null,
    status,
    revision,
    seed: options.seed,
    semanticSteps,
    correction: projectCorrection(resume.correction),
    morphology: authority.morphology
  };
}

export function assertReducerContext(state, challenge, interaction = null) {
  if (!challenge || challenge.challengeId !== state.challengeId
    || challenge.powerId !== state.powerId
    || challenge.instructionId !== state.instructionId
    || challenge.expectedAction !== state.expectedAction
    || challenge.recordsDomain !== state.recordsDomain) {
    throw new Error(`${state.powerId}: reducer challenge identity is stale or mismatched`);
  }
  const validation = validateQuestChallenge(challenge);
  if (!validation.valid) throw new Error(`${state.powerId}: reducer challenge is invalid`);
  const contract = getInstructionContract(challenge.instructionId);
  assertInstructionMatchesChallenge(contract, challenge);
  if (interaction && state.interactionContextId !== interaction.contextId) {
    throw new Error(`${state.powerId}: reducer interaction identity is stale or mismatched`);
  }
  return true;
}

export function emptyPowerResult(state) {
  return Object.freeze({ state, responseIntents: Object.freeze([]) });
}

export function transitionPower(state, patch, semanticStep = null) {
  const steps = semanticStep ? [...state.semanticSteps, semanticStep] : state.semanticSteps;
  return deepFreezeClone({ ...state, ...patch, semanticSteps: steps, revision: state.revision + 1 });
}

export function answerPower(state, challenge, token, semanticStep, patch = {}) {
  if (state.status === "awaiting_mission_commit" || !isToken(token)) return emptyPowerResult(state);
  const nextState = transitionPower(state, { ...patch, status: "awaiting_mission_commit" }, semanticStep);
  return deepFreezeClone({
    state: nextState,
    responseIntents: [canonicalResponseIntent(challenge, { kind: "literacy-answer", token })]
  });
}

export function morphologyPower(state, challenge, semanticStep, patch = {}) {
  if (state.status === "awaiting_mission_commit") return emptyPowerResult(state);
  const nextState = transitionPower(state, { ...patch, status: "awaiting_mission_commit" }, semanticStep);
  return deepFreezeClone({ state: nextState, responseIntents: [canonicalMorphologyIntent(challenge)] });
}

export function commonView(state, challenge) {
  const child = toChildChallengeView(challenge);
  if (!child || child.challengeId !== state.challengeId) throw new Error(`${state.powerId}: child view challenge is invalid`);
  const contract = getInstructionContract(state.instructionId);
  return {
    challengeId: state.challengeId,
    powerId: state.powerId,
    instructionLabel: contract.childText,
    visualCue: { kind: child.cue || contract.cue },
    status: state.status,
    correction: state.correction
  };
}

export function publicEntries(entries, fields = ["id", "label"]) {
  if (!Array.isArray(entries)) return Object.freeze([]);
  return deepFreezeClone(entries.map(entry => Object.fromEntries(fields
    .filter(field => Object.hasOwn(entry || {}, field))
    .map(field => [field, entry[field]]))));
}

export function checkpointState(state, fields = []) {
  const base = {
    kind: state.kind,
    powerId: state.powerId,
    challengeId: state.challengeId,
    instructionId: state.instructionId,
    expectedAction: state.expectedAction,
    recordsDomain: state.recordsDomain,
    interactionContextId: state.interactionContextId,
    status: state.status,
    revision: state.revision,
    semanticSteps: state.semanticSteps,
    correction: state.correction
  };
  for (const field of fields) base[field] = state[field];
  return deepFreezeClone(base);
}

export function inputHasExactKeys(input, keys) {
  return isPlainObject(input) && Object.keys(input).length === keys.length
    && keys.every(key => Object.hasOwn(input, key));
}

export function tokenIsValid(token) {
  return isToken(token);
}

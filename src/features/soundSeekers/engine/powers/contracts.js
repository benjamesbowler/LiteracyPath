import {
  isRecordableQuestChallenge,
  toChildChallengeView,
  validateQuestChallenge
} from "../challengeContract.js";
import {
  assertInstructionMatchesChallenge,
  getInstructionContract
} from "../../content/instructionContracts.js";
import {
  SOUND_SEEKERS_EXPEDITIONS,
  SOUND_SEEKERS_INTERACTION_CONTEXTS
} from "../../content/expeditions.js";
import { CONTENT_DECK_PLACEMENTS } from "../../content/contentDeckBindings.js";

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
  "missCount", "supportLevel", "mode", "replayContrast", "isolatePosition", "reduceIrrelevantLoad",
  "modelOnce", "requiresFreshAttempt", "queueIsomorphicReview"
]);
const SAFE_CORRECTION_FIELD_SET = new Set(SAFE_CORRECTION_FIELDS);
const COMMON_CHECKPOINT_FIELDS = Object.freeze([
  "kind", "powerId", "challengeId", "instructionId", "expectedAction", "recordsDomain",
  "interactionContextId", "status", "revision", "semanticSteps", "correction"
]);
const CANONICAL_ACTIONS = Object.freeze(SOUND_SEEKERS_EXPEDITIONS.flatMap(expedition => [
  ...expedition.phases.filter(phase => phase.powerId),
  ...expedition.heartWordOpportunities
]));
const CANONICAL_ACTION_BY_ID = new Map(CANONICAL_ACTIONS.map(action => [action.id, action]));
if (CANONICAL_ACTIONS.length !== 200 || CANONICAL_ACTION_BY_ID.size !== 200) {
  throw new Error("Sound Seekers runtime requires exactly 200 unique canonical actions");
}

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

function sameValue(left, right) {
  if (Object.is(left, right)) return true;
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left) && Array.isArray(right) && left.length === right.length
      && left.every((item, index) => sameValue(item, right[index]));
  }
  if (isPlainObject(left) || isPlainObject(right)) {
    if (!isPlainObject(left) || !isPlainObject(right)) return false;
    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);
    return leftKeys.length === rightKeys.length
      && leftKeys.every(key => Object.hasOwn(right, key) && sameValue(left[key], right[key]));
  }
  return false;
}

function oneImmediateAction(step) {
  const text = String(step || "").trim();
  return Boolean(text) && !/,|;|\b(?:and|then)\b/iu.test(text);
}

function normalizedSemanticText(value) {
  return String(value || "")
    .normalize("NFKD")
    .toLocaleLowerCase()
    .replace(/[’']/gu, "")
    .replace(/[^a-z0-9]+/gu, " ")
    .trim()
    .replace(/\s+/gu, " ");
}

function semanticRequirementFor(context) {
  return deepFreezeClone({
    decisionActions: context.decisionSteps.map(step => normalizedSemanticText(step).split(" ")[0]),
    decisionModel: normalizedSemanticText(context.decisionModel),
    inputPattern: normalizedSemanticText(context.inputPattern),
    physicalActionRoles: context.physicalActionRoles.map(normalizedSemanticText)
  });
}

function semanticRequirementSignature(requirement) {
  return [
    `decision:${requirement.decisionActions.join(">")}`,
    `model:${requirement.decisionModel}`,
    `input:${requirement.inputPattern}`,
    `physical:${requirement.physicalActionRoles.join(">")}`
  ].join("|");
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

function resolveCanonicalAction(action) {
  if (!isPlainObject(action)) throw new Error("authored action is required");
  const canonical = CANONICAL_ACTION_BY_ID.get(action.id);
  if (!canonical) throw new Error(`${action.id || "action"}: canonical action is required`);
  for (const [key, value] of Object.entries(canonical)) {
    if (!Object.hasOwn(action, key) || !sameValue(action[key], value)) {
      throw new Error(`${action.id}: canonical action field ${key} does not match`);
    }
  }
  return canonical;
}

function assertActionContextContract(action, context) {
  const canonicalAction = resolveCanonicalAction(action);
  if (canonicalAction.contextId !== context.id) throw new Error(`${canonicalAction.id}: interaction context does not match`);
  const canonical = SOUND_SEEKERS_INTERACTION_CONTEXTS[context.id];
  if (!canonical || canonical !== context) throw new Error(`${context.id}: interaction context is not the exact authored context`);
  const instruction = getInstructionContract(canonicalAction.instructionId);
  if (!instruction || instruction.phase !== "decision") throw new Error(`${canonicalAction.id}: decision instruction is required`);
  if (instruction.powerId !== canonicalAction.powerId
    || instruction.expectedAction !== canonicalAction.expectedAction
    || instruction.recordsDomain !== canonicalAction.recordsDomain) {
    throw new Error(`${canonicalAction.id}: canonical action does not match its instruction contract`);
  }
  return canonicalAction;
}

export function createInteractionRuntimeModel(action, context) {
  assertContextShape(context);
  const canonicalAction = assertActionContextContract(action, context);
  const validInputs = [...(INPUTS_BY_POWER[canonicalAction.powerId] || []), canonicalAction.expectedAction];
  const uniqueInputs = [...new Set(validInputs)];
  const semanticRequirement = semanticRequirementFor(context);
  const requirementSignature = semanticRequirementSignature(semanticRequirement);
  const semanticInputAllowlist = uniqueInputs.map(type => ({
    type,
    semanticRequirement: `transition:${normalizedSemanticText(type)}|${requirementSignature}`
  }));
  return deepFreezeClone({
    kind: "sound_seekers_interaction_runtime",
    actionId: canonicalAction.id,
    configurationId: canonicalAction.configurationId,
    actionKind: canonicalAction.kind,
    powerId: canonicalAction.powerId,
    instructionId: canonicalAction.instructionId,
    expectedAction: canonicalAction.expectedAction,
    recordsDomain: canonicalAction.recordsDomain,
    targetIds: canonicalAction.targetIds || null,
    targetSourceId: canonicalAction.targetSourceId || null,
    wordId: canonicalAction.wordId || null,
    connectedTextId: canonicalAction.connectedTextId || null,
    contextId: context.id,
    ...Object.fromEntries(INTERACTION_CONTEXT_FIELDS.filter(key => key !== "id").map(key => [key, context[key]])),
    validInputs: uniqueInputs,
    semanticRequirement,
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

function placementRuntime(challenge, powerId) {
  const match = /^content-placement-attempt:(.+):(s\d+-alternative):(\d+):(\d+)$/u
    .exec(String(challenge?.attemptId || ""));
  if (!match || powerId !== "contrast_sort") return null;
  const placement = CONTENT_DECK_PLACEMENTS.find(item => item.placementId === match[2]);
  if (!placement || placement.powerId !== powerId
    || placement.instructionId !== challenge.instructionId
    || placement.expectedAction !== challenge.expectedAction
    || placement.recordsDomain !== challenge.recordsDomain
    || placement.challengeTargetIds[Number(match[3])] !== challenge.targetId) return null;
  const validInputs = Object.freeze(["reverse_placement", "replay_cue", challenge.expectedAction]);
  const semanticInputAllowlist = Object.freeze(validInputs.map(type => Object.freeze({
    type,
    semanticRequirement: `content-placement:${placement.placementId}:${challenge.targetId}:${type}`
  })));
  return Object.freeze({
    kind: "sound_seekers_content_placement_runtime",
    actionId: placement.placementId,
    powerId,
    instructionId: challenge.instructionId,
    expectedAction: challenge.expectedAction,
    recordsDomain: challenge.recordsDomain,
    contextId: challenge.attemptId,
    validInputs,
    semanticRequirement: Object.freeze({ placementId: placement.placementId, targetId: challenge.targetId }),
    semanticInputAllowlist
  });
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
    const placement = placementRuntime(challenge, powerId);
    if (placement) return Object.freeze({ instruction, runtime: placement, morphology: null });
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
    if ((runtime.targetIds && !runtime.targetIds.includes(challenge.targetId))
      || (runtime.wordId && challenge.wordId !== runtime.wordId)
      || (runtime.recordsDomain === "connected_text_transfer"
        && runtime.connectedTextId && challenge.connectedTextId !== runtime.connectedTextId)
      || (runtime.recordsDomain === "heart_word_mapping"
        && runtime.activityFocus && challenge.activityType !== runtime.activityFocus)) {
      throw new Error(`${powerId}: challenge identity does not match its canonical action`);
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

function assertCorrectionCheckpoint(correction) {
  if (correction === null) return;
  if (!isPlainObject(correction)) throw new Error("resume checkpoint correction must be null or an object");
  for (const [key, value] of Object.entries(correction)) {
    if (!SAFE_CORRECTION_FIELD_SET.has(key)) throw new Error(`unknown correction resume field: ${key}`);
    if (value !== null && (!["string", "number", "boolean"].includes(typeof value)
      || (typeof value === "number" && !Number.isFinite(value)))) {
      throw new Error(`resume checkpoint correction field ${key} must be primitive`);
    }
  }
}

function assertResumeCheckpoint(resume, { powerId, challenge, interactionContextId, extraFields }) {
  if (!isPlainObject(resume)) throw new Error(`${powerId}: resume checkpoint must be an object`);
  const expectedFields = [...COMMON_CHECKPOINT_FIELDS, ...extraFields];
  const keys = Object.keys(resume);
  if (keys.length !== expectedFields.length
    || expectedFields.some(key => !Object.hasOwn(resume, key))) {
    throw new Error(`${powerId}: resume checkpoint schema is incomplete or has unknown fields`);
  }
  if (resume.kind !== `${powerId}_state`
    || resume.powerId !== powerId
    || resume.challengeId !== challenge.challengeId
    || resume.instructionId !== challenge.instructionId
    || resume.expectedAction !== challenge.expectedAction
    || resume.recordsDomain !== challenge.recordsDomain
    || resume.interactionContextId !== interactionContextId) {
    throw new Error(`${powerId}: resume checkpoint identity is stale or mismatched`);
  }
  if (!["active", "awaiting_mission_commit"].includes(resume.status)) {
    throw new Error(`${powerId}: resume checkpoint status is invalid`);
  }
  if (!Number.isInteger(resume.revision) || resume.revision < 0
    || !Array.isArray(resume.semanticSteps)
    || resume.semanticSteps.length !== resume.revision
    || resume.semanticSteps.some(step => typeof step !== "string" || !step)) {
    throw new Error(`${powerId}: resume checkpoint revision and semantic steps are inconsistent`);
  }
  assertCorrectionCheckpoint(resume.correction);
  return resume;
}

export function createCommonState(powerId, challenge, options = {}, extraResumeFields = []) {
  if (!Number.isInteger(options.seed)) throw new Error(`${powerId}: integer seed is required`);
  const authority = validatePowerChallenge(challenge, powerId, options.interaction);
  const resume = options.resume === null || options.resume === undefined
    ? null
    : assertResumeCheckpoint(options.resume, {
      powerId,
      challenge,
      interactionContextId: authority.runtime?.contextId || null,
      extraFields: extraResumeFields
    });
  return {
    kind: `${powerId}_state`,
    powerId,
    challengeId: challenge.challengeId,
    instructionId: challenge.instructionId,
    expectedAction: challenge.expectedAction,
    recordsDomain: challenge.recordsDomain,
    interactionContextId: authority.runtime?.contextId || null,
    status: resume?.status || "active",
    revision: resume?.revision || 0,
    seed: options.seed,
    semanticSteps: resume?.semanticSteps || [],
    correction: projectCorrection(resume?.correction),
    morphology: authority.morphology,
    semanticRequirement: authority.runtime?.semanticRequirement || null,
    semanticInputAllowlist: authority.runtime?.semanticInputAllowlist || []
  };
}

export function assertStableCollection(entries, {
  name,
  contextId,
  min = 1,
  max = Number.POSITIVE_INFINITY,
  fields = ["id", "label"]
} = {}) {
  if (!Array.isArray(entries) || entries.length < min || entries.length > max) {
    throw new Error(`${name}: expected ${min}-${max} records with unique nonempty context-bound IDs`);
  }
  const ids = new Set();
  for (const entry of entries) {
    if (!isPlainObject(entry)
      || Object.keys(entry).length !== fields.length
      || fields.some(field => !Object.hasOwn(entry, field))) {
      throw new Error(`${name}: records must use the exact collection schema`);
    }
    if (typeof entry.id !== "string" || !entry.id.startsWith(`${contextId}:`) || ids.has(entry.id)) {
      throw new Error(`${name}: IDs must be unique nonempty and context-bound`);
    }
    ids.add(entry.id);
    if (fields.includes("label") && (typeof entry.label !== "string" || !entry.label.trim())) {
      throw new Error(`${name}: labels must be nonempty strings`);
    }
    if (fields.includes("token") && !isToken(entry.token)) {
      throw new Error(`${name}: tokens must be primitive literacy tokens`);
    }
  }
  return true;
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

export function semanticStepFor(state, type, ...indexes) {
  const allowed = state.semanticInputAllowlist?.find(entry => entry.type === type);
  if (!allowed || indexes.some(index => !Number.isInteger(index) || index < 0)) {
    throw new Error(`${state.powerId}: transition has no authored semantic requirement`);
  }
  const operation = [type, ...indexes].join("#");
  return `${operation}::${allowed.semanticRequirement}`;
}

export function parseSemanticHistory(state) {
  if (!Array.isArray(state.semanticSteps)) throw new Error(`${state.powerId}: semantic resume history is invalid`);
  const requirements = new Map((state.semanticInputAllowlist || [])
    .map(entry => [entry.type, entry.semanticRequirement]));
  return state.semanticSteps.map(step => {
    const divider = step.indexOf("::");
    if (divider <= 0) throw new Error(`${state.powerId}: semantic resume history is invalid`);
    const operation = step.slice(0, divider);
    const requirement = step.slice(divider + 2);
    const [type, ...rawIndexes] = operation.split("#");
    if (requirements.get(type) !== requirement
      || rawIndexes.some(index => !/^(?:0|[1-9][0-9]*)$/u.test(index))) {
      throw new Error(`${state.powerId}: semantic resume history does not match its authored context`);
    }
    return Object.freeze({ type, indexes: Object.freeze(rawIndexes.map(Number)) });
  });
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

export function applyMissionCommitToPower(state, result, context, createState) {
  if (!state || state.status !== "awaiting_mission_commit" || typeof createState !== "function") {
    throw new Error("power must be awaiting its exact mission commit");
  }
  if (typeof context?.assertCommitResult !== "function") {
    throw new Error("power commit application needs reducer authority");
  }
  context.assertCommitResult(result, {
    missionId: context?.missionId,
    phaseId: context?.phaseId,
    attemptId: context?.attemptId,
    attemptOrdinal: context?.attemptOrdinal,
    revision: context?.revision
  });
  if (result.outcome === "advance") return state;
  if (result.outcome === "model_required" && !context?.nextChallenge) return state;
  if (!context?.nextChallenge || context.nextChallenge.attemptId !== result.nextAttemptId) {
    throw new Error("power continuation needs the exact fresh challenge");
  }
  const fresh = createState(context.nextChallenge, {
    seed: context.seed,
    resume: null,
    interaction: context.interaction
  });
  return deepFreezeClone({ ...fresh, correction: projectCorrection(context.correction) });
}

import {
  isConnectedTextPresentationTransition,
  projectConnectedTextPresentationTransition
} from "./connectedTextPresentation.js";

const currentAccessObjects = new WeakSet();
const sourceTransitionByAccess = new WeakMap();

const CONTEXT_KEYS = Object.freeze([
  "sceneId", "attemptId", "reducerRevision"
]);
const ACCESS_KEYS = Object.freeze([
  "kind", "sceneId", "attemptId", "reducerRevision", "decisionId",
  "phase", "postDecisionSemanticId", "storyOutcomeId", "meaningSemanticId"
]);
const ACCESS_PHASES = new Set(["action", "resolved", "meaning_support"]);

function plainObject(value) {
  return value !== null
    && typeof value === "object"
    && Object.getPrototypeOf(value) === Object.prototype;
}

function exactDataKeys(value, keys) {
  if (!plainObject(value)) return false;
  const ownKeys = Reflect.ownKeys(value);
  if (ownKeys.length !== keys.length
    || ownKeys.some(key => typeof key !== "string" || !keys.includes(key))) return false;
  const descriptors = Object.getOwnPropertyDescriptors(value);
  return keys.every(key => Object.hasOwn(descriptors[key], "value")
    && descriptors[key].enumerable);
}

function stringId(value) {
  return typeof value === "string" && value.length > 0 && value.trim() === value;
}

function validContext(context) {
  return exactDataKeys(context, CONTEXT_KEYS)
    && stringId(context.sceneId)
    && stringId(context.attemptId)
    && Number.isInteger(context.reducerRevision)
    && context.reducerRevision >= 0;
}

function contextMatchesProjection(context, projection) {
  return context.sceneId === projection.sceneId
    && context.attemptId === projection.attemptId
    && context.reducerRevision === projection.reducerRevision;
}

function accessMatchesProjection(sceneAccess, projection) {
  return exactDataKeys(sceneAccess, ACCESS_KEYS)
    && sceneAccess.kind === "scene_visual_access"
    && sceneAccess.sceneId === projection.sceneId
    && sceneAccess.attemptId === projection.attemptId
    && sceneAccess.reducerRevision === projection.reducerRevision
    && sceneAccess.decisionId === projection.decisionId
    && sceneAccess.phase === projection.phase
    && sceneAccess.postDecisionSemanticId === projection.postDecisionSemanticId
    && sceneAccess.storyOutcomeId === projection.storyOutcomeId
    && sceneAccess.meaningSemanticId === projection.meaningSemanticId;
}

function revoke(sceneAccess) {
  currentAccessObjects.delete(sceneAccess);
  sourceTransitionByAccess.delete(sceneAccess);
}

export function issueSceneVisualAccess(presentationTransition, context) {
  if (!validContext(context)) {
    throw new Error("scene visual access context is invalid");
  }
  if (!isConnectedTextPresentationTransition(presentationTransition)) {
    throw new Error("scene visual access requires the exact active transition");
  }
  const projection = projectConnectedTextPresentationTransition(presentationTransition);
  if (!contextMatchesProjection(context, projection)
    || !ACCESS_PHASES.has(projection.phase)) {
    throw new Error("scene visual access is unavailable for this transition");
  }
  const sceneAccess = Object.freeze({
    kind: "scene_visual_access",
    sceneId: projection.sceneId,
    attemptId: projection.attemptId,
    reducerRevision: projection.reducerRevision,
    decisionId: projection.decisionId,
    phase: projection.phase,
    postDecisionSemanticId: projection.postDecisionSemanticId,
    storyOutcomeId: projection.storyOutcomeId,
    meaningSemanticId: projection.meaningSemanticId
  });
  currentAccessObjects.add(sceneAccess);
  sourceTransitionByAccess.set(sceneAccess, presentationTransition);
  return sceneAccess;
}

export function validateSceneVisualAccess(sceneAccess, context) {
  if (!currentAccessObjects.has(sceneAccess)) return false;
  const sourceTransition = sourceTransitionByAccess.get(sceneAccess);
  try {
    if (!sourceTransition
      || !isConnectedTextPresentationTransition(sourceTransition)) {
      revoke(sceneAccess);
      return false;
    }
    const projection = projectConnectedTextPresentationTransition(sourceTransition);
    if (!validContext(context)
      || !ACCESS_PHASES.has(projection.phase)
      || !contextMatchesProjection(context, projection)
      || !accessMatchesProjection(sceneAccess, projection)) {
      revoke(sceneAccess);
      return false;
    }
    return true;
  } catch {
    revoke(sceneAccess);
    return false;
  }
}

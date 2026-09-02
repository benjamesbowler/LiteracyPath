import {
  createConnectedTextChallenge,
  toChildConnectedTextScene
} from "../content/connectedText.js";
import {
  SOUND_SEEKERS_MEANING_VISUAL_OWNERS,
  SOUND_SEEKERS_SCENE_VISUAL_SEMANTICS,
  resolveNarrativeBranchOutcome
} from "../content/sceneVisualSemantics.js";
import {
  beginStoryTransferTransaction,
  checkpointStoryTransferTransaction,
  completeStoryTransferCorrectionModel,
  completeStoryTransferTransaction,
  materializeBossTransferChallenge,
  materializeStoryTransferChallenge
} from "../engine/contentDeckTransactions.js";
import {
  beginConnectedTextPresentation,
  checkpointConnectedTextPresentation,
  closeConnectedTextPresentation,
  reduceConnectedTextPresentation,
  rehydrateConnectedTextPresentation
} from "../engine/connectedTextPresentation.js";
import { issueSceneVisualAccess } from "../engine/sceneVisualAccess.js";
import { createSoundSeekersState, normalizeSoundSeekersState } from "../engine/stateV2.js";
import { SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS } from "../visual/characterCustomization.js";
import { SOUND_SEEKERS_CHARACTER_VISUALS, SOUND_SEEKERS_PLAYER_VISUAL, SOUND_SEEKERS_POSE_IDS } from "../visual/characterCatalog.js";
import { SOUND_SEEKERS_MEANING_VISUALS } from "../visual/sceneVisualCatalog.js";

export const SOUND_SEEKERS_GALLERY_REPLAY_RECIPE_IDS = Object.freeze([
  "pre-choice",
  "assessed-one-miss-correction",
  "assessed-three-miss-correction",
  "assessed-action",
  "assessed-correct-resolved",
  "assessed-direct-meaning",
  "boss-one-miss-correction",
  "boss-three-miss-correction",
  "boss-action",
  "boss-resolved",
  "boss-direct-meaning"
]);

const RECIPE_IDS = new Set(SOUND_SEEKERS_GALLERY_REPLAY_RECIPE_IDS);
if (typeof closeConnectedTextPresentation !== "function") {
  throw new TypeError("connected-text close authority is unavailable");
}
const CHILD_SCENES = SOUND_SEEKERS_SCENE_VISUAL_SEMANTICS
  .map(record => toChildConnectedTextScene(record.sceneId, "gallery:catalog"));
const SCENES = new Map(CHILD_SCENES.map(scene => [scene.id, scene]));
const STOPS = new Map(CHILD_SCENES.map(scene => [scene.stopId, scene]));
const slug = value => String(value).toLocaleLowerCase("en-US").replace(/[^a-z0-9]+/gu, "-").replace(/^-|-$/gu, "");
const MODES = new Set([
  "scene", "chapter-map", "route-landmark", "wonder", "creator", "background-crop", "background-failure",
  ...[...SOUND_SEEKERS_CHARACTER_VISUALS, SOUND_SEEKERS_PLAYER_VISUAL].map(character => `character-${slug(character.characterId)}`),
  ...SOUND_SEEKERS_MEANING_VISUALS.map(visual => `meaning-${slug(visual.semanticId)}`)
]);
const DENSITIES = new Set(["full", "simplified"]);
const MOTIONS = new Set(["full", "reduced"]);
const LABELS = new Set(["shown", "hidden"]);
const CREATOR_IDS = new Set([
  ...SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS.bodyShapes,
  ...SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS.palettes,
  ...Object.values(SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS.accessoriesBySlot).flat().filter(Boolean)
]);
const OPTION_IDS = new Set([
  ...CREATOR_IDS,
  ...SOUND_SEEKERS_POSE_IDS,
  ...SOUND_SEEKERS_MEANING_VISUALS.map(visual => visual.semanticId),
  ...CHILD_SCENES.flatMap(scene => scene.choice.options.map(option => option.visualSemanticId))
]);

function exactInteger(value, name) {
  if (!/^\d+$/u.test(value || "")) throw new TypeError(`${name} must be an integer`);
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 0 || number > 2_147_483_647) {
    throw new TypeError(`${name} is out of range`);
  }
  return number;
}

export function parseSoundSeekersGalleryQuery(search) {
  const params = new URLSearchParams(String(search || "").replace(/^\?/u, ""));
  const allowed = new Set(["mode", "stop", "scene", "fixture", "density", "motion", "labels", "seed", "option"]);
  for (const key of params.keys()) {
    if (!allowed.has(key)) throw new TypeError(`unsupported gallery query key: ${key}`);
    if (params.getAll(key).length !== 1) throw new TypeError(`duplicate gallery query key: ${key}`);
  }
  const mode = params.get("mode") || "scene";
  const stopValue = params.get("stop");
  const sceneValue = params.get("scene");
  const stopScene = stopValue ? STOPS.get(stopValue) : null;
  const namedScene = sceneValue ? SCENES.get(sceneValue) : null;
  if (!MODES.has(mode)) throw new TypeError("unknown gallery mode");
  if (stopValue && !stopScene) throw new TypeError("unknown Sound Seekers stop");
  if (sceneValue && !namedScene) throw new TypeError("unknown Sound Seekers scene");
  if (stopScene && namedScene && stopScene !== namedScene) throw new TypeError("stop and scene do not match");
  const scene = namedScene || stopScene || CHILD_SCENES[0];
  const fixtureId = params.get("fixture") || "pre-choice";
  const density = params.get("density") || "full";
  const motion = params.get("motion") || "reduced";
  const labels = params.get("labels") || "shown";
  const seed = exactInteger(params.get("seed") || "11", "seed");
  const optionId = params.get("option") || null;
  if (!RECIPE_IDS.has(fixtureId)) throw new TypeError("unknown gallery replay recipe");
  if (!DENSITIES.has(density) || !MOTIONS.has(motion) || !LABELS.has(labels)) {
    throw new TypeError("invalid gallery presentation profile");
  }
  if (optionId && !OPTION_IDS.has(optionId)) {
    throw new TypeError("unknown gallery option identity");
  }
  return Object.freeze({
    mode,
    stopId: scene.stopId,
    sceneId: scene.id,
    fixtureId,
    density,
    motion,
    labels,
    seed,
    optionId
  });
}

function isBoss(scene) {
  return scene.choice.kind === "narrative_bridge";
}

function requiredWrongCount(recipeId) {
  return recipeId.includes("three-miss") ? 3 : recipeId === "pre-choice" ? 0 : 1;
}

function requestedPhase(recipeId) {
  if (recipeId === "pre-choice") return "pre_choice";
  if (recipeId.includes("correction")) return "correction";
  if (recipeId.endsWith("action")) return "action";
  if (recipeId.includes("direct-meaning")) return "meaning_support";
  return "resolved";
}

function challengeFor(state, transactionId, scene, routeSeed) {
  const challenge = materializeStoryTransferChallenge(state, { transactionId });
  const delegated = isBoss(scene)
    ? materializeBossTransferChallenge(state, { transactionId })
    : createConnectedTextChallenge(state, { transactionId, routeSeed });
  if (delegated !== challenge) throw new TypeError("connected-text challenge delegate lost canonical identity");
  return challenge;
}

function envelope(state, presentation) {
  return JSON.parse(JSON.stringify({
    schemaVersion: 1,
    state: normalizeSoundSeekersState(state),
    presentation: checkpointConnectedTextPresentation(presentation)
  }));
}

function rehydrateEnvelope(serialized) {
  if (serialized.schemaVersion !== 1) throw new TypeError("gallery replay envelope schema changed");
  const state = normalizeSoundSeekersState(serialized.state);
  const presentation = rehydrateConnectedTextPresentation(state, serialized.presentation);
  return { state, ...presentation };
}

function transitionContext(transition) {
  return Object.freeze({
    sceneId: transition.sceneId,
    attemptId: transition.attemptId,
    reducerRevision: transition.reducerRevision
  });
}

export function replaySoundSeekersGalleryFixture({ recipeId, sceneId, seed, optionId = null, meaningSemanticId = null } = {}) {
  if (!RECIPE_IDS.has(recipeId)) throw new TypeError("unknown gallery replay recipe");
  const scene = SCENES.get(String(sceneId || ""));
  if (!scene) throw new TypeError("unknown gallery scene");
  const boss = isBoss(scene);
  if (boss !== recipeId.startsWith("boss-") && recipeId !== "pre-choice") {
    throw new TypeError("gallery recipe does not match scene decision kind");
  }
  const routeSeed = `gallery:${exactInteger(String(seed ?? 11), "seed")}`;
  const childScene = toChildConnectedTextScene(scene.id, routeSeed);
  let narrativeChoice = null;
  if (boss) {
    narrativeChoice = optionId
      ? childScene.choice.options.find(option => option.visualSemanticId === optionId)
      : childScene.choice.options[0];
    if (!narrativeChoice) throw new TypeError("boss branch option is not part of the child scene");
  } else if (optionId && !childScene.choice.options.some(option => option.visualSemanticId === optionId)) {
    throw new TypeError("option is not part of the child scene");
  }
  const journeyStep = Number(scene.stopId.slice(1));
  const begun = beginStoryTransferTransaction(createSoundSeekersState(), {
    stopId: scene.stopId,
    journeyStep,
    seed: exactInteger(String(seed ?? 11), "seed")
  });
  const transactionId = begun.transaction.transactionId;
  let state = checkpointStoryTransferTransaction(begun.nextState, {
    transactionId,
    narrativeChoiceToken: narrativeChoice?.token || null
  });
  let presentation = beginConnectedTextPresentation({ sceneId: scene.id, transactionId });
  if (recipeId === "pre-choice") {
    return Object.freeze({
      recipeId,
      transitionSource: "committed-reducer-replay",
      childScene,
      presentationTransition: null,
      sceneAccess: null,
      context: null,
      canonicalEvidenceDomain: boss ? "novel_decoding" : "connected_text_transfer",
      persistedNarrativeChoiceToken: narrativeChoice?.token || null,
      phase: "pre_choice"
    });
  }

  let transition = null;
  const wrongCount = requiredWrongCount(recipeId);
  for (let index = 0; index < wrongCount; index += 1) {
    const challenge = challengeFor(state, transactionId, scene, routeSeed);
    const wrongToken = challenge.optionTokens.find(token => token !== challenge.expectedToken);
    const result = completeStoryTransferTransaction(state, {
      transactionId,
      challenge,
      response: { kind: "literacy-answer", token: wrongToken },
      audio: { status: "completed" },
      at: `2026-09-02T06:${String(index + 1).padStart(2, "0")}:00.000Z`,
      sessionDay: "2026-09-02"
    });
    state = result.nextState;
    const reduced = reduceConnectedTextPresentation(presentation, {
      type: "decision_committed",
      reducerRevision: presentation.reducerRevision,
      evidenceEventId: result.event.id
    }, { state });
    presentation = reduced.nextPresentation;
    transition = reduced.transition;
  }

  let restored = rehydrateEnvelope(envelope(state, presentation));
  state = restored.state;
  presentation = restored.presentation;
  transition = restored.transition;
  if (state.checkpoint.storyTransfer.stage === "model_pending") {
    state = completeStoryTransferCorrectionModel(state, { transactionId }).nextState;
  }
  if (requestedPhase(recipeId) === "correction") {
    return Object.freeze({
      recipeId,
      transitionSource: "committed-reducer-replay",
      childScene,
      presentationTransition: transition,
      sceneAccess: null,
      context: null,
      canonicalEvidenceDomain: boss ? "novel_decoding" : "connected_text_transfer",
      persistedNarrativeChoiceToken: narrativeChoice?.token || null,
      phase: "correction"
    });
  }

  const freshChallenge = challengeFor(state, transactionId, scene, routeSeed);
  const completed = completeStoryTransferTransaction(state, {
    transactionId,
    challenge: freshChallenge,
    response: { kind: "literacy-answer", token: freshChallenge.expectedToken },
    audio: { status: "completed" },
    at: "2026-09-02T06:10:00.000Z",
    sessionDay: "2026-09-02"
  });
  state = completed.nextState;
  let reduced = reduceConnectedTextPresentation(presentation, {
    type: "decision_committed",
    reducerRevision: presentation.reducerRevision,
    evidenceEventId: completed.event.id
  }, { state });
  presentation = reduced.nextPresentation;
  restored = rehydrateEnvelope(envelope(state, presentation));
  state = restored.state;
  presentation = restored.presentation;
  transition = restored.transition;
  let context = transitionContext(transition);
  let sceneAccess = issueSceneVisualAccess(transition, context);

  if (requestedPhase(recipeId) !== "action") {
    reduced = reduceConnectedTextPresentation(presentation, {
      type: "action_completed",
      reducerRevision: presentation.reducerRevision
    }, { state });
    presentation = reduced.nextPresentation;
    transition = reduced.transition;
    context = transitionContext(transition);
    sceneAccess = issueSceneVisualAccess(transition, context);
  }
  if (requestedPhase(recipeId) === "meaning_support") {
    const owner = SOUND_SEEKERS_MEANING_VISUAL_OWNERS.find(record =>
      record.sceneId === scene.id && record.postDecisionSemanticId === transition.postDecisionSemanticId
      && (!meaningSemanticId || record.meaningSemanticId === meaningSemanticId));
    if (!owner) throw new TypeError("scene branch has no direct meaning owner");
    reduced = reduceConnectedTextPresentation(presentation, {
      type: "meaning_requested",
      reducerRevision: presentation.reducerRevision,
      meaningSemanticId: owner.meaningSemanticId
    }, { state });
    transition = reduced.transition;
    context = transitionContext(transition);
    sceneAccess = issueSceneVisualAccess(transition, context);
  }
  if (boss && !resolveNarrativeBranchOutcome(scene.id, narrativeChoice.token)) {
    throw new TypeError("boss branch did not resolve from its canonical child token");
  }
  return Object.freeze({
    recipeId,
    transitionSource: "committed-reducer-replay",
    childScene,
    presentationTransition: transition,
    sceneAccess,
    context,
    canonicalEvidenceDomain: boss ? "novel_decoding" : "connected_text_transfer",
    persistedNarrativeChoiceToken: narrativeChoice?.token || null,
    phase: transition.phase
  });
}

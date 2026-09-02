import {
  createConnectedTextChallenge,
  toChildConnectedTextScene
} from "../content/connectedText.js";
import {
  SOUND_SEEKERS_MEANING_VISUAL_OWNERS,
  SOUND_SEEKERS_NARRATIVE_BRANCH_OUTCOMES,
  SOUND_SEEKERS_SCENE_VISUAL_SEMANTICS,
  resolveNarrativeBranchOutcome,
  resolveSceneVisualSemantic
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
import { validContentDeckUses } from "../engine/contentCoverage.js";
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
const POSE_IDS = new Set(SOUND_SEEKERS_POSE_IDS);

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
  const characterMode = mode.startsWith("character-");
  const meaningMode = mode.startsWith("meaning-");
  if (mode === "creator") {
    if (!optionId || !CREATOR_IDS.has(optionId)) {
      throw new TypeError("creator mode requires one canonical creator option");
    }
  } else if (characterMode) {
    if (!optionId || !POSE_IDS.has(optionId)) {
      throw new TypeError("character mode requires one canonical pose");
    }
  } else if (meaningMode) {
    const semanticId = SOUND_SEEKERS_MEANING_VISUALS.find(visual =>
      `meaning-${slug(visual.semanticId)}` === mode)?.semanticId;
    const owner = SOUND_SEEKERS_MEANING_VISUAL_OWNERS.find(record =>
      record.meaningSemanticId === semanticId);
    if (!owner || owner.sceneId !== scene.id || !fixtureId.endsWith("direct-meaning")) {
      throw new TypeError("meaning mode does not match its canonical owner and fixture");
    }
    if (scene.choice.kind === "narrative_bridge") {
      const branch = SOUND_SEEKERS_NARRATIVE_BRANCH_OUTCOMES.find(record =>
        record.sceneId === scene.id
        && record.postDecisionSemanticId === owner.postDecisionSemanticId);
      const expectedOption = scene.choice.options.find(option => option.token === branch?.token);
      if (!expectedOption || optionId !== expectedOption.visualSemanticId) {
        throw new TypeError("boss meaning mode requires its canonical branch option");
      }
    } else if (optionId !== null) {
      throw new TypeError("assessed meaning mode does not accept an unrelated option");
    }
  } else if (optionId && !scene.choice.options.some(option => option.visualSemanticId === optionId)) {
    throw new TypeError("gallery option is not a member of the selected scene mode");
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

export function deriveGalleryNarrativeChoiceFromState(rawState, sceneId, transactionId) {
  const scene = SCENES.get(String(sceneId || ""));
  if (!scene) throw new TypeError("gallery replay cannot derive a branch for an unknown scene");
  const state = normalizeSoundSeekersState(rawState);
  const checkpoint = state.checkpoint?.storyTransfer;
  const checkpointToken = checkpoint?.transactionId === transactionId
    ? checkpoint.narrativeChoiceToken : null;
  const storyUses = validContentDeckUses(state, "stories")
    .filter(use => use.transactionId === transactionId);
  const transferUses = validContentDeckUses(state, "transfer")
    .filter(use => use.transactionId === transactionId);
  let finalToken = null;
  if (storyUses.length || transferUses.length) {
    if (storyUses.length !== 1 || transferUses.length !== 1
      || storyUses[0].pairedUseId !== transferUses[0].useId
      || transferUses[0].pairedUseId !== storyUses[0].useId
      || storyUses[0].narrativeChoiceToken !== transferUses[0].narrativeChoiceToken) {
      throw new TypeError("gallery replay narrative choice uses are not reciprocal");
    }
    finalToken = storyUses[0].narrativeChoiceToken;
  }
  if (checkpointToken !== null && finalToken !== null && checkpointToken !== finalToken) {
    throw new TypeError("gallery replay checkpoint and final narrative choice disagree");
  }
  const token = finalToken ?? checkpointToken;
  if (scene.choice.kind === "narrative_bridge") {
    if (typeof token !== "string" || !resolveNarrativeBranchOutcome(scene.id, token)) {
      throw new TypeError("gallery replay has no canonical persisted boss branch");
    }
    return token;
  }
  if (token !== null) throw new TypeError("assessed gallery replay persisted a narrative choice");
  return null;
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
  const journeyStep = Number(scene.stopId.slice(1));
  const initial = createSoundSeekersState();
  const current = normalizeSoundSeekersState({
    ...initial,
    trail: { ...initial.trail, journeyStep }
  });
  const begun = beginStoryTransferTransaction(current, {
    stopId: scene.stopId,
    journeyStep,
    seed: exactInteger(String(seed ?? 11), "seed")
  });
  const transactionId = begun.transaction.transactionId;
  let state;
  {
    const narrativeChoice = boss
      ? optionId
        ? childScene.choice.options.find(option => option.visualSemanticId === optionId)
        : childScene.choice.options[0]
      : null;
    if (boss && !narrativeChoice) throw new TypeError("boss branch option is not part of the child scene");
    if (!boss && optionId && !childScene.choice.options.some(option => option.visualSemanticId === optionId)) {
      throw new TypeError("option is not part of the child scene");
    }
    state = checkpointStoryTransferTransaction(begun.nextState, {
      transactionId,
      narrativeChoiceToken: narrativeChoice?.token || null
    });
  }
  let persistedNarrativeChoiceToken = deriveGalleryNarrativeChoiceFromState(state, scene.id, transactionId);
  let presentation = beginConnectedTextPresentation({ sceneId: scene.id, transactionId, state });
  if (recipeId === "pre-choice") {
    return Object.freeze({
      recipeId,
      transitionSource: "committed-reducer-replay",
      childScene,
      presentationTransition: null,
      sceneAccess: null,
      context: null,
      canonicalEvidenceDomain: boss ? "novel_decoding" : "connected_text_transfer",
      persistedNarrativeChoiceToken,
      phase: "pre_choice"
    });
  }

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
  }

  let restored = rehydrateEnvelope(envelope(state, presentation));
  state = restored.state;
  presentation = restored.presentation;
  let transition = restored.transition;
  persistedNarrativeChoiceToken = deriveGalleryNarrativeChoiceFromState(state, scene.id, transactionId);
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
      persistedNarrativeChoiceToken,
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
  persistedNarrativeChoiceToken = deriveGalleryNarrativeChoiceFromState(state, scene.id, transactionId);
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
    const postDecision = resolveSceneVisualSemantic(transition.postDecisionSemanticId);
    const canonicalMeaningSemanticId = meaningSemanticId
      ? postDecision?.meaningSemanticIds.includes(meaningSemanticId) && meaningSemanticId
      : postDecision?.meaningSemanticIds[0];
    if (!canonicalMeaningSemanticId) throw new TypeError("scene branch has no canonical direct meaning");
    reduced = reduceConnectedTextPresentation(presentation, {
      type: "meaning_requested",
      reducerRevision: presentation.reducerRevision,
      meaningSemanticId: canonicalMeaningSemanticId
    }, { state });
    transition = reduced.transition;
    context = transitionContext(transition);
    sceneAccess = issueSceneVisualAccess(transition, context);
  }
  if (boss && !resolveNarrativeBranchOutcome(scene.id, persistedNarrativeChoiceToken)) {
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
    persistedNarrativeChoiceToken,
    phase: transition.phase
  });
}

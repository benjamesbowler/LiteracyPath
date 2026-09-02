import { SOUND_SEEKERS_CHAPTERS } from "../content/chapters/index.js";
import { SOUND_SEEKERS_EXPEDITIONS } from "../content/expeditions.js";
import { isConnectedTextChildScene } from "../content/connectedText.js";
import {
  SOUND_SEEKERS_SCENE_VISUAL_SEMANTICS,
  SOUND_SEEKERS_PRE_CHOICE_VISUAL_SEMANTICS,
  SOUND_SEEKERS_OPTION_VISUAL_SEMANTICS,
  SOUND_SEEKERS_POST_DECISION_VISUAL_SEMANTICS,
  SOUND_SEEKERS_NARRATIVE_BRANCH_OUTCOMES,
  SOUND_SEEKERS_MEANING_VISUAL_SEMANTICS,
  SOUND_SEEKERS_VISUAL_SEMANTIC_REGISTRY,
  getSceneVisualSemantics,
  resolveSceneVisualSemantic
} from "../content/sceneVisualSemantics.js";
import {
  SOUND_SEEKERS_MEANING_SUPPORT,
  getMeaningSupport
} from "../content/meaningSupport.js";
import { validateSceneVisualAccess } from "../engine/sceneVisualAccess.js";
import { SOUND_SEEKERS_CHARACTER_VISUALS } from "./characterCatalog.js";
import { SOUND_SEEKERS_VISUAL_TOKENS } from "./visualTokens.js";

const STYLE_ID = "sound-seekers-painted-shape-v2";
const VIEW_BOX = Object.freeze([0, 0, 1600, 900]);
const NEUTRAL_AFFORDANCE = Object.freeze({
  minCssPx: 56,
  frameTokenId: "choice-neutral",
  emphasisRank: 0,
  motionCueId: null
});
const TARGET_SIZES = Object.freeze([
  Object.freeze([568, 320]),
  Object.freeze([1194, 834]),
  Object.freeze([320, 568])
]);

function deepFreeze(value) {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

function slug(value) {
  return String(value || "").toLocaleLowerCase("en-US")
    .replace(/[^a-z0-9]+/gu, "-").replace(/^-|-$/gu, "");
}

function friendly(value) {
  const words = String(value || "")
    .replace(/^scene-s\d+-(?:option-)?/u, "")
    .replace(/^.*?:/u, "")
    .replace(/[-_]+/gu, " ");
  return words ? `${words[0].toLocaleUpperCase("en-US")}${words.slice(1)}.` : "Story object.";
}

function structuralHash(prefix, value) {
  const serialized = JSON.stringify(value);
  let hash = 2166136261;
  for (let index = 0; index < serialized.length; index += 1) {
    hash ^= serialized.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `${prefix}:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

const chapterById = new Map(SOUND_SEEKERS_CHAPTERS.map(chapter => [chapter.id, chapter]));
const preChoiceBySceneId = new Map(SOUND_SEEKERS_PRE_CHOICE_VISUAL_SEMANTICS
  .map(record => [record.sceneId, record]));
const optionSemanticById = new Map(SOUND_SEEKERS_OPTION_VISUAL_SEMANTICS
  .map(record => [record.id, record]));
const postById = new Map(SOUND_SEEKERS_POST_DECISION_VISUAL_SEMANTICS
  .map(record => [record.id, record]));
const characterById = new Map(SOUND_SEEKERS_CHARACTER_VISUALS
  .map(record => [record.characterId, record]));

function authoredBranchChoiceLabel(post) {
  if (post.storyOutcomeId === null) return null;
  const scene = getSceneVisualSemantics(post.sceneId);
  const branchIndex = scene?.postDecisionSemanticIds.indexOf(post.id) ?? -1;
  const option = branchIndex < 0
    ? null
    : optionSemanticById.get(scene.optionSemanticIds[branchIndex]);
  if (!option) throw new Error(`${post.id}: missing authored branch choice label`);
  return option.childLabel.replace(/[.!?]+$/u, "");
}

function postDecisionAccessibleLabel(post) {
  const branchLabel = authoredBranchChoiceLabel(post);
  return branchLabel === null ? "The repair begins." : `${branchLabel} chosen.`;
}

function postDecisionStateAccessibleLabel(post, stateId) {
  const branchLabel = authoredBranchChoiceLabel(post);
  if (branchLabel === null) {
    if (stateId === post.actionStateId) return "The landmark repair is starting.";
    if (stateId === post.resolvedStateId) return "The landmark is restored.";
    if (stateId === post.consequenceId) return "The restored landmark changes the path.";
    throw new Error(`${post.id}: unknown post-decision state`);
  }
  if (stateId === post.actionStateId) return `${branchLabel} is starting.`;
  if (stateId === post.resolvedStateId) return `${branchLabel} path is ready.`;
  if (stateId === post.consequenceId) {
    return `${branchLabel} changes the next part of the story.`;
  }
  throw new Error(`${post.id}: unknown post-decision state`);
}

export const SOUND_SEEKERS_SCENE_RENDER_SPECS = deepFreeze(
  SOUND_SEEKERS_SCENE_VISUAL_SEMANTICS.map(scene => {
    const preChoice = preChoiceBySceneId.get(scene.sceneId);
    if (!preChoice) throw new Error(`${scene.sceneId}: missing pre-choice visual semantics`);
    return {
      id: scene.id,
      sceneId: scene.sceneId,
      chapterId: scene.chapterId,
      preChoiceSemanticId: scene.preChoiceSemanticId,
      optionSemanticIds: [...scene.optionSemanticIds],
      postDecisionSemanticIds: [...scene.postDecisionSemanticIds],
      characterBindings: preChoice.characterIds.map((characterId, index) => ({
        characterId,
        poseByPhase: index === 0 ? {
          pre_choice: "idle", action: "anticipate", resolved: "react",
          meaning_support: "explain"
        } : {
          pre_choice: "encourage", action: "react", resolved: "celebrate",
          meaning_support: "explain"
        }
      })),
      answerNeutralBeforeChoice: true
    };
  })
);

export const SOUND_SEEKERS_OPTION_VISUALS = deepFreeze(
  SOUND_SEEKERS_OPTION_VISUAL_SEMANTICS.map(option => ({
    semanticId: option.id,
    sceneId: option.sceneId,
    chapterId: option.chapterId,
    comparisonFamilyId: option.comparisonFamilyId,
    frameSemanticId: option.frameSemanticId,
    salienceTier: option.salienceTier,
    propSemanticIds: [...option.propSemanticIds],
    actionSemanticId: option.actionSemanticId,
    rendererKind: "code-native-svg",
    shapeFamilyId: `choice-${slug(option.comparisonFamilyId)}`,
    affordance: NEUTRAL_AFFORDANCE
  }))
);

const optionVisualById = new Map(SOUND_SEEKERS_OPTION_VISUALS
  .map(record => [record.semanticId, record]));

export const SOUND_SEEKERS_MEANING_VISUALS = deepFreeze(
  SOUND_SEEKERS_MEANING_VISUAL_SEMANTICS.map(semantic => {
    const support = getMeaningSupport(semantic.wordId);
    if (!support || support.visualSemanticId !== semantic.id) {
      throw new Error(`${semantic.id}: missing direct meaning-support join`);
    }
    return {
      semanticId: semantic.id,
      wordId: semantic.wordId,
      rendererKind: "code-native-svg",
      shapeFamilyId: `meaning-${support.visualSemanticId.replace(/^meaning-[^-]+-/u, "")}`,
      actionPoseId: `meaning-action:${slug(support.wordId)}`,
      accessibleLabel: support.childDefinition
    };
  })
);

const meaningVisualById = new Map(SOUND_SEEKERS_MEANING_VISUALS
  .map(record => [record.semanticId, record]));

const routeMaterialByChapter = Object.freeze({
  "seedwake-meadow": "route-material-warm-wood",
  "river-gardens": "route-material-ceramic-waterline",
  "fossil-canyon": "route-material-sandstone-track",
  "forge-settlement": "route-material-copper-rail",
  "glass-marsh": "route-material-glass-reed",
  "storm-coast": "route-material-rope-and-timber",
  "lantern-forest": "route-material-root-and-moss",
  "star-reach": "route-material-starlight-stone"
});
const routeFamilyByChapter = Object.freeze({
  "seedwake-meadow": "route-family-meadow-boardwalk",
  "river-gardens": "route-family-water-bridge",
  "fossil-canyon": "route-family-canyon-track",
  "forge-settlement": "route-family-forge-rail",
  "glass-marsh": "route-family-reed-causeway",
  "storm-coast": "route-family-cliff-rope",
  "lantern-forest": "route-family-living-root",
  "star-reach": "route-family-starlight-steps"
});
const routeEdgeByChapter = Object.freeze({
  "seedwake-meadow": "edge-hewn-plank",
  "river-gardens": "edge-ripple-tile",
  "fossil-canyon": "edge-chipped-stone",
  "forge-settlement": "edge-riveted-rail",
  "glass-marsh": "edge-reed-lashed",
  "storm-coast": "edge-rope-guard",
  "lantern-forest": "edge-root-fork",
  "star-reach": "edge-star-cut"
});
const landmarkFamilyByChapter = Object.freeze({
  "seedwake-meadow": "landmark-family-seed-gate",
  "river-gardens": "landmark-family-waterwheel",
  "fossil-canyon": "landmark-family-fossil-arch",
  "forge-settlement": "landmark-family-forge-tower",
  "glass-marsh": "landmark-family-crystal-reed",
  "storm-coast": "landmark-family-storm-beacon",
  "lantern-forest": "landmark-family-lantern-tree",
  "star-reach": "landmark-family-star-observatory"
});

export const SOUND_SEEKERS_ROUTE_SPECS = deepFreeze(
  SOUND_SEEKERS_EXPEDITIONS.map(expedition => {
    const chapter = chapterById.get(expedition.chapterId);
    const chapterOrdinal = chapter.stopIds.indexOf(expedition.stopId);
    if (chapterOrdinal < 0) throw new Error(`${expedition.stopId}: chapter route join failed`);
    return {
      id: `route:${expedition.stopId}`,
      stopId: expedition.stopId,
      chapterId: expedition.chapterId,
      topologyId: chapter.routeTopologies[chapterOrdinal],
      materialTokenId: routeMaterialByChapter[chapter.id],
      routeFamilyId: routeFamilyByChapter[chapter.id],
      edgeTreatmentId: routeEdgeByChapter[chapter.id],
      pathGeometryId: `route-geometry:${expedition.stopId}`,
      viewBox: [...VIEW_BOX],
      taskCamera: {
        subjectZone: { x: 0.18, y: 0.22, width: 0.64, height: 0.6 },
        quietZone: { x: 0.2, y: 0.58, width: 0.6, height: 0.3 }
      }
    };
  })
);

function stateVisual({ landmarkFamilyId, stateOrdinal, stateRole, accessibleLabel }) {
  return {
    landmarkFamilyId,
    stateRole,
    shapeId: `${landmarkFamilyId.replace("landmark-family", "landmark-shape")}-${stateRole}`,
    partCount: stateRole === "problem" ? 2 : stateRole === "repairing" ? 4 : 5 + (stateOrdinal % 2),
    patternId: `landmark-pattern-${stateRole}-${(stateOrdinal % 3) + 1}`,
    accessibleLabel
  };
}

export const SOUND_SEEKERS_LANDMARK_BINDINGS = deepFreeze(
  SOUND_SEEKERS_EXPEDITIONS.map((expedition, expeditionOrdinal) => {
    const sceneId = expedition.connectedTextId;
    const scene = getSceneVisualSemantics(sceneId);
    const preChoice = preChoiceBySceneId.get(sceneId);
    if (!scene || !preChoice) throw new Error(`${sceneId}: missing landmark scene join`);
    const bindings = scene.postDecisionSemanticIds.map(postDecisionSemanticId => {
      const post = postById.get(postDecisionSemanticId);
      if (!post || post.sceneId !== sceneId) throw new Error(`${sceneId}: bad post-decision join`);
      return {
        postDecisionSemanticId,
        storyOutcomeId: post.storyOutcomeId,
        actionStateId: post.actionStateId,
        resolvedStateId: post.resolvedStateId,
        consequenceId: post.consequenceId
      };
    });
    const stateIds = [...new Set([
      preChoice.neutralStateId,
      ...bindings.flatMap(binding => [
        binding.actionStateId, binding.resolvedStateId, binding.consequenceId
      ])
    ])];
    const landmarkFamilyId = landmarkFamilyByChapter[expedition.chapterId];
    const actionStateIds = new Set(bindings.map(binding => binding.actionStateId));
    const childStateLabel = stateId => {
      if (stateId === preChoice.neutralStateId) return `${expedition.title} needs your help.`;
      const binding = bindings.find(item => [
        item.actionStateId, item.resolvedStateId, item.consequenceId
      ].includes(stateId));
      const post = binding ? postById.get(binding.postDecisionSemanticId) : null;
      if (!post) throw new Error(`${sceneId}: missing state-to-post-decision join`);
      return postDecisionStateAccessibleLabel(post, stateId);
    };
    return {
      id: `landmark:${expedition.stopId}`,
      stopId: expedition.stopId,
      chapterId: expedition.chapterId,
      landmarkFamilyId,
      repairId: expedition.payoff.repairId,
      sceneId,
      sceneVisualId: scene.id,
      initialStateId: preChoice.neutralStateId,
      postDecisionBindings: bindings,
      stateVisuals: Object.fromEntries(stateIds.map((stateId, stateOrdinal) => [
        stateId,
        stateVisual({
          landmarkFamilyId,
          stateOrdinal: expeditionOrdinal + stateOrdinal,
          stateRole: stateId === preChoice.neutralStateId
            ? "problem" : actionStateIds.has(stateId) ? "repairing" : "repaired",
          accessibleLabel: childStateLabel(stateId)
        })
      ]))
    };
  })
);

const landmarkBySceneId = new Map(SOUND_SEEKERS_LANDMARK_BINDINGS
  .map(landmark => [landmark.sceneId, landmark]));

function rendererRecord(id, kind, chapterId, descriptor = {}) {
  const record = {
    id,
    kind,
    chapterId,
    rendererKind: kind === "choice_frame" ? "code-native-dom" : "code-native-svg",
    shapeFamilyId: descriptor.shapeFamilyId || `${kind}-${slug(id)}`,
    patternId: descriptor.patternId || `${kind}-pattern-${(slug(id).length % 5) + 1}`,
    accessibleLabel: descriptor.accessibleLabel || friendly(id)
  };
  if (descriptor.chapterIds) record.chapterIds = [...descriptor.chapterIds];
  return record;
}

const semanticVisualRecords = new Map();
function addRenderer(record) {
  const existing = semanticVisualRecords.get(record.id);
  if (existing && JSON.stringify(existing) !== JSON.stringify(record)) {
    throw new Error(`${record.id}: conflicting semantic renderer`);
  }
  semanticVisualRecords.set(record.id, record);
}

for (const preChoice of SOUND_SEEKERS_PRE_CHOICE_VISUAL_SEMANTICS) {
  const sceneSemantic = SOUND_SEEKERS_SCENE_VISUAL_SEMANTICS
    .find(scene => scene.sceneId === preChoice.sceneId);
  addRenderer(rendererRecord(sceneSemantic.id, "scene", preChoice.chapterId));
  addRenderer(rendererRecord(preChoice.id, "pre_choice", preChoice.chapterId));
  addRenderer(rendererRecord(preChoice.settingId, "setting", preChoice.chapterId, {
    accessibleLabel: `${chapterById.get(preChoice.chapterId).title} story place.`
  }));
  for (const [index, id] of preChoice.neutralPropIds.entries()) {
    addRenderer(rendererRecord(id, "neutral_prop", preChoice.chapterId, {
      accessibleLabel: index === 0 ? "A trail marker." : "A story marker."
    }));
  }
  addRenderer(rendererRecord(preChoice.neutralStateId, "neutral_state", preChoice.chapterId));
}
for (const option of SOUND_SEEKERS_OPTION_VISUAL_SEMANTICS) {
  addRenderer(rendererRecord(option.id, "option", option.chapterId, {
    accessibleLabel: option.accessibleLabel
  }));
  addRenderer(rendererRecord(option.frameSemanticId, "choice_frame", option.chapterId));
  for (const id of option.propSemanticIds) {
    addRenderer(rendererRecord(id, "option_prop", option.chapterId));
  }
  addRenderer(rendererRecord(option.actionSemanticId, "option_action", option.chapterId));
}
for (const post of SOUND_SEEKERS_POST_DECISION_VISUAL_SEMANTICS) {
  addRenderer(rendererRecord(post.id, "post_decision", post.chapterId, {
    accessibleLabel: postDecisionAccessibleLabel(post)
  }));
  for (const stateId of new Set([
    post.actionStateId, post.resolvedStateId, post.consequenceId
  ])) {
    addRenderer(rendererRecord(stateId, "landmark_state", post.chapterId, {
      accessibleLabel: postDecisionStateAccessibleLabel(post, stateId)
    }));
  }
}
const meaningChapterIds = new Map(SOUND_SEEKERS_MEANING_VISUALS.map(meaning => [
  meaning.semanticId,
  [...new Set(SOUND_SEEKERS_POST_DECISION_VISUAL_SEMANTICS
    .filter(post => post.meaningSemanticIds.includes(meaning.semanticId))
    .map(post => post.chapterId))]
]));
for (const meaning of SOUND_SEEKERS_MEANING_VISUALS) {
  const chapterIds = meaningChapterIds.get(meaning.semanticId);
  addRenderer(rendererRecord(meaning.semanticId, "meaning", null, {
    shapeFamilyId: meaning.shapeFamilyId,
    accessibleLabel: meaning.accessibleLabel,
    chapterIds
  }));
  addRenderer(rendererRecord(meaning.actionPoseId, "meaning_action", null, { chapterIds }));
}
for (const route of SOUND_SEEKERS_ROUTE_SPECS) {
  addRenderer(rendererRecord(route.pathGeometryId, "route", route.chapterId, {
    shapeFamilyId: `route-${route.topologyId}`
  }));
}
for (const landmark of SOUND_SEEKERS_LANDMARK_BINDINGS) {
  const expedition = SOUND_SEEKERS_EXPEDITIONS.find(item => item.stopId === landmark.stopId);
  if (!expedition) throw new Error(`${landmark.id}: missing authored expedition label`);
  addRenderer(rendererRecord(landmark.id, "landmark", landmark.chapterId, {
    shapeFamilyId: `landmark-${slug(landmark.repairId)}`,
    accessibleLabel: `${expedition.title} landmark.`
  }));
}
for (const character of SOUND_SEEKERS_CHARACTER_VISUALS) {
  addRenderer(rendererRecord(`character:${slug(character.characterId)}`, "character", character.chapterId, {
    shapeFamilyId: character.bodyShapeId,
    accessibleLabel: character.characterId
  }));
}
for (const chapter of SOUND_SEEKERS_CHAPTERS) {
  addRenderer(rendererRecord(`prop-family:${chapter.id}`, "prop_family", chapter.id, {
    shapeFamilyId: `prop-structure-${chapter.index}`,
    accessibleLabel: `${chapter.title} discovery tools.`
  }));
  addRenderer(rendererRecord(
    `reward-family:${chapter.chapterReward.id}`,
    "reward_family",
    chapter.id,
    {
      shapeFamilyId: `reward-structure-${chapter.index}`,
      accessibleLabel: chapter.chapterReward.name || `${chapter.title} reward.`
    }
  ));
  addRenderer(rendererRecord(`wonder-effect:${chapter.wonderId}`, "wonder_effect", chapter.id, {
    shapeFamilyId: `wonder-composition-${chapter.index}`,
    accessibleLabel: `${chapter.title} wonder effect.`
  }));
}

export const SOUND_SEEKERS_SEMANTIC_VISUALS = deepFreeze([...semanticVisualRecords.values()]);
const semanticVisualById = new Map(SOUND_SEEKERS_SEMANTIC_VISUALS
  .map(record => [record.id, record]));
const sceneRenderById = new Map(SOUND_SEEKERS_SCENE_RENDER_SPECS
  .map(record => [record.sceneId, record]));

export function resolveSemanticVisual(semanticId) {
  return typeof semanticId === "string" ? semanticVisualById.get(semanticId) || null : null;
}

export function resolveMeaningVisual(semanticId) {
  return typeof semanticId === "string" ? meaningVisualById.get(semanticId) || null : null;
}

export function resolveSceneVisual(sceneId) {
  return typeof sceneId === "string" ? sceneRenderById.get(sceneId) || null : null;
}

function validDimensionPair(value) {
  return Array.isArray(value)
    && value.length === 2
    && value.every(dimension => Number.isInteger(dimension) && dimension > 0);
}

export function computeBackgroundCrop(input = {}) {
  if (!input || Object.getPrototypeOf(input) !== Object.prototype
    || Reflect.ownKeys(input).length !== 3
    || Reflect.ownKeys(input).some(key => (
      typeof key !== "string" || !["sourceSize", "targetSize", "focalPoint"].includes(key)
    ))) {
    throw new TypeError("background crop contract is invalid");
  }
  const { sourceSize, targetSize, focalPoint } = input;
  if (!validDimensionPair(sourceSize)
    || !TARGET_SIZES.some(size => size[0] === targetSize?.[0] && size[1] === targetSize?.[1])
    || !Array.isArray(focalPoint)
    || focalPoint.length !== 2
    || focalPoint.some(value => !Number.isFinite(value) || value < 0 || value > 1)) {
    throw new TypeError("background crop contract is invalid");
  }
  const sourceAspect = sourceSize[0] / sourceSize[1];
  const targetAspect = targetSize[0] / targetSize[1];
  const width = targetAspect >= sourceAspect ? 1 : targetAspect / sourceAspect;
  const height = targetAspect >= sourceAspect ? sourceAspect / targetAspect : 1;
  const x = Math.max(0, Math.min(1 - width, focalPoint[0] - (width / 2)));
  const y = Math.max(0, Math.min(1 - height, focalPoint[1] - (height / 2)));
  return deepFreeze({
    x,
    y,
    width,
    height,
    objectPosition: `${Number((focalPoint[0] * 100).toFixed(4))}% ${Number((focalPoint[1] * 100).toFixed(4))}%`
  });
}

function assertChildScene(childScene, renderSpec) {
  if (!isConnectedTextChildScene(childScene)) {
    throw new TypeError("scene visual presentation requires a genuine child scene");
  }
  const sourceScene = getSceneVisualSemantics(childScene.id);
  const preChoice = preChoiceBySceneId.get(childScene.id);
  if (!sourceScene || !preChoice
    || childScene.chapterId !== sourceScene.chapterId
    || childScene.visualSemanticId !== sourceScene.id
    || childScene.preChoiceSemanticId !== preChoice.id
    || childScene.residentId !== preChoice.characterIds[1]
    || childScene.choice.options.length !== renderSpec.optionSemanticIds.length
    || childScene.choice.options.some(option => {
      const source = optionSemanticById.get(option.visualSemanticId);
      return !source || source.sceneId !== childScene.id
        || source.childLabel !== option.childLabel
        || source.accessibleLabel !== option.accessibleLabel
        || !renderSpec.optionSemanticIds.includes(option.visualSemanticId);
    })) {
    throw new TypeError("child scene does not match its semantic visual contract");
  }
}

function presentationCharacters(renderSpec, phase) {
  return renderSpec.characterBindings.map(binding => ({
    characterId: binding.characterId,
    pose: binding.poseByPhase[phase],
    visual: characterById.get(binding.characterId)
  }));
}

function neutralPresentation(childScene, renderSpec, preChoice) {
  return deepFreeze({
    sceneId: childScene.id,
    chapterId: childScene.chapterId,
    scenePhase: "pre_choice",
    visualStateId: preChoice.neutralStateId,
    kitId: childScene.chapterId,
    setting: resolveSemanticVisual(preChoice.settingId),
    characters: presentationCharacters(renderSpec, "pre_choice"),
    focalProps: preChoice.neutralPropIds.map(resolveSemanticVisual),
    options: childScene.choice.options.map(option => ({
      token: option.token,
      presentation: option.presentation,
      childLabel: option.childLabel,
      accessibleLabel: option.accessibleLabel,
      visualSemanticId: option.visualSemanticId,
      visual: optionVisualById.get(option.visualSemanticId),
      affordance: NEUTRAL_AFFORDANCE
    })),
    meaningVisual: null
  });
}

export function resolveSceneVisualPresentation(childScene, {
  activeAttemptId = null,
  reducerRevision = null,
  sceneAccess = null
} = {}) {
  const renderSpec = resolveSceneVisual(childScene?.id);
  if (!renderSpec) throw new TypeError("unknown scene visual presentation");
  const preChoice = preChoiceBySceneId.get(childScene.id);
  assertChildScene(childScene, renderSpec);
  const neutral = neutralPresentation(childScene, renderSpec, preChoice);
  if (!sceneAccess || typeof activeAttemptId !== "string" || !Number.isInteger(reducerRevision)
    || !validateSceneVisualAccess(sceneAccess, {
      sceneId: childScene.id,
      attemptId: activeAttemptId,
      reducerRevision
    })) return neutral;

  if (!renderSpec.postDecisionSemanticIds.includes(sceneAccess.postDecisionSemanticId)) return neutral;
  const post = postById.get(sceneAccess.postDecisionSemanticId);
  if (!post || post.sceneId !== childScene.id || post.storyOutcomeId !== sceneAccess.storyOutcomeId) {
    return neutral;
  }
  const phase = sceneAccess.phase;
  const visualStateId = phase === "action" ? post.actionStateId : post.resolvedStateId;
  const meaningVisual = phase === "meaning_support"
    && post.meaningSemanticIds.includes(sceneAccess.meaningSemanticId)
    ? resolveMeaningVisual(sceneAccess.meaningSemanticId)
    : null;
  if (phase === "meaning_support" && !meaningVisual) return neutral;

  const landmark = landmarkBySceneId.get(childScene.id);
  return deepFreeze({
    sceneId: childScene.id,
    chapterId: childScene.chapterId,
    scenePhase: phase,
    visualStateId,
    kitId: childScene.chapterId,
    setting: resolveSemanticVisual(preChoice.settingId),
    characters: presentationCharacters(renderSpec, phase),
    focalProps: [
      resolveSemanticVisual(post.id),
      resolveSemanticVisual(visualStateId),
      resolveSemanticVisual(landmark.id)
    ],
    options: neutral.options,
    meaningVisual
  });
}

const CANONICAL_CATALOGS = {
  scenes: SOUND_SEEKERS_SCENE_RENDER_SPECS,
  options: SOUND_SEEKERS_OPTION_VISUALS,
  meanings: SOUND_SEEKERS_MEANING_VISUALS,
  semantics: SOUND_SEEKERS_SEMANTIC_VISUALS,
  routes: SOUND_SEEKERS_ROUTE_SPECS,
  landmarks: SOUND_SEEKERS_LANDMARK_BINDINGS
};

function recursivelyFrozen(value) {
  if (value === null || typeof value !== "object") return true;
  return Object.isFrozen(value) && Object.values(value).every(recursivelyFrozen);
}

export function validateSoundSeekersVisualCatalogs(catalogs = CANONICAL_CATALOGS) {
  const keys = ["scenes", "options", "meanings", "semantics", "routes", "landmarks"];
  if (!catalogs || Reflect.ownKeys(catalogs).length !== keys.length
    || Reflect.ownKeys(catalogs).some(key => typeof key !== "string" || !keys.includes(key))) {
    throw new TypeError("visual catalog bundle has an invalid shape");
  }
  for (const key of keys) {
    if (!recursivelyFrozen(catalogs[key])) {
      throw new TypeError(`visual catalog ${key} must be recursively frozen`);
    }
    if (JSON.stringify(catalogs[key]) !== JSON.stringify(CANONICAL_CATALOGS[key])) {
      throw new TypeError(`visual catalog ${key} drifted from its authoritative joins`);
    }
  }
  if (catalogs.scenes.length !== 40 || catalogs.options.length !== 112
    || catalogs.routes.length !== 40 || catalogs.landmarks.length !== 40
    || new Set(catalogs.semantics.map(record => record.id)).size !== catalogs.semantics.length
    || SOUND_SEEKERS_VISUAL_SEMANTIC_REGISTRY.some(record => (
      !resolveSceneVisualSemantic(record.id) || !record.kind
    ))
    || SOUND_SEEKERS_MEANING_SUPPORT.some(support => (
      !catalogs.meanings.some(visual => visual.semanticId === support.visualSemanticId
        && visual.wordId === support.wordId)
    ))
    || SOUND_SEEKERS_NARRATIVE_BRANCH_OUTCOMES.length !== 16
    || !Object.hasOwn(SOUND_SEEKERS_VISUAL_TOKENS, "outline-strong")) {
    throw new TypeError("visual catalogs fail their cardinality or authority contract");
  }
  return true;
}

validateSoundSeekersVisualCatalogs();

export function sceneVisualCatalogSignature() {
  return structuralHash(STYLE_ID, CANONICAL_CATALOGS);
}

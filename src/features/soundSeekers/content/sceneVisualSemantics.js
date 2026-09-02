import { CONNECTED_TEXT_RECORDS } from "./connectedTextRecords.js";
import { MEANING_SUPPORT_RECORDS } from "./meaningSupportRecords.js";

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

const slug = value => String(value || "").toLocaleLowerCase("en-US")
  .replace(/[^a-z0-9]+/gu, "-").replace(/^-|-$/gu, "");

const postIdsForScene = scene => scene.choice.kind === "narrative_bridge"
  ? scene.narrativeBranches.map(branch => branch.postDecisionSemanticId)
  : [`${scene.id}-post-decision`];

export const SOUND_SEEKERS_SCENE_VISUAL_SEMANTICS = deepFreeze(
  CONNECTED_TEXT_RECORDS.map(scene => ({
    id: scene.visualSemanticId,
    kind: "scene",
    sceneId: scene.id,
    chapterId: scene.chapterId,
    preChoiceSemanticId: `${scene.id}-pre-choice`,
    optionSemanticIds: scene.choice.options.map(option => option.visualSemanticId),
    postDecisionSemanticIds: postIdsForScene(scene),
    answerNeutralBeforeChoice: true
  }))
);

export const SOUND_SEEKERS_PRE_CHOICE_VISUAL_SEMANTICS = deepFreeze(
  CONNECTED_TEXT_RECORDS.map(scene => ({
    id: `${scene.id}-pre-choice`,
    kind: "pre_choice",
    sceneId: scene.id,
    chapterId: scene.chapterId,
    settingId: `${scene.chapterId}-story-setting`,
    characterIds: Object.freeze([...scene.preChoiceCharacterIds]),
    neutralPropIds: Object.freeze([`${scene.id}-path-marker`, `${scene.id}-story-sign`]),
    neutralStateId: scene.consequencePreviewId,
    answerNeutral: true
  }))
);

export const SOUND_SEEKERS_OPTION_VISUAL_SEMANTICS = deepFreeze(
  CONNECTED_TEXT_RECORDS.flatMap(scene => scene.choice.options.map(option => ({
    id: option.visualSemanticId,
    kind: "option",
    sceneId: scene.id,
    chapterId: scene.chapterId,
    comparisonFamilyId: scene.choice.comparisonFamilyId,
    frameSemanticId: `${scene.id}-choice-frame`,
    salienceTier: "equal_choice",
    propSemanticIds: Object.freeze([`${scene.id}-${slug(option.childLabel)}-prop`]),
    actionSemanticId: `${scene.id}-${slug(option.childLabel)}-action`,
    childLabel: option.childLabel,
    accessibleLabel: option.accessibleLabel
  })))
);

const postDescriptors = CONNECTED_TEXT_RECORDS.flatMap(scene =>
  postIdsForScene(scene).map((id, branchIndex) => ({ scene, id, branchIndex }))
);
const meaningByWordId = new Map(MEANING_SUPPORT_RECORDS
  .map(record => [record.wordId, record.visualSemanticId]));

export const SOUND_SEEKERS_POST_DECISION_VISUAL_SEMANTICS = deepFreeze(
  postDescriptors.map(({ scene, id, branchIndex }) => {
    const branch = scene.choice.kind === "narrative_bridge"
      ? scene.narrativeBranches[branchIndex] : null;
    const branchSuffix = branch ? `branch-${branchIndex + 1}` : "assessed";
    return {
      id,
      kind: "post_decision",
      sceneId: scene.id,
      chapterId: scene.chapterId,
      actionStateId: `${scene.repairId}-${branchSuffix}-action`,
      resolvedStateId: branch ? `${scene.consequenceId}-${branchSuffix}-resolved` : scene.consequenceId,
      consequenceId: branch ? `${scene.consequenceId}-${branchSuffix}` : scene.consequenceId,
      storyOutcomeId: branch?.storyOutcomeId || null,
      meaningSemanticIds: Object.freeze(scene.postDecisionMeaningWordIds[branchIndex]
        .map(wordId => {
          const semanticId = meaningByWordId.get(wordId);
          if (!semanticId) throw new Error(`${scene.id}: unresolved post-decision meaning ${wordId}`);
          return semanticId;
        }))
    };
  })
);

export const SOUND_SEEKERS_NARRATIVE_BRANCH_OUTCOMES = deepFreeze(
  CONNECTED_TEXT_RECORDS.flatMap(scene => scene.narrativeBranches.map(branch => ({
    sceneId: scene.id,
    token: branch.token,
    storyOutcomeId: branch.storyOutcomeId,
    postDecisionSemanticId: branch.postDecisionSemanticId
  })))
);

export const SOUND_SEEKERS_MEANING_VISUAL_SEMANTICS = deepFreeze(
  MEANING_SUPPORT_RECORDS.map(record => ({
    id: record.visualSemanticId,
    kind: "meaning",
    wordId: record.wordId
  }))
);

const orderedPostDecisions = [...SOUND_SEEKERS_POST_DECISION_VISUAL_SEMANTICS]
  .sort((left, right) => {
    const stopDifference = Number(left.sceneId.slice(7)) - Number(right.sceneId.slice(7));
    return stopDifference || postIdsForScene(CONNECTED_TEXT_RECORDS
      .find(scene => scene.id === left.sceneId)).indexOf(left.id)
      - postIdsForScene(CONNECTED_TEXT_RECORDS.find(scene => scene.id === right.sceneId)).indexOf(right.id);
  });

export const SOUND_SEEKERS_MEANING_VISUAL_OWNERS = deepFreeze(
  SOUND_SEEKERS_MEANING_VISUAL_SEMANTICS.map(meaning => {
    const owner = orderedPostDecisions.find(post => post.meaningSemanticIds.includes(meaning.id));
    return {
      meaningSemanticId: meaning.id,
      sceneId: owner.sceneId,
      postDecisionSemanticId: owner.id
    };
  })
);

export const SOUND_SEEKERS_VISUAL_SEMANTIC_REGISTRY = deepFreeze([
  ...SOUND_SEEKERS_SCENE_VISUAL_SEMANTICS,
  ...SOUND_SEEKERS_PRE_CHOICE_VISUAL_SEMANTICS,
  ...SOUND_SEEKERS_OPTION_VISUAL_SEMANTICS,
  ...SOUND_SEEKERS_POST_DECISION_VISUAL_SEMANTICS,
  ...SOUND_SEEKERS_MEANING_VISUAL_SEMANTICS
]);

const byId = new Map(SOUND_SEEKERS_VISUAL_SEMANTIC_REGISTRY.map(record => [record.id, record]));
const sceneById = new Map(SOUND_SEEKERS_SCENE_VISUAL_SEMANTICS.map(record => [record.sceneId, record]));
const narrativeByKey = new Map(SOUND_SEEKERS_NARRATIVE_BRANCH_OUTCOMES
  .map(record => [`${record.sceneId}\u0000${record.token}`, record]));

if (byId.size !== SOUND_SEEKERS_VISUAL_SEMANTIC_REGISTRY.length) {
  throw new Error("Sound Seekers visual semantic IDs must be globally unique");
}

export function getSceneVisualSemantics(sceneId) {
  return sceneById.get(String(sceneId || "").trim()) || null;
}

export function resolveNarrativeBranchOutcome(sceneId, narrativeChoiceToken) {
  return narrativeByKey.get(`${String(sceneId || "").trim()}\u0000${String(narrativeChoiceToken || "").trim()}`) || null;
}

export function resolveSceneVisualSemantic(semanticId) {
  return byId.get(String(semanticId || "").trim()) || null;
}

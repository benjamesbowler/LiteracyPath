import { getInstructionContract } from "../content/instructionContracts.js";
import {
  createConnectedTextChallenge,
  toChildConnectedTextScene
} from "../content/connectedText.js";
import { getPronunciation } from "../content/pronunciationLexicon.js";
import { SOUND_SEEKERS_INTERACTION_CONTEXTS } from "../content/expeditions.js";
import { graphemeLabel } from "../../../utils/questLabels.js";
import {
  assertChildChoiceLabel,
  createHeartWordChoices,
  createSoundTargetChoices,
  createWordForgeRack,
  createWordMeaningChoices,
  createWordPatternChoices
} from "../content/childChoiceContent.js";
import { createInteractionRuntimeModel } from "./powers/contracts.js";

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

function identityFor(action, targetId) {
  if (["phoneme_to_grapheme", "grapheme_to_phoneme"].includes(action.recordsDomain)) {
    return { targetId, position: null };
  }
  if (["word_decoding", "word_segmentation_encoding"].includes(action.recordsDomain)) {
    return {
      targetId: `word:${action.wordId}`,
      wordId: action.wordId,
      position: action.recordsDomain === "word_decoding" ? "whole" : 0
    };
  }
  if (action.recordsDomain === "heart_word_mapping" && action.contentBinding?.category === "heartWords") {
    return {
      targetId,
      wordId: action.contentBinding.wordId || null,
      position: null,
      activityType: action.activityFocus
    };
  }
  throw new Error("ordinary challenge action has no supported evidence identity");
}

function stopIdFor(action) {
  const stopId = /^s\d+/u.exec(String(action?.id || ""))?.[0] || null;
  if (!stopId) throw new Error(`${action?.id || "(none)"}: challenge needs a canonical stop id`);
  return stopId;
}

function presentationFor(action, challengeId, options, forgeRack = null) {
  const id = suffix => `${action.contextId}:${challengeId}:${suffix}`;
  const choices = options.map((option, index) => ({
    id: id(`choice:${index}`),
    label: assertChildChoiceLabel(option.label, `${action.id} choice ${index + 1}`),
    token: option.token
  }));
  if (action.powerId === "echo_search") return { candidates: choices.map(item => ({ ...item, id: id(`candidate:${choices.indexOf(item)}`) })) };
  if (action.powerId === "contrast_sort") return {
    items: [0, 1, 2, 3].map(index => ({
      id: id(`item:${index}`),
      label: `Sound card ${index + 1} — listen, then choose its home`
    })),
    bins: choices.slice(0, 3).map((item, index) => ({ ...item, id: id(`bin:${index}`) }))
  };
  if (action.powerId === "word_forge") {
    const pronunciation = getPronunciation(action.wordId);
    if (!pronunciation || !forgeRack) throw new Error(`${action.id}: canonical forge content is missing`);
    return {
      rack: forgeRack.map((tile, index) => ({
        id: id(`tile:${index}`),
        label: assertChildChoiceLabel(tile.label, `${action.id} tile ${index + 1}`),
        token: tile.token
      })),
      slots: pronunciation.units.map((unused, index) => ({ id: id(`slot:${index}`) }))
    };
  }
  if (action.powerId === "blend_bridge") {
    const pronunciation = getPronunciation(action.wordId);
    if (!pronunciation) throw new Error(`${action.id}: canonical pronunciation is missing`);
    return {
      segments: pronunciation.units.map((unit, index) => ({
        id: id(`segment:${index}`),
        label: assertChildChoiceLabel(graphemeLabel(unit.grapheme), `${action.id} segment ${index + 1}`)
      })),
      choices
    };
  }
  if (action.powerId === "memory_delivery") return {
    recipients: choices.map((item, index) => ({ ...item, id: id(`recipient:${index}`) }))
  };
  if (action.powerId === "story_power") return { choices };
  throw new Error(`${action.id}: deck-owned power must use its canonical content transaction`);
}

export function createChallenge({
  action, missionId, attemptOrdinal = 0, seed = 0, selectedTargetId = null,
  contentSource = null
} = {}) {
  const context = SOUND_SEEKERS_INTERACTION_CONTEXTS[action?.contextId];
  if (!action || !context || !Number.isInteger(seed)
    || !Number.isInteger(attemptOrdinal) || attemptOrdinal < 0
    || typeof missionId !== "string" || !missionId) {
    throw new Error("challenge materialization requires a canonical action and mission identity");
  }
  createInteractionRuntimeModel(action, context);
  const instruction = getInstructionContract(action.instructionId);
  const served = contentSource?.servedInstance || null;
  const sharedHeart = action.contentBinding?.category === "heartWords"
    && action.contentBinding.isVisitOwner === false;
  if (sharedHeart && (!served
    || served.category !== "heartWords"
    || served.slotId !== action.contentBinding.slotId
    || served.contentInstanceId !== action.contentBinding.contentInstanceId
    || served.visitOwnerId !== action.contentBinding.visitOwnerId
    || !served.eligibleActivityTypes.includes(action.activityFocus)
    || served.wordId !== contentSource.catalogRecord?.wordId)) {
    throw new Error(`${action.id}: shared heart challenge needs its canonical owner visit`);
  }
  const targetId = served?.targetId || selectedTargetId || action.targetIds?.[Math.abs(seed) % action.targetIds.length]
    || action.unitTargetIds?.[0] || null;
  const expectedToken = sharedHeart
    ? served.answerTokensByActivity[action.activityFocus]
    : action.recordsDomain === "word_decoding" ? action.wordId : targetId;
  if (!targetId || !expectedToken) throw new Error(`${action.id}: challenge target cannot be derived`);
  const stopId = stopIdFor(action);
  let options;
  let forgeRack = null;
  if (sharedHeart) {
    options = createHeartWordChoices({
      record: contentSource.catalogRecord,
      activityType: action.activityFocus,
      stopId,
      seed
    });
  } else if (action.powerId === "word_forge") {
    forgeRack = createWordForgeRack({
      wordId: action.wordId,
      expectedTargetId: expectedToken,
      stopId,
      seed
    });
    options = [...new Map(forgeRack.map(tile => [tile.token, {
      token: tile.token,
      label: tile.label
    }])).values()];
  } else if (action.recordsDomain === "word_decoding") {
    options = action.powerId === "contrast_sort"
      ? createWordPatternChoices({ wordId: action.wordId, seed })
      : createWordMeaningChoices({ wordId: action.wordId, stopId, seed });
  } else {
    options = createSoundTargetChoices({ targetId, stopId, seed });
  }
  const optionTokens = options.map(option => option.token);
  const challengeId = `${missionId}:${action.id}:attempt:${attemptOrdinal}:challenge`;
  const challenge = {
    challengeId,
    attemptId: `${missionId}:${action.id}:attempt:${attemptOrdinal}`,
    instructionId: instruction.instructionId,
    powerId: action.powerId,
    expectedAction: action.expectedAction,
    recordsDomain: action.recordsDomain,
    expectedToken,
    optionTokens,
    childText: instruction.childText,
    cue: instruction.cue,
    requiresAudio: false,
    ...identityFor(sharedHeart ? { ...action, contentBinding: {
      ...action.contentBinding, wordId: served.wordId
    } } : action, targetId)
  };
  challenge.presentation = presentationFor(action, challengeId, options, forgeRack);
  return deepFreeze(challenge);
}

export function createStoryTransferChallenge(state, input) {
  return createConnectedTextChallenge(state, input);
}

export function createStoryChildScene(sceneId, routeSeed) {
  return toChildConnectedTextScene(sceneId, routeSeed);
}

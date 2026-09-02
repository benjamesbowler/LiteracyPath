import { SOUND_SEEKERS_EXPEDITIONS } from "./expeditions.js";
import { SOUND_SEEKERS_HEART_WORDS } from "./heartWords.js";
import { SOUND_SEEKERS_CHAPTERS } from "./chapters/index.js";
import { getPronunciation } from "./pronunciationLexicon.js";
import {
  getContentDeckCatalogRecord
} from "./contentDeckCatalogs.js";
import { CONNECTED_TEXT_RECORDS } from "./connectedTextRecords.js";
import { CONNECTED_TEXT_DECISION_FEEDBACK } from "./connectedTextAnswerKeys.js";
import { MEANING_SUPPORT_RECORDS } from "./meaningSupportRecords.js";
import {
  ADVANCED_SCENE_TOKEN_CONTENT_HASH,
  ADVANCED_SCENE_TOKEN_COUNT,
  ADVANCED_SCENE_TOKEN_IDS
} from "./connectedTextUsage.generated.js";
import {
  materializeStoryTransferChallenge,
  resumeStoryTransferTransaction
} from "../engine/contentDeckTransactions.js";

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

function sameMembers(left, right) {
  return Array.isArray(left) && Array.isArray(right)
    && left.length === right.length
    && [...left].sort().every((value, index) => value === [...right].sort()[index]);
}

export function tokenizeConnectedText(text) {
  return String(text || "")
    .normalize("NFKC")
    .replace(/[\u2018\u2019]/gu, "'")
    .toLocaleLowerCase("en-US")
    .match(/[a-z]+(?:'[a-z]+)?/gu) || [];
}

export function readabilityBandForStop(stopIndex) {
  if (!Number.isInteger(stopIndex) || stopIndex < 1 || stopIndex > 40) {
    throw new Error("connected-text stop index is invalid");
  }
  if (stopIndex <= 8) return Object.freeze({ level: "phrase", minTokens: 2, maxTokens: 5, minSentences: 1, maxSentences: 1 });
  if (stopIndex <= 16) return Object.freeze({ level: "sentence", minTokens: 5, maxTokens: 9, minSentences: 1, maxSentences: 1 });
  if (stopIndex <= 24) return Object.freeze({ level: "paired_sentences", minTokens: 8, maxTokens: 16, minSentences: 2, maxSentences: 2 });
  if (stopIndex <= 32) return Object.freeze({ level: "micro_scene", minTokens: 12, maxTokens: 24, minSentences: 2, maxSentences: 3 });
  return Object.freeze({ level: "short_passage", minTokens: 18, maxTokens: 32, minSentences: 2, maxSentences: 4 });
}

const heartIntroduction = new Map(SOUND_SEEKERS_HEART_WORDS
  .map(record => [record.recordId, Number(record.introductionStopId.slice(1))]));
const meaningSupportWordIds = new Set(MEANING_SUPPORT_RECORDS.map(record => record.wordId));

function sentenceCount(text) {
  return (String(text || "").match(/[.!?]+(?=\s|$)/gu) || []).length;
}

function validateAdvancedAudit(scene, errors) {
  const advanced = [...new Set(scene.advancedTokenAudit.map(entry => entry.tokenId))].sort();
  if (!sameMembers(advanced, scene.advancedTokenIds)) errors.push("advanced token projection mismatch");
  const ordinals = new Set();
  for (const entry of scene.advancedTokenAudit) {
    if (!entry || Object.keys(entry).join(",") !== "tokenId,tokenOrdinal,advancedReason") {
      errors.push("advanced token audit shape mismatch");
      continue;
    }
    if (scene.tokenIds[entry.tokenOrdinal] !== entry.tokenId || ordinals.has(entry.tokenOrdinal)) {
      errors.push("advanced token ordinal mismatch");
    }
    ordinals.add(entry.tokenOrdinal);
  }
  const status = scene.advancedTokenIds.length ? "reviewed" : "reviewed_none_required";
  if (scene.advancedTokenAuditDecision?.status !== status
    || !Number.isFinite(Date.parse(scene.advancedTokenAuditDecision?.reviewedAt || ""))) {
    errors.push("advanced token audit decision mismatch");
  }
}

function validateChildLabelAudit(scene, stopIndex, errors) {
  const actualAdvanced = [];
  for (const option of scene.choice?.options || []) {
    const labelTokens = tokenizeConnectedText(option.childLabel);
    if (labelTokens.length === 0 || labelTokens.length > 6) {
      errors.push("child label token count mismatch");
    }
    labelTokens.forEach((surface, tokenOrdinal) => {
      const pronunciation = getPronunciation(surface);
      if (!pronunciation || pronunciation.word !== surface) {
        errors.push(`unresolved child label token ${option.token}:${tokenOrdinal}`);
        return;
      }
      const heartStop = heartIntroduction.get(`hw:${surface}`) || Infinity;
      const targetStop = Math.min(...pronunciation.taughtAt.map(value => Number(value.slice(1))));
      if (Math.min(heartStop, targetStop) > stopIndex) {
        actualAdvanced.push({
          optionToken: option.token,
          tokenId: surface,
          tokenOrdinal,
          advancedReason: "new_concept"
        });
      }
    });
  }
  if (JSON.stringify(actualAdvanced) !== JSON.stringify(scene.advancedChildLabelAudit)) {
    errors.push("advanced child label audit mismatch");
  }
  const projected = [...new Set(actualAdvanced.map(entry => entry.tokenId))].sort();
  if (!sameMembers(projected, scene.advancedChildLabelTokenIds)) {
    errors.push("advanced child label projection mismatch");
  }
  if (projected.some(wordId => !meaningSupportWordIds.has(wordId))) {
    errors.push("unsupported advanced child label token");
  }
  const status = projected.length ? "reviewed" : "reviewed_none_required";
  if (scene.advancedChildLabelAuditDecision?.status !== status
    || !Number.isFinite(Date.parse(scene.advancedChildLabelAuditDecision?.reviewedAt || ""))) {
    errors.push("advanced child label audit decision mismatch");
  }
}

function validatePostDecisionMeaning(scene, errors) {
  const expectedCount = scene.choice?.kind === "narrative_bridge" ? 2 : 1;
  if (!Array.isArray(scene.postDecisionMeaningWordIds)
    || scene.postDecisionMeaningWordIds.length !== expectedCount) {
    errors.push("post-decision meaning ownership mismatch");
    return;
  }
  const runningWords = new Set(tokenizeConnectedText(scene.text));
  const transferRecord = getContentDeckCatalogRecord("transfer", scene.transferRef?.recordId);
  scene.postDecisionMeaningWordIds.forEach((wordIds, index) => {
    const option = scene.choice.kind === "narrative_bridge"
      ? scene.choice.options.find(item => item.token === scene.narrativeBranches[index]?.token)
      : scene.choice.options.find(item => item.token === transferRecord?.decisionContract?.expectedToken);
    const directlyJustified = new Set([
      ...runningWords,
      ...tokenizeConnectedText(option?.childLabel),
      ...tokenizeConnectedText(option?.accessibleLabel)
    ]);
    if (!Array.isArray(wordIds) || wordIds.length === 0
      || wordIds.some(wordId => !meaningSupportWordIds.has(wordId)
        || !directlyJustified.has(wordId))) {
      errors.push("post-decision meaning is not directly justified");
    }
  });
}

export function validateSceneAtStop(scene, stopId) {
  const errors = [];
  const stopIndex = Number(String(stopId || "").replace(/^s/u, ""));
  let band;
  try {
    band = readabilityBandForStop(stopIndex);
  } catch {
    return ["invalid stop"];
  }
  if (!scene || scene.stopId !== stopId) return ["scene stop mismatch"];
  const tokens = tokenizeConnectedText(scene.text);
  const sentences = sentenceCount(scene.text);
  if (scene.level !== band.level) errors.push("readability level mismatch");
  if (tokens.length < band.minTokens || tokens.length > band.maxTokens) errors.push("running-text token count mismatch");
  if (sentences < band.minSentences || sentences > band.maxSentences) errors.push("running-text sentence count mismatch");
  if (tokens.length !== scene.tokenIds.length) errors.push("ordered token id count mismatch");
  tokens.forEach((surface, ordinal) => {
    const tokenId = scene.tokenIds[ordinal];
    const normalizedId = String(tokenId || "").replace(/^hw:/u, "");
    const pronunciation = getPronunciation(normalizedId);
    const auditedAdvanced = scene.advancedTokenAudit.some(entry =>
      entry.tokenId === tokenId && entry.tokenOrdinal === ordinal);
    if (!pronunciation || pronunciation.word !== surface) errors.push(`unresolved token ${ordinal}`);
    if (tokenId.startsWith("hw:")) {
      if (!scene.heartWordIds.includes(tokenId)
        || ((heartIntroduction.get(tokenId) || Infinity) > stopIndex && !auditedAdvanced)) {
        errors.push(`unavailable heart word ${tokenId}`);
      }
    } else {
      const firstStop = Math.min(...(pronunciation?.taughtAt || []).map(value => Number(value.slice(1))));
      if (!Number.isFinite(firstStop) || (firstStop > stopIndex && !auditedAdvanced)) {
        errors.push(`untaught token ${tokenId}`);
      }
    }
  });
  if (tokenizeConnectedText(scene.prompt?.text).length > 10 || sentenceCount(scene.prompt?.text) !== 1) {
    errors.push("prompt readability mismatch");
  }
  const expectedOptionCount = scene.choice?.kind === "narrative_bridge" ? 2 : 3;
  if (scene.choice?.options?.length !== expectedOptionCount) errors.push("option count mismatch");
  for (const option of scene.choice?.options || []) {
    if (Object.keys(option).join(",") !== "token,presentation,childLabel,accessibleLabel,visualSemanticId") {
      errors.push("child option shape mismatch");
    }
  }
  validateAdvancedAudit(scene, errors);
  validateChildLabelAudit(scene, stopIndex, errors);
  const chapter = chapterById.get(scene.chapterId);
  if (!chapter || JSON.stringify(scene.preChoiceCharacterIds)
    !== JSON.stringify([chapter.cast.guide.name, scene.residentId])) {
    errors.push("pre-choice cast identity mismatch");
  }
  validatePostDecisionMeaning(scene, errors);
  return errors;
}

const expeditionByStop = new Map(SOUND_SEEKERS_EXPEDITIONS.map(record => [record.stopId, record]));
const chapterById = new Map(SOUND_SEEKERS_CHAPTERS.map(record => [record.id, record]));

function buildEvaluator(scene) {
  if (scene.choice.kind !== "assessed_connected_text") return null;
  const transferRecord = getContentDeckCatalogRecord("transfer", scene.transferRef.recordId);
  const feedback = CONNECTED_TEXT_DECISION_FEEDBACK[scene.id];
  if (!transferRecord || !feedback) throw new Error(`${scene.id}: missing reducer-private decision authority`);
  const tokens = scene.choice.options.map(option => option.token);
  const expectedToken = transferRecord.decisionContract.expectedToken;
  const misses = tokens.filter(token => token !== expectedToken).sort();
  if (!sameMembers(tokens, transferRecord.decisionContract.optionTokens)
    || !tokens.includes(expectedToken)
    || !sameMembers(Object.keys(feedback.misconceptionByToken), misses)
    || !sameMembers(Object.keys(feedback.correctionByToken), misses)
    || !sameMembers(Object.keys(feedback.rationaleByToken), tokens)) {
    throw new Error(`${scene.id}: connected-text decision contract mismatch`);
  }
  return deepFreeze({
    expectedToken,
    forbiddenPromptTokens: feedback.forbiddenPromptTokens,
    misconceptionByToken: feedback.misconceptionByToken,
    correctionByToken: feedback.correctionByToken,
    rationaleByToken: feedback.rationaleByToken,
    evidence: {
      targetId: `text:${scene.id}`,
      connectedTextId: scene.id,
      recordsDomain: "connected_text_transfer"
    }
  });
}

for (const scene of CONNECTED_TEXT_RECORDS) {
  const expedition = expeditionByStop.get(scene.stopId);
  const transfer = expedition?.phases.find(phase => phase.id === `${scene.stopId}-transfer`);
  const transferRecord = getContentDeckCatalogRecord("transfer", scene.transferRef.recordId);
  const storyRecord = getContentDeckCatalogRecord("stories", scene.storyRef.recordId);
  const chapter = chapterById.get(scene.chapterId);
  if (!expedition || !transfer || !transferRecord || !storyRecord
    || storyRecord.contentId !== scene.id || transferRecord.connectedTextId !== scene.id
    || scene.chapterId !== expedition.chapterId || scene.residentId !== expedition.residentId
    || scene.storyRef.slotId !== expedition.contentDeckSlotIds.stories[0]
    || scene.transferRef.slotId !== expedition.contentDeckSlotIds.transfer[0]
    || scene.transferRef.actionId !== transfer.id
    || scene.transferRef.configurationId !== transfer.configurationId
    || scene.transferRef.contextId !== transfer.contextId
    || scene.transferRef.instructionId !== transfer.instructionId
    || scene.transferRef.powerId !== transfer.powerId
    || scene.transferRef.expectedAction !== transfer.expectedAction
    || scene.transferRef.recordsDomain !== transfer.recordsDomain
    || !chapter
    || JSON.stringify(scene.preChoiceCharacterIds)
      !== JSON.stringify([chapter.cast.guide.name, scene.residentId])) {
    throw new Error(`${scene.id}: committed expedition/deck join mismatch`);
  }
  const validationErrors = validateSceneAtStop(scene, scene.stopId);
  if (validationErrors.length) throw new Error(`${scene.id}: ${validationErrors.join(", ")}`);
}

const authoredAdvancedTokenIds = [...new Set(CONNECTED_TEXT_RECORDS
  .flatMap(scene => [...scene.advancedTokenIds, ...scene.advancedChildLabelTokenIds]))].sort();
if (!sameMembers(authoredAdvancedTokenIds, ADVANCED_SCENE_TOKEN_IDS)
  || authoredAdvancedTokenIds.length !== ADVANCED_SCENE_TOKEN_COUNT
  || !/^[a-f0-9]{64}$/u.test(ADVANCED_SCENE_TOKEN_CONTENT_HASH)) {
  throw new Error("connected-text advanced-token usage ledger is stale");
}

export const SOUND_SEEKERS_CONNECTED_TEXT = CONNECTED_TEXT_RECORDS;
const sceneById = new Map(SOUND_SEEKERS_CONNECTED_TEXT.map(scene => [scene.id, scene]));
const childSceneBrands = new WeakSet();

export const CONNECTED_TEXT_EVALUATORS = deepFreeze(Object.fromEntries(
  SOUND_SEEKERS_CONNECTED_TEXT.filter(scene => scene.choice.kind === "assessed_connected_text")
    .map(scene => [scene.id, buildEvaluator(scene)])
));

for (const scene of SOUND_SEEKERS_CONNECTED_TEXT) {
  const postCount = scene.choice.kind === "narrative_bridge" ? 2 : 1;
  if (!Array.isArray(scene.postDecisionMeaningWordIds)
    || scene.postDecisionMeaningWordIds.length !== postCount
    || scene.postDecisionMeaningWordIds.some(ids => !Array.isArray(ids) || ids.length === 0)) {
    throw new Error(`${scene.id}: post-decision meaning ownership is invalid`);
  }
  const textWords = new Set(tokenizeConnectedText(scene.text));
  scene.postDecisionMeaningWordIds.forEach((wordIds, index) => {
    const option = scene.choice.kind === "narrative_bridge"
      ? scene.choice.options.find(item => item.token === scene.narrativeBranches[index].token)
      : scene.choice.options.find(item => item.token === CONNECTED_TEXT_EVALUATORS[scene.id].expectedToken);
    const justifiedWords = new Set([...textWords, ...tokenizeConnectedText(option?.childLabel)]);
    if (wordIds.some(wordId => !justifiedWords.has(wordId))) {
      throw new Error(`${scene.id}: post-decision meaning is not justified by scene text/action`);
    }
  });
}

export function getConnectedText(sceneId) {
  return sceneById.get(String(sceneId || "").trim()) || null;
}

function seedNumber(value) {
  let hash = 2166136261;
  for (const character of String(value || "")) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function routeOptions(scene, routeSeed) {
  const options = [...scene.choice.options];
  const offset = seedNumber(`${scene.id}:${String(routeSeed || "")}`) % options.length;
  return [...options.slice(offset), ...options.slice(0, offset)];
}

export function toChildConnectedTextScene(sceneId, routeSeed) {
  const scene = getConnectedText(sceneId);
  if (!scene || typeof routeSeed !== "string" || !routeSeed.trim()) {
    throw new Error("child connected-text scene identity is invalid");
  }
  const childScene = deepFreeze({
    id: scene.id,
    stopId: scene.stopId,
    chapterId: scene.chapterId,
    residentId: scene.residentId,
    level: scene.level,
    text: scene.text,
    textAudioKey: scene.textAudioKey,
    prompt: { text: scene.prompt.text, audioKey: scene.prompt.audioKey },
    choice: {
      kind: scene.choice.kind,
      options: routeOptions(scene, routeSeed).map(option => ({
        token: option.token,
        presentation: option.presentation,
        childLabel: option.childLabel,
        accessibleLabel: option.accessibleLabel,
        visualSemanticId: option.visualSemanticId
      }))
    },
    preChoiceSemanticId: `${scene.id}-pre-choice`,
    visualSemanticId: scene.visualSemanticId
  });
  childSceneBrands.add(childScene);
  return childScene;
}

export function isConnectedTextChildScene(value) {
  return Boolean(value && typeof value === "object" && childSceneBrands.has(value));
}

export function evaluateConnectedTextDecision(sceneId, selectedToken) {
  const evaluator = CONNECTED_TEXT_EVALUATORS[String(sceneId || "").trim()];
  const token = String(selectedToken || "").trim();
  if (!evaluator || !Object.hasOwn(evaluator.rationaleByToken, token)) {
    throw new Error("connected-text decision is invalid");
  }
  const correct = token === evaluator.expectedToken;
  return deepFreeze({
    sceneId,
    selectedToken: token,
    correct,
    rationale: evaluator.rationaleByToken[token],
    misconception: correct ? null : evaluator.misconceptionByToken[token],
    correction: correct ? null : evaluator.correctionByToken[token],
    evidence: evaluator.evidence
  });
}

export function createConnectedTextChallenge(state, { transactionId, routeSeed } = {}) {
  if (typeof routeSeed !== "string" || !routeSeed.trim()) throw new Error("connected-text route seed is invalid");
  const resumed = resumeStoryTransferTransaction(state, { transactionId });
  const scene = getConnectedText(`scene-${resumed.transaction.stopId}`);
  if (!scene || resumed.transaction.transactionId !== transactionId) {
    throw new Error("connected-text transaction scene is invalid");
  }
  if (scene.choice.kind === "narrative_bridge") return null;
  const challenge = materializeStoryTransferChallenge(state, { transactionId });
  const evaluator = CONNECTED_TEXT_EVALUATORS[scene.id];
  const child = toChildConnectedTextScene(scene.id, routeSeed);
  if (challenge.targetId !== evaluator.evidence.targetId
    || challenge.connectedTextId !== evaluator.evidence.connectedTextId
    || challenge.recordsDomain !== evaluator.evidence.recordsDomain
    || challenge.instructionId !== scene.transferRef.instructionId
    || challenge.powerId !== scene.transferRef.powerId
    || challenge.expectedAction !== scene.transferRef.expectedAction
    || challenge.expectedToken !== evaluator.expectedToken
    || !sameMembers(challenge.optionTokens, child.choice.options.map(option => option.token))) {
    throw new Error("canonical connected-text challenge does not match its scene");
  }
  return challenge;
}

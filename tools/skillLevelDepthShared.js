import fs from "node:fs";
import path from "node:path";

import {
  managedAssessmentSkillDepthConfig,
  SKILL_LEVEL_DEPTH_TARGETS
} from "../src/data/skillLevelDepthConfig.js";
import { getQuestionRoutingFormat } from "../src/data/skillTemplateRouting.js";
import { getQuestionSignature } from "../src/questionRepeatGuards.js";
import {
  getQuestionTargetWord,
  inferPatternForSkill,
  loadCoreQuestionPool,
  publicPathExists,
  questionFilterReason,
  repoRoot
} from "./phonicsRuntimeUtils.js";

export const docsValidationDir = path.join(repoRoot, "docs", "validation");

export function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

export function normalize(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function displayNormalize(value = "") {
  return String(value || "").toLowerCase().trim();
}

export function getDepthSkillId(question = {}) {
  const raw = normalize([question.skillId, question.skillName, question.skill, question.stage].filter(Boolean).join(" "));
  const text = displayNormalize([question.skillId, question.skillName, question.skill, question.stage, question.prompt, question.question, question.templateType, question.formatType].filter(Boolean).join(" "));

  if (raw.includes("initial")) return "initial_sounds";
  if (raw.includes("final") || raw.includes("ending")) return "final_sounds";
  if (raw.includes("rhym")) return "rhyming";
  if (raw.includes("short_vowel_discrimination")) return "short_vowel_discrimination";
  if (raw.includes("cvc") || raw.includes("short_vowels") || raw.includes("short_vowel")) return "cvc_short_vowels";
  if (raw.includes("high_frequency_words_1_25")) return "hfw_1_25";
  if (raw.includes("high_frequency_words_26_50")) return "hfw_26_50";
  if (raw.includes("high_frequency_words_51_100") || raw.includes("high_frequency_words_51_75") || raw.includes("high_frequency_words_76_100")) return "hfw_51_100";
  if (raw.includes("blend")) return "blends";
  if (raw.includes("digraph")) return "digraphs";
  if (raw.includes("long_vowel") || raw.includes("silent_e")) return "long_vowels_silent_e";
  if (raw.includes("vowel_team")) return "vowel_teams";
  if (raw.includes("r_controlled")) return "r_controlled_vowels";
  if (raw.includes("noun")) return "nouns";
  if (raw.includes("verb")) return "verbs";
  if (raw.includes("adjective")) return "adjectives";
  if (raw.includes("preposition")) return "prepositions_of_place";
  if (raw.includes("plural")) return "plurals";
  if (raw.includes("prefix") || raw.includes("suffix")) return "prefixes_suffixes";
  if (raw.includes("antonym") || raw.includes("synonym")) return "antonyms_synonyms";
  if (raw.includes("homophone") || raw.includes("homonym")) return "homophones_homonyms";
  if (raw.includes("sentence_comprehension")) return "sentence_comprehension";
  if (raw.includes("key_detail")) return "key_details";
  if (raw.includes("sequencing")) return "sequencing";
  if (raw.includes("main_idea")) return "main_idea";
  if (raw.includes("inference")) return "inference";
  if (raw.includes("cause") && raw.includes("effect")) return "cause_effect";
  if (raw.includes("context_clue")) return "context_clues";
  if (raw.includes("theme")) return "theme_higher_comprehension";

  if (text.includes("high-frequency words 1-25")) return "hfw_1_25";
  if (text.includes("high-frequency words 26-50")) return "hfw_26_50";
  if (text.includes("high-frequency words 51-100")) return "hfw_51_100";
  return "";
}

export function getDepthLevel(question = {}) {
  const explicit = Number(question.level || question.assessmentLevel || question.depthLevel || 0);
  if (Number.isFinite(explicit) && explicit >= 1) return explicit >= 2 ? 2 : 1;
  const difficulty = Number(question.difficultyLevel || question.difficulty || 0);
  if (Number.isFinite(difficulty) && difficulty >= 2) return 2;
  return 1;
}

export function getQuestionMediaPaths(question = {}) {
  const image = [
    question.image,
    question.imageUrl,
    question.imagePath,
    question.targetImage,
    question.targetImageUrl,
    question.targetImagePath,
    ...(Array.isArray(question.imageCards) ? question.imageCards.flatMap(card => [card.image, card.imageUrl, card.imagePath]) : []),
    ...(Array.isArray(question.answerOptions) ? question.answerOptions.flatMap(option => [option?.image, option?.imageUrl, option?.imagePath]) : [])
  ].filter(Boolean);
  const audio = [
    question.audio,
    question.audioUrl,
    question.audioPath,
    ...(Array.isArray(question.imageCards) ? question.imageCards.flatMap(card => [card.audio, card.audioUrl, card.audioPath]) : []),
    ...(Array.isArray(question.answerOptions) ? question.answerOptions.flatMap(option => [option?.audio, option?.audioUrl, option?.audioPath]) : [])
  ].filter(Boolean);
  return { image, audio };
}

function broadFilterReason(question = {}) {
  if (question.active === false) return "inactive";
  if (!question.correctAnswer && !question.answer && !question.correctAnswers) return "missing correct answer";
  const { image, audio } = getQuestionMediaPaths(question);
  const missingImage = image.filter(assetPath => String(assetPath).startsWith("/") && !publicPathExists(assetPath));
  const missingAudio = audio.filter(assetPath => String(assetPath).startsWith("/") && !publicPathExists(assetPath));
  if (missingImage.length) return `missing image: ${missingImage.slice(0, 3).join(", ")}`;
  if (missingAudio.length) return `missing audio: ${missingAudio.slice(0, 3).join(", ")}`;
  return "";
}

export function getRuntimeSafeDepthQuestions() {
  return loadCoreQuestionPool().map(question => {
    const skillId = getDepthSkillId(question);
    const earlyReason = ["initial_sounds", "final_sounds", "rhyming", "cvc_short_vowels", "short_vowel_discrimination"].includes(skillId)
      ? questionFilterReason(question)
      : broadFilterReason(question);
    return {
      ...question,
      depthSkillId: skillId,
      depthLevel: getDepthLevel(question),
      depthFormat: getQuestionRoutingFormat(question),
      depthTargetWord: getQuestionTargetWord(question),
      depthItemKey: inferPatternForSkill(skillId, question),
      depthFilterReason: earlyReason
    };
  });
}

export function uniqueRuntimeQuestions(questions) {
  const seen = new Set();
  const out = [];
  for (const question of questions) {
    const signature = getQuestionSignature(question) || question.id;
    if (!signature || seen.has(signature)) continue;
    seen.add(signature);
    out.push(question);
  }
  return out;
}

export function buildRound(items, count = SKILL_LEVEL_DEPTH_TARGETS.phaseSize, seed = 0) {
  const sorted = [...items].sort((a, b) => {
    const ak = `${a.depthItemKey || ""}-${a.depthTargetWord || ""}-${a.id || ""}`;
    const bk = `${b.depthItemKey || ""}-${b.depthTargetWord || ""}-${b.id || ""}`;
    return ak.localeCompare(bk);
  });
  const rotated = sorted.slice(seed % Math.max(1, sorted.length)).concat(sorted.slice(0, seed % Math.max(1, sorted.length)));
  const selected = [];
  const usedWords = new Set();
  const usedKeys = new Set();
  for (const item of rotated) {
    const word = item.depthTargetWord || "";
    const key = item.depthItemKey || word || item.id;
    if (word && usedWords.has(word)) continue;
    if (key && usedKeys.has(key) && selected.length < count - 4) continue;
    selected.push(item);
    if (word) usedWords.add(word);
    if (key) usedKeys.add(key);
    if (selected.length === count) return selected;
  }
  for (const item of rotated) {
    if (selected.length >= count) break;
    if (selected.includes(item)) continue;
    const word = item.depthTargetWord || "";
    if (word && usedWords.has(word)) continue;
    selected.push(item);
    if (word) usedWords.add(word);
    if (selected.length >= count) break;
  }
  for (const item of rotated) {
    if (selected.length >= count) break;
    if (selected.includes(item)) continue;
    selected.push(item);
    if (selected.length >= count) break;
  }
  return selected;
}

export function auditSkillLevelDepth(options = {}) {
  const excludeSources = new Set(options.excludeSources || []);
  const all = getRuntimeSafeDepthQuestions().filter(question => !excludeSources.has(question._source));
  return managedAssessmentSkillDepthConfig.map(config => {
    const skillQuestions = uniqueRuntimeQuestions(all.filter(question => question.depthSkillId === config.skillId));
    const rejected = all
      .filter(question => question.depthSkillId === config.skillId && question.depthFilterReason)
      .slice(0, 12)
      .map(question => ({
        id: question.id,
        level: question.depthLevel,
        reason: question.depthFilterReason
      }));

    const levels = {};
    for (const levelNumber of [1, 2]) {
      const levelConfig = config.levels[levelNumber];
      const designed = Boolean(levelConfig?.designed);
      const levelItems = designed
        ? skillQuestions.filter(question => question.depthLevel === levelNumber && !question.depthFilterReason)
        : [];
      const uniqueTargets = new Set(levelItems.map(question => question.depthTargetWord).filter(Boolean));
      const uniqueItemKeys = new Set(levelItems.map(question => question.depthItemKey).filter(Boolean));
      const phaseOne = buildRound(levelItems, 15, 0);
      const phaseTwo = buildRound(levelItems.filter(item => !phaseOne.includes(item)), 15, 3);
      const count = levelItems.length;
      const diversityCount = Math.max(uniqueTargets.size, uniqueItemKeys.size);
      const passesCount = count >= SKILL_LEVEL_DEPTH_TARGETS.minimumPerLevel;
      const passesDiversity = diversityCount >= Math.min(15, count);
      levels[levelNumber] = {
        designed,
        rule: levelConfig?.rule || "",
        proposedMeaning: levelConfig?.proposedMeaning || "",
        runtimeSafeQuestionCount: count,
        uniqueTargetWordCount: uniqueTargets.size,
        uniqueItemKeyCount: uniqueItemKeys.size,
        phase1Ready: phaseOne.length === 15,
        phase2Ready: phaseTwo.length === 15,
        passesDepth: designed && passesCount && passesDiversity,
        missingCount: designed ? Math.max(0, SKILL_LEVEL_DEPTH_TARGETS.minimumPerLevel - count) : 0,
        examples: levelItems.slice(0, 8).map(question => ({
          id: question.id,
          targetWord: question.depthTargetWord,
          itemKey: question.depthItemKey,
          format: question.depthFormat
        }))
      };
    }

    return {
      skillId: config.skillId,
      skillName: config.skillName,
      hasLevel1: Boolean(config.levels[1]?.designed),
      hasLevel2: Boolean(config.levels[2]?.designed),
      levels,
      rejectedExamples: rejected,
      contentMediaGaps: rejected.slice(0, 6).map(item => `${item.id}: ${item.reason}`),
      passes: levels[1].passesDepth && (!levels[2].designed || levels[2].passesDepth)
    };
  });
}

export function markdownTable(headers, rows) {
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map(row => `| ${row.map(value => String(value ?? "").replace(/\n/g, " ")).join(" | ")} |`)
  ].join("\n");
}

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { masteryCoreQuestions } from "../src/data/masteryCoreQuestions.js";
import { masteryExtraQuestions } from "../src/data/masteryExtraQuestions.js";
import { initialSoundCoverageQuestions } from "../src/data/initialSoundCoverageQuestions.js";
import { finalSoundCoverageQuestions } from "../src/data/finalSoundCoverageQuestions.js";
import { rhymingCoverageQuestions } from "../src/data/rhymingCoverageQuestions.js";
import { cvcShortVowelExpansionQuestions } from "../src/data/cvcShortVowelExpansionQuestions.js";
import { contentExpansionPass3Questions } from "../src/data/contentExpansionPass3Questions.js";
import { targetedContentRecoveryQuestions } from "../src/data/targetedContentRecoveryQuestions.js";
import { kimiDataset7RuntimeQuestions } from "../src/data/kimiDataset7RuntimeQuestions.js";
import { safeContentExpansionQuestions } from "../src/data/safeContentExpansionQuestions.js";
import { ixlStyleSeedQuestions } from "../src/data/ixlStyleSeedQuestions.js";
import { templateQuestions } from "../src/data/templateQuestions.js";
import { templateExpansion } from "../src/data/templateExpansion.js";
import { templateExpansion2 } from "../src/data/templateExpansion2.js";
import { templateExpansion3 } from "../src/data/templateExpansion3.js";
import { templateExpansion4 } from "../src/data/templateExpansion4.js";
import { templateExpansion5 } from "../src/data/templateExpansion5.js";
import { templateExpansion6 } from "../src/data/templateExpansion6.js";
import { templateExpansion7 } from "../src/data/templateExpansion7.js";
import { questionBankExpansion8 } from "../src/data/questionBankExpansion8.js";
import { generatedEarlySkillQuestions } from "../src/data/generated/earlySkillQuestions.generated.js";
import { generatedQuestions } from "../src/data/generatedQuestions.js";
import { fixSentenceQuestions } from "../src/data/fixSentenceQuestions.js";
import { templateComprehensionAdvanced } from "../src/data/templateComprehensionAdvanced.js";
import { enrichListenAndFindWordQuestion } from "../src/data/listenAndFindAssets.js";
import { enrichInitialSoundPairQuestion } from "../src/data/initialSoundPairAssets.js";
import { getQuestionSignature } from "../src/questionRepeatGuards.js";
import { getRhymeGroup } from "../src/data/rhymeGroups.js";
import { getQuestionRoutingIssue } from "../src/data/skillTemplateRouting.js";
import {
  getFinalSoundsLevel1QuestionIssues,
  isFinalSoundsLevel1Question
} from "../src/data/earlyPhonicsValidation.js";
import {
  getEarlySkillRuntimeEligibilityIssues,
  isRuntimeEligibleEarlySkillQuestion,
  normalizeEarlySkillId
} from "../src/utils/earlySkills/isRuntimeEligibleEarlySkillQuestion.js";

export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const questionBanks = [
  ["masteryCoreQuestions", masteryCoreQuestions],
  ["masteryExtraQuestions", masteryExtraQuestions],
  ["initialSoundCoverageQuestions", initialSoundCoverageQuestions],
  ["finalSoundCoverageQuestions", finalSoundCoverageQuestions],
  ["rhymingCoverageQuestions", rhymingCoverageQuestions],
  ["cvcShortVowelExpansionQuestions", cvcShortVowelExpansionQuestions],
  ["contentExpansionPass3Questions", contentExpansionPass3Questions],
  ["targetedContentRecoveryQuestions", targetedContentRecoveryQuestions],
  ["kimiDataset7RuntimeQuestions", kimiDataset7RuntimeQuestions],
  ["safeContentExpansionQuestions", safeContentExpansionQuestions],
  ["ixlStyleSeedQuestions", ixlStyleSeedQuestions],
  ["templateQuestions", templateQuestions],
  ["templateExpansion", templateExpansion],
  ["templateExpansion2", templateExpansion2],
  ["templateExpansion3", templateExpansion3],
  ["templateExpansion4", templateExpansion4],
  ["templateExpansion5", templateExpansion5],
  ["templateExpansion6", templateExpansion6],
  ["templateExpansion7", templateExpansion7],
  ["questionBankExpansion8", questionBankExpansion8],
  ["generatedEarlySkillQuestions", generatedEarlySkillQuestions],
  ["generatedQuestions", generatedQuestions],
  ["fixSentenceQuestions", fixSentenceQuestions],
  ["templateComprehensionAdvanced", templateComprehensionAdvanced]
];

export function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

export function writeFile(filePath, content) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, content);
}

export function publicPathExists(assetPath = "") {
  return Boolean(
    assetPath &&
    String(assetPath).startsWith("/") &&
    fs.existsSync(path.join(repoRoot, "public", assetPath.replace(/^\//, "")))
  );
}

export function listFiles(relativeDir, extensions = []) {
  const absoluteDir = path.join(repoRoot, relativeDir);
  if (!fs.existsSync(absoluteDir)) return [];
  const extSet = new Set(extensions.map(ext => ext.toLowerCase()));
  const out = [];
  const walk = dir => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (!extSet.size || extSet.has(path.extname(entry.name).toLowerCase())) {
        out.push(full);
      }
    }
  };
  walk(absoluteDir);
  return out;
}

export function publicUrlForFile(filePath) {
  return `/${path.relative(path.join(repoRoot, "public"), filePath).replace(/\\/g, "/")}`;
}

export function normalizeWord(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function slugWord(value = "") {
  return normalizeWord(value).replace(/\s+/g, "-");
}

export function getQuestionTargetWord(question = {}) {
  const direct =
    question.targetWord ||
    question.anchorWord ||
    question.audioText ||
    question.word ||
    question.correctAnswer ||
    question.answer;
  if (direct && !Array.isArray(direct)) return normalizeWord(direct);
  const image = getQuestionImagePaths(question)[0];
  if (image) return normalizeWord(path.basename(image).replace(/\.[^.]+$/, ""));
  return "";
}

export function getQuestionSkillLabel(question = {}) {
  return question.skillName || question.skill || question.stage || question.skillId || "";
}

export function getQuestionImagePaths(question = {}) {
  return [
    question.imageUrl,
    question.imagePath,
    question.image,
    ...(Array.isArray(question.imageCards) ? question.imageCards.flatMap(card => [card.image, card.imageUrl, card.imagePath]) : []),
    ...(Array.isArray(question.promptImageCards) ? question.promptImageCards.flatMap(card => [card.image, card.imageUrl, card.imagePath]) : []),
    ...(Array.isArray(question.answerOptions) ? question.answerOptions.flatMap(option => [option?.image, option?.imageUrl, option?.imagePath]) : []),
    ...Object.values(question.choiceImages || {}).flatMap(asset => [asset?.image, asset?.imageUrl, asset?.imagePath])
  ].filter(Boolean);
}

export function getQuestionAudioPaths(question = {}) {
  return [
    question.audioUrl,
    question.audioPath,
    question.audio,
    ...(Array.isArray(question.imageCards) ? question.imageCards.flatMap(card => [card.audio, card.audioUrl, card.audioPath]) : []),
    ...(Array.isArray(question.answerOptions) ? question.answerOptions.flatMap(option => [option?.audio, option?.audioUrl, option?.audioPath]) : [])
  ].filter(Boolean);
}

export function loadCoreQuestionPool() {
  return questionBanks.flatMap(([source, bank]) =>
    bank.map((question, index) => ({
      ...enrichInitialSoundPairQuestion(enrichListenAndFindWordQuestion(question)),
      _source: source,
      _sourceIndex: index
    }))
  );
}

export function getCoreSkillId(question = {}) {
  const id = String(question.skillId || "").toLowerCase();
  const label = getQuestionSkillLabel(question).toLowerCase();
  if (id === "initial_sounds" || label.includes("initial")) return "initial_sounds";
  if (id === "final_sounds" || label.includes("final") || label.includes("ending")) return "final_sounds";
  if (id === "rhyming" || label.includes("rhyme") || label.includes("rhyming")) return "rhyming";
  if (id === "short_vowel_discrimination" || label.includes("short vowel discrimination") || label.includes("same middle sound") || label.includes("middle vowel")) return "short_vowel_discrimination";
  if (id.includes("cvc") || label.includes("cvc") || label.includes("short vowel")) return "cvc_short_vowels";
  return "";
}

export function isImageEssential(question = {}) {
  const format = String(question.formatType || question.templateType || question.questionType || "").toLowerCase();
  const prompt = `${question.prompt || ""} ${question.question || ""}`.toLowerCase();
  return Boolean(
    question.imageUrl ||
    question.imagePath ||
    question.image ||
    question.imageCards?.length ||
    question.promptImageCards?.length ||
    Object.keys(question.choiceImages || {}).length ||
    format.includes("picture") ||
    format.includes("image") ||
    prompt.includes("picture") ||
    prompt.includes("image")
  );
}

export function questionFilterReason(question = {}) {
  if (question.active === false) return "inactive";
  const skillId = getCoreSkillId(question);
  if (skillId) {
    const routeIssue = getQuestionRoutingIssue(question, skillId);
    if (routeIssue) return `wrong skill/template: ${routeIssue}`;
    const eligibilityIssues = getEarlySkillRuntimeEligibilityIssues(question, {
      skillId: normalizeEarlySkillId(skillId),
      level: question.level || question.difficulty || 1,
      pathExists: publicPathExists
    });
    if (eligibilityIssues.length > 0) {
      return `runtime ineligible: ${eligibilityIssues.join("; ")}`;
    }
  }
  const imagePaths = getQuestionImagePaths(question);
  const audioPaths = getQuestionAudioPaths(question);
  const missingImages = imagePaths.filter(item => !publicPathExists(item));
  const missingAudio = audioPaths.filter(item => item && item.startsWith("/") && !publicPathExists(item));
  if (skillId === "rhyming" && (!imagePaths.length || missingImages.length)) {
    return `missing essential rhyming image${missingImages.length ? `: ${missingImages.join(", ")}` : ""}`;
  }
  if (skillId === "final_sounds") {
    const level = Number(question.level || question.difficulty || 1) || 1;
    if (level === 1 && !isFinalSoundsLevel1Question(question)) {
      return `not valid for Final Sounds Level 1: ${getFinalSoundsLevel1QuestionIssues(question).join("; ")}`;
    }
  }
  if (isImageEssential(question) && (!imagePaths.length || missingImages.length)) {
    return `missing essential image${missingImages.length ? `: ${missingImages.join(", ")}` : ""}`;
  }
  if (!question.correctAnswer && !question.answer && !question.correctAnswers) return "missing correct answer";
  if (missingAudio.length) return `missing optional audio: ${missingAudio.join(", ")}`;
  return "";
}

export function buildRuntimeQuestionsForSkill(skillId) {
  const seen = new Set();
  return loadCoreQuestionPool()
    .filter(question => getCoreSkillId(question) === skillId)
    .filter(question => {
      const signature = getQuestionSignature(question) || question.id;
      if (!signature || seen.has(signature)) return false;
      seen.add(signature);
      return true;
    })
    .map(question => ({
      ...question,
      targetWord: getQuestionTargetWord(question),
      filterReason: questionFilterReason(question)
    }));
}

export function selectableRuntimeQuestionsForSkill(skillId) {
  return buildRuntimeQuestionsForSkill(skillId).filter(question =>
    (!question.filterReason || question.filterReason.startsWith("missing optional audio")) &&
    isRuntimeEligibleEarlySkillQuestion(question, {
      skillId,
      level: question.level || question.difficulty || 1,
      pathExists: publicPathExists
    })
  );
}

export function sampleRound(items, length = 15) {
  const selected = [];
  const usedWords = new Set();
  const usedKeys = new Set();
  for (const item of items) {
    const word = normalizeWord(item.targetWord || getQuestionTargetWord(item));
    const key = item.itemKey || item.targetSound || item.phonicsPattern || word;
    if (word && usedWords.has(word)) continue;
    if (key && usedKeys.has(key) && selected.length < length - 3) continue;
    selected.push(item);
    if (word) usedWords.add(word);
    if (key) usedKeys.add(key);
    if (selected.length >= length) break;
  }
  if (selected.length < length) {
    for (const item of items) {
      if (selected.includes(item)) continue;
      selected.push(item);
      if (selected.length >= length) break;
    }
  }
  return selected;
}

export function inferPatternForSkill(skillId, question = {}) {
  if (skillId === "rhyming") {
    return question.rhymeGroup || question.rime || getRhymeGroup(question.targetWord || question.answer || question.correctAnswer) || question.itemKey || "";
  }
  if (skillId === "final_sounds") return question.targetFinalSound || question.itemKey || question.answer || question.correctAnswer || "";
  if (skillId === "cvc_short_vowels") return question.phonicsPattern || question.itemKey || question.shortVowel || "";
  return question.itemKey || question.letter || "";
}

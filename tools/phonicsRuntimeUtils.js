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
import { hfwAssessmentQuestions } from "../src/data/generated/hfwAssessmentQuestions.generated.js";
import { skillLevelGapQuestions } from "../src/data/generated/skillLevelGapQuestions.generated.js";
import { hfwLevel2Questions } from "../src/data/generated/hfwLevel2Questions.generated.js";
import { generatedQuestions } from "../src/data/generatedQuestions.js";
import { fixSentenceQuestions } from "../src/data/fixSentenceQuestions.js";
import { templateComprehensionAdvanced } from "../src/data/templateComprehensionAdvanced.js";
import { managedAssessmentSkillDepthConfig } from "../src/data/skillLevelDepthConfig.js";
import { enrichListenAndFindWordQuestion } from "../src/data/listenAndFindAssets.js";
import { enrichInitialSoundPairQuestion } from "../src/data/initialSoundPairAssets.js";
import { enrichQuestionWithExistingMedia } from "../src/data/questionMediaResolver.js";
import { getQuestionSignature } from "../src/questionRepeatGuards.js";
import { getRhymeGroup } from "../src/data/rhymeGroups.js";
import { getQuestionRoutingIssue } from "../src/data/skillTemplateRouting.js";
import { getHfwRuntimeEligibilityIssues, isRuntimeEligibleHfwQuestion } from "../src/data/hfwRuntimeEligibility.js";
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
  ["hfwAssessmentQuestions", hfwAssessmentQuestions],
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
  ["skillLevelGapQuestions", skillLevelGapQuestions],
  ["hfwLevel2Questions", hfwLevel2Questions],
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

function normalizeToken(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function getCanonicalAssessmentSkillId(question = {}) {
  const explicitId = normalizeToken(question.skillId || "");
  if (managedAssessmentSkillDepthConfig.some(config => config.skillId === explicitId)) {
    return explicitId;
  }

  const raw = normalizeToken([question.skillId, question.skillName, question.skill, question.stage].filter(Boolean).join(" "));
  const text = normalizeToken([
    question.skillId,
    question.skillName,
    question.skill,
    question.stage,
    question.prompt,
    question.question,
    question.templateType,
    question.formatType
  ].filter(Boolean).join(" "));

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

  for (const config of managedAssessmentSkillDepthConfig) {
    const candidates = [config.skillId, config.skillName, ...(config.aliases || [])].map(normalizeToken);
    if (candidates.some(candidate => candidate && (raw.includes(candidate) || text.includes(candidate)))) {
      return config.skillId;
    }
  }

  return "";
}

function getCanonicalAssessmentLevel(question = {}) {
  const explicit = Number(question.level || question.assessmentLevel || question.depthLevel || 0);
  if (Number.isFinite(explicit) && explicit >= 1) return explicit >= 2 ? 2 : 1;
  const difficulty = Number(question.difficultyLevel || question.difficulty || 0);
  if (Number.isFinite(difficulty) && difficulty >= 2) return 2;
  return 1;
}

function getExplicitAssessmentPhase(question = {}) {
  const raw = question.phase ?? question.phaseTarget ?? question.assessmentPhase ?? question.levelPhase ?? "";
  if (raw === 1 || raw === "1") return 1;
  if (raw === 2 || raw === "2") return 2;
  const text = normalizeToken(raw);
  if (/\bphase_?1\b|level_?1_?phase_?1|p1/.test(text)) return 1;
  if (/\bphase_?2\b|level_?1_?phase_?2|p2/.test(text)) return 2;
  return null;
}

function getPromptText(question = {}) {
  return question.prompt || question.question || question.text || question.sentence || question.passage || "";
}

function getAnswerChoiceValues(question = {}) {
  return [
    ...(Array.isArray(question.answerOptions) ? question.answerOptions : []),
    ...(Array.isArray(question.choices) ? question.choices : []),
    ...(Array.isArray(question.options) ? question.options : []),
    ...(Array.isArray(question.tiles) ? question.tiles : []),
    ...(Array.isArray(question.imageCards) ? question.imageCards : [])
  ]
    .map(choice => {
      if (choice && typeof choice === "object") {
        return choice.value || choice.word || choice.label || choice.text || choice.answer || "";
      }
      return choice;
    })
    .filter(value => value !== undefined && value !== null && String(value).trim() !== "");
}

function hasCorrectAnswer(question = {}) {
  return Boolean(
    question.correctAnswer ||
    question.answer ||
    (Array.isArray(question.correctAnswers) && question.correctAnswers.length)
  );
}

function hasExistingDeclaredMedia(question = {}) {
  const missingImages = getQuestionImagePaths(question)
    .filter(assetPath => String(assetPath).startsWith("/") && !publicPathExists(assetPath));
  const missingAudio = getQuestionAudioPaths(question)
    .filter(assetPath => String(assetPath).startsWith("/") && !publicPathExists(assetPath));
  return missingImages.length === 0 && missingAudio.length === 0;
}

function isUsableForPhaseSplit(question = {}) {
  return question.active !== false &&
    Boolean(getPromptText(question)) &&
    hasCorrectAnswer(question) &&
    getAnswerChoiceValues(question).length > 0 &&
    hasExistingDeclaredMedia(question);
}

function questionSortKey(question = {}) {
  return [
    String(question._source || ""),
    String(question._sourceIndex || 0).padStart(6, "0"),
    String(question.id || question.questionId || ""),
    getQuestionSignature(question) || ""
  ].join("::");
}

function applyAssessmentPhaseMetadata(questions = []) {
  const groups = new Map();
  const output = questions.map(question => {
    const skillId = getCanonicalAssessmentSkillId(question);
    const level = getCanonicalAssessmentLevel(question);
    const explicitPhase = getExplicitAssessmentPhase(question);
    const normalized = {
      ...question,
      skillId: question.skillId || skillId,
      assessmentSkillId: skillId || question.assessmentSkillId || "",
      assessmentLevel: question.assessmentLevel || level,
      depthLevel: question.depthLevel || level
    };

    if (explicitPhase) {
      return {
        ...normalized,
        phase: question.phase || explicitPhase,
        assessmentPhase: question.assessmentPhase || explicitPhase,
        phaseTarget: question.phaseTarget || `level_${level}_phase_${explicitPhase}`
      };
    }

    if (!skillId) return normalized;
    const key = `${skillId}::${level}`;
    const list = groups.get(key) || [];
    list.push(normalized);
    groups.set(key, list);
    return normalized;
  });

  const inferredPhaseByReference = new Map();
  for (const [, group] of groups) {
    const usable = group.filter(isUsableForPhaseSplit).sort((a, b) => questionSortKey(a).localeCompare(questionSortKey(b)));
    const unusable = group.filter(question => !isUsableForPhaseSplit(question)).sort((a, b) => questionSortKey(a).localeCompare(questionSortKey(b)));
    const assign = list => {
      const midpoint = Math.ceil(list.length / 2);
      list.forEach((question, index) => {
        inferredPhaseByReference.set(question, index < midpoint ? 1 : 2);
      });
    };
    assign(usable);
    assign(unusable);
  }

  return output.map(question => {
    if (getExplicitAssessmentPhase(question)) return question;
    const phase = inferredPhaseByReference.get(question);
    if (!phase) return question;
    const level = getCanonicalAssessmentLevel(question);
    return {
      ...question,
      phase,
      assessmentPhase: phase,
      phaseTarget: `level_${level}_phase_${phase}`,
      phaseSource: "inferred_by_skill_level_order"
    };
  });
}

export function loadCoreQuestionPool() {
  const pool = questionBanks.flatMap(([source, bank]) =>
    bank.map((question, index) => ({
      ...enrichQuestionWithExistingMedia(enrichInitialSoundPairQuestion(enrichListenAndFindWordQuestion(question))),
      _source: source,
      _sourceIndex: index
    }))
  );
  return applyAssessmentPhaseMetadata(pool);
}

export function getCoreSkillId(question = {}) {
  const id = String(question.skillId || "").toLowerCase();
  const label = getQuestionSkillLabel(question).toLowerCase();
  if (id === "initial_sounds" || label.includes("initial")) return "initial_sounds";
  if (id === "final_sounds" || label.includes("final") || label.includes("ending")) return "final_sounds";
  if (id === "rhyming" || label.includes("rhyme") || label.includes("rhyming")) return "rhyming";
  if (id === "short_vowel_discrimination" || label.includes("short vowel discrimination") || label.includes("same middle sound") || label.includes("middle vowel")) return "short_vowel_discrimination";
  if (id === "hfw_1_25" || id === "high_frequency_words_1_25" || label.includes("high-frequency words 1-25")) return "hfw_1_25";
  if (id === "hfw_26_50" || id === "high_frequency_words_26_50" || label.includes("high-frequency words 26-50")) return "hfw_26_50";
  if (id === "hfw_51_100" || id === "high_frequency_words_51_100" || label.includes("high-frequency words 51-100")) return "hfw_51_100";
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
    if (skillId.startsWith("hfw_")) {
      const hfwIssues = getHfwRuntimeEligibilityIssues(question, skillId);
      if (hfwIssues.length > 0) return `hfw runtime ineligible: ${hfwIssues.join("; ")}`;
    }
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
  if (
    skillId === "rhyming" &&
    String(question.formatType || question.templateType || "").toUpperCase() !== "RHYMING_PICTURE"
  ) {
    return "rhyming runtime uses image-card RHYMING_PICTURE items only";
  }
  if (skillId === "rhyming") {
    const cards = question.imageCards || [];
    const targetImage = question.imagePath || question.imageUrl || question.targetImage || question.targetImagePath || question.targetImageUrl || "";
    const correctAnswers = Array.isArray(question.correctAnswers) && question.correctAnswers.length
      ? question.correctAnswers
      : [question.correctAnswer || question.answer].filter(Boolean);
    const cardValues = cards.map(card => normalizeWord(card.value || card.word || card.label));

    if (!targetImage || !publicPathExists(targetImage)) return "rhyming runtime requires a target image";
    if (cards.length !== 4) return "rhyming runtime requires exactly four answer image cards";
    if (!cards.every(card => card.image && publicPathExists(card.image))) return "rhyming runtime requires four existing answer card images";
    if (![1, 2].includes(correctAnswers.length)) return "rhyming runtime supports one or two correct answers";
    if (new Set(cardValues).size !== cardValues.length) return "rhyming runtime answer cards must be unique";
    if (!correctAnswers.every(answer => cardValues.includes(normalizeWord(answer)))) return "rhyming runtime correct answers must be present in answer cards";
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
  if (String(skillId || "").startsWith("hfw_")) {
    return buildRuntimeQuestionsForSkill(skillId).filter(question =>
      (!question.filterReason || question.filterReason.startsWith("missing optional audio")) &&
      isRuntimeEligibleHfwQuestion(question, skillId)
    );
  }
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

import { initialSoundWordBank } from "../initialSounds/initialSoundWordBank.js";
import { hasImportedInitialSoundMedia } from "../initialSounds/initialSoundMediaManifest.js";
import { coverageExpectations } from "../../data/coverageExpectations.js";
import { areTrueRhymes, getRhymeGroup, rhymeGroups } from "../../data/rhymeGroups.js";
import { masteryCoreQuestions } from "../../data/masteryCoreQuestions.js";
import { masteryExtraQuestions } from "../../data/masteryExtraQuestions.js";
import { initialSoundCoverageQuestions } from "../../data/initialSoundCoverageQuestions.js";
import { finalSoundCoverageQuestions } from "../../data/finalSoundCoverageQuestions.js";
import { rhymingCoverageQuestions } from "../../data/rhymingCoverageQuestions.js";
import { cvcShortVowelExpansionQuestions } from "../../data/cvcShortVowelExpansionQuestions.js";
import { contentExpansionPass3Questions } from "../../data/contentExpansionPass3Questions.js";
import { targetedContentRecoveryQuestions } from "../../data/targetedContentRecoveryQuestions.js";
import { kimiDataset7RuntimeQuestions } from "../../data/kimiDataset7RuntimeQuestions.js";
import { ixlStyleSeedQuestions } from "../../data/ixlStyleSeedQuestions.js";
import { safeContentExpansionQuestions } from "../../data/safeContentExpansionQuestions.js";
import { templateQuestions } from "../../data/templateQuestions.js";
import { templateExpansion } from "../../data/templateExpansion.js";
import { templateExpansion2 } from "../../data/templateExpansion2.js";
import { templateExpansion3 } from "../../data/templateExpansion3.js";
import { templateExpansion4 } from "../../data/templateExpansion4.js";
import { templateExpansion5 } from "../../data/templateExpansion5.js";
import { templateExpansion6 } from "../../data/templateExpansion6.js";
import { templateExpansion7 } from "../../data/templateExpansion7.js";
import { questionBankExpansion8 } from "../../data/questionBankExpansion8.js";
import { generatedQuestions } from "../../data/generatedQuestions.js";
import { fixSentenceQuestions } from "../../data/fixSentenceQuestions.js";
import { templateComprehensionAdvanced } from "../../data/templateComprehensionAdvanced.js";

export const managedSkillDefinitions = {
  initial_sounds: {
    label: "Initial Sounds",
    targetField: "letter",
    itemType: "initial_sound",
    levels: [1, 2],
    requiredMedia: ["image", "audio"],
    minimumValidItems: 25,
    progression: "two_level_target_coverage",
    expectedTargets: coverageExpectations.initial_sounds.itemKeys
  },
  ending_sounds: {
    label: "Ending Sounds",
    aliases: ["final_sounds"],
    itemType: "final_sound",
    levels: [1, 2],
    requiredMedia: ["image", "audio"],
    minimumValidItems: 25,
    progression: "target_coverage_with_review",
    expectedTargets: coverageExpectations.final_sounds.itemKeys
  },
  rhyming: {
    label: "Rhyming Words",
    itemType: "rhyming_family",
    levels: [1, 2, 3],
    requiredMedia: ["image", "audio"],
    minimumValidItems: 50,
    progression: "target_group_coverage",
    expectedTargets: Object.keys(rhymeGroups)
  },
  short_vowels: {
    label: "Short Vowels",
    aliases: ["short_a", "short_e", "short_i", "short_o", "short_u", "short_vowel_discrimination"],
    itemType: "short_vowel",
    levels: [1, 2],
    requiredMedia: ["audio"],
    minimumValidItems: 50,
    expectedTargets: ["short a", "short e", "short i", "short o", "short u"]
  },
  blends: {
    label: "Blends",
    itemType: "phonics_pattern",
    levels: [1, 2],
    requiredMedia: ["image", "audio"],
    minimumValidItems: 52,
    expectedTargets: ["bl", "cl", "fl", "gl", "pl", "sl", "br", "cr", "dr", "fr", "gr", "pr", "tr"]
  },
  digraphs: {
    label: "Digraphs",
    itemType: "phonics_pattern",
    levels: [1, 2],
    requiredMedia: ["image", "audio"],
    minimumValidItems: 52,
    expectedTargets: ["sh", "ch", "th", "wh", "ck", "ng"]
  },
  cvc_words: {
    label: "CVC Words",
    aliases: ["cvc_short_vowels"],
    itemType: "cvc_word",
    levels: [1, 2],
    requiredMedia: ["image", "audio"],
    minimumValidItems: 50
  },
  sight_words: {
    label: "Sight Words",
    aliases: ["hfw_1_25", "hfw_26_50", "hfw_51_100"],
    itemType: "sight_word",
    levels: [1, 2, 3],
    requiredMedia: ["audio"],
    minimumValidItems: 50
  },
  sentence_picture: {
    label: "Sentence Picture Matching",
    itemType: "sentence_picture",
    levels: [1, 2],
    requiredMedia: ["image"],
    minimumValidItems: 30
  },
  vocabulary_categories: {
    label: "Vocabulary/Categories",
    itemType: "vocabulary_category",
    levels: [1, 2],
    requiredMedia: ["image"],
    minimumValidItems: 30
  }
};

export const runtimeQuestionSources = [
  ...masteryCoreQuestions,
  ...masteryExtraQuestions,
  ...initialSoundCoverageQuestions,
  ...finalSoundCoverageQuestions,
  ...rhymingCoverageQuestions,
  ...cvcShortVowelExpansionQuestions,
  ...contentExpansionPass3Questions,
  ...targetedContentRecoveryQuestions,
  ...kimiDataset7RuntimeQuestions,
  ...ixlStyleSeedQuestions,
  ...safeContentExpansionQuestions,
  ...templateQuestions,
  ...templateExpansion,
  ...templateExpansion2,
  ...templateExpansion3,
  ...templateExpansion4,
  ...templateExpansion5,
  ...templateExpansion6,
  ...templateExpansion7,
  ...questionBankExpansion8,
  ...generatedQuestions,
  ...fixSentenceQuestions,
  ...templateComprehensionAdvanced
];

export function normalizeSkillId(value = "") {
  const normalized = String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  if (["final_sounds", "ending_sound", "ending_sounds"].includes(normalized)) return "ending_sounds";
  if (["rhyming_words", "rhyme_words"].includes(normalized)) return "rhyming";
  if (["cvc_and_short_vowels", "cvc_short_vowels"].includes(normalized)) return "cvc_words";
  if (normalized.includes("high_frequency") || normalized.includes("sight")) return "sight_words";
  if (normalized.includes("sentence") && normalized.includes("picture")) return "sentence_picture";
  if (normalized.includes("vocabulary") || normalized.includes("categor")) return "vocabulary_categories";
  if (normalized.includes("short_vowel")) return "short_vowels";
  return normalized;
}

export function resolveManagedSkillId(question = {}) {
  const direct = normalizeSkillId(question.skillId || question.skill || question.skillName);
  if (managedSkillDefinitions[direct]) return direct;

  const text = String([question.skill, question.skillName, question.prompt, question.question, question.formatType].filter(Boolean).join(" ")).toLowerCase();
  if (text.includes("initial")) return "initial_sounds";
  if (text.includes("final") || text.includes("ending")) return "ending_sounds";
  if (text.includes("rhym")) return "rhyming";
  if (text.includes("short vowel")) return "short_vowels";
  if (text.includes("blend")) return "blends";
  if (text.includes("digraph")) return "digraphs";
  if (text.includes("cvc")) return "cvc_words";
  if (text.includes("high-frequency") || text.includes("sight word")) return "sight_words";
  if (text.includes("matches the picture") || text.includes("sentence matches picture")) return "sentence_picture";
  if (text.includes("category") || text.includes("not like the others")) return "vocabulary_categories";
  return "";
}

export function normalizeTargetWord(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9'-]+/g, " ")
    .trim();
}

export function getQuestionChoices(question = {}) {
  return [...new Set([
    ...(Array.isArray(question.choices) ? question.choices : []),
    ...(Array.isArray(question.answerOptions) ? question.answerOptions.map(option => option?.word || option?.label || option?.value) : []),
    ...(Array.isArray(question.imageCards) ? question.imageCards.map(card => card?.word || card?.value) : [])
  ].filter(Boolean).map(value => typeof value === "string" ? value : String(value)))];
}

export function getQuestionImagePaths(question = {}) {
  return [
    question.imageUrl,
    question.imagePath,
    question.image,
    ...(question.imageCards || []).flatMap(card => [card.image, card.imageUrl, card.imagePath]),
    ...(question.answerOptions || []).flatMap(option => [option.image, option.imageUrl, option.imagePath]),
    ...(question.promptImageCards || []).flatMap(card => [card.image, card.imageUrl, card.imagePath])
  ].filter(Boolean);
}

export function getQuestionAudioPaths(question = {}) {
  return [
    question.audioUrl,
    question.audioPath,
    question.audio,
    ...(question.imageCards || []).flatMap(card => [card.audio, card.audioUrl, card.audioPath]),
    ...(question.answerOptions || []).flatMap(option => [option.audio, option.audioUrl, option.audioPath])
  ].filter(Boolean);
}

export function inferRuntimeTarget(question = {}) {
  const skillId = resolveManagedSkillId(question);
  const answer = normalizeTargetWord(question.correctAnswer || question.answer);
  const itemKey = normalizeTargetWord(question.itemKey || question.targetSound || question.phonicsPattern || question.targetPattern);
  const targetWord = normalizeTargetWord(question.targetWord || question.anchorWord || question.audioText || question.diagnosticTarget || answer);

  if (skillId === "rhyming") return itemKey || getRhymeGroup(targetWord) || getRhymeGroup(answer) || "";
  if (skillId === "initial_sounds") return itemKey || targetWord[0] || answer[0] || "";
  if (skillId === "ending_sounds") return itemKey || answer.at(-1) || targetWord.at(-1) || "";
  if (skillId === "short_vowels") return itemKey || answer.match(/short_[aeiou]/)?.[0] || "";
  return itemKey || targetWord || answer;
}

export function runtimeQuestionSignature(question = {}) {
  const choices = [...new Set(getQuestionChoices(question).map(normalizeTargetWord))].sort().join("|");
  const targetWord = normalizeTargetWord(question.targetWord || question.anchorWord || question.audioText || question.diagnosticTarget);
  const mediaTarget = [
    question.imageKey,
    question.audioKey,
    question.imageUrl || question.imagePath,
    question.audioUrl || question.audioPath
  ].filter(Boolean).map(normalizeTargetWord).join("|");
  return [
    resolveManagedSkillId(question),
    question.templateType || question.formatType || question.questionType || "legacy",
    normalizeTargetWord(question.prompt || question.question),
    inferRuntimeTarget(question),
    targetWord,
    normalizeTargetWord(question.correctAnswer || question.answer),
    mediaTarget,
    choices
  ].join("::");
}

export function normalizeRuntimeQuestionToSkillItem(question = {}) {
  const skillId = resolveManagedSkillId(question);
  if (!skillId) return null;
  const targetWord = normalizeTargetWord(question.targetWord || question.anchorWord || question.audioText || question.diagnosticTarget || question.answer || question.correctAnswer);
  const target = inferRuntimeTarget(question);
  const choices = getQuestionChoices(question);

  return {
    id: question.id || runtimeQuestionSignature(question),
    source: "runtime_question",
    skillId,
    level: Number(question.level || question.difficulty || 1) || 1,
    difficulty: question.difficulty || question.level || "unspecified",
    phase: question.phase || question.microphase || "",
    target,
    targetWord,
    targetSound: question.targetSound || "",
    targetPattern: question.targetPattern || question.phonicsPattern || question.itemKey || "",
    targetGroup: skillId === "rhyming" ? target : question.targetGroup || "",
    correctAnswer: question.correctAnswer || question.answer || "",
    answerOptions: choices,
    imageUrl: question.imageUrl || question.imagePath || "",
    audioUrl: question.audioUrl || question.audioPath || "",
    imagePaths: getQuestionImagePaths(question),
    audioPaths: getQuestionAudioPaths(question),
    distractorType: question.distractorType || "",
    reviewPriority: question.reviewPriority || 0,
    active: question.active !== false,
    signature: runtimeQuestionSignature(question),
    raw: question
  };
}

export function normalizeInitialSoundBankItem(item = {}) {
  return {
    id: item.id,
    source: "initial_sound_word_bank",
    skillId: "initial_sounds",
    level: item.level,
    difficulty: item.difficulty,
    phase: item.phase || "",
    target: item.letter,
    targetWord: normalizeTargetWord(item.targetWord),
    targetSound: item.phoneme,
    targetPattern: item.letter,
    targetGroup: item.letter,
    correctAnswer: item.correctAnswer,
    answerOptions: item.answerOptions || [],
    imageUrl: item.imageUrl,
    audioUrl: item.audioUrl,
    imagePaths: [item.imageUrl].filter(Boolean),
    audioPaths: [item.audioUrl].filter(Boolean),
    distractorType: item.distractorType,
    reviewPriority: item.reviewPriority || 0,
    mediaComplete: hasImportedInitialSoundMedia(item),
    active: item.active !== false,
    signature: `${item.skillId}::${item.level}::${item.letter}::${normalizeTargetWord(item.targetWord)}`,
    raw: item
  };
}

export function getSkillBankItems() {
  return [
    ...initialSoundWordBank.map(normalizeInitialSoundBankItem),
    ...runtimeQuestionSources.map(normalizeRuntimeQuestionToSkillItem).filter(Boolean)
  ];
}

export function validateExplicitRhymeItem(item = {}) {
  if (item.skillId !== "rhyming") return [];
  const issues = [];
  const targetWord = item.raw?.targetWord || item.raw?.anchorWord || item.targetWord;
  const choices = getQuestionChoices(item.raw || {});
  const answerWords = [
    ...(Array.isArray(item.raw?.correctWords) ? item.raw.correctWords : []),
    ...(Array.isArray(item.raw?.correctAnswers) ? item.raw.correctAnswers : []),
    item.raw?.answer,
    item.raw?.correctAnswer
  ].flatMap(value => String(value || "").split("|")).map(normalizeTargetWord).filter(Boolean);
  const targetGroup = item.targetGroup || getRhymeGroup(targetWord);

  if (!targetGroup && targetWord) issues.push(`unknown rhyme group for target "${targetWord}"`);
  answerWords.forEach(answer => {
    if (targetWord && !areTrueRhymes(targetWord, answer) && getRhymeGroup(answer) !== targetGroup) {
      issues.push(`answer "${answer}" is not a true rhyme for "${targetWord || targetGroup}"`);
    }
  });
  choices.forEach(choice => {
    const normalized = normalizeTargetWord(choice);
    if (!answerWords.includes(normalized) && targetGroup && getRhymeGroup(normalized) === targetGroup) {
      issues.push(`distractor "${normalized}" accidentally rhymes with target group "${targetGroup}"`);
    }
  });

  return issues;
}

export function getManagedSkillIds() {
  return Object.keys(managedSkillDefinitions);
}

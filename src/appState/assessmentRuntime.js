/* eslint-disable no-control-regex -- filenames reject control characters explicitly. */
import { skillTree } from "../skillTree.js";
import { normalize } from "../utils/assessmentRoundBuilder.js";
import {
  coverageExpectations,
  finalSoundLevelOneAllowedItemKeys,
  rhymingPhaseItemKeysByLevel
} from "../data/coverageExpectations.js";
import {
  getAssessmentSkillLabel,
  resolveAssessmentSkillId
} from "../data/assessmentSkillMapping.js";
import { isQuestionAllowedForSkill } from "../data/skillTemplateRouting.js";
import { getBlendsRuntimeEligibilityIssues } from "../data/blendsRuntimeEligibility.js";
import { getDigraphsRuntimeEligibilityIssues } from "../data/digraphsRuntimeEligibility.js";
import { getLongVowelsRuntimeEligibilityIssues } from "../data/longVowelsRuntimeEligibility.js";
import { isHighFrequencyWordSkill } from "../data/highFrequencyWordBands.js";
import { isLevelOneContentQualityAllowed } from "../data/levelOneContentQuality.js";
import { getRuntimeSourceIssues } from "../data/sourceOfTruthRegistry.js";
import { applyQuestionFormatMetadata } from "../questionFormatFramework.js";
import { isAssessmentContentValid } from "../assessmentContentValidation.js";
import { getRhymeGroup } from "../data/rhymeGroups.js";
import {
  isFinalSoundsLevel1Question,
  isValidFinalSoundWordForEarlyLevel
} from "../data/earlyPhonicsValidation.js";
import {
  getAnswerRecordPromptAnswerSignature,
  getQuestionPromptAnswerSignature,
  getQuestionSignature,
  getRepeatTargetWord
} from "../questionRepeatGuards.js";
import {
  isRuntimeEligibleEarlySkillQuestion,
  normalizeEarlySkillId
} from "../utils/earlySkills/isRuntimeEligibleEarlySkillQuestion.js";
import { normalizeAssessmentAudioRoles } from "../utils/assessmentAudioRoles.js";

export const PURE_EARLY_PHONICS_SKILL_IDS = new Set([
  "initial_sounds",
  "final_sounds",
  "cvc_short_vowels",
  "rhyming",
  "short_vowel_discrimination"
]);

export const ASSESSMENT_PATH_STEPS = [
  { level: 1, phase: 1, label: "Level 1 Phase 1", nextLabel: "Continue Level 1 Phase 2" },
  { level: 1, phase: 2, label: "Level 1 Phase 2", nextLabel: "Start Level 2" },
  { level: 2, phase: 1, label: "Level 2 Phase 1", nextLabel: "Continue Level 2 Phase 2" },
  { level: 2, phase: 2, label: "Level 2 Phase 2", nextLabel: "Move to next skill" }
];

export function isInitialSoundsStage(stage) {
  return stage?.id === "initial_sounds" || stage?.label === "Initial Sounds";
}

export function isFinalSoundsStage(stage) {
  return stage?.id === "final_sounds" || stage?.label === "Final Sounds";
}

export function isPureEarlyPhonicsStage(stage) {
  return PURE_EARLY_PHONICS_SKILL_IDS.has(stage?.id);
}

export function getAssessmentPathKey(step = {}) {
  return `L${Number(step.level || 1)}P${Number(step.phase || 1)}`;
}

export function getAssessmentPathLabel(step = {}) {
  return `Level ${Number(step.level || 1)} Phase ${Number(step.phase || 1)}`;
}

export function getAssessmentQuestionPhase(question = {}) {
  const questionSkillId = normalizeEarlySkillId(question.skillId || question.skillName || question.skill || "");
  if (questionSkillId === "rhyming") {
    const family = normalizeItemKey(
      question.itemKey ||
      question.rhymeGroup ||
      question.rime ||
      question.coverageTarget ||
      question.extra?.rimeFamily ||
      getRhymeGroup(question.targetWord || question.anchorWord || question.answer || question.correctAnswer)
    );
    const level = Number(
      question.level ||
      question.assessmentLevel ||
      question.depthLevel ||
      question.difficultyLevel ||
      question.difficulty ||
      question.extra?.level ||
      1
    ) >= 2 ? 2 : 1;
    const phaseEntry = Object.entries(rhymingPhaseItemKeysByLevel[level] || {})
      .find(([, families]) => families.includes(family));
    if (phaseEntry) return Number(phaseEntry[0]) === 2 ? 2 : 1;
  }

  const raw =
    question.phase ??
    question.assessmentPhase ??
    question.levelPhase ??
    question.initialSoundRoundPhase ??
    question.phaseTarget ??
    "";
  const numeric = Number(raw);
  if (numeric === 1 || numeric === 2) return numeric;
  const text = String(raw || "").toLowerCase();
  if (/\bphase_?1\b|level_?\d_?phase_?1|p1/.test(text)) return 1;
  if (/\bphase_?2\b|level_?\d_?phase_?2|p2/.test(text)) return 2;
  if (questionSkillId === "short_vowel_discrimination") {
    const id = String(question.id || question.questionId || "").toLowerCase();
    const source = String(question.source || question._source || "").toLowerCase();
    if (id.startsWith("recovery_short_vowel_") || source.includes("targetedcontentrecoveryquestions")) return 2;
    if (id.startsWith("p3_short_vowel_") || source.includes("contentexpansionpass3questions")) return 1;
    if (id.startsWith("svd_l2p2_")) return 2;
  }
  return 0;
}

export function getFinalSoundQuestionLevel(question = {}) {
  const finalTarget = normalizeItemKey(
    question.targetFinalSound ||
    question.targetSound ||
    question.itemKey ||
    question.phonicsPattern ||
    question.targetPattern ||
    question.answer ||
    question.correctAnswer
  );
  const targetWord = normalizeItemKey(
    question.targetWord ||
    question.anchorWord ||
    question.audioText ||
    question.diagnosticTarget
  );
  if (String(question.id || "").startsWith("ending_l1_")) return isFinalSoundsLevel1Question(question) ? 1 : 2;
  if (String(question.id || "").startsWith("ending_l2_")) return 2;
  if (isFinalSoundsLevel1Question(question)) return 1;
  if (finalTarget && !finalSoundLevelOneAllowedItemKeys.includes(finalTarget)) return 2;
  if (finalTarget && targetWord && !isValidFinalSoundWordForEarlyLevel(targetWord, finalTarget)) return 2;
  if (question.skillId === "final_sounds" && question.finalSoundType !== "single_letter") return 2;
  if (question.skillId === "final_sounds" && !question.finalSoundType) return 2;
  return Number(question.level || question.difficulty || 1) >= 2 ? 2 : 1;
}

export function getAssessmentQuestionLevel(stage, question = {}) {
  if (isFinalSoundsStage(stage) || question.skillId === "final_sounds") {
    return getFinalSoundQuestionLevel(question);
  }
  const level =
    Number(question.level || question.assessmentLevel || question.depthLevel || question.difficultyLevel || question.difficulty || question.extra?.level || 1);
  return level >= 2 ? 2 : 1;
}

export function getQuestionPathStep(stage, question = {}) {
  const level = getAssessmentQuestionLevel(stage, question);
  const phase = getAssessmentQuestionPhase(question) || 1;
  return { level, phase };
}

export function isHfwStage(stage = {}) {
  return isHighFrequencyWordSkill(stage.id || stage.label || "");
}

export function getStageIndex(question) {
  const mappedSkillId = resolveAssessmentSkillId(question);
  if (mappedSkillId) {
    const idIndex = skillTree.findIndex(stage => stage.id === mappedSkillId);
    if (idIndex !== -1) return idIndex;
  }

  const skill = normalize(question.skillId || question.skill || question.skillName || question.stage);
  if (!skill) return -1;

  const exactIndex = skillTree.findIndex(stage =>
    stage.id === skill ||
    stage.match.some(term => skill === normalize(term))
  );

  if (exactIndex !== -1) return exactIndex;

  return skillTree.findIndex(stage =>
    stage.match.some(term =>
      skill.includes(normalize(term)) ||
      normalize(term).includes(skill)
    )
  );
}

export function isFixSentenceQuestion(question) {
  return question?.questionType === "fix_sentence";
}

export function normalizeSentenceAnswer(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim();
}

export function comparableSentenceAnswer(text) {
  return normalizeSentenceAnswer(text).toLowerCase();
}

export function getQuestionPrompt(question) {
  return question.prompt || question.question || "";
}

export function getQuestionAnswer(question) {
  if (isFixSentenceQuestion(question)) return question.correctSentence;
  if (Array.isArray(question.correctAnswers) && question.correctAnswers.length > 0) {
    return question.correctAnswers
      .map(value => String(value || "").trim())
      .filter(Boolean)
      .sort()
      .join("|");
  }
  return question.answer || question.correctAnswer;
}

export function normalizeMultiSelectAnswer(answer) {
  // Lowercase so scoring matches validation (isQuestionValid compares via
  // normalizeItemKey, which lowercases): cards "Cat"/"Hat" must satisfy
  // correctAnswers ["cat","hat"].
  return (Array.isArray(answer) ? answer : String(answer || "").split("|"))
    .map(value => String(value || "").trim().toLowerCase())
    .filter(Boolean)
    .sort()
    .join("|");
}

export function normalizeTemplateOption(option) {
  if (typeof option === "string") {
    return {
      label: option,
      value: option
    };
  }

  return {
    ...option,
    label: option.label || option.word || option.value,
    value: option.value || option.word || option.label
  };
}

export function getQuestionCards(question = {}) {
  return Array.isArray(question.imageCards) ? question.imageCards : [];
}

export function isListenAndFindWordQuestion(question = {}) {
  const text = String(question.question || question.prompt || "").toLowerCase().trim();
  const typeText = String([question.questionType, question.formatType].join(" ")).toLowerCase();
  return (
    text === "listen and find the word." ||
    text === "listen and find the word" ||
    typeText.includes("listen_and_find_word") ||
    typeText.includes("heard_word_to_print")
  );
}

export function getListenAndFindAssetDiagnostics(question = {}) {
  if (!isListenAndFindWordQuestion(question)) return null;
  const choices = question.choices || question.answerOptions || [];
  const choiceImages = question.choiceImages || {};
  const missingImages = choices.filter(choice => {
    const asset = choiceImages[choice] || choiceImages[String(choice).toLowerCase()] || {};
    return !(asset.image || asset.imagePath || asset.imageUrl);
  });

  return {
    missingImages,
    missingChoiceAssets: missingImages,
    missingAudio: !(question.audioPath || question.audioUrl || question.audio),
    usesSingleWordAudioText: normalize(question.audioText) === normalize(question.answer || question.correctAnswer || question.targetWord)
  };
}

export function isInitialSoundQuestion(question = {}) {
  return normalize(question.itemType) === "initial_sound" ||
    normalize(question.skillId || question.skill || question.skillName).includes("initial");
}

export function isInitialSoundPairQuestion(question = {}) {
  return question.questionType === "initial_sound_pair";
}

export function hasCompleteInitialSoundPairAssets(question = {}) {
  const cards = getQuestionCards(question);
  return isInitialSoundPairQuestion(question) &&
    cards.length >= 3 &&
    cards.every(card => (card.image || card.imagePath || card.imageUrl) && (card.audio || card.audioPath || card.audioUrl));
}

export function isPairSelectionQuestion(question = {}) {
  return [
    "initial_sound_pair",
    "final_sound_pair",
    "rhyme_pair"
  ].includes(question.questionType);
}

export function normalizePairSelectionAnswer(value) {
  return (Array.isArray(value) ? value : String(value || "").split("|"))
    .map(normalize)
    .filter(Boolean)
    .sort()
    .join("|");
}

export function hasCompletePairSelectionAssets(question = {}) {
  const cards = getQuestionCards(question);
  const requiredCardCount = question.skillId === "final_sounds" || question.itemType === "final_sound" ? 4 : 3;
  return isPairSelectionQuestion(question) &&
    cards.length >= requiredCardCount &&
    cards.every(card => (card.image || card.imagePath || card.imageUrl) && (card.audio || card.audioPath || card.audioUrl));
}

export function isVisualCardChoiceQuestion(question = {}) {
  return question.questionType === "visual_card_choice";
}

export function hasCompleteVisualQuestionAssets(question = {}) {
  if (!isVisualCardChoiceQuestion(question)) return true;
  const cards = getQuestionCards(question);
  const requireImages = question.requireOptionImages !== false;
  const requireAudio = question.requireOptionAudio === true;
  return cards.length >= 2 && cards.every(card =>
    (!requireImages || card.image || card.imagePath || card.imageUrl) &&
    (!requireAudio || card.audio || card.audioPath || card.audioUrl)
  );
}

export const SHORT_VOWEL_WORD_BANK = {
  a: ["cat", "bag", "bat", "map", "pan", "jam"],
  e: ["bed", "pen", "red", "web", "leg", "jet"],
  i: ["pig", "pin", "sit", "wig", "lid", "fin"],
  o: ["dog", "pot", "log", "dot", "fox", "sock"],
  u: ["cup", "sun", "mug", "mud", "bug"]
};

export function getFirstVowelLetter(value = "") {
  return String(value || "").toLowerCase().match(/[aeiou]/)?.[0] || "";
}

export function getWordRime(value = "") {
  const word = String(value || "").toLowerCase().trim();
  const index = word.search(/[aeiou]/);
  return index === -1 ? word.slice(1) : word.slice(index);
}

export function isShortVowelWordCategoryQuestion(question = {}) {
  const skillId = String(question.skillId || question.skill || question.skillName || "").toLowerCase();
  const format = String(question.formatType || question.templateType || "").toUpperCase();
  const prompt = String(question.prompt || question.question || "").toLowerCase();
  return (
    (skillId === "cvc_short_vowels" || skillId === "short_vowel_discrimination" || skillId.includes("short vowel")) &&
    format === "SHORT_VOWEL_WORD" &&
    /\bwhich word has the short [aeiou] sound\b/.test(prompt)
  );
}

export function isListenChooseVowelQuestion(question = {}) {
  const skillId = String(question.skillId || question.skill || question.skillName || "").toLowerCase();
  const format = String(question.formatType || question.templateType || "").toUpperCase();
  const prompt = String(question.prompt || question.question || "").toLowerCase();
  return (
    (skillId === "cvc_short_vowels" || skillId === "short_vowel_discrimination" || skillId.includes("short vowel")) &&
    format === "LISTEN_CHOOSE_VOWEL" &&
    prompt.includes("which vowel sound do you hear")
  );
}

export function getShortVowelTarget(question = {}, answer = "") {
  const prompt = String(question.prompt || question.question || "").toLowerCase();
  return (
    prompt.match(/\bshort ([aeiou]) sound\b/)?.[1] ||
    String(question.medialVowel || question.shortVowel || question.itemKey || "").toLowerCase().match(/[aeiou]/)?.[0] ||
    getFirstVowelLetter(answer)
  );
}

export function buildShortVowelWordOption(word, existingOption = {}) {
  const cleanWord = String(word || "").toLowerCase().trim();
  const image = existingOption.image || existingOption.imageUrl || existingOption.imagePath || "";
  const audio = existingOption.audio || existingOption.audioUrl || existingOption.audioPath || "";
  return {
    ...existingOption,
    word: existingOption.word || cleanWord,
    label: existingOption.label || cleanWord,
    value: existingOption.value || cleanWord,
    image,
    imageUrl: existingOption.imageUrl || image,
    audio,
    audioUrl: existingOption.audioUrl || audio,
    alt: existingOption.alt || `Picture for ${cleanWord}`
  };
}

export function normalizeShortVowelWordCategoryOptions(rawQuestion = {}, answerOptions = [], correctAnswer = "") {
  if (!isShortVowelWordCategoryQuestion(rawQuestion)) {
    return answerOptions;
  }

  const targetVowel = getShortVowelTarget(rawQuestion, correctAnswer);
  const correctWord = String(correctAnswer || rawQuestion.answer || rawQuestion.targetWord || "").toLowerCase().trim();
  const existingByWord = new Map(
    answerOptions
      .map(option => buildShortVowelWordOption(option.value || option.word || option.label, option))
      .filter(option => option.value)
      .map(option => [option.value, option])
  );
  const normalizedOptions = [];
  const seen = new Set();

  function addWord(word, existing = {}) {
    const cleanWord = String(word || "").toLowerCase().trim();
    if (!cleanWord || seen.has(cleanWord)) return;
    const option = buildShortVowelWordOption(cleanWord, existingByWord.get(cleanWord) || existing);
    normalizedOptions.push(option);
    seen.add(cleanWord);
  }

  addWord(correctWord);

  const existingCandidates = Array.from(existingByWord.values())
    .filter(option => option.value !== correctWord)
    .filter(option => !targetVowel || getFirstVowelLetter(option.value) !== targetVowel)
    .sort((a, b) => {
      const score = option => {
        const word = option.value;
        const selectedInitials = new Set(normalizedOptions.map(item => item.value[0]));
        const selectedRimes = new Set(normalizedOptions.map(item => getWordRime(item.value)));
        return (
          (option.image || option.imageUrl || option.imagePath ? 8 : 0) +
          (selectedInitials.has(word[0]) ? 0 : 6) +
          (selectedRimes.has(getWordRime(word)) ? 0 : 6)
        );
      };
      return score(b) - score(a);
    });

  for (const option of existingCandidates) {
    const word = option.value;
    if (word === correctWord) continue;
    addWord(word, option);
    if (normalizedOptions.length >= 4) break;
  }

  const distractorVowels = Object.keys(SHORT_VOWEL_WORD_BANK)
    .filter(vowel => vowel !== targetVowel);
  for (const vowel of distractorVowels) {
    for (const word of SHORT_VOWEL_WORD_BANK[vowel]) {
      addWord(word);
      if (normalizedOptions.length >= 4) break;
    }
    if (normalizedOptions.length >= 4) break;
  }

  return normalizedOptions.slice(0, 4);
}

export function normalizeContentQuestion(question) {
  if (!question) return null;

  const answerOptions = Array.isArray(question.answerOptions)
    ? question.answerOptions.map(normalizeTemplateOption)
    : [];
  const choices = Array.isArray(question.choices) && question.choices.length > 0
    ? question.choices
    : answerOptions.map(option => option.value).filter(Boolean);
  const answer = question.answer || question.correctAnswer;

  const formatType = String(question.templateType || question.formatType || "").toUpperCase();
  const usesWholeWordBlendAudio =
    formatType === "BLEND_SOUNDS" &&
    question.audioText &&
    question.targetWord &&
    String(question.audioText).toLowerCase().trim() === String(question.targetWord).toLowerCase().trim();
  const safePrompt = usesWholeWordBlendAudio
    ? "Which picture shows the word you hear?"
    : question.prompt || question.question || "";

  return {
    ...question,
    skill: question.skill || question.skillName || "",
    question: safePrompt || question.question || question.prompt || "",
    prompt: safePrompt || question.prompt || question.question || "",
    answer,
    correctAnswer: question.correctAnswer || answer,
    choices,
    answerOptions,
    imagePath: question.imagePath || question.imageUrl || "",
    audioPath: question.audioPath || question.audioUrl || "",
    itemKey: question.itemKey || question.phonicsPattern || question.targetWord || answer,
    itemType: question.itemType || (question.skillId === "initial_sounds"
      ? "initial_sound"
      : question.skillId === "final_sounds"
        ? "final_sound"
        : question.skillId === "rhyming"
          ? "rhyming_family"
          : question.skillId === "short_vowel_discrimination"
            ? "short_vowel"
            : question.skillId === "cvc_short_vowels"
              ? "cvc_word"
              : question.skillId === "blends" || question.skillId === "digraphs"
                ? "phonics_pattern"
                : question.itemType)
  };
}

export function normalizeAssessmentQuestion(rawQuestion, fallbackSkillId = null, index = 0) {
  if (!rawQuestion) return null;

  const skillId =
    resolveAssessmentSkillId(rawQuestion, fallbackSkillId) ||
    rawQuestion.skillId ||
    rawQuestion.skill_id ||
    fallbackSkillId ||
    rawQuestion.skill ||
    null;
  const skillLabel = getAssessmentSkillLabel(skillId);
  let answerOptions = Array.isArray(rawQuestion.answerOptions)
    ? rawQuestion.answerOptions.map(normalizeTemplateOption)
    : Array.isArray(rawQuestion.options)
      ? rawQuestion.options.map(normalizeTemplateOption)
      : Array.isArray(rawQuestion.choices)
        ? rawQuestion.choices.map(normalizeTemplateOption)
        : [];
  const correctAnswer =
    (Array.isArray(rawQuestion.correctAnswers) && rawQuestion.correctAnswers.length > 0
      ? rawQuestion.correctAnswers[0]
      : rawQuestion.correctAnswer) ??
    rawQuestion.answer ??
    rawQuestion.finalSound ??
    rawQuestion.letter ??
    "";
  answerOptions = normalizeShortVowelWordCategoryOptions(rawQuestion, answerOptions, correctAnswer);
  const choices = answerOptions.map(option => option.value).filter(Boolean);
  const prompt =
    typeof rawQuestion.prompt === "string"
      ? rawQuestion.prompt
      : typeof rawQuestion.question === "string"
        ? rawQuestion.question
        : "";

  return {
    ...rawQuestion,
    id: rawQuestion.id ?? `${skillId || "unknown-skill"}-${index}`,
    skillId,
    skill: skillLabel || rawQuestion.skill || rawQuestion.skillName || skillId || "",
    skillName: skillLabel || rawQuestion.skillName || rawQuestion.skill || skillId || "",
    prompt,
    question: typeof rawQuestion.question === "string" ? rawQuestion.question : prompt,
    targetWord: rawQuestion.targetWord ?? rawQuestion.word ?? "",
    imageUrl: rawQuestion.imageUrl ?? rawQuestion.image ?? rawQuestion.media?.imageUrl ?? "",
    imagePath: rawQuestion.imagePath ?? rawQuestion.imageUrl ?? rawQuestion.image ?? rawQuestion.media?.imageUrl ?? "",
    audioUrl: rawQuestion.audioUrl ?? rawQuestion.audio ?? rawQuestion.media?.audioUrl ?? "",
    audioPath: rawQuestion.audioPath ?? rawQuestion.audioUrl ?? rawQuestion.audio ?? rawQuestion.media?.audioUrl ?? "",
    correctAnswer,
    correctAnswers: Array.isArray(rawQuestion.correctAnswers)
      ? rawQuestion.correctAnswers.map(answer => String(answer || "").trim()).filter(Boolean)
      : rawQuestion.correctAnswers,
    requiredSelections: rawQuestion.requiredSelections || (
      Array.isArray(rawQuestion.correctAnswers) && rawQuestion.correctAnswers.length > 0
        ? rawQuestion.correctAnswers.length
        : undefined
    ),
    maxSelectable: rawQuestion.maxSelectable || rawQuestion.requiredSelections,
    answer: rawQuestion.answer ?? correctAnswer,
    choices,
    answerOptions
  };
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function safeExportFilename(value = "Student") {
  return String(value || "Student")
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "")
    .replace(/\s+/g, " ")
    .trim() || "Student";
}

export function formatExportDateForFilename(date = new Date()) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

export function formatReportDate(value = "") {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
}

export function isWordRecognitionQuestion(question) {
  const typeText = normalize([question?.questionType, question?.formatType].join(" "));
  return typeText.includes("word recognition") || typeText.includes("print match");
}

export function getAnchorWord(question) {
  const text = normalize([question?.question, question?.prompt, question?.spokenPrompt].join(" "));
  const match =
    text.match(/\b(?:starts the same as|ends the same as|starts like|ends like|has the same middle sound as|same sound in the middle as) ([a-z]+)\b/);

  return match?.[1] || "";
}

export function hasAnchorChoiceLeakage(question) {
  if (isWordRecognitionQuestion(question)) return false;

  const anchor = getAnchorWord(question);
  if (!anchor || !Array.isArray(question?.choices)) return false;

  return question.choices.map(choice => normalize(choice)).includes(anchor);
}

export function sentenceCompletionMissingContext(question) {
  const promptText = String([question?.question, question?.prompt, question?.spokenPrompt].join(" "));
  if (!/\b(complete(?:s)? the sentence|best completes the sentence)\b/i.test(promptText)) return false;

  return !(question?.passage || question?.sentence || question?.context || question?.brokenSentence);
}

export function questionContainsWord(question, word) {
  const target = normalize(word);
  const values = [
    question?.answer,
    question?.correctAnswer,
    question?.targetWord,
    question?.audioText,
    ...(question?.choices || []),
    ...(question?.correctWords || []),
    ...(question?.correctAnswers || []),
    ...(question?.imageCards || []).map(card => card.word)
  ];

  return values.some(value => normalize(value) === target);
}

export function hasWeakLegacyPhonicsFormat(question) {
  const skill = normalize(question?.skill);
  const promptText = normalize([question?.question, question?.prompt, question?.spokenPrompt].join(" "));
  const formatType = String(question?.formatType || "").toUpperCase();
  const questionType = normalize(question?.questionType);
  const hasVisualOrAudio =
    Boolean(
      question?.imagePath ||
      question?.audioPath ||
      question?.imageCards?.length ||
      question?.promptImageCards?.length ||
      question?.answerOptions?.some(option => option?.image || option?.audio)
    );
  const assetBackedFormats = new Set([
    "INITIAL_SOUND_PAIR_SELECT",
    "FINAL_SOUND_PAIR_SELECT",
    "RHYME_PAIR_SELECT",
    "LISTEN_FIND_RHYME",
    "READ_FIND_RHYME",
    "LISTEN_CHOOSE_VOWEL",
    "PICTURE_TO_PRINT_MATCH",
    "HEARD_WORD_TO_PRINT_MINIMAL_PAIR",
    "MISSING_VOWEL_CVC",
    "PICTURE_AUDIO_TO_PATTERN",
    "IMAGE_WORD_PATTERN_MATCH",
    "FIRST_SOUND",
    "ENDING_SOUND",
    "BLEND_SOUNDS",
    "PUT_SOUNDS_IN_ORDER",
    "RHYMING_PICTURE",
    "SHORT_VOWEL_WORD",
    "COMPLETE_WORD",
    "SENTENCE_MATCHES_PICTURE",
    "VOCABULARY_CATEGORY",
    "GRAMMAR_BASICS"
  ]);

  if (assetBackedFormats.has(formatType) || questionType === "listen_and_find_word") return false;

  if (skill.includes("initial") && /\b(which word starts the same as|starts the same as|starts like)\b/.test(promptText)) return true;
  if (skill.includes("final") && /\b(which word ends|ends the same|ends like)\b/.test(promptText)) return true;
  if (/\b(which word rhymes|choose the word that rhymes)\b/.test(promptText)) return !hasVisualOrAudio;
  if ((skill.includes("short vowel") || skill.includes("cvc")) && /\b(same middle sound|same sound in the middle)\b/.test(promptText)) return true;
  if ((skill.includes("blend") || skill.includes("digraph")) && /\bwhich word starts with\b/.test(promptText)) return !hasVisualOrAudio;
  if (/\bwhich word has the [a-z]{2} (?:blend|digraph)\b/.test(promptText)) return !hasVisualOrAudio;

  return false;
}

export function hasLowQualityPluralDistractors(question) {
  const skill = normalize(question?.skill);
  if (!skill.includes("plural")) return false;

  return (question?.choices || [])
    .map(choice => normalize(choice))
    .some(choice => choice.endsWith("z"));
}

export function getQuestionTargetWord(question) {
  return getRepeatTargetWord(question);
}

export function normalizeItemKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[“”]/g, "\"")
    .replace(/[‘’]/g, "'")
    .replace(/^\/|\/$/g, "")
    .trim();
}

export const vowelTeamPatterns = ["ai", "ay", "ee", "ea", "oa", "ow", "igh", "ie", "oo", "ue", "ew", "oi", "oy", "ou", "aw"];
export const rControlledPatterns = ["ar", "er", "ir", "or", "ur"];
export const blendPatterns = ["bl", "cl", "fl", "gl", "pl", "sl", "br", "cr", "dr", "fr", "gr", "pr", "tr", "sc", "sk", "sm", "sn", "sp", "st", "sw"];
export const digraphPatterns = ["sh", "ch", "th", "wh", "ph"];
export const DEBUG_ASSESSMENT_COVERAGE = Boolean(import.meta.env?.DEV);

export function debugAssessmentCoverage(label, payload) {
  if (!DEBUG_ASSESSMENT_COVERAGE) return;
  console.debug(`[assessment-coverage] ${label}`, payload);
}

export function findPatternInText(patterns, text) {
  return patterns.find(pattern =>
    new RegExp(`(^|[^a-z])${pattern}([^a-z]|$)`).test(text) ||
    normalizeItemKey(text).includes(pattern)
  );
}

export function inferItemMetadata(question) {
  if (!question) return null;
  if (question.itemKey && question.itemType) {
    return {
      itemKey: normalizeItemKey(question.itemKey),
      itemType: question.itemType
    };
  }

  const skill = normalize(question.skill);
  const answer = normalizeItemKey(getQuestionAnswer(question));
  const diagnosticTarget = normalizeItemKey(question.diagnosticTarget || "");
  const text = normalizeItemKey([
    question.question,
    question.spokenPrompt,
    question.audioText,
    question.answer,
    question.passage
  ].filter(Boolean).join(" "));

  if (!answer) return null;

  if (skill.includes("high-frequency") || skill.includes("sight")) {
    return { itemKey: answer, itemType: "sight_word" };
  }

  if (skill.includes("rhym")) {
    const rhymeMatch = text.match(/rhymes? with ([a-z]+)/);
    const family = question.itemKey || getRhymeGroup(rhymeMatch?.[1]) || getRhymeGroup(question.targetWord) || getRhymeGroup(answer);
    return family ? { itemKey: family, itemType: "rhyming_family" } : null;
  }

  if (skill.includes("initial")) {
    const soundMatch = text.match(/\/([a-z]{1,3})\//);
    return {
      itemKey: soundMatch?.[1] || answer[0],
      itemType: "initial_sound"
    };
  }

  if (skill.includes("final")) {
    return {
      itemKey: answer.at(-1),
      itemType: "final_sound"
    };
  }

  if (skill.includes("letter sound")) {
    const soundMatch = text.match(/letter ['"]?([a-z])['"]?/);
    return {
      itemKey: soundMatch?.[1] || answer[0],
      itemType: "letter_sound"
    };
  }

  if (skill.includes("cvc")) {
    return { itemKey: answer, itemType: "cvc_word" };
  }

  if (skill.includes("short vowel")) {
    const vowel = ["a", "e", "i", "o", "u"].find(letter => answer.includes(letter));
    return vowel ? { itemKey: `short_${vowel}`, itemType: "short_vowel" } : null;
  }

  if (skill.includes("blend")) {
    const pattern = findPatternInText(blendPatterns, `${answer} ${text}`);
    return pattern ? { itemKey: pattern, itemType: "phonics_pattern" } : null;
  }

  if (skill.includes("digraph")) {
    const pattern = findPatternInText(digraphPatterns, `${answer} ${text}`);
    return pattern ? { itemKey: pattern, itemType: "phonics_pattern" } : null;
  }

  if (skill.includes("long vowel")) {
    const match = text.match(/long ([aeiou])/) || answer.match(/([aeiou])[^aeiou]?e$/);
    return match ? { itemKey: `${match[1]}_e`, itemType: "phonics_pattern" } : null;
  }

  if (skill.includes("vowel team")) {
    const pattern = findPatternInText(vowelTeamPatterns, `${answer} ${text}`);
    return pattern ? { itemKey: pattern, itemType: "phonics_pattern" } : null;
  }

  if (skill.includes("r-controlled") || skill.includes("r controlled")) {
    const pattern = findPatternInText(rControlledPatterns, `${answer} ${text}`);
    return pattern ? { itemKey: pattern, itemType: "phonics_pattern" } : null;
  }

  if (diagnosticTarget && /^(ai|ay|ee|ea|oa|ow|igh|ie|oo|ue|ew|oi|oy|ou|aw|ar|er|ir|or|ur|sh|ch|th|wh|ph|[a-z]{1,2})/.test(diagnosticTarget)) {
    return { itemKey: diagnosticTarget.split(/\s+/)[0], itemType: "phonics_pattern" };
  }

  return null;
}

export function getRuntimeQuestionSignature(question) {
  return getQuestionSignature(question, inferItemMetadata(question));
}

export function getRuntimeQuestionPromptAnswerSignature(question) {
  return getQuestionPromptAnswerSignature(question);
}

export function findQuestionForAnswerRecord(record) {
  const promptAnswerSignature = getAnswerRecordPromptAnswerSignature(record);
  const stage = record.stage || record.skill || "";
  if (!promptAnswerSignature) return "";

  return runtimeQuestionCache.find(question =>
    (skillTree[getStageIndex(question)]?.label || question.skill) === stage &&
    getRuntimeQuestionPromptAnswerSignature(question) === promptAnswerSignature
  );
}

export function normalizeAnswerRecordShape(record = {}) {
  const hasBooleanIsCorrect = typeof record.isCorrect === "boolean";
  const inferredIsCorrect = hasBooleanIsCorrect
    ? record.isCorrect
    : Boolean(record.correct === true || record.correct === "true");

  if (!hasBooleanIsCorrect && import.meta.env.DEV) {
    console.warn("Answer record missing boolean isCorrect; normalizing at save boundary.", record);
  }

  return {
    ...record,
    isCorrect: inferredIsCorrect,
    correct: typeof record.correct === "boolean"
      ? record.correctAnswer || ""
      : record.correct || record.correctAnswer || ""
  };
}

export function applyItemMetadata(question) {
  const metadata = inferItemMetadata(question);
  return metadata
    ? { ...question, itemKey: metadata.itemKey, itemType: metadata.itemType }
    : question;
}

export function isMissingTableError(error, tableName) {
  return error?.code === "42P01" || new RegExp("relation .*" + tableName + ".* does not exist", "i").test(error?.message || "");
}

export function isApprovalSchemaError(error) {
  return isMissingTableError(error, "pending_teacher_accounts") ||
    error?.code === "42703" ||
    /column .* does not exist|schema cache|pending_teacher_accounts/i.test(error?.message || "");
}

export function isDuplicateAuthSignupError(error, data = null) {
  const text = [
    error?.code,
    error?.message,
    error?.details,
    error?.hint
  ].filter(Boolean).join(" ");
  const identities = data?.user?.identities;

  return /user already registered|already registered|already exists|email.*already|duplicate/i.test(text) ||
    (Array.isArray(identities) && identities.length === 0);
}

export function isSupabasePermissionError(error) {
  const text = [
    error?.code,
    error?.message,
    error?.details,
    error?.hint
  ].filter(Boolean).join(" ");

  return /42501|permission denied|row-level security|rls|not authorized|not allowed/i.test(text);
}

export function logAdminSupabaseError(label, error, context = {}) {
  if (!import.meta.env.DEV) return;

  console.error(label, {
    table: context.table,
    userId: context.userId,
    userEmail: context.userEmail,
    code: error?.code,
    message: error?.message,
    details: error?.details,
    hint: error?.hint
  });
}

export function getAdminSetupMessage(error, tableName) {
  if (isMissingTableError(error, tableName)) {
    return `Admin setup is incomplete: the Supabase table "${tableName}" is missing. Apply the admin dashboard migration.`;
  }

  if (isSupabasePermissionError(error)) {
    return `Admin setup needs attention: Supabase RLS or permissions are blocking access to "${tableName}".`;
  }

  return `Could not load admin dashboard because "${tableName}" returned a Supabase error.`;
}

export function isMissingItemMasteryTableError(error) {
  return isMissingTableError(error, "item_mastery");
}

export function isInvalidRefreshTokenError(error) {
  return /invalid refresh token|refresh token not found/i.test(error?.message || "");
}

export function calculateWeaknessSnapshot(answerHistory) {
  const groupedTargets = new Map();
  const groupedStages = new Map();

  answerHistory.forEach(record => {
    const stage = record.stage || record.skill || "Unknown skill";
    const target = record.diagnosticTarget || "general";
    const targetKey = `${stage}::${target}`;

    if (!groupedTargets.has(targetKey)) {
      groupedTargets.set(targetKey, {
        stage,
        skill: record.skill || stage,
        target,
        correct: 0,
        incorrect: 0,
        total: 0
      });
    }

    if (!groupedStages.has(stage)) {
      groupedStages.set(stage, {
        stage,
        correct: 0,
        incorrect: 0,
        total: 0
      });
    }

    const targetStats = groupedTargets.get(targetKey);
    const stageStats = groupedStages.get(stage);

    targetStats.total += 1;
    stageStats.total += 1;

    if (record.isCorrect) {
      targetStats.correct += 1;
      stageStats.correct += 1;
    } else {
      targetStats.incorrect += 1;
      stageStats.incorrect += 1;
    }
  });

  const withScores = stats => ({
    ...stats,
    accuracy: stats.total ? stats.correct / stats.total : 0,
    weaknessScore: stats.incorrect * 2 + (stats.total ? 1 - stats.correct / stats.total : 0)
  });

  const targets =
    [...groupedTargets.values()].map(withScores);

  const stages =
    [...groupedStages.values()].map(withScores);

  const needsPractice =
    targets
      .filter(item => item.incorrect > 0)
      .sort((a, b) =>
        b.weaknessScore - a.weaknessScore ||
        a.accuracy - b.accuracy ||
        b.total - a.total
      );

  const strongest =
    targets
      .filter(item => item.total >= 2 && item.accuracy >= 0.8)
      .sort((a, b) =>
        b.accuracy - a.accuracy ||
        b.total - a.total
      );

  return {
    stages,
    targets,
    strongest,
    needsPractice,
    suggestedNextFocus: needsPractice[0] || null
  };
}

export function isQuestionValid(q, options = {}) {
  if (!q) return false;
  if (!q.id || !q.skill || !getQuestionPrompt(q) || !getQuestionAnswer(q)) return false;

  if (isFixSentenceQuestion(q)) {
    const tiles = q.tiles || q.choices;

    if (!q.brokenSentence || !Array.isArray(tiles) || tiles.length < 2) return false;
    return getStageIndex(q) !== -1;
  }

  const candidateTemplateType = String(q.templateType || q.formatType || "").toUpperCase();
  if (candidateTemplateType === "PUT_SOUNDS_IN_ORDER" || candidateTemplateType === "HFW_LETTER_BUILD" || candidateTemplateType.startsWith("HFW_SENTENCE_SPELL")) {
    const tiles = candidateTemplateType === "HFW_LETTER_BUILD" || candidateTemplateType.startsWith("HFW_SENTENCE_SPELL") ? (q.letterTiles || q.soundTiles) : q.soundTiles;
    const candidateStageIndex = getStageIndex(q);
    const candidateStage = skillTree[candidateStageIndex];
    if (isHfwStage(candidateStage)) {
      const hfwIssues = options.getHfwRuntimeEligibilityIssues
        ? options.getHfwRuntimeEligibilityIssues(q, candidateStage.id)
        : [];
      if (hfwIssues.length > 0 || !isQuestionAllowedForSkill(q, candidateStage.id, options)) return false;
    }
    return Array.isArray(tiles) &&
      tiles.length >= 2 &&
      candidateStageIndex !== -1 &&
      isAssessmentContentValid(q);
  }

  if (!Array.isArray(q.choices) || q.choices.length < 2) return false;
  if (!isPairSelectionQuestion(q) && !q.choices.includes(q.answer)) return false;

  if (q.questionType === "initial_sound_pair" && isInitialSoundQuestion(q) && !hasCompleteInitialSoundPairAssets(q)) return false;
  if (isPairSelectionQuestion(q) && !hasCompletePairSelectionAssets(q)) return false;
  if (isVisualCardChoiceQuestion(q) && !hasCompleteVisualQuestionAssets(q)) return false;
  const candidateStageIndex = getStageIndex(q);
  const candidateStage = skillTree[candidateStageIndex];
  const candidateSkillId = normalizeEarlySkillId(candidateStage?.id || q.skillId || q.skill);
  if (isHfwStage(candidateStage)) {
    const hfwIssues = options.getHfwRuntimeEligibilityIssues
      ? options.getHfwRuntimeEligibilityIssues(q, candidateStage.id)
      : [];
    if (hfwIssues.length > 0) return false;
  }
  if (candidateStage?.id === "blends") {
    const blendIssues = getBlendsRuntimeEligibilityIssues(q, candidateStage.id);
    if (blendIssues.length > 0) return false;
  }
  if (candidateStage?.id === "digraphs") {
    const digraphIssues = getDigraphsRuntimeEligibilityIssues(q, candidateStage.id);
    if (digraphIssues.length > 0) return false;
  }
  if (candidateStage?.id === "long_vowels") {
    const longVowelIssues = getLongVowelsRuntimeEligibilityIssues(q, candidateStage.id);
    if (longVowelIssues.length > 0) return false;
  }
  if (
    PURE_EARLY_PHONICS_SKILL_IDS.has(candidateSkillId) &&
    !isRuntimeEligibleEarlySkillQuestion(q, {
      skillId: candidateSkillId,
      level: q.level || q.difficulty || 1
    })
  ) return false;

  if (q.skillId === "rhyming" && !(
    q.imagePath ||
    q.imageUrl ||
    q.image ||
    q.imageCards?.some(card => card.image || card.imagePath || card.imageUrl) ||
    q.promptImageCards?.some(card => card.image || card.imagePath || card.imageUrl) ||
    q.answerOptions?.some(option => option?.image || option?.imagePath || option?.imageUrl)
  )) return false;
  if (q.questionType === "listen_and_find_word") {
    const diagnostics = getListenAndFindAssetDiagnostics(q);
    if (
      diagnostics?.missingImages.length > 0 ||
      diagnostics?.missingChoiceAssets.length > 0 ||
      !diagnostics?.usesSingleWordAudioText
    ) return false;
  }

  if (
    q.skillId === "rhyming" &&
    String(q.formatType || q.templateType || "").toUpperCase() !== "RHYMING_PICTURE"
  ) return false;

  if (q.skillId === "rhyming") {
    const cards = q.imageCards || [];
    const targetImage = q.imagePath || q.imageUrl || q.targetImage || q.targetImagePath || q.targetImageUrl || "";
    const correctAnswers = Array.isArray(q.correctAnswers) && q.correctAnswers.length > 0
      ? q.correctAnswers
      : [q.correctAnswer || q.answer].filter(Boolean);
    if (cards.length !== 4) return false;
    if (!targetImage) return false;
    if (!cards.every(card => card.image || card.imagePath || card.imageUrl)) return false;
    if (![1, 2].includes(correctAnswers.length)) return false;
    const cardValues = cards.map(card => normalizeItemKey(card.value || card.word || card.label));
    if (new Set(cardValues).size !== cardValues.length) return false;
    if (!correctAnswers.every(answer => cardValues.includes(normalizeItemKey(answer)))) return false;
  }

  const lowerChoices = q.choices.map(c => normalize(c));
  if (new Set(lowerChoices).size !== lowerChoices.length) return false;

  const questionText = normalize(q.question);
  const allText = [q.question, q.skill, q.passage, ...q.choices].join(" ").toLowerCase();

  if (questionText.includes("silent letter")) return false;
  if (allText.includes("sun") && allText.includes("son") && allText.includes("middle")) return false;
  if (questionText.includes("which word spells")) return false;
  if (questionText.includes("matches the picture") && !q.imagePath) return false;
  if (hasAnchorChoiceLeakage(q)) return false;
  if (sentenceCompletionMissingContext(q)) return false;
  if (questionContainsWord(q, "pun")) return false;
  if (hasWeakLegacyPhonicsFormat(q)) return false;
  if (hasLowQualityPluralDistractors(q)) return false;
  if (!isAssessmentContentValid(q)) return false;
  if (isQuestionBlockedByMediaQa(q)) return false;

  const stageIndex = candidateStageIndex;
  const stage = candidateStage;
  if (!stage || !isQuestionAllowedForSkill(q, stage.id)) return false;

  return stageIndex !== -1;
}

export function dedupeQuestionsByRuntimeSignature(questions) {
  const seen = new Set();
  const canonical = [];

  for (const question of questions) {
    const signature = getRuntimeQuestionSignature(question);
    const key = signature || question.id;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    canonical.push(question);
  }

  return canonical;
}

export const GENERATED_REPLACEMENT_SOURCE = "skill_level_depth_gap_generator";
export const APPROVED_REPLACEMENT_SOURCES = new Set([
  GENERATED_REPLACEMENT_SOURCE,
  "assessment_qa_replacement_2026_06",
  "high_quality_comprehension_replacement_2026_06",
  "skill_word_bank_workbook"
]);
export const REPLACED_LEGACY_ASSESSMENT_SKILLS = new Set([
  "prepositions_of_place",
  "plurals",
  "prefixes_suffixes",
  "antonyms_synonyms",
  "homophones_homonyms",
  "vowel_teams",
  "sentence_comprehension",
  "key_details",
  "sequencing",
  "main_idea",
  "inference",
  "cause_effect",
  "context_clues",
  "theme_higher_comprehension"
]);

export const MEDIA_QA_BLOCKING_STATUSES = new Set([
  "rejected",
  "blocked",
  "needs_kimi",
  "deleted",
  "needs_media_replacement",
  "needs_image_replacement",
  "needs_audio_replacement"
]);

export function isQuestionBlockedByMediaQa(question = {}) {
  return MEDIA_QA_BLOCKING_STATUSES.has(question.qaStatus);
}

export function normalizeRuntimeSkillId(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function isGeneratedReplacementQuestion(question = {}) {
  return APPROVED_REPLACEMENT_SOURCES.has(question.source) ||
    question.tags?.includes("generated-gap");
}

export function keepRuntimeQuestion(question = {}) {
  const skillId = normalizeRuntimeSkillId(question.skillId || question.assessmentSkillId || question.skillName || question.skill || "");
  if (!isLevelOneContentQualityAllowed(question)) return false;
  if (!REPLACED_LEGACY_ASSESSMENT_SKILLS.has(skillId)) return true;
  return isGeneratedReplacementQuestion(question);
}

export function prepareRuntimeQuestionBank(questions = [], options = {}) {
  return dedupeQuestionsByRuntimeSignature(
    questions.map((question, index) =>
      applyQuestionFormatMetadata(applyItemMetadata(
        normalizeContentQuestion(
          normalizeAssessmentAudioRoles(normalizeAssessmentQuestion(question, null, index))
        )
      ))
    )
  )
    .filter(question => getRuntimeSourceIssues(question).length === 0)
    .filter(question => isQuestionValid(question, options))
    .filter(keepRuntimeQuestion);
}

export const startupQuestions = [];
export let runtimeQuestionCache = startupQuestions;

export const configuredCoverageTotals = coverageExpectations;

export function getConfiguredPhaseItemKeys(stage, level, phase) {
  const configured = configuredCoverageTotals[stage?.id];
  const normalizedLevel = Number(level || 1) >= 2 ? 2 : 1;
  const normalizedPhase = Number(phase || 1) === 2 ? 2 : 1;
  return configured?.phases?.[normalizedLevel]?.[normalizedPhase] || null;
}

export function getCoverageItemKeysForStage(stage, { finalSoundLevel = null, level = null, phase = null } = {}) {
  const configured = configuredCoverageTotals[stage?.id];
  if (configured?.itemKeys?.length && configured?.itemType) {
    const requestedLevel = finalSoundLevel || level;
    const requestedPhase = phase ? Number(phase) : null;
    const phaseItemKeys = requestedLevel && requestedPhase
      ? getConfiguredPhaseItemKeys(stage, requestedLevel, requestedPhase)
      : null;
    const itemKeys = phaseItemKeys ||
      (requestedLevel && configured.levels?.[requestedLevel]
        ? configured.levels[requestedLevel]
        : configured.itemKeys);
    return new Set(
      itemKeys.map(itemKey =>
        getItemMasteryStateKeyForValues(itemKey, configured.itemType)
      )
    );
  }

  const keys = new Set();

  runtimeQuestionCache.forEach(question => {
    if (getStageIndex(question) !== skillTree.findIndex(item => item.id === stage.id)) return;

    const metadata = inferItemMetadata(question);
    if (!metadata?.itemKey || !metadata?.itemType) return;

    keys.add(getItemMasteryStateKeyForValues(metadata.itemKey, metadata.itemType));
  });

  return keys;
}

export function getItemMasteryStateKeyForValues(itemKey, itemType) {
  return normalizeItemKey(itemType) + "::" + normalizeItemKey(itemKey);
}

export function buildCoverageSnapshot(itemMasteryRows = {}, debugContext = null, answerRecords = []) {
  const rowsByKey = new Map(
    Object.values(itemMasteryRows || {}).map(row => [
      getItemMasteryStateKeyForValues(row.itemKey, row.itemType),
      row
    ])
  );
  const recordLevelsBySkillAndKey = new Map();

  (answerRecords || []).forEach(record => {
    const metadata = record.itemKey && record.itemType
      ? { itemKey: record.itemKey, itemType: record.itemType }
      : inferItemMetadata({
        itemKey: record.itemKey,
        itemType: record.itemType,
        skill: record.skill || record.stage,
        question: record.question || record.diagnosticTarget,
        passage: record.passage,
        answer: record.correct,
        diagnosticTarget: record.diagnosticTarget
      });
    if (!metadata?.itemKey || !metadata?.itemType) return;
    const skillId = record.skillId || skillTree.find(stage => stage.label === record.stage)?.id || "";
    if (!skillId) return;
    const key = getItemMasteryStateKeyForValues(metadata.itemKey, metadata.itemType);
    const mapKey = `${skillId}::${key}`;
    const levels = recordLevelsBySkillAndKey.get(mapKey) || new Set();
    levels.add(Number(record.itemLevel || record.level || 1) >= 2 ? 2 : 1);
    recordLevelsBySkillAndKey.set(mapKey, levels);
  });

  const isMasteredAtLevel = (stage, key, level) => {
    const row = rowsByKey.get(key);
    if (!row?.mastered) return false;
    const evidenceLevels = recordLevelsBySkillAndKey.get(`${stage.id}::${key}`);
    if (!evidenceLevels) return Number(level || 1) === 1;
    return evidenceLevels.has(Number(level || 1) >= 2 ? 2 : 1);
  };

  const countLevelCoverage = (stage, level) => {
    const keys = getCoverageItemKeysForStage(stage, { level });
    const masteredKeys = Array.from(keys).filter(key => isMasteredAtLevel(stage, key, level));
    return {
      mastered: masteredKeys.length,
      total: keys.size,
      masteredKeys
    };
  };

  return skillTree.reduce((snapshot, stage) => {
    const configured = configuredCoverageTotals[stage.id];
    const hasLevelInventory = Boolean(configured?.levels);
    const level1 = countLevelCoverage(stage, 1);
    const level2 = hasLevelInventory
      ? countLevelCoverage(stage, 2)
      : { mastered: 0, total: 0, masteredKeys: [] };
    const runtimeKeys = hasLevelInventory
      ? new Set([...level1.masteredKeys, ...level2.masteredKeys])
      : getCoverageItemKeysForStage(stage);
    const total = hasLevelInventory ? level1.total + level2.total : (configured?.total || runtimeKeys.size);
    const unit = configured?.unit || (stage.label.toLowerCase().includes("word") ? "words" : "items");
    const masteredKeys = hasLevelInventory
      ? [...level1.masteredKeys, ...level2.masteredKeys]
      : Array.from(runtimeKeys).filter(key => rowsByKey.get(key)?.mastered);
    const mastered = hasLevelInventory ? level1.mastered + level2.mastered : masteredKeys.length;

    if (debugContext?.enabled) {
      debugAssessmentCoverage("coverage calculation", {
        studentId: debugContext.studentId,
        skill: stage.label,
        expectedItemTypes: Array.from(new Set(Array.from(getCoverageItemKeysForStage(stage)).map(key => key.split("::")[0]))),
        masteredRowCount: mastered,
        masteredItemKeys: masteredKeys.map(key => key.split("::")[1])
      });
    }

    snapshot[stage.id] = {
      mastered: Math.min(mastered, total),
      total,
      unit,
      level1: {
        mastered: Math.min(level1.mastered, level1.total),
        total: level1.total
      },
      level2: {
        mastered: Math.min(level2.mastered, level2.total),
        total: level2.total
      },
      inferred: !configured
    };

    return snapshot;
  }, {});
}

export function buildQuestionBankCoverage(questions = [], releaseStatuses = []) {
  const rowsBySkill = new Map();
  const mergeCounts = (target, source, key) => {
    Object.entries(source[key] || {}).forEach(([name, count]) => {
      target[key][name] = (target[key][name] || 0) + count;
    });
  };

  questions.forEach(question => {
    const skill = question.skill || question.skillName || "Unassigned";
    const existing = rowsBySkill.get(skill) || {
      skill,
      total: 0,
      active: 0,
      inactive: 0,
      templates: {},
      difficulties: {},
      patterns: {},
      missingImage: 0,
      missingAudio: 0,
      badMedia: 0,
      runtimeSelectable: 0
    };
    const template = question.templateType || question.formatType || question.questionType || "legacy";
    const difficulty = question.difficulty || "not tagged";
    const pattern = question.phonicsPattern || question.targetPattern || question.itemKey || "";
    const needsImage =
      question.questionType === "ixl_template" &&
      ["FIRST_SOUND", "ENDING_SOUND", "PUT_SOUNDS_IN_ORDER", "COMPLETE_WORD", "SENTENCE_MATCHES_PICTURE"].includes(question.templateType);
    const needsAudio =
      question.questionType === "ixl_template" &&
      ["FIRST_SOUND", "ENDING_SOUND", "BLEND_SOUNDS", "PUT_SOUNDS_IN_ORDER"].includes(question.templateType);

    const isActive = question.active !== false;
    const blockedByMedia = ["needs_media_replacement", "needs_image_replacement", "needs_audio_replacement"].includes(question.qaStatus);
    existing.total += 1;
    existing.active += isActive ? 1 : 0;
    existing.inactive += question.active === false ? 1 : 0;
    existing.runtimeSelectable += isActive && !blockedByMedia ? 1 : 0;
    existing.badMedia += blockedByMedia ? 1 : 0;
    existing.templates[template] = (existing.templates[template] || 0) + 1;
    existing.difficulties[difficulty] = (existing.difficulties[difficulty] || 0) + 1;
    if (pattern) existing.patterns[pattern] = (existing.patterns[pattern] || 0) + 1;
    if (needsImage && !question.imagePath) existing.missingImage += 1;
    if (needsAudio && !(question.audioPath || question.audioUrl || question.audio)) {
      existing.missingAudio += 1;
    }

    rowsBySkill.set(skill, existing);
  });

  const hfwRows = Array.from(rowsBySkill.values()).filter(row => row.skill.startsWith("High-Frequency Words"));
  if (hfwRows.length) {
    const aggregate = {
      skill: "High Frequency Words",
      total: 0,
      active: 0,
      inactive: 0,
      runtimeSelectable: 0,
      templates: {},
      difficulties: {},
      patterns: {},
      missingImage: 0,
      missingAudio: 0,
      badMedia: 0
    };
    hfwRows.forEach(row => {
      aggregate.total += row.total;
      aggregate.active += row.active;
      aggregate.inactive += row.inactive;
      aggregate.runtimeSelectable += row.runtimeSelectable;
      aggregate.missingImage += row.missingImage;
      aggregate.missingAudio += row.missingAudio;
      aggregate.badMedia += row.badMedia;
      mergeCounts(aggregate, row, "templates");
      mergeCounts(aggregate, row, "difficulties");
      mergeCounts(aggregate, row, "patterns");
    });
    rowsBySkill.set(aggregate.skill, aggregate);
  }

  skillTree.forEach(stage => {
    if (!rowsBySkill.has(stage.label)) {
      rowsBySkill.set(stage.label, {
        skill: stage.label,
        total: 0,
        active: 0,
        inactive: 0,
        runtimeSelectable: 0,
        templates: {},
        difficulties: {},
        patterns: {},
        missingImage: 0,
        missingAudio: 0,
        badMedia: 0
      });
    }
  });

  releaseStatuses.forEach(status => {
    const existing = rowsBySkill.get(status.skillName) || {
      skill: status.skillName,
      total: 0,
      active: 0,
      inactive: 0,
      templates: {},
      difficulties: {},
      patterns: {},
      missingImage: 0,
      missingAudio: 0,
      badMedia: 0,
      runtimeSelectable: 0
    };
    rowsBySkill.set(status.skillName, {
      ...existing,
      authored: Number(status.authoredQuestions || 0),
      approved: Number(status.approvedQuestions || 0),
      total: Number(status.authoredQuestions || 0),
      runtimeSelectable: Number(status.runtimeSelectableQuestions || 0),
      unapprovedAudio: Number(status.unapprovedAudioQuestions || 0),
      releaseReady: status.releaseReady === true,
      releaseReasons: status.reasons || []
    });
  });

  if (releaseStatuses.length) {
    return releaseStatuses
      .map(status => rowsBySkill.get(status.skillName))
      .filter(Boolean)
      .sort((a, b) => a.skill.localeCompare(b.skill));
  }
  return Array.from(rowsBySkill.values()).sort((a, b) => a.skill.localeCompare(b.skill));
}

export const letterAssessmentOrder = [
  "m", "T", "b", "S", "a", "F", "d", "R", "p", "E", "g", "H", "c",
  "M", "t", "B", "s", "A", "f", "D", "r", "P", "e", "G", "h", "C",
  "y", "K", "o", "J", "w", "Z", "x", "V", "l", "N", "q", "U", "i",
  "Y", "k", "O", "j", "W", "z", "X", "v", "L", "n", "Q", "u", "I"
];

export function inferAnswerRecordMetadata(record) {
  if (!record) return null;

  return inferItemMetadata({
    itemKey: record.itemKey,
    itemType: record.itemType,
    skill: record.skill || record.stage,
    question: record.question || record.diagnosticTarget,
    passage: record.passage,
    answer: record.correct,
    diagnosticTarget: record.diagnosticTarget
  });
}

export function formatCoverageKeyLabel(key) {
  const [, itemKey = key] = String(key).split("::");
  const cleanKey = String(itemKey || "")
    .replace(/_hfw_curated_.+$/i, "")
    .replace(/_hfw_[0-9_]+_sentences$/i, "")
    .replace(/^short_([aeiou])$/i, "short $1")
    .replace(/_/g, " ")
    .trim();
  return cleanKey.toLowerCase() === "i" ? "I" : cleanKey;
}

export function formatAnswerRecordItemLabel(record = {}) {
  const metadata = inferAnswerRecordMetadata(record);
  const itemKey = metadata?.itemKey || record.itemKey || record.targetWord || record.correct || record.diagnosticTarget || record.chosen || "";
  const itemType = metadata?.itemType || record.itemType || "";
  return formatCoverageKeyLabel(itemType ? getItemMasteryStateKeyForValues(itemKey, itemType) : itemKey);
}

export function getRoundItemLabels(records = [], { correctOnly = null } = {}) {
  return Array.from(new Set(
    records
      .filter(record => correctOnly === null || Boolean(record.isCorrect) === correctOnly)
      .map(formatAnswerRecordItemLabel)
      .filter(Boolean)
  ));
}

export function setRuntimeQuestionCache(questions) {
  runtimeQuestionCache = questions;
}

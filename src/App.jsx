import { Component, lazy, Suspense, useEffect, useRef, useState } from "react";
import Confetti from "react-confetti";
import { motion } from "framer-motion";
import "./App.css";
import { supabase } from "./supabaseClient";
import { getMasteryRule } from "./masterySystem";
import { skillTree } from "./skillTree";
import {
  AdvancedPhonicsPatternAssessmentPage,
  AssessmentPage,
  AuthPage,
  CheckpointDecisionPage,
  DashboardSummary,
  ELAssessmentsPage,
  GuidedReadingPage,
  LetterAssessmentPage,
  QuestionFlagDialog,
  ResetStudentProgressDialog,
  SkillsProgressPage,
  StudentOverviewPage,
  StudentSelectPage,
  TeacherReportsPage,
  TeacherSettingsToolsPage,
  TopNavigation
} from "./components/AppPages";

import { masteryCoreQuestions } from "./data/masteryCoreQuestions";
import { masteryExtraQuestions } from "./data/masteryExtraQuestions";
import { initialSoundCoverageQuestions } from "./data/initialSoundCoverageQuestions";
import { finalSoundCoverageQuestions } from "./data/finalSoundCoverageQuestions";
import { rhymingCoverageQuestions } from "./data/rhymingCoverageQuestions";
import { cvcShortVowelExpansionQuestions } from "./data/cvcShortVowelExpansionQuestions";
import { contentExpansionPass3Questions } from "./data/contentExpansionPass3Questions";
import { targetedContentRecoveryQuestions } from "./data/targetedContentRecoveryQuestions";
import { kimiDataset7RuntimeQuestions } from "./data/kimiDataset7RuntimeQuestions";
import { ixlStyleSeedQuestions } from "./data/ixlStyleSeedQuestions";
import { safeContentExpansionQuestions } from "./data/safeContentExpansionQuestions";
import { coverageExpectations } from "./data/coverageExpectations";
import { summarizeGuidedReadingRecords } from "./data/guidedReadingBooks";
import { enrichListenAndFindWordQuestion, getListenAndFindAssetDiagnostics } from "./data/listenAndFindAssets";
import {
  enrichInitialSoundPairQuestion,
  hasCompleteInitialSoundPairAssets,
  isInitialSoundQuestion
} from "./data/initialSoundPairAssets";
import {
  hasCompletePairSelectionAssets,
  isPairSelectionQuestion,
  normalizePairSelectionAnswer
} from "./data/soundPairAssets";
import {
  hasCompleteVisualQuestionAssets,
  isVisualCardChoiceQuestion
} from "./data/visualQuestionAssets";

import { templateQuestions } from "./data/templateQuestions";
import { templateExpansion } from "./data/templateExpansion";
import { templateExpansion2 } from "./data/templateExpansion2";
import { templateExpansion3 } from "./data/templateExpansion3";
import { templateExpansion4 } from "./data/templateExpansion4";
import { templateExpansion5 } from "./data/templateExpansion5";
import { templateExpansion6 } from "./data/templateExpansion6";
import { templateExpansion7 } from "./data/templateExpansion7";
import { questionBankExpansion8 } from "./data/questionBankExpansion8";
import { generatedQuestions } from "./data/generatedQuestions";
import { fixSentenceQuestions } from "./data/fixSentenceQuestions";
import { templateComprehensionAdvanced } from "./data/templateComprehensionAdvanced";
import { advancedPhonicsPatterns } from "./data/advancedPhonicsPatterns";
import { shortAEchoCavesQuestions } from "./data/childActivityModels";
import { audioManifest, audioTextIndex } from "./data/audioManifest";
import { getApprovedAudioPath, getPreferredAudioPath } from "./data/audioPreferenceManifest";
import {
  applyQuestionFormatMetadata,
  getQuestionFormatMetadata,
  isMasteryEligible
} from "./questionFormatFramework";
import { isAssessmentContentValid } from "./assessmentContentValidation";
import { prepareNaturalSpeechText } from "./audioSpeechPolicy";
import {
  getAnswerRecordPromptAnswerSignature,
  getAnswerRecordSignature,
  getQuestionPromptAnswerSignature,
  getQuestionSignature,
  getRepeatOptionSetSignature,
  getRepeatTargetWord
} from "./questionRepeatGuards";

// dynamic mastery system

const ChildModePage = lazy(() =>
  import("./components/ChildMode").then(module => ({
    default: module.ChildModePage
  }))
);

const AdminDashboardPage = lazy(() =>
  import("@/components/AdminDashboardPage").then(module => ({
    default: module.AdminDashboardPage
  }))
);

const FinishedReportPage = lazy(() =>
  import("@/components/FinishedReportPage").then(module => ({
    default: module.FinishedReportPage
  }))
);

function LazyPageFallback({ label = "Loading..." }) {
  return (
    <div className="card page-card page-stack lazy-page-fallback">
      <h2>{label}</h2>
    </div>
  );
}

function LearningWorldFallback({ returnToTeacher }) {
  return (
    <main className="learning-world-fallback" role="alert">
      <section className="learning-world-fallback-card">
        <h1>Space Hub could not load</h1>
        <button
          className="child-continue-button"
          onClick={returnToTeacher}
          type="button"
        >
          Back to Teacher
        </button>
      </section>
    </main>
  );
}

class LearningWorldErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.warn("Space Hub failed to render.", error, info);
  }

  render() {
    if (this.state.hasError) {
      return <LearningWorldFallback returnToTeacher={this.props.returnToTeacher} />;
    }

    return this.props.children;
  }
}

function LearningWorldShell({ children, returnToTeacher }) {
  return (
    <section className="learning-world-shell" aria-label="Space Hub">
      <button
        className="learning-world-exit-button"
        onClick={returnToTeacher}
        type="button"
      >
        Exit Space Hub
      </button>

      <LearningWorldErrorBoundary returnToTeacher={returnToTeacher}>
        {children}
      </LearningWorldErrorBoundary>
    </section>
  );
}

function shuffleArray(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

function normalize(text) {
  return String(text || "").toLowerCase().trim();
}

function getStageIndex(question) {
  const skill = normalize(question.skill);

  const exactIndex = skillTree.findIndex(stage =>
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

function isFixSentenceQuestion(question) {
  return question?.questionType === "fix_sentence";
}

function normalizeSentenceAnswer(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim();
}

function comparableSentenceAnswer(text) {
  return normalizeSentenceAnswer(text).toLowerCase();
}

function getQuestionPrompt(question) {
  return question.prompt || question.question || "";
}

function getQuestionAnswer(question) {
  return isFixSentenceQuestion(question)
    ? question.correctSentence
    : question.answer || question.correctAnswer;
}

function normalizeTemplateOption(option) {
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

function normalizeContentQuestion(question) {
  const answerOptions = Array.isArray(question.answerOptions)
    ? question.answerOptions.map(normalizeTemplateOption)
    : [];
  const choices = Array.isArray(question.choices) && question.choices.length > 0
    ? question.choices
    : answerOptions.map(option => option.value).filter(Boolean);
  const answer = question.answer || question.correctAnswer;

  return {
    ...question,
    skill: question.skill || question.skillName || "",
    question: question.question || question.prompt || "",
    prompt: question.prompt || question.question || "",
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

function formatExportValue(value) {
  if (Array.isArray(value)) {
    return value.map(formatExportValue).filter(Boolean).join(" | ");
  }

  if (value && typeof value === "object") {
    if (value.word) return formatExportValue(value.word);
    if (value.label) return formatExportValue(value.label);
    if (value.text) return formatExportValue(value.text);
    return JSON.stringify(value);
  }

  return String(value ?? "");
}

function buildQuestionExportText(item = {}) {
  const passage = formatExportValue(item.passage);
  const question = formatExportValue(item.question || item.prompt);
  return [passage, question].filter(Boolean).join(" ");
}

async function createExcelWorkbook() {
  const module = await import("exceljs");
  const ExcelJS = module.default || module["module.exports"] || module;

  if (!ExcelJS?.Workbook) {
    throw new Error("ExcelJS workbook export is unavailable.");
  }

  return new ExcelJS.Workbook();
}

function downloadBlob(blob, filename) {
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

function isWordRecognitionQuestion(question) {
  const typeText = normalize([question?.questionType, question?.formatType].join(" "));
  return typeText.includes("word recognition") || typeText.includes("print match");
}

function getAnchorWord(question) {
  const text = normalize([question?.question, question?.prompt, question?.spokenPrompt].join(" "));
  const match =
    text.match(/\b(?:starts the same as|ends the same as|starts like|ends like|has the same middle sound as|same sound in the middle as) ([a-z]+)\b/);

  return match?.[1] || "";
}

function hasAnchorChoiceLeakage(question) {
  if (isWordRecognitionQuestion(question)) return false;

  const anchor = getAnchorWord(question);
  if (!anchor || !Array.isArray(question?.choices)) return false;

  return question.choices.map(choice => normalize(choice)).includes(anchor);
}

function sentenceCompletionMissingContext(question) {
  const promptText = String([question?.question, question?.prompt, question?.spokenPrompt].join(" "));
  if (!/\b(complete(?:s)? the sentence|best completes the sentence)\b/i.test(promptText)) return false;

  return !(question?.passage || question?.sentence || question?.context || question?.brokenSentence);
}

function questionContainsWord(question, word) {
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

function hasWeakLegacyPhonicsFormat(question) {
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

function hasLowQualityPluralDistractors(question) {
  const skill = normalize(question?.skill);
  if (!skill.includes("plural")) return false;

  return (question?.choices || [])
    .map(choice => normalize(choice))
    .some(choice => choice.endsWith("z"));
}

function getQuestionTargetWord(question) {
  return getRepeatTargetWord(question);
}

function normalizeItemKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[“”]/g, "\"")
    .replace(/[‘’]/g, "'")
    .replace(/^\/|\/$/g, "")
    .trim();
}

const vowelTeamPatterns = ["ai", "ay", "ee", "ea", "oa", "ow", "igh", "ie", "oo", "ue", "ew", "oi", "oy", "ou", "aw"];
const rControlledPatterns = ["ar", "er", "ir", "or", "ur"];
const blendPatterns = ["bl", "cl", "fl", "gl", "pl", "sl", "br", "cr", "dr", "fr", "gr", "pr", "tr", "sc", "sk", "sm", "sn", "sp", "st", "sw"];
const digraphPatterns = ["sh", "ch", "th", "wh", "ph"];
const DEBUG_ASSESSMENT_COVERAGE = Boolean(import.meta.env?.DEV);

function debugAssessmentCoverage(label, payload) {
  if (!DEBUG_ASSESSMENT_COVERAGE) return;
  console.debug(`[assessment-coverage] ${label}`, payload);
}

function findPatternInText(patterns, text) {
  return patterns.find(pattern =>
    new RegExp(`(^|[^a-z])${pattern}([^a-z]|$)`).test(text) ||
    normalizeItemKey(text).includes(pattern)
  );
}

function inferItemMetadata(question) {
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
    const family = rhymeMatch?.[1]?.slice(-2) || answer.slice(-2);
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

function getRuntimeQuestionSignature(question) {
  return getQuestionSignature(question, inferItemMetadata(question));
}

function getRuntimeQuestionPromptAnswerSignature(question) {
  return getQuestionPromptAnswerSignature(question);
}

function findQuestionForAnswerRecord(record) {
  const promptAnswerSignature = getAnswerRecordPromptAnswerSignature(record);
  const stage = record.stage || record.skill || "";
  if (!promptAnswerSignature) return "";

  return allQuestions.find(question =>
    (skillTree[getStageIndex(question)]?.label || question.skill) === stage &&
    getRuntimeQuestionPromptAnswerSignature(question) === promptAnswerSignature
  );
}

function deriveQuestionIdFromAnswerRecord(record) {
  const match = findQuestionForAnswerRecord(record);

  return match?.id || "";
}

function hydrateAnswerRecord(record = {}) {
  const baseRecord = {
    ...record,
    question: record.question || record.prompt || "",
    correct: record.correct || record.correctAnswer || ""
  };
  const matchedQuestion = findQuestionForAnswerRecord(baseRecord);

  return {
    ...baseRecord,
    questionId: baseRecord.questionId || matchedQuestion?.id || "",
    questionSignature: baseRecord.questionSignature || (
      matchedQuestion
        ? getRuntimeQuestionSignature(matchedQuestion)
        : getAnswerRecordSignature(baseRecord)
    ),
    promptAnswerSignature: baseRecord.promptAnswerSignature || getAnswerRecordPromptAnswerSignature(baseRecord),
    optionSetSignature: baseRecord.optionSetSignature || (matchedQuestion ? getRepeatOptionSetSignature(matchedQuestion) : ""),
    targetWord: baseRecord.targetWord || (matchedQuestion ? getQuestionTargetWord(matchedQuestion) : "")
  };
}

function applyItemMetadata(question) {
  const metadata = inferItemMetadata(question);
  return metadata
    ? { ...question, itemKey: metadata.itemKey, itemType: metadata.itemType }
    : question;
}

function isMissingTableError(error, tableName) {
  return error?.code === "42P01" || new RegExp("relation .*" + tableName + ".* does not exist", "i").test(error?.message || "");
}

function isMissingItemMasteryTableError(error) {
  return isMissingTableError(error, "item_mastery");
}

function isMissingChildModeAnswersTableError(error) {
  return isMissingTableError(error, "child_mode_answers");
}

function calculateWeaknessSnapshot(answerHistory) {
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

const echoCavesMissionMap = [
  { id: "intro", label: "The Crystal Hum", matches: questionId => questionId.includes("intro") },
  { id: "practice", label: "Rumble's Lost Crystals", matches: questionId => questionId.includes("practice-") },
  { id: "mixed", label: "The Four Tunnel Crystals", matches: questionId => questionId.includes("mixed") },
  { id: "mastery", label: "Deep Crystal Mastery", matches: questionId => questionId.includes("mastery") }
];

const echoCavesWords = Array.from(
  new Set(shortAEchoCavesQuestions.map(question => normalizeItemKey(question.targetWord)).filter(Boolean))
).sort();

function buildChildLearningEvidence(answerRows = [], itemMasteryRows = [], tableMissing = false) {
  if (tableMissing) {
    return {
      tableMissing: true,
      worldsPlayed: [],
      missionsCompleted: [],
      attempted: 0,
      correct: 0,
      recentAccuracy: null,
      masteredWords: [],
      focus: "Space Hub practice data is not available yet.",
      supportNeeds: [],
      lastPlayed: null,
      masteryChips: echoCavesWords.map(word => ({ word, status: "not-attempted" }))
    };
  }

  const childRows = (answerRows || []).filter(row =>
    (row.source || "child_mode").includes("child_mode")
  );
  const attemptedWords = new Set(childRows.map(row => normalizeItemKey(row.item_key || row.target_word)).filter(Boolean));
  const childMasteryRows = (itemMasteryRows || []).filter(row =>
    attemptedWords.has(normalizeItemKey(row.item_key)) &&
    (row.item_type === "cvc_word" || row.item_type?.includes("child_mode"))
  );

  const attempted = childRows.length;
  const correct = childRows.filter(row => row.is_correct).length;
  const recent = childRows.slice(-10);
  const recentCorrect = recent.filter(row => row.is_correct).length;
  const missedRows = childRows.filter(row => !row.is_correct);
  const masteredWords = childMasteryRows
    .filter(row => row.mastered)
    .map(row => normalizeItemKey(row.item_key))
    .filter(Boolean)
    .sort();
  const masteredSet = new Set(masteredWords);
  const allChipWords = Array.from(new Set([...echoCavesWords, ...attemptedWords])).sort();
  const lastPlayed = childRows.length
    ? childRows[childRows.length - 1].answered_at
    : null;
  const supportNeeds = [];

  if (missedRows.some(row =>
    /[eo]/.test(normalizeItemKey(row.selected_answer || "")) &&
    /a/.test(normalizeItemKey(row.correct_answer || row.target_word || ""))
  )) {
    supportNeeds.push("Confuses short-a and short-o/short-e contrasts");
  }

  if (missedRows.length > 0) {
    supportNeeds.push("Short-A vowel discrimination");
  }

  const missionsCompleted = echoCavesMissionMap
    .filter(mission => childRows.some(row => mission.matches(row.question_id || "")))
    .map(mission => mission.label);

  return {
    tableMissing: false,
    worldsPlayed: attempted > 0 ? ["Phonics Lab"] : [],
    missionsCompleted,
    attempted,
    correct,
    recentAccuracy: recent.length ? Math.round((recentCorrect / recent.length) * 100) : null,
    masteredWords,
    focus: supportNeeds[0] || (attempted > 0 ? "Ready for more Space Hub practice" : "No Space Hub practice yet"),
    supportNeeds,
    lastPlayed,
    masteryChips: allChipWords.map(word => ({
      word,
      status: masteredSet.has(word)
        ? "mastered"
        : attemptedWords.has(word)
          ? "practicing"
          : "not-attempted"
    }))
  };
}

function isQuestionValid(q) {
  if (!q) return false;
  if (!q.id || !q.skill || !getQuestionPrompt(q) || !getQuestionAnswer(q)) return false;

  if (isFixSentenceQuestion(q)) {
    const tiles = q.tiles || q.choices;

    if (!q.brokenSentence || !Array.isArray(tiles) || tiles.length < 2) return false;
    return getStageIndex(q) !== -1;
  }

  if (q.templateType === "PUT_SOUNDS_IN_ORDER") {
    return Array.isArray(q.soundTiles) &&
      q.soundTiles.length >= 2 &&
      getStageIndex(q) !== -1 &&
      isAssessmentContentValid(q);
  }

  if (!Array.isArray(q.choices) || q.choices.length < 2) return false;
  if (!isPairSelectionQuestion(q) && !q.choices.includes(q.answer)) return false;

  if (q.questionType === "initial_sound_pair" && isInitialSoundQuestion(q) && !hasCompleteInitialSoundPairAssets(q)) return false;
  if (isPairSelectionQuestion(q) && !hasCompletePairSelectionAssets(q)) return false;
  if (isVisualCardChoiceQuestion(q) && !hasCompleteVisualQuestionAssets(q)) return false;
  if (q.questionType === "listen_and_find_word") {
    const diagnostics = getListenAndFindAssetDiagnostics(q);
    if (
      diagnostics?.missingAudio ||
      diagnostics?.missingImages.length > 0 ||
      diagnostics?.missingChoiceAssets.length > 0 ||
      !diagnostics?.usesSingleWordAudioText
    ) return false;
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

  return getStageIndex(q) !== -1;
}

const allQuestions = [
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
].map(question =>
  applyQuestionFormatMetadata(applyItemMetadata(
    enrichInitialSoundPairQuestion(enrichListenAndFindWordQuestion(normalizeContentQuestion(question)))
  ))
).filter(isQuestionValid);

const configuredCoverageTotals = coverageExpectations;

function getCoverageItemKeysForStage(stage) {
  const configured = configuredCoverageTotals[stage?.id];
  if (configured?.itemKeys?.length && configured?.itemType) {
    return new Set(
      configured.itemKeys.map(itemKey =>
        getItemMasteryStateKeyForValues(itemKey, configured.itemType)
      )
    );
  }

  const keys = new Set();

  allQuestions.forEach(question => {
    if (getStageIndex(question) !== skillTree.findIndex(item => item.id === stage.id)) return;

    const metadata = inferItemMetadata(question);
    if (!metadata?.itemKey || !metadata?.itemType) return;

    keys.add(getItemMasteryStateKeyForValues(metadata.itemKey, metadata.itemType));
  });

  return keys;
}

function getItemMasteryStateKeyForValues(itemKey, itemType) {
  return normalizeItemKey(itemType) + "::" + normalizeItemKey(itemKey);
}

function buildCoverageSnapshot(itemMasteryRows = {}, debugContext = null) {
  const rowsByKey = new Map(
    Object.values(itemMasteryRows || {}).map(row => [
      getItemMasteryStateKeyForValues(row.itemKey, row.itemType),
      row
    ])
  );

  return skillTree.reduce((snapshot, stage) => {
    const runtimeKeys = getCoverageItemKeysForStage(stage);
    const configured = configuredCoverageTotals[stage.id];
    const total = configured?.total || runtimeKeys.size;
    const unit = configured?.unit || (stage.label.toLowerCase().includes("word") ? "words" : "items");
    const masteredKeys = Array.from(runtimeKeys).filter(key => {
      const row = rowsByKey.get(key);
      return row?.mastered || row?.correct > 0;
    });
    const mastered = masteredKeys.length;

    if (debugContext?.enabled) {
      debugAssessmentCoverage("coverage calculation", {
        studentId: debugContext.studentId,
        skill: stage.label,
        expectedItemTypes: Array.from(new Set(Array.from(runtimeKeys).map(key => key.split("::")[0]))),
        masteredRowCount: mastered,
        masteredItemKeys: masteredKeys.map(key => key.split("::")[1])
      });
    }

    snapshot[stage.id] = {
      mastered: Math.min(mastered, total),
      total,
      unit,
      inferred: !configured
    };

    return snapshot;
  }, {});
}

function buildQuestionBankCoverage(questions = []) {
  const rowsBySkill = new Map();

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
      missingAudio: 0
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

    existing.total += 1;
    existing.active += question.active === false ? 0 : 1;
    existing.inactive += question.active === false ? 1 : 0;
    existing.templates[template] = (existing.templates[template] || 0) + 1;
    existing.difficulties[difficulty] = (existing.difficulties[difficulty] || 0) + 1;
    if (pattern) existing.patterns[pattern] = (existing.patterns[pattern] || 0) + 1;
    if (needsImage && !question.imagePath) existing.missingImage += 1;
    if (needsAudio && !getApprovedAudioPath(question.audioText || question.targetWord || question.answer, question.audioPath || "")) {
      existing.missingAudio += 1;
    }

    rowsBySkill.set(skill, existing);
  });

  return Array.from(rowsBySkill.values()).sort((a, b) => a.skill.localeCompare(b.skill));
}

const letterAssessmentOrder = [
  "m", "T", "b", "S", "a", "F", "d", "R", "p", "E", "g", "H", "c",
  "M", "t", "B", "s", "A", "f", "D", "r", "P", "e", "G", "h", "C",
  "y", "K", "o", "J", "w", "Z", "x", "V", "l", "N", "q", "U", "i",
  "Y", "k", "O", "j", "W", "z", "X", "v", "L", "n", "Q", "u", "I"
];

export default function App() {
  const [studentName, setStudentName] = useState("");
  const [studentId, setStudentId] = useState(null);
  const [studentList, setStudentList] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [classList, setClassList] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [newClassName, setNewClassName] = useState("");
  const [classDashboard, setClassDashboard] = useState([]);
  const [showClassDashboard, setShowClassDashboard] = useState(false);
  const [appView, setAppView] = useState("select");
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);
  const [currentSkillIndex, setCurrentSkillIndex] = useState(0);
  const [roundAnswers, setRoundAnswers] = useState([]);
  const [roundItemKeys, setRoundItemKeys] = useState([]);
  const [roundQuestionIds, setRoundQuestionIds] = useState([]);
  const [usedByStage, setUsedByStage] = useState({});
  const [mastery, setMastery] = useState({});
  const [childLearningEvidence, setChildLearningEvidence] = useState(() =>
    buildChildLearningEvidence()
  );
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [message, setMessage] = useState("");
  const [teacherUser, setTeacherUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminFlagStatusFilter, setAdminFlagStatusFilter] = useState("open");
  const [adminFlags, setAdminFlags] = useState([]);
  const [adminTeachers, setAdminTeachers] = useState([]);
  const [adminClasses, setAdminClasses] = useState([]);
  const [adminStudents, setAdminStudents] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [flagDialogOpen, setFlagDialogOpen] = useState(false);
  const [flagIssueType, setFlagIssueType] = useState("Confusing wording");
  const [flagNote, setFlagNote] = useState("");
  const [flagSubmitting, setFlagSubmitting] = useState(false);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [correctAnswered, setCorrectAnswered] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [allowPassageAudio, setAllowPassageAudio] = useState(false);

  const [assessmentMode, setAssessmentMode] =
    useState("mastery");

  const [letterIndex, setLetterIndex] =
    useState(0);

  const [letterAssessment, setLetterAssessment] =
    useState([]);

  const [patternIndex, setPatternIndex] =
    useState(0);

  const [patternAssessment, setPatternAssessment] =
    useState([]);

  const [patternAttempt, setPatternAttempt] =
    useState(0);
  const [answerHistory, setAnswerHistory] = useState([]);
  const [guidedReadingRecords, setGuidedReadingRecords] = useState({});
  const [itemMastery, setItemMastery] = useState({});
  const [itemSessionSeen, setItemSessionSeen] = useState({});
  const [checkpointDecision, setCheckpointDecision] = useState(null);
  const [resetProgressDialogOpen, setResetProgressDialogOpen] = useState(false);
  const [resettingProgress, setResettingProgress] = useState(false);
  const answerInFlightRef = useRef(false);

  const currentStage = skillTree[currentSkillIndex];

  const masteryRule =
    getMasteryRule(currentStage.label);

  const ROUND_LENGTH =
    masteryRule.roundLength;

  const PASS_SCORE =
    masteryRule.passScore;

  const currentStageQuestions =
    allQuestions.filter(q =>
      getStageIndex(q) === currentSkillIndex
    );

  const weaknessSnapshot =
    calculateWeaknessSnapshot(answerHistory);

  const teacherId =
    teacherUser?.id || null;

  const profileStorageKey =
    teacherId ? `readingMasteryProfile:${teacherId}` : null;

  function getGuidedReadingStorageKey(selectedStudentId = studentId) {
    // TODO(guided-reading-persistence): Move these records into Supabase once a stable table/schema is approved.
    if (!teacherId || !selectedStudentId) return null;
    return `guidedReadingAssessment:${teacherId}:${selectedStudentId}`;
  }

  function loadGuidedReadingRecords(selectedStudentId = studentId) {
    const key = getGuidedReadingStorageKey(selectedStudentId);
    if (!key) return {};

    try {
      return JSON.parse(localStorage.getItem(key) || "{}");
    } catch (error) {
      console.warn("Could not restore guided reading records.", error);
      return {};
    }
  }

  function saveGuidedReadingRecord(bookId, record) {
    if (!bookId || !studentId) return;

    setGuidedReadingRecords(previous => {
      const next = {
        ...previous,
        [bookId]: record
      };
      const key = getGuidedReadingStorageKey(studentId);
      if (key) localStorage.setItem(key, JSON.stringify(next));
      return next;
    });
  }

  function clearTeacherState() {
    setStudentName("");
    setStudentId(null);
    setStudentList([]);
    setClassList([]);
    setSelectedClassId(null);
    setNewClassName("");
    setClassDashboard([]);
    setShowClassDashboard(false);
    setAppView("select");
    setNameSaved(false);
    setCurrentSkillIndex(0);
    setRoundAnswers([]);
    setRoundItemKeys([]);
    setRoundQuestionIds([]);
    setUsedByStage({});
    setMastery({});
    setChildLearningEvidence(buildChildLearningEvidence());
    setCurrentQuestion(null);
    setFeedback(null);
    setMessage("");
    setFlagDialogOpen(false);
    setAdminFlags([]);
    setAdminTeachers([]);
    setAdminClasses([]);
    setAdminStudents([]);
    setIsAdmin(false);
    setTotalAnswered(0);
    setCorrectAnswered(0);
    setShowReport(false);
    setAssessmentMode("mastery");
    setLetterIndex(0);
    setLetterAssessment([]);
    setPatternIndex(0);
    setPatternAssessment([]);
    setAnswerHistory([]);
    setGuidedReadingRecords({});
    setItemMastery({});
    setItemSessionSeen({});
    setCheckpointDecision(null);
    setResetProgressDialogOpen(false);
    setResettingProgress(false);
    answerInFlightRef.current = false;
  }

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      setTeacherUser(data.session?.user || null);
      setAuthReady(true);
    });

    const { data: authListener } =
      supabase.auth.onAuthStateChange((_event, session) => {
        setTeacherUser(session?.user || null);
        setAuthReady(true);
      });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!teacherId) {
      setIsAdmin(false);
      return;
    }

    checkAdminStatus(teacherId);
  }, [teacherId]);

  useEffect(() => {
    if (isAdmin && appView === "admin") {
      loadAdminDashboard(adminFlagStatusFilter);
    }
  }, [isAdmin, appView]);

  useEffect(() => {
    if (!authReady) return;

    setProfileLoaded(false);

    if (!teacherId || !profileStorageKey) {
      clearTeacherState();
      setProfileLoaded(true);
      return;
    }

    loadClasses();

    const saved = localStorage.getItem(profileStorageKey);

    if (saved) {
      try {
        const data = JSON.parse(saved);
        const savedStudentName = data.studentName || "";
        const savedClassId = data.selectedClassId || null;

        setStudentName(savedStudentName);
        setStudentId(data.studentId || null);
        setSelectedClassId(savedClassId);
        setNameSaved(Boolean(savedStudentName));
        setAppView(data.appView === "checkpoint" ? "overview" : data.appView || (savedStudentName ? "overview" : "select"));
        setAssessmentMode(data.assessmentMode || "mastery");
        setCurrentSkillIndex(data.currentSkillIndex || 0);
        setRoundAnswers(data.roundAnswers || []);
        setRoundItemKeys([]);
        setRoundQuestionIds([]);
        setUsedByStage(data.usedByStage || {});
        setMastery(data.mastery || {});
        setTotalAnswered(data.totalAnswered || 0);
        setCorrectAnswered(data.correctAnswered || 0);
        setLetterIndex(data.letterIndex || 0);
        setLetterAssessment(data.letterAssessment || []);
        setPatternIndex(data.patternIndex || 0);
        setPatternAssessment(data.patternAssessment || []);
        setPatternAttempt(data.patternAttempt || 0);
        setAnswerHistory((data.answerHistory || []).map(hydrateAnswerRecord));
        setGuidedReadingRecords(loadGuidedReadingRecords(data.studentId || null));
        setItemMastery(data.itemMastery || {});
        setItemSessionSeen({});

        loadStudents(savedClassId);
      } catch (error) {
        console.warn("Could not restore saved reading profile.", error);
        localStorage.removeItem(profileStorageKey);
        loadStudents();
      }
    } else {
      loadStudents();
    }

    setProfileLoaded(true);
  }, [authReady, teacherId, profileStorageKey]);

  useEffect(() => {
    if (!profileLoaded || !profileStorageKey) return;

    localStorage.setItem(
      profileStorageKey,
      JSON.stringify({
        studentName,
        studentId,
        selectedClassId,
        appView,
        assessmentMode,
        currentSkillIndex,
        roundAnswers,
        usedByStage,
        mastery,
        totalAnswered,
        correctAnswered,
        letterIndex,
        letterAssessment,
        patternIndex,
        patternAssessment,
        patternAttempt,
    answerHistory,
    itemMastery
      })
    );
  }, [
    profileLoaded,
    studentName,
    studentId,
    selectedClassId,
    appView,
    assessmentMode,
    currentSkillIndex,
    roundAnswers,
    usedByStage,
    mastery,
    totalAnswered,
    correctAnswered,
    letterIndex,
    letterAssessment,
    patternIndex,
    patternAssessment,
    patternAttempt,
    answerHistory,
    itemMastery,
    profileStorageKey
  ]);


  async function checkAdminStatus(userId = teacherId) {
    if (!userId) {
      setIsAdmin(false);
      return false;
    }

    const { data, error } = await supabase
      .from("app_admins")
      .select("id, user_id, email")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      if (!isMissingTableError(error, "app_admins")) {
        console.warn("Admin status check failed.", error);
      }
      setIsAdmin(false);
      return false;
    }

    const nextIsAdmin = Boolean(data?.user_id);
    setIsAdmin(nextIsAdmin);
    return nextIsAdmin;
  }

  function buildTeacherRows(classes = [], students = [], answers = [], flags = []) {
    const teacherMap = new Map();

    function ensureTeacher(id, email = "") {
      if (!id) return null;
      if (!teacherMap.has(id)) {
        teacherMap.set(id, {
          id,
          email: email || "Email unavailable",
          classes: 0,
          students: 0,
          answers: 0,
          flags: 0
        });
      }

      const row = teacherMap.get(id);
      if (email && row.email === "Email unavailable") row.email = email;
      return row;
    }

    classes.forEach(row => {
      const teacher = ensureTeacher(row.teacher_id);
      if (teacher) teacher.classes += 1;
    });

    students.forEach(row => {
      const teacher = ensureTeacher(row.teacher_id);
      if (teacher) teacher.students += 1;
    });

    answers.forEach(row => {
      const teacher = ensureTeacher(row.teacher_id);
      if (teacher) teacher.answers += 1;
    });

    flags.forEach(row => {
      const teacher = ensureTeacher(row.teacher_id, row.teacher_email);
      if (teacher) teacher.flags += 1;
    });

    return [...teacherMap.values()].sort((a, b) => a.email.localeCompare(b.email));
  }

  async function loadAdminDashboard(statusFilter = adminFlagStatusFilter) {
    if (!isAdmin) return;

    setAdminLoading(true);

    const flagQuery = supabase
      .from("question_flags")
      .select("*")
      .order("created_at", { ascending: false });

    if (statusFilter !== "all") flagQuery.eq("status", statusFilter);

    const [flagsResult, classesResult, studentsResult, answersResult] = await Promise.all([
      flagQuery,
      supabase.from("classes").select("id, name, teacher_id, created_at").order("created_at", { ascending: false }),
      supabase.from("students").select("id, name, class_id, teacher_id, created_at").order("created_at", { ascending: false }),
      supabase.from("answers").select("id, teacher_id, student_id")
    ]);

    setAdminLoading(false);

    const firstError = flagsResult.error || classesResult.error || studentsResult.error || answersResult.error;
    if (firstError) {
      console.error("Admin dashboard load error:", firstError);
      setMessage("Could not load admin dashboard. Check admin RLS policies and migration.");
      return;
    }

    const classes = classesResult.data || [];
    const students = studentsResult.data || [];
    const flags = flagsResult.data || [];
    const answers = answersResult.data || [];
    const classById = new Map(classes.map(row => [row.id, row]));
    const studentById = new Map(students.map(row => [row.id, row]));
    const studentCounts = new Map();

    students.forEach(student => {
      studentCounts.set(student.class_id, (studentCounts.get(student.class_id) || 0) + 1);
    });

    const flagsWithNames = flags.map(flag => ({
      ...flag,
      class_name: classById.get(flag.class_id)?.name || "Class unavailable",
      student_name: studentById.get(flag.student_id)?.name || "Student unavailable"
    }));

    const classRows = classes.map(row => ({
      ...row,
      studentCount: studentCounts.get(row.id) || 0
    }));

    const studentRows = students.map(row => ({
      ...row,
      className: classById.get(row.class_id)?.name || "Class unavailable"
    }));

    setAdminFlags(flagsWithNames);
    setAdminClasses(classRows);
    setAdminStudents(studentRows);
    setAdminTeachers(buildTeacherRows(classes, students, answers, flags));
  }

  function openAdminDashboard() {
    setAppView("admin");
    loadAdminDashboard(adminFlagStatusFilter);
  }

  async function updateQuestionFlagStatus(flagId, status) {
    if (!isAdmin || !flagId) return;

    const patch = status === "resolved"
      ? {
          status: "resolved",
          resolved_at: new Date().toISOString(),
          resolved_by: teacherId
        }
      : {
          status: "open",
          resolved_at: null,
          resolved_by: null
        };

    const { error } = await supabase
      .from("question_flags")
      .update(patch)
      .eq("id", flagId);

    if (error) {
      console.error("Update question flag error:", error);
      setMessage("Could not update question flag.");
      return;
    }

    await loadAdminDashboard(adminFlagStatusFilter);
    setMessage(status === "resolved" ? "Flag marked resolved." : "Flag reopened.");
  }

  async function deleteOptionalTableRows(tableName, columnName, values) {
    if (!values || values.length === 0) return null;

    const { error } = await supabase
      .from(tableName)
      .delete()
      .in(columnName, values);

    if (error && !isMissingTableError(error, tableName)) return error;
    return null;
  }

  async function adminDeleteStudent(selectedStudentId, selectedStudentName = "this student") {
    if (!isAdmin || !selectedStudentId) return;

    const confirmed = window.confirm(
      `Admin delete ${selectedStudentName}? This removes the student and associated assessment data.`
    );

    if (!confirmed) return;

    const ids = [selectedStudentId];
    const errors = [];

    for (const [tableName, columnName] of [
      ["answers", "student_id"],
      ["mastery", "student_id"],
      ["item_mastery", "student_id"],
      ["assessment_sessions", "student_id"],
      ["question_flags", "student_id"]
    ]) {
      const error = await deleteOptionalTableRows(tableName, columnName, ids);
      if (error) errors.push(error);
    }

    const { error: studentError } = await supabase
      .from("students")
      .delete()
      .eq("id", selectedStudentId);

    if (studentError) errors.push(studentError);

    if (errors.length > 0) {
      console.error("Admin delete student error:", errors[0]);
      setMessage("Could not delete student from admin dashboard.");
      return;
    }

    await loadAdminDashboard(adminFlagStatusFilter);
    setMessage(`Deleted ${selectedStudentName}.`);
  }

  async function adminDeleteClass(classId, className = "this class") {
    if (!isAdmin || !classId) return;

    const confirmed = window.confirm(
      `Admin delete ${className}? This removes the class, its students, and associated assessment data.`
    );

    if (!confirmed) return;

    const { data: students, error: lookupError } = await supabase
      .from("students")
      .select("id")
      .eq("class_id", classId);

    if (lookupError) {
      console.error("Admin class student lookup error:", lookupError);
      setMessage("Could not delete class from admin dashboard.");
      return;
    }

    const studentIds = (students || []).map(row => row.id);
    const errors = [];

    if (studentIds.length > 0) {
      for (const [tableName, columnName] of [
        ["answers", "student_id"],
        ["mastery", "student_id"],
        ["item_mastery", "student_id"],
        ["assessment_sessions", "student_id"],
        ["question_flags", "student_id"]
      ]) {
        const error = await deleteOptionalTableRows(tableName, columnName, studentIds);
        if (error) errors.push(error);
      }
    }

    const { error: flagClassError } = await supabase
      .from("question_flags")
      .delete()
      .eq("class_id", classId);

    if (flagClassError && !isMissingTableError(flagClassError, "question_flags")) errors.push(flagClassError);

    const { error: studentsError } = await supabase
      .from("students")
      .delete()
      .eq("class_id", classId);

    if (studentsError) errors.push(studentsError);

    const { error: classError } = await supabase
      .from("classes")
      .delete()
      .eq("id", classId);

    if (classError) errors.push(classError);

    if (errors.length > 0) {
      console.error("Admin delete class error:", errors[0]);
      setMessage("Could not delete class from admin dashboard.");
      return;
    }

    await loadAdminDashboard(adminFlagStatusFilter);
    setMessage(`Deleted ${className}.`);
  }

  async function signUpTeacher() {
    const email = authEmail.trim();
    if (!email || !authPassword) {
      setAuthMessage("Enter an email and password.");
      return;
    }

    setAuthLoading(true);
    setAuthMessage("");

    const { error } = await supabase.auth.signUp({
      email,
      password: authPassword
    });

    setAuthLoading(false);

    if (error) {
      setAuthMessage(error.message);
      return;
    }

    setAuthMessage("Account created. Check your email if confirmation is enabled, then log in.");
  }

  async function logInTeacher() {
    const email = authEmail.trim();
    if (!email || !authPassword) {
      setAuthMessage("Enter an email and password.");
      return;
    }

    setAuthLoading(true);
    setAuthMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: authPassword
    });

    setAuthLoading(false);

    if (error) {
      setAuthMessage(error.message);
      return;
    }

    setAuthPassword("");
    setAuthMessage("");
  }

  async function logOutTeacher() {
    await supabase.auth.signOut();
    clearTeacherState();
    setAuthPassword("");
    setAuthMessage("Logged out.");
  }

  async function loadClasses() {
    if (!teacherId) {
      setClassList([]);
      return;
    }

    const { data, error } = await supabase
      .from("classes")
      .select("id, name, created_at")
      .eq("teacher_id", teacherId)
      .order("name", { ascending: true });

    if (error) {
      console.error("Load classes error:", error);
      setMessage("Could not load classes from cloud.");
      return;
    }

    setClassList(data || []);
  }

  async function createClass() {
    const clean = newClassName.trim();
    if (!clean) return;

    if (!teacherId) {
      setMessage("Please log in first.");
      return;
    }

    const { data, error } = await supabase
      .from("classes")
      .insert({ name: clean, teacher_id: teacherId })
      .select()
      .single();

    if (error) {
      console.error("Create class error:", error);
      setMessage("Could not create class.");
      return;
    }

    setNewClassName("");
    setSelectedClassId(data.id);
    await loadClasses();
    await loadStudents(data.id);
    setMessage(`Class created: ${clean}`);
  }

  async function loadStudents(classId = selectedClassId) {
    if (!teacherId || !classId) {
      setStudentList([]);
      setLoadingStudents(false);
      return;
    }

    setLoadingStudents(true);

    const { data, error } = await supabase
      .from("students")
      .select("id, name, class_id, created_at")
      .eq("teacher_id", teacherId)
      .eq("class_id", classId)
      .order("name", { ascending: true });

    if (error) {
      console.error("Load students error:", error);
      setMessage("Could not load students from cloud.");
      setLoadingStudents(false);
      return;
    }

    setStudentList(data || []);
    setLoadingStudents(false);
  }

  async function loadClassDashboard(classId = selectedClassId) {
    if (!teacherId) {
      setMessage("Please log in first.");
      return;
    }

    if (!classId) {
      setMessage("Select a class first.");
      return;
    }

    const { data: students, error: studentsError } = await supabase
      .from("students")
      .select("id, name, created_at")
      .eq("teacher_id", teacherId)
      .eq("class_id", classId)
      .order("name", { ascending: true });

    if (studentsError) {
      console.error("Dashboard students error:", studentsError);
      setMessage("Could not load class dashboard.");
      return;
    }

    const studentIds =
      (students || []).map(s => s.id);

    if (studentIds.length === 0) {
      setClassDashboard([]);
      setShowClassDashboard(true);
      return;
    }

    const { data: answers, error: answersError } = await supabase
      .from("answers")
      .select("*")
      .eq("teacher_id", teacherId)
      .in("student_id", studentIds)
      .order("answered_at", { ascending: true });

    if (answersError) {
      console.error("Dashboard answers error:", answersError);
    }


    const { data: masteryRows, error: masteryError } = await supabase
      .from("mastery")
      .select("*")
      .eq("teacher_id", teacherId)
      .in("student_id", studentIds)
      .order("updated_at", { ascending: true });

    if (masteryError) {
      console.error("Dashboard mastery error:", masteryError);
    }

    const rows =
      (students || []).map(student => {
        const studentAnswers =
          (answers || []).filter(a =>
            a.student_id === student.id
          );

        const studentMastery =
          (masteryRows || []).filter(m =>
            m.student_id === student.id
          );

        const correct =
          studentAnswers.filter(a => a.is_correct).length;

        const accuracy =
          studentAnswers.length === 0
            ? 0
            : Math.round((correct / studentAnswers.length) * 100);

        const mastered =
          studentMastery.filter(m => m.mastered);

        const masteredIds =
          new Set(mastered.map(m => m.skill_id));

        const firstUnmastered =
          skillTree.find(stage =>
            !masteredIds.has(stage.id)
          );

        const lastAnswer =
          studentAnswers[studentAnswers.length - 1];

        return {
          id: student.id,
          name: student.name,
          answered: studentAnswers.length,
          correct,
          accuracy,
          masteredCount: mastered.length,
          currentSkill: firstUnmastered?.label || "Completed",
          lastActive: lastAnswer?.answered_at || "No activity yet"
        };
      });

    setClassDashboard(rows);
    setShowClassDashboard(true);
  }

  async function deleteStudent(selectedStudentId, selectedStudentName = "this student") {
    if (!teacherId || !selectedStudentId) return;

    const confirmed = window.confirm(
      `Delete ${selectedStudentName}? This removes the student and their assessment records.`
    );

    if (!confirmed) return;

    const { error: answersError } = await supabase
      .from("answers")
      .delete()
      .eq("teacher_id", teacherId)
      .eq("student_id", selectedStudentId);

    const { error: masteryError } = await supabase
      .from("mastery")
      .delete()
      .eq("teacher_id", teacherId)
      .eq("student_id", selectedStudentId);

    const { error: itemMasteryError } = await supabase
      .from("item_mastery")
      .delete()
      .eq("teacher_id", teacherId)
      .eq("student_id", selectedStudentId);

    const { error: studentError } = await supabase
      .from("students")
      .delete()
      .eq("teacher_id", teacherId)
      .eq("id", selectedStudentId);

    const blockingItemMasteryError =
      itemMasteryError && !isMissingItemMasteryTableError(itemMasteryError);

    if (answersError || masteryError || blockingItemMasteryError || studentError) {
      console.error("Delete student error:", answersError || masteryError || blockingItemMasteryError || studentError);
      setMessage("Could not delete student.");
      return;
    }

    if (studentId === selectedStudentId) {
      setStudentId(null);
      setStudentName("");
      setNameSaved(false);
      setAnswerHistory([]);
      setItemMastery({});
      setChildLearningEvidence(buildChildLearningEvidence());
      setItemSessionSeen({});
      setMastery({});
      setRoundAnswers([]);
      setCurrentQuestion(null);
      setFeedback(null);
      setAppView("select");
    }

    await loadStudents(selectedClassId);
    await loadClassDashboard(selectedClassId);
    setMessage(`Deleted ${selectedStudentName}.`);
  }

  async function deleteClass(classId = selectedClassId) {
    if (!teacherId || !classId) return;

    const className =
      classList.find(cls => cls.id === classId)?.name || "this class";

    const confirmed = window.confirm(
      `Delete ${className}? This removes the class, students, answers, and mastery records.`
    );

    if (!confirmed) return;

    const { data: students, error: studentsError } = await supabase
      .from("students")
      .select("id")
      .eq("teacher_id", teacherId)
      .eq("class_id", classId);

    if (studentsError) {
      console.error("Delete class student lookup error:", studentsError);
      setMessage("Could not delete class.");
      return;
    }

    const studentIds =
      (students || []).map(student => student.id);

    if (studentIds.length > 0) {
      const { error: answersError } = await supabase
        .from("answers")
        .delete()
        .eq("teacher_id", teacherId)
        .in("student_id", studentIds);

      const { error: masteryError } = await supabase
        .from("mastery")
        .delete()
        .eq("teacher_id", teacherId)
        .in("student_id", studentIds);

      const { error: itemMasteryError } = await supabase
        .from("item_mastery")
        .delete()
        .eq("teacher_id", teacherId)
        .in("student_id", studentIds);

      const blockingItemMasteryError =
        itemMasteryError && !isMissingItemMasteryTableError(itemMasteryError);

      if (answersError || masteryError || blockingItemMasteryError) {
        console.error("Delete class data error:", answersError || masteryError || blockingItemMasteryError);
        setMessage("Could not delete class data.");
        return;
      }
    }

    const { error: deleteStudentsError } = await supabase
      .from("students")
      .delete()
      .eq("teacher_id", teacherId)
      .eq("class_id", classId);

    const { error: deleteClassError } = await supabase
      .from("classes")
      .delete()
      .eq("teacher_id", teacherId)
      .eq("id", classId);

    if (deleteStudentsError || deleteClassError) {
      console.error("Delete class error:", deleteStudentsError || deleteClassError);
      setMessage("Could not delete class.");
      return;
    }

    if (selectedClassId === classId) {
      setSelectedClassId(null);
      setStudentList([]);
      setClassDashboard([]);
      setShowClassDashboard(false);
    }

    if (studentId && studentIds.includes(studentId)) {
      setStudentId(null);
      setStudentName("");
      setNameSaved(false);
      setAnswerHistory([]);
      setItemMastery({});
      setChildLearningEvidence(buildChildLearningEvidence());
      setItemSessionSeen({});
      setMastery({});
      setRoundAnswers([]);
      setCurrentQuestion(null);
      setFeedback(null);
      setAppView("select");
    }

    await loadClasses();
    setMessage(`Deleted ${className}.`);
  }

  function resetCurrentStudentLocalProgress({ clearFormalAssessments = false } = {}) {
    answerInFlightRef.current = false;
    setCurrentSkillIndex(0);
    setRoundAnswers([]);
    setRoundItemKeys([]);
    setRoundQuestionIds([]);
    setUsedByStage({});
    setMastery({});
    setCurrentQuestion(null);
    setFeedback(null);
    setCheckpointDecision(null);
    setShowReport(false);
    setAssessmentMode("mastery");
    setTotalAnswered(0);
    setCorrectAnswered(0);
    setAnswerHistory([]);
    setItemMastery({});
    setItemSessionSeen({});
    setChildLearningEvidence(buildChildLearningEvidence());

    if (clearFormalAssessments) {
      setLetterIndex(0);
      setLetterAssessment([]);
      setPatternIndex(0);
      setPatternAssessment([]);
      setPatternAttempt(0);
    }
  }

  async function deleteStudentProgressRows(tableName, selectedStudentId) {
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq("teacher_id", teacherId)
      .eq("student_id", selectedStudentId);

    if (error && !isMissingTableError(error, tableName)) return error;
    return null;
  }

  async function resetSelectedStudentProgress({ includeFormalAssessments = false } = {}) {
    if (!teacherId || !studentId) {
      setMessage("Select a student before resetting progress.");
      return;
    }

    setResettingProgress(true);

    const errors = [];

    for (const tableName of ["answers", "mastery", "item_mastery"]) {
      const error = await deleteStudentProgressRows(tableName, studentId);
      if (error) errors.push(error);
    }

    setResettingProgress(false);

    if (errors.length > 0) {
      console.error("Reset student progress error:", errors[0]);
      setMessage("Could not reset this student's progress.");
      return;
    }

    resetCurrentStudentLocalProgress({ clearFormalAssessments: includeFormalAssessments });
    setResetProgressDialogOpen(false);
    setAppView("overview");
    setMessage(
      includeFormalAssessments
        ? "Student progress and local EL assessment results were reset."
        : "Adaptive assessment progress was reset. Formal EL assessment results were kept."
    );

    await loadStudents(selectedClassId);
    await loadClassDashboard(selectedClassId);
  }


  async function loadStudentProgress(selectedStudentId, selectedStudentName) {
    answerInFlightRef.current = false;
    setStudentId(selectedStudentId);
    setStudentName(selectedStudentName);
    setNameSaved(true);
    setAppView("overview");
    setCheckpointDecision(null);

    const { data: answerRows, error: answerError } = await supabase
      .from("answers")
      .select("*")
      .eq("teacher_id", teacherId)
      .eq("student_id", selectedStudentId)
      .order("answered_at", { ascending: true });

    if (answerError) {
      console.error("Load answers error:", answerError);
    }

    const rebuiltHistory =
      (answerRows || []).map(row => {
        const baseRecord = {
          date: row.answered_at,
          skill: row.skill,
          stage: row.stage,
          diagnosticTarget: row.diagnostic_target,
          question: row.question,
          passage: row.passage || "",
          chosen: row.chosen_answer,
          correct: row.correct_answer,
          isCorrect: row.is_correct
        };

        const matchedQuestion = findQuestionForAnswerRecord(baseRecord);

        return {
          ...baseRecord,
          questionId: matchedQuestion?.id || "",
          questionSignature: matchedQuestion
            ? getRuntimeQuestionSignature(matchedQuestion)
            : getAnswerRecordSignature(baseRecord),
          promptAnswerSignature: getAnswerRecordPromptAnswerSignature(baseRecord),
          optionSetSignature: matchedQuestion ? getRepeatOptionSetSignature(matchedQuestion) : "",
          targetWord: matchedQuestion ? getQuestionTargetWord(matchedQuestion) : ""
        };
      });

    setAnswerHistory(rebuiltHistory);
    setTotalAnswered(rebuiltHistory.length);
    setCorrectAnswered(rebuiltHistory.filter(x => x.isCorrect).length);

    const { data: itemMasteryRows, error: itemMasteryError } = await supabase
      .from("item_mastery")
      .select("*")
      .eq("teacher_id", teacherId)
      .eq("student_id", selectedStudentId)
      .order("updated_at", { ascending: true });

    if (itemMasteryError && !isMissingItemMasteryTableError(itemMasteryError)) {
      console.error("Load item mastery error:", itemMasteryError);
    }

    const { data: childAnswerRows, error: childAnswerError } = await supabase
      .from("child_mode_answers")
      .select("*")
      .eq("teacher_id", teacherId)
      .eq("student_id", selectedStudentId)
      .order("answered_at", { ascending: true });

    const childAnswersTableMissing = isMissingChildModeAnswersTableError(childAnswerError);

    if (childAnswerError && !childAnswersTableMissing) {
      console.error("Load child mode answers error:", childAnswerError);
    }

    setChildLearningEvidence(
      buildChildLearningEvidence(childAnswerRows || [], itemMasteryRows || [], childAnswersTableMissing)
    );
    setGuidedReadingRecords(loadGuidedReadingRecords(selectedStudentId));

    const rebuiltItemMastery = {};

    (itemMasteryRows || []).forEach(row => {
      const key = getItemMasteryStateKey(row.item_key, row.item_type);
      rebuiltItemMastery[key] = normalizeItemMasteryRow(row);
    });

    setItemMastery(rebuiltItemMastery);
    setItemSessionSeen({});

    const { data: masteryRows, error: masteryError } = await supabase
      .from("mastery")
      .select("*")
      .eq("teacher_id", teacherId)
      .eq("student_id", selectedStudentId)
      .order("updated_at", { ascending: true });

    if (masteryError) {
      console.error("Load mastery error:", masteryError);
    }

    const rebuiltMastery = {};

    (masteryRows || []).forEach(row => {
      rebuiltMastery[row.skill_id] = {
        attempts: row.attempts || 1,
        mastered: row.mastered || false,
        lastScore: row.last_score,
        lastTotal: row.last_total
      };
    });

    setMastery(rebuiltMastery);

    const firstUnmastered =
      skillTree.findIndex(stage =>
        !rebuiltMastery[stage.id]?.mastered
      );

    setCurrentSkillIndex(firstUnmastered === -1 ? skillTree.length - 1 : firstUnmastered);
    setRoundAnswers([]);
    setCurrentQuestion(null);
    setFeedback(null);
    setMessage(`Loaded ${selectedStudentName}.`);
  }


  async function saveStudentName() {
    const clean = studentName.trim();
    if (!clean) return;

    if (!teacherId) {
      setMessage("Please log in first.");
      return;
    }

    if (!studentId) {
      if (!selectedClassId) {
        setMessage("Please select or create a class first.");
        return;
      }

      const { data, error } = await supabase
        .from("students")
        .insert({
          name: clean,
          class_id: selectedClassId,
          teacher_id: teacherId
        })
        .select()
        .single();

      if (error) {
        console.error("Supabase student save error:", error);
        setMessage("Student saved locally, but cloud save failed.");
        return;
      }

      resetCurrentStudentLocalProgress({ clearFormalAssessments: true });
      setStudentId(data.id);
      setStudentName(data.name || clean);
      setGuidedReadingRecords({});
      setNameSaved(true);
      setCurrentSkillIndex(0);
      setAppView("overview");
      await loadStudents(selectedClassId);
      setMessage(`Student created and selected: ${data.name || clean}`);
      return;
    }

    setStudentName(clean);
    setNameSaved(true);
  }

  function getAvailableStageQuestions(stageIndex) {
    const stage = skillTree[stageIndex];
    if (!stage) return [];

    const stageQuestions = allQuestions.filter(q => getStageIndex(q) === stageIndex);
    const currentProfile = getRoundDuplicateProfile();
    const anyMemory = getStageRepeatMemory(stage.label);
    const correctMemory = getCorrectStageRepeatMemory(stage.label);
    const recentMemory = getRecentStageRepeatMemory(stage.label);
    const filterCurrentRoundRepeats = question => {
      const flags = getRoundDuplicateFlags(question, currentProfile);
      return !flags.questionId && !flags.signature;
    };
    const outsideCurrentRound = stageQuestions.filter(filterCurrentRoundRepeats);
    const globalUnseenExact = stageQuestions.filter(question =>
      !wasQuestionSeen(question, anyMemory)
    );
    const unseenExact = outsideCurrentRound.filter(question =>
      !wasQuestionSeen(question, anyMemory)
    );
    const noCorrectTargetWord = unseenExact.filter(question => {
      const target = getQuestionTargetWord(question);
      return !target || !correctMemory.targetWords.has(target);
    });
    const noRecentTargetWord = noCorrectTargetWord.filter(question => {
      const target = getQuestionTargetWord(question);
      const optionSet = getRepeatOptionSetSignature(question);
      const promptAnswer = getRuntimeQuestionPromptAnswerSignature(question);
      return (!target || !recentMemory.targetWords.has(target)) &&
        (!optionSet || !recentMemory.optionSets.has(optionSet)) &&
        (!promptAnswer || !recentMemory.promptAnswers.has(promptAnswer));
    });

    if (noRecentTargetWord.length > 0) return noRecentTargetWord;
    if (noCorrectTargetWord.length > 0) return noCorrectTargetWord;
    if (unseenExact.length > 0) return unseenExact;
    if (globalUnseenExact.length > 0) return [];

    const incorrectOnly = outsideCurrentRound.filter(question =>
      wasQuestionAnsweredIncorrectly(question, stage.label) &&
      !wasQuestionAnsweredCorrectly(question, correctMemory)
    );

    if (incorrectOnly.length > 0) return incorrectOnly;

    return getOldestReusableCorrectQuestions(outsideCurrentRound, stage.label);
  }

  function getAttemptedStageLabels() {
    return new Set(
      answerHistory
        .map(record => record.stage)
        .filter(Boolean)
    );
  }

  function getReviewQuestionPool() {
    const attemptedStageLabels =
      getAttemptedStageLabels();

    if (attemptedStageLabels.size === 0) return [];

    const allowedStageLabels =
      new Set(
        skillTree
          .slice(0, currentSkillIndex + 1)
          .map(stage => stage.label)
          .filter(label => attemptedStageLabels.has(label))
      );

    if (allowedStageLabels.size === 0) return [];

    const usedQuestionIds =
      new Set(Object.values(usedByStage).flat());

    for (const weakness of weaknessSnapshot.needsPractice) {
      if (!allowedStageLabels.has(weakness.stage)) continue;

      const correctMemory = getCorrectStageRepeatMemory(weakness.stage);

      const matches =
        allQuestions.filter(question => {
          const stageIndex = getStageIndex(question);
          const stage = skillTree[stageIndex];

          return (
            stage &&
            allowedStageLabels.has(stage.label) &&
            getDiagnosticTarget(question) === weakness.target &&
            !usedQuestionIds.has(question.id) &&
            !wasQuestionAnsweredCorrectly(question, correctMemory)
          );
        });

      if (matches.length > 0) {
        return shuffleArray(matches);
      }
    }

    return [];
  }

  function inferAnswerRecordMetadata(record) {
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

  function getRecentStageItemKeys(stageLabel, limit = ROUND_LENGTH * 3) {
    return answerHistory
      .filter(record => record.stage === stageLabel)
      .slice(-limit)
      .map(inferAnswerRecordMetadata)
      .filter(metadata => metadata?.itemKey && metadata?.itemType)
      .map(metadata => getItemMasteryStateKey(metadata.itemKey, metadata.itemType));
  }

  function getAnyStageItemKeys(stageLabel) {
    return new Set(
      answerHistory
        .filter(record => record.stage === stageLabel)
        .map(inferAnswerRecordMetadata)
        .filter(metadata => metadata?.itemKey && metadata?.itemType)
        .map(metadata => getItemMasteryStateKey(metadata.itemKey, metadata.itemType))
    );
  }

  function getRecentStageQuestionIds(stageLabel, limit = ROUND_LENGTH * 3) {
    return answerHistory
      .filter(record => record.stage === stageLabel)
      .slice(-limit)
      .map(record => record.questionId)
      .filter(Boolean);
  }

  function getStageAnswerRecords(stageLabel) {
    return answerHistory.filter(record => record.stage === stageLabel);
  }

  function getStageRepeatMemory(stageLabel, { correctOnly = false, limit = null } = {}) {
    const records = getStageAnswerRecords(stageLabel)
      .filter(record => !correctOnly || record.isCorrect)
      .slice(limit ? -limit : 0);

    return {
      questionIds: new Set(records.map(record => record.questionId).filter(Boolean)),
      signatures: new Set(records.map(record => record.questionSignature).filter(Boolean)),
      promptAnswers: new Set(records.map(record =>
        record.promptAnswerSignature || getAnswerRecordPromptAnswerSignature(record)
      ).filter(Boolean)),
      optionSets: new Set(records.map(record => record.optionSetSignature).filter(Boolean)),
      targetWords: new Set(records.map(record => record.targetWord).filter(Boolean))
    };
  }

  function getCorrectStageRepeatMemory(stageLabel) {
    return getStageRepeatMemory(stageLabel, { correctOnly: true });
  }

  function getRecentStageRepeatMemory(stageLabel) {
    return getStageRepeatMemory(stageLabel, { limit: ROUND_LENGTH * 3 });
  }

  function wasQuestionAnsweredCorrectly(question, memory = getCorrectStageRepeatMemory(skillTree[getStageIndex(question)]?.label)) {
    const questionId = question.id || "";
    const signature = getRuntimeQuestionSignature(question);

    return Boolean(
      (questionId && memory.questionIds.has(questionId)) ||
      (signature && memory.signatures.has(signature))
    );
  }

  function wasQuestionSeen(question, memory = getStageRepeatMemory(skillTree[getStageIndex(question)]?.label)) {
    const questionId = question.id || "";
    const signature = getRuntimeQuestionSignature(question);

    return Boolean(
      (questionId && memory.questionIds.has(questionId)) ||
      (signature && memory.signatures.has(signature))
    );
  }

  function wasQuestionAnsweredIncorrectly(question, stageLabel) {
    const questionId = question.id || "";
    const signature = getRuntimeQuestionSignature(question);

    return getStageAnswerRecords(stageLabel).some(record =>
      !record.isCorrect &&
      (
        (questionId && record.questionId === questionId) ||
        (signature && record.questionSignature === signature)
      )
    );
  }

  function getOldestReusableCorrectQuestions(questions, stageLabel) {
    const correctRecords = getStageAnswerRecords(stageLabel)
      .filter(record => record.isCorrect)
      .map((record, index) => ({
        record,
        index,
        promptAnswer: record.promptAnswerSignature || getAnswerRecordPromptAnswerSignature(record)
      }));
    const ageByPromptAnswer = new Map();
    const ageByQuestionId = new Map();
    const ageBySignature = new Map();

    correctRecords.forEach(({ record, index, promptAnswer }) => {
      if (record.questionId && !ageByQuestionId.has(record.questionId)) ageByQuestionId.set(record.questionId, index);
      if (record.questionSignature && !ageBySignature.has(record.questionSignature)) ageBySignature.set(record.questionSignature, index);
      if (promptAnswer && !ageByPromptAnswer.has(promptAnswer)) ageByPromptAnswer.set(promptAnswer, index);
    });

    return [...questions].sort((a, b) => {
      const ageA =
        ageByQuestionId.get(a.id) ??
        ageBySignature.get(getRuntimeQuestionSignature(a)) ??
        ageByPromptAnswer.get(getRuntimeQuestionPromptAnswerSignature(a)) ??
        Number.MAX_SAFE_INTEGER;
      const ageB =
        ageByQuestionId.get(b.id) ??
        ageBySignature.get(getRuntimeQuestionSignature(b)) ??
        ageByPromptAnswer.get(getRuntimeQuestionPromptAnswerSignature(b)) ??
        Number.MAX_SAFE_INTEGER;

      return ageA - ageB;
    });
  }

  function getQuestionSelectionRank(question, activeStage) {
    const metadata = inferItemMetadata(question);
    if (!metadata?.itemKey || !metadata?.itemType) return 6;

    const key = getItemMasteryStateKey(metadata.itemKey, metadata.itemType);
    const row = itemMastery[key];
    const currentRoundKeys = new Set(roundItemKeys);
    const currentRoundQuestionIds = new Set(roundQuestionIds);
    const currentRoundTargetWords = new Set(
      roundQuestionIds
        .map(id => allQuestions.find(item => item.id === id))
        .filter(Boolean)
        .map(getQuestionTargetWord)
        .filter(Boolean)
    );
    const recentKeys = new Set(getRecentStageItemKeys(activeStage.label));
    const allAttemptedKeys = getAnyStageItemKeys(activeStage.label);
    const recentQuestionIds = new Set(getRecentStageQuestionIds(activeStage.label));

    if (currentRoundKeys.has(key)) return 5;
    if (currentRoundQuestionIds.has(question.id) || recentQuestionIds.has(question.id)) return 5;
    if (getQuestionTargetWord(question) && currentRoundTargetWords.has(getQuestionTargetWord(question))) return 4;
    if (!row && !allAttemptedKeys.has(key)) return 0;
    if (row && !row.mastered && row.correct === 0) return 1;
    if (row && !row.mastered) return 2;
    if (recentKeys.has(key)) return 4;

    return row?.mastered || row?.correct > 0 ? 5 : 3;
  }

  function getCurrentRoundQuestionObjects() {
    return roundQuestionIds
      .map(id => allQuestions.find(item => item.id === id))
      .filter(Boolean);
  }

  function getQuestionRoundSignature(question) {
    return getRuntimeQuestionSignature(question);
  }

  function getRoundDuplicateProfile() {
    const currentRoundQuestions = getCurrentRoundQuestionObjects();

    return {
      questionIds: new Set(roundQuestionIds.filter(Boolean)),
      targetWords: new Set(currentRoundQuestions.map(getQuestionTargetWord).filter(Boolean)),
      itemKeys: new Set(roundItemKeys.filter(Boolean)),
      correctAnswers: new Set(currentRoundQuestions.map(getQuestionAnswer).map(normalizeItemKey).filter(Boolean)),
      promptAnswers: new Set(currentRoundQuestions.map(getRuntimeQuestionPromptAnswerSignature).filter(Boolean)),
      optionSets: new Set(currentRoundQuestions.map(getRepeatOptionSetSignature).filter(Boolean)),
      signatures: new Set(currentRoundQuestions.map(getRuntimeQuestionSignature).filter(Boolean))
    };
  }

  function getRoundDuplicateFlags(question, profile = getRoundDuplicateProfile()) {
    const metadata = inferItemMetadata(question);
    const itemStateKey = metadata?.itemKey && metadata?.itemType
      ? getItemMasteryStateKey(metadata.itemKey, metadata.itemType)
      : "";
    const target = getQuestionTargetWord(question);
    const correct = normalizeItemKey(getQuestionAnswer(question));
    const promptAnswer = getRuntimeQuestionPromptAnswerSignature(question);
    const optionSet = getRepeatOptionSetSignature(question);
    const signature = getRuntimeQuestionSignature(question);

    return {
      questionId: Boolean(question.id && profile.questionIds.has(question.id)),
      targetWord: Boolean(target && profile.targetWords.has(target)),
      itemKey: Boolean(itemStateKey && profile.itemKeys.has(itemStateKey)),
      correctAnswer: Boolean(correct && profile.correctAnswers.has(correct)),
      promptAnswer: Boolean(promptAnswer && profile.promptAnswers.has(promptAnswer)),
      optionSet: Boolean(optionSet && profile.optionSets.has(optionSet)),
      signature: Boolean(signature && profile.signatures.has(signature))
    };
  }

  function selectNonDuplicateRoundCandidate(prioritized, activeStage) {
    const profile = getRoundDuplicateProfile();
    const roundFormatTypes = new Set(
      getCurrentRoundQuestionObjects()
        .map(question => getQuestionFormatMetadata(question).formatType)
    );
    const exactSafe = prioritized.filter(question => {
      const flags = getRoundDuplicateFlags(question, profile);
      return !flags.questionId && !flags.signature;
    });

    if (exactSafe.length === 0) {
      debugAssessmentCoverage("round duplicate guard blocked pool", {
        studentId,
        skill: activeStage.label,
        poolSize: prioritized.length,
        currentRoundQuestionIds: roundQuestionIds,
        currentRoundItemKeys: roundItemKeys
      });
      return null;
    }

    const strict = exactSafe.filter(question => {
      const flags = getRoundDuplicateFlags(question, profile);
      return !flags.targetWord && !flags.promptAnswer && !flags.optionSet;
    });
    const relaxPrompt = exactSafe.filter(question => {
      const flags = getRoundDuplicateFlags(question, profile);
      return !flags.targetWord && !flags.optionSet;
    });
    const relaxOptionSet = exactSafe.filter(question => {
      const flags = getRoundDuplicateFlags(question, profile);
      return !flags.targetWord;
    });
    const candidatePool =
      strict.length > 0
        ? strict
        : relaxPrompt.length > 0
          ? relaxPrompt
          : relaxOptionSet.length > 0
            ? relaxOptionSet
            : exactSafe;
    const duplicateRelaxation =
      strict.length > 0
        ? "none"
        : relaxPrompt.length > 0
          ? "prompt-answer"
          : relaxOptionSet.length > 0
            ? "option-set"
            : "target-word";

    const picked =
      candidatePool.find(question => !roundFormatTypes.has(getQuestionFormatMetadata(question).formatType)) ||
      candidatePool[0];

    debugAssessmentCoverage("round duplicate guard", {
      studentId,
      skill: activeStage.label,
      poolSize: prioritized.length,
      exactSafeCandidates: exactSafe.length,
      strictCandidates: strict.length,
      duplicateRelaxation,
      selectedQuestionId: picked?.id || "",
      selectedTargetWord: picked ? getQuestionTargetWord(picked) : "",
      selectedItemKey: picked ? getQuestionItemKey(picked) : "",
      selectedSignature: picked ? getRuntimeQuestionSignature(picked) : "",
      duplicateFlags: picked ? getRoundDuplicateFlags(picked, profile) : {}
    });

    return picked;
  }

  function prioritizeCoverageQuestions(questions, activeStage) {
    const grouped = questions.reduce((groups, question) => {
      const rank = getQuestionSelectionRank(question, activeStage);
      groups[rank] = [...(groups[rank] || []), question];
      return groups;
    }, {});

    return Object.keys(grouped)
      .map(Number)
      .sort((a, b) => a - b)
      .flatMap(rank => shuffleArray(grouped[rank]));
  }

  function getQuestionItemKey(question) {
    const metadata = inferItemMetadata(question);
    return metadata?.itemKey && metadata?.itemType
      ? getItemMasteryStateKey(metadata.itemKey, metadata.itemType)
      : "";
  }

  function prepareQuestion(question, isTargetedReview = false) {
    const preparedChoices = Array.isArray(question.choices)
      ? (isPairSelectionQuestion(question) ? question.choices : shuffleArray(question.choices))
      : question.choices;
    const preparedAnswerOptions = Array.isArray(question.answerOptions)
      ? shuffleArray(question.answerOptions)
      : question.answerOptions;
    const preparedCards = Array.isArray(question.imageCards)
      ? shuffleArray(question.imageCards)
      : question.imageCards;
    const preparedSoundTiles = Array.isArray(question.soundTiles)
      ? shuffleArray(question.soundTiles)
      : question.soundTiles;

    return {
      ...question,
      isTargetedReview,
      choices: preparedChoices,
      answerOptions: preparedAnswerOptions,
      imageCards: preparedCards,
      soundTiles: preparedSoundTiles
    };
  }

  function pickQuestion(mode = assessmentMode, answeredCount = roundAnswers.length, stageIndexOverride = currentSkillIndex) {
    answerInFlightRef.current = false;
    setMessage("");
    setShowConfetti(false);
    setShowReport(false);
    setCheckpointDecision(null);

    if (mode === "targetedReview") {
      const reviewPool =
        getReviewQuestionPool();

      if (reviewPool.length === 0) {
        setMessage("No targeted review questions are available yet. Complete more mastery questions first.");
        return;
      }

      setCurrentQuestion(prepareQuestion(reviewPool[0], true));
      return;
    }

    const activeStageIndex = stageIndexOverride;
    const activeStage = skillTree[activeStageIndex] || currentStage;
    const available = getAvailableStageQuestions(activeStageIndex);

    if (available.length === 0) {
      setMessage(`No questions found for ${activeStage.label}.`);
      return;
    }

    const shouldInjectReview =
      mode === "mastery" &&
      answeredCount > 0 &&
      (answeredCount + 1) % 5 === 0;

    if (shouldInjectReview) {
      const reviewPool =
        getReviewQuestionPool();

      if (reviewPool.length > 0) {
        setCurrentQuestion(prepareQuestion(reviewPool[0], true));
        return;
      }
    }

    const keysAlreadyInRound =
      new Set(roundItemKeys);

    const unusedItemKeys =
      available.filter(question => {
        const key = getQuestionItemKey(question);
        return !key || !keysAlreadyInRound.has(key);
      });

    const pool =
      unusedItemKeys.length > 0
        ? unusedItemKeys
        : available;

    const prioritized = prioritizeCoverageQuestions(pool, activeStage);
    const picked = selectNonDuplicateRoundCandidate(prioritized, activeStage);

    if (!picked) {
      setCurrentQuestion(null);
      setMessage(
        `No unrepeated questions remain for ${activeStage.label} in this round. Add more validated questions/assets before continuing this skill.`
      );
      answerInFlightRef.current = false;
      return;
    }

    debugAssessmentCoverage("question selection", {
      studentId,
      skill: activeStage.label,
      selectedItemKeys: prioritized.slice(0, ROUND_LENGTH).map(getQuestionItemKey).filter(Boolean),
      selectedQuestionIds: prioritized.slice(0, ROUND_LENGTH).map(question => question.id),
      selectedSignatures: prioritized.slice(0, ROUND_LENGTH).map(getRuntimeQuestionSignature),
      currentRoundItemKeys: roundItemKeys,
      recentItemKeys: getRecentStageItemKeys(activeStage.label)
    });

    setCurrentQuestion(prepareQuestion(picked));
  }


  function getItemMasteryStateKey(itemKey, itemType) {
    return normalizeItemKey(itemType) + "::" + normalizeItemKey(itemKey);
  }

  function normalizeItemMasteryRow(row) {
    return {
      itemKey: normalizeItemKey(row.item_key),
      itemType: row.item_type,
      skillId: row.skillId || row.skill_id || "",
      targetSkill: row.targetSkill || row.target_skill || "",
      targetWord: row.targetWord || row.target_word || "",
      targetSound: row.targetSound || row.target_sound || "",
      targetPattern: row.targetPattern || row.target_pattern || "",
      source: row.source || "assessment",
      attempts: Number(row.attempts || 0),
      correct: Number(row.correct || 0),
      lastSeen: row.last_seen || null,
      lastResult: Boolean(row.last_result),
      sessionsSeen: Number(row.sessions_seen || 0),
      mastered: Boolean(row.mastered),
      formatTypes: row.formatTypes || [],
      hadPTDExposure: Boolean(row.hadPTDExposure),
      crossPatternExposure: Boolean(row.crossPatternExposure),
      phonicsPositions: row.phonicsPositions || [],
      masteryBlockers: row.masteryBlockers || [],
      updatedAt: row.updated_at || null
    };
  }

  function nextItemMasteryRow(previous, metadata, isCorrect, isNewSessionSeen, formatMetadata, source = {}) {
    const attempts = (previous?.attempts || 0) + 1;
    const correct = (previous?.correct || 0) + (isCorrect ? 1 : 0);
    const sessionsSeen = (previous?.sessionsSeen || 0) + (isNewSessionSeen ? 1 : 0);
    const formatTypes = Array.from(new Set([
      ...(previous?.formatTypes || []),
      formatMetadata.formatType
    ].filter(Boolean)));
    const phonicsPositions = Array.from(new Set([
      ...(previous?.phonicsPositions || []),
      formatMetadata.phonicsPosition
    ].filter(position => position && position !== "unknown")));
    const evidence = {
      formatTypes,
      phonicsPositions,
      hadPTDExposure: Boolean(previous?.hadPTDExposure || formatMetadata.hadPTD),
      crossPatternExposure: Boolean(previous?.crossPatternExposure || formatMetadata.crossPatternGroup || formatMetadata.formatType === "CPS")
    };
    const eligibility = isMasteryEligible(evidence, metadata.itemType, metadata.itemKey);
    const baseMastered = attempts >= 4 && correct >= 3 && isCorrect && sessionsSeen >= 2;
    const isAssessmentEvidence = (source.source || "assessment") === "assessment";
    const mastered = Boolean(
      previous?.mastered ||
      (isAssessmentEvidence && isCorrect) ||
      (baseMastered && eligibility.eligible)
    );
    const stageIndex = getStageIndex(source);
    const stage = skillTree[stageIndex];

    return {
      itemKey: metadata.itemKey,
      itemType: metadata.itemType,
      skillId: stage?.id || source.skillId || "",
      targetSkill: source.targetSkill || source.skill || stage?.label || "",
      targetWord: metadata.itemType.includes("word") ? metadata.itemKey : "",
      targetSound: metadata.itemType.includes("sound") || metadata.itemType === "short_vowel" ? metadata.itemKey : "",
      targetPattern: metadata.itemType.includes("pattern") ? metadata.itemKey : "",
      source: source.source || "assessment",
      attempts,
      correct,
      lastSeen: new Date().toISOString(),
      lastResult: isCorrect,
      sessionsSeen,
      mastered,
      formatTypes,
      hadPTDExposure: evidence.hadPTDExposure,
      crossPatternExposure: evidence.crossPatternExposure,
      phonicsPositions,
      masteryBlockers: eligibility.blockers
    };
  }

  async function saveItemMasteryToSupabase(row) {
    if (!studentId || !teacherId || !row?.itemKey || !row?.itemType) return;

    const { error } = await supabase
      .from("item_mastery")
      .upsert(
        {
          student_id: studentId,
          teacher_id: teacherId,
          item_key: row.itemKey,
          item_type: row.itemType,
          attempts: row.attempts,
          correct: row.correct,
          last_seen: row.lastSeen,
          last_result: row.lastResult,
          sessions_seen: row.sessionsSeen,
          mastered: row.mastered,
          updated_at: new Date().toISOString()
        },
        { onConflict: "teacher_id,student_id,item_key,item_type" }
      );

    if (error && !isMissingItemMasteryTableError(error)) {
      console.error("Supabase item mastery save error:", error);
    }

    debugAssessmentCoverage("item_mastery upsert result", {
      studentId,
      teacherId,
      itemType: row.itemType,
      itemKey: row.itemKey,
      attempts: row.attempts,
      correct: row.correct,
      mastered: row.mastered,
      error: error?.message || null
    });

    return { error, row };
  }

  function updateItemMastery(source, isCorrect) {
    const metadata = inferItemMetadata(source);
    if (!metadata?.itemKey || !metadata?.itemType) {
      debugAssessmentCoverage("item_mastery skipped", {
        questionId: source?.id,
        skill: source?.skill,
        reason: "No inferable itemType/itemKey"
      });
      return;
    }

    const formatMetadata = getQuestionFormatMetadata(source);
    const key = getItemMasteryStateKey(metadata.itemKey, metadata.itemType);
    const isNewSessionSeen = !itemSessionSeen[key];

    setItemSessionSeen(prev => ({
      ...prev,
      [key]: true
    }));

    setItemMastery(prev => {
      const nextRow = nextItemMasteryRow(prev[key], metadata, isCorrect, isNewSessionSeen, formatMetadata, source);
      saveItemMasteryToSupabase(nextRow);

      return {
        ...prev,
        [key]: nextRow
      };
    });
  }

  async function saveChildModeAnswerToSupabase(record) {
    if (!studentId || !teacherId || !record?.questionId) return;

    try {
      const { error } = await supabase
        .from("child_mode_answers")
        .insert({
          source: "child_mode",
          student_id: studentId,
          class_id: selectedClassId,
          teacher_id: teacherId,
          question_id: record.questionId,
          target_word: record.targetWord,
          item_key: record.itemKey,
          item_type: record.itemType,
          format_type: record.formatType,
          is_correct: record.isCorrect,
          selected_answer: record.selectedAnswer,
          correct_answer: record.correctAnswer,
          answered_at: record.timestamp
        });

      if (error && !isMissingChildModeAnswersTableError(error)) {
        console.warn("Child Mode answer save failed; continuing play.", error);
      }
    } catch (error) {
      console.warn("Child Mode answer save failed; continuing play.", error);
    }
  }

  function recordChildModeAnswer(record) {
    const targetWord = normalizeItemKey(record?.targetWord || record?.correctAnswer || "");
    if (!targetWord) return;

    const timestamp = record.timestamp || new Date().toISOString();
    const itemType = "cvc_word";
    const itemKey = targetWord;
    const formatType = record.formatType || "UNKNOWN";
    const correctAnswer = record.correctAnswer || targetWord;
    const selectedAnswer = record.selectedAnswer || "";
    const isCorrect = Boolean(record.isCorrect);

    const childModeRecord = {
      questionId: record.questionId,
      targetWord,
      itemKey,
      itemType,
      formatType,
      isCorrect,
      selectedAnswer,
      correctAnswer,
      timestamp
    };

    saveChildModeAnswerToSupabase(childModeRecord);

    updateItemMastery(
      {
        id: record.questionId,
        skill: "CVC and Short Vowels",
        question: record.prompt || "Space Hub Phonics Lab",
        prompt: record.prompt || "Space Hub Phonics Lab",
        answer: correctAnswer,
        audioText: record.audioText || targetWord,
        spokenPrompt: record.spokenPrompt || targetWord,
        diagnosticTarget: targetWord,
        itemKey,
        itemType,
        formatType,
        masteryStage: "child_mode_echo_caves_short_a",
        source: "child_mode"
      },
      isCorrect
    );
  }

  function getItemMasterySnapshot() {
    const trackedItems = allQuestions
      .map(question => inferItemMetadata(question))
      .filter(Boolean)
      .map(metadata => getItemMasteryStateKey(metadata.itemKey, metadata.itemType));

    letterAssessmentOrder.forEach(letter => {
      trackedItems.push(getItemMasteryStateKey(letter, "letter_name"));
      trackedItems.push(getItemMasteryStateKey(letter, "letter_sound"));
    });

    advancedPhonicsPatterns.forEach(pattern => {
      trackedItems.push(getItemMasteryStateKey(pattern.pattern, "phonics_pattern"));
      pattern.examples.forEach(example => {
        trackedItems.push(getItemMasteryStateKey(example, "phonics_pattern_word"));
      });
    });

    const trackedUnique = new Set(trackedItems);
    const rows = Object.values(itemMastery || {});
    const ranked = rows
      .filter(row => row.itemKey && row.itemType)
      .sort((a, b) =>
        Number(b.mastered) - Number(a.mastered) ||
        b.attempts - a.attempts ||
        a.itemType.localeCompare(b.itemType) ||
        a.itemKey.localeCompare(b.itemKey)
      );

    return {
      mastered: ranked.filter(row => row.mastered).slice(0, 12),
      attempting: ranked.filter(row => !row.mastered).slice(0, 12),
      evidence: ranked.slice(0, 16),
      unseenCount: Math.max(0, trackedUnique.size - rows.length),
      trackedCount: trackedUnique.size
    };
  }

  async function saveAnswerToSupabase(record) {
    if (!studentId || !teacherId) return;

    const { error } = await supabase
      .from("answers")
      .insert({
        student_id: studentId,
        teacher_id: teacherId,
        skill: record.skill,
        stage: record.stage,
        diagnostic_target: record.diagnosticTarget,
        question: record.question,
        passage: record.passage,
        chosen_answer: record.chosen,
        correct_answer: record.correct,
        is_correct: record.isCorrect
      });

    if (error) {
      console.error("Supabase answer save error:", error);
    }
  }

  async function saveMasteryToSupabase(stage, score, total, mastered) {
    if (!studentId || !teacherId) return;

    const { error } = await supabase
      .from("mastery")
      .insert({
        student_id: studentId,
        teacher_id: teacherId,
        skill_id: stage.id,
        skill_label: stage.label,
        mastered,
        attempts: 1,
        last_score: score,
        last_total: total
      });

    if (error) {
      console.error("Supabase mastery save error:", error);
    }
  }

  function formatCoverageKeyLabel(key) {
    const [, itemKey = key] = String(key).split("::");
    return itemKey;
  }

  function buildCheckpointDecision(stage, stageIndex, nextRound, nextRoundItemKeys, passed) {
    const expectedKeys = Array.from(getCoverageItemKeysForStage(stage));
    const expectedKeySet = new Set(expectedKeys);
    const alreadyCoveredKeys = new Set(
      Object.values(itemMastery || {})
        .filter(row => row?.itemKey && row?.itemType && (row.mastered || row.correct > 0))
        .map(row => getItemMasteryStateKey(row.itemKey, row.itemType))
        .filter(key => expectedKeySet.has(key))
    );
    const coveredKeys = new Set(alreadyCoveredKeys);

    nextRoundItemKeys
      .filter(key => expectedKeySet.has(key))
      .forEach(key => coveredKeys.add(key));

    const configured = configuredCoverageTotals[stage.id];
    const coverageTotal = configured?.total || expectedKeys.length;
    const coverageUnit = configured?.unit || (stage.label.toLowerCase().includes("word") ? "words" : "items");
    const remainingItems = expectedKeys
      .filter(key => !coveredKeys.has(key))
      .map(formatCoverageKeyLabel)
      .slice(0, 40);
    const coveredThisRound = Array.from(new Set(
      nextRoundItemKeys
        .filter(key => expectedKeySet.has(key))
        .map(formatCoverageKeyLabel)
    ));
    const alreadyMastered = Array.from(alreadyCoveredKeys)
      .filter(key => !nextRoundItemKeys.includes(key))
      .map(formatCoverageKeyLabel)
      .slice(0, 40);
    const totalCoveredItems = Array.from(coveredKeys)
      .map(formatCoverageKeyLabel)
      .slice(0, 60);
    const score = nextRound.filter(Boolean).length;

    return {
      skillId: stage.id,
      skillIndex: stageIndex,
      skillLabel: stage.label,
      correct: score,
      total: ROUND_LENGTH,
      accuracy: Math.round((score / ROUND_LENGTH) * 100),
      passed,
      nextSkillLabel: skillTree[stageIndex + 1]?.label || "",
      coveredThisRound,
      alreadyMastered,
      totalCoveredItems,
      remainingItems,
      coverage: {
        mastered: Math.min(coveredKeys.size, coverageTotal),
        total: coverageTotal,
        unit: coverageUnit
      }
    };
  }


  function answerQuestion(choice) {
    if (!currentQuestion || answerInFlightRef.current) return;
    answerInFlightRef.current = true;

    const correctAnswer = getQuestionAnswer(currentQuestion);
    const submittedAnswer = isFixSentenceQuestion(currentQuestion)
      ? normalizeSentenceAnswer(choice)
      : isPairSelectionQuestion(currentQuestion)
        ? normalizePairSelectionAnswer(choice)
        : choice;
    const isCorrect = isFixSentenceQuestion(currentQuestion)
      ? comparableSentenceAnswer(submittedAnswer) === comparableSentenceAnswer(correctAnswer)
      : isPairSelectionQuestion(currentQuestion)
        ? submittedAnswer === normalizePairSelectionAnswer(correctAnswer)
        : submittedAnswer === correctAnswer;
    const questionStage =
      skillTree[getStageIndex(currentQuestion)] || currentStage;
    const stage = questionStage;
    const nextRound = [...roundAnswers, isCorrect];
    const itemMetadata = inferItemMetadata(currentQuestion);
    const itemStateKey = itemMetadata?.itemKey && itemMetadata?.itemType
      ? getItemMasteryStateKey(itemMetadata.itemKey, itemMetadata.itemType)
      : "";
    const nextRoundItemKeys = itemStateKey
      ? [...roundItemKeys, itemStateKey]
      : [...roundItemKeys];

    setUsedByStage(prev => ({
      ...prev,
      [questionStage.id]: [...(prev[questionStage.id] || []), currentQuestion.id]
    }));

    setRoundQuestionIds(prev => [...prev, currentQuestion.id].filter(Boolean));

    if (itemStateKey) {
      setRoundItemKeys(prev => [...prev, itemStateKey]);
    }

    setTotalAnswered(n => n + 1);

    const answerRecord = {
      questionId: currentQuestion.id,
      questionSignature: getRuntimeQuestionSignature(currentQuestion),
      promptAnswerSignature: getRuntimeQuestionPromptAnswerSignature(currentQuestion),
      optionSetSignature: getRepeatOptionSetSignature(currentQuestion),
      targetWord: getQuestionTargetWord(currentQuestion),
      date: new Date().toLocaleString(),
      skill: currentQuestion.skill,
      stage: questionStage.label,
      question: getQuestionPrompt(currentQuestion),
      passage: currentQuestion.passage || "",
      chosen: submittedAnswer,
      correct: correctAnswer,
      isCorrect,
      diagnosticTarget: getDiagnosticTarget(currentQuestion),
      itemType: itemMetadata?.itemType || "",
      itemKey: itemMetadata?.itemKey || ""
    };

    debugAssessmentCoverage("assessment answer", {
      questionId: currentQuestion.id,
      skill: currentQuestion.skill,
      inferredItemType: itemMetadata?.itemType || "",
      inferredItemKey: itemMetadata?.itemKey || "",
      selectedAnswer: submittedAnswer,
      correctAnswer,
      isCorrect
    });

    setAnswerHistory(prev => [
      ...prev,
      answerRecord
    ]);

    saveAnswerToSupabase(answerRecord);
    updateItemMastery(currentQuestion, isCorrect);

    if (isCorrect) {
      setCorrectAnswered(n => n + 1);
      setShowConfetti(true);
    }

    if (assessmentMode === "targetedReview") {
      if (nextRound.length >= ROUND_LENGTH) {
        setCurrentQuestion(null);
        setFeedback(null);
        setRoundAnswers([]);
        setRoundItemKeys([]);
        setRoundQuestionIds([]);
        setTimeout(() => {
          answerInFlightRef.current = false;
          setAppView("finished");
          setShowReport(true);
        }, 500);
        return;
      } else {
        setRoundAnswers(nextRound);
      }

      setFeedback({
        isCorrect,
        chosen: submittedAnswer,
        correct: correctAnswer,
        skill: currentQuestion.skill,
        explanation: getTeachingTip(currentQuestion, submittedAnswer, isCorrect),
        support: buildFeedbackSupport(currentQuestion, submittedAnswer),
        autoAdvance: isCorrect
      });

      setCurrentQuestion(null);
      if (isCorrect) {
        setTimeout(() => {
          setFeedback(null);
          pickQuestion("targetedReview", nextRound.length);
        }, 750);
      }
      return;
    }

    if (nextRound.length >= ROUND_LENGTH) {
      const score = nextRound.filter(Boolean).length;
      const mastered = score >= PASS_SCORE;

      setMastery(prev => ({
        ...prev,
        [stage.id]: {
          attempts: (prev[stage.id]?.attempts || 0) + 1,
          mastered: mastered || prev[stage.id]?.mastered || false,
          lastScore: score,
          lastTotal: ROUND_LENGTH
        }
      }));

      saveMasteryToSupabase(stage, score, ROUND_LENGTH, mastered);

      setCheckpointDecision(
        buildCheckpointDecision(stage, getStageIndex(currentQuestion), nextRound, nextRoundItemKeys, mastered)
      );
      setRoundAnswers([]);
      setRoundItemKeys([]);
      setRoundQuestionIds([]);
      setCurrentQuestion(null);
      setFeedback(null);
      setAppView("checkpoint");
      answerInFlightRef.current = false;
      return;
    } else {
      setRoundAnswers(nextRound);
    }

    setFeedback({
      isCorrect,
      chosen: submittedAnswer,
      correct: correctAnswer,
      skill: currentQuestion.skill,
      explanation: getTeachingTip(currentQuestion, submittedAnswer, isCorrect),
      support: buildFeedbackSupport(currentQuestion, submittedAnswer),
      autoAdvance: isCorrect
    });

    setCurrentQuestion(null);
    if (isCorrect) {
      setTimeout(() => {
        setFeedback(null);
        pickQuestion("mastery", nextRound.length, getStageIndex(currentQuestion));
      }, 750);
    }
  }

  function buildFeedbackSupport(question, submittedAnswer) {
    if (!isPairSelectionQuestion(question)) return null;

    const chosenWords = normalizePairSelectionAnswer(submittedAnswer)
      .split("|")
      .filter(Boolean);
    const correctWords = question.correctWords || [];
    const cardsByWord = Object.fromEntries(
      (question.imageCards || []).map(card => [card.word, card])
    );
    const wrongWords = chosenWords.filter(word => !correctWords.includes(word));
    const targetSound = question.itemKey || correctWords[0]?.[0] || "";
    const wrongWord = wrongWords[0];

    return {
      type: "pair_selection",
      targetSound,
      correctWords,
      chosenWords,
      cardsByWord,
      exampleText: getPairSupportText(question, correctWords, targetSound),
      wrongText: wrongWord
        ? getPairWrongText(question, wrongWord, targetSound)
        : "Both matching pictures need to be selected."
    };
  }

  function getPairSupportText(question, correctWords, targetSound) {
    if (correctWords.length < 2) return "";
    if (question.questionType === "rhyme_pair") {
      return `${correctWords[0]} and ${correctWords[1]} rhyme because they share the ending sound ${targetSound}.`;
    }
    if (question.questionType === "final_sound_pair") {
      return `${correctWords[0]} and ${correctWords[1]} both end with /${targetSound}/.`;
    }
    return `${correctWords[0]} and ${correctWords[1]} both begin with /${targetSound}/.`;
  }

  function getPairWrongText(question, wrongWord, targetSound) {
    if (question.questionType === "rhyme_pair") {
      return `${wrongWord} does not share the same rhyming ending.`;
    }
    if (question.questionType === "final_sound_pair") {
      return `${wrongWord} does not end with /${targetSound}/.`;
    }
    return `${wrongWord} starts with /${wrongWord[0]}/, so it does not match /${targetSound}/.`;
  }

  function getTeachingTip(question, choice, isCorrect) {
    const skill = normalize(question.skill);
    const answer = String(getQuestionAnswer(question) || "");

    if (isCorrect) return "Good job. You used the skill correctly.";

    if (isFixSentenceQuestion(question)) {
      return `The corrected sentence is "${answer}". Check the capital letter, word order, and ending punctuation.`;
    }

    if (skill.includes("initial")) {
      return `The correct answer is "${answer}". Listen to the first sound in the word.`;
    }

    if (skill.includes("final")) {
      return `The correct answer is "${answer}". Listen to the last sound in the word.`;
    }

    if (skill.includes("rhym")) {
      return `The correct answer is "${answer}". Rhyming words have the same ending sound.`;
    }

    if (skill.includes("short vowel") || skill.includes("cvc")) {
      return `The correct answer is "${answer}". Listen carefully to the vowel sound in the middle of the word.`;
    }

    if (skill.includes("high-frequency")) {
      return `The correct answer is "${answer}". This is a high-frequency word. These words appear often when we read.`;
    }

    if (skill.includes("blend")) {
      return `The correct answer is "${answer}". A blend has two consonant sounds together, like bl, st, or cr.`;
    }

    if (skill.includes("digraph")) {
      return `The correct answer is "${answer}". A digraph is two letters making one sound, like sh, ch, th, or wh.`;
    }

    if (skill.includes("preposition")) {
      return `The correct answer is "${answer}". A preposition tells where something is.`;
    }

    if (skill.includes("plural")) {
      return `The correct answer is "${answer}". A plural means more than one.`;
    }

    if (skill.includes("comprehension") || skill.includes("details") || skill.includes("main idea") || skill.includes("inference")) {
      return `The correct answer is "${answer}". Look back at the passage and use the details to help you.`;
    }

    return `The correct answer is "${answer}". Review the skill and try the next one.`;
  }

  function normalizeAudioText(text) {
    return String(text || "")
      .normalize("NFKC")
      .replace(/[“”]/g, "\"")
      .replace(/[‘’]/g, "'")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function speakWithBrowser(text) {
    if (!text) return;

    if (!window.speechSynthesis || typeof SpeechSynthesisUtterance === "undefined") {
      console.warn("Browser speech synthesis is unavailable.");
      return;
    }

    try {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(prepareNaturalSpeechText(text));
      utterance.rate = 0.85;
      utterance.pitch = 1;
      utterance.lang = "en-US";

      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.warn("Browser speech synthesis failed.", error);
    }
  }

  async function speakText(text, audioPath = "", options = {}) {
    if (!text) return;

    const allowBrowserFallback = options.allowBrowserFallback === true;
    const requireApprovedAudio = options.requireApprovedAudio === true;
    const preferredAudioPath = requireApprovedAudio
      ? getApprovedAudioPath(text, audioPath)
      : getPreferredAudioPath(text, audioPath);

    if (requireApprovedAudio && !preferredAudioPath) return;

    if (preferredAudioPath) {
      try {
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }

        const audio = new Audio(preferredAudioPath);
        await audio.play();
        return;
      } catch (error) {
        console.warn("Static audio unavailable.", error);
        if (!allowBrowserFallback) return;
      }
    }

    const normalizedText = normalizeAudioText(text);
    const audioKey = audioTextIndex[normalizedText];
    const audioEntry = audioKey ? audioManifest[audioKey] : null;

    if (requireApprovedAudio) return;

    if (audioEntry?.path) {
      const preferredManifestPath = getPreferredAudioPath(text, audioEntry.path);
      const audioPaths = audioEntry.kinds?.includes("choice")
        ? [`/audio/choices/${audioKey}.mp3`, preferredManifestPath]
        : [preferredManifestPath];

      try {
        for (const audioPath of audioPaths) {
          const response = await fetch(audioPath, { method: "HEAD" });

          if (response.ok) {
            if (window.speechSynthesis) {
              window.speechSynthesis.cancel();
            }

            const audio = new Audio(audioPath);
            await audio.play();
            return;
          }
        }
      } catch (error) {
        console.warn("Local audio unavailable.", error);
      }
    }

    if (allowBrowserFallback) {
      speakWithBrowser(text);
    }
  }

  function shouldShowImage(question) {
    const skill = normalize(question.skill);

    return Boolean(question.imagePath) && (
      question.questionType === "ixl_template" ||
      question.question === "Listen and find the word." ||
      skill.includes("vocabulary") ||
      skill.includes("preposition") ||
      skill.includes("emotion") ||
      skill.includes("picture comprehension")
    );
  }


  function flagCurrentQuestion() {
    if (!currentQuestion) return;

    setFlagIssueType("Confusing wording");
    setFlagNote("");
    setFlagDialogOpen(true);
  }

  async function submitQuestionFlag() {
    if (!teacherId || !currentQuestion) {
      setMessage("Please log in and select a question first.");
      return;
    }

    const questionId = currentQuestion.id || getQuestionPrompt(currentQuestion);
    const choices = currentQuestion.choices || currentQuestion.tiles || [];

    setFlagSubmitting(true);

    const { data: existingFlag, error: existingError } = await supabase
      .from("question_flags")
      .select("id")
      .eq("teacher_id", teacherId)
      .eq("question_id", questionId)
      .eq("status", "open")
      .maybeSingle();

    if (existingError && !isMissingTableError(existingError, "question_flags")) {
      console.error("Question flag duplicate check error:", existingError);
      setFlagSubmitting(false);
      setMessage("Could not check existing question flags.");
      return;
    }

    if (existingFlag) {
      setFlagSubmitting(false);
      setFlagDialogOpen(false);
      setMessage("This question is already flagged.");
      return;
    }

    const { error } = await supabase
      .from("question_flags")
      .insert({
        teacher_id: teacherId,
        teacher_email: teacherUser?.email || null,
        student_id: studentId,
        class_id: selectedClassId,
        question_id: questionId,
        question_text: getQuestionPrompt(currentQuestion),
        choices,
        correct_answer: getQuestionAnswer(currentQuestion),
        skill: currentQuestion.skill || currentStage?.label || "Unknown skill",
        diagnostic_target: currentQuestion.diagnosticTarget || getDiagnosticTarget(currentQuestion),
        mode: assessmentMode,
        issue_type: flagIssueType,
        note: flagNote.trim(),
        status: "open"
      });

    setFlagSubmitting(false);

    if (error) {
      if (error.code === "23505") {
        setFlagDialogOpen(false);
        setMessage("This question is already flagged.");
        return;
      }

      console.error("Question flag submit error:", error);
      setMessage("Could not flag question. Make sure the question flag migration has been run.");
      return;
    }

    setFlagDialogOpen(false);
    setMessage("Question flagged for review.");
  }

  function getDiagnosticTarget(question) {
    const skill =
      normalize(question.skill);

    const text =
      [
        question.question,
        question.answer,
        question.passage
      ].join(" ").toLowerCase();

    if (skill.includes("initial")) {
      const match =
        text.match(/\/([a-z]+)\//);

      if (match) return `initial /${match[1]}/`;

      const word =
        String(question.answer || "").toLowerCase();

      return word
        ? `initial ${word[0]}`
        : "initial sound";
    }

    if (skill.includes("final")) {
      const match =
        text.match(/\/([a-z]+)\//);

      if (match) return `final /${match[1]}/`;

      const word =
        String(question.answer || "").toLowerCase();

      return word
        ? `final ${word[word.length - 1]}`
        : "final sound";
    }

    if (skill.includes("rhym")) {
      const match =
        text.match(/rhymes with ([a-z]+)/);

      return match
        ? `rhymes with ${match[1]}`
        : "rhyming";
    }

    if (skill.includes("short vowel") || skill.includes("cvc")) {
      const answer =
        String(question.answer || "").toLowerCase();

      if (/[a]/.test(answer)) return "short a";
      if (/[e]/.test(answer)) return "short e";
      if (/[i]/.test(answer)) return "short i";
      if (/[o]/.test(answer)) return "short o";
      if (/[u]/.test(answer)) return "short u";

      return "short vowel";
    }

    if (skill.includes("blend")) {
      const match =
        text.match(/(bl|cl|fl|gl|pl|sl|br|cr|dr|fr|gr|pr|tr|sc|sk|sm|sn|sp|st|sw)/);

      return match
        ? `${match[1]} blend`
        : "blend";
    }

    if (skill.includes("digraph")) {
      const match =
        text.match(/(sh|ch|th|wh|ph)/);

      return match
        ? `${match[1]} digraph`
        : "digraph";
    }

    if (skill.includes("long vowel")) {
      const match =
        text.match(/long ([aeiou])/);

      return match
        ? `long ${match[1]}`
        : "long vowel";
    }

    if (skill.includes("vowel team")) {
      const match =
        text.match(/(ai|ay|ee|ea|oa|ow|igh|ie|oo|ue|ew)/);

      return match
        ? `${match[1]} vowel team`
        : "vowel team";
    }

    if (skill.includes("r-controlled") || skill.includes("r controlled")) {
      const match =
        text.match(/(ar|er|ir|or|ur)/);

      return match
        ? `${match[1]} r-controlled`
        : "r-controlled vowel";
    }

    if (skill.includes("high-frequency")) {
      return String(question.answer || "high-frequency word");
    }

    if (skill.includes("preposition")) {
      return String(question.answer || "preposition");
    }

    if (skill.includes("plural")) {
      return String(question.answer || "plural");
    }

    if (skill.includes("prefix") || skill.includes("suffix")) {
      return String(question.answer || "morphology");
    }

    if (skill.includes("homophone")) {
      return String(question.answer || "homophone");
    }

    if (skill.includes("main idea")) return "main idea";
    if (skill.includes("key details")) return "key details";
    if (skill.includes("sequencing")) return "sequencing";
    if (skill.includes("cause")) return "cause and effect";
    if (skill.includes("context")) return "context clues";
    if (skill.includes("theme")) return "theme";
    if (skill.includes("inference")) return "inference";

    return question.skill || "general skill";
  }

  function summarizeTargets(records) {
    const targetStats = {};

    records.forEach(record => {
      const target =
        record.diagnosticTarget || "general";

      if (!targetStats[target]) {
        targetStats[target] = {
          correct: 0,
          total: 0
        };
      }

      targetStats[target].total += 1;

      if (record.isCorrect) {
        targetStats[target].correct += 1;
      }
    });

    const secure = [];
    const developing = [];
    const needsPractice = [];

    Object.entries(targetStats).forEach(([target, stats]) => {
      const accuracy =
        stats.correct / stats.total;

      const label =
        `${target} (${stats.correct}/${stats.total})`;

      if (stats.total >= 2 && accuracy >= 0.9) {
        secure.push(label);
      } else if (accuracy >= 0.6) {
        developing.push(label);
      } else {
        needsPractice.push(label);
      }
    });

    return {
      secure,
      developing,
      needsPractice
    };
  }


  const letterItems = letterAssessmentOrder.map(letter => ({
    display: letter,
    type: letter === letter.toUpperCase() ? "uppercase" : "lowercase"
  }));

  const patternItems = advancedPhonicsPatterns.map((item, index) => ({
    ...item,
    exampleWord: item.examples[(patternAttempt + index) % item.examples.length]
  }));

  function startAdvancedPhonicsAssessment() {
    setPatternIndex(0);
    setPatternAssessment([]);
    setPatternAttempt(attempt => attempt + 1);
    setAppView("advancedPhonics");
  }

  function recordPatternResult(soundCorrect, wordCorrect) {
    const current =
      patternItems[patternIndex];

    updateItemMastery(
      {
        itemKey: current.pattern,
        itemType: "phonics_pattern"
      },
      soundCorrect
    );

    updateItemMastery(
      {
        itemKey: current.exampleWord,
        itemType: "phonics_pattern_word"
      },
      wordCorrect
    );

    setPatternAssessment(prev => [
      ...prev,
      {
        pattern: current.pattern,
        exampleWord: current.exampleWord,
        soundCorrect,
        wordCorrect
      }
    ]);

    setPatternIndex(prev => prev + 1);
  }

  function resetPatternAssessment() {
    setPatternIndex(0);
    setPatternAssessment([]);
    setPatternAttempt(attempt => attempt + 1);
  }

  function recordLetterResult(knowsName, knowsSound) {
    const current =
      letterItems[letterIndex];

    updateItemMastery(
      {
        itemKey: current.display,
        itemType: "letter_name"
      },
      knowsName
    );

    updateItemMastery(
      {
        itemKey: current.display,
        itemType: "letter_sound"
      },
      knowsSound
    );

    setLetterAssessment(prev => [
      ...prev,
      {
        letter: current.display,
        type: current.type,
        knowsName,
        knowsSound
      }
    ]);

    setLetterIndex(prev => prev + 1);
  }

  function resetLetterAssessment() {
    setLetterIndex(0);
    setLetterAssessment([]);
  }

  async function exportLetterAssessment() {
    try {
      const today =
        new Date().toISOString().slice(0, 10);

      const safeName =
        (studentName || "Unnamed student")
          .replace(/[^a-z0-9]/gi, "_")
          .toLowerCase();

      const alphabet =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

    const uppercaseResults =
      new Map(
        letterAssessment
          .filter(item => item.type === "uppercase")
          .map(item => [item.letter.toUpperCase(), item])
      );

    const lowercaseResults =
      new Map(
        letterAssessment
          .filter(item => item.type === "lowercase")
          .map(item => [item.letter.toUpperCase(), item])
      );

    const countKnown = (results, field) =>
      alphabet.filter(letter => results.get(letter)?.[field]).length;

    const workbook = await createExcelWorkbook();
    const worksheet = workbook.addWorksheet("Letter Assessment");

    const colors = {
      title: "FF1F4E79",
      section: "FF3478F6",
      summary: "FFEAF2FF",
      border: "FFB7C2D0",
      yes: "FFD9EAD3",
      no: "FFF4CCCC",
      white: "FFFFFFFF"
    };

    worksheet.columns = [
      { width: 10 },
      { width: 18 },
      { width: 18 },
      { width: 4 },
      { width: 10 },
      { width: 18 },
      { width: 18 }
    ];

    worksheet.mergeCells("A1:G1");
    worksheet.getCell("A1").value = "EL Letter Name and Sound Assessment";
    worksheet.getCell("A1").font = { bold: true, size: 18, color: { argb: colors.white } };
    worksheet.getCell("A1").alignment = { horizontal: "center" };
    worksheet.getCell("A1").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: colors.title }
    };
    worksheet.getRow(1).height = 28;

    worksheet.mergeCells("A2:G2");
    worksheet.getCell("A2").value = `Student: ${studentName || "Unnamed student"}`;
    worksheet.mergeCells("A3:G3");
    worksheet.getCell("A3").value = `Date: ${today}`;

    ["A2", "A3"].forEach(cellRef => {
      worksheet.getCell(cellRef).font = { bold: true, size: 12 };
      worksheet.getCell(cellRef).alignment = { horizontal: "center" };
    });

    const summaryValues = [
      ["A5", "Total Names Known", countKnown(uppercaseResults, "knowsName") + countKnown(lowercaseResults, "knowsName")],
      ["C5", "Total Sounds Known", countKnown(uppercaseResults, "knowsSound") + countKnown(lowercaseResults, "knowsSound")],
      ["E5", "Uppercase Names Known", countKnown(uppercaseResults, "knowsName")],
      ["A7", "Uppercase Sounds Known", countKnown(uppercaseResults, "knowsSound")],
      ["C7", "Lowercase Names Known", countKnown(lowercaseResults, "knowsName")],
      ["E7", "Lowercase Sounds Known", countKnown(lowercaseResults, "knowsSound")]
    ];

    summaryValues.forEach(([cellRef, label, value]) => {
      const cell = worksheet.getCell(cellRef);
      const valueCell = worksheet.getCell(cellRef.replace(/[A-Z]+/, match =>
        String.fromCharCode(match.charCodeAt(0) + 1)
      ));

      cell.value = label;
      valueCell.value = value;
      cell.font = { bold: true };
      valueCell.font = { bold: true, size: 14 };
      valueCell.alignment = { horizontal: "center" };

      [cell, valueCell].forEach(summaryCell => {
        summaryCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: colors.summary }
        };
        summaryCell.border = {
          top: { style: "thin", color: { argb: colors.border } },
          right: { style: "thin", color: { argb: colors.border } },
          bottom: { style: "thin", color: { argb: colors.border } },
          left: { style: "thin", color: { argb: colors.border } }
        };
      });
    });

    function styleSectionHeader(rowNumber, startCol, endCol, title) {
      worksheet.mergeCells(rowNumber, startCol, rowNumber, endCol);
      const cell = worksheet.getCell(rowNumber, startCol);
      cell.value = title;
      cell.font = { bold: true, color: { argb: colors.white } };
      cell.alignment = { horizontal: "center" };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: colors.section }
      };
    }

    function styleCell(cell) {
      cell.border = {
        top: { style: "thin", color: { argb: colors.border } },
        right: { style: "thin", color: { argb: colors.border } },
        bottom: { style: "thin", color: { argb: colors.border } },
        left: { style: "thin", color: { argb: colors.border } }
      };
      cell.alignment = { horizontal: "center", vertical: "middle" };
    }

    function styleResultCell(cell) {
      styleCell(cell);
      cell.font = { bold: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: cell.value === "Y" ? colors.yes : colors.no }
      };
    }

    function writeLetterTable({ title, startCol, letters, results }) {
      const headerRow = 10;
      styleSectionHeader(headerRow, startCol, startCol + 2, title);

      const columns = ["Letter", "Knows Name", "Knows Sound"];
      columns.forEach((heading, index) => {
        const cell = worksheet.getCell(headerRow + 1, startCol + index);
        cell.value = heading;
        cell.font = { bold: true };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFD9EAF7" }
        };
        styleCell(cell);
      });

      letters.forEach((letter, index) => {
        const rowNumber = headerRow + 2 + index;
        const result = results.get(letter.toUpperCase());
        const values = [
          letter,
          result?.knowsName ? "Y" : "N",
          result?.knowsSound ? "Y" : "N"
        ];

        values.forEach((value, columnIndex) => {
          const cell = worksheet.getCell(rowNumber, startCol + columnIndex);
          cell.value = value;
          if (columnIndex === 0) {
            styleCell(cell);
            cell.font = { bold: true };
          } else {
            styleResultCell(cell);
          }
        });
      });
    }

    writeLetterTable({
      title: "Uppercase Letters",
      startCol: 1,
      letters: alphabet,
      results: uppercaseResults
    });

    writeLetterTable({
      title: "Lowercase Letters",
      startCol: 5,
      letters: alphabet.map(letter => letter.toLowerCase()),
      results: lowercaseResults
    });

    worksheet.views = [{ state: "frozen", ySplit: 10 }];

    const workbookBuffer =
      await workbook.xlsx.writeBuffer();

    const blob = new Blob([workbookBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });

      downloadBlob(blob, `${safeName}_letter_name_sound_assessment_${today}.xlsx`);
      setMessage("Letter assessment Excel exported.");
    } catch (error) {
      console.error("Letter assessment Excel export failed:", error);
      setMessage("Could not export the letter assessment Excel report.");
    }
  }

  async function exportPatternAssessment() {
    try {
      const today =
        new Date().toISOString().slice(0, 10);

      const safeName =
        (studentName || "Unnamed student")
          .replace(/[^a-z0-9]/gi, "_")
          .toLowerCase();

    const results =
      new Map(patternAssessment.map(item => [item.pattern, item]));

    const totalSoundCorrect =
      patternAssessment.filter(item => item.soundCorrect).length;

    const totalWordCorrect =
      patternAssessment.filter(item => item.wordCorrect).length;

    const totalBothCorrect =
      patternAssessment.filter(item => item.soundCorrect && item.wordCorrect).length;

    const workbook = await createExcelWorkbook();
    const worksheet = workbook.addWorksheet("Advanced Phonics");

    const colors = {
      title: "FF1F4E79",
      section: "FF3478F6",
      summary: "FFEAF2FF",
      border: "FFB7C2D0",
      yes: "FFD9EAD3",
      no: "FFF4CCCC",
      white: "FFFFFFFF"
    };

    worksheet.columns = [
      { width: 16 },
      { width: 22 },
      { width: 16 },
      { width: 16 }
    ];

    worksheet.mergeCells("A1:D1");
    worksheet.getCell("A1").value = "Advanced Phonics Pattern Assessment";
    worksheet.getCell("A1").font = { bold: true, size: 18, color: { argb: colors.white } };
    worksheet.getCell("A1").alignment = { horizontal: "center" };
    worksheet.getCell("A1").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: colors.title }
    };
    worksheet.getRow(1).height = 28;

    worksheet.mergeCells("A2:D2");
    worksheet.getCell("A2").value = `Student: ${studentName || "Unnamed student"}`;
    worksheet.mergeCells("A3:D3");
    worksheet.getCell("A3").value = `Date: ${today}`;

    ["A2", "A3"].forEach(cellRef => {
      worksheet.getCell(cellRef).font = { bold: true, size: 12 };
      worksheet.getCell(cellRef).alignment = { horizontal: "center" };
    });

    const summaryRows = [
      ["A5", "Patterns assessed", patternAssessment.length],
      ["C5", "Sound correct", totalSoundCorrect],
      ["A7", "Word correct", totalWordCorrect],
      ["C7", "Both correct", totalBothCorrect]
    ];

    summaryRows.forEach(([cellRef, label, value]) => {
      const cell = worksheet.getCell(cellRef);
      const valueCell = worksheet.getCell(cellRef.replace(/[A-Z]+/, match =>
        String.fromCharCode(match.charCodeAt(0) + 1)
      ));

      cell.value = label;
      valueCell.value = value;
      cell.font = { bold: true };
      valueCell.font = { bold: true, size: 14 };
      valueCell.alignment = { horizontal: "center" };

      [cell, valueCell].forEach(summaryCell => {
        summaryCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: colors.summary }
        };
        summaryCell.border = {
          top: { style: "thin", color: { argb: colors.border } },
          right: { style: "thin", color: { argb: colors.border } },
          bottom: { style: "thin", color: { argb: colors.border } },
          left: { style: "thin", color: { argb: colors.border } }
        };
      });
    });

    function styleCell(cell) {
      cell.border = {
        top: { style: "thin", color: { argb: colors.border } },
        right: { style: "thin", color: { argb: colors.border } },
        bottom: { style: "thin", color: { argb: colors.border } },
        left: { style: "thin", color: { argb: colors.border } }
      };
      cell.alignment = { horizontal: "center", vertical: "middle" };
    }

    function styleResultCell(cell) {
      styleCell(cell);
      cell.font = { bold: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: cell.value === "Y" ? colors.yes : colors.no }
      };
    }

    worksheet.mergeCells("A10:D10");
    worksheet.getCell("A10").value = "Pattern Results";
    worksheet.getCell("A10").font = { bold: true, color: { argb: colors.white } };
    worksheet.getCell("A10").alignment = { horizontal: "center" };
    worksheet.getCell("A10").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: colors.section }
    };

    ["Pattern", "Example Word", "Sound Correct", "Word Correct"].forEach((heading, index) => {
      const cell = worksheet.getCell(11, index + 1);
      cell.value = heading;
      cell.font = { bold: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFD9EAF7" }
      };
      styleCell(cell);
    });

    patternItems.forEach((item, index) => {
      const result = results.get(item.pattern);
      const values = [
        item.pattern,
        result?.exampleWord || item.exampleWord,
        result?.soundCorrect ? "Y" : "N",
        result?.wordCorrect ? "Y" : "N"
      ];

      values.forEach((value, columnIndex) => {
        const cell = worksheet.getCell(index + 12, columnIndex + 1);
        cell.value = value;

        if (columnIndex < 2) {
          styleCell(cell);
          if (columnIndex === 0) cell.font = { bold: true };
        } else {
          styleResultCell(cell);
        }
      });
    });

    worksheet.views = [{ state: "frozen", ySplit: 10 }];

    const workbookBuffer =
      await workbook.xlsx.writeBuffer();

    const blob = new Blob([workbookBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });

      downloadBlob(blob, `${safeName}_advanced_phonics_pattern_assessment_${today}.xlsx`);
      setMessage("Pattern assessment Excel exported.");
    } catch (error) {
      console.error("Pattern assessment Excel export failed:", error);
      setMessage("Could not export the pattern assessment Excel report.");
    }
  }


  function exportCSVData() {
    const today =
      new Date().toISOString().slice(0, 10);

    const safeName =
      (studentName || "Unnamed student")
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase();

    const rows = [
      [
        "Date",
        "Student",
        "Skill",
        "Diagnostic Target",
        "Question",
        "Student Answer",
        "Correct Answer",
        "Result"
      ]
    ];

    answerHistory.forEach(item => {
      rows.push([
        formatExportValue(item.date),
        studentName || "Unnamed student",
        formatExportValue(item.stage || item.skill),
        formatExportValue(item.diagnosticTarget),
        buildQuestionExportText(item),
        formatExportValue(item.chosen),
        formatExportValue(item.correct),
        item.isCorrect ? "Correct" : "Incorrect"
      ]);
    });

    const csv =
      rows
        .map(row =>
          row
            .map(cell =>
              `"${String(cell).replace(/"/g, '""')}"`
            )
            .join(",")
        )
        .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv"
    });

    downloadBlob(blob, `${safeName}_reading_data_${today}.csv`);
  }


  function startAssessment(stageIndex = currentSkillIndex) {
    answerInFlightRef.current = false;
    const nextStageIndex = Number.isFinite(stageIndex) ? stageIndex : currentSkillIndex;
    const nextStage = skillTree[nextStageIndex] || currentStage;
    const previewQuestions =
      prioritizeCoverageQuestions(getAvailableStageQuestions(nextStageIndex), nextStage).slice(0, ROUND_LENGTH);

    debugAssessmentCoverage("start assessment", {
      studentId,
      skill: nextStage.label,
      selectedItemKeys: previewQuestions.map(getQuestionItemKey).filter(Boolean),
      selectedQuestionIds: previewQuestions.map(question => question.id)
    });

    setCurrentSkillIndex(nextStageIndex);
    setAssessmentMode("mastery");
    setFeedback(null);
    setCurrentQuestion(null);
    setCheckpointDecision(null);
    setShowReport(false);
    setRoundAnswers([]);
    setRoundItemKeys([]);
    setRoundQuestionIds([]);
    setMessage("");
    setAppView("assessment");
    pickQuestion("mastery", 0, nextStageIndex);
  }

  function keepPracticingSkill(stageIndex) {
    const stage = skillTree[stageIndex] || currentStage;
    debugAssessmentCoverage("Keep Practicing clicked", {
      studentId,
      currentSkill: stage.label
    });
    startAssessment(stageIndex);
  }

  function startTargetedReview() {
    answerInFlightRef.current = false;
    setAssessmentMode("targetedReview");
    setFeedback(null);
    setCurrentQuestion(null);
    setCheckpointDecision(null);
    setShowReport(false);
    setRoundAnswers([]);
    setRoundItemKeys([]);
    setRoundQuestionIds([]);
    setMessage("");
    setAppView("assessment");
    pickQuestion("targetedReview", 0);
  }

  function endAssessment() {
    answerInFlightRef.current = false;
    setCurrentQuestion(null);
    setFeedback(null);
    setCheckpointDecision(null);
    setRoundItemKeys([]);
    setRoundQuestionIds([]);
    setShowReport(true);
    setAppView("finished");
  }

  async function goToOverview() {
    answerInFlightRef.current = false;
    setCurrentQuestion(null);
    setFeedback(null);
    setCheckpointDecision(null);
    setShowReport(false);
    setAppView("overview");

    if (appView === "childMode" && studentId) {
      await loadStudentProgress(studentId, studentName || "Unnamed student");
    }
  }

  function continueCheckpointSkill() {
    const stageIndex = checkpointDecision?.skillIndex ?? currentSkillIndex;
    startAssessment(stageIndex);
  }

  function moveToNextCheckpointSkill() {
    const nextStageIndex = Math.min(
      (checkpointDecision?.skillIndex ?? currentSkillIndex) + 1,
      skillTree.length - 1
    );
    startAssessment(nextStageIndex);
  }

  function retryCheckpointSkill() {
    const stageIndex = checkpointDecision?.skillIndex ?? currentSkillIndex;
    startAssessment(stageIndex);
  }


  function exportData() {
    const today =
      new Date().toISOString().slice(0, 10);

    const safeName =
      (studentName || "Unnamed student")
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase();

    function summarizeSkill(stage) {
      const records =
        answerHistory.filter(item =>
          item.stage === stage.label
        );

      const data =
        mastery[stage.id];

      if (records.length === 0 && !data) {
        return `${stage.label}: Not yet reached or tested.`;
      }

      if (records.length === 0) {
        return `${stage.label}: Started, but no individual question data has been recorded yet.`;
      }

      const correct =
        records.filter(r => r.isCorrect).length;

      const summary =
        summarizeTargets(records);

      let note =
        `${stage.label}: ${correct}/${records.length} correct. `;

      if (data?.mastered) {
        note += `Status: checkpoint passed. `;
      } else if (stage.id === currentStage.id) {
        note += `Status: current working skill. `;
      } else {
        note += `Status: attempted, checkpoint not yet passed. `;
      }

      note += `\nSecure: ${
        summary.secure.length
          ? summary.secure.join(", ")
          : "No secure subskills recorded yet."
      }`;

      note += `\nDeveloping: ${
        summary.developing.length
          ? summary.developing.join(", ")
          : "No developing subskills recorded yet."
      }`;

      note += `\nNeeds practice: ${
        summary.needsPractice.length
          ? summary.needsPractice.join(", ")
          : "No specific needs recorded yet."
      }`;

      return note;
    }

    const reportText = `
Reading Mastery Report

Student: ${studentName || "Unnamed student"}
Date: ${today}

Overall Summary
Questions answered: ${totalAnswered}
Correct answers: ${correctAnswered}
Accuracy: ${accuracy}%

Current Position
Current skill: ${currentSkillIndex + 1}. ${currentStage.label}
Current round score: ${roundCorrect}/${ROUND_LENGTH}
Checkpoint rule: ${PASS_SCORE}/${ROUND_LENGTH} correct to unlock the next skill.

Guided Reading

${summarizeGuidedReadingRecords(guidedReadingRecords).length
  ? summarizeGuidedReadingRecords(guidedReadingRecords).map(item =>
      `${item.title} (${item.type}, Level ${item.level}): ${item.correct}/${item.attempted} words read correctly (${item.accuracy}%). Support words: ${item.supportWords.length ? item.supportWords.join(", ") : "none"}. Notes: ${[item.wholeBookNote, ...item.pageNotes.map(note => `Page ${note.page}: ${note.note}`)].filter(Boolean).join(" | ") || "none"}`
    ).join("\n")
  : "No guided reading records saved yet."}

Teacher Notes by Skill

${skillTree.map(stage => summarizeSkill(stage)).join("\n\n")}

Recent Question Evidence

${answerHistory.slice(-30).map((item, index) => {
  return `${index + 1}. Skill: ${item.stage}
Question: ${buildQuestionExportText(item)}
Student answered: ${formatExportValue(item.chosen)}
Correct answer: ${formatExportValue(item.correct)}
Result: ${item.isCorrect ? "Correct" : "Incorrect"}`;
}).join("\n\n")}
`.trim();

    const blob = new Blob([reportText], {
      type: "text/plain"
    });

    downloadBlob(blob, `${safeName}_reading_mastery_report_${today}.txt`);
  }

  function resetStudent() {
    if (profileStorageKey) {
      localStorage.removeItem(profileStorageKey);
    }

    clearTeacherState();
    loadClasses();
  }

  function switchStudent() {
    setNameSaved(false);
    setStudentId(null);
    setStudentName("");
    setGuidedReadingRecords({});
    setCurrentQuestion(null);
    setFeedback(null);
    setMessage("");
    setShowClassDashboard(false);
    setAppView("select");
    loadClasses();
    loadStudents(selectedClassId);
  }

  function viewReport() {
    setShowReport(true);
    setAppView("finished");
  }

  function openChildMode() {
    setAppView("childMode");
  }

  function changeAdminFlagStatusFilter(nextStatus) {
    setAdminFlagStatusFilter(nextStatus);
    loadAdminDashboard(nextStatus);
  }


  if (!authReady) {
    return (
      <div className="app">
        <div className="card page-card page-stack auth-card">
          <h2>Loading teacher session...</h2>
        </div>
      </div>
    );
  }

  if (!teacherUser) {
    return (
      <div className="app">
        <motion.div
          className="hero"
          initial={{ y: -12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <h1>Reading Mastery</h1>
          <p>Structured EL-style reading skill progression</p>
        </motion.div>

        <AuthPage
          authEmail={authEmail}
          setAuthEmail={setAuthEmail}
          authPassword={authPassword}
          setAuthPassword={setAuthPassword}
          authLoading={authLoading}
          authMessage={authMessage}
          signUpTeacher={signUpTeacher}
          logInTeacher={logInTeacher}
        />
      </div>
    );
  }

  const roundCorrect = roundAnswers.filter(Boolean).length;
  const roundProgress = Math.round((roundAnswers.length / ROUND_LENGTH) * 100);
  const accuracy = totalAnswered === 0 ? 0 : Math.round((correctAnswered / totalAnswered) * 100);
  const questionBankCoverage = buildQuestionBankCoverage(allQuestions);
  const isFocusedAssessment =
    appView === "assessment" ||
    appView === "checkpoint" ||
    appView === "letters" ||
    appView === "advancedPhonics" ||
    appView === "childMode";
  const appShellClassName = [
    "app",
    isFocusedAssessment ? "assessment-app" : "",
    appView === "childMode" ? "learning-world-app" : ""
  ].filter(Boolean).join(" ");

  return (
    <div className={appShellClassName}>
      {showConfetti && <Confetti recycle={false} numberOfPieces={90} />}

      {!isFocusedAssessment && (
        <TopNavigation
          appView={appView}
          nameSaved={nameSaved}
          studentName={studentName}
          currentStage={currentStage}
          goToOverview={goToOverview}
          goToSkills={() => setAppView("skills")}
          goToElAssessments={() => setAppView("elAssessments")}
          goToGuidedReading={() => setAppView("guidedReading")}
          goToReports={() => setAppView("reports")}
          goToTools={() => setAppView("tools")}
          switchStudent={switchStudent}
          viewReport={viewReport}
          teacherEmail={teacherUser.email}
          logOutTeacher={logOutTeacher}
          isAdmin={isAdmin}
          openAdminDashboard={openAdminDashboard}
          openChildMode={openChildMode}
        />
      )}

      {!isFocusedAssessment && appView === "select" && (
        <motion.div
          className="hero"
          initial={{ y: -12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <h1>Reading Mastery</h1>
          <p>Structured EL-style reading skill progression</p>

          {appView === "select" && !nameSaved && (
            <StudentSelectPage
              classList={classList}
              selectedClassId={selectedClassId}
              setSelectedClassId={setSelectedClassId}
              setStudentList={setStudentList}
              loadStudents={loadStudents}
              newClassName={newClassName}
              setNewClassName={setNewClassName}
              createClass={createClass}
              loadClassDashboard={loadClassDashboard}
              studentList={studentList}
              loadingStudents={loadingStudents}
              loadStudentProgress={loadStudentProgress}
              studentName={studentName}
              setStudentName={setStudentName}
              saveStudentName={saveStudentName}
              showClassDashboard={showClassDashboard}
              classDashboard={classDashboard}
              skillTree={skillTree}
              setShowClassDashboard={setShowClassDashboard}
              deleteClass={deleteClass}
              deleteStudent={deleteStudent}
            />
          )}

          {nameSaved && <h2>Student: {studentName}</h2>}
        </motion.div>
      )}

      {appView === "admin" && isAdmin && (
        <Suspense fallback={<LazyPageFallback label="Loading admin dashboard..." />}>
          <AdminDashboardPage
            flags={adminFlags}
            teachers={adminTeachers}
            classes={adminClasses}
            students={adminStudents}
            statusFilter={adminFlagStatusFilter}
            setStatusFilter={changeAdminFlagStatusFilter}
            loading={adminLoading}
            refreshDashboard={() => loadAdminDashboard(adminFlagStatusFilter)}
            resolveFlag={flagId => updateQuestionFlagStatus(flagId, "resolved")}
            reopenFlag={flagId => updateQuestionFlagStatus(flagId, "open")}
            deleteClass={adminDeleteClass}
            deleteStudent={adminDeleteStudent}
            questionBankCoverage={questionBankCoverage}
            message={message}
          />
        </Suspense>
      )}

      {appView === "overview" && nameSaved && (
        <StudentOverviewPage
          studentName={studentName}
          currentSkillIndex={currentSkillIndex}
          currentStage={currentStage}
          accuracy={accuracy}
          totalAnswered={totalAnswered}
          roundCorrect={roundCorrect}
          passScore={PASS_SCORE}
          roundLength={ROUND_LENGTH}
          skillTree={skillTree}
          setCurrentSkillIndex={setCurrentSkillIndex}
          setRoundAnswers={setRoundAnswers}
          setCurrentQuestion={setCurrentQuestion}
          setFeedback={setFeedback}
          setMessage={setMessage}
          startAssessment={startAssessment}
          startAdvancedPhonicsAssessment={startAdvancedPhonicsAssessment}
          startTargetedReview={startTargetedReview}
          weaknessSnapshot={weaknessSnapshot}
          itemMasterySnapshot={getItemMasterySnapshot()}
          coverageSnapshot={buildCoverageSnapshot(itemMastery, {
            enabled: DEBUG_ASSESSMENT_COVERAGE,
            studentId
          })}
          childLearningEvidence={childLearningEvidence}
          setAppView={setAppView}
          switchStudent={switchStudent}
          openResetStudentProgress={() => setResetProgressDialogOpen(true)}
          letterAssessment={letterAssessment}
          patternAssessment={patternAssessment}
          exportLetterAssessment={exportLetterAssessment}
          exportPatternAssessment={exportPatternAssessment}
          isAdmin={isAdmin}
        />
      )}

      {appView === "skills" && nameSaved && (
        <SkillsProgressPage
          studentName={studentName}
          skillTree={skillTree}
          currentSkillIndex={currentSkillIndex}
          setCurrentSkillIndex={setCurrentSkillIndex}
          setRoundAnswers={setRoundAnswers}
          setCurrentQuestion={setCurrentQuestion}
          setFeedback={setFeedback}
          setMessage={setMessage}
          mastery={mastery}
          coverageSnapshot={buildCoverageSnapshot(itemMastery, {
            enabled: DEBUG_ASSESSMENT_COVERAGE,
            studentId
          })}
          startAssessment={startAssessment}
        />
      )}

      {appView === "elAssessments" && nameSaved && (
        <ELAssessmentsPage
          studentName={studentName}
          startLetterAssessment={() => setAppView("letters")}
          startAdvancedPhonicsAssessment={startAdvancedPhonicsAssessment}
          openGuidedReading={() => setAppView("guidedReading")}
          letterAssessment={letterAssessment}
          patternAssessment={patternAssessment}
          exportLetterAssessment={exportLetterAssessment}
          exportPatternAssessment={exportPatternAssessment}
        />
      )}

      {appView === "guidedReading" && nameSaved && (
        <GuidedReadingPage
          studentName={studentName}
          guidedReadingRecords={guidedReadingRecords}
          saveGuidedReadingRecord={saveGuidedReadingRecord}
          speakText={speakText}
          returnToElAssessments={() => setAppView("elAssessments")}
          viewReports={() => setAppView("reports")}
        />
      )}

      {appView === "reports" && nameSaved && (
        <TeacherReportsPage
          studentName={studentName}
          viewFinishedReport={() => setAppView("finished")}
          openGuidedReading={() => setAppView("guidedReading")}
          guidedReadingRecords={guidedReadingRecords}
          exportData={exportData}
          exportCSVData={exportCSVData}
          letterAssessment={letterAssessment}
          patternAssessment={patternAssessment}
          exportLetterAssessment={exportLetterAssessment}
          exportPatternAssessment={exportPatternAssessment}
        />
      )}

      {appView === "tools" && nameSaved && (
        <TeacherSettingsToolsPage
          studentName={studentName}
          switchStudent={switchStudent}
          openResetStudentProgress={() => setResetProgressDialogOpen(true)}
          isAdmin={isAdmin}
          childLearningEvidence={childLearningEvidence}
          itemMasterySnapshot={getItemMasterySnapshot()}
        />
      )}

      {!isFocusedAssessment && appView !== "admin" && appView !== "overview" && appView !== "skills" && appView !== "elAssessments" && appView !== "guidedReading" && appView !== "reports" && appView !== "tools" && (
        <DashboardSummary
          currentSkillIndex={currentSkillIndex}
          skillTree={skillTree}
          currentStage={currentStage}
          roundCorrect={roundCorrect}
          roundLength={ROUND_LENGTH}
          accuracy={accuracy}
        />
      )}

      {appView === "letters" && (
        <LetterAssessmentPage
          studentName={studentName}
          letterIndex={letterIndex}
          letterItems={letterItems}
          endAssessment={endAssessment}
          recordLetterResult={recordLetterResult}
          letterAssessment={letterAssessment}
          exportLetterAssessment={exportLetterAssessment}
          resetLetterAssessment={resetLetterAssessment}
        />
      )}

      {appView === "advancedPhonics" && (
        <AdvancedPhonicsPatternAssessmentPage
          studentName={studentName}
          patternIndex={patternIndex}
          patternItems={patternItems}
          endAssessment={endAssessment}
          recordPatternResult={recordPatternResult}
          patternAssessment={patternAssessment}
          exportPatternAssessment={exportPatternAssessment}
          resetPatternAssessment={resetPatternAssessment}
        />
      )}

      {appView === "assessment" && (
        <AssessmentPage
          currentQuestion={currentQuestion}
          feedback={feedback}
          studentName={studentName}
          currentSkillIndex={currentSkillIndex}
          currentStage={currentStage}
          setFeedback={setFeedback}
          pickQuestion={pickQuestion}
          roundAnswers={roundAnswers}
          roundLength={ROUND_LENGTH}
          roundProgress={roundProgress}
          shouldShowImage={shouldShowImage}
          flagCurrentQuestion={flagCurrentQuestion}
          answerQuestion={answerQuestion}
          speakText={speakText}
          message={message}
          endAssessment={endAssessment}
          assessmentMode={assessmentMode}
        />
      )}

      {appView === "checkpoint" && (
        <CheckpointDecisionPage
          checkpoint={checkpointDecision}
          continueSkill={continueCheckpointSkill}
          moveToNextSkill={moveToNextCheckpointSkill}
          retrySkill={retryCheckpointSkill}
          reviewMistakes={startTargetedReview}
          returnToOverview={goToOverview}
        />
      )}

      {appView === "childMode" && (
        <LearningWorldShell returnToTeacher={goToOverview}>
          <Suspense fallback={<LearningWorldFallback returnToTeacher={goToOverview} />}>
            <ChildModePage
              returnToTeacher={goToOverview}
              onAnswer={recordChildModeAnswer}
            />
          </Suspense>
        </LearningWorldShell>
      )}

      <QuestionFlagDialog
        open={flagDialogOpen}
        question={currentQuestion}
        issueType={flagIssueType}
        setIssueType={setFlagIssueType}
        note={flagNote}
        setNote={setFlagNote}
        submitting={flagSubmitting}
        onSubmit={submitQuestionFlag}
        onCancel={() => setFlagDialogOpen(false)}
        getDiagnosticTarget={getDiagnosticTarget}
      />

      <ResetStudentProgressDialog
        open={resetProgressDialogOpen}
        studentName={studentName}
        resetting={resettingProgress}
        onAdaptiveReset={() => resetSelectedStudentProgress({ includeFormalAssessments: false })}
        onFullReset={() => resetSelectedStudentProgress({ includeFormalAssessments: true })}
        onCancel={() => setResetProgressDialogOpen(false)}
      />

      {appView === "finished" && (
        <Suspense fallback={<LazyPageFallback label="Loading report..." />}>
          <FinishedReportPage
            startAssessment={startAssessment}
            keepPracticingSkill={keepPracticingSkill}
            startTargetedReview={startTargetedReview}
            goToOverview={goToOverview}
            studentName={studentName}
            totalAnswered={totalAnswered}
            accuracy={accuracy}
            currentStage={currentStage}
            currentSkillIndex={currentSkillIndex}
            setCurrentSkillIndex={setCurrentSkillIndex}
            setRoundAnswers={setRoundAnswers}
            setCurrentQuestion={setCurrentQuestion}
            setFeedback={setFeedback}
            setMessage={setMessage}
            skillTree={skillTree}
            currentStageQuestions={currentStageQuestions}
            mastery={mastery}
            coverageSnapshot={buildCoverageSnapshot(itemMastery, {
              enabled: DEBUG_ASSESSMENT_COVERAGE,
              studentId
            })}
            allowPassageAudio={allowPassageAudio}
            setAllowPassageAudio={setAllowPassageAudio}
            exportData={exportData}
            exportCSVData={exportCSVData}
            letterAssessment={letterAssessment}
            patternAssessment={patternAssessment}
            exportLetterAssessment={exportLetterAssessment}
            exportPatternAssessment={exportPatternAssessment}
            guidedReadingRecords={guidedReadingRecords}
          />
        </Suspense>
      )}

      {!isFocusedAssessment && appView !== "overview" && appView !== "skills" && appView !== "elAssessments" && appView !== "guidedReading" && appView !== "reports" && appView !== "tools" && appView !== "admin" && (
        <div className="footer-utility-actions">
          <button className="report-button" onClick={switchStudent}>
            Switch Student
          </button>

          <button className="reset-button" onClick={resetStudent}>
            Reset Student
          </button>
        </div>
      )}
    </div>
  );
}

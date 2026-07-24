/* eslint-disable no-control-regex, react-hooks/set-state-in-effect -- LEGACY-LINT: pre-strict-rules file; new code must not add violations. */
import {
  Suspense,
  useCallback,
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { flushSync } from "react-dom";
import Confetti from "react-confetti";
import { motion, useReducedMotion } from "framer-motion";
import "./App.css";
import logoUrl from "./assets/logo.svg";
import { supabase, isSupabaseConfigured } from "./supabaseClient";
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
  SkillsProgressPage,
  StudentOverviewPage,
  TeacherReportsPage
} from "./components/AppPages";
import { StudentEntryPage } from "./components/StudentEntryPage.jsx";
import { StudentHomePage } from "./components/StudentHomePage.jsx";
import StudentRail from "./components/StudentRail.jsx";
import { StudentLoginFlow } from "./components/StudentLoginFlow.jsx";
import { SchoolNameInput } from "./components/SchoolNameInput.jsx";
import { studentReportHash } from "./components/reports/studentReportUiUtils.js";
import { worldForScope } from "./utils/palWorlds.js";
import { buildQuestMasteryReport } from "./utils/questReport.js";
import { ErrorBoundary } from "./components/ErrorBoundary.jsx";
import { normalize, shuffleArray } from "./utils/assessmentRoundBuilder";

import {
  coverageExpectations,
  finalSoundLevelOneAllowedItemKeys,
  rhymingPhaseItemKeysByLevel
} from "./data/coverageExpectations";
import {
  getQuestionRoutingFormat,
  isQuestionAllowedForSkill
} from "./data/skillTemplateRouting";
import {
  getAssessmentSkillLabel,
  resolveAssessmentSkillId
} from "./data/assessmentSkillMapping";
import {
  createAssessmentRoundDuplicateProfile,
  getAssessmentRoundDuplicateFlags,
  selectAssessmentRoundCandidate
} from "./data/assessmentRoundSelector.js";
import {
  getFinalSoundsLevel1QuestionIssues,
  isFinalSoundsLevel1Question,
  isValidFinalSoundWordForEarlyLevel
} from "./data/earlyPhonicsValidation";
import { getBlendsRuntimeEligibilityIssues } from "./data/blendsRuntimeEligibility";
import { getDigraphsRuntimeEligibilityIssues } from "./data/digraphsRuntimeEligibility";
import { getLongVowelsRuntimeEligibilityIssues } from "./data/longVowelsRuntimeEligibility";
import { isHighFrequencyWordSkill } from "./data/highFrequencyWordBands";
import {
  buildFinalSoundAvailableWordMap,
  evaluateFinalSoundLevelOneMasteryDepth,
  finalSoundLevelOneTargets,
  getFinalSoundTargetFromEvidence,
  FINAL_SOUND_LEVEL_ONE_REQUIRED_CORRECT,
  FINAL_SOUND_LEVEL_ONE_REQUIRED_SUCCESSFUL_ROUNDS,
  FINAL_SOUND_LEVEL_ONE_REQUIRED_UNIQUE_WORDS
} from "./data/finalSoundMasteryDepth";

import { isLevelOneContentQualityAllowed } from "./data/levelOneContentQuality";
import { advancedPhonicsPatterns } from "./data/advancedPhonicsPatterns";
import { getRuntimeSourceIssues } from "./data/sourceOfTruthRegistry";
import {
  applyQuestionFormatMetadata,
  getQuestionFormatMetadata,
  isMasteryEligible
} from "./questionFormatFramework";
import { isAssessmentContentValid } from "./assessmentContentValidation";
import { getRhymeGroup } from "./data/rhymeGroups";
import {
  buildInitialSoundsProgressFromAnswerHistory,
  getInitialSoundRoundPlan
} from "./content/initialSounds/initialSoundSelector";
import { INITIAL_SOUND_LETTERS } from "./content/initialSounds/initialSoundWordBank";
import {
  getAnswerRecordPromptAnswerSignature,
  getAnswerRecordSignature,
  getQuestionPromptAnswerSignature,
  getQuestionSignature,
  getRepeatOptionSetSignature,
  getRepeatTargetWord
} from "./questionRepeatGuards";
import {
  getEarlySkillRuntimeEligibilityIssues,
  getTargetObjectImage,
  isRuntimeEligibleEarlySkillQuestion,
  normalizeEarlySkillId
} from "./utils/earlySkills/isRuntimeEligibleEarlySkillQuestion";
import {
  buildAssessmentAttemptRecord,
  deleteAssessmentAttemptsForStudent,
  extractMasteryFromAssessmentAttempt,
  flushAssessmentAttemptSyncQueue,
  hydrateAssessmentAttempts,
  loadAssessmentAttempts,
  mergeAssessmentAttemptRecords,
  mergeAssessmentAttemptIntoItemMastery,
  saveAssessmentAttempt
} from "./data/assessmentHistoryStore";
import { buildSkillMasterySummaryRows } from "./data/skillMasterySummary.js";
import { deleteSavedClassElAssessmentReportsForStudent } from "./data/elAssessmentReportStore.js";
import { buildElBenchmarkAttempt } from "./data/elBenchmarkAssessments.js";
import { createElBenchmarkSession } from "./data/elBenchmarkSession.js";
import {
  isGenericInstructionAudioPath,
  normalizeAssessmentAudioRoles
} from "./utils/assessmentAudioRoles";
import { APP_VIEWS } from "./appState/appViews.js";
import {
  getPersistedAppView,
  getRestoredAppView,
  elBenchmarkAssessmentHash,
  isFocusedAssessmentView,
  isStudentAllowedView,
  restoreElBenchmarkSessionFromHash,
  shouldShowDashboardSummary,
  shouldShowFooterUtilityActions,
  teacherIntentHash
} from "./appState/appViewHelpers.js";
import {
  deleteElBenchmarkDraft,
  loadElBenchmarkDraft,
  saveElBenchmarkDraft,
  getGuidedReadingStorageKey as getGuidedReadingStorageKeyForSession,
  getSelectedClassName,
  getTeacherProfileStorageKey
} from "./appState/studentSessionHelpers.js";
import {
  calculateAccuracy,
  calculateRoundCorrect,
  calculateRoundProgress,
  getAssessmentAttemptType
} from "./appState/assessmentSessionHelpers.js";
import {
  preloadQuestionMedia,
  preloadQuestionMediaBatch
} from "./utils/preloadQuestionMedia.js";
import { speakWithBrowser as speakWithBrowserFallback } from "./utils/audio/speakWithBrowser.js";
import { DYNAMIC_IMPORT_ERROR_EVENT, importWithRetry, lazyWithRetry } from "./utils/lazyWithRetry.js";
import {
  clearProgressSyncSession,
  configureProgressSync,
  hydrateCloudProgress,
  queueProgressSave,
  clearLocalProgressForStudent,
  RESET_AREA
} from "./utils/progressSync.js";
import { clearLocalElAssessmentDataForStudent } from "./utils/elAssessmentReset.js";
import { insertWithRetry, startInsertQueueFlusher } from "./utils/insertQueue.js";

// dynamic mastery system

// Sound Seekers: a whole mode, lazy so a child who never opens it doesn't pay
// for it on first load. Default export, unlike the named-export pages below.
const QuestRoot = lazyWithRetry(() => import("./components/quest/QuestRoot.jsx"));

// Whole student modes: lazy so their engines (elQuest, the Hollow/rewards
// surface) drop out of the initial App bundle and only load when a child opens
// them.
const ElSkillsQuest = lazyWithRetry(() =>
  import("./components/elQuest/ElSkillsQuest.jsx").then(module => ({
    default: module.ElSkillsQuest
  }))
);
const HollowPage = lazyWithRetry(() =>
  import("./components/HollowPage.jsx").then(module => ({
    default: module.HollowPage
  }))
);

// Teacher-only pages: lazy so the student bundle never downloads them.
const TeacherDashboardPage = lazyWithRetry(() =>
  import("./components/TeacherDashboardPage.jsx").then(module => ({
    default: module.TeacherDashboardPage
  }))
);
const LazyActionFeedback = lazyWithRetry(() =>
  import("./components/ActionFeedback.jsx").then(module => ({
    default: module.ActionFeedback
  }))
);
const Sidebar = lazyWithRetry(() =>
  import("./components/Sidebar.jsx").then(module => ({
    default: module.Sidebar
  }))
);
const TeacherIntentPage = lazyWithRetry(() =>
  import("./components/teacher/TeacherIntentPage.jsx").then(module => ({
    default: module.TeacherIntentPage
  }))
);
const ConfirmActionDialog = lazyWithRetry(() =>
  import("./components/teacher/TeacherAdminDialogs.jsx").then(module => ({
    default: module.ConfirmActionDialog
  }))
);
const ResetStudentProgressDialog = lazyWithRetry(() =>
  import("./components/teacher/TeacherAdminDialogs.jsx").then(module => ({
    default: module.ResetStudentProgressDialog
  }))
);
const WorksheetGeneratorPage = lazyWithRetry(() =>
  import("./components/WorksheetGeneratorPage.jsx").then(module => ({
    default: module.WorksheetGeneratorPage
  }))
);
const PresentPage = lazyWithRetry(() =>
  import("./components/PresentPage.jsx").then(module => ({
    default: module.PresentPage
  }))
);
const AdminDashboardPage = lazyWithRetry(() =>
  import("@/components/AdminDashboardPage").then(module => ({
    default: module.AdminDashboardPage
  }))
);
const ELBenchmarkAssessmentPage = lazyWithRetry(() =>
  import("./components/assessment/ELBenchmarkAssessmentPage.jsx").then(module => ({
    default: module.ELBenchmarkAssessmentPage
  }))
);

let audioManifestModulePromise = null;
let guidedReadingBooksModulePromise = null;
let assessmentSkillBankLoaderModulePromise = null;
let assessmentMediaPickerModulePromise = null;
const STUDENT_SESSION_STORAGE_KEY = "lp-student-session-v1";
// The student view allowlist now lives in appState/appViewHelpers.js (exported,
// and held against the Student Home's own links by a unit test). It was a
// private Set here, and that is precisely how Sound Seekers shipped with a
// button that bounced straight back to the home screen: the guard only runs in
// student mode, so it was invisible to every teacher-side check we had.

function loadAudioManifestModule() {
  if (!audioManifestModulePromise) {
    audioManifestModulePromise = importWithRetry(() => import("./data/audioManifest"))
      .catch(error => {
        audioManifestModulePromise = null;
        throw error;
      });
  }
  return audioManifestModulePromise;
}

function loadGuidedReadingBooksModule() {
  if (!guidedReadingBooksModulePromise) {
    guidedReadingBooksModulePromise = importWithRetry(() => import("./data/guidedReadingBooks"))
      .catch(error => {
        guidedReadingBooksModulePromise = null;
        throw error;
      });
  }
  return guidedReadingBooksModulePromise;
}

function loadAssessmentSkillBankLoaderModule() {
  if (!assessmentSkillBankLoaderModulePromise) {
    assessmentSkillBankLoaderModulePromise = importWithRetry(() => import("./data/loadAssessmentSkillBank"))
      .catch(error => {
        assessmentSkillBankLoaderModulePromise = null;
        throw error;
      });
  }
  return assessmentSkillBankLoaderModulePromise;
}

function loadAssessmentMediaPickerModule() {
  if (!assessmentMediaPickerModulePromise) {
    assessmentMediaPickerModulePromise = importWithRetry(() => import("./data/assessmentMediaPicker"))
      .catch(error => {
        assessmentMediaPickerModulePromise = null;
        throw error;
      });
  }
  return assessmentMediaPickerModulePromise;
}

let finishedReportPageModulePromise = null;

function loadFinishedReportPageModule() {
  if (!finishedReportPageModulePromise) {
    finishedReportPageModulePromise = importWithRetry(() => import("@/components/FinishedReportPage"))
      .catch(error => {
        finishedReportPageModulePromise = null;
        throw error;
      });
  }
  return finishedReportPageModulePromise;
}

const FinishedReportPage = lazyWithRetry(() =>
  loadFinishedReportPageModule().then(module => ({
    default: module.FinishedReportPage
  }))
);

const LearnAreaPage = lazyWithRetry(() =>
  import("@/components/LearnAreaPage").then(module => ({
    default: module.LearnAreaPage
  }))
);

const PhonicsLearnPage = lazyWithRetry(() =>
  import("@/components/PhonicsLearnPage").then(module => ({
    default: module.PhonicsLearnPage
  }))
);

// A load screen a child can enjoy: three letter tiles hop while a reading tip
// shows (rotates every 20s so repeat loads feel fresh). Reduced-motion users
// get static tiles; screen readers get the label via role=status as before.
const LOADING_TIPS = [
  "Sound it out, then say it smoothly.",
  "Tricky words are just words you have not met yet.",
  "Five minutes of reading a day grows a mighty brain.",
  "Reading out loud to a pet still counts as reading out loud."
];

// Picked once at module load (render must stay pure): each app session shows
// a different tip, which is rotation enough for a loading screen.
const LOADING_TIP_INDEX = Math.floor(Date.now() / 20000) % LOADING_TIPS.length;

function LazyPageFallback({ label = "Loading..." }) {
  const tip = LOADING_TIPS[LOADING_TIP_INDEX];
  return (
    <div className="lazy-page-fallback" role="status" aria-live="polite">
      <div className="lazy-page-fallback-card">
        <div className="lazy-letter-row" aria-hidden="true">
          <span className="lazy-letter">a</span>
          <span className="lazy-letter">b</span>
          <span className="lazy-letter">c</span>
        </div>
        <strong>{label}</strong>
        <p className="lazy-page-tip">{tip}</p>
      </div>
    </div>
  );
}

function NewVersionAvailableCard({ message = "A new version is available." }) {
  return (
    <div className="app">
      <div className="card page-card page-stack auth-card">
        <h2>New version available</h2>
        <p>{message}</p>
        <button className="main-button" type="button" onClick={() => window.location.reload()}>
          Reload
        </button>
      </div>
    </div>
  );
}

function PageErrorFallback() {
  return (
    <div className="card page-card page-stack error-boundary-fallback">
      <h2>Something went wrong.</h2>
      <p>Please refresh or go back.</p>
    </div>
  );
}

function PageBoundary({ children, resetKey }) {
  return (
    <ErrorBoundary resetKey={resetKey} fallback={<PageErrorFallback />}>
      {children}
    </ErrorBoundary>
  );
}

const PURE_EARLY_PHONICS_SKILL_IDS = new Set([
  "initial_sounds",
  "final_sounds",
  "cvc_short_vowels",
  "rhyming",
  "short_vowel_discrimination"
]);

function isHfwStage(stage = {}) {
  return isHighFrequencyWordSkill(stage.id || stage.label || "");
}

function getStageIndex(question) {
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

function normalizeMultiSelectAnswer(answer) {
  // Lowercase so scoring matches validation (isQuestionValid compares via
  // normalizeItemKey, which lowercases): cards "Cat"/"Hat" must satisfy
  // correctAnswers ["cat","hat"].
  return (Array.isArray(answer) ? answer : String(answer || "").split("|"))
    .map(value => String(value || "").trim().toLowerCase())
    .filter(Boolean)
    .sort()
    .join("|");
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

function getQuestionCards(question = {}) {
  return Array.isArray(question.imageCards) ? question.imageCards : [];
}

function isListenAndFindWordQuestion(question = {}) {
  const text = String(question.question || question.prompt || "").toLowerCase().trim();
  const typeText = String([question.questionType, question.formatType].join(" ")).toLowerCase();
  return (
    text === "listen and find the word." ||
    text === "listen and find the word" ||
    typeText.includes("listen_and_find_word") ||
    typeText.includes("heard_word_to_print")
  );
}

function getListenAndFindAssetDiagnostics(question = {}) {
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

function isInitialSoundQuestion(question = {}) {
  return normalize(question.itemType) === "initial_sound" ||
    normalize(question.skillId || question.skill || question.skillName).includes("initial");
}

function isInitialSoundPairQuestion(question = {}) {
  return question.questionType === "initial_sound_pair";
}

function hasCompleteInitialSoundPairAssets(question = {}) {
  const cards = getQuestionCards(question);
  return isInitialSoundPairQuestion(question) &&
    cards.length >= 3 &&
    cards.every(card => (card.image || card.imagePath || card.imageUrl) && (card.audio || card.audioPath || card.audioUrl));
}

function isPairSelectionQuestion(question = {}) {
  return [
    "initial_sound_pair",
    "final_sound_pair",
    "rhyme_pair"
  ].includes(question.questionType);
}

function normalizePairSelectionAnswer(value) {
  return (Array.isArray(value) ? value : String(value || "").split("|"))
    .map(normalize)
    .filter(Boolean)
    .sort()
    .join("|");
}

function hasCompletePairSelectionAssets(question = {}) {
  const cards = getQuestionCards(question);
  const requiredCardCount = question.skillId === "final_sounds" || question.itemType === "final_sound" ? 4 : 3;
  return isPairSelectionQuestion(question) &&
    cards.length >= requiredCardCount &&
    cards.every(card => (card.image || card.imagePath || card.imageUrl) && (card.audio || card.audioPath || card.audioUrl));
}

function isVisualCardChoiceQuestion(question = {}) {
  return question.questionType === "visual_card_choice";
}

function hasCompleteVisualQuestionAssets(question = {}) {
  if (!isVisualCardChoiceQuestion(question)) return true;
  const cards = getQuestionCards(question);
  const requireImages = question.requireOptionImages !== false;
  const requireAudio = question.requireOptionAudio === true;
  return cards.length >= 2 && cards.every(card =>
    (!requireImages || card.image || card.imagePath || card.imageUrl) &&
    (!requireAudio || card.audio || card.audioPath || card.audioUrl)
  );
}

const SHORT_VOWEL_WORD_BANK = {
  a: ["cat", "bag", "bat", "map", "pan", "jam"],
  e: ["bed", "pen", "red", "web", "leg", "jet"],
  i: ["pig", "pin", "sit", "wig", "lid", "fin"],
  o: ["dog", "pot", "log", "dot", "fox", "sock"],
  u: ["cup", "sun", "mug", "mud", "bug"]
};

function getFirstVowelLetter(value = "") {
  return String(value || "").toLowerCase().match(/[aeiou]/)?.[0] || "";
}

function getWordRime(value = "") {
  const word = String(value || "").toLowerCase().trim();
  const index = word.search(/[aeiou]/);
  return index === -1 ? word.slice(1) : word.slice(index);
}

function isShortVowelWordCategoryQuestion(question = {}) {
  const skillId = String(question.skillId || question.skill || question.skillName || "").toLowerCase();
  const format = String(question.formatType || question.templateType || "").toUpperCase();
  const prompt = String(question.prompt || question.question || "").toLowerCase();
  return (
    (skillId === "cvc_short_vowels" || skillId === "short_vowel_discrimination" || skillId.includes("short vowel")) &&
    format === "SHORT_VOWEL_WORD" &&
    /\bwhich word has the short [aeiou] sound\b/.test(prompt)
  );
}

function isListenChooseVowelQuestion(question = {}) {
  const skillId = String(question.skillId || question.skill || question.skillName || "").toLowerCase();
  const format = String(question.formatType || question.templateType || "").toUpperCase();
  const prompt = String(question.prompt || question.question || "").toLowerCase();
  return (
    (skillId === "cvc_short_vowels" || skillId === "short_vowel_discrimination" || skillId.includes("short vowel")) &&
    format === "LISTEN_CHOOSE_VOWEL" &&
    prompt.includes("which vowel sound do you hear")
  );
}

function getShortVowelTarget(question = {}, answer = "") {
  const prompt = String(question.prompt || question.question || "").toLowerCase();
  return (
    prompt.match(/\bshort ([aeiou]) sound\b/)?.[1] ||
    String(question.medialVowel || question.shortVowel || question.itemKey || "").toLowerCase().match(/[aeiou]/)?.[0] ||
    getFirstVowelLetter(answer)
  );
}

function buildShortVowelWordOption(word, existingOption = {}) {
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

function normalizeShortVowelWordCategoryOptions(rawQuestion = {}, answerOptions = [], correctAnswer = "") {
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

function normalizeContentQuestion(question) {
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

function normalizeAssessmentQuestion(rawQuestion, fallbackSkillId = null, index = 0) {
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

function AssessmentErrorBoundary({ children, resetKey, returnToStudentOverview, isTransient = false }) {
  return (
    <ErrorBoundary
      logLabel="Assessment screen crashed before fallback."
      resetKey={resetKey}
      fallback={({ error }) => (
        <main className="assessment-shell">
          <div className="card assessment-card assessment-loading-card">
            {isTransient ? (
              <>
                <div className="assessment-loading-mark" aria-hidden="true">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <h2>Next question is getting ready...</h2>
                {import.meta.env.DEV && <p className="muted-text">{error.message}</p>}
              </>
            ) : (
              <>
                <h2>Assessment paused.</h2>
                <p>Please return to the student overview and start this round again.</p>
                {import.meta.env.DEV && <p>{error.message}</p>}
                <button className="main-button" onClick={returnToStudentOverview} type="button">
                  Return to Student Overview
                </button>
              </>
            )}
          </div>
        </main>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

async function createExcelWorkbook() {
  const metricDefinitions = await importWithRetry(() => import("./utils/metricDefinitions.js"));
  return metricDefinitions.createDefinedExcelWorkbook(importWithRetry);
}

async function addWorkbookExportProvenance(workbook, preset, context) {
  const provenance = await importWithRetry(() => import("./utils/exportProvenance.js"));
  return provenance.addPresetExportProvenanceWorksheet(workbook, preset, context);
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

function safeExportFilename(value = "Student") {
  return String(value || "Student")
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "")
    .replace(/\s+/g, " ")
    .trim() || "Student";
}

function formatExportDateForFilename(date = new Date()) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

function formatReportDate(value = "") {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
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

  return runtimeQuestionCache.find(question =>
    (skillTree[getStageIndex(question)]?.label || question.skill) === stage &&
    getRuntimeQuestionPromptAnswerSignature(question) === promptAnswerSignature
  );
}

function normalizeAnswerRecordShape(record = {}) {
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

function applyItemMetadata(question) {
  const metadata = inferItemMetadata(question);
  return metadata
    ? { ...question, itemKey: metadata.itemKey, itemType: metadata.itemType }
    : question;
}

function isMissingTableError(error, tableName) {
  return error?.code === "42P01" || new RegExp("relation .*" + tableName + ".* does not exist", "i").test(error?.message || "");
}

function isApprovalSchemaError(error) {
  return isMissingTableError(error, "pending_teacher_accounts") ||
    error?.code === "42703" ||
    /column .* does not exist|schema cache|pending_teacher_accounts/i.test(error?.message || "");
}

function isDuplicateAuthSignupError(error, data = null) {
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

function isSupabasePermissionError(error) {
  const text = [
    error?.code,
    error?.message,
    error?.details,
    error?.hint
  ].filter(Boolean).join(" ");

  return /42501|permission denied|row-level security|rls|not authorized|not allowed/i.test(text);
}

function logAdminSupabaseError(label, error, context = {}) {
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

function getAdminSetupMessage(error, tableName) {
  if (isMissingTableError(error, tableName)) {
    return `Admin setup is incomplete: the Supabase table "${tableName}" is missing. Apply the admin dashboard migration.`;
  }

  if (isSupabasePermissionError(error)) {
    return `Admin setup needs attention: Supabase RLS or permissions are blocking access to "${tableName}".`;
  }

  return `Could not load admin dashboard because "${tableName}" returned a Supabase error.`;
}

function isMissingItemMasteryTableError(error) {
  return isMissingTableError(error, "item_mastery");
}

function isInvalidRefreshTokenError(error) {
  return /invalid refresh token|refresh token not found/i.test(error?.message || "");
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

function isQuestionValid(q, options = {}) {
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

function dedupeQuestionsByRuntimeSignature(questions) {
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

const GENERATED_REPLACEMENT_SOURCE = "skill_level_depth_gap_generator";
const APPROVED_REPLACEMENT_SOURCES = new Set([
  GENERATED_REPLACEMENT_SOURCE,
  "assessment_qa_replacement_2026_06",
  "high_quality_comprehension_replacement_2026_06",
  "skill_word_bank_workbook"
]);
const REPLACED_LEGACY_ASSESSMENT_SKILLS = new Set([
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

const MEDIA_QA_BLOCKING_STATUSES = new Set([
  "rejected",
  "blocked",
  "needs_kimi",
  "deleted",
  "needs_media_replacement",
  "needs_image_replacement",
  "needs_audio_replacement"
]);

function isQuestionBlockedByMediaQa(question = {}) {
  return MEDIA_QA_BLOCKING_STATUSES.has(question.qaStatus);
}

function normalizeRuntimeSkillId(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function isGeneratedReplacementQuestion(question = {}) {
  return APPROVED_REPLACEMENT_SOURCES.has(question.source) ||
    question.tags?.includes("generated-gap");
}

function keepRuntimeQuestion(question = {}) {
  const skillId = normalizeRuntimeSkillId(question.skillId || question.assessmentSkillId || question.skillName || question.skill || "");
  if (!isLevelOneContentQualityAllowed(question)) return false;
  if (!REPLACED_LEGACY_ASSESSMENT_SKILLS.has(skillId)) return true;
  return isGeneratedReplacementQuestion(question);
}

function prepareRuntimeQuestionBank(questions = [], options = {}) {
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

const startupQuestions = [];
let runtimeQuestionCache = startupQuestions;

const configuredCoverageTotals = coverageExpectations;

function getConfiguredPhaseItemKeys(stage, level, phase) {
  const configured = configuredCoverageTotals[stage?.id];
  const normalizedLevel = Number(level || 1) >= 2 ? 2 : 1;
  const normalizedPhase = Number(phase || 1) === 2 ? 2 : 1;
  return configured?.phases?.[normalizedLevel]?.[normalizedPhase] || null;
}

function getCoverageItemKeysForStage(stage, { finalSoundLevel = null, level = null, phase = null } = {}) {
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

function getItemMasteryStateKeyForValues(itemKey, itemType) {
  return normalizeItemKey(itemType) + "::" + normalizeItemKey(itemKey);
}

function buildCoverageSnapshot(itemMasteryRows = {}, debugContext = null, answerRecords = []) {
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

function buildQuestionBankCoverage(questions = []) {
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

  return Array.from(rowsBySkill.values()).sort((a, b) => a.skill.localeCompare(b.skill));
}

const letterAssessmentOrder = [
  "m", "T", "b", "S", "a", "F", "d", "R", "p", "E", "g", "H", "c",
  "M", "t", "B", "s", "A", "f", "D", "r", "P", "e", "G", "h", "C",
  "y", "K", "o", "J", "w", "Z", "x", "V", "l", "N", "q", "U", "i",
  "Y", "k", "O", "j", "W", "z", "X", "v", "L", "n", "Q", "u", "I"
];

export default function App() {
  const [studentSessionName, setStudentSessionName] = useState("");
  const [studentSessionId, setStudentSessionId] = useState(null);
  const [teacherStudentContext, setTeacherStudentContext] = useState({
    studentId: null,
    studentName: ""
  });
  const [teacherGroupId, setTeacherGroupId] = useState("all");
  const [sessionMode, setSessionMode] = useState("teacher");
  const studentName = sessionMode === "student"
    ? studentSessionName
    : teacherStudentContext.studentName;
  const studentId = sessionMode === "student"
    ? studentSessionId
    : teacherStudentContext.studentId;
  const [studentList, setStudentList] = useState([]);
  const [archivedStudentList, setArchivedStudentList] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [classList, setClassList] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [newClassName, setNewClassName] = useState("");
  const [classDashboard, setClassDashboard] = useState([]);
  const [appView, rawSetAppView] = useState(APP_VIEWS.SELECT);
  const [studentPreview, setStudentPreview] = useState(null);
  const [studentPreviewStatus, setStudentPreviewStatus] = useState("");
  const [studentReportView, setStudentReportView] = useState("whole-child");
  const [selectedStudentEvidenceReady, setSelectedStudentEvidenceReady] = useState(true);
  const [selectedStudentEvidenceReadState, setSelectedStudentEvidenceReadState] = useState({
    completedAt: "",
    syncStatus: "not_recorded",
    sources: {}
  });

  // Page changes MORPH instead of cutting. document.startViewTransition
  // snapshots the old frame and cross-fades to the new one (duration set in
  // App.css on ::view-transition-*). Engines without the API — and children
  // who ask for reduced motion — get exactly the instant swap they get today:
  // the wrapper is pure progressive enhancement around the raw setter.
  const setAppView = useCallback(next => {
    if (
      typeof document !== "undefined"
      && typeof document.startViewTransition === "function"
      && !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      try {
        const transition = document.startViewTransition(() => {
          flushSync(() => rawSetAppView(next));
        });
        for (const transitionPhase of [
          transition.ready,
          transition.updateCallbackDone,
          transition.finished
        ]) {
          void transitionPhase.catch(error => {
            if (error?.name !== "AbortError") {
              console.error("Page view transition failed.", error);
            }
          });
        }
      } catch (error) {
        console.warn("Page view transition could not start; using an immediate route change.", error);
        rawSetAppView(next);
      }
      return;
    }
    rawSetAppView(next);
  }, []);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);
  const [currentSkillIndex, setCurrentSkillIndex] = useState(0);
  const [roundAnswers, setRoundAnswers] = useState([]);
  const [roundItemKeys, setRoundItemKeys] = useState([]);
  const [roundQuestionIds, setRoundQuestionIds] = useState([]);
  const [usedByStage, setUsedByStage] = useState({});
  const [mastery, setMastery] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [assessmentTransitioning, setAssessmentTransitioning] = useState(false);
  const [message, setMessage] = useState("");
  const [teacherUser, setTeacherUser] = useState(null);
  const [studentSession, setStudentSession] = useState(null);
  const [entryMode, setEntryMode] = useState("entry");
  const [authReady, setAuthReady] = useState(false);
  const [authReconnecting, setAuthReconnecting] = useState(false);
  const [chunkLoadFailure, setChunkLoadFailure] = useState(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authUsername, setAuthUsername] = useState("");
  const [authDisplayName, setAuthDisplayName] = useState("");
  const [authSchoolName, setAuthSchoolName] = useState("");
  const [authMode, setAuthMode] = useState("login");
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [teacherAccountStatus, setTeacherAccountStatus] = useState("signed_out");
  const [teacherAccountRecord, setTeacherAccountRecord] = useState(null);
  const [teacherSchoolName, setTeacherSchoolName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminStatusError, setAdminStatusError] = useState(null);
  const [adminTeachers, setAdminTeachers] = useState([]);
  const [adminClasses, setAdminClasses] = useState([]);
  const [adminStudents, setAdminStudents] = useState([]);
  const [adminSchools, setAdminSchools] = useState([]);
  const [adminPendingAccounts, setAdminPendingAccounts] = useState([]);
  const [adminPendingAccountsWarning, setAdminPendingAccountsWarning] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [correctAnswered, setCorrectAnswered] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [diagnosticFollowUp, setDiagnosticFollowUp] = useState(false);
  const [allowPassageAudio, setAllowPassageAudio] = useState(false);
  const [learnFullscreen, setLearnFullscreen] = useState(false);
  const [studentArcadeOpen, setStudentArcadeOpen] = useState(false);
  const [assessmentFullscreen, setAssessmentFullscreen] = useState(false);
  const prefersReducedMotion = useReducedMotion();

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

  // One serializable session powers every EL-aligned benchmark runner. It is
  // bound to a student id so a saved draft can never appear for the next child
  // selected on a shared teacher device.
  const [elBenchmarkSession, setElBenchmarkSession] =
    useState(null);
  const [elBenchmarkDraftSaveFailed, setElBenchmarkDraftSaveFailed] =
    useState(false);
  const [answerHistory, setAnswerHistory] = useState([]);
  const [assessmentHistory, setAssessmentHistory] = useState([]);
  const [guidedReadingRecords, setGuidedReadingRecords] = useState({});
  const [guidedInitialBookId, setGuidedInitialBookId] = useState("");
  const [itemMastery, setItemMastery] = useState({});
  const [itemSessionSeen, setItemSessionSeen] = useState({});
  const [allQuestions, setAllQuestions] = useState(startupQuestions);
  const [reportSkillMasterySummary, setReportSkillMasterySummary] = useState([]);
  const [checkpointDecision, setCheckpointDecision] = useState(null);
  const [resetProgressDialogOpen, setResetProgressDialogOpen] = useState(false);
  // Pending admin deletion awaiting styled confirmation: { kind, id, name }.
  const [adminConfirm, setAdminConfirm] = useState(null);
  const [adminConfirmBusy, setAdminConfirmBusy] = useState(false);
  const [resettingProgress, setResettingProgress] = useState(false);
  const assessmentResetAtByStudentRef = useRef(new Map());
  const answerInFlightRef = useRef(false);
  const letterAssessmentArchivedRef = useRef(false);
  const patternAssessmentArchivedRef = useRef(false);
  // Guards auto-advance setTimeout callbacks from firing after endAssessment is called.
  const assessmentActiveRef = useRef(false);
  const answerHistoryRef = useRef(answerHistory);
  const roundItemKeysRef = useRef(roundItemKeys);
  const roundQuestionIdsRef = useRef(roundQuestionIds);
  const allQuestionsRef = useRef(startupQuestions);
  const loadedAssessmentSkillBanksRef = useRef(new Set());
  const assessmentSkillBankPromisesRef = useRef(new Map());
  const assessmentWarmupStartedRef = useRef(false);
  const assessmentMediaPickerRef = useRef(null);
  const assessmentMediaUsageRef = useRef(null);
  const initialSoundRoundQueueRef = useRef([]);
  const initialSoundRoundMetaRef = useRef(null);
  const initialSoundForcedLevelRef = useRef(null);
  // Letters already asked in the current assessment round; cleared on every
  // fresh-round reset (via resetInitialSoundRoundQueue) so a mid-round queue
  // rebuild won't re-ask them.
  const initialSoundRoundAskedLettersRef = useRef(new Set());
  const lastAuthUserIdRef = useRef(null);
  const freshAuthActionRef = useRef(false);
  const freshLoginResetPendingRef = useRef(false);
  const authBootCompletedRef = useRef(false);
  const accountAccessCheckInFlightRef = useRef(false);
  const accountAccessCheckUserIdRef = useRef(null);
  const accountAccessCheckSeqRef = useRef(0);
  const isLearnView = appView === APP_VIEWS.LEARN || appView === APP_VIEWS.PHONICS_LEARN;
  const isStudentSurfaceView = isLearnView || appView === APP_VIEWS.STUDENT_REWARDS;

  useEffect(() => {
    function syncFullscreenState() {
      if (!document.fullscreenElement) {
        setLearnFullscreen(false);
        setAssessmentFullscreen(false);
      }
    }

    document.addEventListener("fullscreenchange", syncFullscreenState);
    return () => document.removeEventListener("fullscreenchange", syncFullscreenState);
  }, []);

  useEffect(() => {
    if (appView !== APP_VIEWS.PHONICS_LEARN) {
      setStudentArcadeOpen(false);
    }
  }, [appView]);

  useEffect(() => {
    const handleDynamicImportFailure = event => {
      setChunkLoadFailure(event.detail?.message || "A new version is available.");
    };

    window.addEventListener(DYNAMIC_IMPORT_ERROR_EVENT, handleDynamicImportFailure);
    return () => window.removeEventListener(DYNAMIC_IMPORT_ERROR_EVENT, handleDynamicImportFailure);
  }, []);

  // Drain any assessment saves that failed earlier (retries on reconnect/focus).
  useEffect(() => { startInsertQueueFlusher(); }, []);

  useEffect(() => {
    if (authReady) return undefined;
    const timeoutId = window.setTimeout(() => {
      setAuthReconnecting(true);
      setAuthMessage("Still reconnecting. You can continue while the session finishes loading.");
      setAuthReady(true);
    }, 6000);

    return () => window.clearTimeout(timeoutId);
  }, [authReady]);

  function enterLearnFullscreen() {
    setLearnFullscreen(true);
    document.documentElement.requestFullscreen?.().catch(() => {});
  }

  function exitLearnFullscreen() {
    setLearnFullscreen(false);
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
  }

  function toggleLearnFullscreen() {
    if (learnFullscreen) {
      exitLearnFullscreen();
    } else {
      enterLearnFullscreen();
    }
  }

  function enterAssessmentFullscreen() {
    setAssessmentFullscreen(true);
    document.documentElement.requestFullscreen?.().catch(() => {});
  }

  function exitAssessmentFullscreen() {
    setAssessmentFullscreen(false);
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
  }

  function toggleAssessmentFullscreen() {
    if (assessmentFullscreen) {
      exitAssessmentFullscreen();
    } else {
      enterAssessmentFullscreen();
    }
  }

  function renderLearnFullscreenButton() {
    return (
      <button
        className={`learn-fullscreen-toggle${learnFullscreen ? " active" : ""}`}
        onClick={toggleLearnFullscreen}
        type="button"
        aria-label={learnFullscreen ? "Exit full screen" : "Enter full screen"}
        title={learnFullscreen ? "Exit full screen" : "Full screen"}
      >
        {learnFullscreen ? (
          <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
            <path d="M8 8l8 8M16 8l-8 8" />
          </svg>
        ) : (
          <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
            <path d="M8 3H3v5M16 3h5v5M21 16v5h-5M8 21H3v-5" />
          </svg>
        )}
        <span>{learnFullscreen ? "Exit" : "Full screen"}</span>
      </button>
    );
  }

  function returnToStudentHome() {
    setStudentArcadeOpen(false);
    exitLearnFullscreen();
    setAppView(APP_VIEWS.STUDENT_HOME);
  }

  // Guard against an out-of-range index (e.g. drifted/restored data) so a bad
  // value can never throw at the top of render and white-screen the whole app.
  const currentStage = skillTree[currentSkillIndex]
    || skillTree[skillTree.length - 1]
    || { label: "" };

  const masteryRule =
    getMasteryRule(currentStage.label);

  const ROUND_LENGTH =
    masteryRule.roundLength;

  const PASS_SCORE =
    masteryRule.passScore;

  const currentStageQuestions = useMemo(() =>
    allQuestions.filter(q =>
      getStageIndex(q) === currentSkillIndex
    ),
  [allQuestions, currentSkillIndex]);

  const weaknessSnapshot = useMemo(() =>
    calculateWeaknessSnapshot(answerHistory),
  [answerHistory]);

  const teacherId =
    teacherUser?.id || null;

  async function getRuntimeQuestionValidationOptions(skillId = "") {
    if (!isHighFrequencyWordSkill(skillId)) return {};
    const { getHfwRuntimeEligibilityIssues } = await importWithRetry(() => import("./data/hfwRuntimeEligibility"));
    return { getHfwRuntimeEligibilityIssues };
  }

  async function ensureAssessmentMediaPicker() {
    if (!assessmentMediaPickerRef.current) {
      assessmentMediaPickerRef.current = await loadAssessmentMediaPickerModule();
    }
    if (!assessmentMediaUsageRef.current) {
      assessmentMediaUsageRef.current = assessmentMediaPickerRef.current.createAssessmentSessionMediaUsage();
    }
    return assessmentMediaPickerRef.current;
  }

  function resetAssessmentMediaUsage() {
    assessmentMediaUsageRef.current = assessmentMediaPickerRef.current
      ? assessmentMediaPickerRef.current.createAssessmentSessionMediaUsage()
      : null;
  }

  async function loadRuntimeQuestionsForSkill(skillOrStageId = "") {
    const skillId = normalizeRuntimeSkillId(skillOrStageId);
    if (!skillId || loadedAssessmentSkillBanksRef.current.has(skillId)) {
      return allQuestionsRef.current;
    }

    if (!assessmentSkillBankPromisesRef.current.has(skillId)) {
      const loadPromise = (async () => {
        const [loaderModule, validationOptions] = await Promise.all([
          loadAssessmentSkillBankLoaderModule(),
          getRuntimeQuestionValidationOptions(skillId)
        ]);
        const bank = await loaderModule.loadAssessmentSkillBank(skillId);
        const preparedQuestions = prepareRuntimeQuestionBank(bank, validationOptions);
        const nextQuestions = dedupeQuestionsByRuntimeSignature([
          ...allQuestionsRef.current,
          ...preparedQuestions
        ]);
        allQuestionsRef.current = nextQuestions;
        runtimeQuestionCache = nextQuestions;
        setAllQuestions(nextQuestions);
        loadedAssessmentSkillBanksRef.current.add(skillId);
        return nextQuestions;
      })().finally(() => {
        assessmentSkillBankPromisesRef.current.delete(skillId);
      });
      assessmentSkillBankPromisesRef.current.set(skillId, loadPromise);
    }

    return assessmentSkillBankPromisesRef.current.get(skillId);
  }

  function preloadAssessmentShellForStage(stage = currentStage) {
    if (!stage?.id) return;
    void loadRuntimeQuestionsForSkill(stage.id).catch(error => {
      console.warn("Could not preload assessment skill bank.", { skillId: stage.id, error });
    });
    void loadFinishedReportPageModule();
  }

  const preloadCurrentAssessmentShell = useEffectEvent(() => {
    preloadAssessmentShellForStage(currentStage);
  });

  const warmCurrentAssessmentBanks = useEffectEvent(async isCancelled => {
    // Warm only the banks a session is likely to reach first: the active
    // student's current + next stage, plus the first few foundational stages
    // most early readers sit in. Every other bank still loads on demand at
    // assessment start (see startAssessment / startTargetedReview), so this
    // trims eager downloads on low-end iPads without dropping any coverage.
    const activeIndex = Number.isInteger(currentSkillIndex) ? currentSkillIndex : 0;
    const priorityIndexes = new Set([activeIndex, activeIndex + 1, 0, 1, 2]);
    const stages = [...priorityIndexes]
      .filter(index => index >= 0 && index < skillTree.length)
      .map(index => skillTree[index]);
    for (const stage of stages) {
      if (isCancelled()) return;
      try {
        await loadRuntimeQuestionsForSkill(stage.id);
      } catch (error) {
        console.warn("Could not warm assessment skill bank.", { skillId: stage.id, error });
      }
    }
  });

  useEffect(() => {
    answerHistoryRef.current = answerHistory;
  }, [answerHistory]);

  useEffect(() => {
    allQuestionsRef.current = allQuestions;
    runtimeQuestionCache = allQuestions;
  }, [allQuestions]);

  useEffect(() => {
    if (!nameSaved || !currentStage?.id) return;
    preloadCurrentAssessmentShell();
  }, [nameSaved, currentStage?.id]);

  useEffect(() => {
    if (!authReady || !teacherId || assessmentWarmupStartedRef.current) return;
    if (!isAdmin && teacherAccountStatus !== "approved") return;

    assessmentWarmupStartedRef.current = true;
    let cancelled = false;
    const startWarmup = () => {
      void warmCurrentAssessmentBanks(() => cancelled);
    };
    const idleHandle = typeof window.requestIdleCallback === "function"
      ? window.requestIdleCallback(startWarmup, { timeout: 2500 })
      : window.setTimeout(startWarmup, 1200);

    return () => {
      cancelled = true;
      if (typeof window.cancelIdleCallback === "function" && typeof idleHandle === "number") {
        window.cancelIdleCallback(idleHandle);
      } else {
        window.clearTimeout(idleHandle);
      }
    };
  }, [authReady, teacherId, teacherAccountStatus, isAdmin]);

  useEffect(() => {
    if (!teacherId) {
      setAssessmentHistory([]);
      return undefined;
    }

    let cancelled = false;
    setAssessmentHistory(loadAssessmentAttempts({ teacherId }));
    void hydrateAssessmentAttempts({
      teacherId,
      supabase: isSupabaseConfigured ? supabase : null
    }).then(hydratedRecords => {
      if (cancelled) return;
      const resetCutoffs = assessmentResetAtByStudentRef.current;
      const currentRecords = hydratedRecords.filter(record => {
        const resetAt = resetCutoffs.get(String(record?.studentId || ""));
        if (!resetAt) return true;
        const recordTime = new Date(
          record.updatedAt || record.completedAt || record.startedAt || ""
        ).getTime();
        return Number.isFinite(recordTime) && recordTime > new Date(resetAt).getTime();
      });
      // A cloud history read may have started before another device wrote the
      // tombstone. Remove any pre-reset rows that this stale response briefly
      // merged back into the teacher-level browser cache before exposing it.
      for (const [resetStudentId, resetAt] of resetCutoffs) {
        deleteAssessmentAttemptsForStudent({
          teacherId,
          studentId: resetStudentId,
          resetAtOrBefore: resetAt
        });
      }
      // Use the complete cloud/local merge returned for this live session.
      // Reloading localStorage here could collapse a large class to the
      // quota-fallback cache even though the cloud query succeeded.
      setAssessmentHistory(currentRecords);
    });

    return () => {
      cancelled = true;
    };
  }, [teacherId]);

  useEffect(() => {
    if (!teacherId || teacherId === "local" || !isSupabaseConfigured || typeof window === "undefined") {
      return undefined;
    }
    const flushPendingAssessmentAttempts = () => {
      void flushAssessmentAttemptSyncQueue({ teacherId, supabase }).then(result => {
        if (!result.flushed || result.remaining) return;
        setMessage(current => current.includes("Cloud sync is pending")
          ? "Assessment cloud sync completed. The secure report copy is up to date."
          : current);
      });
    };
    window.addEventListener("online", flushPendingAssessmentAttempts);
    return () => window.removeEventListener("online", flushPendingAssessmentAttempts);
  }, [teacherId]);

  // A reset can arrive while another signed-in device still has this learner
  // open. The progress synchroniser clears durable browser caches first, then
  // emits this event so React cannot retain and later re-save the stale draft
  // or archived attempt list from memory.
  useEffect(() => {
    function handleRemoteProgressHydration(event) {
      const resetStudentId = event.detail?.resetApplied
        ? String(event.detail?.studentId || "")
        : "";
      if (!resetStudentId) return;
      const resetAt = event.detail?.rows?.find(row => row.area === RESET_AREA)?.payload?.at || "";
      if (resetAt) assessmentResetAtByStudentRef.current.set(resetStudentId, resetAt);

      setAssessmentHistory(previous => previous.filter(record => (
        String(record?.studentId || "") !== resetStudentId
      )));
      setElBenchmarkSession(previous => (
        previous?.studentId === resetStudentId ? null : previous
      ));

      if (String(studentId || "") === resetStudentId) {
        setElBenchmarkDraftSaveFailed(false);
        if (appView === APP_VIEWS.EL_BENCHMARK) {
          setAppView(APP_VIEWS.EL_ASSESSMENTS);
        }
        setMessage("This student's progress was reset on another device. Local assessment drafts and reports were cleared.");
      }
    }

    window.addEventListener("lp-progress-hydrated", handleRemoteProgressHydration);
    return () => window.removeEventListener("lp-progress-hydrated", handleRemoteProgressHydration);
  }, [appView, studentId, setAppView]);

  useEffect(() => {
    roundItemKeysRef.current = roundItemKeys;
  }, [roundItemKeys]);

  useEffect(() => {
    roundQuestionIdsRef.current = roundQuestionIds;
  }, [roundQuestionIds]);

  useEffect(() => {
    if (!currentQuestion || !isFocusedAssessmentView(appView)) return;
    void preloadQuestionMedia(currentQuestion, {
      role: "focused-current",
      source: "assessment-current-question-effect"
    });
  }, [appView, currentQuestion]);

  const profileStorageKey =
    getTeacherProfileStorageKey(teacherId);

  function applyStudentSession(session) {
    if (!session?.token || !session?.studentId) return;
    setLetterIndex(0);
    setLetterAssessment([]);
    setPatternIndex(0);
    setPatternAssessment([]);
    setPatternAttempt(0);
    setElBenchmarkSession(null);
    setSessionMode("student");
    setStudentSession(session);
    setStudentSessionId(session.studentId);
    setStudentSessionName(session.studentName || "Reader");
    setSelectedClassId(session.classId || null);
    setNameSaved(true);
    setAppView(APP_VIEWS.STUDENT_HOME);
    setMessage("");
    try {
      configureProgressSync({ ...session, mode: "student" });
    } catch (error) {
      console.warn("Could not configure progress sync for student session.", error);
    }
    try {
      localStorage.setItem(STUDENT_SESSION_STORAGE_KEY, JSON.stringify(session));
    } catch {
      // Student session restore is a convenience; RPC token validation still happens server-side.
    }
    void hydrateCloudProgress({ ...session, mode: "student" }).catch(error => {
      console.warn("Could not hydrate student cloud progress.", error);
    });
  }

  function restoreStudentSession() {
    try {
      const session = JSON.parse(localStorage.getItem(STUDENT_SESSION_STORAGE_KEY) || "null");
      if (!session?.token || !session?.studentId) return false;
      if (session.expiresAt && Date.now() > Number(session.expiresAt)) {
        localStorage.removeItem(STUDENT_SESSION_STORAGE_KEY);
        return false;
      }
      applyStudentSession(session);
      return true;
    } catch {
      return false;
    }
  }

  const restoreLatestStudentSession = useEffectEvent(restoreStudentSession);

  function exitToTeacherEntry() {
    // Fully clear any student session first, otherwise the student-mode
    // guard bounces navigation straight back to student screens.
    try {
      localStorage.removeItem(STUDENT_SESSION_STORAGE_KEY);
    } catch {
      // Ignore local storage failures.
    }
    clearProgressSyncSession();
    setStudentSession(null);
    setStudentSessionId(null);
    setStudentSessionName("");
    setElBenchmarkSession(null);
    setNameSaved(false);
    setSessionMode("teacher");
    setEntryMode("teacher");
    setAppView(teacherUser ? APP_VIEWS.TEACHER_DASHBOARD : APP_VIEWS.ENTRY);
  }

  function logOutStudent() {
    if (window.confirm("Are you leaving?")) {
      try {
        localStorage.removeItem(STUDENT_SESSION_STORAGE_KEY);
      } catch {
        // Ignore local storage failures.
      }
      clearProgressSyncSession();
      setSessionMode("teacher");
      setStudentSession(null);
      setStudentSessionId(null);
      setStudentSessionName("");
      setSelectedClassId(null);
      setNameSaved(false);
      setGuidedReadingRecords({});
      setLetterIndex(0);
      setLetterAssessment([]);
      setPatternIndex(0);
      setPatternAssessment([]);
      setPatternAttempt(0);
      setElBenchmarkSession(null);
      setAppView(teacherUser ? APP_VIEWS.TEACHER_DASHBOARD : APP_VIEWS.ENTRY);
      setEntryMode(teacherUser ? "teacher" : "entry");
    }
  }

  useEffect(() => {
    if (!authReady || teacherUser || studentSession) return;
    const timeoutId = window.setTimeout(() => restoreLatestStudentSession(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [authReady, teacherUser, studentSession]);

  useEffect(() => {
    if (sessionMode !== "student") return;
    if (!isStudentAllowedView(appView)) {
      const timeoutId = window.setTimeout(() => setAppView(APP_VIEWS.STUDENT_HOME), 0);
      return () => window.clearTimeout(timeoutId);
    }
    return undefined;
  }, [sessionMode, appView, setAppView]);

  useEffect(() => {
    function handlePreviewWriteBlocked(event) {
      if (!studentPreview || event.detail?.studentId !== studentPreview.studentId) return;
      setStudentPreviewStatus("Preview activity was blocked and was not saved to the learner record.");
    }
    window.addEventListener("lp-preview-write-blocked", handlePreviewWriteBlocked);
    return () => window.removeEventListener("lp-preview-write-blocked", handlePreviewWriteBlocked);
  }, [studentPreview]);

  function getGuidedReadingStorageKey(selectedStudentId = studentId) {
    // TODO(guided-reading-persistence): Move these records into Supabase once a stable table/schema is approved.
    return getGuidedReadingStorageKeyForSession({ teacherId, studentId: selectedStudentId });
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
      queueProgressSave("guided_reading", bookId, { v: 1, ...record }, { scopeKey: studentId });
      return next;
    });
  }

  function clearTeacherState() {
    setStudentSessionName("");
    setStudentSessionId(null);
    setTeacherStudentContext({ studentId: null, studentName: "" });
    setTeacherGroupId("all");
    setStudentList([]);
    setArchivedStudentList([]);
    setClassList([]);
    setSelectedClassId(null);
    setNewClassName("");
    setClassDashboard([]);
    setAppView(APP_VIEWS.SELECT);
    setNameSaved(false);
    setCurrentSkillIndex(0);
    setRoundAnswers([]);
    setRoundItemKeys([]);
    setRoundQuestionIds([]);
    setUsedByStage({});
    setMastery({});
    setCurrentQuestion(null);
    setFeedback(null);
    setAssessmentTransitioning(false);
    setMessage("");
    setAdminTeachers([]);
    setAdminClasses([]);
    setAdminStudents([]);
    setAdminPendingAccounts([]);
    setAdminPendingAccountsWarning("");
    setIsAdmin(false);
    setTotalAnswered(0);
    setCorrectAnswered(0);
    setDiagnosticFollowUp(false);
    setAssessmentMode("mastery");
    setLetterIndex(0);
    setLetterAssessment([]);
    setPatternIndex(0);
    setPatternAssessment([]);
    setPatternAttempt(0);
    setElBenchmarkSession(null);
    setAnswerHistory([]);
    setAssessmentHistory([]);
    setGuidedReadingRecords({});
    setItemMastery({});
    setItemSessionSeen({});
    setCheckpointDecision(null);
    setResetProgressDialogOpen(false);
    setResettingProgress(false);
    resetInitialSoundRoundQueue();
    initialSoundRoundMetaRef.current = null;
    answerInFlightRef.current = false;
  }

  function resetSelectedStudentOnLogin() {
    setTeacherStudentContext({ studentId: null, studentName: "" });
    setTeacherGroupId("all");
    setNameSaved(false);
    setAppView(APP_VIEWS.SELECT);
    setRoundAnswers([]);
    setRoundItemKeys([]);
    setRoundQuestionIds([]);
    setCurrentQuestion(null);
    setFeedback(null);
    setAssessmentTransitioning(false);
    setDiagnosticFollowUp(false);
    setGuidedReadingRecords({});
    setItemSessionSeen({});
    setCheckpointDecision(null);
    setLetterIndex(0);
    setLetterAssessment([]);
    setPatternIndex(0);
    setPatternAssessment([]);
    setPatternAttempt(0);
    setElBenchmarkSession(null);
    resetInitialSoundRoundQueue();
    initialSoundRoundMetaRef.current = null;
    roundItemKeysRef.current = [];
    roundQuestionIdsRef.current = [];

    try {
      ["selectedStudent", "currentStudent", "studentId", "studentName"].forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
    } catch (error) {
      console.warn("Could not clear stale selected student storage.", error);
    }
  }

  useEffect(() => {
    let isMounted = true;

    function applyAuthSession(session, event = "") {
      if (!isMounted) return;

      const nextUser = session?.user || null;
      const nextUserId = nextUser?.id || null;
      const previousUserId = lastAuthUserIdRef.current;
      const isBackgroundSameUserRefresh =
        Boolean(nextUserId && nextUserId === previousUserId && authBootCompletedRef.current);

      if (event === "SIGNED_IN" && nextUserId && freshAuthActionRef.current) {
        freshLoginResetPendingRef.current = true;
        freshAuthActionRef.current = false;
      } else if (!nextUserId || event === "SIGNED_OUT") {
        freshAuthActionRef.current = false;
      }

      if (!nextUserId || event === "SIGNED_OUT") {
        lastAuthUserIdRef.current = null;
        setTeacherUser(null);
        setTeacherAccountRecord(null);
        setTeacherAccountStatus("signed_out");
        setAuthReady(true);
        authBootCompletedRef.current = true;
        return;
      }

      lastAuthUserIdRef.current = nextUserId;
      setTeacherUser(nextUser);
      if (!isBackgroundSameUserRefresh) {
        setTeacherAccountRecord(null);
        setTeacherAccountStatus("checking");
      } else if (import.meta.env.DEV) {
        console.debug("Background auth refresh completed without blocking the current screen.", { event, userId: nextUserId });
      }
      if (event === "PASSWORD_RECOVERY") {
        setAuthMode("resetPassword");
        setAuthMessage("Enter a new password for your account.");
      }
      setAuthReady(true);
      authBootCompletedRef.current = true;
    }

    supabase.auth.getSession()
      .then(({ data }) => {
        applyAuthSession(data?.session || null);
      })
      .catch(error => {
        console.error("Supabase auth session startup failed:", error);
        if (isInvalidRefreshTokenError(error)) {
          supabase.auth.signOut({ scope: "local" }).catch(signOutError => {
            console.warn("Could not clear invalid local auth session.", signOutError);
          });
        }
        applyAuthSession(null);
      });

    const { data: authListener } =
      supabase.auth.onAuthStateChange((event, session) => {
        applyAuthSession(session, event);
      });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const refreshTeacherAccountAccess = useEffectEvent(initializeTeacherAccountAccess);
  const refreshAdminDashboard = useEffectEvent(loadAdminDashboard);

  useEffect(() => {
    if (!teacherId) {
      setIsAdmin(false);
      setAdminStatusError(null);
      setTeacherAccountStatus("signed_out");
      setTeacherAccountRecord(null);
      return;
    }

    refreshTeacherAccountAccess(teacherId);
  }, [teacherId]);

  useEffect(() => {
    if (isAdmin && appView === APP_VIEWS.ADMIN_DASHBOARD) {
      refreshAdminDashboard();
    }
  }, [isAdmin, appView]);

  const restoreTeacherProfile = useEffectEvent(() => {
    if (!authReady) return;

    setProfileLoaded(false);

    if (sessionMode === "student") {
      setProfileLoaded(true);
      return;
    }

    if (!teacherId || !profileStorageKey) {
      clearTeacherState();
      setProfileLoaded(true);
      return;
    }

    if (teacherAccountStatus === "checking") return;

    if (!isTeacherAccountApproved()) {
      setProfileLoaded(true);
      return;
    }

    loadClasses();

    const saved = localStorage.getItem(profileStorageKey);

    if (saved) {
      try {
        const data = JSON.parse(saved);
        const savedClassId = data.selectedClassId || null;

        const isFreshLoginRestore = freshLoginResetPendingRef.current;
        if (isFreshLoginRestore) {
          freshLoginResetPendingRef.current = false;
          resetSelectedStudentOnLogin();
          setSelectedClassId(null);
          setAssessmentMode("mastery");
          setCurrentSkillIndex(0);
          setRoundAnswers([]);
          setUsedByStage({});
          setMastery({});
          setTotalAnswered(0);
          setCorrectAnswered(0);
          setLetterIndex(0);
          setLetterAssessment([]);
          setPatternIndex(0);
          setPatternAssessment([]);
          setPatternAttempt(0);
          setElBenchmarkSession(null);
          setAnswerHistory([]);
          answerHistoryRef.current = [];
          setItemMastery({});
          loadStudents();
          setProfileLoaded(true);
          return;
        }

        setSelectedClassId(savedClassId);
        setAssessmentMode(data.assessmentMode || "mastery");
        const restoredSkillIndex = Math.min(
          Math.max(0, Number(data.currentSkillIndex) || 0),
          skillTree.length - 1
        );
        const restoredRoundAnswers = Array.isArray(data.roundAnswers) ? data.roundAnswers : [];
        const restoredStudentId = data.teacherStudentId || data.studentId || null;
        const restoredStudentName = data.teacherStudentName || data.studentName || "";
        const legacyElBenchmarkSession =
          restoredStudentId && data.elBenchmarkSession?.studentId === restoredStudentId
            ? data.elBenchmarkSession
            : null;
        let restoredElBenchmarkSession = restoredStudentId
          ? loadElBenchmarkDraft({ teacherId, studentId: restoredStudentId }) || legacyElBenchmarkSession
          : null;
        if (legacyElBenchmarkSession && restoredElBenchmarkSession === legacyElBenchmarkSession) {
          saveElBenchmarkDraft({
            teacherId,
            studentId: restoredStudentId,
            session: legacyElBenchmarkSession
          });
        }
        const hashRestoredSession = restoreElBenchmarkSessionFromHash({
          hash: window.location.hash,
          session: restoredElBenchmarkSession,
          studentId: restoredStudentId
        });
        if (hashRestoredSession) restoredElBenchmarkSession = hashRestoredSession;
        const requestedRestoredAppView = getRestoredAppView({
          restoredStudentId,
          storedAppView: hashRestoredSession ? APP_VIEWS.EL_BENCHMARK : data.appView
        });
        const restoredAppView = requestedRestoredAppView === APP_VIEWS.EL_BENCHMARK && !restoredElBenchmarkSession
          ? APP_VIEWS.EL_ASSESSMENTS
          : requestedRestoredAppView;

        setTeacherStudentContext({
          studentId: restoredStudentId,
          studentName: restoredStudentName
        });
        setTeacherGroupId(data.teacherGroupId || "all");
        setNameSaved(Boolean(restoredStudentId && restoredStudentName));
        // Profile restoration is state hydration, not visible navigation.
        // Apply it synchronously so a view-transition callback cannot lose a
        // race to the post-auth "open Today" fallback.
        rawSetAppView(restoredAppView);
        setCurrentSkillIndex(restoredSkillIndex);
        // Restore the round's repeat-guard memory alongside its answers: the
        // in-round dedupe and coverage scoring index these arrays against
        // roundAnswers, so they must stay the same length and order.
        const restoredRoundItemKeys = Array.isArray(data.roundItemKeys)
          ? data.roundItemKeys.slice(0, restoredRoundAnswers.length)
          : [];
        const restoredRoundQuestionIds = Array.isArray(data.roundQuestionIds)
          ? data.roundQuestionIds.slice(0, restoredRoundAnswers.length)
          : [];
        setRoundAnswers(restoredRoundAnswers);
        setRoundItemKeys(restoredRoundItemKeys);
        setRoundQuestionIds(restoredRoundQuestionIds);
        roundItemKeysRef.current = restoredRoundItemKeys;
        roundQuestionIdsRef.current = restoredRoundQuestionIds;
        setUsedByStage(data.usedByStage || {});
        setMastery(data.mastery || {});
        setTotalAnswered(data.totalAnswered || 0);
        setCorrectAnswered(data.correctAnswered || 0);
        // Formal assessment state is student-scoped. Old profile payloads did
        // not carry a session owner, so only restore their letter/pattern
        // drafts when a student is actually selected.
        setLetterIndex(restoredStudentId ? data.letterIndex || 0 : 0);
        setLetterAssessment(restoredStudentId && Array.isArray(data.letterAssessment) ? data.letterAssessment : []);
        setPatternIndex(restoredStudentId ? data.patternIndex || 0 : 0);
        setPatternAssessment(restoredStudentId && Array.isArray(data.patternAssessment) ? data.patternAssessment : []);
        setPatternAttempt(restoredStudentId ? data.patternAttempt || 0 : 0);
        setElBenchmarkSession(restoredElBenchmarkSession);
        const restoredAnswerHistory = restoredStudentId && Array.isArray(data.answerHistory) ? data.answerHistory : [];
        setAnswerHistory(restoredAnswerHistory);
        answerHistoryRef.current = restoredAnswerHistory;
        setGuidedReadingRecords(restoredStudentId ? loadGuidedReadingRecords(restoredStudentId) : {});
        setItemMastery(data.itemMastery || {});
        setItemSessionSeen({});
        setFeedback(null);
        setCurrentQuestion(null);

        loadStudents(savedClassId);
        loadClassDashboard(savedClassId);
        if (restoredAppView === APP_VIEWS.ASSESSMENT) {
          // Without this flag the correct-answer auto-advance timeout bails out
          // and the restored session soft-locks on the feedback screen.
          assessmentActiveRef.current = true;
          setAssessmentTransitioning(true);
          setTimeout(() => {
            pickQuestion(data.assessmentMode || "mastery", restoredSkillIndex);
          }, 0);
        }
      } catch (error) {
        console.warn("Could not restore saved reading profile.", error);
        localStorage.removeItem(profileStorageKey);
        loadStudents();
      }
    } else {
      freshLoginResetPendingRef.current = false;
      resetSelectedStudentOnLogin();
      loadStudents();
    }

    setProfileLoaded(true);
  });

  useEffect(() => {
    restoreTeacherProfile();
  }, [authReady, teacherId, profileStorageKey, teacherAccountStatus, isAdmin, sessionMode, setAppView]);

  const buildLatestSkillMasterySummary = useEffectEvent(buildSkillMasterySummary);

  useEffect(() => {
    if (!profileLoaded || !profileStorageKey || sessionMode === "student") return;

    localStorage.setItem(
      profileStorageKey,
      JSON.stringify({
        teacherStudentName: studentName,
        teacherStudentId: studentId,
        teacherGroupId,
        selectedClassId,
        appView: getPersistedAppView({ studentId, appView }),
        assessmentMode,
        currentSkillIndex,
        roundAnswers,
        roundItemKeys,
        roundQuestionIds,
        usedByStage,
        mastery,
        totalAnswered,
        correctAnswered,
        letterIndex,
        letterAssessment,
        patternIndex,
        patternAssessment,
        patternAttempt,
        answerHistory: studentId ? answerHistory : [],
        itemMastery
      })
    );
  }, [
    profileLoaded,
    sessionMode,
    studentName,
    studentId,
    teacherGroupId,
    selectedClassId,
    appView,
    assessmentMode,
    currentSkillIndex,
    roundAnswers,
    roundItemKeys,
    roundQuestionIds,
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

  useLayoutEffect(() => {
    if (sessionMode === "student" || !teacherId) return;

    const nextHash = appView === APP_VIEWS.EL_BENCHMARK
      ? elBenchmarkAssessmentHash({
          classId: selectedClassId,
          learnerId: studentId,
          session: elBenchmarkSession
        })
      : teacherIntentHash({
          appView: appView === APP_VIEWS.EL_ASSESSMENTS
            ? APP_VIEWS.TEACHER_ASSESS
            : appView,
          classId: selectedClassId,
          groupId: teacherGroupId,
          learnerId: studentId
        });
    if (!nextHash) return;
    if (window.location.hash !== nextHash) {
      window.history.replaceState(window.history.state, "", nextHash);
    }
  }, [
    appView,
    elBenchmarkSession,
    selectedClassId,
    sessionMode,
    studentId,
    teacherGroupId,
    teacherId
  ]);

  // Benchmark drafts are stored independently for each learner. A teacher can
  // switch learners or sign out without one child's draft being overwritten by
  // the next profile save; explicit discard/completion/reset removes the key.
  useEffect(() => {
    if (
      !profileLoaded ||
      sessionMode !== "teacher" ||
      !teacherId ||
      !studentId ||
      elBenchmarkSession?.studentId !== studentId
    ) return;
    const saved = saveElBenchmarkDraft({ teacherId, studentId, session: elBenchmarkSession });
    setElBenchmarkDraftSaveFailed(!saved);
  }, [profileLoaded, sessionMode, teacherId, studentId, elBenchmarkSession]);


  async function checkAdminStatus(userId = teacherId) {
    if (!userId) {
      setIsAdmin(false);
      setAdminStatusError(null);
      return false;
    }

    const { data, error } = await supabase
      .from("app_admins")
      .select("id, user_id, email")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      logAdminSupabaseError("Admin status check failed.", error, {
        table: "app_admins",
        userId,
        userEmail: teacherUser?.email
      });
      setAdminStatusError({ table: "app_admins", error });
      setIsAdmin(false);
      return false;
    }

    const nextIsAdmin = Boolean(data?.user_id);
    setAdminStatusError(null);
    setIsAdmin(nextIsAdmin);
    return nextIsAdmin;
  }

  function normalizeApprovalStatus(record, fallback = "pending") {
    return record?.approval_status || record?.status || fallback;
  }

  function buildPendingAccountRecord(userId, email, overrides = {}) {
    const metadata = teacherUser?.user_metadata || {};
    const username =
      overrides.username ||
      metadata.username ||
      email?.split("@")[0]?.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 30) ||
      "";
    const displayName =
      overrides.display_name ||
      overrides.displayName ||
      metadata.display_name ||
      metadata.name ||
      username;
    const now = new Date().toISOString();

    return {
      user_id: userId,
      email,
      username,
      display_name: displayName,
      name: displayName || username,
      role: "pending",
      status: "pending",
      approval_status: "pending",
      school_id: overrides.school_id || metadata.school_id || null,
      created_at: overrides.created_at || now,
      requested_at: overrides.requested_at || now
    };
  }

  function isTeacherAccountApproved() {
    return isAdmin || teacherAccountStatus === "approved";
  }

  async function fetchTeacherAccountRecord(userId) {
    return supabase
      .from("pending_teacher_accounts")
      .select("id, user_id, email, username, display_name, name, role, status, approval_status, school_id, created_at, requested_at, reviewed_at, reviewed_by, approved_at, approved_by, rejected_at, rejected_by, rejection_reason")
      .eq("user_id", userId)
      .maybeSingle();
  }

  async function applyTeacherAccountStatusResult(userId, email, result = {}) {
    const { data, error } = result;
    if (error) {
      if (!isApprovalSchemaError(error)) {
        console.warn("Teacher account status check failed.", error);
      }
      setTeacherAccountStatus("approval_setup_required");
      setTeacherAccountRecord({
        user_id: userId,
        email,
        status: "approval_setup_required",
        approval_status: "approval_setup_required"
      });
      return "approval_setup_required";
    }

    if (!data) {
      const pendingRecord = buildPendingAccountRecord(userId, email);
      const { data: insertedRecord, error: insertError } = await supabase
        .from("pending_teacher_accounts")
        .upsert(pendingRecord, { onConflict: "user_id" })
        .select("id, user_id, email, username, display_name, name, role, status, approval_status, school_id, created_at, requested_at, reviewed_at, reviewed_by, approved_at, approved_by, rejected_at, rejected_by, rejection_reason")
        .maybeSingle();

      if (!insertError) {
        const nextRecord = insertedRecord || pendingRecord;
        setTeacherAccountStatus("pending");
        setTeacherAccountRecord(nextRecord);
        return "pending";
      }

      if (!isApprovalSchemaError(insertError)) {
        console.warn("Could not create pending teacher account record.", insertError);
      }

      setTeacherAccountStatus("approval_setup_required");
      setTeacherAccountRecord({
        user_id: userId,
        email,
        status: "approval_setup_required",
        approval_status: "approval_setup_required"
      });
      return "approval_setup_required";
    }

    const nextStatus = normalizeApprovalStatus(data);
    setTeacherAccountStatus(nextStatus);
    setTeacherAccountRecord(data);
    return nextStatus;
  }

  async function loadTeacherAccountStatus(userId = teacherId, email = teacherUser?.email, adminAccess = isAdmin) {
    if (!userId) {
      setTeacherAccountStatus("signed_out");
      setTeacherAccountRecord(null);
      return "signed_out";
    }

    if (adminAccess) {
      // Admins bypass approval, but still have a real account row holding their
      // saved school_id. Read it so the dashboard reflects the saved school
      // (otherwise it always shows "Not set" even though child login works).
      let adminSchoolId = null;
      try {
        const { data: adminRecord } = await fetchTeacherAccountRecord(userId);
        adminSchoolId = adminRecord?.school_id || null;
      } catch {
        // School lookup is best-effort; never block admin access on it.
      }
      setTeacherAccountStatus("approved");
      setTeacherAccountRecord({
        user_id: userId,
        email,
        role: "admin",
        status: "approved",
        approval_status: "approved",
        admin: true,
        school_id: adminSchoolId
      });
      return "approved";
    }

    return applyTeacherAccountStatusResult(userId, email, await fetchTeacherAccountRecord(userId));
  }

  async function initializeTeacherAccountAccess(userId = teacherId) {
    if (!userId) return;

    if (accountAccessCheckInFlightRef.current && accountAccessCheckUserIdRef.current === userId) {
      if (import.meta.env.DEV) {
        console.debug("Account access check skipped because one is already in flight.", { userId });
      }
      return;
    }

    const checkSeq = accountAccessCheckSeqRef.current + 1;
    accountAccessCheckSeqRef.current = checkSeq;
    accountAccessCheckInFlightRef.current = true;
    accountAccessCheckUserIdRef.current = userId;
    setTeacherAccountStatus(previousStatus => previousStatus === "approved" ? previousStatus : "checking");

    const withAccountCheckTimeout = (promise, label) =>
      Promise.race([
        promise,
        new Promise((_, reject) => {
          window.setTimeout(() => reject(new Error(`${label} timed out.`)), 10000);
        })
      ]);

    try {
      if (import.meta.env.DEV) {
        console.debug("Account access check started.", { userId, checkSeq });
      }
      const [adminAccess, accountResult] = await Promise.all([
        withAccountCheckTimeout(checkAdminStatus(userId), "Admin status check"),
        withAccountCheckTimeout(fetchTeacherAccountRecord(userId), "Teacher account status check")
      ]);
      if (accountAccessCheckSeqRef.current !== checkSeq) return;

      if (adminAccess) {
        await loadTeacherAccountStatus(userId, teacherUser?.email, true);
      } else {
        await applyTeacherAccountStatusResult(userId, teacherUser?.email, accountResult);
      }

      if (import.meta.env.DEV) {
        console.debug("Account access check completed.", { userId, checkSeq });
      }
    } catch (error) {
      if (accountAccessCheckSeqRef.current !== checkSeq) return;

      console.warn("Teacher account access check failed.", error);
      if (isInvalidRefreshTokenError(error)) {
        supabase.auth.signOut({ scope: "local" }).catch(signOutError => {
          console.warn("Could not clear invalid local auth session.", signOutError);
        });
        setTeacherAccountStatus("signed_out");
        setTeacherAccountRecord(null);
        setAuthMessage("Your session expired. Please log in again.");
      } else {
        setTeacherAccountStatus("approval_setup_required");
        setTeacherAccountRecord({
          user_id: userId,
          email: teacherUser?.email,
          status: "approval_setup_required",
          approval_status: "approval_setup_required"
        });
        setAuthMessage("Account access could not be confirmed. Please refresh or try again.");
      }
    } finally {
      if (accountAccessCheckSeqRef.current === checkSeq) {
        accountAccessCheckInFlightRef.current = false;
        accountAccessCheckUserIdRef.current = null;
      }
    }
  }

  function buildTeacherRows(classes = [], students = [], answers = []) {
    const teacherMap = new Map();

    function ensureTeacher(id, email = "") {
      if (!id) return null;
      if (!teacherMap.has(id)) {
        teacherMap.set(id, {
          id,
          email: email || "Email unavailable",
          classes: 0,
          students: 0,
          answers: 0
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

    return [...teacherMap.values()].sort((a, b) => a.email.localeCompare(b.email));
  }

  async function loadAdminDashboard() {
    if (!isAdmin) {
      setMessage("You are signed in, but this account is not authorized as an app admin.");
      return;
    }

    setAdminLoading(true);

    const [classesResult, studentsResult, answersResult, pendingAccountsResult, schoolsResult] = await Promise.all([
      supabase.from("classes").select("id, name, teacher_id, school_id, created_at").order("created_at", { ascending: false }),
      supabase.from("students").select("id, name, class_id, teacher_id, symbol_password, created_at").order("created_at", { ascending: false }),
      supabase.from("answers").select("teacher_id"),
      supabase
        .from("pending_teacher_accounts")
        .select("id, user_id, email, username, display_name, name, role, status, approval_status, school_id, created_at, requested_at, reviewed_at, reviewed_by, approved_at, approved_by, rejected_at, rejected_by, rejection_reason")
        .order("created_at", { ascending: false }),
      supabase.from("schools").select("id, name, created_at").order("name", { ascending: true })
    ]);

    setAdminLoading(false);

    const pendingAccountsError = pendingAccountsResult.error || null;
    const dashboardErrors = [
      { table: "classes", error: classesResult.error },
      { table: "students", error: studentsResult.error },
      { table: "answers", error: answersResult.error }
    ].filter(result => result.error);

    if (pendingAccountsError) {
      logAdminSupabaseError("Optional pending_teacher_accounts load failed.", pendingAccountsError, {
        table: "pending_teacher_accounts",
        userId: teacherId,
        userEmail: teacherUser?.email
      });
    }

    if (dashboardErrors.length > 0) {
      const firstError = dashboardErrors[0];
      logAdminSupabaseError("Admin dashboard load error.", firstError.error, {
        table: firstError.table,
        userId: teacherId,
        userEmail: teacherUser?.email
      });
      setMessage(getAdminSetupMessage(firstError.error, firstError.table));
      return;
    }

    const classes = classesResult.data || [];
    const students = studentsResult.data || [];
    const answers = answersResult.data || [];
    const classById = new Map(classes.map(row => [row.id, row]));
    const studentCounts = new Map();

    students.forEach(student => {
      studentCounts.set(student.class_id, (studentCounts.get(student.class_id) || 0) + 1);
    });

    const classRows = classes.map(row => ({
      ...row,
      studentCount: studentCounts.get(row.id) || 0
    }));

    const studentRows = students.map(row => ({
      ...row,
      className: classById.get(row.class_id)?.name || "Class unavailable"
    }));

    setAdminClasses(classRows);
    setAdminStudents(studentRows);
    setAdminTeachers(buildTeacherRows(classes, students, answers));
    setAdminSchools(schoolsResult.error ? [] : schoolsResult.data || []);
    setAdminPendingAccounts(pendingAccountsError ? [] : pendingAccountsResult.data || []);
    setAdminPendingAccountsWarning(pendingAccountsError
      ? "Pending teacher accounts could not be loaded. This does not affect content coverage or student data."
      : "");
  }

  function openAdminDashboard() {
    if (!isAdmin) {
      if (adminStatusError?.error) {
        logAdminSupabaseError("Admin dashboard blocked by admin check.", adminStatusError.error, {
          table: adminStatusError.table,
          userId: teacherId,
          userEmail: teacherUser?.email
        });
        setMessage(getAdminSetupMessage(adminStatusError.error, adminStatusError.table));
      } else {
        setMessage("You are signed in, but this account is not authorized as an app admin. Add this user to the app_admins table to enable the Admin Dashboard.");
      }
      return;
    }

    setAppView(APP_VIEWS.ADMIN_DASHBOARD);
    loadAdminDashboard();
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

  function adminDeleteStudent(selectedStudentId, selectedStudentName = "this student") {
    if (!isAdmin || !selectedStudentId) return;
    setAdminConfirm({ kind: "student", id: selectedStudentId, name: selectedStudentName });
  }

  async function executeAdminDeleteStudent(selectedStudentId, selectedStudentName = "this student") {
    if (!isAdmin || !selectedStudentId) return;

    const ids = [selectedStudentId];
    const errors = [];
    const studentOwnerId = adminStudents.find(row => row.id === selectedStudentId)?.teacher_id || "";
    const assessmentOwnerIds = [...new Set([studentOwnerId, teacherId].filter(Boolean))];

    // Whole-class report rows have no relational student_id, so the ordinary
    // child-row deletion below cannot find them. Remove snapshots containing
    // this learner while the ownership row still exists and can be resolved.
    try {
      for (const assessmentTeacherId of assessmentOwnerIds) {
        await deleteSavedClassElAssessmentReportsForStudent({
          teacherId: assessmentTeacherId,
          studentId: selectedStudentId,
          studentName: selectedStudentName,
          supabase
        });
      }
    } catch (error) {
      console.error("Admin delete student report cleanup error:", error);
      setMessage("Could not delete the student's saved whole-class assessment reports.");
      return;
    }

    for (const [tableName, columnName] of [
      ["answers", "student_id"],
      ["mastery", "student_id"],
      ["item_mastery", "student_id"],
      ["assessment_sessions", "student_id"],
      ["assessment_attempts", "student_id"],
      ["el_assessment_reports", "student_id"]
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

    let localCleanupFailed = false;
    try {
      await clearLocalElAssessmentDataForStudent({
        teacherId: studentOwnerId || teacherId,
        studentId: selectedStudentId,
        studentName: selectedStudentName
      });
    } catch (error) {
      localCleanupFailed = true;
      console.warn("Deleted student, but local EL assessment cache cleanup failed.", error);
    }

    await loadAdminDashboard();
    setMessage(localCleanupFailed
      ? `Deleted ${selectedStudentName}, but this browser could not clear all cached assessment evidence. Refresh and retry while browser storage is available.`
      : `Deleted ${selectedStudentName}.`);
  }

  async function adminSetTeacherSchool(teacherUserId, schoolName) {
    if (!isAdmin || !teacherUserId || !schoolName?.trim()) return;

    const { data: schoolRows, error: schoolError } = await supabase.rpc("find_or_create_school", { p_name: schoolName.trim() });
    const schoolId = schoolRows?.[0]?.id || null;
    if (schoolError || !schoolId) {
      console.error("Admin set school failed:", schoolError);
      setMessage("Could not save that school.");
      return;
    }

    const { error: accountError } = await supabase
      .from("pending_teacher_accounts")
      .update({ school_id: schoolId })
      .eq("user_id", teacherUserId);

    const { error: classError } = await supabase
      .from("classes")
      .update({ school_id: schoolId })
      .eq("teacher_id", teacherUserId);

    if (accountError || classError) {
      console.error("Admin set school failed:", accountError || classError);
      setMessage("Could not move that teacher's school.");
      return;
    }

    await loadAdminDashboard();
    setMessage(`Teacher moved to ${schoolRows[0].name}.`);
  }

  function adminDeleteClass(classId, className = "this class") {
    if (!isAdmin || !classId) return;
    setAdminConfirm({ kind: "class", id: classId, name: className });
  }

  async function executeAdminDeleteClass(classId, className = "this class") {
    if (!isAdmin || !classId) return;

    const { data: students, error: lookupError } = await supabase
      .from("students")
      .select("id, name, teacher_id")
      .eq("class_id", classId);

    if (lookupError) {
      console.error("Admin class student lookup error:", lookupError);
      setMessage("Could not delete class from admin dashboard.");
      return;
    }

    const studentIds = (students || []).map(row => row.id);
    const errors = [];

    try {
      for (const student of students || []) {
        await deleteSavedClassElAssessmentReportsForStudent({
          teacherId: student.teacher_id || teacherId,
          studentId: student.id,
          studentName: student.name || "",
          supabase
        });
      }
    } catch (error) {
      console.error("Admin delete class report cleanup error:", error);
      setMessage("Could not delete the class's saved whole-class assessment reports.");
      return;
    }

    if (studentIds.length > 0) {
      for (const [tableName, columnName] of [
        ["answers", "student_id"],
        ["mastery", "student_id"],
        ["item_mastery", "student_id"],
        ["assessment_sessions", "student_id"],
        ["assessment_attempts", "student_id"],
        ["el_assessment_reports", "student_id"]
      ]) {
        const error = await deleteOptionalTableRows(tableName, columnName, studentIds);
        if (error) errors.push(error);
      }
    }

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

    let localCleanupFailed = false;
    for (const student of students || []) {
      try {
        await clearLocalElAssessmentDataForStudent({
          teacherId: student.teacher_id || teacherId,
          studentId: student.id,
          studentName: student.name || ""
        });
      } catch (error) {
        localCleanupFailed = true;
        console.warn("Deleted class, but local EL assessment cache cleanup failed.", error);
      }
    }

    await loadAdminDashboard();
    setMessage(localCleanupFailed
      ? `Deleted ${className}, but this browser could not clear all cached assessment evidence. Refresh and retry while browser storage is available.`
      : `Deleted ${className}.`);
  }

  async function updateTeacherAccountStatus(accountId, status) {
    if (!isAdmin || !accountId) return;

    const now = new Date().toISOString();
    const nextRole = status === "approved" ? "teacher" : "pending";
    const statusUpdate = {
      status,
      approval_status: status,
      role: nextRole,
      reviewed_at: now,
      reviewed_by: teacherId
    };

    if (status === "approved") {
      statusUpdate.approved_at = now;
      statusUpdate.approved_by = teacherId;
      statusUpdate.rejected_at = null;
      statusUpdate.rejected_by = null;
      statusUpdate.rejection_reason = null;
    }

    if (status === "rejected") {
      statusUpdate.rejected_at = now;
      statusUpdate.rejected_by = teacherId;
      statusUpdate.approved_at = null;
      statusUpdate.approved_by = null;
    }

    const { data, error } = await supabase
      .from("pending_teacher_accounts")
      .update(statusUpdate)
      .eq("id", accountId)
      .select("id, user_id, email, username, display_name, name, role, status, approval_status, school_id, created_at, requested_at, reviewed_at, reviewed_by, approved_at, approved_by, rejected_at, rejected_by, rejection_reason")
      .maybeSingle();

    if (error) {
      console.error("Teacher account status update failed.", error);
      setMessage("Could not update teacher account status.");
      return;
    }

    setAdminPendingAccounts(previousAccounts =>
      previousAccounts.map(account =>
        account.id === accountId
          ? { ...account, ...statusUpdate, ...(data || {}) }
          : account
      )
    );
    setMessage(`Teacher account marked ${status}.`);
  }

  async function signUpTeacher() {
    const email = authEmail.trim();
    const username = authUsername.trim().toLowerCase();
    const displayName = authDisplayName.trim();
    const schoolName = authSchoolName.trim();
    if (!email || !authPassword) {
      setAuthMessage("Enter an email and password.");
      return;
    }
    if (!schoolName) {
      setAuthMessage("Enter your school.");
      return;
    }
    if (!username) {
      setAuthMessage("Choose a username for the account request.");
      return;
    }
    if (!/^[a-z0-9_-]{3,30}$/.test(username)) {
      setAuthMessage("Username must be 3-30 characters using only letters, numbers, underscores, or hyphens.");
      return;
    }

    setAuthLoading(true);
    setAuthMessage("");
    freshAuthActionRef.current = true;

    const { data: schoolRows, error: schoolError } = await supabase.rpc("find_or_create_school", { p_name: schoolName });
    const schoolId = schoolRows?.[0]?.id || null;
    if (schoolError || !schoolId) {
      setAuthLoading(false);
      freshAuthActionRef.current = false;
      setAuthMessage("Could not save that school yet. Try again.");
      return;
    }

    const { data: existingUsername, error: usernameLookupError } = await supabase
      .from("pending_teacher_accounts")
      .select("id, username")
      .eq("username", username)
      .maybeSingle();

    if (usernameLookupError) {
      console.warn("Could not check pending teacher username before signup.", usernameLookupError);
    }

    if (existingUsername?.id) {
      setAuthLoading(false);
      freshAuthActionRef.current = false;
      setAuthMessage("That username is already taken. Choose another username.");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password: authPassword,
      options: {
        data: {
          account_status: "pending",
          username,
          display_name: displayName,
          school_id: schoolId
        }
      }
    });

    setAuthLoading(false);

    if (error) {
      freshAuthActionRef.current = false;
      setAuthMessage(
        isDuplicateAuthSignupError(error)
          ? "This email already has an account request or account. Please wait for approval or contact an administrator."
          : error.message
      );
      return;
    }

    if (isDuplicateAuthSignupError(null, data)) {
      freshAuthActionRef.current = false;
      setAuthMessage("This email already has an account request or account. Please wait for approval or contact an administrator.");
      return;
    }

    const newUserId = data?.user?.id;
    if (newUserId) {
      const pendingRecord = buildPendingAccountRecord(newUserId, email, {
        username,
        display_name: displayName || username,
        school_id: schoolId
      });
      const { data: pendingAccount, error: notificationError } = await supabase
        .from("pending_teacher_accounts")
        .upsert(pendingRecord, { onConflict: "user_id" })
        .select("id, user_id, email, username, display_name, name, role, status, approval_status, school_id, created_at, requested_at, reviewed_at, reviewed_by, approved_at, approved_by, rejected_at, rejected_by, rejection_reason")
        .maybeSingle();

      if (notificationError) {
        console.warn("Could not upsert pending teacher notification after signup. The database trigger should create this request.", notificationError);
      }

      const nextRecord = pendingAccount || pendingRecord;
      setTeacherAccountStatus("pending");
      setTeacherAccountRecord(nextRecord);
    }

    setAuthPassword("");
    setAuthMessage("Your account request has been submitted. An administrator must approve your account before you can use Literacy Guide.");
  }

  async function logInTeacher() {
    const email = authEmail.trim();
    if (!email || !authPassword) {
      setAuthMessage("Enter an email and password.");
      return;
    }

    setAuthLoading(true);
    setAuthMessage("");
    freshAuthActionRef.current = true;

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: authPassword
    });

    setAuthLoading(false);

    if (error) {
      freshAuthActionRef.current = false;
      setAuthMessage(error.message);
      return;
    }

    setAuthPassword("");
    setAuthMessage("");
  }

  // ── Preview-only demo teacher login ─────────────────────────────────────
  // GATED to the preview environment: VITE_DEMO_TEACHER must equal "1" AND the
  // demo email/password must be present. Set these ONLY on Vercel's Preview
  // environment (never Production), so neither the button nor the credentials
  // exist in the production bundle. Uses a throwaway demo account — no real
  // teacher or student data. This is the teacher-side equivalent of the fake
  // "Aaron" student test account.
  const demoTeacherEnabled = import.meta.env.VITE_DEMO_TEACHER === "1"
    && Boolean(import.meta.env.VITE_DEMO_TEACHER_EMAIL)
    && Boolean(import.meta.env.VITE_DEMO_TEACHER_PASSWORD);

  async function logInDemoTeacher() {
    if (!demoTeacherEnabled) return;
    setAuthLoading(true);
    setAuthMessage("");
    freshAuthActionRef.current = true;
    const { error } = await supabase.auth.signInWithPassword({
      email: String(import.meta.env.VITE_DEMO_TEACHER_EMAIL).trim(),
      password: String(import.meta.env.VITE_DEMO_TEACHER_PASSWORD)
    });
    setAuthLoading(false);
    if (error) {
      freshAuthActionRef.current = false;
      setAuthMessage(error.message);
      return;
    }
    setAuthPassword("");
    setAuthMessage("");
  }

  useEffect(() => {
    let cancelled = false;
    const schoolId = teacherAccountRecord?.school_id;
    const namePromise = schoolId
      ? supabase
          .from("schools")
          .select("name")
          .eq("id", schoolId)
          .maybeSingle()
          .then(({ data }) => data?.name || "")
      : Promise.resolve("");
    namePromise.then(name => {
      if (!cancelled) setTeacherSchoolName(name);
    });
    return () => {
      cancelled = true;
    };
  }, [teacherAccountRecord?.school_id]);

  async function saveTeacherSchool(overrideName) {
    const schoolName = (typeof overrideName === "string" ? overrideName : authSchoolName).trim();
    if (!teacherId || !schoolName) {
      setAuthMessage("Enter your school.");
      return;
    }

    setAuthLoading(true);
    // Security-definer RPC: persists the school on the teacher's account row
    // (RLS blocks direct updates once approved) and stamps all their classes.
    const { data: savedRows, error } = await supabase.rpc("teacher_set_school", { p_school_name: schoolName });
    const saved = savedRows?.[0] || null;

    setAuthLoading(false);

    if (error || !saved?.school_id) {
      console.error("Save school failed:", error);
      const missingFunction = error?.code === "PGRST202" || /teacher_set_school/.test(error?.message || "");
      setAuthMessage(
        missingFunction
          ? "The database needs the latest update before schools can be saved. Apply the teacher_set_school migration."
          : "Could not save that school yet."
      );
      setMessage("Could not save that school yet.");
      return;
    }

    setTeacherAccountRecord(previous => ({ ...(previous || teacherAccountRecord || {}), school_id: saved.school_id }));
    setTeacherSchoolName(saved.school_name || schoolName);
    setAuthMessage("");
    setMessage(`School saved: ${saved.school_name || schoolName}`);
    await loadClasses();
  }

  async function requestPasswordReset() {
    const email = authEmail.trim();
    if (!email) {
      setAuthMessage("Enter your email first.");
      return;
    }

    setAuthLoading(true);
    setAuthMessage("");

    const resetRedirectUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}${window.location.pathname}`
        : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: resetRedirectUrl
    });

    setAuthLoading(false);

    if (error) {
      setAuthMessage(error.message);
      return;
    }

    setAuthMessage("Password reset email sent. Check your inbox for a secure reset link.");
    setAuthMode("login");
  }

  async function completePasswordReset() {
    if (!authPassword || authPassword.length < 6) {
      setAuthMessage("Enter a new password with at least 6 characters.");
      return;
    }

    setAuthLoading(true);
    setAuthMessage("");

    const { error } = await supabase.auth.updateUser({
      password: authPassword
    });

    setAuthLoading(false);

    if (error) {
      setAuthMessage(error.message);
      return;
    }

    setAuthPassword("");
    setAuthMode("login");
    setAuthMessage("Password updated. Please log in with your new password.");
    await supabase.auth.signOut();
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
      .select("id,name,school_id,access_code,leaderboard_scope")
      .eq("teacher_id", teacherId)
      .order("name", { ascending: true });

    if (error) {
      console.error("Load classes error:", error);
      setMessage("Could not load classes from cloud.");
      return;
    }

    setClassList(data || []);
  }

  async function regenerateClassCode(classId = selectedClassId) {
    if (!classId) return { ok: false, error: "missing-class" };
    const { data, error } = await supabase.rpc("teacher_regenerate_class_code", { p_class_id: classId });
    if (error || !data?.ok) {
      console.error("Regenerate class code error:", error || data?.error);
      setMessage("Could not make a new class code.");
      return { ok: false, error: error || data?.error || "unknown" };
    }
    await loadClasses();
    return { ok: true, accessCode: data.access_code };
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
      .insert({ name: clean, teacher_id: teacherId, school_id: teacherAccountRecord?.school_id || null })
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

  async function createDemoClass() {
    if (!teacherId) {
      setMessage("Please log in first.");
      return false;
    }

    const { data, error } = await supabase.rpc("teacher_create_demo_class");
    const classId = data?.class_id;
    if (error || !classId) {
      console.error("Create demo class error:", error || data);
      setMessage("Could not create the sample class.");
      return false;
    }

    setSelectedClassId(classId);
    setTeacherGroupId("all");
    setTeacherStudentContext({ studentId: null, studentName: "" });
    setNameSaved(false);
    await loadClasses();
    await loadStudents(classId);
    await loadClassDashboard(classId);
    setMessage("Sample class created. It has login pictures but no assessment evidence.");
    return true;
  }

  async function loadStudents(classId = selectedClassId) {
    if (!teacherId || !classId) {
      setStudentList([]);
      setArchivedStudentList([]);
      setLoadingStudents(false);
      return;
    }

    setLoadingStudents(true);

    const { data, error } = await supabase
      .from("students")
      .select("id, name, class_id, created_at, updated_at, symbol_password, archived_at")
      .eq("teacher_id", teacherId)
      .eq("class_id", classId)
      .order("name", { ascending: true });

    if (error) {
      console.error("Load students error:", error);
      setMessage("Could not load students from cloud.");
      setLoadingStudents(false);
      return;
    }

    setStudentList((data || []).filter(row => !row.archived_at));
    setArchivedStudentList((data || []).filter(row => Boolean(row.archived_at)));
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
      .is("archived_at", null)
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
      return;
    }

    const { data: answers, error: answersError } = await supabase
      .from("answers")
      .select("student_id, skill, is_correct, answered_at")
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

    const { data: soundSeekerRows, error: soundSeekerError } = await supabase
      .from("student_progress")
      .select("student_id, payload, updated_at")
      .eq("area", "phonics_quest")
      .eq("key", "__all__")
      .in("student_id", studentIds);

    if (soundSeekerError) {
      console.error("Dashboard Sound Seekers progress error:", soundSeekerError);
    }

    const soundSeekersByStudent = new Map(
      (soundSeekerRows || []).map(row => [row.student_id, {
        ...buildQuestMasteryReport(row.payload || {}),
        syncedAt: row.updated_at || ""
      }])
    );

    const changeWindowMs = 7 * 24 * 60 * 60 * 1000;
    const changeWindowEnd = Date.now();
    const changeWindowStart = changeWindowEnd - changeWindowMs;
    const previousWindowStart = changeWindowStart - changeWindowMs;
    const inWindow = (value, start, end) => {
      const timestamp = new Date(value).getTime();
      return Number.isFinite(timestamp) && timestamp >= start && timestamp < end;
    };

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
        const evidenceSkills = [...new Set(
          studentAnswers.map(row => String(row.skill || "").trim()).filter(Boolean)
        )];

        const accuracy =
          studentAnswers.length === 0
            ? 0
            : Math.round((correct / studentAnswers.length) * 100);

        const mastered =
          studentMastery.filter(m => m.mastered);
        const recentAnswers = studentAnswers.filter(row =>
          inWindow(row.answered_at, changeWindowStart, changeWindowEnd)
        ).length;
        const previousAnswers = studentAnswers.filter(row =>
          inWindow(row.answered_at, previousWindowStart, changeWindowStart)
        ).length;
        const recentMastered = mastered.filter(row =>
          inWindow(row.updated_at, changeWindowStart, changeWindowEnd)
        ).length;
        const previousMastered = mastered.filter(row =>
          inWindow(row.updated_at, previousWindowStart, changeWindowStart)
        ).length;

        const masteredIds =
          new Set(mastered.map(m => m.skill_id));

        const attemptsBySkillId = new Map(
          studentMastery.map(m => [m.skill_id, Number(m.attempts) || 0])
        );

        // Prefer the skill the child is actively WORKING ON (attempted but
        // not yet mastered) over the first untouched one, so the dashboard
        // reflects real movement instead of hiding in-progress work.
        const firstUnmastered =
          skillTree.find(stage =>
            !masteredIds.has(stage.id) && attemptsBySkillId.get(stage.id) > 0
          ) ||
          skillTree.find(stage =>
            !masteredIds.has(stage.id)
          );

        const lastAnswer =
          studentAnswers[studentAnswers.length - 1];
        const soundSeekers = soundSeekersByStudent.get(student.id) || null;
        const lastActive = [lastAnswer?.answered_at, soundSeekers?.lastActiveAt, soundSeekers?.syncedAt]
          .filter(Boolean)
          .sort()
          .at(-1) || null;

        return {
          id: student.id,
          name: student.name,
          answered: studentAnswers.length,
          correct,
          accuracy,
          evidenceSkills,
          masteredCount: mastered.length,
          currentSkill: firstUnmastered?.label || "Completed",
          lastActive,
          recentAnswers,
          previousAnswers,
          recentMastered,
          previousMastered,
          soundSeekers
        };
      });

    setClassDashboard(rows);
  }

  // PRACTICE-ASSIGN — the teacher picks sounds on a child's heat map; the
  // child's Free Roam serves exactly those sounds next session
  // (questReviewMode.pendingAssignment). The assignment rides INSIDE the
  // phonics_quest payload: the server's BEFORE UPDATE merge folds
  // { assignment } into the existing row without touching mastery/trail
  // (unknown keys are incoming-wins under the phonics_quest merge migration;
  // under the older naive merge it is still additive-safe, but REPLACING or
  // CLEARING an assignment needs 20260715090000_phonics_quest_merge.sql
  // applied — the naive merge unions the old targets back in).
  async function saveQuestAssignment(studentRowId, targets = [], note = "") {
    if (!teacherId || !studentRowId) return false;
    const assignment = {
      targets: [...new Set(targets)].filter(Boolean).slice(0, 6),
      note: String(note || "").slice(0, 120),
      assignedAt: new Date().toISOString(),
      by: "teacher"
    };
    const { error } = await supabase.from("student_progress").upsert({
      student_id: studentRowId,
      area: "phonics_quest",
      key: "__all__",
      payload: { assignment },
      updated_at: new Date().toISOString()
    }, { onConflict: "student_id,area,key" });
    if (error) {
      console.error("Assign practice error:", error);
      setMessage("Could not save the practice assignment.");
      return false;
    }
    await loadClassDashboard(selectedClassId);
    return true;
  }

  async function assignQuestPractice(studentRowId, targets, note = "") {
    return saveQuestAssignment(studentRowId, targets, note);
  }

  async function clearQuestPractice(studentRowId) {
    return saveQuestAssignment(studentRowId, [], "");
  }

  async function updateStudentSymbolPassword(studentRowId, sequence, selectedStudentName = "student") {
    if (!teacherId || !studentRowId || !/^[1-9]{3}$/.test(sequence)) return;
    // No teacher_id filter here: RLS already restricts writes to the
    // student's own teacher or an app admin. Filtering by teacher_id made
    // admin edits silently update zero rows while still reporting success.
    const { data, error } = await supabase
      .from("students")
      .update({
        symbol_password: sequence,
        password_set_at: new Date().toISOString(),
        password_updated_by: teacherId,
        failed_login_count: 0,
        last_failed_login_at: null
      })
      .eq("id", studentRowId)
      .select("id");

    if (error || !data?.length) {
      console.error("Could not update student symbol password.", error);
      setMessage("Could not change that login password. You may not have access to this student.");
      return;
    }

    await loadStudents(selectedClassId);
    setMessage(`Login pictures updated for ${selectedStudentName}.`);
  }

  async function resetStudentSymbolPassword(studentRowId, selectedStudentName = "student") {
    if (!teacherId || !studentRowId) return;
    if (!window.confirm(`Reset ${selectedStudentName}'s login pictures? They will be unable to sign in until a teacher sets new pictures.`)) return;

    const { data, error } = await supabase
      .from("students")
      .update({
        symbol_password: null,
        password_set_at: null,
        password_updated_by: teacherId,
        failed_login_count: 0,
        last_failed_login_at: null
      })
      .eq("id", studentRowId)
      .select("id");

    if (error || !data?.length) {
      console.error("Could not reset student symbol password.", error);
      setMessage("Could not reset that login password. You may not have access to this student.");
      return;
    }

    await loadStudents(selectedClassId);
    setMessage(`Login pictures reset for ${selectedStudentName}. Set new pictures before their next sign-in.`);
  }

  function resetCurrentStudentLocalProgress({ clearFormalAssessments = false } = {}) {
    answerInFlightRef.current = false;
    answerHistoryRef.current = [];
    roundItemKeysRef.current = [];
    roundQuestionIdsRef.current = [];
    resetInitialSoundRoundQueue();
    initialSoundRoundMetaRef.current = null;
    setCurrentSkillIndex(0);
    setRoundAnswers([]);
    setRoundItemKeys([]);
    setRoundQuestionIds([]);
    setUsedByStage({});
    setMastery({});
    setCurrentQuestion(null);
    setFeedback(null);
    setCheckpointDecision(null);
    setDiagnosticFollowUp(false);
    setAssessmentMode("mastery");
    setTotalAnswered(0);
    setCorrectAnswered(0);
    setAnswerHistory([]);
    setItemMastery({});
    setItemSessionSeen({});

    if (clearFormalAssessments) {
      setLetterIndex(0);
      setLetterAssessment([]);
      setPatternIndex(0);
      setPatternAssessment([]);
      setPatternAttempt(0);
      setElBenchmarkSession(null);
    }
  }

  async function resetSelectedStudentLocalAssessmentArchives(
    selectedStudentId = studentId,
    selectedStudentName = studentName
  ) {
    if (!selectedStudentId) return;
    await clearLocalElAssessmentDataForStudent({
      teacherId,
      studentId: selectedStudentId,
      studentName: selectedStudentName
    });
    setAssessmentHistory(loadAssessmentAttempts({ teacherId }));
  }

  async function deleteStudentProgressRows(tableName, selectedStudentId) {
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq("student_id", selectedStudentId);

    if (error && !isMissingTableError(error, tableName)) return error;
    return null;
  }

  async function resetSelectedStudentProgress() {
    if (!teacherId || !studentId) {
      setMessage("Select a student before resetting progress.");
      return;
    }

    setResettingProgress(true);

    const errors = [];

    // A whole-class snapshot is owned by the teacher/class and therefore has
    // no relational student_id for the generic deletion loop to match.
    try {
      await deleteSavedClassElAssessmentReportsForStudent({
        teacherId,
        studentId,
        studentName,
        supabase
      });
    } catch (error) {
      setResettingProgress(false);
      console.error("Reset student whole-class report cleanup error:", error);
      setMessage("Could not reset this student's saved whole-class assessment reports.");
      return;
    }

    for (const tableName of [
      "answers",
      "mastery",
      "item_mastery",
      "assessment_attempts",
      "el_assessment_reports",
      "student_progress"
    ]) {
      const error = await deleteStudentProgressRows(tableName, studentId);
      if (error) errors.push(error);
    }

    setResettingProgress(false);

    if (errors.length > 0) {
      console.error("Reset student progress error:", errors[0]);
      setMessage("Could not reset this student's progress.");
      return;
    }

    resetCurrentStudentLocalProgress({ clearFormalAssessments: true });
    let resetWarning = "";
    try {
      await resetSelectedStudentLocalAssessmentArchives(studentId, studentName);
    } catch (error) {
      console.warn("Cloud progress was reset, but local EL assessment cache cleanup failed.", error);
      resetWarning = "Progress was reset in the cloud, but this browser could not clear all cached assessment evidence. Refresh and retry while browser storage is available.";
    }
    // Clear the gamified progress too (EL Quest, learn games, phonics, cvc,
    // story quests, guided reading, daily mission, profile) locally + queue, so
    // the now-deleted cloud rows can't forward-merge straight back on next load.
    clearLocalProgressForStudent(studentId);
    // Leave a cloud "tombstone" so OTHER devices (shared iPads) also wipe their
    // local copy on next hydrate, instead of re-pushing old progress. Best-effort.
    try {
      await supabase.from("student_progress").upsert({
        student_id: studentId,
        area: RESET_AREA,
        key: RESET_AREA,
        payload: { at: new Date().toISOString() },
        updated_at: new Date().toISOString()
      }, { onConflict: "student_id,area,key" });
    } catch (tombstoneError) {
      console.warn("Could not write reset tombstone (other devices may not auto-clear).", tombstoneError);
      resetWarning = "Progress was reset on this device, but the reset could not sync to the cloud - other devices may still show old progress. Please retry the reset while online.";
    }
    if (import.meta.env.DEV) {
      console.debug("[assessment-reset] Reset all progress for selected student", {
        studentId,
        teacherId
      });
    }
    setResetProgressDialogOpen(false);
    setAppView(APP_VIEWS.OVERVIEW);
    setMessage(resetWarning || `Progress reset for ${studentName || "student"}.`);

    await loadStudents(selectedClassId);
    await loadClassDashboard(selectedClassId);
  }


  async function loadStudentProgress(
    selectedStudentId,
    selectedStudentName,
    { navigate = true } = {}
  ) {
    setTeacherStudentContext({
      studentId: selectedStudentId,
      studentName: selectedStudentName
    });
    setNameSaved(true);
    setSelectedStudentEvidenceReady(false);
    setSelectedStudentEvidenceReadState({
      completedAt: "",
      syncStatus: "loading",
      sources: {}
    });
    answerInFlightRef.current = false;
    if (elBenchmarkSession?.studentId) {
      saveElBenchmarkDraft({
        teacherId,
        studentId: elBenchmarkSession.studentId,
        session: elBenchmarkSession
      });
    }
    const restoredElBenchmarkSession = loadElBenchmarkDraft({
      teacherId,
      studentId: selectedStudentId
    });
    // Synchronously hard-reset every piece of in-flight assessment state
    // BEFORE any await, so nothing from the previously selected student can
    // render against the new one while their data loads.
    setRoundAnswers([]);
    setRoundItemKeys([]);
    setRoundQuestionIds([]);
    roundItemKeysRef.current = [];
    roundQuestionIdsRef.current = [];
    setUsedByStage({});
    setItemSessionSeen({});
    setCurrentQuestion(null);
    setFeedback(null);
    setAssessmentTransitioning(false);
    setMastery({});
    setItemMastery({});
    setAnswerHistory([]);
    answerHistoryRef.current = [];
    setLetterIndex(0);
    setLetterAssessment([]);
    setPatternIndex(0);
    setPatternAssessment([]);
    setPatternAttempt(0);
    setElBenchmarkSession(restoredElBenchmarkSession);
    const progressSyncSession = {
      mode: "teacher",
      studentId: selectedStudentId,
      studentName: selectedStudentName,
      classId: selectedClassId,
      teacherId
    };
    configureProgressSync(progressSyncSession);
    void hydrateCloudProgress(progressSyncSession).catch(error => {
      console.warn("Could not hydrate teacher-selected cloud progress.", error);
    });
    if (navigate) setAppView(APP_VIEWS.OVERVIEW);
    setCheckpointDecision(null);
    const selectedAttemptHistoryPromise = hydrateAssessmentAttempts({
      teacherId,
      studentId: selectedStudentId,
      supabase: isSupabaseConfigured ? supabase : null
    });

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
        const matchedMetadata = matchedQuestion ? inferItemMetadata(matchedQuestion) : inferAnswerRecordMetadata(baseRecord);

        return {
          ...baseRecord,
          questionId: matchedQuestion?.id || "",
          questionSignature: matchedQuestion
            ? getRuntimeQuestionSignature(matchedQuestion)
            : getAnswerRecordSignature(baseRecord),
          promptAnswerSignature: getAnswerRecordPromptAnswerSignature(baseRecord),
          optionSetSignature: matchedQuestion ? getRepeatOptionSetSignature(matchedQuestion) : "",
          targetWord: matchedQuestion ? getQuestionTargetWord(matchedQuestion) : "",
          skillId: matchedQuestion?.skillId || "",
          itemType: matchedMetadata?.itemType || "",
          itemKey: matchedMetadata?.itemKey || "",
          itemLevel: matchedQuestion?.level || ""
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

    setGuidedReadingRecords(loadGuidedReadingRecords(selectedStudentId));

    const rebuiltItemMastery = {};

    (itemMasteryRows || []).forEach(row => {
      const key = getItemMasteryStateKey(row.item_key, row.item_type);
      rebuiltItemMastery[key] = normalizeItemMasteryRow(row);
    });

    const archivedAttemptsForStudent = await selectedAttemptHistoryPromise;
    const masteryFromAttempts = archivedAttemptsForStudent.reduce(
      (rows, attempt) => mergeAssessmentAttemptIntoItemMastery(rows, attempt),
      {}
    );

    setAssessmentHistory(previous => mergeAssessmentAttemptRecords(
      previous,
      archivedAttemptsForStudent
    ));
    setItemMastery({
      ...masteryFromAttempts,
      ...rebuiltItemMastery
    });
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

    // Recover retake-failure stamps from the persisted attempt history so
    // the report's "retested today" hint survives reloads and device swaps.
    for (const attempt of archivedAttemptsForStudent) {
      if (attempt.passed) continue;
      const entry = rebuiltMastery[attempt.skillId];
      const at = attempt.completedAt || attempt.startedAt || "";
      if (entry?.mastered && at && (!entry.lastRetakeFailedAt || at > entry.lastRetakeFailedAt)) {
        entry.lastRetakeFailedAt = at;
      }
    }

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
    const evidenceReadCompletedAt = new Date().toISOString();
    setSelectedStudentEvidenceReadState({
      completedAt: evidenceReadCompletedAt,
      syncStatus: "complete",
      sources: {
        assessmentAttempts: {
          lastSyncedAt: evidenceReadCompletedAt,
          syncStatus: "complete"
        },
        itemMastery: {
          lastSyncedAt: evidenceReadCompletedAt,
          syncStatus: "complete"
        },
        skillMastery: {
          lastSyncedAt: evidenceReadCompletedAt,
          syncStatus: "complete"
        }
      }
    });
    setSelectedStudentEvidenceReady(true);
  }


  async function createStudentForSelectedClass(name, { navigate = true } = {}) {
    const clean = String(name || "").trim();
    if (!clean) return;

    if (!teacherId) {
      setMessage("Please log in first.");
      return;
    }

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
      const reason = /duplicate|unique/i.test(error.message || "")
        ? `A student named "${clean}" already exists in this class.`
        : error.message
          ? `Could not create student: ${error.message}`
          : "Could not create student. Please try again.";
      setMessage(reason);
      return;
    }

    resetCurrentStudentLocalProgress({ clearFormalAssessments: true });
    setTeacherStudentContext({
      studentId: data.id,
      studentName: data.name || clean
    });
    setGuidedReadingRecords({});
    setNameSaved(true);
    setCurrentSkillIndex(0);
    if (navigate) setAppView(APP_VIEWS.OVERVIEW);
    await loadStudents(selectedClassId);
    await loadClassDashboard(selectedClassId);
    setMessage(`Student created and selected: ${data.name || clean}`);
  }

  function isInitialSoundsStage(stage) {
    return stage?.id === "initial_sounds" || stage?.label === "Initial Sounds";
  }

  function isFinalSoundsStage(stage) {
    return stage?.id === "final_sounds" || stage?.label === "Final Sounds";
  }

  const ASSESSMENT_PATH_STEPS = [
    { level: 1, phase: 1, label: "Level 1 Phase 1", nextLabel: "Continue Level 1 Phase 2" },
    { level: 1, phase: 2, label: "Level 1 Phase 2", nextLabel: "Start Level 2" },
    { level: 2, phase: 1, label: "Level 2 Phase 1", nextLabel: "Continue Level 2 Phase 2" },
    { level: 2, phase: 2, label: "Level 2 Phase 2", nextLabel: "Move to next skill" }
  ];

  function getAssessmentPathKey(step = {}) {
    return `L${Number(step.level || 1)}P${Number(step.phase || 1)}`;
  }

  function getAssessmentPathLabel(step = {}) {
    return `Level ${Number(step.level || 1)} Phase ${Number(step.phase || 1)}`;
  }

  function getAssessmentQuestionPhase(question = {}) {
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

  function getAssessmentQuestionLevel(stage, question = {}) {
    if (isFinalSoundsStage(stage) || question.skillId === "final_sounds") {
      return getFinalSoundQuestionLevel(question);
    }
    const level =
      Number(question.level || question.assessmentLevel || question.depthLevel || question.difficultyLevel || question.difficulty || question.extra?.level || 1);
    return level >= 2 ? 2 : 1;
  }

  function getQuestionPathStep(stage, question = {}) {
    const level = getAssessmentQuestionLevel(stage, question);
    const phase = getAssessmentQuestionPhase(question) || 1;
    return { level, phase };
  }

  function getStageAssessmentRecords(stage) {
    if (!stage) return [];
    return answerHistoryRef.current.filter(record =>
      record.skillId === stage.id || record.stage === stage.label
    );
  }

  function getPassedAssessmentPathKeys(stage) {
    const records = getStageAssessmentRecords(stage)
      .filter(record => Number(record.itemLevel || 0) > 0 && Number(record.itemPhase || 0) > 0);
    const passedKeys = new Set();

    for (let index = 0; index < records.length; index += ROUND_LENGTH) {
      const round = records.slice(index, index + ROUND_LENGTH);
      if (round.length < ROUND_LENGTH) continue;
      const score = round.filter(record => record.isCorrect).length;
      if (score < PASS_SCORE) continue;
      const last = round.at(-1) || {};
      const step = {
        level: Number(last.itemLevel || 1) >= 2 ? 2 : 1,
        phase: Number(last.itemPhase || 1) === 2 ? 2 : 1
      };
      passedKeys.add(getAssessmentPathKey(step));
    }

    return passedKeys;
  }

  function getConfiguredLevelCoverageKeys(stage, level) {
    const configured = configuredCoverageTotals[stage?.id];
    if (!configured?.levels?.[level]?.length || !configured?.itemType) return [];
    return configured.levels[level].map(itemKey =>
      getItemMasteryStateKeyForValues(itemKey, configured.itemType)
    );
  }

  function isConfiguredLevelCoverageComplete(stage, level) {
    const expectedKeys = getConfiguredLevelCoverageKeys(stage, level);
    if (!expectedKeys.length) return false;
    const coveredKeys = getCoveredStageItemKeys(stage, { level });
    return expectedKeys.every(key => coveredKeys.has(key));
  }

  function hasConfiguredPhaseCoverage(stage, step = {}) {
    return Boolean(getConfiguredPhaseItemKeys(stage, step.level, step.phase)?.length);
  }

  function hasAssessmentPathQuestions(stage, step = {}) {
    if (!stage || !step) return false;
    const stageIndex = skillTree.findIndex(item => item.id === stage.id);
    const requiresExplicitPhase = hasConfiguredPhaseCoverage(stage, step);
    return allQuestionsRef.current.filter(question =>
      getStageIndex(question) === stageIndex &&
      !isQuestionBlockedByMediaQa(question) &&
      getAssessmentQuestionLevel(stage, question) === Number(step.level || 1) &&
      (
        requiresExplicitPhase
          ? getAssessmentQuestionPhase(question) === Number(step.phase || 1)
          : (getAssessmentQuestionPhase(question) || Number(step.phase || 1)) === Number(step.phase || 1)
      )
    ).length >= ROUND_LENGTH;
  }

  function getNextAssessmentPathStep(stage) {
    const passedKeys = getPassedAssessmentPathKeys(stage);

    if (
      isFinalSoundsStage(stage) &&
      getFinalSoundsLevelOneMasteryDepth().levelOneMastered &&
      configuredCoverageTotals[stage?.id]?.levels?.[2]?.length
    ) {
      return { level: 2, phase: 1 };
    }

    if (stage && !isInitialSoundsStage(stage) && !isFinalSoundsStage(stage)) {
      const hasLevelTwoContent = getConfiguredLevelCoverageKeys(stage, 2).length > 0;
      const levelOneComplete = hasLevelTwoContent && isConfiguredLevelCoverageComplete(stage, 1);
      const levelTwoComplete = hasLevelTwoContent && isConfiguredLevelCoverageComplete(stage, 2);
      const hasLevelTwoHistory = getStageAssessmentRecords(stage)
        .some(record => Number(record.itemLevel || 1) >= 2);
      const nextLevelOneStep = ASSESSMENT_PATH_STEPS.find(step =>
        Number(step.level || 1) === 1 &&
        !passedKeys.has(getAssessmentPathKey(step)) &&
        hasAssessmentPathQuestions(stage, step)
      );
      const nextLevelTwoStep = ASSESSMENT_PATH_STEPS.find(step =>
        Number(step.level || 1) === 2 &&
        !passedKeys.has(getAssessmentPathKey(step)) &&
        hasAssessmentPathQuestions(stage, step)
      );

      if (hasLevelTwoContent && !levelTwoComplete) {
        if (hasLevelTwoHistory) return nextLevelTwoStep || { level: 2, phase: 1 };
        if (levelOneComplete && !nextLevelOneStep) return nextLevelTwoStep || { level: 2, phase: 1 };
      }
    }

    return ASSESSMENT_PATH_STEPS.find(step =>
      !passedKeys.has(getAssessmentPathKey(step)) &&
      hasAssessmentPathQuestions(stage, step)
    ) ||
      ASSESSMENT_PATH_STEPS.at(-1);
  }

  function getCheckpointPathStatus(stage, currentStep = {}, options = {}) {
    const currentKey = getAssessmentPathKey(currentStep);
    const index = Math.max(0, ASSESSMENT_PATH_STEPS.findIndex(step => getAssessmentPathKey(step) === currentKey));
    const nextStep = ASSESSMENT_PATH_STEPS[index + 1] || null;
    const configured = configuredCoverageTotals[stage?.id];
    const nextStepHasQuestions = nextStep ? hasAssessmentPathQuestions(stage, nextStep) : false;
    const levelOneCompleteWithLevelTwoReady =
      options.coverageComplete &&
      Number(currentStep.level || 1) === 1 &&
      (Number(currentStep.phase || 1) === 2 || !nextStepHasQuestions) &&
      configured?.levels?.[2]?.length;
    const finalStepComplete = levelOneCompleteWithLevelTwoReady
      ? false
      : (options.coverageComplete && !nextStepHasQuestions) || !nextStep;
    const nextActionLabel = levelOneCompleteWithLevelTwoReady
      ? "Start Level 2"
      : finalStepComplete
        ? "Move to next skill"
        : ASSESSMENT_PATH_STEPS[index].nextLabel;
    return {
      level: Number(currentStep.level || 1) >= 2 ? 2 : 1,
      phase: Number(currentStep.phase || 1) === 2 ? 2 : 1,
      label: getAssessmentPathLabel(currentStep),
      nextStep,
      nextActionLabel,
      finalStepComplete,
      nextSkillLabel: skillTree[(skillTree.findIndex(item => item.id === stage?.id) + 1)]?.label || ""
    };
  }

  function getInitialSoundStageProgress(records = answerHistoryRef.current) {
    return buildInitialSoundsProgressFromAnswerHistory(records);
  }

  function isPureEarlyPhonicsStage(stage) {
    return PURE_EARLY_PHONICS_SKILL_IDS.has(stage?.id);
  }

  function getNextInitialSoundLevel(progress = getInitialSoundStageProgress()) {
    const levelOneProbe = getInitialSoundRoundPlan({
      studentProgress: { initialSoundsProgress: progress },
      level: 1,
      roundNumber: null,
      seed: 11
    });
    const levelOneMastered = new Set(progress.level1?.masteredLetters || []);
    const levelOneAvailable = levelOneProbe.meta.availableLetters || [];
    const levelOneComplete = levelOneAvailable.length > 0 &&
      levelOneAvailable.every(letter => levelOneMastered.has(letter));

    return levelOneComplete ? 2 : 1;
  }

  // Clear the queue AND forget which letters this round has asked. Every
  // fresh-round reset routes through here; a mid-round rebuild does not, so it
  // still sees the round's asked letters.
  function resetInitialSoundRoundQueue() {
    initialSoundRoundQueueRef.current = [];
    initialSoundRoundAskedLettersRef.current = new Set();
  }

  function buildInitialSoundRoundQueue({ excludeLetters = [] } = {}) {
    const progress = getInitialSoundStageProgress();
    const forcedLevel = initialSoundForcedLevelRef.current;
    const level = forcedLevel || getNextInitialSoundLevel(progress);
    initialSoundForcedLevelRef.current = null;
    const plan = getInitialSoundRoundPlan({
      studentProgress: { initialSoundsProgress: progress },
      level,
      roundNumber: null,
      seed: Date.now() + Math.floor(Math.random() * 1000000),
      excludeLetters,
      itemFilter: item => isRuntimeEligibleEarlySkillQuestion(item, {
        skillId: "initial_sounds",
        level
      })
    });

    initialSoundRoundQueueRef.current = plan.items;
    initialSoundRoundMetaRef.current = plan.meta;

    debugAssessmentCoverage("initial sound round plan", {
      studentId,
      level: plan.meta.level,
      phase: plan.meta.phase,
      selectedLetters: plan.meta.selectedLetters,
      selectedTargetWords: plan.meta.selectedTargetWords,
      reviewLetters: plan.meta.reviewLetters,
      blockedLetters: plan.meta.blockedLetters,
      coveredLetters: plan.meta.coveredLetters
    });

    return plan;
  }

  function getNextInitialSoundQuestion() {
    if (initialSoundRoundQueueRef.current.length === 0) {
      // Mid-round rebuild (asked-letters set is non-empty): exclude letters
      // already asked so we don't repeat them. Fresh rounds cleared the set via
      // resetInitialSoundRoundQueue, so nothing is excluded there.
      buildInitialSoundRoundQueue({
        excludeLetters: [...initialSoundRoundAskedLettersRef.current]
      });
    }

    const next = initialSoundRoundQueueRef.current.shift();
    if (!next) return null;

    if (next.letter) initialSoundRoundAskedLettersRef.current.add(next.letter);
    return next;
  }

  function getFinalSoundQuestionLevel(question = {}) {
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

  function getFinalSoundsLevelOneAvailableQuestions() {
    return allQuestionsRef.current.filter(question =>
      question.skillId === "final_sounds" &&
      !isQuestionBlockedByMediaQa(question) &&
      getFinalSoundQuestionLevel(question) === 1 &&
      getFinalSoundsLevel1QuestionIssues(question).length === 0 &&
      isRuntimeEligibleEarlySkillQuestion(question, {
        skillId: "final_sounds",
        level: 1
      })
    );
  }

  function getFinalSoundsLevelOneMasteryDepth(records = answerHistoryRef.current) {
    return evaluateFinalSoundLevelOneMasteryDepth(records, {
      availableWordsBySound: buildFinalSoundAvailableWordMap(getFinalSoundsLevelOneAvailableQuestions()),
      roundLength: ROUND_LENGTH,
      passScore: PASS_SCORE
    });
  }

  function getNextFinalSoundLevel() {
    return getFinalSoundsLevelOneMasteryDepth().levelOneMastered ? 2 : 1;
  }

  function getAvailableStageQuestions(stageIndex) {
    const stage = skillTree[stageIndex];
    if (!stage) return [];
    if (isInitialSoundsStage(stage)) {
      return initialSoundRoundQueueRef.current.length
        ? [...initialSoundRoundQueueRef.current]
        : buildInitialSoundRoundQueue().items;
    }

    const stageQuestions = allQuestionsRef.current.filter(q => getStageIndex(q) === stageIndex && !isQuestionBlockedByMediaQa(q));
    const pathStep = getNextAssessmentPathStep(stage);
    const levelFilteredStageQuestions = stageQuestions.filter(question =>
      getAssessmentQuestionLevel(stage, question) === pathStep.level
    );
    const requiresExplicitPhase = hasConfiguredPhaseCoverage(stage, pathStep);
    const phaseFilteredStageQuestions = levelFilteredStageQuestions.filter(question =>
      requiresExplicitPhase
        ? getAssessmentQuestionPhase(question) === pathStep.phase
        : (getAssessmentQuestionPhase(question) || pathStep.phase) === pathStep.phase
    );
    const pathFilteredStageQuestions = phaseFilteredStageQuestions.length >= ROUND_LENGTH || hasConfiguredPhaseCoverage(stage, pathStep)
      ? phaseFilteredStageQuestions
      : levelFilteredStageQuestions;
    const finalSoundLevelOneGuardedQuestions = isFinalSoundsStage(stage) && pathStep.level === 1
      ? pathFilteredStageQuestions.filter(question => {
        const issues = getFinalSoundsLevel1QuestionIssues(question);
        if (issues.length > 0 && import.meta.env.DEV) {
          console.warn("Blocked Final Sounds Level 1 question by final runtime guard", {
            id: question.id,
            targetWord: question.targetWord || question.audioText,
            level: question.level,
            source: question.source || question._source || "unknown",
            issues,
            question
          });
        }
        return issues.length === 0;
      })
      : pathFilteredStageQuestions;
    const runtimeContext = {
      skillId: normalizeEarlySkillId(stage.id),
      level: pathStep.level
    };
    const runtimeFilteredStageQuestions = isPureEarlyPhonicsStage(stage)
      ? finalSoundLevelOneGuardedQuestions.filter(question => {
        const issues = getEarlySkillRuntimeEligibilityIssues(question, runtimeContext);
        if (issues.length > 0 && import.meta.env.DEV) {
          console.warn("Blocked early phonics question before runtime selection", {
            id: question.id,
            skillId: runtimeContext.skillId,
            level: runtimeContext.level,
            source: question.source || question._source || "unknown",
            issues,
            question
          });
        }
        return issues.length === 0;
      })
      : finalSoundLevelOneGuardedQuestions;
    const uncoveredFinalSoundQuestions = getUncoveredFinalSoundQuestionsForRound(runtimeFilteredStageQuestions, stage);
    if (uncoveredFinalSoundQuestions.length > 0) return uncoveredFinalSoundQuestions;

    const uncoveredRhymingQuestions = getUncoveredRhymingQuestionsForRound(runtimeFilteredStageQuestions, stage);
    if (uncoveredRhymingQuestions.length > 0) return uncoveredRhymingQuestions;

    const currentProfile = getRoundDuplicateProfile();
    const anyMemory = getStageRepeatMemory(stage.label);
    const correctMemory = getCorrectStageRepeatMemory(stage.label);
    const recentMemory = getRecentStageRepeatMemory(stage.label);
    const filterCurrentRoundRepeats = question => {
      const flags = getRoundDuplicateFlags(question, currentProfile);
      return !flags.questionId && !flags.signature;
    };
    const outsideCurrentRound = runtimeFilteredStageQuestions.filter(filterCurrentRoundRepeats);
    const globalUnseenExact = runtimeFilteredStageQuestions.filter(question =>
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
        allQuestionsRef.current.filter(question => {
          const stageIndex = getStageIndex(question);
          const stage = skillTree[stageIndex];

          return (
            stage &&
            allowedStageLabels.has(stage.label) &&
            getDiagnosticTarget(question) === weakness.target &&
            !usedQuestionIds.has(question.id) &&
            !isQuestionBlockedByMediaQa(question) &&
            (
              !isPureEarlyPhonicsStage(stage) ||
              isRuntimeEligibleEarlySkillQuestion(question, {
                skillId: normalizeEarlySkillId(stage.id),
                level: isFinalSoundsStage(stage) ? getFinalSoundQuestionLevel(question) : (question.level || question.difficulty || 1)
              })
            ) &&
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
    return answerHistoryRef.current
      .filter(record => record.stage === stageLabel)
      .slice(-limit)
      .map(inferAnswerRecordMetadata)
      .filter(metadata => metadata?.itemKey && metadata?.itemType)
      .map(metadata => getItemMasteryStateKey(metadata.itemKey, metadata.itemType));
  }

  function getAnyStageItemKeys(stageLabel) {
    return new Set(
      answerHistoryRef.current
        .filter(record => record.stage === stageLabel)
        .map(inferAnswerRecordMetadata)
        .filter(metadata => metadata?.itemKey && metadata?.itemType)
        .map(metadata => getItemMasteryStateKey(metadata.itemKey, metadata.itemType))
    );
  }

  function getRecentStageQuestionIds(stageLabel, limit = ROUND_LENGTH * 3) {
    return answerHistoryRef.current
      .filter(record => record.stage === stageLabel)
      .slice(-limit)
      .map(record => record.questionId)
      .filter(Boolean);
  }

  function getStageAnswerRecords(stageLabel) {
    return answerHistoryRef.current.filter(record => record.stage === stageLabel);
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
    const currentRoundKeys = new Set(roundItemKeysRef.current);
    const currentRoundQuestionIds = new Set(roundQuestionIdsRef.current);
    const currentRoundTargetWords = new Set(
      roundQuestionIdsRef.current
        .map(id => allQuestionsRef.current.find(item => item.id === id))
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

  function getCoveredStageItemKeys(stage, options = {}) {
    const expectedKeys = getCoverageItemKeysForStage(stage, {
      finalSoundLevel: stage?.id === "final_sounds" ? getNextFinalSoundLevel() : null,
      level: options.level || null,
      phase: options.phase || null
    });
    const covered = new Set();

    if (!options.level && !options.phase) {
      Object.values(itemMastery || {})
        .filter(row => row?.itemKey && row?.itemType && (row.mastered || row.correct > 0))
        .map(row => getItemMasteryStateKey(row.itemKey, row.itemType))
        .filter(key => expectedKeys.has(key))
        .forEach(key => covered.add(key));
    }

    answerHistoryRef.current
      .filter(record =>
        record.isCorrect &&
        (record.stage === stage?.label || record.skillId === stage?.id) &&
        (!options.level || Number(record.itemLevel || 1) === Number(options.level)) &&
        (!options.phase || Number(record.itemPhase || 1) === Number(options.phase))
      )
      .map(inferAnswerRecordMetadata)
      .filter(metadata => metadata?.itemKey && metadata?.itemType)
      .map(metadata => getItemMasteryStateKey(metadata.itemKey, metadata.itemType))
      .filter(key => expectedKeys.has(key))
      .forEach(key => covered.add(key));

    return covered;
  }

  function getUncoveredFinalSoundQuestionsForRound(questions, stage) {
    if (!isFinalSoundsStage(stage)) return [];
    const pathStep = getNextAssessmentPathStep(stage);
    const level = Number(pathStep.level || 1) >= 2 ? 2 : 1;

    const expectedKeys = getCoverageItemKeysForStage(stage, { level });
    const coveredKeys = getCoveredStageItemKeys(stage, { level });
    const currentRoundKeys = new Set(roundItemKeysRef.current);
    const missingKeys = new Set(
      Array.from(expectedKeys).filter(key => !coveredKeys.has(key) && !currentRoundKeys.has(key))
    );

    if (missingKeys.size === 0) return [];

    const missingQuestions = questions.filter(question => {
      const key = getQuestionItemKey(question);
      return key && missingKeys.has(key);
    });

    debugAssessmentCoverage("final sound uncovered selection", {
      studentId,
      level,
      missingKeys: Array.from(missingKeys).map(formatCoverageKeyLabel),
      selectableMissingKeys: Array.from(new Set(missingQuestions.map(getQuestionItemKey).filter(Boolean))).map(formatCoverageKeyLabel),
      selectableQuestionCount: missingQuestions.length
    });

    return prioritizeCoverageQuestions(missingQuestions, stage);
  }

  function getUncoveredRhymingQuestionsForRound(questions, stage) {
    if (stage?.id !== "rhyming") return [];
    const pathStep = getNextAssessmentPathStep(stage);

    const expectedKeys = getCoverageItemKeysForStage(stage, {
      level: pathStep.level,
      phase: pathStep.phase
    });
    const coveredKeys = getCoveredStageItemKeys(stage, { level: pathStep.level, phase: pathStep.phase });
    const currentRoundKeys = new Set(roundItemKeysRef.current);
    const missingKeys = new Set(
      Array.from(expectedKeys).filter(key => !coveredKeys.has(key) && !currentRoundKeys.has(key))
    );

    if (missingKeys.size === 0) return [];

    return prioritizeCoverageQuestions(
      questions.filter(question => {
        const key = getQuestionItemKey(question);
        return key && missingKeys.has(key);
      }),
      stage
    );
  }

  function getCurrentRoundQuestionObjects() {
    return roundQuestionIdsRef.current
      .map(id => allQuestionsRef.current.find(item => item.id === id))
      .filter(Boolean);
  }

  function getRoundDuplicateProfile() {
    return createAssessmentRoundDuplicateProfile(getCurrentRoundQuestionObjects(), {
      selectedItemKeys: roundItemKeysRef.current,
      getItemKey: getQuestionItemKey
    });
  }

  function getRoundDuplicateFlags(question, profile = getRoundDuplicateProfile()) {
    return getAssessmentRoundDuplicateFlags(question, profile, {
      getItemKey: getQuestionItemKey
    });
  }

  function selectNonDuplicateRoundCandidate(prioritized, activeStage) {
    const selection = selectAssessmentRoundCandidate(prioritized, {
      selectedQuestions: getCurrentRoundQuestionObjects(),
      selectedItemKeys: roundItemKeysRef.current,
      skillId: activeStage?.id,
      roundLength: ROUND_LENGTH,
      getItemKey: getQuestionItemKey
    });
    const picked = selection.question;
    if (!picked) {
      debugAssessmentCoverage("round duplicate guard blocked pool", {
        studentId,
        skill: activeStage.label,
        poolSize: prioritized.length,
        currentRoundQuestionIds: roundQuestionIdsRef.current,
        currentRoundItemKeys: roundItemKeysRef.current
      });
      return null;
    }

    debugAssessmentCoverage("round duplicate guard", {
      studentId,
      skill: activeStage.label,
      poolSize: prioritized.length,
      exactSafeCandidates: selection.exactSafeCount,
      strictCandidates: selection.strictCount,
      duplicateRelaxation: selection.duplicateRelaxation,
      templateCap: `${selection.maxTemplateCount}/${ROUND_LENGTH}`,
      selectedQuestionId: picked?.id || "",
      selectedTargetWord: picked ? getQuestionTargetWord(picked) : "",
      selectedItemKey: picked ? getQuestionItemKey(picked) : "",
      selectedSignature: picked ? getRuntimeQuestionSignature(picked) : "",
      duplicateFlags: picked ? getRoundDuplicateFlags(picked, selection.profile) : {}
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
    const rawStage = skillTree[getStageIndex(question)];
    const fallbackSkillId = rawStage?.id || currentStage?.id || null;
    const normalizedQuestion = normalizeAssessmentQuestion(question, fallbackSkillId, roundAnswers.length);
    if (!normalizedQuestion) return null;

    const stage = rawStage || skillTree[getStageIndex(normalizedQuestion)] || currentStage;
    if (isPureEarlyPhonicsStage(stage)) {
      const context = {
        skillId: normalizeEarlySkillId(stage.id),
        level: isFinalSoundsStage(stage) ? getFinalSoundQuestionLevel(normalizedQuestion) : (normalizedQuestion.level || normalizedQuestion.difficulty || 1)
      };
      const issues = getEarlySkillRuntimeEligibilityIssues(normalizedQuestion, context);
      if (issues.length > 0 && import.meta.env.DEV) {
        throw new Error(`Blocked ineligible early phonics question at render boundary: ${normalizedQuestion.id || "(missing id)"} :: ${issues.join("; ")}`);
      }
    }

    const mediaResolvedQuestion = assessmentMediaPickerRef.current?.resolveQuestionMediaDynamically
      ? assessmentMediaPickerRef.current.resolveQuestionMediaDynamically(normalizedQuestion, {
        skillId: stage?.id || fallbackSkillId,
        level: normalizedQuestion.level || normalizedQuestion.difficulty || 1,
        phase: normalizedQuestion.phase || normalizedQuestion.assessmentPhase || 1,
        sessionUsage: assessmentMediaUsageRef.current
      })
      : normalizedQuestion;

    const preparedChoices = Array.isArray(mediaResolvedQuestion.choices)
      ? (isPairSelectionQuestion(mediaResolvedQuestion) ? mediaResolvedQuestion.choices : shuffleArray(mediaResolvedQuestion.choices))
      : mediaResolvedQuestion.choices;
    const preparedAnswerOptions = Array.isArray(mediaResolvedQuestion.answerOptions)
      ? shuffleArray(mediaResolvedQuestion.answerOptions)
      : mediaResolvedQuestion.answerOptions;
    const preparedCards = Array.isArray(mediaResolvedQuestion.imageCards)
      ? shuffleArray(mediaResolvedQuestion.imageCards)
      : mediaResolvedQuestion.imageCards;
    const preparedSoundTiles = Array.isArray(mediaResolvedQuestion.soundTiles)
      ? shuffleArray(mediaResolvedQuestion.soundTiles)
      : mediaResolvedQuestion.soundTiles;
    const preparedLetterTiles = Array.isArray(mediaResolvedQuestion.letterTiles)
      ? shuffleArray(mediaResolvedQuestion.letterTiles)
      : mediaResolvedQuestion.letterTiles;

    return {
      ...mediaResolvedQuestion,
      isTargetedReview,
      choices: preparedChoices,
      answerOptions: preparedAnswerOptions,
      imageCards: preparedCards,
      soundTiles: preparedSoundTiles,
      letterTiles: preparedLetterTiles
    };
  }

  function preloadAssessmentQuestionWindow(questions = []) {
    void preloadQuestionMediaBatch(questions.filter(Boolean).slice(0, 3), {
      source: "assessment-candidate-window"
    });
  }

  function pickQuestion(mode = assessmentMode, stageIndexOverride = currentSkillIndex) {
    answerInFlightRef.current = false;
    setMessage("");
    setShowConfetti(false);
    setDiagnosticFollowUp(false);
    setCheckpointDecision(null);

    if (mode === "targetedReview") {
      const reviewPool =
        getReviewQuestionPool();

      if (reviewPool.length === 0) {
        setMessage("No targeted review questions are available yet. Complete more mastery questions first.");
        setAssessmentTransitioning(false);
        return;
      }

      const preparedReviewQuestion = prepareQuestion(reviewPool[0], true);
      preloadAssessmentQuestionWindow([preparedReviewQuestion, ...reviewPool.slice(1, 3)]);
      setCurrentQuestion(preparedReviewQuestion);
      setAssessmentTransitioning(false);
      return;
    }

    const activeStageIndex = stageIndexOverride;
    const activeStage = skillTree[activeStageIndex] || currentStage;

    if (isInitialSoundsStage(activeStage)) {
      const picked = getNextInitialSoundQuestion();
      if (!picked) {
        const meta = initialSoundRoundMetaRef.current;
        setCurrentQuestion(null);
        setAssessmentTransitioning(false);
        setMessage(
          meta?.blockedLetters?.length
            ? `Initial Sounds needs more media before this round can continue. Blocked letters: ${meta.blockedLetters.join(", ")}.`
            : "No valid Initial Sounds questions are available for this round."
        );
        answerInFlightRef.current = false;
        return;
      }

      debugAssessmentCoverage("initial sound question selection", {
        studentId,
        level: picked.level,
        phase: picked.initialSoundRoundPhase,
        letter: picked.letter,
        targetWord: picked.targetWord,
        reason: picked.selectionReason,
        remainingQueue: initialSoundRoundQueueRef.current.map(item => `${item.letter}:${item.targetWord}`)
      });

      const preparedInitialSoundQuestion = prepareQuestion(picked);
      preloadAssessmentQuestionWindow([
        preparedInitialSoundQuestion,
        ...initialSoundRoundQueueRef.current.slice(0, 2)
      ]);
      setCurrentQuestion(preparedInitialSoundQuestion);
      setAssessmentTransitioning(false);
      return;
    }

    const available = getAvailableStageQuestions(activeStageIndex);

    if (available.length === 0) {
      setMessage(`No questions found for ${activeStage.label}.`);
      setAssessmentTransitioning(false);
      return;
    }

    // The shared selector applies the per-round phoneme/item cap. This permits
    // a skill with a small concept set (for example five short vowels) to use
    // different words for the same concept without repeating an exact item.
    const pool = available;

    const coveragePrioritized = prioritizeCoverageQuestions(pool, activeStage);
    // Diagnostic mode ADAPTS: items whose diagnostic target the child recently
    // missed float to the front, so the round digs into demonstrated
    // weaknesses instead of sampling at random. Stable sort keeps the
    // coverage ordering within each group.
    const weakTargets = assessmentMode === "diagnostic"
      ? getWeakDiagnosticTargets(activeStage.label)
      : null;
    const prioritized = weakTargets && weakTargets.size
      ? [...coveragePrioritized].sort(
          (a, b) =>
            Number(weakTargets.has(String(b.diagnosticTarget || "").trim())) -
            Number(weakTargets.has(String(a.diagnosticTarget || "").trim()))
        )
      : coveragePrioritized;
    const picked = selectNonDuplicateRoundCandidate(prioritized, activeStage);

    if (!picked) {
      setCurrentQuestion(null);
      setAssessmentTransitioning(false);
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
      currentRoundItemKeys: roundItemKeysRef.current,
      recentItemKeys: getRecentStageItemKeys(activeStage.label)
    });

    const preparedQuestion = prepareQuestion(picked);
    preloadAssessmentQuestionWindow([
      preparedQuestion,
      ...prioritized.filter(question => question.id !== picked.id).slice(0, 2)
    ]);
    setCurrentQuestion(preparedQuestion);
    setAssessmentTransitioning(false);
  }


  // Diagnostic-mode adaptation: every diagnostic target this child answered
  // incorrectly in their recent history for this skill.
  function getWeakDiagnosticTargets(skillLabel, lookback = 40) {
    const weak = new Set();
    for (const record of answerHistoryRef.current.slice(-lookback)) {
      if (record.skill !== skillLabel || record.isCorrect) continue;
      const target = String(record.diagnosticTarget || "").trim();
      if (target) weak.add(target);
    }
    return weak;
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
    const mastered = Boolean(previous?.mastered || (isAssessmentEvidence && baseMastered && eligibility.eligible));
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

    // Compute outside the state updater: React may invoke updaters more than
    // once (StrictMode / replays), and a Supabase upsert inside one fires per
    // invocation. Same-event calls always target distinct keys, so reading the
    // render-scope snapshot here is safe.
    const nextRow = nextItemMasteryRow(itemMastery[key], metadata, isCorrect, isNewSessionSeen, formatMetadata, source);
    saveItemMasteryToSupabase(nextRow);
    setItemMastery(prev => ({
      ...prev,
      [key]: nextRow
    }));
  }

  async function persistCompletedAssessmentAttempt(
    attemptRecord,
    { mergeIntoMastery = false, deriveMastery = true } = {}
  ) {
    if (!attemptRecord?.studentId) return null;

    // Adaptive checkpoints use the app's mastery thresholds. The new
    // EL-aligned benchmark suite is descriptive/provisional because the
    // supplied overview does not include official cut scores; those attempts
    // must never inherit the generic 80/60 mastery labels.
    const masterySnapshot = deriveMastery
      ? extractMasteryFromAssessmentAttempt(attemptRecord)
      : null;
    const enrichedAttempt = deriveMastery
      ? {
          ...attemptRecord,
          masteredItems: attemptRecord.masteredItems?.length
            ? attemptRecord.masteredItems
            : masterySnapshot.masteredItems.map(row => row.itemKey),
          developingItems: masterySnapshot.developingItems.map(row => row.itemKey),
          needsSupportItems: masterySnapshot.needsSupportItems.map(row => row.itemKey)
        }
      : {
          ...attemptRecord,
          masteredItems: attemptRecord.masteredItems || [],
          developingItems: attemptRecord.developingItems || [],
          needsSupportItems: attemptRecord.needsSupportItems || []
        };

    if (mergeIntoMastery) {
      setItemMastery(prev => mergeAssessmentAttemptIntoItemMastery(prev, enrichedAttempt));
    }

    try {
      const savePromise = saveAssessmentAttempt(enrichedAttempt, { teacherId, supabase });
      setAssessmentHistory(previous => mergeAssessmentAttemptRecords(
        previous,
        loadAssessmentAttempts({ teacherId })
      ));
      const saveResult = await savePromise;
      if (!saveResult.durable) {
        console.warn("Assessment attempt was not durably saved to either local or cloud storage.", saveResult);
        return null;
      }
      setAssessmentHistory(previous => mergeAssessmentAttemptRecords(previous, saveResult.records));
      return { attempt: enrichedAttempt, saveResult };
    } catch (error) {
      console.warn("Assessment attempt archive save failed.", error);
      return null;
    }
  }

  function getSkillIdForMasteryRow(row) {
    if (row.skillId) return row.skillId;
    const configuredStage = skillTree.find(stage => {
      const configured = configuredCoverageTotals[stage.id];
      return configured?.itemType === row.itemType && configured.itemKeys?.includes(row.itemKey);
    });
    if (configuredStage) return configuredStage.id;

    return skillTree.find(stage => {
      const keys = getCoverageItemKeysForStage(stage, {
        finalSoundLevel: stage?.id === "final_sounds" ? getNextFinalSoundLevel() : null
      });
      return keys.has(getItemMasteryStateKey(row.itemKey, row.itemType));
    })?.id || "";
  }

  function formatMasteryItemLabel(row, stage) {
    const key = row.itemKey;
    if (!key) return "";
    if (row.itemType === "initial_sound") return key;
    if (row.itemType === "final_sound") return `/${key}/`;
    if (row.itemType === "rhyming_family") return key;
    if (row.itemType === "short_vowel") return key.replace(/^short_/, "short ");
    if (row.itemType === "phonics_pattern") return key;
    if (row.itemType === "sight_word" || row.itemType === "cvc_word") return key;
    return stage?.label?.toLowerCase().includes("word") ? key : key.replace(/_/g, " ");
  }

  function getRepresentativeWordsForItem(stageId, itemType, itemKey) {
    const normalizedKey = normalizeItemKey(itemKey);
    const words = new Set();

    answerHistoryRef.current.forEach(record => {
      if (!record?.isCorrect) return;
      const metadata = record.itemKey && record.itemType
        ? { itemKey: record.itemKey, itemType: record.itemType }
        : inferAnswerRecordMetadata(record);
      if (normalizeItemKey(metadata?.itemType) !== normalizeItemKey(itemType)) return;
      if (normalizeItemKey(metadata?.itemKey) !== normalizedKey) return;
      if (stageId && record.skillId && record.skillId !== stageId) return;

      [record.targetWord, record.correct, record.diagnosticTarget]
        .map(value => String(value || "").toLowerCase().replace(/[^a-z]/g, ""))
        .filter(value => value && value !== normalizedKey)
        .forEach(value => words.add(value));
    });

    return Array.from(words).slice(0, 4);
  }

  function buildSkillMasterySummary() {
    return buildSkillMasterySummaryRows({
      itemMastery,
      skillTree,
      configuredCoverageTotals,
      getSkillIdForMasteryRow,
      formatMasteryItemLabel,
      getRepresentativeWordsForItem,
      normalizeItemKey
    });
  }

  async function saveAnswerToSupabase(record) {
    if (!studentId || !teacherId) return;
    const normalizedRecord = normalizeAnswerRecordShape(record);

    // insertWithRetry queues the row on failure and retries on reconnect, so a
    // flaky network no longer silently drops a teacher's assessment record.
    await insertWithRetry("answers", {
      student_id: studentId,
      teacher_id: teacherId,
      skill: normalizedRecord.skill,
      stage: normalizedRecord.stage,
      diagnostic_target: normalizedRecord.diagnosticTarget,
      question: normalizedRecord.question,
      passage: normalizedRecord.passage,
      chosen_answer: normalizedRecord.chosen,
      correct_answer: normalizedRecord.correct,
      is_correct: normalizedRecord.isCorrect
    });
  }

  async function saveMasteryToSupabase(stage, score, total, mastered) {
    if (!studentId || !teacherId) return;

    await insertWithRetry("mastery", {
      student_id: studentId,
      teacher_id: teacherId,
      skill_id: stage.id,
      skill_label: stage.label,
      mastered,
      attempts: (mastery?.[stage.id]?.attempts || 0) + 1,
      last_score: score,
      last_total: total
    });
  }

  function formatCoverageKeyLabel(key) {
    const [, itemKey = key] = String(key).split("::");
    const cleanKey = String(itemKey || "")
      .replace(/_hfw_curated_.+$/i, "")
      .replace(/_hfw_[0-9_]+_sentences$/i, "")
      .replace(/^short_([aeiou])$/i, "short $1")
      .replace(/_/g, " ")
      .trim();
    return cleanKey.toLowerCase() === "i" ? "I" : cleanKey;
  }

  function formatAnswerRecordItemLabel(record = {}) {
    const metadata = inferAnswerRecordMetadata(record);
    const itemKey = metadata?.itemKey || record.itemKey || record.targetWord || record.correct || record.diagnosticTarget || record.chosen || "";
    const itemType = metadata?.itemType || record.itemType || "";
    return formatCoverageKeyLabel(itemType ? getItemMasteryStateKeyForValues(itemKey, itemType) : itemKey);
  }

  function getRoundItemLabels(records = [], { correctOnly = null } = {}) {
    return Array.from(new Set(
      records
        .filter(record => correctOnly === null || Boolean(record.isCorrect) === correctOnly)
        .map(formatAnswerRecordItemLabel)
        .filter(Boolean)
    ));
  }

  function buildCheckpointDecision(stage, stageIndex, nextRound, nextRoundItemKeys, passed, nextRoundCorrectItemKeys = []) {
    if (stage?.id === "initial_sounds") {
      const initialRoundMeta = initialSoundRoundMetaRef.current || {};
      const stageRecords = answerHistoryRef.current
        .filter(record => record.stage === stage.label || record.skillId === "initial_sounds")
        .slice(-nextRound.length);
      const currentLevel = Number(stageRecords.at(-1)?.itemLevel || initialRoundMeta.level) === 2 ? 2 : 1;
      const currentLevelKey = currentLevel === 2 ? "level2" : "level1";
      const previousRecords = answerHistoryRef.current
        .filter(record => record.stage === stage.label || record.skillId === "initial_sounds")
        .slice(0, -nextRound.length);
      const previousProgress = buildInitialSoundsProgressFromAnswerHistory(previousRecords)[currentLevelKey];
      const allProgress = buildInitialSoundsProgressFromAnswerHistory(answerHistoryRef.current)[currentLevelKey];
      const allInitialProgress = buildInitialSoundsProgressFromAnswerHistory(answerHistoryRef.current);
      const levelOneMasteredLetters = new Set(allInitialProgress.level1?.masteredLetters || []);
      const levelOneMastered = INITIAL_SOUND_LETTERS.every(letter => levelOneMasteredLetters.has(letter));
      const alreadyCovered = new Set(previousProgress?.coveredLetters || []);
      const totalMastered = new Set(allProgress?.masteredLetters || []);
      const coveredThisRound = Array.from(new Set(
        stageRecords
          .filter(record => Number(record.itemLevel || currentLevel) === currentLevel)
          .map(record => normalizeItemKey(record.itemKey))
          .filter(letter => INITIAL_SOUND_LETTERS.includes(letter))
      ));
      const remainingItems = INITIAL_SOUND_LETTERS.filter(letter => !totalMastered.has(letter));
      const blockedLetters = initialRoundMeta.blockedLetters || [];
      const selectedTargetWords = stageRecords
        .filter(record => Number(record.itemLevel || currentLevel) === currentLevel)
        .map(record => record.targetWord)
        .filter(Boolean);
      const learnedCorrectly = getRoundItemLabels(stageRecords, { correctOnly: true });
      const missedThisRound = getRoundItemLabels(stageRecords, { correctOnly: false });
      const reviewLetters = coveredThisRound.filter(letter => alreadyCovered.has(letter));
      const score = nextRound.filter(Boolean).length;
      const coverageComplete = remainingItems.length === 0;
      const currentStep = {
        level: currentLevel,
        phase: Number(stageRecords.at(-1)?.itemPhase || initialRoundMeta.phase || 1) === 2 ? 2 : 1
      };
      const pathStatus = getCheckpointPathStatus(stage, currentStep);
      const effectivePassed = passed;

      return {
        skillId: stage.id,
        skillIndex: stageIndex,
        skillLabel: `${stage.label} ${pathStatus.label}`,
        pathStatus,
        correct: score,
        total: ROUND_LENGTH,
        accuracy: Math.round((score / ROUND_LENGTH) * 100),
        passed: effectivePassed,
        accuracyPassed: passed,
        coverageComplete,
        blockedPassReason: "",
        nextSkillLabel: skillTree[stageIndex + 1]?.label || "",
        coveredThisRound: learnedCorrectly,
        missedThisRound,
        alreadyMastered: Array.from(alreadyCovered).filter(letter => !coveredThisRound.includes(letter)),
        totalCoveredItems: Array.from(totalMastered),
        remainingItems,
        coverage: {
          mastered: totalMastered.size,
          total: INITIAL_SOUND_LETTERS.length,
          unit: "sounds"
        },
        initialSoundDebug: {
          level: currentLevel,
          phase: initialRoundMeta.phase || "",
          levelOneMastered,
          currentLevelMastered: INITIAL_SOUND_LETTERS.every(letter => totalMastered.has(letter)),
          masteredLetters: Array.from(totalMastered),
          blockedLetters,
          reviewLetters,
          selectedTargetWords,
          selectedReasons: initialRoundMeta.selectedReasons || []
        }
      };
    }

    if (stage?.id === "final_sounds") {
      const stageRecords = answerHistoryRef.current
        .filter(record => record.stage === stage.label || record.skillId === "final_sounds");
      const currentRoundRecords = stageRecords.slice(-nextRound.length);
      const isLevelOneFinalRound = currentRoundRecords.length > 0 &&
        currentRoundRecords.every(record => finalSoundLevelOneTargets.includes(getFinalSoundTargetFromEvidence(record)));

      if (isLevelOneFinalRound) {
        const previousDepth = getFinalSoundsLevelOneMasteryDepth(stageRecords.slice(0, -nextRound.length));
        const depth = getFinalSoundsLevelOneMasteryDepth(stageRecords);
        const coverageComplete = depth.allSoundsCovered;
        const depthComplete = depth.allSoundsMastered && depth.enoughSuccessfulRounds;
        const currentStep = {
          level: 1,
          phase: Number(currentRoundRecords.at(-1)?.itemPhase || 1) === 2 ? 2 : 1
        };
        const pathStatus = getCheckpointPathStatus(stage, currentStep, {
          coverageComplete: depth.levelOneMastered
        });
        const effectivePassed = passed;
        const missingCoverage = finalSoundLevelOneTargets.filter(target => !depth.coveredTargets.includes(target));
        const stillNeedsPractice = depth.stillNeedsPractice;
        const contentGapText = depth.contentGaps.length
          ? ` Content gap: ${depth.contentGaps.map(gap => `${gap.target} has ${gap.availableWordCount}/${gap.requiredWordCount} distinct usable words`).join("; ")}.`
          : "";
        const blockedPassReason = !coverageComplete
          ? ""
          : !depthComplete
            ? `Level 2 opens after each Level 1 sound has ${FINAL_SOUND_LEVEL_ONE_REQUIRED_CORRECT} correct answers across ${FINAL_SOUND_LEVEL_ONE_REQUIRED_UNIQUE_WORDS} different words and at least ${FINAL_SOUND_LEVEL_ONE_REQUIRED_SUCCESSFUL_ROUNDS} successful rounds.${contentGapText}`
            : "";
        const learnedCorrectly = getRoundItemLabels(currentRoundRecords, { correctOnly: true });
        const missedThisRound = getRoundItemLabels(currentRoundRecords, { correctOnly: false });

        return {
          skillId: stage.id,
          skillIndex: stageIndex,
          skillLabel: `${stage.label} ${pathStatus.label}`,
          pathStatus,
          correct: nextRound.filter(Boolean).length,
          total: ROUND_LENGTH,
          accuracy: Math.round((nextRound.filter(Boolean).length / ROUND_LENGTH) * 100),
          passed: effectivePassed,
          accuracyPassed: passed,
          coverageComplete,
          blockedPassReason,
          nextSkillLabel: skillTree[stageIndex + 1]?.label || "",
          coveredThisRound: learnedCorrectly,
          missedThisRound,
          alreadyMastered: previousDepth.coveredTargets.filter(target => !currentRoundRecords.map(getFinalSoundTargetFromEvidence).includes(target)),
          totalCoveredItems: depth.coveredTargets,
          remainingItems: missingCoverage.length ? missingCoverage : stillNeedsPractice,
          coverage: {
            mastered: depth.coveredTargets.length,
            total: finalSoundLevelOneTargets.length,
            unit: "sounds"
          },
          masteryDepth: {
            label: "Final Sounds Level 1",
            mastered: depth.masteredTargets.length,
            total: finalSoundLevelOneTargets.length,
            successfulRounds: depth.successfulRounds,
            requiredSuccessfulRounds: depth.requiredSuccessfulRounds,
            stillNeedsPractice,
            contentGaps: depth.contentGaps,
            allSoundsMastered: depth.allSoundsMastered,
            enoughSuccessfulRounds: depth.enoughSuccessfulRounds,
            levelOneMastered: depth.levelOneMastered,
            bySound: depth.bySound
          }
        };
      }
    }

    const score = nextRound.filter(Boolean).length;
    const currentRoundRecords = getStageAssessmentRecords(stage).slice(-nextRound.length);
    const currentStep = currentRoundRecords.length
      ? {
        level: Number(currentRoundRecords.at(-1)?.itemLevel || 1) >= 2 ? 2 : 1,
        phase: Number(currentRoundRecords.at(-1)?.itemPhase || 1) === 2 ? 2 : 1
      }
      : getNextAssessmentPathStep(stage);
    const expectedKeys = Array.from(getCoverageItemKeysForStage(stage, {
      finalSoundLevel: stage?.id === "final_sounds" ? getNextFinalSoundLevel() : null,
      level: currentStep.level,
      phase: currentStep.phase
    }));
    const expectedKeySet = new Set(expectedKeys);
    const alreadyCoveredKeys = new Set(
      getCoveredStageItemKeys(stage, { level: currentStep.level, phase: currentStep.phase })
    );
    const coveredKeys = new Set(alreadyCoveredKeys);

    nextRoundCorrectItemKeys
      .filter(key => expectedKeySet.has(key))
      .forEach(key => coveredKeys.add(key));

    const configured = configuredCoverageTotals[stage.id];
    const coverageTotal = expectedKeys.length || configured?.total || 0;
    const coverageUnit = configured?.unit || (stage.label.toLowerCase().includes("word") ? "words" : "items");
    const remainingItems = expectedKeys
      .filter(key => !coveredKeys.has(key))
      .map(formatCoverageKeyLabel);
    const coveredThisRound = Array.from(new Set(
      nextRoundCorrectItemKeys
        .filter(key => expectedKeySet.has(key))
        .map(formatCoverageKeyLabel)
    ));
    const alreadyMastered = Array.from(alreadyCoveredKeys)
      .filter(key => !nextRoundItemKeys.includes(key))
      .map(formatCoverageKeyLabel);
    const totalCoveredItems = Array.from(coveredKeys)
      .map(formatCoverageKeyLabel);
    const learnedCorrectly = getRoundItemLabels(currentRoundRecords, { correctOnly: true });
    const missedThisRound = getRoundItemLabels(currentRoundRecords, { correctOnly: false });
    const coverageComplete = expectedKeys.length
      ? expectedKeys.every(key => coveredKeys.has(key))
      : true;
    const pathStatus = getCheckpointPathStatus(stage, currentStep, { coverageComplete });
    const effectivePassed = passed;

    return {
      skillId: stage.id,
      skillIndex: stageIndex,
      skillLabel: `${stage.label} ${pathStatus.label}`,
      pathStatus,
      correct: score,
      total: ROUND_LENGTH,
      accuracy: Math.round((score / ROUND_LENGTH) * 100),
      passed: effectivePassed,
      accuracyPassed: passed,
      coverageComplete,
      blockedPassReason: "",
      nextSkillLabel: skillTree[stageIndex + 1]?.label || "",
      coveredThisRound: learnedCorrectly.length ? learnedCorrectly : coveredThisRound,
      missedThisRound,
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
    setAssessmentTransitioning(true);

    const initialQuestionStage =
      skillTree[getStageIndex(currentQuestion)] || currentStage;
    const answeredQuestion =
      normalizeAssessmentQuestion(currentQuestion, initialQuestionStage?.id || currentStage?.id || null, roundAnswers.length);

    if (!answeredQuestion?.skillId) {
      console.error("Cannot record answer: missing skillId", { answeredQuestion, choice });
      answerInFlightRef.current = false;
      setAssessmentTransitioning(false);
      return;
    }

    const correctAnswer = getQuestionAnswer(answeredQuestion);
    const isMultiSelectQuestion =
      Array.isArray(answeredQuestion.correctAnswers) &&
      answeredQuestion.correctAnswers.length > 1;
    const submittedAnswer = isFixSentenceQuestion(answeredQuestion)
      ? normalizeSentenceAnswer(choice)
      : isPairSelectionQuestion(answeredQuestion)
        ? normalizePairSelectionAnswer(choice)
        : isMultiSelectQuestion
          ? normalizeMultiSelectAnswer(choice)
          : choice;
    const isCorrect = isFixSentenceQuestion(answeredQuestion)
      ? comparableSentenceAnswer(submittedAnswer) === comparableSentenceAnswer(correctAnswer)
      : isPairSelectionQuestion(answeredQuestion)
        ? submittedAnswer === normalizePairSelectionAnswer(correctAnswer)
        : isMultiSelectQuestion
          ? submittedAnswer === normalizeMultiSelectAnswer(correctAnswer)
          : submittedAnswer === correctAnswer;
    const questionStage =
      skillTree[getStageIndex(answeredQuestion)] || initialQuestionStage || currentStage;
    const stage = questionStage;
    const stageIndex = getStageIndex(answeredQuestion);
    const nextRound = [...roundAnswers, isCorrect];
    const itemMetadata = inferItemMetadata(answeredQuestion);
    const itemStateKey = itemMetadata?.itemKey && itemMetadata?.itemType
      ? getItemMasteryStateKey(itemMetadata.itemKey, itemMetadata.itemType)
      : "";
    // Always append (empty placeholder for keyless questions) so this array
    // stays index-aligned with nextRound; the coverage filter below indexes
    // answers by position. Set-building consumers filter out falsy keys.
    const nextRoundItemKeys = [...roundItemKeys, itemStateKey];
    const nextRoundQuestionIds = answeredQuestion.id
      ? [...roundQuestionIdsRef.current, answeredQuestion.id]
      : [...roundQuestionIdsRef.current];
    const questionPathStep = getQuestionPathStep(questionStage, answeredQuestion);

    setUsedByStage(prev => ({
      ...prev,
      [questionStage.id]: [...(prev[questionStage.id] || []), answeredQuestion.id]
    }));

    roundQuestionIdsRef.current = nextRoundQuestionIds.filter(Boolean);
    setRoundQuestionIds(roundQuestionIdsRef.current);

    roundItemKeysRef.current = nextRoundItemKeys;
    setRoundItemKeys(nextRoundItemKeys);

    setTotalAnswered(n => n + 1);

    const answerRecord = normalizeAnswerRecordShape({
      questionId: answeredQuestion.id,
      questionSignature: getRuntimeQuestionSignature(answeredQuestion),
      promptAnswerSignature: getRuntimeQuestionPromptAnswerSignature(answeredQuestion),
      optionSetSignature: getRepeatOptionSetSignature(answeredQuestion),
      targetWord: getQuestionTargetWord(answeredQuestion),
      targetLetter: answeredQuestion.targetLetter || answeredQuestion.letter || "",
      targetSound: answeredQuestion.targetSound || answeredQuestion.finalSound || answeredQuestion.initialSound || "",
      targetPattern: answeredQuestion.targetPattern || answeredQuestion.pattern || answeredQuestion.rimeFamily || "",
      date: new Date().toLocaleString(),
      skillId: answeredQuestion.skillId || questionStage.id,
      skill: answeredQuestion.skill,
      stage: questionStage.label,
      question: getQuestionPrompt(answeredQuestion),
      passage: answeredQuestion.passage || "",
      chosen: submittedAnswer,
      correct: correctAnswer,
      timestamp: new Date().toISOString(),
      selectedAnswers: Array.isArray(choice) ? choice : [],
      correctAnswers: Array.isArray(answeredQuestion.correctAnswers) ? answeredQuestion.correctAnswers : [],
      isCorrect,
      diagnosticTarget: getDiagnosticTarget(answeredQuestion),
      itemType: itemMetadata?.itemType || "",
      itemKey: itemMetadata?.itemKey || "",
      templateType: answeredQuestion.templateType || answeredQuestion.formatType || getQuestionRoutingFormat(answeredQuestion),
      tags: Array.isArray(answeredQuestion.tags) ? answeredQuestion.tags : [],
      itemLevel: answeredQuestion.skillId === "initial_sounds" || questionStage.id === "initial_sounds"
        ? answeredQuestion.level
        : questionPathStep.level || answeredQuestion.level || "",
      itemPhase: questionPathStep.phase || "",
      selectionReason: answeredQuestion.selectionReason || ""
    });

    debugAssessmentCoverage("assessment answer", {
      questionId: answeredQuestion.id,
      skill: answeredQuestion.skill,
      inferredItemType: itemMetadata?.itemType || "",
      inferredItemKey: itemMetadata?.itemKey || "",
      selectedAnswer: submittedAnswer,
      correctAnswer,
      isCorrect
    });

    answerHistoryRef.current = [...answerHistoryRef.current, answerRecord];
    setAnswerHistory(answerHistoryRef.current);

    saveAnswerToSupabase(answerRecord);
    updateItemMastery(answeredQuestion, isCorrect);

    if (isCorrect) {
      setCorrectAnswered(n => n + 1);
      setShowConfetti(true);
    }

    if (assessmentMode === "targetedReview") {
      if (nextRound.length >= ROUND_LENGTH) {
        setCurrentQuestion(null);
        setFeedback(null);
        setAssessmentTransitioning(false);
        setRoundAnswers([]);
        setRoundItemKeys([]);
        setRoundQuestionIds([]);
        roundItemKeysRef.current = [];
        roundQuestionIdsRef.current = [];
        resetAssessmentMediaUsage();
        setTimeout(() => {
          answerInFlightRef.current = false;
          setAppView(APP_VIEWS.FINISHED);
          setDiagnosticFollowUp(true);
        }, 500);
        return;
      } else {
        setRoundAnswers(nextRound);
      }

      setFeedback({
        question: answeredQuestion,
        skillId: answeredQuestion.skillId,
        isCorrect,
        chosen: submittedAnswer,
        correct: correctAnswer,
        skill: answeredQuestion.skill,
        explanation: getTeachingTip(answeredQuestion, submittedAnswer, isCorrect),
        support: buildFeedbackSupport(answeredQuestion, submittedAnswer),
        autoAdvance: isCorrect
      });
      setAssessmentTransitioning(false);

      setCurrentQuestion(null);
      if (isCorrect) {
        setTimeout(() => {
          if (!assessmentActiveRef.current) return; // endAssessment was called during this 750ms window
          setAssessmentTransitioning(true);
          setFeedback(null);
          pickQuestion("targetedReview");
        }, 750);
      }
      return;
    }

    if (nextRound.length >= ROUND_LENGTH) {
      const score = nextRound.filter(Boolean).length;
      const accuracyPassed = score >= PASS_SCORE;
      const nextRoundCorrectItemKeys = nextRoundItemKeys.filter((key, index) => nextRound[index] && key);
      const checkpoint = buildCheckpointDecision(
        stage,
        stageIndex,
        nextRound,
        nextRoundItemKeys,
        accuracyPassed,
        nextRoundCorrectItemKeys
      );
      const mastered = Boolean(checkpoint.passed);
      const roundRecords = answerHistoryRef.current.slice(-nextRound.length);
      const attemptRecord = buildAssessmentAttemptRecord({
        studentId,
        studentName,
        classId: selectedClassId,
        teacherId,
        stage,
        checkpoint,
        questionRecords: roundRecords,
        assessmentType: getAssessmentAttemptType(assessmentMode),
        policySnapshot: {
          rule: "stage mastery rule at administration time",
          roundLength: ROUND_LENGTH,
          passScore: PASS_SCORE,
          stageId: stage.id,
          level: checkpoint?.pathStatus?.level ?? null,
          phase: checkpoint?.pathStatus?.phase ?? null
        }
      });

      setMastery(prev => ({
        ...prev,
        [stage.id]: {
          attempts: (prev[stage.id]?.attempts || 0) + 1,
          mastered: mastered || prev[stage.id]?.mastered || false,
          // A failed retake never silently disappears: keep the ratchet for
          // the child, but stamp it so the teacher dashboard can surface it.
          lastRetakeFailedAt: !mastered && prev[stage.id]?.mastered
            ? new Date().toISOString()
            : prev[stage.id]?.lastRetakeFailedAt || null,
          lastScore: score,
          lastTotal: ROUND_LENGTH
        }
      }));

      saveMasteryToSupabase(stage, score, ROUND_LENGTH, mastered);
      persistCompletedAssessmentAttempt(attemptRecord);

      setCheckpointDecision(checkpoint);
      setRoundAnswers([]);
      setRoundItemKeys([]);
      setRoundQuestionIds([]);
      roundItemKeysRef.current = [];
      roundQuestionIdsRef.current = [];
      resetAssessmentMediaUsage();
      setCurrentQuestion(null);
      setFeedback(null);
      setAssessmentTransitioning(false);
      setAppView(APP_VIEWS.CHECKPOINT);
      answerInFlightRef.current = false;
      return;
    } else {
      setRoundAnswers(nextRound);
    }

    setFeedback({
      question: answeredQuestion,
      skillId: answeredQuestion.skillId,
      isCorrect,
      chosen: submittedAnswer,
      correct: correctAnswer,
      skill: answeredQuestion.skill,
      explanation: getTeachingTip(answeredQuestion, submittedAnswer, isCorrect),
      support: buildFeedbackSupport(answeredQuestion, submittedAnswer),
      autoAdvance: isCorrect
    });
    setAssessmentTransitioning(false);

    setCurrentQuestion(null);
    if (isCorrect) {
      setTimeout(() => {
        if (!assessmentActiveRef.current) return; // endAssessment was called during this 750ms window
        setAssessmentTransitioning(true);
        setFeedback(null);
        pickQuestion("mastery", stageIndex);
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
    if (!speakWithBrowserFallback(text, { rate: 0.85, pitch: 1 })) {
      console.warn("Browser speech synthesis is unavailable.");
    }
  }

  async function speakText(text, audioPath = "", options = {}) {
    if (!text) return;

    const allowBrowserFallback = options.allowBrowserFallback === true;
    const requireApprovedAudio = options.requireApprovedAudio === true;
    if (
      import.meta.env.DEV &&
      options.audioRole === "target_word" &&
      isGenericInstructionAudioPath(audioPath)
    ) {
      console.warn("Target-word audio attempted to use instruction/prompt audio.", {
        text,
        audioPath
      });
    }
    const preferredAudioPath = audioPath || "";

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
    const { audioManifest, audioTextIndex } = await loadAudioManifestModule();
    const audioKey = audioTextIndex[normalizedText];
    const audioEntry = audioKey ? audioManifest[audioKey] : null;

    if (requireApprovedAudio) return;

    if (audioEntry?.path) {
      const preferredManifestPath = audioEntry.path;
      const audioPaths = audioEntry.kinds?.includes("choice")
        ? [`/audio/choices/${audioKey}.mp3`, preferredManifestPath]
        : [preferredManifestPath];

      try {
        for (const audioPath of audioPaths) {
          if (!audioPath) continue;
          try {
            if (window.speechSynthesis) {
              window.speechSynthesis.cancel();
            }

            const audio = new Audio(audioPath);
            await audio.play();
            return;
          } catch {
            // Try the next known manifest path before falling back to browser speech.
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
    const isFinalSoundsEndingQuestion =
      normalizeEarlySkillId(question.skillId || question.skill || "") === "final_sounds" &&
      String(question.formatType || question.templateType || "").toUpperCase() === "ENDING_SOUND";
    if (isFinalSoundsEndingQuestion) return Boolean(getTargetObjectImage(question));
    if (isListenChooseVowelQuestion(question)) return false;
    if (String(question.formatType || question.templateType || "").toUpperCase().startsWith("HFW_")) return Boolean(
      question.imagePath ||
      question.imageUrl ||
      question.image
    );
    if (
      normalizeEarlySkillId(question.skillId || question.skill || "") === "rhyming" &&
      String(question.formatType || question.templateType || "").toUpperCase() === "RHYMING_PICTURE"
    ) return Boolean(getTargetObjectImage(question));

    const imagePath =
      question.imagePath ||
      question.imageUrl ||
      question.targetImage ||
      question.targetImagePath ||
      question.targetImageUrl ||
      question.image;

    return Boolean(imagePath) && (
      question.questionType === "ixl_template" ||
      question.question === "Listen and find the word." ||
      skill.includes("vocabulary") ||
      skill.includes("preposition") ||
      skill.includes("emotion") ||
      skill.includes("picture comprehension")
    );
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

  const letterItems = letterAssessmentOrder.map(letter => ({
    display: letter,
    type: letter === letter.toUpperCase() ? "uppercase" : "lowercase"
  }));

  const patternItems = advancedPhonicsPatterns.map((item, index) => ({
    ...item,
    exampleWord: item.examples[(patternAttempt + index) % item.examples.length]
  }));

  function startElBenchmarkAssessment(assessmentId, options = {}) {
    if (!studentId) return;
    if (elBenchmarkSession?.studentId === studentId) {
      setMessage("Resume or discard the saved EL benchmark draft before starting another one.");
      return;
    }

    try {
      const startedAt = new Date().toISOString();
      const sessionToken = globalThis.crypto?.randomUUID?.() ||
        `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      const createdSession = createElBenchmarkSession({
        assessmentHistory,
        assessmentId,
        grade: options.grade || "K",
        window: options.window || "BOY",
        requestedStart: options.startMicrophase || "",
        ownership: {
          studentId,
          studentName,
          classId: selectedClassId || "",
          teacherId: teacherId || ""
        },
        startedAt,
        sessionToken
      });
      const nextSession = {
        ...createdSession,
        prerequisiteReview: options.prerequisiteReview || null
      };
      const draftSaved = saveElBenchmarkDraft({ teacherId, studentId, session: nextSession });
      setElBenchmarkDraftSaveFailed(!draftSaved);
      setElBenchmarkSession(nextSession);
      setMessage("");
      setAppView(APP_VIEWS.EL_BENCHMARK);
    } catch (error) {
      console.warn("Could not start the EL benchmark assessment.", error);
      setMessage(error instanceof Error ? error.message : "This assessment route could not be started.");
    }
  }

  function updateElBenchmarkSession(nextSession) {
    if (!nextSession || nextSession.studentId !== studentId) return;
    const draftSaved = saveElBenchmarkDraft({ teacherId, studentId, session: nextSession });
    setElBenchmarkDraftSaveFailed(!draftSaved);
    setElBenchmarkSession(nextSession);
  }

  function resumeElBenchmarkAssessment() {
    if (!elBenchmarkSession || elBenchmarkSession.studentId !== studentId) {
      setElBenchmarkSession(null);
      setMessage("That saved benchmark did not belong to the selected student.");
      return;
    }
    setMessage("");
    setAppView(APP_VIEWS.EL_BENCHMARK);
  }

  function discardElBenchmarkDraft() {
    deleteElBenchmarkDraft({ teacherId, studentId });
    setElBenchmarkDraftSaveFailed(false);
    setElBenchmarkSession(null);
    setMessage("");
    if (appView === APP_VIEWS.EL_BENCHMARK) setAppView(APP_VIEWS.EL_ASSESSMENTS);
  }

  async function archiveElBenchmarkSession(nextSession) {
    if (!nextSession || nextSession.studentId !== studentId) return null;
    const administrationStatus = nextSession.administrationStatus || nextSession.status || "partial";
    const snapshotAt = nextSession.completedAt || nextSession.discontinuedAt || nextSession.savedAt || new Date().toISOString();
    const attempt = buildElBenchmarkAttempt({
      ...nextSession,
      status: administrationStatus,
      administrationStatus,
      completedAt: snapshotAt,
      updatedAt: nextSession.updatedAt || snapshotAt
    }, {
      studentId,
      studentName,
      classId: selectedClassId || nextSession.classId || "",
      teacherId: teacherId || nextSession.teacherId || "",
      startedAt: nextSession.startedAt || snapshotAt,
      completedAt: snapshotAt
    });
    const persistence = await persistCompletedAssessmentAttempt(attempt, { deriveMastery: false });
    return persistence ? { attempt, persistence: persistence.saveResult } : null;
  }

  async function saveElBenchmarkPartialAndExit(nextSession) {
    const terminalStatus = nextSession?.administrationStatus || nextSession?.status || "";
    if (terminalStatus === "completed") return finishElBenchmarkAssessment(nextSession);
    if (terminalStatus === "discontinued") return discontinueElBenchmarkAssessment(nextSession);
    const partialSession = {
      ...nextSession,
      status: "partial",
      administrationStatus: "partial"
    };
    const draftSaved = saveElBenchmarkDraft({ teacherId, studentId, session: partialSession });
    setElBenchmarkDraftSaveFailed(!draftSaved);
    setElBenchmarkSession(partialSession);
    const archiveResult = await archiveElBenchmarkSession(partialSession);
    if (!draftSaved && !archiveResult) {
      setMessage("This evidence could not be saved on this device or to the secure archive. Keep this screen open and try Save partial & exit again.");
      return;
    }
    setMessage(draftSaved
      ? "Partial benchmark evidence saved. You can resume this draft from the assessment hub."
      : "Partial evidence was archived, but this device could not keep a resumable draft.");
    setAppView(APP_VIEWS.EL_ASSESSMENTS);
  }

  async function finishElBenchmarkAssessment(nextSession) {
    const completedSession = {
      ...nextSession,
      status: "completed",
      administrationStatus: "completed"
    };
    const archiveResult = await archiveElBenchmarkSession(completedSession);
    if (!archiveResult) {
      const recoverySaved = saveElBenchmarkDraft({ teacherId, studentId, session: completedSession });
      setElBenchmarkDraftSaveFailed(!recoverySaved);
      setElBenchmarkSession(completedSession);
      const failureMessage = "The completed assessment could not be saved on this device or in the secure archive. Your responses are still here. Keep this page open and select Retry finish.";
      setMessage(failureMessage);
      return {
        ok: false,
        durable: false,
        localSaved: false,
        cloudSaved: false,
        syncPending: false,
        message: failureMessage
      };
    }
    const localSaved = Boolean(archiveResult.persistence.localSaved);
    const cloudSaved = Boolean(archiveResult.persistence.cloudSaved);
    const cloudExpected = isSupabaseConfigured && teacherId !== "local";
    const syncPending = cloudExpected && localSaved && !cloudSaved && Boolean(archiveResult.persistence.syncQueued);
    const cloudCopyUnavailable = cloudExpected && !cloudSaved && !syncPending;
    deleteElBenchmarkDraft({ teacherId, studentId });
    setElBenchmarkDraftSaveFailed(false);
    setElBenchmarkSession(null);
    const successMessage = syncPending
      ? "Assessment completed and saved on this device. Cloud sync is pending; the result is available in this student's reports."
      : cloudCopyUnavailable
        ? "Assessment completed and saved on this device, but a cloud copy could not be queued. Keep this device's data and retry from a reliable connection."
        : "Assessment completed and saved to this student's reports.";
    setMessage(successMessage);
    setAppView(APP_VIEWS.EL_ASSESSMENTS);
    return {
      ok: true,
      durable: true,
      localSaved,
      cloudSaved,
      syncPending,
      cloudCopyUnavailable,
      message: successMessage
    };
  }

  async function discontinueElBenchmarkAssessment(nextSession) {
    const discontinuedSession = {
      ...nextSession,
      status: "discontinued",
      administrationStatus: "discontinued"
    };
    const archiveResult = await archiveElBenchmarkSession(discontinuedSession);
    if (!archiveResult) {
      const recoverySaved = saveElBenchmarkDraft({ teacherId, studentId, session: discontinuedSession });
      setElBenchmarkDraftSaveFailed(!recoverySaved);
      setElBenchmarkSession(discontinuedSession);
      const failureMessage = "The discontinued assessment could not be saved on this device or in the secure archive. The evidence is still on this screen; try saving it again.";
      setMessage(failureMessage);
      return {
        ok: false,
        durable: false,
        localSaved: false,
        cloudSaved: false,
        syncPending: false,
        message: failureMessage
      };
    }
    const localSaved = Boolean(archiveResult.persistence.localSaved);
    const cloudSaved = Boolean(archiveResult.persistence.cloudSaved);
    const cloudExpected = isSupabaseConfigured && teacherId !== "local";
    const syncPending = cloudExpected && localSaved && !cloudSaved && Boolean(archiveResult.persistence.syncQueued);
    const cloudCopyUnavailable = cloudExpected && !cloudSaved && !syncPending;
    deleteElBenchmarkDraft({ teacherId, studentId });
    setElBenchmarkDraftSaveFailed(false);
    setElBenchmarkSession(null);
    const successMessage = syncPending
      ? "Discontinued evidence saved on this device without counting unadministered items as incorrect. Cloud sync is pending."
      : cloudCopyUnavailable
        ? "Discontinued evidence saved on this device, but a cloud copy could not be queued. Keep this device's data and retry from a reliable connection."
        : "Discontinued evidence saved without counting unadministered items as incorrect.";
    setMessage(successMessage);
    setAppView(APP_VIEWS.EL_ASSESSMENTS);
    return {
      ok: true,
      durable: true,
      localSaved,
      cloudSaved,
      syncPending,
      cloudCopyUnavailable,
      message: successMessage
    };
  }

  function returnFromElBenchmarkAssessment() {
    setMessage("Draft auto-saved on this device. Use Resume draft to continue.");
    setAppView(APP_VIEWS.EL_ASSESSMENTS);
  }

  function startAdvancedPhonicsAssessment() {
    setPatternIndex(0);
    setPatternAssessment([]);
    setPatternAttempt(attempt => attempt + 1);
    patternAssessmentArchivedRef.current = false;
    setAppView(APP_VIEWS.ADVANCED_PHONICS);
  }

  function startLetterAssessment() {
    setAppView(APP_VIEWS.LETTERS);
  }

  function archivePatternAssessment(nextAssessment) {
    if (!studentId || nextAssessment.length < patternItems.length || patternAssessmentArchivedRef.current) return;
    patternAssessmentArchivedRef.current = true;
    const completedAt = new Date().toISOString();
    const patternStats = nextAssessment.map(item => {
      const correct = Number(Boolean(item.soundCorrect)) + Number(Boolean(item.wordCorrect));
      return {
        pattern: item.pattern,
        exampleWord: item.exampleWord,
        attempts: 2,
        correct,
        incorrect: 2 - correct,
        accuracy: Math.round((correct / 2) * 100),
        status: correct === 2 ? "mastered" : correct / 2 >= 0.6 ? "developing" : "needs_support"
      };
    });
    const questionRecords = nextAssessment.flatMap((item, index) => ([
      {
        questionId: `advanced_phonics_pattern_${normalizeItemKey(item.pattern)}_sound_${index + 1}`,
        prompt: `Say the sound for ${item.pattern}.`,
        pattern: item.pattern,
        targetPattern: item.pattern,
        targetWord: item.exampleWord,
        itemKey: normalizeItemKey(item.pattern),
        itemType: "phonics_pattern",
        correctAnswer: item.pattern,
        selectedAnswer: item.soundCorrect ? item.pattern : "not_yet",
        isCorrect: Boolean(item.soundCorrect),
        skillId: "advanced_phonics_patterns",
        templateType: "phonics_pattern_sound",
        level: 2,
        phase: 1,
        timestamp: completedAt
      },
      {
        questionId: `advanced_phonics_pattern_${normalizeItemKey(item.pattern)}_word_${index + 1}`,
        prompt: `Read the example word ${item.exampleWord}.`,
        pattern: item.pattern,
        targetWord: item.exampleWord,
        targetPattern: item.pattern,
        itemKey: normalizeItemKey(item.pattern),
        itemType: "phonics_pattern",
        correctAnswer: item.exampleWord,
        selectedAnswer: item.wordCorrect ? item.exampleWord : "not_yet",
        isCorrect: Boolean(item.wordCorrect),
        skillId: "advanced_phonics_patterns",
        templateType: "phonics_pattern_word",
        level: 2,
        phase: 1,
        timestamp: completedAt
      }
    ]));

    const correctCount = questionRecords.filter(record => record.isCorrect).length;
    persistCompletedAssessmentAttempt({
      id: `advanced_phonics_patterns_${studentId}_${Date.parse(completedAt)}`,
      studentId,
      studentName,
      classId: selectedClassId,
      teacherId,
      assessmentType: "advanced_phonics_patterns",
      skillId: "advanced_phonics_patterns",
      skillName: "Advanced Phonics Patterns",
      skillLevel: 2,
      skillPhase: 1,
      startedAt: questionRecords[0]?.timestamp || completedAt,
      completedAt,
      totalQuestions: questionRecords.length,
      correctCount,
      incorrectCount: questionRecords.length - correctCount,
      passed: correctCount >= Math.ceil(questionRecords.length * 0.8),
      status: correctCount >= Math.ceil(questionRecords.length * 0.8) ? "mastered" : "needs_retry",
      masteredItems: patternStats.filter(row => row.status === "mastered").map(row => row.pattern),
      developingItems: patternStats.filter(row => row.status === "developing").map(row => row.pattern),
      needsSupportItems: patternStats.filter(row => row.status === "needs_support").map(row => row.pattern),
      patternStats,
      answers: questionRecords.map(record => ({
        questionId: record.questionId,
        pattern: record.pattern,
        targetPattern: record.targetPattern,
        targetWord: record.targetWord,
        correctAnswer: record.correctAnswer,
        selectedAnswer: record.selectedAnswer,
        isCorrect: record.isCorrect,
        templateType: record.templateType,
        level: record.level,
        tags: record.tags || []
      })),
      questionRecords
    }, { mergeIntoMastery: true });
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

    // Keep persistence outside the React state updater. React may replay an
    // updater in development; a network write inside it can archive twice.
    const nextAssessment = [
      ...patternAssessment,
      {
        pattern: current.pattern,
        exampleWord: current.exampleWord,
        soundCorrect,
        wordCorrect
      }
    ];
    setPatternAssessment(nextAssessment);
    archivePatternAssessment(nextAssessment);

    setPatternIndex(prev => prev + 1);
  }

  function resetPatternAssessment() {
    setPatternIndex(0);
    setPatternAssessment([]);
    setPatternAttempt(attempt => attempt + 1);
    patternAssessmentArchivedRef.current = false;
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

    const nextAssessment = [
      ...letterAssessment,
      {
        letter: current.display,
        type: current.type,
        knowsName,
        knowsSound
      }
    ];
    setLetterAssessment(nextAssessment);
    archiveLetterAssessment(nextAssessment);

    setLetterIndex(prev => prev + 1);
  }

  function resetLetterAssessment() {
    setLetterIndex(0);
    setLetterAssessment([]);
    letterAssessmentArchivedRef.current = false;
  }

  function archiveLetterAssessment(nextAssessment) {
    if (!studentId || nextAssessment.length < letterItems.length || letterAssessmentArchivedRef.current) return;
    letterAssessmentArchivedRef.current = true;
    const completedAt = new Date().toISOString();
    const questionRecords = nextAssessment.flatMap((item, index) => {
      const letter = normalizeItemKey(item.letter);
      return [
        {
          questionId: `el_letter_${letter}_${item.type}_name_${index + 1}`,
          prompt: `Name the ${item.type} letter ${item.letter}.`,
          targetLetter: item.letter,
          itemKey: letter,
          itemType: "letter_name",
          correctAnswer: item.letter,
          selectedAnswer: item.knowsName ? item.letter : "not_yet",
          isCorrect: Boolean(item.knowsName),
          skillId: "el_letter_assessment",
          templateType: "letter_name",
          level: 1,
          phase: 1,
          timestamp: completedAt
        },
        {
          questionId: `el_letter_${letter}_${item.type}_sound_${index + 1}`,
          prompt: `Say the sound for ${item.letter}.`,
          targetLetter: item.letter,
          targetSound: letter,
          itemKey: letter,
          itemType: "letter_sound",
          correctAnswer: letter,
          selectedAnswer: item.knowsSound ? letter : "not_yet",
          isCorrect: Boolean(item.knowsSound),
          skillId: "el_letter_assessment",
          templateType: "letter_sound",
          level: 1,
          phase: 1,
          timestamp: completedAt
        }
      ];
    });
    const correctCount = questionRecords.filter(record => record.isCorrect).length;

    persistCompletedAssessmentAttempt({
      studentId,
      studentName,
      classId: selectedClassId,
      teacherId,
      assessmentType: "el_letter_assessment",
      skillId: "el_letter_assessment",
      skillName: "EL Letter Name and Sound",
      skillLevel: 1,
      skillPhase: 1,
      startedAt: questionRecords[0]?.timestamp || completedAt,
      completedAt,
      totalQuestions: questionRecords.length,
      correctCount,
      passed: correctCount >= Math.ceil(questionRecords.length * 0.8),
      status: correctCount >= Math.ceil(questionRecords.length * 0.8) ? "mastered" : "needs_retry",
      questionRecords
    });
  }

  async function exportLetterAssessment() {
    try {
      const generatedAt = new Date();
      const today =
        generatedAt.toISOString().slice(0, 10);

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

    await addWorkbookExportProvenance(workbook, "letter", {
      className: classList.find(row => row.id === selectedClassId)?.name || "",
      learnerName: studentName || "Unnamed student",
      learnerId: studentId,
      generatedAt,
      evidenceSource: letterAssessment
    });

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
      const generatedAt = new Date();
      const today =
        generatedAt.toISOString().slice(0, 10);

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

    await addWorkbookExportProvenance(workbook, "pattern", {
      className: classList.find(row => row.id === selectedClassId)?.name || "",
      learnerName: studentName || "Unnamed student",
      learnerId: studentId,
      generatedAt,
      evidenceSource: patternAssessment
    });

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


  async function exportCSVData() {
    const { exportStudentAnswerHistoryCsv } = await importWithRetry(() => (
      import("./utils/exportStudentAnswerHistoryCsv.js")
    ));
    return exportStudentAnswerHistoryCsv({
      answerHistory,
      className: classList.find(row => row.id === selectedClassId)?.name || "",
      coverageSnapshot,
      skillTree,
      studentId,
      studentName
    });
  }

  async function exportStudentAssessmentWorkbook(benchmarkScope = null) {
    if (!studentId) {
      const error = new Error("Choose a student before exporting the student Excel report.");
      setMessage(error.message);
      throw error;
    }
    try {
      const { exportStudentElAssessmentExcel } = await importWithRetry(() => import("./utils/exportElAssessmentExcel.js"));
      const report = await exportStudentElAssessmentExcel({
        assessmentHistory,
        students: [
          ...studentList,
          {
            id: studentId,
            name: studentName || "Unnamed student",
            classId: selectedClassId
          }
        ],
        classes: classList,
        studentId,
        classId: selectedClassId || "",
        teacherId: teacherId || "local",
        benchmarkScope,
        itemMastery,
        skillMasterySummary: reportSkillMasterySummary,
        evidenceReadState: selectedStudentEvidenceReadState,
        supabase: isSupabaseConfigured ? supabase : null
      });
      setMessage(report.persistence?.durable === false
        ? "Student Excel report exported, but its saved-report history could not be stored. Keep the downloaded file and try again when storage is available."
        : "Student Excel report exported.");
    } catch (error) {
      console.error("Student Excel report export failed:", error);
      setMessage("Could not export the student Excel report.");
      throw error;
    }
  }

  async function exportReadingReport() {
    try {
      const {
        formatGuidedReadingType,
        getGuidedReadingWordStatusRows,
        summarizeGuidedReadingProgress,
        summarizeGuidedReadingRecords
      } = await loadGuidedReadingBooksModule();
      const workbook = await createExcelWorkbook();
      const progress = summarizeGuidedReadingProgress(guidedReadingRecords);
      const wordStatusRows = getGuidedReadingWordStatusRows(guidedReadingRecords);
      const observationRows = summarizeGuidedReadingRecords(guidedReadingRecords);
      const observationsByBook = new Map(observationRows.map(row => [row.bookId, row]));
      const studentLabel = studentName || "Student";
      const filenameDate = formatExportDateForFilename(new Date());
      const filename = `${safeExportFilename(studentLabel)} - ${filenameDate} - Reading Report.xlsx`;
      const generatedAt = new Date();

      workbook.creator = "Literacy Guide";
      workbook.created = generatedAt;

      const summarySheet = workbook.addWorksheet("Summary");
      summarySheet.columns = [
        { header: "Metric", key: "metric", width: 28 },
        { header: "Value", key: "value", width: 36 }
      ];
      [
        ["Student Name", studentLabel],
        ["Total Books Read", progress.totalBooksRead],
        ["Total Non-Fiction", progress.nonfictionCount],
        ["Level A count", progress.byLevel.A || 0],
        ["Level B count", progress.byLevel.B || 0],
        ["Level C count", progress.byLevel.C || 0],
        ["Level D count", progress.byLevel.D || 0],
        ["Level E count", progress.byLevel.E || 0],
        ["Level F count", progress.byLevel.F || 0],
        ["Total Rereads", progress.totalRereads],
        ["Latest Reading Date", formatReportDate(progress.latestReadingDate)]
      ].forEach(([metric, value]) => summarySheet.addRow({ metric, value }));

      const completedSheet = workbook.addWorksheet("Completed Books");
      completedSheet.columns = [
        { header: "First Read Date", key: "firstReadAt", width: 24 },
        { header: "Last Read Date", key: "lastReadAt", width: 24 },
        { header: "Title", key: "title", width: 32 },
        { header: "Level", key: "level", width: 10 },
        { header: "Type", key: "type", width: 16 },
        { header: "Read Count", key: "readCount", width: 12 },
        { header: "Pages Completed", key: "completedPages", width: 18 },
        { header: "Total Pages", key: "totalPages", width: 14 }
      ];
      progress.completedBooks.forEach(row => completedSheet.addRow({
        firstReadAt: formatReportDate(row.firstReadAt),
        lastReadAt: formatReportDate(row.lastReadAt),
        title: row.title,
        level: row.level,
        type: formatGuidedReadingType(row.type),
        readCount: row.readCount,
        completedPages: row.completedPages,
        totalPages: row.totalPages
      }));

      const inProgressSheet = workbook.addWorksheet("In Progress Books");
      inProgressSheet.columns = [
        { header: "Last Opened Date", key: "lastReadAt", width: 24 },
        { header: "Title", key: "title", width: 32 },
        { header: "Level", key: "level", width: 10 },
        { header: "Type", key: "type", width: 16 },
        { header: "Pages Completed", key: "completedPages", width: 18 },
        { header: "Total Pages", key: "totalPages", width: 14 }
      ];
      progress.inProgressBooks.forEach(row => inProgressSheet.addRow({
        lastReadAt: formatReportDate(row.lastReadAt),
        title: row.title,
        level: row.level,
        type: formatGuidedReadingType(row.type),
        completedPages: row.completedPages,
        totalPages: row.totalPages
      }));

      const observationsSheet = workbook.addWorksheet("Book Observations");
      observationsSheet.columns = [
        { header: "Last Read Date", key: "lastReadAt", width: 20 },
        { header: "Title", key: "title", width: 32 },
        { header: "Level", key: "level", width: 10 },
        { header: "Type", key: "type", width: 16 },
        { header: "Status", key: "status", width: 16 },
        { header: "Read Count", key: "readCount", width: 12 },
        { header: "Pages", key: "pages", width: 14 },
        { header: "Words Marked", key: "attempted", width: 14 },
        { header: "Read Correctly", key: "correct", width: 15 },
        { header: "Needs Support", key: "support", width: 15 },
        { header: "Marked-word Accuracy", key: "accuracy", width: 22 },
        { header: "Quiz Result", key: "quiz", width: 16 },
        { header: "Teacher Notes", key: "notes", width: 16 }
      ];
      progress.rows.forEach(row => {
        const record = guidedReadingRecords[row.bookId] || {};
        const observation = observationsByBook.get(row.bookId) || {};
        const quizTotal = Number(record.quizTotal || 0);
        const noteCount = Number(Boolean(String(observation.wholeBookNote || "").trim())) + (observation.pageNotes?.length || 0);
        observationsSheet.addRow({
          lastReadAt: formatReportDate(row.lastReadAt),
          title: row.title,
          level: row.level,
          type: formatGuidedReadingType(row.type),
          status: row.completed ? "Completed" : "In progress",
          readCount: row.readCount,
          pages: `${row.completedPages}/${row.totalPages}`,
          attempted: observation.attempted || 0,
          correct: observation.correct || 0,
          support: observation.support || 0,
          accuracy: observation.attempted ? `${observation.accuracy}%` : "Not marked",
          quiz: quizTotal ? `${Number(record.quizScore || 0)}/${quizTotal}` : "Not completed",
          notes: noteCount
        });
      });

      const notesSheet = workbook.addWorksheet("Teacher Notes");
      notesSheet.columns = [
        { header: "Date", key: "date", width: 20 },
        { header: "Book Title", key: "title", width: 32 },
        { header: "Level", key: "level", width: 10 },
        { header: "Location", key: "location", width: 18 },
        { header: "Note", key: "note", width: 72 }
      ];
      observationRows.forEach(observation => {
        const record = guidedReadingRecords[observation.bookId] || {};
        if (String(observation.wholeBookNote || "").trim()) {
          notesSheet.addRow({
            date: formatReportDate(record.lastReadAt || observation.completedAt),
            title: observation.title,
            level: observation.level,
            location: "Whole book",
            note: observation.wholeBookNote
          });
        }
        observation.pageNotes.forEach(pageNote => notesSheet.addRow({
          date: formatReportDate(record.pages?.[Math.max(0, Number(pageNote.page) - 1)]?.updatedAt || record.lastReadAt || observation.completedAt),
          title: observation.title,
          level: observation.level,
          location: `Page ${pageNote.page}`,
          note: pageNote.note
        }));
      });
      if (notesSheet.rowCount === 1) {
        notesSheet.addRow({ note: "No teacher notes have been saved yet." });
      }

      const wordSheetColumns = [
        { header: "Date", key: "date", width: 24 },
        { header: "Book Title", key: "title", width: 32 },
        { header: "Level", key: "level", width: 10 },
        { header: "Page", key: "page", width: 10 },
        { header: "Word", key: "word", width: 18 },
        { header: "Status", key: "status", width: 18 },
        { header: "Count", key: "count", width: 10 }
      ];

      const greenWordsSheet = workbook.addWorksheet("Green Words - Read Correctly");
      greenWordsSheet.columns = wordSheetColumns;
      wordStatusRows
        .filter(row => row.status === "Read Correctly")
        .forEach(row => greenWordsSheet.addRow({
          date: formatReportDate(row.date),
          title: row.title,
          level: row.level,
          page: row.page,
          word: row.word,
          status: row.status,
          count: row.count
        }));

      const orangeWordsSheet = workbook.addWorksheet("Orange Words - Needs Support");
      orangeWordsSheet.columns = wordSheetColumns;
      wordStatusRows
        .filter(row => row.status === "Needs Support")
        .forEach(row => orangeWordsSheet.addRow({
          date: formatReportDate(row.date),
          title: row.title,
          level: row.level,
          page: row.page,
          word: row.word,
          status: row.status,
          count: row.count
        }));

      [
        summarySheet,
        completedSheet,
        inProgressSheet,
        observationsSheet,
        notesSheet,
        greenWordsSheet,
        orangeWordsSheet
      ].forEach(sheet => {
        sheet.getRow(1).font = { bold: true };
        sheet.getRow(1).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFEFF6FF" }
        };
        sheet.views = [{ state: "frozen", ySplit: 1 }];
      });

      await addWorkbookExportProvenance(workbook, "guided-reading", {
        className: classList.find(row => row.id === selectedClassId)?.name || "",
        learnerName: studentLabel,
        learnerId: studentId,
        generatedAt,
        evidenceSource: guidedReadingRecords
      });

      const buffer = await workbook.xlsx.writeBuffer();
      downloadBlob(
        new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        }),
        filename
      );
      setMessage("Reading report Excel exported.");
    } catch (error) {
      console.error("Reading report Excel export failed:", error);
      setMessage("Could not export the reading report.");
      throw error;
    }
  }


  async function startAssessment(stageIndex = currentSkillIndex) {
    answerInFlightRef.current = false;
    const nextStageIndex = Number.isFinite(stageIndex) ? stageIndex : currentSkillIndex;
    const nextStage = skillTree[nextStageIndex] || currentStage;
    setAssessmentTransitioning(true);
    setMessage(`Loading ${nextStage.label}...`);
    preloadAssessmentShellForStage(nextStage);
    try {
      await Promise.all([
        loadRuntimeQuestionsForSkill(nextStage.id),
        ensureAssessmentMediaPicker()
      ]);
    } catch (error) {
      console.warn("Could not load assessment skill bank.", { skillId: nextStage.id, error });
      setAssessmentTransitioning(false);
      setMessage("Could not load this assessment. Please try again.");
      return;
    }

    resetInitialSoundRoundQueue();
    initialSoundRoundMetaRef.current = null;
    // Heads-up (not a blocker) when a skill's bank is too thin for a full
    // round of distinct items - the teacher learns BEFORE starting, instead
    // of the round stalling halfway through.
    if (!isInitialSoundsStage(nextStage)) {
      const distinctItems = new Set(
        getAvailableStageQuestions(nextStageIndex).map(getQuestionItemKey).filter(Boolean)
      ).size;
      if (distinctItems > 0 && distinctItems < ROUND_LENGTH) {
        setMessage(`Heads up: ${nextStage.label} only has ${distinctItems} distinct items right now; a full round asks ${ROUND_LENGTH}. The round will stop early if it runs out.`);
      }
    }
    const previewQuestions = isInitialSoundsStage(nextStage)
      ? buildInitialSoundRoundQueue().items
      : prioritizeCoverageQuestions(getAvailableStageQuestions(nextStageIndex), nextStage).slice(0, ROUND_LENGTH);

    debugAssessmentCoverage("start assessment", {
      studentId,
      skill: nextStage.label,
      selectedItemKeys: previewQuestions.map(getQuestionItemKey).filter(Boolean),
      selectedQuestionIds: previewQuestions.map(question => question.id)
    });

    assessmentActiveRef.current = true;
    setCurrentSkillIndex(nextStageIndex);
    setAssessmentMode("mastery");
    setFeedback(null);
    setCurrentQuestion(null);
    setCheckpointDecision(null);
    setDiagnosticFollowUp(false);
    setRoundAnswers([]);
    setRoundItemKeys([]);
    setRoundQuestionIds([]);
    roundItemKeysRef.current = [];
    roundQuestionIdsRef.current = [];
    resetAssessmentMediaUsage();
    setMessage("");
    setAppView(APP_VIEWS.ASSESSMENT);
    pickQuestion("mastery", nextStageIndex);
  }

  function keepPracticingSkill(stageIndex) {
    const stage = skillTree[stageIndex] || currentStage;
    debugAssessmentCoverage("Keep Practicing clicked", {
      studentId,
      currentSkill: stage.label
    });
    void startAssessment(stageIndex);
  }

  async function startTargetedReview() {
    answerInFlightRef.current = false;
    assessmentActiveRef.current = true;
    setAssessmentTransitioning(true);
    setMessage("Loading review questions...");
    void loadFinishedReportPageModule();
    const attemptedStageIds = [
      ...new Set(
        answerHistoryRef.current
          .map(record => skillTree.find(stage => stage.label === record.stage || stage.id === record.skillId)?.id)
          .filter(Boolean)
      )
    ];
    try {
      await Promise.all([
        ensureAssessmentMediaPicker(),
        ...attemptedStageIds.map(loadRuntimeQuestionsForSkill)
      ]);
    } catch (error) {
      console.warn("Could not load targeted review banks.", error);
    }
    setAssessmentMode("targetedReview");
    setFeedback(null);
    setCurrentQuestion(null);
    setCheckpointDecision(null);
    setDiagnosticFollowUp(false);
    setRoundAnswers([]);
    setRoundItemKeys([]);
    setRoundQuestionIds([]);
    resetInitialSoundRoundQueue();
    initialSoundRoundMetaRef.current = null;
    resetAssessmentMediaUsage();
    setMessage("");
    setAppView(APP_VIEWS.ASSESSMENT);
    pickQuestion("targetedReview");
  }

  function endAssessment() {
    answerInFlightRef.current = false;
    assessmentActiveRef.current = false; // cancel any pending auto-advance timeouts
    void loadFinishedReportPageModule();
    setCurrentQuestion(null);
    setFeedback(null);
    setCheckpointDecision(null);
    setRoundItemKeys([]);
    setRoundQuestionIds([]);
    resetInitialSoundRoundQueue();
    initialSoundRoundMetaRef.current = null;
    resetAssessmentMediaUsage();
    setDiagnosticFollowUp(true);
    setStudentReportView("skills-check");
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", studentReportHash("skills-check"));
    }
    setAppView(APP_VIEWS.FINISHED);
  }

  async function goToOverview(diagnosticFollowUp) {
    answerInFlightRef.current = false;
    setCurrentQuestion(null);
    setFeedback(null);
    setCheckpointDecision(null);
    setDiagnosticFollowUp(diagnosticFollowUp === true);
    setAppView(APP_VIEWS.OVERVIEW);

  }
  function returnToTeacherDashboard() {
    answerInFlightRef.current = false;
    setCurrentQuestion(null);
    setFeedback(null);
    setCheckpointDecision(null);
    setDiagnosticFollowUp(false);
    setAppView(APP_VIEWS.TEACHER_DASHBOARD);
  }

  function openStudentPreview(nextView) {
    if (!teacherId || !studentId) return;
    setStudentPreview({
      returnView: appView,
      classId: selectedClassId,
      groupId: teacherGroupId,
      studentId,
      studentName
    });
    setStudentPreviewStatus("Preview mode is read-only. Activity will not be saved to this learner.");
    configureProgressSync({
      mode: "preview",
      studentId,
      studentName,
      classId: selectedClassId,
      teacherId
    });
    setAppView(nextView);
  }

  function returnFromStudentPreview() {
    if (!studentPreview) return;
    setSelectedClassId(studentPreview.classId);
    setTeacherGroupId(studentPreview.groupId);
    setTeacherStudentContext({
      studentId: studentPreview.studentId,
      studentName: studentPreview.studentName
    });
    configureProgressSync({
      mode: "teacher",
      studentId: studentPreview.studentId,
      studentName: studentPreview.studentName,
      classId: studentPreview.classId,
      teacherId
    });
    setAppView(studentPreview.returnView);
    setStudentPreview(null);
    setStudentPreviewStatus("");
  }

  function continueCheckpointSkill() {
    const stageIndex = checkpointDecision?.skillIndex ?? currentSkillIndex;
    void startAssessment(stageIndex);
  }

  function reviewInitialSoundLevelOne() {
    initialSoundForcedLevelRef.current = 1;
    const stageIndex = skillTree.findIndex(stage => stage.id === "initial_sounds");
    void startAssessment(stageIndex === -1 ? currentSkillIndex : stageIndex);
  }

  function moveToNextCheckpointSkill() {
    const nextStageIndex = Math.min(
      (checkpointDecision?.skillIndex ?? currentSkillIndex) + 1,
      skillTree.length - 1
    );
    void startAssessment(nextStageIndex);
  }

  function retryCheckpointSkill() {
    const stageIndex = checkpointDecision?.skillIndex ?? currentSkillIndex;
    void startAssessment(stageIndex);
  }


  async function exportData() {
    const generatedAt = new Date();
    const { summarizeGuidedReadingRecords } = await loadGuidedReadingBooksModule();
    const { exportReadingMasteryText } = await importWithRetry(() => (
      import("./utils/exportReadingMasteryText.js")
    ));
    return exportReadingMasteryText({
      accuracy,
      answerHistory,
      className: classList.find(row => row.id === selectedClassId)?.name || "",
      correctAnswered,
      currentSkillIndex,
      currentStage,
      generatedAt,
      guidedReadingRecords,
      guidedReadingSummaries: summarizeGuidedReadingRecords(guidedReadingRecords),
      mastery,
      passScore: PASS_SCORE,
      roundCorrect,
      roundLength: ROUND_LENGTH,
      skillTree,
      studentId,
      studentName,
      totalAnswered
    });
  }

  function resetStudent() {
    if (studentId) {
      setResetProgressDialogOpen(true);
      return;
    }

    if (profileStorageKey) {
      localStorage.removeItem(profileStorageKey);
    }

    clearTeacherState();
    loadClasses();
  }

  function switchStudent() {
    if (elBenchmarkSession?.studentId) {
      saveElBenchmarkDraft({
        teacherId,
        studentId: elBenchmarkSession.studentId,
        session: elBenchmarkSession
      });
    }
    setNameSaved(false);
    setTeacherStudentContext({ studentId: null, studentName: "" });
    setTeacherGroupId("all");
    setLetterIndex(0);
    setLetterAssessment([]);
    setPatternIndex(0);
    setPatternAssessment([]);
    setPatternAttempt(0);
    setElBenchmarkSession(null);
    setGuidedReadingRecords({});
    setCurrentQuestion(null);
    setFeedback(null);
    setMessage("");
    setAppView(APP_VIEWS.SELECT);
    loadClasses();
    loadStudents(selectedClassId);
  }

  const reportsAssessmentHistory = useMemo(() => {
    if (appView !== APP_VIEWS.REPORTS && appView !== APP_VIEWS.FINISHED) return [];
    const start = typeof performance !== "undefined" ? performance.now() : Date.now();
    const rows = assessmentHistory.filter(record => !studentId || record.studentId === studentId);
    if (import.meta.env.DEV) {
      const duration = Math.round((typeof performance !== "undefined" ? performance.now() : Date.now()) - start);
      console.debug("[Reports] filtered assessment history", {
        durationMs: duration,
        sourceRows: assessmentHistory.length,
        rows: rows.length,
        studentId
      });
    }
    return rows;
  }, [appView, assessmentHistory, studentId]);

  useEffect(() => {
    if (appView !== APP_VIEWS.REPORTS && appView !== APP_VIEWS.FINISHED) {
      setReportSkillMasterySummary([]);
      return undefined;
    }

    let cancelled = false;
    const run = () => {
      const start = typeof performance !== "undefined" ? performance.now() : Date.now();
      const rows = buildLatestSkillMasterySummary();
      if (cancelled) return;
      setReportSkillMasterySummary(rows);
      if (import.meta.env.DEV && appView === APP_VIEWS.REPORTS) {
        const duration = Math.round((typeof performance !== "undefined" ? performance.now() : Date.now()) - start);
        console.debug("[Reports] skill mastery summary", {
          durationMs: duration,
          rows: rows.length
        });
      }
    };

    if (typeof window !== "undefined" && typeof window.requestIdleCallback === "function") {
      const idleId = window.requestIdleCallback(run, { timeout: 600 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(idleId);
      };
    }

    const timeoutId = window.setTimeout(run, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [appView, itemMastery, answerHistory]);

  const coverageSnapshot = useMemo(() =>
    buildCoverageSnapshot(itemMastery, {
      enabled: DEBUG_ASSESSMENT_COVERAGE,
      studentId
    }, answerHistory),
  [itemMastery, studentId, answerHistory]);

  const questionBankCoverage = useMemo(() =>
    buildQuestionBankCoverage(allQuestions),
  [allQuestions]);

  const showSkillsQuestPrototype = typeof window !== "undefined"
    && new URLSearchParams(window.location.search).has("skillsQuest");

  const latestTeacherAccountIsApproved = useEffectEvent(isTeacherAccountApproved);

  useEffect(() => {
    if (!authReady || !teacherUser || !profileLoaded) return;
    if (!latestTeacherAccountIsApproved()) return;
    if (appView === APP_VIEWS.SELECT) {
      setAppView(APP_VIEWS.TEACHER_DASHBOARD);
    }
  }, [appView, authReady, profileLoaded, teacherAccountStatus, teacherUser, isAdmin, setAppView]);

  // When a child finishes one of Today's Mission tasks (book, game, or
  // quest station), bring them back to the mission screen.
  // Uses sessionMode directly: isStudentMode is declared later in this
  // component, so referencing it here crashes with a TDZ error.
  useEffect(() => {
    function handleMissionTaskDone() {
      if (sessionMode !== "student") return;
      setAppView(APP_VIEWS.STUDENT_HOME);
    }
    window.addEventListener("lp-mission-task-done", handleMissionTaskDone);
    return () => window.removeEventListener("lp-mission-task-done", handleMissionTaskDone);
  }, [sessionMode, setAppView]);

  if (showSkillsQuestPrototype) {
    return (
      <PageBoundary resetKey="skills-quest-preview">
        <Suspense fallback={<LazyPageFallback label="Loading Skills Quest..." />}>
          <ElSkillsQuest studentName={studentName || "Reader"} progressScopeKey={studentId || "preview"} />
        </Suspense>
      </PageBoundary>
    );
  }

  if (chunkLoadFailure) {
    return <NewVersionAvailableCard message={chunkLoadFailure} />;
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

  if (!teacherUser && sessionMode !== "student" && authMode !== "resetPassword" && entryMode === "entry") {
    return (
      <PageBoundary resetKey="entry">
        <StudentEntryPage
          onStudent={() => {
            setEntryMode("student");
            setAppView(APP_VIEWS.STUDENT_LOGIN);
          }}
          onTeacher={() => setEntryMode("teacher")}
        />
      </PageBoundary>
    );
  }

  if (!teacherUser && sessionMode !== "student" && authMode !== "resetPassword" && entryMode === "student") {
    return (
      <PageBoundary resetKey="student-login">
        <StudentLoginFlow
          onTeacherEntry={exitToTeacherEntry}
          onSessionStart={applyStudentSession}
        />
      </PageBoundary>
    );
  }

  if (!teacherUser && sessionMode !== "student") {
    return (
      <PageBoundary resetKey={`auth-${authMode}`}>
        <div className="app auth-shell login-auth-shell">
          <button
            type="button"
            className="auth-back-button"
            onClick={() => setEntryMode("entry")}
          >
            <span aria-hidden="true">&larr;</span> Back to selection
          </button>
          {authReconnecting && (
            <div className="message auth-reconnect-banner">
              Reconnecting to your teacher session in the background.
            </div>
          )}
          <motion.div
            className="hero auth-hero"
            initial={{ y: -12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            {/* Decorative beam arcs — references the lighthouse without being literal */}
            <svg className="auth-hero-deco" aria-hidden="true" viewBox="0 0 480 400" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g opacity="0.045" stroke="#0C6B65" strokeLinecap="round">
                <path d="M480 0 Q240 200 0 400" strokeWidth="1"/>
                <path d="M480 0 Q260 180 20 400" strokeWidth="1"/>
                <path d="M480 0 Q280 160 40 400" strokeWidth="1"/>
                <path d="M480 0 Q300 140 60 400" strokeWidth="1"/>
                <path d="M480 0 Q320 120 80 400" strokeWidth="1"/>
                <path d="M480 0 Q340 100 100 400" strokeWidth="1"/>
                <path d="M480 0 Q360 80 120 400" strokeWidth="1"/>
                <path d="M480 0 Q380 60 140 400" strokeWidth="1"/>
                <path d="M480 0 Q400 40 160 400" strokeWidth="1"/>
              </g>
              {/* Subtle concentric arcs from top-right */}
              <g opacity="0.032" stroke="#d68a11" fill="none">
                <path d="M480 0 A200 200 0 0 1 280 200" strokeWidth="1.5"/>
                <path d="M480 0 A280 280 0 0 1 200 280" strokeWidth="1.5"/>
                <path d="M480 0 A360 360 0 0 1 120 360" strokeWidth="1.5"/>
                <path d="M480 0 A440 440 0 0 1 40 400" strokeWidth="1.5"/>
              </g>
            </svg>

            <img src={logoUrl} alt="Literacy Guide" className="auth-hero-logo" />

            <div className="auth-hero-main">
              <div className="auth-hero-copy">
                <h1>Every reader{" "}<br />finds their{" "}<br />path.</h1>
                <p>Structured literacy progression for classrooms, reading groups, and guided practice sessions.</p>
              </div>
              <ul className="auth-hero-features" aria-label="Features">
                <li><span className="auth-hero-feature-dot" aria-hidden="true"/>Skill assessments</li>
                <li><span className="auth-hero-feature-dot" aria-hidden="true"/>Guided reading with running records</li>
              </ul>
            </div>
          </motion.div>

          <AuthPage
            authMode={authMode}
            setAuthMode={setAuthMode}
            authEmail={authEmail}
            setAuthEmail={setAuthEmail}
            authPassword={authPassword}
            setAuthPassword={setAuthPassword}
            authUsername={authUsername}
            setAuthUsername={setAuthUsername}
            authDisplayName={authDisplayName}
            setAuthDisplayName={setAuthDisplayName}
            authSchoolName={authSchoolName}
            setAuthSchoolName={setAuthSchoolName}
            authLoading={authLoading}
            authMessage={authMessage}
            signUpTeacher={signUpTeacher}
            logInTeacher={logInTeacher}
            requestPasswordReset={requestPasswordReset}
            completePasswordReset={completePasswordReset}
            demoTeacherEnabled={demoTeacherEnabled}
            logInDemoTeacher={logInDemoTeacher}
          />
        </div>
      </PageBoundary>
    );
  }

  if (authMode === "resetPassword") {
    return (
      <PageBoundary resetKey="reset-password">
        <div className="app auth-shell">
          <AuthPage
            authMode={authMode}
            setAuthMode={setAuthMode}
            authEmail={authEmail}
            setAuthEmail={setAuthEmail}
            authPassword={authPassword}
            setAuthPassword={setAuthPassword}
            authUsername={authUsername}
            setAuthUsername={setAuthUsername}
            authDisplayName={authDisplayName}
            setAuthDisplayName={setAuthDisplayName}
            authSchoolName={authSchoolName}
            setAuthSchoolName={setAuthSchoolName}
            authLoading={authLoading}
            authMessage={authMessage}
            signUpTeacher={signUpTeacher}
            logInTeacher={logInTeacher}
            requestPasswordReset={requestPasswordReset}
            completePasswordReset={completePasswordReset}
          />
        </div>
      </PageBoundary>
    );
  }

  if (sessionMode !== "student" && teacherAccountStatus === "checking" && !profileLoaded) {
    return (
      <PageBoundary resetKey="checking-account">
        <div className="app">
          <div className="card page-card page-stack auth-card">
            <h2>Checking account access...</h2>
          </div>
        </div>
      </PageBoundary>
    );
  }

  if (sessionMode !== "student" && !isTeacherAccountApproved()) {
    const status = normalizeApprovalStatus(teacherAccountRecord, teacherAccountStatus);
    const isRejected = status === "rejected" || status === "disabled";
    const isSetupRequired = status === "approval_setup_required";
    return (
      <PageBoundary resetKey={`account-status-${status}`}>
        <div className="app auth-shell">
          <div className="card page-card page-stack auth-card">
            <div className="auth-heading">
              <h2>
                {isSetupRequired
                  ? "Signup Approval Setup Needed"
                  : isRejected
                    ? "Account Not Approved"
                    : "Account Waiting For Approval"}
              </h2>
              <p className="muted-text">
                {isSetupRequired
                  ? "Your account is created, but Literacy Guide could not finish setting it up. This is a one-time setup step on our side - please email benjamesbowler@gmail.com and we will activate your account."
                  : isRejected
                    ? "This account request was rejected. Please contact your school administrator if you think this is a mistake."
                    : "Your account request has been submitted. An administrator must approve your account before you can use Literacy Guide."}
              </p>
              {teacherAccountRecord?.username && (
                <p className="muted-text">Username: {teacherAccountRecord.username}</p>
              )}
            </div>
            <button className="main-button" onClick={logOutTeacher} type="button">
              Log Out
            </button>
          </div>
        </div>
      </PageBoundary>
    );
  }

  if (sessionMode !== "student" && teacherUser && !isAdmin && !teacherAccountRecord?.school_id) {
    return (
      <PageBoundary resetKey="teacher-school">
        <div className="app auth-shell">
          <div className="card page-card page-stack auth-card">
            <div className="auth-heading">
              <h2>Set your school</h2>
              <p className="muted-text">Students use school, class, and name to find their login.</p>
            </div>
            <label className="auth-field">
              <strong>School</strong>
              <SchoolNameInput
                autoComplete="organization"
                value={authSchoolName}
                placeholder="Choose your school or type a new one"
                onChange={setAuthSchoolName}
              />
            </label>
            <button className="main-button" disabled={authLoading} onClick={saveTeacherSchool} type="button">
              Save School
            </button>
            {authMessage && <p className="message auth-message">{authMessage}</p>}
          </div>
        </div>
      </PageBoundary>
    );
  }

  const roundCorrect = calculateRoundCorrect(roundAnswers);
  const roundProgress = calculateRoundProgress(roundAnswers, ROUND_LENGTH);
  const accuracy = calculateAccuracy({ totalAnswered, correctAnswered });
  const isFocusedAssessment = isFocusedAssessmentView(appView);
  const effectiveAssessmentFullscreen = isFocusedAssessment && assessmentFullscreen;
  const isStudentMode = sessionMode === "student";
  const hasTeacherSchool = Boolean(teacherAccountRecord?.school_id || teacherSchoolName);
  const isFocusedShell = isStudentMode || appView === APP_VIEWS.STUDENT_LOGIN || isFocusedAssessment || (isStudentSurfaceView && learnFullscreen);
  // A teacher previewing a child surface (Student Page, Guided Reading, Story
  // Quests, Phonics, Adventure, Hollow) needs the child-facing CSS scope so the
  // images/logos are constrained — without it they render at natural size and
  // the whole preview balloons. Apply student-mode-app but KEEP the sidebar
  // (no "no-sidebar", no world backdrop).
  const isChildPreviewView = !isStudentMode && [
    APP_VIEWS.STUDENT_HOME,
    APP_VIEWS.GUIDED_READING,
    APP_VIEWS.LEARN,
    APP_VIEWS.PHONICS_LEARN,
    APP_VIEWS.SKILLS_BLOCK_QUEST,
    APP_VIEWS.STUDENT_REWARDS
  ].includes(appView);
  const childProgressScopeKey = studentPreview
    ? `teacher-preview:${teacherId}:${studentPreview.studentId}`
    : studentId || studentName || "default";
  const appShellClassName = [
    "app",
    isStudentMode ? "student-mode-app no-sidebar" : "",
    isChildPreviewView ? "student-mode-app teacher-child-preview" : "",
    (isStudentMode || isChildPreviewView) ? "lp-skin-sage" : "",
    isFocusedAssessment ? "assessment-app no-sidebar" : "",
    appView === APP_VIEWS.EL_BENCHMARK ? "el-benchmark-app" : "",
    effectiveAssessmentFullscreen ? "assessment-fullscreen-app" : "",
    isStudentSurfaceView && learnFullscreen ? "learn-fullscreen-app no-sidebar" : ""
  ].filter(Boolean).join(" ");
  const studentSurfaceShellClass = isStudentMode && isStudentSurfaceView
    ? [
      "student-surface-shell",
      studentArcadeOpen
        ? "student-surface-shell-arcade"
        : appView === APP_VIEWS.LEARN
          ? "student-surface-shell-story"
          : appView === APP_VIEWS.STUDENT_REWARDS
            ? "student-surface-shell-rewards"
            : "student-surface-shell-phonics"
    ].join(" ")
    : "";

  // ── THE RAIL ON MENU SUB-PAGES ──────────────────────────────────────────
  //
  // The sage rail used to live inside StudentHomePage, so it existed on
  // exactly one screen. Phonics, Adventure Map, Reading Library and Story
  // Quests each replaced it with a small floating "Back" chip in the corner.
  //
  // For a 4-7 year old that costs more than consistency: they lose the only
  // persistent map of the app, their avatar and coin count vanish, and moving
  // between two sections becomes two taps through an intermediate screen
  // instead of one. Keeping the rail also drags the visual language into line
  // for free — it forces the cream ground, type scale and spacing to agree.
  //
  // WORLDS KEEP THEIR FULLSCREEN. Sound Seekers, My Hollow, the Arcade and an
  // open book are places, not menus; the rail would break the immersion that
  // is their whole point. Only menus get it.
  const goStudentHome = () => {
    setStudentArcadeOpen(false);
    setAppView(APP_VIEWS.STUDENT_HOME);
  };
  const goToTeacherIntent = nextView => {
    const nextHash = teacherIntentHash({
      appView: nextView,
      classId: selectedClassId,
      groupId: teacherGroupId,
      learnerId: studentId
    });
    if (nextHash && window.location.hash !== nextHash) {
      window.history.replaceState(window.history.state, "", nextHash);
    }
    setAppView(nextView);
  };
  const railNav = [
    { id: "sounds", label: "Sound Seekers", icon: "sound", go: () => { setStudentArcadeOpen(false); setAppView(APP_VIEWS.PHONICS_QUEST); } },
    { id: "phonics", label: "Phonics", icon: "phonics", go: () => { setStudentArcadeOpen(false); setAppView(APP_VIEWS.PHONICS_LEARN); } },
    { id: "map", label: "Adventure Map", icon: "map", go: () => { setStudentArcadeOpen(false); setAppView(APP_VIEWS.SKILLS_BLOCK_QUEST); } },
    { id: "books", label: "Books", icon: "book", go: () => { setStudentArcadeOpen(false); setGuidedInitialBookId(""); setAppView(APP_VIEWS.GUIDED_READING); } },
    { id: "stories", label: "Story Quests", icon: "story", go: () => { setStudentArcadeOpen(false); setAppView(APP_VIEWS.LEARN); } },
    { id: "arcade", label: "Arcade", icon: "arcade", go: () => { setStudentArcadeOpen(true); setAppView(APP_VIEWS.PHONICS_LEARN); } },
    { id: "hollow", label: "My Hollow", icon: "hollow", go: () => { setStudentArcadeOpen(false); setAppView(APP_VIEWS.STUDENT_REWARDS); } }
  ];
  // Wraps a menu sub-page so it keeps the rail. Fullscreen mode still strips
  // it — a child who asked for fullscreen asked for the content, not the menu.
  const withStudentRail = (activeId, content) => {
    if (!isStudentMode || studentArcadeOpen || learnFullscreen) return content;
    return (
      <div className="lp-home-sage lp-rail-shell">
        <StudentRail
          studentName={studentName}
          scopeKey={studentId || studentName || "default"}
          active={activeId}
          nav={railNav}
          onHome={goStudentHome}
          onCoins={() => { setStudentArcadeOpen(false); setAppView(APP_VIEWS.STUDENT_REWARDS); }}
        />
        <div className="hs-main lp-rail-main">{content}</div>
      </div>
    );
  };

  return (
    <ErrorBoundary
      resetKey={`app-shell-${appView}-${isStudentMode ? studentSessionId || "none" : "teacher"}`}
      fallback={<PageErrorFallback />}
    >
    <div
      className={`lg-app-shell${isFocusedShell ? " no-sidebar" : ""}${isStudentSurfaceView && learnFullscreen ? " learn-fullscreen-shell" : ""}${effectiveAssessmentFullscreen ? " assessment-fullscreen-shell" : ""}${studentSurfaceShellClass ? ` ${studentSurfaceShellClass}` : ""}`}
      data-pal-world={isStudentMode ? worldForScope(studentId || studentName || "default").id : undefined}
      data-teacher-class-id={!isStudentMode ? selectedClassId || "" : undefined}
      data-teacher-group-id={!isStudentMode ? teacherGroupId : undefined}
      data-teacher-learner-id={!isStudentMode ? studentId || "" : undefined}
      data-student-session-id={isStudentMode ? studentSessionId || "" : ""}
    >
      {!isFocusedShell && (
        <Suspense fallback={<aside className="lg-sidebar" aria-label="Loading main navigation" />}>
          <Sidebar
            appView={appView}
            nameSaved={nameSaved}
            studentName={studentName}
            className={getSelectedClassName(classList, selectedClassId)}
            goToStudentHome={() => setAppView(APP_VIEWS.STUDENT_HOME)}
            goToElSkillsQuest={() => setAppView(APP_VIEWS.SKILLS_BLOCK_QUEST)}
            goToGuidedReading={() => setAppView(APP_VIEWS.GUIDED_READING)}
            goToLearn={() => setAppView(APP_VIEWS.LEARN)}
            goToPhonicsLearn={() => setAppView(APP_VIEWS.PHONICS_LEARN)}
            goToReports={() => setAppView(APP_VIEWS.REPORTS)}
            goToWorksheets={() => setAppView(APP_VIEWS.WORKSHEETS)}
            goToPresent={() => setAppView(APP_VIEWS.PRESENT)}
            goToTeacherDashboard={() => goToTeacherIntent(APP_VIEWS.TEACHER_DASHBOARD)}
            goToTeacherClasses={() => goToTeacherIntent(APP_VIEWS.TEACHER_CLASSES)}
            goToTeacherAssess={() => goToTeacherIntent(APP_VIEWS.TEACHER_ASSESS)}
            goToTeacherProgress={() => goToTeacherIntent(APP_VIEWS.TEACHER_PROGRESS)}
            goToTeacherResources={() => goToTeacherIntent(APP_VIEWS.TEACHER_RESOURCES)}
            teacherEmail={teacherUser.email}
            logOutTeacher={logOutTeacher}
            isAdmin={isAdmin}
            openAdminDashboard={openAdminDashboard}
          />
        </Suspense>
      )}
      <div className="lg-content-area">
      <div className={appShellClassName}>
      {!isSupabaseConfigured && !isStudentMode && (
        <div className="supabase-config-banner" role="alert">
          <strong>Nothing is being saved.</strong> This build has no Supabase configuration —
          logins and progress will silently do nothing. Set <code>VITE_SUPABASE_URL</code> and{" "}
          <code>VITE_SUPABASE_ANON_KEY</code> in the deploy environment.
        </div>
      )}
      {showConfetti && !prefersReducedMotion && <Confetti recycle={false} numberOfPieces={90} />}

      {studentPreview && isChildPreviewView && (
        <aside className="teacher-student-preview-banner" aria-label={`Previewing as ${studentPreview.studentName}`}>
          <div>
            <strong>Previewing as {studentPreview.studentName}</strong>
            <span>Read-only preview · learner progress is protected</span>
          </div>
          <p role="status" aria-live="polite">{studentPreviewStatus}</p>
          <button className="lp-button lp-button-secondary" type="button" onClick={returnFromStudentPreview}>
            Return to {studentPreview.returnView === APP_VIEWS.TEACHER_RESOURCES ? "Plan/Resources" : "teacher view"}
          </button>
        </aside>
      )}

      {isStudentMode && appView !== APP_VIEWS.STUDENT_HOME && (
        <button
          className="student-home-float"
          onClick={returnToStudentHome}
          type="button"
          aria-label="Back to my home page"
        >
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
            <path d="M9 12h12" />
          </svg>
          Back
        </button>
      )}

      {appView === APP_VIEWS.STUDENT_LOGIN && (
        <PageBoundary resetKey="student-login-sandbox">
          <StudentLoginFlow
            onTeacherEntry={exitToTeacherEntry}
            onSessionStart={applyStudentSession}
          />
        </PageBoundary>
      )}

      {appView === APP_VIEWS.STUDENT_HOME && nameSaved && (
        <PageBoundary resetKey={`student-home-${studentId}`}>
          <StudentHomePage
            studentName={studentName}
            progressScopeKey={childProgressScopeKey}
            onOpenPhonicsLearn={() => {
              setStudentArcadeOpen(false);
              setAppView(APP_VIEWS.PHONICS_LEARN);
            }}
            onOpenArcade={() => {
              setStudentArcadeOpen(true);
              setAppView(APP_VIEWS.PHONICS_LEARN);
            }}
            onOpenSkillsBlockQuest={() => {
              setStudentArcadeOpen(false);
              setAppView(APP_VIEWS.SKILLS_BLOCK_QUEST);
            }}
            onOpenSoundSeekers={() => {
              setStudentArcadeOpen(false);
              setAppView(APP_VIEWS.PHONICS_QUEST);
            }}
            onOpenStoryQuests={() => {
              setStudentArcadeOpen(false);
              setAppView(APP_VIEWS.LEARN);
            }}
            onOpenGuidedReading={bookId => {
              setStudentArcadeOpen(false);
              setGuidedInitialBookId(typeof bookId === "string" ? bookId : "");
              setAppView(APP_VIEWS.GUIDED_READING);
            }}
            onOpenRewards={() => {
              setStudentArcadeOpen(false);
              setAppView(APP_VIEWS.STUDENT_REWARDS);
            }}
            onLogout={isStudentMode ? logOutStudent : returnToTeacherDashboard}
            logoutLabel={isStudentMode ? "Sign out" : "Teacher dashboard"}
            logoutAriaLabel={isStudentMode ? "Log out" : "Return to teacher dashboard"}
          />
        </PageBoundary>
      )}

      {appView === APP_VIEWS.STUDENT_REWARDS && nameSaved && (
        <PageBoundary resetKey={`student-rewards-${studentId}`}>
          <div className="student-surface-frame student-surface-rewards">
            {renderLearnFullscreenButton()}
            <Suspense fallback={<LazyPageFallback label="Loading your Hollow..." />}>
              <HollowPage
                studentName={studentName}
                progressScopeKey={childProgressScopeKey}
              />
            </Suspense>
          </div>
        </PageBoundary>
      )}

      {appView === APP_VIEWS.SKILLS_BLOCK_QUEST && nameSaved && (
        <PageBoundary resetKey={`skills-block-quest-${studentId}`}>
          {withStudentRail("map", (
            <Suspense fallback={<LazyPageFallback label="Loading Skills Quest..." />}>
              <ElSkillsQuest
                studentName={studentName || "Reader"}
                progressScopeKey={studentId || studentName || "default"}
                onExit={() => setAppView(isStudentMode ? APP_VIEWS.STUDENT_HOME : APP_VIEWS.OVERVIEW)}
              />
            </Suspense>
          ))}
        </PageBoundary>
      )}

      {/* Sound Seekers. Lazy: it is a whole mode, and a child who never opens it
          should not pay for it on first load. */}
      {appView === APP_VIEWS.PHONICS_QUEST && nameSaved && (
        <PageBoundary resetKey={`phonics-quest-${studentId}`}>
          <Suspense fallback={<LazyPageFallback label="Loading Sound Seekers..." />}>
            <QuestRoot
              progressScopeKey={studentId || studentName || "default"}
              onExit={() => setAppView(isStudentMode ? APP_VIEWS.STUDENT_HOME : APP_VIEWS.OVERVIEW)}
            />
          </Suspense>
        </PageBoundary>
      )}

      {sessionMode !== "student" && appView === APP_VIEWS.ADMIN_DASHBOARD && isAdmin && (
        <PageBoundary resetKey="admin-dashboard">
          <Suspense fallback={<LazyPageFallback label="Loading admin dashboard..." />}>
            <AdminDashboardPage
              teachers={adminTeachers}
              classes={adminClasses}
              students={adminStudents}
              schools={adminSchools}
              setTeacherSchool={adminSetTeacherSchool}
              pendingAccounts={adminPendingAccounts}
              pendingAccountsWarning={adminPendingAccountsWarning}
              loading={adminLoading}
              refreshDashboard={loadAdminDashboard}
              deleteClass={adminDeleteClass}
              deleteStudent={adminDeleteStudent}
              updateTeacherAccountStatus={updateTeacherAccountStatus}
              questionBankCoverage={questionBankCoverage}
              mediaQuestions={allQuestions}
              assessmentHistory={assessmentHistory}
              teacherId={teacherId}
              supabase={isSupabaseConfigured ? supabase : null}
              message={message}
            />
          </Suspense>
        </PageBoundary>
      )}

      {sessionMode !== "student" && (
        appView === APP_VIEWS.TEACHER_DASHBOARD
        || appView === APP_VIEWS.TEACHER_CLASSES
        || appView === APP_VIEWS.SELECT
      ) && (
        <PageBoundary resetKey="teacher-dashboard">
          <Suspense fallback={<LazyPageFallback label="Loading dashboard..." />}>
            <TeacherDashboardPage
              pageIntent={appView === APP_VIEWS.TEACHER_CLASSES ? "classes" : "today"}
              classList={classList}
              selectedClassId={selectedClassId}
              setSelectedClassId={nextClassId => {
                setSelectedClassId(nextClassId);
                setTeacherGroupId("all");
                setTeacherStudentContext({ studentId: null, studentName: "" });
                setNameSaved(false);
              }}
              setStudentList={setStudentList}
              studentList={studentList}
              archivedStudentList={archivedStudentList}
              loadingStudents={loadingStudents}
              loadStudents={loadStudents}
              assignQuestPractice={assignQuestPractice}
              clearQuestPractice={clearQuestPractice}
              onLoadStudent={async (id, name) => {
                const loadPromise = loadStudentProgress(id, name, { navigate: false });
                if (appView !== APP_VIEWS.TEACHER_CLASSES) {
                  setAppView(APP_VIEWS.TEACHER_CLASSES);
                }
                await loadPromise;
              }}
              selectedStudentId={studentId}
              onClearStudent={() => {
                setTeacherStudentContext({ studentId: null, studentName: "" });
                setNameSaved(false);
              }}
              selectedGroupId={teacherGroupId}
              onSelectGroup={groupId => {
                setTeacherGroupId(groupId || "all");
                setTeacherStudentContext({ studentId: null, studentName: "" });
                setNameSaved(false);
              }}
              onOpenClasses={() => setAppView(APP_VIEWS.TEACHER_CLASSES)}
              onOpenAssess={() => setAppView(APP_VIEWS.TEACHER_ASSESS)}
              onOpenProgress={() => setAppView(APP_VIEWS.TEACHER_PROGRESS)}
              createClass={createClass}
              createDemoClass={createDemoClass}
              regenerateClassCode={regenerateClassCode}
              newClassName={newClassName}
              setNewClassName={setNewClassName}
              createStudent={name => createStudentForSelectedClass(name, { navigate: false })}
              teacherId={teacherId}
              classDashboard={classDashboard}
              loadClassDashboard={loadClassDashboard}
              skillTree={skillTree}
              updateStudentSymbolPassword={updateStudentSymbolPassword}
              resetStudentSymbolPassword={resetStudentSymbolPassword}
              startStudentLogin={() => {
                setSessionMode("teacher");
                setEntryMode("student");
                setAppView(APP_VIEWS.STUDENT_LOGIN);
              }}
              schoolName={teacherSchoolName}
              hasSchool={hasTeacherSchool}
              saveSchool={saveTeacherSchool}
              message={message}
            />
          </Suspense>
        </PageBoundary>
      )}

      {sessionMode !== "student" && appView === APP_VIEWS.TEACHER_ASSESS && (
        <PageBoundary resetKey="teacher-assess">
          <Suspense fallback={<LazyPageFallback label="Loading assessment tools..." />}>
            <TeacherIntentPage
              intent="assess"
              className={getSelectedClassName(classList, selectedClassId)}
              studentName={nameSaved ? studentName : ""}
              onOpenAssessment={goToOverview}
              onOpenView={setAppView}
            />
          </Suspense>
        </PageBoundary>
      )}

      {sessionMode !== "student" && appView === APP_VIEWS.TEACHER_PROGRESS && (
        <PageBoundary resetKey="teacher-progress">
          <Suspense fallback={<LazyPageFallback label="Loading progress tools..." />}>
            <TeacherIntentPage
              intent="progress"
              supabase={supabase}
              teacherId={teacherId}
              className={getSelectedClassName(classList, selectedClassId)}
              classList={classList}
              selectedClassId={selectedClassId}
              onSelectClass={async nextClassId => {
                setSelectedClassId(nextClassId);
                setTeacherGroupId("all");
                setTeacherStudentContext({ studentId: null, studentName: "" });
                setNameSaved(false);
                if (nextClassId) {
                  await loadStudents(nextClassId);
                  await loadClassDashboard(nextClassId);
                } else {
                  setStudentList([]);
                  setArchivedStudentList([]);
                  setClassDashboard([]);
                }
              }}
              progressRows={classDashboard}
              selectedLearnerId={nameSaved ? studentId : ""}
              studentName={nameSaved ? studentName : ""}
              onSelectLearner={(id, name) => loadStudentProgress(id, name, { navigate: false })}
              onClearLearner={() => {
                setTeacherStudentContext({ studentId: null, studentName: "" });
                setNameSaved(false);
              }}
              onOpenReports={() => setAppView(APP_VIEWS.REPORTS)}
            />
          </Suspense>
        </PageBoundary>
      )}

      {sessionMode !== "student" && appView === APP_VIEWS.TEACHER_RESOURCES && (
        <PageBoundary resetKey="teacher-resources">
          <Suspense fallback={<LazyPageFallback label="Loading resources..." />}>
            <TeacherIntentPage
              intent="resources"
              className={getSelectedClassName(classList, selectedClassId)}
              studentName={nameSaved ? studentName : ""}
              onOpenGuidedReading={() => setAppView(APP_VIEWS.GUIDED_READING)}
              onOpenStoryQuests={() => openStudentPreview(APP_VIEWS.LEARN)}
              onOpenWorksheets={() => setAppView(APP_VIEWS.WORKSHEETS)}
              onOpenPresent={() => setAppView(APP_VIEWS.PRESENT)}
            />
          </Suspense>
        </PageBoundary>
      )}

      {appView === APP_VIEWS.OVERVIEW && nameSaved && (
        <PageBoundary resetKey={`overview-${studentId}`}>
          <StudentOverviewPage
            diagnosticFollowUp={diagnosticFollowUp}
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
            coverageSnapshot={coverageSnapshot}
            switchStudent={switchStudent}
            openResetStudentProgress={() => setResetProgressDialogOpen(true)}
            isAdmin={isAdmin}
          />
        </PageBoundary>
      )}

      {appView === APP_VIEWS.SKILLS && nameSaved && (
        <PageBoundary resetKey={`skills-${studentId}`}>
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
            coverageSnapshot={coverageSnapshot}
            startAssessment={startAssessment}
          />
        </PageBoundary>
      )}

      {appView === APP_VIEWS.EL_ASSESSMENTS && nameSaved && (
        <PageBoundary resetKey={`el-assessments-${studentId}`}>
          <>
            {message && (
              <Suspense fallback={null}>
                <LazyActionFeedback
                  className={`el-benchmark-hub-message${message.includes("Cloud sync is pending") || message.includes("cloud copy could not") ? " sync-pending" : ""}`}
                  message={message}
                />
              </Suspense>
            )}
            <ELAssessmentsPage
              studentId={studentId}
              studentName={studentName}
              startLetterAssessment={startLetterAssessment}
              startAdvancedPhonicsAssessment={startAdvancedPhonicsAssessment}
              startElBenchmarkAssessment={startElBenchmarkAssessment}
              resumeElBenchmarkAssessment={resumeElBenchmarkAssessment}
              discardElBenchmarkDraft={discardElBenchmarkDraft}
              elBenchmarkDraft={elBenchmarkSession?.studentId === studentId ? elBenchmarkSession : null}
              assessmentHistory={assessmentHistory.filter(record => record.studentId === studentId)}
            />
          </>
        </PageBoundary>
      )}

      {appView === APP_VIEWS.EL_BENCHMARK && nameSaved && elBenchmarkSession?.studentId === studentId && (
        <PageBoundary resetKey={`el-benchmark-${studentId}-${elBenchmarkSession.sessionId}`}>
          <Suspense fallback={<LazyPageFallback label="Loading EL benchmark..." />}>
            <ELBenchmarkAssessmentPage
              session={elBenchmarkSession}
              draftSaveFailed={elBenchmarkDraftSaveFailed}
              onSessionChange={updateElBenchmarkSession}
              onComplete={finishElBenchmarkAssessment}
              onSaveAndExit={nextSession => (
                nextSession?.status === "completed" || nextSession?.administrationStatus === "completed"
                  ? finishElBenchmarkAssessment(nextSession)
                  : nextSession?.status === "discontinued" || nextSession?.administrationStatus === "discontinued"
                    ? discontinueElBenchmarkAssessment(nextSession)
                    : saveElBenchmarkPartialAndExit(nextSession)
              )}
              onCancel={returnFromElBenchmarkAssessment}
            />
          </Suspense>
        </PageBoundary>
      )}

      {appView === APP_VIEWS.GUIDED_READING && nameSaved && (
        <PageBoundary resetKey={`guided-reading-${studentId}`}>
          {withStudentRail("books", (
            <GuidedReadingPage
              initialBookId={guidedInitialBookId}
              studentId={studentId}
              studentName={studentName}
              mode={sessionMode === "student" ? "student" : "teacher"}
              guidedReadingRecords={guidedReadingRecords}
              saveGuidedReadingRecord={saveGuidedReadingRecord}
              speakText={speakText}
            />
          ))}
        </PageBoundary>
      )}

      {appView === APP_VIEWS.LEARN && nameSaved && (
        <PageBoundary resetKey={`learn-${studentId}`}>
          <Suspense fallback={<LazyPageFallback label="Loading Story Quest..." />}>
            {withStudentRail("stories", (
              <div className="learn-fullscreen-frame student-surface-frame student-surface-story">
                {renderLearnFullscreenButton()}
                <LearnAreaPage key={childProgressScopeKey} progressScopeKey={childProgressScopeKey} />
              </div>
            ))}
          </Suspense>
        </PageBoundary>
      )}

      {appView === APP_VIEWS.PHONICS_LEARN && nameSaved && (
        <PageBoundary resetKey={`phonics-learn-${studentId}`}>
          <Suspense fallback={<LazyPageFallback label="Loading Learn..." />}>
            {withStudentRail(studentArcadeOpen ? "arcade" : "phonics", (
              <div className={`learn-fullscreen-frame student-surface-frame ${studentArcadeOpen ? "student-surface-arcade" : "student-surface-phonics"}`}>
                {renderLearnFullscreenButton()}
                <PhonicsLearnPage
                  initialIsland={studentArcadeOpen ? "games" : "letters"}
                  progressScopeKey={childProgressScopeKey}
                />
              </div>
            ))}
          </Suspense>
        </PageBoundary>
      )}

      {appView === APP_VIEWS.REPORTS && nameSaved && (
        <PageBoundary resetKey={`reports-${studentId}`}>
          <TeacherReportsPage
            studentName={studentName}
            startAssessment={startAssessment}
            viewFinishedReport={viewId => {
              const nextReportView = viewId || "whole-child";
              setStudentReportView(nextReportView);
              if (typeof window !== "undefined") {
                window.history.replaceState(null, "", studentReportHash(nextReportView));
              }
              setAppView(APP_VIEWS.FINISHED);
            }}
            guidedReadingRecords={guidedReadingRecords}
            assessmentHistory={reportsAssessmentHistory}
            allAssessmentHistory={assessmentHistory}
            skillMasterySummary={reportSkillMasterySummary}
            classList={classList}
            selectedClassId={selectedClassId}
            setSelectedClassId={setSelectedClassId}
            students={studentList}
            teacherName={teacherUser?.email || ""}
            teacherId={teacherId}
            supabase={isSupabaseConfigured ? supabase : null}
            evidenceReady={selectedStudentEvidenceReady}
          />
        </PageBoundary>
      )}

      {appView === APP_VIEWS.WORKSHEETS && (
        <PageBoundary resetKey="worksheets">
          <Suspense fallback={<LazyPageFallback label="Loading worksheets..." />}>
            <WorksheetGeneratorPage teacherId={teacherId} />
          </Suspense>
        </PageBoundary>
      )}

      {appView === APP_VIEWS.PRESENT && (
        <PageBoundary resetKey="present">
          <Suspense fallback={<LazyPageFallback label="Loading Present mode..." />}>
            <PresentPage />
          </Suspense>
        </PageBoundary>
      )}

      {sessionMode !== "student" && shouldShowDashboardSummary({ appView, isFocusedAssessment: isFocusedShell }) && (
        <DashboardSummary
          currentSkillIndex={currentSkillIndex}
          skillTree={skillTree}
          currentStage={currentStage}
          roundCorrect={roundCorrect}
          roundLength={ROUND_LENGTH}
          accuracy={accuracy}
        />
      )}

      {appView === APP_VIEWS.LETTERS && (
        <PageBoundary resetKey={`letters-${studentId}`}>
          <LetterAssessmentPage
            studentName={studentName}
            letterIndex={letterIndex}
            letterItems={letterItems}
            endAssessment={endAssessment}
            recordLetterResult={recordLetterResult}
            letterAssessment={letterAssessment}
            exportLetterAssessment={exportLetterAssessment}
            resetLetterAssessment={resetLetterAssessment}
            returnToTeacherDashboard={teacherId ? returnToTeacherDashboard : null}
          />
        </PageBoundary>
      )}

      {appView === APP_VIEWS.ADVANCED_PHONICS && (
        <PageBoundary resetKey={`advanced-phonics-${studentId}`}>
          <AdvancedPhonicsPatternAssessmentPage
            studentName={studentName}
            patternIndex={patternIndex}
            patternItems={patternItems}
            endAssessment={endAssessment}
            recordPatternResult={recordPatternResult}
            patternAssessment={patternAssessment}
            exportPatternAssessment={exportPatternAssessment}
            resetPatternAssessment={resetPatternAssessment}
            returnToTeacherDashboard={teacherId ? returnToTeacherDashboard : null}
          />
        </PageBoundary>
      )}

      {appView === APP_VIEWS.ASSESSMENT && (
        <AssessmentErrorBoundary
          resetKey={`${
            currentQuestion?.id
              ? `question-${currentQuestion.id}`
              : feedback?.question?.id
                ? `feedback-${feedback.question.id}`
                : assessmentTransitioning
                  ? `transition-${currentSkillIndex}`
                  : `skill-${currentSkillIndex}`
          }:${currentSkillIndex}:${appView}`}
          returnToStudentOverview={goToOverview}
          isTransient={assessmentTransitioning || Boolean(feedback)}
        >
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
            answerQuestion={answerQuestion}
            speakText={speakText}
            message={message}
            endAssessment={endAssessment}
            returnToStudentOverview={goToOverview}
            assessmentMode={assessmentMode}
            isAssessmentTransitioning={assessmentTransitioning}
            assessmentFullscreen={effectiveAssessmentFullscreen}
            toggleAssessmentFullscreen={toggleAssessmentFullscreen}
          />
        </AssessmentErrorBoundary>
      )}

      {appView === APP_VIEWS.CHECKPOINT && (
        <PageBoundary resetKey={`checkpoint-${studentId}-${currentSkillIndex}`}>
          <CheckpointDecisionPage
            checkpoint={checkpointDecision}
            continueSkill={continueCheckpointSkill}
            reviewInitialSoundLevelOne={reviewInitialSoundLevelOne}
            moveToNextSkill={moveToNextCheckpointSkill}
            retrySkill={retryCheckpointSkill}
            reviewMistakes={startTargetedReview}
            returnToOverview={goToOverview}
          />
        </PageBoundary>
      )}

      {adminConfirm && <Suspense fallback={null}><ConfirmActionDialog
        open={Boolean(adminConfirm)}
        busy={adminConfirmBusy}
        title={adminConfirm?.kind === "class" ? "Delete class?" : "Delete student?"}
        body={adminConfirm?.kind === "class"
          ? `This permanently removes ${adminConfirm?.name || "this class"}, every student in it, and all of their assessment data. This cannot be undone.`
          : `This permanently removes ${adminConfirm?.name || "this student"} and all of their assessment data. This cannot be undone.`}
        confirmLabel={adminConfirm?.kind === "class" ? "Delete class" : "Delete student"}
        onCancel={() => setAdminConfirm(null)}
        onConfirm={async () => {
          if (!adminConfirm || adminConfirmBusy) return;
          setAdminConfirmBusy(true);
          try {
            if (adminConfirm.kind === "class") {
              await executeAdminDeleteClass(adminConfirm.id, adminConfirm.name);
            } else {
              await executeAdminDeleteStudent(adminConfirm.id, adminConfirm.name);
            }
          } finally {
            setAdminConfirmBusy(false);
            setAdminConfirm(null);
          }
        }}
      /></Suspense>}

      {resetProgressDialogOpen && <Suspense fallback={null}><ResetStudentProgressDialog
        open={resetProgressDialogOpen}
        studentName={studentName}
        resetting={resettingProgress}
        onReset={resetSelectedStudentProgress}
        onCancel={() => setResetProgressDialogOpen(false)}
      /></Suspense>}

      {appView === APP_VIEWS.FINISHED && (
        <PageBoundary resetKey="finished-report">
          <Suspense fallback={<LazyPageFallback label="Loading report..." />}>
            <FinishedReportPage
              startAssessment={startAssessment}
              openElAssessments={() => setAppView(APP_VIEWS.EL_ASSESSMENTS)}
              initialReportView={studentReportView}
              keepPracticingSkill={keepPracticingSkill}
              startTargetedReview={startTargetedReview}
              goToOverview={goToOverview}
              studentName={studentName}
              className={getSelectedClassName(classList, selectedClassId)}
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
              coverageSnapshot={coverageSnapshot}
              skillMasterySummary={reportSkillMasterySummary}
              itemMastery={itemMastery}
              assessmentHistory={reportsAssessmentHistory}
              evidenceReadState={selectedStudentEvidenceReadState}
              allowPassageAudio={allowPassageAudio}
              setAllowPassageAudio={setAllowPassageAudio}
              exportData={exportData}
              exportCSVData={exportCSVData}
              exportStudentExcel={exportStudentAssessmentWorkbook}
              exportReadingReport={exportReadingReport}
              letterAssessment={letterAssessment}
              patternAssessment={patternAssessment}
              exportLetterAssessment={exportLetterAssessment}
              exportPatternAssessment={exportPatternAssessment}
              guidedReadingRecords={guidedReadingRecords}
              storyQuestProgressScopeKey={studentId || studentName || "default"}
              progressScopeKey={studentId || studentName || "default"}
              openGuidedReading={() => setAppView(APP_VIEWS.GUIDED_READING)}
              returnToTeacherDashboard={teacherId ? returnToTeacherDashboard : null}
            />
          </Suspense>
        </PageBoundary>
      )}

      {sessionMode !== "student" && shouldShowFooterUtilityActions({ appView, isFocusedAssessment: isFocusedShell }) && (
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
      </div>
    </div>
    </ErrorBoundary>
  );
}

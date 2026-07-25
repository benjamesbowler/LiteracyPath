/* eslint-disable react-hooks/set-state-in-effect -- LEGACY-LINT: pre-strict-rules file; new code must not add violations. */
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
import { useReducedMotion } from "framer-motion";
import "./App.css";
import {
  ASSESSMENT_PATH_STEPS,
  DEBUG_ASSESSMENT_COVERAGE,
  buildCoverageSnapshot,
  buildQuestionBankCoverage,
  calculateWeaknessSnapshot,
  comparableSentenceAnswer,
  configuredCoverageTotals,
  debugAssessmentCoverage,
  dedupeQuestionsByRuntimeSignature,
  downloadBlob,
  findQuestionForAnswerRecord,
  formatCoverageKeyLabel,
  formatExportDateForFilename,
  formatReportDate,
  getRoundItemLabels,
  getAdminSetupMessage,
  getAssessmentPathKey,
  getAssessmentPathLabel,
  getAssessmentQuestionLevel,
  getAssessmentQuestionPhase,
  getConfiguredPhaseItemKeys,
  getCoverageItemKeysForStage,
  getItemMasteryStateKeyForValues,
  getQuestionAnswer,
  getQuestionPathStep,
  getQuestionPrompt,
  getQuestionTargetWord,
  getRuntimeQuestionPromptAnswerSignature,
  getRuntimeQuestionSignature,
  getFinalSoundQuestionLevel,
  getStageIndex,
  inferItemMetadata,
  inferAnswerRecordMetadata,
  isApprovalSchemaError,
  isDuplicateAuthSignupError,
  isFinalSoundsStage,
  isFixSentenceQuestion,
  isInitialSoundsStage,
  isInvalidRefreshTokenError,
  isListenChooseVowelQuestion,
  isMissingItemMasteryTableError,
  isMissingTableError,
  isPairSelectionQuestion,
  isPureEarlyPhonicsStage,
  isQuestionBlockedByMediaQa,
  letterAssessmentOrder,
  logAdminSupabaseError,
  normalizeAnswerRecordShape,
  normalizeAssessmentQuestion,
  normalizeItemKey,
  normalizeMultiSelectAnswer,
  normalizePairSelectionAnswer,
  normalizeRuntimeSkillId,
  normalizeSentenceAnswer,
  prepareRuntimeQuestionBank,
  safeExportFilename,
  setRuntimeQuestionCache,
  startupQuestions
} from "./appState/assessmentRuntime.js";
import { AppSurface } from "./appState/appRuntimeSurfaces.jsx";
import {
  STUDENT_SESSION_STORAGE_KEY,
  addWorkbookExportProvenance,
  createExcelWorkbook,
  loadAssessmentMediaPickerModule,
  loadAssessmentSkillBankLoaderModule,
  loadAudioManifestModule,
  loadFinishedReportPageModule,
  loadGuidedReadingBooksModule,
  loadTeacherRouteRuntime,
  pushRouteHash,
  teacherReportHash
} from "./appState/appRuntimeServices.js";
import { supabase, isSupabaseConfigured } from "./supabaseClient";
import { getMasteryRule } from "./masterySystem";
import { skillTree } from "./skillTree";
import {
  excludeFailedAssessmentMediaQuestions,
  questionUsesFailedAssessmentMedia
} from "./policy/assessmentMediaEvidence.js";
import {
  saveStudentAccessibilitySettings,
  saveStudentReducedChoiceMode
} from "./data/studentRailSettings.js";
import {
  applyLearnerAccessibilityToDocument,
  learnerAccessibilityFromProfile
} from "./accessibility/learnerAccessibility.js";
import { loadStudentProfile } from "./utils/studentProfile.js";
import { buildQuestMasteryReport } from "./utils/questReport.js";
import { normalize, shuffleArray } from "./utils/assessmentRoundBuilder";

import { assessmentReleaseStatus } from "./content/assessments/assessmentReleaseStatus.generated.js";
import { getQuestionRoutingFormat } from "./data/skillTemplateRouting";
import {
  createAssessmentRoundDuplicateProfile,
  getAssessmentRoundDuplicateFlags,
  selectAssessmentRoundCandidate
} from "./data/assessmentRoundSelector.js";
import { getFinalSoundsLevel1QuestionIssues } from "./data/earlyPhonicsValidation";
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

import { advancedPhonicsPatterns } from "./data/advancedPhonicsPatterns";
import {
  getQuestionFormatMetadata,
  isMasteryEligible
} from "./questionFormatFramework";
import {
  buildInitialSoundsProgressFromAnswerHistory,
  getInitialSoundRoundPlan
} from "./content/initialSounds/initialSoundSelector";
import { INITIAL_SOUND_LETTERS } from "./content/initialSounds/initialSoundWordBank";
import {
  getAnswerRecordPromptAnswerSignature,
  getAnswerRecordSignature,
  getRepeatOptionSetSignature
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
import { isGenericInstructionAudioPath } from "./utils/assessmentAudioRoles";
import { APP_VIEWS } from "./appState/appViews.js";
import {
  getPersistedAppView,
  getRestoredAppView,
  elBenchmarkAssessmentHash,
  isFocusedAssessmentView,
  isStudentAllowedView,
  restoreElBenchmarkSessionFromHash,
  teacherIntentHash
} from "./appState/appViewHelpers.js";
import {
  deleteElBenchmarkDraft,
  loadElBenchmarkDraft,
  saveElBenchmarkDraft,
  getGuidedReadingStorageKey as getGuidedReadingStorageKeyForSession,
  getTeacherProfileStorageKey
} from "./appState/studentSessionHelpers.js";
import {
  calculateAccuracy,
  calculateRoundCorrect,
  getAssessmentAttemptType
} from "./appState/assessmentSessionHelpers.js";
import {
  preloadQuestionMedia,
  preloadQuestionMediaBatch
} from "./utils/preloadQuestionMedia.js";
import { speakWithBrowser as speakWithBrowserFallback } from "./utils/audio/speakWithBrowser.js";
import { DYNAMIC_IMPORT_ERROR_EVENT, importWithRetry } from "./utils/lazyWithRetry.js";
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
  const [learnerAccessibilityRevision, setLearnerAccessibilityRevision] = useState(0);
  const learnerAccessibility = useMemo(() => {
    void learnerAccessibilityRevision;
    return learnerAccessibilityFromProfile(
      loadStudentProfile(studentId || studentName || "default")
    );
  }, [learnerAccessibilityRevision, studentId, studentName]);
  useEffect(() => {
    function handleProfileHydration(event) {
      if (event.detail?.studentId && event.detail.studentId !== studentId) return;
      if (
        Array.isArray(event.detail?.rows)
        && !event.detail.rows.some(row => row.area === "profile")
      ) return;
      setLearnerAccessibilityRevision(revision => revision + 1);
    }
    window.addEventListener("lp-progress-hydrated", handleProfileHydration);
    return () => window.removeEventListener("lp-progress-hydrated", handleProfileHydration);
  }, [studentId]);
  useEffect(() => {
    if (sessionMode !== "student") return undefined;
    return applyLearnerAccessibilityToDocument(learnerAccessibility);
  }, [learnerAccessibility, sessionMode]);
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
      && !learnerAccessibility.reducedEffects
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
  }, [learnerAccessibility.reducedEffects]);
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
  // The public role gateway is safe to show while a stored teacher session is
  // restored. A valid session replaces it as soon as auth resolves, avoiding a
  // network-dependent blank/loading screen for signed-out families.
  const [authReady, setAuthReady] = useState(true);
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
  const failedAssessmentMediaRef = useRef({
    failedQuestionIds: new Set(),
    failedSources: new Set()
  });
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

  function resetFailedAssessmentMedia() {
    failedAssessmentMediaRef.current = {
      failedQuestionIds: new Set(),
      failedSources: new Set()
    };
  }

  function excludeSessionMediaFailures(questions = []) {
    return excludeFailedAssessmentMediaQuestions(
      questions,
      failedAssessmentMediaRef.current
    );
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
        setRuntimeQuestionCache(nextQuestions);
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
    setRuntimeQuestionCache(allQuestions);
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

  const restoreTeacherProfile = useEffectEvent(async () => {
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

    const { parse } = await loadTeacherRouteRuntime();
    const teacherRoute = parse(window.location.hash);
    loadClasses();

    const saved = localStorage.getItem(profileStorageKey);

    if (saved) {
      try {
        const data = JSON.parse(saved);
        const savedClassId = data.selectedClassId || null;
        const restoredClassId = teacherRoute
          ? teacherRoute.classId || null
          : savedClassId;

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
          if (teacherRoute) {
            await hydrateTeacherRouteContext(teacherRoute);
          } else {
            loadStudents();
          }
          setProfileLoaded(true);
          return;
        }

        setSelectedClassId(restoredClassId);
        setAssessmentMode(data.assessmentMode || "mastery");
        const restoredSkillIndex = Math.min(
          Math.max(0, Number(data.currentSkillIndex) || 0),
          skillTree.length - 1
        );
        const restoredRoundAnswers = Array.isArray(data.roundAnswers) ? data.roundAnswers : [];
        const savedStudentId = data.teacherStudentId || data.studentId || null;
        const restoredStudentId = teacherRoute
          ? teacherRoute.learnerId || null
          : savedStudentId;
        const restoredStudentName = restoredStudentId && restoredStudentId === savedStudentId
          ? data.teacherStudentName || data.studentName || ""
          : "";
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
          storedAppView: hashRestoredSession
            ? APP_VIEWS.EL_BENCHMARK
            : teacherRoute?.appView || data.appView
        });
        const restoredAppView = requestedRestoredAppView === APP_VIEWS.EL_BENCHMARK && !restoredElBenchmarkSession
          ? APP_VIEWS.EL_ASSESSMENTS
          : requestedRestoredAppView;

        setTeacherStudentContext({
          studentId: restoredStudentId,
          studentName: restoredStudentName
        });
        setTeacherGroupId(teacherRoute?.groupId || data.teacherGroupId || "all");
        if (teacherRoute?.reportView) {
          setStudentReportView(teacherRoute.reportView);
        }
        setNameSaved(Boolean(restoredStudentId && restoredStudentName));
        // Profile restoration is state hydration, not visible navigation.
        // Apply it synchronously so a view-transition callback cannot lose a
        // race to the post-auth "open Today" fallback.
        rawSetAppView(teacherRoute?.appView === APP_VIEWS.FINISHED
          ? APP_VIEWS.TEACHER_PROGRESS
          : restoredAppView);
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

        if (teacherRoute) {
          await hydrateTeacherRouteContext(teacherRoute);
        } else {
          loadStudents(restoredClassId);
          loadClassDashboard(restoredClassId);
        }
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
      if (teacherRoute) {
        await hydrateTeacherRouteContext(teacherRoute);
      } else {
        loadStudents();
      }
    }

    setProfileLoaded(true);
  });

  useEffect(() => {
    restoreTeacherProfile();
  }, [authReady, teacherId, profileStorageKey, teacherAccountStatus, isAdmin, sessionMode, setAppView]);

  const restoreTeacherRouteFromHistory = useEffectEvent(async () => {
    const { parse } = await loadTeacherRouteRuntime();
    const route = parse(window.location.hash);
    if (route) void hydrateTeacherRouteContext(route);
  });

  useEffect(() => {
    if (!profileLoaded || sessionMode === "student" || !teacherId) return undefined;
    const handleHashChange = () => restoreTeacherRouteFromHistory();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [profileLoaded, sessionMode, teacherId]);

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
    if (!profileLoaded || sessionMode === "student" || !teacherId) return;

    const nextHash = appView === APP_VIEWS.EL_BENCHMARK
      ? elBenchmarkAssessmentHash({
          classId: selectedClassId,
          learnerId: studentId,
          session: elBenchmarkSession
        })
      : appView === APP_VIEWS.FINISHED
        ? teacherReportHash(selectedClassId, studentId, studentReportView)
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
    profileLoaded,
    selectedClassId,
    sessionMode,
    studentId,
    studentReportView,
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
      .table("app_admins")
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
      .table("pending_teacher_accounts")
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
        .table("pending_teacher_accounts")
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
      supabase.table("classes").select("id, name, teacher_id, school_id, created_at").order("created_at", { ascending: false }),
      supabase.table("students").select("id, name, class_id, teacher_id, symbol_password, created_at").order("created_at", { ascending: false }),
      supabase.table("answers").select("teacher_id"),
      supabase
        .table("pending_teacher_accounts")
        .select("id, user_id, email, username, display_name, name, role, status, approval_status, school_id, created_at, requested_at, reviewed_at, reviewed_by, approved_at, approved_by, rejected_at, rejected_by, rejection_reason")
        .order("created_at", { ascending: false }),
      supabase.table("schools").select("id, name, created_at").order("name", { ascending: true })
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
      .table(tableName)
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
      .table("students")
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

    const { data: schoolRows, error: schoolError } = await supabase.call("find_or_create_school", { p_name: schoolName.trim() });
    const schoolId = schoolRows?.[0]?.id || null;
    if (schoolError || !schoolId) {
      console.error("Admin set school failed:", schoolError);
      setMessage("Could not save that school.");
      return;
    }

    const { error: accountError } = await supabase
      .table("pending_teacher_accounts")
      .update({ school_id: schoolId })
      .eq("user_id", teacherUserId);

    const { error: classError } = await supabase
      .table("classes")
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
      .table("students")
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
      .table("students")
      .delete()
      .eq("class_id", classId);

    if (studentsError) errors.push(studentsError);

    const { error: classError } = await supabase
      .table("classes")
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
      .table("pending_teacher_accounts")
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

    const { data, error } = await supabase.auth.signUp({
      email,
      password: authPassword,
      options: {
        data: {
          account_status: "pending",
          username,
          display_name: displayName,
          school_name: schoolName
        }
      }
    });

    setAuthLoading(false);

    if (error) {
      freshAuthActionRef.current = false;
      setAuthMessage(
        /username_unavailable/i.test(error?.message || "")
          ? "That username is already taken. Choose another username."
          : isDuplicateAuthSignupError(error)
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
        display_name: displayName || username
      });
      const { data: pendingAccount, error: notificationError } = await supabase
        .table("pending_teacher_accounts")
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
          .table("schools")
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
    const { data: savedRows, error } = await supabase.call("teacher_set_school", { p_school_name: schoolName });
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
      return [];
    }

    const { data, error } = await supabase
      .table("classes")
      .select("id,name,school_id,access_code,access_code_created_at,access_code_expires_at,leaderboard_scope")
      .eq("teacher_id", teacherId)
      .order("name", { ascending: true });

    if (error) {
      console.error("Load classes error:", error);
      setMessage("Could not load classes from cloud.");
      return [];
    }

    setClassList(data || []);
    return data || [];
  }

  async function regenerateClassCode(classId = selectedClassId) {
    if (!classId) return { ok: false, error: "missing-class" };
    const { data, error } = await supabase.call("teacher_regenerate_class_code", { p_class_id: classId });
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
      .table("classes")
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

    const { data, error } = await supabase.call("teacher_create_demo_class");
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
      return [];
    }

    setLoadingStudents(true);

    const { data, error } = await supabase
      .table("students")
      .select("id, name, class_id, created_at, updated_at, symbol_password, archived_at")
      .eq("teacher_id", teacherId)
      .eq("class_id", classId)
      .order("name", { ascending: true });

    if (error) {
      console.error("Load students error:", error);
      setMessage("Could not load students from cloud.");
      setLoadingStudents(false);
      return [];
    }

    setStudentList((data || []).filter(row => !row.archived_at));
    setArchivedStudentList((data || []).filter(row => Boolean(row.archived_at)));
    setLoadingStudents(false);
    return data || [];
  }

  async function hydrateTeacherRouteContext(route) {
    const routeRuntime = await loadTeacherRouteRuntime();
    return routeRuntime.hydrate([
      route,
      teacherId,
      sessionMode,
      loadClasses,
      loadStudents,
      loadClassDashboard,
      loadStudentProgress,
      [
        () => {
        setStudentList([]);
        setArchivedStudentList([]);
        setClassDashboard([]);
        },
        setSelectedClassId,
        setTeacherGroupId,
        setMessage,
        setNameSaved,
        setStudentReportView,
        (nextStudentId, nextStudentName) => {
          setTeacherStudentContext({
            studentId: nextStudentId,
            studentName: nextStudentName
          });
        },
        rawSetAppView
      ]
    ]);
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
      .table("students")
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
      .table("answers")
      .select("student_id, skill, is_correct, answered_at")
      .eq("teacher_id", teacherId)
      .in("student_id", studentIds)
      .order("answered_at", { ascending: true });

    if (answersError) {
      console.error("Dashboard answers error:", answersError);
    }


    const { data: masteryRows, error: masteryError } = await supabase
      .table("mastery")
      .select("*")
      .eq("teacher_id", teacherId)
      .in("student_id", studentIds)
      .order("updated_at", { ascending: true });

    if (masteryError) {
      console.error("Dashboard mastery error:", masteryError);
    }

    const { data: soundSeekerRows, error: soundSeekerError } = await supabase
      .table("student_progress")
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
    const { data: profileRows, error: profileError } = await supabase
      .table("student_progress")
      .select("student_id, payload")
      .eq("area", "profile")
      .eq("key", "__all__")
      .in("student_id", studentIds);

    if (profileError) {
      console.error("Dashboard student profile settings error:", profileError);
    }

    const profilesByStudent = new Map(
      (profileRows || []).map(row => [row.student_id, row.payload || {}])
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
        const studentProfile = profilesByStudent.get(student.id) || {};

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
          soundSeekers,
          reducedChoiceMode: Boolean(studentProfile.reducedChoiceMode),
          accessibilitySettings: learnerAccessibilityFromProfile(studentProfile)
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
    const { error } = await supabase.table("student_progress").upsert({
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

  async function setStudentReducedChoiceMode(studentRowId, enabled) {
    const result = await saveStudentReducedChoiceMode({
      supabase,
      studentId: studentRowId,
      enabled,
      teacherId
    });
    if (!result.ok) {
      console.error("Save reduced-choice mode error:", result.error);
      setMessage("Could not save that learner's navigation setting.");
      return false;
    }
    await loadClassDashboard(selectedClassId);
    setMessage(enabled
      ? "Reduced choices are on for this learner."
      : "All navigation choices are on for this learner.");
    return true;
  }

  async function setStudentAccessibilitySettings(studentRowId, settings) {
    const result = await saveStudentAccessibilitySettings({
      supabase,
      studentId: studentRowId,
      settings,
      teacherId
    });
    if (!result.ok) {
      console.error("Save learner accessibility settings error:", result.error);
      setMessage("Could not save that learner's accessibility settings.");
      return false;
    }
    await loadClassDashboard(selectedClassId);
    setMessage("Learner accessibility settings saved.");
    return true;
  }

  async function updateStudentSymbolPassword(studentRowId, sequence, selectedStudentName = "student") {
    if (!teacherId || !studentRowId || !/^[1-9]{3}$/.test(sequence)) return;
    // No teacher_id filter here: RLS already restricts writes to the
    // student's own teacher or an app admin. Filtering by teacher_id made
    // admin edits silently update zero rows while still reporting success.
    const { data, error } = await supabase
      .table("students")
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
      .table("students")
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
      .table(tableName)
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
      await supabase.table("student_progress").upsert({
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
    { navigate = true, classId = selectedClassId } = {}
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
      classId,
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
      .table("answers")
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
      .table("item_mastery")
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
      .table("mastery")
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
      .table("students")
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
      itemFilter: item => (
        !questionUsesFailedAssessmentMedia(item, failedAssessmentMediaRef.current) &&
        isRuntimeEligibleEarlySkillQuestion(item, {
          skillId: "initial_sounds",
          level
        })
      )
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

    let skippedFailedItem = false;
    let next = initialSoundRoundQueueRef.current.shift();
    while (
      next &&
      questionUsesFailedAssessmentMedia(next, failedAssessmentMediaRef.current)
    ) {
      skippedFailedItem = true;
      next = initialSoundRoundQueueRef.current.shift();
    }
    if (!next && skippedFailedItem) {
      buildInitialSoundRoundQueue({
        excludeLetters: [...initialSoundRoundAskedLettersRef.current]
      });
      next = initialSoundRoundQueueRef.current.shift();
    }
    if (!next) return null;

    if (next.letter) initialSoundRoundAskedLettersRef.current.add(next.letter);
    return next;
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
      return excludeSessionMediaFailures(
        initialSoundRoundQueueRef.current.length
          ? [...initialSoundRoundQueueRef.current]
          : buildInitialSoundRoundQueue().items
      );
    }

    const stageQuestions = excludeSessionMediaFailures(
      allQuestionsRef.current.filter(q => getStageIndex(q) === stageIndex && !isQuestionBlockedByMediaQa(q))
    );
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
            !questionUsesFailedAssessmentMedia(question, failedAssessmentMediaRef.current) &&
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

  function handleAssessmentEvidenceImageError({
    questionId = "",
    src = "",
    role = "evidence"
  } = {}) {
    const failedQuestion = currentQuestion;
    const failedQuestionId = String(failedQuestion?.id || "");
    if (
      !failedQuestion ||
      (questionId && questionId !== failedQuestionId) ||
      failedAssessmentMediaRef.current.failedQuestionIds.has(failedQuestionId)
    ) {
      return;
    }

    if (failedQuestionId) {
      failedAssessmentMediaRef.current.failedQuestionIds.add(failedQuestionId);
    }
    if (src) {
      failedAssessmentMediaRef.current.failedSources.add(src);
    }

    const failedStageIndex = getStageIndex(failedQuestion);
    const failedMode = assessmentMode;
    answerInFlightRef.current = true;
    setCurrentQuestion(null);
    setAssessmentTransitioning(true);
    setMessage("That picture did not load. Replacing the question...");

    debugAssessmentCoverage("assessment evidence image removed", {
      questionId: failedQuestionId,
      skillId: failedQuestion.skillId,
      role,
      src,
      roundAnswers: roundAnswers.length
    });

    window.setTimeout(() => {
      if (!assessmentActiveRef.current) return;
      pickQuestion(failedMode, failedStageIndex);
    }, 0);
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
      .table("item_mastery")
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
    resetFailedAssessmentMedia();
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
    resetFailedAssessmentMedia();
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
    resetFailedAssessmentMedia();
    setDiagnosticFollowUp(true);
    setStudentReportView("skills-check");
    pushRouteHash(teacherReportHash(selectedClassId, studentId, "skills-check"));
    setAppView(APP_VIEWS.FINISHED);
  }

  async function goToOverview(diagnosticFollowUp) {
    answerInFlightRef.current = false;
    resetFailedAssessmentMedia();
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

  const roundCorrect = calculateRoundCorrect(roundAnswers);
  const accuracy = calculateAccuracy({ totalAnswered, correctAnswered });

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
    buildQuestionBankCoverage(allQuestions, assessmentReleaseStatus),
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

  // Commit the controller before loading the route renderer so its auth and
  // recovery effects can start immediately. Suspending the controller's first
  // committed tree would otherwise postpone the six-second auth fallback.
  if (!authReady) {
    return (
      <div className="app">
        <div className="card page-card page-stack auth-card">
          <h2>Loading teacher session...</h2>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="app"><div className="card page-card">Loading Literacy Path...</div></div>}>
      <AppSurface
        surface={{
      PASS_SCORE, ROUND_LENGTH, adminClasses, adminConfirm, adminConfirmBusy, adminDeleteClass,
      adminDeleteStudent, adminLoading, adminPendingAccounts, adminPendingAccountsWarning, adminSchools, adminSetTeacherSchool,
      adminStudents, adminTeachers, allQuestions, allowPassageAudio, answerQuestion, appView,
      applyStudentSession, archivedStudentList, assessmentFullscreen, assessmentHistory, assessmentMode, assessmentTransitioning,
      assignQuestPractice, authDisplayName, authEmail, authLoading, authMessage, authMode,
      authPassword, authReady, authReconnecting, authSchoolName, authUsername,
      checkpointDecision, chunkLoadFailure, classDashboard, classList,
      clearQuestPractice, completePasswordReset, continueCheckpointSkill, correctAnswered, coverageSnapshot, createClass,
      createDemoClass, createStudentForSelectedClass, currentQuestion, currentSkillIndex, currentStage, currentStageQuestions,
      demoTeacherEnabled, diagnosticFollowUp, discardElBenchmarkDraft, discontinueElBenchmarkAssessment, elBenchmarkDraftSaveFailed, elBenchmarkSession,
      endAssessment, entryMode, executeAdminDeleteClass, executeAdminDeleteStudent, exitToTeacherEntry, exportCSVData,
      exportData, exportLetterAssessment, exportPatternAssessment, exportReadingReport, exportStudentAssessmentWorkbook, feedback,
      finishElBenchmarkAssessment, goToOverview, guidedInitialBookId, guidedReadingRecords, handleAssessmentEvidenceImageError,
      isAdmin, isStudentSurfaceView, isTeacherAccountApproved, itemMastery,
      keepPracticingSkill, learnFullscreen, learnerAccessibility, letterAssessment, letterIndex,
      letterItems, loadAdminDashboard, loadClassDashboard, loadStudentProgress, loadStudents, loadingStudents,
      logInDemoTeacher, logInTeacher, logOutStudent, logOutTeacher, mastery,
      message, moveToNextCheckpointSkill, nameSaved, newClassName, normalizeApprovalStatus,
      openAdminDashboard, openStudentPreview, patternAssessment, patternIndex, patternItems, pickQuestion,
      prefersReducedMotion, profileLoaded, questionBankCoverage, recordLetterResult, recordPatternResult,
      regenerateClassCode, renderLearnFullscreenButton, reportSkillMasterySummary, reportsAssessmentHistory, requestPasswordReset, resetLetterAssessment,
      resetPatternAssessment, resetProgressDialogOpen, resetSelectedStudentProgress, resetStudent, resetStudentSymbolPassword, resettingProgress,
      resumeElBenchmarkAssessment, retryCheckpointSkill, returnFromElBenchmarkAssessment, returnFromStudentPreview, returnToStudentHome, returnToTeacherDashboard,
      reviewInitialSoundLevelOne, roundAnswers, saveElBenchmarkPartialAndExit, saveGuidedReadingRecord, saveTeacherSchool, selectedClassId,
      selectedStudentEvidenceReadState, selectedStudentEvidenceReady, sessionMode, setAdminConfirm, setAdminConfirmBusy, setAllowPassageAudio,
      setAppView, setArchivedStudentList, setAuthDisplayName, setAuthEmail, setAuthMode, setAuthPassword,
      setAuthSchoolName, setAuthUsername, setClassDashboard, setCurrentQuestion, setCurrentSkillIndex, setEntryMode,
      setFeedback, setGuidedInitialBookId, setMessage, setNameSaved, setNewClassName, setResetProgressDialogOpen,
      setRoundAnswers, setSelectedClassId, setSessionMode, setStudentAccessibilitySettings, setStudentArcadeOpen, setStudentList,
      setStudentReducedChoiceMode, setStudentReportView, setTeacherGroupId, setTeacherStudentContext,
      shouldShowImage, showConfetti, showSkillsQuestPrototype, signUpTeacher, speakText,
      startAdvancedPhonicsAssessment, startAssessment, startElBenchmarkAssessment, startLetterAssessment, startTargetedReview, studentArcadeOpen,
      studentId, studentList, studentName, studentPreview, studentPreviewStatus, studentReportView,
      studentSessionId, switchStudent, teacherAccountRecord, teacherAccountStatus, teacherGroupId,
      teacherId, teacherSchoolName, teacherUser, toggleAssessmentFullscreen,
      totalAnswered, updateElBenchmarkSession, updateStudentSymbolPassword, updateTeacherAccountStatus, weaknessSnapshot
        }}
      />
    </Suspense>
  );
}

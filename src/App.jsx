/* eslint-disable react-hooks/set-state-in-effect -- LEGACY-LINT: pre-strict-rules file; new code must not add violations. */
import { Suspense, useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useReducedMotion } from "framer-motion";
import "./App.css";
import { DEBUG_ASSESSMENT_COVERAGE, buildCoverageSnapshot, buildQuestionBankCoverage, calculateWeaknessSnapshot, debugAssessmentCoverage, dedupeQuestionsByRuntimeSignature, downloadBlob, findQuestionForAnswerRecord, formatExportDateForFilename, formatReportDate, getAdminSetupMessage, getQuestionTargetWord, getRuntimeQuestionSignature, getStageIndex, inferItemMetadata, inferAnswerRecordMetadata, isApprovalSchemaError, isDuplicateAuthSignupError, isInitialSoundsStage, isInvalidRefreshTokenError, isMissingItemMasteryTableError, isMissingTableError, letterAssessmentOrder, logAdminSupabaseError, normalizeItemKey, normalizeRuntimeSkillId, prepareRuntimeQuestionBank, safeExportFilename, setRuntimeQuestionCache, startupQuestions } from "./appState/assessmentRuntime.js";
import { useAppSessionController } from "./appState/useAppSessionController.js";
import { STUDENT_SESSION_STORAGE_KEY, addWorkbookExportProvenance, createExcelWorkbook, loadAssessmentMediaPickerModule, loadAssessmentSkillBankLoaderModule, loadElBenchmarkEngineModule, loadFinishedReportPageModule, loadGuidedReadingBooksModule, loadTeacherRouteRuntime, pushRouteHash, teacherReportHash } from "./appState/appRuntimeServices.js";
import { supabase, isSupabaseConfigured } from "./supabaseClient";
import { getMasteryRule } from "./masterySystem";
import { skillTree } from "./skillTree";
import { excludeFailedAssessmentMediaQuestions } from "./policy/assessmentMediaEvidence.js";
import { saveStudentAccessibilitySettings, saveStudentReducedChoiceMode } from "./data/studentRailSettings.js";
import { applyLearnerAccessibilityToDocument, learnerAccessibilityFromProfile } from "./accessibility/learnerAccessibility.js";
import { loadStudentProfile } from "./utils/studentProfile.js";
import { buildQuestMasteryReport } from "./utils/questReport.js";
import { curriculumReleaseBoard } from "./content/assessments/curriculumReleaseBoard.generated.js";
import { isHighFrequencyWordSkill } from "./data/highFrequencyWordBands";
import { advancedPhonicsPatterns } from "./data/advancedPhonicsPatterns";
import { getAnswerRecordPromptAnswerSignature, getAnswerRecordSignature, getRepeatOptionSetSignature } from "./questionRepeatGuards";
import { deleteAssessmentAttemptsForStudent, flushAssessmentAttemptSyncQueue, hydrateAssessmentAttempts, loadAssessmentAttempts, mergeAssessmentAttemptRecords, mergeAssessmentAttemptIntoItemMastery } from "./data/assessmentHistoryStore";
import { deleteSavedClassElAssessmentReportsForStudent } from "./data/elAssessmentReportStore.js";
import { APP_VIEWS } from "./appState/appViews.js";
import { getPersistedAppView, getRestoredAppView, elBenchmarkAssessmentHash, isFocusedAssessmentView, isStudentAllowedView, restoreElBenchmarkSessionFromHash, teacherIntentHash } from "./appState/appViewHelpers.js";
import { deleteElBenchmarkDraft, loadElBenchmarkDraft, saveElBenchmarkDraft, getGuidedReadingStorageKey as getGuidedReadingStorageKeyForSession, getTeacherProfileStorageKey } from "./appState/studentSessionHelpers.js";
import { calculateAccuracy, calculateRoundCorrect } from "./appState/assessmentSessionHelpers.js";
import { preloadQuestionMedia } from "./utils/preloadQuestionMedia.js";
import { DYNAMIC_IMPORT_ERROR_EVENT, importWithRetry } from "./utils/lazyWithRetry.js";
import { clearProgressSyncSession, configureProgressSync, hydrateCloudProgress, queueProgressSave, clearLocalProgressForStudent, RESET_AREA } from "./utils/progressSync.js";
import { clearLocalElAssessmentDataForStudent } from "./utils/elAssessmentReset.js";
import { startInsertQueueFlusher } from "./utils/insertQueue.js";
import { createAssessmentRoundController } from "./appState/assessmentRoundController.js";
import { AppSurface } from "./appState/appRuntimeSurfaces.jsx";

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
      && sessionMode === "student"
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
  }, [learnerAccessibility.reducedEffects, sessionMode]);
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
  const elBenchmarkStartPendingRef = useRef(false);
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

  const {
    answerQuestion, buildInitialSoundRoundQueue, buildSkillMasterySummary, getAvailableStageQuestions,
    getItemMasteryStateKey, getQuestionItemKey, handleAssessmentEvidenceImageError, normalizeItemMasteryRow,
    persistCompletedAssessmentAttempt, pickQuestion, prioritizeCoverageQuestions, resetInitialSoundRoundQueue,
    shouldShowImage, speakText, updateItemMastery,
  } = createAssessmentRoundController({
    allQuestionsRef, answerHistory, answerHistoryRef, answerInFlightRef,
    assessmentActiveRef, assessmentMediaPickerRef, assessmentMediaUsageRef, assessmentMode,
    currentQuestion, currentSkillIndex, currentStage, excludeSessionMediaFailures,
    failedAssessmentMediaRef, initialSoundForcedLevelRef, initialSoundRoundAskedLettersRef, initialSoundRoundMetaRef,
    initialSoundRoundQueueRef, itemMastery, itemSessionSeen, mastery,
    PASS_SCORE, resetAssessmentMediaUsage, ROUND_LENGTH, roundAnswers,
    roundItemKeys, roundItemKeysRef, roundQuestionIdsRef, selectedClassId,
    setAnswerHistory, setAppView, setAssessmentHistory, setAssessmentTransitioning,
    setCheckpointDecision, setCorrectAnswered, setCurrentQuestion, setDiagnosticFollowUp,
    setFeedback, setItemMastery, setItemSessionSeen, setMastery,
    setMessage, setRoundAnswers, setRoundItemKeys, setRoundQuestionIds,
    setShowConfetti, setTotalAnswered, setUsedByStage, studentId,
    studentName, teacherId, usedByStage, weaknessSnapshot,
  });

  const {
    adminDeleteClass, adminDeleteStudent, adminSetTeacherSchool, applyStudentSession,
    assignQuestPractice, clearQuestPractice, clearTeacherState,
    completePasswordReset, createClass, createDemoClass, createStudentForSelectedClass,
    demoTeacherEnabled, executeAdminDeleteClass, executeAdminDeleteStudent, exitToTeacherEntry,
    isTeacherAccountApproved, loadAdminDashboard, loadClassDashboard, loadClasses,
    loadStudentProgress, loadStudents, logInDemoTeacher, logInTeacher,
    logOutStudent, logOutTeacher, normalizeApprovalStatus, openAdminDashboard,
    profileStorageKey, regenerateClassCode, requestPasswordReset, resetSelectedStudentProgress,
    resetStudentSymbolPassword, saveGuidedReadingRecord, saveTeacherSchool, setStudentAccessibilitySettings,
    setStudentReducedChoiceMode, signUpTeacher, updateStudentName, updateStudentSymbolPassword, updateTeacherAccountStatus,
  } = useAppSessionController({
    accountAccessCheckInFlightRef, accountAccessCheckSeqRef, accountAccessCheckUserIdRef, adminStatusError,
    adminStudents, answerHistory, answerHistoryRef, answerInFlightRef,
    APP_VIEWS, appView, assessmentActiveRef, assessmentMode,
    authBootCompletedRef, authDisplayName, authEmail, authPassword,
    authReady, authSchoolName, authUsername, buildQuestMasteryReport,
    clearLocalElAssessmentDataForStudent, clearLocalProgressForStudent, clearProgressSyncSession,
    configureProgressSync, correctAnswered, currentSkillIndex, deleteSavedClassElAssessmentReportsForStudent,
    elBenchmarkAssessmentHash, elBenchmarkSession, findQuestionForAnswerRecord, freshAuthActionRef,
    freshLoginResetPendingRef, getAdminSetupMessage, getAnswerRecordPromptAnswerSignature, getAnswerRecordSignature,
    getGuidedReadingStorageKeyForSession, getItemMasteryStateKey, getPersistedAppView, getQuestionTargetWord,
    getRepeatOptionSetSignature, getRestoredAppView, getRuntimeQuestionSignature, getTeacherProfileStorageKey,
    hydrateAssessmentAttempts, hydrateCloudProgress, inferAnswerRecordMetadata, inferItemMetadata,
    initialSoundRoundMetaRef, isAdmin, isApprovalSchemaError, isDuplicateAuthSignupError,
    isInvalidRefreshTokenError, isMissingItemMasteryTableError, isMissingTableError, isStudentAllowedView,
    isSupabaseConfigured, itemMastery, lastAuthUserIdRef, learnerAccessibilityFromProfile,
    letterAssessment, letterIndex, loadAssessmentAttempts, loadElBenchmarkDraft,
    loadTeacherRouteRuntime, logAdminSupabaseError, mastery, mergeAssessmentAttemptIntoItemMastery,
    mergeAssessmentAttemptRecords, newClassName, normalizeItemMasteryRow, patternAssessment,
    patternAttempt, patternIndex, pickQuestion, profileLoaded,
    queueProgressSave, rawSetAppView, RESET_AREA, resetInitialSoundRoundQueue,
    restoreElBenchmarkSessionFromHash, roundAnswers, roundItemKeys, roundItemKeysRef,
    roundQuestionIds, roundQuestionIdsRef, saveElBenchmarkDraft, saveStudentAccessibilitySettings,
    saveStudentReducedChoiceMode, selectedClassId, sessionMode, setAdminClasses,
    setAdminConfirm, setAdminLoading, setAdminPendingAccounts, setAdminPendingAccountsWarning,
    setAdminSchools, setAdminStatusError, setAdminStudents, setAdminTeachers,
    setAnswerHistory, setAppView, setArchivedStudentList, setAssessmentHistory,
    setAssessmentMode, setAssessmentTransitioning, setAuthLoading, setAuthMessage,
    setAuthMode, setAuthPassword, setAuthReady, setCheckpointDecision,
    setClassDashboard, setClassList, setCorrectAnswered, setCurrentQuestion,
    setCurrentSkillIndex, setDiagnosticFollowUp, setElBenchmarkDraftSaveFailed, setElBenchmarkSession,
    setEntryMode, setFeedback, setGuidedReadingRecords, setIsAdmin,
    setItemMastery, setItemSessionSeen, setLetterAssessment, setLetterIndex,
    setLoadingStudents, setMastery, setMessage, setNameSaved,
    setNewClassName, setPatternAssessment, setPatternAttempt, setPatternIndex,
    setProfileLoaded, setResetProgressDialogOpen, setResettingProgress, setRoundAnswers,
    setRoundItemKeys, setRoundQuestionIds, setSelectedClassId, setSelectedStudentEvidenceReadState,
    setSelectedStudentEvidenceReady, setSessionMode, setStudentList, setStudentPreviewStatus,
    setStudentReportView, setStudentSession, setStudentSessionId, setStudentSessionName,
    setTeacherAccountRecord, setTeacherAccountStatus, setTeacherGroupId, setTeacherSchoolName,
    setTeacherStudentContext, setTeacherUser, setTotalAnswered, setUsedByStage,
    skillTree, STUDENT_SESSION_STORAGE_KEY, studentId, studentName,
    studentPreview, studentReportView, studentSession, supabase,
    teacherAccountRecord, teacherAccountStatus, teacherGroupId, teacherId,
    teacherIntentHash, teacherReportHash, teacherUser, totalAnswered,
    usedByStage,
  });
  const buildLatestSkillMasterySummary = useEffectEvent(buildSkillMasterySummary);

  const letterItems = letterAssessmentOrder.map(letter => ({
    display: letter,
    type: letter === letter.toUpperCase() ? "uppercase" : "lowercase"
  }));

  const patternItems = advancedPhonicsPatterns.map((item, index) => ({
    ...item,
    exampleWord: item.examples[(patternAttempt + index) % item.examples.length]
  }));

  async function startElBenchmarkAssessment(assessmentId, options = {}) {
    if (!studentId) return;
    if (elBenchmarkStartPendingRef.current) return;
    if (elBenchmarkSession?.studentId === studentId) {
      setMessage("Resume or discard the saved EL benchmark draft before starting another one.");
      return;
    }

    elBenchmarkStartPendingRef.current = true;
    setMessage("Preparing the benchmark assessment…");
    try {
      const { createElBenchmarkSession } = await loadElBenchmarkEngineModule();
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
    } finally {
      elBenchmarkStartPendingRef.current = false;
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
    const { buildElBenchmarkAttempt } = await loadElBenchmarkEngineModule();
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
    buildQuestionBankCoverage(allQuestions, curriculumReleaseBoard.rows),
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
      totalAnswered, updateElBenchmarkSession, updateStudentName, updateStudentSymbolPassword, updateTeacherAccountStatus, weaknessSnapshot
        }}
      />
    </Suspense>
  );
}

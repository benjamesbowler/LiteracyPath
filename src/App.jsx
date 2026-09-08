import ProgressSyncNotice from "./components/ProgressSyncNotice.jsx";
/* eslint-disable react-hooks/set-state-in-effect -- LEGACY-LINT: pre-strict-rules file; new code must not add violations. */
import { Suspense, useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useReducedMotion } from "framer-motion";
import "./App.css";
import { DEBUG_ASSESSMENT_COVERAGE, buildCoverageSnapshot, calculateWeaknessSnapshot, debugAssessmentCoverage, dedupeQuestionsByRuntimeSignature, downloadBlob, findQuestionForAnswerRecord, formatExportDateForFilename, formatReportDate, getAdminSetupMessage, getQuestionTargetWord, getRuntimeQuestionSignature, getStageIndex, inferItemMetadata, inferAnswerRecordMetadata, isApprovalSchemaError, isDuplicateAuthSignupError, isInitialSoundsStage, isInvalidRefreshTokenError, isMissingItemMasteryTableError, isMissingTableError, letterAssessmentOrder, logAdminSupabaseError, normalizeItemKey, normalizeRuntimeSkillId, prepareRuntimeQuestionBank, safeExportFilename, setRuntimeQuestionCache, startupQuestions } from "./appState/assessmentRuntime.js";
import { useAppSessionController } from "./appState/useAppSessionController.js";
import { STUDENT_SESSION_STORAGE_KEY, addWorkbookExportProvenance, createExcelWorkbook, exportStudentAssessmentWorkbook as exportStudentAssessmentWorkbookRuntime, flushRuntimeAssessmentAttemptSyncQueue, hydrateRuntimeAssessmentAttempts, loadAssessmentMediaPickerModule, loadAssessmentSkillBankLoaderModule, loadElBenchmarkEngineModule, loadFinishedReportPageModule, loadGuidedReadingBooksModule, loadTeacherRouteRuntime, pushRouteHash, resumeRuntimePendingLearnerDeletions, runtimeCloudIsExpected, teacherReportHash, useRuntimeStudentFocusSession } from "./appState/appRuntimeServices.js";
import { getMasteryRule } from "./masterySystem";
import { skillTree } from "./skillTree";
import { excludeFailedAssessmentMediaQuestions } from "./policy/assessmentMediaEvidence.js";
import { saveStudentAccessibilitySettings, saveStudentReducedChoiceMode } from "./data/studentRailSettings.js";
import { applyLearnerAccessibilityToDocument, learnerAccessibilityFromProfile } from "./accessibility/learnerAccessibility.js";
import { loadStudentProfile } from "./utils/studentProfile.js";
import { buildQuestMasteryReport } from "./utils/questReport.js";
import { advancedPhonicsPatterns } from "./data/advancedPhonicsPatterns";
import { getAnswerRecordPromptAnswerSignature, getAnswerRecordSignature, getRepeatOptionSetSignature } from "./questionRepeatGuards";
import { ASSESSMENT_RESPONSE_STATUSES, loadAssessmentAttempts, mergeAssessmentAttemptRecords, mergeAssessmentAttemptIntoItemMastery } from "./data/assessmentHistoryStore";
import { APP_VIEWS } from "./appState/appViews.js";
import { getPersistedAppView, getRestoredAppView, elBenchmarkAssessmentHash, isFocusedAssessmentView, isSameTeacherRoute, isStudentAllowedView, restoreElBenchmarkSessionFromHash, shouldOpenDefaultTeacherRoute, teacherIntentHash } from "./appState/appViewHelpers.js";
import { deleteElBenchmarkDraft, loadElBenchmarkDraft, resolveElBenchmarkSessionOwnership, saveElBenchmarkDraft, getGuidedReadingStorageKey as getGuidedReadingStorageKeyForSession, migrateGuidedReadingStorage, getTeacherProfileStorageKey } from "./appState/studentSessionHelpers.js";
import { calculateAccuracy, calculateRoundCorrect } from "./appState/assessmentSessionHelpers.js";
import { preloadQuestionMedia } from "./utils/preloadQuestionMedia.js";
import { DYNAMIC_IMPORT_ERROR_EVENT, importWithRetry } from "./utils/lazyWithRetry.js";
import { clearAndVerifyLocalProgressForStudent, clearProgressSyncSession, configureProgressSync, hydrateCloudProgress, queueProgressSave } from "./utils/progressSync.js";
import { configureInsertQueueAccount, startInsertQueueFlusher } from "./utils/insertQueue.js";
import { createAssessmentRoundController } from "./appState/assessmentRoundController.js";
import { AppSurface, preloadCyclePracticePage } from "./appState/appRuntimeSurfaces.jsx";
import { createStudentRosterReadState } from "./appState/studentRosterReadState.js";
import {
  createManualAssessmentAttemptSession,
  chooseNewestManualAssessmentEntries,
  loadManualAssessmentDrafts,
  manualAssessmentAdministrationStatus,
  manualAssessmentEntryOwnership,
  replaceManualAssessmentEntry,
  restoreManualAssessmentAttemptSession,
  restoreManualAssessmentDraftsFromHistory,
  runSingleFlight,
  saveManualAssessmentDrafts
} from "./appState/manualAssessmentFlow.js";
import {
  adminQaExitUrl,
  isAdminRoutePath,
  withoutAdminQaHistoryState
} from "./appState/adminQaNavigation.js";
import {
  addBrowserFullscreenListener,
  exitBrowserFullscreen,
  getBrowserFullscreenElement,
  requestBrowserFullscreen
} from "./utils/browserFullscreen.js";
import {
  installChildAudioPageLifecycle,
  stopAllChildAudio
} from "./utils/audio/childAudioLifecycle.js";
import { PRODUCT_NAME } from "./data/teacherBrand.js";
import {
  enforceStudentFocusView,
  STUDENT_FOCUS_TARGETS,
  studentFocusTargetView
} from "./policy/studentFocusTargets.js";
import {
  markStudentFocusExitHandled,
  shouldHandleStudentFocusExit
} from "./policy/studentFocusExit.js";

const STUDENT_PREVIEW_VIEWS = new Set([
  APP_VIEWS.STUDENT_HOME,
  APP_VIEWS.GUIDED_READING,
  APP_VIEWS.LEARN,
  APP_VIEWS.PHONICS_LEARN,
  APP_VIEWS.SKILLS_BLOCK_QUEST,
  APP_VIEWS.PHONICS_QUEST,
  APP_VIEWS.STUDENT_REWARDS
]);

async function clearLocalElAssessmentDataForStudent(options) {
  const resetModule = await importWithRetry(() => import("./utils/elAssessmentReset.js"));
  return resetModule.clearLocalElAssessmentDataForStudent(options);
}

export default function App() {
  const [studentSessionName, setStudentSessionName] = useState("");
  const [studentSessionId, setStudentSessionId] = useState(null);
  const [teacherStudentContext, setTeacherStudentContext] = useState({
    studentId: null,
    studentName: ""
  });
  const [teacherGroupId, setTeacherGroupId] = useState("all");
  const [sessionMode, setSessionMode] = useState("teacher");
  const [studentSession, setStudentSession] = useState(null);
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
    function handleGuidedReadingHydration(event) {
      if (event.detail?.studentId && event.detail.studentId !== studentId) return;
      if (!Array.isArray(event.detail?.rows) || !event.detail.rows.some(row => row.area === "guided_reading")) return;
      const key = getGuidedReadingStorageKeyForSession({ studentId });
      if (!key) return;
      try {
        const parsed = JSON.parse(localStorage.getItem(key) || "{}");
        setGuidedReadingRecords(parsed && typeof parsed === "object" ? parsed : {});
      } catch {
        setGuidedReadingRecords({});
      }
    }
    window.addEventListener("lp-progress-hydrated", handleGuidedReadingHydration);
    return () => window.removeEventListener("lp-progress-hydrated", handleGuidedReadingHydration);
  }, [studentId]);
  useEffect(() => {
    if (sessionMode !== "student") return undefined;
    return applyLearnerAccessibilityToDocument(learnerAccessibility);
  }, [learnerAccessibility, sessionMode]);
  useEffect(() => installChildAudioPageLifecycle(), []);
  const [studentList, setStudentList] = useState([]);
  const [archivedStudentList, setArchivedStudentList] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentListReadState, setStudentListReadState] = useState(
    createStudentRosterReadState
  );
  const [classList, setClassList] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [newClassName, setNewClassName] = useState("");
  const [classDashboard, setClassDashboard] = useState([]);
  const [appView, rawSetAppView] = useState(APP_VIEWS.SELECT);
  const activeAppViewRef = useRef(appView);
  activeAppViewRef.current = appView;
  const activeStudentFocusRef = useRef(null);
  const appViewNavigationRevisionRef = useRef(0);
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
    const resolvedNext = sessionMode === "student"
      ? enforceStudentFocusView(next, activeStudentFocusRef.current)
      : next;
    if (activeAppViewRef.current !== resolvedNext) {
      stopAllChildAudio("route-change");
    }
    if (
      typeof window !== "undefined"
      && activeAppViewRef.current === APP_VIEWS.ADMIN_DASHBOARD
      && next !== APP_VIEWS.ADMIN_DASHBOARD
      && isAdminRoutePath(window.location.pathname)
    ) {
      window.history.replaceState(
        withoutAdminQaHistoryState(window.history.state),
        "",
        adminQaExitUrl(window.location.hash)
      );
    }
    // A profile restore uses rawSetAppView directly. Every navigation through
    // this public setter is therefore a newer user/system intent that an
    // already-running restore must never replace when it eventually resolves.
    appViewNavigationRevisionRef.current += 1;
    if (
      typeof document !== "undefined"
      && typeof document.startViewTransition === "function"
      && sessionMode === "student"
      && !window.matchMedia("(prefers-reduced-motion: reduce)").matches
      && !learnerAccessibility.reducedEffects
    ) {
      try {
        const transition = document.startViewTransition(() => {
          flushSync(() => rawSetAppView(resolvedNext));
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
        rawSetAppView(resolvedNext);
      }
      return;
    }
    rawSetAppView(resolvedNext);
  }, [learnerAccessibility.reducedEffects, sessionMode]);
  const [studentFocusContentReport, setStudentFocusContentReport] = useState(null);
  const reportStudentFocusContent = useCallback(({ sessionId, contentOk }) => {
    const normalizedSessionId = String(sessionId || "").trim();
    if (!normalizedSessionId) return;
    setStudentFocusContentReport(previous => (
      previous?.sessionId === normalizedSessionId
      && previous?.contentOk === (contentOk !== false)
        ? previous
        : { sessionId: normalizedSessionId, contentOk: contentOk !== false }
    ));
  }, []);
  const studentFocus = useRuntimeStudentFocusSession({
    token: studentSession?.token || "",
    currentView: appView,
    enabled: sessionMode === "student" && Boolean(studentSession?.token),
    contentReport: studentFocusContentReport
  });
  activeStudentFocusRef.current = studentFocus.session;
  const [studentFocusCompletedSessionId, setStudentFocusCompletedSessionId] = useState("");
  const appliedStudentFocusSessionRef = useRef("");
  const previousStudentFocusSessionRef = useRef(null);
  const handledStudentFocusExitIdsRef = useRef(new Set());
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
  // The address a signup or sign-in is waiting on confirmation for. Holds the
  // email rather than a boolean so the resend button knows where to send, and
  // so the copy can name the address the person actually typed — half of
  // "I never got the email" is a typo in it.
  const [awaitingEmailConfirmation, setAwaitingEmailConfirmation] = useState("");
  // Guards the nudge button against a double press; the write is idempotent
  // enough not to matter, but a button that does nothing visible invites one.
  const [teacherAccountNudgeBusy, setTeacherAccountNudgeBusy] = useState(false);
  // The waiting-teacher count, loaded on admin sign-in rather than when the
  // admin dashboard is opened. Nothing else in the app announces a queue.
  const [pendingAccountAlert, setPendingAccountAlert] = useState(null);
  // The live anonymous try session, or null. Held here so the exit screen can
  // name the nickname after the session has already been torn down.
  const [trySession, setTrySession] = useState(null);
  const [teacherAccountStatus, setTeacherAccountStatus] = useState("signed_out");
  const [teacherAccountRecord, setTeacherAccountRecord] = useState(null);
  const [teacherSchoolName, setTeacherSchoolName] = useState("");
  const [teacherSchoolNameReadState, setTeacherSchoolNameReadState] = useState({
    status: "idle",
    teacherId: "",
    schoolId: "",
    error: null
  });
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
  const [assessmentHistoryReadState, setAssessmentHistoryReadState] = useState({
    status: "idle",
    source: "none",
    complete: false,
    truncated: false,
    error: null
  });
  const [assessmentHistoryHydrationRevision, setAssessmentHistoryHydrationRevision] = useState(0);
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
  const answerInFlightRef = useRef(false);
  const letterAssessmentArchivedRef = useRef(false);
  const patternAssessmentArchivedRef = useRef(false);
  // Manual checks can be retried after a storage/network failure. Keep one
  // stable attempt id for the life of the check so a retry updates the same
  // archive row instead of creating a duplicate completed assessment.
  const letterAssessmentAttemptRef = useRef(null);
  const patternAssessmentAttemptRef = useRef(null);
  const letterAssessmentSaveInFlightRef = useRef(null);
  const patternAssessmentSaveInFlightRef = useRef(null);
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
  const profileLoadedTeacherIdRef = useRef(null);
  const accountAccessCheckInFlightRef = useRef(false);
  const accountAccessCheckUserIdRef = useRef(null);
  const accountAccessCheckSeqRef = useRef(0);
  const pendingDeletionResumeRef = useRef(new Map());
  const isLearnView = appView === APP_VIEWS.LEARN || appView === APP_VIEWS.PHONICS_LEARN;
  const isStudentSurfaceView = isLearnView
    || appView === APP_VIEWS.STUDENT_REWARDS
    || appView === APP_VIEWS.CYCLE_PRACTICE;

  useEffect(() => {
    if (!authReady || (entryMode !== "student" && sessionMode !== "student")) return;
    void preloadCyclePracticePage().catch(() => {});
  }, [authReady, entryMode, sessionMode]);

  useEffect(() => {
    function syncFullscreenState() {
      if (!getBrowserFullscreenElement(document)) {
        setLearnFullscreen(false);
        setAssessmentFullscreen(false);
      }
    }

    return addBrowserFullscreenListener(document, syncFullscreenState);
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
    void requestBrowserFullscreen(document.documentElement);
  }

  function exitLearnFullscreen() {
    setLearnFullscreen(false);
    if (getBrowserFullscreenElement(document)) {
      void exitBrowserFullscreen(document);
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
    void requestBrowserFullscreen(document.documentElement);
  }

  function exitAssessmentFullscreen() {
    setAssessmentFullscreen(false);
    if (getBrowserFullscreenElement(document)) {
      void exitBrowserFullscreen(document);
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

  useEffect(() => {
    // Retry evidence only for the account that is currently authenticated.
    // Logging out clears the active scope without deleting its durable queue;
    // the same teacher can safely resume it on their next sign-in.
    configureInsertQueueAccount(teacherId || "");
  }, [teacherId]);

  useEffect(() => {
    if (!studentPreview) return;
    if (sessionMode === "student") {
      setStudentPreview(null);
      setStudentPreviewStatus("");
      return;
    }
    if (STUDENT_PREVIEW_VIEWS.has(appView)) return;

    // The teacher sidebar remains available during a child-surface preview.
    // If it is used instead of the yellow Return button, leave preview mode
    // without overriding the destination they chose. Otherwise the hidden
    // preview session would keep blocking later teacher-owned progress writes.
    if (teacherId) {
      configureProgressSync({
        mode: "teacher",
        studentId: studentPreview.studentId,
        studentName: studentPreview.studentName,
        classId: studentPreview.classId,
        teacherId
      });
    } else {
      clearProgressSyncSession();
    }
    setStudentPreview(null);
    setStudentPreviewStatus("");
  }, [appView, sessionMode, studentPreview, teacherId]);

  useEffect(() => {
    if (!authReady || !teacherId || typeof window === "undefined") return undefined;
    let deletionStorage = null;
    try {
      deletionStorage = window.localStorage;
    } catch {
      return undefined;
    }

    const resume = () => {
      if (pendingDeletionResumeRef.current.has(teacherId)) return;
      const task = resumeRuntimePendingLearnerDeletions({
        accountId: teacherId,
        storage: deletionStorage,
        cleanup: async record => {
          const progressCleanup = await clearAndVerifyLocalProgressForStudent(record.studentId, {
            storage: deletionStorage
          });
          const evidenceCleanup = await clearLocalElAssessmentDataForStudent({
            teacherId: record.accountId || teacherId,
            studentId: record.studentId,
            studentName: record.studentName,
            storage: deletionStorage
          });
          return { progressCleanup, evidenceCleanup };
        }
      }).then(results => {
        const completedIds = new Set(
          results
            .filter(result => result.status === "completed")
            .map(result => String(result.studentId))
        );
        if (completedIds.size) {
          setStudentList(previous => previous.filter(
            student => !completedIds.has(String(student.id))
          ));
          setArchivedStudentList(previous => previous.filter(
            student => !completedIds.has(String(student.id))
          ));
        }
        const failed = results.filter(result => result.status === "error");
        if (failed.length) {
          console.warn("Some interrupted learner deletions still need local cleanup.", failed);
        }
      }).catch(error => {
        console.warn("Interrupted learner deletion recovery could not run.", error);
      }).finally(() => {
        pendingDeletionResumeRef.current.delete(teacherId);
      });
      pendingDeletionResumeRef.current.set(teacherId, task);
    };

    resume();
    window.addEventListener("online", resume);
    return () => window.removeEventListener("online", resume);
  }, [authReady, teacherId]);

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
        const loaderModule = await loadAssessmentSkillBankLoaderModule();
        const bank = await loaderModule.loadAssessmentSkillBank(skillId);
        const preparedQuestions = prepareRuntimeQuestionBank(bank);
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
      setAssessmentHistoryReadState({
        status: "idle",
        source: "none",
        complete: false,
        truncated: false,
        error: null
      });
      return undefined;
    }

    let cancelled = false;
    const localRecords = loadAssessmentAttempts({ teacherId });
    const cloudExpected = runtimeCloudIsExpected(teacherId);
    setAssessmentHistory(localRecords);
    setAssessmentHistoryReadState({
      status: cloudExpected ? "loading" : "complete",
      source: "local",
      complete: !cloudExpected,
      truncated: false,
      error: null
    });
    void hydrateRuntimeAssessmentAttempts({
      teacherId,
      returnStatus: true
    }).then(result => {
      if (cancelled) return;
      // Use the complete cloud/local merge returned for this live session.
      // Reloading localStorage here could collapse a large class to the
      // quota-fallback cache even though the cloud query succeeded.
      setAssessmentHistory(result.records);
      setAssessmentHistoryReadState({
        status: result.error
          ? "error"
          : result.complete && !result.truncated
            ? "complete"
            : "partial",
        source: result.source,
        complete: result.complete === true && result.truncated !== true && !result.error,
        truncated: result.truncated === true,
        error: result.error || null
      });
    }).catch(error => {
      if (cancelled) return;
      setAssessmentHistoryReadState({
        status: "error",
        source: "local-fallback",
        complete: false,
        truncated: false,
        error
      });
    });

    return () => {
      cancelled = true;
    };
  }, [assessmentHistoryHydrationRevision, teacherId]);

  function retryAssessmentHistoryHydration() {
    if (!teacherId) return;
    setAssessmentHistoryHydrationRevision(revision => revision + 1);
  }

  useEffect(() => {
    if (!teacherId || !runtimeCloudIsExpected(teacherId) || typeof window === "undefined") {
      return undefined;
    }
    const flushPendingAssessmentAttempts = () => {
      void flushRuntimeAssessmentAttemptSyncQueue({ teacherId }).then(result => {
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

      if (String(studentId || "") === resetStudentId) {
        setMastery({});
        setItemMastery({});
        setItemSessionSeen({});
        setRoundAnswers([]);
        setRoundItemKeys([]);
        setRoundQuestionIds([]);
        setCurrentQuestion(null);
        setFeedback(null);
        setMessage("This student's practice progress was reset on another device. Completed assessments and formal assessment records were kept.");
      }
    }

    window.addEventListener("lp-progress-hydrated", handleRemoteProgressHydration);
    return () => window.removeEventListener("lp-progress-hydrated", handleRemoteProgressHydration);
  }, [studentId]);

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
    persistCompletedAssessmentAttempt, pickQuestion, prioritizeCoverageQuestions, resetInitialSoundRoundQueue, reviseLastAnswer,
    shouldShowImage, speakText,
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
    studentFocusSession: studentFocus.session,
    studentSessionToken: studentSession?.token || "",
    studentSessionTeacherId: studentSession?.teacherId || "",
    onStudentFocusAssessmentComplete: sessionId => setStudentFocusCompletedSessionId(sessionId)
  });

  const {
    adminDeleteClass, adminDeleteStudent, adminSetTeacherSchool, applyStudentSession,
    assignQuestPractice, clearQuestPractice, clearTeacherState,
    completePasswordReset, createClass, createDemoClass, createStudentForSelectedClass,
    demoTeacherEnabled, executeAdminDeleteClass, executeAdminDeleteStudent, exitToTeacherEntry,
    isTeacherAccountApproved, loadAdminDashboard, loadClassDashboard, loadClasses,
    classDashboardReadState, classListReadState, loadingClasses,
    loadStudentProgress, loadStudents, logInDemoTeacher, logInTeacher,
    logOutStudent, logOutTeacher, normalizeApprovalStatus, openAdminDashboard,
    profileStorageKey, regenerateClassCode, requestPasswordReset, resetSelectedStudentProgress,
    retryTeacherSchoolName, resendEmailConfirmation, nudgeTeacherAccountReview,
    returnToStudentSelection,
    startTryMode, endTryMode,
    resetStudentSymbolPassword, saveGuidedReadingRecord, saveTeacherSchool, setStudentAccessibilitySettings,
    setStudentReducedChoiceMode, signUpTeacher, updateStudentName, updateStudentSymbolPassword, updateTeacherAccountStatus,
    assignMissingSymbolPasswords,
  } = useAppSessionController({
    accountAccessCheckInFlightRef, accountAccessCheckSeqRef, accountAccessCheckUserIdRef, adminStatusError,
    adminStudents, answerHistory, answerHistoryRef, answerInFlightRef,
    APP_VIEWS, appView, appViewNavigationRevisionRef, assessmentActiveRef, assessmentMode,
    authBootCompletedRef, authDisplayName, authEmail, authPassword,
    authReady, authSchoolName, authUsername, buildQuestMasteryReport,
    chooseNewestManualAssessmentEntries, clearAndVerifyLocalProgressForStudent, clearLocalElAssessmentDataForStudent,
    clearProgressSyncSession,
    configureProgressSync, correctAnswered, currentSkillIndex,
    elBenchmarkAssessmentHash, elBenchmarkSession, findQuestionForAnswerRecord, freshAuthActionRef,
    freshLoginResetPendingRef, getAdminSetupMessage, getAnswerRecordPromptAnswerSignature, getAnswerRecordSignature,
    getGuidedReadingStorageKeyForSession, migrateGuidedReadingStorage, getItemMasteryStateKey, getPersistedAppView, getQuestionTargetWord,
    getRepeatOptionSetSignature, getRestoredAppView, getRuntimeQuestionSignature, getTeacherProfileStorageKey,
    hydrateCloudProgress, inferAnswerRecordMetadata, inferItemMetadata,
    initialSoundRoundMetaRef, isAdmin, isApprovalSchemaError, isDuplicateAuthSignupError,
    isInvalidRefreshTokenError, isMissingItemMasteryTableError, isMissingTableError, isSameTeacherRoute,
    isStudentAllowedView: view => isStudentAllowedView(view, activeStudentFocusRef.current),
    itemMastery, lastAuthUserIdRef, learnerAccessibilityFromProfile,
    letterAssessment, letterIndex, loadAssessmentAttempts, loadElBenchmarkDraft, loadManualAssessmentDrafts,
    loadTeacherRouteRuntime, logAdminSupabaseError, mastery, mergeAssessmentAttemptIntoItemMastery,
    mergeAssessmentAttemptRecords, newClassName, normalizeItemMasteryRow, patternAssessment,
    patternAttempt, patternIndex, pickQuestion, profileLoaded, profileLoadedTeacherIdRef,
    queueProgressSave, rawSetAppView, resetInitialSoundRoundQueue,
    restoreElBenchmarkSessionFromHash, restoreManualAssessmentDraftsFromHistory, roundAnswers, roundItemKeys, roundItemKeysRef,
    roundQuestionIds, roundQuestionIdsRef, saveElBenchmarkDraft, saveManualAssessmentDrafts, saveStudentAccessibilitySettings,
    saveStudentReducedChoiceMode, selectedClassId, sessionMode, setAdminClasses,
    setAdminConfirm, setAdminLoading, setAdminPendingAccounts, setAdminPendingAccountsWarning,
    setAdminSchools, setAdminStatusError, setAdminStudents, setAdminTeachers,
    setAnswerHistory, setAppView, setArchivedStudentList, setAssessmentHistory,
    setAssessmentMode, setAssessmentTransitioning, setAuthLoading, setAuthMessage,
    awaitingEmailConfirmation, setAwaitingEmailConfirmation,
    teacherAccountNudgeBusy, setTeacherAccountNudgeBusy,
    pendingAccountAlert, setPendingAccountAlert,
    trySession, setTrySession,
    setAuthMode, setAuthPassword, setAuthReady, setCheckpointDecision,
    setClassDashboard, setClassList, setCorrectAnswered, setCurrentQuestion,
    setCurrentSkillIndex, setDiagnosticFollowUp, setElBenchmarkDraftSaveFailed, setElBenchmarkSession,
    setEntryMode, setFeedback, setGuidedReadingRecords, setIsAdmin,
    setItemMastery, setItemSessionSeen, setLetterAssessment, setLetterIndex,
    setLoadingStudents, setMastery, setMessage, setNameSaved,
    setNewClassName, setPatternAssessment, setPatternAttempt, setPatternIndex,
    setProfileLoaded, setResetProgressDialogOpen, setResettingProgress, setRoundAnswers,
    setRoundItemKeys, setRoundQuestionIds, setSelectedClassId, setSelectedStudentEvidenceReadState,
    setSelectedStudentEvidenceReady, setSessionMode, setStudentList, setStudentListReadState, setStudentPreviewStatus,
    setStudentReportView, setStudentSession, setStudentSessionId, setStudentSessionName,
    setTeacherAccountRecord, setTeacherAccountStatus, setTeacherGroupId, setTeacherSchoolName,
    setTeacherSchoolNameReadState,
    setTeacherStudentContext, setTeacherUser, setTotalAnswered, setUsedByStage,
    skillTree, STUDENT_SESSION_STORAGE_KEY, studentId, studentName,
    studentPreview, studentReportView, studentSession,
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

  function ensureTeacherAssessmentEvidenceReady(verifiedSyncStatus = "") {
    if (sessionMode === "student") return true;
    if (verifiedSyncStatus === "complete") return true;
    const ready = Boolean(
      studentId
      && selectedStudentEvidenceReady
      && selectedStudentEvidenceReadState?.syncStatus === "complete"
    );
    if (!ready) {
      setMessage(
        "This student's saved results are not fully available. Nothing has been counted as zero. Try again before starting an assessment."
      );
    }
    return ready;
  }

  async function startElBenchmarkAssessment(assessmentId, options = {}) {
    if (!studentId) return;
    const selectedStudentRow = studentList.find(
      row => String(row.id || "") === String(studentId)
    );
    const selectedStudentClassId = String(
      selectedStudentRow?.classId || selectedStudentRow?.class_id || selectedClassId || ""
    );
    if (
      !selectedClassId
      || !teacherId
      || !selectedStudentRow
      || selectedStudentClassId !== String(selectedClassId)
    ) {
      setMessage("Choose the student's class again before starting this assessment.");
      return;
    }
    if (!ensureTeacherAssessmentEvidenceReady()) return;
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
      setMessage(
        "We couldn't prepare this assessment. Saved results have not changed. Return to Assessments and try again."
      );
    } finally {
      elBenchmarkStartPendingRef.current = false;
    }
  }

  function getElBenchmarkOwnership(nextSession = elBenchmarkSession) {
    return resolveElBenchmarkSessionOwnership({
      session: nextSession,
      activeSession: elBenchmarkSession,
      currentTeacherId: teacherId,
      currentStudentId: studentId,
      selectedClassId
    });
  }

  function getElBenchmarkOwnershipMessage(ownership) {
    const originalClassName = classList.find(
      row => String(row.id || "") === String(ownership?.classId || "")
    )?.name;
    if (ownership?.reason === "session_ownership_changed") {
      return "This unfinished assessment's learner or class details no longer match the assessment that was started. Nothing was saved. Return to Assessments and reopen the original draft.";
    }
    if (ownership?.reason === "missing_session_ownership") {
      return "This older unfinished assessment does not contain enough class ownership information to save safely. Nothing was changed. Clear the draft and start a new assessment from the correct class.";
    }
    return `This unfinished assessment belongs to ${originalClassName || "a different class or student"}. Nothing was saved. Select that class and student before carrying on.`;
  }

  function blockElBenchmarkOwnershipChange(ownership) {
    const ownershipMessage = getElBenchmarkOwnershipMessage(ownership);
    setMessage(ownershipMessage);
    if (appView === APP_VIEWS.EL_BENCHMARK) setAppView(APP_VIEWS.ASSESSMENTS);
    return {
      blocked: true,
      ownership,
      message: ownershipMessage
    };
  }

  function updateElBenchmarkSession(nextSession) {
    const ownership = getElBenchmarkOwnership(nextSession);
    if (!ownership.ok) {
      blockElBenchmarkOwnershipChange(ownership);
      return;
    }
    const ownedSession = {
      ...nextSession,
      sessionId: ownership.sessionId,
      studentId: ownership.studentId,
      classId: ownership.classId,
      teacherId: ownership.teacherId
    };
    const draftSaved = saveElBenchmarkDraft({
      teacherId: ownership.teacherId,
      studentId: ownership.studentId,
      session: ownedSession
    });
    setElBenchmarkDraftSaveFailed(!draftSaved);
    setElBenchmarkSession(ownedSession);
  }

  function resumeElBenchmarkAssessment() {
    const ownership = getElBenchmarkOwnership(elBenchmarkSession);
    if (!ownership.ok) {
      blockElBenchmarkOwnershipChange(ownership);
      return;
    }
    setMessage("");
    setAppView(APP_VIEWS.EL_BENCHMARK);
  }

  function discardElBenchmarkDraft() {
    const ownership = getElBenchmarkOwnership(elBenchmarkSession);
    if (!ownership.ok) {
      blockElBenchmarkOwnershipChange(ownership);
      return false;
    }
    const deleted = deleteElBenchmarkDraft({
      teacherId: ownership.teacherId,
      studentId: ownership.studentId
    });
    if (!deleted) {
      setMessage(
        "We couldn't clear the unfinished assessment from this device. It is still available, so no work was lost. Check browser storage and try again."
      );
      return false;
    }
    setElBenchmarkDraftSaveFailed(false);
    setElBenchmarkSession(null);
    setMessage("");
    if (appView === APP_VIEWS.EL_BENCHMARK) setAppView(APP_VIEWS.ASSESSMENTS);
    return true;
  }

  async function archiveElBenchmarkSession(nextSession) {
    const ownership = getElBenchmarkOwnership(nextSession);
    if (!ownership.ok) return blockElBenchmarkOwnershipChange(ownership);
    const { buildElBenchmarkAttempt } = await loadElBenchmarkEngineModule();
    const administrationStatus = nextSession.administrationStatus || nextSession.status || "partial";
    const snapshotAt = nextSession.completedAt || nextSession.discontinuedAt || nextSession.savedAt || new Date().toISOString();
    const attempt = buildElBenchmarkAttempt({
      ...nextSession,
      sessionId: ownership.sessionId,
      studentId: ownership.studentId,
      classId: ownership.classId,
      teacherId: ownership.teacherId,
      status: administrationStatus,
      administrationStatus,
      completedAt: snapshotAt,
      updatedAt: nextSession.updatedAt || snapshotAt
    }, {
      studentId: ownership.studentId,
      studentName: elBenchmarkSession?.studentName || nextSession.studentName || "Student",
      classId: ownership.classId,
      teacherId: ownership.teacherId,
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
    const ownership = getElBenchmarkOwnership(nextSession);
    if (!ownership.ok) {
      const blocked = blockElBenchmarkOwnershipChange(ownership);
      return {
        ok: false,
        durable: false,
        ...blocked
      };
    }
    const partialSession = {
      ...nextSession,
      sessionId: ownership.sessionId,
      studentId: ownership.studentId,
      classId: ownership.classId,
      teacherId: ownership.teacherId,
      status: "partial",
      administrationStatus: "partial"
    };
    const draftSaved = saveElBenchmarkDraft({
      teacherId: ownership.teacherId,
      studentId: ownership.studentId,
      session: partialSession
    });
    setElBenchmarkDraftSaveFailed(!draftSaved);
    setElBenchmarkSession(partialSession);
    const archiveResult = await archiveElBenchmarkSession(partialSession);
    if (archiveResult?.blocked) {
      return {
        ok: false,
        durable: false,
        ...archiveResult
      };
    }
    if (!draftSaved && !archiveResult) {
      setMessage("These results could not be saved on this device or to the secure archive. Nothing has been lost. Keep this screen open and select Save partial & exit again.");
      return;
    }
    setMessage(draftSaved
      ? "Partial assessment results saved. You can resume this draft from the assessment hub."
      : "Partial results were archived, but this device could not keep a resumable draft.");
    setAppView(APP_VIEWS.ASSESSMENTS);
  }

  async function finishElBenchmarkAssessment(nextSession) {
    const completedSession = {
      ...nextSession,
      status: "completed",
      administrationStatus: "completed"
    };
    const archiveResult = await archiveElBenchmarkSession(completedSession);
    if (archiveResult?.blocked) {
      return {
        ok: false,
        durable: false,
        ...archiveResult
      };
    }
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
    const cloudExpected = runtimeCloudIsExpected(teacherId);
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
    setAppView(APP_VIEWS.ASSESSMENTS);
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
    if (archiveResult?.blocked) {
      return {
        ok: false,
        durable: false,
        ...archiveResult
      };
    }
    if (!archiveResult) {
      const recoverySaved = saveElBenchmarkDraft({ teacherId, studentId, session: discontinuedSession });
      setElBenchmarkDraftSaveFailed(!recoverySaved);
      setElBenchmarkSession(discontinuedSession);
      const failureMessage = "The discontinued assessment could not be saved on this device or in the secure archive. Nothing has been lost: the results are still on this screen. Try saving again.";
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
    const cloudExpected = runtimeCloudIsExpected(teacherId);
    const syncPending = cloudExpected && localSaved && !cloudSaved && Boolean(archiveResult.persistence.syncQueued);
    const cloudCopyUnavailable = cloudExpected && !cloudSaved && !syncPending;
    deleteElBenchmarkDraft({ teacherId, studentId });
    setElBenchmarkDraftSaveFailed(false);
    setElBenchmarkSession(null);
    const successMessage = syncPending
      ? "Discontinued assessment results saved on this device. Unadministered items were not counted as incorrect. Cloud sync is pending."
      : cloudCopyUnavailable
        ? "Discontinued assessment results saved on this device, but a cloud copy could not be queued. Keep this device's data and retry from a reliable connection."
        : "Discontinued assessment results saved. Unadministered items were not counted as incorrect.";
    setMessage(successMessage);
    setAppView(APP_VIEWS.ASSESSMENTS);
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
    setAppView(APP_VIEWS.ASSESSMENTS);
  }

  function startAdvancedPhonicsAssessment() {
    if (!ensureTeacherAssessmentEvidenceReady()) return;
    if (patternAssessment.length > 0 && patternIndex < patternItems.length) {
      ensureManualAssessmentAttempt(
        patternAssessmentAttemptRef,
        "advanced_phonics_patterns",
        patternAssessment
      );
      patternAssessmentArchivedRef.current = false;
      setMessage(`Resuming ${studentName || "this student's"} unfinished phonics pattern assessment.`);
      setAppView(APP_VIEWS.ADVANCED_PHONICS);
      return;
    }
    setPatternIndex(0);
    setPatternAssessment([]);
    setPatternAttempt(attempt => attempt + 1);
    patternAssessmentArchivedRef.current = false;
    beginManualAssessmentAttempt(patternAssessmentAttemptRef, "advanced_phonics_patterns");
    setAppView(APP_VIEWS.ADVANCED_PHONICS);
  }

  function startLetterAssessment() {
    if (!ensureTeacherAssessmentEvidenceReady()) return;
    if (letterAssessment.length > 0 && letterIndex < letterItems.length) {
      ensureManualAssessmentAttempt(
        letterAssessmentAttemptRef,
        "el_letter_assessment",
        letterAssessment
      );
      letterAssessmentArchivedRef.current = false;
      setMessage(`Resuming ${studentName || "this student's"} unfinished letter assessment.`);
      setAppView(APP_VIEWS.LETTERS);
      return;
    }
    setLetterIndex(0);
    setLetterAssessment([]);
    letterAssessmentArchivedRef.current = false;
    beginManualAssessmentAttempt(letterAssessmentAttemptRef, "el_letter_assessment");
    setAppView(APP_VIEWS.LETTERS);
  }

  function normalizeManualAssessmentOutcome(value) {
    if (value === true || value === ASSESSMENT_RESPONSE_STATUSES.CORRECT) {
      return ASSESSMENT_RESPONSE_STATUSES.CORRECT;
    }
    if (value === false || value === ASSESSMENT_RESPONSE_STATUSES.INCORRECT) {
      return ASSESSMENT_RESPONSE_STATUSES.INCORRECT;
    }
    return ASSESSMENT_RESPONSE_STATUSES.NOT_ADMINISTERED;
  }

  function manualOutcomeIsCorrect(value) {
    return normalizeManualAssessmentOutcome(value) === ASSESSMENT_RESPONSE_STATUSES.CORRECT;
  }

  function manualOutcomeWasScored(value) {
    return [
      ASSESSMENT_RESPONSE_STATUSES.CORRECT,
      ASSESSMENT_RESPONSE_STATUSES.INCORRECT
    ].includes(normalizeManualAssessmentOutcome(value));
  }

  function beginManualAssessmentAttempt(attemptRef, assessmentType) {
    const session = createManualAssessmentAttemptSession({
      assessmentType,
      studentId
    });
    attemptRef.current = session;
    return session;
  }

  function ensureManualAssessmentAttempt(attemptRef, assessmentType, savedEntries = []) {
    const current = attemptRef.current;
    if (
      current?.assessmentType === assessmentType
      && current?.studentId === studentId
      && current?.attemptId
    ) {
      return current;
    }
    const savedSession = restoreManualAssessmentAttemptSession({
      assessmentType,
      studentId,
      savedEntries
    });
    if (savedSession) {
      attemptRef.current = savedSession;
      return savedSession;
    }
    return beginManualAssessmentAttempt(attemptRef, assessmentType);
  }

  async function runManualAssessmentSave(saveRef, operation) {
    // Return the same promise to every caller while a save is in flight. This
    // is a controller-level lock (not just a disabled button), so a rapid
    // double click cannot write twice or advance past the next item.
    return runSingleFlight(saveRef, operation);
  }

  function buildPatternAssessmentEntry(current, soundOutcome, wordOutcome) {
    const attemptSession = ensureManualAssessmentAttempt(
      patternAssessmentAttemptRef,
      "advanced_phonics_patterns",
      patternAssessment
    );
    return {
      pattern: current.pattern,
      exampleWord: current.exampleWord,
      soundOutcome: normalizeManualAssessmentOutcome(soundOutcome),
      wordOutcome: normalizeManualAssessmentOutcome(wordOutcome),
      soundCorrect: manualOutcomeIsCorrect(soundOutcome),
      wordCorrect: manualOutcomeIsCorrect(wordOutcome),
      ...manualAssessmentEntryOwnership(attemptSession)
    };
  }

  function buildLetterAssessmentEntry(current, nameOutcome, soundOutcome) {
    const attemptSession = ensureManualAssessmentAttempt(
      letterAssessmentAttemptRef,
      "el_letter_assessment",
      letterAssessment
    );
    return {
      letter: current.display,
      type: current.type,
      nameOutcome: normalizeManualAssessmentOutcome(nameOutcome),
      soundOutcome: normalizeManualAssessmentOutcome(soundOutcome),
      knowsName: manualOutcomeIsCorrect(nameOutcome),
      knowsSound: manualOutcomeIsCorrect(soundOutcome),
      ...manualAssessmentEntryOwnership(attemptSession)
    };
  }

  async function archivePatternAssessment(nextAssessment, { allowPartial = false } = {}) {
    if (!studentId) return { durable: false };
    if (!nextAssessment.length) return { durable: true, skipped: true };
    if (!allowPartial && nextAssessment.length < patternItems.length) {
      return { durable: true, skipped: true };
    }
    if (patternAssessmentArchivedRef.current) {
      return {
        durable: true,
        administrationStatus: manualAssessmentAdministrationStatus(
          nextAssessment.length,
          patternItems.length
        )
      };
    }
    const attemptSession = ensureManualAssessmentAttempt(
      patternAssessmentAttemptRef,
      "advanced_phonics_patterns",
      nextAssessment
    );
    const completedAt = new Date().toISOString();
    const patternStats = nextAssessment.map(item => {
      const outcomes = [item.soundOutcome, item.wordOutcome]
        .map(normalizeManualAssessmentOutcome);
      const attempts = outcomes.filter(outcome => outcome !== ASSESSMENT_RESPONSE_STATUSES.NOT_ADMINISTERED).length;
      const correct = outcomes.filter(outcome => outcome === ASSESSMENT_RESPONSE_STATUSES.CORRECT).length;
      return {
        pattern: item.pattern,
        exampleWord: item.exampleWord,
        attempts,
        correct,
        incorrect: attempts - correct,
        accuracy: attempts ? Math.round((correct / attempts) * 100) : null,
        status: attempts === 0
          ? "not_checked"
          : attempts < 2
            ? "not_enough_evidence"
            : correct === 2
              ? "developing"
              : "needs_support"
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
        selectedAnswer: manualOutcomeIsCorrect(item.soundOutcome) ? item.pattern : "",
        isCorrect: manualOutcomeIsCorrect(item.soundOutcome),
        responseStatus: normalizeManualAssessmentOutcome(item.soundOutcome),
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
        selectedAnswer: manualOutcomeIsCorrect(item.wordOutcome) ? item.exampleWord : "",
        isCorrect: manualOutcomeIsCorrect(item.wordOutcome),
        responseStatus: normalizeManualAssessmentOutcome(item.wordOutcome),
        skillId: "advanced_phonics_patterns",
        templateType: "phonics_pattern_word",
        level: 2,
        phase: 1,
        timestamp: completedAt
      }
    ]));

    const scoredRecords = questionRecords.filter(record => manualOutcomeWasScored(record.responseStatus));
    const correctCount = scoredRecords.filter(record => record.isCorrect).length;
    // Lifecycle and coverage are separate. Reaching every planned pattern
    // completes the administration even when the teacher explicitly records
    // "Not checked" for one subtask; those missing observations stay visible
    // in the counts and must not be turned into incorrect answers.
    const administrationStatus = manualAssessmentAdministrationStatus(
      nextAssessment.length,
      patternItems.length
    );
    const persistence = await persistCompletedAssessmentAttempt({
      attemptId: attemptSession.attemptId,
      studentId,
      studentName,
      classId: selectedClassId,
      teacherId,
      assessmentType: "advanced_phonics_patterns",
      skillId: "advanced_phonics_patterns",
      skillName: "Advanced Phonics Patterns",
      skillLevel: 2,
      skillPhase: 1,
      startedAt: attemptSession.startedAt,
      completedAt,
      totalQuestions: scoredRecords.length,
      plannedQuestionCount: patternItems.length * 2,
      correctCount,
      incorrectCount: scoredRecords.length - correctCount,
      passed: false,
      status: administrationStatus,
      administrationStatus,
      masteredItems: [],
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
    if (persistence) patternAssessmentArchivedRef.current = true;
    return {
      durable: Boolean(persistence),
      administrationStatus
    };
  }

  async function recordPatternResult(soundOutcome, wordOutcome) {
    return runManualAssessmentSave(patternAssessmentSaveInFlightRef, async () => {
      const current =
        patternItems[patternIndex];
      if (!current) return false;

      // Keep persistence outside the React state updater. React may replay an
      // updater in development; a network write inside it can archive twice.
      const nextAssessment = replaceManualAssessmentEntry(
        patternAssessment,
        patternIndex,
        buildPatternAssessmentEntry(current, soundOutcome, wordOutcome)
      );
      const isFinalItem = nextAssessment.length >= patternItems.length;
      if (isFinalItem) {
        // Archive the completed assessment before moving the UI to the summary.
        // If the save fails, the teacher's current choices stay on screen and a
        // retry uses the same attempt id and replaces this item rather than
        // appending it twice.
        const archiveResult = await archivePatternAssessment(nextAssessment);
        if (!archiveResult.durable) {
          setMessage("This assessment could not be saved on this device or to the cloud, so it was not marked complete. Your choices are still here. Try again.");
          return false;
        }
      }

      // Non-final choices remain a student-scoped local draft. They do not
      // increment current mastery here; the aggregate is derived exactly once
      // from the stable archived attempt at Finish/Save & exit.
      setPatternAssessment(nextAssessment);
      setPatternIndex(prev => prev + 1);
      return true;
    });
  }

  function resetPatternAssessment() {
    setPatternIndex(0);
    setPatternAssessment([]);
    setPatternAttempt(attempt => attempt + 1);
    patternAssessmentArchivedRef.current = false;
    beginManualAssessmentAttempt(patternAssessmentAttemptRef, "advanced_phonics_patterns");
  }

  function goToPreviousPattern() {
    setPatternIndex(previous => Math.max(0, previous - 1));
  }

  async function recordLetterResult(nameOutcome, soundOutcome) {
    return runManualAssessmentSave(letterAssessmentSaveInFlightRef, async () => {
      const current =
        letterItems[letterIndex];
      if (!current) return false;

      const nextAssessment = replaceManualAssessmentEntry(
        letterAssessment,
        letterIndex,
        buildLetterAssessmentEntry(current, nameOutcome, soundOutcome)
      );
      const isFinalItem = nextAssessment.length >= letterItems.length;
      if (isFinalItem) {
        const archiveResult = await archiveLetterAssessment(nextAssessment);
        if (!archiveResult.durable) {
          setMessage("This assessment could not be saved on this device or to the cloud, so it was not marked complete. Your choices are still here. Try again.");
          return false;
        }
      }

      setLetterAssessment(nextAssessment);
      setLetterIndex(prev => prev + 1);
      return true;
    });
  }

  function resetLetterAssessment() {
    setLetterIndex(0);
    setLetterAssessment([]);
    letterAssessmentArchivedRef.current = false;
    beginManualAssessmentAttempt(letterAssessmentAttemptRef, "el_letter_assessment");
  }

  function goToPreviousLetter() {
    setLetterIndex(previous => Math.max(0, previous - 1));
  }

  async function archiveLetterAssessment(nextAssessment, { allowPartial = false } = {}) {
    if (!studentId) return { durable: false };
    if (!nextAssessment.length) return { durable: true, skipped: true };
    if (!allowPartial && nextAssessment.length < letterItems.length) {
      return { durable: true, skipped: true };
    }
    if (letterAssessmentArchivedRef.current) {
      return {
        durable: true,
        administrationStatus: manualAssessmentAdministrationStatus(
          nextAssessment.length,
          letterItems.length
        )
      };
    }
    const attemptSession = ensureManualAssessmentAttempt(
      letterAssessmentAttemptRef,
      "el_letter_assessment",
      nextAssessment
    );
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
          selectedAnswer: manualOutcomeIsCorrect(item.nameOutcome) ? item.letter : "",
          isCorrect: manualOutcomeIsCorrect(item.nameOutcome),
          responseStatus: normalizeManualAssessmentOutcome(item.nameOutcome),
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
          selectedAnswer: manualOutcomeIsCorrect(item.soundOutcome) ? letter : "",
          isCorrect: manualOutcomeIsCorrect(item.soundOutcome),
          responseStatus: normalizeManualAssessmentOutcome(item.soundOutcome),
          skillId: "el_letter_assessment",
          templateType: "letter_sound",
          level: 1,
          phase: 1,
          timestamp: completedAt
        }
      ];
    });
    const scoredRecords = questionRecords.filter(record => manualOutcomeWasScored(record.responseStatus));
    const correctCount = scoredRecords.filter(record => record.isCorrect).length;

    const administrationStatus = manualAssessmentAdministrationStatus(
      nextAssessment.length,
      letterItems.length
    );
    const persistence = await persistCompletedAssessmentAttempt({
      attemptId: attemptSession.attemptId,
      studentId,
      studentName,
      classId: selectedClassId,
      teacherId,
      assessmentType: "el_letter_assessment",
      skillId: "el_letter_assessment",
      skillName: "EL Letter Name and Sound",
      skillLevel: 1,
      skillPhase: 1,
      startedAt: attemptSession.startedAt,
      completedAt,
      totalQuestions: scoredRecords.length,
      plannedQuestionCount: letterItems.length * 2,
      correctCount,
      passed: false,
      status: administrationStatus,
      administrationStatus,
      questionRecords
    }, { mergeIntoMastery: true });
    if (persistence) letterAssessmentArchivedRef.current = true;
    return {
      durable: Boolean(persistence),
      administrationStatus
    };
  }

  function returnToAssessmentHub(nextMessage) {
    const nextHash = teacherIntentHash({
      appView: APP_VIEWS.ASSESSMENTS,
      classId: selectedClassId,
      groupId: teacherGroupId,
      learnerId: studentId
    });
    if (nextHash) pushRouteHash(nextHash);
    setMessage(nextMessage);
    setAppView(APP_VIEWS.ASSESSMENTS);
  }

  async function savePatternAssessmentPartialAndExit(soundOutcome = "", wordOutcome = "") {
    return runManualAssessmentSave(patternAssessmentSaveInFlightRef, async () => {
      const hasCurrentChoice = Boolean(soundOutcome || wordOutcome);
      const current = patternItems[patternIndex];
      const nextAssessment = hasCurrentChoice && current
        ? replaceManualAssessmentEntry(
            patternAssessment,
            patternIndex,
            buildPatternAssessmentEntry(current, soundOutcome, wordOutcome)
          )
        : patternAssessment.slice(0, patternIndex);

      if (!nextAssessment.length) {
        returnToAssessmentHub("Assessment closed. No results were entered or saved.");
        return true;
      }

      const archiveResult = await archivePatternAssessment(nextAssessment, { allowPartial: true });
      if (!archiveResult.durable) {
        setMessage("The assessment could not be saved. Your choices are still here. Keep this page open and try again.");
        return false;
      }

      setPatternAssessment(nextAssessment);
      if (hasCurrentChoice && current) {
        setPatternIndex(previous => previous + 1);
      }
      returnToAssessmentHub(
        archiveResult.administrationStatus === "completed"
          ? `Phonics pattern assessment completed and saved for ${studentName || "this student"}.`
          : `Unfinished phonics pattern assessment saved for ${studentName || "this student"}. You can resume it from Assessments.`
      );
      return true;
    });
  }

  async function saveLetterAssessmentPartialAndExit(nameOutcome = "", soundOutcome = "") {
    return runManualAssessmentSave(letterAssessmentSaveInFlightRef, async () => {
      const hasCurrentChoice = Boolean(nameOutcome || soundOutcome);
      const current = letterItems[letterIndex];
      const nextAssessment = hasCurrentChoice && current
        ? replaceManualAssessmentEntry(
            letterAssessment,
            letterIndex,
            buildLetterAssessmentEntry(current, nameOutcome, soundOutcome)
          )
        : letterAssessment.slice(0, letterIndex);

      if (!nextAssessment.length) {
        returnToAssessmentHub("Assessment closed. No results were entered or saved.");
        return true;
      }

      const archiveResult = await archiveLetterAssessment(nextAssessment, { allowPartial: true });
      if (!archiveResult.durable) {
        setMessage("The assessment could not be saved. Your choices are still here. Keep this page open and try again.");
        return false;
      }

      setLetterAssessment(nextAssessment);
      if (hasCurrentChoice && current) {
        setLetterIndex(previous => previous + 1);
      }
      returnToAssessmentHub(
        archiveResult.administrationStatus === "completed"
          ? `Letter name and sound assessment completed and saved for ${studentName || "this student"}.`
          : `Unfinished letter name and sound assessment saved for ${studentName || "this student"}. You can resume it from Assessments.`
      );
      return true;
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
      const report = await exportStudentAssessmentWorkbookRuntime({
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
        evidenceReadState: selectedStudentEvidenceReadState
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
        { header: "Teacher Notes", key: "notes", width: 16 }
      ];
      progress.rows.forEach(row => {
        const observation = observationsByBook.get(row.bookId) || {};
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


  async function startAssessment(stageIndex = currentSkillIndex, options = {}) {
    if (!ensureTeacherAssessmentEvidenceReady(options?.verifiedEvidenceSyncStatus)) return;
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

  const startStudentFocusAssessment = useEffectEvent(startAssessment);
  const returnToStudentSelectionEvent = useEffectEvent(returnToStudentSelection);

  useEffect(() => {
    const session = studentFocus.session;
    const previousSession = previousStudentFocusSessionRef.current;
    previousStudentFocusSessionRef.current = session;

    if (sessionMode !== "student") return;
    const exitCommand = {
      endAction: studentFocus.endAction,
      endedSessionId: studentFocus.endedSessionId
    };
    let exitStorage = null;
    try {
      exitStorage = window.localStorage;
    } catch {
      // The in-memory guard below still prevents repeat handling on this page.
    }
    const exitAlreadyHandledInMemory = handledStudentFocusExitIdsRef.current.has(
      String(exitCommand.endedSessionId || "")
    );
    if (
      !exitAlreadyHandledInMemory
      && shouldHandleStudentFocusExit(exitCommand, exitStorage)
    ) {
      handledStudentFocusExitIdsRef.current.add(exitCommand.endedSessionId);
      markStudentFocusExitHandled(exitCommand.endedSessionId, exitStorage);
      appliedStudentFocusSessionRef.current = "";
      setStudentFocusCompletedSessionId("");
      setStudentFocusContentReport(null);
      assessmentActiveRef.current = false;
      answerInFlightRef.current = false;
      setCurrentQuestion(null);
      setFeedback(null);
      setCheckpointDecision(null);
      setRoundAnswers([]);
      setRoundItemKeys([]);
      setRoundQuestionIds([]);
      roundItemKeysRef.current = [];
      roundQuestionIdsRef.current = [];
      returnToStudentSelectionEvent();
      return;
    }
    if (!session) {
      if (previousSession) {
        appliedStudentFocusSessionRef.current = "";
        setStudentFocusCompletedSessionId("");
        assessmentActiveRef.current = false;
        answerInFlightRef.current = false;
        setCurrentQuestion(null);
        setFeedback(null);
        setCheckpointDecision(null);
        setRoundAnswers([]);
        setRoundItemKeys([]);
        setRoundQuestionIds([]);
        roundItemKeysRef.current = [];
        roundQuestionIdsRef.current = [];
        setMessage("");
        setAppView(APP_VIEWS.STUDENT_HOME);
      }
      return;
    }

    const targetView = studentFocusTargetView(session.target);
    if (session.content_ok === false) {
      setMessage("This activity needs the latest version of Literacy Guide. Ask your teacher for help.");
      setAppView(targetView);
      return;
    }

    if (session.member_status === "completed") {
      setStudentFocusCompletedSessionId(session.id);
      if (session.target === STUDENT_FOCUS_TARGETS.SKILLS_ASSESSMENT) {
        setAppView(APP_VIEWS.CHECKPOINT);
      } else if (session.target === STUDENT_FOCUS_TARGETS.CYCLE_PRACTICE) {
        setAppView(APP_VIEWS.CYCLE_PRACTICE);
      }
      return;
    }

    setStudentFocusCompletedSessionId("");
    if (session.target !== STUDENT_FOCUS_TARGETS.SKILLS_ASSESSMENT) {
      setAppView(targetView);
      return;
    }
    if (appliedStudentFocusSessionRef.current === session.id) return;

    const assignment = session.resolved_config || {};
    const skillIndex = Number(assignment.skill_index);
    if (
      !Number.isInteger(skillIndex)
      || skillIndex < 0
      || skillIndex >= skillTree.length
      || skillTree[skillIndex]?.id !== assignment.skill_id
    ) {
      setMessage("This assessment assignment could not be opened. Ask your teacher to end it and start a new session.");
      return;
    }

    const evidenceAttempts = Array.isArray(session.prior_attempts) ? session.prior_attempts : [];
    const hydratedAnswers = evidenceAttempts.flatMap(attempt => (
      Array.isArray(attempt.questionRecords)
        ? attempt.questionRecords.map(question => ({
            ...question,
            answerEventId: question.answerEventId || "",
            questionId: question.questionId || "",
            skillId: question.skillId || attempt.skillId,
            skill: attempt.skillName,
            stage: attempt.skillName,
            isCorrect: question.isCorrect,
            itemLevel: question.level || attempt.skillLevel,
            itemPhase: question.phase || attempt.skillPhase,
            timestamp: question.timestamp || attempt.completedAt
          }))
        : []
    ));
    answerHistoryRef.current = hydratedAnswers;
    setAnswerHistory(hydratedAnswers);
    appliedStudentFocusSessionRef.current = session.id;
    void startStudentFocusAssessment(skillIndex, {
      verifiedEvidenceSyncStatus: "complete",
      studentFocusSessionId: session.id
    });
  }, [
    sessionMode,
    setAppView,
    studentFocus.connection,
    studentFocus.endAction,
    studentFocus.endedSessionId,
    studentFocus.session,
    studentId,
  ]);

  function keepPracticingSkill(stageIndex) {
    const stage = skillTree[stageIndex] || currentStage;
    debugAssessmentCoverage("Keep Practicing clicked", {
      studentId,
      currentSkill: stage.label
    });
    void startAssessment(stageIndex);
  }

  async function startTargetedReview() {
    if (!ensureTeacherAssessmentEvidenceReady()) return;
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

  // Leaving a check returns to the roster it was started from. There is no
  // second per-student dashboard to go back to any more.
  function returnFromCheck() {
    answerInFlightRef.current = false;
    resetFailedAssessmentMedia();
    setCurrentQuestion(null);
    setFeedback(null);
    setCheckpointDecision(null);
    setDiagnosticFollowUp(false);
    setAppView(APP_VIEWS.TEACHER_CLASSES);
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
    setStudentPreviewStatus("Preview mode is read-only. Activity will not be saved to this student.");
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

  const showSkillsQuestPrototype = typeof window !== "undefined"
    && new URLSearchParams(window.location.search).has("skillsQuest");

  const latestTeacherAccountIsApproved = useEffectEvent(isTeacherAccountApproved);

  useEffect(() => {
    if (shouldOpenDefaultTeacherRoute({
      appView,
      authReady,
      isApproved: latestTeacherAccountIsApproved(),
      profileLoaded,
      profileLoadedTeacherId: profileLoadedTeacherIdRef.current,
      teacherUserId: teacherUser?.id
    })) {
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
    <Suspense fallback={<div className="app"><div className="card page-card">Loading {PRODUCT_NAME}...</div></div>}>
      <ProgressSyncNotice studentId={sessionMode === "student" ? studentSessionId : null} sessionMessage={message.startsWith("Signed out on this iPad.") ? message : ""} />
      <AppSurface
        surface={{
      PASS_SCORE, ROUND_LENGTH, adminClasses, adminConfirm, adminConfirmBusy, adminDeleteClass,
      adminDeleteStudent, adminLoading, adminPendingAccounts, adminPendingAccountsWarning, adminSchools, adminSetTeacherSchool,
      adminStudents, adminTeachers, allQuestions, allowPassageAudio, answerHistory, answerQuestion, appView,
      applyStudentSession, archivedStudentList, assessmentFullscreen, assessmentHistory, assessmentHistoryReadState, assessmentMode, assessmentTransitioning,
      assignQuestPractice, authDisplayName, authEmail, authLoading, authMessage, authMode, awaitingEmailConfirmation,
      resendEmailConfirmation, nudgeTeacherAccountReview, teacherAccountNudgeBusy, pendingAccountAlert,
      startTryMode, endTryMode, trySession,
      authPassword, authReady, authReconnecting, authSchoolName, authUsername,
      checkpointDecision, chunkLoadFailure, classDashboard, classDashboardReadState, classList, classListReadState,
      clearQuestPractice, completePasswordReset, continueCheckpointSkill, correctAnswered, coverageSnapshot, createClass,
      createDemoClass, createStudentForSelectedClass, currentQuestion, currentSkillIndex, currentStage, currentStageQuestions,
      demoTeacherEnabled, diagnosticFollowUp, discardElBenchmarkDraft, discontinueElBenchmarkAssessment, elBenchmarkDraftSaveFailed, elBenchmarkSession,
      endAssessment, entryMode, executeAdminDeleteClass, executeAdminDeleteStudent, exitToTeacherEntry, exportCSVData,
      exportData, exportLetterAssessment, exportPatternAssessment, exportReadingReport, exportStudentAssessmentWorkbook, feedback,
      finishElBenchmarkAssessment, guidedInitialBookId, guidedReadingRecords, handleAssessmentEvidenceImageError,
      isAdmin, isStudentSurfaceView, isTeacherAccountApproved, itemMastery,
      keepPracticingSkill, learnFullscreen, learnerAccessibility, letterAssessment, letterIndex,
      letterItems, loadAdminDashboard, loadClassDashboard, loadClasses, loadStudentProgress, loadStudents, loadingClasses, loadingStudents,
      logInDemoTeacher, logInTeacher, logOutStudent, logOutTeacher, mastery,
      message, moveToNextCheckpointSkill, nameSaved, newClassName, normalizeApprovalStatus,
      openAdminDashboard, openStudentPreview, patternAssessment, patternIndex, patternItems, pickQuestion,
      prefersReducedMotion, profileLoaded, recordLetterResult, recordPatternResult, goToPreviousLetter, goToPreviousPattern, reviseLastAnswer,
      regenerateClassCode, renderLearnFullscreenButton, reportSkillMasterySummary, reportStudentFocusContent, reportsAssessmentHistory, requestPasswordReset, retryAssessmentHistoryHydration, resetLetterAssessment,
      resetPatternAssessment, resetProgressDialogOpen, resetSelectedStudentProgress, resetStudent, resetStudentSymbolPassword, resettingProgress,
      resumeElBenchmarkAssessment, retryCheckpointSkill, retryTeacherSchoolName, returnFromElBenchmarkAssessment, returnFromStudentPreview, returnToStudentHome, returnToTeacherDashboard,
      returnFromCheck, reviewInitialSoundLevelOne, roundAnswers, saveElBenchmarkPartialAndExit, saveGuidedReadingRecord, saveTeacherSchool, selectedClassId,
      saveLetterAssessmentPartialAndExit, savePatternAssessmentPartialAndExit,
      selectedStudentEvidenceReadState, selectedStudentEvidenceReady, sessionMode, setAdminConfirm, setAdminConfirmBusy, setAllowPassageAudio,
      setAppView, setArchivedStudentList, setAuthDisplayName, setAuthEmail, setAuthMode, setAuthPassword,
      setAuthSchoolName, setAuthUsername, setClassDashboard, setCurrentQuestion, setCurrentSkillIndex, setEntryMode,
      setFeedback, setGuidedInitialBookId, setMessage, setNameSaved, setNewClassName, setResetProgressDialogOpen,
      setRoundAnswers, setSelectedClassId, setSessionMode, setStudentAccessibilitySettings, setStudentArcadeOpen, setStudentList,
      setStudentReducedChoiceMode, setStudentReportView, setTeacherGroupId, setTeacherStudentContext,
      shouldShowImage, showConfetti, showSkillsQuestPrototype, signUpTeacher, speakText,
      startAdvancedPhonicsAssessment, startAssessment, startElBenchmarkAssessment, startLetterAssessment, startTargetedReview, studentArcadeOpen,
      studentId, studentList, studentListReadState, studentName, studentPreview, studentPreviewStatus, studentReportView,
      studentFocus, studentFocusCompletedSessionId, studentSession, studentSessionId, switchStudent, teacherAccountRecord, teacherAccountStatus, teacherGroupId,
      teacherId, teacherSchoolName, teacherSchoolNameReadState, teacherUser, toggleAssessmentFullscreen,
      totalAnswered, updateElBenchmarkSession, updateStudentName, updateStudentSymbolPassword, updateTeacherAccountStatus, weaknessSnapshot,
      assignMissingSymbolPasswords
        }}
      />
    </Suspense>
  );
}

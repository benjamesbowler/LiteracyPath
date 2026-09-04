/* eslint-disable react-hooks/exhaustive-deps -- Context values preserve App's original effect contracts during staged controller extraction. */
import { useEffect, useEffectEvent, useLayoutEffect, useRef, useState } from "react";
import { isSupabaseConfigured, supabase } from "../supabaseClient.js";
import { hydrateAssessmentAttempts } from "../data/assessmentHistoryStore.js";
import {
  loadCompatibleDashboardStudents,
  loadCompatibleTeacherClassCounts,
  loadCompatibleTeacherClasses,
  loadCompatibleTeacherStudents
} from "../data/classApiCompatibility.js";
import { TEACHER_COPY } from "../copy/teacherCopy.js";
import {
  deleteRosterStudent,
  normalizeRosterStudentName,
  updateRosterStudentName
} from "../data/teacherRosterOperations.js";
import { selectAllRows } from "../data/pagedSelect.js";
import { setEphemeralNetworkMode } from "../data/boundaries/facade.js";
import { createTeacherSoundSeekersAssignmentUpdate } from "../features/soundSeekers/engine/stateV2.js";
import { setSampleContentScope } from "../policy/freeTierContent.js";
import { beginTryModeSession } from "../policy/tryModeSession.js";
import { LEGAL_POLICY } from "../policy/legalPolicy.js";
import {
  isUnconfirmedEmailError,
  teacherAuthErrorMessage,
  teacherMutationErrorMessage
} from "./teacherErrorMessages.js";
import {
  awaitCurrentAccountAccessStage,
  readOptionalAdminStatus,
  resolveCurrentAdminStatusCheck
} from "./accountAccessCheck.js";
import {
  buildCurrentSkillEvidence,
  buildIncompleteClassDashboardRows,
  countFirstSecureTransitions,
  currentAnswerEvidence,
  incompleteClassDashboardSources,
  verifiedSecureSkillIds
} from "./classDashboardEvidence.js";
import { resolveSequencedRows } from "./sequencedRead.js";
import {
  beginStudentRosterRead,
  completeStudentRosterRead,
  failStudentRosterRead,
  resetStudentRosterRead
} from "./studentRosterReadState.js";
import {
  beginClassListRead,
  completeClassListRead,
  createClassListReadState,
  failClassListRead,
  resetClassListRead
} from "./classListReadState.js";
import {
  beginClassDashboardRead,
  completeClassDashboardRead,
  createClassDashboardReadState,
  failClassDashboardRead,
  resetClassDashboardRead
} from "./classDashboardReadState.js";
import { PRACTICE_RESET_RETAINED_AREAS } from "../utils/progressSync.js";
import { loadTeacherSchoolName } from "../data/teacherSchoolProfile.js";
import { shouldApplyRestoredAppView } from "./appViewHelpers.js";
import { createInternalTeacherUsername } from "./teacherSignupIdentity.js";
import {
  adminPathForSection,
  adminQaExitUrl,
  adminQaHistoryState,
  adminRouteForPath,
  isAdminRoutePath,
  withoutAdminQaHistoryState
} from "./adminQaNavigation.js";

/**
 * Signup input limits, mirrored from the database so a bad value fails on the
 * form with a useful message instead of at the database with a generic one.
 *
 * `TEACHER_PASSWORD_MIN_LENGTH` mirrors `minimum_password_length` in
 * supabase/config.toml. The school bounds mirror `create_school_directory_entry`
 * in 20260728120000_security_integrity_hardening.sql, which raises 22023 outside
 * this range — and that raise aborts the whole auth.users INSERT.
 */
export const TEACHER_PASSWORD_MIN_LENGTH = 8;
export const SCHOOL_NAME_MIN_LENGTH = 2;
export const SCHOOL_NAME_MAX_LENGTH = 120;

const PENDING_ACCOUNT_COLUMNS =
  "id, user_id, email, username, display_name, name, role, status, approval_status, school_id, " +
  "created_at, requested_at, reviewed_at, reviewed_by, approved_at, approved_by, rejected_at, " +
  "rejected_by, rejection_reason, email_confirmed_at, email_confirmation_source, " +
  "nudged_at, nudge_count";

/** Postgres unique_violation — the pending row already exists. */
function isDuplicatePendingAccountError(error) {
  return String(error?.code || "") === "23505";
}

async function settleTeacherRead(source, read, fallback) {
  try {
    return await read();
  } catch (error) {
    console.error(`${source} read rejected:`, error);
    return {
      ...fallback,
      error
    };
  }
}

export function useAppSessionController(context) {
  const {
    accountAccessCheckInFlightRef, accountAccessCheckSeqRef, accountAccessCheckUserIdRef, adminStatusError,
    adminStudents, answerHistory, answerHistoryRef, answerInFlightRef,
    APP_VIEWS, appView, appViewNavigationRevisionRef, assessmentActiveRef, assessmentMode,
    authBootCompletedRef, authDisplayName, authEmail, authPassword,
    authReady, authSchoolName, buildQuestMasteryReport,
    chooseNewestManualAssessmentEntries, clearAndVerifyLocalProgressForStudent, clearLocalElAssessmentDataForStudent,
    clearProgressSyncSession,
    configureProgressSync, correctAnswered, currentSkillIndex,
    elBenchmarkAssessmentHash, elBenchmarkSession, findQuestionForAnswerRecord, freshAuthActionRef,
    freshLoginResetPendingRef, getAdminSetupMessage, getAnswerRecordPromptAnswerSignature, getAnswerRecordSignature,
    getGuidedReadingStorageKeyForSession, migrateGuidedReadingStorage, getItemMasteryStateKey, getPersistedAppView, getQuestionTargetWord,
    getRepeatOptionSetSignature, getRestoredAppView, getRuntimeQuestionSignature, getTeacherProfileStorageKey,
    hydrateCloudProgress, inferAnswerRecordMetadata, inferItemMetadata,
    initialSoundRoundMetaRef, isAdmin, isApprovalSchemaError, isDuplicateAuthSignupError,
    isInvalidRefreshTokenError, isMissingItemMasteryTableError, isSameTeacherRoute, isStudentAllowedView,
    itemMastery, lastAuthUserIdRef, learnerAccessibilityFromProfile,
    letterAssessment, letterIndex, loadElBenchmarkDraft, loadManualAssessmentDrafts,
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
    setAuthMode, setAuthPassword, setAuthReady, awaitingEmailConfirmation, setAwaitingEmailConfirmation, setCheckpointDecision,
    teacherAccountNudgeBusy, setTeacherAccountNudgeBusy,
    trySession, setTrySession,
    setPendingAccountAlert,
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
  } = context;

  const profileStorageKey =
    getTeacherProfileStorageKey(teacherId);

  // An empty class list means "no classes" only once a request has finished.
  // Until then it means "we do not know yet", and the teacher surfaces must say
  // so rather than telling an established teacher to make their first class.
  // Starts true because every approved teacher's session loads classes.
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [classListReadState, setClassListReadState] = useState(
    createClassListReadState
  );
  const [classDashboardReadState, setClassDashboardReadState] = useState(
    createClassDashboardReadState
  );
  const [teacherSchoolNameReadRevision, setTeacherSchoolNameReadRevision] = useState(0);
  const [teacherProfileRouteRevision, setTeacherProfileRouteRevision] = useState(0);
  const [retryableTeacherRoute, setRetryableTeacherRoute] = useState(null);
  const [teacherRouteHydrationRevision, setTeacherRouteHydrationRevision] = useState(0);
  const adminDashboardLoadSequenceRef = useRef(0);
  const authIdentityGenerationRef = useRef(0);
  const classDashboardLoadSequenceRef = useRef(0);
  const classListLoadSequenceRef = useRef(0);
  const controllerMountedRef = useRef(true);
  const profileRestoreSequenceRef = useRef(0);
  const retryableTeacherRouteRef = useRef(null);
  const sessionModeRef = useRef(sessionMode);
  const studentListLoadSequenceRef = useRef(0);
  const studentProgressLoadSequenceRef = useRef(0);
  const teacherRouteHydrationTokensRef = useRef(new Set());
  sessionModeRef.current = sessionMode;

  useEffect(() => {
    controllerMountedRef.current = true;
    const retirePageReads = () => {
      controllerMountedRef.current = false;
      profileRestoreSequenceRef.current += 1;
      adminDashboardLoadSequenceRef.current += 1;
      classDashboardLoadSequenceRef.current += 1;
      classListLoadSequenceRef.current += 1;
      studentListLoadSequenceRef.current += 1;
      studentProgressLoadSequenceRef.current += 1;
      teacherRouteHydrationTokensRef.current.clear();
    };
    window.addEventListener("pagehide", retirePageReads);
    window.addEventListener("beforeunload", retirePageReads);
    return () => {
      retirePageReads();
      window.removeEventListener("pagehide", retirePageReads);
      window.removeEventListener("beforeunload", retirePageReads);
    };
  }, []);

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

  /**
   * Starts the anonymous try-mode.
   *
   * Deliberately NOT applyStudentSession with a fake token. That function
   * configures progress sync and hydrates cloud progress — both network calls,
   * both of which would now throw against the ephemeral boundary, and neither of
   * which should be attempted in the first place. A mode that promises to send
   * nothing should not be making requests and swallowing the refusals.
   *
   * Order matters. Storage is swapped FIRST, because if that fails the session
   * must not begin at all, and the network is closed before any child surface
   * can mount and ask for something.
   *
   * Returns null when the storage swap fails. The caller must show the
   * unavailable screen rather than continue: running the demo against real
   * storage would collect data from a child while the screen promised it
   * would not, which is worse than the demo being unavailable.
   */
  function startTryMode(level = "A") {
    const session = beginTryModeSession({ level });
    if (!session) return null;

    setEphemeralNetworkMode(true);
    // The third boundary, set at the same moment as the other two. Every child
    // surface reads it in one line instead of five layers of prop threading —
    // and a surface that forgot a prop would silently show everything, which is
    // the failure this design exists to remove.
    setSampleContentScope(true);

    setLetterIndex(0);
    setLetterAssessment([]);
    setPatternIndex(0);
    setPatternAssessment([]);
    setPatternAttempt(0);
    setElBenchmarkSession(null);
    setSessionMode("student");
    // A synthetic id so per-child storage keys stay separated within the
    // session. It is random, is never sent anywhere, and dies with the tab, so
    // it cannot identify or re-identify anybody.
    setStudentSessionId(`try-${session.nickname.toLowerCase().replace(/\s+/g, "-")}`);
    setStudentSessionName(session.nickname);
    setSelectedClassId(null);
    setNameSaved(true);
    setAppView(APP_VIEWS.STUDENT_HOME);
    setMessage("");
    setTrySession(session);
    return session;
  }

  /** Ends try-mode: real storage back, network reopened, nothing kept. */
  function endTryMode() {
    try {
      trySession?.end?.();
    } catch (error) {
      console.warn("Could not restore storage after the try session.", error);
    }
    setEphemeralNetworkMode(false);
    setSampleContentScope(false);
    setTrySession(null);
    setSessionMode("teacher");
    setStudentSessionId("");
    setStudentSessionName("");
    setNameSaved(false);
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

  function returnToStudentSelection() {
    try {
      localStorage.removeItem(STUDENT_SESSION_STORAGE_KEY);
    } catch {
      // The in-memory session is still cleared when device storage is unavailable.
    }
    clearProgressSyncSession();
    setStudentSession(null);
    setStudentSessionId(null);
    setStudentSessionName("");
    setNameSaved(false);
    setGuidedReadingRecords({});
    setLetterIndex(0);
    setLetterAssessment([]);
    setPatternIndex(0);
    setPatternAssessment([]);
    setPatternAttempt(0);
    setElBenchmarkSession(null);
    setSessionMode("student");
    setEntryMode("student");
    setMessage("");
    setAppView(APP_VIEWS.STUDENT_LOGIN);
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
      setStudentPreviewStatus("Preview activity was blocked and was not saved to the student's record.");
    }
    window.addEventListener("lp-preview-write-blocked", handlePreviewWriteBlocked);
    return () => window.removeEventListener("lp-preview-write-blocked", handlePreviewWriteBlocked);
  }, [studentPreview]);

  function getGuidedReadingStorageKey(selectedStudentId = studentId) {
    // The device cache gives instant/offline access; queueProgressSave mirrors
    // each record into the student_progress cloud table.
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
      if (key) {
        try {
          localStorage.setItem(key, JSON.stringify(next));
        } catch (error) {
          console.warn("Could not save the guided reading record on this device.", error);
        }
      }
      queueProgressSave("guided_reading", bookId, { v: 1, ...record }, { scopeKey: studentId });
      return next;
    });
  }

  function clearTeacherState() {
    // Student sessions are anonymous to Supabase Auth. A normal SIGNED_OUT or
    // empty teacher-auth bootstrap must never clear the learner identity while
    // leaving sessionMode set to "student"; that combination renders an empty
    // child shell. Student sign-out has its own complete cleanup path.
    if (sessionModeRef.current === "student") return;
    adminDashboardLoadSequenceRef.current += 1;
    classDashboardLoadSequenceRef.current += 1;
    classListLoadSequenceRef.current += 1;
    studentListLoadSequenceRef.current += 1;
    studentProgressLoadSequenceRef.current += 1;
    retryableTeacherRouteRef.current = null;
    setRetryableTeacherRoute(null);
    setStudentSessionName("");
    setStudentSessionId(null);
    setTeacherStudentContext({ studentId: null, studentName: "" });
    setTeacherGroupId("all");
    setStudentList([]);
    setArchivedStudentList([]);
    setStudentListReadState(resetStudentRosterRead());
    setClassList([]);
    setClassListReadState(resetClassListRead());
    setClassDashboardReadState(resetClassDashboardRead());
    setLoadingClasses(false);
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
    setTeacherSchoolName("");
    setTeacherSchoolNameReadState({
      status: "idle",
      teacherId: "",
      schoolId: "",
      error: null
    });
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
    answerHistoryRef.current = [];
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

  function resetSelectedStudentOnLogin({ navigate = true } = {}) {
    setTeacherStudentContext({ studentId: null, studentName: "" });
    setTeacherGroupId("all");
    setNameSaved(false);
    if (navigate) setAppView(APP_VIEWS.SELECT);
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

  function publishRetryableTeacherRoute(nextRoute) {
    retryableTeacherRouteRef.current = nextRoute;
    setRetryableTeacherRoute(nextRoute);
  }

  function hasCurrentRetryableTeacherRoute() {
    const pending = retryableTeacherRouteRef.current;
    return Boolean(
      controllerMountedRef.current
      && pending
      && pending.hash === window.location.hash
      && pending.teacherId === lastAuthUserIdRef.current
      && pending.identityGeneration === authIdentityGenerationRef.current
    );
  }

  function hasCurrentTeacherRouteHydration() {
    return controllerMountedRef.current && [...teacherRouteHydrationTokensRef.current].some(token => (
      token.hash === window.location.hash
      && token.teacherId === lastAuthUserIdRef.current
      && token.identityGeneration === authIdentityGenerationRef.current
    ));
  }

  function scheduleRetryableTeacherRoute(retryStage) {
    const pending = retryableTeacherRouteRef.current;
    if (
      !pending
      || pending.retryStage !== retryStage
      || pending.retrying
      || !hasCurrentRetryableTeacherRoute()
    ) return;

    const retrying = { ...pending, retrying: true };
    publishRetryableTeacherRoute(retrying);
    window.setTimeout(() => {
      if (
        retryableTeacherRouteRef.current !== retrying
        || !hasCurrentRetryableTeacherRoute()
      ) return;
      void hydrateTeacherRouteContext(retrying.route);
    }, 0);
  }

  useEffect(() => {
    let isMounted = true;

    function applyAuthSession(session, event = "") {
      if (!isMounted) return;

      const nextUser = session?.user || null;
      const nextUserId = nextUser?.id || null;
      const previousUserId = lastAuthUserIdRef.current;
      const identityChanged = nextUserId !== previousUserId;
      const isBackgroundSameUserRefresh =
        Boolean(nextUserId && nextUserId === previousUserId && authBootCompletedRef.current);

      if (identityChanged) {
        // Every asynchronous profile, route, roster and report read belongs to
        // the auth identity that started it. Invalidate that whole generation
        // before publishing the next identity so a late teacher-A response
        // cannot repopulate teacher-B's screen.
        authIdentityGenerationRef.current += 1;
        profileRestoreSequenceRef.current += 1;
        teacherRouteHydrationTokensRef.current.clear();
        if (previousUserId || !nextUserId) {
          clearTeacherState();
        }
      }

      if (event === "SIGNED_IN" && nextUserId && freshAuthActionRef.current) {
        freshLoginResetPendingRef.current = true;
        freshAuthActionRef.current = false;
      } else if (!nextUserId || event === "SIGNED_OUT") {
        freshAuthActionRef.current = false;
      }

      if (!nextUserId || event === "SIGNED_OUT") {
        lastAuthUserIdRef.current = null;
        profileLoadedTeacherIdRef.current = null;
        setIsAdmin(false);
        setAdminStatusError(null);
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
        // A new/restored auth identity must hydrate its own route and profile
        // before the generic post-auth Today fallback is allowed to navigate.
        // It must also lose the previous identity's privileged state before
        // any asynchronous access check for this identity can complete.
        setIsAdmin(false);
        setAdminStatusError(null);
        setProfileLoaded(false);
        profileLoadedTeacherIdRef.current = null;
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
      profileLoadedTeacherIdRef.current = null;
      setIsAdmin(false);
      setAdminStatusError(null);
      setTeacherAccountStatus("signed_out");
      setTeacherAccountRecord(null);
      return;
    }

    // Block the post-auth Today fallback until this user's saved route has
    // actually been restored. On a hard reload the previous approved state
    // could otherwise make SELECT look ready for one render, replacing the
    // incoming Classes/Progress hash before restoration had parsed it.
    profileLoadedTeacherIdRef.current = null;
    setProfileLoaded(false);
    refreshTeacherAccountAccess(teacherId);
  }, [teacherId]);

  useEffect(() => {
    if (isAdmin && appView === APP_VIEWS.ADMIN_DASHBOARD) {
      refreshAdminDashboard();
    }
  }, [isAdmin, appView]);

  // Every Admin section uses a real pathname so reloads, bookmarks and shared
  // URLs keep their meaning. Once the signed-in identity is positively
  // confirmed as an app admin, any canonical Admin pathname owns the parent
  // Admin view; otherwise a fresh tab could restore Today and never mount the
  // page that parses it.
  useEffect(() => {
    if (
      !isAdmin
      || sessionMode === "student"
      || typeof window === "undefined"
      || !adminRouteForPath(window.location.pathname)
    ) {
      return;
    }
    if (appView !== APP_VIEWS.ADMIN_DASHBOARD) {
      setAppView(APP_VIEWS.ADMIN_DASHBOARD);
    }
  }, [isAdmin, sessionMode, appView]);

  // Keep an explicit Admin URL through session bootstrap. Startup state
  // changes are not navigation away from that URL. Once access has finished,
  // remove the privileged pathname for a non-admin so the address bar cannot
  // claim that an inaccessible admin page is open.
  useEffect(() => {
    if (
      !teacherId
      || isAdmin
      || sessionMode === "student"
      || ["checking", "signed_out"].includes(teacherAccountStatus)
      || typeof window === "undefined"
      || !isAdminRoutePath(window.location.pathname)
    ) {
      return;
    }
    window.history.replaceState(
      withoutAdminQaHistoryState(window.history.state),
      "",
      adminQaExitUrl(window.location.hash)
    );
  }, [isAdmin, sessionMode, teacherAccountStatus, teacherId]);

  const restoreTeacherProfile = useEffectEvent(async scheduledNavigationRevision => {
    if (!authReady) return;

    const restoreSequence = profileRestoreSequenceRef.current + 1;
    profileRestoreSequenceRef.current = restoreSequence;
    const restoreNavigationRevision = Number.isInteger(scheduledNavigationRevision)
      ? scheduledNavigationRevision
      : appViewNavigationRevisionRef.current;
    const restoreIdentityGeneration = authIdentityGenerationRef.current;
    const restoreTeacherId = teacherId || "";
    const restoreProfileStorageKey = profileStorageKey || "";
    const isRestoreCurrent = () => (
      controllerMountedRef.current
      && profileRestoreSequenceRef.current === restoreSequence
      && authIdentityGenerationRef.current === restoreIdentityGeneration
      && (lastAuthUserIdRef.current || "") === restoreTeacherId
    );
    const applyRestoredAppView = restoredAppView => {
      if (shouldApplyRestoredAppView({
        currentNavigationRevision: appViewNavigationRevisionRef.current,
        restoreNavigationRevision
      })) {
        rawSetAppView(restoredAppView);
      }
    };

    profileLoadedTeacherIdRef.current = null;
    setProfileLoaded(false);

    if (sessionMode === "student") {
      setProfileLoaded(true);
      return;
    }

    if (!restoreTeacherId || !restoreProfileStorageKey) {
      clearTeacherState();
      setProfileLoaded(true);
      return;
    }

    if (teacherAccountStatus === "checking") return;

    if (!isTeacherAccountApproved()) {
      setProfileLoaded(true);
      return;
    }

    // Class availability is a core teacher-shell read, not a route-module
    // concern. Start it before the lazy route helper so a stale/missing route
    // chunk or malformed saved profile cannot leave the dashboard permanently
    // saying that classes are still loading.
    const classLoadPromise = loadClasses();
    const { parse } = await loadTeacherRouteRuntime();
    if (!isRestoreCurrent()) return;
    const teacherRoute = parse(window.location.hash);
    const isFreshLoginRestore = freshLoginResetPendingRef.current;
    // Route hydration reuses this exact read below. Starting another request
    // would make two valid restorations supersede each other and could turn an
    // owned deep link into an artificial empty result.

    const saved = localStorage.getItem(restoreProfileStorageKey);

    if (saved) {
      try {
        const data = JSON.parse(saved);
        const savedClassId = data.selectedClassId || null;
        const restoredClassId = teacherRoute
          ? teacherRoute.classId || null
          : savedClassId;

        if (isFreshLoginRestore) {
          freshLoginResetPendingRef.current = false;
          resetSelectedStudentOnLogin({ navigate: false });
          applyRestoredAppView(APP_VIEWS.SELECT);
          setSelectedClassId(null);
          if (!isAdminRoutePath(window.location.pathname)) {
            window.history.replaceState(
              window.history.state,
              "",
              teacherIntentHash({ appView: APP_VIEWS.SELECT })
            );
          }
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
          if (!isRestoreCurrent()) return;
          profileLoadedTeacherIdRef.current = restoreTeacherId;
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
        const savedManualDrafts = restoredStudentId
          ? loadManualAssessmentDrafts({
              teacherId: restoreTeacherId,
              studentId: restoredStudentId
            })
          : null;
        const useLegacyManualDraft = Boolean(
          restoredStudentId
          && restoredStudentId === savedStudentId
          && !savedManualDrafts?.found
        );
        const legacyElBenchmarkSession =
          restoredStudentId && data.elBenchmarkSession?.studentId === restoredStudentId
            ? data.elBenchmarkSession
            : null;
        let restoredElBenchmarkSession = restoredStudentId
          ? loadElBenchmarkDraft({
              teacherId: restoreTeacherId,
              studentId: restoredStudentId
            }) || legacyElBenchmarkSession
          : null;
        if (legacyElBenchmarkSession && restoredElBenchmarkSession === legacyElBenchmarkSession) {
          saveElBenchmarkDraft({
            teacherId: restoreTeacherId,
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
        // A parsed URL is a current navigation request, not an old saved view.
        // In particular, FINISHED is redirected to the Reports chooser when it
        // comes from legacy profile storage, but a current
        // #teacher/reports/report deep link must remain the standalone report.
        const requestedRestoredAppView = hashRestoredSession
          ? APP_VIEWS.EL_BENCHMARK
          : teacherRoute?.appView || getRestoredAppView({
              restoredStudentId,
              storedAppView: data.appView
            });
        const restoredAppView = requestedRestoredAppView === APP_VIEWS.EL_BENCHMARK && !restoredElBenchmarkSession
          ? APP_VIEWS.ASSESSMENTS
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
        applyRestoredAppView(restoredAppView);
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
        // Formal assessment drafts are stored per student. The profile fields
        // below are only a one-release migration fallback for existing devices;
        // they are accepted solely when the profile's saved student is the
        // student being restored.
        setLetterIndex(savedManualDrafts?.found
          ? savedManualDrafts.letterIndex
          : useLegacyManualDraft ? data.letterIndex || 0 : 0);
        setLetterAssessment(savedManualDrafts?.found
          ? savedManualDrafts.letterAssessment
          : useLegacyManualDraft && Array.isArray(data.letterAssessment) ? data.letterAssessment : []);
        setPatternIndex(savedManualDrafts?.found
          ? savedManualDrafts.patternIndex
          : useLegacyManualDraft ? data.patternIndex || 0 : 0);
        setPatternAssessment(savedManualDrafts?.found
          ? savedManualDrafts.patternAssessment
          : useLegacyManualDraft && Array.isArray(data.patternAssessment) ? data.patternAssessment : []);
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
          await hydrateTeacherRouteContext(teacherRoute, classLoadPromise);
          if (!isRestoreCurrent()) return;
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
            if (!isRestoreCurrent()) return;
            pickQuestion(data.assessmentMode || "mastery", restoredSkillIndex);
          }, 0);
        }
      } catch (error) {
        if (!isRestoreCurrent()) return;
        console.warn("Could not restore saved reading profile.", error);
        localStorage.removeItem(restoreProfileStorageKey);
        loadStudents();
      }
    } else {
      freshLoginResetPendingRef.current = false;
      resetSelectedStudentOnLogin({ navigate: false });
      applyRestoredAppView(APP_VIEWS.SELECT);
      if (isFreshLoginRestore && !isAdminRoutePath(window.location.pathname)) {
        window.history.replaceState(
          window.history.state,
          "",
          teacherIntentHash({ appView: APP_VIEWS.SELECT })
        );
      }
      if (teacherRoute && !isFreshLoginRestore) {
        await hydrateTeacherRouteContext(teacherRoute, classLoadPromise);
        if (!isRestoreCurrent()) return;
      } else {
        loadStudents();
      }
    }

    if (!isRestoreCurrent()) return;
    profileLoadedTeacherIdRef.current = restoreTeacherId;
    setProfileLoaded(true);
  });

  useEffect(() => {
    // Restoration updates several coordinated pieces of React state. Schedule
    // it after the effect has subscribed so those updates do not cascade
    // synchronously inside the effect body.
    const scheduledNavigationRevision = appViewNavigationRevisionRef.current;
    const timeoutId = window.setTimeout(() => {
      void restoreTeacherProfile(scheduledNavigationRevision);
    }, 0);
    return () => {
      window.clearTimeout(timeoutId);
      // Dependency changes and a pre-load Back/Forward navigation both retire
      // the async restoration that belonged to the previous snapshot.
      profileRestoreSequenceRef.current += 1;
    };
  }, [
    authReady,
    teacherId,
    profileStorageKey,
    teacherAccountStatus,
    isAdmin,
    sessionMode,
    setAppView,
    teacherProfileRouteRevision
  ]);

  const restoreTeacherRouteFromHistory = useEffectEvent(async navigationLock => {
    const historyTeacherId = teacherId || "";
    const historyIdentityGeneration = authIdentityGenerationRef.current;
    const historyHash = navigationLock?.hash || window.location.hash;
    try {
      const { parse } = await loadTeacherRouteRuntime();
      if (
        !historyTeacherId
        || !controllerMountedRef.current
        || lastAuthUserIdRef.current !== historyTeacherId
        || authIdentityGenerationRef.current !== historyIdentityGeneration
        || profileLoadedTeacherIdRef.current !== historyTeacherId
        || window.location.hash !== historyHash
      ) return;
      const route = parse(historyHash);
      if (route) await hydrateTeacherRouteContext(route);
    } finally {
      // The hash listener installs this lock synchronously, before the lazily
      // loaded route parser has resolved. Without it, a render of the old
      // class/student can replace the newly entered address in that gap. Once
      // parsing has either handed ownership to a hydration lock or rejected
      // the address, this exact provisional lock is no longer needed.
      if (retryableTeacherRouteRef.current === navigationLock) {
        publishRetryableTeacherRoute(null);
      }
    }
  });

  useEffect(() => {
    if (sessionMode === "student" || !teacherId) return undefined;
    const handleHashChange = () => {
      const navigationLock = {
        hash: window.location.hash,
        identityGeneration: authIdentityGenerationRef.current,
        retryStage: "history",
        retrying: true,
        route: null,
        teacherId
      };
      teacherRouteHydrationTokensRef.current.clear();
      // Publish the new address guard before any state update can render. The
      // previous implementation cleared the old guard and only installed the
      // replacement after a dynamic import, giving URL mirroring one frame in
      // which to put the stale class or learner back into the address bar.
      publishRetryableTeacherRoute(navigationLock);
      if (!profileLoaded || profileLoadedTeacherIdRef.current !== teacherId) {
        // The history event happened while cloud/profile restoration was still
        // awaiting reads. Invalidate that stale work and restart from the URL
        // the teacher actually navigated to.
        profileRestoreSequenceRef.current += 1;
        setTeacherProfileRouteRevision(revision => revision + 1);
        return;
      }
      void restoreTeacherRouteFromHistory(navigationLock);
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [profileLoaded, sessionMode, teacherId]);

  useEffect(() => {
    if (
      !profileLoaded
      || profileLoadedTeacherIdRef.current !== teacherId
      || hasCurrentTeacherRouteHydration()
      || hasCurrentRetryableTeacherRoute()
      || !profileStorageKey
      || sessionMode === "student"
    ) return;

    if (studentId) {
      saveManualAssessmentDrafts({
        teacherId,
        studentId,
        letterIndex,
        letterAssessment,
        patternIndex,
        patternAssessment
      });
    }

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
    profileStorageKey,
    retryableTeacherRoute,
    teacherRouteHydrationRevision
  ]);

  useLayoutEffect(() => {
    // `profileLoaded` can still describe the signed-out render for one commit
    // while a stored auth session is being attached. Never let that stale
    // boolean mirror SELECT as #teacher/dashboard over an incoming deep link.
    if (
      !profileLoaded
      || profileLoadedTeacherIdRef.current !== teacherId
      || hasCurrentTeacherRouteHydration()
      || hasCurrentRetryableTeacherRoute()
      || sessionMode === "student"
      || !teacherId
    ) return;

    const nextHash = appView === APP_VIEWS.EL_BENCHMARK
      ? elBenchmarkAssessmentHash({
          classId: elBenchmarkSession?.classId || selectedClassId,
          learnerId: studentId,
          session: elBenchmarkSession
        })
      : appView === APP_VIEWS.FINISHED
        ? teacherReportHash(selectedClassId, studentId, studentReportView)
      : teacherIntentHash({
          appView,
          classId: selectedClassId,
          groupId: teacherGroupId,
          learnerId: studentId
        });
    if (!nextHash) return;
    // The two funnels keep their remaining steps in the query string. Rewriting
    // the URL whenever anything re-renders would wipe those, and a refresh
    // half-way through choosing a check would land back on step 1 - which is
    // exactly the "convoluted" complaint. Only rewrite when the section or its
    // class/group/student context actually moved.
    if (appView !== APP_VIEWS.FINISHED && isSameTeacherRoute(window.location.hash, nextHash)) return;
    if (window.location.hash !== nextHash) {
      window.history.replaceState(window.history.state, "", nextHash);
    }
  }, [
    appView,
    elBenchmarkSession,
    profileLoaded,
    retryableTeacherRoute,
    selectedClassId,
    sessionMode,
    studentId,
    studentReportView,
    teacherGroupId,
    teacherId,
    teacherRouteHydrationRevision
  ]);

  // Benchmark drafts are stored independently for each learner. A teacher can
  // switch learners or sign out without one child's draft being overwritten by
  // the next profile save; explicit discard/completion/reset removes the key.
  useEffect(() => {
    if (
      !profileLoaded ||
      profileLoadedTeacherIdRef.current !== teacherId ||
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
      return { data: null, error: null };
    }

    return supabase
      .table("app_admins")
      .select("id, user_id, email")
      .eq("user_id", userId)
      .maybeSingle();
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
    return {
      user_id: userId,
      email,
      username,
      display_name: displayName,
      name: displayName || username,
      role: "pending",
      status: "pending",
      approval_status: "pending",
      school_id: overrides.school_id || metadata.school_id || null
    };
  }

  function isTeacherAccountApproved() {
    return isAdmin || teacherAccountStatus === "approved";
  }

  async function fetchTeacherAccountRecord(userId) {
    return supabase
      .table("pending_teacher_accounts")
      .select(PENDING_ACCOUNT_COLUMNS)
      .eq("user_id", userId)
      .maybeSingle();
  }

  /**
   * Create the pending row ONLY when there is not one already.
   *
   * This used to be `.upsert(pendingRecord, { onConflict: "user_id" })`, which
   * also ran as an UPDATE against an existing row. `buildPendingAccountRecord`
   * always produces `school_id: null` — the signup metadata carries
   * `school_name`, not `school_id` — so every run silently wiped the school the
   * signup trigger had just resolved. A null `school_id` makes the account
   * permanently unapprovable: the admin screen disables Approve, and
   * `admin_set_teacher_account_status` raises 22023 'Resolve the teacher
   * account school before approving access.' There is no screen that can put
   * the school back, so the account could only be rescued with hand-written SQL.
   *
   * An INSERT cannot do that. If the row turned up in the meantime — the signup
   * trigger racing this call is the normal case, not the exception — read it
   * rather than write over it.
   */
  async function ensurePendingAccountRecord(userId, pendingRecord) {
    const inserted = await supabase
      .table("pending_teacher_accounts")
      .insert(pendingRecord)
      .select(PENDING_ACCOUNT_COLUMNS)
      .maybeSingle();
    if (!inserted?.error) return inserted;
    if (!isDuplicatePendingAccountError(inserted.error)) return inserted;
    return fetchTeacherAccountRecord(userId);
  }

  async function applyTeacherAccountStatusResult(
    userId,
    email,
    result = {},
    accessCheck = null
  ) {
    const stillCurrent = () => (
      !accessCheck
      || resolveCurrentAdminStatusCheck({
        checkSequence: accessCheck.checkSequence,
        checkedUserId: accessCheck.checkedUserId,
        activeSequence: accountAccessCheckSeqRef.current,
        activeCheckUserId: accountAccessCheckUserIdRef.current,
        authenticatedUserId: lastAuthUserIdRef.current
      }).current
    );
    if (!stillCurrent()) return "stale";

    const { data, error } = result;
    if (error) {
      if (!stillCurrent()) return "stale";
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
      const pendingStage = accessCheck
        ? await awaitCurrentAccountAccessStage({
            checkSequence: accessCheck.checkSequence,
            checkedUserId: accessCheck.checkedUserId,
            read: () => ensurePendingAccountRecord(userId, pendingRecord),
            getActiveIdentity: () => ({
              activeSequence: accountAccessCheckSeqRef.current,
              activeCheckUserId: accountAccessCheckUserIdRef.current,
              authenticatedUserId: lastAuthUserIdRef.current
            })
          })
        : {
            current: true,
            result: await ensurePendingAccountRecord(userId, pendingRecord)
          };
      if (!pendingStage.current) return "stale";
      const {
        data: insertedRecord,
        error: insertError
      } = pendingStage.result || {};
      if (!stillCurrent()) return "stale";

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

    if (!stillCurrent()) return "stale";
    const nextStatus = normalizeApprovalStatus(data);
    setTeacherAccountStatus(nextStatus);
    setTeacherAccountRecord(data);
    return nextStatus;
  }

  async function loadTeacherAccountStatus(
    userId = teacherId,
    email = teacherUser?.email,
    adminAccess = isAdmin,
    accessCheck = null
  ) {
    const stillCurrent = () => (
      !accessCheck
      || resolveCurrentAdminStatusCheck({
        checkSequence: accessCheck.checkSequence,
        checkedUserId: accessCheck.checkedUserId,
        activeSequence: accountAccessCheckSeqRef.current,
        activeCheckUserId: accountAccessCheckUserIdRef.current,
        authenticatedUserId: lastAuthUserIdRef.current
      }).current
    );
    if (!stillCurrent()) return "stale";

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
        const adminProfileStage = accessCheck
          ? await awaitCurrentAccountAccessStage({
              checkSequence: accessCheck.checkSequence,
              checkedUserId: accessCheck.checkedUserId,
              read: () => fetchTeacherAccountRecord(userId),
              getActiveIdentity: () => ({
                activeSequence: accountAccessCheckSeqRef.current,
                activeCheckUserId: accountAccessCheckUserIdRef.current,
                authenticatedUserId: lastAuthUserIdRef.current
              })
            })
          : {
              current: true,
              result: await fetchTeacherAccountRecord(userId)
            };
        if (!adminProfileStage.current) return "stale";
        const { data: adminRecord } = adminProfileStage.result || {};
        adminSchoolId = adminRecord?.school_id || null;
      } catch {
        // School lookup is best-effort; never block admin access on it.
      }
      if (!stillCurrent()) return "stale";
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

    const accountStage = accessCheck
      ? await awaitCurrentAccountAccessStage({
          checkSequence: accessCheck.checkSequence,
          checkedUserId: accessCheck.checkedUserId,
          read: () => fetchTeacherAccountRecord(userId),
          getActiveIdentity: () => ({
            activeSequence: accountAccessCheckSeqRef.current,
            activeCheckUserId: accountAccessCheckUserIdRef.current,
            authenticatedUserId: lastAuthUserIdRef.current
          })
        })
      : {
          current: true,
          result: await fetchTeacherAccountRecord(userId)
        };
    if (!accountStage.current) return "stale";
    return applyTeacherAccountStatusResult(
      userId,
      email,
      accountStage.result,
      accessCheck
    );
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

    const withAccountCheckTimeout = (promise, label) => {
      let timeoutId = null;
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = window.setTimeout(
          () => reject(new Error(`${label} timed out.`)),
          10000
        );
      });
      return Promise.race([
        promise,
        timeoutPromise
      ]).finally(() => {
        if (timeoutId !== null) window.clearTimeout(timeoutId);
      });
    };

    try {
      if (import.meta.env.DEV) {
        console.debug("Account access check started.", { userId, checkSeq });
      }
      const [adminResult, accountResult] = await Promise.all([
        readOptionalAdminStatus(() =>
          withAccountCheckTimeout(checkAdminStatus(userId), "Admin status check")
        ),
        withAccountCheckTimeout(fetchTeacherAccountRecord(userId), "Teacher account status check")
      ]);
      const adminCheck = resolveCurrentAdminStatusCheck({
        checkSequence: checkSeq,
        checkedUserId: userId,
        activeSequence: accountAccessCheckSeqRef.current,
        activeCheckUserId: accountAccessCheckUserIdRef.current,
        authenticatedUserId: lastAuthUserIdRef.current,
        data: adminResult?.data,
        error: adminResult?.error
      });
      if (!adminCheck.current) return;

      if (adminCheck.error) {
        logAdminSupabaseError("Admin status check failed.", adminCheck.error, {
          table: "app_admins",
          userId,
          userEmail: teacherUser?.email
        });
        setAdminStatusError({ table: "app_admins", error: adminCheck.error });
        setIsAdmin(false);
      } else {
        setAdminStatusError(null);
        setIsAdmin(adminCheck.isAdmin);
        // Load the waiting count the moment we know this is an administrator,
        // not when they happen to open the dashboard. Nothing else in this
        // application will ever tell them a teacher is waiting — there is no
        // mail, no webhook and no realtime subscription anywhere in it — so a
        // queue that only announces itself on the screen nobody visits is the
        // same as no queue at all. Fire and forget: a failure here must never
        // delay or block sign-in.
        if (adminCheck.isAdmin) void loadPendingAccountAlert();
      }

      const accessCheck = {
        checkSequence: checkSeq,
        checkedUserId: userId
      };
      const accountPublicationStage = await awaitCurrentAccountAccessStage({
        checkSequence: checkSeq,
        checkedUserId: userId,
        read: () => adminCheck.isAdmin
          ? loadTeacherAccountStatus(
              userId,
              teacherUser?.email,
              true,
              accessCheck
            )
          : applyTeacherAccountStatusResult(
              userId,
              teacherUser?.email,
              accountResult,
              accessCheck
            ),
        getActiveIdentity: () => ({
          activeSequence: accountAccessCheckSeqRef.current,
          activeCheckUserId: accountAccessCheckUserIdRef.current,
          authenticatedUserId: lastAuthUserIdRef.current
        })
      });
      if (!accountPublicationStage.current) return;
      if (import.meta.env.DEV) {
        console.debug("Account access check completed.", { userId, checkSeq });
      }
    } catch (error) {
      const failedCheckIsCurrent = resolveCurrentAdminStatusCheck({
        checkSequence: checkSeq,
        checkedUserId: userId,
        activeSequence: accountAccessCheckSeqRef.current,
        activeCheckUserId: accountAccessCheckUserIdRef.current,
        authenticatedUserId: lastAuthUserIdRef.current
      }).current;
      if (!failedCheckIsCurrent) return;

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
    const loadSequence = ++adminDashboardLoadSequenceRef.current;

    if (!isAdmin) {
      setAdminLoading(false);
      setMessage("You are signed in, but this account is not authorized as an app admin.");
      return { ok: false, reason: "admin_required" };
    }

    setAdminLoading(true);

    const [classesResult, studentsResult, answersResult, pendingAccountsResult, schoolsResult] = await Promise.all([
      selectAllRows(() =>
        supabase.table("classes").select("id, name, teacher_id, school_id, created_at").order("created_at", { ascending: false })
      ),
      selectAllRows(() =>
        supabase.table("students").select("id, name, class_id, teacher_id, symbol_password, created_at").order("created_at", { ascending: false })
      ),
      selectAllRows(() =>
        supabase.table("answers").select("teacher_id")
      ),
      selectAllRows(() => supabase
        .table("pending_teacher_accounts")
        .select(PENDING_ACCOUNT_COLUMNS)
        .order("created_at", { ascending: false })
      ),
      selectAllRows(() =>
        supabase.table("schools").select("id, name, created_at").order("name", { ascending: true })
      )
    ]);

    if (loadSequence !== adminDashboardLoadSequenceRef.current) {
      return { ok: false, stale: true };
    }

    setAdminLoading(false);

    const completeReadError = (result, label) => (
      result.error || (result.truncated
        ? new Error(`${label} reached the configured complete-read ceiling.`)
        : null)
    );
    const pendingAccountsError = completeReadError(
      pendingAccountsResult,
      "Pending teacher accounts"
    );
    const schoolsError = completeReadError(schoolsResult, "Schools");
    const dashboardErrors = [
      {
        table: "classes",
        error: completeReadError(classesResult, "Classes"),
        truncated: classesResult.truncated
      },
      {
        table: "students",
        error: completeReadError(studentsResult, "Students"),
        truncated: studentsResult.truncated
      },
      {
        table: "answers",
        error: completeReadError(answersResult, "Answers"),
        truncated: answersResult.truncated
      }
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
      setMessage(firstError.truncated
        ? "The admin totals are larger than this page can verify safely. No partial totals are being shown."
        : getAdminSetupMessage(firstError.error, firstError.table));
      return;
    }

    if (schoolsError) {
      logAdminSupabaseError("Admin schools load failed.", schoolsError, {
        table: "schools",
        userId: teacherId,
        userEmail: teacherUser?.email
      });
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
    if (!schoolsError) setAdminSchools(schoolsResult.data || []);
    if (!pendingAccountsError) setAdminPendingAccounts(pendingAccountsResult.data || []);
    setAdminPendingAccountsWarning([
      pendingAccountsError
        ? "Pending teacher accounts could not be loaded. The previous list has been kept."
        : "",
      schoolsError
        ? "Schools could not be loaded. The previous list has been kept."
        : ""
    ].filter(Boolean).join(" "));
    return { ok: true };
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

    if (typeof window !== "undefined") {
      const overviewPath = adminPathForSection("overview");
      if (window.location.pathname !== overviewPath) {
        const nextState = adminQaHistoryState(
          withoutAdminQaHistoryState(window.history.state),
          "overview"
        );
        window.history.pushState(nextState, "", overviewPath);
        // pushState does not emit popstate. Dispatch one so an already-mounted
        // Admin page (including Reported questions) updates immediately.
        window.dispatchEvent(
          typeof PopStateEvent === "function"
            ? new PopStateEvent("popstate", { state: nextState })
            : new Event("popstate")
        );
      }
    }
    setAppView(APP_VIEWS.ADMIN_DASHBOARD);
    loadAdminDashboard();
  }

  function adminDeleteStudent(selectedStudentId, selectedStudentName = "this student") {
    if (!isAdmin || !selectedStudentId) return;
    setAdminConfirm({ kind: "student", id: selectedStudentId, name: selectedStudentName });
  }

  async function executeAdminDeleteStudent(selectedStudentId, selectedStudentName = "this student") {
    if (!isAdmin || !selectedStudentId) return false;

    const studentOwnerId = adminStudents.find(row => row.id === selectedStudentId)?.teacher_id || "";
    try {
      await deleteRosterStudent({
        supabase,
        studentId: selectedStudentId,
        studentName: selectedStudentName,
        accountId: studentOwnerId || teacherId,
        cleanup: async () => {
          const progressCleanup =
            await clearAndVerifyLocalProgressForStudent(selectedStudentId);
          const evidenceCleanup = await clearLocalElAssessmentDataForStudent({
            teacherId: studentOwnerId || teacherId,
            studentId: selectedStudentId,
            studentName: selectedStudentName
          });
          return { progressCleanup, evidenceCleanup };
        }
      });
    } catch (error) {
      console.error("Admin verified learner deletion failed:", error);
      setMessage(error?.databaseDeleted
        ? `Deleted ${selectedStudentName} from the cloud, but this browser has not finished clearing its cached copy. Try the deletion again to finish the open privacy request.`
        : "Could not delete the student through the verified privacy workflow. Nothing was changed.");
      return false;
    }

    await loadAdminDashboard();
    setMessage(`Deleted ${selectedStudentName}.`);
    return true;
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
    if (!isAdmin || !classId) return false;

    const { data: students, error: lookupError } = await supabase
      .table("students")
      .select("id, name, teacher_id")
      .eq("class_id", classId);

    if (lookupError) {
      console.error("Admin class student lookup error:", lookupError);
      setMessage("Could not delete class from admin dashboard.");
      return false;
    }

    if (students?.length) {
      setMessage(`Could not delete ${className}. Delete or transfer each student through the verified privacy workflow first; their records were not changed.`);
      return false;
    }

    const { data, error } = await supabase.call("teacher_delete_empty_class", {
      p_class_id: classId
    });
    if (error || data?.ok !== true) {
      console.error("Admin delete empty class error:", error || data);
      setMessage(`Could not delete ${className}. Nothing was changed.`);
      return false;
    }

    await loadAdminDashboard();
    setMessage(`Deleted ${className}.`);
    return true;
  }

  async function updateTeacherAccountStatus(accountId, status, reason = "") {
    if (!isAdmin || !accountId) {
      return {
        ok: false,
        errorMessage: "This account decision is not available."
      };
    }

    const normalizedStatus = String(status || "").trim().toLowerCase();
    const normalizedReason = String(reason || "").trim();

    const { data, error } = await supabase.call(
      "admin_set_teacher_account_status",
      {
        p_account_id: accountId,
        p_status: normalizedStatus,
        p_rejection_reason: normalizedStatus === "approved"
          ? null
          : normalizedReason
      }
    );

    if (error) {
      console.error("Teacher account status update failed.", error);
      setMessage("Could not update teacher account status.");
      return {
        ok: false,
        errorMessage: "The decision was not saved. Check the account and try again."
      };
    }

    const updatedAccount = Array.isArray(data) ? data[0] : data;
    if (!updatedAccount?.id) {
      console.error("Teacher account status update returned no account row.");
      setMessage("Could not confirm that teacher account change. Reload and try again.");
      return {
        ok: false,
        errorMessage: "The change could not be confirmed. Reload the requests and try again."
      };
    }

    setAdminPendingAccounts(previousAccounts =>
      previousAccounts.map(account =>
        account.id === accountId
          ? { ...account, ...updatedAccount }
          : account
      )
    );
    setMessage(`Teacher account ${normalizedStatus}.`);
    // Keep the app-wide banner honest. Without this it would still claim three
    // teachers are waiting immediately after you approved one of them, and a
    // notice that is wrong about its own count stops being read.
    void loadPendingAccountAlert();
    return {
      ok: true,
      account: updatedAccount
    };
  }

  async function signUpTeacher(legalAcceptance = {}) {
    const email = authEmail.trim();
    const displayName = authDisplayName.trim();
    const schoolName = authSchoolName.trim();
    if (!email || !authPassword) {
      setAuthMessage("Enter an email and password.");
      return;
    }
    if (
      legalAcceptance.accepted !== true
      || legalAcceptance.termsVersion !== LEGAL_POLICY.termsVersion
      || legalAcceptance.privacyVersion !== LEGAL_POLICY.privacyVersion
    ) {
      setAuthMessage("Agree to the Terms of Use and acknowledge the Privacy Notice to continue.");
      return;
    }
    // Matches Supabase's own minimum. Without this the app submits, GoTrue
    // refuses, and the teacher is told to "choose a stronger password" with no
    // idea what would count as stronger.
    if (authPassword.length < TEACHER_PASSWORD_MIN_LENGTH) {
      setAuthMessage(`Use a password of at least ${TEACHER_PASSWORD_MIN_LENGTH} characters.`);
      return;
    }
    if (!schoolName) {
      setAuthMessage("Enter your school.");
      return;
    }
    // `create_school_directory_entry` raises on a name outside 2-120 characters,
    // and that raise aborts the auth.users INSERT — so no account is created at
    // all, the teacher sees only the generic "we couldn't submit" message, and
    // retrying with the same input fails forever. Catch it here, where we can
    // say what is actually wrong.
    if (schoolName.length < SCHOOL_NAME_MIN_LENGTH || schoolName.length > SCHOOL_NAME_MAX_LENGTH) {
      setAuthMessage(
        `Enter a school name between ${SCHOOL_NAME_MIN_LENGTH} and ${SCHOOL_NAME_MAX_LENGTH} characters.`
      );
      return;
    }
    setAuthLoading(true);
    setAuthMessage("");
    freshAuthActionRef.current = true;

    const visibleDisplayName = displayName || email.split("@")[0] || "Teacher";
    const requestSignup = username => supabase.auth.signUp({
      email,
      password: authPassword,
      options: {
        data: {
          account_status: "pending",
          username,
          display_name: visibleDisplayName,
          school_name: schoolName,
          legal_terms_accepted: true,
          legal_terms_version: legalAcceptance.termsVersion,
          privacy_notice_version: legalAcceptance.privacyVersion
        }
      }
    });
    let username = createInternalTeacherUsername(email);
    let { data, error } = await requestSignup(username);

    // The internal handle is deliberately invisible to teachers. A very rare
    // collision therefore retries with a fresh suffix instead of asking them
    // to invent and remember a second identity that is not used for sign-in.
    if (/username_unavailable/i.test(error?.message || "")) {
      username = createInternalTeacherUsername(email);
      ({ data, error } = await requestSignup(username));
    }

    setAuthLoading(false);

    if (error) {
      freshAuthActionRef.current = false;
      console.error("Teacher account request failed.", error);
      setAuthMessage(
        /username_unavailable/i.test(error?.message || "")
          ? "We couldn't create a unique internal account record. Please submit the request again."
          : isDuplicateAuthSignupError(error)
          ? "This email already has an account request or account. Please wait for approval or contact an administrator."
          : teacherAuthErrorMessage(error, "signup")
      );
      return;
    }

    if (isDuplicateAuthSignupError(null, data)) {
      freshAuthActionRef.current = false;
      setAuthMessage("This email already has an account request or account. Please wait for approval or contact an administrator.");
      return;
    }

    const newUserId = data?.user?.id;

    // With email confirmation on, signUp returns a user but NO session — the
    // browser is not authenticated, so reading the pending row would fail on
    // row-level security. Nothing more to do here: the address has to be proved
    // before this account is anyone's problem.
    if (!data?.session) {
      setAuthPassword("");
      setAwaitingEmailConfirmation(email);
      setAuthMessage(
        `Check ${email} and click the link to confirm your address. `
        + "Your request reaches an administrator once you have."
      );
      return;
    }

    if (newUserId) {
      // READ, never write. The `create_pending_teacher_account_for_new_user`
      // trigger has already created this row, with the school resolved through
      // `create_school_directory_entry`. This code used to upsert its own
      // version over the top, and that version always carried school_id: null,
      // which wiped the resolved school and left the account unapprovable with
      // no in-app way back. The trigger owns this row; the client only reads it.
      const { data: pendingAccount, error: readError } =
        await fetchTeacherAccountRecord(newUserId);

      if (readError) {
        console.warn("Could not read the pending teacher request after signup. The trigger creates it; this read is only for display.", readError);
      }

      // Falling back to a locally-built record keeps the waiting screen
      // populated if the read races the trigger. It is display-only and is
      // never written anywhere.
      const nextRecord = pendingAccount || buildPendingAccountRecord(newUserId, email, {
        username,
        display_name: visibleDisplayName
      });
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
      console.error("Teacher sign-in failed.", error);
      // An unconfirmed address is not a failed sign-in, it is an unfinished
      // one. Surfacing the resend button here matters more than anywhere else:
      // this is where someone lands weeks later having lost the original email,
      // and without it the only route back is asking an administrator.
      if (isUnconfirmedEmailError(error)) {
        setAwaitingEmailConfirmation(email);
      }
      setAuthMessage(teacherAuthErrorMessage(error, "login"));
      return;
    }

    setAuthPassword("");
    setAuthMessage("");
    setAwaitingEmailConfirmation("");
  }

  /**
   * Sends the confirmation link again. Supabase rate-limits this itself, and
   * that refusal is reported plainly rather than as a failure — "wait a minute"
   * and "it is broken" call for very different reactions from the person
   * reading it.
   */
  async function resendEmailConfirmation() {
    const email = String(awaitingEmailConfirmation || authEmail || "").trim();
    if (!email) return;

    setAuthLoading(true);
    const { error } = await supabase.auth.resend({ type: "signup", email });
    setAuthLoading(false);

    if (error) {
      console.error("Could not resend the confirmation email.", error);
      setAuthMessage(teacherAuthErrorMessage(error, "login"));
      return;
    }
    setAuthMessage(`Confirmation link sent again to ${email}. It can take a minute to arrive.`);
  }

  /**
   * A count, not a dashboard. Reads only the columns the banner needs, from
   * pending rows only, so it is cheap enough to run on every admin sign-in —
   * unlike loadAdminDashboard, which pages the entire table and filters in
   * JavaScript.
   *
   * Never throws and never surfaces an error. It exists to make a queue
   * visible; if it fails, the administrator is exactly where they were before
   * it existed, and an error banner about a notification would be worse than
   * silence.
   */
  async function loadPendingAccountAlert() {
    try {
      const { data, error } = await supabase
        .table("pending_teacher_accounts")
        .select("id, requested_at, created_at, nudged_at, school_id, approval_status, status")
        .eq("approval_status", "pending");
      if (error || !Array.isArray(data)) return;

      const oldest = data.reduce((earliest, row) => {
        const at = new Date(row.requested_at || row.created_at || 0).getTime();
        return Number.isFinite(at) && at > 0 && (earliest === null || at < earliest) ? at : earliest;
      }, null);

      setPendingAccountAlert({
        waiting: data.length,
        asked: data.filter(row => row.nudged_at).length,
        // Blocked accounts are counted in `waiting` like any other, so without
        // this the banner would send someone to a queue where every Approve
        // button is disabled and nothing says why.
        blocked: data.filter(row => !row.school_id).length,
        oldestRequestedAt: oldest ? new Date(oldest).toISOString() : ""
      });
    } catch (error) {
      console.warn("Could not read the teacher request count.", error);
    }
  }

  /**
   * The waiting teacher raises their hand.
   *
   * There is no mail in this application, so an administrator learns a request
   * exists only by remembering to open the dashboard. This is the half of the
   * fix the person actually affected can perform: it stamps their own row, and
   * the review queue sorts nudged requests to the top and shows how many times
   * they have asked. A rising count on an old request is the clearest signal in
   * the queue that somebody has been left waiting.
   *
   * Writes the applicant's OWN row through the existing row-level security
   * policy — no privileged function, and the audit trigger still refuses any
   * attempt to touch a decision column from here.
   */
  async function nudgeTeacherAccountReview() {
    const accountId = teacherAccountRecord?.id;
    if (!accountId || teacherAccountNudgeBusy) return;

    setTeacherAccountNudgeBusy(true);
    const nudgedAt = new Date().toISOString();
    const { data, error } = await supabase
      .table("pending_teacher_accounts")
      .update({
        nudged_at: nudgedAt,
        nudge_count: Number(teacherAccountRecord?.nudge_count || 0) + 1
      })
      .eq("id", accountId)
      .select(PENDING_ACCOUNT_COLUMNS)
      .maybeSingle();
    setTeacherAccountNudgeBusy(false);

    if (error) {
      console.warn("Could not flag the account request as waiting.", error);
      // Deliberately not surfaced as a failure. Nothing the teacher can do
      // about it, and "we could not tell them" on top of "you are still
      // waiting" is a worse screen than simply staying quiet.
      return;
    }
    if (data) setTeacherAccountRecord(data);
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
      console.error("Demo teacher sign-in failed.", error);
      setAuthMessage(teacherAuthErrorMessage(error, "demo_login"));
      return;
    }
    setAuthPassword("");
    setAuthMessage("");
  }

  useEffect(() => {
    let cancelled = false;
    const readTeacherId = String(teacherId || "");
    const accountTeacherId = String(teacherAccountRecord?.user_id || "");
    const accountReady = (
      teacherAccountStatus === "approved"
      && accountTeacherId === readTeacherId
    );
    const schoolId = accountReady
      ? String(teacherAccountRecord?.school_id || "")
      : "";

    setTeacherSchoolName("");

    if (!readTeacherId) {
      setTeacherSchoolNameReadState({
        status: "idle",
        teacherId: "",
        schoolId: "",
        error: null
      });
      return undefined;
    }

    if (!accountReady) {
      setTeacherSchoolNameReadState({
        status: "loading",
        teacherId: readTeacherId,
        schoolId: "",
        error: null
      });
      return undefined;
    }

    if (!schoolId) {
      setTeacherSchoolNameReadState({
        status: "complete",
        teacherId: readTeacherId,
        schoolId: "",
        error: null
      });
      return undefined;
    }

    setTeacherSchoolNameReadState({
      status: "loading",
      teacherId: readTeacherId,
      schoolId,
      error: null
    });

    void loadTeacherSchoolName({
      client: supabase,
      schoolId
    }).then(result => {
      if (cancelled) return;
      if (result.error) {
        console.error("Teacher school name load failed.", result.error);
        setTeacherSchoolNameReadState({
          status: "error",
          teacherId: readTeacherId,
          schoolId,
          error: result.error
        });
        return;
      }
      setTeacherSchoolName(result.data);
      setTeacherSchoolNameReadState({
        status: "complete",
        teacherId: readTeacherId,
        schoolId,
        error: null
      });
    });

    return () => {
      cancelled = true;
    };
  }, [
    teacherAccountRecord?.school_id,
    teacherAccountRecord?.user_id,
    teacherAccountStatus,
    teacherId,
    teacherSchoolNameReadRevision
  ]);

  function retryTeacherSchoolName() {
    setTeacherSchoolNameReadRevision(revision => revision + 1);
  }

  async function saveTeacherSchool(overrideName) {
    const schoolName = (typeof overrideName === "string" ? overrideName : authSchoolName).trim();
    if (!teacherId || !schoolName) {
      setAuthMessage("Enter your school.");
      return false;
    }

    setAuthLoading(true);
    try {
      // Security-definer RPC: persists the school on the teacher's account row
      // (RLS blocks direct updates once approved) and stamps all their classes.
      const { data: savedRows, error } = await supabase.call(
        "teacher_set_school",
        { p_school_name: schoolName }
      );
      const saved = savedRows?.[0] || null;

      if (error || !saved?.school_id) {
        console.error("Save school failed:", error);
        const safeMessage = teacherMutationErrorMessage(error, "save_school");
        setAuthMessage(safeMessage);
        setMessage(safeMessage);
        return false;
      }

      setTeacherAccountRecord(previous => ({ ...(previous || teacherAccountRecord || {}), school_id: saved.school_id }));
      setTeacherSchoolName(saved.school_name || schoolName);
      setTeacherSchoolNameReadState({
        status: "complete",
        teacherId: String(teacherId),
        schoolId: String(saved.school_id),
        error: null
      });
      setAuthMessage("");
      setMessage(`School saved: ${saved.school_name || schoolName}`);
      try {
        await loadClasses();
      } catch (refreshError) {
        console.error("Refresh after school save failed:", refreshError);
        setMessage(`School saved: ${saved.school_name || schoolName}. Reload the page if your classes do not update yet.`);
      }
      return true;
    } catch (error) {
      console.error("Save school failed:", error);
      const safeMessage = teacherMutationErrorMessage(error, "save_school");
      setAuthMessage(safeMessage);
      setMessage(safeMessage);
      return false;
    } finally {
      setAuthLoading(false);
    }
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
      console.error("Teacher password reset email failed.", error);
      setAuthMessage(teacherAuthErrorMessage(error, "password_reset_email"));
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
      console.error("Teacher password update failed.", error);
      setAuthMessage(teacherAuthErrorMessage(error, "password_update"));
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
    setAuthMessage("Signed out.");
  }

  async function loadClasses() {
    const loadSequence = ++classListLoadSequenceRef.current;
    const loadTeacherId = teacherId || "";
    const loadIdentityGeneration = authIdentityGenerationRef.current;
    const isCurrentLoad = () => (
      controllerMountedRef.current
      && loadSequence === classListLoadSequenceRef.current
      && authIdentityGenerationRef.current === loadIdentityGeneration
      && lastAuthUserIdRef.current === loadTeacherId
    );

    if (!loadTeacherId) {
      setClassList([]);
      setLoadingClasses(false);
      setClassListReadState(resetClassListRead());
      return [];
    }

    setLoadingClasses(true);
    setClassListReadState(previous => beginClassListRead(previous, loadTeacherId));

    let result;
    let countResult;
    try {
      [result, countResult] = await Promise.all([
        loadCompatibleTeacherClasses({
          client: supabase,
          teacherId: loadTeacherId
        }),
        loadCompatibleTeacherClassCounts({
          client: supabase,
          teacherId: loadTeacherId
        })
      ]);
    } catch (error) {
      if (!isCurrentLoad()) return null;
      console.error("Load classes error:", error);
      setMessage(TEACHER_COPY.errors.classesLoad);
      setLoadingClasses(false);
      setClassListReadState(previous => failClassListRead(previous, loadTeacherId, "error"));
      return null;
    }
    const { data, error, truncated, compatibility } = result;

    const completedRead = resolveSequencedRows({
      sequence: loadSequence,
      currentSequence: classListLoadSequenceRef.current,
      data
    });
    // A superseded reader must not commit UI state, but its successfully read
    // rows remain truthful for the caller's ownership check. Returning []
    // here made an owned route indistinguishable from a denied route.
    if (!completedRead.current || !isCurrentLoad()) {
      return error || truncated || !completedRead.valid
        ? null
        : completedRead.rows;
    }

    if (error || truncated || !completedRead.valid) {
      console.error("Load classes error:", error || new Error("The class list read was incomplete."));
      setMessage(TEACHER_COPY.errors.classesLoad);
      setLoadingClasses(false);
      setClassListReadState(previous => failClassListRead(
        previous,
        loadTeacherId,
        truncated ? "truncated" : "error"
      ));
      return null;
    }

    if (compatibility === "legacy") {
      console.info("Classes loaded through the rolling-release schema boundary.");
    }
    const studentCounts = new Map();
    const countsVerified = !countResult?.error && !countResult?.truncated && Array.isArray(countResult?.data);
    if (countsVerified) {
      for (const classRow of completedRead.rows) studentCounts.set(classRow.id, 0);
      for (const student of countResult.data) {
        if (!student?.class_id) continue;
        studentCounts.set(student.class_id, (studentCounts.get(student.class_id) || 0) + 1);
      }
    }
    setClassList(completedRead.rows.map(row => ({
      ...row,
      studentCount: countsVerified ? (studentCounts.get(row.id) || 0) : null
    })));
    setLoadingClasses(false);
    setClassListReadState(previous => completeClassListRead(previous, loadTeacherId));
    scheduleRetryableTeacherRoute("classes");
    return completedRead.rows;
  }

  async function regenerateClassCode(classId = selectedClassId) {
    if (!classId) return { ok: false, error: "missing-class" };
    const { data, error } = await supabase.call("teacher_regenerate_class_code", { p_class_id: classId });
    const regeneratedCode = String(data?.access_code || "").trim();
    if (error || !data?.ok || !/^[A-Z0-9]{6}$/.test(regeneratedCode)) {
      const regenerationError = error || data?.error || "invalid-class-code-response";
      console.error("Regenerate class code error:", regenerationError);
      setMessage("Could not make a new class code.");
      return { ok: false, error: regenerationError };
    }
    const refreshedClasses = await loadClasses();
    return {
      ok: true,
      accessCode: regeneratedCode,
      refreshComplete: Array.isArray(refreshedClasses)
    };
  }

  async function createClass() {
    const clean = String(newClassName || "").trim().replace(/\s+/g, " ");
    if (!clean) return false;
    if (clean.length > 120) {
      setMessage("Class names must be 120 characters or fewer.");
      return false;
    }

    if (!teacherId) {
      setMessage("Please sign in first.");
      return false;
    }

    let createdClass;
    try {
      const { data, error } = await supabase
        .table("classes")
        .insert({ name: clean, teacher_id: teacherId, school_id: teacherAccountRecord?.school_id || null })
        .select()
        .single();

      if (error || !data?.id) {
        console.error("Create class error:", error);
        setMessage("We couldn't create that class. Nothing is lost — try again.");
        return false;
      }
      createdClass = data;
    } catch (error) {
      console.error("Create class error:", error);
      setMessage("We couldn't create that class. Nothing is lost — try again.");
      return false;
    }

    setNewClassName("");
    // The selected class changes immediately, so its result rows must change in
    // the same turn. Keeping the previous class dashboard until the first
    // network response made those learners briefly actionable under the new
    // class heading.
    setClassDashboard([]);
    setClassDashboardReadState(resetClassDashboardRead());
    setSelectedClassId(createdClass.id);
    try {
      const [classesResult, studentsResult, dashboardResult] = await Promise.all([
        loadClasses(),
        loadStudents(createdClass.id),
        loadClassDashboard(createdClass.id)
      ]);
      setMessage(
        Array.isArray(classesResult)
          && Array.isArray(studentsResult)
          && dashboardResult?.ok === true
          ? `Class created: ${clean}`
          : `${clean} was created. The latest class details could not reload, so use the retry shown on this page before creating it again.`
      );
    } catch (error) {
      console.error("Refresh after class creation error:", error);
      setMessage(`${clean} was created. The latest class details could not reload, so use the retry shown on this page before creating it again.`);
    }
    return true;
  }

  async function createDemoClass() {
    if (!teacherId) {
      setMessage("Please sign in first.");
      return false;
    }

    const { data, error } = await supabase.call("teacher_create_demo_class");
    const classId = data?.class_id;
    if (error || !classId) {
      console.error("Create demo class error:", error || data);
      setMessage("We couldn't create the sample class. Nothing is lost — try again.");
      return false;
    }

    setClassDashboard([]);
    setClassDashboardReadState(resetClassDashboardRead());
    setSelectedClassId(classId);
    setTeacherGroupId("all");
    setTeacherStudentContext({ studentId: null, studentName: "" });
    setNameSaved(false);
    let refreshIncomplete;
    try {
      const [classesResult, studentsResult, dashboardResult] = await Promise.all([
        loadClasses(),
        loadStudents(classId),
        loadClassDashboard(classId)
      ]);
      refreshIncomplete = !Array.isArray(classesResult)
        || !Array.isArray(studentsResult)
        || dashboardResult?.ok !== true;
    } catch (refreshError) {
      console.error("Refresh after sample class creation failed:", refreshError);
      refreshIncomplete = true;
    }
    setMessage(refreshIncomplete
      ? "Sample class created. The latest class details could not reload, so use the retry shown on this page before adding anything else."
      : "Sample class created. It has sign-in pictures but no saved assessment results.");
    return true;
  }

  async function loadStudents(classId = selectedClassId) {
    const loadSequence = ++studentListLoadSequenceRef.current;
    const loadTeacherId = teacherId || "";
    const loadIdentityGeneration = authIdentityGenerationRef.current;
    const isCurrentLoad = () => (
      controllerMountedRef.current
      && loadSequence === studentListLoadSequenceRef.current
      && authIdentityGenerationRef.current === loadIdentityGeneration
      && lastAuthUserIdRef.current === loadTeacherId
    );

    if (!loadTeacherId || !classId) {
      setStudentList([]);
      setArchivedStudentList([]);
      setLoadingStudents(false);
      setStudentListReadState(resetStudentRosterRead());
      return [];
    }

    setLoadingStudents(true);
    setStudentListReadState(previous => beginStudentRosterRead(previous, classId));

    let result;
    try {
      result = await loadCompatibleTeacherStudents({
        client: supabase,
        teacherId: loadTeacherId,
        classId
      });
    } catch (error) {
      if (!isCurrentLoad()) return null;
      console.error("Load students error:", error);
      setMessage(TEACHER_COPY.errors.childrenLoad);
      setLoadingStudents(false);
      setStudentListReadState(previous => failStudentRosterRead(
        previous,
        classId,
        "unavailable"
      ));
      return null;
    }
    const { data, error, truncated } = result;

    const completedRead = resolveSequencedRows({
      sequence: loadSequence,
      currentSequence: studentListLoadSequenceRef.current,
      data
    });
    if (!completedRead.current || !isCurrentLoad()) {
      return error || truncated || !completedRead.valid
        ? null
        : completedRead.rows;
    }

    if (error || truncated || !completedRead.valid) {
      console.error("Load students error:", error || new Error("The student list read was incomplete."));
      setMessage(TEACHER_COPY.errors.childrenLoad);
      setLoadingStudents(false);
      setStudentListReadState(previous => failStudentRosterRead(
        previous,
        classId,
        truncated ? "truncated" : "unavailable"
      ));
      return null;
    }

    setStudentList(completedRead.rows.filter(row => !row.archived_at));
    setArchivedStudentList(completedRead.rows.filter(row => Boolean(row.archived_at)));
    setLoadingStudents(false);
    setStudentListReadState(previous => completeStudentRosterRead(previous, classId));
    scheduleRetryableTeacherRoute("students");
    return completedRead.rows;
  }

  async function hydrateTeacherRouteContext(route, classRowsPromise = null) {
    const hydrationTeacherId = teacherId || "";
    const hydrationIdentityGeneration = authIdentityGenerationRef.current;
    const hydrationSessionMode = sessionMode;
    const hydrationToken = {
      hash: window.location.hash,
      identityGeneration: hydrationIdentityGeneration,
      teacherId: hydrationTeacherId
    };
    // Lock the exact requested address before the first cloud read. A class
    // result can commit one render before a later roster failure is known; if
    // the route is protected only after that failure, the normal app mirror
    // can consume the learner/report fields in that intermediate render.
    const hydrationRouteLock = {
      hash: hydrationToken.hash,
      identityGeneration: hydrationIdentityGeneration,
      retryStage: "hydrating",
      retrying: true,
      route,
      teacherId: hydrationTeacherId
    };
    teacherRouteHydrationTokensRef.current.add(hydrationToken);
    publishRetryableTeacherRoute(hydrationRouteLock);
    try {
      const routeRuntime = await loadTeacherRouteRuntime();
      const isRouteCurrent = () => {
        const current = routeRuntime.parse(window.location.hash);
        return Boolean(
          controllerMountedRef.current
          && hydrationTeacherId
          && lastAuthUserIdRef.current === hydrationTeacherId
          && authIdentityGenerationRef.current === hydrationIdentityGeneration
          && sessionModeRef.current === hydrationSessionMode
          && hydrationSessionMode !== "student"
          && current
          && current.appView === route.appView
          && String(current.classId || "") === String(route.classId || "")
          && String(current.groupId || "all") === String(route.groupId || "all")
          && String(current.learnerId || "") === String(route.learnerId || "")
          && String(current.reportView || "") === String(route.reportView || "")
        );
      };
      if (!isRouteCurrent()) return false;
      return await routeRuntime.hydrate([
        route,
        hydrationTeacherId,
        hydrationSessionMode,
        classRowsPromise ? () => classRowsPromise : loadClasses,
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
          rawSetAppView,
          isRouteCurrent,
          pending => {
            if (pending) {
              if (!isRouteCurrent()) return;
              publishRetryableTeacherRoute({
                ...pending,
                hash: window.location.hash,
                identityGeneration: hydrationIdentityGeneration,
                retrying: false,
                teacherId: hydrationTeacherId
              });
              return;
            }
            if (
              !retryableTeacherRouteRef.current
              || (
                retryableTeacherRouteRef.current.teacherId === hydrationTeacherId
                && retryableTeacherRouteRef.current.identityGeneration === hydrationIdentityGeneration
              )
            ) {
              publishRetryableTeacherRoute(null);
            }
          }
        ],
        selectedClassId
      ]);
    } finally {
      const wasCurrentGeneration = teacherRouteHydrationTokensRef.current.delete(hydrationToken);
      if (retryableTeacherRouteRef.current === hydrationRouteLock) {
        publishRetryableTeacherRoute(null);
      }
      // The final destination can equal the current app view (for example,
      // Back from one student report to another). Force one post-transaction
      // render so URL/profile effects that correctly paused above can commit
      // the now-consistent class, student, report, and view together.
      if (wasCurrentGeneration) {
        setTeacherRouteHydrationRevision(revision => revision + 1);
      }
    }
  }

  async function loadClassDashboard(classId = selectedClassId) {
    const loadSequence = ++classDashboardLoadSequenceRef.current;
    const loadTeacherId = teacherId || "";
    const loadIdentityGeneration = authIdentityGenerationRef.current;
    const isCurrentLoad = () => (
      controllerMountedRef.current
      && loadSequence === classDashboardLoadSequenceRef.current
      && authIdentityGenerationRef.current === loadIdentityGeneration
      && lastAuthUserIdRef.current === loadTeacherId
    );

    if (!loadTeacherId) {
      setMessage("Please sign in first.");
      setClassDashboardReadState(resetClassDashboardRead());
      return { ok: false, reason: "signed_out" };
    }

    if (!classId) {
      setMessage("Select a class first.");
      setClassDashboardReadState(resetClassDashboardRead());
      return { ok: false, reason: "class_required" };
    }

    setClassDashboardReadState(previous => beginClassDashboardRead(previous, classId));

    let dashboardStudentsResult;
    try {
      dashboardStudentsResult = await loadCompatibleDashboardStudents({
        client: supabase,
        teacherId: loadTeacherId,
        classId
      });
    } catch (error) {
      if (!isCurrentLoad()) {
        return { ok: false, stale: true };
      }
      console.error("Dashboard students error:", error);
      setClassDashboard(previousRows =>
        buildIncompleteClassDashboardRows(previousRows, previousRows, ["students"])
      );
      setClassDashboardReadState(previous => failClassDashboardRead(
        previous,
        classId,
        "error"
      ));
      setMessage(TEACHER_COPY.errors.pageLoad);
      return { ok: false, reason: "students_unavailable" };
    }
    const {
      data: students,
      error: studentsError,
      truncated: studentsTruncated
    } = dashboardStudentsResult;

    if (!isCurrentLoad()) {
      return { ok: false, stale: true };
    }

    if (studentsError || studentsTruncated) {
      console.error(
        "Dashboard students error:",
        studentsError || new Error("The dashboard student list read was incomplete.")
      );
      setClassDashboard(previousRows =>
        buildIncompleteClassDashboardRows(previousRows, previousRows, ["students"])
      );
      setClassDashboardReadState(previous => failClassDashboardRead(
        previous,
        classId,
        studentsTruncated ? "truncated" : "error"
      ));
      setMessage(TEACHER_COPY.errors.pageLoad);
      return {
        ok: false,
        reason: studentsTruncated ? "students_incomplete" : "students_unavailable"
      };
    }

    const studentIds =
      (students || []).map(s => s.id);

    if (studentIds.length === 0) {
      setClassDashboard([]);
      setClassDashboardReadState(previous => completeClassDashboardRead(previous, classId));
      return { ok: true, rows: [] };
    }

    // Paged, not plain. Both of these feed every figure on the dashboard, and
    // both were ordered oldest-first with no range, so PostgREST's 1000-row cap
    // silently handed back the oldest page and the newest work vanished from
    // the teacher's screen without any error.
    const answersResult = await settleTeacherRead(
      "Dashboard answers",
      () => selectAllRows(() => supabase
        .table("answers")
        .select("id, client_event_id, student_id, skill, stage, diagnostic_target, question, chosen_answer, correct_answer, is_correct, answered_at")
        .eq("teacher_id", loadTeacherId)
        .in("student_id", studentIds)
        .order("answered_at", { ascending: true })),
      { data: [], truncated: false }
    );

    if (!isCurrentLoad()) {
      return { ok: false, stale: true };
    }

    const masteryResult = await settleTeacherRead(
      "Dashboard mastery",
      () => selectAllRows(() => supabase
        .table("mastery")
        .select("*")
        .eq("teacher_id", loadTeacherId)
        .in("student_id", studentIds)
        .order("updated_at", { ascending: true })),
      { data: [], truncated: false }
    );

    if (!isCurrentLoad()) {
      return { ok: false, stale: true };
    }

    const assessmentAttemptsResult = await settleTeacherRead(
      "Dashboard assessment sittings",
      () => selectAllRows(() => supabase
        .table("assessment_attempts")
        .select("attempt_id, student_id, skill_id, completed_at, total_questions, correct_count, administration_status")
        .eq("teacher_id", loadTeacherId)
        .in("student_id", studentIds.map(String))
        .order("completed_at", { ascending: true })),
      { data: [], truncated: false }
    );

    if (!isCurrentLoad()) {
      return { ok: false, stale: true };
    }

    const soundSeekersResult = await settleTeacherRead(
      "Dashboard Sound Seekers",
      () => selectAllRows(() => supabase
        .table("student_progress")
        .select("student_id, payload, updated_at")
        .eq("area", "phonics_quest")
        .eq("key", "__all__")
        .in("student_id", studentIds)),
      { data: [], truncated: false }
    );

    if (!isCurrentLoad()) {
      return { ok: false, stale: true };
    }

    const profilesResult = await settleTeacherRead(
      "Dashboard profiles",
      () => selectAllRows(() => supabase
        .table("student_progress")
        .select("student_id, payload")
        .eq("area", "profile")
        .eq("key", "__all__")
        .in("student_id", studentIds)),
      { data: [], truncated: false }
    );

    if (!isCurrentLoad()) {
      return { ok: false, stale: true };
    }

    const missingSources = incompleteClassDashboardSources({
      answers: answersResult,
      mastery: masteryResult,
      assessmentAttempts: assessmentAttemptsResult,
      soundSeekers: soundSeekersResult,
      profiles: profilesResult
    });

    if (missingSources.length > 0) {
      Object.entries({
        answers: answersResult,
        mastery: masteryResult,
        assessmentAttempts: assessmentAttemptsResult,
        soundSeekers: soundSeekersResult,
        profiles: profilesResult
      }).forEach(([source, result]) => {
        if (result?.error) {
          console.error(`Dashboard ${source} error:`, result.error);
        }
        if (result?.truncated) {
          console.error(`Dashboard ${source} exceeded the paging ceiling.`);
        }
      });
      setClassDashboard(previousRows =>
        buildIncompleteClassDashboardRows(students || [], previousRows, missingSources)
      );
      const sourceReadTruncated = [
        answersResult,
        masteryResult,
        assessmentAttemptsResult,
        soundSeekersResult,
        profilesResult
      ].some(result => result?.truncated);
      setClassDashboardReadState(previous => failClassDashboardRead(
        previous,
        classId,
        sourceReadTruncated ? "truncated" : "error"
      ));
      setMessage(
        "Some saved results could not be loaded. Earlier figures remain on screen, but suggestions are paused. Check your connection and try again."
      );
      return { ok: false, incomplete: true, missingSources };
    }

    const answers = answersResult.data || [];
    const masteryRows = masteryResult.data || [];
    const assessmentAttemptRows = assessmentAttemptsResult.data || [];
    const soundSeekerRows = soundSeekersResult.data || [];
    const profileRows = profilesResult.data || [];
    const soundSeekersByStudent = new Map(
      soundSeekerRows.map(row => [row.student_id, {
        ...buildQuestMasteryReport(row.payload || {}),
        syncedAt: row.updated_at || ""
      }])
    );
    const profilesByStudent = new Map(
      profileRows.map(row => [row.student_id, row.payload || {}])
    );

    const changeWindowMs = 7 * 24 * 60 * 60 * 1000;
    const changeWindowEnd = Date.now();
    const conclusionNow = new Date(changeWindowEnd);
    const changeWindowStart = changeWindowEnd - changeWindowMs;
    const previousWindowStart = changeWindowStart - changeWindowMs;
    const inWindow = (value, start, end) => {
      const timestamp = new Date(value).getTime();
      return Number.isFinite(timestamp) && timestamp >= start && timestamp < end;
    };

    const rows =
      (students || []).map(student => {
        const studentAnswers =
          answers.filter(a =>
            a.student_id === student.id
          );

        const studentMastery =
          masteryRows.filter(m =>
            m.student_id === student.id
          );

        const correct =
          studentAnswers.filter(a => a.is_correct).length;
        const evidenceSkills = [...new Set(
          studentAnswers.map(row => String(row.skill || "").trim()).filter(Boolean)
        )];
        const currentEvidence = currentAnswerEvidence(studentAnswers, {
          now: conclusionNow
        });

        const accuracy =
          studentAnswers.length === 0
            ? 0
            : Math.round((correct / studentAnswers.length) * 100);

        const mastered =
          studentMastery.filter(m => m.mastered);
        const verifiedSecureIds = verifiedSecureSkillIds(
          studentMastery,
          assessmentAttemptRows,
          student.id,
          { now: conclusionNow }
        );
        const recentAnswers = studentAnswers.filter(row =>
          inWindow(row.answered_at, changeWindowStart, changeWindowEnd)
        ).length;
        const previousAnswers = studentAnswers.filter(row =>
          inWindow(row.answered_at, previousWindowStart, changeWindowStart)
        ).length;
        // public.mastery has no unique constraint on (student, skill) and the
        // round controller inserts a row per completed round, so the same skill
        // can appear many times. Every count below is therefore over DISTINCT
        // skill ids: counting rows let "7 of 30 secured" climb past 30, and the
        // teacher's number disagreed with the child's own record, which keys by
        // skill and takes the last row.
        const distinctMasteredSkills = rows => new Set(
          rows.map(row => row.skill_id).filter(Boolean)
        );
        const recentMastered = countFirstSecureTransitions(
          studentMastery.filter(row => verifiedSecureIds.has(row.skill_id)),
          changeWindowStart,
          changeWindowEnd
        );
        const previousMastered = countFirstSecureTransitions(
          studentMastery.filter(row => verifiedSecureIds.has(row.skill_id)),
          previousWindowStart,
          changeWindowStart
        );

        const masteredIds = distinctMasteredSkills(
          mastered.filter(row => verifiedSecureIds.has(row.skill_id))
        );

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
          classId: student.class_id || classId,
          answered: studentAnswers.length,
          correct,
          accuracy,
          evidenceSkills,
          // Keep the complete, teacher-owned answer rows available to the
          // class report. The report reconciles these against immutable
          // assessment attempts one response at a time; dashboard aggregates
          // alone cannot prove which rows are duplicate archive copies.
          answerHistory: studentAnswers.map(answer => ({
            id: answer.id,
            answerEventId: answer.client_event_id || "",
            studentId: answer.student_id,
            skill: answer.skill,
            stage: answer.stage,
            diagnosticTarget: answer.diagnostic_target,
            question: answer.question,
            chosen: answer.chosen_answer,
            correct: answer.correct_answer,
            isCorrect: answer.is_correct,
            answeredAt: answer.answered_at
          })),
          currentAnswered: currentEvidence.answered,
          currentCorrect: currentEvidence.correct,
          currentAccuracy: currentEvidence.accuracy,
          currentEvidenceSkills: currentEvidence.evidenceSkills,
          currentLastActive: currentEvidence.lastActive,
          masteredCount: masteredIds.size,
          currentSkill: firstUnmastered?.label || "Completed",
          focusEvidence: buildCurrentSkillEvidence(studentAnswers, firstUnmastered, {
            now: conclusionNow
          }),
          lastActive,
          recentAnswers,
          previousAnswers,
          recentMastered,
          previousMastered,
          soundSeekers,
          reducedChoiceMode: Boolean(studentProfile.reducedChoiceMode),
          accessibilitySettings: learnerAccessibilityFromProfile(studentProfile),
          evidenceReadStatus: "complete",
          evidenceMissingSources: []
        };
      });

    if (!isCurrentLoad()) {
      return { ok: false, stale: true };
    }
    setClassDashboard(rows);
    setClassDashboardReadState(previous => completeClassDashboardRead(previous, classId));
    return { ok: true, rows };
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
    const updatedAt = new Date().toISOString();
    const payload = createTeacherSoundSeekersAssignmentUpdate(targets, note, updatedAt);
    const { error } = await supabase.table("student_progress").upsert({
      student_id: studentRowId,
      area: "phonics_quest",
      key: "__all__",
      payload,
      updated_at: updatedAt
    }, { onConflict: "student_id,area,key" });
    if (error) {
      console.error("Assign practice error:", error);
      setMessage("Could not save the practice assignment.");
      return false;
    }
    setMessage("Practice assignment saved.");
    try {
      await loadClassDashboard(selectedClassId);
    } catch (refreshError) {
      console.error("Refresh after practice assignment failed:", refreshError);
      setMessage("Practice assignment saved. Reload the page if the updated assignment does not appear yet.");
    }
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
      setMessage("Could not save that student's navigation setting.");
      return false;
    }
    setMessage(enabled
      ? "Reduced choices are on for this student."
      : "All navigation choices are on for this student.");
    try {
      await loadClassDashboard(selectedClassId);
    } catch (refreshError) {
      console.error("Refresh after reduced-choice save failed:", refreshError);
      setMessage(enabled
        ? "Reduced choices were saved. Reload the page if the change does not appear yet."
        : "All navigation choices were saved. Reload the page if the change does not appear yet.");
    }
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
      setMessage("Could not save that student's accessibility settings.");
      return false;
    }
    setMessage("Student accessibility settings saved.");
    try {
      await loadClassDashboard(selectedClassId);
    } catch (refreshError) {
      console.error("Refresh after accessibility save failed:", refreshError);
      setMessage("Student accessibility settings saved. Reload the page if the change does not appear yet.");
    }
    return true;
  }

  async function updateStudentSymbolPassword(studentRowId, sequence, selectedStudentName = "student") {
    if (!teacherId || !studentRowId || !/^[1-9]{3}$/.test(sequence)) return false;
    const { data, error } = await supabase.call("teacher_set_student_symbol_password", {
      p_student_id: studentRowId,
      p_sequence: sequence,
      p_set_at: new Date().toISOString()
    });

    if (error || data?.ok !== true) {
      console.error("Could not update student symbol password.", error);
      setMessage("We couldn't change those sign-in pictures. Check your access and try again.");
      return false;
    }

    setMessage(`Sign-in pictures updated for ${selectedStudentName}.`);
    try {
      await loadStudents(selectedClassId);
    } catch (refreshError) {
      console.error("Refresh after sign-in picture save failed:", refreshError);
      setMessage(`Sign-in pictures updated for ${selectedStudentName}. Reload the page if the change does not appear yet.`);
    }
    return true;
  }

  // Bulk sign-in setup. One write per student but a single roster reload and a
  // single message at the end, so a class of 25 is one action, not 25.
  async function assignMissingSymbolPasswords(assignments = []) {
    if (!teacherId || !assignments.length) return { saved: 0, failed: 0, savedIds: [] };
    const setAt = new Date().toISOString();
    const savedIds = [];
    let saved = 0;
    let failed = 0;

    for (const assignment of assignments) {
      const studentRowId = assignment?.student?.id;
      const sequence = assignment?.sequence || "";
      if (!studentRowId || !/^[1-9]{3}$/.test(sequence)) {
        failed += 1;
        continue;
      }
      const { data, error } = await supabase.call("teacher_set_student_symbol_password", {
        p_student_id: studentRowId,
        p_sequence: sequence,
        p_set_at: setAt
      });
      if (error || data?.ok !== true) {
        console.error("Could not set student symbol password in bulk.", error);
        failed += 1;
      } else {
        saved += 1;
        savedIds.push(studentRowId);
      }
    }

    const savedMessage = failed
      ? `Sign-in pictures made for ${saved} student${saved === 1 ? "" : "s"}. ${failed} could not be saved — those students are not on the cards. Try again for them.`
      : `Sign-in pictures made for ${saved} student${saved === 1 ? "" : "s"}.`;
    setMessage(savedMessage);
    try {
      await loadStudents(selectedClassId);
    } catch (refreshError) {
      console.error("Refresh after bulk sign-in picture save failed:", refreshError);
      setMessage(`${savedMessage} Reload the page if the roster does not update yet.`);
    }
    // savedIds is what makes the printed cards trustworthy: the caller must
    // build the preview from rows that were actually written, never from the
    // sequences it generated locally. A partial failure used to print pictures
    // for children whose write had failed, and the class could not sign in.
    return { saved, failed, savedIds };
  }

  async function updateStudentName(studentRowId, nextName) {
    if (!teacherId || !selectedClassId || !studentRowId) return false;
    const normalizedName = normalizeRosterStudentName(nextName);
    const { data, error } = await updateRosterStudentName({
      supabase,
      studentId: studentRowId,
      classId: selectedClassId,
      name: normalizedName
    });
    if (error || !data?.length) {
      console.error("Could not update student display name.", error);
      // Never surface error.message here — it is raw database text.
      const reason = /duplicate|unique/i.test(error?.message || "")
        ? `A student named "${normalizedName}" already exists in this class.`
        : "We couldn't save that student's information. Nothing has changed.";
      setMessage(reason);
      return false;
    }

    if (studentId === studentRowId) {
      setTeacherStudentContext({
        studentId,
        studentName: normalizedName
      });
    }
    setMessage(`${normalizedName}'s information saved.`);
    try {
      await loadStudents(selectedClassId);
      await loadClassDashboard(selectedClassId);
    } catch (refreshError) {
      console.error("Refresh after student information save failed:", refreshError);
      setMessage(`${normalizedName}'s information was saved. Reload the page if the change does not appear yet.`);
    }
    return true;
  }

  async function resetStudentSymbolPassword(studentRowId, selectedStudentName = "student") {
    if (!teacherId || !studentRowId) return false;

    const { data, error } = await supabase.call("teacher_set_student_symbol_password", {
      p_student_id: studentRowId,
      p_sequence: null,
      p_set_at: new Date().toISOString()
    });

    if (error || data?.ok !== true) {
      console.error("Could not reset student symbol password.", error);
      setMessage("We couldn't reset those sign-in pictures. Check your access and try again.");
      return false;
    }

    setMessage(`Sign-in pictures reset for ${selectedStudentName}. Set new pictures before their next sign-in.`);
    try {
      await loadStudents(selectedClassId);
    } catch (refreshError) {
      console.error("Refresh after sign-in picture reset failed:", refreshError);
      setMessage(`Sign-in pictures were reset for ${selectedStudentName}. Reload the page if the roster does not update yet.`);
    }
    return true;
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

  async function resetSelectedStudentProgress() {
    if (!teacherId || !studentId) {
      setMessage("Select a student before resetting progress.");
      return false;
    }

    setResettingProgress(true);
    const requestedAt = new Date().toISOString();
    let data;
    let error;
    try {
      ({ data, error } = await supabase.call("teacher_reset_student_progress", {
        p_student_id: studentId,
        p_reset_at: requestedAt
      }));
    } catch (requestError) {
      setResettingProgress(false);
      console.error("Reset student progress error:", requestError);
      setMessage("We could not reset this student's practice progress. Nothing was changed. Check the connection and try again.");
      return false;
    }

    if (error || data?.ok === false) {
      setResettingProgress(false);
      console.error("Reset student progress error:", error || data);
      setMessage("We could not reset this student's practice progress. Nothing was changed. Check the connection and try again.");
      return false;
    }

    // Completed assessment evidence is historical and immutable. Reset only
    // derived mastery/current-session state and gamified practice progress.
    answerInFlightRef.current = false;
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
    setItemMastery({});
    setItemSessionSeen({});
    let localCleanupFailed = false;
    try {
      await clearAndVerifyLocalProgressForStudent(studentId, {
        allowFutureWritesAfterCleanup: true,
        preserveEngagement: true,
        preserveProfile: true,
        preserveAreas: PRACTICE_RESET_RETAINED_AREAS
      });
    } catch (cleanupError) {
      localCleanupFailed = true;
      console.warn("Practice reset completed in the cloud, but local cleanup is incomplete.", cleanupError);
    }
    setResettingProgress(false);
    if (import.meta.env.DEV) {
      console.debug("[assessment-reset] Reset all progress for selected student", {
        studentId,
        teacherId
      });
    }
    setResetProgressDialogOpen(false);
    setAppView(APP_VIEWS.TEACHER_CLASSES);
    setMessage(localCleanupFailed
      ? `Practice progress was reset for ${studentName || "student"} in the cloud, but this browser could not verify its local cleanup. Reload this browser before the student practises again. Completed assessments were kept.`
      : `Practice progress reset for ${studentName || "student"}. Completed assessments and formal assessment records were kept.`);

    try {
      await loadStudents(selectedClassId);
      await loadClassDashboard(selectedClassId);
    } catch (refreshError) {
      console.error("Refresh after practice reset failed:", refreshError);
      setMessage(
        `Practice progress reset for ${studentName || "student"}. Completed assessments were kept. `
        + "Reload the page if the roster does not update yet."
      );
    }
    return true;
  }


  async function loadStudentProgress(
    selectedStudentId,
    selectedStudentName,
    { navigate = true, classId = selectedClassId } = {}
  ) {
    const loadSequence = studentProgressLoadSequenceRef.current + 1;
    studentProgressLoadSequenceRef.current = loadSequence;
    const loadTeacherId = teacherId || "";
    const loadIdentityGeneration = authIdentityGenerationRef.current;
    const isCurrentLoad = () => (
      controllerMountedRef.current
      && studentProgressLoadSequenceRef.current === loadSequence
      && authIdentityGenerationRef.current === loadIdentityGeneration
      && lastAuthUserIdRef.current === loadTeacherId
    );
    if (!loadTeacherId || !isCurrentLoad()) return { cancelled: true };
    // Save the previous student's local draft before the selected-student
    // state changes. React's profile effect runs later; relying on it allowed
    // the reset below to overwrite one student's unfinished assessment with
    // another student's empty state.
    if (studentId) {
      saveManualAssessmentDrafts({
        teacherId: loadTeacherId,
        studentId,
        letterIndex,
        letterAssessment,
        patternIndex,
        patternAssessment
      });
    }
    const selectedManualDrafts = loadManualAssessmentDrafts({
      teacherId: loadTeacherId,
      studentId: selectedStudentId
    });
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
        teacherId: loadTeacherId,
        studentId: elBenchmarkSession.studentId,
        session: elBenchmarkSession
      });
    }
    const restoredElBenchmarkSession = loadElBenchmarkDraft({
      teacherId: loadTeacherId,
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
    setLetterIndex(selectedManualDrafts.letterIndex);
    setLetterAssessment(selectedManualDrafts.letterAssessment);
    setPatternIndex(selectedManualDrafts.patternIndex);
    setPatternAssessment(selectedManualDrafts.patternAssessment);
    setPatternAttempt(0);
    setElBenchmarkSession(restoredElBenchmarkSession);
    const progressSyncSession = {
      mode: "teacher",
      studentId: selectedStudentId,
      studentName: selectedStudentName,
      classId,
      teacherId: loadTeacherId
    };
    migrateGuidedReadingStorage({
      teacherId: loadTeacherId,
      studentId: selectedStudentId
    });
    configureProgressSync(progressSyncSession);
    const progressHydrationPromise = hydrateCloudProgress(progressSyncSession)
      .then(rows => ({ rows, error: null }))
      .catch(error => {
        console.warn("Could not hydrate teacher-selected cloud progress.", error);
        return { rows: [], error };
      });
    if (navigate) setAppView(APP_VIEWS.TEACHER_CLASSES);
    setCheckpointDecision(null);
    const selectedAttemptHistoryPromise = settleTeacherRead(
      "Student assessment archive",
      () => hydrateAssessmentAttempts({
        teacherId: loadTeacherId,
        studentId: selectedStudentId,
        supabase: isSupabaseConfigured ? supabase : null,
        returnStatus: true
      }),
      { records: [], complete: false }
    );

    const [
      answerResult,
      itemMasteryResult,
      masteryResult,
      attemptResult,
      progressHydrationResult
    ] = await Promise.all([
      settleTeacherRead(
        "Student answers",
        () => selectAllRows(() => supabase
          .table("answers")
          .select("*")
          .eq("teacher_id", loadTeacherId)
          .eq("student_id", selectedStudentId)
          .order("answered_at", { ascending: true })),
        { data: [], truncated: false }
      ),
      settleTeacherRead(
        "Student item summaries",
        () => selectAllRows(() => supabase
          .table("item_mastery")
          .select("*")
          .eq("teacher_id", loadTeacherId)
          .eq("student_id", selectedStudentId)
          .order("updated_at", { ascending: true })),
        { data: [], truncated: false }
      ),
      settleTeacherRead(
        "Student skill summaries",
        () => selectAllRows(() => supabase
          .table("mastery")
          .select("*")
          .eq("teacher_id", loadTeacherId)
          .eq("student_id", selectedStudentId)
          .order("updated_at", { ascending: true })),
        { data: [], truncated: false }
      ),
      selectedAttemptHistoryPromise,
      progressHydrationPromise
    ]);

    if (!isCurrentLoad()) return { cancelled: true };

    const answerRows = answerResult.data || [];
    const answerError = answerResult.error || (answerResult.truncated
      ? new Error("The answer history reached the configured read limit.")
      : null);
    const itemMasteryRows = itemMasteryResult.data || [];
    const itemMasteryError = itemMasteryResult.error || (itemMasteryResult.truncated
      ? new Error("The item summary reached the configured read limit.")
      : null);
    const masteryRows = masteryResult.data || [];
    const masteryError = masteryResult.error || (masteryResult.truncated
      ? new Error("The skill summary reached the configured read limit.")
      : null);
    const archivedAttemptsForStudent = attemptResult.records || [];
    const attemptError = attemptResult.complete ? null : (
      attemptResult.error || new Error("The assessment archive could not be read completely.")
    );
    const studentProgressRows = progressHydrationResult.rows || [];
    const studentProgressError = progressHydrationResult.error || null;

    // A partial manual assessment is also an archived assessment record. Use
    // that record to restore the draft on another device, while preferring a
    // newer local draft that may contain answers not archived yet. A newer
    // completed record suppresses an older local partial so finished work
    // cannot reopen.
    if (!attemptError) {
      const archivedManualDrafts = restoreManualAssessmentDraftsFromHistory({
        assessmentHistory: archivedAttemptsForStudent,
        studentId: selectedStudentId
      });
      const recoveredLetterAssessment = chooseNewestManualAssessmentEntries(
        selectedManualDrafts.letterAssessment,
        archivedManualDrafts.letterAssessment,
        {
          archivedStatus: archivedManualDrafts.letterLatestStatus,
          archivedAt: archivedManualDrafts.letterLatestAt
        }
      );
      const recoveredPatternAssessment = chooseNewestManualAssessmentEntries(
        selectedManualDrafts.patternAssessment,
        archivedManualDrafts.patternAssessment,
        {
          archivedStatus: archivedManualDrafts.patternLatestStatus,
          archivedAt: archivedManualDrafts.patternLatestAt
        }
      );
      const recoveredLetterIndex = recoveredLetterAssessment === selectedManualDrafts.letterAssessment
        ? selectedManualDrafts.letterIndex
        : recoveredLetterAssessment.length;
      const recoveredPatternIndex = recoveredPatternAssessment === selectedManualDrafts.patternAssessment
        ? selectedManualDrafts.patternIndex
        : recoveredPatternAssessment.length;
      setLetterIndex(recoveredLetterIndex);
      setLetterAssessment(recoveredLetterAssessment);
      setPatternIndex(recoveredPatternIndex);
      setPatternAssessment(recoveredPatternAssessment);
      saveManualAssessmentDrafts({
        teacherId: loadTeacherId,
        studentId: selectedStudentId,
        letterIndex: recoveredLetterIndex,
        letterAssessment: recoveredLetterAssessment,
        patternIndex: recoveredPatternIndex,
        patternAssessment: recoveredPatternAssessment
      });
    }

    if (answerError) console.error("Load answers error:", answerError);
    if (itemMasteryError && !isMissingItemMasteryTableError(itemMasteryError)) {
      console.error("Load item mastery error:", itemMasteryError);
    }
    if (masteryError) console.error("Load mastery error:", masteryError);
    if (attemptError) console.error("Load assessment archive error:", attemptError);
    if (studentProgressError) {
      console.error("Load student progress error:", studentProgressError);
    }

    const rebuiltHistory =
      (answerRows || []).map(row => {
        const baseRecord = {
          answerId: row.id || "",
          answerEventId: row.client_event_id || "",
          studentId: row.student_id || selectedStudentId,
          teacherId: row.teacher_id || loadTeacherId,
          date: row.answered_at,
          timestamp: row.answered_at,
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
          targetLetter: matchedQuestion?.targetLetter || matchedQuestion?.letter || "",
          targetSound: matchedQuestion?.targetSound
            || matchedQuestion?.finalSound
            || matchedQuestion?.initialSound
            || "",
          targetPattern: matchedQuestion?.targetPattern
            || matchedQuestion?.pattern
            || matchedQuestion?.rimeFamily
            || "",
          skillId: matchedQuestion?.skillId || "",
          itemType: matchedMetadata?.itemType || "",
          itemKey: matchedMetadata?.itemKey || "",
          itemLevel: matchedQuestion?.level || "",
          templateType: matchedQuestion?.templateType
            || matchedQuestion?.formatType
            || matchedQuestion?.questionType
            || ""
        };
      });

    answerHistoryRef.current = rebuiltHistory;
    setAnswerHistory(rebuiltHistory);
    setTotalAnswered(rebuiltHistory.length);
    setCorrectAnswered(rebuiltHistory.filter(x => x.isCorrect).length);

    // Cloud progress has now been merged into the student-scoped device cache.
    // Reading before that merge made Guided Reading disappear on a new device
    // until the teacher reloaded the whole app.
    setGuidedReadingRecords(loadGuidedReadingRecords(selectedStudentId));

    const rebuiltItemMastery = {};

    (itemMasteryRows || []).forEach(row => {
      const key = getItemMasteryStateKey(row.item_key, row.item_type);
      rebuiltItemMastery[key] = normalizeItemMasteryRow(row);
    });

    const masteryFromAttempts = archivedAttemptsForStudent.reduce(
      (rows, attempt) => mergeAssessmentAttemptIntoItemMastery(rows, attempt),
      {}
    );

    setAssessmentHistory(previous => mergeAssessmentAttemptRecords(
      previous,
      archivedAttemptsForStudent
    ));
    const recoveredItemMastery = { ...rebuiltItemMastery };
    for (const [key, archivedRow] of Object.entries(masteryFromAttempts)) {
      const cloudRow = recoveredItemMastery[key];
      if (!cloudRow) {
        recoveredItemMastery[key] = archivedRow;
        continue;
      }
      // item_mastery is a rebuildable summary and can lag when its upsert
      // failed after the immutable attempt was safely archived. Reconcile
      // monotonically so a stale summary cannot erase proved evidence. `max`
      // avoids double-counting the same formal answers present in both stores.
      recoveredItemMastery[key] = {
        ...archivedRow,
        ...cloudRow,
        attempts: Math.max(
          Number(archivedRow.attempts || 0),
          Number(cloudRow.attempts || 0)
        ),
        correct: Math.max(
          Number(archivedRow.correct || 0),
          Number(cloudRow.correct || 0)
        ),
        sessionsSeen: Math.max(
          Number(archivedRow.sessionsSeen || 0),
          Number(cloudRow.sessionsSeen || 0)
        ),
        mastered: Boolean(archivedRow.mastered || cloudRow.mastered),
        examples: Array.from(new Set([
          ...(archivedRow.examples || []),
          ...(cloudRow.examples || [])
        ])).slice(0, 8),
        missedExamples: Array.from(new Set([
          ...(archivedRow.missedExamples || []),
          ...(cloudRow.missedExamples || [])
        ])).slice(0, 8)
      };
    }
    setItemMastery(recoveredItemMastery);
    setItemSessionSeen({});

    const rebuiltMastery = {};

    (masteryRows || []).forEach(row => {
      const archivedCheckCount = archivedAttemptsForStudent.filter(attempt => (
        attempt.skillId === row.skill_id
        && ["completed", "mastered", "evidence_recorded"].includes(
          String(attempt.administrationStatus || attempt.status || "")
        )
      )).length;
      const checkCount = Math.max(
        Number(row.attempts || 0),
        archivedCheckCount
      );
      rebuiltMastery[row.skill_id] = {
        attempts: checkCount,
        // A single sitting can record strong evidence, but it cannot establish
        // secure mastery. This also corrects legacy one-round summary rows at
        // read time without rewriting their underlying completed evidence.
        mastered: Boolean(row.mastered && checkCount >= 2),
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
    // 2026-07-27: was "Loaded {name}." — developer phrasing, and it sat pinned at the
    // top of the page through the whole Assessments funnel, shifting the layout on
    // arrival. Say what it means to a teacher, in their words.
    const sourceErrors = [
      ["answers", answerError],
      ["assessmentAttempts", attemptError],
      ["itemMastery", itemMasteryError],
      ["skillMastery", masteryError],
      ["studentProgress", studentProgressError]
    ].filter(([, error]) => Boolean(error));
    const successfulSourceCount = 5 - sourceErrors.length;
    const readSyncStatus = sourceErrors.length === 0
      ? "complete"
      : successfulSourceCount > 0
        ? "partial"
        : "error";
    setMessage(sourceErrors.length
      ? `${selectedStudentName}’s saved results are only partly available. Missing information is not being counted as zero. Retry before making a formal decision.`
      : `${selectedStudentName}’s saved results are ready.`);
    const evidenceReadCompletedAt = new Date().toISOString();
    const sourceStatus = (error, rowCount) => (
      error
        ? rowCount > 0 ? "partial" : "unavailable"
        : "complete"
    );
    setSelectedStudentEvidenceReadState({
      completedAt: evidenceReadCompletedAt,
      syncStatus: readSyncStatus,
      sources: {
        answers: {
          lastSyncedAt: answerError ? "" : evidenceReadCompletedAt,
          syncStatus: sourceStatus(answerError, answerRows.length)
        },
        assessmentAttempts: {
          lastSyncedAt: attemptError ? "" : evidenceReadCompletedAt,
          syncStatus: sourceStatus(attemptError, archivedAttemptsForStudent.length)
        },
        itemMastery: {
          lastSyncedAt: itemMasteryError ? "" : evidenceReadCompletedAt,
          syncStatus: sourceStatus(itemMasteryError, itemMasteryRows.length)
        },
        skillMastery: {
          lastSyncedAt: masteryError ? "" : evidenceReadCompletedAt,
          syncStatus: sourceStatus(masteryError, masteryRows.length)
        },
        studentProgress: {
          lastSyncedAt: studentProgressError ? "" : evidenceReadCompletedAt,
          syncStatus: sourceStatus(studentProgressError, studentProgressRows.length)
        }
      }
    });
    // Formal report/export actions must stay closed unless every required
    // source was read completely. Partial rows may be shown with a warning,
    // but they are never a safe basis for a formal decision.
    setSelectedStudentEvidenceReady(readSyncStatus === "complete");
    // Handed back so a caller can start a check at the right level in the same
    // turn: reading currentSkillIndex from state here would still be the
    // previous student's.
    return {
      skillIndex: firstUnmastered === -1 ? skillTree.length - 1 : firstUnmastered,
      syncStatus: readSyncStatus,
      missingSources: sourceErrors.map(([source]) => source)
    };
  }


  // Returns true when the student was created, false on any refusal or failure.
  // 2026-07-27: it used to return undefined either way, so the roster form could not
  // tell success from failure and cleared the typed name even when the save failed.
  async function createStudentForSelectedClass(name, { navigate = true } = {}) {
    const clean = normalizeRosterStudentName(name);
    if (!clean) return false;
    if (clean.length > 80) {
      setMessage("Display names must be 80 characters or fewer.");
      return false;
    }

    if (!teacherId) {
      setMessage("Please log in first.");
      return false;
    }

    if (!selectedClassId) {
      setMessage("Please select or create a class first.");
      return false;
    }

    const targetClassId = selectedClassId;
    const { data, error } = await supabase
      .table("students")
      .insert({
        name: clean,
        class_id: targetClassId,
        teacher_id: teacherId
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase student save error:", error);
      setMessage(teacherMutationErrorMessage(error, "create_student", clean));
      return false;
    }

    resetCurrentStudentLocalProgress({ clearFormalAssessments: true });
    setTeacherStudentContext({
      studentId: data.id,
      studentName: data.name || clean
    });
    setGuidedReadingRecords({});
    setNameSaved(true);
    setCurrentSkillIndex(0);
    setStudentList(previous => (
      previous.some(row => row.id === data.id)
        ? previous
        : [...previous, data]
    ));
    if (navigate) setAppView(APP_VIEWS.TEACHER_CLASSES);
    let refreshIncomplete;
    try {
      const [studentsResult, dashboardResult] = await Promise.all([
        loadStudents(targetClassId),
        loadClassDashboard(targetClassId)
      ]);
      refreshIncomplete = !Array.isArray(studentsResult)
        || dashboardResult?.ok !== true;
    } catch (refreshError) {
      console.error("Refresh after student creation failed:", refreshError);
      refreshIncomplete = true;
    }
    setMessage(refreshIncomplete
      ? `${data.name || clean} was added and selected. The latest class list could not reload, so use the retry shown on this page before adding them again.`
      : `Student created and selected: ${data.name || clean}`);
    return true;
  }


  return {
    adminDeleteClass, adminDeleteStudent, adminSetTeacherSchool, applyStudentSession,
    assignMissingSymbolPasswords, assignQuestPractice, clearQuestPractice, clearTeacherState,
    completePasswordReset, createClass, createDemoClass, createStudentForSelectedClass,
    demoTeacherEnabled, executeAdminDeleteClass, executeAdminDeleteStudent, exitToTeacherEntry,
    isTeacherAccountApproved, loadAdminDashboard, loadClassDashboard, loadClasses,
    classDashboardReadState, classListReadState, loadingClasses,
    loadStudentProgress, loadStudents, logInDemoTeacher, logInTeacher,
    logOutStudent, logOutTeacher, normalizeApprovalStatus, openAdminDashboard,
    profileStorageKey, regenerateClassCode, requestPasswordReset, resetSelectedStudentProgress,
    retryTeacherSchoolName, returnToStudentSelection,
    resetStudentSymbolPassword, saveGuidedReadingRecord, saveTeacherSchool, setStudentAccessibilitySettings,
    resendEmailConfirmation, nudgeTeacherAccountReview, loadPendingAccountAlert,
    startTryMode, endTryMode,
    setStudentReducedChoiceMode, signUpTeacher, updateStudentName, updateStudentSymbolPassword, updateTeacherAccountStatus,
  };
}

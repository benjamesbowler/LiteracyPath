/* eslint-disable react-hooks/exhaustive-deps -- Context values preserve App's original effect contracts during staged controller extraction. */
import { useEffect, useEffectEvent, useLayoutEffect } from "react";
import { loadCompatibleTeacherClasses } from "../data/classApiCompatibility.js";

export function useAppSessionController(context) {
  const {
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
  } = context;

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
        // A new/restored auth identity must hydrate its own route and profile
        // before the generic post-auth Today fallback is allowed to navigate.
        setProfileLoaded(false);
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

    // Block the post-auth Today fallback until this user's saved route has
    // actually been restored. On a hard reload the previous approved state
    // could otherwise make SELECT look ready for one render, replacing the
    // incoming Classes/Progress hash before restoration had parsed it.
    setProfileLoaded(false);
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

    const { data, error, compatibility } = await loadCompatibleTeacherClasses({
      client: supabase,
      teacherId
    });

    if (error) {
      console.error("Load classes error:", error);
      setMessage("Could not load classes from cloud.");
      return [];
    }

    if (compatibility === "legacy") {
      console.info("Classes loaded through the rolling-release schema boundary.");
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


  return {
    adminDeleteClass, adminDeleteStudent, adminSetTeacherSchool, applyStudentSession,
    assignQuestPractice, clearQuestPractice, clearTeacherState,
    completePasswordReset, createClass, createDemoClass, createStudentForSelectedClass,
    demoTeacherEnabled, executeAdminDeleteClass, executeAdminDeleteStudent, exitToTeacherEntry,
    isTeacherAccountApproved, loadAdminDashboard, loadClassDashboard, loadClasses,
    loadStudentProgress, loadStudents, logInDemoTeacher, logInTeacher,
    logOutStudent, logOutTeacher, normalizeApprovalStatus, openAdminDashboard,
    profileStorageKey, regenerateClassCode, requestPasswordReset, resetSelectedStudentProgress,
    resetStudentSymbolPassword, saveGuidedReadingRecord, saveTeacherSchool, setStudentAccessibilitySettings,
    setStudentReducedChoiceMode, signUpTeacher, updateStudentSymbolPassword, updateTeacherAccountStatus,
  };
}

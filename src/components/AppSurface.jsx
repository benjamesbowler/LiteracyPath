import { Suspense, useState } from "react";
import Confetti from "react-confetti";
import { motion } from "framer-motion";
import logoUrl from "../assets/logo.svg";
import { TeacherContextBar } from "./teacher/TeacherContextBar.jsx";
import { teacherCycleOptions } from "./teacher/teacherCycleReference.js";
import { supabase, isSupabaseConfigured } from "../supabaseClient.js";
import { skillTree } from "../skillTree.js";
import {
  AdvancedPhonicsPatternAssessmentPage,
  AssessmentPage,
  AuthPage,
  CheckpointDecisionPage,
  DashboardSummary,
  GuidedReadingPage,
  LetterAssessmentPage,
  TeacherReportsPage
} from "./AppPages.jsx";
import { ErrorBoundary } from "./ErrorBoundary.jsx";
import { SchoolNameInput } from "./SchoolNameInput.jsx";
import { StudentAdventureMapPage } from "./StudentAdventureMapPage.jsx";
import { StudentEntryPage } from "./StudentEntryPage.jsx";
import { StudentHomePage } from "./StudentHomePage.jsx";
import { StudentLoginFlow } from "./StudentLoginFlow.jsx";
import { StudentSoundTrailPage } from "./StudentSoundTrailPage.jsx";
import StudentGlassShell from "./StudentGlassShell.jsx";
import { RouteLoadingFallback as LazyPageFallback } from "./RouteLoadingFallback.jsx";
import {
  AdminDashboardPage,
  AssessmentErrorBoundary,
  ConfirmActionDialog,
  ELBenchmarkAssessmentPage,
  ElSkillsQuest,
  FinishedReportPage,
  HollowPage,
  LazyActionFeedback,
  LearnAreaPage,
  NewVersionAvailableCard,
  PageBoundary,
  PageErrorFallback,
  PhonicsLearnPage,
  PresentPage,
  QuestRoot,
  ResetStudentProgressDialog,
  Sidebar,
  StudentBooksPage,
  StudentStoryQuestsPage,
  TeacherAssessmentsPage,
  TeacherIntentPage,
  TeacherReportsHubPage,
  TeacherStudentsPage,
  TeacherTodayPage,
  TeacherSettingsPage,
  WorksheetGeneratorPage
} from "../appState/appRuntimeSurfaces.jsx";
import { pushRouteHash, teacherReportHash } from "../appState/appRuntimeServices.js";
import { APP_VIEWS } from "../appState/appViews.js";
import {
  isFocusedAssessmentView,
  readTeacherFunnelParams,
  shouldShowDashboardSummary,
  shouldShowFooterUtilityActions,
  teacherIntentHash
} from "../appState/appViewHelpers.js";
import {
  calculateAccuracy,
  calculateRoundCorrect,
  calculateRoundProgress
} from "../appState/assessmentSessionHelpers.js";
import { getSelectedClassName } from "../appState/studentSessionHelpers.js";
import { getStudentRosterReadView } from "../appState/studentRosterReadState.js";
import { learnerAccessibilityDataAttributes } from "../accessibility/learnerAccessibility.js";
import { STUDENT_TAB_BAR } from "../policy/studentRailPolicy.js";
import { worldForScope } from "../utils/palWorlds.js";

export function AppSurface({ surface }) {
  const {
    ROUND_LENGTH, adminClasses, adminConfirm, adminConfirmBusy, adminDeleteClass,
    adminDeleteStudent, adminLoading, adminPendingAccounts, adminPendingAccountsWarning, adminSchools, adminSetTeacherSchool,
    adminStudents, adminTeachers, allQuestions, allowPassageAudio, answerHistory, answerQuestion, appView,
    applyStudentSession, archivedStudentList, assessmentFullscreen, assessmentHistory, assessmentHistoryReadState, assessmentMode, assessmentTransitioning,
    assignQuestPractice, authDisplayName, authEmail, authLoading, authMessage, authMode,
    authPassword, authReady, authReconnecting, authSchoolName,
    checkpointDecision, chunkLoadFailure, classDashboard, classDashboardReadState, classList, classListReadState,
    clearQuestPractice, completePasswordReset, continueCheckpointSkill, correctAnswered, coverageSnapshot, createClass,
    createDemoClass, createStudentForSelectedClass, currentQuestion, currentSkillIndex, currentStage, currentStageQuestions,
    demoTeacherEnabled, discardElBenchmarkDraft, discontinueElBenchmarkAssessment, elBenchmarkDraftSaveFailed, elBenchmarkSession,
    endAssessment, entryMode, executeAdminDeleteClass, executeAdminDeleteStudent, exitToTeacherEntry, exportCSVData,
    exportData, exportLetterAssessment, exportPatternAssessment, exportReadingReport, exportStudentAssessmentWorkbook, feedback,
    finishElBenchmarkAssessment, guidedInitialBookId, guidedReadingRecords, handleAssessmentEvidenceImageError,
    isAdmin, isStudentSurfaceView, isTeacherAccountApproved, itemMastery,
    keepPracticingSkill, learnFullscreen, learnerAccessibility, letterAssessment, letterIndex,
    letterItems, loadAdminDashboard, loadClassDashboard, loadClasses, loadStudentProgress, loadStudents, loadingClasses,
    loadingStudents,
    logInDemoTeacher, logInTeacher, logOutStudent, logOutTeacher, mastery,
    message, moveToNextCheckpointSkill, nameSaved, newClassName, normalizeApprovalStatus,
    openAdminDashboard, openStudentPreview, patternAssessment, patternIndex, patternItems, pickQuestion,
    prefersReducedMotion, profileLoaded, recordLetterResult, recordPatternResult, goToPreviousLetter, goToPreviousPattern, reviseLastAnswer,
    regenerateClassCode, renderLearnFullscreenButton, reportSkillMasterySummary, reportsAssessmentHistory, requestPasswordReset, retryAssessmentHistoryHydration, resetLetterAssessment,
    resetPatternAssessment, resetProgressDialogOpen, resetSelectedStudentProgress, resetStudent, resetStudentSymbolPassword, resettingProgress,
    resumeElBenchmarkAssessment, retryCheckpointSkill, retryTeacherSchoolName, returnFromElBenchmarkAssessment, returnFromStudentPreview, returnToStudentHome, returnToTeacherDashboard,
    returnFromCheck, reviewInitialSoundLevelOne, roundAnswers, saveElBenchmarkPartialAndExit, saveGuidedReadingRecord, saveTeacherSchool, selectedClassId,
    saveLetterAssessmentPartialAndExit, savePatternAssessmentPartialAndExit,
    selectedStudentEvidenceReadState, selectedStudentEvidenceReady, sessionMode, setAdminConfirm, setAdminConfirmBusy, setAllowPassageAudio,
    setAppView, setArchivedStudentList, setAuthDisplayName, setAuthEmail, setAuthMode, setAuthPassword,
    setAuthSchoolName, setClassDashboard, setCurrentQuestion, setCurrentSkillIndex, setEntryMode,
    setFeedback, setGuidedInitialBookId, setMessage, setNameSaved, setNewClassName, setResetProgressDialogOpen,
    setRoundAnswers, setSelectedClassId, setSessionMode, setStudentAccessibilitySettings, setStudentArcadeOpen, setStudentList,
    setStudentReducedChoiceMode, setStudentReportView, setTeacherGroupId, setTeacherStudentContext,
    shouldShowImage, showConfetti, showSkillsQuestPrototype, signUpTeacher, speakText,
    startAdvancedPhonicsAssessment, startAssessment, startElBenchmarkAssessment, startLetterAssessment, startTargetedReview, studentArcadeOpen,
    studentId, studentList, studentListReadState, studentName, studentPreview, studentPreviewStatus, studentReportView,
    studentSession, studentSessionId, switchStudent, teacherAccountRecord, teacherAccountStatus, teacherGroupId,
    teacherId, teacherSchoolName, teacherSchoolNameReadState, teacherUser, toggleAssessmentFullscreen,
    totalAnswered, updateElBenchmarkSession, updateStudentName, updateStudentSymbolPassword, updateTeacherAccountStatus, weaknessSnapshot,
    assignMissingSymbolPasswords
  } = surface;

  // Which setup step the teacher pressed "Continue" on over on Today. Students
  // picks it up once, opens the right control, then clears it.
  const [setupFocus, setSetupFocus] = useState("");
  const [adminConfirmError, setAdminConfirmError] = useState("");
  // A Dashboard sound-map tile opens Reports scoped to one skill. The tile
  // does not name a skill yet, so this stays empty and Reports opens unfiltered
  // until it does.
  const [soundMapSkillFilter, setSoundMapSkillFilter] = useState("");
  // The context bar's teaching cycle - a teacher-set reference (never
  // automated; Benjamin's 2026-07-28 decision), remembered across sessions
  // and fed to Present mode as its default cycle.
  const [teacherCycleId, setTeacherCycleId] = useState(() => {
    try {
      const stored = window.localStorage.getItem("lp-teacher-cycle");
      if (stored && teacherCycleOptions().some(option => option.id === stored)) return stored;
    } catch {
      // localStorage unavailable - fall through to the first cycle.
    }
    return teacherCycleOptions()[0]?.id || "";
  });
  function changeTeacherCycle(nextCycleId) {
    setTeacherCycleId(nextCycleId);
    try {
      window.localStorage.setItem("lp-teacher-cycle", nextCycleId);
    } catch {
      // localStorage unavailable - the in-session choice still applies.
    }
  }

  function selectedClassStudent(studentOrId) {
    const requestedId = typeof studentOrId === "object"
      ? studentOrId?.id
      : studentOrId;
    if (!requestedId || !selectedClassId) return null;
    const rosterRead = getStudentRosterReadView({
      readState: studentListReadState,
      classId: selectedClassId,
      legacyLoading: loadingStudents
    });
    if (!rosterRead.complete || !rosterRead.rowsBelongToClass) return null;
    return studentList.find(row => (
      row.id === requestedId
      && String(row.class_id || "") === String(selectedClassId)
    )) || null;
  }

  function reportStaleStudentSelection() {
    setMessage(
      "That student is not in the selected class, or the class list is still loading. Choose the class and student again before continuing."
    );
  }

  async function loadSelectedClassStudent(studentOrId, name = "") {
    const student = selectedClassStudent(studentOrId);
    if (!student) {
      reportStaleStudentSelection();
      return null;
    }
    return loadStudentProgress(student.id, student.name || name, { navigate: false });
  }

  function runForSelectedClassStudent(action) {
    if (!selectedClassStudent(studentId)) {
      reportStaleStudentSelection();
      return false;
    }
    action();
    return true;
  }

  // ONE SHORTCUT INTO THE ASSESSMENT FUNNEL.
  //
  // A roster row already answers "which class?" and "which student?", but it
  // must not silently answer "which assessment?". Load and verify that
  // student's evidence first, then open the same reviewable assessment funnel
  // used by the main navigation with those first two answers preserved.
  async function startCheckForStudent(student) {
    const ownedStudent = selectedClassStudent(student);
    if (!ownedStudent) {
      reportStaleStudentSelection();
      return;
    }
    const context = await loadStudentProgress(
      ownedStudent.id,
      ownedStudent.name,
      { navigate: false }
    );
    if (context?.syncStatus !== "complete") {
      setMessage(
        `${student.name || "This student"}’s saved results are not fully available. Nothing has been counted as zero. Try again before starting an assessment.`
      );
      return;
    }
    goToTeacherIntent(APP_VIEWS.ASSESSMENTS, {
      classId: selectedClassId,
      learnerId: ownedStudent.id
    });
  }

  // Row-level actions can target a student who is not the selected one.
  async function selectStudentIfNeeded(student) {
    const ownedStudent = selectedClassStudent(student);
    if (!ownedStudent) {
      reportStaleStudentSelection();
      return false;
    }
    if (ownedStudent.id !== studentId) {
      await loadStudentProgress(ownedStudent.id, ownedStudent.name, { navigate: false });
    }
    return true;
  }

  // Today's setup checklist says which step it wants; Students opens that control.
  function openStudentsPage(focusStep = "") {
    setSetupFocus(typeof focusStep === "string" ? focusStep : "");
    setAppView(APP_VIEWS.TEACHER_CLASSES);
  }

  // Choosing a class must always load the roster AND the class dashboard rows.
  // The Resources route never did, which is why its student picker had nothing
  // to offer.
  async function selectTeacherClass(nextClassId) {
    // Clear class-scoped figures in the same event as the selection. Waiting
    // for the next request to begin left the previous class's students
    // selectable in Assessments and Reports during network latency.
    setClassDashboard([]);
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
  }

  // ONE WAY TO OPEN A STUDENT REPORT.
  //
  // There were two copies of this, with the same body: one on the Students
  // panel that used whichever student happened to be selected, and one on the
  // report picker that used the student whose row was clicked. The first was
  // wrong whenever the row and the selection disagreed.
  function openStudentReport(learnerId, reportView = "whole-child") {
    if (!learnerId) return;
    setStudentReportView(reportView);
    pushRouteHash(teacherReportHash(selectedClassId, learnerId, reportView));
    setAppView(APP_VIEWS.FINISHED);
  }

  function clearSelectedLearner() {
    setTeacherStudentContext({ studentId: null, studentName: "" });
    setNameSaved(false);
  }

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
                <li><span className="auth-hero-feature-dot" aria-hidden="true"/>Quick skill assessments</li>
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
    const isSetupRequired = status === "approval_setup_required";
    const isRejected = status === "rejected";
    const isDisabled = status === "disabled";
    const decisionReason = String(teacherAccountRecord?.rejection_reason || "").trim();
    const statusHeading = isSetupRequired
      ? "Account setup needs attention"
      : isRejected
        ? "Account request rejected"
        : isDisabled
          ? "Account disabled"
          : "Account awaiting approval";
    const statusMessage = isSetupRequired
      ? "We couldn't finish setting up this account. Nothing has been lost. Sign out and try again; if this message returns, ask your school administrator for help."
      : isRejected
        ? "An administrator did not approve this account request. Contact your school administrator if the request should be reviewed again."
        : isDisabled
          ? "An administrator has disabled this teacher account. Contact your school administrator before trying to use it again."
          : "Your account request has been submitted. An administrator must approve your account before you can use Literacy Guide.";
    return (
      <PageBoundary resetKey={`account-status-${status}`}>
        <div className="app auth-shell">
          <div className="card page-card page-stack auth-card">
            <div className="auth-heading">
              <h2>{statusHeading}</h2>
              <p className="muted-text">{statusMessage}</p>
              {(isRejected || isDisabled) && decisionReason && (
                <p className="auth-account-decision-reason">
                  <strong>Administrator note:</strong> {decisionReason}
                </p>
              )}
            </div>
            <button className="main-button" onClick={logOutTeacher} type="button">
              Sign out
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
              <p className="muted-text">Students use their school, class and name to sign in.</p>
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
  const assessmentArchiveReady = assessmentHistoryReadState?.complete === true
    && assessmentHistoryReadState?.truncated !== true
    && !assessmentHistoryReadState?.error;
  const assessmentArchiveLoading = ["idle", "loading"].includes(
    assessmentHistoryReadState?.status
  );
  const rosterReadyForClassReport = (
    studentListReadState?.status === "complete"
    && String(studentListReadState?.classId || "") === String(selectedClassId || "")
  );
  const dashboardReadyForClassReport = (
    classDashboardReadState?.status === "complete"
    && String(classDashboardReadState?.classId || "") === String(selectedClassId || "")
  );
  const completeDashboardEvidence = studentList.length === 0 || (
    classDashboard.length === studentList.length
    && classDashboard.every(row => (
      row.evidenceReadStatus === "complete"
      && String(row.classId || "") === String(selectedClassId || "")
    ))
  );
  const classReportEvidenceReady = assessmentArchiveReady
    && rosterReadyForClassReport
    && dashboardReadyForClassReport
    && completeDashboardEvidence;
  const classReportEvidenceLoading = assessmentArchiveLoading
    || studentListReadState?.status === "loading"
    || studentListReadState?.status === "idle"
    || classDashboardReadState?.status === "loading"
    || classDashboardReadState?.status === "idle";
  const isFocusedAssessment = isFocusedAssessmentView(appView);
  const effectiveAssessmentFullscreen = isFocusedAssessment && assessmentFullscreen;
  const isStudentMode = sessionMode === "student";
  const hasTeacherSchool = Boolean(teacherAccountRecord?.school_id || teacherSchoolName);
  const isTeacherClassEntry = !isStudentMode
    && !selectedClassId
    && [APP_VIEWS.SELECT, APP_VIEWS.TEACHER_DASHBOARD].includes(appView);
  const isFocusedShell = isStudentMode
    || isTeacherClassEntry
    || appView === APP_VIEWS.STUDENT_LOGIN
    || isFocusedAssessment
    || (isStudentSurfaceView && learnFullscreen);
  // A teacher previewing a student surface (Student Page, Guided Reading, Story
  // Quests, Phonics, Adventure, Hollow) needs the student-facing CSS scope so the
  // images/logos are constrained — without it they render at natural size and
  // the whole preview balloons. Apply student-mode-app but KEEP the sidebar
  // (no "no-sidebar", no world backdrop).
  const isChildPreviewView = !isStudentMode && [
    APP_VIEWS.STUDENT_HOME,
    APP_VIEWS.GUIDED_READING,
    // The whole-class reader renders the same book pages, so it needs the same
    // CSS scope or the page images render at natural size.
    APP_VIEWS.TEACHER_GUIDED_READING,
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
    appView === APP_VIEWS.STUDENT_LOGIN ? "student-login-app-shell" : "",
    isTeacherClassEntry ? "teacher-class-entry-app no-sidebar" : "",
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
  const goToTeacherIntent = (nextView, routeContext = {}) => {
    // A funnel answer reaches React state asynchronously. If a teacher moves
    // straight from Assessments to Reports, preserve the owned class/student
    // already written into the current URL instead of emitting a bare Reports
    // route and making them choose everything again.
    const currentParams = readTeacherFunnelParams();
    const nextClassId = routeContext.classId
      || selectedClassId
      || currentParams.get("class")
      || "";
    const nextLearnerId = routeContext.learnerId
      || studentId
      || currentParams.get("learner")
      || "";
    // Feedback belongs to the surface where the action happened. Carrying a
    // success or failure banner into another section makes it look as though
    // the destination produced it. Clear it at the navigation boundary; any
    // real loading error raised by the destination arrives afterwards and is
    // left untouched.
    setMessage("");
    const nextHash = teacherIntentHash({
      appView: nextView,
      classId: nextClassId,
      groupId: teacherGroupId,
      learnerId: nextLearnerId
    });
    pushRouteHash(nextHash);
    setAppView(nextView);
  };
  // The Reports funnel keeps the teacher on one page, so the report styles in
  // the report's own navigation must link back into the funnel rather than off
  // to the standalone report route.
  const reportsFunnelHash = reportView => {
    const base = teacherIntentHash({
      appView: APP_VIEWS.REPORTS,
      classId: selectedClassId,
      groupId: teacherGroupId,
      learnerId: studentId
    });
    if (!base) return "";
    const [path, query = ""] = base.replace(/^#/, "").split("?");
    const params = new URLSearchParams(query);
    params.set("report", reportView);
    params.set("show", "1");
    return `#${path}?${params.toString()}`;
  };

  // ONE STUDENT REPORT, TWO PLACES IT APPEARS: at the end of a check, and
  // inside the last step of the Reports funnel. The props are assembled once so
  // the two can never drift apart.
  const renderStudentReport = (reportView, options = {}) => (
    <Suspense fallback={<LazyPageFallback label="Loading report..." />}>
      <FinishedReportPage
        backLabel={options.onBack ? "Back to reports" : "Back to dashboard"}
        buildReportHref={options.buildReportHref || (view => (
          teacherReportHash(selectedClassId, studentId, view)
        ))}
        onReportViewChange={options.onReportViewChange || setStudentReportView}
        startAssessment={startAssessment}
        openChecks={() => setAppView(APP_VIEWS.ASSESSMENTS)}
        initialReportView={reportView}
        keepPracticingSkill={keepPracticingSkill}
        startTargetedReview={startTargetedReview}
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
        answerHistory={answerHistory}
        evidenceReadState={selectedStudentEvidenceReadState}
        evidenceReady={selectedStudentEvidenceReady}
        focusHeadingOnMount={options.focusHeadingOnMount ?? !options.onBack}
        onRetryEvidence={() => loadSelectedClassStudent(studentId, studentName)}
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
        returnToTeacherDashboard={options.onBack || (teacherId ? returnToTeacherDashboard : null)}
      />
    </Suspense>
  );

  // Both funnels report what just happened through the one shared feedback
  // component rather than each growing its own status line.
  const funnelFeedback = message ? (
    <Suspense fallback={null}>
      <LazyActionFeedback
        className={`el-benchmark-hub-message${message.includes("Cloud sync is pending") || message.includes("cloud copy could not") ? " sync-pending" : ""}`}
        message={message}
      />
    </Suspense>
  ) : null;

  // The five bottom tabs. Each id is a tab in STUDENT_TAB_BAR; the sub-screen
  // a child is actually on is mapped onto its tab by selectActiveStudentTab
  // inside the shell, so Story Quests lights Books and the Adventure Map
  // lights Sounds without a second mapping living out here.
  const studentTabActions = {
    home: goStudentHome,
    sounds: () => { setStudentArcadeOpen(false); setAppView(APP_VIEWS.PHONICS_QUEST); },
    books: () => { setStudentArcadeOpen(false); setGuidedInitialBookId(""); setAppView(APP_VIEWS.GUIDED_READING); },
    games: () => { setStudentArcadeOpen(true); setAppView(APP_VIEWS.PHONICS_LEARN); },
    hollow: () => { setStudentArcadeOpen(false); setAppView(APP_VIEWS.STUDENT_REWARDS); }
  };
  // A tab the bar draws but nothing here can act on is dead chrome — a child
  // taps it and the app does nothing. Route only through the declared bar, so
  // adding a tab to the policy without an action here is a visible gap rather
  // than a silent one.
  const goToStudentTab = tabId => {
    if (!STUDENT_TAB_BAR.some(tab => tab.id === tabId)) return;
    studentTabActions[tabId]?.();
  };
  // Child routes share one fluid, viewport-sized stage. Scrolling is an
  // explicit exception rather than the legacy default: the child experience
  // must fit the screen at laptop and tablet sizes.
  const withStudentRail = (activeId, content, { contentScrolls = false } = {}) => {
    if (!isStudentMode || learnFullscreen) return content;
    return (
      <StudentGlassShell
        studentName={studentName}
        scopeKey={studentId || studentName || "default"}
        active={activeId}
        onNavigate={goToStudentTab}
        onHome={goStudentHome}
        // The grown-ups menu (change companion, sign out) lives on the home
        // page. Sending a grown-up there is deliberate: a one-tap sign-out in
        // the header of every screen is a button a five-year-old will press.
        onGrownUps={goStudentHome}
        contentScrolls={contentScrolls}
      >
        {content}
      </StudentGlassShell>
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
      {...(isStudentMode ? learnerAccessibilityDataAttributes(learnerAccessibility) : {})}
    >
      {!isFocusedShell && (
        <Suspense fallback={<aside className="lg-sidebar" aria-label="Loading main navigation" />}>
          <Sidebar
            appView={appView}
            nameSaved={nameSaved}
            studentName={studentName}
            className={getSelectedClassName(classList, selectedClassId)}
            goToTeacherDashboard={() => goToTeacherIntent(APP_VIEWS.TEACHER_DASHBOARD)}
            goToTeacherClasses={() => goToTeacherIntent(APP_VIEWS.TEACHER_CLASSES)}
            goToTeacherAssessments={() => goToTeacherIntent(APP_VIEWS.ASSESSMENTS)}
            goToTeacherReports={() => goToTeacherIntent(APP_VIEWS.REPORTS)}
            goToTeacherResources={() => goToTeacherIntent(APP_VIEWS.TEACHER_RESOURCES)}
            goToTeacherSettings={() => goToTeacherIntent(APP_VIEWS.TEACHER_SETTINGS)}
            teacherEmail={teacherUser.email}
            logOutTeacher={logOutTeacher}
            isAdmin={isAdmin}
            openAdminDashboard={openAdminDashboard}
          />
        </Suspense>
      )}
      <div className="lg-content-area">
      {!isFocusedShell && !isStudentMode && (
        <TeacherContextBar
          className={getSelectedClassName(classList, selectedClassId)}
          schoolName={teacherSchoolName || ""}
          studentCount={classList.find(row => row.id === selectedClassId)?.studentCount ?? null}
          cycleId={teacherCycleId}
          onChangeCycle={changeTeacherCycle}
          onChangeClass={() => {
            selectTeacherClass("");
            goToTeacherIntent(APP_VIEWS.SELECT);
          }}
          onPresent={() => goToTeacherIntent(APP_VIEWS.PRESENT)}
          onAssess={() => goToTeacherIntent(APP_VIEWS.ASSESSMENTS)}
        />
      )}
      <div className={appShellClassName}>
      {!isSupabaseConfigured && !isStudentMode && (
        <div className="supabase-config-banner" role="alert">
          <strong>Nothing is being saved.</strong> Cloud storage is not connected.
          Ask the person who manages this app to review the deployment settings.
        </div>
      )}
      {showConfetti && !prefersReducedMotion && !learnerAccessibility.reducedEffects && (
        <Confetti recycle={false} numberOfPieces={90} />
      )}

      {studentPreview && isChildPreviewView && (
        <aside className="teacher-student-preview-banner" aria-label={`Previewing as ${studentPreview.studentName}`}>
          <div>
            <strong>Previewing as {studentPreview.studentName}</strong>
            <span>Read-only preview · this student's progress is protected</span>
          </div>
          <p role="status" aria-live="polite">{studentPreviewStatus}</p>
          <button className="lp-button lp-button-secondary" type="button" onClick={returnFromStudentPreview}>
            Return to {studentPreview.returnView === APP_VIEWS.TEACHER_RESOURCES ? "Resources" : "teacher view"}
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
          {withStudentRail("hollow", (
            <div className="student-surface-frame student-surface-rewards">
              <Suspense fallback={<LazyPageFallback label="Loading your Hollow..." />}>
                <HollowPage
                  studentName={studentName}
                  progressScopeKey={childProgressScopeKey}
                />
              </Suspense>
            </div>
          ))}
        </PageBoundary>
      )}

      {/* THE ADVENTURE MAP. The redesigned map screen is the front door of this
          route (phase C); the Skills Quest itself opens on top of it at the stop
          the child tapped, and keeps its own full map, lands, pan and stations.
          The mode's own wrapper is unchanged - withStudentRail with the scroll
          hatch - so nothing about how it renders moved. */}
      {appView === APP_VIEWS.SKILLS_BLOCK_QUEST && nameSaved && (
        <PageBoundary resetKey={`skills-block-quest-${studentId}`}>
          <StudentAdventureMapPage
            studentName={studentName}
            progressScopeKey={studentId || studentName || "default"}
            onNavigate={goToStudentTab}
            onHome={goStudentHome}
            onGrownUps={goStudentHome}
            renderQuest={({ cycleId }) => withStudentRail("map", (
              <Suspense fallback={<LazyPageFallback label="Loading Skills Quest..." />}>
                <ElSkillsQuest
                  studentName={studentName || "Reader"}
                  progressScopeKey={studentId || studentName || "default"}
                  initialCycleId={cycleId}
                  onExit={() => setAppView(isStudentMode ? APP_VIEWS.STUDENT_HOME : APP_VIEWS.TEACHER_CLASSES)}
                />
              </Suspense>
            ))}
          />
        </PageBoundary>
      )}

      {/* THE SOUND TRAIL. Same shape: the redesigned trail screen is the front
          door and Go launches Sound Seekers, which is unchanged - it still
          portals full-screen and owns the Den, the creature, the chapter map and
          the Trading Post. Lazy, because a student who never opens it should not
          pay for a whole mode on first load. */}
      {appView === APP_VIEWS.PHONICS_QUEST && nameSaved && (
        <PageBoundary resetKey={`phonics-quest-${studentId}`}>
          <StudentSoundTrailPage
            studentName={studentName}
            progressScopeKey={studentId || studentName || "default"}
            onNavigate={goToStudentTab}
            onHome={goStudentHome}
            onGrownUps={goStudentHome}
            renderQuest={({ onExit }) => (
              <Suspense fallback={<LazyPageFallback label="Loading Sound Seekers..." />}>
                <QuestRoot
                  progressScopeKey={studentId || studentName || "default"}
                  accessibilitySettings={learnerAccessibility}
                  // Leaving the mode returns to the trail the child left from,
                  // not to Home: the Home tab is one tap away on the bar and the
                  // trail is the screen that says what happens next.
                  onExit={isStudentMode
                    ? onExit
                    : () => setAppView(APP_VIEWS.TEACHER_CLASSES)}
                />
              </Suspense>
            )}
          />
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
              mediaQuestions={allQuestions}
              assessmentHistory={assessmentHistory}
              assessmentHistoryReadState={assessmentHistoryReadState}
              retryAssessmentHistory={retryAssessmentHistoryHydration}
              teacherId={teacherId}
              supabase={isSupabaseConfigured ? supabase : null}
              message={message}
            />
          </Suspense>
        </PageBoundary>
      )}

      {sessionMode !== "student" && (
        appView === APP_VIEWS.TEACHER_DASHBOARD
        || appView === APP_VIEWS.SELECT
      ) && (
        <PageBoundary resetKey="teacher-today">
          <Suspense fallback={<LazyPageFallback label="Loading dashboard..." />}>
            <TeacherTodayPage
              classList={classList}
              classListReadState={classListReadState}
              loadingClasses={loadingClasses}
              loadClasses={loadClasses}
              selectedClassId={selectedClassId}
              createClass={createClass}
              newClassName={newClassName}
              setNewClassName={setNewClassName}
              studentList={studentList}
              studentListReadState={studentListReadState}
              loadingStudents={loadingStudents}
              loadStudents={loadStudents}
              loadClassDashboard={loadClassDashboard}
              classDashboard={classDashboard}
              classDashboardReadState={classDashboardReadState}
              onSelectClass={selectTeacherClass}
              onLoadStudent={async (id, name) => {
                const loadPromise = loadSelectedClassStudent(id, name);
                if (!selectedClassStudent(id)) return;
                setAppView(APP_VIEWS.TEACHER_CLASSES);
                await loadPromise;
              }}
              onStartCheck={startCheckForStudent}
              onOpenClasses={openStudentsPage}
              onOpenProgress={skillName => {
                setSoundMapSkillFilter(typeof skillName === "string" ? skillName : "");
                goToTeacherIntent(APP_VIEWS.REPORTS);
              }}
              createDemoClass={createDemoClass}
              teacherId={teacherId}
              message={message}
            />
          </Suspense>
        </PageBoundary>
      )}

      {sessionMode !== "student" && appView === APP_VIEWS.TEACHER_CLASSES && (
        <PageBoundary resetKey="teacher-students">
          <Suspense fallback={<LazyPageFallback label="Loading students..." />}>
            <TeacherStudentsPage
              classList={classList}
              classListReadState={classListReadState}
              loadingClasses={loadingClasses}
              loadClasses={loadClasses}
              selectedClassId={selectedClassId}
              setSelectedClassId={nextClassId => {
                setClassDashboard([]);
                setSelectedClassId(nextClassId);
                setTeacherGroupId("all");
                setTeacherStudentContext({ studentId: null, studentName: "" });
                setNameSaved(false);
              }}
              setStudentList={setStudentList}
              setArchivedStudentList={setArchivedStudentList}
              studentList={studentList}
              studentListReadState={studentListReadState}
              archivedStudentList={archivedStudentList}
              loadingStudents={loadingStudents}
              loadStudents={loadStudents}
              assignQuestPractice={assignQuestPractice}
              clearQuestPractice={clearQuestPractice}
              setReducedChoiceMode={setStudentReducedChoiceMode}
              setAccessibilitySettings={setStudentAccessibilitySettings}
              onLoadStudent={loadSelectedClassStudent}
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
              onStartCheck={startCheckForStudent}
              onOpenReport={() => {
                if (!selectedClassStudent(studentId)) {
                  reportStaleStudentSelection();
                  return;
                }
                openStudentReport(studentId);
              }}
              onOpenGuidedReading={() => {
                if (!selectedClassStudent(studentId)) {
                  reportStaleStudentSelection();
                  return;
                }
                setGuidedInitialBookId("");
                setAppView(APP_VIEWS.GUIDED_READING);
              }}
              onOpenStoryQuests={() => {
                if (!selectedClassStudent(studentId)) {
                  reportStaleStudentSelection();
                  return;
                }
                openStudentPreview(APP_VIEWS.LEARN);
              }}
              onOpenElFormalCheck={async student => {
                if (!await selectStudentIfNeeded(student)) return;
                goToTeacherIntent(APP_VIEWS.ASSESSMENTS);
              }}
              onResetCheckData={async student => {
                if (!await selectStudentIfNeeded(student)) return;
                setResetProgressDialogOpen(true);
              }}
              createClass={createClass}
              createDemoClass={createDemoClass}
              newClassName={newClassName}
              setNewClassName={setNewClassName}
              createStudent={name => createStudentForSelectedClass(name, { navigate: false })}
              teacherId={teacherId}
              classDashboard={classDashboard}
              classDashboardReadState={classDashboardReadState}
              loadClassDashboard={loadClassDashboard}
              skillTree={skillTree}
              updateStudentName={updateStudentName}
              updateStudentSymbolPassword={updateStudentSymbolPassword}
              assignMissingSymbolPasswords={assignMissingSymbolPasswords}
              resetStudentSymbolPassword={resetStudentSymbolPassword}
              startStudentLogin={() => {
                setSessionMode("teacher");
                setEntryMode("student");
                setAppView(APP_VIEWS.STUDENT_LOGIN);
              }}
              schoolName={teacherSchoolName}
              hasSchool={hasTeacherSchool}
              message={message}
              setupFocus={setupFocus}
              onSetupFocusHandled={() => setSetupFocus("")}
            />
          </Suspense>
        </PageBoundary>
      )}

      {sessionMode !== "student" && appView === APP_VIEWS.TEACHER_RESOURCES && (
        <PageBoundary resetKey="teacher-resources">
          <Suspense fallback={<LazyPageFallback label="Loading resources..." />}>
            <TeacherIntentPage
              intent="resources"
              classList={classList}
              classListReadState={classListReadState}
              teacherId={teacherId}
              selectedClassId={selectedClassId}
              cycleId={teacherCycleId}
              loadingClasses={loadingClasses}
              onRetryClasses={loadClasses}
              onOpenWorksheets={() => goToTeacherIntent(APP_VIEWS.WORKSHEETS)}
              onOpenPresent={() => goToTeacherIntent(APP_VIEWS.PRESENT)}
              onOpenGuidedReading={bookId => {
                // GUIDED_READING is the per-student conference and only renders
                // once a student is chosen. The Resources shelf is whole-class,
                // so with nobody chosen it opens the whole-class reader instead
                // of bouncing the teacher to the roster. Either way the card
                // lands on guided reading, and the chosen book comes along.
                setGuidedInitialBookId(typeof bookId === "string" ? bookId : "");
                if (!nameSaved) {
                  goToTeacherIntent(APP_VIEWS.TEACHER_GUIDED_READING);
                  return;
                }
                setAppView(APP_VIEWS.GUIDED_READING);
              }}
              onOpenClasses={() => setAppView(APP_VIEWS.TEACHER_CLASSES)}
            />
          </Suspense>
        </PageBoundary>
      )}

      {sessionMode !== "student" && appView === APP_VIEWS.TEACHER_SETTINGS && (
        <PageBoundary resetKey="teacher-settings">
          <Suspense fallback={<LazyPageFallback label="Loading settings…" />}>
            <TeacherSettingsPage
              client={supabase}
              classList={classList}
              classListReadState={classListReadState}
              loadingClasses={loadingClasses}
              onRetryClasses={loadClasses}
              teacherId={teacherId}
              selectedClassId={selectedClassId}
              onSelectClass={selectTeacherClass}
              studentList={studentList}
              studentListReadState={studentListReadState}
              loadingStudents={loadingStudents}
              archivedStudentList={archivedStudentList}
              schoolName={teacherSchoolName}
              schoolNameReadState={teacherSchoolNameReadState}
              onRetrySchoolName={retryTeacherSchoolName}
              onRegenerateClassCode={regenerateClassCode}
              onReloadStudents={loadStudents}
              onOpenStudents={openStudentsPage}
              teacherEmail={teacherUser.email}
              profileLoaded={profileLoaded}
              onSignOut={logOutTeacher}
            />
          </Suspense>
        </PageBoundary>
      )}

      {sessionMode !== "student" && appView === APP_VIEWS.ASSESSMENTS && (
        <PageBoundary resetKey="teacher-assessments">
          {funnelFeedback}
          <Suspense fallback={<LazyPageFallback label="Loading assessments..." />}>
            <TeacherAssessmentsPage
              classList={classList}
              classListReadState={classListReadState}
              teacherId={teacherId}
              selectedClassId={selectedClassId}
              className={getSelectedClassName(classList, selectedClassId)}
              onOpenClasses={openStudentsPage}
              studentRows={classDashboard}
              classDashboardReadState={classDashboardReadState}
              studentList={studentList}
              studentListReadState={studentListReadState}
              loadingClasses={loadingClasses}
              loadingStudents={loadingStudents}
              onRetryClasses={loadClasses}
              onRetryStudents={loadStudents}
              onRetryClassDashboard={loadClassDashboard}
              selectedStudentId={nameSaved ? studentId : ""}
              selectedStudentName={nameSaved ? studentName : ""}
              onSelectStudent={loadSelectedClassStudent}
              studentEvidenceReady={selectedStudentEvidenceReady}
              studentEvidenceReadState={selectedStudentEvidenceReadState}
              onRetryStudentEvidence={() => (
                studentId
                  ? loadSelectedClassStudent(studentId, studentName)
                  : Promise.resolve(null)
              )}
              firstUnsecuredSkillIndex={currentSkillIndex}
              assessmentHistory={assessmentHistory.filter(record => record.studentId === studentId)}
              elBenchmarkDraft={elBenchmarkSession?.studentId === studentId ? elBenchmarkSession : null}
              letterAssessmentDraft={
                letterAssessment.length > 0 && letterIndex < letterItems.length
                  ? {
                      completedItems: Math.min(letterAssessment.length, letterItems.length),
                      plannedItems: letterItems.length
                    }
                  : null
              }
              phonicsPatternAssessmentDraft={
                patternAssessment.length > 0 && patternIndex < patternItems.length
                  ? {
                      completedItems: Math.min(patternAssessment.length, patternItems.length),
                      plannedItems: patternItems.length
                    }
                  : null
              }
              onResumeDraft={resumeElBenchmarkAssessment}
              onDiscardDraft={discardElBenchmarkDraft}
              onStartSkillCheck={stageIndex => runForSelectedClassStudent(
                () => startAssessment(stageIndex)
              )}
              onStartLetterCheck={() => runForSelectedClassStudent(startLetterAssessment)}
              onStartPhonicsPatternCheck={() => runForSelectedClassStudent(
                startAdvancedPhonicsAssessment
              )}
              onStartBenchmark={(assessmentId, options) => runForSelectedClassStudent(
                () => startElBenchmarkAssessment(assessmentId, options)
              )}
            />
          </Suspense>
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

      {/* BOOKS. The redesigned shelf screen is the front door of this route for
          a child (phase D); the reader itself opens on top of it at the book
          they tapped and keeps every capability it has - page audio, whole-book
          read-aloud, decoding support, the quiz, the level-up certificate. A
          TEACHER session keeps the guided-reading tool it has always had here,
          with its notes and running records, so this branch is a child branch
          only. */}
      {appView === APP_VIEWS.GUIDED_READING && nameSaved && isStudentMode && (
        <PageBoundary resetKey={`guided-reading-${studentId}`}>
          <Suspense fallback={<LazyPageFallback label="Loading your books..." />}>
            <StudentBooksPage
              studentName={studentName}
              progressScopeKey={childProgressScopeKey}
              teacherId={teacherId}
              studentId={studentId}
              guidedReadingRecords={guidedReadingRecords}
              studentProgress={selectedStudentEvidenceReady ? {
                currentSkillId: currentStage?.id || "",
                currentSkillLabel: currentStage?.label || ""
              } : null}
              recommendationEvidenceReady={selectedStudentEvidenceReady}
              initialBookId={guidedInitialBookId}
              onNavigate={goToStudentTab}
              onHome={goStudentHome}
              onGrownUps={goStudentHome}
              onOpenStoryQuests={() => {
                setStudentArcadeOpen(false);
                setAppView(APP_VIEWS.LEARN);
              }}
              renderReader={({ bookId, onExit }) => withStudentRail("books", (
                <GuidedReadingPage
                  initialBookId={bookId}
                  onCloseReader={onExit}
                  studentId={studentId}
                  studentName={studentName}
                  studentProgress={selectedStudentEvidenceReady ? {
                    currentSkillId: currentStage?.id || "",
                    currentSkillLabel: currentStage?.label || ""
                  } : null}
                  recommendationEvidenceReady={selectedStudentEvidenceReady}
                  mode="student"
                  autoNarration={learnerAccessibility.narration}
                  guidedReadingRecords={guidedReadingRecords}
                  saveGuidedReadingRecord={saveGuidedReadingRecord}
                  speakText={speakText}
                />
              ))}
            />
          </Suspense>
        </PageBoundary>
      )}

      {appView === APP_VIEWS.GUIDED_READING && nameSaved && !isStudentMode && (
        <PageBoundary resetKey={`guided-reading-${studentId}`}>
          {withStudentRail("books", (
            <GuidedReadingPage
              initialBookId={guidedInitialBookId}
              studentId={studentId}
              studentName={studentName}
              studentProgress={selectedStudentEvidenceReady ? {
                currentSkillId: currentStage?.id || "",
                currentSkillLabel: currentStage?.label || ""
              } : null}
              recommendationEvidenceReady={selectedStudentEvidenceReady}
              mode="teacher"
              autoNarration={false}
              guidedReadingRecords={guidedReadingRecords}
              saveGuidedReadingRecord={saveGuidedReadingRecord}
              speakText={speakText}
            />
          ))}
        </PageBoundary>
      )}

      {sessionMode !== "student" && appView === APP_VIEWS.TEACHER_GUIDED_READING && (
        <PageBoundary resetKey="teacher-guided-reading">
          <GuidedReadingPage
            initialBookId={guidedInitialBookId}
            mode="class"
            guidedReadingRecords={{}}
            saveGuidedReadingRecord={() => {}}
            speakText={speakText}
            studentId=""
            studentName=""
          />
        </PageBoundary>
      )}

      {/* STORY QUESTS. Same shape as Books and as the two phase-C screens: the
          redesigned shelf is the front door and tapping a story mounts the real
          player at that story, with its branching choices, its resume and its
          completion screen untouched. Reached from Books or the Home doorway,
          and the BOOKS tab stays lit while the child is here - there are five
          tabs and eight places, and selectActiveStudentTab owns that mapping. */}
      {appView === APP_VIEWS.LEARN && nameSaved && (
        <PageBoundary resetKey={`learn-${studentId}`}>
          <Suspense fallback={<LazyPageFallback label="Loading Story Quest..." />}>
            <StudentStoryQuestsPage
              studentName={studentName}
              progressScopeKey={childProgressScopeKey}
              onNavigate={goToStudentTab}
              onHome={goStudentHome}
              onGrownUps={goStudentHome}
              onBackToBooks={() => {
                setStudentArcadeOpen(false);
                setGuidedInitialBookId("");
                setAppView(APP_VIEWS.GUIDED_READING);
              }}
              renderQuest={({ questId, onExit }) => withStudentRail("stories", (
                <div className="learn-fullscreen-frame student-surface-frame student-surface-story">
                  {renderLearnFullscreenButton()}
                  <LearnAreaPage
                    key={`${childProgressScopeKey}:${questId}`}
                    progressScopeKey={childProgressScopeKey}
                    launchQuestId={questId}
                    onExitLibrary={onExit}
                  />
                </div>
              ))}
            />
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

      {sessionMode !== "student" && appView === APP_VIEWS.REPORTS && (
        <PageBoundary resetKey="teacher-reports">
          {funnelFeedback}
          <Suspense fallback={<LazyPageFallback label="Loading reports..." />}>
            <TeacherReportsHubPage
              classList={classList}
              classListReadState={classListReadState}
              teacherId={teacherId}
              selectedClassId={selectedClassId}
              className={getSelectedClassName(classList, selectedClassId)}
              onSelectClass={selectTeacherClass}
              onOpenClasses={() => goToTeacherIntent(APP_VIEWS.TEACHER_CLASSES)}
              studentRows={classDashboard}
              classDashboardReadState={classDashboardReadState}
              studentList={studentList}
              studentListReadState={studentListReadState}
              loadingClasses={loadingClasses}
              loadingStudents={loadingStudents}
              onRetryClasses={loadClasses}
              onRetryStudents={loadStudents}
              onRetryClassDashboard={loadClassDashboard}
              classReportEvidenceReady={classReportEvidenceReady}
              classReportEvidenceLoading={classReportEvidenceLoading}
              onRetryClassReportEvidence={() => {
                retryAssessmentHistoryHydration?.();
                loadStudents?.(selectedClassId);
                loadClassDashboard?.(selectedClassId);
              }}
              selectedStudentId={nameSaved ? studentId : ""}
              selectedStudentName={nameSaved ? studentName : ""}
              studentEvidenceReady={selectedStudentEvidenceReady}
              studentEvidenceStatus={selectedStudentEvidenceReadState?.syncStatus || "loading"}
              onRetryStudentEvidence={() => loadSelectedClassStudent(studentId, studentName)}
              onSelectStudent={loadSelectedClassStudent}
              onClearStudent={clearSelectedLearner}
              soundMapSkillFilter={soundMapSkillFilter}
              reportView={studentReportView}
              onSelectReportView={setStudentReportView}
              renderStudentReport={(reportView, onBack) => renderStudentReport(reportView, {
                buildReportHref: reportsFunnelHash,
                onReportViewChange: setStudentReportView,
                onBack
              })}
              renderClassReport={(onBack, classReportOptions = {}) => (
                <TeacherReportsPage
                  allAssessmentHistory={assessmentHistory}
                  allAnswerHistory={classDashboard.flatMap(
                    row => Array.isArray(row.answerHistory) ? row.answerHistory : []
                  )}
                  answerHistoryReadState={{
                    status: studentList.length === 0
                      || (
                        classDashboard.length === studentList.length
                        && classDashboard.every(row => (
                          row.evidenceReadStatus === "complete"
                          && row.classId === selectedClassId
                        ))
                      )
                      ? "complete"
                      : "error",
                    complete: studentList.length === 0
                      || (
                        classDashboard.length === studentList.length
                        && classDashboard.every(row => (
                          row.evidenceReadStatus === "complete"
                          && row.classId === selectedClassId
                        ))
                      ),
                    truncated: classDashboard.some(
                      row => row.evidenceMissingSources?.includes("answers")
                    ),
                    error: classDashboard.some(
                      row => row.evidenceReadStatus !== "complete"
                    )
                      ? "Saved answer rows could not be confirmed."
                      : null
                  }}
                  assessmentHistoryReadState={assessmentHistoryReadState}
                  classList={classList}
                  loadingStudents={loadingStudents}
                  onRetryAnswerHistory={loadClassDashboard}
                  onRetryAssessmentHistory={retryAssessmentHistoryHydration}
                  onRetryStudents={loadStudents}
                  onBack={onBack}
                  selectedClassId={selectedClassId}
                  skillFilter={classReportOptions.skillFilter || ""}
                  studentListReadState={studentListReadState}
                  students={studentList}
                  teacherName={teacherUser?.email || ""}
                  teacherId={teacherId}
                  supabase={isSupabaseConfigured ? supabase : null}
                />
              )}
            />
          </Suspense>
        </PageBoundary>
      )}

      {appView === APP_VIEWS.WORKSHEETS && (
        <PageBoundary resetKey="worksheets">
          <Suspense fallback={<LazyPageFallback label="Loading worksheets..." />}>
            <WorksheetGeneratorPage
              teacherId={teacherId}
              className={getSelectedClassName(classList, selectedClassId)}
              onBack={() => goToTeacherIntent(APP_VIEWS.TEACHER_RESOURCES)}
            />
          </Suspense>
        </PageBoundary>
      )}

      {appView === APP_VIEWS.PRESENT && (
        <PageBoundary resetKey="present">
          <Suspense fallback={<LazyPageFallback label="Loading Present mode..." />}>
            <PresentPage
              className={getSelectedClassName(classList, selectedClassId)}
              currentCycleId={teacherCycleId}
              onBack={() => goToTeacherIntent(APP_VIEWS.TEACHER_RESOURCES)}
            />
          </Suspense>
        </PageBoundary>
      )}

      {sessionMode !== "student" && shouldShowDashboardSummary({ appView }) && (
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
            endAssessment={saveLetterAssessmentPartialAndExit}
            recordLetterResult={recordLetterResult}
            onPrevious={goToPreviousLetter}
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
            endAssessment={savePatternAssessmentPartialAndExit}
            recordPatternResult={recordPatternResult}
            onPrevious={goToPreviousPattern}
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
          returnToStudentOverview={returnFromCheck}
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
            reviseLastAnswer={reviseLastAnswer}
            speakText={speakText}
            message={message}
            endAssessment={endAssessment}
            returnToStudentOverview={returnFromCheck}
            assessmentMode={assessmentMode}
            isAssessmentTransitioning={assessmentTransitioning}
            assessmentFullscreen={effectiveAssessmentFullscreen}
            toggleAssessmentFullscreen={toggleAssessmentFullscreen}
            onEvidenceImageError={handleAssessmentEvidenceImageError}
            skillTree={skillTree}
            onChangeSkillLevel={stageIndex => startAssessment(stageIndex)}
            studentId={studentId}
            studentSessionToken={sessionMode === "student" ? studentSession?.token || "" : ""}
            supabase={isSupabaseConfigured ? supabase : null}
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
            returnToOverview={returnFromCheck}
            suggestedFocus={weaknessSnapshot?.suggestedNextFocus || null}
            totalAnswered={totalAnswered}
          />
        </PageBoundary>
      )}

      {adminConfirm && <Suspense fallback={null}><ConfirmActionDialog
        open={Boolean(adminConfirm)}
        busy={adminConfirmBusy}
        error={adminConfirmError}
        title={adminConfirm?.kind === "class" ? "Delete class?" : "Delete student?"}
        body={adminConfirm?.kind === "class"
          ? `This permanently removes ${adminConfirm?.name || "this class"}. The class must be empty first. This cannot be undone.`
          : `This permanently removes ${adminConfirm?.name || "this student"} and their saved learning results. A minimal record of the deletion request is kept. This cannot be undone.`}
        confirmLabel={adminConfirm?.kind === "class" ? "Delete class" : "Delete student"}
        onCancel={() => {
          setAdminConfirmError("");
          setAdminConfirm(null);
        }}
        onConfirm={async () => {
          if (!adminConfirm || adminConfirmBusy) return;
          setAdminConfirmBusy(true);
          setAdminConfirmError("");
          try {
            const deleted = adminConfirm.kind === "class"
              ? await executeAdminDeleteClass(adminConfirm.id, adminConfirm.name)
              : await executeAdminDeleteStudent(adminConfirm.id, adminConfirm.name);
            if (deleted === true) {
              setAdminConfirm(null);
            } else {
              setAdminConfirmError(adminConfirm.kind === "class"
                ? "The class was not deleted. Check that it is empty, then try again."
                : "The student was not deleted. Nothing was changed. Try again.");
            }
          } catch (error) {
            console.error("Admin deletion failed:", error);
            setAdminConfirmError("The deletion did not finish. Nothing has been reported as deleted. Try again.");
          } finally {
            setAdminConfirmBusy(false);
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
          {renderStudentReport(studentReportView)}
        </PageBoundary>
      )}

      {sessionMode !== "student" && shouldShowFooterUtilityActions({ appView, isFocusedAssessment: isFocusedShell }) && (
        <div className="footer-utility-actions">
          <button className="report-button" onClick={switchStudent}>
            Switch student
          </button>

          <button className="reset-button" onClick={resetStudent}>
            Reset student
          </button>
        </div>
      )}
      </div>
      </div>
    </div>
    </ErrorBoundary>
  );
}

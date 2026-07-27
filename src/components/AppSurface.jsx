import { Suspense, useState } from "react";
import Confetti from "react-confetti";
import { motion } from "framer-motion";
import logoUrl from "../assets/logo.svg";
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
import { StudentEntryPage } from "./StudentEntryPage.jsx";
import { StudentHomePage } from "./StudentHomePage.jsx";
import { StudentLoginFlow } from "./StudentLoginFlow.jsx";
import StudentRail from "./StudentRail.jsx";
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
import { learnerAccessibilityDataAttributes } from "../accessibility/learnerAccessibility.js";
import { STUDENT_RAIL_DESTINATIONS } from "../policy/studentRailPolicy.js";
import { worldForScope } from "../utils/palWorlds.js";

export function AppSurface({ surface }) {
  const {
    ROUND_LENGTH, adminClasses, adminConfirm, adminConfirmBusy, adminDeleteClass,
    adminDeleteStudent, adminLoading, adminPendingAccounts, adminPendingAccountsWarning, adminSchools, adminSetTeacherSchool,
    adminStudents, adminTeachers, allQuestions, allowPassageAudio, answerQuestion, appView,
    applyStudentSession, archivedStudentList, assessmentFullscreen, assessmentHistory, assessmentMode, assessmentTransitioning,
    assignQuestPractice, authDisplayName, authEmail, authLoading, authMessage, authMode,
    authPassword, authReady, authReconnecting, authSchoolName, authUsername,
    checkpointDecision, chunkLoadFailure, classDashboard, classList,
    clearQuestPractice, completePasswordReset, continueCheckpointSkill, correctAnswered, coverageSnapshot, createClass,
    createDemoClass, createStudentForSelectedClass, currentQuestion, currentSkillIndex, currentStage, currentStageQuestions,
    demoTeacherEnabled, discardElBenchmarkDraft, discontinueElBenchmarkAssessment, elBenchmarkDraftSaveFailed, elBenchmarkSession,
    endAssessment, entryMode, executeAdminDeleteClass, executeAdminDeleteStudent, exitToTeacherEntry, exportCSVData,
    exportData, exportLetterAssessment, exportPatternAssessment, exportReadingReport, exportStudentAssessmentWorkbook, feedback,
    finishElBenchmarkAssessment, guidedInitialBookId, guidedReadingRecords, handleAssessmentEvidenceImageError,
    isAdmin, isStudentSurfaceView, isTeacherAccountApproved, itemMastery,
    keepPracticingSkill, learnFullscreen, learnerAccessibility, letterAssessment, letterIndex,
    letterItems, loadAdminDashboard, loadClassDashboard, loadStudentProgress, loadStudents, loadingClasses,
    loadingStudents,
    logInDemoTeacher, logInTeacher, logOutStudent, logOutTeacher, mastery,
    message, moveToNextCheckpointSkill, nameSaved, newClassName, normalizeApprovalStatus,
    openAdminDashboard, openStudentPreview, patternAssessment, patternIndex, patternItems, pickQuestion,
    prefersReducedMotion, profileLoaded, questionBankCoverage, recordLetterResult, recordPatternResult,
    regenerateClassCode, renderLearnFullscreenButton, reportSkillMasterySummary, reportsAssessmentHistory, requestPasswordReset, resetLetterAssessment,
    resetPatternAssessment, resetProgressDialogOpen, resetSelectedStudentProgress, resetStudent, resetStudentSymbolPassword, resettingProgress,
    resumeElBenchmarkAssessment, retryCheckpointSkill, returnFromElBenchmarkAssessment, returnFromStudentPreview, returnToStudentHome, returnToTeacherDashboard,
    returnFromCheck, reviewInitialSoundLevelOne, roundAnswers, saveElBenchmarkPartialAndExit, saveGuidedReadingRecord, saveTeacherSchool, selectedClassId,
    selectedStudentEvidenceReadState, sessionMode, setAdminConfirm, setAdminConfirmBusy, setAllowPassageAudio,
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
    totalAnswered, updateElBenchmarkSession, updateStudentName, updateStudentSymbolPassword, updateTeacherAccountStatus, weaknessSnapshot,
    assignMissingSymbolPasswords
  } = surface;

  // Which setup step the teacher pressed "Continue" on over on Today. Students
  // picks it up once, opens the right control, then clears it.
  const [setupFocus, setSetupFocus] = useState("");

  // ONE CLICK TO A CHECK.
  //
  // Starting a check used to be four screens: Checks → a card menu → a student
  // picker → a per-student dashboard with a start button next to a red reset
  // button. Every roster row, the Student panel and the Today briefing now call
  // this instead. loadStudentProgress hands back the skill it worked out, so the
  // check opens at the right level without waiting for a re-render.
  async function startCheckForStudent(student) {
    if (!student?.id) return;
    const context = await loadStudentProgress(student.id, student.name, { navigate: false });
    await startAssessment(context?.skillIndex);
  }

  // Row-level actions can target a student who is not the selected one.
  async function selectStudentIfNeeded(student) {
    if (!student?.id || student.id === studentId) return;
    await loadStudentProgress(student.id, student.name, { navigate: false });
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
                <li><span className="auth-hero-feature-dot" aria-hidden="true"/>Quick skill checks</li>
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
  const isFocusedAssessment = isFocusedAssessmentView(appView);
  const effectiveAssessmentFullscreen = isFocusedAssessment && assessmentFullscreen;
  const isStudentMode = sessionMode === "student";
  const hasTeacherSchool = Boolean(teacherAccountRecord?.school_id || teacherSchoolName);
  const isFocusedShell = isStudentMode || appView === APP_VIEWS.STUDENT_LOGIN || isFocusedAssessment || (isStudentSurfaceView && learnFullscreen);
  // A teacher previewing a student surface (Student Page, Guided Reading, Story
  // Quests, Phonics, Adventure, Hollow) needs the student-facing CSS scope so the
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
    appView === APP_VIEWS.STUDENT_LOGIN ? "student-login-app-shell" : "",
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
    pushRouteHash(nextHash);
    setAppView(nextView);
  };
  // The Reports funnel keeps the teacher on one page, so the report styles in
  // the report's own left rail must link back into the funnel rather than off
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
        buildReportHref={options.buildReportHref || (view => (
          teacherReportHash(selectedClassId, studentId, view)
        ))}
        onReportViewChange={options.onReportViewChange}
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

  const railActions = {
    sounds: () => { setStudentArcadeOpen(false); setAppView(APP_VIEWS.PHONICS_QUEST); },
    phonics: () => { setStudentArcadeOpen(false); setAppView(APP_VIEWS.PHONICS_LEARN); },
    map: () => { setStudentArcadeOpen(false); setAppView(APP_VIEWS.SKILLS_BLOCK_QUEST); },
    books: () => { setStudentArcadeOpen(false); setGuidedInitialBookId(""); setAppView(APP_VIEWS.GUIDED_READING); },
    stories: () => { setStudentArcadeOpen(false); setAppView(APP_VIEWS.LEARN); },
    arcade: () => { setStudentArcadeOpen(true); setAppView(APP_VIEWS.PHONICS_LEARN); },
    hollow: () => { setStudentArcadeOpen(false); setAppView(APP_VIEWS.STUDENT_REWARDS); }
  };
  const railNav = STUDENT_RAIL_DESTINATIONS.map(item => ({
    ...item,
    go: railActions[item.id]
  }));
  // Wraps a menu sub-page so it keeps the rail. Fullscreen mode still strips
  // it — a student who asked for fullscreen asked for the content, not the menu.
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
      <div className={appShellClassName}>
      {!isSupabaseConfigured && !isStudentMode && (
        <div className="supabase-config-banner" role="alert">
          <strong>Nothing is being saved.</strong> Cloud storage is not connected.
          Ask the person who manages this app to check the deployment settings.
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
                onExit={() => setAppView(isStudentMode ? APP_VIEWS.STUDENT_HOME : APP_VIEWS.TEACHER_CLASSES)}
              />
            </Suspense>
          ))}
        </PageBoundary>
      )}

      {/* Sound Seekers. Lazy: it is a whole mode, and a student who never opens it
          should not pay for it on first load. */}
      {appView === APP_VIEWS.PHONICS_QUEST && nameSaved && (
        <PageBoundary resetKey={`phonics-quest-${studentId}`}>
          <Suspense fallback={<LazyPageFallback label="Loading Sound Seekers..." />}>
            <QuestRoot
              progressScopeKey={studentId || studentName || "default"}
              accessibilitySettings={learnerAccessibility}
              onExit={() => setAppView(isStudentMode ? APP_VIEWS.STUDENT_HOME : APP_VIEWS.TEACHER_CLASSES)}
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
        || appView === APP_VIEWS.SELECT
      ) && (
        <PageBoundary resetKey="teacher-today">
          <Suspense fallback={<LazyPageFallback label="Loading dashboard..." />}>
            <TeacherTodayPage
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
              loadingStudents={loadingStudents}
              loadStudents={loadStudents}
              loadClassDashboard={loadClassDashboard}
              classDashboard={classDashboard}
              onLoadStudent={async (id, name) => {
                const loadPromise = loadStudentProgress(id, name, { navigate: false });
                setAppView(APP_VIEWS.TEACHER_CLASSES);
                await loadPromise;
              }}
              onStartCheck={startCheckForStudent}
              onOpenClasses={openStudentsPage}
              onOpenProgress={() => goToTeacherIntent(APP_VIEWS.REPORTS)}
              createDemoClass={createDemoClass}
              teacherId={teacherId}
              schoolName={teacherSchoolName}
              hasSchool={hasTeacherSchool}
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
              setReducedChoiceMode={setStudentReducedChoiceMode}
              setAccessibilitySettings={setStudentAccessibilitySettings}
              onLoadStudent={(id, name) => loadStudentProgress(id, name, { navigate: false })}
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
              onOpenReport={() => openStudentReport(studentId)}
              onOpenGuidedReading={() => {
                setGuidedInitialBookId("");
                setAppView(APP_VIEWS.GUIDED_READING);
              }}
              onOpenStoryQuests={() => openStudentPreview(APP_VIEWS.LEARN)}
              onOpenElFormalCheck={async student => {
                await selectStudentIfNeeded(student);
                goToTeacherIntent(APP_VIEWS.ASSESSMENTS);
              }}
              onResetCheckData={async student => {
                await selectStudentIfNeeded(student);
                setResetProgressDialogOpen(true);
              }}
              createClass={createClass}
              createDemoClass={createDemoClass}
              newClassName={newClassName}
              setNewClassName={setNewClassName}
              createStudent={name => createStudentForSelectedClass(name, { navigate: false })}
              teacherId={teacherId}
              classDashboard={classDashboard}
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
              className={getSelectedClassName(classList, selectedClassId)}
              classList={classList}
              selectedClassId={selectedClassId}
              loadingClasses={loadingClasses}
              onSelectClass={selectTeacherClass}
              studentName={nameSaved ? studentName : ""}
              onOpenWorksheets={() => setAppView(APP_VIEWS.WORKSHEETS)}
              onOpenPresent={() => setAppView(APP_VIEWS.PRESENT)}
              onOpenClasses={() => setAppView(APP_VIEWS.TEACHER_CLASSES)}
              progressRows={classDashboard}
              selectedLearnerId={nameSaved ? studentId : ""}
              onSelectLearner={(id, name) => loadStudentProgress(id, name, { navigate: false })}
              onClearLearner={clearSelectedLearner}
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
              selectedClassId={selectedClassId}
              onSelectClass={selectTeacherClass}
              studentList={studentList}
              archivedStudentList={archivedStudentList}
              schoolName={teacherSchoolName}
              onSaveSchool={saveTeacherSchool}
              onRegenerateClassCode={regenerateClassCode}
              onReloadStudents={loadStudents}
              teacherEmail={teacherUser.email}
              onSignOut={logOutTeacher}
            />
          </Suspense>
        </PageBoundary>
      )}

      {sessionMode !== "student" && appView === APP_VIEWS.ASSESSMENTS && (
        <PageBoundary resetKey="teacher-assessments">
          {funnelFeedback}
          <Suspense fallback={<LazyPageFallback label="Loading checks..." />}>
            <TeacherAssessmentsPage
              classList={classList}
              selectedClassId={selectedClassId}
              className={getSelectedClassName(classList, selectedClassId)}
              onSelectClass={selectTeacherClass}
              onOpenClasses={openStudentsPage}
              studentRows={classDashboard}
              studentList={studentList}
              loadingClasses={loadingClasses}
              loadingStudents={loadingStudents}
              selectedStudentId={nameSaved ? studentId : ""}
              selectedStudentName={nameSaved ? studentName : ""}
              onSelectStudent={(id, name) => loadStudentProgress(id, name, { navigate: false })}
              onClearStudent={clearSelectedLearner}
              firstUnsecuredSkillIndex={currentSkillIndex}
              assessmentHistory={assessmentHistory.filter(record => record.studentId === studentId)}
              elBenchmarkDraft={elBenchmarkSession?.studentId === studentId ? elBenchmarkSession : null}
              onResumeDraft={resumeElBenchmarkAssessment}
              onDiscardDraft={discardElBenchmarkDraft}
              onStartSkillCheck={stageIndex => startAssessment(stageIndex)}
              onStartLetterCheck={startLetterAssessment}
              onStartPhonicsPatternCheck={startAdvancedPhonicsAssessment}
              onStartBenchmark={startElBenchmarkAssessment}
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

      {appView === APP_VIEWS.GUIDED_READING && nameSaved && (
        <PageBoundary resetKey={`guided-reading-${studentId}`}>
          {withStudentRail("books", (
            <GuidedReadingPage
              initialBookId={guidedInitialBookId}
              studentId={studentId}
              studentName={studentName}
              mode={sessionMode === "student" ? "student" : "teacher"}
              autoNarration={sessionMode === "student" && learnerAccessibility.narration}
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

      {sessionMode !== "student" && appView === APP_VIEWS.REPORTS && (
        <PageBoundary resetKey="teacher-reports">
          {funnelFeedback}
          <Suspense fallback={<LazyPageFallback label="Loading reports..." />}>
            <TeacherReportsHubPage
              classList={classList}
              selectedClassId={selectedClassId}
              className={getSelectedClassName(classList, selectedClassId)}
              onSelectClass={selectTeacherClass}
              onOpenChecks={() => goToTeacherIntent(APP_VIEWS.ASSESSMENTS)}
              studentRows={classDashboard}
              studentList={studentList}
              loadingClasses={loadingClasses}
              loadingStudents={loadingStudents}
              selectedStudentId={nameSaved ? studentId : ""}
              selectedStudentName={nameSaved ? studentName : ""}
              onSelectStudent={(id, name) => loadStudentProgress(id, name, { navigate: false })}
              onClearStudent={clearSelectedLearner}
              reportView={studentReportView}
              onSelectReportView={setStudentReportView}
              renderStudentReport={reportView => renderStudentReport(reportView, {
                buildReportHref: reportsFunnelHash,
                onReportViewChange: setStudentReportView
              })}
              renderClassReport={() => (
                <TeacherReportsPage
                  allAssessmentHistory={assessmentHistory}
                  classList={classList}
                  selectedClassId={selectedClassId}
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
        title={adminConfirm?.kind === "class" ? "Delete class?" : "Delete student?"}
        body={adminConfirm?.kind === "class"
          ? `This permanently removes ${adminConfirm?.name || "this class"}, every student in it, and all of their saved results. This cannot be undone.`
          : `This permanently removes ${adminConfirm?.name || "this student"} and all of their saved results. This cannot be undone.`}
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

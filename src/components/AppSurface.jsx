import { Suspense } from "react";
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
  ELAssessmentsPage,
  GuidedReadingPage,
  LetterAssessmentPage,
  SkillsProgressPage,
  StudentOverviewPage,
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
  TeacherDashboardPage,
  TeacherIntentPage,
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
  } = surface;
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
      {...(isStudentMode ? learnerAccessibilityDataAttributes(learnerAccessibility) : {})}
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
      {showConfetti && !prefersReducedMotion && !learnerAccessibility.reducedEffects && (
        <Confetti recycle={false} numberOfPieces={90} />
      )}

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
              accessibilitySettings={learnerAccessibility}
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
              setReducedChoiceMode={setStudentReducedChoiceMode}
              setAccessibilitySettings={setStudentAccessibilitySettings}
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

      {appView === APP_VIEWS.REPORTS && nameSaved && (
        <PageBoundary resetKey={`reports-${studentId}`}>
          <TeacherReportsPage
            studentName={studentName}
            startAssessment={startAssessment}
            viewFinishedReport={viewId => {
              const nextReportView = viewId || "whole-child";
              setStudentReportView(nextReportView);
              pushRouteHash(teacherReportHash(selectedClassId, studentId, nextReportView));
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
            onEvidenceImageError={handleAssessmentEvidenceImageError}
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
              buildReportHref={reportView => (
                teacherReportHash(selectedClassId, studentId, reportView)
              )}
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

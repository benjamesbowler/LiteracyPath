import { ErrorBoundary } from "../components/ErrorBoundary.jsx";
import { TEACHER_COPY } from "../copy/teacherCopy.js";
import { lazyWithRetry } from "../utils/lazyWithRetry.js";
import { loadFinishedReportPageModule } from "./appRuntimeServices.js";

// dynamic mastery system

// Sound Seekers: a whole mode, lazy so a child who never opens it doesn't pay
// for it on first load. Default export, unlike the named-export pages below.
export const QuestRoot = lazyWithRetry(() => import("../components/quest/QuestRoot.jsx"));

// Whole student modes: lazy so their engines (elQuest, the Hollow/rewards
// surface) drop out of the initial App bundle and only load when a child opens
// them.
export const ElSkillsQuest = lazyWithRetry(() =>
  import("../components/elQuest/ElSkillsQuest.jsx").then(module => ({
    default: module.ElSkillsQuest
  }))
);
export const CyclePracticePage = lazyWithRetry(() =>
  import("../components/cycle-practice/CyclePracticePage.jsx").then(module => ({
    default: module.CyclePracticePage
  }))
);
export const HollowPage = lazyWithRetry(() =>
  import("../components/HollowPage.jsx").then(module => ({
    default: module.HollowPage
  }))
);

// Teacher-only pages: lazy so the student bundle never downloads them.
export const TeacherTodayPage = lazyWithRetry(() =>
  import("../components/TeacherTodayPage.jsx").then(module => ({
    default: module.TeacherTodayPage
  }))
);
export const TeacherStudentsPage = lazyWithRetry(() =>
  import("../components/TeacherStudentsPage.jsx").then(module => ({
    default: module.TeacherStudentsPage
  }))
);
export const LazyActionFeedback = lazyWithRetry(() =>
  import("../components/ActionFeedback.jsx").then(module => ({
    default: module.ActionFeedback
  }))
);
export const Sidebar = lazyWithRetry(() =>
  import("../components/Sidebar.jsx").then(module => ({
    default: module.Sidebar
  }))
);
export const TeacherIntentPage = lazyWithRetry(() =>
  import("../components/teacher/TeacherIntentPage.jsx").then(module => ({
    default: module.TeacherIntentPage
  }))
);
export const TeacherSettingsPage = lazyWithRetry(() =>
  import("../components/teacher/TeacherSettingsPage.jsx").then(module => ({
    default: module.TeacherSettingsPage
  }))
);
export const ConfirmActionDialog = lazyWithRetry(() =>
  import("../components/teacher/TeacherAdminDialogs.jsx").then(module => ({
    default: module.ConfirmActionDialog
  }))
);
export const ResetStudentProgressDialog = lazyWithRetry(() =>
  import("../components/teacher/TeacherAdminDialogs.jsx").then(module => ({
    default: module.ResetStudentProgressDialog
  }))
);
export const WorksheetGeneratorPage = lazyWithRetry(() =>
  import("../components/WorksheetGeneratorPage.jsx").then(module => ({
    default: module.WorksheetGeneratorPage
  }))
);
export const PresentPage = lazyWithRetry(() =>
  import("../components/PresentPage.jsx").then(module => ({
    default: module.PresentPage
  }))
);
export const AdminDashboardPage = lazyWithRetry(() =>
  import("@/components/AdminDashboardPage").then(module => ({
    default: module.AdminDashboardPage
  }))
);
export const ELBenchmarkAssessmentPage = lazyWithRetry(() =>
  import("../components/assessment/ELBenchmarkAssessmentPage.jsx").then(module => ({
    default: module.ELBenchmarkAssessmentPage
  }))
);
export const TeacherAssessmentsPage = lazyWithRetry(() =>
  import("../components/TeacherAssessmentsPage.jsx").then(module => ({
    default: module.TeacherAssessmentsPage
  }))
);
export const TeacherReportsHubPage = lazyWithRetry(() =>
  import("../components/TeacherReportsHubPage.jsx").then(module => ({
    default: module.TeacherReportsHubPage
  }))
);

// The student view allowlist now lives in appState/appViewHelpers.js (exported,
// and held against the Student Home's own links by a unit test). It was a
// private Set here, and that is precisely how Sound Seekers shipped with a
// button that bounced straight back to the home screen: the guard only runs in
// student mode, so it was invisible to every teacher-side check we had.

export const FinishedReportPage = lazyWithRetry(() =>
  loadFinishedReportPageModule().then(module => ({
    default: module.FinishedReportPage
  }))
);

export const LearnAreaPage = lazyWithRetry(() =>
  import("@/components/LearnAreaPage").then(module => ({
    default: module.LearnAreaPage
  }))
);

// The two phase-D front doors (2026-07-29). Lazy for the same reason the
// surfaces above are: each one statically imports a large content dataset —
// 176 guided-reading books, 13 branching story quests — that the app already
// code-splits on purpose (appRuntimeServices.loadGuidedReadingBooksModule).
// Importing them eagerly from AppSurface would have quietly put ~290KB of book
// and story text back into the first load for every child and every teacher.
export const StudentBooksPage = lazyWithRetry(() =>
  import("@/components/StudentBooksPage").then(module => ({
    default: module.StudentBooksPage
  }))
);

export const StudentStoryQuestsPage = lazyWithRetry(() =>
  import("@/components/StudentStoryQuestsPage").then(module => ({
    default: module.StudentStoryQuestsPage
  }))
);

export const PhonicsLearnPage = lazyWithRetry(() =>
  import("@/components/PhonicsLearnPage").then(module => ({
    default: module.PhonicsLearnPage
  }))
);

export const AppSurface = lazyWithRetry(() =>
  import("../components/AppSurface.jsx").then(module => ({
    default: module.AppSurface
  }))
);

export function NewVersionAvailableCard({ message = "A new version is available." }) {
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

export function PageErrorFallback() {
  return (
    <div className="card page-card page-stack error-boundary-fallback">
      <h2>We couldn&apos;t load this page.</h2>
      <p>Your data is safe. Make sure you&apos;re online, then try again.</p>
      <button className="main-button" type="button" onClick={() => window.location.reload()}>
        Try again
      </button>
    </div>
  );
}

export function PageBoundary({ children, resetKey }) {
  return (
    <ErrorBoundary resetKey={resetKey} fallback={<PageErrorFallback />}>
      {children}
    </ErrorBoundary>
  );
}

export function AssessmentErrorBoundary({ children, resetKey, returnToStudentOverview, isTransient = false }) {
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
                <h2>Getting the next question ready…</h2>
                {import.meta.env.DEV && <p className="muted-text">{error.message}</p>}
              </>
            ) : (
              <>
                <h2>{TEACHER_COPY.errors.checkPaused}</h2>
                <p>{TEACHER_COPY.errors.checkPausedHelp}</p>
                {import.meta.env.DEV && <p>{error.message}</p>}
                <button className="main-button" onClick={returnToStudentOverview} type="button">
                  Return to student overview
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

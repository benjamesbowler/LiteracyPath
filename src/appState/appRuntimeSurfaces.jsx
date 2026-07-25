import { ErrorBoundary } from "../components/ErrorBoundary.jsx";
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
export const HollowPage = lazyWithRetry(() =>
  import("../components/HollowPage.jsx").then(module => ({
    default: module.HollowPage
  }))
);

// Teacher-only pages: lazy so the student bundle never downloads them.
export const TeacherDashboardPage = lazyWithRetry(() =>
  import("../components/TeacherDashboardPage.jsx").then(module => ({
    default: module.TeacherDashboardPage
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
export const ELAssessmentsPage = lazyWithRetry(() =>
  import("../components/assessment/ELAssessmentsPage.jsx").then(module => ({
    default: module.ELAssessmentsPage
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
      <h2>Something went wrong.</h2>
      <p>Please refresh or go back.</p>
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

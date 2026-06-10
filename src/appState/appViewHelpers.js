import { APP_VIEWS } from "./appViews.js";

const FOCUSED_ASSESSMENT_VIEWS = new Set([
  APP_VIEWS.ASSESSMENT,
  APP_VIEWS.CHECKPOINT,
  APP_VIEWS.LETTERS,
  APP_VIEWS.ADVANCED_PHONICS
]);

const PRIMARY_SHELL_VIEWS = new Set([
  APP_VIEWS.SELECT,
  APP_VIEWS.ADMIN_DASHBOARD,
  APP_VIEWS.TEACHER_DASHBOARD,
  APP_VIEWS.LEARN,
  APP_VIEWS.OVERVIEW,
  APP_VIEWS.SKILLS,
  APP_VIEWS.EL_ASSESSMENTS,
  APP_VIEWS.GUIDED_READING,
  APP_VIEWS.PHONICS_LEARN,
  APP_VIEWS.REPORTS
]);

const FOOTER_HIDDEN_VIEWS = new Set([
  APP_VIEWS.SELECT,
  APP_VIEWS.OVERVIEW,
  APP_VIEWS.SKILLS,
  APP_VIEWS.EL_ASSESSMENTS,
  APP_VIEWS.GUIDED_READING,
  APP_VIEWS.PHONICS_LEARN,
  APP_VIEWS.REPORTS,
  APP_VIEWS.ADMIN_DASHBOARD,
  APP_VIEWS.TEACHER_DASHBOARD,
  APP_VIEWS.LEARN,
  APP_VIEWS.FINISHED
]);

export function isFocusedAssessmentView(appView) {
  return FOCUSED_ASSESSMENT_VIEWS.has(appView);
}

export function shouldShowDashboardSummary({ appView, isFocusedAssessment = false } = {}) {
  return !isFocusedAssessment && !PRIMARY_SHELL_VIEWS.has(appView);
}

export function shouldShowFooterUtilityActions({ appView, isFocusedAssessment = false } = {}) {
  return !isFocusedAssessment && !FOOTER_HIDDEN_VIEWS.has(appView);
}

export function getRestoredAppView({ restoredStudentId, storedAppView } = {}) {
  if (!restoredStudentId) return APP_VIEWS.SELECT;
  if (storedAppView === "tools") return APP_VIEWS.OVERVIEW;
  return Object.values(APP_VIEWS).includes(storedAppView) ? storedAppView : APP_VIEWS.OVERVIEW;
}

export function getPersistedAppView({ studentId, appView } = {}) {
  if (!studentId) return APP_VIEWS.SELECT;
  return Object.values(APP_VIEWS).includes(appView) ? appView : APP_VIEWS.OVERVIEW;
}

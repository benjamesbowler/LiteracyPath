import { APP_VIEWS } from "./appViews.js";

const FOCUSED_ASSESSMENT_VIEWS = new Set([
  APP_VIEWS.ASSESSMENT,
  APP_VIEWS.CHECKPOINT,
  APP_VIEWS.LETTERS,
  APP_VIEWS.ADVANCED_PHONICS
]);

const PRIMARY_SHELL_VIEWS = new Set([
  APP_VIEWS.ADMIN_DASHBOARD,
  APP_VIEWS.TEACHER_DASHBOARD,
  APP_VIEWS.LEARN,
  APP_VIEWS.OVERVIEW,
  APP_VIEWS.SKILLS,
  APP_VIEWS.EL_ASSESSMENTS,
  APP_VIEWS.GUIDED_READING,
  APP_VIEWS.REPORTS,
  APP_VIEWS.TOOLS
]);

const FOOTER_HIDDEN_VIEWS = new Set([
  APP_VIEWS.OVERVIEW,
  APP_VIEWS.SKILLS,
  APP_VIEWS.EL_ASSESSMENTS,
  APP_VIEWS.GUIDED_READING,
  APP_VIEWS.REPORTS,
  APP_VIEWS.TOOLS,
  APP_VIEWS.ADMIN_DASHBOARD,
  APP_VIEWS.TEACHER_DASHBOARD,
  APP_VIEWS.LEARN
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
  return restoredStudentId ? storedAppView || APP_VIEWS.OVERVIEW : APP_VIEWS.SELECT;
}

export function getPersistedAppView({ studentId, appView } = {}) {
  return studentId ? appView : APP_VIEWS.SELECT;
}

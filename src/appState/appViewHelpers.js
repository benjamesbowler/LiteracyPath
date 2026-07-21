import { APP_VIEWS } from "./appViews.js";

const FOCUSED_ASSESSMENT_VIEWS = new Set([
  APP_VIEWS.ASSESSMENT,
  APP_VIEWS.CHECKPOINT,
  APP_VIEWS.LETTERS,
  APP_VIEWS.ADVANCED_PHONICS,
  APP_VIEWS.EL_BENCHMARK
]);

// EVERY view a logged-in STUDENT is allowed to be on.
//
// This used to live as a private Set inside App.jsx, and it is a trapdoor: any
// view NOT on this list gets silently bounced back to Student Home on the next
// tick, which looks exactly like "I tap the button and the page flashes". A
// teacher previewing the same view sees no problem at all, because the guard
// only runs in student mode — so the bug hides from everyone who isn't a child.
//
// It lives here now so a unit test can hold it against the set of views the
// Student Home actually links to. Add a student-facing view without adding it
// here and tests/unit/appViewHelpers.test.js goes red.
export const STUDENT_ALLOWED_VIEWS = new Set([
  APP_VIEWS.STUDENT_HOME,
  APP_VIEWS.STUDENT_REWARDS,
  APP_VIEWS.PHONICS_LEARN,
  APP_VIEWS.SKILLS_BLOCK_QUEST,
  APP_VIEWS.PHONICS_QUEST,
  APP_VIEWS.LEARN,
  APP_VIEWS.GUIDED_READING
]);

export function isStudentAllowedView(appView) {
  return STUDENT_ALLOWED_VIEWS.has(appView);
}

const PRIMARY_SHELL_VIEWS = new Set([
  APP_VIEWS.SELECT,
  APP_VIEWS.ADMIN_DASHBOARD,
  APP_VIEWS.TEACHER_DASHBOARD,
  APP_VIEWS.STUDENT_HOME,
  APP_VIEWS.LEARN,
  APP_VIEWS.SKILLS_BLOCK_QUEST,
  APP_VIEWS.PHONICS_QUEST,
  APP_VIEWS.OVERVIEW,
  APP_VIEWS.SKILLS,
  APP_VIEWS.EL_ASSESSMENTS,
  APP_VIEWS.GUIDED_READING,
  APP_VIEWS.PHONICS_LEARN,
  APP_VIEWS.REPORTS,
  APP_VIEWS.WORKSHEETS,
  APP_VIEWS.PRESENT
]);

const FOOTER_HIDDEN_VIEWS = new Set([
  APP_VIEWS.SELECT,
  APP_VIEWS.OVERVIEW,
  APP_VIEWS.SKILLS,
  APP_VIEWS.EL_ASSESSMENTS,
  APP_VIEWS.GUIDED_READING,
  APP_VIEWS.PHONICS_LEARN,
  APP_VIEWS.REPORTS,
  APP_VIEWS.WORKSHEETS,
  APP_VIEWS.PRESENT,
  APP_VIEWS.ADMIN_DASHBOARD,
  APP_VIEWS.TEACHER_DASHBOARD,
  APP_VIEWS.STUDENT_HOME,
  APP_VIEWS.LEARN,
  APP_VIEWS.SKILLS_BLOCK_QUEST,
  APP_VIEWS.PHONICS_QUEST,
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

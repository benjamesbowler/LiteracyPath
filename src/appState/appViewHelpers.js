import { APP_VIEWS } from "./appViews.js";
import { canonicalTeacherSettingsRoutePath } from "./teacherSettingsRoutes.js";

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
  APP_VIEWS.CYCLE_PRACTICE,
  APP_VIEWS.GUIDED_READING
]);

export function isStudentAllowedView(appView, focusSession = null) {
  if (
    focusSession?.status === "active"
    && focusSession?.target === "skills_assessment"
    && [APP_VIEWS.ASSESSMENT, APP_VIEWS.CHECKPOINT].includes(appView)
  ) return true;
  return STUDENT_ALLOWED_VIEWS.has(appView);
}

// ── WHERE THE LIVE-SESSION STRIP IS ALLOWED ────────────────────────────────
//
// The strip under DashboardSummary reports THIS sitting on THIS device: round
// progress and session accuracy, which reset on reload. It used to be gated by
// omission - shown on any view that had not been added to a "primary shell"
// list - so the saved report route inherited it by accident and a teacher read
// "Round 0/15 · Session accuracy 95%" printed above a saved report that said
// something else. The metric definitions themselves warn those numbers will not
// match a saved report.
//
// An allow list cannot make that mistake: a new view shows the strip only when
// somebody puts it here on purpose.
const DASHBOARD_SUMMARY_VIEWS = new Set([
  APP_VIEWS.CHECKPOINT
]);

const FOOTER_HIDDEN_VIEWS = new Set([
  APP_VIEWS.SELECT,
  APP_VIEWS.ASSESSMENTS,
  APP_VIEWS.GUIDED_READING,
  APP_VIEWS.PHONICS_LEARN,
  APP_VIEWS.REPORTS,
  APP_VIEWS.WORKSHEETS,
  APP_VIEWS.PRESENT,
  APP_VIEWS.TEACHER_GUIDED_READING,
  APP_VIEWS.ADMIN_DASHBOARD,
  APP_VIEWS.TEACHER_DASHBOARD,
  APP_VIEWS.TEACHER_CLASSES,
  APP_VIEWS.TEACHER_RESOURCES,
  APP_VIEWS.TEACHER_SETTINGS,
  APP_VIEWS.STUDENT_HOME,
  APP_VIEWS.LEARN,
  APP_VIEWS.CYCLE_PRACTICE,
  APP_VIEWS.SKILLS_BLOCK_QUEST,
  APP_VIEWS.PHONICS_QUEST,
  APP_VIEWS.FINISHED
]);

// Views a teacher can sit on, and be restored to, without a student selected.
// Both funnels belong here: each one starts by asking for a class, so landing
// on step 1 with nothing chosen is the correct restored state.
const TEACHER_INTENTION_VIEWS = new Set([
  APP_VIEWS.TEACHER_DASHBOARD,
  APP_VIEWS.TEACHER_CLASSES,
  APP_VIEWS.ASSESSMENTS,
  APP_VIEWS.REPORTS,
  APP_VIEWS.TEACHER_RESOURCES,
  APP_VIEWS.TEACHER_SETTINGS,
  APP_VIEWS.WORKSHEETS,
  APP_VIEWS.PRESENT,
  APP_VIEWS.TEACHER_GUIDED_READING
]);

export function isFocusedAssessmentView(appView) {
  return FOCUSED_ASSESSMENT_VIEWS.has(appView);
}

export function shouldShowDashboardSummary({ appView } = {}) {
  return DASHBOARD_SUMMARY_VIEWS.has(appView);
}

export function shouldShowFooterUtilityActions({ appView, isFocusedAssessment = false } = {}) {
  return !isFocusedAssessment && !FOOTER_HIDDEN_VIEWS.has(appView);
}

export function shouldOpenDefaultTeacherRoute({
  appView,
  authReady,
  isApproved,
  profileLoaded,
  profileLoadedTeacherId,
  teacherUserId
} = {}) {
  return Boolean(
    authReady
    && isApproved
    && profileLoaded
    && teacherUserId
    && profileLoadedTeacherId === teacherUserId
    && appView === APP_VIEWS.SELECT
  );
}

export function shouldApplyRestoredAppView({
  currentNavigationRevision,
  restoreNavigationRevision
} = {}) {
  return Number.isInteger(currentNavigationRevision)
    && Number.isInteger(restoreNavigationRevision)
    && currentNavigationRevision === restoreNavigationRevision;
}

export function getRestoredAppView({ restoredStudentId, storedAppView } = {}) {
  if (!restoredStudentId) {
    return TEACHER_INTENTION_VIEWS.has(storedAppView)
      ? storedAppView
      : APP_VIEWS.SELECT;
  }
  const legacyTeacherModuleRedirects = {
    // "tools", "overview" and "teacherAssess" are retired view names still sitting
    // in older saved sessions. Checks now start from the roster, so they all land
    // on Students rather than on a page that no longer exists.
    tools: APP_VIEWS.TEACHER_CLASSES,
    overview: APP_VIEWS.TEACHER_CLASSES,
    // "teacherAssess" and "elAssessments" are retired view names still sitting
    // in older saved sessions. Checks have their own section again, so both
    // land there instead of on the roster.
    teacherAssess: APP_VIEWS.ASSESSMENTS,
    elAssessments: APP_VIEWS.ASSESSMENTS,
    // "teacherProgress" was the report picker. The Reports funnel absorbed it.
    teacherProgress: APP_VIEWS.REPORTS,
    [APP_VIEWS.STUDENT_HOME]: APP_VIEWS.TEACHER_CLASSES,
    [APP_VIEWS.FINISHED]: APP_VIEWS.REPORTS,
    [APP_VIEWS.GUIDED_READING]: APP_VIEWS.TEACHER_RESOURCES,
    [APP_VIEWS.LEARN]: APP_VIEWS.TEACHER_RESOURCES,
    [APP_VIEWS.PHONICS_LEARN]: APP_VIEWS.TEACHER_RESOURCES
  };
  if (legacyTeacherModuleRedirects[storedAppView]) {
    return legacyTeacherModuleRedirects[storedAppView];
  }
  return Object.values(APP_VIEWS).includes(storedAppView) ? storedAppView : APP_VIEWS.TEACHER_CLASSES;
}

export function getPersistedAppView({ studentId, appView } = {}) {
  if (!studentId) {
    return TEACHER_INTENTION_VIEWS.has(appView)
      ? appView
      : APP_VIEWS.SELECT;
  }
  return Object.values(APP_VIEWS).includes(appView) ? appView : APP_VIEWS.TEACHER_CLASSES;
}

// The inverse of the parse map. It is deliberately smaller: several old paths
// still parse, but only one path per view is ever written back to the URL.
const TEACHER_INTENT_PATHS = Object.freeze({
  [APP_VIEWS.SELECT]: "dashboard",
  [APP_VIEWS.TEACHER_DASHBOARD]: "dashboard",
  [APP_VIEWS.TEACHER_CLASSES]: "children",
  [APP_VIEWS.ASSESSMENTS]: "assessments",
  [APP_VIEWS.REPORTS]: "reports",
  [APP_VIEWS.TEACHER_RESOURCES]: "resources",
  [APP_VIEWS.WORKSHEETS]: "resources/worksheets",
  [APP_VIEWS.PRESENT]: "resources/present",
  [APP_VIEWS.TEACHER_GUIDED_READING]: "resources/guided-reading",
  [APP_VIEWS.TEACHER_SETTINGS]: "settings",
  [APP_VIEWS.FINISHED]: "reports/report"
});

// Sections that are about a whole class, so the URL carries no group or learner.
const CLASS_ONLY_INTENTS = [
  "dashboard",
  "resources",
  "resources/worksheets",
  "resources/present",
  "resources/guided-reading",
  "settings"
];

export function teacherIntentHash({
  appView,
  classId = "",
  groupId = "all",
  learnerId = "",
  reportView = "whole-child"
} = {}) {
  const intent = TEACHER_INTENT_PATHS[appView];
  if (!intent) return "";
  if (appView === APP_VIEWS.FINISHED && (!classId || !learnerId)) return "";

  const context = new URLSearchParams();
  if (classId) context.set("class", classId);
  if (appView === APP_VIEWS.FINISHED) {
    context.set("learner", learnerId);
    context.set("report", reportView);
    return `#teacher/${intent}?${context.toString()}`;
  }
  if (!CLASS_ONLY_INTENTS.includes(intent)) {
    context.set("group", groupId || "all");
    if (learnerId) context.set("learner", learnerId);
  }
  return `#teacher/${intent}${context.size ? `?${context.toString()}` : ""}`;
}

// ── KEEPING A FUNNEL'S PLACE IN THE URL ─────────────────────────────────────
//
// Both funnels park their extra steps in the query string (which check, which
// starting point, which report style) so a refresh mid-flow keeps the teacher's
// place. The appView -> URL mirror would otherwise overwrite that with the bare
// section hash on the very next render. It only needs to rewrite the URL when
// the section, class, group or student has actually changed - so that is what
// this compares, and everything else in the query is left alone.
export function isSameTeacherRoute(currentHash = "", nextHash = "") {
  if (!currentHash || !nextHash) return false;
  const [currentPath, currentQuery = ""] = String(currentHash).replace(/^#/, "").split("?");
  const [nextPath, nextQuery = ""] = String(nextHash).replace(/^#/, "").split("?");
  // Settings owns four real sub-pages. The app-level mirror only knows that
  // the current React view is Settings, so its fallback hash is the bare
  // `teacher/settings` route. Treat a valid Settings sub-page as the same
  // route identity or every unrelated re-render replaces its bookmarkable
  // URL and a reload silently falls back to School information.
  if (
    canonicalTeacherSettingsRoutePath(currentPath)
    !== canonicalTeacherSettingsRoutePath(nextPath)
  ) return false;
  const current = new URLSearchParams(currentQuery);
  const next = new URLSearchParams(nextQuery);
  // A live EL assessment is not a chooser funnel: its session and item are
  // resumable route state. Treating item 1 and item 4 as the same route left
  // the address stale while the assessment advanced, so refresh reopened the
  // wrong item.
  const contextKeys = currentPath === "teacher/checks/el-benchmark"
    ? ["class", "learner", "assessment", "session", "item"]
    : ["class", "group", "learner"];
  return contextKeys.every(key => (
    (current.get(key) || "") === (next.get(key) || "")
  ));
}

// Both funnels park their later steps in the query string beside the class and
// student. These two keep that in one place so the two pages cannot drift.
export function readTeacherFunnelParams(hash) {
  const source = typeof hash === "string"
    ? hash
    : typeof window === "undefined" ? "" : window.location.hash;
  const [, query = ""] = String(source || "").replace(/^#/, "").split("?");
  return new URLSearchParams(query);
}

// A history navigation temporarily puts class and roster reads back into their
// loading states. That is not a new funnel answer, so it must not erase the
// report named by the address while ownership is being re-confirmed.
export function shouldWriteTeacherReportFunnelParams({
  classReadComplete = false,
  rosterReadComplete = false,
  who = ""
} = {}) {
  if (!classReadComplete) return false;
  return !who || rosterReadComplete;
}

const TEACHER_FUNNEL_ROUTE_PATHS = new Set([
  "teacher/assessments",
  "teacher/assess",
  "teacher/checks",
  "teacher/reports",
  "teacher/progress",
  "teacher/reports/class"
]);

export function writeTeacherFunnelParams(patch = {}) {
  if (typeof window === "undefined") return "";
  const [path, query = ""] = String(window.location.hash || "").replace(/^#/, "").split("?");
  if (!path) return "";
  // This helper belongs to the two chooser funnels. During a retryable
  // deep-link read, the Reports chooser is the safe visible fallback while
  // the exact standalone report address must remain untouched. Without this
  // boundary its mount effect deleted `report=...` before retry could succeed.
  if (!TEACHER_FUNNEL_ROUTE_PATHS.has(path)) return window.location.hash;
  const params = new URLSearchParams(query);
  Object.entries(patch).forEach(([key, value]) => {
    if (value === "" || value === null || value === undefined) params.delete(key);
    else params.set(key, String(value));
  });
  const nextHash = `#${path}${params.size ? `?${params.toString()}` : ""}`;
  if (window.location.hash !== nextHash) {
    window.history.replaceState(window.history.state, "", nextHash);
  }
  return nextHash;
}

export function elBenchmarkAssessmentHash({
  classId = "",
  learnerId = "",
  session = null
} = {}) {
  if (!session?.sessionId || !session?.assessmentId || !learnerId) return "";
  const context = new URLSearchParams();
  // Once an assessment exists, its stored class is authoritative. A class
  // switch elsewhere in the teacher shell must not rewrite this route to make
  // the unfinished assessment appear to belong to the newly selected class.
  const sessionClassId = String(session.classId || "").trim();
  const ownedClassId = sessionClassId || classId;
  if (ownedClassId) context.set("class", ownedClassId);
  context.set("learner", learnerId);
  context.set("assessment", session.assessmentId);
  context.set("session", session.sessionId);
  const itemIndex = Math.max(0, Number(session.currentItemIndex ?? session.itemIndex ?? 0) || 0);
  context.set("item", String(itemIndex + 1));
  return `#teacher/checks/el-benchmark?${context.toString()}`;
}

export function parseElBenchmarkAssessmentHash(hash = "") {
  const normalized = String(hash || "").replace(/^#/, "");
  const [path, query = ""] = normalized.split("?");
  if (path !== "teacher/checks/el-benchmark" && path !== "teacher/assess/el-benchmark") return null;
  const params = new URLSearchParams(query);
  const learnerId = params.get("learner") || "";
  const assessmentId = params.get("assessment") || "";
  const sessionId = params.get("session") || "";
  const itemNumber = Number(params.get("item"));
  if (!learnerId || !assessmentId || !sessionId || !Number.isInteger(itemNumber) || itemNumber < 1) {
    return null;
  }
  return {
    classId: params.get("class") || "",
    learnerId,
    assessmentId,
    sessionId,
    currentItemIndex: itemNumber - 1
  };
}

export function restoreElBenchmarkSessionFromHash({
  hash = "",
  session = null,
  studentId = ""
} = {}) {
  const route = parseElBenchmarkAssessmentHash(hash);
  if (
    !route
    || !session
    || route.learnerId !== studentId
    || route.learnerId !== session.studentId
    || route.assessmentId !== session.assessmentId
    || route.sessionId !== session.sessionId
    || (
      route.classId
      && session.classId
      && String(route.classId) !== String(session.classId)
    )
  ) {
    return null;
  }
  return {
    ...session,
    currentItemIndex: route.currentItemIndex,
    itemIndex: route.currentItemIndex
  };
}

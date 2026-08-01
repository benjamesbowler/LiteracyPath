export const ADMIN_QA_HISTORY_STATE = "literacy-path-admin-route";
export const ADMIN_QUESTION_REPORTS_PATH = "/admin/question-flags";

// Admin is a collection of real pages, not one screen with disposable tabs.
// Keep the route inventory beside the parser so desktop tabs, the compact
// picker, cold links and browser history cannot drift onto different pages.
export const ADMIN_SECTION_ROUTES = Object.freeze({
  overview: Object.freeze({
    area: "school",
    path: "/admin/school/overview"
  }),
  signups: Object.freeze({
    area: "school",
    path: "/admin/school/teacher-requests"
  }),
  schools: Object.freeze({
    area: "school",
    path: "/admin/school/schools"
  }),
  teachers: Object.freeze({
    area: "school",
    path: "/admin/school/teachers"
  }),
  classes: Object.freeze({
    area: "school",
    path: "/admin/school/classes"
  }),
  students: Object.freeze({
    area: "school",
    path: "/admin/school/students"
  }),
  teacherReport: Object.freeze({
    area: "school",
    path: "/admin/school/reports"
  }),
  archive: Object.freeze({
    area: "school",
    path: "/admin/school/assessment-records"
  }),
  release: Object.freeze({
    area: "technical",
    path: "/admin/app/readiness"
  }),
  guidedInsight: Object.freeze({
    area: "technical",
    path: "/admin/app/reading-book-checks"
  }),
  guidedMediaQa: Object.freeze({
    area: "technical",
    path: "/admin/app/book-media-checks"
  }),
  coverage: Object.freeze({
    area: "technical",
    path: "/admin/app/lesson-content-checks"
  }),
  calibration: Object.freeze({
    area: "technical",
    path: "/admin/app/assessment-consistency"
  }),
  questionFlags: Object.freeze({
    area: "technical",
    // This public deep link predates the other Admin routes. Keep it stable.
    path: ADMIN_QUESTION_REPORTS_PATH
  }),
  mapStops: Object.freeze({
    area: "technical",
    path: "/admin/app/student-map"
  }),
  hollowSpots: Object.freeze({
    area: "technical",
    path: "/admin/app/student-rewards"
  })
});

const ADMIN_ROUTES_BY_PATH = new Map(
  Object.entries(ADMIN_SECTION_ROUTES).map(([sectionId, route]) => [
    route.path,
    Object.freeze({ ...route, sectionId })
  ])
);

function normalizedPathname(pathname = "") {
  const normalized = `/${String(pathname || "")
    .split("?")[0]
    .split("#")[0]
    .replace(/^\/+|\/+$/g, "")}`;
  return normalized === "/" ? "/" : normalized;
}

export function adminRouteForPath(pathname = "") {
  return ADMIN_ROUTES_BY_PATH.get(normalizedPathname(pathname)) || null;
}

export function adminPathForSection(sectionId = "overview") {
  return ADMIN_SECTION_ROUTES[sectionId]?.path
    || ADMIN_SECTION_ROUTES.overview.path;
}

export function isAdminRoutePath(pathname = "") {
  return Boolean(adminRouteForPath(pathname));
}

export function adminQaPageForPath(pathname = "") {
  return adminRouteForPath(pathname)?.sectionId === "questionFlags"
    ? "questionFlags"
    : "dashboard";
}

export function adminQaPathForPage(page = "dashboard") {
  return page === "questionFlags"
    ? ADMIN_QUESTION_REPORTS_PATH
    : ADMIN_SECTION_ROUTES.overview.path;
}

export function adminQaExitUrl(hash = "") {
  const normalizedHash = String(hash || "").replace(/^#?/, "#");
  return normalizedHash === "#" ? "/" : `/${normalizedHash}`;
}

export function adminQaHistoryState(currentState, page) {
  return {
    ...(currentState || {}),
    [ADMIN_QA_HISTORY_STATE]: page
  };
}

export function shouldCloseAdminQaWithHistoryBack(historyState) {
  return Boolean(historyState?.[ADMIN_QA_HISTORY_STATE]);
}

export function withoutAdminQaHistoryState(historyState) {
  const nextState = { ...(historyState || {}) };
  delete nextState[ADMIN_QA_HISTORY_STATE];
  return nextState;
}

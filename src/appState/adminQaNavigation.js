export const ADMIN_QA_HISTORY_STATE = "literacy-path-admin-route";
export const ADMIN_QUESTION_REPORTS_PATH = "/admin/question-flags";

// Admin is a collection of real pages, not one screen with disposable tabs.
// Keep the route inventory beside the parser so desktop tabs, the compact
// picker, cold links and browser history cannot drift onto different pages.
export const ADMIN_SECTION_ROUTES = Object.freeze({
  overview: Object.freeze({
    area: "operations",
    path: "/admin/school/overview"
  }),
  signups: Object.freeze({
    area: "operations",
    path: "/admin/school/teacher-requests"
  }),
  schools: Object.freeze({
    area: "operations",
    path: "/admin/school/schools"
  }),
  teachers: Object.freeze({
    area: "operations",
    path: "/admin/school/teachers"
  }),
  classes: Object.freeze({
    area: "operations",
    path: "/admin/school/classes"
  }),
  students: Object.freeze({
    area: "operations",
    path: "/admin/school/students"
  }),
  operations: Object.freeze({
    area: "operations",
    path: "/admin/operations/support"
  }),
  questionFlags: Object.freeze({
    area: "operations",
    // This public deep link predates the other Admin routes. Keep it stable.
    path: ADMIN_QUESTION_REPORTS_PATH
  })
});

// These pages were development/reporting workspaces, not account operations.
// Keep their old URLs safe for bookmarks and browser history, but land them on
// the nearest current operational page instead of reviving the retired UI.
export const ADMIN_LEGACY_ROUTE_REDIRECTS = Object.freeze({
  "/admin/school/reports": "classes",
  "/admin/school/assessment-records": "students",
  "/admin/app/readiness": "operations",
  "/admin/app/reading-book-checks": "operations",
  "/admin/app/book-media-checks": "operations",
  "/admin/app/lesson-content-checks": "operations",
  "/admin/app/assessment-consistency": "operations",
  "/admin/app/student-map": "overview",
  "/admin/app/student-rewards": "overview"
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
  const normalized = normalizedPathname(pathname);
  const current = ADMIN_ROUTES_BY_PATH.get(normalized);
  if (current) return current;
  const redirectSectionId = ADMIN_LEGACY_ROUTE_REDIRECTS[normalized];
  const redirect = ADMIN_SECTION_ROUTES[redirectSectionId];
  return redirect
    ? Object.freeze({
        ...redirect,
        sectionId: redirectSectionId,
        redirectFrom: normalized
      })
    : null;
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

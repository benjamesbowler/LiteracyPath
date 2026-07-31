import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  ADMIN_SECTION_ROUTES,
  ADMIN_QA_HISTORY_STATE,
  adminPathForSection,
  adminQaExitUrl,
  adminQaHistoryState,
  adminQaPageForPath,
  adminQaPathForPage,
  adminRouteForPath,
  isAdminRoutePath,
  shouldCloseAdminQaWithHistoryBack,
  withoutAdminQaHistoryState
} from "../../src/appState/adminQaNavigation.js";

const appSource = readFileSync(new URL("../../src/App.jsx", import.meta.url), "utf8");
const sessionControllerSource = readFileSync(
  new URL("../../src/appState/useAppSessionController.js", import.meta.url),
  "utf8"
);

test("every school-admin and app-check page has one stable direct URL", () => {
  const entries = Object.entries(ADMIN_SECTION_ROUTES);
  assert.equal(entries.length, 16);
  assert.equal(new Set(entries.map(([, route]) => route.path)).size, entries.length);
  for (const [sectionId, expected] of entries) {
    assert.deepEqual(adminRouteForPath(expected.path), {
      ...expected,
      sectionId
    });
    assert.deepEqual(adminRouteForPath(`${expected.path}/`), {
      ...expected,
      sectionId
    });
    assert.equal(adminPathForSection(sectionId), expected.path);
    assert.equal(isAdminRoutePath(expected.path), true);
  }

  assert.equal(adminQaPageForPath("/admin/question-flags"), "questionFlags");
  assert.equal(adminQaPageForPath("/admin/question-flags/"), "questionFlags");
  assert.equal(adminQaPageForPath("/admin/question-flags/other"), "dashboard");
  assert.equal(adminQaPageForPath("/school/admin/question-flags"), "dashboard");
  assert.equal(adminQaPageForPath("/"), "dashboard");
  assert.equal(adminQaPathForPage("questionFlags"), "/admin/question-flags");
  assert.equal(adminQaPathForPage("dashboard"), "/admin/school/overview");
  assert.equal(adminRouteForPath("/admin/school/not-real"), null);
  assert.equal(isAdminRoutePath("/admin/school/not-real"), false);
});

test("leaving the admin deep page preserves an explicit teacher hash", () => {
  assert.equal(adminQaExitUrl(""), "/");
  assert.equal(adminQaExitUrl("#teacher/today"), "/#teacher/today");
  assert.equal(adminQaExitUrl("teacher/reports?class=class-1"), "/#teacher/reports?class=class-1");
});

test("only an in-app Admin history entry closes a deep page with Back", () => {
  const state = adminQaHistoryState({ preserved: "yes" }, "questionFlags");

  assert.deepEqual(state, {
    preserved: "yes",
    [ADMIN_QA_HISTORY_STATE]: "questionFlags"
  });
  assert.equal(shouldCloseAdminQaWithHistoryBack(state), true);
  assert.equal(shouldCloseAdminQaWithHistoryBack({}), false);
  assert.equal(shouldCloseAdminQaWithHistoryBack(null), false);
  assert.deepEqual(withoutAdminQaHistoryState(state), { preserved: "yes" });
});

test("cold Admin links survive bootstrap but leave no false URL for non-admins", () => {
  assert.match(
    appSource,
    /activeAppViewRef\.current === APP_VIEWS\.ADMIN_DASHBOARD[\s\S]*?next !== APP_VIEWS\.ADMIN_DASHBOARD[\s\S]*?isAdminRoutePath/
  );
  assert.match(
    sessionControllerSource,
    /!teacherId[\s\S]*?\|\| isAdmin[\s\S]*?\["checking", "signed_out"\]\.includes\(teacherAccountStatus\)[\s\S]*?!isAdminRoutePath[\s\S]*?adminQaExitUrl/
  );
  assert.match(
    sessionControllerSource,
    /adminRouteForPath\(window\.location\.pathname\)[\s\S]*?setAppView\(APP_VIEWS\.ADMIN_DASHBOARD\)/
  );
});

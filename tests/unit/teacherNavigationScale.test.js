import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

import { APP_VIEWS } from "../../src/appState/appViews.js";
import { shouldWriteTeacherReportFunnelParams } from "../../src/appState/appViewHelpers.js";
import { parse as parseTeacherRoute } from "../../src/appState/routes.js";
import {
  getTeacherPaginationWindow,
  getTeacherPageSlice,
  TEACHER_FUNNEL_STUDENT_PAGE_SIZE
} from "../../src/components/teacher/teacherPagination.js";
import { allocateTeacherTodayUrgentPreviews } from "../../src/utils/teacherTodayBriefing.js";

let TeacherFunnelStudentPicker;
let vite;

test.before(async () => {
  vite = await createServer({
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true }
  });
  ({ TeacherFunnelStudentPicker } = await vite.ssrLoadModule(
    "/src/components/teacher/TeacherFunnelStudentPicker.jsx"
  ));
});

test.after(async () => {
  await vite?.close();
});

test("Reports funnel routes retain a valid report view for refresh and history restoration", () => {
  assert.deepEqual(
    parseTeacherRoute(
      "#teacher/reports?class=class-a&learner=student-a&report=hfw&show=1"
    ),
    {
      appView: APP_VIEWS.REPORTS,
      classId: "class-a",
      groupId: "all",
      learnerId: "student-a",
      reportView: "hfw"
    }
  );
  assert.equal(
    parseTeacherRoute(
      "#teacher/reports?class=class-a&learner=student-a&report=not-a-report"
    ).reportView,
    ""
  );
  assert.equal(
    parseTeacherRoute("#teacher/reports?class=class-a&who=class&report=hfw").reportView,
    ""
  );
});

test("Reports does not rewrite a history address while class ownership is loading", () => {
  assert.equal(shouldWriteTeacherReportFunnelParams({
    classReadComplete: false,
    rosterReadComplete: false,
    who: "student"
  }), false);
  assert.equal(shouldWriteTeacherReportFunnelParams({
    classReadComplete: true,
    rosterReadComplete: false,
    who: "student"
  }), false);
  assert.equal(shouldWriteTeacherReportFunnelParams({
    classReadComplete: true,
    rosterReadComplete: true,
    who: "student"
  }), true);
  assert.equal(shouldWriteTeacherReportFunnelParams({
    classReadComplete: true,
    rosterReadComplete: false,
    who: ""
  }), true);
});

test("the report funnel hands focus to Show the report after the final choice", () => {
  const source = readFileSync(
    new URL("../../src/components/TeacherReportsHubPage.jsx", import.meta.url),
    "utf8"
  );
  assert.match(source, /const showButtonRef = useRef\(null\)/);
  assert.match(source, /styleHeadingRef,\s*showButtonRef/);
  assert.match(source, /ref=\{showButtonRef\}/);
});

// v2 Dashboard: the two urgent lists preview independently — attention shows
// up to three rows and due shows "3 of N" with the rest one click away. They
// no longer share a single three-row budget that could push every due row out
// of sight behind a full attention list.
test("Today previews up to three rows in each urgent section independently", () => {
  assert.deepEqual(
    allocateTeacherTodayUrgentPreviews({
      attentionCount: 8,
      dueCount: 9,
      maximum: 3
    }),
    { attention: 3, due: 3, total: 6 }
  );
  assert.deepEqual(
    allocateTeacherTodayUrgentPreviews({
      attentionCount: 1,
      dueCount: 9,
      maximum: 3
    }),
    { attention: 1, due: 3, total: 4 }
  );

  const today = readFileSync(
    new URL("../../src/components/TeacherTodayPage.jsx", import.meta.url),
    "utf8"
  );
  const surface = readFileSync(
    new URL("../../src/components/AppSurface.jsx", import.meta.url),
    "utf8"
  );
  // Assessing stays one tap away: every urgent row carries Assess, and the
  // global entry lives in the shared context bar above the page.
  assert.match(today, /onClick=\{\(\) => onStartCheck\?\.\(row\)\}/);
  assert.match(
    surface,
    /onAssess=\{\(\) => goToTeacherIntent\(APP_VIEWS\.ASSESSMENTS\)\}/
  );
});

test("large assessment and report pickers render at most eight students per keyboard page", () => {
  const rows = Array.from({ length: 40 }, (_unused, index) => ({
    id: `student-${index + 1}`,
    name: `Learner ${String(index + 1).padStart(2, "0")}`
  }));
  const html = renderToStaticMarkup(React.createElement(
    TeacherFunnelStudentPicker,
    {
      page: 1,
      rows,
      search: "",
      selectedStudentId: ""
    }
  ));
  assert.equal(TEACHER_FUNNEL_STUDENT_PAGE_SIZE, 8);
  assert.match(html, /Learner 01/);
  assert.match(html, /Learner 08/);
  assert.doesNotMatch(html, /Learner 09/);
  assert.match(html, /Page 1 of 5/);
  assert.equal((html.match(/class="teacher-funnel-option"/g) || []).length, 8);

  const lastPage = getTeacherPageSlice({
    page: 5,
    pageSize: TEACHER_FUNNEL_STUDENT_PAGE_SIZE,
    rows
  });
  assert.equal(lastPage.rows.length, 8);
  assert.equal(lastPage.rows[0].name, "Learner 33");
});

test("100-plus roster pagination keeps a seven-item window with ellipses", () => {
  assert.deepEqual(
    getTeacherPaginationWindow({ page: 1, pageCount: 11 }),
    [1, 2, 3, 4, 5, "ellipsis-end", 11]
  );
  assert.deepEqual(
    getTeacherPaginationWindow({ page: 6, pageCount: 11 }),
    [1, "ellipsis-start", 5, 6, 7, "ellipsis-end", 11]
  );
  assert.deepEqual(
    getTeacherPaginationWindow({ page: 11, pageCount: 11 }),
    [1, "ellipsis-start", 7, 8, 9, 10, 11]
  );
});

test("short-landscape teacher navigation scrolls while sign-out remains fixed", () => {
  const styles = readFileSync(
    new URL("../../src/styles/lg-design-system.css", import.meta.url),
    "utf8"
  );
  assert.match(
    styles,
    /\.lg-sb-nav\s*\{[\s\S]*?overflow-y:\s*auto;[\s\S]*?overscroll-behavior-y:\s*contain;/
  );
  assert.match(styles, /@media \(max-height: 420px\) and \(orientation: landscape\)/);
  assert.match(styles, /\.lg-sb-footer\s*\{[\s\S]*?flex-shrink:\s*0;/);
});

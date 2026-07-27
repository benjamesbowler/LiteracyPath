import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

let primitives;
let dialogs;
let adminDialogs;
let vite;

test.before(async () => {
  vite = await createServer({
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true }
  });
  primitives = await vite.ssrLoadModule(
    "/src/components/teacher/ui/TeacherPrimitives.jsx"
  );
  dialogs = await vite.ssrLoadModule(
    "/src/components/teacher/ui/TeacherDialog.jsx"
  );
  adminDialogs = await vite.ssrLoadModule(
    "/src/components/teacher/TeacherAdminDialogs.jsx"
  );
});

test.after(async () => {
  await vite?.close();
});

test("page shell and header keep the teacher hierarchy and context slot", () => {
  const html = renderToStaticMarkup(
    React.createElement(
      primitives.TeacherPageShell,
      {
        className: "teacher-intent-page",
        intent: "assess",
        product: "assessment-hub"
      },
      React.createElement(
        primitives.TeacherPageHeader,
        {
          eyebrow: "Assessment hub",
          title: "Choose a purpose",
          description: "Start with the teacher decision."
        },
        React.createElement("aside", null, "Current class")
      )
    )
  );

  assert.match(html, /^<main class="teacher-product-page teacher-intent-page"/);
  assert.match(html, /data-teacher-product="assessment-hub"/);
  assert.match(html, /data-teacher-intent="assess"/);
  assert.match(html, /<section class="teacher-page-header">/);
  assert.match(html, /<p class="panel-label">Assessment hub<\/p>/);
  assert.match(html, /<h2>Choose a purpose<\/h2>/);
  assert.match(html, /<aside>Current class<\/aside>/);
});

test("filter, table, and chart primitives expose named semantic regions", () => {
  const filterHtml = renderToStaticMarkup(
    React.createElement(
      primitives.TeacherFilterBar,
      { className: "teacher-roster-tools", label: "Roster filters" },
      React.createElement("input", { "aria-label": "Search roster" })
    )
  );
  const tableHtml = renderToStaticMarkup(
    React.createElement(
      primitives.TeacherDataTable,
      { className: "dashboard-table", label: "Active learner roster" },
      React.createElement(
        "tbody",
        null,
        React.createElement("tr", null, React.createElement("td", null, "Aarav"))
      )
    )
  );
  const chartHtml = renderToStaticMarkup(
    React.createElement(
      primitives.TeacherChart,
      { className: "quest-heat-grid", label: "Class sound map" },
      React.createElement("span", { "aria-hidden": "true" }, "sh")
    )
  );

  assert.match(filterHtml, /<section class="teacher-filter-bar teacher-roster-tools" aria-label="Roster filters">/);
  assert.match(tableHtml, /role="region" aria-label="Active learner roster" tabindex="0"/);
  assert.match(tableHtml, /<table class="dashboard-table">/);
  assert.match(chartHtml, /role="img" aria-label="Class sound map"/);
});

test("modal and non-modal teacher dialogs share one accessible wrapper", () => {
  const modalHtml = renderToStaticMarkup(
    React.createElement(
      dialogs.TeacherModal,
      { label: "Question guide", onClose() {} },
      React.createElement("button", null, "Close")
    )
  );
  const drawerHtml = renderToStaticMarkup(
    React.createElement(
      dialogs.TeacherDrawer,
      { label: "Learner detail: Aarav", onClose() {} },
      React.createElement("button", null, "Close learner")
    )
  );

  assert.match(modalHtml, /class="symbol-password-modal"/);
  assert.match(modalHtml, /role="dialog" aria-modal="true" aria-label="Question guide"/);
  assert.match(drawerHtml, /class="teacher-learner-drawer-dialog"/);
  assert.match(drawerHtml, /role="dialog" aria-modal="false" aria-label="Learner detail: Aarav"/);
});

test("closed dialogs do not render protected or destructive content", () => {
  const html = renderToStaticMarkup(
    React.createElement(
      dialogs.TeacherDialog,
      { open: false, label: "Delete learner" },
      React.createElement("p", null, "Protected learner detail")
    )
  );
  assert.equal(html, "");
});

test("lazy destructive dialogs retain exact confirmation content and disabled reset", () => {
  const confirmHtml = renderToStaticMarkup(
    React.createElement(adminDialogs.ConfirmActionDialog, {
      open: true,
      title: "Delete class?",
      body: "This cannot be undone.",
      confirmLabel: "Delete class",
      onCancel() {},
      onConfirm() {}
    })
  );
  const resetHtml = renderToStaticMarkup(
    React.createElement(adminDialogs.ResetStudentProgressDialog, {
      open: true,
      studentName: "Aarav",
      resetting: false,
      onCancel() {},
      onReset() {}
    })
  );

  assert.match(confirmHtml, /role="dialog" aria-modal="true" aria-labelledby="confirm-action-title"/);
  assert.match(confirmHtml, /<h2 id="confirm-action-title">Delete class\?<\/h2>/);
  assert.match(confirmHtml, />Delete class<\/button>/);
  assert.match(resetHtml, /<h2 id="reset-progress-title">Reset check results<\/h2>/);
  assert.match(resetHtml, /saved check results, scores and progress for Aarav/);
  assert.match(resetHtml, /data-autofocus="true"/);
  assert.match(
    resetHtml,
    /<button(?=[^>]*class="reset-button")(?=[^>]*disabled="")[^>]*>Reset check results<\/button>/,
  );
});

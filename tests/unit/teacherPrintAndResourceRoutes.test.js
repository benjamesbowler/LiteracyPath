import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

function source(path) {
  return fs.readFileSync(path, "utf8");
}

test("teacher report and sign-in-card print jobs use isolated paper rules", () => {
  const css = source("src/App.css");
  const reportCss = source("src/styles/student-reports.css");

  assert.match(css, /@page teacher-login-cards\s*\{[\s\S]*?size:\s*A4 portrait;[\s\S]*?margin:\s*0;/);
  assert.match(css, /body:has\(\[data-teacher-route="login-cards"\]\) \.teacher-login-card-route\s*\{[\s\S]*?page:\s*teacher-login-cards;/);
  assert.match(css, /body:has\(\[data-teacher-route="login-cards"\]\) \.lg-sidebar,[\s\S]*?display:\s*none !important;/);
  assert.match(css, /\.teacher-login-card-page\s*\{[\s\S]*?page:\s*teacher-login-cards;/);
  assert.match(css, /@page\s*\{[\s\S]*?margin:\s*0\.45in;[\s\S]*?size:\s*letter portrait;/);
  assert.match(css, /@page teacher-report\s*\{[\s\S]*?margin:\s*0\.45in;[\s\S]*?size:\s*letter portrait;/);
  assert.match(css, /\.student-report-document,[\s\S]*?\.lg-report-shell\s*\{[\s\S]*?page:\s*teacher-report;/);
  assert.match(css, /body:has\(\.formal-class-report-document\) \* \{[\s\S]*?visibility:\s*hidden !important;/);
  assert.match(css, /body:has\(\.formal-class-report-document\) \.formal-class-report-document,[\s\S]*?visibility:\s*visible !important;/);
  assert.match(css, /body:has\(\.formal-class-report-document\) \.formal-class-report-document\s*\{[\s\S]*?page:\s*teacher-report;[\s\S]*?position:\s*absolute !important;/);
  assert.match(css, /\.formal-class-report-table,[\s\S]*?\.formal-class-progress-grid\s*\{[\s\S]*?min-width:\s*0 !important;[\s\S]*?table-layout:\s*fixed;/);
  assert.match(reportCss, /@page teacher-report\s*\{[\s\S]*?size:\s*letter portrait;[\s\S]*?margin:\s*0\.45in;/);
  assert.doesNotMatch(`${css}\n${reportCss}`, /@page\s*\{[\s\S]*?size:\s*A4/);
});

test("teacher resource subroutes expose main landmarks and a real route back", () => {
  const worksheet = source("src/components/WorksheetGeneratorPage.jsx");
  const present = source("src/components/PresentPage.jsx");
  const students = source("src/components/TeacherStudentsPage.jsx");

  assert.match(worksheet, /<main className="ws-page" data-teacher-route="worksheets">/);
  assert.match(worksheet, /<nav className="ws-route-nav" aria-label="Worksheet navigation">/);
  assert.match(worksheet, /← Back to Resources/);
  assert.match(present, /<main className="ws-page" data-teacher-route="present">/);
  assert.match(present, /<nav className="ws-route-nav" aria-label="Presentation navigation">/);
  assert.match(present, /← Back to Resources/);
  assert.match(students, /<main[\s\S]*?data-teacher-route="login-cards"/);
  assert.match(students, /<nav className="teacher-login-card-route-actions" aria-label="Sign-in card navigation">/);
  assert.match(students, /← Back to Students/);
  assert.match(students, /pushLoginCardRoute/);
  assert.match(students, /readLoginCardRouteStudentIds/);
  assert.match(students, /window\.addEventListener\("popstate", syncLoginCardRoute\)/);
});

test("worksheet-bank failures cannot also render the empty-bank claim", () => {
  const worksheet = source("src/components/WorksheetGeneratorPage.jsx");

  assert.match(worksheet, /status:\s*"error"[\s\S]*?describeWorksheetBankLoadError\(error\)/);
  assert.match(worksheet, /<ActionFeedback[\s\S]*?kind:\s*"error"[\s\S]*?actionLabel:\s*"Try again"[\s\S]*?onAction:\s*refreshBank/);
  assert.match(worksheet, /bankReadState\.status === "complete" && bank\.length === 0/);
  assert.match(
    worksheet,
    /bankReadState\.status === "error"[\s\S]*?<ActionFeedback[\s\S]*?bankReadState\.status === "complete" && bank\.length === 0 \?/,
    "the error branch must be separate from, and precede, the complete-read empty branch"
  );
});

#!/usr/bin/env node
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { APP_VIEWS, REQUIRED_APP_VIEWS } from "../src/appState/appViews.js";

const failures = [];

function fail(message) {
  failures.push(message);
}

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function requireFile(path) {
  if (!existsSync(new URL(`../${path}`, import.meta.url))) {
    fail(`${path} is missing.`);
  }
}

function requireIncludes(source, needle, message) {
  if (!source.includes(needle)) fail(message);
}

[
  "docs/implementation/app_state_architecture_audit.md",
  "src/appState/appViews.js",
  "src/appState/appViewHelpers.js",
  "src/appState/studentSessionHelpers.js",
  "src/appState/assessmentSessionHelpers.js",
  "src/App.jsx"
].forEach(requireFile);

const appSource = read("src/App.jsx");
const appViewsSource = read("src/appState/appViews.js");
const auditSource = read("docs/implementation/app_state_architecture_audit.md");

for (const view of REQUIRED_APP_VIEWS) {
  requireIncludes(appViewsSource, view, `appViews.js is missing required view "${view}".`);
}

[
  "SAFE_TO_EXTRACT_NOW",
  "KEEP_IN_APP_FOR_NOW",
  "NEEDS_TEST_BEFORE_EXTRACT",
  "FUTURE_REDUCER_CANDIDATE",
  "authReducer",
  "studentSessionReducer",
  "assessmentSessionReducer",
  "guidedReadingReducer",
  "reportFiltersReducer",
  "childModeReducer"
].forEach(needle => {
  requireIncludes(auditSource, needle, `architecture audit is missing ${needle}.`);
});

[
  "LearnAreaPage",
  "GuidedReadingPage",
  "TeacherDashboardPage",
  "AdminDashboardPage",
  "AssessmentPage",
  "CheckpointDecisionPage",
  "FinishedReportPage",
  "saveAssessmentAttempt",
  "saveGuidedReadingRecord",
  "APP_VIEWS.LEARN",
  "APP_VIEWS.GUIDED_READING",
  "APP_VIEWS.TEACHER_DASHBOARD",
  "APP_VIEWS.ADMIN_DASHBOARD",
  "APP_VIEWS.ASSESSMENT"
].forEach(needle => {
  requireIncludes(appSource, needle, `App.jsx required route/path is missing ${needle}.`);
});

if (appSource.includes("dashboardMode")) {
  fail("App.jsx must not reintroduce the retired teacher/admin dashboard mode switch.");
}

if (/useReducer/.test(appSource)) {
  fail("This pass must not introduce useReducer into App.jsx.");
}

if (!Object.values(APP_VIEWS).includes("learn") || !Object.values(APP_VIEWS).includes("guidedReading")) {
  fail("APP_VIEWS lost required Learn or Guided Reading values.");
}

if (failures.length) {
  console.error("App state architecture contract failures:");
  failures.forEach(message => console.error(`- ${message}`));
  process.exit(1);
}

execSync("npm run build", {
  stdio: "inherit"
});

console.log("App state architecture contracts passed.");

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = relativePath =>
  fs.readFileSync(path.join(root, relativePath), "utf8");

const dashboard = read("src/components/TeacherDashboardPage.jsx");
const intents = read("src/components/teacher/TeacherIntentPage.jsx");
const appPages = read("src/components/AppPages.jsx");
const runtimeSurfaces = read("src/appState/appRuntimeSurfaces.jsx");
const styles = read("src/App.css");
const tokens = read("src/components/teacher/ui/teacherTokens.css");
const primitives = read("src/components/teacher/ui/TeacherPrimitives.jsx");
const dialogs = read("src/components/teacher/ui/TeacherDialog.jsx");

for (const primitive of [
  "TeacherPageShell",
  "TeacherPageHeader",
  "TeacherFilterBar",
  "TeacherDataTable",
  "TeacherChart"
]) {
  assert.ok(
    primitives.includes(`export function ${primitive}`),
    `Missing consolidated ${primitive}.`
  );
  assert.ok(
    dashboard.includes(`<${primitive}`) || intents.includes(`<${primitive}`),
    `${primitive} is not adopted by a real teacher surface.`
  );
}

for (const primitive of ["TeacherDialog", "TeacherDrawer", "TeacherModal"]) {
  assert.ok(
    dialogs.includes(`export function ${primitive}`),
    `Missing consolidated ${primitive}.`
  );
}

for (const token of [
  "--teacher-ui-target-min",
  "--teacher-ui-page-gap",
  "--teacher-ui-card-radius",
  "--teacher-ui-action-column"
]) {
  assert.ok(tokens.includes(token), `Missing teacher token ${token}.`);
}

assert.ok(
  styles.includes("@import './components/teacher/ui/teacherTokens.css';"),
  "Teacher tokens must be loaded by the product stylesheet."
);
assert.ok(
  styles.includes("var(--teacher-ui-target-min)"),
  "The minimum target token must drive teacher controls."
);
for (const token of [
  "--teacher-ui-page-gap",
  "--teacher-ui-panel-gap",
  "--teacher-ui-card-radius",
  "--teacher-ui-control-radius",
  "--teacher-ui-action-column"
]) {
  assert.ok(
    styles.includes(`var(${token})`),
    `Teacher stylesheet does not consume ${token}.`
  );
}

for (const [label, source, banned] of [
  ["dashboard modal implementation", dashboard, "function TeacherModal"],
  ["dashboard drawer implementation", dashboard, "function TeacherDrawer"],
  ["dashboard raw dialog role", dashboard, 'role="dialog"'],
  ["dashboard raw chart role", dashboard, 'role="img"'],
  ["dashboard raw table scroll wrapper", dashboard, '<div className="table-scroll">'],
  ["dashboard raw page shell", dashboard, 'className="teacher-product-page teacher-dashboard-page"'],
  ["intent raw page shell", intents, 'className="teacher-product-page teacher-intent-page"'],
  ["AppPages confirmation dialog", appPages, "function ConfirmActionDialog"],
  ["AppPages reset dialog", appPages, "function ResetStudentProgressDialog"]
]) {
  assert.ok(!source.includes(banned), `Duplicate ${label} remains.`);
}

assert.ok(
  runtimeSurfaces.includes('import("../components/teacher/TeacherAdminDialogs.jsx")'),
  "Low-frequency teacher admin dialogs must stay in a lazy route chunk."
);
assert.ok(
  dashboard.includes('from "./teacher/ui/TeacherPrimitives.jsx"'),
  "Dashboard must import the consolidated primitive set."
);
assert.ok(
  intents.includes('from "./ui/TeacherPrimitives.jsx"'),
  "Intent pages must import the consolidated page primitives."
);

for (const snapshot of [
  "teacher-roster-chromebook.png",
  "teacher-roster-tablet.png",
  "teacher-learner-drawer-chromebook.png",
  "teacher-learner-drawer-tablet.png"
]) {
  const snapshotPath = path.join(
    root,
    "tests/release/teacher-roster-device-matrix.spec.js-snapshots",
    snapshot
  );
  assert.ok(fs.statSync(snapshotPath).size > 10_000, `Visual baseline ${snapshot} is missing or empty.`);
}

console.log(
  "Teacher UI primitives: tokens, page shells, filters, tables, charts, modal dialogs, and drawers are consolidated; four authenticated device baselines are present."
);

#!/usr/bin/env node
import { readFileSync } from "node:fs";

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

const failures = [];
const matrix = read("docs/teacher/PARITY_MATRIX.md");
const app = read("src/App.jsx");
const appSurface = read("src/components/AppSurface.jsx");
const runtimeSurfaces = read("src/appState/appRuntimeSurfaces.jsx");
const admin = read("src/components/AdminDashboardPage.jsx");
const teacher = [
  read("src/components/TeacherTodayPage.jsx"),
  read("src/components/TeacherStudentsPage.jsx")
].join("\n");
const routeTest = read("tests/release/teacher-dashboard-contracts.spec.js");

const capabilityRows = matrix
  .split(/\r?\n/)
  .filter(line => /^\|\s*CAP-\d+\s*\|/.test(line));

if (capabilityRows.length < 30) {
  failures.push(`Parity matrix has ${capabilityRows.length} capability rows; expected at least 30.`);
}

for (const row of capabilityRows) {
  const cells = row.split("|").map(cell => cell.trim()).filter(Boolean);
  const decision = cells[2];
  if (!["migrated", "dropped-with-reason"].includes(decision)) {
    failures.push(`${cells[0] || "Unknown row"} has invalid decision "${decision || "missing"}".`);
  }
  if (!cells[3]) {
    failures.push(`${cells[0] || "Unknown row"} is missing destination/reason evidence.`);
  }
}

for (const [name, source] of [["App.jsx", app], ["AdminDashboardPage.jsx", admin]]) {
  if (source.includes("dashboardMode")) {
    failures.push(`${name} still contains a dashboardMode switch.`);
  }
}

if (
  !appSurface.includes("<TeacherTodayPage")
  || !appSurface.includes("<TeacherStudentsPage")
  || !appSurface.includes("<AdminDashboardPage")
  || !runtimeSurfaces.includes("TeacherTodayPage")
  || !runtimeSurfaces.includes("TeacherStudentsPage")
  || !runtimeSurfaces.includes("AdminDashboardPage")
) {
  failures.push("The decomposed app surface must retain explicit lazy teacher and admin routes.");
}
if (
  !teacher.includes('data-teacher-product="class-dashboard"') &&
  !/TeacherPageShell[\s\S]*?product="class-dashboard"/.test(teacher)
) {
  failures.push("The teacher class pages are missing the canonical teacher product marker.");
}
if (!routeTest.includes('[data-teacher-product="class-dashboard"]')) {
  failures.push("Reachable teacher route tests do not assert the canonical teacher product marker.");
}
if (!routeTest.includes('page.locator(".admin-dashboard")')) {
  failures.push("Reachable teacher route tests do not prove the admin dashboard is absent.");
}

if (failures.length) {
  console.error("Teacher dashboard consolidation failures:");
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Teacher dashboard consolidation passed: ${capabilityRows.length} capabilities resolved.`);

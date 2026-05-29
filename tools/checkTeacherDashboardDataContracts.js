#!/usr/bin/env node
import { readFileSync } from "node:fs";
import {
  buildAssessmentAttemptRecord,
  exportAssessmentAttemptsCsv,
  getAssessmentAttemptContractIssues,
  summarizeAssessmentHistory
} from "../src/data/assessmentHistoryStore.js";

const sampleAttempt = buildAssessmentAttemptRecord({
  studentId: "student-1",
  studentName: "Sample Student",
  classId: "class-1",
  teacherId: "teacher-1",
  stage: { id: "final_sounds", label: "Final Sounds" },
  checkpoint: {
    skillId: "final_sounds",
    pathStatus: { level: 1, phase: 1 },
    passed: true,
    totalCoveredItems: ["b", "d"],
    coveredThisRound: ["b"],
    coverage: { mastered: 2, total: 8, unit: "sounds" }
  },
  questionRecords: Array.from({ length: 15 }, (_, index) => ({
    questionId: `q-${index + 1}`,
    question: "Listen to the word. Which sound does it end with?",
    targetWord: index % 2 ? "web" : "tub",
    itemKey: index % 2 ? "b" : "d",
    correct: index % 2 ? "b" : "d",
    chosen: index % 2 ? "b" : "d",
    isCorrect: true,
    skillId: "final_sounds",
    itemLevel: 1,
    itemPhase: 1,
    timestamp: new Date().toISOString()
  }))
});

const issues = getAssessmentAttemptContractIssues(sampleAttempt);
const emptySummary = summarizeAssessmentHistory([]);
const summary = summarizeAssessmentHistory([sampleAttempt], {
  students: [{ id: "student-1", name: "Sample Student", className: "Class A" }],
  classes: [{ id: "class-1", name: "Class A" }]
});
const csv = exportAssessmentAttemptsCsv([sampleAttempt]);
const appSource = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const appPagesSource = readFileSync(new URL("../src/components/AppPages.jsx", import.meta.url), "utf8");
const adminDashboardSource = readFileSync(new URL("../src/components/AdminDashboardPage.jsx", import.meta.url), "utf8");
const storeSource = readFileSync(new URL("../src/data/assessmentHistoryStore.js", import.meta.url), "utf8");
const topNavigationSource = appPagesSource.match(/export function TopNavigation[\s\S]*?\nfunction PairSelectionQuestion/)?.[0] || "";

const failures = [];
const requiredTeacherSections = [
  ["teacherOverview", "Overview"],
  ["classes", "Classes"],
  ["students", "Students"],
  ["reports", "Reports"],
  ["guidedReading", "Guided Reading"],
  ["assessmentProgress", "Assessment"],
  ["hfw", "HFW"],
  ["exports", "Exports"]
];

if (issues.length) failures.push(`Sample attempt missing required fields: ${issues.join(", ")}`);
if (emptySummary.attempts !== 0) failures.push("Empty summary should have zero attempts.");
if (summary.attempts !== 1 || summary.averageAccuracy !== 100) failures.push("Summary did not compute the sample attempt correctly.");
if (!csv.includes("Sample Student") || !csv.includes("Final Sounds")) failures.push("CSV export is missing expected fields.");
if (!appPagesSource.includes("Teacher Dashboard")) failures.push("Top navigation is missing visible Teacher Dashboard text.");
if (topNavigationSource.includes("goToReports") || topNavigationSource.includes(">Reports</button>")) {
  failures.push("Teacher Mode top navigation should not show a standalone Reports button.");
}
if (!appSource.includes('appView === "teacherDashboard"')) failures.push("App.jsx does not render a teacherDashboard app state.");
if (!adminDashboardSource.includes('useState(isTeacherMode ? "teacherOverview" : "overview")')) failures.push("Teacher Dashboard should default to the Overview section.");
if (!adminDashboardSource.includes("Choose dashboard section")) failures.push("Teacher Dashboard mobile section dropdown label is missing.");
if (!adminDashboardSource.includes('role="tablist"')) failures.push("Teacher Dashboard tablist navigation is missing.");
if (!adminDashboardSource.includes('role="tab"')) failures.push("Teacher Dashboard tab buttons are missing tab semantics.");
if (!adminDashboardSource.includes("aria-selected")) failures.push("Teacher Dashboard tabs should expose selected state.");
if (!adminDashboardSource.includes("teacher-section-select")) failures.push("Teacher Dashboard mobile section selector class is missing.");
if (!adminDashboardSource.includes("teacher-scroll-panel")) failures.push("Teacher Dashboard long lists should use bounded scroll panels.");
if (!adminDashboardSource.includes("el-report-control-column")) failures.push("EL report export controls should be grouped by report type.");
if (adminDashboardSource.includes('id: "teacherTools"')) {
  failures.push("Teacher Dashboard should not expose a technical Tools section.");
}
if (adminDashboardSource.includes('isTeacherMode && activeSection === "teacherTools"')) {
  failures.push("Assessment Audio Coverage must not render in Teacher Dashboard mode.");
}
if (!adminDashboardSource.includes('!isTeacherMode && activeSection === "assessmentAudio"')) {
  failures.push("Assessment Audio Coverage should remain available in Admin Dashboard only.");
}
requiredTeacherSections.forEach(([id, label]) => {
  if (!adminDashboardSource.includes(`id: "${id}"`)) {
    failures.push(`Teacher Dashboard section id is missing: ${id}.`);
  }
  if (!adminDashboardSource.includes(`label: "${label}"`) && !adminDashboardSource.includes(`>${label}<`)) {
    failures.push(`Teacher Dashboard section label is missing: ${label}.`);
  }
});
if (!adminDashboardSource.includes("Assessment Archive")) failures.push("AdminDashboardPage is missing Assessment Archive section text.");
if (!adminDashboardSource.includes("No assessment attempts have been saved")) failures.push("Assessment Archive empty state text is missing.");
if (!adminDashboardSource.includes("Export CSV") || !adminDashboardSource.includes("Export JSON")) failures.push("Assessment archive export buttons are missing.");
[
  "saveAssessmentAttempt",
  "loadAssessmentAttempts",
  "summarizeAssessmentHistory",
  "exportAssessmentAttemptsCsv"
].forEach(exportName => {
  if (!storeSource.includes(`export function ${exportName}`) && !storeSource.includes(`export async function ${exportName}`)) {
    failures.push(`assessmentHistoryStore is missing ${exportName}.`);
  }
});

if (failures.length) {
  console.error("Teacher dashboard data contract failures:");
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Teacher dashboard data contracts passed.");
console.log(`Sample attempts: ${summary.attempts}`);

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const policyPath = "src/policy/learningPolicy.js";
const conclusionFiles = [
  "src/components/AdminDashboardPage.jsx",
  "src/components/TeacherDashboardPage.jsx",
  "src/components/teacher/TeacherProgressOverview.jsx",
  "src/data/assessmentHistoryStore.js",
  "src/data/elAssessmentReportStore.js",
  "src/data/elFormalAssessmentReportBuilder.js",
  "src/data/reportingEvidenceModel.js",
  "src/data/reportingSystem.js",
  "src/data/studentDetailedReportBuilder.js",
  "src/data/studentReportingWorkspaceModel.js",
  "src/utils/exportElAssessmentExcel.js",
  "src/utils/metricDefinitions.js",
  "src/utils/reportSections.js",
  "src/utils/teacherGrowthSeries.js",
  "src/utils/teacherProgressOverview.js"
];

const forbidden = [
  {
    label: "raw learning accuracy comparison",
    pattern: /\b(?:accuracy|percent|classAccuracy|averageAccuracy|effectiveAccuracy)\s*(?:>=|<=|<|>)\s*(?:50|60|65|70|80|85)\b/g
  },
  {
    label: "raw learning ratio threshold",
    pattern: /\b(?:accuracy|coverage|mastery|support)\b[^\n]{0,80}(?:>=|<=|<|>)\s*0\.(?:3|5|6|65|7|8|85)\b/gi
  },
  {
    label: "legacy status-band copy",
    pattern: /(?:On track\s*=\s*at least|Developing\s*=\s*60|Needs support\s*=\s*below\s*60|below\s+70%)/gi
  }
];

const failures = [];
for (const relativePath of conclusionFiles) {
  const absolutePath = path.join(repoRoot, relativePath);
  const source = fs.readFileSync(absolutePath, "utf8");
  for (const rule of forbidden) {
    rule.pattern.lastIndex = 0;
    for (const match of source.matchAll(rule.pattern)) {
      const line = source.slice(0, match.index).split("\n").length;
      failures.push(`${relativePath}:${line} ${rule.label}: ${JSON.stringify(match[0])}`);
    }
  }
}

const policySource = fs.readFileSync(path.join(repoRoot, policyPath), "utf8");
for (const required of [
  "LEARNING_POLICY_VERSION",
  "LEARNING_EVIDENCE_POLICY",
  "evaluateLearningConclusion",
  "minimumEvidence",
  "conclusionWindowDays",
  "policyVersion"
]) {
  if (!policySource.includes(required)) {
    failures.push(`${policyPath} is missing required policy contract ${required}`);
  }
}

if (failures.length) {
  console.error("Learning-policy threshold guard failed:");
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(
  `Learning-policy threshold guard passed: ${conclusionFiles.length} conclusion surfaces use ${policyPath}.`
);

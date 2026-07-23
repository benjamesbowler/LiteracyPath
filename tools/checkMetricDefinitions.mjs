import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = relativePath => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
const failures = [];

const utility = read("src/utils/metricDefinitions.js");
for (const token of [
  "accuracy",
  "mastered",
  "active",
  "started",
  "\"current-skill\"",
  "trails",
  "\"Denominator\"",
  "\"Date range\"",
  "\"Minimum evidence\"",
  "\"Update time\"",
  "addMetricDefinitionsWorksheet"
]) {
  if (!utility.includes(token)) failures.push(`metricDefinitions.js: missing ${token}`);
}

const component = read("src/components/MetricDefinition.jsx");
for (const token of [
  "aria-describedby",
  "role=\"tooltip\"",
  "data-metric-definition",
  "data-metric-figure",
  "Denominator:",
  "Date range:",
  "Minimum evidence:",
  "Updated:"
]) {
  if (!component.includes(token)) failures.push(`MetricDefinition.jsx: missing ${token}`);
}

const adoptions = [
  {
    file: "src/components/TeacherDashboardPage.jsx",
    tokens: [
      "MetricFigure",
      "definitionId=\"started\"",
      "definitionId=\"accuracy\"",
      "definitionId=\"active\"",
      "metricId=\"current-skill\"",
      "metricId=\"mastered\"",
      "metricId=\"trails\""
    ]
  },
  {
    file: "src/components/reports/StudentReportViews.jsx",
    tokens: ["MetricFigure", "metricId=\"accuracy\""]
  },
  {
    file: "src/components/FinishedReportPage.jsx",
    tokens: ["MetricFigure", "\"accuracy\""]
  },
  {
    file: "src/utils/exportElAssessmentExcel.js",
    tokens: ["addMetricDefinitionsWorksheet", "METRIC_DEFINITIONS_SHEET_NAME"]
  },
  {
    file: "src/utils/exportGuidedReadingCompletionExcel.js",
    tokens: ["addMetricDefinitionsWorksheet", "METRIC_DEFINITIONS_SHEET_NAME"]
  },
  {
    file: "src/utils/exportStudentWorkspaceCsv.js",
    tokens: ["buildMetricDefinitionRows", "\"Metric definition\""]
  },
  {
    file: "src/App.jsx",
    tokens: ["createDefinedExcelWorkbook", "buildMetricDefinitionCsvRows", "buildMetricDefinitionsText"]
  }
];

for (const adoption of adoptions) {
  const source = read(adoption.file);
  for (const token of adoption.tokens) {
    if (!source.includes(token)) failures.push(`${adoption.file}: missing ${token}`);
  }
}

if (failures.length) {
  console.error("Teacher metric definition guard failed:");
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log("Teacher metric definitions guard passed: six metrics share complete DOM and export definitions.");
}

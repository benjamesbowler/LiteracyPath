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
  "\"Counts\"",
  "\"Time\"",
  "\"Excludes\"",
  "\"Guide exported at\"",
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
  "Counts:",
  "Time:",
  "Excludes:"
]) {
  if (!component.includes(token)) failures.push(`MetricDefinition.jsx: missing ${token}`);
}

const adoptions = [
  {
    file: "src/components/TeacherStudentsPage.jsx",
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
    file: "src/appState/appRuntimeServices.js",
    tokens: ["createDefinedExcelWorkbook"]
  },
  {
    file: "src/utils/exportStudentAnswerHistoryCsv.js",
    tokens: ["buildMetricDefinitionCsvRows"]
  },
  {
    file: "src/utils/exportReadingMasteryText.js",
    tokens: ["buildMetricDefinitionsText"]
  }
];

for (const adoption of adoptions) {
  const source = read(adoption.file);
  for (const token of adoption.tokens) {
    if (!source.includes(token)) failures.push(`${adoption.file}: missing ${token}`);
  }
}

// ---------------------------------------------------------------------------
// Added 2026-07-27. Everything above asserts that a STRING EXISTS. That cannot
// tell a correct definition from one that contradicts the code computing the
// figure, and it cannot tell a documented figure from one no teacher can see.
// The two checks below assert agreement, not presence.
// ---------------------------------------------------------------------------

const {
  METRIC_DEFINITIONS: definitions,
  METRIC_DEFINITIONS_SHEET_NAME: sheetName,
  RENDERED_METRIC_IDS: renderedIds,
  buildMetricDefinitionRows
} = await import("../src/utils/metricDefinitions.js");
const { LEARNING_EVIDENCE_POLICY } = await import("../src/policy/learningPolicy.js");

// The glossary module is excluded from its own render-site scan: a comment
// inside it quoting a metricId="…" literal would otherwise let a definition
// certify itself as rendered. (Observed while negative-testing this guard.)
const definitionsModulePath = path.join(repoRoot, "src/utils/metricDefinitions.js");

function collectSources(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectSources(entryPath);
    if (entryPath === definitionsModulePath) return [];
    return /\.(jsx?|tsx?)$/.test(entry.name) ? [fs.readFileSync(entryPath, "utf8")] : [];
  });
}

// 1. Every figure the export glossary documents must have a render site, so a
//    workbook never explains a number that appears on no screen.
const renderSites = collectSources(path.join(repoRoot, "src")).join("\n");

for (const row of buildMetricDefinitionRows({ generatedAt: "2026-01-01T00:00:00.000Z" })) {
  const metricId = row["Figure key"];
  const rendered = renderSites.includes(`metricId="${metricId}"`)
    || renderSites.includes(`definitionId="${metricId}"`);
  if (!rendered) {
    failures.push(
      `metricDefinitions.js: "${metricId}" is exported to the "${sheetName}"`
      + " sheet but has no metricId=/definitionId= render site in src/"
    );
  }
  if (!renderedIds.includes(metricId)) {
    failures.push(`metricDefinitions.js: "${metricId}" is exported but absent from RENDERED_METRIC_IDS`);
  }
}

// 2. Any threshold number written into a definition must be a number the policy
//    actually holds. "less than 70%" is only allowed to survive while 70 is
//    still the developing floor in learningPolicy.js.
const allowedPercents = new Set(
  Object.values(LEARNING_EVIDENCE_POLICY.accuracyPercent).map(Number)
);
const allowedCounts = new Set(
  Object.values(LEARNING_EVIDENCE_POLICY.minimumEvidence).map(Number)
);
const allowedDays = new Set([Number(LEARNING_EVIDENCE_POLICY.recency.conclusionWindowDays)]);
const numericRules = [
  { label: "percentage", pattern: /(\d+(?:\.\d+)?)%/g, allowed: allowedPercents },
  { label: "minimum evidence count", pattern: /\b(?:at least|fewer than|less than)\s+(\d+)\s+(?:tries|answers|attempts|responses|scored)/gi, allowed: allowedCounts },
  { label: "recency window", pattern: /\blast\s+(\d+)\s+days\b/gi, allowed: allowedDays }
];

for (const [metricId, definition] of Object.entries(definitions)) {
  const prose = [definition.counts, definition.timeWindow, definition.excludes].join(" ");
  for (const rule of numericRules) {
    rule.pattern.lastIndex = 0;
    for (const match of prose.matchAll(rule.pattern)) {
      if (!rule.allowed.has(Number(match[1]))) {
        failures.push(
          `metricDefinitions.js: "${metricId}" states a ${rule.label} of ${match[1]},`
          + ` which learningPolicy.js does not hold (allowed: ${[...rule.allowed].join(", ")})`
        );
      }
    }
  }
}

if (failures.length) {
  console.error("Teacher metric definition guard failed:");
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log(
    `Teacher metric definitions guard passed: ${renderedIds.length} exported figures each have a`
    + " render site, and every threshold number in the glossary matches learningPolicy.js."
  );
}

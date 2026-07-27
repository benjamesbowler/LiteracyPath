import assert from "node:assert/strict";
import test from "node:test";

import {
  buildMetricDefinitionCsvRows,
  buildMetricDefinitionRows,
  buildMetricDefinitionsText,
  createDefinedExcelWorkbook,
  METRIC_DEFINITIONS,
  METRIC_DEFINITIONS_SHEET_NAME,
  metricDefinitionText,
  RENDERED_METRIC_IDS
} from "../../src/utils/metricDefinitions.js";
import { LEARNING_EVIDENCE_POLICY } from "../../src/policy/learningPolicy.js";
import {
  buildGuidedReadingCompletionWorkbookData,
  createGuidedReadingCompletionWorkbook
} from "../../src/utils/exportGuidedReadingCompletionExcel.js";
import {
  buildClassElAssessmentExportReport,
  buildStudentElAssessmentExportReport,
  createClassElAssessmentWorkbook,
  createStudentElAssessmentWorkbook
} from "../../src/utils/exportElAssessmentExcel.js";
import { buildStudentWorkspaceCsvRows } from "../../src/utils/exportStudentWorkspaceCsv.js";

// 2026-07-26: added practising / needs-teaching / not-enough-yet / round / el-placement.
// A teacher reported a report saying "0 mastered" beside tiles showing 100% accuracy with
// no explanation of the gap. These five keys are what make the status ladder explainable
// on screen, and they ship the Excel/CSV glossary rows at the same time.
const REQUIRED_METRICS = [
  "accuracy",
  "mastered",
  "practising",
  "needs-teaching",
  "not-enough-yet",
  "round",
  "el-placement",
  "active",
  "started",
  "current-skill",
  "trails"
];
// 2026-07-27: practising / needs-teaching / not-enough-yet / el-placement are
// defined but bound to no <MetricFigure>, so they no longer ship in the export
// glossary — a workbook must not explain a figure a teacher cannot find on a
// screen. They stay in METRIC_DEFINITIONS ready to be bound.
const EXPORTED_METRICS = [
  "accuracy",
  "mastered",
  "round",
  "active",
  "started",
  "current-skill",
  "trails"
];
const UNBOUND_METRICS = REQUIRED_METRICS.filter(id => !EXPORTED_METRICS.includes(id));
const REQUIRED_FIELDS = ["Counts", "Time", "Excludes"];

function assertDefinitionsSheet(workbook) {
  const sheet = workbook.getWorksheet(METRIC_DEFINITIONS_SHEET_NAME);
  assert.ok(sheet, `${METRIC_DEFINITIONS_SHEET_NAME} worksheet exists`);
  assert.deepEqual(
    sheet.getRow(1).values.slice(1),
    ["Figure key", "Figure", ...REQUIRED_FIELDS, "Guide exported at"]
  );
  assert.deepEqual(
    sheet.getColumn(1).values.slice(2),
    EXPORTED_METRICS
  );
}

test("every required teacher figure explains counts, time, and exclusions in three lines", () => {
  assert.deepEqual(Object.keys(METRIC_DEFINITIONS), REQUIRED_METRICS);
  for (const metricId of REQUIRED_METRICS) {
    const definition = METRIC_DEFINITIONS[metricId];
    assert.ok(definition.counts);
    assert.ok(definition.timeWindow);
    assert.ok(definition.excludes);
    const tooltip = metricDefinitionText(metricId, { updatedAt: "2026-07-23T09:00:00.000Z" });
    for (const label of ["Counts:", "Time:", "Excludes:"]) {
      assert.match(tooltip, new RegExp(label));
    }
  }
  const rows = buildMetricDefinitionRows({ generatedAt: "2026-07-23T09:00:00.000Z" });
  assert.deepEqual(rows.map(row => row["Figure key"]), EXPORTED_METRICS);
  assert.ok(rows.every(row => REQUIRED_FIELDS.every(field => row[field])));
  const csvRows = buildMetricDefinitionCsvRows({ generatedAt: "2026-07-23T09:00:00.000Z" });
  assert.deepEqual(csvRows[2], ["Figure key", "Figure", ...REQUIRED_FIELDS, "Guide exported at"]);
  assert.deepEqual(csvRows.slice(3).map(row => row[0]), EXPORTED_METRICS);
  const definitionsText = buildMetricDefinitionsText({ generatedAt: "2026-07-23T09:00:00.000Z" });
  for (const metricId of EXPORTED_METRICS) {
    assert.match(definitionsText, new RegExp(METRIC_DEFINITIONS[metricId].label));
  }
});

test("the export glossary documents only figures that have an on-screen home", () => {
  assert.deepEqual([...RENDERED_METRIC_IDS], EXPORTED_METRICS);
  const exportedLabels = buildMetricDefinitionsText({ generatedAt: "2026-07-23T09:00:00.000Z" });
  for (const metricId of UNBOUND_METRICS) {
    // Still defined, still explainable in a tooltip the day someone binds it...
    assert.ok(METRIC_DEFINITIONS[metricId], `${metricId} stays defined`);
    assert.ok(metricDefinitionText(metricId));
    // ...but never shipped in a workbook or CSV while nothing renders it.
    assert.equal(exportedLabels.includes(METRIC_DEFINITIONS[metricId].label), false);
  }
});

test("every threshold number in a definition is the number the policy holds", () => {
  const { accuracyPercent, minimumEvidence, recency } = LEARNING_EVIDENCE_POLICY;
  assert.match(
    METRIC_DEFINITIONS["needs-teaching"].counts,
    new RegExp(`less than ${accuracyPercent.developingMinimum}% of the time`)
  );
  assert.match(
    METRIC_DEFINITIONS["needs-teaching"].counts,
    new RegExp(`at least ${minimumEvidence.exactItemIndependentAttempts} tries`)
  );
  assert.match(
    METRIC_DEFINITIONS["not-enough-yet"].counts,
    new RegExp(`Fewer than ${minimumEvidence.exactItemIndependentAttempts} answers`)
  );
  assert.match(
    METRIC_DEFINITIONS.practising.timeWindow,
    new RegExp(`last ${recency.conclusionWindowDays} days`)
  );
});

test("guided reading and both EL workbook exports contain the same definitions sheet", async () => {
  const generatedAt = "2026-07-23T09:00:00.000Z";
  const guided = await createGuidedReadingCompletionWorkbook({
    generatedAt,
    students: [],
    classes: [],
    guidedReadingRecordsByStudent: []
  });
  const studentReport = buildStudentElAssessmentExportReport({
    generatedAt,
    assessmentHistory: [],
    students: [],
    classes: []
  });
  const classReport = buildClassElAssessmentExportReport({
    generatedAt,
    assessmentHistory: [],
    students: [],
    classes: []
  });

  assertDefinitionsSheet(guided.workbook);
  assertDefinitionsSheet(await createStudentElAssessmentWorkbook(studentReport));
  assertDefinitionsSheet(await createClassElAssessmentWorkbook(classReport));
  assertDefinitionsSheet(await createDefinedExcelWorkbook(loader => loader()));
  assert.ok(buildGuidedReadingCompletionWorkbookData({
    generatedAt,
    students: [],
    classes: [],
    guidedReadingRecordsByStudent: []
  }).reportInfoRows.length > 0);
});

test("student workspace CSV exports append the same metric definitions", () => {
  const rows = buildStudentWorkspaceCsvRows("skills-check", {
    skillsCheck: {
      skills: [{
        skillName: "Initial Sounds",
        attemptCount: 1,
        correctCount: 8,
        totalQuestions: 10,
        accuracy: 80
      }]
    }
  });
  const definitions = rows.filter(row => row["Row type"] === "Metric definition");
  assert.equal(definitions.length, EXPORTED_METRICS.length);
  assert.deepEqual(definitions.map(row => row["Figure key"]), EXPORTED_METRICS);
  assert.ok(definitions.every(row => REQUIRED_FIELDS.every(field => row[field])));
});

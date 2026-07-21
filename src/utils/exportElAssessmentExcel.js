import {
  buildClassElAssessmentReportData,
  buildStudentElAssessmentReportData,
  hydrateElAssessmentReports,
  saveElAssessmentReport
} from "../data/elAssessmentReportStore.js";
import { isReportableElBenchmarkCandidatePlacement } from "../data/elFormalAssessmentReportBuilder.js";
import {
  buildRecommendations,
  buildWeeklyAccuracy,
  formatItemLabel,
  getSkillArea,
  normalizeItemMasteryRows
} from "../data/reportingSystem.js";
import {
  buildEngagementRow,
  buildEngagementRows,
  buildStoryQuestRows,
  collectStoryQuestProgressForStudent,
  collectStoryQuestRowsForStudents,
  collectStudentEngagementAreas,
  emptyEngagementCells,
  emptyStoryQuestCells,
  ENGAGEMENT_HEADERS,
  ENGAGEMENT_SHEET_NAME,
  engagementRowToCells,
  formatExportDateTime,
  hasPreviousComparison,
  STORY_QUEST_HEADERS,
  STORY_QUEST_SHEET_NAME,
  storyQuestRowToCells
} from "./exportReportSections.js";

// Sheets that are always present in the workbook, in tab order. The
// "Comparison" / "Progress Comparison" sheet is intentionally NOT listed:
// it is only added when a previous saved report actually exists.
export const EL_STUDENT_BENCHMARK_SHEETS = [
  "Benchmark Profile",
  "PA Strand Detail",
  "Encoding Detail",
  "Decoding Detail",
  "Fluency Detail"
];

export const EL_CLASS_BENCHMARK_SHEETS = [
  "Benchmark Class Matrix",
  "Benchmark Domain Summary",
  "Benchmark Evidence Detail"
];

export const EL_STUDENT_REPORT_SHEETS = [
  "Student Summary",
  "Assessment Attempts",
  "Progress Over Time",
  "Skills Detail",
  "Item Mastery Detail",
  "Letter Names & Sounds",
  "Guided Reading",
  STORY_QUEST_SHEET_NAME,
  ENGAGEMENT_SHEET_NAME,
  "Next Session Plan",
  "Advanced Phonics Patterns",
  "Pattern Detail",
  ...EL_STUDENT_BENCHMARK_SHEETS
];

export const EL_CLASS_REPORT_SHEETS = [
  "Class Summary",
  "Student Overview",
  "Skill Heatmap",
  "Weak Points & Groups",
  "Class Progress Over Time",
  "Per-Student Skill Detail",
  "Letter Sound Class Matrix",
  "Advanced Phonics Class Matrix",
  "Advanced Phonics Patterns",
  "Pattern Detail",
  "Skill Summary",
  STORY_QUEST_SHEET_NAME,
  ENGAGEMENT_SHEET_NAME,
  ...EL_CLASS_BENCHMARK_SHEETS
];

const EL_DESCRIPTIVE_BENCHMARK_SHEETS = new Set([
  ...EL_STUDENT_BENCHMARK_SHEETS,
  ...EL_CLASS_BENCHMARK_SHEETS
]);

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function list(value) {
  return Array.isArray(value) ? value.join(", ") : String(value || "");
}

function yesNo(value) {
  return value ? "Yes" : "No";
}

const EXPORT_COLORS = {
  navy: "FF1F3A5F",
  teal: "FF0F766E",
  blue: "FF2563EB",
  amber: "FFF59E0B",
  purple: "FF7C3AED",
  greenSoft: "FFD9FBE8",
  amberSoft: "FFFFF1C2",
  redSoft: "FFFFDADA",
  blueSoft: "FFDCEBFF",
  greySoft: "FFE5E7EB",
  white: "FFFFFFFF"
};

function latestSkillSummary(report = {}, skillName = "") {
  const normalized = String(skillName || "").toLowerCase();
  const row = (report.skillRows || []).find(item =>
    String(item.skillName || "").toLowerCase() === normalized ||
    String(item.skillName || "").toLowerCase().includes(normalized)
  );
  return row || null;
}

function addRowsOrEmpty(sheet, rows, mapper) {
  if (!rows.length) {
    sheet.addRow(mapper(null));
    return;
  }
  rows.forEach(row => sheet.addRow(mapper(row)));
}

function cellSummary(cell = {}) {
  return `${cell.statusLabel || "Not assessed"}${cell.attempts ? ` (${cell.correct}/${cell.attempts})` : ""}`;
}

function getReportStudentName(student = {}) {
  return student.name || student.studentName || "Unknown Student";
}

function buildClassWeakPointRows(report = {}) {
  if (Array.isArray(report.classWeakPointRows)) return report.classWeakPointRows;
  const records = report.sourceSnapshot?.records || [];
  const students = report.sourceSnapshot?.students || [];
  const studentIds = students.map(student => student.id).filter(Boolean);
  const studentNameById = new Map(students.map(student => [student.id, getReportStudentName(student)]));
  const denominator = Math.max(studentIds.length, 1);
  const rowsByKey = new Map();

  studentIds.forEach(studentId => {
    const studentRecords = records.filter(record => record.studentId === studentId);
    normalizeItemMasteryRows({}, studentRecords)
      .filter(row => row.attempts > 0 && row.accuracy < 70)
      .forEach(row => {
        const key = `${row.itemType}::${row.itemKey}`;
        const existing = rowsByKey.get(key) || {
          skillArea: getSkillArea({ skillId: row.skillId, skillName: row.skillName }).label,
          skillName: row.skillName,
          itemType: row.itemType,
          itemKey: row.itemKey,
          itemLabel: formatItemLabel(row.itemType, row.itemKey),
          attempts: 0,
          correct: 0,
          studentNames: new Set()
        };
        existing.attempts += row.attempts;
        existing.correct += row.correct;
        existing.studentNames.add(studentNameById.get(studentId) || studentId);
        rowsByKey.set(key, existing);
      });
  });

  return Array.from(rowsByKey.values())
    .map(row => ({
      ...row,
      accuracy: row.attempts ? Math.round((row.correct / row.attempts) * 100) : 0,
      supportStudentCount: row.studentNames.size,
      supportShare: Math.round((row.studentNames.size / denominator) * 100),
      studentNames: Array.from(row.studentNames).sort()
    }))
    .filter(row => row.supportShare >= 30 || row.accuracy < 70)
    .sort((a, b) =>
      b.supportShare - a.supportShare ||
      a.accuracy - b.accuracy ||
      a.itemLabel.localeCompare(b.itemLabel)
    )
    .slice(0, 12);
}

function cellCountSummary(group = {}) {
  return `M:${group.mastered || 0} D:${group.developing || 0} S:${group.needs_support || 0} NA:${group.not_assessed || 0}`;
}

function parsePercent(value) {
  const match = String(value ?? "").match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function fillForAccuracy(value) {
  const percent = parsePercent(value);
  if (percent === null) return null;
  if (percent >= 80) return EXPORT_COLORS.greenSoft;
  if (percent >= 60) return EXPORT_COLORS.amberSoft;
  return EXPORT_COLORS.redSoft;
}

function fillForStatus(value) {
  const normalized = String(value || "").toLowerCase();
  if (/pass|master|on track|yes|correct/.test(normalized)) return EXPORT_COLORS.greenSoft;
  if (/develop|current|progress|attempt|retry/.test(normalized)) return EXPORT_COLORS.amberSoft;
  if (/support|miss|incorrect|no|risk/.test(normalized)) return EXPORT_COLORS.redSoft;
  if (/not|unseen|reached/.test(normalized)) return EXPORT_COLORS.greySoft;
  return null;
}

function applyFill(cell, color) {
  if (!color) return;
  cell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: color }
  };
}

function styleWorksheet(sheet) {
  const descriptiveBenchmarkSheet = EL_DESCRIPTIVE_BENCHMARK_SHEETS.has(sheet.name);
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: EXPORT_COLORS.white } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: EXPORT_COLORS.navy }
  };
  headerRow.alignment = { vertical: "middle", wrapText: true };
  headerRow.height = 24;
  sheet.views = [{
    state: "frozen",
    ySplit: 1,
    xSplit: descriptiveBenchmarkSheet ? 1 : 0,
    showGridLines: !descriptiveBenchmarkSheet
  }];
  if (sheet.columnCount > 0) {
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: sheet.columnCount }
    };
  }
  sheet.properties.defaultRowHeight = 20;
  sheet.getColumn(1).font = { bold: true };
  sheet.eachRow((row, rowNumber) => {
    row.alignment = { vertical: "top", wrapText: true };
    if (rowNumber === 1) return;
    row.eachCell((cell, columnNumber) => {
      const header = String(sheet.getRow(1).getCell(columnNumber).value || "").toLowerCase();
      if (!descriptiveBenchmarkSheet && header.includes("accuracy")) applyFill(cell, fillForAccuracy(cell.value));
      if (!descriptiveBenchmarkSheet && (header.includes("status") || header.includes("passed") || header.includes("result"))) {
        applyFill(cell, fillForStatus(cell.value));
      }
    });
  });
}

function styleSummarySheet(sheet, accent = EXPORT_COLORS.teal) {
  sheet.getColumn(1).width = 30;
  sheet.getColumn(2).width = 56;
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: accent }
  };
  sheet.views = [{ state: "frozen", ySplit: 1, showGridLines: false }];
}

function stylePrintPlanSheet(sheet) {
  sheet.views = [{ showGridLines: false }];
  sheet.getColumn(1).width = 24;
  sheet.getColumn(2).width = 82;
  sheet.eachRow((row, rowNumber) => {
    row.height = rowNumber === 1 ? 28 : 42;
    row.alignment = { vertical: "top", wrapText: true };
  });
}

function orderWorksheets(workbook, preferredOrder = []) {
  if (!Array.isArray(workbook._worksheets)) return;
  const order = new Map(preferredOrder.map((name, index) => [name, index]));
  const sheets = workbook.worksheets.slice().sort((a, b) => {
    const aOrder = order.has(a.name) ? order.get(a.name) : 1000;
    const bOrder = order.has(b.name) ? order.get(b.name) : 1000;
    return aOrder - bOrder || a.name.localeCompare(b.name);
  });
  sheets.forEach((sheet, index) => {
    sheet.orderNo = index + 1;
  });
  workbook._worksheets = [undefined, ...sheets];
}

function applyWorkbookPresentation(workbook, preferredOrder = []) {
  const tabColors = {
    "Student Summary": EXPORT_COLORS.teal,
    "Class Summary": EXPORT_COLORS.teal,
    "Assessment Attempts": EXPORT_COLORS.blue,
    "Progress Over Time": EXPORT_COLORS.blue,
    "Class Progress Over Time": EXPORT_COLORS.blue,
    "Skills Detail": EXPORT_COLORS.purple,
    "Skill Heatmap": EXPORT_COLORS.purple,
    "Item Mastery Detail": EXPORT_COLORS.amber,
    "Weak Points & Groups": "FFDC2626",
    "Guided Reading": "FF16A34A",
    [STORY_QUEST_SHEET_NAME]: "FF0EA5E9",
    [ENGAGEMENT_SHEET_NAME]: EXPORT_COLORS.amber,
    "Next Session Plan": EXPORT_COLORS.navy,
    "Benchmark Profile": EXPORT_COLORS.teal,
    "PA Strand Detail": EXPORT_COLORS.blue,
    "Encoding Detail": EXPORT_COLORS.purple,
    "Decoding Detail": EXPORT_COLORS.amber,
    "Fluency Detail": EXPORT_COLORS.teal,
    "Benchmark Class Matrix": EXPORT_COLORS.blue,
    "Benchmark Domain Summary": EXPORT_COLORS.teal,
    "Benchmark Evidence Detail": EXPORT_COLORS.purple
  };
  workbook.worksheets.forEach(sheet => {
    styleWorksheet(sheet);
    if (tabColors[sheet.name]) {
      sheet.properties.tabColor = { argb: tabColors[sheet.name] };
    }
    if (sheet.name.includes("Summary")) styleSummarySheet(sheet, tabColors[sheet.name] || EXPORT_COLORS.teal);
    if (sheet.name === "Next Session Plan") stylePrintPlanSheet(sheet);
  });
  orderWorksheets(workbook, preferredOrder);
}

function setColumns(sheet, headers, wideHeaders = []) {
  sheet.columns = headers.map(header => ({
    header,
    key: header,
    width: wideHeaders.includes(header) ? 38 : Math.max(16, Math.min(30, header.length + 8))
  }));
}

function numericValue(value) {
  if (value === undefined || value === null || value === "") return "";
  const number = Number(value);
  return Number.isFinite(number) ? number : "";
}

function percentageValue(value) {
  const number = numericValue(value);
  return number === "" ? "" : number / 100;
}

function percentageText(value, emptyLabel = "Not scored") {
  const number = numericValue(value);
  return number === "" ? emptyLabel : `${number}%`;
}

function humanizeKey(value) {
  return String(value || "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, character => character.toUpperCase());
}

function evidenceText(value) {
  if (value === undefined || value === null || value === "") return "";
  if (Array.isArray(value)) return value.map(evidenceText).filter(Boolean).join(", ");
  if (typeof value === "object") {
    return Object.entries(value)
      .map(([key, nestedValue]) => {
        const text = evidenceText(nestedValue);
        return text ? `${humanizeKey(key)}: ${text}` : "";
      })
      .filter(Boolean)
      .join("; ");
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

function evidenceBoolean(value, emptyLabel = "Not scored") {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return emptyLabel;
}

function benchmarkMetricNumber(detail = {}, value) {
  return detail.performanceSuppressed ? "" : numericValue(value);
}

function benchmarkMetricPercentage(detail = {}, value) {
  return detail.performanceSuppressed ? "" : percentageValue(value);
}

function benchmarkMetricBoolean(detail = {}, value, emptyLabel = "Not scored") {
  return detail.performanceSuppressed ? "Not scored" : evidenceBoolean(value, emptyLabel);
}

function reportableCandidatePlacementText(placement) {
  return isReportableElBenchmarkCandidatePlacement(placement) ? evidenceText(placement) : "";
}

function benchmarkProfileRows(report = {}) {
  return report.benchmarkProfile || report.formalAssessments?.individualBenchmarkProfile || [];
}

function benchmarkDetailRows(report = {}) {
  return report.benchmarkDetails || report.formalAssessments?.individualBenchmarkDetails || [];
}

function classBenchmarkMatrixRows(report = {}) {
  return report.benchmarkMatrix || report.formalAssessments?.classBenchmarkMatrix || [];
}

function classBenchmarkDomainSummaryRows(report = {}) {
  return report.benchmarkDomainSummaries || report.formalAssessments?.classBenchmarkDomainSummaries || [];
}

function classBenchmarkDetailRows(report = {}) {
  return report.benchmarkDetails || report.formalAssessments?.classBenchmarkDetails || [];
}

function addPlaceholderRow(sheet, firstHeader, message, extra = {}) {
  sheet.addRow({
    [firstHeader]: message,
    ...extra
  });
}

function formatColumns(sheet, headers = [], numberFormat = "0") {
  headers.forEach(header => {
    const column = sheet.columns.find(item => item.header === header);
    if (!column) return;
    for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber += 1) {
      const cell = sheet.getRow(rowNumber).getCell(column.number);
      if (typeof cell.value === "number") cell.numFmt = numberFormat;
    }
  });
}

function formatPercentageColumns(sheet, headers = []) {
  formatColumns(sheet, headers, "0%");
}

function addStudentBenchmarkProfileSheet(workbook, report = {}) {
  const sheet = workbook.addWorksheet("Benchmark Profile");
  const percentageHeaders = [
    "PA accuracy",
    "Encoding exact spelling",
    "Encoding phonologically represented",
    "Encoding no responses",
    "Decoding accuracy",
    "Decoding automaticity",
    "Fluency accuracy"
  ];
  setColumns(sheet, [
    "Domain",
    "Assessment ID",
    "Saved evidence",
    "Administration status",
    "Saved attempts",
    "Latest date",
    "Grade",
    "Benchmark window",
    "Form version",
    "Content version",
    "Scoring version",
    "Scoring rule version",
    "PA accuracy",
    "PA strands observed",
    "Encoding exact spelling",
    "Encoding phonologically represented",
    "Decoding accuracy",
    "Decoding automaticity",
    "Candidate placement",
    "Confirmed placement",
    "Fluency WCPM",
    "Fluency accuracy",
    "Fluency prosody average",
    "Assessment validation issues",
    "Recommendations",
    "Observations",
    "Interpretation"
  ], [
    "Domain",
    "Candidate placement",
    "Confirmed placement",
    "Assessment validation issues",
    "Recommendations",
    "Observations",
    "Interpretation"
  ]);

  const profiles = benchmarkProfileRows(report);
  if (!profiles.length) {
    addPlaceholderRow(sheet, "Domain", "No benchmark profile evidence is available.", {
      "Saved evidence": "No",
      "Administration status": "No saved evidence",
      "Interpretation": "Descriptive evidence only; no cut score is applied."
    });
  } else {
    profiles.forEach(profile => {
      const metrics = profile.metrics || {};
      sheet.addRow({
        "Domain": profile.domainLabel || humanizeKey(profile.domainKey),
        "Assessment ID": profile.assessmentId || "",
        "Saved evidence": yesNo(profile.hasSavedEvidence),
        "Administration status": profile.administrationStatusLabel || humanizeKey(profile.administrationStatus),
        "Saved attempts": numericValue(profile.attemptCount),
        "Latest date": formatDate(profile.latestDate),
        "Grade": evidenceText(profile.grade),
        "Benchmark window": profile.benchmarkWindow || "",
        "Form version": profile.formVersion || "",
        "Content version": profile.contentVersion || "",
        "Scoring version": profile.scoringVersion || "",
        "Scoring rule version": profile.scoringRuleVersion || "",
        "PA accuracy": percentageValue(profile.domainKey === "phonologicalAwareness" ? metrics.accuracyRate : null),
        "PA strands observed": profile.domainKey === "phonologicalAwareness" ? numericValue(metrics.strandsObserved) : "",
        "Encoding exact spelling": percentageValue(profile.domainKey === "encoding" ? metrics.exactSpellingRate : null),
        "Encoding phonologically represented": percentageValue(profile.domainKey === "encoding" ? metrics.phonologicallyRepresentedRate : null),
        "Encoding no responses": profile.domainKey === "encoding" ? numericValue(metrics.noResponseCount) : "",
        "Decoding accuracy": percentageValue(profile.domainKey === "decoding" ? metrics.accuracyRate : null),
        "Decoding automaticity": percentageValue(profile.domainKey === "decoding" ? metrics.automaticityRate : null),
        "Fluency WCPM": profile.domainKey === "oralReadingFluency" ? numericValue(metrics.wcpm) : "",
        "Fluency accuracy": percentageValue(profile.domainKey === "oralReadingFluency" ? metrics.accuracyRate : null),
        "Fluency prosody average": profile.domainKey === "oralReadingFluency" ? numericValue(metrics.prosodyAverage) : "",
        "Candidate placement": reportableCandidatePlacementText(profile.candidatePlacement),
        "Confirmed placement": evidenceText(profile.confirmedPlacement),
        "Assessment validation issues": evidenceText(profile.validationIssues),
        "Recommendations": evidenceText(profile.recommendations),
        "Observations": evidenceText(profile.observations),
        "Interpretation": profile.interpretation || "Descriptive evidence only; no cut score is applied."
      });
    });
  }
  formatPercentageColumns(sheet, percentageHeaders);
  formatColumns(sheet, ["Fluency WCPM"], "0.0");
  formatColumns(sheet, ["Fluency prosody average"], "0.00");
}

function addStudentPaDetailSheet(workbook, report = {}) {
  const sheet = workbook.addWorksheet("PA Strand Detail");
  setColumns(sheet, [
    "Attempt ID",
    "Date",
    "Grade",
    "Benchmark window",
    "Form version",
    "Content version",
    "Scoring version",
    "Scoring rule version",
    "Administration status",
    "Prerequisite review",
    "Assessment validation issues",
    "Recommendations",
    "Observations",
    "Strand",
    "Item ID",
    "Task",
    "Prompt",
    "Student response",
    "Response status",
    "Not-scorable reason",
    "Not-scorable note",
    "Correct evidence",
    "Strand administered",
    "Strand correct",
    "Strand not scorable",
    "Strand not administered",
    "Strand accuracy",
    "Error tags",
    "Validation issues",
    "Feature tags"
  ], [
    "Assessment validation issues",
    "Recommendations",
    "Observations",
    "Prompt",
    "Student response",
    "Error tags",
    "Validation issues",
    "Feature tags"
  ]);

  const details = benchmarkDetailRows(report).filter(detail => detail.domainKey === "phonologicalAwareness");
  let rowCount = 0;
  details.forEach(detail => {
    (detail.strandRows || []).forEach(strand => {
      const items = strand.items?.length ? strand.items : [null];
      items.forEach(item => {
        rowCount += 1;
        sheet.addRow({
          "Attempt ID": detail.attemptId || "",
          "Date": formatDate(detail.completedAt),
          "Grade": evidenceText(detail.grade),
          "Benchmark window": detail.benchmarkWindow || "",
          "Form version": detail.formVersion || "",
          "Content version": detail.contentVersion || "",
          "Scoring version": detail.scoringVersion || "",
          "Scoring rule version": detail.scoringRuleVersion || "",
          "Administration status": detail.administrationStatusLabel || humanizeKey(detail.administrationStatus),
          "Prerequisite review": evidenceText(detail.prerequisiteReview),
          "Assessment validation issues": evidenceText(detail.validationIssues),
          "Recommendations": evidenceText(detail.recommendations),
          "Observations": evidenceText(detail.observations),
          "Strand": strand.strandLabel || humanizeKey(strand.strand),
          "Item ID": item?.questionId || item?.itemKey || "",
          "Task": humanizeKey(item?.task),
          "Prompt": item?.prompt || "",
          "Student response": evidenceText(item?.exactResponse),
          "Response status": humanizeKey(item?.responseStatus),
          "Not-scorable reason": item?.notScorableReason || "",
          "Not-scorable note": item?.notScorableNote || "",
          "Correct evidence": benchmarkMetricBoolean(detail, item?.isCorrect),
          "Strand administered": benchmarkMetricNumber(detail, strand.administeredCount),
          "Strand correct": benchmarkMetricNumber(detail, strand.correctCount),
          "Strand not scorable": numericValue(strand.notScorableCount),
          "Strand not administered": numericValue(strand.notAdministeredCount),
          "Strand accuracy": benchmarkMetricPercentage(detail, strand.accuracyRate),
          "Error tags": evidenceText(item?.errorTags),
          "Validation issues": evidenceText(item?.validationIssues),
          "Feature tags": evidenceText(item?.featureTags)
        });
      });
    });
  });
  if (!rowCount) {
    addPlaceholderRow(sheet, "Attempt ID", "No phonological-awareness evidence is available.", {
      "Administration status": "No saved evidence"
    });
  }
  formatPercentageColumns(sheet, ["Strand accuracy"]);
}

function addStudentEncodingDetailSheet(workbook, report = {}) {
  const sheet = workbook.addWorksheet("Encoding Detail");
  const percentageHeaders = ["Exact spelling rate", "Phonologically represented rate"];
  setColumns(sheet, [
    "Attempt ID",
    "Date",
    "Grade",
    "Benchmark window",
    "Form version",
    "Content version",
    "Scoring version",
    "Scoring rule version",
    "Administration status",
    "Prerequisite review",
    "Assessment validation issues",
    "Recommendations",
    "Observations",
    "Item ID",
    "Target spelling",
    "Student spelling",
    "Response status",
    "Not-scorable reason",
    "Not-scorable note",
    "Scoring code",
    "Exact spelling",
    "Plausible spelling",
    "Not yet represented",
    "Exact spelling count",
    "Plausible spelling count",
    "Not-yet count",
    "No-response count",
    ...percentageHeaders,
    "Error tags",
    "Validation issues",
    "Feature tags"
  ], [
    "Assessment validation issues",
    "Recommendations",
    "Observations",
    "Target spelling",
    "Student spelling",
    "Error tags",
    "Validation issues",
    "Feature tags"
  ]);

  const details = benchmarkDetailRows(report).filter(detail => detail.domainKey === "encoding");
  let rowCount = 0;
  details.forEach(detail => {
    const items = detail.itemDetails?.length ? detail.itemDetails : [null];
    items.forEach(item => {
      rowCount += 1;
      sheet.addRow({
        "Attempt ID": detail.attemptId || "",
        "Date": formatDate(detail.completedAt),
        "Grade": evidenceText(detail.grade),
        "Benchmark window": detail.benchmarkWindow || "",
        "Form version": detail.formVersion || "",
        "Content version": detail.contentVersion || "",
        "Scoring version": detail.scoringVersion || "",
        "Scoring rule version": detail.scoringRuleVersion || "",
        "Administration status": detail.administrationStatusLabel || humanizeKey(detail.administrationStatus),
        "Prerequisite review": evidenceText(detail.prerequisiteReview),
        "Assessment validation issues": evidenceText(detail.validationIssues),
        "Recommendations": evidenceText(detail.recommendations),
        "Observations": evidenceText(detail.observations),
        "Item ID": item?.questionId || item?.itemKey || "",
        "Target spelling": item?.targetSpelling || item?.targetWord || "",
        "Student spelling": evidenceText(item?.studentSpelling ?? item?.exactResponse),
        "Response status": humanizeKey(item?.responseStatus),
        "Not-scorable reason": item?.notScorableReason || "",
        "Not-scorable note": item?.notScorableNote || "",
        "Scoring code": humanizeKey(item?.scoringCode),
        "Exact spelling": benchmarkMetricBoolean(detail, item?.exact, "Not administered"),
        "Plausible spelling": benchmarkMetricBoolean(detail, item?.plausible, "Not administered"),
        "Not yet represented": benchmarkMetricBoolean(detail, item?.notYet, "Not administered"),
        "Exact spelling count": benchmarkMetricNumber(detail, detail.exactSpellingCount),
        "Plausible spelling count": benchmarkMetricNumber(detail, detail.plausibleSpellingCount),
        "Not-yet count": benchmarkMetricNumber(detail, detail.notYetCount),
        "No-response count": benchmarkMetricNumber(detail, detail.noResponseCount),
        "Exact spelling rate": benchmarkMetricPercentage(detail, detail.exactSpellingRate),
        "Phonologically represented rate": benchmarkMetricPercentage(detail, detail.phonologicallyRepresentedRate),
        "Error tags": evidenceText(item?.errorTags),
        "Validation issues": evidenceText(item?.validationIssues),
        "Feature tags": evidenceText(item?.featureTags)
      });
    });
  });
  if (!rowCount) {
    addPlaceholderRow(sheet, "Attempt ID", "No encoding evidence is available.", {
      "Administration status": "No saved evidence"
    });
  }
  formatPercentageColumns(sheet, percentageHeaders);
}

function addStudentDecodingDetailSheet(workbook, report = {}) {
  const sheet = workbook.addWorksheet("Decoding Detail");
  const percentageHeaders = [
    "Band accuracy",
    "Band automaticity",
    "Attempt accuracy",
    "Attempt automaticity",
    "Automatic among accurate"
  ];
  setColumns(sheet, [
    "Attempt ID",
    "Date",
    "Grade",
    "Benchmark window",
    "Form version",
    "Content version",
    "Scoring version",
    "Scoring rule version",
    "Administration status",
    "Prerequisite review",
    "Assessment validation issues",
    "Recommendations",
    "Observations",
    "Band",
    "Microphase",
    "Item ID",
    "Target word",
    "Target pattern",
    "Student response",
    "Response status",
    "Not-scorable reason",
    "Not-scorable note",
    "Scoring code",
    "Accurate",
    "Automatic",
    "Self-corrected",
    ...percentageHeaders,
    "Accurate count",
    "Automatic count",
    "Accurate after sounding count",
    "Self-corrected count",
    "Stop triggered",
    "Stop cycle anchor",
    "Stop band",
    "Stop reason",
    "Stop rule",
    "Unadministered after stop",
    "Candidate placement",
    "Confirmed placement",
    "Placement source",
    "Teacher override reason",
    "Error tags",
    "Validation issues"
  ], [
    "Target word",
    "Student response",
    "Stop reason",
    "Stop rule",
    "Candidate placement",
    "Confirmed placement",
    "Teacher override reason",
    "Assessment validation issues",
    "Recommendations",
    "Observations",
    "Error tags",
    "Validation issues"
  ]);

  const details = benchmarkDetailRows(report).filter(detail => detail.domainKey === "decoding");
  let rowCount = 0;
  details.forEach(detail => {
    const bandById = new Map((detail.bandRows || []).map(band => [String(band.bandId || ""), band]));
    const items = detail.itemDetails?.length ? detail.itemDetails : [null];
    items.forEach(item => {
      rowCount += 1;
      const itemBandId = String(item?.bandId || (item?.microphase ? `microphase-${item.microphase}` : ""));
      const band = bandById.get(itemBandId) || null;
      sheet.addRow({
        "Attempt ID": detail.attemptId || "",
        "Date": formatDate(detail.completedAt),
        "Grade": evidenceText(detail.grade),
        "Benchmark window": detail.benchmarkWindow || "",
        "Form version": detail.formVersion || "",
        "Content version": detail.contentVersion || "",
        "Scoring version": detail.scoringVersion || "",
        "Scoring rule version": detail.scoringRuleVersion || "",
        "Administration status": detail.administrationStatusLabel || humanizeKey(detail.administrationStatus),
        "Prerequisite review": evidenceText(detail.prerequisiteReview),
        "Assessment validation issues": evidenceText(detail.validationIssues),
        "Recommendations": evidenceText(detail.recommendations),
        "Observations": evidenceText(detail.observations),
        "Band": item?.bandId || band?.bandId || "",
        "Microphase": numericValue(item?.microphase ?? band?.microphase),
        "Item ID": item?.questionId || item?.itemKey || "",
        "Target word": item?.targetWord || "",
        "Target pattern": item?.targetPattern || "",
        "Student response": evidenceText(item?.exactResponse),
        "Response status": humanizeKey(item?.responseStatus),
        "Not-scorable reason": item?.notScorableReason || "",
        "Not-scorable note": item?.notScorableNote || "",
        "Scoring code": humanizeKey(item?.scoringCode),
        "Accurate": benchmarkMetricBoolean(detail, item?.accurate, "Not administered"),
        "Automatic": benchmarkMetricBoolean(detail, item?.automatic, "Not administered"),
        "Self-corrected": benchmarkMetricBoolean(detail, item?.selfCorrected, "Not recorded"),
        "Band accuracy": benchmarkMetricPercentage(detail, band?.accuracyRate),
        "Band automaticity": benchmarkMetricPercentage(detail, band?.automaticityRate),
        "Attempt accuracy": benchmarkMetricPercentage(detail, detail.accuracyRate),
        "Attempt automaticity": benchmarkMetricPercentage(detail, detail.automaticityRate),
        "Automatic among accurate": benchmarkMetricPercentage(detail, detail.automaticAmongAccurateRate),
        "Accurate count": benchmarkMetricNumber(detail, detail.accurateCount),
        "Automatic count": benchmarkMetricNumber(detail, detail.automaticCount),
        "Accurate after sounding count": benchmarkMetricNumber(detail, detail.accurateAfterSoundingCount),
        "Self-corrected count": benchmarkMetricNumber(detail, detail.selfCorrectedCount),
        "Stop triggered": evidenceBoolean(detail.stopEvidence?.triggered, "No"),
        "Stop cycle anchor": detail.stopEvidence?.stopCycleAnchorLabel || detail.stopEvidence?.stopCycleAnchor || "",
        "Stop band": evidenceText(detail.stopEvidence?.stopBand),
        "Stop reason": detail.stopEvidence?.reason || "",
        "Stop rule": evidenceText(detail.stopEvidence?.stopRule),
        "Unadministered after stop": numericValue(detail.stopEvidence?.unadministeredItems),
        "Candidate placement": reportableCandidatePlacementText(detail.candidatePlacement),
        "Confirmed placement": evidenceText(detail.confirmedPlacement),
        "Placement source": humanizeKey(detail.placementSource),
        "Teacher override reason": detail.teacherOverrideReason || "",
        "Error tags": evidenceText(item?.errorTags),
        "Validation issues": evidenceText(item?.validationIssues)
      });
    });
  });
  if (!rowCount) {
    addPlaceholderRow(sheet, "Attempt ID", "No decoding evidence is available.", {
      "Administration status": "No saved evidence"
    });
  }
  formatPercentageColumns(sheet, percentageHeaders);
}

function addStudentFluencyDetailSheet(workbook, report = {}) {
  const sheet = workbook.addWorksheet("Fluency Detail");
  setColumns(sheet, [
    "Attempt ID",
    "Date",
    "Grade",
    "Benchmark window",
    "Form version",
    "Content version",
    "Scoring version",
    "Scoring rule version",
    "Administration status",
    "Prerequisite review",
    "Assessment validation issues",
    "Recommendations",
    "Observations",
    "Passage ID",
    "Passage title",
    "Microphase",
    "Evidence status",
    "Passage judgment",
    "Student transcription",
    "Not-scorable reason",
    "Not-scorable note",
    "Validation issues",
    "Elapsed seconds",
    "Timer interrupted",
    "Interruption reason",
    "Zero words reached",
    "Words attempted",
    "Words correct",
    "Errors",
    "Self-corrections",
    "WCPM",
    "Accuracy",
    "Route judgment usable",
    "Route decision",
    "Accuracy judgment source",
    "Accuracy judged at",
    "Informational notes",
    "Prosody expression",
    "Prosody phrasing",
    "Prosody smoothness",
    "Prosody pace",
    "Prosody average",
    "Other prosody ratings",
    "Stop reason",
    "Accommodations",
    "Interpretation"
  ], [
    "Assessment validation issues",
    "Recommendations",
    "Observations",
    "Passage title",
    "Student transcription",
    "Validation issues",
    "Interruption reason",
    "Route decision",
    "Informational notes",
    "Other prosody ratings",
    "Accommodations",
    "Interpretation"
  ]);

  const details = benchmarkDetailRows(report).filter(detail => detail.domainKey === "oralReadingFluency");
  if (!details.length) {
    addPlaceholderRow(sheet, "Attempt ID", "No oral-reading-fluency evidence is available.", {
      "Administration status": "No saved evidence"
    });
  } else {
    details.forEach(detail => {
      const passages = detail.passageRows?.length ? detail.passageRows : [detail];
      passages.forEach(passage => {
        const prosody = passage.prosody || {};
        const otherProsody = Object.fromEntries(Object.entries(prosody).filter(([key]) => (
          !["expression", "phrasing", "smoothness", "pace"].includes(key)
        )));
        sheet.addRow({
          "Attempt ID": detail.attemptId || "",
          "Date": formatDate(detail.completedAt),
          "Grade": evidenceText(detail.grade),
          "Benchmark window": detail.benchmarkWindow || "",
          "Form version": detail.formVersion || "",
          "Content version": detail.contentVersion || "",
          "Scoring version": detail.scoringVersion || "",
          "Scoring rule version": detail.scoringRuleVersion || "",
          "Administration status": detail.administrationStatusLabel || humanizeKey(detail.administrationStatus),
          "Prerequisite review": evidenceText(detail.prerequisiteReview),
          "Assessment validation issues": evidenceText(detail.validationIssues),
          "Recommendations": evidenceText(detail.recommendations),
          "Observations": evidenceText(detail.observations),
          "Passage ID": passage.passageId || detail.passageId || "",
          "Passage title": passage.passageTitle || detail.passageTitle || "",
          "Microphase": humanizeKey(passage.microphase),
          "Evidence status": humanizeKey(passage.evidenceStatus),
          "Passage judgment": detail.performanceSuppressed
            ? "Not scored"
            : passage.passageAccurate === true
              ? "Accurate"
              : passage.passageAccurate === false
                ? "Not accurate"
                : "Not recorded",
          "Student transcription": evidenceText(passage.exactResponse),
          "Not-scorable reason": passage.notScorableReason || "",
          "Not-scorable note": passage.notScorableNote || "",
          "Validation issues": evidenceText(passage.validationIssues),
          "Elapsed seconds": benchmarkMetricNumber(detail, passage.elapsedSeconds),
          "Timer interrupted": yesNo(passage.timerInterrupted === true),
          "Interruption reason": passage.interruptionReason || "",
          "Zero words reached": benchmarkMetricBoolean(detail, passage.zeroWordsReached, "Not recorded"),
          "Words attempted": benchmarkMetricNumber(detail, passage.wordsAttempted),
          "Words correct": benchmarkMetricNumber(detail, passage.wordsCorrect),
          "Errors": benchmarkMetricNumber(detail, passage.errors),
          "Self-corrections": benchmarkMetricNumber(detail, passage.selfCorrections),
          "WCPM": benchmarkMetricNumber(detail, passage.wcpm),
          "Accuracy": benchmarkMetricPercentage(detail, passage.accuracyRate),
          "Route judgment usable": benchmarkMetricBoolean(detail, passage.routeJudgmentUsable, "Not recorded"),
          "Route decision": evidenceText(passage.routeDecision),
          "Accuracy judgment source": humanizeKey(passage.accuracyJudgmentSource),
          "Accuracy judged at": formatExportDateTime(passage.accuracyJudgedAt),
          "Informational notes": evidenceText(passage.informationalNotes),
          "Prosody expression": benchmarkMetricNumber(detail, prosody.expression),
          "Prosody phrasing": benchmarkMetricNumber(detail, prosody.phrasing),
          "Prosody smoothness": benchmarkMetricNumber(detail, prosody.smoothness),
          "Prosody pace": benchmarkMetricNumber(detail, prosody.pace),
          "Prosody average": benchmarkMetricNumber(detail, passage.prosodyAverage),
          "Other prosody ratings": detail.performanceSuppressed ? "" : evidenceText(otherProsody),
          "Stop reason": detail.stopEvidence?.passageId === passage.passageId ? detail.stopEvidence.reason || "Stopped at this passage" : "",
          "Accommodations": evidenceText(detail.accommodations),
          "Interpretation": detail.interpretation || "Descriptive evidence only; no cut score is applied."
        });
      });
    });
  }
  formatPercentageColumns(sheet, ["Accuracy"]);
  formatColumns(sheet, ["WCPM"], "0.0");
  formatColumns(sheet, [
    "Prosody expression",
    "Prosody phrasing",
    "Prosody smoothness",
    "Prosody pace",
    "Prosody average"
  ], "0.00");
}

function addStudentBenchmarkSheets(workbook, report = {}) {
  addStudentBenchmarkProfileSheet(workbook, report);
  addStudentPaDetailSheet(workbook, report);
  addStudentEncodingDetailSheet(workbook, report);
  addStudentDecodingDetailSheet(workbook, report);
  addStudentFluencyDetailSheet(workbook, report);
}

function benchmarkMatrixCell(row = {}, domainKey = "") {
  return row[domainKey] || row.cells?.[domainKey] || {};
}

function addClassBenchmarkMatrixSheet(workbook, report = {}) {
  const sheet = workbook.addWorksheet("Benchmark Class Matrix");
  const percentageHeaders = [
    "PA accuracy",
    "Encoding exact spelling",
    "Encoding phonologically represented",
    "Decoding accuracy",
    "Decoding automaticity",
    "Fluency accuracy"
  ];
  setColumns(sheet, [
    "Student",
    "Student ID",
    "PA evidence",
    "PA administration status",
    "PA accuracy",
    "PA strands observed",
    "Encoding evidence",
    "Encoding administration status",
    "Encoding exact spelling",
    "Encoding phonologically represented",
    "Decoding evidence",
    "Decoding administration status",
    "Decoding accuracy",
    "Decoding automaticity",
    "Decoding stopped",
    "Candidate placement",
    "Confirmed placement",
    "Fluency evidence",
    "Fluency administration status",
    "Fluency WCPM",
    "Fluency accuracy",
    "Fluency prosody average"
  ], [
    "Student",
    "PA administration status",
    "Encoding administration status",
    "Decoding administration status",
    "Candidate placement",
    "Confirmed placement",
    "Fluency administration status"
  ]);

  const rows = classBenchmarkMatrixRows(report);
  const detailByStudentAndAttempt = new Map(classBenchmarkDetailRows(report).map(detail => [
    `${detail.studentId || detail.studentName || ""}::${detail.attemptId || ""}`,
    detail
  ]));
  if (!rows.length) {
    addPlaceholderRow(sheet, "Student", "No students are available for the benchmark matrix.", {
      "PA evidence": "No",
      "Encoding evidence": "No",
      "Decoding evidence": "No",
      "Fluency evidence": "No"
    });
  } else {
    rows.forEach(row => {
      const pa = benchmarkMatrixCell(row, "phonologicalAwareness");
      const encoding = benchmarkMatrixCell(row, "encoding");
      const decoding = benchmarkMatrixCell(row, "decoding");
      const fluency = benchmarkMatrixCell(row, "oralReadingFluency");
      const decodingDetail = detailByStudentAndAttempt.get(
        `${row.studentId || row.studentName || ""}::${decoding.latestAttemptId || ""}`
      );
      sheet.addRow({
        "Student": row.studentName || "Unknown Student",
        "Student ID": row.studentId || "",
        "PA evidence": yesNo(pa.hasSavedEvidence),
        "PA administration status": pa.administrationStatusLabel || humanizeKey(pa.administrationStatus),
        "PA accuracy": percentageValue(pa.metrics?.accuracyRate),
        "PA strands observed": numericValue(pa.metrics?.strandsObserved),
        "Encoding evidence": yesNo(encoding.hasSavedEvidence),
        "Encoding administration status": encoding.administrationStatusLabel || humanizeKey(encoding.administrationStatus),
        "Encoding exact spelling": percentageValue(encoding.metrics?.exactSpellingRate),
        "Encoding phonologically represented": percentageValue(encoding.metrics?.phonologicallyRepresentedRate),
        "Decoding evidence": yesNo(decoding.hasSavedEvidence),
        "Decoding administration status": decoding.administrationStatusLabel || humanizeKey(decoding.administrationStatus),
        "Decoding accuracy": percentageValue(decoding.metrics?.accuracyRate),
        "Decoding automaticity": percentageValue(decoding.metrics?.automaticityRate),
        "Decoding stopped": decodingDetail?.stopEvidence?.triggered || decoding.administrationStatus === "discontinued" ? "Yes" : "No",
        "Candidate placement": reportableCandidatePlacementText(decoding.candidatePlacement),
        "Confirmed placement": evidenceText(decoding.confirmedPlacement),
        "Fluency evidence": yesNo(fluency.hasSavedEvidence),
        "Fluency administration status": fluency.administrationStatusLabel || humanizeKey(fluency.administrationStatus),
        "Fluency WCPM": numericValue(fluency.metrics?.wcpm),
        "Fluency accuracy": percentageValue(fluency.metrics?.accuracyRate),
        "Fluency prosody average": numericValue(fluency.metrics?.prosodyAverage)
      });
    });
  }
  formatPercentageColumns(sheet, percentageHeaders);
  formatColumns(sheet, ["Fluency WCPM"], "0.0");
  formatColumns(sheet, ["Fluency prosody average"], "0.00");
}

function formatPaStrandSummaries(strands = []) {
  return strands.map(strand => {
    const rate = numericValue(strand.accuracyRate);
    const accuracy = rate === "" ? "not calculated" : `${rate}%`;
    return `${strand.strandLabel || humanizeKey(strand.strand)}: ${accuracy}; ${strand.studentsObserved || 0} student(s); ${strand.correctCount || 0}/${strand.administeredCount || 0} items`;
  }).join("\n");
}

function formatPlacementRows(rows = []) {
  return rows.map(row => `${row.studentName || row.studentId || "Student"}: ${evidenceText(row.placement)}`).join("\n");
}

function addClassBenchmarkDomainSummarySheet(workbook, report = {}) {
  const sheet = workbook.addWorksheet("Benchmark Domain Summary");
  const percentageHeaders = [
    "PA average accuracy",
    "Encoding average exact spelling",
    "Encoding average phonologically represented",
    "Decoding average accuracy",
    "Decoding average automaticity",
    "Fluency average accuracy"
  ];
  setColumns(sheet, [
    "Domain",
    "Assessment ID",
    "Grade",
    "Benchmark window",
    "Total students",
    "Students with saved evidence",
    "Students with scored evidence",
    "Students without saved evidence",
    "Completed",
    "Partial",
    "Discontinued",
    "In progress",
    "Not administered",
    "Not scorable",
    "No record",
    "PA average accuracy",
    "PA strand summaries",
    "Encoding average exact spelling",
    "Encoding average phonologically represented",
    "Encoding exact count",
    "Encoding plausible count",
    "Encoding not-yet count",
    "Encoding no-response count",
    "Decoding average accuracy",
    "Decoding average automaticity",
    "Decoding accurate count",
    "Decoding automatic count",
    "Stopped / discontinued students",
    "Fluency average WCPM",
    "Fluency average accuracy",
    "Fluency average prosody",
    "Candidate placements",
    "Confirmed placements",
    "Interpretation"
  ], [
    "Domain",
    "PA strand summaries",
    "Stopped / discontinued students",
    "Candidate placements",
    "Confirmed placements",
    "Interpretation"
  ]);

  const summaries = classBenchmarkDomainSummaryRows(report);
  if (!summaries.length) {
    addPlaceholderRow(sheet, "Domain", "No class benchmark summaries are available.", {
      "Interpretation": "Descriptive evidence only; no cut score is applied."
    });
  } else {
    summaries.forEach(summary => {
      const metrics = summary.metrics || {};
      const counts = summary.administrationCounts || {};
      sheet.addRow({
        "Domain": summary.domainLabel || humanizeKey(summary.domainKey),
        "Assessment ID": summary.assessmentId || "",
        "Grade": evidenceText(summary.grade || report.benchmarkScope?.grade),
        "Benchmark window": summary.benchmarkWindow || report.benchmarkScope?.benchmarkWindow || "",
        "Total students": numericValue(summary.totalStudents),
        "Students with saved evidence": numericValue(summary.studentsWithSavedEvidence),
        "Students with scored evidence": numericValue(summary.studentsWithScoredEvidence),
        "Students without saved evidence": numericValue(summary.studentsWithoutSavedEvidence),
        "Completed": numericValue(counts.completed),
        "Partial": numericValue(counts.partial),
        "Discontinued": numericValue(counts.discontinued),
        "In progress": numericValue(counts.in_progress),
        "Not administered": numericValue(counts.not_administered),
        "Not scorable": numericValue(counts.not_scorable),
        "No record": numericValue(counts.no_record),
        "PA average accuracy": percentageValue(summary.domainKey === "phonologicalAwareness" ? metrics.averageAccuracyRate : null),
        "PA strand summaries": summary.domainKey === "phonologicalAwareness" ? formatPaStrandSummaries(metrics.strandSummaries) : "",
        "Encoding average exact spelling": percentageValue(summary.domainKey === "encoding" ? metrics.averageExactSpellingRate : null),
        "Encoding average phonologically represented": percentageValue(summary.domainKey === "encoding" ? metrics.averagePhonologicallyRepresentedRate : null),
        "Encoding exact count": summary.domainKey === "encoding" ? numericValue(metrics.exactSpellingCount) : "",
        "Encoding plausible count": summary.domainKey === "encoding" ? numericValue(metrics.plausibleSpellingCount) : "",
        "Encoding not-yet count": summary.domainKey === "encoding" ? numericValue(metrics.notYetCount) : "",
        "Encoding no-response count": summary.domainKey === "encoding" ? numericValue(metrics.noResponseCount) : "",
        "Decoding average accuracy": percentageValue(summary.domainKey === "decoding" ? metrics.averageAccuracyRate : null),
        "Decoding average automaticity": percentageValue(summary.domainKey === "decoding" ? metrics.averageAutomaticityRate : null),
        "Decoding accurate count": summary.domainKey === "decoding" ? numericValue(metrics.accurateCount) : "",
        "Decoding automatic count": summary.domainKey === "decoding" ? numericValue(metrics.automaticCount) : "",
        "Stopped / discontinued students": summary.domainKey === "decoding" ? evidenceText(metrics.stoppedOrDiscontinuedStudents) : "",
        "Fluency average WCPM": summary.domainKey === "oralReadingFluency" ? numericValue(metrics.averageWcpm) : "",
        "Fluency average accuracy": percentageValue(summary.domainKey === "oralReadingFluency" ? metrics.averageAccuracyRate : null),
        "Fluency average prosody": summary.domainKey === "oralReadingFluency" ? numericValue(metrics.averageProsody) : "",
        "Candidate placements": formatPlacementRows(summary.candidatePlacements),
        "Confirmed placements": formatPlacementRows(summary.confirmedPlacements),
        "Interpretation": summary.interpretation || "Descriptive evidence only; no cut score is applied."
      });
    });
  }
  formatPercentageColumns(sheet, percentageHeaders);
  formatColumns(sheet, ["Fluency average WCPM"], "0.0");
  formatColumns(sheet, ["Fluency average prosody"], "0.00");
}

function benchmarkDetailItems(detail = {}) {
  if (detail.domainKey === "phonologicalAwareness") {
    if (detail.itemDetails?.length) {
      return detail.itemDetails.map(item => {
        const strand = (detail.strandRows || []).find(row => row.strand === item.strand);
        return {
          item,
          strand: strand?.strandLabel || humanizeKey(item.strand),
          strandAccuracy: strand?.accuracyRate ?? null
        };
      });
    }
    return (detail.strandRows || []).flatMap(strand => {
      const items = strand.items?.length ? strand.items : [null];
      return items.map(item => ({
        item,
        strand: strand.strandLabel || humanizeKey(strand.strand),
        strandAccuracy: strand.accuracyRate
      }));
    });
  }
  const items = detail.itemDetails?.length ? detail.itemDetails : [null];
  return items.map(item => ({
    item,
    strand: item?.bandId || (item?.microphase ? `Microphase ${item.microphase}` : ""),
    strandAccuracy: null
  }));
}

function addClassBenchmarkEvidenceDetailSheet(workbook, report = {}) {
  const sheet = workbook.addWorksheet("Benchmark Evidence Detail");
  const percentageHeaders = [
    "PA strand accuracy",
    "PA attempt accuracy",
    "Encoding exact rate",
    "Encoding phonologically represented rate",
    "Decoding accuracy",
    "Decoding automaticity",
    "Fluency accuracy"
  ];
  setColumns(sheet, [
    "Student",
    "Student ID",
    "Domain",
    "Assessment ID",
    "Attempt ID",
    "Date",
    "Grade",
    "Benchmark window",
    "Form version",
    "Content version",
    "Scoring version",
    "Scoring rule version",
    "Administration status",
    "Prerequisite review",
    "Assessment validation issues",
    "Recommendations",
    "Observations",
    "Strand / band",
    "Task",
    "Microphase",
    "Item ID",
    "Target / prompt",
    "Student response",
    "Response status",
    "Not-scorable reason",
    "Not-scorable note",
    "Scoring code",
    "Correct evidence",
    "Exact spelling",
    "Plausible spelling",
    "Not yet represented",
    "Accurate decoding",
    "Automatic decoding",
    "Self-corrected",
    ...percentageHeaders,
    "Fluency elapsed seconds",
    "Fluency timer interrupted",
    "Fluency interruption reason",
    "Fluency zero words reached",
    "Fluency words attempted",
    "Fluency words correct",
    "Fluency errors",
    "Fluency self-corrections",
    "Fluency WCPM",
    "Fluency passage judgment",
    "Fluency route judgment usable",
    "Fluency route decision",
    "Fluency accuracy judgment source",
    "Fluency accuracy judged at",
    "Fluency informational notes",
    "Fluency prosody average",
    "Prosody ratings",
    "Stop triggered",
    "Stop cycle anchor / band",
    "Stop reason",
    "Candidate placement",
    "Confirmed placement",
    "Placement source",
    "Error tags",
    "Validation issues",
    "Feature tags",
    "Interpretation"
  ], [
    "Student",
    "Domain",
    "Target / prompt",
    "Student response",
    "Prosody ratings",
    "Fluency interruption reason",
    "Fluency route decision",
    "Fluency informational notes",
    "Stop cycle anchor / band",
    "Stop reason",
    "Candidate placement",
    "Confirmed placement",
    "Error tags",
    "Assessment validation issues",
    "Recommendations",
    "Observations",
    "Validation issues",
    "Feature tags",
    "Interpretation"
  ]);

  const details = classBenchmarkDetailRows(report);
  let rowCount = 0;
  details.forEach(detail => {
    const entries = benchmarkDetailItems(detail);
    const rows = entries.length ? entries : [{ item: null, strand: "", strandAccuracy: null }];
    rows.forEach(({ item, strand, strandAccuracy }) => {
      rowCount += 1;
      const target = item?.targetSpelling || item?.targetWord || item?.targetPattern || item?.prompt || detail.passageTitle || "";
      sheet.addRow({
        "Student": detail.studentName || "Unknown Student",
        "Student ID": detail.studentId || "",
        "Domain": detail.domainLabel || humanizeKey(detail.domainKey),
        "Assessment ID": detail.assessmentId || "",
        "Attempt ID": detail.attemptId || "",
        "Date": formatDate(detail.completedAt),
        "Grade": evidenceText(detail.grade),
        "Benchmark window": detail.benchmarkWindow || "",
        "Form version": detail.formVersion || "",
        "Content version": detail.contentVersion || "",
        "Scoring version": detail.scoringVersion || "",
        "Scoring rule version": detail.scoringRuleVersion || "",
        "Administration status": detail.administrationStatusLabel || humanizeKey(detail.administrationStatus),
        "Prerequisite review": evidenceText(detail.prerequisiteReview),
        "Assessment validation issues": evidenceText(detail.validationIssues),
        "Recommendations": evidenceText(detail.recommendations),
        "Observations": evidenceText(detail.observations),
        "Strand / band": strand,
        "Task": humanizeKey(item?.task),
        "Microphase": numericValue(item?.microphase),
        "Item ID": item?.questionId || item?.itemKey || detail.passageId || "",
        "Target / prompt": target,
        "Student response": evidenceText(item?.exactResponse || item?.studentSpelling),
        "Response status": humanizeKey(item?.responseStatus),
        "Not-scorable reason": item?.notScorableReason || "",
        "Not-scorable note": item?.notScorableNote || "",
        "Scoring code": humanizeKey(item?.scoringCode),
        "Correct evidence": benchmarkMetricBoolean(detail, item?.isCorrect),
        "Exact spelling": detail.domainKey === "encoding" ? benchmarkMetricBoolean(detail, item?.exact, "Not administered") : "",
        "Plausible spelling": detail.domainKey === "encoding" ? benchmarkMetricBoolean(detail, item?.plausible, "Not administered") : "",
        "Not yet represented": detail.domainKey === "encoding" ? benchmarkMetricBoolean(detail, item?.notYet, "Not administered") : "",
        "Accurate decoding": detail.domainKey === "decoding" ? benchmarkMetricBoolean(detail, item?.accurate, "Not administered") : "",
        "Automatic decoding": detail.domainKey === "decoding" ? benchmarkMetricBoolean(detail, item?.automatic, "Not administered") : "",
        "Self-corrected": detail.domainKey === "decoding" ? benchmarkMetricBoolean(detail, item?.selfCorrected, "Not recorded") : "",
        "PA strand accuracy": benchmarkMetricPercentage(detail, detail.domainKey === "phonologicalAwareness" ? strandAccuracy : null),
        "PA attempt accuracy": benchmarkMetricPercentage(detail, detail.domainKey === "phonologicalAwareness" ? detail.accuracyRate : null),
        "Encoding exact rate": benchmarkMetricPercentage(detail, detail.domainKey === "encoding" ? detail.exactSpellingRate : null),
        "Encoding phonologically represented rate": benchmarkMetricPercentage(detail, detail.domainKey === "encoding" ? detail.phonologicallyRepresentedRate : null),
        "Decoding accuracy": benchmarkMetricPercentage(detail, detail.domainKey === "decoding" ? detail.accuracyRate : null),
        "Decoding automaticity": benchmarkMetricPercentage(detail, detail.domainKey === "decoding" ? detail.automaticityRate : null),
        "Fluency elapsed seconds": detail.domainKey === "oralReadingFluency" ? benchmarkMetricNumber(detail, item?.elapsedSeconds ?? detail.elapsedSeconds) : "",
        "Fluency timer interrupted": detail.domainKey === "oralReadingFluency" ? evidenceBoolean(item?.timerInterrupted, "Not recorded") : "",
        "Fluency interruption reason": detail.domainKey === "oralReadingFluency" ? item?.interruptionReason || "" : "",
        "Fluency zero words reached": detail.domainKey === "oralReadingFluency" ? benchmarkMetricBoolean(detail, item?.zeroWordsReached, "Not recorded") : "",
        "Fluency words attempted": detail.domainKey === "oralReadingFluency" ? benchmarkMetricNumber(detail, item?.wordsAttempted ?? detail.wordsAttempted) : "",
        "Fluency words correct": detail.domainKey === "oralReadingFluency" ? benchmarkMetricNumber(detail, item?.wordsCorrect ?? detail.wordsCorrect) : "",
        "Fluency errors": detail.domainKey === "oralReadingFluency" ? benchmarkMetricNumber(detail, item?.errors ?? detail.errors) : "",
        "Fluency self-corrections": detail.domainKey === "oralReadingFluency" ? benchmarkMetricNumber(detail, item?.selfCorrections ?? detail.selfCorrections) : "",
        "Fluency WCPM": detail.domainKey === "oralReadingFluency" ? benchmarkMetricNumber(detail, item?.wcpm ?? detail.wcpm) : "",
        "Fluency accuracy": benchmarkMetricPercentage(detail, detail.domainKey === "oralReadingFluency" ? item?.accuracyRate ?? detail.accuracyRate : null),
        "Fluency passage judgment": detail.domainKey === "oralReadingFluency" && !detail.performanceSuppressed
          ? item?.passageAccurate === true
            ? "Accurate"
            : item?.passageAccurate === false
              ? "Not accurate"
              : "Not recorded"
          : "",
        "Fluency route judgment usable": detail.domainKey === "oralReadingFluency" ? benchmarkMetricBoolean(detail, item?.routeJudgmentUsable, "Not recorded") : "",
        "Fluency route decision": detail.domainKey === "oralReadingFluency" ? evidenceText(item?.routeDecision) : "",
        "Fluency accuracy judgment source": detail.domainKey === "oralReadingFluency" ? humanizeKey(item?.accuracyJudgmentSource) : "",
        "Fluency accuracy judged at": detail.domainKey === "oralReadingFluency" ? formatExportDateTime(item?.accuracyJudgedAt) : "",
        "Fluency informational notes": detail.domainKey === "oralReadingFluency" ? evidenceText(item?.informationalNotes) : "",
        "Fluency prosody average": detail.domainKey === "oralReadingFluency" ? benchmarkMetricNumber(detail, item?.prosodyAverage ?? detail.prosodyAverage) : "",
        "Prosody ratings": detail.domainKey === "oralReadingFluency" && !detail.performanceSuppressed ? evidenceText(item?.prosody || detail.prosody) : "",
        "Stop triggered": detail.domainKey === "decoding" ? evidenceBoolean(detail.stopEvidence?.triggered, "No") : "",
        "Stop cycle anchor / band": detail.domainKey === "decoding"
          ? [
              detail.stopEvidence?.stopCycleAnchorLabel || detail.stopEvidence?.stopCycleAnchor,
              evidenceText(detail.stopEvidence?.stopBand)
            ].filter(Boolean).join(" / ")
          : "",
        "Stop reason": detail.domainKey === "decoding" ? detail.stopEvidence?.reason || "" : "",
        "Candidate placement": reportableCandidatePlacementText(detail.candidatePlacement),
        "Confirmed placement": evidenceText(detail.confirmedPlacement),
        "Placement source": humanizeKey(detail.placementSource),
        "Error tags": evidenceText(item?.errorTags),
        "Validation issues": evidenceText(item?.validationIssues),
        "Feature tags": evidenceText(item?.featureTags),
        "Interpretation": detail.interpretation || "Descriptive evidence only; no cut score is applied."
      });
    });
  });
  if (!rowCount) {
    addPlaceholderRow(sheet, "Student", "No class benchmark evidence details are available.", {
      "Administration status": "No saved evidence",
      "Interpretation": "Descriptive evidence only; no cut score is applied."
    });
  }
  formatPercentageColumns(sheet, percentageHeaders);
  formatColumns(sheet, ["Fluency WCPM"], "0.0");
  formatColumns(sheet, ["Fluency prosody average"], "0.00");
}

function addClassBenchmarkSheets(workbook, report = {}) {
  addClassBenchmarkMatrixSheet(workbook, report);
  addClassBenchmarkDomainSummarySheet(workbook, report);
  addClassBenchmarkEvidenceDetailSheet(workbook, report);
}

async function createWorkbook() {
  const module = await import("exceljs");
  const ExcelJS = module.default || module["module.exports"] || module;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Literacy Guide";
  workbook.created = new Date();
  return workbook;
}

async function downloadWorkbook(workbook, fileName) {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function createStudentElAssessmentWorkbook(report) {
  const workbook = await createWorkbook();

  const summarySheet = workbook.addWorksheet("Student Summary");
  setColumns(summarySheet, ["Field", "Value"], ["Value"]);
  [
    ["Student Name", report.studentName || "Unknown Student"],
    ["Class Name", report.className || "Unknown Class"],
    ["Report Date", formatDate(report.generatedAt)],
    ["Generated At", formatExportDateTime(report.generatedAt) || formatExportDateTime(new Date())],
    ["EL Benchmark Scope", report.benchmarkScope?.label || "No benchmark route selected"],
    ["EL Benchmark Scope Source", humanizeKey(report.benchmarkScope?.source) || "None"],
    ["Last Active Date", formatDate(report.engagement?.rows?.[0]?.lastActiveAt) || "No activity recorded yet"],
    ["Date Range", `${formatDate(report.dateRange?.start) || "No records"} to ${formatDate(report.dateRange?.end) || "No records"}`],
    ["Total Assessments", report.summary?.totalAssessments || 0],
    ["Average Accuracy", `${report.summary?.averageAccuracy || 0}%`],
    ["Skills Mastered", report.summary?.masteredSkillCount || 0],
    ["Skills Developing", report.summary?.developingSkillCount || 0],
    ["Skills Needing Support", report.summary?.needsSupportSkillCount || 0],
    ["Latest Letter Assessment", latestSkillSummary(report, "EL Letter Name and Sound")
      ? `${latestSkillSummary(report, "EL Letter Name and Sound").accuracy || 0}% on ${formatDate(latestSkillSummary(report, "EL Letter Name and Sound").lastAssessed)}`
      : "No letter assessment saved yet"],
    ["Latest Advanced Phonics Patterns", report.advancedPhonics?.attempts
      ? `${report.advancedPhonics.latestAccuracy || 0}% on ${formatDate(report.advancedPhonics.latestDate)}`
      : "No advanced phonics assessment saved yet"],
    ["Benchmark Evidence", `${benchmarkProfileRows(report).filter(row => row.hasSavedEvidence).length}/${benchmarkProfileRows(report).length || 4} domains with saved evidence; see Benchmark Profile`],
    ["Current Recommended Focus", list(report.summary?.focusSkills) || "No records yet"]
  ].forEach(row => summarySheet.addRow({ Field: row[0], Value: row[1] }));

  const skillSheet = workbook.addWorksheet("Skills Detail");
  setColumns(skillSheet, [
    "Skill #",
    "Skill Name",
    "Skill Area",
    "Status",
    "Last Checkpoint Score",
    "Checkpoint Accuracy%",
    "Coverage",
    "Items Mastered",
    "Items Developing",
    "Items Needing Support",
    "Last Assessed Date"
  ], ["Items Mastered", "Items Developing", "Items Needing Support"]);
  addRowsOrEmpty(skillSheet, (report.skillRows || []).map((row, index) => ({ ...row, index: index + 1 })), row => row ? {
    "Skill #": row.index,
    "Skill Name": row.skillName,
    "Skill Area": row.skillArea,
    "Status": row.masteryStatus,
    "Last Checkpoint Score": row.isProvisionalBenchmark && row.accuracy == null
      ? "Not scored"
      : row.totalQuestions
        ? `${row.correctCount}/${row.totalQuestions}`
        : "",
    "Checkpoint Accuracy%": row.isProvisionalBenchmark
      ? percentageText(row.accuracy)
      : `${row.accuracy || 0}%`,
    "Coverage": `${(row.itemsMastered || []).length}/${Math.max((row.itemsMastered || []).length + (row.itemsMissed || []).length, row.totalQuestions || 0)} items`,
    "Items Mastered": list(row.itemsMastered),
    "Items Developing": row.masteryStatus === "Developing" ? list(row.itemsMissed) : "",
    "Items Needing Support": row.masteryStatus === "Needs Support" ? list(row.itemsMissed) : "",
    "Last Assessed Date": formatDate(row.lastAssessed)
  } : {
    "Skill #": "",
    "Skill Name": "",
    "Skill Area": "No records yet",
    "Status": "Not Assessed",
    "Last Checkpoint Score": "",
    "Checkpoint Accuracy%": "0%",
    "Coverage": "",
    "Items Mastered": "",
    "Items Developing": "",
    "Items Needing Support": "",
    "Last Assessed Date": ""
	  });

  const itemRows = Array.isArray(report.itemMasteryRows)
    ? report.itemMasteryRows
    : normalizeItemMasteryRows({}, report.sourceSnapshot?.records || []);
  const itemSheet = workbook.addWorksheet("Item Mastery Detail");
  setColumns(itemSheet, [
    "Skill Area",
    "Skill",
    "Item Type",
    "Item Key",
    "Item",
    "Status",
    "Attempts",
    "Correct",
    "Accuracy",
    "Examples",
    "Needs Support Examples",
    "Last Assessed"
  ], ["Examples", "Needs Support Examples"]);
  addRowsOrEmpty(itemSheet, itemRows, row => row ? {
    "Skill Area": getSkillArea({ skillId: row.skillId, skillName: row.skillName }).label,
    "Skill": row.skillName,
    "Item Type": row.itemTypeLabel,
    "Item Key": row.itemKey,
    "Item": formatItemLabel(row.itemType, row.itemKey),
    "Status": row.statusLabel,
    "Attempts": row.attempts,
    "Correct": row.correct,
    "Accuracy": `${row.accuracy || 0}%`,
    "Examples": list(row.examples),
    "Needs Support Examples": list(row.missedExamples),
    "Last Assessed": formatDate(row.lastAssessed)
  } : {
    "Skill Area": "No item mastery records yet",
    "Skill": "No item mastery records yet",
    "Item Type": "",
    "Item Key": "",
    "Item": "",
    "Status": "Not assessed",
    "Attempts": 0,
    "Correct": 0,
    "Accuracy": "0%",
    "Examples": "",
    "Needs Support Examples": "",
    "Last Assessed": ""
  });

  const letterSheet = workbook.addWorksheet("Letter Names & Sounds");
  setColumns(letterSheet, [
    "Letter pair",
    "Uppercase name result",
    "Uppercase sound result",
    "Lowercase name result",
    "Lowercase sound result",
    "Uppercase name attempts",
    "Uppercase sound attempts",
    "Lowercase name attempts",
    "Lowercase sound attempts",
    "Last assessed",
    "Details / notes"
  ], ["Details / notes"]);
  addRowsOrEmpty(letterSheet, report.formalAssessments?.individualLetterMatrix || [], row => row ? {
    "Letter pair": row.letterPair,
    "Uppercase name result": row.uppercaseName.statusLabel,
    "Uppercase sound result": row.uppercaseSound.statusLabel,
    "Lowercase name result": row.lowercaseName.statusLabel,
    "Lowercase sound result": row.lowercaseSound.statusLabel,
    "Uppercase name attempts": row.uppercaseName.attempts,
    "Uppercase sound attempts": row.uppercaseSound.attempts,
    "Lowercase name attempts": row.lowercaseName.attempts,
    "Lowercase sound attempts": row.lowercaseSound.attempts,
    "Last assessed": formatDate(row.lastAssessed),
    "Details / notes": [
      `UC Name ${cellSummary(row.uppercaseName)}`,
      `UC Sound ${cellSummary(row.uppercaseSound)}`,
      `LC Name ${cellSummary(row.lowercaseName)}`,
      `LC Sound ${cellSummary(row.lowercaseSound)}`
    ].join("; ")
  } : {
    "Letter pair": "No Letter Name/Sound records yet",
    "Uppercase name result": "Not assessed",
    "Uppercase sound result": "Not assessed",
    "Lowercase name result": "Not assessed",
    "Lowercase sound result": "Not assessed",
    "Uppercase name attempts": 0,
    "Uppercase sound attempts": 0,
    "Lowercase name attempts": 0,
    "Lowercase sound attempts": 0,
    "Last assessed": "",
    "Details / notes": ""
  });

  const advancedSheet = workbook.addWorksheet("Advanced Phonics Patterns");
  setColumns(advancedSheet, [
    "Pattern",
    "Reading / recognition result",
    "Sound result",
    "Attempts",
    "Correct",
    "Incorrect",
    "Accuracy",
    "Status",
    "Example words",
    "Last assessed"
  ], ["Example words"]);
  addRowsOrEmpty(advancedSheet, report.formalAssessments?.individualAdvancedPhonicsMatrix || [], row => row ? {
    "Pattern": row.pattern,
    "Reading / recognition result": row.readingResult.statusLabel,
    "Sound result": row.soundResult.statusLabel,
    "Attempts": row.attempts,
    "Correct": row.correct,
    "Incorrect": row.incorrect,
    "Accuracy": `${row.accuracy || 0}%`,
    "Status": row.statusLabel,
    "Example words": list(row.exampleWords),
    "Last assessed": formatDate(row.lastAssessed)
  } : {
    "Pattern": "No Advanced Phonics Patterns records yet",
    "Reading / recognition result": "Not assessed",
    "Sound result": "Not assessed",
    "Attempts": 0,
    "Correct": 0,
    "Incorrect": 0,
    "Accuracy": "0%",
    "Status": "Not assessed",
    "Example words": "",
    "Last assessed": ""
  });

  const patternSheet = workbook.addWorksheet("Pattern Detail");
  setColumns(patternSheet, [
    "Pattern",
    "Attempts",
    "Correct",
    "Incorrect",
    "Accuracy",
    "Status",
    "Example Words",
    "Latest Date"
  ], ["Example Words"]);
  addRowsOrEmpty(patternSheet, report.patternDetailRows || [], row => row ? {
    "Pattern": row.pattern,
    "Attempts": row.attempts,
    "Correct": row.correct,
    "Incorrect": row.incorrect,
    "Accuracy": `${row.accuracy || 0}%`,
    "Status": row.status,
    "Example Words": list(row.examples),
    "Latest Date": formatDate(row.latestDate)
  } : {
    "Pattern": "No Advanced Phonics Patterns records yet",
    "Attempts": 0,
    "Correct": 0,
    "Incorrect": 0,
    "Accuracy": "0%",
    "Status": "Not Assessed",
    "Example Words": "",
    "Latest Date": ""
  });

  const attemptsSheet = workbook.addWorksheet("Assessment Attempts");
  setColumns(attemptsSheet, [
    "Date",
    "Skill",
    "Level",
    "Phase",
    "Questions",
    "Correct",
    "Accuracy%",
    "Passed",
    "Items Mastered",
    "Items Missed",
    "Notes"
  ], ["Items Mastered", "Items Missed", "Notes"]);
  addRowsOrEmpty(attemptsSheet, report.attemptRows || [], row => row ? {
    "Date": formatDate(row.date),
    "Skill": row.skill,
    "Level": row.level,
    "Phase": row.phase,
    "Questions": row.questions,
    "Correct": row.correct,
    "Accuracy%": row.isProvisionalBenchmark ? percentageText(row.accuracy) : `${row.accuracy || 0}%`,
    "Passed": yesNo(row.passed),
    "Items Mastered": list(row.itemsMastered || row.itemsCovered),
    "Items Missed": list(row.missedItems),
    "Notes": row.notes
  } : {
    "Date": "No records yet",
    "Skill": "",
    "Level": "",
    "Phase": "",
    "Questions": 0,
    "Correct": 0,
    "Accuracy%": "0%",
    "Passed": "No",
    "Items Mastered": "",
    "Items Missed": "",
    "Notes": ""
  });

  const progressSheet = workbook.addWorksheet("Progress Over Time");
  setColumns(progressSheet, ["Date", "Skill", "Accuracy%", "5-session rolling average", "Skills Passed", "Checkpoint Passed"], []);
  progressSheet.addRow({
    Date: "Select columns A-E and insert a line chart for a visual trend",
    Skill: "",
    "Accuracy%": "",
    "5-session rolling average": "",
    "Skills Passed": "",
    "Checkpoint Passed": ""
  });
  addRowsOrEmpty(progressSheet, report.progressRows || [], row => row ? {
    "Date": formatDate(row.date),
    "Skill": row.skill,
    "Accuracy%": row.isProvisionalBenchmark ? percentageText(row.accuracy) : `${row.accuracy || 0}%`,
    "5-session rolling average": row.isProvisionalBenchmark
      ? percentageText(row.rollingAverage ?? row.accuracy)
      : `${row.rollingAverage || row.accuracy || 0}%`,
    "Skills Passed": row.masteredSkillCount,
    "Checkpoint Passed": yesNo(row.checkpointPassed)
  } : {
    "Date": "No records yet",
    "Skill": "",
    "Accuracy%": "0%",
    "5-session rolling average": "0%",
    "Skills Passed": 0,
    "Checkpoint Passed": "No"
  });
  const firstProgress = report.progressRows?.[0];
  const latestProgress = report.progressRows?.at(-1);
  const firstProgressAccuracy = numericValue(firstProgress?.accuracy);
  const latestProgressAccuracy = numericValue(latestProgress?.accuracy);
  progressSheet.addRow({
    Date: "Summary",
    Skill: `${formatDate(firstProgress?.date) || "No records"} to ${formatDate(latestProgress?.date) || "No records"}`,
    "Accuracy%": latestProgress && firstProgress && firstProgressAccuracy !== "" && latestProgressAccuracy !== ""
      ? `${latestProgressAccuracy - firstProgressAccuracy}% change`
      : latestProgress?.isProvisionalBenchmark || firstProgress?.isProvisionalBenchmark
        ? "Not scored"
        : "0% change",
    "5-session rolling average": "",
    "Skills Passed": latestProgress?.masteredSkillCount || 0,
    "Checkpoint Passed": ""
  });

  const guidedReadingSheet = workbook.addWorksheet("Guided Reading");
  setColumns(guidedReadingSheet, [
    "Book Title",
    "Level",
    "Type",
    "Read Count",
    "Latest Accuracy",
    "Correct Words",
    "Support Words",
    "Notes",
    "Last Read"
  ], ["Book Title", "Correct Words", "Support Words", "Notes"]);
  addRowsOrEmpty(guidedReadingSheet, report.guidedReading?.bookRows || [], row => row ? {
    "Book Title": row.title,
    "Level": row.level,
    "Type": row.type,
    "Read Count": row.readCount || row.rereadCount + 1 || 0,
    "Latest Accuracy": `${row.latestAccuracy || row.accuracy || 0}%`,
    "Correct Words": list(row.correctWords),
    "Support Words": list(row.supportWords),
    "Notes": list(row.notes),
    "Last Read": formatDate(row.lastReadAt || row.completionDate)
  } : {
    "Book Title": "No guided reading records yet",
    "Level": "",
    "Type": "",
    "Read Count": 0,
    "Latest Accuracy": "0%",
    "Correct Words": "",
    "Support Words": "",
    "Notes": "",
    "Last Read": ""
  });

  const storyQuestSheet = workbook.addWorksheet(STORY_QUEST_SHEET_NAME);
  setColumns(storyQuestSheet, STORY_QUEST_HEADERS, ["Quest Title", "Words Found"]);
  addRowsOrEmpty(storyQuestSheet, report.storyQuests?.rows || [], row => row
    ? storyQuestRowToCells(row)
    : emptyStoryQuestCells());

  const engagementSheet = workbook.addWorksheet(ENGAGEMENT_SHEET_NAME);
  setColumns(engagementSheet, ENGAGEMENT_HEADERS, []);
  addRowsOrEmpty(engagementSheet, report.engagement?.rows || [], row => row
    ? engagementRowToCells(row)
    : emptyEngagementCells());

  addStudentBenchmarkSheets(workbook, report);

  const recommendation = report.nextSessionPlan || buildRecommendations({
    itemRows,
    currentStage: {
      id: report.skillRows?.find(row => row.masteryStatus === "Needs Support")?.skillId || report.skillRows?.[0]?.skillId || "",
      label: report.summary?.focusSkills?.[0] || report.skillRows?.find(row => row.masteryStatus === "Needs Support")?.skillName || report.skillRows?.[0]?.skillName || ""
    },
    assessmentHistory: report.sourceSnapshot?.records || []
  });
  const nextPlanSheet = workbook.addWorksheet("Next Session Plan");
  setColumns(nextPlanSheet, ["Section", "Detail"], ["Detail"]);
  [
    ["Student", report.studentName || "Unknown Student"],
    ["Date", formatDate(report.generatedAt)],
    ["Recommended Skill", recommendation.recommendedSkill],
    ["Reason", recommendation.reason],
    ["Teaching Note", recommendation.teachingNote],
    ["Focus Items", recommendation.focusItems.map(row => `${row.label}: ${row.teachingNote}`).join("\n") || "Start with a short checkpoint to gather evidence."],
    ["Quick Wins", list(recommendation.quickWins) || "No quick-win items yet"],
    ["Caution Flags", list(recommendation.cautionFlags) || "No caution flags at this time"]
  ].forEach(row => nextPlanSheet.addRow({ Section: row[0], Detail: row[1] }));

  // Comparison only makes sense against a real previous snapshot; on a first
  // export the sheet is skipped entirely instead of rendering placeholders.
  if (hasPreviousComparison(report.comparison)) {
    const comparisonSheet = workbook.addWorksheet("Comparison");
    setColumns(comparisonSheet, [
      "Previous Report Date",
      "Current Report Date",
      "Accuracy Change",
      "Newly Mastered Skills",
      "Skills Still Needing Support",
      "Suggested Teacher Action"
    ], ["Newly Mastered Skills", "Skills Still Needing Support", "Suggested Teacher Action"]);
    const comparison = report.comparison || {};
    comparisonSheet.addRow({
      "Previous Report Date": formatDate(comparison.previousGeneratedAt),
      "Current Report Date": formatDate(report.generatedAt),
      "Accuracy Change": `${comparison.accuracyChange || 0}%`,
      "Newly Mastered Skills": list(comparison.newlyMasteredSkills),
      "Skills Still Needing Support": list(comparison.persistentFocusSkills || report.summary?.focusSkills),
      "Suggested Teacher Action": comparison.note || "Review focus skills and update small-group practice."
    });
  }

  applyWorkbookPresentation(workbook, EL_STUDENT_REPORT_SHEETS);
  return workbook;
}

export async function createClassElAssessmentWorkbook(report) {
  const workbook = await createWorkbook();

  const summarySheet = workbook.addWorksheet("Class Summary");
  setColumns(summarySheet, ["Field", "Value"], ["Value"]);
  [
    ["Class Name", report.className || "Unknown Class"],
    ["Report Date", formatDate(report.generatedAt)],
    ["Generated At", formatExportDateTime(report.generatedAt) || formatExportDateTime(new Date())],
    ["EL Benchmark Scope", report.benchmarkScope?.label || "No benchmark route selected"],
    ["EL Benchmark Scope Source", humanizeKey(report.benchmarkScope?.source) || "None"],
    ["Date Range", `${formatDate(report.dateRange?.start) || "No records"} to ${formatDate(report.dateRange?.end) || "No records"}`],
    ["Total Students", report.summary?.totalStudents || report.studentRows?.length || 0],
    ["Total Assessments", report.summary?.totalAssessments || 0],
    ["Class Average Accuracy", `${report.summary?.averageAccuracy || 0}%`],
    ["Advanced Phonics Attempts", report.advancedPhonics?.attempts || 0],
    ["Latest Advanced Phonics Accuracy", report.advancedPhonics?.attempts ? `${report.advancedPhonics.latestAccuracy || 0}%` : "No records yet"],
    ["Benchmark Evidence", `${classBenchmarkDomainSummaryRows(report).reduce((sum, row) => sum + Number(row.studentsWithSavedEvidence || 0), 0)} saved student-domain evidence record(s); see Benchmark Domain Summary`],
    ["Strongest Skills", list(report.summary?.strongestSkills) || "No records yet"],
    ["Weakest Skills", list(report.summary?.focusSkills) || "No records yet"],
    ["Students Needing Support", list(report.summary?.studentsNeedingSupport) || "No records yet"],
    ["Students Ready for Challenge", list(report.summary?.studentsReadyForChallenge) || "No records yet"]
  ].forEach(row => summarySheet.addRow({ Field: row[0], Value: row[1] }));
  const supportCount = report.studentRows?.filter(row => row.skillsNeedingSupport > 0 || row.averageAccuracy < 65).length || 0;
  const developingCount = report.studentRows?.filter(row => row.averageAccuracy >= 65 && row.averageAccuracy < 80).length || 0;
  const onTrackCount = Math.max(0, (report.studentRows?.length || 0) - supportCount - developingCount);
  summarySheet.addRow({ Field: "Status Distribution", Value: "" });
  [
    ["On Track", onTrackCount],
    ["Developing", developingCount],
    ["Needs Support", supportCount]
  ].forEach(([label, count]) => summarySheet.addRow({
    Field: label,
    Value: `${count} (${report.studentRows?.length ? Math.round((count / report.studentRows.length) * 100) : 0}%)`
  }));

  const engagementRowByStudent = new Map((report.engagement?.rows || [])
    .map(row => [row.studentId || row.studentName, row]));
  const studentSheet = workbook.addWorksheet("Student Overview");
  setColumns(studentSheet, [
    "Student Name",
    "Assessments Completed",
    "Average Accuracy",
    "Skills Mastered",
    "Skills Developing",
    "Skills Needing Support",
    "Current Level / Stage",
    "Last Assessment Date",
    "Last Active Date",
    "Recommended Focus"
  ], ["Recommended Focus"]);
  addRowsOrEmpty(studentSheet, report.studentRows || [], row => row ? {
    "Student Name": row.studentName,
    "Assessments Completed": row.assessmentsCompleted,
    "Average Accuracy": `${row.averageAccuracy || 0}%`,
    "Skills Mastered": row.skillsMastered,
    "Skills Developing": row.skillsDeveloping,
    "Skills Needing Support": row.skillsNeedingSupport,
    "Current Level / Stage": row.currentLevel,
    "Last Assessment Date": formatDate(row.lastAssessmentDate),
    "Last Active Date": formatDate(
      engagementRowByStudent.get(row.studentId || row.studentName)?.lastActiveAt
    ),
    "Recommended Focus": row.recommendedFocus
  } : {
    "Student Name": "No records yet",
    "Assessments Completed": 0,
    "Average Accuracy": "0%",
    "Skills Mastered": 0,
    "Skills Developing": 0,
    "Skills Needing Support": 0,
    "Current Level / Stage": "",
    "Last Assessment Date": "",
    "Last Active Date": "",
    "Recommended Focus": "Complete assessments to populate this report."
	  });

  const classLetterSheet = workbook.addWorksheet("Letter Sound Class Matrix");
  setColumns(classLetterSheet, [
    "Letter pair",
    "UC name counts",
    "UC sound counts",
    "LC name counts",
    "LC sound counts",
    "UC name support students",
    "UC sound support students",
    "LC name support students",
    "LC sound support students"
  ], [
    "UC name support students",
    "UC sound support students",
    "LC name support students",
    "LC sound support students"
  ]);
  addRowsOrEmpty(classLetterSheet, report.formalAssessments?.classLetterMatrix || [], row => row ? {
    "Letter pair": row.letterPair,
    "UC name counts": cellCountSummary(row.uppercaseName),
    "UC sound counts": cellCountSummary(row.uppercaseSound),
    "LC name counts": cellCountSummary(row.lowercaseName),
    "LC sound counts": cellCountSummary(row.lowercaseSound),
    "UC name support students": list(row.uppercaseName.supportStudents),
    "UC sound support students": list(row.uppercaseSound.supportStudents),
    "LC name support students": list(row.lowercaseName.supportStudents),
    "LC sound support students": list(row.lowercaseSound.supportStudents)
  } : {
    "Letter pair": "No Letter Name/Sound records yet",
    "UC name counts": "M:0 D:0 S:0 NA:0",
    "UC sound counts": "M:0 D:0 S:0 NA:0",
    "LC name counts": "M:0 D:0 S:0 NA:0",
    "LC sound counts": "M:0 D:0 S:0 NA:0",
    "UC name support students": "",
    "UC sound support students": "",
    "LC name support students": "",
    "LC sound support students": ""
  });

  const classAdvancedMatrixSheet = workbook.addWorksheet("Advanced Phonics Class Matrix");
  setColumns(classAdvancedMatrixSheet, [
    "Pattern",
    "Attempted students",
    "Mastered students",
    "Developing students",
    "Needs support students",
    "Not assessed students",
    "Mastery percentage",
    "Students needing support"
  ], ["Students needing support"]);
  addRowsOrEmpty(classAdvancedMatrixSheet, report.formalAssessments?.classAdvancedPhonicsMatrix || [], row => row ? {
    "Pattern": row.pattern,
    "Attempted students": row.attemptedStudents,
    "Mastered students": row.masteredStudents,
    "Developing students": row.developingStudents,
    "Needs support students": row.needsSupportStudents,
    "Not assessed students": row.notAssessedStudents,
    "Mastery percentage": `${row.masteryPercentage || 0}%`,
    "Students needing support": list(row.studentsNeedingSupport)
  } : {
    "Pattern": "No Advanced Phonics Patterns records yet",
    "Attempted students": 0,
    "Mastered students": 0,
    "Developing students": 0,
    "Needs support students": 0,
    "Not assessed students": 0,
    "Mastery percentage": "0%",
    "Students needing support": ""
  });

  const advancedSheet = workbook.addWorksheet("Advanced Phonics Patterns");
  setColumns(advancedSheet, ["Field", "Value"], ["Value"]);
  [
    ["Class Name", report.className || "Unknown Class"],
    ["Attempts", report.advancedPhonics?.attempts || 0],
    ["Latest Attempt Date", formatDate(report.advancedPhonics?.latestDate) || "No records yet"],
    ["Latest Accuracy", `${report.advancedPhonics?.latestAccuracy || 0}%`],
    ["Mastered Patterns", list(report.advancedPhonics?.masteredPatterns)],
    ["Developing Patterns", list(report.advancedPhonics?.developingPatterns)],
    ["Needs Support Patterns", list(report.advancedPhonics?.needsSupportPatterns)]
  ].forEach(row => advancedSheet.addRow({ Field: row[0], Value: row[1] || "None yet" }));

  const patternSheet = workbook.addWorksheet("Pattern Detail");
  setColumns(patternSheet, [
    "Student",
    "Class",
    "Pattern",
    "Attempts",
    "Correct",
    "Incorrect",
    "Accuracy",
    "Status",
    "Example Words",
    "Latest Date"
  ], ["Example Words"]);
  addRowsOrEmpty(patternSheet, report.patternDetailRows || [], row => row ? {
    "Student": row.studentName,
    "Class": row.className,
    "Pattern": row.pattern,
    "Attempts": row.attempts,
    "Correct": row.correct,
    "Incorrect": row.incorrect,
    "Accuracy": `${row.accuracy || 0}%`,
    "Status": row.status,
    "Example Words": list(row.examples),
    "Latest Date": formatDate(row.latestDate)
  } : {
    "Student": "No Advanced Phonics Patterns records yet",
    "Class": "",
    "Pattern": "",
    "Attempts": 0,
    "Correct": 0,
    "Incorrect": 0,
    "Accuracy": "0%",
    "Status": "Not Assessed",
    "Example Words": "",
    "Latest Date": ""
  });

  const heatmapSheet = workbook.addWorksheet("Skill Heatmap");
  const heatmapSkillNames = Object.keys(report.heatmapRows?.[0]?.values || {});
  const heatmapStudentNames = (report.heatmapRows || []).map(row => row.studentName);
  setColumns(heatmapSheet, ["Skill", ...heatmapStudentNames, "Students Passed"], heatmapStudentNames);
  if (heatmapSkillNames.length) {
    heatmapSkillNames.forEach(skillName => {
      const values = Object.fromEntries((report.heatmapRows || []).map(studentRow => [
        studentRow.studentName,
        studentRow.values?.[skillName] === "Mastered"
          ? "✓ Passed"
          : studentRow.values?.[skillName] && studentRow.values[skillName] !== "Not Assessed"
            ? studentRow.values[skillName]
            : "–"
      ]));
      heatmapSheet.addRow({
        Skill: skillName,
        ...values,
        "Students Passed": Object.values(values).filter(value => String(value).includes("Passed")).length
      });
    });
    heatmapSheet.addRow({
      Skill: "Column totals",
      ...Object.fromEntries((report.heatmapRows || []).map(studentRow => [
        studentRow.studentName,
        Object.values(studentRow.values || {}).filter(value => value === "Mastered").length
      ])),
      "Students Passed": ""
    });
  } else {
    heatmapSheet.addRow({ Skill: "No records yet" });
  }

  const classProgressSheet = workbook.addWorksheet("Class Progress Over Time");
  setColumns(classProgressSheet, ["Week Start Date", "Class Average Accuracy%", "Checkpoints Passed", "New Skills Started", "Note"], ["Note"]);
  classProgressSheet.addRow({
    "Week Start Date": "Chart note",
    "Class Average Accuracy%": "Use columns A-C for a weekly class progress line chart.",
    "Checkpoints Passed": "",
    "New Skills Started": "",
    "Note": ""
  });
  const weeklyRows = Array.isArray(report.weeklyAccuracyRows)
    ? report.weeklyAccuracyRows
    : buildWeeklyAccuracy(report.sourceSnapshot?.records || []);
  addRowsOrEmpty(classProgressSheet, weeklyRows, row => row ? {
    "Week Start Date": row.weekStart,
    "Class Average Accuracy%": `${row.accuracy || 0}%`,
    "Checkpoints Passed": row.checkpointsPassed ?? (report.sourceSnapshot?.records || []).filter(record => {
      const date = new Date(record.completedAt);
      if (!record.passed || !Number.isFinite(date.getTime())) return false;
      const weekStart = new Date(row.weekStart);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      return date >= weekStart && date < weekEnd;
    }).length,
    "New Skills Started": row.newSkillsStarted ?? new Set((report.sourceSnapshot?.records || []).filter(record => {
      const date = new Date(record.completedAt);
      if (!Number.isFinite(date.getTime())) return false;
      const weekStart = new Date(row.weekStart);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      return date >= weekStart && date < weekEnd;
    }).map(record => record.skillName)).size,
    "Note": `${row.attempts} assessment attempt(s)`
  } : {
    "Week Start Date": "No records yet",
    "Class Average Accuracy%": "0%",
    "Checkpoints Passed": 0,
    "New Skills Started": 0,
    "Note": "Complete class assessments to populate this sheet."
  });

  const perStudentSkillSheet = workbook.addWorksheet("Per-Student Skill Detail");
  setColumns(perStudentSkillSheet, ["Student", "Skill", "Status"], ["Skill"]);
  if (report.heatmapRows?.length) {
    report.heatmapRows.forEach(studentRow => {
      perStudentSkillSheet.addRow({ Student: studentRow.studentName, Skill: "", Status: "" });
      Object.entries(studentRow.values || {}).forEach(([skill, status]) => {
        perStudentSkillSheet.addRow({ Student: "", Skill: skill, Status: status });
      });
      perStudentSkillSheet.addRow({ Student: "", Skill: "", Status: "" });
    });
  } else {
    perStudentSkillSheet.addRow({ Student: "No records yet", Skill: "", Status: "" });
  }

  const skillSheet = workbook.addWorksheet("Skill Summary");
  setColumns(skillSheet, [
    "Skill Area",
    "Skill Name",
    "Students Mastered",
    "Students Developing",
    "Students Needing Support",
    "Not Assessed",
    "Class Average Accuracy",
    "Suggested Small Group"
  ], ["Suggested Small Group"]);
  addRowsOrEmpty(skillSheet, report.skillRows || [], row => row ? {
    "Skill Area": row.skillArea,
    "Skill Name": row.skillName,
    "Students Mastered": row.studentsMastered,
    "Students Developing": row.studentsDeveloping,
    "Students Needing Support": row.studentsNeedingSupport,
    "Not Assessed": row.notAssessed,
    "Class Average Accuracy": row.isProvisionalBenchmark
      ? percentageText(row.classAverageAccuracy)
      : `${row.classAverageAccuracy || 0}%`,
    "Suggested Small Group": row.suggestedSmallGroup
  } : {
    "Skill Area": "No records yet",
    "Skill Name": "",
    "Students Mastered": 0,
    "Students Developing": 0,
    "Students Needing Support": 0,
    "Not Assessed": 0,
    "Class Average Accuracy": "0%",
    "Suggested Small Group": ""
  });

  const groupsSheet = workbook.addWorksheet("Weak Points & Groups");
  setColumns(groupsSheet, ["Group Name / Focus", "Skill", "Students", "Reason", "Suggested Activity / Next Step"], ["Students", "Reason", "Suggested Activity / Next Step"]);
  const weakPointRows = buildClassWeakPointRows(report);
  groupsSheet.addRow({
    "Group Name / Focus": "Weak Points",
    "Skill": "",
    "Students": "",
    "Reason": "",
    "Suggested Activity / Next Step": ""
  });
  if (weakPointRows.length) {
    weakPointRows.forEach(row => groupsSheet.addRow({
      "Group Name / Focus": row.itemLabel,
      "Skill": row.skillName || row.skillArea,
      "Students": list(row.studentNames),
      "Reason": `${row.supportShare}% of assessed students below 70%; class item accuracy ${row.accuracy}%`,
      "Suggested Activity / Next Step": `Reteach ${row.itemLabel} in ${row.skillName || row.skillArea}, then reassess in a short mixed set.`
    }));
  } else {
    groupsSheet.addRow({
      "Group Name / Focus": "No weak item pattern yet",
      "Skill": "",
      "Students": "",
      "Reason": "No item has 30% or more of assessed students below 70%.",
      "Suggested Activity / Next Step": "Continue collecting item-level assessment evidence."
    });
  }
  groupsSheet.addRow({
    "Group Name / Focus": "Suggested Small Groups",
    "Skill": "",
    "Students": "",
    "Reason": "",
    "Suggested Activity / Next Step": ""
  });
  addRowsOrEmpty(groupsSheet, report.smallGroups || [], row => row ? {
    "Group Name / Focus": row.groupName,
    "Skill": row.skill,
    "Students": list(row.students),
    "Reason": row.reason,
    "Suggested Activity / Next Step": row.suggestedActivity
  } : {
    "Group Name / Focus": "No groups yet",
    "Skill": "",
    "Students": "",
    "Reason": "No assessment records yet.",
    "Suggested Activity / Next Step": "Complete assessments to create small groups."
  });

  const classStoryQuestSheet = workbook.addWorksheet(STORY_QUEST_SHEET_NAME);
  setColumns(classStoryQuestSheet, STORY_QUEST_HEADERS, ["Quest Title", "Words Found"]);
  addRowsOrEmpty(classStoryQuestSheet, report.storyQuests?.rows || [], row => row
    ? storyQuestRowToCells(row)
    : emptyStoryQuestCells());

  const classEngagementSheet = workbook.addWorksheet(ENGAGEMENT_SHEET_NAME);
  setColumns(classEngagementSheet, ENGAGEMENT_HEADERS, []);
  addRowsOrEmpty(classEngagementSheet, report.engagement?.rows || [], row => row
    ? engagementRowToCells(row)
    : emptyEngagementCells());

  addClassBenchmarkSheets(workbook, report);

  // Comparison only makes sense against a real previous snapshot; on a first
  // export the sheet is skipped entirely instead of rendering placeholders.
  if (hasPreviousComparison(report.comparison)) {
    const comparisonSheet = workbook.addWorksheet("Progress Comparison");
    setColumns(comparisonSheet, [
      "Previous Report Date",
      "Current Report Date",
      "Class Accuracy Change",
      "Mastered Count Change",
      "New Class Strengths",
      "Persistent Class Gaps",
      "Students With Strong Growth",
      "Students Needing Follow-up"
    ], ["New Class Strengths", "Persistent Class Gaps", "Students With Strong Growth", "Students Needing Follow-up"]);
    const comparison = report.comparison || {};
    comparisonSheet.addRow({
      "Previous Report Date": formatDate(comparison.previousGeneratedAt),
      "Current Report Date": formatDate(report.generatedAt),
      "Class Accuracy Change": `${comparison.accuracyChange || 0}%`,
      "Mastered Count Change": comparison.masteredSkillChange || 0,
      "New Class Strengths": list(comparison.newlyMasteredSkills || report.summary?.strongestSkills),
      "Persistent Class Gaps": list(comparison.persistentFocusSkills || report.summary?.focusSkills),
      "Students With Strong Growth": "",
      "Students Needing Follow-up": list(report.summary?.studentsNeedingSupport)
    });
  }

  applyWorkbookPresentation(workbook, EL_CLASS_REPORT_SHEETS);
  return workbook;
}

async function loadStoryQuestCatalog(override) {
  if (Array.isArray(override)) return override;
  try {
    return (await import("../data/storyQuests.js")).storyQuests || [];
  } catch {
    return [];
  }
}

// Optional, backward-compatible options (all default to this browser's
// localStorage when omitted):
//   storyQuestProgress        - the one student's Story Quest progress map
//   engagementAreas           - the one student's progress areas
//                               ({ mission, games, quest, stories, reading, hollow })
//   storyQuestCatalog         - Story Quest definitions (titles/levels/series)
export async function exportStudentElAssessmentExcel(options = {}) {
  const previousReports = await hydrateElAssessmentReports({
    teacherId: options.teacherId || "local",
    supabase: options.supabase || null,
    reportType: "individual",
    classId: options.classId || "",
    studentId: options.studentId || ""
  });
  const report = buildStudentElAssessmentReportData({ ...options, previousReports });
  const studentRef = (options.students || []).find(row => row.id === options.studentId)
    || { id: options.studentId || "", name: report.studentName };
  const storyQuestCatalog = await loadStoryQuestCatalog(options.storyQuestCatalog);
  report.storyQuests = {
    rows: buildStoryQuestRows({
      studentName: report.studentName,
      studentId: studentRef.id || "",
      progress: collectStoryQuestProgressForStudent(studentRef, options.storyQuestProgress || null),
      quests: storyQuestCatalog
    })
  };
  report.engagement = {
    rows: [buildEngagementRow({
      studentName: report.studentName,
      studentId: studentRef.id || "",
      className: report.className,
      areas: collectStudentEngagementAreas(studentRef, options.engagementAreas || null)
    })]
  };
  const workbook = await createStudentElAssessmentWorkbook(report);
  await downloadWorkbook(workbook, report.fileName);
  report.persistence = await saveElAssessmentReport(report, options);
  return report;
}

// Optional, backward-compatible options (all default to this browser's
// localStorage when omitted):
//   storyQuestProgressByStudent - { [studentId]: storyQuestProgress } or Map
//   engagementByStudent         - { [studentId]: progress areas } or Map
//   storyQuestCatalog           - Story Quest definitions (titles/levels/series)
export async function exportClassElAssessmentExcel(options = {}) {
  const previousReports = await hydrateElAssessmentReports({
    teacherId: options.teacherId || "local",
    supabase: options.supabase || null,
    reportType: "whole_class",
    classId: options.classId || ""
  });
  const report = buildClassElAssessmentReportData({ ...options, previousReports });
  const classStudents = (options.students || []).filter(student =>
    !options.classId || (student.classId || student.class_id) === options.classId
  );
  const storyQuestCatalog = await loadStoryQuestCatalog(options.storyQuestCatalog);
  report.storyQuests = {
    rows: collectStoryQuestRowsForStudents({
      students: classStudents,
      storyQuestProgressByStudent: options.storyQuestProgressByStudent || null,
      quests: storyQuestCatalog
    })
  };
  report.engagement = {
    rows: buildEngagementRows({
      students: classStudents,
      classes: options.classes || [],
      engagementByStudent: options.engagementByStudent || null
    })
  };
  const workbook = await createClassElAssessmentWorkbook(report);
  await downloadWorkbook(workbook, report.fileName);
  report.persistence = await saveElAssessmentReport(report, options);
  return report;
}

export async function downloadElAssessmentReport(report = {}) {
  const workbook = report.reportType === "individual"
    ? await createStudentElAssessmentWorkbook(report)
    : await createClassElAssessmentWorkbook(report);
  await downloadWorkbook(workbook, report.fileName || `el-assessment-report-${formatDate(new Date())}.xlsx`);
  return report;
}

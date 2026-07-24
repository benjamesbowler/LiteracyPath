import {
  buildClassElAssessmentReportData,
  buildStudentElAssessmentReportData,
  hydrateElAssessmentReports,
  saveElAssessmentReport
} from "../data/elAssessmentReportStore.js";
import {
  buildClassElFormalAssessmentReport,
  buildIndividualElFormalAssessmentReport,
  EL_FORMAL_CLASS_EVIDENCE_SCHEMA,
  isReportableElBenchmarkCandidatePlacement
} from "../data/elFormalAssessmentReportBuilder.js";
import { formatExportDateTime } from "./exportReportSections.js";
import {
  addMetricDefinitionsWorksheet,
  METRIC_DEFINITIONS_SHEET_NAME
} from "./metricDefinitions.js";
import {
  addExportProvenanceWorksheet,
  buildExportProvenanceRows,
  REPORT_PROVENANCE_SHEET_NAME
} from "./exportProvenance.js";

// EL workbooks are intentionally limited to Assessments 1-6. Other learning
// areas have their own reports and must not leak into these exports.
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
  "Letter Names & Sounds",
  "Advanced Phonics Patterns",
  ...EL_STUDENT_BENCHMARK_SHEETS,
  REPORT_PROVENANCE_SHEET_NAME,
  METRIC_DEFINITIONS_SHEET_NAME
];

export const EL_CLASS_REPORT_SHEETS = [
  "Class Summary",
  "Letter Sound Class Matrix",
  "Advanced Phonics Class Matrix",
  "Advanced Phonics Patterns",
  "Pattern Detail",
  ...EL_CLASS_BENCHMARK_SHEETS,
  REPORT_PROVENANCE_SHEET_NAME,
  METRIC_DEFINITIONS_SHEET_NAME
];

export const EL_ASSESSMENT_TYPE_IDS = Object.freeze([
  "el_letter_assessment",
  "advanced_phonics_patterns",
  "el_phonological_awareness",
  "el_encoding",
  "el_decoding",
  "el_oral_reading_fluency"
]);

const EL_ASSESSMENT_TYPE_ID_SET = new Set(EL_ASSESSMENT_TYPE_IDS);

function normalizeAssessmentType(value) {
  return String(value || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
}

export function getElAssessmentTypeId(record = {}) {
  const assessmentType = normalizeAssessmentType(record.assessmentType);
  if (assessmentType && EL_ASSESSMENT_TYPE_ID_SET.has(assessmentType)) return assessmentType;
  if (assessmentType && assessmentType !== "el_benchmark") return "";
  const candidates = [record.assessmentId, record.skillId];
  for (const candidate of candidates) {
    const normalized = normalizeAssessmentType(candidate);
    if (normalized && EL_ASSESSMENT_TYPE_ID_SET.has(normalized)) return normalized;
  }
  return "";
}

export function filterElAssessmentHistory(assessmentHistory = []) {
  return (Array.isArray(assessmentHistory) ? assessmentHistory : [])
    .filter(record => Boolean(getElAssessmentTypeId(record)));
}

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

function cellCountSummary(group = {}) {
  return `M:${group.mastered || 0} D:${group.developing || 0} S:${group.needs_support || 0} U:${group.unscored_evidence || 0} NA:${group.not_assessed || 0}`;
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
    "Letter Names & Sounds": EXPORT_COLORS.blue,
    "Letter Sound Class Matrix": EXPORT_COLORS.blue,
    "Advanced Phonics Patterns": EXPORT_COLORS.purple,
    "Advanced Phonics Class Matrix": EXPORT_COLORS.purple,
    "Pattern Detail": EXPORT_COLORS.purple,
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

function responseCaptureText(item = {}) {
  const mode = String(item?.responseCaptureMode || "legacy_unspecified");
  if (mode === "quick_teacher_judgment") {
    return item?.responseDetailCaptured
      ? "Quick score with optional transcription"
      : "Quick score - not transcribed";
  }
  if (mode === "direct_choice") return "Direct response choice";
  if (mode === "exact_transcription") return "Exact response transcribed";
  if (mode === "timed_reading_observation") return "Timed reading observation";
  return "Legacy capture - detail unspecified";
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

const LETTER_CELL_KEYS = [
  "uppercaseName",
  "uppercaseSound",
  "lowercaseName",
  "lowercaseSound"
];

function formalEvidenceResult(detail = {}) {
  if (detail.isCorrect === true) return "Correct";
  if (detail.isCorrect === false) return "Incorrect";
  return "Not scored";
}

function formalEvidenceProvenance(detail = {}, { includeStudent = false } = {}) {
  const parts = [];
  if (includeStudent && (detail.studentName || detail.studentId)) {
    parts.push(`Student: ${detail.studentName || detail.studentId}`);
  }
  parts.push(`Attempt: ${detail.attemptId || "not recorded"}`);
  parts.push(`Item: ${detail.questionId || detail.itemKey || "not recorded"}`);
  if (detail.itemType) parts.push(`Item type: ${detail.itemType}`);
  if (detail.itemKey && detail.itemKey !== detail.questionId) parts.push(`Item key: ${detail.itemKey}`);
  parts.push(`Response: ${humanizeKey(detail.responseStatus || "unrecorded")}`);
  parts.push(`Result: ${formalEvidenceResult(detail)}`);
  if (detail.administrationStatus) parts.push(`Administration: ${humanizeKey(detail.administrationStatus)}`);
  if (detail.formVersion) parts.push(`Form: ${detail.formVersion}`);
  if (detail.contentVersion) parts.push(`Content: ${detail.contentVersion}`);
  if (detail.scoringVersion) parts.push(`Scoring: ${detail.scoringVersion}`);
  if (detail.scoringRuleVersion) parts.push(`Rule: ${detail.scoringRuleVersion}`);
  if (detail.administrationVersion) parts.push(`Interface: ${detail.administrationVersion}`);
  if (detail.responseSchemaVersion !== "" && detail.responseSchemaVersion != null) {
    parts.push(`Schema: ${detail.responseSchemaVersion}`);
  }
  if (detail.date) parts.push(`Date: ${formatExportDateTime(detail.date) || formatDate(detail.date)}`);
  return parts.join(" | ");
}

function formalEvidenceList(details = [], options = {}) {
  return (Array.isArray(details) ? details : [])
    .map(detail => formalEvidenceProvenance(detail, options))
    .join("\n");
}

function decodeClassEvidenceRows(report = {}, rows = []) {
  const schema = report.formalAssessments?.classEvidenceSchema || EL_FORMAL_CLASS_EVIDENCE_SCHEMA;
  const dictionaries = report.formalAssessments?.classEvidenceDictionaries || {};
  return (Array.isArray(rows) ? rows : []).map(row => {
    if (!Array.isArray(row)) return row || {};
    return Object.fromEntries(schema.map((key, index) => {
      const dictionary = dictionaries[key];
      const value = row[index];
      return [key, Array.isArray(dictionary) && Number.isInteger(value)
        ? dictionary[value] ?? ""
        : value ?? ""];
    }));
  });
}

function getElReportDateRange(report = {}) {
  const sourceRecords = report.sourceSnapshot?.records;
  if (Array.isArray(sourceRecords)) {
    const dates = filterElAssessmentHistory(sourceRecords)
      .map(record => new Date(record.completedAt || record.startedAt || record.createdAt || ""))
      .filter(date => Number.isFinite(date.getTime()))
      .sort((a, b) => a - b);
    if (dates.length) {
      return `${formatDate(dates[0])} to ${formatDate(dates.at(-1))}`;
    }
    return "No EL assessment records";
  }
  const start = formatDate(report.dateRange?.start);
  const end = formatDate(report.dateRange?.end);
  return start || end ? `${start || end} to ${end || start}` : "No EL assessment records";
}

function studentLetterEvidence(report = {}) {
  const rows = report.formalAssessments?.individualLetterMatrix || [];
  return rows.reduce((summary, row) => {
    LETTER_CELL_KEYS.forEach(key => {
      summary.evidenceCount += Number(row?.[key]?.evidenceCount || row?.[key]?.details?.length || 0);
      summary.unscoredCount += Number(row?.[key]?.unscoredCount || 0);
      summary.attempts += Number(row?.[key]?.attempts || 0);
      summary.correct += Number(row?.[key]?.correct || 0);
    });
    const date = formatDate(row.lastAssessed);
    if (date > summary.latestDate) summary.latestDate = date;
    return summary;
  }, { evidenceCount: 0, unscoredCount: 0, attempts: 0, correct: 0, latestDate: "" });
}

function studentAdvancedEvidence(report = {}) {
  const rows = report.formalAssessments?.individualAdvancedPhonicsMatrix || [];
  return rows.reduce((summary, row) => {
    summary.evidenceCount += Number(row.evidenceCount || row.details?.length || 0);
    summary.unscoredCount += Number(row.unscoredCount || 0);
    summary.attempts += Number(row.attempts || 0);
    summary.correct += Number(row.correct || 0);
    const date = formatDate(row.lastAssessed);
    if (date > summary.latestDate) summary.latestDate = date;
    return summary;
  }, { evidenceCount: 0, unscoredCount: 0, attempts: 0, correct: 0, latestDate: "" });
}

function benchmarkProfileSummary(profile = {}) {
  if (!profile.hasSavedEvidence) return "No saved evidence";
  const metrics = profile.metrics || {};
  const status = profile.administrationStatusLabel || humanizeKey(profile.administrationStatus) || "Evidence recorded";
  if (profile.domainKey === "phonologicalAwareness") {
    return `${status}; ${percentageText(metrics.accuracyRate)} accuracy; ${numericValue(metrics.strandsObserved) || 0} strand(s) observed`;
  }
  if (profile.domainKey === "encoding") {
    return `${status}; ${percentageText(metrics.exactSpellingRate)} exact spelling; ${percentageText(metrics.phonologicallyRepresentedRate)} phonologically represented`;
  }
  if (profile.domainKey === "decoding") {
    return `${status}; ${percentageText(metrics.accuracyRate)} accuracy; ${percentageText(metrics.automaticityRate)} automatic`;
  }
  return `${status}; ${numericValue(metrics.wcpm) === "" ? "WCPM not scored" : `${numericValue(metrics.wcpm)} WCPM`}; ${percentageText(metrics.accuracyRate)} accuracy`;
}

function buildStudentElSummaryRows(report = {}) {
  const letter = studentLetterEvidence(report);
  const advanced = studentAdvancedEvidence(report);
  const profiles = benchmarkProfileRows(report);
  const profileByDomain = new Map(profiles.map(profile => [profile.domainKey, profile]));
  const savedAssessmentCount = Number(letter.evidenceCount > 0) + Number(advanced.evidenceCount > 0) +
    profiles.filter(profile => profile.hasSavedEvidence).length;
  const evidenceSummary = (evidence, noun) => {
    if (!evidence.evidenceCount) return "No saved evidence";
    const scored = evidence.attempts
      ? `${evidence.correct}/${evidence.attempts} correct ${noun}`
      : "No scored responses; no result inferred";
    const unscored = evidence.unscoredCount ? `; ${evidence.unscoredCount} unscored evidence item(s)` : "";
    return `${scored}${unscored}${evidence.latestDate ? `; latest ${evidence.latestDate}` : ""}`;
  };

  return [
    ["Student Name", report.studentName || "Unknown Student"],
    ["Class Name", report.className || "Unknown Class"],
    ["Report Date", formatDate(report.generatedAt)],
    ["Generated At", formatExportDateTime(report.generatedAt) || formatExportDateTime(new Date())],
    ["EL Benchmark Scope", report.benchmarkScope?.label || "No benchmark route selected"],
    ["EL Assessment Date Range", getElReportDateRange(report)],
    ["Assessments With Saved Evidence", `${savedAssessmentCount}/6`],
    ["Assessment 1 — Letter Names & Sounds", evidenceSummary(letter, "letter/name/sound response(s)")],
    ["Assessment 2 — Advanced Phonics Patterns", evidenceSummary(advanced, "pattern response(s)")],
    ["Assessment 3 — Phonological Awareness", benchmarkProfileSummary(profileByDomain.get("phonologicalAwareness"))],
    ["Assessment 4 — Encoding & Spelling", benchmarkProfileSummary(profileByDomain.get("encoding"))],
    ["Assessment 5 — Decoding & Automaticity", benchmarkProfileSummary(profileByDomain.get("decoding"))],
    ["Assessment 6 — Oral Reading Fluency", benchmarkProfileSummary(profileByDomain.get("oralReadingFluency"))],
    ["How To Read This Workbook", "Use the named assessment sheets for evidence details. Benchmark results are descriptive and do not apply an invented mastery cut score."]
  ];
}

function classLetterEvidenceSummary(report = {}) {
  return (report.formalAssessments?.classLetterMatrix || []).reduce((total, row) => {
    LETTER_CELL_KEYS.forEach(key => {
      const cell = row?.[key] || {};
      total.scored += Number(cell.mastered || 0) + Number(cell.developing || 0) + Number(cell.needs_support || 0);
      total.unscored += Number(cell.unscored_evidence || 0);
    });
    return total;
  }, { scored: 0, unscored: 0 });
}

function classAdvancedEvidenceSummary(report = {}) {
  return (report.formalAssessments?.classAdvancedPhonicsMatrix || []).reduce((total, row) => {
    total.scored += Number(row.attemptedStudents || 0);
    total.unscored += Number(row.unscoredEvidenceStudents || 0);
    return total;
  }, { scored: 0, unscored: 0 });
}

function buildClassAdvancedPhonicsSummaryRows(report = {}) {
  const matrix = report.formalAssessments?.classAdvancedPhonicsMatrix || [];
  const evidence = matrix.flatMap(row => decodeClassEvidenceRows(report, row.evidenceRows));
  const scored = evidence.filter(row => typeof row.isCorrect === "boolean");
  const correct = scored.filter(row => row.isCorrect).length;
  const latestDate = evidence.map(row => row.date).filter(Boolean).sort().at(-1) || "";
  const uniqueAttempts = new Set(evidence.map(row => row.attemptId).filter(Boolean)).size;
  return [
    ["Class Name", report.className || "Unknown Class"],
    ["Saved Attempts", uniqueAttempts],
    ["Latest Evidence Date", formatDate(latestDate) || "No records yet"],
    ["Evidence Items", evidence.length],
    ["Scored Items", scored.length],
    ["Unscored Evidence Items", Math.max(0, evidence.length - scored.length)],
    ["Scored Accuracy", scored.length ? `${Math.round((correct / scored.length) * 100)}%` : "Not scored"],
    ["Patterns With Mastery Evidence", list(matrix.filter(row => row.masteredStudents > 0).map(row => row.pattern)) || "None yet"],
    ["Patterns Developing", list(matrix.filter(row => row.developingStudents > 0).map(row => row.pattern)) || "None yet"],
    ["Patterns Needing Support", list(matrix.filter(row => row.needsSupportStudents > 0).map(row => row.pattern)) || "None yet"],
    ["Patterns With Unscored Evidence", list(matrix.filter(row => row.unscoredEvidenceStudents > 0).map(row => row.pattern)) || "None yet"]
  ];
}

function classAdvancedEvidenceDetailRows(report = {}) {
  return (report.formalAssessments?.classAdvancedPhonicsMatrix || []).flatMap(row => (
    decodeClassEvidenceRows(report, row.evidenceRows).map(detail => ({
      pattern: row.pattern,
      className: report.className || "Unknown Class",
      ...detail
    }))
  )).sort((a, b) => (
    String(a.studentName || "").localeCompare(String(b.studentName || "")) ||
    String(a.pattern || "").localeCompare(String(b.pattern || "")) ||
    String(a.date || "").localeCompare(String(b.date || ""))
  ));
}

function classBenchmarkSummary(summary = {}) {
  const total = Number(summary.totalStudents || 0);
  const saved = Number(summary.studentsWithSavedEvidence || 0);
  const metrics = summary.metrics || {};
  const evidence = `${saved}/${total} student(s) with saved evidence`;
  if (summary.domainKey === "phonologicalAwareness") {
    return `${evidence}; ${percentageText(metrics.averageAccuracyRate)} class average accuracy`;
  }
  if (summary.domainKey === "encoding") {
    return `${evidence}; ${percentageText(metrics.averageExactSpellingRate)} average exact spelling`;
  }
  if (summary.domainKey === "decoding") {
    return `${evidence}; ${percentageText(metrics.averageAccuracyRate)} average accuracy`;
  }
  return `${evidence}; ${numericValue(metrics.averageWcpm) === "" ? "average WCPM not scored" : `${numericValue(metrics.averageWcpm)} average WCPM`}`;
}

function buildClassElSummaryRows(report = {}) {
  const summaries = classBenchmarkDomainSummaryRows(report);
  const summaryByDomain = new Map(summaries.map(summary => [summary.domainKey, summary]));
  const totalStudents = classBenchmarkMatrixRows(report).length || report.summary?.totalStudents || report.studentRows?.length || 0;
  const summaryFor = domain => {
    const summary = summaryByDomain.get(domain);
    return summary ? classBenchmarkSummary(summary) : `0/${totalStudents} student(s) with saved evidence`;
  };
  const letterEvidence = classLetterEvidenceSummary(report);
  const advancedEvidence = classAdvancedEvidenceSummary(report);
  const evidenceSummary = (evidence, noun) => [
    `${evidence.scored} scored ${noun}`,
    evidence.unscored ? `${evidence.unscored} unscored evidence item(s)` : ""
  ].filter(Boolean).join("; ");

  return [
    ["Class Name", report.className || "Unknown Class"],
    ["Report Date", formatDate(report.generatedAt)],
    ["Generated At", formatExportDateTime(report.generatedAt) || formatExportDateTime(new Date())],
    ["EL Benchmark Scope", report.benchmarkScope?.label || "No benchmark route selected"],
    ["EL Assessment Date Range", getElReportDateRange(report)],
    ["Students In Report", totalStudents],
    ["Assessment 1 — Letter Names & Sounds", evidenceSummary(letterEvidence, "letter/name/sound response(s)")],
    ["Assessment 2 — Advanced Phonics Patterns", evidenceSummary(advancedEvidence, "student-pattern check(s)")],
    ["Assessment 3 — Phonological Awareness", summaryFor("phonologicalAwareness")],
    ["Assessment 4 — Encoding & Spelling", summaryFor("encoding")],
    ["Assessment 5 — Decoding & Automaticity", summaryFor("decoding")],
    ["Assessment 6 — Oral Reading Fluency", summaryFor("oralReadingFluency")],
    ["How To Read This Workbook", "Use the matrices and detail sheets for EL Assessments 1-6 only. Benchmark results are descriptive and do not apply an invented mastery cut score."]
  ];
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
    "Administration interface",
    "Response schema",
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
        "Administration interface": profile.administrationVersion || "",
        "Response schema": numericValue(profile.responseSchemaVersion),
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
    "Administration interface",
    "Response schema",
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
    "Response capture",
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
    "Response capture",
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
          "Administration interface": detail.administrationVersion || "",
          "Response schema": numericValue(detail.responseSchemaVersion),
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
          "Response capture": responseCaptureText(item),
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
    "Administration interface",
    "Response schema",
    "Administration status",
    "Prerequisite review",
    "Assessment validation issues",
    "Recommendations",
    "Observations",
    "Item ID",
    "Target spelling",
    "Student spelling",
    "Response capture",
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
    "Response capture",
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
        "Administration interface": detail.administrationVersion || "",
        "Response schema": numericValue(detail.responseSchemaVersion),
        "Administration status": detail.administrationStatusLabel || humanizeKey(detail.administrationStatus),
        "Prerequisite review": evidenceText(detail.prerequisiteReview),
        "Assessment validation issues": evidenceText(detail.validationIssues),
        "Recommendations": evidenceText(detail.recommendations),
        "Observations": evidenceText(detail.observations),
        "Item ID": item?.questionId || item?.itemKey || "",
        "Target spelling": item?.targetSpelling || item?.targetWord || "",
        "Student spelling": evidenceText(item?.studentSpelling ?? item?.exactResponse),
        "Response capture": responseCaptureText(item),
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
    "Administration interface",
    "Response schema",
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
    "Response capture",
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
    "Response capture",
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
        "Administration interface": detail.administrationVersion || "",
        "Response schema": numericValue(detail.responseSchemaVersion),
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
        "Response capture": responseCaptureText(item),
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
    "Administration interface",
    "Response schema",
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
    "Response capture",
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
    "Response capture",
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
          "Administration interface": detail.administrationVersion || "",
          "Response schema": numericValue(detail.responseSchemaVersion),
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
          "Response capture": responseCaptureText(passage),
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
    "Administration interface",
    "Response schema",
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
    "Response capture",
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
    "Response capture",
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
        "Administration interface": detail.administrationVersion || "",
        "Response schema": numericValue(detail.responseSchemaVersion),
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
        "Response capture": responseCaptureText(item),
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

async function createWorkbook(generatedAt = null) {
  const module = await import("exceljs");
  const ExcelJS = module.default || module["module.exports"] || module;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Literacy Guide";
  const createdAt = generatedAt ? new Date(generatedAt) : new Date();
  if (Number.isNaN(createdAt.getTime())) {
    throw new Error("EL export generatedAt must be a valid date.");
  }
  workbook.created = createdAt;
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

function elEvidenceWindow(report = {}) {
  const start = report.dateRange?.start || "";
  const end = report.dateRange?.end || "";
  if (start && end) return start === end ? start : `${start} to ${end}`;
  return report.assessmentWindow || "";
}

function buildElExportProvenanceRows(report = {}, reportType = report.reportType) {
  const isIndividual = reportType === "individual";
  const learnerCount = isIndividual ? 1 : (
    report.summary?.totalStudents || report.studentRows?.length || null
  );
  return buildExportProvenanceRows({
    reportTitle: isIndividual ? "Student EL Assessment Report" : "Class EL Assessment Report",
    schoolName: report.schoolName,
    className: report.className,
    learnerName: isIndividual ? report.studentName : "",
    learnerId: isIndividual ? report.studentId : "",
    learnerCount,
    generatedAt: report.generatedAt,
    timeZone: report.timeZone,
    filters: {
      "EL benchmark scope": report.benchmarkScope?.label || "No benchmark route selected",
      "Assessment window": report.assessmentWindow || "All included evidence"
    },
    evidenceWindow: elEvidenceWindow(report),
    evidenceSource: report.sourceSnapshot?.records || [],
    versionSummary: report.exportVersionSummary,
    definitions: `Definitions are included in the ${METRIC_DEFINITIONS_SHEET_NAME} sheet.`
  });
}

export async function createStudentElAssessmentWorkbook(report) {
  const workbook = await createWorkbook(report?.generatedAt);

  const summarySheet = workbook.addWorksheet("Student Summary");
  setColumns(summarySheet, ["Field", "Value"], ["Value"]);
  buildStudentElSummaryRows(report)
    .forEach(row => summarySheet.addRow({ Field: row[0], Value: row[1] }));

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
    "Uppercase name unscored",
    "Uppercase sound unscored",
    "Lowercase name unscored",
    "Lowercase sound unscored",
    "Last assessed",
    "Uppercase name evidence provenance",
    "Uppercase sound evidence provenance",
    "Lowercase name evidence provenance",
    "Lowercase sound evidence provenance",
    "Details / notes"
  ], [
    "Uppercase name evidence provenance",
    "Uppercase sound evidence provenance",
    "Lowercase name evidence provenance",
    "Lowercase sound evidence provenance",
    "Details / notes"
  ]);
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
    "Uppercase name unscored": row.uppercaseName.unscoredCount || 0,
    "Uppercase sound unscored": row.uppercaseSound.unscoredCount || 0,
    "Lowercase name unscored": row.lowercaseName.unscoredCount || 0,
    "Lowercase sound unscored": row.lowercaseSound.unscoredCount || 0,
    "Last assessed": formatDate(row.lastAssessed),
    "Uppercase name evidence provenance": formalEvidenceList(row.uppercaseName.details),
    "Uppercase sound evidence provenance": formalEvidenceList(row.uppercaseSound.details),
    "Lowercase name evidence provenance": formalEvidenceList(row.lowercaseName.details),
    "Lowercase sound evidence provenance": formalEvidenceList(row.lowercaseSound.details),
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
    "Uppercase name unscored": 0,
    "Uppercase sound unscored": 0,
    "Lowercase name unscored": 0,
    "Lowercase sound unscored": 0,
    "Last assessed": "",
    "Uppercase name evidence provenance": "",
    "Uppercase sound evidence provenance": "",
    "Lowercase name evidence provenance": "",
    "Lowercase sound evidence provenance": "",
    "Details / notes": ""
  });

  const advancedSheet = workbook.addWorksheet("Advanced Phonics Patterns");
  setColumns(advancedSheet, [
    "Pattern",
    "Reading / recognition result",
    "Sound result",
    "Evidence items",
    "Unscored evidence items",
    "Attempts",
    "Correct",
    "Incorrect",
    "Accuracy",
    "Status",
    "Example words",
    "Last assessed",
    "Evidence provenance"
  ], ["Example words", "Evidence provenance"]);
  addRowsOrEmpty(advancedSheet, report.formalAssessments?.individualAdvancedPhonicsMatrix || [], row => row ? {
    "Pattern": row.pattern,
    "Reading / recognition result": row.readingResult.statusLabel,
    "Sound result": row.soundResult.statusLabel,
    "Evidence items": row.evidenceCount || row.details?.length || 0,
    "Unscored evidence items": row.unscoredCount || 0,
    "Attempts": row.attempts,
    "Correct": row.correct,
    "Incorrect": row.incorrect,
    "Accuracy": row.accuracy == null ? "" : `${row.accuracy}%`,
    "Status": row.statusLabel,
    "Example words": list(row.exampleWords),
    "Last assessed": formatDate(row.lastAssessed),
    "Evidence provenance": formalEvidenceList(row.details)
  } : {
    "Pattern": "No Advanced Phonics Patterns records yet",
    "Reading / recognition result": "Not assessed",
    "Sound result": "Not assessed",
    "Evidence items": 0,
    "Unscored evidence items": 0,
    "Attempts": 0,
    "Correct": 0,
    "Incorrect": 0,
    "Accuracy": "",
    "Status": "Not assessed",
    "Example words": "",
    "Last assessed": "",
    "Evidence provenance": ""
  });

  addStudentBenchmarkSheets(workbook, report);
  addExportProvenanceWorksheet(workbook, buildElExportProvenanceRows(report, "individual"));
  addMetricDefinitionsWorksheet(workbook, { generatedAt: report?.generatedAt });

  applyWorkbookPresentation(workbook, EL_STUDENT_REPORT_SHEETS);
  return workbook;
}

export async function createClassElAssessmentWorkbook(report) {
  const workbook = await createWorkbook(report?.generatedAt);

  const summarySheet = workbook.addWorksheet("Class Summary");
  setColumns(summarySheet, ["Field", "Value"], ["Value"]);
  buildClassElSummaryRows(report)
    .forEach(row => summarySheet.addRow({ Field: row[0], Value: row[1] }));

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
    "LC sound support students",
    "UC name unscored evidence students",
    "UC sound unscored evidence students",
    "LC name unscored evidence students",
    "LC sound unscored evidence students",
    "UC name evidence provenance",
    "UC sound evidence provenance",
    "LC name evidence provenance",
    "LC sound evidence provenance"
  ], [
    "UC name support students",
    "UC sound support students",
    "LC name support students",
    "LC sound support students",
    "UC name unscored evidence students",
    "UC sound unscored evidence students",
    "LC name unscored evidence students",
    "LC sound unscored evidence students",
    "UC name evidence provenance",
    "UC sound evidence provenance",
    "LC name evidence provenance",
    "LC sound evidence provenance"
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
    "LC sound support students": list(row.lowercaseSound.supportStudents),
    "UC name unscored evidence students": list(row.uppercaseName.unscoredEvidenceStudents),
    "UC sound unscored evidence students": list(row.uppercaseSound.unscoredEvidenceStudents),
    "LC name unscored evidence students": list(row.lowercaseName.unscoredEvidenceStudents),
    "LC sound unscored evidence students": list(row.lowercaseSound.unscoredEvidenceStudents),
    "UC name evidence provenance": formalEvidenceList(decodeClassEvidenceRows(report, row.uppercaseName.evidenceRows), { includeStudent: true }),
    "UC sound evidence provenance": formalEvidenceList(decodeClassEvidenceRows(report, row.uppercaseSound.evidenceRows), { includeStudent: true }),
    "LC name evidence provenance": formalEvidenceList(decodeClassEvidenceRows(report, row.lowercaseName.evidenceRows), { includeStudent: true }),
    "LC sound evidence provenance": formalEvidenceList(decodeClassEvidenceRows(report, row.lowercaseSound.evidenceRows), { includeStudent: true })
  } : {
    "Letter pair": "No Letter Name/Sound records yet",
    "UC name counts": "M:0 D:0 S:0 U:0 NA:0",
    "UC sound counts": "M:0 D:0 S:0 U:0 NA:0",
    "LC name counts": "M:0 D:0 S:0 U:0 NA:0",
    "LC sound counts": "M:0 D:0 S:0 U:0 NA:0",
    "UC name support students": "",
    "UC sound support students": "",
    "LC name support students": "",
    "LC sound support students": "",
    "UC name unscored evidence students": "",
    "UC sound unscored evidence students": "",
    "LC name unscored evidence students": "",
    "LC sound unscored evidence students": "",
    "UC name evidence provenance": "",
    "UC sound evidence provenance": "",
    "LC name evidence provenance": "",
    "LC sound evidence provenance": ""
  });

  const classAdvancedMatrixSheet = workbook.addWorksheet("Advanced Phonics Class Matrix");
  setColumns(classAdvancedMatrixSheet, [
    "Pattern",
    "Students with evidence",
    "Attempted students",
    "Unscored evidence students",
    "Mastered students",
    "Developing students",
    "Needs support students",
    "Not assessed students",
    "Mastery percentage",
    "Students needing support",
    "Students with unscored evidence",
    "Evidence provenance"
  ], ["Students needing support", "Students with unscored evidence", "Evidence provenance"]);
  addRowsOrEmpty(classAdvancedMatrixSheet, report.formalAssessments?.classAdvancedPhonicsMatrix || [], row => row ? {
    "Pattern": row.pattern,
    "Students with evidence": row.evidenceStudents || 0,
    "Attempted students": row.attemptedStudents,
    "Unscored evidence students": row.unscoredEvidenceStudents || 0,
    "Mastered students": row.masteredStudents,
    "Developing students": row.developingStudents,
    "Needs support students": row.needsSupportStudents,
    "Not assessed students": row.notAssessedStudents,
    "Mastery percentage": row.masteryPercentage == null ? "" : `${row.masteryPercentage}%`,
    "Students needing support": list(row.studentsNeedingSupport),
    "Students with unscored evidence": list(row.studentsWithUnscoredEvidence),
    "Evidence provenance": formalEvidenceList(decodeClassEvidenceRows(report, row.evidenceRows), { includeStudent: true })
  } : {
    "Pattern": "No Advanced Phonics Patterns records yet",
    "Students with evidence": 0,
    "Attempted students": 0,
    "Unscored evidence students": 0,
    "Mastered students": 0,
    "Developing students": 0,
    "Needs support students": 0,
    "Not assessed students": 0,
    "Mastery percentage": "",
    "Students needing support": "",
    "Students with unscored evidence": "",
    "Evidence provenance": ""
  });

  const advancedSheet = workbook.addWorksheet("Advanced Phonics Patterns");
  setColumns(advancedSheet, ["Field", "Value"], ["Value"]);
  buildClassAdvancedPhonicsSummaryRows(report)
    .forEach(row => advancedSheet.addRow({ Field: row[0], Value: row[1] }));

  const patternSheet = workbook.addWorksheet("Pattern Detail");
  setColumns(patternSheet, [
    "Student",
    "Class",
    "Pattern",
    "Attempt ID",
    "Item ID",
    "Item key",
    "Item type",
    "Result type",
    "Response status",
    "Result",
    "Prompt",
    "Target word",
    "Correct answer",
    "Selected answer",
    "Administration status",
    "Form version",
    "Content version",
    "Scoring version",
    "Scoring rule version",
    "Administration interface",
    "Response schema",
    "Evidence date"
  ], ["Prompt", "Correct answer", "Selected answer"]);
  addRowsOrEmpty(patternSheet, classAdvancedEvidenceDetailRows(report), row => row ? {
    "Student": row.studentName,
    "Class": row.className,
    "Pattern": row.pattern,
    "Attempt ID": row.attemptId,
    "Item ID": row.questionId,
    "Item key": row.itemKey,
    "Item type": row.itemType,
    "Result type": humanizeKey(row.resultType),
    "Response status": humanizeKey(row.responseStatus || "unrecorded"),
    "Result": formalEvidenceResult(row),
    "Prompt": row.prompt,
    "Target word": row.targetWord,
    "Correct answer": evidenceText(row.correctAnswer),
    "Selected answer": evidenceText(row.selectedAnswer),
    "Administration status": humanizeKey(row.administrationStatus),
    "Form version": row.formVersion,
    "Content version": row.contentVersion,
    "Scoring version": row.scoringVersion,
    "Scoring rule version": row.scoringRuleVersion,
    "Administration interface": row.administrationVersion,
    "Response schema": numericValue(row.responseSchemaVersion),
    "Evidence date": formatExportDateTime(row.date) || formatDate(row.date)
  } : {
    "Student": "No Advanced Phonics Patterns records yet",
    "Class": "",
    "Pattern": "",
    "Attempt ID": "",
    "Item ID": "",
    "Item key": "",
    "Item type": "",
    "Result type": "",
    "Response status": "",
    "Result": "",
    "Prompt": "",
    "Target word": "",
    "Correct answer": "",
    "Selected answer": "",
    "Administration status": "",
    "Form version": "",
    "Content version": "",
    "Scoring version": "",
    "Scoring rule version": "",
    "Administration interface": "",
    "Response schema": "",
    "Evidence date": ""
  });

  addClassBenchmarkSheets(workbook, report);
  addExportProvenanceWorksheet(workbook, buildElExportProvenanceRows(report, "whole_class"));
  addMetricDefinitionsWorksheet(workbook, { generatedAt: report?.generatedAt });

  applyWorkbookPresentation(workbook, EL_CLASS_REPORT_SHEETS);
  return workbook;
}

export function buildStudentElAssessmentExportReport(options = {}) {
  const assessmentHistory = filterElAssessmentHistory(options.assessmentHistory);
  const report = buildStudentElAssessmentReportData({
    ...options,
    assessmentHistory
  });
  const student = (Array.isArray(options.students) ? options.students : [])
    .find(row => row?.id === options.studentId) || {};
  // The general report store supports older attempt shapes and therefore
  // normalizes records before building its report. Rebuild the formal A1-A6
  // evidence from the raw, strictly filtered attempts so an absent score (or
  // an explicit not_administered/not_scorable state) cannot become a failure.
  const formalAssessments = buildIndividualElFormalAssessmentReport({
    student,
    assessmentHistory,
    benchmarkScope: report.benchmarkScope,
    benchmarkGrade: options.benchmarkGrade,
    benchmarkWindow: options.benchmarkWindow
  });
  return {
    ...report,
    formalAssessments,
    benchmarkProfile: formalAssessments.individualBenchmarkProfile || [],
    benchmarkDetails: formalAssessments.individualBenchmarkDetails || []
  };
}

export function buildClassElAssessmentExportReport(options = {}) {
  const assessmentHistory = filterElAssessmentHistory(options.assessmentHistory);
  const report = buildClassElAssessmentReportData({
    ...options,
    assessmentHistory
  });
  const formalAssessments = buildClassElFormalAssessmentReport({
    students: Array.isArray(options.students) ? options.students : [],
    assessmentHistory,
    classId: options.classId || "",
    benchmarkScope: report.benchmarkScope,
    benchmarkGrade: options.benchmarkGrade,
    benchmarkWindow: options.benchmarkWindow
  });
  return {
    ...report,
    formalAssessments,
    benchmarkMatrix: formalAssessments.classBenchmarkMatrix || [],
    benchmarkDomainSummaries: formalAssessments.classBenchmarkDomainSummaries || [],
    benchmarkDetails: formalAssessments.classBenchmarkDetails || []
  };
}

export async function exportStudentElAssessmentExcel(options = {}) {
  const previousReports = await hydrateElAssessmentReports({
    teacherId: options.teacherId || "local",
    supabase: options.supabase || null,
    reportType: "individual",
    classId: options.classId || "",
    studentId: options.studentId || ""
  });
  const report = buildStudentElAssessmentExportReport({ ...options, previousReports });
  const workbook = await createStudentElAssessmentWorkbook(report);
  await downloadWorkbook(workbook, report.fileName);
  report.persistence = await saveElAssessmentReport(report, options);
  return report;
}

export async function exportClassElAssessmentExcel(options = {}) {
  const previousReports = await hydrateElAssessmentReports({
    teacherId: options.teacherId || "local",
    supabase: options.supabase || null,
    reportType: "whole_class",
    classId: options.classId || ""
  });
  const report = buildClassElAssessmentExportReport({ ...options, previousReports });
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

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
import { buildStudentAssessmentEvidenceReadModel } from "../data/studentReportingWorkspaceModel.js";
import { formatExportDateTime } from "./exportReportSections.js";
import { normalizeElExportScope } from "./elAssessmentExportPolicy.js";
import {
  addMetricDefinitionsWorksheet,
  METRIC_DEFINITIONS_SHEET_NAME
} from "./metricDefinitions.js";
import {
  addExportProvenanceWorksheet,
  buildExportProvenanceRows,
  REPORT_PROVENANCE_SHEET_NAME
} from "./exportProvenance.js";
import {
  evaluateLearningConclusion,
  isLearningEvidenceRecent,
  LEARNING_CONCLUSION_SCOPES,
  LEARNING_EVIDENCE_POLICY,
  LEARNING_STATUS_IDS,
  rawLearningStatus
} from "../policy/learningPolicy.js";
import { displayBenchmarkScopeLabel } from "../data/elBenchmarkReportScope.js";

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

export const EL_EMPTY_STUDENT_REPORT_SHEETS = [
  "Student Summary",
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

function formalStatusFromSkillsAggregate(
  aggregate = {},
  rawDetails = [],
  now = new Date()
) {
  const attempts = Number(aggregate.details?.observations || 0);
  const correct = Number(aggregate.details?.correct || 0);
  if (!Number.isFinite(attempts) || attempts <= 0) {
    return Number(aggregate.details?.lifetimeObservations || 0) > 0
      ? { status: "not_enough_evidence", statusLabel: "Not enough results" }
      : { status: "not_assessed", statusLabel: "Not checked" };
  }
  const accuracy = Number.isFinite(Number(aggregate.details?.accuracy))
    ? Number(aggregate.details.accuracy)
    : Math.round((correct / attempts) * 100);
  const independentAttemptIds = new Set(
    [
      ...rawDetails.map(row => row?.provenance?.attemptId || row?.sourceRecordId || ""),
      ...(Array.isArray(aggregate.provenance?.sourceRecordIds)
        ? aggregate.provenance.sourceRecordIds
        : [])
    ].filter(Boolean)
  );
  const independentAttempts = independentAttemptIds.size
    || Number(aggregate.details?.independentAttempts || 0)
    || 1;
  const conclusion = evaluateLearningConclusion({
    scope: LEARNING_CONCLUSION_SCOPES.ITEM,
    accuracy,
    attempts: independentAttempts,
    observedAt: aggregate.observedAt || rawDetails
      .map(row => row?.observedAt)
      .filter(Boolean)
      .sort()
      .at(-1) || "",
    now,
    minimumAttempts: LEARNING_EVIDENCE_POLICY.minimumEvidence.exactItemIndependentAttempts,
    skillDiversity: 1,
    requireRecency: true
  });
  if (!conclusion.ready) {
    return { status: "not_enough_evidence", statusLabel: "Not enough results" };
  }
  if (conclusion.status.id === LEARNING_STATUS_IDS.SECURE) {
    return { status: "mastered", statusLabel: "Secure" };
  }
  if (conclusion.status.id === LEARNING_STATUS_IDS.DEVELOPING) {
    return { status: "developing", statusLabel: "Developing" };
  }
  return { status: "needs_support", statusLabel: "Needs support" };
}

function skillsCheckLetterCellKey(concept = {}) {
  if (!["letter_name", "letter_sound"].includes(concept.construct)) return "";
  const letterCase = concept.variant === "uppercase" ? "uppercase" : "lowercase";
  const mode = concept.construct === "letter_sound" ? "Sound" : "Name";
  return `${letterCase}${mode}`;
}

function skillsCheckDetail(raw = {}, aggregate = {}, now = new Date()) {
  const status = raw.statusCandidate || aggregate.statusCandidate || "";
  const date = raw.observedAt || aggregate.observedAt || "";
  return {
    sourceLabel: "Skills assessment",
    sourceStore: "assessment_attempts",
    attemptId: raw.provenance?.attemptId || raw.sourceRecordId || aggregate.details?.currentAttemptId || "",
    questionId: raw.provenance?.questionId || "",
    itemKey: aggregate.concept?.key || "",
    itemType: aggregate.concept?.construct || "",
    targetLetter: aggregate.concept?.key || "",
    responseStatus: raw.details?.responseStatus || status || "recorded",
    isCorrect: status === "secure" ? true : status === "needs_teaching" ? false : null,
    scored: Boolean(status),
    administrationStatus: raw.administrationStatus || aggregate.administrationStatus || "",
    formVersion: raw.provenance?.formVersion || "",
    contentVersion: raw.provenance?.contentVersion || "",
    scoringVersion: raw.provenance?.scoringVersion || "",
    responseSchemaVersion: raw.provenance?.schemaVersion ?? "",
    date,
    withinCurrentWindow: isLearningEvidenceRecent(date, { now })
  };
}

function mergeSkillsCheckLettersIntoFormalAssessment(
  formalAssessments = {},
  skillsCheck = {},
  now = new Date()
) {
  const rawById = new Map((skillsCheck.evidence || []).map(row => [row.evidenceId, row]));
  const aggregateRows = (skillsCheck.knowledgeEvidence || []).filter(row => (
    row?.concept?.domain === "alphabet_knowledge" &&
    ["letter_name", "letter_sound"].includes(row?.concept?.construct) &&
    (
      row.statusCandidate ||
      Number(row.details?.observations || 0) > 0 ||
      Number(row.details?.lifetimeObservations || 0) > 0
    )
  ));
  if (!aggregateRows.length) return formalAssessments;

  const byLetter = new Map((formalAssessments.individualLetterMatrix || []).map(row => [row.letter, row]));
  let reconciledCellCount = 0;
  aggregateRows.forEach(aggregate => {
    const letter = String(aggregate.concept?.key || "").toLowerCase().match(/[a-z]/)?.[0] || "";
    const cellKey = skillsCheckLetterCellKey(aggregate.concept);
    const row = byLetter.get(letter);
    if (!row || !cellKey || Number(row[cellKey]?.evidenceCount || 0) > 0) return;
    const currentContributingIds = aggregate.details?.contributingEvidenceIds || [];
    const lifetimeContributingIds = aggregate.details?.lifetimeContributingEvidenceIds || [];
    const currentRawDetails = currentContributingIds
      .map(id => rawById.get(id))
      .filter(Boolean);
    const selectedPeriodRawDetails = (
      lifetimeContributingIds.length
        ? lifetimeContributingIds
        : currentContributingIds
    ).map(id => rawById.get(id)).filter(Boolean);
    const rawDetails = selectedPeriodRawDetails.length
      ? selectedPeriodRawDetails
      : currentRawDetails;
    const details = (rawDetails.length ? rawDetails : [aggregate])
      .map(raw => skillsCheckDetail(raw, aggregate, now));
    const attempts = Number(aggregate.details?.observations ?? details.length ?? 0);
    const correct = Number(aggregate.details?.correct || 0);
    const normalizedStatus = formalStatusFromSkillsAggregate(
      aggregate,
      currentRawDetails,
      now
    );
    const selectedPeriodAttempts = Number(
      aggregate.details?.lifetimeObservations ?? attempts
    );
    const selectedPeriodCorrect = Number(
      aggregate.details?.lifetimeCorrect ?? correct
    );
    row[cellKey] = {
      ...row[cellKey],
      ...normalizedStatus,
      evidenceCount: details.length,
      currentEvidenceCount: currentRawDetails.length,
      staleEvidenceCount: Math.max(0, details.length - currentRawDetails.length),
      unscoredCount: Math.max(0, currentRawDetails.length - attempts),
      selectedPeriodUnscoredCount: Math.max(0, details.length - selectedPeriodAttempts),
      attempts,
      selectedPeriodAttempts,
      correct,
      selectedPeriodCorrect,
      incorrect: Math.max(0, attempts - correct),
      accuracy: aggregate.details?.accuracy ?? (attempts ? Math.round((correct / attempts) * 100) : null),
      lastAssessed: formatDate(
        details.map(detail => detail.date).filter(Boolean).sort().at(-1) ||
        aggregate.observedAt
      ),
      lastCurrentAssessed: formatDate(aggregate.observedAt),
      details,
      evidenceSources: ["Skills assessment"],
      reconciledFromSkillSpine: true
    };
    row.lastAssessed = [row.lastAssessed, row[cellKey].lastAssessed]
      .filter(Boolean)
      .sort()
      .at(-1) || "";
    reconciledCellCount += 1;
  });

  return {
    ...formalAssessments,
    individualLetterMatrix: Array.from(byLetter.values()),
    reconciledSkillSpine: {
      source: "Skills assessment",
      letterConceptCount: aggregateRows.length,
      reconciledCellCount,
      precedence: "EL Assessment 1 results are used when present; otherwise the canonical Skills assessment concept supplies the same current skill-spine status."
    }
  };
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
  return `${cell.statusLabel || "Not checked"}${cell.attempts ? ` (${cell.correct}/${cell.attempts})` : ""}`;
}

function cellCountSummary(group = {}) {
  return `M:${group.mastered || 0} D:${group.developing || 0} S:${group.needs_support || 0} U:${group.unscored_evidence || 0} NA:${group.not_assessed || 0} NE:${group.not_enough_evidence || 0}`;
}

function parsePercent(value) {
  const match = String(value ?? "").match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function fillForAccuracy(value) {
  const percent = parsePercent(value);
  if (percent === null) return null;
  const status = rawLearningStatus(percent);
  if (status === LEARNING_STATUS_IDS.SECURE) return EXPORT_COLORS.greenSoft;
  if (status === LEARNING_STATUS_IDS.DEVELOPING) return EXPORT_COLORS.amberSoft;
  return EXPORT_COLORS.redSoft;
}

function fillForStatus(value) {
  const normalized = String(value || "").toLowerCase();
  if (/pass|master|secure|yes|correct/.test(normalized)) return EXPORT_COLORS.greenSoft;
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
  if (detail.sourceLabel || detail.sourceStore) {
    parts.push(`Source: ${detail.sourceLabel || detail.sourceStore}`);
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
      summary.staleEvidenceCount += Number(row?.[key]?.staleEvidenceCount || 0);
      summary.unscoredCount += Number(row?.[key]?.unscoredCount || 0);
      summary.attempts += Number(row?.[key]?.attempts || 0);
      summary.correct += Number(row?.[key]?.correct || 0);
    });
    const date = formatDate(row.lastAssessed);
    if (date > summary.latestDate) summary.latestDate = date;
    return summary;
  }, {
    evidenceCount: 0,
    staleEvidenceCount: 0,
    unscoredCount: 0,
    attempts: 0,
    correct: 0,
    latestDate: ""
  });
}

function studentAdvancedEvidence(report = {}) {
  const rows = report.formalAssessments?.individualAdvancedPhonicsMatrix || [];
  return rows.reduce((summary, row) => {
    summary.evidenceCount += Number(row.evidenceCount || row.details?.length || 0);
    summary.staleEvidenceCount += Number(row.staleEvidenceCount || 0);
    summary.unscoredCount += Number(row.unscoredCount || 0);
    summary.attempts += Number(row.attempts || 0);
    summary.correct += Number(row.correct || 0);
    const date = formatDate(row.lastAssessed);
    if (date > summary.latestDate) summary.latestDate = date;
    return summary;
  }, {
    evidenceCount: 0,
    staleEvidenceCount: 0,
    unscoredCount: 0,
    attempts: 0,
    correct: 0,
    latestDate: ""
  });
}

export function getStudentElReportEvidenceCount(report = {}) {
  const letter = studentLetterEvidence(report);
  const advanced = studentAdvancedEvidence(report);
  const benchmark = benchmarkProfileRows(report)
    .filter(profile => profile.hasSavedEvidence)
    .reduce((total, profile) => total + Math.max(1, Number(profile.attemptCount || 0)), 0);
  return letter.evidenceCount + advanced.evidenceCount + benchmark;
}

function benchmarkProfileSummary(profile = {}) {
  if (!profile.hasSavedEvidence) return "No saved results";
  const metrics = profile.metrics || {};
  const status = profile.administrationStatusLabel || humanizeKey(profile.administrationStatus) || "Results recorded";
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
    if (!evidence.evidenceCount) return "No saved results";
    const scored = evidence.attempts
      ? `${evidence.correct} of ${evidence.attempts} correct ${noun}`
      : evidence.staleEvidenceCount
        ? `Saved results are outside the latest ${LEARNING_EVIDENCE_POLICY.recency.conclusionWindowDays}-day status window`
        : "No scored responses; no result inferred";
    const unscored = evidence.unscoredCount ? `; ${evidence.unscoredCount} unscored item(s)` : "";
    return `${scored}${unscored}${evidence.latestDate ? `; latest ${evidence.latestDate}` : ""}`;
  };
  const sourceReads = Array.isArray(report.evidenceSourceReads) ? report.evidenceSourceReads : [];
  const sourceSummary = sourceReads.length
    ? sourceReads.map(source => `${source.store}: ${source.recordCount} row(s)`).join("; ")
    : "No result-source details";
  const latestSync = sourceReads.map(source => source.lastSyncedAt).filter(Boolean).sort().at(-1) || "";
  const contextRows = [
    ["Student Name", report.studentName || "Unknown Student"],
    ["Class Name", report.className || "Unknown Class"],
    ["Report Date", formatDate(report.generatedAt)],
    ["Generated At", formatExportDateTime(report.generatedAt) || formatExportDateTime(new Date())],
    ["EL Benchmark Scope", displayBenchmarkScopeLabel(report.benchmarkScope, "No grade and time of year selected")],
    ["EL Assessment Date Range", getElReportDateRange(report)],
    [
      "Current status window",
      report.reportingPeriods?.currentConclusions?.label ||
        `Latest ${LEARNING_EVIDENCE_POLICY.recency.conclusionWindowDays} days`
    ],
    ["Evidence Stores Read", sourceSummary],
    ["Evidence Read / Sync Completed", latestSync ? formatExportDateTime(latestSync) : "Sync time unavailable"]
  ];
  if (getStudentElReportEvidenceCount(report) === 0) {
    return [
      [
        "Nothing to report",
        `Nothing to report for ${report.studentName || "this student"} — no saved EL or reconciled Skills assessment results. Run or save an assessment first.`
      ],
      ...contextRows,
      [
        "How To Read This Workbook",
        "No assessment result rows are included because no results were saved. Source details and definitions remain available."
      ]
    ];
  }

  return [
    ...contextRows.slice(0, 6),
    ["Assessments With Saved Evidence", `${savedAssessmentCount} of 6`],
    ...contextRows.slice(6),
    ["Assessment 1 — Letter Names & Sounds", evidenceSummary(letter, "letter/name/sound response(s)")],
    ["Assessment 2 — Advanced Phonics Patterns", evidenceSummary(advanced, "pattern response(s)")],
    ["Assessment 3 — Phonological Awareness", benchmarkProfileSummary(profileByDomain.get("phonologicalAwareness"))],
    ["Assessment 4 — Encoding & Spelling", benchmarkProfileSummary(profileByDomain.get("encoding"))],
    ["Assessment 5 — Decoding & Automaticity", benchmarkProfileSummary(profileByDomain.get("decoding"))],
    ["Assessment 6 — Oral Reading Fluency", benchmarkProfileSummary(profileByDomain.get("oralReadingFluency"))],
    ["How To Read This Workbook", "Use the named assessment sheets for result details. Benchmark results are descriptive and do not apply an invented mastery cut score."]
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
  const evidence = `${saved} of ${total} student(s) with saved results`;
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
    return summary ? classBenchmarkSummary(summary) : `0 of ${totalStudents} student(s) with saved results`;
  };
  const letterEvidence = classLetterEvidenceSummary(report);
  const advancedEvidence = classAdvancedEvidenceSummary(report);
  const evidenceSummary = (evidence, noun) => [
    `${evidence.scored} scored ${noun}`,
    evidence.unscored ? `${evidence.unscored} unscored item(s)` : ""
  ].filter(Boolean).join("; ");

  return [
    ["Class Name", report.className || "Unknown Class"],
    ["Report Date", formatDate(report.generatedAt)],
    ["Generated At", formatExportDateTime(report.generatedAt) || formatExportDateTime(new Date())],
    ["EL Benchmark Scope", displayBenchmarkScopeLabel(report.benchmarkScope, "No grade and time of year selected")],
    ["EL Assessment Date Range", getElReportDateRange(report)],
    ["Students In Report", totalStudents],
    ["Assessment 1 — Letter Names & Sounds", evidenceSummary(letterEvidence, "letter/name/sound response(s)")],
    ["Assessment 2 — Advanced Phonics Patterns", evidenceSummary(advancedEvidence, "student-pattern assessment(s)")],
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
    addPlaceholderRow(sheet, "Domain", "No benchmark profile results are available.", {
      "Saved evidence": "No",
      "Administration status": "No saved results",
      "Interpretation": "Descriptive results only; no cut score is applied."
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
        "Interpretation": profile.interpretation || "Descriptive results only; no cut score is applied."
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
    addPlaceholderRow(sheet, "Attempt ID", "No phonological-awareness results are available.", {
      "Administration status": "No saved results"
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
    addPlaceholderRow(sheet, "Attempt ID", "No encoding results are available.", {
      "Administration status": "No saved results"
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
    addPlaceholderRow(sheet, "Attempt ID", "No decoding results are available.", {
      "Administration status": "No saved results"
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
    addPlaceholderRow(sheet, "Attempt ID", "No oral-reading-fluency results are available.", {
      "Administration status": "No saved results"
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
          "Interpretation": detail.interpretation || "Descriptive results only; no cut score is applied."
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
    return `${strand.strandLabel || humanizeKey(strand.strand)}: ${accuracy}; ${strand.studentsObserved || 0} student(s); ${strand.correctCount || 0} of ${strand.administeredCount || 0} items`;
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
      "Interpretation": "Descriptive results only; no cut score is applied."
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
        "Interpretation": summary.interpretation || "Descriptive results only; no cut score is applied."
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
            ].filter(Boolean).join(" · ")
          : "",
        "Stop reason": detail.domainKey === "decoding" ? detail.stopEvidence?.reason || "" : "",
        "Candidate placement": reportableCandidatePlacementText(detail.candidatePlacement),
        "Confirmed placement": evidenceText(detail.confirmedPlacement),
        "Placement source": humanizeKey(detail.placementSource),
        "Error tags": evidenceText(item?.errorTags),
        "Validation issues": evidenceText(item?.validationIssues),
        "Feature tags": evidenceText(item?.featureTags),
        "Interpretation": detail.interpretation || "Descriptive results only; no cut score is applied."
      });
    });
  });
  if (!rowCount) {
    addPlaceholderRow(sheet, "Student", "No class benchmark result details are available.", {
      "Administration status": "No saved results",
      "Interpretation": "Descriptive results only; no cut score is applied."
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

const INTERNAL_EXPORT_COLUMN = /\b(?:attempt id|assessment id|item id|question id|item key|source record id|response schema|provenance|app version|assessment version|form version|content version|policy version|scoring version|scoring rule version|administration interface)\b/i;
const INTERNAL_EXPORT_ROW = /^(?:app version\(s\)|(?:assessment|check) version\(s\)|content version\(s\)|scoring version\(s\)|policy version\(s\)|child id|learner id|student id)$/i;

function teacherExportCopy(value) {
  const original = String(value ?? "");
  const statusLabels = {
    not_assessed: "Not checked",
    not_administered: "Not checked",
    not_recorded: "Not recorded",
    not_scorable: "Not scored",
    in_progress: "In progress",
    needs_teaching: "Needs more practice",
    incorrect: "Needs another look"
  };
  const statusKey = original.trim().toLowerCase();
  if (statusLabels[statusKey]) return statusLabels[statusKey];

  const mapped = original
    .replace(/\bEL Benchmark Scope\b/gi, "EL grade and time of year")
    .replace(/\bNo benchmark route selected\b/gi, "No grade and time of year selected")
    .replace(/\bFluency route judgment usable\b/gi, "Fluency next-step decision available")
    .replace(/\bFluency route decision\b/gi, "Fluency next-step decision")
    .replace(/\bRoute judgment usable\b/gi, "Next-step decision available")
    .replace(/\bRoute decision\b/gi, "Next-step decision")
    .replace(/\bBenchmark Evidence Detail\b/gi, "Benchmark result detail")
    .replace(/\bEvidence Stores Read\b/gi, "Result sources read")
    .replace(/\bEvidence Read\s*\/\s*Sync Completed\b/gi, "Results loaded and synced")
    .replace(/\bAssessments With Saved Evidence\b/gi, "Assessments with saved results")
    .replace(/\bCorrect Evidence\b/gi, "Marked correct")
    .replace(/\bEvidence Status\b/gi, "Result status")
    .replace(/\bPatterns With Mastery Evidence\b/gi, "Patterns shown as Secure")
    .replace(/\bLatest Evidence Date\b/gi, "Latest result date")
    .replace(/\bStopped\s*\/\s*Discontinued Students\b/gi, "Students stopped or discontinued")
    .replace(/\bStrand\s*\/\s*Band\b/gi, "Strand or word group")
    .replace(/\bTarget\s*\/\s*Prompt\b/gi, "Target or prompt")
    .replace(/\bStop Cycle Anchor\s*\/\s*Band\b/gi, "Stop cycle anchor or word group")
    .replace(/\bReading\s*\/\s*Recognition Result\b/gi, "Reading or recognition result")
    .replace(/\bDetails\s*\/\s*Notes\b/gi, "Details and notes")
    .replace(/\bAssessment Validation Issues\b/gi, "Assessment review notes")
    .replace(/\bValidation Issues\b/gi, "Review notes")
    .replace(/\bResponse Capture\b/gi, "Recorded response details")
    .replace(/\bNot-scorable Reason\b/gi, "Why it could not be scored")
    .replace(/\bNot-scorable Note\b/gi, "Scoring note")
    .replace(/\bScoring Code\b/gi, "Result code")
    .replace(/\bError Tags\b/gi, "Error patterns")
    .replace(/\bFeature Tags\b/gi, "Skill details")
    .replace(/\bMicrophase\b/gi, "Reading stage")
    .replace(/\bletter\/name\/sound\b/gi, "letter name or sound")
    .replace(/\bstudent-pattern\b/gi, "student pattern")
    .replace(
      /\bM:(\d+)\s+D:(\d+)\s+S:(\d+)\s+U:(\d+)\s+NA:(\d+)\s+NE:(\d+)\b/g,
      "Secure: $1 · Developing: $2 · Needs support: $3 · Unscored: $4 · Not checked: $5 · Not enough results: $6"
    )
    .replace(
      /\bM:(\d+)\s+D:(\d+)\s+S:(\d+)\s+U:(\d+)\s+NA:(\d+)\b/g,
      "Secure: $1 · Developing: $2 · Needs support: $3 · Unscored: $4 · Not checked: $5"
    )
    .replace(/\bBOY\b/g, "Beginning of year")
    .replace(/\bMOY\b/g, "Middle of year")
    .replace(/\bEOY\b/g, "End of year")
    .replace(/\bChecks\b/g, "Assessments")
    .replace(/\bCheck\b/g, "Assessment")
    .replace(/\bchecks\b/g, "assessments")
    .replace(/\bcheck\b/g, "assessment")
    .replace(/\bChildren\b/g, "Students")
    .replace(/\bChild\b/g, "Student")
    .replace(/\bchildren\b/g, "students")
    .replace(/\bchild\b/g, "student")
    .replace(/\bEvidence\b/g, "Results")
    .replace(/\bevidence\b/g, "results")
    .replace(/\bLearners\b/g, "Students")
    .replace(/\bLearner\b/g, "Student")
    .replace(/\blearners\b/g, "students")
    .replace(/\blearner\b/g, "student")
    .replace(/\bProvenance\b/g, "Source details")
    .replace(/\bprovenance\b/g, "source details")
    .replace(/\bScope\b/g, "Period")
    .replace(/\bscope\b/g, "period")
    .replace(/\bPolicy\b/g, "Fairness rule")
    .replace(/\bpolicy\b/g, "fairness rule")
    .replace(/\bLogin\b/g, "Sign-in")
    .replace(/\blogin\b/g, "sign-in")
    .replace(/\bCumulative\b/g, "All saved")
    .replace(/\bcumulative\b/g, "all saved")
    .replace(/\bBaseline\b/g, "Starting point")
    .replace(/\bbaseline\b/g, "starting point")
    .replace(/\bAdministration\b/g, "Assessment")
    .replace(/\badministration\b/g, "assessment")
    .replace(/\bNot assessed(?: yet)?\b/g, "Not checked")
    .replace(/\bNot checked yet\b/g, "Not checked")
    .replace(/\bIncorrect\b/g, "Needs another look")
    .replace(/(\d+)\s*\/\s*(\d+)/g, "$1 of $2");

  if (/^[a-z0-9]+(?:[_-][a-z0-9]+)+$/.test(mapped.trim())) {
    return mapped
      .replace(/[_-]+/g, " ")
      .replace(/^\w/, letter => letter.toUpperCase());
  }
  return mapped;
}

export function applyTeacherFacingWorkbookCopy(workbook) {
  workbook.worksheets.forEach(sheet => {
    const internalColumns = [];
    sheet.getRow(1).eachCell((cell, columnNumber) => {
      if (INTERNAL_EXPORT_COLUMN.test(String(cell.value || ""))) {
        internalColumns.push(columnNumber);
      }
    });
    internalColumns.sort((a, b) => b - a).forEach(columnNumber => {
      sheet.spliceColumns(columnNumber, 1);
    });
    const internalRows = [];
    sheet.eachRow((row, rowNumber) => {
      if (INTERNAL_EXPORT_ROW.test(String(row.getCell(1).value || "").trim())) {
        internalRows.push(rowNumber);
      }
    });
    internalRows.sort((a, b) => b - a).forEach(rowNumber => {
      sheet.spliceRows(rowNumber, 1);
    });
    sheet.eachRow(row => {
      row.eachCell(cell => {
        if (typeof cell.value === "string") cell.value = teacherExportCopy(cell.value);
      });
    });
    sheet.name = teacherExportCopy(sheet.name).slice(0, 31);
  });
  return workbook;
}

function elEvidenceWindow(report = {}) {
  const start = report.reportingPeriods?.descriptiveResults?.start || report.dateRange?.start || "";
  const end = report.reportingPeriods?.descriptiveResults?.end || report.dateRange?.end || "";
  if (start && end) return start === end ? start : `${start} to ${end}`;
  return report.assessmentWindow || "";
}

export function buildElExportProvenanceRows(report = {}, reportType = report.reportType) {
  const isIndividual = reportType === "individual";
  const learnerCount = isIndividual ? 1 : (
    report.summary?.totalStudents || report.studentRows?.length || null
  );
  const descriptivePeriod = report.reportingPeriods?.descriptiveResults || {};
  const currentPeriod = report.reportingPeriods?.currentConclusions || {};
  const descriptiveDates = [descriptivePeriod.start, descriptivePeriod.end]
    .filter(Boolean)
    .join(" to ");
  const currentDates = [currentPeriod.start, currentPeriod.end]
    .filter(Boolean)
    .join(" to ");
  return buildExportProvenanceRows({
    reportTitle: isIndividual ? "Student EL assessment report" : "Class EL assessment report",
    schoolName: report.schoolName,
    className: report.className,
    learnerName: isIndividual ? report.studentName : "",
    learnerId: isIndividual ? report.studentId : "",
    learnerCount,
    generatedAt: report.generatedAt,
    timeZone: report.timeZone,
    filters: {
      ...(report.selectedDatePeriod?.label
        ? { "Class report date period": report.selectedDatePeriod.label }
        : {}),
      "EL assessment period": displayBenchmarkScopeLabel(
        report.benchmarkScope,
        "No assessment period selected"
      ),
      "Descriptive results included": [
        descriptivePeriod.label || report.assessmentWindow || "All included results",
        descriptiveDates
      ].filter(Boolean).join(" — "),
      "Current status window": [
        currentPeriod.label || `Latest ${LEARNING_EVIDENCE_POLICY.recency.conclusionWindowDays} days`,
        currentDates
      ].filter(Boolean).join(" — "),
      ...(Array.isArray(report.evidenceSourceReads)
        ? {
            "Saved result sources": report.evidenceSourceReads
              .map(source => `${source.store} (${source.recordCount} row(s))`)
              .join("; "),
            "Latest saved-result update": report.evidenceSourceReads
              .map(source => source.lastSyncedAt)
              .filter(Boolean)
              .sort()
              .at(-1) || "Sync time unavailable"
          }
        : {})
    },
    evidenceWindow: elEvidenceWindow(report),
    evidenceSource: report.sourceSnapshot?.records || [],
    versionSummary: report.exportVersionSummary,
    definitions: [
      `Definitions are included in the ${METRIC_DEFINITIONS_SHEET_NAME} sheet.`,
      `Secure, Developing and Needs support use results from the latest ${LEARNING_EVIDENCE_POLICY.recency.conclusionWindowDays} days.`,
      "The selected EL benchmark period remains descriptive and does not use a pass mark."
    ].join(" ")
  });
}

export async function createStudentElAssessmentWorkbook(report, { teacherFacing = false } = {}) {
  const workbook = await createWorkbook(report?.generatedAt);

  const summarySheet = workbook.addWorksheet("Student Summary");
  setColumns(summarySheet, ["Field", "Value"], ["Value"]);
  buildStudentElSummaryRows(report)
    .forEach(row => summarySheet.addRow({ Field: row[0], Value: row[1] }));
  if (getStudentElReportEvidenceCount(report) === 0) {
    const bannerRow = summarySheet.getRow(2);
    bannerRow.eachCell(cell => {
      cell.font = { bold: true, color: { argb: EXPORT_COLORS.navy } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: EXPORT_COLORS.amberSoft }
      };
    });
    addExportProvenanceWorksheet(workbook, buildElExportProvenanceRows(report, "individual"));
    addMetricDefinitionsWorksheet(workbook, { generatedAt: report?.generatedAt });
    applyWorkbookPresentation(workbook, EL_EMPTY_STUDENT_REPORT_SHEETS);
    return teacherFacing ? applyTeacherFacingWorkbookCopy(workbook) : workbook;
  }

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
    "Uppercase name result": "Not checked",
    "Uppercase sound result": "Not checked",
    "Lowercase name result": "Not checked",
    "Lowercase sound result": "Not checked",
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
    "Reading / recognition result": "Not checked",
    "Sound result": "Not checked",
    "Evidence items": 0,
    "Unscored evidence items": 0,
    "Attempts": 0,
    "Correct": 0,
    "Incorrect": 0,
    "Accuracy": "",
    "Status": "Not checked",
    "Example words": "",
    "Last assessed": "",
    "Evidence provenance": ""
  });

  addStudentBenchmarkSheets(workbook, report);
  addExportProvenanceWorksheet(workbook, buildElExportProvenanceRows(report, "individual"));
  addMetricDefinitionsWorksheet(workbook, { generatedAt: report?.generatedAt });

  applyWorkbookPresentation(workbook, EL_STUDENT_REPORT_SHEETS);
  return teacherFacing ? applyTeacherFacingWorkbookCopy(workbook) : workbook;
}

export async function createClassElAssessmentWorkbook(report, { teacherFacing = false } = {}) {
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
    "Not enough result students",
    "Unscored evidence students",
    "Mastered students",
    "Developing students",
    "Needs support students",
    "Not checked students",
    "Mastery percentage",
    "Students needing support",
    "Students with not enough results",
    "Students with unscored evidence",
    "Evidence provenance"
  ], [
    "Students needing support",
    "Students with not enough results",
    "Students with unscored evidence",
    "Evidence provenance"
  ]);
  addRowsOrEmpty(classAdvancedMatrixSheet, report.formalAssessments?.classAdvancedPhonicsMatrix || [], row => row ? {
    "Pattern": row.pattern,
    "Students with evidence": row.evidenceStudents || 0,
    "Attempted students": row.attemptedStudents,
    "Not enough result students": row.notEnoughResultsStudents || 0,
    "Unscored evidence students": row.unscoredEvidenceStudents || 0,
    "Mastered students": row.masteredStudents,
    "Developing students": row.developingStudents,
    "Needs support students": row.needsSupportStudents,
    "Not checked students": row.notAssessedStudents,
    "Mastery percentage": row.masteryPercentage == null ? "" : `${row.masteryPercentage}%`,
    "Students needing support": list(row.studentsNeedingSupport),
    "Students with not enough results": list(row.studentsWithNotEnoughResults),
    "Students with unscored evidence": list(row.studentsWithUnscoredEvidence),
    "Evidence provenance": formalEvidenceList(decodeClassEvidenceRows(report, row.evidenceRows), { includeStudent: true })
  } : {
    "Pattern": "No Advanced Phonics Patterns records yet",
    "Students with evidence": 0,
    "Attempted students": 0,
    "Not enough result students": 0,
    "Unscored evidence students": 0,
    "Mastered students": 0,
    "Developing students": 0,
    "Needs support students": 0,
    "Not checked students": 0,
    "Mastery percentage": "",
    "Students needing support": "",
    "Students with not enough results": "",
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
  return teacherFacing ? applyTeacherFacingWorkbookCopy(workbook) : workbook;
}

export function buildStudentElAssessmentExportReport(options = {}) {
  const assessmentHistory = filterElAssessmentHistory(options.assessmentHistory);
  const evidenceRead = buildStudentAssessmentEvidenceReadModel({
    student: (Array.isArray(options.students) ? options.students : [])
      .find(row => row?.id === options.studentId) || { id: options.studentId },
    studentId: options.studentId,
    assessmentHistory: options.assessmentHistory,
    localAssessmentHistory: options.localAssessmentHistory,
    cloudAssessmentHistory: options.cloudAssessmentHistory,
    itemMastery: options.itemMastery,
    skillMasterySummary: options.skillMasterySummary,
    evidenceReadState: options.evidenceReadState,
    now: options.now
  });
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
    benchmarkWindow: options.benchmarkWindow,
    now: options.now || report.generatedAt
  });
  return {
    ...report,
    evidenceSourceReads: evidenceRead.sourceReads,
    evidenceReadCompletedAt: evidenceRead.completedAt,
    formalAssessments: mergeSkillsCheckLettersIntoFormalAssessment(
      formalAssessments,
      evidenceRead.skillsCheck,
      options.now || report.generatedAt
    ),
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
    benchmarkWindow: options.benchmarkWindow,
    now: options.now || report.generatedAt
  });
  return {
    ...report,
    formalAssessments,
    benchmarkMatrix: formalAssessments.classBenchmarkMatrix || [],
    benchmarkDomainSummaries: formalAssessments.classBenchmarkDomainSummaries || [],
    benchmarkDetails: formalAssessments.classBenchmarkDetails || []
  };
}

export function hasResolvedElExportScope(report = {}) {
  return normalizeElExportScope(report.benchmarkScope).isRouteScoped;
}

function assertResolvedElExportScope(report = {}) {
  if (hasResolvedElExportScope(report)) return;
  const error = new Error("Choose a grade and time of year before downloading this EL report.");
  error.code = "EL_EXPORT_SCOPE_REQUIRED";
  throw error;
}

function safeElAssessmentFileName(fileName = "", fallback = "el-assessment-report.xlsx") {
  const cleaned = String(fileName || fallback)
    .replace(/grade[-_\s]*not[-_\s]*recorded/gi, "scope-required")
    .replace(/window[-_\s]*not[-_\s]*recorded/gi, "")
    .replace(/-{2,}/g, "-")
    .replace(/-+(\.xlsx)$/i, "$1");
  return cleaned || fallback;
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
  assertResolvedElExportScope(report);

  // The teacher gets the SIMPLE workbook — two sheets, read in thirty seconds.
  //
  // createStudentElAssessmentWorkbook (above) is unchanged and still backs the
  // class report and the saved-report re-download; its detail is what an
  // intervention meeting or a records request needs. It is simply no longer
  // what a kindergarten teacher gets when they press Download. That version had
  // a 27-column sheet with 25 columns repeating one sentence on every row, two
  // 42-column sheets containing nothing but "No saved results", and
  // "assessment_attempts: 13 row(s)" printed where a teacher could read it.
  //
  // The report object is identical either way — same hydration, same scope
  // assertion, same persistence. Only the presentation changed.
  const { exportSimpleElAssessmentExcel } = await import("./exportElAssessmentSimple.js");
  await exportSimpleElAssessmentExcel(report, {
    studentName: report.studentName || "Student",
    className: report.className || "",
    scopeLabel: report.benchmarkScope?.label || "",
    generatedAt: report.generatedAt instanceof Date
      ? report.generatedAt
      : new Date(report.generatedAt || Date.now())
  });

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
  const workbook = await createClassElAssessmentWorkbook(report, { teacherFacing: true });
  await downloadWorkbook(workbook, report.fileName);
  report.persistence = await saveElAssessmentReport(report, options);
  return report;
}

export async function downloadElAssessmentReport(report = {}) {
  const workbook = report.reportType === "individual"
    ? await createStudentElAssessmentWorkbook(report, { teacherFacing: true })
    : await createClassElAssessmentWorkbook(report, { teacherFacing: true });
  await downloadWorkbook(
    workbook,
    safeElAssessmentFileName(
      report.fileName,
      `el-assessment-report-${formatDate(new Date())}.xlsx`
    )
  );
  return report;
}

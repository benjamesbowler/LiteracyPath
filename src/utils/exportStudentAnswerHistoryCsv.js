import { buildMetricDefinitionCsvRows } from "./metricDefinitions.js";
import {
  buildPresetExportProvenanceRows,
  exportProvenanceCsvPreamble
} from "./exportProvenance.js";

function formatExportValue(value) {
  if (Array.isArray(value)) return value.map(formatExportValue).filter(Boolean).join(" | ");
  if (value && typeof value === "object") {
    if (value.word) return formatExportValue(value.word);
    if (value.label) return formatExportValue(value.label);
    if (value.text) return formatExportValue(value.text);
    return JSON.stringify(value);
  }
  return String(value ?? "");
}

function buildQuestionExportText(item = {}) {
  return [formatExportValue(item.passage), formatExportValue(item.question || item.prompt)]
    .filter(Boolean)
    .join(" ");
}

function downloadCsv(csv, filename) {
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function exportStudentAnswerHistoryCsv({
  answerHistory = [],
  className = "",
  coverageSnapshot = {},
  generatedAt = new Date(),
  skillTree = [],
  studentId = "",
  studentName = ""
} = {}) {
  const safeName = (studentName || "Unnamed student")
    .replace(/[^a-z0-9]/gi, "_")
    .toLowerCase();
  const rows = [[
    "Date",
    "Student",
    "Skill",
    "Coverage Level 1",
    "Coverage Level 2",
    "Coverage Total",
    "Diagnostic Target",
    "Question",
    "Student Answer",
    "Correct Answer",
    "Result"
  ]];
  const formatCoveragePart = part => part?.total ? `${part.mastered || 0} of ${part.total}` : "";

  answerHistory.forEach(item => {
    const skillId = item.skillId
      || skillTree.find(stage => stage.label === (item.stage || item.skill))?.id
      || "";
    const coverage = coverageSnapshot?.[skillId] || {};
    rows.push([
      formatExportValue(item.date),
      studentName || "Unnamed student",
      formatExportValue(item.stage || item.skill),
      formatCoveragePart(coverage.level1),
      formatCoveragePart(coverage.level2),
      coverage.total ? `${coverage.mastered || 0} of ${coverage.total}` : "",
      formatExportValue(item.diagnosticTarget),
      buildQuestionExportText(item),
      formatExportValue(item.chosen),
      formatExportValue(item.correct),
      item.isCorrect ? "Correct" : "Needs another look"
    ]);
  });

  rows.push(...buildMetricDefinitionCsvRows());
  const dataRows = rows.map(row => row
    .map(cell => `"${String(cell).replaceAll('"', '""')}"`)
    .join(","));
  const provenance = buildPresetExportProvenanceRows("reading-csv", {
    className,
    learnerName: studentName || "Unnamed student",
    learnerId: studentId,
    generatedAt,
    evidenceSource: answerHistory
  });
  const csv = [
    exportProvenanceCsvPreamble(provenance),
    "",
    ...dataRows
  ].join("\n");
  downloadCsv(csv, `${safeName}_reading_data_${generatedAt.toISOString().slice(0, 10)}.csv`);
  return csv;
}

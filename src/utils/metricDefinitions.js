export const METRIC_DEFINITIONS_SHEET_NAME = "Metric Definitions";

export const METRIC_DEFINITIONS = Object.freeze({
  accuracy: Object.freeze({
    id: "accuracy",
    label: "Accuracy",
    definition: "Correct scored responses divided by administered scored responses, multiplied by 100.",
    denominator: "Administered responses that have a scored correct or incorrect result.",
    dateRange: "All saved evidence in the selected learner, class, assessment, or report scope unless a shorter range is named.",
    minimumEvidence: "At least one administered scored response. Attention flags require at least eight responses."
  }),
  mastered: Object.freeze({
    id: "mastered",
    label: "Mastered",
    definition: "Skills or items whose saved evidence meets the app's mastery rule; practice exposure alone cannot create mastery.",
    denominator: "All skills or items in the curriculum scope shown beside the figure.",
    dateRange: "All saved scored evidence in the selected scope.",
    minimumEvidence: "The mastery rule for that skill or item must be met; a single practice exposure is not sufficient."
  }),
  active: Object.freeze({
    id: "active",
    label: "Active",
    definition: "A learner with saved answer activity or synced Sound Seekers activity in the stated period.",
    denominator: "Active roster learners in the selected class.",
    dateRange: "The teacher's local calendar day when the figure says today; otherwise the period named beside the figure.",
    minimumEvidence: "At least one saved answer or synced Sound Seekers activity event in the period."
  }),
  started: Object.freeze({
    id: "started",
    label: "Started",
    definition: "A learner with at least one saved response in the literacy assessment or practice record.",
    denominator: "Active roster learners in the selected class.",
    dateRange: "All saved evidence for the selected class.",
    minimumEvidence: "At least one saved response."
  }),
  "current-skill": Object.freeze({
    id: "current-skill",
    label: "Current skill",
    definition: "The first attempted but not yet mastered skill; if none has been attempted, the first unmastered curriculum skill.",
    denominator: "The ordered curriculum skill sequence available to the learner.",
    dateRange: "All saved mastery and attempt evidence for the learner.",
    minimumEvidence: "No evidence is required for the fallback; one saved attempt is required to identify an in-progress skill."
  }),
  trails: Object.freeze({
    id: "trails",
    label: "Trails",
    definition: "Sound Seekers trail stops completed and durably saved for the learner.",
    denominator: "40 authored Sound Seekers trail stops.",
    dateRange: "All durably saved Sound Seekers progress for the learner.",
    minimumEvidence: "At least one durably saved completed trail stop."
  })
});

export function formatMetricUpdateTime(value) {
  if (!value) return "No saved evidence time";
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return "No saved evidence time";
  const pad = number => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function getMetricDefinition(metricId, overrides = {}) {
  const definition = METRIC_DEFINITIONS[metricId];
  if (!definition) return null;
  return {
    ...definition,
    ...overrides,
    id: definition.id,
    label: overrides.label || definition.label,
    updateTime: formatMetricUpdateTime(overrides.updatedAt)
  };
}

export function metricDefinitionText(metricId, overrides = {}) {
  const definition = getMetricDefinition(metricId, overrides);
  if (!definition) return "";
  return [
    `${definition.label}: ${definition.definition}`,
    `Denominator: ${definition.denominator}`,
    `Date range: ${definition.dateRange}`,
    `Minimum evidence: ${definition.minimumEvidence}`,
    `Updated: ${definition.updateTime}`
  ].join(" ");
}

export function buildMetricDefinitionRows({ generatedAt = new Date() } = {}) {
  const exportedAt = formatMetricUpdateTime(generatedAt);
  return Object.values(METRIC_DEFINITIONS).map(definition => ({
    "Metric key": definition.id,
    "Metric": definition.label,
    "Definition": definition.definition,
    "Denominator": definition.denominator,
    "Date range": definition.dateRange,
    "Minimum evidence": definition.minimumEvidence,
    "Update time": "The UI shows the latest saved evidence time, or states when no evidence time exists.",
    "Definitions exported at": exportedAt
  }));
}

export function buildMetricDefinitionCsvRows(options = {}) {
  return [
    [],
    ["Metric Definitions"],
    ["Metric key", "Metric", "Definition", "Denominator", "Date range", "Minimum evidence", "Update time", "Definitions exported at"],
    ...buildMetricDefinitionRows(options).map(row => Object.values(row))
  ];
}

export function buildMetricDefinitionsText(options = {}) {
  return buildMetricDefinitionRows(options)
    .map(row => [
      row["Metric"],
      `Definition: ${row["Definition"]}`,
      `Denominator: ${row["Denominator"]}`,
      `Date range: ${row["Date range"]}`,
      `Minimum evidence: ${row["Minimum evidence"]}`,
      `Update time: ${row["Update time"]}`
    ].join("\n"))
    .join("\n\n");
}

export function addMetricDefinitionsWorksheet(workbook, options = {}) {
  if (!workbook?.addWorksheet) return null;
  const existing = workbook.getWorksheet?.(METRIC_DEFINITIONS_SHEET_NAME);
  if (existing) return existing;
  const sheet = workbook.addWorksheet(METRIC_DEFINITIONS_SHEET_NAME);
  const rows = buildMetricDefinitionRows(options);
  const headers = Object.keys(rows[0] || {});
  sheet.columns = headers.map(header => ({
    header,
    key: header,
    width: ["Definition", "Denominator", "Date range", "Minimum evidence", "Update time"].includes(header)
      ? 48
      : 24
  }));
  rows.forEach(row => sheet.addRow(row));
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFEFF6FF" }
  };
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  return sheet;
}

export async function createDefinedExcelWorkbook(importWithRetry) {
  const module = await importWithRetry(() => import("exceljs"));
  const ExcelJS = module.default || module["module.exports"] || module;
  if (!ExcelJS?.Workbook) throw new Error("ExcelJS workbook export is unavailable.");
  const workbook = new ExcelJS.Workbook();
  addMetricDefinitionsWorksheet(workbook, { generatedAt: new Date() });
  return workbook;
}

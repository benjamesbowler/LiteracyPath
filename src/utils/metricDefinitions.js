export const METRIC_DEFINITIONS_SHEET_NAME = "How figures are worked out";

export const METRIC_DEFINITIONS = Object.freeze({
  accuracy: Object.freeze({
    id: "accuracy",
    label: "Accuracy",
    counts: "Correct scored answers out of all scored answers, shown as a percentage.",
    timeWindow: "All saved answers in the selected child, class, check, or report unless a shorter period is shown.",
    excludes: "Unscored answers and groups too small for a fair result."
  }),
  mastered: Object.freeze({
    id: "mastered",
    label: "Mastered",
    counts: "Skills whose saved results meet the mastery rule.",
    timeWindow: "All saved scored answers in the selected view.",
    excludes: "Practice seen once and skills that have not met the mastery rule."
  }),
  active: Object.freeze({
    id: "active",
    label: "Active",
    counts: "Children with a saved answer or saved Sound Seekers play.",
    timeWindow: "Today when the figure says today; otherwise the period shown beside it.",
    excludes: "Children without saved activity in that period."
  }),
  started: Object.freeze({
    id: "started",
    label: "Started",
    counts: "Children with at least one saved answer.",
    timeWindow: "All saved activity for the selected class.",
    excludes: "Children with no saved answers."
  }),
  "current-skill": Object.freeze({
    id: "current-skill",
    label: "Current skill",
    counts: "The first tried skill not yet mastered, or the first skill still to learn.",
    timeWindow: "All saved attempts and mastered skills for the child.",
    excludes: "Skills already mastered and skills later in the teaching order."
  }),
  trails: Object.freeze({
    id: "trails",
    label: "Trails",
    counts: "Sound Seekers trail stops completed and saved.",
    timeWindow: "All saved Sound Seekers progress for the child.",
    excludes: "Stops that were opened but not completed and saved."
  })
});

export function formatMetricUpdateTime(value) {
  if (!value) return "No saved time";
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return "No saved time";
  const pad = number => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function getMetricDefinition(metricId, overrides = {}) {
  const definition = METRIC_DEFINITIONS[metricId];
  if (!definition) return null;
  const counts = overrides.counts
    || overrides.definition
    || overrides.denominator
    || definition.counts;
  const timeWindow = overrides.timeWindow
    || overrides.dateRange
    || definition.timeWindow;
  const excludes = overrides.excludes
    || overrides.minimumEvidence
    || definition.excludes;
  return {
    ...definition,
    ...overrides,
    id: definition.id,
    label: overrides.label || definition.label,
    counts,
    timeWindow,
    excludes,
    updateTime: formatMetricUpdateTime(overrides.updatedAt)
  };
}

export function metricDefinitionText(metricId, overrides = {}) {
  const definition = getMetricDefinition(metricId, overrides);
  if (!definition) return "";
  return [
    `${definition.label}.`,
    `Counts: ${definition.counts}`,
    `Time: ${definition.timeWindow}`,
    `Excludes: ${definition.excludes}`
  ].join(" ");
}

export function buildMetricDefinitionRows({ generatedAt = new Date() } = {}) {
  const exportedAt = formatMetricUpdateTime(generatedAt);
  return Object.values(METRIC_DEFINITIONS).map(definition => ({
    "Figure key": definition.id,
    "Figure": definition.label,
    "Counts": definition.counts,
    "Time": definition.timeWindow,
    "Excludes": definition.excludes,
    "Guide exported at": exportedAt
  }));
}

export function buildMetricDefinitionCsvRows(options = {}) {
  return [
    [],
    [METRIC_DEFINITIONS_SHEET_NAME],
    ["Figure key", "Figure", "Counts", "Time", "Excludes", "Guide exported at"],
    ...buildMetricDefinitionRows(options).map(row => Object.values(row))
  ];
}

export function buildMetricDefinitionsText(options = {}) {
  return buildMetricDefinitionRows(options)
    .map(row => [
      row["Figure"],
      `Counts: ${row.Counts}`,
      `Time: ${row.Time}`,
      `Excludes: ${row.Excludes}`
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
    width: ["Counts", "Time", "Excludes"].includes(header) ? 48 : 24
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

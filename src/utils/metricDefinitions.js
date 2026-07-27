export const METRIC_DEFINITIONS_SHEET_NAME = "How figures are worked out";

export const METRIC_DEFINITIONS = Object.freeze({
  accuracy: Object.freeze({
    id: "accuracy",
    label: "Accuracy",
    counts: "Correct scored answers out of all scored answers, shown as a percentage. A high score on very few answers does not mean it is secure yet — check the status word beside it.",
    timeWindow: "All saved answers in the selected student, class, check, or report unless a shorter period is shown.",
    excludes: "Unscored answers and groups too small for a fair result."
  }),
  mastered: Object.freeze({
    id: "mastered",
    label: "Secure",
    counts: "The student was right at least 4 times, on two different days, in two different kinds of question. Being right 3 times in one sitting is a great start, but it is not secure yet.",
    timeWindow: "Their recent answers, within the last 90 days.",
    excludes: "Practice games played on their own, answers given with help on screen, and anything older than 90 days."
  }),
  practising: Object.freeze({
    id: "practising",
    label: "Practising",
    counts: "The student is getting this right, but not yet often enough, or not yet on enough different days, for us to call it secure.",
    timeWindow: "Their recent answers, within the last 90 days.",
    excludes: "Answers given with help on screen."
  }),
  "needs-teaching": Object.freeze({
    id: "needs-teaching",
    label: "Needs teaching",
    counts: "The student got this right less than 70% of the time, across at least 3 tries. This one needs teaching.",
    timeWindow: "Their recent answers, within the last 90 days.",
    excludes: "Items with fewer than 3 tries — those show as Not enough yet, which is not a worry."
  }),
  "not-enough-yet": Object.freeze({
    id: "not-enough-yet",
    label: "Not enough yet",
    counts: "Fewer than 3 answers so far, or the only answers we have are old, or the student had help. This is not a low score — we just cannot say either way yet.",
    timeWindow: "All saved answers for this item.",
    excludes: "Nothing. It means there is not enough to judge, not that the student did badly."
  }),
  round: Object.freeze({
    id: "round",
    label: "Round",
    counts: "Answers correct so far in this round only. It resets when a new round starts.",
    timeWindow: "The current round.",
    excludes: "Everything before this round. This is not progress towards mastery."
  }),
  "el-placement": Object.freeze({
    id: "el-placement",
    label: "Provisional placement",
    counts: "What the student did on this benchmark check, described as it happened.",
    timeWindow: "The most recent completed check.",
    excludes: "There is no pass mark for this check, so we will not turn it into mastered or secure. Use it alongside what you see in class, then confirm the placement yourself."
  }),
  active: Object.freeze({
    id: "active",
    label: "Active",
    counts: "Students with a saved answer or saved Sound Seekers play.",
    timeWindow: "Today when the figure says today; otherwise the period shown beside it.",
    excludes: "Students without saved activity in that period."
  }),
  started: Object.freeze({
    id: "started",
    label: "Started",
    counts: "Students with at least one saved answer.",
    timeWindow: "All saved activity for the selected class.",
    excludes: "Students with no saved answers."
  }),
  "current-skill": Object.freeze({
    id: "current-skill",
    label: "Current skill",
    counts: "Where the student is in the teaching order — 30 skills, in sequence. \"2 of 30\" means they are working on skill number 2. It is a position, not a score: it does not mean 2 skills are finished.",
    timeWindow: "All saved attempts and secure skills for the student.",
    excludes: "Skills already secure and skills later in the teaching order."
  }),
  trails: Object.freeze({
    id: "trails",
    label: "Trails",
    counts: "Sound Seekers trail stops completed and saved.",
    timeWindow: "All saved Sound Seekers progress for the student.",
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

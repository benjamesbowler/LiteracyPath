export const REPORT_PROVENANCE_SHEET_NAME = "About this report";

export const REPORT_PRIVACY_CLASSIFICATION =
  "CONFIDENTIAL — student educational record — authorised school staff only";

export const REPORT_LEARNER_ID_POLICY =
  "Internal student IDs are not included in teacher or family downloads.";

const VERSION_KEYS = Object.freeze({
  appVersions: new Set(["appVersion"]),
  assessmentVersions: new Set(["assessmentVersion", "formVersion"]),
  contentVersions: new Set(["contentVersion"]),
  policyVersions: new Set([
    "policyVersion",
    "scoringVersion",
    "scoringRuleVersion",
    "administrationVersion"
  ])
});

function cleanText(value) {
  return String(value ?? "").trim();
}

function uniqueSorted(values = []) {
  return Array.from(new Set(values.map(cleanText).filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

function addVersion(summary, key, value) {
  Object.entries(VERSION_KEYS).forEach(([bucket, keys]) => {
    if (keys.has(key)) summary[bucket].push(value);
  });
}

export function buildExportVersionSummary(source = []) {
  const summary = {
    appVersions: [],
    assessmentVersions: [],
    contentVersions: [],
    policyVersions: []
  };
  const seen = new WeakSet();
  const visit = value => {
    if (!value || typeof value !== "object") return;
    if (seen.has(value)) return;
    seen.add(value);
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    Object.entries(value).forEach(([key, child]) => {
      if (typeof child === "string" || typeof child === "number") addVersion(summary, key, child);
      else visit(child);
    });
  };
  visit(source);
  return Object.fromEntries(
    Object.entries(summary).map(([key, values]) => [key, uniqueSorted(values)])
  );
}

export function mergeExportVersionSummaries(...summaries) {
  return Object.fromEntries(
    Object.keys(VERSION_KEYS).map(key => [
      key,
      uniqueSorted(summaries.flatMap(summary => summary?.[key] || []))
    ])
  );
}

function sourceDates(source = []) {
  const dates = [];
  const seen = new WeakSet();
  const visit = value => {
    if (!value || typeof value !== "object") return;
    if (seen.has(value)) return;
    seen.add(value);
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    [
      "completedAt",
      "startedAt",
      "observedAt",
      "timestamp",
      "date",
      "createdAt"
    ].forEach(key => {
      const candidate = value[key];
      if (!candidate) return;
      const date = new Date(candidate);
      if (Number.isFinite(date.getTime())) dates.push(date.toISOString());
    });
    Object.values(value).forEach(visit);
  };
  visit(source);
  return uniqueSorted(dates);
}

export function deriveExportEvidenceWindow(source = []) {
  const dates = sourceDates(source);
  if (!dates.length) return "No dated results included";
  return dates.length === 1 ? dates[0] : `${dates[0]} to ${dates.at(-1)}`;
}

export function resolveExportTimeZone(value = "") {
  if (cleanText(value)) return cleanText(value);
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

function versionSetChecksum(values) {
  let hash = 0x811c9dc5;
  for (const character of values.join("\u001f")) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function versionLabel(values, fallback) {
  const versions = uniqueSorted(values);
  if (!versions.length) return fallback;
  if (versions.length <= 24) return versions.join(", ");
  return `${versions.length} versions included (reference ${versionSetChecksum(versions)}).`;
}

function filterLabel(filters) {
  if (!filters) return "No additional filters";
  if (typeof filters === "string") return cleanText(filters) || "No additional filters";
  if (Array.isArray(filters)) return filters.map(cleanText).filter(Boolean).join("; ") || "No additional filters";
  if (typeof filters === "object") {
    const entries = Object.entries(filters)
      .filter(([, value]) => value !== "" && value !== null && value !== undefined)
      .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`);
    return entries.join("; ") || "No additional filters";
  }
  return cleanText(filters) || "No additional filters";
}

export function buildExportProvenanceRows({
  reportTitle = "Literacy Guide report",
  schoolName = "",
  className = "",
  classNames = [],
  learnerName = "",
  learnerCount = null,
  generatedAt = new Date(),
  timeZone = "",
  filters = "",
  evidenceWindow = "",
  evidenceSource = [],
  versionSummary = null,
  appVersion = "",
  definitions = "",
  privacyClassification = REPORT_PRIVACY_CLASSIFICATION
} = {}) {
  const generatedDate = generatedAt instanceof Date ? generatedAt : new Date(generatedAt);
  if (!Number.isFinite(generatedDate.getTime())) {
    throw new Error("Export provenance generatedAt must be a valid date.");
  }
  const derivedVersions = mergeExportVersionSummaries(
    buildExportVersionSummary(evidenceSource),
    versionSummary,
    appVersion ? { appVersions: [appVersion] } : null
  );
  const coveredClasses = uniqueSorted([className, ...(classNames || [])]);
  const learnerLabel = learnerName || (
    Number.isFinite(Number(learnerCount)) && Number(learnerCount) > 0
      ? `${Number(learnerCount)} ${Number(learnerCount) === 1 ? "student" : "students"}`
      : "Not specified"
  );
  return [
    { field: "Report", value: reportTitle },
    { field: "School / organisation", value: schoolName || "Not recorded by this deployment" },
    { field: "Class", value: coveredClasses.join(", ") || "Not specified" },
    { field: "Student", value: learnerLabel },
    { field: "Generated at", value: generatedDate.toISOString() },
    { field: "Time zone", value: resolveExportTimeZone(timeZone) },
    { field: "Filters", value: filterLabel(filters) },
    {
      field: "Results period",
      value: evidenceWindow || deriveExportEvidenceWindow(evidenceSource)
    },
    {
      field: "App version(s)",
      value: versionLabel(derivedVersions.appVersions, "Local build")
    },
    {
      field: "Assessment version(s)",
      value: versionLabel(derivedVersions.assessmentVersions, "No assessment version details included")
    },
    {
      field: "Content version(s)",
      value: versionLabel(derivedVersions.contentVersions, "No content version details included")
    },
    {
      field: "Scoring version(s)",
      value: versionLabel(derivedVersions.policyVersions, "No scoring version details included")
    },
    {
      field: "Definitions",
      value: definitions || "Definitions are stated alongside the report measures."
    },
    { field: "Privacy classification", value: privacyClassification }
  ];
}

export function addExportProvenanceWorksheet(workbook, rows = []) {
  const sheet = workbook.addWorksheet(REPORT_PROVENANCE_SHEET_NAME);
  sheet.columns = [
    { header: "Field", key: "Field", width: 30 },
    { header: "Value", key: "Value", width: 100 }
  ];
  rows.forEach(row => sheet.addRow({ Field: row.field, Value: row.value }));
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1E3A5F" }
  };
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.eachRow(row => {
    row.alignment = { vertical: "top", wrapText: true };
  });
  return sheet;
}

export function exportProvenanceCsvPreamble(rows = []) {
  const escape = value => `"${String(value ?? "").replaceAll('"', '""')}"`;
  return [
    [escape("Section"), escape("Field"), escape("Value")].join(","),
    ...rows.map(row => [
      escape("About this report"),
      escape(row.field),
      escape(row.value)
    ].join(","))
  ].join("\n");
}

export function exportProvenanceTextBlock(rows = []) {
  return [
    "About this report",
    "",
    ...rows.map(row => `${row.field}: ${row.value}`)
  ].join("\n");
}

const REPORT_PROVENANCE_PRESETS = Object.freeze({
  letter: {
    reportTitle: "Letter name and sound assessment",
    filters: "All recorded letter-name and letter-sound responses",
    definitions: "Knows Name and Knows Sound are teacher-recorded Y/N observations for each uppercase and lowercase letter."
  },
  pattern: {
    reportTitle: "Advanced phonics pattern assessment",
    filters: "All recorded advanced-phonics pattern responses",
    definitions: "Sound Correct and Word Correct are teacher-recorded Y/N observations for each assessed pattern."
  },
  "reading-csv": {
    reportTitle: "Student reading and assessment data",
    filters: "All answer-history rows for the selected student",
    definitions: "Metric definition rows are included in this CSV file."
  },
  "reading-text": {
    reportTitle: "Reading Mastery Report",
    filters: "All answer-history and Guided Reading results for the selected student",
    definitions: "Metric definitions are included in this text report."
  },
  "guided-reading": {
    reportTitle: "Student Guided Reading report",
    filters: "All available Guided Reading records for the selected student",
    definitions: "Marked-word accuracy = words read correctly ÷ marked words; completion and reread totals are derived from saved book progress."
  }
});

export function buildPresetExportProvenanceRows(presetId, context = {}) {
  const preset = REPORT_PROVENANCE_PRESETS[presetId];
  if (!preset) throw new Error(`Unknown report provenance preset: ${presetId}`);
  return buildExportProvenanceRows({
    ...context,
    ...preset,
    learnerCount: 1
  });
}

export function addPresetExportProvenanceWorksheet(workbook, presetId, context = {}) {
  return addExportProvenanceWorksheet(
    workbook,
    buildPresetExportProvenanceRows(presetId, context)
  );
}

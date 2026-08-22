const PARENT_STATUS_COPY = Object.freeze({
  doing_well: Object.freeze({
    label: "Doing well",
    description: "This has been seen clearly in recent learning."
  }),
  growing: Object.freeze({
    label: "Growing",
    description: "This is developing with teaching and practice."
  }),
  not_checked: Object.freeze({
    label: "Not checked yet",
    description: "The school has not shared enough information about this yet."
  })
});

export const PARENT_AREA_BANNED_TERMS = Object.freeze([
  "accuracy",
  "benchmark",
  "class rank",
  "decoding",
  "denominator",
  "mastery",
  "percentile",
  "phoneme",
  "raw score"
]);

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normaliseStatus(status) {
  const key = String(status || "not_checked")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  return PARENT_STATUS_COPY[key] ? key : "not_checked";
}

function normaliseProgressItem(item = {}, index) {
  const status = normaliseStatus(item.status);
  return {
    id: item.id || `progress-${index + 1}`,
    label: item.label || "Reading and writing",
    status,
    statusLabel: PARENT_STATUS_COPY[status].label,
    statusDescription: item.statusDescription || PARENT_STATUS_COPY[status].description,
    detail: item.detail || "The next family update will explain what the school has seen."
  };
}

function normaliseReport(report = {}, index) {
  return {
    id: report.id || `report-${index + 1}`,
    title: report.title || "Reading update",
    publishedLabel: report.publishedLabel || "Date not provided",
    publishedAt: report.publishedAt || "",
    summary: report.summary || "A family-friendly update from school.",
    snapshot: report.snapshot || null
  };
}

export function buildParentAreaModel(input = {}) {
  const learner = input.learner || {};
  if (!learner.id || !learner.name) {
    throw new Error("A linked learner id and name are required for the parent area.");
  }

  const reports = asArray(input.reports)
    .filter(report => report?.releaseState === "released")
    .map(normaliseReport)
    .sort((left, right) => String(right.publishedAt).localeCompare(String(left.publishedAt)));

  return {
    learner: {
      id: learner.id,
      name: learner.name,
      classLabel: learner.classLabel || "Class not shown",
      schoolName: learner.schoolName || "Your school"
    },
    updatedLabel: input.updatedLabel || "No family update yet",
    highlight: input.highlight || `${learner.name} is building reading skills through regular practice.`,
    strengths: asArray(input.strengths).filter(Boolean).slice(0, 4),
    canDo: asArray(input.canDo).filter(Boolean).slice(0, 4),
    nextFocus: asArray(input.nextFocus).filter(Boolean).slice(0, 3),
    meaning: input.meaning || "Short, calm practice and regular reading together will help.",
    progress: asArray(input.progress).slice(0, 6).map(normaliseProgressItem),
    atHome: {
      title: input.atHome?.title || "A short reading routine",
      introduction: input.atHome?.introduction || "Choose one activity and stop while it still feels positive.",
      durationLabel: input.atHome?.durationLabel || "5 to 10 minutes",
      language: input.atHome?.language || "English",
      activities: asArray(input.atHome?.activities).filter(Boolean).slice(0, 5),
      privacyText: input.atHome?.privacyText || "Home practice is not recorded and does not change the school report."
    },
    recentReading: asArray(input.recentReading).filter(Boolean).slice(0, 3),
    reports,
    contact: {
      name: input.contact?.name || "Class teacher",
      email: input.contact?.email || "",
      message: input.contact?.message || "Contact the school if you would like to talk about this update."
    }
  };
}

export function parentAreaDisplayText(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(parentAreaDisplayText).join(" ");
  if (typeof value === "object") return Object.values(value).map(parentAreaDisplayText).join(" ");
  return "";
}

export function lintParentAreaPlainLanguage(value) {
  const text = parentAreaDisplayText(value).toLowerCase();
  return PARENT_AREA_BANNED_TERMS.filter(term => {
    const pattern = new RegExp(`\\b${term.replace(/\s+/g, "\\s+")}\\b`, "i");
    return pattern.test(text);
  });
}

export function parentStatusCopy(status) {
  return PARENT_STATUS_COPY[normaliseStatus(status)];
}

import {
  canonicalStatusId,
  REPORT_STATUS_LABELS,
  REPORT_STATUS_NOTES
} from "../policy/reportingBible.js";
import { FAMILY_COPY } from "../copy/familyCopy.js";

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
  return canonicalStatusId(status);
}

function normaliseProgressItem(item = {}, index) {
  const status = normaliseStatus(item.status);
  return {
    id: item.id || `progress-${index + 1}`,
    label: item.label || "Reading and writing",
    status,
    statusLabel: REPORT_STATUS_LABELS[status],
    statusDescription: item.statusDescription || REPORT_STATUS_NOTES[status],
    detail: item.detail || FAMILY_COPY.parentArea.progressDetail
  };
}

function normaliseReport(report = {}, index) {
  return {
    id: report.id || `report-${index + 1}`,
    title: report.title || FAMILY_COPY.parentArea.reportTitle,
    publishedLabel: report.publishedLabel || FAMILY_COPY.parentArea.reportDate,
    publishedAt: report.publishedAt || "",
    summary: report.summary || FAMILY_COPY.parentArea.reportSummary,
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
    updatedLabel: input.updatedLabel || FAMILY_COPY.parentArea.updatedLabel,
    highlight: input.highlight || FAMILY_COPY.parentArea.highlight.replace("{name}", learner.name),
    strengths: asArray(input.strengths).filter(Boolean).slice(0, 4),
    canDo: asArray(input.canDo).filter(Boolean).slice(0, 4),
    nextFocus: asArray(input.nextFocus).filter(Boolean).slice(0, 3),
    meaning: input.meaning || FAMILY_COPY.parentArea.meaning,
    progress: asArray(input.progress).slice(0, 6).map(normaliseProgressItem),
    atHome: {
      title: input.atHome?.title || FAMILY_COPY.parentArea.atHomeTitle,
      introduction: input.atHome?.introduction || FAMILY_COPY.parentArea.atHomeIntroduction,
      durationLabel: input.atHome?.durationLabel || FAMILY_COPY.parentArea.atHomeDuration,
      language: input.atHome?.language || "English",
      activities: asArray(input.atHome?.activities).filter(Boolean).slice(0, 5),
      privacyText: input.atHome?.privacyText || FAMILY_COPY.parentArea.atHomePrivacy
    },
    recentReading: asArray(input.recentReading).filter(Boolean).slice(0, 3),
    reports,
    contact: {
      name: input.contact?.name || FAMILY_COPY.parentArea.contactName,
      email: input.contact?.email || "",
      message: input.contact?.message || FAMILY_COPY.parentArea.contactMessage
    }
  };
}

export function buildFamilyReportSections(model = {}) {
  const copy = FAMILY_COPY.reportSections;
  const activities = asArray(model.atHome?.activities);
  return [
    { id: "summary_highlight", title: copy.summaryHighlight, description: model.highlight || "", items: [] },
    { id: "what_your_child_can_do", title: copy.childCanDo, description: copy.childCanDoDescription, items: asArray(model.canDo), emptyMessage: copy.noCanDoItems },
    { id: "working_on_next", title: copy.workingOnNext, description: copy.workingOnNextDescription, items: asArray(model.nextFocus), emptyMessage: copy.noNextItems },
    { id: "what_this_means", title: copy.whatThisMeans, description: model.meaning || "", items: [] },
    { id: "what_you_can_do_at_home", title: copy.atHome, description: model.atHome?.introduction || copy.atHomeDescription, items: activities.map(activity => activity.direction || activity.title).filter(Boolean), emptyMessage: copy.noHomeItems },
    { id: "who_to_talk_to", title: copy.whoToTalkTo, description: model.contact?.message || copy.contactDescription, items: [] }
  ];
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
  const id = normaliseStatus(status);
  return { label: REPORT_STATUS_LABELS[id], description: REPORT_STATUS_NOTES[id] };
}

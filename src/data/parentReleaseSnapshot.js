import {
  buildWholeChildAudienceTemplates,
  WHOLE_CHILD_REPORT_AUDIENCES
} from "./reportAudienceTemplates.js";
import { lintParentAreaPlainLanguage } from "./parentAreaModel.js";
import { buildFamilyBridgePlan } from "../utils/familyBridgePlan.js";
import {
  canonicalStatusId,
  REPORT_STATUS_IDS,
  REPORT_STATUS_ORDER
} from "../policy/reportingBible.js";

const DOMAIN_LABELS = Object.freeze({
  alphabet_knowledge: "Letter names and sounds",
  phonological_awareness: "Listening to sounds in words",
  phonics: "Matching letters and sounds",
  decoding: "Reading unfamiliar words",
  encoding: "Spelling words",
  reading_fluency: "Reading aloud smoothly",
  fluency: "Reading aloud smoothly",
  comprehension: "Understanding a text",
  vocabulary: "Learning word meanings",
  language: "Speaking and listening",
  literacy_skill: "Reading and writing"
});

const FAMILY_DOMAIN_IDS = Object.freeze({
  alphabet_knowledge: "letters",
  phonological_awareness: "listening_sounds",
  phonics: "letter_sound_links",
  decoding: "reading_words",
  encoding: "spelling_words",
  reading_fluency: "reading_aloud",
  fluency: "reading_aloud",
  comprehension: "understanding_text",
  vocabulary: "word_meanings",
  language: "speaking_listening",
  literacy_skill: "reading_writing"
});

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function statusId(row = {}) {
  return String(row.status?.id || row.statusId || row.status || "not_checked")
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function parentStatus(rows = []) {
  const statuses = rows.map(row => canonicalStatusId(statusId(row)));
  return REPORT_STATUS_ORDER.find(status => statuses.includes(status))
    || REPORT_STATUS_IDS.NOT_CHECKED;
}

function progressRows(report = {}) {
  const domains = new Map();
  asArray(report.concepts).forEach(row => {
    const id = row.domain || "literacy_skill";
    const current = domains.get(id) || [];
    current.push(row);
    domains.set(id, current);
  });
  return [...domains.entries()].slice(0, 6).map(([id, rows]) => ({
    id: FAMILY_DOMAIN_IDS[id] || FAMILY_DOMAIN_IDS.literacy_skill,
    label: DOMAIN_LABELS[id] || DOMAIN_LABELS.literacy_skill,
    status: parentStatus(rows),
    detail: rows.some(row => statusId(row) !== "not_checked")
      ? "The school has shared a current classroom picture for this area."
      : "The school has not shared enough information about this area yet."
  }));
}

function bridgePlan({ cycleNumber, studentName, language }) {
  try {
    return buildFamilyBridgePlan({ cycleNumber, studentName, language });
  } catch {
    return buildFamilyBridgePlan({ cycleNumber: 1, studentName, language });
  }
}

export function buildParentReleaseSnapshot({
  workspace,
  studentId,
  studentName,
  className,
  schoolName,
  teacherName = "Class teacher",
  teacherEmail = "",
  cycleNumber = 1,
  language = "en"
}) {
  const wholeChild = workspace?.wholeChild || {};
  const family = buildWholeChildAudienceTemplates({
    report: wholeChild,
    studentName,
    className
  })[WHOLE_CHILD_REPORT_AUDIENCES.FAMILY];
  const sections = Object.fromEntries(asArray(family.sections).map(section => [section.id, section]));
  const plan = bridgePlan({ cycleNumber, studentName, language });
  const strengths = asArray(sections.what_your_child_can_do?.items).slice(0, 4);
  const nextFocus = asArray(sections.working_on_next?.items).slice(0, 3);
  const snapshot = {
    schemaVersion: 1,
    learner: {
      id: studentId,
      name: studentName,
      classLabel: className || "Class not shown",
      schoolName: schoolName || "Your school"
    },
    updatedLabel: `Released ${new Date().toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}`,
    highlight: family.description,
    strengths,
    canDo: strengths,
    nextFocus,
    meaning: "The teacher will build these skills in small steps. Short, calm practice at home can help too.",
    progress: progressRows(wholeChild),
    atHome: {
      title: plan.title,
      introduction: plan.note,
      durationLabel: "5 to 10 minutes",
      language,
      activities: plan.activities.map(activity => ({
        moment: `Day ${activity.day}`,
        title: activity.title,
        direction: activity.direction
      })),
      privacyText: plan.privacyText
    },
    contact: {
      name: teacherName,
      email: teacherEmail,
      message: "Contact the class teacher if you would like to talk about this update."
    }
  };
  const issues = lintParentAreaPlainLanguage(snapshot);
  if (issues.length) {
    throw new Error(`The family report contains internal wording: ${issues.join(", ")}`);
  }
  return snapshot;
}

import { FAMILY_COPY } from "../copy/familyCopy.js";

const FAMILY_DOMAIN_LABELS = Object.freeze({
  alphabet_knowledge: "letter names and sounds",
  phonological_awareness: "hearing sounds in words",
  phonics: "matching letters with sounds",
  decoding: "reading words",
  encoding: "spelling words",
  reading_fluency: "reading aloud smoothly",
  fluency: "reading aloud smoothly",
  comprehension: "understanding a text",
  vocabulary: "learning new word meanings",
  language: "using spoken language",
  literacy_skill: "reading and writing"
});

export const WHOLE_CHILD_REPORT_AUDIENCES = Object.freeze({
  TEACHER: "teacher_diagnostic",
  LEADERSHIP: "class_leadership",
  FAMILY: "family_friendly"
});

export const FAMILY_REPORT_BANNED_TERMS = Object.freeze([
  "accuracy",
  "administration",
  "assessment",
  "attempt",
  "benchmark",
  "confidence",
  "currency",
  "decoding",
  "denominator",
  "developing",
  "evidence",
  "fluency",
  "grapheme",
  "mastery",
  "microphase",
  "mixed evidence",
  "needs teaching",
  "phoneme",
  "scoring",
  "secure",
  "status",
  "version"
]);

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function statusId(row = {}) {
  return String(row.status?.id || row.statusId || row.status || "")
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function reportConcepts(report = {}) {
  if (Array.isArray(report.concepts)) return report.concepts;
  return asArray(report.byDomain).flatMap(domain => asArray(domain.concepts || domain.items));
}

function reportDomains(report = {}) {
  const concepts = reportConcepts(report);
  const byDomain = new Map();
  concepts.forEach(row => {
    const domain = row.domain || "literacy_skill";
    const current = byDomain.get(domain) || {
      id: domain,
      label: row.domainLabel || domain.replace(/_/g, " "),
      rows: []
    };
    current.rows.push(row);
    byDomain.set(domain, current);
  });
  return [...byDomain.values()].sort((left, right) => left.label.localeCompare(right.label));
}

function friendlyDomain(domain = "") {
  return FAMILY_DOMAIN_LABELS[domain] || "reading and writing";
}

function uniqueFriendlyDomains(rows = []) {
  return [...new Set(rows.map(row => friendlyDomain(row.domain)).filter(Boolean))];
}

function familyActionForDomain(domain = "") {
  const actions = {
    alphabet_knowledge: "Play a quick letter game. Name a letter, say its sound, and find it in a book.",
    phonological_awareness: "Say two words aloud and listen together for the first, last, or rhyming sounds.",
    phonics: "Build one short word with letters, read it, change one letter, and read the new word.",
    decoding: "Read a short word together. Pause, sound it out, then read the whole word again.",
    encoding: "Say a short word slowly. Ask your child to write the sounds they can hear.",
    reading_fluency: "Take turns reading one short page aloud. Keep the pace calm and celebrate a smooth reread.",
    fluency: "Take turns reading one short page aloud. Keep the pace calm and celebrate a smooth reread.",
    comprehension: "After a short story, ask what happened first and which part helped your child know.",
    vocabulary: "Choose one useful new word, explain it simply, and use it together during the day.",
    language: "Talk about the day in full sentences and ask one follow-up question.",
    literacy_skill: "Read together for ten minutes and praise careful thinking, trying again, and noticing words."
  };
  return actions[domain] || actions.literacy_skill;
}

function templateSource(report = {}) {
  return {
    reportKey: report.reportKey || "whole_child",
    studentId: report.studentId || "",
    evidenceCount: asArray(report.evidence).length,
    conceptCount: reportConcepts(report).length
  };
}

function teacherTemplate({ report, studentName, className }) {
  return {
    id: WHOLE_CHILD_REPORT_AUDIENCES.TEACHER,
    label: "Teacher view",
    title: `${studentName}: teacher view`,
    description: "Detailed results, teaching priorities and saved observations.",
    studentName,
    className,
    source: templateSource(report)
  };
}

function leadershipTemplate({ report, studentName, className }) {
  const concepts = reportConcepts(report);
  const checked = concepts.filter(row => statusId(row) !== "not_checked");
  const priorityIds = new Set(["needs_teaching", "mixed_evidence", "developing"]);
  const priorities = checked.filter(row => priorityIds.has(statusId(row)));
  const domains = reportDomains(report).map(domain => {
    const checkedRows = domain.rows.filter(row => statusId(row) !== "not_checked");
    const priorityRows = checkedRows.filter(row => priorityIds.has(statusId(row)));
    return {
      id: domain.id,
      label: domain.label,
      checked: checkedRows.length,
      total: domain.rows.length,
      priorityCount: priorityRows.length,
      priorityLabels: priorityRows.slice(0, 3).map(row => row.label)
    };
  });
  return {
    id: WHOLE_CHILD_REPORT_AUDIENCES.LEADERSHIP,
    label: "Class and leadership",
    title: "Class and leadership summary",
    description: `A concise support-planning summary for ${studentName}${className ? ` in ${className}` : ""}.`,
    studentName,
    className,
    metrics: [
      {
        label: "Knowledge checked",
        value: `${checked.length} of ${concepts.length}`,
        detail: "Tracked concepts with a current judgment"
      },
      {
        label: "Demonstrated strengths",
        value: checked.filter(row => statusId(row) === "secure").length,
        detail: "Concepts supported by the available record"
      },
      {
        label: "Priority concepts",
        value: priorities.length,
        detail: "Developing, mixed, or needing direct teaching"
      }
    ],
    domains,
    assurances: [
      "No public child rank is shown.",
      "Missing checks remain visible and are not treated as zero.",
      "Practice activity cannot create a secure knowledge judgment by itself."
    ],
    source: templateSource(report)
  };
}

function familyTemplate({ report, studentName }) {
  const concepts = reportConcepts(report);
  const strengths = uniqueFriendlyDomains(
    concepts.filter(row => statusId(row) === "secure")
  );
  const priorityIds = new Set(["needs_teaching", "mixed_evidence", "developing"]);
  const priorityRows = concepts.filter(row => priorityIds.has(statusId(row)));
  const practiceDomains = [...new Set(priorityRows.map(row => row.domain || "literacy_skill"))];
  const nextAreas = practiceDomains.map(friendlyDomain);
  const strengthItems = strengths.length
    ? strengths.slice(0, 4).map(area => `${studentName} is doing well with ${area}.`)
    : [`${studentName} is showing us what they know while we gather a fuller picture.`];
  const nextItems = nextAreas.length
    ? nextAreas.slice(0, 3).map(area => `${studentName} is now working on ${area}.`)
    : [`${studentName} is ready to keep building reading skills through regular practice.`];
  const actionItems = practiceDomains.length
    ? practiceDomains.slice(0, 3).map(familyActionForDomain)
    : [familyActionForDomain("literacy_skill")];

  return {
    id: WHOLE_CHILD_REPORT_AUDIENCES.FAMILY,
    label: "Family update",
    title: `${studentName}’s reading update`,
    description: `This update celebrates ${studentName}’s progress and shares a few useful next steps.`,
    sections: [
      {
        id: "going_well",
        title: FAMILY_COPY.sections.strengths,
        description: "These are reading skills your child has shown in recent learning.",
        items: strengthItems
      },
      {
        id: "practising_next",
        title: FAMILY_COPY.sections.practice,
        description: "We will build these skills in small, supported steps.",
        items: nextItems
      },
      {
        id: "help_together",
        title: "How we can help together",
        description: "Short, friendly practice works best. Stop while it still feels positive.",
        items: actionItems
      }
    ],
    source: templateSource(report)
  };
}

export function familyReportDisplayText(template = {}) {
  return [
    template.title,
    template.description,
    ...asArray(template.sections).flatMap(section => [
      section.title,
      section.description,
      ...asArray(section.items)
    ])
  ].filter(Boolean).join(" ");
}

export function lintFamilyReportPlainLanguage(template = {}) {
  const text = familyReportDisplayText(template);
  const lower = text.toLowerCase();
  const issues = [];
  FAMILY_REPORT_BANNED_TERMS.forEach(term => {
    if (new RegExp(`\\b${term.replace(/\s+/g, "\\s+")}\\b`, "i").test(lower)) {
      issues.push(`Internal term: ${term}`);
    }
  });
  if (/[£$€¥]/u.test(text) || /\b(?:USD|GBP|EUR|CNY|RMB)\b/i.test(text)) {
    issues.push("Currency language");
  }
  text.split(/[.!?]+/).map(sentence => sentence.trim()).filter(Boolean).forEach(sentence => {
    const wordCount = sentence.split(/\s+/).filter(Boolean).length;
    if (wordCount > 24) issues.push(`Sentence over 24 words: ${sentence}`);
  });
  return [...new Set(issues)];
}

export function buildWholeChildAudienceTemplates({
  report = {},
  studentName = "Child",
  className = ""
} = {}) {
  const input = { report, studentName, className };
  return {
    [WHOLE_CHILD_REPORT_AUDIENCES.TEACHER]: teacherTemplate(input),
    [WHOLE_CHILD_REPORT_AUDIENCES.LEADERSHIP]: leadershipTemplate(input),
    [WHOLE_CHILD_REPORT_AUDIENCES.FAMILY]: familyTemplate(input)
  };
}

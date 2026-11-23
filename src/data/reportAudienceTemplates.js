import { buildFamilyReportSections } from "./parentAreaModel.js";
import { FAMILY_COPY } from "../copy/familyCopy.js";
import { canonicalStatusId, REPORT_STATUS_IDS } from "../policy/reportingBible.js";

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

const FAMILY_STRANDS = [
  ["alphabet_knowledge", "letters", "Letter names and sounds"],
  ["phonological_awareness", "listening_sounds", "Listening to sounds in words"],
  ["phonics", "letter_sound_links", "Matching letters and sounds"],
  ["decoding", "reading_words", "Reading unfamiliar words"],
  ["encoding", "spelling_words", "Spelling words"],
  ["reading_fluency", "reading_aloud", "Reading aloud smoothly"],
  ["comprehension", "understanding_text", "Understanding a text"],
  ["vocabulary", "word_meanings", "Learning word meanings"],
  ["language", "speaking_listening", "Speaking and listening"],
  ["literacy_skill", "reading_writing", "Reading and writing"]
];

const FAMILY_PRIORITIES = [
  REPORT_STATUS_IDS.NEEDS_SUPPORT, REPORT_STATUS_IDS.MIXED_EVIDENCE, REPORT_STATUS_IDS.DEVELOPING
];

const FAMILY_CONSTRUCTS = {
  letter_name: ["naming letters", "Point to a letter on a sign and take turns saying its name."],
  letter_sound: ["saying the sounds letters stand for", "Choose a letter and take turns saying its sound."],
  initial_sound: ["hearing the first sound in a word", "Say two words and listen for whether they begin with the same sound."],
  final_sound: ["hearing the last sound in a word", "Say a short word slowly and ask which sound comes last."],
  rhyme_recognition: ["hearing which words rhyme", "Say two words and listen for whether their endings sound alike."],
  cvc_word: ["sounding out short words", "Read a short word by saying each sound, then put the sounds together."],
  short_vowel: ["hearing the middle vowel in a short word", "Read two short words such as mat and met. Listen to how the middle sound changes."],
  digraph: ["reading two letters that make one sound", "Find sh in fish and shop. Say the sound those two letters make together."],
  word_spelling: ["spelling familiar words from their sounds", "Say a short word and have your child write the letters for each sound."]
};

function familyStrandDomain(domain) {
  if (domain === "fluency") return "reading_fluency";
  return FAMILY_STRANDS.some(([key]) => key === domain) ? domain : "literacy_skill";
}

function familyFocus(row) {
  const domain = familyStrandDomain(row.domain);
  const construct = String(row.construct || "").toLowerCase();
  const key = String(row.key || "").toLowerCase();
  if (construct === "grapheme_sound" && ["sh", "ch", "th", "ck", "ng", "wh", "ph"].includes(key)) {
    return [
      `reading the two letters ${key} as one sound`,
      `Find ${key} in a book or on a sign. Say the sound the two letters make together.`
    ];
  }
  if (["letter_name", "letter_sound"].includes(construct) && /^[a-z]$/.test(key)) {
    return construct === "letter_name"
      ? [`naming the letter ${key}`, `Find the letter ${key} in a book. Take turns saying its name.`]
      : [`saying the sound for the letter ${key}`, `Find the letter ${key} in a book. Take turns saying its sound.`];
  }
  return FAMILY_CONSTRUCTS[construct] || [friendlyDomain(domain), familyActionForDomain(domain)];
}

function summarizeFamilyStrands(concepts) {
  const strands = FAMILY_STRANDS.map(([domain, id, label]) => {
    const rows = concepts.filter(row => familyStrandDomain(row.domain) === domain).map(row => {
      const [focus, activity] = familyFocus(row);
      return { status: canonicalStatusId(statusId(row)), focus, activity };
    }).sort((left, right) => left.focus.localeCompare(right.focus) || left.status.localeCompare(right.status));
    const statuses = new Set(rows.map(row => row.status));
    const hasStrength = statuses.has(REPORT_STATUS_IDS.SECURE);
    const hasPriority = FAMILY_PRIORITIES.some(status => statuses.has(status));
    const status = statuses.has(REPORT_STATUS_IDS.MIXED_EVIDENCE) || (hasStrength && hasPriority)
      ? REPORT_STATUS_IDS.MIXED_EVIDENCE
      : [REPORT_STATUS_IDS.NEEDS_SUPPORT, REPORT_STATUS_IDS.DEVELOPING, REPORT_STATUS_IDS.SECURE, REPORT_STATUS_IDS.NOT_ENOUGH_EVIDENCE]
          .find(candidate => statuses.has(candidate)) || REPORT_STATUS_IDS.NOT_CHECKED;
    const detail = hasStrength && hasPriority
      ? "Some parts are going well. Other parts need more practice."
      : status === REPORT_STATUS_IDS.NOT_CHECKED || status === REPORT_STATUS_IDS.NOT_ENOUGH_EVIDENCE
        ? "The school has not shared enough information about this area yet."
        : "The school has shared a current classroom picture for this area.";
    return { id, label, status, detail, rows };
  }).filter(strand => strand.rows.length);
  const checked = strands.filter(strand => strand.status !== REPORT_STATUS_IDS.NOT_CHECKED);
  const unchecked = strands.filter(strand => strand.status === REPORT_STATUS_IDS.NOT_CHECKED);
  const visible = new Set([...checked, ...unchecked].slice(0, 6));
  return strands.filter(strand => visible.has(strand));
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
  const strands = summarizeFamilyStrands(reportConcepts(report));
  const rows = strands.flatMap(strand => strand.rows);
  const priorities = [];
  for (const status of FAMILY_PRIORITIES) {
    for (const row of rows) {
      if (row.status === status && !priorities.some(priority => priority.focus === row.focus)) {
        priorities.push(row);
      }
    }
  }
  const next = priorities.slice(0, 2);
  const practiceFocus = new Set(priorities.map(row => row.focus));
  const strengths = [...new Set(rows.filter(row => (
    row.status === REPORT_STATUS_IDS.SECURE && !practiceFocus.has(row.focus)
  )).map(row => row.focus))].slice(0, 4);
  const strengthItems = strengths.map(area => FAMILY_COPY.reportSections.strengthStatement
    .replace("{name}", () => studentName).replace("{area}", () => area));
  const nextItems = next.map(row => `We're working on ${row.focus}.`);
  const actionItems = next.map(row => row.activity);
  const description = strengthItems[0] || nextItems[0] || FAMILY_COPY.reportSections.noCanDoItems;

  return {
    id: WHOLE_CHILD_REPORT_AUDIENCES.FAMILY,
    label: "Family update",
    title: `${studentName}’s reading update`,
    description,
    progress: strands.map(({ id, label, status, detail }) => ({ id, label, status, detail })),
    sections: buildFamilyReportSections({
      highlight: description,
      canDo: strengthItems,
      nextFocus: nextItems,
      meaning: FAMILY_COPY.reportSections.templateMeaning,
      atHome: {
        introduction: FAMILY_COPY.reportSections.templateHomeIntroduction,
        activities: actionItems.map(direction => ({ direction }))
      },
      contact: {}
    }),
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

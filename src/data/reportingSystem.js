import { normalizeAssessmentAttempt } from "./assessmentHistoryStore.js";
import {
  LEARNING_CONCLUSION_SCOPES,
  LEARNING_EVIDENCE_POLICY,
  LEARNING_POLICY_VERSION,
  LEARNING_STATUS_IDS,
  evaluateClassComparability,
  evaluateLearningConclusion,
  isLearningEvidenceRecent,
  rawLearningStatus
} from "../policy/learningPolicy.js";
import {
  isHfwClozeFormat,
  isHfwSentenceSpellFormat
} from "./hfwAssessmentFormatConfig.js";
import { isHfwSpellingQuestionCandidate } from "./isHfwSpellingQuestion.js";
import { buildSkillsCheckReportModel } from "./studentReportingWorkspaceModel.js";
import {
  assessmentAttemptsToSkillLedger,
  computeSkillStatus,
  SKILL_STATUS_IDS
} from "../policy/skillStatusPolicy.js";

const STATUS_LABELS = {
  on_track: "Secure",
  developing: "Developing",
  needs_support: "Needs support",
  not_enough_evidence: "Not enough results",
  not_started: "Not checked"
};

const DESCRIPTIVE_EL_BENCHMARK_IDS = new Set([
  "el_phonological_awareness",
  "el_encoding",
  "el_decoding",
  "el_oral_reading_fluency"
]);

export function isDescriptiveElBenchmarkRecord(record = {}) {
  return DESCRIPTIVE_EL_BENCHMARK_IDS.has(normalizeKey(
    record.assessmentType || record.assessmentId || record.skillId
  ));
}

const ITEM_TYPE_LABELS = {
  initial_sound: "Initial sound",
  final_sound: "Final sound",
  rhyming_family: "Rhyming family",
  short_vowel: "Short vowel",
  sight_word: "Sight word",
  hfw_context_word: "High-frequency word in a sentence",
  hfw_spelling_word: "High-frequency word spelling",
  phonics_pattern: "Phonics pattern",
  grammar_noun: "Noun",
  grammar_verb: "Verb",
  grammar_adjective: "Adjective",
  letter_name: "Letter name",
  letter_sound: "Letter sound",
  phonological_awareness: "Phonological / phonemic awareness",
  encoding_feature: "Encoding feature",
  decoding_pattern: "Decoding pattern",
  fluency_passage: "Oral reading fluency passage",
  skill_item: "Skill item"
};

const SKILL_AREA_RULES = [
  {
    id: "phonological",
    label: "Phonological Awareness",
    color: "#0f766e",
    match: value => /initial|final|rhym|phonological|phonemic|sound awareness/i.test(value)
  },
  {
    id: "fluency",
    label: "Oral Reading Fluency",
    color: "#b45309",
    match: value => /oral reading fluency|\bfluency\b|wcpm/i.test(value)
  },
  {
    id: "phonics",
    label: "Phonics / Encoding & Decoding",
    color: "#2563eb",
    match: value => /cvc|short vowel|blend|digraph|long vowel|silent e|vowel team|controlled|phonics|pattern|encoding|decoding|spelling/i.test(value)
  },
  {
    id: "hfw",
    label: "High-Frequency Words",
    color: "#d97706",
    match: value => /hfw|high-frequency|sight/i.test(value)
  },
  {
    id: "grammar",
    label: "Grammar",
    color: "#7c3aed",
    match: value => /noun|verb|adjective|preposition|plural|prefix|suffix|grammar/i.test(value)
  }
];

const CLASS_REPORT_SKILL_ORDER = [
  "EL Phonological & Phonemic Awareness",
  "EL Encoding",
  "EL Decoding",
  "EL Oral Reading Fluency",
  "Initial Sounds",
  "Final Sounds",
  "Rhyming",
  "CVC and Short Vowels",
  "Short Vowel Discrimination",
  "Blends",
  "Digraphs",
  "Long Vowels and Silent E",
  "High-Frequency Words 1-25",
  "High-Frequency Words 26-50",
  "High-Frequency Words 51-75",
  "High-Frequency Words 76-100",
  "High-Frequency Words 51-100",
  "Grammar and Language"
];

const CLASS_REPORT_SKILL_ALIASES = [
  { label: "EL: Phonological / Phonemic Awareness", canonical: "EL Phonological & Phonemic Awareness", match: value => /el.*phonological|phonemic awareness/.test(value) },
  { label: "EL: Encoding", canonical: "EL Encoding", match: value => /\bel.*encoding\b|\bencoding assessment\b/.test(value) },
  { label: "EL: Decoding", canonical: "EL Decoding", match: value => /\bel.*decoding\b|\bdecoding assessment\b/.test(value) },
  { label: "EL: Oral Reading Fluency", canonical: "EL Oral Reading Fluency", match: value => /oral reading fluency|\bel.*fluency\b/.test(value) },
  { label: "Initial Sounds", match: value => /initial/.test(value) },
  { label: "Final Sounds", match: value => /final|ending/.test(value) },
  { label: "Rhyming", match: value => /rhym/.test(value) },
  { label: "CVC / Short Vowels", canonical: "CVC and Short Vowels", match: value => /cvc|short vowel/.test(value) && !/discrimination/.test(value) },
  { label: "Short Vowel Discrimination", match: value => /short vowel.*discrimination|discrimination.*short vowel/.test(value) },
  { label: "Blends", match: value => /blend/.test(value) },
  // Word-bounded. Unanchored /ch|sh|th/ matched the substring "th" inside
  // "Theme and Higher Comprehension", so that skill was relabelled "Digraphs"
  // in the class report — two different rows then shared one canonical name,
  // which is also used as a React key, so one of them disappeared.
  { label: "Digraphs", match: value => /digraph|\b(ch|sh|th)\b/.test(value) },
  { label: "Long Vowels / Silent E", canonical: "Long Vowels and Silent E", match: value => /long vowel|silent e/.test(value) },
  { label: "HFW 1-25", canonical: "High-Frequency Words 1-25", match: value => /(hfw|high.frequency|sight).*1.*25|1-25/.test(value) },
  { label: "HFW 26-50", canonical: "High-Frequency Words 26-50", match: value => /(hfw|high.frequency|sight).*26.*50|26-50/.test(value) },
  { label: "HFW 51-75", canonical: "High-Frequency Words 51-75", match: value => /(hfw|high.frequency|sight).*51.*75|51-75/.test(value) },
  { label: "HFW 76-100", canonical: "High-Frequency Words 76-100", match: value => /(hfw|high.frequency|sight).*76.*100|76-100/.test(value) },
  { label: "HFW 51-100", canonical: "High-Frequency Words 51-100", match: value => /(hfw|high.frequency|sight).*51.*100|51-100/.test(value) },
  { label: "Grammar & Language", canonical: "Grammar and Language", match: value => /grammar|language|noun|verb|adjective|preposition/.test(value) }
];

const CLASS_REPORT_GROUP_STYLES = ["red", "amber", "orange", "green"];

export function getSkillArea(skill = {}) {
  const value = `${skill.skillId || skill.id || ""} ${skill.skillName || skill.label || skill.name || ""}`;
  return SKILL_AREA_RULES.find(rule => rule.match(value)) || {
    id: "other",
    label: "Other Literacy",
    color: "#64748b"
  };
}

function normalizeKey(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/^\/|\/$/g, "")
    .replace(/[^a-z0-9']+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function cleanWord(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z']/g, "");
}

function clampPercent(value) {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(100, Math.round(number)));
}

function finiteNumberOrNull(value) {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function average(values = []) {
  const numeric = values.map(Number).filter(Number.isFinite);
  return numeric.length ? clampPercent(numeric.reduce((sum, value) => sum + value, 0) / numeric.length) : 0;
}

function getClassStudentId(student = {}) {
  return student.id || student.studentId || "";
}

function getClassId(student = {}) {
  return student.classId || student.class_id || "";
}

function getClassNameById(classes = [], classId = "", fallback = "") {
  return classes.find(row => row.id === classId)?.name || fallback;
}

function formatSkillForClassReport(skillName = "") {
  const value = String(skillName || "").toLowerCase();
  const alias = CLASS_REPORT_SKILL_ALIASES.find(row => row.match(value));
  return {
    label: alias?.label || skillName || "Assessment",
    canonical: alias?.canonical || alias?.label || skillName || "Assessment"
  };
}

function classReportSkillSortValue(skillName = "") {
  const formatted = formatSkillForClassReport(skillName);
  const index = CLASS_REPORT_SKILL_ORDER.indexOf(formatted.canonical);
  return index === -1 ? CLASS_REPORT_SKILL_ORDER.length : index;
}

function getClassReportStatusId(accuracy = 0, attempts = 0) {
  if (!attempts) return "not_assessed";
  if (attempts < LEARNING_EVIDENCE_POLICY.minimumEvidence.learnerScoredResponses) {
    return "not_enough_evidence";
  }
  const status = rawLearningStatus(accuracy);
  if (status === LEARNING_STATUS_IDS.SECURE) return "mastered";
  if (status === LEARNING_STATUS_IDS.DEVELOPING) return "developing";
  return status === LEARNING_STATUS_IDS.NEEDS_SUPPORT ? "needs_support" : "not_assessed";
}

// The class status of ONE skill, for the Reports skills table. It is the same
// policy the class mastery and focus lists already use — a class-level accuracy
// only becomes a Secure/Developing/Needs support judgement once the class
// comparability check passes. Everything short of that keeps its own name:
// "Not checked" when no student has a scored answer for the skill, and
// "Not enough results" when there are answers but not enough to judge. Neither
// is ever expressed as 0%.
function classReportSkillStatusId({
  attemptedLearnerCount = 0,
  comparable = false,
  classAccuracy = null
} = {}) {
  if (!attemptedLearnerCount) return "not_assessed";
  if (!comparable || classAccuracy === null) return "not_enough_evidence";
  const status = rawLearningStatus(classAccuracy);
  if (status === LEARNING_STATUS_IDS.SECURE) return "mastered";
  if (status === LEARNING_STATUS_IDS.DEVELOPING) return "developing";
  if (status === LEARNING_STATUS_IDS.NEEDS_SUPPORT) return "needs_support";
  return "not_enough_evidence";
}

function getClassReportStatusLabel(statusId = "") {
  if (statusId === "mastered") return "Secure";
  if (statusId === "developing") return "Developing";
  if (statusId === "needs_support") return "Needs support";
  if (statusId === "not_enough_evidence") return "Not enough results";
  return "Not checked";
}

function classAnswerObservationRecords({
  students = [],
  assessmentHistory = [],
  answerHistory = [],
  now = new Date()
} = {}) {
  return students.flatMap(student => {
    const studentId = getClassStudentId(student);
    if (!studentId) return [];
    const report = buildSkillsCheckReportModel({
      student,
      studentId,
      assessmentHistory,
      answerHistory,
      now
    });
    return report.evidence
      .filter(row => (
        row.sourceRecordType === "legacy_answer_history"
        && row.scorable !== false
        && row.statusCandidate
      ))
      .map(row => {
        const correct = row.statusCandidate === "secure";
        const skillId = row.provenance?.skillId || "unclassified_skill";
        return {
          attemptId: row.evidenceId,
          studentId,
          assessmentType: "skill_checkpoint",
          skillId,
          skillName: row.provenance?.skillLabel || skillId,
          completedAt: row.observedAt || "",
          correctCount: Number(correct),
          totalQuestions: 1,
          accuracy: Number(correct) * 100,
          passed: null,
          administrationStatus: "legacy_projection",
          questionRecords: [],
          answerObservation: true,
          incompleteAttemptIdentity: true,
          legacyClassScopeFallback: true,
          evidence: row
        };
      });
  });
}

function getClassReportActivity(point = {}) {
  const label = String(point.label || point.skillName || "").toLowerCase();
  if (/digraph|\b(?:ch|sh|th)\b/.test(label)) return "Multisensory ch/sh/th sort + tracing";
  if (/blend|fl|pl|cl|bl|str/.test(label)) return "Letter tile building: fl, pl, cl, bl, str";
  if (/hfw|high-frequency|sight/.test(label)) return "Word wall rotation + sentence writing";
  if (/rhyme|rhym/.test(label)) return "Build rhyme families with picture cards";
  if (/short vowel|cvc/.test(label)) return "Build and read CVC word chains";
  if (/initial|final/.test(label)) return "Sound sort, say, tap, and mark";
  if (/reading/.test(label)) return "Introduce next-level texts with pre-teaching";
  return point.itemType ? teachingNoteForItem(point) : `Model, guided try, then independent review for ${point.skillName || point.label || "the focus skill"}.`;
}

export function formatReportDate(value) {
  if (!value) return "Not yet";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Not yet";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

// `observedAt` is the completedAt of the newest attempt behind `accuracy`.
//
// This used to pass `requireRecency: false`, so the same child could read Secure
// here and "Not enough results" on the Students page — same policy, same
// evidence, opposite verdict, purely because of how the call was made. The
// reports view is not an all-time view, so it now answers the recency question
// with the evidence's own date like every other conclusion surface.
export function getAccuracyStatus(
  accuracy = 0,
  hasData = true,
  attempts = hasData ? LEARNING_EVIDENCE_POLICY.minimumEvidence.learnerScoredResponses : 0,
  {
    observedAt = "",
    now = new Date(),
    skillDiversity = 0,
    scope = LEARNING_CONCLUSION_SCOPES.GENERAL
  } = {}
) {
  if (!hasData) {
    return {
      id: "not_started",
      label: STATUS_LABELS.not_started,
      description: "No assessment results yet.",
      policyVersion: LEARNING_POLICY_VERSION
    };
  }
  const conclusion = evaluateLearningConclusion({
    scope,
    accuracy,
    attempts,
    skillDiversity,
    observedAt,
    now
  });
  if (!conclusion.ready) {
    return {
      id: "not_enough_evidence",
      label: STATUS_LABELS.not_enough_evidence,
      description: "There are not enough recent results for a fair judgement.",
      policyVersion: conclusion.policyVersion
    };
  }
  if (conclusion.status.id === LEARNING_STATUS_IDS.SECURE) {
    return {
      id: "on_track",
      label: STATUS_LABELS.on_track,
      description: "These assessment results are Secure.",
      policyVersion: conclusion.policyVersion
    };
  }
  if (conclusion.status.id === LEARNING_STATUS_IDS.DEVELOPING) {
    return {
      id: "developing",
      label: STATUS_LABELS.developing,
      description: "Useful progress, with some targeted review needed.",
      policyVersion: conclusion.policyVersion
    };
  }
  return {
    id: "needs_support",
    label: STATUS_LABELS.needs_support,
    description: "Plan a short, focused reteach before moving on.",
    policyVersion: conclusion.policyVersion
  };
}

export function formatItemLabel(itemType = "", itemKey = "") {
  const key = String(itemKey || "").replace(/_/g, " ");
  if (!key) return "Unknown item";
  if (itemType === "initial_sound") return `Starts with /${key.replace(/^sound /, "")}/`;
  if (itemType === "final_sound") return `Ends with /${key.replace(/^sound /, "")}/`;
  if (itemType === "rhyming_family") return key.startsWith("-") ? `${key} family` : `-${key} family`;
  if (itemType === "short_vowel") return `Short /${key.replace(/^short /, "").replace(/^short_/, "")}/`;
  if (itemType === "sight_word") return key;
  if (itemType === "hfw_context_word") return `${key} · in a sentence`;
  if (itemType === "hfw_spelling_word") return `${key} · spelling`;
  if (itemType === "phonics_pattern") return key;
  if (itemType === "grammar_noun") return `Noun: ${key}`;
  if (itemType === "grammar_verb") return `Verb: ${key}`;
  if (itemType === "grammar_adjective") return `Adjective: ${key}`;
  if (itemType === "letter_name") return `${key.toUpperCase()} name`;
  if (itemType === "letter_sound") return `/${key}/ sound`;
  return key;
}

function inferShortVowelKey(record = {}) {
  const explicit = normalizeKey(record.itemKey || record.targetPattern || record.targetSound || "");
  if (/^short_[aeiou]$/.test(explicit)) return explicit.replace("short_", "");
  const answer = cleanWord(record.correctAnswer || record.correct || "");
  if (/^[aeiou]$/.test(answer)) return answer;
  const word = cleanWord(record.targetWord || record.diagnosticTarget || record.correctAnswer || "");
  const match = word.match(/^[bcdfghjklmnpqrstvwxyz]?([aeiou])[bcdfghjklmnpqrstvwxyz]+$/);
  return match ? match[1] : "";
}

function inferRimeFamily(record = {}) {
  const explicit = normalizeKey(record.itemKey || record.targetPattern || "");
  if (explicit && !["rhyming", "rhyme"].includes(explicit)) return explicit.replace(/^family_/, "");
  const word = cleanWord(record.targetWord || record.diagnosticTarget || record.correctAnswer || record.correct || "");
  return word.match(/[aeiou][a-z']*$/)?.[0] || word;
}

function inferQuestionItem(record = {}, attempt = {}) {
  const skillId = normalizeKey(record.skillId || attempt.skillId);
  const skillName = String(attempt.skillName || record.skillName || "").toLowerCase();
  const itemType = normalizeKey(record.itemType || "");
  const itemKey = normalizeKey(record.itemKey || "");

  if (itemType && itemKey) return { itemType, itemKey };

  if (skillId === "initial_sounds" || skillName.includes("initial")) {
    const key = normalizeKey(record.targetLetter || record.targetSound || record.targetPattern || record.correctAnswer || cleanWord(record.targetWord)[0]);
    return key ? { itemType: "initial_sound", itemKey: key[0] } : null;
  }
  if (skillId === "final_sounds" || skillName.includes("final") || skillName.includes("ending")) {
    const key = normalizeKey(record.targetSound || record.targetPattern || record.correctAnswer || cleanWord(record.targetWord).at(-1));
    return key ? { itemType: "final_sound", itemKey: key } : null;
  }
  if (skillId === "rhyming" || skillName.includes("rhym")) {
    const key = inferRimeFamily(record);
    return key ? { itemType: "rhyming_family", itemKey: key } : null;
  }
  if (skillId === "cvc_short_vowels" || skillId === "short_vowel_discrimination" || skillName.includes("short vowel")) {
    const key = inferShortVowelKey(record);
    return key ? { itemType: "short_vowel", itemKey: key } : null;
  }
  if (skillId.startsWith("hfw") || skillName.includes("high-frequency") || skillName.includes("sight")) {
    const key = normalizeKey(record.targetWord || record.correctAnswer || record.itemKey);
    const format = record.formatType || record.templateType || record.questionType || "";
    const itemType = isHfwSentenceSpellFormat(format)
      || isHfwSpellingQuestionCandidate({ ...record, skillId })
      ? "hfw_spelling_word"
      : isHfwClozeFormat(format)
        ? "hfw_context_word"
        : "sight_word";
    return key ? { itemType, itemKey: key } : null;
  }
  if (skillId === "advanced_phonics_patterns" || skillName.includes("phonics") || itemType.includes("phonics")) {
    const key = normalizeKey(record.targetPattern || record.itemKey || record.correctAnswer);
    return key ? { itemType: "phonics_pattern", itemKey: key } : null;
  }
  const grammarType = ["grammar_noun", "grammar_verb", "grammar_adjective"].find(type => itemType === type);
  if (grammarType) return { itemType: grammarType, itemKey };

  const key = normalizeKey(record.targetPattern || record.itemKey || record.correctAnswer || record.targetWord);
  return key ? { itemType: itemType || "skill_item", itemKey: key } : null;
}

function itemFromQuestion(question = {}) {
  return inferQuestionItem(question, question);
}

function getItemStatus(row = {}, now = new Date()) {
  const attempts = Number(row.attempts || 0);
  const correct = finiteNumberOrNull(row.correct);
  const suppliedAccuracy = finiteNumberOrNull(row.accuracy);
  const accuracy = attempts && correct !== null
    ? clampPercent((correct / attempts) * 100)
    : suppliedAccuracy === null
      ? null
      : clampPercent(suppliedAccuracy);
  if (!attempts) return "not_assessed";
  const conclusion = evaluateLearningConclusion({
    scope: LEARNING_CONCLUSION_SCOPES.ITEM,
    accuracy,
    attempts,
    observedAt: row.lastAssessed || row.updatedAt || "",
    now,
    minimumAttempts: LEARNING_EVIDENCE_POLICY.minimumEvidence.exactItemIndependentAttempts,
    skillDiversity: 1,
    requireRecency: true,
    allowUndated: false
  });
  if (!conclusion.ready) return "not_enough_evidence";
  if (conclusion.status.id === LEARNING_STATUS_IDS.SECURE) return "mastered";
  if (conclusion.status.id === LEARNING_STATUS_IDS.NEEDS_SUPPORT) return "needs_support";
  return "developing";
}

function scoreExamples(row = {}) {
  const examples = [
    ...(row.missedExamples || []),
    ...(row.examples || []),
    row.itemKey
  ].filter(Boolean);
  return Array.from(new Set(examples)).slice(0, 4);
}

export function normalizeItemMasteryRows(
  itemMastery = {},
  assessmentHistory = [],
  { now = new Date() } = {}
) {
  const rowMap = new Map();
  const addRow = row => {
    if (!row?.itemType || !row?.itemKey) return;
    if (DESCRIPTIVE_EL_BENCHMARK_IDS.has(normalizeKey(row.skillId || row.assessmentType))) return;
    const itemType = normalizeKey(row.itemType);
    const itemKey = normalizeKey(row.itemKey);
    const key = `${itemType}::${itemKey}`;
    const existing = rowMap.get(key) || {
      itemType,
      itemKey,
      skillId: row.skillId || "",
      skillName: row.skillName || ITEM_TYPE_LABELS[itemType] || "Skill item",
      attempts: 0,
      correct: 0,
      correctKnown: true,
      accuracyWeightedTotal: 0,
      accuracyKnownAttempts: 0,
      examples: new Set(),
      missedExamples: new Set(),
      lastAssessed: ""
    };
    const rowAttempts = Math.max(0, finiteNumberOrNull(row.attempts) || 0);
    const rowCorrect = finiteNumberOrNull(row.correct);
    const rowAccuracy = finiteNumberOrNull(row.accuracy) ?? (
      rowAttempts > 0 && rowCorrect !== null
        ? (rowCorrect / rowAttempts) * 100
        : null
    );
    existing.attempts += rowAttempts;
    if (rowAttempts > 0 && rowCorrect === null) {
      existing.correctKnown = false;
    } else if (rowCorrect !== null) {
      existing.correct += rowCorrect;
    }
    if (rowAttempts > 0 && rowAccuracy !== null) {
      existing.accuracyWeightedTotal += rowAccuracy * rowAttempts;
      existing.accuracyKnownAttempts += rowAttempts;
    }
    existing.skillId = existing.skillId || row.skillId || "";
    existing.skillName = existing.skillName || row.skillName || ITEM_TYPE_LABELS[itemType] || "Skill item";
    (row.examples || row.exampleWords || []).forEach(value => existing.examples.add(String(value)));
    (row.missedExamples || row.missedItems || []).forEach(value => existing.missedExamples.add(String(value)));
    existing.lastAssessed = [existing.lastAssessed, row.lastAssessed || row.lastAttemptDate || ""].filter(Boolean).sort().at(-1) || "";
    rowMap.set(key, existing);
  };

  const normalizedHistory = assessmentHistory
    .map(normalizeAssessmentAttempt)
    .filter(attempt => !isDescriptiveElBenchmarkRecord(attempt));
  const historyItemKeys = new Set();
  normalizedHistory.forEach(attempt => {
    attempt.questionRecords.forEach(question => {
      if (question.isCorrect === null) return;
      const inferred = inferQuestionItem(question, attempt);
      if (!inferred) return;
      historyItemKeys.add(`${normalizeKey(inferred.itemType)}::${normalizeKey(inferred.itemKey)}`);
    });
  });
  Object.values(itemMastery || {}).forEach(row => {
    if (!row?.itemType || !row?.itemKey) return;
    const key = `${normalizeKey(row.itemType)}::${normalizeKey(row.itemKey)}`;
    if (!historyItemKeys.has(key)) addRow(row);
  });

  normalizedHistory.forEach(attempt => {
    const itemRowsThisAttempt = new Map();
    attempt.questionRecords.forEach(question => {
      if (question.isCorrect === null) return;
      const inferred = inferQuestionItem(question, attempt);
      if (!inferred) return;
      const key = `${normalizeKey(inferred.itemType)}::${normalizeKey(inferred.itemKey)}`;
      const rows = itemRowsThisAttempt.get(key) || [];
      rows.push({ question, inferred });
      itemRowsThisAttempt.set(key, rows);
    });
    itemRowsThisAttempt.forEach(rows => {
      const { inferred } = rows[0];
      const examples = rows.map(({ question }) => (
        cleanWord(question.targetWord)
        || cleanWord(question.correctAnswer)
        || inferred.itemKey
      )).filter(Boolean);
      // Multiple variants in one sitting are one independent attempt. They
      // cannot satisfy the three-attempt gate by themselves.
      const fullyCorrect = rows.every(
        ({ question }) => question.responseStatus === "correct"
      );
      addRow({
        itemType: inferred.itemType,
        itemKey: inferred.itemKey,
        skillId: attempt.skillId,
        skillName: attempt.skillName,
        attempts: 1,
        correct: fullyCorrect ? 1 : 0,
        examples,
        missedExamples: fullyCorrect ? [] : examples,
        lastAssessed: rows
          .map(({ question }) => question.timestamp)
          .filter(Boolean)
          .sort()
          .at(-1) || attempt.completedAt
      });
    });
  });

  return Array.from(rowMap.values()).map(row => {
    const correct = row.attempts > 0 && row.correctKnown ? row.correct : null;
    const accuracy = row.attempts && row.accuracyKnownAttempts === row.attempts
      ? clampPercent(row.accuracyWeightedTotal / row.attempts)
      : null;
    const status = getItemStatus({ ...row, correct, accuracy }, now);
    const visibleRow = { ...row };
    delete visibleRow.correctKnown;
    delete visibleRow.accuracyWeightedTotal;
    delete visibleRow.accuracyKnownAttempts;
    return {
      ...visibleRow,
      correct,
      accuracy,
      status,
      statusLabel: status === "mastered"
        ? "Secure"
        : status === "developing"
          ? "Developing"
          : status === "needs_support"
            ? "Needs support"
            : status === "not_enough_evidence"
              ? "Not enough results"
              : "Not checked",
      policyVersion: LEARNING_POLICY_VERSION,
      label: formatItemLabel(row.itemType, row.itemKey),
      itemTypeLabel: ITEM_TYPE_LABELS[row.itemType] || "Skill item",
      examples: Array.from(row.examples).filter(Boolean).slice(0, 8),
      missedExamples: Array.from(row.missedExamples).filter(Boolean).slice(0, 8)
    };
  }).sort((a, b) =>
    a.status.localeCompare(b.status) ||
    a.skillName.localeCompare(b.skillName) ||
    a.label.localeCompare(b.label)
  );
}

export function buildWeeklyAccuracy(records = []) {
  const weeks = new Map();
  records.map(normalizeAssessmentAttempt).filter(record => !isDescriptiveElBenchmarkRecord(record)).forEach(record => {
    if (!record.completedAt) return;
    const date = new Date(record.completedAt);
    if (!Number.isFinite(date.getTime())) return;
    const day = date.getUTCDay() || 7;
    const monday = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - day + 1));
    const key = monday.toISOString().slice(0, 10);
    const row = weeks.get(key) || { weekStart: key, attempts: 0, correct: 0, total: 0 };
    row.attempts += 1;
    row.correct += record.correctCount;
    row.total += record.totalQuestions;
    weeks.set(key, row);
  });

  return Array.from(weeks.values()).sort((a, b) => a.weekStart.localeCompare(b.weekStart)).map(row => ({
    ...row,
    accuracy: row.total ? clampPercent((row.correct / row.total) * 100) : 0
  }));
}

function teachingNoteForItem(row = {}) {
  const examples = scoreExamples(row).join(", ") || row.itemKey;
  const key = String(row.itemKey || "").replace(/^short_/, "");
  if (row.itemType === "initial_sound") return `Practise listening for the /${key}/ sound at the start of words using: ${examples}.`;
  if (row.itemType === "final_sound") return `Help the student listen to the end of each word to find the /${key}/ sound: ${examples}.`;
  if (row.itemType === "short_vowel") return `Focus on the short /${key}/ vowel sound. Compare pairs: ${examples}.`;
  if (row.itemType === "rhyming_family") return `Build the -${key.replace(/^-/, "")} family together: ${examples}. Ask the student to think of more words that rhyme.`;
  if (row.itemType === "sight_word") return `Practise reading ${key} on its own, then in a sentence.`;
  if (row.itemType === "hfw_context_word") return `Practise choosing ${key} to complete a short sentence, then read the full sentence together.`;
  if (row.itemType === "hfw_spelling_word") return `Practise spelling ${key} from memory, then use it in a short sentence.`;
  if (row.itemType === "phonics_pattern") return `Practise the ${key} pattern using: ${examples}. Ask the student to tap out each sound.`;
  if (["grammar_verb", "grammar_noun", "grammar_adjective"].includes(row.itemType)) return `Use the word ${key} in a sentence together, then ask the student to make their own sentence.`;
  return `Review ${row.label || key} with a short model, guided try, and independent try.`;
}

function comparableAssessmentSignature(record = {}) {
  const questionIds = (record.questionRecords || [])
    .map(question => question.questionId)
    .filter(Boolean)
    .sort();
  const formIdentity = [
    record.formVersion,
    record.contentVersion,
    record.scoringVersion || record.scoringRuleVersion
  ].filter(Boolean);
  if (!formIdentity.length && !questionIds.length) return "";
  return JSON.stringify({
    assessmentType: record.assessmentType || record.assessmentId || "",
    skillId: record.skillId || "",
    formVersion: record.formVersion || "",
    contentVersion: record.contentVersion || "",
    scoringVersion: record.scoringVersion || record.scoringRuleVersion || "",
    totalQuestions: Number(record.totalQuestions || 0),
    questionIds
  });
}

function areAssessmentRecordsComparable(left = {}, right = {}) {
  const leftSignature = comparableAssessmentSignature(left);
  return Boolean(leftSignature && leftSignature === comparableAssessmentSignature(right));
}

export function buildRecommendations({
  itemRows = [],
  currentStage = {},
  currentSkillIndex = 0,
  skillTree = [],
  mastery = {},
  coverageSnapshot = {},
  currentStageQuestions = [],
  assessmentHistory = [],
  now = new Date()
} = {}) {
  const currentSkillId = currentStage?.id || "";
  const currentMastery = mastery?.[currentSkillId] || null;
  const coverage = coverageSnapshot?.[currentSkillId] || { mastered: 0, total: currentStageQuestions.length || 0 };
  const itemMap = new Map(itemRows.map(row => [`${row.itemType}::${row.itemKey}`, row]));
  const unseenRows = (currentStageQuestions || [])
    .map(question => itemFromQuestion(question))
    .filter(Boolean)
    .filter((item, index, rows) => rows.findIndex(row => `${row.itemType}::${row.itemKey}` === `${item.itemType}::${item.itemKey}`) === index)
    .filter(item => !itemMap.has(`${item.itemType}::${item.itemKey}`))
    .map(item => ({
      ...item,
      skillId: currentSkillId,
      skillName: currentStage?.label || "",
      attempts: 0,
      correct: 0,
      accuracy: 0,
      unseenCount: 1,
      status: "not_assessed",
      label: formatItemLabel(item.itemType, item.itemKey),
      examples: [],
      missedExamples: []
    }));
  const candidateRows = [...itemRows, ...unseenRows];
  const currentRows = candidateRows.filter(row => !currentSkillId || row.skillId === currentSkillId || row.skillName === currentStage?.label);
  const supportRows = (currentRows.length ? currentRows : itemRows).filter(row => row.status === "needs_support");
  const developingRows = (currentRows.length ? currentRows : itemRows).filter(row => row.status === "developing");
  const focusItems = [
    ...supportRows.filter(row => (
      row.correct === 0
      && row.attempts >= LEARNING_EVIDENCE_POLICY.progression.minimumCorrectResponses
    )),
    ...supportRows.filter(row => (
      row.attempts >= LEARNING_EVIDENCE_POLICY.minimumEvidence.exactItemIndependentAttempts
      && row.accuracy < LEARNING_EVIDENCE_POLICY.accuracyPercent.intensiveSupportMaximum
    )),
    ...unseenRows.filter(row => row.unseenCount > 0),
    ...supportRows.filter(row => row.attempts === 1),
    ...developingRows
  ].filter((row, index, rows) => rows.findIndex(item => `${item.itemType}::${item.itemKey}` === `${row.itemType}::${row.itemKey}`) === index).slice(0, 5);

  let recommendedSkill = currentStage?.label || "First assessment";
  let reason = "Begin with the current skill so the next result is useful.";
  if (!assessmentHistory.length && !itemRows.length) {
    recommendedSkill = skillTree[0]?.label || currentStage?.label || "First assessment";
    reason = "No assessment results are saved yet.";
  } else if (focusItems.length >= 2 && currentStage?.label) {
    reason = `Current skill has multiple items needing support: ${focusItems.slice(0, 2).map(row => row.label).join(", ")}.`;
  } else if (currentMastery && !currentMastery.mastered) {
    reason = "The current assessment is not Secure yet.";
  } else if (!currentMastery) {
    reason = "The current skill has not been assessed yet.";
  } else if (
    coverage.total
    && coverage.mastered / coverage.total
      < LEARNING_EVIDENCE_POLICY.accuracyPercent.developingMinimum / 100
  ) {
    reason = "The overall assessment is Secure, but some items still need more teaching.";
  } else if (currentMastery.mastered) {
    recommendedSkill = skillTree[currentSkillIndex + 1]?.label || currentStage?.label || "Maintain mastered skills";
    reason = skillTree[currentSkillIndex + 1]
      ? "The current assessment and item results are ready enough to move forward."
      : "All listed assessments are Secure; use review to maintain accuracy.";
  }

  const quickWins = developingRows
    .filter(row => rawLearningStatus(row.accuracy) === LEARNING_STATUS_IDS.DEVELOPING)
    .filter(row => row.attempts >= LEARNING_EVIDENCE_POLICY.progression.minimumCorrectResponses)
    .filter(row => !focusItems.some(item => `${item.itemType}::${item.itemKey}` === `${row.itemType}::${row.itemKey}`))
    .slice(0, 3)
    .map(row => `Almost there: ${row.label} (${row.correct} of ${row.attempts} correct)`);
  const normalizedHistory = assessmentHistory
    .map(normalizeAssessmentAttempt)
    .filter(record => !isDescriptiveElBenchmarkRecord(record))
    .sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt));
  const sameSkillAttempts = currentSkillId ? normalizedHistory.filter(record => record.skillId === currentSkillId) : [];
  const latestAttempt = normalizedHistory.at(-1);
  const latestSameSkill = sameSkillAttempts.at(-1);
  const comparableSameSkillAttempts = latestSameSkill
    ? sameSkillAttempts.filter(record => areAssessmentRecordsComparable(record, latestSameSkill))
    : [];
  const comparablePair = comparableSameSkillAttempts.slice(-2);
  const latestCoverageCounts = comparableSameSkillAttempts.slice(-3).map(record => {
    const coverageCount = Array.isArray(record.itemKeysCovered) ? record.itemKeysCovered.length : 0;
    return coverageCount || Object.keys(record.contentCoverage || {}).length;
  });
  const cautionFlags = [
    ...supportRows.filter(row => row.correct === 0 && row.attempts >= 3).map(row => `${row.label} has ${row.attempts} misses and no correct responses yet.`),
    ...(comparablePair.length === 2 && comparablePair.at(-1).accuracy - comparablePair.at(-2).accuracy < -20
      ? [`Accuracy dropped ${Math.abs(comparablePair.at(-1).accuracy - comparablePair.at(-2).accuracy)}% across two comparable ${currentStage?.label || "skill"} assessments.`]
      : []),
    ...(latestAttempt?.completedAt && (new Date(now).getTime() - new Date(latestAttempt.completedAt).getTime()) / 86400000 > 14
      ? [`Student has not been assessed in more than 14 days.`]
      : []),
    ...(latestCoverageCounts.length === 3 && latestCoverageCounts.every(count => count === latestCoverageCounts[0])
      ? [`The same ${latestCoverageCounts[0]} ${latestCoverageCounts[0] === 1 ? "item has" : "items have"} been assessed in each of the last 3 sessions.`]
      : [])
  ].slice(0, 4);

  return {
    recommendedSkill,
    reason,
    focusItems: focusItems.map(row => ({
      ...row,
      teachingNote: teachingNoteForItem(row)
    })),
    teachingNote: focusItems[0] ? teachingNoteForItem(focusItems[0]) : "Use one short assessment, then adjust from the result.",
    quickWins,
    cautionFlags
  };
}

export function buildStudentReportModel({
  studentName = "",
  className = "",
  totalAnswered = 0,
  accuracy = 0,
  currentStage = {},
  currentSkillIndex = 0,
  skillTree = [],
  currentStageQuestions = [],
  mastery = {},
  coverageSnapshot = {},
  skillMasterySummary = [],
  itemMastery = {},
  assessmentHistory = [],
  guidedReadingReportRows = [],
  storyQuestSummary = {},
  now = new Date()
} = {}) {
  const allRecords = assessmentHistory
    .map(normalizeAssessmentAttempt)
    .filter(record => !isDescriptiveElBenchmarkRecord(record))
    .sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt));
  const records = allRecords.filter(record => (
    isLearningEvidenceRecent(record.completedAt, { now, allowUndated: false })
  ));
  const answered = records.reduce((sum, record) => sum + record.totalQuestions, 0);
  const correct = records.reduce((sum, record) => sum + record.correctCount, 0);
  const effectiveAccuracy = answered
    ? clampPercent((correct / answered) * 100)
    : null;
  const lifetimeAnswered = totalAnswered || allRecords.reduce(
    (sum, record) => sum + record.totalQuestions,
    0
  );
  const lifetimeCorrect = allRecords.reduce((sum, record) => sum + record.correctCount, 0);
  const lifetimeAccuracy = lifetimeAnswered
    ? clampPercent(
      allRecords.length ? (lifetimeCorrect / lifetimeAnswered) * 100 : accuracy
    )
    : null;
  const itemRows = normalizeItemMasteryRows(itemMastery, records, { now });
  const latestAttempt = records.at(-1) || null;
  const latestLifetimeAttempt = allRecords.at(-1) || null;
  const sameSkillAttempts = currentStage?.id ? records.filter(record => record.skillId === currentStage.id) : [];
  const latestSameSkillAttempt = sameSkillAttempts.at(-1);
  const comparableSameSkillAttempts = latestSameSkillAttempt
    ? sameSkillAttempts.filter(record => areAssessmentRecordsComparable(record, latestSameSkillAttempt))
    : [];
  const comparableSameSkillPair = comparableSameSkillAttempts.slice(-2);
  const sameSkillDelta = comparableSameSkillPair.length === 2
    ? clampPercent(comparableSameSkillPair.at(-1).accuracy)
      - clampPercent(comparableSameSkillPair.at(-2).accuracy)
    : null;
  const status = getAccuracyStatus(
    (answered > 0 ? effectiveAccuracy : lifetimeAccuracy) ?? 0,
    answered > 0 || lifetimeAnswered > 0,
    answered > 0 ? answered : lifetimeAnswered,
    {
      observedAt: latestAttempt?.completedAt || latestLifetimeAttempt?.completedAt || "",
      skillDiversity: new Set(
        (answered > 0 ? records : allRecords)
          .map(record => record.skillId || record.skillName)
          .filter(Boolean)
      ).size,
      now
    }
  );
  const currentEvidenceReady = answered > 0
    && ["on_track", "developing", "needs_support"].includes(status.id);
  const policyMastery = Object.fromEntries(skillTree.map(stage => {
    const skillRecords = records.filter(
      record => record.skillId === stage.id || record.skillName === stage.label
    );
    const total = skillRecords.reduce((sum, record) => sum + record.totalQuestions, 0);
    const skillCorrect = skillRecords.reduce((sum, record) => sum + record.correctCount, 0);
    const conclusion = evaluateLearningConclusion({
      scope: LEARNING_CONCLUSION_SCOPES.SKILL,
      accuracy: total ? (skillCorrect / total) * 100 : null,
      attempts: total,
      skillDiversity: 1,
      observedAt: skillRecords.at(-1)?.completedAt || "",
      now
    });
    const skillStatus = computeSkillStatus(
      assessmentAttemptsToSkillLedger(skillRecords, stage.id),
      stage.id,
      { now }
    );
    return [stage.id, {
      ...(mastery?.[stage.id] || {}),
      mastered: skillStatus
        ? skillStatus.status === SKILL_STATUS_IDS.SECURE && !skillStatus.needsReview
        : conclusion.ready && conclusion.status.id === LEARNING_STATUS_IDS.SECURE,
      policyConclusion: conclusion,
      skillStatus
    }];
  }));
  const skillMapRows = skillTree.map((stage, index) => {
    const skillRecords = records.filter(record => record.skillId === stage.id || record.skillName === stage.label);
    const total = skillRecords.reduce((sum, record) => sum + record.totalQuestions, 0);
    const skillCorrect = skillRecords.reduce((sum, record) => sum + record.correctCount, 0);
    const data = policyMastery?.[stage.id] || null;
    const coverage = coverageSnapshot?.[stage.id] || { mastered: 0, total: 0, unit: "items" };
    const skillAccuracy = total
      ? clampPercent((skillCorrect / total) * 100)
      : null;
    const coverageLevel1 = coverage.level1 || { mastered: coverage.mastered || 0, total: coverage.total || 0 };
    const coverageLevel2 = coverage.level2 || { mastered: 0, total: 0 };
    const skillItems = itemRows.filter(row => row.skillId === stage.id || row.skillName === stage.label);
    const area = getSkillArea(stage);
    return {
      skillId: stage.id,
      label: stage.label,
      skillArea: area.label,
      skillAreaId: area.id,
      skillAreaColor: area.color,
      index,
      attempts: skillRecords.length,
      accuracy: skillAccuracy,
      status: data?.mastered
        ? "passed"
        : index === currentSkillIndex
          ? "current"
          : skillRecords.length
            ? "attempted"
            : "not_started",
      checkpointScore: data?.lastTotal ? `${data.lastScore}/${data.lastTotal}` : "Not attempted",
      skillStatus: data?.skillStatus || null,
      coverage,
      coverageLevel1,
      coverageLevel2,
      coveragePercent: coverage.total ? clampPercent((coverage.mastered / coverage.total) * 100) : 0,
      latestDate: skillRecords.at(-1)?.completedAt || "",
      checkpointHistory: skillRecords.map(record => ({
        date: record.completedAt,
        score: `${record.correctCount}/${record.totalQuestions}`,
        accuracy: record.accuracy,
        passed: record.passed
      })),
      itemGroups: {
        mastered: skillItems.filter(row => row.status === "mastered"),
        developing: skillItems.filter(row => row.status === "developing"),
        needsSupport: skillItems.filter(row => row.status === "needs_support"),
        notEnoughEvidence: skillItems.filter(row => row.status === "not_enough_evidence"),
        notAssessed: skillItems.filter(row => row.status === "not_assessed")
      }
    };
  });

  const recommendations = buildRecommendations({
    itemRows,
    currentStage,
    currentSkillIndex,
    skillTree,
    mastery: policyMastery,
    coverageSnapshot,
    currentStageQuestions,
    assessmentHistory: records,
    now
  });

  return {
    snapshot: {
      studentName: studentName || "Unnamed student",
      className: className || "Class not linked",
      lastActive: formatReportDate(latestLifetimeAttempt?.completedAt),
      currentSkill: currentStage?.label || "No current skill",
      totalAnswered: answered,
      accuracy: effectiveAccuracy,
      currentEvidenceReady,
      checkpoint: policyMastery?.[currentStage?.id]?.mastered
        ? "Passed"
        : records.some(record => record.skillId === currentStage?.id)
          ? "In progress"
          : "Not attempted",
      skillsPassed: skillMapRows.filter(row => row.status === "passed").length,
      status,
      lifetime: {
        totalAnswered: lifetimeAnswered,
        accuracy: lifetimeAccuracy,
        latestAt: latestLifetimeAttempt?.completedAt || ""
      }
    },
    progressPoints: allRecords.map(record => ({
      label: formatReportDate(record.completedAt),
      value: clampPercent(record.accuracy),
      skillName: record.skillName,
      score: `${record.correctCount}/${record.totalQuestions}`,
      completedAt: record.completedAt,
      skillArea: getSkillArea(record)
    })),
    sameSkillDelta,
    skillMapRows,
    itemGroups: {
      mastered: itemRows.filter(row => row.status === "mastered"),
      developing: itemRows.filter(row => row.status === "developing"),
      needsSupport: itemRows.filter(row => row.status === "needs_support"),
      notEnoughEvidence: itemRows.filter(row => row.status === "not_enough_evidence"),
      notAssessed: itemRows.filter(row => row.status === "not_assessed")
    },
    guidedReading: {
      bookCount: guidedReadingReportRows.length,
      completedCount: guidedReadingReportRows.filter(row => row.readCount > 0).length,
      levelRange: Array.from(new Set(guidedReadingReportRows.map(row => row.level).filter(Boolean))).join(", ") || "No levels yet",
      rows: guidedReadingReportRows
    },
    storyQuest: storyQuestSummary,
    recommendations,
    weeklyAccuracy: buildWeeklyAccuracy(records),
    skillMasterySummary
  };
}

export function buildClassReportModel({
  students = [],
  classes = [],
  assessmentHistory = [],
  answerHistory = [],
  classId = "",
  teacherName = "",
  now = new Date()
} = {}) {
  const classStudents = students.filter(student => !classId || getClassId(student) === classId);
  const classStudentIds = new Set(classStudents.map(getClassStudentId).filter(Boolean));
  const canonicalRecords = assessmentHistory
    .map(normalizeAssessmentAttempt)
    .filter(record => !isDescriptiveElBenchmarkRecord(record))
    .flatMap(record => {
      if (!classId) return [record];
      // Recorded class ownership is provenance, not a hint. Moving a student
      // must not move their historical class assessment rows.
      if (record.classId) return record.classId === classId ? [record] : [];
      // Only legacy rows that never stored a class may fall back to current
      // roster membership, and that fallback stays explicit for provenance.
      return classStudentIds.has(record.studentId)
        ? [{ ...record, legacyClassScopeFallback: true }]
        : [];
    });
  const answerObservationRecords = classAnswerObservationRecords({
    students: classStudents,
    assessmentHistory: canonicalRecords,
    answerHistory,
    now
  });
  // The caller has already applied the teacher's selected report period.
  // Re-applying the fixed 90-day learning window here made "School year" and
  // "All time" silently omit older records. Keep every selected-period row;
  // getAccuracyStatus still uses the newest observation date to prevent old
  // evidence from becoming a current Secure/Developing judgement.
  const allRecords = [...canonicalRecords, ...answerObservationRecords]
    .sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt));
  const records = allRecords;
  const studentsById = new Map(classStudents.map(student => [getClassStudentId(student), student]));
  const className = classId
    ? getClassNameById(classes, classId, "No class selected")
    : "All classes";
  const latestAssessmentDate = records.map(record => record.completedAt).filter(Boolean).sort().at(-1) || "";

  const skillGroupsByCanonicalName = new Map();
  records.forEach(record => {
    if (!record.skillName) return;
    const formatted = formatSkillForClassReport(record.skillName);
    const current = skillGroupsByCanonicalName.get(formatted.canonical) || {
      canonical: formatted.canonical,
      label: formatted.label,
      rawSkillNames: new Set()
    };
    current.rawSkillNames.add(record.skillName);
    skillGroupsByCanonicalName.set(formatted.canonical, current);
  });
  const skillGroups = Array.from(skillGroupsByCanonicalName.values())
    .map(group => ({
      ...group,
      rawSkillNames: Array.from(group.rawSkillNames).sort()
    }))
    .sort((a, b) => (
      classReportSkillSortValue(a.canonical) - classReportSkillSortValue(b.canonical)
      || a.canonical.localeCompare(b.canonical)
    ));

  const studentRows = classStudents.map(student => {
    const studentId = getClassStudentId(student);
    const studentRecords = records.filter(record => record.studentId === studentId);
    const verifiedRecords = studentRecords.filter(record => !record.answerObservation);
    const answerRecords = studentRecords.filter(record => record.answerObservation);
    const selectedPeriodTotalQuestions = studentRecords.reduce(
      (sum, record) => sum + record.totalQuestions,
      0
    );
    const selectedPeriodCorrectCount = studentRecords.reduce(
      (sum, record) => sum + record.correctCount,
      0
    );
    const selectedPeriodAccuracy = selectedPeriodTotalQuestions
      ? clampPercent((selectedPeriodCorrectCount / selectedPeriodTotalQuestions) * 100)
      : null;
    // Verified attempts decide a learning status when present. Older per-answer
    // rows have no assessment-sitting identity, so they can show truthful
    // counts and accuracy but can never manufacture an independent-attempt
    // judgement.
    const decisionRecords = verifiedRecords.length ? verifiedRecords : answerRecords;
    const total = decisionRecords.reduce((sum, record) => sum + record.totalQuestions, 0);
    const correct = decisionRecords.reduce((sum, record) => sum + record.correctCount, 0);
    const accuracy = total ? clampPercent((correct / total) * 100) : null;
    const latest = decisionRecords.at(-1) || null;
    const status = !verifiedRecords.length && answerRecords.length
      ? {
        id: "not_enough_evidence",
        label: STATUS_LABELS.not_enough_evidence,
        description: "Saved answers are visible, but their assessment sittings are not recorded.",
        policyVersion: LEARNING_POLICY_VERSION
      }
      : getAccuracyStatus(accuracy ?? 0, total > 0, total, {
        observedAt: latest?.completedAt || "",
        skillDiversity: new Set(
          decisionRecords
            .map(record => record.skillId || record.skillName)
            .filter(Boolean)
        ).size,
        scope: LEARNING_CONCLUSION_SCOPES.GENERAL,
        now
      });
    const supportSkills = skillGroups.flatMap(skillGroup => {
      const skillRecords = studentRecords.filter(record => (
        !record.answerObservation
        && skillGroup.rawSkillNames.includes(record.skillName)
      ));
      const skillTotal = skillRecords.reduce(
        (sum, record) => sum + record.totalQuestions,
        0
      );
      const skillCorrect = skillRecords.reduce(
        (sum, record) => sum + record.correctCount,
        0
      );
      const skillStatus = getAccuracyStatus(
        skillTotal ? (skillCorrect / skillTotal) * 100 : 0,
        skillTotal > 0,
        skillTotal,
        {
          observedAt: skillRecords.at(-1)?.completedAt || "",
          skillDiversity: 1,
          scope: LEARNING_CONCLUSION_SCOPES.SKILL,
          now
        }
      );
      return skillStatus.id === "needs_support" ? [skillGroup.label] : [];
    }).slice(0, 4);
    return {
      studentId,
      studentName: student.name || student.studentName || "Student",
      className: getClassNameById(classes, getClassId(student), student.className || ""),
      attempts: verifiedRecords.length,
      savedAnswers: answerRecords.length,
      totalQuestions: total,
      correctCount: correct,
      accuracy,
      selectedPeriodTotalQuestions,
      selectedPeriodCorrectCount,
      selectedPeriodAccuracy,
      policyReady: ["on_track", "developing", "needs_support"].includes(status.id),
      status,
      latestDate: latest?.completedAt || "",
      currentLevel: latest?.skillName || "No data yet",
      supportSkills,
      policyVersion: LEARNING_POLICY_VERSION
    };
  }).sort((a, b) => {
    const statusOrder = {
      needs_support: 0,
      developing: 1,
      on_track: 2,
      not_enough_evidence: 3,
      not_started: 4
    };
    return (statusOrder[a.status.id] ?? 4) - (statusOrder[b.status.id] ?? 4) ||
      (a.accuracy ?? Number.POSITIVE_INFINITY) - (b.accuracy ?? Number.POSITIVE_INFINITY) ||
      a.studentName.localeCompare(b.studentName);
  });

  const statusDistribution = [
    "on_track",
    "developing",
    "needs_support",
    "not_enough_evidence",
    "not_started"
  ].map(statusId => {
    const rows = studentRows.filter(row => row.status.id === statusId);
    return {
      statusId,
      label: STATUS_LABELS[statusId],
      count: rows.length,
      percent: classStudents.length ? clampPercent((rows.length / classStudents.length) * 100) : 0
    };
  });
  const policyReadyStudentRows = studentRows.filter(row => row.policyReady);
  const classComparability = evaluateClassComparability({
    totalLearners: classStudents.length,
    policyReadyLearners: policyReadyStudentRows.length,
    responseCounts: policyReadyStudentRows.map(row => row.totalQuestions)
  });
  const learnerWeightedAccuracy = policyReadyStudentRows.length
    ? average(policyReadyStudentRows.map(row => row.accuracy))
    : null;
  const policyReadyResponses = policyReadyStudentRows.reduce(
    (sum, row) => sum + row.totalQuestions,
    0
  );
  const policyReadyCorrect = policyReadyStudentRows.reduce(
    (sum, row) => sum + row.correctCount,
    0
  );
  const responseWeightedAccuracy = policyReadyResponses
    ? clampPercent((policyReadyCorrect / policyReadyResponses) * 100)
    : null;

  const heatmap = skillGroups.map(skillGroup => {
    const cells = studentRows.map(student => {
      const skillRecords = records.filter(record => (
        record.studentId === student.studentId
        && skillGroup.rawSkillNames.includes(record.skillName)
      ));
      const verifiedSkillRecords = skillRecords.filter(record => !record.answerObservation);
      const answerSkillRecords = skillRecords.filter(record => record.answerObservation);
      const selectedPeriodScoredResponses = skillRecords.reduce(
        (sum, record) => sum + record.totalQuestions,
        0
      );
      const selectedPeriodCorrectResponses = skillRecords.reduce(
        (sum, record) => sum + record.correctCount,
        0
      );
      const selectedPeriodAccuracy = selectedPeriodScoredResponses
        ? clampPercent(
          (selectedPeriodCorrectResponses / selectedPeriodScoredResponses) * 100
        )
        : null;
      const decisionSkillRecords = verifiedSkillRecords.length
        ? verifiedSkillRecords
        : answerSkillRecords;
      const total = decisionSkillRecords.reduce(
        (sum, record) => sum + record.totalQuestions,
        0
      );
      const correct = decisionSkillRecords.reduce(
        (sum, record) => sum + record.correctCount,
        0
      );
      const accuracy = total ? clampPercent((correct / total) * 100) : null;
      const hasUnverifiedAnswersOnly = !verifiedSkillRecords.length
        && answerSkillRecords.length > 0;
      const statusId = hasUnverifiedAnswersOnly
        ? "not_enough_evidence"
        : getClassReportStatusId(accuracy ?? 0, total);
      const status = hasUnverifiedAnswersOnly
        ? {
          id: "not_enough_evidence",
          label: STATUS_LABELS.not_enough_evidence,
          description: "Saved answers are visible, but their assessment sittings are not recorded.",
          policyVersion: LEARNING_POLICY_VERSION
        }
        : getAccuracyStatus(accuracy ?? 0, total > 0, total, {
          observedAt: decisionSkillRecords.at(-1)?.completedAt || "",
          skillDiversity: 1,
          scope: LEARNING_CONCLUSION_SCOPES.SKILL,
          now
        });
      return {
        studentId: student.studentId,
        studentName: student.studentName,
        attempts: verifiedSkillRecords.length,
        savedAnswers: answerSkillRecords.length,
        scoredResponses: total,
        correctResponses: correct,
        accuracy,
        selectedPeriodScoredResponses,
        selectedPeriodCorrectResponses,
        selectedPeriodAccuracy,
        statusId,
        statusLabel: getClassReportStatusLabel(statusId),
        policyReady: ["on_track", "developing", "needs_support"].includes(status.id),
        status,
        policyVersion: LEARNING_POLICY_VERSION
      };
    });
    const attemptedCells = cells.filter(cell => cell.scoredResponses > 0);
    const policyReadyCells = cells.filter(cell => cell.policyReady);
    const comparability = evaluateClassComparability({
      totalLearners: classStudents.length,
      policyReadyLearners: policyReadyCells.length,
      responseCounts: policyReadyCells.map(cell => cell.scoredResponses)
    });
    const readyResponseCount = policyReadyCells.reduce(
      (sum, cell) => sum + cell.scoredResponses,
      0
    );
    const readyCorrectCount = policyReadyCells.reduce(
      (sum, cell) => sum + cell.correctResponses,
      0
    );
    // Every scored answer for this skill, not only the ones inside a
    // policy-ready cell. `scoredResponses` below is deliberately the
    // judgement-bearing subset; the skills table reports the whole count so
    // "Answers" and "Students assessed" describe the same evidence.
    const totalScoredResponses = cells.reduce(
      (sum, cell) => sum + cell.scoredResponses,
      0
    );
    const classAccuracy = comparability.comparable
      ? average(policyReadyCells.map(cell => cell.accuracy))
      : null;
    const classStatusId = classReportSkillStatusId({
      attemptedLearnerCount: attemptedCells.length,
      comparable: comparability.comparable,
      classAccuracy
    });
    return {
      skillName: skillGroup.canonical,
      displaySkillName: skillGroup.label,
      canonicalSkillName: skillGroup.canonical,
      rawSkillNames: skillGroup.rawSkillNames,
      skillArea: getSkillArea({ skillName: skillGroup.canonical }).label,
      cells,
      comparability,
      policyReadyLearnerCount: policyReadyCells.length,
      attemptedLearnerCount: attemptedCells.length,
      classAccuracy,
      classStatusId,
      classStatusLabel: getClassReportStatusLabel(classStatusId),
      totalScoredResponses,
      learnerWeightedAccuracy: policyReadyCells.length
        ? average(policyReadyCells.map(cell => cell.accuracy))
        : null,
      responseWeightedAccuracy: readyResponseCount
        ? clampPercent((readyCorrectCount / readyResponseCount) * 100)
        : null,
      scoredResponses: readyResponseCount,
      masteredCount: cells.filter(cell => cell.statusId === "mastered").length,
      developingCount: cells.filter(cell => cell.statusId === "developing").length,
      needsSupportCount: cells.filter(cell => cell.statusId === "needs_support").length,
      notEnoughEvidenceCount: cells.filter(
        cell => cell.statusId === "not_enough_evidence"
      ).length,
      notAssessedCount: cells.filter(cell => cell.statusId === "not_assessed").length
    };
  });

  // A mixed list of attempts split in half is not longitudinal growth. Keep
  // this empty until the report has comparable forms, stable cohorts and two
  // policy-ready windows.
  const growthAreas = [];

  const masteryRows = heatmap
    .filter(row => (
      row.comparability.comparable
      && rawLearningStatus(row.classAccuracy) === LEARNING_STATUS_IDS.SECURE
      && classStudents.length > 0
      && row.masteredCount / classStudents.length
        >= LEARNING_EVIDENCE_POLICY.progression.classMasteryProportion
    ))
    .sort((a, b) => b.classAccuracy - a.classAccuracy || b.masteredCount - a.masteredCount)
    .slice(0, 8)
    .map(row => ({
      skill: row.displaySkillName,
      classAccuracy: row.classAccuracy,
      mastered: row.masteredCount,
      developing: row.developingCount,
      needsSupport: row.needsSupportCount,
      note: row.needsSupportCount ? `${row.needsSupportCount} student(s) still need review.` : "Class-level mastery is secure."
    }));

  const focusRows = heatmap
    .filter(row => (
      row.comparability.comparable
      && (
        rawLearningStatus(row.classAccuracy) === LEARNING_STATUS_IDS.NEEDS_SUPPORT
        || (
          classStudents.length > 0
          && row.needsSupportCount / classStudents.length
            >= LEARNING_EVIDENCE_POLICY.comparison.classFocusProportion
        )
      )
    ))
    .sort((a, b) => b.needsSupportCount - a.needsSupportCount || a.classAccuracy - b.classAccuracy)
    .slice(0, 8)
    .map(row => ({
      skill: row.displaySkillName,
      classAccuracy: row.classAccuracy,
      students: row.cells.filter(cell => cell.statusId === "needs_support").map(cell => cell.studentName),
      suggestedAction: getClassReportActivity(row)
    }));

  const weakPoints = heatmap
    .filter(row => row.comparability.comparable)
    .map(row => ({
      skillName: row.displaySkillName,
      studentCount: row.needsSupportCount,
      students: row.cells.filter(cell => cell.statusId === "needs_support").map(cell => cell.studentName),
      classAccuracy: row.classAccuracy
    }))
    .filter(row => (
      classStudents.length
      && row.studentCount / classStudents.length
        >= LEARNING_EVIDENCE_POLICY.comparison.classFocusProportion
    ))
    .sort((a, b) => b.studentCount - a.studentCount || a.classAccuracy - b.classAccuracy)
    .slice(0, 8);

  const itemRowsByStudent = new Map(classStudents.map(student => [
    getClassStudentId(student),
    normalizeItemMasteryRows(
      {},
      records.filter(record => record.studentId === getClassStudentId(student)),
      { now }
    )
  ]));
  const itemKeys = new Set(
    Array.from(itemRowsByStudent.values()).flatMap(rows => (
      rows.map(row => `${row.itemType}::${row.itemKey}`)
    ))
  );
  const weakItems = Array.from(itemKeys).flatMap(key => {
    const studentItemRows = studentRows.flatMap(student => {
      const row = (itemRowsByStudent.get(student.studentId) || [])
        .find(item => `${item.itemType}::${item.itemKey}` === key);
      return row ? [{ student, row }] : [];
    });
    const policyReadyRows = studentItemRows.filter(({ row }) => (
      ["mastered", "developing", "needs_support"].includes(row.status)
    ));
    const comparability = evaluateClassComparability({
      totalLearners: classStudents.length,
      policyReadyLearners: policyReadyRows.length,
      responseCounts: policyReadyRows.map(({ row }) => row.attempts)
    });
    if (!comparability.comparable) return [];
    const affected = policyReadyRows.filter(({ row }) => row.status === "needs_support");
    if (
      !classStudents.length
      || affected.length / classStudents.length
        < LEARNING_EVIDENCE_POLICY.comparison.classFocusProportion
    ) return [];
    const exampleSet = new Set(
      affected.flatMap(({ row }) => [...(row.missedExamples || []), ...(row.examples || [])])
    );
    const representative = affected[0]?.row || policyReadyRows[0]?.row;
    return [{
      itemType: representative.itemType,
      itemKey: representative.itemKey,
      label: representative.label,
      skillName: representative.skillName,
      affectedStudents: affected.map(({ student }) => student.studentName),
      affectedCount: affected.length,
      affectedPercent: clampPercent((affected.length / classStudents.length) * 100),
      averageAccuracy: average(policyReadyRows.map(({ row }) => row.accuracy)),
      attempts: policyReadyRows.reduce((sum, { row }) => sum + row.attempts, 0),
      examples: Array.from(exampleSet).slice(0, 6),
      comparability
    }];
  })
    .sort((a, b) => b.affectedCount - a.affectedCount || a.averageAccuracy - b.averageAccuracy)
    .slice(0, 12);

  const assigned = new Set();
  const groups = (weakItems.length ? weakItems : weakPoints).map((point, index) => {
    const studentNames = point.affectedStudents || point.students || [];
    const names = studentNames.filter(name => !assigned.has(name)).slice(0, 5);
    names.forEach(name => assigned.add(name));
    const focusLabel = point.label || point.skillName;
    return {
      groupName: `Group ${index + 1}`,
      focus: focusLabel,
      skill: point.skillName || focusLabel,
      students: names,
      reason: `${point.affectedCount || point.studentCount} ${
        (point.affectedCount || point.studentCount) === 1 ? "student needs" : "students need"
      } more teaching with ${focusLabel}.`,
      suggestedActivity: getClassReportActivity(point),
      style: CLASS_REPORT_GROUP_STYLES[index % CLASS_REPORT_GROUP_STYLES.length]
    };
  }).filter(group => group.students.length >= 2).slice(0, 4);

  const currentSkillCounts = studentRows.reduce((map, row) => {
    const latest = records.filter(record => record.studentId === row.studentId).sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt)).at(-1);
    if (!latest?.skillName) return map;
    const display = formatSkillForClassReport(latest.skillName).label;
    map[display] = (map[display] || 0) + 1;
    return map;
  }, {});
  // This feed contains checkpoint records, not Guided Reading records. Empty
  // is truthful; one fabricated "Not recorded" row per learner was not.
  const readingRows = [];
  const assessedStudentCount = studentRows.filter(row => row.totalQuestions > 0).length;
  const averageAccuracy = classComparability.comparable ? learnerWeightedAccuracy : null;
  const mostUrgentFocus = focusRows[0]?.skill || weakItems[0]?.skillName || weakPoints[0]?.skillName || "No class focus yet";

  return {
    classId,
    className,
    teacherName,
    generatedAt: new Date(now).toISOString(),
    provenanceEvidence: records,
    historicalEvidence: allRecords,
    provenance: {
      legacyClassScopeFallbackCount: records.filter(
        record => record.legacyClassScopeFallback
      ).length,
      answerRowsHaveNoHistoricalClassProvenance: answerObservationRecords.length > 0
    },
    comparability: classComparability,
    snapshot: {
      totalStudents: classStudents.length,
      assessedStudents: assessedStudentCount,
      activeThisWeek: studentRows.filter(row => (
        row.latestDate
        && (new Date(now).getTime() - new Date(row.latestDate).getTime()) / 86400000 <= 7
      )).length,
      attempts: records.filter(record => !record.answerObservation).length,
      savedAnswers: records.filter(record => record.answerObservation).length,
      averageAccuracy,
      learnerWeightedAccuracy,
      responseWeightedAccuracy,
      averageAccuracyReady: classComparability.comparable,
      comparability: classComparability,
      policyReadyStudents: policyReadyStudentRows.length,
      onTrack: studentRows.filter(row => row.status.id === "on_track").length,
      developing: studentRows.filter(row => row.status.id === "developing").length,
      needsSupport: studentRows.filter(row => row.status.id === "needs_support").length,
      avgReadingLevel: "Not recorded",
      avgReadingAccuracy: null,
      skillsAtClassMastery: masteryRows.length,
      totalSkillsAssessed: heatmap.filter(
        row => row.cells.some(cell => cell.scoredResponses > 0)
      ).length,
      mostUrgentFocus,
      latestAssessmentDate,
      mostCommonCurrentSkill: Object.entries(currentSkillCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "No data yet",
      statusDistribution
    },
    studentRows,
    heatmap,
    growthAreas,
    masteryRows,
    focusRows,
    readingRows,
    weakPoints,
    weakItems,
    groups,
    weeklyAccuracy: buildWeeklyAccuracy(records),
    orphanRecords: records.filter(record => record.studentId && !studentsById.has(record.studentId)).length
  };
}

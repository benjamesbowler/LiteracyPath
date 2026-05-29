import { normalizeAssessmentAttempt } from "./assessmentHistoryStore.js";

export const EL_FORMAL_LETTERS = "abcdefghijklmnopqrstuvwxyz".split("");

export const ADVANCED_PHONICS_PATTERNS = [
  "ai",
  "ay",
  "ee",
  "ea",
  "oa",
  "ow",
  "ar",
  "or",
  "er",
  "ir",
  "ur",
  "sh",
  "ch",
  "th",
  "wh",
  "ck",
  "ng",
  "nk",
  "silent e",
  "long a",
  "long e",
  "long i",
  "long o",
  "long u",
  "blends",
  "digraphs",
  "r-controlled vowels",
  "vowel teams"
];

const STATUS_LABELS = {
  mastered: "Mastered",
  developing: "Developing",
  needs_support: "Needs Support",
  not_assessed: "Not assessed"
};

function normalizeKey(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\s+/g, " ");
}

function normalizeCompact(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function getStudentId(student = {}) {
  return student.id || student.studentId || "";
}

function getStudentName(student = {}) {
  return student.name || student.studentName || "Unknown Student";
}

function getClassId(student = {}) {
  return student.classId || student.class_id || "";
}

function getStatus(correct = 0, attempts = 0) {
  if (!attempts) return "not_assessed";
  const accuracy = Math.round((correct / attempts) * 100);
  if (accuracy >= 80) return "mastered";
  if (accuracy >= 60) return "developing";
  return "needs_support";
}

function makeCell() {
  return {
    status: "not_assessed",
    statusLabel: STATUS_LABELS.not_assessed,
    attempts: 0,
    correct: 0,
    incorrect: 0,
    accuracy: 0,
    lastAssessed: "",
    details: []
  };
}

function finalizeCell(cell) {
  const accuracy = cell.attempts ? Math.round((cell.correct / cell.attempts) * 100) : 0;
  const status = getStatus(cell.correct, cell.attempts);
  return {
    ...cell,
    incorrect: cell.attempts - cell.correct,
    accuracy,
    status,
    statusLabel: STATUS_LABELS[status]
  };
}

function isLetterAssessment(record = {}) {
  const skillId = normalizeCompact(record.skillId || record.assessmentType);
  const skillName = String(record.skillName || "").toLowerCase();
  return skillId === "el_letter_assessment" ||
    skillName.includes("letter name") ||
    skillName.includes("letter sound");
}

function inferLetterCase(question = {}) {
  const target = String(question.targetLetter || question.letter || "").trim();
  if (target && /^[A-Z]$/.test(target)) return "uppercase";
  if (target && /^[a-z]$/.test(target)) return "lowercase";
  const text = [
    question.questionId,
    question.templateType,
    question.itemType,
    question.prompt
  ].join(" ").toLowerCase();
  if (text.includes("uppercase")) return "uppercase";
  if (text.includes("lowercase")) return "lowercase";
  return target && target === target.toUpperCase() ? "uppercase" : "lowercase";
}

function inferLetterMode(question = {}) {
  const text = [
    question.itemType,
    question.templateType,
    question.questionId,
    question.prompt
  ].join(" ").toLowerCase();
  return text.includes("sound") ? "sound" : "name";
}

function inferLetter(question = {}) {
  const target = String(question.targetLetter || question.letter || question.itemKey || "").trim();
  const direct = target.match(/[a-z]/i)?.[0];
  if (direct) return direct.toLowerCase();
  const answer = String(question.correctAnswer || "").trim();
  return answer.match(/[a-z]/i)?.[0]?.toLowerCase() || "";
}

function isAdvancedPhonicsAssessment(record = {}) {
  const skillId = normalizeCompact(record.skillId || record.assessmentType);
  const skillName = String(record.skillName || "").toLowerCase();
  return skillId === "advanced_phonics_patterns" ||
    skillName.includes("advanced phonics") ||
    skillName.includes("blends") ||
    skillName.includes("digraphs") ||
    skillName.includes("vowel teams") ||
    skillName.includes("r-controlled");
}

function inferAdvancedPattern(question = {}) {
  const explicit = normalizeKey(question.targetPattern || question.pattern || question.itemKey || "");
  if (!explicit || explicit === "phonics pattern") {
    return normalizeKey(question.correctAnswer || question.targetWord || "");
  }
  return explicit;
}

function inferPatternResultType(question = {}) {
  const text = [
    question.resultType,
    question.itemType,
    question.templateType,
    question.questionId,
    question.prompt
  ].join(" ").toLowerCase();
  if (text.includes("sound")) return "sound";
  if (text.includes("read") || text.includes("word")) return "reading";
  return "recognition";
}

function addDetail(cell, question = {}, record = {}) {
  cell.attempts += 1;
  if (question.isCorrect) cell.correct += 1;
  const date = question.timestamp || record.completedAt || "";
  cell.lastAssessed = [cell.lastAssessed, date].filter(Boolean).sort().at(-1) || "";
  cell.details.push({
    questionId: question.questionId || "",
    prompt: question.prompt || question.question || "",
    targetLetter: question.targetLetter || "",
    targetWord: question.targetWord || "",
    targetPattern: question.targetPattern || question.pattern || "",
    correctAnswer: question.correctAnswer,
    selectedAnswer: question.selectedAnswer,
    isCorrect: Boolean(question.isCorrect),
    date
  });
}

export function buildIndividualElFormalAssessmentReport({
  student = {},
  assessmentHistory = []
} = {}) {
  const studentId = getStudentId(student);
  const records = (Array.isArray(assessmentHistory) ? assessmentHistory : [])
    .map(normalizeAssessmentAttempt)
    .filter(record => !studentId || record.studentId === studentId);

  const letterMap = new Map(EL_FORMAL_LETTERS.map(letter => [
    letter,
    {
      letter,
      letterPair: `${letter.toUpperCase()}/${letter}`,
      uppercaseName: makeCell(),
      uppercaseSound: makeCell(),
      lowercaseName: makeCell(),
      lowercaseSound: makeCell(),
      lastAssessed: ""
    }
  ]));

  records.filter(isLetterAssessment).forEach(record => {
    (record.questionRecords || record.answers || []).forEach(question => {
      const letter = inferLetter(question);
      if (!letterMap.has(letter)) return;
      const letterCase = inferLetterCase(question);
      const mode = inferLetterMode(question);
      const cellKey = `${letterCase}${mode === "sound" ? "Sound" : "Name"}`;
      const row = letterMap.get(letter);
      addDetail(row[cellKey], question, record);
      row.lastAssessed = [row.lastAssessed, question.timestamp || record.completedAt].filter(Boolean).sort().at(-1) || "";
    });
  });

  const individualLetterMatrix = Array.from(letterMap.values()).map(row => ({
    ...row,
    uppercaseName: finalizeCell(row.uppercaseName),
    uppercaseSound: finalizeCell(row.uppercaseSound),
    lowercaseName: finalizeCell(row.lowercaseName),
    lowercaseSound: finalizeCell(row.lowercaseSound),
    lastAssessed: formatDate(row.lastAssessed)
  }));

  const patternUniverse = new Set(ADVANCED_PHONICS_PATTERNS);
  const patternMap = new Map();
  const ensurePattern = pattern => {
    const key = normalizeKey(pattern);
    if (!key) return null;
    patternUniverse.add(key);
    if (!patternMap.has(key)) {
      patternMap.set(key, {
        pattern: key,
        readingResult: makeCell(),
        soundResult: makeCell(),
        attempts: 0,
        correct: 0,
        incorrect: 0,
        accuracy: 0,
        status: "not_assessed",
        statusLabel: STATUS_LABELS.not_assessed,
        exampleWords: new Set(),
        lastAssessed: "",
        details: []
      });
    }
    return patternMap.get(key);
  };

  ADVANCED_PHONICS_PATTERNS.forEach(ensurePattern);
  records.filter(isAdvancedPhonicsAssessment).forEach(record => {
    (record.questionRecords || record.answers || []).forEach(question => {
      const pattern = inferAdvancedPattern(question);
      const row = ensurePattern(pattern);
      if (!row) return;
      const type = inferPatternResultType(question);
      const targetCell = type === "sound" ? row.soundResult : row.readingResult;
      addDetail(targetCell, question, record);
      row.attempts += 1;
      if (question.isCorrect) row.correct += 1;
      else row.incorrect += 1;
      const example = normalizeKey(question.targetWord || question.correctAnswer || "");
      if (example && example !== pattern) row.exampleWords.add(example);
      const date = question.timestamp || record.completedAt || "";
      row.lastAssessed = [row.lastAssessed, date].filter(Boolean).sort().at(-1) || "";
      row.details.push({
        questionId: question.questionId || "",
        targetWord: question.targetWord || "",
        correctAnswer: question.correctAnswer,
        selectedAnswer: question.selectedAnswer,
        resultType: type,
        isCorrect: Boolean(question.isCorrect),
        date
      });
    });
  });

  const individualAdvancedPhonicsMatrix = Array.from(patternMap.values()).map(row => {
    const accuracy = row.attempts ? Math.round((row.correct / row.attempts) * 100) : 0;
    const status = getStatus(row.correct, row.attempts);
    return {
      ...row,
      readingResult: finalizeCell(row.readingResult),
      soundResult: finalizeCell(row.soundResult),
      accuracy,
      status,
      statusLabel: STATUS_LABELS[status],
      exampleWords: Array.from(row.exampleWords).slice(0, 10),
      lastAssessed: formatDate(row.lastAssessed)
    };
  }).sort((a, b) => {
    const ai = ADVANCED_PHONICS_PATTERNS.indexOf(a.pattern);
    const bi = ADVANCED_PHONICS_PATTERNS.indexOf(b.pattern);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi) || a.pattern.localeCompare(b.pattern);
  });

  return {
    studentId,
    studentName: getStudentName(student),
    individualLetterMatrix,
    individualAdvancedPhonicsMatrix
  };
}

function countCellByStudent(rows = [], cellKey, students = []) {
  const counts = {
    mastered: 0,
    developing: 0,
    needs_support: 0,
    not_assessed: 0,
    supportStudents: []
  };
  rows.forEach(({ student, matrixRow }) => {
    const status = matrixRow?.[cellKey]?.status || "not_assessed";
    counts[status] += 1;
    if (status === "needs_support") counts.supportStudents.push(getStudentName(student));
  });
  counts.not_assessed += Math.max(0, students.length - rows.length);
  return counts;
}

export function buildClassElFormalAssessmentReport({
  students = [],
  assessmentHistory = [],
  classId = ""
} = {}) {
  const classStudents = (Array.isArray(students) ? students : [])
    .filter(student => !classId || getClassId(student) === classId);

  const individualReports = classStudents.map(student => ({
    student,
    report: buildIndividualElFormalAssessmentReport({ student, assessmentHistory })
  }));

  const classLetterMatrix = EL_FORMAL_LETTERS.map(letter => {
    const letterRows = individualReports.map(({ student, report }) => ({
      student,
      matrixRow: report.individualLetterMatrix.find(row => row.letter === letter)
    }));
    return {
      letter,
      letterPair: `${letter.toUpperCase()}/${letter}`,
      uppercaseName: countCellByStudent(letterRows, "uppercaseName", classStudents),
      uppercaseSound: countCellByStudent(letterRows, "uppercaseSound", classStudents),
      lowercaseName: countCellByStudent(letterRows, "lowercaseName", classStudents),
      lowercaseSound: countCellByStudent(letterRows, "lowercaseSound", classStudents)
    };
  });

  const patternSet = new Set(ADVANCED_PHONICS_PATTERNS);
  individualReports.forEach(({ report }) => {
    report.individualAdvancedPhonicsMatrix.forEach(row => patternSet.add(row.pattern));
  });

  const classAdvancedPhonicsMatrix = Array.from(patternSet).map(pattern => {
    const rows = individualReports.map(({ student, report }) => ({
      student,
      row: report.individualAdvancedPhonicsMatrix.find(item => item.pattern === pattern)
    }));
    const attempted = rows.filter(item => item.row?.attempts > 0);
    const mastered = attempted.filter(item => item.row.status === "mastered");
    const developing = attempted.filter(item => item.row.status === "developing");
    const support = attempted.filter(item => item.row.status === "needs_support");
    return {
      pattern,
      attemptedStudents: attempted.length,
      masteredStudents: mastered.length,
      developingStudents: developing.length,
      needsSupportStudents: support.length,
      notAssessedStudents: Math.max(0, classStudents.length - attempted.length),
      masteryPercentage: attempted.length ? Math.round((mastered.length / attempted.length) * 100) : 0,
      studentsNeedingSupport: support.map(item => getStudentName(item.student))
    };
  }).sort((a, b) => {
    const ai = ADVANCED_PHONICS_PATTERNS.indexOf(a.pattern);
    const bi = ADVANCED_PHONICS_PATTERNS.indexOf(b.pattern);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi) || a.pattern.localeCompare(b.pattern);
  });

  return {
    classLetterMatrix,
    classAdvancedPhonicsMatrix
  };
}

export const EL_FORMAL_STATUS_LABELS = STATUS_LABELS;

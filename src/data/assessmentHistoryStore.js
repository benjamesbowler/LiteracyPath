const STORAGE_PREFIX = "lpAssessmentHistory:v1";

const REQUIRED_ATTEMPT_FIELDS = [
  "attemptId",
  "studentId",
  "studentName",
  "assessmentType",
  "skillId",
  "skillName",
  "skillLevel",
  "startedAt",
  "completedAt",
  "totalQuestions",
  "correctCount",
  "accuracy",
  "status",
  "questionRecords",
  "schemaVersion"
];

function nowIso() {
  return new Date().toISOString();
}

function getStorageKey(teacherId = "local") {
  return `${STORAGE_PREFIX}:${teacherId || "local"}`;
}

function safeParse(value, fallback) {
  try {
    return JSON.parse(value || "");
  } catch {
    return fallback;
  }
}

function normalizeDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toISOString();
}

function normalizeKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/^\/|\/$/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function cleanWord(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z']/g, "");
}

function inferShortVowelKey(record = {}) {
  const explicit = normalizeKey(record.itemKey || record.targetPattern || record.targetSound || "");
  if (/^short_[aeiou]$/.test(explicit)) return explicit;
  const answer = cleanWord(record.correctAnswer || record.correct || "");
  if (/^[aeiou]$/.test(answer)) return `short_${answer}`;
  const word = cleanWord(record.targetWord || record.diagnosticTarget || "");
  const simpleCvc = word.match(/^[bcdfghjklmnpqrstvwxyz]?([aeiou])[bcdfghjklmnpqrstvwxyz]+$/);
  return simpleCvc ? `short_${simpleCvc[1]}` : "";
}

function inferRimeFamily(record = {}) {
  const explicit = normalizeKey(record.itemKey || record.targetPattern || "");
  if (explicit && !["rhyming", "rhyme"].includes(explicit)) return explicit;
  const word = cleanWord(record.targetWord || record.diagnosticTarget || record.correctAnswer || record.correct || "");
  const match = word.match(/[aeiou][a-z']*$/);
  return match ? match[0] : word;
}

function inferQuestionMasteryKey(record = {}, attempt = {}) {
  const skillId = normalizeKey(record.skillId || attempt.skillId);
  const skillName = String(attempt.skillName || record.skillName || "").toLowerCase();
  const templateType = normalizeKey(record.templateType || record.formatType || "");
  const correct = normalizeKey(record.correctAnswer || record.correct || "");
  const targetWord = cleanWord(record.targetWord || record.diagnosticTarget || "");
  const itemType = normalizeKey(record.itemType || "");
  const itemKey = normalizeKey(record.itemKey || "");

  const shouldPreferSkillSpecificKey = [
    "initial_sounds",
    "final_sounds",
    "rhyming",
    "cvc_short_vowels",
    "short_vowel_discrimination"
  ].includes(skillId) || skillName.includes("initial") || skillName.includes("final") || skillName.includes("rhym") || skillName.includes("short vowel");

  if (itemKey && itemType && !shouldPreferSkillSpecificKey) return { itemKey, itemType };

  if (skillId === "initial_sounds" || skillName.includes("initial")) {
    const key = normalizeKey(record.targetLetter || record.targetSound || record.targetPattern || correct || targetWord[0]);
    return key ? { itemKey: key[0], itemType: "initial_sound" } : null;
  }

  if (skillId === "final_sounds" || skillName.includes("final") || skillName.includes("ending")) {
    const key = normalizeKey(record.targetSound || record.targetPattern || correct || targetWord.at(-1));
    return key ? { itemKey: key, itemType: "final_sound" } : null;
  }

  if (skillId === "rhyming" || skillName.includes("rhym")) {
    const key = inferRimeFamily(record);
    return key ? { itemKey: key, itemType: "rhyming_family" } : null;
  }

  if (
    skillId === "cvc_short_vowels" ||
    skillId === "short_vowel_discrimination" ||
    skillName.includes("short vowel") ||
    templateType.includes("short_vowel")
  ) {
    const key = inferShortVowelKey(record);
    return key ? { itemKey: key, itemType: "short_vowel" } : null;
  }

  if (skillId.startsWith("hfw") || skillName.includes("high-frequency") || skillName.includes("sight")) {
    const key = normalizeKey(record.targetWord || record.itemKey || record.correctAnswer || record.correct);
    return key ? { itemKey: key, itemType: "sight_word" } : null;
  }

  if (skillId === "el_letter_assessment") {
    if (itemType && itemKey) return { itemKey, itemType };
    const key = normalizeKey(record.targetLetter || record.itemKey || record.correctAnswer || record.correct);
    return key ? { itemKey: key, itemType: record.templateType === "letter_sound" ? "letter_sound" : "letter_name" } : null;
  }

  if (skillId === "advanced_phonics_patterns" || itemType.includes("phonics")) {
    const key = normalizeKey(record.targetPattern || record.itemKey || record.correctAnswer || record.correct);
    return key ? { itemKey: key, itemType: itemType || "phonics_pattern" } : null;
  }

  const fallback = normalizeKey(record.targetPattern || record.itemKey || record.correctAnswer || record.correct);
  return fallback ? { itemKey: fallback, itemType: itemType || "skill_item" } : null;
}

function makeAttemptId(record = {}) {
  const base = [
    record.teacherId || "teacher",
    record.studentId || "student",
    record.skillId || "skill",
    record.startedAt || record.completedAt || nowIso(),
    record.questionRecords?.map(item => item.questionId).filter(Boolean).join("-") || record.totalQuestions || 0
  ].join(":");

  return `attempt_${base.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "")}`;
}

export function normalizeAssessmentAttempt(record = {}) {
  const questionRecords = Array.isArray(record.questionRecords) ? record.questionRecords : [];
  const totalQuestions = Number(record.totalQuestions || questionRecords.length || 0);
  const correctCount = Number(record.correctCount ?? questionRecords.filter(item => item.isCorrect).length);
  const accuracy = totalQuestions ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const completedAt = normalizeDate(record.completedAt) || nowIso();
  const startedAt = normalizeDate(record.startedAt) || questionRecords[0]?.timestamp || completedAt;
  const passed = Boolean(record.passed ?? record.mastered ?? accuracy >= 80);

  return {
    id: record.id || record.attemptId || "",
    attemptId: record.attemptId || makeAttemptId({ ...record, startedAt, completedAt, questionRecords, totalQuestions }),
    studentId: record.studentId || "",
    studentName: record.studentName || "Student",
    classId: record.classId || "",
    teacherId: record.teacherId || "",
    assessmentType: record.assessmentType || "skill_checkpoint",
    skillId: record.skillId || "",
    skillName: record.skillName || record.stage || "Assessment",
    skillLevel: Number(record.skillLevel || 1),
    skillPhase: Number(record.skillPhase || 1),
    startedAt,
    completedAt,
    totalQuestions,
    correctCount,
    accuracy,
    passed,
    status: record.status || (passed ? "mastered" : "needs_retry"),
    masteredItems: record.masteredItems || [],
    developingItems: record.developingItems || [],
    needsSupportItems: record.needsSupportItems || [],
    incorrectCount: Number(record.incorrectCount ?? Math.max(0, totalQuestions - correctCount)),
    missedItems: record.missedItems || [],
    itemKeysCovered: record.itemKeysCovered || [],
    contentCoverage: record.contentCoverage || {},
    levelUnlocked: record.levelUnlocked || "",
    patternStats: Array.isArray(record.patternStats) ? record.patternStats : [],
    answers: Array.isArray(record.answers) ? record.answers : [],
    questionRecords: questionRecords.map((item, index) => ({
      questionId: item.questionId || "",
      prompt: item.prompt || item.question || "",
      pattern: item.pattern || item.targetPattern || "",
      targetWord: item.targetWord || item.diagnosticTarget || item.itemKey || "",
      targetLetter: item.targetLetter || "",
      targetSound: item.targetSound || "",
      targetPattern: item.targetPattern || "",
      itemKey: item.itemKey || "",
      itemType: item.itemType || "",
      correctAnswer: item.correctAnswer ?? item.correct ?? "",
      selectedAnswer: item.selectedAnswer ?? item.chosen ?? "",
      isCorrect: Boolean(item.isCorrect),
      skillId: item.skillId || record.skillId || "",
      templateType: item.templateType || item.formatType || "",
      tags: Array.isArray(item.tags) ? item.tags : [],
      level: Number(item.level || item.itemLevel || record.skillLevel || 1),
      phase: Number(item.phase || item.itemPhase || record.skillPhase || 1),
      timestamp: normalizeDate(item.timestamp) || completedAt,
      order: index + 1
    })),
    appVersion: record.appVersion || "local",
    schemaVersion: record.schemaVersion || 1
  };
}

export function extractMasteryFromAssessmentAttempt(record = {}) {
  const attempt = normalizeAssessmentAttempt(record);
  const groups = new Map();

  attempt.questionRecords.forEach(question => {
    const masteryKey = inferQuestionMasteryKey(question, attempt);
    if (!masteryKey?.itemKey || !masteryKey?.itemType) return;
    const groupKey = `${masteryKey.itemType}::${masteryKey.itemKey}`;
    const group = groups.get(groupKey) || {
      itemKey: masteryKey.itemKey,
      itemType: masteryKey.itemType,
      skillId: question.skillId || attempt.skillId,
      skillName: attempt.skillName,
      attempts: 0,
      correct: 0,
      examples: new Set(),
      missedExamples: new Set(),
      lastAssessed: question.timestamp || attempt.completedAt
    };

    group.attempts += 1;
    if (question.isCorrect) group.correct += 1;
    const example = cleanWord(question.targetWord) || normalizeKey(question.correctAnswer || question.itemKey);
    if (example) {
      if (question.isCorrect) group.examples.add(example);
      else group.missedExamples.add(example);
    }
    group.lastAssessed = question.timestamp || group.lastAssessed;
    groups.set(groupKey, group);
  });

  const rows = Array.from(groups.values()).map(group => {
    const accuracy = group.attempts ? Math.round((group.correct / group.attempts) * 100) : 0;
    const mastered = group.correct >= 2 || (group.attempts > 0 && accuracy >= 80);
    const needsSupport = group.attempts > 0 && (group.correct === 0 || accuracy < 60);
    return {
      itemKey: group.itemKey,
      itemType: group.itemType,
      skillId: group.skillId,
      skillName: group.skillName,
      attempts: group.attempts,
      correct: group.correct,
      accuracy,
      mastered,
      status: mastered ? "mastered" : needsSupport ? "needs_support" : "developing",
      examples: Array.from(group.examples).slice(0, 6),
      missedExamples: Array.from(group.missedExamples).slice(0, 6),
      lastAssessed: group.lastAssessed
    };
  });

  return {
    skillId: attempt.skillId,
    skillName: attempt.skillName,
    masteredItems: rows.filter(row => row.status === "mastered"),
    developingItems: rows.filter(row => row.status === "developing"),
    needsSupportItems: rows.filter(row => row.status === "needs_support"),
    examplesByItem: rows.reduce((acc, row) => {
      acc[`${row.itemType}::${row.itemKey}`] = row.examples;
      return acc;
    }, {}),
    accuracyByItem: rows.reduce((acc, row) => {
      acc[`${row.itemType}::${row.itemKey}`] = row.accuracy;
      return acc;
    }, {}),
    rows
  };
}

export function mergeAssessmentAttemptIntoItemMastery(itemMastery = {}, record = {}) {
  const attempt = normalizeAssessmentAttempt(record);
  const mastery = extractMasteryFromAssessmentAttempt(attempt);
  const next = { ...(itemMastery || {}) };

  mastery.rows.forEach(row => {
    const key = `${normalizeKey(row.itemType)}::${normalizeKey(row.itemKey)}`;
    const previous = next[key] || {};
    const attempts = Number(previous.attempts || 0) + row.attempts;
    const correct = Number(previous.correct || 0) + row.correct;
    const accuracy = attempts ? Math.round((correct / attempts) * 100) : 0;
    next[key] = {
      ...previous,
      itemKey: row.itemKey,
      itemType: row.itemType,
      skillId: row.skillId || previous.skillId || attempt.skillId,
      targetSkill: row.skillName || previous.targetSkill || attempt.skillName,
      targetWord: row.itemType === "sight_word" || row.itemType === "cvc_word" ? row.itemKey : previous.targetWord || "",
      targetSound: row.itemType.includes("sound") || row.itemType === "short_vowel" ? row.itemKey : previous.targetSound || "",
      targetPattern: row.itemType.includes("pattern") || row.itemType === "rhyming_family" ? row.itemKey : previous.targetPattern || "",
      source: previous.source || "assessment",
      attempts,
      correct,
      lastSeen: row.lastAssessed || attempt.completedAt,
      lastResult: row.correct > 0,
      sessionsSeen: Number(previous.sessionsSeen || 0) + 1,
      mastered: Boolean(previous.mastered || row.mastered || accuracy >= 80),
      examples: Array.from(new Set([...(previous.examples || []), ...row.examples])).slice(0, 8),
      missedExamples: Array.from(new Set([...(previous.missedExamples || []), ...row.missedExamples])).slice(0, 8),
      updatedAt: attempt.completedAt
    };
  });

  return next;
}

export function loadAssessmentAttempts({ teacherId = "local", studentId = "", classId = "" } = {}) {
  if (typeof localStorage === "undefined") return [];
  const stored = safeParse(localStorage.getItem(getStorageKey(teacherId)), []);
  return (Array.isArray(stored) ? stored : [])
    .map(normalizeAssessmentAttempt)
    .filter(record => (!studentId || record.studentId === studentId) && (!classId || record.classId === classId))
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
}

export function saveAssessmentAttemptLocal(record, { teacherId = record.teacherId || "local" } = {}) {
  if (typeof localStorage === "undefined") return [normalizeAssessmentAttempt(record)];
  const normalized = normalizeAssessmentAttempt({ ...record, teacherId: record.teacherId || teacherId });
  const existing = loadAssessmentAttempts({ teacherId });
  const withoutDuplicate = existing.filter(item => item.attemptId !== normalized.attemptId);
  const next = [normalized, ...withoutDuplicate].sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
  localStorage.setItem(getStorageKey(teacherId), JSON.stringify(next));
  return next;
}

export async function saveAssessmentAttempt(record, { teacherId = record.teacherId || "local", supabase = null } = {}) {
  const normalized = normalizeAssessmentAttempt({ ...record, teacherId: record.teacherId || teacherId });
  const localRecords = saveAssessmentAttemptLocal(normalized, { teacherId });

  if (supabase) {
    try {
      await supabase
        .from("assessment_attempts")
        .upsert({
          attempt_id: normalized.attemptId,
          student_id: normalized.studentId,
          class_id: normalized.classId || null,
          teacher_id: normalized.teacherId || null,
          skill_id: normalized.skillId,
          skill_name: normalized.skillName,
          skill_level: normalized.skillLevel,
          skill_phase: normalized.skillPhase,
          completed_at: normalized.completedAt,
          total_questions: normalized.totalQuestions,
          correct_count: normalized.correctCount,
          accuracy: normalized.accuracy,
          status: normalized.status,
          payload: normalized
        }, { onConflict: "attempt_id" });
    } catch (error) {
      console.warn("Assessment attempt saved locally; Supabase assessment_attempts write is unavailable.", error);
    }
  }

  return localRecords;
}

export function buildAssessmentAttemptRecord({
  studentId,
  studentName,
  classId,
  teacherId,
  stage,
  checkpoint,
  questionRecords = [],
  assessmentType = "skill_checkpoint"
}) {
  const normalizedQuestions = questionRecords.map(record => ({
    questionId: record.questionId,
    prompt: record.question,
    targetWord: record.targetWord,
    targetLetter: record.targetLetter,
    targetSound: record.targetSound,
    targetPattern: record.targetPattern,
    itemKey: record.itemKey,
    itemType: record.itemType,
    correctAnswer: record.correct,
    selectedAnswer: record.chosen,
    isCorrect: record.isCorrect,
    skillId: record.skillId || stage?.id,
    templateType: record.templateType || record.formatType,
    tags: record.tags || [],
    level: record.itemLevel || checkpoint?.pathStatus?.level || 1,
    phase: record.itemPhase || checkpoint?.pathStatus?.phase || 1,
    timestamp: record.timestamp || new Date().toISOString()
  }));
  const missedItems = normalizedQuestions
    .filter(record => !record.isCorrect)
    .map(record => record.targetWord || record.itemKey || record.correctAnswer)
    .filter(Boolean);

  const normalized = normalizeAssessmentAttempt({
    studentId,
    studentName,
    classId,
    teacherId,
    assessmentType,
    skillId: checkpoint?.skillId || stage?.id || normalizedQuestions[0]?.skillId || "",
    skillName: stage?.label || checkpoint?.skillLabel || "Assessment",
    skillLevel: checkpoint?.pathStatus?.level || normalizedQuestions[0]?.level || 1,
    skillPhase: checkpoint?.pathStatus?.phase || normalizedQuestions[0]?.phase || 1,
    completedAt: new Date().toISOString(),
    totalQuestions: normalizedQuestions.length,
    correctCount: normalizedQuestions.filter(record => record.isCorrect).length,
    passed: checkpoint?.passed,
    status: checkpoint?.passed ? "mastered" : "needs_retry",
    masteredItems: checkpoint?.totalCoveredItems || [],
    missedItems,
    itemKeysCovered: checkpoint?.coveredThisRound || [],
    contentCoverage: checkpoint?.coverage || {},
    levelUnlocked: checkpoint?.pathStatus?.nextStep ? checkpoint.pathStatus.nextActionLabel : checkpoint?.nextSkillLabel || "",
    questionRecords: normalizedQuestions
  });
  const mastery = extractMasteryFromAssessmentAttempt(normalized);

  return normalizeAssessmentAttempt({
    ...normalized,
    masteredItems: normalized.masteredItems?.length ? normalized.masteredItems : mastery.masteredItems.map(row => row.itemKey),
    developingItems: mastery.developingItems.map(row => row.itemKey),
    needsSupportItems: mastery.needsSupportItems.map(row => row.itemKey)
  });
}

export function summarizeAssessmentHistory(records = [], { students = [], classes = [] } = {}) {
  const normalized = records.map(normalizeAssessmentAttempt);
  const studentById = new Map(students.map(student => [student.id, student]));
  const classById = new Map(classes.map(row => [row.id, row]));
  const skillMap = new Map();
  const studentMap = new Map();
  let correct = 0;
  let total = 0;

  normalized.forEach(record => {
    correct += record.correctCount;
    total += record.totalQuestions;
    const skill = skillMap.get(record.skillId) || { skillId: record.skillId, skillName: record.skillName, attempts: 0, correct: 0, total: 0, mastered: 0 };
    skill.attempts += 1;
    skill.correct += record.correctCount;
    skill.total += record.totalQuestions;
    if (record.passed) skill.mastered += 1;
    skillMap.set(record.skillId, skill);

    const student = studentMap.get(record.studentId) || {
      studentId: record.studentId,
      studentName: record.studentName || studentById.get(record.studentId)?.name || "Student",
      className: classById.get(record.classId)?.name || studentById.get(record.studentId)?.className || "",
      attempts: 0,
      correct: 0,
      total: 0,
      latest: null,
      masteredSkills: new Set(),
      supportSkills: new Set()
    };
    student.attempts += 1;
    student.correct += record.correctCount;
    student.total += record.totalQuestions;
    student.latest = !student.latest || new Date(record.completedAt) > new Date(student.latest.completedAt) ? record : student.latest;
    if (record.passed) student.masteredSkills.add(record.skillName);
    else student.supportSkills.add(record.skillName);
    studentMap.set(record.studentId, student);
  });

  const skills = Array.from(skillMap.values()).map(skill => ({
    ...skill,
    accuracy: skill.total ? Math.round((skill.correct / skill.total) * 100) : 0,
    status: skill.total === 0 ? "not assessed" : skill.correct / skill.total >= 0.85 ? "on track" : skill.correct / skill.total >= 0.65 ? "developing" : "needs support"
  }));
  const studentsSummary = Array.from(studentMap.values()).map(student => ({
    ...student,
    accuracy: student.total ? Math.round((student.correct / student.total) * 100) : 0,
    masteredSkills: Array.from(student.masteredSkills),
    supportSkills: Array.from(student.supportSkills)
  }));

  return {
    attempts: normalized.length,
    totalQuestions: total,
    correctCount: correct,
    averageAccuracy: total ? Math.round((correct / total) * 100) : 0,
    latestAttempt: normalized[0] || null,
    skills,
    students: studentsSummary,
    strongestSkills: [...skills].sort((a, b) => b.accuracy - a.accuracy).slice(0, 3),
    weakestSkills: [...skills].filter(skill => skill.total > 0).sort((a, b) => a.accuracy - b.accuracy).slice(0, 5),
    studentsNeedingSupport: studentsSummary.filter(student => student.accuracy < 70 || student.supportSkills.length > 0).slice(0, 8),
    studentsReadyToLevelUp: studentsSummary.filter(student => student.latest?.passed).slice(0, 8)
  };
}

export function exportAssessmentAttemptsCsv(records = []) {
  const rows = [
    ["attemptId", "studentName", "studentId", "classId", "skillName", "skillLevel", "skillPhase", "completedAt", "totalQuestions", "correctCount", "accuracy", "status"]
  ];
  records.map(normalizeAssessmentAttempt).forEach(record => {
    rows.push([
      record.attemptId,
      record.studentName,
      record.studentId,
      record.classId,
      record.skillName,
      record.skillLevel,
      record.skillPhase,
      record.completedAt,
      record.totalQuestions,
      record.correctCount,
      record.accuracy,
      record.status
    ]);
  });

  return rows.map(row => row.map(value => `"${String(value ?? "").replace(/"/g, "\"\"")}"`).join(",")).join("\n");
}

export function getAssessmentAttemptContractIssues(record = {}) {
  const normalized = normalizeAssessmentAttempt(record);
  return REQUIRED_ATTEMPT_FIELDS.filter(field => {
    if (field === "questionRecords") return !Array.isArray(normalized.questionRecords);
    return normalized[field] === undefined || normalized[field] === null || normalized[field] === "";
  });
}

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
    missedItems: record.missedItems || [],
    itemKeysCovered: record.itemKeysCovered || [],
    contentCoverage: record.contentCoverage || {},
    levelUnlocked: record.levelUnlocked || "",
    questionRecords: questionRecords.map((item, index) => ({
      questionId: item.questionId || "",
      prompt: item.prompt || item.question || "",
      targetWord: item.targetWord || item.diagnosticTarget || item.itemKey || "",
      itemKey: item.itemKey || "",
      correctAnswer: item.correctAnswer ?? item.correct ?? "",
      selectedAnswer: item.selectedAnswer ?? item.chosen ?? "",
      isCorrect: Boolean(item.isCorrect),
      skillId: item.skillId || record.skillId || "",
      level: Number(item.level || item.itemLevel || record.skillLevel || 1),
      phase: Number(item.phase || item.itemPhase || record.skillPhase || 1),
      timestamp: normalizeDate(item.timestamp) || completedAt,
      order: index + 1
    })),
    appVersion: record.appVersion || "local",
    schemaVersion: record.schemaVersion || 1
  };
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
    itemKey: record.itemKey,
    correctAnswer: record.correct,
    selectedAnswer: record.chosen,
    isCorrect: record.isCorrect,
    skillId: record.skillId || stage?.id,
    level: record.itemLevel || checkpoint?.pathStatus?.level || 1,
    phase: record.itemPhase || checkpoint?.pathStatus?.phase || 1,
    timestamp: record.timestamp || new Date().toISOString()
  }));
  const missedItems = normalizedQuestions
    .filter(record => !record.isCorrect)
    .map(record => record.targetWord || record.itemKey || record.correctAnswer)
    .filter(Boolean);

  return normalizeAssessmentAttempt({
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

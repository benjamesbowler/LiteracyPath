import { normalizeAssessmentAttempt } from "./assessmentHistoryStore.js";
import {
  buildClassElFormalAssessmentReport,
  buildIndividualElFormalAssessmentReport
} from "./elFormalAssessmentReportBuilder.js";

const STORAGE_PREFIX = "lpElAssessmentReports:v1";
export const EL_REPORT_SCHEMA_VERSION = 1;

export const EL_SKILL_AREAS = [
  {
    area: "Phonological Awareness",
    skills: ["Initial Sounds", "Final Sounds", "Rhyming"]
  },
  {
    area: "Phonics / Decoding",
    skills: [
      "CVC and Short Vowels",
      "Short Vowel Discrimination",
      "Blends",
      "Digraphs",
      "Long Vowels and Silent E",
      "Vowel Teams",
      "R-Controlled Vowels",
      "Advanced Phonics Patterns"
    ]
  },
  {
    area: "High-Frequency Words",
    skills: [
      "High-Frequency Words 1-25",
      "High-Frequency Words 26-50",
      "High-Frequency Words 51-100"
    ]
  },
  {
    area: "Grammar / Mechanics",
    skills: [
      "Nouns",
      "Verbs",
      "Adjectives",
      "Prepositions of Place",
      "Plurals",
      "Prefixes and Suffixes"
    ]
  },
  {
    area: "Vocabulary / Language",
    skills: [
      "Antonyms and Synonyms",
      "Homophones and Homonyms",
      "Context Clues"
    ]
  },
  {
    area: "Comprehension",
    skills: [
      "Sentence Comprehension",
      "Key Details",
      "Sequencing",
      "Main Idea",
      "Inference",
      "Cause and Effect",
      "Theme and Higher Comprehension"
    ]
  }
];

const DEFAULT_SKILLS = EL_SKILL_AREAS.flatMap(group => group.skills);
const ADVANCED_PHONICS_SKILL_ID = "advanced_phonics_patterns";
const ADVANCED_PHONICS_SKILL_NAME = "Advanced Phonics Patterns";

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

function slugify(value) {
  return String(value || "report")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "report";
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function average(values = []) {
  const numeric = values.map(Number).filter(Number.isFinite);
  if (!numeric.length) return 0;
  return Math.round(numeric.reduce((sum, value) => sum + value, 0) / numeric.length);
}

function uniq(values = []) {
  return Array.from(new Set(values.filter(Boolean)));
}

function normalizePatternKey(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\s+/g, " ");
}

function getStudentClassId(student = {}) {
  return student.classId || student.class_id || "";
}

function getStudentName(student = {}, fallback = "Unknown Student") {
  return student.name || student.studentName || fallback;
}

function getClassNameForId(classId = "", classes = []) {
  return classes.find(row => row.id === classId)?.name || "";
}

function getClassNameForStudent(student = {}, classes = []) {
  return student.className || getClassNameForId(getStudentClassId(student), classes) || "Unknown Class";
}

function normalizeRecords(records = []) {
  return (Array.isArray(records) ? records : []).map(normalizeAssessmentAttempt);
}

function getStatusFromAccuracy(accuracy, attempts = 0) {
  if (!attempts) return "Not Assessed";
  if (accuracy >= 85) return "Mastered";
  if (accuracy >= 65) return "Developing";
  return "Needs Support";
}

function isAdvancedPhonicsRecord(record = {}) {
  return record.skillId === ADVANCED_PHONICS_SKILL_ID ||
    record.assessmentType === ADVANCED_PHONICS_SKILL_ID ||
    String(record.skillName || "").toLowerCase().includes("advanced phonics");
}

function getNextStepForStatus(status, skillName) {
  if (status === "Mastered") return "Keep practicing in connected reading.";
  if (status === "Developing") return `Review ${skillName} with a short small-group check.`;
  if (status === "Needs Support") return `Reteach ${skillName} with targeted examples.`;
  return "Complete an assessment to gather evidence.";
}

export function getElSkillArea(skillNameOrId = "") {
  const normalized = String(skillNameOrId).toLowerCase();
  const group = EL_SKILL_AREAS.find(item =>
    item.skills.some(skill => skill.toLowerCase() === normalized || normalized.includes(skill.toLowerCase()))
  );
  return group?.area || "Other Literacy";
}

function getSkillUniverse(records = []) {
  return uniq([
    ...DEFAULT_SKILLS,
    ADVANCED_PHONICS_SKILL_NAME,
    ...records.map(record => record.skillName).filter(Boolean)
  ]);
}

function buildPatternDetailRows(records = [], students = [], classes = []) {
  const studentById = new Map(students.map(student => [student.id, student]));
  const classById = new Map(classes.map(row => [row.id, row]));
  const groups = new Map();

  records.filter(isAdvancedPhonicsRecord).forEach(record => {
    const student = studentById.get(record.studentId) || {};
    const className = classById.get(record.classId)?.name || getClassNameForStudent(student, classes);
    const questionRows = record.questionRecords?.length ? record.questionRecords : record.answers || [];
    questionRows.forEach(question => {
      const pattern = normalizePatternKey(question.targetPattern || question.pattern || question.itemKey || question.correctAnswer);
      if (!pattern) return;
      const groupKey = `${record.studentId || record.studentName}::${pattern}`;
      const group = groups.get(groupKey) || {
        studentId: record.studentId,
        studentName: record.studentName || getStudentName(student),
        className,
        pattern,
        attempts: 0,
        correct: 0,
        incorrect: 0,
        examples: new Set(),
        latestDate: record.completedAt || ""
      };
      group.attempts += 1;
      if (question.isCorrect) group.correct += 1;
      else group.incorrect += 1;
      const example = question.targetWord || question.correctAnswer;
      if (example && example !== pattern) group.examples.add(example);
      if (!group.latestDate || new Date(record.completedAt) > new Date(group.latestDate)) {
        group.latestDate = record.completedAt;
      }
      groups.set(groupKey, group);
    });
  });

  return Array.from(groups.values())
    .map(row => {
      const accuracy = row.attempts ? Math.round((row.correct / row.attempts) * 100) : 0;
      return {
        ...row,
        accuracy,
        status: getStatusFromAccuracy(accuracy, row.attempts),
        examples: Array.from(row.examples).slice(0, 8)
      };
    })
    .sort((a, b) => a.studentName.localeCompare(b.studentName) || a.pattern.localeCompare(b.pattern));
}

function buildAdvancedPhonicsSummary(records = []) {
  const advancedRecords = records.filter(isAdvancedPhonicsRecord)
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
  const latest = advancedRecords[0] || null;
  const rows = buildPatternDetailRows(advancedRecords);
  return {
    attempts: advancedRecords.length,
    latestDate: latest?.completedAt || "",
    latestAccuracy: latest?.accuracy || 0,
    masteredPatterns: rows.filter(row => row.status === "Mastered").map(row => row.pattern),
    developingPatterns: rows.filter(row => row.status === "Developing").map(row => row.pattern),
    needsSupportPatterns: rows.filter(row => row.status === "Needs Support").map(row => row.pattern),
    patternRows: rows
  };
}

function buildDateRange(records = []) {
  const dates = records.map(record => record.completedAt).filter(Boolean).sort();
  return {
    start: dates[0] || "",
    end: dates.at(-1) || ""
  };
}

function collectSkillRows(records = [], { includeAllSkills = true } = {}) {
  const skillNames = includeAllSkills ? getSkillUniverse(records) : uniq(records.map(record => record.skillName));
  return skillNames.map(skillName => {
    const skillRecords = records.filter(record => record.skillName === skillName || record.skillId === skillName);
    const totalQuestions = skillRecords.reduce((sum, record) => sum + Number(record.totalQuestions || 0), 0);
    const correctCount = skillRecords.reduce((sum, record) => sum + Number(record.correctCount || 0), 0);
    const accuracy = totalQuestions ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const status = getStatusFromAccuracy(accuracy, skillRecords.length);
    const mastered = uniq(skillRecords.flatMap(record => record.masteredItems || record.itemKeysCovered || []));
    const missed = uniq(skillRecords.flatMap(record => record.missedItems || []));
    const latest = skillRecords.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))[0];

    return {
      skillArea: getElSkillArea(skillName),
      skillName,
      currentLevel: latest ? `L${latest.skillLevel || 1} P${latest.skillPhase || 1}` : "",
      attempts: skillRecords.length,
      totalQuestions,
      correctCount,
      accuracy,
      masteryStatus: status,
      itemsMastered: mastered,
      itemsMissed: missed,
      lastAssessed: latest?.completedAt || "",
      recommendedNextStep: getNextStepForStatus(status, skillName)
    };
  });
}

function buildAttemptRows(records = []) {
  return records
    .slice()
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
    .map(record => ({
      attemptId: record.attemptId,
      date: record.completedAt,
      skill: record.skillName,
      level: `L${record.skillLevel || 1} P${record.skillPhase || 1}`,
      questions: record.totalQuestions,
      correct: record.correctCount,
      accuracy: record.accuracy,
      status: record.status || (record.passed ? "mastered" : "needs_retry"),
      itemsCovered: record.itemKeysCovered || [],
      missedItems: record.missedItems || []
    }));
}

function buildProgressRows(records = []) {
  const sorted = records.slice().sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt));
  const mastered = new Set();
  return sorted.map(record => {
    if (record.passed || record.status === "mastered") mastered.add(record.skillName);
    return {
      date: record.completedAt,
      skill: record.skillName,
      accuracy: record.accuracy,
      masteredSkillCount: mastered.size,
      level: `L${record.skillLevel || 1} P${record.skillPhase || 1}`,
      notes: record.passed ? "Mastered or passed" : "Needs more evidence"
    };
  });
}

export function compareElAssessmentReports(currentReport = {}, previousReport = null) {
  if (!previousReport) {
    return {
      previousReportId: "",
      previousGeneratedAt: "",
      accuracyChange: 0,
      masteredSkillChange: 0,
      newlyMasteredSkills: [],
      persistentFocusSkills: currentReport.summary?.focusSkills || [],
      improvedSkills: [],
      declinedSkills: [],
      note: "No previous report available yet."
    };
  }

  const currentSummary = currentReport.summary || {};
  const previousSummary = previousReport.summary || {};
  const currentMastered = new Set((currentReport.skillRows || []).filter(row => row.masteryStatus === "Mastered").map(row => row.skillName));
  const previousMastered = new Set((previousReport.skillRows || []).filter(row => row.masteryStatus === "Mastered").map(row => row.skillName));
  const currentFocus = new Set(currentSummary.focusSkills || []);
  const previousFocus = new Set(previousSummary.focusSkills || []);
  const previousSkills = new Map((previousReport.skillRows || []).map(row => [row.skillName, row]));

  return {
    previousReportId: previousReport.reportId || "",
    previousGeneratedAt: previousReport.generatedAt || "",
    accuracyChange: Number(currentSummary.averageAccuracy || 0) - Number(previousSummary.averageAccuracy || 0),
    masteredSkillChange: Number(currentSummary.masteredSkillCount || 0) - Number(previousSummary.masteredSkillCount || 0),
    newlyMasteredSkills: Array.from(currentMastered).filter(skill => !previousMastered.has(skill)),
    persistentFocusSkills: Array.from(currentFocus).filter(skill => previousFocus.has(skill)),
    improvedSkills: (currentReport.skillRows || [])
      .filter(row => previousSkills.has(row.skillName) && Number(row.accuracy || 0) > Number(previousSkills.get(row.skillName).accuracy || 0))
      .map(row => row.skillName),
    declinedSkills: (currentReport.skillRows || [])
      .filter(row => previousSkills.has(row.skillName) && Number(row.accuracy || 0) < Number(previousSkills.get(row.skillName).accuracy || 0))
      .map(row => row.skillName),
    note: ""
  };
}

function findPreviousReport({ previousReports = [], reportType, classId, studentId, generatedAt }) {
  return (previousReports || [])
    .filter(report =>
      report.reportType === reportType &&
      (!classId || report.classId === classId) &&
      (!studentId || report.studentId === studentId) &&
      (!generatedAt || new Date(report.generatedAt) < new Date(generatedAt))
    )
    .sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt))[0] || null;
}

function makeReportId(reportType, classId, studentId, generatedAt) {
  return `el_${reportType}_${slugify(classId || "class")}_${slugify(studentId || "all")}_${new Date(generatedAt).getTime()}`;
}

function buildReportSummary(skillRows = [], records = []) {
  const mastered = skillRows.filter(row => row.masteryStatus === "Mastered");
  const developing = skillRows.filter(row => row.masteryStatus === "Developing");
  const support = skillRows.filter(row => row.masteryStatus === "Needs Support");
  const assessed = skillRows.filter(row => row.attempts > 0);

  return {
    totalAssessments: records.length,
    averageAccuracy: average(records.map(record => record.accuracy)),
    masteredSkillCount: mastered.length,
    developingSkillCount: developing.length,
    needsSupportSkillCount: support.length,
    strongestSkills: assessed.slice().sort((a, b) => b.accuracy - a.accuracy).slice(0, 5).map(row => row.skillName),
    focusSkills: support.slice().sort((a, b) => a.accuracy - b.accuracy).slice(0, 6).map(row => row.skillName)
  };
}

export function buildStudentElAssessmentReportData({
  assessmentHistory = [],
  students = [],
  classes = [],
  studentId = "",
  classId = "",
  teacherId = "",
  previousReports = []
} = {}) {
  const allRecords = normalizeRecords(assessmentHistory);
  const student = students.find(row => row.id === studentId) || {};
  const effectiveClassId = classId || getStudentClassId(student) || allRecords.find(record => record.studentId === studentId)?.classId || "";
  const records = allRecords.filter(record =>
    (!studentId || record.studentId === studentId) &&
    (!effectiveClassId || !record.classId || record.classId === effectiveClassId)
  );
  const generatedAt = new Date().toISOString();
  const studentName = getStudentName(student, records[0]?.studentName || "Unknown Student");
  const className = getClassNameForId(effectiveClassId, classes) || getClassNameForStudent(student, classes);
  const skillRows = collectSkillRows(records);
  const attemptRows = buildAttemptRows(records);
  const progressRows = buildProgressRows(records);
  const advancedPhonics = buildAdvancedPhonicsSummary(records);
  const formalAssessments = buildIndividualElFormalAssessmentReport({
    student,
    assessmentHistory: records
  });
  const summary = buildReportSummary(skillRows, records);
  const report = {
    reportId: makeReportId("individual", effectiveClassId, studentId || studentName, generatedAt),
    reportType: "individual",
    classId: effectiveClassId,
    className,
    studentId,
    studentName,
    teacherId,
    generatedAt,
    dateRange: buildDateRange(records),
    assessmentWindow: "All saved attempts",
    sourceAttemptIds: records.map(record => record.attemptId),
    summary,
    skillRows,
    studentRows: [],
    attemptRows,
    progressRows,
    smallGroups: [],
    heatmapRows: [],
    advancedPhonics,
    patternDetailRows: advancedPhonics.patternRows,
    formalAssessments,
    fileName: `el-assessment-student-${slugify(studentName)}-${formatDate(generatedAt)}.xlsx`,
    schemaVersion: EL_REPORT_SCHEMA_VERSION
  };
  const previous = findPreviousReport({ previousReports, reportType: "individual", classId: effectiveClassId, studentId, generatedAt });
  report.comparison = compareElAssessmentReports(report, previous);
  report.sourceSnapshot = {
    records,
    students: studentId ? [student].filter(row => row.id) : [],
    classes
  };
  return report;
}

function buildStudentRows({ records = [], students = [], classes = [], skillRowsByStudent = new Map() }) {
  return students.map(student => {
    const studentRecords = records.filter(record => record.studentId === student.id);
    const skillRows = skillRowsByStudent.get(student.id) || collectSkillRows(studentRecords);
    const summary = buildReportSummary(skillRows, studentRecords);
    const latest = studentRecords.slice().sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))[0];
    return {
      studentId: student.id,
      studentName: getStudentName(student),
      className: getClassNameForStudent(student, classes),
      assessmentsCompleted: studentRecords.length,
      averageAccuracy: summary.averageAccuracy,
      skillsMastered: summary.masteredSkillCount,
      skillsDeveloping: summary.developingSkillCount,
      skillsNeedingSupport: summary.needsSupportSkillCount,
      currentLevel: latest ? `L${latest.skillLevel || 1} P${latest.skillPhase || 1}` : "",
      lastAssessmentDate: latest?.completedAt || "",
      recommendedFocus: summary.focusSkills.slice(0, 3).join(", ") || "Gather more assessment evidence",
      focusSkills: summary.focusSkills
    };
  });
}

function buildClassSkillRows({ records = [], students = [] }) {
  const skillNames = getSkillUniverse(records);
  return skillNames.map(skillName => {
    const studentStatuses = students.map(student => {
      const studentSkillRecords = records.filter(record => record.studentId === student.id && record.skillName === skillName);
      const total = studentSkillRecords.reduce((sum, record) => sum + record.totalQuestions, 0);
      const correct = studentSkillRecords.reduce((sum, record) => sum + record.correctCount, 0);
      const accuracy = total ? Math.round((correct / total) * 100) : 0;
      return getStatusFromAccuracy(accuracy, studentSkillRecords.length);
    });
    const skillRecords = records.filter(record => record.skillName === skillName);
    return {
      skillArea: getElSkillArea(skillName),
      skillName,
      studentsMastered: studentStatuses.filter(status => status === "Mastered").length,
      studentsDeveloping: studentStatuses.filter(status => status === "Developing").length,
      studentsNeedingSupport: studentStatuses.filter(status => status === "Needs Support").length,
      notAssessed: studentStatuses.filter(status => status === "Not Assessed").length,
      classAverageAccuracy: average(skillRecords.map(record => record.accuracy)),
      suggestedSmallGroup: studentStatuses.includes("Needs Support") ? `Reteach ${skillName}` : "Monitor"
    };
  });
}

function buildHeatmapRows({ records = [], students = [], skillRowsByStudent = new Map() }) {
  const skillNames = getSkillUniverse(records);
  return students.map(student => {
    const skillRows = new Map((skillRowsByStudent.get(student.id) || collectSkillRows(records.filter(record => record.studentId === student.id))).map(row => [row.skillName, row]));
    return {
      studentId: student.id,
      studentName: getStudentName(student),
      values: Object.fromEntries(skillNames.map(skillName => [
        skillName,
        skillRows.get(skillName)?.masteryStatus || "Not Assessed"
      ]))
    };
  });
}

function buildSmallGroups(studentRows = []) {
  const groups = new Map();
  studentRows.forEach(student => {
    (student.focusSkills || []).slice(0, 3).forEach(skill => {
      const group = groups.get(skill) || {
        groupName: `${skill} support group`,
        skill,
        students: [],
        reason: "Students have recent evidence below mastery.",
        suggestedActivity: `Small-group review for ${skill}.`
      };
      group.students.push(student.studentName);
      groups.set(skill, group);
    });
  });
  return Array.from(groups.values()).slice(0, 12);
}

export function buildClassElAssessmentReportData({
  assessmentHistory = [],
  students = [],
  classes = [],
  classId = "",
  teacherId = "",
  previousReports = []
} = {}) {
  const allRecords = normalizeRecords(assessmentHistory);
  const classStudents = students.filter(student => !classId || getStudentClassId(student) === classId);
  const studentIdSet = new Set(classStudents.map(student => student.id));
  const records = allRecords.filter(record =>
    (!classId || !record.classId || record.classId === classId) &&
    (!studentIdSet.size || !record.studentId || studentIdSet.has(record.studentId))
  );
  const generatedAt = new Date().toISOString();
  const className = getClassNameForId(classId, classes) || classes[0]?.name || "Unknown Class";
  const skillRowsByStudent = new Map(classStudents.map(student => [
    student.id,
    collectSkillRows(records.filter(record => record.studentId === student.id))
  ]));
  const studentRows = buildStudentRows({ records, students: classStudents, classes, skillRowsByStudent });
  const skillRows = buildClassSkillRows({ records, students: classStudents });
  const heatmapRows = buildHeatmapRows({ records, students: classStudents, skillRowsByStudent });
  const patternDetailRows = buildPatternDetailRows(records, classStudents, classes);
  const advancedPhonics = buildAdvancedPhonicsSummary(records);
  const formalAssessments = buildClassElFormalAssessmentReport({
    students: classStudents,
    assessmentHistory: records,
    classId
  });
  const smallGroups = buildSmallGroups(studentRows);
  const summary = buildReportSummary(skillRows.map(row => ({
    skillName: row.skillName,
    attempts: records.filter(record => record.skillName === row.skillName).length,
    accuracy: row.classAverageAccuracy,
    masteryStatus: row.studentsNeedingSupport > 0 ? "Needs Support" : row.studentsDeveloping > 0 ? "Developing" : row.studentsMastered > 0 ? "Mastered" : "Not Assessed"
  })), records);
  summary.totalStudents = classStudents.length;
  summary.studentsNeedingSupport = studentRows.filter(row => row.skillsNeedingSupport > 0).map(row => row.studentName);
  summary.studentsReadyForChallenge = studentRows.filter(row => row.skillsMastered > 0 && row.averageAccuracy >= 85).map(row => row.studentName);
  const report = {
    reportId: makeReportId("whole_class", classId || className, "all", generatedAt),
    reportType: "whole_class",
    classId,
    className,
    studentId: "",
    studentName: "",
    teacherId,
    generatedAt,
    dateRange: buildDateRange(records),
    assessmentWindow: "All saved attempts",
    sourceAttemptIds: records.map(record => record.attemptId),
    summary,
    skillRows,
    studentRows,
    attemptRows: buildAttemptRows(records),
    progressRows: buildProgressRows(records),
    heatmapRows,
    smallGroups,
    advancedPhonics,
    patternDetailRows,
    formalAssessments,
    fileName: `el-assessment-class-${slugify(className)}-${formatDate(generatedAt)}.xlsx`,
    schemaVersion: EL_REPORT_SCHEMA_VERSION
  };
  const previous = findPreviousReport({ previousReports, reportType: "whole_class", classId, generatedAt });
  report.comparison = compareElAssessmentReports(report, previous);
  report.sourceSnapshot = {
    records,
    students: classStudents,
    classes
  };
  return report;
}

export function getSavedElAssessmentReports({ teacherId = "local", reportType = "", classId = "", studentId = "" } = {}) {
  if (typeof localStorage === "undefined") return [];
  const stored = safeParse(localStorage.getItem(getStorageKey(teacherId)), []);
  return (Array.isArray(stored) ? stored : [])
    .filter(report =>
      (!reportType || report.reportType === reportType) &&
      (!classId || report.classId === classId) &&
      (!studentId || report.studentId === studentId)
    )
    .sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt));
}

export async function saveElAssessmentReport(report, { teacherId = report.teacherId || "local", supabase = null } = {}) {
  const normalized = {
    ...report,
    teacherId: report.teacherId || teacherId,
    schemaVersion: report.schemaVersion || EL_REPORT_SCHEMA_VERSION
  };

  if (typeof localStorage !== "undefined") {
    const existing = getSavedElAssessmentReports({ teacherId });
    const withoutDuplicate = existing.filter(item => item.reportId !== normalized.reportId);
    localStorage.setItem(getStorageKey(teacherId), JSON.stringify([normalized, ...withoutDuplicate]));
  }

  if (supabase) {
    try {
      await supabase.from("el_assessment_reports").upsert({
        report_id: normalized.reportId,
        report_type: normalized.reportType,
        class_id: normalized.classId || null,
        student_id: normalized.studentId || null,
        teacher_id: normalized.teacherId || null,
        generated_at: normalized.generatedAt,
        file_name: normalized.fileName,
        summary: normalized.summary,
        payload: normalized
      }, { onConflict: "report_id" });
    } catch (error) {
      console.warn("EL assessment report saved locally; Supabase el_assessment_reports write is unavailable.", error);
    }
  }

  return normalized;
}

export function deleteSavedElAssessmentReport(reportId, { teacherId = "local" } = {}) {
  if (typeof localStorage === "undefined") return [];
  const next = getSavedElAssessmentReports({ teacherId }).filter(report => report.reportId !== reportId);
  localStorage.setItem(getStorageKey(teacherId), JSON.stringify(next));
  return next;
}

export function regenerateElAssessmentWorkbookFromSavedReport(report = {}) {
  return {
    ...report,
    sourceSnapshot: report.sourceSnapshot || {}
  };
}

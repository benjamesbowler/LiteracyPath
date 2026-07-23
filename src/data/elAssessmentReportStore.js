import { normalizeAssessmentAttempt } from "./assessmentHistoryStore.js";
import {
  buildClassElFormalAssessmentReport,
  buildIndividualElFormalAssessmentReport,
  EL_BENCHMARK_ASSESSMENT_IDS,
  filterAssessmentHistoryForElBenchmarkScope,
  getElBenchmarkAssessmentId,
  isElBenchmarkAssessmentRecord,
  resolveElBenchmarkReportScope
} from "./elFormalAssessmentReportBuilder.js";
import {
  buildRecommendations,
  buildWeeklyAccuracy,
  formatItemLabel,
  getSkillArea,
  normalizeItemMasteryRows
} from "./reportingSystem.js";

const STORAGE_PREFIX = "lpElAssessmentReports:v1";
const LOCAL_REPORT_CACHE_MAX_COUNT = 12;
const LOCAL_REPORT_CACHE_MAX_BYTES = 4_250_000;
export const EL_REPORT_SCHEMA_VERSION = 2;

export const EL_SKILL_AREAS = [
  {
    area: "Phonological Awareness",
    skills: [
      "EL Phonological & Phonemic Awareness",
      "Initial Sounds",
      "Final Sounds",
      "Rhyming"
    ]
  },
  {
    area: "Phonics / Encoding & Decoding",
    skills: [
      "EL Encoding",
      "EL Decoding",
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
    area: "Oral Reading Fluency",
    skills: ["EL Oral Reading Fluency"]
  },
  {
    area: "High-Frequency Words",
    skills: [
      "High-Frequency Words 1-25",
      "High-Frequency Words 26-50",
      "High-Frequency Words 51-75",
      "High-Frequency Words 76-100"
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
const EL_REPORT_ASSESSMENT_IDS = new Set([
  "el_letter_assessment",
  ADVANCED_PHONICS_SKILL_ID,
  ...Object.values(EL_BENCHMARK_ASSESSMENT_IDS)
]);
const ADVANCED_PHONICS_SKILL_NAME = "Advanced Phonics Patterns";
const BENCHMARK_REPORT_SKILLS = Object.freeze([
  Object.freeze({
    assessmentId: EL_BENCHMARK_ASSESSMENT_IDS.PHONOLOGICAL_AWARENESS,
    skillName: "EL Phonological & Phonemic Awareness"
  }),
  Object.freeze({ assessmentId: EL_BENCHMARK_ASSESSMENT_IDS.ENCODING, skillName: "EL Encoding" }),
  Object.freeze({ assessmentId: EL_BENCHMARK_ASSESSMENT_IDS.DECODING, skillName: "EL Decoding" }),
  Object.freeze({ assessmentId: EL_BENCHMARK_ASSESSMENT_IDS.ORAL_READING_FLUENCY, skillName: "EL Oral Reading Fluency" })
]);

const BENCHMARK_ADMINISTRATION_LABELS = {
  completed: "Evidence Recorded",
  partial: "Partial Evidence",
  discontinued: "Discontinued",
  in_progress: "In Progress",
  not_administered: "Not Administered",
  not_scorable: "Not Scorable"
};

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

function nullableAverage(values = []) {
  const numeric = values
    .filter(value => value !== undefined && value !== null && value !== "")
    .map(Number)
    .filter(Number.isFinite);
  if (!numeric.length) return null;
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

function isElReportRecord(record = {}) {
  const explicitType = String(record.assessmentType || record.assessmentId || "").trim();
  if (explicitType && EL_REPORT_ASSESSMENT_IDS.has(explicitType)) return true;
  if (explicitType && explicitType !== "el_benchmark") return false;
  const benchmarkId = getElBenchmarkAssessmentId(record);
  if (benchmarkId) return EL_REPORT_ASSESSMENT_IDS.has(benchmarkId);
  return EL_REPORT_ASSESSMENT_IDS.has(String(record.skillId || "").trim());
}

function getStatusFromAccuracy(accuracy, attempts = 0) {
  if (!attempts) return "Not Assessed";
  if (accuracy >= 85) return "Mastered";
  if (accuracy >= 65) return "Developing";
  return "Needs Support";
}

function isAdvancedPhonicsRecord(record = {}) {
  if (isElBenchmarkAssessmentRecord(record)) return false;
  return record.skillId === ADVANCED_PHONICS_SKILL_ID ||
    record.assessmentType === ADVANCED_PHONICS_SKILL_ID ||
    String(record.skillName || "").toLowerCase().includes("advanced phonics");
}

function getBenchmarkSkillDefinition(skillName = "") {
  return BENCHMARK_REPORT_SKILLS.find(definition => definition.skillName === skillName) || null;
}

function benchmarkRecordsForDefinition(records = [], definition = {}) {
  return records.filter(record => getElBenchmarkAssessmentId(record) === definition.assessmentId);
}

function benchmarkEvidenceStatus(record = null) {
  if (!record) return "Not Assessed";
  const administrationStatus = String(record.administrationStatus || record.status || "completed").toLowerCase();
  return BENCHMARK_ADMINISTRATION_LABELS[administrationStatus] || "Evidence Recorded";
}

function benchmarkAccuracy(record = {}) {
  const scoredCount = Number(record.scoredCount ?? record.totalQuestions);
  if (!Number.isFinite(scoredCount) || scoredCount <= 0) return null;
  const domainAccuracy = Number(record.metrics?.accuracyRate ?? record.metrics?.wordAccuracyRate);
  if (Number.isFinite(domainAccuracy)) return domainAccuracy;
  if (record.accuracy === undefined || record.accuracy === null || record.accuracy === "") return null;
  const fallbackAccuracy = Number(record.accuracy);
  return Number.isFinite(fallbackAccuracy) ? fallbackAccuracy : null;
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
    ...records.filter(record => !isElBenchmarkAssessmentRecord(record)).map(record => record.skillName).filter(Boolean)
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
    const benchmarkDefinition = getBenchmarkSkillDefinition(skillName);
    const skillRecords = benchmarkDefinition
      ? benchmarkRecordsForDefinition(records, benchmarkDefinition)
      : records.filter(record => (
          !isElBenchmarkAssessmentRecord(record) &&
          (record.skillName === skillName || record.skillId === skillName)
        ));
    const totalQuestions = skillRecords.reduce((sum, record) => sum + Number(record.totalQuestions || 0), 0);
    const correctCount = skillRecords.reduce((sum, record) => sum + Number(record.correctCount || 0), 0);
    const accuracy = benchmarkDefinition
      ? nullableAverage(skillRecords.map(benchmarkAccuracy))
      : totalQuestions
        ? Math.round((correctCount / totalQuestions) * 100)
        : 0;
    const status = benchmarkDefinition
      ? benchmarkEvidenceStatus(skillRecords.slice().sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))[0])
      : getStatusFromAccuracy(accuracy, skillRecords.length);
    const mastered = uniq(skillRecords.flatMap(record => record.masteredItems || record.itemKeysCovered || []));
    const missed = uniq(skillRecords.flatMap(record => record.missedItems || []));
    const latest = skillRecords.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))[0];

    return {
      skillArea: getElSkillArea(skillName),
      skillName,
      currentLevel: benchmarkDefinition
        ? [latest?.gradePath, latest?.benchmarkWindow].filter(Boolean).join(" · ")
        : latest
          ? `L${latest.skillLevel ?? 1} P${latest.skillPhase ?? 1}`
          : "",
      attempts: skillRecords.length,
      totalQuestions,
      correctCount,
      accuracy,
      masteryStatus: status,
      statusModel: benchmarkDefinition ? "descriptive_benchmark_evidence" : "mastery_threshold",
      isProvisionalBenchmark: Boolean(benchmarkDefinition),
      assessmentId: benchmarkDefinition?.assessmentId || "",
      administrationStatus: latest?.administrationStatus || "",
      benchmarkWindow: latest?.benchmarkWindow || "",
      grade: latest?.gradePath || "",
      formVersion: latest?.formVersion || "",
      candidatePlacement: benchmarkDefinition ? latest?.candidatePlacement || null : null,
      confirmedPlacement: benchmarkDefinition ? latest?.confirmedPlacement || null : null,
      itemsMastered: benchmarkDefinition ? [] : mastered,
      itemsMissed: benchmarkDefinition ? [] : missed,
      lastAssessed: latest?.completedAt || "",
      recommendedNextStep: benchmarkDefinition
        ? "Review the descriptive domain evidence and confirm instructional placement with classroom evidence."
        : getNextStepForStatus(status, skillName)
    };
  });
}

function buildAttemptRows(records = []) {
  return records
    .slice()
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
    .map(record => {
      const benchmarkRecord = isElBenchmarkAssessmentRecord(record);
      return {
      attemptId: record.attemptId,
      date: record.completedAt,
      skill: record.skillName,
      level: record.skillLevel ?? 1,
      phase: record.skillPhase ?? 1,
      questions: record.totalQuestions,
      correct: record.correctCount,
      accuracy: benchmarkRecord ? benchmarkAccuracy(record) : record.accuracy,
      benchmarkMetrics: benchmarkRecord ? record.metrics || {} : {},
      passed: benchmarkRecord ? false : Boolean(record.passed || record.status === "mastered"),
      status: benchmarkRecord
        ? benchmarkEvidenceStatus(record)
        : record.status || (record.passed ? "mastered" : "needs_retry"),
      administrationStatus: record.administrationStatus || "",
      grade: benchmarkRecord ? record.gradePath || "" : "",
      benchmarkWindow: benchmarkRecord ? record.benchmarkWindow || "" : "",
      formVersion: benchmarkRecord ? record.formVersion || "" : "",
      isProvisionalBenchmark: benchmarkRecord,
      itemsMastered: benchmarkRecord ? [] : record.masteredItems || [],
      itemsCovered: record.itemKeysCovered || [],
      missedItems: benchmarkRecord ? [] : record.missedItems || [],
      notes: benchmarkRecord
        ? "Descriptive provisional benchmark evidence; no mastery cut score applied."
        : record.passed
          ? "Checkpoint passed."
          : "Needs more evidence."
      };
    });
}

function buildProgressRows(records = []) {
  const sorted = records.slice().sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt));
  const mastered = new Set();
  return sorted.map((record, index) => {
    const benchmarkRecord = isElBenchmarkAssessmentRecord(record);
    if (!benchmarkRecord && (record.passed || record.status === "mastered")) mastered.add(record.skillName);
    const recent = sorted
      .slice(Math.max(0, index - 4), index + 1)
      .filter(item => !isElBenchmarkAssessmentRecord(item));
    return {
      date: record.completedAt,
      skill: record.skillName,
      accuracy: benchmarkRecord ? benchmarkAccuracy(record) : record.accuracy,
      rollingAverage: benchmarkRecord ? null : average(recent.map(item => item.accuracy)),
      masteredSkillCount: mastered.size,
      level: record.skillLevel ?? 1,
      phase: record.skillPhase ?? 1,
      checkpointPassed: benchmarkRecord ? false : Boolean(record.passed || record.status === "mastered"),
      notes: benchmarkRecord
        ? `${benchmarkEvidenceStatus(record)} — descriptive provisional evidence`
        : record.passed
          ? "Mastered or passed"
          : "Needs more evidence"
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
  const currentComparableSkills = (currentReport.skillRows || []).filter(row => !row.isProvisionalBenchmark);
  const previousComparableSkills = (previousReport.skillRows || []).filter(row => !row.isProvisionalBenchmark);
  const currentMastered = new Set(currentComparableSkills.filter(row => row.masteryStatus === "Mastered").map(row => row.skillName));
  const previousMastered = new Set(previousComparableSkills.filter(row => row.masteryStatus === "Mastered").map(row => row.skillName));
  const currentFocus = new Set(currentSummary.focusSkills || []);
  const previousFocus = new Set(previousSummary.focusSkills || []);
  const previousSkills = new Map(previousComparableSkills.map(row => [row.skillName, row]));

  return {
    previousReportId: previousReport.reportId || "",
    previousGeneratedAt: previousReport.generatedAt || "",
    accuracyChange: Number(currentSummary.averageAccuracy || 0) - Number(previousSummary.averageAccuracy || 0),
    masteredSkillChange: Number(currentSummary.masteredSkillCount || 0) - Number(previousSummary.masteredSkillCount || 0),
    newlyMasteredSkills: Array.from(currentMastered).filter(skill => !previousMastered.has(skill)),
    persistentFocusSkills: Array.from(currentFocus).filter(skill => previousFocus.has(skill)),
    improvedSkills: currentComparableSkills
      .filter(row => previousSkills.has(row.skillName) && Number(row.accuracy || 0) > Number(previousSkills.get(row.skillName).accuracy || 0))
      .map(row => row.skillName),
    declinedSkills: currentComparableSkills
      .filter(row => previousSkills.has(row.skillName) && Number(row.accuracy || 0) < Number(previousSkills.get(row.skillName).accuracy || 0))
      .map(row => row.skillName),
    note: ""
  };
}

function reportMatchesBenchmarkScope(report = {}, benchmarkScope = {}) {
  if (!benchmarkScope.grade && !benchmarkScope.benchmarkWindow) return true;
  const reportScope = report.benchmarkScope || report.formalAssessments?.benchmarkScope || {};
  const normalizeGrade = value => {
    const grade = String(value || "").trim().toUpperCase().replace(/^GRADE\s*/, "");
    return ["K", "KG", "KINDERGARTEN", "0"].includes(grade) ? "K" : grade;
  };
  const requestedGrade = normalizeGrade(benchmarkScope.grade);
  const requestedWindow = String(benchmarkScope.benchmarkWindow || "").toUpperCase();
  return (!requestedGrade || normalizeGrade(reportScope.grade) === requestedGrade) &&
    (!requestedWindow || String(reportScope.benchmarkWindow || "").toUpperCase() === requestedWindow);
}

function findPreviousReport({
  previousReports = [],
  reportType,
  classId,
  studentId,
  generatedAt,
  benchmarkScope = {}
}) {
  return (previousReports || [])
    .filter(report =>
      report.reportType === reportType &&
      (!classId || report.classId === classId) &&
      (!studentId || report.studentId === studentId) &&
      reportMatchesBenchmarkScope(report, benchmarkScope) &&
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
  const assessed = skillRows.filter(row => row.attempts > 0 && !row.isProvisionalBenchmark);
  const thresholdRecords = records.filter(record => !isElBenchmarkAssessmentRecord(record));

  return {
    totalAssessments: records.length,
    benchmarkAssessmentCount: records.length - thresholdRecords.length,
    averageAccuracy: average(thresholdRecords.map(record => record.accuracy)),
    masteredSkillCount: mastered.length,
    developingSkillCount: developing.length,
    needsSupportSkillCount: support.length,
    strongestSkills: assessed.slice().sort((a, b) => b.accuracy - a.accuracy).slice(0, 5).map(row => row.skillName),
    focusSkills: support.slice().sort((a, b) => a.accuracy - b.accuracy).slice(0, 6).map(row => row.skillName)
  };
}

function buildStoredStudentArtifacts(records = [], skillRows = []) {
  const itemMasteryRows = normalizeItemMasteryRows({}, records);
  const focusSkill = skillRows.find(row => row.masteryStatus === "Needs Support") || skillRows[0] || {};
  return {
    itemMasteryRows,
    nextSessionPlan: buildRecommendations({
      itemRows: itemMasteryRows,
      currentStage: {
        id: focusSkill.skillId || "",
        label: focusSkill.skillName || ""
      },
      assessmentHistory: records
    })
  };
}

function buildStoredClassWeakPointRows(records = [], students = []) {
  const studentNameById = new Map(students.map(student => [student.id, getStudentName(student)]));
  const rowsByKey = new Map();
  students.forEach(student => {
    const studentRecords = records.filter(record => record.studentId === student.id);
    normalizeItemMasteryRows({}, studentRecords)
      .filter(row => row.attempts > 0 && row.accuracy < 70)
      .forEach(row => {
        const key = `${row.itemType}::${row.itemKey}`;
        const existing = rowsByKey.get(key) || {
          skillArea: getSkillArea({ skillId: row.skillId, skillName: row.skillName }).label,
          skillName: row.skillName,
          itemType: row.itemType,
          itemKey: row.itemKey,
          itemLabel: formatItemLabel(row.itemType, row.itemKey),
          attempts: 0,
          correct: 0,
          studentNames: new Set()
        };
        existing.attempts += Number(row.attempts || 0);
        existing.correct += Number(row.correct || 0);
        existing.studentNames.add(studentNameById.get(student.id) || student.id);
        rowsByKey.set(key, existing);
      });
  });
  return Array.from(rowsByKey.values())
    .map(row => ({
      ...row,
      accuracy: row.attempts ? Math.round((row.correct / row.attempts) * 100) : 0,
      supportShare: students.length ? Math.round((row.studentNames.size / students.length) * 100) : 0,
      studentNames: Array.from(row.studentNames).sort()
    }))
    .sort((a, b) => b.supportShare - a.supportShare || a.itemLabel.localeCompare(b.itemLabel));
}

function buildStoredClassWeeklyRows(records = []) {
  return buildWeeklyAccuracy(records).map(row => {
    const weekStart = new Date(row.weekStart);
    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);
    const weekRecords = records.filter(record => {
      const date = new Date(record.completedAt);
      return Number.isFinite(date.getTime()) && date >= weekStart && date < weekEnd;
    });
    return {
      ...row,
      checkpointsPassed: weekRecords.filter(record => record.passed).length,
      newSkillsStarted: new Set(weekRecords.map(record => record.skillName).filter(Boolean)).size
    };
  });
}

export function buildStudentElAssessmentReportData({
  assessmentHistory = [],
  students = [],
  classes = [],
  studentId = "",
  classId = "",
  teacherId = "",
  previousReports = [],
  benchmarkScope = null,
  benchmarkGrade = "",
  benchmarkWindow = ""
} = {}) {
  const allRecords = normalizeRecords(assessmentHistory).filter(isElReportRecord);
  const student = students.find(row => row.id === studentId) || {};
  const effectiveClassId = classId || getStudentClassId(student) || allRecords.find(record => record.studentId === studentId)?.classId || "";
  const studentRecords = allRecords.filter(record =>
    (!studentId || record.studentId === studentId) &&
    (!effectiveClassId || !record.classId || record.classId === effectiveClassId)
  );
  const resolvedBenchmarkScope = resolveElBenchmarkReportScope({
    records: studentRecords,
    benchmarkScope,
    benchmarkGrade,
    benchmarkWindow
  });
  const records = filterAssessmentHistoryForElBenchmarkScope(
    studentRecords,
    resolvedBenchmarkScope
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
    assessmentHistory: records,
    benchmarkScope: resolvedBenchmarkScope
  });
  const summary = buildReportSummary(skillRows, records);
  const storedArtifacts = buildStoredStudentArtifacts(records, skillRows);
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
    assessmentWindow: resolvedBenchmarkScope.isRouteScoped
      ? `All non-benchmark attempts; EL benchmark ${resolvedBenchmarkScope.label}`
      : "All saved attempts; no EL benchmark route available",
    benchmarkScope: resolvedBenchmarkScope,
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
    benchmarkProfile: formalAssessments.individualBenchmarkProfile || [],
    benchmarkDetails: formalAssessments.individualBenchmarkDetails || [],
    ...storedArtifacts,
    fileName: `el-assessment-student-${slugify(studentName)}-${slugify(resolvedBenchmarkScope.label)}-${formatDate(generatedAt)}.xlsx`,
    schemaVersion: EL_REPORT_SCHEMA_VERSION
  };
  const previous = findPreviousReport({
    previousReports,
    reportType: "individual",
    classId: effectiveClassId,
    studentId,
    generatedAt,
    benchmarkScope: resolvedBenchmarkScope
  });
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
      currentLevel: latest ? `L${latest.skillLevel ?? 1} P${latest.skillPhase ?? 1}` : "",
      lastAssessmentDate: latest?.completedAt || "",
      recommendedFocus: summary.focusSkills.slice(0, 3).join(", ") || "Gather more assessment evidence",
      focusSkills: summary.focusSkills
    };
  });
}

function buildClassSkillRows({ records = [], students = [] }) {
  const skillNames = getSkillUniverse(records);
  return skillNames.map(skillName => {
    const benchmarkDefinition = getBenchmarkSkillDefinition(skillName);
    if (benchmarkDefinition) {
      const skillRecords = benchmarkRecordsForDefinition(records, benchmarkDefinition);
      const statuses = students.map(student => {
        const studentRecords = skillRecords
          .filter(record => record.studentId === student.id)
          .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
        return benchmarkEvidenceStatus(studentRecords[0]);
      });
      const administrationCounts = {};
      skillRecords.forEach(record => {
        const status = String(record.administrationStatus || record.status || "completed").toLowerCase();
        administrationCounts[status] = Number(administrationCounts[status] || 0) + 1;
      });
      return {
        skillArea: getElSkillArea(skillName),
        skillName,
        assessmentId: benchmarkDefinition.assessmentId,
        statusModel: "descriptive_benchmark_evidence",
        isProvisionalBenchmark: true,
        studentsMastered: 0,
        studentsDeveloping: 0,
        studentsNeedingSupport: 0,
        studentsWithEvidence: statuses.filter(status => status !== "Not Assessed").length,
        studentsCompleted: statuses.filter(status => status === "Evidence Recorded").length,
        studentsPartial: statuses.filter(status => status === "Partial Evidence").length,
        studentsDiscontinued: statuses.filter(status => status === "Discontinued").length,
        notAssessed: statuses.filter(status => status === "Not Assessed").length,
        administrationCounts,
        classAverageAccuracy: nullableAverage(skillRecords.map(benchmarkAccuracy)),
        suggestedSmallGroup: "Review descriptive benchmark evidence; no provisional cut score is applied."
      };
    }
    const studentStatuses = students.map(student => {
      const studentSkillRecords = records.filter(record => (
        !isElBenchmarkAssessmentRecord(record) &&
        record.studentId === student.id &&
        record.skillName === skillName
      ));
      const total = studentSkillRecords.reduce((sum, record) => sum + record.totalQuestions, 0);
      const correct = studentSkillRecords.reduce((sum, record) => sum + record.correctCount, 0);
      const accuracy = total ? Math.round((correct / total) * 100) : 0;
      return getStatusFromAccuracy(accuracy, studentSkillRecords.length);
    });
    const skillRecords = records.filter(record => !isElBenchmarkAssessmentRecord(record) && record.skillName === skillName);
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
  previousReports = [],
  benchmarkScope = null,
  benchmarkGrade = "",
  benchmarkWindow = ""
} = {}) {
  const allRecords = normalizeRecords(assessmentHistory).filter(isElReportRecord);
  const classStudents = students.filter(student => !classId || getStudentClassId(student) === classId);
  const studentIdSet = new Set(classStudents.map(student => student.id));
  const classRecords = allRecords.filter(record =>
    (!classId || !record.classId || record.classId === classId) &&
    (!studentIdSet.size || !record.studentId || studentIdSet.has(record.studentId))
  );
  const resolvedBenchmarkScope = resolveElBenchmarkReportScope({
    records: classRecords,
    benchmarkScope,
    benchmarkGrade,
    benchmarkWindow
  });
  const records = filterAssessmentHistoryForElBenchmarkScope(
    classRecords,
    resolvedBenchmarkScope
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
    classId,
    benchmarkScope: resolvedBenchmarkScope
  });
  const smallGroups = buildSmallGroups(studentRows);
  const summary = buildReportSummary(skillRows.map(row => ({
    skillName: row.skillName,
    isProvisionalBenchmark: Boolean(row.isProvisionalBenchmark),
    attempts: row.isProvisionalBenchmark
      ? Number(row.studentsWithEvidence || 0)
      : records.filter(record => record.skillName === row.skillName).length,
    accuracy: row.classAverageAccuracy,
    masteryStatus: row.isProvisionalBenchmark
      ? row.studentsWithEvidence > 0 ? "Evidence Recorded" : "Not Assessed"
      : row.studentsNeedingSupport > 0
        ? "Needs Support"
        : row.studentsDeveloping > 0
          ? "Developing"
          : row.studentsMastered > 0
            ? "Mastered"
            : "Not Assessed"
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
    assessmentWindow: resolvedBenchmarkScope.isRouteScoped
      ? `All non-benchmark attempts; EL benchmark ${resolvedBenchmarkScope.label}`
      : "All saved attempts; no EL benchmark route available",
    benchmarkScope: resolvedBenchmarkScope,
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
    benchmarkMatrix: formalAssessments.classBenchmarkMatrix || [],
    benchmarkDomainSummaries: formalAssessments.classBenchmarkDomainSummaries || [],
    benchmarkDetails: formalAssessments.classBenchmarkDetails || [],
    classWeakPointRows: buildStoredClassWeakPointRows(records, classStudents),
    weeklyAccuracyRows: buildStoredClassWeeklyRows(records),
    fileName: `el-assessment-class-${slugify(className)}-${slugify(resolvedBenchmarkScope.label)}-${formatDate(generatedAt)}.xlsx`,
    schemaVersion: EL_REPORT_SCHEMA_VERSION
  };
  const previous = findPreviousReport({
    previousReports,
    reportType: "whole_class",
    classId,
    generatedAt,
    benchmarkScope: resolvedBenchmarkScope
  });
  report.comparison = compareElAssessmentReports(report, previous);
  report.sourceSnapshot = {
    records,
    students: classStudents,
    classes
  };
  return report;
}

function savedReportTimestamp(report = {}) {
  const timestamp = new Date(report.generatedAt || report.updatedAt || 0).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function savedReportIdentity(report = {}) {
  return report.reportId || [
    report.reportType,
    report.teacherId,
    report.classId,
    report.studentId,
    report.generatedAt
  ].join("::");
}

function mergeSavedElAssessmentReports(...collections) {
  const merged = new Map();
  collections.flat().filter(Boolean).forEach(report => {
    const key = savedReportIdentity(report);
    const current = merged.get(key);
    if (!current || savedReportTimestamp(report) > savedReportTimestamp(current)) merged.set(key, report);
  });
  return Array.from(merged.values()).sort((a, b) => savedReportTimestamp(b) - savedReportTimestamp(a));
}

function readLocalSavedElAssessmentReports(teacherId = "local") {
  if (typeof localStorage === "undefined") return [];
  try {
    const stored = safeParse(localStorage.getItem(getStorageKey(teacherId)), []);
    return Array.isArray(stored) ? stored : [];
  } catch (error) {
    console.warn("Local EL assessment report cache is unavailable.", error);
    return [];
  }
}

function serializedByteLength(value) {
  const serialized = typeof value === "string" ? value : JSON.stringify(value);
  // localStorage persists UTF-16 DOM strings. Counting two bytes per code unit
  // is deliberately conservative across browser quota implementations.
  return serialized.length * 2;
}

function compactBenchmarkItemEvidence(item = {}) {
  return {
    questionId: item.questionId || "",
    itemKey: item.itemKey || "",
    prompt: item.prompt || "",
    targetWord: item.targetWord || "",
    targetPattern: item.targetPattern || "",
    targetSpelling: item.targetSpelling || "",
    studentSpelling: item.studentSpelling ?? "",
    exactResponse: item.exactResponse ?? "",
    responseStatus: item.responseStatus || "",
    notScorableReason: item.notScorableReason || "",
    notScorableNote: item.notScorableNote || "",
    scoringCode: item.scoringCode || "",
    isCorrect: item.isCorrect ?? null,
    exact: item.exact ?? null,
    plausible: item.plausible ?? null,
    noResponse: item.noResponse ?? null,
    notYet: item.notYet ?? null,
    accurate: item.accurate ?? null,
    automatic: item.automatic ?? null,
    selfCorrected: item.selfCorrected ?? null,
    strand: item.strand || "",
    task: item.task || "",
    bandId: item.bandId || "",
    microphase: item.microphase ?? "",
    passageId: item.passageId || "",
    passageTitle: item.passageTitle || "",
    passageAccurate: item.passageAccurate ?? null,
    wordsAttempted: item.wordsAttempted ?? null,
    wordsCorrect: item.wordsCorrect ?? null,
    errors: item.errors ?? null,
    selfCorrections: item.selfCorrections ?? null,
    elapsedSeconds: item.elapsedSeconds ?? null,
    timerStatus: item.timerStatus || "",
    timerInterrupted: item.timerInterrupted ?? null,
    interruptionReason: item.interruptionReason || "",
    zeroWordsReached: item.zeroWordsReached ?? null,
    wcpm: item.wcpm ?? null,
    accuracyRate: item.accuracyRate ?? null,
    routeJudgmentUsable: item.routeJudgmentUsable ?? null,
    routeDecision: item.routeDecision || null,
    accuracyJudgmentSource: item.accuracyJudgmentSource || "",
    accuracyJudgedAt: item.accuracyJudgedAt || "",
    informationalNotes: Array.isArray(item.informationalNotes) ? item.informationalNotes : [],
    prosody: item.prosody || {},
    prosodyAverage: item.prosodyAverage ?? null,
    errorTags: Array.isArray(item.errorTags) ? item.errorTags : [],
    featureTags: Array.isArray(item.featureTags) ? item.featureTags : [],
    validationIssues: Array.isArray(item.validationIssues) ? item.validationIssues : []
  };
}

function compactClassBenchmarkDetail(detail = {}) {
  const compact = {
    ...detail,
    itemDetails: (detail.itemDetails || []).map(compactBenchmarkItemEvidence)
  };
  if (Array.isArray(compact.strandRows)) {
    compact.strandRows = compact.strandRows.map(strand => {
      const compactStrand = { ...strand };
      delete compactStrand.items;
      return compactStrand;
    });
  }
  if (Array.isArray(compact.bandRows)) {
    compact.bandRows = compact.bandRows.map(band => {
      const compactBand = { ...band };
      delete compactBand.items;
      return compactBand;
    });
  }
  delete compact.passageRows;
  delete compact.highestAccuratePassage;
  delete compact.fluencySequence;
  return compact;
}

export function compactElAssessmentReportForStorage(report = {}) {
  const compact = {
    ...report,
    teacherId: report.teacherId || "local",
    schemaVersion: report.schemaVersion || EL_REPORT_SCHEMA_VERSION,
    storageSchemaVersion: 1
  };
  delete compact.sourceSnapshot;
  delete compact.sourceAttemptIds;
  // EL report history is intentionally assessment-only. Remove this legacy
  // field as well so opening and re-saving an older payload cannot persist a
  // second copy of Guided Reading evidence.
  delete compact.guidedReading;
  if (compact.formalAssessments) {
    delete compact.benchmarkProfile;
    delete compact.benchmarkDetails;
    delete compact.benchmarkMatrix;
    delete compact.benchmarkDomainSummaries;
  }
  if (compact.reportType === "whole_class") {
    delete compact.attemptRows;
    delete compact.progressRows;
    if (Array.isArray(compact.formalAssessments?.classBenchmarkDetails)) {
      compact.formalAssessments = {
        ...compact.formalAssessments,
        classBenchmarkDetails: compact.formalAssessments.classBenchmarkDetails.map(compactClassBenchmarkDetail)
      };
    }
  }
  if (compact.advancedPhonics?.patternRows && compact.patternDetailRows) {
    compact.advancedPhonics = { ...compact.advancedPhonics };
    delete compact.advancedPhonics.patternRows;
  }
  return safeParse(JSON.stringify(compact), {});
}

function writeLocalSavedElAssessmentReports(reports = [], teacherId = "local", { returnStatus = false } = {}) {
  if (typeof localStorage === "undefined") {
    const unavailable = { reports: [], saved: false, error: null };
    return returnStatus ? unavailable : unavailable.reports;
  }
  const bounded = [];
  const candidates = mergeSavedElAssessmentReports(reports)
    .map(compactElAssessmentReportForStorage)
    .slice(0, LOCAL_REPORT_CACHE_MAX_COUNT);
  for (const report of candidates) {
    const next = [...bounded, report];
    if (serializedByteLength(next) > LOCAL_REPORT_CACHE_MAX_BYTES) continue;
    bounded.push(report);
  }
  try {
    localStorage.setItem(getStorageKey(teacherId), JSON.stringify(bounded));
  } catch (error) {
    console.warn("Local EL assessment report cache could not be updated; cloud persistence will still be attempted.", error);
    const failed = { reports: [], saved: false, error };
    return returnStatus ? failed : failed.reports;
  }
  const succeeded = { reports: bounded, saved: true, error: null };
  return returnStatus ? succeeded : succeeded.reports;
}

function relationalReportValue(row = {}, column, fallback, emptyValue = "") {
  if (Object.prototype.hasOwnProperty.call(row, column)) return row[column] ?? emptyValue;
  return fallback ?? emptyValue;
}

function cloudSavedReportRowIdentity(row = {}) {
  const reportId = row.report_id || row.reportId || row.payload?.reportId;
  if (reportId) return `report:${reportId}`;
  try {
    return `row:${JSON.stringify(row)}`;
  } catch {
    return `row:${String(row)}`;
  }
}

function filterSavedElAssessmentReports(reports = [], {
  reportType = "",
  classId = "",
  studentId = "",
  benchmarkScope = null,
  benchmarkGrade = "",
  benchmarkWindow = ""
} = {}) {
  const requestedBenchmarkScope = {
    grade: benchmarkScope?.grade ?? benchmarkGrade,
    benchmarkWindow: benchmarkScope?.benchmarkWindow ?? benchmarkScope?.window ?? benchmarkWindow
  };
  return mergeSavedElAssessmentReports(reports)
    .filter(report =>
      (!reportType || report.reportType === reportType) &&
      (!classId || report.classId === classId) &&
      (!studentId || report.studentId === studentId) &&
      reportMatchesBenchmarkScope(report, requestedBenchmarkScope)
    );
}

export function getSavedElAssessmentReports({
  teacherId = "local",
  reportType = "",
  classId = "",
  studentId = "",
  benchmarkScope = null,
  benchmarkGrade = "",
  benchmarkWindow = ""
} = {}) {
  return filterSavedElAssessmentReports(readLocalSavedElAssessmentReports(teacherId), {
    reportType,
    classId,
    studentId,
    benchmarkScope,
    benchmarkGrade,
    benchmarkWindow
  });
}

export async function hydrateElAssessmentReports({
  teacherId = "local",
  supabase = null,
  reportType = "",
  classId = "",
  studentId = "",
  benchmarkScope = null,
  benchmarkGrade = "",
  benchmarkWindow = "",
  throwOnCloudError = false
} = {}) {
  const localReports = readLocalSavedElAssessmentReports(teacherId);
  let cloudReports = [];
  if (supabase) {
    try {
      const pageSize = 50;
      const rows = [];
      const seenCloudRows = new Set();
      for (let from = 0; ; from += pageSize) {
        const query = supabase
          .from("el_assessment_reports")
          .select("report_id, report_type, class_id, student_id, teacher_id, generated_at, file_name, schema_version, payload")
          .eq("teacher_id", teacherId);
        const orderedByDate = query.order("generated_at", { ascending: false });
        const ordered = typeof orderedByDate?.order === "function"
          ? orderedByDate.order("report_id", { ascending: true })
          : orderedByDate;
        const supportsRange = typeof ordered.range === "function";
        const result = supportsRange
          ? await ordered.range(from, from + pageSize - 1)
          : typeof ordered?.limit === "function"
            ? await ordered.limit(pageSize)
            : await ordered;
        if (result?.error) throw result.error;
        const page = Array.isArray(result?.data) ? result.data : [];
        if (!page.length) break;
        const advancingRows = page.filter(row => {
          const identity = cloudSavedReportRowIdentity(row);
          if (seenCloudRows.has(identity)) return false;
          seenCloudRows.add(identity);
          return true;
        });
        // Guard adapters that ignore range offsets and repeatedly return the
        // same full page; a non-advancing page must not create an infinite loop.
        if (!advancingRows.length) break;
        rows.push(...advancingRows);
        if (!supportsRange || page.length < pageSize) break;
      }
      cloudReports = rows.map(row => {
        const payload = row.payload && typeof row.payload === "object" ? row.payload : {};
        return compactElAssessmentReportForStorage({
          ...payload,
          reportId: relationalReportValue(row, "report_id", payload.reportId),
          reportType: relationalReportValue(row, "report_type", payload.reportType),
          classId: relationalReportValue(row, "class_id", payload.classId),
          studentId: relationalReportValue(row, "student_id", payload.studentId),
          teacherId: relationalReportValue(row, "teacher_id", payload.teacherId || teacherId, teacherId),
          generatedAt: relationalReportValue(row, "generated_at", payload.generatedAt),
          fileName: relationalReportValue(row, "file_name", payload.fileName),
          schemaVersion: relationalReportValue(row, "schema_version", payload.schemaVersion || EL_REPORT_SCHEMA_VERSION, EL_REPORT_SCHEMA_VERSION)
        });
      });
    } catch (error) {
      if (throwOnCloudError) throw error;
      console.warn("Cloud EL assessment report history is unavailable; using the local cache.", error);
    }
  }
  const merged = mergeSavedElAssessmentReports(cloudReports, localReports);
  writeLocalSavedElAssessmentReports(merged, teacherId);
  return filterSavedElAssessmentReports(merged, {
    reportType,
    classId,
    studentId,
    benchmarkScope,
    benchmarkGrade,
    benchmarkWindow
  });
}

export async function saveElAssessmentReport(report, { teacherId = report.teacherId || "local", supabase = null } = {}) {
  const normalized = compactElAssessmentReportForStorage({
    ...report,
    teacherId: report.teacherId || teacherId,
    schemaVersion: report.schemaVersion || EL_REPORT_SCHEMA_VERSION
  });

  const existing = readLocalSavedElAssessmentReports(teacherId);
  const localResult = writeLocalSavedElAssessmentReports([normalized, ...existing], teacherId, { returnStatus: true });
  const localSaved = localResult.saved && localResult.reports.some(item => (
    savedReportIdentity(item) === savedReportIdentity(normalized)
  ));
  const localError = localResult.error || (
    localResult.saved && !localSaved
      ? new Error("The EL assessment report exceeded the bounded local cache budget.")
      : null
  );

  let cloudSaved = false;
  let cloudError = null;
  if (supabase) {
    try {
      const result = await supabase.from("el_assessment_reports").upsert({
        report_id: normalized.reportId,
        report_type: normalized.reportType,
        class_id: normalized.classId || null,
        student_id: normalized.studentId || null,
        teacher_id: normalized.teacherId || null,
        generated_at: normalized.generatedAt,
        file_name: normalized.fileName,
        summary: normalized.summary,
        schema_version: normalized.schemaVersion,
        payload: normalized
      }, { onConflict: "report_id" });
      if (result?.error) {
        console.warn("Supabase el_assessment_reports upsert rejected; the report may only exist in this browser.", result.error);
        cloudError = result.error;
      } else {
        cloudSaved = true;
      }
    } catch (error) {
      console.warn("EL assessment report saved locally; Supabase el_assessment_reports write is unavailable.", error);
      cloudError = error;
    }
  }

  return {
    report: normalized,
    reports: localResult.reports,
    localSaved,
    cloudSaved,
    durable: localSaved || cloudSaved,
    localError,
    cloudError
  };
}

export async function deleteSavedElAssessmentReport(reportId, { teacherId = "local", supabase = null } = {}) {
  if (supabase) {
    try {
      const result = await supabase
        .from("el_assessment_reports")
        .delete()
        .eq("report_id", reportId)
        .eq("teacher_id", teacherId);
      if (result?.error) throw result.error;
    } catch (error) {
      const deletionError = new Error("Could not delete the saved EL assessment report from cloud storage.");
      deletionError.cause = error;
      throw deletionError;
    }
  }
  const next = readLocalSavedElAssessmentReports(teacherId).filter(report => report.reportId !== reportId);
  writeLocalSavedElAssessmentReports(next, teacherId);
  return next;
}

function savedReportStudentEvidenceRows(report = {}) {
  return [
    ...(Array.isArray(report.studentRows) ? report.studentRows : []),
    ...(Array.isArray(report.heatmapRows) ? report.heatmapRows : []),
    ...(Array.isArray(report.formalAssessments?.classBenchmarkMatrix)
      ? report.formalAssessments.classBenchmarkMatrix
      : []),
    ...(Array.isArray(report.formalAssessments?.classBenchmarkDetails)
      ? report.formalAssessments.classBenchmarkDetails
      : []),
    ...(Array.isArray(report.storyQuests?.rows) ? report.storyQuests.rows : []),
    ...(Array.isArray(report.engagement?.rows) ? report.engagement.rows : [])
  ];
}

export function savedClassElAssessmentReportContainsStudent(report = {}, {
  studentId = "",
  studentName = ""
} = {}) {
  if (report.reportType !== "whole_class") return false;
  const normalizedName = String(studentName || "").trim().toLowerCase();
  return savedReportStudentEvidenceRows(report).some(row => {
    const rowId = String(row?.studentId || row?.student_id || "").trim();
    if (studentId && rowId === String(studentId)) return true;
    const rowName = String(row?.studentName || row?.student_name || row?.name || "").trim().toLowerCase();
    // Prefer stable ownership IDs. A name is only a legacy fallback when the
    // evidence row itself has no ID, otherwise duplicate student names could
    // delete an unrelated class snapshot.
    return Boolean(normalizedName && !rowId && rowName === normalizedName);
  });
}

export function getSavedClassElAssessmentReportsForStudent({
  teacherId = "local",
  studentId = "",
  studentName = ""
} = {}) {
  return getSavedElAssessmentReports({ teacherId, reportType: "whole_class" })
    .filter(report => savedClassElAssessmentReportContainsStudent(report, { studentId, studentName }));
}

export async function deleteSavedClassElAssessmentReportsForStudent({
  teacherId = "local",
  studentId = "",
  studentName = "",
  supabase = null
} = {}) {
  const reports = supabase
    ? await hydrateElAssessmentReports({
        teacherId,
        supabase,
        reportType: "whole_class",
        throwOnCloudError: true
      })
    : getSavedElAssessmentReports({ teacherId, reportType: "whole_class" });
  const targets = reports.filter(report => (
    savedClassElAssessmentReportContainsStudent(report, { studentId, studentName })
  ));
  for (const report of targets) {
    await deleteSavedElAssessmentReport(report.reportId, { teacherId, supabase });
  }
  return {
    deletedReportIds: targets.map(report => report.reportId),
    reports: getSavedElAssessmentReports({ teacherId, reportType: "whole_class" })
  };
}

export function deleteSavedElAssessmentReportsForStudent({ teacherId = "local", studentId = "", studentName = "" } = {}) {
  if (typeof localStorage === "undefined") return [];
  const normalizedStudentId = String(studentId || "").trim();
  const normalizedStudentName = String(studentName || "").trim().toLowerCase();
  const next = getSavedElAssessmentReports({ teacherId }).filter(report => {
    const reportStudentId = String(report.studentId || "").trim();
    if (normalizedStudentId && reportStudentId === normalizedStudentId) return false;
    if (
      normalizedStudentName &&
      !reportStudentId &&
      String(report.studentName || "").trim().toLowerCase() === normalizedStudentName
    ) {
      return false;
    }
    return true;
  });
  writeLocalSavedElAssessmentReports(next, teacherId);
  return next;
}

export function regenerateElAssessmentWorkbookFromSavedReport(report = {}) {
  return {
    ...report,
    sourceSnapshot: report.sourceSnapshot || {}
  };
}

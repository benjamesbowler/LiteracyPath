#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const appPath = path.join(root, "src/App.jsx");
const appPagesPath = path.join(root, "src/components/AppPages.jsx");
const adminPath = path.join(root, "src/components/AdminDashboardPage.jsx");
const storePath = path.join(root, "src/data/assessmentHistoryStore.js");
const reportStorePath = path.join(root, "src/data/elAssessmentReportStore.js");
const exportPath = path.join(root, "src/utils/exportElAssessmentExcel.js");

function fail(message, details = {}) {
  console.error(`FAIL: ${message}`);
  if (Object.keys(details).length) {
    console.error(JSON.stringify(details, null, 2));
  }
  process.exitCode = 1;
}

function assert(condition, message, details = {}) {
  if (!condition) fail(message, details);
}

function makeStorage() {
  const store = new Map();
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
    clear() {
      store.clear();
    }
  };
}

globalThis.localStorage = makeStorage();

const store = await import(pathToFileURL(storePath).href);
const reportStore = await import(pathToFileURL(reportStorePath).href);
const exportHelpers = await import(pathToFileURL(exportPath).href);
const appSource = fs.readFileSync(appPath, "utf8");
const appPagesSource = fs.readFileSync(appPagesPath, "utf8");
const adminSource = fs.readFileSync(adminPath, "utf8");
const storeSource = fs.readFileSync(storePath, "utf8");
const exportSource = fs.readFileSync(exportPath, "utf8");
const elAssessmentsSource = appPagesSource.match(/export function ELAssessmentsPage[\s\S]*?\nexport function GuidedReadingPage/)?.[0] || "";

[
  "extractMasteryFromAssessmentAttempt",
  "mergeAssessmentAttemptIntoItemMastery",
  "saveAssessmentAttempt",
  "loadAssessmentAttempts",
  "summarizeAssessmentHistory"
].forEach(exportName => {
  assert(
    typeof store[exportName] === "function",
    `assessmentHistoryStore must export ${exportName}`
  );
});

[
  "persistCompletedAssessmentAttempt",
  "archiveLetterAssessment",
  "archivePatternAssessment",
  "buildAssessmentAttemptRecord"
].forEach(token => {
  assert(appSource.includes(token), `App completion flow must include ${token}`);
});

assert(
  /persistCompletedAssessmentAttempt\(attemptRecord\)/.test(appSource),
  "adaptive skill checkpoints must archive attempts through the shared persistence function"
);
assert(
  /archiveLetterAssessment\(nextAssessment\)/.test(appSource),
  "letter assessment completion must archive a saved attempt"
);
assert(
  /archivePatternAssessment\(nextAssessment\)/.test(appSource),
  "pattern assessment completion must archive a saved attempt"
);
assert(
  storeSource.includes("developingItems") && storeSource.includes("needsSupportItems"),
  "saved attempts must expose mastered/developing/support item arrays"
);
assert(!elAssessmentsSource.includes("Export Letter Excel"), "EL Assessments page must not show Export Letter Excel");
assert(!elAssessmentsSource.includes("Export Pattern Excel"), "EL Assessments page must not show Export Pattern Excel");
assert(
  elAssessmentsSource.includes("Run the formal letter identification assessment for the selected student."),
  "letter assessment card copy must describe running the assessment only"
);
assert(
  elAssessmentsSource.includes("Run the formal advanced phonics pattern assessment for the selected student."),
  "advanced phonics card copy must describe running the assessment only"
);
assert(appSource.includes('assessmentType: "advanced_phonics_patterns"'), "Advanced Phonics completion must save the advanced_phonics_patterns assessment type");
assert(appSource.includes('skillName: "Advanced Phonics Patterns"'), "Advanced Phonics completion must use the report-visible skill name");
assert(appSource.includes("patternStats") && appSource.includes("answers: questionRecords.map"), "Advanced Phonics completion must persist pattern stats and answer rows");
assert(appSource.includes("mergeIntoMastery: true"), "Advanced Phonics completion must merge pattern mastery into cumulative item mastery");
assert(adminSource.includes("Advanced Phonics Patterns") && adminSource.includes("advancedPatternRows"), "Teacher Dashboard must display Advanced Phonics data from saved history");
assert(exportSource.includes("Advanced Phonics Patterns") && exportSource.includes("Pattern Detail"), "EL Excel exports must include Advanced Phonics summary/detail sheets");

const sampleAttempt = {
  studentId: "student-1",
  studentName: "Ada",
  classId: "class-1",
  teacherId: "teacher-1",
  assessmentType: "skill_checkpoint",
  skillId: "initial_sounds",
  skillName: "Initial Sounds",
  skillLevel: 1,
  skillPhase: 1,
  startedAt: "2026-05-29T00:00:00.000Z",
  completedAt: "2026-05-29T00:05:00.000Z",
  questionRecords: [
    { questionId: "initial-a-1", targetWord: "apple", targetSound: "a", correctAnswer: "a", selectedAnswer: "a", isCorrect: true, skillId: "initial_sounds" },
    { questionId: "initial-a-2", targetWord: "ant", targetSound: "a", correctAnswer: "a", selectedAnswer: "a", isCorrect: true, skillId: "initial_sounds" },
    { questionId: "initial-m-1", targetWord: "moon", targetSound: "m", correctAnswer: "m", selectedAnswer: "s", isCorrect: false, skillId: "initial_sounds" }
  ]
};

const finalAttempt = {
  ...sampleAttempt,
  attemptId: "final-sounds-sample",
  skillId: "final_sounds",
  skillName: "Final Sounds",
  questionRecords: [
    { questionId: "final-b-1", targetWord: "tub", targetSound: "b", correctAnswer: "b", selectedAnswer: "b", isCorrect: true, skillId: "final_sounds" },
    { questionId: "final-b-2", targetWord: "web", targetSound: "b", correctAnswer: "b", selectedAnswer: "b", isCorrect: true, skillId: "final_sounds" },
    { questionId: "final-sh-1", targetWord: "fish", targetSound: "sh", correctAnswer: "sh", selectedAnswer: "s", isCorrect: false, skillId: "final_sounds" }
  ]
};

const rhymingAttempt = {
  ...sampleAttempt,
  attemptId: "rhyming-sample",
  skillId: "rhyming",
  skillName: "Rhyming",
  questionRecords: [
    { questionId: "rhyme-an-1", targetWord: "pan", targetPattern: "an", correctAnswer: "fan", selectedAnswer: "fan", isCorrect: true, skillId: "rhyming" },
    { questionId: "rhyme-an-2", targetWord: "can", targetPattern: "an", correctAnswer: "man", selectedAnswer: "man", isCorrect: true, skillId: "rhyming" }
  ]
};

const shortVowelAttempt = {
  ...sampleAttempt,
  attemptId: "short-vowel-sample",
  skillId: "short_vowel_discrimination",
  skillName: "Short Vowel Discrimination",
  questionRecords: [
    { questionId: "short-u-1", targetWord: "bun", targetSound: "u", correctAnswer: "u", selectedAnswer: "u", isCorrect: true, skillId: "short_vowel_discrimination" },
    { questionId: "short-u-2", targetWord: "cup", targetSound: "u", correctAnswer: "u", selectedAnswer: "u", isCorrect: true, skillId: "short_vowel_discrimination" }
  ]
};

const hfwAttempt = {
  ...sampleAttempt,
  attemptId: "hfw-sample",
  skillId: "hfw_1_25",
  skillName: "High-Frequency Words 1-25",
  questionRecords: [
    { questionId: "hfw-for-1", targetWord: "for", correctAnswer: "for", selectedAnswer: "for", isCorrect: true, skillId: "hfw_1_25" },
    { questionId: "hfw-for-2", targetWord: "for", correctAnswer: "for", selectedAnswer: "for", isCorrect: true, skillId: "hfw_1_25" }
  ]
};

const letterAttempt = store.buildAssessmentAttemptRecord({
  studentId: "student-1",
  studentName: "Ada",
  classId: "class-1",
  teacherId: "teacher-1",
  stage: { id: "el_letter_assessment", label: "EL Letter Name and Sound" },
  checkpoint: {
    skillId: "el_letter_assessment",
    skillLabel: "EL Letter Name and Sound",
    pathStatus: { level: 1, phase: 1 },
    passed: true
  },
  assessmentType: "el_letter_assessment",
  questionRecords: [
    { questionId: "letter-a-name", question: "Name A.", targetLetter: "A", itemKey: "a", itemType: "letter_name", correct: "A", chosen: "A", isCorrect: true, skillId: "el_letter_assessment" }
  ]
});

const advancedAttempt = store.normalizeAssessmentAttempt({
  attemptId: "advanced-phonics-sample",
  id: "advanced-phonics-sample",
  studentId: "student-1",
  studentName: "Ada",
  classId: "class-1",
  teacherId: "teacher-1",
  assessmentType: "advanced_phonics_patterns",
  skillId: "advanced_phonics_patterns",
  skillName: "Advanced Phonics Patterns",
  skillLevel: 2,
  skillPhase: 1,
  startedAt: "2026-05-29T00:10:00.000Z",
  completedAt: "2026-05-29T00:15:00.000Z",
  totalQuestions: 6,
  correctCount: 4,
  incorrectCount: 2,
  accuracy: 67,
  status: "needs_retry",
  masteredItems: ["ai"],
  developingItems: ["ay"],
  needsSupportItems: ["or"],
  questionRecords: [
    { questionId: "ai-sound", pattern: "ai", targetPattern: "ai", targetWord: "rain", itemKey: "ai", itemType: "phonics_pattern", correctAnswer: "ai", selectedAnswer: "ai", isCorrect: true, skillId: "advanced_phonics_patterns", templateType: "phonics_pattern_sound", level: 2 },
    { questionId: "ai-word", pattern: "ai", targetPattern: "ai", targetWord: "rain", itemKey: "ai", itemType: "phonics_pattern", correctAnswer: "rain", selectedAnswer: "rain", isCorrect: true, skillId: "advanced_phonics_patterns", templateType: "phonics_pattern_word", level: 2 },
    { questionId: "ay-sound", pattern: "ay", targetPattern: "ay", targetWord: "play", itemKey: "ay", itemType: "phonics_pattern", correctAnswer: "ay", selectedAnswer: "ay", isCorrect: true, skillId: "advanced_phonics_patterns", templateType: "phonics_pattern_sound", level: 2 },
    { questionId: "ay-word", pattern: "ay", targetPattern: "ay", targetWord: "play", itemKey: "ay", itemType: "phonics_pattern", correctAnswer: "play", selectedAnswer: "not_yet", isCorrect: false, skillId: "advanced_phonics_patterns", templateType: "phonics_pattern_word", level: 2 },
    { questionId: "or-sound", pattern: "or", targetPattern: "or", targetWord: "storm", itemKey: "or", itemType: "phonics_pattern", correctAnswer: "or", selectedAnswer: "not_yet", isCorrect: false, skillId: "advanced_phonics_patterns", templateType: "phonics_pattern_sound", level: 2 },
    { questionId: "or-word", pattern: "or", targetPattern: "or", targetWord: "storm", itemKey: "or", itemType: "phonics_pattern", correctAnswer: "storm", selectedAnswer: "storm", isCorrect: true, skillId: "advanced_phonics_patterns", templateType: "phonics_pattern_word", level: 2 }
  ]
});

[
  [sampleAttempt, "initial_sound::a"],
  [finalAttempt, "final_sound::b"],
  [rhymingAttempt, "rhyming_family::an"],
  [shortVowelAttempt, "short_vowel::short_u"],
  [hfwAttempt, "sight_word::for"],
  [letterAttempt, "letter_name::a"],
  [advancedAttempt, "phonics_pattern::ai"]
].forEach(([attempt, expectedKey]) => {
  const mastery = store.extractMasteryFromAssessmentAttempt(attempt);
  const keys = mastery.rows.map(row => `${row.itemType}::${row.itemKey}`);
  assert(keys.includes(expectedKey), "mastery extractor must produce expected item key", { expectedKey, keys });
});

const advancedMastery = store.extractMasteryFromAssessmentAttempt(advancedAttempt);
assert(
  advancedMastery.rows.some(row => row.itemKey === "ai" && row.status === "mastered"),
  "Advanced Phonics mastery must classify a fully correct pattern as mastered"
);
assert(
  advancedMastery.rows.some(row => row.itemKey === "ay" && row.status === "needs_support"),
  "Advanced Phonics mastery must classify a below-threshold pattern using existing support thresholds"
);

const merged = store.mergeAssessmentAttemptIntoItemMastery({}, finalAttempt);
assert(merged["final_sound::b"]?.mastered, "final sound mastery should update cumulative item mastery");
assert(merged["final_sound::sh"]?.mastered === false, "missed final sound should not be marked mastered");
const advancedMerged = store.mergeAssessmentAttemptIntoItemMastery({}, advancedAttempt);
assert(advancedMerged["phonics_pattern::ai"]?.mastered, "Advanced Phonics pattern mastery should update cumulative item mastery");

const savedRows = await store.saveAssessmentAttempt(sampleAttempt, { teacherId: "teacher-1" });
assert(savedRows.length === 1, "saveAssessmentAttempt should append a local attempt");
const loadedRows = store.loadAssessmentAttempts({ teacherId: "teacher-1", studentId: "student-1" });
assert(loadedRows.length === 1, "loadAssessmentAttempts should find saved student attempt");
const summary = store.summarizeAssessmentHistory(loadedRows);
assert(summary.attempts === 1 && summary.students.length === 1, "dashboard summary should read saved attempts");

const students = [{ id: "student-1", name: "Ada", classId: "class-1", className: "Blue Class" }];
const classes = [{ id: "class-1", name: "Blue Class" }];
const assessmentHistory = [letterAttempt, advancedAttempt];
const studentReport = reportStore.buildStudentElAssessmentReportData({
  assessmentHistory,
  students,
  classes,
  studentId: "student-1",
  classId: "class-1",
  teacherId: "teacher-1"
});
const classReport = reportStore.buildClassElAssessmentReportData({
  assessmentHistory,
  students,
  classes,
  classId: "class-1",
  teacherId: "teacher-1"
});
assert(studentReport.skillRows.some(row => row.skillName === "Advanced Phonics Patterns"), "student EL report must include Advanced Phonics Patterns");
assert(classReport.skillRows.some(row => row.skillName === "Advanced Phonics Patterns"), "class EL report must include Advanced Phonics Patterns");
assert(studentReport.patternDetailRows.some(row => row.pattern === "ai" && row.examples.includes("rain")), "student EL report must include pattern examples");
assert(classReport.patternDetailRows.some(row => row.studentName === "Ada" && row.pattern === "ay"), "class EL report must include per-student pattern rows");

const studentWorkbook = await exportHelpers.createStudentElAssessmentWorkbook(studentReport);
const classWorkbook = await exportHelpers.createClassElAssessmentWorkbook(classReport);
assert(Boolean(studentWorkbook.getWorksheet("Advanced Phonics Patterns")), "student workbook must include Advanced Phonics Patterns sheet");
assert(Boolean(studentWorkbook.getWorksheet("Pattern Detail")), "student workbook must include Pattern Detail sheet");
assert(Boolean(classWorkbook.getWorksheet("Advanced Phonics Patterns")), "class workbook must include Advanced Phonics Patterns sheet");
assert(Boolean(classWorkbook.getWorksheet("Pattern Detail")), "class workbook must include Pattern Detail sheet");

if (!process.exitCode) {
  console.log("EL assessment progress persistence checks passed.");
}

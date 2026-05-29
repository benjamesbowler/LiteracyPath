#!/usr/bin/env node

import { readFileSync } from "node:fs";
import {
  buildClassElFormalAssessmentReport,
  buildIndividualElFormalAssessmentReport
} from "../src/data/elFormalAssessmentReportBuilder.js";
import {
  EL_CLASS_REPORT_SHEETS,
  EL_STUDENT_REPORT_SHEETS
} from "../src/utils/exportElAssessmentExcel.js";

const failures = [];
const push = message => failures.push(message);

const student = { id: "student-1", name: "Ada", classId: "class-1" };
const classmate = { id: "student-2", name: "Leo", classId: "class-1" };
const assessmentHistory = [
  {
    attemptId: "letters-1",
    studentId: "student-1",
    studentName: "Ada",
    classId: "class-1",
    skillId: "el_letter_assessment",
    skillName: "EL Letter Name and Sound",
    completedAt: "2026-05-29T09:00:00.000Z",
    totalQuestions: 4,
    correctCount: 3,
    questionRecords: [
      { questionId: "el_letter_A_uppercase_name_1", targetLetter: "A", itemType: "letter_name", templateType: "letter_name", correctAnswer: "A", selectedAnswer: "A", isCorrect: true },
      { questionId: "el_letter_A_uppercase_sound_1", targetLetter: "A", itemType: "letter_sound", templateType: "letter_sound", correctAnswer: "/a/", selectedAnswer: "/a/", isCorrect: true },
      { questionId: "el_letter_a_lowercase_name_1", targetLetter: "a", itemType: "letter_name", templateType: "letter_name", correctAnswer: "a", selectedAnswer: "a", isCorrect: true },
      { questionId: "el_letter_a_lowercase_sound_1", targetLetter: "a", itemType: "letter_sound", templateType: "letter_sound", correctAnswer: "/a/", selectedAnswer: "/m/", isCorrect: false }
    ]
  },
  {
    attemptId: "letters-2",
    studentId: "student-2",
    studentName: "Leo",
    classId: "class-1",
    skillId: "el_letter_assessment",
    skillName: "EL Letter Name and Sound",
    completedAt: "2026-05-29T10:00:00.000Z",
    totalQuestions: 1,
    correctCount: 0,
    questionRecords: [
      { questionId: "el_letter_A_uppercase_name_2", targetLetter: "A", itemType: "letter_name", templateType: "letter_name", correctAnswer: "A", selectedAnswer: "B", isCorrect: false }
    ]
  },
  {
    attemptId: "adv-1",
    studentId: "student-1",
    studentName: "Ada",
    classId: "class-1",
    skillId: "advanced_phonics_patterns",
    skillName: "Advanced Phonics Patterns",
    completedAt: "2026-05-29T11:00:00.000Z",
    totalQuestions: 2,
    correctCount: 1,
    questionRecords: [
      { questionId: "pattern_ai_sound", templateType: "phonics_pattern_sound", targetPattern: "ai", targetWord: "rain", correctAnswer: "ai", selectedAnswer: "ai", isCorrect: true },
      { questionId: "pattern_or_word", templateType: "phonics_pattern_word", targetPattern: "or", targetWord: "corn", correctAnswer: "or", selectedAnswer: "ar", isCorrect: false }
    ]
  }
];

const individual = buildIndividualElFormalAssessmentReport({ student, assessmentHistory });
const classReport = buildClassElFormalAssessmentReport({
  students: [student, classmate],
  assessmentHistory,
  classId: "class-1"
});

const aRow = individual.individualLetterMatrix.find(row => row.letter === "a");
const qRow = individual.individualLetterMatrix.find(row => row.letter === "q");
const aiRow = individual.individualAdvancedPhonicsMatrix.find(row => row.pattern === "ai");
const classARow = classReport.classLetterMatrix.find(row => row.letter === "a");
const classOrRow = classReport.classAdvancedPhonicsMatrix.find(row => row.pattern === "or");

if (!aRow) push("Individual letter matrix must include A-Z letter pairs.");
if (aRow?.letterPair !== "A/a") push("Letter rows must display uppercase/lowercase pairs.");
if (aRow?.uppercaseName.statusLabel !== "Mastered") push("Uppercase letter name result must be tracked separately.");
if (aRow?.uppercaseSound.statusLabel !== "Mastered") push("Uppercase letter sound result must be tracked separately.");
if (aRow?.lowercaseName.statusLabel !== "Mastered") push("Lowercase letter name result must be tracked separately.");
if (aRow?.lowercaseSound.statusLabel !== "Needs Support") push("Lowercase letter sound result must not be merged with name or uppercase evidence.");
if (qRow?.uppercaseName.statusLabel !== "Not assessed") push("Not assessed letters must stay separate from failed/support.");
if (!classARow || classARow.uppercaseName.needs_support !== 1 || classARow.uppercaseName.mastered !== 1) {
  push("Class letter matrix must count uppercase/lowercase name/sound statuses separately.");
}
if (!aiRow || aiRow.soundResult.statusLabel !== "Mastered") push("Individual Advanced Phonics matrix must include pattern sound rows.");
if (!classOrRow || classOrRow.needsSupportStudents !== 1 || !classOrRow.studentsNeedingSupport.includes("Ada")) {
  push("Class Advanced Phonics matrix must include pattern support statistics and support student names.");
}

[
  "Letter Names & Sounds",
  "Advanced Phonics Patterns"
].forEach(sheet => {
  if (!EL_STUDENT_REPORT_SHEETS.includes(sheet)) push(`Student Excel export missing ${sheet} sheet.`);
});
[
  "Letter Sound Class Matrix",
  "Advanced Phonics Class Matrix"
].forEach(sheet => {
  if (!EL_CLASS_REPORT_SHEETS.includes(sheet)) push(`Class Excel export missing ${sheet} sheet.`);
});

const adminSource = readFileSync(new URL("../src/components/AdminDashboardPage.jsx", import.meta.url), "utf8");
[
  "EL Formal Assessments",
  "Letter Names &amp; Sounds",
  "formal-report-controls",
  "uppercaseName",
  "lowercaseSound"
].forEach(token => {
  if (!adminSource.includes(token)) push(`Teacher Dashboard Reports formal assessment UI is missing ${token}.`);
});

const exportSource = readFileSync(new URL("../src/utils/exportElAssessmentExcel.js", import.meta.url), "utf8");
[
  "Letter Names & Sounds",
  "Uppercase name result",
  "Lowercase sound result",
  "Letter Sound Class Matrix",
  "Advanced Phonics Class Matrix"
].forEach(token => {
  if (!exportSource.includes(token)) push(`EL Excel export is missing ${token}.`);
});

if (failures.length) {
  console.error(failures.map(item => `FAIL: ${item}`).join("\n"));
  process.exit(1);
}

console.log("EL Formal Assessment report contracts passed.");

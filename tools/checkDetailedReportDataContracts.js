#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { buildIndividualStudentDetailedReport, buildWholeClassDetailedReport, formatDetailedReportAsText } from "../src/data/studentDetailedReportBuilder.js";

const failures = [];
const push = message => failures.push(message);

const sampleStudent = { id: "student-1", name: "Ada", classId: "class-1" };
const sampleClass = { id: "class-1", name: "Oak Class" };
const assessmentHistory = [
  {
    attemptId: "letters-1",
    studentId: "student-1",
    studentName: "Ada",
    classId: "class-1",
    skillId: "el_letter_assessment",
    skillName: "EL Letter Name and Sound",
    completedAt: "2026-05-29T08:50:00.000Z",
    totalQuestions: 2,
    correctCount: 1,
    questionRecords: [
      { questionId: "letter-a-name", skillId: "el_letter_assessment", targetLetter: "A", itemType: "letter_name", templateType: "letter_name", correctAnswer: "A", selectedAnswer: "A", isCorrect: true },
      { questionId: "letter-a-sound", skillId: "el_letter_assessment", targetLetter: "a", itemType: "letter_sound", templateType: "letter_sound", correctAnswer: "/a/", selectedAnswer: "/m/", isCorrect: false }
    ]
  },
  {
    attemptId: "initial-1",
    studentId: "student-1",
    studentName: "Ada",
    classId: "class-1",
    skillId: "initial_sounds",
    skillName: "Initial Sounds",
    completedAt: "2026-05-29T09:00:00.000Z",
    totalQuestions: 3,
    correctCount: 2,
    questionRecords: [
      { questionId: "a1", skillId: "initial_sounds", targetWord: "apple", targetSound: "a", correctAnswer: "a", selectedAnswer: "a", isCorrect: true },
      { questionId: "a2", skillId: "initial_sounds", targetWord: "ant", targetSound: "a", correctAnswer: "a", selectedAnswer: "a", isCorrect: true },
      { questionId: "c1", skillId: "initial_sounds", targetWord: "cat", targetSound: "c", correctAnswer: "c", selectedAnswer: "t", isCorrect: false }
    ]
  },
  {
    attemptId: "final-1",
    studentId: "student-1",
    studentName: "Ada",
    classId: "class-1",
    skillId: "final_sounds",
    skillName: "Final Sounds",
    completedAt: "2026-05-29T09:10:00.000Z",
    totalQuestions: 2,
    correctCount: 1,
    questionRecords: [
      { questionId: "t1", skillId: "final_sounds", targetWord: "cat", targetSound: "t", correctAnswer: "t", selectedAnswer: "t", isCorrect: true },
      { questionId: "n1", skillId: "final_sounds", targetWord: "pan", targetSound: "n", correctAnswer: "n", selectedAnswer: "m", isCorrect: false }
    ]
  },
  {
    attemptId: "rhyme-1",
    studentId: "student-1",
    studentName: "Ada",
    classId: "class-1",
    skillId: "rhyming",
    skillName: "Rhyming",
    completedAt: "2026-05-29T09:20:00.000Z",
    totalQuestions: 1,
    correctCount: 1,
    questionRecords: [
      { questionId: "an1", skillId: "rhyming", targetWord: "pan", targetPattern: "an", correctAnswer: "fan", selectedAnswer: "fan", isCorrect: true }
    ]
  },
  {
    attemptId: "short-1",
    studentId: "student-1",
    studentName: "Ada",
    classId: "class-1",
    skillId: "short_vowel_discrimination",
    skillName: "Short Vowel Discrimination",
    completedAt: "2026-05-29T09:30:00.000Z",
    totalQuestions: 1,
    correctCount: 1,
    questionRecords: [
      { questionId: "u1", skillId: "short_vowel_discrimination", targetWord: "bun", targetSound: "u", correctAnswer: "u", selectedAnswer: "u", isCorrect: true }
    ]
  },
  {
    attemptId: "hfw-1",
    studentId: "student-1",
    studentName: "Ada",
    classId: "class-1",
    skillId: "hfw_1_25",
    skillName: "High-Frequency Words 1-25",
    completedAt: "2026-05-29T09:40:00.000Z",
    totalQuestions: 2,
    correctCount: 1,
    questionRecords: [
      { questionId: "for1", skillId: "hfw_1_25", targetWord: "for", correctAnswer: "for", selectedAnswer: "for", isCorrect: true },
      { questionId: "my1", skillId: "hfw_1_25", targetWord: "my", correctAnswer: "my", selectedAnswer: "me", isCorrect: false }
    ]
  },
  {
    attemptId: "adv-1",
    studentId: "student-1",
    studentName: "Ada",
    classId: "class-1",
    skillId: "advanced_phonics_patterns",
    skillName: "Advanced Phonics Patterns",
    completedAt: "2026-05-29T09:50:00.000Z",
    totalQuestions: 2,
    correctCount: 1,
    questionRecords: [
      { questionId: "ai1", skillId: "advanced_phonics_patterns", targetPattern: "ai", targetWord: "rain", itemKey: "ai", itemType: "phonics_pattern", correctAnswer: "ai", selectedAnswer: "ai", isCorrect: true },
      { questionId: "or1", skillId: "advanced_phonics_patterns", targetPattern: "or", targetWord: "corn", itemKey: "or", itemType: "phonics_pattern", correctAnswer: "or", selectedAnswer: "ar", isCorrect: false }
    ]
  }
];

const guidedReadingRecords = {
  "sample-book": {
    title: "Sample Book",
    level: "A",
    completedAt: "2026-05-29T10:00:00.000Z",
    completedPages: 1,
    totalPages: 1,
    completed: true,
    pages: {
      0: {
        words: ["cat", "sat"],
        wordMarks: { 0: "correct", 1: "support" }
      }
    }
  }
};

const report = buildIndividualStudentDetailedReport({
  student: sampleStudent,
  classes: [sampleClass],
  assessmentHistory,
  guidedReadingRecords
});

function section(name) {
  return report.skillSections.find(item => item.skillName === name);
}

function hasRow(sectionName, labelPart) {
  return section(sectionName)?.itemRows.some(row => row.label.includes(labelPart));
}

if (!hasRow("Letter Name and Initial Sounds", "a")) push("Initial sounds report must include exact attempted letter rows.");
if (!hasRow("Final / Ending Sounds", "/t/")) push("Final sounds report must include exact attempted final sound rows.");
if (!hasRow("Rhyming", "-an")) push("Rhyming report must include rime-family rows.");
if (!hasRow("CVC / Short Vowels", "short u")) push("Short vowel report must include vowel rows.");
if (!hasRow("High-Frequency Words", "for")) push("HFW report must include individual word rows.");
if (!hasRow("Advanced Phonics Patterns", "ai")) push("Advanced phonics report must include pattern rows.");
if (!report.formalAssessments?.individualLetterMatrix?.find(row => row.letter === "a")?.lowercaseSound?.attempts) {
  push("Detailed report must include formal Letter Name/Sound matrix rows.");
}
if (!report.formalAssessments?.individualAdvancedPhonicsMatrix?.find(row => row.pattern === "ai")?.attempts) {
  push("Detailed report must include formal Advanced Phonics pattern matrix rows.");
}
if (!report.guidedReading.bookRows.length || !report.guidedReading.wordRows.length) push("Guided Reading report must include books and word status rows.");
if (report.skillSections.some(item => item.needsSupportItems.some(row => row.attempts === 0))) push("Reports must not mark unattempted items as needs support.");

const classReport = buildWholeClassDetailedReport({
  students: [sampleStudent],
  classes: [sampleClass],
  assessmentHistory,
  classId: "class-1"
});
if (!classReport.matrices.length) push("Class report must include matrix/stat rows.");
if (!classReport.formalAssessments?.classLetterMatrix?.find(row => row.letter === "a")?.lowercaseSound?.needs_support) {
  push("Class detailed report must include formal Letter Name/Sound class counts.");
}
if (!classReport.formalAssessments?.classAdvancedPhonicsMatrix?.find(row => row.pattern === "or")?.needsSupportStudents) {
  push("Class detailed report must include formal Advanced Phonics class pattern counts.");
}
if (!classReport.matrices.some(matrix => matrix.rows.some(row => row.needsSupportStudents > 0))) {
  push("Class report must include support counts by attempted item.");
}

const text = formatDetailedReportAsText(report);
["Initial Sounds", "Final / Ending Sounds", "Rhyming", "Guided Reading", "Recommendations"].forEach(token => {
  if (!text.includes(token)) push(`Text export is missing ${token}.`);
});

const dashboardSource = readFileSync(new URL("../src/components/AdminDashboardPage.jsx", import.meta.url), "utf8");
[
  "Detailed Assessment Report",
  "EL Formal Assessments",
  "Individual Student Report",
  "Whole Class Report",
  "Report sections",
  "detailed-report-controls",
  "bounded-report-table",
  "Teacher Hints"
].forEach(token => {
  if (!dashboardSource.includes(token)) push(`Teacher Dashboard detailed report UI is missing ${token}.`);
});

if (failures.length) {
  console.error(failures.map(item => `FAIL: ${item}`).join("\n"));
  process.exit(1);
}

console.log("Detailed report data contracts passed.");

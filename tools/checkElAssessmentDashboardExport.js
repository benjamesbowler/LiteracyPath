import fs from "node:fs";
import path from "node:path";
import {
  buildClassElAssessmentReportData,
  buildStudentElAssessmentReportData,
  compareElAssessmentReports,
  deleteSavedElAssessmentReport,
  getSavedElAssessmentReports,
  saveElAssessmentReport
} from "../src/data/elAssessmentReportStore.js";
import {
  createClassElAssessmentWorkbook,
  createStudentElAssessmentWorkbook,
  EL_CLASS_REPORT_SHEETS,
  EL_STUDENT_REPORT_SHEETS
} from "../src/utils/exportElAssessmentExcel.js";

const root = process.cwd();
const adminPath = path.join(root, "src/components/AdminDashboardPage.jsx");
const adminSource = fs.readFileSync(adminPath, "utf8");
const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function sheetNames(workbook) {
  return workbook.worksheets.map(sheet => sheet.name);
}

const requiredDashboardText = [
  "EL Assessment Snapshot",
  "Export Student EL Assessment Excel",
  "Export Class EL Assessment Excel",
  "Saved EL Reports",
  "Download Again",
  "Delete local copy"
];

requiredDashboardText.forEach(text => {
  assert(adminSource.includes(text), `AdminDashboardPage is missing visible text: ${text}`);
});

assert(typeof buildStudentElAssessmentReportData === "function", "buildStudentElAssessmentReportData is not exported.");
assert(typeof buildClassElAssessmentReportData === "function", "buildClassElAssessmentReportData is not exported.");
assert(typeof saveElAssessmentReport === "function", "saveElAssessmentReport is not exported.");
assert(typeof getSavedElAssessmentReports === "function", "getSavedElAssessmentReports is not exported.");
assert(typeof deleteSavedElAssessmentReport === "function", "deleteSavedElAssessmentReport is not exported.");
assert(typeof compareElAssessmentReports === "function", "compareElAssessmentReports is not exported.");

const mockStudents = [
  { id: "student-1", name: "Maya", classId: "class-1", className: "Blue Class" },
  { id: "student-2", name: "Leo", classId: "class-1", className: "Blue Class" }
];
const mockClasses = [{ id: "class-1", name: "Blue Class" }];
const mockHistory = [
  {
    attemptId: "attempt-1",
    studentId: "student-1",
    studentName: "Maya",
    classId: "class-1",
    teacherId: "teacher-1",
    skillId: "initial_sounds",
    skillName: "Initial Sounds",
    skillLevel: 1,
    skillPhase: 1,
    completedAt: "2026-05-01T12:00:00.000Z",
    totalQuestions: 15,
    correctCount: 14,
    accuracy: 93,
    passed: true,
    status: "mastered",
    masteredItems: ["m", "s"],
    missedItems: ["t"],
    itemKeysCovered: ["m", "s", "t"],
    questionRecords: [
      {
        questionId: "q1",
        prompt: "Choose the picture.",
        correctAnswer: "m",
        selectedAnswer: "m",
        isCorrect: true,
        skillId: "initial_sounds",
        level: 1,
        phase: 1,
        timestamp: "2026-05-01T12:00:00.000Z"
      }
    ]
  },
  {
    attemptId: "attempt-2",
    studentId: "student-2",
    studentName: "Leo",
    classId: "class-1",
    teacherId: "teacher-1",
    skillId: "final_sounds",
    skillName: "Final Sounds",
    skillLevel: 1,
    skillPhase: 1,
    completedAt: "2026-05-02T12:00:00.000Z",
    totalQuestions: 15,
    correctCount: 9,
    accuracy: 60,
    passed: false,
    status: "needs_retry",
    masteredItems: ["p"],
    missedItems: ["b", "l"],
    itemKeysCovered: ["p", "b", "l"],
    questionRecords: []
  }
];

const studentReport = buildStudentElAssessmentReportData({
  assessmentHistory: mockHistory,
  students: mockStudents,
  classes: mockClasses,
  studentId: "student-1",
  classId: "class-1",
  teacherId: "teacher-1"
});

const classReport = buildClassElAssessmentReportData({
  assessmentHistory: mockHistory,
  students: mockStudents,
  classes: mockClasses,
  classId: "class-1",
  teacherId: "teacher-1"
});

assert(studentReport.reportType === "individual", "Student report type is incorrect.");
assert(classReport.reportType === "whole_class", "Class report type is incorrect.");
assert(Array.isArray(studentReport.skillRows), "Student report skillRows missing.");
assert(Array.isArray(classReport.studentRows), "Class report studentRows missing.");
assert(compareElAssessmentReports(studentReport, null).note.includes("No previous report"), "Comparison does not handle no previous report.");

const emptyStudent = buildStudentElAssessmentReportData({ students: [], classes: [], assessmentHistory: [] });
const emptyClass = buildClassElAssessmentReportData({ students: [], classes: [], assessmentHistory: [] });
assert(emptyStudent.summary.totalAssessments === 0, "Empty student report should have zero assessments.");
assert(emptyClass.summary.totalAssessments === 0, "Empty class report should have zero assessments.");

const studentWorkbook = await createStudentElAssessmentWorkbook(studentReport);
const classWorkbook = await createClassElAssessmentWorkbook(classReport);
const studentSheets = sheetNames(studentWorkbook);
const classSheets = sheetNames(classWorkbook);

EL_STUDENT_REPORT_SHEETS.forEach(sheet => {
  assert(studentSheets.includes(sheet), `Student workbook missing sheet: ${sheet}`);
});
EL_CLASS_REPORT_SHEETS.forEach(sheet => {
  assert(classSheets.includes(sheet), `Class workbook missing sheet: ${sheet}`);
});

if (failures.length) {
  console.error("EL Assessment Dashboard Export check failed:");
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("EL Assessment Dashboard Export check passed.");
console.log(`Student sheets: ${studentSheets.join(", ")}`);
console.log(`Class sheets: ${classSheets.join(", ")}`);
console.log("No Supabase schema is required; reports can be stored locally and optionally upserted if el_assessment_reports exists.");


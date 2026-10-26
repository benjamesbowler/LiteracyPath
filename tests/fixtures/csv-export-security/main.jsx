import React from "react";
import { createRoot } from "react-dom/client";
import { TeacherReportsPage } from "../../../src/components/AppPages.jsx";
import { exportStudentAnswerHistoryCsv } from "../../../src/utils/exportStudentAnswerHistoryCsv.js";

const student = { id: "csv-student", name: 'Ari, "阿里"\nSecond line', class_id: "csv-class" };
const completedAt = new Date().toISOString();
const attempts = [{
  attemptId: ' \t=HYPERLINK("https://example.invalid","attempt")',
  studentId: student.id, studentName: student.name, classId: "csv-class", teacherId: "csv-teacher",
  skillId: "initial_sounds", skillName: "Initial sounds", assessmentType: "skill_checkpoint",
  status: "\u200b+SUM(1,2)", appVersion: '=HYPERLINK("https://example.invalid","version")',
  contentVersion: "＠SUM(1,2)", administrationStatus: "completed", completedAt,
  totalQuestions: 2, correctCount: 1
}];
const answers = [{
  date: completedAt, stage: "Initial sounds", question: " \n=1+2",
  chosen: '＝HYPERLINK("https://example.invalid","answer")', correct: 'safe, "正确"\nnext line',
  isCorrect: false, contentVersion: "@SUM(1,2)"
}];
window.csvFixture = { attempts, answers };
window.csvFixtureOriginal = JSON.stringify(window.csvFixture);
const root = createRoot(document.getElementById("root"));
if (new URLSearchParams(window.location.search).has("media")) {
  const { MediaQaReviewPage } = await import("../../../src/components/admin/MediaQaReviewPage.jsx");
  root.render(<MediaQaReviewPage />);
} else root.render(<>
  <TeacherReportsPage allAssessmentHistory={attempts}
    classList={[{ id: "csv-class", name: "CSV test class" }]}
    selectedClassId="csv-class" students={[student]}
    studentListReadState={{ status: "complete", complete: true, classId: "csv-class" }} />
  <button type="button" onClick={() => exportStudentAnswerHistoryCsv({
    answerHistory: answers, studentId: student.id, studentName: student.name, className: "CSV test class"
  })}>Download answer history fixture</button>
</>);

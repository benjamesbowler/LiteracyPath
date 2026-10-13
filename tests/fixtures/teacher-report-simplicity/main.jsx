import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { FamilySharingPanel } from "../../../src/components/teacher/family/FamilySharingPanel.jsx";
import { TeacherActivityHistory } from "../../../src/components/reports/TeacherActivityHistory.jsx";
import { TeacherReportsHubPage } from "../../../src/components/TeacherReportsHubPage.jsx";
import { buildParentReleaseSnapshot } from "../../../src/data/parentReleaseSnapshot.js";
import { validateClassRpcData } from "../../../src/data/boundaries/classes.js";

const student = { id: "11111111-1111-4111-8111-111111111111", name: "Ada" };
const nextStudent = { id: "22222222-2222-4222-8222-222222222222", name: "Bo" };
const initialWorkspace = { wholeChild: { studentId: student.id, concepts: [{ domain: "decoding", status: { id: "not_checked" } }] } };
window.testCalls = [];
window.expectedSnapshot = buildParentReleaseSnapshot({ workspace: initialWorkspace, studentId: student.id, studentName: student.name, className: "Willow", schoolName: "Test school" });
const mockRows = Array.from({ length: 25 }, (_, index) => ({ id: `mock-${String(index).padStart(2, "0")}`, class_id: "class-a", started_at: `2026-09-${String(28-index).padStart(2,"0")}T09:00:00Z`, member_student_ids: [index % 2 ? nextStudent.id : student.id], mock: { state: "completed", revision: 3, remaining_seconds: 0, snapshot_only: true } }));
const client = { async call(name, params) {
  window.testCalls.push({ name, params: structuredClone(params) });
  if (name === "teacher_list_guardian_access") return { data: { ok: true, invites: [], reports: [], links: [{ id: "link", display_name: "Adult", guardian_email: "guardian@example.invalid" }] } };
  if (name === "teacher_release_family_report") return { data: { ok: true } };
  if (name === "teacher_list_literacy_mock_history_page") {
    if (window.failNextHistory) { window.failNextHistory = false; return { error: { message: "Connection interrupted" } }; }
    const scoped = mockRows.filter(row => !params.p_student_id || row.member_student_ids.includes(params.p_student_id));
    const start = params.p_before_id ? scoped.findIndex(row => row.id === params.p_before_id) + 1 : 0;
    const rows = scoped.slice(start, start + params.p_limit);
    const tail = rows.at(-1);
    return { data: validateClassRpcData(name, { ok: true, sessions: rows, hasMore: start + rows.length < scoped.length, nextCursor: start + rows.length < scoped.length ? { id: tail.id, startedAt: tail.started_at } : null }) };
  }
  throw new Error(`Unexpected RPC ${name}`);
} };
const records = [{ attemptId: "saved-a", teacherId: "teacher-a", classId: "class-a", studentId: student.id, studentName: student.name, assessmentType: "skill_checkpoint", skillId: "initial_sounds", skillName: "Initial sounds", completedAt: "2026-10-13T09:00:00Z", administrationStatus: "completed", totalQuestions: 1, correctCount: 1, questionRecords: [{ questionId: "only-this-question", prompt: "Which sound starts sun?", itemKey: "s", itemType: "phoneme", responseStatus: "correct", selectedAnswer: "s", correctAnswer: "s" }] }];
function Fixture() {
  const [workspace, setWorkspace] = useState(initialWorkspace);
  const [selectedStudent, setSelectedStudent] = useState(student);
  if (new URLSearchParams(window.location.search).has("archived")) {
    const archivedRecord = { ...records[0], attemptId: "archived-attempt", studentId: "archived-student", studentName: "Archived Casey", questionRecords: [{ prompt: "Original archived question", selectedAnswer: "c", responseStatus: "correct" }] };
    return <TeacherReportsHubPage teacherId="teacher-a" classList={[{ id: "class-a", name: "Willow" }]}
      selectedClassId="class-a" className="Willow" studentRows={[student, nextStudent]}
      studentList={[student, nextStudent]} assessmentHistory={[...records, archivedRecord]} supabase={client}
      renderClassReport={() => <p>Whole class evidence</p>} />;
  }
  return <main style={{ fontFamily: "Arial, sans-serif", maxWidth: 1100, margin: "0 auto", padding: 24 }}>
    <h1>Teacher workflow verification</h1>
    <button onClick={() => setWorkspace({ wholeChild: { ...initialWorkspace.wholeChild, concepts: [{ domain: "decoding", status: { id: "secure" } }] } })}>Update incoming teacher evidence</button>
    <button onClick={() => setSelectedStudent(nextStudent)}>Switch to Bo</button>
    <FamilySharingPanel key={selectedStudent.id} client={client} workspace={workspace} studentId={selectedStudent.id} studentName={selectedStudent.name} className="Willow" schoolName="Test school" />
    <TeacherActivityHistory client={client} classId="class-a" className="Willow" students={[student, nextStudent]} records={records} onOpenActivity={row => { window.openedActivity = { sessionId: row.sessionId, studentId: row.studentId, classId: row.classId }; }} />
  </main>;
}
createRoot(document.getElementById("root")).render(<Fixture />);

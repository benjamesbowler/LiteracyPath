import { useState } from "react";
import { TeacherModal } from "./ui/TeacherDialog.jsx";

export function TeacherBookStudentPicker({ students, onChoose, onClose }) {
  const [studentId, setStudentId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return <TeacherModal labelledBy="book-student-title" onClose={onClose} busy={busy}>
    <div className="symbol-password-modal-card page-stack">
      <h2 id="book-student-title">Read with a student</h2>
      <p>Choose who is reading with you. Reading records belong to this student.</p>
      <label>Student<select value={studentId} onChange={event => setStudentId(event.target.value)}>
        <option value="">Choose a student</option>
        {students.map(student => <option key={student.id} value={student.id}>{student.name}</option>)}
      </select></label>
      {error && <p role="alert">{error}</p>}
      <button type="button" className="lp-button lp-button-primary" disabled={!studentId || busy} onClick={async () => {
        const student = students.find(row => row.id === studentId);
        if (!student) return;
        setBusy(true); setError("");
        try { await onChoose(student); } catch { setError("The student could not be opened. Nothing was recorded. Try again."); }
        finally { setBusy(false); }
      }}>{busy ? "Opening…" : "Open student reading"}</button>
      <button type="button" className="lp-button" disabled={busy} onClick={onClose}>Back to Books</button>
    </div>
  </TeacherModal>;
}

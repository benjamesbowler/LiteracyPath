import { useState } from "react";

import { studentFocusLabel } from "../../policy/studentFocusTargets.js";

export function StudentSessionBar({ session, members = [], students = [], connection = "idle", onEnd }) {
  const [ending, setEnding] = useState(false);
  const [message, setMessage] = useState("");
  if (!session) return null;
  const names = new Map(students.map(student => [student.id, student.name]));
  const connected = members.filter(member => member.connected).length;
  const completed = members.filter(member => member.status === "completed").length;
  const attention = members.filter(member => member.content_ok === false).length;

  async function end() {
    if (ending) return;
    setEnding(true);
    setMessage("");
    try {
      const ended = await onEnd?.();
      if (ended === false) setMessage("The session could not be ended. Check the connection and try again.");
    } catch {
      setMessage("The session could not be ended. Check the connection and try again.");
    } finally {
      setEnding(false);
    }
  }

  return (
    <aside className="student-session-bar" aria-label="Active student session">
      <div>
        <span className="student-session-live">Live</span>
        <strong>{studentFocusLabel(session.target)}</strong>
        <span>{members.length} assigned · {connected} connected · {completed} finished{attention ? ` · ${attention} need help` : ""}</span>
        {connection === "reconnecting" && <span className="student-session-reconnecting">Reconnecting…</span>}
      </div>
      <details>
        <summary>Students</summary>
        <ul>
          {members.map(member => (
            <li key={member.student_id}>
              <span>{names.get(member.student_id) || "Student"}</span>
              <strong>{member.status === "completed" ? "Finished" : member.connected ? "Connected" : "Waiting"}</strong>
            </li>
          ))}
        </ul>
      </details>
      <button className="lp-button lp-button-secondary" disabled={ending} onClick={end} type="button">
        {ending ? "Ending…" : "End session"}
      </button>
      {message && <p role="alert">{message}</p>}
    </aside>
  );
}

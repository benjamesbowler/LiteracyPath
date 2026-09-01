import { useState } from "react";

import { STUDENT_ADVENTURE_MAP_MODES } from "../../policy/studentFocusAssignments.js";
import { STUDENT_FOCUS_END_ACTIONS } from "../../policy/studentFocusExit.js";
import {
  STUDENT_FOCUS_TARGETS,
  studentFocusLabel
} from "../../policy/studentFocusTargets.js";

export function StudentSessionBar({ session, members = [], students = [], connection = "idle", onEnd }) {
  const [endingAction, setEndingAction] = useState("");
  const [message, setMessage] = useState("");
  if (!session) return null;
  const names = new Map(students.map(student => [student.id, student.name]));
  const connected = members.filter(member => member.connected).length;
  const completed = members.filter(member => member.status === "completed").length;
  const attention = members.filter(member => member.content_ok === false).length;
  const resolvedConfig = members.find(member => member?.resolved_config)?.resolved_config || {};
  const mapTitle = resolvedConfig.map_mode === STUDENT_ADVENTURE_MAP_MODES.EACH_CHILD_CURRENT
    ? "Each child's current space"
    : resolvedConfig.map_mode === STUDENT_ADVENTURE_MAP_MODES.ONE_SPACE_FOR_EVERYONE
      ? `One space for everyone · ${resolvedConfig.space_name || "Map space"}${resolvedConfig.cycle_number ? `, Cycle ${resolvedConfig.cycle_number}` : ""}`
      : "";
  const exactTitle = session.target === STUDENT_FOCUS_TARGETS.ASSIGNED_BOOK
    ? resolvedConfig.book_title
    : session.target === STUDENT_FOCUS_TARGETS.ARCADE_GAME
      ? resolvedConfig.game_title
      : session.target === STUDENT_FOCUS_TARGETS.ADVENTURE_MAP
        ? mapTitle
        : "";
  const audienceLabel = (session.selection_scope || session.audience) === "whole_class"
    ? "Whole class"
    : "Selected students";

  async function end(endAction) {
    if (endingAction) return;
    setEndingAction(endAction);
    setMessage("");
    try {
      const ended = await onEnd?.(endAction);
      if (ended === false) setMessage("The session could not be ended. Check the connection and try again.");
    } catch {
      setMessage("The session could not be ended. Check the connection and try again.");
    } finally {
      setEndingAction("");
    }
  }

  return (
    <aside className="student-session-bar" aria-label="Active student session">
      <div className="student-session-bar-summary">
        <span className="student-session-live">Live</span>
        <strong>{studentFocusLabel(session.target)}{exactTitle ? `: ${exactTitle}` : ""}</strong>
        <span>{audienceLabel} · {members.length} assigned · {connected} connected · {completed} finished{attention ? ` · ${attention} need help` : ""}</span>
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
      <div className="student-session-bar-actions">
        <button
          className="lp-button lp-button-secondary"
          disabled={Boolean(endingAction)}
          onClick={() => end(STUDENT_FOCUS_END_ACTIONS.RETURN_HOME)}
          type="button"
        >
          {endingAction === STUDENT_FOCUS_END_ACTIONS.RETURN_HOME ? "Ending session…" : "End session"}
        </button>
        <button
          className="lp-button lp-button-primary student-session-switch-button"
          disabled={Boolean(endingAction)}
          onClick={() => end(STUDENT_FOCUS_END_ACTIONS.STUDENT_PICKER)}
          type="button"
        >
          {endingAction === STUDENT_FOCUS_END_ACTIONS.STUDENT_PICKER ? "Ending and switching…" : "End & switch students"}
        </button>
      </div>
      {message && <p role="alert">{message}</p>}
    </aside>
  );
}

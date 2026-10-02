import { useState } from "react";
import { cycleLearningResponseRows, cycleResultSummary, cycleDurationSummary, exportCycleSessionResultsCsv, cyclePracticeEvidenceProfile, studentSessionOperationalState, memberCyclePracticeTitle, sessionCyclePracticeTitle } from "../../utils/cyclePracticeReporting.js";
import { LearningEvidenceProfile } from "../reports/LearningEvidenceProfile.jsx";

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
  const contentUnavailable = members.filter(member => ["Content unavailable", "Media unavailable"].includes(studentSessionOperationalState(member))).length;
  const waiting = members.filter(member => studentSessionOperationalState(member) === "Waiting for connection").length;
  const incomplete = members.filter(member => studentSessionOperationalState(member) === "Assessment incomplete").length;
  const resolvedConfig = members.find(member => member?.resolved_config)?.resolved_config || {};
  const mapTitle = resolvedConfig.map_mode === STUDENT_ADVENTURE_MAP_MODES.EACH_CHILD_CURRENT
    ? "Each student's current space"
    : resolvedConfig.map_mode === STUDENT_ADVENTURE_MAP_MODES.ONE_SPACE_FOR_EVERYONE
      ? `One space for everyone · ${resolvedConfig.space_name || "Map space"}${resolvedConfig.cycle_number ? `, Cycle ${resolvedConfig.cycle_number}` : ""}`
      : "";
  const exactTitle = session.target === STUDENT_FOCUS_TARGETS.ASSIGNED_BOOK
    ? resolvedConfig.book_title
    : session.target === STUDENT_FOCUS_TARGETS.ARCADE_GAME
      ? resolvedConfig.game_title
      : session.target === STUDENT_FOCUS_TARGETS.ADVENTURE_MAP
        ? mapTitle
        : session.target === STUDENT_FOCUS_TARGETS.CYCLE_PRACTICE
          ? sessionCyclePracticeTitle(members)
        : "";
  const audienceLabel = (session.selection_scope || session.audience) === "whole_class"
    ? "Whole class"
    : "Selected students";

  function exportCycleResults() {
    const url = URL.createObjectURL(new Blob([exportCycleSessionResultsCsv(members, students)], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "cycle-practice-results.csv";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

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
    <aside className={`student-session-bar${session.target === STUDENT_FOCUS_TARGETS.CYCLE_PRACTICE ? " student-session-cycle-bar" : ""}`} aria-label="Active student session">
      <div className="student-session-bar-summary">
        <span className="student-session-live">Live</span>
        <strong>{studentFocusLabel(session.target)}{exactTitle ? `: ${exactTitle}` : ""}</strong>
        <span>{audienceLabel} · {members.length} assigned · {connected} connected · {completed} finished{contentUnavailable ? ` · ${contentUnavailable} content unavailable` : ""}{waiting ? ` · ${waiting} waiting for connection` : ""}{incomplete ? ` · ${incomplete} assessment incomplete` : ""}</span>
        {connection === "reconnecting" && <span className="student-session-reconnecting">Reconnecting…</span>}
      </div>
      <details>
        <summary>Students</summary>
        <ul>
          {members.map(member => (
            <li key={member.student_id} className={member.cycle_practice_result ? "student-session-cycle-result" : undefined}>
              <span>{names.get(member.student_id) || "Student"}</span>
              {session.target === STUDENT_FOCUS_TARGETS.CYCLE_PRACTICE && <span>{memberCyclePracticeTitle(member)}</span>}
              <strong>{studentSessionOperationalState(member)}</strong>
              {member.cycle_practice_result && (
                <div className="student-session-cycle-evidence">
                  <p>{cycleResultSummary(member.cycle_practice_result)}</p>
                  <p>{cycleDurationSummary(member.cycle_practice_result)}</p>
                  <details><summary>View practice and assessment results</summary>
                  <p>Areas practised (client-reported): {member.cycle_practice_result.practiceManifest?.length
                    ? member.cycle_practice_result.practiceManifest.map(area => `${area.construct.replace(/_/g, " ")} (${area.responses} responses)`).join(", ")
                    : "Not recorded"}</p>
                  <p>Areas assessed: {member.cycle_practice_result.checkedConstructs?.length
                    ? member.cycle_practice_result.checkedConstructs.map(area => area.replace(/_/g, " ")).join(", ")
                    : "Not recorded"}</p>
                  {cycleLearningResponseRows(member.cycle_practice_result).length > 0 && <details>
                    <summary>First answers, teaching and fresh practice</summary>
                    <p>Saved client practice details. Teaching and immediate transfer do not change the check score.</p>
                    {cycleLearningResponseRows(member.cycle_practice_result).map(row => <p key={row.id}>{row.label}: {row.selected || "No answer"} · Model: {row.expected} · {row.role === "guided" ? "With help" : row.responseStatus !== "answered" ? row.responseStatus : row.observedCorrect === true ? "Matched" : row.observedCorrect === false ? "Not yet" : "Unscored"}</p>)}
                  </details>}
                  <small>Practice results · not a formal assessment</small>
                  <LearningEvidenceProfile profile={cyclePracticeEvidenceProfile(member.cycle_practice_result)} title="Practice coverage and next steps" />
                  {member.cycle_practice_result.receivedAfterSessionEnd && <p>Recovered after the session ended.</p>}
                  </details>
                </div>
              )}
            </li>
          ))}
        </ul>
      </details>
      <div className="student-session-bar-actions">
        {session.target === STUDENT_FOCUS_TARGETS.CYCLE_PRACTICE && members.some(member => member.cycle_practice_result) && (
          <button className="lp-button lp-button-secondary" type="button" onClick={exportCycleResults}>Export practice results</button>
        )}
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

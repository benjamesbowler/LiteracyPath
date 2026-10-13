import { useEffect, useRef, useState } from "react";
import { TEACHER_WORKFLOW_COPY as FLOW } from "../../copy/teacherWorkflowCopy.js";
import "../../styles/teacher-context-bar.css";

export function TeacherContextBar({ className = "", classCode = "", schoolName = "", studentCount = null, onChangeClass, onPresent, onHelp }) {
  const [copyState, setCopyState] = useState("idle");
  const copyResetRef = useRef(0);
  useEffect(() => () => window.clearTimeout(copyResetRef.current), []);
  async function copyClassCode() {
    try {
      await navigator.clipboard.writeText(classCode);
      setCopyState("copied");
      window.clearTimeout(copyResetRef.current);
      copyResetRef.current = window.setTimeout(() => setCopyState("idle"), 1800);
    } catch { setCopyState("failed"); }
  }
  const details = [schoolName, Number.isFinite(studentCount) ? `${studentCount} students` : ""].filter(Boolean);
  return <div className="teacher-context-bar" data-teacher-context-bar>
    <div className="tcb-block">
      <span className="tcb-class-row"><strong className="tcb-class-name">{className || "No class selected"}</strong>
        {onChangeClass && <button type="button" className="tcb-change" onClick={onChangeClass}>Change class</button>}
      </span>
      {!!details.length && <span className="tcb-detail">{details.join(" · ")}</span>}
    </div>
    <span className="tcb-spacer" aria-hidden="true" />
    {classCode && <details className="tcb-sign-in" key={classCode}>
      <summary>{FLOW.signIn}</summary>
      <div className="tcb-sign-in-content">
        <p>Students enter this code, then choose their sign-in pictures.</p>
        <button type="button" className="tcb-class-code" aria-label={`Copy student sign-in code ${classCode}`} onClick={copyClassCode}>
          <strong>{classCode}</strong><em aria-live="polite">{copyState === "copied" ? "Copied" : copyState === "failed" ? "Try again" : "Copy code"}</em>
        </button>
      </div>
    </details>}
    <div className="tcb-actions">
      {onPresent && <button type="button" className="lp-button lp-button-secondary tcb-action" onClick={onPresent}>{FLOW.lesson}</button>}
      {onHelp && <button type="button" className="lp-button lp-button-secondary tcb-action" onClick={onHelp}>{FLOW.help}</button>}
    </div>
  </div>;
}

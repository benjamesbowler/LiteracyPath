import "./teacherSessionFrame.css";

const PHASES = [{ id: "prepare", label: "Prepare" }, { id: "live", label: "Live" }, { id: "results", label: "Results" }];

export function TeacherSessionFrame({ phase = "prepare", protocol, onPhaseChange, availablePhases = [phase], audience, students = [], children, onReturn, returnLabel = "Return to class", compact = false }) {
  return <section className={`teacher-session-frame${compact ? " is-compact" : ""}`} data-session-protocol={protocol} data-session-phase={phase} aria-label="Session workspace">
    <ol className="teacher-session-phases" aria-label="Session stages">
      {PHASES.map(item => <li key={item.id} aria-current={phase === item.id ? "step" : undefined}>{onPhaseChange && availablePhases.includes(item.id)
        ? <button type="button" aria-pressed={phase === item.id} onClick={() => onPhaseChange(item.id)}>{item.label}</button>
        : <span>{item.label}</span>}</li>)}
    </ol>
    {audience && <div className="teacher-session-audience">{students.length ? <details><summary>{audience}</summary><ul>{students.map(student => <li key={student.id || student.student_id}>{student.name || "Student"}</li>)}</ul></details> : <span>{audience}</span>}</div>}
    {children}
    {onReturn && <button type="button" className="lp-button lp-button-secondary teacher-session-return" onClick={onReturn}>{returnLabel}</button>}
  </section>;
}

import { SUBJECT_IDS, SUBJECTS } from "../subjects/subjectRegistry.js";
import "../styles/maths-phase-zero.css";

function SubjectIcon({ subjectId }) {
  if (subjectId === SUBJECT_IDS.MATHS) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle cx="7" cy="7" r="3" />
        <path d="M14 4h6v6h-6zM4 14h6v6H4zM17 14l4 6h-8l4-6z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 5.5C4 4.7 4.7 4 5.5 4H11c1 0 1.8.3 2.5 1A3.6 3.6 0 0 1 16 4h2.5c.8 0 1.5.7 1.5 1.5v14c0 .4-.3.7-.7.7H16c-1 0-1.9.3-2.6.8-.2.2-.6.2-.8 0-.7-.5-1.6-.8-2.6-.8H4.7c-.4 0-.7-.3-.7-.7v-14Z" />
      <path d="M12.1 7v11.6M14.9 7c.4-.6 1.1-1 2.1-1h2M9.9 6H6v12.2h4c.8 0 1.5.1 2.1.4" />
    </svg>
  );
}
export function SubjectSwitch({
  activeSubject = SUBJECT_IDS.LITERACY,
  onSelectSubject,
  variant = "teacher",
  className = ""
}) {
  return (
    <div
      className={`lp-subject-switch lp-subject-switch--${variant}${className ? ` ${className}` : ""}`}
      role="group"
      aria-label="Choose subject"
      data-active-subject={activeSubject}
    >
      {Object.values(SUBJECTS).map(subject => {
        const active = subject.id === activeSubject;
        return (
          <button
            key={subject.id}
            type="button"
            className={`lp-subject-switch-option${active ? " is-active" : ""}`}
            aria-pressed={active}
            aria-label={`${subject.label}${active ? ", current subject" : ""}`}
            onClick={active ? undefined : () => onSelectSubject?.(subject.id)}
          >
            <SubjectIcon subjectId={subject.id} />
            <span className="lp-subject-switch-label">{subject.label}</span>
          </button>
        );
      })}
    </div>
  );
}

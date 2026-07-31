import { useEffect, useMemo, useRef, useState } from "react";
import { teacherCycleOptions } from "./teacherCycleReference.js";
import "../../styles/teacher-context-bar.css";

// The persistent teacher context bar (teacher-area redesign v2, phase 1).
// Sits above every teacher screen: which class and school you are acting for,
// the teaching cycle you are working to, and the two always-available actions.
//
// The cycle here is a TEACHER-SET REFERENCE, not automation: Benjamin's call
// (2026-07-28) - the teacher steps it with the small previous/next buttons or
// picks it directly, and the choice feeds Present mode's default cycle. It is
// remembered in localStorage and changes nothing about student data.

const TEACHING_CYCLES = teacherCycleOptions();

export function TeacherContextBar({
  className = "",
  classCode = "",
  schoolName = "",
  studentCount = null,
  cycleId = "",
  onChangeCycle,
  onChangeClass,
  onPresent,
  onAssess
}) {
  const [copyState, setCopyState] = useState("idle");
  const copyResetRef = useRef(0);
  const cycleIndex = useMemo(() => {
    const index = TEACHING_CYCLES.findIndex(option => option.id === cycleId);
    return index === -1 ? 0 : index;
  }, [cycleId]);
  const cycle = TEACHING_CYCLES[cycleIndex];

  const detailParts = [
    schoolName,
    Number.isFinite(studentCount) && studentCount > 0
      ? `${studentCount} student${studentCount === 1 ? "" : "s"}`
      : ""
  ].filter(Boolean);

  function stepCycle(delta) {
    const next = TEACHING_CYCLES[cycleIndex + delta];
    if (next) onChangeCycle?.(next.id);
  }

  useEffect(() => () => window.clearTimeout(copyResetRef.current), []);

  async function copyClassCode() {
    try {
      await navigator.clipboard.writeText(classCode);
      setCopyState("copied");
      window.clearTimeout(copyResetRef.current);
      copyResetRef.current = window.setTimeout(() => setCopyState("idle"), 1800);
    } catch {
      setCopyState("failed");
    }
  }

  return (
    <div className="teacher-context-bar" data-teacher-context-bar>
      <div className="tcb-block">
        <span className="tcb-label" id="tcb-class-label">School and class</span>
        <span className="tcb-class-row">
          <strong className="tcb-class-name">{className || "No class selected"}</strong>
          {onChangeClass && (
            <button type="button" className="tcb-change" onClick={onChangeClass}>
              Change
            </button>
          )}
        </span>
        {detailParts.length > 0 && (
          <span className="tcb-detail">{detailParts.join(" · ")}</span>
        )}
        {classCode && (
          <button
            type="button"
            className="tcb-class-code"
            aria-label={`Copy student sign-in code ${classCode}`}
            title="Copy student sign-in code"
            onClick={copyClassCode}
          >
            <span>Student sign-in code</span>
            <strong>{classCode}</strong>
            <em aria-live="polite">
              {copyState === "copied" ? "Copied" : copyState === "failed" ? "Try again" : "Copy"}
            </em>
          </button>
        )}
      </div>

      <span className="tcb-divider" aria-hidden="true" />

      <div className="tcb-block">
        <span className="tcb-label" id="tcb-cycle-label">Teaching cycle</span>
        <span className="tcb-cycle-row" role="group" aria-labelledby="tcb-cycle-label">
          <button
            type="button"
            className="tcb-step"
            onClick={() => stepCycle(-1)}
            disabled={cycleIndex === 0}
            aria-label="Previous cycle"
          >
            ‹
          </button>
          <select
            className="tcb-cycle-select"
            aria-label="Teaching cycle for reference"
            value={cycle?.id || ""}
            onChange={event => onChangeCycle?.(event.target.value)}
          >
            {TEACHING_CYCLES.map(option => (
              <option key={option.id} value={option.id}>{option.label}</option>
            ))}
          </select>
          <button
            type="button"
            className="tcb-step"
            onClick={() => stepCycle(1)}
            disabled={cycleIndex === TEACHING_CYCLES.length - 1}
            aria-label="Next cycle"
          >
            ›
          </button>
        </span>
      </div>

      <span className="tcb-spacer" aria-hidden="true" />

      <div className="tcb-actions">
        <button type="button" className="lp-button lp-button-secondary tcb-action" onClick={onPresent}>
          Present
        </button>
        <button type="button" className="lp-button lp-button-primary tcb-action" onClick={onAssess}>
          Assess a student
        </button>
      </div>
    </div>
  );
}

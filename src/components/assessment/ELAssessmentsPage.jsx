/**
 * THE SEQUENCE GATE FOR THE FOUR EL CHECKS.
 *
 * This file used to be a whole second hub page for starting checks: it asked
 * for grade and time of year, hid the starting band inside a collapsed
 * "Advanced" panel, and carried its own grid of start buttons. That made two
 * live ways to start the same check - this page and the roster - and neither
 * had a URL, so a refresh threw the teacher back to the student list.
 *
 * The Checks funnel owns the layout now. The band rules moved next door to
 * elBenchmarkStartPoint.js. What is left here is the one piece of teaching
 * safeguard the funnel must not be allowed to skip: if the chosen start
 * deviates from what this child's own saved results indicate, the teacher says
 * why, and the reason is recorded on the attempt.
 */
import { useEffect, useRef, useState } from "react";
import {
  EL_PREREQUISITE_REASON_OPTIONS,
  getPrerequisiteReasonText
} from "./elBenchmarkStartPoint.js";
import "../../styles/el-assessment-hub.css";

/**
 * The sequence gate. It appears only when the chosen start deviates from what
 * the child's own results indicate, and Begin stays shut until a reason is
 * recorded. Results are descriptive: no unpublished cut score is assumed.
 */
export function ElPrerequisiteReview({
  message = "",
  onCancel,
  onConfirm,
  startLabel = "Begin the check"
}) {
  const [reasonId, setReasonId] = useState("");
  const [otherReason, setOtherReason] = useState("");
  const panelRef = useRef(null);
  const reasonText = getPrerequisiteReasonText(reasonId, otherReason);

  useEffect(() => {
    panelRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <section
      aria-labelledby="el-prerequisite-review-title"
      className="el-assessment-prerequisite-review"
      ref={panelRef}
      tabIndex="-1"
    >
      <div>
        <p className="panel-label">Sequence check</p>
        <h3 id="el-prerequisite-review-title">One quick question before you start</h3>
        <p>{message}</p>
      </div>
      <fieldset className="el-assessment-reason-fieldset">
        <legend>Why are you starting here?</legend>
        <div className="el-assessment-reason-options">
          {EL_PREREQUISITE_REASON_OPTIONS.map(option => (
            <button
              aria-pressed={reasonId === option.id}
              key={option.id}
              onClick={() => {
                setReasonId(option.id);
                if (option.id !== "other") setOtherReason("");
              }}
              type="button"
            >
              <strong>{option.label}</strong>
              <small>{option.detail}</small>
            </button>
          ))}
        </div>
      </fieldset>
      {reasonId === "other" && (
        <label className="el-assessment-other-reason">
          Short explanation
          <textarea
            onChange={event => setOtherReason(event.target.value)}
            placeholder="Note the result or the reason in a few words."
            rows={2}
            value={otherReason}
          />
        </label>
      )}
      <div className="teacher-action-list">
        <button
          className="lp-button lp-button-primary"
          disabled={!reasonText}
          onClick={() => onConfirm?.(reasonText)}
          type="button"
        >
          {startLabel}
        </button>
        <button
          className="lp-button lp-button-secondary"
          onClick={onCancel}
          type="button"
        >
          Cancel
        </button>
      </div>
    </section>
  );
}

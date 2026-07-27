import { forwardRef } from "react";

/**
 * ONE STEP OF A FUNNEL, ON ONE PAGE.
 *
 * Checks and Reports both ask a short series of questions and both used to
 * scatter them over several screens. They share this component so a teacher
 * learns the shape once: a numbered step, the answer showing as soon as it is
 * given, a "Change" control that never moves, and the steps below greyed with
 * the reason they are not ready yet - never hidden, so the whole path is
 * visible from the start.
 *
 * The heading takes focus when a step unlocks, which is what makes the flow
 * usable with a keyboard or a screen reader: the answer to "what happened when
 * I chose that?" is read out, in place, without hunting.
 */
export const TeacherFunnelStep = forwardRef(function TeacherFunnelStep({
  number,
  title,
  help = "",
  answer = "",
  lockedReason = "",
  open = false,
  onChange = null,
  changeLabel = "Change",
  children
}, ref) {
  const headingId = `funnel-step-${number}-title`;
  const locked = Boolean(lockedReason);
  const settled = Boolean(answer) && !open;

  return (
    <section
      aria-labelledby={headingId}
      className={`teacher-funnel-step${locked ? " locked" : ""}${settled ? " settled" : ""}`}
      data-step={number}
    >
      <div className="teacher-funnel-step-head">
        <span className="teacher-funnel-step-number" aria-hidden="true">{number}</span>
        <div>
          <h3 id={headingId} ref={ref} tabIndex="-1">{title}</h3>
          {settled ? (
            <p className="teacher-funnel-step-answer">{answer}</p>
          ) : locked ? (
            <p className="teacher-funnel-step-locked">{lockedReason}</p>
          ) : help ? (
            <p className="teacher-funnel-step-help">{help}</p>
          ) : null}
        </div>
        {settled && onChange && (
          <button className="text-button" onClick={onChange} type="button">
            {changeLabel}
          </button>
        )}
      </div>
      {!locked && !settled && <div className="teacher-funnel-step-body">{children}</div>}
    </section>
  );
});

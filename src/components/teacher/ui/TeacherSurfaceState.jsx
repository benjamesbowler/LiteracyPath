import {
  TEACHER_SURFACE_STATE_FIXTURES,
  getTeacherSurfaceState
} from "./teacherSurfaceStates.js";

export function TeacherSurfaceState({
  surface,
  state,
  detail = "",
  onPrimaryAction,
  onSecondaryAction,
  compact = false
}) {
  const content = getTeacherSurfaceState(surface, state);
  const titleId = `teacher-surface-state-${surface}-${state}-title`;

  return (
    <section
      className={`teacher-surface-state is-${content.tone}${compact ? " is-compact" : ""}`}
      data-teacher-surface={surface}
      data-teacher-state={state}
      role={content.role}
      aria-live={content.live}
      aria-busy={content.busy || undefined}
      aria-labelledby={titleId}
    >
      <div className="teacher-surface-state-marker" aria-hidden="true">
        <span className="teacher-surface-state-symbol" />
        {content.marker}
      </div>
      <div className="teacher-surface-state-copy">
        <p className="panel-label">{content.surfaceLabel}</p>
        <h3 id={titleId}>{content.title}</h3>
        <p>{content.body}</p>
        {content.preserved && (
          <p className="teacher-surface-state-preserved">
            <strong>What stays safe:</strong> {content.preserved}
          </p>
        )}
        {detail && <p className="teacher-surface-state-detail">{detail}</p>}
      </div>
      {(content.primaryLabel || content.secondaryLabel) && (
        <div className="teacher-surface-state-actions">
          {content.primaryLabel && (
            <button
              className="lp-button lp-button-primary"
              type="button"
              onClick={onPrimaryAction}
            >
              {content.primaryLabel}
            </button>
          )}
          {content.secondaryLabel && (
            <button
              className="lp-button lp-button-secondary"
              type="button"
              onClick={onSecondaryAction}
            >
              {content.secondaryLabel}
            </button>
          )}
        </div>
      )}
    </section>
  );
}

export function TeacherSurfaceStateFixtureSheet() {
  return (
    <main className="teacher-state-fixture-sheet">
      <header>
        <p className="panel-label">Teacher surface states</p>
        <h1>Five surfaces × eight recoverable states</h1>
        <p>Fixture sheet for copy, hierarchy, actions, and assistive-technology behavior.</p>
      </header>
      {TEACHER_SURFACE_STATE_FIXTURES.map(fixture => (
        <TeacherSurfaceState
          key={fixture.id}
          surface={fixture.surfaceId}
          state={fixture.stateId}
        />
      ))}
    </main>
  );
}

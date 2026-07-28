import {
  TEACHER_SURFACE_STATE_FIXTURES,
  getTeacherSurfaceState
} from "./teacherSurfaceStates.js";
import { beginTeacherSurfaceRecoveryFocus } from "./teacherSurfaceRecoveryFocus.js";

export function TeacherSurfaceState({
  surface,
  state,
  detail = "",
  onPrimaryAction,
  onSecondaryAction,
  primaryLabel = "",
  secondaryLabel = "",
  compact = false
}) {
  const content = getTeacherSurfaceState(surface, state);
  const titleId = `teacher-surface-state-${surface}-${state}-title`;
  // A recovery button is only offered when something actually happens on tap.
  // The copy catalog defines a label for every non-loading state, so rendering
  // on the label alone put buttons on screen at call sites that never passed a
  // handler - a teacher pressed "Make your class" and nothing at all happened.
  const resolvedPrimaryLabel = primaryLabel || content.primaryLabel;
  const resolvedSecondaryLabel = secondaryLabel || content.secondaryLabel;
  const showPrimary = Boolean(resolvedPrimaryLabel && onPrimaryAction);
  const showSecondary = Boolean(resolvedSecondaryLabel && onSecondaryAction);

  return (
    <section
      className={`teacher-surface-state is-${content.tone}${compact ? " is-compact" : ""}`}
      data-teacher-surface={surface}
      data-teacher-state={state}
      tabIndex="-1"
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
      {(showPrimary || showSecondary) && (
        <div className="teacher-surface-state-actions">
          {showPrimary && (
            <button
              className="lp-button lp-button-primary"
              type="button"
              onClick={event => {
                beginTeacherSurfaceRecoveryFocus({
                  surface,
                  sourceControl: event.currentTarget
                });
                onPrimaryAction();
              }}
            >
              {resolvedPrimaryLabel}
            </button>
          )}
          {showSecondary && (
            <button
              className="lp-button lp-button-secondary"
              type="button"
              onClick={onSecondaryAction}
            >
              {resolvedSecondaryLabel}
            </button>
          )}
        </div>
      )}
    </section>
  );
}

// The fixture sheet mirrors only states that are actually selected by the
// production read-state branches. It supplies handlers so every real recovery
// action can be reviewed without adding a test-only product route.
function previewAction() {}

export function TeacherSurfaceStateFixtureSheet() {
  return (
    <main className="teacher-state-fixture-sheet">
      <header>
        <p className="panel-label">Teacher surface states</p>
        <h1>Production teacher read states</h1>
        <p>Fixture sheet for the loading, empty and incomplete-data states used by live teacher pages.</p>
      </header>
      {TEACHER_SURFACE_STATE_FIXTURES.map(fixture => (
        <TeacherSurfaceState
          key={fixture.id}
          surface={fixture.surfaceId}
          state={fixture.stateId}
          onPrimaryAction={previewAction}
          onSecondaryAction={previewAction}
        />
      ))}
    </main>
  );
}

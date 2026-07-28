import { useEffect, useRef, useState } from "react";
import { QUESTION_TYPE_GUIDE } from "../../data/questionTypeGuide.js";
import { TeacherModal } from "./ui/TeacherDialog.jsx";
import { MetricFigure } from "../MetricDefinition.jsx";
import {
  LEARNER_ACCESSIBILITY_FIELDS,
  normalizeLearnerAccessibilitySettings
} from "../../accessibility/learnerAccessibility.js";
import { TEACHER_COPY, progressPhrase } from "../../copy/teacherCopy.js";
import {
  ACCESSIBILITY_SAVE_ERROR,
  runAccessibilitySave
} from "./accessibilitySaveFlow.js";

// Presentational pieces shared by the Today page and the Students page. Kept
// apart from teacherClassModel.js so each module exports one kind of thing.

export function RosterMetric({
  definitionId = "",
  definitionOptions = {},
  label,
  value,
  tone = ""
}) {
  return (
    <div className={["teacher-roster-metric", tone].filter(Boolean).join(" ")}>
      <span>{label}</span>
      <strong>
        {definitionId
          ? <MetricFigure metricId={definitionId} {...definitionOptions}>{value}</MetricFigure>
          : value}
      </strong>
    </div>
  );
}
export function StudentInitial({ name }) {
  return (
    <span className="teacher-student-initial" aria-hidden="true">
      {String(name || "S").slice(0, 1).toUpperCase()}
    </span>
  );
}
export function QuestionTypeGuideDialog({ query, onQueryChange, onClose }) {
  const normalizedQuery = query.trim().toLowerCase();
  const rows = QUESTION_TYPE_GUIDE.filter(row => (
    !normalizedQuery
    || [row.name, row.what, row.skill, row.onMiss]
      .some(value => value.toLowerCase().includes(normalizedQuery))
  ));

  return (
    <TeacherModal
      className="teacher-question-guide-modal"
      label={TEACHER_COPY.help.checkGuide}
      onClose={onClose}
    >
      <section className="symbol-password-modal-card teacher-question-guide-dialog">
        <header>
          <div>
            <p className="panel-label">{TEACHER_COPY.help.checkGuideLabel}</p>
            <h2>{TEACHER_COPY.help.checkGuide}</h2>
            <p>{TEACHER_COPY.help.checkGuideBody}</p>
          </div>
          <button className="text-button" type="button" onClick={onClose}>
            {TEACHER_COPY.help.checkGuideClose}
          </button>
        </header>
        <label className="teacher-question-guide-search">
          <span>Search assessments, skills, or teaching guidance</span>
          <input
            data-autofocus
            type="search"
            value={query}
            onChange={event => onQueryChange(event.target.value)}
            placeholder="Try digraphs, blending, or sight words"
          />
        </label>
        <p className="teacher-question-guide-count" role="status">
          {progressPhrase(rows.length, QUESTION_TYPE_GUIDE.length)} assessments shown
        </p>
        {rows.length ? (
          <ul
            className="teacher-question-guide-results"
            aria-label="Assessment explanations"
            tabIndex={0}
          >
            {rows.map(row => (
              <li key={row.id}>
                <article aria-labelledby={`question-guide-${row.id}`}>
                  <header>
                    <h3 id={`question-guide-${row.id}`}>{row.name}</h3>
                    <span>{row.skill}</span>
                  </header>
                  <dl>
                    <div>
                      <dt>What the student does</dt>
                      <dd>{row.what}</dd>
                    </div>
                    <div>
                      <dt>If they miss it</dt>
                      <dd>{row.onMiss}</dd>
                    </div>
                  </dl>
                </article>
              </li>
            ))}
          </ul>
        ) : (
          <div className="report-empty-state">
            <strong>No matching assessment.</strong>
            <p>Try a skill such as rhyme, blending, digraphs, grammar, or sight words.</p>
          </div>
        )}
      </section>
    </TeacherModal>
  );
}
export function LearnerAccessibilityDialog({ student, saving = false, onSave, onClose }) {
  const [draft, setDraft] = useState(
    () => normalizeLearnerAccessibilitySettings(student?.accessibilitySettings)
  );
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState("");
  const saveButtonRef = useRef(null);
  const busy = saving || submitting;

  useEffect(() => {
    // A failed request first has to re-enable the button. Focusing it in the
    // same tick as setSubmitting(false) targets the still-disabled DOM node
    // and browsers correctly ignore that focus request.
    if (!saveError || busy) return;
    saveButtonRef.current?.focus();
  }, [busy, saveError]);

  async function save() {
    if (busy) return;
    setSubmitting(true);
    setSaveError("");
    const result = await runAccessibilitySave({ onSave, student, draft });
    setSubmitting(false);
    if (result.ok) {
      onClose?.();
      return;
    }
    setSaveError(result.error || ACCESSIBILITY_SAVE_ERROR);
  }

  return (
    <TeacherModal
      className="teacher-accessibility-settings-modal"
      label={`Accessibility settings for ${student.name}`}
      onClose={() => {
        if (!busy) onClose?.();
      }}
    >
      <section className="symbol-password-modal-card teacher-accessibility-settings-card">
        <header>
          <div>
            <p className="panel-label">Student access</p>
            <h2>{student.name}&apos;s accessibility settings</h2>
            <p>These choices follow this student across signed-in devices.</p>
          </div>
          <button className="text-button" type="button" disabled={busy} onClick={onClose}>
            Close settings
          </button>
        </header>
        <fieldset className="teacher-accessibility-setting-list">
          <legend>Comfort and response supports</legend>
          {LEARNER_ACCESSIBILITY_FIELDS.map(field => (
            <label key={field.id}>
              <input
                type="checkbox"
                checked={draft[field.id]}
                disabled={busy}
                onChange={event => {
                  setSaveError("");
                  setDraft(current => ({
                    ...current,
                    [field.id]: event.target.checked
                  }));
                }}
              />
              <span>
                <strong>{field.label}</strong>
                <small>{field.description}</small>
              </span>
            </label>
          ))}
        </fieldset>
        {busy && (
          <p className="muted-text" role="status">Saving accessibility settings…</p>
        )}
        {saveError && (
          <p className="teacher-inline-error" role="alert">{saveError}</p>
        )}
        <div className="teacher-roster-operation-actions">
          <button
            ref={saveButtonRef}
            className="lp-button lp-button-primary"
            type="button"
            disabled={busy}
            onClick={save}
          >
            {busy ? "Saving settings..." : "Save accessibility settings"}
          </button>
          <button
            className="lp-button lp-button-secondary"
            type="button"
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </section>
    </TeacherModal>
  );
}
export function TeacherSetupChecklist({
  hasClass,
  steps = [],
  onContinue,
  onCreateDemo,
  creatingDemo = false
}) {
  const completedCount = steps.filter(step => step.complete).length;
  const nextStep = steps.find(step => !step.complete) || null;

  return (
    <section
      className={`teacher-setup-checklist${nextStep ? "" : " is-complete"}`}
      aria-label={TEACHER_COPY.setup.ariaLabel}
      data-setup-complete={nextStep ? "false" : "true"}
      data-teacher-priority="setup-blockers"
    >
      <header>
        <div>
          <p className="panel-label">
            {nextStep ? TEACHER_COPY.setup.firstLabel : TEACHER_COPY.setup.completeLabel}
          </p>
          <h3>
            {nextStep ? TEACHER_COPY.setup.firstTitle : TEACHER_COPY.setup.completeTitle}
          </h3>
          <p>
            {nextStep
              ? TEACHER_COPY.setup.firstBody
              : TEACHER_COPY.setup.completeBody}
          </p>
        </div>
        <div
          className="teacher-setup-progress"
          aria-label={TEACHER_COPY.setup.progressLabel(completedCount, steps.length)}
        >
          <strong>{TEACHER_COPY.setup.progressValue(completedCount, steps.length)}</strong>
          <span>complete</span>
        </div>
      </header>

      <ol>
        {steps.map((step, index) => {
          const current = nextStep?.id === step.id;
          return (
            <li
              className={step.complete ? "is-complete" : current ? "is-current" : ""}
              key={step.id}
              aria-current={current ? "step" : undefined}
            >
              <span className="teacher-setup-step-mark" aria-hidden="true">
                {step.complete ? "✓" : index + 1}
              </span>
              <div>
                <strong>{step.title}</strong>
                <p>{step.description}</p>
              </div>
              <span className="teacher-setup-step-state">
                {step.complete
                  ? TEACHER_COPY.setup.completeState
                  : current
                    ? TEACHER_COPY.setup.nextState
                    : TEACHER_COPY.setup.laterState}
              </span>
            </li>
          );
        })}
      </ol>

      {nextStep && (
        <footer>
          <button className="lp-button lp-button-primary" type="button" onClick={() => onContinue?.(nextStep.id)}>
            Continue: {nextStep.title}
          </button>
          {!hasClass && onCreateDemo && (
            <button
              className="lp-button lp-button-secondary"
              type="button"
              disabled={creatingDemo}
              onClick={onCreateDemo}
            >
              {creatingDemo ? "Creating sample..." : "Explore with a sample class"}
            </button>
          )}
          {!hasClass && (
            <p>
              Sample data is clearly labelled, uses fictional nicknames, and contains no saved assessment results.
            </p>
          )}
        </footer>
      )}
    </section>
  );
}

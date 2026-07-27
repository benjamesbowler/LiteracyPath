import { TEACHER_COPY } from "../../copy/teacherCopy.js";
import { TeacherSurfaceState } from "./ui/TeacherSurfaceState.jsx";
import {
  TeacherPageHeader,
  TeacherPageShell
} from "./ui/TeacherPrimitives.jsx";

const INTENT_COPY = TEACHER_COPY.intents;

// 2026-07-27: this page used to serve two intents. "progress" (the report
// picker) became step 1 and step 2 of the Reports funnel, and "assess" had been
// dead for months - it returned null because no copy was ever written for it.
// Resources is the one whole-class intent left.
function buildIntentActions({ onOpenWorksheets, onOpenPresent }) {
  // Guided reading and Story Quests moved into the Student panel on the Students
  // page. They are per-student tools, and asking for a student twice - once in a
  // picker here, once wherever the student was actually chosen - was the reason
  // both buttons so often sat greyed out. What is left here is whole-class.
  return [
    {
      id: "worksheets",
      category: "Print",
      label: "Worksheets",
      description: "Create printable practice directly from the curriculum sequence.",
      requiresStudent: false,
      onOpen: onOpenWorksheets
    },
    {
      id: "present",
      category: "Whole class",
      label: "Present",
      description: "Open projector-ready teaching slides for the current cycle.",
      requiresStudent: false,
      onOpen: onOpenPresent
    }
  ];
}

export function TeacherIntentPage({
  intent,
  className = "",
  classList = [],
  selectedClassId = "",
  onSelectClass,
  progressRows = [],
  selectedLearnerId = "",
  studentName = "",
  onSelectLearner,
  onClearLearner,
  onOpenClasses,
  onOpenWorksheets,
  onOpenPresent,
  surfaceState = "",
  surfaceStateDetail = "",
  onSurfaceStatePrimary,
  onSurfaceStateSecondary
}) {
  const copy = INTENT_COPY[intent];
  if (!copy) return null;
  const hasClasses = classList.length > 0;
  const hasStudents = progressRows.length > 0;
  const actions = buildIntentActions({ onOpenWorksheets, onOpenPresent });

  return (
    <TeacherPageShell
      className="teacher-intent-page"
      intent={intent}
    >
      <TeacherPageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
      >
        <div className="teacher-dashboard-context" aria-label={INTENT_COPY.contextLabel}>
          <span>Current context</span>
          <strong>{className || INTENT_COPY.chooseClass}</strong>
          {/* Both pickers live here. Previously the class was a read-only label and the
              student picker only appeared once class rows happened to be loaded — which
              nothing on this route ever did, so every student-requiring action was a dead
              button with no picker above it. */}
          {onSelectClass && hasClasses && (
            <label className="teacher-context-class">
              <select
                aria-label={INTENT_COPY.classFieldLabel}
                onChange={event => onSelectClass(event.target.value || null)}
                value={selectedClassId || ""}
              >
                <option value="">{INTENT_COPY.chooseClass}</option>
                {classList.map(row => (
                  <option key={row.id} value={row.id}>{row.name}</option>
                ))}
              </select>
            </label>
          )}
          {onSelectLearner && hasStudents ? (
            <label className="teacher-context-student">
              <select
                aria-label={INTENT_COPY.studentFieldLabel}
                onChange={event => {
                  const row = progressRows.find(item => String(item.id) === event.target.value);
                  if (row) onSelectLearner(row.id, row.name);
                }}
                value={selectedLearnerId || ""}
              >
                <option value="">{INTENT_COPY.studentPlaceholder}</option>
                {progressRows.map(row => (
                  <option key={row.id} value={row.id}>{row.name}</option>
                ))}
              </select>
            </label>
          ) : (
            <small>
              {studentName ? INTENT_COPY.selectedStudent(studentName) : INTENT_COPY.noStudentSelected}
            </small>
          )}
          {selectedLearnerId && onClearLearner && (
            <button className="text-button" type="button" onClick={onClearLearner}>
              {INTENT_COPY.clearStudent}
            </button>
          )}
        </div>
      </TeacherPageHeader>

      {surfaceState ? (
        <TeacherSurfaceState
          surface={intent}
          state={surfaceState}
          detail={surfaceStateDetail}
          onPrimaryAction={onSurfaceStatePrimary}
          onSecondaryAction={onSurfaceStateSecondary}
        />
      ) : (
        <>
          {!hasClasses ? (
            <section className="teacher-intent-empty" aria-label={INTENT_COPY.noClassesTitle}>
              <h2>{INTENT_COPY.noClassesTitle}</h2>
              <p>{INTENT_COPY.noClassesBody}</p>
              {onOpenClasses && (
                <button className="lp-button lp-button-primary" type="button" onClick={onOpenClasses}>
                  {INTENT_COPY.noClassesAction}
                </button>
              )}
            </section>
          ) : !selectedClassId ? (
            <section className="teacher-intent-empty" aria-label={INTENT_COPY.chooseClassTitle}>
              <h2>{INTENT_COPY.chooseClassTitle}</h2>
              <p>{INTENT_COPY.chooseClassBody}</p>
            </section>
          ) : !hasStudents ? (
            <section className="teacher-intent-empty" aria-label={INTENT_COPY.noStudentsTitle(className || INTENT_COPY.chooseClass)}>
              <h2>{INTENT_COPY.noStudentsTitle(className || INTENT_COPY.chooseClass)}</h2>
              <p>{INTENT_COPY.noStudentsBody}</p>
              {onOpenClasses && (
                <button className="lp-button lp-button-primary" type="button" onClick={onOpenClasses}>
                  {INTENT_COPY.noStudentsAction}
                </button>
              )}
            </section>
          ) : (
            <section className="teacher-intent-actions" aria-label={`${copy.eyebrow} tools`}>
              <p className="teacher-intent-class-summary">
                {INTENT_COPY.classSummary(className, progressRows.length)}
              </p>
              {actions.map(action => {
                const needsLearner = action.requiresStudent && !studentName;
                return (
                  <article className="teacher-action-card" key={action.id}>
                    <div>
                      <p className="panel-label">{action.category}</p>
                      <h3>{action.label}</h3>
                      <p>{action.description}</p>
                      {needsLearner && (
                        <small className="muted-text">Pick a student above to continue.</small>
                      )}
                    </div>
                    <button
                      className="lp-button lp-button-secondary"
                      disabled={needsLearner}
                      onClick={action.onOpen}
                      type="button"
                    >
                      {action.actionLabel || "Open"}
                    </button>
                  </article>
                );
              })}
            </section>
          )}

        </>
      )}
    </TeacherPageShell>
  );
}

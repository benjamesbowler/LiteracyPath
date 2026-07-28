import { TEACHER_COPY } from "../../copy/teacherCopy.js";
import { getClassListReadView } from "../../appState/classListReadState.js";
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
      description: "Choose a teaching cycle and create printable class practice.",
      actionLabel: "Build a worksheet",
      onOpen: onOpenWorksheets
    },
    {
      id: "present",
      category: "Whole class",
      label: "Present",
      description: "Choose a teaching cycle and open projector-ready class slides.",
      actionLabel: "Open a presentation",
      onOpen: onOpenPresent
    }
  ];
}

export function TeacherIntentPage({
  intent,
  className = "",
  classList = [],
  classListReadState = null,
  teacherId,
  selectedClassId = "",
  loadingClasses = false,
  onRetryClasses,
  onSelectClass,
  onOpenClasses,
  onOpenWorksheets,
  onOpenPresent
}) {
  const copy = INTENT_COPY[intent];
  if (!copy) return null;
  // 2026-07-27: a selected class id with an empty class list means the classes have not
  // arrived yet (or the load failed). It NEVER means the teacher has no classes. Telling
  // someone to "create your class first" while a class is plainly selected reads as data
  // loss. Observed live on the deployed preview: the Resources route showed the no-classes
  // empty state with a valid class id in the URL.
  //
  // That guess only covered half the problem: a fresh sign-in clears the selected class
  // while the class request is still running, so an established teacher was still told to
  // create their first class. loadingClasses is the real signal; the id check stays as a
  // fallback for the frame before the request starts.
  const classRead = getClassListReadView({
    readState: classListReadState,
    teacherId,
    legacyLoading: loadingClasses
  });
  const visibleClassList = classRead.rowsVerified ? classList : [];
  const classesPending = classRead.loading;
  const hasClasses = classRead.complete && visibleClassList.length > 0;
  const verifiedClassName = visibleClassList.some(row => row.id === selectedClassId)
    ? className
    : "";
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
          <strong>{verifiedClassName || INTENT_COPY.chooseClass}</strong>
          {onSelectClass && visibleClassList.length > 0 && (
            <label className="teacher-context-class">
              <select
                aria-label={INTENT_COPY.classFieldLabel}
                disabled={!classRead.complete}
                onChange={event => onSelectClass(event.target.value || null)}
                value={selectedClassId || ""}
              >
                <option value="">{INTENT_COPY.chooseClass}</option>
                {visibleClassList.map(row => (
                  <option key={row.id} value={row.id}>{row.name}</option>
                ))}
              </select>
            </label>
          )}
          <small>Whole-class tools</small>
        </div>
      </TeacherPageHeader>

      <>
          {classesPending ? (
            <TeacherSurfaceState surface={intent} state="loading" />
          ) : classRead.failed ? (
            <TeacherSurfaceState
              surface={intent}
              state="partial"
              detail={classRead.truncated
                ? "The full class list reached its safety limit, so no missing class is being treated as absent."
                : "The class list could not be confirmed. Previously verified class names remain visible, but tools are paused until the list reloads."}
              onPrimaryAction={onRetryClasses}
            />
          ) : !hasClasses ? (
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
          ) : (
            <section className="teacher-intent-actions" aria-label={`${copy.eyebrow} tools`}>
              <p className="teacher-intent-class-summary">
                {INTENT_COPY.classSummary(verifiedClassName)}
              </p>
              {actions.map(action => (
                <article className="teacher-action-card" key={action.id}>
                  <div>
                    <p className="panel-label">{action.category}</p>
                    <h3>{action.label}</h3>
                    <p>{action.description}</p>
                  </div>
                  <button
                    className="lp-button lp-button-secondary"
                    onClick={action.onOpen}
                    type="button"
                  >
                    {action.actionLabel || "Open"}
                  </button>
                </article>
              ))}
            </section>
          )}
      </>
    </TeacherPageShell>
  );
}

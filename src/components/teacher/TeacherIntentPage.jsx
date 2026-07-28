import { useEffect, useState } from "react";
import { TEACHER_COPY } from "../../copy/teacherCopy.js";
import { getClassListReadView } from "../../appState/classListReadState.js";
import { teacherCycleOptions } from "./teacherCycleReference.js";
import { loadLevelCShelf } from "./teacherResourceShelf.js";
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
//
// 2026-07-28 (teacher redesign v2, phase 6): the whole-class shelf. Three tool
// cards - Present, Worksheets, Guided reading - then the Level C book tiles.
// The class picker and the "current context" chip that used to sit in this
// header are gone: the shared context bar above the page owns class, school and
// teaching cycle, and asking for the same thing twice was the reason this page
// read as a second lobby rather than a shelf.
function buildResourceTools({
  tools,
  cycleNumber,
  onOpenWorksheets,
  onOpenPresent,
  onOpenGuidedReading
}) {
  // A button that does nothing on tap is worse than no button, so each tool
  // carries a handler only when the shell wired somewhere for it to go.
  return [
    {
      id: "present",
      ...tools.present,
      action: tools.present.action(cycleNumber),
      onOpen: onOpenPresent || null
    },
    {
      id: "worksheets",
      ...tools.worksheets,
      onOpen: onOpenWorksheets || null
    },
    {
      id: "guided-reading",
      ...tools.guidedReading,
      onOpen: onOpenGuidedReading ? () => onOpenGuidedReading("") : null
    }
  ];
}

// The book list arrives from a dynamically imported catalogue, so it has three
// separate outcomes - and "empty" is never the stand-in for the other two.
function useLevelCShelf() {
  const [shelf, setShelf] = useState({ status: "loading", rows: [] });

  useEffect(() => {
    let active = true;
    loadLevelCShelf()
      .then(rows => {
        if (active) setShelf({ status: "ready", rows });
      })
      .catch(() => {
        if (active) setShelf({ status: "failed", rows: [] });
      });
    return () => { active = false; };
  }, []);

  return shelf;
}

function LevelCShelf({ copy, onOpenReader }) {
  const shelf = useLevelCShelf();

  if (shelf.status === "loading") {
    return (
      <p className="teacher-resource-shelf-note" aria-busy="true">
        {copy.shelfLoading}
      </p>
    );
  }
  // A catalogue that failed to arrive is not a catalogue with nothing in it.
  if (shelf.status === "failed") {
    return <p className="teacher-resource-shelf-note">{copy.shelfFailed}</p>;
  }
  if (!shelf.rows.length) {
    return <p className="teacher-resource-shelf-note">{copy.shelfEmpty}</p>;
  }

  return (
    <ul className="teacher-resource-books">
      {shelf.rows.map(book => (
        <li className="teacher-resource-book" key={book.id}>
          <strong>{book.title}</strong>
          <span>{book.meta}</span>
          {onOpenReader && (
            <button
              aria-label={copy.shelfActionFor(book.title)}
              className="lp-button teacher-resource-book-action"
              onClick={() => onOpenReader(book.id)}
              type="button"
            >
              {copy.shelfAction}
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

export function TeacherIntentPage({
  intent,
  classList = [],
  classListReadState = null,
  teacherId,
  selectedClassId = "",
  cycleId = "",
  loadingClasses = false,
  onRetryClasses,
  onOpenClasses,
  onOpenWorksheets,
  onOpenPresent,
  onOpenGuidedReading
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
  // The teaching cycle is set once in the context bar and read here. It is a
  // teacher-set reference, never derived from results, so an unset cycle stays
  // unset rather than guessing one.
  const cycle = teacherCycleOptions().find(option => option.id === cycleId) || null;
  const tools = buildResourceTools({
    tools: copy.tools,
    cycleNumber: cycle?.cycleNumber || 0,
    onOpenWorksheets,
    onOpenPresent,
    onOpenGuidedReading
  });

  return (
    <TeacherPageShell
      className="teacher-intent-page teacher-resources-page"
      intent={intent}
    >
      <TeacherPageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description(cycle?.label || "")}
      />

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
            <>
              <section className="teacher-resource-tools" aria-label={copy.toolsLabel}>
                {tools.map(tool => (
                  <article className="teacher-resource-card" key={tool.id}>
                    <p className="teacher-resource-kind" data-resource-kind={tool.id}>
                      {tool.kind}
                    </p>
                    <h3>{tool.title}</h3>
                    <p className="teacher-resource-body">{tool.body}</p>
                    <ul className="teacher-resource-points">
                      {tool.bullets.map(point => <li key={point}>{point}</li>)}
                    </ul>
                    {tool.onOpen && (
                      <button
                        className="lp-button lp-button-primary teacher-resource-action"
                        onClick={tool.onOpen}
                        type="button"
                      >
                        {tool.action}
                      </button>
                    )}
                  </article>
                ))}
              </section>

              <section className="teacher-resource-shelf" aria-label={copy.shelfTitle}>
                <h3>{copy.shelfTitle}</h3>
                <LevelCShelf copy={copy} onOpenReader={onOpenGuidedReading} />
              </section>
            </>
          )}
      </>
    </TeacherPageShell>
  );
}

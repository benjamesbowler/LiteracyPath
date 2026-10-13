import { useEffect, useMemo, useRef, useState } from "react";
import { startReadingSession, readingSessionMediaUrls } from "../../data/readingSession.js";
import { warmQuestOfflineAssets } from "../../utils/offlineShell.js";
import { TeacherFunnelStep } from "../TeacherFunnelStep.jsx";
import { TeacherDialog } from "../teacher/ui/TeacherDialog.jsx";
import "./readingSession.css";
import { filterPublishedGuidedReadingBooks } from "../../policy/guidedReadingApprovalPolicy.js";
import { TeacherSessionFrame } from "../teacher/sessions/TeacherSessionFrame.jsx";
import { guidedReadingBandLabel, guidedReadingModeLabel } from "../../policy/guidedReadingCatalogPolicy.js";

const EMPTY_IDS = Object.freeze([]);

function ReadingSessionSetupBody({
  open,
  quarantinedBookIds = EMPTY_IDS,
  client,
  classId,
  students = [],
  initialStudentIds = [],
  initialBookId = "",
  onClose,
  onStarted
}) {
  const [books, setBooks] = useState([]);
  const [bookId, setBookId] = useState(initialBookId);
  const [studentIds, setStudentIds] = useState(() => [...new Set(initialStudentIds.map(String))]);
  const [catalogState, setCatalogState] = useState("loading");
  const [catalogRevision, setCatalogRevision] = useState(0);
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const secondStepRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    let active = true;
    import("../../utils/guidedReading/runtimeBooks.js").then(module => {
      if (!active) return;
      setBooks(filterPublishedGuidedReadingBooks(
        module.getRuntimeGuidedReadingBooks(),
        quarantinedBookIds
      ));
      setCatalogState("ready");
    }).catch(() => { if (active) setCatalogState("error"); });
    return () => { active = false; };
  }, [open, quarantinedBookIds, catalogRevision]);

  useEffect(() => {
    if (step === 2) secondStepRef.current?.focus();
  }, [step]);

  const selectedBook = useMemo(
    () => books.find(book => book.id === bookId) || null,
    [bookId, books]
  );

  const activeStudents = students.filter(student => student?.id && !student.archived_at && !student.archivedAt);
  const selectedStudents = activeStudents.filter(student => studentIds.includes(String(student.id)));
  const missingStudents = studentIds.length !== selectedStudents.length;
  const groupValid = studentIds.length > 0 && studentIds.length <= 6 && !missingStudents;

  if (!open) return null;

  function toggleStudent(id) {
    setMessage("");
    setStudentIds(current => current.includes(id)
      ? current.filter(value => value !== id)
      : current.length < 6 ? [...current, id] : current);
  }

  async function start() {
    if (!selectedBook || !groupValid || busy) return;
    setBusy(true);
    setMessage("");
    try {
      const data = await startReadingSession({
        client,
        classId,
        bookId: selectedBook.id,
        pageNumbers: selectedBook.pages.map(page => page.pageNumber),
        studentIds
      });
      if (data?.ok !== true || !data.session?.id) {
        if (data?.error === "student_busy") {
          const child = students.find(student => student.id === data.student_id);
          setMessage(`${child?.name || "That child"} is already reading with ${data.teacher_name || "another teacher"}.`);
        } else {
          setMessage("The reading group could not start. Check the group and try again.");
        }
        return;
      }
      void warmQuestOfflineAssets(
        readingSessionMediaUrls(selectedBook, data.session.page_numbers),
        { chapterId: `reading-${data.session.id}` }
      );
      onStarted?.({ ...data.session, book: selectedBook });
    } catch {
      setMessage("The reading group could not start. Check the connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="reading-session-modal-backdrop">
      <TeacherDialog
        busy={busy}
        className="reading-session-setup"
        label="Start reading together"
        onClose={onClose}
      >
        <header className="reading-session-setup-header">
          <div>
            <p className="panel-label">Guided reading</p>
            <h2>Start reading together</h2>
            <p>Teacher turns the pages. Choose one book and up to six students.</p>
          </div>
          <button className="lp-button lp-button-secondary" onClick={onClose} type="button">Close</button>
        </header>

        <TeacherSessionFrame phase="prepare" protocol="reading" audience={`${selectedStudents.length} selected students`} students={selectedStudents}>
        <TeacherFunnelStep
          answer={selectedBook ? `${selectedBook.title} · ${guidedReadingBandLabel(selectedBook.readingBandProfile, selectedBook.level)} · ${guidedReadingModeLabel(selectedBook.readingMode)}` : ""}
          number="1"
          onChange={() => setStep(1)}
          open={step === 1}
          title="Choose the book"
        >
          <div className="reading-session-book-grid">
            {catalogState === "loading" && <p role="status">Loading books…</p>}
            {catalogState === "error" && <div role="alert"><p>Books could not load. Your reading group is still selected.</p><button type="button" onClick={() => { setCatalogState("loading"); setCatalogRevision(value => value + 1); }}>Try again</button></div>}
            {catalogState === "ready" && !books.length && <p>No available books were found. Your reading group is unchanged.</p>}
            {books.map(book => (
              <button
                aria-pressed={book.id === bookId}
                className={book.id === bookId ? "selected" : ""}
                key={book.id}
                onClick={() => setBookId(book.id)}
                type="button"
              >
                <strong>{book.title}</strong>
                <span>{guidedReadingBandLabel(book.readingBandProfile, book.level)} · {guidedReadingModeLabel(book.readingMode)} · {book.pages.length} pages</span>
              </button>
            ))}
          </div>
          <button
            className="lp-button lp-button-primary"
            disabled={!selectedBook}
            onClick={() => setStep(2)}
            type="button"
          >
            Continue
          </button>
        </TeacherFunnelStep>

        <TeacherFunnelStep
          answer={studentIds.length ? `${studentIds.length} selected` : ""}
          lockedReason={!selectedBook ? "Choose a book first." : ""}
          number="2"
          onChange={() => setStep(2)}
          open={step === 2}
          ref={secondStepRef}
          title="Choose who is reading"
        >
          <div className="reading-session-student-list">
            {activeStudents.map(student => {
              const checked = studentIds.includes(String(student.id));
              const atLimit = studentIds.length >= 6 && !checked;
              return (
                <label className={atLimit ? "disabled" : ""} key={student.id}>
                  <input
                    checked={checked}
                    disabled={atLimit}
                    onChange={() => toggleStudent(String(student.id))}
                    type="checkbox"
                  />
                  <span><strong>{student.name}</strong><small>{student.symbol_password ? "Ready to sign in" : "Sign-in picture needed"}</small></span>
                </label>
              );
            })}
          </div>
          {studentIds.length > 6 && <p role="alert">You selected {studentIds.length} students. Choose up to six for reading together; nobody has been removed automatically.</p>}
          {missingStudents && <div role="alert"><p>Some selected students are no longer available in this class. Review the group before starting.</p><button type="button" onClick={() => setStudentIds(selectedStudents.map(student => String(student.id)))}>Use available selected students</button></div>}
          {studentIds.length === 6 && <p>A reading group can have up to six students.</p>}
          {message && <p className="reading-session-message" role="alert">{message}</p>}
          <button
            className="lp-button lp-button-primary"
            data-autofocus
            disabled={!groupValid || busy}
            onClick={start}
            type="button"
          >
            {busy ? "Starting…" : "Start reading"}
          </button>
        </TeacherFunnelStep>
        </TeacherSessionFrame>
      </TeacherDialog>
    </div>
  );
}

export function ReadingSessionSetup(props) {
  if (!props.open) return null;
  return <ReadingSessionSetupBody key={props.classId} {...props} />;
}

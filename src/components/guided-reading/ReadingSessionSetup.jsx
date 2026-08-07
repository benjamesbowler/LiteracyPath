import { useEffect, useMemo, useRef, useState } from "react";
import { startReadingSession, readingSessionMediaUrls } from "../../data/readingSession.js";
import { warmQuestOfflineAssets } from "../../utils/offlineShell.js";
import { TeacherFunnelStep } from "../TeacherFunnelStep.jsx";
import { TeacherDialog } from "../teacher/ui/TeacherDialog.jsx";
import "./readingSession.css";
import { filterPublishedGuidedReadingBooks } from "../../data/guidedReadingPublication.js";

export function ReadingSessionSetup({
  open,
  quarantinedBookIds = [],
  client,
  classId,
  students = [],
  onClose,
  onStarted
}) {
  const [books, setBooks] = useState([]);
  const [bookId, setBookId] = useState("");
  const [studentIds, setStudentIds] = useState([]);
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
    });
    return () => { active = false; };
  }, [quarantinedBookIds, open]);

  useEffect(() => {
    if (step === 2) secondStepRef.current?.focus();
  }, [step]);

  const selectedBook = useMemo(
    () => books.find(book => book.id === bookId) || null,
    [bookId, books]
  );

  if (!open) return null;

  function toggleStudent(id) {
    setMessage("");
    setStudentIds(current => current.includes(id)
      ? current.filter(value => value !== id)
      : current.length < 6 ? [...current, id] : current);
  }

  async function start() {
    if (!selectedBook || !studentIds.length || busy) return;
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
      if (data?.ok === false) {
        if (data.error === "student_busy") {
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
            <p>Choose one book and up to six children.</p>
          </div>
          <button className="lp-button lp-button-secondary" onClick={onClose} type="button">Close</button>
        </header>

        <TeacherFunnelStep
          answer={selectedBook ? `${selectedBook.title} · Level ${selectedBook.level}` : ""}
          number="1"
          onChange={() => setStep(1)}
          open={step === 1}
          title="Choose the book"
        >
          <div className="reading-session-book-grid">
            {books.length === 0 && (
              <p>No Guided Reading books have been approved for children yet.</p>
            )}
            {books.map(book => (
              <button
                aria-pressed={book.id === bookId}
                className={book.id === bookId ? "selected" : ""}
                key={book.id}
                onClick={() => setBookId(book.id)}
                type="button"
              >
                <strong>{book.title}</strong>
                <span>Level {book.level} · {book.pages.length} pages</span>
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
            {students.map(student => {
              const checked = studentIds.includes(student.id);
              const atLimit = studentIds.length >= 6 && !checked;
              return (
                <label className={atLimit ? "disabled" : ""} key={student.id}>
                  <input
                    checked={checked}
                    disabled={atLimit}
                    onChange={() => toggleStudent(student.id)}
                    type="checkbox"
                  />
                  <span><strong>{student.name}</strong><small>{student.symbol_password ? "Ready to sign in" : "Sign-in picture needed"}</small></span>
                </label>
              );
            })}
          </div>
          {studentIds.length >= 6 && <p>A reading group can have up to 6 children.</p>}
          {message && <p className="reading-session-message" role="alert">{message}</p>}
          <button
            className="lp-button lp-button-primary"
            data-autofocus
            disabled={!studentIds.length || busy}
            onClick={start}
            type="button"
          >
            {busy ? "Starting…" : "Start reading"}
          </button>
        </TeacherFunnelStep>
      </TeacherDialog>
    </div>
  );
}

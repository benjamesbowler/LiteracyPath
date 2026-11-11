import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { TeacherModal } from "../teacher/ui/TeacherDialog.jsx";

const formats = [
  {
    id: "a5",
    label: "A5 pages",
    instructions: "Print on A5 paper at actual size (100%). Pages are in reading order."
  },
  {
    id: "booklet",
    label: "A4 folded booklet",
    instructions: "Print on A4 paper in landscape at actual size (100%). Print double-sided, flip on the short edge, then fold in half."
  }
];

export default function BookPdfDownload({ book }) {
  const dialogId = useId();
  const jobRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState({ kind: "idle" });
  const preparing = status.kind === "preparing";

  useEffect(() => () => jobRef.current?.abort(), []);

  function close() {
    jobRef.current?.abort();
    jobRef.current = null;
    setOpen(false);
  }

  async function download(format) {
    if (jobRef.current) return;
    const controller = new AbortController();
    const { signal } = controller;
    jobRef.current = controller;
    setStatus({ kind: "preparing", message: "Preparing PDF…" });
    try {
      const { downloadGuidedReadingBookPdf } = await import("../../utils/guidedReading/bookPdf.js");
      if (signal.aborted) return;
      await downloadGuidedReadingBookPdf(book, {
        format,
        signal,
        onProgress: ({ completed, total }) => {
          if (!signal.aborted) {
            setStatus({ kind: "preparing", message: `Preparing PDF… ${completed} of ${total} images ready.` });
          }
        }
      });
      if (!signal.aborted) setStatus({ kind: "done", message: "PDF download started." });
    } catch {
      if (!signal.aborted) {
        controller.abort();
        setStatus({ kind: "error", format });
      }
    } finally {
      if (jobRef.current === controller) jobRef.current = null;
    }
  }

  return (
    <>
      <button
        type="button"
        className="lp-button lp-button-secondary guided-book-pdf-trigger"
        aria-haspopup="dialog"
        onClick={event => {
          event.currentTarget.focus();
          setStatus({ kind: "idle" });
          setOpen(true);
        }}
      >
        Download PDF
      </button>
      {open && createPortal(
        <TeacherModal className="guided-book-pdf-dialog" labelledBy={dialogId} onClose={close}>
          <div className="symbol-password-modal-card guided-book-pdf-card">
            <header>
              <h2 id={dialogId}>Download PDF</h2>
              <p>{book.title}</p>
            </header>
            <ul className="guided-book-pdf-formats" role="list" aria-label="Print formats">
              {formats.map(format => {
                const instructionsId = `${dialogId}-${format.id}`;
                const retry = status.kind === "error" && status.format === format.id;
                return (
                  <li key={format.id}>
                    <button
                      type="button"
                      className="lp-button lp-button-secondary"
                      aria-describedby={instructionsId}
                      aria-disabled={preparing || undefined}
                      onClick={() => download(format.id)}
                    >
                      {retry ? "Retry" : "Download"} {format.label}
                    </button>
                    <p id={instructionsId}>{format.instructions}</p>
                  </li>
                );
              })}
            </ul>
            <div role="status" aria-atomic="true">{status.message}</div>
            {status.kind === "error" && <p role="alert">The PDF couldn’t be prepared. Try again.</p>}
            <footer>
              <button type="button" className="lp-button lp-button-secondary" onClick={close}>
                {preparing ? "Cancel download" : "Close"}
              </button>
            </footer>
          </div>
        </TeacherModal>,
        document.body
      )}
    </>
  );
}

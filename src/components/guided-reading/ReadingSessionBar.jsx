import { useState } from "react";
import { TeacherDialog } from "../teacher/ui/TeacherDialog.jsx";
import { guidedReadingBandLabel, guidedReadingModeLabel } from "../../policy/guidedReadingCatalogPolicy.js";
import "./readingSession.css";

export function ReadingSessionBar({ host, book, pageIndex, pageCount }) {
  const [confirmEnd, setConfirmEnd] = useState(false);
  if (!host?.session) return null;

  const presenceById = new Map(host.presence.map(item => [item.student_id, item]));
  function handleChipKeyDown(event, index) {
    const movement = {
      ArrowLeft: -1,
      ArrowUp: -1,
      ArrowRight: 1,
      ArrowDown: 1
    }[event.key];
    let nextIndex;
    if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = host.roster.length - 1;
    else if (movement) nextIndex = (index + movement + host.roster.length) % host.roster.length;
    else return;
    event.preventDefault();
    host.setMarkTarget(host.roster[nextIndex]);
    event.currentTarget.parentElement
      ?.querySelectorAll('[role="radio"]')
      ?.[nextIndex]?.focus();
  }
  return (
    <>
      <section className="reading-session-bar" aria-label="Reading together controls">
        <div className="reading-session-bar-heading">
          <div>
            <strong>Reading together · {book?.title || "Book"}</strong>
            <span>{guidedReadingBandLabel(book?.readingBandProfile, book?.level)} · {guidedReadingModeLabel(book?.readingMode)}</span>
          </div>
          <p>Page {pageIndex + 1} of {pageCount}</p>
          <button className="lp-button lp-button-secondary" onClick={() => setConfirmEnd(true)} type="button">End session</button>
        </div>

        <div className="reading-session-mark-row">
          <div className="reading-session-chips" role="radiogroup" aria-label="Choose who is reading">
            {host.roster.map((student, index) => {
              const status = presenceById.get(student.id);
              const connected = Boolean(status?.connected);
              const contentOk = status?.content_ok !== false;
              const selected = host.markTarget?.id === student.id;
              const statusLabel = !contentOk ? "needs to be refreshed" : connected ? "connected" : "not connected";
              return (
                <button
                  aria-checked={selected}
                  aria-label={`${student.name}, ${statusLabel}`}
                  className={`${selected ? "selected" : ""}${!contentOk ? " needs-refresh" : ""}`}
                  key={student.id}
                  onKeyDown={event => handleChipKeyDown(event, index)}
                  onClick={() => {
                    host.setMarkTarget(student);
                  }}
                  role="radio"
                  type="button"
                >
                  <span className={connected ? "presence-filled" : "presence-hollow"} aria-hidden="true" />
                  {student.name}
                </button>
              );
            })}
          </div>
          <div className="reading-session-mark-status" aria-live="polite">
            {host.markTarget ? <span>Listening to <strong>{host.markTarget.name}</strong></span> : <span>Choose who is reading</span>}
            {host.undo && <button className="text-button" onClick={host.onUndo} type="button">Undo last mark</button>}
            {host.notSent && <span className="reading-session-unsent">Not sent yet</span>}
          </div>
        </div>

        {host.presence.map(item => {
          const child = host.roster.find(student => student.id === item.student_id);
          if (item.content_ok === false) return <p className="reading-session-recovery" key={item.student_id}>{child?.name || "This child's"} iPad needs to be refreshed.</p>;
          if (!item.connected) return <p className="reading-session-recovery" key={item.student_id}>{child?.name || "This child"}'s iPad isn't connected. Ask them to open the app again.</p>;
          return null;
        })}
      </section>

      {confirmEnd && (
        <div className="reading-session-modal-backdrop">
          <TeacherDialog className="reading-session-end-dialog" label="End reading session" onClose={() => setConfirmEnd(false)}>
            <h2>End this reading session?</h2>
            <p>The children's reading pages will close. Recorded word marks will stay saved.</p>
            <div>
              <button className="lp-button lp-button-secondary" onClick={() => setConfirmEnd(false)} type="button">Keep reading</button>
              <button
                className="lp-button lp-button-primary"
                data-autofocus
                disabled={host.ending}
                onClick={async () => {
                  const ended = await host.onEnd();
                  if (ended) setConfirmEnd(false);
                }}
                type="button"
              >
                {host.ending ? "Ending…" : "End session"}
              </button>
            </div>
          </TeacherDialog>
        </div>
      )}
    </>
  );
}

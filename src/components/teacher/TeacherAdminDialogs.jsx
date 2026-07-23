import { useState } from "react";
import { TeacherDialog } from "./ui/TeacherDialog.jsx";

export function ConfirmActionDialog({
  open,
  title,
  body,
  confirmLabel = "Delete",
  busy = false,
  onConfirm,
  onCancel
}) {
  return (
    <TeacherDialog
      className="modal-backdrop"
      labelledBy="confirm-action-title"
      onClose={onCancel}
      open={open}
    >
      <section className="modal-card reset-progress-dialog">
        <h2 id="confirm-action-title">{title}</h2>
        <p>{body}</p>
        <div className="button-row">
          <button className="report-button" disabled={busy} onClick={onCancel} type="button">
            Cancel
          </button>
          <button className="reset-button" disabled={busy} onClick={onConfirm} type="button">
            {busy ? "Working..." : confirmLabel}
          </button>
        </div>
      </section>
    </TeacherDialog>
  );
}

export function ResetStudentProgressDialog({
  open,
  studentName,
  resetting,
  onReset,
  onCancel
}) {
  const [resetPhrase, setResetPhrase] = useState("");

  if (!open) return null;

  const canConfirmReset = resetPhrase.trim() === "RESET";
  const studentLabel = studentName || "the student";

  function cancelReset() {
    setResetPhrase("");
    onCancel();
  }

  function confirmReset() {
    if (!canConfirmReset || resetting) return;
    onReset();
  }

  return (
    <TeacherDialog
      className="modal-backdrop"
      labelledBy="reset-progress-title"
      onClose={cancelReset}
    >
      <section className="modal-card reset-progress-dialog">
        <h2 id="reset-progress-title">Reset Assessment Data</h2>
        <p>
          This resets assessment progress, scores, skill mastery, checkpoints, attempts, coverage,
          level and phase progress, incorrect pattern tracking, and assessment history for {studentLabel}.
        </p>
        <p>
          The student profile, class assignment, account login, Guided Reading history, and Story Quest progress
          are kept in place.
        </p>

        <div className="full-reset-confirmation" aria-live="polite">
          <strong>Confirm assessment reset</strong>
          <p>Type RESET to enable the final reset button.</p>
          <label>
            <span>Type RESET</span>
            <input
              autoComplete="off"
              data-autofocus
              disabled={resetting}
              onChange={event => setResetPhrase(event.target.value)}
              value={resetPhrase}
            />
          </label>
        </div>

        <div className="button-row">
          <button
            className="report-button"
            disabled={resetting}
            onClick={cancelReset}
            type="button"
          >
            Cancel
          </button>
          <button
            className="reset-button"
            disabled={resetting || !canConfirmReset}
            onClick={confirmReset}
            type="button"
          >
            Reset Assessment Data
          </button>
        </div>
      </section>
    </TeacherDialog>
  );
}

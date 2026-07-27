import { useState } from "react";
import { TEACHER_COPY } from "../../copy/teacherCopy.js";
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
  const studentLabel = studentName || "this student";

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
        <h2 id="reset-progress-title">{TEACHER_COPY.admin.resetTitle}</h2>
        <p>{TEACHER_COPY.admin.resetBody(studentLabel)}</p>
        <p>{TEACHER_COPY.admin.resetKeeps}</p>

        <div className="full-reset-confirmation" aria-live="polite">
          <strong>Confirm the reset</strong>
          <p>{TEACHER_COPY.admin.resetConfirm}</p>
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
            {TEACHER_COPY.admin.resetAction}
          </button>
        </div>
      </section>
    </TeacherDialog>
  );
}

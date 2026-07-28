import { useState } from "react";
import { TEACHER_COPY } from "../../copy/teacherCopy.js";
import { TeacherDialog } from "./ui/TeacherDialog.jsx";

export function ConfirmActionDialog({
  open,
  title,
  body,
  confirmLabel = "Delete",
  busy = false,
  error = "",
  onConfirm,
  onCancel
}) {
  return (
    <TeacherDialog
      className="modal-backdrop"
      labelledBy="confirm-action-title"
      onClose={busy ? undefined : onCancel}
      open={open}
    >
      <section className="modal-card reset-progress-dialog">
        <h2 id="confirm-action-title">{title}</h2>
        <p>{body}</p>
        {error && <p className="teacher-inline-error" role="alert">{error}</p>}
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
  const [submitting, setSubmitting] = useState(false);
  const [resetError, setResetError] = useState("");

  if (!open) return null;

  const canConfirmReset = resetPhrase.trim() === "RESET";
  const studentLabel = studentName || "this student";
  const busy = resetting || submitting;

  function cancelReset() {
    if (busy) return;
    setResetPhrase("");
    setResetError("");
    onCancel();
  }

  async function confirmReset() {
    if (!canConfirmReset || busy) return;
    setSubmitting(true);
    setResetError("");
    try {
      const saved = await onReset?.();
      if (saved !== true) {
        setResetError(
          "We couldn't reset this student's practice progress. Nothing was changed. Check the connection and try again."
        );
      }
    } catch (error) {
      console.error("Practice progress reset failed:", error);
      setResetError(
        "We couldn't reset this student's practice progress. Nothing was changed. Check the connection and try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <TeacherDialog
      className="modal-backdrop"
      labelledBy="reset-progress-title"
      onClose={busy ? undefined : cancelReset}
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
              disabled={busy}
              onChange={event => setResetPhrase(event.target.value)}
              value={resetPhrase}
            />
          </label>
        </div>

        {resetError && <p className="teacher-inline-error" role="alert">{resetError}</p>}

        <div className="button-row">
          <button
            className="report-button"
            disabled={busy}
            onClick={cancelReset}
            type="button"
          >
            Cancel
          </button>
          <button
            className="reset-button"
            disabled={busy || !canConfirmReset}
            onClick={confirmReset}
            type="button"
          >
            {busy ? "Resetting…" : TEACHER_COPY.admin.resetAction}
          </button>
        </div>
      </section>
    </TeacherDialog>
  );
}

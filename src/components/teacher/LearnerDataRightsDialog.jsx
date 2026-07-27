import { useEffect, useState } from "react";

import {
  DATA_RIGHTS_REQUESTER_ROLES,
  DATA_RIGHTS_RESPONSE_TARGET_DAYS,
  DATA_RIGHTS_VERIFICATION_METHODS,
  LEARNER_DELETION_CONFIRMATION,
  deleteLearnerData,
  downloadLearnerDataPackage,
  exportLearnerData,
  isLearnerDataRightsVerificationComplete,
  loadLearnerDataRightsHistory,
  prepareLearnerDeletion
} from "../../data/learnerDataRights.js";
import { describeRosterOperationError } from "../../data/teacherRosterOperations.js";
import { TEACHER_COPY } from "../../copy/teacherCopy.js";
import { TeacherModal } from "./ui/TeacherDialog.jsx";

export function LearnerDataRightsDialog({
  client,
  learner,
  open,
  onClose,
  onDeleted
}) {
  const [requesterRole, setRequesterRole] = useState("");
  const [verificationMethod, setVerificationMethod] = useState("");
  const [preparedRequest, setPreparedRequest] = useState(null);
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [historyState, setHistoryState] = useState("loading");
  const [historyReload, setHistoryReload] = useState(0);

  useEffect(() => {
    if (!open || !learner?.id) return;
    let cancelled = false;
    loadLearnerDataRightsHistory({ client, studentId: learner?.id })
      .then(result => {
        if (cancelled) return;
        setHistory(result.requests);
        setHistoryState("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setHistoryState("unavailable");
      });
    return () => {
      cancelled = true;
    };
  }, [client, historyReload, learner?.id, open]);

  if (!open || !learner) return null;

  const verificationComplete = isLearnerDataRightsVerificationComplete({
    requesterRole,
    verificationMethod
  });

  async function handleExport() {
    setBusy("export");
    setError("");
    setStatus("");
    try {
      const data = await exportLearnerData({
        client,
        studentId: learner.id,
        requesterRole,
        verificationMethod
      });
      const download = downloadLearnerDataPackage(data, learner.name);
      setHistory(previous => [{
        id: data.request.id,
        requestType: data.request.requestType,
        requesterRole: data.request.requesterRole,
        verificationMethod: data.request.verificationMethod,
        verificationStatus: "verified",
        status: data.request.status,
        dueAt: data.request.dueAt,
        completedAt: data.request.completedAt,
        createdAt: data.request.createdAt,
        events: [
          { eventType: "request_verified", eventAt: data.request.createdAt },
          { eventType: "export_completed", eventAt: data.request.completedAt }
        ]
      }, ...previous.filter(request => request.id !== data.request.id)]);
      setHistoryState("ready");
      setStatus(`Download complete: ${download.fileName}.`);
    } catch {
      setError("We couldn't prepare the download. Nothing is lost. Try again.");
    } finally {
      setBusy("");
    }
  }

  async function handlePrepareDeletion() {
    setBusy("prepare");
    setError("");
    setStatus("");
    try {
      const data = await prepareLearnerDeletion({
        client,
        studentId: learner.id,
        requesterRole,
        verificationMethod
      });
      setPreparedRequest(data);
      const preparedAt = new Date().toISOString();
      setHistory(previous => [{
        id: data.requestId,
        requestType: "deletion",
        requesterRole,
        verificationMethod,
        verificationStatus: "verified",
        status: data.status,
        dueAt: data.dueAt,
        completedAt: null,
        createdAt: preparedAt,
        events: [{ eventType: "request_verified", eventAt: preparedAt }]
      }, ...previous.filter(request => request.id !== data.requestId)]);
      setHistoryState("ready");
      setStatus(`The request is ready. Complete it by ${new Date(data.dueAt).toLocaleDateString()}.`);
    } catch (error) {
      console.error(`Learner deletion request failed for ${learner.id}:`, error);
      setError(error?.code === "PGRST202"
        ? "We couldn't check the request. This site's database is missing a pending update. Nothing is lost. Ask whoever manages the database to apply the pending updates, then try again."
        : "We couldn't check the request. Nothing is lost. Try again.");
    } finally {
      setBusy("");
    }
  }

  async function handleDelete() {
    setBusy("delete");
    setError("");
    setStatus("");
    let result;
    try {
      result = await deleteLearnerData({
        client,
        studentId: learner.id,
        preparedRequest,
        confirmation
      });
    } catch (error) {
      console.error(`Learner deletion failed for ${learner.id}:`, error);
      setError(describeRosterOperationError(error, {
        operation: "delete",
        studentName: learner.name
      }));
      setBusy("");
      return;
    }

    // The deletion has happened and cannot be undone. Everything below is
    // refreshing the screen, so a failure here must never be reported as
    // "Nothing has changed" — that sentence used to overwrite a completed,
    // irreversible delete whenever the roster reload threw.
    setStatus("The student's data has been deleted.");
    try {
      await onDeleted?.(learner, result);
    } catch (error) {
      console.error("Roster refresh after deletion failed:", error);
      setError("The data was deleted. We could not refresh this screen afterwards — reload the page to see the class as it is now.");
    } finally {
      setBusy("");
    }
  }

  return (
    <TeacherModal
      open
      label={`Data choices for ${learner.name}`}
      onClose={busy ? undefined : onClose}
      className="teacher-data-rights-dialog"
    >
      <div className="page-stack" data-data-rights-learner={learner.id}>
        <header>
          <p className="panel-label">Privacy request</p>
          <h2>{TEACHER_COPY.privacy.title(learner.name)}</h2>
          <p>{TEACHER_COPY.privacy.intro(DATA_RIGHTS_RESPONSE_TARGET_DAYS)}</p>
        </header>

        <div className="teacher-form-grid">
          <label>
            <span>Who made the request?</span>
            <select
              value={requesterRole}
              disabled={Boolean(busy || preparedRequest)}
              onChange={event => setRequesterRole(event.target.value)}
            >
              <option value="">Choose requester</option>
              {DATA_RIGHTS_REQUESTER_ROLES.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label>
            <span>How was identity and authority verified?</span>
            <select
              value={verificationMethod}
              disabled={Boolean(busy || preparedRequest)}
              onChange={event => setVerificationMethod(event.target.value)}
            >
              <option value="">Choose verification</option>
              {DATA_RIGHTS_VERIFICATION_METHODS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        </div>

        <section className="teacher-data-rights-action">
          <h3>{TEACHER_COPY.privacy.exportTitle}</h3>
          <p>{TEACHER_COPY.privacy.exportBody}</p>
          <p className="muted-text">Sign-in tokens and device identifiers are excluded.</p>
          <button
            className="lp-button lp-button-secondary"
            type="button"
            disabled={!verificationComplete || Boolean(busy || preparedRequest)}
            onClick={handleExport}
          >
            {busy === "export" ? "Preparing download…" : TEACHER_COPY.privacy.exportAction}
          </button>
        </section>

        <section className="teacher-data-rights-action teacher-data-rights-delete">
          <h3>{TEACHER_COPY.privacy.deleteTitle}</h3>
          <p>{TEACHER_COPY.privacy.deleteBody}</p>
          <p className="muted-text">Only a minimal audit record of the request remains.</p>
          {!preparedRequest ? (
            <button
              className="lp-button lp-button-danger-outline"
              type="button"
              disabled={!verificationComplete || Boolean(busy)}
              onClick={handlePrepareDeletion}
            >
              {busy === "prepare" ? "Checking request…" : TEACHER_COPY.privacy.prepareDelete}
            </button>
          ) : (
            <div className="page-stack">
              <p>
                Request <strong>{preparedRequest.requestId}</strong> is verified.
              </p>
              <p>
                The request is ready. Type <strong>{LEARNER_DELETION_CONFIRMATION}</strong> to delete permanently.
              </p>
              <label>
                <span>Exact confirmation</span>
                <input
                  autoComplete="off"
                  value={confirmation}
                  disabled={Boolean(busy)}
                  onChange={event => setConfirmation(event.target.value)}
                />
              </label>
              <button
                className="lp-button lp-button-danger"
                type="button"
                disabled={confirmation !== LEARNER_DELETION_CONFIRMATION || Boolean(busy)}
                onClick={handleDelete}
              >
                {busy === "delete" ? "Deleting…" : TEACHER_COPY.privacy.deleteAction}
              </button>
            </div>
          )}
        </section>

        <section className="teacher-data-rights-history" aria-label="Data-rights request history">
          <h3>{TEACHER_COPY.privacy.trackingTitle}</h3>
          {historyState === "loading" ? (
            <p role="status">{TEACHER_COPY.privacy.trackingLoading}</p>
          ) : historyState === "unavailable" ? (
            <div>
              <p>{TEACHER_COPY.privacy.trackingUnavailable}</p>
              <button
                className="lp-button lp-button-secondary"
                type="button"
                disabled={Boolean(busy)}
                onClick={() => {
                  setHistoryState("loading");
                  setHistoryReload(value => value + 1);
                }}
              >
                Try loading request history again
              </button>
            </div>
          ) : history.length === 0 ? (
            <p>{TEACHER_COPY.privacy.trackingEmpty}</p>
          ) : (
            <ul>
              {history.map(request => (
                <li key={request.id}>
                  <strong>
                    {request.requestType === "access_export" ? "Access export" : "Deletion"}
                  </strong>
                  <span>
                    {request.status === "completed" ? "Completed" : "In progress"}
                    {" · "}
                    {new Date(request.createdAt).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {status && <p className="teacher-inline-success" role="status">{status}</p>}
        {error && <p className="teacher-inline-error" role="alert">{error}</p>}

        <footer className="teacher-dialog-footer">
          <button
            className="lp-button lp-button-secondary"
            type="button"
            disabled={Boolean(busy)}
            onClick={onClose}
          >
            Close
          </button>
        </footer>
      </div>
    </TeacherModal>
  );
}

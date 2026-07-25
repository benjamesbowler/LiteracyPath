import { useEffect, useState } from "react";

import {
  DATA_RIGHTS_REQUESTER_ROLES,
  DATA_RIGHTS_RESPONSE_TARGET_DAYS,
  DATA_RIGHTS_VERIFICATION_METHODS,
  LEARNER_DELETION_CONFIRMATION,
  deleteLearnerData,
  downloadLearnerDataPackage,
  exportLearnerData,
  loadLearnerDataRightsHistory,
  prepareLearnerDeletion
} from "../../data/learnerDataRights.js";
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
  }, [client, learner?.id, open]);

  if (!open || !learner) return null;

  const managedServiceReady = historyState === "ready";
  const verificationComplete = Boolean(
    requesterRole
    && verificationMethod
    && managedServiceReady
  );

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
      setStatus(
        `Export complete. Request ${data.request.id}; downloaded ${download.fileName}.`
      );
    } catch (caught) {
      setError(caught?.message || "The learner data export failed.");
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
      setStatus(
        `Verified deletion request ${data.requestId}. Complete it by ${new Date(data.dueAt).toLocaleDateString()}.`
      );
    } catch (caught) {
      setError(caught?.message || "The deletion request could not be prepared.");
    } finally {
      setBusy("");
    }
  }

  async function handleDelete() {
    setBusy("delete");
    setError("");
    setStatus("");
    try {
      const result = await deleteLearnerData({
        client,
        studentId: learner.id,
        preparedRequest,
        confirmation
      });
      setStatus(
        `Deletion complete. Audit reference ${result.requestId}; no managed learner records remain.`
      );
      await onDeleted?.(learner, result);
    } catch (caught) {
      setError(caught?.message || "The learner data deletion failed.");
    } finally {
      setBusy("");
    }
  }

  return (
    <TeacherModal
      open
      label={`Data rights for ${learner.name}`}
      onClose={busy ? undefined : onClose}
      className="teacher-data-rights-dialog"
    >
      <div className="page-stack" data-data-rights-learner={learner.id}>
        <header>
          <p className="panel-label">Privacy request</p>
          <h2>Export or delete {learner.name}&rsquo;s data</h2>
          <p>
            Verify the requester against school records before continuing. The
            operational response target is {DATA_RIGHTS_RESPONSE_TARGET_DAYS} days,
            or sooner where law or contract requires.
          </p>
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
          <h3>Access export</h3>
          <p>
            Downloads a structured copy and records the verified request and completion.
            Login tokens and device identifiers are excluded.
          </p>
          <button
            className="lp-button lp-button-secondary"
            type="button"
            disabled={!verificationComplete || Boolean(busy || preparedRequest)}
            onClick={handleExport}
          >
            {busy === "export" ? "Preparing export..." : "Download learner data"}
          </button>
        </section>

        <section className="teacher-data-rights-action teacher-data-rights-delete">
          <h3>Permanent deletion</h3>
          <p>
            This removes the learner, evidence, reports containing their record,
            activity, progress, sessions, and embedded group references. Only a
            privacy-minimal audit tombstone remains.
          </p>
          {!preparedRequest ? (
            <button
              className="lp-button lp-button-danger-outline"
              type="button"
              disabled={!verificationComplete || Boolean(busy)}
              onClick={handlePrepareDeletion}
            >
              {busy === "prepare" ? "Verifying request..." : "Prepare verified deletion"}
            </button>
          ) : (
            <div className="page-stack">
              <p>
                Request <strong>{preparedRequest.requestId}</strong> is verified.
                Type <strong>{LEARNER_DELETION_CONFIRMATION}</strong> to delete permanently.
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
                {busy === "delete" ? "Deleting and verifying..." : "Delete all learner data"}
              </button>
            </div>
          )}
        </section>

        <section className="teacher-data-rights-history" aria-label="Data-rights request history">
          <h3>Request tracking</h3>
          {historyState === "loading" ? (
            <p role="status">Loading verified request history...</p>
          ) : historyState === "unavailable" ? (
            <p>Request history is unavailable. Do not continue until the managed service is connected.</p>
          ) : history.length === 0 ? (
            <p>No earlier verified requests are recorded for this learner.</p>
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
                  <small>Audit reference {request.id}</small>
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

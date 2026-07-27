import { useEffect, useState } from "react";

import {
  PROPAGATION_CONFIRMATION,
  RETENTION_CONFIRMATION,
  YEAR_END_MONTHS,
  listDeletionPropagation,
  loadSchoolRetentionPolicy,
  previewSchoolRetention,
  runSchoolRetention,
  saveSchoolRetentionPolicy,
  verifyDeletionPropagation
} from "../../data/schoolRetention.js";

function candidateTotal(preview) {
  if (!preview) return 0;
  return Number(preview.inactiveArchiveCandidates || 0)
    + Number(preview.archivedDeletionCandidates || 0)
    + Number(preview.endOfYearCandidates || 0)
    + Number(preview.propagationEvidenceDue || 0);
}

export function SchoolRetentionPolicyPanel({
  client,
  school,
  onChanged,
  onLearnersDeleted
}) {
  const [policy, setPolicy] = useState(null);
  const [preview, setPreview] = useState(null);
  const [propagationRecords, setPropagationRecords] = useState([]);
  const [confirmation, setConfirmation] = useState("");
  const [propagationRequestId, setPropagationRequestId] = useState("");
  const [evidenceReference, setEvidenceReference] = useState("");
  const [propagationConfirmation, setPropagationConfirmation] = useState("");
  const [state, setState] = useState("loading");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      loadSchoolRetentionPolicy({ client, schoolId: school.id }),
      listDeletionPropagation({ client, schoolId: school.id })
    ])
      .then(([result, records]) => {
        if (cancelled) return;
        setPolicy(result);
        setPropagationRecords(records);
        setState("ready");
      })
      .catch(caught => {
        if (cancelled) return;
        setError(caught?.message || "The retention policy could not be loaded.");
        setState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [client, school.id]);

  function update(field, value) {
    setPolicy(previous => ({ ...previous, [field]: value }));
    setPreview(null);
    setConfirmation("");
    setMessage("");
    setError("");
  }

  async function handleSave() {
    setState("saving");
    setMessage("");
    setError("");
    try {
      const saved = await saveSchoolRetentionPolicy({
        client,
        schoolId: school.id,
        policy
      });
      setPolicy(saved);
      setPreview(null);
      setConfirmation("");
      setMessage("Retention policy saved. Preview it before applying any action.");
      await onChanged?.();
    } catch (caught) {
      setError(caught?.message || "The retention policy could not be saved.");
    } finally {
      setState("ready");
    }
  }

  async function handlePreview() {
    setState("previewing");
    setMessage("");
    setError("");
    try {
      const result = await previewSchoolRetention({ client, schoolId: school.id });
      setPreview(result);
      setConfirmation("");
      setMessage("Preview complete. No learner record was changed.");
    } catch (caught) {
      setError(caught?.message || "The retention preview failed.");
    } finally {
      setState("ready");
    }
  }

  async function handleRun() {
    setState("applying");
    setMessage("");
    setError("");
    try {
      const result = await runSchoolRetention({
        client,
        schoolId: school.id,
        confirmation
      });
      setPreview(result.residualPreview);
      setConfirmation("");
      const followUpWarnings = [];
      try {
        await onLearnersDeleted?.(result.deletedStudentIds);
      } catch {
        followUpWarnings.push("this browser could not clear every cached learner record");
      }
      try {
        setPropagationRecords(
          await listDeletionPropagation({ client, schoolId: school.id })
        );
      } catch {
        followUpWarnings.push("the propagation list could not refresh");
      }
      try {
        await onChanged?.();
      } catch {
        followUpWarnings.push("the dashboard could not refresh");
      }
      const warning = followUpWarnings.length > 0
        ? ` Follow-up needed: ${followUpWarnings.join("; ")}.`
        : "";
      setMessage(
        `Retention complete: ${result.archivedLearners} archived, `
        + `${result.deletedLearners} deleted, `
        + `${result.propagationRecordsDueForEvidence} expiry records now need evidence.`
        + warning
      );
    } catch (caught) {
      setError(caught?.message || "The retention run failed.");
    } finally {
      setState("ready");
    }
  }

  async function handleVerifyPropagation() {
    setState("verifying");
    setMessage("");
    setError("");
    try {
      await verifyDeletionPropagation({
        client,
        requestId: propagationRequestId,
        evidenceReference,
        confirmation: propagationConfirmation
      });
      setPropagationRecords(
        await listDeletionPropagation({ client, schoolId: school.id })
      );
      setPropagationRequestId("");
      setEvidenceReference("");
      setPropagationConfirmation("");
      setMessage("Provider and backup expiry evidence recorded.");
    } catch (caught) {
      setError(caught?.message || "The expiry evidence could not be recorded.");
    } finally {
      setState("ready");
    }
  }

  if (state === "loading") {
    return <p role="status">Loading retention policy...</p>;
  }
  if (!policy) {
    return <p role="alert">{error || "The retention policy is unavailable."}</p>;
  }

  const busy = state !== "ready";
  const actionCount = candidateTotal(preview);

  return (
    <section
      className="admin-retention-policy page-stack"
      aria-label={`Retention policy for ${school.name}`}
    >
      <header>
        <p className="panel-label">School data lifecycle</p>
        <h4>{school.name} retention policy</h4>
        <p>
          Record the school instruction here. Product defaults are safeguards,
          not legal advice; the executed agreement and public notice must match.
        </p>
      </header>

      <div className="teacher-form-grid admin-retention-grid">
        <label>
          <span>Archive after no activity</span>
          <input
            min="90"
            max="2555"
            type="number"
            value={policy.inactiveAfterDays}
            disabled={busy}
            onChange={event => update("inactiveAfterDays", Number(event.target.value))}
          />
          <small>Days; 90–2,555</small>
        </label>
        <label>
          <span>Delete after archive</span>
          <input
            min="7"
            max="730"
            type="number"
            value={policy.archivedDeleteAfterDays}
            disabled={busy}
            onChange={event => update("archivedDeleteAfterDays", Number(event.target.value))}
          />
          <small>Days; 7–730</small>
        </label>
        <label>
          <span>End-of-year action</span>
          <select
            value={policy.endOfYearAction}
            disabled={busy}
            onChange={event => update("endOfYearAction", event.target.value)}
          >
            <option value="archive">Archive active learners</option>
            <option value="delete">Permanently delete active learners</option>
          </select>
        </label>
        <label>
          <span>School year ends</span>
          <select
            value={policy.academicYearEndMonth}
            disabled={busy}
            onChange={event => update("academicYearEndMonth", Number(event.target.value))}
          >
            {YEAR_END_MONTHS.map(month => (
              <option key={month.value} value={month.value}>{month.label}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Provider-copy expiry target</span>
          <input
            min="1"
            max="365"
            type="number"
            value={policy.providerExpiryDays}
            disabled={busy}
            onChange={event => update("providerExpiryDays", Number(event.target.value))}
          />
          <small>Days after active deletion</small>
        </label>
        <label>
          <span>Backup expiry target</span>
          <input
            min="1"
            max="365"
            type="number"
            value={policy.backupExpiryDays}
            disabled={busy}
            onChange={event => update("backupExpiryDays", Number(event.target.value))}
          />
          <small>Days after active deletion</small>
        </label>
      </div>

      <div className="button-row">
        <button
          className="lp-button lp-button-primary"
          type="button"
          disabled={busy}
          onClick={handleSave}
        >
          {state === "saving" ? "Saving..." : "Save policy"}
        </button>
        <button
          className="lp-button lp-button-secondary"
          type="button"
          disabled={busy}
          onClick={handlePreview}
        >
          {state === "previewing" ? "Checking..." : "Preview next run"}
        </button>
        <a href="/privacy.html#providers-regions" target="_blank" rel="noopener noreferrer">
          Provider and region disclosure
        </a>
      </div>

      {preview && (
        <div className="admin-retention-preview" role="region" aria-label="Retention preview">
          <h5>No-change preview</h5>
          <dl>
            <div><dt>Inactive to archive</dt><dd>{preview.inactiveArchiveCandidates}</dd></div>
            <div><dt>Archived to delete</dt><dd>{preview.archivedDeletionCandidates}</dd></div>
            <div><dt>End-of-year action</dt><dd>{preview.endOfYearCandidates}</dd></div>
            <div><dt>Awaiting provider/backup expiry</dt><dd>{preview.pendingPropagationRecords}</dd></div>
            <div><dt>Expiry evidence due</dt><dd>{preview.propagationEvidenceDue}</dd></div>
          </dl>
          <p>
            Latest due school-year end: {preview.latestYearEnd}.
            {preview.endOfYearDue ? " The annual action is due." : " The annual action is already recorded."}
          </p>
          {actionCount > 0 && (
            <div className="admin-retention-confirm page-stack">
              <label>
                <span>Type {RETENTION_CONFIRMATION} to apply this preview</span>
                <input
                  autoComplete="off"
                  value={confirmation}
                  disabled={busy}
                  onChange={event => setConfirmation(event.target.value)}
                />
              </label>
              <button
                className="lp-button lp-button-danger"
                type="button"
                disabled={busy || confirmation !== RETENTION_CONFIRMATION}
                onClick={handleRun}
              >
                {state === "applying" ? "Applying and checking..." : "Apply retention policy"}
              </button>
            </div>
          )}
        </div>
      )}

      {propagationRecords.length > 0 && (
        <div className="admin-retention-propagation page-stack">
          <h5>Deletion propagation evidence</h5>
          <p>
            A date passing is not proof of deletion. Only verify a row after
            checking the provider or backup evidence named in the runbook.
          </p>
          <div className="admin-table-wrap">
            <table className="dashboard-table admin-table">
              <thead>
                <tr>
                  <th>Learner reference</th>
                  <th>Provider target</th>
                  <th>Backup target</th>
                  <th>Status</th>
                  <th>Evidence</th>
                </tr>
              </thead>
              <tbody>
                {propagationRecords.map(record => {
                  const expiryPassed = record.evidenceDue === true;
                  return (
                    <tr key={record.requestId}>
                      <td data-label="Learner reference">
                        <code>{String(record.subjectRef).slice(0, 12)}…</code>
                      </td>
                      <td data-label="Provider target">
                        {new Date(record.providerExpiresAt).toLocaleDateString()}
                      </td>
                      <td data-label="Backup target">
                        {new Date(record.backupExpiresAt).toLocaleDateString()}
                      </td>
                      <td data-label="Status">{record.status.replaceAll("_", " ")}</td>
                      <td data-label="Evidence">
                        {record.status === "expired_verified" ? (
                          record.evidenceReference
                        ) : (
                          <button
                            className="text-button"
                            type="button"
                            disabled={!expiryPassed || busy}
                            onClick={() => {
                              setPropagationRequestId(record.requestId);
                              setEvidenceReference("");
                              setPropagationConfirmation("");
                            }}
                          >
                            {expiryPassed ? "Record evidence" : "Not due"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {propagationRequestId && (
            <div className="admin-retention-confirm page-stack">
              <label>
                <span>Evidence reference</span>
                <input
                  value={evidenceReference}
                  disabled={busy}
                  placeholder="Provider ticket, backup report, or signed checklist"
                  onChange={event => setEvidenceReference(event.target.value)}
                />
              </label>
              <label>
                <span>Type {PROPAGATION_CONFIRMATION}</span>
                <input
                  autoComplete="off"
                  value={propagationConfirmation}
                  disabled={busy}
                  onChange={event => setPropagationConfirmation(event.target.value)}
                />
              </label>
              <button
                className="lp-button lp-button-danger"
                type="button"
                disabled={
                  busy
                  || evidenceReference.trim().length < 8
                  || propagationConfirmation !== PROPAGATION_CONFIRMATION
                }
                onClick={handleVerifyPropagation}
              >
                {state === "verifying" ? "Recording..." : "Verify expiry evidence"}
              </button>
            </div>
          )}
        </div>
      )}

      {message && <p className="teacher-inline-success" role="status">{message}</p>}
      {error && <p className="teacher-inline-error" role="alert">{error}</p>}
    </section>
  );
}

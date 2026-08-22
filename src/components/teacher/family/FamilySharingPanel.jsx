import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle, Copy, Envelope, Link, SpinnerGap, Trash, UserMinus, Users, WarningCircle } from "@phosphor-icons/react";
import { guardianPortalApi } from "../../../data/guardianPortalApi.js";
import { buildParentReleaseSnapshot } from "../../../data/parentReleaseSnapshot.js";
import "../../../styles/family-sharing.css";

function messageFor(error) {
  const code = error?.code || error?.message || "";
  const messages = {
    guardian_already_linked: "That email already has access to this learner.",
    valid_guardian_email_required: "Enter a valid family email address.",
    invalid_family_snapshot: "The family report contains wording or data that cannot be released.",
    report_title_required: "Add a title before releasing the report."
  };
  return messages[code] || error?.message || "The family sharing action could not be completed.";
}

function displayDate(value) {
  const date = new Date(value || "");
  return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleDateString();
}

export function FamilySharingPanel({
  client,
  workspace,
  studentId,
  studentName,
  className,
  schoolName,
  teacherName,
  teacherEmail,
  cycleNumber = 1
}) {
  const [access, setAccess] = useState({ invites: [], links: [], reports: [] });
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState("load");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [createdLink, setCreatedLink] = useState("");

  const load = useCallback(async () => {
    if (!client || !studentId) return;
    setBusy("load");
    setError("");
    try {
      const data = await guardianPortalApi.listAccess(client, studentId);
      setAccess({ invites: data.invites || [], links: data.links || [], reports: data.reports || [] });
    } catch (nextError) {
      setError(messageFor(nextError));
    } finally {
      setBusy("");
    }
  }, [client, studentId]);

  useEffect(() => {
    if (!client || !studentId) return undefined;
    let active = true;
    guardianPortalApi.listAccess(client, studentId).then(data => {
      if (!active) return;
      setAccess({ invites: data.invites || [], links: data.links || [], reports: data.reports || [] });
      setBusy("");
    }).catch(nextError => {
      if (!active) return;
      setError(messageFor(nextError));
      setBusy("");
    });
    return () => { active = false; };
  }, [client, studentId]);

  const reportTitle = useMemo(() => (
    `${studentName} family reading update - ${new Date().toLocaleDateString()}`
  ), [studentName]);

  async function perform(key, action, successMessage) {
    setBusy(key);
    setError("");
    setSuccess("");
    try {
      await action();
      setSuccess(successMessage);
      await load();
    } catch (nextError) {
      setError(messageFor(nextError));
    } finally {
      setBusy("");
    }
  }

  async function createInvite(event) {
    event.preventDefault();
    setBusy("invite");
    setError("");
    setSuccess("");
    try {
      const created = await guardianPortalApi.createInvite(client, {
        studentId,
        guardianEmail: email,
        expiresDays: 7
      });
      const link = new URL("/parent", window.location.origin);
      link.searchParams.set("invite", created.token);
      setCreatedLink(link.toString());
      setEmail("");
      setSuccess("Invitation created. Copy this private link now and send it to the invited adult.");
      await load();
    } catch (nextError) {
      setError(messageFor(nextError));
    } finally {
      setBusy("");
    }
  }

  async function copyCreatedLink() {
    try {
      await navigator.clipboard.writeText(createdLink);
      setSuccess("Private invitation link copied.");
    } catch {
      setError("Copy was blocked. Select the full link and copy it manually.");
    }
  }

  if (!client || !studentId) return null;

  return <section className="family-sharing-panel" aria-labelledby="family-sharing-title">
    <header><div><span><Users size={20} aria-hidden="true" /></span><div><p>School-controlled access</p><h2 id="family-sharing-title">Family sharing</h2></div></div><small>Drafts and internal results are never shared.</small></header>
    <div className="family-sharing-grid">
      <section>
        <h3>Invite a parent or guardian</h3>
        <p>Create a one-use link for the adult’s email address. You send the link yourself during beta.</p>
        <form onSubmit={createInvite}><label>Email address<input type="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="family@example.com" /></label><button type="submit" className="teacher-button secondary" disabled={Boolean(busy)}>{busy === "invite" ? <SpinnerGap className="parent-area-spinner" size={18} /> : <Envelope size={18} />}Create invitation</button></form>
        {createdLink ? <div className="family-created-link"><label>Private invitation link<input readOnly value={createdLink} onFocus={event => event.target.select()} /></label><button type="button" onClick={copyCreatedLink}><Copy size={18} />Copy link</button><small>This full link is shown once. It expires after 7 days.</small></div> : null}
      </section>
      <section>
        <h3>Release a family report</h3>
        <p>This creates a separate, plain-language snapshot. Later changes to teacher records do not silently change it.</p>
        <button type="button" className="teacher-button primary" disabled={Boolean(busy)} onClick={() => perform("release", async () => {
          const snapshot = buildParentReleaseSnapshot({ workspace, studentId, studentName, className, schoolName, teacherName, teacherEmail, cycleNumber });
          await guardianPortalApi.releaseReport(client, { studentId, title: reportTitle, snapshot });
        }, "Family report released. Linked adults can see it now.")}>{busy === "release" ? <SpinnerGap className="parent-area-spinner" size={18} /> : <Link size={18} />}Release current family update</button>
      </section>
    </div>
    {error ? <p className="family-sharing-message is-error" role="alert"><WarningCircle size={18} />{error}</p> : null}
    {success ? <p className="family-sharing-message is-success" role="status"><CheckCircle size={18} />{success}</p> : null}
    <div className="family-access-lists">
      <section><h3>Active family access</h3>{access.links.length ? <ul>{access.links.map(link => <li key={link.id}><div><strong>{link.display_name}</strong><span>{link.guardian_email}</span></div><button type="button" disabled={Boolean(busy)} onClick={() => {
        if (!window.confirm(`Remove ${link.display_name}'s access to ${studentName}?`)) return;
        void perform(`revoke-${link.id}`, () => guardianPortalApi.revokeAccess(client, { studentId, guardianUserId: link.guardian_user_id }), "Family access removed immediately.");
      }}><UserMinus size={17} />Remove access</button></li>)}</ul> : <p className="family-list-empty">No adult has accepted an invitation yet.</p>}</section>
      <section><h3>Pending invitations</h3>{access.invites.length ? <ul>{access.invites.map(invite => <li key={invite.id}><div><strong>{invite.guardian_email}</strong><span>Expires {displayDate(invite.expires_at)}</span></div><button type="button" disabled={Boolean(busy)} onClick={() => void perform(`cancel-${invite.id}`, () => guardianPortalApi.cancelInvite(client, invite.id), "Invitation cancelled.")}><Trash size={17} />Cancel</button></li>)}</ul> : <p className="family-list-empty">No current invitations.</p>}</section>
      <section><h3>Released reports</h3>{access.reports.length ? <ul>{access.reports.map(report => <li key={report.id}><div><strong>{report.title}</strong><span>Released {displayDate(report.released_at)}</span></div><button type="button" disabled={Boolean(busy)} onClick={() => void perform(`withdraw-${report.id}`, () => guardianPortalApi.withdrawReport(client, report.id), "Report withdrawn from family view.")}><Trash size={17} />Withdraw</button></li>)}</ul> : <p className="family-list-empty">No family reports released yet.</p>}</section>
    </div>
  </section>;
}

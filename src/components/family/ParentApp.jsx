import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle, Envelope, Key, Lock, Printer, ShieldCheck, SpinnerGap, WarningCircle, X } from "@phosphor-icons/react";
import { buildParentAreaModel } from "../../data/parentAreaModel.js";
import { guardianPortalApi } from "../../data/guardianPortalApi.js";
import { LEGAL_POLICY } from "../../policy/legalPolicy.js";
import { isSupabaseConfigured, supabase } from "../../supabaseClient.js";
import { openHtmlDocument } from "../../utils/openHtmlDocument.js";
import logomarkUrl from "../../assets/logomark.png";
import { ParentAreaPage } from "./ParentAreaPage.jsx";
import "../../styles/parent-auth.css";

const INVITE_PATTERN = /^[0-9a-f]{64}$/;

function inviteFromLocation() {
  const token = new URLSearchParams(window.location.search).get("invite") || "";
  return INVITE_PATTERN.test(token) ? token : "";
}

function friendlyError(error) {
  const code = error?.code || error?.message || "";
  const messages = {
    email_not_confirmed: "Confirm your email before accepting the school invitation.",
    invitation_email_mismatch: "This invitation was sent to a different email address.",
    invalid_invitation: "This invitation is invalid, expired or has been cancelled.",
    legal_version_outdated: "The legal notice changed. Refresh this page and try again.",
    guardian_profile_required: "This account has not accepted a family invitation yet."
  };
  return messages[code] || error?.message || "Something went wrong. Please try again.";
}

function defaultSnapshot(learner) {
  return {
    schemaVersion: 1,
    learner,
    updatedLabel: "No family report yet",
    highlight: "The school has linked your family account. A reading update will appear after the teacher releases it.",
    strengths: [],
    canDo: [],
    nextFocus: [],
    progress: [],
    atHome: { activities: [] },
    reports: []
  };
}

function modelsFromPortal(children = []) {
  return children.map(child => buildParentAreaModel({
    ...(child.latest_snapshot || defaultSnapshot(child.learner)),
    learner: child.learner,
    reports: (child.reports || []).map(report => ({ ...report, releaseState: "released" }))
  }));
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

function printableHtml({ title, model, autoHeading = "Family reading update" }) {
  const list = (heading, items) => items?.length
    ? `<section><h2>${escapeHtml(heading)}</h2><ul>${items.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul></section>`
    : "";
  const activities = model.atHome?.activities || [];
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>@page{margin:14mm}body{font:16px/1.5 Arial,sans-serif;color:#172033;max-width:760px;margin:auto}header{border-bottom:3px solid #0c6b65;padding-bottom:14px}h1{font-size:28px;margin:.25rem 0}h2{font-size:19px;color:#084e4a;margin-top:24px}section{break-inside:avoid}li{margin:.4rem 0}.meta{color:#586579}.notice{margin-top:28px;border-top:1px solid #dbe3e8;padding-top:12px;color:#586579;font-size:13px}</style></head><body><header><small>${escapeHtml(autoHeading)}</small><h1>${escapeHtml(title)}</h1><p class="meta">${escapeHtml(model.updatedLabel)}</p><p>${escapeHtml(model.highlight)}</p></header>${list("What is going well", model.strengths)}${list("What comes next", model.nextFocus)}${activities.length ? `<section><h2>${escapeHtml(model.atHome.title)}</h2><p>${escapeHtml(model.atHome.introduction)}</p><ol>${activities.map(item => `<li><strong>${escapeHtml(item.title)}</strong><br>${escapeHtml(item.direction)}</li>`).join("")}</ol></section>` : ""}<p class="notice">This is a family-ready update released by ${escapeHtml(model.learner.schoolName)}. Contact the school with questions.</p></body></html>`;
}

function ParentAuthShell({ children }) {
  return <main className="parent-auth-shell"><section className="parent-auth-card"><header><span><img src={logomarkUrl} alt="" /></span><div><strong>Literacy Guide</strong><small>Secure family access</small></div></header>{children}</section></main>;
}

function AuthForm({ invite, schoolName, onComplete }) {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (mode === "reset") {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/parent`
        });
        if (resetError) throw resetError;
        setMessage("Check your email for a secure password reset link.");
      } else if (mode === "signup") {
        const redirect = new URL("/parent", window.location.origin);
        if (invite) redirect.searchParams.set("invite", invite);
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirect.toString(),
            data: { account_type: "guardian" }
          }
        });
        if (signUpError) throw signUpError;
        if (data.session) onComplete(data.session);
        else setMessage("Check your email and confirm your address. Then return here to accept the school invitation.");
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        onComplete(data.session);
      }
    } catch (nextError) {
      setError(friendlyError(nextError));
    } finally {
      setBusy(false);
    }
  }

  return <ParentAuthShell>
    {invite ? <div className="parent-auth-invite"><Envelope size={21} aria-hidden="true" /><div><strong>Invitation from {schoolName || "your school"}</strong><span>Sign in or create an account using the email address the school invited.</span></div></div> : null}
    <h1>{mode === "signup" ? "Create your family account" : mode === "reset" ? "Reset your password" : "Family sign in"}</h1>
    <p>{mode === "reset" ? "We will email a secure reset link." : "Your school controls which children and reports you can see."}</p>
    <form onSubmit={submit}>
      <label>Email address<input type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} /></label>
      {mode !== "reset" ? <label>Password<input type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} minLength={8} required value={password} onChange={event => setPassword(event.target.value)} /></label> : null}
      {error ? <p className="parent-auth-error" role="alert"><WarningCircle size={18} aria-hidden="true" />{error}</p> : null}
      {message ? <p className="parent-auth-success" role="status"><CheckCircle size={18} aria-hidden="true" />{message}</p> : null}
      <button type="submit" className="pa-button pa-button-primary" disabled={busy}>{busy ? <SpinnerGap className="parent-area-spinner" size={19} aria-hidden="true" /> : <Lock size={18} aria-hidden="true" />}{mode === "signup" ? "Create account" : mode === "reset" ? "Send reset link" : "Sign in"}</button>
    </form>
    <div className="parent-auth-links">
      {invite && mode !== "signup" ? <button type="button" onClick={() => setMode("signup")}>Create a family account</button> : null}
      {mode !== "signin" ? <button type="button" onClick={() => setMode("signin")}><ArrowLeft size={15} aria-hidden="true" />Back to sign in</button> : null}
      {mode === "signin" ? <button type="button" onClick={() => setMode("reset")}>Forgot password?</button> : null}
    </div>
    <footer><ShieldCheck size={18} aria-hidden="true" />A school invitation and confirmed email are required before learner information is shown.</footer>
  </ParentAuthShell>;
}

function AcceptInvite({ schoolName, onAccept, busy, error }) {
  const [displayName, setDisplayName] = useState("");
  const [accepted, setAccepted] = useState(false);
  return <ParentAuthShell>
    <div className="parent-auth-invite"><Envelope size={21} aria-hidden="true" /><div><strong>Invitation from {schoolName}</strong><span>Your confirmed email matches this invitation.</span></div></div>
    <h1>Accept family access</h1>
    <p>The school will decide which child and which family-ready reports appear in this account.</p>
    <form onSubmit={event => { event.preventDefault(); onAccept(displayName); }}>
      <label>Your name<input autoComplete="name" maxLength={80} required value={displayName} onChange={event => setDisplayName(event.target.value)} /></label>
      <label className="parent-auth-check"><input type="checkbox" required checked={accepted} onChange={event => setAccepted(event.target.checked)} /><span>I agree to the <a href="/terms.html" target="_blank" rel="noreferrer">Terms</a> and confirm I have read the <a href="/privacy.html" target="_blank" rel="noreferrer">Privacy Notice</a>, effective {LEGAL_POLICY.effectiveDate}.</span></label>
      {error ? <p className="parent-auth-error" role="alert"><WarningCircle size={18} aria-hidden="true" />{error}</p> : null}
      <button type="submit" className="pa-button pa-button-primary" disabled={busy || !accepted}>{busy ? <SpinnerGap className="parent-area-spinner" size={19} aria-hidden="true" /> : <Key size={18} aria-hidden="true" />}Accept secure access</button>
    </form>
  </ParentAuthShell>;
}

function PasswordRecovery({ onComplete }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return <ParentAuthShell><h1>Choose a new password</h1><p>Use at least eight characters.</p><form onSubmit={async event => {
    event.preventDefault();
    setBusy(true);
    const result = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (result.error) setError(friendlyError(result.error));
    else onComplete();
  }}><label>New password<input type="password" minLength={8} autoComplete="new-password" required value={password} onChange={event => setPassword(event.target.value)} /></label>{error ? <p className="parent-auth-error" role="alert">{error}</p> : null}<button type="submit" className="pa-button pa-button-primary" disabled={busy}>Save new password</button></form></ParentAuthShell>;
}

function ReportDialog({ report, model, onClose, onPrint }) {
  if (!report) return null;
  const reportModel = report.snapshot ? buildParentAreaModel({ ...report.snapshot, reports: [] }) : model;
  return <div className="parent-report-dialog" role="dialog" aria-modal="true" aria-labelledby="parent-report-title"><div><header><div><span>Released by school</span><h1 id="parent-report-title">{report.title}</h1><p>{report.publishedLabel}</p></div><button type="button" onClick={onClose} aria-label="Close report"><X size={22} /></button></header><p className="parent-report-highlight">{reportModel.highlight}</p><section><h2>What is going well</h2><ul>{reportModel.strengths.map(item => <li key={item}>{item}</li>)}</ul></section><section><h2>What comes next</h2><ul>{reportModel.nextFocus.map(item => <li key={item}>{item}</li>)}</ul></section><footer><button type="button" className="pa-button pa-button-secondary" onClick={() => onPrint(report, reportModel)}><Printer size={18} />Print or save</button><button type="button" className="pa-button pa-button-primary" onClick={onClose}>Close</button></footer></div></div>;
}

export function ParentApp() {
  const [session, setSession] = useState(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [recovery, setRecovery] = useState(false);
  const [invite] = useState(inviteFromLocation);
  const [invitePreview, setInvitePreview] = useState(null);
  const [inviteError, setInviteError] = useState("");
  const [portal, setPortal] = useState(null);
  const [state, setState] = useState("loading");
  const [error, setError] = useState("");
  const [accepting, setAccepting] = useState(false);
  const [openReport, setOpenReport] = useState(null);
  const [openReportModel, setOpenReportModel] = useState(null);
  const [accountMessage, setAccountMessage] = useState("");

  const loadPortal = useCallback(async () => {
    setState("loading");
    setError("");
    try {
      const data = await guardianPortalApi.getPortal(supabase);
      setPortal(data);
      setState("ready");
    } catch (nextError) {
      setError(friendlyError(nextError));
      setState("error");
    }
  }, []);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setSessionReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
      setSession(nextSession);
      setSessionReady(true);
    });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!invite) return;
    guardianPortalApi.previewInvite(supabase, invite)
      .then(setInvitePreview)
      .catch(nextError => setInviteError(friendlyError(nextError)));
  }, [invite]);

  useEffect(() => {
    if (!session || invite || recovery) return undefined;
    let active = true;
    guardianPortalApi.getPortal(supabase).then(data => {
      if (!active) return;
      setPortal(data);
      setState("ready");
    }).catch(nextError => {
      if (!active) return;
      setError(friendlyError(nextError));
      setState("error");
    });
    return () => { active = false; };
  }, [invite, recovery, session]);

  const models = useMemo(() => modelsFromPortal(portal?.children), [portal]);

  if (!isSupabaseConfigured) return <ParentAuthShell><h1>Family access is not configured</h1><p>The app cannot safely sign families in on this deployment. Ask the service owner to check the hosting settings.</p></ParentAuthShell>;
  if (!sessionReady || (invite && !invitePreview && !inviteError)) return <ParentAuthShell><SpinnerGap className="parent-area-spinner parent-auth-loader" size={32} aria-label="Loading secure family access" /></ParentAuthShell>;
  if (recovery) return <PasswordRecovery onComplete={() => { setRecovery(false); void loadPortal(); }} />;
  if (inviteError) return <ParentAuthShell><WarningCircle size={30} className="parent-auth-warning" /><h1>Invitation unavailable</h1><p>{inviteError}</p><a className="pa-button pa-button-secondary" href="/parent">Go to family sign in</a></ParentAuthShell>;
  if (!session) return <AuthForm invite={invite} schoolName={invitePreview?.school_name} onComplete={setSession} />;
  if (invite && !portal) return <AcceptInvite schoolName={invitePreview?.school_name || "your school"} busy={accepting} error={error} onAccept={async displayName => {
    setAccepting(true);
    setError("");
    try {
      await guardianPortalApi.acceptInvite(supabase, {
        token: invite,
        displayName,
        termsVersion: LEGAL_POLICY.termsVersion,
        privacyVersion: LEGAL_POLICY.privacyVersion
      });
      window.history.replaceState({}, "", "/parent");
      await loadPortal();
    } catch (nextError) {
      setError(friendlyError(nextError));
    } finally {
      setAccepting(false);
    }
  }} />;

  function printReport(report, model) {
    void guardianPortalApi.recordReportEvent(supabase, { reportId: report.id, eventType: "report_printed" }).catch(() => {});
    openHtmlDocument({ html: printableHtml({ title: report.title, model }), name: "literacy-guide-family-report", autoPrint: true });
  }

  return <>
    <ParentAreaPage
      models={models}
      state={state}
      onRetry={loadPortal}
      preferredLanguage={portal?.profile?.preferred_language || "en"}
      reportNotifications={Boolean(portal?.profile?.report_notifications)}
      accountMessage={accountMessage}
      onOpenReport={(report, model) => {
        setOpenReport(report);
        setOpenReportModel(model);
        void guardianPortalApi.recordReportEvent(supabase, { reportId: report.id, eventType: "report_viewed" }).catch(() => {});
      }}
      onPrintPlan={model => openHtmlDocument({ html: printableHtml({ title: model.atHome.title, model, autoHeading: "Family Bridge plan" }), name: "literacy-guide-home-plan", autoPrint: true })}
      onPrintReport={printReport}
      onSignOut={async () => { await supabase.auth.signOut(); setPortal(null); setSession(null); }}
      onUpdatePreferences={async preferences => {
        setAccountMessage("");
        try {
          await guardianPortalApi.updatePreferences(supabase, preferences);
          setPortal(current => ({ ...current, profile: { ...current.profile, preferred_language: preferences.preferredLanguage, report_notifications: preferences.reportNotifications } }));
          setAccountMessage("Preferences saved.");
        } catch (nextError) {
          setAccountMessage(friendlyError(nextError));
        }
      }}
    />
    <ReportDialog report={openReport} model={openReportModel} onClose={() => { setOpenReport(null); setOpenReportModel(null); }} onPrint={printReport} />
  </>;
}

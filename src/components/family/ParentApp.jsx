import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, CheckCircle, Envelope, Key, Lock, ShieldCheck, SpinnerGap, WarningCircle } from "@phosphor-icons/react";
import { buildParentAreaModel } from "../../data/parentAreaModel.js";
import { familyReportModelForRelease, familyReportPrintableHtml } from "../../data/familyReportDocument.js";
import { guardianPortalApi } from "../../data/guardianPortalApi.js";
import { LEGAL_POLICY } from "../../policy/legalPolicy.js";
import { isSupabaseConfigured, supabase } from "../../supabaseClient.js";
import { openHtmlDocument } from "../../utils/openHtmlDocument.js";
import logomarkUrl from "../../assets/logomark.webp";
import { ParentAreaPage } from "./ParentAreaPage.jsx";
import { FamilyReportDialog } from "./FamilyReportDialog.jsx";
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

function ParentAuthShell({ children }) {
  return <main className="parent-auth-shell"><section className="parent-auth-card"><header><span><img src={logomarkUrl} alt="" /></span><div><strong>Literacy Guide</strong><small>Secure family access</small></div></header>
    <p className="parent-auth-privacy">We use your email and account details to provide secure family access. Read our <a href="/privacy.html" target="_blank" rel="noreferrer">Privacy Notice</a> and <a href="/terms.html" target="_blank" rel="noreferrer">Terms</a> before continuing.</p>
    {children}
  </section></main>;
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
    <div className="parent-auth-invite"><Envelope size={21} aria-hidden="true" /><div><strong>Invitation from {schoolName}</strong><span>Use the email address your school invited.</span></div></div>
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

export function ParentApp({ client = supabase, configured = isSupabaseConfigured }) {
  const [session, setSession] = useState(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [recovery, setRecovery] = useState(false);
  const [invite, setInvite] = useState(inviteFromLocation);
  const [invitePreview, setInvitePreview] = useState(null);
  const [inviteError, setInviteError] = useState("");
  const [acceptError, setAcceptError] = useState("");
  const [accepting, setAccepting] = useState(false);
  const [acceptedFor, setAcceptedFor] = useState("");
  const guardianRef = useRef({ id: "", generation: 0 });
  const [sessionGeneration, setSessionGeneration] = useState(0);

  const updateSession = useCallback(next => {
    const id = next?.user?.id || "";
    if (guardianRef.current.id !== id) {
      guardianRef.current = { id, generation: guardianRef.current.generation + 1 };
      setSessionGeneration(guardianRef.current.generation);
    }
    setSession(next);
    setSessionReady(true);
  }, []);

  useEffect(() => {
    let active = true;
    let authEventReceived = false;
    const { data } = client.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return;
      authEventReceived = true;
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
      if (!nextSession) setRecovery(false);
      updateSession(nextSession);
    });
    void client.auth.getSession().then(({ data: saved }) => {
      if (active && !authEventReceived) updateSession(saved?.session || null);
    }).catch(() => {
      if (active && !authEventReceived) updateSession(null);
    });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, [client, updateSession]);

  useEffect(() => {
    if (!invite) return undefined;
    let active = true;
    guardianPortalApi.previewInvite(client, invite)
      .then(data => { if (active) setInvitePreview(data); })
      .catch(error => { if (active) setInviteError(friendlyError(error)); });
    return () => { active = false; };
  }, [client, invite]);

  const guardianId = session?.user?.id;
  const isCurrent = useCallback(() => Boolean(guardianId && guardianRef.current.id === guardianId
    && guardianRef.current.generation === sessionGeneration), [guardianId, sessionGeneration]);

  if (!configured) return <ParentAuthShell><h1>Family access is not configured</h1><p>The app cannot safely sign families in on this deployment. Ask the service owner to check the hosting settings.</p></ParentAuthShell>;
  if (!sessionReady || (invite && !invitePreview && !inviteError)) return <ParentAuthShell><SpinnerGap className="parent-area-spinner parent-auth-loader" size={32} aria-label="Loading secure family access" /></ParentAuthShell>;
  if (recovery) return <PasswordRecovery onComplete={() => setRecovery(false)} />;
  if (invite && inviteError) return <ParentAuthShell><WarningCircle size={30} className="parent-auth-warning" /><h1>Invitation unavailable</h1><p>{inviteError}</p><a className="pa-button pa-button-secondary" href="/parent">Go to family sign in</a></ParentAuthShell>;
  if (!guardianId) return <AuthForm invite={invite} schoolName={invitePreview?.school_name} onComplete={updateSession} />;
  if (invite) return <AcceptInvite schoolName={invitePreview?.school_name || "your school"} busy={accepting} error={acceptError} onAccept={async displayName => {
    setAccepting(true);
    setAcceptError("");
    try {
      await guardianPortalApi.acceptInvite(client, {
        token: invite, displayName, termsVersion: LEGAL_POLICY.termsVersion, privacyVersion: LEGAL_POLICY.privacyVersion
      });
      if (!isCurrent()) return;
      setAcceptedFor(guardianId);
      setInvite("");
      window.history.replaceState({}, "", "/parent");
    } catch (error) {
      if (isCurrent()) setAcceptError(friendlyError(error));
    } finally {
      setAccepting(false);
    }
  }} />;

  return <GuardianPortal key={sessionGeneration} client={client} isCurrent={isCurrent}
    invitationAccepted={acceptedFor === guardianId}
    onSignOut={async () => {
      const { error } = await client.auth.signOut();
      if (error) throw error;
      if (isCurrent()) updateSession(null);
    }}
  />;
}

function findReleasedReport(models, selection) {
  const model = models.find(item => item.learner.id === selection?.learnerId);
  const report = model?.reports.find(item => item.id === selection.reportId);
  return report ? { report, model } : null;
}

function GuardianPortal({ client, isCurrent, invitationAccepted, onSignOut }) {
  const [portal, setPortal] = useState(null);
  const [state, setState] = useState("loading");
  const [selection, setSelection] = useState(null);
  const [accountMessage, setAccountMessage] = useState("");
  const [reportMessage, setReportMessage] = useState("");
  const [printing, setPrinting] = useState(false);
  const readSequence = useRef(0);
  const printPending = useRef(false);

  const loadPortal = useCallback(async () => {
    const sequence = ++readSequence.current;
    try {
      const data = await guardianPortalApi.getPortal(client);
      if (!isCurrent() || sequence !== readSequence.current) return;
      setPortal(data);
      setSelection(current => {
        if (!current) return null;
        return findReleasedReport(modelsFromPortal(data.children), current) ? current : null;
      });
      setState("ready");
    } catch {
      if (!isCurrent() || sequence !== readSequence.current) return;
      setSelection(null);
      setPortal(null);
      setState("error");
    }
  }, [client, isCurrent]);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => { if (active) void loadPortal(); });
    const recheck = () => {
      if (document.visibilityState === "visible" && !printPending.current) void loadPortal();
    };
    document.addEventListener("visibilitychange", recheck);
    return () => {
      active = false;
      readSequence.current += 1;
      document.removeEventListener("visibilitychange", recheck);
    };
  }, [loadPortal]);

  const models = useMemo(() => modelsFromPortal(portal?.children), [portal]);
  const openReport = state === "ready" && findReleasedReport(models, selection);
  const retry = () => {
    setState("loading");
    void loadPortal();
  };

  function printReport(report, model) {
    if (printPending.current || !isCurrent()) return;
    printPending.current = true;
    setPrinting(true);
    setReportMessage("");
    const requested = { learnerId: model.learner.id, reportId: report.id };
    const result = openHtmlDocument({
      name: "literacy-guide-family-report",
      autoPrint: true,
      prepareHtml: async () => {
        try {
          const checked = await guardianPortalApi.getPortal(client);
          if (!isCurrent()) throw new Error("Sign in again to print this report.");
          const release = findReleasedReport(modelsFromPortal(checked.children), requested);
          if (!release) throw new Error("The school has withdrawn this report or access has changed.");
          await guardianPortalApi.recordReportEvent(client, { reportId: report.id, eventType: "report_printed" });
          if (!isCurrent()) throw new Error("Sign in again to print this report.");
          return familyReportPrintableHtml({
            title: release.report.title,
            model: familyReportModelForRelease(release.report, release.model)
          });
        } catch (error) {
          if (isCurrent()) void loadPortal();
          throw error;
        }
      }
    });
    const finished = result.ready || Promise.reject(new Error("Allow pop-ups for this site, then try Print again."));
    void finished.catch(error => {
      if (isCurrent()) setReportMessage(friendlyError(error));
    }).finally(() => {
      printPending.current = false;
      if (isCurrent()) setPrinting(false);
    });
  }

  if (invitationAccepted && state === "error") return <ParentAuthShell>
    <h1>Your invitation was accepted</h1>
    <p>The family area could not load. Your school link is ready.</p>
    <button className="pa-button pa-button-primary" type="button" onClick={retry}>Load family area again</button>
  </ParentAuthShell>;

  return <>
    <ParentAreaPage
      models={models}
      state={state}
      onRetry={retry}
      preferredLanguage={portal?.profile?.preferred_language || "en"}
      reportNotifications={Boolean(portal?.profile?.report_notifications)}
      accountMessage={accountMessage}
      reportMessage={!openReport ? reportMessage : ""}
      printing={printing}
      onOpenReport={(report, model) => {
        setReportMessage("");
        setSelection({ learnerId: model.learner.id, reportId: report.id });
        void guardianPortalApi.recordReportEvent(client, { reportId: report.id, eventType: "report_viewed" }).catch(() => {});
      }}
      onPrintReport={printReport}
      onSignOut={async () => {
        try { await onSignOut(); }
        catch { if (isCurrent()) setAccountMessage("Could not sign out. Try again."); }
      }}
      onUpdatePreferences={async preferences => {
        setAccountMessage("");
        try {
          await guardianPortalApi.updatePreferences(client, preferences);
          if (!isCurrent()) return;
          setPortal(current => current && ({ ...current, profile: { ...current.profile, preferred_language: preferences.preferredLanguage, report_notifications: preferences.reportNotifications } }));
          setAccountMessage("Preferences saved.");
        } catch (error) {
          if (isCurrent()) setAccountMessage(friendlyError(error));
        }
      }}
    />
    {openReport && <FamilyReportDialog report={openReport.report} model={openReport.model}
      onClose={() => { setSelection(null); setReportMessage(""); }}
      onPrint={printReport} printMessage={reportMessage} printing={printing} />}
  </>;
}

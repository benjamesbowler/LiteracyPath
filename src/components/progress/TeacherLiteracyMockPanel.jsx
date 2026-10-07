import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { prepareLiteracyMockSession, controlLiteracyMockSession, listLiteracyMockSessions, getLiteracyMockReport } from "../../data/literacyMockSessionCore.js";
import { buildLiteracyMockReport, literacyMockStudentName, literacyMockControlError } from "../../utils/literacyMockReport.js";
import { TeacherPageShell, TeacherPageHeader, TeacherDataTable, TeacherFilterBar } from "../teacher/ui/TeacherPrimitives.jsx";
import { TeacherDialog } from "../teacher/ui/TeacherDialog.jsx";
import LiteracyMockReport from "./LiteracyMockReport.jsx";
import "../../styles/literacy-mock-teacher.css";

const STATES = { prepared: "Waiting to start", running: "In progress", paused: "Paused", completed: "Finished" };
const requestId = () => globalThis.crypto?.randomUUID?.() || `mock-control-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const dateText = value => value && Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "Date not recorded";
const minutes = seconds => Number.isFinite(Number(seconds)) ? `${Math.floor(Math.max(0, seconds) / 60)}:${String(Math.max(0, Math.floor(seconds)) % 60).padStart(2, "0")}` : "Not recorded";

async function boundedRequest(request) {
  let timer;
  try {
    return await Promise.race([request, new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error("The session service did not respond in time.")), 10000);
    })]);
  } finally { clearTimeout(timer); }
}

function validResult(result) {
  if (result?.ok !== true) throw Object.assign(new Error(literacyMockControlError(result?.error)), { code: result?.error || "invalid_result", confirmedRejection: true });
  return result;
}

function TeacherLiteracyMockPanelBody({ client, classId, className, students, onSessionPrepared, initialStudentIds }) {
  const roster = useMemo(() => students.filter(student => student?.id && !student.archived_at).slice().sort((a, b) => literacyMockStudentName(a).localeCompare(literacyMockStudentName(b), "en", { sensitivity: "base" })), [students]);
  const [wholeClass, setWholeClass] = useState(!initialStudentIds.length);
  const [studentIds, setStudentIds] = useState(initialStudentIds.map(String));
  const [itemCount, setItemCount] = useState(43);
  const [durationMinutes, setDurationMinutes] = useState(20);
  const [history, setHistory] = useState([]);
  const [historyState, setHistoryState] = useState("loading");
  const [historyError, setHistoryError] = useState("");
  const [historyStudent, setHistoryStudent] = useState(initialStudentIds.length === 1 ? String(initialStudentIds[0]) : "");
  const [sessionId, setSessionId] = useState("");
  const [snapshot, setSnapshot] = useState(null);
  const [reportState, setReportState] = useState("idle");
  const [reportError, setReportError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendingControl, setPendingControl] = useState(null);
  const [pendingPreparation, setPendingPreparation] = useState(null);
  const prepareUncertain = Boolean(pendingPreparation);
  const [finishOpen, setFinishOpen] = useState(false);
  const [selectedReportStudent, setSelectedReportStudent] = useState("");
  const alive = useRef(true);
  const reportRequest = useRef({ sequence: 0, pending: null });
  const historyRequest = useRef(0);
  const reportHeading = useRef(null);
  const statusRef = useRef(null);
  const reportContainer = useRef(null);

  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const loadHistory = useCallback(async () => {
    const sequence = ++historyRequest.current;
    setHistoryState("loading"); setHistoryError("");
    try {
      const result = validResult(await boundedRequest(listLiteracyMockSessions({ client, classId })));
      if (!Array.isArray(result.sessions)) throw new Error("Session history was incomplete.");
      if (!alive.current || sequence !== historyRequest.current) return;
      const verified = result.sessions.filter(session => session.class_id === classId);
      setHistory(verified); setHistoryState("ready");
      const active = verified.find(session => session.mock?.state !== "completed" && session.status === "active");
      setSessionId(current => current || active?.id || "");
    } catch (error) {
      if (!alive.current || sequence !== historyRequest.current) return;
      setHistoryState("error"); setHistoryError(error.confirmedRejection ? error.message : "Session history could not be refreshed. Previously verified sessions for this class remain visible.");
    }
  }, [classId, client]);

  useEffect(() => { const timer = setTimeout(() => { void loadHistory(); }, 0); return () => clearTimeout(timer); }, [loadHistory]);

  const refreshReport = useCallback(async ({ focus = false, background = false, force = false } = {}) => {
    if (!sessionId || (!force && reportRequest.current.pending?.sessionId === sessionId)) return;
    const sequence = ++reportRequest.current.sequence;
    const request = { sessionId, sequence };
    reportRequest.current.pending = request;
    if (!background) setReportState("loading");
    if (focus) statusRef.current?.focus();
    try {
      const result = validResult(await boundedRequest(getLiteracyMockReport({ client, sessionId })));
      if (result.session?.id !== sessionId || result.session?.class_id !== classId || !Array.isArray(result.members)) throw new Error("Session identity could not be verified.");
      if (!alive.current || sequence !== reportRequest.current.sequence) return;
      setSnapshot(result); setReportState("ready"); setReportError("");
      if (focus) setTimeout(() => reportHeading.current?.focus(), 0);
    } catch (error) {
      if (!alive.current || sequence !== reportRequest.current.sequence) return;
      setReportState("error"); setReportError(error.confirmedRejection ? error.message : "Live progress could not be refreshed. The last verified rows remain visible; controls are paused until a refresh succeeds.");
    } finally { if (reportRequest.current.pending === request) reportRequest.current.pending = null; }
  }, [classId, client, sessionId]);

  useEffect(() => {
    if (!sessionId) return undefined;
    const counter = reportRequest.current;
    const first = setTimeout(() => { void refreshReport(); }, 0);
    const timer = setInterval(() => { void refreshReport({ background: true }); }, 5000);
    return () => { clearTimeout(first); clearInterval(timer); counter.sequence++; };
  }, [refreshReport, sessionId]);

  const verifiedSnapshot = snapshot?.session?.id === sessionId && snapshot.session.class_id === classId ? snapshot : null;
  const report = useMemo(() => verifiedSnapshot ? buildLiteracyMockReport(verifiedSnapshot, { students: roster }) : null, [verifiedSnapshot, roster]);
  const mock = verifiedSnapshot?.session?.mock;
  const filteredHistory = history.filter(session => !historyStudent || session.member_student_ids?.some(id => String(id) === historyStudent));
  const selectedCount = wholeClass ? roster.length : roster.filter(student => studentIds.includes(String(student.id))).length;
  const controlsDisabled = busy || Boolean(pendingControl) || reportState !== "ready";

  async function prepare(retry = null) {
    const args = retry || { classId, wholeClass, studentIds: wholeClass ? [] : roster.filter(student => studentIds.includes(String(student.id))).map(student => student.id), durationMinutes, itemCount, requestId: requestId() };
    setBusy(true); setMessage("");
    try {
      const result = validResult(await boundedRequest(prepareLiteracyMockSession({ client, ...args })));
      if (!alive.current) return;
      if (result.session?.class_id !== classId || !result.session?.id) throw new Error("Prepared session identity could not be verified.");
      setSessionId(result.session.id); setPendingPreparation(null);
      onSessionPrepared?.(result);
      void loadHistory();
    } catch (error) {
      if (!alive.current) return;
      setMessage(error.confirmedRejection ? error.message : "Preparation could not be confirmed. Retry the same preparation to recover its result without creating another session.");
      setPendingPreparation(error.confirmedRejection ? null : args);
    } finally { if (alive.current) setBusy(false); }
  }

  async function sendControl(action, retry = null) {
    const args = retry || { sessionId, action, expectedRevision: mock?.revision, requestId: requestId() };
    setBusy(true); setMessage("");
    try {
      validResult(await boundedRequest(controlLiteracyMockSession({ client, ...args })));
      if (!alive.current) return;
      setPendingControl(null); setFinishOpen(false);
      await refreshReport({ force: true }); void loadHistory();
      setMessage(({ start: "Assessment started.", pause: "Assessment paused; the session clock is stopped.", resume: "Assessment resumed.", add_time: "Five minutes added within the available session window.", finish: "Assessment finished. Saved answers and questions not reached remain in the report." })[args.action]);
    } catch (error) {
      if (!alive.current) return;
      setMessage(error.confirmedRejection ? error.message : literacyMockControlError(error));
      if (error.confirmedRejection) { setPendingControl(null); setFinishOpen(false); await refreshReport({ force: true }); }
      else { setPendingControl(args); setFinishOpen(false); }
    } finally { if (alive.current) setBusy(false); }
  }

  return <TeacherPageShell as="section" product="literacy-mock-session" intent="assess" className="literacy-mock-teacher">
    <TeacherPageHeader eyebrow="Teacher-controlled assessment" title="Mixed literacy mock" description={`Run a calm, mixed assessment with ${className || "your class"} or selected students. Review independent responses, teaching needs, and flexible groups.`} />
    <p className="literacy-mock-note">Original K–2 literacy practice with harder extensions. Actual MAP Growth is untimed; the time below is your classroom practice window. Answers are not taught or marked for children during the assessment.</p>
    <details className="literacy-mock-setup" open={!sessionId}>
      <summary>Prepare a new session</summary>
      {!roster.length ? <p role="status">Add students to this class before preparing an assessment.</p> : <>
        <fieldset disabled={busy || prepareUncertain}><legend>Who will take part?</legend>
          <label><input type="radio" name={`mock-audience-${classId}`} checked={wholeClass} onChange={() => setWholeClass(true)} />Full class ({roster.length})</label>
          <label><input type="radio" name={`mock-audience-${classId}`} checked={!wholeClass} onChange={() => setWholeClass(false)} />Individual or selected students</label>
          {!wholeClass && <div className="literacy-mock-picker">{roster.map(student => <label key={student.id}><input type="checkbox" checked={studentIds.includes(String(student.id))} onChange={event => setStudentIds(current => event.target.checked ? [...current, String(student.id)] : current.filter(id => id !== String(student.id)))} />{literacyMockStudentName(student)}</label>)}</div>}
        </fieldset>
        <div className="literacy-mock-options"><label>Assessment length<select value={itemCount} disabled={busy || prepareUncertain} onChange={event => setItemCount(Number(event.target.value))}><option value={43}>Full mock · 43 questions</option><option value={24}>Short mock · 24 questions</option></select></label>
          <label>Classroom time window<select value={durationMinutes} disabled={busy || prepareUncertain} onChange={event => setDurationMinutes(Number(event.target.value))}>{[10, 20, 30, 40].map(value => <option key={value} value={value}>{value} minutes</option>)}</select></label></div>
        <p>The session waits for you to start. Pause for a break or add time as needed. Unfinished questions remain unscored.</p>
        <button type="button" className="literacy-mock-primary" disabled={!client || busy || prepareUncertain || selectedCount === 0} onClick={() => prepare()}>{busy && !mock ? "Preparing…" : `Prepare for ${selectedCount} ${selectedCount === 1 ? "student" : "students"}`}</button>
      </>}
    </details>
    {message && <div className="literacy-mock-notice" role="status"><p>{message}</p>{pendingControl && <button type="button" disabled={busy} onClick={() => sendControl(pendingControl.action, pendingControl)}>Retry the same action</button>}{pendingPreparation && <button type="button" disabled={busy} onClick={() => prepare(pendingPreparation)}>Retry the same preparation</button>}</div>}
    <section className="literacy-mock-history"><h3>Session history</h3><p>The 20 most recent sessions for this class.</p><TeacherFilterBar label="Mock session history filters"><label>Students<select value={historyStudent} onChange={event => setHistoryStudent(event.target.value)}><option value="">All students in this class</option>{roster.map(student => <option key={student.id} value={student.id}>{literacyMockStudentName(student)}</option>)}</select></label><button type="button" disabled={historyState === "loading"} onClick={() => loadHistory()}>Refresh history</button></TeacherFilterBar>
      {historyState === "loading" && <p role="status" aria-busy="true">Loading session history…</p>}
      {historyError && <p role="status">{historyError}</p>}
      {filteredHistory.length ? <label>Open a session<select value={filteredHistory.some(session => session.id === sessionId) ? sessionId : ""} disabled={busy || Boolean(pendingControl)} onChange={event => { setSessionId(event.target.value); setSelectedReportStudent(""); setMessage(""); }}><option value="">Choose a session</option>{filteredHistory.map(session => <option key={session.id} value={session.id}>{dateText(session.mock?.started_at || session.started_at)} · {session.mock?.item_count || ""} questions · {STATES[session.mock?.state] || "State unavailable"}</option>)}</select></label> : historyState === "ready" && <p>No matching sessions in this recent history{historyStudent ? " for this student" : ""}.</p>}
    </section>
    {sessionId && <section className="literacy-mock-live" aria-label="Teacher session controls">
      <div className="literacy-mock-live-heading"><h3 ref={reportHeading} tabIndex={-1}>Session desk</h3><button type="button" disabled={reportState === "loading"} onClick={() => refreshReport({ focus: true })}>Refresh progress</button></div>
      <p ref={statusRef} tabIndex={-1} role="status" aria-busy={reportState === "loading"}>{reportState === "loading" ? "Loading verified session progress…" : reportError || (mock ? `${STATES[mock.state]} · Last checked ${dateText(mock.server_now)}` : "Waiting for session details.")}</p>
      {mock && <><dl className="literacy-mock-metrics"><div><dt>Session</dt><dd>{STATES[mock.state]}</dd></div><div><dt>Time remaining at last check</dt><dd>{minutes(mock.remaining_seconds)}</dd></div><div><dt>Questions per student</dt><dd>{mock.item_count}</dd></div><div><dt>Students</dt><dd>{report.pupils.length}</dd></div></dl>
        {mock.state !== "completed" && <div className="literacy-mock-controls">{mock.state === "prepared" && <button className="literacy-mock-primary" type="button" disabled={controlsDisabled} onClick={() => sendControl("start")}>Start assessment</button>}{mock.state === "running" && <button type="button" disabled={controlsDisabled} onClick={() => sendControl("pause")}>Pause assessment</button>}{mock.state === "paused" && <button className="literacy-mock-primary" type="button" disabled={controlsDisabled} onClick={() => sendControl("resume")}>Resume assessment</button>}<button type="button" disabled={controlsDisabled} onClick={() => sendControl("add_time")}>Add 5 minutes</button><button type="button" disabled={controlsDisabled} onClick={() => setFinishOpen(true)}>Finish assessment</button></div>}
        <p>Progress refreshes every five seconds. A disconnected device or missing answer is not a literacy result.</p>
        <TeacherDataTable label="Mock assessment pupil progress" className="literacy-mock-table"><caption>Students in alphabetical order</caption><thead><tr><th scope="col">Student</th><th scope="col">Readiness / connection</th><th scope="col">Saved progress</th><th scope="col">Evidence</th></tr></thead><tbody>{report.pupils.map(pupil => <tr key={pupil.studentId}><th scope="row">{pupil.name}</th><td>{pupil.member.connected === true ? "Connected" : pupil.member.connected === false ? "Not currently connected" : "Connection not confirmed"}<small>{pupil.run?.status === "completed" ? "Finished" : pupil.member.content_ok === false ? "Content needs attention" : pupil.run?.status === "ready" ? "Ready to start" : pupil.run?.status === "running" ? "Working" : "Waiting for device"}</small>{pupil.member.last_seen_at && <small>Last seen {dateText(pupil.member.last_seen_at)}</small>}</td><td>{pupil.answered} answered{pupil.planned !== null ? ` of ${pupil.planned}` : ""}<small>{pupil.unsampledItems ?? "Unknown"} not reached · {pupil.totals.unscored} unscored</small>{pupil.mediaFailureCount > 0 && <small>{pupil.mediaFailureCount} media {pupil.mediaFailureCount === 1 ? "failure" : "failures"} · no answer slot used</small>}</td><td>{pupil.unsampledSkills} skills not yet sampled<button type="button" onClick={() => { setSelectedReportStudent(pupil.studentId); setTimeout(() => { reportContainer.current?.querySelector("h3")?.focus(); reportContainer.current?.scrollIntoView({ block: "start", behavior: "auto" }); }, 0); }}>View {pupil.name}’s report</button></td></tr>)}</tbody></TeacherDataTable>
        <div ref={reportContainer}><LiteracyMockReport key={sessionId} report={report} studentId={selectedReportStudent} onStudentChange={setSelectedReportStudent} /></div>
      </>}
    </section>}
    {finishOpen && <div className="literacy-mock-dialog-overlay"><TeacherDialog label="Finish this assessment?" className="literacy-mock-dialog" onClose={() => !busy && setFinishOpen(false)} closeOnEscape={!busy} busy={busy}><h3>Finish this assessment?</h3><p>This ends the mock for these students. Saved answers remain in the teacher report. Questions not reached are kept separate from errors.</p><button type="button" disabled={busy} onClick={() => sendControl("finish")}>Finish and keep the report</button><button type="button" disabled={busy} data-autofocus onClick={() => setFinishOpen(false)}>Keep working</button></TeacherDialog></div>}
  </TeacherPageShell>;
}

export function TeacherLiteracyMockPanel({ client, classId, className = "", students = [], onSessionPrepared, initialStudentIds = [] }) {
  if (!classId) return <p role="status">Choose a class to prepare a mixed literacy assessment.</p>;
  // A class switch destroys request state and prevents a prior class's rows from flashing.
  return <TeacherLiteracyMockPanelBody key={classId} {...{ client, classId, className, students, onSessionPrepared, initialStudentIds }} />;
}

export default TeacherLiteracyMockPanel;

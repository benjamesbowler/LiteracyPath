import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { prepareLiteracyMockSession, controlLiteracyMockSession, listLiteracyMockSessions, getLiteracyMockReport, resolveLiteracyMockSupport, prepareLiteracyMockFreshCheck, prepareLiteracyMockEntryCheck, LITERACY_MOCK_CONTENT_VERSION, requireLiteracyMockSuccess } from "../../data/literacyMockSessionCore.js";
import { buildLiteracyMockReport, literacyMockStudentName, literacyMockControlError } from "../../utils/literacyMockReport.js";
import { readMockTeacherPending, saveMockTeacherPending, clearMockTeacherPending } from "../../utils/literacyMockTeacherPending.js";
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
  try { return requireLiteracyMockSuccess(result); }
  catch (error) { throw Object.assign(new Error(literacyMockControlError(error.code)), { code: error.code, confirmedRejection: error.confirmedRejection }); }
}

function TeacherLiteracyMockPanelBody({ client, teacherId, classId, className, students, onSessionPrepared, initialStudentIds }) {
  const roster = useMemo(() => students.filter(student => student?.id && !student.archived_at).slice().sort((a, b) => literacyMockStudentName(a).localeCompare(literacyMockStudentName(b), "en", { sensitivity: "base" })), [students]);
  const initialHistoryStudent = initialStudentIds.length === 1 ? String(initialStudentIds[0]) : "";
  const [wholeClass, setWholeClass] = useState(!initialStudentIds.length);
  const [studentIds, setStudentIds] = useState(initialStudentIds.map(String));
  const itemCount = 43;
  const [durationMinutes, setDurationMinutes] = useState(40);
  const windowMode = "pause_at_window_end";
  const [pendingMutation, setPendingMutation] = useState(() => {
    try { return readMockTeacherPending(teacherId, classId); }
    catch (error) { return { error: error.message }; }
  });
  const pendingEvidenceAction = pendingMutation?.kind === "evidence" ? pendingMutation.args : null;
  const pendingControl = pendingMutation?.kind === "control" ? pendingMutation.args : null;
  const pendingPreparation = pendingMutation?.kind === "preparation" ? pendingMutation.args : null;
  const [history, setHistory] = useState([]);
  const [historyState, setHistoryState] = useState("loading");
  const [historyError, setHistoryError] = useState("");
  const [historyStudent, setHistoryStudent] = useState(initialStudentIds.length === 1 ? String(initialStudentIds[0]) : "");
  const [sessionId, setSessionId] = useState(pendingControl?.sessionId || pendingEvidenceAction?.sessionId || "");
  const [snapshot, setSnapshot] = useState(null);
  const [reportState, setReportState] = useState("idle");
  const [reportError, setReportError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const mutationPending = Boolean(pendingMutation);
  const [finishOpen, setFinishOpen] = useState(false);
  const [selectedReportStudent, setSelectedReportStudent] = useState(initialStudentIds.length === 1 ? String(initialStudentIds[0]) : "");
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
      const relevant = verified.filter(session => !initialHistoryStudent || session.member_student_ids?.some(id => String(id) === initialHistoryStudent));
      const active = relevant.find(session => session.mock?.state !== "completed" && session.status === "active");
      setSessionId(current => current || active?.id || relevant[0]?.id || "");
    } catch (error) {
      if (!alive.current || sequence !== historyRequest.current) return;
      setHistoryState("error"); setHistoryError(error.confirmedRejection ? error.message : "Session history could not be refreshed. Previously verified sessions for this class remain visible.");
    }
  }, [classId, client, initialHistoryStudent]);

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
  const controlsDisabled = busy || mutationPending || reportState !== "ready";

  function retainMutation(kind, args) {
    setPendingMutation(saveMockTeacherPending(teacherId, classId, kind, args));
  }
  function confirmMutation(args) {
    clearMockTeacherPending(teacherId, classId, args.requestId);
    if (alive.current) setPendingMutation(null);
  }


  async function prepare(retry = null) {
    const args = retry || { classId, wholeClass, studentIds: wholeClass ? [] : roster.filter(student => studentIds.includes(String(student.id))).map(student => student.id), durationMinutes, itemCount, windowMode, contentVersion: LITERACY_MOCK_CONTENT_VERSION, requestId: requestId() };
    let dispatched = false;
    setBusy(true); setMessage("");
    try {
      retainMutation("preparation", args);
      dispatched = true;
      const result = validResult(await boundedRequest(prepareLiteracyMockSession({ client, ...args, legacyPending: Boolean(retry) })));
      if (result.session?.class_id !== classId || !result.session?.id) throw new Error("Prepared session identity could not be verified.");
      confirmMutation(args);
      if (!alive.current) return;
      setSessionId(result.session.id);
      onSessionPrepared?.(result);
      void loadHistory();
    } catch (error) {
      if (error.confirmedRejection) confirmMutation(args);
      if (!alive.current) return;
      setMessage(error.confirmedRejection || !dispatched ? error.message : "Preparation could not be confirmed. Retry the same preparation to recover its result without creating another session.");
    } finally { if (alive.current) setBusy(false); }
  }

  async function sendControl(action, retry = null) {
    const args = retry || { sessionId, action, expectedRevision: mock?.revision, requestId: requestId() };
    let dispatched = false;
    setBusy(true); setMessage("");
    try {
      retainMutation("control", args);
      dispatched = true;
      validResult(await boundedRequest(controlLiteracyMockSession({ client, ...args })));
      confirmMutation(args);
      if (!alive.current) return;
      setFinishOpen(false);
      await refreshReport({ force: true }); void loadHistory();
      setMessage(({ start: "Assessment started.", pause: "Assessment paused; the session clock is stopped.", resume: "Assessment resumed.", add_time: "Five minutes added within the available session window.", finish: "Assessment finished. Saved answers and questions not reached remain in the report." })[args.action]);
    } catch (error) {
      if (error.confirmedRejection) confirmMutation(args);
      if (!alive.current) return;
      setMessage(error.confirmedRejection || !dispatched ? error.message : literacyMockControlError(error));
      setFinishOpen(false);
      if (error.confirmedRejection) await refreshReport({ force: true });
    } finally { if (alive.current) setBusy(false); }
  }

  async function evidenceAction(kind, studentId, questionId, assistance, retry = null, sourceSessionId = sessionId) {
    const action = retry || { kind, sessionId: sourceSessionId, sourceSessionId, studentId, questionId, skillId: kind === "entry" ? questionId : undefined, assistance, requestId: requestId() };
    let dispatched = false;
    setBusy(true); setMessage("");
    try {
      retainMutation("evidence", action);
      dispatched = true;
      const result = validResult(await boundedRequest(action.kind === "fresh" ? prepareLiteracyMockFreshCheck({ client, ...action }) : action.kind === "entry" ? prepareLiteracyMockEntryCheck({ client, ...action }) : resolveLiteracyMockSupport({ client, ...action })));
      if (["fresh", "entry"].includes(action.kind)) {
        if (result.session?.class_id !== classId || !result.session?.id) throw new Error("Prepared session identity could not be verified.");
      }
      confirmMutation(action);
      if (!alive.current) return;
      if (["fresh", "entry"].includes(action.kind)) {
        setSessionId(result.session.id); setSelectedReportStudent(action.studentId); onSessionPrepared?.(result); void loadHistory();
        setMessage(action.kind === "entry" ? "A first sample is prepared at entry level. Start it to send the check to the student. Other active assignments are preserved." : "A fresh check is prepared with new examples of the same task, level and access conditions. It pauses for a break after 10 minutes. Start it to send the check to the student; other active sessions are preserved.");
      } else {
        await refreshReport({ force: true });
        setMessage("Assistance recorded. The report now separates help with access from help with an answer.");
      }
    } catch (error) {
      if (error.confirmedRejection) confirmMutation(action);
      if (!alive.current) return;
      setMessage(error.code === "fresh_items_unavailable" ? "No genuinely fresh examples remain under these exact conditions. No session was created. Choose a different evidence check after reviewing the student’s work." : error.confirmedRejection || !dispatched ? error.message : "This action could not be confirmed. Retry the same action to recover its result.");
    } finally { if (alive.current) setBusy(false); }
  }

  return <TeacherPageShell as="section" product="literacy-mock-session" intent="assess" className="literacy-mock-teacher">
    <TeacherPageHeader eyebrow="Teacher-launched assessment" title="Mock MAP test" description={`One full test for ${className || "your class"} or selected children. Start it here and see every child’s saved results below.`} />
    <p className="literacy-mock-note">43 questions across sounds, phonics, vocabulary, listening, reading, language, print and writing. Questions adapt as children answer. Results save automatically to this class’s test history.</p>
    <details><summary>About this mock test</summary><p>Literacy Guide’s original questions prepare children for Reading K–2, with harder extensions. Results show observations and next steps, not an official MAP score. MAP Growth is untimed; a break pauses this mock so the teacher can resume the same test.</p></details>
    <details className="literacy-mock-setup" open={!sessionId}>
      <summary>Prepare a new session</summary>
      {!roster.length ? <p role="status">Add students to this class before preparing an assessment.</p> : <>
        <fieldset disabled={busy || mutationPending}><legend>Who will take part?</legend>
          <label><input type="radio" name={`mock-audience-${classId}`} checked={wholeClass} onChange={() => setWholeClass(true)} />Full class ({roster.length})</label>
          <label><input type="radio" name={`mock-audience-${classId}`} checked={!wholeClass} onChange={() => setWholeClass(false)} />Individual or selected students</label>
          {!wholeClass && <div className="literacy-mock-picker">{roster.map(student => <label key={student.id}><input type="checkbox" checked={studentIds.includes(String(student.id))} onChange={event => setStudentIds(current => event.target.checked ? [...current, String(student.id)] : current.filter(id => id !== String(student.id)))} />{literacyMockStudentName(student)}</label>)}</div>}
        </fieldset>
        <p><strong>Full mock · 43 questions</strong> — all eight literacy areas, sampling 15 skills. Each sitting uses fresh questions where available.</p>
        <details><summary>Break settings</summary><div className="literacy-mock-options"><label>Time before a break<select value={durationMinutes} disabled={busy || mutationPending} onChange={event => setDurationMinutes(Number(event.target.value))}>{[10, 20, 30, 40].map(value => <option key={value} value={value}>{value} minutes</option>)}</select></label></div><p>A break keeps every saved answer. Resume the same test when the children are ready.</p></details>
        <button type="button" className="literacy-mock-primary" disabled={!client || busy || mutationPending || selectedCount === 0} onClick={() => prepare()}>{busy && !mock ? "Preparing…" : `Prepare for ${selectedCount} ${selectedCount === 1 ? "student" : "students"}`}</button>
      </>}
    </details>
    {(message || mutationPending) && <div className="literacy-mock-notice" role="status"><p>{message || pendingMutation?.error || "An earlier action is awaiting confirmation. Retry that same action to recover its result."}</p>{pendingMutation?.error && <button type="button" onClick={() => { try { setPendingMutation(readMockTeacherPending(teacherId, classId)); } catch (error) { setPendingMutation({ error: error.message }); } }}>Reload retry details</button>}{pendingEvidenceAction && <button type="button" disabled={busy} onClick={() => evidenceAction(null, null, null, null, pendingEvidenceAction)}>Retry the same evidence action</button>}{pendingControl && <button type="button" disabled={busy} onClick={() => sendControl(pendingControl.action, pendingControl)}>Retry the same action</button>}{pendingPreparation && <button type="button" disabled={busy} onClick={() => prepare(pendingPreparation)}>Retry the same preparation</button>}</div>}
    <section className="literacy-mock-history"><h3>Saved test results</h3><p>The 20 most recent sessions for this class.</p><TeacherFilterBar label="Mock session history filters"><label>Students<select value={historyStudent} onChange={event => setHistoryStudent(event.target.value)}><option value="">All students in this class</option>{roster.map(student => <option key={student.id} value={student.id}>{literacyMockStudentName(student)}</option>)}</select></label><button type="button" disabled={historyState === "loading"} onClick={() => loadHistory()}>Refresh history</button></TeacherFilterBar>
      {historyState === "loading" && <p role="status" aria-busy="true">Loading session history…</p>}
      {historyError && <p role="status">{historyError}</p>}
      {filteredHistory.length ? <label>Open a session<select value={filteredHistory.some(session => session.id === sessionId) ? sessionId : ""} disabled={busy || mutationPending} onChange={event => { setSessionId(event.target.value); setSelectedReportStudent(""); setMessage(""); }}><option value="">Choose a session</option>{filteredHistory.map(session => <option key={session.id} value={session.id}>{dateText(session.mock?.started_at || session.started_at)} · {session.mock?.item_count || ""} questions · {STATES[session.mock?.state] || "State unavailable"}</option>)}</select></label> : historyState === "ready" && <p>No matching sessions in this recent history{historyStudent ? " for this student" : ""}.</p>}
    </section>
    {sessionId && <section className="literacy-mock-live" aria-label="Teacher session controls">
      <div className="literacy-mock-live-heading"><h3 ref={reportHeading} tabIndex={-1}>Session desk</h3><button type="button" disabled={reportState === "loading"} onClick={() => refreshReport({ focus: true })}>Refresh progress</button></div>
      <p ref={statusRef} tabIndex={-1} role="status" aria-busy={reportState === "loading"}>{reportState === "loading" ? "Loading verified session progress…" : reportError || (mock ? `${STATES[mock.state]} · Last checked ${dateText(mock.server_now)}` : "Waiting for session details.")}</p>
      {mock && <><dl className="literacy-mock-metrics"><div><dt>Session</dt><dd>{STATES[mock.state]}</dd></div>{mock.state !== "completed" && <div><dt>Time remaining at last check</dt><dd>{minutes(mock.remaining_seconds)}</dd></div>}<div><dt>Questions per student</dt><dd>{mock.item_count}</dd></div><div><dt>Students</dt><dd>{report.pupils.length}</dd></div></dl>
        {mock.state !== "completed" && <div className="literacy-mock-controls">{mock.state === "prepared" && <button className="literacy-mock-primary" type="button" disabled={controlsDisabled} onClick={() => sendControl("start")}>Start assessment</button>}{mock.state === "running" && <button type="button" disabled={controlsDisabled} onClick={() => sendControl("pause")}>Pause assessment</button>}{mock.state === "paused" && <button className="literacy-mock-primary" type="button" disabled={controlsDisabled} onClick={() => sendControl("resume")}>Resume assessment</button>}<button type="button" disabled={controlsDisabled} onClick={() => sendControl("add_time")}>Add 5 minutes</button><button type="button" disabled={controlsDisabled} onClick={() => setFinishOpen(true)}>Finish assessment</button></div>}
        {mock.state !== "completed" && <p>{mock.window_mode === "pause_at_window_end" ? "This session pauses for a break at the window end. Resume to continue." : "This session finishes when its time limit is reached."}</p>}
        {mock.capabilities?.supportResolution && report.pupils.some(pupil => pupil.pendingHelpRequests?.length) && <section className="literacy-mock-help-desk" aria-label="Help requests"><h4>Students asking for help</h4><p>Record what you actually provided. Reading a protected reading item or suggesting an answer counts as answer assistance.</p>{report.pupils.flatMap(pupil => (pupil.pendingHelpRequests || []).map(request => <div key={`${pupil.studentId}:${request.questionId}`}><strong>{pupil.name}</strong><p>{request.itemSnapshot?.prompt || "Help requested on the current question"}</p><button type="button" disabled={controlsDisabled} onClick={() => evidenceAction("support", pupil.studentId, request.questionId, "none")}>No assistance needed</button><button type="button" disabled={controlsDisabled} onClick={() => evidenceAction("support", pupil.studentId, request.questionId, "access")}>Controls or access only</button><button type="button" disabled={controlsDisabled} onClick={() => evidenceAction("support", pupil.studentId, request.questionId, "answer")}>Help with the answer</button></div>))}</section>}
        <p>{mock.state === "prepared" && "This check is prepared but has not been sent to devices. Start it to let students check sound and practise any new controls. "}Progress refreshes every five seconds. A disconnected device or missing answer is not a literacy result.</p>
        <p role="status">{report.pupils.filter(pupil => pupil.run?.status === "completed").length} of {report.pupils.length} children finished. Open a child’s report to see what went well and what to practise next.</p>
        <TeacherDataTable label="Mock assessment pupil progress" className="literacy-mock-table"><caption>Students in alphabetical order</caption><thead><tr><th scope="col">Student</th><th scope="col">Readiness / connection</th><th scope="col">Saved progress</th><th scope="col">Report</th></tr></thead><tbody>{report.pupils.map(pupil => <tr key={pupil.studentId}><th scope="row">{pupil.name}</th><td>{pupil.member.connected === true ? "Connected" : pupil.member.connected === false ? "Not currently connected" : "Connection not confirmed"}<small>{pupil.run?.status === "completed" ? "Finished · report received" : pupil.member.content_ok === false ? "Content needs attention" : pupil.run?.status === "ready" ? "Sound and controls checked" : pupil.run?.status === "running" ? "Working" : mock.state === "prepared" ? "Not sent to device yet" : "Sound and button checks / waiting for device"}</small>{pupil.member.last_seen_at && <small>Last seen {dateText(pupil.member.last_seen_at)}</small>}</td><td>{pupil.answered} answered{pupil.planned !== null ? ` of ${pupil.planned}` : ""}<small>{pupil.notReachedItems ?? "Unknown"} not reached · {pupil.presentedUnansweredItems ?? "Unknown"} seen without an answer · {pupil.totals.unscored} unscored</small>{pupil.mediaFailureCount > 0 && <small>{pupil.mediaFailureCount} media {pupil.mediaFailureCount === 1 ? "failure" : "failures"} · no answer slot used</small>}</td><td><button type="button" onClick={() => { setSelectedReportStudent(pupil.studentId); setTimeout(() => { reportContainer.current?.querySelector("h3")?.focus(); reportContainer.current?.scrollIntoView({ block: "start", behavior: "auto" }); }, 0); }}>View {pupil.name}’s report</button></td></tr>)}</tbody></TeacherDataTable>
        <div ref={reportContainer}><LiteracyMockReport key={sessionId} report={report} studentId={selectedReportStudent} onStudentChange={setSelectedReportStudent} actionDisabled={controlsDisabled} onRecordAssistance={mock.capabilities?.supportResolution ? (studentId, questionId, assistance, sourceId) => evidenceAction("support", studentId, questionId, assistance, null, sourceId || sessionId) : undefined} /></div>
      </>}
    </section>}
    {finishOpen && <div className="literacy-mock-dialog-overlay"><TeacherDialog label="Finish this assessment?" className="literacy-mock-dialog" onClose={() => !busy && setFinishOpen(false)} closeOnEscape={!busy} busy={busy}><h3>Finish this assessment?</h3><p>This ends the mock for these students. Saved answers remain in the teacher report. Questions not reached are kept separate from errors.</p><button type="button" disabled={busy} onClick={() => sendControl("finish")}>Finish and keep the report</button><button type="button" disabled={busy} data-autofocus onClick={() => setFinishOpen(false)}>Keep working</button></TeacherDialog></div>}
  </TeacherPageShell>;
}

export function TeacherLiteracyMockPanel({ client, teacherId, classId, className = "", students = [], onSessionPrepared, initialStudentIds = [] }) {
  if (!classId) return <p role="status">Choose a class to prepare a Mock MAP test.</p>;
  // Remount visible state on a teacher/class switch; durable retries stay scoped.
  return <TeacherLiteracyMockPanelBody key={`${teacherId}:${classId}`} {...{ client, teacherId, classId, className, students, onSessionPrepared, initialStudentIds }} />;
}

export default TeacherLiteracyMockPanel;

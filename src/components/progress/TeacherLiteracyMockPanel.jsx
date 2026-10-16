import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { prepareLiteracyMockSession, controlLiteracyMockSession, listLiteracyMockHistoryPage, getLiteracyMockReport, resolveLiteracyMockSupport, prepareLiteracyMockFreshCheck, prepareLiteracyMockEntryCheck, LITERACY_MOCK_CONTENT_VERSION, requireLiteracyMockSuccess } from "../../data/literacyMockSessionCore.js";
import { buildLiteracyMockReport, literacyMockStudentName, literacyMockControlError } from "../../utils/literacyMockReport.js";
import { readMockTeacherPending, saveMockTeacherPending, clearMockTeacherPending } from "../../utils/literacyMockTeacherPending.js";
import { literacyMockCollectionNotice } from "../../utils/literacyMockCollectionNotice.js";
import { TeacherPageShell, TeacherPageHeader, TeacherDataTable, TeacherFilterBar } from "../teacher/ui/TeacherPrimitives.jsx";
import { TeacherDialog } from "../teacher/ui/TeacherDialog.jsx";
import { TeacherSessionFrame } from "../teacher/sessions/TeacherSessionFrame.jsx";
import { teacherSessionModel } from "../../utils/teacherSessionModel.js";
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

function TeacherLiteracyMockPanelBody({ client, teacherId, classId, className, students, onSessionPrepared, initialStudentIds, initialSessionId, initialReportStudentId, initialPhase, onReturn, returnLabel }) {
  const roster = useMemo(() => students.filter(student => student?.id && !student.archived_at).slice().sort((a, b) => literacyMockStudentName(a).localeCompare(literacyMockStudentName(b), "en", { sensitivity: "base" })), [students]);
  const initialHistoryStudent = initialReportStudentId || (initialStudentIds.length === 1 ? String(initialStudentIds[0]) : "");
  const [wholeClass, setWholeClass] = useState(!initialStudentIds.length);
  const [studentIds, setStudentIds] = useState(initialStudentIds.map(String));
  const itemCount = 67;
  const durationMinutes = 40;
  const windowMode = "untimed";
  const [pendingMutation, setPendingMutation] = useState(() => {
    try { return readMockTeacherPending(teacherId, classId); }
    catch (error) { return { error: error.message }; }
  });
  const pendingEvidenceAction = pendingMutation?.kind === "evidence" ? pendingMutation.args : null;
  const pendingControl = pendingMutation?.kind === "control" ? pendingMutation.args : null;
  const pendingPreparation = pendingMutation?.kind === "preparation" ? pendingMutation.args : null;
  const [phase, setPhase] = useState(initialPhase || (initialSessionId ? "results" : "prepare"));
  const [setupOpen, setSetupOpen] = useState(initialPhase === "prepare" || (!initialPhase && !initialSessionId));
  const [previousInitialPhase, setPreviousInitialPhase] = useState(initialPhase);
  if (previousInitialPhase !== initialPhase) {
    setPreviousInitialPhase(initialPhase);
    // Route navigation changes the visible stage without remounting the
    // verified session or discarding a pending control's receipt identity.
    if (["prepare", "live", "results"].includes(initialPhase)) setPhase(initialPhase);
    if (initialPhase === "prepare") setSetupOpen(true);
  }
  const [historyCursor, setHistoryCursor] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyState, setHistoryState] = useState("loading");
  const [historyError, setHistoryError] = useState("");
  const [historyStudent, setHistoryStudent] = useState(initialHistoryStudent);
  const [sessionId, setSessionId] = useState(initialSessionId || pendingControl?.sessionId || pendingEvidenceAction?.sessionId || "");
  const [snapshot, setSnapshot] = useState(null);
  const [reportState, setReportState] = useState("idle");
  const [reportError, setReportError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const mutationPending = Boolean(pendingMutation);
  const [finishOpen, setFinishOpen] = useState(false);
  const [selectedReportStudent, setSelectedReportStudent] = useState(initialReportStudentId || initialHistoryStudent);
  const alive = useRef(true);
  const reportRequest = useRef({ sequence: 0, pending: null });
  const historyRequest = useRef(0);
  const reportHeading = useRef(null);
  const statusRef = useRef(null);
  const reportContainer = useRef(null);

  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const loadHistory = useCallback(async (cursor = null) => {
    const sequence = ++historyRequest.current;
    setHistoryState("loading"); setHistoryError("");
    try {
      const result = await boundedRequest(listLiteracyMockHistoryPage({ client, classId, studentId: historyStudent || null, cursor }));
      if (!Array.isArray(result.sessions)) throw new Error("Session history was incomplete.");
      if (!alive.current || sequence !== historyRequest.current) return;
      const verified = result.sessions.filter(session => session.class_id === classId);
      setHistory(current => cursor ? [...new Map([...current, ...verified].map(row => [row.id, row])).values()] : verified); setHistoryCursor(result.nextCursor); setHistoryState("ready");
      const active = verified.find(session => session.mock?.state !== "completed" && session.status === "active");
      setSessionId(current => current || active?.id || verified[0]?.id || "");
    } catch (error) {
      if (!alive.current || sequence !== historyRequest.current) return;
      setHistoryState("error"); setHistoryError(error.confirmedRejection ? error.message : "Session history could not be refreshed. Previously verified sessions for this class remain visible.");
    }
  }, [classId, client, historyStudent]);

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
  const sessionModel = teacherSessionModel({ protocol: "mock", session: verifiedSnapshot?.session, connection: reportState === "ready" ? "connected" : "reconnecting" });
  const activePhase = phase;
  const livePupils = report?.pupils.slice().sort((a, b) => {
    const priority = pupil => pupil.pendingHelpRequests?.length || pupil.member.content_ok === false ? 0 : pupil.member.connected === false && pupil.run?.status !== "completed" ? 1 : pupil.run?.status === "completed" ? 3 : 2;
    return priority(a) - priority(b);
  }) || [];
  const controlsDisabled = busy || mutationPending || reportState !== "ready";
  const noticeText = literacyMockCollectionNotice(message, { sessionId, classId, snapshot: verifiedSnapshot, report, reportState });

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
      if (retry && initialSessionId && initialSessionId !== result.session.id) {
        setMessage("The earlier preparation is confirmed. Its session is available in saved test results; the requested report remains open.");
      } else {
        setSessionId(result.session.id); setPhase("prepare"); setSetupOpen(false);
        onSessionPrepared?.(result);
      }
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
      const controlled = validResult(await boundedRequest(controlLiteracyMockSession({ client, ...args })));
      confirmMutation(args);
      if (!alive.current) return;
      setFinishOpen(false);
      const controlsRequestedSession = args.sessionId === sessionId;
      if (controlsRequestedSession) setPhase(controlled.session?.mock?.state === "completed" ? "results" : "live");
      await refreshReport({ force: true }); void loadHistory();
      setMessage(!controlsRequestedSession ? "The earlier session action is confirmed. The requested report remains open." : args.action === "collect"
        ? { kind: "collection", sessionId: args.sessionId, collectionId: controlled.session?.mock?.collection_id || args.requestId }
        : ({ start: "Assessment started.", pause: "Assessment paused.", resume: "Assessment resumed.", add_time: "Five minutes added within the available session window.", finish: "Assessment finished. Saved answers and questions not reached remain in the report.", live_on: "Live updates enabled. Answers still save on each iPad first.", live_off: "Live updates switched off. Answers will be collected when students finish or you collect the class." })[args.action]);
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
        if (retry && initialSessionId && action.sessionId !== initialSessionId) {
          setMessage("The earlier evidence action is confirmed. Its session is available in saved test results; the requested report remains open.");
        } else {
          setSessionId(result.session.id); setPhase("prepare"); setSetupOpen(false); setSelectedReportStudent(action.studentId); onSessionPrepared?.(result);
          setMessage(action.kind === "entry" ? "A first sample is prepared at entry level. Start it to send the check to the student. Other active assignments are preserved." : "A fresh check is prepared with new examples of the same task, level and access conditions. It pauses for a break after 10 minutes. Start it to send the check to the student; other active sessions are preserved.");
        }
        void loadHistory();
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
    <TeacherPageHeader eyebrow="Teacher-launched assessment" title="Adaptive Literacy Test" description={`One full test for ${className || "your class"} or selected children. Start it here and see every child’s saved results below.`} />
    <p className="literacy-mock-note">All eight literacy areas, starting with the simplest tasks. The number of questions adapts to gather repeated observations, up to 67. Results save automatically to this class’s test history.</p>
    <details><summary>About this test</summary><p>An independent Literacy Guide assessment with original questions for MAP-style Reading K–2 preparation and harder extensions. Literacy Guide is not affiliated with or endorsed by NWEA. Results describe classroom observations and do not provide official MAP scores or score predictions. This test has no time limit; a break pauses it so the teacher can resume the same sitting.</p></details>
    <TeacherSessionFrame protocol="mock" phase={activePhase} availablePhases={sessionId ? ["prepare", "live", "results"] : ["prepare", "results"]} onPhaseChange={nextPhase => { setPhase(nextPhase); if (nextPhase === "prepare") setSetupOpen(true); }} audience={`${report?.pupils.length ?? selectedCount} students`} students={report?.pupils.map(pupil => ({ id: pupil.studentId, name: pupil.name })) || roster.filter(student => wholeClass || studentIds.includes(String(student.id)))} onReturn={onReturn} returnLabel={returnLabel}>
    {activePhase === "prepare" && <details className="literacy-mock-setup" open={setupOpen} onToggle={event => setSetupOpen(event.currentTarget.open)}>
      <summary>Prepare a new session</summary>
      {!roster.length ? <p role="status">Add students to this class before preparing an assessment.</p> : <>
        <fieldset disabled={busy || mutationPending}><legend>Who will take part?</legend>
          <label><input type="radio" name={`mock-audience-${classId}`} checked={wholeClass} onChange={() => setWholeClass(true)} />Full class ({roster.length})</label>
          <label><input type="radio" name={`mock-audience-${classId}`} checked={!wholeClass} onChange={() => setWholeClass(false)} />Individual or selected students</label>
          {!wholeClass && <div className="literacy-mock-picker">{roster.map(student => <label key={student.id}><input type="checkbox" checked={studentIds.includes(String(student.id))} onChange={event => setStudentIds(current => event.target.checked ? [...current, String(student.id)] : current.filter(id => id !== String(student.id)))} />{literacyMockStudentName(student)}</label>)}</div>}
        </fieldset>
        <p><strong>Full adaptive test · up to 67 questions</strong> — all eight literacy areas. Each area starts with the simplest tasks, then becomes easier or harder from that child’s independent answers. Repeated observations can finish an area early. Each sitting uses fresh questions where available.</p>
        <p>No time limit. Use Pause assessment for a break, then Resume assessment when the children are ready. Every saved answer stays in the same sitting.</p>
        <button type="button" className="literacy-mock-primary" disabled={!client || busy || mutationPending || selectedCount === 0} onClick={() => prepare()}>{busy && !mock ? "Preparing…" : `Prepare for ${selectedCount} ${selectedCount === 1 ? "student" : "students"}`}</button>
      </>}
    </details>}
    {(noticeText || mutationPending) && <div className="literacy-mock-notice" role="status"><p>{noticeText || pendingMutation?.error || "An earlier action is awaiting confirmation. Retry that same action to recover its result."}</p>{pendingMutation?.error && <button type="button" onClick={() => { try { setPendingMutation(readMockTeacherPending(teacherId, classId)); } catch (error) { setPendingMutation({ error: error.message }); } }}>Reload retry details</button>}{pendingEvidenceAction && <button type="button" disabled={busy} onClick={() => evidenceAction(null, null, null, null, pendingEvidenceAction)}>Retry the same evidence action</button>}{pendingControl && <button type="button" disabled={busy} onClick={() => sendControl(pendingControl.action, pendingControl)}>Retry the same action</button>}{pendingPreparation && <button type="button" disabled={busy} onClick={() => prepare(pendingPreparation)}>Retry the same preparation</button>}</div>}
    {activePhase === "results" && <section className="literacy-mock-history"><h3>Saved test results</h3><p>Browse all saved sessions. History shows the last stored state; open a session to check its current status.</p><TeacherFilterBar label="Mock session history filters"><label>Students<select value={historyStudent} onChange={event => setHistoryStudent(event.target.value)}><option value="">All students in this class</option>{historyStudent && !roster.some(student => String(student.id) === String(historyStudent)) && <option value={historyStudent}>Selected historical student</option>}{roster.map(student => <option key={student.id} value={student.id}>{literacyMockStudentName(student)}</option>)}</select></label><button type="button" disabled={historyState === "loading"} onClick={() => loadHistory()}>Refresh history</button></TeacherFilterBar>
      {historyState === "loading" && <p role="status" aria-busy="true">Loading session history…</p>}
      {historyError && <p role="status">{historyError}</p>}
      {filteredHistory.length ? <label>Open a session<select value={filteredHistory.some(session => session.id === sessionId) ? sessionId : ""} disabled={busy || mutationPending} onChange={event => { setSessionId(event.target.value); setPhase("results"); setSelectedReportStudent(historyStudent); setMessage(""); }}><option value="">Choose a session</option>{filteredHistory.map(session => <option key={session.id} value={session.id}>{dateText(session.mock?.started_at || session.started_at)} · {session.mock?.item_count || ""} questions · {STATES[session.mock?.state] || "State unavailable"}</option>)}</select></label> : historyState === "ready" && <p>No matching saved sessions{historyStudent ? " for this student" : ""}.</p>}
      {historyCursor && <button type="button" disabled={historyState === "loading"} onClick={() => loadHistory(historyCursor)}>Load older sessions</button>}
    </section>}
    {sessionId && <section className="literacy-mock-live" aria-label="Teacher session controls">
      <div className="literacy-mock-live-heading"><h3 ref={reportHeading} tabIndex={-1}>{activePhase === "results" ? "Saved assessment results" : "Assessment session"}</h3><button type="button" disabled={reportState === "loading"} onClick={() => refreshReport({ focus: true })}>Refresh progress</button></div>
      <p ref={statusRef} tabIndex={-1} role="status" aria-busy={reportState === "loading"}>{reportState === "loading" ? "Loading verified session progress…" : reportError || (mock ? `${STATES[mock.state]} · Last checked ${dateText(mock.server_now)}` : "Waiting for session details.")}</p>
      {mock && <><p>{sessionModel.receiptLabel}. Ending a session does not confirm that offline answers have arrived.</p>{activePhase !== "results" && <><dl className="literacy-mock-metrics"><div><dt>Session</dt><dd>{STATES[mock.state]}</dd></div>{mock.state !== "completed" && <div><dt>{mock.window_mode === 'untimed' ? 'Time limit' : 'Time remaining at last check'}</dt><dd>{mock.window_mode === 'untimed' ? 'No time limit' : minutes(mock.remaining_seconds)}</dd></div>}<div><dt>{report.boundaryAdaptive ? "Maximum questions" : "Questions per student"}</dt><dd>{mock.item_count}</dd></div><div><dt>Students</dt><dd>{report.pupils.length}</dd></div></dl>
        {mock.state !== "completed" && <div className="literacy-mock-controls">{mock.state === "prepared" && <button className="literacy-mock-primary" type="button" disabled={controlsDisabled} onClick={() => sendControl("start")}>Start assessment</button>}{mock.state === "running" && <button type="button" disabled={controlsDisabled} onClick={() => sendControl("pause")}>Pause assessment</button>}{mock.state === "paused" && <button className="literacy-mock-primary" type="button" disabled={controlsDisabled} onClick={() => sendControl("resume")}>Resume assessment</button>}{mock.window_mode !== "untimed" && <button type="button" disabled={controlsDisabled} onClick={() => sendControl("add_time")}>Add 5 minutes</button>}<button type="button" disabled={controlsDisabled || Boolean(mock.collection_id)} onClick={() => setFinishOpen(true)}>{mock.capabilities?.offlineDelivery ? "Collect all data and finish" : "Finish assessment"}</button></div>}
        {mock.state !== "completed" && <p>{mock.window_mode === "untimed" ? "No time limit. Answers save on each iPad before the student continues." : mock.window_mode === "pause_at_window_end" ? "This session pauses for a break at the window end. Resume to continue." : "This session finishes when its time limit is reached."}</p>}
        {mock.capabilities?.offlineDelivery && mock.state !== "completed" && <div className="literacy-mock-delivery-controls"><label><input type="checkbox" checked={mock.delivery_mode === "live"} disabled={controlsDisabled || Boolean(mock.collection_id)} onChange={event => sendControl(event.target.checked ? "live_on" : "live_off")}/> Live data updates</label><p>Leave this off for poor Wi-Fi. Students keep working; their answers upload quietly when they finish or you collect the class.</p>{mock.collection_id && <p role="status">{mock.collection_pending_count} {mock.collection_pending_count === 1 ? "iPad is" : "iPads are"} waiting to deliver data. Keep those iPads open and reconnect them. The assessment will finish when all started iPads have delivered.</p>}</div>}
        {mock.capabilities?.supportResolution && report.pupils.some(pupil => pupil.pendingHelpRequests?.length) && <section className="literacy-mock-help-desk" aria-label="Help requests"><h4>Students asking for help</h4><p>Record what you actually provided. Reading a protected reading item or suggesting an answer counts as answer assistance.</p>{report.pupils.flatMap(pupil => (pupil.pendingHelpRequests || []).map(request => <div key={`${pupil.studentId}:${request.questionId}`}><strong>{pupil.name}</strong><p>{request.itemSnapshot?.prompt || "Help requested on the current question"}</p><button type="button" disabled={controlsDisabled} onClick={() => evidenceAction("support", pupil.studentId, request.questionId, "none")}>No assistance needed</button><button type="button" disabled={controlsDisabled} onClick={() => evidenceAction("support", pupil.studentId, request.questionId, "access")}>Controls or access only</button><button type="button" disabled={controlsDisabled} onClick={() => evidenceAction("support", pupil.studentId, request.questionId, "answer")}>Help with the answer</button></div>))}</section>}
        <p>{mock.state === "prepared" && "This check is prepared but has not been sent to devices. Start it to let students check sound and practise any new controls. "}Progress refreshes every five seconds. A disconnected device or missing answer is not a literacy result.</p>
        <TeacherDataTable label="Adaptive Literacy Test pupil progress" className="literacy-mock-table"><caption>Students needing help first, then connection checks, working and finished</caption><thead><tr><th scope="col">Student</th><th scope="col">Readiness / connection</th><th scope="col">Saved progress</th><th scope="col">Evidence</th></tr></thead><tbody>{livePupils.map(pupil => <tr key={pupil.studentId}><th scope="row">{pupil.name}</th><td>{pupil.member.connected === true ? "Connected" : pupil.member.connected === false ? "Not currently connected" : "Connection not confirmed"}<small>{pupil.run?.status === "completed" ? "Finished · report received" : pupil.member.content_ok === false ? "Content needs attention" : pupil.run?.status === "ready" ? "Sound and controls checked" : pupil.run?.status === "running" ? "Working" : mock.state === "prepared" ? "Not sent to device yet" : "Sound and button checks / waiting for device"}</small>{pupil.member.last_seen_at && <small>Last seen {dateText(pupil.member.last_seen_at)}</small>}</td><td>{pupil.answered} answered{pupil.planned !== null ? ` of ${pupil.planned}` : ""}<small>{pupil.notReachedItems ?? "Unknown"} not reached · {pupil.presentedUnansweredItems ?? "Unknown"} seen without an answer · {pupil.totals.unscored} unscored</small>{pupil.mediaFailureCount > 0 && <small>{pupil.mediaFailureCount} media {pupil.mediaFailureCount === 1 ? "failure" : "failures"} · no answer slot used</small>}</td><td>{pupil.unsampledSkills} skills not yet sampled<button type="button" onClick={() => { setSelectedReportStudent(pupil.studentId); setPhase("results"); setTimeout(() => { reportContainer.current?.querySelector("h3")?.focus(); reportContainer.current?.scrollIntoView({ block: "start", behavior: "auto" }); }, 0); }}>View {pupil.name}’s report</button></td></tr>)}</tbody></TeacherDataTable></>}
        {activePhase === "results" && <div ref={reportContainer}><div className="literacy-mock-controls">{report.pupils.map(pupil => <button type="button" key={pupil.studentId} onClick={() => setSelectedReportStudent(pupil.studentId)}>View {pupil.name}’s report</button>)}</div><LiteracyMockReport key={sessionId} report={report} studentId={selectedReportStudent} onStudentChange={setSelectedReportStudent} actionDisabled={controlsDisabled} onRecordAssistance={mock.capabilities?.supportResolution ? (studentId, questionId, assistance, sourceId) => evidenceAction("support", studentId, questionId, assistance, null, sourceId || sessionId) : undefined} /></div>}
        {mock.state === "completed" && activePhase !== "results" && <button type="button" onClick={() => setPhase("results")}>View saved results</button>}
      </>}
    </section>}
    </TeacherSessionFrame>
    {finishOpen && <div className="literacy-mock-dialog-overlay"><TeacherDialog label="Finish this assessment?" className="literacy-mock-dialog" onClose={() => !busy && setFinishOpen(false)} closeOnEscape={!busy} busy={busy}><h3>Finish this assessment?</h3><p>{mock?.capabilities?.offlineDelivery ? "Students stop when their iPad receives this request. Answers already saved on each iPad are collected before the session closes. Offline iPads need to reconnect with the app open." : "This ends the assessment for these students. Saved answers remain in the teacher report. Questions not reached are kept separate from errors."}</p><button type="button" disabled={busy} onClick={() => sendControl(mock?.capabilities?.offlineDelivery ? "collect" : "finish")}>{mock?.capabilities?.offlineDelivery ? "Collect all data and finish" : "Finish and keep the report"}</button><button type="button" disabled={busy} data-autofocus onClick={() => setFinishOpen(false)}>Keep working</button></TeacherDialog></div>}
  </TeacherPageShell>;
}

export function TeacherLiteracyMockPanel({ client, teacherId, classId, className = "", students = [], onSessionPrepared, initialStudentIds = [], initialSessionId = "", initialReportStudentId = "", initialPhase = "", onReturn, returnLabel = "Return to class" }) {
  if (!classId) return <p role="status">Choose a class to prepare an Adaptive Literacy Test.</p>;
  // Remount visible state on a teacher/class switch; durable retries stay scoped.
  return <TeacherLiteracyMockPanelBody key={`${teacherId}:${classId}:${initialSessionId}:${initialReportStudentId}`} {...{ client, teacherId, classId, className, students, onSessionPrepared, initialStudentIds, initialSessionId, initialReportStudentId, initialPhase, onReturn, returnLabel }} />;
}

export default TeacherLiteracyMockPanel;

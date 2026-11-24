import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LITERACY_MOCK_SHORT_ITEM_COUNTS } from '../../policy/literacyMockQuestionLimit.js';
import { LITERACY_MOCK_ADAPTIVE_VERSION, LITERACY_MOCK_BALANCED_VERSION, LITERACY_MOCK_CONTINUOUS_ROUTING } from '../../policy/literacyMockVersions.js';
import { prepareLiteracyMockSession, controlLiteracyMockSession, listLiteracyMockHistoryPage, getLiteracyMockReport, getLiteracyMockV14Availability, resolveLiteracyMockSupport, prepareLiteracyMockFreshCheck, prepareLiteracyMockEntryCheck, requireLiteracyMockSuccess } from "../../data/literacyMockSessionCore.js";
import { getLiteracyMockTeacherStatus } from "../../data/literacyMockTeacherStatus.js";
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

async function boundedRequest(request, { timeoutMs = 10000, controller } = {}) {
  let timer;
  try {
    return await Promise.race([request, new Promise((_, reject) => {
      timer = setTimeout(() => { controller?.abort(); reject(new Error("The session service did not respond in time.")); }, timeoutMs);
    })]);
  } finally { clearTimeout(timer); }
}

function validResult(result) {
  try { return requireLiteracyMockSuccess(result); }
  catch (error) { throw Object.assign(new Error(literacyMockControlError(error.code)), { code: error.code, confirmedRejection: error.confirmedRejection }); }
}

function verifySnapshot(result, sessionId, classId) {
  if (result.session?.id !== sessionId || result.session?.class_id !== classId || !Array.isArray(result.members)) {
    throw new Error("Session identity could not be verified.");
  }
  return result;
}

function liveMember(row, roster) {
  const name = literacyMockStudentName(roster.find(student => String(student.id) === String(row.student_id)));
  return { studentId: String(row.student_id), name, member: row, status: row.run_status ?? row.run?.status,
    planned: row.planned ?? row.run?.plan?.itemIds?.length ?? null,
    answered: row.answered ?? row.run?.responses?.filter(response => response.responseStatus === "answered").length ?? 0,
    mediaFailures: row.media_failures ?? row.run?.mediaFailures?.length ?? 0,
    help: row.pending_help ?? row.run?.helpRequests?.filter(request => request.pending === true) ?? [] };
}

function deviceStatus(pupil, mock) {
  const receipt = pupil.member.receipt_state;
  if (receipt === "expired") return "Upload window expired · showing answers received by the server";
  if (receipt === "awaiting_connection") return `Waiting for upload · until ${dateText(pupil.member.receipt_deadline)}`;
  if (receipt === "received" || pupil.status === "completed") return "Finished · server record available";
  if (pupil.member.content_ok === false) return "Content needs attention";
  if (pupil.status === "ready") return "Sound and controls checked";
  if (pupil.status === "running") return "Working";
  return mock.state === "prepared" ? "Not sent to device yet" : "Sound and button checks / waiting for device";
}

function TeacherLiteracyMockPanelBody({ client, teacherId, classId, className, students, onSessionPrepared, initialStudentIds, initialSessionId, initialReportStudentId, initialPhase, onReturn, returnLabel }) {
  const roster = useMemo(() => students.filter(student => student?.id && !student.archived_at).slice().sort((a, b) => literacyMockStudentName(a).localeCompare(literacyMockStudentName(b), "en", { sensitivity: "base" })), [students]);
  const initialHistoryStudent = initialReportStudentId || (initialStudentIds.length === 1 ? String(initialStudentIds[0]) : "");
  const [wholeClass, setWholeClass] = useState(!initialStudentIds.length);
  const [studentIds, setStudentIds] = useState(initialStudentIds.map(String));
  const [itemCount, setItemCount] = useState(25);
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
  const [statusSnapshot, setStatusSnapshot] = useState(null);
  const [statusState, setStatusState] = useState("idle");
  const [statusError, setStatusError] = useState("");
  const [snapshot, setSnapshot] = useState(null);
  const [reportState, setReportState] = useState("idle");
  const [reportError, setReportError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const mutationPending = Boolean(pendingMutation);
  const [finishOpen, setFinishOpen] = useState(false);
  const [selectedReportStudent, setSelectedReportStudent] = useState(initialReportStudentId || initialHistoryStudent);
  const alive = useRef(true);
  const statusRequest = useRef({ sequence: 0, pending: null });
  const confirmedStatus = useRef(null);
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

  const refreshStatus = useCallback(async ({ background = false, force = false } = {}) => {
    if (!sessionId || (background && document.hidden) || (!force && statusRequest.current.pending?.sessionId === sessionId)) return;
    const confirmed = confirmedStatus.current?.session;
    if (background && confirmed?.id === sessionId && confirmed.class_id === classId && confirmed.mock?.state === "completed"
      && (confirmed.mock.capabilities?.offlineDelivery === false || confirmed.mock.collection_pending_count === 0)) return;
    statusRequest.current.pending?.controller.abort();
    const sequence = ++statusRequest.current.sequence;
    const controller = new AbortController();
    const request = { sessionId, controller };
    statusRequest.current.pending = request;
    if (!background) setStatusState("loading");
    try {
      const data = await boundedRequest(getLiteracyMockTeacherStatus({ client, sessionId, signal: controller.signal }), { controller });
      const result = verifySnapshot(validResult(data), sessionId, classId);
      if (!alive.current || sequence !== statusRequest.current.sequence) return;
      confirmedStatus.current = result;
      setStatusSnapshot(result); setStatusState("ready"); setStatusError("");
    } catch (error) {
      if (!alive.current || sequence !== statusRequest.current.sequence) return;
      setStatusState("error");
      setStatusError(error.confirmedRejection ? error.message : "Session status could not be confirmed. The last verified rows remain visible. Refresh to use the controls.");
    } finally { if (statusRequest.current.pending === request) statusRequest.current.pending = null; }
  }, [classId, client, sessionId]);

  const refreshReport = useCallback(async ({ focus = false, force = false } = {}) => {
    if (!sessionId || (!force && reportRequest.current.pending?.sessionId === sessionId)) return;
    reportRequest.current.pending?.controller?.abort();
    const sequence = ++reportRequest.current.sequence;
    const controller = new AbortController();
    const request = { sessionId, sequence, controller };
    reportRequest.current.pending = request;
    setReportState("loading");
    try {
      // A complete report includes the canonical question evidence. On a slow
      // link it can take more than ten seconds; never abandon its body and
      // start overlapping copies that prevent any one refresh from finishing.
      const result = verifySnapshot(validResult(await boundedRequest(getLiteracyMockReport({ client, sessionId, signal: controller.signal }), { timeoutMs: 60000, controller })), sessionId, classId);
      if (!alive.current || sequence !== reportRequest.current.sequence) return;
      setSnapshot(result); setReportState("ready"); setReportError("");
      if (focus) setTimeout(() => reportHeading.current?.focus(), 0);
    } catch (error) {
      if (!alive.current || sequence !== reportRequest.current.sequence) return;
      setReportState("error"); setReportError(error.confirmedRejection ? error.message : "Detailed results could not be refreshed. You can still use live controls.");
    } finally { if (reportRequest.current.pending === request) reportRequest.current.pending = null; }
  }, [classId, client, sessionId]);

  useEffect(() => {
    if (!sessionId) return undefined;
    const counter = statusRequest.current;
    const first = setTimeout(() => { void refreshStatus(); }, 0);
    const timer = setInterval(() => { void refreshStatus({ background: true }); }, 5000);
    const wake = () => { if (!document.hidden) void refreshStatus({ background: true }); };
    document.addEventListener("visibilitychange", wake);
    window.addEventListener("online", wake);
    return () => {
      clearTimeout(first); clearInterval(timer); counter.sequence++;
      counter.pending?.controller?.abort(); counter.pending = null;
      document.removeEventListener("visibilitychange", wake);
      window.removeEventListener("online", wake);
    };
  }, [refreshStatus, sessionId]);

  useEffect(() => {
    if (!sessionId || phase !== "results") return undefined;
    const counter = reportRequest.current;
    const timer = setTimeout(() => { void refreshReport(); }, 0);
    return () => {
      clearTimeout(timer); counter.sequence++;
      counter.pending?.controller?.abort(); counter.pending = null;
    };
  }, [phase, refreshReport, sessionId]);

  const verifiedStatus = statusSnapshot?.session?.id === sessionId && statusSnapshot.session.class_id === classId ? statusSnapshot : null;
  const verifiedSnapshot = snapshot?.session?.id === sessionId && snapshot.session.class_id === classId ? snapshot : null;
  const report = useMemo(() => verifiedSnapshot ? buildLiteracyMockReport(verifiedSnapshot, { students: roster }) : null, [verifiedSnapshot, roster]);
  const receiptStates = useMemo(() => new Map(verifiedStatus?.members.map(member => [String(member.student_id), member.receipt_state])), [verifiedStatus]);
  const mock = verifiedStatus?.session?.mock;
  const filteredHistory = history.filter(session => !historyStudent || session.member_student_ids?.some(id => String(id) === historyStudent));
  const selectedCount = wholeClass ? roster.length : roster.filter(student => studentIds.includes(String(student.id))).length;
  const sessionModel = teacherSessionModel({ protocol: "mock", session: verifiedStatus?.session, connection: statusState === "ready" ? "connected" : "reconnecting" });
  const activePhase = phase;
  const livePupils = useMemo(() => (verifiedStatus?.members ?? []).map(row => liveMember(row, roster)).sort((a, b) => {
    const priority = pupil => pupil.help.length || pupil.member.content_ok === false ? 0 : pupil.member.connected === false && pupil.status !== "completed" ? 1 : pupil.status === "completed" ? 3 : 2;
    return priority(a) - priority(b) || a.name.localeCompare(b.name);
  }), [verifiedStatus, roster]);
  const controlsDisabled = busy || mutationPending || statusState !== "ready";
  const noticeText = literacyMockCollectionNotice(message, { sessionId, classId, snapshot: verifiedStatus, report, reportState: statusState });

  function retainMutation(kind, args) {
    setPendingMutation(saveMockTeacherPending(teacherId, classId, kind, args));
  }
  function confirmMutation(args) {
    clearMockTeacherPending(teacherId, classId, args.requestId);
    if (alive.current) setPendingMutation(null);
  }


  async function prepare(retry = null) {
    let args = retry;
    let dispatched = false;
    setBusy(true); setMessage("");
    try {
      if (!args) {
        if (!await boundedRequest(getLiteracyMockV14Availability({ client }))) throw new Error("The adaptive question catalogue is unavailable. Try preparing the test again shortly.");
        args = { classId, wholeClass, studentIds: wholeClass ? [] : roster.filter(student => studentIds.includes(String(student.id))).map(student => student.id), durationMinutes, itemCount, windowMode, contentVersion: LITERACY_MOCK_ADAPTIVE_VERSION, routingPolicy: LITERACY_MOCK_CONTINUOUS_ROUTING, requestId: requestId() };
      }
      retainMutation("preparation", args);
      dispatched = true;
      const result = validResult(await boundedRequest(prepareLiteracyMockSession({ client, ...args, legacyPending: Boolean(retry) })));
      if (result.session?.class_id !== classId || !result.session?.id) throw new Error("Prepared session identity could not be verified.");
      if (args.routingPolicy && result.session.mock?.routing_policy !== args.routingPolicy) throw new Error("Prepared routing policy could not be verified.");
      confirmMutation(args);
      if (!alive.current) return;
      if (retry && initialSessionId && initialSessionId !== result.session.id) {
        setMessage("The earlier preparation is confirmed. Its session is available in saved test results; the requested report remains open.");
      } else {
        setSessionId(result.session.id); setPhase("prepare"); setSetupOpen(false);
        onSessionPrepared?.(result);
        const routing = args.routingPolicy === LITERACY_MOCK_CONTINUOUS_ROUTING
          ? "The test starts at Starter and adjusts across areas with each independent answer."
          : args.contentVersion === LITERACY_MOCK_ADAPTIVE_VERSION
          ? "Each area starts at Starter. The next question in that area gets harder or easier after an independent answer."
          : args.contentVersion === LITERACY_MOCK_BALANCED_VERSION
          ? args.itemCount === 15 ? "Expect one or two First steps questions per area."
            : args.itemCount === 25 ? "Most questions establish starting evidence, with room to sample Starter."
              : "Successful areas can reach Starter with room for follow-up observations."
          : "This session uses the earlier version. The selected question limit still applies, and shorter sittings may sample fewer areas.";
        setMessage(`Session prepared. ${routing}`);
      }
      void loadHistory();
    } catch (error) {
      if (dispatched && error.confirmedRejection) confirmMutation(args);
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
      await refreshStatus({ force: true }); void loadHistory();
      setMessage(!controlsRequestedSession ? "The earlier session action is confirmed. The requested report remains open." : args.action === "collect"
        ? { kind: "collection", sessionId: args.sessionId, collectionId: controlled.session?.mock?.collection_id || args.requestId }
        : ({ start: "Assessment started.", pause: "Assessment paused.", resume: "Assessment resumed.", add_time: "Five minutes added within the available session window.", finish: "Assessment finished. Saved answers and questions not reached remain in the report.", live_on: "Live updates enabled. Answers still save on each iPad first.", live_off: "Live updates switched off. Answers will be collected when students finish or you collect the class." })[args.action]);
    } catch (error) {
      if (error.confirmedRejection) confirmMutation(args);
      if (!alive.current) return;
      setMessage(error.confirmedRejection || !dispatched ? error.message : literacyMockControlError(error));
      setFinishOpen(false);
      if (error.confirmedRejection) await refreshStatus({ force: true });
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
        await refreshStatus({ force: true });
        if (phase === "results") await refreshReport({ force: true });
        setMessage("Assistance recorded. The report now separates help with access from help with an answer.");
      }
    } catch (error) {
      if (error.confirmedRejection) confirmMutation(action);
      if (!alive.current) return;
      setMessage(error.code === "fresh_items_unavailable" ? "No genuinely fresh examples remain under these exact conditions. No session was created. Choose a different evidence check after reviewing the student’s work." : error.confirmedRejection || !dispatched ? error.message : "This action could not be confirmed. Retry the same action to recover its result.");
    } finally { if (alive.current) setBusy(false); }
  }

  return <TeacherPageShell as="section" product="literacy-mock-session" intent="assess" className="literacy-mock-teacher">
    <TeacherPageHeader eyebrow="Teacher-launched assessment" title="Adaptive Literacy Test" description={`Prepare a test for ${className || "your class"} or selected children. Start it here and see every child’s saved results below.`} />
    <p className="literacy-mock-note">Choose 15, 25 or 40 questions. Results save automatically to this class’s test history.</p>
    <details><summary>About this test</summary><p>An independent Literacy Guide assessment with original questions for MAP-style Reading K–2 preparation and harder extensions. Literacy Guide is not affiliated with or endorsed by NWEA. Results describe classroom observations and do not provide official MAP scores or score predictions. This test has no time limit; a break pauses it so the teacher can resume the same sitting.</p></details>
    <TeacherSessionFrame protocol="mock" phase={activePhase} availablePhases={sessionId ? ["prepare", "live", "results"] : ["prepare", "results"]} onPhaseChange={nextPhase => { setPhase(nextPhase); if (nextPhase === "prepare") setSetupOpen(true); }} audience={`${verifiedStatus ? livePupils.length : selectedCount} students`} students={verifiedStatus ? livePupils.map(pupil => ({ id: pupil.studentId, name: pupil.name })) : roster.filter(student => wholeClass || studentIds.includes(String(student.id)))} onReturn={onReturn} returnLabel={returnLabel}>
    {activePhase === "prepare" && <details className="literacy-mock-setup" open={setupOpen} onToggle={event => setSetupOpen(event.currentTarget.open)}>
      <summary>Prepare a new session</summary>
      {!roster.length ? <p role="status">Add students to this class before preparing an assessment.</p> : <>
        <fieldset disabled={busy || mutationPending}><legend>Who will take part?</legend>
          <label><input type="radio" name={`mock-audience-${classId}`} checked={wholeClass} onChange={() => setWholeClass(true)} />Full class ({roster.length})</label>
          <label><input type="radio" name={`mock-audience-${classId}`} checked={!wholeClass} onChange={() => setWholeClass(false)} />Individual or selected students</label>
          {!wholeClass && <div className="literacy-mock-picker">{roster.map(student => <label key={student.id}><input type="checkbox" checked={studentIds.includes(String(student.id))} onChange={event => setStudentIds(current => event.target.checked ? [...current, String(student.id)] : current.filter(id => id !== String(student.id)))} />{literacyMockStudentName(student)}</label>)}</div>}
        </fieldset>
        <label>Questions<select aria-label="Questions" value={itemCount} disabled={busy || mutationPending} onChange={event => setItemCount(Number(event.target.value))}>{LITERACY_MOCK_SHORT_ITEM_COUNTS.map(value => <option key={value} value={value}>Up to {value} questions</option>)}</select></label>
        <p><strong>Adaptive test · up to {itemCount} questions</strong> — tasks adjust based on each child’s independent answers. Each sitting uses fresh questions where available. Short sittings leave some areas with limited evidence.</p>
        <p>No time limit. Use Pause assessment for a break, then Resume assessment when the children are ready. Every saved answer stays in the same sitting.</p>
        <button type="button" className="literacy-mock-primary" disabled={!client || busy || mutationPending || selectedCount === 0} onClick={() => prepare()}>{busy && !mock ? "Preparing…" : `Prepare for ${selectedCount} ${selectedCount === 1 ? "student" : "students"}`}</button>
      </>}
    </details>}
    {(noticeText || mutationPending) && <div className="literacy-mock-notice" role="status" aria-busy={busy || undefined}><p>{noticeText || (busy ? "Waiting for this action to finish…" : pendingMutation?.error || "An earlier action is awaiting confirmation. Retry that same action to recover its result.")}</p>{!busy && pendingMutation?.error && <button type="button" onClick={() => { try { setPendingMutation(readMockTeacherPending(teacherId, classId)); } catch (error) { setPendingMutation({ error: error.message }); } }}>Reload retry details</button>}{!busy && pendingEvidenceAction && <button type="button" disabled={busy} onClick={() => evidenceAction(null, null, null, null, pendingEvidenceAction)}>Retry the same evidence action</button>}{!busy && pendingControl && <button type="button" disabled={busy} onClick={() => sendControl(pendingControl.action, pendingControl)}>Retry the same action</button>}{!busy && pendingPreparation && <button type="button" disabled={busy} onClick={() => prepare(pendingPreparation)}>Retry the same preparation</button>}</div>}
    {activePhase === "results" && <section className="literacy-mock-history"><h3>Saved test results</h3><p>Browse all saved sessions. History shows the last stored state; open a session to check its current status.</p><TeacherFilterBar label="Mock session history filters"><label>Students<select value={historyStudent} onChange={event => setHistoryStudent(event.target.value)}><option value="">All students in this class</option>{historyStudent && !roster.some(student => String(student.id) === String(historyStudent)) && <option value={historyStudent}>Selected historical student</option>}{roster.map(student => <option key={student.id} value={student.id}>{literacyMockStudentName(student)}</option>)}</select></label><button type="button" disabled={historyState === "loading"} onClick={() => loadHistory()}>Refresh history</button></TeacherFilterBar>
      {historyState === "loading" && <p role="status" aria-busy="true">Loading session history…</p>}
      {historyError && <p role="status">{historyError}</p>}
      {filteredHistory.length ? <label>Open a session<select value={filteredHistory.some(session => session.id === sessionId) ? sessionId : ""} disabled={busy || mutationPending} onChange={event => { setSessionId(event.target.value); setPhase("results"); setSelectedReportStudent(historyStudent); setMessage(""); }}><option value="">Choose a session</option>{filteredHistory.map(session => <option key={session.id} value={session.id}>{dateText(session.mock?.started_at || session.started_at)} · {session.mock?.item_count ? `up to ${session.mock.item_count} questions` : "Question maximum not recorded"} · {STATES[session.mock?.state] || "State unavailable"}</option>)}</select></label> : historyState === "ready" && <p>No matching saved sessions{historyStudent ? " for this student" : ""}.</p>}
      {historyCursor && <button type="button" disabled={historyState === "loading"} onClick={() => loadHistory(historyCursor)}>Load older sessions</button>}
    </section>}
    {sessionId && <section className="literacy-mock-live" aria-label="Teacher session controls">
      <div className="literacy-mock-live-heading"><h3 ref={reportHeading} tabIndex={-1}>{activePhase === "results" ? "Saved assessment results" : "Assessment session"}</h3><button type="button" disabled={statusState === "loading"} onClick={() => { statusRef.current?.focus(); void refreshStatus({ force: true }); if (activePhase === "results") void refreshReport({ focus: true, force: true }); }}>Refresh progress</button></div>
      <p ref={statusRef} tabIndex={-1} role="status" aria-busy={statusState === "loading"}>{statusState === "loading" ? "Loading verified session progress…" : statusError || (mock ? `${STATES[mock.state]} · Last checked ${dateText(mock.server_now)}` : "Waiting for session details.")}</p>
      {mock && <><p>{sessionModel.receiptLabel}.</p>{mock.collection_expired_count > 0 && <p role="status">Upload window expired for {mock.collection_expired_count} {mock.collection_expired_count === 1 ? "device" : "devices"}. Results contain the answers received before the deadline.</p>}{activePhase !== "results" && <><dl className="literacy-mock-metrics"><div><dt>Session</dt><dd>{STATES[mock.state]}</dd></div>{mock.state !== "completed" && <div><dt>{mock.window_mode === 'untimed' ? 'Time limit' : 'Time remaining at last check'}</dt><dd>{mock.window_mode === 'untimed' ? 'No time limit' : minutes(mock.remaining_seconds)}</dd></div>}<div><dt>Maximum questions</dt><dd>{mock.item_count}</dd></div><div><dt>Students</dt><dd>{livePupils.length}</dd></div></dl>
        {mock.state !== "completed" && <div className="literacy-mock-controls">{mock.state === "prepared" && <button className="literacy-mock-primary" type="button" disabled={controlsDisabled} onClick={() => sendControl("start")}>Start assessment</button>}{mock.state === "running" && <button type="button" disabled={controlsDisabled} onClick={() => sendControl("pause")}>Pause assessment</button>}{mock.state === "paused" && <button className="literacy-mock-primary" type="button" disabled={controlsDisabled} onClick={() => sendControl("resume")}>Resume assessment</button>}{mock.window_mode !== "untimed" && <button type="button" disabled={controlsDisabled} onClick={() => sendControl("add_time")}>Add 5 minutes</button>}<button type="button" disabled={controlsDisabled || Boolean(mock.collection_id)} onClick={() => setFinishOpen(true)}>{mock.capabilities?.offlineDelivery ? "Collect all data and finish" : "Finish assessment"}</button></div>}
        {mock.state !== "completed" && <p>{mock.window_mode === "untimed" ? "No time limit. Answers save on each iPad before the student continues." : mock.window_mode === "pause_at_window_end" ? "This session pauses for a break at the window end. Resume to continue." : "This session finishes when its time limit is reached."}</p>}
        {mock.capabilities?.offlineDelivery && mock.state !== "completed" && <div className="literacy-mock-delivery-controls"><label><input type="checkbox" checked={mock.delivery_mode === "live"} disabled={controlsDisabled || Boolean(mock.collection_id)} onChange={event => sendControl(event.target.checked ? "live_on" : "live_off")}/> Live data updates</label><p>Leave this off for poor Wi-Fi. Answers upload when students finish or you collect the class.</p>{mock.collection_id && <p role="status">{mock.collection_pending_count} {mock.collection_pending_count === 1 ? "device is" : "devices are"} waiting to upload. Keep the devices open and reconnect them before {dateText(verifiedStatus.session.expires_at)}.</p>}</div>}
        {mock.capabilities?.supportResolution && livePupils.some(pupil => pupil.help.length) && <section className="literacy-mock-help-desk" aria-label="Help requests"><h4>Students asking for help</h4><p>Record what you actually provided. Reading a protected reading item or suggesting an answer counts as answer assistance.</p>{livePupils.flatMap(pupil => pupil.help.map(request => <div key={`${pupil.studentId}:${request.questionId}`}><strong>{pupil.name}</strong><p>{request.prompt || request.itemSnapshot?.prompt || "Help requested on the current question"}</p><button type="button" disabled={controlsDisabled} onClick={() => evidenceAction("support", pupil.studentId, request.questionId, "none")}>No assistance needed</button><button type="button" disabled={controlsDisabled} onClick={() => evidenceAction("support", pupil.studentId, request.questionId, "access")}>Controls or access only</button><button type="button" disabled={controlsDisabled} onClick={() => evidenceAction("support", pupil.studentId, request.questionId, "answer")}>Help with the answer</button></div>))}</section>}
        <p>{mock.state === "prepared" && "This check is prepared but has not been sent to devices. Start it to let students check sound and practise any new controls. "}Progress refreshes every five seconds while this tab is visible and the session or iPad collection is unfinished. Use Refresh progress to check finished results again. A disconnected device or missing answer is not a literacy result.</p>
        <TeacherDataTable label="Adaptive Literacy Test pupil progress" className="literacy-mock-table"><caption>Students needing help first, then connection checks, working and finished</caption><thead><tr><th scope="col">Student</th><th scope="col">Readiness / connection</th><th scope="col">Received answers</th><th scope="col">Evidence</th></tr></thead><tbody>{livePupils.map(pupil => <tr key={pupil.studentId}><th scope="row">{pupil.name}</th><td>{pupil.member.connected === true ? "Connected" : pupil.member.connected === false ? "Not currently connected" : "Connection not confirmed"}<small>{deviceStatus(pupil, mock)}</small>{pupil.member.last_seen_at && <small>Last seen {dateText(pupil.member.last_seen_at)}</small>}</td><td>{pupil.answered} received{pupil.planned !== null ? ` of ${pupil.planned} planned` : ""}{pupil.mediaFailures > 0 && <small>{pupil.mediaFailures} media {pupil.mediaFailures === 1 ? "failure" : "failures"} · no answer slot used</small>}</td><td><button type="button" onClick={() => { setSelectedReportStudent(pupil.studentId); setPhase("results"); reportHeading.current?.focus(); }}>View {pupil.name}’s report</button></td></tr>)}</tbody></TeacherDataTable></>}
        {mock.state === "completed" && activePhase !== "results" && <button type="button" onClick={() => setPhase("results")}>View saved results</button>}
      </>}
      {activePhase === "results" && <div ref={reportContainer}>
        {reportState === "loading" && <p role="status">Loading detailed results…</p>}
        {reportError && <p role="status">{reportError}</p>}
        {report && livePupils.some(pupil => pupil.answered !== report.pupils.find(row => row.studentId === pupil.studentId)?.answered) && <p role="status">New answers are available. Refresh progress to update the detailed results.</p>}
        {report && <LiteracyMockReport key={sessionId} report={report} receiptStates={receiptStates} studentId={selectedReportStudent} onStudentChange={setSelectedReportStudent} actionDisabled={controlsDisabled} onRecordAssistance={mock?.capabilities?.supportResolution ? (studentId, questionId, assistance, sourceId) => evidenceAction("support", studentId, questionId, assistance, null, sourceId || sessionId) : undefined} />}
      </div>}
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

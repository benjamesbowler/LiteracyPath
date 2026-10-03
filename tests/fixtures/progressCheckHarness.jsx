import { createValidatedSupabaseClient } from "../../src/data/boundaries/facade.js";
import "../../src/styles/fonts.js";
import "../../src/index.css";
import "../../src/App.css";
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { ProgressCheckPage } from "../../src/components/progress/ProgressCheckPage.jsx";
import { StudentSessionSetup } from "../../src/components/student-sessions/StudentSessionSetup.jsx";
import { PROGRESS_BANK } from "../../src/content/assessments/v3/progressBank.generated.js";
import { STUDENT_FOCUS_TARGETS } from "../../src/policy/studentFocusTargets.js";

const mode = new URLSearchParams(location.search).get("mode") || "teacher";
const teacherId = "11111111-1111-4111-8111-111111111111", classId = "22222222-2222-4222-8222-222222222222", firstId = "33333333-3333-4333-8333-333333333333", secondId = "44444444-4444-4444-8444-444444444444", assignmentId = "55555555-5555-4555-8555-555555555555";
window.__progressRequests = [];
let activeStudentId = firstId, saveCalls = 0;
Object.defineProperty(window, "__progressRun", { configurable: true, get: () => JSON.parse(localStorage.getItem(`lpProgressRun:v1:${teacherId}:${activeStudentId}:${mode === "child" ? assignmentId : ""}`) || "null") });
const fixtureClient = { async call(name, args) {
  window.__progressRequests.push({ name, args });
  if (name.startsWith("teacher_start")) return { data: { ok: true, session: { id: assignmentId } } };
  const studentId = args.p_token === "child-b" ? secondId : args.p_token === "child-a" ? firstId : args.p_student_id;
  if (name.endsWith("get_progress_run")) {
    if (sessionStorage.getItem("progress-load-offline")) return { error: { message: "Network connection unavailable" } };
    return { data: { ok: true, run: JSON.parse(localStorage.getItem(`server-run:${studentId}`) || "null"), history: [], exposures: [] } };
  }
  if (name.endsWith("save_progress_run")) {
    saveCalls++;
    const params = new URLSearchParams(location.search);
    const delay = Number(params.get("saveDelay") || 0);
    if (delay) await new Promise(resolve => setTimeout(resolve, delay));
    if (!window.__progressConnectionRestored && (params.get("failSave") === "always" || (params.get("failSave") === "once" && saveCalls === 1))) return { error: { code: "57014", message: "canceling statement due to statement timeout" } };
    const run = { ...args.p_run, pool: args.p_run.pool.map(item => typeof item === "string" ? PROGRESS_BANK.items.find(candidate => candidate.id === item) : item) };
    if (args.p_token && run.studentId !== studentId) return { data: { ok: false, error: "wrong_learner" } };
    localStorage.setItem(`server-run:${run.studentId}`, JSON.stringify(run)); window.__progressServerRun = run;
    if (args.p_attempt) { localStorage.setItem(`server-attempt:${run.studentId}`, JSON.stringify(args.p_attempt)); window.__progressAttempt = args.p_attempt; }
    return { data: { ok: true } };
  }
  return { data: { ok: false, error: "unexpected_call" } };
} };
const client = createValidatedSupabaseClient({ auth: {}, rpc: async (name, args) => ({ data: null, error: null, ...await fixtureClient.call(name, args) }) });
const focusSession = { id: assignmentId, teacher_id: teacherId, class_id: classId, target: "progress_check", status: "active", resolved_config: { plan_kind: "focused", track_id: "reading_stories", bank_version: PROGRESS_BANK.version } };
function Harness() {
  const [studentId, setStudentId] = useState(firstId), [started, setStarted] = useState(false);
  if (mode === "assignment") return <><StudentSessionSetup client={client} classId={classId} students={[{ id: firstId, name: "Pupil A" }]} assessmentHistoryReady={true} initialStudentIds={[firstId]} initialTarget={STUDENT_FOCUS_TARGETS.PROGRESS_CHECK} onStarted={() => setStarted(true)}/>{started && <p>Assignment started</p>}</>;
  return <><button type="button" onClick={() => setStudentId(id => { activeStudentId = id === firstId ? secondId : firstId; return activeStudentId; })}>Switch learner</button><ProgressCheckPage key={studentId} studentId={studentId} studentName={studentId === firstId ? "Pupil A" : "Pupil B"} teacherId={teacherId} classId={classId} client={client} token={mode === "child" ? studentId === firstId ? "child-a" : "child-b" : ""} focusSession={mode === "child" ? focusSession : null}/></>;
}
createRoot(document.getElementById("root")).render(<Harness/>);

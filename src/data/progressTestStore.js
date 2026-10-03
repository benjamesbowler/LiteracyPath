import { saveAssessmentAttempt, saveAssessmentAttemptLocal } from "./assessmentHistoryStore.js";
import { progressAttemptFromRun } from "../utils/progressTestRouter.js";
import { isProgressWriteBlocked } from "../utils/progressSync.js";

const key = ({ teacherId, studentId, assignmentId = "" }) => `lpProgressRun:v1:${teacherId}:${studentId}:${assignmentId}`;
const canonical = value => JSON.stringify(value, (_, item) => item && !Array.isArray(item) && typeof item === "object" ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b))) : item);
const prefix = (earlier = [], later = []) => earlier.length <= later.length && earlier.every((row, index) => canonical(row) === canonical(later[index]));
export function progressDraftExtends(remote, local) {
  const frozen = ["schemaVersion", "attemptId", "studentId", "teacherId", "classId", "assignmentId", "contentVersion", "difficultyVersion", "policyVersion", "policySnapshot", "startingPoints", "exposureSnapshot", "plan", "seed", "pool", "startedAt"];
  return frozen.every(field => canonical(remote[field]) === canonical(local[field])) && prefix(remote.responses, local.responses) && prefix(remote.routeDecisions, local.routeDecisions) && prefix(remote.warmupRecords, local.warmupRecords) && prefix(remote.pauseEvents, local.pauseEvents) && (!["completed", "partial"].includes(remote.status) || canonical(remote) === canonical(local));
}
export function loadProgressRunLocal(scope) {
  try {
    const run = JSON.parse(globalThis.localStorage?.getItem(key(scope)) || "null");
    return run?.studentId === scope.studentId && run?.teacherId === scope.teacherId && run?.assignmentId === (scope.assignmentId || "") ? run : null;
  } catch { return null; }
}
export function saveProgressRunLocal(run) {
  if (isProgressWriteBlocked(run.studentId, "progress_check")) throw new Error("This learner's local progress was cleared. Reopen the learner before starting another check.");
  if (!globalThis.localStorage) return false;
  globalThis.localStorage.setItem(key(run), JSON.stringify(run));
  return true;
}
export function clearProgressRunLocal(scope) { globalThis.localStorage?.removeItem(key(scope)); }
async function rpc(client, name, args) {
  const { data, error } = await client.call(name, args);
  if (error) throw error;
  if (!data?.ok) throw new Error(data?.error || "Progress evidence could not be saved.");
  return data;
}
export function isTemporaryProgressFailure(error) {
  return error?.code === "57014" || /timeout|network|fetch|offline|connection|503|502|504/i.test(error?.message || "");
}
export async function loadProgressRun({ client, token = "", studentId, teacherId, assignmentId = "" }) {
  const scope = { studentId, teacherId, assignmentId };
  const local = loadProgressRunLocal(scope);
  if (!client) return { run: local, history: [], localOnly: true };
  let data;
  try {
    data = await rpc(client, token ? "student_get_progress_run" : "teacher_get_progress_run", token ? { p_token: token, p_session_id: assignmentId } : { p_student_id: studentId, p_assignment_id: assignmentId || null });
  } catch (error) {
    // Only an existing scoped draft can resume during a temporary outage. A new
    // check still needs the service's history, exposure and assignment checks.
    if (local && isTemporaryProgressFailure(error)) return { run: local, history: [], exposures: [], interruptedLoad: true };
    throw error;
  }
  // A durable draft owns its immutable prefix. A longer local draft is an
  // interrupted upload and is retried rather than replaced by the server copy.
  const remote = data.run;
  const matching = local && remote && local.attemptId === remote.attemptId;
  const extendsRemote = matching && progressDraftExtends(remote, local);
  const progress = run => (run.responses?.length || 0) + (run.routeDecisions?.length || 0) + (run.warmupRecords?.length || 0);
  const extendsLocal = matching && progressDraftExtends(local, remote);
  if (matching && !extendsRemote && !extendsLocal) {
    saveProgressRunLocal(remote);
    return { ...data, run: remote, conflict: "The device draft did not match the saved check. The service copy was kept; review it before continuing." };
  }
  const chosen = extendsRemote && (progress(local) > progress(remote) || (progress(local) === progress(remote) && (local.checkpointRevision || 0) > (remote.checkpointRevision || 0))) ? local : remote || local;
  if (remote && chosen === remote) saveProgressRunLocal(remote);
  return { ...data, run: chosen };
}
export async function persistProgressRun(run, { client = null, token = "" } = {}) {
  if (isProgressWriteBlocked(run.studentId, "progress_check")) throw new Error("This learner's progress was cleared. Reopen the learner before starting another check.");
  let localSaved = false;
  let localError;
  try { localSaved = saveProgressRunLocal(run); } catch (error) { localError = error; }
  const terminal = ["completed", "partial"].includes(run.status);
  const attempt = terminal ? progressAttemptFromRun(run) : null;
  if (client) {
    await rpc(client, token ? "student_save_progress_run" : "teacher_save_progress_run", token ? { p_token: token, p_session_id: run.assignmentId, p_run: { ...run, pool: run.pool.map(item => item.id) }, p_attempt: attempt } : { p_run: { ...run, pool: run.pool.map(item => item.id) }, p_attempt: attempt });
    if (attempt && !token && !isProgressWriteBlocked(run.studentId, "progress_check")) saveAssessmentAttemptLocal(attempt, { teacherId: run.teacherId });
    return { localSaved, cloudSaved: true, attempt };
  }
  if (!localSaved) throw new Error(`This device could not save the check. Please ask your teacher.${localError?.name === "QuotaExceededError" ? " The device storage is full." : ""}`);
  if (attempt) await saveAssessmentAttempt(attempt, { teacherId: run.teacherId });
  return { localSaved, cloudSaved: false, attempt };
}

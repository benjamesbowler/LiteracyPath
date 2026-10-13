import { canonicalStatusId, REPORT_STATUS_IDS } from "../policy/reportingBible.js";
import { TEACHER_WORKFLOW_COPY } from "../copy/teacherWorkflowCopy.js";

// Choose an action from conclusions already evaluated by the evidence owner.
// This module never computes mastery, creates a group or records delivery.
export function selectTeacherNextAction({
  readStatus = "complete", activeSession = null, conclusion = null,
  focus = "", mixed = false, canTeach = true
} = {}) {
  let kind;
  const status = canonicalStatusId(conclusion?.status?.id || conclusion?.statusId);
  if (activeSession && ["active", "paused", "prepared", "running"].includes(activeSession.status)) kind = "resume";
  else if (readStatus !== "complete") kind = "retry";
  else if (mixed || status === REPORT_STATUS_IDS.MIXED_EVIDENCE) kind = "review";
  else if (!conclusion?.ready) kind = "assess";
  else if ([REPORT_STATUS_IDS.NEEDS_SUPPORT, REPORT_STATUS_IDS.DEVELOPING].includes(status)) {
    kind = focus && canTeach ? "teach" : "review";
  } else if (status === REPORT_STATUS_IDS.SECURE) kind = "continue";
  else kind = "assess";
  const copy = TEACHER_WORKFLOW_COPY.next[kind];
  return { kind, label: copy.label, reason: typeof copy.reason === "function" ? copy.reason(focus) : copy.reason, focus };
}

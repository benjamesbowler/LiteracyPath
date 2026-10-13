import { STUDENT_FOCUS_TARGETS, studentFocusLabel } from "../policy/studentFocusTargets.js";

const isMockConfiguration = config => Boolean(config.mock || config.mock_session || config.plan_kind === "mock");

export function sessionActivityLabel(target, config = {}) {
  if (isMockConfiguration(config)) return "Mock MAP test";
  // Retired practice and snapshot records keep their original evidence meaning.
  if (target === STUDENT_FOCUS_TARGETS.PROGRESS_CHECK) return config.plan_kind === "practice" ? "Literacy practice" : ["broad_profile", "focused"].includes(config.plan_kind) ? "Independent literacy snapshot" : "Literacy session";
  return studentFocusLabel(target);
}

export function sessionActivityDescription(target, config = {}) {
  if (isMockConfiguration(config)) return "Students answer the teacher-launched Mock MAP test. Saved answers, support and unanswered questions remain distinct; results are descriptive and do not change Skills mastery or provide an official MAP score.";
  if (target === STUDENT_FOCUS_TARGETS.PROGRESS_CHECK) return config.plan_kind === "practice"
    ? "Students practise with teaching and feedback. First answers and supported practice are reported separately; this does not change Skills mastery."
    : "Students answer independently, without teaching feedback. The descriptive snapshot does not change placement or Skills mastery.";
  if (target === STUDENT_FOCUS_TARGETS.SKILLS_ASSESSMENT) return "Students answer independently. Answers are saved without showing correctness; the assigned Skills assessment retains its own mastery rules.";
  return "Supported practice or reading. Completion is recorded separately from independent assessment results.";
}

export function teacherSessionModel({ protocol, session, members = [], connection = "connected", pendingWrites = 0 } = {}) {
  if (protocol === "mock") {
    const state = session?.mock?.state;
    return { phase: state === "prepared" ? "prepare" : state === "completed" ? "results" : "live", stateLabel: ({ prepared: "Prepared · not sent", running: "Running", paused: "Paused", completed: "Finished" })[state] || "Checking session", canStart: state === "prepared", canPause: state === "running", canResume: state === "paused", canEnd: ["prepared", "running", "paused"].includes(state), receiptLabel: connection === "connected" ? "Showing server-confirmed answers" : "Showing the last confirmed answers" };
  }
  if (protocol === "reading") return { phase: session ? "live" : "results", stateLabel: session ? "Reading together" : "Reading ended", canEnd: Boolean(session) && pendingWrites === 0, receiptLabel: pendingWrites ? `${pendingWrites} ${pendingWrites === 1 ? "change is" : "changes are"} waiting to save` : "Reading changes confirmed" };
  const active = session?.status === "active";
  return { phase: active ? "live" : "results", stateLabel: active ? "Live" : "Ended", canEnd: active, completed: members.filter(member => member.status === "completed").length, receiptLabel: connection === "connected" ? "Showing confirmed session progress" : "Showing the last confirmed progress" };
}

export function prioritySessionMembers(members = []) {
  const priority = member => member.content_ok === false || member.media_unavailable === true ? 0 : member.connected === false && member.status !== "completed" ? 1 : member.status === "completed" ? 3 : 2;
  return members.map((member, index) => ({ member, index })).sort((a, b) => priority(a.member) - priority(b.member) || a.index - b.index).map(row => row.member);
}

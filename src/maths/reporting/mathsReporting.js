import { APPROVED_FOUNDATION_SKILL_IDS, mathsSkillById } from "../curriculum/mathsSkillTree.js";

const DAY = 86_400_000;

export const MATHS_EVIDENCE_STATUSES = Object.freeze([
  "Not checked",
  "Practice observed",
  "Needs follow-up",
  "Mixed evidence",
  "Demonstrated"
]);

const SIGNAL_GUIDANCE = Object.freeze({
  off_by_one_response: Object.freeze({ check: "Check whether one object was skipped or counted twice.", action: "Move each object into a counted area while saying one number word." }),
  comparison_choice_mismatch: Object.freeze({ check: "Check whether spacing or object size is influencing the comparison.", action: "Match the collections one-to-one from the same starting point." }),
  missing_part_mismatch: Object.freeze({ check: "Check whether the learner is treating the known part as the whole.", action: "Build the whole with two colours, then cover and uncover the missing part." }),
  carry_once_mismatch: Object.freeze({ check: "Check whether each object was moved exactly once.", action: "Separate counted and uncounted objects, moving one object per number word." }),
  trail_step_mismatch: Object.freeze({ check: "Check whether the starting number was counted as the first step.", action: "Mark the start, then touch each landing while moving one step at a time." }),
  compare_frames_mismatch: Object.freeze({ check: "Check whether the learner compared row length rather than quantity.", action: "Pair frame spaces one-to-one before naming more, fewer or same." }),
  match_frame_mismatch: Object.freeze({ check: "Check the connection between numeral, number word and collection.", action: "Say the number, build its collection, then select the matching numeral." }),
  forge_frame_mismatch: Object.freeze({ check: "Check whether the learner counted the shown part instead of the missing part.", action: "Cover the filled spaces and count only the spaces still needed." }),
  other_incorrect_response: Object.freeze({ check: "Repeat the idea with a simpler quantity and ask the learner to explain each move.", action: "Gather a teacher observation before choosing a repair lesson." })
});

function evidenceOutcome(event) {
  const evidence = event?.evidence || {};
  if (event?.eventType === "practice_attempt" || evidence.constructChanged) return null;
  if (typeof evidence.correct === "boolean") return evidence.correct;
  if (["demonstrated", "independent", "correct"].includes(evidence.outcome)) return true;
  if (["not_yet", "incorrect"].includes(evidence.outcome)) return false;
  return null;
}

function eventOccurrenceKey(event, index) {
  const evidence = event.evidence || {};
  return evidence.itemKey || evidence.roundId || `${evidence.sessionId || evidence.assignmentId || event.eventType}:${event.id || event.occurredAt || index}`;
}

function patternGuidance(possiblePatterns, skillId) {
  const guidance = possiblePatterns.map(signal => SIGNAL_GUIDANCE[signal]).find(Boolean);
  if (guidance) return guidance;
  const actions = mathsSkillById[skillId]?.nextActions || [];
  return Object.freeze({
    check: "Check the same mathematical idea in a different representation.",
    action: actions[0] || "Gather a fresh teacher observation in another representation."
  });
}

export function mathsSkillReport(events = [], skillId, { now = new Date() } = {}) {
  const relevant = events
    .filter(event => event.skillId === skillId)
    .sort((left, right) => new Date(left.occurredAt || 0) - new Date(right.occurredAt || 0));
  const scoredEvents = relevant.filter(event => evidenceOutcome(event) !== null);
  const scored = scoredEvents.map(evidenceOutcome);
  const correct = scored.filter(Boolean).length;
  const practiceEvents = relevant.filter(event => event.eventType === "practice_attempt" || event.evidence?.constructChanged);
  const representations = new Set(scoredEvents.map(event => event.evidence?.representation || event.evidence?.manipulativeId).filter(Boolean));
  const practiceRepresentations = new Set(practiceEvents.map(event => event.evidence?.representation || event.evidence?.manipulativeId).filter(Boolean));
  const sources = new Set(scoredEvents.map(event => event.evidence?.source || event.eventType).filter(Boolean));
  const newestEvent = scoredEvents.at(-1) || practiceEvents.at(-1) || null;
  const newest = newestEvent ? new Date(newestEvent.occurredAt || 0).getTime() || 0 : 0;
  const ageDays = newest ? Math.floor((now.getTime() - newest) / DAY) : null;
  const signalOccurrences = new Map();
  scoredEvents.forEach((event, index) => {
    const signals = event.evidence?.observedSignals
      || (event.evidence?.classification && !["correct", "not_checked"].includes(event.evidence.classification)
        ? [event.evidence.classification]
        : []);
    for (const signal of new Set(signals)) {
      if (!signalOccurrences.has(signal)) signalOccurrences.set(signal, new Set());
      signalOccurrences.get(signal).add(eventOccurrenceKey(event, index));
    }
  });
  const possiblePatterns = [...signalOccurrences.entries()]
    .filter(([, occurrences]) => occurrences.size >= 2)
    .map(([signal]) => signal);
  let status = "Not checked";
  if (!scoredEvents.length && practiceEvents.length) status = "Practice observed";
  else if (scoredEvents.length) {
    const outcomeKinds = new Set(scored);
    if (outcomeKinds.size > 1) status = "Mixed evidence";
    else status = scored.at(-1) ? "Demonstrated" : "Needs follow-up";
  }
  const guidance = patternGuidance(possiblePatterns, skillId);
  return Object.freeze({
    skillId,
    label: mathsSkillById[skillId]?.childLabel || skillId,
    status,
    eventCount: relevant.length,
    practiceCount: practiceEvents.length,
    scoredCount: scored.length,
    correctCount: correct,
    sources: [...sources],
    representations: [...representations],
    practiceRepresentations: [...practiceRepresentations],
    newestAt: newest ? new Date(newest).toISOString() : null,
    freshness: ageDays === null ? "No evidence" : ageDays === 0 ? "Today" : ageDays === 1 ? "Yesterday" : `${ageDays} days ago`,
    possiblePatterns,
    observedSignals: Object.freeze(Object.fromEntries([...signalOccurrences].map(([signal, occurrences]) => [signal, occurrences.size]))),
    checkQuestion: guidance.check,
    nextAction: guidance.action,
    secureEnabled: false,
    evidenceNote: scoredEvents.length
      ? `${scoredEvents.length} direct formative event${scoredEvents.length === 1 ? "" : "s"} across ${representations.size} representation${representations.size === 1 ? "" : "s"}${practiceEvents.length ? `, plus ${practiceEvents.length} practice event${practiceEvents.length === 1 ? "" : "s"}` : ""}.`
      : practiceEvents.length
        ? `${practiceEvents.length} practice event${practiceEvents.length === 1 ? "" : "s"}; gather a direct check or teacher observation before making an attainment claim.`
        : "No Maths evidence has been collected for this skill."
  });
}

export function buildMathsLearnerReport(events = [], studentId) {
  const learnerEvents = events.filter(event => !studentId || event.studentId === studentId);
  return Object.freeze(APPROVED_FOUNDATION_SKILL_IDS.map(skillId => mathsSkillReport(learnerEvents, skillId)));
}

export function buildMathsClassReport(events = [], students = []) {
  return Object.freeze(APPROVED_FOUNDATION_SKILL_IDS.map(skillId => {
    const learnerRows = students.map(student => ({
      student,
      report: mathsSkillReport(events.filter(event => event.studentId === student.id), skillId)
    }));
    const statusCounts = learnerRows.reduce((counts, row) => {
      counts[row.report.status] = (counts[row.report.status] || 0) + 1;
      return counts;
    }, {});
    const actionCounts = learnerRows
      .filter(row => ["Needs follow-up", "Mixed evidence"].includes(row.report.status))
      .reduce((counts, row) => counts.set(row.report.nextAction, (counts.get(row.report.nextAction) || 0) + 1), new Map());
    const nextAction = [...actionCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0]
      || "Gather a fresh observation for learners who are not yet checked.";
    return Object.freeze({
      skillId,
      label: mathsSkillById[skillId]?.childLabel || skillId,
      learnerRows: Object.freeze(learnerRows),
      learnerCount: students.length,
      checkedCount: learnerRows.filter(row => row.report.status !== "Not checked").length,
      statusCounts: Object.freeze(statusCounts),
      newestAt: learnerRows.map(row => row.report.newestAt).filter(Boolean).sort().at(-1) || null,
      nextAction
    });
  }));
}

export function buildMathsClassGroups(events = [], students = [], skillId = APPROVED_FOUNDATION_SKILL_IDS[0]) {
  const rows = students.map(student => {
    const report = mathsSkillReport(events.filter(event => event.studentId === student.id), skillId);
    return { student, priority: report };
  });
  return Object.freeze({
    notChecked: rows.filter(row => row.priority.status === "Not checked"),
    practiceOnly: rows.filter(row => row.priority.status === "Practice observed"),
    reconnect: rows.filter(row => row.priority.status === "Needs follow-up"),
    build: rows.filter(row => row.priority.status === "Mixed evidence"),
    extend: rows.filter(row => row.priority.status === "Demonstrated")
  });
}

import { APPROVED_FOUNDATION_SKILL_IDS, mathsSkillById } from "../curriculum/mathsSkillTree.js";
import { REPORTING_BIBLE_POLICY } from "../../policy/reportingBible.js";

const DAY = 86_400_000;
const CONCLUSION_WINDOW_DAYS = REPORTING_BIBLE_POLICY.recency.conclusionWindowDays;

export const MATHS_EVIDENCE_STATUSES = Object.freeze([
  "Not checked",
  "Practice observed",
  "Needs follow-up",
  "Mixed evidence",
  "Correct on checked items"
]);

export const MATHS_EVIDENCE_SOURCE_LABELS = Object.freeze({
  maths_skills_check: "Skills check",
  small_group_exit: "Small-group observation",
  maths_arcade: "Arcade practice",
  lesson_player: "Guided lesson",
  maths_number_story: "Number story"
});

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
  if (event?.eventType === "practice_attempt" || evidence.constructChanged || evidence.classification === "not_checked" || evidence.response === null) return null;
  if (typeof evidence.correct === "boolean") return evidence.correct;
  if (["demonstrated", "independent", "correct"].includes(evidence.outcome)) return true;
  if (["not_yet", "incorrect"].includes(evidence.outcome)) return false;
  return null;
}

function distinctEvidenceItemKey(event, index) {
  const evidence = event.evidence || {};
  if (evidence.itemKey) return String(evidence.itemKey).split(":")[0];
  if (evidence.roundId) return String(evidence.roundId);
  return String(event.id || `${event.eventType || "evidence"}:${event.occurredAt || index}`);
}

function evidenceOccasionKey(event, index) {
  const evidence = event.evidence || {};
  return String(evidence.sessionId || evidence.assignmentId || event.id || event.occurredAt || index);
}

function currentEvidenceWindow(scoredEvents, maximumOccasions = 3) {
  const newestOccasions = [];
  for (let index = scoredEvents.length - 1; index >= 0; index -= 1) {
    const key = evidenceOccasionKey(scoredEvents[index], index);
    if (!newestOccasions.includes(key)) newestOccasions.push(key);
    if (newestOccasions.length === maximumOccasions) break;
  }
  const allowed = new Set(newestOccasions);
  return scoredEvents.filter((event, index) => allowed.has(evidenceOccasionKey(event, index)));
}

function evidenceDirection(scoredEvents) {
  if (scoredEvents.length < 2) return scoredEvents.length ? "Single check" : "No direct check";
  const recent = scoredEvents.slice(-3).map(evidenceOutcome);
  const earlier = scoredEvents.slice(0, Math.max(0, scoredEvents.length - recent.length)).map(evidenceOutcome);
  const recentCorrect = recent.filter(Boolean).length;
  const earlierCorrect = earlier.filter(Boolean).length;
  if (recent.every(Boolean) && earlier.includes(false)) return "Improving — recent checks were correct";
  if (recent.every(value => !value) && earlier.includes(true)) return "Needs renewed attention";
  if (new Set(recent).size > 1) return "Inconsistent in recent checks";
  if (recentCorrect === recent.length) return "Consistently correct in recent checks";
  if (earlier.length && recentCorrect / recent.length > earlierCorrect / earlier.length) return "Improving";
  return "Evidence is consistent across recent checks";
}

function signalLabel(value) {
  return String(value || "Not recorded")
    .replaceAll("_", " ")
    .replace(/\b\w/g, character => character.toUpperCase());
}

function summariseSignals(events, currentEvents, readValue, labels = {}) {
  const counts = new Map();
  const current = new Set(currentEvents.map(readValue).filter(Boolean));
  events.map(readValue).filter(Boolean).forEach(value => counts.set(value, (counts.get(value) || 0) + 1));
  return Object.freeze([...counts.entries()]
    .sort((left, right) => right[1] - left[1] || String(left[0]).localeCompare(String(right[0])))
    .map(([id, count]) => Object.freeze({
      id,
      label: labels[id] || signalLabel(id),
      count,
      current: current.has(id)
    })));
}

function evidenceTrend(scoredEvents) {
  const points = Object.freeze(scoredEvents.slice(-5).map((event, index) => {
    const outcome = evidenceOutcome(event) ? "checked_correct" : "needs_follow_up";
    return Object.freeze({
      id: event.id || `${event.occurredAt || "undated"}-${index}`,
      outcome,
      label: outcome === "checked_correct" ? "Correct on this checked item" : "Needs follow-up on this checked item",
      occurredAt: event.occurredAt || null,
      representation: event.evidence?.representation || event.evidence?.manipulativeId || null,
      source: event.evidence?.source || event.eventType || null
    });
  }));
  if (scoredEvents.length < 5) return Object.freeze({
    state: "insufficient",
    label: `${scoredEvents.length} checked item${scoredEvents.length === 1 ? "" : "s"}; at least 5 are needed before showing a trend`,
    points
  });
  const recent = scoredEvents.slice(-3).map(evidenceOutcome);
  const earlier = scoredEvents.slice(-5, -3).map(evidenceOutcome);
  const recentRate = recent.filter(Boolean).length / recent.length;
  const earlierRate = earlier.filter(Boolean).length / earlier.length;
  const state = recentRate > earlierRate
    ? "recent_stronger"
    : recentRate < earlierRate
      ? "recent_needs_attention"
      : new Set(recent).size > 1
        ? "recent_varied"
        : "recent_steady";
  const labels = {
    recent_stronger: "Recent checked items are stronger than the two before them",
    recent_needs_attention: "Recent checked items need more attention than the two before them",
    recent_varied: "Recent checked items vary",
    recent_steady: "Recent checked items are steady"
  };
  return Object.freeze({ state, label: labels[state], points });
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
  const conclusionCutoff = now.getTime() - CONCLUSION_WINDOW_DAYS * DAY;
  const recentScoredEvents = scoredEvents.filter(event => {
    const occurred = new Date(event.occurredAt || 0).getTime();
    return Number.isFinite(occurred) && occurred >= conclusionCutoff && occurred <= now.getTime() + 5 * 60_000;
  });
  const currentScoredEvents = currentEvidenceWindow(recentScoredEvents);
  const currentScored = currentScoredEvents.map(evidenceOutcome);
  const currentOccasions = new Set(currentScoredEvents.map(evidenceOccasionKey));
  const practiceEvents = relevant.filter(event => event.eventType === "practice_attempt" || event.evidence?.constructChanged);
  const representations = new Set(scoredEvents.map(event => event.evidence?.representation || event.evidence?.manipulativeId).filter(Boolean));
  const currentRepresentations = new Set(currentScoredEvents.map(event => event.evidence?.representation || event.evidence?.manipulativeId).filter(Boolean));
  const practiceRepresentations = new Set(practiceEvents.map(event => event.evidence?.representation || event.evidence?.manipulativeId).filter(Boolean));
  const sources = new Set(scoredEvents.map(event => event.evidence?.source || event.eventType).filter(Boolean));
  const currentSources = new Set(currentScoredEvents.map(event => event.evidence?.source || event.eventType).filter(Boolean));
  const newestEvent = scoredEvents.at(-1) || practiceEvents.at(-1) || null;
  const newest = newestEvent ? new Date(newestEvent.occurredAt || 0).getTime() || 0 : 0;
  const ageDays = newest ? Math.floor((now.getTime() - newest) / DAY) : null;
  const signalOccurrences = new Map();
  currentScoredEvents.forEach((event, index) => {
    if (event.evidence?.response === null) return;
    const signals = event.evidence?.observedSignals
      || (event.evidence?.classification && !["correct", "not_checked"].includes(event.evidence.classification)
        ? [event.evidence.classification]
        : []);
    for (const signal of new Set(signals)) {
      if (!signalOccurrences.has(signal)) signalOccurrences.set(signal, new Set());
      signalOccurrences.get(signal).add(distinctEvidenceItemKey(event, index));
    }
  });
  const possiblePatterns = [...signalOccurrences.entries()]
    .filter(([, occurrences]) => occurrences.size >= 2)
    .map(([signal]) => signal);
  let status = "Not checked";
  if (!scoredEvents.length && practiceEvents.length) status = "Practice observed";
  else if (currentScoredEvents.length) {
    const outcomeKinds = new Set(currentScored);
    if (outcomeKinds.size > 1) status = "Mixed evidence";
    else status = currentScored.at(-1) ? "Correct on checked items" : "Needs follow-up";
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
    currentScoredCount: currentScored.length,
    historicalScoredCount: scoredEvents.length - recentScoredEvents.length,
    independentOccasionCount: currentOccasions.size,
    sources: [...sources],
    currentSources: [...currentSources],
    sourceSignals: summariseSignals(
      scoredEvents,
      currentScoredEvents,
      event => event.evidence?.source || event.eventType,
      MATHS_EVIDENCE_SOURCE_LABELS
    ),
    representations: [...representations],
    currentRepresentations: [...currentRepresentations],
    representationSignals: summariseSignals(
      scoredEvents,
      currentScoredEvents,
      event => event.evidence?.representation || event.evidence?.manipulativeId
    ),
    responseDirectionSignals: summariseSignals(
      scoredEvents,
      currentScoredEvents,
      event => event.evidence?.responseDirection
    ),
    assessmentPurposeSignals: summariseSignals(
      scoredEvents,
      currentScoredEvents,
      event => event.evidence?.evidencePurpose
    ),
    practiceRepresentations: [...practiceRepresentations],
    newestAt: newest ? new Date(newest).toISOString() : null,
    freshness: ageDays === null ? "No evidence" : ageDays === 0 ? "Today" : ageDays === 1 ? "Yesterday" : `${ageDays} days ago`,
    possiblePatterns,
    direction: evidenceDirection(recentScoredEvents),
    trend: evidenceTrend(recentScoredEvents),
    observedSignals: Object.freeze(Object.fromEntries([...signalOccurrences].map(([signal, occurrences]) => [signal, occurrences.size]))),
    checkQuestion: guidance.check,
    nextAction: guidance.action,
    secureEnabled: false,
    evidenceNote: scoredEvents.length
      ? `${currentScoredEvents.length} current direct event${currentScoredEvents.length === 1 ? "" : "s"} from ${currentOccasions.size} independent occasion${currentOccasions.size === 1 ? "" : "s"}; ${scoredEvents.length} direct event${scoredEvents.length === 1 ? "" : "s"} in history across ${representations.size} representation${representations.size === 1 ? "" : "s"}${scoredEvents.length > recentScoredEvents.length ? `, including ${scoredEvents.length - recentScoredEvents.length} outside the ${CONCLUSION_WINDOW_DAYS}-day current conclusion window` : ""}${practiceEvents.length ? `, plus ${practiceEvents.length} practice event${practiceEvents.length === 1 ? "" : "s"}` : ""}. This describes checked items only, not mastery.`
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
    extend: rows.filter(row => row.priority.status === "Correct on checked items" && row.priority.independentOccasionCount >= 2 && row.priority.currentRepresentations.length >= 2 && row.priority.currentSources.includes("small_group_exit"))
  });
}

export function buildMathsActionGroups(events = [], students = [], skillId = APPROVED_FOUNDATION_SKILL_IDS[0]) {
  const grouped = new Map();
  students.forEach(student => {
    const report = mathsSkillReport(events.filter(event => event.studentId === student.id), skillId);
    if (!["Needs follow-up", "Mixed evidence"].includes(report.status)) return;
    const patternKey = report.possiblePatterns.slice().sort().join(",") || "fresh_check_needed";
    const key = `${patternKey}:${report.checkQuestion}:${report.nextAction}`;
    if (!grouped.has(key)) grouped.set(key, {
      id: `${skillId}:${patternKey}`,
      skillId,
      label: mathsSkillById[skillId]?.childLabel || skillId,
      possiblePattern: report.possiblePatterns.length > 0,
      checkQuestion: report.checkQuestion,
      nextAction: report.nextAction,
      students: []
    });
    grouped.get(key).students.push(student);
  });
  return Object.freeze([...grouped.values()]
    .sort((left, right) => right.students.length - left.students.length || left.nextAction.localeCompare(right.nextAction))
    .map(group => Object.freeze({ ...group, students: Object.freeze(group.students) })));
}

export function buildMathsTeachingPriorities(events = [], students = []) {
  if (!students.length) return Object.freeze([]);
  const classReport = buildMathsClassReport(events, students);
  const actionGroups = APPROVED_FOUNDATION_SKILL_IDS
    .flatMap(skillId => buildMathsActionGroups(events, students, skillId))
    .sort((left, right) => right.students.length - left.students.length);
  const priorities = [];
  if (actionGroups[0]) {
    const group = actionGroups[0];
    priorities.push(Object.freeze({
      id: `teach:${group.id}`,
      kind: "teach",
      skillId: group.skillId,
      studentIds: Object.freeze(group.students.map(student => student.id)),
      title: `Teach ${group.label}`,
      summary: `${group.students.length} learner${group.students.length === 1 ? "" : "s"} share this next action: ${group.nextAction}`,
      checkQuestion: group.checkQuestion
    }));
  }
  const leastChecked = classReport
    .map(row => ({ ...row, notCheckedCount: row.statusCounts["Not checked"] || 0 }))
    .sort((left, right) => right.notCheckedCount - left.notCheckedCount)[0];
  if (leastChecked?.notCheckedCount) priorities.push(Object.freeze({
    id: `check:${leastChecked.skillId}`,
    kind: "check",
    skillId: leastChecked.skillId,
    studentIds: Object.freeze(leastChecked.learnerRows
      .filter(row => row.report.status === "Not checked")
      .map(row => row.student.id)),
    title: `Check ${leastChecked.label}`,
    summary: `${leastChecked.notCheckedCount} learner${leastChecked.notCheckedCount === 1 ? " has" : "s have"} no direct evidence for this goal. Not checked remains neutral.`
  }));
  if (!priorities.length) priorities.push(Object.freeze({
    id: "review:class",
    kind: "review",
    skillId: APPROVED_FOUNDATION_SKILL_IDS[0],
    studentIds: Object.freeze([]),
    title: "Review the latest checked items",
    summary: "No shared follow-up pattern is visible. Review representation coverage before choosing the next class model."
  }));
  return Object.freeze(priorities.slice(0, 2));
}

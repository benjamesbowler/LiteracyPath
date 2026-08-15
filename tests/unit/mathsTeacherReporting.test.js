import assert from "node:assert/strict";
import test from "node:test";

import {
  buildMathsActionGroups,
  buildMathsClassGroups,
  buildMathsLearnerReport,
  buildMathsTeachingPriorities,
  mathsSkillReport
} from "../../src/maths/reporting/mathsReporting.js";
import { REPORTING_BIBLE_POLICY } from "../../src/policy/reportingBible.js";

const SKILL_ID = "F-N-PART-10";
const DAY = 86_400_000;

function event({ studentId = "s1", index = 0, correct = false, signal = "missing_part_mismatch", representation = "ten_frame", source = "maths_skills_check" }) {
  return {
    id: `${studentId}-${index}`,
    studentId,
    skillId: SKILL_ID,
    eventType: "skills_check_response",
    occurredAt: new Date(Date.now() - index * DAY).toISOString(),
    evidence: {
      sessionId: `${studentId}-session-${index}`,
      itemKey: `item-${index}`,
      correct,
      observedSignals: correct || !signal ? [] : [signal],
      representation,
      source
    }
  };
}

test("Maths report exposes exact compact evidence signals without inventing a short trend", () => {
  const events = [
    event({ index: 3, correct: false, representation: "part_whole" }),
    event({ index: 2, correct: false, representation: "ten_frame" }),
    event({ index: 1, correct: true, representation: "part_whole", source: "small_group_exit" }),
    event({ index: 0, correct: true, representation: "two_colour_frame", source: "small_group_exit" })
  ];
  const report = buildMathsLearnerReport(events, "s1").find(row => row.skillId === SKILL_ID);
  assert.equal(report.trend.state, "insufficient");
  assert.match(report.trend.label, /at least 5/);
  assert.equal(report.trend.points.length, 4);
  assert.deepEqual(report.representationSignals.map(signal => signal.id), ["part_whole", "ten_frame", "two_colour_frame"]);
  assert.deepEqual(report.sourceSignals.map(signal => signal.label), ["Skills check", "Small-group observation"]);
  assert.ok(report.representationSignals.find(signal => signal.id === "two_colour_frame").current);
});

test("five checked items permit an observed recent-item signal while retaining exact points", () => {
  const events = [
    event({ index: 4, correct: false }),
    event({ index: 3, correct: false }),
    event({ index: 2, correct: true }),
    event({ index: 1, correct: true }),
    event({ index: 0, correct: true })
  ];
  const report = buildMathsLearnerReport(events, "s1").find(row => row.skillId === SKILL_ID);
  assert.equal(report.trend.state, "recent_stronger");
  assert.equal(report.trend.points.length, 5);
  assert.deepEqual(report.trend.points.map(point => point.outcome), ["needs_follow_up", "needs_follow_up", "checked_correct", "checked_correct", "checked_correct"]);
});

test("repeated aligned signals create editable teaching groups while Not checked stays a neutral priority", () => {
  const students = [{ id: "s1", name: "Ari" }, { id: "s2", name: "Bea" }, { id: "s3", name: "Chen" }];
  const events = [
    event({ studentId: "s1", index: 1 }),
    event({ studentId: "s1", index: 0 }),
    event({ studentId: "s2", index: 1 }),
    event({ studentId: "s2", index: 0 })
  ];
  const groups = buildMathsActionGroups(events, students, SKILL_ID);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].possiblePattern, true);
  assert.deepEqual(groups[0].students.map(student => student.id), ["s1", "s2"]);
  assert.match(groups[0].checkQuestion, /^Check whether/);
  assert.doesNotMatch(groups[0].checkQuestion, /diagnos/i);

  const priorities = buildMathsTeachingPriorities(events, students);
  assert.equal(priorities[0].kind, "teach");
  assert.ok(priorities.some(priority => priority.kind === "check" && priority.studentIds.includes("s3")));
  assert.match(priorities.find(priority => priority.kind === "check").summary, /Not checked remains neutral/);
});

test("a possible pattern requires two distinct authored items, not repeats of one item", () => {
  const repeated = [0, 1].map(index => ({
    ...event({ index }),
    evidence: {
      ...event({ index }).evidence,
      sessionId: `different-session-${index}`,
      itemKey: "same-authored-item:v1"
    }
  }));
  const repeatedReport = buildMathsLearnerReport(repeated, "s1").find(row => row.skillId === SKILL_ID);
  assert.deepEqual(repeatedReport.possiblePatterns, []);

  const distinct = repeated.map((row, index) => ({
    ...row,
    evidence: { ...row.evidence, itemKey: `authored-item-${index + 1}:v1` }
  }));
  const distinctReport = buildMathsLearnerReport(distinct, "s1").find(row => row.skillId === SKILL_ID);
  assert.deepEqual(distinctReport.possiblePatterns, ["missing_part_mismatch"]);
});

test("evidence outside the governed conclusion window remains history, not a current result", () => {
  const now = new Date("2026-08-14T12:00:00.000Z");
  const old = {
    ...event({ index: 0, correct: true }),
    occurredAt: new Date(now.getTime() - (REPORTING_BIBLE_POLICY.recency.conclusionWindowDays + 1) * DAY).toISOString()
  };
  const report = mathsSkillReport([old], SKILL_ID, { now });
  assert.equal(report.status, "Not checked");
  assert.equal(report.currentScoredCount, 0);
  assert.equal(report.historicalScoredCount, 1);
  assert.equal(report.trend.state, "insufficient");
  assert.match(report.evidenceNote, new RegExp(`outside the ${REPORTING_BIBLE_POLICY.recency.conclusionWindowDays}-day current conclusion window`));
});

test("reporting keeps assessment direction and purpose visible instead of flattening them", () => {
  const events = [
    { ...event({ index: 1, correct: true }), evidence: { ...event({ index: 1, correct: true }).evidence, responseDirection: "recognition", evidencePurpose: "recognition" } },
    { ...event({ index: 0, correct: true }), evidence: { ...event({ index: 0, correct: true }).evidence, responseDirection: "construction", evidencePurpose: "transfer" } }
  ];
  const report = buildMathsLearnerReport(events, "s1").find(row => row.skillId === SKILL_ID);
  assert.deepEqual(report.responseDirectionSignals.map(signal => signal.id), ["construction", "recognition"]);
  assert.deepEqual(report.assessmentPurposeSignals.map(signal => signal.id), ["recognition", "transfer"]);
  assert.ok(report.responseDirectionSignals.every(signal => signal.current));
  assert.ok(report.assessmentPurposeSignals.every(signal => signal.current));
});

test("extension requires a current teacher observation, not a stale historical source", () => {
  const now = new Date("2026-08-14T12:00:00.000Z");
  const student = { id: "s1", name: "Ari" };
  const oldObservation = {
    ...event({ index: 3, correct: true, representation: "part_whole", source: "small_group_exit" }),
    occurredAt: new Date(now.getTime() - (REPORTING_BIBLE_POLICY.recency.conclusionWindowDays + 1) * DAY).toISOString()
  };
  const current = [
    { ...event({ index: 2, correct: true, representation: "part_whole" }), occurredAt: new Date(now.getTime() - 2 * DAY).toISOString() },
    { ...event({ index: 1, correct: true, representation: "two_colour_frame" }), occurredAt: new Date(now.getTime() - DAY).toISOString() }
  ];
  const report = mathsSkillReport([oldObservation, ...current], SKILL_ID, { now });
  assert.deepEqual(report.currentSources, ["maths_skills_check"]);
  assert.equal(buildMathsClassGroups([oldObservation, ...current], [student], SKILL_ID)["extend"].length, 0);
});

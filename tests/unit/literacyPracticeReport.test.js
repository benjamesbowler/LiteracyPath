import assert from "node:assert/strict";
import test from "node:test";
import { buildLiteracyPracticeReport } from "../../src/utils/literacyPracticeReport.js";
import { REPORTING_BIBLE_POLICY, REPORT_STATUS_IDS } from "../../src/policy/reportingBible.js";

const now = "2026-10-05T12:00:00.000Z";
const skills = [
  { id: "inference", label: "Making inferences", domainId: "reading", domainLabel: "Reading comprehension", suggestion: "Model how a clue and what you already know support an inference." },
  { id: "vocabulary", label: "Vocabulary in context", domainId: "language", domainLabel: "Language" },
  { id: "punctuation", label: "Punctuation", domainId: "language", domainLabel: "Language" }
];
function event(id, overrides = {}, eventOverrides = {}) {
  return {
    id, contentVersion: "literacy-practice-v1", gameId: "literacy-practice", sessionId: "session-1", completedAt: "2026-10-01T10:00:00.000Z",
    practiceOnly: true, formalAssessment: false, masteryClaim: false,
    steps: [{ skillId: "inference", questionId: `question-${id}`, skillName: "Making inferences", level: 1, evidenceType: "independent", presentationRole: "first_probe",
      isCorrect: true, responseStatus: "answered", supportUsed: false, validity: "valid", mediaReady: true,
      selected: "The ground was wet.", expected: "The ground was wet.", occurredAt: "2026-10-01T10:00:00.000Z",
      itemSnapshot: { prompt: "What tells you it rained?", passage: `Synthetic independent passage ${id}.`, expected: "The ground was wet." }, ...overrides }],
    ...eventOverrides
  };
}
function report(events = [], options = {}, recordOptions = {}) {
  return buildLiteracyPracticeReport({ practiceRecord: { v: 3, completions: events, ...recordOptions } }, { now, skills, ...options });
}

test("missing practice retains complete skill coverage without inventing weaknesses or scores", () => {
  const result = buildLiteracyPracticeReport({}, { now, skills });
  assert.equal(result.skills.length, 3);
  assert.equal(result.domains.length, 2);
  assert.equal(result.totals.notYetSampled, 3);
  assert.equal(result.totals.recentIndependentCount, 0);
  assert.equal(result.strengths.length, 0);
  assert.equal(result.skills.every(skill => skill.statusId === REPORT_STATUS_IDS.NOT_CHECKED && skill.coverage === "not_yet_sampled"), true);
  assert.equal(result.nextSteps.every(step => step.type === "collect_sample" && step.reason.includes("no strength or weakness")), true);
  assert.equal(Object.hasOwn(result, "accuracy"), false);
  assert.equal(Object.hasOwn(result, "score"), false);
});

test("sync duplicates and later attempts at the same question cannot inflate independent evidence", () => {
  const first = event("first", { questionId: "same-question", isCorrect: false });
  const replay = event("replay", { questionId: "same-question", occurredAt: "2026-10-02T10:00:00.000Z" });
  const result = report([replay, first, JSON.parse(JSON.stringify(first))]);
  assert.equal(result.responses.length, 2);
  assert.equal(result.totals.independentCount, 1);
  assert.equal(result.totals.independentIncorrect, 1);
  assert.equal(result.totals.independentCorrect, 0);
  assert.equal(result.totals.repeats, 1);
  assert.equal(result.responses.find(response => response.responseId === "replay").classification, "repeat");
  assert.equal(result.nextSteps[0].type, "fresh_probe");
  assert.match(result.nextSteps[0].suggestion, /practice level 1, with a new passage or stimulus/);
});

test("conflicting immutable response IDs are quarantined and explicit conflict markers survive", () => {
  const first = event("conflict", { isCorrect: false });
  const contradictory = event("conflict", { isCorrect: true });
  const result = report([first, contradictory, event("retained-conflict")], {}, { completionConflictIds: ["retained-conflict"] });
  assert.equal(result.totals.independentCount, 0);
  assert.equal(result.totals.conflictingEventIds, 2);
  assert.equal(result.totals.conflicts, 2);
  assert.equal(result.responses.every(response => response.classification === "conflict"), true);
  assert.equal(result.strengths.length, 0);
});

test("a question assigned conflicting skills or levels cannot contribute to either", () => {
  const result = report([
    event("one", { questionId: "identity-conflict", skillId: "inference" }),
    event("two", { questionId: "identity-conflict", skillId: "vocabulary", level: 2 })
  ]);
  assert.equal(result.totals.conflictingQuestionIds, 1);
  assert.equal(result.totals.conflicts, 2);
  assert.equal(result.totals.independentCount, 0);
  assert.equal(result.skills.find(skill => skill.skillId === "inference").statusId, REPORT_STATUS_IDS.NOT_ENOUGH_EVIDENCE);
});

test("simultaneous conflicting answers cannot be sorted into an invented first response", () => {
  const result = report([
    event("a-right", { questionId: "tie" }),
    event("z-wrong", { questionId: "tie", isCorrect: false })
  ]);
  assert.equal(result.totals.conflictingQuestionIds, 1);
  assert.equal(result.totals.independentCount, 0);
});

test("support and a correct fresh transfer do not erase an incorrect first response", () => {
  const result = report([
    event("wrong", { isCorrect: false }),
    event("help", { isCorrect: null, supportUsed: true, evidenceType: "supported", responseStatus: "supported" }),
    event("transfer", { isCorrect: true, presentationRole: "transfer", evidenceType: "independent" })
  ]);
  assert.equal(result.totals.independentIncorrect, 1);
  assert.equal(result.totals.independentCorrect, 0);
  assert.equal(result.totals.supported, 1);
  assert.equal(result.totals.supportedTransfers, 1);
  assert.equal(result.totals.transfers, 1);
  assert.equal(result.totals.transferCorrect, 1);
  assert.equal(result.strengths.length, 0);
  assert.equal(result.responses.find(response => response.responseId === "transfer").countedIndependent, false);
});

test("seeing a supported question first makes a later independent-labeled answer familiar", () => {
  const result = report([
    event("support", { questionId: "same", supportUsed: true, evidenceType: "supported" }),
    event("later", { questionId: "same", occurredAt: "2026-10-03T10:00:00.000Z" })
  ]);
  assert.equal(result.totals.supported, 1);
  assert.equal(result.totals.repeats, 1);
  assert.equal(result.totals.independentCount, 0);
});

test("skips, missing responses, media failures and unheard targets keep separate counters", () => {
  const result = report([
    event("skip", { responseStatus: "skipped", evidenceType: "unscored", isCorrect: null }),
    event("unanswered", { responseStatus: "no_response", evidenceType: "unscored", isCorrect: null }),
    event("media", { responseStatus: "media_failed", evidenceType: "unscored", mediaReady: false, isCorrect: null }),
    event("audio", { audioRequired: true, targetDelivered: false, targetDelivery: "started", audioDelivery: "started" }),
    event("delivered", { audioRequired: true, targetDelivered: true, targetDelivery: "completed", audioDelivery: "delivered" })
  ]);
  assert.equal(result.totals.skipped, 1);
  assert.equal(result.totals.noResponse, 1);
  assert.equal(result.totals.mediaFailed, 1);
  assert.equal(result.totals.audioNotDelivered, 1);
  assert.equal(result.totals.unscored, 4);
  assert.equal(result.totals.independentCount, 1);
});

test("missing or malformed item evidence never turns into a zero or independent result", () => {
  const result = report([
    event("unknown-answer", { isCorrect: null }),
    event("missing-question", { questionId: undefined }),
    event("missing-skill", { skillId: undefined }),
    event("missing-level", { level: null }),
    event("missing-role", { presentationRole: undefined }),
    event("unsupported-evidence", { evidenceType: "unscored" }),
    event("bad-event", {}, { completedAt: "invalid" })
  ]);
  assert.equal(result.totals.independentCount, 0);
  assert.equal(result.totals.independentIncorrect, 0);
  assert.equal(result.totals.incomplete, 6);
  assert.equal(result.totals.invalidRecords, 1);
  assert.equal(result.skills.find(skill => skill.skillId === "vocabulary").coverage, "not_yet_sampled");
  assert.equal(result.skills.find(skill => skill.skillId === "unidentified").independentCount, 0);
});

test("a partial target receipt cannot override an explicitly incomplete required audio sequence", () => {
  const result = report([event("partial-sequence", { audioRequired: true, targetDelivered: true, targetDelivery: "completed", audioDelivery: "not_delivered" })]);
  assert.equal(result.totals.independentCount, 0);
  assert.equal(result.totals.audioNotDelivered, 1);
  assert.equal(result.responses[0].classification, "audio_not_delivered");
});

test("recency follows the reporting policy and historical failures do not drive current teaching", () => {
  const cutoff = Date.parse(now) - REPORTING_BIBLE_POLICY.recency.conclusionWindowDays * 86400000;
  const result = report([
    event("historical", { isCorrect: false, occurredAt: new Date(cutoff - 1).toISOString() }),
    event("boundary", { skillId: "vocabulary", occurredAt: new Date(cutoff).toISOString() }),
    event("future", { skillId: "punctuation", occurredAt: "2026-10-06T10:00:00.000Z" }),
    event("unknown-date", { skillId: "punctuation", occurredAt: "not-a-date" })
  ]);
  assert.equal(result.totals.independentCount, 2);
  assert.equal(result.totals.recentIndependentCount, 1);
  assert.equal(result.totals.historicalIndependentCount, 1);
  assert.equal(result.totals.unknownRecency, 2);
  assert.equal(result.skills[0].coverage, "historical_only");
  assert.equal(result.nextSteps.find(step => step.skillId === "inference").type, "refresh_sample");
  assert.equal(result.nextSteps.some(step => step.type === "teach_and_retry"), false);
  assert.equal(result.strengths.length, 1);
});

test("known external practice familiarity is separate from unknown familiarity", () => {
  const result = report([
    event("known", { priorPracticeExposure: true }),
    event("known-alias", { familiarity: "known_familiar" }),
    event("unknown", { priorPracticeExposure: false, familiarityKnown: false }),
    event("fresh", { familiarity: "known_fresh" })
  ]);
  assert.equal(result.totals.knownFamiliar, 2);
  assert.equal(result.totals.unknownFamiliarity, 1);
  assert.equal(result.totals.independentCount, 2);
  assert.equal(result.responses.find(response => response.responseId === "known").classification, "known_familiar");
  assert.match(result.note, /Familiarity outside recorded practice may be unknown/);
});

test("different challenge levels stay separate and even abundant practice never produces Secure", () => {
  const enough = REPORTING_BIBLE_POLICY.evidenceSufficiency.confidentMinimumScoredItems;
  const events = Array.from({ length: enough }, (_, index) => event(`level-one-${index}`));
  events.push(event("level-two", { level: 2, isCorrect: false }));
  const result = report(events);
  const inference = result.skills[0];
  assert.equal(inference.levels.length, 2);
  assert.equal(inference.levels[0].recentCorrect, enough);
  assert.equal(inference.levels[0].evidenceSufficiency.ready, true);
  assert.equal(inference.levels[1].recentIncorrect, 1);
  assert.equal(inference.levels[1].evidenceSufficiency.ready, false);
  assert.equal(inference.statusId, REPORT_STATUS_IDS.NOT_ENOUGH_EVIDENCE);
  assert.equal(Object.hasOwn(inference, "accuracy"), false);
  assert.equal(Object.hasOwn(inference, "mastery"), false);
});

test("only the exact practice game and content version enter the report", () => {
  const result = report([
    event("included"),
    event("wrong-game", {}, { gameId: "skills-trail" }),
    event("wrong-version", {}, { contentVersion: "other-v1" })
  ]);
  assert.equal(result.responses.length, 1);
  assert.equal(result.totals.sessions, 1);
});

test("reporting leaves immutable input snapshots untouched", () => {
  const source = event("snapshot");
  const snapshot = JSON.stringify(source);
  const result = report([source]);
  assert.equal(JSON.stringify(source), snapshot);
  result.responses[0].itemSnapshot.prompt = "Edited only in report";
  assert.equal(source.steps[0].itemSnapshot.prompt, "What tells you it rained?");
  assert.throws(() => report([], { now: "invalid" }), /valid report date/);
});

test("observed skills get a same-demand fresh check before unexplored catalog skills", () => {
  const catalogue = [
    ["sound-one", "sound_awareness"], ["sound-two", "sound_awareness"],
    ["hfw", "phonics"], ["phonics-two", "phonics"],
    ["vocabulary-one", "vocabulary"], ["vocabulary-two", "vocabulary"],
    ["listening-one", "listening"], ["reading-one", "reading"], ["language-one", "language"],
    ["print-one", "print"], ["writing-one", "writing"]
  ].map(([id, domainId]) => ({ id, label: id, domainId, domainLabel: domainId }));
  const observed = event("hfw-success", { skillId: "hfw" });
  const broad = report([observed], { skills: catalogue });
  assert.equal(broad.nextSteps[0].skillId, "hfw");
  assert.equal(broad.nextSteps[0].type, "fresh_probe");
  assert.equal(broad.nextSteps[0].level, 1);
  assert.equal(broad.nextSteps.find(step => step.skillId === "phonics-two").type, "collect_sample");
  const needsCheck = report([observed, event("writing-error", { skillId: "writing-one", isCorrect: false })], { skills: catalogue });
  assert.deepEqual(new Set(needsCheck.nextSteps.slice(0, 2).map(step => step.skillId)), new Set(["hfw", "writing-one"]));
  assert.equal(needsCheck.nextSteps.some(step => step.type === "teach_and_retry"), false);
});

 test("offered without independent evidence is visible and a repeated passage is familiar across item IDs", () => {
  const snapshot = { prompt: "Choose.", passage: "One shared passage." };
  const result = report([event("one", { itemSnapshot: snapshot, supportUsed: true }), event("two", { itemSnapshot: snapshot, occurredAt: "2026-10-02T10:00:00.000Z" })]);
  assert.equal(result.totals.offeredWithoutIndependentResponse, 1);
  assert.equal(result.totals.notYetSampled, 2);
  assert.equal(result.totals.independentCount, 0);
  assert.equal(result.responses[1].classification, "known_familiar");
  assert.deepEqual(result.responses[1].familiarityReasons, ["passage"]);
  assert.equal(result.responses[1].familiarityStatus, "known_familiar");
});

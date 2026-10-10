import assert from "node:assert/strict";
import test from "node:test";
import { buildLiteracyMockReport, LITERACY_MOCK_REPORT_SKILLS, literacyMockAnswerText, literacyMockResponseText, literacyMockControlError } from "../../src/utils/literacyMockReport.js";
import { REPORTING_BIBLE_POLICY } from "../../src/policy/reportingBible.js";

const now = "2026-10-06T04:00:00.000Z";
const students = [{ id: "b", name: "Zara" }, { id: "a", name: "Alex" }];
const response = (questionId, overrides = {}) => ({ questionId, skillId: "key_details", domainId: "reading", level: 1, responseStatus: "answered", isCorrect: false, evidenceType: "independent", supportUsed: false, knownFamiliar: false, serverReceivedAt: "2026-10-06T03:30:00.000Z", selected: "At home", itemSnapshot: { prompt: "Where did Mina leave her bag?", passage: `Synthetic independent passage ${questionId}.`, expected: "At school" }, ...overrides });
const member = (studentId, responses = [], overrides = {}) => ({ student_id: studentId, connected: true, run: { plan: { itemIds: Array.from({ length: 43 }, (_, index) => `q${index}`) }, responses, status: "running" }, ...overrides });
const build = members => buildLiteracyMockReport({ ok: true, session: { id: "s", mock: { item_count: 43 } }, members }, { now, students });

test("mock reports retain four areas and all 47 skills without treating missing runs as failure", () => {
  const report = build([member("b", [], { run: null }), member("a")]);
  assert.equal(LITERACY_MOCK_REPORT_SKILLS.length, 47);
  assert.deepEqual(report.pupils.map(pupil => pupil.name), ["Alex", "Zara"]);
  assert.equal(report.pupils[1].unsampledItems, 43);
  assert.equal(report.pupils[1].unsampledSkills, 47);
  assert.equal(report.pupils[1].areas.length, 4);
  assert.equal(report.pupils[1].areas.reduce((sum, area) => sum + area.totalSkills, 0), 47);
  assert.equal(report.groups.length, 0);
  assert.equal(report.needsSample.length, 2);
  assert.equal(report.pupils[1].totals.incorrect, 0);
  assert.equal(Object.hasOwn(report, "score"), false);
  assert.equal(Object.hasOwn(report.pupils[1], "accuracy"), false);
});

test("groups carry each pupil's actual error and evidence count, without ranking or proficiency", () => {
  const report = build([member("b", [response("zb"), response("za", { isCorrect: true })]), member("a", [response("aa")])]);
  assert.equal(report.groups.length, 0);
  const group = report.reviewCandidates[0];
  assert.equal(group.skillId, "key_details");
  assert.deepEqual(group.members.map(row => [row.name, row.independentCount, row.incorrectCount]), [["Alex", 1, 1], ["Zara", 2, 1]]);
  assert.equal(group.members[0].examples[0].selected, "At home");
  assert.match(group.suggestion, /different key details example without help/);
  assert.equal(group.members.every(member => member.selected === false && !member.conclusion.ready), true);
  assert.equal(report.pupils[0].skills.find(skill => skill.id === "key_details").evidenceSufficiency.ready, false);
  assert.equal(report.pupils[1].strengths[0].correct, 1);
});

test("supported, familiar, repeated, skipped and media failures remain outside independent groups", () => {
  const report = build([member("a", [response("help", { supportUsed: true, evidenceType: "supported" }), response("known", { knownFamiliar: true }), response("same", { isCorrect: true }), response("same"), response("skip", { responseStatus: "skipped", isCorrect: null }), response("media", { responseStatus: "media_failed", isCorrect: null })])]);
  const pupil = report.pupils[0];
  assert.deepEqual(pupil.totals, { independent: 1, correct: 1, incorrect: 0, supported: 1, familiar: 2, unscored: 1 });
  assert.equal(pupil.answered, 4);
  assert.equal(pupil.unsampledItems, 38);
  assert.equal(pupil.mediaFailureCount, 1);
  assert.equal(report.groups.length, 0);
});

test("independent reading and listening are separate skills inside the same presentation area", () => {
  const report = build([member("a", [response("read"), response("listen", { skillId: "listen_key_details", domainId: "listening", isCorrect: true })])]);
  const pupil = report.pupils[0];
  assert.equal(pupil.skills.find(skill => skill.id === "key_details").incorrect, 1);
  assert.equal(pupil.skills.find(skill => skill.id === "listen_key_details").correct, 1);
  assert.equal(pupil.areas.find(area => area.id === "comprehension").sampledSkills, 2);
  assert.equal(report.groups.length, 0);
  assert.equal(report.reviewCandidates[0].skillId, "key_details");
});

test("older errors remain historical evidence and never create a current teaching group", () => {
  const beforeWindow = new Date(Date.parse(now) - (REPORTING_BIBLE_POLICY.recency.conclusionWindowDays + 1) * 86400000).toISOString();
  const report = build([member("a", [response("old", { serverReceivedAt: beforeWindow })])]);
  assert.equal(report.pupils[0].revisit.length, 1);
  assert.equal(report.pupils[0].responses[0].recent, false);
  assert.equal(report.groups.length, 0);
});

test("missing canonical snapshots, server receipts, unknown skills and invalid levels cannot support a claim", () => {
  const report = build([member("a", [response("no-snapshot", { itemSnapshot: null }), response("no-receipt", { serverReceivedAt: null }), response("unknown", { skillId: "injected" }), response("bad-level", { level: 0 })])]);
  assert.equal(report.pupils[0].totals.independent, 0);
  assert.equal(report.pupils[0].totals.unscored, 4);
  assert.equal(report.groups.length, 0);
  assert.equal(report.pupils[0].responses.length, 4);
  assert.equal(report.pupils[0].skills.length, 47);
});

test("unknown planned count stays missing, invalid dates fail and recovery messages are specific", () => {
  const report = buildLiteracyMockReport({ members: [member("a", [], { run: null })] }, { now });
  assert.equal(report.pupils[0].unsampledItems, null);
  assert.equal(report.pupils[0].name, "Student name unavailable");
  assert.throws(() => buildLiteracyMockReport({}, { now: "bad date" }), /valid report time/);
  assert.match(literacyMockControlError("stale_revision"), /changed elsewhere/);
  assert.match(literacyMockControlError("assessment_finished"), /already finished/);
  assert.match(literacyMockControlError("unexpected"), /could not confirm/);
  assert.equal(literacyMockAnswerText(["one", { label: "two" }, null]), "one, two, Not recorded");
});

test("teaching suggestions separate levels and decode canonical answer IDs for every response format", () => {
  const report = build([member("a", [response("easy"), response("hard", { level: 2 })]), member("b", [response("second-hard", { level: 2 })])]);
  assert.equal(report.groups.length, 0);
  assert.deepEqual(report.reviewCandidates.map(group => [group.level, group.members.length]), [[1, 1], [2, 2]]);
  assert.equal(report.reviewCandidates[1].members[0].independentCount, 1);
  const snapshot = { choices: [{ id: "c0", label: "cat" }, { id: "c1", label: "hat" }] };
  assert.equal(literacyMockResponseText("c1", snapshot), "hat");
  assert.equal(literacyMockResponseText(["c1", "c0"], { ...snapshot, format: "order" }), "hat → cat");
  assert.equal(literacyMockResponseText(["c0", "c1"], { ...snapshot, format: "multi_select" }), "cat, hat");
  assert.equal(literacyMockResponseText(["c0", "c1"], { ...snapshot, format: "match", matchTargets: [{ label: "kitten" }, { label: "cap" }] }), "kitten → cat; cap → hat");
  assert.equal(literacyMockResponseText("ship", { format: "build_word" }), "ship");
  assert.equal(literacyMockResponseText(null, snapshot), "Not recorded");
});

test("a skipped or unavailable-media item does not claim literacy skill coverage", () => {
  const report = buildLiteracyMockReport({ session: { mock: { item_count: 24 } }, members: [{ student_id: "s", run: { plan: { itemIds: ["missing-audio", "skipped"] }, responses: [
    { questionId: "missing-audio", skillId: "letter_knowledge", level: 1, responseStatus: "media_failed", isCorrect: null },
    { questionId: "skipped", skillId: "rhyming", level: 1, responseStatus: "skipped", isCorrect: null }
  ] } }] });
  const pupil = report.pupils[0];
  assert.equal(pupil.unsampledSkills, 47);
  assert.equal(pupil.areas.reduce((sum, area) => sum + area.sampledSkills, 0), 0);
  assert.equal(pupil.totals.unscored, 1);
  assert.equal(pupil.mediaFailureCount, 1);
  assert.equal(pupil.unsampledItems, 1);
  assert.equal(pupil.noIndependentEvidence, true);
  assert.deepEqual(report.groups, []);
});

test("canonical media-failure ledger never consumes answer slots or creates learning evidence", () => {
  const report = buildLiteracyMockReport({ session: { mock: { item_count: 24 } }, members: [{ student_id: "s", run: {
    plan: { itemIds: Array.from({ length: 24 }, (_, index) => `new-${index}`) }, responses: [],
    mediaFailures: [response("failed-shared-audio", { responseStatus: "media_failed", failedMediaPaths: ["/audio/shared.mp3"] })]
  } }] }, { now });
  const pupil = report.pupils[0];
  assert.equal(pupil.answered, 0); assert.equal(pupil.processed, 0); assert.equal(pupil.unsampledItems, 24);
  assert.equal(pupil.unsampledSkills, 47); assert.equal(pupil.mediaFailureCount, 1);
  assert.deepEqual(pupil.totals, { independent: 0, correct: 0, incorrect: 0, supported: 0, familiar: 0, unscored: 0 });
  assert.equal(pupil.mediaFailures[0].isCorrect, null); assert.equal(pupil.mediaFailures[0].evidenceType, "unscored");
  assert.deepEqual(pupil.strengths, []); assert.deepEqual(pupil.revisit, []); assert.deepEqual(report.groups, []);
});

test("only enough recent comparable independent evidence can support a teaching-group suggestion", () => {
  const minimum = REPORTING_BIBLE_POLICY.evidenceSufficiency.judgementMinimumScoredItems;
  const responses = Array.from({ length: minimum }, (_, index) => response(`policy-${index}`));
  const ready = build([member("a", responses)]);
  assert.equal(ready.groups.length, 1);
  assert.equal(ready.groups[0].members[0].conclusion.ready, true);
  assert.equal(ready.groups[0].members[0].selected, false);
  const sparse = build([member("a", responses.slice(1))]);
  assert.equal(sparse.groups.length, 0);
  const mixedAccess = build([member("a", responses.map((value, index) => ({ ...value,
    itemSnapshot: { ...value.itemSnapshot, passageAccess: index % 2 ? "text_only" : "text_and_audio" } })))]);
  assert.equal(mixedAccess.groups.length, 0);
  assert.equal(mixedAccess.reviewCandidates.length, 2);
});


test("recorded offers separate helped, familiar, skipped and failed-media presentations from absent skills", () => {
  const pupil = build([member("a", [
    response("independent"),
    response("helped", { skillId: "main_idea", supportUsed: true, evidenceType: "supported" }),
    response("familiar", { skillId: "inference", knownFamiliar: true }),
    response("skip", { skillId: "rhyming", responseStatus: "skipped", isCorrect: null }),
    response("media", { skillId: "letter_knowledge", responseStatus: "media_failed", isCorrect: null })
  ])]).pupils[0];
  assert.equal(pupil.notOfferedSkills, 42);
  assert.equal(pupil.offeredWithoutIndependentResponse, 4);
  assert.equal(pupil.skills.find(skill => skill.id === "key_details").offeredWithoutIndependentResponse, false);
  for (const id of ["main_idea", "inference", "rhyming", "letter_knowledge"]) {
    assert.equal(pupil.skills.find(skill => skill.id === id).offeredWithoutIndependentResponse, true, id);
  }
  assert.equal(pupil.areas.reduce((sum, area) => sum + area.offeredSkills, 0), 5);
  assert.equal(pupil.areas.reduce((sum, area) => sum + area.independentSkills, 0), 1);
  assert.equal(pupil.totals.independent, 1);
  assert.equal(pupil.mediaFailureCount, 1);
});

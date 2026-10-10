import assert from "node:assert/strict";
import test from "node:test";
import { buildLiteracyMockReport, LITERACY_MOCK_REPORT_SKILLS, literacyMockAnswerText, literacyMockResponseText, literacyMockControlError, literacyMockReportConditions } from "../../src/utils/literacyMockReport.js";
import { REPORTING_BIBLE_POLICY } from "../../src/policy/reportingBible.js";
import { loadLiteracyMockBank } from "../../src/data/literacyMockBank.js";
import { canonicalLiteracyIdentity } from "../../src/utils/literacyEvidence.js";

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

test('server presentations distinguish a shown unanswered question from the rest of an unseen form', () => {
  const shown = { questionId: 'q0', skillId: 'key_details', domainId: 'reading', level: 1,
    itemSnapshot: { prompt: 'Where did Mina go?', modality: 'reading' }, serverReceivedAt: now, presentationStatus: 'presented' };
  const report = build([member('a', [], { run: { plan: { itemIds: ['q0', 'q1', 'q2'] }, responses: [],
    presentations: [shown, shown], presentationTracking: true, status: 'completed' } })]);
  const pupil = report.pupils[0];
  assert.equal(pupil.unansweredItems, 3);
  assert.equal(pupil.presentedUnansweredItems, 1);
  assert.equal(pupil.notReachedItems, 2);
  assert.equal(pupil.notOfferedSkills, 46);
  assert.equal(pupil.offeredWithoutIndependentResponse, 1);
  assert.equal(pupil.totals.independent, 0);
  assert.equal(pupil.totals.unscored, 0);
  assert.equal(pupil.unansweredPresentations[0].classification, 'unanswered');
  assert.equal(pupil.skills.find(skill => skill.id === 'key_details').recordedOffers, 1);
  assert.equal(pupil.skills.find(skill => skill.id === 'key_details').unansweredPresentationCount, 1);
  assert.equal(report.reviewCandidates.length, 0);
});

test('answered and media-failed receipts do not double count offers or remain unanswered presentations', () => {
  const answered = response('q0');
  const failed = response('failed', { responseStatus: 'media_failed', skillId: 'rhyming' });
  const report = build([member('a', [], { run: { plan: { itemIds: ['q0', 'replacement'] }, responses: [answered],
    mediaFailures: [failed], presentations: [answered, failed], presentationTracking: true } })]);
  const pupil = report.pupils[0];
  assert.equal(pupil.presentedUnansweredItems, 0);
  assert.equal(pupil.notReachedItems, 1);
  assert.equal(pupil.unansweredItems, 1);
  assert.equal(pupil.skills.find(skill => skill.id === 'key_details').recordedOffers, 1);
  assert.equal(pupil.skills.find(skill => skill.id === 'rhyming').recordedOffers, 1);
  assert.equal(pupil.mediaFailureCount, 1);
});

test('historical missing presentation tracking stays unknown and help requests remain separate events', () => {
  const requests = [{ questionId: 'q0', helpRequested: true, pending: true, assistanceType: 'none' },
    { questionId: 'q1', helpRequested: true, pending: false, assistanceType: 'access' }];
  const pupil = build([member('a', [], { run: { plan: { itemIds: ['q0', 'q1'] }, responses: [], presentations: [], helpRequests: requests } })]).pupils[0];
  assert.equal(pupil.notReachedItems, null);
  assert.equal(pupil.presentedUnansweredItems, null);
  assert.equal(pupil.presentationTracking, false);
  assert.equal(pupil.unansweredItems, 2);
  assert.deepEqual(pupil.helpRequests, requests);
  assert.deepEqual(pupil.pendingHelpRequests, [requests[0]]);
});

test('fresh-check review focus retains exact machine access conditions beyond the broad display label', () => {
  const report = build([member('a', [response('plain', { itemSnapshot: { prompt: 'Choose a word.', constructClaim: 'agreement', modality: 'recognition' } }),
    response('oral', { itemSnapshot: { prompt: 'Choose a word.', constructClaim: 'agreement', modality: 'recognition', evidenceModality: 'audio+text', oralLanguageAccess: true } })])]);
  assert.equal(report.reviewCandidates.length, 2);
  assert.equal(report.reviewCandidates[0].focus.construct, 'agreement');
  assert.notEqual(report.reviewCandidates[0].focus.modality, report.reviewCandidates[1].focus.modality);
  assert.deepEqual(new Set(report.reviewCandidates.map(group => group.sourceQuestionId)), new Set(['plain', 'oral']));
});

test('dated compatible evidence accumulates across prior sessions without changing current sitting counts', () => {
  const prior = Array.from({ length: 8 }, (_, index) => response(`prior-${index}`, { serverReceivedAt: '2026-10-05T03:30:00.000Z' }));
  const current = [response('current-0'), response('current-1')];
  const report = buildLiteracyMockReport({ session: { id: 'current', content_version: 'literacy-mock-v3', mock: { item_count: 24 } }, members: [
    { ...member('a', current), priorRuns: [{ assignmentId: 'earlier', studentId: 'a', contentVersion: 'literacy-mock-v3', responses: prior }],
      historyCoverage: { limit: 20, windowDays: 90, truncated: false } }
  ] }, { students, now });
  const pupil = report.pupils[0];
  assert.equal(pupil.totals.independent, 2);
  assert.equal(pupil.longitudinal.available, true);
  assert.equal(pupil.longitudinal.patterns.length, 1);
  const pattern = pupil.longitudinal.patterns[0];
  assert.equal(pattern.responses.length, 10);
  assert.equal(pattern.sessionCount, 2);
  assert.equal(pattern.teachingReviewEligible, true);
  assert.equal(pattern.firstObservedAt, '2026-10-05T03:30:00.000Z');
  assert.equal(pattern.lastObservedAt, '2026-10-06T03:30:00.000Z');
  assert.deepEqual(new Set(pattern.responses.map(value => value.sourceSessionId)), new Set(['earlier', 'current']));
  assert.equal(report.groups[0].members[0].selected, false);
  assert.equal(report.groups[0].members[0].sourceSessionId, 'current');
});

test('longitudinal patterns exclude reused stimuli, help, stale receipts, other pupils and content versions', () => {
  const current = response('shared', { itemSnapshot: { prompt: 'Read.', passage: 'Same passage.' } });
  const prior = [response('original', { itemSnapshot: { prompt: 'Read.', passage: 'Same passage.' }, serverReceivedAt: '2026-10-05T03:30:00.000Z' }),
    response('helped', { assistanceType: 'answer', evidenceType: 'supported' }),
    response('stale', { serverReceivedAt: '2025-01-01T03:30:00.000Z' }),
    response('different-access', { itemSnapshot: { passage: 'Oral passage', passageAccess: 'text_and_audio' } }),
    response('harder', { level: 2 })];
  const report = buildLiteracyMockReport({ session: { id: 'current', content_version: 'literacy-mock-v3' }, members: [{ ...member('a', [current]), priorRuns: [
    { assignmentId: 'earlier', studentId: 'a', contentVersion: 'literacy-mock-v3', responses: prior },
    { assignmentId: 'foreign', studentId: 'b', contentVersion: 'literacy-mock-v3', responses: [response('other-child')] },
    { assignmentId: 'old-bank', studentId: 'a', contentVersion: 'literacy-mock-v2', responses: [response('other-bank')] }
  ] }] }, { students, now });
  const evidence = report.pupils[0].longitudinal;
  assert.equal(evidence.responses.find(value => value.questionId === 'shared').classification, 'familiar');
  assert.equal(evidence.responses.some(value => ['other-child', 'other-bank'].includes(value.questionId)), false);
  assert.equal(evidence.patterns.length, 3);
  assert.equal(evidence.patterns.reduce((sum, pattern) => sum + pattern.responses.length, 0), 3);
  assert.equal(report.groups.length, 0);
});

test('late help in an earlier response removes it from the cumulative threshold while preserving the first answer', () => {
  const prior = Array.from({ length: 8 }, (_, index) => response(`prior-${index}`));
  prior[0] = { ...prior[0], assistanceType: 'answer', evidenceType: 'supported' };
  const report = buildLiteracyMockReport({ session: { id: 'current' }, members: [{ ...member('a', [response('new-1'), response('new-2')]), priorRuns: [
    { assignmentId: 'prior', responses: prior }
  ] }] }, { students, now });
  assert.equal(report.pupils[0].longitudinal.responses[0].selected, 'At home');
  assert.equal(report.pupils[0].longitudinal.patterns[0].responses.length, 9);
  assert.equal(report.pupils[0].longitudinal.patterns[0].teachingReviewEligible, false);
  assert.equal(report.groups.length, 0);
});

test('recent successful checks replace older errors for current suggestions without erasing dated totals', async () => {
  const bank = await loadLiteracyMockBank();
  const identities = { items: new Set(), passages: new Set(), families: new Set() };
  const distinct = bank.filter(item => {
    if (item.skillId !== 'initial_sounds' || item.level !== 1 || item.constructClaim !== 'initial_sound_grapheme_mapping') return false;
    const identity = canonicalLiteracyIdentity(item);
    if (identities.items.has(identity.itemId) || identities.passages.has(identity.passageKey) || identities.families.has(identity.familyId)) return false;
    identities.items.add(identity.itemId); identities.passages.add(identity.passageKey); identities.families.add(identity.familyId);
    return true;
  }).slice(0, 42);
  assert.equal(distinct.length, 42, 'reproduction uses distinct canonical ready-bank items');
  const makeResponse = (item, isCorrect, serverReceivedAt) => response(item.id, { itemSnapshot: item.itemSnapshot,
    skillId: item.skillId, domainId: item.domainId, level: item.level, administration: 'rehearsal', isCorrect, serverReceivedAt });
  const priorRuns = Array.from({ length: 5 }, (_, index) => ({ assignmentId: `august-${index}`, studentId: 'a',
    contentVersion: 'literacy-mock-v3', windowMode: 'pause_at_window_end', durationSeconds: 600,
    responses: distinct.slice(index * 6, index * 6 + 6).map(item => makeResponse(item, false, `2026-08-${10 + index}T02:00:00Z`)) }));
  priorRuns.push({ assignmentId: 'recent', studentId: 'a', contentVersion: 'literacy-mock-v3', windowMode: 'pause_at_window_end', durationSeconds: 600,
    responses: distinct.slice(30, 36).map(item => makeResponse(item, true, '2026-10-09T02:00:00Z')) });
  const report = buildLiteracyMockReport({ session: { id: 'current', content_version: 'literacy-mock-v3',
    mock: { item_count: 6, window_mode: 'pause_at_window_end', duration_seconds: 600 } },
  members: [{ ...member('a', distinct.slice(36).map(item => makeResponse(item, true, '2026-10-10T02:00:00Z'))), priorRuns }] },
  { students, now: '2026-10-10T04:00:00Z' });
  const pupil = report.pupils[0]; const pattern = pupil.longitudinal.patterns[0];
  assert.equal(pupil.totals.correct, 6);
  assert.equal(pattern.responses.length, 42); assert.equal(pattern.incorrect, 30);
  assert.equal(pattern.currentSample.responses.length, 12, 'same-time boundary ties are preserved');
  assert.equal(pattern.currentSample.correct, 12); assert.equal(pattern.currentSample.incorrect, 0);
  assert.equal(pattern.conclusion.attempts, 12); assert.equal(pattern.teachingReviewEligible, false);
  assert.equal(report.groups.length, 0);
  assert.equal(report.reviewCandidates[0].members[0].examples.length, 30, 'older actual errors remain inspectable');
  assert.equal(report.reviewCandidates[0].members[0].currentSample.correct, 12);
});

test('new comparable errors can suggest review after older successes, with no new evidence threshold', () => {
  const minimum = REPORTING_BIBLE_POLICY.evidenceSufficiency.judgementMinimumScoredItems;
  const old = Array.from({ length: minimum * 3 }, (_, i) => response(`good-${i}`, { isCorrect: true, serverReceivedAt: '2026-09-01T02:00:00Z' }));
  const latest = Array.from({ length: minimum }, (_, i) => response(`error-${i}`, { serverReceivedAt: `2026-10-06T03:${String(i).padStart(2, '0')}:00Z` }));
  const report = buildLiteracyMockReport({ session: { id: 'current' }, members: [{ ...member('a', latest), priorRuns: [{ assignmentId: 'old', responses: old }] }] }, { students, now });
  const pattern = report.pupils[0].longitudinal.patterns[0];
  assert.equal(pattern.correct, minimum * 3);
  assert.equal(pattern.currentSample.responses.length, minimum);
  assert.equal(pattern.currentSample.incorrect, minimum);
  assert.equal(pattern.teachingReviewEligible, true);
  assert.equal(report.groups[0].members[0].conclusion.attempts, minimum);
});

test('later supported, pending or incomplete success cannot replace the independent current sample', () => {
  const minimum = REPORTING_BIBLE_POLICY.evidenceSufficiency.judgementMinimumScoredItems;
  const old = Array.from({ length: minimum }, (_, i) => response(`old-error-${i}`, { serverReceivedAt: '2026-10-05T02:00:00Z' }));
  const unsupported = Array.from({ length: minimum }, (_, i) => response(`excluded-${i}`, { isCorrect: true,
    ...(i % 3 === 0 ? { supportUsed: true, evidenceType: 'supported' } : i % 3 === 1 ? { supportPending: true } : { itemSnapshot: null }) }));
  const report = buildLiteracyMockReport({ session: { id: 'current' }, members: [{ ...member('a', unsupported), priorRuns: [{ assignmentId: 'old', responses: old }] }] }, { students, now });
  const pattern = report.pupils[0].longitudinal.patterns[0];
  assert.equal(pattern.currentSample.responses.length, minimum);
  assert.equal(pattern.currentSample.incorrect, minimum);
  assert.equal(pattern.teachingReviewEligible, true);
  assert.equal(report.pupils[0].totals.independent, 0);
});

test('source window behavior and duration separate cumulative evidence, including unknown legacy conditions', () => {
  const priorRuns = [
    { assignmentId: 'timed-ten', windowMode: 'timed_sample', durationSeconds: 600, timeExtensionCount: 0, responses: [response('timed-ten')] },
    { assignmentId: 'timed-extended', windowMode: 'timed_sample', durationSeconds: 600, timeExtensionCount: 1, responses: [response('timed-extended')] },
    { assignmentId: 'timed-twenty', windowMode: 'timed_sample', durationSeconds: 1200, responses: [response('timed-twenty')] },
    { assignmentId: 'pause', windowMode: 'pause_at_window_end', durationSeconds: 1200, responses: [response('pause')] },
    { assignmentId: 'legacy', responses: [response('legacy')] },
  ];
  const report = buildLiteracyMockReport({ session: { id: 'current', mock: { window_mode: 'pause_at_window_end', duration_seconds: 1200 } },
    members: [{ ...member('a', [response('current')]), priorRuns }] }, { students, now });
  const patterns = report.pupils[0].longitudinal.patterns;
  assert.equal(patterns.length, 5);
  assert.equal(report.reviewCandidates.length, 5);
  const pause = patterns.find(pattern => pattern.responses.some(value => value.questionId === 'current'));
  assert.equal(pause.responses.length, 2);
  assert.match(pause.conditions.administration, /Teacher-resumable rehearsal.*20-minute initial break window/);
  const legacy = patterns.find(pattern => pattern.responses.some(value => value.questionId === 'legacy'));
  assert.equal(legacy.responses.length, 1);
  assert.equal(legacy.responses[0].sourceWindowMode, null, 'older unknown mode must not borrow the open session mode');
  assert.match(legacy.conditions.administration, /Window behavior not recorded/);
  assert.match(literacyMockReportConditions(patterns.find(pattern => pattern.responses[0].questionId === 'timed-ten').responses[0]).administration, /Timed sample.*10-minute initial limit.*No time extensions/);
  assert.match(patterns.find(pattern => pattern.responses[0].questionId === 'timed-extended').conditions.administration, /10-minute initial limit.*1 time extension recorded/);
  assert.equal(report.pupils[0].responses[0].sourceWindowMode, 'pause_at_window_end');
});

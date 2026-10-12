import assert from "node:assert/strict";
import test from "node:test";
import { controlLiteracyMockSession, prepareLiteracyMockSession, getStudentLiteracyMockRun, saveStudentLiteracyMockRun,
  listLiteracyMockSessions, getLiteracyMockReport, recordLiteracyMockEvent, resolveLiteracyMockSupport, prepareLiteracyMockFreshCheck, prepareLiteracyMockEntryCheck, getLiteracyMockFreshCapacity,
  requireLiteracyMockSuccess, literacyMockMutationReceiptContext, verifyLiteracyMockMutationReceipt } from "../../src/data/literacyMockSessionCore.js";
import { BOUNDARY_RPCS, validateSupabaseResponse } from "../../src/data/boundaries/client.js";

test("mock boundary sends only assignment token and immutable mutation inputs", async () => {
  const calls = [];
  const client = { call: async (name, args) => { calls.push({ name, args }); return { data: { ok: true }, error: null }; } };
  await prepareLiteracyMockSession({ client, classId: "class", wholeClass: true });
  await controlLiteracyMockSession({ client, sessionId: "session", action: "pause", expectedRevision: 3, requestId: "pause-3" });
  await getStudentLiteracyMockRun({ client, token: "opaque", sessionId: "session" });
  const response = { questionId: "q1", selected: "c0", audioDelivery: {} };
  await saveStudentLiteracyMockRun({ client, token: "opaque", sessionId: "session", expectedRevision: 4, requestId: "answer-4", response });
  await listLiteracyMockSessions({ client, classId: "class" });
  await getLiteracyMockReport({ client, sessionId: "session" });
  assert.deepEqual(calls[0], { name: "teacher_prepare_literacy_mock_session_v4", args: { p_class_id: "class", p_student_ids: [], p_whole_class: true, p_duration_minutes: 20, p_item_count: 43, p_request_id: null, p_window_mode: "pause_at_window_end" } });
  assert.deepEqual(calls[3].args, { p_token: "opaque", p_session_id: "session", p_request_id: "answer-4", p_expected_revision: 4, p_plan: null, p_response: response });
  assert.equal(calls.every(call => BOUNDARY_RPCS.includes(call.name)), true);
  assert.equal(calls.some(call => Object.hasOwn(call.args, "p_student_id")), false);
  assert.equal(calls.some(call => /progress|mastery/.test(call.name)), false);
});

test("offline and transport failures stay failures", async () => {
  await assert.rejects(getStudentLiteracyMockRun({ token: "opaque", sessionId: "session" }), /offline/);
  const error = new Error("save unavailable");
  await assert.rejects(saveStudentLiteracyMockRun({ client: { call: async () => ({ data: null, error }) } }), error);
});

test("mock clock and run envelopes reject malformed server content", () => {
  const name = "student_get_literacy_mock_run";
  const mock = { state: "running", revision: 1, item_count: 24, remaining_seconds: 1200, server_now: "2026-10-06T10:00:00.000Z" };
  const run = { schemaVersion: 1, contentVersion: "literacy-mock-v1", assignmentId: "session", studentId: "child", revision: 1, plan: { itemIds: ["q1"], seed: "seed" }, responses: [], status: "ready" };
  assert.doesNotThrow(() => validateSupabaseResponse("rpc", name, { data: { ok: true, mock, run }, error: null }));
  assert.doesNotThrow(() => validateSupabaseResponse("rpc", name, { data: { ok: true, mock: { ...mock, content_version: "literacy-mock-v2" }, run: { ...run, contentVersion: "literacy-mock-v2" } }, error: null }));
  for (const bad of [{ ...mock, state: "expired-client-clock" }, { ...mock, revision: "1" }, { ...mock, remaining_seconds: -1 }]) {
    assert.throws(() => validateSupabaseResponse("rpc", name, { data: { ok: true, mock: bad }, error: null }));
  }
  for (const bad of [{ ...run, contentVersion: "future" }, { ...run, plan: { itemIds: [null] } }, { ...run, responses: [{}, {}] },
    { ...run, mediaFailures: {} }, { ...run, mediaFailures: Array(129).fill({}) }]) {
    assert.throws(() => validateSupabaseResponse("rpc", name, { data: { ok: true, run: bad }, error: null }));
  }
});


test("v3 evidence mutations use scoped identities and exact idempotency keys", async () => {
  const calls = [];
  const client = { call: async (name, args) => { calls.push({ name, args }); return { data: { ok: true }, error: null }; } };
  await recordLiteracyMockEvent({ client, token: "opaque", sessionId: "session", questionId: "q1", event: "help_cancelled", requestId: "cancel-1" });
  await resolveLiteracyMockSupport({ client, sessionId: "session", studentId: "child", questionId: "q1", assistance: "access", requestId: "resolve-1" });
  await prepareLiteracyMockFreshCheck({ client, sourceSessionId: "session", studentId: "child", questionId: "q1", requestId: "fresh-1" });
  assert.deepEqual(calls[0], { name: "student_record_literacy_mock_event", args: { p_token: "opaque", p_session_id: "session", p_question_id: "q1", p_event: "help_cancelled", p_request_id: "cancel-1" } });
  assert.deepEqual(calls[1], { name: "teacher_resolve_literacy_mock_support", args: { p_session_id: "session", p_student_id: "child", p_question_id: "q1", p_assistance: "access", p_request_id: "resolve-1" } });
  assert.deepEqual(calls[2], { name: "teacher_prepare_literacy_mock_fresh_check", args: { p_source_session_id: "session", p_student_id: "child", p_question_id: "q1", p_request_id: "fresh-1" } });
  await prepareLiteracyMockEntryCheck({ client, sourceSessionId: "session", studentId: "child", skillId: "rhyming", requestId: "entry-1" });
  assert.deepEqual(calls[3], { name: "teacher_prepare_literacy_mock_entry_check", args: { p_source_session_id: "session", p_student_id: "child", p_skill_id: "rhyming", p_request_id: "entry-1" } });
  for (const call of calls) assert.ok(BOUNDARY_RPCS.includes(call.name));
  assert.equal(Object.hasOwn(calls[0].args, "p_student_id"), false);
});


test("fresh capacity uses an abortable count-only RPC and rejects misleading envelopes", async () => {
  const calls = [];
  const signal = new AbortController().signal;
  const client = { call: (name, args) => {
    calls.push({ name, args });
    return { abortSignal: received => { assert.equal(received, signal); return Promise.resolve({ data: { ok: true }, error: null }); } };
  } };
  await getLiteracyMockFreshCapacity({ client, sourceSessionId: "source", studentId: "child", questionId: "q1", signal });
  await getLiteracyMockFreshCapacity({ client, sourceSessionId: "source", studentId: "child", skillId: "rhyming", signal });
  const name = "teacher_get_literacy_mock_fresh_capacity";
  assert.deepEqual(calls, [
    { name, args: { p_source_session_id: "source", p_student_id: "child", p_question_id: "q1", p_skill_id: null } },
    { name, args: { p_source_session_id: "source", p_student_id: "child", p_question_id: null, p_skill_id: "rhyming" } },
  ]);
  assert.ok(BOUNDARY_RPCS.includes(name));
  const capacity = { contentVersion: "literacy-mock-v3", sourceSessionId: "source", studentId: "child", questionId: "q1", skillId: null,
    focus: { skillId: "rhyming", domainId: "sound_awareness", construct: "heard_rhyme", modality: "listening", level: 1 },
    remainingCount: 9, countKind: "lower_bound", checkItemCount: 6, checkedAt: "2026-10-10T10:00:00Z", taskCeiling: null };
  const validate = value => validateSupabaseResponse("rpc", name, { data: { ok: true, capacity: value }, error: null });
  assert.doesNotThrow(() => validate(capacity));
  assert.doesNotThrow(() => validate({ ...capacity, remainingCount: 0, countKind: "exact", checkItemCount: 0 }));
  for (const bad of [null, { ...capacity, remainingCount: -1 }, { ...capacity, remainingCount: 2, checkItemCount: 6 },
    { ...capacity, remainingCount: 0, checkItemCount: 0 }, { ...capacity, countKind: "raw_rows" },
    { ...capacity, focus: null }, { ...capacity, focus: { ...capacity.focus, level: "1" } },
    { ...capacity, studentId: null }, { ...capacity, skillId: "rhyming" }, { ...capacity, questionId: null },
    { ...capacity, contentVersion: "literacy-mock-v2" }, { ...capacity, checkedAt: "not a date" },
    { ...capacity, candidateItemIds: ["private-item"] }]) assert.throws(() => validate(bad));
  assert.doesNotThrow(() => validateSupabaseResponse("rpc", name, { data: { ok: false, error: "mock_v3_unavailable" }, error: null }));
  assert.doesNotThrow(() => validate({ ...capacity, contentVersion: 'literacy-mock-v4' }));
});

test('v4 retains presentation and assistance tracking at the client boundary', () => {
  const name='student_get_literacy_mock_run';
  const run={schemaVersion:2,contentVersion:'literacy-mock-v4',assignmentId:'session',studentId:'child',revision:0,
    eventRevision:0,presentationTracking:true,presentations:[],helpRequests:[],plan:{itemIds:['q1'],seed:'seed'},responses:[],status:'ready'};
  const mock={content_version:'literacy-mock-v4',state:'running',revision:0,item_count:24,remaining_seconds:1200,server_now:new Date().toISOString()};
  assert.doesNotThrow(()=>validateSupabaseResponse('rpc',name,{data:{ok:true,mock,run},error:null}));
  assert.throws(()=>validateSupabaseResponse('rpc',name,{data:{ok:true,mock,run:{...run,schemaVersion:1}},error:null}));
});

test('preparation retries retain their original version without sending client version metadata to an RPC', async () => {
  const calls = [], client = { call: async (name, args) => { calls.push({ name, args }); return { data: { ok: true } }; } };
  const payload = { client, classId: 'class', requestId: 'original', windowMode: 'pause_at_window_end' };
  await prepareLiteracyMockSession({ ...payload, legacyPending: true });
  await prepareLiteracyMockSession({ ...payload, contentVersion: 'literacy-mock-v4', legacyPending: true });
  await prepareLiteracyMockSession(payload);
  assert.deepEqual(calls.map(call => call.name), ['teacher_prepare_literacy_mock_session_v3', 'teacher_prepare_literacy_mock_session_v4', 'teacher_prepare_literacy_mock_session_v4']);
  assert.deepEqual(calls[0].args, calls[1].args);
  assert.ok(calls.every(call => !Object.hasOwn(call.args, 'contentVersion') && !Object.hasOwn(call.args, 'legacyPending')));
  assert.throws(() => prepareLiteracyMockSession({ ...payload, contentVersion: 'unknown' }), /Unsupported/);
});

test('only an explicit false result is a confirmed rejection', () => {
  for (const result of [null, undefined, {}, { ok: 'true' }, { ok: 1 }, { error: 'network' }]) {
    assert.throws(() => requireLiteracyMockSuccess(result), error => error.confirmedRejection === false);
  }
  assert.throws(() => requireLiteracyMockSuccess({ ok: false, error: 'stale_revision' }), error => error.confirmedRejection === true && error.code === 'stale_revision');
});

test('learner receipts verify assignment, learner, version, revision and the immutable requested response prefix', () => {
  const scope = { sessionId: 'session', studentId: 'child', contentVersion: 'literacy-mock-v4' };
  const first = { questionId: 'q0', selected: 'c0', responseStatus: 'answered', supportUsed: false };
  const answer = { questionId: 'q1', selected: 'c1', responseStatus: 'answered' };
  const before = { ...scope, assignmentId: scope.sessionId, revision: 3, eventRevision: 4,
    plan: { itemIds: ['q0', 'q1', 'q2'], seed: 'saved' }, responses: [first] };
  const receiptContext = literacyMockMutationReceiptContext(before, scope.contentVersion);
  const request = { expectedRevision: 3, response: answer, receiptContext };
  const after = { ...before, revision: 4, responses: [first, answer] };
  const verify = run => verifyLiteracyMockMutationReceipt({ ok: true, run }, request, scope);
  assert.doesNotThrow(() => verify(after));
  for (const invalid of [undefined, { ...after, assignmentId: 'other' }, { ...after, studentId: 'other' },
    { ...after, contentVersion: 'literacy-mock-v3' }, { ...after, revision: 3 },
    { ...after, responses: [first] }, { ...after, responses: [{ ...first, selected: 'c1' }, answer] },
    { ...after, responses: [first, { ...answer, selected: 'c0' }] },
    { ...after, responses: [first, { questionId: 'q2', responseStatus: 'skipped' }, answer] }]) assert.throws(() => verify(invalid));
  assert.doesNotThrow(() => verify({ ...after, revision: 9, responses: [{ ...first, supportUsed: true, evidenceType: 'supported' }, answer, { questionId: 'q2', selected: 'c0', responseStatus: 'answered' }] }));
  const noop = { expectedRevision: 3, plan: before.plan, receiptContext };
  assert.doesNotThrow(() => verifyLiteracyMockMutationReceipt({ ok: true, duplicate: true, run: before }, noop, scope));
  const later = { ...after, revision: 8, plan: { ...before.plan, itemIds: ['q0', 'q1', 'replacement'] } };
  assert.doesNotThrow(() => verifyLiteracyMockMutationReceipt({ ok: true, duplicate: true, run: later }, noop, scope));
  assert.throws(() => verifyLiteracyMockMutationReceipt({ ok: true, run: later }, noop, scope));
  const failure = { questionId: 'q1', responseStatus: 'media_failed', selected: null, failedMediaPaths: ['/art.png'] };
  assert.doesNotThrow(() => verifyLiteracyMockMutationReceipt({ ok: true, run: { ...before, revision: 4, mediaFailures: [{ ...failure, failedMediaPaths: ['/art.png#cell-1'] }] } },
    { expectedRevision: 3, response: failure, receiptContext }, scope));
  const event = { type: 'event', event: 'presented', questionId: 'q1', receiptContext };
  assert.doesNotThrow(() => verifyLiteracyMockMutationReceipt({ ok: true, run: { ...before, eventRevision: 5, presentations: [{ questionId: 'q1' }] } }, event, scope));
  assert.throws(() => verifyLiteracyMockMutationReceipt({ ok: true, run: { ...before, presentations: [{ questionId: 'q1' }] } }, event, scope));
  assert.throws(() => verifyLiteracyMockMutationReceipt({ ok: true, run: { ...before, eventRevision: 5, presentations: [{ questionId: 'q2' }] } }, event, scope));
});

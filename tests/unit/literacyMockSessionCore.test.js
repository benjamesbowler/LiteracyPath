import assert from "node:assert/strict";
import test from "node:test";
import { controlLiteracyMockSession, prepareLiteracyMockSession, getStudentLiteracyMockRun, saveStudentLiteracyMockRun,
  listLiteracyMockSessions, getLiteracyMockReport } from "../../src/data/literacyMockSessionCore.js";
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
  assert.deepEqual(calls[0], { name: "teacher_prepare_literacy_mock_session", args: { p_class_id: "class", p_student_ids: [], p_whole_class: true, p_duration_minutes: 20, p_item_count: 43, p_request_id: null } });
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

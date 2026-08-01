import assert from "node:assert/strict";
import test from "node:test";

import {
  BOUNDARY_RPCS,
  BOUNDARY_TABLES
} from "../../src/data/boundaries/client.js";
import {
  createValidatedSupabaseClient,
  FACADE_RPCS,
  FACADE_TABLES
} from "../../src/data/boundaries/facade.js";
import { DomainBoundaryError } from "../../src/data/boundaries/schema.js";

function queryBuilder(response) {
  const builder = {
    delete: () => builder,
    eq: () => builder,
    in: () => builder,
    insert: () => builder,
    is: () => builder,
    limit: () => builder,
    maybeSingle: () => builder,
    order: () => builder,
    range: () => builder,
    select: () => builder,
    single: () => builder,
    then: (resolve, reject) => Promise.resolve(response).then(resolve, reject),
    update: () => builder,
    upsert: () => builder
  };
  return builder;
}

function fakeRawClient({ authResponse, rpcResponses = {}, tableResponses = {} } = {}) {
  return {
    auth: {
      getSession: () => Promise.resolve(authResponse || {
        data: { session: null },
        error: null
      }),
      onAuthStateChange: callback => {
        callback("INITIAL_SESSION", null);
        return { data: { subscription: { unsubscribe() {} } } };
      }
    },
    from: table => queryBuilder(tableResponses[table] || { data: [], error: null }),
    rpc: name => queryBuilder(rpcResponses[name] || { data: null, error: null })
  };
}

test("all five domain registries expose the complete reviewed backend surface", () => {
  assert.equal(BOUNDARY_TABLES.length, 22);
  assert.equal(BOUNDARY_RPCS.length, 60);
  assert.ok(BOUNDARY_TABLES.includes("classes"));
  assert.ok(BOUNDARY_TABLES.includes("reading_sessions"));
  assert.ok(BOUNDARY_TABLES.includes("assessment_attempts"));
  assert.ok(BOUNDARY_TABLES.includes("assessment_question_reports"));
  assert.ok(BOUNDARY_TABLES.includes("el_assessment_reports"));
  assert.ok(BOUNDARY_TABLES.includes("teacher_instructional_groups"));
  assert.ok(BOUNDARY_TABLES.includes("teacher_instructional_group_reviews"));
  assert.ok(BOUNDARY_TABLES.includes("teacher_intervention_events"));
  assert.ok(BOUNDARY_TABLES.includes("teacher_account_decision_events"));
  assert.ok(BOUNDARY_TABLES.includes("worksheet_bank"));
  assert.ok(BOUNDARY_RPCS.includes("student_login"));
  assert.ok(BOUNDARY_RPCS.includes("report_assessment_question"));
  assert.ok(BOUNDARY_RPCS.includes("admin_review_assessment_question_report"));
  assert.ok(BOUNDARY_RPCS.includes("teacher_export_learner_data"));
  assert.ok(BOUNDARY_RPCS.includes("teacher_delete_learner_data_staged"));
  assert.ok(BOUNDARY_RPCS.includes("teacher_complete_learner_deletion"));
  assert.ok(BOUNDARY_RPCS.includes("teacher_reset_student_progress"));
  assert.ok(BOUNDARY_RPCS.includes("teacher_set_student_archived"));
  assert.ok(BOUNDARY_RPCS.includes("teacher_transfer_student"));
  assert.ok(BOUNDARY_RPCS.includes("teacher_create_intervention_plan"));
  assert.ok(BOUNDARY_RPCS.includes("teacher_update_planned_intervention"));
  assert.ok(BOUNDARY_RPCS.includes("teacher_delete_planned_intervention"));
  assert.ok(BOUNDARY_RPCS.includes("teacher_mark_intervention_delivered"));
  assert.ok(BOUNDARY_RPCS.includes("teacher_record_intervention_outcome"));
  assert.ok(BOUNDARY_RPCS.includes("teacher_review_intervention"));
  assert.ok(BOUNDARY_RPCS.includes("teacher_cancel_intervention"));
  for (const readingRpc of [
    "student_get_reading_session",
    "teacher_end_reading_session",
    "teacher_get_reading_session_presence",
    "teacher_save_reading_marks",
    "teacher_set_reading_session_page",
    "teacher_start_reading_session"
  ]) assert.ok(BOUNDARY_RPCS.includes(readingRpc));
  assert.ok(!BOUNDARY_RPCS.includes("teacher_cancel_planned_intervention"));
  assert.deepEqual(FACADE_TABLES, BOUNDARY_TABLES);
  assert.deepEqual(FACADE_RPCS, BOUNDARY_RPCS);
});

test("a valid class response crosses the boundary unchanged", async () => {
  const client = createValidatedSupabaseClient(fakeRawClient({
    tableResponses: {
      classes: {
        data: [{
          id: "30000000-0000-4000-8000-000000000001",
          name: "Audit Class A",
          teacher_id: "20000000-0000-4000-8000-000000000001"
        }],
        error: null
      }
    }
  }));
  const result = await client.table("classes").select("*");
  assert.equal(result.data[0].name, "Audit Class A");
});

test("malformed seeded class and evidence payloads fail closed", async () => {
  const malformedClassClient = createValidatedSupabaseClient(fakeRawClient({
    tableResponses: {
      classes: { data: [{ id: 42, name: "Malformed" }], error: null }
    }
  }));
  await assert.rejects(
    async () => await malformedClassClient.table("classes").select("*"),
    DomainBoundaryError
  );

  const malformedEvidenceClient = createValidatedSupabaseClient(fakeRawClient({
    tableResponses: {
      assessment_attempts: {
        data: [{
          id: "attempt-1",
          schema_version: "one",
          payload: "not-json"
        }],
        error: null
      }
    }
  }));
  await assert.rejects(
    async () => await malformedEvidenceClient.table("assessment_attempts").select("*"),
    DomainBoundaryError
  );
});

test("versioned stored evidence accepts a positive schema version", async () => {
  const client = createValidatedSupabaseClient(fakeRawClient({
    tableResponses: {
      assessment_attempts: {
        data: [{
          id: "attempt-1",
          schema_version: 1,
          payload: { schemaVersion: 1, attemptId: "attempt-1" }
        }],
        error: null
      }
    }
  }));
  const result = await client.table("assessment_attempts").select("*");
  assert.equal(result.data[0].payload.schemaVersion, 1);
});

test("unknown tables and RPCs are rejected before reaching the raw client", () => {
  const client = createValidatedSupabaseClient(fakeRawClient());
  assert.throws(() => client.table("invented_children"), /Unregistered Supabase table/);
  assert.throws(() => client.call("invented_rpc"), /Unregistered Supabase RPC/);
  assert.throws(() => client.from("classes"), /Direct Supabase from access is private/);
  assert.throws(() => client.rpc("student_login"), /Direct Supabase rpc access is private/);
});

test("known RPC payload fields and auth identities are runtime validated", async () => {
  const rpcClient = createValidatedSupabaseClient(fakeRawClient({
    rpcResponses: {
      teacher_create_demo_class: {
        data: { ok: "yes", class_id: 123 },
        error: null
      }
    }
  }));
  await assert.rejects(
    async () => await rpcClient.call("teacher_create_demo_class"),
    DomainBoundaryError
  );

  const authClient = createValidatedSupabaseClient(fakeRawClient({
    authResponse: {
      data: { session: { user: { id: 123 } } },
      error: null
    }
  }));
  await assert.rejects(() => authClient.auth.getSession(), DomainBoundaryError);
});

test("question-report RPC accepts only correctly typed acknowledgement and review rows", async () => {
  const validClient = createValidatedSupabaseClient(fakeRawClient({
    rpcResponses: {
      report_assessment_question: {
        data: [{
          report_id: "report-1",
          report_status: "open",
          report_type: "question",
          reported_at: "2026-07-28T00:00:00.000Z"
        }],
        error: null
      }
    }
  }));
  const valid = await validClient.call("report_assessment_question");
  assert.equal(valid.data[0].report_id, "report-1");

  const malformedClient = createValidatedSupabaseClient(fakeRawClient({
    rpcResponses: {
      report_assessment_question: {
        data: [{
          report_id: 42,
          report_status: "open",
          report_type: "question",
          reported_at: "2026-07-28T00:00:00.000Z"
        }],
        error: null
      }
    }
  }));
  await assert.rejects(
    async () => await malformedClient.call("report_assessment_question"),
    DomainBoundaryError
  );
});

test("student identity RPCs reject malformed nested and token payloads", async () => {
  const rosterClient = createValidatedSupabaseClient(fakeRawClient({
    rpcResponses: {
      student_class_by_code: {
        data: {
          ok: true,
          class: { id: 42, name: "Malformed class" },
          school: { id: "school-1", name: "Audit School" },
          students: []
        },
        error: null
      }
    }
  }));
  await assert.rejects(
    async () => await rosterClient.call("student_class_by_code"),
    DomainBoundaryError
  );

  const loginClient = createValidatedSupabaseClient(fakeRawClient({
    rpcResponses: {
      student_login: {
        data: { ok: true, token: 42, student_id: "student-1" },
        error: null
      }
    }
  }));
  await assert.rejects(
    async () => await loginClient.call("student_login"),
    DomainBoundaryError
  );
});

test("backend errors pass through without misclassifying their empty data", async () => {
  const expectedError = { code: "42501", message: "RLS denied" };
  const client = createValidatedSupabaseClient(fakeRawClient({
    tableResponses: {
      classes: { data: "provider-specific-error-data", error: expectedError }
    }
  }));
  const result = await client.table("classes").select("*");
  assert.equal(result.error, expectedError);
});

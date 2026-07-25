import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";

import { createClient } from "@supabase/supabase-js";

import {
  AUTHENTICATED_ONLY_SECURITY_DEFINER_RPCS,
  auditSecurityDefinerCatalog
} from "./databasePolicyContract.mjs";
import { isApprovedAuditDatabaseUrl } from "./seedAuditSchool.mjs";
import { verifyAuditSchoolLive } from "./verifyAuditSchoolLive.mjs";
import { verifyLeaderboardPrivacyLive } from "./verifyLeaderboardPrivacyLive.mjs";

const EXPECTED = Object.freeze({
  schoolId: "20000000-0000-4000-8000-000000000001",
  schoolName: "[AUDIT ONLY] LiteracyPath Seed School",
  teacherA: {
    email: "audit-teacher-a@literacypath.invalid",
    classId: "30000000-0000-4000-8000-000000000001",
    studentId: "40000000-0000-4000-8000-000000000001"
  },
  teacherB: {
    email: "audit-teacher-b@literacypath.invalid",
    classId: "30000000-0000-4000-8000-000000000002",
    studentId: "40000000-0000-4000-8000-000000000014"
  },
  adminEmail: "audit-admin@literacypath.invalid",
  studentPassword: "111"
});

const AUTH_ONLY_PROBE_ARGS = Object.freeze({
  "admin_error_monitor_summary()": {},
  "admin_get_school_retention_policy(uuid)": { p_school_id: EXPECTED.schoolId },
  "admin_list_deletion_propagation(uuid)": { p_school_id: EXPECTED.schoolId },
  "admin_preview_school_retention(uuid)": { p_school_id: EXPECTED.schoolId },
  "admin_purge_expired_error_events()": {},
  "admin_recent_error_events(integer)": { p_limit: 1 },
  "admin_run_school_retention(uuid, text)": {
    p_school_id: EXPECTED.schoolId,
    p_confirmation: "DO NOT RUN"
  },
  "admin_save_school_retention_policy(uuid, integer, integer, text, integer, integer, integer)": {
    p_school_id: EXPECTED.schoolId,
    p_inactive_archive_days: 365,
    p_delete_after_archive_days: 365,
    p_year_end_month_day: "07-31",
    p_year_end_delete_after_days: 365,
    p_provider_delete_target_days: 30,
    p_backup_delete_target_days: 90
  },
  "admin_verify_deletion_propagation(uuid, text, text)": {
    p_record_id: "00000000-0000-0000-0000-000000000000",
    p_evidence_reference: "none",
    p_confirmation: "DO NOT VERIFY"
  },
  "find_or_create_school(text)": { p_name: "Audit forbidden school" },
  "is_app_admin(uuid)": { check_user_id: EXPECTED.teacherA.studentId },
  "list_school_names()": {},
  "set_app_config(text, jsonb)": { p_key: "audit-forbidden", p_value: {} },
  "teacher_assign_instructional_group_follow_up(uuid, text, text, date)": {
    p_group_id: "00000000-0000-0000-0000-000000000000",
    p_owner_label: "Audit",
    p_activity: "Audit",
    p_planned_for: "2026-07-25"
  },
  "teacher_class_access_log(uuid, integer)": { p_class_id: EXPECTED.teacherA.classId, p_limit: 1 },
  "teacher_class_access_summary(uuid)": { p_class_id: EXPECTED.teacherA.classId },
  "teacher_create_insight_intervention(text, uuid, jsonb, uuid[], text[], text, text, date)": {
    p_insight_type: "group",
    p_class_id: EXPECTED.teacherA.classId,
    p_insight: {},
    p_student_ids: [],
    p_target_keys: [],
    p_owner_label: "Audit",
    p_activity: "Audit",
    p_planned_for: "2026-07-25"
  },
  "teacher_delete_learner_data(uuid, uuid, text, text)": {
    p_student_id: EXPECTED.teacherA.studentId,
    p_request_id: "00000000-0000-0000-0000-000000000000",
    p_verification_note: "Audit",
    p_confirmation: "DO NOT DELETE"
  },
  "teacher_export_learner_data(uuid, text, text)": {
    p_student_id: EXPECTED.teacherA.studentId,
    p_verification_note: "Audit",
    p_request_reference: "audit"
  },
  "teacher_list_learner_data_rights(uuid)": { p_student_id: EXPECTED.teacherA.studentId },
  "teacher_prepare_learner_deletion(uuid, text, text)": {
    p_student_id: EXPECTED.teacherA.studentId,
    p_verification_note: "Audit",
    p_request_reference: "audit"
  },
  "teacher_record_insight_observation(uuid, jsonb, uuid[], text, text, text, date)": {
    p_class_id: EXPECTED.teacherA.classId,
    p_insight: {},
    p_student_ids: [],
    p_note: "Audit",
    p_owner_label: "Audit",
    p_activity: "Audit",
    p_planned_for: "2026-07-25"
  },
  "teacher_regenerate_class_code(uuid)": { p_class_id: EXPECTED.teacherA.classId },
  "teacher_review_instructional_group(uuid, uuid[], jsonb)": {
    p_group_id: "00000000-0000-0000-0000-000000000000",
    p_student_ids: [],
    p_evidence: {}
  },
  "teacher_save_instructional_group(uuid, text, jsonb, uuid[], jsonb)": {
    p_class_id: EXPECTED.teacherA.classId,
    p_name: "Audit",
    p_criteria: {},
    p_student_ids: [],
    p_evidence: {}
  },
  "teacher_set_class_code_expiry(uuid, timestamp with time zone)": {
    p_class_id: EXPECTED.teacherA.classId,
    p_expires_at: null
  },
  "teacher_set_class_leaderboard_scope(uuid, text)": {
    p_class_id: EXPECTED.teacherA.classId,
    p_scope: "class"
  },
  "teacher_set_school(text)": { p_school_name: EXPECTED.schoolName }
});

const CATALOG_QUERY = String.raw`
select json_build_object(
  'functions',
  coalesce((
    select json_agg(function_row order by function_row.signature)
    from (
      select
        procedure.proname || '(' || oidvectortypes(procedure.proargtypes) || ')' as signature,
        exists (
          select 1
          from aclexplode(coalesce(
            procedure.proacl,
            acldefault('f', procedure.proowner)
          )) privilege
          where privilege.grantee = 0
            and privilege.privilege_type = 'EXECUTE'
        ) as public_execute,
        has_function_privilege('anon', procedure.oid, 'EXECUTE') as anon_execute,
        has_function_privilege('authenticated', procedure.oid, 'EXECUTE') as authenticated_execute,
        procedure.proconfig as settings
      from pg_proc procedure
      join pg_namespace namespace on namespace.oid = procedure.pronamespace
      where namespace.nspname = 'public'
        and procedure.prosecdef
    ) function_row
  ), '[]'::json),
  'tables',
  coalesce((
    select json_agg(table_row order by table_row.table_name)
    from (
      select
        class.relname as table_name,
        class.relrowsecurity as rls_enabled,
        has_table_privilege('anon', class.oid, 'SELECT') as anon_select,
        has_table_privilege('anon', class.oid, 'INSERT') as anon_insert,
        has_table_privilege('anon', class.oid, 'UPDATE') as anon_update,
        has_table_privilege('anon', class.oid, 'DELETE') as anon_delete
      from pg_class class
      join pg_namespace namespace on namespace.oid = class.relnamespace
      where namespace.nspname = 'public'
        and class.relkind in ('r', 'p')
    ) table_row
  ), '[]'::json)
);`;

function client(apiUrl, anonKey) {
  return createClient(apiUrl, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });
}

function rpcName(signature) {
  return signature.slice(0, signature.indexOf("("));
}

function requireData(result, label) {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data;
}

async function signIn(apiUrl, anonKey, email, password) {
  const actor = client(apiUrl, anonKey);
  const login = await actor.auth.signInWithPassword({ email, password });
  requireData(login, `${email} login`);
  return actor;
}

async function runPsqlJson(databaseUrl, query) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "psql",
      ["-X", "--no-psqlrc", "-v", "ON_ERROR_STOP=1", "-At", "-c", query],
      {
        env: { ...process.env, PGDATABASE: databaseUrl },
        stdio: ["ignore", "pipe", "pipe"]
      }
    );
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", chunk => {
      stdout += chunk;
    });
    child.stderr.on("data", chunk => {
      stderr += chunk;
    });
    child.on("error", error => {
      reject(error.code === "ENOENT"
        ? new Error("psql is required for the live database-policy catalogue check.")
        : error);
    });
    child.on("close", code => {
      if (code !== 0) {
        reject(new Error(`psql catalogue query failed: ${stderr.trim() || `exit ${code}`}`));
        return;
      }
      try {
        resolve(JSON.parse(stdout.trim()));
      } catch {
        reject(new Error("psql catalogue query did not return valid JSON."));
      }
    });
  });
}

function verifyTableCatalog(rows) {
  const failures = [];
  for (const row of rows) {
    const anonymousPrivileges = [
      row.anon_insert && "INSERT",
      row.anon_update && "UPDATE",
      row.anon_delete && "DELETE"
    ].filter(Boolean);
    if (anonymousPrivileges.length) {
      failures.push(`${row.table_name}: anon has ${anonymousPrivileges.join("/")}`);
    }
    if (row.anon_select && row.table_name !== "app_config") {
      failures.push(`${row.table_name}: unexpected anonymous SELECT`);
    }
    if (!row.rls_enabled) failures.push(`${row.table_name}: RLS is disabled`);
  }
  return failures;
}

async function verifyAnonymousBoundary(anonymous) {
  const forbiddenTables = [
    "classes",
    "students",
    "student_sessions",
    "student_progress",
    "learn_activity",
    "answers",
    "mastery",
    "item_mastery",
    "assessment_attempts",
    "el_assessment_reports",
    "teacher_interventions",
    "teacher_instructional_groups",
    "teacher_insight_observations",
    "class_access_events",
    "data_rights_requests",
    "school_retention_policies"
  ];
  for (const table of forbiddenTables) {
    const result = await anonymous.from(table).select("*", { count: "exact", head: true });
    assert(
      result.error || result.count === 0,
      `anonymous direct read returned rows from ${table}`
    );
  }

  for (const signature of AUTHENTICATED_ONLY_SECURITY_DEFINER_RPCS) {
    const args = AUTH_ONLY_PROBE_ARGS[signature];
    assert(args, `missing anonymous denial probe for ${signature}`);
    const result = await anonymous.rpc(rpcName(signature), args);
    assert(result.error, `anonymous caller reached authenticated-only ${signature}`);
  }

  for (const [name, args] of [
    ["student_list_schools", {}],
    ["student_list_classes", { p_school_id: EXPECTED.schoolId }],
    ["student_list_students", { p_class_id: EXPECTED.teacherA.classId }],
    ["student_set_password", {
      p_student_id: EXPECTED.teacherA.studentId,
      p_sequence: "111"
    }]
  ]) {
    const result = await anonymous.rpc(name, args);
    assert(result.error, `obsolete child-login RPC remained callable: ${name}`);
  }

  const invalidRoster = requireData(
    await anonymous.rpc("student_class_by_code", {
      p_code: "ZZ9ZZ9",
      p_device_id: "audit-db-policy-invalid-v1"
    }),
    "invalid class code"
  );
  assert.equal(invalidRoster?.ok, false);

  const invalidTokenChecks = [
    anonymous.rpc("student_get_progress", { p_token: "invalid" }),
    anonymous.rpc("student_save_progress", {
      p_token: "invalid",
      p_area: "audit",
      p_key: "invalid",
      p_payload: {}
    }),
    anonymous.rpc("student_log_activity_v2", {
      p_token: "invalid",
      p_client_event_id: "audit-invalid",
      p_area: "audit",
      p_item_id: "audit",
      p_event: "audit",
      p_payload: {},
      p_delivery_attempts: 1
    }),
    anonymous.rpc("student_report_activity_sync_health", {
      p_token: "invalid",
      p_device_id: "audit-invalid",
      p_attempted: 0,
      p_delivered: 0,
      p_recovered: 0,
      p_storage_failures: 0,
      p_pending: 0,
      p_lost: 0
    }),
    anonymous.rpc("get_game_leaderboard", {
      p_student_token: "invalid",
      p_limit: 5
    })
  ];
  const invalidResults = await Promise.all(invalidTokenChecks);
  assert(
    invalidResults.every(result => result.error || result.data?.ok === false),
    "an invalid learner token reached a token-scoped RPC"
  );

  const sensitiveError = requireData(
    await anonymous.rpc("report_app_error", {
      p_client_event_id: randomUUID(),
      p_release_id: "audit",
      p_fingerprint: "a8e6f001",
      p_severity: "error",
      p_surface: "assessment",
      p_error_type: "AuditError",
      p_source: "release-gate",
      p_stack_frames: ["password=secret"],
      p_sample_rate: 1
    }),
    "sensitive remote error rejection"
  );
  assert.equal(sensitiveError?.ok, false);
}

async function verifyCodeExpiryAndRotation({ anonymous, teacherB, databaseUrl }) {
  const classRow = requireData(
    await teacherB.from("classes")
      .select("access_code")
      .eq("id", EXPECTED.teacherB.classId)
      .single(),
    "teacher B class code"
  );
  const oldCode = classRow.access_code;
  await runPsqlJson(
    databaseUrl,
    `with updated as (`
      + `update public.classes set access_code_expires_at = now() - interval '1 minute' `
      + `where id = '${EXPECTED.teacherB.classId}'::uuid returning id`
      + `) select json_build_object('updated', (select count(*) from updated));`
  );
  const expired = requireData(
    await anonymous.rpc("student_class_by_code", {
      p_code: oldCode,
      p_device_id: "audit-db-policy-expired-v1"
    }),
    "expired class code"
  );
  assert.equal(expired?.error, "code_expired");

  const rotated = requireData(
    await teacherB.rpc("teacher_regenerate_class_code", {
      p_class_id: EXPECTED.teacherB.classId
    }),
    "teacher B code rotation"
  );
  assert(rotated?.ok && rotated?.access_code && rotated.access_code !== oldCode);
  const oldAfterRotation = requireData(
    await anonymous.rpc("student_class_by_code", {
      p_code: oldCode,
      p_device_id: "audit-db-policy-old-code-v1"
    }),
    "old class code after rotation"
  );
  assert.equal(oldAfterRotation?.ok, false);
  const newRoster = requireData(
    await anonymous.rpc("student_class_by_code", {
      p_code: rotated.access_code,
      p_device_id: "audit-db-policy-new-code-v1"
    }),
    "rotated class code"
  );
  assert.equal(newRoster?.ok, true);
  assert.equal(newRoster?.students?.length, 13);
  return { expiredRejected: true, rotatedRejected: true };
}

async function verifyDeletesAndTenantScope({ teacherA, teacherB }) {
  const crossDelete = requireData(
    await teacherA.from("students")
      .delete()
      .eq("id", EXPECTED.teacherB.studentId)
      .select("id"),
    "cross-tenant learner delete"
  );
  assert.equal(crossDelete.length, 0, "teacher A deleted teacher B's learner");
  const stillPresent = requireData(
    await teacherB.from("students")
      .select("id")
      .eq("id", EXPECTED.teacherB.studentId)
      .single(),
    "teacher B learner after cross-delete"
  );
  assert.equal(stillPresent.id, EXPECTED.teacherB.studentId);

  const temporaryId = randomUUID();
  requireData(
    await teacherA.from("students").insert({
      id: temporaryId,
      class_id: EXPECTED.teacherA.classId,
      teacher_id: "10000000-0000-4000-8000-000000000001",
      name: "Audit disposable learner"
    }),
    "owned learner insert"
  );
  const ownedDelete = requireData(
    await teacherA.from("students").delete().eq("id", temporaryId).select("id"),
    "owned learner delete"
  );
  assert.deepEqual(ownedDelete.map(row => row.id), [temporaryId]);
  return { crossTenantDeleteRejected: true, ownedDeleteAllowed: true };
}

async function verifyAdminBoundary({ teacherA, admin }) {
  const directSchoolInsert = await teacherA.from("schools").insert({
    name: "Audit direct insert must fail"
  });
  assert(directSchoolInsert.error, "teacher bypassed the bounded school RPC with a direct insert");
  const boundedSchool = requireData(
    await teacherA.rpc("find_or_create_school", { p_name: EXPECTED.schoolName }),
    "authenticated bounded school lookup"
  );
  assert.equal(boundedSchool?.[0]?.name, EXPECTED.schoolName);
  const invalidSchool = await teacherA.rpc("find_or_create_school", { p_name: " " });
  assert(invalidSchool.error, "bounded school RPC accepted an invalid name");
  const teacherAdminCall = await teacherA.rpc("admin_get_school_retention_policy", {
    p_school_id: EXPECTED.schoolId
  });
  assert(teacherAdminCall.error, "ordinary teacher reached an administrator retention RPC");
  const adminCheck = requireData(
    await admin.rpc("is_app_admin", { check_user_id: "12000000-0000-4000-8000-000000000001" }),
    "administrator identity"
  );
  assert.equal(adminCheck, true);
  const teacherCheck = requireData(
    await teacherA.rpc("is_app_admin", {
      check_user_id: "10000000-0000-4000-8000-000000000001"
    }),
    "teacher non-admin identity"
  );
  assert.equal(teacherCheck, false);
  requireData(
    await admin.rpc("admin_error_monitor_summary"),
    "administrator monitor summary"
  );
  requireData(
    await admin.rpc("admin_get_school_retention_policy", {
      p_school_id: EXPECTED.schoolId
    }),
    "administrator retention policy"
  );
  return {
    teacherRejected: true,
    adminAccepted: true,
    directSchoolWriteRejected: true
  };
}

export async function verifyDatabasePoliciesLive({
  apiUrl,
  anonKey,
  databaseUrl,
  password
}) {
  if (!apiUrl || !anonKey || !databaseUrl || !password) {
    throw new Error(
      "LP_AUDIT_SUPABASE_URL, LP_AUDIT_SUPABASE_ANON_KEY, "
      + "LP_AUDIT_DATABASE_URL, and LP_AUDIT_TEACHER_PASSWORD are required."
    );
  }
  const approval = isApprovedAuditDatabaseUrl(databaseUrl);
  if (!approval.approved) throw new Error(approval.reason);

  const catalog = await runPsqlJson(databaseUrl, CATALOG_QUERY);
  const functionReport = auditSecurityDefinerCatalog(catalog.functions || []);
  const tableFailures = verifyTableCatalog(catalog.tables || []);
  const catalogFailures = [...functionReport.failures, ...tableFailures];
  if (catalogFailures.length) {
    throw new Error(`Live database catalogue failed:\n- ${catalogFailures.join("\n- ")}`);
  }

  const anonymous = client(apiUrl, anonKey);
  const [teacherA, teacherB, admin] = await Promise.all([
    signIn(apiUrl, anonKey, EXPECTED.teacherA.email, password),
    signIn(apiUrl, anonKey, EXPECTED.teacherB.email, password),
    signIn(apiUrl, anonKey, EXPECTED.adminEmail, password)
  ]);

  try {
    const isolation = await verifyAuditSchoolLive({ apiUrl, anonKey, password });
    await verifyAnonymousBoundary(anonymous);
    const codeLifecycle = await verifyCodeExpiryAndRotation({
      anonymous,
      teacherB,
      databaseUrl
    });
    const deletes = await verifyDeletesAndTenantScope({ teacherA, teacherB });
    const adminBoundary = await verifyAdminBoundary({ teacherA, admin });
    const leaderboard = await verifyLeaderboardPrivacyLive({ apiUrl, anonKey, password });
    return {
      securityDefinerFunctions: functionReport.securityDefinerCount,
      privateSecurityHelpers: functionReport.privateHelperCount,
      anonymousRpcs: functionReport.anonymousRpcCount,
      authenticatedRpcs: functionReport.authenticatedRpcCount,
      rlsTables: catalog.tables?.length || 0,
      isolation,
      codeLifecycle,
      deletes,
      adminBoundary,
      leaderboard
    };
  } finally {
    await Promise.allSettled([
      teacherA.auth.signOut(),
      teacherB.auth.signOut(),
      admin.auth.signOut()
    ]);
  }
}

export async function main(environment = process.env) {
  const result = await verifyDatabasePoliciesLive({
    apiUrl: environment.LP_AUDIT_SUPABASE_URL,
    anonKey: environment.LP_AUDIT_SUPABASE_ANON_KEY,
    databaseUrl: environment.LP_AUDIT_DATABASE_URL,
    password: environment.LP_AUDIT_TEACHER_PASSWORD
  });
  console.log("Live database Auth, RLS, RPC, code, token, admin, and delete policies passed.");
  console.log(JSON.stringify(result, null, 2));
  return 0;
}

const isMain = process.argv[1]
  && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isMain) {
  try {
    process.exitCode = await main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

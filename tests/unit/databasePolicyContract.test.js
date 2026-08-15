import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  ANON_SECURITY_DEFINER_RPCS,
  AUTHENTICATED_SECURITY_DEFINER_RPCS,
  AUTHENTICATED_ONLY_SECURITY_DEFINER_RPCS,
  SECURITY_BOUNDARY_MIGRATION,
  TEACHER_ACCOUNT_GUARDED_SECURITY_DEFINER_RPCS,
  auditSecurityBoundarySource,
  auditSecurityDefinerCatalog
} from "../../tools/databasePolicyContract.mjs";
import {
  AUTH_ONLY_PROBE_ARGS
} from "../../tools/verifyDatabasePoliciesLive.mjs";

function row(signature, { anon = false, authenticated = false, publicRole = false } = {}) {
  return {
    signature,
    public_execute: publicRole,
    anon_execute: anon,
    authenticated_execute: authenticated,
    settings: ["search_path=public, extensions"]
  };
}

function validCatalog() {
  const exposed = AUTHENTICATED_SECURITY_DEFINER_RPCS.map(signature => row(signature, {
    anon: ANON_SECURITY_DEFINER_RPCS.includes(signature),
    authenticated: true
  }));
  exposed.push(row("student_from_token(text)"));
  exposed.push(row("create_pending_teacher_account_for_new_user()"));
  exposed.push(row("capture_teacher_intervention_event()"));
  exposed.push(row("reject_teacher_account_decision_event_mutation()"));
  exposed.push(row("teacher_record_maths_evidence_unrestricted_v1(uuid, uuid, text, text, text, jsonb, timestamp with time zone, text)"));
  return exposed;
}

test("security boundary grants only the explicit RPC surface and guards every teacher RPC", () => {
  const report = auditSecurityBoundarySource();
  assert.deepEqual(report.failures, []);
  assert.equal(report.anonymousRpcCount, 22);
  assert.equal(report.authenticatedRpcCount, 102);
  // 9, not 8: list_school_names() joined the legacy list on 2026-08-07 when it
  // was replaced by search_school_names(text). The old no-argument form returned
  // every school name to anon in one unbounded call.
  assert.equal(report.legacyRpcCount, 9);
  assert.equal(TEACHER_ACCOUNT_GUARDED_SECURITY_DEFINER_RPCS.length, 66);
});

test("database lint repairs preserve the final boundary and honest volatility", () => {
  const migration = fs.readFileSync(
    new URL(
      "../../supabase/migrations/20260814171600_database_function_volatility_contracts.sql",
      import.meta.url
    ),
    "utf8"
  );
  const mathsV4 = fs.readFileSync(
    new URL(
      "../../supabase/migrations/20260814170000_maths_assessment_interaction_integrity_v4.sql",
      import.meta.url
    ),
    "utf8"
  );

  assert.match(migration, /alter function public\.teacher_class_access_summary\(uuid\) volatile/i);
  assert.match(migration, /alter function public\.maths_validate_student_evidence_v4\(text, text, jsonb\) stable/i);
  assert.doesNotMatch(migration, /\bv_i\s+(?:int|integer)\b/i);
  assert.doesNotMatch(migration, /\bv_index\s+(?:int|integer)\b/i);
  assert.match(mathsV4, /returns jsonb[\s\S]*language plpgsql stable/i);
});

test("every authenticated-only RPC has a safe anonymous-denial probe", () => {
  assert.deepEqual(
    Object.keys(AUTH_ONLY_PROBE_ARGS).sort(),
    [...AUTHENTICATED_ONLY_SECURITY_DEFINER_RPCS].sort()
  );
});

test("security boundary rejects a teacher RPC missing from the account-status inventory", () => {
  const teacherAccountSource = fs.readFileSync(
    new URL(
      "../../supabase/migrations/20260801091000_security_definer_boundary.sql",
      import.meta.url
    ),
    "utf8"
  ).replace(
    "'teacher_class_access_summary(uuid)',",
    "'teacher_class_access_summary_missing(uuid)',"
  );
  const report = auditSecurityBoundarySource({ teacherAccountSource });
  assert.match(
    report.failures.join("\n"),
    /teacher RPC is absent from the account-status guard: teacher_class_access_summary\(uuid\)/
  );
});

test("catalog audit accepts exact API grants and private helpers", () => {
  const report = auditSecurityDefinerCatalog(validCatalog());
  assert.deepEqual(report.failures, []);
  assert.equal(report.anonymousRpcCount, 22);
  assert.equal(report.authenticatedRpcCount, 102);
  assert.equal(report.privateHelperCount, 5);
});

test("the signed-out school lookup cannot export the whole directory", () => {
  const boundary = fs.readFileSync(
    new URL(`../../supabase/migrations/${SECURITY_BOUNDARY_MIGRATION}`, import.meta.url),
    "utf8"
  );
  const search = fs.readFileSync(
    new URL("../../supabase/migrations/20260807130000_school_name_search.sql", import.meta.url),
    "utf8"
  );
  const schoolInput = fs.readFileSync(
    new URL("../../src/components/SchoolNameInput.jsx", import.meta.url),
    "utf8"
  );

  // The unbounded form is gone from the allowlist, from the boundary, and from
  // the client. Any one of those surviving would leave the leak open.
  assert.equal(ANON_SECURITY_DEFINER_RPCS.includes("list_school_names()"), false);
  assert.match(boundary, /drop function if exists public\.list_school_names\(\)/i);
  assert.ok(!/grant execute on function public\.list_school_names/i.test(boundary));
  // No CALL to the old function. Its name still appears in a comment there,
  // explaining why it went — asserting the string is absent entirely would
  // delete that explanation to satisfy a test.
  assert.ok(!/\.call\("list_school_names"/.test(schoolInput));

  // Exactly one school-related RPC is reachable without signing in, and it is
  // the bounded one.
  assert.equal(
    ANON_SECURITY_DEFINER_RPCS.filter(signature => (
      signature.includes("school")
      || signature.startsWith("teacher_")
      || signature.startsWith("admin_")
    )).join(","),
    "search_school_names(text)"
  );
  assert.match(
    boundary,
    /grant execute on function public\.search_school_names\(text\) to anon, authenticated/i
  );

  // The two properties that make it bounded. Without the length floor a single
  // one-letter call returns a slice of the directory; without the cap, "a%"
  // returns most of it.
  assert.match(search, /char_length\(btrim\(coalesce\(p_prefix, ''\)\)\) >= 3/);
  assert.match(search, /limit 20/);

  assert.match(schoolInput, /\.call\("search_school_names", \{ p_prefix: prefix \}\)/);
  assert.match(schoolInput, /SCHOOL_SEARCH_MIN_LENGTH = 3/);
});


test("final boundary keeps support and account-decision evidence read-only", () => {
  const boundary = fs.readFileSync(
    new URL("../../supabase/migrations/20260801091000_security_definer_boundary.sql", import.meta.url),
    "utf8"
  );
  assert.match(
    boundary,
    /revoke all on table public\.teacher_intervention_events[\s\S]*grant select on table public\.teacher_intervention_events[\s\S]*to authenticated/i
  );
  assert.match(
    boundary,
    /revoke all on table public\.teacher_interventions[\s\S]*from public, anon, authenticated[\s\S]*grant select on table public\.teacher_interventions[\s\S]*to authenticated/i
  );
  assert.match(
    boundary,
    /revoke all on table public\.teacher_account_decision_events[\s\S]*grant select on table public\.teacher_account_decision_events[\s\S]*to authenticated/i
  );
});

test("final boundary exposes each reviewed support lifecycle RPC only to authenticated actors", () => {
  const boundary = fs.readFileSync(
    new URL("../../supabase/migrations/20260801091000_security_definer_boundary.sql", import.meta.url),
    "utf8"
  );
  for (const signature of [
    "teacher_create_intervention_plan",
    "teacher_update_planned_intervention",
    "teacher_delete_planned_intervention",
    "teacher_mark_intervention_delivered",
    "teacher_record_intervention_outcome",
    "teacher_review_intervention",
    "teacher_cancel_intervention",
    "teacher_create_intervention_follow_up"
  ]) {
    assert.match(
      boundary,
      new RegExp(`grant execute on function public\\.${signature}\\([\\s\\S]*?\\)\\s+to authenticated`, "i")
    );
  }
});

test("catalog audit rejects inherited PUBLIC execution", () => {
  const catalog = validCatalog();
  catalog[0].public_execute = true;
  assert.match(
    auditSecurityDefinerCatalog(catalog).failures.join("\n"),
    /PUBLIC can execute SECURITY DEFINER/
  );
});

test("catalog audit rejects a new unreviewed anonymous RPC", () => {
  const catalog = validCatalog();
  catalog.push(row("unsafe_child_dump()", { anon: true, authenticated: true }));
  assert.match(
    auditSecurityDefinerCatalog(catalog).failures.join("\n"),
    /anonymous SECURITY DEFINER surface differs/
  );
});

test("catalog audit rejects a missing fixed search path", () => {
  const catalog = validCatalog();
  catalog[0].settings = null;
  assert.match(
    auditSecurityDefinerCatalog(catalog).failures.join("\n"),
    /lack a fixed safe search_path/
  );
});

test("teacher signup creates its bounded school inside the auth trigger", () => {
  const migration = fs.readFileSync(
    new URL("../../supabase/migrations/20260725130000_security_definer_boundary.sql", import.meta.url),
    "utf8"
  );
  const app = [
    fs.readFileSync(new URL("../../src/App.jsx", import.meta.url), "utf8"),
    fs.readFileSync(
      new URL("../../src/appState/useAppSessionController.js", import.meta.url),
      "utf8"
    )
  ].join("\n");
  assert.match(migration, /requested_school_name := nullif\(btrim\(new\.raw_user_meta_data ->> 'school_name'\)/);
  assert.match(migration, /from public\.find_or_create_school\(requested_school_name\)/);
  assert.match(migration, /requested_school_id,[\s\S]*on conflict \(user_id\) do nothing/);
  assert.match(migration, /char_length\(v_clean\) > 120/);
  assert.match(migration, /revoke insert, update, delete on public\.schools from authenticated/);
  assert.match(migration, /invalid_teacher_signup_metadata/);
  assert.match(app, /school_name: schoolName/);
  assert.doesNotMatch(
    app.slice(app.indexOf("async function signUpTeacher"), app.indexOf("async function logInTeacher")),
    /rpc\("find_or_create_school"/
  );
  assert.doesNotMatch(
    app.slice(app.indexOf("async function signUpTeacher"), app.indexOf("async function logInTeacher")),
    /from\("pending_teacher_accounts"\)[\s\S]{0,200}\.eq\("username"/
  );
});

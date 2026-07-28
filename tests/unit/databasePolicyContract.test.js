import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  ANON_SECURITY_DEFINER_RPCS,
  AUTHENTICATED_SECURITY_DEFINER_RPCS,
  TEACHER_ACCOUNT_GUARDED_SECURITY_DEFINER_RPCS,
  auditSecurityBoundarySource,
  auditSecurityDefinerCatalog
} from "../../tools/databasePolicyContract.mjs";

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
  return exposed;
}

test("security boundary grants only the explicit RPC surface and guards every teacher RPC", () => {
  const report = auditSecurityBoundarySource();
  assert.deepEqual(report.failures, []);
  assert.equal(report.anonymousRpcCount, 10);
  assert.equal(report.authenticatedRpcCount, 47);
  assert.equal(report.legacyRpcCount, 8);
  assert.equal(TEACHER_ACCOUNT_GUARDED_SECURITY_DEFINER_RPCS.length, 23);
});

test("security boundary rejects a teacher RPC missing from the account-status inventory", () => {
  const teacherAccountSource = fs.readFileSync(
    new URL(
      "../../supabase/migrations/20260728100000_teacher_account_status_rls.sql",
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
  assert.equal(report.anonymousRpcCount, 10);
  assert.equal(report.authenticatedRpcCount, 47);
  assert.equal(report.privateHelperCount, 2);
});

test("signed-out school autocomplete is the only added anonymous teacher-signup RPC", () => {
  const boundary = fs.readFileSync(
    new URL("../../supabase/migrations/20260728125000_security_definer_boundary.sql", import.meta.url),
    "utf8"
  );
  const schoolInput = fs.readFileSync(
    new URL("../../src/components/SchoolNameInput.jsx", import.meta.url),
    "utf8"
  );
  assert.equal(ANON_SECURITY_DEFINER_RPCS.includes("list_school_names()"), true);
  assert.equal(
    ANON_SECURITY_DEFINER_RPCS.filter(signature => (
      signature.includes("school")
      || signature.startsWith("teacher_")
      || signature.startsWith("admin_")
    )).join(","),
    "list_school_names()"
  );
  assert.match(
    boundary,
    /grant execute on function public\.list_school_names\(\)\s+to anon, authenticated/i
  );
  assert.match(schoolInput, /\.call\("list_school_names"\)/);
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

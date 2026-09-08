// Exercise real PostgREST JSON-null binding on an explicitly selected local
// Supabase or standalone PostgREST target. Does not install/start services or apply migrations.
// Required env: LP_LOGIN_TEST_API_URL, LP_LOGIN_TEST_DATABASE_URL,
// LP_LOGIN_TEST_ANON_KEY, LP_LOGIN_TEST_CONFIRM=LOCAL_SYNTHETIC_LOGIN.
// Optional LP_LOGIN_TEST_API_STYLE=postgrest selects standalone /rpc routing;
// the default supabase style uses /rest/v1/rpc. Both require a loopback origin.
// Creates only synthetic UUID fixtures and deletes exactly those fixtures.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";

function localUrl(value, protocols) {
  const url = new URL(value);
  assert.ok(protocols.includes(url.protocol), "unexpected target protocol");
  assert.ok(["127.0.0.1", "localhost", "[::1]"].includes(url.hostname), "local targets only");
  assert.equal(url.search, "", "target query parameters are not allowed");
  assert.equal(url.hash, "", "target fragments are not allowed");
  return url;
}

async function main() {
  assert.equal(process.env.LP_LOGIN_TEST_CONFIRM, "LOCAL_SYNTHETIC_LOGIN",
    "Select an isolated local database/API target and confirm LOCAL_SYNTHETIC_LOGIN first.");
  const api = localUrl(process.env.LP_LOGIN_TEST_API_URL, ["http:"]);
  assert.equal(api.pathname, "/", "API URL must be the local origin");
  const apiStyle = process.env.LP_LOGIN_TEST_API_STYLE ?? "supabase";
  assert.ok(["supabase", "postgrest"].includes(apiStyle), "unknown local API style");
  const rpcPath = apiStyle === "postgrest" ? "/rpc/student_login" : "/rest/v1/rpc/student_login";
  const database = localUrl(process.env.LP_LOGIN_TEST_DATABASE_URL, ["postgres:", "postgresql:"]);
  assert.ok(database.username && database.pathname.length > 1, "database user and name required");
  assert.ok(process.env.LP_LOGIN_TEST_ANON_KEY, "local anonymous API key required");
  // PGDATABASE does not expand connection URIs like psql --dbname does. Pass
  // individual fields without exposing a URI password in process arguments.
  // Clear inherited libpq settings so PGHOSTADDR/service cannot redirect us.
  const sqlEnv = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith("PG")));
  Object.assign(sqlEnv, {
    PGHOST: database.hostname.replace(/^\[|\]$/g, ""), PGPORT: database.port || "5432",
    PGDATABASE: decodeURIComponent(database.pathname.slice(1)), PGUSER: decodeURIComponent(database.username),
    PGPASSWORD: decodeURIComponent(database.password) || process.env.PGPASSWORD || "", PGCONNECT_TIMEOUT: "5"
  });
  const teacher = randomUUID();
  const school = randomUUID();
  const classroom = randomUUID();
  const learner = randomUUID();
  const code = randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase();
  const device = `synthetic-login-${randomUUID()}`;
  const sql = statement => {
    const result = spawnSync("psql", ["-X", "-A", "-t", "-v", "ON_ERROR_STOP=1"], {
      input: statement, encoding: "utf8",
      env: sqlEnv
    });
    // Never print subprocess stderr: connection diagnostics can contain secrets.
    assert.equal(result.status, 0, "local SQL failed; inspect the selected local target privately");
    return result.stdout.trim();
  };
  const rpc = async payload => {
    const response = await fetch(new URL(rpcPath, api), {
      method: "POST", redirect: "error", signal: AbortSignal.timeout(10_000),
      headers: {
        "Content-Type": "application/json", apikey: process.env.LP_LOGIN_TEST_ANON_KEY,
        Authorization: `Bearer ${process.env.LP_LOGIN_TEST_ANON_KEY}`
      },
      body: JSON.stringify(payload)
    });
    return { status: response.status, data: await response.json() };
  };
  // A private owner connection to the same HTTP target is required to check
  // actual session and counter effects. A successful login below verifies the
  // two endpoints share the synthetic fixture before denial tests can pass.
  let seeded = false;
  try {
    sql(`begin;
      insert into auth.users (id,email,email_confirmed_at,raw_user_meta_data)
        values ('${teacher}','${teacher}@example.invalid',now(),'{"audit_only":true}');
      insert into public.schools (id,name) values ('${school}','Synthetic Login ${school}');
      insert into public.classes (id,teacher_id,school_id,name,access_code)
        values ('${classroom}','${teacher}','${school}','Synthetic Login Class','${code}');
      insert into public.students (id,teacher_id,class_id,name,symbol_password)
        values ('${learner}','${teacher}','${classroom}','Synthetic Login Learner','123');
      commit;`);
    seeded = true;
    const base = { p_student_id: learner, p_sequence: "123", p_device_id: device, p_code: code };
    const success = await rpc(base);
    assert.equal(success.status, 200);
    assert.equal(success.data?.ok, true);
    assert.equal(sql(`select count(*) from public.student_sessions where student_id='${learner}';`), "1");
    for (const [label, sequence] of [["JSON null", null], ["empty", ""], ["malformed", "120"], ["wrong", "999"]]) {
      const result = await rpc({ ...base, p_sequence: sequence });
      assert.equal(result.status, 200, label);
      assert.equal(result.data?.ok, false, label);
      assert.equal(result.data?.error, "wrong_password", label);
      assert.equal(Object.hasOwn(result.data, "token"), false, label);
      assert.equal(sql(`select count(*) from public.student_sessions where student_id='${learner}';`), "1", label);
      console.log(`PASS: ${label} denied over HTTP without a new session.`);
    }
    assert.equal(sql(`select failed_login_count from public.students where id='${learner}';`), "4");
    const valid = await rpc(base);
    assert.equal(valid.data?.ok, true);
    assert.equal(sql(`select failed_login_count from public.students where id='${learner}';`), "0");
    assert.equal(sql(`select count(*) from public.student_sessions where student_id='${learner}';`), "2");
    const obsolete = await rpc({ p_student_id: learner, p_sequence: "123" });
    assert.equal(obsolete.status, 404, "obsolete overload must not resolve");
    assert.equal(Object.hasOwn(obsolete.data, "token"), false);
    console.log("PASS: valid HTTP login resets failures; old overload is unavailable.");
  } finally {
    if (seeded) {
      sql(`begin;
        delete from public.students where id='${learner}' and class_id='${classroom}';
        delete from public.classes where id='${classroom}' and teacher_id='${teacher}';
        delete from public.schools where id='${school}';
        delete from auth.users where id='${teacher}';
        commit;`);
      console.log("Removed the exact synthetic learner, class, school and teacher fixtures.");
    }
  }
}

main().catch(error => {
  console.error(`FAIL: ${error.message}`);
  process.exitCode = 1;
});

// Full forward-migration SQL proof with synthetic data and no network access.
// Run: node tools/db/verifyStudentLogin.mjs
// --baseline omits the NULL credential repair to demonstrate the failing test.
import assert from "node:assert/strict";
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";

const root = resolve(import.meta.dirname, "../..");
const repair = "20260908090000_student_login_reject_null_sequence.sql";
const baseline = process.argv.includes("--baseline");
let failed = false;
const db = await PGlite.create({ extensions: { pgcrypto } });
try {
  await db.exec(readFileSync(join(import.meta.dirname, "bootstrap.sql"), "utf8"));
  const migrations = readdirSync(join(root, "supabase/migrations"))
    .filter(name => name.endsWith(".sql") && (!baseline || name !== repair)).sort();
  for (const name of migrations) {
    try {
      await db.exec(readFileSync(join(root, "supabase/migrations", name), "utf8"));
    } catch (error) {
      throw new Error(`Migration ${name}: ${error.message}`, { cause: error });
    }
  }
  await db.exec("alter extension pgcrypto set schema extensions;");
  console.log(`Applied ${migrations.length} forward migrations (${baseline ? "baseline" : "repaired"}).`);

  // Inspect the assembled callable surface, not superseded historical bodies.
  const { rows: inventory } = await db.query(`
    select p.oid::regprocedure::text as signature, pg_get_functiondef(p.oid) as definition
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prokind = 'f'
      and (has_function_privilege('anon', p.oid, 'EXECUTE')
        or has_function_privilege('authenticated', p.oid, 'EXECUTE'))
    order by 1
  `);
  const artifacts = join(root, ".artifacts/audit-lane/A1");
  mkdirSync(artifacts, { recursive: true });
  writeFileSync(join(artifacts, "callable-functions.json"), JSON.stringify(inventory, null, 2));
  const login = inventory.filter(row => row.signature.startsWith("student_login("));
  assert.equal(login.length, 1, "only the current login overload is callable");
  const { rows: [boundary] } = await db.query(`
    select p.prosecdef, p.proisstrict, p.provolatile, p.proconfig,
      exists (select 1 from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner)))
        where grantee = 0 and privilege_type = 'EXECUTE') as public_execute
    from pg_proc p where p.oid = 'public.student_login(uuid,text,text,text)'::regprocedure
  `);
  assert.equal(boundary.prosecdef, true);
  assert.equal(boundary.proisstrict, false);
  assert.equal(boundary.provolatile, "v");
  assert.deepEqual(boundary.proconfig, ["search_path=public, extensions"]);
  assert.equal(boundary.public_execute, false);

  await db.exec(readFileSync(join(root, "tests/sql/student_login_credentials.sql"), "utf8"));
  console.log("PASS: anon/authenticated credential denial, exact session/failure/event effects, expiry, archive, device, throttles, lockout and obsolete overload denial.");
  // Reapplying the forward repair must preserve the same boundary and behavior.
  if (!baseline) {
    await db.exec(readFileSync(join(root, "supabase/migrations", repair), "utf8"));
    await db.exec(readFileSync(join(root, "tests/sql/student_login_credentials.sql"), "utf8"));
    console.log("PASS: repeat forward migration and identical behavioral suite.");
  }
} catch (error) {
  console.error(`FAIL: ${error.message}${error.where ? ` (${error.where})` : ""}`);
  failed = true;
} finally {
  await db.close();
}
process.exitCode = failed ? 1 : 0;

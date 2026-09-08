import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
const root = resolve(import.meta.dirname, "../..");
const db = await PGlite.create({ extensions: { pgcrypto } });
try {
  await db.exec(readFileSync(join(import.meta.dirname, "bootstrap.sql"), "utf8"));
  for (const name of readdirSync(join(root, "supabase/migrations")).filter(name => name.endsWith(".sql")).sort()) {
    try { await db.exec(readFileSync(join(root, "supabase/migrations", name), "utf8")); }
    catch (error) { throw new Error(`${name}: ${error.message}`, { cause: error }); }
  }
  await db.exec("alter extension pgcrypto set schema extensions");
  const { rows: [boundary] } = await db.query(`select p.prosecdef, p.proconfig,
    exists (select 1 from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) where grantee = 0 and privilege_type = 'EXECUTE') as public_execute,
    has_function_privilege('anon', p.oid, 'EXECUTE') as anon_execute
    from pg_proc p where p.oid = 'public.student_revoke_session(text)'::regprocedure`);
  assert.equal(boundary.prosecdef, true);
  assert.equal(boundary.public_execute, false);
  assert.equal(boundary.anon_execute, true);
  assert.deepEqual(boundary.proconfig, ["search_path=public"]);
  for (const file of ["student_login_credentials.sql", "student_session_recovery.sql"]) {
    await db.exec(readFileSync(join(root, "tests/sql", file), "utf8"));
    console.log(`PASS: ${file}`);
  }
} finally { await db.close(); }

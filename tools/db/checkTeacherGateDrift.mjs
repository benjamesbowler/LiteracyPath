/**
 * Apply every migration to a real PostgreSQL (PGlite) and print the row-level
 * security landscape for tables the browser can reach directly, so a proposed
 * policy change can be checked BEFORE it runs against the hosted database.
 *
 * This script exists because the first version of the drift guard in
 * 20260807100000_teacher_access_gate_on_newest_tables.sql would have flagged 16
 * tables and aborted the migration. The reason was a bad heuristic: the guard
 * matched any policy whose USING expression contained `auth.uid()`, and
 * `public.is_app_admin(auth.uid())` contains `auth.uid()`. Every admin policy on
 * every table matched. A guard that blocks a deploy on a false positive is worse
 * than no guard, and this is the tool that caught it.
 *
 *   cd tools/db && npm install @electric-sql/pglite && node checkTeacherGateDrift.mjs
 */
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const MIGRATIONS = join(import.meta.dirname, "..", "..", "supabase", "migrations");

const db = await PGlite.create({ extensions: { pgcrypto } });
await db.exec(readFileSync(join(import.meta.dirname, "bootstrap.sql"), "utf8"));

const files = readdirSync(MIGRATIONS).filter(f => f.endsWith(".sql")).sort();
const failures = [];
let applied = 0;
for (const file of files) {
  try {
    await db.exec(readFileSync(join(MIGRATIONS, file), "utf8"));
    applied += 1;
  } catch (error) {
    failures.push({ file, message: String(error?.message || error).split("\n")[0] });
    // A failed statement aborts the surrounding transaction block, and every
    // later query in this connection then fails with 25P02. Clear it so the
    // remaining migrations and the report below still run.
    try { await db.exec("rollback;"); } catch { /* nothing to roll back */ }
  }
}

console.log(`Applied ${applied}/${files.length} migrations.`);
for (const f of failures) console.log(`  FAILED  ${f.file}\n            ${f.message}`);

const { rows } = await db.query(`
  select c.relname as table_name,
         p.polname as policy_name,
         p.polcmd as command,
         coalesce(pg_get_expr(p.polqual, p.polrelid), '') as using_expr,
         coalesce(pg_get_expr(p.polwithcheck, p.polrelid), '') as check_expr
  from pg_policy p
  join pg_class c on c.oid = p.polrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and has_table_privilege('authenticated', c.oid, 'SELECT')
  order by c.relname, p.polname;
`);

const GATE = "current_actor_has_teacher_access";
const byTable = new Map();
for (const r of rows) {
  if (!byTable.has(r.table_name)) byTable.set(r.table_name, []);
  byTable.get(r.table_name).push(r);
}

console.log(`\n=== Browser-reachable tables with policies (${byTable.size}) ===\n`);
for (const [table, policies] of byTable) {
  const gated = policies.filter(p => (p.using_expr + p.check_expr).includes(GATE)).length;
  console.log(`${table}  —  ${gated}/${policies.length} policies gated`);
  for (const p of policies) {
    const mark = (p.using_expr + p.check_expr).includes(GATE) ? "gated  " : "UNGATED";
    console.log(`    [${mark}] ${p.polname ?? p.policy_name}`);
    if (mark === "UNGATED") {
      console.log(`               using: ${p.using_expr.replace(/\s+/g, " ").slice(0, 160)}`);
    }
  }
}

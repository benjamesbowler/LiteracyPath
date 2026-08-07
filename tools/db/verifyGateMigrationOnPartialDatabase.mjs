/**
 * Proves 20260807100000_teacher_access_gate_on_newest_tables.sql survives a
 * database that is NOT in step with this repository.
 *
 * WHY. Applied to the hosted database on 2026-08-07 it died with
 * `42P01: relation "public.mll_language_assessments" does not exist` — the MLL
 * migration had never been run there. A migration that aborts partway is worse
 * than one that skips, because the operator cannot tell what landed. This
 * checks both worlds:
 *
 *   FULL    every migration applied  -> all four tables gated
 *   PARTIAL the MLL migration skipped -> file still applies, warns, gates the rest
 *
 *   npm run check:gate-migration-resilience
 */
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

const MIGRATIONS = join(import.meta.dirname, "..", "..", "supabase", "migrations");
const MLL = "20260806120000_multilingual_learner_profile.sql";
const GATE = "20260807100000_teacher_access_gate_on_newest_tables.sql";

const results = [];
function check(name, passed, detail = "") {
  results.push(passed);
  console.log(`${passed ? "  ok  " : "FAIL  "} ${name}${detail ? `\n         ${detail}` : ""}`);
}

async function run(label, { skip = [] } = {}) {
  const db = await PGlite.create({ extensions: { pgcrypto } });
  await db.exec(readFileSync(join(import.meta.dirname, "bootstrap.sql"), "utf8"));

  const files = readdirSync(MIGRATIONS).filter(f => f.endsWith(".sql")).sort();
  let error = null;
  for (const file of files) {
    if (skip.includes(file)) continue;
    try {
      await db.exec(readFileSync(join(MIGRATIONS, file), "utf8"));
    } catch (caught) {
      if (file === GATE) error = String(caught?.message || caught);
      try { await db.exec("rollback;"); } catch { /* nothing open */ }
    }
  }

  const { rows } = await db.query(`
    select c.relname as table_name
    from pg_policy p
    join pg_class c on c.oid = p.polrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname in ('reading_sessions','mll_language_assessments','mll_exit_criteria','mll_family_contacts')
      and pg_get_expr(p.polqual, p.polrelid) like '%current_actor_has_teacher_access%'
    group by c.relname order by c.relname;
  `);
  console.log(`\n--- ${label} ---`);
  return { error, gated: rows.map(r => r.table_name) };
}

const full = await run("FULL — every migration applied");
check("the gate migration applies cleanly", full.error === null, full.error || "");
check(
  "and gates all four tables",
  full.gated.length === 4,
  `gated: ${full.gated.join(", ") || "none"}`
);

const partial = await run("PARTIAL — the MLL migration was never run", { skip: [MLL] });
check(
  "the gate migration still applies rather than aborting",
  partial.error === null,
  partial.error || "this is the exact 42P01 failure seen on the hosted database"
);
check(
  "and still gates the table that DOES exist",
  partial.gated.includes("reading_sessions"),
  `gated: ${partial.gated.join(", ") || "none"} — a missing MLL table must not cost reading_sessions its gate`
);
check(
  "while the absent tables are simply absent",
  !partial.gated.some(t => t.startsWith("mll_")),
  `gated: ${partial.gated.join(", ")}`
);

const failed = results.filter(r => !r).length;
console.log(`\n${results.length - failed}/${results.length} checks passed.`);
if (failed) process.exit(1);

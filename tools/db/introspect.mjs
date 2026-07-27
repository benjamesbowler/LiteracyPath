import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { readFileSync, writeFileSync } from "node:fs";

const db = await PGlite.create({ extensions: { pgcrypto } });
await db.exec(readFileSync("bootstrap.sql", "utf8"));
await db.exec(readFileSync(process.argv[2], "utf8"));

const { rows } = await db.query(`
  select c.relname as table_name, a.attname as column_name,
         format_type(a.atttypid, a.atttypmod) as data_type,
         pg_get_expr(d.adbin, d.adrelid) as default_expr
  from pg_attribute a
  join pg_class c on c.oid = a.attrelid
  join pg_namespace n on n.oid = c.relnamespace
  left join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
  where n.nspname = 'public' and c.relkind = 'r'
    and a.attnum > 0 and not a.attisdropped
  order by c.relname, a.attnum;
`);

const byTable = new Map();
for (const r of rows) {
  if (!byTable.has(r.table_name)) byTable.set(r.table_name, []);
  byTable.get(r.table_name).push(r);
}

let out = `-- ===========================================================================
-- SCHEMA RECONCILIATION — runs first, adds only what is missing.
--
-- Why this block exists
-- ---------------------
-- Most migrations here start with \`create table if not exists\`. On a database
-- where the table ALREADY EXISTS but is missing a column added later, that
-- statement does nothing at all — it does not add the column. The next
-- statement that references the column then fails, e.g.
--
--   ERROR: 42703: column "archived_at" does not exist
--   LINE: ... on public.students (class_id, name) where archived_at is null;
--
-- observed on the hosted project 2026-07-27. An empty database never shows this,
-- because there the create-table succeeds with every column present.
--
-- So: before anything else, bring every existing table up to the full column
-- set. Tables that do not exist yet are skipped — the migrations below create
-- them complete. Columns that already exist are left exactly as they are, with
-- their data.
--
-- Generated from the schema produced by applying all migrations to a real
-- PostgreSQL (PGlite), so it cannot drift from what the migrations expect.
-- ===========================================================================

do $reconcile$
begin
`;

for (const [table, cols] of [...byTable].sort()) {
  out += `\n  if to_regclass('public.${table}') is not null then\n`;
  for (const c of cols) {
    // Never add a NOT NULL column to a table that may hold rows unless it has a
    // default; without one the ALTER would fail on non-empty tables.
    const def = c.default_expr ? ` default ${c.default_expr}` : "";
    out += `    alter table public.${table} add column if not exists ${c.column_name} ${c.data_type}${def};\n`;
  }
  out += `  end if;\n`;
}

out += `\nend
$reconcile$;
`;

writeFileSync("reconcile.sql", out);
console.log(`generated reconciliation for ${byTable.size} tables, ${rows.length} columns`);

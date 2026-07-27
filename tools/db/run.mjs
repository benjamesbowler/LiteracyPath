import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { readFileSync } from "node:fs";

const sql = readFileSync(process.argv[2], "utf8");
const db = await PGlite.create({ extensions: { pgcrypto } });

// Just enough Supabase for the migrations to compile: the auth schema,
// auth.uid(), and the roles RLS grants to.
await db.exec(`
  create schema if not exists auth;
  create schema if not exists extensions;
  create table if not exists auth.users (
    id uuid primary key, email text, raw_user_meta_data jsonb
  );
  create or replace function auth.uid() returns uuid language sql stable as $x$ select null::uuid $x$;
  create or replace function auth.role() returns text language sql stable as $x$ select 'authenticated'::text $x$;
  create or replace function auth.jwt() returns jsonb language sql stable as $x$ select '{}'::jsonb $x$;
  do $x$ begin create role anon; exception when duplicate_object then null; end $x$;
  do $x$ begin create role authenticated; exception when duplicate_object then null; end $x$;
  do $x$ begin create role service_role; exception when duplicate_object then null; end $x$;
  create extension if not exists pgcrypto;
`);

try {
  await db.exec(sql);
  console.log("APPLIED CLEANLY");
} catch (error) {
  console.log("FAILED: " + String(error?.message || error).split("\n")[0]);
  for (const k of ["detail", "hint", "position", "where"]) {
    if (error?.[k]) console.log(`  ${k}: ${String(error[k]).slice(0, 300)}`);
  }
  process.exitCode = 1;
}

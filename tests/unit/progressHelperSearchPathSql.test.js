import assert from "node:assert/strict";
import test from "node:test";
import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

const directory = new URL("../../supabase/migrations/", import.meta.url);
const migrationName = "20261018095643_pin_progress_helper_search_paths.sql";
const roots = [
  "lp_el_quest_epoch", "lp_el_quest_number", "lp_el_quest_schema",
  "lp_forward_merge_progress", "lp_has_canonical_el_quest_cycles",
  "lp_hollow_merge_feeds", "lp_hollow_merge_records", "lp_is_current_el_quest",
  "lp_jsonb_forward_merge", "lp_merge_daily_mission", "lp_merge_el_quest_cycles",
  "lp_merge_hollow", "lp_merge_transfer_missions", "lp_normalize_el_quest",
  "lp_quest_independent_count", "lp_quest_merge_learning_v2", "lp_quest_merge_mastery",
  "lp_quest_merge_mastery_record", "lp_quest_merge_v2_content_decks", "lp_quest_merge_v2_deck",
  "lp_quest_normalize_v2_activity_type", "lp_quest_normalize_v2_assignment",
  "lp_quest_normalize_v2_attempt_receipt", "lp_quest_normalize_v2_deck_use",
  "lp_quest_normalize_v2_deck_visit", "lp_quest_num", "lp_quest_pending_reset_ids",
  "lp_quest_reset_history", "lp_quest_reset_id_set", "lp_quest_union_by_id",
  "lp_quest_union_v2_attempt_receipts", "lp_quest_union_v2_deck_uses",
  "lp_quest_union_v2_deck_visits", "lp_quest_union_v2_evidence", "lp_quest_union_v2_ids",
  "lp_quest_valid_v2_attempt_receipts", "lp_quest_valid_v2_content_decks", "lp_status_rank"
];

// Read the canonical pure-function definitions, rather than maintain copied SQL.
// No applied migration is rewritten and no hosted data is loaded by this test.
async function definitions() {
  const found = new Map();
  for (const name of (await readdir(directory)).filter(n => n.endsWith(".sql") && n < migrationName).sort()) {
    const sql = await readFile(new URL(name, directory), "utf8");
    const pattern = /\bcreate\s+(?:or\s+replace\s+)?function\s+public\.(lp_\w+)\s*\(/gi;
    for (const match of sql.matchAll(pattern)) {
      const tail = sql.slice(match.index);
      const body = /\bas\s+(\$(?:\w+)?\$)/i.exec(tail);
      assert.ok(body, `${name}: ${match[1]} has a dollar-quoted body`);
      const end = tail.indexOf(body[1], body.index + body[0].length);
      assert.ok(end >= 0);
      const definition = tail.slice(0, end + body[1].length) + ";";
      found.set(match[1], definition);
    }
  }
  const selected = new Map();
  const visit = name => {
    if (selected.has(name)) return;
    const sql = found.get(name);
    assert.ok(sql, `Canonical definition for ${name}`);
    selected.set(name, sql);
    for (const call of sql.matchAll(/\bpublic\.(lp_\w+)\s*\(/g)) visit(call[1]);
  };
  roots.forEach(visit);
  return selected;
}

const catalog = db => db.query(`select p.proname, pg_get_function_identity_arguments(p.oid) args,
  p.prosrc,p.prosecdef,p.provolatile,p.proisstrict,p.proparallel,p.proowner,p.proacl,p.proconfig
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' order by p.proname,args`).then(r => r.rows);

function callFor(name, sql, variant) {
  const header = sql.slice(0, sql.search(/\breturns\b/i));
  const types = [...header.matchAll(/(?:\(|,)\s*(?:"[^"]+"|\w+)\s+(jsonb|text|integer)\b/gi)].map(m => m[1].toLowerCase());
  assert.ok(types.length, name);
  const values = types.map(type => variant === "null" ? null : type === "integer" ? 5 : type === "text" ? "n" : variant === "nested" ? { n: 3, stars: 2, done: true, ids: ["a", "b"] } : {});
  if (name === "lp_forward_merge_progress" && variant !== "null") values[0] = "profile";
  return { name, query: `select public.${name}(${types.map((type, i) => `$${i + 1}::${type}`).join(",")}) value`, values };
}

async function outcome(db, call) {
  try { return { value: (await db.query(call.query, call.values)).rows[0].value }; }
  catch (error) { return { error: error.code, message: error.message }; }
}

test("progress helper hardening preserves saves and prevents caller-controlled name resolution", async t => {
  const db = new PGlite();
  t.after(() => db.close());
  const source = await definitions();
  await db.exec("create role anon; create role authenticated; set check_function_bodies=off;");
  for (const sql of source.values()) await db.exec(sql);
  const calls = roots.flatMap(name => ["null", "empty", "nested"].map(v => callFor(name, source.get(name), v)));
  const before = await catalog(db);
  const expected = [];
  for (const call of calls) expected.push(await outcome(db, call));
  for (const name of roots) assert.ok(calls.some((c, i) => c.name === name && !expected[i].error), `${name}: at least one successful baseline`);
  await db.exec(await readFile(new URL(migrationName, directory), "utf8"));

  await t.test("caller shadow functions cannot replace JSON type checks or lose earned progress", async () => {
    await db.exec(`create schema spoof;
      create function spoof.jsonb_typeof(jsonb) returns text language sql immutable as $$select 'string'::text$$;
      set search_path=spoof,pg_catalog,public;`);
    const result = await db.query(`select public.lp_jsonb_forward_merge(
      '{"stars":3,"done":true,"ids":["a"]}'::jsonb,
      '{"stars":1,"done":false,"ids":["b"]}'::jsonb) value`);
    assert.deepEqual(result.rows[0].value, { stars: 3, done: true, ids: ["a", "b"] });
    const numeric = await db.query(`select public.lp_el_quest_number('{"n":3}'::jsonb,'n') value`);
    assert.equal(Number(numeric.rows[0].value), 3);
    await db.exec("set search_path=public;");
  });

  await t.test("every targeted helper retains null, empty and nested input behavior", async () => {
    for (let i = 0; i < calls.length; i++) assert.deepEqual(await outcome(db, calls[i]), expected[i], `${calls[i].name}: ${JSON.stringify(calls[i].values)}`);
  });

  await t.test("only the 38 search paths change; bodies, ownership and execution rights remain intact", async () => {
    const after = (await catalog(db)).filter(r => r.proname !== "jsonb_typeof");
    assert.equal(after.length, before.length);
    for (let i = 0; i < before.length; i++) {
      const { proconfig: oldConfig, ...oldDefinition } = before[i];
      const { proconfig: newConfig, ...newDefinition } = after[i];
      assert.deepEqual(newDefinition, oldDefinition, before[i].proname);
      assert.deepEqual(newConfig, roots.includes(before[i].proname) ? ['search_path=""'] : oldConfig, before[i].proname);
    }
    assert.equal(after.filter(r => roots.includes(r.proname) && r.proconfig?.includes('search_path=""')).length, 38);
    await db.exec(await readFile(new URL(migrationName, directory), "utf8"));
    assert.deepEqual((await catalog(db)).filter(r => r.proname !== "jsonb_typeof"), after, "reapplication is harmless");
  });
});

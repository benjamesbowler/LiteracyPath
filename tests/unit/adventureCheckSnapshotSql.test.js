import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { mergeElQuestProgress } from "../../src/utils/adventureMapProgress.js";
import { sanitizeCloudProgressPayload } from "../../src/utils/progressMerge.js";

const readMigration = name => readFile(new URL(`../../supabase/migrations/${name}`, import.meta.url), "utf8");
const wrap = cycle => ({ schemaVersion: 2, progressEpoch: 2, cycles: { "cycle-1": cycle } });
const run = (date, id, correct) => ({
  plays: 1, stars: correct ? 3 : 1, lastPlayedAt: date,
  lastCheck: { version: 1, source: "adventure_map", completedAt: date, questionRecords: [{ questionId: id, isCorrect: correct, responseStatus: correct ? "correct" : "incorrect" }] }
});

test("Adventure question snapshots stay whole in real PostgreSQL and client merges", async t => {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec("create role anon; create role authenticated; create table public.student_progress(student_id text,area text,key text,payload jsonb);");
  await db.exec(await readMigration("20260614090000_progress_forward_merge.sql"));
  // Install exactly the existing pure Adventure functions; table/router
  // integration is unchanged by the one-function forward migration under test.
  const existing = await readMigration("20260902141014_reset_adventure_map_progress_epoch_2.sql");
  await db.exec(existing.slice(existing.indexOf("create or replace function public.lp_el_quest_number"), existing.indexOf("create or replace function public.lp_forward_merge_progress")));
  await db.exec(await readMigration("20260928100000_adventure_check_snapshot_merge.sql"));
  const server = async (left, right) => (await db.query("select public.lp_merge_el_quest_cycle($1::jsonb,$2::jsonb) result", [JSON.stringify(left), JSON.stringify(right)])).rows[0].result;
  const compare = async (left, right) => {
    const actual = await server(left, right);
    const expected = mergeElQuestProgress(wrap(left), wrap(right)).cycles["cycle-1"];
    assert.deepEqual(actual, expected);
    assert.deepEqual(sanitizeCloudProgressPayload("el_quest", wrap(expected)), wrap(expected));
    return actual;
  };
  const older = run("2026-09-27T10:00:00.000Z", "old-correct", true);
  const newer = run("2026-09-28T10:00:00.000Z", "new-error", false);
  await t.test("newer error cannot inherit an older correct answer or question", async () => {
    const result = await compare(older, newer);
    assert.deepEqual(result.lastCheck, newer.lastCheck);
    assert.equal(result.stars, 3);
  });
  await t.test("late offline upload does not overwrite the later run", async () => {
    assert.deepEqual((await compare(newer, older)).lastCheck, newer.lastCheck);
  });
  await t.test("a newer old-client run without detail clears stale question evidence", async () => {
    const oldClient = { ...newer }; delete oldClient.lastCheck;
    assert.equal((await compare(older, oldClient)).lastCheck, undefined);
  });
  await t.test("replay is idempotent and a missing first payload remains intact", async () => {
    assert.deepEqual((await compare(newer, newer)).lastCheck, newer.lastCheck);
    assert.deepEqual((await server(null, newer)).lastCheck, newer.lastCheck);
    assert.deepEqual((await server(newer, null)).lastCheck, newer.lastCheck);
  });
  await t.test("equal timestamps retain the existing play-count tie break", async () => {
    const another = { ...run(newer.lastPlayedAt, "other", true), plays: 2 };
    assert.deepEqual((await compare(newer, another)).lastCheck, another.lastCheck);
    assert.deepEqual((await compare(another, newer)).lastCheck, another.lastCheck);
  });
  await t.test("the replacement remains immutable, invoker-rights and search-path pinned", async () => {
    const functionInfo = (await db.query("select prosecdef,provolatile,proconfig from pg_proc where proname='lp_merge_el_quest_cycle'")).rows[0];
    assert.equal(functionInfo.prosecdef, false);
    assert.equal(functionInfo.provolatile, "i");
    assert.ok(functionInfo.proconfig.includes('search_path=""'));
    for (const role of ["anon", "authenticated"]) {
      assert.equal((await db.query("select has_function_privilege($1,'public.lp_merge_el_quest_cycle(jsonb,jsonb)','EXECUTE') allowed", [role])).rows[0].allowed, true);
    }
  });
});

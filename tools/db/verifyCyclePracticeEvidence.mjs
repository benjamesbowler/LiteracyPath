import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { elSkillsBlockCycles } from "../../src/data/elSkillsBlockCycles.js";
import { buildCyclePlan } from "../../src/components/cycle-practice/cyclePracticeState.js";
import { cycleQuestionRecord, summarizeCycleRecords } from "../../src/policy/cyclePracticePolicy.js";
const root = resolve(import.meta.dirname, "../..");
const db = await PGlite.create({ extensions: { pgcrypto } });
let failure = null;
try {
  await db.exec(readFileSync(join(import.meta.dirname, "bootstrap.sql"), "utf8"));
  for (const name of readdirSync(join(root, "supabase/migrations")).filter(name => name.endsWith(".sql")).sort()) {
    try { await db.exec(readFileSync(join(root, "supabase/migrations", name), "utf8")); }
    catch (error) { throw new Error(`${name}: ${error.message}`, { cause: error }); }
  }
  await db.exec("alter extension pgcrypto set schema extensions");
  const { rows: [boundary] } = await db.query(`select p.prosecdef, p.proconfig,
    exists (select 1 from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) where grantee = 0 and privilege_type = 'EXECUTE') as public_execute,
    has_function_privilege('anon', p.oid, 'EXECUTE') as anon_execute,
    has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_execute
    from pg_proc p where p.oid = 'public.student_complete_focus_cycle_practice(text,uuid,jsonb)'::regprocedure`);
  assert.equal(boundary.prosecdef, true);
  assert.equal(boundary.public_execute, false);
  assert.equal(boundary.anon_execute, true);
  assert.equal(boundary.authenticated_execute, true);
  assert.deepEqual(boundary.proconfig, ["search_path=public"]);
  // The local bootstrap auth.uid stub gains synthetic JWT claims for owner-scope tests.
  await db.exec(`create or replace function auth.uid() returns uuid language sql stable as $x$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $x$`);
  assert.equal((await db.query("select has_table_privilege('authenticated', 'public.student_focus_cycle_practice_attempts', 'SELECT') as allowed")).rows[0].allowed, false);
  for (const file of ["cycle_practice_evidence.sql"]) {
    await db.exec(readFileSync(join(root, "tests/sql", file), "utf8"));
    console.log(`PASS: ${file}`);
  }
  // Exercise the real client blueprint/record contract, not only synthetic SQL tuples.
  const fixtures = readFileSync(join(root, "tests/sql/cycle_practice_evidence.sql"), "utf8").split("do $test$")[0];
  await db.exec(fixtures);
  const { rows: [login] } = await db.query("select public.student_login('a1400000-0000-4000-8000-000000000001','123','real-blueprint-fixture','NULL24') as result");
  for (const cycle of elSkillsBlockCycles.filter(c => c.cycleNumber)) {
    const records = buildCyclePlan(cycle, "client-server-contract", 0, true).rounds.map(round => cycleQuestionRecord(round, { correct: true, selected: round.answer ?? null }, { mode: "assessment", audioDelivery: "delivered" }));
    const attempt = { attemptId: `client-cycle-${cycle.cycleNumber}`, assessmentType: "cycle_practice_check", cycleId: cycle.id, cycleNumber: cycle.cycleNumber,
      contentVersion: "cycle-practice-v2", assessmentVersion: "cycle-practice-v2", policyVersion: "cycle-practice-policy-v2",
      practiceSeconds: 1800, sessionElapsedSeconds: 2000, checkSeconds: 100, questionRecords: records, ...summarizeCycleRecords(records) };
    await db.query("update public.student_focus_session_members set resolved_config=$1::jsonb", [JSON.stringify({ cycle_id: cycle.id, cycle_number: cycle.cycleNumber })]);
    await db.exec("set local role anon");
    const { rows: [saved] } = await db.query("select public.student_complete_focus_cycle_practice($1,'a1500000-0000-4000-8000-000000000001',$2::jsonb) as result", [login.result.token, JSON.stringify(attempt)]);
    await db.exec("reset role");
    assert.equal(saved.result.ok, true, `${cycle.id}: ${JSON.stringify(saved.result)}`);
  }
  await db.exec("rollback");
  console.log("PASS: all 27 real Cycle blueprints accepted through anonymous token boundary");
} catch (error) { failure = error; } finally { await db.close(); }
if (failure) { console.error(failure.message); process.exit(1); }

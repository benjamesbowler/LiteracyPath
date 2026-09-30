import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";

// Synthetic, in-memory PostgreSQL only. Exercises the final migration stack,
// authenticated RPC ownership, immutable source and data-rights removal.
const root = resolve(import.meta.dirname, "../..");
const db = await PGlite.create({ extensions: { pgcrypto } });
const teacher = "f0100000-0000-4000-8000-000000000001";
const other = "f0100000-0000-4000-8000-000000000002";
const classId = "f0200000-0000-4000-8000-000000000001";
const student = "f0300000-0000-4000-8000-000000000001";
const secondStudent = "f0300000-0000-4000-8000-000000000002";
const insight = {
  schemaVersion: 1, key: "sound:m", kind: "instructional-group", label: "m practice",
  focus: "Initial sounds", reason: "Current independent answers on m need review.",
  criterion: { type: "exact-sound-item", minimumIndependentAttempts: 3 },
  evidence: { target: "m", independentAttempts: 4, policyReady: true }
};
const plan = async (snapshot = insight, ids = [student], targets = ["m"]) => (
  await db.query("select to_jsonb(public.teacher_create_insight_intervention('assign_practice',$1,$2::jsonb,$3::uuid[],$4::text[],'Synthetic teacher','Model then practise together',current_date)) as plan",
    [classId, JSON.stringify(snapshot), ids, targets])
).rows[0].plan;
try {
  await db.exec(readFileSync(join(import.meta.dirname, "bootstrap.sql"), "utf8"));
  for (const name of readdirSync(join(root, "supabase/migrations")).filter(name => name.endsWith(".sql")).sort()) {
    try { await db.exec(readFileSync(join(root, "supabase/migrations", name), "utf8")); }
    catch (error) { throw new Error(`${name}: ${error.message}`, { cause: error }); }
  }
  await db.exec(`grant usage on schema auth to anon, authenticated;
    create or replace function auth.uid() returns uuid language sql stable as $x$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $x$;
    insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values
      ('${teacher}','insight-source@example.invalid',now(),'{"audit_only":true}'),
      ('${other}','insight-other@example.invalid',now(),'{"audit_only":true}');
    update public.pending_teacher_accounts set role='teacher',status='approved',approval_status='approved'
      where user_id in ('${teacher}','${other}');
    insert into public.classes(id,teacher_id,name) values ('${classId}','${teacher}','Synthetic source class');
    insert into public.students(id,teacher_id,class_id,name) values
      ('${student}','${teacher}','${classId}','Synthetic student'),
      ('${secondStudent}','${teacher}','${classId}','Second synthetic student');
    insert into public.student_progress(student_id,area,key,payload) values
      ('${student}','phonics_quest','__all__','{"schema":3,"campaign":{"chapter":1,"checkpoints":{}}}');
    select set_config('request.jwt.claim.sub','${teacher}',false);
    set role authenticated;`);
  const before = (await db.query("select payload,updated_at from public.student_progress where student_id=$1", [student])).rows;
  const created = await plan();
  const saved = (await db.query("select source_action,practice_targets,insight_snapshot from public.teacher_interventions where id=$1", [created.id])).rows[0];
  assert.deepEqual(saved, { source_action: "assign_practice", practice_targets: ["m"], insight_snapshot: insight });
  assert.deepEqual((await db.query("select payload,updated_at from public.student_progress where student_id=$1", [student])).rows, before);
  console.log("PASS: complete original insight and exact targets round-trip; current game progress unchanged");
  await assert.rejects(plan(insight, [student], ["m", "m"]), /unique exact targets/);
  await assert.rejects(plan(insight, [student], [null]), /unique exact targets/);
  await assert.rejects(plan(null), /invalid schema/);
  await assert.rejects(plan(insight, [student, student]), /Every action learner/);
  await assert.rejects(plan({ ...insight, unknownField: "reject" }), /invalid schema/);
  await assert.rejects(db.query("update public.teacher_interventions set practice_targets=array['s'] where id=$1", [created.id]), /permission denied/);
  await db.exec(`reset role; select set_config('request.jwt.claim.sub','${other}',false); set role authenticated;`);
  assert.deepEqual((await db.query("select id,insight_snapshot from public.teacher_interventions where id=$1", [created.id])).rows, []);
  await assert.rejects(plan(), /owned class was not found/);
  await db.exec(`reset role; update public.pending_teacher_accounts set status='pending',approval_status='pending' where user_id='${teacher}';
    select set_config('request.jwt.claim.sub','${teacher}',false); set role authenticated;`);
  await assert.rejects(plan(), /approved teacher account/);
  console.log("PASS: duplicates, malformed source, direct writes, foreign ownership and unapproved teachers rejected");
  await db.exec("reset role");
  await assert.rejects(db.query("update public.teacher_interventions set insight_snapshot=$2::jsonb where id=$1", [created.id, JSON.stringify({ ...insight, reason: "Changed" })]), /cannot be changed/);
  await assert.rejects(db.query("update public.teacher_interventions set practice_targets=array['s'] where id=$1", [created.id]), /cannot be changed/);
  await db.exec(`update public.pending_teacher_accounts set status='approved',approval_status='approved' where user_id='${teacher}'; set role authenticated;`);
  const group = await plan(insight, [student, secondStudent]);
  await db.exec("reset role");
  await db.query("update public.teacher_interventions set student_ids=array_remove(student_ids,$2::uuid) where id=$1", [group.id, student]);
  const removed = (await db.query("select source_action,practice_targets,insight_snapshot from public.teacher_interventions where id=$1", [group.id])).rows[0];
  assert.deepEqual(removed, { source_action: null, practice_targets: [], insight_snapshot: null });
  await db.query("delete from public.teacher_interventions where id=$1", [created.id]);
  assert.deepEqual((await db.query("select id from public.teacher_interventions where id=$1", [created.id])).rows, []);
  console.log("PASS: original source is immutable; member removal erases associated source for data rights");
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await db.close();
}

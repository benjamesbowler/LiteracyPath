import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";

const migration = readFileSync(new URL("../../supabase/migrations/20261001103000_admin_usage_insights.sql",import.meta.url),"utf8");
const admin = "11000000-0000-4000-8000-000000000001";
const teacher = "11000000-0000-4000-8000-000000000002";
const secondAdmin = "11000000-0000-4000-8000-000000000003";
const school = "22000000-0000-4000-8000-000000000001";
const otherSchool = "22000000-0000-4000-8000-000000000002";
const learner = "44000000-0000-4000-8000-000000000001";
const otherLearner = "44000000-0000-4000-8000-000000000002";

async function fixture() {
  const db = await PGlite.create({ extensions: { pgcrypto } });
  await db.exec(`create schema auth; create schema extensions; create extension pgcrypto;
    create role anon; create role authenticated;
    create table auth.users(id uuid primary key);
    insert into auth.users values('${admin}'),('${teacher}'),('${secondAdmin}');
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('fixture.actor',true),'')::uuid $$;
    create function public.is_app_admin(id uuid) returns boolean language sql stable as $$ select id in ('${admin}'::uuid,'${secondAdmin}'::uuid) $$;
    create table public.schools(id uuid primary key);
    insert into schools values('${school}'),('${otherSchool}');
    create table public.classes(id uuid primary key, school_id uuid);
    insert into classes values('33000000-0000-4000-8000-000000000001','${school}'),('33000000-0000-4000-8000-000000000002','${otherSchool}');
    create table public.students(id uuid primary key, class_id uuid references classes(id), name text);
    insert into students values('${learner}','33000000-0000-4000-8000-000000000001','Secret Learner'),('${otherLearner}','33000000-0000-4000-8000-000000000002','Other Learner');
    create table public.learn_activity(id uuid default gen_random_uuid(),student_id uuid,created_at timestamptz,occurred_at timestamptz,area text,item_id text,event text,payload jsonb);
    create table public.answers(id uuid default gen_random_uuid(),student_id uuid,answered_at timestamptz,question text,is_correct boolean,client_event_id text);
    create table public.assessment_attempts(student_id text,completed_at timestamptz,payload jsonb);
    create table public.student_progress(student_id uuid,updated_at timestamptz,area text,payload jsonb);
    create table public.mastery(student_id uuid,updated_at timestamptz);
    create table public.item_mastery(student_id uuid,updated_at timestamptz);
    create table public.activity_sync_health(student_id uuid,observed_at timestamptz,device_id text,pending bigint);
    insert into learn_activity(student_id,created_at,occurred_at,area,item_id,event,payload)
      select '${learner}', '2026-09-28','2026-09-28','skills_practice','item-'||n,'answer',
        jsonb_build_object('questionId','item-'||n,'firstResponseCorrect',n%2=0,'collectionVersion',2,
          'studentName','Secret Learner','token','super-secret','device_id','device-secret','free','secret learner ${learner}',
          'nested',jsonb_build_object('email','learner@example.test','note','Private staff note'))
      from generate_series(1,1007) n;
    insert into learn_activity values(gen_random_uuid(),'${otherLearner}','2026-09-28','2026-09-28','other-school','private','done','{}');
    insert into learn_activity values(gen_random_uuid(),'${learner}','2026-09-27','2026-09-27','out-of-range','private','done','{}');
    insert into answers(student_id,answered_at,question,is_correct,client_event_id) values('${learner}','2026-09-28','formal-a',true,'answer-receipt');
    insert into student_progress values('${learner}','2026-09-28','guided_reading','{"completed":true,"studentName":"Secret Learner"}');
    insert into activity_sync_health values('${learner}','2026-09-28','device-secret',3);
  `);
  await db.exec(migration);
  await db.exec(`set fixture.actor = '${admin}';`);
  return db;
}
const result = async (db,sql,args=[]) => (await db.query(sql,args)).rows[0].value;
const create = db => result(db,"select public.admin_create_usage_snapshot('2026-09-28','2026-09-29',$1) value",[school]);

test("admin export exercises real SQL authorization, immutable complete pages, privacy and lifecycle",async t => {
  const db = await fixture();
  try {
    await t.test("all anonymous and non-admin entry points fail; cache tables are private",async () => {
      assert.equal((await db.query("select has_function_privilege('anon','public.admin_create_usage_snapshot(timestamptz,timestamptz,uuid)','execute') allowed")).rows[0].allowed,false);
      assert.equal((await db.query("select has_table_privilege('authenticated','public.admin_usage_snapshot_rows','select') allowed")).rows[0].allowed,false);
      await db.exec(`set fixture.actor = '${teacher}'; set role authenticated;`);
      await assert.rejects(create(db),/administrator required/);
      await assert.rejects(result(db,"select public.admin_purge_usage_snapshots() value"),/administrator required/);
      await assert.rejects(result(db,"select public.admin_read_usage_snapshot(null,0,500) value"),/administrator required/);
      await assert.rejects(result(db,"select public.admin_release_usage_snapshot(null,false) value"),/administrator required/);
      await db.exec("reset role; set fixture.actor = '';");
      await assert.rejects(create(db),/administrator required/);
      await db.exec(`set fixture.actor = '${admin}';`);
      await assert.rejects(result(db,"select public.admin_create_usage_snapshot(null,'2026-09-29',null) value"),/valid from\/to/);
      await assert.rejects(result(db,"select public.admin_create_usage_snapshot('2026-09-29','2026-09-28',null) value"),/valid from\/to/);
      await assert.rejects(result(db,"select public.admin_create_usage_snapshot('2026-09-28','2026-09-29','22000000-0000-4000-8000-000000000099') value"),/Unknown school/);
    });
    await t.test("school/date filtering, >1000 rows, names/tokens/device redaction and immutable capture",async () => {
      const snapshot = await create(db);
      assert.equal(snapshot.rowCount,1011);
      assert.equal(snapshot.sources.find(s=>s.source==='student_focus_cycle_practice_attempts').available,false);
      assert.equal(snapshot.sources.find(s=>s.source==='mastery').rows,0);
      await db.exec(`insert into answers(student_id,answered_at,question,is_correct,client_event_id) values('${learner}','2026-09-28','late-arrival',false,'late-receipt'); update student_progress set payload='{"completed":false}';`);
      const all=[]; let after=0;
      while(true) {
        const page=await result(db,"select public.admin_read_usage_snapshot($1,$2,500) value",[snapshot.snapshotId,after]);
        all.push(...page.rows); after=page.nextAfter;
        if(page.complete) break;
      }
      assert.equal(all.length,1011); assert.equal(all.at(-1).rowNumber,1011);
      const serialized=JSON.stringify(all);
      for(const secret of ['secret learner','Private staff note','Secret Learner','super-secret','device-secret','learner@example.test',learner,otherLearner,'other-school','late-arrival','out-of-range']) assert.equal(serialized.includes(secret),false,secret);
      assert.equal(all.find(r=>r.evidence.source==='student_progress').evidence.data.payload.completed,true);
      assert.ok(all[0].evidence.learnerRef.startsWith('learner-'));
      const projected=await result(db,"select usage_export_project('{\"client_event_id\":\"same-receipt\",\"payload\":{\"answerEventId\":\"same-receipt\"}}'::jsonb,'salt','{}') value");
      assert.equal(projected.client_event_id,projected.payload.answerEventId); assert.ok(projected.client_event_id.startsWith('ref-'));
      const reasons=await result(db,"select usage_export_project('{\"interactionReason\":\"answer_locked\",\"reason\":\"Private staff reason\",\"nested\":{\"interactionReason\":\"Private staff reason\"}}'::jsonb,'salt','{}') value");
      assert.equal(reasons.interactionReason,'answer_locked');assert.equal(Object.hasOwn(reasons,'reason'),false);
      assert.equal(Object.hasOwn(reasons.nested,'interactionReason'),false);
      await assert.rejects(result(db,"select public.admin_read_usage_snapshot($1,-1,500) value",[snapshot.snapshotId]),/Invalid snapshot page/);
      await assert.rejects(result(db,"select public.admin_read_usage_snapshot($1,0,1001) value",[snapshot.snapshotId]),/Invalid snapshot page/);
      await db.exec(`set fixture.actor = '${secondAdmin}';`);
      await assert.rejects(result(db,"select public.admin_read_usage_snapshot($1,0,500) value",[snapshot.snapshotId]),/unavailable/);
      assert.equal((await result(db,"select public.admin_release_usage_snapshot($1,false) value",[snapshot.snapshotId])).released,false);
      await db.exec(`set fixture.actor = '${admin}';`);
      await result(db,"select public.admin_release_usage_snapshot($1,true) value",[snapshot.snapshotId]);
      assert.equal((await db.query("select count(*) n from admin_usage_snapshot_rows where snapshot_id=$1",[snapshot.snapshotId])).rows[0].n,0);
      const audit=await db.query("select detail from admin_usage_export_audit where event='download_requested'");
      assert.equal(JSON.stringify(audit.rows).includes(learner),false);
    });
    await t.test("expiry rejects reads/downloads and purge physically removes rows",async () => {
      const snapshot=await create(db);
      await db.query("update admin_usage_snapshots set expires_at=now()-interval '1 second' where id=$1",[snapshot.snapshotId]);
      await assert.rejects(result(db,"select public.admin_read_usage_snapshot($1,0,500) value",[snapshot.snapshotId]),/expired/);
      await assert.rejects(result(db,"select public.admin_release_usage_snapshot($1,true) value",[snapshot.snapshotId]),/no longer valid/);
      const purged=await result(db,"select public.admin_purge_usage_snapshots() value"); assert.equal(purged.purged,1);
      assert.equal((await db.query("select count(*) n from admin_usage_snapshot_rows")).rows[0].n,0);
    });
    await t.test("learner deletion cascades cache data and invalidates the entire prepared export",async () => {
      const snapshot=await create(db);
      await db.query("delete from students where id=$1",[learner]);
      assert.equal((await db.query("select count(*) n from admin_usage_snapshot_rows where student_id=$1",[learner])).rows[0].n,0);
      await assert.rejects(result(db,"select public.admin_read_usage_snapshot($1,0,500) value",[snapshot.snapshotId]),/invalidated/);
      await assert.rejects(result(db,"select public.admin_release_usage_snapshot($1,true) value",[snapshot.snapshotId]),/no longer valid/);
    });
  } finally { await db.close(); }
});

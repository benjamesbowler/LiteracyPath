import { computeHydratedValue, sanitizeCloudProgressPayload } from "../../src/utils/progressMerge.js";
/** Synthetic PostgreSQL behavior proof; never connects to a hosted database.
 * node tools/db/verifyGameProgressSecurity.mjs
 * Replays all migrations, including an upgrade with preexisting malformed rows.
 */
import assert from 'node:assert/strict';
import process from 'node:process';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';

const root = join(import.meta.dirname, '../..');
const migrationDir = join(root, 'supabase/migrations');
const migrationName = '20261026085730_learn_games_progress_integrity.sql';
const teacher = '11111111-1111-4111-8111-111111111111';
const otherTeacher = '22222222-2222-4222-8222-222222222222';
const school = '33333333-3333-4333-8333-333333333333';
const classId = '44444444-4444-4444-8444-444444444444';
const otherClass = '55555555-5555-4555-8555-555555555555';
const students = ['66666666-6666-4666-8666-666666666666', '77777777-7777-4777-8777-777777777777', '88888888-8888-4888-8888-888888888888'];
let checks = 0;
let failure = false;
const db = await PGlite.create({ extensions: { pgcrypto } });
const q = async (sql, params = []) => (await db.query(sql, params)).rows;
async function test(name, run) {
  await run();
  checks += 1;
  console.log(`ok ${checks} - ${name}`);
}
async function asRole(role, uid, run) {
  await db.exec(`set role ${role}`);
  await q("select set_config('request.jwt.claim.sub', $1, false)", [uid || '']);
  try { return await run(); } finally { await db.exec('reset role'); }
}
const save = (payload, token = 'student-one-token', key = '__all__') => asRole('anon', null,
  async () => (await q('select public.student_save_progress($1, $2, $3, $4::jsonb) as result',
    [token, 'learn_games', key, JSON.stringify(payload)]))[0].result);
const payloadFor = async (student = students[0], key = '__all__') => (await q(
  'select payload from public.student_progress where student_id = $1 and area = $2 and key = $3',
  [student, 'learn_games', key]))[0]?.payload;
const teacherWrite = (payload, student = students[0], key = '__all__') => asRole('authenticated', teacher, () => q(`
  insert into public.student_progress (student_id, area, key, payload) values ($1, 'learn_games', $2, $3::jsonb)
  on conflict (student_id, area, key) do update set payload = excluded.payload`, [student, key, JSON.stringify(payload)]));
async function seed() {
  await db.exec(`
    create or replace function auth.uid() returns uuid language sql stable as $f$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $f$;
    grant usage on schema auth to authenticated, anon;
    insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values
      ('${teacher}','synthetic-teacher@example.invalid',now(),'{"audit_only":true}'),
      ('${otherTeacher}','synthetic-other@example.invalid',now(),'{"audit_only":true}');
    insert into public.pending_teacher_accounts(user_id,email,username,display_name,role,status,approval_status,email_confirmed_at)
      values ('${teacher}','synthetic-teacher@example.invalid','synthetic-teacher','Synthetic Teacher','teacher','approved','approved',now())
      on conflict (user_id) do update set role='teacher',status='approved',approval_status='approved',email_confirmed_at=now();
    insert into public.schools(id,name) values ('${school}','Synthetic Security School');
    insert into public.classes(id,teacher_id,name,school_id,access_code,access_code_expires_at) values
      ('${classId}','${teacher}','Synthetic Class','${school}','ABC123',now()+interval '1 day'),
      ('${otherClass}','${otherTeacher}','Other Class','${school}','DEF456',now()+interval '1 day');
    insert into public.students(id,class_id,teacher_id,name,symbol_password) values
      ('${students[0]}','${classId}','${teacher}','Synthetic One','123'),
      ('${students[1]}','${classId}','${teacher}','Synthetic Two','123'),
      ('${students[2]}','${otherClass}','${otherTeacher}','Synthetic Other Class','123');
    insert into public.student_sessions(student_id,token) values
      ('${students[0]}','student-one-token'), ('${students[1]}','student-two-token');
    insert into public.student_progress(student_id,area,key,payload) values
      ('${students[0]}','learn_games','__all__','{"games":{"poison":{"highScore":"bad","stars":99},"badRecord":null,"good":{"highScore":30,"stars":2}}}'),
      ('${students[1]}','learn_games','__all__','{"games":[]}'),
      ('${students[2]}','learn_games','__all__','{"games":{"good":{"highScore":100}}}');
  `);
  for (const [index, payload] of [null, [], 4, { games: null }, { games: 'bad' },
    { games: { bad: { highScore: '9'.repeat(140000), stars: -5, checkpoints: [] }, good: { plays: 2 } } }].entries()) {
    await q("insert into public.student_progress(student_id,area,key,payload) values ($1,'learn_games',$2,$3::jsonb)",
      [students[0], `legacy-${index}`, JSON.stringify(payload)]);
  }
}
try {
  await db.exec(readFileSync(join(import.meta.dirname, 'bootstrap.sql'), 'utf8'));
  const files = readdirSync(migrationDir).filter(f => f.endsWith('.sql')).sort();
  for (const file of files) {
    if (file === migrationName) await seed();
    try { await db.exec(readFileSync(join(migrationDir, file), 'utf8')); }
    catch (error) { throw new Error(`Migration ${file}: ${error.message}`, { cause: error }); }
  }
  await db.exec('alter extension pgcrypto set schema extensions');
  console.log(`Applied ${files.length} migrations in isolated PGlite.`);
  await test('forward migration safely reapplies without replacing stored evidence', async () => {
    await db.exec(readFileSync(join(migrationDir, migrationName), 'utf8'));
  });
  await test('upgrade preserves legacy evidence until the next valid write', async () => {
    assert.equal((await payloadFor()).games.poison.highScore, 'bad');
  });
  await test('retired peer leaderboard remains unavailable to both browser roles', async () => {
    for (const role of ['anon', 'authenticated']) {
      await assert.rejects(asRole(role, teacher, () => q("select public.get_game_leaderboard('student-one-token',10)")), /permission denied/);
    }
  });
  await test('retained owner reader tolerates malformed peer games and preserves pseudonyms/scope', async () => {
    const result = (await q("select public.get_game_leaderboard('student-one-token',10) as result"))[0].result;
    assert.equal(result.scope, 'class');
    assert.equal(result.rows.length, 2);
    assert.ok(result.rows.every(row => /^Reader [A-F0-9]{6}$/.test(row.student_name)));
  });
  await test('actual client hydrate and full-map save recover legacy fields before strict SQL validation', async () => {
    const legacy = await payloadFor();
    const local = { games: { poison: { highScore: 20, stars: 1, checkpoints: { easy: { level: 2 } } } } };
    const hydrated = computeHydratedValue('learn_games', '__all__', local, legacy);
    assert.equal(hydrated.games.poison.highScore, 20);
    const outgoing = sanitizeCloudProgressPayload('learn_games', { ...hydrated, soundEnabled: false });
    assert.equal((await save(outgoing)).ok, true);
    const stored = await payloadFor();
    assert.equal(stored.games.poison.highScore, 20);
    assert.equal(stored.games.poison.checkpoints.easy.level, 2);
  });
  await test('invalid fresh student payloads are rejected before insert', async () => {
    for (const value of [null, [], 'bad', 7, { games: null }, { games: [] }, { games: { game: [] } },
      { games: { game: { highScore: '4' } } }, { games: { game: { highScore: -1 } } },
      { games: { game: { highScore: 1.5 } } }, { games: { game: { highScore: 2147483648 } } },
      { games: { game: { stars: 4 } } }, { games: { game: { plays: false } } },
      { games: { game: { checkpoints: [] } } }, { games: { game: { bestSplits: null } } }]) {
      await assert.rejects(save(value, 'student-one-token', 'invalid-fresh'), /invalid_learn_games/);
    }
    assert.equal(await payloadFor(students[0], 'invalid-fresh'), undefined);
  });
  await test('invalid updates cannot hide behind forward merge', async () => {
    await assert.rejects(save({ games: { good: { highScore: null } } }), /invalid_learn_games/);
    assert.equal((await payloadFor()).games.good.highScore, 30);
  });
  await test('valid student update repairs legacy poison while preserving unrelated healthy progress', async () => {
    assert.equal((await save({ games: { good: { highScore: 15, stars: 1 } } })).ok, true);
    const payload = await payloadFor();
    assert.equal(payload.games.good.highScore, 30);
    assert.equal(payload.games.good.stars, 2);
    assert.equal(payload.games.poison.highScore, 20);
    assert.equal(payload.games.badRecord, undefined);
  });
  await test('settings-only, empty games and score-free checkpoints remain valid', async () => {
    await save({ difficulty: 'hard', soundEnabled: false }, 'student-two-token');
    await save({ games: {} }, 'student-two-token');
    await save({ games: { 'rocket-run': { checkpoints: { easy: { level: 3, totalLevels: 10 } } } } }, 'student-two-token');
    const payload = await payloadFor(students[1]);
    assert.equal(payload.difficulty, 'hard');
    assert.equal(payload.games['rocket-run'].checkpoints.easy.level, 3);
    assert.equal(payload.games['rocket-run'].highScore, undefined);
  });
  await test('teacher direct insert and update share the same validation', async () => {
    await assert.rejects(teacherWrite({ games: [] }, students[0], 'teacher-new'), /invalid_learn_games/);
    await teacherWrite({ games: { game: { highScore: 10 } } }, students[0], 'teacher-new');
    await assert.rejects(teacherWrite({ games: { game: { stars: -1 } } }, students[0], 'teacher-new'), /invalid_learn_games/);
    await teacherWrite({ games: { game: { highScore: 5 } } }, students[0], 'teacher-new');
    assert.equal((await payloadFor(students[0], 'teacher-new')).games.game.highScore, 10);
  });
  await test('teacher write cannot cross ownership and anonymous table access is denied', async () => {
    await assert.rejects(teacherWrite({ games: {} }, students[2]), /row-level security/);
    await assert.rejects(asRole('anon', null, () => q('select * from public.student_progress')), /permission denied/);
  });
  await test('teacher partial updates repair legacy root/container/counter poison without blocking', async () => {
    for (let index = 0; index < 6; index += 1) {
      await teacherWrite({ difficulty: 'easy' }, students[0], `legacy-${index}`);
      const payload = await payloadFor(students[0], `legacy-${index}`);
      assert.equal(payload.difficulty, 'easy');
      if (index === 5) {
        assert.deepEqual(payload.games.bad, {});
        assert.equal(payload.games.good.plays, 2);
      }
    }
  });
  await test('profile accessibility remains teacher-owned through the unchanged shared trigger', async () => {
    const writeProfile = (role, uid, payload) => asRole(role, uid, () => q(`
      insert into public.student_progress(student_id,area,key,payload) values ($1,'profile','__all__',$2::jsonb)
      on conflict(student_id,area,key) do update set payload=excluded.payload`, [students[0],JSON.stringify(payload)]));
    await writeProfile('authenticated', teacher, { accessibilitySettings: { largeText: true }, companion: 'owl' });
    await asRole('anon', null, () => q("select public.student_save_progress('student-one-token','profile','__all__',$1::jsonb)",
      [JSON.stringify({ accessibilitySettings: { largeText: false }, companion: 'fox' })]));
    const payload = (await q("select payload from public.student_progress where student_id=$1 and area='profile'", [students[0]]))[0].payload;
    assert.deepEqual(payload.accessibilitySettings, { largeText: true });
    assert.equal(payload.companion, 'fox');
  });
  await test('nested best splits and practice snapshots retain replacement/clear/restart behavior', async () => {
    const checkpoint = (id, index, revision, extra = {}) => ({ games: { 'literacy-practice': {
      checkpoints: { practice: { id, startedAt: id === 'old' ? '2026-10-25T00:00:00Z' : '2026-10-26T00:00:00Z', index, checkpointRevision: revision, ...extra } }
    } } });
    await save({ games: { racer: { bestSplits: { easy: { 0: { durationMs: 4000, stars: 2 } } } } } });
    await save(checkpoint('old', 3, 3, { questionIds: ['a','b'] }));
    await save(checkpoint('old', 2, 2, { questionIds: ['c'] }));
    assert.equal((await payloadFor()).games['literacy-practice'].checkpoints.practice.index, 3);
    await save(checkpoint('old', 3, 4, { cleared: true }));
    await save(checkpoint('old', 4, 5));
    assert.equal((await payloadFor()).games['literacy-practice'].checkpoints.practice.cleared, true);
    await save(checkpoint('new', 0, 1, { questionIds: ['z'] }));
    const payload = await payloadFor();
    assert.deepEqual(payload.games['literacy-practice'].checkpoints.practice.questionIds, ['z']);
    assert.deepEqual(payload.games.racer.bestSplits.easy['0'], { durationMs: 4000, stars: 2 });
    await save({ games: { 'literacy-practice': { checkpoints: { practice: null } } } });
    assert.equal((await payloadFor()).games['literacy-practice'].checkpoints.practice, null);
  });
  await test('multiple maximum scores aggregate without int overflow', async () => {
    await save({ games: { max1: { highScore: 2147483647 }, max2: { highScore: 2147483647 } } });
    const result = (await q("select public.get_game_leaderboard('student-one-token',10) as result"))[0].result;
    assert.equal(result.rows[0].total_points, 2147483647);
  });
  await test('oversized legacy numeric strings cannot reach numeric casts', async () => {
    assert.equal(Number((await q("select public.lp_leaderboard_metric(to_jsonb(repeat('9',140000)),2147483647) as n"))[0].n), 0);
  });
  const login = (sequence, code = 'ABC123', student = students[0], device = 'synthetic-device-0001') => asRole('anon', null,
    async () => (await q('select public.student_login($1,$2,$3,$4) as result', [student, sequence, device, code]))[0].result);
  const countSessions = async () => Number((await q('select count(*) as n from public.student_sessions'))[0].n);
  await test('NULL/empty/malformed/wrong picture sequences issue no session', async () => {
    const before = await countSessions();
    for (const value of [null, '', '12', 'abc', '456']) {
      assert.equal((await login(value)).ok, false);
    }
    assert.equal(await countSessions(), before);
  });
  await test('locked learner is denied even with correct credentials', async () => {
    assert.equal((await login('123')).error, 'locked');
    await db.exec(`update public.students set failed_login_count=0,last_failed_login_at=null where id='${students[0]}'`);
  });
  await test('NULL/wrong/expired class code and archived learner issue no session', async () => {
    const before = await countSessions();
    assert.equal((await login('123', null)).error, 'invalid_code');
    assert.equal((await login('123', 'WRONG1')).error, 'invalid_code');
    await db.exec(`update public.classes set access_code_expires_at=now()-interval '1 day' where id='${classId}'`);
    assert.equal((await login('123', 'ABC123', students[0], 'synthetic-device-0002')).error, 'code_expired');
    await db.exec(`update public.classes set access_code_expires_at=now()+interval '1 day' where id='${classId}';
      update public.students set archived_at=now() where id='${students[1]}'`);
    assert.equal((await login('123', 'ABC123', students[1])).error, 'not_found');
    assert.equal(await countSessions(), before);
    await db.exec(`update public.students set archived_at=null where id='${students[1]}'`);
  });
  await test('correct login returns the server expiry and issues exactly one session', async () => {
    const before = await countSessions();
    const result = await login('123', 'ABC123', students[0], 'synthetic-device-0003');
    assert.equal(result.ok, true);
    assert.ok(result.token && result.expires_at);
    const row = (await q('select expires_at from public.student_sessions where token=$1', [result.token]))[0];
    assert.equal(new Date(result.expires_at).getTime(), new Date(row.expires_at).getTime());
    assert.equal(await countSessions(), before + 1);
  });
  await test('missing/wrong/expired/revoked/archived tokens cannot save progress', async () => {
    for (const token of [null, '', 'wrong-token']) assert.equal((await save({}, token)).error, 'invalid_session');
    await db.exec("update public.student_sessions set expires_at=now()-interval '1 day' where token='student-two-token'");
    assert.equal((await save({}, 'student-two-token')).error, 'invalid_session');
    await db.exec("update public.student_sessions set expires_at=now()+interval '1 day',revoked=true where token='student-two-token'");
    assert.equal((await save({}, 'student-two-token')).error, 'invalid_session');
    await db.exec(`update public.student_sessions set revoked=false where token='student-two-token';
      update public.students set archived_at=now() where id='${students[1]}'`);
    assert.equal((await save({}, 'student-two-token')).error, 'invalid_session');
  });
  console.log(`PASS: ${checks} behavioral checks; no hosted database used.`);
} catch (error) {
  console.error(`FAIL: ${error.message}`);
  if (error.where) console.error(error.where);
  failure = true;
} finally { await db.close(); }
if (failure) process.exit(1);

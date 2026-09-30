import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { createClient } from '@supabase/supabase-js';
import { CAMPAIGN_VERSION, CAMPAIGN_STAGES, CAMPAIGN_MISSIONS } from '../../src/features/soundSeekers/v3/content/campaign.js';
import { normalizeCampaignProgress, beginCampaignMission, recordCampaignEvidence } from '../../src/features/soundSeekers/v3/engine/campaignProgress.js';
import { buildCampaignMission, createCampaignBeatState } from '../../src/features/soundSeekers/v3/engine/campaignChallenges.js';
import { createCampaignStorage, campaignStorageKey } from '../../src/features/soundSeekers/v3/campaignStorage.js';
import { createValidatedSupabaseClient } from '../../src/data/boundaries/facade.js';
import { selectAllRows } from '../../src/data/pagedSelect.js';
import { encodeCampaignTransport } from '../../src/utils/campaignTransport.js';
import { campaignHomeSummary, campaignParticipationCache, campaignParticipationSummary, CAMPAIGN_PARTICIPATION_SELECT } from '../../src/features/soundSeekers/rounded/campaignSummary.js';

const catalog = { version: CAMPAIGN_VERSION, stages: CAMPAIGN_STAGES, missions: CAMPAIGN_MISSIONS };
const fresh = () => normalizeCampaignProgress(null, catalog);
const completion = id => [id, { at: 1, attemptId: `complete-${id}`, contentVersion: 1 }];
const project = progress => ({ progressVersion: progress.v, campaignVersion: progress.campaign.v,
  completedMissions: progress.campaign.completedMissions, attemptIds: progress.campaign.attemptIds,
  currentStageId: progress.campaign.currentStageId, participation: progress.campaign.participation });
const event = (id, at) => ({ id, at, missionId: 'meadow-01-1', attemptId: 'attempt-a', kind: 'practice', evidenceType: 'formative' });
const receipt = item => JSON.stringify([item.missionId, item.attemptId, item.id]);

test('Home exposes actual 30-stage/150-main/60-optional totals and preserves teaching anchors separately', () => {
  const p = normalizeCampaignProgress({ v: 2, trail: { completedStopIds: Array.from({ length: 40 }, (_, i) => `s${i + 1}`) } }, catalog);
  const result = campaignHomeSummary(p);
  assert.equal(result.available, true);
  assert.deepEqual([result.totalStages, result.totalMissions, result.totalOptionalMissions], [30, 150, 60]);
  assert.deepEqual([result.stagesCompleted, result.missionsCompleted, result.optionalMissionsCompleted], [0, 0, 0]);
  assert.equal(result.currentStageId, 'meadow-01');
  assert.equal(result.next.missionId, 'meadow-01-1');
  assert.equal(result.started, false);
});

test('Home resumes the exact unlocked saved mission, rejects locked current selections and completed checkpoints', () => {
  const p = fresh();
  p.campaign.currentStageId = 'moonwood-30';
  p.campaign.activeMissionId = 'moonwood-30-1';
  p.campaign.checkpoints['moonwood-30-1'] = { completed: false };
  assert.equal(campaignHomeSummary(p).currentStageId, 'meadow-01');
  p.campaign.activeMissionId = 'meadow-01-2';
  p.campaign.checkpoints['meadow-01-2'] = { completed: false };
  assert.equal(campaignHomeSummary(p).activeMissionId, 'meadow-01-2');
  assert.equal(campaignHomeSummary(p).next.label, 'Soap on the Shelf');
  assert.equal(campaignHomeSummary(p).next.resume, true);
  p.campaign.checkpoints['meadow-01-2'].completed = true;
  p.campaign.completedMissions['meadow-01-2'] = completion('meadow-01-2')[1];
  assert.equal(campaignHomeSummary(p).activeMissionId, null);
  assert.equal(campaignHomeSummary(p).next.missionId, 'meadow-01-1');
});

test('main stage counts require all five missions, optional quests never gate or fabricate completion', () => {
  const p = fresh();
  p.campaign.completedMissions = Object.fromEntries(CAMPAIGN_STAGES[0].optionalMissionIds.map(completion));
  assert.equal(campaignHomeSummary(p).stagesCompleted, 0);
  assert.equal(campaignHomeSummary(p).optionalMissionsCompleted, 2);
  p.campaign.completedMissions = { ...p.campaign.completedMissions,
    ...Object.fromEntries(CAMPAIGN_STAGES[0].missionIds.slice(1).map(completion)) };
  assert.equal(campaignHomeSummary(p).stagesCompleted, 0);
  p.campaign.completedMissions['meadow-01-1'] = completion('meadow-01-1')[1];
  p.campaign.currentStageId = 'meadow-02';
  assert.equal(campaignHomeSummary(p).stagesCompleted, 1);
  assert.equal(campaignHomeSummary(p).next.missionId, 'meadow-02-1');
  p.campaign.completedMissions = Object.fromEntries(CAMPAIGN_MISSIONS.filter(item => item.kind === 'main').map(item => completion(item.id)));
  const complete = campaignHomeSummary(p);
  assert.equal(complete.status, 'complete');
  assert.deepEqual([complete.stagesCompleted, complete.missionsCompleted, complete.optionalMissionsCompleted], [30, 150, 0]);
  assert.equal(Object.hasOwn(complete, 'mastery'), false);
});

test('unreadable and future Home saves cannot silently show a fresh playable recommendation', () => {
  for (const p of [null, {}, { v: 99 }, { v: 3, campaign: { v: 99 } }]) {
    const result = campaignHomeSummary(p);
    assert.equal(result.available, false);
    assert.equal(result.next, null);
    assert.equal(Object.hasOwn(result, 'missionsCompleted'), false);
  }
});

test('compact activity uses unique formative response receipts and original answer times, never scene timestamps', () => {
  const first = event('first', Date.parse('2026-09-28T08:00:00Z'));
  const second = event('second', Date.parse('2026-09-29T08:00:00Z'));
  const p = fresh();
  p.updatedAt = Date.parse('2026-09-30T20:00:00Z');
  p.evidence = [first, second, { ...first, at: p.updatedAt }, { ...event('formal', p.updatedAt), kind: 'assessment' },
    { ...event('old-anchor', p.updatedAt), missionId: 's40' }];
  assert.deepEqual(campaignParticipationCache(p), { v: 1, attempts: 2, lastAnsweredAt: '2026-09-29T08:00:00.000Z' });
  assert.deepEqual(campaignParticipationCache({ evidence: [], updatedAt: p.updatedAt }), { v: 1, attempts: 0, lastAnsweredAt: '' });
  assert.equal(campaignParticipationCache({ evidence: [event('undated', '42')] }).lastAnsweredAt, '',
    'a numeric-looking token is not an ISO answer date');
});

test('teacher totals use the merged receipt union and clearly scope conservatively stale dates', () => {
  const p = fresh();
  const first = event('first', Date.parse('2026-09-28T08:00:00Z'));
  const second = event('second', Date.parse('2026-09-29T08:00:00Z'));
  p.campaign.attemptIds = { [receipt(first)]: true, [receipt(second)]: true, bad: true,
    [JSON.stringify(['meadow-01-1', 'attempt-a', 'not-recorded'])]: false };
  p.campaign.completedMissions = Object.fromEntries(CAMPAIGN_STAGES[0].missionIds.map(completion));
  p.campaign.participation = campaignParticipationCache({ evidence: [first] });
  const result = campaignParticipationSummary(project(p));
  assert.equal(result.attempts, 2);
  assert.equal(result.participationCacheCurrent, false);
  assert.equal(result.lastActivityLabel, 'Last reported practice answer');
  assert.equal(result.lastActiveAt, '2026-09-28T08:00:00.000Z');
  assert.equal(result.stagesCompleted, 1);
  assert.equal(result.practiceOnly, true);
  assert.equal(Object.hasOwn(result, 'mastery'), false);
  delete p.campaign.participation;
  assert.equal(campaignParticipationSummary(project(p)).lastActiveAt, '');
  p.campaign.participation = { v: 1, attempts: 3, lastAnsweredAt: '2026-09-30T08:00:00Z' };
  assert.equal(campaignParticipationSummary(project(p)).lastActiveAt, '', 'a cache exceeding actual receipt totals cannot invent activity');
});

test('teacher summary never accesses private checkpoints, per-answer bodies, target scores or motion time', async () => {
  const p = fresh();
  p.campaign.checkpoints = {};
  const encoded = await encodeCampaignTransport(p);
  const minimal = project(encoded);
  for (const field of ['checkpoints', 'evidence', 'targets', 'updatedAt', 'payload']) {
    Object.defineProperty(minimal, field, { get() { throw new Error(`Private field read: ${field}`); } });
  }
  assert.equal(campaignParticipationSummary(minimal).attempts, 0);
  assert.equal(campaignParticipationSummary({ ...project(p), progressVersion: 99 }), null);
  assert.doesNotMatch(CAMPAIGN_PARTICIPATION_SELECT, /checkpoints|evidence|targets|updated_at|updatedAt|(?:^|,)\s*payload\s*(?:,|$)/);
  const source = readFileSync(new URL('../../src/appState/useAppSessionController.js', import.meta.url), 'utf8');
  assert.match(source, /\.select\(CAMPAIGN_PARTICIPATION_SELECT\)[\s\S]*?\.eq\("key", CAMPAIGN_PROGRESS_ROW\)[\s\S]*?\.in\("student_id", studentIds\)/);
  assert.doesNotMatch(source, /\.in\("key", \[[^\]]*CAMPAIGN_PROGRESS_ROW/);
});

test('deployed local SQL merges encoded disjoint answers while narrow teacher projection conservatively scopes its cached date', async t => {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(`create role anon; create role authenticated;
    create table public.student_progress(student_id text,area text,key text,payload jsonb,primary key(student_id,area,key));
    create function public.lp_quest_merge_learning_v2(existing jsonb,incoming jsonb) returns jsonb language sql immutable as $$ select jsonb_build_object('legacyDispatch', true); $$;`);
  for (const name of ['20260910120000_sound_seekers_campaign_merge.sql', '20260910123000_sound_seekers_campaign_search_path.sql']) {
    await db.exec(readFileSync(new URL(`../../supabase/migrations/${name}`, import.meta.url), 'utf8'));
  }
  const mission = CAMPAIGN_MISSIONS[0];
  const beat = buildCampaignMission(mission).beats.find(item => item.key);
  const base = beginCampaignMission(fresh(), mission.id, { attemptId: 'parallel', challenges: [beat], beatState: createCampaignBeatState(beat) }, catalog, 1);
  const a = recordCampaignEvidence(base, mission.id, { id: 'answer-a', attemptId: 'parallel' }, catalog, Date.parse('2026-09-28T08:00:00Z'));
  const b = recordCampaignEvidence(base, mission.id, { id: 'answer-b', attemptId: 'parallel' }, catalog, Date.parse('2026-09-29T08:00:00Z'));
  a.campaign.participation = campaignParticipationCache(a);
  b.campaign.participation = campaignParticipationCache(b);
  b.updatedAt = Date.parse('2026-09-30T20:00:00Z');
  const left = await encodeCampaignTransport(a), right = await encodeCampaignTransport(b);
  const merged = (await db.query('select public.lp_merge_phonics_quest($1::jsonb,$2::jsonb) result', [JSON.stringify(left), JSON.stringify(right)])).rows[0].result;
  assert.equal(merged.campaign.checkpoints[mission.id].challenges.codec, 'campaign-challenges-gzip-v1');
  const projected = (await db.query(`select payload->'v' as "progressVersion", payload->'campaign'->'v' as "campaignVersion",
    payload->'campaign'->'completedMissions' as "completedMissions", payload->'campaign'->'attemptIds' as "attemptIds",
    payload->'campaign'->'participation' as participation from (select $1::jsonb payload) saved`, [JSON.stringify(merged)])).rows[0];
  assert.deepEqual(Object.keys(projected).sort(), ['attemptIds', 'campaignVersion', 'completedMissions', 'participation', 'progressVersion'].sort());
  const teacher = campaignParticipationSummary(projected);
  assert.equal(teacher.attempts, 2);
  assert.equal(teacher.participationCacheCurrent, false);
  assert.equal(teacher.lastActiveAt, '2026-09-29T08:00:00.000Z');
  assert.equal(teacher.lastActivityLabel, 'Last reported practice answer');
  const data = new Map([[campaignStorageKey('actual-learner'), JSON.stringify(merged)]]);
  let queued;
  const storage = createCampaignStorage({ storage: { getItem: key => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) },
  schedule: () => 1, cancel: () => {}, queueSave: (_area, _row, payload) => { queued = payload; return true; } });
  const loaded = storage.loadCampaignProgress('actual-learner');
  assert.equal(loaded.ok, true);
  assert.equal(storage.saveCampaignProgress('actual-learner', loaded.progress).ok, true);
  await storage.flushCampaignProgress('actual-learner');
  assert.equal(campaignParticipationSummary(project(queued)).attempts, 2);
  assert.equal(campaignParticipationSummary(project(queued)).participationCacheCurrent, true);
  assert.equal(queued.campaign.participation.lastAnsweredAt, '2026-09-29T08:00:00.000Z');
  await storage.disposeCampaignStorage('actual-learner');
});

test('the actual PostgREST client pages the teacher JSON projection through the validated read boundary with exact class scope', async () => {
  const rows = ['learner-a', 'learner-b'].map(student_id => ({ student_id, key: 'sound_seekers_v3', ...project(fresh()) }));
  const requests = [];
  const raw = createClient('https://fixture.invalid', 'synthetic-public-key', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: async (input, options) => {
      const url = new URL(typeof input === 'string' ? input : input.url);
      requests.push({ url, method: options?.method || 'GET' });
      const from = Number(url.searchParams.get('offset') || 0);
      const size = Number(url.searchParams.get('limit') || 1);
      return new Response(JSON.stringify(rows.slice(from, from + size)), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } }
  });
  const client = createValidatedSupabaseClient(raw);
  const result = await selectAllRows(() => client.table('student_progress').select(CAMPAIGN_PARTICIPATION_SELECT)
    .eq('area', 'phonics_quest').eq('key', 'sound_seekers_v3').in('student_id', ['learner-a', 'learner-b']), { pageSize: 1 });
  assert.equal(result.error, null);
  assert.equal(result.truncated, false);
  assert.equal(result.data.length, 2);
  assert.equal(requests.length, 3);
  for (const { url, method } of requests) {
    assert.equal(method, 'GET');
    assert.equal(url.hostname, 'fixture.invalid');
    assert.equal(url.searchParams.get('area'), 'eq.phonics_quest');
    assert.equal(url.searchParams.get('key'), 'eq.sound_seekers_v3');
    assert.equal(url.searchParams.get('student_id'), 'in.(learner-a,learner-b)');
    const selected = url.searchParams.get('select');
    assert.match(selected, /progressVersion:payload->v/);
    assert.match(selected, /participation:payload->campaign->participation/);
    assert.doesNotMatch(selected, /evidence|checkpoints|targets|updated_at|(?:^|,)payload(?:,|$)/);
  }
  for (const row of result.data) assert.equal(campaignParticipationSummary(row).practiceOnly, true);
});

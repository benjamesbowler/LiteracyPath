import { campaignDeltaFromAck } from '../../src/utils/campaignDelta.js';
import { encodeCampaignTransport, decodeCampaignTransport, canonicalCampaignChallenges } from '../../src/utils/campaignTransport.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { normalizeCampaignProgress, beginCampaignMission, recordCampaignEvidence,
  updateCampaignCheckpoint, completeCampaignMission, restartCampaignMission, mergeCampaignProgress
} from '../../src/features/soundSeekers/v3/engine/campaignProgress.js';
import { sanitizeCloudProgressPayload } from '../../src/utils/progressMerge.js';

const catalog = { version: 1, stages: [{ id: 'stage' }], missions: [
  { id: 'bridge', stageId: 'stage', outcome: { repairId: 'crossing' } },
  { id: 'tree', stageId: 'stage', outcome: { repairId: 'ladder' } }
] };
const fresh = () => normalizeCampaignProgress(null, catalog);
const start = (progress, missionId = 'bridge', attemptId = `${missionId}-attempt`) => beginCampaignMission(progress, missionId, {
  attemptId, challenges: [{ id: 'beat', choices: ['cat','cap'], target: 'cat' }], beatState: { supportUsed: [], errors: 0 }
}, catalog, 1);
const record = (p, id, extras = {}) => recordCampaignEvidence(p, 'bridge', { id, attemptId: 'bridge-attempt', targetIds: ['gpc-a'], independent: true, ...extras }, catalog, 2);
const finish = (p, id) => completeCampaignMission(updateCampaignCheckpoint(p, id, {
  attemptId: `${id}-attempt`, beatIndex: 1, beatState: { done: true }
}, 3), id, catalog, 4);
const clientMerge = (a, b) => sanitizeCloudProgressPayload('phonics_quest', mergeCampaignProgress({ scopeKey: 'fixture', progress: a }, { scopeKey: 'fixture', progress: b }, catalog).progress);

// Real PostgreSQL execution, local in-memory engine only. No hosted client,
// URL, account or persistent database is involved in these behavioral checks.
test('campaign SQL merge matches client evidence, checkpoints, replay and retained targets', async t => {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(`create role anon; create role authenticated;
    create table public.student_progress(student_id text,area text,key text,payload jsonb,primary key(student_id,area,key));
    create function public.lp_quest_merge_learning_v2(existing jsonb,incoming jsonb) returns jsonb language sql immutable as $$ select jsonb_build_object('legacyDispatch', true); $$;`);
  const sql = await readFile(new URL('../../supabase/migrations/20260910120000_sound_seekers_campaign_merge.sql', import.meta.url), 'utf8');
  await db.exec(sql);
  const serverMerge = async (a, b) => (await db.query('select public.lp_merge_phonics_quest($1::jsonb,$2::jsonb) result', [JSON.stringify(a), JSON.stringify(b)])).rows[0].result;
  const compare = async (a, b) => {
    const expected = clientMerge(a, b);
    assert.deepEqual(await serverMerge(a, b), expected);
    assert.deepEqual(await serverMerge(b, a), clientMerge(b, a));
    assert.deepEqual(await serverMerge(expected, expected), clientMerge(expected, expected));
    return expected;
  };
  await t.test('disjoint tab responses union once and preserve retained original counters', async () => {
    const base = fresh();
    base.targets = { 'gpc-a': { independent: 5, supported: 2, missed: 1, taught: true, lastSeenStep: 0, confusions: { cap: 1 } } };
    const shared = record(start(base), 'shared');
    const a = record(shared, 'a');
    const b = record(shared, 'b', { independent: false, errors: 1, confusedWith: 'cap' });
    const merged = await compare(a, b);
    assert.equal(merged.targets['gpc-a'].independent, 7);
    assert.equal(merged.targets['gpc-a'].supported, 3);
    assert.equal(merged.evidence.length, 3);
    assert.deepEqual(await serverMerge(merged, a), clientMerge(merged, a));
  });
  await t.test('ACK delta preserves full counters and journey steps without re-uploading old evidence', async () => {
    const base=fresh();base.targets={'gpc-a':{independent:5,supported:2,missed:1,confusions:{cap:1},taught:true}};
    const originalAck=finish(record(start(base),'old'), 'bridge');const ack=await serverMerge(originalAck,originalAck);
    const originalNext=finish(start(ack,'tree'),'tree');const next=await serverMerge(originalNext,originalNext);
    const delta=campaignDeltaFromAck(next,ack);
    assert.equal(delta.evidence.length,0);assert.equal(Object.keys(delta.campaign.checkpoints).length,1);
    assert.deepEqual(await serverMerge(ack,delta),clientMerge(ack,next));
    assert.deepEqual(await serverMerge(await serverMerge(ack,delta),delta),clientMerge(ack,next));
    const originalAnswerAck=record(start(base),'old');const answerAck=await serverMerge(originalAnswerAck,originalAnswerAck);const answerNext=record(answerAck,'new',{independent:false,errors:1,confusedWith:'cap'});
    const answerDelta=campaignDeltaFromAck(answerNext,answerAck);
    assert.equal(answerDelta.evidence.length,1);
    assert.deepEqual(await serverMerge(answerAck,answerDelta),clientMerge(answerAck,answerNext));
    assert.deepEqual(await serverMerge(await serverMerge(answerAck,answerDelta),answerDelta),clientMerge(answerAck,answerNext));
    await assert.rejects(serverMerge({},answerDelta),/requires a saved full/);
  });
  await t.test('parallel story completion retains both repairs without manufacturing evidence', async () => {
    const base = start(fresh());
    const a = finish(base, 'bridge');
    const b = finish(start(base, 'tree'), 'tree');
    const merged = await compare(a, b);
    assert.equal(merged.journeyStep, 2);
    assert.equal(merged.evidence.length, 0);
  });
  await t.test('checkpoint support survives newer stale state and challenges remain unchanged', async () => {
    const base = start(fresh());
    const a = updateCampaignCheckpoint(base, 'bridge', { attemptId: 'bridge-attempt', beatState: { errors: 2, supportUsed: ['model'], modelShown: true } }, 3);
    const b = updateCampaignCheckpoint(base, 'bridge', { attemptId: 'bridge-attempt', beatState: { errors: 0 } }, 20);
    const merged = await compare(a,b);
    assert.equal(merged.campaign.checkpoints.bridge.beatState.errors, 2);
  });
  await t.test('replay retains original completion and selects the new exact attempt', async () => {
    const completed = finish(start(fresh()), 'bridge');
    const replay = restartCampaignMission(completed, 'bridge', { attemptId: 'replay', challenges: [{ id: 'new-beat', target: 'cap' }], beatState: {} }, catalog, 30);
    const merged = await compare(completed, replay);
    assert.equal(merged.campaign.checkpoints.bridge.attemptId, 'replay');
    assert.deepEqual(merged.campaign.repairs, completed.campaign.repairs);
  });
  await t.test('same-millisecond authority progress and hearing receipts survive stale checkpoint merges', async () => {
    const base = start(fresh());
    const state = value => updateCampaignCheckpoint(base, 'bridge', { attemptId: 'bridge-attempt', beatState: value }, 10);
    for (const [before, after] of [[{ placed: [] },{ placed: ['a'] }],[{itemIndex:0,placed:{}},{itemIndex:1,placed:{a:'bin'}}],[{cardsHeard:[]},{cardsHeard:['a']}],[{done:false},{done:true}]]) await compare(state(before),state(after));
    const a = state({ cardsHeard:['a'],heardSources:['audio-a'],sceneRepairs:{0:{type:'CHOOSE',choiceId:'a'}} });
    const b = state({ cardsHeard:['b'],heardSources:['audio-b'],sceneRepairs:{1:{type:'CHOOSE',choiceId:'b'}} });
    await compare(a,b);
    await assert.rejects(serverMerge(state({placed:['a']}),state({placed:['b']})),/placement sequence/);
  });
  await t.test('workshop replacement keeps exact word units and partial bridge receipts through stale merges', async () => {
    const base = beginCampaignMission(fresh(), 'bridge', { attemptId: 'bridge-attempt',
      challenges: [{ id: 'workshop', mechanic: 'word_forge', view: { slots: 1, workshop: { mode: 'replace', baseWord: 'cat', baseUnits: ['c','a','t'], slotIndex: 2 } }, key: { sequence: ['p-tile'] } }],
      beatState: { placed: [], wordUnits: ['c','a','t'], slotErrors: 0, supportUsed: [], done: false }
    }, catalog, 1);
    const completed = updateCampaignCheckpoint(base, 'bridge', { attemptId: 'bridge-attempt', beatState: {
      placed: ['p-tile'], wordUnits: ['c','a','p'], done: true,
      heardSources: ['workshop-clue'], sceneRepairs: { 0: { type: 'PLACE_TILE', tileId: 'p-tile' } }
    } }, 10);
    const stale = updateCampaignCheckpoint(base, 'bridge', { attemptId: 'bridge-attempt', beatState: {
      supportUsed: ['text-help'], heardSources: ['base-word']
    } }, 30);
    const merged = await compare(completed, stale);
    assert.deepEqual(merged.campaign.checkpoints.bridge.beatState.wordUnits, ['c','a','p']);
    assert.deepEqual(merged.campaign.checkpoints.bridge.beatState.heardSources, ['base-word','workshop-clue']);
    assert.deepEqual(merged.campaign.checkpoints.bridge.challenges, base.campaign.checkpoints.bridge.challenges);
    assert.deepEqual(merged.campaign.checkpoints.bridge.beatState.sceneRepairs, completed.campaign.checkpoints.bridge.beatState.sceneRepairs);
  });
  await t.test('estimated active duration uses conservative same-attempt maxima without summing copied checkpoints', async () => {
    const base = start(fresh());
    const a = updateCampaignCheckpoint(base, 'bridge', { attemptId: 'bridge-attempt', playTime: { v:1, estimatedActiveMs:800, estimatedHelpMs:100 } }, 10);
    const b = updateCampaignCheckpoint(base, 'bridge', { attemptId: 'bridge-attempt', playTime: { v:1, estimatedActiveMs:400, estimatedHelpMs:200 } }, 20);
    const merged = await compare(a,b);
    assert.deepEqual(merged.campaign.checkpoints.bridge.playTime, {v:1,estimatedActiveMs:800,estimatedHelpMs:200});
    await compare(finish(a,'bridge'),b);
  });
  await t.test('lossless transport matches raw challenge identity across JSONB ordering, floats and Unicode', async () => {
    const base=start(fresh());
    base.campaign.checkpoints.bridge.challenges=[{id:'unicode',keys:{'\uE000':'bmp','😀':'astral'},fraction:1e-7,large:1e21,minus:-0.00003,label:'Pip’s 🐦'}];
    const packed=await encodeCampaignTransport(base);
    const expected=packed.campaign.checkpoints.bridge.challenges.sha256;
    const identity=(await db.query('select public.lp_campaign_challenge_identity($1::jsonb) hash',[JSON.stringify(base.campaign.checkpoints.bridge.challenges)])).rows[0].hash;
    assert.equal(identity,expected,canonicalCampaignChallenges(base.campaign.checkpoints.bridge.challenges));
    assert.deepEqual(decodeCampaignTransport(packed),base);
    for(const [a,b] of [[base,packed],[packed,base],[packed,packed]]) {
      const merged=await serverMerge(a,b);
      assert.deepEqual(decodeCampaignTransport(merged),clientMerge(base,base));
      assert.equal(merged.campaign.checkpoints.bridge.challenges.codec,'campaign-challenges-gzip-v1');
    }
    const conflict=structuredClone(packed);conflict.campaign.checkpoints.bridge.challenges.sha256='0'.repeat(64);
    await assert.rejects(serverMerge(base,conflict),/immutable campaign challenge/);
  });
  await t.test('duplicate old evidence survives at its original multiplicity', async () => {
    const a = fresh(), b = fresh();
    a.evidence = [{ old: true }, { old: true }];
    b.evidence = [{ old: true }];
    assert.equal((await compare(a,b)).evidence.length, 2);
  });
  await t.test('pre-campaign v3 cloud saves retain legacy evidence and narrative anchors', async () => {
    const old = fresh();
    delete old.campaign;
    old.completed = { s1: { at: 1, tokens: ['earned'] } };
    old.evidence = [{ old: true }];
    const merged = await compare(old, fresh());
    assert.equal(merged.campaign.storyAnchors.s1.narrativeOnly, true);
    assert.deepEqual(merged.campaign.completedMissions, {});
  });
  await t.test('initial cloud write retains the complete client payload', async () => {
    const p = record(start(fresh()), 'a');
    assert.deepEqual(await serverMerge(null, p), clientMerge(null, p));
  });
  await t.test('missing event bodies and conflicting immutable choices reject instead of deleting originals', async () => {
    const p = record(start(fresh()), 'a');
    const missing = structuredClone(p); missing.evidence = [];
    await assert.rejects(serverMerge(p, missing), /evidence body missing/);
    const conflict = structuredClone(p); conflict.campaign.checkpoints.bridge.challenges[0].target = 'changed';
    await assert.rejects(serverMerge(p, conflict), /immutable campaign/);
    await assert.rejects(serverMerge(p, { v: 99 }), /Unsupported/);
  });
  await t.test('sparse upsert cannot insert a partial first save after removal of its ACK base',async()=>{
    const base=record(start(fresh()),'old'),next=record(base,'new'),delta=campaignDeltaFromAck(next,base);
    const insert=payload=>db.query("insert into public.student_progress values('fixture','phonics_quest','sound_seekers_v3',$1::jsonb) on conflict(student_id,area,key) do update set payload=public.lp_merge_phonics_quest(student_progress.payload,excluded.payload)",[JSON.stringify(payload)]);
    await assert.rejects(insert(delta),/requires a saved full/);
    await insert(base);await insert(delta);
    assert.equal((await db.query("select payload from public.student_progress where student_id='fixture'")).rows[0].payload.evidence.length,2);
    await db.exec("delete from public.student_progress where student_id='fixture'");
    await assert.rejects(insert(delta),/requires a saved full/);
    await insert(next);assert.equal((await db.query("select payload from public.student_progress where student_id='fixture'")).rows[0].payload.evidence.length,2);
  });
  await t.test('latest production forward dispatcher reaches the campaign merger and preserves other area routes',async()=>{
    const source=await readFile(new URL('../../supabase/migrations/20260902141014_reset_adventure_map_progress_epoch_2.sql',import.meta.url),'utf8');
    const forward=source.match(/create or replace function public\.lp_forward_merge_progress[\s\S]*?\$\$;/)[0];
    for(const name of ['lp_merge_daily_mission','lp_merge_hollow','lp_merge_transfer_missions','lp_merge_el_quest','lp_jsonb_forward_merge'])await db.exec(`create function public.${name}(a jsonb,b jsonb) returns jsonb language sql immutable as $$ select b; $$;`);
    await db.exec(forward);
    const a=record(start(fresh()),'left'),b=record(start(fresh()),'right');
    const result=(await db.query("select public.lp_forward_merge_progress('phonics_quest',$1::jsonb,$2::jsonb) result",[JSON.stringify(a),JSON.stringify(b)])).rows[0].result;
    assert.deepEqual(result,clientMerge(a,b));
    assert.deepEqual((await db.query("select public.lp_forward_merge_progress('el_quest','{}','{\"epoch\":2}') result")).rows[0].result,{epoch:2});
  });
  await t.test('old v2 rows retain their existing dispatcher; helpers own no tables or privileged execution', async () => {
    assert.deepEqual(await serverMerge({ v: 2 }, { v: 2 }), { legacyDispatch: true });
    const functions = (await db.query("select proname, prosecdef from pg_proc join pg_namespace n on n.oid=pronamespace where n.nspname='public' and proname like 'lp_campaign_%' ")).rows;
    assert.ok(functions.length > 5);
    assert.ok(functions.every(row => row.prosecdef === false));
    assert.doesNotMatch(sql, /create\s+(?:or\s+replace\s+)?function\s+public\.(?:student_save_progress|lp_forward_merge_progress)/i);
  });
});

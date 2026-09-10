import { buildCampaignMission, createCampaignBeatState, resolveCampaignAction } from '../../src/features/soundSeekers/v3/engine/campaignChallenges.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCampaignStorage, campaignStorageKey, validateCampaignSavedProgress } from '../../src/features/soundSeekers/v3/campaignStorage.js';
import { normalizeCampaignProgress, beginCampaignMission, recordCampaignEvidence, updateCampaignCheckpoint, completeCampaignMission } from '../../src/features/soundSeekers/v3/engine/campaignProgress.js';
import { CAMPAIGN_VERSION, CAMPAIGN_STAGES, CAMPAIGN_MISSIONS } from '../../src/features/soundSeekers/v3/content/campaign.js';

const catalog = { version: CAMPAIGN_VERSION, stages: CAMPAIGN_STAGES, missions: CAMPAIGN_MISSIONS };
const fresh = () => normalizeCampaignProgress(null, catalog);
const missionId = 'meadow-01-1';
function answer(id) {
  const beat = buildCampaignMission(CAMPAIGN_MISSIONS.find(mission => mission.id === missionId)).beats.find(item => item.key && item.supportContext.mode === 'independent-check');
  let progress = beginCampaignMission(fresh(), missionId, { attemptId: 'same-attempt', challenges: [beat], beatState: createCampaignBeatState(beat) }, catalog, 1);
  return recordCampaignEvidence(progress, missionId, { id, attemptId: 'same-attempt', independent: true, targetIds: ['gpc-a'] }, catalog, 2);
}
function harness(queueSave) {
  const data = new Map(), timers = new Map(), listeners = new Set(), calls = [];
  let nextTimer = 0;
  const storage = { getItem: key => data.has(key) ? data.get(key) : null, setItem: (key, value) => data.set(key, String(value)), removeItem: key => data.delete(key) };
  const eventTarget = { addEventListener: (type, cb) => { assert.ok(['storage', 'lp-progress-hydrated'].includes(type)); listeners.add(cb); }, removeEventListener: (type, cb) => listeners.delete(cb) };
  const service = createCampaignStorage({ storage, eventTarget,
    schedule: callback => { const id = ++nextTimer; timers.set(id, callback); return id; }, cancel: id => timers.delete(id),
    queueSave: (...args) => { calls.push(args); return queueSave ? queueSave(...args) : true; } });
  const event = (key, newValue) => { if (newValue === null) data.delete(key); else data.set(key, newValue); for (const cb of listeners) cb({ key, newValue, storageArea: storage }); };
  return { ...service, storage, data, timers, listeners, calls, event };
}

test('canonical key matches v3, local save precedes queue, default scope never uploads', async () => {
  const h = harness();
  assert.equal(campaignStorageKey('A'), 'lp-quest:A:v3:campaign-v1');
  const result = h.saveCampaignProgress('A', answer('one'));
  assert.equal(result.ok, true);
  assert.equal(result.status, 'saved-local');
  assert.equal(JSON.parse(h.data.get('lp-quest:A:v3:campaign-v1')).evidence.length, 1);
  assert.equal(h.calls.length, 0);
  const queued = await h.flushCampaignProgress('A');
  assert.equal(queued.status, 'queued');
  assert.equal(h.calls[0][0], 'phonics_quest');
  assert.equal(h.calls[0][1], 'sound_seekers_v3');
  assert.deepEqual(h.calls[0][3], { scopeKey: 'A' });
  h.saveCampaignProgress('default', fresh());
  await h.flushCampaignProgress('default');
  assert.equal(h.calls.length, 1);
  await h.disposeCampaignStorage('A');
  await h.disposeCampaignStorage('default');
  assert.equal(h.listeners.size, 0);
});

test('per-scope debounce and disposal do not cancel another learner save', async () => {
  const h = harness();
  h.saveCampaignProgress('A', answer('one'));
  h.saveCampaignProgress('B', fresh());
  assert.equal(h.timers.size, 2);
  h.saveCampaignProgress('A', answer('two'));
  assert.equal(h.timers.size, 2);
  await h.disposeCampaignStorage('A');
  assert.equal(h.timers.size, 1);
  assert.equal(h.listeners.size, 2);
  assert.equal(h.calls[0][3].scopeKey, 'A');
  assert.equal(h.calls[0][2].evidence.length, 2);
  await h.disposeCampaignStorage('B');
  assert.equal(h.calls[1][3].scopeKey, 'B');
  assert.equal(h.calls[1][2].evidence.length, 0);
  assert.equal(h.timers.size, 0);
  assert.equal(h.listeners.size, 0);
});

test('explicit v1/v2 base-key migration preserves original bytes and maps actual completion shapes', async () => {
  for (const v of [1, 2]) {
    const h = harness();
    const raw = { v, trail: v === 1 ? { stopsDone: ['s1'] } : { completedStopIds: ['s1'] },
      evidence: [{ legacy: true }], assignment: { note: 'private' }, telemetry: { sessions: ['old'] } };
    const original = JSON.stringify(raw);
    h.data.set('lp-quest:A', original);
    const result = h.loadCampaignProgress('A');
    assert.equal(result.status, 'migrated');
    assert.equal(result.progress.campaign.storyAnchors.s1.narrativeOnly, true);
    assert.deepEqual(result.progress.campaign.completedMissions, {});
    assert.equal(h.data.has('lp-quest:A:v3:campaign-v1'), false);
    assert.deepEqual(result.progress.campaign.legacySave, raw);
    h.saveCampaignProgress('A', result.progress);
    assert.equal(h.data.get('lp-quest:A'), original);
    await h.flushCampaignProgress('A');
    assert.equal(h.calls[0][2].campaign.legacySave, undefined);
    assert.equal(h.calls[0][2].assignment, undefined);
    assert.equal(h.calls[0][2].telemetry, undefined);
    await h.disposeCampaignStorage('A');
  }
});

test('raw v3 save loads without old normalization truncating evidence or dropping campaign', () => {
  const h = harness();
  const raw = fresh();
  raw.evidence = Array.from({ length: 700 }, (_, id) => ({ id }));
  raw.campaign.visitedStageIds = ['meadow-01'];
  h.data.set('lp-quest:A:v3:campaign-v1', JSON.stringify(raw));
  const loaded = h.loadCampaignProgress('A');
  assert.equal(loaded.progress.evidence.length, 700);
  assert.deepEqual(loaded.progress.campaign.visitedStageIds, ['meadow-01']);
});

test('storage events merge only their exact learner and preserve both immutable attempt histories', async () => {
  const h = harness();
  h.saveCampaignProgress('A', answer('local'));
  h.saveCampaignProgress('B', fresh());
  const aResults = [], bResults = [];
  const unsubscribe = h.subscribeCampaignProgress('A', result => aResults.push(result));
  h.subscribeCampaignProgress('B', result => bResults.push(result));
  h.event('lp-quest:A:v3:campaign-v1', JSON.stringify(answer('other-tab')));
  assert.equal(h.loadCampaignProgress('A').progress.evidence.length, 2);
  assert.equal(h.loadCampaignProgress('A').progress.targets['gpc-a'].independent, 2);
  assert.equal(h.loadCampaignProgress('B').progress.evidence.length, 0);
  assert.equal(aResults.length, 1);
  assert.equal(bResults.length, 0);
  unsubscribe();
  h.event('lp-quest:A:v3:campaign-v1', JSON.stringify(answer('again')));
  assert.equal(aResults.length, 1);
  await h.disposeCampaignStorage('A');
  await h.disposeCampaignStorage('B');
});

test('conflicting checkpoint is retained without overwriting either saved original or current session', async () => {
  const h = harness();
  h.saveCampaignProgress('A', answer('local'));
  const conflict = answer('remote');
  conflict.campaign.checkpoints[missionId].challenges[0].target = 'changed';
  const remoteBytes = JSON.stringify(conflict);
  const results = [];
  h.subscribeCampaignProgress('A', result => results.push(result));
  h.event('lp-quest:A:v3:campaign-v1', remoteBytes);
  assert.equal(results.at(-1).status, 'conflict');
  assert.equal(results.at(-1).progress.evidence[0].id, 'local');
  assert.equal(h.data.get('lp-quest:A:v3:campaign-v1'), remoteBytes);
  assert.equal(h.loadCampaignProgress('A').status, 'conflict');
  assert.equal(h.loadCampaignProgress('A').progress.evidence[0].id, 'local');
  assert.equal(h.saveCampaignProgress('A', answer('third')).ok, false);
  await h.flushCampaignProgress('A');
  assert.equal(h.calls.length, 0);
  await h.disposeCampaignStorage('A');
  assert.equal(h.timers.size, 0);
  assert.equal(h.listeners.size, 0);
});

test('malformed and future saves are never silently overwritten or replaced from a legacy fallback', async () => {
  for (const bytes of ['{bad json', JSON.stringify({ v: 99 }), JSON.stringify({ v: 3, campaign: { v: 99 } })]) {
    const h = harness();
    h.data.set('lp-quest:A:v3:campaign-v1', bytes);
    h.data.set('lp-quest:A', JSON.stringify({ v: 1 }));
    const result = h.loadCampaignProgress('A');
    assert.equal(result.ok, false);
    assert.equal(h.saveCampaignProgress('A', fresh()).ok, false);
    assert.equal(h.data.get('lp-quest:A:v3:campaign-v1'), bytes);
    await h.disposeCampaignStorage('A');
    assert.equal(h.calls.length, 0);
  }
});

test('quota and queue failures return honest statuses and retain data for explicit retry', async () => {
  let rejected = true;
  const h = harness(() => { if (rejected) throw new Error('offline'); return true; });
  h.storage.setItem = () => { throw new Error('quota'); };
  const save = h.saveCampaignProgress('A', answer('one'));
  assert.equal(save.ok, false);
  assert.equal(save.status, 'unavailable');
  assert.equal(save.progress.evidence.length, 1);
  assert.equal((await h.flushCampaignProgress('A')).status, 'unavailable');
  rejected = false;
  assert.equal((await h.flushCampaignProgress('A')).status, 'queued');
  assert.equal(h.calls.length, 2);
  assert.deepEqual(h.calls[0][2], h.calls[1][2]);
  await h.disposeCampaignStorage('A');
});

test('storage removal stops pending saves and signals reset rather than resurrecting old data', async () => {
  const h = harness();
  h.saveCampaignProgress('A', answer('one'));
  const results = [];
  h.subscribeCampaignProgress('A', value => results.push(value));
  h.event('lp-quest:A:v3:campaign-v1', null);
  assert.equal(results.at(-1).status, 'reset');
  assert.equal(h.timers.size, 0);
  await h.flushCampaignProgress('A');
  assert.equal(h.calls.length, 0);
  assert.equal(h.data.has('lp-quest:A:v3:campaign-v1'), false);
  await h.disposeCampaignStorage('A');
});

test('dispose drains a newer pending revision after an in-flight queue operation and removes listeners immediately', async () => {
  let resolve;
  const h = harness(() => new Promise(done => { resolve = done; }));
  h.saveCampaignProgress('A', answer('first'));
  const first = h.flushCampaignProgress('A');
  await Promise.resolve();
  h.saveCampaignProgress('A', answer('second'));
  const disposed = h.disposeCampaignStorage('A');
  assert.equal(h.listeners.size, 0);
  assert.equal(h.timers.size, 0);
  resolve(true);
  await first;
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(h.calls.length, 2);
  assert.equal(h.calls[1][2].evidence.length, 2);
  resolve(true);
  await disposed;
  assert.equal(h.timers.size, 0);
});


test('queue failure with a successful local save is retryable and never reports cloud completion', async () => {
  const h = harness(() => false);
  h.saveCampaignProgress('A', fresh());
  const result = await h.flushCampaignProgress('A');
  assert.equal(result.ok, false);
  assert.equal(result.status, 'sync-failed');
  assert.equal(h.loadCampaignProgress('A').status, 'sync-failed');
  assert.equal(h.data.has('lp-quest:A:v3:campaign-v1'), true);
  await h.disposeCampaignStorage('A');
});


test('a reset before asynchronous queue entry prevents that old progress from being queued', async () => {
  const h = harness();
  h.saveCampaignProgress('A', answer('one'));
  const pending = h.flushCampaignProgress('A');
  h.event('lp-quest:A:v3:campaign-v1', null);
  assert.equal((await pending).status, 'reset');
  assert.equal(h.calls.length, 0);
  await h.disposeCampaignStorage('A');
});


test('loading during a React initializer never emits subscriber updates', async () => {
  const h = harness();
  let emissions = 0;
  h.subscribeCampaignProgress('A', () => { emissions += 1; });
  h.loadCampaignProgress('A');
  h.loadCampaignProgress('A');
  assert.equal(emissions, 0);
  await h.disposeCampaignStorage('A');
});


test('same-document hydration reaches subscribers while a reset cancels pending state', async () => {
  const h = harness();
  h.saveCampaignProgress('A', answer('local'));
  h.saveCampaignProgress('B', fresh());
  const results = [];
  h.subscribeCampaignProgress('A', result => results.push(result));
  const hydrated = { detail: { studentId: 'A', rows: [{ area: 'phonics_quest', key: 'sound_seekers_v3', payload: answer('cloud') }] } };
  for (const callback of h.listeners) callback(hydrated);
  assert.equal(h.loadCampaignProgress('A').progress.evidence.length, 2);
  assert.equal(h.loadCampaignProgress('B').progress.evidence.length, 0);
  for (const callback of h.listeners) callback({ detail: { studentId: 'A', resetApplied: true, rows: [] } });
  assert.equal(results.at(-1).status, 'reset');
  await h.disposeCampaignStorage('A');
  await h.disposeCampaignStorage('B');
});


test('malformed campaign controller data fails closed with original bytes preserved', async () => {
  const malformed = [
    p => { p.campaign.checkpoints[missionId].beatIndex = 99; },
    p => { p.campaign.checkpoints[missionId].beatIndex = -1; },
    p => { p.campaign.checkpoints[missionId].challenges = []; },
    p => { p.campaign.checkpoints[missionId].challenges[0].mechanic = 'unknown'; },
    p => { delete p.campaign.checkpoints[missionId].challenges[0].view; },
    p => { p.campaign.checkpoints[missionId].challenges[0].key.optionId = 'missing-choice'; },
    p => { p.campaign.checkpoints[missionId].challenges[0].view.answerId = 'leak'; },
    p => { p.campaign.checkpoints[missionId].beatState.beatId = 'other-beat'; },
    p => { p.campaign.checkpoints[missionId].beatState.errors = null; },
    p => { p.campaign.checkpoints[missionId].position = { v: 1, x: null, y: 0, vx: 0, vy: 0, facing: 1, recoveries: 0, lastCheckpointId: null }; },
    p => { p.campaign.checkpoints[missionId].playTime = {v:1,estimatedActiveMs:-1,estimatedHelpMs:0}; },
    p => { p.campaign.checkpoints[missionId].playTime = {v:1,estimatedActiveMs:100,estimatedHelpMs:200}; },
    p => { p.campaign.activeMissionId = 'missing-mission'; }
  ];
  for (const corrupt of malformed) {
    const h = harness(), p = answer('one');
    corrupt(p);
    const bytes = JSON.stringify(p);
    h.data.set('lp-quest:A:v3:campaign-v1', bytes);
    const result = h.loadCampaignProgress('A');
    assert.equal(result.status, 'unreadable');
    assert.equal(result.progress, null);
    assert.equal(h.saveCampaignProgress('A', fresh()).ok, false);
    assert.equal(h.data.get('lp-quest:A:v3:campaign-v1'), bytes);
    await h.disposeCampaignStorage('A');
    assert.equal(h.calls.length, 0);
  }
});

test('actual authored checkpoints retain exact private key while public projection stays answer-free', async () => {
  const h = harness();
  const progress = answer('one');
  assert.equal(h.saveCampaignProgress('A', progress).ok, true);
  assert.deepEqual(h.loadCampaignProgress('A').progress.campaign.checkpoints[missionId].challenges, progress.campaign.checkpoints[missionId].challenges);
  await h.disposeCampaignStorage('A');
});


test('all authored mechanics validate while required authority state cannot be omitted', () => {
  const seen = new Set();
  for (const mission of CAMPAIGN_MISSIONS) {
    const taught = { targets: Object.fromEntries(CAMPAIGN_MISSIONS.flatMap(item => [...item.curriculum.targetIds, ...(item.curriculum.minimumTaughtTargetIds || [])].map(id => [id, { taught: true }])) ) };
    for (const beat of buildCampaignMission(mission, taught).beats) {
      const p = fresh();
      p.campaign.activeMissionId = mission.id;
      p.campaign.checkpoints[mission.id] = { missionId: mission.id, attemptId: 'schema-check',
        challenges: [beat], beatIndex: 0, completed: false, beatState: createCampaignBeatState(beat) };
      assert.doesNotThrow(() => validateCampaignSavedProgress(p), beat.id);
      const state = p.campaign.checkpoints[mission.id].beatState;
      const field = { sound_sort: 'itemErrors', blend_bridge: 'tapped', word_forge: 'slotErrors', sentence_build: 'slotErrors', heart_lantern: 'phase' }[beat.mechanic];
      if (field && !seen.has(beat.mechanic)) {
        seen.add(beat.mechanic);
        delete state[field];
        assert.throws(() => validateCampaignSavedProgress(p), /unreadable/);
      }
    }
  }
  assert.ok(seen.has('sound_sort'));
  assert.ok(seen.has('word_forge'));
  assert.ok(seen.has('sentence_build'));
});


test('authored workshop replacement survives save, stale tab merge and reload without changing word pieces', async () => {
  const taught = { targets: Object.fromEntries(CAMPAIGN_MISSIONS.flatMap(item => [...item.curriculum.targetIds, ...(item.curriculum.minimumTaughtTargetIds || [])].map(id => [id, { taught: true }])) ) };
  let selected, beat;
  for (const mission of CAMPAIGN_MISSIONS.filter(item => item.familyId === 'fix-it-workshop')) {
    const replacement = buildCampaignMission(mission, taught).beats.find(item => item.view.workshop?.mode === 'replace');
    if (replacement) { selected = mission; beat = replacement; break; }
  }
  assert.ok(beat);
  const p = fresh(), h = harness();
  p.campaign.activeMissionId = selected.id;
  p.campaign.checkpoints[selected.id] = { missionId: selected.id, attemptId: 'workshop-attempt',
    challenges: [beat], beatIndex: 0, completed: false, beatState: createCampaignBeatState(beat) };
  assert.equal(h.saveCampaignProgress('default', p).ok, true);
  const { state, outcome } = resolveCampaignAction(beat, p.campaign.checkpoints[selected.id].beatState, { type: 'PLACE_TILE', tileId: beat.key.sequence[0] });
  assert.equal(outcome.type, 'complete');
  const next = updateCampaignCheckpoint(p, selected.id, { attemptId: 'workshop-attempt', beatState: state }, 10);
  assert.equal(h.saveCampaignProgress('default', next).ok, true);
  assert.equal(h.saveCampaignProgress('default', { ...p, updatedAt: 40 }).ok, true);
  await h.disposeCampaignStorage('default');
  const saved = h.loadCampaignProgress('default').progress.campaign.checkpoints[selected.id];
  assert.deepEqual(saved.challenges, [beat]);
  assert.deepEqual(saved.beatState.wordUnits, state.wordUnits);
  assert.equal(saved.beatState.wordUnits.join(''), beat.key.word);
  const broken = structuredClone(next);delete broken.campaign.checkpoints[selected.id].beatState.wordUnits;
  assert.throws(() => validateCampaignSavedProgress(broken), /unreadable/);
  await h.disposeCampaignStorage('default');
});

test('legacy v3 JSON migrates explicitly and an older client cannot overwrite the campaign save key', async () => {
  const h=harness(),original=JSON.stringify(answer('legacy-v3'));
  h.data.set('lp-quest:A:v3',original);
  const imported=h.loadCampaignProgress('A');assert.equal(imported.status,'migrated');
  assert.equal(h.saveCampaignProgress('A',imported.progress).ok,true);
  assert.equal(h.data.get('lp-quest:A:v3'),original);
  assert.ok(h.data.has('lp-quest:A:v3:campaign-v1'));
  // Simulate an old bundle saving its own original v3 format after migration.
  h.data.set('lp-quest:A:v3',JSON.stringify({v:3,hero:'speedy',evidence:[]}));
  await h.disposeCampaignStorage('A');
  assert.equal(h.loadCampaignProgress('A').progress.evidence[0].id,'legacy-v3');
  await h.disposeCampaignStorage('A');
});

test('position-only cloud writes are bounded without delaying local saves or meaningful changes',async()=>{
  const values=new Map(),timers=new Map(),calls=[];let now=0,sequence=0;
  const service=createCampaignStorage({storage:{getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)},
    clockNow:()=>now,schedule:(callback,delay)=>{const id=++sequence;timers.set(id,{callback,delay});return id;},cancel:id=>timers.delete(id),
    queueSave:(...args)=>{calls.push(args);return true;}});
  service.saveCampaignProgress('A',fresh(),{positionOnly:true});
  assert.ok(values.has(campaignStorageKey('A')));assert.equal([...timers.values()][0].delay,30000);
  now=1500;service.saveCampaignProgress('A',fresh(),{positionOnly:true});assert.equal([...timers.values()][0].delay,28500);
  now=2000;service.saveCampaignProgress('A',answer('meaningful'));assert.equal([...timers.values()][0].delay,800);
  now=2500;service.saveCampaignProgress('A',answer('meaningful'),{positionOnly:true});assert.equal([...timers.values()][0].delay,300);
  now=2800;await service.flushCampaignProgress('A');assert.equal(calls.length,1);
  now=3000;service.saveCampaignProgress('A',answer('meaningful'),{positionOnly:true});assert.equal([...timers.values()][0].delay,29800);
  service.saveCampaignProgress('A',answer('meaningful'),{forceSync:true});await service.flushCampaignProgress('A');assert.equal(calls.length,2);
  await service.disposeCampaignStorage('A');assert.equal(timers.size,0);
});


test('active-mission journals resume exact assistance and evidence, reject corrupt bytes, and compact on cross-tab changes',async()=>{
  const h=harness();let p=h.saveCampaignProgress('A',answer('first')).progress;
  const key=campaignStorageKey('A'),canonical=h.storage.getItem(key);
  p=updateCampaignCheckpoint(p,missionId,{attemptId:'same-attempt',beatState:{...p.campaign.checkpoints[missionId].beatState,errors:1,supportUsed:['text-help'],modelShown:true}},10);
  p=recordCampaignEvidence(p,missionId,{id:'second',attemptId:'same-attempt',targetIds:['gpc-a'],independent:true},catalog,11);
  const saved=h.saveCampaignProgress('A',p);assert.equal(saved.ok,true);assert.equal(h.storage.getItem(key),canonical);
  assert.ok(h.storage.getItem(key+':live-v1'));
  const reload=createCampaignStorage({storage:h.storage}).loadCampaignProgress('A');assert.equal(reload.ok,true);
  assert.equal(reload.progress.evidence.length,2);assert.equal(reload.progress.campaign.checkpoints[missionId].beatState.errors,1);
  const other=createCampaignStorage({storage:h.storage});let incoming=other.loadCampaignProgress('A').progress;
  incoming=updateCampaignCheckpoint(incoming,missionId,{attemptId:'same-attempt',beatState:{...incoming.campaign.checkpoints[missionId].beatState,heardSources:['other-tab']}},12);
  assert.equal(other.saveCampaignProgress('A',incoming).ok,true);
  h.event(key+':live-v1',h.storage.getItem(key+':live-v1'));
  assert.equal(h.loadCampaignProgress('A').progress.evidence.length,2);
  assert.deepEqual(h.loadCampaignProgress('A').progress.campaign.checkpoints[missionId].beatState.heardSources,['other-tab']);
  const corrupt='{"v":1,broken';h.storage.setItem(key+':live-v1',corrupt);
  const broken=createCampaignStorage({storage:h.storage});assert.equal(broken.loadCampaignProgress('A').status,'unreadable');
  assert.equal(broken.saveCampaignProgress('A',saved.progress).ok,false);assert.equal(h.storage.getItem(key+':live-v1'),corrupt);
  await h.disposeCampaignStorage('A');await other.disposeCampaignStorage('A');await broken.disposeCampaignStorage('A');
});

test('position journal cannot reduce time or restore an earlier beat or a previous replay attempt',()=>{
  const h=harness();const p=h.saveCampaignProgress('A',answer('first')).progress,key=campaignStorageKey('A');
  const pos=x=>({v:1,x,y:0,vx:0,vy:0,facing:1,recoveries:0,lastCheckpointId:null});
  const timed=updateCampaignCheckpoint(p,missionId,{attemptId:'same-attempt',position:pos(100),playTime:{v:1,estimatedActiveMs:5000,estimatedHelpMs:0}},10);
  const saved=h.saveCampaignProgress('A',timed,{positionOnly:true});assert.equal(saved.ok,true);
  const stale={v:1,positions:{[missionId]:{attemptId:'same-attempt',beatIndex:0,position:pos(0),updatedAt:5,playTime:{v:1,estimatedActiveMs:1000,estimatedHelpMs:0}}}};
  h.event(key+':position-v1',JSON.stringify(stale));
  const restored=createCampaignStorage({storage:h.storage}).loadCampaignProgress('A').progress.campaign.checkpoints[missionId];
  assert.equal(restored.position.x,100);assert.equal(restored.playTime.estimatedActiveMs,5000);
});


test('completion snapshots time and repairs in the bounded journal, including reload before compaction',async()=>{
  const h=harness();const p=h.saveCampaignProgress('A',answer('first')).progress,key=campaignStorageKey('A'),canonical=h.storage.getItem(key),cp=p.campaign.checkpoints[missionId];
  const done=completeCampaignMission(updateCampaignCheckpoint(p,missionId,{attemptId:cp.attemptId,beatIndex:cp.challenges.length,beatState:{...cp.beatState,done:true},playTime:{v:1,estimatedActiveMs:8000,estimatedHelpMs:2000}},20),missionId,catalog,21);
  const result=h.saveCampaignProgress('A',done);assert.equal(result.ok,true);assert.equal(h.storage.getItem(key),canonical);
  const restored=createCampaignStorage({storage:h.storage}).loadCampaignProgress('A').progress;
  assert.equal(restored.campaign.checkpoints[missionId].completed,true);assert.equal(restored.campaign.completedMissions[missionId].playTime.estimatedActiveMs,8000);assert.equal(restored.journeyStep,result.progress.journeyStep);
  await h.disposeCampaignStorage('A');
});

test('journal quota failure retains the new exact authority update in memory for recovery',()=>{
  const h=harness(),initial=h.saveCampaignProgress('A',answer('first')).progress,cp=initial.campaign.checkpoints[missionId];
  const next=updateCampaignCheckpoint(initial,missionId,{attemptId:cp.attemptId,beatState:{...cp.beatState,errors:2,supportUsed:['text-help']}},20);
  h.storage.setItem=()=>{throw new Error('QuotaExceededError');};
  const result=h.saveCampaignProgress('A',next);assert.equal(result.ok,false);assert.equal(result.status,'unavailable');assert.equal(result.progress.campaign.checkpoints[missionId].beatState.errors,2);
});

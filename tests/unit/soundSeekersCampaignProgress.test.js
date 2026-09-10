import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeCampaignProgress, isCampaignStageUnlocked, isCampaignMissionUnlocked,
  beginCampaignMission, updateCampaignCheckpoint, getCampaignCheckpoint,
  recordCampaignEvidence, completeCampaignMission, restartCampaignMission, mergeCampaignProgress
} from '../../src/features/soundSeekers/v3/engine/campaignProgress.js';

const catalog = { version: 1, stages: [
  { id: 'meadow-01', prerequisiteMissionIds: [], legacyStopIds: ['s1', 's2'] },
  { id: 'meadow-02', prerequisiteMissionIds: ['finale'] }
], missions: [
  { id: 'bridge', stageId: 'meadow-01', prerequisiteMissionIds: [], outcome: { repairId: 'crossing' } },
  { id: 'tree', stageId: 'meadow-01', prerequisiteMissionIds: [], outcome: { repairId: 'ladder' } },
  { id: 'finale', stageId: 'meadow-01', prerequisiteMissionIds: ['bridge', 'tree'] },
  { id: 'next', stageId: 'meadow-02', prerequisiteMissionIds: [] },
  { id: 'broken', stageId: 'meadow-01', prerequisiteMissionIds: ['missing'] }
] };
const fresh = () => normalizeCampaignProgress(null, catalog);
const begin = (p, id = 'bridge') => beginCampaignMission(p, id, {
  attemptId: `${id}-attempt`, challenges: [{ id: 'beat-1', choices: ['cat', 'cap'], target: 'cat' }],
  beatState: { errors: 0, supportUsed: [] }
}, catalog, 10);
const finish = (p, id) => completeCampaignMission(updateCampaignCheckpoint(p, id, {
  attemptId: `${id}-attempt`, beatIndex: 1, beatState: { done: true }
}, 20), id, catalog, 30);

test('legacy v1/v2 imports preserve originals and narrative anchors without awarding expanded missions', () => {
  for (const v of [1, 2]) {
    const raw = { v, hero: 'bouncy', trail: { stopsDone: ['s1', 's40', 'bogus'] },
      evidence: [{ supported: true }], wardrobe: { hat: 'earned' }, completedStops: ['s2'] };
    const migrated = normalizeCampaignProgress(raw, catalog);
    assert.equal(migrated.v, 3);
    assert.deepEqual(migrated.campaign.legacySave, raw);
    assert.equal(migrated.campaign.storyAnchors.s1.stageId, 'meadow-01');
    assert.equal(migrated.campaign.storyAnchors.s40.narrativeOnly, true);
    assert.equal(migrated.campaign.storyAnchors.bogus, undefined);
    assert.deepEqual(migrated.campaign.completedMissions, {});
    assert.deepEqual(migrated.targets, {});
    assert.deepEqual(normalizeCampaignProgress(JSON.parse(JSON.stringify(migrated)), catalog), migrated);
  }
});

test('v3 original evidence and checkpoint survive migration without 600-event truncation', () => {
  const raw = { ...fresh(), completed: { s2: { tokens: ['hat'] } },
    evidence: Array.from({ length: 605 }, (_, i) => ({ id: `legacy-${i}` })),
    checkpoint: { stopId: 's2', beatIndex: 4, beatState: { errors: 1 } }, targets: { a: { independent: 4 } } };
  delete raw.campaign;
  const migrated = normalizeCampaignProgress(raw, catalog);
  assert.deepEqual(migrated.evidence, raw.evidence);
  assert.deepEqual(migrated.checkpoint, raw.checkpoint);
  assert.deepEqual(migrated.targets, raw.targets);
  assert.equal(migrated.campaign.storyAnchors.s2.narrativeOnly, true);
  assert.deepEqual(migrated.campaign.completedMissions, {});
  assert.deepEqual(normalizeCampaignProgress(JSON.parse(JSON.stringify(migrated)), catalog), migrated);
});

test('branches remain independently available; both repairs gate finale and next stage', () => {
  let p = fresh();
  assert.equal(isCampaignMissionUnlocked(p, 'bridge', catalog), true);
  assert.equal(isCampaignMissionUnlocked(p, 'tree', catalog), true);
  assert.equal(isCampaignMissionUnlocked(p, 'finale', catalog), false);
  assert.equal(isCampaignStageUnlocked(p, 'meadow-02', catalog), false);
  p = finish(begin(p), 'bridge');
  assert.equal(isCampaignMissionUnlocked(p, 'finale', catalog), false);
  p = finish(begin(p, 'tree'), 'tree');
  assert.equal(isCampaignMissionUnlocked(p, 'finale', catalog), true);
  p = finish(begin(p, 'finale'), 'finale');
  assert.equal(isCampaignMissionUnlocked(p, 'next', catalog), true);
  assert.equal(p.campaign.repairs.crossing.missionId, 'bridge');
  assert.deepEqual(p.targets, {});
  assert.deepEqual(p.evidence, []);
  assert.equal(p.journeyStep, 3);
  assert.equal(completeCampaignMission(p, 'finale', catalog, 99), p);
});

test('unknown IDs, missing prerequisites and premature completion never open access or mutate progress', () => {
  const p = fresh();
  assert.equal(isCampaignStageUnlocked(p, 'invalid', catalog), false);
  assert.equal(isCampaignMissionUnlocked(p, 'invalid', catalog), false);
  assert.equal(isCampaignMissionUnlocked(p, 'broken', catalog), false);
  assert.equal(begin(p, 'invalid'), p);
  assert.equal(completeCampaignMission(p, 'bridge', catalog), p);
  const started = begin(p);
  assert.equal(completeCampaignMission(started, 'bridge', catalog), started);
  assert.equal(updateCampaignCheckpoint(started, 'invalid', {}), started);
  assert.equal(recordCampaignEvidence(started, 'invalid', { id: 'e' }, catalog), started);
});

test('resume and switching missions preserve exact choices, target, support and attempt ID', () => {
  let p = begin(fresh());
  p = updateCampaignCheckpoint(p, 'bridge', { attemptId: 'bridge-attempt', beatState: {
    errors: 2, supportUsed: ['model'], modelShown: true
  } }, 11);
  const expected = getCampaignCheckpoint(p, 'bridge');
  p = begin(p, 'tree');
  p = normalizeCampaignProgress(JSON.parse(JSON.stringify(p)), catalog);
  p = beginCampaignMission(p, 'bridge', { attemptId: 'reroll', challenges: [{ target: 'new' }] }, catalog);
  assert.deepEqual(getCampaignCheckpoint(p, 'bridge'), expected);
  p = updateCampaignCheckpoint(p, 'bridge', { attemptId: 'bridge-attempt', beatState: { errors: 0, supportUsed: [] } });
  assert.equal(p.campaign.checkpoints.bridge.beatState.errors, 2);
  assert.deepEqual(p.campaign.checkpoints.bridge.beatState.supportUsed, ['model']);
  assert.equal(p.campaign.checkpoints.bridge.beatState.modelShown, true);
  const detached = getCampaignCheckpoint(p, 'bridge');
  detached.challenges[0].target = 'changed';
  assert.equal(p.campaign.checkpoints.bridge.challenges[0].target, 'cat');
});

test('evidence delivery is idempotent, formative, assistance-aware and survives reload', () => {
  const p = begin(fresh());
  const event = { id: 'answer-1', attemptId: 'bridge-attempt', targetIds: ['gpc-a', 'gpc-a'], independent: true };
  const first = recordCampaignEvidence(p, 'bridge', event, catalog, 20);
  assert.equal(first.targets['gpc-a'].independent, 1);
  assert.equal(first.evidence[0].evidenceType, 'formative');
  assert.equal(first.evidence[0].kind, 'practice');
  assert.equal(recordCampaignEvidence(first, 'bridge', { ...event, independent: false }, catalog), first);
  const loaded = normalizeCampaignProgress(JSON.parse(JSON.stringify(first)), catalog);
  assert.equal(recordCampaignEvidence(loaded, 'bridge', event, catalog), loaded);
  const assisted = updateCampaignCheckpoint(first, 'bridge', { attemptId: 'bridge-attempt', beatState: { supportUsed: ['answer-audio'] } });
  const second = recordCampaignEvidence(assisted, 'bridge', { ...event, id: 'answer-2' }, catalog, 22);
  assert.equal(second.targets['gpc-a'].independent, 1);
  assert.equal(second.targets['gpc-a'].supported, 1);
  assert.equal(second.evidence[1].independent, false);
  assert.equal(p.evidence.length, 0);
  assert.deepEqual(p.targets, {});
});

test('pure updates do not cross learner records and retain all existing evidence', () => {
  const a = begin(fresh());
  const b = begin(fresh());
  a.evidence = Array.from({ length: 610 }, (_, i) => ({ id: `old-${i}` }));
  const updated = recordCampaignEvidence(a, 'bridge', { id: 'new', attemptId: 'bridge-attempt', targetIds: ['a'], independent: true }, catalog);
  assert.equal(updated.evidence.length, 611);
  assert.equal(b.evidence.length, 0);
  assert.deepEqual(b.targets, {});
  assert.deepEqual(b.campaign.attemptIds, {});
});

test('a future campaign schema is preserved and cannot be overwritten by this client', () => {
  const raw = { ...fresh(), campaign: { v: 99, futureField: ['keep'] } };
  const p = normalizeCampaignProgress(raw, catalog);
  assert.deepEqual(p.campaign, raw.campaign);
  assert.equal(begin(p), p);
});


test('explicit replay uses a fresh attempt, resumes if suspended and never re-awards a repair', () => {
  const completed = finish(begin(fresh()), 'bridge');
  const repair = completed.campaign.repairs.crossing;
  const firstCompletion = completed.campaign.completedMissions.bridge;
  const replay = { attemptId: 'bridge-replay-1', challenges: [{ id: 'new-beat', choices: ['cap', 'cat'] }], beatState: {} };
  let p = restartCampaignMission(completed, 'bridge', replay, catalog, 40);
  assert.equal(p.campaign.checkpoints.bridge.replayOrdinal, 1);
  assert.equal(p.campaign.checkpoints.bridge.completed, false);
  p = updateCampaignCheckpoint(p, 'bridge', { attemptId: replay.attemptId, beatState: { errors: 2, modelShown: true } }, 41);
  const suspended = p.campaign.checkpoints.bridge;
  p = restartCampaignMission(p, 'bridge', { ...replay, attemptId: 'reroll' }, catalog, 42);
  assert.deepEqual(p.campaign.checkpoints.bridge, suspended);
  p = updateCampaignCheckpoint(p, 'bridge', { attemptId: replay.attemptId, beatIndex: 1 }, 43);
  p = completeCampaignMission(p, 'bridge', catalog, 44);
  assert.equal(p.campaign.checkpoints.bridge.completed, true);
  assert.deepEqual(p.campaign.repairs.crossing, repair);
  assert.deepEqual(p.campaign.completedMissions.bridge, firstCompletion);
  assert.equal(p.journeyStep, completed.journeyStep);
  assert.equal(restartCampaignMission(p, 'bridge', replay, catalog), p);
  assert.equal(restartCampaignMission(p, 'bridge', { ...replay, attemptId: 'bridge-attempt' }, catalog), p);
});

const envelope = progress => ({ scopeKey: 'student-A', progress });
const answer = (p, id, missionId = 'bridge', extra = {}) => recordCampaignEvidence(p, missionId, {
  id, attemptId: `${missionId}-attempt`, independent: true, targetIds: ['gpc-a'], ...extra
}, catalog, 20);

test('same learner tabs union independent actions once and conserve retained pre-campaign counters', () => {
  const original = fresh();
  original.targets = { 'gpc-a': { independent: 5, supported: 2, missed: 1, taught: true, confusions: { cap: 1 } } };
  const base = answer(begin(original), 'shared');
  const a = answer(base, 'a-only');
  const b = answer(base, 'b-only', 'bridge', { independent: false, errors: 1, confusedWith: 'cap' });
  const merged = mergeCampaignProgress(envelope(a), envelope(b), catalog);
  assert.equal(merged.progress.targets['gpc-a'].independent, 7);
  assert.equal(merged.progress.targets['gpc-a'].supported, 3);
  assert.equal(merged.progress.targets['gpc-a'].missed, 2);
  assert.equal(merged.progress.targets['gpc-a'].confusions.cap, 2);
  assert.equal(merged.progress.evidence.length, 3);
  assert.equal(Object.keys(merged.progress.campaign.attemptIds).length, 3);
  assert.deepEqual(mergeCampaignProgress(merged, envelope(a), catalog), merged);
  assert.deepEqual(mergeCampaignProgress(envelope(b), envelope(a), catalog), merged);
  assert.deepEqual(mergeCampaignProgress(merged, merged, catalog), merged);
  assert.equal(a.targets['gpc-a'].supported, 2);
});

test('merge unions narrative repairs, checkpoint support and independently completed branches', () => {
  const base = begin(fresh());
  const a = finish(answer(base, 'a'), 'bridge');
  const b = finish(begin(base, 'tree'), 'tree');
  const merged = mergeCampaignProgress(envelope(a), envelope(b), catalog).progress;
  assert.equal(isCampaignMissionUnlocked(merged, 'finale', catalog), true);
  assert.deepEqual(Object.keys(merged.campaign.repairs).sort(), ['crossing', 'ladder']);
  assert.equal(merged.journeyStep, 2);
  assert.equal(merged.campaign.checkpoints.bridge.completed, true);
  assert.equal(merged.campaign.checkpoints.tree.completed, true);
  const supported = updateCampaignCheckpoint(base, 'bridge', { attemptId: 'bridge-attempt', beatState: { errors: 2, supportUsed: ['model'], modelShown: true } }, 11);
  const stale = updateCampaignCheckpoint(base, 'bridge', { attemptId: 'bridge-attempt', beatState: { errors: 0 } }, 99);
  const resumed = mergeCampaignProgress(envelope(supported), envelope(stale), catalog).progress;
  assert.equal(resumed.campaign.checkpoints.bridge.beatState.errors, 2);
  assert.deepEqual(resumed.campaign.checkpoints.bridge.beatState.supportUsed, ['model']);
});

test('merge rejects cross-account, missing-scope, immutable-choice conflicts and missing evidence bodies', () => {
  const p = answer(begin(fresh()), 'a');
  assert.throws(() => mergeCampaignProgress(envelope(p), { scopeKey: 'student-B', progress: p }, catalog), /scope mismatch/);
  assert.throws(() => mergeCampaignProgress({ progress: p }, { progress: p }, catalog), /scope mismatch/);
  const missing = JSON.parse(JSON.stringify(p));
  missing.evidence = [];
  assert.throws(() => mergeCampaignProgress(envelope(p), envelope(missing), catalog), /compaction/);
  const conflict = JSON.parse(JSON.stringify(p));
  conflict.campaign.checkpoints.bridge.challenges[0].target = 'another';
  assert.throws(() => mergeCampaignProgress(envelope(p), envelope(conflict), catalog), /immutable/);
});


test('merge preserves identical legacy event multiplicity without doubling shared old history', () => {
  const a = fresh(), b = fresh();
  a.evidence = [{ legacy: true }, { legacy: true }];
  b.evidence = [{ legacy: true }];
  assert.deepEqual(mergeCampaignProgress(envelope(a), envelope(b), catalog).progress.evidence, a.evidence);
});

test('replay attempt IDs cannot be recycled even when a prior replay had no scored actions', () => {
  let p = finish(begin(fresh()), 'bridge');
  const replay = id => ({ attemptId: id, challenges: [{ id: 'same' }], beatState: {} });
  for (const id of ['replay-one', 'replay-two']) {
    p = restartCampaignMission(p, 'bridge', replay(id), catalog);
    p = updateCampaignCheckpoint(p, 'bridge', { attemptId: id, beatIndex: 1 });
    p = completeCampaignMission(p, 'bridge', catalog);
  }
  assert.equal(restartCampaignMission(p, 'bridge', replay('replay-one'), catalog), p);
});


test('same-millisecond state merges preserve authority advance, hearing and repairs', () => {
  const base = begin(fresh());
  const cp = (state, time = 30) => updateCampaignCheckpoint(base, 'bridge', { attemptId: 'bridge-attempt', beatState: state }, time);
  for (const [before, after, field, expected] of [
    [{ placed: [] }, { placed: ['tile-1'] }, 'placed', ['tile-1']],
    [{ itemIndex: 0, placed: {} }, { itemIndex: 1, placed: { a: 'bin-1' } }, 'itemIndex', 1],
    [{ cardsHeard: [] }, { cardsHeard: ['a'] }, 'cardsHeard', ['a']],
    [{ done: false }, { done: true }, 'done', true]
  ]) {
    const old = cp(before), advanced = cp(after);
    const merged = mergeCampaignProgress(envelope(old), envelope(advanced), catalog).progress;
    assert.deepEqual(merged.campaign.checkpoints.bridge.beatState[field], expected);
    assert.deepEqual(mergeCampaignProgress(envelope(advanced), envelope(old), catalog).progress, merged);
    const lateStale = cp(before, 1000);
    assert.deepEqual(mergeCampaignProgress(envelope(advanced), envelope(lateStale), catalog).progress.campaign.checkpoints.bridge.beatState[field], expected);
  }
  const a = cp({ cardsHeard: ['a'], heardSources: ['audio-a'], sceneRepairs: { 0: { type: 'CHOOSE', choiceId: 'a' } } });
  const b = cp({ cardsHeard: ['b'], heardSources: ['audio-b'], sceneRepairs: { 1: { type: 'CHOOSE', choiceId: 'b' } } });
  const merged = mergeCampaignProgress(envelope(a), envelope(b), catalog).progress.campaign.checkpoints.bridge.beatState;
  assert.deepEqual(merged.cardsHeard, ['a','b']);
  assert.deepEqual(merged.heardSources, ['audio-a','audio-b']);
  assert.deepEqual(Object.keys(merged.sceneRepairs), ['0','1']);
  assert.throws(() => mergeCampaignProgress(envelope(cp({ placed: ['a'] })), envelope(cp({ placed: ['b'] })), catalog), /placement sequence/);
});

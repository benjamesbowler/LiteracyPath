import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeCampaignProgress, isCampaignMissionUnlocked, mergeCampaignProgress } from '../../src/features/soundSeekers/v3/engine/campaignProgress.js';
import { ROUND_CAMPAIGN, recordRoundedDiscovery, recordRoundedInventory, startRoundedMission, judgeRoundedAction, advanceRoundedMission, currentCampaignCheckpoint, currentCampaignBeat, roundedPosition, restoreRoundedPosition } from '../../src/features/soundSeekers/rounded/campaignController.js';
import { createCampaignStorage, validateCampaignSavedProgress, campaignStorageKey } from '../../src/features/soundSeekers/v3/campaignStorage.js';
import { createCampaignPreviewProgress } from '../../src/features/soundSeekers/preview/campaignPreview.js';
import { saveCampaignLearningTask, completeCampaignLearningTask } from '../../src/features/soundSeekers/rounded/campaignLearningResponse.js';
import { advanceLearningResponseReceipt, recordLearningGuidedAction, commitLearningResponse } from '../../src/utils/learningResponseState.js';

const fresh = () => normalizeCampaignProgress(null, ROUND_CAMPAIGN);
function solveCurrent(progress, now = 100) {
  const beat = currentCampaignBeat(progress), cp = currentCampaignCheckpoint(progress), state = cp.beatState;
  if (state.learningRecovery) {
    const task = state.learningRecovery.task;
    let episode = task.episode;
    if (episode.phase === 'receipt') episode = advanceLearningResponseReceipt(episode);
    else if (['teaching','finish_teaching'].includes(episode.phase)) episode = recordLearningGuidedAction(episode,episode.expected);
    else if (episode.phase === 'answer') episode = commitLearningResponse(episode,{selected:episode.expected,correct:true,supported:true,supportUsed:['after_teaching']});
    progress = saveCampaignLearningTask(progress,{...task,episode},now);
    return episode.phase === 'complete' ? completeCampaignLearningTask(progress,episode,now) : progress;
  }
  if (beat.mechanic === 'sound_signpost') {
    for (const card of beat.view.cards) progress = judgeRoundedAction(progress, { type: 'HEARD_CARD', targetId: card.targetId }, now).progress;
    return judgeRoundedAction(progress, { type: 'FINISH' }, now).progress;
  }
  progress = judgeRoundedAction(progress, { type: 'HEARD_PROMPT' }, now).progress;
  if (['word_forge', 'sentence_build'].includes(beat.mechanic)) return judgeRoundedAction(progress, { type: 'PLACE_TILE', tileId: beat.key.sequence[state.placed.length] }, now).progress;
  if (beat.mechanic === 'sound_sort') { const item = beat.view.items[state.itemIndex]; return judgeRoundedAction(progress, { type: 'PLACE', itemId: item.id, binId: beat.key.bins[item.id] }, now).progress; }
  return judgeRoundedAction(progress, { type: 'CHOOSE', ...(beat.key.choiceId ? { choiceId: beat.key.choiceId } : beat.key.keyId ? { keyId: beat.key.keyId } : { optionId: beat.key.optionId }) }, now).progress;
}
test('all210 authored missions settle through actual controller authority; extras do not gate main progression', () => {
  let progress = fresh(), decisions = 0, beats = 0, ordinal = 0;
  for (const mission of ROUND_CAMPAIGN.missions) {
    assert.equal(isCampaignMissionUnlocked(progress, mission.id, ROUND_CAMPAIGN), true, mission.id);
    progress = startRoundedMission(progress, mission.id, { attemptId: `test-${ordinal++}`, now: 1000 + ordinal });
    assert.equal(currentCampaignCheckpoint(progress).missionId, mission.id);
    let guard = 0;
    while (currentCampaignBeat(progress)) {
      assert.ok(guard++ < 500, mission.id);
      if (currentCampaignCheckpoint(progress).beatState.done) { progress = advanceRoundedMission(progress, 2000 + decisions); beats++; }
      else { const previous = progress; progress = solveCurrent(progress, 2000 + decisions++); assert.notEqual(progress, previous, currentCampaignBeat(progress)?.mechanic); }
    }
    assert.ok(progress.campaign.completedMissions[mission.id], mission.id);
    validateCampaignSavedProgress(progress);
  }
  assert.equal(Object.keys(progress.campaign.completedMissions).length, 210);
  assert.ok(beats > 3900);
  assert.ok(progress.evidence.length > 3000);
  assert.ok(progress.evidence.every(event => event.kind === 'practice' && event.evidenceType === 'formative'));
  assert.equal(new Set(progress.evidence.map(event => JSON.stringify([event.missionId, event.attemptId, event.id]))).size, progress.evidence.length);
});
test('a forged finish, unknown card or motor event cannot teach or complete the first mission', () => {
  const progress = startRoundedMission(fresh(), 'meadow-01-1', { attemptId: 'first', now: 1 });
  for (const action of [{type:'FINISH'}, {type:'HEARD_CARD',targetId:'unknown'}, {type:'MOVE',x:99}, {type:'CHOOSE',optionId:'unknown'}]) assert.equal(judgeRoundedAction(progress, action, 2).progress, progress);
  assert.equal(progress.evidence.length, 0);
  assert.equal(Object.keys(progress.targets).length, 0);
});
test('unfinished attempts retain choice order/support; supported input cannot turn into an independent response after reload', () => {
  let progress = startRoundedMission(fresh(), 'meadow-01-1', { attemptId: 'first', now: 1 });
  while (currentCampaignBeat(progress)?.mechanic === 'sound_signpost') { progress = solveCurrent(progress); progress = advanceRoundedMission(progress, 2); }
  const original = currentCampaignCheckpoint(progress);
  progress = judgeRoundedAction(progress, {type:'REQUEST_TEXT_SUPPORT'}, 3).progress;
  const resumed = startRoundedMission(JSON.parse(JSON.stringify(progress)), 'meadow-01-1', {attemptId:'reroll',now:4});
  assert.equal(currentCampaignCheckpoint(resumed).attemptId, 'first');
  assert.deepEqual(currentCampaignCheckpoint(resumed).challenges, original.challenges);
  progress = solveCurrent(resumed);
  assert.equal(progress.evidence.at(-1).independent, false);
  const learning = currentCampaignCheckpoint(progress).beatState.learningRecovery.task.episode;
  assert.equal(learning.firstResponse.evidenceUse,'unscored');
  assert.equal(learning.firstResponse.responseStatus,'supported');
  assert.equal(learning.firstResponse.selected,null);
  assert.ok(currentCampaignCheckpoint(progress).beatState.supportUsed.includes('text-support'));
  assert.equal(learning.phase,'teaching');
});
test('a correct answer before essential spoken delivery remains supported practice', () => {
  let progress = startRoundedMission(fresh(), 'meadow-01-1', {attemptId:'first',now:1});
  while (currentCampaignBeat(progress)?.mechanic === 'sound_signpost') { progress = solveCurrent(progress); progress = advanceRoundedMission(progress, 2); }
  const beat = currentCampaignBeat(progress);
  progress = judgeRoundedAction(progress, {type:'CHOOSE',optionId:beat.key.optionId}, 3).progress;
  assert.equal(progress.evidence.at(-1).independent, false);
  assert.ok(progress.evidence.at(-1).supportUsed.includes('unheard-prompt'));
});
test('rounded positions have an explicit basis; old pixel coordinates never teleport a new3D scene', () => {
  const p = roundedPosition({stageId:'meadow-01',x:3,z:-5});
  assert.deepEqual(restoreRoundedPosition(p,'meadow-01'),{x:3,z:-5});
  assert.equal(restoreRoundedPosition({...p,lastCheckpointId:'old-platform'},'meadow-01'),null);
  assert.equal(restoreRoundedPosition(p,'moonwood-21'),null);
});
test('two devices retain narrative discoveries without adding literacy responses or unlocking teaching prerequisites', () => {
  const base = fresh();
  const left = recordRoundedDiscovery(base, {stageId:'meadow-01',id:'carry',kind:'carry'}, 10);
  const right = recordRoundedDiscovery(base, {stageId:'meadow-01',id:'operate',kind:'operate'}, 20);
  const merged = mergeCampaignProgress({scopeKey:'alice',progress:left},{scopeKey:'alice',progress:right},ROUND_CAMPAIGN).progress;
  assert.deepEqual(Object.keys(merged.campaign.gameDiscoveries).sort(), ['meadow-01:carry','meadow-01:operate']);
  assert.ok(Object.values(merged.campaign.gameDiscoveries).every(item => item.narrativeOnly));
  assert.equal(merged.evidence.length, 0);
  assert.equal(Object.keys(merged.targets).length, 0);
  assert.equal(Object.keys(merged.campaign.completedMissions).length, 0);
  assert.equal(isCampaignMissionUnlocked(merged,'meadow-01-3',ROUND_CAMPAIGN),false);
  assert.equal(recordRoundedDiscovery(merged,{stageId:'meadow-02',id:'carry',kind:'carry'},30),merged);
  assert.equal(recordRoundedDiscovery(merged,{stageId:'meadow-01',id:'invented',kind:'carry'},30),merged);
  validateCampaignSavedProgress(merged);
});
test('a carried world object survives storage but a merged delivered reward cannot resurrect it', () => {
  const base = fresh();
  const carrying = recordRoundedInventory(base,{stageId:'meadow-01',carryingId:'carry'},20);
  assert.equal(JSON.parse(JSON.stringify(carrying)).campaign.gameInventory['meadow-01'].carryingId,'carry');
  assert.equal(recordRoundedInventory(carrying,{stageId:'meadow-01',carryingId:'invented'},30),carrying);
  assert.equal(recordRoundedInventory(carrying,{stageId:'meadow-01',carryingId:'operate'},30),carrying);
  const delivered = recordRoundedDiscovery(base,{stageId:'meadow-01',id:'carry',kind:'carry'},10);
  const merged = mergeCampaignProgress({scopeKey:'alice',progress:carrying},{scopeKey:'alice',progress:delivered},ROUND_CAMPAIGN).progress;
  assert.equal(merged.campaign.gameInventory['meadow-01'].carryingId,null);
  assert.equal(merged.evidence.length,0);
  validateCampaignSavedProgress(merged);
});
test('deliberate undo persists across reload and a stale longer word cannot overwrite it or erase mistakes', async () => {
  let seed = fresh();
  for (const id of ['meadow-01-1','meadow-01-2']) {
    seed = startRoundedMission(seed,id,{attemptId:`before-undo-${id}`,now:1});
    while (currentCampaignBeat(seed)) seed = currentCampaignCheckpoint(seed).beatState.done ? advanceRoundedMission(seed,2) : solveCurrent(seed,2);
  }
  let progress = startRoundedMission(seed,'meadow-01-3',{attemptId:'undo-test',now:2});
  while (currentCampaignBeat(progress)?.mechanic !== 'word_forge') {
    progress = currentCampaignCheckpoint(progress).beatState.done ? advanceRoundedMission(progress,3) : solveCurrent(progress,3);
  }
  const values = new Map([[campaignStorageKey('alice'),JSON.stringify(progress)]]);
  const storage = {getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};
  const adapter = createCampaignStorage({storage,localOnly:true});
  try {
    progress = adapter.loadCampaignProgress('alice').progress;
    const beat = currentCampaignBeat(progress), expected = beat.view.tiles.find(tile=>tile.id===beat.key.sequence[1]);
    const wrong = beat.view.tiles.find(tile=>tile.grapheme!==expected.grapheme);
    for (const action of beat.key.sequence.slice(0,2).map(tileId=>({type:'PLACE_TILE',tileId}))) {
      progress = adapter.saveCampaignProgress('alice',judgeRoundedAction(progress,action,4).progress).progress;
    }
    const stale = progress;
    assert.equal(currentCampaignCheckpoint(progress).beatState.placed.length,2);
    progress = adapter.saveCampaignProgress('alice',judgeRoundedAction(progress,{type:'REMOVE_LAST'},5).progress).progress;
    const checkpoint = currentCampaignCheckpoint(progress);
    assert.equal(checkpoint.beatState.placed.length,1);
    assert.equal(checkpoint.beatState.errors,0);
    const merged = mergeCampaignProgress({scopeKey:'alice',progress},{scopeKey:'alice',progress:stale},ROUND_CAMPAIGN).progress;
    assert.equal(currentCampaignCheckpoint(merged).beatState.placed.length,1);
    const reloaded = createCampaignStorage({storage,localOnly:true}).loadCampaignProgress('alice');
    assert.equal(reloaded.ok,true);
    assert.deepEqual(currentCampaignCheckpoint(reloaded.progress).beatState,checkpoint.beatState);
    assert.equal(reloaded.progress.evidence.length,stale.evidence.length);
    const failed = adapter.saveCampaignProgress('alice',judgeRoundedAction(reloaded.progress,{type:'PLACE_TILE',tileId:wrong.id},6).progress).progress;
    const frozen = currentCampaignCheckpoint(failed).beatState;
    assert.equal(frozen.learningRecovery.task.episode.firstResponse.observedCorrect,false);
    assert.deepEqual(frozen.learningRecovery.task.episode.firstResponse.selected,[beat.key.sequence[0],wrong.id]);
    assert.equal(frozen.errors,1);
    const ignored = judgeRoundedAction(failed,{type:'REMOVE_LAST'},7);
    assert.equal(ignored.outcome.type,'ignored');
    assert.deepEqual(currentCampaignCheckpoint(ignored.progress).beatState,frozen);
  } finally { await adapter.disposeCampaignStorage('alice'); }
});
test('hearing a sort item cannot mark the next item heard after a judged placement or stale merge', () => {
  let progress = startRoundedMission(createCampaignPreviewProgress('meadow-02'),'meadow-02-2',{attemptId:'sort-test',now:1});
  while (currentCampaignBeat(progress)?.mechanic !== 'sound_sort') progress = currentCampaignCheckpoint(progress).beatState.done ? advanceRoundedMission(progress,2) : solveCurrent(progress,2);
  progress = judgeRoundedAction(progress,{type:'HEARD_PROMPT'},3).progress;
  const stale = progress, beat = currentCampaignBeat(progress), item = beat.view.items[0];
  progress = judgeRoundedAction(progress,{type:'PLACE',itemId:item.id,binId:beat.key.bins[item.id]},4).progress;
  assert.equal(currentCampaignCheckpoint(progress).beatState.itemIndex,1);
  assert.equal(currentCampaignCheckpoint(progress).beatState.heard,false);
  const merged = mergeCampaignProgress({scopeKey:'alice',progress},{scopeKey:'alice',progress:stale},ROUND_CAMPAIGN).progress;
  assert.equal(currentCampaignCheckpoint(merged).beatState.heard,false);
});

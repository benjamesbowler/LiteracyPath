import test from 'node:test';
import assert from 'node:assert/strict';
import { CAMPAIGN_MISSIONS } from '../../src/features/soundSeekers/v3/content/campaign.js';
import { createCampaignPreviewProgress } from '../../src/features/soundSeekers/preview/campaignPreview.js';
import { startRoundedMission, currentCampaignCheckpoint, judgeRoundedAction, ROUND_CAMPAIGN } from '../../src/features/soundSeekers/rounded/campaignController.js';
import { updateCampaignCheckpoint, mergeCampaignProgress } from '../../src/features/soundSeekers/v3/engine/campaignProgress.js';
import { createCampaignBeatState } from '../../src/features/soundSeekers/v3/engine/campaignChallenges.js';
import { saveCampaignLearningTask, completeCampaignLearningTask } from '../../src/features/soundSeekers/rounded/campaignLearningResponse.js';
import { advanceLearningResponseReceipt, commitLearningResponse, createLearningResponseEpisode, recordLearningGuidedAction } from '../../src/utils/learningResponseState.js';
import { validateCampaignSavedProgress } from '../../src/features/soundSeekers/v3/campaignStorage.js';
import { saveCvcPracticeSession, loadCvcPracticeSession } from '../../src/utils/letterPracticeProgress.js';

function seedChoice() {
  const mission = CAMPAIGN_MISSIONS.find(item => item.id === 'meadow-01-1');
  let progress = startRoundedMission(createCampaignPreviewProgress(mission.stageId), mission.id, { attemptId: 'frozen-first', now: 1 });
  const cp = currentCampaignCheckpoint(progress), index = cp.challenges.findIndex(beat => beat.mechanic === 'echo_hunt');
  progress = updateCampaignCheckpoint(progress, mission.id, { attemptId: cp.attemptId, beatIndex: index, beatState: createCampaignBeatState(cp.challenges[index]) }, 2);
  return { progress, beat: cp.challenges[index] };
}

test('campaign wrong choice saves a frozen original and refuses the original key after reload', () => {
  const { progress, beat } = seedChoice();
  const wrong = beat.view.options.find(option => option.id !== beat.key.optionId);
  const result = judgeRoundedAction(progress, { type: 'CHOOSE', optionId: wrong.id }, 3);
  const resumed = JSON.parse(JSON.stringify(result.progress));
  validateCampaignSavedProgress(resumed);
  const episode = currentCampaignCheckpoint(resumed).beatState.learningRecovery.task.episode;
  assert.equal(episode.firstResponse.observedCorrect, false);
  assert.equal(episode.firstResponse.selected, wrong.id);
  assert.equal(episode.phase, 'receipt');
  const retry = judgeRoundedAction(resumed, { type: 'CHOOSE', optionId: beat.key.optionId }, 4);
  assert.equal(retry.outcome.type, 'ignored');
  assert.deepEqual(retry.progress, resumed);
});

test('campaign worked action and fresh transfer never replace the first error or complete twice', () => {
  const { progress, beat } = seedChoice();
  const wrong = beat.view.options.find(option => option.id !== beat.key.optionId);
  let saved = judgeRoundedAction(progress, { type: 'CHOOSE', optionId: wrong.id }, 3).progress;
  let task = currentCampaignCheckpoint(saved).beatState.learningRecovery.task;
  let episode = advanceLearningResponseReceipt(task.episode);
  episode = recordLearningGuidedAction(episode, episode.expected);
  if (episode.phase === 'answer') {
    assert.notEqual(episode.question.word, episode.firstQuestion.word);
    episode = commitLearningResponse(episode, { selected: episode.expected, correct: false, supported: true });
    episode = advanceLearningResponseReceipt(episode);
    assert.equal(episode.phase, 'finish_teaching');
    episode = recordLearningGuidedAction(episode, episode.expected);
  }
  saved = saveCampaignLearningTask(saved, { ...task, episode }, 4);
  validateCampaignSavedProgress(saved);
  const closed = completeCampaignLearningTask(saved, episode, 5);
  const cp = currentCampaignCheckpoint(closed);
  assert.equal(cp.beatState.done, true);
  assert.equal(cp.beatState.learningResponses[0].firstResponse.observedCorrect, false);
  assert.equal(cp.beatState.learningResponses[0].completion.supported, true);
  assert.equal(completeCampaignLearningTask(closed, episode, 6), closed);
  const merged = mergeCampaignProgress({ scopeKey: 'learner', progress: closed }, { scopeKey: 'learner', progress: saved }, ROUND_CAMPAIGN).progress;
  assert.equal(currentCampaignCheckpoint(merged).beatState.done, true);
  assert.equal(currentCampaignCheckpoint(merged).beatState.learningRecovery, null);
});

test('explicit campaign help is saved as requested support, with no wrong selection invented', () => {
  const { progress } = seedChoice();
  const result = judgeRoundedAction(progress, { type: 'REQUEST_MODEL' }, 3);
  const response = currentCampaignCheckpoint(result.progress).beatState.learningRecovery.task.episode.firstResponse;
  assert.equal(response.responseStatus, 'supported');
  assert.equal(response.observedCorrect, null);
  assert.equal(response.selected, null);
  assert.ok(response.supportUsed.includes('requested_model'));
});

test('CVC checkpoints retain exact response/cursor and isolate learner scopes', () => {
  const records = new Map();
  globalThis.localStorage = { getItem: key => records.get(key) || null, setItem: (key,value) => records.set(key,value), removeItem: key => records.delete(key) };
  const episode = advanceLearningResponseReceipt(commitLearningResponse(createLearningResponseEpisode({id:'original',instrument:'cvc_scaffolded_build',question:{id:'cat',word:'cat',mechanicId:'wordBuild'},expected:['c','a','t']}),{selected:['c','d'],correct:false,supported:true}));
  const value = { id: 'word-workshop-run', step: 2, evidence: [], checkpoint: { learningVersion: 1, index: 0, task: { episode } } };
  assert.equal(saveCvcPracticeSession('child-1', 'at', value), true);
  assert.deepEqual(loadCvcPracticeSession('child-1', 'at').checkpoint, value.checkpoint);
  assert.equal(loadCvcPracticeSession('child-2', 'at'), null);
  assert.equal(saveCvcPracticeSession('child-1', 'at', null), true);
  assert.equal(loadCvcPracticeSession('child-1', 'at'), null);
  delete globalThis.localStorage;
});

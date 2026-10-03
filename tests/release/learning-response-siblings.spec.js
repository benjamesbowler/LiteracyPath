import { expect, test } from '@playwright/test';
import { buildLetterPracticeQuestions } from '../../src/data/letterPractice.js';
import { LETTER_PRACTICE_VERSION } from '../../src/policy/letterPractice.js';
import { cvcPracticeSessionKey } from '../../src/utils/letterPracticeProgress.js';
import { CAMPAIGN_MISSIONS } from '../../src/features/soundSeekers/v3/content/campaign.js';
import { createCampaignPreviewProgress } from '../../src/features/soundSeekers/preview/campaignPreview.js';
import { startRoundedMission, currentCampaignCheckpoint } from '../../src/features/soundSeekers/rounded/campaignController.js';
import { updateCampaignCheckpoint } from '../../src/features/soundSeekers/v3/engine/campaignProgress.js';
import { createCampaignBeatState } from '../../src/features/soundSeekers/v3/engine/campaignChallenges.js';
import { localProgressStorageKeyForRow } from '../../src/utils/progressKeys.js';

const scope = 'child-surface-preview';
async function openLetter(page) { if (!await page.getByRole('button', { name: /^Letter A(?:,|$)/ }).count()) await page.getByRole('button', { name: 'Choose a letter', exact: true }).click(); await page.getByRole('button', { name: /^Letter A(?:,|$)/ }).click(); }
async function matchAll(page) {
  const episode = await page.locator('[data-learning-episode]').first().getAttribute('data-learning-episode');
  const task = page.locator('[data-learning-episode]').filter({ has: page.locator('[data-guided-model]') }).first();
  while (await task.count() && await task.getAttribute('data-learning-episode') === episode && await task.locator('[data-guided-model]:enabled').count()) await task.locator('[data-guided-model]:enabled').first().click();
}
async function campaignBeatState(page,key) {
  return page.evaluate(async key => { const {decodeProgressStorage} = await import('/src/utils/progressStorageCodec.js'); const p = decodeProgressStorage(localStorage.getItem(key)); const journal = JSON.parse(localStorage.getItem(`${key}:live-v1`) || 'null'); const id = p.campaign.activeMissionId; return (journal?.campaign?.checkpoints?.[id] || p.campaign.checkpoints[id]).beatState; }, key);
}
for (const viewport of [{ width: 1024, height: 768 }, { width: 320, height: 568 }]) {
  test(`Letters closes a wrong original, restores its model and offers a new stimulus at ${viewport.width}`, async ({ page }) => {
    test.setTimeout(60000); await page.setViewportSize(viewport); await page.route('**/*.mp3', route => route.abort());
    const key = `lp_phonics_progress_${scope}:practice-session-v1`;
    const session = { version: LETTER_PRACTICE_VERSION, round: 2, step: 2, evidence: [{ step: 'trace' }], seed: 'learning-loop', reviewLetters: [] };
    await page.addInitScript(({ key,session }) => { if (!sessionStorage.getItem('seed-letters')) { localStorage.setItem(key, JSON.stringify({ A: session })); localStorage.setItem(key.replace(':practice-session-v1',''), JSON.stringify({ A: 'completed' })); sessionStorage.setItem('seed-letters','1'); } }, { key,session });
    await page.goto('/preview/child-surfaces.html?surface=phonics');
    await openLetter(page);
    const original = buildLetterPracticeQuestions({ letter: 'A', round: 2, step: 2, seed: session.seed })[0];
    const wrong = original.options.find(option => option.id !== original.answer);
    await page.getByRole('button', { name: `Choose ${wrong.label}`, exact: true }).click();
    await expect(page.locator('[data-learning-phase=receipt]').first()).toBeVisible();
    await expect(page.getByRole('button', { name: `Choose ${original.answer}`, exact: true })).toBeDisabled();
    await expect(page.locator('[data-learning-phase=teaching]').first()).toBeVisible();
    await page.reload(); await openLetter(page);
    await expect(page.locator('[data-learning-phase=teaching]').first()).toBeVisible();
    const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)).A.checkpoint.task.episode, key);
    expect(saved.firstResponse.observedCorrect).toBe(false); expect(saved.firstResponse.selected).toBe(wrong.id);
    await matchAll(page);
    await expect(page.getByText('Try a new one', { exact: true })).toBeVisible();
    const transfer = await page.evaluate(key => JSON.parse(localStorage.getItem(key)).A.checkpoint.task.episode, key);
    expect(transfer.question.word).not.toBe(saved.firstQuestion.word);
    const other = transfer.question.answerOptions.find(option => option.id !== transfer.expected);
    await page.getByRole('button', { name: `Choose ${other.label}`, exact: true }).click();
    await expect(page.locator('[data-learning-phase=finish_teaching]').first()).toBeVisible();
    await matchAll(page);
    await expect.poll(() => page.evaluate(key => JSON.parse(localStorage.getItem(key)).A.checkpoint.answers.length, key)).toBe(1);
    const finished = await page.evaluate(key => JSON.parse(localStorage.getItem(key)).A.checkpoint.answers[0], key);
    expect(finished.episode.firstResponse.selected).toBe(wrong.id); expect(finished.attempts).toBe(1);
    expect(finished.episode.responses).toHaveLength(2); expect(finished.independent).toBe(false);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('CVC preserves a correctly built prefix through wrong input and saved guided cursor', async ({ page }) => {
  test.setTimeout(60000); await page.route('**/*.mp3', route => route.abort());
  const key = cvcPracticeSessionKey(scope);
  await page.addInitScript(({ key }) => { if (!sessionStorage.getItem('seed-cvc')) { localStorage.setItem(key, JSON.stringify({ at: { v: 1, familyId: 'at', id: 'cvc-recovery', step: 2, evidence: [{ step: 'hear', independent: false }] } })); sessionStorage.setItem('seed-cvc','1'); } }, { key });
  await page.goto('/preview/child-surfaces.html?surface=phonics&island=words&unlockWords=1');
  await page.getByRole('button', { name: /^at word family,/ }).click();
  await page.getByRole('button', { name: 'Choose c', exact: true }).click();
  await page.getByRole('button', { name: 'Choose d', exact: true }).click();
  await expect(page.locator('[data-learning-phase=teaching]').first()).toBeVisible();
  await expect(page.getByLabel('Built parts')).toContainText('c');
  await expect(page.locator('[data-phonics-hint]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Choose d', exact: true }).click();
  await expect(page.locator('[data-phonics-hint]')).toHaveText('**t');
  await page.getByRole('button', { name: 'Choose a', exact: true }).click();
  await page.reload(); await page.getByRole('button', { name: /^at word family,/ }).click();
  await expect(page.getByLabel('Built parts')).toContainText('c a');
  await page.getByRole('button', { name: 'Choose t', exact: true }).click();
  const episode = await page.evaluate(key => JSON.parse(localStorage.getItem(key)).at.checkpoint.episodes[0], key);
  expect(episode.firstResponse.selected).toEqual(['c','d']); expect(episode.firstResponse.observedCorrect).toBe(false);
  expect(episode.guidedActions).toHaveLength(1); expect(episode.completion.supported).toBe(true);
  await expect(page.locator('[data-learning-phase=answer]').first()).toBeVisible();
});

test('live rounded campaign locks the original and restores the same teaching stage', async ({ page }) => {
  test.setTimeout(60000); await page.route('**/*.mp3', route => route.abort());
  const mission = CAMPAIGN_MISSIONS.find(item => item.id === 'meadow-01-1');
  let progress = startRoundedMission(createCampaignPreviewProgress(mission.stageId), mission.id, { attemptId: 'browser-learning', now: 1 });
  const cp = currentCampaignCheckpoint(progress), index = cp.challenges.findIndex(beat => beat.mechanic === 'echo_hunt'), beat = cp.challenges[index];
  progress = updateCampaignCheckpoint(progress, mission.id, { attemptId: cp.attemptId, beatIndex: index, beatState: createCampaignBeatState(beat) }, 2);
  const campaignScope = 'sound-seekers-preview:rounded:learning-siblings', key = localProgressStorageKeyForRow('phonics_quest', 'sound_seekers_v3', campaignScope);
  await page.addInitScript(({ key,progress }) => { if (!sessionStorage.getItem('seed-campaign')) { localStorage.setItem(key, JSON.stringify(progress)); sessionStorage.setItem('seed-campaign','1'); } }, { key,progress });
  await page.goto('/preview/rounded-campaign.html?stage=meadow-01&scope=learning-siblings&resume=1');
  await page.getByRole('button', { name: 'Carry on', exact: true }).click();
  const wrong = beat.view.options.find(option => option.id !== beat.key.optionId);
  await page.locator(`[data-choice-id="${wrong.id}"]`).click();
  await expect(page.locator('[data-sibling-learning-task=sound_seekers_campaign]')).toBeVisible();
  await expect(page.locator('[data-learning-phase=teaching]').first()).toBeVisible();
  await page.reload(); await page.getByRole('button', { name: 'Carry on', exact: true }).click();
  await expect(page.locator('[data-learning-phase=teaching]').first()).toBeVisible();
  const recovered = (await campaignBeatState(page,key)).learningRecovery.task.episode;
  expect(recovered.firstResponse.selected).toBe(wrong.id); expect(recovered.firstResponse.observedCorrect).toBe(false);
  await matchAll(page);
  const next = await campaignBeatState(page,key);
  if (next.learningRecovery) expect(next.learningRecovery.task.episode.role).toBe('transfer');
  else expect(next.learningResponses[0].completion.supported).toBe(true);
});

for (const [game,mode] of [['pop-the-word','target'],['word-hopscotch','sentence'],['reading-race','quiz']]) test(`${game} saves one wrong native choice, restores the model and bounds the next step`, async ({page}) => {
  test.setTimeout(90000); await page.route('**/*.mp3',route => route.abort());
  const key = `literacy-guide-phonics-play:fullscreen-overlay-preview:${mode}:easy`;
  await page.goto(`/preview/game-overlay.html?game=${game}&sound=0&music=0`);
  await expect(page.locator(mode === 'target' ? '.pp-play' : '.psw-game')).toBeVisible();
  const native = await page.evaluate(key => JSON.parse(localStorage.getItem(key)),key);
  if(mode==='target') { const target=native.gameState.words[0]; await page.locator('.pp-word-balloon').filter({hasNotText:new RegExp(`^${target}$`)}).first().click(); }
  if(mode==='sentence') { const target=native.gameState.sentences[0].replace(/[.?!]/g,'').split(/\s+/)[0]; await page.locator('.psw-word-stone:not(:disabled)').filter({hasNotText:new RegExp(`^${target}$`)}).first().click(); }
  if(mode==='quiz') { const fix=native.gameState.fixes[0], other=fix.options.find(value=>!(fix.acceptedAnswers||[fix.answer]).includes(value)); await page.locator('.psw-repair-piece').getByText(other,{exact:true}).click(); }
  await expect(page.locator('[data-learning-phase=teaching]').first()).toBeVisible();
  const first=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).stage.data.recovery.task.episode,key);
  expect(first.firstResponse.observedCorrect).toBe(false);
  await page.reload(); await page.getByRole('button',{name:'Continue',exact:true}).click(); await expect(page.locator('[data-learning-phase=teaching]').first()).toBeVisible();
  const restored=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).stage.data.recovery.task.episode,key);
  expect(restored.firstResponse).toEqual(first.firstResponse);
  if (mode === 'target') await page.getByRole('button', { name: `Choose ${restored.expected}`, exact: true }).click(); else await matchAll(page);
  if(await page.locator('[data-learning-phase=answer]').count()) {
    const transfer=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).stage.data.recovery.task.episode,key);
    const expected=Array.isArray(transfer.expected)?transfer.expected[0]:transfer.expected;
    const other=transfer.question.answerOptions.find(option=>option.id!==expected);
    await page.getByRole('button',{name:`Choose ${other.label}`,exact:true}).first().click();
    await expect(page.locator('[data-learning-phase=finish_teaching]').first()).toBeVisible();
    if (mode === 'target') await page.getByRole('button', { name: `Choose ${transfer.expected}`, exact: true }).click(); else await matchAll(page);
  }
  await expect.poll(()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)).round,key),{timeout:mode === 'target' ? 10000 : 30000}).toBe(1);
  const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
  expect(saved.evidence.firstResponses[0].correct).toBe(false);
  expect(saved.evidence.assistedRetries[0].learningEpisode.firstResponse).toEqual(first.firstResponse);
  expect(saved.modelNext).toBe(true); await expect(page.locator('[data-learning-phase=teaching]').first()).toBeVisible();
  expect(saved.score).toBeGreaterThan(0);
  const next=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).stage.data.recovery.task.episode,key);
  expect(next.firstResponse).toBeNull(); expect(next.modelFirst).toBe(true);
});

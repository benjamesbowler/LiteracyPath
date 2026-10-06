import { expect, test } from '@playwright/test';
import { learningResponseEpisodes } from '../../src/utils/learningResponseState.js';

test('a failed transfer keeps the original error, resumes its replacement and retains learning evidence', async ({ page }) => {
  test.setTimeout(90000);
  await page.addInitScript(() => {
    window.__failedTransfer = sessionStorage.getItem('test-failed-transfer');
    window.Audio = class extends EventTarget {
      constructor() { super(); this.src=''; this.currentTime=0; this.volume=1; this.readyState=4; this.duration=0.025; this.paused=true; }
      load() { this.dispatchEvent(new Event('canplay')); }
      play() {
        this.paused=false;
        const episode=window.__literacy?.session()?.responseEpisode;
        const target=episode?.question.audioRequirements?.find(cue=>cue.role==='target_word')?.path;
        if (!window.__failedTransfer && episode?.role==='transfer' && episode.phase==='answer' && target && this.src.includes(target)) {
          window.__failedTransfer=episode.question.id;
          sessionStorage.setItem('test-failed-transfer',episode.question.id);
          this.timer=setTimeout(()=>this.dispatchEvent(new Event('error')),5);
        } else this.timer=setTimeout(()=>{ this.paused=true; this.dispatchEvent(new Event('ended')); },25);
        return Promise.resolve();
      }
      pause() { clearTimeout(this.timer); this.paused=true; }
    };
  });
  const session=()=>page.evaluate(()=>window.__literacy.session());
  const ready=()=>expect(page.locator('[data-skills-practice-ready="true"]')).toBeVisible();
  await page.goto('/tests/fixtures/literacy-practice.html');
  await page.getByText('Choose a particular skill',{exact:true}).click();
  await page.getByRole('combobox',{name:'Practice skill',exact:true}).selectOption('letter_knowledge');
  await page.locator('[data-child-primary-action]').click();
  await ready();
  const original=await session(), first=original.responseEpisode.firstQuestion;
  const buttons=page.locator('.assessment-answer-card, .ixl-answer-button');
  const labels=await buttons.allTextContents();
  await buttons.nth(labels.findIndex(label=>label.trim()!==String(first.answer))).click();
  const model=page.locator('[data-guided-model]:enabled');
  await expect(model.first()).toBeVisible();await model.first().click();
  await expect.poll(async()=> (await session())?.responseEpisode.transferReplacements?.length).toBe(1);
  await ready();
  const recovered=await session(), episode=recovered.responseEpisode;
  expect(recovered.questionIds[0]).toBe(first.id);
  expect(episode.firstQuestion).toEqual(first);
  expect(episode.firstResponse.isCorrect).toBe(false);
  expect(episode.transfer.question.id).toBe(await page.evaluate(()=>window.__failedTransfer));
  expect(episode.question.id).not.toBe(episode.transfer.question.id);
  await page.getByRole('button',{name:'Take a break',exact:true}).click();
  await page.reload();await page.getByRole('button',{name:'Carry on',exact:true}).click();await ready();
  expect((await session()).responseEpisode).toEqual(episode);
  await page.getByRole('button',{name:String(episode.expected),exact:true}).click();
  await expect.poll(async()=> (await session())?.index).toBe(1);
  const record=await page.evaluate(()=>window.__literacy.record());
  const retained=learningResponseEpisodes(record.completions).find(value=>value.id===episode.id);
  expect(retained).toBeTruthy();expect(retained.phase).toBe('complete');
  expect(retained.firstResponse.isCorrect).toBe(false);
  expect(retained.responses.at(-1).evidenceUse).toBe('formative_transfer_after_teaching');
  expect(retained.responses.at(-1).question.id).toBe(episode.question.id);
});

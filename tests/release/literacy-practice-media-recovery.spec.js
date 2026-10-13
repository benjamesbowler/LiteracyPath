import { expect, test } from '@playwright/test';
import { learningResponseEpisodes } from '../../src/utils/learningResponseState.js';

test('a replacement reading question does not inherit narration support from failed media', async ({ page }, info) => {
  test.setTimeout(90000);
  await page.addInitScript(() => {
    window.Audio = class extends EventTarget {
      constructor() { super(); this.src = ''; this.currentTime = 0; this.readyState = 4; this.paused = true; }
      load() { this.dispatchEvent(new Event('canplay')); }
      play() {
        this.paused = false;
        const question = window.__literacy?.session()?.responseEpisode?.question;
        const fail = !sessionStorage.getItem('failed-reading-passage') && question?.passageAudioPath && this.src.includes(question.passageAudioPath);
        if (fail) sessionStorage.setItem('failed-reading-passage', question.id);
        this.timer = setTimeout(() => { this.paused = true; this.dispatchEvent(new Event(fail ? 'error' : 'ended')); }, 25);
        return Promise.resolve();
      }
      pause() { clearTimeout(this.timer); this.paused = true; }
    };
  });
  await page.goto('/tests/fixtures/literacy-practice.html');
  await page.getByText('Choose a particular skill', { exact: true }).click();
  await page.getByRole('combobox', { name: 'Practice skill', exact: true }).selectOption('main_idea');
  await page.locator('[data-child-primary-action]').click();
  await expect(page.locator('[data-skills-practice-ready="true"]')).toBeVisible();
  const original = await page.evaluate(() => window.__literacy.session().responseEpisode.question);
  const originalId = original.id;
  await page.getByRole('button', { name: 'Listen to passage', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__literacy.session()?.failedQuestionIds?.includes(sessionStorage.getItem('failed-reading-passage')))).toBe(true);
  await expect(page.locator('[data-skills-practice-ready="true"]')).toBeVisible();
  const replacement = await page.evaluate(() => window.__literacy.session().responseEpisode.question);
  expect(replacement.id).not.toBe(originalId);
  expect(replacement.literacyRouting).toMatchObject({ reason: 'media_replacement', itemDemand: original.literacyRouting.itemDemand });
  expect(replacement.passageAccess).toBe(original.passageAccess);
  await page.screenshot({ path: info.outputPath('reading-media-recovered.png') });
  await page.locator('.assessment-answer-card').first().click();
  await page.getByRole('button', { name: 'Check answer', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__literacy.session().answers.length)).toBe(1);
  const rows = await page.evaluate(() => window.__literacy.record().completions.flatMap(event => event.steps));
  expect(rows.find(row => row.questionId === originalId && row.responseStatus === 'media_failed')).toBeTruthy();
  const response = rows.find(row => row.questionId === replacement.id && row.responseStatus === 'answered');
  expect(response.supportUsed).toBe(false);
  expect(response.itemSnapshot.passageAudioUsed).toBe(false);
  expect(response.evidenceType).toBe('independent');
});

test('failed media on the next question preserves the original error and resumes its replacement', async ({ page }) => {
  test.setTimeout(90000);
  await page.addInitScript(() => {
    window.__failedTransfer = sessionStorage.getItem('test-failed-transfer');
    window.Audio = class extends EventTarget {
      constructor() { super(); this.src=''; this.currentTime=0; this.volume=1; this.readyState=4; this.duration=0.025; this.paused=true; }
      load() { this.dispatchEvent(new Event('canplay')); }
      play() {
        this.paused=false;
        const episode=window.__literacy?.session()?.responseEpisode;
        const cues=episode?.question.audioRequirements || [];
        const target=(cues.find(cue=>cue.role==='target_word') || cues[0])?.path;
        if (!window.__failedTransfer && window.__literacy?.session()?.index===1 && episode?.phase==='answer' && target && this.src.includes(target)) {
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
  if (first.mapInteraction === 'match') {
    const incorrect = JSON.parse(first.answer).reverse();
    for (const [index, id] of incorrect.entries()) {
      const option = first.answerOptions.find(item => item.value === id);
      await page.getByRole('button', { name: 'Pick ' + option.label, exact: true }).click();
      await page.getByRole('button', { name: 'Place in space ' + (index + 1), exact: true }).click();
    }
  } else {
    const buttons=page.locator('.assessment-answer-card, .ixl-answer-button');
    const labels=await buttons.allTextContents();
    await buttons.nth(labels.findIndex(label=>label.trim()!==String(first.answer))).click();
  }
  await page.getByRole('button',{name:'Check answer',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Incorrect',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Next question',exact:true}).click();
  await expect.poll(async()=> (await session())?.failedQuestionIds?.length).toBe(1);
  await ready();
  const recovered=await session(), episode=recovered.responseEpisode;
  expect(recovered.index).toBe(1);expect(recovered.questionIds[0]).toBe(first.id);
  expect(episode.role).toBe('first_probe');expect(episode.question.id).not.toBe(await page.evaluate(()=>window.__failedTransfer));
  await page.getByRole('button',{name:'Take a break',exact:true}).click();
  await page.reload();await page.getByRole('button',{name:'Carry on',exact:true}).click();await ready();
  expect((await session()).responseEpisode).toEqual(episode);
  if(episode.question.mapInteraction==='match'){
    for(const [i,id] of JSON.parse(episode.expected).entries()){
      const option=episode.question.answerOptions.find(option=>option.value===id);
      await page.getByRole('button',{name:'Pick '+option.label,exact:true}).click();
      await page.getByRole('button',{name:'Place in space '+(i+1),exact:true}).click();
    }
  }else await page.getByRole('button',{name:String(episode.expected),exact:true}).click();
  await page.getByRole('button',{name:'Check answer',exact:true}).click();
  await page.getByRole('button',{name:'Next question',exact:true}).click();
  await expect.poll(async()=> (await session())?.index).toBe(2);
  const record=await page.evaluate(()=>window.__literacy.record());
  const retained=learningResponseEpisodes(record.completions).find(value=>value.id===original.responseEpisode.id);
  expect(retained).toBeTruthy();expect(retained.phase).toBe('complete');
  expect(retained.firstResponse.isCorrect).toBe(false);
  expect(retained.responses).toHaveLength(1);expect(retained.responses[0].evidenceUse).toBe('independent_practice_response');
  expect(retained.firstQuestion.id).toBe(first.id);
});

test('a resumed mixed plan recovers failed media from its saved skill bank', async ({ page }) => {
  test.setTimeout(90000);
  await page.addInitScript(() => {
    window.Audio = class extends EventTarget {
      constructor() { super(); this.src=''; this.currentTime=0; this.readyState=4; this.paused=true; }
      load() { this.dispatchEvent(new Event('canplay')); }
      play() {
        this.paused=false;
        const saved=window.__literacy?.session(), question=saved?.responseEpisode?.question;
        const target=question?.audioRequirements?.find(cue=>cue.role==='target_word')?.path;
        const fail=saved?.skillId==='all' && !sessionStorage.getItem('mixed-media-failed') && target && this.src.includes(target);
        if (fail) sessionStorage.setItem('mixed-media-failed',question.id);
        this.timer=setTimeout(()=>{ this.paused=true; this.dispatchEvent(new Event(fail?'error':'ended')); },25);
        return Promise.resolve();
      }
      pause() { clearTimeout(this.timer); this.paused=true; }
    };
  });
  await page.goto('/tests/fixtures/literacy-practice.html');
  await page.getByText('Choose a particular skill',{exact:true}).click();
  await page.getByRole('combobox',{name:'Practice skill',exact:true}).selectOption('letter_knowledge');
  await page.locator('[data-child-primary-action]').click();
  await expect(page.locator('[data-skills-practice-ready="true"]')).toBeVisible();
  await page.getByRole('button',{name:'Take a break',exact:true}).click();
  // A legacy mixed checkpoint can contain any previously offered skill.
  await page.evaluate(async()=>{
    const { saveSkillsPracticeSession }=await import('/src/utils/skillsPracticeProgress.js');
    const { selectLiteracyPracticeQuestions }=await import('/src/utils/literacyPracticePlanner.js');
    const saved=window.__literacy.session(), bank=await window.__literacy.bank({focus:'letter_knowledge'});
    const plan=[saved.responseEpisode.question,...selectLiteracyPracticeQuestions(bank.filter(q=>q.id!==saved.questionIds[0]),{focus:'letter_knowledge',seed:'legacy-mixed',count:11})];
    saveSkillsPracticeSession('literacy-practice-preview',{...saved,skillId:'all',practiceOwner:{...saved.practiceOwner,focusId:'all'},questionIds:plan.map(q=>q.id),questionSkills:Object.fromEntries(plan.map(q=>[q.id,q.skillId]))},'literacy-practice');
  });
  await page.reload();
  await page.getByRole('button',{name:'Carry on',exact:true}).click();
  await expect.poll(()=>page.evaluate(()=>window.__literacy.session()?.failedQuestionIds?.length)).toBe(1);
  await expect(page.locator('[data-skills-practice-ready="true"]')).toBeVisible();
  const saved=await page.evaluate(()=>window.__literacy.session());
  expect(saved.skillId).toBe('all'); expect(saved.index).toBe(0);
  expect(saved.responseEpisode.question.skillId).toBe('letter_knowledge');
  expect(saved.failedQuestionIds).not.toContain(saved.responseEpisode.question.id);
  const rows=await page.evaluate(()=>window.__literacy.record().completions.flatMap(event=>event.steps));
  expect(rows.some(row=>row.responseStatus==='media_failed')).toBe(true);
  expect(rows.every(row=>row.isCorrect!==false)).toBe(true);
});

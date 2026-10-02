import { expect, test } from '@playwright/test';
import { buildLetterPracticeQuestions } from '../../src/data/letterPractice.js';
import { LETTER_PRACTICE_VERSION } from '../../src/policy/letterPractice.js';

const key = 'lp_phonics_progress_child-surface-preview:practice-session-v1';
const route = '/preview/child-surfaces.html?surface=phonics';
const viewports = [{width:1280,height:720},{width:1467,height:829},{width:1024,height:768},{width:768,height:1024},{width:320,height:568},{width:568,height:320}];
test.describe.configure({timeout:90000});
async function open(page) {
  if (!await page.getByRole('button',{name:/^Letter A(?:,|$)/}).count()) await page.getByRole('button',{name:'Choose a letter',exact:true}).click();
  await page.getByRole('button',{name:/^Letter A(?:,|$)/}).click();
}
async function seed(page,round,step) {
  const session = {version:LETTER_PRACTICE_VERSION,round,step,evidence:Array.from({length:step-1},(_,index)=>({practiceStep:index+1})),seed:'letters-fit',reviewLetters:[]};
  await page.addInitScript(({key,session})=>{
    if (!sessionStorage.getItem('letters-fit-seeded')) {
      localStorage.setItem(key,JSON.stringify({A:session}));
      localStorage.setItem(key.replace(':practice-session-v1',''),JSON.stringify({A:{status:session.round>1?'completed':'inprogress',completions:Array.from({length:session.round-1},(_,index)=>({id:`fixture-round-${index+1}`,contentVersion:session.version,completedAt:'2026-10-02T00:00:00.000Z',steps:[1,2,3].map(practiceStep=>({practiceRound:index+1,practiceStep}))}))}}));
      sessionStorage.setItem('letters-fit-seeded','1');
    }
  },{key,session});
  // Unavailable recordings exercise the taller visible-target recovery too.
  await page.route('**/*.mp3',route=>route.abort());
  await page.goto(route); await open(page);
  return buildLetterPracticeQuestions({letter:'A',round,step,seed:session.seed})[0];
}
async function fit(page,locator,{height=56,scroll=false}={}) {
  for(const item of await locator.all()) {
    if(scroll) await item.scrollIntoViewIfNeeded();
    const box=await item.boundingBox(), tabs=await page.locator('.kg-tabbar').boundingBox();
    expect(box.height + 0.1).toBeGreaterThanOrEqual(height); // Scaled canvas subpixel rounding.
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x+box.width).toBeLessThanOrEqual((await page.evaluate(()=>innerWidth))+1);
    expect(box.y+box.height).toBeLessThanOrEqual(tabs.y+1);
    expect(await item.evaluate(el=>{
      const b=el.getBoundingClientRect();const hit=document.elementFromPoint(b.x+b.width/2,b.y+b.height/2);
      return hit && (hit===el || el.contains(hit));
    })).toBe(true);
  }
}
for(const viewport of viewports) {
  test(`first-round picture matching is readable at ${viewport.width}x${viewport.height}`,async({page},info)=>{
    await page.setViewportSize(viewport);await seed(page,1,3);
    const board=page.locator('[data-sibling-learning-task="printed_letter_matching"]');
    const options=board.locator('.learning-guided-action');
    await expect(options).toHaveCount(3);
    await expect(board.getByRole('button',{name:'Choose apple',exact:true})).toBeVisible();
    const question=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).A.checkpoint.task.episode.question,key);
    expect(new Set(question.answerOptions.map(option=>option.id)).size).toBe(3);
    for(const option of question.answerOptions) {
      expect(option.label).toBeTruthy();expect(option.image).toBeTruthy();
    }
    await fit(page,options,{height:90,scroll:viewport.height<500});
    for(const img of await options.locator('img').all()) {
      await expect.poll(()=>img.evaluate(el=>el.complete&&el.naturalWidth>0)).toBe(true);
      expect((await img.boundingBox()).height).toBeGreaterThanOrEqual(viewport.width>600?120:72);
    }
    await page.screenshot({path:info.outputPath('first-round-pictures.png')});
  });
  test(`first-round error can review, learn and continue at ${viewport.width}x${viewport.height}`,async({page})=>{
    await page.setViewportSize(viewport);await seed(page,1,3);
    const board=page.locator('[data-sibling-learning-task="printed_letter_matching"]');
    const original=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).A.checkpoint.task.episode.question,key);
    const wrong=original.answerOptions.find(option=>option.id!==original.answer);
    await board.getByRole('button',{name:`Choose ${wrong.label}`,exact:true}).click();
    await expect(board).toHaveAttribute('data-learning-phase','teaching');
    await fit(page,board.locator('[data-guided-model]:enabled'),{height:72,scroll:viewport.width<400||viewport.height<500});
    await fit(page,board.getByRole('button',{name:'← Back to question',exact:true}),{scroll:viewport.width<400||viewport.height<500});
    const before=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).A.checkpoint.task.episode,key);
    await board.getByRole('button',{name:'← Back to question',exact:true}).click();
    await expect(board.getByRole('button',{name:`Choose ${wrong.label}`,exact:true})).toBeDisabled();
    await board.getByRole('button',{name:'Learn together →',exact:true}).click();
    expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).A.checkpoint.task.episode,key)).toEqual(before);
    await page.reload();await open(page);
    await board.locator('[data-guided-model]:enabled').click();
    await expect(page.locator('.phonics-practice-count')).toHaveText('Found: 1 / 4');
    const completed=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).A.checkpoint.episodes[0],key);
    expect(completed.firstResponse).toEqual(before.firstResponse);
    expect(completed.completion.supported).toBe(true);
  });
  for(const [round,step,mode] of [[2,2,'picture-word'],[3,2,'letter-sound'],[2,3,'letter-pair'],[3,3,'word-letter']]) {
    test(`${mode} has readable choices at ${viewport.width}x${viewport.height}`,async({page},info)=>{
      await page.setViewportSize(viewport);await seed(page,round,step);
      const board=page.locator('[data-sibling-learning-task="letter_practice"]');
      await expect(board).toHaveAttribute('data-practice-mode',mode);
      await page.screenshot({path:info.outputPath(`${mode}.png`)});
      const options=board.locator('.learning-guided-action');
      await fit(page,options,{height:viewport.height<500?72:90,scroll:viewport.height<500});
      if(mode==='picture-word') for(const img of await options.locator('img').all()) {
        await expect.poll(()=>img.evaluate(el=>el.complete&&el.naturalWidth>0)).toBe(true);
        expect((await img.boundingBox()).height).toBeGreaterThanOrEqual(viewport.width>600?120:72);
        expect(await img.evaluate(el=>{
          const image=el.getBoundingClientRect(), card=el.parentElement.getBoundingClientRect();
          return image.top>=card.top && image.bottom<=card.bottom && image.left>=card.left && image.right<=card.right;
        })).toBe(true);
      } else for(const option of await options.all()) {
        expect(await option.evaluate(el=>parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(56);
      }
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      if(viewport.width===1280) await page.screenshot({path:info.outputPath(`${mode}.png`)});
    });
  }
  for(const [recoveryRound,recoveryMode] of [[3,'letter-sound'],[2,'picture-word']]) test(`${recoveryMode} wrong answer can review, learn and continue at ${viewport.width}x${viewport.height}`,async({page},info)=>{
    test.setTimeout(60000);await page.setViewportSize(viewport);
    const original=await seed(page,recoveryRound,2), wrong=original.options.find(item=>item.id!==original.answer);
    await page.getByRole('button',{name:`Choose ${wrong.label}`,exact:true}).click();
    const board=page.locator('[data-sibling-learning-task="letter_practice"]');
    await expect(board).toHaveAttribute('data-learning-phase','teaching');
    const before=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).A.checkpoint.task.episode,key);
    const short=viewport.height<500 || viewport.width<400;
    await fit(page,board.locator('[data-guided-model]:enabled'),{height:72,scroll:short});
    await fit(page,board.getByRole('button',{name:'← Back to question',exact:true}),{scroll:short});
    if(viewport.width===1280) await page.screenshot({path:info.outputPath('teaching.png')});
    await board.getByRole('button',{name:'← Back to question',exact:true}).click();
    await expect(board).toHaveAttribute('data-question-review','true');
    await expect(board.getByRole('button',{name:`Choose ${original.answer}`,exact:true})).toBeDisabled();
    await expect(board.getByRole('button',{name:`Choose ${wrong.label}`,exact:true})).toHaveAttribute('aria-pressed','true');
    await board.getByRole('button',{name:'Learn together →',exact:true}).click();
    await expect(board).not.toHaveAttribute('data-question-review','true');
    const afterReview=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).A.checkpoint.task.episode,key);
    expect(afterReview).toEqual(before);
    await page.reload();await open(page);
    await expect(board).toHaveAttribute('data-learning-phase','teaching');
    await board.locator('[data-guided-model]:enabled').click();
    await expect(board).toHaveAttribute('data-learning-phase','answer');
    await expect(board.getByText('Try a new one',{exact:true})).toBeVisible();
    const transfer=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).A.checkpoint.task.episode,key);
    expect(transfer.firstResponse).toEqual(before.firstResponse);
    expect(transfer.question.id).not.toBe(original.id);
    // A second miss ends with supported work, then moves to the next curriculum slot.
    const other=transfer.question.answerOptions.find(item=>item.id!==transfer.expected);
    await board.getByRole('button',{name:`Choose ${other.label}`,exact:true}).click();
    await expect(board).toHaveAttribute('data-learning-phase','finish_teaching');
    await board.locator('[data-guided-model]:enabled').click();
    await expect(page.locator('.phonics-practice-count')).toHaveText('2 of 8');
    const completed=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).A.checkpoint.answers[0],key);
    expect(completed.episode.firstResponse).toEqual(before.firstResponse);
    expect(completed.independent).toBe(false);expect(completed.attempts).toBe(1);
    if(viewport.width===1280) await page.screenshot({path:info.outputPath('next-question.png')});
  });
}

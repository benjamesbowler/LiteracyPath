import { expect, test } from '@playwright/test';
const url='/tests/fixtures/literacy-practice.html';
const saved=page=>page.evaluate(()=>window.__literacy.session());
const ready=page=>expect(page.locator('[data-skills-practice-ready="true"]')).toBeVisible();
async function audio(page){await page.addInitScript(()=>{window.Audio=class extends EventTarget{constructor(){super();this.src='';this.currentTime=0;this.readyState=4;this.duration=.025;this.paused=true;}load(){this.dispatchEvent(new Event('canplay'));}play(){this.paused=false;this.timer=setTimeout(()=>this.dispatchEvent(new Event('ended')),25);return Promise.resolve();}pause(){clearTimeout(this.timer);this.paused=true;}};});}
async function begin(page,mode='practice'){
  await audio(page);await page.goto(url);
  await page.locator(`input[value="${mode}"]`).check();
  await page.getByText('Choose a particular skill',{exact:true}).click();
  await page.getByRole('combobox',{name:'Practice skill',exact:true}).selectOption('letter_knowledge');
  await page.locator('[data-child-primary-action]').click();await ready(page);
}
async function beginMixed(page){
  await audio(page);await page.goto(url);await page.locator('[data-child-primary-action]').click();await ready(page);
}

test('single-choice draft can change and survives reload without creating a response',async({page},info)=>{
  await begin(page);
  const question=(await saved(page)).responseEpisode.question;
  const buttons=page.locator('.assessment-answer-card, .ixl-answer-button');
  await buttons.nth(0).click();await buttons.nth(1).click();
  await expect(buttons.nth(1)).toHaveAttribute('aria-pressed','true');
  expect((await saved(page)).answers).toEqual([]);
  await page.getByRole('button',{name:'Take a break',exact:true}).click();await page.reload();
  await page.getByRole('button',{name:'Carry on',exact:true}).click();await ready(page);
  await expect(buttons.nth(1)).toHaveAttribute('aria-pressed','true');
  expect((await saved(page)).answers).toEqual([]);
  await page.screenshot({path:info.outputPath('editable-draft.png')});
  await page.getByRole('button',{name:'Check answer',exact:true}).click();
  await expect(page.getByRole('button',{name:'Next question',exact:true})).toBeVisible();
  const first=(await saved(page)).responseEpisode.firstResponse;
  expect(first.question.id).toBe(question.id);expect((await saved(page)).answers).toHaveLength(1);
  // Purposeful dwell check: the old 2.4s auto-advance must no longer occur.
  await page.waitForTimeout(3000);
  expect((await saved(page)).index).toBe(0);expect((await saved(page)).responseEpisode.firstResponse).toEqual(first);
  await page.getByRole('button',{name:'Next question',exact:true}).click();
  await expect.poll(async()=> (await saved(page)).index).toBe(1);
});

test('rehearsal records the submitted choice neutrally and offers explanations after completion',async({page})=>{
  await begin(page,'rehearsal');
  const sessionId=(await saved(page)).id;
  await expect(page.getByRole('button',{name:"I don't know yet",exact:true})).toHaveCount(0);
  for(let i=0;i<6;i++){
    await ready(page);await expect.poll(async()=> (await saved(page)).index).toBe(i);
    const q=(await saved(page)).responseEpisode.question;
    if(q.mapInteraction==='match'){
      for(const [i,id] of JSON.parse(q.answer).entries()){
        const option=q.answerOptions.find(option=>option.value===id);
        await page.getByRole('button',{name:'Pick '+option.label,exact:true}).click();
        await page.getByRole('button',{name:'Place in space '+(i+1),exact:true}).click();
      }
    }else await page.locator('.assessment-answer-card, .ixl-answer-button').first().click();
    expect((await saved(page)).answers).toHaveLength(i);
    await page.getByRole('button',{name:'Next',exact:true}).click();
    await expect(page.getByRole('heading',{name:/^(Correct|Incorrect)$/})).toHaveCount(0);
    if(i<5) await expect.poll(async()=> (await saved(page)).index).toBe(i+1);
  }
  await page.getByRole('button',{name:'Review this adventure',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Look back at your answers',exact:true})).toBeVisible();
  await expect(page.locator('.literacy-practice-review li')).toHaveCount(6);
  const records=await page.evaluate(sessionId=>window.__literacy.record().completions.filter(event=>event.sessionId===sessionId).flatMap(e=>e.steps||[]).filter(s=>s.responseStatus==='answered'),sessionId);
  expect(records).toHaveLength(6);
  expect(records.every(r=>r.itemSnapshot.administration==='rehearsal'&&r.itemSnapshot.explanation)).toBe(true);
});

test('button familiarisation creates no literacy session or response',async({page})=>{
  await audio(page);await page.goto(url);
  await page.getByRole('button',{name:'Try the buttons first',exact:true}).click();
  await page.getByRole('button',{name:'Square',exact:true}).click();
  await page.getByRole('button',{name:'Next →',exact:true}).click();
  await expect(page.getByText('The circle is round. Try changing your choice.',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Circle',exact:true}).click();await page.getByRole('button',{name:'Next →',exact:true}).click();
  await page.getByRole('button',{name:'Pick picture 1',exact:true}).click();
  await page.getByRole('button',{name:'Place in space 1',exact:true}).click();
  await page.getByRole('button',{name:'Remove from space 1',exact:true}).click();
  await expect(page.locator('.map-placement-status')).toHaveText('0 of 1 placed.');
  expect(await saved(page)).toBeFalsy();
  expect(await page.evaluate(()=>window.__literacy.record().completions)).toEqual([]);
});

for(const format of ['INITIAL_SOUND_PAIR_SELECT','HFW_LETTER_BUILD','PUT_SOUNDS_IN_ORDER','GRAMMAR_SENTENCE_FIT','select_text','picture_choice']) {
  test(`${format} stays editable and restores its unsubmitted draft`,async({page})=>{
    await beginMixed(page);
    await page.getByRole('button',{name:'Take a break',exact:true}).click();
    await page.evaluate(async format=>{
      const bank=await window.__literacy.bank();
      const q=bank.find(q=>(q.templateType||q.formatType)===format || q.mapInteraction===format);
      if(!q)throw new Error('Missing authored format '+format);
      return window.__literacy.seedQuestion(q.id);
    },format);
    await page.reload();await page.getByRole('button',{name:'Carry on',exact:true}).click();await ready(page);
    const submit=page.getByRole('button',{name:'Check answer',exact:true});
    await expect(submit).toBeDisabled();
    if(format==='INITIAL_SOUND_PAIR_SELECT'){
      // This legacy format name now denotes target-to-picture sound matching,
      // normalized to one visual choice rather than selecting a pair of cards.
      expect((await saved(page)).responseEpisode.question.questionType).toBe('visual_card_choice');
      const options=page.locator('.visual-assessment-card-button');
      await options.nth(0).click();await options.nth(1).click();
      await expect(options.nth(0)).toHaveAttribute('aria-pressed','false');
      await expect(options.nth(1)).toHaveAttribute('aria-pressed','true');
    }else if(['HFW_LETTER_BUILD','PUT_SOUNDS_IN_ORDER'].includes(format)){
      const count=await page.locator('.sound-order-empty-slot').count();
      for(let i=0;i<count;i++)await page.locator('.sound-order-tile:not(:disabled)').first().click();
      await page.locator('.sound-order-selected-tile').first().click();await expect(submit).toBeDisabled();
      await page.locator('.sound-order-tile:not(:disabled)').first().click();
    }else{
      const options=page.locator(format==='GRAMMAR_SENTENCE_FIT'?'.ixl-answer-button':'.map-select-tile');
      await options.nth(0).click();await options.nth(1).click();
      await expect(options.nth(1)).toHaveAttribute('aria-pressed','true');
    }
    await expect(submit).toBeEnabled();expect((await saved(page)).answers).toEqual([]);
    await page.getByRole('button',{name:'Take a break',exact:true}).click();await page.reload();
    await page.getByRole('button',{name:'Carry on',exact:true}).click();await ready(page);
    await expect(submit).toBeEnabled();expect((await saved(page)).answers).toEqual([]);
    await submit.click();await expect(page.getByRole('button',{name:'Next question',exact:true})).toBeVisible();
    expect((await saved(page)).answers).toHaveLength(1);
  });
}

for(const kind of ['book_cover','contents','glossary'])test(`${kind} presents a readable structured text feature`,async({page},info)=>{
  await beginMixed(page);await page.getByRole('button',{name:'Take a break',exact:true}).click();
  const q=await page.evaluate(async kind=>{
    const q=(await window.__literacy.bank()).find(q=>q.textFeature?.kind===kind);
    if(!q)throw new Error('Missing text feature '+kind);
    return window.__literacy.seedQuestion(q.id);
  },kind);
  await page.reload();await page.getByRole('button',{name:'Carry on',exact:true}).click();await ready(page);
  const feature=page.locator('.assessment-text-feature');await expect(feature).toBeVisible();
  await expect(feature).toContainText(q.textFeature.title);
  const structure=kind==='contents'?'table':kind==='glossary'?'dl':'.text-feature-book_cover';
  await expect(page.locator(structure)).toBeVisible();
  expect((await saved(page)).answers).toEqual([]);
  await page.screenshot({path:info.outputPath(`text-feature-${kind}.png`)});
});

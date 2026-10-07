import { test, expect } from '@playwright/test';
import { buildCyclePresentation } from '../../src/utils/present/presentationBuilder.js';

const preview = '/preview/teacher-a11y.html?surface=present';
async function openLessonOptions(page) { await page.locator('.pr-change-lesson > summary').click(); }
async function openLessonPreview(page) { await page.getByRole('button', { name: 'Preview', exact: true }).click(); }
async function nextPreviewSlide(page) { await page.getByRole('button', {name:'Next preview slide', exact:true}).click(); }
async function deckPage(page, options = {}) {
  const {cycle = 'cycle-15', ...rest} = options;
  const deck = buildCyclePresentation(cycle, { day: 'thursday', format: 'extended', ...rest });
  await page.route('**/present-classroom-test', route => route.fulfill({contentType:'text/html',headers:{'Content-Security-Policy':"default-src 'self' blob:; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self'; font-src 'self'"},body:deck.html}));
  await page.goto('/present-classroom-test');
  await page.getByRole('button',{name:'Start presentation',exact:true}).click();
  return deck;
}
async function jump(page, deck, cls) {
  const target = deck.slideIndex.find(s=>s.cls===cls);
  expect(target,cls).toBeTruthy();
  await page.getByRole('button',{name:'Choose a slide',exact:true}).click();
  await page.locator(`[data-go-slide="${target.index}"]`).click();
  await expect(page.locator('.slide.active')).toHaveClass(new RegExp(cls));
  return target;
}
for (const viewport of [{width:1366,height:900},{width:1024,height:768},{width:390,height:844}]) {
  test(`teacher workspace fits and changes lesson at ${viewport.width}px`,async({page})=>{
    test.setTimeout(90000);
    await page.setViewportSize(viewport); await page.goto(preview);
    await expect(page.getByRole('heading',{name:'Today’s lesson',exact:true})).toBeVisible();
    await openLessonOptions(page); await page.getByRole('button',{name:/Explore further 25 min/}).click();
    await expect(page.locator('.pr-head')).toContainText('25 minutes');
    await page.getByRole('button',{name:'Wednesday',exact:true}).click();
    await expect(page.locator('.pr-head')).toContainText('Wednesday');
    await openLessonPreview(page);
    await page.getByRole('searchbox',{name:'Find a slide'}).fill('build');
    await page.locator('.pr-slide-list button').filter({hasText:'Build a word'}).first().click();
    await expect(page.frameLocator('iframe').locator('.slide.active')).toHaveClass(/p-word-build/);
    await page.locator('.pr-teacher-notes > summary').click();
    await expect(page.locator('.pr-teacher-notes')).toContainText('Say ');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    await page.screenshot({animations:'disabled',path:`.artifacts/app-simplification/teacher/present-${viewport.width}.png`,fullPage:true});
  });
}
test('word building checks actual ordered input, retries and resets without changing slides',async({page})=>{
  const deck = await deckPage(page); const entry = await jump(page,deck,'p-word-build');
  const active=page.locator('.slide.active');
  const parts=JSON.parse(await active.locator('[data-build-target]').getAttribute('data-build-target'));
  const wrong=active.locator('[data-build-part]').filter({hasNotText:parts[0]}).first();
  await wrong.click(); await expect(active.locator('.p-build-feedback')).toContainText('Listen again');
  await expect(active.locator('.filled')).toHaveCount(0);
  for(const part of parts)await active.locator('[data-build-part]:not(:disabled)').filter({hasText:new RegExp(`^${part}$`)}).first().click();
  await expect(active.locator('.p-build-feedback')).toContainText(`You built ${parts.join('')}`);
  await expect(active.locator('.filled')).toHaveCount(parts.length);
  await active.getByRole('button',{name:'Start again',exact:true}).press('Enter');
  await expect(active.locator('.filled')).toHaveCount(0);
  await expect(page.locator('#counter')).toHaveText(`${entry.index+1} / ${deck.slideCount}`);
  await page.screenshot({animations:'disabled',path:'.artifacts/present/word-build.png'});
});
test('reveals are hidden from accessibility, reset on return and private notes never project',async({page})=>{
  const deck=await deckPage(page); const entry=await jump(page,deck,'p-pattern-read');
  const active=page.locator('.slide.active'); const answer=active.locator('.p-answer');
  await expect(answer).toBeHidden();
  expect(await answer.evaluate(el=>el.inert)).toBe(true);
  await active.getByRole('button',{name:'Show the answer'}).press('Enter');
  await expect(answer).toBeVisible(); expect(await answer.evaluate(el=>el.inert)).toBe(false);
  await expect(page.locator('#counter')).toHaveText(`${entry.index+1} / ${deck.slideCount}`);
  await page.locator('#next').click(); await page.locator('#prev').click();
  await expect(answer).toBeHidden(); await expect(active.getByRole('button',{name:'Show the answer'})).toBeVisible();
  expect(await page.locator('body').textContent()).not.toContain(entry.teacher);
});
test('word changes reveal one changed part and vocabulary offers readable picture words',async({page})=>{
  const deck=await deckPage(page); await jump(page,deck,'p-word-change');
  const active=page.locator('.slide.active');
  await expect(active.locator('.p-answer')).toBeHidden();
  await active.getByRole('button',{name:'Show the answer'}).click();
  await expect(active.locator('.p-answer')).toBeVisible();
  await expect(active.locator('.p-changed-part')).toHaveCount(1);
  await expect(active.locator('.p-changed-part')).toHaveText('ch');
  await page.screenshot({animations:'disabled',path:'.artifacts/present/word-change.png'});
  await jump(page,deck,'p-vocabulary');
  await expect(active.locator('.p-picture-card')).toHaveCount(6);
  await expect(active.getByRole('heading',{name:'Look. Say it. Read it together.'})).toBeVisible();
  await expect(active.locator('.p-picture-card img')).toHaveCount(6);
});
test('keyboard timer, pause screen, overview and navigation operate under production CSP',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const deck=await deckPage(page); const entry=await jump(page,deck,'p-phoneme');
  const timer=page.locator('.slide.active [data-timer-start]');
  await timer.press('Enter'); await expect(timer).toHaveAttribute('aria-pressed','true');
  await expect(timer.locator('.p-timer-face')).toHaveText('59',{timeout:2500});
  await expect(page.locator('#counter')).toHaveText(`${entry.index+1} / ${deck.slideCount}`);
  await timer.press('Space'); await expect(timer.locator('.p-timer-face')).toHaveText('60');
  await page.keyboard.press('b'); await expect(page.locator('#blank-screen')).toBeVisible();
  await page.keyboard.press('b'); await expect(page.locator('#blank-screen')).toBeHidden();
  await page.keyboard.press('o'); await expect(page.getByRole('dialog',{name:'Choose a slide'})).toBeVisible();
  await page.keyboard.press('Escape'); await expect(page.locator('#overview')).toBeHidden();
  await page.keyboard.press('End'); await expect(page.locator('#next')).toBeDisabled();
  await page.keyboard.press('Home'); await expect(page.locator('#prev')).toBeDisabled();
  expect(errors).toEqual([]);
});
test('sentence tracking advances by words and can restart; blend model is deliberate',async({page})=>{
  const deck=await deckPage(page);await jump(page,deck,'p-sentence-track');
  const words=page.locator('.slide.active [data-track-word]');
  const count=await words.count(); const next=page.getByRole('button',{name:'Point to the next word'});
  for(let i=0;i<count;i++){await next.click();await expect(words.nth(i)).toHaveAttribute('aria-current','true');}
  await expect(page.getByRole('button',{name:'Sentence complete'})).toBeDisabled();
  await page.getByRole('button',{name:'Read again',exact:true}).click();
  await expect(page.locator('.slide.active [aria-current]')).toHaveCount(0);
  await jump(page,deck,'p-pattern-read');
  await page.getByRole('button',{name:'Guide the blend'}).click();
  await expect(page.locator('.slide.active .is-guided')).toHaveCount(1);
  await expect(page.locator('.slide.active .p-answer')).toBeVisible({timeout:10000});
  await page.screenshot({animations:'disabled',path:'.artifacts/present/pattern-reading.png'});
});
test('real picker opens selected slide and offers a working blocked-popup fallback',async({page,context})=>{
  await page.goto(preview); await openLessonPreview(page); await nextPreviewSlide(page);
  const popupPromise=context.waitForEvent('page');await page.getByRole('button',{name:'Present full screen from slide 2',exact:true}).click();
  const popup=await popupPromise;await popup.getByRole('button',{name:'Start presentation',exact:true}).click();
  await expect(popup.locator('#counter')).toHaveText(/^2 \/ /);
  await popup.locator('#next').click();
  await expect(page.locator('.pr-slide-counter')).toHaveText(/^Slide 3 of /);
  await page.locator('.pr-teacher-notes > summary').click();
  await expect(page.locator('.pr-teacher-notes')).toContainText('Teacher notes · slide 3');
  await popup.close();
  await page.evaluate(()=>{window.open=()=>null;});
  await page.getByRole('button',{name:'Present full screen from slide 3',exact:true}).click();
  const fallback=page.getByRole('link',{name:/Open the presentation/});await expect(fallback).toBeVisible();
  expect(await fallback.getAttribute('href')).toMatch(/^blob:/);
  const recoveryPromise=context.waitForEvent('page');await fallback.click();
  const recovery=await recoveryPromise;await recovery.getByRole('button',{name:'Start presentation',exact:true}).click();
  await expect(recovery.locator('#counter')).toHaveText(/^3 \/ /);
  await recovery.locator('#next').click();
  await expect(page.locator('.pr-slide-counter')).toHaveText(/^Slide 4 of /);
  await recovery.close();
});

test('Present restores the selected lesson and slide for each class after navigation', async ({ page }) => {
  test.setTimeout(90000);
  await page.goto(`${preview}&workspace-class=class-a`);
  await openLessonOptions(page);
  await page.getByRole('button', { name: 'Thursday', exact: true }).click();
  await page.getByRole('button', { name: /Explore further 25 min/ }).click();
  await openLessonPreview(page); await nextPreviewSlide(page);
  await openLessonPreview(page); await nextPreviewSlide(page);
  await expect(page.locator('.pr-slide-counter')).toHaveText(/^Slide 3 of /);
  await page.reload();
  await openLessonOptions(page); await openLessonPreview(page);
  await expect(page.getByRole('button', { name: 'Thursday', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: /Explore further 25 min/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.pr-slide-counter')).toHaveText(/^Slide 3 of /);
  await page.goto(`${preview}&workspace-class=class-b`);
  await openLessonOptions(page); await openLessonPreview(page);
  await page.getByRole('button', { name: 'Friday', exact: true }).click();
  await expect(page.locator('.pr-slide-counter')).toHaveText(/^Slide 1 of /);
  await page.goto(`${preview}&workspace-class=class-a`);
  await openLessonOptions(page); await openLessonPreview(page);
  await expect(page.getByRole('button', { name: 'Thursday', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.pr-slide-counter')).toHaveText(/^Slide 3 of /);
});
test('representative slide content fits the stage with answers shown and real fonts loaded',async({page})=>{
  test.setTimeout(180000);await page.setViewportSize({width:1920,height:1080});
  const issues=[];
  for(const cycle of ['cycle-1','cycle-8','cycle-15','cycle-23','cycle-24','cycle-27','boy-assessment']){
    const deck=await deckPage(page,{cycle});
    for(const entry of deck.slideIndex){
      if(entry.index){await page.getByRole('button',{name:'Choose a slide',exact:true}).click();await page.locator(`[data-go-slide="${entry.index}"]`).click();}
      const active=page.locator('.slide.active');
      const reveal=active.locator('[data-reveal-toggle]');if(await reveal.count())await reveal.click();
      await page.evaluate(()=>document.fonts.ready);
      const overflow=await active.evaluate(el=>Array.from(el.querySelectorAll('h1,h2,.p-word,.p-review-card,.p-match-card,.p-picture-card,.p-game-picture,.p-spelling-picture,.p-picture-sentence,.p-build,.p-shared-sentence,.p-compound,.p-chips,.p-answer,.p-paper')).filter(n=>getComputedStyle(n).visibility!=='hidden').flatMap(n=>{const r=n.getBoundingClientRect();const stage=document.querySelector('#stage').getBoundingClientRect();return r.bottom>stage.bottom-95||r.top<stage.top||r.left<stage.left||r.right>stage.right?[{cls:n.className,text:n.textContent.slice(0,60),bottom:r.bottom-stage.top,right:r.right-stage.left}]:[]}));
      if(overflow.length)issues.push({cycle,slide:entry.index+1,overflow});
    }
    if(cycle==='cycle-15'){await jump(page,deck,'p-vocabulary');await page.screenshot({animations:'disabled',path:'.artifacts/present/vocabulary.png'});}
  }
  expect(issues).toEqual([]);
});

test('lesson plan prints privately and assessment/resource choices clear timed lesson controls',async({page})=>{
  await page.goto(preview);await openLessonOptions(page); await page.getByRole('button',{name:/Explore further 25 min/}).click();
  await page.emulateMedia({media:'print'});
  await page.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));
  await expect(page.locator('.pr-print-plan')).toBeVisible();
  await expect(page.locator('.pr-print-plan')).toContainText('25 minutes');
  await expect(page.locator('main[data-teacher-route="present"]')).toBeHidden();
  await page.pdf({path:'.artifacts/app-simplification/teacher/lesson-plan.pdf',format:'A4',printBackground:true});
  await page.evaluate(()=>window.dispatchEvent(new Event('afterprint')));
  await page.emulateMedia({media:'screen'});
  await expect(page.locator('.pr-print-plan')).toBeHidden();
  await page.getByRole('button',{name:'All resources',exact:true}).click();
  await expect(page.getByRole('group',{name:'Lesson length'})).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Print lesson plan',exact:true})).toHaveCount(0);
  await page.getByRole('combobox',{name:'Teaching cycle'}).selectOption('boy-assessment');
  await expect(page.locator('.pr-head')).toContainText('3 slides');
  await expect(page.getByRole('group',{name:'Teaching day'})).toHaveCount(0);
});


test('word pairs teach a mismatch, keep the same cards, complete and reset with keyboard',async({page})=>{
  const deck=await deckPage(page,{cycle:'cycle-8',day:'friday',format:'core'});
  const entry=await jump(page,deck,'p-sight-match');
  const active=page.locator('.slide.active'); const cards=active.locator('[data-match-word]');
  const values=await cards.evaluateAll(items=>items.map(el=>el.dataset.matchWord));
  await expect(active.locator('.p-card-word:visible')).toHaveCount(0);
  const different=values.findIndex(v=>v!==values[0]);
  await cards.nth(0).press('Enter');await cards.nth(different).press('Space');
  await expect(active.locator('[data-match-feedback]')).toContainText('are different');
  await expect(active.locator('.p-card-word:visible')).toHaveCount(2);
  expect(await cards.evaluateAll(items=>items.map(el=>el.dataset.matchWord))).toEqual(values);
  const partner=values.lastIndexOf(values[0]);
  await cards.nth(partner).click();await cards.nth(0).click();
  await expect(active.locator('.is-matched')).toHaveCount(2);
  for(const value of new Set(values.filter(v=>v!==values[0]))) {
    for(let i=0;i<values.length;i++)if(values[i]===value)await cards.nth(i).click();
  }
  await expect(active.locator('[data-match-feedback]')).toContainText('Every pair found');
  await expect(active.locator('.is-matched')).toHaveCount(values.length);
  await active.getByRole('button',{name:'Play again'}).press('Enter');
  await expect(active.locator('.is-matched')).toHaveCount(0);
  await expect(active.locator('.p-card-word:visible')).toHaveCount(0);
  await expect(page.locator('#counter')).toHaveText(`${entry.index+1} / ${deck.slideCount}`);
  await page.screenshot({animations:'disabled',path:'.artifacts/present/sight-word-pairs.png'});
});

test('picture matching gives retry feedback, preserves choices and resets on return',async({page})=>{
  const deck=await deckPage(page,{cycle:'cycle-8',day:'friday',format:'core'});await jump(page,deck,'p-picture-match');
  const active=page.locator('.slide.active');const target=await active.locator('[data-choice-target]').getAttribute('data-choice-target');
  const choices=active.locator('[data-choice-value]');const values=await choices.evaluateAll(items=>items.map(el=>el.dataset.choiceValue));
  await active.locator(`[data-choice-value="${values.find(v=>v!==target)}"]`).press('Enter');
  await expect(active.locator('[data-choice-feedback]')).toContainText('try again');
  expect(await choices.evaluateAll(items=>items.map(el=>el.dataset.choiceValue))).toEqual(values);
  await active.locator(`[data-choice-value="${target}"]`).press('Space');
  await expect(active.locator('.is-correct')).toHaveText(target);
  await expect(active.locator('[data-choice-feedback]')).toContainText('Yes');
  await page.locator('#prev').click();await page.locator('#next').click();
  await expect(active.locator('.is-correct')).toHaveCount(0);await expect(active.locator('[data-choice-value]:disabled')).toHaveCount(0);
  await page.screenshot({animations:'disabled',path:'.artifacts/present/picture-match.png'});
});

test('finger tracing records actual pointer strokes at projector and tablet scales, clears and cancels on navigation',async({page})=>{
  for(const viewport of [{width:1920,height:1080},{width:1024,height:768}]) {
    await page.evaluate(async()=>{if(document.fullscreenElement)await document.exitFullscreen();});
    await page.setViewportSize(viewport);
    const deck=await deckPage(page,{cycle:'cycle-8',day:'friday',format:'review'});await jump(page,deck,'p-writing');
    const svg=page.locator('.slide.active [data-trace-surface]');await expect(svg).toHaveAccessibleName('Finger trace Bb');
    await expect(svg.locator('.p-stroke-start')).not.toHaveCount(0);
    const bounds=await svg.boundingBox();
    const x=bounds.x+bounds.width*0.25, y=bounds.y+bounds.height*0.3;
    await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+40,y+80,{steps:6});await page.mouse.up();
    const path=svg.locator('.p-finger-stroke');await expect(path).toHaveCount(1);
    expect(await path.getAttribute('d')).toContain(' L');
    const start=await path.evaluate(el=>{const p=el.getPointAtLength(0);return {x:p.x,y:p.y};});
    expect(start.x).toBeGreaterThan(0);expect(start.x).toBeLessThan(200);
    await page.getByRole('button',{name:'Clear finger marks'}).press('Enter');await expect(path).toHaveCount(0);
    await page.mouse.move(x,y);await page.mouse.down();await page.locator('#next').evaluate(el=>el.click());
    await page.mouse.move(x+100,y+100);await page.mouse.up();await page.locator('#prev').click();
    await expect(page.locator('.slide.active .p-finger-stroke')).toHaveCount(0);
  }
  await page.screenshot({animations:'disabled',path:'.artifacts/present/finger-trace.png'});
});

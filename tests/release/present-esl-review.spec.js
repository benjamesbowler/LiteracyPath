import {test,expect} from '@playwright/test';
import {buildCyclePresentation} from '../../src/utils/present/presentationBuilder.js';

const artifacts=process.env.LP_PRESENT_ARTIFACT_ROOT||'.artifacts/present-esl-review';
async function openDeck(page,cycle='cycle-9',day='tuesday'){
 const deck=buildCyclePresentation(cycle,{day});
 await page.route('**/present-esl-review-test',route=>route.fulfill({contentType:'text/html',body:deck.html}));
 await page.goto('/present-esl-review-test');await page.locator('#startBtn').click();return deck;
}
async function jump(page,deck,cls){
 const entry=deck.slideIndex.find(slide=>slide.cls===cls);expect(entry,cls).toBeTruthy();
 await page.locator('#overview-toggle').click();await page.locator(`[data-go-slide="${entry.index}"]`).click();return page.locator('.slide.active');
}
function colorKind(color){
 const [r,g,b]=color.match(/[\d.]+/g).slice(0,3).map(Number);
 return r>g*1.4&&r>b*1.2?'incorrect':g>r*1.2&&g>b*1.1?'correct':'neutral';
}
async function outcome(locator,kind){
 await expect(locator).toBeVisible();expect(colorKind(await locator.evaluate(node=>getComputedStyle(node).color))).toBe(kind);
 const typography=await locator.evaluate(node=>{const style=getComputedStyle(node);return {family:style.fontFamily.split(',')[0].replaceAll(/['"]/g,'').trim(),size:parseFloat(style.fontSize),weight:style.fontWeight};});
 expect(typography).toEqual({family:'Andika',size:34,weight:'700'});
 const text=(await locator.innerText()).trim();expect(text).not.toBe('');
 if(kind==='correct')expect(text).toMatch(/✓.*Correct/i);
 if(kind==='incorrect')expect(text).toMatch(/✕.*Try again/i);
}
async function learningFace(locator){return locator.evaluate(node=>getComputedStyle(node).fontFamily.split(',')[0].replaceAll(/['"]/g,'').trim());}
async function fit(active){
 const overflow=await active.evaluate(slide=>{
  const bounds=slide.getBoundingClientRect();
  return [...slide.querySelectorAll('button,img,p,.p-sight,.p-shared-sentence,.p-review-focus,[data-language-choice]')].filter(node=>node.getClientRects().length&&getComputedStyle(node).visibility!=='hidden'&&getComputedStyle(node).position!=='absolute').flatMap(node=>{
   const r=node.getBoundingClientRect();return r.left<bounds.left-2||r.right>bounds.right+2||r.top<bounds.top-2||r.bottom>bounds.bottom+2?[{tag:node.tagName,text:node.textContent.slice(0,70),right:r.right-bounds.right,bottom:r.bottom-bounds.bottom}]:[];
  });
 });
 expect(overflow).toEqual([]);
 for(const control of await active.locator('button:visible').all())expect(await control.evaluate(node=>{const bounds=node.getBoundingClientRect();return document.elementFromPoint(bounds.x+bounds.width/2,bounds.y+bounds.height/2)?.closest('button')===node;})).toBe(true);
}
async function freeze(page){await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));}

for(const viewport of [{name:'laptop',width:1366,height:768},{name:'projector',width:1920,height:1080},{name:'tablet',width:1024,height:768}])test(`kindergarten learning glyphs and large sight-word example render on ${viewport.name}`,async({page})=>{
 await page.setViewportSize(viewport);const deck=await openDeck(page,'cycle-1','thursday'),active=await jump(page,deck,'p-sight-slide');
 const word=active.locator('.p-sight');await expect(word).toHaveText('I');
 const family=await learningFace(word);await page.evaluate(()=>document.fonts.ready);
 expect(await page.evaluate(name=>[...document.fonts].some(face=>face.family.replaceAll(/['"]/g,'')===name&&face.status==='loaded'),family)).toBe(true);
 const example=active.locator('[data-hfw-example]');await expect(example).toBeVisible();
 expect(await learningFace(example)).toBe(family);expect(await example.evaluate(node=>parseFloat(getComputedStyle(node).fontSize))).toBeGreaterThanOrEqual(80);
 await fit(active);await page.screenshot({animations:'disabled',path:`${artifacts}/${viewport.name}-hfw-I-example.png`});
 // Explicit typography specimen: retain the real lesson's loaded learning face
 // and glyph settings, changing only the specimen text for visual inspection.
 const original=await word.innerText();
 const widths=await word.evaluate(node=>{
  node.replaceChildren(...['I','l','1','a','g'].map(glyph=>{const span=document.createElement('span');span.textContent=glyph;span.style.margin='0 18px';return span;}));
  return [...node.children].map(span=>span.getBoundingClientRect().width);
 });
 expect(widths[0]).toBeGreaterThan(widths[1]);
 await fit(active);await page.screenshot({animations:'disabled',path:`${artifacts}/${viewport.name}-glyph-specimen-I-l-1-a-g.png`});
 await word.evaluate((node,text)=>{node.textContent=text;},original);
 const cover=active.locator('[data-memory-toggle]');
 await cover.press('Enter');await expect(word).toBeHidden();await expect(example).toBeHidden();await expect(cover).toHaveText('Uncover and compare');
 await page.screenshot({animations:'disabled',path:`${artifacts}/${viewport.name}-hfw-model-and-example-covered.png`});
 await cover.press('Enter');await expect(word).toBeVisible();await expect(example).toBeVisible();await expect(word).toHaveText(original);
 await cover.press('Enter');await expect(word).toBeHidden();await expect(example).toBeHidden();
 await page.locator('#next').click();await jump(page,deck,'p-sight-slide');
 await expect(word).toBeVisible();await expect(example).toBeVisible();await expect(word).toHaveText(original);
});

test('one loaded kindergarten face covers recaps, spelling tiles, sentence print and mixed words',async({page})=>{
 await page.clock.install();const deck=await openDeck(page,'cycle-9','tuesday');let active=await jump(page,deck,'p-hfw-review');
 const face=await learningFace(active.locator('.p-review-focus'));expect(face).not.toBe('Source Sans 3');
 active=await jump(page,deck,'p-letter-review');expect(await learningFace(active.locator('.p-review-focus'))).toBe(face);
 active=await jump(page,deck,'p-word-build');
 for(const tile of await active.locator('[data-build-part]').all())expect(await learningFace(tile)).toBe(face);
 active=await jump(page,deck,'p-sentence-track');expect(await learningFace(active.locator('[data-track-word]').first())).toBe(face);
 active=await jump(page,deck,'p-sentence-scramble');expect(await learningFace(active.locator('[data-scramble-model]'))).toBe(face);
 await active.locator('[data-scramble-start]').click();await page.clock.fastForward(15000);
 for(const tile of await active.locator('[data-scramble-word]').all())expect(await learningFace(tile)).toBe(face);
 for(const [day,selector] of [['monday','[data-choice-value]'],['wednesday','[data-missing-item]'],['friday','[data-language-choice]'],['friday','[data-match-word] .p-card-word']]){
  await openDeck(page,'cycle-8',day);const learning=page.locator(selector);expect(await learning.count(),`${day}: ${selector}`).toBeGreaterThan(0);
  for(const node of await learning.all())expect(await learningFace(node),selector).toBe(face);
 }
});

test('Detective shows red after an incorrect judgement, green after a correct judgement and clears between pictures',async({page})=>{
 const deck=await openDeck(page,'cycle-9','monday'),active=await jump(page,deck,'p-sentence-detective');
 const rounds=JSON.parse(await active.locator('[data-detective-rounds]').getAttribute('data-detective-rounds')),round=rounds[0],feedback=active.locator('[data-detective-feedback]');
 await outcome(feedback,'neutral');await active.locator(`[data-detective-answer="${round.matches?'no':'yes'}"]`).press('Enter');
 await outcome(feedback,'incorrect');await expect(active.locator('[data-detective-sentence]')).toHaveText(round.sentence);
 await fit(active);await page.screenshot({animations:'disabled',path:`${artifacts}/detective-incorrect-red.png`});
 await active.locator(`[data-detective-answer="${round.matches?'yes':'no'}"]`).press('Enter');await outcome(feedback,'correct');
 await fit(active);await page.screenshot({animations:'disabled',path:`${artifacts}/detective-correct-green.png`});
 await active.locator('[data-detective-next]').click();await outcome(feedback,'neutral');
});

test('sentence construction keeps a red incorrect draft, supports repair to green and resets without stale timing',async({page})=>{
 await page.clock.install();const deck=await openDeck(page),active=await jump(page,deck,'p-sentence-scramble');await freeze(page);
 await active.locator('[data-scramble-start]').click();await page.clock.fastForward(15000);
 const indices=await active.locator('[data-scramble-word]').evaluateAll(nodes=>nodes.map(node=>Number(node.dataset.scrambleWord)).sort((a,b)=>a-b));
 for(const index of [...indices].reverse())await active.locator(`[data-scramble-word="${index}"]`).press('Enter');
 const draft=await active.locator('[data-scramble-placed]').allTextContents();await active.locator('[data-scramble-check]').click();
 await outcome(active.locator('[data-scramble-feedback]'),'incorrect');expect(await active.locator('[data-scramble-placed]').allTextContents()).toEqual(draft);
 await fit(active);await page.screenshot({animations:'disabled',path:`${artifacts}/sentence-order-incorrect-red.png`});
 for(const index of indices)await active.locator(`[data-scramble-placed="${index}"]`).click();
 for(const index of indices)await active.locator(`[data-scramble-word="${index}"]`).click();
 await active.locator('[data-scramble-check]').click();await outcome(active.locator('[data-scramble-feedback]'),'correct');await fit(active);await page.screenshot({animations:'disabled',path:`${artifacts}/sentence-order-correct-green.png`});
 await active.locator('[data-scramble-reset]').click();await outcome(active.locator('[data-scramble-feedback]'),'neutral');
 await page.clock.fastForward(20000);await expect(active.locator('[data-scramble-game]')).toHaveAttribute('data-phase','model');
});

test('spelling and picture labels give red then green while allowing correction and reset',async({page})=>{
 const deck=await openDeck(page,'cycle-8','friday');let active=await jump(page,deck,'p-word-build');
 const parts=JSON.parse(await active.locator('[data-build-target]').getAttribute('data-build-target')),wrongParts=parts.slice(1).concat(parts[0]);expect(wrongParts).not.toEqual(parts);
 for(const part of wrongParts)await active.locator('[data-build-part]:not(:disabled)').filter({hasText:new RegExp(`^${part}$`)}).first().click();
 const draft=await active.locator('.p-build-slot').allTextContents();await active.locator('[data-build-check]').click();await outcome(active.locator('.p-build-feedback'),'incorrect');await fit(active);await page.screenshot({animations:'disabled',path:`${artifacts}/spelling-incorrect-red.png`});expect(await active.locator('.p-build-slot').allTextContents()).toEqual(draft);
 for(let index=0;index<parts.length;index++)await active.locator('[data-build-undo]').click();await outcome(active.locator('.p-build-feedback'),'neutral');
 for(const part of parts)await active.locator('[data-build-part]:not(:disabled)').filter({hasText:new RegExp(`^${part}$`)}).first().press('Enter');
 await active.locator('[data-build-check]').click();await outcome(active.locator('.p-build-feedback'),'correct');await fit(active);await page.screenshot({animations:'disabled',path:`${artifacts}/spelling-correct-green.png`});
 active=await jump(page,deck,'p-picture-match');const game=active.locator('[data-choice-target]'),target=await game.getAttribute('data-choice-target');
 const wrong=active.locator(`[data-choice-value]:not([data-choice-value="${target}"])`).first();await wrong.press('Enter');await outcome(active.locator('[data-choice-feedback]'),'incorrect');await expect(wrong).toBeEnabled();
 await fit(active);await page.screenshot({animations:'disabled',path:`${artifacts}/picture-label-incorrect-red.png`});
 await active.locator(`[data-choice-value="${target}"]`).press('Enter');await outcome(active.locator('[data-choice-feedback]'),'correct');await expect(active.locator('[data-choice-feedback]')).not.toContainText('This is octopus.');await fit(active);await page.screenshot({animations:'disabled',path:`${artifacts}/picture-label-correct-green.png`});
 await jump(page,deck,'p-word-build');active=await jump(page,deck,'p-picture-match');await outcome(active.locator('[data-choice-feedback]'),'neutral');
});

test('sound sort colors a wrong choice red, allows its repair to green and clears Again',async({page})=>{
 const deck=await openDeck(page),active=await jump(page,deck,'p-cooperative-sort'),item=active.locator('[data-sort-item]').first(),group=await item.getAttribute('data-sort-group'),feedback=active.locator('[data-sort-feedback]');
 await item.click();await active.locator(`[data-sort-bin="${group==='0'?'1':'0'}"]`).press('Enter');await outcome(feedback,'incorrect');await expect(item).toBeEnabled();await fit(active);await page.screenshot({animations:'disabled',path:`${artifacts}/sort-incorrect-red.png`});
 await active.locator(`[data-sort-bin="${group}"]`).press('Enter');await outcome(feedback,'correct');await expect(item).toBeDisabled();await fit(active);await page.screenshot({animations:'disabled',path:`${artifacts}/sort-correct-green.png`});
 await active.locator('[data-sort-reset]').click();await outcome(feedback,'neutral');await expect(item).toBeEnabled();
});

test('pairs color a mismatch red for its two-second comparison, preserve green matches and clear Play again',async({page})=>{
 await page.clock.install();const deck=await openDeck(page,'cycle-8','friday'),active=await jump(page,deck,'p-sight-match');await freeze(page);
 const cards=active.locator('[data-match-word]'),values=await cards.evaluateAll(nodes=>nodes.map(node=>node.dataset.matchWord)),other=values.findIndex(value=>value!==values[0]);
 await cards.nth(0).press('Enter');await cards.nth(other).press('Enter');await outcome(active.locator('[data-match-feedback]'),'incorrect');await fit(active);await page.screenshot({animations:'disabled',path:`${artifacts}/pairs-incorrect-red.png`});
 await page.clock.fastForward(1999);await expect(active.locator('.is-open')).toHaveCount(2);await page.clock.runFor(1);await expect(active.locator('.is-open')).toHaveCount(0);await outcome(active.locator('[data-match-feedback]'),'neutral');
 const pair=values.findIndex((value,index)=>index>0&&value===values[0]);await cards.nth(0).press('Enter');await cards.nth(pair).press('Enter');await outcome(active.locator('[data-match-feedback]'),'correct');await expect(active.locator('.is-matched')).toHaveCount(2);await fit(active);await page.screenshot({animations:'disabled',path:`${artifacts}/pairs-correct-green.png`});
 await page.clock.fastForward(3000);await expect(active.locator('.is-matched.is-open')).toHaveCount(2);await active.locator('[data-match-reset]').click();await outcome(active.locator('[data-match-feedback]'),'neutral');await expect(active.locator('.is-matched')).toHaveCount(0);
});

for(const viewport of [{name:'laptop',width:1366,height:768},{name:'projector',width:1920,height:1080},{name:'tablet',width:1024,height:768}])test(`weekly language choices fit and support red/green correction on ${viewport.name}`,async({page})=>{
 await page.setViewportSize(viewport);await openDeck(page,'cycle-19','friday');
 const index=await page.locator('[data-language-choice]').first().evaluate(node=>[...document.querySelectorAll('.slide')].indexOf(node.closest('.slide')));expect(index).toBeGreaterThanOrEqual(0);
 await page.locator('#overview-toggle').click();await page.locator(`[data-go-slide="${index}"]`).click();
 const active=page.locator('.slide.active'),feedback=active.locator('[data-language-feedback]');
 await active.locator('[data-language-choice][data-language-correct="false"]').first().press('Enter');await outcome(feedback,'incorrect');
 await expect(active.locator('[data-language-choice][data-language-correct="true"]').first()).toBeEnabled();await fit(active);await page.screenshot({animations:'disabled',path:`${artifacts}/${viewport.name}-language-incorrect-red.png`});
 await active.locator('[data-language-choice][data-language-correct="true"]').first().press('Enter');await outcome(feedback,'correct');await fit(active);await page.screenshot({animations:'disabled',path:`${artifacts}/${viewport.name}-language-correct-green.png`});
 await page.locator('#next').click();await page.locator('#overview-toggle').click();await page.locator(`[data-go-slide="${index}"]`).click();await outcome(feedback,'neutral');
});

test('daily recap puts taught current-week targets first and changes a familiar picture anchor across days',async({page})=>{
 const deck=await openDeck(page,'cycle-9','thursday');let active=await jump(page,deck,'p-letter-review');
 const sounds=JSON.parse(await active.locator('[data-review-items]').getAttribute('data-review-items'));
 expect(sounds.slice(0,2).map(card=>card.target)).toEqual(['qu','u']);
 await expect(active.locator('.p-review-focus')).toHaveText(sounds[0].text);await active.locator('[data-review-next]').click();await expect(active.locator('.p-review-focus')).toHaveText(sounds[1].text);
 active=await jump(page,deck,'p-hfw-review');const words=JSON.parse(await active.locator('[data-review-items]').getAttribute('data-review-items'));
 expect(words.slice(0,2).map(card=>card.text)).toEqual(['he','me']);expect(words.map(card=>card.text)).not.toContain('she');
 await expect(active.locator('.p-review-focus')).toHaveText('he');await active.locator('[data-review-next]').click();await expect(active.locator('.p-review-focus')).toHaveText('me');
 const pictures=[];
 for(const day of ['monday','tuesday']){
  const lesson=await openDeck(page,'cycle-9',day);active=await jump(page,lesson,'p-letter-review');const cards=JSON.parse(await active.locator('[data-review-items]').getAttribute('data-review-items')),index=cards.findIndex(card=>card.target==='b');expect(index).toBeGreaterThanOrEqual(0);
  for(let turn=0;turn<index;turn++)await active.locator('[data-review-next]').click();
  await expect(active.locator('.p-review-focus')).toHaveText(cards[index].text);const picture=active.locator('[data-review-anchor] img');await expect(picture).toHaveAttribute('src',cards[index].imagePath);await expect.poll(()=>picture.evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
  pictures.push(await picture.getAttribute('src'));await page.screenshot({animations:'disabled',path:`${artifacts}/recap-b-varied-anchor-${day}.png`});
 }
 expect(pictures[0]).not.toBe(pictures[1]);
});

for(const viewport of [{name:'laptop',width:1366,height:768},{name:'projector',width:1920,height:1080},{name:'tablet',width:1024,height:768}])test(`final early and late picture sentences and language rounds fit on ${viewport.name}`,async({page})=>{
 await page.setViewportSize(viewport);
 await page.addInitScript(()=>{window.__earlyBlendAudio=[];const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){const record={src:this.src};window.__earlyBlendAudio.push(record);this.addEventListener('ended',()=>{record.ended=true;},{once:true});return play.call(this);};});
 for(const [cycle,day] of [['cycle-1','monday'],['cycle-27','friday']]){
  const deck=await openDeck(page,cycle,day),readings=deck.slideIndex.filter(slide=>slide.cls==='p-sentence-track'),language=deck.slideIndex.filter(slide=>slide.cls==='p-language');
  expect(readings).toHaveLength(day==='friday'?6:2);expect(language).toHaveLength(day==='friday'?4:2);
  if(cycle==='cycle-1'&&day==='monday'){
   expect(deck.lessonPlan.newGraphemes).toEqual(['a']);expect(deck.lessonPlan.blocks.find(block=>block.id==='recall').minutes).toBe(0);expect(deck.lessonPlan.blocks.find(block=>block.id==='teach').minutes).toBe(7);expect(deck.lessonPlan.blocks.reduce((sum,block)=>sum+block.minutes,0)).toBe(18);
   expect(deck.slideIndex.filter(slide=>['p-blend','p-word-build','p-letter-review','p-hfw-review'].includes(slide.cls))).toHaveLength(0);
   expect(deck.manifest.slides.filter(slide=>slide.construct==='letter-formation').map(slide=>slide.target)).toEqual(['A','a']);
   const sort=await jump(page,deck,'p-cooperative-sort');await expect(sort).toHaveAttribute('data-lesson-block','blend');expect(await sort.locator('[data-sort-bin] > strong').allTextContents()).toEqual(['a','Other sound']);await fit(sort);
   await page.screenshot({animations:'disabled',path:`${artifacts}/final-${viewport.name}-cycle-1-monday-oral-sort.png`});
  }
  for(const [round,entry] of readings.entries()){
   await page.locator('#overview-toggle').click();await page.locator(`[data-go-slide="${entry.index}"]`).click();const active=page.locator('.slide.active');
   await expect(active.locator('[data-track-sentence]')).toHaveText(deck.manifest.slides[entry.index].target);expect(await active.locator('[data-track-sentence]').evaluate(node=>parseFloat(getComputedStyle(node).fontSize))).toBeGreaterThanOrEqual(88);const picture=active.locator('.p-picture-sentence > img');await expect.poll(()=>picture.evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
   await fit(active);await page.screenshot({animations:'disabled',path:`${artifacts}/final-${viewport.name}-${cycle}-${day}-sentence-${round+1}.png`});
  }
  for(const [round,entry] of language.entries()){
   await page.locator('#overview-toggle').click();await page.locator(`[data-go-slide="${entry.index}"]`).click();const active=page.locator('.slide.active');
   const answer=active.locator('[data-language-choice][data-language-correct="true"]'),explanation=await answer.getAttribute('data-language-explanation');
   await answer.press('Enter');await outcome(active.locator('[data-language-feedback]'),'correct');await expect(active.locator('[data-language-feedback]')).toHaveText(`✓ Correct. ${explanation}`);expect(explanation).toContain(deck.manifest.slides[entry.index].target);
   for(const mark of await active.locator('.p-language-mark').all())expect(await mark.evaluate(node=>parseFloat(getComputedStyle(node).fontSize))).toBeGreaterThanOrEqual(128);
   await fit(active);
   await page.screenshot({animations:'disabled',path:`${artifacts}/final-${viewport.name}-${cycle}-${day}-language-${round+1}.png`});
  }
 }
 const tuesday=await openDeck(page,'cycle-1','tuesday'),blend=await jump(page,tuesday,'p-blend');
 await expect(blend.locator('.p-kicker')).toHaveText('Blend two sounds');await expect(blend.locator('[data-blend-word]')).toHaveAttribute('data-blend-word','am');
 const buttons=blend.locator('[data-blend-word] button[data-play]');expect(await buttons.allTextContents()).toEqual(['a','m','am']);await fit(blend);
 for(const button of await buttons.all()){
  const path=await button.getAttribute('data-play'),position=await page.evaluate(()=>window.__earlyBlendAudio.length);expect(path).toBeTruthy();await button.press('Enter');
  await expect.poll(()=>page.evaluate(index=>window.__earlyBlendAudio[index]?.ended,position),{timeout:15000}).toBe(true);expect(await page.evaluate(index=>window.__earlyBlendAudio[index].src,position)).toBe(new URL(path,page.url()).href);
 }
 await page.screenshot({animations:'disabled',path:`${artifacts}/final-${viewport.name}-cycle-1-tuesday-vc-blend.png`});
});

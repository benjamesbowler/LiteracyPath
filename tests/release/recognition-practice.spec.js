import { test, expect } from '@playwright/test';
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { SENTENCE_FIX } from '../../src/data/learnGamesData.js';
const scope='literacy-guide-learn-games:fullscreen-overlay-preview';
const result=(page,game)=>page.evaluate(({scope,game})=>JSON.parse(localStorage.getItem(scope)||'{}').games?.[game],{scope,game});
async function open(page,game,difficulty='easy') { await page.goto(`/preview/game-overlay.html?game=${game}&difficulty=${difficulty}&sound=0&music=0`);await expect(page.locator('.pp-play')).toBeVisible(); }
async function place(page,piece,slot,drag=false) {
 if(drag){await slot.scrollIntoViewIfNeeded();const a=await piece.boundingBox(),b=await slot.boundingBox();await page.mouse.move(a.x+a.width/2,a.y+a.height/2);await page.mouse.down();await page.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:10});await page.mouse.up();}
 else {await piece.click();await slot.click();}
}
for(const difficulty of ['easy','medium','hard']) {
 test(`${difficulty} construction activates every assembled object without a confirmation gate`,async({page})=>{
  test.setTimeout(150000);await open(page,'cvc-word-builder',difficulty);const total=Number((await page.locator('.pp-progress').textContent()).split('/')[1]);
  for(let round=0;round<total;round++){
   await expect(page.locator('.pp-progress')).toHaveText(`${round}/${total}`);
   await expect(page.locator('.pp-slot').first()).toBeEnabled();
   const tiles=await page.locator('[data-tile-id]').evaluateAll(es=>es.filter(e=>!e.dataset.tileId.startsWith('decoy')).map(e=>({id:e.dataset.tileId,text:e.textContent})));
   tiles.sort((a,b)=>Number(a.id.match(/(\d+)$/)?.[1])-Number(b.id.match(/(\d+)$/)?.[1]));
   if(!round){const wrong=page.locator('[data-tile-id^="decoy"]').first();if(await wrong.count()){await place(page,wrong,page.locator('.pp-slot').first());await expect(page.locator('.pp-local-feedback')).toBeVisible();}}
   for(let i=0;i<tiles.length;i++)await place(page,page.locator(`[data-tile-id="${tiles[i].id}"]`),page.locator('.pp-slot').nth(i),i===0);
   await expect(page.locator('.pp-workshop-world')).toHaveClass(/is-built/);
   await expect(page.locator('.pp-slot.is-filled')).toHaveCount(tiles.length);
   if(round+1<total)await expect(page.locator('.pp-workshop-world')).not.toHaveClass(/is-built/);
  }
  await expect.poll(async()=>(await result(page,'cvc-word-builder'))?.plays).toBe(1);
 });
 test(`${difficulty} blend town builds three objects per family with a reusable rime`,async({page})=>{
  test.setTimeout(150000);await open(page,'blend-and-build',difficulty);const total=Number((await page.locator('.pp-progress').textContent()).split('/')[1]);
  for(let family=0;family<total;family++) {
   await expect(page.locator('.pp-onset-socket')).toBeEnabled();const rime=await page.locator('.pp-rime').textContent();
   for(let n=0;n<3;n++){
    const target=(await page.locator('.pp-prompt').textContent()).replace(/^Build /,'');
    const onset=target.slice(0,-rime.length);
    await place(page,page.locator('.pp-piece-bank button').getByText(onset,{exact:true}),page.locator('.pp-onset-socket'),n===0);
    await expect(page.locator('.pp-family-house')).toHaveCount(n+1);
   }
   if(family+1<total){await expect(page.locator('.pp-family-house')).toHaveCount(0);}
  }
  await expect.poll(async()=>(await result(page,'blend-and-build'))?.plays).toBe(1);
 });
 test(`${difficulty} memory preserves physical card positions and automatically completes all boards`,async({page})=>{
  test.setTimeout(90000);await open(page,'sight-word-memory',difficulty);const total=Number((await page.locator('.pp-progress').textContent()).split('/')[1]);let matched=0;
  while(matched<total){
   await expect(page.locator('.pp-memory-card:not(:disabled)').first()).toBeEnabled();
   const ids=[...new Set(await page.locator('.pp-memory-card').evaluateAll(es=>es.map(e=>e.dataset.pairId)))];
   const before=await page.locator('.pp-memory-card').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {id:e.dataset.cardId,x:r.x,y:r.y};}));
   for(const id of ids){const pair=page.locator(`.pp-memory-card[data-pair-id="${id}"]`);await pair.first().click();await pair.first().click();await expect(pair.first()).toBeEnabled();await pair.last().click();matched++;await expect(pair.first()).toBeDisabled();await expect(pair.last()).toBeDisabled();if(id!==ids.at(-1)){const after=await page.locator('.pp-memory-card').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {id:e.dataset.cardId,x:r.x,y:r.y};}));expect(after).toEqual(before);}}
  }
  await expect.poll(async()=>(await result(page,'sight-word-memory'))?.plays).toBe(1);
 });
 test(`${difficulty} moving word targets accept direct pops and preserve first mistakes`,async({page})=>{
  test.setTimeout(90000);await open(page,'pop-the-word',difficulty);const total=Number((await page.locator('.pp-progress').textContent()).split('/')[1]);
  for(let round=0;round<total;round++){
   await expect(page.locator('.pp-word-balloon').first()).toBeEnabled();
   const target=(await page.locator('.pp-prompt').textContent()).replace('Pop ','');
   if(!round){await page.locator('.pp-word-balloon').filter({hasNotText:new RegExp(`^${target}$`)}).first().click();await expect(page.locator('.pp-local-feedback')).toBeVisible();}
   await page.locator('.pp-word-balloon').getByText(target,{exact:true}).click();await expect(page.locator('.pp-progress')).toHaveText(`${round+1}/${total}`);
   if(round+1<total)await expect(page.locator('.pp-word-balloon').first()).toBeEnabled();
  }
  await expect.poll(async()=>(await result(page,'pop-the-word'))?.plays).toBe(1);
  const saved=await result(page,'pop-the-word');expect(saved.practiceRecord.completions[0].steps[0].correct).toBe(false);expect(saved.practiceRecord.completions[0].assistedRetries).toHaveLength(1);
 });
 test(`${difficulty} hopscotch lands on each chosen word and extends the course across sentences`,async({page})=>{
  test.setTimeout(180000);await open(page,'word-hopscotch',difficulty);const total=Number((await page.locator('.pp-progress').textContent()).split('/')[1]);let previousX=0;
  for(let round=0;round<total;round++){
   await expect(page.locator('.pp-hop-stone:not(:disabled)').first()).toBeEnabled();const sentence=await page.locator('.pp-prompt').textContent();const words=sentence.replace(/[.?!]/g,'').split(/\s+/);
   for(let i=0;i<words.length;i++){
    const stone=page.locator('.pp-hop-stone:not(:disabled)').getByText(words[i],{exact:true});await expect(stone).toBeVisible();const id=await stone.getAttribute('data-stone-id');const x=Number(await stone.getAttribute('data-world-x'));expect(x).toBeGreaterThan(previousX);
    await stone.click();await expect(page.locator(`[data-stone-id="${id}"]`)).toHaveClass(/is-reached/);expect(await page.locator('.pp-prompt').evaluate(e=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));})).toBe(true);previousX=x;
   }
   if(round+1<total)await expect(page.locator('.pp-prompt')).not.toHaveText(sentence);
  }
  await expect.poll(async()=>(await result(page,'word-hopscotch'))?.plays).toBe(1);
 });
 test(`${difficulty} direct repair opens each district gate and retains repaired signs`,async({page})=>{
  test.setTimeout(120000);await open(page,'reading-race',difficulty);const total=Number((await page.locator('.pp-progress').textContent()).split('/')[1]);
  for(let round=0;round<total;round++){
   const sign=page.locator(`.pp-repair-sign[data-sign-index="${round}"]`);await expect(sign.locator('button')).toBeEnabled();const display=(await sign.textContent()).replace('…','___');const fix=SENTENCE_FIX[difficulty].find(f=>f.display===display);expect(fix).toBeTruthy();
   const answer=fix.acceptedAnswers?.at(-1)||fix.answer;
   await place(page,page.locator('.pp-piece-bank button').getByText(answer,{exact:true}),sign.locator('button'),true);
   await expect(sign.locator('button')).toHaveText(answer);await expect(sign.locator('..')).toHaveClass(/is-repaired/);
   if(round+1<total)await expect(page.locator(`.pp-repair-sign[data-sign-index="${round+1}"]`)).toBeVisible();
  }
  await expect.poll(async()=>(await result(page,'reading-race'))?.plays).toBe(1);
 });
}
for(const viewport of [{width:568,height:320},{width:390,height:844},{width:1024,height:768}])test(`six phonics control bounds ${viewport.width}`,async({page})=>{
 test.setTimeout(120000);await page.setViewportSize(viewport);
 for(const [game,selector] of [['cvc-word-builder','.pp-slot,.pp-piece-bank button'],['blend-and-build','.pp-onset-socket,.pp-piece-bank button'],['sight-word-memory','.pp-memory-card'],['pop-the-word','.pp-word-balloon'],['word-hopscotch','.pp-hop-stone:not(:disabled)'],['reading-race','.pp-repair-socket,.pp-piece-bank button']]){
  await open(page,game,'hard');await page.waitForTimeout(350);
  const boxes=await page.locator(selector).evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,hit:e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))};}));
  for(const b of boxes){expect(b.w,game).toBeGreaterThanOrEqual(55.9);expect(b.h,game).toBeGreaterThanOrEqual(55.9);expect(b.x,game).toBeGreaterThanOrEqual(-.1);expect(b.y,game).toBeGreaterThanOrEqual(-.1);expect(b.x+b.w,game).toBeLessThanOrEqual(viewport.width+.1);expect(b.y+b.h,game).toBeLessThanOrEqual(viewport.height+.1);expect(b.hit,game).toBe(true);}
 }
});
test('paused memory mismatch preserves both revealed cards until play resumes',async({page})=>{
 await open(page,'sight-word-memory');const cards=page.locator('.pp-memory-card');const ids=await cards.evaluateAll(es=>es.map(e=>e.dataset.pairId));await cards.first().click();await cards.nth(ids.findIndex(id=>id!==ids[0])).click();
 await page.getByRole('button',{name:'Close Sight Word Memory',exact:true}).click();await expect(page.getByRole('alertdialog')).toBeVisible();await page.waitForTimeout(1400);await expect(page.locator('.pp-memory-card.is-revealed')).toHaveCount(2);
 await page.getByRole('button',{name:'Keep playing',exact:true}).click();await expect(page.locator('.pp-memory-card.is-revealed')).toHaveCount(0);
});
test('failed recorded cue leaves a playable printed word target without synthetic speech',async({page})=>{
 await page.addInitScript(()=>{HTMLMediaElement.prototype.play=function(){return Promise.reject(new Error('offline audio'));};window.syntheticCalls=0;window.speechSynthesis.speak=()=>{window.syntheticCalls++;};});
 await page.goto('/preview/game-overlay.html?game=pop-the-word&sound=1&music=0');await expect(page.locator('.pp-prompt')).toHaveText(/^Pop (?!the word you hear)/);const target=(await page.locator('.pp-prompt').textContent()).replace('Pop ','');await page.locator('.pp-word-balloon').getByText(target,{exact:true}).click();await expect(page.locator('.pp-progress')).toHaveText('1/6');expect(await page.evaluate(()=>window.syntheticCalls)).toBe(0);
});
test('keyboard pieces, cancelled drags and wrong hop landings preserve progress',async({page})=>{
 await open(page,'cvc-word-builder');const tile=page.locator('[data-tile-id]:not([data-tile-id^="decoy"])').first();const tileId=await tile.getAttribute('data-tile-id');const index=Number(tileId.match(/(\d+)$/)[1]);const slot=page.locator('.pp-slot').nth(index);
 const a=await tile.boundingBox();await page.mouse.move(a.x+a.width/2,a.y+a.height/2);await page.mouse.down();await page.mouse.move(a.x+40,a.y-45,{steps:5});await expect(page.locator('.pp-drag-piece')).toBeVisible();await tile.dispatchEvent('pointercancel');await page.mouse.up();await expect(page.locator('.pp-drag-piece')).toHaveCount(0);await expect(page.locator('.pp-slot.is-filled')).toHaveCount(0);
 await tile.focus();await page.keyboard.press('Enter');await slot.focus();await page.keyboard.press('Enter');await expect(slot).toHaveClass(/is-filled/);
 await open(page,'word-hopscotch');const target=(await page.locator('.pp-prompt').textContent()).split(' ')[0];const hero=page.locator('.pp-hop-course .pp-hero');const before=await hero.evaluate(e=>e.style.left);await page.locator('.pp-hop-stone:not(:disabled)').filter({hasNotText:new RegExp(`^${target}$`)}).click();await expect(page.locator('.pp-local-feedback')).toBeVisible();await expect.poll(()=>hero.evaluate(e=>e.style.left)).toBe(before);await expect(page.locator('.pp-hop-stone.is-reached')).toHaveCount(0);
});
test('keyboard target stays still and a replay saves a separate completion exactly once',async({page})=>{
 test.setTimeout(90000);await open(page,'pop-the-word');
 for(let run=0;run<2;run++){
  for(let round=0;round<6;round++){
   await expect(page.locator('.pp-word-balloon').first()).toBeEnabled();const target=(await page.locator('.pp-prompt').textContent()).replace('Pop ','');const button=page.locator('.pp-word-balloon').getByText(target,{exact:true});
   if(!round){await button.focus();await page.keyboard.down('Space');const before=await button.boundingBox();await page.waitForTimeout(350);expect(await button.boundingBox()).toEqual(before);await page.keyboard.up('Space');}else await button.click();
   await expect(page.locator('.pp-progress')).toHaveText(`${round+1}/6`);
  }
  await expect.poll(async()=>(await result(page,'pop-the-word'))?.plays).toBe(run+1);
  if(!run){await page.getByRole('button',{name:'Play again',exact:true}).click();await expect(page.locator('.pp-progress')).toHaveText('0/6');}
 }
 const saved=await result(page,'pop-the-word');expect(saved.practiceRecord.completions).toHaveLength(2);expect(saved.practiceRecord.completions.every(c=>c.steps.every(s=>s.independent===false))).toBe(true);
});
test('all six games restore their generated identity and physical work without awarding it twice',async({page})=>{
 test.setTimeout(150000);
 const snapshot=()=>page.evaluate(()=>{const key=Object.keys(localStorage).find(k=>k.startsWith('literacy-guide-phonics-play:'));return key?JSON.parse(localStorage.getItem(key)):null;});
 for(const game of ['cvc-word-builder','blend-and-build','sight-word-memory','pop-the-word','word-hopscotch','reading-race']){
  await page.goto('/');await page.evaluate(()=>localStorage.clear());await open(page,game);
  if(game==='cvc-word-builder'){
   const tile=page.locator('[data-tile-id]:not([data-tile-id^="decoy"])').first();const index=Number((await tile.getAttribute('data-tile-id')).match(/(\d+)$/)[1]);await place(page,tile,page.locator('.pp-slot').nth(index));
  }else if(game==='blend-and-build'){
   const rime=await page.locator('.pp-rime').textContent(),word=(await page.locator('.pp-prompt').textContent()).replace('Build ','');await place(page,page.locator('.pp-piece-bank button').getByText(word.slice(0,-rime.length),{exact:true}),page.locator('.pp-onset-socket'));
  }else if(game==='sight-word-memory'){
   const id=await page.locator('.pp-memory-card').first().getAttribute('data-pair-id');const pair=page.locator(`[data-pair-id="${id}"]`);await pair.first().click();await pair.last().click();
  }else if(game==='pop-the-word'){
   const target=(await page.locator('.pp-prompt').textContent()).replace('Pop ','');await page.locator('.pp-word-balloon').getByText(target,{exact:true}).click();await page.getByRole('button',{name:'Close Pop the Word',exact:true}).click();
  }else if(game==='word-hopscotch'){
   const word=(await page.locator('.pp-prompt').textContent()).split(' ')[0];await page.locator('.pp-hop-stone:not(:disabled)').getByText(word,{exact:true}).click();await expect(page.locator('.pp-hop-stone.is-reached')).toHaveCount(1);
  }else{
   const display=(await page.locator('.pp-repair-sign').textContent()).replace('…','___'),fix=SENTENCE_FIX.easy.find(f=>f.display===display);await place(page,page.locator('.pp-piece-bank button').getByText(fix.answer,{exact:true}),page.locator('.pp-repair-socket'));await page.getByRole('button',{name:/^Close /}).click();
  }
  const before=await snapshot();expect(before.stage.data).toBeTruthy();await page.reload();await expect(page.locator('.pp-play')).toBeVisible();const after=await snapshot();expect(after.gameState).toEqual(before.gameState);expect(after.score).toEqual(before.score);expect(after.correct).toEqual(before.correct);expect(after.evidence).toEqual(before.evidence);
  if(game==='cvc-word-builder')await expect(page.locator('.pp-slot.is-filled')).toHaveCount(1);
  if(game==='blend-and-build')await expect(page.locator('.pp-family-house')).toHaveCount(1);
  if(game==='sight-word-memory')await expect(page.locator('.pp-memory-card.is-matched')).toHaveCount(2);
  if(game==='word-hopscotch')expect(after.stage.data.hero).toEqual(before.stage.data.hero);
  if(game==='pop-the-word'||game==='reading-race'){await expect.poll(async()=>(await snapshot()).round).toBe(1);expect((await snapshot()).score).toBe(before.score);expect((await snapshot()).correct).toBe(1);}
 }
});

test('completion-only engines announce replay explicitly and duplicate completion callbacks save once',async({page})=>{
 const file=`.artifacts/g10-legacy-fixture-${randomUUID()}.js`;
 await mkdir('.artifacts',{recursive:true});
 await writeFile(file,`
import React from 'react';
export default function Fixture({onComplete,onSessionStart}) {
 const [completed,setCompleted]=React.useState(false);
 return React.createElement('button',{onClick:()=>{
  if(completed){onSessionStart();setCompleted(false);}else{onComplete(1,10,1);onComplete(1,10,1);setCompleted(true);}
 }},completed?'Replay fixture':'Complete fixture run');
}`);
 try {
  await page.route('**/src/components/learn/games/games/WordRescue.jsx*',route=>route.fulfill({contentType:'application/javascript',body:`export {default} from "/${file}";`}));
  await page.goto('/preview/game-overlay.html?game=word-rescue&sound=0&music=0');
  for(let i=1;i<=2;i++) {
   await page.getByRole('button',{name:'Complete fixture run'}).click();
   expect((await result(page,'word-rescue')).plays).toBe(i);
   await page.getByRole('button',{name:'Replay fixture'}).click();
  }
 } finally { await unlink(file); }
});
test('a cleared host checkpoint discards old partial construction work',async({page})=>{
 await open(page,'cvc-word-builder');const tile=page.locator('[data-tile-id]:not([data-tile-id^="decoy"])').first(),index=Number((await tile.getAttribute('data-tile-id')).match(/(\d+)$/)[1]);await place(page,tile,page.locator('.pp-slot').nth(index));await expect(page.locator('.pp-slot.is-filled')).toHaveCount(1);
 // Simulate the existing host action that clears its checkpoint before mounting.
 await page.evaluate(({scope})=>{const data=JSON.parse(localStorage.getItem(scope));delete data.games['cvc-word-builder'].checkpoints.easy;localStorage.setItem(scope,JSON.stringify(data));},{scope});await page.reload();await expect(page.locator('.pp-slot.is-filled')).toHaveCount(0);await expect(page.locator('.pp-progress')).toHaveText('0/6');
});
test.describe('touch input',()=>{
 test.use({hasTouch:true,viewport:{width:568,height:320}});
 test('all six short-landscape games accept touch directly and leave the next target reachable',async({page})=>{
  test.setTimeout(90000);
  for(const game of ['cvc-word-builder','blend-and-build','sight-word-memory','pop-the-word','word-hopscotch','reading-race']){
   await open(page,game);
   if(game==='cvc-word-builder'){const tile=page.locator('[data-tile-id]:not([data-tile-id^="decoy"])').first(),i=Number((await tile.getAttribute('data-tile-id')).match(/(\d+)$/)[1]);await tile.tap();await page.locator('.pp-slot').nth(i).tap();await expect(page.locator('.pp-slot.is-filled')).toHaveCount(1);}
   else if(game==='blend-and-build'){const rime=await page.locator('.pp-rime').textContent(),word=(await page.locator('.pp-prompt').textContent()).replace('Build ','');await page.locator('.pp-piece-bank button').getByText(word.slice(0,-rime.length),{exact:true}).tap();await page.locator('.pp-onset-socket').tap();await expect(page.locator('.pp-family-house')).toHaveCount(1);}
   else if(game==='sight-word-memory'){const id=await page.locator('.pp-memory-card').first().getAttribute('data-pair-id'),pair=page.locator(`[data-pair-id="${id}"]`);await pair.first().tap();await pair.last().tap();await expect(page.locator('.pp-memory-card.is-matched')).toHaveCount(2);}
   else if(game==='pop-the-word'){const word=(await page.locator('.pp-prompt').textContent()).replace('Pop ','');await page.locator('.pp-word-balloon').getByText(word,{exact:true}).tap();await expect(page.locator('.pp-progress')).toHaveText('1/6');await expect(page.locator('.pp-word-balloon').first()).toBeEnabled();}
   else if(game==='word-hopscotch'){const word=(await page.locator('.pp-prompt').textContent()).split(' ')[0];await page.locator('.pp-hop-stone:not(:disabled)').getByText(word,{exact:true}).tap();await expect(page.locator('.pp-hop-stone.is-reached')).toHaveCount(1);const hero=await page.locator('.pp-hop-course .pp-hero').boundingBox(),world=await page.locator('.pp-hop-world').boundingBox();expect(hero.y).toBeGreaterThanOrEqual(world.y);expect(hero.y+hero.height).toBeLessThanOrEqual(world.y+world.height);}
   else{const display=(await page.locator('.pp-repair-sign').textContent()).replace('…','___'),fix=SENTENCE_FIX.easy.find(f=>f.display===display);await page.locator('.pp-piece-bank button').getByText(fix.answer,{exact:true}).tap();await page.locator('.pp-repair-socket').tap();await expect(page.locator('.pp-progress')).toHaveText('1/6');}
   const selector=game==='sight-word-memory'?'.pp-memory-card:not(:disabled)':game==='word-hopscotch'?'.pp-hop-stone:not(:disabled)':game==='pop-the-word'?'.pp-word-balloon:not(:disabled)':'.pp-piece-bank button:not(:disabled)';
   for(const button of await page.locator(selector).all())expect(await button.evaluate(e=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}),game).toBe(true);
  }
 });
});

import fs from 'node:fs';
import {expect,test} from '@playwright/test';
import {getLetterLeapEncodingPlans,getLetterLeapPictureCue} from '../../src/data/letterLeapEncodingContent.js';
import {buildLetterLeapRounds} from '../../src/components/learn/games/games/letterLeapLearning.js';
import {driveLeap,leapCheckpoint,leapMotion} from './letterLeapNative.js';

test.use({trace:'off'});
const progressKey='literacy-guide-learn-games:fullscreen-overlay-preview';
const firstRound=difficulty=>buildLetterLeapRounds(getLetterLeapEncodingPlans(difficulty,3),difficulty,3,0,{pictureCue:getLetterLeapPictureCue})[0];
async function open(page,difficulty='easy',sound=1){
 await page.addInitScript(({difficulty,progressKey})=>{if(!localStorage.getItem(progressKey))localStorage.setItem(progressKey,JSON.stringify({games:{'letter-leap':{checkpoints:{[difficulty]:{level:0,totalLevels:10,sessionSeed:3,chapter:0}}}}}));},{difficulty,progressKey});
 await page.goto(`/preview/game-overlay.html?game=letter-leap&difficulty=${difficulty}&sound=${sound}&music=0`,{waitUntil:'domcontentloaded'});
 await page.getByRole('button',{name:'Continue',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('.letter-leap')?.__letterLeapMotion?.().running);
 await page.locator('.lg-game-player-main').focus();
}
function retain(testInfo,proof){fs.writeFileSync(testInfo.outputPath('proof.json'),JSON.stringify(proof,null,2));}

for(const missing of ['picture','audio']){
 test(`Letter Leap ${missing} failure stays playable with truthful response delivery`,async({page},testInfo)=>{
  test.setTimeout(30000);
  const round=firstRound('easy'),blocked=missing==='picture'?round.pictures:[round.audio],errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/*',route=>blocked.includes(new URL(route.request().url()).pathname)?route.abort('failed'):route.continue());
  await open(page);
  await expect.poll(async()=>{
   const cue=(await leapMotion(page)).cue;
   return [cue.delivery,cue.pictureDelivery];
  },{intervals:[100]}).toEqual(missing==='picture'?['delivered','unavailable']:['unavailable','delivered']);
  const before=await leapCheckpoint(page);
  expect(await page.locator('[data-ll="word"]').innerText()).not.toContain(before.word);
  await driveLeap(page,{timeout:12000,until:s=>s.letterIndex===1});
  const response=(await leapCheckpoint(page)).learning.firstResponses[0];
  expect(response.correct).toBe(true);
  expect(response.supportReasons).toContain(`${missing}-unavailable`);
  expect(response.independentEncodingPractice).toBe(false);
  expect(response.wordVisible).toBe(false);
  if(missing==='picture')expect(response.deliveryReceipt.source).toBe(round.audio);
  else expect(response.pictureReceipt.source).toBe(round.pictures[0]);
  expect(errors).toEqual([]);
  await page.screenshot({path:testInfo.outputPath(`${missing}-unavailable-supported-contact.png`)});
  retain(testInfo,{missing,blocked,response,errors});
 });
}

for(const [difficulty,character] of [['easy','bouncy'],['medium','chompy'],['hard','pip']]){
 test(`Letter Leap all-art-unavailable ${difficulty} keeps canonical identity, native jump and Tools`,async({page},testInfo)=>{
  test.setTimeout(35000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',route=>{
   const url=route.request().url();
   return /\.(png|webp)(\?|$)/.test(url)&&(/\/game-assets\/physical-arcade\//.test(url)||/\/game-assets\/sound-seekers\/v3\/cast\//.test(url))
    ?route.abort('failed'):route.continue();
  });
  await open(page,difficulty);
  await expect.poll(async()=>(await leapCheckpoint(page)).authoredArt.hero.representation).toBe('procedural-art-unavailable');
  const initial=await leapCheckpoint(page);
  expect(initial.authoredArt.hero.delivered).toBe(false);
  expect(initial.authoredArt.hero.recovery.character).toBe(character);
  expect(Object.values(initial.authoredArt.delivery.hero).every(value=>value==='unavailable')).toBe(true);
  await page.screenshot({path:testInfo.outputPath('canonical-final-recovery-opening.png')});
  await page.keyboard.down('ArrowRight');await page.keyboard.down('ArrowUp');await page.waitForTimeout(150);
  await page.keyboard.up('ArrowUp');await page.keyboard.up('ArrowRight');
  const jumped=await leapCheckpoint(page);expect(jumped.player.onGround).toBe(false);expect(jumped.player.y).toBeLessThan(initial.player.y);
  await page.screenshot({path:testInfo.outputPath('canonical-final-recovery-native-jump.png')});
  await page.getByRole('button',{name:'Open game controls',exact:true}).click();const paused=await leapMotion(page);
  await page.waitForTimeout(180);expect((await leapMotion(page)).player.x).toBe(paused.player.x);
  await page.keyboard.press('Escape');await expect.poll(async()=>(await leapMotion(page)).paused).toBe(false);
  expect(errors).toEqual([]);
  retain(testInfo,{difficulty,character,initialArt:initial.authoredArt,jump:jumped.player,paused:paused.player,errors});
 });
}

test('Letter Leap quota recovery holds and retries the exact accepted prefix without losing scoped progress',async({page},testInfo)=>{
 test.setTimeout(40000);
 await open(page);
 await page.waitForFunction(()=>document.querySelector('.letter-leap').__letterLeapMotion().cue.delivery==='delivered');
 await page.evaluate(progressKey=>{
  window.__letterLeapQuotaFail=true;
  const original=Storage.prototype.setItem;
  Storage.prototype.setItem=function(key,value){
   if(key===progressKey&&window.__letterLeapQuotaFail){
    const session=JSON.parse(value)?.games?.['letter-leap']?.practiceSession?.easy;
    if(session?.slot>=1)throw new DOMException('Test device storage is full','QuotaExceededError');
   }
   return original.call(this,key,value);
  };
 },progressKey);
 // A real accepted collision grows the scoped save. The injected failure only
 // rejects storage; it never changes the controller, answer or held snapshot.
 await page.keyboard.down('ArrowRight');
 await expect(page.getByRole('button',{name:'Retry save',exact:true})).toBeVisible();await page.keyboard.up('ArrowRight');
 const held=await leapCheckpoint(page);expect(held.saveHeld).toBe(true);expect(held.letterIndex).toBe(1);
 await page.waitForTimeout(180);const heldAgain=await leapCheckpoint(page);
 expect(heldAgain.player).toEqual(held.player);expect(heldAgain.learning.firstResponses).toEqual(held.learning.firstResponses);
 expect(heldAgain.learning.acceptedResponses).toEqual(held.learning.acceptedResponses);
 await page.screenshot({path:testInfo.outputPath('exact-prefix-save-held.png')});
 await page.evaluate(()=>{window.__letterLeapQuotaFail=false;});await page.getByRole('button',{name:'Retry save',exact:true}).click();
 await expect.poll(async()=>(await leapMotion(page)).saveHeld).toBe(false);
 const restored=await leapCheckpoint(page),saved=await page.evaluate(progressKey=>JSON.parse(localStorage.getItem(progressKey)).games['letter-leap'].practiceSession.easy,progressKey);
 expect(restored.learning.firstResponses).toEqual(held.learning.firstResponses);
 expect(saved.evidence.acceptedResponses).toEqual(held.learning.acceptedResponses);
 expect(saved.slot).toBe(1);expect(restored.wordsDone).toBe(0);
 await page.reload();await page.getByRole('button',{name:'Continue',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('.letter-leap')?.__letterLeapMotion?.().letterIndex===1);
 const resumed=await leapCheckpoint(page);expect(resumed.learning.acceptedResponses).toEqual(held.learning.acceptedResponses);
 expect(resumed.bubbles.map(({x,y,ch,taken})=>({x,y,ch,taken}))).toEqual(restored.bubbles.map(({x,y,ch,taken})=>({x,y,ch,taken})));
 await page.screenshot({path:testInfo.outputPath('exact-prefix-save-reloaded.png')});
 retain(testInfo,{heldPrefix:held.learning.acceptedResponses,restoredPrefix:restored.learning.acceptedResponses,resumedPrefix:resumed.learning.acceptedResponses,savedSlot:saved.slot});
});

test('Letter Leap reduced-motion and muted touch play keep target hidden, then real visibility pause releases held input',async({page},testInfo)=>{
 test.setTimeout(30000);await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:390,height:844});await open(page,'easy',0);
 await expect(page.getByRole('button',{name:'Hear the word',exact:true})).toBeHidden();
 const initial=await leapCheckpoint(page);expect(await page.locator('[data-ll="word"]').innerText()).not.toContain(initial.word);
 const right=page.locator('[data-ll="right"]'),box=await right.boundingBox();expect(box.width).toBeGreaterThanOrEqual(56);expect(box.height).toBeGreaterThanOrEqual(56);
 await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.waitForTimeout(200);await page.mouse.up();
 const moved=await leapMotion(page);expect(moved.player.x).toBeGreaterThan(initial.player.x);
 await page.locator('.lg-game-player-main').focus();await page.keyboard.down('ArrowRight');
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
 const paused=await leapMotion(page);await page.waitForTimeout(150);expect((await leapMotion(page)).player.x).toBe(paused.player.x);
 await page.keyboard.up('ArrowRight');await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'));});
 await page.waitForTimeout(160);const resumed=await leapMotion(page);expect(resumed.player.vx).toBe(0);
 await page.screenshot({path:testInfo.outputPath('reduced-muted-resumed.png')});retain(testInfo,{initialPlayer:initial.player,moved:moved.player,paused:paused.player,resumed:resumed.player,cue:resumed.cue});
});

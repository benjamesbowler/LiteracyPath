import { expect } from '@playwright/test';
import { wordStartsWithTargetSound } from '../../src/utils/rocketRunRounds.js';
export async function openClimb(page,difficulty='easy',sound=0){
 const source=await(await page.request.get('/src/components/learn/games/games/WordClimbGame.jsx')).text();expect(source).toContain('onRequestNextLevel');expect(source).toContain('advanceClimbJourney');
 await page.goto(`/preview/game-overlay.html?game=word-climb&difficulty=${difficulty}&sound=${sound}&music=0`);
 await expect(page.locator('[data-wc-scene="ready"]')).toBeVisible();return page.locator('.word-climb');
}
// Drives the public DOM keyboard controls against visible position and authored
// obstacle locations. No state, score, clock, speed or collision is overridden.
export async function climbToStation(page,limit=60000){
 await page.locator('.word-climb').focus();
 return page.evaluate(async limit=>{
  const game=document.querySelector('.word-climb');
  let held='',lastSample=0;const samples=[];const key=(type,value)=>game.dispatchEvent(new KeyboardEvent(type,{key:value,bubbles:true}));
  const saved=()=>{for(const k of Object.keys(localStorage)){if(k.startsWith('literacy-guide-word-climb:')){const s=JSON.parse(localStorage.getItem(k));if(s?.world?.journey)return s;}}return null;};
  const deadline=performance.now()+limit;
  while(!saved()&&performance.now()<deadline)await new Promise(r=>setTimeout(r,50));
  const obstacles=saved()?.world.journey.obstacles;if(!obstacles)throw Error('No authored route snapshot');
  key('keydown','ArrowUp');
  try{while(game.dataset.journeyPhase==='climb'&&performance.now()<deadline){
   if(!game.isConnected)throw Error('Climbing engine remounted during active route');
   const y=Number(game.dataset.worldHeight),x=Number(game.dataset.worldX),step=Number(game.dataset.wcProgress);
   if(performance.now()-lastSample>2000){lastSample=performance.now();samples.push({y,x,state:game.dataset.motionState,falls:game.dataset.motorFalls});if(samples.length>12)samples.shift();}
   const next=obstacles.find(o=>o.section===step&&o.y>y-35&&o.y-y<185);
   const difference=Number(game.dataset.routeCenter)+(next?-next.side*82:0)-x;
   const desired=difference>7?'ArrowRight':difference< -7?'ArrowLeft':'';
   if(desired!==held){if(held)key('keyup',held);if(desired)key('keydown',desired);held=desired;}
   await new Promise(r=>setTimeout(r,35));
  }}finally{key('keyup','ArrowUp');if(held)key('keyup',held);}
  if(game.dataset.journeyPhase!=='word')throw Error('Active route did not reach its word station within '+limit+'ms: '+JSON.stringify({...game.dataset,held,samples,snapshot:saved()?.world?.journey?.safeRest}));
  return Number(game.dataset.worldHeight);
 },limit);
}
export async function climbChoice(page,correct=true,keyboard=false){
 const target=(await page.locator('[data-wc="target"]').innerText()).replaceAll('/',''),choices=page.locator('[data-wc="choice"]');
 const words=await choices.locator('strong').allTextContents(),index=words.findIndex(w=>wordStartsWithTargetSound(w,target)===correct);
 const choice=choices.nth(index);await expect(choice).toBeEnabled();const id=await choice.getAttribute('data-ledge-id'),y=Number(await choice.getAttribute('data-world-y'));
 if(keyboard)await choice.press('Enter');else await choice.click();return{id,y,word:words[index],target};
}

const verifiedStations=new Map();
// A worker earns this checkpoint through actual browser controls once. The
// boundary cases then exercise the real resume path, rather than redoing the
// same 25-second approach for every wrong-answer/resize/pause assertion.
export async function openAtVerifiedStation(page,difficulty='easy',sound=0){
 const saved=verifiedStations.get(difficulty);
 if(saved)await page.addInitScript(entries=>{if(!localStorage.getItem(entries[0][0]))for(const [key,value] of entries)localStorage.setItem(key,value);},saved);
 const game=await openClimb(page,difficulty,sound);
 if(!saved){
  await climbToStation(page);
  const entries=await page.evaluate(difficulty=>{
   const scope='fullscreen-overlay-preview';const keys=[`literacy-guide-learn-games:${scope}`,`literacy-guide-word-climb:${scope}:${difficulty}`];
   return keys.map(key=>[key,localStorage.getItem(key)]);
  },difficulty);
  verifiedStations.set(difficulty,entries);
 }
 await expect(game).toHaveAttribute('data-journey-phase','word');return game;
}

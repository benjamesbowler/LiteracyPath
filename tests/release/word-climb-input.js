import { expect } from '@playwright/test';
import fs from 'node:fs';
import { wordStartsWithTargetSound } from '../../src/utils/rocketRunRounds.js';
import { pacedClimbNativeKeys } from './word-climb-steering.js';
export async function retainClimbBoundary(page,testInfo){
 if(page.isClosed())return;
 const state=await page.evaluate(()=>({snapshot:window.__arcadePreviewSnapshot?.(),visual:document.querySelector('.wc-scene')?.__wordClimbVisual?.(),motion:{...document.querySelector('.word-climb')?.dataset},raw:localStorage.getItem('literacy-guide-learn-games:fullscreen-overlay-preview')})).catch(error=>({error:error.message}));
 const file=testInfo.outputPath('actual-climb-boundary-state.json');fs.writeFileSync(file,JSON.stringify(state,null,2));
 await testInfo.attach('actual-climb-boundary-state',{path:file,contentType:'application/json'});
 await page.screenshot({path:testInfo.outputPath('actual-climb-boundary.png')}).catch(()=>{});
}
export async function openClimb(page,difficulty='easy',sound=0){
 const source=await(await page.request.get('/src/components/learn/games/games/WordClimbGame.jsx')).text();expect(source).toContain('onRequestNextLevel');expect(source).toContain('advanceClimbJourney');
 await page.addInitScript(({difficulty,sound})=>{
  const key='literacy-guide-learn-games:fullscreen-overlay-preview';
  if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify({difficulty,soundEnabled:Boolean(sound),musicEnabled:false,
   games:{'word-climb':{checkpoints:{[difficulty]:{level:0,totalLevels:{easy:6,medium:8,hard:10}[difficulty],chapter:0,sessionSeed:3}}}}}));
 },{difficulty,sound});
 await page.goto(`/preview/game-overlay.html?game=word-climb&difficulty=${difficulty}&sound=${sound}&music=0`);
 return await awaitClimbReady(page);
}
export async function awaitClimbReady(page){
 await page.waitForFunction(()=>document.querySelector('.word-climb')||[...document.querySelectorAll('button')].some(button=>button.textContent.trim()==='Continue'));
 const resume=page.getByRole('button',{name:'Continue',exact:true});if(await resume.isVisible())await resume.click();
 await expect(page.locator('[data-wc-scene="ready"],[data-wc-scene="canvas"]')).toBeVisible();return page.locator('.word-climb');
}
// Drives the public DOM keyboard controls against visible position and authored
// obstacle locations. No state, score, clock, speed or collision is overridden.
export async function climbToStation(page,limit=60000){
 const game=page.locator('.word-climb'),deadline=Date.now()+limit;
 await page.locator('.lg-game-player-main').focus();
 const snapshot=await readClimbSnapshot(page),obstacles=snapshot?.world.journey.obstacles;
 if(!obstacles)throw Error('No actual scoped authored route snapshot');
 let held='',lastSample=0,motion;const samples=[];
 await page.keyboard.down('ArrowUp');
 try{while(Date.now()<deadline){
  motion=await game.evaluate(node=>({...node.dataset}));if(motion.journeyPhase==='word')break;
  const y=Number(motion.worldHeight),x=Number(motion.worldX),step=Number(motion.wcProgress);
  if(Date.now()-lastSample>2000){lastSample=Date.now();samples.push({y,x,state:motion.motionState,falls:motion.motorFalls});if(samples.length>12)samples.shift();}
 let desired;
 if(motion.layoutRevision==='paced-v1'){
  const actual=await page.evaluate(()=>window.__arcadePreviewSnapshot?.({motionOnly:true})?.world);
  if(!actual)throw Error('No actual physical crossed-bough state');
  desired=pacedClimbNativeKeys(actual,step%2?-1:1).keys.find(key=>key!=='ArrowUp')||'';
 }else{
  const next=obstacles.find(o=>o.section===step&&o.y>y-35&&o.y-y<185);
  const difference=Number(motion.routeCenter)+(next?-next.side*82:0)-x;
  desired=difference>7?'ArrowRight':difference< -7?'ArrowLeft':'';
 }
  if(desired!==held){if(held)await page.keyboard.up(held);if(desired)await page.keyboard.down(desired);held=desired;}
  await page.waitForTimeout(35);
 }}finally{await page.keyboard.up('ArrowUp');if(held)await page.keyboard.up(held);}
 if(motion?.journeyPhase!=='word')throw Error('Active route did not reach its word station within '+limit+'ms: '+JSON.stringify({motion,held,samples,snapshot:(await readClimbSnapshot(page))?.world?.journey?.safeRest}));
 return Number(motion.worldHeight);
}

export async function readClimbSnapshot(page){
 return page.evaluate(()=>{
  const difficulty=new URL(location.href).searchParams.get('difficulty')||'easy';
  const progress=JSON.parse(localStorage.getItem('literacy-guide-learn-games:fullscreen-overlay-preview')||'null');
  return progress?.games?.['word-climb']?.practiceSession?.[difficulty]
   ||JSON.parse(localStorage.getItem(`literacy-guide-word-climb:fullscreen-overlay-preview:${difficulty}`)||'null');
 });
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

import {createWordClimbSession} from '../../src/utils/wordClimbLevels.js';
import {createClimbJourney,advanceClimbJourney,climbRouteCenter} from '../../src/components/learn/games/games/wordClimbJourney.js';
import {jumpToClimbPlatform,reachableClimbPlatforms} from '../../src/components/learn/games/games/wordClimbWorld.js';
import {applyCheckpoint} from '../../src/utils/gameCheckpoints.js';

// Completion-boundary fixture, explicitly separate from the fresh full-browser
// route in word-climb-premium. Every point is earned by the real pure simulation;
// no active browser position, score, speed, clock or engine hook is modified.
export async function installCompletedClimb(page){
 const session=createWordClimbSession('easy'),world=createClimbJourney(session);let ticks=0;
 while(!world.completed&&ticks++<25000){
  if(world.journey.phase==='word'&&['grounded','landed'].includes(world.state))jumpToClimbPlatform(world,reachableClimbPlatforms(world).find(p=>p.correct).id);
  let input={};if(world.journey.phase==='climb'){
   const next=world.journey.obstacles.find(o=>o.section===world.step&&o.y>world.y-35&&o.y-world.y<185);
   const difference=climbRouteCenter(world.journey,world.y,world.journey.branchStartX)+(next?-next.side*82:0)-world.x;
   input={up:true,left:difference< -6,right:difference>6};
  }
  advanceClimbJourney(world,1/60,input);
 }
 if(!world.completed)throw Error('Completed fixture did not finish its real physics route');
 const progress={difficulty:'easy',isSoundEnabled:false,musicEnabled:false,games:applyCheckpoint({'word-climb':{plays:0,stars:0,highScore:0,wordsCompleted:0}},'word-climb','easy',world.summit-1,world.summit)};
 await page.addInitScript(({progress,session,world})=>{
  const key='literacy-guide-learn-games:fullscreen-overlay-preview';if(localStorage.getItem(key))return;
  localStorage.setItem(key,JSON.stringify(progress));
  localStorage.setItem('literacy-guide-word-climb:fullscreen-overlay-preview:easy',JSON.stringify({v:2,session,world:{...world,event:null,paused:false}}));
 },{progress,session,world});
}

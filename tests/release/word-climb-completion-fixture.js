import {createWordClimbSession} from '../../src/utils/wordClimbLevels.js';
import {createClimbJourney,advanceClimbJourney,climbRouteCenter} from '../../src/components/learn/games/games/wordClimbJourney.js';
import {jumpToClimbPlatform,reachableClimbPlatforms} from '../../src/components/learn/games/games/wordClimbWorld.js';
import {applyCheckpoint} from '../../src/utils/gameCheckpoints.js';
import {gameRandom} from '../../src/utils/gameReplay.js';
import {createWordClimbPracticeState,validateWordClimbPracticeSession} from '../../src/components/learn/games/games/wordClimbPracticeSession.js';
import {addWordClimbMotorEvent,commitWordClimbLanding,wordClimbRounds} from '../../src/components/learn/games/games/wordClimbLearning.js';
import { pacedClimbNativeKeys } from './word-climb-steering.js';

// Completion-boundary fixture, explicitly separate from the fresh full-browser
// route in word-climb-premium. Every point is earned by the real pure simulation;
// no active browser position, score, speed, clock or engine hook is modified.
// These pure-simulation supported rows exercise persistence/UI boundaries;
// they are not prior native learner performance or delivered-audio evidence.
export async function installCompletedClimb(page){
 const seed=3,session={...createWordClimbSession('easy',gameRandom(`${seed}:0`)),stageIndex:0};
 const world=createClimbJourney(session,0,0,gameRandom(`${seed}:climb-ledges:0`));
 const practice=createWordClimbPracticeState(session,world,{difficulty:'easy',seed,journeyIndex:0});let ticks=0;
 while(!world.completed&&ticks++<25000){
  if(world.journey.phase==='word'&&['grounded','landed'].includes(world.state)){
   if(jumpToClimbPlatform(world,reachableClimbPlatforms(world).find(p=>p.correct).id))addWordClimbMotorEvent(practice,'jumps');
  }
  let input={};if(world.journey.phase==='climb'){
   if(world.journey.layoutRevision==='paced-v1'){
    const keys=pacedClimbNativeKeys(world,world.step%2?-1:1).keys;
    input={up:keys.includes('ArrowUp'),left:keys.includes('ArrowLeft'),right:keys.includes('ArrowRight')};
   }else{
    const next=world.journey.obstacles.find(o=>o.section===world.step&&o.y>world.y-35&&o.y-world.y<185);
    const difference=climbRouteCenter(world.journey,world.y,world.journey.branchStartX)+(next?-next.side*82:0)-world.x;
    input={up:true,left:difference< -6,right:difference>6};
   }
  }
  advanceClimbJourney(world,1/60,input);
  if(['correct','summit'].includes(world.event?.type)){
   const round=wordClimbRounds(world,session,practice).find(item=>item.row===world.event.platform.row);
   practice.evidence=commitWordClimbLanding(practice.evidence,round,world.event.platform.id,
    {delivery:'unavailable',soundEnabled:false,responseAt:ticks}).evidence;
  }else if(world.event?.type==='fall')addWordClimbMotorEvent(practice,'falls');
  else if(world.event?.type==='light')addWordClimbMotorEvent(practice,'lights');
 }
 if(!world.completed)throw Error('Completed fixture did not finish its real physics route');
 if(!validateWordClimbPracticeSession(practice,'easy',seed,0))throw Error('The supported final fixture must satisfy the current session contract');
 const games=applyCheckpoint({'word-climb':{plays:0,stars:0,highScore:0,wordsCompleted:0}},'word-climb','easy',world.summit-1,world.summit);
 games['word-climb'].checkpoints.easy={...games['word-climb'].checkpoints.easy,chapter:0,sessionSeed:seed};
 games['word-climb'].practiceSession={easy:practice};
 const progress={difficulty:'easy',soundEnabled:false,musicEnabled:false,games};
 await page.addInitScript(({progress})=>{
  const key='literacy-guide-learn-games:fullscreen-overlay-preview';if(localStorage.getItem(key))return;
  localStorage.setItem(key,JSON.stringify(progress));
 },{progress});
}

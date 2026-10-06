import { speakPhoneme,speakWord,wordAudioDuration,preloadWordAudio } from '../../../../utils/learnGamesAudio.js';
import { playPopSound,playSoftBuzz,playStarChime,playTapSound,playWhoosh } from '../../../../utils/audio/gameSfx.js';
import { rocketRunV2Outing } from '../../../../utils/rocketRunV2Rounds.js';
import { ROCKET_RUN_CONTENT_VERSION,ROCKET_RUN_CONSTRUCT,rocketRunLanguageResult } from '../../../../utils/rocketRunEvidence.js';
import { createRocketCourierState,stepRocketCouriers,steerRocketCourier,selectRocketCourier,pauseRocketCourier,retryRocketCourier,rocketCourierSpeed } from '../../../../utils/rocketRunCourierSimulation.js';
import { armRocketIntent,nearestRocketCourier } from '../../../../utils/rocketRunIntent.js';
import { loadRocketRunSession,saveRocketRunSession } from '../../../../utils/rocketRunSession.js';
import { createRocketApproachCue } from '../../../../utils/rocketRunApproachCue.js';
import { createRocketTeachingCue } from '../../../../utils/rocketRunTeachingCue.js';
import { rocketRunKeyboardAllowed,rocketRunKeyAction } from '../../../../utils/rocketRunInput.js';
import { rocketRunMeteorField } from '../../../../utils/rocketRunViewGeometry.js';
import { createRocketFlightPose } from '../../../../utils/rocketRunFlightPose.js';
import { createRocketRunWorld } from './rocketRunWorld.js';

const clone=value=>structuredClone(value);
const summary=rows=>{const sorted=[...rows].sort((a,b)=>a-b);return {samples:rows.length,mean:rows.length?rows.reduce((a,b)=>a+b,0)/rows.length:null,p95:sorted[Math.floor((sorted.length-1)*.95)]??null,max:sorted.at(-1)??null};};

/** Complete native flight owner. Catch intent is a deliberate readable-word
 * decision; only the simulation's first real receiver contact writes a row.
 * This module has no answer, teleport, advance or test controller API. */
export function createRocketRunEngine(mount,options) {
  const {difficulty='easy',sessionSeed:seed,journey,startLevel=0,progressScopeKey:scope,records}=options;
  const plans=rocketRunV2Outing(difficulty,seed),round=Math.max(0,Math.min(9,Math.trunc(startLevel)||0)),journeyIndex=journey?.index||0;
  const restored=loadRocketRunSession(scope,difficulty,{seed,round,journeyIndex,plans,difficulty});
  let state=restored||createRocketCourierState(plans[round],{seed});
  state.originRound=restored?.originRound??round;state.journeyIndex=journeyIndex;
  state.supportReasons=[...new Set([...(state.supportReasons||[]),...(options.initialSupportReasons||[]),...(restored?['resumed-practice']:[]),...(!options.getSound()?['sound-disabled']:[])])];
  if(options.initiallyPaused)pauseRocketCourier(state,true);
  const startedAt=performance.now();
  let disposed=false,frameId=null,previous=null,accumulator=0,pausedAt=state.paused?startedAt:null,contextRecovery=false,epoch=startedAt-state.foregroundElapsed*1000;
  let lastHud=-Infinity,lastSave=-Infinity,rewardAt=state.completed?state.foregroundElapsed:null,completeSent=false,highlight=null,coach='',saveError=false,pendingInput=null;
  const frameIntervals=[],inputIntervals=[],held=new Map(),pose=createRocketFlightPose();
  const clock=()=>((pausedAt??performance.now())-epoch)/1000,getPlan=()=>plans[state.round],getState=()=>state;
  const sound=()=>options.getSound();
  const sfx=fn=>{if(sound())try{fn();}catch{ /* Flight never depends on SFX. */ }};
  const markSupported=reason=>{state.supportReasons=[...new Set([...state.supportReasons,reason])];};
  const world=createRocketRunWorld(mount,{difficulty,records,onDelivery:value=>options.onDelivery?.(value),
    onContextLoss:()=>{contextRecovery=true;markSupported('context-recovery');pause();coach='Flight paused. Your caught words are kept.';notify();},
    onContextRestored:()=>notify()});
  const approach=createRocketApproachCue({getState,getPlan,speakWord,wordDuration:wordAudioDuration,getSound:sound,getSpeed:currentSpeed,
    getBlocked:()=>teaching.busy(),setHighlight:id=>{highlight=id;},onEvent:event=>{options.onAudioEvent?.(event);if(event.type==='approach-end')persist(false);}});
  const teaching=createRocketTeachingCue({getState,getPlan,speakWord,speakPhoneme,getSound:sound,
    cancelApproach:(...args)=>approach.cancel(...args),onSupport:markSupported,
    onEvent:event=>{options.onAudioEvent?.(event);if(event.type==='teaching-end')persist(false);}});
  function releaseInputs(){held.clear();state.intent=null;}
  function session(){return clone({...state,foregroundElapsed:clock(),intent:null,journeyIndex,version:ROCKET_RUN_CONTENT_VERSION});}
  function persist(notifyHud=true){const result=saveRocketRunSession(scope,difficulty,session());saveError=!result.localSaved;lastSave=clock();if(notifyHud)notify();return result;}
  function notify(){
    const nearest=nearestRocketCourier(getPlan(),state.carriers,state.flight.lane),result=rocketRunLanguageResult(state.evidence);
    const view=world.inspect();
    options.onHud?.({round:state.round,totalRounds:plans.length,target:getPlan().target,needed:getPlan().needed,caught:state.caughtIds.length,
      totalAccepted:result.correct,hearts:state.flight.hearts,protected:state.flight.immunity>0,stopped:state.flight.stopped,
      caughtWords:state.caughtIds.map(id=>getPlan().choices.find(row=>row.id===id)?.word),
      choices:view.faces?.filter(row=>row.readable)||[],selectedFlightId:state.intent?.flightId||null,
      nearest:nearest&&{trialId:nearest.trialId,flightId:nearest.flightId,word:nearest.word},
      coach:coach||'Read. Steer. Catch a word.',saveError,boost:boostHeld(),
      celebrating:state.completed,complete:completeSent,
      result:completeSent?{stars:result.stars,score:result.literacyScore,words:result.correct}:null,
      paused:state.paused,contextRecovery,playable:view.playable,delivery:view.delivery,layout:view.layout});
    options.onScoreUpdate?.(result.literacyScore);options.onProgressUpdate?.(state.evidence.completions.length,plans.length-state.originRound);
  }
  function select(source,trialId=null){
    if(disposed||state.paused||state.completed||state.flight.stopped||!world.inspect().playable)return false;
    if(trialId) {
      const carrier=state.carriers.find(row=>row.trialId===trialId&&row.readable&&row.visible);
      if(!carrier)return false;
      while(state.flight.lane!==carrier.lane)steerRocketCourier(state,carrier.lane<state.flight.lane?-1:1);
      state.intent=armRocketIntent(getPlan(),state.carriers,{lane:state.flight.lane,trialId,source,at:clock()});
    } else selectRocketCourier(state,getPlan(),source);
    if(state.intent){coach=`Catch selected: ${getPlan().choices.find(row=>row.id===state.intent.trialId).word}`;pendingInput=performance.now();sfx(playTapSound);notify();return true;}
    coach='Wait for a word in this lane.';notify();return false;
  }
  function action(actionName,source='keyboard') {
    if(disposed||state.paused||state.completed)return;
    if(actionName==='catch'){select(source);return;}
    if(actionName==='left'||actionName==='right'){if(steerRocketCourier(state,actionName==='left'?-1:1)){pendingInput=performance.now();sfx(playWhoosh);}return;}
  }
  function hold(actionName,pressed,source='pointer',token=actionName){
    if(!pressed){held.delete(token);return;}
    if(disposed||state.paused||state.completed||state.flight.stopped||held.has(token))return;
    held.set(token,{action:actionName,source,next:clock()+.36});
    if(actionName!=='boost')action(actionName,source);pendingInput=performance.now();
  }
  function boostHeld(){return [...held.values()].some(row=>row.action==='boost');}
  function currentSpeed(){return rocketCourierSpeed(state,getPlan(),boostHeld()?18:11,wordAudioDuration).speed;}
  function onEvent(event){
    if(!event)return;pose.event(event.type);
    if(event.type==='accepted-word'){coach='Good sound! Word caught.';sfx(playPopSound);teaching.reinforce(event.word);persist();}
    else if(event.type==='wrong-onset'){coach=`${event.word}: listen, then try again.`;sfx(playSoftBuzz);teaching.contrast(event.word);persist();}
    else if(event.type==='meteor-hit'){coach=event.hearts?'Meteor hit. Shield on briefly.':'Shield empty. Retry; words kept.';releaseInputs();approach.cancel('meteor-hit');teaching.cancel('meteor-hit');persist();}
    else if(event.type==='motor-contact'){coach='Choose a word with Catch.';}
    if(state.completed&&rewardAt===null){rewardAt=clock();releaseInputs();pose.event('round-complete');sfx(playStarChime);persist();}
  }
  function advance(){
    if(state.round===plans.length-1){
      if(completeSent)return;completeSent=true;persist(false);
      teaching.cancel('outing-complete');approach.cancel('outing-complete');releaseInputs();
      const result=rocketRunLanguageResult(state.evidence);options.onComplete?.(result.stars,result.literacyScore,result.correct,clone({
        contentVersion:ROCKET_RUN_CONTENT_VERSION,construct:ROCKET_RUN_CONSTRUCT,sessionSeed:seed,journeyIndex,originRound:state.originRound,
        practiceOnly:true,formalAssessment:false,masteryClaim:false,motorCreatesEvidence:false,
        firstResponses:state.evidence.firstResponses,assistedRetries:state.evidence.assistedRetries,completions:state.evidence.completions,
        wordsCompleted:result.correct,totalRequired:plans.slice(state.originRound).reduce((sum,p)=>sum+p.needed,0),
        motor:{hits:state.flight.motorHits,misses:state.flight.motorMisses,retries:state.flight.motorRetries,passages:state.motorPassages}}));return;
    }
    teaching.cancel('new-round');approach.cancel('new-round');releaseInputs();
    const next=createRocketCourierState(plans[state.round+1],{seed,evidence:state.evidence,elapsed:state.elapsed,foregroundElapsed:clock()});
    next.flight={...state.flight,velocity:0,bank:0};next.distance=state.distance;next.hazardOriginDistance=state.distance;
    next.motorPassages=state.motorPassages;
    next.originRound=state.originRound;next.journeyIndex=journeyIndex;
    next.supportReasons=!sound()?['sound-disabled']:[];state=next;rewardAt=null;coach='New sound. Read the next words.';
    preloadWordAudio(getPlan().choices.map(row=>row.word));options.onCheckpoint?.(state.round,plans.length);teaching.target();persist();
  }
  function pause(){if(disposed||state.paused)return;state.foregroundElapsed=clock();pausedAt=performance.now();pauseRocketCourier(state,true);releaseInputs();approach.cancel('pause',{replayOnResume:true});teaching.cancel('pause');previous=null;accumulator=0;persist();}
  function resume(){if(disposed||!state.paused||contextRecovery)return;epoch+=performance.now()-pausedAt;pausedAt=null;pauseRocketCourier(state,false);previous=null;markSupported('resumed-practice');teaching.target();notify();}
  function onKeyDown(event){if(state.paused||!rocketRunKeyboardAllowed(event,mount,document.activeElement))return;const name=rocketRunKeyAction(event.key,{repeat:event.repeat});if(!name)return;event.preventDefault();if(name==='boost')hold('boost',true,'keyboard',event.code);else action(name,'keyboard');}
  function onKeyUp(event){if(event.key==='Shift')held.delete(event.code);}
  const blur=()=>releaseInputs(),hidden=()=>{if(document.hidden)pause();},pageHide=()=>pause();
  window.addEventListener('keydown',onKeyDown);window.addEventListener('keyup',onKeyUp);window.addEventListener('blur',blur);
  document.addEventListener('visibilitychange',hidden);window.addEventListener('pagehide',pageHide);
  const observer=new ResizeObserver(()=>{world.resize(mount.clientWidth,mount.clientHeight);world.draw(state,pose.update(0,state.flight),0,{highlight,meteors:rocketRunMeteorField(state,difficulty,world.laneX)});notify();});observer.observe(mount);
  world.resize(mount.clientWidth,mount.clientHeight);
  function tick(at){
    if(disposed)return;frameId=requestAnimationFrame(tick);
    const raw=previous===null?0:Math.max(0,(at-previous)/1000);previous=at;
    if(!state.paused&&!completeSent){
      state.foregroundElapsed=clock();
      for(const row of held.values())if(['left','right'].includes(row.action)&&clock()>=row.next){action(row.action,row.source);row.next=clock()+.22;}
      if(world.inspect().playable&&!state.completed){
        accumulator=Math.min(.1,accumulator+raw);
        while(accumulator>=1/120){
          const meteors=rocketRunMeteorField(state,difficulty,world.laneX);
          const events=stepRocketCouriers(state,getPlan(),1/120,{laneX:world.laneX,requestedSpeed:boostHeld()?18:11,
            clipSeconds:wordAudioDuration,presentation:carrier=>world.present(carrier,state.carriers),difficulty,
            reducedMotion:world.reducedMotion,meteors,foregroundAt:clock()});events.forEach(onEvent);accumulator-=1/120;
        }
        teaching.sync();approach.sync(currentSpeed());
      }
      if(rewardAt!==null&&clock()-rewardAt>=1.6&&world.inspect().playable)advance();
      if(clock()-lastSave>=5)persist(false);
    }
    world.draw(state,pose.update(state.paused?0:raw,state.flight,{boost:boostHeld(),completed:state.completed,reducedMotion:world.reducedMotion}),state.paused?0:raw,{highlight,meteors:rocketRunMeteorField(state,difficulty,world.laneX)});
    if(!state.paused&&world.inspect().playable&&raw>0){frameIntervals.push(raw*1000);if(frameIntervals.length>1800)frameIntervals.shift();if(pendingInput!==null){inputIntervals.push(performance.now()-pendingInput);if(inputIntervals.length>120)inputIntervals.shift();pendingInput=null;}}
    if(at-lastHud>=50){lastHud=at;notify();}
  }
  preloadWordAudio(getPlan().choices.map(row=>row.word));options.onSessionStart?.();options.onCheckpoint?.(state.round,plans.length);
  if(!state.paused)teaching.target();frameId=requestAnimationFrame(tick);notify();
  return {pause,resume,hold,release:releaseInputs,choose:select,tap:action,markSupported,
    resumeContext(){if(!contextRecovery||!world.inspect().playable)return false;contextRecovery=false;coach='Flight ready. Choose a word with Catch.';resume();return true;},
    replay(){teaching.target({replay:true});persist();},retrySave:persist,
    retryArt(){world.retry();markSupported('art-recovery');},
    retryFlight(){if(retryRocketCourier(state,getPlan())){releaseInputs();coach='Shield restored. Words kept.';teaching.target();pose.event('meteor-hit');persist();}},
    soundChanged(enabled){if(!enabled){markSupported('sound-disabled');approach.cancel('muted',{replayOnResume:true});teaching.cancel('muted');}else teaching.target();persist();},
    debugSnapshot(){return clone({...state,sessionSeed:seed,contextRecovery,scene:world.inspect(),pose:pose.inspect(),teaching:teaching.inspect(),approach:approach.inspect(),
      coach,saveError,complete:completeSent,performance:{frames:summary(frameIntervals),inputToRenderedFrame:summary(inputIntervals)}});},
    destroy(){if(disposed)return;persist(false);disposed=true;releaseInputs();approach.dispose();teaching.dispose();cancelAnimationFrame(frameId);observer.disconnect();world.dispose();
      window.removeEventListener('keydown',onKeyDown);window.removeEventListener('keyup',onKeyUp);window.removeEventListener('blur',blur);document.removeEventListener('visibilitychange',hidden);window.removeEventListener('pagehide',pageHide);},
  };
}

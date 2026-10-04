import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, SpeakerHigh, Hammer, PersonSimple, ArrowClockwise } from '@phosphor-icons/react';
import { buildTowerTumbleRounds, commitTowerTumbleStrike, newTowerTumbleEvidence, towerTumbleApproachX, towerTumbleGeometry, towerTumbleStep, towerTumbleLoseLife, towerTumbleRetryRoute, TOWER_TUMBLE_LIVES, TOWER_TUMBLE_VERSION, TOWER_TUMBLE_STRIKE_SECONDS } from '../../../../utils/towerTumbleRules.js';
import { loadTowerTumbleSession, saveTowerTumbleSession } from '../../../../utils/towerTumbleSession.js';
import { phonicsTargetHint } from '../../../../utils/phonicsTargetPresentation.js';
import { playCorrectChime, playSoftBuzz, playPopSound, playStarChime, playWhoosh, cancelGameSfx } from '../../../../utils/audio/gameSfx.js';
import { getLedaInstructionAudioPath } from '../../../../data/ledaProductionAudio.js';
import { createDrumTrailVoice } from '../../../../utils/drumTrailVoice.js';
import { loadThree } from '../shared/threeShell.js';
import { createTowerCanvasWorld as canvasWorld, createTowerThreeWorld as threeWorld } from './towerTumbleWorld.js';
import { loadTowerTumbleSceneKit } from './towerTumbleSceneKit.js';
import { physicalThemeForDifficulty } from '../shared/physicalArcadeThemes.js';
import { createQuestFrameBudgetState, sampleQuestFrameBudget } from '../../../../utils/questPerformance.js';
import './TowerTumbleGame.css';

const SIMULATION_STEP=1/60,MAX_SIMULATION_ACCUMULATOR=.12;
const SPAWN = { x:-7,y:0,vy:0,facing:1,grounded:true,climbing:false,safe:{x:-7,y:0} };
const initial = (rounds, difficulty, seed, cursor, scope, journeyIndex, resumed) => {
  const index = Math.max(0,Math.min(Number.isInteger(cursor)?cursor:0,rounds.length-1));
  const restored = loadTowerTumbleSession(scope,difficulty,seed,index,rounds,journeyIndex);
  return restored ? {...restored,saveError:false,actor:{...SPAWN,...restored.actor},feedback:restored.phase==='retry'?'Your sounds are saved. Retry the route.':restored.phase==='rescue'?'Lift ready! The cargo is safe.':'Carry on. Hear the word, then smash its sounds.'}
    : {seed,journeyIndex,index,roundId:rounds[index].roundId,unitIndex:0,phase:'playing',mistakes:0,hintUsed:false,delivery:'pending',score:0,
      lives:TOWER_TUMBLE_LIVES,immunity:0,supportReasons:resumed || index ? ['resume_without_support_record'] : [],evidence:newTowerTumbleEvidence(),actor:{...SPAWN},broken:[],collected:[],assist:true,access:false,saveError:false,
      feedback:'Hear the word. Smash its sounds in order.'};
};

function MoveControl({direction,className,disabled,onMove,onFocus,onNudge,children}) {
  const release=()=>onMove(direction,false);
  return <button type="button" className={className} aria-label={{left:'Move left',right:'Move right',up:'Climb up',down:'Climb down'}[direction]} disabled={disabled}
    onPointerDown={event=>{event.preventDefault();event.currentTarget.setPointerCapture(event.pointerId);onMove(direction,true);onFocus();}}
    onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release}
    onClick={event=>{if(event.detail===0)onNudge(direction);}}>{children}</button>;
}

export default function TowerTumbleGame({difficulty='easy',sessionSeed=0,journey,startLevel=0,resumedCheckpoint=false,progressScopeKey='default',isSoundEnabled=true,
  onScoreUpdate,onProgressUpdate,onCheckpoint,onComplete,onResultReady,onSessionStart,onEngineReady,onRequestReplay,completionPresentedByPlayer=false}) {
  const theme=useMemo(()=>physicalThemeForDifficulty(difficulty),[difficulty]);
  const rounds=useMemo(()=>buildTowerTumbleRounds(difficulty,sessionSeed,journey?.index||0),[difficulty,sessionSeed,journey?.index]);
  const [game,setGame]=useState(()=>initial(rounds,difficulty,sessionSeed,startLevel,progressScopeKey,journey?.index||0,resumedCheckpoint));
  const [paused,setPaused]=useState(false),[rendererMode,setRendererMode]=useState('loading'),[pictureFailed,setPictureFailed]=useState(false);
  const [shortScreen,setShortScreen]=useState(()=>typeof window!=='undefined'&&window.matchMedia('(max-height:440px)').matches);
  const field=useRef(null),mount=useRef(null),controller=useRef(null),pictureDelivery=useRef('pending'),handlers=useRef({});
  useEffect(()=>{const query=window.matchMedia('(max-height:440px)'),changed=()=>setShortScreen(query.matches);query.addEventListener('change',changed);changed();return()=>query.removeEventListener('change',changed);},[]);
  useEffect(()=>{handlers.current={onScoreUpdate,onProgressUpdate,onCheckpoint,onComplete,onResultReady,onSessionStart,onEngineReady,onRequestReplay};},[onScoreUpdate,onProgressUpdate,onCheckpoint,onComplete,onResultReady,onSessionStart,onEngineReady,onRequestReplay]);
  useEffect(()=>{
    let state=initial(rounds,difficulty,sessionSeed,startLevel,progressScopeKey,journey?.index||0,resumedCheckpoint),geometry=towerTumbleGeometry(rounds[state.index].tower,journey?.index||0,difficulty,state.index);
    let world,sceneKit=null,disposed=false,playerPaused=false,hidden=document.hidden,enginePaused=false,sound=isSoundEnabled,reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false;
    let raf=0,last=performance.now(),elapsed=0,rescueTime=0,lastPublish=0,lastSave=0,lastBarrel=0,smash=0,impactAge=1,shaken=-1,struck=-1,autoRoute=null,completeSent=false;
    let barrels=[],input={},voiceTicket=0,renderMode='loading',nudgeAt=0,simulationRemainder=0,motorVelocity=0;
    let frameBudget=createQuestFrameBudgetState('low'),pendingInputAt=null;
    let steadyBudget=createQuestFrameBudgetState('low');
    const steadySegments=[];
    const beginSteadySegment=()=>{
      const quality=world?.profile?.().quality||'low';steadyBudget=createQuestFrameBudgetState({high:'rich',medium:'balanced',low:'low','2d':'pixel'}[quality]);
      steadySegments.push({quality,renderer:renderMode,startElapsed:elapsed,frames:0,totalMs:0,maxMs:0,samples:[]});
    };
    const steadyProfile=()=>steadySegments.map(({samples,totalMs,...segment})=>({
      ...segment,meanMs:segment.frames?totalMs/segment.frames:null,p95Ms:samples.length?[...samples].sort((a,b)=>a-b)[Math.ceil(samples.length*.95)-1]:null,
      percentileSamples:samples.length,percentileWindow:'most recent 600 measured foreground frames after shared warmup',
    }));
    const metrics={frameMeasurement:'foreground requestAnimationFrame intervals',inputMeasurement:'native input handler to next render submission; not display/compositor latency',frames:0,frameMsTotal:0,maxFrameMs:0,inputSamples:0,inputMsTotal:0,maxInputMs:0,drawCallsPeak:0,trianglesPeak:0,qualityChanges:[],frameWindows:[]};
    const recordInput=()=>{if(pendingInputAt===null)pendingInputAt=performance.now();};
    const voice=createDrumTrailVoice({enabled:()=>sound&&!enginePaused});
    const effect=play=>{if(sound&&!enginePaused)try{play();}catch{/* Decorative sound failure never changes the learning response. */}};
    const round=()=>rounds[state.index];
    const publish=()=>{if(!disposed)setGame({...state,actor:{...state.actor}});};
    const persist=(checkpoint=false)=>{
      const saved=saveTowerTumbleSession(progressScopeKey,difficulty,{...state,roundId:round().roundId,mapLayoutId:geometry.layoutId,actor:{...state.actor,safe:{...state.actor.safe}}});
      if(!saved.localSaved){state.saveError=true;publish();return false;}
      if(checkpoint){try{handlers.current.onCheckpoint?.(state.index,rounds.length);}catch{state.saveError=true;publish();return false;}}
      return true;
    };
    const markSupported=(reason='mission-help')=>{state.supportReasons=[...new Set([...state.supportReasons,reason])];persist();publish();};
    const replay=async({retry=false}={})=>{
      if(disposed||enginePaused||state.phase==='complete')return;
      const ticket=++voiceTicket,id=round().roundId;
      state.delivery='pending';publish();
      if(retry){
        // Production retry guidance and the actual heard cue use the same
        // bounded owner. Replays never rewrite earlier response delivery.
        await voice.play(getLedaInstructionAudioPath('Try again'));
        if(disposed||ticket!==voiceTicket||id!==round().roundId||!sound)return;
      }
      const result=await voice.play(round().audio);
      if(disposed||ticket!==voiceTicket||id!==round().roundId)return;
      if(result.status==='interrupted')return;
      state.delivery=result.status==='delivered'?'delivered':'unavailable';
      if(result.status!=='delivered')state.supportReasons=[...new Set([...state.supportReasons,sound?'audio-unavailable':'sound-disabled'])];
      persist();publish();
    };
    const motor=(key)=>{state.evidence={...state.evidence,motorEvents:{...state.evidence.motorEvents,[key]:(state.evidence.motorEvents[key]||0)+1}};};
    const strike=()=>{
      if(disposed||!world||enginePaused||state.phase!=='playing'||state.saveError||smash>0)return;
      const chosenRoute=autoRoute;if(!chosenRoute)recordInput();smash=TOWER_TUMBLE_STRIKE_SECONDS;autoRoute=null;
      const nearby=round().bricks.map((brick,index)=>({...brick,index,distance:Math.abs(brick.x-state.actor.x)})).filter(brick=>brick.distance<1.5&&Math.abs(brick.y-state.actor.y)<.85).sort((a,b)=>a.distance-b.distance)[0];
      const wall=geometry.shortcuts.find(item=>!state.broken.includes(item.id)&&Math.abs(item.x-state.actor.x)<1.55&&Math.abs(item.y-state.actor.y)<.85);
      if(wall){
        effect(playPopSound);state.broken=[...state.broken,wall.id];autoRoute=chosenRoute;motor('shortcuts');state.feedback='Shortcut open! Keep exploring.';persist();publish();
      }else if(nearby){
        const result=commitTowerTumbleStrike(state.evidence,round(),state.unitIndex,nearby.chunk,{delivery:state.delivery,pictureDelivery:pictureDelivery.current,supportReasons:state.supportReasons});
        if(!result)return;state.evidence=result.evidence;
        if(result.correct){effect(playCorrectChime);state.unitIndex++;struck=nearby.index;shaken=-1;impactAge=0;state.feedback='Sound added. Find the next sound.';
          if(result.finished){state.score=state.evidence.completions.length*30;state.phase='rescue';rescueTime=0;barrels=[];input={};state.feedback='Lift ready! The cargo is safe.';handlers.current.onScoreUpdate?.(state.score);handlers.current.onProgressUpdate?.(state.evidence.completions.length,rounds.length);}
        }else{effect(playSoftBuzz);state.mistakes++;shaken=nearby.index;struck=-1;state.supportReasons=[...new Set([...state.supportReasons,'contrast-after-wrong-response'])];state.feedback='That spelling part does not fit here. Listen and try again.';}
        persist();publish();if(!result.correct&&sound)void replay({retry:true});
      }else{
        const barrel=barrels.find(item=>Math.abs(item.x-state.actor.x)<1.8&&Math.abs(item.y-state.actor.y)<.9);
        if(barrel){effect(playPopSound);barrel.dir*=-1;barrel.x+=barrel.dir*.8;state.feedback='Barrel turned! Keep climbing.';publish();}
        else{effect(playWhoosh);motor('emptySwings');state.feedback='Move beside a brick, then smash.';publish();}
      }
    };
    const reach=(chunk)=>{
      if(enginePaused||state.phase!=='playing'||state.saveError)return;
      const brick=round().bricks.find(item=>item.chunk===chunk);if(!brick)return;
      recordInput();autoRoute={...brick};state.feedback=`Reach the ${chunk} brick and swing.`;publish();field.current?.focus({preventScroll:true});
    };
    const finish=()=>{
      if(completeSent||disposed)return;completeSent=true;state.phase='complete';input={};publish();
      const evidence={...state.evidence,contentVersion:TOWER_TUMBLE_VERSION,sessionSeed,journeyIndex:journey?.index||0,practiceOnly:true,construct:'heard-word-grapheme-encoding',formalAssessment:false,masteryClaim:false};
      handlers.current.onResultReady?.(3,state.score,state.evidence.completions.length,evidence);
      handlers.current.onComplete?.(3,state.score,state.evidence.completions.length,evidence);
    };
    const advance=()=>{
      if(!persist())return;
      if(state.index===rounds.length-1){finish();return;}
      const nextTower=rounds[state.index+1].tower,sameTower=nextTower===round().tower;
      state={...state,index:state.index+1,unitIndex:0,phase:'playing',mistakes:0,hintUsed:false,delivery:'pending',supportReasons:[],broken:[],collected:[],actor:{...SPAWN},feedback:sameTower?'A fresh route! Hear the next word and explore.':'A new tower! Hear the word and explore its routes.'};
      state.roundId=round().roundId;geometry=towerTumbleGeometry(round().tower,journey?.index||0,difficulty,state.index);rescueTime=0;barrels=[];struck=-1;shaken=-1;impactAge=1;autoRoute=null;lastBarrel=elapsed;
      pictureDelivery.current='pending';setPictureFailed(false);world?.rebuild?.(round(),geometry,state);persist(true);publish();void replay();
    };
    const pauseUpdate=()=>{enginePaused=playerPaused||hidden;input={};pendingInputAt=null;nudgeAt=0;autoRoute=null;simulationRemainder=0;motorVelocity=0;last=performance.now();setPaused(enginePaused);if(enginePaused){voice.pause();cancelGameSfx();persist();}else{voice.resume();const playArea=field.current?.closest('.lg-game-player-main')||field.current;if(!playArea?.contains(document.activeElement))field.current?.focus({preventScroll:true});}};
    const snapshot=()=>({game:'tower-tumble',world:theme.id,hero:theme.hero,index:state.index,unitIndex:state.unitIndex,phase:state.phase,position:{x:state.actor.x,y:state.actor.y},choices:[...round().choices],bricks:round().bricks.map(b=>({...b})),geometry:structuredClone(geometry),scenery:{openedShortcuts:[...state.broken],collected:[...state.collected]},paused:enginePaused,score:state.score,mistakes:state.mistakes,delivery:state.delivery,hintUsed:state.hintUsed,supportReasons:[...state.supportReasons],evidence:structuredClone(state.evidence),elapsed,rescueTime,renderer:renderMode,lives:state.lives,immunity:state.immunity,barrels:barrels.map(b=>({...b})),hazardsResting:state.access&&!autoRoute,assist:state.assist,access:state.access,animation:{strikeSecondsRemaining:smash,impactAge,struckBrick:round().bricks[struck]?.id||null},simulation:{kind:'fixed-step',stepSeconds:SIMULATION_STEP,remainderSeconds:simulationRemainder},
      performance:{...metrics,qualityChanges:[...metrics.qualityChanges],frameWindows:[...metrics.frameWindows],steadyState:steadyProfile(),averageFrameMs:metrics.frames?metrics.frameMsTotal/metrics.frames:null,averageInputMs:metrics.inputSamples?metrics.inputMsTotal/metrics.inputSamples:null,current:world?.profile?.()||null}});
    const api={pause(){playerPaused=true;pauseUpdate();},resume(){playerPaused=false;pauseUpdate();},markSupported,
      soundEnabled(value){sound=value;if(!value){voice.cancel();cancelGameSfx();voiceTicket++;state.delivery='unavailable';markSupported('sound-disabled');}else void replay();},
      replay,reach,strike,retryRoute(){if(enginePaused||state.phase!=='retry')return;state=towerTumbleRetryRoute(state);barrels=[];input={};autoRoute=null;lastBarrel=elapsed;state.feedback='Three lives. Your built sounds are safe. Keep going.';persist();publish();field.current?.focus({preventScroll:true});},jump(){if(!enginePaused){effect(playWhoosh);recordInput();input.jump=true;autoRoute=null;}},
      move(key,value){if(enginePaused)return;input[key]=value;if(value){recordInput();autoRoute=null;}},
      nudge(key){if(enginePaused)return;recordInput();input[key]=true;nudgeAt=elapsed+.22;autoRoute=null;},
      assist(){state.assist=!state.assist;persist();publish();},access(){state.access=!state.access;persist();publish();},
      hint(){if(state.mistakes<2||enginePaused)return;state.hintUsed=true;markSupported('partial-spelling-hint');field.current?.focus({preventScroll:true});},
      retrySave(){state.saveError=false;if(persist(true)){publish();if(state.phase==='rescue')rescueTime=Math.min(rescueTime,1.8);field.current?.focus({preventScroll:true});}},
      inspect:snapshot,...(import.meta.env.DEV?{debugSnapshot:()=>({...snapshot(),word:round().word,chunks:[...round().chunks]})}:{})};
    controller.current=api;
    const keyMap={ArrowLeft:'left',a:'left',A:'left',ArrowRight:'right',d:'right',D:'right',ArrowUp:'up',w:'up',W:'up',ArrowDown:'down',s:'down',S:'down'};
    const keyDown=event=>{
      const active=document.activeElement,host=field.current?.closest('.lg-game-player-main');
      if(!(field.current?.contains(active)||(host&&active===host))||enginePaused||state.phase!=='playing'||event.target.closest('input,textarea'))return;
      if(keyMap[event.key]){event.preventDefault();if(!event.repeat)recordInput();input[keyMap[event.key]]=true;autoRoute=null;}
      else if(event.key===' '&&event.target.tagName!=='BUTTON'){event.preventDefault();if(!event.repeat)api.jump();}
      else if(event.key.toLowerCase()==='e'){event.preventDefault();if(!event.repeat)strike();}
    };
    const keyUp=event=>{if(keyMap[event.key])input[keyMap[event.key]]=false;if(event.key===' ')input.jump=false;};
    const blur=()=>{input={};pendingInputAt=null;autoRoute=null;};
    const visibility=()=>{hidden=document.hidden;pauseUpdate();};
    const query=window.matchMedia?.('(prefers-reduced-motion: reduce)'),motion=event=>{reduced=event.matches;};
    document.addEventListener('keydown',keyDown);document.addEventListener('keyup',keyUp);window.addEventListener('blur',blur);document.addEventListener('visibilitychange',visibility);query?.addEventListener('change',motion);
    const fallback=()=>{if(disposed)return;world?.dispose();world=canvasWorld(mount.current,theme,sceneKit);frameBudget=createQuestFrameBudgetState('2d');renderMode='drawing';beginSteadySegment();setRendererMode('drawing');};
    const resize=()=>world?.resize();const observer=new ResizeObserver(resize);observer.observe(mount.current);
    const loop=now=>{
      if(disposed)return;raf=requestAnimationFrame(loop);const frameMs=now-last;last=now;
      let velocity=enginePaused?0:motorVelocity;
      if(!enginePaused&&state.phase!=='complete'){
        metrics.frames++;metrics.frameMsTotal+=frameMs;metrics.maxFrameMs=Math.max(metrics.maxFrameMs,frameMs);
        const budget=sampleQuestFrameBudget(frameBudget,frameMs);
        if(budget){frameBudget=budget.state;if(budget.signal.type==='quality-change'){
          metrics.qualityChanges.push({...budget.signal,elapsed});
          if(budget.signal.toTier==='2d')fallback();else{world?.lowerQuality?.(budget.signal.toTier);beginSteadySegment();}
        }else metrics.frameWindows=[...metrics.frameWindows,budget.signal].slice(-12);}
        // The shared sampler owns warmup/valid frame eligibility. Retaining a
        // rolling sample window adds a measured p95 without a new FPS policy.
        const reportedBefore=steadyBudget.reportFrames;sampleQuestFrameBudget(steadyBudget,frameMs);
        if(steadyBudget.reportFrames!==reportedBefore){const segment=steadySegments.at(-1);if(segment){segment.frames++;segment.totalMs+=frameMs;segment.maxMs=Math.max(segment.maxMs,frameMs);segment.samples.push(frameMs);if(segment.samples.length>600)segment.samples.shift();}}
        // The renderer may run at 30, 60 or 120 Hz. Native actions and route
        // collisions always advance in the same 60 Hz simulation steps.
        simulationRemainder=Math.min(MAX_SIMULATION_ACCUMULATOR,simulationRemainder+Math.max(0,frameMs)/1000);
        while(simulationRemainder>=SIMULATION_STEP&&state.phase!=='complete'){
          simulationRemainder-=SIMULATION_STEP;const dt=SIMULATION_STEP;
        elapsed+=dt;if(nudgeAt&&elapsed>=nudgeAt){input={};nudgeAt=0;}smash=Math.max(0,smash-dt);impactAge+=dt;if(state.phase==='playing')state.immunity=Math.max(0,state.immunity-dt);
        const lift=3+Math.sin(elapsed*.7)*3;
        const platform={x:geometry.movingPlatform.x,y:lift,width:1.8};
        if(state.phase==='playing'&&!state.saveError){
          const controls={...input};
          if(autoRoute){
            const targetLevel=autoRoute.y,currentLevel=state.actor.y;
            if(Math.abs(currentLevel-targetLevel)>.005){
              const ladder=geometry.ladders.find(l=>currentLevel>=l.bottom-.2&&currentLevel<l.top+.1&&targetLevel>currentLevel) || geometry.ladders.find(l=>currentLevel<=l.top+.2&&currentLevel>l.bottom-.1&&targetLevel<currentLevel);
              if(ladder){controls.left=state.actor.x>ladder.x+.12;controls.right=state.actor.x<ladder.x-.12;if(Math.abs(state.actor.x-ladder.x)<.2){controls.up=targetLevel>currentLevel;controls.down=!controls.up;}}
            }else{
              const stand=towerTumbleApproachX(round().bricks,autoRoute);
              controls.left=state.actor.x>stand+.12;controls.right=state.actor.x<stand-.12;
              if(Math.abs(state.actor.x-stand)<.14&&smash===0){controls.left=controls.right=false;state.actor.facing=1;strike();}
            }
          }
          if(autoRoute&&state.actor.grounded&&barrels.some(b=>Math.abs(b.x-state.actor.x)<1.9&&Math.abs(b.y-state.actor.y)<.65))controls.jump=true;
          const previousLift=3+Math.sin((elapsed-dt)*.7)*3;
          if(state.actor.grounded&&Math.abs(state.actor.x-platform.x)<.88&&Math.abs(state.actor.y-previousLift)<.12)state.actor.y=lift;
          const previous=state.actor.x;state.actor=towerTumbleStep(state.actor,controls,{...geometry,platforms:[platform,...geometry.platforms]},dt,{assist:state.assist});input.jump=false;
          for(const wall of geometry.shortcuts.filter(w=>!state.broken.includes(w.id))){if(Math.abs(state.actor.y-wall.y)<1&&Math.abs(state.actor.x-wall.x)<.7){state.actor.x=previous; if(autoRoute){ // Accessible route opens only unlabelled physical scenery.
              state.broken=[...state.broken,wall.id];motor('shortcuts');}
          }}
          if(state.actor.fell){motor('falls');state.feedback='Safe landing. Your sounds are still saved.';publish();}
          const hazardsResting=state.access&&!autoRoute;if(hazardsResting)lastBarrel=elapsed;
          if(!hazardsResting&&elapsed-lastBarrel>5&&barrels.length<5){lastBarrel=elapsed;const level=(Math.floor(elapsed/5)+geometry.variant)%3,side=Math.abs(state.actor.y-level*3)<.9?(state.actor.x<0?1:-1):(level%2?1:-1);barrels.push({x:side*7.9,y:level*3,dir:-side,spin:0});}
          for(const barrel of barrels){if(hazardsResting)continue;barrel.x+=barrel.dir*2.2*dt;barrel.spin-=barrel.dir*dt*5;if(Math.abs(barrel.x)>8){barrel.y-=3;barrel.dir*=-1;barrel.x=Math.sign(barrel.x)*7.9;}
            if(state.immunity===0&&Math.abs(barrel.x-state.actor.x)<.68&&Math.abs(barrel.y-state.actor.y)<.58){state=towerTumbleLoseLife(state,geometry);barrel.consumed=true;input={};if(state.phase==='retry')autoRoute=null;effect(playSoftBuzz);state.feedback=state.lives?'Barrel bump! One life lost. Your sounds are safe.':'Route paused. Your sounds are safe. Retry with three lives.';persist();publish();}}
          barrels=barrels.filter(b=>b.y>=0&&!b.consumed);
          for(const collectible of geometry.collectibles){if(!state.collected.includes(collectible.id)&&Math.abs(collectible.x-state.actor.x)<.65&&Math.abs(collectible.y-state.actor.y-.5)<.8){state.collected=[...state.collected,collectible.id];motor('collectibles');effect(playStarChime);state.feedback=`${theme.id==='dino'?'Amber fossil':theme.id==='moonwood'?'Moon crystal':'Acorn'} found! Exploring is fun.`;publish();}}
          motorVelocity=velocity=(state.actor.x-previous)/dt;
        }else if(state.phase==='rescue'&&!state.saveError){motorVelocity=velocity=0;rescueTime+=dt;if(rescueTime>2.4)advance();}
        }
        if(now-lastPublish>130){lastPublish=now;publish();}if(now-lastSave>2500&&state.phase==='playing'){lastSave=now;persist();}
      }
      world?.draw({state,geometry,round:round(),barrels,lift:3+Math.sin(elapsed*.7)*3,elapsed,smash,velocity,reduced,rescueProgress:Math.min(1,rescueTime/2),shaken,struck,impactAge});
      const rendered=world?.profile?.();if(rendered){metrics.drawCallsPeak=Math.max(metrics.drawCallsPeak,rendered.drawCalls||0);metrics.trianglesPeak=Math.max(metrics.trianglesPeak,rendered.triangles||0);}
      if(!enginePaused&&pendingInputAt!==null){const latency=performance.now()-pendingInputAt;metrics.inputSamples++;metrics.inputMsTotal+=latency;metrics.maxInputMs=Math.max(metrics.maxInputMs,latency);pendingInputAt=null;}
    };
    Promise.all([loadThree(),loadTowerTumbleSceneKit(theme.id)]).then(([THREE,kit])=>{sceneKit=kit;if(disposed)return;try{world=threeWorld(THREE,mount.current,fallback,theme,sceneKit);world.rebuild(round(),geometry,state);frameBudget=createQuestFrameBudgetState({high:'rich',medium:'balanced',low:'low'}[world.profile().quality]);renderMode='3d';beginSteadySegment();setRendererMode('3d');}catch{fallback();}raf=requestAnimationFrame(loop);}).catch(async()=>{sceneKit=await loadTowerTumbleSceneKit(theme.id);if(disposed)return;fallback();raf=requestAnimationFrame(loop);});
    handlers.current.onSessionStart?.();
    handlers.current.onEngineReady?.({pause:api.pause,resume:api.resume,markSupported:api.markSupported,inspect:api.inspect,...(import.meta.env.DEV?{debugSnapshot:api.debugSnapshot}:{})});
    handlers.current.onScoreUpdate?.(state.score);handlers.current.onProgressUpdate?.(state.evidence.completions.length,rounds.length);
    if(!sound){state.delivery='unavailable';state.supportReasons=[...new Set([...state.supportReasons,'sound-disabled'])];}
    pauseUpdate();persist(true);publish();if(sound&&!enginePaused)void replay();
    return ()=>{disposed=true;cancelAnimationFrame(raf);voiceTicket++;voice.dispose();cancelGameSfx();observer.disconnect();world?.dispose();document.removeEventListener('keydown',keyDown);document.removeEventListener('keyup',keyUp);window.removeEventListener('blur',blur);document.removeEventListener('visibilitychange',visibility);query?.removeEventListener('change',motion);if(controller.current===api)controller.current=null;};
  // A run owns its controller. Callback changes and audio preference changes
  // must not rebuild the world or erase an in-flight spelling response.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[rounds,difficulty,sessionSeed,startLevel,resumedCheckpoint,progressScopeKey,journey?.index,theme]);
  useEffect(()=>{controller.current?.soundEnabled(isSoundEnabled);},[isSoundEnabled]);
  const item=rounds[game.index],blocked=rendererMode==='loading'||paused||game.phase!=='playing'||game.saveError;
  const move=(key,value)=>controller.current?.move(key,value),focus=()=>field.current?.focus({preventScroll:true}),nudge=key=>controller.current?.nudge(key);
  const tools=<div className="tower-tumble__tools">
    <button type="button" aria-label={game.assist?'Gentle moves':'Free moves'} aria-pressed={game.assist} onClick={()=>controller.current?.assist()} disabled={paused}><PersonSimple size={22}/><span>{game.assist?'Gentle moves':'Free moves'}</span></button>
    <button type="button" aria-label={game.access?'Hide bricks':'Reach bricks'} aria-pressed={game.access} onClick={()=>controller.current?.access()} disabled={paused}><Hammer size={22}/><span>{game.access?'Hide bricks':'Reach bricks'}</span></button>
  </div>;
  const hintButton=game.mistakes>=2&&!game.hintUsed?<button type="button" onClick={()=>controller.current?.hint()} disabled={blocked}>Partial hint</button>:null;
  return <section ref={field} className="tower-tumble" tabIndex={0} aria-label="Tower Tumble platform world" data-child-surface="tower-tumble" data-pal-world={theme.id} data-hero={theme.hero} data-phase={game.phase} data-paused={paused} data-round={game.index} data-renderer={rendererMode} data-lives={game.lives}>
    <header className="tower-tumble__hud">
      <div className="tower-tumble__cue">{!pictureFailed?<img key={item.roundId} src={item.image} alt="Word picture. Hear its name."
        onLoad={()=>{pictureDelivery.current='delivered';}} onError={()=>{pictureDelivery.current='unavailable';setPictureFailed(true);}}/>
        :<button type="button" className="tower-tumble__picture-retry" aria-label="Retry the word picture" disabled={paused} onClick={()=>{pictureDelivery.current='pending';setPictureFailed(false);}}><ArrowClockwise size={24}/><span>Retry picture</span></button>}
        <button type="button" aria-label="Hear the whole word again" disabled={paused||game.phase==='complete'} onClick={()=>controller.current?.replay()}><SpeakerHigh size={26}/><span>Hear</span></button>
      </div>
      <div className="tower-tumble__mission"><strong>{towerTumbleGeometry(item.tower,journey?.index||0,difficulty,game.index).name}</strong><span data-child-instruction>Smash each sound in order. Raise the rescue lift.</span>
        <div className="tower-tumble__slots" aria-label={`${game.unitIndex} of ${item.chunks.length} sounds built`}>{item.chunks.map((chunk,index)=><span key={index} className={index<game.unitIndex?'is-built':''}>{index<game.unitIndex?chunk:'·'}</span>)}</div>
      </div>
      {shortScreen&&hintButton}
      <span className="tower-tumble__progress" data-child-progress>{game.evidence.completions.length} / {rounds.length}<small>rescues</small><span className="tower-tumble__lives" role="status" aria-label={`${game.lives} lives remaining`}>{'♥'.repeat(game.lives)}{'♡'.repeat(TOWER_TUMBLE_LIVES-game.lives)}</span></span>
    </header>
    <div className="tower-tumble__playfield"><div ref={mount} className="tower-tumble__world" aria-hidden="true"/>
      {!shortScreen&&tools}
      {game.access&&<div className="tower-tumble__accessible" role="group" aria-label="Reach and smash a grapheme brick" data-child-choices><p>Choose a brick. {theme.hero} will reach it and swing.</p><div>{item.choices.map(chunk=><button key={chunk} type="button" disabled={blocked} onClick={()=>controller.current?.reach(chunk)} aria-label={`Reach and smash ${chunk} brick`}>{chunk}</button>)}</div></div>}
      {rendererMode==='loading'&&<span className="tower-tumble__loading" role="status">Building {theme.name}…</span>}
      {game.phase==='retry'&&<div className="tower-tumble__retry-route" role="group" aria-label="Retry the route"><strong>Try the route again</strong><span>Your built sounds are saved.</span><button type="button" onClick={()=>controller.current?.retryRoute()} disabled={paused}>Retry route · 3 lives</button></div>}
      {paused&&<div className="tower-tumble__paused"><strong>Paused</strong><span>Your sounds and route are saved.</span></div>}
    </div>
    <div className="tower-tumble__status" role="status" aria-live="polite"><span>{game.feedback}</span>
      {game.hintUsed&&<strong className="tower-tumble__hint" aria-label="Partial spelling hint">{phonicsTargetHint(item.word,game.mistakes)}</strong>}
      {!shortScreen&&hintButton}
      {game.saveError&&<button type="button" onClick={()=>controller.current?.retrySave()} disabled={paused}>Retry save</button>}
    </div>
    <footer className="tower-tumble__controls">
      <div className="tower-tumble__dpad" role="group" aria-label="Move and climb">
        <MoveControl className="tower-tumble__up" direction="up" disabled={blocked} onMove={move} onFocus={focus} onNudge={nudge}><ArrowUp size={28}/></MoveControl>
        <MoveControl className="tower-tumble__left" direction="left" disabled={blocked} onMove={move} onFocus={focus} onNudge={nudge}><ArrowLeft size={28}/></MoveControl>
        <MoveControl className="tower-tumble__down" direction="down" disabled={blocked} onMove={move} onFocus={focus} onNudge={nudge}><ArrowDown size={28}/></MoveControl>
        <MoveControl className="tower-tumble__right" direction="right" disabled={blocked} onMove={move} onFocus={focus} onNudge={nudge}><ArrowRight size={28}/></MoveControl>
      </div>
      {shortScreen&&tools}
      <span className="tower-tumble__keys">Arrows / WASD · Space jump · E smash</span>
      <div className="tower-tumble__actions" role="group" aria-label="Jump and smash">
        <button type="button" className="tower-tumble__jump" disabled={blocked} onClick={()=>{controller.current?.jump();field.current?.focus({preventScroll:true});}}><ArrowUp size={28}/><span>Jump</span></button>
        <button type="button" className="tower-tumble__smash" data-child-primary disabled={blocked} onClick={()=>{controller.current?.strike();field.current?.focus({preventScroll:true});}}><Hammer size={28}/><span>Smash</span></button>
      </div>
      {game.phase==='complete'&&!completionPresentedByPlayer&&<button type="button" className="tower-tumble__replay" onClick={()=>handlers.current.onRequestReplay?.()}><ArrowClockwise size={25}/>Play again</button>}
    </footer>
  </section>;
}

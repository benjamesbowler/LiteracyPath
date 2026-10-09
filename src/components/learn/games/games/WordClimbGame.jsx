import { createLearningDwell, LEARNING_PACE } from "../../../../utils/learningPace.js";
import { isInteractiveKeyTarget } from "../../../../utils/interactiveEventTarget.js";
import { gameRandom } from "../../../../utils/gameReplay.js";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { playCelebrationFanfare, playCorrectChime, playSoftBuzz, playTapSound } from "../../../../utils/audio/gameSfx";
import { speakPhoneme, speakWord } from "../../../../utils/learnGamesAudio.js";
import { rocketRunStars } from "../../../../utils/rocketRunRounds.js";
import { createWordClimbSession } from "../../../../utils/wordClimbLevels.js";
import { onsetGrapheme } from "../../../elQuest/elQuestEngine.js";
import { CLIMB_VIEW_HEIGHT, jumpToClimbPlatform, reachableClimbPlatforms } from "./wordClimbWorld.js";
import { advanceClimbJourney, climbRouteCenter, climbRouteRadius, CLIMB_STAGE_NAMES, createClimbJourney } from "./wordClimbJourney.js";
import WordClimbScene from "./WordClimbScene.jsx";
import { isPacedClimb, pacedClimbSection, pacedClimbSurfaces } from "./wordClimbPacedRoute.js";
import { createLetterLeapFrameMetrics } from "./letterLeapMetrics.js";
import { loadLearnGamesProgress } from "../../../../utils/learnGamesProgress.js";
import { clearClimbSession, climbSessionKey, readClimbSession } from "./wordClimbSession.js";
import { climbViewportMetrics } from "./wordClimbView.js";
import { createWordClimbStepper, pauseWordClimbWorld } from "./wordClimbStepper.js";
import { createWordClimbCue } from "./wordClimbCue.js";
import { WORD_CLIMB_CONSTRUCT, commitWordClimbLanding, wordClimbRounds, applyWordClimbEvidence, addWordClimbMotorEvent, supportWordClimbRound } from "./wordClimbLearning.js";
import { createWordClimbPracticeState, isHistoricalWordClimbCompletion, loadWordClimbPracticeSession, saveWordClimbPracticeSession } from "./wordClimbPracticeSession.js";
import { WORD_CLIMB_CONTENT_VERSION } from "../../../../data/arcadeContentVersions.js";
import "./WordClimbGame.css";

function safeSfx(enabled, effect) { if (enabled) { try { effect(); } catch { /* Playback is optional. */ } } }

export default function WordClimbGame({ difficulty = "easy", startLevel = 0, onScoreUpdate,
  onProgressUpdate, onComplete, onCheckpoint, onEngineReady, onSessionStart, onRequestNextLevel, onRequestReplay, onRequestHistoricalReplay, onExit, sessionSeed = 0, journey = null, isSoundEnabled = true, progressScopeKey = "default" }) {
  const seed=Number.isSafeInteger(sessionSeed)&&sessionSeed>=0?sessionSeed:0;
  const initialChapter=Number.isInteger(journey?.index)&&journey.index>=0&&journey.index<12?journey.index:0;
  const [chapterIndex,setChapterIndex]=useState(initialChapter);
  const sessionKey = climbSessionKey(progressScopeKey,difficulty);
  const [saved] = useState(() => {
    const checkpoint = loadLearnGamesProgress(progressScopeKey).games["word-climb"]?.checkpoints?.[difficulty];
    if(!checkpoint)return null;
    const current=loadWordClimbPracticeSession(progressScopeKey,difficulty,seed,initialChapter);
    if(current)return current;
    const previous=Number(startLevel)>0?readClimbSession(window.localStorage,sessionKey,startLevel,true):null;
    if(!previous?.world.journey)return null;
    const migrated=createWordClimbPracticeState(previous.session,previous.world,{difficulty,seed,journeyIndex:initialChapter,
      originStep:Math.min(previous.world.step,previous.world.summit-1),legacyResume:true,legacyCompletedResume:previous.world.completed});
    migrated.feedback=previous.world.feedback||"Your saved hold is ready.";return migrated;
  });
  const [version,setVersion] = useState(0);
  const [stageIndex,setStageIndex]=useState(saved?.stageIndex ?? (({easy:0,medium:1,hard:2}[difficulty] ?? 0)+initialChapter*3));
  const session = useMemo(() => version===0&&saved ? saved.session : {...createWordClimbSession(difficulty,gameRandom(`${seed}:${stageIndex}`)),stageIndex}, [difficulty,saved,version,stageIndex,seed]);
  const world = useMemo(() => version===0&&saved ? saved.world : createClimbJourney(session,stageIndex,version===0 ? Number(startLevel)||0 : 0,gameRandom(`${seed}:climb-ledges:${stageIndex}`)), [session,startLevel,saved,version,stageIndex,seed]);
  const renderMetrics=useMemo(()=>createLetterLeapFrameMetrics(),[]);
  useLayoutEffect(()=>{renderMetrics.reset();},[world,renderMetrics]);
  const practice=useMemo(()=>version===0&&saved?saved:createWordClimbPracticeState(session,world,{difficulty,seed,journeyIndex:chapterIndex,
    originStep:world.step,legacyResume:version===0&&world.step>0}),[world,session,difficulty,seed,chapterIndex,version,saved]);
  const rounds=useMemo(()=>wordClimbRounds(world,session,practice),[world,session,practice]);
  const historicalCompletion = isHistoricalWordClimbCompletion(practice);
  const [frame, setFrame] = useState(0);
  const [finished,setFinished] = useState(false);
  const [feedback, setFeedback] = useState(saved?.feedback || "Climb ↑, then choose a word.");
  const feedbackRef=useRef(feedback);
  const [selected, setSelected] = useState(1);
  const callbacks = useRef({});
  const input = useRef({ left: false, right: false, up:false });
  const crossingDestination=useRef(null);
  const controlPointers = useRef({});
  const externalPause=useRef(false),pendingSave=useRef(null);
  const [saveHeld,setSaveHeld]=useState(false);
  const cue=useMemo(()=>createWordClimbCue({speak:speakPhoneme,speakFeedback:speakWord}),[]);
  const completionDelay = useRef(null);
  const simulation = useRef(null);
  const completionDwell = useRef(null);
  const summitWord = useRef("");
  const completionReported = useRef(false);
  const replayButton = useRef(null);
  const nextButton=useRef(null);
  const saveButton=useRef(null);
  const worldElement=useRef(null);
  const [viewport,setViewport]=useState({viewHeight:CLIMB_VIEW_HEIGHT,cameraOffset:0});
  useLayoutEffect(()=>{
    const element=worldElement.current;
    const observer=new ResizeObserver(()=>{
      const next=climbViewportMetrics(element.clientWidth,element.clientHeight);
      setViewport(old=>old.viewHeight===next.viewHeight&&old.cameraOffset===next.cameraOffset?old:next);
    });observer.observe(element);return()=>observer.disconnect();
  },[]);
  useLayoutEffect(() => { callbacks.current = { onScoreUpdate, onProgressUpdate, onCheckpoint, onComplete, onSessionStart, onEngineReady, onRequestNextLevel, onRequestReplay, onRequestHistoricalReplay, onExit, isSoundEnabled }; }, [onScoreUpdate, onProgressUpdate, onCheckpoint, onComplete, onSessionStart, onEngineReady, onRequestNextLevel, onRequestReplay, onRequestHistoricalReplay, onExit, isSoundEnabled]);
  const canJump = !world.paused && !world.completed && world.journey.phase==="word" && ["grounded", "landed"].includes(world.state);
  const reachable = reachableClimbPlatforms(world);
  const nextWords = world.platforms.filter(p => p.row === world.step + 1 && p.kind === "word");
  const projectY = y => 100 - (y - world.camera-viewport.cameraOffset) / viewport.viewHeight * 100;
  const pacedProfiles=isPacedClimb(world.journey)?pacedClimbSurfaces(world.journey,world.camera+viewport.cameraOffset,world.camera+viewport.cameraOffset+viewport.viewHeight,viewport.viewHeight/24):null;
  const routeProfile=Array.from({length:25},(_,i)=>{const y=world.camera+viewport.cameraOffset+i*viewport.viewHeight/24;return{center:climbRouteCenter(world.journey,y,world.journey.branchStartX),radius:climbRouteRadius(world.journey,y),screen:viewport.viewHeight-i*viewport.viewHeight/24};});
  const announce = useCallback(message => { feedbackRef.current=message;setFeedback(message); },[]);

  const persist=useCallback(afterSaved=>{
    if(pendingSave.current)return false;
    const receipt=saveWordClimbPracticeSession(progressScopeKey,difficulty,practice,feedbackRef.current);
    if(receipt.localSaved){if(practice.legacyResume)clearClimbSession(window.localStorage,sessionKey);afterSaved?.();return true;}
    pendingSave.current={snapshot:receipt.snapshot,afterSaved};pauseWordClimbWorld(world,true);input.current={left:false,right:false,up:false};crossingDestination.current=null;
    simulation.current?.reset();cue.stop();completionDwell.current?.pause();setSaveHeld(true);return false;
  },[progressScopeKey,difficulty,practice,world,cue,sessionKey,setSaveHeld]);
  const markSupported=useCallback((reason="mission-help")=>{
    const round=rounds.find(item=>item.row===world.step+1);
    if(round&&typeof reason==="string"&&reason.length>0&&reason.length<=80){supportWordClimbRound(practice,round.roundId,reason);persist();}
  },[rounds,world,practice,persist]);
  const retrySave=()=>{
    const held=pendingSave.current;if(!held)return;
    const receipt=saveWordClimbPracticeSession(progressScopeKey,difficulty,held.snapshot,held.snapshot.feedback);
    if(!receipt.localSaved)return;
    pendingSave.current=null;setSaveHeld(false);if(practice.legacyResume)clearClimbSession(window.localStorage,sessionKey);
    pauseWordClimbWorld(world,externalPause.current);simulation.current?.reset();
    if(!world.paused){
      if(!world.completed)void cue.play(session.target);
      if(completionDwell.current?.active)completionDwell.current.waitFor(callbacks.current.isSoundEnabled?cue.playFeedback(summitWord.current):undefined);
      completionDwell.current?.resume();
    }
    held.afterSaved?.();setFrame(n=>n+1);
  };

  const jump = useCallback(id => {
    if (jumpToClimbPlatform(world, id)) {
      renderMetrics.input(performance.now());
      addWordClimbMotorEvent(practice,"jumps");
      safeSfx(callbacks.current.isSoundEnabled, playTapSound);
      announce("Up we go!");
      setFrame(n => n + 1);
    }
  }, [world,announce,practice,renderMetrics]);

  useEffect(() => {
    const pause = () => { externalPause.current=true;simulation.current?.reset();completionDwell.current?.pause();pauseWordClimbWorld(world,true);input.current={left:false,right:false,up:false};crossingDestination.current=null;cue.stop();setFrame(n=>n+1); };
    const resume = () => {
      externalPause.current=false;if(pendingSave.current||completionReported.current)return;
      simulation.current?.reset();pauseWordClimbWorld(world,false);
      if(!world.completed)void cue.play(session.target);
      if(completionDwell.current?.active){completionDwell.current.waitFor(callbacks.current.isSoundEnabled?cue.playFeedback(summitWord.current):undefined);completionDwell.current.resume();}
      const root=worldElement.current?.closest('.word-climb'),main=root?.closest('.lg-game-player-main');
      if(root&&(!main||!main.contains(document.activeElement)))root.focus();setFrame(n=>n+1);
    };
    const inspect=(options={})=>{
      const audio={cue:cue.snapshot(),feedbackCue:cue.feedbackSnapshot(),voiceMix:cue.mixSnapshot()};
      if(options.motionOnly)return structuredClone({world:{x:world.x,y:world.y,camera:world.camera,step:world.step,summit:world.summit,state:world.state,elapsed:world.elapsed,completed:world.completed,paused:world.paused,wrong:world.wrong,motorFalls:world.motorFalls,
        journey:{...world.journey,obstacles:world.journey.obstacles.filter(o=>o.section===world.step&&Math.abs(o.y-world.y)<250),lights:[]}},held:input.current,crossingDestination:crossingDestination.current,saveHeld:Boolean(pendingSave.current)});
      return structuredClone(options.audioOnly?audio:{world,originStep:practice.originStep,stageIndex:practice.stageIndex,legacyResume:practice.legacyResume,
        learning:practice.evidence,...audio,simulation:simulation.current?.inspect(),rendering:renderMetrics.snapshot(),held:input.current,crossingDestination:crossingDestination.current,saveHeld:Boolean(pendingSave.current)});
    };
    callbacks.current.onEngineReady?.({pause,resume,markSupported,inspect,debugSnapshot:inspect});
    return()=>{completionDwell.current?.cancel();input.current={left:false,right:false,up:false};crossingDestination.current=null;cue.stop();};
  },[world,practice,cue,session,markSupported,renderMetrics]);

  useEffect(() => {
    completionDelay.current = null;
    completionDwell.current?.cancel();
    completionReported.current = false;
    if (historicalCompletion) {
      persist(() => { completionReported.current = true; setFinished(true); announce("Your saved summit is complete. Replay for a new climb."); });
      return;
    }
    if (world.completed) {
      summitWord.current = world.event?.platform?.word || world.platforms.find(platform => platform.row === world.summit && platform.kind === "word" && platform.correct)?.word || "";
      completionDwell.current = createLearningDwell({ minimumMs: LEARNING_PACE.word, onAdvance: () => { completionDelay.current = 0; } });
      completionDwell.current.waitFor(callbacks.current.isSoundEnabled && summitWord.current ? cue.playFeedback(summitWord.current) : undefined);
    }
    callbacks.current.onSessionStart?.();
    callbacks.current.onProgressUpdate?.(world.step, world.summit);
    callbacks.current.onScoreUpdate?.(world.step * 10);
    callbacks.current.onCheckpoint?.(Math.min(world.step, world.summit - 1), world.summit);
    persist();
  }, [world,session,persist,historicalCompletion,announce,cue]);

  useEffect(() => {
    const save=()=>{if(!completionReported.current)persist();};
    // Match the racing games' periodic save cadence. Learning transitions and
    // exit still save immediately; serializing the whole progress
    // record during every short climb used to interrupt movement repeatedly.
    const timer=setInterval(save,5000);window.addEventListener("pagehide",save);
    return()=>{clearInterval(timer);window.removeEventListener("pagehide",save);save();};
  },[persist]);
  useEffect(()=>{if(finished)(nextButton.current || replayButton.current)?.focus();},[finished]);
  useEffect(()=>{if(saveHeld)saveButton.current?.focus();else if(!finished){const root=worldElement.current?.closest('.word-climb'),main=root?.closest('.lg-game-player-main');if(root&&(!main||!main.contains(document.activeElement)))root.focus();}},[saveHeld,finished]);

  useEffect(() => {
    let animation;
    let last;
    const handleEvent = event => {
      if (event) {
        const audio = callbacks.current.isSoundEnabled;
        if(["correct","summit","wrong"].includes(event.type)){
          const round=rounds.find(item=>item.row===event.platform.row);
          const committed=commitWordClimbLanding(practice.evidence,round,event.platform.id,{...cue.snapshot(),responseAt:Date.now(),soundEnabled:audio,legacyResume:practice.legacyResume,
            supportReasons:practice.supportReasons[round?.roundId]||[]});
          if(committed)applyWordClimbEvidence(practice,committed.evidence);
          if(event.type==="wrong"&&round)supportWordClimbRound(practice,round.roundId,"contrast-teaching-after-error");
        } else if(event.type==="fall")addWordClimbMotorEvent(practice,"falls");
        else if(event.type==="light")addWordClimbMotorEvent(practice,"lights");
        if (event.type === "correct" || event.type === "summit") {
          announce(`${event.platform.word} starts with /${session.target}/. Keep climbing!`);
          safeSfx(audio, playCorrectChime);
          const readback = audio ? cue.playFeedback(event.platform.word) : undefined;
          callbacks.current.onScoreUpdate?.(world.step * 10);
          callbacks.current.onProgressUpdate?.(world.step, world.summit);
          callbacks.current.onCheckpoint?.(Math.min(world.step, world.summit - 1), world.summit);
          if (event.type === "summit") {
            summitWord.current = event.platform.word;
            completionDwell.current?.cancel();
            completionDwell.current = createLearningDwell({ minimumMs: LEARNING_PACE.word, onAdvance: () => { completionDelay.current = 0; } });
            completionDwell.current.waitFor(readback);
          }
        } else if (event.type === "wrong") {
          const onset = onsetGrapheme(event.platform.word) || event.platform.word[0];
          announce(`${event.platform.word} starts with /${onset}/. Try a /${session.target}/ word.`);
          safeSfx(audio, playSoftBuzz);
          if (audio) void cue.playFeedback(event.platform.word);
        } else if (event.type === "fall") {
          announce(event.reason==="branch"?"Climb around the branch. Your last hold is safe.":"The safety vine caught you. Try that move again.");
        } else if(event.type==="bough"){
          announce(event.phase==="out"?"Choose a bough. Cross left or right.":"Cross back to the canopy.");
        } else if(event.type==="crossed"){
          announce("A new tree! Climb to the next resting place.");
        } else if(event.type==="station"){
          announce("Choose a word ledge. ← → to aim, ↑ to jump.");
        } else if(event.type==="light"){
          safeSfx(audio,playTapSound);announce("Lantern light found!");
        }
        persist();
      }
    };
    const handleStep = dt => {
      if (!world.paused && completionDelay.current !== null) {
        completionDelay.current -= dt;
        if (completionDelay.current <= 0) {
          completionDelay.current = null;
          const evidence=structuredClone({...practice.evidence,contentVersion:WORD_CLIMB_CONTENT_VERSION,construct:WORD_CLIMB_CONSTRUCT,practiceOnly:true,
            sessionSeed:seed,journeyIndex:chapterIndex,stageIndex:practice.stageIndex,originStep:practice.originStep,legacyResume:practice.legacyResume,
            nativeV2LandingCount:practice.evidence.firstResponses.length+practice.evidence.assistedRetries.length});
          persist(()=>{completionReported.current=true;safeSfx(callbacks.current.isSoundEnabled,playCelebrationFanfare);
            callbacks.current.onComplete?.(rocketRunStars(world.step,world.summit,world.wrong),world.step*10,world.step,evidence);setFinished(true);});
        }
      }
    };
    const stepper = createWordClimbStepper(world,advanceClimbJourney,handleEvent,handleStep);
    simulation.current = stepper;
    const tick = time => {
      if (document.hidden || world.paused) { last = undefined; stepper.reset(); }
      else {
        const dt = last === undefined ? 0 : Math.max(0,(time-last)/1000);
        last=time;
        let movement=input.current;
        if(crossingDestination.current){
          if(!world.journey.crossing||world.journey.phase!=="climb")crossingDestination.current=null;
          else{
            const delta=crossingDestination.current.x-world.x;
            movement={left:delta<0,right:delta>0,up:false};
          }
        }
        stepper.advance(dt,movement);
        setFrame(n => n + 1);
      }
      animation = requestAnimationFrame(tick);
    };
    animation = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(animation); stepper.reset(); if(simulation.current===stepper)simulation.current=null; };
  }, [session,world,announce,practice,rounds,cue,persist,seed,chapterIndex]);

  useEffect(() => () => completionDwell.current?.cancel(), []);
  useEffect(() => { cue.setEnabled(isSoundEnabled);if (!isSoundEnabled) cue.stop(); else if (!world.paused&&!world.completed)void cue.play(session.target); }, [isSoundEnabled,session.target,world,cue]);
  useEffect(()=>()=>cue.dispose(),[cue]);
  useEffect(() => {
    const clear = () => {
      input.current = { left: false, right: false,up:false };crossingDestination.current=null;
      simulation.current?.reset();
      controlPointers.current = {};
      worldElement.current?.parentElement.querySelectorAll("[data-wc-control]").forEach(button => delete button.dataset.pressed);
    };
    // A destination button disables during flight and may lose focus to body.
    // Release held keys even when keyup no longer bubbles through the game.
    const release = event => {
      const key=event.key.toLowerCase();
      if (["arrowleft","a"].includes(key)) input.current.left=false;
      if (["arrowright","d"].includes(key)) input.current.right=false;
      if (["arrowup","w"," ","enter"].includes(key)) input.current.up=false;
    };
    const hidden=()=>{if(document.hidden)clear();};
    window.addEventListener("blur", clear);
    document.addEventListener("visibilitychange",hidden);
    window.addEventListener("keyup", release);
    return () => { window.removeEventListener("blur", clear); window.removeEventListener("keyup", release); document.removeEventListener("visibilitychange",hidden); };
  }, []);

  const setDirection = (direction, down) => { if(down&&(world.paused||world.completed))return;if(down)crossingDestination.current=null;if(down&&!input.current[direction])renderMetrics.input(performance.now());input.current[direction] = down; };
  const replay = (next=false) => {
    if (historicalCompletion && callbacks.current.onRequestHistoricalReplay) {
      callbacks.current.onRequestHistoricalReplay();
      return;
    }
    const request = next ? callbacks.current.onRequestNextLevel : callbacks.current.onRequestReplay;
    if (request) { request(); return; }
    if(callbacks.current.onSessionStart?.()===false)return;
    cue.stop();clearClimbSession(window.localStorage,sessionKey);input.current={left:false,right:false,up:false};crossingDestination.current=null;
    setFinished(false);announce("Climb ↑, then choose a word.");setSelected(1);if(next){const chapter=(chapterIndex+1)%12;setChapterIndex(chapter);setStageIndex(({easy:0,medium:1,hard:2}[difficulty]??0)+chapter*3);}setVersion(n=>n+1);
  };
  const onKeyDown = event => {
    if (event.altKey || event.metaKey || event.ctrlKey || world.paused || finished) return;
    if (isInteractiveKeyTarget(event.target, event.key) && !event.target.closest?.(".word-climb")) return;
    const key = event.key.toLowerCase();
    if (["arrowleft", "a", "arrowright", "d"].includes(key)) {
      event.preventDefault();
      const right = key === "arrowright" || key === "d";
      setDirection(right ? "right" : "left", true);
      if (!event.repeat && canJump) setSelected(n => (n + (right ? 1 : 2)) % 3);
    } else if (["arrowup", "w"].includes(key) || (event.target.tagName !== "BUTTON" && [" ", "enter"].includes(key))) {
      event.preventDefault();setDirection("up",true);if(canJump&&!event.repeat)jump(reachable[selected]?.id);
    }
  };

  // Accept movement immediately on opening, including when focus is still on
  // the surrounding game frame. Native toolbar buttons retain their own keys.
  const keyboardHandler = useRef(onKeyDown);
  useLayoutEffect(() => { keyboardHandler.current = onKeyDown; });
  useEffect(() => {
    const handle = event => keyboardHandler.current(event);
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, []);

  const crossTo=useCallback(side=>{
    if(world.paused||world.completed||!world.journey.crossing)return;
    const route=pacedClimbSection(world.journey,world.step);
    crossingDestination.current={x:world.journey.crossing.phase==="out"?500+side*route.span:500,y:world.y};
    input.current={left:false,right:false,up:false};renderMetrics.input(performance.now());
  },[world,renderMetrics]);
  function controlButton(direction) {
    const press = () => {
      if (world.paused || world.completed) return;
      if (canJump) {
        if (direction === "up") jump(reachable[selected]?.id);
        else setSelected(value => (value + (direction === "right" ? 1 : 2)) % 3);
      } else setDirection(direction, true);
    };
    const release = event => {
      if (event.pointerId !== undefined && controlPointers.current[direction] !== event.pointerId) return;
      delete event.currentTarget.dataset.pressed;
      delete controlPointers.current[direction];
      setDirection(direction, false);
    };
    return <button type="button" key={direction} data-wc-control={direction}
      aria-label={direction === "up" ? (canJump ? "Jump to selected ledge" : "Climb upward") : `Move ${direction}`}
      onPointerDown={event => {
        event.preventDefault(); event.stopPropagation();
        if (controlPointers.current[direction] !== undefined) return;
        controlPointers.current[direction] = event.pointerId;
        event.currentTarget.setPointerCapture(event.pointerId); event.currentTarget.dataset.pressed="true"; press();
      }}
      onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release}
      onBlur={event => { delete event.currentTarget.dataset.pressed; setDirection(direction, false); }}
      onKeyDown={event => {
        if ([" ", "Enter"].includes(event.key)) { event.preventDefault(); event.stopPropagation(); if (!event.repeat) press(); }
      }} onKeyUp={event => { event.stopPropagation(); setDirection(direction, false); }}>
      <span aria-hidden="true">{direction === "left" ? "←" : direction === "up" ? "↑" : "→"}</span>
      {direction === "up" && <small>{canJump ? "JUMP" : "CLIMB"}</small>}
    </button>;
  }

  return <section className="word-climb" aria-label={`Word Climb. Choose words that start with ${session.target}.`}
    tabIndex={0} onKeyUp={event => {
      if (["arrowleft", "a"].includes(event.key.toLowerCase())) setDirection("left", false);
      if (["arrowright", "d"].includes(event.key.toLowerCase())) setDirection("right", false);
      if (["arrowup", "w"," ","enter"].includes(event.key.toLowerCase())) setDirection("up", false);
    }} data-wc-progress={world.step} data-world-height={world.y.toFixed(2)} data-camera-height={world.camera.toFixed(2)}
    data-motion-state={world.state} data-motor-falls={world.motorFalls} data-reading-errors={world.wrong} data-standing-ledge={world.standingId || ""} data-frame={frame}
    data-layout-revision={world.journey.layoutRevision || "retained"} data-crossing={world.journey.crossing?.phase || ""} data-climb-stage={stageIndex} data-journey-phase={world.journey.phase} data-route-center={climbRouteCenter(world.journey,world.y,world.journey.branchStartX).toFixed(2)} data-world-x={world.x.toFixed(2)} data-lights={world.journey.collected.length}>
    <header className="wc-mission-card" inert={finished || saveHeld || undefined}>
      <h2><span className="wc-stage-label">{stageIndex%3+1} · {CLIMB_STAGE_NAMES[stageIndex%3]}</span>Find <strong data-wc="target">/{session.target}/</strong> words</h2>
      <span className="wc-height">{world.step}/{world.summit} <span>words</span></span>
      <button className="wc-replay" data-wc="replay" type="button" disabled={!isSoundEnabled}
        aria-label={isSoundEnabled ? `Hear the ${session.target} sound again` : `Target is ${session.target}; sound is off`}
        onClick={() => { if (!world.paused) { const voice = cue.play(session.target); completionDwell.current?.waitFor(voice); } }}>♪</button>
    </header>
    <div ref={worldElement} className="wc-world" data-wc="world" data-view-height={viewport.viewHeight} inert={finished || saveHeld || undefined}>
      <WordClimbScene world={world} difficulty={difficulty} renderMetrics={renderMetrics} />
      {world.journey.phase === "climb" && <div className="wc-next-words" aria-label={world.journey.crossing ? "Choose a physical bough" : "Words on the next ledges"}>
        {isPacedClimb(world.journey)&&world.journey.crossing ? <>
          <span>{pacedClimbSection(world.journey,world.step).place}</span>
          <div className="wc-cross-controls">{world.journey.crossing.phase==="out"?<><button type="button" onClick={()=>crossTo(-1)} aria-label="Cross left bough">← Left bough</button><button type="button" onClick={()=>crossTo(1)} aria-label="Cross right bough">Right bough →</button></>:<button type="button" onClick={()=>crossTo(world.journey.crossing.side)}>Cross to the canopy</button>}</div>
        </>:<><span>Next ledges ↑</span><div>{nextWords.map(p => <strong key={p.id}>{p.word}</strong>)}</div></>}
      </div>}
      <svg className="wc-branches" viewBox={`0 0 1000 ${viewport.viewHeight}`} preserveAspectRatio="none" aria-hidden="true">
        {pacedProfiles?pacedProfiles.map((surface,index)=><polygon key={index} points={[...surface.points.map(p=>`${p.x-p.radius},${projectY(p.y)*viewport.viewHeight/100}`),...[...surface.points].reverse().map(p=>`${p.x+p.radius},${projectY(p.y)*viewport.viewHeight/100}`)].join(" ")} fill="#785232" />):<polygon points={[...routeProfile.map(p=>`${p.center-p.radius},${p.screen}`),...[...routeProfile].reverse().map(p=>`${p.center+p.radius},${p.screen}`)].join(" ")} fill="#785232" />}
        {isPacedClimb(world.journey)&&world.platforms.filter(p=>p.id.startsWith("cross-")&&Math.abs(p.y-world.y)<600).map(p=><rect key={p.id} x={p.x-p.width/2} y={projectY(p.y)*viewport.viewHeight/100} width={p.width} height="12" rx="6" fill="#785232" />)}
        {world.journey.obstacles.filter(o=>Math.abs(o.y-world.y)<600).map(o=><g key={o.id} transform={`translate(${o.x},${projectY(o.y)*viewport.viewHeight/100})`}>
          <rect x={-o.width/2} y="-9" width={o.width} height="18" rx="6" fill="#7b2540" stroke="#ffe3ad" strokeWidth="5" />
          {[-1,0,1].map(k=><path key={k} d={`M${k*o.width*.27-10} -7 L${k*o.width*.27+4} -27 L${k*o.width*.27+12} -7 Z`} fill="#ffe3ad" />)}
        </g>)}
        {world.journey.lights.filter(o=>!world.journey.collected.includes(o.id)&&Math.abs(o.y-world.y)<600).map(o=><ellipse key={o.id} cx={o.x} cy={projectY(o.y)*viewport.viewHeight/100} rx="15" ry="7" fill="#ffdc83" />)}

        {["clinging", "recovering"].includes(world.state) && <path className="wc-safety-vine" d={`M500 ${viewport.viewHeight - (world.y - world.camera - viewport.cameraOffset) - 180} Q${world.x + 50} ${viewport.viewHeight - (world.y - world.camera - viewport.cameraOffset) - 110} ${world.x} ${viewport.viewHeight - (world.y - world.camera - viewport.cameraOffset) - 20}`} />}
      </svg>
      {world.platforms.filter(p => Math.abs(p.y - world.camera) < 560).map(p => {
        if(p.kind==="rest")return null;
        const active = reachable.some(choice=>choice.id===p.id);
        return <button key={p.id} type="button" className={`wc-word-ledge${active ? " is-reachable" : ""}${p.id === world.standingId ? " is-standing" : ""}`}
          data-wc={active ? "choice" : "ledge"} data-state={p.id === world.standingId && world.state === "clinging" && active && !p.correct ? "wrong" : undefined} data-ledge-id={p.id} data-world-y={p.y} data-world-x={p.x}
          data-selected={active && reachable[selected]?.id === p.id || undefined}
          style={{ left: `${p.x / 10}%`, top: `${projectY(p.y)}%`, width: `${p.width / 10}%` }}
          aria-label={active ? `Climb to ${p.word}` : p.word ? `Passed ${p.word} ledge` : "Root resting ledge"}
          tabIndex={active ? 0 : -1} disabled={!active || !canJump} onClick={() => jump(p.id)}>
          <strong>{p.word || "✦"}</strong><span className="wc-engraving" aria-hidden="true" />
        </button>;
      })}
      <div className={`wc-climber ${world.state}`} aria-hidden="true"
        style={{ left: `${world.x / 10}%`, top: `${projectY(world.y)}%`, "--wc-tilt": `${Math.max(-15, Math.min(15, world.vx / 35))}deg` }}>
        <span className="wc-climber-shadow" />
        <img draggable="false" src="/game-assets/sound-seekers/v3/cast/moonwood/pip-hero.webp" alt="" />
      </div>
    </div>
    <div className="wc-bottom-bar" inert={finished || saveHeld || undefined}>
      <div className="wc-air-controls" aria-label="Climb and steer">
        <div className="wc-steer-controls">{["left", "right"].map(controlButton)}</div>
        {controlButton("up")}
      </div>
    </div>
    <p className="wc-feedback" data-wc="feedback" role="status" aria-live="polite" inert={finished || saveHeld || undefined}>{feedback}</p>
    {saveHeld&&<div className="wc-save-dialog" role="alertdialog" aria-modal="true" aria-label="Keep your climb"
      onKeyDown={event=>{if(event.key==='Tab'){event.preventDefault();saveButton.current?.focus();}event.stopPropagation();}}>
      <h2>Keep your climb</h2><p>This device could not save. Your exact climb is held here.</p>
      <button type="button" ref={saveButton} onClick={retrySave}>Retry save</button>
    </div>}
    {finished && <div className="wc-summit-dialog" role="alertdialog" aria-modal="true" aria-label="Word Climb complete"
      onKeyDown={event=>{if(event.key==="Tab"){event.preventDefault();const next=document.activeElement===nextButton.current?replayButton.current:nextButton.current; (next || replayButton.current)?.focus();}event.stopPropagation();}}>
      <span aria-hidden="true">✦</span><h2>{historicalCompletion ? "Your saved summit" : "Canopy reached!"}</h2><p>{world.step} {historicalCompletion ? "saved words" : "words"} · {world.step*10} {historicalCompletion ? "saved points" : "points"} · {world.journey.collected.length} lights</p>
      {historicalCompletion ? onExit && <button type="button" ref={nextButton} onClick={onExit}>Return to games</button>
        : <button type="button" ref={nextButton} onClick={()=>replay(true)}>Next ascent</button>}
      <button type="button" ref={replayButton} onClick={()=>replay(false)}>Replay this ascent</button>
    </div>}
  </section>;
}

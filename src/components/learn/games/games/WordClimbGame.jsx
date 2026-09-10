import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { playCelebrationFanfare, playCorrectChime, playSoftBuzz, playTapSound } from "../../../../utils/audio/gameSfx";
import { cancelSpeech, speakPhoneme, speakWord } from "../../../../utils/learnGamesAudio.js";
import { rocketRunStars } from "../../../../utils/rocketRunRounds.js";
import { createWordClimbSession } from "../../../../utils/wordClimbLevels.js";
import { onsetGrapheme } from "../../../elQuest/elQuestEngine.js";
import { CLIMB_VIEW_HEIGHT, jumpToClimbPlatform, reachableClimbPlatforms } from "./wordClimbWorld.js";
import { advanceClimbJourney, climbRouteCenter, climbRouteRadius, CLIMB_STAGE_NAMES, createClimbJourney } from "./wordClimbJourney.js";
import WordClimbScene from "./WordClimbScene.jsx";
import { loadLearnGamesProgress } from "../../../../utils/learnGamesProgress.js";
import { clearClimbSession, climbSessionKey, readClimbSession, writeClimbSession } from "./wordClimbSession.js";
import { climbViewportMetrics } from "./wordClimbView.js";
import "./WordClimbGame.css";

function safeSfx(enabled, effect) { if (enabled) { try { effect(); } catch { /* Playback is optional. */ } } }

export default function WordClimbGame({ difficulty = "easy", startLevel = 0, onScoreUpdate,
  onProgressUpdate, onComplete, onCheckpoint, onEngineReady, onSessionStart, onRequestNextLevel, onRequestReplay, sessionSeed = 0, isSoundEnabled = true, progressScopeKey = "default" }) {
  const sessionKey = climbSessionKey(progressScopeKey,difficulty);
  const [saved] = useState(() => {
    const checkpoint = loadLearnGamesProgress(progressScopeKey).games["word-climb"]?.checkpoints?.[difficulty];
    const value=readClimbSession(window.localStorage,sessionKey,startLevel,checkpoint !== undefined);
    return value?.world.journey?value:null;
  });
  const [version,setVersion] = useState(0);
  const [stageIndex,setStageIndex]=useState(saved?.world.journey.stageIndex ?? (({easy:0,medium:1,hard:2}[difficulty] ?? 0) + Math.max(0,Number(sessionSeed)||0)*3));
  const session = useMemo(() => version===0&&saved ? saved.session : {...createWordClimbSession(difficulty),stageIndex}, [difficulty,saved,version,stageIndex]);
  const world = useMemo(() => version===0&&saved ? saved.world : createClimbJourney(session,stageIndex,version===0 ? Number(startLevel)||0 : 0), [session,startLevel,saved,version,stageIndex]);
  const [frame, setFrame] = useState(0);
  const [finished,setFinished] = useState(false);
  const [feedback, setFeedback] = useState(saved?.world.feedback || "Climb around branches to reach the word ledges.");
  const feedbackRef=useRef(feedback);
  const [selected, setSelected] = useState(1);
  const callbacks = useRef({});
  const input = useRef({ left: false, right: false, up:false });
  const completionDelay = useRef(null);
  const completionReported = useRef(false);
  const replayButton = useRef(null);
  const nextButton=useRef(null);
  const worldElement=useRef(null);
  const [viewport,setViewport]=useState({viewHeight:CLIMB_VIEW_HEIGHT,cameraOffset:0});
  useLayoutEffect(()=>{
    const element=worldElement.current;
    const observer=new ResizeObserver(()=>{
      const next=climbViewportMetrics(element.clientWidth,element.clientHeight);
      setViewport(old=>old.viewHeight===next.viewHeight&&old.cameraOffset===next.cameraOffset?old:next);
    });observer.observe(element);return()=>observer.disconnect();
  },[]);
  useLayoutEffect(() => { callbacks.current = { onScoreUpdate, onProgressUpdate, onCheckpoint, onComplete, onSessionStart, onEngineReady, onRequestNextLevel, onRequestReplay, isSoundEnabled }; }, [onScoreUpdate, onProgressUpdate, onCheckpoint, onComplete, onSessionStart, onEngineReady, onRequestNextLevel, onRequestReplay, isSoundEnabled]);
  const canJump = !world.paused && !world.completed && world.journey.phase==="word" && ["grounded", "landed"].includes(world.state);
  const reachable = reachableClimbPlatforms(world);
  const projectY = y => 100 - (y - world.camera-viewport.cameraOffset) / viewport.viewHeight * 100;
  const routeProfile=Array.from({length:25},(_,i)=>{const y=world.camera+viewport.cameraOffset+i*viewport.viewHeight/24;return{center:climbRouteCenter(world.journey,y,world.journey.branchStartX),radius:climbRouteRadius(world.journey,y),screen:viewport.viewHeight-i*viewport.viewHeight/24};});
  const announce = useCallback(message => { feedbackRef.current=message;setFeedback(message); },[]);

  const jump = useCallback(id => {
    if (jumpToClimbPlatform(world, id)) {
      safeSfx(callbacks.current.isSoundEnabled, playTapSound);
      announce("Up we go!");
      setFrame(n => n + 1);
    }
  }, [world,announce]);

  useEffect(() => {
    const pause = () => { world.paused = true; input.current = { left: false, right: false,up:false }; cancelSpeech(); setFrame(n => n + 1); };
    const resume = () => { world.paused = false; setFrame(n => n + 1); };
    callbacks.current.onEngineReady?.({ pause, resume });
    return () => { input.current = { left: false, right: false,up:false }; cancelSpeech(); };
  }, [world]);

  useEffect(() => {
    completionDelay.current = world.completed ? .85 : null;
    completionReported.current = false;
    callbacks.current.onSessionStart?.();
    callbacks.current.onProgressUpdate?.(world.step, world.summit);
    callbacks.current.onScoreUpdate?.(world.step * 10);
    callbacks.current.onCheckpoint?.(Math.min(world.step, world.summit - 1), world.summit);
    writeClimbSession(window.localStorage,sessionKey,session,world,feedbackRef.current);
  }, [world,sessionKey,session]);

  useEffect(() => {
    const save=()=>{if(!completionReported.current)writeClimbSession(window.localStorage,sessionKey,session,world,feedbackRef.current);};
    const timer=setInterval(save,600);window.addEventListener("pagehide",save);
    return()=>{clearInterval(timer);window.removeEventListener("pagehide",save);save();};
  },[sessionKey,session,world]);
  useEffect(()=>{if(finished)nextButton.current?.focus();},[finished]);

  useEffect(() => {
    let animation;
    let last;
    const tick = time => {
      const dt = last === undefined ? 0 : Math.min((time - last) / 1000, 0.05);
      last = time;
      advanceClimbJourney(world,dt,input.current);
      const event = world.event;
      if (event) {
        const audio = callbacks.current.isSoundEnabled;
        if (event.type === "correct" || event.type === "summit") {
          announce(`${event.platform.word} starts with /${session.target}/. Keep climbing!`);
          safeSfx(audio, playCorrectChime);
          if (audio) void speakWord(event.platform.word);
          callbacks.current.onScoreUpdate?.(world.step * 10);
          callbacks.current.onProgressUpdate?.(world.step, world.summit);
          callbacks.current.onCheckpoint?.(Math.min(world.step, world.summit - 1), world.summit);
          if (event.type === "summit") completionDelay.current = 0.85;
        } else if (event.type === "wrong") {
          const onset = onsetGrapheme(event.platform.word) || event.platform.word[0];
          announce(`${event.platform.word} starts with /${onset}/. Try a /${session.target}/ word.`);
          safeSfx(audio, playSoftBuzz);
          if (audio) void speakWord(event.platform.word);
        } else if (event.type === "fall") {
          announce(event.reason==="branch"?"Climb around the branch. Your last hold is safe.":"The safety vine caught you. Try that move again.");
        } else if(event.type==="station"){
          announce("Choose a word ledge.");
        } else if(event.type==="light"){
          safeSfx(audio,playTapSound);announce("Lantern light found!");
        }
        writeClimbSession(window.localStorage,sessionKey,session,world,feedbackRef.current);
      }
      if (!world.paused && completionDelay.current !== null) {
        completionDelay.current -= dt;
        if (completionDelay.current <= 0) {
          completionDelay.current = null;
          completionReported.current = true;
          safeSfx(callbacks.current.isSoundEnabled, playCelebrationFanfare);
          callbacks.current.onComplete?.(rocketRunStars(world.step, world.summit, world.wrong), world.step * 10, world.step);
          clearClimbSession(window.localStorage,sessionKey);
          setFinished(true);
        }
      }
      if (!world.paused) setFrame(n => n + 1);
      animation = requestAnimationFrame(tick);
    };
    animation = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animation);
  }, [session, sessionKey, world,announce]);

  useEffect(() => { if (!isSoundEnabled) cancelSpeech(); else if (!world.paused) void speakPhoneme(session.target); }, [isSoundEnabled, session.target, world]);
  useEffect(() => {
    const clear = () => { input.current = { left: false, right: false,up:false }; };
    // A destination button disables during flight and may lose focus to body.
    // Release held keys even when keyup no longer bubbles through the game.
    const release = event => {
      const key=event.key.toLowerCase();
      if (["arrowleft","a"].includes(key)) input.current.left=false;
      if (["arrowright","d"].includes(key)) input.current.right=false;
      if (["arrowup","w"," ","enter"].includes(key)) input.current.up=false;
    };
    window.addEventListener("blur", clear);
    window.addEventListener("keyup", release);
    return () => { window.removeEventListener("blur", clear); window.removeEventListener("keyup", release); };
  }, []);

  const setDirection = (direction, down) => { if(down&&(world.paused||world.completed))return;input.current[direction] = down; };
  const replay = (next=false) => {
    const request = next ? callbacks.current.onRequestNextLevel : callbacks.current.onRequestReplay;
    if (request) { request(); return; }
    if(callbacks.current.onSessionStart?.()===false)return;
    cancelSpeech();clearClimbSession(window.localStorage,sessionKey);input.current={left:false,right:false,up:false};
    setFinished(false);announce("Climb around branches to reach the word ledges.");setSelected(1);if(next)setStageIndex(n=>n+1);setVersion(n=>n+1);
  };
  const onKeyDown = event => {
    if (event.altKey || event.metaKey || event.ctrlKey || world.paused) return;
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

  return <section className="word-climb" aria-label={`Word Climb. Choose words that start with ${session.target}.`}
    tabIndex={0} onKeyDown={onKeyDown} onKeyUp={event => {
      if (["arrowleft", "a"].includes(event.key.toLowerCase())) setDirection("left", false);
      if (["arrowright", "d"].includes(event.key.toLowerCase())) setDirection("right", false);
      if (["arrowup", "w"," ","enter"].includes(event.key.toLowerCase())) setDirection("up", false);
    }} data-wc-progress={world.step} data-world-height={world.y.toFixed(2)} data-camera-height={world.camera.toFixed(2)}
    data-motion-state={world.state} data-motor-falls={world.motorFalls} data-reading-errors={world.wrong} data-standing-ledge={world.standingId || ""} data-frame={frame}
    data-climb-stage={stageIndex} data-journey-phase={world.journey.phase} data-route-center={climbRouteCenter(world.journey,world.y,world.journey.branchStartX).toFixed(2)} data-world-x={world.x.toFixed(2)} data-lights={world.journey.collected.length}>
    <header className="wc-mission-card" inert={finished || undefined}>
      <h2><span className="wc-stage-label">{stageIndex%3+1} · {CLIMB_STAGE_NAMES[stageIndex%3]} · {world.journey.collected.length} lights</span>Climb with <strong data-wc="target">/{session.target}/</strong></h2>
      <span className="wc-height">{world.step}/{world.summit} <span>words</span></span>
      <button className="wc-replay" data-wc="replay" type="button" disabled={!isSoundEnabled}
        aria-label={isSoundEnabled ? `Hear the ${session.target} sound again` : `Target is ${session.target}; sound is off`}
        onClick={() => { if (!world.paused) void speakPhoneme(session.target); }}>♪</button>
    </header>
    <div ref={worldElement} className="wc-world" data-wc="world" data-view-height={viewport.viewHeight} inert={finished || undefined}>
      <WordClimbScene world={world} />
      <svg className="wc-branches" viewBox={`0 0 1000 ${viewport.viewHeight}`} preserveAspectRatio="none" aria-hidden="true">
        <polygon points={[...routeProfile.map(p=>`${p.center-p.radius},${p.screen}`),...[...routeProfile].reverse().map(p=>`${p.center+p.radius},${p.screen}`)].join(" ")} fill="#785232" />
        {world.journey.obstacles.filter(o=>Math.abs(o.y-world.y)<600).map(o=><rect key={o.id} x={o.x-o.width/2} y={projectY(o.y)*viewport.viewHeight/100-9} width={o.width} height="18" rx="6" fill="#442f20" stroke="#c59863" strokeWidth="2" />)}
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
    <div className="wc-bottom-bar" inert={finished || undefined}>
      <p data-wc="feedback" role="status" aria-live="polite">{feedback}</p>
      <div className="wc-air-controls" aria-label="Climb and steer">
        {["left", "up", "right"].map(direction => <button type="button" key={direction} aria-label={direction==="up"?(canJump?"Jump to selected ledge":"Climb upward"):`Move ${direction}`}
          onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); if(direction==="up"&&canJump)jump(reachable[selected]?.id);else setDirection(direction, true); }}
          onPointerUp={() => setDirection(direction, false)} onPointerCancel={() => setDirection(direction, false)}
          onLostPointerCapture={() => setDirection(direction, false)} onBlur={() => setDirection(direction, false)}
          onKeyDown={event => { if ([" ", "Enter"].includes(event.key)){event.preventDefault();if(direction==="up"&&canJump&&!event.repeat)jump(reachable[selected]?.id);else setDirection(direction, true);} }}
          onKeyUp={() => setDirection(direction, false)}>{direction === "left" ? "←" : direction==="up"?"↑":"→"}</button>)}
      </div>
    </div>
    {finished && <div className="wc-summit-dialog" role="alertdialog" aria-modal="true" aria-label="Word Climb complete"
      onKeyDown={event=>{if(event.key==="Tab"){event.preventDefault();(document.activeElement===nextButton.current?replayButton:nextButton).current?.focus();}event.stopPropagation();}}>
      <span aria-hidden="true">✦</span><h2>Canopy reached!</h2><p>{world.step} words · {world.step*10} points · {world.journey.collected.length} lights</p>
      <button type="button" ref={nextButton} onClick={()=>replay(true)}>Next ascent</button>
      <button type="button" ref={replayButton} onClick={()=>replay(false)}>Replay this ascent</button>
    </div>}
  </section>;
}

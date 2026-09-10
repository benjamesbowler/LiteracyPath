import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { playCelebrationFanfare, playCorrectChime, playSoftBuzz, playTapSound } from "../../../../utils/audio/gameSfx";
import { cancelSpeech, speakPhoneme, speakWord } from "../../../../utils/learnGamesAudio.js";
import { rocketRunStars } from "../../../../utils/rocketRunRounds.js";
import { createWordClimbSession } from "../../../../utils/wordClimbLevels.js";
import { onsetGrapheme } from "../../../elQuest/elQuestEngine.js";
import { advanceClimbWorld, CLIMB_VIEW_HEIGHT, createClimbWorld, jumpToClimbPlatform, reachableClimbPlatforms } from "./wordClimbWorld.js";
import "./WordClimbGame.css";

function safeSfx(enabled, effect) { if (enabled) { try { effect(); } catch { /* Playback is optional. */ } } }

function ClimbScenery({ summit, camera }) {
  const height = summit * 210 + 600;
  const trunk = useMemo(() => {
    const points = [];
    for (let y = 0; y <= height; y += 25) points.push(`${500 + Math.sin(y / 155) * 32},${y}`);
    return `M${points.join(" L")}`;
  }, [height]);
  return <>
    <div className="wc-distant-canopy" aria-hidden="true" style={{ transform: `translateY(${camera * .025}px)` }} />
    <svg className="wc-living-trunk" aria-hidden="true" viewBox={`0 0 1000 ${height}`} preserveAspectRatio="none"
      style={{ top: `${100 - (height - 160 - camera) / CLIMB_VIEW_HEIGHT * 100}%`, height: `${height / CLIMB_VIEW_HEIGHT * 100}%` }}>
      <defs>
        <linearGradient id="wc-bark" x1="0" x2="1"><stop stopColor="#153e36" /><stop offset=".28" stopColor="#4d9b53" /><stop offset=".53" stopColor="#b8dc77" /><stop offset=".75" stopColor="#42864c" /><stop offset="1" stopColor="#123f34" /></linearGradient>
        <linearGradient id="wc-foliage"><stop stopColor="#a5d36d" /><stop offset=".5" stopColor="#559b52" /><stop offset="1" stopColor="#245840" /></linearGradient>
        <linearGradient id="wc-cloud-shade" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#f3f8e5" stopOpacity=".8"/><stop offset="1" stopColor="#b6d8c9" stopOpacity=".15"/></linearGradient>
      </defs>
      {Array.from({ length: summit + 2 }, (_, i) => {
        const y = i * 210 + 100;
        const left = i % 2 === 0;
        return <g key={i}>
          <path d={left ? `M485 ${y + 65} Q365 ${y + 60} 330 ${y}` : `M520 ${y + 65} Q640 ${y + 60} 680 ${y}`} fill="none" stroke="#2a6246" strokeWidth="13"/>
          <path d={left ? `M340 ${y} Q240 ${y - 100} 120 ${y - 20} Q180 ${y + 75} 340 ${y}Z` : `M670 ${y} Q780 ${y - 100} 890 ${y - 20} Q830 ${y + 75} 670 ${y}Z`} fill="url(#wc-foliage)"/>
          <path d={left ? `M145 ${y - 18} Q245 ${y + 14} 335 ${y}` : `M865 ${y - 18} Q770 ${y + 14} 675 ${y}`} fill="none" stroke="#c7eaa4" strokeOpacity=".4" strokeWidth="3"/>
          {i % 3 === 1 && <path d={`M40 ${y - 70} Q60 ${y - 110} 120 ${y - 110} Q155 ${y - 170} 215 ${y - 125} Q300 ${y - 135} 310 ${y - 70}Z`} fill="url(#wc-cloud-shade)"/>}
        </g>;
      })}
      <path d={trunk} fill="none" stroke="url(#wc-bark)" strokeWidth="125" />
      <path d={trunk} fill="none" stroke="#d8edaa" strokeWidth="5" opacity=".22" transform="translate(-22 0)" />
      <path d={trunk} fill="none" stroke="#0f4b39" strokeWidth="12" opacity=".32" transform="translate(38 0)" />
    </svg>
  </>;
}

export default function WordClimbGame({ difficulty = "easy", startLevel = 0, onScoreUpdate,
  onProgressUpdate, onComplete, onCheckpoint, onEngineReady, isSoundEnabled = true }) {
  const session = useMemo(() => createWordClimbSession(difficulty), [difficulty]);
  const world = useMemo(() => createClimbWorld(session, Number(startLevel) || 0), [session, startLevel]);
  const [frame, setFrame] = useState(0);
  const [feedback, setFeedback] = useState("Tap a word leaf to climb.");
  const [selected, setSelected] = useState(1);
  const callbacks = useRef({});
  const input = useRef({ left: false, right: false });
  const completionDelay = useRef(null);
  useLayoutEffect(() => { callbacks.current = { onScoreUpdate, onProgressUpdate, onCheckpoint, onComplete, isSoundEnabled }; }, [onScoreUpdate, onProgressUpdate, onCheckpoint, onComplete, isSoundEnabled]);
  const canJump = !world.paused && !world.completed && ["grounded", "landed"].includes(world.state);
  const reachable = reachableClimbPlatforms(world);
  const projectY = y => 100 - (y - world.camera) / CLIMB_VIEW_HEIGHT * 100;

  const jump = useCallback(id => {
    if (jumpToClimbPlatform(world, id)) {
      safeSfx(callbacks.current.isSoundEnabled, playTapSound);
      setFeedback("Up we go!");
      setFrame(n => n + 1);
    }
  }, [world]);

  useEffect(() => {
    const pause = () => { world.paused = true; input.current = { left: false, right: false }; cancelSpeech(); setFrame(n => n + 1); };
    const resume = () => { world.paused = false; setFrame(n => n + 1); };
    onEngineReady?.({ pause, resume });
    return () => { input.current = { left: false, right: false }; cancelSpeech(); };
  }, [onEngineReady, world]);

  useEffect(() => {
    completionDelay.current = null;
    callbacks.current.onProgressUpdate?.(world.step, world.summit);
    callbacks.current.onScoreUpdate?.(world.step * 10);
    callbacks.current.onCheckpoint?.(Math.min(world.step, world.summit - 1), world.summit);
  }, [world]);

  useEffect(() => {
    let animation;
    let last;
    const tick = time => {
      const dt = last === undefined ? 0 : Math.min((time - last) / 1000, 0.05);
      last = time;
      advanceClimbWorld(world, dt, Number(input.current.right) - Number(input.current.left));
      const event = world.event;
      if (event) {
        const audio = callbacks.current.isSoundEnabled;
        if (event.type === "correct" || event.type === "summit") {
          setFeedback(`${event.platform.word} starts with /${session.target}/. Keep climbing!`);
          safeSfx(audio, playCorrectChime);
          if (audio) void speakWord(event.platform.word);
          callbacks.current.onScoreUpdate?.(world.step * 10);
          callbacks.current.onProgressUpdate?.(world.step, world.summit);
          callbacks.current.onCheckpoint?.(Math.min(world.step, world.summit - 1), world.summit);
          if (event.type === "summit") completionDelay.current = 0.85;
        } else if (event.type === "wrong") {
          const onset = onsetGrapheme(event.platform.word) || event.platform.word[0];
          setFeedback(`${event.platform.word} starts with /${onset}/. Try a /${session.target}/ word.`);
          safeSfx(audio, playSoftBuzz);
          if (audio) void speakWord(event.platform.word);
        } else if (event.type === "fall") {
          setFeedback("The safety vine caught you. Try that jump again.");
        }
      }
      if (!world.paused && completionDelay.current !== null) {
        completionDelay.current -= dt;
        if (completionDelay.current <= 0) {
          completionDelay.current = null;
          safeSfx(callbacks.current.isSoundEnabled, playCelebrationFanfare);
          callbacks.current.onComplete?.(rocketRunStars(world.step, world.summit, world.wrong), world.step * 10, world.step);
        }
      }
      if (!world.paused) setFrame(n => n + 1);
      animation = requestAnimationFrame(tick);
    };
    animation = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animation);
  }, [session.target, world]);

  useEffect(() => { if (!isSoundEnabled) cancelSpeech(); else if (!world.paused) void speakPhoneme(session.target); }, [isSoundEnabled, session.target, world]);
  useEffect(() => {
    const clear = () => { input.current = { left: false, right: false }; };
    window.addEventListener("blur", clear);
    return () => window.removeEventListener("blur", clear);
  }, []);

  const setDirection = (direction, down) => { input.current[direction] = down; };
  const onKeyDown = event => {
    if (event.altKey || event.metaKey || event.ctrlKey || world.paused) return;
    const key = event.key.toLowerCase();
    if (["arrowleft", "a", "arrowright", "d"].includes(key)) {
      event.preventDefault();
      const right = key === "arrowright" || key === "d";
      setDirection(right ? "right" : "left", true);
      if (!event.repeat && canJump) setSelected(n => (n + (right ? 1 : 2)) % 3);
    } else if (["arrowup", "w"].includes(key) || (event.target.tagName !== "BUTTON" && [" ", "enter"].includes(key))) {
      event.preventDefault(); jump(reachable[selected]?.id);
    }
  };

  return <section className="word-climb" aria-label={`Word Climb. Choose words that start with ${session.target}.`}
    tabIndex={0} onKeyDown={onKeyDown} onKeyUp={event => {
      if (["arrowleft", "a"].includes(event.key.toLowerCase())) setDirection("left", false);
      if (["arrowright", "d"].includes(event.key.toLowerCase())) setDirection("right", false);
    }} data-wc-progress={world.step} data-world-height={world.y.toFixed(2)} data-camera-height={world.camera.toFixed(2)}
    data-motion-state={world.state} data-motor-falls={world.motorFalls} data-reading-errors={world.wrong} data-standing-ledge={world.standingId || ""} data-frame={frame}>
    <header className="wc-mission-card">
      <h2>Climb with <strong data-wc="target">/{session.target}/</strong></h2>
      <span className="wc-height">{world.step}/{world.summit} <span>leaves</span></span>
      <button className="wc-replay" data-wc="replay" type="button" disabled={!isSoundEnabled}
        aria-label={isSoundEnabled ? `Hear the ${session.target} sound again` : `Target is ${session.target}; sound is off`}
        onClick={() => { if (!world.paused) void speakPhoneme(session.target); }}>♪</button>
    </header>
    <div className="wc-world" data-wc="world">
      <div className="wc-altitude-sky" style={{ opacity: Math.min(.85, world.camera / (world.summit * 210)) }} />
      <ClimbScenery summit={world.summit} camera={world.camera} />
      <div className="wc-root-island" style={{ top: `${projectY(-20)}%` }} aria-hidden="true" />
      <div className="wc-summit-nest" style={{ top: `${projectY(world.summit * 210 + 65)}%` }} aria-hidden="true">✦</div>
      <svg className="wc-branches" viewBox={`0 0 1000 ${CLIMB_VIEW_HEIGHT}`} preserveAspectRatio="none" aria-hidden="true">
        {world.platforms.filter(p => Math.abs(p.y - world.camera) < 600).map(p =>
          <path key={p.id} d={`M500 ${CLIMB_VIEW_HEIGHT - (p.y - world.camera) + 60} Q${p.x} ${CLIMB_VIEW_HEIGHT - (p.y - world.camera) + 80} ${p.x} ${CLIMB_VIEW_HEIGHT - (p.y - world.camera) + 20}`} />)}
        {["clinging", "recovering"].includes(world.state) && <path className="wc-safety-vine" d={`M500 ${CLIMB_VIEW_HEIGHT - (world.y - world.camera) - 180} Q${world.x + 50} ${CLIMB_VIEW_HEIGHT - (world.y - world.camera) - 110} ${world.x} ${CLIMB_VIEW_HEIGHT - (world.y - world.camera) - 20}`} />}
      </svg>
      {world.platforms.filter(p => Math.abs(p.y - world.camera) < 560).map(p => {
        const active = p.row === world.step + 1;
        return <button key={p.id} type="button" className={`wc-word-ledge${active ? " is-reachable" : ""}${p.id === world.standingId ? " is-standing" : ""}`}
          data-wc={active ? "choice" : "ledge"} data-state={p.id === world.standingId && world.state === "clinging" && active && !p.correct ? "wrong" : undefined} data-ledge-id={p.id} data-world-y={p.y} data-world-x={p.x}
          data-selected={active && reachable[selected]?.id === p.id || undefined}
          style={{ left: `${p.x / 10}%`, top: `${projectY(p.y)}%`, width: `${p.width / 10}%` }}
          aria-label={active ? `Climb to ${p.word}` : p.word ? `Passed ${p.word} leaf` : "Root resting leaf"}
          tabIndex={active ? 0 : -1} disabled={!active || !canJump} onClick={() => jump(p.id)}>
          <strong>{p.word || "✦"}</strong><span className="wc-leaf-vein" aria-hidden="true" />
        </button>;
      })}
      <div className={`wc-climber ${world.state}`} aria-hidden="true"
        style={{ left: `${world.x / 10}%`, top: `${projectY(world.y)}%`, "--wc-tilt": `${Math.max(-15, Math.min(15, world.vx / 35))}deg` }}>
        <span className="wc-climber-shadow" />
        <img draggable="false" src="/game-assets/sound-seekers/v3/cast/meadow/bouncy.webp" alt="" />
      </div>
    </div>
    <div className="wc-bottom-bar">
      <p data-wc="feedback" role="status" aria-live="polite">{feedback}</p>
      <div className="wc-air-controls" aria-label="Adjust your jump">
        {["left", "right"].map(direction => <button type="button" key={direction} aria-label={`Lean ${direction} during jump`}
          onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); setDirection(direction, true); }}
          onPointerUp={() => setDirection(direction, false)} onPointerCancel={() => setDirection(direction, false)}
          onLostPointerCapture={() => setDirection(direction, false)} onBlur={() => setDirection(direction, false)}
          onKeyDown={event => { if ([" ", "Enter"].includes(event.key)) setDirection(direction, true); }}
          onKeyUp={() => setDirection(direction, false)}>{direction === "left" ? "←" : "→"}</button>)}
      </div>
    </div>
  </section>;
}

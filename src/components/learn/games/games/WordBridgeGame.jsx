import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { wordBridgeLadder } from "../../../../utils/wordBridgeLevels.js";
import { worldForGameDifficulty } from "../../../../utils/curriculumLadder.js";
import { hasRecordedSpeech } from "../../../../utils/learnGamesAudio.js";
import { getLedaInstructionAudioPath, getLedaWordAudioPath } from "../../../../data/ledaProductionAudio.js";
import { playCueAudio, stopCueAudio } from "../../../../utils/audio/cuePlayer.js";
import { playCorrectChime, playSoftBuzz, playCelebrationFanfare, cancelGameSfx } from "../../../../utils/audio/gameSfx";
import { createBridgeRun, createBridgeStage, selectBridgeTile, placeBridgeTile, bridgeReceipt } from "./wordBridgePlacement.js";
import "./WordBridgeGame.css";

const WORLD_THEME = {
  meadow: {
    name: "Meadow crossing",
    skyTop: "#8ec9ee",
    skyBottom: "#d8f2f1",
    far: "#6ea475",
    mid: "#4d8b51",
    ground: "#3e7d3b",
    groundDark: "#24562d",
    hazard: "#2f9bba",
    hazardDeep: "#12617d",
    accent: "#62b35f",
    accentDark: "#2d6f39",
    tile: "#f4dd7a",
    tileEdge: "#b98232",
    builder: "#f2b447",
    builderTrim: "#4f8c44",
    palA: "#f6f1dc",
    palB: "#d7cfb8",
    light: "#fff6b6",
    assets: {
      background: "/images/learn-games/word-bridge/meadow-background-clean-v2.webp",
      helper: "/images/learn-games/word-bridge/meadow-helper.webp",
      pals: "/images/learn-games/word-bridge/meadow-pals.webp"
    }
  },
  dino: {
    name: "Lava rib bridge",
    skyTop: "#b87148",
    skyBottom: "#efb66b",
    far: "#66483a",
    mid: "#496334",
    ground: "#574529",
    groundDark: "#2d2b1c",
    hazard: "#ef5d31",
    hazardDeep: "#611b18",
    accent: "#d68b36",
    accentDark: "#7c451f",
    tile: "#f0cd68",
    tileEdge: "#9a5427",
    builder: "#7aae47",
    builderTrim: "#f3b43f",
    palA: "#7bc668",
    palB: "#f0b24c",
    light: "#ffd37d",
    assets: {
      background: "/images/learn-games/word-bridge/dino-background-clean-v2.webp",
      helper: "/images/learn-games/word-bridge/dino-helper.webp",
      pals: "/images/learn-games/word-bridge/dino-pals.webp"
    }
  },
  moonwood: {
    name: "Moonwood chasm",
    skyTop: "#111936",
    skyBottom: "#26375f",
    far: "#1c2544",
    mid: "#26335f",
    ground: "#1b3140",
    groundDark: "#0c1726",
    hazard: "#5b58af",
    hazardDeep: "#161326",
    accent: "#8f7dff",
    accentDark: "#433b85",
    tile: "#e8def7",
    tileEdge: "#7665c8",
    builder: "#bda5ff",
    builderTrim: "#f1dbff",
    palA: "#d9e6ff",
    palB: "#8bd7d2",
    light: "#dff4ff",
    assets: {
      background: "/images/learn-games/word-bridge/moonwood-background-clean-v2.webp",
      helper: "/images/learn-games/word-bridge/moonwood-helper.webp",
      pals: "/images/learn-games/word-bridge/moonwood-pals.webp"
    }
  }
};


function targetText(level) {
  return Array.isArray(level.target) ? level.target.join(" ") : String(level.target);
}

function targetAudio(level) {
  const text = targetText(level);
  if (!hasRecordedSpeech(text)) return null;
  return Array.isArray(level.target) ? getLedaInstructionAudioPath(text) : getLedaWordAudioPath(text);
}

// Native focus and keyboard activation, plus explicit cancellation-safe touch.
// The exact ID lives in the callback, including immediate taps and lower rows.
function BridgeButton({ onActivate, children, ...props }) {
  const press = useRef(null);
  return <button type="button" {...props}
    onPointerDown={event => {
      if (event.button !== 0) return;
      press.current = { id: event.pointerId, x: event.clientX, y: event.clientY,
        epoch: event.currentTarget.closest(".wb-game")?.dataset.inputEpoch };
      try { event.currentTarget.setPointerCapture?.(event.pointerId); } catch { /* The pointer may already have ended. */ }
    }}
    onPointerUp={event => {
      const start = press.current;
      press.current = null;
      if (!start || start.id !== event.pointerId) return;
      if (start.epoch !== event.currentTarget.closest(".wb-game")?.dataset.inputEpoch) return;
      const rect = event.currentTarget.getBoundingClientRect();
      if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 20) return;
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) return;
      onActivate?.();
    }}
    onPointerCancel={() => { press.current = null; }}
    onLostPointerCapture={() => { press.current = null; }}
    onClick={event => { if (event.detail === 0) onActivate?.(); }}
  >{children}</button>;
}

function Character({ theme, pal = false, moving = false, failed = false }) {
  const [broken, setBroken] = useState(failed);
  if (broken) return <svg className="wb-fallback-character" viewBox="0 0 64 80" aria-hidden="true">
    <path fill={theme.builder} stroke={theme.builderTrim} strokeWidth="3" d="M12 23 7 3 27 14 43 11 57 3 53 26Q66 45 48 58L51 75 38 75 32 61 27 75 13 75 17 57Q-2 42 12 23Z" />
    <ellipse fill="#fff6dc" cx="32" cy="39" rx="21" ry="14"/><circle cx="22" cy="33" r="4"/><circle cx="43" cy="33" r="4"/><path d="m27 42 5 5 5-5" fill="none" stroke="#241a37" strokeWidth="3"/>
  </svg>;
  if (pal) return <span className={`wb-pal ${moving ? "wb-walking" : ""}`} style={{ backgroundImage: `url(${theme.assets.pals})` }} aria-hidden="true">
    <img src={theme.assets.pals} alt="" onError={() => setBroken(true)} style={{ display: "none" }} />
  </span>;
  return <img className={`wb-helper ${moving ? "wb-carrying" : ""}`} src={theme.assets.helper} alt="" onError={() => setBroken(true)} />;
}

// Presentation uses live button anchors. It never chooses a tile, socket, score
// or response. Animation time freezes under any pause and remeasures on resize.
function Travel({ motion, paused, reduced, contentRef, theme, onArrive }) {
  const actorRef = useRef(null);
  const elapsed = useRef(0);
  useLayoutEffect(() => { elapsed.current = 0; }, [motion?.id]);
  useLayoutEffect(() => {
    if (!motion || paused) return undefined;
    let frame, last;
    const tick = now => {
      if (last !== undefined) elapsed.current += Math.min(now - last, 50);
      last = now;
      const content = contentRef.current;
      const actor = actorRef.current;
      if (!content || !actor) return;
      const root = content.getBoundingClientRect();
      const points = motion.anchors.map(id => content.querySelector(`[data-anchor="${id}"]`)).filter(Boolean).map(el => {
        const r = el.getBoundingClientRect();
        return { x: r.left - root.left + r.width / 2, y: r.top - root.top + r.height / 2 };
      });
      if (points.length) {
        const duration = reduced ? 100 : motion.kind === "crossing" ? points.length * 370 : 360;
        const delay = reduced ? 0 : 180;
        [...actor.children].forEach((traveller, index) => {
          const progress = Math.max(0, Math.min(1, (elapsed.current - index * delay) / duration));
          const distance = progress * (points.length - 1);
          const segment = Math.floor(distance), fraction = distance - segment;
          const a = points[segment], b = points[Math.min(segment + 1, points.length - 1)];
          const ease = motion.kind === "crossing" ? fraction : fraction * fraction * (3 - 2 * fraction);
          const hop = reduced ? 0 : Math.sin(fraction * Math.PI) * (motion.kind === "crossing" ? 12 : 24);
          traveller.style.transform = `translate(${a.x + (b.x - a.x) * ease - 28}px,${a.y + (b.y - a.y) * ease - 68 - hop}px)`;
        });
        const progress = Math.min(1, elapsed.current / (duration + (actor.children.length - 1) * delay));
        actor.dataset.progress = progress.toFixed(3);
        if (progress >= 1) { onArrive(motion.id); return; }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [motion, paused, reduced, contentRef, onArrive]);
  if (!motion) return null;
  return <div className="wb-motion-layer" ref={actorRef} data-wb-motion={motion.kind} aria-hidden="true">
    {Array.from({ length: motion.count || 1 }, (_, index) => <div className="wb-travel" key={index}>
      <Character theme={theme} pal={motion.kind === "crossing"} moving={!paused && !reduced} />
      {motion.glyph && <span className="wb-carried-piece">{motion.glyph}</span>}
    </div>)}
  </div>;
}

export default function WordBridgeGame(props) {
  const { difficulty = "easy", startLevel = 0, isSoundEnabled = true } = props;
  const callbacks = useRef(props);
  useLayoutEffect(() => { callbacks.current = props; });
  const [ladder] = useState(() => wordBridgeLadder(difficulty));
  const initial = Math.max(0, Math.min(startLevel, ladder.length - 1));
  const runRef = useRef(createBridgeRun(initial));
  const [state, setState] = useState(() => createBridgeStage(ladder[initial], initial));
  const stateRef = useRef(state);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const [reduced, setReduced] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [motion, setMotion] = useState(null);
  const motionSerial = useRef(0);
  const [onboarding, setOnboarding] = useState(() => {
    try { return localStorage.getItem("lp-arcade-onboarded-v1:word-bridge") !== "1"; } catch { return true; }
  });
  const contentRef = useRef(null);
  const rootRef = useRef(null);
  const cueGeneration = useRef(0);
  const alive = useRef(true);
  const theme = WORLD_THEME[worldForGameDifficulty(difficulty)] || WORLD_THEME.meadow;
  const publish = useCallback(next => { stateRef.current = next; setState(next); }, []);
  const sound = fn => { if (callbacks.current.isSoundEnabled && !pausedRef.current) fn(); };

  const stopVoice = () => { cueGeneration.current += 1; stopCueAudio(); cancelGameSfx(); };
  const showModel = (feedback, delivery) => {
    const current = stateRef.current;
    publish({ ...current, modelShown: true, cueDelivery: delivery || current.cueDelivery,
      cueHistory: delivery ? [...new Set([...current.cueHistory, delivery])] : current.cueHistory, feedback });
  };
  const listen = () => {
    if (pausedRef.current || !callbacks.current.isSoundEnabled) return;
    const current = stateRef.current;
    const src = targetAudio(current.level);
    if (!src) { showModel("Use the printed model to build.", "unavailable"); return; }
    const generation = ++cueGeneration.current;
    playCueAudio(src, {
      cueId: current.level.levelId, playImmediately: true,
      onDelivery: event => {
        if (!alive.current || generation !== cueGeneration.current) return;
        const latest = stateRef.current;
        if (["failed", "unavailable"].includes(event.type)) {
          showModel("The recording could not play. Match the printed model.", "failed");
        } else {
          publish({ ...latest, cueDelivery: event.type, cueHistory: [...new Set([...latest.cueHistory, event.type])] });
        }
      }
    });
  };

  useEffect(() => {
    alive.current = true;
    const setPause = value => {
      if (rootRef.current) rootRef.current.dataset.inputEpoch = String(Number(rootRef.current.dataset.inputEpoch || 0) + 1);
      pausedRef.current = value;
      setPaused(value);
      if (value) {
        stopVoice();
        const current = stateRef.current;
        if (["loading", "started"].includes(current.cueDelivery)) publish({ ...current, cueDelivery: "interrupted", feedback: "Press Hear to replay the whole cue." });
      }
    };
    callbacks.current.onEngineReady?.({ pause: () => setPause(true), resume: () => setPause(document.hidden) });
    const visibility = () => { if (document.hidden) setPause(true); };
    document.addEventListener("visibilitychange", visibility);
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const changeMotion = () => setReduced(media.matches);
    media.addEventListener("change", changeMotion);
    callbacks.current.onProgressUpdate?.(initial, ladder.length);
    return () => {
      alive.current = false;
      stopVoice();
      document.removeEventListener("visibilitychange", visibility);
      media.removeEventListener("change", changeMotion);
    };
    // Engine ownership is stable; callbacks are kept current through the ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isSoundEnabled) {
      stopVoice();
      const current = stateRef.current;
      if (current.phase === "building") showModel("Sound is off. Match the printed model.", "muted");
    }
    // Turning sound back on does not erase already-seen model support.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSoundEnabled]);

  const select = id => {
    if (pausedRef.current || onboarding) return;
    const next = selectBridgeTile(stateRef.current, id);
    publish(next);
    if (next.selected) {
      const tile = next.tiles.find(item => item.occurrenceId === id);
      setMotion({ id: ++motionSerial.current, kind: "carry", glyph: tile.glyph, anchors: [id, "dock"] });
    } else setMotion(null);
  };
  const place = slotId => {
    if (pausedRef.current || onboarding) return;
    const current = stateRef.current;
    // A concealed task cannot accept a response until the whole cue delivered.
    if (!current.modelShown && current.cueDelivery !== "completed") {
      publish({ ...current, feedback: "Press Hear and listen, or Show model." }); return;
    }
    const result = placeBridgeTile(current, runRef.current, slotId);
    if (result.outcome === "cancelled") return;
    runRef.current = result.run;
    publish(result.state);
    const tile = current.tiles.find(item => item.occurrenceId === current.selected);
    setMotion({ id: ++motionSerial.current, kind: result.outcome === "correct" ? "place" : "repair",
      glyph: tile.glyph, anchors: result.outcome === "correct" ? ["dock", slotId] : [slotId, tile.occurrenceId] });
    sound(result.outcome === "correct" ? playCorrectChime : playSoftBuzz);
    callbacks.current.onScoreUpdate?.(result.run.score);
    if (result.state.phase === "built") {
      callbacks.current.onProgressUpdate?.(result.run.completed, ladder.length);
      if (runRef.current.stage === ladder.length - 1 && !runRef.current.receipt) {
        const receipt = bridgeReceipt(runRef.current);
        runRef.current = { ...runRef.current, receipt };
        callbacks.current.onResultReady?.(receipt.stars, receipt.score, receipt.words, receipt.evidence);
      }
    }
  };
  const onArrive = useCallback(id => {
    if (id !== motionSerial.current) return;
    setMotion(null);
    if (stateRef.current.phase === "crossing") {
      publish({ ...stateRef.current, phase: "arrived", feedback: "Everyone is across! Your bridge stays built." });
      if (callbacks.current.isSoundEnabled && !pausedRef.current) playCelebrationFanfare();
    }
  }, [publish, setMotion]);
  const cross = () => {
    if (pausedRef.current || stateRef.current.phase !== "built") return;
    stopVoice();
    publish({ ...stateRef.current, phase: "crossing", feedback: "Watch your bridge carry the pals across." });
    setMotion({ id: ++motionSerial.current, kind: "crossing", count: stateRef.current.level.pals, anchors: ["dock", ...stateRef.current.slots.map(slot => slot.slotId), "arrival"] });
  };
  const next = () => {
    if (pausedRef.current || stateRef.current.phase !== "arrived") return;
    stopVoice();
    if (runRef.current.stage === ladder.length - 1) {
      const receipt = runRef.current.receipt;
      publish({ ...stateRef.current, phase: "finished" });
      callbacks.current.onComplete?.(receipt.stars, receipt.score, receipt.words, receipt.evidence);
      return;
    }
    const stage = runRef.current.stage + 1;
    const fresh = Boolean(isSoundEnabled && targetAudio(ladder[stage]) && stage % 2 === 1);
    runRef.current = { ...runRef.current, stage };
    publish(createBridgeStage(ladder[stage], stage, fresh));
    callbacks.current.onCheckpoint?.(stage, ladder.length);
    rootRef.current.scrollTop = 0;
  };

  const current = state;
  const built = current.phase !== "building";
  const selected = current.tiles.find(tile => tile.occurrenceId === current.selected);
  const printed = current.modelShown || built;
  const sentence = Array.isArray(current.level.target);
  const fullTarget = targetText(current.level);
  return <div className="wb-game" ref={rootRef} data-phase={current.phase} data-stage={current.stage}
    data-cue={current.cueDelivery} data-model={current.modelShown ? "shown" : "hidden"}
    data-paused={paused ? "true" : "false"} data-reduced={reduced ? "true" : "false"}
    style={{ "--wb-accent": theme.light, "--wb-stone": theme.tile, "--wb-edge": theme.tileEdge, "--wb-land": theme.groundDark, "--wb-background": `url(${theme.assets.background})` }}
    onKeyDown={event => {
      if (paused || onboarding) return;
      if (["ArrowLeft", "ArrowRight", "a", "d"].includes(event.key)) {
        event.preventDefault();
        const controls = [...rootRef.current.querySelectorAll("button:not([disabled])")];
        const index = controls.indexOf(document.activeElement);
        const direction = ["ArrowLeft", "a"].includes(event.key) ? -1 : 1;
        controls[(index + direction + controls.length) % controls.length]?.focus();
      } else if (["e", "ArrowUp"].includes(event.key) && document.activeElement?.tagName === "BUTTON") {
        event.preventDefault(); if (!event.repeat) document.activeElement.click();
      }
    }}>
    <div className="wb-content" ref={contentRef}>
      <header className="wb-cue" data-wb-region="cue">
        <div className="wb-cue-heading"><span>{theme.name} · <b data-wb="level">{current.stage + 1}</b>/10</span>
          {isSoundEnabled && targetAudio(current.level) && <BridgeButton className="wb-tool" onActivate={listen}>Hear</BridgeButton>}
        </div>
        <p className="wb-support">{current.modelShown ? "Supported practice · printed model" : "Fresh bridge · build from the recording"}</p>
        <div className="wb-target" data-wb="target">{printed ? fullTarget : sentence ? "Listen to the sentence. Build it in order." : "Listen to the word. Build it with the pieces."}</div>
        {!current.modelShown && <BridgeButton className="wb-tool" onActivate={() => showModel("Use the model to finish your bridge.")}>Show model</BridgeButton>}
      </header>

      {onboarding && <section className="wb-instructions">
        <h2>Build a path for your pals</h2><p>Choose a piece. Choose its bridge space. Ring the bell when your bridge is built.</p>
        <p>Use Tab or arrow keys to choose; Enter or Space to pick and place.</p>
        <BridgeButton className="wb-tool" onActivate={() => {
          try { localStorage.setItem("lp-arcade-onboarded-v1:word-bridge", "1"); } catch { /* optional */ }
          setOnboarding(false);
        }}>Start building</BridgeButton>
      </section>}

      <div className="wb-feedback" role="status" aria-live="polite" aria-atomic="true">{current.feedback}</div>
      <section className="wb-bank-region" data-wb-region="bank" aria-label="Piece bank">
        <div className="wb-region-label">PIECE BANK {selected && <span>Carrying: {selected.glyph}</span>}</div>
        <div className="wb-bank">
          {current.tiles.map(tile => {
            const used = current.slots.some(slot => slot.occurrenceId === tile.occurrenceId);
            return <BridgeButton key={tile.occurrenceId} className={`wb-piece ${current.selected === tile.occurrenceId ? "wb-selected" : ""} ${used ? "wb-used" : ""}`}
              data-anchor={tile.occurrenceId} data-tile-id={tile.occurrenceId} data-glyph={tile.glyph}
              aria-label={`Pick ${tile.glyph}`} aria-pressed={current.selected === tile.occurrenceId}
              disabled={used || built || onboarding} onActivate={() => select(tile.occurrenceId)}>
              {tile.glyph}{used && <span className="wb-used-mark">✓</span>}
            </BridgeButton>;
          })}
        </div>
      </section>
      <section className="wb-construction" data-wb-region="bridge" aria-label="Build the bridge">
        <div className="wb-region-label">YOUR BRIDGE <span>{current.slots.filter(slot => slot.occurrenceId).length}/{current.slots.length} pieces</span></div>
        <div className="wb-deck">
          {current.slots.map(slot => <BridgeButton key={slot.slotId}
            className={`wb-socket ${slot.occurrenceId ? "wb-filled" : ""}`}
            data-anchor={slot.slotId} data-slot-id={slot.slotId} data-filled={Boolean(slot.occurrenceId)}
            aria-label={`Bridge space ${slot.order + 1}${slot.occurrenceId ? `: ${slot.needed}, built` : ""}`}
            disabled={Boolean(slot.occurrenceId) || built || onboarding} onActivate={() => place(slot.slotId)}>
            <small>{slot.order + 1}</small><span>{slot.occurrenceId || current.modelShown ? slot.needed : "?"}</span>
          </BridgeButton>)}
        </div>
      </section>
      <section className="wb-arrival" data-wb-region="arrival">
        <div className="wb-dock" data-anchor="dock" style={{ visibility: motion && motion.kind !== "crossing" ? "hidden" : "visible" }}><Character theme={theme} moving={Boolean(selected) && !paused && !reduced}/></div>
        <div className="wb-bridge-rope" aria-hidden="true" />
        <div className={`wb-pals ${current.phase === "arrived" || current.phase === "finished" ? "wb-pals-arrived" : ""}`}>
          {current.phase !== "crossing" && <Character theme={theme} pal moving={current.phase === "arrived" && !paused && !reduced}/>}
          <span>{current.phase === "arrived" || current.phase === "finished" ? `${current.level.pals} pals across!` : current.phase === "crossing" ? "On the bridge" : `${current.level.pals} pals waiting`}</span>
        </div>
        <div className="wb-landing" data-anchor="arrival" aria-hidden="true">⚑</div>
        {selected && !motion && <span className="wb-dock-piece" aria-hidden="true">{selected.glyph}</span>}
      </section>
      <div className="wb-actions">
        {current.phase === "built" && <BridgeButton className="wb-primary" onActivate={cross}>Ring the bell</BridgeButton>}
        {current.phase === "crossing" && <span>Crossing your bridge…</span>}
        {current.phase === "arrived" && <BridgeButton className="wb-primary" onActivate={next}>{current.stage === ladder.length - 1 ? "Finish" : "Next bridge"}</BridgeButton>}
        {(current.phase === "finished" || current.phase === "arrived" && current.stage === ladder.length - 1) && <BridgeButton className="wb-primary" onActivate={() => {
          stopVoice(); setMotion(null); runRef.current = createBridgeRun(); publish(createBridgeStage(ladder[0], 0));
          callbacks.current.onSessionStart?.(); callbacks.current.onCheckpoint?.(0, ladder.length);
          callbacks.current.onProgressUpdate?.(0, ladder.length); rootRef.current.scrollTop = 0;
        }}>Play again</BridgeButton>}
      </div>
      <Travel motion={motion} paused={paused} reduced={reduced} contentRef={contentRef} theme={theme} onArrive={onArrive}/>
    </div>
  </div>;
}

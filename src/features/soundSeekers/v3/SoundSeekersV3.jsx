// Sound Seekers v3 — "The Story Trail". React owns lifecycle, the HUD and the
// cards; the canvas scenes own the world; the engine owns correctness.
//
// Engine objects live in refs (mutable, non-rendering state); the bits the
// HUD needs are mirrored into React state by syncHud() after every action and
// whenever the scene reports a change.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./sound-seekers-v3.css";
import { CAST, HEROES } from "./content/cast.js";
import { LANDS, TRAIL, getTrailStop } from "./content/trail.js";
import { MECHANICS, publicBeat } from "./engine/challenges.js";
import { buildMission } from "./engine/director.js";
import { createBeatState, resolveAction } from "./engine/authority.js";
import { completeStop, isStopCompleted, recordEvidence, recordTaught, setCheckpoint, setHero } from "./engine/progress.js";
import { createAudioPlayer, createFx } from "./engine/audio.js";
import { createMapScene } from "./render/mapScene.js";
import { createEncounterScene } from "./render/encounterScene.js";
import { preload } from "./render/sprites.js";
import { soundSeekersV3CssVariables } from "../visual/visualTokens.js";

// colours reach the stylesheet only through these custom properties
const CSS_VARIABLES = soundSeekersV3CssVariables();

const TOKEN_GLYPH = { tub: "🛁", pillow: "🛏️", egg: "🥚", bridge: "🌉", lantern: "🏮", ladder: "🪜", ferry: "🛶", lunch: "🥪", wheel: "⚙️", note: "🎵", amber: "🟠", bones: "🦴", footprint: "🐾", scarf: "🧣", rock: "🪨", cog: "⚙️", ore: "⛏️", plate: "🍽️", lamp: "🔦", forge: "🔥", broom: "🧹", ripple: "💧", sparkle: "✨", glint: "💎", mirror: "🪞", hat: "🎩", wand: "🪄", signal: "🚨", cloud: "🌩️", beam: "🔆", moth: "🦋", echo: "🔊", wisp: "🕯️", orbit: "🪐", dome: "🔭", comet: "☄️", key: "🗝️", dawn: "🌅", skybridge: "🌈", star: "⭐" };

const EMPTY_HUD = Object.freeze({ beatIndex: 0, beatState: null, pickables: [], roomDone: false, complete: false });

function promptHtml(text) {
  // sounds between slashes get the letter font + berry colour
  const parts = String(text).split(/(\/[^/]+\/)/g);
  return parts.map((p, i) => (/^\/[^/]+\/$/.test(p) ? <b key={i}>{p}</b> : <span key={i}>{p}</span>));
}

export default function SoundSeekersV3({
  progressScopeKey = "default",
  isSoundEnabled = true,
  onExit,
  accessibilitySettings = {},
  loadProgress,
  saveProgress,
  initialStopId = null
}) {
  const reducedMotion = Boolean(accessibilitySettings?.reducedMotion);
  const [progress, setProgressState] = useState(() => loadProgress(progressScopeKey));
  const progressRef = useRef(progress);
  const setProgress = useCallback(next => {
    progressRef.current = next;
    setProgressState(next);
    saveProgress(progressScopeKey, next);
  }, [progressScopeKey, saveProgress]);

  const [mode, setMode] = useState(() => (progress.heroChosen ? "map" : "hero"));
  const [pendingHero, setPendingHero] = useState(progress.hero || "speedy");
  const [meetStop, setMeetStop] = useState(() => (initialStopId ? getTrailStop(initialStopId) : null));
  const [encounter, setEncounter] = useState(null); // { stop, mission }
  const [hud, setHud] = useState(EMPTY_HUD);
  const [mapStopId, setMapStopId] = useState(progress.currentStopId);
  const [feedback, setFeedback] = useState("");
  const [feedbackShow, setFeedbackShow] = useState(false);
  const [paused, setPaused] = useState(false);
  const [done, setDone] = useState(null); // { stop }
  const [soundOn, setSoundOn] = useState(Boolean(isSoundEnabled));
  const [bigButtons, setBigButtons] = useState(Boolean(accessibilitySettings?.extendedResponse));
  const [replaying, setReplaying] = useState(false);
  const [mapHint, setMapHint] = useState("Tap the glowing stop to walk there.");

  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const mapSceneRef = useRef(null);
  const encounterRef = useRef(null);
  const beatStatesRef = useRef([]);
  const missionRef = useRef(null);
  const encounterStopRef = useRef(null);
  const rafRef = useRef(0);
  const lastRef = useRef(0);
  const hudSigRef = useRef("");
  const doneTimerRef = useRef(null);
  const feedbackTimerRef = useRef(null);
  const pausedRef = useRef(false);
  const soundOnRef = useRef(soundOn);
  const dispatchRef = useRef(() => {});
  const replayRef = useRef(() => {});

  const audio = useMemo(() => createAudioPlayer({ enabled: isSoundEnabled }), [isSoundEnabled]);
  const fx = useMemo(() => createFx({ enabled: isSoundEnabled }), [isSoundEnabled]);
  useEffect(() => { audio.setEnabled(soundOn); fx.setEnabled(soundOn); soundOnRef.current = soundOn; }, [audio, fx, soundOn]);
  useEffect(() => { pausedRef.current = paused; }, [paused]);

  // The board is the aria-live mirror of what the world says. It is shown
  // visibly only for lines no character speaks (a replayed prompt); outcome
  // lines are spoken by the character's bubble, so the board stays hidden
  // for those rather than showing the same sentence twice — or, worse, a
  // stale "listen again" under a fresh "that's it".
  const showFeedback = useCallback((line, seconds = 3.5, { visible = true } = {}) => {
    if (!line) return;
    setFeedback(line);
    setFeedbackShow(visible);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => setFeedbackShow(false), seconds * 1000);
  }, []);

  // ── hearing things ────────────────────────────────────────────────────
  const hear = useCallback(async (srcs, meta = {}) => {
    const list = (srcs || []).filter(Boolean);
    if (meta.onWord) {
      for (let i = 0; i < list.length; i += 1) {
        meta.onWord(i);
        const r = await audio.play(list[i]);
        if (r === "interrupted") break;
        await new Promise(res => setTimeout(res, 120));
      }
      meta.onDone?.();
      return;
    }
    if (!list.length) return;
    await audio.sequence(list);
  }, [audio]);

  // ── HUD mirror ────────────────────────────────────────────────────────
  const syncHud = useCallback(() => {
    const enc = encounterRef.current;
    if (!enc) { hudSigRef.current = ""; setHud(EMPTY_HUD); return; }
    const beatIndex = enc.beatIndex;
    const beatState = beatStatesRef.current[beatIndex] || null;
    const pickables = enc.pickables();
    const next = { beatIndex, beatState, pickables, roomDone: enc.roomDone, complete: enc.complete };
    const sig = JSON.stringify([beatIndex, beatState, pickables.map(p => p.id + p.label), next.roomDone, next.complete]);
    if (sig !== hudSigRef.current) { hudSigRef.current = sig; setHud(next); }
  }, []);

  // ── map scene ─────────────────────────────────────────────────────────
  const buildMap = useCallback((heroId) => {
    const scene = createMapScene({
      progress: progressRef.current,
      heroId,
      reducedMotion,
      fx,
      onArrive: stop => {
        setMapStopId(stop.id);
        setMapHint(isStopCompleted(progressRef.current, stop.id) ? `${stop.name} is fixed. Tap ${CAST[stop.character]?.name} to play again.` : `Tap ${CAST[stop.character]?.name} to help.`);
      },
      onSelectStop: stop => { setMeetStop(stop); }
    });
    preload(scene.assets());
    mapSceneRef.current = scene;
    setMapStopId(scene.currentStop().id);
    return scene;
  }, [fx, reducedMotion]);

  useEffect(() => {
    if (mode !== "map" || mapSceneRef.current) return undefined;
    const id = requestAnimationFrame(() => {
      sceneRef.current = buildMap(progressRef.current.hero);
    });
    return () => cancelAnimationFrame(id);
  }, [mode, buildMap]);

  // ── encounter ─────────────────────────────────────────────────────────
  const startEncounter = useCallback((stop, { resume = false } = {}) => {
    const prog = progressRef.current;
    const replayOrdinal = prog.completed[stop.id]?.plays || 0;
    const checkpoint = resume && prog.checkpoint?.stopId === stop.id ? prog.checkpoint : null;
    const mission = buildMission(stop, prog, { replayOrdinal: checkpoint ? checkpoint.replayOrdinal : replayOrdinal });
    const publicMission = { ...mission, beats: mission.beats.map(publicBeat) };
    beatStatesRef.current = mission.beats.map(createBeatState);
    missionRef.current = mission;
    encounterStopRef.current = stop;
    const scene = createEncounterScene({
      stop,
      mission: publicMission,
      heroId: prog.hero,
      reducedMotion,
      fx,
      onHear: hear,
      onAction: action => dispatchRef.current(action)
    });
    preload(scene.assets());
    encounterRef.current = scene;
    sceneRef.current = scene;
    if (typeof window !== "undefined") {
      window.__ss3busy = () => Boolean(encounterRef.current?.busy);
      if (import.meta.env?.DEV) window.__ss3debug = () => encounterRef.current?.debug?.();
    }
    const startIndex = checkpoint ? Math.min(checkpoint.beatIndex, mission.beats.length) : 0;
    setDone(null);
    setEncounter({ stop, mission: publicMission });
    setMode("encounter");
    setMeetStop(null);
    if (startIndex > 0) scene.startAt(startIndex); else scene.enterBeat(0);
    scene.setBeatState(startIndex, beatStatesRef.current[startIndex]);
    syncHud();
    setProgress(setCheckpoint(prog, { stopId: stop.id, beatIndex: startIndex, replayOrdinal: mission.replayOrdinal }));
    const first = mission.beats[startIndex];
    setTimeout(() => { if (first) hear(first.prompt.cues.map(c => c.src)); }, 600);
  }, [fx, hear, reducedMotion, setProgress, syncHud]);

  useEffect(() => {
    dispatchRef.current = (action) => {
      const mission = missionRef.current;
      const scene = encounterRef.current;
      if (!mission || !scene || pausedRef.current) return;
      const i = scene.beatIndex;
      const beat = mission.beats[i];
      if (!beat) return;
      const { state, outcome } = resolveAction(beat, beatStatesRef.current[i], action);
      beatStatesRef.current[i] = state;
      scene.setBeatState(i, state);
      scene.applyOutcome(action, outcome, state);
      let prog = progressRef.current;
      if (outcome.evidence) prog = recordEvidence(prog, { ...outcome.evidence, audioSupport: soundOnRef.current ? "clips" : "text" });
      if (outcome.type === "complete" && outcome.taught) prog = recordTaught(prog, outcome.taught);
      if (outcome.line) showFeedback(outcome.line, 3.5, { visible: false });
      else if (outcome.type === "correct") showFeedback("That's it!", 2, { visible: false });
      else if (outcome.type === "complete") showFeedback("Done!", 2, { visible: false });
      if (state.done) prog = setCheckpoint(prog, { stopId: encounterStopRef.current?.id || beat.stopId, beatIndex: i + 1, replayOrdinal: mission.replayOrdinal });
      if (prog !== progressRef.current) setProgress(prog);
      syncHud();
    };
  }, [setProgress, showFeedback, syncHud]);

  const replay = useCallback(() => {
    const mission = missionRef.current;
    const scene = encounterRef.current;
    if (!mission || !scene) return;
    const beat = mission.beats[scene.beatIndex];
    if (!beat) return;
    const srcs = beat.prompt.cues.map(c => c.src);
    if (beat.mechanic === MECHANICS.WORD_FORGE) srcs.push(beat.view.wordAudio);
    setReplaying(true);
    hear(srcs.filter(Boolean)).finally(() => setReplaying(false));
    showFeedback(beat.prompt.text, 2.5);
  }, [hear, showFeedback]);
  useEffect(() => { replayRef.current = replay; }, [replay]);

  // ── render loop ──────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d");
    let alive = true;
    let lastBeat = -1;
    let sinceSync = 0;
    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      return { w, h, dpr };
    };
    const frame = now => {
      if (!alive) return;
      rafRef.current = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - (lastRef.current || now)) / 1000);
      lastRef.current = now;
      const scene = sceneRef.current;
      const { w, h, dpr } = resize();
      if (!scene) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!pausedRef.current) {
        if (scene === mapSceneRef.current) scene.update(dt, { w, h, scale: h / 941, viewWorldW: w / (h / 941) });
        else scene.update(dt);
      }
      scene.draw(ctx, w, h);
      const enc = encounterRef.current;
      if (scene === enc) {
        if (enc.beatIndex !== lastBeat) {
          lastBeat = enc.beatIndex;
          const b = missionRef.current?.beats[enc.beatIndex];
          if (b) {
            enc.setBeatState(enc.beatIndex, beatStatesRef.current[enc.beatIndex]);
            setTimeout(() => hear(b.prompt.cues.map(c => c.src)), 400);
          }
          syncHud();
        }
        sinceSync += dt;
        if (sinceSync > 0.25) { sinceSync = 0; syncHud(); }
        if (enc.complete && !doneTimerRef.current) {
          doneTimerRef.current = setTimeout(() => { setDone({ stop: encounterStopRef.current }); }, 2600);
        }
      } else {
        lastBeat = -1;
      }
    };
    rafRef.current = requestAnimationFrame(frame);
    return () => { alive = false; cancelAnimationFrame(rafRef.current); };
  }, [hear, syncHud]);

  // ── input ────────────────────────────────────────────────────────────
  const modalOpen = paused || Boolean(meetStop) || Boolean(done) || mode === "hero";
  useEffect(() => {
    const onKey = (e, down) => {
      if (e.repeat && down && e.code !== "Space") return;
      if (modalOpen) { if (down && e.code === "Escape") setPaused(false); return; }
      if (down && e.code === "Escape") { setPaused(true); return; }
      if (down && e.code === "KeyR") { replayRef.current(); return; }
      const scene = sceneRef.current;
      if (!scene) return;
      let handled = false;
      if (scene === mapSceneRef.current) { if (down) handled = scene.key(e.code); }
      else handled = scene.key(e.code, down);
      if (handled) e.preventDefault();
    };
    const kd = e => onKey(e, true);
    const ku = e => onKey(e, false);
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    return () => { window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku); };
  }, [modalOpen]);

  const onPointerDown = e => {
    if (modalOpen) return;
    const scene = sceneRef.current;
    const canvas = canvasRef.current;
    if (!scene || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (scene === mapSceneRef.current) scene.pointerDown(x, y, rect.width, rect.height);
    else scene.pointerDown(x, y);
  };

  const hold = useCallback((name, value) => e => {
    e.preventDefault();
    encounterRef.current?.setInput(name, value);
  }, []);
  const encAct = useCallback(fn => () => { const enc = encounterRef.current; if (enc) fn(enc); }, []);
  const mapAct = useCallback(code => () => { mapSceneRef.current?.key(code); }, []);
  const send = useCallback(action => () => dispatchRef.current(action), []);

  // ── card handlers ─────────────────────────────────────────────────────
  const chooseHero = () => {
    const next = setHero({ ...progressRef.current, heroChosen: true }, pendingHero);
    setProgress(next);
    mapSceneRef.current = null;
    setMode("map");
  };

  const returnToMap = useCallback((hint) => {
    setPaused(false);
    setDone(null);
    setEncounter(null);
    encounterRef.current = null;
    missionRef.current = null;
    encounterStopRef.current = null;
    if (doneTimerRef.current) { clearTimeout(doneTimerRef.current); doneTimerRef.current = null; }
    const map = mapSceneRef.current || buildMap(progressRef.current.hero);
    map.setProgress(progressRef.current);
    map.setHero(progressRef.current.hero);
    sceneRef.current = map;
    setMode("map");
    setMapHint(hint);
    syncHud();
  }, [buildMap, syncHud]);

  const finishStop = () => {
    const stop = done?.stop || encounterStopRef.current;
    if (!stop) return;
    const next = completeStop(progressRef.current, stop.id, { replayOrdinal: missionRef.current?.replayOrdinal || 0, token: stop.token });
    setProgress(next);
    returnToMap("The lantern is lit! Walk on to the next stop.");
    setTimeout(() => { mapSceneRef.current?.travelToStop(next.currentStopId); }, 900);
    fx.chime();
  };

  const leaveEncounter = () => returnToMap("Your place is saved. Tap the stop to carry on.");

  // ── derived HUD data ──────────────────────────────────────────────────
  const mission = encounter?.mission || null;
  const beat = mission?.beats[hud.beatIndex] || null;
  const beatState = hud.beatState;
  const pickables = hud.pickables;
  const stop = encounter?.stop || null;
  const npc = stop ? CAST[stop.character] : null;
  const scoredBeats = mission ? mission.beats.filter(b => b.mechanic !== MECHANICS.SIGNPOST) : [];
  const scoredDone = mission ? mission.beats.slice(0, hud.beatIndex + (beatState?.done ? 1 : 0)).filter(b => b.mechanic !== MECHANICS.SIGNPOST).length : 0;
  const heroCast = CAST[progress.hero] || CAST.speedy;
  const mapStop = getTrailStop(mapStopId) || TRAIL[0];
  const land = LANDS[(mode === "encounter" ? stop?.land : mapStop?.land) || "meadow"];

  const promptText = beat ? beat.prompt.text : "";
  const blendReady = beat?.mechanic === MECHANICS.BLEND_BRIDGE && beatState?.phase === "blend";
  const heartLearn = beat?.mechanic === MECHANICS.HEART_LANTERN && beatState?.phase === "learn";
  const heartPhrase = beat?.mechanic === MECHANICS.HEART_LANTERN && beatState?.phase === "phrase" && !beatState?.done;
  const signpostReady = beat?.mechanic === MECHANICS.SIGNPOST && !beatState?.done;
  const showPick = !hud.roomDone && !signpostReady && !blendReady && !heartPhrase && !heartLearn;
  const resumable = Boolean(meetStop && progress.checkpoint?.stopId === meetStop.id && !isStopCompleted(progress, meetStop.id));

  return (
    <div className="ss3" data-ss3-mode={mode} style={CSS_VARIABLES}>
      <canvas ref={canvasRef} className="ss3__canvas" onPointerDown={onPointerDown} aria-hidden="true" />

      <div className="ss3__hud">
        {/* one h1 per child route */}
        <div className="ss3-board ss3__title">
          <img src={mode === "encounter" ? npc?.sprite : (heroCast?.heroSprite || heroCast?.sprite)} alt="" />
          <h1>
            {mode === "encounter" ? `${stop.name} · ${npc?.name}` : "Sound Seekers"}
            <small>{mode === "encounter" ? `${land.title}` : `${land.title} · you are ${heroCast.name}`}</small>
          </h1>
        </div>

        {mode === "encounter" && beat && (
          <div className="ss3-board ss3__prompt" data-child-instruction="true">
            <div className="ss3__prompt-text">{promptHtml(promptText)}</div>
            <button type="button" className="ss3__replay" onClick={replay} aria-label="Hear it again" aria-pressed={replaying}>◖)))</button>
          </div>
        )}
        {mode === "map" && (
          <div className="ss3-board ss3__prompt" data-child-instruction="true">
            <div className="ss3__prompt-text">{mapHint}</div>
          </div>
        )}

        <div className="ss3__top-right">
          {mode === "encounter" && mission && (
            <div className="ss3-board ss3__lanterns" aria-label={`Puzzle ${Math.min(scoredDone + 1, scoredBeats.length)} of ${scoredBeats.length}`} data-child-progress="true">
              {scoredBeats.map((b, i) => (
                <span key={b.id} className={`ss3__lantern ${i < scoredDone ? "ss3__lantern--lit" : i === scoredDone ? "ss3__lantern--active" : ""}`} />
              ))}
            </div>
          )}
          {mode === "map" && (
            <div className="ss3-board ss3__lanterns" aria-label={`${Object.keys(progress.completed).length} of ${TRAIL.length} stops fixed`} data-child-progress="true">
              <span className="ss3__lantern ss3__lantern--lit" /> <b style={{ marginLeft: 4 }}>{Object.keys(progress.completed).length} / {TRAIL.length}</b>
            </div>
          )}
          <button type="button" className="ss3__icon-btn" onClick={() => setPaused(true)} aria-label="Pause">❚❚</button>
        </div>

        <div className={`ss3-board ss3__feedback ${feedbackShow ? "ss3__feedback--show" : ""}`} role="status" aria-live="polite">{feedback}</div>

        {mode === "encounter" && (
          <>
            <div className="ss3__pad">
              <button type="button" className="ss3__ctl" aria-label="Walk left" onPointerDown={hold("left", true)} onPointerUp={hold("left", false)} onPointerCancel={hold("left", false)} onPointerLeave={hold("left", false)}>◀</button>
              <button type="button" className="ss3__ctl" aria-label="Walk right" onPointerDown={hold("right", true)} onPointerUp={hold("right", false)} onPointerCancel={hold("right", false)} onPointerLeave={hold("right", false)}>▶</button>
              <button type="button" className="ss3__ctl" aria-label="Jump" onPointerDown={hold("jump", true)} onPointerUp={hold("jump", false)} onPointerCancel={hold("jump", false)} onPointerLeave={hold("jump", false)}>⤒</button>
            </div>
            <div className="ss3__actions">
              {signpostReady && (
                <button type="button" className="ss3__ctl ss3__ctl--go ss3__ctl--wide" onClick={send({ type: "FINISH" })} data-child-primary="true">Got it ✓</button>
              )}
              {blendReady && (
                <button type="button" className="ss3__ctl ss3__ctl--go ss3__ctl--wide" onClick={send({ type: "BLEND" })} data-child-primary="true">Blend!</button>
              )}
              {heartLearn && (
                <button type="button" className="ss3__ctl ss3__ctl--go ss3__ctl--wide" onClick={send({ type: "READY" })} data-child-primary="true">Find it ▶</button>
              )}
              {heartPhrase && (
                <button type="button" className="ss3__ctl ss3__ctl--go ss3__ctl--wide" onClick={send({ type: "FINISH" })} data-child-primary="true">Done ✓</button>
              )}
              {hud.roomDone && !hud.complete && (
                <button type="button" className="ss3__ctl ss3__ctl--go ss3__ctl--wide" onClick={encAct(enc => enc.goNext())} data-child-primary="true">Next ▶</button>
              )}
              {showPick && (
                <button type="button" className="ss3__ctl ss3__ctl--primary ss3__ctl--wide" onClick={encAct(enc => enc.key("KeyE", true))} data-child-primary="true">Pick ✋</button>
              )}
            </div>
            <div className={`ss3__proxies ${bigButtons ? "" : "ss3__proxies--hidden"}`} aria-label="Choices" data-child-choices="true">
              {pickables.map(p => (
                <button key={p.id} type="button" className="ss3__proxy" onClick={encAct(enc => enc.activateById(p.id))}>{p.label}</button>
              ))}
              {beat && beat.mechanic === MECHANICS.WORD_FORGE && beatState?.placed?.length > 0 && !beatState.done && (
                <button type="button" className="ss3__proxy" onClick={send({ type: "REMOVE_LAST" })}>Take the last tile back</button>
              )}
              {beat && !beatState?.done && beat.mechanic !== MECHANICS.SIGNPOST && (
                <button type="button" className="ss3__proxy" onClick={send({ type: "REQUEST_MODEL" })}>Show me</button>
              )}
            </div>
          </>
        )}

        {mode === "map" && (
          <>
            <div className="ss3__pad">
              <button type="button" className="ss3__ctl" aria-label="Walk back" onClick={mapAct("ArrowLeft")}>◀</button>
              <button type="button" className="ss3__ctl" aria-label="Walk on" onClick={mapAct("ArrowRight")}>▶</button>
            </div>
            <div className="ss3__actions">
              <button type="button" className="ss3__ctl ss3__ctl--primary ss3__ctl--wide" onClick={mapAct("Enter")} data-child-primary="true">
                Help {CAST[mapStop?.character]?.name || "them"} ✋
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── cards ───────────────────────────────────────────────────── */}
      {mode === "hero" && (
        <div className="ss3__scrim">
          <div className="ss3-board ss3__card" role="dialog" aria-modal="true" aria-labelledby="ss3-hero-title">
            <h2 id="ss3-hero-title">Who will you be?</h2>
            <p>Pick your Sound Seeker. You can change later.</p>
            <div className="ss3__heroes" data-child-choices="true">
              {HEROES.map(h => (
                <button key={h.id} type="button" className="ss3__hero-card" aria-pressed={pendingHero === h.id} onClick={() => { setPendingHero(h.id); fx.pop(); }}>
                  <img src={CAST[h.id].heroSprite || CAST[h.id].sprite} alt="" />
                  <b>{h.name}</b>
                  <span>{h.blurb}</span>
                </button>
              ))}
            </div>
            <div className="ss3__row">
              <button type="button" className="ss3__btn ss3__btn--go" onClick={chooseHero} data-child-primary="true">Start the trail ▶</button>
            </div>
          </div>
        </div>
      )}

      {meetStop && mode === "map" && (
        <div className="ss3__scrim" onClick={e => { if (e.target === e.currentTarget) setMeetStop(null); }}>
          <div className="ss3-board ss3__card" role="dialog" aria-modal="true" aria-labelledby="ss3-meet-title">
            <img className="ss3__portrait" src={CAST[meetStop.character]?.sprite} alt="" />
            <h2 id="ss3-meet-title">{CAST[meetStop.character]?.name} at {meetStop.name}</h2>
            <div className="ss3__speech">“{meetStop.problem}”</div>
            <div className="ss3__row">
              {resumable && (
                <button type="button" className="ss3__btn ss3__btn--go" onClick={() => startEncounter(meetStop, { resume: true })} data-child-primary="true">Carry on ▶</button>
              )}
              <button type="button" className={`ss3__btn ${resumable ? "" : "ss3__btn--go"}`} onClick={() => startEncounter(meetStop)} data-child-primary={resumable ? undefined : "true"}>
                {isStopCompleted(progress, meetStop.id) ? "Play again ▶" : resumable ? "Start over" : `Help ${CAST[meetStop.character]?.name} ▶`}
              </button>
              <button type="button" className="ss3__btn ss3__btn--quiet" onClick={() => setMeetStop(null)}>Not now</button>
            </div>
          </div>
        </div>
      )}

      {done && (
        <div className="ss3__scrim">
          <div className="ss3-board ss3__card" role="dialog" aria-modal="true" aria-labelledby="ss3-done-title">
            <div className="ss3__token" aria-hidden="true">{TOKEN_GLYPH[done.stop?.token] || "⭐"}</div>
            <h2 id="ss3-done-title">{done.stop?.name} is fixed!</h2>
            <p>{done.stop?.fix}</p>
            <div className="ss3__row">
              <button type="button" className="ss3__btn ss3__btn--go" onClick={finishStop} data-child-primary="true">Back to the trail ▶</button>
            </div>
          </div>
        </div>
      )}

      {paused && (
        <div className="ss3__scrim">
          <div className="ss3-board ss3__card" role="dialog" aria-modal="true" aria-labelledby="ss3-pause-title">
            <h2 id="ss3-pause-title">Paused</h2>
            <p>Your place is saved.</p>
            <div className="ss3__settings-row"><span>Sound</span><button type="button" className="ss3__toggle" aria-pressed={soundOn} onClick={() => setSoundOn(v => !v)}>{soundOn ? "On" : "Off"}</button></div>
            <div className="ss3__settings-row"><span>Big buttons for choices</span><button type="button" className="ss3__toggle" aria-pressed={bigButtons} onClick={() => setBigButtons(v => !v)}>{bigButtons ? "On" : "Off"}</button></div>
            <div className="ss3__settings-row"><span>Change my Sound Seeker</span><button type="button" className="ss3__toggle" onClick={() => { setPaused(false); setMode("hero"); }}>Change</button></div>
            <div className="ss3__row" style={{ marginTop: 14 }}>
              <button type="button" className="ss3__btn ss3__btn--go" onClick={() => setPaused(false)} data-child-primary="true">Keep playing ▶</button>
              {mode === "encounter" && <button type="button" className="ss3__btn" onClick={leaveEncounter}>Back to the trail</button>}
              {onExit && <button type="button" className="ss3__btn ss3__btn--quiet" onClick={onExit}>Leave Sound Seekers</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

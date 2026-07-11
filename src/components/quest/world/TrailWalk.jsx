// THE WALK — this replaces StopRunner, which was a quiz with a map on it.
//
// The creature walks a real path through a real place. Things stand IN the path:
// a patch of flowers, a broken bridge, a hungry beast. You reach one, it happens,
// you walk on. Most of the time you are walking. That is the game.
//
// WHAT IS GONE, ON PURPOSE:
//   - the stop screen with a list of shells
//   - the "1 of 6" progress pips across the top
//   - the six-round Gate at the end of every stop
//
// Teach Your Monster has none of those things either. Mastery still accrues from
// every response — quietly, in the background, exactly as before. It never needed
// a boss quiz to measure it.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CreatureFigure from "../CreatureFigure.jsx";
import WorldScene from "./WorldScene.jsx";
import Prop from "./Props.jsx";
import Guide from "./Guide.jsx";
import { ENCOUNTER_VIEWS } from "./encounterViews.js";
import { buildWalk, WALK_SPEED } from "../../../utils/questEncounters.js";
import { targetsForStop } from "../../../utils/questReviewScheduler.js";
import { targetsAtStop, getStop } from "../../../data/questSequence.js";
import { starRubric } from "../../../utils/starRubric.js";
import { playStarChime, playWhoosh } from "../../../utils/audio/gameSfx.js";

const REACH = 70;          // how close you must get for a thing to happen
const SCENE_H = 620;

export default function TrailWalk({
  stopId,
  state,
  resume = null,
  isSoundEnabled = true,
  onAnswer,
  onCheckpoint,
  onFinish,
  onQuit
}) {
  const stop = getStop(stopId);

  const targets = useMemo(
    () => targetsForStop(targetsAtStop(stopId), state.mastery, stop?.index || 1),
    [stopId, state.mastery, stop]
  );
  const seed = useMemo(
    () => (stop?.index || 1) * 1000 + (state.trail.stopsDone.length || 0),
    [stop, state.trail.stopsDone.length]
  );
  const walk = useMemo(() => buildWalk(stopId, { mastery: state.mastery, targets, seed }), [stopId, state.mastery, targets, seed]);

  // A short "here's the new sound" moment BEFORE the walk. Not a lesson screen —
  // three seconds, then you're in the world. Skippable.
  const [phase, setPhase] = useState(() => (resume?.phase === "walk" || !walk?.teach?.length ? "walk" : "meet"));
  const [meetIndex, setMeetIndex] = useState(0);

  const [x, setX] = useState(resume?.x || walk?.startX || 200);
  const [targetX, setTargetX] = useState(resume?.x || walk?.startX || 200);
  const [solved, setSolved] = useState(() => new Set(resume?.solved || []));
  const [picked, setPicked] = useState(() => new Set(resume?.drops || []));
  const [active, setActive] = useState(null);
  const [beatIndex, setBeatIndex] = useState(0);
  const [mood, setMood] = useState("idle");

  const tally = useRef({ correct: 0, total: 0, mistakes: 0 });
  const raf = useRef(0);
  const last = useRef(0);

  // Viewport width, measured by a CALLBACK REF rather than read from a ref during
  // render. Reading `ref.current` while rendering is a lie React can't keep: it
  // won't re-render when the value changes, so on a rotate or a resize the camera
  // would silently keep using the old width and the world would sit off-centre.
  const [viewW, setViewW] = useState(900);
  const measure = useCallback(node => {
    if (node) setViewW(node.clientWidth || 900);
  }, []);

  useEffect(() => {
    const onResize = () => setViewW(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // The next thing standing in the path. You cannot walk past it — the world
  // gates you, not a menu.
  const blocker = useMemo(
    () => (walk?.encounters || []).find(e => !solved.has(e.id)) || null,
    [walk, solved]
  );
  const wall = blocker ? blocker.x : (walk?.endX ?? 0);

  // ── THE WALK LOOP ────────────────────────────────────────────────────────
  //
  // ONE animation frame does everything: move, look for a thing in the path, pick
  // up a sun-drop, notice the end. It used to be four reactive effects that each
  // called setState in their body — cascading renders, and a real re-entrancy
  // hazard: the "you reached the bridge" effect re-ran on every dependency change,
  // so a child could trip an encounter twice.
  //
  // A game loop belongs in a game loop.
  const live = useRef({ x, targetX, wall, blocker, walk, picked, active, phase, isSoundEnabled });
  useEffect(() => {
    live.current = { x, targetX, wall, blocker, walk, picked, active, phase, isSoundEnabled };
  });

  useEffect(() => {
    if (phase !== "walk" || active) return undefined;
    let alive = true;
    last.current = 0;

    const step = now => {
      if (!alive) return;
      const L = live.current;
      if (!last.current) last.current = now;
      const dt = Math.min(0.05, (now - last.current) / 1000);
      last.current = now;

      const goal = Math.min(L.targetX, L.wall);
      const d = goal - L.x;
      let next = L.x;

      if (Math.abs(d) > 1.5) {
        next = L.x + Math.sign(d) * Math.min(Math.abs(d), WALK_SPEED * dt);
        setX(next);
        setMood("walk");
      } else {
        setMood(m => (m === "walk" ? "idle" : m));
      }

      // A thing in the path.
      if (L.blocker && Math.abs(next - L.blocker.x) <= REACH) {
        if (L.isSoundEnabled) playWhoosh();
        setActive(L.blocker);
        setBeatIndex(0);
        return;                       // stop the loop; the encounter has it now
      }

      // Sun-drops, picked up by walking over them.
      const drop = L.walk.drops.find(dr => !L.picked.has(dr.id) && Math.abs(next - dr.x) < 46);
      if (drop) {
        setPicked(p => new Set([...p, drop.id]));
        if (L.isSoundEnabled) playStarChime();
      }

      // The end of the path.
      if (!L.blocker && next >= L.walk.endX - 8) {
        const t = tally.current;
        const stars = starRubric({ correct: t.correct, total: t.total, mistakes: t.mistakes, deaths: 0 });
        onFinish?.(stars, { ...t, drops: L.picked.size });
        return;
      }

      raf.current = requestAnimationFrame(step);
    };

    raf.current = requestAnimationFrame(step);
    return () => { alive = false; cancelAnimationFrame(raf.current); };
  }, [phase, active, onFinish]);

  // The camera is DERIVED, not stored. Storing it meant a second render every
  // frame purely to move the background.
  const camera = Math.max(0, Math.min(Math.max(0, (walk?.length || 0) - viewW), x - viewW * 0.38));

  const answer = useCallback((correct, target) => {
    tally.current.total += 1;
    if (correct) tally.current.correct += 1;
    else tally.current.mistakes += 1;
    setMood(correct ? "cheer" : "sad");
    if (target == null) return;
    for (const one of Array.isArray(target) ? target : [target]) {
      if (one) onAnswer?.(one, correct, active?.kind || "walk");
    }
  }, [onAnswer, active]);

  const nextBeat = useCallback(() => {
    if (!active) return;
    if (beatIndex + 1 < active.beats.length) {
      setBeatIndex(i => i + 1);
      return;
    }
    // Thing resolved. The path opens. Walk on.
    const done = new Set([...solved, active.id]);
    setSolved(done);
    setActive(null);
    setMood("idle");
    setTargetX(walk.endX);
    onCheckpoint?.({ stopId, phase: "walk", x: live.current.x, solved: [...done], drops: [...picked] });
  }, [active, beatIndex, solved, walk, stopId, onCheckpoint, picked]);

  if (!walk) return null;

  const groundY = SCENE_H * 0.72;
  const View = active ? ENCOUNTER_VIEWS[active.kind] : null;
  const teach = walk.teach[meetIndex];

  return (
    <div className="q-screen qw-root" ref={measure}>
      <WorldScene world={walk.world} length={walk.length} height={SCENE_H} seed={walk.stopIndex} camera={camera} />

      {/* The world layer: props and the creature, moving with the ground. */}
      <div className="qw-world" style={{ transform: `translate3d(${-camera}px,0,0)` }}>
        {walk.drops.filter(d => !picked.has(d.id)).map(d => (
          <span key={d.id} className="qw-drop" style={{ left: d.x, bottom: `${18 + d.y * 90}px` }} />
        ))}

        {/* THE THINGS IN THE PATH. Each has two states, and the change IS the
            reward: the bridge gets its planks and you cross it; the flowers
            bloom; the beast sits down, full, and waves you past. A star counter
            is a receipt. This is a reward. */}
        {walk.encounters.map(e => (
          <span
            key={e.id}
            className={`qw-prop qw-prop-${e.kind}${solved.has(e.id) ? " is-solved" : ""}${active?.id === e.id ? " is-active" : ""}`}
            style={{ left: e.x, bottom: SCENE_H - groundY - 34 }}
            aria-hidden="true"
          >
            <Prop kind={e.kind} done={solved.has(e.id)} />
          </span>
        ))}

        <span className="qw-flag" style={{ left: walk.endX + 60, bottom: SCENE_H - groundY - 40 }} aria-hidden="true" />

        <div className="qw-creature" style={{ left: x, bottom: SCENE_H - groundY - 30 }}>
          <CreatureFigure key={mood} creature={state.creature} size={132} mood={mood} />
        </div>
      </div>

      {/* Tap the ground to walk there. That's the whole control scheme. */}
      {phase === "walk" && !active && (
        <button
          type="button"
          className="qw-tapzone"
          aria-label="Walk"
          onClick={e => {
            const rect = e.currentTarget.getBoundingClientRect();
            setTargetX(Math.min(walk.endX, Math.max(walk.startX, camera + (e.clientX - rect.left))));
          }}
        />
      )}

      {/* A CHARACTER gives you the sound, not a text box. The first version was a
          yellow square with a letter in it — a flashcard with a drop shadow. */}
      {phase === "meet" && teach && (
        <Guide
          key={teach.id}
          world={walk.world}
          entry={teach}
          isSoundEnabled={isSoundEnabled}
          last={meetIndex + 1 >= walk.teach.length}
          onNext={() => {
            if (meetIndex + 1 < walk.teach.length) setMeetIndex(i => i + 1);
            else { setPhase("walk"); setTargetX(walk.endX); }
          }}
        />
      )}

      {/* An encounter happens IN the world — a panel by the prop, not a screen. */}
      {View && (
        <div className="qw-panel">
          <View
            key={`${active.id}-${beatIndex}`}
            beat={active.beats[beatIndex]}
            index={beatIndex}
            total={active.beats.length}
            isSoundEnabled={isSoundEnabled}
            onBeat={answer}
            onDone={nextBeat}
          />
        </div>
      )}

      <header className="qw-hud">
        <button type="button" className="q-ghost" onClick={onQuit}>Leave</button>
        <span className="qw-stopname">{stop.name}</span>
        <span className="qw-drops">{picked.size}/{walk.drops.length}</span>
      </header>
    </div>
  );
}

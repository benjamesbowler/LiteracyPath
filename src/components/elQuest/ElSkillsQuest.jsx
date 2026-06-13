import { useEffect, useMemo, useRef, useState } from "react";
import { elSkillsBlockCycles } from "../../data/elSkillsBlockCycles.js";
import { getChildWordAsset } from "../../data/childAssets";
import { playCueAudio, stopCueAudio } from "../../utils/audio/cuePlayer.js";
import { playCorrectChime, playSoftBuzz, playCelebrationFanfare, playStarChime } from "../../utils/audio/gameSfx.js";
import { queueProgressSave } from "../../utils/progressSync.js";
import { notifyMissionTaskDone } from "../../utils/dailyMission.js";
import { awardCollectible, getCompanion } from "../../utils/studentProfile.js";
import { printCertificate } from "../../utils/printCertificate.js";
import { Gem } from "../Gem.jsx";
import { gemForIndex } from "../../data/gemSet.js";
import { worldForCycle, worldStyle, sceneForKey } from "../../utils/palWorlds.js";
import { ConfettiCelebration } from "../learn/games/shared/ConfettiCelebration.jsx";
import { ProgressStars } from "../learn/games/shared/ProgressStars.jsx";
import {
  STATIONS,
  buildStationRounds,
  graphemeAudioPath,
  starsForAccuracy,
  shuffleItems
} from "./elQuestEngine.js";
import "../../styles/skills-block-quest.css";

const STORAGE_PREFIX = "lp-el-quest";

// The adventure map: three lands, one full-screen map each. Every cycle
// is a named landmark along a winding trail.
const WORLD_REGIONS = [
  {
    id: "meadow",
    name: "Meadow Farm",
    test: n => n <= 9,
    landmarks: ["The Big Barn", "Strawberry Field", "Sheep Pen", "Duck Pond", "Carrot Patch", "Haystack Hill", "The Old Orchard", "Flower Meadow", "Farm Gate"]
  },
  {
    id: "dino",
    name: "Dinosaur Valley",
    test: n => n >= 10 && n <= 18,
    landmarks: ["The Mud Pits", "Green Valley", "Giant Plants", "Stomping Grounds", "Fossil Creek", "Eggshell Rocks", "Fern Forest", "Lava Lookout", "The Volcano"]
  },
  {
    id: "moonwood",
    name: "Moonwood Forest",
    test: n => n >= 19,
    landmarks: ["Glow-mushroom Grove", "Firefly Hollow", "Whispering Trees", "Moonlit Pond", "Starfall Clearing", "The Old Oak Door", "Crystal Cave", "Owl's Lookout", "The Moon Tower"]
  }
];

// Stop coordinates (percent of the map board) pinned to the landmarks
// painted on each world's map artwork.
const WORLD_MAP_POINTS = {
  meadow: [[20, 9], [55, 12], [82, 14], [30, 33], [68, 38], [72, 53], [21, 70], [58, 78], [80, 88]],
  dino: [[20, 10], [50, 14], [80, 20], [30, 34], [73, 40], [18, 55], [48, 61], [82, 61], [55, 86]],
  moonwood: [[50, 8], [28, 22], [72, 30], [50, 42], [68, 49], [30, 60], [58, 68], [73, 79], [45, 88]]
};

// Horizontal (landscape) maps for laptop/projector: the journey runs left → right
// from the entrance to the final landmark. Stops are in journey order. These
// coordinates are a first pass pinned by eye to the wide art and may need tuning.
// Pinned by eye to the landmarks painted on each wide map, in journey order
// (entrance on the left → destination on the right).
// Placed by Benjamin using the click-to-place tool (exact positions, not guessed).
const WORLD_MAP_POINTS_WIDE = {
  meadow: [[12.6, 85.8], [12.3, 63.3], [21.2, 48.2], [40.5, 43.6], [65.2, 67.2], [92.6, 88.9], [81.5, 60.6], [64.2, 43.6], [81.2, 37.6]],
  dino: [[5.4, 38], [14.6, 58.8], [10.6, 86.3], [38, 83.6], [45.7, 38.5], [61.5, 56], [76.8, 87.8], [93.3, 56.8], [88.2, 23]],
  moonwood: [[7.4, 58], [12.3, 86], [34.1, 89.1], [46.4, 65.3], [57.5, 88.7], [70.9, 62.8], [81.2, 86], [97, 80.7], [92.1, 56.2]]
};

// Landmark names in entrance → destination order (used by the wide map so the
// labels match the left-to-right journey).
const WORLD_LANDMARKS_WIDE = {
  meadow: ["Farm Gate", "Carrot Patch", "Duck Pond", "Flower Meadow", "The Old Orchard", "Haystack Hill", "Sheep Pen", "Strawberry Field", "The Big Barn"],
  dino: ["The Mud Pits", "Green Valley", "Fern Forest", "Giant Plants", "Fossil Creek", "Eggshell Rocks", "Stomping Grounds", "Lava Lookout", "The Volcano"],
  moonwood: ["Glow-mushroom Grove", "Firefly Hollow", "Whispering Trees", "Moonlit Pond", "Starfall Clearing", "Crystal Cave", "The Old Oak Door", "Owl's Lookout", "The Moon Tower"]
};

// Native pixel space of each map artwork (sets the SVG viewBox + board aspect).
const MAP_VIEW = { portrait: { w: 1195, h: 1600 }, wide: { w: 2752, h: 1536 } };

// A smooth (Catmull-Rom → cubic bezier) route through the landmark anchors, in the
// map art's native pixel space (w × h). The avatar glides ALONG this curve (it
// doubles as the painted-road motion path), so movement follows the road.
function buildRoutePath(points, w = 1195, h = 1600) {
  const pts = points.map(([x, y]) => [(x / 100) * w, (y / 100) * h]);
  if (pts.length < 2) return "";
  const d = [`M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d.push(`C ${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`);
  }
  return d.join(" ");
}


function loadQuestProgress(scopeKey) {
  if (typeof window === "undefined") return { cycles: {} };
  try {
    const parsed = JSON.parse(window.localStorage.getItem(`${STORAGE_PREFIX}:${scopeKey}`) || "null");
    return parsed && typeof parsed === "object" ? { cycles: {}, ...parsed } : { cycles: {} };
  } catch {
    return { cycles: {} };
  }
}

function saveQuestProgress(scopeKey, progress) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`${STORAGE_PREFIX}:${scopeKey}`, JSON.stringify(progress));
  } catch {
    // Local persistence is best-effort; cloud sync still queues below.
  }
  queueProgressSave("el_quest", "__all__", { v: 1, ...progress }, { scopeKey });
}

function playCue(round) {
  if (!round?.audio) return;
  playCueAudio(round.audio, {
    // Gold voice or silence - the robotic browser voice never plays.
    onUnavailable: () => {}
  });
}

function SpeakerIcon() {
  return (
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 5 6 9H3v6h3l5 4V5Z" fill="currentColor" stroke="none" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 6a9 9 0 0 1 0 12" />
    </svg>
  );
}

function PictureChoice({ word }) {
  const [failed, setFailed] = useState(false);
  const asset = getChildWordAsset(word, { allowBlockedAssessmentImage: true });
  const src = asset?.image || asset?.fallbackImage || "";
  if (!src || failed) return <span className="sbq-choice-word">{word}</span>;
  return (
    <>
      <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} />
      <span className="sbq-choice-caption">{word}</span>
    </>
  );
}

// Letter tracing: a big faint letter with a finger-paint canvas on top.
// Generous by design - any decent amount of tracing counts.
function TraceRound({ round, onResult }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const [ink, setInk] = useState(0);

  function pointFrom(event) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return [
      ((event.clientX - rect.left) * canvas.width) / rect.width,
      ((event.clientY - rect.top) * canvas.height) / rect.height
    ];
  }

  function paint(event) {
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const [x, y] = pointFrom(event);
    ctx.fillStyle = "#2F9E62";
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.fill();
    setInk(value => value + 1);
  }

  function clearInk() {
    const canvas = canvasRef.current;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    setInk(0);
  }

  return (
    <div className="sbq-trace">
      <div className="sbq-trace-stage">
        <span className="sbq-trace-letter" aria-hidden="true">{round.letter}</span>
        <canvas
          ref={canvasRef}
          width={460}
          height={300}
          aria-label={`Trace the letter ${round.letter}`}
          onPointerDown={event => { drawing.current = true; event.currentTarget.setPointerCapture(event.pointerId); paint(event); }}
          onPointerMove={paint}
          onPointerUp={() => { drawing.current = false; }}
          onPointerCancel={() => { drawing.current = false; }}
        />
      </div>
      <div className="sbq-trace-actions">
        <button className="sbq-ghost-button" type="button" onClick={clearInk}>
          Start again
        </button>
        <button
          className="sbq-primary-button"
          type="button"
          disabled={ink < 25}
          onClick={() => onResult(true)}
        >
          Done!
        </button>
      </div>
    </div>
  );
}

function BuildRound({ round, onResult }) {
  // placed = [{ letter, tileIndex }] so duplicate letters keep their own tile.
  const [placed, setPlaced] = useState([]);
  const [checking, setChecking] = useState(false);
  const letters = useMemo(() => {
    const target = round.word.split("");
    const extras = shuffleItems("aeioustmnp".split("").filter(l => !target.includes(l))).slice(0, 2);
    return shuffleItems([...target, ...extras]);
  }, [round.word]);

  const usedTiles = new Set(placed.map(item => item.tileIndex));

  function tapLetter(letter, tileIndex) {
    if (checking || usedTiles.has(tileIndex) || placed.length >= round.word.length) return;
    const cue = graphemeAudioPath(letter);
    if (cue) playCueAudio(cue, { volume: 0.9 });
    const next = [...placed, { letter, tileIndex }];
    setPlaced(next);

    if (next.length !== round.word.length) return;

    if (next.map(item => item.letter).join("") === round.word) {
      setChecking(true);
      window.setTimeout(() => onResult(true), 420);
    } else {
      // Wrong word: count the miss, tip the letters out, try again.
      onResult(false);
      setChecking(true);
      window.setTimeout(() => {
        setPlaced([]);
        setChecking(false);
      }, 750);
    }
  }

  function removeAt(slotIndex) {
    if (checking || slotIndex >= placed.length) return;
    setPlaced(current => current.filter((_, index) => index !== slotIndex));
  }

  return (
    <>
      <div className="sbq-build-slots" aria-label="Word letters. Tap a filled box to take the letter out.">
        {round.word.split("").map((letter, index) => (
          placed[index] ? (
            <button
              key={`slot-${index}`}
              type="button"
              className="filled"
              aria-label={`Remove letter ${placed[index].letter}`}
              onClick={() => removeAt(index)}
            >
              {placed[index].letter}
            </button>
          ) : (
            <span key={`slot-${index}`} />
          )
        ))}
      </div>
      <div className="sbq-answer-grid letters" aria-label="Letter choices">
        {letters.map((letter, index) => (
          <button
            key={`${letter}-${index}`}
            type="button"
            disabled={usedTiles.has(index)}
            className={usedTiles.has(index) ? "used" : ""}
            onClick={() => tapLetter(letter, index)}
          >
            {letter}
          </button>
        ))}
      </div>
    </>
  );
}

export function ElSkillsQuest({ studentName = "Reader", progressScopeKey = "default", onExit }) {
  const playableCycles = useMemo(
    () => elSkillsBlockCycles.filter(cycle => cycle.cycleNumber),
    []
  );
  const [progress, setProgress] = useState(() => loadQuestProgress(progressScopeKey));
  const recommendedCycle = useMemo(() => (
    playableCycles.find(cycle => !(progress.cycles?.[cycle.id]?.stars > 0)) || playableCycles[0]
  ), [playableCycles, progress]);

  const [activeCycleId, setActiveCycleId] = useState(null);
  const [stationId, setStationId] = useState(null);
  const [rounds, setRounds] = useState([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrongs, setWrongs] = useState(0);
  const [shaking, setShaking] = useState(false);
  const [encourage, setEncourage] = useState(false);
  const [celebration, setCelebration] = useState(null);
  const [sessionStations, setSessionStations] = useState({});
  const [mapWorldId, setMapWorldId] = useState(null);
  const [mapZoom, setMapZoom] = useState(1);
  const cueTimerRef = useRef(null);

  const activeCycle = playableCycles.find(cycle => cycle.id === activeCycleId) || null;
  const round = rounds[roundIndex] || null;

  useEffect(() => {
    if (!round || round.type === "build" || !round.audio) return undefined;
    // The poem narration is ~10s: hear it in full on the first round,
    // then only when the child taps Listen.
    if (round.type === "poem" && roundIndex > 0) return undefined;
    cueTimerRef.current = window.setTimeout(() => playCue(round), 120);
    // Warm the next round's audio so it starts instantly.
    const next = rounds[roundIndex + 1];
    if (next?.audio) {
      try { new Audio(next.audio).preload = "auto"; } catch { /* ignore */ }
    }
    return () => window.clearTimeout(cueTimerRef.current);
  }, [round, rounds, roundIndex]);

  function openCycle(cycle) {
    setActiveCycleId(cycle.id);
    setStationId(null);
    setCelebration(null);
    setSessionStations({});
  }

  function startStation(cycle, id) {
    setStationId(id);
    setRounds(buildStationRounds(cycle, id));
    setRoundIndex(0);
    setCorrect(0);
    setWrongs(0);
    setCelebration(null);
  }

  function finishStation(finalCorrect, finalWrongs) {
    stopCueAudio();
    const total = rounds.length;
    if (stationId === "check") {
      // The mission's quest task = a full cycle, sealed by the Cycle Check.
      notifyMissionTaskDone(progressScopeKey, "quest");
      const stars = starsForAccuracy(finalCorrect, total, finalWrongs);
      const previous = progress.cycles?.[activeCycle.id] || {};
      const nextProgress = {
        ...progress,
        cycles: {
          ...progress.cycles,
          [activeCycle.id]: {
            stars: Math.max(previous.stars || 0, stars),
            bestScore: Math.max(previous.bestScore || 0, finalCorrect * 10),
            plays: (previous.plays || 0) + 1,
            lastPlayedAt: new Date().toISOString()
          }
        }
      };
      setProgress(nextProgress);
      saveQuestProgress(progressScopeKey, nextProgress);
      playCelebrationFanfare();
      const gem = stars > 0
        ? awardCollectible(progressScopeKey, {
            key: `cycle-${activeCycle.id}`,
            ...gemForIndex(activeCycle.cycleNumber || 0),
            label: `Cycle ${activeCycle.cycleNumber}`
          })
        : null;
      setCelebration({ kind: "cycle", stars, correct: finalCorrect, total, gem });
    } else {
      playStarChime();
      const doneNow = { ...sessionStations, [stationId]: true };
      setSessionStations(doneNow);
      // Persist which stations are done so progress survives sign-out.
      const savedStations = {
        ...(progress.cycles?.[activeCycle.id]?.stations || {}),
        [stationId]: true
      };
      const withStations = {
        ...progress,
        cycles: {
          ...progress.cycles,
          [activeCycle.id]: {
            ...(progress.cycles?.[activeCycle.id] || {}),
            stations: savedStations
          }
        }
      };
      setProgress(withStations);
      saveQuestProgress(progressScopeKey, withStations);
      // Choose where the adventure flows next: the first practice station
      // not yet done, or the Cycle Check once enough practice is in.
      const isDone = id => doneNow[id] || savedStations[id];
      const practiceDone = STATIONS.filter(st => st.id !== "check" && isDone(st.id)).length;
      const nextStation = STATIONS.find(st => st.id !== "check" && !isDone(st.id))
        || (practiceDone >= 4 ? STATIONS.find(st => st.id === "check") : null);
      setCelebration({ kind: "station", correct: finalCorrect, total, nextStationId: nextStation?.id || null });
    }
    setStationId(null);
  }

  function handleAnswer(success) {
    if (success) {
      playCorrectChime();
      const nextCorrect = correct + 1;
      setCorrect(nextCorrect);
      if (roundIndex + 1 >= rounds.length) {
        window.setTimeout(() => finishStation(nextCorrect, wrongs), 500);
      } else {
        window.setTimeout(() => setRoundIndex(index => index + 1), 500);
      }
    } else {
      playSoftBuzz();
      setWrongs(value => value + 1);
      setShaking(true);
      setEncourage(true);
      window.setTimeout(() => setEncourage(false), 1500);
    }
  }

  function chooseTile(choice) {
    handleAnswer(choice === round.answer);
  }

  // ── Cycle map ──────────────────────────────────────────────────────────────
  const travelerImage = getCompanion(progressScopeKey)?.image
    || `/images/pals/poses/${worldForCycle(recommendedCycle?.cycleNumber || 1).id}-wave.webp`;

  // The skill stops stay fixed; only the traveler moves. It glides to the
  // recommended stop via a CSS transition on left/top, so all we do here is
  // remember the last stop (kept for progress/animation hooks).
  const stopRefs = useRef({});
  const avatarRef = useRef(null);
  const routeRef = useRef(null);
  const lastIndexRef = useRef(0);
  const prevRegionRef = useRef(null);

  // Drag-to-pan: grab the map and drag to move around when zoomed in. A small
  // movement threshold means a real tap still opens the stop underneath.
  const viewportRef = useRef(null);
  const panRef = useRef({ active: false, x: 0, y: 0, left: 0, top: 0, moved: false });
  function onPanStart(event) {
    const vp = viewportRef.current;
    if (!vp || (event.pointerType === "mouse" && event.button !== 0)) return;
    panRef.current = { active: true, x: event.clientX, y: event.clientY, left: vp.scrollLeft, top: vp.scrollTop, moved: false };
  }
  function onPanMove(event) {
    const p = panRef.current;
    const vp = viewportRef.current;
    if (!p.active || !vp) return;
    const dx = event.clientX - p.x;
    const dy = event.clientY - p.y;
    if (!p.moved && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
      p.moved = true;
      vp.setPointerCapture?.(event.pointerId);
    }
    if (p.moved) {
      vp.scrollLeft = p.left - dx;
      vp.scrollTop = p.top - dy;
    }
  }
  function onPanEnd(event) {
    panRef.current.active = false;
    viewportRef.current?.releasePointerCapture?.(event.pointerId);
  }

  // Wide (horizontal) map on laptop/projector; tall (vertical) map on phone/iPad.
  // "pointer: fine" keeps touch tablets on the vertical map even when wide.
  const [wideMap, setWideMap] = useState(() =>
    typeof window !== "undefined"
      ? Boolean(window.matchMedia?.("(min-width: 1024px) and (pointer: fine)").matches)
      : false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const mq = window.matchMedia("(min-width: 1024px) and (pointer: fine)");
    const onChange = () => setWideMap(mq.matches);
    onChange();
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  // Map geometry (lifted to component scope so the avatar tween effect and the
  // render share the same region/stops/points). Orientation picks the art,
  // stop coordinates, landmark labels, and coordinate space together.
  const homeWorldId = worldForCycle(recommendedCycle?.cycleNumber || 1).id;
  const activeWorldId = mapWorldId || homeWorldId;
  const region = WORLD_REGIONS.find(r => r.id === activeWorldId) || WORLD_REGIONS[0];
  const stops = playableCycles.filter(cycle => region.test(cycle.cycleNumber));
  const mapView = wideMap ? MAP_VIEW.wide : MAP_VIEW.portrait;
  const mapPoints = (wideMap ? WORLD_MAP_POINTS_WIDE : WORLD_MAP_POINTS)[region.id]
    || WORLD_MAP_POINTS.meadow;
  const landmarks = (wideMap ? WORLD_LANDMARKS_WIDE[region.id] : region.landmarks)
    || region.landmarks;
  const mapImage = `/images/pals/maps/${region.id}${wideMap ? "-map-wide" : "-map"}.webp`;
  const routeD = buildRoutePath(mapPoints, mapView.w, mapView.h);

  useEffect(() => {
    if (activeCycle || celebration || !recommendedCycle?.id) return;
    const key = `${STORAGE_PREFIX}-laststop:${progressScopeKey}`;
    try {
      window.localStorage.setItem(key, recommendedCycle.id);
    } catch { /* best effort */ }
  }, [activeCycle, celebration, progressScopeKey, recommendedCycle?.id]);

  // Glide the traveler ALONG the painted road: walk the SVG route with
  // getPointAtLength and tween the arc-length from the last stop to the
  // recommended one. Following the curve (not a left/top transition) is what
  // makes it move along the path instead of straight across the fields.
  useEffect(() => {
    if (activeCycle || celebration) return undefined;
    const path = routeRef.current;
    const avatar = avatarRef.current;
    if (!path || !avatar || !routeD) return undefined;

    const total = path.getTotalLength();
    const STEPS = 240;
    const anchorDist = mapPoints.map(([px, py]) => {
      const tx = (px / 100) * mapView.w;
      const ty = (py / 100) * mapView.h;
      let best = 0;
      let bestD = Infinity;
      for (let s = 0; s <= STEPS; s++) {
        const len = (s / STEPS) * total;
        const p = path.getPointAtLength(len);
        const dd = (p.x - tx) ** 2 + (p.y - ty) ** 2;
        if (dd < bestD) { bestD = dd; best = len; }
      }
      return best;
    });

    const targetIndex = stops.findIndex(c => c.id === recommendedCycle?.id);
    if (targetIndex < 0) return undefined;

    const worldChanged = prevRegionRef.current !== region.id;
    prevRegionRef.current = region.id;
    const fromIndex = worldChanged ? targetIndex : (lastIndexRef.current ?? targetIndex);
    const from = anchorDist[fromIndex] ?? 0;
    const to = anchorDist[targetIndex] ?? 0;
    lastIndexRef.current = targetIndex;

    const place = (dist) => {
      const p = path.getPointAtLength(dist);
      avatar.style.left = `${(p.x / mapView.w) * 100}%`;
      avatar.style.top = `${(p.y / mapView.h) * 100}%`;
    };

    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || from === to) { place(to); return undefined; }

    const dur = Math.min(2200, 600 + Math.abs(to - from) * 0.9);
    let t0 = null;
    let raf = 0;
    const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2);
    const step = (now) => {
      if (t0 === null) t0 = now;
      const t = Math.min(1, (now - t0) / dur);
      place(from + (to - from) * ease(t));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [activeCycle, celebration, routeD, recommendedCycle?.id, region.id, stops, mapPoints, mapView.w, mapView.h]);

  // Station finished: flow straight into the next one after a short
  // celebration beat - children keep playing, with a clear way to stop.
  useEffect(() => {
    if (celebration?.kind !== "station" || !celebration.nextStationId || !activeCycle) return undefined;
    const timer = window.setTimeout(() => {
      setCelebration(null);
      startStation(activeCycle, celebration.nextStationId);
    }, 2600);
    return () => window.clearTimeout(timer);
  }, [celebration, activeCycle]);

  if (!activeCycle) {
    return (
      <main className="skills-block-quest" data-pal-world={worldForCycle(recommendedCycle?.cycleNumber || 1).id}>
        <header className="sbq-top">
          <div>
            <p className="sbq-kicker">Skills Quest</p>
            <h1>Your sound and word path</h1>
            <p className="sbq-sub">Hi {studentName}. Pick your stop - each one teaches two new sounds and your quick words.</p>
          </div>
          {onExit && (
            <button className="sbq-ghost-button" type="button" onClick={onExit}>Back</button>
          )}
        </header>
        {(() => {
          return (
            <div className="sbq-adventure" data-pal-world={region.id}>
              <div className="sbq-world-tabs" role="tablist" aria-label="Choose a land">
                {WORLD_REGIONS.map(world => (
                  <button
                    key={world.id}
                    type="button"
                    role="tab"
                    aria-selected={world.id === region.id}
                    className={world.id === region.id ? "active" : ""}
                    onClick={() => setMapWorldId(world.id)}
                  >
                    {world.name}
                  </button>
                ))}
              </div>
              <div className="sbq-mapwrap">
                <div
                  className="sbq-map-viewport"
                  ref={viewportRef}
                  data-pannable={mapZoom > 1 ? "true" : "false"}
                  onPointerDown={onPanStart}
                  onPointerMove={onPanMove}
                  onPointerUp={onPanEnd}
                  onPointerCancel={onPanEnd}
                >
                  <div
                    className={`sbq-mapboard${wideMap ? " wide" : ""}`}
                    style={{
                      backgroundImage: `url(${mapImage})`,
                      "--map-zoom": mapZoom
                    }}
                  >
                    {/* Painted-road route: drawn under the markers; also the avatar's motion path. */}
                    <svg
                      className="sbq-route"
                      viewBox={`0 0 ${mapView.w} ${mapView.h}`}
                      preserveAspectRatio="xMidYMid slice"
                      aria-hidden="true"
                    >
                      <path ref={routeRef} className="sbq-route-line" d={routeD} />
                    </svg>
                    {stops.map((cycle, index) => {
                      const cycleProgress = progress.cycles?.[cycle.id];
                      const isRecommended = cycle.id === recommendedCycle?.id;
                      const [x, y] = mapPoints[index] || [50, 50];
                      return (
                        <button
                          key={cycle.id}
                          type="button"
                          ref={el => { stopRefs.current[cycle.id] = el; }}
                          className={`sbq-stop${cycleProgress?.stars ? " done" : ""}${isRecommended ? " next" : ""}`}
                          style={{ left: `${x}%`, top: `${y}%` }}
                          onClick={() => { if (panRef.current.moved) return; openCycle(cycle); }}
                          aria-label={`${landmarks[index] || `Cycle ${cycle.cycleNumber}`}${isRecommended ? " - you are here" : ""}`}
                        >
                          <span className="sbq-stop-marker" aria-hidden="true">
                            {cycleProgress?.stars ? "★" : cycle.cycleNumber}
                          </span>
                          <span className="sbq-stop-tip">
                            <span className="sbq-stop-name">{landmarks[index] || "Mystery Spot"}</span>
                            <span className="sbq-stop-skill">
                              {(cycle.focusLetters || []).map(item => item.grapheme).join(" ") || "Review"}
                            </span>
                            {cycleProgress?.stars ? <ProgressStars stars={cycleProgress.stars} /> : null}
                          </span>
                        </button>
                      );
                    })}
                    {/* The traveler: glides along the route via the rAF tween (it sets left/top). */}
                    <div ref={avatarRef} className="sbq-journey-avatar" aria-hidden="true">
                      <span className="sbq-journey-avatar-bob">
                        <img src={travelerImage} alt="" />
                      </span>
                    </div>
                  </div>
                </div>
                <div className="sbq-map-zoom" role="group" aria-label="Zoom the map">
                  <button
                    type="button"
                    aria-label="Zoom out"
                    disabled={mapZoom <= 1}
                    onClick={() => setMapZoom(z => Math.max(1, Math.round((z - 0.25) * 100) / 100))}
                  >−</button>
                  <button
                    type="button"
                    aria-label="Zoom in"
                    disabled={mapZoom >= 2.5}
                    onClick={() => setMapZoom(z => Math.min(2.5, Math.round((z + 0.25) * 100) / 100))}
                  >+</button>
                </div>
              </div>
            </div>
          );
        })()}
      </main>
    );
  }

  // ── Celebration ────────────────────────────────────────────────────────────
  if (celebration) {
    const isCycle = celebration.kind === "cycle";
    return (
      <main className="skills-block-quest">
        <div className="sbq-celebrate">
          {isCycle && <ConfettiCelebration show={celebration.stars > 0} />}
          <img src={isCycle ? worldForCycle(activeCycle.cycleNumber).cheer : worldForCycle(activeCycle.cycleNumber).point} alt="" />
          <h2>{isCycle ? `Cycle ${activeCycle.cycleNumber} complete!` : "Station done!"}</h2>
          <p>{celebration.correct}/{celebration.total} right</p>
          {!isCycle && celebration.nextStationId && (
            <p className="sbq-next-up">
              Next up: <strong>{STATIONS.find(st => st.id === celebration.nextStationId)?.title}</strong>
            </p>
          )}
          {isCycle && <ProgressStars stars={celebration.stars} size="lg" />}
          {isCycle && celebration.gem && (
            <div className="sbq-gem-award">
              <Gem color={celebration.gem.color} size={56} />
              <span>You earned the <strong>{celebration.gem.name}</strong>!</span>
            </div>
          )}
          <div className="sbq-celebrate-actions">
            <button
              className="sbq-primary-button"
              type="button"
              onClick={() => {
                if (!isCycle && celebration.nextStationId) {
                  const nextId = celebration.nextStationId;
                  setCelebration(null);
                  startStation(activeCycle, nextId);
                } else {
                  setCelebration(null);
                }
              }}
            >
              {isCycle ? "Back to the map" : celebration.nextStationId ? "Next station!" : "Keep going"}
            </button>
            {!isCycle && (
              <button className="sbq-ghost-button" type="button" onClick={() => setCelebration(null)}>
                Stop for now
              </button>
            )}
            {isCycle && celebration.stars === 3 && (
              <button
                className="sbq-ghost-button"
                type="button"
                onClick={() => printCertificate({
                  studentName,
                  achievement: `Completed Cycle ${activeCycle.cycleNumber} with three stars`,
                  detail: activeCycle.childFriendlyGoal || ""
                })}
              >
                Print certificate
              </button>
            )}
            {isCycle && (
              <button
                className="sbq-ghost-button"
                type="button"
                onClick={() => {
                  setCelebration(null);
                  setActiveCycleId(null);
                  setSessionStations({});
                }}
              >
                Choose a cycle
              </button>
            )}
          </div>
        </div>
      </main>
    );
  }

  // ── Station picker for the open cycle ─────────────────────────────────────
  if (!stationId) {
    return (
      <main className="skills-block-quest" data-pal-world={worldForCycle(activeCycle.cycleNumber).id} style={worldStyle(worldForCycle(activeCycle.cycleNumber))}>
        <header className="sbq-top">
          <div>
            <p className="sbq-kicker">Cycle {activeCycle.cycleNumber}</p>
            <h1>{(activeCycle.focusLetters || []).map(item => item.grapheme).join(" and ") || "Review time"}</h1>
            <p className="sbq-sub">{activeCycle.childFriendlyGoal}</p>
          </div>
          <button className="sbq-ghost-button" type="button" onClick={() => setActiveCycleId(null)}>
            Map
          </button>
        </header>
        <div className="sbq-stations" aria-label="Stations">
          {STATIONS.map((station, index) => {
            const savedStations = progress.cycles?.[activeCycle.id]?.stations || {};
            const done = Boolean(sessionStations[station.id] || savedStations[station.id]);
            const isCheck = station.id === "check";
            // The Cycle Check is the show-what-you-know finale: it opens
            // after at least four practice stations are done.
            const practiceDone = STATIONS.filter(item => item.id !== "check"
              && (sessionStations[item.id] || savedStations[item.id])).length;
            const checkLocked = isCheck && practiceDone < 4 && !progress.cycles?.[activeCycle.id]?.stars;
            return (
              <button
                key={station.id}
                type="button"
                className={`sbq-station${done ? " done" : ""}${isCheck ? " check" : ""}${checkLocked ? " locked" : ""}`}
                disabled={checkLocked}
                onClick={() => startStation(activeCycle, station.id)}
              >
                <span className="sbq-station-step" aria-hidden="true">{done ? "✓" : checkLocked ? "🔒" : index + 1}</span>
                <span className="sbq-station-copy">
                  <strong>{station.title}</strong>
                  <em>{checkLocked ? `Play ${4 - practiceDone} more station${4 - practiceDone === 1 ? "" : "s"} to open` : station.subtitle}</em>
                </span>
              </button>
            );
          })}
        </div>
      </main>
    );
  }

  // ── A live round ───────────────────────────────────────────────────────────
  const station = STATIONS.find(item => item.id === stationId);
  const roundWorld = worldForCycle(activeCycle.cycleNumber);
  return (
    <main
      className="skills-block-quest"
      data-pal-world={roundWorld.id}
      style={{ ...worldStyle(roundWorld), "--pal-scene": `url(${sceneForKey(roundWorld, `${activeCycle.id}-${stationId}`)})` }}
    >
      <div className="pal-scene-backdrop" aria-hidden="true" />
      <header className="sbq-top compact">
        <div>
          <p className="sbq-kicker">{station?.title}</p>
          <h1 className="sbq-round-count">{roundIndex + 1} of {rounds.length}</h1>
        </div>
        <button
          className="sbq-ghost-button"
          type="button"
          onClick={() => setStationId(null)}
        >
          Stop
        </button>
      </header>
      <div className="sbq-progress-track" aria-hidden="true">
        <span style={{ width: `${Math.round(((roundIndex) / Math.max(1, rounds.length)) * 100)}%` }} />
      </div>

      {round && (
        <div
          className={`sbq-round-card${shaking ? " sbq-shake" : ""}`}
          onAnimationEnd={() => setShaking(false)}
        >
          <p className="sbq-round-prompt">{round.prompt}</p>
          {encourage && <p className="sbq-encourage" role="status">Almost! Try again.</p>}
          {round.audio && (
            <button className="sbq-listen-button" type="button" onClick={() => playCue(round)}>
              <SpeakerIcon />
              Listen
            </button>
          )}

          {round.poem && round.poemTitle && <p className="sbq-poem-title">{round.poemTitle}</p>}
          {round.display && (
            <div className={`sbq-round-display${round.poem ? " sbq-poem" : ""}`}>{round.display}</div>
          )}

          {round.type === "build" ? (
            <BuildRound key={`${round.word}-${roundIndex}`} round={round} onResult={handleAnswer} />
          ) : round.type === "trace" ? (
            <TraceRound key={`${round.letter}-${roundIndex}`} round={round} onResult={handleAnswer} />
          ) : (
            <div className={`sbq-answer-grid ${round.choiceStyle === "picture" ? "pictures" : round.choiceStyle === "letter" ? "letters" : "words"}`}>
              {round.choices.map(choice => (
                <button key={choice} type="button" onClick={() => chooseTile(choice)}>
                  {round.choiceStyle === "picture" ? <PictureChoice word={choice} /> : choice}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}

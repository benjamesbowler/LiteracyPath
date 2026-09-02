import { useEffect, useMemo, useRef, useState } from "react";
import { elSkillsBlockCycles } from "../../data/elSkillsBlockCycles.js";
import { getChildWordAsset } from "../../data/childAssets";
import { playCueAudio, playCueSequence, stopCueAudio } from "../../utils/audio/cuePlayer.js";
import { playCorrectChime, playSoftBuzz, playCelebrationFanfare, playStarChime } from "../../utils/audio/gameSfx.js";
import { queueProgressSave } from "../../utils/progressSync.js";
import {
  mergeElQuestProgress,
  normalizeElQuestProgress
} from "../../utils/adventureMapProgress.js";
import { notifyMissionTaskDone } from "../../utils/dailyMission.js";
import { getCompanion } from "../../utils/studentProfile.js";
import { printCertificate } from "../../utils/printCertificate.js";
import { LetterWriter } from "../shared/LetterWriter.jsx";
import { LETTER_GUIDES, LETTER_STROKES } from "../../data/letterStrokes.js";
import { CHILD_COPY } from "../../copy/childCopy.js";
import { scoreLetterTrace } from "../../utils/traceLetterScoring.js";
import { worldForCycle, worldStyle, sceneForKey } from "../../utils/palWorlds.js";
import {
  WORLD_LANDMARKS_WIDE,
  wideMapPointsFor,
  getCachedWideOverride,
  loadWideMapOverride
} from "../../data/mapStops.js";
import { ConfettiCelebration } from "../learn/games/shared/ConfettiCelebration.jsx";
import { ProgressStars } from "../learn/games/shared/ProgressStars.jsx";
import { ChildRecommendationExplanation } from "../recommendations/RecommendationExplanation.jsx";
import { resolveAdventureMapCycleLock } from "../../policy/childTrailPolicy.js";
import {
  stationsForCycle,
  buildStationRounds,
  graphemeAudioPath,
  wordAudioPath,
  starsForAccuracy,
  shuffleItems
} from "./elQuestEngine.js";
import { resolveAdventureRoundAudio } from "./adventureRoundAudio.js";
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
// Wide-map stop positions + landmark labels now live in ../../data/mapStops.js
// (single source of truth; admin can override them live in the Map Stops editor).

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
  if (typeof window === "undefined") return normalizeElQuestProgress(null);
  const parsed = JSON.parse(window.localStorage.getItem(`${STORAGE_PREFIX}:${scopeKey}`) || "null");
  return normalizeElQuestProgress(parsed);
}

function saveQuestProgress(scopeKey, progress) {
  if (typeof window === "undefined") return;
  const normalized = normalizeElQuestProgress(progress);
  try {
    window.localStorage.setItem(`${STORAGE_PREFIX}:${scopeKey}`, JSON.stringify(normalized));
  } catch {
    // Local persistence is best-effort; cloud sync still queues below.
  }
  queueProgressSave("el_quest", "__all__", normalized, { scopeKey });
}

function playCue(round) {
  if (!round?.audio) return;
  playCueAudio(round.audio, {
    // Gold voice or silence - the robotic browser voice never plays.
    onUnavailable: () => {}
  });
}

function playRoundInstruction(round, { includeContent = false } = {}) {
  const resolved = resolveAdventureRoundAudio(round);
  const sequence = [
    resolved.instructionAudio,
    ...resolved.targetAudio,
    ...(includeContent && resolved.contentAudio ? [resolved.contentAudio] : [])
  ].filter(Boolean);
  if (sequence.length) playCueSequence(sequence, { gapMs: 180 });
}

function cancelPendingCoachCue(timerRef, requestRef) {
  requestRef.current += 1;
  if (timerRef.current === null) return;
  window.clearTimeout(timerRef.current);
  timerRef.current = null;
}

function SpeakerIcon() {
  return (
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 5 6 9H3v6h3l5 4V5Z" fill="currentColor" stroke="none" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 6a9 9 0 0 1 0 12" />
    </svg>
  );
}

function StationLockIcon() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="10" width="14" height="11" rx="3" />
      <path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10" />
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
// "Done" only enables once the child has actually traced across the letter —
// enough ink AND covering most of the letter's height and some of its width,
// so a single quick stroke no longer counts.
function TraceRound({ round, onResult }) {
  const canvasRef = useRef(null);
  const targetRef = useRef(null);
  const drawing = useRef(false);
  const currentStrokeRef = useRef([]);
  const drawnStrokesRef = useRef([]);
  const lastPointRef = useRef(null);
  const activePointerIdRef = useRef(null);
  const [pointCount, setPointCount] = useState(0);
  const [traceMessage, setTraceMessage] = useState(CHILD_COPY.tracing.prompt);
  const [demoKey, setDemoKey] = useState(0);
  const chars = useMemo(
    () => String(round.letter).split("").filter(char => LETTER_STROKES[char]),
    [round.letter]
  );
  const traceLayout = useMemo(() => {
    const contentWidth = Math.max(1, chars.length) * LETTER_GUIDES.width;
    const scale = Math.min((460 - 72) / contentWidth, (300 - 34) / 140);
    return {
      contentWidth,
      offsetX: (460 - (contentWidth * scale)) / 2,
      offsetY: (300 - (140 * scale)) / 2,
      scale
    };
  }, [chars.length]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const keepTraceGestureInsideCanvas = event => {
      if (event.cancelable) event.preventDefault();
    };
    const listenerOptions = { passive: false };
    canvas.addEventListener("touchstart", keepTraceGestureInsideCanvas, listenerOptions);
    canvas.addEventListener("touchmove", keepTraceGestureInsideCanvas, listenerOptions);
    return () => {
      canvas.removeEventListener("touchstart", keepTraceGestureInsideCanvas, listenerOptions);
      canvas.removeEventListener("touchmove", keepTraceGestureInsideCanvas, listenerOptions);
    };
  }, []);

  function pointFrom(event) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return [
      ((event.clientX - rect.left) * canvas.width) / rect.width,
      ((event.clientY - rect.top) * canvas.height) / rect.height
    ];
  }

  function drawPoint(point) {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.strokeStyle = "#2F9E62";
    ctx.lineWidth = 20;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    if (lastPointRef.current) {
      ctx.moveTo(lastPointRef.current[0], lastPointRef.current[1]);
    } else {
      ctx.moveTo(point[0], point[1]);
    }
    ctx.lineTo(point[0], point[1]);
    ctx.stroke();
    lastPointRef.current = point;
    currentStrokeRef.current.push(point);
    setPointCount(value => value + 1);
  }

  function beginStroke(event) {
    if (activePointerIdRef.current !== null) return;
    event.preventDefault();
    activePointerIdRef.current = event.pointerId;
    drawing.current = true;
    lastPointRef.current = null;
    currentStrokeRef.current = [];
    event.currentTarget.setPointerCapture?.(event.pointerId);
    drawPoint(pointFrom(event));
  }

  function paint(event) {
    if (!drawing.current || activePointerIdRef.current !== event.pointerId) return;
    event.preventDefault();
    drawPoint(pointFrom(event));
  }

  function finishStroke(event) {
    if (activePointerIdRef.current !== event.pointerId) return;
    event.preventDefault();
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    activePointerIdRef.current = null;
    if (!drawing.current) return;
    drawing.current = false;
    lastPointRef.current = null;
    if (currentStrokeRef.current.length) {
      drawnStrokesRef.current.push(currentStrokeRef.current);
    }
    currentStrokeRef.current = [];
  }

  function abandonStroke(event) {
    if (activePointerIdRef.current !== event.pointerId) return;
    activePointerIdRef.current = null;
    drawing.current = false;
    lastPointRef.current = null;
    if (currentStrokeRef.current.length) {
      drawnStrokesRef.current.push(currentStrokeRef.current);
    }
    currentStrokeRef.current = [];
  }

  function clearInk() {
    const canvas = canvasRef.current;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    drawing.current = false;
    activePointerIdRef.current = null;
    currentStrokeRef.current = [];
    drawnStrokesRef.current = [];
    lastPointRef.current = null;
    setPointCount(0);
    setTraceMessage(CHILD_COPY.tracing.prompt);
  }

  function expectedStrokes() {
    const paths = Array.from(targetRef.current?.querySelectorAll("[data-trace-target]") || []);
    return paths.map(path => {
      const length = path.getTotalLength();
      const charIndex = Number(path.dataset.charIndex || 0);
      const points = [];
      for (let distance = 0; distance <= length; distance += 5) {
        const point = path.getPointAtLength(Math.min(distance, length));
        points.push([
          traceLayout.offsetX + ((point.x + (charIndex * LETTER_GUIDES.width)) * traceLayout.scale),
          traceLayout.offsetY + (point.y * traceLayout.scale)
        ]);
      }
      return points;
    });
  }

  function checkTrace() {
    const expected = expectedStrokes();
    const result = scoreLetterTrace({
      drawnStrokes: drawnStrokesRef.current,
      expectedStrokes: expected
    });
    if (result.pass) {
      setTraceMessage(CHILD_COPY.tracing.good);
      onResult(true);
      return;
    }
    setTraceMessage(CHILD_COPY.tracing.tryAgain);
    onResult(false);
  }

  return (
    <div className="sbq-trace">
      <div className="sbq-trace-demo">
        <LetterWriter text={round.letter} height={130} playKey={demoKey} />
        <button className="sbq-ghost-button" type="button" onClick={() => setDemoKey(key => key + 1)}>
          ✏️ {CHILD_COPY.tracing.watch}
        </button>
      </div>
      <div className="sbq-trace-stage">
        <svg
          ref={targetRef}
          aria-hidden="true"
          className="sbq-trace-letter"
          viewBox="0 0 460 300"
        >
          <g transform={`translate(${traceLayout.offsetX} ${traceLayout.offsetY}) scale(${traceLayout.scale})`}>
            {chars.map((char, charIndex) => (
              <g key={`${char}-${charIndex}`} transform={`translate(${charIndex * LETTER_GUIDES.width} 0)`}>
                {LETTER_STROKES[char].map((path, pathIndex) => (
                  <path
                    key={`${char}-${pathIndex}`}
                    d={path}
                    data-char-index={charIndex}
                    data-trace-target=""
                  />
                ))}
              </g>
            ))}
          </g>
        </svg>
        <canvas
          ref={canvasRef}
          width={460}
          height={300}
          aria-label={`Trace the letter ${round.letter}`}
          onPointerDown={beginStroke}
          onPointerMove={paint}
          onPointerUp={finishStroke}
          onPointerCancel={finishStroke}
          onLostPointerCapture={abandonStroke}
        />
      </div>
      <p className="sbq-trace-message" role="status">{traceMessage}</p>
      <div className="sbq-trace-actions">
        <button className="sbq-ghost-button" type="button" onClick={clearInk}>
          {CHILD_COPY.tracing.clear}
        </button>
        <button
          className="sbq-primary-button"
          type="button"
          disabled={pointCount < 20}
          onClick={checkTrace}
        >
          {CHILD_COPY.tracing.check}
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

// Pattern Power: tap EVERY word that fits the pattern, then check.
function PatternRound({ round, onResult }) {
  const [picked, setPicked] = useState(() => new Set());
  const [checking, setChecking] = useState(false);

  function toggle(word) {
    if (checking) return;
    const cue = wordAudioPath(word);
    if (cue) playCueAudio(cue, { volume: 0.9 });
    setPicked(current => {
      const next = new Set(current);
      if (next.has(word)) next.delete(word); else next.add(word);
      return next;
    });
  }

  function check() {
    if (checking || picked.size === 0) return;
    const correct = round.items.filter(item => item.fits).map(item => item.word);
    const ok = correct.length === picked.size && correct.every(word => picked.has(word));
    if (ok) {
      setChecking(true);
      window.setTimeout(() => onResult(true), 360);
    } else {
      onResult(false);
      setPicked(new Set());
    }
  }

  return (
    <>
      <div className="sbq-pattern-grid" aria-label="Tap every word that fits the pattern">
        {round.items.map(item => (
          <button
            key={item.word}
            type="button"
            className={`sbq-pattern-tile${picked.has(item.word) ? " picked" : ""}`}
            aria-pressed={picked.has(item.word)}
            onClick={() => toggle(item.word)}
          >
            {item.word}
          </button>
        ))}
      </div>
      <button className="sbq-primary-button" type="button" disabled={picked.size === 0} onClick={check}>
        Check
      </button>
    </>
  );
}

// Speedy Words: read the word and tap it before the gentle timer runs out.
// The timer is encouraging, never punishing - on time-out it just replays the
// word as a hint and the child can keep going.
function SpeedRound({ round, onResult, onHint }) {
  const DURATION_MS = 6000;
  const [run, setRun] = useState(0);
  const [timedOut, setTimedOut] = useState(false);
  const onHintRef = useRef(onHint);
  useEffect(() => { onHintRef.current = onHint; }, [onHint]);

  // Fresh timer on mount (the round key remounts this) and on each "Go again".
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setTimedOut(true);
      onHintRef.current?.();
    }, DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [run]);

  return (
    <>
      <div className={`sbq-speed-bar${timedOut ? " out" : ""}`} aria-hidden="true">
        <span key={run} style={{ animationDuration: `${DURATION_MS}ms` }} />
      </div>
      <div className="sbq-answer-grid words">
        {round.choices.map(choice => (
          <button key={choice} type="button" onClick={() => onResult(choice === round.answer)}>
            {choice}
          </button>
        ))}
      </div>
      {timedOut && (
        <button className="sbq-ghost-button" type="button" onClick={() => { setTimedOut(false); setRun(value => value + 1); }}>
          Go again
        </button>
      )}
    </>
  );
}

// initialCycleId: the stop the child tapped on the Adventure Map screen, so the
// mode opens THERE instead of showing a second map of the same journey. It is a
// seed for the same state openCycle() sets, not a new mode - leave it empty and
// this component behaves exactly as it did before (its own map first).
export function ElSkillsQuest({
  studentName = "Reader",
  progressScopeKey = "default",
  initialCycleId = "",
  initialStationId = "",
  lockedCycleId = null,
  onLockedCycleAvailabilityChange = null
}) {
  const playableCycles = useMemo(
    () => elSkillsBlockCycles.filter(cycle => cycle.cycleNumber),
    []
  );
  const [progress, setProgress] = useState(() => loadQuestProgress(progressScopeKey));
  const recommendedCycle = useMemo(() => (
    playableCycles.find(cycle => !(progress.cycles?.[cycle.id]?.stars > 0)) || playableCycles[0]
  ), [playableCycles, progress]);

  const cycleLock = useMemo(() => resolveAdventureMapCycleLock({
    cycles: playableCycles,
    lockedCycleId
  }), [lockedCycleId, playableCycles]);
  const initialCycle = cycleLock.locked
    ? cycleLock.cycle
    : playableCycles.find(cycle => cycle.id === initialCycleId) || null;
  const initialStation = initialCycle
    ? stationsForCycle(initialCycle).find(station => station.id === initialStationId)
    : null;
  const [activeCycleId, setActiveCycleId] = useState(initialCycleId || null);
  const [stationId, setStationId] = useState(initialStation?.id || null);
  const [rounds, setRounds] = useState(() => (
    initialCycle && initialStation ? buildStationRounds(initialCycle, initialStation.id) : []
  ));
  const [roundIndex, setRoundIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrongs, setWrongs] = useState(0);
  const [shaking, setShaking] = useState(false);
  const [encourage, setEncourage] = useState(false);
  const [sparkle, setSparkle] = useState(false);
  const answerLockRef = useRef(false);
  const [celebration, setCelebration] = useState(null);
  const [sessionStations, setSessionStations] = useState({});
  const [mapZoom] = useState(1);
  const cueTimerRef = useRef(null);
  const coachCueTimerRef = useRef(null);
  const coachCueRequestRef = useRef(0);
  const playedInstructionKeyRef = useRef("");

  const activeCycle = cycleLock.locked
    ? cycleLock.cycle
    : playableCycles.find(cycle => cycle.id === activeCycleId) || null;
  const round = rounds[roundIndex] || null;
  const roundAudio = useMemo(
    () => (round ? resolveAdventureRoundAudio(round) : null),
    [round]
  );

  useEffect(() => {
    if (!cycleLock.locked) return;
    onLockedCycleAvailabilityChange?.(cycleLock.contentAvailable);
  }, [cycleLock.contentAvailable, cycleLock.locked, onLockedCycleAvailabilityChange]);

  useEffect(() => {
    function handleHydrated(event) {
      if (event.detail?.studentId && event.detail.studentId !== progressScopeKey) return;
      const stored = loadQuestProgress(progressScopeKey);
      setProgress(previous => mergeElQuestProgress(previous, stored));
    }
    window.addEventListener("lp-progress-hydrated", handleHydrated);
    return () => window.removeEventListener("lp-progress-hydrated", handleHydrated);
  }, [progressScopeKey]);

  useEffect(() => {
    answerLockRef.current = false;
    cancelPendingCoachCue(coachCueTimerRef, coachCueRequestRef);
    if (!stationId || celebration || !round || !roundAudio?.instructionAudio) return undefined;
    const instructionKey = `${stationId}:${roundIndex}:${roundAudio.instructionAudio}`;
    if (playedInstructionKeyRef.current !== instructionKey) {
      cueTimerRef.current = window.setTimeout(() => {
        playedInstructionKeyRef.current = instructionKey;
        playRoundInstruction(round, { includeContent: round.type === "poem" && roundIndex === 0 });
      }, 120);
    }
    // Warm the next round's directions and learning cue so both begin without
    // a blank pause on a classroom connection.
    const next = rounds[roundIndex + 1];
    if (next) {
      const nextAudio = resolveAdventureRoundAudio(next);
      [nextAudio.instructionAudio, ...nextAudio.targetAudio, nextAudio.contentAudio]
        .filter(Boolean)
        .forEach(src => {
          try {
            const preload = new Audio(src);
            preload.preload = "auto";
          } catch { /* ignore */ }
        });
    }
    return () => window.clearTimeout(cueTimerRef.current);
  }, [celebration, round, roundAudio, rounds, roundIndex, stationId]);

  useEffect(() => () => {
    cancelPendingCoachCue(coachCueTimerRef, coachCueRequestRef);
    stopCueAudio();
  }, []);

  function openCycle(cycle) {
    if (cycleLock.locked) return;
    setActiveCycleId(cycle.id);
    setStationId(null);
    setCelebration(null);
    setSessionStations({});
  }

  function startStation(cycle, id) {
    cancelPendingCoachCue(coachCueTimerRef, coachCueRequestRef);
    const nextRounds = buildStationRounds(cycle, id);
    setStationId(id);
    setRounds(nextRounds);
    setRoundIndex(0);
    setCorrect(0);
    setWrongs(0);
    setCelebration(null);
    const firstRound = nextRounds[0];
    if (firstRound) {
      const firstAudio = resolveAdventureRoundAudio(firstRound);
      playedInstructionKeyRef.current = `${id}:0:${firstAudio.instructionAudio}`;
      // This runs inside the station-button tap, which keeps iPad Safari's
      // media permission attached to the child's trusted gesture.
      playRoundInstruction(firstRound, { includeContent: firstRound.type === "poem" });
    }
  }

  function finishStation(finalCorrect, finalWrongs) {
    cancelPendingCoachCue(coachCueTimerRef, coachCueRequestRef);
    stopCueAudio();
    const total = rounds.length;
    if (stationId === "check") {
      // The mission's quest task = a full cycle, sealed by the Cycle Check.
      // deferReturn: the cycle celebration (stars, certificate) follows -
      // never yank the child home over it. The celebration's own buttons
      // (map / choose a cycle) already give an honest way onward.
      notifyMissionTaskDone(progressScopeKey, "quest", { deferReturn: true });
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
      setCelebration({ kind: "cycle", stars, correct: finalCorrect, total });
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
      const cycleStations = stationsForCycle(activeCycle);
      const practiceDone = cycleStations.filter(st => st.id !== "check" && isDone(st.id)).length;
      const nextStation = cycleStations.find(st => st.id !== "check" && !isDone(st.id))
        || (practiceDone >= 4 ? cycleStations.find(st => st.id === "check") : null);
      setCelebration({ kind: "station", correct: finalCorrect, total, nextStationId: nextStation?.id || null });
    }
    setStationId(null);
  }

  function handleAnswer(success) {
    // A fast double-tap during the 500ms transition must not double-count
    // or skip a round; the lock releases when the next round renders.
    if (answerLockRef.current) return;
    if (success) {
      cancelPendingCoachCue(coachCueTimerRef, coachCueRequestRef);
      answerLockRef.current = true;
      playCorrectChime();
      // Micro-celebration on EVERY correct answer (Duolingo ABC pattern).
      setSparkle(true);
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
      // Coach the mistake: replay the sound cue so the child hears it again
      // right before retrying (never a penalty, always another go).
      cancelPendingCoachCue(coachCueTimerRef, coachCueRequestRef);
      const coachCueRequest = coachCueRequestRef.current;
      const coachRound = round;
      coachCueTimerRef.current = window.setTimeout(() => {
        coachCueTimerRef.current = null;
        if (coachCueRequestRef.current !== coachCueRequest) return;
        playCue(coachRound);
      }, 700);
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

  // Admin-placed wide-map stop overrides (cached instantly, refreshed from the
  // server). Falls back to the built-in defaults if none/offline.
  const [wideOverride, setWideOverride] = useState(getCachedWideOverride);
  useEffect(() => {
    let alive = true;
    loadWideMapOverride().then(ov => { if (alive) setWideOverride(ov); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  // Map geometry (lifted to component scope so the avatar tween effect and the
  // render share the same region/stops/points). Orientation picks the art,
  // stop coordinates, landmark labels, and coordinate space together.
  const homeWorldId = worldForCycle(recommendedCycle?.cycleNumber || 1).id;
  // The map follows the curriculum automatically. A child starts in Meadow
  // and reaches Dino and Moonwood by completing the preceding stops; lands
  // and completed cycles are not a level-selection menu.
  const activeWorldId = homeWorldId;
  const region = WORLD_REGIONS.find(r => r.id === activeWorldId) || WORLD_REGIONS[0];
  // Memoised so its reference is stable across renders - otherwise the avatar
  // tween effect re-ran on EVERY render and could snap mid-animation (a glitch).
  const stops = useMemo(
    () => playableCycles.filter(cycle => region.test(cycle.cycleNumber)),
    [playableCycles, region]
  );
  const mapView = wideMap ? MAP_VIEW.wide : MAP_VIEW.portrait;
  const mapPoints = wideMap
    ? wideMapPointsFor(region.id, wideOverride)
    : (WORLD_MAP_POINTS[region.id] || WORLD_MAP_POINTS.meadow);
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

  if (cycleLock.locked && !cycleLock.contentAvailable) {
    return (
      <main
        className="skills-block-quest"
        data-learning-lane="practice_and_play"
        data-quest-view="unavailable"
        role="alert"
      >
        <div className="sbq-celebrate">
          <h1>This assigned map space is not available</h1>
          <p>Stay here and ask your teacher for help.</p>
        </div>
      </main>
    );
  }

  if (!activeCycle) {
    const completedCycles = playableCycles.filter(cycle => (
      (progress.cycles?.[cycle.id]?.stars || 0) > 0
    )).length;
    return (
      <main
        className="skills-block-quest"
        data-learning-lane="practice_and_play"
        data-pal-world={worldForCycle(recommendedCycle?.cycleNumber || 1).id}
        data-child-surface="adventure-map"
      >
        <header className="sbq-top">
          <div>
            <p className="sbq-kicker">Adventure Map</p>
            <h1 data-child-title="">Your sound and word path</h1>
            <p className="sbq-sub" data-child-instruction="">Follow “you are here” to start.</p>
            <p className="sbq-map-progress" data-child-progress="">
              {completedCycles} of {playableCycles.length} stops complete
            </p>
          </div>
        </header>
        {(() => {
          return (
            <div className="sbq-adventure" data-pal-world={region.id} data-child-choices="">
              <div className="sbq-world-tabs sbq-world-progress" aria-label="Your journey">
                {WORLD_REGIONS.map(world => (
                  <span
                    key={world.id}
                    className={world.id === region.id ? "active" : ""}
                  >
                    {world.name}
                  </span>
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
                      const Tag = isRecommended ? "button" : "span";
                      return (
                        <Tag
                          key={cycle.id}
                          {...(isRecommended ? { type: "button" } : { role: "img", "aria-disabled": "true" })}
                          ref={el => { stopRefs.current[cycle.id] = el; }}
                          className={`sbq-stop${cycleProgress?.stars ? " done" : ""}${isRecommended ? " next" : ""}`}
                          style={{ left: `${x}%`, top: `${y}%` }}
                          onClick={isRecommended ? () => { if (panRef.current.moved) return; openCycle(cycle); } : undefined}
                          aria-label={`${landmarks[index] || `Cycle ${cycle.cycleNumber}`}${isRecommended ? " - you are here" : ""}`}
                          data-child-primary={isRecommended ? "" : undefined}
                          data-child-emphasis={isRecommended ? "primary" : "choice"}
                          data-tip-position={y < 18 ? "right" : "above"}
                        >
                          <span className="sbq-stop-marker" aria-hidden="true">
                            {cycleProgress?.stars ? "★" : cycle.cycleNumber}
                          </span>
                          <span className="sbq-stop-tip">
                            <span className="sbq-stop-name">{landmarks[index] || "Mystery Spot"}</span>
                            <span className="sbq-stop-skill">
                              {(cycle.focusLetters || []).map(item => item.grapheme).join(" ") || "Review"}
                            </span>
                            {isRecommended && (
                              <>
                                <span className="sbq-stop-next" data-child-emphasis-cue="">Go next</span>
                                <ChildRecommendationExplanation
                                  className="sbq-stop-reason"
                                  reason="This is your next map stop."
                                  surface="adventure-map"
                                />
                              </>
                            )}
                            {cycleProgress?.stars ? <ProgressStars stars={cycleProgress.stars} /> : null}
                          </span>
                        </Tag>
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
      <main
        className="skills-block-quest"
        data-learning-lane="practice_and_play"
        data-quest-view="celebration"
      >
        <div className="sbq-celebrate">
          {isCycle && <ConfettiCelebration show={celebration.stars > 0} />}
          <img src={isCycle ? worldForCycle(activeCycle.cycleNumber).cheer : worldForCycle(activeCycle.cycleNumber).point} alt="" />
          <h2>{isCycle ? `Cycle ${activeCycle.cycleNumber} complete!` : "Station done!"}</h2>
          <p>{celebration.correct}/{celebration.total} right</p>
          {!isCycle && celebration.nextStationId && (
            <p className="sbq-next-up">
              Next up: <strong>{stationsForCycle(activeCycle).find(st => st.id === celebration.nextStationId)?.title}</strong>
            </p>
          )}
          {isCycle && <ProgressStars stars={celebration.stars} size="lg" />}
          {isCycle && celebration.stars > 0 && (
            <p className="kid-coins-earned">+{celebration.stars * 7} coins for your Hollow!</p>
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
              {isCycle
                ? cycleLock.locked ? "Back to this cycle" : "Back to the map"
                : celebration.nextStationId ? "Next station!" : "Keep going"}
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
            {isCycle && !cycleLock.locked && (
              <button
                className="sbq-ghost-button"
                type="button"
                onClick={() => {
                  setCelebration(null);
                  setActiveCycleId(null);
                  setSessionStations({});
                }}
              >
                Back to your path
              </button>
            )}
          </div>
        </div>
      </main>
    );
  }

  // ── Station picker for the open cycle ─────────────────────────────────────
  if (!stationId) {
    const cycleWorld = worldForCycle(activeCycle.cycleNumber);
    const cycleStations = stationsForCycle(activeCycle);
    const stationArt = [...cycleWorld.scenes, cycleWorld.banner, cycleWorld.backdrop].filter(Boolean);
    const savedStations = progress.cycles?.[activeCycle.id]?.stations || {};
    const cycleFinished = Boolean(progress.cycles?.[activeCycle.id]?.stars);
    const stationDone = id => Boolean(sessionStations[id] || savedStations[id]);
    const practiceDone = cycleStations.filter(station => station.id !== "check" && stationDone(station.id)).length;
    const checkLocked = practiceDone < 4 && !cycleFinished;
    const nextStation = cycleStations.find(station => station.id !== "check" && !stationDone(station.id))
      || (!checkLocked ? cycleStations.find(station => station.id === "check") : null);
    const completedCount = cycleFinished
      ? cycleStations.length
      : cycleStations.filter(station => station.id !== "check" && stationDone(station.id)).length;
    const completionPercent = Math.round((completedCount / Math.max(1, cycleStations.length)) * 100);

    return (
      <main
        className="skills-block-quest sbq-cycle-hub"
        data-learning-lane="practice_and_play"
        data-pal-world={cycleWorld.id}
        data-quest-view="cycle"
        style={{ ...worldStyle(cycleWorld), "--sbq-cycle-scene": `url("${cycleWorld.backdrop}")` }}
      >
        <section className="sbq-cycle-world" aria-labelledby="sbq-cycle-title">
          <header className="sbq-top sbq-cycle-head">
            <div className="sbq-cycle-heading">
              <p className="sbq-kicker">Cycle {activeCycle.cycleNumber}</p>
              <h1 id="sbq-cycle-title">{(activeCycle.focusLetters || []).map(item => item.grapheme).join(" and ") || "Review time"}</h1>
              <p className="sbq-sub">{activeCycle.childFriendlyGoal}</p>
            </div>
            <div className="sbq-cycle-head-actions">
              <div className="sbq-cycle-progress" aria-label={`${completedCount} of ${cycleStations.length} stations complete`}>
                <span><strong>{completedCount}</strong> of {cycleStations.length} complete</span>
                <span className="sbq-cycle-progress-track" aria-hidden="true">
                  <span style={{ width: `${completionPercent}%` }} />
                </span>
              </div>
              {!cycleLock.locked && (
                <button className="sbq-ghost-button" type="button" onClick={() => setActiveCycleId(null)}>
                  Map
                </button>
              )}
            </div>
          </header>

          <div className="sbq-cycle-playfield">
            <div className="sbq-stations" aria-label="Stations">
              {cycleStations.map((station, index) => {
                const done = stationDone(station.id);
                const isCheck = station.id === "check";
                const locked = isCheck && checkLocked;
                const isNext = !done && !locked && station.id === nextStation?.id;
                const state = locked ? "locked" : done ? "done" : isNext ? "next" : "open";
                const stateCopy = locked
                  ? `Play ${4 - practiceDone} more station${4 - practiceDone === 1 ? "" : "s"} to open`
                  : done ? "Complete, play again" : isNext ? `Start here, ${station.subtitle}` : station.subtitle;
                return (
                  <button
                    key={station.id}
                    type="button"
                    className={`sbq-station sbq-station--${state}${isCheck ? " check" : ""}`}
                    data-station-id={station.id}
                    data-station-state={state}
                    data-child-emphasis={isNext ? "primary" : "choice"}
                    {...(isNext ? { "data-child-primary": "", "aria-current": "step" } : {})}
                    disabled={locked}
                    onClick={() => startStation(activeCycle, station.id)}
                  >
                    <span className="sbq-station-art" aria-hidden="true">
                      <img
                        src={stationArt[index % stationArt.length]
                          || sceneForKey(cycleWorld, `${activeCycle.id}-${station.id}-hub`)}
                        alt=""
                        loading="eager"
                        decoding="async"
                      />
                    </span>
                    <span className="sbq-station-step" aria-hidden="true">
                      {done ? "✓" : locked ? <StationLockIcon /> : index + 1}
                    </span>
                    <span className="sbq-station-copy">
                      <strong>{station.title}</strong>
                      <em>{stateCopy}</em>
                    </span>
                    {isNext && <span className="sbq-station-go" aria-hidden="true">&#8594;</span>}
                  </button>
                );
              })}
            </div>

            <p className="sbq-cycle-scroll-hint">
              Swipe or scroll to see every station <span aria-hidden="true">&#8594;</span>
            </p>

            <aside className="sbq-cycle-guide" aria-hidden="true">
              <img src={cycleWorld.point} alt="" />
              <span>{nextStation ? "The next station is glowing." : "Your pal is proud of you."}</span>
            </aside>
          </div>
        </section>
      </main>
    );
  }

  // ── A live round ───────────────────────────────────────────────────────────
  const station = stationsForCycle(activeCycle).find(item => item.id === stationId);
  const roundWorld = worldForCycle(activeCycle.cycleNumber);
  return (
    <main
      className="skills-block-quest"
      data-learning-lane="practice_and_play"
      data-quest-view="round"
      data-station-id={stationId}
      data-round-type={round?.type || "loading"}
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
          onClick={() => {
            cancelPendingCoachCue(coachCueTimerRef, coachCueRequestRef);
            stopCueAudio();
            setStationId(null);
          }}
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
          {sparkle && (
            <span className="sbq-sparkle" aria-hidden="true" onAnimationEnd={() => setSparkle(false)}>✨</span>
          )}
          <div className="sbq-instruction-block">
            <div className="sbq-instruction-copy">
              <p className="sbq-round-prompt">{roundAudio.instructionText}</p>
              {roundAudio.detailText && <p className="sbq-round-detail">{roundAudio.detailText}</p>}
            </div>
            <button
              className="sbq-instruction-button"
              type="button"
              aria-label="Hear instructions again"
              data-instruction-audio={roundAudio.instructionAudio}
              onClick={() => playRoundInstruction(round, { includeContent: round.type === "poem" })}
            >
              <SpeakerIcon />
              Hear what to do
            </button>
          </div>
          {round.support && <p className="sbq-round-support">{round.support}</p>}
          {encourage && <p className="sbq-encourage" role="status">Almost! Try again.</p>}
          {(roundAudio.targetAudio.length > 0 || roundAudio.contentAudio) && (
            <div className="sbq-round-audio-actions">
              {roundAudio.targetAudio.length > 0 && (
                <button
                  className="sbq-listen-button"
                  type="button"
                  onClick={() => playCueSequence(roundAudio.targetAudio, { gapMs: 150 })}
                >
                  <SpeakerIcon />
                  Listen
                </button>
              )}
              {roundAudio.contentAudio && (
                <button
                  className="sbq-listen-button sbq-listen-content"
                  type="button"
                  onClick={() => playCueAudio(roundAudio.contentAudio)}
                >
                  <SpeakerIcon />
                  Hear the poem
                </button>
              )}
            </div>
          )}

          {round.cover && (
            <figure className="sbq-story-cover">
              <img
                src={round.cover}
                alt={round.bookTitle ? `Book cover: ${round.bookTitle}` : "Book cover"}
                onError={event => { event.currentTarget.closest("figure").classList.add("no-art"); }}
              />
              {round.bookTitle && <figcaption>{round.bookTitle}</figcaption>}
            </figure>
          )}

          {round.poem && round.poemTitle && <p className="sbq-poem-title">{round.poemTitle}</p>}
          {round.display && (
            <div className={`sbq-round-display${round.poem ? " sbq-poem" : ""}`}>{round.display}</div>
          )}

          {round.type === "build" ? (
            <BuildRound key={`${round.word}-${roundIndex}`} round={round} onResult={handleAnswer} />
          ) : round.type === "trace" ? (
            <TraceRound key={`${round.letter}-${roundIndex}`} round={round} onResult={handleAnswer} />
          ) : round.type === "pattern" ? (
            <PatternRound key={`pattern-${roundIndex}`} round={round} onResult={handleAnswer} />
          ) : round.type === "speed" ? (
            <SpeedRound key={`speed-${roundIndex}`} round={round} onResult={handleAnswer} onHint={() => playCue(round)} />
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

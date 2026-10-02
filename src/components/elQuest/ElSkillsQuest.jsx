import { createLearningDwell, LEARNING_PACE } from "../../utils/learningPace.js";
import { adventureStationContinuation } from "../../policy/adventureContinuation.js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cycleReviewGraphemes, displayGraphemePair } from "../../utils/cyclePracticeVariation.js";
import { cyclePracticeDisplayTitle } from "../../utils/cycleTitles.js";
import { elSkillsBlockCycles } from "../../data/elSkillsBlockCycles.js";
import { adventureWordMatchOptions, completedWordMatchCycles } from '../../utils/wordMatchProgression.js';
import { playCueAudio, playCueSequence, retainCueAudioSources, stopCueAudio } from "../../utils/audio/cuePlayer.js";
import { collectQuestionMedia, preloadQuestionMediaBatch } from "../../utils/preloadQuestionMedia.js";
import { triggerTactileFeedback } from "../../utils/tactileFeedback.js";
import { playCorrectChime, playSoftBuzz, playCelebrationFanfare, playStarChime } from "../../utils/audio/gameSfx.js";
import { queueProgressSave } from "../../utils/progressSync.js";
import {
  mergeElQuestProgress,
  normalizeElQuestProgress
} from "../../utils/adventureMapProgress.js";
import {
  clearElQuestLocalProgress,
  readElQuestLocalProgress
} from "../../utils/adventureMapLocalProgress.js";
import { notifyMissionTaskDone } from "../../utils/dailyMission.js";
import { getCompanion } from "../../utils/studentProfile.js";
import { printCertificate } from "../../utils/printCertificate.js";
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
import { filterSample } from "../../policy/freeTierContent.js";
import {
  stationsForCycle,
  normalizeAdventureStationId,
  buildStationRounds,
  wordAudioPath
} from "./elQuestEngine.js";
import { resolveAdventureRoundAudio, withAdventureAudioEvidence } from "./adventureRoundAudio.js";
import {
  correctionModelForOutcome,
  adventureQuestionEvidence,
  adventureCheckSnapshot,
  createAdventureRun,
  cycleQuestResult,
  feedbackForCommittedOutcome,
  recordAdventureOutcome
} from "./adventureRunState.js";
import { LearningTeachingCard } from "../learning/LearningTeachingCard.jsx";
import { createLearningResponseEpisode, commitLearningResponse, advanceLearningResponseReceipt, recordLearningGuidedAction, recordLearningGuidedStep, startLearningWithModel, learningResponseRecoveryIssue, selectFreshLearningTransfer, learningStimulusSignature, learningGuidedModelIsPlaced, learningResponseCompletionEvent } from "../../utils/learningResponseState.js";
import { learningExpectedAnswer, usesLearningResponseEpisode } from "../../utils/learningResponseAdapters.js";
import { getPreferredPhonemeAudioPath } from "../../data/phonemeAudioBank.js";
import { getLedaWordAudioPath } from "../../data/ledaProductionAudio.js";
import { AdventureRoundFrame } from "./AdventureRoundFrame.jsx";
import { AdventureMechanicRenderer } from "./mechanics/AdventureMechanicRenderer.jsx";
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


function saveQuestProgress(scopeKey, progress) {
  if (typeof window === "undefined") return;
  const normalized = normalizeElQuestProgress(progress);
  let localSaved = true;
  try { window.localStorage.setItem(`${STORAGE_PREFIX}:${scopeKey}`, JSON.stringify(normalized)); }
  catch { localSaved = false; }
  queueProgressSave("el_quest", "__all__", normalized, { scopeKey });
  return localSaved;
}

function playCue(round) {
  if (!round?.audio) return;
  playCueAudio(round.audio, {
    // Gold voice or silence - the robotic browser voice never plays.
    onUnavailable: () => {}
  });
}

function targetReplayLabelFor(round) {
  switch (round?.mechanicId) {
    case "letterPair":
    case "letterGrid":
      return "Hear the letter name";
    case "soundChoice":
      return "Hear the sound";
    case "sceneHunt":
    case "pictureSearch":
      return "Hear the target sound";
    case "missingLetter":
    case "sightWordChoice":
      return "Hear the word";
    case "rhymePair":
    case "compoundPicture":
      return "Hear the pictures";
    default:
      return "Hear the target";
  }
}

function playRoundInstruction(round, {
  onDelivery,
  onTargetDelivery,
  onStarted,
  onUnavailable
} = {}) {
  const resolved = resolveAdventureRoundAudio(round);
  const sequence = [
    resolved.instructionAudio,
    ...resolved.targetAudio
  ].filter(Boolean);
  if (sequence.length) {
    playCueSequence(sequence, {
      // Keep the first play attached to the station tap even while its preload
      // is pending; the browser can buffer without losing media permission.
      playImmediately: true,
      gapMs: 180,
      onDelivery,
      onItemDelivery: event => {
        const itemIndex = Number(String(event.id).split(":").at(-1)) - 1;
        const src = sequence[itemIndex];
        if (resolved.targetAudio.includes(src)) onTargetDelivery?.(src, event);
      },
      onStarted,
      onUnavailable
    });
  } else {
    onUnavailable?.({ type: "unavailable" });
  }
}

function createRunSeed(cycleId, stationId) {
  const nonce = globalThis.crypto?.randomUUID?.() || `${Date.now()}`;
  return `adventure:${cycleId}:${stationId}:${nonce}`;
}

function StationLockIcon() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="10" width="14" height="11" rx="3" />
      <path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10" />
    </svg>
  );
}

// initialCycleId: the stop the child tapped on the Adventure Map screen, so the
// mode opens THERE instead of showing a second map of the same journey. It is a
// seed for the same state openCycle() sets, not a new mode - leave it empty and
// this component behaves exactly as it did before (its own map first).
function ElSkillsQuestSession({
  studentName = "Reader",
  progressScopeKey = "default",
  initialCycleId = "",
  initialStationId = "",
  onExit = null,
  lockedCycleId = null,
  onLockedCycleAvailabilityChange = null
}) {
  const allPlayableCycles = useMemo(
    () => elSkillsBlockCycles.filter(cycle => cycle.cycleNumber),
    []
  );
  const playableCycles = useMemo(
    () => filterSample("cycles", allPlayableCycles),
    [allPlayableCycles]
  );
  const [initialProgressRead] = useState(() => readElQuestLocalProgress(progressScopeKey));
  const [progressReadIssue, setProgressReadIssue] = useState(() => (
    initialProgressRead.ok ? (initialProgressRead.value?.learningCheckpoint?.responseConflict ? "response_conflict" : (initialProgressRead.value?.learningCheckpoint && initialProgressRead.value.learningCheckpoint.schemaVersion !== 1) || learningResponseRecoveryIssue(initialProgressRead.value?.learningCheckpoint?.episode) ? "unsupported_version" : "") : initialProgressRead.reason || "unreadable"
  ));
  const progressWritesBlockedRef = useRef(!initialProgressRead.ok || Boolean(progressReadIssue));
  const [progressRecoveryFailed, setProgressRecoveryFailed] = useState(false);
  const [progress, setProgress] = useState(() => (
    initialProgressRead.ok ? initialProgressRead.value : normalizeElQuestProgress(null)
  ));
  const progressRef = useRef(progress);
  const cyclesComplete = completedWordMatchCycles(progress);
  const recommendedCycle = useMemo(() => (
    playableCycles.find(cycle => !(progress.cycles?.[cycle.id]?.stars > 0))
      || (cyclesComplete ? playableCycles.at(-1) : playableCycles[0])
  ), [playableCycles, progress, cyclesComplete]);

  const cycleLock = useMemo(() => resolveAdventureMapCycleLock({
    // A teacher assignment is an exact classroom target, not ordinary map
    // browsing. Resolve it against the full curriculum while the child-owned
    // map and direct route remain inside the current sample entitlement.
    cycles: allPlayableCycles,
    lockedCycleId
  }), [allPlayableCycles, lockedCycleId]);
  const savedLearning = !progress.learningCheckpoint?.closed && progress.learningCheckpoint?.schemaVersion === 1
    && (!lockedCycleId || progress.learningCheckpoint.cycleId === lockedCycleId)
    && (!initialCycleId || progress.learningCheckpoint.cycleId === initialCycleId)
    ? progress.learningCheckpoint : null;
  const initialCycle = progressReadIssue
    ? null
    : cycleLock.locked
    ? cycleLock.cycle
    : playableCycles.find(cycle => cycle.id === (savedLearning?.cycleId || initialCycleId)) || null;
  const resolvedInitialStationId = initialCycle?.cycleNumber === 1 && initialStationId === 'build' ? 'trace' : normalizeAdventureStationId(savedLearning?.stationId || initialStationId);
  const initialStation = initialCycle
    ? stationsForCycle(initialCycle).find(station => station.id === resolvedInitialStationId && (station.id !== "check" || !adventureStationContinuation(stationsForCycle(initialCycle), progress.cycles?.[initialCycle.id]).checkLocked))
    : null;
  const initialRunSeed = initialCycle && initialStation
    ? `adventure:${initialCycle.id}:${initialStation.id}:initial-v3`
    : "";
  const [activeCycleId, setActiveCycleId] = useState(savedLearning?.cycleId || initialCycleId || null);
  const [stationId, setStationId] = useState(initialStation?.id || null);
  const [rounds, setRounds] = useState(() => (
    initialCycle && initialStation
      ? savedLearning?.rounds || buildStationRounds(initialCycle, initialStation.id, { seed: initialRunSeed, ...(!cycleLock.locked ? adventureWordMatchOptions(progress) : {}) })
      : []
  ));
  const [runSeed, setRunSeed] = useState(savedLearning?.runSeed || initialRunSeed);
  const [roundIndex, setRoundIndex] = useState(savedLearning?.roundIndex || 0);
  const [runState, setRunState] = useState(() => savedLearning?.runState || createAdventureRun(rounds.length));
  const [responseEpisode, setResponseEpisode] = useState(savedLearning?.episode || null);
  const responseEpisodeRef = useRef(responseEpisode);
  const [learningSaveError, setLearningSaveError] = useState(false);
  const runStateRef = useRef(runState);
  const [shaking, setShaking] = useState(false);
  const [sparkle, setSparkle] = useState(false);
  const [interactionLocked, setInteractionLocked] = useState(false);
  const [roundSupportLevel, setRoundSupportLevel] = useState(0);
  const [roundFeedback, setRoundFeedback] = useState("");
  const [correctionModel, setCorrectionModel] = useState(null);
  const [feedbackTone, setFeedbackTone] = useState("ready");
  const answerLockRef = useRef(false);
  const [celebration, setCelebration] = useState(null);
  const [sessionStations, setSessionStations] = useState({});
  const [mapZoom] = useState(1);
  const cueTimerRef = useRef(null);
  const transitionTimerRef = useRef(null);
  const resultVoiceRef = useRef(null);
  const mediaWindowReleaseRef = useRef(null);
  const playedInstructionKeyRef = useRef("");
  const instructionNeedsGestureRef = useRef(false);
  const deliveredTargetAudioRef = useRef({ round: null, sources: new Set() });
  const [roundAudioStatus, setRoundAudioStatus] = useState("ready");

  const activeCycle = cycleLock.locked
    ? cycleLock.cycle
    : playableCycles.find(cycle => cycle.id === activeCycleId) || null;
  const round = responseEpisode?.role === "transfer" ? responseEpisode.question : rounds[roundIndex] || null;
  const roundAudio = useMemo(
    () => (round ? resolveAdventureRoundAudio(round) : null),
    [round]
  );
  const reducedMotion = typeof window !== "undefined"
    && Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);

  const handleRoundAudioDelivery = useCallback(event => {
    const type = event?.type;
    if (type === "loading") setRoundAudioStatus("loading");
    else if (type === "started") setRoundAudioStatus("playing");
    else if (type === "failed" || type === "unavailable") setRoundAudioStatus("unavailable");
    else if (type === "completed" || type === "interrupted") setRoundAudioStatus("ready");
  }, []);

  const playInstruction = useCallback(currentRound => {
    instructionNeedsGestureRef.current = false;
    if (document.hidden) {
      instructionNeedsGestureRef.current = true;
      return;
    }
    if (deliveredTargetAudioRef.current.round !== currentRound) {
      deliveredTargetAudioRef.current = { round: currentRound, sources: new Set() };
    }
    playRoundInstruction(currentRound, {
      onDelivery: handleRoundAudioDelivery,
      onTargetDelivery: (src, event) => {
        if (event.type === "completed" && deliveredTargetAudioRef.current.round === currentRound) {
          deliveredTargetAudioRef.current.sources.add(src);
        }
      },
      onUnavailable: () => {
        instructionNeedsGestureRef.current = true;
        handleRoundAudioDelivery({ type: "unavailable" });
      }
    });
  }, [handleRoundAudioDelivery]);

  const cancelPendingTransition = useCallback(() => {
    if (transitionTimerRef.current === null) return;
    transitionTimerRef.current.cancel();
    transitionTimerRef.current = null;
  }, []);

  useEffect(() => {
    if (!cycleLock.locked) return;
    onLockedCycleAvailabilityChange?.(cycleLock.contentAvailable);
  }, [cycleLock.contentAvailable, cycleLock.locked, onLockedCycleAvailabilityChange]);

  useEffect(() => {
    function handleHydrated(event) {
      if (event.detail?.studentId && event.detail.studentId !== progressScopeKey) return;
      const stored = readElQuestLocalProgress(progressScopeKey);
      if (!stored.ok) {
        progressWritesBlockedRef.current = true;
        answerLockRef.current = true;
        cancelPendingTransition();
        if (cueTimerRef.current !== null) window.clearTimeout(cueTimerRef.current);
        cueTimerRef.current = null;
        stopCueAudio();
        setInteractionLocked(true);
        setSparkle(false);
        setShaking(false);
        setCorrectionModel(null);
        setProgressReadIssue(stored.reason || "unreadable");
        return;
      }
      const merged = mergeElQuestProgress(progressRef.current, stored.value);
      const checkpoint = merged.learningCheckpoint;
      const responseIssue = checkpoint?.responseConflict ? "response_conflict"
        : checkpoint && checkpoint.schemaVersion !== 1 ? "unsupported_version"
        : learningResponseRecoveryIssue(checkpoint?.episode);
      if (responseIssue) {
        progressWritesBlockedRef.current = true; answerLockRef.current = true;
        cancelPendingTransition(); stopCueAudio(); setInteractionLocked(true); setProgressReadIssue(responseIssue);
        return;
      }
      progressWritesBlockedRef.current = false;
      setProgressReadIssue("");
      progressRef.current = merged;
      setProgress(merged);
    }
    window.addEventListener("lp-progress-hydrated", handleHydrated);
    return () => window.removeEventListener("lp-progress-hydrated", handleHydrated);
  }, [cancelPendingTransition, progressScopeKey]);

  function recoverUnreadableProgress() {
    if (!clearElQuestLocalProgress(progressScopeKey)) {
      setProgressRecoveryFailed(true);
      return;
    }
    const recovered = readElQuestLocalProgress(progressScopeKey);
    if (!recovered.ok) {
      progressWritesBlockedRef.current = true;
      answerLockRef.current = true;
      setProgressRecoveryFailed(false);
      setInteractionLocked(true);
      setProgressReadIssue(recovered.reason || "unreadable");
      return;
    }
    setProgressRecoveryFailed(false);
    progressWritesBlockedRef.current = false;
    answerLockRef.current = false;
    setInteractionLocked(false);
    progressRef.current = recovered.value;
    setProgress(recovered.value);
    setProgressReadIssue("");
  }

  useEffect(() => {
    if (!stationId || celebration || !round || ["teaching", "finish_teaching", "receipt"].includes(responseEpisode?.phase)) return undefined;
    const instructionKey = `${stationId}:${roundIndex}:${round.roundKey || round.id}:${roundAudio?.instructionAudio || "silent"}`;
    if (roundAudio?.instructionAudio && playedInstructionKeyRef.current !== instructionKey) {
      cueTimerRef.current = window.setTimeout(() => {
        cueTimerRef.current = null;
        if (progressWritesBlockedRef.current) return;
        playedInstructionKeyRef.current = instructionKey;
        playInstruction(round);
      }, 120);
    }
    return () => {
      if (cueTimerRef.current !== null) window.clearTimeout(cueTimerRef.current);
      cueTimerRef.current = null;
    };
  }, [celebration, playInstruction, round, roundAudio, rounds, roundIndex, stationId, responseEpisode?.phase]);

  const checkpointAdventureFeedback = useCallback(() => {
    const current = progressRef.current;
    if (responseEpisodeRef.current?.phase !== "receipt" || !transitionTimerRef.current?.active || !current.learningCheckpoint) return;
    const next = { ...current, learningCheckpoint: { ...current.learningCheckpoint,
      feedbackRemainingMs: transitionTimerRef.current.remainingMs, updatedAt: new Date().toISOString(), revision: (current.learningCheckpoint.revision || 0) + 1 } };
    progressRef.current = next;
    if (!saveQuestProgress(progressScopeKey, next)) setLearningSaveError(true);
  }, [progressScopeKey]);

  useEffect(() => {
    const windowRounds = stationId && !celebration ? rounds.slice(roundIndex, roundIndex + 3) : [];
    const resolveMedia = item => {
      const media = collectQuestionMedia(item);
      const resolved = resolveAdventureRoundAudio(item);
      return { ...media, audio: [...new Set([resolved.instructionAudio, ...resolved.targetAudio, ...media.audio,
        ...(item.cards || []).map(card => wordAudioPath(card.word))].filter(Boolean))] };
    };
    const sources = [...new Set(windowRounds.flatMap(item => resolveMedia(item).audio))];
    // Acquire the overlapping window first so an upcoming cue is not evicted
    // and loaded again at the very moment it becomes the current question.
    const release = retainCueAudioSources(sources);
    mediaWindowReleaseRef.current?.();
    mediaWindowReleaseRef.current = release;
    const controller = new AbortController();
    void preloadQuestionMediaBatch(windowRounds, { signal: controller.signal, resolveMedia });
    return () => controller.abort();
  }, [celebration, rounds, roundIndex, stationId]);

  useEffect(() => {
    if (!stationId || celebration || !round) return undefined;
    const recover = event => {
      if (!instructionNeedsGestureRef.current || progressWritesBlockedRef.current) return;
      // Retry within a real game gesture when a browser denied autoplay. The
      // answer still runs normally; there is no listening gate or extra step.
      if (!event.target?.closest?.('[data-quest-view="round"]')) return;
      if (event.target.closest('[data-instruction-audio]')) return;
      playInstruction(round);
    };
    const recoverVisibility = () => {
      if (document.hidden) {
        if (cueTimerRef.current !== null) window.clearTimeout(cueTimerRef.current);
        cueTimerRef.current = null;
        transitionTimerRef.current?.pause(); checkpointAdventureFeedback(); stopCueAudio();
      } else if (!progressWritesBlockedRef.current) {
        if (transitionTimerRef.current) {
          transitionTimerRef.current.waitFor(resultVoiceRef.current?.()); transitionTimerRef.current.resume(); return;
        }
        playedInstructionKeyRef.current = `${stationId}:${roundIndex}:${roundAudio?.instructionAudio || "silent"}`;
        playInstruction(round);
      }
    };
    window.addEventListener("pointerdown", recover);
    window.addEventListener("keydown", recover);
    document.addEventListener("visibilitychange", recoverVisibility);
    window.addEventListener("pagehide", checkpointAdventureFeedback);
    return () => {
      checkpointAdventureFeedback();
      window.removeEventListener("pagehide", checkpointAdventureFeedback);
      window.removeEventListener("pointerdown", recover);
      window.removeEventListener("keydown", recover);
      document.removeEventListener("visibilitychange", recoverVisibility);
    };
  }, [celebration, playInstruction, round, roundAudio, roundIndex, stationId, checkpointAdventureFeedback]);

  useEffect(() => () => {
    cancelPendingTransition();
    if (cueTimerRef.current !== null) window.clearTimeout(cueTimerRef.current);
    stopCueAudio();
    mediaWindowReleaseRef.current?.();
  }, [cancelPendingTransition]);

  function openCycle(cycle) {
    if (cycleLock.locked || progressWritesBlockedRef.current) return;
    setActiveCycleId(cycle.id);
    setStationId(null);
    setCelebration(null);
    setSessionStations({});
    setCorrectionModel(null);
  }

  const startStation = useCallback((cycle, id) => {
    if (progressWritesBlockedRef.current) return;
    id = normalizeAdventureStationId(id);
    cancelPendingTransition();
    if (cueTimerRef.current !== null) window.clearTimeout(cueTimerRef.current);
    cueTimerRef.current = null;
    stopCueAudio();
    const nextSeed = createRunSeed(cycle.id, id);
    const nextRounds = buildStationRounds(cycle, id, { seed: nextSeed, ...(!cycleLock.locked ? adventureWordMatchOptions(progressRef.current) : {}) });
    const freshRun = createAdventureRun(nextRounds.length);
    setStationId(id);
    setRounds(nextRounds);
    setRoundIndex(0);
    setRunState(freshRun);
    runStateRef.current = freshRun;
    setRunSeed(nextSeed);
    answerLockRef.current = false;
    setInteractionLocked(false);
    setRoundSupportLevel(0);
    setRoundAudioStatus("ready");
    setRoundFeedback("");
    setCorrectionModel(null);
    setFeedbackTone("ready");
    setCelebration(null);
    const firstRound = nextRounds[0];
    if (firstRound) {
      const firstAudio = resolveAdventureRoundAudio(firstRound);
      playedInstructionKeyRef.current = `${id}:0:${firstRound.roundKey || firstRound.id}:${firstAudio.instructionAudio}`;
      // This runs inside the station-button tap, which keeps iPad Safari's
      // media permission attached to the child's trusted gesture.
      playInstruction(firstRound);
    }
  }, [cancelPendingTransition, playInstruction, cycleLock.locked]);

  function finishStation(finalRun) {
    if (progressWritesBlockedRef.current) return;
    cancelPendingTransition();
    stopCueAudio();
    const total = rounds.length;
    const currentProgress = progressRef.current;
    if (stationId === "check") {
      // The mission's quest task = a full cycle, sealed by the Cycle Check.
      // deferReturn: the cycle celebration (stars, certificate) follows -
      // never yank the child home over it. The celebration's own buttons
      // (map / choose a cycle) already give an honest way onward.
      notifyMissionTaskDone(progressScopeKey, "quest", { deferReturn: true });
      const result = cycleQuestResult(finalRun);
      const independent = finalRun.firstAttempts.filter(value => value === true).length;
      const playedAt = new Date().toISOString();
      const previous = currentProgress.cycles?.[activeCycle.id] || {};
      const nextProgress = {
        ...currentProgress,
        cycles: {
          ...currentProgress.cycles,
          [activeCycle.id]: {
            ...previous,
            stars: Math.max(previous.stars || 0, result.stars),
            bestScore: Math.max(previous.bestScore || 0, result.independentPercent),
            bestIndependent: Math.max(previous.bestIndependent || 0, independent),
            plays: (previous.plays || 0) + 1,
            recoveries: finalRun.recoveries,
            sampledConstructs: rounds.map(item => item.construct),
            lastRunSeed: runSeed,
            lastIndependent: independent,
            lastTotal: total,
            lastCheck: adventureCheckSnapshot(finalRun, playedAt),
            lastPlayedAt: playedAt
          }
        }
      };
      progressRef.current = { ...nextProgress, learningCheckpoint: { schemaVersion: 1, policyVersion: "learning-response-v1", closed: true, episode: null, updatedAt: new Date().toISOString(), revision: (currentProgress.learningCheckpoint?.revision || 0) + 1 } };
      setProgress({ ...nextProgress, learningCheckpoint: { schemaVersion: 1, policyVersion: "learning-response-v1", closed: true, episode: null, updatedAt: new Date().toISOString(), revision: (currentProgress.learningCheckpoint?.revision || 0) + 1 } });
      saveQuestProgress(progressScopeKey, { ...nextProgress, learningCheckpoint: { schemaVersion: 1, policyVersion: "learning-response-v1", closed: true, episode: null, updatedAt: new Date().toISOString(), revision: (currentProgress.learningCheckpoint?.revision || 0) + 1 } });
      playCelebrationFanfare();
      setCelebration({
        kind: "cycle",
        stars: result.stars,
        independent,
        recoveries: finalRun.recoveries,
        total
      });
    } else {
      playStarChime();
      const doneNow = { ...sessionStations, [stationId]: true };
      setSessionStations(doneNow);
      // Persist which stations are done so progress survives sign-out.
      const savedStations = {
        ...(currentProgress.cycles?.[activeCycle.id]?.stations || {}),
        [stationId]: true
      };
      const withStations = {
        ...currentProgress,
        cycles: {
          ...currentProgress.cycles,
          [activeCycle.id]: {
            ...(currentProgress.cycles?.[activeCycle.id] || {}),
            stations: savedStations,
            ...(rounds.at(-1)?.wordMatchNextBoard ? { wordMatchNextBoard: rounds.at(-1).wordMatchNextBoard } : {})
          }
        }
      };
      progressRef.current = { ...withStations, learningCheckpoint: { schemaVersion: 1, policyVersion: "learning-response-v1", closed: true, episode: null, updatedAt: new Date().toISOString(), revision: (currentProgress.learningCheckpoint?.revision || 0) + 1 } };
      setProgress({ ...withStations, learningCheckpoint: { schemaVersion: 1, policyVersion: "learning-response-v1", closed: true, episode: null, updatedAt: new Date().toISOString(), revision: (currentProgress.learningCheckpoint?.revision || 0) + 1 } });
      saveQuestProgress(progressScopeKey, { ...withStations, learningCheckpoint: { schemaVersion: 1, policyVersion: "learning-response-v1", closed: true, episode: null, updatedAt: new Date().toISOString(), revision: (currentProgress.learningCheckpoint?.revision || 0) + 1 } });
      // Choose where the adventure flows next: the first practice station
      // not yet done, or the Cycle Check once enough practice is in.
      const isDone = id => doneNow[id] || savedStations[id];
      const cycleStations = stationsForCycle(activeCycle);
      const practiceDone = cycleStations.filter(st => st.id !== "check" && isDone(st.id)).length;
      const nextStation = rounds.at(-1)?.wordMatchNextBoard ? cycleStations.find(st => st.id === 'spell')
        : cycleStations.find(st => st.id !== "check" && !st.optional && !isDone(st.id))
        || (practiceDone >= 4 ? cycleStations.find(st => st.id === "check") : null);
      setCelebration({ kind: "station", total, nextStationId: nextStation?.id || null });
    }
    setStationId(null);
  }

  function returnToMap() {
    cancelPendingTransition();
    stopCueAudio();
    setCelebration(null);
    setStationId(null);
    setSessionStations({});
    if (cycleLock.locked) return;
    if (onExit) onExit();
    else setActiveCycleId(null);
  }

  function persistAdventureLearning(episode, run = runStateRef.current, index = roundIndex) {
    responseEpisodeRef.current = episode; setResponseEpisode(episode);
    const event = episode ? learningResponseCompletionEvent(episode) : null;
    const currentProgress = progressRef.current;
    const events = event ? [...(currentProgress.learningResponses || []).filter(item => item.id !== event.id), event] : currentProgress.learningResponses || [];
    const next = { ...currentProgress, learningResponses: events, learningCheckpoint: {
      schemaVersion: 1, policyVersion: "learning-response-v1", cycleId: activeCycle.id, stationId, runSeed, rounds,
      runState: run, roundIndex: index, episode, feedbackRemainingMs: episode?.phase === "receipt" && currentProgress.learningCheckpoint?.episode?.id === episode.id ? currentProgress.learningCheckpoint.feedbackRemainingMs ?? null : null, updatedAt: new Date().toISOString(), revision: (currentProgress.learningCheckpoint?.revision || 0) + 1
    } };
    progressRef.current = next; setProgress(next);
    const saved = saveQuestProgress(progressScopeKey, next); setLearningSaveError(!saved);
    return saved;
  }
  function makeAdventureEpisode(question = round, index = roundIndex) {
    const candidates = Array.from({ length: 8 }, (_, index) => buildStationRounds(activeCycle, stationId, { seed: `${runSeed}:transfer:${question.roundKey}:${index}`, ...(!cycleLock.locked ? adventureWordMatchOptions(progress) : {}) })).flat();
    const transfer = selectFreshLearningTransfer(question, candidates, { excludedIds: rounds.slice(0, index + 1).map(item => item.roundKey || item.id) });
    return createLearningResponseEpisode({ id: `${runSeed}:slot:${index}`, instrument: "adventure_map", slotId: index,
      question, expected: learningExpectedAnswer(question), transfer: transfer ? { question: transfer, expected: learningExpectedAnswer(transfer) } : null });
  }
  function completeAdventureEpisode(completed) {
    let finished = runStateRef.current;
    if (completed.completion?.completed && completed.completion?.supported) finished = recordAdventureOutcome(finished, { correct: true, selected: completed.firstExpected,
      roundIndex, evidence: { independent: false, supportUsed: ["worked_model_and_transfer"] },
      ...(completed.modelFirst ? { questionRecord: adventureQuestionEvidence(completed.firstQuestion, { correct: true, selected: completed.firstExpected, evidence: { independent: false, supportUsed: ["model_first_after_unresolved_transfer"] } }) } : {}) });
    runStateRef.current = finished; setRunState(finished);
    if (!persistAdventureLearning(completed, finished)) return;
    setResponseEpisode(null); responseEpisodeRef.current = null;
    answerLockRef.current = false; setInteractionLocked(false); setRoundSupportLevel(0); setRoundFeedback(""); setCorrectionModel(null); setFeedbackTone("ready");
    if (roundIndex + 1 >= rounds.length) finishStation(finished);
    else { const nextIndex = roundIndex + 1;
      const nextEpisode = completed.completion?.unresolved && usesLearningResponseEpisode(rounds[nextIndex]) ? startLearningWithModel(makeAdventureEpisode(rounds[nextIndex], nextIndex)) : null;
      persistAdventureLearning(nextEpisode, finished, nextIndex); setRoundIndex(nextIndex); setRoundAudioStatus("ready"); }
  }
  function guideAdventure(selected) {
    const next = recordLearningGuidedAction(responseEpisodeRef.current, selected);
    if (next === responseEpisodeRef.current) return;
    if (!persistAdventureLearning(next)) return;
    setRoundFeedback(""); setCorrectionModel(null); setInteractionLocked(false); answerLockRef.current = false; setRoundAudioStatus("ready");
    if (next.phase === "complete") completeAdventureEpisode(next);
  }
  function playAdventureModel(episode) {
    const question = episode.question;
    const resolved = resolveAdventureRoundAudio(question);
    const values = Array.isArray(episode.expected) ? episode.expected : [episode.expected];
    const models = values.flatMap(value => {
      const item = [...(question.objects || []), ...(question.cells || [])].find(item => item.id === value || item.word === value);
      const label = item?.word || item?.letter || value;
      return [item?.audio, getPreferredPhonemeAudioPath(label), getLedaWordAudioPath(label)];
    }).filter(Boolean);
    playCueSequence([...new Set([resolved.instructionAudio, ...resolved.targetAudio, ...models].filter(Boolean))], { gapMs: 100, playImmediately: true });
  }
  useEffect(() => {
    const saved = responseEpisodeRef.current;
    if (saved?.phase !== "receipt" || transitionTimerRef.current || learningSaveError || document.hidden) return;
    answerLockRef.current = true; setInteractionLocked(true);
    const response = saved.responses.at(-1);
    setRoundFeedback(feedbackForCommittedOutcome(saved.question, { correct: response.observedCorrect, selected: response.selected }, 1));
    transitionTimerRef.current = createLearningDwell({ minimumMs: Number.isFinite(progressRef.current.learningCheckpoint?.feedbackRemainingMs) ? progressRef.current.learningCheckpoint.feedbackRemainingMs : saved.question.sentence ? LEARNING_PACE.sentence : LEARNING_PACE.word, onAdvance: () => {
      transitionTimerRef.current = null;
      const next = advanceLearningResponseReceipt(responseEpisodeRef.current);
      if (!persistAdventureLearning(next)) return;
      answerLockRef.current = false; setInteractionLocked(false);
      if (next.phase === "complete") completeAdventureEpisode(next);
    } });
    // Reload restores the scored receipt and foreground learning time, never a new answer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [responseEpisode?.id, responseEpisode?.phase, learningSaveError]);
  function handleOutcome(outcome) {
    if (
      progressWritesBlockedRef.current
      || answerLockRef.current
      || typeof outcome?.correct !== "boolean"
      || !round
    ) return;
    triggerTactileFeedback(outcome.correct ? 14 : [10, 40, 10]);
    answerLockRef.current = true;
    setInteractionLocked(true);
    cancelPendingTransition();

    const currentRun = runStateRef.current?.total === rounds.length
      ? runStateRef.current
      : createAdventureRun(rounds.length);
    const attempt = (currentRun.attempts?.[roundIndex] || 0) + 1;
    const committedOutcome = withAdventureAudioEvidence(
      round,
      { ...outcome, roundIndex, evidence: { ...outcome.evidence,
        ...((progressRef.current.learningResponses || []).some(event => (event.learningEpisode?.guidedActions?.some(action => learningStimulusSignature(action.question) === learningStimulusSignature(round)) || (event.learningEpisode?.transfer?.question && learningStimulusSignature(event.learningEpisode.transfer.question) === learningStimulusSignature(round) && event.learningEpisode?.guidedActions?.length))) ? { independent: false, supportUsed: ["recent_transfer_teaching"] } : {}) } },
      deliveredTargetAudioRef.current.round === round ? deliveredTargetAudioRef.current.sources : []
    );
    if (usesLearningResponseEpisode(round)) {
      const episode = responseEpisodeRef.current || makeAdventureEpisode();
      const evidence = adventureQuestionEvidence(round, committedOutcome);
      const nextRun = episode.role === "first_probe" ? recordAdventureOutcome(currentRun, { ...committedOutcome, questionRecord: evidence }) : currentRun;
      runStateRef.current = nextRun; setRunState(nextRun);
      const next = commitLearningResponse(episode, { selected: outcome.selected, correct: outcome.correct, responseStatus: "answered",
        supported: evidence.responseStatus === "supported", valid: evidence.responseStatus !== "media_failed", supportUsed: committedOutcome.evidence?.supportUsed || [],
        media: { audioDelivery: evidence.audioDelivery } });
      if (!persistAdventureLearning(next, nextRun)) return false;
      setRoundFeedback(feedbackForCommittedOutcome(round, outcome, 1)); setFeedbackTone(outcome.correct ? "correct" : "retry");
      // The receipt effect owns the transition to teaching or completion.
      return true;
    }
    const nextRun = recordAdventureOutcome(currentRun, {
      ...committedOutcome,
      questionRecord: adventureQuestionEvidence(round, committedOutcome)
    });
    runStateRef.current = nextRun;
    setRunState(nextRun);
    setRoundFeedback(feedbackForCommittedOutcome(round, outcome, attempt));
    const nextCorrectionModel = !outcome.correct && attempt >= 3
      ? correctionModelForOutcome(round, outcome)
      : null;
    setCorrectionModel(nextCorrectionModel
      ? { ...nextCorrectionModel, replayKey: `${roundIndex}:${attempt}` }
      : null);

    if (outcome.correct) {
      setFeedbackTone("correct");
      playCorrectChime();
      setSparkle(true);
      transitionTimerRef.current = createLearningDwell({ minimumMs: round.sentence || /sentence/i.test(round.mechanicId || "") ? LEARNING_PACE.sentence : LEARNING_PACE.word, onAdvance: () => {
        transitionTimerRef.current = null;
        if (progressWritesBlockedRef.current) return;
        setSparkle(false);
        if (roundIndex + 1 >= rounds.length) finishStation(nextRun);
        else {
          stopCueAudio();
          answerLockRef.current = false;
          setInteractionLocked(false);
          setRoundSupportLevel(0);
          setRoundAudioStatus("ready");
          setRoundFeedback("");
          setCorrectionModel(null);
          setFeedbackTone("ready");
          setRoundIndex(index => index + 1);
        }
      } });
      resultVoiceRef.current = () => new Promise(resolve => {
        const sources = roundAudio?.targetAudio || [];
        if (!sources.length) { resolve(); return; }
        playCueSequence(sources, { gapMs: 90, onDelivery: event => { if (["completed", "failed", "unavailable", "interrupted"].includes(event.type)) resolve(); }, onUnavailable: resolve });
      });
      transitionTimerRef.current.waitFor(resultVoiceRef.current());
      if (document.hidden) transitionTimerRef.current.pause();
    } else {
      setFeedbackTone("retry");
      playSoftBuzz();
      setShaking(true);
      transitionTimerRef.current = createLearningDwell({ minimumMs: LEARNING_PACE.word, settleMs: 0, onAdvance: () => {
        transitionTimerRef.current = null;
        if (progressWritesBlockedRef.current) return;
        if (roundAudio?.targetAudio?.length) {
          replayTarget();
        } else {
          playCue(round);
        }
        answerLockRef.current = false;
        setInteractionLocked(false);
      } });
      resultVoiceRef.current = null;
      if (document.hidden) transitionTimerRef.current.pause();
    }
  }

  function stopStation() {
    cancelPendingTransition();
    if (cueTimerRef.current !== null) window.clearTimeout(cueTimerRef.current);
    cueTimerRef.current = null;
    stopCueAudio();
    answerLockRef.current = false;
    setInteractionLocked(false);
    setRoundAudioStatus("ready");
    setSparkle(false);
    setShaking(false);
    setCorrectionModel(null);
    setStationId(null);
  }

  function acknowledgeRetryInteraction() {
    if (answerLockRef.current || feedbackTone !== "retry") return;
    setRoundFeedback("");
    setCorrectionModel(model => model?.mode === "native-formation" ? model : null);
    setFeedbackTone("ready");
    setShaking(false);
  }

  function replayTarget(options = {}) {
    if (roundAudio?.targetAudio?.length) {
      playCueSequence(roundAudio.targetAudio, {
        playImmediately: true,
        gapMs: 150,
        onItemDelivery: event => {
          const itemIndex = Number(String(event.id).split(":").at(-1)) - 1;
          if (event.type === "completed" && deliveredTargetAudioRef.current.round === round) {
            deliveredTargetAudioRef.current.sources.add(roundAudio.targetAudio[itemIndex]);
          }
        },
        onDelivery: event => {
          handleRoundAudioDelivery(event);
          options.onDelivery?.(event);
        },
        onUnavailable: event => {
          handleRoundAudioDelivery({ ...event, type: "failed" });
          options.onUnavailable?.(event);
        }
      });
    } else {
      handleRoundAudioDelivery({ type: "unavailable" });
      options.onUnavailable?.({ type: "unavailable" });
    }
  }

  function replayFromMechanic(options = {}) {
    if (roundAudio?.targetAudio?.length) {
      replayTarget(options);
    } else {
      playRoundInstruction(round, {
        onDelivery: event => {
          handleRoundAudioDelivery(event);
          options.onDelivery?.(event);
        },
        onUnavailable: event => {
          handleRoundAudioDelivery({ ...event, type: "failed" });
          options.onUnavailable?.(event);
        }
      });
    }
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
      if (progressWritesBlockedRef.current) return;
      setCelebration(null);
      startStation(activeCycle, celebration.nextStationId);
    }, 2600);
    return () => window.clearTimeout(timer);
  }, [celebration, activeCycle, startStation]);

  if (progressReadIssue === "unsupported_version") {
    return (
      <main
        className="skills-block-quest"
        data-learning-lane="practice_and_play"
        data-quest-view="progress-update-required"
        role="alert"
      >
        <div className="sbq-celebrate">
          <h1>Adventure Map needs an update</h1>
          <p>This map was saved by a newer version of Literacy Guide.</p>
          <p>Update the app before playing so your map stays safe.</p>
          <button className="sbq-primary-button" type="button" onClick={() => window.location.reload()}>
            Check for the update
          </button>
        </div>
      </main>
    );
  }

  if (progressReadIssue) {
    return (
      <main
        className="skills-block-quest"
        data-learning-lane="practice_and_play"
        data-quest-view="progress-recovery"
        role="alert"
      >
        <div className="sbq-celebrate">
          <h1>Adventure Map needs a fresh start</h1>
          <p>We couldn&apos;t read this map&apos;s saved progress on this device.</p>
          <p>Clear this map copy and try again. Your other learning stays safe.</p>
          <button className="sbq-primary-button" type="button" onClick={recoverUnreadableProgress}>
            Clear map copy and try again
          </button>
          {progressRecoveryFailed && (
            <p role="status">This device could not clear the map copy. Ask a grown-up for help.</p>
          )}
        </div>
      </main>
    );
  }

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
        data-quest-view="map"
      >
        <header className="sbq-top">
          <div>
            <p className="sbq-kicker">Adventure Map</p>
            <h1 data-child-title="">Your sound and word path</h1>
            <p className="sbq-sub" data-child-instruction="">{cyclesComplete ? 'Keep matching more words at your last stop.' : 'Follow “you are here” to start.'}</p>
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
                          onClick={isRecommended ? () => {
                            if (panRef.current.moved) return;
                            openCycle(cycle);
                            if (cyclesComplete) startStation(cycle, 'spell');
                          } : undefined}
                          aria-label={cyclesComplete && isRecommended ? 'More Word Match' : `${landmarks[index] || `Cycle ${cycle.cycleNumber}`}${isRecommended ? " - you are here" : ""}`}
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
                                <span className="sbq-stop-next" data-child-emphasis-cue="">{cyclesComplete ? 'More Word Match' : 'Go next'}</span>
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
          {isCycle ? (
            <>
              <p>{celebration.independent} of {celebration.total} completed independently on the first try.</p>
              {celebration.recoveries > 0 && (
                <p>You recovered {celebration.recoveries} {celebration.recoveries === 1 ? "round" : "rounds"} after support.</p>
              )}
            </>
          ) : (
            <p>All {celebration.total} rounds finished.</p>
          )}
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
                } else if (isCycle && cyclesComplete && !cycleLock.locked) {
                  setCelebration(null);
                  startStation(activeCycle, 'spell');
                } else if (isCycle) {
                  returnToMap();
                } else {
                  setCelebration(null);
                }
              }}
            >
              {isCycle
                ? cycleLock.locked ? "Back to this cycle" : cyclesComplete ? 'More Word Match' : "Back to the map"
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
                onClick={returnToMap}
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
    const { stationDone, practiceDone, checkLocked, nextStation } = adventureStationContinuation(cycleStations, progress.cycles?.[activeCycle.id], sessionStations);
    const mainStations = cycleStations.filter(station => !station.optional);
    const completedCount = mainStations.filter(station => stationDone(station.id)).length;
    const completionPercent = Math.round((completedCount / Math.max(1, mainStations.length)) * 100);

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
              <h1 id="sbq-cycle-title">{cyclePracticeDisplayTitle(activeCycle, (activeCycle.focusLetters || []).map(item => item.grapheme).join(" and ") || "Review time").replace(/^Cycle \d+: /, "")}</h1>
              <p className="sbq-sub">{activeCycle.childFriendlyGoal}</p>
              {cycleReviewGraphemes(activeCycle).length > 0 && <p className="sbq-sub" data-cycle-review="">
                {cycleReviewGraphemes(activeCycle).length <= 6
                  ? `Review: ${cycleReviewGraphemes(activeCycle).map(displayGraphemePair).join(", ")}`
                  : "Plus earlier letters and sounds"}
              </p>}
            </div>
            <div className="sbq-cycle-head-actions">
              <div className="sbq-cycle-progress" aria-label={`${completedCount} of ${mainStations.length} main stations complete. Extra games are optional.`}>
                <span><strong>{completedCount}</strong> of {mainStations.length} main games</span>
                <span className="sbq-cycle-progress-track" aria-hidden="true">
                  <span style={{ width: `${completionPercent}%` }} />
                </span>
              </div>
              {!cycleLock.locked && (
                <button className="sbq-ghost-button" type="button" onClick={returnToMap}>
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
                  : done ? "Complete, play again" : isNext ? `Start here, ${station.subtitle}`
                    : station.optional ? `Extra game, ${station.subtitle}` : station.subtitle;
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
                      {done ? "✓" : locked ? <StationLockIcon /> : station.optional ? "+" : mainStations.findIndex(main => main.id === station.id) + 1}
                    </span>
                    <span className="sbq-station-copy">
                      <strong>{station.title}{station.optional ? " · Extra" : ""}</strong>
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
      data-cycle-id={activeCycle.id}
      data-station-id={stationId}
      data-round-type={round?.mechanicId || "loading"}
      data-run-seed={runSeed}
      data-pal-world={roundWorld.id}
      style={{ ...worldStyle(roundWorld), "--pal-scene": `url(${sceneForKey(roundWorld, `${activeCycle.id}-${stationId}`)})` }}
    >
      <div className="pal-scene-backdrop" aria-hidden="true" />
      {round && (
        <AdventureRoundFrame
          stationTitle={station?.title || "Adventure station"}
          roundNumber={roundIndex + 1}
          roundTotal={rounds.length}
          mechanicId={round.mechanicId}
          instructionText={roundAudio?.instructionText || round.instruction || round.prompt}
          instructionAudio={roundAudio?.instructionAudio || ""}
          detailText={roundAudio?.detailText || ""}
          supportText={round.support || ""}
          feedback={roundFeedback || "Your turn."}
          feedbackTone={feedbackTone}
          correctionModel={correctionModel}
          announceFeedback={["letterPair", "soundChoice", "sightWordChoice", "sceneHunt"].includes(round.mechanicId)}
          shaking={shaking}
          sparkle={sparkle}
          disabled={interactionLocked}
          hasTargetAudio={Boolean(roundAudio?.targetAudio?.length)}
          audioStatus={roundAudioStatus}
          targetReplayLabel={targetReplayLabelFor(round)}
          onReplayInstruction={() => {
            playInstruction(round);
          }}
          onReplayTarget={() => {
            setRoundSupportLevel(level => level + 1);
            replayTarget();
          }}
          onStageInteraction={acknowledgeRetryInteraction}
          onShakeEnd={() => setShaking(false)}
          onStop={stopStation}
        >
          {learningSaveError ? <section className="learning-teaching-card" role="alert"><h2>Your answer is still here</h2><p>Let's save your work before carrying on.</p><button type="button" onClick={() => {
            if (persistAdventureLearning(responseEpisodeRef.current)) { setLearningSaveError(false); if (learningGuidedModelIsPlaced(responseEpisodeRef.current)) guideAdventure(responseEpisodeRef.current.expected); else if (responseEpisodeRef.current?.phase === "complete") completeAdventureEpisode(responseEpisodeRef.current); }
          }}>Try saving again</button></section> : ["teaching", "finish_teaching"].includes(responseEpisode?.phase)
            ? <LearningTeachingCard key={`${responseEpisode.id}:${responseEpisode.phase}`} episode={responseEpisode}
              explanation={correctionModelForOutcome(responseEpisode.question)?.instruction || feedbackForCommittedOutcome(responseEpisode.question, { correct: false }, 3)}
              image={responseEpisode.question.image} word={responseEpisode.question.targetWord || responseEpisode.question.word}
              onGuided={guideAdventure} onGuidedStep={index => persistAdventureLearning(recordLearningGuidedStep(responseEpisodeRef.current, index))} onReplay={() => playAdventureModel(responseEpisode)} onLeave={stopStation} />
            : <AdventureMechanicRenderer
            key={`${stationId}:${roundIndex}:${round.roundKey || round.mechanicId}`}
            round={round}
            disabled={interactionLocked}
            correctionModel={correctionModel}
            supportLevel={(runState.attempts?.[roundIndex] || 0) + roundSupportLevel}
            onCommit={handleOutcome}
            onCorrectionModelAcknowledged={() => setCorrectionModel(null)}
            onRequestReplay={replayFromMechanic}
            onRequestObjectAudio={word => {
              const audio = wordAudioPath(word);
              if (audio) {
                playCueAudio(audio, {
                  volume: 0.9,
                  playImmediately: true,
                  onDelivery: event => {
                    handleRoundAudioDelivery(event);
                    if (event.type === "completed" && deliveredTargetAudioRef.current.round === round) {
                      deliveredTargetAudioRef.current.sources.add(audio);
                    }
                  },
                  onUnavailable: () => handleRoundAudioDelivery({ type: "failed" })
                });
              } else {
                handleRoundAudioDelivery({ type: "unavailable" });
              }
            }}
            reducedMotion={reducedMotion}
          />}
        </AdventureRoundFrame>
      )}
    </main>
  );
}

export function ElSkillsQuest(props) {
  return <ElSkillsQuestSession key={`${props.progressScopeKey || "default"}:${props.lockedCycleId || ""}:${props.initialCycleId || ""}:${props.initialStationId || ""}`} {...props} />;
}

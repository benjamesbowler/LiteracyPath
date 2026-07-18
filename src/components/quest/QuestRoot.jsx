// SOUND SEEKERS — the root.
//
// Portals to document.body and goes full-screen. That is not a style choice:
// framer-motion puts a transform on ancestors elsewhere in this app, and a
// transformed ancestor traps `position: fixed`, which silently breaks
// full-screen. GamePlayer.jsx already found this the hard way. Do not "simplify"
// this back into the tree.
//
// This component owns the save file and the view; everything under it is a pure
// function of the state it is handed.

import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import CreatureCreator from "./CreatureCreator.jsx";
import DenScreen from "./DenScreen.jsx";
import RewardScreen from "./RewardScreen.jsx";
import TrailMap from "./TrailMap.jsx";
import QuestTrail2D from "./world/QuestTrail2D.jsx";
import TradingPost from "./TradingPost.jsx";
import { loadQuestProgress, saveQuestProgress } from "../../utils/questStore.js";
import { computeHydratedValue } from "../../utils/progressMerge.js";
import {
  recordQuestAttempt,
  recordStopResult,
  earnedGearReward,
  saveQuestCheckpoint,
  ownedPieces,
  chapterRewardForStop,
  availableSparks
} from "../../utils/questProgress.js";
import { isMastered } from "../../utils/questMastery.js";
import { getStop, QUEST_STOPS } from "../../data/questSequence.js";
import { CREATURE_GEAR } from "../../data/creatureParts.js";
import { chapterForStop } from "../../data/questChapters.js";
import { seedwakeStopSpec } from "../../data/questChapterOne.js";
import {
  setGameAudioSuspended,
  startGameAmbience,
  startGameMusic,
  stopGameAmbience,
  stopGameMusic
} from "../../utils/audio/gameMusic.js";
import { cancelGameSfx } from "../../utils/audio/gameSfx.js";
import { setCueAudioSuspended } from "../../utils/audio/cuePlayer.js";
import { hushCue } from "./shells/shellContract.js";
import { notifyMissionTaskDone } from "../../utils/dailyMission.js";
import { logStudentActivity } from "../../utils/progressSync.js";
import { detectQuestQuality, QUEST_QUALITY_TIERS } from "../../utils/questPerformance.js";
import {
  OFFLINE_EVENT,
  offlineShellHistory,
  warmQuestOfflineAssets
} from "../../utils/offlineShell.js";
import { chapterShortcutReviewPlan, freeRoamReviewPlan } from "../../utils/questReviewMode.js";
import {
  anticipatedJourneyState,
  finishJourneyLayer,
  markJourneyLayerReady,
  prepareJourneyLayer
} from "../../utils/questJourney.js";
import {
  addQuestActiveTime,
  beginQuestSession,
  endQuestSession,
  recordQuestInteractionEvent,
  recordQuestRuntimeEvent,
  recordQuestTelemetryAnswer,
  recordQuestTelemetryStop
} from "../../utils/questTelemetry.js";
import "../../styles/quest.css";

const VIEW = {
  CREATOR: "creator",
  DEN: "den",
  MAP: "map",
  WORLD: "world",
  CEREMONY: "ceremony",
  POST: "post"
};

const OFFLINE_RUNTIME_EVENT_TYPES = Object.freeze({
  "shell-ready": "offline-shell-ready",
  "offline-start": "offline-cold-start",
  "quest-warm-complete": "offline-warm-complete",
  "quest-warm-timeout": "offline-warm-failed",
  "shell-error": "offline-shell-error",
  "update-ready": "offline-update-ready",
  "update-applied": "offline-update-applied"
});

const QuestPixelWorld = lazy(() => import("./world/QuestPixelWorld.jsx"));
const QuestHub = lazy(() => import("./world/QuestHub.jsx"));

function nextAdventureId(state) {
  const done = new Set(state?.trail?.stopsDone || []);
  const unfinished = QUEST_STOPS.find(stop => !done.has(stop.id));
  if (unfinished) return unfinished.id;
  const cursor = Math.max(1, Math.min(QUEST_STOPS.length, Number(state?.trail?.routeCursor) || 1));
  return QUEST_STOPS[cursor - 1]?.id || QUEST_STOPS[0]?.id || null;
}

function nextStopAfter(state) {
  const id = nextAdventureId(state);
  return id ? getStop(id) : null;
}

// `initialView` / `initialStop` exist for ONE reason: preview/quest.jsx, the
// screenshot harness. Sound Seekers sits behind a student login, so without a way
// to address a screen directly it cannot be looked at without an account — and a
// screen nobody can look at is a screen whose layout gets written by guesswork.
// Both default to null, so the app's real behaviour is untouched.
export default function QuestRoot({
  progressScopeKey = "default",
  isSoundEnabled = true,
  onExit,
  initialView = null,
  initialStop = null,
  disableAdaptiveQuality = false
}) {
  const previewState = initialView === VIEW.CEREMONY ? loadQuestProgress(progressScopeKey) : null;
  const previewCeremony = initialView === VIEW.CEREMONY && getStop(initialStop)
    ? {
      id: `preview-${initialStop}`,
      stop: getStop(initialStop),
      nextStop: QUEST_STOPS[getStop(initialStop).index] || null,
      stars: 3,
      newStones: previewState?.stones?.slice(-5) || [],
      gear: CREATURE_GEAR.find(item => item.unlock === initialStop)?.id || null,
      chapterReward: chapterRewardForStop(initialStop),
      state: previewState
    }
    : null;
  const [state, setState] = useState(() => loadQuestProgress(progressScopeKey));
  const [view, setView] = useState(
    () => initialView || (loadQuestProgress(progressScopeKey).hatched ? VIEW.DEN : VIEW.CREATOR)
  );
  const [activeStop, setActiveStop] = useState(() => (
    [VIEW.WORLD, VIEW.CEREMONY].includes(initialView) ? initialStop : null
  ));
  const [worldLayers, setWorldLayers] = useState(() => (
    [VIEW.WORLD, VIEW.CEREMONY].includes(initialView) && initialStop
      ? [{ stopId: initialStop, status: "active", ready: false, anticipatedFrom: null }]
      : []
  ));
  const [trailNotice, setTrailNotice] = useState(null);
  const [mapChapter, setMapChapter] = useState(() => chapterForStop(initialStop)?.index || 1);
  const [journeyMode, setJourneyMode] = useState({ kind: "journey", targets: null });
  const [ceremony, setCeremony] = useState(previewCeremony);
  const [ceremonyOverlayVisible, setCeremonyOverlayVisible] = useState(() => (
    Boolean(previewCeremony && previewState?.settings?.reducedMotion)
  ));
  const [force2d, setForce2d] = useState(false);
  const [runtimeQualityId, setRuntimeQualityId] = useState(null);
  const [runtimeNotice, setRuntimeNotice] = useState(null);
  const [musicState, setMusicState] = useState("travel");
  const stateRef = useRef(state);
  const latestCheckpointRef = useRef(state.checkpoint);
  const journeyTransitionTimerRef = useRef(0);
  const quality = useMemo(() => detectQuestQuality(state.settings), [state.settings]);
  const runtimeQuality = runtimeQualityId && QUEST_QUALITY_TIERS[runtimeQualityId]
    ? QUEST_QUALITY_TIERS[runtimeQualityId]
    : quality;
  const activeQuality = force2d ? QUEST_QUALITY_TIERS["2d"] : runtimeQuality;
  const use2d = activeQuality.id === "2d";
  const usePixel = activeQuality.id === "pixel";
  const useSimpleWorld = use2d || usePixel;
  const musicChapter = [VIEW.WORLD, VIEW.CEREMONY].includes(view) ? chapterForStop(activeStop) : null;
  const baseMusicTrack = musicChapter?.audio?.score || "meadow";
  const musicTrack = musicChapter?.id === "seedwake-meadow"
    ? view === VIEW.CEREMONY
      ? "seedwake-ramble-ceremony"
      : musicState === "encounter"
        ? "seedwake-ramble-action"
        : "seedwake-ramble"
    : baseMusicTrack;
  const musicMode = view === VIEW.CEREMONY ? "ceremony" : musicState;
  const musicFallback = musicChapter?.worldKit || "meadow";
  const soundscapeEnabled = isSoundEnabled && !state.settings?.quietSoundscape;
  const ceremonyWorldReady = worldLayers.some(layer => layer.status === "active" && layer.ready);

  useEffect(() => {
    if (view !== VIEW.CEREMONY || !ceremony || ceremonyOverlayVisible) return undefined;
    if (!use2d && !ceremonyWorldReady) return undefined;
    const timer = window.setTimeout(() => setCeremonyOverlayVisible(true), 1150);
    return () => window.clearTimeout(timer);
  }, [ceremony, ceremonyOverlayVisible, ceremonyWorldReady, use2d, view]);

  // One writer. Every state change goes through here, so there is exactly one
  // place a save can go wrong.
  const commit = useCallback(next => {
    stateRef.current = next;
    latestCheckpointRef.current = next.checkpoint;
    setState(next);
    saveQuestProgress(progressScopeKey, next);
    return next;
  }, [progressScopeKey]);

  // A fresh device can open Sound Seekers BEFORE the async cloud hydrate lands.
  // The mount snapshot above would then clobber the just-hydrated save on the
  // next commit — the exact race every other progress surface already guards
  // against (StudentHomePage.jsx). When the hydrate event fires for this child,
  // fold the now-hydrated stored state into whatever has happened in memory
  // since, using the same per-area merge the hydrator itself uses, and persist
  // the union so neither side is lost.
  useEffect(() => {
    function handleHydrated(event) {
      if (event.detail?.studentId && event.detail.studentId !== progressScopeKey) return;
      const stored = loadQuestProgress(progressScopeKey);
      // ACROSS A TEACHER RESET THERE IS NOTHING TO MERGE. The forward-only
      // union would fold this tab's pre-reset in-memory state straight back
      // into the freshly wiped save — silently undoing the reset from any
      // open session. Replace instead; the wiped store is the truth now.
      const merged = event.detail?.resetApplied
        ? stored
        : computeHydratedValue("phonics_quest", "__all__", stateRef.current, stored);
      const wasUnhatched = !stateRef.current.hatched;
      commit(merged);
      // A child parked on the hatch screen whose cloud save turns out to have a
      // creature should not be asked to make a second one.
      if (wasUnhatched && merged.hatched) {
        setView(current => (current === VIEW.CREATOR ? VIEW.DEN : current));
      }
    }
    window.addEventListener("lp-progress-hydrated", handleHydrated);
    return () => window.removeEventListener("lp-progress-hydrated", handleHydrated);
  }, [commit, progressScopeKey]);

  // Belt-and-braces against zombie telemetry: if this component unmounts with
  // a session still open (navigation paths that skip handleExit), close it in
  // the save file. beginQuestSession also recovers >6h-stale sessions, so a
  // hard crash costs one recovered record, not every future session.
  useEffect(() => () => {
    const ended = endQuestSession(stateRef.current, { reason: "unmount" });
    if (ended !== stateRef.current) {
      stateRef.current = ended;
      saveQuestProgress(progressScopeKey, ended);
    }
  }, [progressScopeKey]);

  useEffect(() => {
    const recordConnectionEvent = event => {
      const current = stateRef.current;
      const recorded = recordQuestRuntimeEvent(current, event);
      if (recorded !== current) commit(recorded);
    };
    const handleOffline = () => recordConnectionEvent({ type: "network-offline" });
    const handleOnline = () => recordConnectionEvent({ type: "network-online" });
    const handleProgressSync = event => {
      const detail = event.detail || {};
      if (detail.studentId !== progressScopeKey || detail.area !== "phonics_quest") return;
      if (detail.status === "deferred") recordConnectionEvent({ type: "sync-deferred" });
      if (detail.status === "recovered") recordConnectionEvent({ type: "sync-recovered" });
    };
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    window.addEventListener("lp-progress-sync-state", handleProgressSync);
    if (navigator.onLine === false) handleOffline();
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("lp-progress-sync-state", handleProgressSync);
    };
  }, [commit, progressScopeKey]);

  useEffect(() => {
    const recordOfflineEvidence = detail => {
      const type = OFFLINE_RUNTIME_EVENT_TYPES[detail?.type];
      if (!type) return;
      const current = stateRef.current;
      const recorded = recordQuestRuntimeEvent(current, { ...detail, type });
      if (recorded !== current) commit(recorded);
    };
    const handleOfflineEvidence = event => recordOfflineEvidence(event.detail);
    for (const detail of offlineShellHistory()) recordOfflineEvidence(detail);
    window.addEventListener(OFFLINE_EVENT, handleOfflineEvidence);
    return () => window.removeEventListener(OFFLINE_EVENT, handleOfflineEvidence);
  }, [commit, state.telemetry?.current?.id]);

  useEffect(() => {
    if (view !== VIEW.WORLD || !stateRef.current.telemetry?.current) return undefined;
    let last = performance.now();
    const bankTime = () => {
      const now = performance.now();
      const elapsed = document.visibilityState === "visible" ? now - last : 0;
      last = now;
      if (elapsed < 250) return;
      const current = stateRef.current;
      const next = addQuestActiveTime(current, elapsed);
      if (next !== current) commit(next);
    };
    const timer = window.setInterval(bankTime, 15000);
    const onVisibility = () => {
      if (document.visibilityState === "hidden") bankTime();
      else last = performance.now();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
      bankTime();
    };
  }, [commit, view]);

  useEffect(() => {
    if (soundscapeEnabled) startGameMusic(musicTrack, { fallbackWorldId: musicFallback, mode: musicMode });
    else stopGameMusic();
  }, [musicFallback, musicMode, musicTrack, soundscapeEnabled]);

  useEffect(() => {
    if (soundscapeEnabled && musicChapter?.id) {
      startGameAmbience(musicChapter.id, {
        mode: musicMode
      });
    } else stopGameAmbience();
  }, [musicChapter?.id, musicMode, soundscapeEnabled]);

  useEffect(() => {
    if (!import.meta.env.PROD || ![VIEW.DEN, VIEW.MAP, VIEW.WORLD, VIEW.CEREMONY].includes(view)) return undefined;
    const timer = window.setTimeout(() => {
      if (typeof performance.getEntriesByType !== "function") return;
      const urls = performance.getEntriesByType("resource")
        .map(entry => entry.name)
        .filter(name => name.includes("/game-assets/quest-pixel/") || name.includes("/audio/music/quest/"));
      if (urls.length) {
        void warmQuestOfflineAssets(urls, { chapterId: musicChapter?.id || "" });
      }
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [musicChapter?.id, view]);

  useEffect(() => {
    const syncAudioVisibility = () => {
      const hidden = document.visibilityState === "hidden";
      setGameAudioSuspended(hidden);
      setCueAudioSuspended(hidden);
    };
    syncAudioVisibility();
    document.addEventListener("visibilitychange", syncAudioVisibility);
    return () => {
      document.removeEventListener("visibilitychange", syncAudioVisibility);
      setCueAudioSuspended(false);
      setGameAudioSuspended(false);
    };
  }, []);

  useEffect(() => () => {
    stopGameMusic();
    stopGameAmbience({ fadeSeconds: 0 });
    cancelGameSfx();
    hushCue();
  }, []);

  useEffect(() => {
    if (!trailNotice) return undefined;
    const timer = window.setTimeout(() => setTrailNotice(null), 4200);
    return () => window.clearTimeout(timer);
  }, [trailNotice]);

  useEffect(() => {
    if (!runtimeNotice) return undefined;
    const timer = window.setTimeout(() => setRuntimeNotice(null), 4200);
    return () => window.clearTimeout(timer);
  }, [runtimeNotice]);

  // The child can leave through the app close button, browser navigation, or a
  // parent route change. Keep the last in-memory checkpoint durable in all three.
  useEffect(() => () => {
    const current = latestCheckpointRef.current
      ? saveQuestCheckpoint(stateRef.current, latestCheckpointRef.current)
      : stateRef.current;
    saveQuestProgress(progressScopeKey, current);
  }, [progressScopeKey]);

  const owned = useMemo(() => ownedPieces(state), [state]);

  const handleAnswer = useCallback((stopId, target, correct, shell) => {
    // stopIndex is not decoration: it is what the review scheduler measures
    // "how long since the child last saw this sound" from.
    const stopIndex = getStop(stopId)?.index || 0;
    setState(prev => {
      const attempted = recordQuestAttempt(prev, { target, correct, shell, stopIndex });
      const next = recordQuestTelemetryAnswer(attempted, correct);
      stateRef.current = next;
      saveQuestProgress(progressScopeKey, next);
      return next;
    });
    logStudentActivity("phonics_quest", stopId, "answer", { target, correct, shell });
  }, [progressScopeKey]);

  const handleCheckpoint = useCallback(cp => {
    latestCheckpointRef.current = cp;
    setState(prev => {
      const next = saveQuestCheckpoint(prev, cp);
      stateRef.current = next;
      saveQuestProgress(progressScopeKey, next);
      return next;
    });
  }, [progressScopeKey]);

  const handleInteraction = useCallback((stopId, event) => {
    if (!event?.type) return;
    setState(prev => {
      const next = recordQuestInteractionEvent(prev, event);
      stateRef.current = next;
      saveQuestProgress(progressScopeKey, next);
      return next;
    });
    if (["motor-retry", "teach-back"].includes(event.type)) {
      logStudentActivity("phonics_quest", stopId, "interaction_support", {
        type: event.type,
        mechanic: event.mechanic || null
      });
    }
  }, [progressScopeKey]);

  const handleLayerReady = useCallback(stopId => {
    setWorldLayers(layers => markJourneyLayerReady(layers, stopId));
  }, []);

  const handleRuntimeSignal = useCallback(signal => {
    if (!signal?.type) return;
    if (disableAdaptiveQuality && ["frame-window", "quality-change"].includes(signal.type)) return;
    const current = stateRef.current;
    const recorded = recordQuestRuntimeEvent(current, signal);
    if (recorded !== current) commit(recorded);

    if (signal.type === "quality-change" && signal.toTier && signal.toTier !== "2d") {
      setRuntimeQualityId(signal.toTier);
    }
    if (["context-lost", "renderer-error"].includes(signal.type) || signal.toTier === "2d") {
      setForce2d(true);
      setRuntimeQualityId("2d");
      const detail = import.meta.env.DEV && signal.reason ? ` (${signal.reason})` : "";
      const renderer = signal.fromTier === "pixel" ? "Adventure view" : "3D";
      setRuntimeNotice(`${renderer} paused${detail}. Your trail is continuing in 2D.`);
    }
    if (!["frame-window", "runtime-health"].includes(signal.type)) {
      logStudentActivity("phonics_quest", signal.stopId || activeStop, "runtime", {
        type: signal.type,
        fromTier: signal.fromTier || null,
        toTier: signal.toTier || signal.tierId || null,
        averageFrameMs: Number(signal.averageFrameMs) || 0,
        longFrames: Number(signal.longFrames) || 0
      });
    }
  }, [activeStop, commit, disableAdaptiveQuality]);

  const prepareNextLayer = useCallback(finishedStopId => {
    if (useSimpleWorld || journeyMode.kind !== "journey" || chapterRewardForStop(finishedStopId)) return;
    const finishedStop = getStop(finishedStopId);
    const nextStop = finishedStop ? QUEST_STOPS[finishedStop.index] : null;
    if (!nextStop) return;
    setWorldLayers(layers => prepareJourneyLayer(layers, finishedStopId, nextStop.id));
  }, [journeyMode.kind, useSimpleWorld]);

  useEffect(() => {
    const arriving = worldLayers.find(layer => layer.status === "arriving");
    if (!arriving) return undefined;
    window.clearTimeout(journeyTransitionTimerRef.current);
    journeyTransitionTimerRef.current = window.setTimeout(() => {
      setWorldLayers(layers => {
        const incoming = layers.find(layer => layer.stopId === arriving.stopId);
        return incoming
          ? [{ ...incoming, status: "active", ready: true, anticipatedFrom: null }]
          : layers;
      });
    }, 460);
    return () => window.clearTimeout(journeyTransitionTimerRef.current);
  }, [worldLayers]);

  const handleFinish = useCallback((finishedStopId, stars, tally = {}) => {
    if (!finishedStopId) return;
    const previous = stateRef.current;

    if (journeyMode.kind === "review") {
      const reviewed = recordQuestTelemetryStop(previous, finishedStopId);
      const next = commit(endQuestSession(reviewed, { reason: "review_complete" }));
      latestCheckpointRef.current = null;
      setWorldLayers([]);
      setActiveStop(null);
      setMapChapter(chapterForStop(finishedStopId)?.index || 1);
      setJourneyMode({ kind: "journey", targets: null });
      setView(VIEW.MAP);
      notifyMissionTaskDone(progressScopeKey, "quest");
      logStudentActivity("phonics_quest", finishedStopId, "review_complete", {
        stars,
        answers: Number(tally.total) || 0,
        correct: Number(tally.correct) || 0,
        activeMs: next.telemetry?.sessions?.at(-1)?.activeMs || 0
      });
      return;
    }

    const before = new Set(previous.stones);
    const completedBefore = previous.trail.stopsDone.includes(finishedStopId);
    const recorded = recordStopResult(previous, finishedStopId, stars, tally.drops || 0);
    const sparkGain = Math.max(0, availableSparks(recorded) - availableSparks(previous));
    const next = commit(recordQuestTelemetryStop(recorded, finishedStopId));
    const finishedStop = getStop(finishedStopId);
    const journeyComplete = QUEST_STOPS.every(stop => next.trail?.stopsDone?.includes(stop.id));
    const nextStop = journeyComplete ? null : nextStopAfter(next);
    const newStones = next.stones.filter(g => !before.has(g) && isMastered(next.mastery, g));
    const gearReward = earnedGearReward(next, finishedStopId);
    const gear = gearReward?.equipped ? gearReward.id : null;
    const chapterReward = completedBefore ? null : chapterRewardForStop(finishedStopId);

    latestCheckpointRef.current = null;
    const reward = {
      id: `${finishedStopId}-${Date.now()}`,
      stop: finishedStop,
      nextStop,
      stars,
      newStones,
      gear,
      chapterReward,
      drops: Number(tally.drops) || 0,
      sparkGain,
      seedwake: seedwakeStopSpec(finishedStopId)
    };
    if (chapterReward) {
      const ended = commit(endQuestSession(next, { reason: "chapter_complete" }));
      setActiveStop(finishedStopId);
      setWorldLayers(layers => layers
        .filter(layer => layer.stopId === finishedStopId)
        .map(layer => ({ ...layer, status: "active", ready: true, anticipatedFrom: null })));
      setCeremony({ ...reward, state: ended });
      setCeremonyOverlayVisible(Boolean(ended.settings?.reducedMotion || use2d));
      setView(VIEW.CEREMONY);
    } else if (nextStop?.id) {
      setTrailNotice(reward);
      if (useSimpleWorld) {
        setActiveStop(nextStop.id);
        setWorldLayers([{ stopId: nextStop.id, status: "active", ready: true, anticipatedFrom: null }]);
      } else {
        setActiveStop(nextStop.id);
        setWorldLayers(layers => finishJourneyLayer(layers, finishedStopId, nextStop.id));
      }
      setView(VIEW.WORLD);
    } else {
      commit(endQuestSession(next, { reason: "trail_complete" }));
      setActiveStop(null);
      setWorldLayers([]);
      setView(VIEW.DEN);
    }
    notifyMissionTaskDone(progressScopeKey, "quest");
    logStudentActivity("phonics_quest", finishedStopId, "stop_complete", {
      stars,
      drops: Number(tally.drops) || 0,
      answers: Number(tally.total) || 0,
      correct: Number(tally.correct) || 0,
      chapterReward: chapterReward?.id || null
    });
  }, [commit, journeyMode.kind, progressScopeKey, use2d, useSimpleWorld]);

  const quitWorld = useCallback(() => {
    // Leaving the land keeps its position and completed requests.
    try { hushCue(); } catch { /* audio cleanup must never block navigation */ }
    const next = endQuestSession(stateRef.current, { reason: "return_to_den" });
    if (next !== stateRef.current) commit(next);
    setWorldLayers([]);
    setActiveStop(null);
    setJourneyMode({ kind: "journey", targets: null });
    setView(VIEW.DEN);
  }, [commit]);

  const enterWorld = useCallback((nextState, options = {}) => {
    const checkpointStop = nextState?.checkpoint?.stopId;
    const requestedStop = options.stopId;
    const id = getStop(requestedStop)
      ? requestedStop
      : getStop(checkpointStop)
        ? checkpointStop
        : nextAdventureId(nextState);
    if (!id) return;
    const kind = options.mode === "review" ? "review" : "journey";
    const started = beginQuestSession(nextState, {
      mode: kind,
      qualityTier: activeQuality.id,
      stopId: id,
      source: options.source || null
    });
    commit(started);
    setJourneyMode({
      kind,
      targets: options.targets || null,
      title: options.title || null,
      source: options.source || null
    });
    setCeremony(null);
    setCeremonyOverlayVisible(false);
    setForce2d(false);
    setRuntimeQualityId(null);
    setActiveStop(id);
    setWorldLayers([{ stopId: id, status: "active", ready: false, anticipatedFrom: null }]);
    setView(VIEW.WORLD);
    logStudentActivity("phonics_quest", id, "session_start", {
      mode: kind,
      source: options.source || null,
      qualityTier: activeQuality.id
    });
  }, [activeQuality.id, commit]);

  const openMap = useCallback(() => {
    const next = nextStopAfter(stateRef.current);
    setMapChapter(chapterForStop(next)?.index || 1);
    setView(VIEW.MAP);
  }, []);

  const enterReview = useCallback(() => {
    const plan = freeRoamReviewPlan(stateRef.current);
    setMapChapter(chapterForStop(plan.stopId)?.index || 1);
    enterWorld(stateRef.current, { stopId: plan.stopId, mode: "review", targets: plan.targets });
  }, [enterWorld]);

  const enterShortcut = useCallback(chapterId => {
    const plan = chapterShortcutReviewPlan(stateRef.current, chapterId);
    if (!plan) return;
    setMapChapter(chapterForStop(plan.stopId)?.index || 1);
    enterWorld(stateRef.current, {
      stopId: plan.stopId,
      mode: "review",
      targets: plan.targets,
      title: plan.title,
      source: plan.source
    });
  }, [enterWorld]);

  const continueAfterCeremony = useCallback(() => {
    const nextStop = ceremony?.nextStop;
    const completedStopId = ceremony?.stop?.id || ceremony?.stop;
    const destinationChapter = chapterForStop(nextStop?.id || nextStop)
      || chapterForStop(completedStopId);
    setWorldLayers([]);
    setActiveStop(null);
    setCeremony(null);
    setCeremonyOverlayVisible(false);
    setMapChapter(destinationChapter?.index || 1);
    setView(VIEW.MAP);
  }, [ceremony]);

  const visitTradingPostAfterCeremony = useCallback(() => {
    setWorldLayers([]);
    setActiveStop(null);
    setCeremony(null);
    setCeremonyOverlayVisible(false);
    setView(VIEW.POST);
  }, []);

  const updateDisplayMode = useCallback(displayMode => {
    const current = stateRef.current;
    commit({ ...current, settings: { ...current.settings, displayMode } });
    setForce2d(false);
    setRuntimeQualityId(null);
  }, [commit]);

  const updateAccessibilitySetting = useCallback((key, value) => {
    const current = stateRef.current;
    commit({ ...current, settings: { ...current.settings, [key]: Boolean(value) } });
    setForce2d(false);
    setRuntimeQualityId(null);
  }, [commit]);

  const closeQuest = useCallback(() => {
    const checkpointed = latestCheckpointRef.current
      ? saveQuestCheckpoint(stateRef.current, latestCheckpointRef.current)
      : stateRef.current;
    const current = endQuestSession(checkpointed, { reason: "app_exit" });
    stateRef.current = current;
    saveQuestProgress(progressScopeKey, current);
    logStudentActivity("phonics_quest", activeStop, "session_end", { reason: "app_exit" });
    onExit?.();
  }, [activeStop, onExit, progressScopeKey]);

  return createPortal(
    <div
      className="q-root"
      data-fullbleed=""
      data-high-contrast={state.settings?.highContrast ? "true" : undefined}
    >
      {/* ONE exit per screen. The Den (and the hatch screen) own "Close" —
          leaving the whole mode is a Den decision. Everywhere else the only
          way out is "Back to the Den", so a child is never shown two doors
          marked leave and asked to know the difference. */}
      {[VIEW.DEN, VIEW.CREATOR].includes(view) && (
        <button type="button" className="q-exit" onClick={closeQuest} aria-label="Close Sound Seekers">Close</button>
      )}

      {view === VIEW.CREATOR && (
        <CreatureCreator
          creature={state.creature}
          owned={owned}
          hatched={state.hatched}
          isSoundEnabled={isSoundEnabled}
          onChange={creature => commit({ ...state, creature })}
          onDone={() => { commit({ ...state, hatched: true }); setView(VIEW.DEN); }}
        />
      )}

      {view === VIEW.DEN && (
        <DenScreen
          state={state}
          displayMode={state.settings?.displayMode || "auto"}
          reducedMotion={Boolean(state.settings?.reducedMotion)}
          highContrast={Boolean(state.settings?.highContrast)}
          quietSoundscape={Boolean(state.settings?.quietSoundscape)}
          onDisplayMode={updateDisplayMode}
          onReducedMotion={value => updateAccessibilitySetting("reducedMotion", value)}
          onHighContrast={value => updateAccessibilitySetting("highContrast", value)}
          onQuietSoundscape={value => updateAccessibilitySetting("quietSoundscape", value)}
          onWalk={openMap}
          onReview={enterReview}
          onEditCreature={() => setView(VIEW.CREATOR)}
          onTradingPost={() => setView(VIEW.POST)}
        />
      )}

      {view === VIEW.MAP && (
        <TrailMap
          state={state}
          act={mapChapter}
          onAct={setMapChapter}
          onEnterStop={stopId => enterWorld(stateRef.current, { stopId })}
          onFreeRoam={enterReview}
          onShortcut={enterShortcut}
          onBack={() => setView(VIEW.DEN)}
          isSoundEnabled={isSoundEnabled}
        />
      )}

      {view === VIEW.POST && (
        <TradingPost
          state={state}
          isSoundEnabled={isSoundEnabled}
          onBuy={next => commit(next)}
          onBack={() => setView(VIEW.DEN)}
        />
      )}

      {[VIEW.WORLD, VIEW.CEREMONY].includes(view) && worldLayers.length > 0 && (
        <div className="q-journey-stack">
          {worldLayers.map(layer => {
            const interactive = view === VIEW.WORLD && layer.status === "active";
            const layerState = layer.anticipatedFrom
              ? anticipatedJourneyState(state, layer.anticipatedFrom)
              : state;
            const layerResume = interactive && state.checkpoint?.stopId === layer.stopId
              ? state.checkpoint
              : null;
            const sharedProps = {
              stopId: layer.stopId,
              state: layerState,
              resume: layerResume,
              isSoundEnabled,
              isInteractive: interactive,
              journeyStatus: layer.status,
              mode: journeyMode.kind,
              routeLabel: journeyMode.title,
              targetsOverride: journeyMode.targets,
              onAnswer: (target, correct, shell) => handleAnswer(layer.stopId, target, correct, shell),
              onInteraction: interactive ? event => handleInteraction(layer.stopId, event) : undefined,
              onCheckpoint: interactive ? handleCheckpoint : undefined,
              onFinish: interactive ? (stars, tally) => handleFinish(layer.stopId, stars, tally) : undefined,
              onQuit: interactive ? quitWorld : undefined,
              onAudioState: layer.status === "active" ? setMusicState : undefined
            };
            return (
              <div
                key={layer.stopId}
                className={`q-journey-layer is-${layer.status}`}
                aria-hidden={!interactive}
                inert={!interactive ? true : undefined}
                data-stop={layer.stopId}
              >
                {use2d ? (
                  <QuestTrail2D {...sharedProps} />
                ) : usePixel ? (
                  <Suspense fallback={<div className="q-screen qp-root"><div className="qp-loading" role="status">Opening the trail…</div></div>}>
                    <QuestPixelWorld
                      {...sharedProps}
                      ceremony={view === VIEW.CEREMONY && layer.status === "active"}
                      onSceneReady={() => handleLayerReady(layer.stopId)}
                      onRuntimeSignal={handleRuntimeSignal}
                      onSceneError={reason => handleRuntimeSignal({
                        type: "renderer-error",
                        fromTier: "pixel",
                        toTier: "2d",
                        stopId: layer.stopId,
                        reason
                      })}
                    />
                  </Suspense>
                ) : (
                  <Suspense fallback={<div className="q-screen qp-root"><div className="qp-loading" role="status">Opening the 3D trail…</div></div>}>
                    <QuestHub
                      {...sharedProps}
                      qualityTier={activeQuality}
                      ceremony={view === VIEW.CEREMONY && layer.status === "active"}
                      onPrepareNext={interactive ? prepareNextLayer : undefined}
                      onSceneReady={() => handleLayerReady(layer.stopId)}
                      onSceneError={reason => handleRuntimeSignal({
                        type: "renderer-error",
                        fromTier: activeQuality.id,
                        toTier: "2d",
                        stopId: layer.stopId,
                        reason
                      })}
                      onRuntimeSignal={handleRuntimeSignal}
                    />
                  </Suspense>
                )}
              </div>
            );
          })}
        </div>
      )}

      {view === VIEW.WORLD && trailNotice && (
        <aside className="q-trail-notice" aria-live="polite" aria-label="Trail progress">
          <span>{trailNotice.stop?.name || "Trail"} complete</span>
          <strong>{trailNotice.seedwake?.success || trailNotice.chapterReward?.label || (trailNotice.nextStop ? `${trailNotice.nextStop.name} ahead` : "The whole trail is open")}</strong>
          <em>{trailNotice.stars} {trailNotice.stars === 1 ? "star" : "stars"} · {trailNotice.drops} {trailNotice.drops === 1 ? (trailNotice.seedwake?.collectible.label || "find") : (trailNotice.seedwake?.collectible.plural || "finds")}{trailNotice.sparkGain ? ` · +${trailNotice.sparkGain} Sparks` : ""}{trailNotice.gear ? " · new gear" : ""}</em>
          {trailNotice.chapterReward && <em>{trailNotice.chapterReward.abilityLabel}</em>}
        </aside>
      )}

      {view === VIEW.WORLD && runtimeNotice && (
        <aside className="q-runtime-notice" role="status">{runtimeNotice}</aside>
      )}

      {view === VIEW.CEREMONY && ceremony && ceremonyOverlayVisible && (
        <RewardScreen
          key={ceremony.id}
          stop={ceremony.stop}
          nextStop={ceremony.nextStop}
          stars={ceremony.stars}
          newStones={ceremony.newStones}
          gear={ceremony.gear}
          chapterReward={ceremony.chapterReward}
          sparkGain={ceremony.sparkGain}
          state={ceremony.state || state}
          isSoundEnabled={isSoundEnabled}
          overlay
          onContinue={continueAfterCeremony}
          onTradingPost={visitTradingPostAfterCeremony}
        />
      )}
    </div>,
    document.body
  );
}

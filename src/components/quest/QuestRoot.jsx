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

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ErrorBoundary } from "../ErrorBoundary.jsx";
import CreatureCreator from "./CreatureCreator.jsx";
import QuestSettingsDialog from "./QuestSettingsDialog.jsx";
import { MusicToggle } from "../audio/MusicToggle.jsx";
import RewardScreen from "./RewardScreen.jsx";
import TrailMap from "./TrailMap.jsx";
import QuestTrail2D from "./world/QuestTrail2D.jsx";
import BookCharacterAvatar from "./BookCharacterAvatar.jsx";
import TradingPost from "./TradingPost.jsx";
import {
  loadQuestProgress,
  questProgressStorageKey,
  saveQuestProgress
} from "../../utils/questStore.js";
import { QUEST_STORAGE_STATUS_EVENT } from "../../utils/questStorageRecovery.js";
import { lazyWithRetry } from "../../utils/lazyWithRetry.js";
import { computeHydratedValue } from "../../utils/progressMerge.js";
import {
  recordQuestAttempt,
  recordStopResult,
  earnedGearReward,
  saveQuestCheckpoint,
  ownedPieces,
  chapterRewardForStop,
  availableSparks,
  restartQuestProgress
} from "../../utils/questProgress.js";
import { isMastered } from "../../utils/questMastery.js";
import { getStop, QUEST_STOPS } from "../../data/questSequence.js";
import { CREATURE_GEAR, defaultCreature } from "../../data/creatureParts.js";
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
  closeFullscreenSurfaceName,
  questFullscreenSurfaceName
} from "../../utils/fullscreenOverlayNames.js";
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
import {
  learnerAccessibilityFromProfile,
  normalizeLearnerAccessibilitySettings
} from "../../accessibility/learnerAccessibility.js";
import { loadStudentProfile } from "../../utils/studentProfile.js";
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

const QuestPixelWorld = lazyWithRetry(
  () => import("./world/QuestPixelWorld.jsx"),
  { reloadOnFailure: false }
);
const QuestHub = lazyWithRetry(
  () => import("./world/QuestHub.jsx"),
  { reloadOnFailure: false }
);

const ANSWER_SAVE_DELAY_MS = 400;
const TELEMETRY_SAVE_DELAY_MS = 15000;

function QuestWorldErrorFallback({ error, onRecover }) {
  const recoveredRef = useRef(false);
  const reason = String(error?.message || error || "world-render-failed");
  useEffect(() => {
    if (recoveredRef.current) return;
    recoveredRef.current = true;
    onRecover(reason);
  }, [onRecover, reason]);
  return (
    <div className="q-screen qp-root">
      <div className="qp-loading" role="status">Switching to the calm trail…</div>
    </div>
  );
}

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
  isSoundEnabled: isSoundEnabledProp = true,
  onExit,
  initialView = null,
  initialStop = null,
  accessibilitySettings: accessibilitySettingsProp = null,
  disableAdaptiveQuality = false,
  previewForce2d = false,
  previewForceLegacy3d = false
}) {
  const learnerAccessibility = useMemo(
    () => accessibilitySettingsProp
      ? normalizeLearnerAccessibilitySettings(accessibilitySettingsProp)
      : learnerAccessibilityFromProfile(loadStudentProfile(progressScopeKey)),
    [accessibilitySettingsProp, progressScopeKey]
  );
  const [state, setState] = useState(() => loadQuestProgress(progressScopeKey));
  const previewState = initialView === VIEW.CEREMONY ? state : null;
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
  const [view, setView] = useState(
    () => initialView === VIEW.DEN
      ? VIEW.MAP
      : initialView || (state.hatched ? VIEW.MAP : VIEW.CREATOR)
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsTriggerRef = useRef(null);
  const [activeStop, setActiveStop] = useState(() => (
    [VIEW.WORLD, VIEW.CEREMONY].includes(initialView) ? initialStop : null
  ));
  const [worldLayers, setWorldLayers] = useState(() => (
    [VIEW.WORLD, VIEW.CEREMONY].includes(initialView) && initialStop
      ? [{ stopId: initialStop, status: "active", ready: false, anticipatedFrom: null }]
      : []
  ));
  const [trailNotice, setTrailNotice] = useState(null);
  const [trailCheer, setTrailCheer] = useState(null);
  const [mapChapter, setMapChapter] = useState(() => chapterForStop(initialStop)?.index || 1);
  const [journeyMode, setJourneyMode] = useState({ kind: "journey", targets: null });
  const [ceremony, setCeremony] = useState(previewCeremony);
  const [ceremonyOverlayVisible, setCeremonyOverlayVisible] = useState(() => (
    Boolean(previewCeremony && (
      previewState?.settings?.reducedMotion || learnerAccessibility.reducedEffects
    ))
  ));
  const [force2d, setForce2d] = useState(false);
  const [runtimeQualityId, setRuntimeQualityId] = useState(null);
  const [runtimeNotice, setRuntimeNotice] = useState(null);
  const [storageNotice, setStorageNotice] = useState(null);
  const [musicState, setMusicState] = useState("travel");
  const stateRef = useRef(state);
  const latestCheckpointRef = useRef(state.checkpoint);
  const pendingSaveRef = useRef(null);
  const saveTimerRef = useRef(0);
  const saveDeadlineRef = useRef(0);
  const unmountGenerationRef = useRef(0);
  const journeyTransitionTimerRef = useRef(0);
  const portalRef = useRef(null);
  const previousViewRef = useRef(view);
  const effectiveQuestSettings = useMemo(() => ({
    ...state.settings,
    reducedMotion: Boolean(state.settings?.reducedMotion || learnerAccessibility.reducedEffects)
  }), [learnerAccessibility.reducedEffects, state.settings]);
  const quality = useMemo(() => detectQuestQuality(effectiveQuestSettings), [effectiveQuestSettings]);
  const runtimeQuality = runtimeQualityId && QUEST_QUALITY_TIERS[runtimeQualityId]
    ? QUEST_QUALITY_TIERS[runtimeQualityId]
    : quality;
  // These preview overrides belong to the authenticated-free QA harness only.
  // Retired child settings still migrate to Automatic. Accessibility/offline
  // checks can exercise the complete DOM fallback, while the legacy camera
  // diagnostic can explicitly mount QuestHub without exposing or persisting a
  // 3D choice in the Den. A real runtime failure always wins and falls to 2D.
  const activeQuality = force2d || previewForce2d
    ? QUEST_QUALITY_TIERS["2d"]
    : previewForceLegacy3d ? QUEST_QUALITY_TIERS.low : runtimeQuality;
  const use2d = activeQuality.id === "2d";
  const usePixel = activeQuality.id === "pixel";
  const useSimpleWorld = use2d || usePixel;
  const activeQuestSurfaceName = questFullscreenSurfaceName({
    view,
    hatched: state.hatched,
    activeStopName: getStop(activeStop)?.name
  });
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
  // Spoken teaching audio and background music are independent. The host prop
  // remains an all-audio QA kill switch; the two child settings are otherwise
  // free to differ.
  const isSoundEnabled = isSoundEnabledProp && state.settings?.soundEnabled !== false;
  const isMusicEnabled = isSoundEnabledProp && state.settings?.musicEnabled !== false;
  const ceremonyWorldReady = worldLayers.some(layer => layer.status === "active" && layer.ready);

  useEffect(() => {
    if (view !== VIEW.CEREMONY || !ceremony || ceremonyOverlayVisible) return undefined;
    if (!use2d && !ceremonyWorldReady) return undefined;
    const timer = window.setTimeout(() => setCeremonyOverlayVisible(true), 1150);
    return () => window.clearTimeout(timer);
  }, [ceremony, ceremonyOverlayVisible, ceremonyWorldReady, use2d, view]);

  // World renderers move focus to each new task themselves. The non-world
  // screens still need an explicit hand-off when React swaps Den/Map/Post/
  // Creator in place; otherwise keyboard and screen-reader focus remains on a
  // button that no longer exists. Focus the new screen's heading after commit.
  useEffect(() => {
    const previous = previousViewRef.current;
    previousViewRef.current = view;
    if (previous === view || [VIEW.WORLD, VIEW.CEREMONY].includes(view)) return undefined;
    const frame = window.requestAnimationFrame(() => {
      const heading = portalRef.current?.querySelector(".q-screen h1");
      if (!(heading instanceof HTMLElement)) return;
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [view]);

  const flushPendingSave = useCallback(() => {
    window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = 0;
    saveDeadlineRef.current = 0;
    const pending = pendingSaveRef.current;
    pendingSaveRef.current = null;
    if (pending) saveQuestProgress(progressScopeKey, pending.state, { syncCloud: pending.syncCloud });
  }, [progressScopeKey]);

  const scheduleSave = useCallback((next, delayMs = 0, { syncCloud = true } = {}) => {
    pendingSaveRef.current = {
      state: next,
      // A later telemetry sample may replace the pending state snapshot, but
      // it must not downgrade an already-pending answer/checkpoint cloud save.
      syncCloud: Boolean(syncCloud || pendingSaveRef.current?.syncCloud)
    };
    if (!(delayMs > 0)) {
      flushPendingSave();
      return;
    }
    const deadline = Date.now() + delayMs;
    if (saveTimerRef.current && saveDeadlineRef.current <= deadline) return;
    window.clearTimeout(saveTimerRef.current);
    saveDeadlineRef.current = deadline;
    saveTimerRef.current = window.setTimeout(flushPendingSave, delayMs);
  }, [flushPendingSave]);

  useEffect(() => () => flushPendingSave(), [flushPendingSave]);

  // One writer. Every state change is computed synchronously from stateRef and
  // reaches React through this function, so a queued replacement cannot clobber
  // a pending functional updater. Low-value runtime samples share a bounded
  // persistence cadence; completions and navigation still flush immediately.
  const commit = useCallback((update, { persistDelayMs = 0, syncCloud = true } = {}) => {
    const next = typeof update === "function" ? update(stateRef.current) : update;
    if (!next || next === stateRef.current) return stateRef.current;
    stateRef.current = next;
    latestCheckpointRef.current = next.checkpoint;
    setState(next);
    scheduleSave(next, persistDelayMs, { syncCloud });
    return next;
  }, [scheduleSave]);

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
        setView(current => (current === VIEW.CREATOR ? VIEW.MAP : current));
      }
    }
    window.addEventListener("lp-progress-hydrated", handleHydrated);
    return () => window.removeEventListener("lp-progress-hydrated", handleHydrated);
  }, [commit, progressScopeKey]);

  // Open tabs reconcile through the same forward-only merge as cloud hydrate.
  // A tab that receives an already-merged value does nothing, which prevents a
  // storage-event echo loop while preserving checkpoints owned by this tab.
  useEffect(() => {
    const key = questProgressStorageKey(progressScopeKey);
    function handleExternalSave(event) {
      if (event.storageArea !== window.localStorage || event.key !== key || !event.newValue) return;
      const current = stateRef.current;
      const stored = loadQuestProgress(progressScopeKey);
      const merged = computeHydratedValue("phonics_quest", "__all__", current, stored);
      if (JSON.stringify(merged) === JSON.stringify(current)) return;
      commit(merged);
    }
    window.addEventListener("storage", handleExternalSave);
    return () => window.removeEventListener("storage", handleExternalSave);
  }, [commit, progressScopeKey]);

  useEffect(() => {
    function handleStorageStatus(event) {
      const detail = event.detail || {};
      if (detail.scopeKey !== progressScopeKey) return;
      if (detail.status === "recovered") {
        setRuntimeNotice("Storage was full. Older diagnostics were cleared and your trail is saving again.");
      } else {
        setStorageNotice("Progress may not be saving on this device. Ask a grown-up for help before closing.");
      }
    }
    window.addEventListener(QUEST_STORAGE_STATUS_EVENT, handleStorageStatus);
    return () => window.removeEventListener(QUEST_STORAGE_STATUS_EVENT, handleStorageStatus);
  }, [progressScopeKey]);

  // A child whose OS asks for MORE contrast gets it on first run without
  // finding a toggle - the Den setting remains the override thereafter
  // (settingsAt empty = the family has never touched quest settings).
  useEffect(() => {
    const current = stateRef.current;
    if (current.settingsAt || current.settings?.highContrast) return;
    if (window.matchMedia?.("(prefers-contrast: more)")?.matches) {
      commit({
        ...current,
        settings: { ...current.settings, highContrast: true },
        settingsAt: new Date().toISOString()
      });
    }
  }, [commit]);

  // Belt-and-braces against zombie telemetry and an unsaved final checkpoint.
  // React StrictMode rehearses every effect as setup -> cleanup -> setup. A
  // synchronous cleanup used to end the child's brand-new session during that
  // rehearsal. Defer to a microtask and cancel by generation when the effect is
  // immediately re-established; a real route unmount still saves in the same
  // browser task, before a timer could be discarded by navigation.
  useEffect(() => {
    const generation = unmountGenerationRef.current + 1;
    unmountGenerationRef.current = generation;
    return () => {
      queueMicrotask(() => {
        if (unmountGenerationRef.current !== generation) return;
        const checkpointed = latestCheckpointRef.current
          ? saveQuestCheckpoint(stateRef.current, latestCheckpointRef.current)
          : stateRef.current;
        const ended = endQuestSession(checkpointed, { reason: "unmount" });
        stateRef.current = ended;
        saveQuestProgress(progressScopeKey, ended);
      });
    };
  }, [progressScopeKey]);

  useEffect(() => {
    const recordConnectionEvent = event => {
      const current = stateRef.current;
      const recorded = recordQuestRuntimeEvent(current, event);
      if (recorded !== current) commit(recorded, { syncCloud: false });
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
      if (recorded !== current) commit(recorded, {
        persistDelayMs: TELEMETRY_SAVE_DELAY_MS,
        syncCloud: false
      });
    };
    const handleOfflineEvidence = event => recordOfflineEvidence(event.detail);
    for (const detail of offlineShellHistory()) recordOfflineEvidence(detail);
    window.addEventListener(OFFLINE_EVENT, handleOfflineEvidence);
    return () => window.removeEventListener(OFFLINE_EVENT, handleOfflineEvidence);
  }, [commit]);

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
      if (next !== current) commit(next, {
        persistDelayMs: TELEMETRY_SAVE_DELAY_MS,
        syncCloud: false
      });
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
    if (isMusicEnabled) startGameMusic(musicTrack, { fallbackWorldId: musicFallback, mode: musicMode });
    else stopGameMusic();
  }, [isMusicEnabled, musicFallback, musicMode, musicTrack]);

  useEffect(() => {
    if (isMusicEnabled && musicChapter?.id) {
      startGameAmbience(musicChapter.id, {
        mode: musicMode
      });
    } else stopGameAmbience();
  }, [isMusicEnabled, musicChapter?.id, musicMode]);

  useEffect(() => {
    if (!import.meta.env.PROD || ![VIEW.MAP, VIEW.WORLD, VIEW.CEREMONY].includes(view)) return undefined;
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
    const timer = window.setTimeout(() => setTrailNotice(null), 6000);
    return () => window.clearTimeout(timer);
  }, [trailNotice]);

  useEffect(() => {
    if (!trailCheer) return undefined;
    const timer = window.setTimeout(() => setTrailCheer(null), 2600);
    return () => window.clearTimeout(timer);
  }, [trailCheer]);

  useEffect(() => {
    if (!runtimeNotice) return undefined;
    const timer = window.setTimeout(() => setRuntimeNotice(null), 4200);
    return () => window.clearTimeout(timer);
  }, [runtimeNotice]);

  const owned = useMemo(() => ownedPieces(state), [state]);

  const handleAnswer = useCallback((stopId, target, correct, shell, meta = {}) => {
    // stopIndex is not decoration: it is what the review scheduler measures
    // "how long since the child last saw this sound" from.
    const stopIndex = getStop(stopId)?.index || 0;
    const promptLevel = Number(meta?.promptLevel) || 0;
    const reason = typeof meta?.reason === "string" ? meta.reason : "";
    commit(prev => {
      const attempted = meta?.recordsMastery === false
        ? prev
        : recordQuestAttempt(prev, { target, correct, shell, stopIndex, promptLevel, reason });
      return recordQuestTelemetryAnswer(attempted, correct);
    }, { persistDelayMs: ANSWER_SAVE_DELAY_MS });
    logStudentActivity("phonics_quest", stopId, "answer", { target, correct, shell, promptLevel, reason });
  }, [commit]);

  const handleCheckpoint = useCallback(cp => {
    latestCheckpointRef.current = cp;
    commit(prev => saveQuestCheckpoint(prev, cp), { persistDelayMs: ANSWER_SAVE_DELAY_MS });
  }, [commit]);

  const handleInteraction = useCallback((stopId, event) => {
    if (!event?.type) return;
    commit(prev => recordQuestInteractionEvent(prev, event), {
      persistDelayMs: TELEMETRY_SAVE_DELAY_MS,
      syncCloud: false
    });
    if (["motor-retry", "teach-back"].includes(event.type)) {
      logStudentActivity("phonics_quest", stopId, "interaction_support", {
        type: event.type,
        mechanic: event.mechanic || null
      });
    }
  }, [commit]);

  const handleLayerReady = useCallback(stopId => {
    setWorldLayers(layers => markJourneyLayerReady(layers, stopId));
  }, []);

  const handleRuntimeSignal = useCallback(signal => {
    if (!signal?.type) return;
    if (disableAdaptiveQuality && ["frame-window", "quality-change"].includes(signal.type)) return;
    const current = stateRef.current;
    const recorded = recordQuestRuntimeEvent(current, signal);
    if (recorded !== current) commit(recorded, {
      persistDelayMs: TELEMETRY_SAVE_DELAY_MS,
      syncCloud: false
    });

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
      setCeremonyOverlayVisible(Boolean(
        ended.settings?.reducedMotion || learnerAccessibility.reducedEffects || use2d
      ));
      setView(VIEW.CEREMONY);
    } else if (nextStop?.id) {
      setTrailNotice(reward);
      // The per-stop reward MOMENT: a 2.6s creature-and-stars beat, not just
      // an auto-dismissing toast in a corner. Reduced motion keeps the calm
      // toast only.
      if (!next.settings?.reducedMotion && !learnerAccessibility.reducedEffects) {
        setTrailCheer(reward);
      }
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
      setView(VIEW.MAP);
    }
    notifyMissionTaskDone(progressScopeKey, "quest");
    logStudentActivity("phonics_quest", finishedStopId, "stop_complete", {
      stars,
      drops: Number(tally.drops) || 0,
      answers: Number(tally.total) || 0,
      correct: Number(tally.correct) || 0,
      chapterReward: chapterReward?.id || null
    });
  }, [
    commit,
    journeyMode.kind,
    learnerAccessibility.reducedEffects,
    progressScopeKey,
    use2d,
    useSimpleWorld
  ]);

  const quitWorld = useCallback(() => {
    // Leaving the land keeps its position and completed requests.
    try { hushCue(); } catch { /* audio cleanup must never block navigation */ }
    const next = endQuestSession(stateRef.current, { reason: "return_to_map" });
    if (next !== stateRef.current) commit(next);
    setWorldLayers([]);
    setActiveStop(null);
    setJourneyMode({ kind: "journey", targets: null });
    setView(VIEW.MAP);
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
    setCeremony(null);
    setCeremonyOverlayVisible(false);
    // "Continue the trail" CONTINUES THE TRAIL: straight into the next stop.
    // The map is the fallback only when the whole journey is complete.
    if (nextStop?.id) {
      setWorldLayers([]);
      setActiveStop(null);
      enterWorld(stateRef.current, { stopId: nextStop.id, source: "ceremony" });
      return;
    }
    setWorldLayers([]);
    setActiveStop(null);
    setMapChapter(destinationChapter?.index || 1);
    setView(VIEW.MAP);
  }, [ceremony, enterWorld]);

  const visitTradingPostAfterCeremony = useCallback(() => {
    setWorldLayers([]);
    setActiveStop(null);
    setCeremony(null);
    setCeremonyOverlayVisible(false);
    setView(VIEW.POST);
  }, []);

  const updateQuestSetting = useCallback((key, value) => {
    const current = stateRef.current;
    commit({
      ...current,
      settings: { ...current.settings, [key]: Boolean(value) },
      settingsAt: new Date().toISOString()
    });
    setForce2d(false);
    setRuntimeQualityId(null);
  }, [commit]);

  const resetCharacter = useCallback(() => {
    const current = stateRef.current;
    commit({
      ...current,
      creature: defaultCreature(),
      // This is a character edit, not a new journey. Keeping the hatched flag
      // means Done returns a returning child to the map instead of launching
      // the first trail again; their learning and trail progress stay intact.
      hatched: true,
      creatureAt: new Date().toISOString()
    });
    setSettingsOpen(false);
    setView(VIEW.CREATOR);
  }, [commit]);

  const resetProgress = useCallback(() => {
    const current = stateRef.current;
    const at = new Date().toISOString();
    const resetId = globalThis.crypto?.randomUUID?.()
      || `reset-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const fresh = restartQuestProgress(current, { at, resetId });
    latestCheckpointRef.current = null;
    setCeremony(null);
    setCeremonyOverlayVisible(false);
    setWorldLayers([]);
    setActiveStop(null);
    setTrailNotice(null);
    setJourneyMode({ kind: "journey", targets: null });
    commit(fresh);
    logStudentActivity("phonics_quest", null, "reset_progress", {});
    setSettingsOpen(false);
    setView(VIEW.CREATOR);
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
      ref={portalRef}
      className="q-root"
      data-fullbleed=""
      data-view={view}
      data-surface-name={activeQuestSurfaceName}
      data-child-surface="sound-seekers"
      data-high-contrast={state.settings?.highContrast ? "true" : undefined}
      role="dialog"
      aria-modal="true"
      aria-label={activeQuestSurfaceName}
    >
      {/* The creator owns a single global Close control. The playable map puts
          its one Close action in the map header, beside its other navigation. */}
      {view === VIEW.CREATOR && (
        <button
          type="button"
          className="q-exit"
          onClick={closeQuest}
          aria-label={closeFullscreenSurfaceName(activeQuestSurfaceName)}
        >
          Close
        </button>
      )}

      {view === VIEW.CREATOR && (
        <MusicToggle
          className="q-ghost q-surface-music-toggle q-creator-music-toggle"
          enabled={isMusicEnabled}
          onToggle={() => updateQuestSetting("musicEnabled", !isMusicEnabled)}
        />
      )}

      {view === VIEW.CREATOR && (
        <CreatureCreator
          creature={state.creature}
          owned={owned}
          sparkBalance={availableSparks(state)}
          hatched={state.hatched}
          isSoundEnabled={isSoundEnabled}
          onChange={creature => commit({ ...state, creature, creatureAt: new Date().toISOString() })}
          onDone={() => {
            const wasAlreadyHatched = Boolean(state.hatched);
            const hatched = commit({ ...state, hatched: true, creatureAt: new Date().toISOString() });
            // FIRST-RUN EXPRESS: a brand-new child goes from choosing a book
            // friend straight into level 1. Returning from play opens the one
            // real chapter map, never an intermediate room.
            if (!wasAlreadyHatched) enterWorld(hatched, { source: "first-run" });
            else setView(VIEW.MAP);
          }}
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
          onBack={closeQuest}
          onEditCharacter={() => setView(VIEW.CREATOR)}
          onTradingPost={() => setView(VIEW.POST)}
          onSettings={() => setSettingsOpen(true)}
          settingsTriggerRef={settingsTriggerRef}
          isSoundEnabled={isSoundEnabled}
          isMusicEnabled={isMusicEnabled}
          onMusicEnabledChange={value => updateQuestSetting("musicEnabled", value)}
        />
      )}

      {view === VIEW.POST && (
        <TradingPost
          state={state}
          isSoundEnabled={isSoundEnabled}
          isMusicEnabled={isMusicEnabled}
          onMusicEnabledChange={value => updateQuestSetting("musicEnabled", value)}
          onBuy={next => commit(next)}
          onBack={() => setView(VIEW.MAP)}
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
              isMusicEnabled,
              onMusicEnabledChange: value => updateQuestSetting("musicEnabled", value),
              extendedResponse: learnerAccessibility.extendedResponse,
              isInteractive: interactive,
              journeyStatus: layer.status,
              mode: journeyMode.kind,
              routeLabel: journeyMode.title,
              targetsOverride: journeyMode.targets,
              onAnswer: (target, correct, shell, meta) => handleAnswer(layer.stopId, target, correct, shell, meta),
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
                  <ErrorBoundary
                    resetKey={`pixel-${layer.stopId}-${activeQuality.id}`}
                    logLabel="Sound Seekers pixel world"
                    fallback={({ error }) => (
                      <QuestWorldErrorFallback error={error} onRecover={reason => handleRuntimeSignal({
                        type: "renderer-error",
                        fromTier: "pixel",
                        toTier: "2d",
                        stopId: layer.stopId,
                        reason
                      })} />
                    )}
                  >
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
                  </ErrorBoundary>
                ) : (
                  <ErrorBoundary
                    resetKey={`three-${layer.stopId}-${activeQuality.id}`}
                    logLabel="Sound Seekers 3D world"
                    fallback={({ error }) => (
                      <QuestWorldErrorFallback error={error} onRecover={reason => handleRuntimeSignal({
                        type: "renderer-error",
                        fromTier: activeQuality.id,
                        toTier: "2d",
                        stopId: layer.stopId,
                        reason
                      })} />
                    )}
                  >
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
                  </ErrorBoundary>
                )}
              </div>
            );
          })}
        </div>
      )}

      {view === VIEW.WORLD && trailCheer && (
        <div className="q-trail-cheer" role="status" onClick={() => setTrailCheer(null)}>
          <div className="q-trail-cheer-card">
            <BookCharacterAvatar creature={state.creature} pose="jump" size={92} decorative />
            <strong>{trailCheer.stop?.name || "Trail"} complete!</strong>
            <span className="q-trail-cheer-stars" aria-label={`${trailCheer.stars} stars`}>
              {[0, 1, 2].map(slot => (
                <em key={slot} className={slot < trailCheer.stars ? "is-lit" : ""}>&#9733;</em>
              ))}
            </span>
            {trailCheer.gear && <small>New gear for your character!</small>}
          </div>
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

      {runtimeNotice && (
        <aside className="q-runtime-notice" role="status">{runtimeNotice}</aside>
      )}

      {storageNotice && (
        <aside className="q-runtime-notice is-storage" role="alert">{storageNotice}</aside>
      )}

      <QuestSettingsDialog
        open={settingsOpen}
        triggerRef={settingsTriggerRef}
        settings={state.settings}
        onSettingChange={updateQuestSetting}
        onResetCharacter={resetCharacter}
        onResetProgress={resetProgress}
        onClose={() => setSettingsOpen(false)}
      />

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

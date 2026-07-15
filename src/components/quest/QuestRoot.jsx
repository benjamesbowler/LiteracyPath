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

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import CreatureCreator from "./CreatureCreator.jsx";
import DenScreen from "./DenScreen.jsx";
import RewardScreen from "./RewardScreen.jsx";
import TrailMap from "./TrailMap.jsx";
import QuestHub from "./world/QuestHub.jsx";
import QuestTrail2D from "./world/QuestTrail2D.jsx";
import TradingPost from "./TradingPost.jsx";
import { loadQuestProgress, saveQuestProgress } from "../../utils/questStore.js";
import {
  recordQuestAttempt,
  recordStopResult,
  earnedGearReward,
  saveQuestCheckpoint,
  ownedPieces,
  chapterRewardForStop
} from "../../utils/questProgress.js";
import { isMastered } from "../../utils/questMastery.js";
import { getStop, QUEST_STOPS } from "../../data/questSequence.js";
import { CREATURE_GEAR } from "../../data/creatureParts.js";
import { chapterForStop } from "../../data/questChapters.js";
import { seedwakeStopSpec } from "../../data/questChapterOne.js";
import { startGameMusic, stopGameMusic } from "../../utils/audio/gameMusic.js";
import { cancelGameSfx } from "../../utils/audio/gameSfx.js";
import { hushCue } from "./shells/shellContract.js";
import { notifyMissionTaskDone } from "../../utils/dailyMission.js";
import { logStudentActivity } from "../../utils/progressSync.js";
import {
  anticipatedJourneyState,
  finishJourneyLayer,
  markJourneyLayerReady,
  prepareJourneyLayer
} from "../../utils/questJourney.js";
import { detectQuestQuality, QUEST_QUALITY_TIERS } from "../../utils/questPerformance.js";
import { freeRoamReviewPlan } from "../../utils/questReviewMode.js";
import {
  addQuestActiveTime,
  beginQuestSession,
  endQuestSession,
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
  initialStop = null
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
  const [force2d, setForce2d] = useState(false);
  const stateRef = useRef(state);
  const latestCheckpointRef = useRef(state.checkpoint);
  const handoffTimerRef = useRef(0);
  const quality = useMemo(() => detectQuestQuality(state.settings), [state.settings]);
  const activeQuality = force2d ? QUEST_QUALITY_TIERS["2d"] : quality;
  const use2d = activeQuality.id === "2d";
  const musicWorld = [VIEW.WORLD, VIEW.CEREMONY].includes(view)
    ? chapterForStop(activeStop)?.worldKit || "meadow"
    : "meadow";

  // One writer. Every state change goes through here, so there is exactly one
  // place a save can go wrong.
  const commit = useCallback(next => {
    stateRef.current = next;
    latestCheckpointRef.current = next.checkpoint;
    setState(next);
    saveQuestProgress(progressScopeKey, next);
    return next;
  }, [progressScopeKey]);

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
    if (isSoundEnabled) startGameMusic(musicWorld, { fallbackWorldId: "meadow" });
    else stopGameMusic();
    return () => { stopGameMusic(); cancelGameSfx(); hushCue(); };
  }, [isSoundEnabled, musicWorld]);

  useEffect(() => {
    if (!trailNotice) return undefined;
    const timer = window.setTimeout(() => setTrailNotice(null), 4200);
    return () => window.clearTimeout(timer);
  }, [trailNotice]);

  useEffect(() => {
    const arriving = worldLayers.find(layer => layer.status === "arriving");
    if (!arriving) return undefined;
    window.clearTimeout(handoffTimerRef.current);
    handoffTimerRef.current = window.setTimeout(() => {
      setActiveStop(arriving.stopId);
      setWorldLayers([{ stopId: arriving.stopId, status: "active", ready: true, anticipatedFrom: null }]);
    }, 440);
    return () => window.clearTimeout(handoffTimerRef.current);
  }, [worldLayers]);

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

  const handleGateReady = useCallback((fromStopId, nextStopId) => {
    if (!getStop(nextStopId)) return;
    setWorldLayers(layers => prepareJourneyLayer(layers, fromStopId, nextStopId));
  }, []);

  const handleLayerReady = useCallback(stopId => {
    setWorldLayers(layers => markJourneyLayerReady(layers, stopId));
  }, []);

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
    const next = commit(recordQuestTelemetryStop(recorded, finishedStopId));
    const finishedStop = getStop(finishedStopId);
    const nextStop = nextStopAfter(next);
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
      seedwake: seedwakeStopSpec(finishedStopId)
    };
    if (chapterReward) {
      const ended = commit(endQuestSession(next, { reason: "chapter_complete" }));
      setActiveStop(finishedStopId);
      setWorldLayers(layers => layers
        .filter(layer => layer.stopId === finishedStopId)
        .map(layer => ({ ...layer, status: "active", ready: true, anticipatedFrom: null })));
      setCeremony({ ...reward, state: ended });
      setView(VIEW.CEREMONY);
    } else if (nextStop?.id) {
      setTrailNotice(reward);
      if (use2d) {
        setActiveStop(nextStop.id);
        setWorldLayers([{ stopId: nextStop.id, status: "active", ready: true, anticipatedFrom: null }]);
      } else {
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
  }, [commit, journeyMode.kind, progressScopeKey, use2d]);

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
      stopId: id
    });
    commit(started);
    setJourneyMode({ kind, targets: options.targets || null });
    setCeremony(null);
    setForce2d(false);
    setActiveStop(id);
    setWorldLayers([{ stopId: id, status: "active", ready: false, anticipatedFrom: null }]);
    setView(VIEW.WORLD);
    logStudentActivity("phonics_quest", id, "session_start", { mode: kind, qualityTier: activeQuality.id });
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

  const continueAfterCeremony = useCallback(() => {
    const nextStop = ceremony?.nextStop;
    setWorldLayers([]);
    setActiveStop(null);
    setCeremony(null);
    setMapChapter(chapterForStop(nextStop)?.index || chapterForStop(ceremony?.stop)?.index || 1);
    setView(VIEW.MAP);
  }, [ceremony]);

  const updateDisplayMode = useCallback(displayMode => {
    const current = stateRef.current;
    commit({ ...current, settings: { ...current.settings, displayMode } });
    setForce2d(false);
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
    <div className="q-root" data-fullbleed="">
      <button type="button" className="q-exit" onClick={closeQuest} aria-label="Close Sound Seekers">Close</button>

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
          onDisplayMode={updateDisplayMode}
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
            const layerState = layer.status === "preloading"
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
              targetsOverride: journeyMode.targets,
              onAnswer: (target, correct, shell) => handleAnswer(layer.stopId, target, correct, shell),
              onCheckpoint: interactive ? handleCheckpoint : undefined,
              onFinish: interactive ? (stars, tally) => handleFinish(layer.stopId, stars, tally) : undefined,
              onQuit: interactive ? quitWorld : undefined
            };
            return (
              <div
                key={layer.stopId}
                className={`q-journey-layer is-${layer.status}`}
                aria-hidden={!interactive}
                data-stop={layer.stopId}
              >
                {use2d ? (
                  <QuestTrail2D {...sharedProps} />
                ) : (
                  <QuestHub
                    {...sharedProps}
                    qualityTier={activeQuality}
                    ceremony={view === VIEW.CEREMONY && layer.status === "active"}
                    onGateReady={interactive ? handleGateReady : undefined}
                    onSceneReady={() => handleLayerReady(layer.stopId)}
                    onSceneError={() => setForce2d(true)}
                  />
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
          <em>{trailNotice.stars} stars · {trailNotice.drops} {trailNotice.seedwake?.collectible.plural || "finds"}{trailNotice.gear ? " · new gear" : ""}</em>
          {trailNotice.chapterReward && <em>{trailNotice.chapterReward.abilityLabel}</em>}
        </aside>
      )}

      {view === VIEW.CEREMONY && ceremony && (
        <RewardScreen
          stop={ceremony.stop}
          nextStop={ceremony.nextStop}
          stars={ceremony.stars}
          newStones={ceremony.newStones}
          gear={ceremony.gear}
          chapterReward={ceremony.chapterReward}
          state={ceremony.state || state}
          isSoundEnabled={isSoundEnabled}
          overlay
          onContinue={continueAfterCeremony}
        />
      )}
    </div>,
    document.body
  );
}

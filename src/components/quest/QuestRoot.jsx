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
import QuestHub from "./world/QuestHub.jsx";
import TradingPost from "./TradingPost.jsx";
import { loadQuestProgress, saveQuestProgress } from "../../utils/questStore.js";
import {
  recordQuestAttempt,
  recordStopResult,
  saveQuestCheckpoint,
  ownedPieces
} from "../../utils/questProgress.js";
import { isMastered } from "../../utils/questMastery.js";
import { getStop, QUEST_STOPS } from "../../data/questSequence.js";
import { CREATURE_GEAR } from "../../data/creatureParts.js";
import { startGameMusic, stopGameMusic } from "../../utils/audio/gameMusic.js";
import { cancelGameSfx } from "../../utils/audio/gameSfx.js";
import { hushCue } from "./shells/shellContract.js";
import { notifyMissionTaskDone } from "../../utils/dailyMission.js";
import "../../styles/quest.css";

const VIEW = { CREATOR: "creator", DEN: "den", WORLD: "world", POST: "post" };

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
  const [state, setState] = useState(() => loadQuestProgress(progressScopeKey));
  const [view, setView] = useState(
    () => initialView || (loadQuestProgress(progressScopeKey).hatched ? VIEW.DEN : VIEW.CREATOR)
  );
  const [activeStop, setActiveStop] = useState(() => (initialView === VIEW.WORLD ? initialStop : null));
  const [trailNotice, setTrailNotice] = useState(null);
  const stateRef = useRef(state);
  const latestCheckpointRef = useRef(state.checkpoint);
  const musicWorld = view === VIEW.WORLD ? getStop(activeStop)?.world || "meadow" : "meadow";

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
    if (isSoundEnabled) startGameMusic(musicWorld, { fallbackWorldId: "meadow" });
    else stopGameMusic();
    return () => { stopGameMusic(); cancelGameSfx(); hushCue(); };
  }, [isSoundEnabled, musicWorld]);

  useEffect(() => {
    if (!trailNotice) return undefined;
    const timer = window.setTimeout(() => setTrailNotice(null), 4200);
    return () => window.clearTimeout(timer);
  }, [trailNotice]);

  // The child can leave through the app close button, browser navigation, or a
  // parent route change. Keep the last in-memory checkpoint durable in all three.
  useEffect(() => () => {
    const current = latestCheckpointRef.current
      ? saveQuestCheckpoint(stateRef.current, latestCheckpointRef.current)
      : stateRef.current;
    saveQuestProgress(progressScopeKey, current);
  }, [progressScopeKey]);

  const owned = useMemo(() => ownedPieces(state), [state]);

  // ── Resume. The checkpoint is written after every shell, so re-opening
  // mid-stop lands you where you were, not back at the Knowledge Tree.
  const resume = state.checkpoint && state.checkpoint.stopId === activeStop ? state.checkpoint : null;

  const handleAnswer = useCallback((target, correct, shell) => {
    // stopIndex is not decoration: it is what the review scheduler measures
    // "how long since the child last saw this sound" from.
    const stopIndex = getStop(activeStop)?.index || 0;
    setState(prev => {
      const next = recordQuestAttempt(prev, { target, correct, shell, stopIndex });
      stateRef.current = next;
      saveQuestProgress(progressScopeKey, next);
      return next;
    });
  }, [progressScopeKey, activeStop]);

  const handleCheckpoint = useCallback(cp => {
    latestCheckpointRef.current = cp;
    setState(prev => {
      const next = saveQuestCheckpoint(prev, cp);
      stateRef.current = next;
      saveQuestProgress(progressScopeKey, next);
      return next;
    });
  }, [progressScopeKey]);

  const handleFinish = useCallback((stars, tally = {}) => {
    if (!activeStop) return;
    const previous = stateRef.current;
    const before = new Set(previous.stones);
    const next = commit(recordStopResult(previous, activeStop, stars, tally.drops || 0));
    const finishedStop = getStop(activeStop);
    const nextStop = nextStopAfter(next);
    const newStones = next.stones.filter(g => !before.has(g) && isMastered(next.mastery, g));
    const gear = CREATURE_GEAR.find(g => g.unlock === activeStop)?.id || null;

    latestCheckpointRef.current = null;
    setTrailNotice({
      id: `${activeStop}-${Date.now()}`,
      stop: finishedStop,
      nextStop,
      stars,
      newStones,
      gear
    });
    if (nextStop?.id) {
      setActiveStop(nextStop.id);
      setView(VIEW.WORLD);
    } else {
      setActiveStop(null);
      setView(VIEW.DEN);
    }
    notifyMissionTaskDone(progressScopeKey, "game");
  }, [activeStop, commit, progressScopeKey]);

  const quitWorld = useCallback(() => {
    // Leaving the land keeps its position and completed requests.
    hushCue();
    setView(VIEW.DEN);
  }, []);

  const enterWorld = useCallback(nextState => {
    const checkpointStop = nextState?.checkpoint?.stopId;
    const id = getStop(checkpointStop) ? checkpointStop : nextAdventureId(nextState);
    if (!id) return;
    setActiveStop(id);
    setView(VIEW.WORLD);
  }, []);

  const closeQuest = useCallback(() => {
    const current = latestCheckpointRef.current
      ? saveQuestCheckpoint(stateRef.current, latestCheckpointRef.current)
      : stateRef.current;
    stateRef.current = current;
    saveQuestProgress(progressScopeKey, current);
    onExit?.();
  }, [onExit, progressScopeKey]);

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
          onWalk={() => enterWorld(state)}
          onEditCreature={() => setView(VIEW.CREATOR)}
          onTradingPost={() => setView(VIEW.POST)}
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

      {view === VIEW.WORLD && activeStop && (
        <QuestHub
          key={activeStop}
          stopId={activeStop}
          state={state}
          resume={resume}
          isSoundEnabled={isSoundEnabled}
          onAnswer={handleAnswer}
          onCheckpoint={handleCheckpoint}
          onFinish={handleFinish}
          onQuit={quitWorld}
        />
      )}

      {view === VIEW.WORLD && trailNotice && (
        <aside className="q-trail-notice" aria-live="polite" aria-label="Trail progress">
          <span>{trailNotice.stop?.name || "Trail"} complete</span>
          <strong>{trailNotice.nextStop ? `${trailNotice.nextStop.name} ahead` : "The whole trail is open"}</strong>
          <em>{trailNotice.stars} stars · {trailNotice.newStones.length} new stones{trailNotice.gear ? " · new gear" : ""}</em>
        </aside>
      )}
    </div>,
    document.body
  );
}

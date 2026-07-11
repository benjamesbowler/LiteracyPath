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

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import CreatureCreator from "./CreatureCreator.jsx";
import DenScreen from "./DenScreen.jsx";
import TrailMap from "./TrailMap.jsx";
import StopRunner from "./StopRunner.jsx";
import RewardScreen from "./RewardScreen.jsx";
import TradingPost from "./TradingPost.jsx";
import { loadQuestProgress, saveQuestProgress } from "../../utils/questStore.js";
import {
  recordQuestAttempt,
  recordStopResult,
  saveQuestCheckpoint,
  clearQuestCheckpoint,
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

const VIEW = { CREATOR: "creator", DEN: "den", MAP: "map", STOP: "stop", REWARD: "reward", POST: "post" };

export default function QuestRoot({ progressScopeKey = "default", isSoundEnabled = true, onExit }) {
  const [state, setState] = useState(() => loadQuestProgress(progressScopeKey));
  const [view, setView] = useState(() => (loadQuestProgress(progressScopeKey).hatched ? VIEW.DEN : VIEW.CREATOR));
  const [activeStop, setActiveStop] = useState(null);
  const [reward, setReward] = useState(null);
  // Open the map on the land the child is ACTUALLY in, not always the Meadow.
  // A child three lands along who has to tap through two maps to get back to
  // where they were will stop opening the map.
  const [act, setAct] = useState(() => {
    const saved = loadQuestProgress(progressScopeKey);
    const done = new Set(saved.trail.stopsDone);
    const next = QUEST_STOPS.find(s => !done.has(s.id));
    return next ? next.act : 3;
  });

  // One writer. Every state change goes through here, so there is exactly one
  // place a save can go wrong.
  const commit = useCallback(next => {
    setState(next);
    saveQuestProgress(progressScopeKey, next);
    return next;
  }, [progressScopeKey]);

  useEffect(() => {
    if (isSoundEnabled) startGameMusic("quest", { fallbackWorldId: "meadow" });
    else stopGameMusic();
    return () => { stopGameMusic(); cancelGameSfx(); hushCue(); };
  }, [isSoundEnabled]);

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
      saveQuestProgress(progressScopeKey, next);
      return next;
    });
  }, [progressScopeKey, activeStop]);

  const handleCheckpoint = useCallback(cp => {
    setState(prev => {
      const next = saveQuestCheckpoint(prev, cp);
      saveQuestProgress(progressScopeKey, next);
      return next;
    });
  }, [progressScopeKey]);

  const handleFinish = useCallback((stars) => {
    setState(prev => {
      const before = new Set(prev.stones);
      const next = recordStopResult(prev, activeStop, stars);
      saveQuestProgress(progressScopeKey, next);

      const newStones = next.stones.filter(g => !before.has(g) && isMastered(next.mastery, g));
      const gear = CREATURE_GEAR.find(g => g.unlock === activeStop)?.id || null;
      setReward({ stop: getStop(activeStop), stars, newStones, gear });
      setView(VIEW.REWARD);
      notifyMissionTaskDone(progressScopeKey, "game");

      // Finishing the last stop of a land should walk you into the next one, not
      // dump you back at a map you've finished.
      const done = new Set(next.trail.stopsDone);
      const upcoming = QUEST_STOPS.find(s => !done.has(s.id));
      if (upcoming) setAct(upcoming.act);
      return next;
    });
  }, [activeStop, progressScopeKey]);

  const quitStop = useCallback(() => {
    // Leaving mid-stop KEEPS the checkpoint. That is the whole point of it.
    hushCue();
    setView(VIEW.MAP);
  }, []);

  const leaveReward = useCallback(() => {
    setReward(null);
    setActiveStop(null);
    setView(VIEW.MAP);
  }, []);

  return createPortal(
    <div className="q-root" data-fullbleed="">
      <button type="button" className="q-exit" onClick={onExit} aria-label="Close Sound Seekers">Close</button>

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
          onWalk={() => setView(VIEW.MAP)}
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

      {view === VIEW.MAP && (
        <TrailMap
          state={state}
          act={act}
          onAct={setAct}
          isSoundEnabled={isSoundEnabled}
          onBack={() => setView(VIEW.DEN)}
          onEnterStop={id => { setActiveStop(id); setView(VIEW.STOP); }}
        />
      )}

      {view === VIEW.STOP && activeStop && (
        <StopRunner
          stopId={activeStop}
          state={state}
          resume={resume}
          isSoundEnabled={isSoundEnabled}
          onAnswer={handleAnswer}
          onCheckpoint={handleCheckpoint}
          onFinish={handleFinish}
          onQuit={quitStop}
        />
      )}

      {view === VIEW.REWARD && reward && (
        <RewardScreen
          stop={reward.stop}
          stars={reward.stars}
          newStones={reward.newStones}
          gear={reward.gear}
          creature={state.creature}
          isSoundEnabled={isSoundEnabled}
          onContinue={() => { commit(clearQuestCheckpoint(state)); leaveReward(); }}
        />
      )}
    </div>,
    document.body
  );
}

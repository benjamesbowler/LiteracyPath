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
import { loadQuestProgress, saveQuestProgress } from "../../utils/questStore.js";
import {
  recordQuestAttempt,
  recordStopResult,
  saveQuestCheckpoint,
  clearQuestCheckpoint,
  ownedPieces
} from "../../utils/questProgress.js";
import { isMastered } from "../../utils/questMastery.js";
import { getStop } from "../../data/questSequence.js";
import { CREATURE_GEAR } from "../../data/creatureParts.js";
import { startGameMusic, stopGameMusic } from "../../utils/audio/gameMusic.js";
import { cancelGameSfx } from "../../utils/audio/gameSfx.js";
import { hushCue } from "./shells/shellContract.js";
import { notifyMissionTaskDone } from "../../utils/dailyMission.js";
import "../../styles/quest.css";

const VIEW = { CREATOR: "creator", DEN: "den", MAP: "map", STOP: "stop", REWARD: "reward" };

export default function QuestRoot({ progressScopeKey = "default", isSoundEnabled = true, onExit }) {
  const [state, setState] = useState(() => loadQuestProgress(progressScopeKey));
  const [view, setView] = useState(() => (loadQuestProgress(progressScopeKey).hatched ? VIEW.DEN : VIEW.CREATOR));
  const [activeStop, setActiveStop] = useState(null);
  const [reward, setReward] = useState(null);

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
    setState(prev => {
      const next = recordQuestAttempt(prev, { target, correct, shell });
      saveQuestProgress(progressScopeKey, next);
      return next;
    });
  }, [progressScopeKey]);

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
        />
      )}

      {view === VIEW.MAP && (
        <TrailMap
          state={state}
          act={1}
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

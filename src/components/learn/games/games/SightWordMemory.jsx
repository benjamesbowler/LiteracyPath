import { useRef, useState } from "react";
import { ArcadePracticeGame } from "./ArcadePracticeGame.jsx";
import { CAST } from "../../../../features/soundSeekers/v3/content/cast.js";
import { speakWord } from "../../../../utils/learnGamesAudio.js";
import { useLearningResult } from "../../../../hooks/useLearningResult.js";
import { LEARNING_PACE } from "../../../../utils/learningPace.js";
import { practiceEvidence } from "./phonicsPlayModel.js";
import { useResumeTransition, useStageSnapshot } from "./phonicsSession.js";
import { useRecordedPracticeCue } from "../shared/useRecordedPracticeCue.js";
import "./phonics-recognition-overhaul.css";

export function WoodlandMemoryStage({ state, round = 0, setRound, isSoundEnabled,
  correct, setCorrect, addScore, miss, finish, resultReady, schedule,
  recordFirstResponse, recordAssistedRetry, paused, resume, onSnapshot }) {
  const { begin: holdResult, waitFor: ownReplay } = useLearningResult(paused);
  const [boardIndex, setBoardIndex] = useState(() => resume?.boardIndex ?? Math.min(round, state.boards.length - 1));
  const [selected, setSelected] = useState(resume?.selected || []);
  const [matchedIds, setMatchedIds] = useState(() => resume?.matchedIds || state.boards.slice(0, round).flat().map(card => card.id));
  const [message, setMessage] = useState("Turn over two cards. Find the same word.");
  const [lastWord, setLastWord] = useState(resume?.lastWord || "");
  const selectedRef = useRef(resume?.selected || []);
  const matchedRef = useRef(new Set(matchedIds));
  const attemptsRef = useRef(new Map(resume?.attempts || []));
  const lockedRef = useRef(false);
  const cards = state.boards[boardIndex];
  const pairsOnBoard = cards.filter(card => matchedIds.includes(card.id)).length / 2;
  const total = state.cards.length / 2;
  const { canHear: canReplayWord, replay: replayWord } = useRecordedPracticeCue(lastWord, isSoundEnabled && !paused, false, ownReplay);

  function advanceBoard(nextCorrect) {
    selectedRef.current = [];
    setSelected([]);
    lockedRef.current = false;
    if (boardIndex + 1 < state.boards.length) {
      setBoardIndex(boardIndex + 1);
      setRound?.(boardIndex + 1);
      setMessage("New cards! Turn over two and find the same word.");
    } else {
      resultReady(nextCorrect);
      finish(nextCorrect);
    }
  }

  function choose(card) {
    if (paused || lockedRef.current || selectedRef.current.length >= 2 || matchedRef.current.has(card.id)
      || selectedRef.current.some(item => item.id === card.id)) return;
    setLastWord(card.word);
    if (isSoundEnabled) ownReplay(speakWord(card.word));
    const next = [...selectedRef.current, card];
    selectedRef.current = next;
    setSelected(next);
    if (next.length === 1) {
      setMessage(`This says ${card.word}. Find its matching word.`);
      return;
    }
    const matched = next[0].pairId === next[1].pairId;
    recordFirstResponse({ ...practiceEvidence("visual_memory", ["spatial_pairing"]),
      game: "sight-word-memory", round: next[0].pairId, target: next[0].word, response: card.word, correct: matched });
    if (!matched) {
      lockedRef.current = true;
      attemptsRef.current.set(next[0].pairId, (attemptsRef.current.get(next[0].pairId) || 0) + 1);
      miss();
      setMessage(`${next[0].word} and ${card.word} are different words. Remember where they are and try again.`);
      holdResult(() => {
        selectedRef.current = [];
        setSelected([]);
        lockedRef.current = false;
        setMessage("Try again. Turn over two cards with the same word.");
      }, LEARNING_PACE.word, () => isSoundEnabled ? speakWord(card.word) : undefined);
      return;
    }
    const attempts = attemptsRef.current.get(next[0].pairId) || 0;
    if (attempts) recordAssistedRetry({ game: "sight-word-memory", round: next[0].pairId,
      attempts, supportUsed: ["revealed_cards", "spatial_pairing"] });
    next.forEach(item => matchedRef.current.add(item.id));
    setMatchedIds([...matchedRef.current]);
    selectedRef.current = [];
    setSelected([]);
    addScore(12);
    const nextCorrect = matchedRef.current.size / 2;
    setCorrect(nextCorrect);
    setMessage(`${card.word} and ${card.word} match! A lantern is lit.`);
    if (cards.every(item => matchedRef.current.has(item.id))) {
      lockedRef.current = true;
      holdResult(() => advanceBoard(nextCorrect), LEARNING_PACE.word,
        () => isSoundEnabled ? speakWord(card.word) : undefined);
    }
  }

  useStageSnapshot(() => ({ boardIndex, selected, matchedIds, lastWord, attempts: [...attemptsRef.current] }), onSnapshot);
  const restoredComplete = resume?.matchedIds && cards.every(card => resume.matchedIds.includes(card.id));
  useResumeTransition(restoredComplete || resume?.selected?.length === 2, () => {
    if (restoredComplete) advanceBoard(correct);
    else {
      selectedRef.current = [];
      setSelected([]);
      lockedRef.current = false;
      setMessage("Your cards are here. Find the same word in two places.");
    }
  }, schedule, LEARNING_PACE.word);

  return <section className={`pr-game pr-memory pp-play${paused ? " pr-paused" : ""}`} data-engine-paused={Boolean(paused)} data-phonics-mode="memory" aria-label="Sight Word Memory woodland">
    <header className="pr-objective">
      <div><strong>Light Luna’s lanterns</strong><span>Turn over two cards with the same word.</span></div>
      <span className="pr-count">Board {boardIndex + 1}/{state.boards.length}<small>{correct}/{total} pairs</small></span>
      <button type="button" className="pr-replay" disabled={!canReplayWord}
        aria-label="Hear last revealed word" onClick={() => ownReplay(replayWord())}>♪<small>Hear</small></button>
    </header>
    <div className="pr-memory-clearing">
      <div className="pr-luna-perch" aria-hidden="true"><img src={CAST.luna.sprite} alt="" onError={event => { event.currentTarget.hidden = true; }} /><span /></div>
      <div className="pr-lantern-line" aria-label={`${pairsOnBoard} of 4 lanterns lit`}>
        {[0, 1, 2, 3].map(index => <span key={index} className={`pr-lantern${index < pairsOnBoard ? " is-lit" : ""}`} aria-hidden="true"><i />{index < pairsOnBoard ? "✓" : ""}</span>)}
      </div>
      <div className="pp-memory-table pr-memory-table" data-table={boardIndex} data-card-count={cards.length} role="group" aria-label="Eight word cards">
        {cards.map((card, index) => {
          const matched = matchedIds.includes(card.id);
          const visible = matched || selected.some(item => item.id === card.id);
          return <button type="button" key={card.id} data-pair-id={card.pairId} data-card-id={card.id}
            disabled={paused || matched || selected.length === 2}
            className={`pp-memory-card pr-memory-card${visible ? " is-revealed" : ""}${matched ? " is-matched" : ""}`}
            aria-label={`${matched ? "Matched" : visible ? "Revealed" : "Hidden"} card ${index + 1} of ${cards.length}${visible ? `: ${card.word}` : ""}`}
            onClick={() => choose(card)}>
            <span className="pr-card-corner" aria-hidden="true">{matched ? "✓" : index + 1}</span>
            <span className="pp-card-front pr-card-word" aria-hidden={!visible}
              style={{ "--word-fit-units": Math.max(1, card.word.length * .55) }}>{visible ? card.word : ""}</span>
            {!visible && <span className="pr-card-leaf" aria-hidden="true">❧</span>}
          </button>;
        })}
      </div>
    </div>
    <p className="pr-feedback" role="status">{message}</p>
  </section>;
}

const stages = { memory: WoodlandMemoryStage };
export default function SightWordMemory(props) {
  return <ArcadePracticeGame {...props} title="Sight Word Memory" mode="memory" stageComponents={stages} />;
}

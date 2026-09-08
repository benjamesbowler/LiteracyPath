import { memo, useCallback, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePhonicsAudio } from "../../../../../hooks/usePhonicsAudio";
import AudioButton from "../AudioButton";
import WordTile from "../WordTile";
import { getLedaInstructionAudioPath } from "../../../../../data/ledaProductionAudio.js";

import { makeMatchTiles, getPrintedMatchContract } from "../../phonicsActivityState.js";

function getTileKey(tile) {
  return `${tile.word.word}-${tile.isCorrect ? "target" : "distractor"}`;
}

const StepMatch = memo(function StepMatch({ lesson, onComplete }) {
  const { play: playCorrect } = usePhonicsAudio(getLedaInstructionAudioPath("Great job"), "Great job");
  const { play: playIncorrect } = usePhonicsAudio(getLedaInstructionAudioPath("Try again"), "Try again");
  const { play: playYay } = usePhonicsAudio(getLedaInstructionAudioPath("You found it"), "You found it");
  const matchContract = useMemo(() => getPrintedMatchContract(lesson), [lesson]);
  const [epoch, setEpoch] = useState(0);
  const tiles = useMemo(() => makeMatchTiles(lesson, epoch), [lesson, epoch]);
  const selectedRef = useRef(new Set());
  const responsesRef = useRef([]);
  const completedRef = useRef(false);
  const [correction, setCorrection] = useState("");
  const [flipStates, setFlipStates] = useState(() => Object.fromEntries(tiles.map(tile => [getTileKey(tile), "default"])));
  const [foundCount, setFoundCount] = useState(0);
  const isComplete = foundCount === lesson.words.length;
  const remaining = lesson.words.length - foundCount;

  const handleTileClick = useCallback((tile) => {
    const tileKey = getTileKey(tile);
    const currentState = flipStates[tileKey];
    if (currentState !== "default" || isComplete || selectedRef.current.has(tileKey)) return;
    selectedRef.current.add(tileKey);
    responsesRef.current.push({ word: tile.word.word, correct: tile.isCorrect });

    if (tile.isCorrect) {
      playCorrect();
      setFlipStates(previous => ({ ...previous, [tileKey]: "correct" }));
      setFoundCount(previous => previous + 1);
      if (responsesRef.current.filter(response => response.correct).length === lesson.words.length && !completedRef.current) {
        completedRef.current = true;
        playYay();
        onComplete({ step: "match", completionKind: "supported", audioDelivery: "not_required", firstResponse: responsesRef.current[0] || null,
          attempts: responsesRef.current.length, supportUsed: ["printed_word_model", ...(responsesRef.current.some(r => !r.correct) ? ["elimination", "correction"] : [])], independent: false,
          responses: [...responsesRef.current], construct: matchContract.construct });
      }
    } else {
      playIncorrect();
      setCorrection(`${tile.word.word} does not belong in this letter group. Look at the printed ${matchContract.location}.`);
      setFlipStates(previous => ({ ...previous, [tileKey]: "incorrect" }));
    }
  }, [flipStates, isComplete, playCorrect, playIncorrect, playYay, onComplete, lesson.words.length, matchContract]);

  const handleRestart = useCallback(() => {
    selectedRef.current.clear(); responsesRef.current = []; completedRef.current = false;
    const nextTiles = makeMatchTiles(lesson, epoch + 1);
    setEpoch(previous => previous + 1);
    setFlipStates(Object.fromEntries(nextTiles.map(tile => [getTileKey(tile), "default"])));
    setFoundCount(0); setCorrection("");
  }, [lesson, epoch]);

  return (
    <div className="phonics-step phonics-step-match kg-child-flow__content">
      <motion.div className="phonics-step-heading" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h2>{matchContract.prompt}</h2>
      </motion.div>

      <motion.div className="phonics-found-counter" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <span aria-hidden="true">★</span>
        <strong>Found: {foundCount} / {lesson.words.length}</strong>
        <span aria-hidden="true">★</span>
      </motion.div>

      <div className="phonics-match-grid">
        {tiles.map(tile => {
          const tileKey = getTileKey(tile);

          return (
            <div key={tileKey}>
              <WordTile
                word={tile.word.word}
                image={tile.word.image}
                state={flipStates[tileKey]}
                onClick={() => handleTileClick(tile)}
                disabled={flipStates[tileKey] !== "default" || isComplete}
              />
            </div>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {!isComplete ? (
          <motion.p key="hint" className="phonics-match-hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {correction || (remaining > 0 ? `Find ${remaining} more!` : "You found them all!")}
          </motion.p>
        ) : (
          <motion.p key="complete" className="phonics-step-status success" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}>
            Amazing work!
          </motion.p>
        )}
      </AnimatePresence>

      <motion.div className="phonics-step-actions" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <AudioButton src={lesson.phonicAudio} fallbackText={lesson.phonicSound} size={64} />
        <motion.button className="phonics-shuffle-button" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleRestart} type="button">
          Shuffle Again
        </motion.button>
      </motion.div>
    </div>
  );
});

export default StepMatch;

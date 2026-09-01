import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePhonicsAudio } from "../../../../../hooks/usePhonicsAudio";
import AudioButton from "../AudioButton";
import WordTile from "../WordTile";
import { getLedaInstructionAudioPath } from "../../../../../data/ledaProductionAudio.js";

function shuffleTiles(words, distractors) {
  const allTiles = [
    ...words.map(word => ({ word, isCorrect: true })),
    ...distractors.map(word => ({ word, isCorrect: false }))
  ];

  for (let i = allTiles.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [allTiles[i], allTiles[j]] = [allTiles[j], allTiles[i]];
  }

  return allTiles;
}

function getTileKey(tile) {
  return `${tile.word.word}-${tile.isCorrect ? "target" : "distractor"}`;
}

const StepMatch = memo(function StepMatch({ lesson, onComplete }) {
  const { play: playCorrect } = usePhonicsAudio(getLedaInstructionAudioPath("Great job"), "Great job");
  const { play: playIncorrect } = usePhonicsAudio(getLedaInstructionAudioPath("Try again"), "Try again");
  const { play: playYay } = usePhonicsAudio(getLedaInstructionAudioPath("You found it"), "You found it");
  const tiles = useMemo(() => shuffleTiles(lesson.words, lesson.distractors), [lesson.distractors, lesson.words]);
  const [flipStates, setFlipStates] = useState(() => Object.fromEntries(tiles.map(tile => [getTileKey(tile), "default"])));
  const [foundCount, setFoundCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const remaining = lesson.words.length - foundCount;

  const handleTileClick = useCallback((tile) => {
    const tileKey = getTileKey(tile);
    const currentState = flipStates[tileKey];
    if (currentState !== "default" || isComplete) return;

    if (tile.isCorrect) {
      playCorrect();
      setFlipStates(previous => ({ ...previous, [tileKey]: "correct" }));
      setFoundCount(previous => previous + 1);
    } else {
      playIncorrect();
      setFlipStates(previous => ({ ...previous, [tileKey]: "incorrect" }));
    }
  }, [flipStates, isComplete, playCorrect, playIncorrect]);

  useEffect(() => {
    if (foundCount === lesson.words.length && !isComplete) {
      const timer = setTimeout(() => {
        setIsComplete(true);
        playYay();
        setTimeout(onComplete, 1200);
      }, 800);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [foundCount, isComplete, lesson.words.length, onComplete, playYay]);

  const handleRestart = useCallback(() => {
    setFlipStates(Object.fromEntries(tiles.map(tile => [getTileKey(tile), "default"])));
    setFoundCount(0);
    setIsComplete(false);
  }, [tiles]);

  return (
    <div className="phonics-step phonics-step-match kg-child-flow__content">
      <motion.div className="phonics-step-heading" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h2>{lesson.matchPrompt || `Find all the words that start with ${lesson.letter}!`}</h2>
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
            {remaining > 0 ? `Find ${remaining} more!` : "You found them all!"}
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

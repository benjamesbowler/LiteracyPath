import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePhonicsAudio } from "../../../../../hooks/usePhonicsAudio";
import AudioButton from "../AudioButton";
import WordTile from "../WordTile";

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

const StepMatch = memo(function StepMatch({ lesson, onComplete }) {
  const { play: playCorrect } = usePhonicsAudio("/audio/correct.mp3", "Correct");
  const { play: playIncorrect } = usePhonicsAudio("/audio/incorrect.mp3", "Try again");
  const { play: playYay } = usePhonicsAudio("/audio/yay.mp3", "You found them all");
  const tiles = useMemo(() => shuffleTiles(lesson.words, lesson.distractors), [lesson.distractors, lesson.words]);
  const [flipStates, setFlipStates] = useState(() => Object.fromEntries(tiles.map(tile => [tile.word.word, "default"])));
  const [foundCount, setFoundCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const remaining = lesson.words.length - foundCount;

  const handleTileClick = useCallback((tile) => {
    const currentState = flipStates[tile.word.word];
    if (currentState !== "default" || isComplete) return;

    if (tile.isCorrect) {
      playCorrect();
      setFlipStates(previous => ({ ...previous, [tile.word.word]: "correct" }));
      setFoundCount(previous => previous + 1);
    } else {
      playIncorrect();
      setFlipStates(previous => ({ ...previous, [tile.word.word]: "incorrect" }));
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
    setFlipStates(Object.fromEntries(tiles.map(tile => [tile.word.word, "default"])));
    setFoundCount(0);
    setIsComplete(false);
  }, [tiles]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.4 }}
      className="phonics-step phonics-step-match"
    >
      <motion.div className="phonics-step-heading" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h2>Find all the words that start with {lesson.letter}!</h2>
      </motion.div>

      <motion.div className="phonics-found-counter" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <span aria-hidden="true">★</span>
        <strong>Found: {foundCount} / {lesson.words.length}</strong>
        <span aria-hidden="true">★</span>
      </motion.div>

      <motion.div className="phonics-match-grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {tiles.map((tile, index) => (
          <motion.div
            key={tile.word.word}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 + index * 0.05, type: "spring", stiffness: 250, damping: 18 }}
          >
            <WordTile
              word={tile.word.word}
              image={tile.word.image}
              state={flipStates[tile.word.word]}
              onClick={() => handleTileClick(tile)}
              disabled={flipStates[tile.word.word] !== "default" || isComplete}
            />
          </motion.div>
        ))}
      </motion.div>

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
    </motion.div>
  );
});

export default StepMatch;

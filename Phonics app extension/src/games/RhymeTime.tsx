import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameProps } from './types';
import { speak, cancelSpeech } from '@/lib/speech';
import { playCorrectChime, playSoftBuzz, playCelebrationFanfare } from '@/lib/audio';
import { RHYMING_PAIRS } from '@/lib/gameData';
import { saveProgress } from '@/lib/progress';
import ProgressStars from '@/components/ProgressStars';
import ConfettiCelebration from '@/components/ConfettiCelebration';

interface Tile {
  word: string;
  id: number;
  matched: boolean;
  selected: boolean;
}

const WORD_EMOJIS: Record<string, string> = {
  cat: '🐱', hat: '🎩', dog: '🐶', log: '🪵', sun: '☀️', fun: '🎉',
  bed: '🛏️', red: '🔴', car: '🚗', star: '⭐', pen: '🖊️', hen: '🐔',
  bus: '🚌', us: '👥', map: '🗺️', cap: '🧢', pig: '🐷', big: '🐘',
  top: '🪀', hop: '🐇',
};

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getPairsForDifficulty(difficulty: string): string[][] {
  if (difficulty === 'easy') {
    return RHYMING_PAIRS.slice(0, 2);
  } else if (difficulty === 'medium') {
    return RHYMING_PAIRS.slice(0, 4);
  }
  return RHYMING_PAIRS.slice(0, 6);
}

function getRimeHint(word: string): string {
  return word.slice(-2).toUpperCase();
}

export default function RhymeTime({ difficulty, onScoreUpdate, onComplete, isSoundEnabled }: GameProps) {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<string[][]>([]);
  const [wrongAttempt, setWrongAttempt] = useState(false);
  const [score, setScore] = useState(0);
  const [stars, setStars] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [wrongCount, setWrongCount] = useState(0);
  const startTimeRef = useRef(Date.now());
  const hasStartedRef = useRef(false);
  const isProcessingRef = useRef(false);

  const pairs = getPairsForDifficulty(difficulty);
  const totalPairs = pairs.length;
  const showHint = difficulty === 'easy';

  const initGame = useCallback(() => {
    const allWords: Tile[] = [];
    let id = 0;
    pairs.forEach(([w1, w2]) => {
      allWords.push({ word: w1, id: id++, matched: false, selected: false });
      allWords.push({ word: w2, id: id++, matched: false, selected: false });
    });
    const shuffled = shuffleArray(allWords);
    setTiles(shuffled);
    setSelectedIds([]);
    setMatchedPairs([]);
    setWrongAttempt(false);
    setScore(0);
    setStars(0);
    setGameComplete(false);
    setWrongCount(0);
    startTimeRef.current = Date.now();
    isProcessingRef.current = false;
    if (isSoundEnabled && !hasStartedRef.current) {
      hasStartedRef.current = true;
      setTimeout(() => {
        speak("Find words that rhyme! Tap two words that sound the same at the end.", { rate: 0.7, pitch: 1.1 });
      }, 500);
    }
  }, [pairs, isSoundEnabled]);

  useEffect(() => {
    initGame();
    return () => { cancelSpeech(); };
  }, [initGame]);

  useEffect(() => {
    if (!gameComplete) {
      onScoreUpdate(score);
    }
  }, [score, gameComplete, onScoreUpdate]);

  const handleTileClick = useCallback((tileId: number) => {
    if (isProcessingRef.current) return;
    const tile = tiles.find(t => t.id === tileId);
    if (!tile || tile.matched || tile.selected) return;

    if (isSoundEnabled) {
      speak(tile.word, { rate: 0.7, pitch: 1.1 });
    }

    if (selectedIds.length === 0) {
      setSelectedIds([tileId]);
      setTiles(prev => prev.map(t => t.id === tileId ? { ...t, selected: true } : t));
      return;
    }

    if (selectedIds.length === 1) {
      const firstId = selectedIds[0];
      const firstTile = tiles.find(t => t.id === firstId)!;

      isProcessingRef.current = true;
      setTiles(prev => prev.map(t => t.id === tileId ? { ...t, selected: true } : t));

      const isMatch = firstTile.word !== tile.word &&
        firstTile.word.slice(-2) === tile.word.slice(-2);

      if (isMatch) {
        setTimeout(() => {
          setTiles(prev => prev.map(t =>
            t.id === firstId || t.id === tileId
              ? { ...t, matched: true, selected: false }
              : t
          ));
          setMatchedPairs(prev => [...prev, [firstTile.word, tile.word]]);
          setScore(prev => prev + 20);
          setSelectedIds([]);
          if (isSoundEnabled) playCorrectChime();
          isProcessingRef.current = false;
        }, 600);
      } else {
        setWrongAttempt(true);
        setWrongCount(prev => prev + 1);
        setTimeout(() => {
          setTiles(prev => prev.map(t =>
            t.id === firstId || t.id === tileId
              ? { ...t, selected: false }
              : t
          ));
          setSelectedIds([]);
          setWrongAttempt(false);
          if (isSoundEnabled) playSoftBuzz();
          setScore(prev => Math.max(0, prev - 5));
          isProcessingRef.current = false;
        }, 800);
      }
    }
  }, [tiles, selectedIds, isSoundEnabled]);

  useEffect(() => {
    if (matchedPairs.length > 0 && matchedPairs.length === totalPairs && !gameComplete) {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const timeBonus = elapsed < 60 ? 10 : 0;
      const finalScore = score + timeBonus;
      setScore(finalScore);
      onScoreUpdate(finalScore);

      let earnedStars = 1;
      if (wrongCount < 2) earnedStars = 2;
      if (wrongCount === 0 && elapsed < 60) earnedStars = 3;
      setStars(earnedStars);
      setGameComplete(true);
      if (isSoundEnabled) playCelebrationFanfare();
      const allWords = matchedPairs.flat();
      saveProgress('rhyme-time', earnedStars as 0 | 1 | 2 | 3, finalScore, allWords);
      onComplete(earnedStars);
      if (isSoundEnabled) {
        setTimeout(() => {
          speak(`Fantastic! You found all ${totalPairs} rhyming pairs!`, { rate: 0.7, pitch: 1.2 });
        }, 500);
      }
    }
  }, [matchedPairs, totalPairs, score, wrongCount, gameComplete, isSoundEnabled, onScoreUpdate, onComplete]);

  const handlePlayAgain = () => {
    hasStartedRef.current = false;
    initGame();
  };

  const gridCols = tiles.length <= 4 ? 'grid-cols-2' : tiles.length <= 8 ? 'grid-cols-4' : 'grid-cols-4';

  return (
    <div className="flex flex-col items-center justify-center h-full w-full max-w-4xl mx-auto px-4">
      <ConfettiCelebration trigger={gameComplete} />

      {gameComplete ? (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center gap-6"
        >
          <div className="bg-white/20 rounded-3xl p-8 text-center">
            <h3 className="font-display text-[36px] text-white mb-4">Rhyme Master! 🎉</h3>
            <p className="font-body text-[22px] text-white mb-4">
              You found all {totalPairs} rhyming pairs!
            </p>
            <ProgressStars stars={stars as 0 | 1 | 2 | 3} size={32} />
            <p className="font-display text-[40px] text-golden mt-4">Score: {score}</p>
          </div>
          <button
            onClick={handlePlayAgain}
            className="px-8 py-4 bg-coral text-white rounded-full font-body font-bold text-[18px] shadow-button hover:shadow-button-hover hover:scale-105 transition-all"
          >
            Play Again
          </button>
        </motion.div>
      ) : (
        <>
          {/* Hint */}
          {showHint && matchedPairs.length > 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-body text-[16px] text-white/80 mb-4"
            >
              Words that rhyme with -{getRimeHint(pairs[0][0])}
            </motion.p>
          )}

          {/* Word Tiles Grid */}
          <div className={`grid ${gridCols} gap-4 mb-8`}>
            <AnimatePresence>
              {tiles.map((tile) => (
                <motion.button
                  key={tile.id}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={
                    tile.matched
                      ? { opacity: 0, scale: 0, rotate: 360 }
                      : tile.selected
                        ? {
                            scale: 1.05,
                            borderColor: '#FF7F50',
                            backgroundColor: '#FF7F50',
                            color: '#FFFFFF',
                          }
                        : wrongAttempt && tile.selected
                          ? { x: [-4, 4, -4, 4, 0] }
                          : { opacity: 1, scale: 1 }
                  }
                  exit={
                    tile.matched
                      ? { opacity: 0, scale: 0.3, y: 50, rotate: 360 }
                      : { opacity: 0 }
                  }
                  transition={
                    tile.matched
                      ? { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }
                      : wrongAttempt
                        ? { duration: 0.3 }
                        : { duration: 0.2 }
                  }
                  whileHover={!tile.matched && !tile.selected ? { scale: 1.05, y: -4 } : {}}
                  whileTap={!tile.matched && !tile.selected ? { scale: 0.95 } : {}}
                  onClick={() => handleTileClick(tile.id)}
                  className={`
                    h-16 min-w-[100px] px-5 rounded-2xl border-[3px] font-body font-bold text-[22px]
                    flex items-center justify-center select-none capitalize
                    transition-colors duration-200
                    ${tile.matched
                      ? 'border-success-green bg-[#E8F5E9] text-success-green'
                      : tile.selected
                        ? 'border-coral bg-coral text-white shadow-lg'
                        : 'border-ocean-teal bg-white text-dark-text hover:border-coral cursor-pointer'
                    }
                  `}
                  aria-label={`Word ${tile.word}`}
                >
                  <span className="mr-2">{WORD_EMOJIS[tile.word] || ''}</span>
                  {tile.word}
                </motion.button>
              ))}
            </AnimatePresence>
          </div>

          {/* Matched Pairs Area */}
          {matchedPairs.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-wrap justify-center gap-4 mt-4"
            >
              <p className="w-full text-center font-body text-[14px] text-white/70 mb-2">
                Matched Pairs
              </p>
              {matchedPairs.map((pair, i) => (
                <motion.div
                  key={`${pair[0]}-${pair[1]}-${i}`}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                  className="flex items-center gap-2 bg-white/20 rounded-full px-4 py-2"
                >
                  <span className="font-body font-bold text-[16px] text-white capitalize">
                    {pair[0]}
                  </span>
                  <span className="text-coral text-[16px]">❤️</span>
                  <span className="font-body font-bold text-[16px] text-white capitalize">
                    {pair[1]}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Bottom Info */}
          <div className="mt-8 flex items-center gap-6">
            <ProgressStars
              stars={Math.min(3, matchedPairs.length) as 0 | 1 | 2 | 3}
              size={20}
            />
            <span className="font-body text-[14px] text-white/60">
              {matchedPairs.length} / {totalPairs} pairs found
            </span>
          </div>

          <p className="font-body text-[18px] text-white/80 mt-4 text-center">
            Tap two words that rhyme!
          </p>
        </>
      )}
    </div>
  );
}

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameProps } from './types';
import ProgressStars from '@/components/ProgressStars';
import ConfettiCelebration from '@/components/ConfettiCelebration';
import { speak } from '@/lib/speech';
import { playCorrectChime, playSoftBuzz } from '@/lib/audio';
import { SIGHT_WORDS } from '@/lib/gameData';
import { saveProgress } from '@/lib/progress';

const GAME_ID = 'sight-word-memory';

function getWordsForDifficulty(difficulty: string): string[] {
  switch (difficulty) {
    case 'easy':
      return SIGHT_WORDS.level1.slice(0, 10);
    case 'medium':
      return [...SIGHT_WORDS.level1.slice(10), ...SIGHT_WORDS.level2.slice(0, 10)];
    case 'hard':
      return [...SIGHT_WORDS.level2, ...SIGHT_WORDS.level3];
    default:
      return SIGHT_WORDS.level1;
  }
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface Card {
  id: number;
  word: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export default function SightWordMemory({
  difficulty,
  onScoreUpdate,
  onComplete,
  isSoundEnabled,
}: GameProps) {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [isMemorizing, setIsMemorizing] = useState(true);
  const [gameComplete, setGameComplete] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [stars, setStars] = useState<0 | 1 | 2 | 3>(0);
  const [totalPairs, setTotalPairs] = useState(0);
  const [shakeCards, setShakeCards] = useState<number[]>([]);
  const [startTime, setStartTime] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isProcessingRef = useRef(false);

  const getPairCount = useCallback(() => {
    switch (difficulty) {
      case 'easy': return 3;
      case 'medium': return 6;
      case 'hard': return 10;
      default: return 3;
    }
  }, [difficulty]);

  const getMemorizationTime = useCallback(() => {
    switch (difficulty) {
      case 'easy': return 3000;
      case 'medium': return 2000;
      case 'hard': return 1500;
      default: return 3000;
    }
  }, [difficulty]);

  const calculateStars = useCallback(
    (totalMoves: number, totalPairsCount: number, wrongAttempts: number) => {
      const minMoves = totalPairsCount;
      if (totalMoves <= minMoves) return 3;
      if (totalMoves <= minMoves * 1.5 && wrongAttempts <= 3) return 2;
      return 1;
    },
    []
  );

  const initGame = useCallback(() => {
    const pairCount = getPairCount();
    setTotalPairs(pairCount);
    const wordPool = getWordsForDifficulty(difficulty);
    const selectedWords = shuffleArray(wordPool).slice(0, pairCount);
    const pairs = [...selectedWords, ...selectedWords];
    const shuffled = shuffleArray(pairs);

    const newCards: Card[] = shuffled.map((word, i) => ({
      id: i,
      word,
      isFlipped: true,
      isMatched: false,
    }));

    setCards(newCards);
    setFlippedIndices([]);
    setScore(0);
    setMoves(0);
    setMatchedPairs(0);
    setIsMemorizing(true);
    setGameComplete(false);
    setShowConfetti(false);
    setStars(0);
    setShakeCards([]);
    setStartTime(Date.now());
    setElapsedTime(0);
    isProcessingRef.current = false;

    if (isSoundEnabled) {
      setTimeout(() => {
        speak('Remember the words!', { rate: 0.7, pitch: 1.1 });
      }, 300);
    }

    // Flip cards face-down after memorization period
    setTimeout(() => {
      setCards((prev) =>
        prev.map((c) => ({ ...c, isFlipped: false }))
      );
      setIsMemorizing(false);
    }, getMemorizationTime());
  }, [difficulty, getPairCount, getMemorizationTime, isSoundEnabled]);

  // Start game on mount
  useEffect(() => {
    initGame();
  }, [initGame]);

  // Timer
  useEffect(() => {
    if (!isMemorizing && !gameComplete) {
      timerRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isMemorizing, gameComplete, startTime]);

  const handleCardClick = useCallback(
    (index: number) => {
      if (
        isMemorizing ||
        gameComplete ||
        isProcessingRef.current ||
        cards[index]?.isFlipped ||
        cards[index]?.isMatched
      )
        return;

      const card = cards[index];
      const newFlipped = [...flippedIndices, index];
      setFlippedIndices(newFlipped);
      setCards((prev) =>
        prev.map((c, i) => (i === index ? { ...c, isFlipped: true } : c))
      );

      if (isSoundEnabled) {
        speak(card.word, { rate: 0.7, pitch: 1.1 });
      }

      // First card flipped
      if (newFlipped.length === 1) return;

      // Second card - check match
      setMoves((prev) => prev + 1);
      isProcessingRef.current = true;

      const firstIndex = newFlipped[0];
      const firstCard = cards[firstIndex];

      if (firstCard.word === card.word) {
        // Match!
        const newScore = score + 10;
        setScore(newScore);
        onScoreUpdate(newScore);
        setMatchedPairs((prev) => prev + 1);

        if (isSoundEnabled) {
          playCorrectChime();
        }

        setTimeout(() => {
          setCards((prev) =>
            prev.map((c, i) =>
              i === firstIndex || i === index ? { ...c, isMatched: true } : c
            )
          );
          setFlippedIndices([]);
          isProcessingRef.current = false;

          // Check if all matched
          if (matchedPairs + 1 === totalPairs) {
            const totalMoves = moves + 1;
            const wrongAttempts = totalMoves - totalPairs;
            const s = calculateStars(totalMoves, totalPairs, wrongAttempts);
            setStars(s as 0 | 1 | 2 | 3);
            setGameComplete(true);
            setShowConfetti(true);
            onComplete(s);
            saveProgress(GAME_ID, s as 0 | 1 | 2 | 3, newScore, []);
          }
        }, 400);
      } else {
        // No match
        if (isSoundEnabled) {
          playSoftBuzz();
        }
        setShakeCards([firstIndex, index]);

        setTimeout(() => {
          setCards((prev) =>
            prev.map((c, i) =>
              i === firstIndex || i === index ? { ...c, isFlipped: false } : c
            )
          );
          setFlippedIndices([]);
          setShakeCards([]);
          isProcessingRef.current = false;
        }, 1000);
      }
    },
    [
      cards,
      flippedIndices,
      isMemorizing,
      gameComplete,
      isSoundEnabled,
      score,
      onScoreUpdate,
      matchedPairs,
      totalPairs,
      moves,
      calculateStars,
      onComplete,
    ]
  );

  const handlePlayAgain = useCallback(() => {
    initGame();
  }, [initGame]);

  // Grid columns based on difficulty
  const gridCols =
    difficulty === 'easy' ? 'grid-cols-3' : difficulty === 'medium' ? 'grid-cols-4' : 'grid-cols-5';

  return (
    <div className="flex flex-col items-center justify-center h-full text-white px-4">
      <ConfettiCelebration trigger={showConfetti} />

      {/* Header info */}
      <div className="flex items-center gap-6 mb-4">
        <span className="font-body font-bold text-[16px] text-white/80">
          Pairs: {matchedPairs}/{totalPairs}
        </span>
        <span className="font-body font-bold text-[16px] text-white/80">
          Moves: {moves}
        </span>
        <span className="font-body font-bold text-[16px] text-white/80">
          Time: {elapsedTime}s
        </span>
        <ProgressStars stars={stars} size={20} />
      </div>

      <AnimatePresence mode="wait">
        {!gameComplete ? (
          <motion.div
            key="game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-6"
          >
            {/* Memorizing overlay */}
            <AnimatePresence>
              {isMemorizing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="mb-2 px-4 py-2 bg-white/20 rounded-full"
                >
                  <span className="font-body font-bold text-[16px]">
                    Memorize the words!
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Card grid */}
            <div className={`grid ${gridCols} gap-4`}>
              {cards.map((card, index) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    ...(shakeCards.includes(index) ? { x: [-4, 4, -4, 4, 0] } : {}),
                  }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => handleCardClick(index)}
                  className="cursor-pointer"
                  style={{ perspective: '600px' }}
                >
                  <motion.div
                    className="relative w-[100px] h-[120px]"
                    animate={{ rotateY: card.isFlipped || card.isMatched ? 180 : 0 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    {/* Card front (face-down) */}
                    <div
                      className="absolute inset-0 rounded-2xl border-[3px] border-coral flex items-center justify-center"
                      style={{
                        backfaceVisibility: 'hidden',
                        background: 'linear-gradient(135deg, #008080 0%, #005555 100%)',
                      }}
                    >
                      <span className="text-[40px] opacity-30">🐾</span>
                    </div>

                    {/* Card back (face-up) */}
                    <div
                      className={`absolute inset-0 rounded-2xl border-[3px] flex items-center justify-center ${
                        card.isMatched
                          ? 'border-success-green bg-[#E8F5E9] shadow-glow-correct'
                          : 'border-ocean-teal bg-white'
                      }`}
                      style={{
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                      }}
                    >
                      <span
                        className={`font-body font-extrabold text-[24px] ${
                          card.isMatched ? 'text-success-green' : 'text-deep-teal'
                        }`}
                      >
                        {card.word}
                      </span>
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          /* Completion screen */
          <motion.div
            key="complete"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="flex flex-col items-center gap-6"
          >
            <div className="text-[80px]">🎉</div>
            <h3 className="font-display text-[36px] text-white">Amazing Memory!</h3>
            <p className="font-body text-[20px] text-white/80">
              You found all {totalPairs} pairs in {moves} moves!
            </p>
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center">
                <span className="font-display text-[36px] text-white">{score}</span>
                <span className="font-body text-[12px] text-white/60">points</span>
              </div>
              <div className="w-px h-10 bg-white/30" />
              <div className="flex flex-col items-center">
                <span className="font-display text-[36px] text-white">{elapsedTime}s</span>
                <span className="font-body text-[12px] text-white/60">time</span>
              </div>
            </div>
            <ProgressStars stars={stars} size={32} />
            <button
              onClick={handlePlayAgain}
              className="mt-4 px-8 py-3 bg-coral text-white rounded-full font-body font-bold text-[18px] shadow-button hover:shadow-button-hover hover:scale-105 transition-all"
            >
              Play Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instruction */}
      <p className="mt-6 font-body font-bold text-[18px] text-white/70 text-center">
        {gameComplete
          ? 'You matched them all!'
          : isMemorizing
            ? 'Look carefully at all the words...'
            : 'Tap a card to flip it. Find the matching pairs!'}
      </p>
    </div>
  );
}

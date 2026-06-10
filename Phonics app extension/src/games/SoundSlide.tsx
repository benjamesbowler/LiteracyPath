import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameProps } from './types';
import ProgressStars from '@/components/ProgressStars';
import ConfettiCelebration from '@/components/ConfettiCelebration';
import { speak, speakPhoneme } from '@/lib/speech';
import { playCorrectChime } from '@/lib/audio';
import { CVC_WORDS } from '@/lib/gameData';
import { saveProgress } from '@/lib/progress';

const GAME_ID = 'sound-slide';
const TOTAL_ROUNDS = 8;

const WORD_EMOJIS: Record<string, string> = {
  cat: '🐱', dog: '🐶', sun: '☀️', hat: '🎩', bat: '🦇',
  car: '🚗', pen: '🖊️', bed: '🛏️', red: '🔴', bus: '🚌',
  cup: '☕', bug: '🐛', run: '🏃', box: '📦', fox: '🦊',
  map: '🗺️', lip: '💋', leg: '🦵', pig: '🐷', top: '🔝',
  ship: '🚢', fish: '🐟', frog: '🐸', crab: '🦀', tree: '🌳',
  star: '⭐', flag: '🚩', sock: '🧦', lamp: '🛋️', ring: '💍',
  brush: '🖌️', clock: '🕐', train: '🚂', plant: '🌱', shirt: '👕',
  bread: '🍞', dress: '👗', glass: '🥛', stamp: '📮',
};

function getWordsForDifficulty(difficulty: string): string[] {
  switch (difficulty) {
    case 'easy':
      return CVC_WORDS.easy;
    case 'medium':
      return [...CVC_WORDS.easy, ...CVC_WORDS.medium];
    case 'hard':
      return [...CVC_WORDS.medium, ...CVC_WORDS.hard];
    default:
      return CVC_WORDS.easy;
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

function pickRandomWord(words: string[], used: Set<string>): string {
  const available = words.filter((w) => !used.has(w));
  if (available.length === 0) {
    used.clear();
    return words[Math.floor(Math.random() * words.length)];
  }
  return available[Math.floor(Math.random() * available.length)];
}

interface TilePosition {
  x: number;
  y: number;
}

export default function SoundSlide({
  difficulty,
  onScoreUpdate,
  onComplete,
  isSoundEnabled,
}: GameProps) {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [targetWord, setTargetWord] = useState('');
  const [placedLetters, setPlacedLetters] = useState<(string | null)[]>([null, null, null]);
  const [bankLetters, setBankLetters] = useState<string[]>([]);
  const [, setTilePositions] = useState<Record<number, TilePosition>>({});
  const [showConfetti, setShowConfetti] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [stars, setStars] = useState<0 | 1 | 2 | 3>(0);
  const [trackGlow, setTrackGlow] = useState(false);
  const [blending, setBlending] = useState(false);
  const [activeDragging, setActiveDragging] = useState<number | null>(null);
  const [wrongCount, setWrongCount] = useState(0);
  const usedWordsRef = useRef<Set<string>>(new Set());
  const boardRef = useRef<HTMLDivElement>(null);
  const zonePositionsRef = useRef<[{ x: number; y: number }, { x: number; y: number }, { x: number; y: number }]>([
    { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 },
  ]);

  const getSnapThreshold = () => 60;

  const calculateStars = useCallback(
    (completedRounds: number, wrongs: number) => {
      if (completedRounds >= TOTAL_ROUNDS && wrongs === 0) return 3;
      if (completedRounds >= 6) return 2;
      if (completedRounds >= 3) return 1;
      return 0;
    },
    []
  );

  const startNewRound = useCallback(
    (currentRound: number, currentScore: number, currentWrong: number) => {
      if (currentRound >= TOTAL_ROUNDS) {
        const s = calculateStars(currentRound, currentWrong) as 0 | 1 | 2 | 3;
        setStars(s);
        setGameComplete(true);
        setShowConfetti(true);
        onComplete(s);
        saveProgress(GAME_ID, s, currentScore, Array.from(usedWordsRef.current));
        return;
      }

      const wordPool = getWordsForDifficulty(difficulty);
      const word = pickRandomWord(wordPool, usedWordsRef.current);
      usedWordsRef.current.add(word);
      setTargetWord(word);
      setPlacedLetters([null, null, null]);
      setTrackGlow(false);
      setBlending(false);
      setActiveDragging(null);

      // Build letter bank with distractors
      const correctLetters = word.split('');
      const distractorCount =
        difficulty === 'easy' ? 0 : difficulty === 'medium' ? 2 : 5;

      let distractors: string[] = [];
      if (distractorCount > 0) {
        const allLetters = 'abcdefghijklmnopqrstuvwxyz'.split('').filter(
          (l) => !correctLetters.includes(l)
        );
        distractors = shuffleArray(allLetters).slice(0, distractorCount);
      }

      const bank = shuffleArray([...correctLetters, ...distractors]);
      setBankLetters(bank);
      setTilePositions({});

      if (isSoundEnabled) {
        setTimeout(() => {
          speak(`Slide the letters to spell... ${word}!`, { rate: 0.7, pitch: 1.1 });
        }, 400);
      }
    },
    [difficulty, isSoundEnabled, onComplete, calculateStars]
  );

  // Start first round
  useEffect(() => {
    if (round === 0 && targetWord === '') {
      startNewRound(0, 0, 0);
    }
  }, [round, targetWord, startNewRound]);

  // Measure landing zone positions
  useEffect(() => {
    const updatePositions = () => {
      if (!boardRef.current) return;
      const boardRect = boardRef.current.getBoundingClientRect();
      const zones = boardRef.current.querySelectorAll('[data-landing-zone]');
      zones.forEach((zone, i) => {
        const rect = zone.getBoundingClientRect();
        zonePositionsRef.current[i] = {
          x: rect.left - boardRect.left + rect.width / 2,
          y: rect.top - boardRect.top + rect.height / 2,
        };
      });
    };

    // Delay to ensure DOM is rendered
    const timeout = setTimeout(updatePositions, 100);
    window.addEventListener('resize', updatePositions);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', updatePositions);
    };
  }, [bankLetters, targetWord]);

  const handleDragEnd = useCallback(
    (bankIndex: number, letter: string, info: { point: { x: number; y: number } }) => {
      setActiveDragging(null);

      if (!boardRef.current) return;
      const boardRect = boardRef.current.getBoundingClientRect();
      const dropX = info.point.x - boardRect.left;
      const dropY = info.point.y - boardRect.top;

      // Find the closest empty landing zone
      const threshold = getSnapThreshold();
      let bestZone = -1;
      let bestDist = Infinity;

      for (let i = 0; i < 3; i++) {
        if (placedLetters[i] !== null) continue; // Skip filled zones
        const zone = zonePositionsRef.current[i];
        const dist = Math.sqrt(
          Math.pow(dropX - zone.x, 2) + Math.pow(dropY - zone.y, 2)
        );
        if (dist < threshold && dist < bestDist) {
          bestDist = dist;
          bestZone = i;
        }
      }

      if (bestZone !== -1 && letter === targetWord[bestZone]) {
        // Correct placement!
        const newPlaced = [...placedLetters];
        newPlaced[bestZone] = letter;
        setPlacedLetters(newPlaced);
        setTilePositions((prev) => ({ ...prev, [bankIndex]: { x: 0, y: 0 } }));

        if (isSoundEnabled) {
          speakPhoneme(letter);
          playCorrectChime();
        }

        const newScore = score + 15;
        setScore(newScore);
        onScoreUpdate(newScore);

        // Check if all placed
        if (newPlaced.every((l) => l !== null)) {
          const bonusScore = newScore + 25;
          setScore(bonusScore);
          onScoreUpdate(bonusScore);
          setTrackGlow(true);

          // Blending sequence
          setBlending(true);
          if (isSoundEnabled) {
            const letters = targetWord.split('');
            letters.forEach((l, i) => {
              setTimeout(() => speakPhoneme(l), i * 600);
            });
            setTimeout(() => {
              speak(targetWord, { rate: 0.6, pitch: 1.1 });
            }, letters.length * 600 + 300);
          }

          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 2000);

          setTimeout(() => {
            const nextRound = round + 1;
            setRound(nextRound);
            startNewRound(nextRound, bonusScore, wrongCount);
          }, 2500);
        }
      } else if (bestZone !== -1) {
        // Wrong zone - snap back
        setWrongCount((prev) => prev + 1);
        // Tile springs back automatically due to drag constraints
        if (isSoundEnabled) {
          // Play soft feedback
        }
      }
      // If dropped far from any zone, tile springs back naturally
    },
    [placedLetters, targetWord, score, onScoreUpdate, wrongCount, isSoundEnabled, round, startNewRound]
  );

  const handlePlayAgain = useCallback(() => {
    usedWordsRef.current.clear();
    setRound(0);
    setScore(0);
    setWrongCount(0);
    setGameComplete(false);
    setShowConfetti(false);
    setStars(0);
    setTargetWord('');
    setPlacedLetters([null, null, null]);
    setBankLetters([]);
    setTilePositions({});
    setTrackGlow(false);
    setBlending(false);
    onScoreUpdate(0);
    setTimeout(() => {
      startNewRound(0, 0, 0);
    }, 100);
  }, [onScoreUpdate, startNewRound]);

  const showPicture = difficulty !== 'hard';

  return (
    <div className="flex flex-col items-center justify-center h-full text-white px-4">
      <ConfettiCelebration trigger={showConfetti} />

      {/* Header info */}
      <div className="flex items-center gap-6 mb-4">
        <span className="font-body font-bold text-[16px] text-white/80">
          Word {Math.min(round + 1, TOTAL_ROUNDS)} of {TOTAL_ROUNDS}
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
            className="flex flex-col items-center gap-6 w-full max-w-[600px]"
          >
            {/* Target emoji */}
            {showPicture && (
              <motion.div
                key={targetWord}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="text-[100px] leading-none select-none"
              >
                {WORD_EMOJIS[targetWord] ?? '🎯'}
              </motion.div>
            )}

            {/* Slide track with landing zones */}
            <div
              ref={boardRef}
              className="relative w-full"
            >
              <motion.div
                className="w-full h-[120px] rounded-full flex items-center justify-around px-8"
                style={{
                  background: trackGlow
                    ? 'linear-gradient(90deg, #FFC857, #FFD700)'
                    : 'linear-gradient(90deg, #FF7F50, #FFC857)',
                  boxShadow: trackGlow
                    ? '0 0 30px rgba(255, 200, 87, 0.6)'
                    : '0 4px 20px rgba(0,0,0,0.2)',
                }}
                animate={
                  trackGlow
                    ? { scale: [1, 1.02, 1] }
                    : blending
                      ? { scale: [1, 1.01, 1] }
                      : {}
                }
                transition={{ duration: 0.5 }}
              >
                {/* Landing zones */}
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    data-landing-zone={i}
                    className="relative"
                  >
                    <motion.div
                      className={`w-[80px] h-[80px] rounded-full border-[3px] border-dashed flex items-center justify-center transition-all duration-300 ${
                        placedLetters[i]
                          ? 'border-success-green bg-white shadow-glow-correct'
                          : activeDragging !== null &&
                            difficulty === 'easy' &&
                            bankLetters[activeDragging] === targetWord[i]
                            ? 'border-coral bg-white/30 shadow-[0_0_15px_rgba(255,127,80,0.4)]'
                            : 'border-white/50 bg-white/10'
                      }`}
                      animate={
                        placedLetters[i]
                          ? { scale: [1, 1.1, 1] }
                          : activeDragging !== null &&
                            difficulty === 'easy' &&
                            bankLetters[activeDragging] === targetWord[i]
                          ? { scale: [1, 1.08, 1] }
                          : {}
                      }
                      transition={{ duration: 0.4 }}
                    >
                      {placedLetters[i] ? (
                        <motion.span
                          initial={{ scale: 0, rotate: -10 }}
                          animate={{ scale: 1, rotate: 0 }}
                          className="text-[36px] font-display text-success-green uppercase"
                        >
                          {placedLetters[i]}
                        </motion.span>
                      ) : (
                        <span className="text-white/30 text-[24px] font-display">
                          {i + 1}
                        </span>
                      )}
                    </motion.div>

                    {/* Speaker icon between zones */}
                    {i < 2 && placedLetters[i] && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute right-[-20px] top-1/2 -translate-y-1/2 text-[16px]"
                      >
                        🔊
                      </motion.div>
                    )}
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Blending indicator */}
            <AnimatePresence>
              {blending && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="font-display text-[28px] text-golden"
                >
                  {targetWord
                    .split('')
                    .map((l) => l.toUpperCase())
                    .join(' ... ')}{' '}
                  = {targetWord.toUpperCase()}!
                </motion.div>
              )}
            </AnimatePresence>

            {/* Draggable letter tiles */}
            <div className="flex flex-wrap justify-center gap-4 mt-2">
              {bankLetters.map((letter, index) => {
                // Check if this letter instance is already placed
                const alreadyPlaced = placedLetters.some((l, pi) => l === letter && targetWord[pi] === letter);

                if (alreadyPlaced && bankLetters.filter((b, bi) => b === letter && bi <= index).length <= placedLetters.filter((p) => p === letter).length) {
                  return null;
                }

                return (
                  <motion.div
                    key={`${letter}-${index}`}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.06 }}
                  >
                    <motion.div
                      drag={!gameComplete}
                      dragMomentum={false}
                      dragConstraints={boardRef}
                      onDragStart={() => setActiveDragging(index)}
                      onDragEnd={(_, info) => handleDragEnd(index, letter, info)}
                      whileDrag={{
                        scale: 1.1,
                        rotate: 5,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                        zIndex: 10,
                      }}
                      whileHover={{ y: -4 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-[72px] h-20 rounded-2xl border-[3px] border-ocean-teal bg-white flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
                      style={{ touchAction: 'none' }}
                    >
                      <span className="text-[48px] font-display text-ocean-teal uppercase pointer-events-none">
                        {letter}
                      </span>
                    </motion.div>
                  </motion.div>
                );
              })}
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
            <h3 className="font-display text-[36px] text-white">Fantastic Sliding!</h3>
            <p className="font-body text-[20px] text-white/80">
              You completed {TOTAL_ROUNDS} words!
            </p>
            <div className="flex items-center gap-3">
              <span className="font-display text-[48px] text-white">{score}</span>
              <span className="font-body text-[18px] text-white/70">points</span>
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
          ? 'Amazing blending skills!'
          : 'Drag the letters onto the slide track to spell the word!'}
      </p>
    </div>
  );
}

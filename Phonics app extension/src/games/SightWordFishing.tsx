import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameProps } from './types';
import { speak, cancelSpeech } from '@/lib/speech';
import { playCorrectChime, playSoftBuzz, playCelebrationFanfare } from '@/lib/audio';

import { saveProgress } from '@/lib/progress';
import ProgressStars from '@/components/ProgressStars';
import ConfettiCelebration from '@/components/ConfettiCelebration';

interface Fish {
  word: string;
  id: number;
  x: number;
  y: number;
  caught: boolean;
  isWrong: boolean;
  animDuration: number;
  bobDuration: number;
  rotDuration: number;
}

const FISH_WORDS_POOL_EASY = [
  ['the', 'and', 'is', 'a'],
  ['in', 'to', 'of', 'it'],
  ['you', 'he', 'was', 'for'],
  ['on', 'are', 'as', 'with'],
];

const FISH_WORDS_POOL_MEDIUM = [
  ['the', 'and', 'is', 'to', 'of', 'a'],
  ['in', 'you', 'it', 'he', 'was', 'for'],
  ['on', 'are', 'as', 'with', 'his', 'they'],
];

const FISH_WORDS_POOL_HARD = [
  ['the', 'they', 'then', 'them', 'there'],
  ['and', 'as', 'are', 'was', 'has'],
  ['is', 'his', 'this', 'has', 'was'],
  ['for', 'from', 'of', 'off', 'on'],
];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function SightWordFishing({ difficulty, onScoreUpdate, onComplete, isSoundEnabled }: GameProps) {
  const [round, setRound] = useState(0);
  const [fish, setFish] = useState<Fish[]>([]);
  const [targetWord, setTargetWord] = useState('');
  const [score, setScore] = useState(0);
  const [stars, setStars] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [showTarget, setShowTarget] = useState(true);
  const [caughtFish, setCaughtFish] = useState<number | null>(null);
  const [rodAnimating, setRodAnimating] = useState(false);
  const [wordsFound, setWordsFound] = useState<string[]>([]);
  const startTimeRef = useRef(Date.now());
  const hasStartedRef = useRef(false);
  const pondRef = useRef<HTMLDivElement>(null);

  const wordsPerRound = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 6 : 8;
  const totalRounds = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 7 : 10;
  const swimSpeedMult = difficulty === 'easy' ? 1.5 : difficulty === 'hard' ? 0.6 : 1;

  const wordPools = difficulty === 'easy'
    ? FISH_WORDS_POOL_EASY
    : difficulty === 'medium'
      ? FISH_WORDS_POOL_MEDIUM
      : FISH_WORDS_POOL_HARD;

  const initRound = useCallback((roundIdx: number) => {
    const poolIdx = roundIdx % wordPools.length;
    const pool = wordPools[poolIdx];
    const shuffled = shuffleArray(pool);
    const selectedWords = shuffled.slice(0, wordsPerRound);
    const target = selectedWords[Math.floor(Math.random() * selectedWords.length)];

    const newFish: Fish[] = selectedWords.map((word, i) => ({
      word,
      id: i,
      x: 8 + (i * ((84 / wordsPerRound))),
      y: 15 + Math.random() * 60,
      caught: false,
      isWrong: false,
      animDuration: (4 + Math.random() * 3) * swimSpeedMult,
      bobDuration: 1.5 + Math.random() * 0.5,
      rotDuration: 3 + Math.random() * 2,
    }));

    setFish(newFish);
    setTargetWord(target);
    setShowTarget(true);
    setCaughtFish(null);
    setRodAnimating(false);

    if (difficulty !== 'easy') {
      const hideDelay = difficulty === 'medium' ? 3000 : 1500;
      setTimeout(() => setShowTarget(false), hideDelay);
    }

    if (isSoundEnabled) {
      setTimeout(() => {
        speak(`Can you find the word... ${target}?`, { rate: 0.7, pitch: 1.1 });
      }, 300);
    }
  }, [wordPools, wordsPerRound, difficulty, swimSpeedMult, isSoundEnabled]);

  useEffect(() => {
    startTimeRef.current = Date.now();
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      initRound(0);
    }
    return () => { cancelSpeech(); };
  }, [initRound]);

  useEffect(() => {
    if (!gameComplete) {
      onScoreUpdate(score);
    }
  }, [score, gameComplete, onScoreUpdate]);

  const handleFishTap = useCallback((fishId: number) => {
    if (rodAnimating || caughtFish !== null) return;
    const tappedFish = fish.find(f => f.id === fishId);
    if (!tappedFish || tappedFish.caught) return;

    setRodAnimating(true);

    if (tappedFish.word === targetWord) {
      // Correct!
      setCaughtFish(fishId);
      if (isSoundEnabled) playCorrectChime();

      setTimeout(() => {
        setFish(prev => prev.map(f => f.id === fishId ? { ...f, caught: true } : f));
        setScore(prev => prev + 15);
        setWordsFound(prev => [...prev, targetWord]);
        setRodAnimating(false);

        if (isSoundEnabled) {
          speak(`Yes! ${targetWord}!`, { rate: 0.7, pitch: 1.2 });
        }

        if (round + 1 >= totalRounds) {
          setTimeout(() => {
            const elapsed = (Date.now() - startTimeRef.current) / 1000;
            const timeBonus = Math.max(0, Math.floor((120 - elapsed) / 10));
            const finalScore = score + 15 + timeBonus;
            setScore(finalScore);
            onScoreUpdate(finalScore);

            const foundCount = wordsFound.length + 1;
            let earnedStars = 1;
            if (foundCount >= 7) earnedStars = 2;
            if (foundCount >= 10) earnedStars = 3;
            setStars(earnedStars);
            setGameComplete(true);
            if (isSoundEnabled) playCelebrationFanfare();
            saveProgress('sight-word-fishing', earnedStars as 0 | 1 | 2 | 3, finalScore, [...wordsFound, targetWord]);
            onComplete(earnedStars);
          }, 1000);
        } else {
          setTimeout(() => {
            setRound(prev => prev + 1);
            initRound(round + 1);
          }, 1500);
        }
      }, 600);
    } else {
      // Wrong
      setFish(prev => prev.map(f => f.id === fishId ? { ...f, isWrong: true } : f));
      if (isSoundEnabled) playSoftBuzz();

      setTimeout(() => {
        setFish(prev => prev.map(f => f.id === fishId ? { ...f, isWrong: false } : f));
        setRodAnimating(false);
        if (isSoundEnabled) {
          speak('Try again!', { rate: 0.8, pitch: 1.1 });
        }
      }, 800);
    }
  }, [fish, rodAnimating, caughtFish, targetWord, isSoundEnabled, round, totalRounds, score, wordsFound, initRound, onScoreUpdate, onComplete]);

  const handlePlayAgain = () => {
    setRound(0);
    setScore(0);
    setStars(0);
    setGameComplete(false);
    setWordsFound([]);
    startTimeRef.current = Date.now();
    hasStartedRef.current = false;
    initRound(0);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full max-w-3xl mx-auto px-4">
      <ConfettiCelebration trigger={gameComplete} />

      {gameComplete ? (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center gap-6"
        >
          <div className="bg-white/20 rounded-3xl p-8 text-center">
            <h3 className="font-display text-[36px] text-white mb-4">Great Fishing! 🎣</h3>
            <p className="font-body text-[22px] text-white mb-4">
              You caught {wordsFound.length} words!
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
          {/* Fishing Rod SVG */}
          <div className="relative w-full max-w-[500px] h-[60px] mb-2">
            <svg viewBox="0 0 400 60" className="w-full h-full" style={{ overflow: 'visible' }}>
              {/* Rod */}
              <motion.g
                animate={rodAnimating ? { rotate: [0, 15, 0] } : {}}
                transition={{ duration: 0.5 }}
                style={{ transformOrigin: '20px 50px' }}
              >
                <line x1="20" y1="50" x2="180" y2="10" stroke="#8B4513" strokeWidth="4" strokeLinecap="round" />
                <circle cx="20" cy="50" r="10" fill="#8B4513" />
                {/* Rod tip */}
                <circle cx="180" cy="10" r="3" fill="#666" />
              </motion.g>
              {/* Fishing line */}
              <motion.line
                x1="180"
                y1="10"
                x2="180"
                y2="30"
                stroke="rgba(255,255,255,0.5)"
                strokeWidth="1.5"
                strokeDasharray="4 2"
              />
            </svg>
          </div>

          {/* Target Word */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`target-${round}`}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: showTarget ? 1 : 0.3, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 text-center"
            >
              <p className="font-body text-[16px] text-white/70 mb-1">Find the word:</p>
              <div className="px-8 py-3 bg-white/20 rounded-full inline-block">
                <span className="font-display text-[36px] text-white uppercase">
                  {targetWord}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Pond */}
          <div
            ref={pondRef}
            className="relative w-full max-w-[600px] h-[320px] rounded-[32px] overflow-hidden border-4 border-white/20"
            style={{
              background: 'linear-gradient(180deg, #4DB8B8 0%, #008080 100%)',
            }}
          >
            {/* Water shimmer effect */}
            <div className="absolute inset-0 opacity-20">
              <motion.div
                className="absolute w-[200%] h-full"
                style={{
                  background: 'repeating-linear-gradient(90deg, transparent, transparent 50px, rgba(255,255,255,0.1) 50px, rgba(255,255,255,0.1) 100px)',
                }}
                animate={{ x: [0, -100] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              />
            </div>

            {/* Fish */}
            <AnimatePresence>
              {fish.map((f) => (
                <motion.button
                  key={`${round}-${f.id}`}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={
                    f.caught
                      ? { opacity: 0, scale: 0.5, y: -150 }
                      : f.isWrong
                        ? { x: [-8, 8, -8, 8, 0], scale: 1 }
                        : {
                            opacity: 1,
                            scale: 1,
                            x: [`${f.x}%`, `${f.x + 8}%`, `${f.x}%`, `${f.x - 8}%`, `${f.x}%`],
                            y: [`${f.y}%`, `${f.y - 5}%`, `${f.y}%`, `${f.y + 5}%`, `${f.y}%`],
                            rotate: [-3, 3, -3, 3, -3],
                          }
                  }
                  transition={
                    f.caught
                      ? { duration: 0.6, ease: 'easeIn' }
                      : f.isWrong
                        ? { duration: 0.3 }
                        : {
                            x: { duration: f.animDuration, repeat: Infinity, ease: 'easeInOut' },
                            y: { duration: f.bobDuration, repeat: Infinity, ease: 'easeInOut' },
                            rotate: { duration: f.rotDuration, repeat: Infinity, ease: 'easeInOut' },
                            opacity: { duration: 0.4 },
                            scale: { duration: 0.3 },
                          }
                  }
                  whileHover={!f.caught ? { scale: 1.1, zIndex: 10 } : {}}
                  whileTap={!f.caught ? { scale: 0.95 } : {}}
                  onClick={() => handleFishTap(f.id)}
                  className="absolute cursor-pointer select-none"
                  style={{
                    left: `${f.x}%`,
                    top: `${f.y}%`,
                    zIndex: f.caught ? 0 : 5,
                  }}
                  aria-label={`Fish with word ${f.word}`}
                >
                  {/* Fish shape */}
                  <div className={`
                    relative px-4 py-2 rounded-full border-[3px] font-body font-bold text-[16px] uppercase
                    transition-colors duration-200 shadow-lg
                    ${f.caught
                      ? 'border-success-green bg-success-green text-white'
                      : f.isWrong
                        ? 'border-error-red bg-error-red text-white'
                        : 'border-coral bg-white text-dark-text hover:bg-blush'
                    }
                  `}>
                    {/* Fish tail */}
                    <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-0 h-0"
                      style={{
                        borderTop: '8px solid transparent',
                        borderBottom: '8px solid transparent',
                        borderLeft: f.caught ? '10px solid #4CAF50' : f.isWrong ? '10px solid #FF5252' : '10px solid #FF7F50',
                      }}
                    />
                    {f.word}
                    {f.caught && <span className="ml-1">✓</span>}
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>

            {/* Ripple effects */}
            {rodAnimating && (
              <motion.div
                className="absolute left-1/2 top-0 w-4 h-4 rounded-full border-2 border-white/40"
                animate={{ scale: [1, 4], opacity: [0.6, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            )}
          </div>

          {/* Progress */}
          <div className="mt-6 flex items-center gap-6">
            <ProgressStars
              stars={Math.min(3, Math.floor(wordsFound.length / 3)) as 0 | 1 | 2 | 3}
              size={20}
            />
            <span className="font-body text-[14px] text-white/60">
              Word {Math.min(round + 1, totalRounds)} of {totalRounds}
            </span>
          </div>

          <p className="font-body text-[18px] text-white/80 mt-3 text-center">
            Tap the fish with the word <span className="font-bold text-golden uppercase">{targetWord}</span>!
          </p>
        </>
      )}
    </div>
  );
}

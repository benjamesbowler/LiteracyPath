import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameProps } from './types';
import { speak } from '@/lib/speech';
import { playCorrectChime, playSoftBuzz, playCelebrationFanfare } from '@/lib/audio';
import { SIGHT_WORDS } from '@/lib/gameData';
import { saveProgress } from '@/lib/progress';
import ProgressStars from '@/components/ProgressStars';
import ConfettiCelebration from '@/components/ConfettiCelebration';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Balloon {
  id: number;
  word: string;
  x: number; // percentage 0-100
  color: string;
  speed: number; // seconds to rise
  spawnDelay: number;
}

interface PopParticle {
  id: number;
  x: number;
  y: number;
  color: string;
  angle: number;
  distance: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const BALLOON_COLORS = [
  '#FF7F50', // coral
  '#FFC857', // golden
  '#87CEEB', // sky
  '#90EE90', // mint
  '#DDA0DD', // lavender
  '#FFDAB9', // peach
];

const DIFFICULTY_CONFIG = {
  easy: { balloonCount: 3, riseTimeMin: 10, riseTimeMax: 14, lives: 5, wordsToWin: 8, showTarget: true as boolean },
  medium: { balloonCount: 5, riseTimeMin: 7, riseTimeMax: 10, lives: 3, wordsToWin: 10, showTarget: false as boolean },
  hard: { balloonCount: 8, riseTimeMin: 4, riseTimeMax: 7, lives: 3, wordsToWin: 10, showTarget: false as boolean },
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickWords(difficulty: 'easy' | 'medium' | 'hard'): string[] {
  const level = difficulty === 'easy' ? 'level1' : difficulty === 'medium' ? 'level2' : 'level3';
  return shuffle(SIGHT_WORDS[level as keyof typeof SIGHT_WORDS]).slice(0, 15);
}

function getSimilarWords(word: string, pool: string[]): string[] {
  // Find words with similar starting letters or length
  return pool.filter(w => w !== word && (w[0] === word[0] || Math.abs(w.length - word.length) <= 1));
}

/* ------------------------------------------------------------------ */
/*  Pop Particles Component                                            */
/* ------------------------------------------------------------------ */

const PopParticles = memo(function PopParticles({
  particles,
}: {
  particles: PopParticle[];
}) {
  return (
    <AnimatePresence>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: p.x, y: p.y, scale: 0, opacity: 1 }}
          animate={{
            x: p.x + Math.cos(p.angle) * p.distance,
            y: p.y + Math.sin(p.angle) * p.distance,
            scale: Math.random() * 0.5 + 0.5,
            opacity: 0,
          }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="absolute z-20 rounded-full pointer-events-none"
          style={{
            width: '10px',
            height: '10px',
            backgroundColor: p.color,
          }}
        />
      ))}
    </AnimatePresence>
  );
});

/* ------------------------------------------------------------------ */
/*  Main Game Component                                                */
/* ------------------------------------------------------------------ */

export default function PopTheWord({ difficulty, onScoreUpdate, onComplete, isSoundEnabled }: GameProps) {
  const config = DIFFICULTY_CONFIG[difficulty];

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(config.lives);
  const [correctCount, setCorrectCount] = useState(0);
  const [targetWord, setTargetWord] = useState('');
  const [balloons, setBalloons] = useState<Balloon[]>([]);
  const [showTarget, setShowTarget] = useState(config.showTarget);
  const [particles, setParticles] = useState<PopParticle[]>([]);
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const [stars, setStars] = useState<0 | 1 | 2 | 3>(0);
  const [wobbleWrong, setWobbleWrong] = useState<number | null>(null);
  const [confettiTrigger, setConfettiTrigger] = useState(false);
  const [wordPool, setWordPool] = useState<string[]>([]);
  const [usedWords, setUsedWords] = useState<string[]>([]);
  const [showPlayAgain, setShowPlayAgain] = useState(false);

  const boardRef = useRef<HTMLDivElement>(null);
  const [boardHeight, setBoardHeight] = useState(600);
  const balloonIdRef = useRef(0);
  const particleIdRef = useRef(0);
  const targetHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const spawnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Update board height
  useEffect(() => {
    if (boardRef.current) {
      setBoardHeight(boardRef.current.clientHeight);
    }
    const handleResize = () => {
      if (boardRef.current) setBoardHeight(boardRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize game
  useEffect(() => {
    const words = pickWords(difficulty);
    setWordPool(words);
    const firstTarget = words[0];
    setTargetWord(firstTarget);
    setUsedWords([firstTarget]);

    if (isSoundEnabled) {
      setTimeout(() => {
        speak(`Pop the balloon with the word... ${firstTarget.toUpperCase()}!`);
      }, 500);
    }

    // Spawn initial balloons
    spawnBalloons(words, firstTarget, config.balloonCount);

    // On medium/hard, hide target after delay
    if (!config.showTarget) {
      targetHideTimerRef.current = setTimeout(() => {
        setShowTarget(false);
      }, 4000);
    }

    return () => {
      if (targetHideTimerRef.current) clearTimeout(targetHideTimerRef.current);
      if (spawnTimerRef.current) clearTimeout(spawnTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty]);

  // Continuous balloon spawning
  useEffect(() => {
    if (gameState !== 'playing') return;

    const spawnInterval = setInterval(() => {
      setBalloons(prev => {
        if (prev.length < config.balloonCount) {
          const newBalloon = createBalloon(wordPool, targetWord);
          return [...prev, newBalloon];
        }
        // Remove balloons that floated too far (we track by just keeping list manageable)
        const filtered = prev.filter(b => {
          const age = Date.now() - b.id;
          return age < b.speed * 1000 + 500;
        });
        if (filtered.length < config.balloonCount) {
          return [...filtered, createBalloon(wordPool, targetWord)];
        }
        return filtered;
      });
    }, 2500);

    return () => clearInterval(spawnInterval);
  }, [gameState, config.balloonCount, wordPool, targetWord]);

  function createBalloon(pool: string[], target: string): Balloon {
    const id = Date.now() + balloonIdRef.current++;
    // Mix of target and distractor words
    const isTargetBalloon = Math.random() < 0.25;
    let word: string;
    if (isTargetBalloon) {
      word = target;
    } else {
      const distractors = difficulty === 'hard'
        ? getSimilarWords(target, pool)
        : pool.filter(w => w !== target);
      word = distractors[Math.floor(Math.random() * distractors.length)] || target;
    }
    return {
      id,
      word,
      x: Math.random() * 75 + 5, // 5-80%
      color: BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)],
      speed: config.riseTimeMin + Math.random() * (config.riseTimeMax - config.riseTimeMin),
      spawnDelay: 0,
    };
  }

  function spawnBalloons(pool: string[], target: string, count: number) {
    const newBalloons: Balloon[] = [];
    for (let i = 0; i < count; i++) {
      const b = createBalloon(pool, target);
      b.spawnDelay = i * 800;
      newBalloons.push(b);
    }
    // Stagger spawn
    newBalloons.forEach((b, i) => {
      setTimeout(() => {
        setBalloons(prev => [...prev, b]);
      }, i * 800);
    });
  }

  const handlePop = useCallback((balloon: Balloon, _x: number, _y: number) => {
    if (gameState !== 'playing') return;

    if (balloon.word.toLowerCase() === targetWord.toLowerCase()) {
      // CORRECT!
      const speedBonus = 5;
      const newScore = score + 15 + speedBonus;
      setScore(newScore);
      onScoreUpdate(newScore);
      setCorrectCount(prev => prev + 1);

      // Remove this balloon
      setBalloons(prev => prev.filter(b => b.id !== balloon.id));

      // Particles at balloon position
      const newParticles: PopParticle[] = [];
      for (let i = 0; i < 10; i++) {
        newParticles.push({
          id: particleIdRef.current++,
          x: window.innerWidth * (balloon.x / 100) + 45,
          y: window.innerHeight * 0.4,
          color: balloon.color,
          angle: (Math.PI * 2 * i) / 10 + Math.random() * 0.3,
          distance: 30 + Math.random() * 40,
        });
      }
      setParticles(prev => [...prev, ...newParticles]);
      setTimeout(() => setParticles([]), 500);

      if (isSoundEnabled) {
        playCorrectChime();
        speak(`Yes! ${balloon.word.toUpperCase()}!`, { rate: 0.8, pitch: 1.2 });
      }

      // Check win
      const newCorrect = correctCount + 1;
      if (newCorrect >= config.wordsToWin) {
        handleWin(newScore);
        return;
      }

      // Next target
      setTimeout(() => {
        const nextTarget = wordPool.find(w => !usedWords.includes(w)) || wordPool[Math.floor(Math.random() * wordPool.length)];
        setTargetWord(nextTarget);
        setUsedWords(prev => [...prev, nextTarget]);
        setShowTarget(config.showTarget);
        if (!config.showTarget) {
          setShowTarget(true);
          targetHideTimerRef.current = setTimeout(() => setShowTarget(false), 4000);
        }
        if (isSoundEnabled) {
          speak(`Pop the balloon with the word... ${nextTarget.toUpperCase()}!`);
        }
      }, 1200);
    } else {
      // WRONG!
      setWobbleWrong(balloon.id);
      setTimeout(() => setWobbleWrong(null), 300);

      const newLives = lives - 1;
      setLives(newLives);

      if (isSoundEnabled) playSoftBuzz();

      if (newLives <= 0) {
        handleGameOver();
        return;
      }

      // Remove wrong balloon after wobble
      setTimeout(() => {
        setBalloons(prev => prev.filter(b => b.id !== balloon.id));
      }, 300);
    }
  }, [gameState, targetWord, score, correctCount, lives, wordPool, usedWords, config, isSoundEnabled, onScoreUpdate]);

  function handleWin(finalScore: number) {
    setGameState('won');
    const earnedStars: 0 | 1 | 2 | 3 = lives >= 3 ? 3 : lives >= 2 ? 2 : 1;
    setStars(earnedStars);
    setConfettiTrigger(true);
    if (isSoundEnabled) playCelebrationFanfare();
    saveProgress('pop-the-word', earnedStars, finalScore, usedWords);
    setTimeout(() => setShowPlayAgain(true), 1500);
  }

  function handleGameOver() {
    setGameState('lost');
    const earnedStars: 0 | 1 | 2 | 3 = correctCount >= 5 ? 1 : 0;
    setStars(earnedStars as 0 | 1 | 2 | 3);
    if (isSoundEnabled) playSoftBuzz();
    if (earnedStars > 0) {
      saveProgress('pop-the-word', earnedStars, score, usedWords);
    }
    setTimeout(() => setShowPlayAgain(true), 1000);
  }

  const handlePlayAgain = () => {
    setScore(0);
    setLives(config.lives);
    setCorrectCount(0);
    setBalloons([]);
    setParticles([]);
    setGameState('playing');
    setStars(0);
    setConfettiTrigger(false);
    setShowPlayAgain(false);
    setUsedWords([]);
    onScoreUpdate(0);

    const words = pickWords(difficulty);
    setWordPool(words);
    const firstTarget = words[0];
    setTargetWord(firstTarget);
    setUsedWords([firstTarget]);
    setShowTarget(config.showTarget);

    if (isSoundEnabled) {
      speak(`Pop the balloon with the word... ${firstTarget.toUpperCase()}!`);
    }
    spawnBalloons(words, firstTarget, config.balloonCount);

    if (!config.showTarget) {
      targetHideTimerRef.current = setTimeout(() => setShowTarget(false), 4000);
    }
  };

  const handleFinish = () => {
    const earnedStars = stars || (correctCount >= 5 ? 1 : 0) as 0 | 1 | 2 | 3;
    onComplete(earnedStars);
  };

  return (
    <div className="flex flex-col items-center w-full h-full relative select-none">
      <ConfettiCelebration trigger={confettiTrigger} />

      {/* Target Word Display */}
      <div className="relative z-10 mb-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={targetWord + (showTarget ? '-show' : '-hide')}
            initial={{ opacity: 0, y: -20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="bg-[rgba(0,0,0,0.35)] px-6 py-3 rounded-full"
          >
            {showTarget || gameState !== 'playing' ? (
              <p className="font-display text-[28px] text-white">
                Find: <span className="text-golden">{targetWord.toUpperCase()}</span>
              </p>
            ) : (
              <p className="font-display text-[22px] text-white/70">
                Remember the word!
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-4 mb-2 relative z-10">
        <span className="font-body font-bold text-[16px] text-white/80">
          {correctCount} / {config.wordsToWin}
        </span>
        <ProgressStars stars={Math.min(3, Math.floor(correctCount / 3)) as 0 | 1 | 2 | 3} size={16} />
      </div>

      {/* Lives */}
      <div className="flex items-center gap-1 mb-2 relative z-10">
        {Array.from({ length: config.lives }).map((_, i) => (
          <motion.span
            key={i}
            animate={i < lives ? { scale: 1 } : { scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            className="text-[22px]"
          >
            {i < lives ? '❤️' : '🤍'}
          </motion.span>
        ))}
      </div>

      {/* Balloon Board */}
      <div
        ref={boardRef}
        className="relative w-full flex-1 overflow-hidden"
        style={{ minHeight: '300px' }}
      >
        {/* Pop Particles */}
        <PopParticles particles={particles} />

        {/* Balloons */}
        <AnimatePresence>
          {balloons.map(balloon => (
            <motion.div
              key={balloon.id}
              initial={{ y: 0, opacity: 0, scale: 0.3 }}
              animate={wobbleWrong === balloon.id ? {
                rotate: [-10, 10, -10, 10, 0],
                x: [0, 10, -10, 0],
              } : {
                y: -(boardHeight + 300),
                opacity: 1,
                scale: 1,
              }}
              exit={{ scale: [1.2, 0], opacity: 0 }}
              transition={wobbleWrong === balloon.id ? { duration: 0.3 } : {
                y: { duration: balloon.speed, ease: 'linear' },
                opacity: { duration: 0.3 },
                scale: { duration: 0.2 },
              }}
              onClick={() => handlePop(balloon, balloon.x, 50)}
              className="absolute cursor-pointer"
              style={{ left: `${balloon.x}%`, bottom: '-140px' }}
            >
              <motion.div
                animate={wobbleWrong !== balloon.id ? { x: [0, 25, -25, 12, -12, 0], rotate: [-3, 3, -3, 3, -2, 2, -3] } : {}}
                transition={{ duration: 3, ease: 'easeInOut', repeat: Infinity }}
              >
                {/* Balloon body */}
                <div
                  className="relative flex items-center justify-center rounded-[50%] border-2 border-white/30"
                  style={{
                    width: '90px',
                    height: '115px',
                    background: `radial-gradient(circle at 30% 30%, ${balloon.color}ee, ${balloon.color})`,
                    boxShadow: `0 4px 15px ${balloon.color}55`,
                  }}
                >
                  <div
                    className="absolute rounded-full bg-white/25"
                    style={{ width: '18px', height: '26px', top: '16px', left: '16px' }}
                  />
                  <span
                    className="font-body font-extrabold text-[15px] z-10 select-none"
                    style={{
                      color: balloon.color === '#FFDAB9' || balloon.color === '#FFC857' || balloon.color === '#DDA0DD'
                        ? '#003333' : '#FFFFFF',
                    }}
                  >
                    {balloon.word.toUpperCase()}
                  </span>
                </div>
                {/* String */}
                <div
                  className="mx-auto"
                  style={{
                    width: '1.5px',
                    height: '32px',
                    background: 'linear-gradient(to bottom, rgba(255,255,255,0.4), rgba(255,255,255,0.05))',
                  }}
                />
              </motion.div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Game Over / Win Overlay */}
        <AnimatePresence>
          {(gameState === 'won' || gameState === 'lost') && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="absolute inset-0 flex items-center justify-center z-30"
            >
              <div className="bg-[rgba(0,0,0,0.5)] backdrop-blur-sm rounded-3xl p-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.2 }}
                >
                  <p className="text-[60px] mb-2">{gameState === 'won' ? '🎉' : '💙'}</p>
                </motion.div>
                <h3 className="font-display text-[32px] text-white mb-2">
                  {gameState === 'won' ? 'You Did It!' : 'Game Over'}
                </h3>
                <p className="font-body text-[18px] text-white/80 mb-1">
                  Score: <span className="font-display text-golden text-[28px]">{score}</span>
                </p>
                <p className="font-body text-[16px] text-white/60 mb-4">
                  Words found: {correctCount}
                </p>
                <ProgressStars stars={stars} size={28} />
                {showPlayAgain && (
                  <div className="flex gap-3 justify-center mt-6">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handlePlayAgain}
                      className="px-6 py-3 bg-coral text-white rounded-full font-body font-bold text-[16px] shadow-button hover:shadow-button-hover transition-all"
                    >
                      Play Again
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleFinish}
                      className="px-6 py-3 border-2 border-white/50 text-white rounded-full font-body font-bold text-[16px] hover:bg-white/10 transition-all"
                    >
                      Done
                    </motion.button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

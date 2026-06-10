import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameProps } from './types';
import { speak } from '@/lib/speech';
import { playCorrectChime, playSoftBuzz, playCelebrationFanfare } from '@/lib/audio';
import { SENTENCES } from '@/lib/gameData';
import { saveProgress } from '@/lib/progress';
import ProgressStars from '@/components/ProgressStars';
import ConfettiCelebration from '@/components/ConfettiCelebration';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface QuizItem {
  sentence: string;
  question: string;
  answer: string;
  options: string[];
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const CHECKPOINT_COUNT = 10;

const DIFFICULTY_CONFIG = {
  easy: {
    sentenceCount: 4,
    optionCount: 2,
    sentencesToWin: 4,
    hideSentence: false,
    hideDelay: 0,
  },
  medium: {
    sentenceCount: 7,
    optionCount: 3,
    sentencesToWin: 7,
    hideSentence: false,
    hideDelay: 0,
  },
  hard: {
    sentenceCount: 10,
    optionCount: 4,
    sentencesToWin: 10,
    hideSentence: true,
    hideDelay: 5000,
  },
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

function generateDistractors(answer: string, allAnswers: string[]): string[] {
  // Pick distractors from other answers
  const others = allAnswers.filter(a => a.toLowerCase() !== answer.toLowerCase());
  return shuffle(others);
}

function buildQuiz(difficulty: 'easy' | 'medium' | 'hard'): QuizItem[] {
  const config = DIFFICULTY_CONFIG[difficulty];
  const level = difficulty === 'easy' ? 'level1' : difficulty === 'medium' ? 'level2' : 'level3';
  const raw = SENTENCES[level as keyof typeof SENTENCES];

  if (!raw || raw.length === 0) {
    // Fallback — build from all levels
    const allLevels = [...SENTENCES.level1, ...SENTENCES.level2, ...SENTENCES.level3];
    const shuffled = shuffle(allLevels).slice(0, config.sentenceCount);
    const allAnswers = shuffled.map(s => s.answer);
    return shuffled.map(item => {
      const distractors = generateDistractors(item.answer, allAnswers);
      const opts = shuffle([item.answer, ...distractors.slice(0, config.optionCount - 1)]);
      return { sentence: item.sentence, question: item.question, answer: item.answer, options: opts };
    });
  }

  // Cycle through available sentences to fill the quota
  const pool: typeof raw = [];
  while (pool.length < config.sentenceCount) {
    pool.push(...shuffle(raw));
  }
  const selected = pool.slice(0, config.sentenceCount);
  const allAnswers = selected.map(s => s.answer);

  return selected.map(item => {
    const distractors = generateDistractors(item.answer, allAnswers);
    const opts = shuffle([item.answer, ...distractors.slice(0, config.optionCount - 1)]);
    return { sentence: item.sentence, question: item.question, answer: item.answer, options: opts };
  });
}

/* ------------------------------------------------------------------ */
/*  Main Game Component                                                */
/* ------------------------------------------------------------------ */

export default function ReadingRace({ difficulty, onScoreUpdate, onComplete, isSoundEnabled }: GameProps) {
  const config = DIFFICULTY_CONFIG[difficulty];

  const [quiz, setQuiz] = useState<QuizItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [, setSelectedOption] = useState<string | null>(null);
  const [optionStates, setOptionStates] = useState<Record<string, 'default' | 'correct' | 'wrong' | 'disabled'>>({});
  const [gameState, setGameState] = useState<'playing' | 'won'>('playing');
  const [stars, setStars] = useState<0 | 1 | 2 | 3>(0);
  const [confettiTrigger, setConfettiTrigger] = useState(false);
  const [showSentence, setShowSentence] = useState(true);
  const [showPlayAgain, setShowPlayAgain] = useState(false);
  const [carBounce, setCarBounce] = useState(false);
  const [wrongCount, setWrongCount] = useState(0);
  const [isAnswering, setIsAnswering] = useState(false);

  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize game
  useEffect(() => {
    const q = buildQuiz(difficulty);
    setQuiz(q);
    setCurrentIndex(0);
    setScore(0);
    setCorrectCount(0);
    setSelectedOption(null);
    setOptionStates({});
    setGameState('playing');
    setShowSentence(true);
    setWrongCount(0);
    setIsAnswering(false);

    if (isSoundEnabled) {
      setTimeout(() => {
        speak('Read the sentence and answer the question. Ready, set, go!', { rate: 0.75, pitch: 1.1 });
      }, 600);
    }

    if (config.hideSentence && q[0]) {
      hideTimerRef.current = setTimeout(() => setShowSentence(false), config.hideDelay);
    }

    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty]);

  const currentItem = quiz[currentIndex];

  const handleReadAloud = () => {
    if (isSoundEnabled && currentItem) {
      speak(currentItem.sentence, { rate: 0.65, pitch: 1.05 });
    }
  };

  const handleOptionSelect = useCallback((option: string) => {
    if (isAnswering || !currentItem || gameState !== 'playing') return;
    setIsAnswering(true);
    setSelectedOption(option);

    const isCorrect = option.toLowerCase() === currentItem.answer.toLowerCase();

    if (isCorrect) {
      // CORRECT!
      setOptionStates(prev => ({ ...prev, [option]: 'correct' }));
      const timeBonus = 10;
      const newScore = score + 20 + timeBonus;
      setScore(newScore);
      onScoreUpdate(newScore);
      setCorrectCount(prev => prev + 1);
      setCarBounce(true);
      setTimeout(() => setCarBounce(false), 600);

      if (isSoundEnabled) {
        playCorrectChime();
        speak(`Correct! ${option}!`, { rate: 0.8, pitch: 1.2 });
      }

      // Check if won
      const newCorrect = correctCount + 1;
      if (newCorrect >= config.sentencesToWin) {
        setTimeout(() => handleWin(newScore, newCorrect), 1500);
        return;
      }

      // Next question
      setTimeout(() => {
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);
        setSelectedOption(null);
        setOptionStates({});
        setIsAnswering(false);
        setShowSentence(true);
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        if (config.hideSentence && quiz[nextIndex]) {
          hideTimerRef.current = setTimeout(() => setShowSentence(false), config.hideDelay);
        }
      }, 1800);
    } else {
      // WRONG!
      setOptionStates(prev => ({ ...prev, [option]: 'wrong' }));
      setWrongCount(prev => prev + 1);

      if (isSoundEnabled) {
        playSoftBuzz();
        setTimeout(() => speak('Try again!', { rate: 0.8, pitch: 1.2 }), 200);
      }

      // Disable wrong option
      setTimeout(() => {
        setOptionStates(prev => ({ ...prev, [option]: 'disabled' }));
        setSelectedOption(null);
        setIsAnswering(false);
      }, 800);
    }
  }, [isAnswering, currentItem, gameState, score, correctCount, config, isSoundEnabled, onScoreUpdate, currentIndex, quiz]);

  function handleWin(finalScore: number, completed: number) {
    setGameState('won');
    const s: 0 | 1 | 2 | 3 = completed >= 10 && wrongCount === 0 ? 3 : completed >= 7 ? 2 : completed >= 4 ? 1 : 0;
    setStars(s as 0 | 1 | 2 | 3);
    setConfettiTrigger(true);
    if (isSoundEnabled) playCelebrationFanfare();
    const wordsLearned = quiz.slice(0, completed).flatMap(q => q.sentence.split(' ').filter(w => w.length > 2));
    saveProgress('reading-race', s as 0 | 1 | 2 | 3, finalScore, [...new Set(wordsLearned)]);
    setTimeout(() => setShowPlayAgain(true), 1500);
  }

  const handlePlayAgain = () => {
    setScore(0);
    setCorrectCount(0);
    setCurrentIndex(0);
    setSelectedOption(null);
    setOptionStates({});
    setGameState('playing');
    setStars(0);
    setConfettiTrigger(false);
    setShowPlayAgain(false);
    setWrongCount(0);
    setIsAnswering(false);
    onScoreUpdate(0);

    const q = buildQuiz(difficulty);
    setQuiz(q);
    setShowSentence(true);
    if (config.hideSentence && q[0]) {
      hideTimerRef.current = setTimeout(() => setShowSentence(false), config.hideDelay);
    }

    if (isSoundEnabled) {
      speak('Read the sentence and answer the question. Ready, set, go!', { rate: 0.75, pitch: 1.1 });
    }
  };

  const handleFinish = () => {
    const earnedStars = stars || (correctCount >= 4 ? 1 : 0) as 0 | 1 | 2 | 3;
    onComplete(earnedStars);
  };

  // Car progress position (percentage across track)
  const carProgress = (correctCount / CHECKPOINT_COUNT) * 100;

  return (
    <div className="flex flex-col items-center w-full h-full relative select-none">
      <ConfettiCelebration trigger={confettiTrigger} />

      {/* ===== RACE TRACK ===== */}
      <div className="w-full max-w-[700px] mb-4 relative z-10">
        <div className="relative h-[70px] rounded-full bg-[rgba(255,255,255,0.1)] border-2 border-white/20 overflow-hidden">
          {/* Track lanes */}
          <div className="absolute inset-0 flex items-center">
            {Array.from({ length: CHECKPOINT_COUNT + 1 }).map((_, i) => (
              <div
                key={i}
                className="absolute top-0 bottom-0 w-[2px] bg-white/10"
                style={{ left: `${(i / CHECKPOINT_COUNT) * 100}%` }}
              />
            ))}
          </div>

          {/* Lane markings */}
          <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-white/10" />
          <div className="absolute top-[30%] left-0 right-0 h-[2px] bg-white/5" />
          <div className="absolute bottom-[25%] left-0 right-0 h-[2px] bg-white/5" />

          {/* Checkpoints */}
          {Array.from({ length: CHECKPOINT_COUNT }).map((_, i) => (
            <div
              key={i}
              className="absolute top-1/2 -translate-y-1/2 z-0"
              style={{ left: `${(i / (CHECKPOINT_COUNT - 1)) * 92 + 4}%` }}
            >
              <div className={`w-2 h-2 rounded-full ${i < correctCount ? 'bg-golden' : 'bg-white/20'}`} />
            </div>
          ))}

          {/* Car */}
          <motion.div
            className="absolute top-1/2 z-10"
            animate={{
              left: `${Math.min(carProgress, 96)}%`,
              y: carBounce ? [0, -12, 0] : 0,
            }}
            transition={{
              left: { duration: 0.5, ease: 'easeOut' },
              y: { duration: 0.4 },
            }}
            style={{ transform: 'translateY(-50%)' }}
          >
            <motion.span
              animate={{ x: [-1, 1, -1] }}
              transition={{ duration: 0.15, repeat: Infinity }}
              className="text-[32px] block"
              style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
            >
              🏎️
            </motion.span>
          </motion.div>

          {/* Finish flag */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 z-0">
            <span className="text-[20px]">🏁</span>
          </div>
        </div>

        {/* Progress labels */}
        <div className="flex justify-between mt-1 px-2">
          <span className="font-body font-bold text-[12px] text-white/50">START</span>
          <span className="font-body font-bold text-[14px] text-white/80">
            {correctCount} / {config.sentencesToWin}
          </span>
          <span className="font-body font-bold text-[12px] text-white/50">FINISH</span>
        </div>
      </div>

      {/* ===== SENTENCE DISPLAY ===== */}
      {currentItem && (
        <div className="w-full max-w-[600px] mb-4 relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35 }}
              className="relative"
            >
              {/* Sentence pill */}
              <div className="bg-[rgba(0,0,0,0.25)] rounded-2xl px-6 py-4 flex items-center gap-3">
                {showSentence || gameState === 'won' ? (
                  <>
                    <p className="font-body font-bold text-[18px] md:text-[22px] text-white flex-1 leading-relaxed">
                      {currentItem.sentence}
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleReadAloud}
                      className="shrink-0 w-10 h-10 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors"
                      aria-label="Read sentence aloud"
                    >
                      <span className="text-[18px]">🔊</span>
                    </motion.button>
                  </>
                ) : (
                  <p className="font-body text-[16px] text-white/50 italic flex-1 text-center">
                    Sentence hidden — answer from memory!
                  </p>
                )}
              </div>

              {/* Question */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mt-3 text-center"
              >
                <p className="font-body font-bold text-[17px] text-white/90">
                  {currentItem.question}
                </p>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* ===== ANSWER OPTIONS ===== */}
      {currentItem && (
        <div className="w-full max-w-[600px] relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={`opts-${currentIndex}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
              className="flex flex-wrap gap-3 justify-center"
            >
              {currentItem.options.map((option, i) => {
                const state = optionStates[option] || 'default';
                const isDisabled = state === 'disabled';
                const isCorrect = state === 'correct';
                const isWrong = state === 'wrong';

                return (
                  <motion.button
                    key={option + i}
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{
                      opacity: isDisabled ? 0.35 : 1,
                      scale: isCorrect ? [1, 1.08, 1] : isWrong ? [1, 0.95, 1] : 1,
                      y: 0,
                    }}
                    transition={{
                      opacity: { duration: 0.2 },
                      scale: { duration: 0.3 },
                      y: { duration: 0.3, delay: i * 0.06 },
                    }}
                    whileHover={!isDisabled && !isAnswering ? { scale: 1.05, y: -3 } : {}}
                    whileTap={!isDisabled && !isAnswering ? { scale: 0.95 } : {}}
                    onClick={() => handleOptionSelect(option)}
                    disabled={isDisabled || isAnswering}
                    className={`
                      min-w-[100px] md:min-w-[120px] px-5 py-3 rounded-2xl border-[3px]
                      font-body font-bold text-[16px] md:text-[18px]
                      transition-colors duration-200 capitalize
                      disabled:cursor-not-allowed
                      ${isCorrect
                        ? 'border-success-green bg-[#E8F5E9] text-success-green shadow-glow-correct'
                        : isWrong
                          ? 'border-error-red bg-[#FFEBEE] text-error-red shadow-glow-wrong'
                          : 'border-ocean-teal bg-white text-dark-text hover:bg-blush hover:border-coral'
                      }
                    `}
                  >
                    {option}
                  </motion.button>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* ===== PROGRESS STARS ===== */}
      <div className="mt-auto pt-4 relative z-10 flex items-center gap-3">
        <ProgressStars
          stars={Math.min(3, Math.floor(correctCount / 3)) as 0 | 1 | 2 | 3}
          size={20}
        />
        <span className="font-body font-bold text-[14px] text-white/60">
          Score: {score}
        </span>
      </div>

      {/* ===== GAME WON OVERLAY ===== */}
      <AnimatePresence>
        {gameState === 'won' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center z-30 bg-[rgba(0,0,0,0.35)] backdrop-blur-sm rounded-xl"
          >
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="bg-[rgba(0,0,0,0.5)] rounded-3xl p-8 text-center"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0], y: [0, -8, 0] }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <p className="text-[60px] mb-2">🏎️🏁</p>
              </motion.div>
              <h3 className="font-display text-[32px] text-white mb-2">You Won the Race!</h3>
              <p className="font-body text-[18px] text-white/80 mb-1">
                Score: <span className="font-display text-golden text-[28px]">{score}</span>
              </p>
              <p className="font-body text-[14px] text-white/60 mb-3">
                {correctCount} correct answers
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

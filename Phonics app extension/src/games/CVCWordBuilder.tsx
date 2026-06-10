import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameProps } from './types';
import LetterTile from '@/components/LetterTile';
import ProgressStars from '@/components/ProgressStars';
import ConfettiCelebration from '@/components/ConfettiCelebration';
import { speak, speakPhoneme } from '@/lib/speech';
import { playCorrectChime, playSoftBuzz } from '@/lib/audio';
import { CVC_WORDS } from '@/lib/gameData';
import { saveProgress } from '@/lib/progress';

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

const GAME_ID = 'cvc-word-builder';
const TOTAL_ROUNDS = 10;

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

export default function CVCWordBuilder({
  difficulty,
  onScoreUpdate,
  onComplete,
  isSoundEnabled,
}: GameProps) {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [targetWord, setTargetWord] = useState('');
  const [slots, setSlots] = useState<string[]>([]);
  const [slotStates, setSlotStates] = useState<('empty' | 'filled' | 'correct' | 'wrong')[]>([
    'empty',
    'empty',
    'empty',
  ]);
  const [bankLetters, setBankLetters] = useState<string[]>([]);
  const [usedLetters, setUsedLetters] = useState<Set<number>>(new Set());
  const [tileStates, setTileStates] = useState<Record<number, 'default' | 'correct' | 'wrong'>>({});
  const [showConfetti, setShowConfetti] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [stars, setStars] = useState<0 | 1 | 2 | 3>(0);
  const [hintVisible, setHintVisible] = useState(difficulty === 'easy');
  const wrongCountRef = useRef(0);
  const usedWordsRef = useRef<Set<string>>(new Set());

  const startNewRound = useCallback(
    (currentRound: number, currentScore: number) => {
      if (currentRound >= TOTAL_ROUNDS) {
        // Calculate stars
        let s: 0 | 1 | 2 | 3 = 0;
        if (wrongCountRef.current === 0 && currentRound >= 10) s = 3;
        else if (currentRound >= 8 && wrongCountRef.current < 3) s = 2;
        else if (currentRound >= 5) s = 1;
        setStars(s);
        setGameComplete(true);
        setShowConfetti(true);
        onComplete(s);
        saveProgress(
          GAME_ID,
          s,
          currentScore,
          Array.from(usedWordsRef.current)
        );
        return;
      }

      const wordPool = getWordsForDifficulty(difficulty);
      const word = pickRandomWord(wordPool, usedWordsRef.current);
      usedWordsRef.current.add(word);
      setTargetWord(word);
      setSlots([]);
      setSlotStates(['empty', 'empty', 'empty']);
      setUsedLetters(new Set());
      setTileStates({});
      setHintVisible(difficulty === 'easy');

      // Build letter bank
      const correctLetters = word.split('');
      const distractorCount =
        difficulty === 'easy' ? 0 : difficulty === 'medium' ? 3 : 9;

      let distractors: string[] = [];
      if (distractorCount > 0) {
        const allLetters = 'abcdefghijklmnopqrstuvwxyz'.split('').filter(
          (l) => !correctLetters.includes(l)
        );
        distractors = shuffleArray(allLetters).slice(0, distractorCount);
      }

      const bank = shuffleArray([...correctLetters, ...distractors]);
      setBankLetters(bank);

      // Announce word
      if (isSoundEnabled) {
        setTimeout(() => {
          speak(`Can you spell... ${word}?`, { rate: 0.7, pitch: 1.1 });
        }, 400);
      }
    },
    [difficulty, isSoundEnabled, onComplete]
  );

  // Start first round
  useEffect(() => {
    if (round === 0 && targetWord === '') {
      startNewRound(0, 0);
    }
  }, [round, targetWord, startNewRound]);

  const handleTileClick = useCallback(
    (letter: string, bankIndex: number) => {
      if (usedLetters.has(bankIndex) || gameComplete) return;

      const currentSlotIndex = slots.length;
      if (currentSlotIndex >= 3) return;

      const targetLetter = targetWord[currentSlotIndex];

      if (letter === targetLetter) {
        // Correct!
        const newSlots = [...slots, letter];
        setSlots(newSlots);

        const newSlotStates = [...slotStates];
        newSlotStates[currentSlotIndex] = 'correct';
        setSlotStates(newSlotStates as typeof slotStates);

        const newUsed = new Set(usedLetters);
        newUsed.add(bankIndex);
        setUsedLetters(newUsed);

        setTileStates((prev) => ({ ...prev, [bankIndex]: 'correct' }));

        if (isSoundEnabled) {
          speakPhoneme(letter);
          playCorrectChime();
        }

        const newScore = score + 10;
        setScore(newScore);
        onScoreUpdate(newScore);

        // Check if word complete
        if (newSlots.length === 3) {
          const bonusScore = newScore + 20;
          setScore(bonusScore);
          onScoreUpdate(bonusScore);

          setTimeout(() => {
            if (isSoundEnabled) {
              speak(targetWord, { rate: 0.6, pitch: 1.1 });
            }
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 1500);

            // Next round after delay
            setTimeout(() => {
              const nextRound = round + 1;
              setRound(nextRound);
              startNewRound(nextRound, bonusScore);
            }, 1800);
          }, 600);
        }
      } else {
        // Wrong
        setSlotStates((prev) => {
          const next = [...prev];
          next[currentSlotIndex] = 'wrong';
          return next;
        });
        setTileStates((prev) => ({ ...prev, [bankIndex]: 'wrong' }));
        wrongCountRef.current += 1;

        if (isSoundEnabled) {
          playSoftBuzz();
        }

        // Reset slot state after flash
        setTimeout(() => {
          setSlotStates((prev) => {
            const next = [...prev];
            if (next[currentSlotIndex] === 'wrong') {
              next[currentSlotIndex] = 'empty';
            }
            return next;
          });
          setTileStates((prev) => {
            const next = { ...prev };
            delete next[bankIndex];
            return next;
          });
        }, 600);
      }
    },
    [slots, slotStates, targetWord, usedLetters, gameComplete, isSoundEnabled, score, onScoreUpdate, round, startNewRound]
  );

  const handleHearWord = useCallback(() => {
    if (isSoundEnabled && targetWord) {
      speak(targetWord, { rate: 0.6, pitch: 1.1 });
    }
  }, [isSoundEnabled, targetWord]);

  const handlePlayAgain = useCallback(() => {
    usedWordsRef.current.clear();
    wrongCountRef.current = 0;
    setRound(0);
    setScore(0);
    setGameComplete(false);
    setShowConfetti(false);
    setStars(0);
    setTargetWord('');
    setSlots([]);
    setSlotStates(['empty', 'empty', 'empty']);
    setBankLetters([]);
    setUsedLetters(new Set());
    setTileStates({});
    onScoreUpdate(0);
    setTimeout(() => {
      startNewRound(0, 0);
    }, 100);
  }, [onScoreUpdate, startNewRound]);

  const slotBaseClass =
    'w-[80px] h-[90px] rounded-2xl border-[3px] border-dashed flex items-center justify-center text-[48px] font-display transition-all duration-300';
  const slotEmptyClass = 'border-white/40 bg-white/10';
  const slotCorrectClass = 'border-success-green bg-[#E8F5E9] text-success-green shadow-glow-correct';
  const slotWrongClass = 'border-error-red bg-[#FFEBEE] text-error-red shadow-glow-wrong';
  const slotFilledClass = 'border-ocean-teal bg-white text-ocean-teal';

  function getSlotClass(index: number): string {
    const state = slotStates[index];
    if (state === 'correct') return slotCorrectClass;
    if (state === 'wrong') return slotWrongClass;
    if (state === 'filled') return slotFilledClass;
    return slotEmptyClass;
  }

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
            className="flex flex-col items-center gap-6"
          >
            {/* Target emoji */}
            <motion.div
              key={targetWord}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="text-[120px] leading-none select-none"
              aria-label={`Target word: ${targetWord}`}
            >
              {WORD_EMOJIS[targetWord] ?? '🎯'}
            </motion.div>

            {/* Word slots */}
            <div className="flex gap-4">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`${slotBaseClass} ${getSlotClass(i)}`}
                  style={{
                    boxShadow:
                      slotStates[i] === 'correct'
                        ? '0 0 20px rgba(76, 175, 80, 0.5)'
                        : slotStates[i] === 'wrong'
                          ? '0 0 20px rgba(255, 82, 82, 0.3)'
                          : undefined,
                  }}
                >
                  {slots[i] ? (
                    <motion.span
                      initial={{ scale: 0.5 }}
                      animate={{ scale: 1 }}
                      className="uppercase"
                    >
                      {slots[i].toUpperCase()}
                    </motion.span>
                  ) : hintVisible && i === 0 && difficulty === 'easy' ? (
                    <span className="text-white/20 uppercase text-[32px]">
                      {targetWord[0]?.toUpperCase()}
                    </span>
                  ) : null}
                </motion.div>
              ))}
            </div>

            {/* Hint for easy mode on remaining slots */}
            {difficulty === 'easy' && slots.length > 0 && slots.length < 3 && (
              <div className="text-white/40 text-sm font-body">
                Next letter hint: <span className="uppercase font-bold">{targetWord[slots.length]}</span>
              </div>
            )}

            {/* Letter bank */}
            <div className="flex flex-wrap justify-center gap-3 max-w-[500px] mt-2">
              {bankLetters.map((letter, index) => (
                <motion.div
                  key={`${letter}-${index}`}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                >
                  <LetterTile
                    letter={letter}
                    state={tileStates[index] || 'default'}
                    isSoundEnabled={isSoundEnabled}
                    onClick={() => handleTileClick(letter, index)}
                  />
                </motion.div>
              ))}
            </div>

            {/* Hear the Word button */}
            {difficulty !== 'hard' && (
              <button
                onClick={handleHearWord}
                className="mt-2 px-6 py-2 border-2 border-white/60 text-white rounded-full font-body font-bold text-[14px] hover:bg-white/20 transition-all"
              >
                🔊 Hear the Word
              </button>
            )}
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
            <h3 className="font-display text-[36px] text-white">Great Job!</h3>
            <p className="font-body text-[20px] text-white/80">
              You spelled {TOTAL_ROUNDS} words!
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

      {/* Instruction text */}
      <p className="mt-6 font-body font-bold text-[18px] text-white/70 text-center">
        {gameComplete
          ? 'You completed all the words!'
          : 'Build the CVC word by clicking the letters!'}
      </p>
    </div>
  );
}

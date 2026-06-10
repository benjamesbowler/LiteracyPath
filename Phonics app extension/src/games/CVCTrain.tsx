import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameProps } from './types';
import { speak, speakPhoneme, cancelSpeech } from '@/lib/speech';
import { playCorrectChime, playSoftBuzz, playTrainWhistle, playCelebrationFanfare } from '@/lib/audio';
import { CVC_WORDS } from '@/lib/gameData';
import { saveProgress } from '@/lib/progress';
import ProgressStars from '@/components/ProgressStars';
import ConfettiCelebration from '@/components/ConfettiCelebration';

const WORD_EMOJIS: Record<string, string> = {
  cat: '🐱', dog: '🐶', sun: '☀️', hat: '🎩', bat: '🦇', car: '🚗',
  pen: '🖊️', bed: '🛏️', red: '🔴', bus: '🚌', cup: '☕', bug: '🐛',
  run: '🏃', box: '📦', fox: '🦊', map: '🗺️', lip: '💋', leg: '🦵',
  pig: '🐷', top: '🪀', ship: '🚢', fish: '🐟', frog: '🐸', crab: '🦀',
  tree: '🌳', star: '⭐', flag: '🚩', sock: '🧦', lamp: '🛋️', ring: '💍',
};

const WORDS_EASY = CVC_WORDS.easy.slice(0, 10);
const WORDS_MEDIUM = [...CVC_WORDS.easy.slice(10), ...CVC_WORDS.medium.slice(0, 8)];
const WORDS_HARD = [...CVC_WORDS.medium, ...CVC_WORDS.hard];

function getWords(difficulty: string): string[] {
  if (difficulty === 'easy') return WORDS_EASY;
  if (difficulty === 'medium') return WORDS_MEDIUM;
  return WORDS_HARD;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface CarriageSlot {
  letter: string;
  filled: boolean;
  index: number;
}

export default function CVCTrain({ difficulty, onScoreUpdate, onComplete, isSoundEnabled }: GameProps) {
  const [wordIndex, setWordIndex] = useState(0);
  const [targetWord, setTargetWord] = useState('');
  const [slots, setSlots] = useState<CarriageSlot[]>([]);
  const [letterTiles, setLetterTiles] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [stars, setStars] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [trainEntering, setTrainEntering] = useState(true);
  const [trainLeaving, setTrainLeaving] = useState(false);
  const [shakingSlot, setShakingSlot] = useState<number | null>(null);
  const [puffSlot, setPuffSlot] = useState<number | null>(null);
  const [wordsCompleted, setWordsCompleted] = useState<string[]>([]);
  const startTimeRef = useRef(Date.now());
  const hasStartedRef = useRef(false);
  const wrongCountRef = useRef(0);

  const words = getWords(difficulty);
  const totalWords = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 8 : 10;
  const gameWords = words.slice(0, totalWords);

  const initWord = useCallback((idx: number) => {
    if (idx >= gameWords.length) {
      // Game complete
      const finalScore = score;
      onScoreUpdate(finalScore);

      const perfect = wrongCountRef.current === 0;
      let earnedStars = 1;
      if (wordsCompleted.length >= 8) earnedStars = 2;
      if (wordsCompleted.length >= 10 && perfect) earnedStars = 3;
      setStars(earnedStars);
      setGameComplete(true);
      if (isSoundEnabled) playCelebrationFanfare();
      saveProgress('cvc-train', earnedStars as 0 | 1 | 2 | 3, finalScore, wordsCompleted);
      onComplete(earnedStars);
      if (isSoundEnabled) {
        setTimeout(() => {
          speak(`All aboard! You completed ${wordsCompleted.length} words!`, { rate: 0.7, pitch: 1.2 });
        }, 500);
      }
      return;
    }

    const word = gameWords[idx];
    setTargetWord(word);
    setSlots(word.split('').map((letter, i) => ({ letter, filled: false, index: i })));

    // Generate letter tiles
    const correctLetters = word.split('');
    const numTiles = difficulty === 'easy' ? 3 : difficulty === 'medium' ? 6 : 9;
    const distractorCount = numTiles - 3;

    let distractors: string[] = [];
    if (distractorCount > 0) {
      const allLetters = 'abcdefghijklmnopqrstuvwxyz';
      const available = allLetters.split('').filter(l => !correctLetters.includes(l));
      distractors = shuffleArray(available).slice(0, distractorCount);
    }

    const tiles = shuffleArray([...correctLetters, ...distractors]);
    setLetterTiles(tiles);
    setTrainEntering(true);
    setTrainLeaving(false);

    if (isSoundEnabled) {
      setTimeout(() => {
        speak(`All aboard! Load the letters to spell... ${word}!`, { rate: 0.7, pitch: 1.1 });
      }, 800);
    }
  }, [gameWords, score, wordsCompleted, difficulty, isSoundEnabled, onScoreUpdate, onComplete]);

  useEffect(() => {
    startTimeRef.current = Date.now();
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      initWord(0);
    }
    return () => { cancelSpeech(); };
  }, [initWord]);

  useEffect(() => {
    if (!gameComplete) {
      onScoreUpdate(score);
    }
  }, [score, gameComplete, onScoreUpdate]);

  const handleTileClick = useCallback((letter: string) => {
    if (trainLeaving || gameComplete) return;

    // Find first empty slot
    const emptySlotIdx = slots.findIndex(s => !s.filled);
    if (emptySlotIdx === -1) return;

    if (letter === slots[emptySlotIdx].letter) {
      // Correct!
      setSlots(prev => prev.map((s, i) => i === emptySlotIdx ? { ...s, filled: true } : s));
      setScore(prev => prev + 10);
      setPuffSlot(emptySlotIdx);
      if (isSoundEnabled) {
        playCorrectChime();
        speakPhoneme(letter);
      }

      setTimeout(() => setPuffSlot(null), 600);

      // Check if all filled
      const updatedSlots = slots.map((s, i) => i === emptySlotIdx ? { ...s, filled: true } : s);
      if (updatedSlots.every(s => s.filled)) {
        // Word complete!
        setScore(prev => prev + 20);
        setWordsCompleted(prev => [...prev, targetWord]);

        if (isSoundEnabled) {
          setTimeout(() => {
            speak(`${targetWord}! Well done!`, { rate: 0.7, pitch: 1.2 });
          }, 300);
        }

        setTimeout(() => {
          setTrainLeaving(true);
          setTimeout(() => {
            setWordIndex(prev => prev + 1);
            initWord(wordIndex + 1);
          }, 800);
        }, 1200);
      }
    } else {
      // Wrong
      setShakingSlot(emptySlotIdx);
      wrongCountRef.current += 1;
      if (isSoundEnabled) {
        playSoftBuzz();
      }
      setTimeout(() => setShakingSlot(null), 400);
    }
  }, [slots, trainLeaving, gameComplete, isSoundEnabled, targetWord, wordIndex, initWord]);

  const handleSlotDrop = useCallback((slotIdx: number, letter: string) => {
    if (slots[slotIdx].filled || trainLeaving || gameComplete) return;

    if (letter === slots[slotIdx].letter) {
      setSlots(prev => prev.map((s, i) => i === slotIdx ? { ...s, filled: true } : s));
      setScore(prev => prev + 10);
      setPuffSlot(slotIdx);
      if (isSoundEnabled) {
        playCorrectChime();
        speakPhoneme(letter);
      }
      setTimeout(() => setPuffSlot(null), 600);

      const updatedSlots = slots.map((s, i) => i === slotIdx ? { ...s, filled: true } : s);
      if (updatedSlots.every(s => s.filled)) {
        setScore(prev => prev + 20);
        setWordsCompleted(prev => [...prev, targetWord]);
        if (isSoundEnabled) {
          setTimeout(() => {
            speak(`${targetWord}! Well done!`, { rate: 0.7, pitch: 1.2 });
          }, 300);
        }
        setTimeout(() => {
          setTrainLeaving(true);
          setTimeout(() => {
            setWordIndex(prev => prev + 1);
            initWord(wordIndex + 1);
          }, 800);
        }, 1200);
      }
    } else {
      setShakingSlot(slotIdx);
      wrongCountRef.current += 1;
      if (isSoundEnabled) playSoftBuzz();
      setTimeout(() => setShakingSlot(null), 400);
    }
  }, [slots, trainLeaving, gameComplete, isSoundEnabled, targetWord, wordIndex, initWord]);

  const handleWhistle = () => {
    if (isSoundEnabled) {
      playTrainWhistle();
      setScore(prev => prev + 5);
    }
  };

  const handlePlayAgain = () => {
    setWordIndex(0);
    setScore(0);
    setStars(0);
    setGameComplete(false);
    setWordsCompleted([]);
    wrongCountRef.current = 0;
    startTimeRef.current = Date.now();
    hasStartedRef.current = false;
    initWord(0);
  };

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
            <h3 className="font-display text-[36px] text-white mb-4">Train Master! 🚂</h3>
            <p className="font-body text-[22px] text-white mb-4">
              You completed {wordsCompleted.length} words!
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
          {/* Target Picture */}
          <motion.div
            key={`pic-${wordIndex}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-4 text-center"
          >
            <div className="text-[80px] leading-none">
              {WORD_EMOJIS[targetWord] || '🎯'}
            </div>
            {difficulty === 'easy' && (
              <p className="font-body text-[14px] text-white/60 mt-1 capitalize">{targetWord}</p>
            )}
          </motion.div>

          {/* Train Track Area */}
          <div className="relative w-full max-w-[700px]">
            {/* Track */}
            <div className="h-3 bg-[#666] rounded-full mb-1 relative">
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-[#444]" />
              {/* Track ties */}
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="absolute top-0 w-1 h-full bg-[#8B6914] rounded-sm"
                  style={{ left: `${(i / 11) * 100}%` }}
                />
              ))}
            </div>

            {/* Train */}
            <motion.div
              key={`train-${wordIndex}`}
              initial={{ x: '-120%' }}
              animate={
                trainLeaving
                  ? { x: '120%' }
                  : trainEntering
                    ? { x: 0 }
                    : { y: [0, -2, 0] }
              }
              transition={
                trainLeaving || trainEntering
                  ? { duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }
                  : { duration: 0.3, repeat: Infinity, ease: 'easeInOut' }
              }
              className="flex items-end gap-2 mt-2"
            >
              {/* Engine */}
              <div className="relative">
                <motion.div
                  className="w-[100px] h-[70px] bg-ocean-teal rounded-l-2xl rounded-tr-xl relative border-2 border-white/30"
                  whileTap={{ scale: 0.95 }}
                  onClick={handleWhistle}
                >
                  {/* Engine body */}
                  <div className="absolute bottom-0 left-2 w-6 h-6 rounded-full bg-deep-teal border-2 border-white/40" />
                  <div className="absolute bottom-0 left-10 w-6 h-6 rounded-full bg-deep-teal border-2 border-white/40" />
                  {/* Chimney */}
                  <div className="absolute -top-3 left-14 w-4 h-6 bg-coral rounded-t-lg" />
                  {/* Face */}
                  <div className="absolute top-3 left-3 text-[24px]">😊</div>
                  {/* Whistle button */}
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-golden rounded-full flex items-center justify-center cursor-pointer shadow-md border-2 border-white">
                    <span className="text-[12px]">🔔</span>
                  </div>
                </motion.div>
                {/* Steam puffs */}
                <AnimatePresence>
                  {puffSlot === null && (
                    <motion.div
                      className="absolute -top-6 left-14 text-white/60 text-[16px]"
                      initial={{ opacity: 0, scale: 0.5, y: 0 }}
                      animate={{ opacity: [0, 0.6, 0], scale: [0.5, 1.2, 1.5], y: [-5, -15, -25] }}
                      transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                    >
                      💨
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Carriages */}
              {slots.map((slot, i) => (
                <motion.div
                  key={`carriage-${wordIndex}-${i}`}
                  className="relative"
                  animate={shakingSlot === i ? { x: [-4, 4, -4, 4, 0] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  <div className="w-[90px] h-[60px] bg-coral/80 rounded-xl border-2 border-white/30 relative">
                    {/* Wheels */}
                    <motion.div
                      className="absolute -bottom-2 left-2 w-4 h-4 rounded-full bg-deep-teal border border-white/40"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                    <motion.div
                      className="absolute -bottom-2 right-2 w-4 h-4 rounded-full bg-deep-teal border border-white/40"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />

                    {/* Slot on top */}
                    <div
                      className={`
                        absolute -top-8 left-1/2 -translate-x-1/2 w-[50px] h-[50px] rounded-xl border-[3px] flex items-center justify-center
                        transition-colors duration-200
                        ${slot.filled
                          ? 'border-success-green bg-[#E8F5E9] shadow-glow-correct'
                          : 'border-dashed border-white/50 bg-white/10'
                        }
                      `}
                      onDragOver={(e) => {
                        e.preventDefault();
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const letter = e.dataTransfer.getData('text/plain');
                        if (letter) handleSlotDrop(i, letter);
                      }}
                    >
                      {slot.filled ? (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="font-display text-[28px] text-success-green uppercase"
                        >
                          {slot.letter}
                        </motion.span>
                      ) : (
                        difficulty === 'easy' && (
                          <span className="font-display text-[20px] text-white/20 uppercase">
                            {slot.letter}
                          </span>
                        )
                      )}
                    </div>

                    {/* Steam puff on correct placement */}
                    <AnimatePresence>
                      {puffSlot === i && (
                        <motion.div
                          className="absolute -top-12 left-1/2 -translate-x-1/2 text-[20px]"
                          initial={{ opacity: 0.8, scale: 0.5 }}
                          animate={{ opacity: 0, scale: 2, y: -20 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.6 }}
                        >
                          💨
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Letter Tiles */}
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <AnimatePresence>
              {letterTiles.map((letter, i) => {
                const isUsed = slots.some(s => s.letter === letter && s.filled);
                return (
                  <motion.button
                    key={`tile-${wordIndex}-${letter}-${i}`}
                    initial={{ opacity: 0, y: 30 }}
                    animate={
                      isUsed
                        ? { opacity: 0, scale: 0.5 }
                        : { opacity: 1, y: 0 }
                    }
                    exit={{ opacity: 0, scale: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.03 }}
                    whileHover={!isUsed ? { scale: 1.1, y: -4 } : {}}
                    whileTap={!isUsed ? { scale: 0.9 } : {}}
                    draggable={!isUsed}
                    onDragStart={(e) => {
                      (e as unknown as React.DragEvent).dataTransfer.setData('text/plain', letter);
                    }}
                    onClick={() => handleTileClick(letter)}
                    className={`
                      w-[64px] h-[72px] rounded-2xl border-[3px] font-display text-[36px] uppercase
                      flex items-center justify-center select-none cursor-pointer
                      transition-colors duration-200
                      ${isUsed
                        ? 'border-success-green bg-[#E8F5E9] text-success-green'
                        : 'border-ocean-teal bg-white text-ocean-teal hover:border-coral'
                      }
                    `}
                    aria-label={`Letter ${letter}`}
                  >
                    {letter}
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Progress */}
          <div className="mt-6 flex items-center gap-6">
            <ProgressStars
              stars={Math.min(3, Math.floor(wordsCompleted.length / 3)) as 0 | 1 | 2 | 3}
              size={20}
            />
            <span className="font-body text-[14px] text-white/60">
              Word {Math.min(wordIndex + 1, totalWords)} of {totalWords}
            </span>
          </div>

          <p className="font-body text-[18px] text-white/80 mt-3 text-center">
            Load the letters onto the train to spell <span className="font-bold text-golden capitalize">{targetWord}</span>!
          </p>
        </>
      )}
    </div>
  );
}

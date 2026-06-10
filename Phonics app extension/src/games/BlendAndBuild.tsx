import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameProps } from './types';
import { speak, speakPhoneme, cancelSpeech } from '@/lib/speech';
import { playCorrectChime, playCelebrationFanfare } from '@/lib/audio';
import { WORD_FAMILIES } from '@/lib/gameData';
import { saveProgress } from '@/lib/progress';
import ProgressStars from '@/components/ProgressStars';
import ConfettiCelebration from '@/components/ConfettiCelebration';

const FAMILY_KEYS_EASY = ['-AT', '-AN'];
const FAMILY_KEYS_MEDIUM = ['-IG', '-OP'];
const FAMILY_KEYS_HARD = ['-UN', '-EN', '-AT', '-IG'];



const WORD_EMOJIS: Record<string, string> = {
  cat: '🐱', bat: '🦇', hat: '🎩', mat: '🧘', rat: '🐀', sat: '🪑',
  can: '🥫', fan: '🪭', man: '👨', pan: '🍳', ran: '🏃', van: '🚐',
  big: '🐘', dig: '⛏️', fig: '🍇', pig: '🐷', wig: '💇',
  hop: '🐇', mop: '🧹', pop: '🎈', top: '🪀',
  sun: '☀️', fun: '🎉', run: '🏃', bun: '🍔', gun: '🔫', nun: '⛪',
  pen: '🖊️', hen: '🐔', ten: '🔟', men: '👥', den: '🐻',
};

function getOnset(word: string, rime: string): string {
  return word.slice(0, word.length - rime.length + 1);
}

function getRimeKey(familyKey: string): string {
  return familyKey.slice(1).toLowerCase();
}

export default function BlendAndBuild({ difficulty, onScoreUpdate, onComplete, isSoundEnabled }: GameProps) {
  const [currentFamilyIdx, setCurrentFamilyIdx] = useState(0);
  const [usedOnsets, setUsedOnsets] = useState<Set<string>>(new Set());
  const [builtWords, setBuiltWords] = useState<string[]>([]);
  const [animatingOnset, setAnimatingOnset] = useState<string | null>(null);
  const [showCompletion, setShowCompletion] = useState(false);
  const [score, setScore] = useState(0);
  const [stars, setStars] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const startTimeRef = useRef(Date.now());
  const hasStartedRef = useRef(false);

  const families = difficulty === 'easy' ? FAMILY_KEYS_EASY : difficulty === 'medium' ? FAMILY_KEYS_MEDIUM : FAMILY_KEYS_HARD;
  const currentFamilyKey = families[currentFamilyIdx];
  const currentWords = WORD_FAMILIES[currentFamilyKey] || [];
  const currentRime = getRimeKey(currentFamilyKey);

  const onsets = currentWords.map(w => getOnset(w, currentFamilyKey));


  const totalWordsNeeded = families.reduce((sum, fk) => sum + (WORD_FAMILIES[fk]?.length || 0), 0);

  useEffect(() => {
    startTimeRef.current = Date.now();
    if (isSoundEnabled && !hasStartedRef.current) {
      hasStartedRef.current = true;
      setTimeout(() => {
        speak("Let's build words! Tap a letter to blend it with the word ending.", { rate: 0.7, pitch: 1.1 });
      }, 500);
    }
    return () => { cancelSpeech(); };
  }, []);

  useEffect(() => {
    if (!gameComplete) {
      onScoreUpdate(score);
    }
  }, [score, gameComplete, onScoreUpdate]);

  const advanceToNextFamily = useCallback(() => {
    if (currentFamilyIdx < families.length - 1) {
      setTimeout(() => {
        setCurrentFamilyIdx(prev => prev + 1);
        setUsedOnsets(new Set());
        setBuiltWords([]);
        setAnimatingOnset(null);
      }, 1500);
    } else {
      setTimeout(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        const finalScore = score + 20;
        setScore(finalScore);
        onScoreUpdate(finalScore);

        let earnedStars = 1;
        if (builtWords.length >= totalWordsNeeded) earnedStars = 2;
        if (elapsed < 60 && builtWords.length >= totalWordsNeeded) earnedStars = 3;
        setStars(earnedStars);
        setGameComplete(true);
        if (isSoundEnabled) playCelebrationFanfare();
        saveProgress('blend-build', earnedStars as 0 | 1 | 2 | 3, finalScore, builtWords);
        if (isSoundEnabled) {
          speak(`Amazing! You built ${builtWords.length} words!`, { rate: 0.7, pitch: 1.2 });
        }
        onComplete(earnedStars);
      }, 1000);
    }
  }, [currentFamilyIdx, families.length, score, builtWords.length, totalWordsNeeded, isSoundEnabled, onScoreUpdate, onComplete]);

  const handleOnsetTap = useCallback((onset: string) => {
    if (usedOnsets.has(onset) || animatingOnset) return;

    const word = onset + currentRime;
    setAnimatingOnset(onset);

    if (isSoundEnabled) {
      speakPhoneme(onset[0].toLowerCase());
      setTimeout(() => {
        speak(currentRime, { rate: 0.6, pitch: 1.1 });
      }, 400);
      setTimeout(() => {
        speak(word, { rate: 0.7, pitch: 1.1 });
      }, 900);
    }

    setTimeout(() => {
      setUsedOnsets(prev => new Set(prev).add(onset));
      setBuiltWords(prev => [...prev, word]);
      setScore(prev => prev + 10);
      if (isSoundEnabled) playCorrectChime();
      setAnimatingOnset(null);

      const newUsedCount = usedOnsets.size + 1;
      if (newUsedCount === onsets.length) {
        setShowCompletion(true);
        setScore(prev => prev + 20);
        if (isSoundEnabled) {
          setTimeout(() => {
            const allWords = [...builtWords, word];
            speak(`Great job! You built: ${allWords.join(', ')}!`, { rate: 0.7, pitch: 1.2 });
          }, 600);
        }
        setTimeout(() => {
          setShowCompletion(false);
          advanceToNextFamily();
        }, 2000);
      }
    }, 800);
  }, [usedOnsets, animatingOnset, currentRime, isSoundEnabled, onsets.length, builtWords, advanceToNextFamily]);

  const handlePlayAgain = () => {
    setCurrentFamilyIdx(0);
    setUsedOnsets(new Set());
    setBuiltWords([]);
    setAnimatingOnset(null);
    setShowCompletion(false);
    setScore(0);
    setStars(0);
    setGameComplete(false);
    startTimeRef.current = Date.now();
    hasStartedRef.current = false;
    if (isSoundEnabled) {
      setTimeout(() => {
        speak("Let's build words! Tap a letter to blend it with the word ending.", { rate: 0.7, pitch: 1.1 });
      }, 500);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full max-w-4xl mx-auto px-4">
      <ConfettiCelebration trigger={gameComplete} />

      {/* Family Display */}
      <motion.div
        key={currentFamilyKey}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="mb-6 text-center"
      >
        <p className="font-body text-[18px] text-white/80 mb-2">
          Word Family
        </p>
        <div className="font-display text-[56px] text-white leading-none"
          style={{ textShadow: '0 0 20px rgba(255, 200, 87, 0.6)' }}>
          {currentFamilyKey}
        </div>
      </motion.div>

      {gameComplete ? (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center gap-6"
        >
          <div className="bg-white/20 rounded-3xl p-8 text-center">
            <h3 className="font-display text-[36px] text-white mb-4">All Aboard! 🎉</h3>
            <p className="font-body text-[22px] text-white mb-4">
              You built {builtWords.length} words!
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
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 w-full">
            {/* Onset Tiles Column */}
            <div className="flex flex-row md:flex-col gap-3">
              <AnimatePresence>
                {onsets.map((onset, i) => {
                  const isUsed = usedOnsets.has(onset);
                  const isAnimating = animatingOnset === onset;
                  return (
                    <motion.button
                      key={`${currentFamilyKey}-${onset}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={
                        isAnimating
                          ? { x: 80, y: -20, scale: 1.1 }
                          : isUsed
                            ? { opacity: 0.4, scale: 0.9 }
                            : { opacity: 1, y: 0, scale: 1 }
                      }
                      exit={{ opacity: 0, scale: 0.5 }}
                      transition={
                        isAnimating
                          ? { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }
                          : { duration: 0.3, delay: i * 0.05 }
                      }
                      whileHover={!isUsed && !animatingOnset ? { scale: 1.08, y: -4 } : {}}
                      whileTap={!isUsed && !animatingOnset ? { scale: 0.92 } : {}}
                      onClick={() => handleOnsetTap(onset)}
                      className={`
                        w-[72px] h-20 rounded-2xl border-[3px] font-display text-[40px]
                        flex items-center justify-center select-none
                        transition-colors duration-200
                        ${isUsed
                          ? 'border-success-green bg-[#E8F5E9] text-success-green'
                          : 'border-ocean-teal bg-white text-ocean-teal hover:border-coral cursor-pointer'
                        }
                      `}
                      aria-label={`Onset ${onset}`}
                    >
                      {isUsed ? '✓' : onset.toUpperCase()}
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Center: Rime Tile + Merging Area */}
            <div className="flex flex-col items-center gap-6">
              <motion.div
                className="relative"
                animate={showCompletion ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.5 }}
              >
                <div className="w-[100px] h-[100px] rounded-2xl border-[3px] border-golden bg-golden flex items-center justify-center shadow-lg">
                  <span className="font-display text-[40px] text-deep-teal">
                    {currentFamilyKey}
                  </span>
                </div>
                {animatingOnset && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute -left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                  >
                    <div className="text-golden text-[32px]">✨</div>
                  </motion.div>
                )}
              </motion.div>

              {/* Live merged word */}
              <AnimatePresence mode="wait">
                {animatingOnset && (
                  <motion.div
                    key={animatingOnset + currentRime}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, y: -30 }}
                    className="px-6 py-3 bg-white rounded-2xl border-[3px] border-success-green shadow-glow-correct"
                  >
                    <span className="font-display text-[36px] text-success-green">
                      {animatingOnset.toUpperCase() + currentRime.toUpperCase()}
                    </span>
                    <span className="ml-2 text-[28px]">
                      {WORD_EMOJIS[animatingOnset + currentRime] || '✨'}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Built Words Column */}
            <div className="flex flex-col gap-2 min-w-[140px]">
              <p className="font-body text-[14px] text-white/70 text-center mb-1">Built Words</p>
              <AnimatePresence>
                {builtWords.map((word, i) => (
                  <motion.div
                    key={`${currentFamilyKey}-${word}-${i}`}
                    initial={{ opacity: 0, scale: 0, x: 30 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    transition={{
                      type: 'spring',
                      stiffness: 300,
                      damping: 15,
                      delay: i * 0.05,
                    }}
                    className="px-4 py-2 bg-white/90 rounded-xl border-2 border-success-green flex items-center gap-2 shadow-md"
                  >
                    <span className="font-body font-bold text-[18px] text-dark-text capitalize">
                      {word}
                    </span>
                    <span className="text-[20px]">{WORD_EMOJIS[word] || ''}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
              {builtWords.length === 0 && (
                <div className="px-4 py-6 border-2 border-dashed border-white/30 rounded-xl text-center">
                  <span className="text-white/40 text-[14px] font-body">Tap a letter!</span>
                </div>
              )}
            </div>
          </div>

          {/* Instruction */}
          <motion.p
            key={`instruction-${currentFamilyKey}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-body text-[18px] text-white/90 mt-8 text-center"
          >
            Tap an onset letter to blend it with <span className="font-bold text-golden">{currentFamilyKey}</span>!
          </motion.p>

          {/* Progress */}
          <div className="mt-4 flex items-center gap-4">
            <ProgressStars
              stars={Math.min(3, Math.floor(builtWords.length / 2)) as 0 | 1 | 2 | 3}
              size={20}
            />
            <span className="font-body text-[14px] text-white/60">
              Family {currentFamilyIdx + 1} of {families.length}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

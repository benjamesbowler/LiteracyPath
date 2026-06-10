import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameProps } from './types';
import { speak } from '@/lib/speech';
import { playCorrectChime, playSoftBuzz, playCelebrationFanfare } from '@/lib/audio';
import { CVC_WORDS } from '@/lib/gameData';
import { saveProgress } from '@/lib/progress';
import ProgressStars from '@/components/ProgressStars';
import ConfettiCelebration from '@/components/ConfettiCelebration';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Tile {
  id: number;
  word: string;
  row: number;
  col: number; // 0 or 1 within row
  isTarget: boolean;
  state: 'default' | 'correct' | 'wrong';
}

interface Sentence {
  words: string[];
  display: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const SENTENCES: Sentence[] = [
  { words: ['the', 'cat', 'sat'], display: 'THE CAT SAT' },
  { words: ['a', 'big', 'red', 'bus'], display: 'A BIG RED BUS' },
  { words: ['i', 'can', 'run', 'fast'], display: 'I CAN RUN FAST' },
  { words: ['the', 'dog', 'is', 'in', 'box'], display: 'THE DOG IS IN THE BOX' },
  { words: ['she', 'has', 'a', 'hat'], display: 'SHE HAS A HAT' },
  { words: ['we', 'can', 'see', 'the', 'sun'], display: 'WE CAN SEE THE SUN' },
  { words: ['the', 'pig', 'is', 'big'], display: 'THE PIG IS BIG' },
  { words: ['he', 'ran', 'on', 'the', 'bus'], display: 'HE RAN ON THE BUS' },
];

const DIFFICULTY_CONFIG = {
  easy: { seqLength: 3, showWords: true, distractors: 0, sentencesToWin: 6 },
  medium: { seqLength: 4, showWords: false, distractors: 2, sentencesToWin: 6 },
  hard: { seqLength: 5, showWords: false, distractors: 4, sentencesToWin: 6 },
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

function getTilePositions(wordCount: number, distractorCount: number): { row: number; col: number }[] {
  // Traditional hopscotch pattern: row0=start(1), row1=2tiles, row2=1center, row3=2tiles, row4=1finish
  // We map words to positions
  const total = wordCount + distractorCount;
  // For simplicity, use a 3x3 grid with hopscotch pattern
  // We'll place tiles in hopscotch arrangement
  const positions: { row: number; col: number }[] = [];

  // Row 0 (bottom): 1 tile center
  positions.push({ row: 0, col: 1 });

  // Row 1: 2 tiles
  positions.push({ row: 1, col: 0 });
  if (total > 1) positions.push({ row: 1, col: 2 });

  // Row 2: 1 tile center
  if (total > 2) positions.push({ row: 2, col: 1 });

  // Row 3: 2 tiles
  if (total > 3) positions.push({ row: 3, col: 0 });
  if (total > 4) positions.push({ row: 3, col: 2 });

  // Row 4 (top): 1 tile center (finish)
  if (total > 5) positions.push({ row: 4, col: 1 });

  // Row 5: extra tiles if needed
  if (total > 6) positions.push({ row: 5, col: 0 });
  if (total > 7) positions.push({ row: 5, col: 2 });
  if (total > 8) positions.push({ row: 6, col: 1 });

  return positions.slice(0, total);
}

/* ------------------------------------------------------------------ */
/*  Dust Particles Component                                           */
/* ------------------------------------------------------------------ */

function DustParticles({ x, y }: { x: number; y: number }) {
  return (
    <AnimatePresence>
      {Array.from({ length: 4 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ x, y, scale: 0.5, opacity: 0.7 }}
          animate={{
            x: x + (Math.cos((Math.PI * 2 * i) / 4) * 25),
            y: y + (Math.sin((Math.PI * 2 * i) / 4) * 25) - 10,
            scale: 0,
            opacity: 0,
          }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="absolute z-20 rounded-full bg-white/60 pointer-events-none"
          style={{ width: '8px', height: '8px' }}
        />
      ))}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Game Component                                                */
/* ------------------------------------------------------------------ */

export default function WordHopscotch({ difficulty, onScoreUpdate, onComplete, isSoundEnabled }: GameProps) {
  const config = DIFFICULTY_CONFIG[difficulty];

  const [score, setScore] = useState(0);
  const [sentencesCompleted, setSentencesCompleted] = useState(0);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [footPosition, setFootPosition] = useState<number | null>(null);
  const [showWords, setShowWords] = useState(config.showWords);
  const [gameState, setGameState] = useState<'playing' | 'won' | 'sentenceComplete'>('playing');
  const [stars, setStars] = useState<0 | 1 | 2 | 3>(0);
  const [confettiTrigger, setConfettiTrigger] = useState(false);
  const [hoppingTo, setHoppingTo] = useState<number | null>(null);
  const [dustPos, setDustPos] = useState<{ x: number; y: number } | null>(null);
  const [wrongTile, setWrongTile] = useState<number | null>(null);
  const [showPlayAgain, setShowPlayAgain] = useState(false);
  const [sentenceList, setSentenceList] = useState<Sentence[]>([]);
  const [perfectSentences, setPerfectSentences] = useState(0);
  const [hasWrongThisSentence, setHasWrongThisSentence] = useState(false);

  const tileRefs = useRef<(HTMLDivElement | null)[]>([]);
  const boardRef = useRef<HTMLDivElement>(null);

  // Initialize
  useEffect(() => {
    const shuffled = shuffle(SENTENCES);
    setSentenceList(shuffled);
    startSentence(shuffled[0]);

    if (isSoundEnabled) {
      setTimeout(() => {
        speak('Hop to the words in the right order!');
      }, 600);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty]);

  function startSentence(sentence: Sentence) {
    const words = sentence.words;
    const wordCount = Math.min(words.length, config.seqLength);
    const targetWords = words.slice(0, wordCount);

    // Pick distractors from CVC words
    const allCvc = [...CVC_WORDS.easy, ...CVC_WORDS.medium];
    const distractorWords = shuffle(allCvc.filter(w => !targetWords.includes(w))).slice(0, config.distractors);

    const allWords = shuffle([...targetWords, ...distractorWords]);
    const positions = getTilePositions(allWords.length, config.distractors);

    const newTiles: Tile[] = allWords.map((word, i) => ({
      id: i,
      word: word.toLowerCase(),
      row: positions[i]?.row ?? 0,
      col: positions[i]?.col ?? 0,
      isTarget: targetWords.includes(word.toLowerCase()),
      state: 'default' as const,
    }));

    setTiles(newTiles);
    setCurrentWordIndex(0);
    setFootPosition(null);
    setShowWords(config.showWords);
    setGameState('playing');
    setHoppingTo(null);
    setHasWrongThisSentence(false);

    if (!config.showWords) {
      setTimeout(() => setShowWords(false), 5000);
    }

    if (isSoundEnabled) {
      const wordList = targetWords.join('... ');
      setTimeout(() => {
        speak(`Hop to: ${wordList}`);
      }, 400);
    }
  }

  const handleTileTap = useCallback((tile: Tile) => {
    if (gameState !== 'playing' || hoppingTo !== null) return;

    const sentence = sentenceList[currentSentenceIndex];
    if (!sentence) return;

    const targetWords = sentence.words.slice(0, config.seqLength);
    const expectedWord = targetWords[currentWordIndex]?.toLowerCase();

    if (tile.word === expectedWord) {
      // CORRECT!
      const tileEl = tileRefs.current[tile.id];
      const tileRect = tileEl?.getBoundingClientRect();
      const boardRect = boardRef.current?.getBoundingClientRect();

      const tileCenterX = tileRect && boardRect ? tileRect.left + tileRect.width / 2 - boardRect.left : tile.col * 110 + 55;
      const tileCenterY = tileRect && boardRect ? tileRect.top + tileRect.height / 2 - boardRect.top : tile.row * 110 + 55;

      setHoppingTo(tile.id);

      setTimeout(() => {
        setFootPosition(tile.id);
        setHoppingTo(null);
        setDustPos({ x: tileCenterX, y: tileCenterY });
        setTimeout(() => setDustPos(null), 400);

        // Mark tile as correct
        setTiles(prev => prev.map(t => t.id === tile.id ? { ...t, state: 'correct' as const } : t));

        const newScore = score + 10;
        setScore(newScore);
        onScoreUpdate(newScore);

        if (isSoundEnabled) {
          playCorrectChime();
          speak(tile.word, { rate: 0.7, pitch: 1.1 });
        }

        const newIndex = currentWordIndex + 1;
        if (newIndex >= targetWords.length) {
          // Sentence complete!
          handleSentenceComplete(newScore);
        } else {
          setCurrentWordIndex(newIndex);
        }
      }, 400);
    } else {
      // WRONG!
      setWrongTile(tile.id);
      setTimeout(() => setWrongTile(null), 400);
      setTiles(prev => prev.map(t => t.id === tile.id ? { ...t, state: 'wrong' as const } : t));
      setTimeout(() => {
        setTiles(prev => prev.map(t => t.id === tile.id ? { ...t, state: 'default' as const } : t));
      }, 500);
      setHasWrongThisSentence(true);
      if (isSoundEnabled) playSoftBuzz();
    }
  }, [gameState, hoppingTo, sentenceList, currentSentenceIndex, currentWordIndex, config.seqLength, score, isSoundEnabled, onScoreUpdate]);

  function handleSentenceComplete(currentScore: number) {
    setGameState('sentenceComplete');
    const completionBonus = 20;
    const timeBonus = 15;
    const newScore = currentScore + completionBonus + timeBonus;
    setScore(newScore);
    onScoreUpdate(newScore);

    const newCompleted = sentencesCompleted + 1;
    setSentencesCompleted(newCompleted);

    if (!hasWrongThisSentence) {
      setPerfectSentences(prev => prev + 1);
    }

    if (isSoundEnabled) {
      playCelebrationFanfare();
      const sentence = sentenceList[currentSentenceIndex];
      if (sentence) {
        speak(`${sentence.display}! Well done!`, { rate: 0.75, pitch: 1.15 });
      }
    }
    setConfettiTrigger(true);
    setTimeout(() => setConfettiTrigger(false), 2000);

    // Check win
    if (newCompleted >= config.sentencesToWin) {
      setTimeout(() => handleWin(newScore, newCompleted), 1500);
      return;
    }

    // Next sentence
    setTimeout(() => {
      const nextIndex = currentSentenceIndex + 1;
      setCurrentSentenceIndex(nextIndex);
      if (sentenceList[nextIndex]) {
        startSentence(sentenceList[nextIndex]);
      }
    }, 2000);
  }

  function handleWin(finalScore: number, completed: number) {
    setGameState('won');
    const s: 0 | 1 | 2 | 3 = completed >= 6 && perfectSentences >= 6 ? 3 : completed >= 4 ? 2 : 1;
    setStars(s);
    setConfettiTrigger(true);
    if (isSoundEnabled) playCelebrationFanfare();
    const wordsLearned = sentenceList.slice(0, completed).flatMap(s => s.words);
    saveProgress('word-hopscotch', s, finalScore, wordsLearned);
    setTimeout(() => setShowPlayAgain(true), 1500);
  }

  const handlePlayAgain = () => {
    setScore(0);
    setSentencesCompleted(0);
    setCurrentSentenceIndex(0);
    setCurrentWordIndex(0);
    setStars(0);
    setConfettiTrigger(false);
    setShowPlayAgain(false);
    setPerfectSentences(0);
    onScoreUpdate(0);

    const shuffled = shuffle(SENTENCES);
    setSentenceList(shuffled);
    startSentence(shuffled[0]);

    if (isSoundEnabled) {
      speak('Hop to the words in the right order!');
    }
  };

  const handleFinish = () => {
    const earnedStars = stars || (sentencesCompleted >= 2 ? 1 : 0) as 0 | 1 | 2 | 3;
    onComplete(earnedStars);
  };

  const sentence = sentenceList[currentSentenceIndex];
  const targetWords = sentence?.words.slice(0, config.seqLength) ?? [];

  return (
    <div className="flex flex-col items-center w-full h-full relative select-none overflow-hidden">
      <ConfettiCelebration trigger={confettiTrigger} />

      {/* Target Words Display */}
      <div className="relative z-10 mb-3 text-center min-h-[60px]">
        <AnimatePresence mode="wait">
          {showWords && gameState === 'playing' && (
            <motion.div
              key={`words-${currentSentenceIndex}`}
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-2 flex-wrap justify-center"
            >
              {targetWords.map((word, i) => (
                <div key={i} className="flex items-center gap-2">
                  <motion.span
                    animate={i === currentWordIndex ? { scale: [1, 1.15, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className={`font-display text-[20px] px-3 py-1 rounded-full ${
                      i < currentWordIndex
                        ? 'bg-success-green text-white'
                        : i === currentWordIndex
                          ? 'bg-golden text-deep-teal'
                          : 'bg-white/20 text-white'
                    }`}
                  >
                    {word.toUpperCase()}
                  </motion.span>
                  {i < targetWords.length - 1 && (
                    <span className="text-white/50 text-[16px]">→</span>
                  )}
                </div>
              ))}
            </motion.div>
          )}
          {!showWords && gameState === 'playing' && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-body text-[16px] text-white/60 italic"
            >
              Remember the words!
            </motion.p>
          )}
        </AnimatePresence>

        {/* Progress */}
        <div className="flex items-center justify-center gap-3 mt-2">
          <span className="font-body font-bold text-[14px] text-white/70">
            Sentence {sentencesCompleted + 1} / {config.sentencesToWin}
          </span>
          <ProgressStars stars={Math.min(3, Math.floor(sentencesCompleted / 2)) as 0 | 1 | 2 | 3} size={14} />
        </div>
      </div>

      {/* Hopscotch Board */}
      <div
        ref={boardRef}
        className="relative flex-1 flex items-center justify-center"
        style={{ width: '100%', maxWidth: '420px', minHeight: '350px' }}
      >
        {/* Grid */}
        <div className="relative" style={{ width: '320px', height: '420px' }}>
          {tiles.map(tile => {
            const isFootHere = footPosition === tile.id;
            const isHoppingHere = hoppingTo === tile.id;
            const isWrong = wrongTile === tile.id;
            const isCorrect = tile.state === 'correct';

            return (
              <motion.div
                key={tile.id}
                ref={el => { tileRefs.current[tile.id] = el; }}
                initial={{ opacity: 0, scale: 0.5, y: 20 }}
                animate={{
                  opacity: 1,
                  scale: isWrong ? [1, 0.9, 1.05, 1] : isCorrect ? [1, 1.08, 1] : 1,
                  y: 0,
                }}
                transition={{
                  opacity: { duration: 0.3, delay: tile.id * 0.05 },
                  scale: { duration: 0.3 },
                  y: { duration: 0.3, delay: tile.id * 0.05 },
                }}
                onClick={() => handleTileTap(tile)}
                className={`absolute cursor-pointer rounded-2xl border-[3px] flex items-center justify-center
                  ${isCorrect
                    ? 'border-success-green bg-[#E8F5E9] shadow-glow-correct'
                    : isWrong
                      ? 'border-error-red bg-[#FFEBEE] shadow-glow-wrong'
                      : 'border-coral bg-white hover:bg-blush'
                  }
                `}
                style={{
                  width: '90px',
                  height: '90px',
                  left: tile.col === 0 ? '30px' : tile.col === 2 ? '200px' : '115px',
                  bottom: `${tile.row * 95 + 10}px`,
                }}
              >
                <span className={`font-body font-bold text-[18px] select-none capitalize ${
                  isCorrect ? 'text-success-green' : isWrong ? 'text-error-red' : 'text-dark-teal-text'
                }`}>
                  {tile.word}
                </span>

                {/* Footprint */}
                <AnimatePresence>
                  {(isFootHere || isHoppingHere) && (
                    <motion.div
                      initial={isHoppingHere ? {
                        scale: 0.6,
                        x: footPosition !== null && tileRefs.current[footPosition]
                          ? tileRefs.current[footPosition]!.getBoundingClientRect().left - (tileRefs.current[tile.id]?.getBoundingClientRect().left ?? 0)
                          : 0,
                        y: footPosition !== null && tileRefs.current[footPosition]
                          ? tileRefs.current[footPosition]!.getBoundingClientRect().top - (tileRefs.current[tile.id]?.getBoundingClientRect().top ?? 0)
                          : -50,
                      } : { scale: 0.6, y: -10 }}
                      animate={{ scale: [0.8, 1.15, 1], x: 0, y: -5 }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                      className="absolute -top-2 left-1/2 -translate-x-1/2 text-[28px] z-10 pointer-events-none"
                    >
                      👣
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}

          {/* Start label */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 font-body font-bold text-[12px] text-white/50 uppercase tracking-wider">
            START
          </div>

          {/* Finish label */}
          {tiles.length > 0 && (
            <div className="absolute font-body font-bold text-[12px] text-golden uppercase tracking-wider"
              style={{
                left: '50%',
                top: '-20px',
                transform: 'translateX(-50%)',
              }}
            >
              FINISH 🏁
            </div>
          )}
        </div>

        {/* Dust particles */}
        {dustPos && <DustParticles x={dustPos.x} y={dustPos.y} />}

        {/* Sentence complete overlay */}
        <AnimatePresence>
          {gameState === 'sentenceComplete' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: 2, duration: 0.5 }}
                className="bg-[rgba(0,0,0,0.4)] backdrop-blur-sm rounded-3xl px-8 py-5 text-center"
              >
                <p className="text-[40px] mb-1">🎉</p>
                <p className="font-display text-[24px] text-white">
                  {sentence?.display}!
                </p>
                <p className="font-body text-[14px] text-golden mt-1">+30 points!</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Game Won Overlay */}
        <AnimatePresence>
          {gameState === 'won' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center z-30"
            >
              <div className="bg-[rgba(0,0,0,0.5)] backdrop-blur-sm rounded-3xl p-8 text-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.2 }}>
                  <p className="text-[60px] mb-2">🏆</p>
                </motion.div>
                <h3 className="font-display text-[32px] text-white mb-2">Amazing!</h3>
                <p className="font-body text-[18px] text-white/80 mb-1">
                  Score: <span className="font-display text-golden text-[28px]">{score}</span>
                </p>
                <p className="font-body text-[14px] text-white/60 mb-3">
                  {sentencesCompleted} sentences completed
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

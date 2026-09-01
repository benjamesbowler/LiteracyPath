import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import PhonicsButton from "../components/PhonicsButton";
import { WordImage } from "../components/WordImage";
import Blendy from "./Blendy";
import { getLetterSoundCue, playCvcSoundSequence, shuffleItems, useCvcSoundCue, useCvcWordModels } from "./cvcHelpers";
import { getLedaInstructionAudioPath } from "../../../../data/ledaProductionAudio.js";

function getGhostLetter(wordIndex, letter, socketIndex, family) {
  if (wordIndex === 0) return letter;
  if (wordIndex === 1 && letter === family.vowel && socketIndex === 1) return letter;
  return "";
}

const StepBuildWord = memo(function StepBuildWord({ family, onComplete }) {
  const words = useCvcWordModels(family.buildWords, family);
  const [wordIndex, setWordIndex] = useState(0);
  const [filledLetters, setFilledLetters] = useState([]);
  const [usedTileIds, setUsedTileIds] = useState(new Set());
  const [activeLetterIndex, setActiveLetterIndex] = useState(-1);
  const [wobbleTile, setWobbleTile] = useState("");
  const [imageBounce, setImageBounce] = useState(0);
  const [blendyExpression, setBlendyExpression] = useState("idle");
  const [completionAudioDone, setCompletionAudioDone] = useState(false);
  const timersRef = useRef([]);
  const completionRunRef = useRef(0);
  const hasAdvancedRef = useRef(false);
  const { playCue, stopCue } = useCvcSoundCue();
  const currentWord = words[wordIndex];
  const wordComplete = Boolean(currentWord) && filledLetters.length === currentWord.letters.length;
  const isLastWord = wordIndex >= words.length - 1;

  const trayLetters = useMemo(() => {
    if (!currentWord) return [];
    return shuffleItems([...currentWord.letters, ...family.distractorLetters]).map((letter, index) => ({
      id: `${letter}-${index}`,
      letter
    }));
  }, [currentWord, family.distractorLetters]);

  const clearTimers = useCallback(() => {
    completionRunRef.current += 1;
    timersRef.current.forEach(timer => clearTimeout(timer));
    timersRef.current = [];
    stopCue();
  }, [stopCue]);

  useEffect(() => {
    setFilledLetters([]);
    setUsedTileIds(new Set());
    setActiveLetterIndex(-1);
    setBlendyExpression("idle");
    setCompletionAudioDone(false);
    hasAdvancedRef.current = false;
    clearTimers();
  }, [clearTimers, wordIndex]);

  useEffect(() => {
    if (!currentWord) return undefined;
    const timer = setTimeout(() => playCue(currentWord.audio, currentWord.word), 350);
    return () => clearTimeout(timer);
  }, [currentWord, playCue]);

  const runCompletionSequence = useCallback(async () => {
    if (!currentWord) return false;
    clearTimers();
    const run = completionRunRef.current;
    const completed = await playCvcSoundSequence({
      wordModel: currentWord,
      family,
      playCue,
      onLetter: setActiveLetterIndex,
      isCurrent: () => completionRunRef.current === run
    });
    if (!completed || completionRunRef.current !== run) return false;
    setImageBounce(value => value + 1);
    setBlendyExpression("munching");
    const praiseStatus = await playCue(getLedaInstructionAudioPath("Great job"), "Great job");
    if (praiseStatus !== "ended" || completionRunRef.current !== run) return false;
    setBlendyExpression("cheering");
    setCompletionAudioDone(true);
    return true;
  }, [clearTimers, currentWord, family, playCue]);

  useEffect(() => clearTimers, [clearTimers]);

  const advanceWord = useCallback(() => {
    if (hasAdvancedRef.current) return;
    hasAdvancedRef.current = true;
    clearTimers();
    if (isLastWord) {
      onComplete();
      return;
    }
    setWordIndex(index => index + 1);
  }, [clearTimers, isLastWord, onComplete]);

  const handleTileTap = useCallback((tile) => {
    if (!currentWord || filledLetters.length >= currentWord.letters.length) return;
    const cue = getLetterSoundCue(tile.letter, family);
    const cuePlayback = playCue(cue.src, cue.fallbackText);

    const expectedLetter = currentWord.letters[filledLetters.length];
    if (tile.letter === expectedLetter) {
      const completesWord = filledLetters.length + 1 === currentWord.letters.length;
      setFilledLetters(previous => [...previous, tile.letter]);
      setUsedTileIds(previous => new Set([...previous, tile.id]));
      if (completesWord) {
        void cuePlayback.then(status => {
          if (status === "ended") void runCompletionSequence();
        });
      }
      return;
    }

    setWobbleTile(tile.id);
    void cuePlayback.then(status => {
      if (status === "ended") {
        void playCue(getLedaInstructionAudioPath("Try again"), "Try again");
      }
    });
    const wobbleTimer = setTimeout(() => setWobbleTile(""), 520);
    timersRef.current.push(wobbleTimer);
  }, [currentWord, family, filledLetters.length, playCue, runCompletionSequence]);

  if (!currentWord) return null;

  return (
    <motion.div className="phonics-step cvc-step cvc-build-step kg-child-flow__content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -80 }}>
      <div className="cvc-build-stage">
        <Blendy expression={blendyExpression} />
        <motion.button
          className="cvc-word-picture-button"
          onClick={() => playCue(currentWord.audio, currentWord.word)}
          animate={imageBounce ? { scale: [1, 1.08, 1] } : {}}
          key={`image-${currentWord.word}-${imageBounce}`}
          type="button"
          aria-label={`Hear ${currentWord.word}`}
        >
          <WordImage src={currentWord.image} word={currentWord.word} priority />
        </motion.button>
      </div>

      <div className="cvc-socket-row" aria-label={`Build ${currentWord.word}`}>
        {currentWord.letters.map((letter, index) => {
          const filled = filledLetters[index];
          const ghost = getGhostLetter(wordIndex, letter, index, family);
          return (
            <motion.span
              className={`cvc-socket ${filled ? "filled" : ""} ${activeLetterIndex === index ? "active" : ""}`}
              key={`${currentWord.word}-slot-${index}`}
              animate={activeLetterIndex === index ? { scale: [1, 1.12, 1] } : {}}
            >
              {filled || <span className="cvc-ghost-letter">{ghost}</span>}
            </motion.span>
          );
        })}
      </div>

      <div className="cvc-tile-tray" aria-label="Choose letters">
        {trayLetters.map(tile => (
          <motion.button
            className={`cvc-sound-tile cvc-tray-tile ${usedTileIds.has(tile.id) ? "used" : ""}`}
            key={tile.id}
            onClick={() => handleTileTap(tile)}
            animate={wobbleTile === tile.id ? { x: [0, -8, 8, -5, 5, 0] } : {}}
            disabled={usedTileIds.has(tile.id)}
            type="button"
            aria-label={`Use ${tile.letter}`}
          >
            {tile.letter}
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {wordComplete && completionAudioDone && (
          <motion.div
            className="cvc-step-actions cvc-build-actions"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            role="status"
            aria-label={`You built ${currentWord.word}`}
          >
            <PhonicsButton onClick={advanceWord}>
              {isLastWord ? "Continue" : "Next Word"}
            </PhonicsButton>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

export default StepBuildWord;

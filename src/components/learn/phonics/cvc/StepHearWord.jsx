import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import PhonicsButton from "../components/PhonicsButton";
import { WordImage } from "../components/WordImage";
import { getLetterSoundCue, playCvcSoundSequence, useCvcSoundCue, useCvcWordModels } from "./cvcHelpers";

const StepHearWord = memo(function StepHearWord({ family, onComplete }) {
  const words = useCvcWordModels(family.buildWords, family);
  const [wordIndex, setWordIndex] = useState(0);
  const [activeLetterIndex, setActiveLetterIndex] = useState(-1);
  const [soundOutDone, setSoundOutDone] = useState(false);
  const soundOutRunRef = useRef(0);
  const { playCue, stopCue, isPlaying } = useCvcSoundCue();
  const currentWord = words[wordIndex];
  const isLastWord = wordIndex === words.length - 1;

  const runSoundOut = useCallback(async (wordModel = currentWord) => {
    if (!wordModel) return false;
    const run = soundOutRunRef.current + 1;
    soundOutRunRef.current = run;
    stopCue();
    setSoundOutDone(false);
    const completed = await playCvcSoundSequence({
      wordModel,
      family,
      playCue,
      onLetter: setActiveLetterIndex,
      isCurrent: () => soundOutRunRef.current === run
    });
    if (completed && soundOutRunRef.current === run) {
      setSoundOutDone(true);
    }
    return completed;
  }, [currentWord, family, playCue, stopCue]);

  useEffect(() => {
    return () => {
      soundOutRunRef.current += 1;
      stopCue();
    };
  }, [stopCue]);

  useEffect(() => {
    if (!soundOutDone || !isLastWord || isPlaying) return undefined;
    const timer = setTimeout(onComplete, 1000);
    return () => clearTimeout(timer);
  }, [isLastWord, isPlaying, onComplete, soundOutDone]);

  const handleNext = useCallback(() => {
    if (isLastWord) {
      onComplete();
      return;
    }
    const nextWord = words[wordIndex + 1];
    setWordIndex(index => index + 1);
    void runSoundOut(nextWord);
  }, [isLastWord, onComplete, runSoundOut, wordIndex, words]);

  const imageAnimation = useMemo(() => (
    soundOutDone ? { scale: [1, 1.06, 1], rotate: [0, -1, 1, 0] } : {}
  ), [soundOutDone]);

  if (!currentWord) return null;

  return (
    <motion.div className="phonics-step cvc-step cvc-hear-step kg-child-flow__content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -80 }}>
      <div className="cvc-step-heading">
        <h2>Listen to the Word</h2>
      </div>

      <motion.button
        className="cvc-word-picture-button"
        onClick={() => { void playCue(currentWord.audio, currentWord.word); }}
        animate={imageAnimation}
        type="button"
        aria-label={`Hear ${currentWord.word}`}
      >
        <WordImage src={currentWord.image} word={currentWord.word} priority />
      </motion.button>

      <div className="cvc-letter-row cvc-letter-row-squeeze" aria-label={currentWord.word}>
        {currentWord.letters.map((letter, index) => (
          <motion.button
            key={`${currentWord.word}-${letter}-${index}`}
            className={`cvc-sound-tile ${activeLetterIndex === index ? "active" : ""}`}
            animate={activeLetterIndex === index ? { scale: [1, 1.16, 1] } : {}}
            onClick={() => {
              const cue = getLetterSoundCue(letter, family);
              void playCue(cue.src, cue.fallbackText);
            }}
            type="button"
            aria-label={`Hear ${letter}`}
          >
            {letter}
          </motion.button>
        ))}
      </div>

      <div className="cvc-step-actions">
        <button className="cvc-speaker-button" onClick={() => { void runSoundOut(); }} type="button" aria-label="Sound out the word">
          Audio
        </button>
        <AnimatePresence>
          {soundOutDone && !isPlaying && !isLastWord && (
            <motion.span initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <PhonicsButton onClick={handleNext}>Next Word</PhonicsButton>
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});

export default StepHearWord;

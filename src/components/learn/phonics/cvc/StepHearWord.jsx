import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import PhonicsButton from "../components/PhonicsButton";
import { WordImage } from "../components/WordImage";
import { CVC_SOUND_DELAY, getLetterSoundCue, useCvcSoundCue, useCvcWordModels } from "./cvcHelpers";

const StepHearWord = memo(function StepHearWord({ family, onComplete }) {
  const words = useCvcWordModels(family.buildWords, family);
  const [wordIndex, setWordIndex] = useState(0);
  const [activeLetterIndex, setActiveLetterIndex] = useState(-1);
  const [soundOutDone, setSoundOutDone] = useState(false);
  const timersRef = useRef([]);
  const { playCue } = useCvcSoundCue();
  const currentWord = words[wordIndex];
  const isLastWord = wordIndex === words.length - 1;

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(timer => clearTimeout(timer));
    timersRef.current = [];
  }, []);

  const runSoundOut = useCallback(() => {
    if (!currentWord) return;
    clearTimers();
    setSoundOutDone(false);
    currentWord.letters.forEach((letter, index) => {
      const timer = setTimeout(() => {
        setActiveLetterIndex(index);
        const cue = getLetterSoundCue(letter, family);
        playCue(cue.src, cue.fallbackText);
      }, index * CVC_SOUND_DELAY);
      timersRef.current.push(timer);
    });

    const wordTimer = setTimeout(() => {
      setActiveLetterIndex(-1);
      playCue(currentWord.audio, currentWord.word);
      setSoundOutDone(true);
    }, currentWord.letters.length * CVC_SOUND_DELAY + 120);
    timersRef.current.push(wordTimer);
  }, [clearTimers, currentWord, family, playCue]);

  useEffect(() => {
    runSoundOut();
    return clearTimers;
  }, [clearTimers, runSoundOut]);

  useEffect(() => {
    if (!soundOutDone || !isLastWord) return undefined;
    const timer = setTimeout(onComplete, 1000);
    return () => clearTimeout(timer);
  }, [isLastWord, onComplete, soundOutDone]);

  const handleNext = useCallback(() => {
    if (isLastWord) {
      onComplete();
      return;
    }
    setWordIndex(index => index + 1);
  }, [isLastWord, onComplete]);

  const imageAnimation = useMemo(() => (
    soundOutDone ? { scale: [1, 1.06, 1], rotate: [0, -1, 1, 0] } : {}
  ), [soundOutDone]);

  if (!currentWord) return null;

  return (
    <motion.div className="phonics-step cvc-step cvc-hear-step" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -80 }}>
      <div className="cvc-step-heading">
        <h2>Listen to the Word</h2>
      </div>

      <motion.button
        className="cvc-word-picture-button"
        onClick={() => playCue(currentWord.audio, currentWord.word)}
        animate={imageAnimation}
        type="button"
        aria-label={`Hear ${currentWord.word}`}
      >
        <WordImage src={currentWord.image} word={currentWord.word} />
      </motion.button>

      <div className="cvc-letter-row cvc-letter-row-squeeze" aria-label={currentWord.word}>
        {currentWord.letters.map((letter, index) => (
          <motion.button
            key={`${currentWord.word}-${letter}-${index}`}
            className={`cvc-sound-tile ${activeLetterIndex === index ? "active" : ""}`}
            animate={activeLetterIndex === index ? { scale: [1, 1.16, 1] } : {}}
            onClick={() => {
              const cue = getLetterSoundCue(letter, family);
              playCue(cue.src, cue.fallbackText);
            }}
            type="button"
            aria-label={`Hear ${letter}`}
          >
            {letter}
          </motion.button>
        ))}
      </div>

      <div className="cvc-step-actions">
        <button className="cvc-speaker-button" onClick={runSoundOut} type="button" aria-label="Sound out the word">
          Audio
        </button>
        <AnimatePresence>
          {soundOutDone && !isLastWord && (
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

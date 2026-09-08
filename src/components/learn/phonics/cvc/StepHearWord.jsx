import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import PhonicsButton from "../components/PhonicsButton";
import { WordImage } from "../components/WordImage";
import { getLetterSoundCue, cvcStepEvidence, playCvcSoundSequence, useCvcSoundCue, useCvcWordModels } from "./cvcHelpers";

const StepHearWord = memo(function StepHearWord({ family, onComplete }) {
  const words = useCvcWordModels(family.buildWords, family);
  const [wordIndex, setWordIndex] = useState(0);
  const [activeLetterIndex, setActiveLetterIndex] = useState(-1);
  const [delivery, setDelivery] = useState("pending");
  const soundOutDone = delivery === "delivered";
  const recordsRef = useRef([]);
  const attemptsRef = useRef(0);
  const advancedRef = useRef(false);
  const soundOutRunRef = useRef(0);
  const { playCue, stopCue, isPlaying } = useCvcSoundCue();
  const currentWord = words[wordIndex];
  const isLastWord = wordIndex === words.length - 1;

  const runSoundOut = useCallback(async (wordModel = currentWord) => {
    if (!wordModel) return false;
    const run = soundOutRunRef.current + 1;
    soundOutRunRef.current = run;
    stopCue();
    attemptsRef.current += 1;
    setDelivery("playing");
    const completed = await playCvcSoundSequence({
      wordModel,
      family,
      playCue,
      onLetter: setActiveLetterIndex,
      isCurrent: () => soundOutRunRef.current === run
    });
    if (soundOutRunRef.current === run) { setDelivery(completed.audioDelivery); setActiveLetterIndex(-1); }
    return completed;
  }, [currentWord, family, playCue, stopCue]);

  useEffect(() => {
    return () => {
      soundOutRunRef.current += 1;
      stopCue();
    };
  }, [stopCue]);

  useEffect(() => { advancedRef.current = false; }, [wordIndex]);

  const handleNext = useCallback(() => {
    if (advancedRef.current || !["delivered", "unavailable", "interrupted"].includes(delivery)) return;
    advancedRef.current = true;
    soundOutRunRef.current += 1;
    stopCue();
    const records = [...recordsRef.current, {
      audioDelivery: delivery, attempts: attemptsRef.current,
      firstResponse: { word: currentWord.word, action: "hear_model" },
      supportUsed: delivery === "delivered" ? ["recorded_model"] : ["visual_continuation", "media_unavailable"]
    }];
    recordsRef.current = records;
    if (isLastWord) { onComplete(cvcStepEvidence("hear", records)); return; }
    attemptsRef.current = 0;
    setWordIndex(index => index + 1);
    setActiveLetterIndex(-1);
    setDelivery("pending");
  }, [currentWord, delivery, isLastWord, onComplete, stopCue]);

  const imageAnimation = useMemo(() => (
    soundOutDone ? { scale: [1, 1.06, 1], rotate: [0, -1, 1, 0] } : {}
  ), [soundOutDone]);

  if (!currentWord) return null;

  return (
    <motion.div className="phonics-step cvc-step cvc-hear-step kg-child-flow__content" data-learning-object="cvc-hear" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -80 }}>
      <div className="cvc-step-heading">
        <h2>Listen to the Word</h2>
        <p>Hear each sound join to make a word.</p>
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

      <div className="cvc-letter-row cvc-letter-row-squeeze" aria-label={`Sounds in ${currentWord.word}`} role="group">
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
        {["unavailable", "interrupted"].includes(delivery) && <p role="status">The sound did not finish. Retry Audio, or continue with picture support.</p>}
        <AnimatePresence>
          {["delivered", "unavailable", "interrupted"].includes(delivery) && !isPlaying && (
            <motion.span initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <PhonicsButton onClick={handleNext}>{delivery === "delivered" ? (isLastWord ? "Continue" : "Next Word") : "Continue with support"}</PhonicsButton>
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});

export default StepHearWord;

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { WordImage } from "../components/WordImage";
import Blendy from "./Blendy";
import { getLetterSoundCue, useCvcSoundCue, useCvcWordModels } from "./cvcHelpers";
import { getLedaInstructionAudioPath } from "../../../../data/ledaProductionAudio.js";

const StepWordMagic = memo(function StepWordMagic({ family, onComplete }) {
  const words = useCvcWordModels(family.magicSwaps, family);
  const [wordIndex, setWordIndex] = useState(0);
  const [isSwapping, setIsSwapping] = useState(false);
  const [departingOnset, setDepartingOnset] = useState("");
  const magicRunRef = useRef(0);
  const { playCue, stopCue } = useCvcSoundCue();
  const currentWord = words[wordIndex];
  const nextWord = words[wordIndex + 1];
  const nextOnset = nextWord?.letters[0] || "";
  const isFinalWord = wordIndex >= words.length - 1;

  useEffect(() => () => {
    magicRunRef.current += 1;
    stopCue();
  }, [stopCue]);

  const handleMagicTap = useCallback(async () => {
    if (!currentWord || !nextWord || isSwapping) return;
    const run = magicRunRef.current + 1;
    magicRunRef.current = run;
    setIsSwapping(true);
    setDepartingOnset(currentWord.letters[0]);
    const cue = getLetterSoundCue(nextOnset, family);
    const onsetStatus = await playCue(cue.src, cue.fallbackText);
    if (onsetStatus !== "ended" || magicRunRef.current !== run) {
      if (magicRunRef.current === run) {
        setDepartingOnset("");
        setIsSwapping(false);
      }
      return;
    }

    setWordIndex(index => index + 1);
    setDepartingOnset("");
    const wordStatus = await playCue(nextWord.audio, nextWord.word);
    if (wordStatus !== "ended" || magicRunRef.current !== run) {
      if (magicRunRef.current === run) setIsSwapping(false);
      return;
    }

    if (wordIndex + 1 >= words.length - 1) {
      const praiseStatus = await playCue(getLedaInstructionAudioPath("You found it"), "You found it");
      if (praiseStatus === "ended" && magicRunRef.current === run) onComplete();
    }
    if (magicRunRef.current === run) setIsSwapping(false);
  }, [currentWord, family, isSwapping, nextOnset, nextWord, onComplete, playCue, wordIndex, words.length]);

  const displayLetters = useMemo(() => currentWord?.letters || [], [currentWord]);

  if (!currentWord) return null;

  return (
    <motion.div className="phonics-step cvc-step cvc-magic-step kg-child-flow__content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -80 }}>
      <div className="cvc-step-heading">
        <h2>Word Magic</h2>
        <p>Change one sound!</p>
      </div>

      <div className="cvc-magic-stage">
        <Blendy expression={isFinalWord ? "cheering" : "idle"} />
        <AnimatePresence mode="wait">
          <motion.button
            className="cvc-word-picture-button"
            key={currentWord.word}
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: [1, 1.08, 1] }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={() => playCue(currentWord.audio, currentWord.word)}
            type="button"
            aria-label={`Hear ${currentWord.word}`}
          >
            <WordImage src={currentWord.image} word={currentWord.word} priority />
          </motion.button>
        </AnimatePresence>
      </div>

      <div className="cvc-socket-row cvc-magic-word" aria-label={currentWord.word}>
        {displayLetters.map((letter, index) => (
          <motion.span
            className="cvc-socket filled"
            key={`${currentWord.word}-${letter}-${index}`}
            animate={index === 0 && departingOnset ? { x: -120, rotate: -25, opacity: 0 } : { x: 0, rotate: 0, opacity: 1 }}
          >
            {letter}
          </motion.span>
        ))}
      </div>

      {!isFinalWord && (
        <div className="cvc-tile-tray cvc-magic-tray" aria-label="Magic letter">
          <motion.button
            className="cvc-sound-tile cvc-magic-tile"
            onClick={() => { void handleMagicTap(); }}
            animate={{ scale: [1, 1.08, 1], rotate: [0, -2, 2, 0] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            disabled={isSwapping}
            type="button"
            aria-label={`Change to ${nextOnset}`}
          >
            {nextOnset}
          </motion.button>
        </div>
      )}
    </motion.div>
  );
});

export default StepWordMagic;

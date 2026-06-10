import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { WordImage } from "../components/WordImage";
import Blendy from "./Blendy";
import { getLetterAudio, useCvcSoundCue, useCvcWordModels } from "./cvcHelpers";

const StepWordMagic = memo(function StepWordMagic({ family, onComplete }) {
  const words = useCvcWordModels(family.magicSwaps, family);
  const [wordIndex, setWordIndex] = useState(0);
  const [isSwapping, setIsSwapping] = useState(false);
  const [departingOnset, setDepartingOnset] = useState("");
  const { playCue } = useCvcSoundCue();
  const currentWord = words[wordIndex];
  const nextWord = words[wordIndex + 1];
  const nextOnset = nextWord?.letters[0] || "";
  const isFinalWord = wordIndex >= words.length - 1;

  useEffect(() => {
    playCue("", "Watch the magic! Change one sound!");
  }, [playCue]);

  const handleMagicTap = useCallback(() => {
    if (!currentWord || !nextWord || isSwapping) return;
    setIsSwapping(true);
    setDepartingOnset(currentWord.letters[0]);
    playCue(getLetterAudio(nextOnset, family), nextOnset);

    setTimeout(() => {
      setWordIndex(index => index + 1);
      setDepartingOnset("");
      playCue(nextWord.audio, nextWord.word);
    }, 700);

    setTimeout(() => {
      setIsSwapping(false);
      if (wordIndex + 1 >= words.length - 1) {
        playCue("/audio/child-mode/phrases/you-found-it.mp3", "You found it");
        setTimeout(onComplete, 900);
      }
    }, 1450);
  }, [currentWord, family, isSwapping, nextOnset, nextWord, onComplete, playCue, wordIndex, words.length]);

  const displayLetters = useMemo(() => currentWord?.letters || [], [currentWord]);

  if (!currentWord) return null;

  return (
    <motion.div className="phonics-step cvc-step cvc-magic-step" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -80 }}>
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
            <WordImage src={currentWord.image} word={currentWord.word} />
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
            onClick={handleMagicTap}
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

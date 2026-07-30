import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { WordImage } from "../components/WordImage";
import Blendy from "./Blendy";
import { CVC_SOUND_DELAY, getLetterSoundCue, shuffleItems, useCvcSoundCue, useCvcWordModels } from "./cvcHelpers";
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
  const timersRef = useRef([]);
  const { playCue } = useCvcSoundCue();
  const currentWord = words[wordIndex];

  const trayLetters = useMemo(() => {
    if (!currentWord) return [];
    return shuffleItems([...currentWord.letters, ...family.distractorLetters]).map((letter, index) => ({
      id: `${letter}-${index}`,
      letter
    }));
  }, [currentWord, family.distractorLetters]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(timer => clearTimeout(timer));
    timersRef.current = [];
  }, []);

  useEffect(() => {
    setFilledLetters([]);
    setUsedTileIds(new Set());
    setActiveLetterIndex(-1);
    setBlendyExpression("idle");
    clearTimers();
  }, [clearTimers, wordIndex]);

  useEffect(() => {
    if (!currentWord) return undefined;
    const timer = setTimeout(() => playCue(currentWord.audio, currentWord.word), 350);
    return () => clearTimeout(timer);
  }, [currentWord, playCue]);

  const runCompletionSequence = useCallback(() => {
    if (!currentWord) return;
    clearTimers();
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
      setImageBounce(value => value + 1);
      setBlendyExpression("munching");
    }, currentWord.letters.length * CVC_SOUND_DELAY + 140);
    timersRef.current.push(wordTimer);

    const praiseTimer = setTimeout(() => {
      playCue(getLedaInstructionAudioPath("Great job"), "Great job");
      setBlendyExpression("cheering");
    }, currentWord.letters.length * CVC_SOUND_DELAY + 1000);
    timersRef.current.push(praiseTimer);

    const nextTimer = setTimeout(() => {
      if (wordIndex >= words.length - 1) {
        onComplete();
      } else {
        setWordIndex(index => index + 1);
      }
    }, currentWord.letters.length * CVC_SOUND_DELAY + 1900);
    timersRef.current.push(nextTimer);
  }, [clearTimers, currentWord, family, onComplete, playCue, wordIndex, words.length]);

  useEffect(() => {
    if (!currentWord || filledLetters.length !== currentWord.letters.length) return;
    runCompletionSequence();
  }, [currentWord, filledLetters.length, runCompletionSequence]);

  useEffect(() => clearTimers, [clearTimers]);

  const handleTileTap = useCallback((tile) => {
    if (!currentWord || filledLetters.length >= currentWord.letters.length) return;
    const cue = getLetterSoundCue(tile.letter, family);
    playCue(cue.src, cue.fallbackText);

    const expectedLetter = currentWord.letters[filledLetters.length];
    if (tile.letter === expectedLetter) {
      setFilledLetters(previous => [...previous, tile.letter]);
      setUsedTileIds(previous => new Set([...previous, tile.id]));
      return;
    }

    setWobbleTile(tile.id);
    setTimeout(() => playCue(getLedaInstructionAudioPath("Try again"), "Try again"), 460);
    setTimeout(() => setWobbleTile(""), 520);
  }, [currentWord, family, filledLetters.length, playCue]);

  if (!currentWord) return null;

  return (
    <motion.div className="phonics-step cvc-step cvc-build-step" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -80 }}>
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
          <WordImage src={currentWord.image} word={currentWord.word} />
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
    </motion.div>
  );
});

export default StepBuildWord;

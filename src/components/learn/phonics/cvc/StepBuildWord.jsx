import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import PhonicsButton from "../components/PhonicsButton";
import { WordImage } from "../components/WordImage";
import Blendy from "./Blendy";
import { getLetterSoundCue, cvcStepEvidence, playCvcSoundSequence, shuffleItems, useCvcSoundCue, useCvcWordModels } from "./cvcHelpers";
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
  const [delivery, setDelivery] = useState("pending");
  const deliveryRef = useRef("pending");
  const recordsRef = useRef([]);
  const responseRef = useRef({ attempts: 0, firstResponse: null, mistakes: 0 });
  const filledRef = useRef([]);
  const usedRef = useRef(new Set());
  const timersRef = useRef([]);
  const completionRunRef = useRef(0);
  const hasAdvancedRef = useRef(false);
  const { playCue, stopCue } = useCvcSoundCue();
  const currentWord = words[wordIndex];
  const wordComplete = Boolean(currentWord) && filledLetters.length === currentWord.letters.length;
  const isLastWord = wordIndex >= words.length - 1;
  const completionReady = ["delivered", "unavailable", "interrupted"].includes(delivery);

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
    setDelivery("pending"); deliveryRef.current = "pending";
    responseRef.current = { attempts: 0, firstResponse: null, mistakes: 0 };
    filledRef.current = []; usedRef.current = new Set();
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
    if (completionRunRef.current !== run) return false;
    setActiveLetterIndex(-1);
    deliveryRef.current = completed.audioDelivery; setDelivery(completed.audioDelivery);
    if (completed.audioDelivery !== "delivered") return false;
    setImageBounce(value => value + 1);
    setBlendyExpression("munching");
    const praiseStatus = await playCue(getLedaInstructionAudioPath("Great job"), "Great job");
    if (completionRunRef.current !== run) return false;
    void praiseStatus;
    setBlendyExpression("cheering");

    return true;
  }, [clearTimers, currentWord, family, playCue]);

  useEffect(() => clearTimers, [clearTimers]);

  const advanceWord = useCallback(() => {
    if (hasAdvancedRef.current) return;
    hasAdvancedRef.current = true;
    const records = [...recordsRef.current, {
      ...responseRef.current, audioDelivery: deliveryRef.current,
      supportUsed: ["scaffolded_construction", ...(wordIndex < 2 ? ["authored_ghost"] : []),
        ...(responseRef.current.mistakes ? ["correction"] : []),
        ...(deliveryRef.current !== "delivered" ? ["media_unavailable"] : [])]
    }];
    recordsRef.current = records;
    clearTimers();
    if (isLastWord) {
      onComplete(cvcStepEvidence("build", records));
      return;
    }
    setWordIndex(index => index + 1);
  }, [clearTimers, isLastWord, onComplete, wordIndex]);

  const handleTileTap = useCallback((tile) => {
    const slot = filledRef.current.length;
    if (!currentWord || slot >= currentWord.letters.length || usedRef.current.has(tile.id) || hasAdvancedRef.current) return;
    const epoch = completionRunRef.current;
    responseRef.current.attempts += 1;
    responseRef.current.firstResponse ||= { word: currentWord.word, slot, selected: tile.letter, tileId: tile.id };
    const cue = getLetterSoundCue(tile.letter, family);
    const cuePlayback = playCue(cue.src, cue.fallbackText);
    const expectedLetter = currentWord.letters[slot];
    if (tile.letter === expectedLetter) {
      filledRef.current = [...filledRef.current, tile.letter];
      usedRef.current = new Set([...usedRef.current, tile.id]);
      setFilledLetters(filledRef.current);
      setUsedTileIds(usedRef.current);
      if (filledRef.current.length === currentWord.letters.length) {
        void cuePlayback.then(() => {
          if (completionRunRef.current === epoch && !hasAdvancedRef.current) void runCompletionSequence();
        });
      }
      return;
    }
    responseRef.current.mistakes += 1;
    setWobbleTile(tile.id);
    void cuePlayback.then(status => {
      if (status === "ended" && completionRunRef.current === epoch && !hasAdvancedRef.current) {
        void playCue(getLedaInstructionAudioPath("Try again"), "Try again");
      }
    });
    const wobbleTimer = setTimeout(() => { if (completionRunRef.current === epoch) setWobbleTile(""); }, 520);
    timersRef.current.push(wobbleTimer);
  }, [currentWord, family, playCue, runCompletionSequence]);

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

      <div className="cvc-socket-row" aria-label={`Build ${currentWord.word}`} role="group">
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
        {wordComplete && (
          <motion.div
            className="cvc-step-actions cvc-build-actions"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            role="status"
            aria-label={`You built ${currentWord.word}`}
          >
            {!completionReady && <p>Blending {currentWord.word}...</p>}
            {completionReady && ["unavailable", "interrupted"].includes(delivery) && <>
              <p>The sound did not finish. Your word is still built.</p>
              <PhonicsButton onClick={() => { void runCompletionSequence(); }}>Retry sound</PhonicsButton>
            </>}
            <PhonicsButton onClick={advanceWord} disabled={!completionReady}>
              {isLastWord ? "Continue" : "Next Word"}
            </PhonicsButton>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

export default StepBuildWord;

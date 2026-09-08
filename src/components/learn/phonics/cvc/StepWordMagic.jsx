import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { WordImage } from "../components/WordImage";
import Blendy from "./Blendy";
import PhonicsButton from "../components/PhonicsButton";
import {
  getLetterSoundCue,
  cvcAudioDelivery,
  cvcStepEvidence,
  getMagicChoiceModels,
  useCvcSoundCue,
  useCvcWordModels
} from "./cvcHelpers";

const StepWordMagic = memo(function StepWordMagic({ family, onComplete }) {
  const words = useCvcWordModels(family.magicSwaps, family);
  const [wordIndex, setWordIndex] = useState(0);
  const [isSwapping, setIsSwapping] = useState(false);
  const [choiceReady, setChoiceReady] = useState(false);
  const [feedback, setFeedback] = useState("");
  const magicRunRef = useRef(0);
  const swappingRef = useRef(false);
  const completedRef = useRef(false);
  const recordsRef = useRef([]);
  const choiceAttemptsRef = useRef(0);
  const firstChoiceRef = useRef(null);
  const [delivery, setDelivery] = useState("pending");
  const { playCue, stopCue } = useCvcSoundCue();
  const currentWord = words[wordIndex];
  const targetWord = words[wordIndex + 1];
  const isModelStep = wordIndex === 0;
  const isFinalWord = Boolean(currentWord) && !targetWord;
  const choiceModels = useMemo(
    () => getMagicChoiceModels(words, wordIndex),
    [wordIndex, words]
  );

  useEffect(() => () => {
    magicRunRef.current += 1;
    stopCue();
  }, [stopCue]);

  const playTargetSounds = useCallback(async (target, record, run) => {
    const cue = getLetterSoundCue(target.letters[0], family);
    const onsetStatus = await playCue(cue.src, cue.fallbackText);
    if (magicRunRef.current !== run) return false;
    const wordStatus = await playCue(target.audio, target.word);
    if (magicRunRef.current !== run) return false;

    record.audioDelivery = cvcStepEvidence("magic", [
      { audioDelivery: cvcAudioDelivery(onsetStatus) },
      { audioDelivery: cvcAudioDelivery(wordStatus) }
    ]).audioDelivery;
    if (record.audioDelivery !== "delivered") record.supportUsed.push("media_unavailable");
    setDelivery(record.audioDelivery);
    setIsSwapping(false);
    swappingRef.current = false;
    setChoiceReady(true);
    return true;
  }, [family, playCue]);

  const handleModelTap = useCallback(() => {
    if (!currentWord || !targetWord || !isModelStep || swappingRef.current || completedRef.current) return;
    swappingRef.current = true;
    const run = ++magicRunRef.current;
    stopCue();
    const record = {
      audioDelivery: "pending",
      attempts: 1,
      firstResponse: {
        word: currentWord.word,
        targetWord: targetWord.word,
        slot: 0,
        selected: targetWord.letters[0]
      },
      supportUsed: ["modeled_transformation"]
    };
    recordsRef.current.push(record);
    setFeedback("");
    setChoiceReady(false);
    setIsSwapping(true);
    setDelivery("playing");
    setWordIndex(index => index + 1);
    void playTargetSounds(targetWord, record, run);
  }, [currentWord, isModelStep, playTargetSounds, stopCue, targetWord]);

  const handleChoiceTap = useCallback((choice) => {
    if (!currentWord || !targetWord || isModelStep || !choiceReady || swappingRef.current || completedRef.current) return;
    const response = {
      word: currentWord.word,
      targetWord: choice.word,
      slot: 0,
      selected: choice.letters[0]
    };
    choiceAttemptsRef.current += 1;
    firstChoiceRef.current ||= response;

    if (choice.word !== targetWord.word) {
      setFeedback(`${choice.word} is a word, but it changes to a different target. Choose the picture that keeps the ${family.rime} ending and changes the first sound to ${targetWord.letters[0]}.`);
      return;
    }

    swappingRef.current = true;
    const run = ++magicRunRef.current;
    stopCue();
    const record = {
      audioDelivery: "pending",
      attempts: choiceAttemptsRef.current,
      firstResponse: firstChoiceRef.current,
      supportUsed: [
        "independent_choice",
        ...(choiceAttemptsRef.current > 1 ? ["correction"] : [])
      ]
    };
    recordsRef.current.push(record);
    choiceAttemptsRef.current = 0;
    firstChoiceRef.current = null;
    setFeedback("");
    setChoiceReady(false);
    setIsSwapping(true);
    setDelivery("playing");
    setWordIndex(index => index + 1);
    void playTargetSounds(targetWord, record, run);
  }, [choiceReady, currentWord, family.rime, isModelStep, playTargetSounds, stopCue, targetWord]);

  const complete = useCallback(() => {
    if (completedRef.current || !isFinalWord || !choiceReady || isSwapping) return;
    completedRef.current = true;
    magicRunRef.current += 1;
    stopCue();
    onComplete(cvcStepEvidence("magic", recordsRef.current));
  }, [choiceReady, isFinalWord, isSwapping, onComplete, stopCue]);

  if (!currentWord) return null;

  return (
    <motion.div
      className="phonics-step cvc-step cvc-magic-step kg-child-flow__content"
      data-learning-object="cvc-word-magic"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, x: -80 }}
    >
      <div className="cvc-step-heading">
        <h2>Word Magic</h2>
        <p>{isModelStep ? "Watch the first sound change." : isFinalWord ? "You made a new word!" : `Change the first sound in ${currentWord.word}.`}</p>
        {delivery === "unavailable" && <p className="cvc-audio-status" role="status">The sound did not finish. The picture and letters are still here to replay.</p>}
        {delivery === "interrupted" && <p className="cvc-audio-status" role="status">The sound stopped. Replay the picture when you are ready.</p>}
      </div>

      <div className="cvc-magic-stage">
        <Blendy expression={isFinalWord ? "cheering" : isSwapping ? "munching" : "idle"} />
        <AnimatePresence mode="wait">
          <motion.button
            className="cvc-word-picture-button"
            key={currentWord.word}
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: isSwapping ? [1, 1.05, 1] : 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={() => playCue(currentWord.audio, currentWord.word)}
            type="button"
            aria-label={`Hear ${currentWord.word}`}
          >
            <WordImage src={currentWord.image} word={currentWord.word} priority />
          </motion.button>
        </AnimatePresence>
      </div>

      <div className="cvc-magic-change" aria-live="polite">
        <span className="cvc-magic-change-word">{currentWord.letters.join("")}</span>
        <span className="cvc-magic-arrow" aria-hidden="true">→</span>
        <span className="cvc-magic-change-word">{isModelStep ? targetWord?.letters.join("") : targetWord ? "?" : "new word"}</span>
      </div>

      <div className="cvc-socket-row cvc-magic-word" aria-label={`Sounds in ${currentWord.word}`} role="group">
        {currentWord.letters.map((letter, index) => (
          <motion.span
            className={`cvc-socket filled ${index === 0 && isSwapping ? "active" : ""}`}
            key={`${currentWord.word}-${letter}-${index}`}
            animate={index === 0 && isSwapping ? { scale: [1, 1.12, 1] } : { scale: 1 }}
          >
            {letter}
          </motion.span>
        ))}
      </div>

      {isModelStep && targetWord && (
        <div className="cvc-magic-action">
          <p>Watch me change the first sound.</p>
          <PhonicsButton onClick={handleModelTap} disabled={isSwapping} aria-label={`Change to ${targetWord.letters[0]}`}>
            Change to {targetWord.letters[0]}
          </PhonicsButton>
        </div>
      )}

      {!isModelStep && !isFinalWord && (
        <div className="cvc-magic-choice-area">
          <p>Choose a new picture. Only one changes to the next word.</p>
          <div className="cvc-magic-choice-grid" aria-label="Choose the new word">
            {choiceModels.map(choice => (
              <motion.button
                key={choice.word}
                className="cvc-magic-choice"
                onClick={() => handleChoiceTap(choice)}
                whileHover={!isSwapping ? { y: -3 } : {}}
                whileTap={!isSwapping ? { scale: 0.96 } : {}}
                disabled={isSwapping || !choiceReady}
                type="button"
                aria-label={`Change to ${choice.letters[0]}`}
              >
                <span className="cvc-magic-choice-image"><WordImage src={choice.image} word={choice.word} priority /></span>
                <span className="cvc-magic-choice-letter">{choice.letters[0]}</span>
                <span className="cvc-magic-choice-word">{choice.word}</span>
              </motion.button>
            ))}
          </div>
          {feedback && <p className="cvc-magic-feedback" role="status">{feedback}</p>}
        </div>
      )}

      {isFinalWord && (
        <div className="cvc-step-actions cvc-magic-actions">
          {!choiceReady && <p>Blending {currentWord.word}...</p>}
          {choiceReady && <PhonicsButton onClick={complete}>Continue</PhonicsButton>}
        </div>
      )}
    </motion.div>
  );
});

export default StepWordMagic;

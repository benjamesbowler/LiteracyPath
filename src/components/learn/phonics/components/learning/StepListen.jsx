import { memo, useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { hasPhonicsAudioSource, usePhonicsAudio } from "../../../../../hooks/usePhonicsAudio";
import PhonicsButton from "../PhonicsButton";
import { settleExposureDeliveries } from "../../phonicsActivityState.js";
import { WordImage } from "../WordImage";

function deliveryStatus(status) {
  if (status === "ended") return "delivered";
  if (["stopped", "superseded"].includes(status)) return "interrupted";
  return "unavailable";
}

const WordCard = memo(function WordCard({ word, onDelivery }) {
  const { play, isPlaying } = usePhonicsAudio(word.audio, word.phonemeBreakdown || word.word);
  const canHear = hasPhonicsAudioSource(word.audio);
  const request = useRef(0);
  useEffect(() => () => { request.current += 1; }, []);

  const handleTap = useCallback(() => {
    const epoch = ++request.current;
    onDelivery(word.word, "pending");
    void play().then(status => { if (epoch === request.current) onDelivery(word.word, deliveryStatus(status)); });
  }, [play, word.word, onDelivery]);

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={canHear ? handleTap : undefined}
      disabled={!canHear}
      className="phonics-listen-card"
      aria-label={canHear ? `Hear the word ${word.word}` : `Word: ${word.word}`}
      type="button"
    >
      <span className="phonics-word-image-wrap">
        <WordImage src={word.image} word={word.word} priority />
      </span>
      <span className="phonics-word-label">{word.word}</span>
      {canHear && (
        <motion.span className="phonics-mini-audio-dot" animate={isPlaying ? { scale: [1, 1.2, 1] } : {}}>
          Audio
        </motion.span>
      )}
    </motion.button>
  );
});

const StepListen = memo(function StepListen({ lesson, onComplete }) {
  const { play: playPhonic } = usePhonicsAudio(lesson.phonicAudio, lesson.phonicSound);
  const canHearPhoneme = hasPhonicsAudioSource(lesson.phonicAudio);
  const [delivery, setDelivery] = useState({});
  const deliveryRef = useRef({});
  const alive = useRef(true);
  const soundRequest = useRef(0);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const recordDelivery = useCallback((key, status) => {
    if (!alive.current) return;
    deliveryRef.current = { ...deliveryRef.current, [key]: status };
    setDelivery(deliveryRef.current);
  }, []);

  const handlePhonicClick = useCallback(() => {
    const epoch = ++soundRequest.current;
    recordDelivery("sound", "pending");
    void playPhonic().then(status => { if (epoch === soundRequest.current) recordDelivery("sound", deliveryStatus(status)); });
  }, [playPhonic, recordDelivery]);

  return (
    <div className="phonics-step phonics-step-listen kg-child-flow__content">
      <motion.div className="phonics-big-letter" initial={{ opacity: 0, scale: 0.3 }} animate={{ opacity: 1, scale: 1 }}>
        {lesson.letter}
      </motion.div>

      <motion.p className="phonics-sound-text" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
        {lesson.letter} {lesson.letter.toLowerCase()}
      </motion.p>

      {canHearPhoneme && <motion.div className="phonics-sound-button-group" initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={handlePhonicClick}
          className="phonics-sound-button"
          aria-label="Tap to hear the sound"
          type="button"
        >
          <motion.span animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }} />
          <span aria-hidden="true">Audio</span>
        </motion.button>
        <span>Tap to hear!</span>
      </motion.div>}

      <motion.p className="phonics-is-for" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {lesson.letter} is for...
      </motion.p>

      <div className="phonics-listen-grid">
        {lesson.words.map(word => (
          <WordCard key={word.word} word={word} onDelivery={recordDelivery} />
        ))}
      </div>

      {lesson.words.some(word => hasPhonicsAudioSource(word.audio)) && (
        <motion.p className="phonics-instruction" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          Tap the pictures to hear the words!
        </motion.p>
      )}

      <motion.div className="phonics-step-actions" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      {Object.values(delivery).some(status => ["unavailable", "interrupted"].includes(status)) && <p role="status">Sound stopped or could not play. Tap it to retry, or continue with the pictures.</p>}
      {!canHearPhoneme && <p role="status">This sound is unavailable. You can continue with the pictures.</p>}
        <PhonicsButton onClick={() => onComplete({ step: "listen", completionKind: "exposure", audioDelivery: settleExposureDeliveries(deliveryRef.current).sound || (canHearPhoneme ? "not_played" : "unavailable"), firstResponse: null, attempts: 0, supportUsed: ["picture_and_print_model"], independent: false, deliveries: settleExposureDeliveries(deliveryRef.current) })}>Next Step</PhonicsButton>
      </motion.div>
    </div>
  );
});

export default StepListen;

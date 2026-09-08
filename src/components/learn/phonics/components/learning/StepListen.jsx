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

const WordCard = memo(function WordCard({ word }) {
  return (
    <div
      className="phonics-listen-card"
    >
      <span className="phonics-word-image-wrap">
        <WordImage src={word.image} word={word.word} priority />
      </span>
      <span className="phonics-word-label">{word.word}</span>
    </div>
  );
});

const StepListen = memo(function StepListen({ lesson, onComplete }) {
  const { play: playPhonic, isPlaying } = usePhonicsAudio(lesson.phonicAudio, lesson.phonicSound);
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
      <motion.div className="phonics-listen-focus" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}>
        <div className={`phonics-big-letter ${isPlaying ? "is-sounding" : ""}`} data-phonics-focus="letter" aria-label={`Letter ${lesson.letter}`}>
          {lesson.letter}
        </div>
        <motion.p className="phonics-sound-text" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
          {lesson.letter} {lesson.letter.toLowerCase()}
        </motion.p>

        {canHearPhoneme ? <motion.div className="phonics-sound-button-group" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
            onClick={handlePhonicClick}
            className={`phonics-sound-button ${isPlaying ? "is-playing" : ""}`}
            aria-label={`Replay the ${lesson.phonicSound} sound`}
            type="button"
          >
            <motion.span animate={isPlaying ? { scale: [1, 1.35, 1], opacity: [0.35, 0, 0.35] } : {}} transition={{ duration: 1.5, repeat: Infinity }} />
            <span aria-hidden="true">Replay</span>
          </motion.button>
          <span>{isPlaying ? "Listening..." : "Tap to hear the sound"}</span>
        </motion.div> : <p className="phonics-sound-unavailable" role="status">This sound is unavailable. Use the pictures and continue.</p>}
      </motion.div>

      <div className="phonics-listen-examples">
        <motion.p className="phonics-is-for" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {lesson.letter} is for...
        </motion.p>
        <div className="phonics-listen-grid" aria-label={`${lesson.letter} picture examples`}>
        {lesson.words.map(word => (
          <WordCard key={word.word} word={word} />
        ))}
        </div>
        <motion.p className="phonics-instruction" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          Look at each picture. The first sound is {lesson.letter}.
        </motion.p>
      </div>

      <motion.div className="phonics-step-actions" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      {Object.values(delivery).some(status => ["unavailable", "interrupted"].includes(status)) && <p role="status">Sound stopped or could not play. Tap it to retry, or continue with the pictures.</p>}
      {canHearPhoneme && delivery.sound === "unavailable" && <p role="status">The sound could not play. Replay it, or continue with the pictures.</p>}
        <PhonicsButton onClick={() => onComplete({ step: "listen", completionKind: "exposure", audioDelivery: settleExposureDeliveries(deliveryRef.current).sound || (canHearPhoneme ? "not_played" : "unavailable"), firstResponse: null, attempts: 0, supportUsed: ["picture_and_print_model"], independent: false, deliveries: settleExposureDeliveries(deliveryRef.current) })}>Next Step</PhonicsButton>
      </motion.div>
    </div>
  );
});

export default StepListen;

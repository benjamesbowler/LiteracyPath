import { memo, useCallback } from "react";
import { motion } from "framer-motion";
import { hasPhonicsAudioSource, usePhonicsAudio } from "../../../../../hooks/usePhonicsAudio";
import AudioButton from "../AudioButton";
import PhonicsButton from "../PhonicsButton";
import { WordImage } from "../WordImage";

const WordCard = memo(function WordCard({ word, index }) {
  const { play, isPlaying } = usePhonicsAudio(word.audio, word.phonemeBreakdown || word.word);
  const canHear = hasPhonicsAudioSource(word.audio);

  const handleTap = useCallback(() => {
    play();
  }, [play]);

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.5, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: 0.5 + index * 0.1, type: "spring", stiffness: 250, damping: 18 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={canHear ? handleTap : undefined}
      disabled={!canHear}
      className="phonics-listen-card"
      aria-label={canHear ? `Hear the word ${word.word}` : `Word: ${word.word}`}
      type="button"
    >
      <span className="phonics-word-image-wrap">
        <WordImage src={word.image} word={word.word} />
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

  const handlePhonicClick = useCallback(() => {
    playPhonic();
  }, [playPhonic]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.4 }}
      className="phonics-step phonics-step-listen"
    >
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
        {lesson.words.map((word, index) => (
          <WordCard key={word.word} word={word} index={index} />
        ))}
      </div>

      {lesson.words.some(word => hasPhonicsAudioSource(word.audio)) && (
        <motion.p className="phonics-instruction" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          Tap the pictures to hear the words!
        </motion.p>
      )}

      <motion.div className="phonics-step-actions" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <AudioButton src={lesson.phonicAudio} fallbackText={lesson.phonicSound} size={64} />
        <PhonicsButton onClick={onComplete}>Next Step</PhonicsButton>
      </motion.div>
    </motion.div>
  );
});

export default StepListen;

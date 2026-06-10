import { memo, useCallback } from "react";
import { motion } from "framer-motion";
import { usePhonicsAudio } from "../../../../hooks/usePhonicsAudio";

const AudioButton = memo(function AudioButton({
  src,
  fallbackText,
  size = 80,
  className = ""
}) {
  const { play, isPlaying } = usePhonicsAudio(src, fallbackText);

  const handleClick = useCallback(() => {
    play();
  }, [play]);

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleClick}
      className={`phonics-audio-button ${className}`}
      style={{ "--phonics-audio-size": `${size}px` }}
      aria-label="Play audio"
      type="button"
    >
      {!isPlaying && <span className="phonics-audio-pulse" />}
      {!isPlaying && (
        <motion.span
          className="phonics-audio-pulse phonics-audio-pulse-secondary"
          animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0, 0.2] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
        />
      )}

      {isPlaying ? (
        <span className="phonics-audio-bars" aria-hidden="true">
          <motion.span animate={{ height: [8, 20, 8] }} transition={{ duration: 0.5, repeat: Infinity }} />
          <motion.span animate={{ height: [14, 6, 14] }} transition={{ duration: 0.5, repeat: Infinity, delay: 0.1 }} />
          <motion.span animate={{ height: [8, 18, 8] }} transition={{ duration: 0.5, repeat: Infinity, delay: 0.2 }} />
        </span>
      ) : (
        <span className="phonics-speaker-icon" aria-hidden="true">Audio</span>
      )}
    </motion.button>
  );
});

export default AudioButton;

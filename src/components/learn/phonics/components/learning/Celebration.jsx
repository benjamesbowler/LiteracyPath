import { memo, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import PhonicsButton from "../PhonicsButton";

const Celebration = memo(function Celebration({
  letter,
  title = "Amazing!",
  subtitle,
  learnAnotherLabel = "Learn Another Letter",
  playAgainLabel = "Play Again",
  onLearnAnother,
  onPlayAgain
}) {
  const fireConfetti = useCallback(() => {
    const colors = ["#FFD93D", "#4D96FF", "#9B5DE5", "#95E1D3", "#FF6B6B"];

    confetti({ particleCount: 40, angle: 60, spread: 55, origin: { x: 0, y: 1 }, colors, disableForReducedMotion: true });
    confetti({ particleCount: 40, angle: 120, spread: 55, origin: { x: 1, y: 1 }, colors, disableForReducedMotion: true });
    setTimeout(() => {
      confetti({ particleCount: 30, angle: 90, spread: 100, origin: { x: 0.5, y: 0.3 }, colors, disableForReducedMotion: true });
    }, 300);
  }, []);

  useEffect(() => {
    const timer = setTimeout(fireConfetti, 400);
    return () => clearTimeout(timer);
  }, [fireConfetti]);

  return (
    <motion.div className="phonics-celebration-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div
        className="phonics-celebration-card"
        initial={{ scale: 0.8, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 250, damping: 20 }}
      >
        <div className="phonics-celebration-stars" aria-hidden="true">
          {[0, 1, 2].map(index => (
            <motion.span
              key={index}
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3 + index * 0.2, type: "spring", stiffness: 300, damping: 12 }}
            >
              ★
            </motion.span>
          ))}
        </div>

        <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {title}
        </motion.h2>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {subtitle || `You found all the ${letter} words!`}
        </motion.p>

        <motion.div className="phonics-celebration-actions" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <PhonicsButton onClick={onLearnAnother} className="phonics-wide-button">
            {learnAnotherLabel}
          </PhonicsButton>
          <PhonicsButton variant="secondary" onClick={onPlayAgain} className="phonics-wide-button">
            {playAgainLabel}
          </PhonicsButton>
        </motion.div>
      </motion.div>
    </motion.div>
  );
});

export default Celebration;

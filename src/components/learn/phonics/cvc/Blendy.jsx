import { memo } from "react";
import { motion, useReducedMotion } from "framer-motion";

const expressionConfig = {
  idle: { mouth: "M30 42 Q45 54 60 42", eyeScale: 1 },
  cheering: { mouth: "M27 40 Q45 61 63 40", eyeScale: 1.15 },
  munching: { mouth: "M32 38 Q45 50 58 38 Q45 62 32 38", eyeScale: 0.95 }
};

const Blendy = memo(function Blendy({ expression = "idle", className = "" }) {
  const config = expressionConfig[expression] || expressionConfig.idle;
  const reduceMotion = useReducedMotion();
  const floatAnimation = reduceMotion ? false : expression === "cheering" ? { y: [0, -8, 0] } : { y: [0, -3, 0] };

  return (
    <motion.svg
      className={`cvc-blendy ${className}`}
      viewBox="0 0 90 90"
      role="img"
      aria-label="Blendy"
      animate={floatAnimation}
      transition={reduceMotion ? { duration: 0 } : { duration: expression === "cheering" ? 0.55 : 2.6, repeat: Infinity, ease: "easeInOut" }}
    >
      <defs>
        <radialGradient id="blendyBody" cx="35%" cy="28%" r="70%">
          <stop offset="0%" stopColor="#fff7b0" />
          <stop offset="55%" stopColor="#ffcb77" />
          <stop offset="100%" stopColor="#ff8f70" />
        </radialGradient>
      </defs>
      <motion.circle cx="45" cy="45" r="34" fill="url(#blendyBody)" stroke="#2d3436" strokeWidth="3" />
      <motion.circle cx="33" cy="34" r="5" fill="#2d3436" animate={{ scaleY: config.eyeScale }} />
      <motion.circle cx="57" cy="34" r="5" fill="#2d3436" animate={{ scaleY: config.eyeScale }} />
      <circle cx="35" cy="32" r="1.6" fill="#ffffff" />
      <circle cx="59" cy="32" r="1.6" fill="#ffffff" />
      <motion.path
        d={config.mouth}
        fill={expression === "munching" ? "#2d3436" : "none"}
        stroke="#2d3436"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="4"
      />
      <path d="M18 49 Q8 43 15 34" fill="none" stroke="#2d3436" strokeLinecap="round" strokeWidth="4" />
      <path d="M72 49 Q82 43 75 34" fill="none" stroke="#2d3436" strokeLinecap="round" strokeWidth="4" />
    </motion.svg>
  );
});

export default Blendy;

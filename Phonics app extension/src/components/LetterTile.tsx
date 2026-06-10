import { useState } from 'react';
import { motion } from 'framer-motion';
import { speakPhoneme } from '@/lib/speech';

type TileState = 'default' | 'correct' | 'wrong' | 'selected';

interface LetterTileProps {
  letter: string;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  state?: TileState;
  draggable?: boolean;
  onDragStart?: () => void;
  isSoundEnabled?: boolean;
}

const sizeMap = {
  sm: 'w-14 h-16 text-2xl',
  md: 'w-[72px] h-20 text-[48px]',
  lg: 'w-20 h-24 text-[56px]',
};

export default function LetterTile({
  letter,
  onClick,
  size = 'md',
  state = 'default',
  draggable = false,
  onDragStart,
  isSoundEnabled = true,
}: LetterTileProps) {
  const [isPressed, setIsPressed] = useState(false);

  const stateStyles: Record<TileState, string> = {
    default: 'border-ocean-teal bg-white text-ocean-teal',
    correct: 'border-success-green bg-[#E8F5E9] text-success-green shadow-glow-correct',
    wrong: 'border-error-red bg-[#FFEBEE] text-error-red shadow-glow-wrong',
    selected: 'border-coral bg-blush text-coral',
  };

  const handleTap = () => {
    if (isSoundEnabled) speakPhoneme(letter);
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 200);
    onClick?.();
  };

  return (
    <motion.button
      whileHover={{ y: -4, boxShadow: '0 4px 16px rgba(0,128,128,0.2)' }}
      whileTap={{ scale: 0.9 }}
      animate={
        isPressed
          ? { scale: [0.9, 1.05, 1] }
          : state === 'wrong'
            ? { x: [-4, 4, -4, 4, 0] }
            : state === 'correct'
              ? { y: [0, -8, 0] }
              : {}
      }
      transition={{ duration: 0.3 }}
      className={`
        ${sizeMap[size]} rounded-2xl border-[3px] font-display font-normal
        flex items-center justify-center select-none cursor-pointer
        transition-colors duration-200
        ${stateStyles[state]}
      `}
      onClick={handleTap}
      draggable={draggable}
      onDragStart={onDragStart}
      aria-label={`Letter ${letter}`}
    >
      {letter.toUpperCase()}
    </motion.button>
  );
}

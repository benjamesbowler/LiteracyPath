import { motion } from 'framer-motion';
import { speak } from '@/lib/speech';

type TileState = 'default' | 'correct' | 'wrong' | 'selected';

interface WordTileProps {
  word: string;
  onClick?: () => void;
  state?: TileState;
  size?: 'sm' | 'md' | 'lg';
  isSoundEnabled?: boolean;
}

const stateStyles: Record<TileState, string> = {
  default: 'border-ocean-teal bg-white text-dark-text',
  correct: 'border-success-green bg-[#E8F5E9] text-success-green shadow-glow-correct',
  wrong: 'border-error-red bg-[#FFEBEE] text-error-red shadow-glow-wrong',
  selected: 'border-coral bg-blush text-coral',
};

const sizeMap = {
  sm: 'h-12 min-w-[80px] px-4 text-lg',
  md: 'h-16 min-w-[100px] px-5 text-2xl',
  lg: 'h-[72px] min-w-[120px] px-6 text-[28px]',
};

export default function WordTile({
  word,
  onClick,
  state = 'default',
  size = 'md',
  isSoundEnabled = true,
}: WordTileProps) {
  const handleClick = () => {
    if (isSoundEnabled) speak(word, { rate: 0.7, pitch: 1.1 });
    onClick?.();
  };

  return (
    <motion.button
      whileHover={{ y: -4, boxShadow: '0 4px 16px rgba(0,128,128,0.2)' }}
      whileTap={{ scale: 0.95 }}
      animate={state === 'wrong' ? { x: [-4, 4, -4, 4, 0] } : {}}
      transition={{ duration: 0.3 }}
      className={`
        ${sizeMap[size]} rounded-2xl border-[3px] font-body font-bold
        flex items-center justify-center select-none cursor-pointer
        transition-colors duration-200 capitalize
        ${stateStyles[state]}
      `}
      onClick={handleClick}
      aria-label={`Word ${word}`}
    >
      {word}
    </motion.button>
  );
}

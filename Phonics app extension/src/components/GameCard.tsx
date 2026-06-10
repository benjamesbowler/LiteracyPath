import { useState } from 'react';
import { motion } from 'framer-motion';
import ProgressStars from './ProgressStars';
import { playPopSound } from '@/lib/audio';
import type { GameMeta } from '@/lib/gameData';

interface GameCardProps {
  game: GameMeta;
  stars: 0 | 1 | 2 | 3;
  index: number;
  onLaunch: (gameId: string) => void;
  isSoundEnabled: boolean;
}

export default function GameCard({ game, stars, index, onLaunch, isSoundEnabled }: GameCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    if (isSoundEnabled) playPopSound();
    onLaunch(game.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5, ease: 'easeOut', delay: index * 0.08 }}
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.button
        whileHover={{ y: -8 }}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        onClick={handleClick}
        className={`
          w-full h-[320px] rounded-3xl border-[3px] border-border-light p-5
          flex flex-col items-center justify-between text-center
          shadow-card hover:shadow-card-hover hover:border-ocean-teal
          transition-all duration-300 cursor-pointer overflow-hidden
          ${game.color}
        `}
      >
        {/* Icon */}
        <motion.div
          className="flex-1 flex items-center justify-center"
          animate={isHovered ? { scale: [1, 1.08, 1] } : { scale: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <img
            src={game.icon}
            alt={game.title}
            className="w-36 h-36 object-contain"
            loading="lazy"
          />
        </motion.div>

        {/* Title */}
        <h3 className="font-display text-[24px] leading-tight text-dark-text mt-2">
          {game.title}
        </h3>

        {/* Skill Tag */}
        <span className="mt-1 px-3 py-1 rounded-full bg-white border border-border-light text-muted-text font-body font-bold text-[12px] uppercase tracking-wider">
          {game.skill}
        </span>

        {/* Stars */}
        <div className="mt-2">
          <ProgressStars stars={stars} size={18} />
        </div>

        {/* Hover Description Overlay */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isHovered ? { opacity: 0.95, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 bg-ocean-teal/90 rounded-3xl flex items-center justify-center p-6 pointer-events-none"
        >
          <p className="text-white font-body text-[16px] leading-relaxed text-center">
            {game.description}
          </p>
        </motion.div>
      </motion.button>
    </motion.div>
  );
}

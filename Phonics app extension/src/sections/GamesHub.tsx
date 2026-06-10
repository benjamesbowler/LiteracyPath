import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GAME_LIST } from '@/lib/gameData';
import { getGameStars } from '@/lib/progress';
import GameCard from '@/components/GameCard';
import CloudDecoration from '@/components/CloudDecoration';

const categories = ['All', 'CVC Words', 'Sight Words', 'Blending', 'Reading'];

interface GamesHubProps {
  onLaunchGame: (gameId: string) => void;
  isSoundEnabled: boolean;
}

export default function GamesHub({ onLaunchGame, isSoundEnabled }: GamesHubProps) {
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredGames =
    activeCategory === 'All'
      ? GAME_LIST
      : GAME_LIST.filter((g) => g.category === activeCategory);

  return (
    <section id="games" className="relative bg-soft-cream py-20 px-6">
      {/* Cloud decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <CloudDecoration
          className="absolute top-[10%] left-[5%] w-[180px] h-[100px] text-coral opacity-[0.06]"
          style={{ animation: 'cloud-drift 25s ease-in-out infinite, float 18s ease-in-out infinite' }}
        />
        <CloudDecoration
          className="absolute top-[40%] right-[8%] w-[220px] h-[120px] text-coral opacity-[0.06]"
          style={{ animation: 'cloud-drift 30s ease-in-out infinite, float 22s ease-in-out infinite' }}
        />
        <CloudDecoration
          className="absolute bottom-[15%] left-[15%] w-[160px] h-[90px] text-coral opacity-[0.06]"
          style={{ animation: 'cloud-drift 20s ease-in-out infinite, float 15s ease-in-out infinite' }}
        />
      </div>

      <div className="relative z-[1] max-w-[1200px] mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center"
        >
          <h2 className="font-display text-[48px] leading-[1.15] text-deep-teal">
            10 Fun Learning Games
          </h2>
          <p className="mt-2 font-body text-[20px] text-dark-text/70">
            Tap any game to start playing! Each game teaches a different reading skill.
          </p>
        </motion.div>

        {/* Category Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-wrap justify-center gap-3 mt-6"
        >
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`
                px-5 py-2 rounded-full font-body font-bold text-[14px] transition-all duration-200
                ${activeCategory === cat
                  ? 'bg-ocean-teal text-white'
                  : 'bg-white border-2 border-border-light text-dark-text hover:border-ocean-teal hover:text-ocean-teal'
                }
              `}
            >
              {cat}
            </button>
          ))}
        </motion.div>

        {/* Game Cards Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredGames.map((game, i) => (
              <GameCard
                key={game.id}
                game={game}
                stars={getGameStars(game.id) as 0 | 1 | 2 | 3}
                index={i}
                onLaunch={onLaunchGame}
                isSoundEnabled={isSoundEnabled}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

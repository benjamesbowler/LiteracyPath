import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GAME_LIST } from '@/lib/gameData';
import { getTotalStars, getGameStars } from '@/lib/progress';
import { StarIcon } from '@/components/StarIcon';

function getEncouragement(total: number): { message: string; showCelebration: boolean } {
  if (total === 0) return { message: 'Ready to start your reading adventure? Pick a game above!', showCelebration: false };
  if (total <= 10) return { message: 'Great start! Keep playing to earn more stars!', showCelebration: false };
  if (total <= 20) return { message: 'You\'re doing amazing! Halfway to reading superstar!', showCelebration: false };
  if (total < 30) return { message: 'So close to collecting all the stars! You can do it!', showCelebration: false };
  return { message: 'You\'re a Phonics Superstar! All 30 stars earned!', showCelebration: true };
}

export default function LearningProgress() {
  const [totalStars, setTotalStars] = useState(0);
  const [percentage, setPercentage] = useState(0);

  useEffect(() => {
    const stars = getTotalStars();
    setTotalStars(stars);
    setPercentage(Math.round((stars / 30) * 100));
  }, []);

  const { message, showCelebration } = getEncouragement(totalStars);

  const circumference = 2 * Math.PI * 80;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <section id="progress" className="bg-soft-cream py-20 px-6">
      <div className="max-w-[800px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center mb-10"
        >
          <h2 className="font-display text-[48px] leading-[1.15] text-deep-teal">
            Your Progress
          </h2>
          <p className="mt-2 font-body text-[20px] text-dark-text/70">
            See how many games you&apos;ve completed!
          </p>
        </motion.div>

        {/* Progress Ring */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="flex justify-center"
        >
          <div className="relative w-[200px] h-[200px]">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
              {/* Background track */}
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="#E8E0D0"
                strokeWidth="16"
              />
              {/* Progress arc */}
              <motion.circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="#008080"
                strokeWidth="16"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                whileInView={{ strokeDashoffset }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
              />
            </svg>
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-[40px] leading-none text-deep-teal">
                {percentage}%
              </span>
              <span className="font-body font-bold text-[14px] uppercase tracking-wider text-muted-text mt-1">
                Complete
              </span>
            </div>
          </div>
        </motion.div>

        {/* Star Breakdown */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 flex flex-wrap justify-center gap-4"
        >
          {GAME_LIST.map((game, i) => {
            const stars = getGameStars(game.id) as 0 | 1 | 2 | 3;
            return (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: 0.4 + i * 0.1 }}
                className="flex flex-col items-center gap-1"
              >
                <img
                  src={game.icon}
                  alt={game.title}
                  className="w-8 h-8 object-contain"
                  loading="lazy"
                />
                <div className="flex gap-0.5">
                  {[0, 1, 2].map((s) => (
                    <StarIcon key={s} filled={s < stars} size={14} />
                  ))}
                </div>
                <span className="font-body font-bold text-[10px] text-muted-text max-w-[60px] text-center truncate">
                  {game.title}
                </span>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Encouragement Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-6 flex items-center justify-center gap-2 text-center"
        >
          {showCelebration && (
            <img
              src="/phinny-celebrating.png"
              alt="Phinny celebrating"
              className="w-10 h-10 object-contain"
              loading="lazy"
            />
          )}
          <p className="font-body font-bold text-[18px] text-coral">{message}</p>
        </motion.div>
      </div>
    </section>
  );
}

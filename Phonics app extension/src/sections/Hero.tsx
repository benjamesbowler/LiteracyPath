import { motion } from 'framer-motion';
import HeroWave from '@/components/HeroWave';
import { Star } from 'lucide-react';

const titleChars = 'Phonics Fun House'.split('');

interface HeroProps {
  onScrollTo?: (id: string) => void;
}

export default function Hero({ onScrollTo }: HeroProps) {
  return (
    <section className="relative min-h-[90dvh] overflow-hidden bg-soft-cream px-6 pt-28 pb-40">
      {/* Decorative confetti shapes */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {Array.from({ length: 25 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-ocean-teal"
            style={{
              width: `${12 + Math.random() * 28}px`,
              height: `${12 + Math.random() * 28}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: 0.04,
              transform: `rotate(${Math.random() * 360}deg)`,
            }}
          />
        ))}
      </div>

      {/* Phinny */}
      <motion.div
        initial={{ y: '100%', scale: 0.5, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
        className="absolute right-[5%] bottom-[20%] z-[1] w-[200px] lg:w-[380px] pointer-events-none"
      >
        <img
          src="/phinny-cat.png"
          alt="Phinny the cat"
          className="w-full h-auto object-contain"
          loading="eager"
        />
      </motion.div>

      {/* Content */}
      <div className="relative z-[2] max-w-[1200px] mx-auto">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.4 }}
          className="inline-block mb-4"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blush border border-coral text-coral font-body font-bold text-[14px] uppercase tracking-wider">
            Free Phonics Learning Games
          </span>
        </motion.div>

        {/* Title */}
        <h1 className="font-display text-[36px] lg:text-[64px] leading-[1.1] text-deep-teal max-w-[700px]">
          {titleChars.map((char, i) => (
            <motion.span
              key={i}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 10,
                delay: 0.5 + i * 0.04,
              }}
              className="inline-block"
              style={{ whiteSpace: char === ' ' ? 'pre' : undefined }}
            >
              {char === ' ' ? '\u00A0' : char}
            </motion.span>
          ))}
        </h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 1.0 }}
          className="mt-4 max-w-[580px] font-body text-[20px] leading-[1.5] text-dark-text/85"
        >
          Learn to read with 10 fun mini-games! Build CVC words, master sight words,
          practice blending, and race through sentences — all with a little help from
          Phinny the Cat.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: 1.2 }}
          className="mt-8 flex flex-wrap gap-4"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onScrollTo?.('games')}
            className="px-10 py-4 bg-coral text-white rounded-full font-body font-extrabold text-[20px] shadow-button hover:shadow-button-hover transition-all duration-200"
          >
            Start Playing!
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onScrollTo?.('how-it-works')}
            className="px-7 py-3.5 border-2 border-ocean-teal text-ocean-teal rounded-full font-body font-bold text-[16px] hover:bg-ocean-teal hover:text-white transition-all duration-200"
          >
            How It Works
          </motion.button>
        </motion.div>

        {/* Age Badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 1.5 }}
          className="mt-5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-golden text-deep-teal font-body font-bold text-[14px] uppercase tracking-wider"
        >
          <Star className="w-4 h-4" />
          Ages 3–7
        </motion.div>
      </div>

      {/* Wave */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut', delay: 0.8 }}
        className="absolute bottom-0 left-0 right-0 h-[120px] z-[3]"
      >
        <div className="relative w-full h-full animate-wave-sway">
          <HeroWave fill="#008080" className="w-full h-full" />
        </div>
        <div className="h-2 bg-deep-teal" />
      </motion.div>
    </section>
  );
}

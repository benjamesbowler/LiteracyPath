import { motion } from 'framer-motion';
import HeroWave from '@/components/HeroWave';

const steps = [
  {
    number: '1',
    color: 'bg-coral text-white',
    title: 'Pick a Game',
    description:
      'Choose from 10 fun mini-games covering CVC words, sight words, blending, rhyming, and reading.',
  },
  {
    number: '2',
    color: 'bg-golden text-deep-teal',
    title: 'Tap & Learn',
    description:
      'Tap letters to hear their sounds. Tap words to hear them spoken aloud. Every tap is a learning moment!',
  },
  {
    number: '3',
    color: 'bg-mint text-deep-teal',
    title: 'Play & Practice',
    description:
      'Games automatically adjust to your child\'s skill level. Practice makes perfect — and fun makes practice happen!',
  },
  {
    number: '4',
    color: 'bg-blush text-deep-teal',
    title: 'Earn Stars',
    description:
      'Collect up to 3 stars per game. Track progress and watch your reading skills grow!',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="relative bg-ocean-teal py-20 px-6">
      {/* Flipped Wave Top */}
      <div className="absolute top-0 left-0 right-0 h-[80px] rotate-180">
        <HeroWave fill="#FFFDF7" className="w-full h-full" />
      </div>

      <div className="max-w-[1000px] mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-[48px] leading-[1.15] text-white">
            How Phonics Fun House Works
          </h2>
          <p className="mt-2 font-body text-[20px] text-white/80">
            Four simple steps to happy readers
          </p>
        </motion.div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: i * 0.15 }}
              className="flex flex-col items-center text-center"
            >
              {/* Number Circle with Pulse */}
              <motion.div
                initial={{ scale: 0.8 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: i * 0.15 }}
                className={`
                  w-16 h-16 rounded-full flex items-center justify-center
                  font-display text-[40px] leading-none animate-pulse-ring
                  ${step.color}
                `}
              >
                {step.number}
              </motion.div>
              <h3 className="mt-4 font-body font-bold text-[24px] leading-[1.3] text-white">
                {step.title}
              </h3>
              <p className="mt-2 font-body text-[18px] leading-[1.6] text-white/80">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Phinny Waving - desktop only */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="absolute bottom-0 right-0 w-[200px] hidden lg:block pointer-events-none"
      >
        <img
          src="/phinny-waving.png"
          alt="Phinny waving"
          className="w-full h-auto object-contain"
          loading="lazy"
        />
      </motion.div>
    </section>
  );
}

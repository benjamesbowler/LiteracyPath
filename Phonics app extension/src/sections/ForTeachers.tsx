import { motion } from 'framer-motion';
import { GraduationCap, WifiOff, TrendingUp, Volume2 } from 'lucide-react';

const features = [
  {
    icon: GraduationCap,
    iconColor: 'text-ocean-teal',
    title: 'Three Difficulty Levels',
    description:
      'Easy mode introduces simple CVC words with generous hints. Medium adds blends and digraphs. Hard mode challenges with full sentences and timed play. Adjust anytime in Settings.',
  },
  {
    icon: WifiOff,
    iconColor: 'text-coral',
    title: 'Works Offline',
    description:
      "Once loaded, all games work without an internet connection. Perfect for car rides, classrooms, and traveling. Audio is generated locally using your browser's built-in speech.",
  },
  {
    icon: TrendingUp,
    iconColor: 'text-golden',
    title: 'Track Learning Progress',
    description:
      'Star ratings and completion data are saved locally in your browser. Children can see their progress grow, building confidence and motivation to keep learning.',
  },
  {
    icon: Volume2,
    iconColor: 'text-ocean-teal',
    title: 'Built-In Audio Guide',
    description:
      'Every letter, word, and instruction can be read aloud. The app uses your browser\'s text-to-speech at a child-friendly pace. Toggle sound on/off at any time.',
  },
];

interface ForTeachersProps {
  onScrollTo?: (id: string) => void;
}

export default function ForTeachers({ onScrollTo }: ForTeachersProps) {
  return (
    <section
      id="teachers"
      className="py-20 px-6"
      style={{ background: 'linear-gradient(180deg, #FFFDF7 0%, #FFF0E0 100%)' }}
    >
      <div className="max-w-[1000px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center mb-10"
        >
          <h2 className="font-display text-[48px] leading-[1.15] text-deep-teal">
            For Teachers &amp; Parents
          </h2>
          <p className="mt-2 font-body text-[20px] text-dark-text/70">
            Everything you need to support your little reader
          </p>
        </motion.div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.5, ease: 'easeOut', delay: i * 0.12 }}
                whileHover={{ y: -4 }}
                className="bg-white rounded-3xl p-8 shadow-card border-2 border-border-light hover:shadow-card-hover transition-all duration-300"
              >
                <Icon className={`w-8 h-8 ${feature.iconColor} mb-4`} />
                <h3 className="font-body font-bold text-[24px] leading-[1.3] text-dark-text">
                  {feature.title}
                </h3>
                <p className="mt-2 font-body text-[18px] leading-[1.6] text-dark-text/80">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* CTA Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.3 }}
          className="mt-12 bg-ocean-teal rounded-[32px] p-10 text-center"
        >
          <h3 className="font-body font-bold text-[36px] leading-[1.2] text-white">
            Ready to help your child learn to read?
          </h3>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onScrollTo?.('games')}
            className="mt-4 px-8 py-4 bg-coral text-white rounded-full font-body font-extrabold text-[18px] shadow-button hover:shadow-button-hover transition-all duration-200"
          >
            Start Playing Now
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}

import { motion } from 'framer-motion';
import { StarIcon } from './StarIcon';

interface ProgressStarsProps {
  stars: 0 | 1 | 2 | 3;
  maxStars?: number;
  size?: number;
}

export default function ProgressStars({ stars, maxStars = 3, size = 20 }: ProgressStarsProps) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: maxStars }).map((_, i) => (
        <motion.div
          key={i}
          initial={i < stars ? { scale: 0 } : { scale: 1 }}
          animate={{ scale: 1 }}
          transition={
            i < stars
              ? { type: 'spring', stiffness: 300, damping: 15, delay: i * 0.1 }
              : {}
          }
        >
          <StarIcon filled={i < stars} size={size} />
        </motion.div>
      ))}
    </div>
  );
}

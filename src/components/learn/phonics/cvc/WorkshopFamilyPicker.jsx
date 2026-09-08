import { useMemo } from "react";
import { motion } from "framer-motion";
import { cvcWordFamilies } from "../../../../data/cvcWordFamilies";
import { WordImage } from "../components/WordImage";
import Blendy from "./Blendy";
import { getWorkshopPrerequisites } from "../phonicsActivityState.js";
import { makeCvcWordModels } from "./cvcHelpers";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.15 }
  }
};

const cardVariants = {
  hidden: { scale: 0.9, opacity: 0, y: 18 },
  visible: {
    scale: 1,
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 250, damping: 20 }
  }
};

function LockIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
      <path d="M7 10V8a5 5 0 0 1 10 0v2" />
      <rect x="5" y="10" width="14" height="10" rx="2" />
    </svg>
  );
}

export function WorkshopFamilyPicker({ progress = {}, letterProgress = {}, onSelectFamily }) {
  const completedCount = Object.values(progress).filter(status => status === "completed").length;
  const familyCards = useMemo(() => cvcWordFamilies.map(family => {
    const { missing, eligible } = getWorkshopPrerequisites(family, letterProgress);
    const locked = !eligible;
    return {
      family,
      missing,
      locked,
      status: locked ? "locked" : progress[family.id] || "default",
      words: makeCvcWordModels(family.buildWords.slice(0, 3), family)
    };
  }), [progress, letterProgress]);

  return (
    <div className="cvc-picker" aria-label="Word Workshop">
      <motion.div className="cvc-picker-hero" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <Blendy expression="idle" />
        <div>
          <h1 data-child-title="">Word Workshop</h1>
          <p data-child-instruction="">Tap a word nest.</p>
        </div>
      </motion.div>

      <motion.div className="cvc-family-grid" variants={containerVariants} initial="hidden" animate="visible">
        {familyCards.map(({ family, locked, missing, status, words }) => {
          const isClickable = !locked;

          return (
            <motion.button
              key={family.id}
              variants={cardVariants}
              whileHover={isClickable ? { scale: 1.04, y: -2 } : {}}
              whileTap={isClickable ? { scale: 0.97 } : {}}
              onClick={() => isClickable && onSelectFamily(family)}
              disabled={!isClickable}
              className={`cvc-family-card ${status}`}
              aria-label={`${family.rime} word nest${locked ? `. Practise ${missing.join(", ")} first` : ""}`}
              type="button"
            >
              <span className="cvc-family-rime">-{family.rime}</span>
              <span className="cvc-family-images" aria-hidden="true">
                {words.map(model => (
                  <span className="cvc-family-thumb" key={model.word}>
                    <WordImage src={model.image} word={model.word} />
                  </span>
                ))}
              </span>
              {locked && <span>Practise {missing.join(", ")} first</span>}
              <span className="cvc-family-status" aria-hidden="true">
                {status === "completed" && "✓"}
                {status === "inprogress" && <span className="phonics-status-pulse" />}
                {status === "locked" && <LockIcon />}
                {status === "default" && <span className="phonics-status-dot" />}
              </span>
            </motion.button>
          );
        })}
      </motion.div>

      <motion.div
        className="phonics-picker-progress cvc-picker-progress"
        data-child-progress=""
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <span>{completedCount} of {cvcWordFamilies.length} word nests built</span>
        <span className="phonics-picker-stars" aria-hidden="true">
          {Array.from({ length: 3 }).map((_, index) => (
            <span key={index}>{index < Math.floor((completedCount / cvcWordFamilies.length) * 3) ? "★" : "☆"}</span>
          ))}
        </span>
      </motion.div>
    </div>
  );
}

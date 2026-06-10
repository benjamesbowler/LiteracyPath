import { motion } from "framer-motion";

export default function PhonicsProgressBar({ steps }) {
  return (
    <div className="phonics-progress-bar" aria-label="Phonics lesson progress">
      {steps.map((status, index) => (
        <div className="phonics-progress-step" key={`${status}-${index}`}>
          <div className={`phonics-progress-segment ${status}`}>
            {(status === "active" || status === "complete") && (
              <motion.span
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              />
            )}
          </div>
          <motion.span
            className={`phonics-progress-star ${status}`}
            initial={status === "complete" ? { scale: 0, rotate: -180 } : false}
            animate={status === "complete" ? { scale: 1, rotate: 0 } : false}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
            aria-hidden="true"
          >
            {status === "complete" ? "★" : "☆"}
          </motion.span>
        </div>
      ))}
    </div>
  );
}

import { useMemo } from "react";
import { motion } from "framer-motion";
import { getAllLetters, getAvailableLetters } from "../../../data/phonicsLessons";
import { ChildRecommendationExplanation } from "../../recommendations/RecommendationExplanation.jsx";

export function PhonicsAlphabetPicker({ progress = {}, onSelectLetter }) {
  const letters = useMemo(() => getAllLetters(), []);
  const availableLetters = useMemo(() => new Set(getAvailableLetters()), []);
  const completedCount = Object.values(progress).filter(status => status === "completed").length;
  const totalLetters = letters.length;
  const recommendedLetter = letters.find(letter => (
    availableLetters.has(letter) && progress[letter] !== "completed"
  )) || letters.find(letter => availableLetters.has(letter));

  function getStatus(letter) {
    if (!availableLetters.has(letter)) return "locked";
    return progress[letter] || "default";
  }

  function handleLetterClick(letter, status) {
    if (status === "locked") return;
    onSelectLetter(letter);
  }

  return (
    <div className="phonics-picker">
      <h2>Choose a letter</h2>

      <p>Tap a letter to hear its sound and start practising.</p>
      {recommendedLetter && (
        <p className="phonics-recommendation-reason">
          <strong>Why this one?</strong>{" "}
          <ChildRecommendationExplanation
            surface="phonics-letter"
            reason={progress[recommendedLetter] === "inprogress"
              ? "You already started this letter, so it is ready to continue."
              : "This is your next available letter to learn."}
          />
        </p>
      )}

      <div className="phonics-letter-grid" data-child-choices="">
        {letters.map(letter => {
          const status = getStatus(letter);
          const isClickable = status !== "locked";

          return (
            <motion.button
              key={letter}
              whileHover={isClickable ? { scale: 1.08 } : {}}
              whileTap={isClickable ? { scale: 0.95 } : {}}
              onClick={() => handleLetterClick(letter, status)}
              disabled={!isClickable}
              className={`phonics-letter-card ${status}${letter === recommendedLetter ? " recommended" : ""}`}
              aria-label={`Letter ${letter}${status === "locked" ? " locked" : ""}`}
              type="button"
              data-child-primary={letter === recommendedLetter ? "" : undefined}
              data-child-emphasis={letter === recommendedLetter ? "primary" : "choice"}
            >
              <span className="phonics-letter-symbol">{letter}</span>
              {letter === recommendedLetter && (
                <span className="phonics-letter-next" data-child-emphasis-cue="">Start here</span>
              )}
              <span className="phonics-letter-status" aria-hidden="true">
                {status === "completed" && "✓"}
                {status === "inprogress" && <span className="phonics-status-pulse" />}
                {status === "locked" && (
                  <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
                    <path d="M7 10V8a5 5 0 0 1 10 0v2" />
                    <rect x="5" y="10" width="14" height="10" rx="2" />
                  </svg>
                )}
                {status === "default" && <span className="phonics-status-dot" />}
              </span>
            </motion.button>
          );
        })}
      </div>

      <div className="phonics-picker-progress">
        <span>{completedCount}/{totalLetters} letters learned</span>
        <span className="phonics-picker-stars" aria-hidden="true">
          {Array.from({ length: 3 }).map((_, index) => (
            <span key={index}>{index < Math.floor((completedCount / totalLetters) * 3) ? "★" : "☆"}</span>
          ))}
        </span>
      </div>
    </div>
  );
}

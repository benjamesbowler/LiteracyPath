import { useMemo } from "react";
import { motion } from "framer-motion";
import { getAllLetters, getAvailableLetters } from "../../../data/phonicsLessons";
import { ChildRecommendationExplanation } from "../../recommendations/RecommendationExplanation.jsx";
import { LETTER_PRACTICE_ROUND_COUNT } from "../../../policy/letterPractice.js";
import { recommendLetterPractice } from "../../../policy/letterPracticeRecommendation.js";
import { speakStudentRailLabel } from "../../../policy/studentRailPolicy.js";

function letterAccessibleName(letter, status, recommended) {
  const states = recommended ? ["Start here"] : [];
  if (status === "locked") states.push("locked");
  if (status === "completed") states.push("completed");
  if (status === "inprogress") states.push("in progress");
  if (recommended) states.push("recommended");
  return [`Letter ${letter}`, ...states].join(", ");
}

export function PhonicsAlphabetPicker({ progress = {}, rounds = {}, teachingCycleId = "", confirmedPlacement = null, onSelectLetter }) {
  const letters = useMemo(() => getAllLetters(), []);
  const availableLetters = useMemo(() => new Set(getAvailableLetters()), []);
  const completedCount = Object.values(progress).filter(status => status === "completed").length;
  const totalLetters = letters.length;
  const recommendation = recommendLetterPractice({ letters, availableLetters, progress, teachingCycleId, confirmedPlacement });
  const recommendedLetter = recommendation.letter;

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
      <h1 data-child-title="">Choose a letter</h1>

      <p data-child-instruction="">Choose a letter. Collect five rounds of practice.</p>
      {recommendedLetter && (
        <p className="phonics-recommendation-reason">
          <ChildRecommendationExplanation
            surface="phonics-letter"
            reason={recommendation.reason}
          />
          <button type="button" className="phonics-recommendation-hear" aria-label="Hear why this letter" onClick={() => speakStudentRailLabel(recommendation.reason)}>
            <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false"><path d="M4 9h4l5-4v14l-5-4H4zM16 8c2 2 2 6 0 8M19 5c4 4 4 10 0 14" /></svg>
          </button>
        </p>
      )}

      <div className="phonics-letter-grid" role="group" aria-label="Choose a letter to practise" data-child-choices="">
        {letters.map(letter => {
          const status = getStatus(letter);
          const isClickable = status !== "locked";
          const isRecommended = letter === recommendedLetter;

          return (
            <motion.button
              key={letter}
              whileHover={isClickable ? { y: -2 } : {}}
              onClick={() => handleLetterClick(letter, status)}
              disabled={!isClickable}
              className={`phonics-letter-card wa-choice ${status}${isRecommended ? " recommended" : ""}`}
              aria-label={letterAccessibleName(letter, status, isRecommended)}
              aria-description={`${rounds[letter]?.completedCount || 0} of ${LETTER_PRACTICE_ROUND_COUNT} rounds`}
              type="button"
              data-child-primary={isRecommended ? "" : undefined}
              data-child-emphasis={isRecommended ? "primary" : "choice"}
            >
              <span className="phonics-letter-symbol">{letter}</span>
              {isRecommended && (
                <span className="phonics-letter-next" data-child-emphasis-cue="">Start here</span>
              )}
              {status === "inprogress" && <span className="phonics-letter-rounds" aria-hidden="true">{rounds[letter]?.completedCount || 0}/{LETTER_PRACTICE_ROUND_COUNT}</span>}
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

      <div className="phonics-picker-progress" data-child-progress="">
        <span>{completedCount} of {totalLetters} letters finished</span>
        <span className="phonics-picker-stars" aria-hidden="true">
          {Array.from({ length: 3 }).map((_, index) => (
            <span key={index}>{index < Math.floor((completedCount / totalLetters) * 3) ? "★" : "☆"}</span>
          ))}
        </span>
      </div>
    </div>
  );
}

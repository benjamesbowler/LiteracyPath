import "../../../styles/child-browse.css";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useChildBrowseMedia, useCompactChildBrowse } from "../../../hooks/useCompactChildBrowse.js";
import { getAllLetters, getAvailableLetters } from "../../../data/phonicsLessons";
import { ChildRecommendationExplanation } from "../../recommendations/RecommendationExplanation.jsx";
import { LETTER_PRACTICE_ROUND_COUNT } from "../../../policy/letterPractice.js";
import { familiarLetterPractice, recommendLetterPractice } from "../../../policy/letterPracticeRecommendation.js";
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
  const [showAlphabet, setShowAlphabet] = useState(false);
  const [alphabetPage, setAlphabetPage] = useState(0);
  const letters = useMemo(() => getAllLetters(), []);
  const availableLetters = useMemo(() => new Set(getAvailableLetters()), []);
  const completedCount = Object.values(progress).filter(status => status === "completed").length;
  const totalLetters = letters.length;
  const recommendation = recommendLetterPractice({ letters, availableLetters, progress, teachingCycleId, confirmedPlacement });
  const recommendedLetter = recommendation.letter;
  const familiarLetters = familiarLetterPractice({ letters, availableLetters, progress, teachingCycleId, confirmedPlacement, recommendedLetter });
  const compactBrowse = useCompactChildBrowse();
  const narrowPhoneBrowse = useChildBrowseMedia("(max-width: 350px)");
  const alphabetSlots = compactBrowse || narrowPhoneBrowse ? 3 : 9;
  const lastAlphabetPage = Math.ceil(letters.length / alphabetSlots) - 1;
  const visibleAlphabetPage = Math.min(alphabetPage, lastAlphabetPage);
  const alphabetLetters = letters.slice(visibleAlphabetPage * alphabetSlots, (visibleAlphabetPage + 1) * alphabetSlots);

  function getStatus(letter) {
    if (!availableLetters.has(letter)) return "locked";
    return progress[letter] || "default";
  }

  function handleLetterClick(letter, status) {
    if (status === "locked") return;
    onSelectLetter(letter);
  }

  return (
    <div className="phonics-picker phonics-simple-picker" data-alphabet-open={showAlphabet ? "true" : "false"}>
      <h1 data-child-title="">Letters</h1>

      <p data-child-instruction="">{narrowPhoneBrowse ? "Practise this letter." : "Practise this letter. Your place is saved."}</p>
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

      {recommendedLetter && <button type="button" className="phonics-letter-feature" onClick={() => handleLetterClick(recommendedLetter, getStatus(recommendedLetter))}
        aria-label={`Practise ${recommendedLetter}`} data-child-primary="" data-child-emphasis="primary">
        <span className="phonics-letter-symbol">{recommendedLetter}</span>
        <span><strong data-child-emphasis-cue="">Practise {recommendedLetter}</strong><small>{rounds[recommendedLetter]?.completedCount || 0} of {LETTER_PRACTICE_ROUND_COUNT} rounds</small></span>
      </button>}
      {!showAlphabet && familiarLetters.length > 0 && <div className="phonics-familiar-letters" role="group" aria-label="Letters to practise again" data-child-choices="">
        <span>Practise again</span>{familiarLetters.map(letter => <button key={letter} type="button" className="phonics-letter-card wa-choice" aria-label={`Practise ${letter} again`} onClick={() => handleLetterClick(letter, getStatus(letter))}>
          <span className="phonics-letter-symbol">{letter}</span>
        </button>)}
      </div>}
      <button type="button" className="phonics-alphabet-toggle" aria-expanded={showAlphabet} aria-controls="phonics-all-letters" onClick={() => setShowAlphabet(open => !open)}>{showAlphabet ? "Close alphabet" : "Choose a letter"}</button>
      {showAlphabet && <section id="phonics-all-letters" className="phonics-alphabet-discovery">
      <div className="phonics-letter-grid" role="group" aria-label="All letters" data-child-choices="">
        {alphabetLetters.map(letter => {
          const status = getStatus(letter);
          const isClickable = status !== "locked";
          const isRecommended = false;

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

        <div className="phonics-alphabet-pages"><button type="button" disabled={visibleAlphabetPage === 0} onClick={() => setAlphabetPage(visibleAlphabetPage - 1)}>Previous letters</button>
          <span role="status">{alphabetLetters[0]} to {alphabetLetters.at(-1)}</span>
          <button type="button" disabled={visibleAlphabetPage === lastAlphabetPage} onClick={() => setAlphabetPage(visibleAlphabetPage + 1)}>More letters</button></div>
      </section>}

      <div className="phonics-picker-progress" data-child-progress="">
        <span>{completedCount} of {totalLetters} letters finished</span>

      </div>
    </div>
  );
}

import "../../../styles/child-browse.css";
import { getAllLetters } from "../../../data/phonicsLessons.js";
import { LETTER_PRACTICE_ROUND_COUNT } from "../../../policy/letterPractice.js";

export function PhonicsAlphabetPicker({ progress = {}, rounds = {}, onSelectLetter }) {
  const letters = getAllLetters();
  const completedCount = letters.filter(letter => progress[letter] === "completed").length;
  return <section className="phonics-picker phonics-alphabet-picker" aria-labelledby="phonics-alphabet-title">
    <header className="phonics-alphabet-heading"><h1 id="phonics-alphabet-title" data-child-title="">Letters</h1><p data-child-instruction="">Choose any letter to play.</p></header>
    <div className="phonics-letter-grid" role="group" aria-label="All 26 letters" data-child-choices="" data-child-primary="">
      {letters.map(letter => {
        const status = progress[letter] === "completed" ? "completed" : progress[letter] === "inprogress" ? "inprogress" : "default";
        const label = status === "completed" ? "Complete" : status === "inprogress" ? "Try again" : "";
        return <button key={letter} type="button" className={`phonics-letter-card wa-choice ${status}`} onClick={() => onSelectLetter(letter)}
          aria-label={`Letter ${letter}${label ? `, ${label}` : ""}`} aria-description={`${rounds[letter]?.completedCount || 0} of ${LETTER_PRACTICE_ROUND_COUNT} rounds`} data-child-emphasis="choice">
          <span className="phonics-letter-symbol">{letter}<small>{letter.toLowerCase()}</small></span>
          {label && <span className="phonics-letter-state">{status === "completed" && <span aria-hidden="true">✓ </span>}{label}</span>}
        </button>;
      })}
    </div>
    <p className="phonics-alphabet-progress" data-child-progress="">{completedCount} of 26 letters complete</p>
  </section>;
}

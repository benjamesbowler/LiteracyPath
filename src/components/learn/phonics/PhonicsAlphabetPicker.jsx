import "../../../styles/child-browse.css";
import ChildPageControls from "../../ChildPageControls.jsx";
import { getAllLetters } from "../../../data/phonicsLessons.js";
import { LETTER_PRACTICE_ROUND_COUNT } from "../../../policy/letterPractice.js";

export function PhonicsAlphabetPicker({ pages, progress = {}, rounds = {}, onSelectLetter }) {
  const letters = getAllLetters();
  const completedCount = letters.filter(letter => progress[letter] === "completed").length;
  return <section className="phonics-picker phonics-alphabet-picker" aria-labelledby="phonics-alphabet-title" data-paged={pages.pageCount > 1 ? "" : undefined}>
    <header className="phonics-alphabet-heading"><h1 id="phonics-alphabet-title" data-child-title="">Letters</h1><p data-child-instruction="">Choose any letter to play.</p></header>
    <div className="phonics-letter-grid" role="group" aria-label="All 26 letters" data-child-choices="" data-child-primary="">
      {pages.visibleItems.map(letter => {
        const status = progress[letter] === "completed" ? "completed" : progress[letter] === "inprogress" ? "inprogress" : "default";
        const completedRounds = rounds[letter]?.completedCount || 0;
        const label = status === "completed" ? "Complete" : status === "inprogress" ? "Continue" : "";
        return <button key={letter} data-picker-key={letter} type="button" className={`phonics-letter-card wa-choice ${status}`} onClick={() => onSelectLetter(letter)}
          aria-label={`Letter ${letter}${label ? `, ${label}` : ""}`} aria-description={`${completedRounds} of ${LETTER_PRACTICE_ROUND_COUNT} rounds`} data-child-emphasis="choice">
          <span className="phonics-letter-symbol">{letter}<small>{letter.toLowerCase()}</small></span>
          {label && <span className="phonics-letter-state">{status === "completed" && <span aria-hidden="true">✓ </span>}{label}
            {status === "inprogress" && completedRounds > 0 && <small aria-hidden="true"> {completedRounds}/{LETTER_PRACTICE_ROUND_COUNT}</small>}
          </span>}
        </button>;
      })}
    </div>
    <ChildPageControls label="Letter pages" pageIndex={pages.pageIndex} pageCount={pages.pageCount} onPageChange={pages.setPageIndex} />
    <p className="phonics-alphabet-progress" data-child-progress="">{completedCount} of 26 letters complete</p>
  </section>;
}

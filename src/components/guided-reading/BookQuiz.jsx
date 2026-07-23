import { useEffect, useMemo, useRef, useState } from "react";
import { GUIDED_READING_QUIZZES } from "../../data/generated/guidedReadingQuizzes.generated.js";
import { playCorrectChime, playSoftBuzz, playStarChime } from "../../utils/audio/gameSfx.js";
import { hasRecordedSpeech, speak } from "../../utils/learnGamesAudio.js";
import { prepareGuidedReadingQuiz } from "../../utils/guidedReading/bookQuizQuestions.js";
import { ProgressStars } from "../learn/games/shared/ProgressStars.jsx";

function preloadQuestionImages(questions) {
  for (const question of questions || []) {
    if (question.kind !== "picture") continue;
    for (const src of question.choices) {
      const img = new Image();
      img.decoding = "async";
      img.src = src;
    }
  }
}

export function BookQuiz({ book, onFinish }) {
  const bookId = book.id;
  const bookType = book.type;
  const questions = useMemo(() => prepareGuidedReadingQuiz(
    GUIDED_READING_QUIZZES[bookId],
    { id: bookId, type: bookType }
  ) || [], [bookId, bookType]);
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [missed, setMissed] = useState(false);
  const [finished, setFinished] = useState(false);
  const [answerLocked, setAnswerLocked] = useState(false);
  const answerLockedRef = useRef(false);
  const dialogCardRef = useRef(null);
  const dialogFocusRef = useRef(null);
  const previouslyFocusedRef = useRef(null);
  const transitionTimerRef = useRef(null);

  useEffect(() => {
    previouslyFocusedRef.current = document.activeElement;
    preloadQuestionImages(questions);
    return () => {
      if (transitionTimerRef.current) window.clearTimeout(transitionTimerRef.current);
      previouslyFocusedRef.current?.focus?.();
    };
  }, [questions]);

  useEffect(() => {
    const focusFrame = window.requestAnimationFrame(() => dialogFocusRef.current?.focus());
    return () => window.cancelAnimationFrame(focusFrame);
  }, [finished, index, questions.length]);

  function keepFocusInsideDialog(event) {
    if (event.key !== "Tab") return;
    const focusable = [...(dialogCardRef.current?.querySelectorAll(
      "button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])"
    ) || [])];
    if (!focusable.length) {
      event.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const focusedIndex = focusable.indexOf(document.activeElement);
    if (event.shiftKey && focusedIndex <= 0) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (focusedIndex === -1 || document.activeElement === last)) {
      event.preventDefault();
      first.focus();
    }
  }

  if (!questions.length) {
    return (
      <div className="book-quiz" role="dialog" aria-modal="true" aria-label="Book quiz unavailable" onKeyDown={keepFocusInsideDialog}>
        <div className="book-quiz-card" ref={dialogCardRef}>
          <h3 ref={dialogFocusRef} tabIndex={-1}>Your reading still counts!</h3>
          <p className="book-quiz-loading">This book's questions need a quick update.</p>
          <button className="main-button" type="button" onClick={() => onFinish?.(0, 0)}>Finish book</button>
        </div>
      </div>
    );
  }

  const question = questions[index];

  function choose(choice) {
    if (finished || answerLockedRef.current) return;
    if (choice === question.answer) {
      answerLockedRef.current = true;
      setAnswerLocked(true);
      playCorrectChime();
      const nextCorrect = missed ? correct : correct + 1;
      if (!missed) setCorrect(nextCorrect);
      setMissed(false);
      if (index + 1 >= questions.length) {
        setFinished(true);
        playStarChime();
        transitionTimerRef.current = window.setTimeout(() => onFinish?.(nextCorrect, questions.length), 1400);
      } else {
        transitionTimerRef.current = window.setTimeout(() => {
          setIndex(value => value + 1);
          answerLockedRef.current = false;
          setAnswerLocked(false);
        }, 450);
      }
    } else {
      playSoftBuzz();
      setMissed(true);
    }
  }

  return (
    <div className="book-quiz" role="dialog" aria-modal="true" aria-label="Book quiz" onKeyDown={keepFocusInsideDialog}>
      <div className="book-quiz-card" ref={dialogCardRef}>
        {finished ? (
          <div className="book-quiz-result" ref={dialogFocusRef} role="status" aria-live="polite" tabIndex={-1}>
            <img src="/images/learn-games/phinny-cheering.webp" alt="" onError={event => { event.currentTarget.style.display = "none"; }} />
            <h3>{correct}/{questions.length} right on the first try!</h3>
            <ProgressStars stars={correct >= questions.length ? 3 : correct >= 2 ? 2 : correct > 0 ? 1 : 0} size="lg" />
          </div>
        ) : (
          <>
            <p className="book-quiz-kicker">Question {index + 1} of {questions.length}</p>
            <h3 ref={dialogFocusRef} tabIndex={-1}>{question.prompt}</h3>
            {missed && <p className="book-quiz-retry" role="status">Not that one - try again!</p>}
            <div className={`book-quiz-choices${question.kind === "picture" ? " pictures" : ""}${question.choices.some(choice => String(choice).length > 34) ? " long-text" : ""}`}>
              {question.choices.map(choice => (
                question.kind === "picture" ? (
                  <button key={choice} type="button" disabled={answerLocked} onClick={() => choose(choice)}>
                    <img src={choice} alt={`Picture answer option ${question.choices.indexOf(choice) + 1}`} loading="eager" decoding="async" />
                  </button>
                ) : (
                  <span key={choice} className="book-quiz-choice-row">
                    <button type="button" disabled={answerLocked} onClick={() => choose(choice)}>{choice}</button>
                    {hasRecordedSpeech(choice) && (
                      <button
                        type="button"
                        className="book-quiz-hear"
                        aria-label={`Hear this answer: ${choice}`}
                        title="Hear this answer"
                        onClick={() => speak(choice)}
                      >
                        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                          <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
                          <path d="M16 8.5a5 5 0 0 1 0 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      </button>
                    )}
                  </span>
                )
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

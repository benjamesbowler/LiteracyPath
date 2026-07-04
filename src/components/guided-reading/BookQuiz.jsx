import { useEffect, useMemo, useState } from "react";
import { guidedReadingBooks } from "../../data/guidedReadingBooks";
import { guidedReadingSeriesBooks } from "../../data/guidedReadingSeriesBooks";
import { playCorrectChime, playSoftBuzz, playStarChime } from "../../utils/audio/gameSfx.js";
import { ProgressStars } from "../learn/games/shared/ProgressStars.jsx";

function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function bookWords(book, limit = 40) {
  const words = new Set();
  for (const page of book?.pages || []) {
    for (const token of String(page.text || "").toLowerCase().match(/[a-z]+/g) || []) {
      if (token.length >= 3) words.add(token);
    }
    if (words.size >= limit) break;
  }
  return [...words];
}

function otherBooksWords(currentBook, limit = 30) {
  const words = new Set();
  for (const book of guidedReadingBooks) {
    if (book.id === currentBook.id) continue;
    for (const word of bookWords(book, 10)) words.add(word);
    if (words.size >= limit) break;
  }
  const current = new Set(bookWords(currentBook, 200));
  return [...words].filter(word => !current.has(word));
}

// Three auto-generated recall questions. If an authored quiz file exists for
// this book (public/guided-reading/quizzes/<id>.json) it takes priority.
function generateQuestions(book) {
  const own = shuffle(bookWords(book));
  const foreign = shuffle(otherBooksWords(book));
  const questions = [];

  for (let index = 0; index < 2 && own[index] && foreign[index * 2 + 1]; index += 1) {
    questions.push({
      prompt: "Which word was in your book?",
      choices: shuffle([own[index], foreign[index * 2], foreign[index * 2 + 1]]),
      answer: own[index],
      kind: "word"
    });
  }

  const pageWithImage = (book.pages || []).find(page => page.image);
  // Distractor pictures: random pages from the lightweight webp series
  // books first (fast to load), falling back to the standalone books.
  const distractorPool = [...guidedReadingSeriesBooks, ...guidedReadingBooks]
    .filter(item => item.id !== book.id && item.pages?.some(page => page.image));
  const otherImage = shuffle(distractorPool)
    .slice(0, 2)
    .map(item => shuffle(item.pages.filter(page => page.image))[0]?.image)
    .filter(Boolean);
  if (pageWithImage && otherImage.length >= 2) {
    questions.push({
      prompt: "Which picture is from your book?",
      choices: shuffle([pageWithImage.image, ...otherImage.slice(0, 2)]),
      answer: pageWithImage.image,
      kind: "picture"
    });
  }

  return questions.slice(0, 3);
}

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

async function loadAuthoredQuiz(bookId) {
  try {
    const response = await fetch(`/guided-reading/quizzes/${bookId}.json`);
    const type = response.headers.get("content-type") || "";
    if (!response.ok || !type.includes("json")) return null;
    const data = await response.json();
    if (!Array.isArray(data?.questions) || !data.questions.length) return null;
    return data.questions
      .filter(question => question?.prompt && Array.isArray(question.choices) && question.choices.includes(question.answer))
      .slice(0, 3)
      .map(question => ({ ...question, kind: question.kind || "word" }));
  } catch {
    return null;
  }
}

export function BookQuiz({ book, onFinish }) {
  const fallbackQuestions = useMemo(() => generateQuestions(book), [book]);
  const [questions, setQuestions] = useState(null);
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [missed, setMissed] = useState(false);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadAuthoredQuiz(book.id).then(authored => {
      if (cancelled) return;
      const next = authored?.length ? authored : fallbackQuestions;
      preloadQuestionImages(next);
      setQuestions(next);
    });
    return () => {
      cancelled = true;
    };
  }, [book.id, fallbackQuestions]);

  if (!questions) {
    return (
      <div className="book-quiz" role="dialog" aria-label="Book quiz">
        <div className="book-quiz-card"><p className="book-quiz-loading">Getting your questions ready...</p></div>
      </div>
    );
  }

  if (!questions.length) {
    // No content to quiz on - close out after render, never during it.
    window.setTimeout(() => onFinish?.(0, 0), 0);
    return null;
  }

  const question = questions[index];

  function choose(choice) {
    if (finished) return;
    if (choice === question.answer) {
      playCorrectChime();
      const nextCorrect = missed ? correct : correct + 1;
      if (!missed) setCorrect(nextCorrect);
      setMissed(false);
      if (index + 1 >= questions.length) {
        setFinished(true);
        playStarChime();
        window.setTimeout(() => onFinish?.(nextCorrect, questions.length), 1400);
      } else {
        window.setTimeout(() => setIndex(value => value + 1), 450);
      }
    } else {
      playSoftBuzz();
      setMissed(true);
    }
  }

  return (
    <div className="book-quiz" role="dialog" aria-label="Book quiz">
      <div className="book-quiz-card">
        {finished ? (
          <div className="book-quiz-result">
            <img src="/images/learn-games/phinny-cheering.webp" alt="" onError={event => { event.currentTarget.style.display = "none"; }} />
            <h3>{correct}/{questions.length} right!</h3>
            <ProgressStars stars={correct >= questions.length ? 3 : correct >= 2 ? 2 : correct > 0 ? 1 : 0} size="lg" />
          </div>
        ) : (
          <>
            <p className="book-quiz-kicker">Question {index + 1} of {questions.length}</p>
            <h3>{question.prompt}</h3>
            {missed && <p className="book-quiz-retry">Not that one - try again!</p>}
            <div className={`book-quiz-choices${question.kind === "picture" ? " pictures" : ""}`}>
              {question.choices.map(choice => (
                <button key={choice} type="button" onClick={() => choose(choice)}>
                  {question.kind === "picture" ? <img src={choice} alt="" loading="eager" decoding="async" /> : choice}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

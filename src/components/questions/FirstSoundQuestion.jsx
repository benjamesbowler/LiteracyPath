import { useMemo, useRef, useState } from "react";
import { normalizeAnswerOption } from "../../utils/answerOptions";

export default function FirstSoundQuestion({
  item,
  questionNumber = 1,
  totalQuestions = 15,
  onAnswer,
  disabled = false
}) {
  const audioRef = useRef(null);
  // Keyed by item id so state resets naturally when the question changes.
  const [response, setResponse] = useState(null);
  const [failedImageFor, setFailedImageFor] = useState("");
  const selectedAnswer = response?.itemId === item?.id ? response.answer : "";
  const feedback = response?.itemId === item?.id ? response.feedback : "";
  const imageFailed = failedImageFor === item?.id;
  const imageUrl = item?.imageUrl || item?.imagePath || "";
  const audioUrl = item?.audioUrl || item?.audioPath || "";
  const hasAudio = Boolean(audioUrl);
  const answerOptions = useMemo(
    () => (item?.answerOptions || item?.choices || []).map(normalizeAnswerOption),
    [item]
  );

  function playAudio() {
    if (!audioUrl) {
      if (import.meta.env.DEV) console.warn("Initial Sounds audio missing", item?.id);
      return;
    }

    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.play().catch(error => {
        if (import.meta.env.DEV) console.warn("Initial Sounds audio unavailable", item?.id, error);
      });
    } catch (error) {
      if (import.meta.env.DEV) console.warn("Initial Sounds audio failed", item?.id, error);
    }
  }

  function chooseAnswer(option) {
    if (disabled) return;
    const answer = option.value;
    const isCorrect = answer === item.correctAnswer;
    setResponse({ itemId: item.id, answer, feedback: isCorrect ? "correct" : "incorrect" });
    onAnswer?.({
      item,
      answer,
      answerLabel: option.label,
      isCorrect,
      selectedLetter: answer,
      correctLetter: item.correctAnswer
    });
  }

  return (
    <section className="first-sound-question-card" aria-label="Initial sound question">
      <div className="first-sound-progress">
        Question {questionNumber} of {totalQuestions}
      </div>

      <div className="first-sound-prompt">
        <h2>Listen to the word. What sound does it start with?</h2>
        <button
          className="first-sound-audio-button"
          disabled={!hasAudio}
          onClick={playAudio}
          type="button"
        >
          Replay word
        </button>
      </div>

      <div className="first-sound-image-area">
        {imageUrl && !imageFailed ? (
          <img
            alt={`Picture for ${item.targetWord}`}
            onError={event => {
              event.currentTarget.style.display = "none";
              setFailedImageFor(item?.id);
              if (import.meta.env.DEV) console.warn("Initial Sounds image missing", item?.id, imageUrl);
            }}
            src={imageUrl}
          />
        ) : (
          <div className="first-sound-image-placeholder" role="img" aria-label={`Picture for ${item.targetWord}`}>
            <svg viewBox="0 0 64 64" width="68" height="68" aria-hidden="true" fill="none">
              <rect x="6" y="12" width="52" height="40" rx="8" fill="#E3F4F2" stroke="#0C6B65" strokeWidth="2.5" />
              <circle cx="22" cy="26" r="5" fill="#F6B53D" />
              <path d="M12 46l13-14 10 10 7-7 10 11" stroke="#0C6B65" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>
        )}
      </div>

      <div className="first-sound-answer-grid">
        {answerOptions.map(option => (
          <button
            className={selectedAnswer === option.value ? "selected" : ""}
            disabled={disabled}
            key={`${option.value}-${option.label}`}
            onClick={() => chooseAnswer(option)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>

      {feedback && (
        <div className={`first-sound-feedback ${feedback}`}>
          {feedback === "correct" ? "Correct" : `This word starts with ${item.correctAnswer}.`}
        </div>
      )}
    </section>
  );
}

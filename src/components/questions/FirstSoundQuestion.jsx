import { useEffect, useMemo, useRef, useState } from "react";

export default function FirstSoundQuestion({
  item,
  questionNumber = 1,
  totalQuestions = 15,
  onAnswer,
  disabled = false
}) {
  const audioRef = useRef(null);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = item?.imageUrl || item?.imagePath || "";
  const audioUrl = item?.audioUrl || item?.audioPath || "";
  const hasAudio = Boolean(audioUrl);
  const answerOptions = useMemo(() => item?.answerOptions || item?.choices || [], [item]);

  useEffect(() => {
    setImageFailed(false);
  }, [item?.id]);

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

  function chooseAnswer(answer) {
    if (disabled) return;
    setSelectedAnswer(answer);
    const isCorrect = answer === item.correctAnswer;
    setFeedback(isCorrect ? "correct" : "incorrect");
    onAnswer?.({
      item,
      answer,
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
              setImageFailed(true);
              if (import.meta.env.DEV) console.warn("Initial Sounds image missing", item?.id, imageUrl);
            }}
            src={imageUrl}
          />
        ) : (
          <div className="first-sound-image-placeholder">
            <span>Image coming soon</span>
          </div>
        )}
      </div>

      <div className="first-sound-answer-grid">
        {answerOptions.map(answer => (
          <button
            className={selectedAnswer === answer ? "selected" : ""}
            disabled={disabled}
            key={answer}
            onClick={() => chooseAnswer(answer)}
            type="button"
          >
            {answer}
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

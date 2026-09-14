import { useCallback, useEffect, useRef, useState } from "react";
import { usePhonicsAudio, hasPhonicsAudioSource } from "../../../../../hooks/usePhonicsAudio.js";
import { WordImage } from "../WordImage.jsx";

function PracticeQuestion({ question, number, total, onAnswer }) {
  const { play, stop, isPlaying } = usePhonicsAudio(question.audio);
  const { play: playInstruction, stop: stopInstruction, isPlaying: instructionPlaying } = usePhonicsAudio(question.instructionAudio);
  const [delivery, setDelivery] = useState("not_played");
  const [modelShown, setModelShown] = useState(!hasPhonicsAudioSource(question.audio));
  const [feedback, setFeedback] = useState("");
  const [selected, setSelected] = useState("");
  const [solved, setSolved] = useState(false);
  const responses = useRef([]);
  const locked = useRef(false);
  const request = useRef(0);
  const timer = useRef(null);
  const listen = useCallback(() => {
    const epoch = ++request.current;
    setDelivery("pending");
    void (async () => {
      const instruction = await playInstruction();
      if (request.current !== epoch) return;
      const status = instruction === "ended" ? await play() : instruction;
      if (request.current !== epoch) return;
      setDelivery(status === "ended" ? "delivered" : ["stopped", "superseded"].includes(status) ? "interrupted" : "unavailable");
      if (!["ended", "stopped", "superseded"].includes(status)) setModelShown(true);
    })();
  }, [play, playInstruction]);
  useEffect(() => {
    // Start after the new question is mounted so its replay control is ready
    // if the browser requires a fresh gesture for recorded speech.
    const start = setTimeout(listen, 0);
    return () => { clearTimeout(start); request.current += 1; clearTimeout(timer.current); };
  }, [listen]);

  const pictureChoice = question.mode === "picture-word";
  const printedWord = question.mode === "word-letter";
  const showTarget = modelShown || question.mode === "letter-pair" || printedWord;

  function choose(option) {
    if (locked.current) return;
    const correct = option.id === question.answer;
    responses.current.push({ selected: option.id, correct, audioDelivery: delivery === "pending" ? "interrupted" : delivery, modelShown });
    setSelected(option.id);
    if (!correct) {
      setFeedback(pictureChoice ? `That is ${option.label}. Find ${question.targetWord.word}.`
        : `That is ${option.label}. Look for ${question.answer}.`);
      setModelShown(true);
      listen();
      return;
    }
    locked.current = true;
    setSolved(true);
    request.current += 1;
    stopInstruction();
    stop();
    setFeedback(pictureChoice ? `Yes! ${question.targetWord.word}.` : `Yes! ${question.answer}.`);
    timer.current = setTimeout(() => onAnswer({
      questionId: question.id, construct: question.construct, target: question.answer,
      prompt: question.prompt, mode: question.mode, targetLetter: question.targetLetter,
      word: question.targetWord.word, targetDisplay: question.targetDisplay,
      options: question.options.map(option => ({ ...option })),
      audioSource: question.audio, instructionSource: question.instructionAudio,
      firstResponse: responses.current[0], attempts: responses.current.length,
      responses: [...responses.current], audioDelivery: delivery === "pending" ? "interrupted" : delivery,
      supportUsed: [...(showTarget ? ["visible_model"] : []), ...(responses.current.some(response => !response.correct) ? ["correction"] : [])],
      independent: false
    }), 650);
  }

  return (
    <section className="phonics-practice-question kg-child-flow__content" aria-label="Letter practice" data-practice-question={question.id} data-audio-delivery={delivery}>
      <div className="phonics-practice-question-heading">
        <h2>{question.prompt}</h2>
        <p aria-live="polite">{number} of {total}</p>
      </div>
      <div className="phonics-practice-stimulus">
        {showTarget && (pictureChoice || printedWord ? (
          <div className="phonics-practice-word-model">
            <WordImage src={question.targetWord.image} word={question.targetWord.word} priority />
            <span>{question.targetWord.word}</span>
          </div>
        ) : <span className="phonics-practice-letter-model">{question.targetDisplay}</span>)}
        <div className="phonics-practice-audio">
          <button type="button" className="phonics-button phonics-button-primary" onClick={listen} aria-label="Hear the question" data-child-primary="">
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4zM17 8c3 2 3 6 0 8M20 5c5 4 5 10 0 14" /></svg>
            {isPlaying || instructionPlaying ? "Listening…" : "Listen again"}
          </button>
          {!showTarget && <button type="button" className="phonics-practice-help" onClick={() => setModelShown(true)}>Show me</button>}
          {["unavailable", "interrupted"].includes(delivery) && <p role="status">Tap to hear again. The picture or letter can help.</p>}
        </div>
      </div>
      <div className="phonics-practice-options" role="group" aria-label="Answer choices">
        {question.options.map(option => (
          <button key={option.id} type="button" onClick={() => choose(option)} disabled={solved}
            aria-label={`Choose ${option.label}`} className={`phonics-practice-option ${pictureChoice ? "has-picture" : "has-letter"} ${selected === option.id ? solved ? "is-correct" : "is-incorrect" : ""}`}>
            {pictureChoice ? <><WordImage src={option.image} word={option.label} priority /><small>{option.label}</small></> : <span>{option.label}</span>}
            {selected === option.id && <span className="phonics-practice-choice-mark" aria-hidden="true">{solved ? "✓" : "↻"}</span>}
          </button>
        ))}
      </div>
      <p className="phonics-practice-feedback" role="status">{feedback || "Tap your answer."}</p>
    </section>
  );
}

export default function StepPractice({ questions, step, checkpoint, onCheckpoint, onComplete }) {
  const initialAnswers = Array.isArray(checkpoint?.answers) && checkpoint.answers.length < questions.length
    && checkpoint.answers.every((answer, index) => answer.questionId === questions[index]?.id && answer.target === questions[index]?.answer)
    ? checkpoint.answers : [];
  const [answers, setAnswers] = useState(initialAnswers);
  function answered(answer) {
    const next = [...answers, answer];
    if (next.length === questions.length) {
      onComplete({ step: `practice-${step}`, completionKind: "supported", independent: false,
        audioDelivery: next.every(row => row.audioDelivery === "delivered") ? "delivered" : "mixed",
        firstResponse: next[0].firstResponse, attempts: next.reduce((sum, row) => sum + row.attempts, 0),
        supportUsed: [...new Set(next.flatMap(row => row.supportUsed))], questions: next });
    } else {
      onCheckpoint({ answers: next });
      setAnswers(next);
    }
  }
  return <PracticeQuestion key={questions[answers.length].id} question={questions[answers.length]} number={answers.length + 1} total={questions.length} onAnswer={answered} />;
}

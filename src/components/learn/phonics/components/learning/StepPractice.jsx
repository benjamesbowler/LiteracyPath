import { useMemo, useRef, useState } from "react";
import { playPhonicsAudio } from "../../../../../hooks/usePhonicsAudio.js";
import { getLessonByLetter } from "../../../../../data/phonicsLessons.js";
import { buildLetterPracticeQuestions } from "../../../../../data/letterPractice.js";
import { selectFreshLearningTransfer } from "../../../../../utils/learningResponseState.js";
import LearningPracticeTask from "../../LearningPracticeTask.jsx";
import "../../letters-practice.css";

const adapt = question => ({ ...question, formatType: question.mode, word: question.targetWord?.word,
  targetDisplay: question.mode === "picture-word" ? question.targetWord?.word : question.targetDisplay,
  answerOptions: question.options, hideStimulusModel: ["picture-word", "letter-sound"].includes(question.mode), image: question.mode === "picture-word" || question.mode === "word-letter" ? question.targetWord?.image : "" });
async function playQuestion(question, model = false) {
  const sources = [question.instructionAudio, question.audio,
    ...(model && question.mode !== "picture-word" ? [getLessonByLetter(question.targetLetter)?.phonicAudio] : [])].filter(Boolean);
  let status = "unavailable";
  for (const source of sources) { status = await playPhonicsAudio(source); if (status !== "ended") return status; }
  return status;
}

export default function StepPractice({ questions, sessionId = "letter-practice", step, checkpoint, onCheckpoint, onComplete }) {
  const [saved, setSaved] = useState(() => checkpoint?.learningVersion === 1 ? checkpoint : { learningVersion: 1, index: 0, answers: [], task: null });
  const owner = useRef(saved), complete = useRef(false);
  const original = questions[saved.index];
  const task = original && adapt(original);
  const candidates = useMemo(() => {
    const [letter, round, practiceStep] = String(questions[0]?.id || "").split(":");
    if (!letter) return [];
    return Array.from({ length: 8 }, (_, seed) => buildLetterPracticeQuestions({ letter, round: Number(round), step: Number(practiceStep), seed: `transfer:${questions[0].id}:${seed}` }))
      .flat().map((question, index) => adapt({ ...question, id: `${question.id}:transfer:${index}` }));
  }, [questions]);
  const transferQuestion = task && selectFreshLearningTransfer(task, candidates, { excludedIds: questions.map(question => question.id) });
  function save(next) { const ok = onCheckpoint?.(next) !== false; if (!ok && next.index !== owner.current.index) return false; owner.current = next; setSaved(next); return ok; }
  function close(episode) {
    if (complete.current || owner.current.answers.some(answer => answer.episode.id === episode.id)) return;
    const response = episode.firstResponse;
    const answer = { questionId: original.id, construct: original.construct, target: original.answer, prompt: original.prompt,
      mode: original.mode, targetLetter: original.targetLetter, word: original.targetWord.word,
      options: original.options, audioSource: original.audio, instructionSource: original.instructionAudio,
      firstResponse: response && { selected: response.selected, correct: response.observedCorrect, audioDelivery: response.media.targetDelivery },
      attempts: response ? 1 : 0, responses: episode.responses, supportUsed: [...new Set(episode.responses.flatMap(row => row.supportUsed))],
      audioDelivery: response?.media.targetDelivery || "not_played", independent: false, episode };
    const next = { ...owner.current, index: owner.current.index + 1, task: null, answers: [...owner.current.answers, answer] };
    if (!save(next)) return false;
    if (next.index === questions.length) {
      complete.current = true;
      onComplete({ step: `practice-${step}`, completionKind: "supported", independent: false,
        audioDelivery: next.answers.every(row => row.audioDelivery === "delivered") ? "delivered" : "mixed",
        firstResponse: next.answers[0]?.firstResponse, attempts: next.answers.length,
        supportUsed: [...new Set(next.answers.flatMap(row => row.supportUsed))], questions: next.answers });
    }
  }
  if (!task) return null;
  return <div className="phonics-practice-question phonics-practice-board kg-child-flow__content"><p className="phonics-practice-count">{saved.index + 1} of {questions.length}</p>
    <LearningPracticeTask key={original.id} id={`${sessionId}:letters:${original.id}`} instrument="letter_practice" question={task} expected={original.answer}
      transfer={transferQuestion ? { question: transferQuestion, expected: transferQuestion.answer } : null} modelFirst={saved.answers.at(-1)?.episode.completion?.unresolved === true} checkpoint={saved.task}
      onCheckpoint={value => save({ ...owner.current, task: value })} onComplete={close}
      onReplay={question => playQuestion(question)} onModelReplay={question => playQuestion(question, true)}
      supportUsed={["letter_practice_model"]}
      allowQuestionReview
      explanation={question => question.mode === "picture-word" ? `Listen to ${question.word}. Match its picture.`
        : question.mode === "letter-pair" ? `${question.targetDisplay} and ${question.answer} are the same letter.`
          : `${question.word} ${getLessonByLetter(question.targetLetter)?.matchPosition === "end" ? "ends" : "starts"} with ${question.answer}. Match that letter.`} />
  </div>;
}

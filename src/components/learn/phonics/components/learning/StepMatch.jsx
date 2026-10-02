import { memo, useMemo, useRef, useState } from "react";
import { playPhonicsAudio } from "../../../../../hooks/usePhonicsAudio.js";
import { getPrintedMatchContract, makeMatchTiles } from "../../phonicsActivityState.js";
import LearningPracticeTask from "../../LearningPracticeTask.jsx";
import "../../letters-practice.css";

const StepMatch = memo(function StepMatch({ lesson, sessionId = "letter-match", checkpoint, onCheckpoint, onComplete }) {
  const contract = useMemo(() => getPrintedMatchContract(lesson), [lesson]);
  const [saved, setSaved] = useState(() => checkpoint?.learningVersion === 1 ? checkpoint : { learningVersion: 1, index: 0, episodes: [], task: null });
  const owner = useRef(saved), complete = useRef(false);
  const distractors = useMemo(() => makeMatchTiles(lesson, 0).filter(tile => !tile.isCorrect).map(tile => tile.word), [lesson]);
  const word = lesson.words[saved.index];
  function save(next) { const ok = onCheckpoint?.(next) !== false; if (!ok && next.index !== owner.current.index) return false; owner.current = next; setSaved(next); return ok; }
  function close(episode) {
    if (complete.current || owner.current.episodes.some(row => row.id === episode.id)) return;
    const next = { ...owner.current, index: owner.current.index + 1, task: null, episodes: [...owner.current.episodes, episode] };
    if (!save(next)) return false;
    if (next.index >= lesson.words.length) {
      complete.current = true;
      onComplete({ step: "match", completionKind: "supported", audioDelivery: "not_required", independent: false,
        firstResponse: next.episodes[0]?.firstResponse, attempts: next.episodes.length, supportUsed: ["printed_word_model"],
        construct: contract.construct, responses: next.episodes.map(row => row.firstResponse), learningEpisodes: next.episodes });
    }
  }
  if (!word) return null;
  const question = { id: `printed-match:${lesson.letter}:${word.word}`, word: word.word, targetDisplay: lesson.letter, construct: contract.construct,
    formatType: "printed_word_matching", prompt: contract.prompt, answer: word.word, image: word.image,
    answerOptions: [word, ...Array.from({ length: Math.min(2, distractors.length) }, (_, offset) => distractors[(saved.index + offset) % distractors.length])].map(value => ({ id: value.word, label: value.word, image: value.image })) };
  return <div className="phonics-step phonics-step-match phonics-practice-board kg-child-flow__content"><p className="phonics-practice-count">Found: {saved.index} / {lesson.words.length}</p>
    <LearningPracticeTask key={question.id} id={`${sessionId}:${question.id}`} instrument="printed_letter_matching" question={question} expected={word.word}
      modelFirst={saved.episodes.at(-1)?.completion?.unresolved === true} checkpoint={saved.task} onCheckpoint={value => save({ ...owner.current, task: value })} onComplete={close}
      supportUsed={["printed_word_model"]} allowQuestionReview explanation={`${word.word} has ${lesson.letter} at the ${contract.location}. Match the demonstrated word.`}
      onReplay={async () => { const status = await playPhonicsAudio(lesson.phonicAudio); return status === "ended" ? playPhonicsAudio(word.audio) : status; }} />
  </div>;
});
export default StepMatch;

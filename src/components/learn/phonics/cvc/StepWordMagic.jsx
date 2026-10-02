import { memo, useMemo, useRef, useState } from "react";
import LearningPracticeTask from "../LearningPracticeTask.jsx";
import { selectFreshLearningTransfer } from "../../../../utils/learningResponseState.js";
import { cvcStepEvidence, getLetterSoundCue, getMagicTransition, makeCvcWordModels, useCvcSoundCue } from "./cvcHelpers.js";

function magicQuestion(base, target, words, family) {
  const transition = getMagicTransition(base, target);
  if (!transition) return null;
  return { id: `magic:${family.id}:${base.word}:${target.word}`, formatType: "phoneme_substitution", construct: "phoneme_substitution_encoding",
    word: `${base.word} → ${target.word}`, image: target.image, audio: target.audio, letter: transition.to,
    baseWord: base.word, target: target.word, prompt: `Change ${base.word} to ${target.word}.`,
    display: `${base.word} → ${target.word}`, explanation: `Keep the other parts. Change the ${transition.unitLabel} from ${transition.from} to ${transition.to}.`,
    answerOptions: words.filter(word => word.word !== base.word && getMagicTransition(base, word)?.index === transition.index)
      .map(word => ({ id: word.word, label: getMagicTransition(base, word).to, value: word.word, word: word.word })) };
}
const StepWordMagic = memo(function StepWordMagic({ family, sessionId = "cvc-practice", checkpoint, onCheckpoint, onComplete }) {
  const words = useMemo(() => makeCvcWordModels(family.magicSwaps, family), [family]);
  const tasks = useMemo(() => {
    const pairs = words.slice(0, -1).map((word, index) => [word, words[index + 1]]);
    if (words.length === 2) pairs.push([words[1], words[0]]);
    return pairs.map(([base, target]) => magicQuestion(base, target, words, family)).filter(Boolean);
  }, [words, family]);
  const [saved, setSaved] = useState(() => checkpoint?.learningVersion === 1 ? checkpoint : { learningVersion: 1, index: 0, episodes: [], task: null });
  const owner = useRef(saved), completed = useRef(false);
  const { playCue } = useCvcSoundCue();
  const question = tasks[saved.index];
  const candidates = useMemo(() => words.flatMap(base => words.map(target => magicQuestion(base, target, words, family))).filter(Boolean), [words, family]);
  const transfer = question && selectFreshLearningTransfer(question, candidates, { excludedIds: tasks.map(task => task.id) });
  function save(next) { const ok = onCheckpoint?.(next) !== false; if (!ok && next.index !== owner.current.index) return false; owner.current = next; setSaved(next); return ok; }
  function close(episode) {
    if (completed.current || owner.current.episodes.some(row => row.id === episode.id)) return;
    const next = { ...owner.current, index: owner.current.index + 1, episodes: [...owner.current.episodes, episode], task: null };
    if (!save(next)) return false;
    if (next.index >= tasks.length) {
      completed.current = true;
      onComplete(cvcStepEvidence("magic", next.episodes.map(row => ({ firstResponse: row.firstResponse, attempts: row.firstResponse ? 1 : 0,
        audioDelivery: row.firstResponse?.media.targetDelivery || "not_required", supportUsed: [row.modelFirst ? "modeled_transformation" : "target_grapheme_prompt"], learningEpisode: row }))));
    }
  }
  if (!question) return null;
  return <div className="phonics-step cvc-step cvc-magic-step kg-child-flow__content" data-learning-object="cvc-word-magic"><h2>Word Magic</h2>
    <LearningPracticeTask key={question.id} id={`${sessionId}:${question.id}`} instrument="cvc_word_magic" question={question} expected={question.target}
      modelFirst={saved.index === 0 || saved.episodes.at(-1)?.completion?.unresolved === true} modelFirstReason={saved.index === 0 ? "authored_intro" : "previous_transfer_unresolved"} transfer={transfer ? { question: transfer, expected: transfer.target } : null}
      checkpoint={saved.task} onCheckpoint={value => save({ ...owner.current, task: value })} onComplete={close}
      supportUsed={["target_grapheme_prompt"]} explanation={task => task.explanation}
      onReplay={task => playCue(task.audio, task.target)} onModelReplay={async task => {
        const cue = getLetterSoundCue(task.letter, family); const status = await playCue(cue.src, cue.fallbackText);
        return status === "ended" ? playCue(task.audio, task.target) : status;
      }} />
  </div>;
});
export default StepWordMagic;

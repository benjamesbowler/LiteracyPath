import { memo, useRef, useState } from "react";
import LearningPracticeTask from "../LearningPracticeTask.jsx";
import { cvcStepEvidence, makeCvcWordModels, playCvcSoundSequence, useCvcSoundCue } from "./cvcHelpers.js";

const StepBuildWord = memo(function StepBuildWord({ family, sessionId = "cvc-practice", checkpoint, onCheckpoint, onComplete }) {
  const words = makeCvcWordModels(family.buildWords, family);
  const [saved, setSaved] = useState(() => checkpoint?.learningVersion === 1 ? checkpoint : { learningVersion: 1, index: 0, episodes: [], task: null });
  const owner = useRef(saved), completed = useRef(false);
  const { playCue } = useCvcSoundCue();
  const word = words[saved.index];
  function save(next) { const ok = onCheckpoint?.(next) !== false; if (!ok && next.index !== owner.current.index) return false; owner.current = next; setSaved(next); return ok; }
  function close(episode) {
    if (completed.current || owner.current.episodes.some(row => row.id === episode.id)) return;
    const next = { ...owner.current, index: owner.current.index + 1, episodes: [...owner.current.episodes, episode], task: null };
    if (!save(next)) return false;
    if (next.index >= words.length) {
      completed.current = true;
      const records = next.episodes.map(row => ({ firstResponse: row.firstResponse, attempts: row.firstResponse ? 1 : 0,
        mistakes: row.firstResponse?.observedCorrect === false ? 1 : 0, audioDelivery: row.firstResponse?.media.targetDelivery || "not_played",
        supportUsed: ["scaffolded_construction", ...(row.guidedActions.length ? ["partial_spelling_support"] : [])], learningEpisode: row }));
      onComplete(cvcStepEvidence("build", records));
    }
  }
  if (!word) return null;
  const question = { id: `cvc-build:${family.id}:${word.word}`, mechanicId: "wordBuild", construct: "scaffolded_grapheme_construction", word: word.word,
    letters: word.letters, image: word.image, audio: word.audio, prompt: "Build the word you hear.", hideEncodingTarget: true, targetDisplay: "",
    answerOptions: [...word.letters, ...family.distractorLetters].map((letter, index) => ({ id: `tile:${index}`, value: letter, label: letter })) };
  return <div className="phonics-step cvc-step cvc-build-step kg-child-flow__content"><p>Word {saved.index + 1} of {words.length}</p>
    <LearningPracticeTask key={question.id} id={`${sessionId}:${question.id}`} instrument="cvc_scaffolded_build" question={question} expected={word.letters}
      modelFirst={false} checkpoint={saved.task} onCheckpoint={value => save({ ...owner.current, task: value })} onComplete={close}
      supportUsed={["scaffolded_construction", "picture_cue", "recorded_word_cue"]}
      explanation={() => `Listen to each sound in the word. Keep the built parts and match the next graphemes in order.`}
      onReplay={task => playCue(task.audio, task.word)}
      onModelReplay={task => playCvcSoundSequence({ wordModel: { word: task.word, letters: task.letters, audio: task.audio }, family, playCue })} />
  </div>;
});
export default StepBuildWord;

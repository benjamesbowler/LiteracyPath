import { useMemo, useRef, useState } from "react";
import LearningPracticeTask from "../../phonics/LearningPracticeTask.jsx";
import { ArcadePracticeGame } from "./ArcadePracticeGame.jsx";
import { CAST } from "../../../../features/soundSeekers/v3/content/cast.js";
import { hfwOptions } from "../../../../utils/recognitionPractice.js";
import { hasRecordedSpeech, speakWord } from "../../../../utils/learnGamesAudio.js";
import { selectFreshLearningTransfer } from "../../../../utils/learningResponseState.js";
import { playPopSound } from "../../../../utils/audio/gameSfx.js";
import { useLearningResult } from "../../../../hooks/useLearningResult.js";
import { LEARNING_PACE } from "../../../../utils/learningPace.js";
import { useRecordedPracticeCue } from "../shared/useRecordedPracticeCue.js";
import { practiceEvidence } from "./phonicsPlayModel.js";
import { useResumeTransition, useStageSnapshot } from "./phonicsSession.js";
import "./phonics-recognition-overhaul.css";

export function FestivalWordStage({ state, round, setRound, correct, setCorrect, addScore, miss,
  finish, isSoundEnabled, totalRounds, schedule, recordFirstResponse, recordAssistedRetry, paused, resume, onSnapshot, discovered = [], onDiscover, modelFirst = false, onModelNext }) {
  const { begin: holdResult, waitFor: ownReplay } = useLearningResult(paused);
  const target = state.words[round];
  const options = useMemo(() => resume?.options || hfwOptions(target, state.pool), [target, state.pool, resume]);
  // Words stay still on first play. Decorative bobbing is an explicit option,
  // never a reaction-time requirement or the price of reaching an answer.
  const [still, setStill] = useState(() => resume?.still ?? true);
  const [keyboardFocus, setKeyboardFocus] = useState(false);
  const [popped, setPopped] = useState(Boolean(resume?.popped));
  const [wrong, setWrong] = useState(resume?.wrong || "");
  const [recovery, setRecovery] = useState(() => resume?.recovery || (modelFirst ? { id: crypto.randomUUID(), modelFirst: true } : null));
  const [learningEpisode, setLearningEpisode] = useState(resume?.learningEpisode || null);
  const solved = useRef(Boolean(resume?.popped || resume?.recovery || modelFirst));
  const rewarded = useRef(Boolean(resume?.popped));
  const attempts = useRef(resume?.attempts || 0);
  const { canHear, replay, unavailable } = useRecordedPracticeCue(target, isSoundEnabled && !paused && !recovery, true, ownReplay);
  const spokenCueAvailable = canHear && !unavailable;
  const lessonWord = recovery?.task?.episode.question.word || target;
  const lessonPhase = recovery?.task?.episode.phase;
  const freshTurn = recovery?.task?.episode.role === "transfer" && ["answer", "receipt"].includes(lessonPhase);
  const { replay: replayLesson } = useRecordedPracticeCue(lessonWord, isSoundEnabled && !paused && Boolean(recovery), false);
  const lesson = useMemo(() => {
    const questionFor = (word, id, answers) => ({ id, formatType: "word_recognition", construct: "high_frequency_word_recognition", word, display: word,
      hideStimulusModel: isSoundEnabled && hasRecordedSpeech(word), prompt: "Find the word.", answerOptions: answers.map(label => ({ id: label, label })) });
    const question = { ...questionFor(target, `pop:${round}:${target}`, options), hideStimulusModel: false };
    const candidates = state.pool.filter(word => !state.words.includes(word)).map(word => questionFor(word, `pop:transfer:${word}`, hfwOptions(word, state.pool)));
    return { question, transfer: selectFreshLearningTransfer(question, candidates) };
  }, [target, round, options, state.pool, state.words, isSoundEnabled]);
  const snapshot = extra => ({ options, still, popped, wrong, attempts: attempts.current, recovery, learningEpisode, ...extra });

  function pop(word) {
    if (paused || solved.current) return;
    recordFirstResponse({ ...practiceEvidence("high_frequency_word_recognition", [spokenCueAvailable ? "recorded_word_cue" : "printed_target"]),
      game: "pop-the-word", round, target, response: word, correct: word === target });
    if (word !== target) {
      solved.current = true;
      attempts.current += 1;
      miss();
      setWrong(word);
      setRecovery({ id: crypto.randomUUID(), selected: word });
      return;
    }
    solved.current = true;
    setPopped(true);
    setWrong("");
    addScore(20, playPopSound);
    setCorrect(correct + 1);
    onDiscover?.({ id: `word-${round}`, sentence: target });
    if (attempts.current) recordAssistedRetry({ game: "pop-the-word", round, target, attempts: attempts.current,
      supportUsed: ["word_contrast", spokenCueAvailable ? "recorded_word_cue" : "printed_target"] });
    holdResult(() => round + 1 >= totalRounds ? finish(correct + 1) : setRound(round + 1),
      LEARNING_PACE.word, () => isSoundEnabled ? speakWord(target) : undefined);
  }

  useStageSnapshot(snapshot, onSnapshot);
  useResumeTransition(resume?.popped, () => round + 1 >= totalRounds ? finish(correct) : setRound(round + 1), schedule, LEARNING_PACE.word);

  return <section className={`pr-game pr-pop pp-play${recovery ? " is-learning" : ""}${paused || still || keyboardFocus ? " pr-paused" : ""}`} data-engine-paused={Boolean(paused)} data-phonics-mode="target" aria-label="Pop the Word balloon festival">
    <header className="pr-objective">
      <div><strong>{recovery ? freshTurn ? "Try a new word" : "Learn with Chompy" : spokenCueAvailable ? "Pop the word you hear" : <>Pop <b>{target}</b></>}</strong><span>{recovery ? freshTurn ? "Listen, then choose the new word." : lessonPhase === "finish_teaching" ? "Match this word to finish together." : "Match the example, then try a fresh word." : "Tap a balloon to help Chompy’s festival."}</span></div>
      <span className="pr-count">{correct}/{totalRounds}<small>balloons popped</small></span>
      {!recovery && <><button type="button" className="pr-replay" disabled={!canHear || paused} aria-label="Hear target" onClick={() => ownReplay(replay())}>♪<small>Hear</small></button>
        <button type="button" className="pr-motion" aria-pressed={still} disabled={paused} onClick={() => setStill(value => !value)}>{still ? "Move" : "Still"}</button></>}
    </header>
    <div className="pr-festival">
      <div className="pr-bunting" aria-hidden="true">{[0, 1, 2, 3, 4, 5, 6].map(index => <i key={index} />)}</div>
      {recovery ? <div className="pr-learning-zone">
        <LearningPracticeTask id={recovery.id || recovery.task?.episode.id || lesson.question.id} instrument="recognition_target" question={lesson.question} expected={target}
          transfer={lesson.transfer ? { question: lesson.transfer, expected: lesson.transfer.word } : null} checkpoint={recovery.task}
          modelFirst={recovery.modelFirst} initialResponse={recovery.modelFirst ? null : { selected: recovery.selected, correct: false }} supportUsed={["word_contrast"]}
          paused={paused} explanation={task => `Look at ${task.word}. Read all its letters and match the whole word.`}
          onReplay={async task => {
            if (task.word !== lessonWord) return "unavailable";
            const delivery = await replayLesson();
            return delivery === "completed" ? "ended" : delivery === "interrupted" ? "stopped" : "unavailable";
          }}
          onCheckpoint={task => {
            const next = { ...recovery, task };
            setRecovery(next);
            return onSnapshot?.(snapshot({ recovery: next }));
          }}
          onComplete={episode => {
            if (rewarded.current) return true;
            const completed = snapshot({ popped: true, wrong: "", attempts: episode.firstResponse ? 1 : 0, recovery: null, learningEpisode: episode });
            if (onSnapshot?.(completed) === false) return false;
            rewarded.current = true;
            onModelNext?.(episode.completion.unresolved === true);
            recordAssistedRetry({ game: "pop-the-word", round, target, attempts: episode.firstResponse ? 1 : 0,
              supportUsed: ["worked_model", ...(episode.transfer ? ["fresh_transfer"] : [])], learningEpisode: episode });
            setLearningEpisode(episode);
            setRecovery(null);
            setPopped(true);
            setWrong("");
            addScore(20, playPopSound);
            setCorrect(correct + 1);
            onDiscover?.({ id: `word-${round}`, sentence: target });
            round + 1 >= totalRounds ? finish(correct + 1) : setRound(round + 1);
            return true;
          }} />
      </div> : <div className="pr-balloon-field" role="group" aria-label="Word balloons">
        {options.map((word, index) => <button type="button" key={word} data-word={word}
          className={`pp-word-balloon pr-word-balloon pr-balloon-${index}${popped && word === target ? " is-popped" : ""}${wrong === word ? " is-wrong" : ""}`}
          disabled={paused || popped} onFocus={() => setKeyboardFocus(true)} onBlur={() => setKeyboardFocus(false)}
          onClick={() => pop(word)} aria-label={`Pop ${word}`}>
          <span className="pr-balloon-shine" aria-hidden="true" />
          <strong>{word}</strong><span className="pr-balloon-knot" aria-hidden="true" />
          {popped && word === target && <span className="pr-pop-check" aria-hidden="true">✓</span>}
        </button>)}
      </div>}
      <div className={`pr-chompy${popped ? " is-cheering" : ""}`} aria-hidden="true"><img src={CAST.chompy.heroSprite} alt="" onError={event => { event.currentTarget.hidden = true; }} /><span /></div>
      <div className="pr-festival-stall" aria-label="Your festival word tickets">
        {discovered.length ? discovered.slice(-5).map(item => <span key={item.id}>{item.sentence}<i aria-hidden="true">✓</i></span>)
          : <strong>Read a word. Win a word ticket!</strong>}
      </div>
    </div>
    <p className="pr-feedback" role="status">{recovery ? freshTurn ? lessonPhase === "receipt" ? "Your new choice is kept." : "Read the new word and choose its matching answer." : lessonPhase === "finish_teaching" ? "Let's finish this word together." : recovery.modelFirst ? "Learn the word together, then try a new one." : "Your first choice is kept. Learn the word together, then try a new one."
      : popped ? `${target}! That is the word. Chompy’s festival is growing.`
        : spokenCueAvailable ? "Listen, read the words, then pop the matching balloon." : `Find the balloon that says ${target}.`}</p>
  </section>;
}

const stages = { target: FestivalWordStage };
export default function PopTheWord(props) {
  return <ArcadePracticeGame {...props} title="Pop the Word" mode="target" stageComponents={stages} />;
}

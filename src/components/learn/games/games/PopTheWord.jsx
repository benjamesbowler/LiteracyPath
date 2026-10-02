import { useEffect, useMemo, useRef, useState } from "react";
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

export function FestivalWordStage({ state, round, setRound, correct, miss,
  finish, isSoundEnabled, totalRounds, schedule, recordFirstResponse, paused, resume, onSnapshot, onAcceptStage, discovered = [], modelFirst = false }) {
  const { begin: holdResult, waitFor: ownReplay } = useLearningResult(paused);
  const target = state.words[round];
  const options = useMemo(() => resume?.options || hfwOptions(target, state.pool), [target, state.pool, resume]);
  // correct counts accepted curriculum slots, including modeled closures. At
  // zero-based slot r it is r before acceptance and r + 1 after acceptance.
  // Older saves could write a popped stage before the host's batched credit.
  // A credited counter or unique ticket proves that acceptance already ran.
  const [uncreditedAcceptance] = useState(() => Boolean((resume?.popped || resume?.pendingAccept === target)
    && correct <= round && !discovered.some(item => item.id === `word-${round}`)));
  const recoverEpisode = uncreditedAcceptance && resume?.learningEpisode?.phase === "complete" ? resume.learningEpisode : null;
  const recoverNative = uncreditedAcceptance && !recoverEpisode;
  // Words stay still on first play. Decorative bobbing is an explicit option,
  // never a reaction-time requirement or the price of reaching an answer.
  const [still, setStill] = useState(() => resume?.still ?? true);
  const [keyboardFocus, setKeyboardFocus] = useState(false);
  const [popped, setPopped] = useState(Boolean(resume?.popped && !uncreditedAcceptance));
  const [wrong, setWrong] = useState(resume?.wrong || "");
  const [recovery, setRecovery] = useState(() => resume?.recovery || (recoverEpisode ? { id: recoverEpisode.id, modelFirst: recoverEpisode.modelFirst,
    task: { episode: recoverEpisode, draft: [], delivery: recoverEpisode.responses.at(-1)?.media?.targetDelivery || "not_played" } }
    : modelFirst ? { id: crypto.randomUUID(), modelFirst: true } : null));
  const [learningEpisode, setLearningEpisode] = useState(resume?.learningEpisode || null);
  const [acceptingNative, setAcceptingNative] = useState(recoverNative);
  const [nativeSaveFailed, setNativeSaveFailed] = useState(false);
  const solved = useRef(Boolean(resume?.popped || resume?.pendingAccept || resume?.recovery || modelFirst));
  const rewarded = useRef(Boolean(resume?.popped && !uncreditedAcceptance));
  const nativeResumeAttempted = useRef(false);
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
  const snapshot = extra => ({ options, still, popped, wrong, attempts: attempts.current, recovery, learningEpisode,
    pendingAccept: acceptingNative ? target : null, ...extra });

  function acceptNative() {
    if (paused || document.hidden || rewarded.current) return;
    const completed = snapshot({ popped: true, wrong: "", pendingAccept: null });
    if (onAcceptStage(completed, { id: `pop:${round}`, score: 20, correct: correct + 1,
      discovery: { id: `word-${round}`, sentence: target } }, playPopSound) === false) {
      setAcceptingNative(true);
      setNativeSaveFailed(true);
      return;
    }
    rewarded.current = true;
    setNativeSaveFailed(false);
    setAcceptingNative(false);
    setPopped(true);
    setWrong("");
    if (!recoverNative) holdResult(() => round + 1 >= totalRounds ? finish(correct + 1) : setRound(round + 1),
      LEARNING_PACE.word, () => isSoundEnabled ? speakWord(target) : undefined);
  }

  useEffect(() => {
    if (recoverNative && !paused && !document.hidden && !nativeResumeAttempted.current) {
      nativeResumeAttempted.current = true;
      acceptNative();
    }
  });

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
    acceptNative();
  }

  useStageSnapshot(snapshot, onSnapshot);
  useResumeTransition(resume?.popped && !uncreditedAcceptance || recoverNative && popped,
    () => round + 1 >= totalRounds ? finish(correct) : setRound(round + 1), schedule, LEARNING_PACE.word);

  return <section className={`pr-game pr-pop pp-play${recovery ? " is-learning" : ""}${paused || still || keyboardFocus ? " pr-paused" : ""}`} data-engine-paused={Boolean(paused)} data-phonics-mode="target" aria-label="Pop the Word balloon festival">
    <header className="pr-objective">
      <div><strong>{recovery ? freshTurn ? "Try a new word" : "Learn with Chompy" : spokenCueAvailable ? "Pop the word you hear" : <>Pop <b>{target}</b></>}</strong><span>{recovery ? freshTurn ? "Listen, then choose the new word." : lessonPhase === "finish_teaching" ? "Match this word to finish together." : "Match the example, then try a fresh word." : "Tap a balloon to help Chompy’s festival."}</span></div>
      <span className="pr-count">{correct}/{totalRounds}<small>balloons popped</small></span>
      {!recovery && <><button type="button" className="pr-replay" disabled={!canHear || paused} aria-label="Hear target" onClick={() => ownReplay(replay())}>♪<small>Hear</small></button>
        <button type="button" className="pr-motion" aria-pressed={still} disabled={paused} onClick={() => setStill(value => !value)}>{still ? "Move" : "Still"}</button></>}
    </header>
    {nativeSaveFailed && <div className="pr-feedback" role="alert"><p>Your answer is kept here. Retry saving before continuing.</p>
      <button type="button" className="pr-replay" disabled={paused} onClick={acceptNative}>Retry save</button></div>}
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
            const completed = snapshot({ popped: true, wrong: "", attempts: episode.firstResponse ? 1 : 0, recovery: null, learningEpisode: episode, pendingAccept: null });
            if (onAcceptStage(completed, { id: `pop:${round}`, score: 20, correct: correct + 1,
              discovery: { id: `word-${round}`, sentence: target }, modelNext: episode.completion.unresolved === true,
              assisted: { game: "pop-the-word", round, target, attempts: episode.firstResponse ? 1 : 0,
                supportUsed: ["worked_model", ...(episode.transfer ? ["fresh_transfer"] : [])], learningEpisode: episode } }, playPopSound) === false) return false;
            rewarded.current = true;
            setLearningEpisode(episode);
            setRecovery(null);
            setPopped(true);
            setWrong("");
            round + 1 >= totalRounds ? finish(correct + 1) : setRound(round + 1);
            return true;
          }} />
      </div> : <div className="pr-balloon-field" role="group" aria-label="Word balloons">
        {options.map((word, index) => <button type="button" key={word} data-word={word}
          className={`pp-word-balloon pr-word-balloon pr-balloon-${index}${popped && word === target ? " is-popped" : ""}${wrong === word ? " is-wrong" : ""}`}
          disabled={paused || popped || acceptingNative} onFocus={() => setKeyboardFocus(true)} onBlur={() => setKeyboardFocus(false)}
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
      : acceptingNative ? "Your choice is kept. Save it to carry on."
        : popped ? `${target}! That is the word. Chompy’s festival is growing.`
        : spokenCueAvailable ? "Listen, read the words, then pop the matching balloon." : `Find the balloon that says ${target}.`}</p>
  </section>;
}

const stages = { target: FestivalWordStage };
export default function PopTheWord(props) {
  return <ArcadePracticeGame {...props} title="Pop the Word" mode="target" stageComponents={stages} />;
}

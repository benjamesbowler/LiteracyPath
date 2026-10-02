import { useEffect, useMemo, useRef, useState } from "react";
import { ArcadePracticeGame } from "./ArcadePracticeGame.jsx";
import LearningPracticeTask from "../../phonics/LearningPracticeTask.jsx";
import { PlayHero } from "./PhonicsPlayShared.jsx";
import { useLearningResult } from "../../../../hooks/useLearningResult.js";
import { LEARNING_PACE } from "../../../../utils/learningPace.js";
import { sentenceTiles } from "../../../../utils/recognitionPractice.js";
import { buildRecordedHopOuting, hopLearningTask, needsLegacySentenceCredit, nextHopWords } from "./sentenceWorkshopModel.js";
import { hasRecordedSpeech, speak } from "../../../../utils/learnGamesAudio.js";
import { useRecordedPracticeCue } from "../shared/useRecordedPracticeCue.js";
import { practiceEvidence } from "./phonicsPlayModel.js";
import { useResumeTransition, useStageSnapshot } from "./phonicsSession.js";
import "./phonics-sentence-worlds.css";

// Only the next jump is a choice. Earlier stones show the sentence the child
// made; distant words and repeated disabled decoys cannot obscure that action.
function HopscotchStage({ state, round, setRound, correct, miss, finish, isSoundEnabled, schedule, recordFirstResponse, paused, discovered = [], difficulty, resume, onSnapshot, onAcceptStage, modelFirst = false }) {
  const sentence = state.sentences[round];
  const tiles = useMemo(() => sentenceTiles(sentence), [sentence]);
  const [missingClosure] = useState(() => needsLegacySentenceCredit(resume?.index === tiles.length, round, correct, discovered, `sentence-${round}`));
  const [resumedApplied] = useState(() => resume?.index === tiles.length && !missingClosure && !resume?.pendingAcceptance);
  const restoredEpisode = missingClosure && resume?.learningEpisode?.phase === "complete" ? resume.learningEpisode : null;
  const [index, setIndex] = useState(Math.min(resume?.index || 0, tiles.length));
  const [feedback, setFeedback] = useState(resume?.feedback || "Tap the word that comes next.");
  const [wrong, setWrong] = useState("");
  const [hopping, setHopping] = useState(false);
  const [recovery, setRecovery] = useState(() => resume?.recovery || (restoredEpisode ? { id: restoredEpisode.id, index: tiles.length - restoredEpisode.firstExpected.length, task: { episode: restoredEpisode, draft: [], delivery: "not_played" } } : null) || (modelFirst && resume?.index !== tiles.length ? { id: crypto.randomUUID(), modelFirst: true, index: resume?.index || 0 } : null));
  const recoveryRef = useRef(recovery);
  const learningEpisode = useRef(resume?.learningEpisode || null);
  const [pending, setPending] = useState(() => resume?.pendingAcceptance || (missingClosure && !restoredEpisode ? {
    word: tiles.at(-1).word, nextIndex: tiles.length, recoverOnMount: true,
    snapshot: { ...resume, pendingAcceptance: null },
    credit: { id: `hop:${round}:${tiles.length - 1}`, score: 10, correct: round + 1, discovery: { id: `sentence-${round}`, sentence } }
  } : null));
  const pendingRef = useRef(pending);
  const attempts = useRef(resume?.attempts || 0);
  const locked = useRef(index === tiles.length || Boolean(recovery) || Boolean(pending));
  const choicesRef = useRef(null);
  const returnFocus = useRef(false);
  const learningWorld = useRef(null);
  const { begin: holdResult, waitFor: ownReplay } = useLearningResult(paused);
  const { canHear, replay, unavailable } = useRecordedPracticeCue(sentence, isSoundEnabled && !paused, true, ownReplay);
  // Identical repeated words are one choice, never competing physical copies.
  const options = useMemo(() => nextHopWords(sentence, index, `${state.sessionSeed}:${state.rerollKey}`), [index, sentence, state.rerollKey, state.sessionSeed]);
  function advance(nextCorrect) {
    if (round + 1 >= state.sentences.length) finish(nextCorrect);
    else setRound(round + 1);
  }
  function updateRecovery(next) { recoveryRef.current = next; setRecovery(next); }
  function snapshot(overrides = {}) { return { index, feedback, attempts: attempts.current, recovery: recoveryRef.current, learningEpisode: learningEpisode.current, pendingAcceptance: pendingRef.current, ...overrides }; }
  function acceptWord(word, nextIndex) {
    returnFocus.current = choicesRef.current?.contains(document.activeElement);
    setWrong(""); setHopping(true); setIndex(nextIndex);
    setFeedback(nextIndex === tiles.length ? `You built: ${sentence}` : `${word} fits next. Keep the sentence in order.`);
    if (nextIndex === tiles.length) {
      holdResult(() => advance(round + 1), LEARNING_PACE.sentence, () => isSoundEnabled ? speak(sentence) : undefined);
    } else schedule(() => { locked.current = false; setHopping(false); }, 350);
  }
  function retryAcceptance() {
    const held = pendingRef.current;
    if (paused || document.hidden || !held || onAcceptStage(held.snapshot, held.credit) === false) return;
    pendingRef.current = null; setPending(null); acceptWord(held.word, held.nextIndex);
  }
  function choose(word) {
    if (paused || locked.current || !tiles[index]) return;
    const accepted = word === tiles[index].word;
    recordFirstResponse({ ...practiceEvidence("sentence_word_order", ["printed_sentence_model"]), game: "word-hopscotch", round: `${round}:${index}`, sentence, target: tiles[index].word, response: word, correct: accepted });
    locked.current = true;
    if (!accepted) {
      attempts.current += 1; miss();
      setWrong(word);
      setFeedback(`You chose ${word}. Let’s learn the next part together.`);
      updateRecovery({ id: crypto.randomUUID(), selected: word, index });
      return;
    }
    const nextIndex = index + 1;
    const saved = snapshot({ index: nextIndex, feedback: nextIndex === tiles.length ? `You built: ${sentence}` : `${word} fits next. Keep the sentence in order.`, pendingAcceptance: null });
    const credit = { id: `hop:${round}:${index}`, score: 10, ...(nextIndex === tiles.length ? { correct: round + 1, discovery: { id: `sentence-${round}`, sentence } } : {}) };
    if (onAcceptStage(saved, credit) === false) { pendingRef.current = { word, nextIndex, snapshot: saved, credit }; setPending(pendingRef.current); return; }
    acceptWord(word, nextIndex);
  }
  useStageSnapshot(() => snapshot(), onSnapshot);
  useResumeTransition(resumedApplied, () => advance(correct), schedule, LEARNING_PACE.sentence);
  useEffect(() => {
    if (!paused && !document.hidden && pendingRef.current?.recoverOnMount) {
      pendingRef.current.recoverOnMount = false; retryAcceptance();
    }
  });
  useEffect(() => {
    if (!paused && !hopping && returnFocus.current) {
      returnFocus.current = false;
      choicesRef.current?.querySelector("button:not(:disabled)")?.focus({ preventScroll: true });
    }
  }, [hopping, paused]);
  useEffect(() => { if (learningWorld.current) learningWorld.current.scrollTop = 0; }, [recovery?.task?.episode.question.id, recovery?.task?.episode.phase]);
  const land = difficulty === "hard" ? "moonwood" : difficulty === "medium" ? "dino" : "meadow";
  const reached = tiles.slice(Math.max(0, index - 4), index);
  const task = recovery ? hopLearningTask(state, round, recovery.index) : null;
  return <section className={`psw-game psw-hop psw-land-${land}${paused ? " is-paused" : ""}`} data-phonics-mode="sentence" data-hop-index={index} aria-label="Word Hopscotch sentence trail">
    <header className="psw-hud">
      <div><strong>Hop to build the sentence</strong><span>{recovery ? "Learn the next words, then try a new sentence." : isSoundEnabled && !hasRecordedSpeech(sentence) ? "Read the printed sentence. Tap the next word." : unavailable ? "Read the sentence, or tap Hear to try its voice again." : "Tap the word that comes next."}</span></div>
      <span className="psw-progress">Sentence {round + 1}/{state.sentences.length}</span>
      {!recovery && <button type="button" className="psw-replay" aria-label="Hear the sentence" disabled={!canHear || paused} onClick={() => ownReplay(replay())}>♪<span>Hear</span></button>}
    </header>
    <div className={`psw-hop-clearing${recovery ? " psw-learning-clearing" : ""}`}>
      {pending && <div className="psw-save-alert" role="alert"><p>Your answer is kept here. Retry saving before continuing.</p><button type="button" disabled={paused} onClick={retryAcceptance}>Retry save</button></div>}
      {recovery ? <div className="psw-learning-world" ref={learningWorld}>
        <PlayHero difficulty={difficulty} className="psw-learning-pal" />
        <LearningPracticeTask id={recovery.id || recovery.task?.episode.id || task.question.id} instrument="recognition_sentence" {...task}
          checkpoint={recovery.task} modelFirst={recovery.modelFirst} initialResponse={recovery.modelFirst ? null : { selected: [recovery.selected], correct: false }}
          supportUsed={["sentence_order_model"]} paused={paused}
          explanation="Keep your words. Match the next words to the sentence above."
          renderWorkedExample={question => question.builtPrefix?.length ? <p className="psw-kept-prefix">Your words stay: <strong>{question.builtPrefix.join(" ")}</strong></p> : null}
          onReplay={question => isSoundEnabled && hasRecordedSpeech(question.sentence) ? speak(question.sentence) : undefined}
          onCheckpoint={savedTask => { const next = { ...recoveryRef.current, task: savedTask }; updateRecovery(next); return onSnapshot?.(snapshot({ recovery: next })); }}
          onComplete={episode => {
            const saved = snapshot({ index: tiles.length, feedback: `You built: ${sentence}`, recovery: null, learningEpisode: episode, pendingAcceptance: null });
            const assisted = { game: "word-hopscotch", round, sentence, attempts: episode.firstResponse ? 1 : 0, supportUsed: ["worked_sentence_model", ...(episode.transfer ? ["fresh_transfer"] : [])], learningEpisode: episode };
            if (onAcceptStage(saved, { id: `hop:${round}:guided`, score: 10 * episode.firstExpected.length, correct: round + 1, discovery: { id: `sentence-${round}`, sentence }, assisted, modelNext: episode.completion.unresolved === true }) === false) return false;
            learningEpisode.current = episode; updateRecovery(null); locked.current = true; setIndex(tiles.length); setWrong(""); setFeedback(`You built: ${sentence}`);
            holdResult(() => advance(round + 1), LEARNING_PACE.sentence, () => isSoundEnabled && hasRecordedSpeech(sentence) ? speak(sentence) : undefined);
          }} />
      </div> : <>
      <div className="psw-sentence-model"><small>Build this sentence</small><p>{sentence}</p></div>
      <div className="psw-hop-trail" aria-label="Your sentence so far">
        <div className="psw-trail-line" aria-hidden="true" />
        <span className="psw-start-stone">Start{index === 0 && <PlayHero difficulty={difficulty} className="psw-hop-hero" />}</span>
        {reached.map(tile => <span className="psw-reached-stone" data-word={tile.word} data-word-index={tile.index} key={tile.id}><small>{tile.index + 1}</small>{tile.word}<span className="psw-stone-tick" aria-label="Reached">✓</span>{tile.index === index - 1 && <PlayHero difficulty={difficulty} className={`psw-hop-hero${hopping ? " is-hopping" : ""}`} />}</span>)}
        <span className="psw-next-stone" aria-label={index === tiles.length ? "Sentence complete" : `Next word ${index + 1} of ${tiles.length}`}>{index === tiles.length ? "✓" : "?"}</span>
      </div>
      <div className="psw-hop-choice-group" role="group" aria-label="Choose the next word">
        <p>{index === tiles.length ? "Sentence complete!" : `Hop ${index + 1} of ${tiles.length} · Choose the next word`}</p>
        <div className="psw-hop-choices" ref={choicesRef}>{options.map(word => <button type="button" key={`${index}:${word}`} className={`psw-word-stone${word === wrong ? " is-wrong" : ""}`} disabled={paused || Boolean(pending) || hopping || index === tiles.length} aria-label={`Hop to ${word}`} onClick={() => choose(word)}>{word}</button>)}</div>
      </div>
      </>}
    </div>
    <footer className="psw-feedback" role="status" data-feedback-kind={wrong ? "retry" : "guide"}>{recovery?.task?.episode.role === "transfer" ? "Read this new sentence. Choose its words in order." : feedback}</footer>
  </section>;
}

export default function WordHopscotch(props) {
  return <ArcadePracticeGame {...props} title="Word Hopscotch" mode="sentence" stageComponents={{ sentence: HopscotchStage }} roundBuilders={{ sentence: buildRecordedHopOuting }} />;
}

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { LearningTeachingCard } from "../../learning/LearningTeachingCard.jsx";
import { createLearningDwell, LEARNING_PACE } from "../../../utils/learningPace.js";
import { advanceLearningResponseReceipt, commitLearningResponse, createLearningResponseEpisode, learningResponseRecoveryIssue, recordLearningGuidedAction, recordLearningGuidedStep, startLearningWithModel } from "../../../utils/learningResponseState.js";
import { learningModelPart } from "../../../utils/learningResponseAdapters.js";
import { shuffleLearningQuestionChoices } from "../../../utils/answerPositionShuffle.js";

/** Native practice adapters share an immutable response, saved cursor and bounded
 * teaching loop. Their completion callback closes ONE original curriculum slot. */
export default function LearningPracticeTask({ id, instrument, question, expected, transfer, checkpoint, initialResponse, modelFirst = false, modelFirstReason = "previous_transfer_unresolved",
  onCheckpoint, onComplete, onReplay, onModelReplay = onReplay, explanation, paused = false, supportUsed = [], word, image, renderWorkedExample, allowQuestionReview = false }) {
  const [recoveryIssue] = useState(() => checkpoint?.episode ? learningResponseRecoveryIssue(checkpoint.episode) || (checkpoint.episode.id !== id ? "content_changed" : "") : "");
  const [saved, setSaved] = useState(() => {
    if (!recoveryIssue && checkpoint?.episode?.id === id) return checkpoint;
    const preparedQuestion = shuffleLearningQuestionChoices(question, `${id}:first-choices`);
    const preparedTransfer = transfer ? { ...transfer, question: shuffleLearningQuestionChoices(transfer.question, `${id}:transfer:${transfer.question.id}`) } : null;
    let episode = createLearningResponseEpisode({ id, instrument, slotId: id, question: preparedQuestion, expected, transfer: preparedTransfer });
    if (modelFirst) episode = startLearningWithModel(episode, modelFirstReason);
    if (initialResponse) episode = commitLearningResponse(episode, { ...initialResponse, supported: true, supportUsed });
    return { episode, draft: [], delivery: "not_played" };
  });
  const owner = useRef(saved), callbacks = useRef({ onCheckpoint, onComplete, onReplay, onModelReplay });
  useLayoutEffect(() => { callbacks.current = { onCheckpoint, onComplete, onReplay, onModelReplay }; });
  const dwell = useRef(null), playback = useRef(null), voice = useRef(0), closed = useRef(false), pausedRef = useRef(paused);
  useLayoutEffect(() => { pausedRef.current = paused; });
  const [saveFailed, setSaveFailed] = useState(false);
  const [questionReview, setQuestionReview] = useState(false);
  const episode = saved.episode;
  const persist = useCallback(next => {
    if (recoveryIssue) return false;
    owner.current = next; // acquire the response lock before a save or render
    const ok = callbacks.current.onCheckpoint?.(next) !== false;
    setSaveFailed(!ok); setSaved(next); return ok;
  }, [recoveryIssue]);
  useLayoutEffect(() => { if (!recoveryIssue) persist(owner.current); }, [persist, recoveryIssue]);
  const replay = useCallback(async model => {
    const ticket = ++voice.current, snapshot = owner.current, task = snapshot.episode.question;
    persist({ ...snapshot, delivery: "pending" });
    const media = (model ? callbacks.current.onModelReplay : callbacks.current.onReplay)?.(task);
    playback.current = media; const result = await media;
    if (ticket !== voice.current || owner.current.episode.question.id !== task.id) return result;
    const delivery = result === "ended" || result === true || typeof result === "string" && result.startsWith("/audio/") || result?.audioDelivery === "delivered" ? "delivered"
      : ["stopped", "superseded"].includes(result) ? "interrupted" : "unavailable";
    persist({ ...owner.current, delivery }); return result;
  }, [persist]);
  useEffect(() => {
    if (recoveryIssue || episode.phase !== "receipt" || saveFailed) return undefined;
    dwell.current = createLearningDwell({ minimumMs: episode.question.sentence ? LEARNING_PACE.sentence : LEARNING_PACE.word,
      onAdvance: () => persist({ ...owner.current, episode: advanceLearningResponseReceipt(owner.current.episode), draft: [] }) });
    dwell.current.waitFor(playback.current);
    if (pausedRef.current || document.hidden) dwell.current.pause();
    return () => dwell.current?.cancel();
  }, [episode.id, episode.phase, episode.question.sentence, saveFailed, recoveryIssue, persist]);
  useEffect(() => { if (paused || document.hidden) dwell.current?.pause(); else dwell.current?.resume(); }, [paused]);
  useEffect(() => {
    const visibility = () => document.hidden || paused ? dwell.current?.pause() : dwell.current?.resume();
    document.addEventListener("visibilitychange", visibility);
    return () => { document.removeEventListener("visibilitychange", visibility); voice.current += 1; };
  }, [paused]);
  useEffect(() => {
    if (!recoveryIssue && episode.phase === "complete" && !saveFailed && !closed.current) {
      const ok = callbacks.current.onComplete(episode) !== false; closed.current = ok; if (!ok) setSaveFailed(true);
    }
  }, [episode.phase, episode, saveFailed, recoveryIssue]);
  useEffect(() => {
    if (!recoveryIssue && episode.phase === "answer") void replay(false);
  }, [episode.id, episode.role, episode.phase, recoveryIssue, replay]);
  function choose(value) {
    const current = owner.current;
    if (paused || saveFailed || current.episode.phase !== "answer") return;
    const answer = current.episode.expected;
    const multiple = Array.isArray(answer), selected = multiple ? [...current.draft, value] : value;
    const correct = multiple ? String(value) === String(answer[current.draft.length]) : String(value) === String(answer);
    if (multiple && correct && selected.length < answer.length) { persist({ ...current, draft: selected }); return; }
    persist({ ...current, episode: commitLearningResponse(current.episode, { selected, correct, supported: true,
      supportUsed: current.episode.role === "transfer" ? [...supportUsed, "after_teaching"] : supportUsed,
      media: { targetDelivery: current.delivery } }), draft: selected });
  }
  const task = episode.question, answers = Array.isArray(episode.expected) ? episode.expected : [episode.expected];
  const options = task.answerOptions || task.options || task.choices || task.letterTiles || [];
  const teaching = ["teaching", "finish_teaching"].includes(episode.phase);
  const reviewing = teaching && allowQuestionReview && questionReview;
  if (recoveryIssue) return <section role="alert" data-learning-recovery={recoveryIssue}><h2>Your saved practice is kept safe.</h2><p>This version cannot open that saved question. Ask a grown-up to update the app, then carry on.</p></section>;
  return <section data-sibling-learning-task={instrument} data-learning-episode={episode.id} data-learning-phase={episode.phase} data-practice-question={task.id} data-audio-delivery={saved.delivery} data-practice-mode={task.mode} data-question-review={reviewing || undefined}>
    {saveFailed && <div role="alert"><p>Your answer is kept here. Retry saving before continuing.</p><button type="button" onClick={() => persist(owner.current)}>Retry save</button></div>}
    {teaching && !reviewing ? <>{renderWorkedExample?.(task, episode.expected)}<LearningTeachingCard key={`${id}:${episode.phase}`} episode={episode} explanation={typeof explanation === "function" ? explanation(task) : explanation}
      word={task.word || task.targetWord?.word || word} image={task.image || task.targetWord?.image || image} passage={task.passage || task.sentence}
      disabled={paused || saveFailed} onReplay={() => replay(true)}
      onGuidedStep={index => persist({ ...owner.current, episode: recordLearningGuidedStep(owner.current.episode, index) })}
      onGuided={selected => persist({ ...owner.current, episode: recordLearningGuidedAction(owner.current.episode, selected), draft: [] })} /></>
      : <div className="learning-teaching-card">
        <p className={`learning-teaching-kicker ${!reviewing && episode.role !== "transfer" ? "is-first-turn" : ""}`}>{reviewing ? "Your saved answer" : episode.role === "transfer" ? "Try a new one" : "Your turn"}</p>
        <h2>{task.prompt || task.instruction || "Choose the answer"}</h2>
        <div className="learning-practice-stimulus">
        {(!task.hideStimulusModel || saved.delivery === "unavailable") && (task.image || task.targetWord?.image || image) && <img className="learning-teaching-picture" src={task.image || task.targetWord?.image || image} alt={task.word || task.targetWord?.word || word || "Question picture"} />}
        {(!task.hideStimulusModel || saved.delivery === "unavailable") && (task.sentence || task.passage || task.display || task.targetDisplay) && <p className="learning-teaching-passage">{task.sentence || task.passage || task.display || task.targetDisplay}</p>}
        </div>
        {onReplay && <button type="button" className="learning-teaching-replay" aria-label="Listen again" onClick={() => { const playback = replay(false); dwell.current?.waitFor(playback); }} disabled={paused}>
          {["letter_practice", "printed_letter_matching"].includes(instrument) && <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Zm4 3a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" /></svg>}<span>Listen again</span>
        </button>}
        {Array.isArray(episode.expected) && <p aria-label="Built parts">{answers.map((part, index) => <span key={index}>{saved.draft[index] ? learningModelPart(saved.draft[index], task).label : "□"} </span>)}</p>}
        <div className="learning-guided-parts">{options.map((option, index) => {
          const value = typeof option === "object" ? option.value ?? option.id ?? option.word ?? option.letter : option;
          const part = typeof option === "object" ? learningModelPart(option, task) : learningModelPart(value, task);
          return <button type="button" className={`learning-guided-action ${part.image ? "has-picture" : /^[a-z]$/i.test(part.label) ? "has-letter" : "has-word"}`} key={`${value}:${index}`} disabled={paused || saveFailed || episode.phase !== "answer"}
            onClick={() => choose(value)} aria-label={`Choose ${part.label}`} aria-pressed={reviewing ? String(episode.responses.at(-1)?.selected) === String(value) : undefined}>{part.image && <img src={part.image} alt="" />}<span>{part.label}</span></button>;
        })}</div>
        {episode.phase === "receipt" && <p role="status">{episode.responses.at(-1)?.observedCorrect ? "Correct. You found it." : "Not yet. Let's look together."}</p>}
      </div>}
    {teaching && allowQuestionReview && <div className="learning-practice-navigation">
      <button type="button" className="learning-teaching-leave" disabled={paused} onClick={() => setQuestionReview(!reviewing)}>
        {reviewing ? "Learn together →" : "← Back to question"}
      </button>
      <p>{reviewing ? "Your answer is saved. Let's learn, then try a new one." : "Match the example to carry on."}</p>
    </div>}
  </section>;
}

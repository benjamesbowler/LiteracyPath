import { phonicsTargetHint } from "../../../utils/phonicsTargetPresentation.js";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { LearningTeachingCard } from "../../learning/LearningTeachingCard.jsx";
import { createLearningDwell, LEARNING_PACE } from "../../../utils/learningPace.js";
import { advanceLearningResponseReceipt, commitLearningResponse, createLearningResponseEpisode, learningGuidedModelIsPlaced, learningResponseRecoveryIssue, recordLearningGuidedAction, recordLearningGuidedStep, startLearningWithModel } from "../../../utils/learningResponseState.js";
import { learningModelPart } from "../../../utils/learningResponseAdapters.js";
import { shuffleLearningQuestionChoices } from "../../../utils/answerPositionShuffle.js";

function concealsTarget(task, instrument) {
  return task.hideEncodingTarget || task.authoredBeat?.mechanic === "word_forge" || ["cvc_scaffolded_build", "cvc_word_magic", "recognition_target"].includes(instrument);
}

function guidedSnapshot(snapshot, episode) {
  const changedQuestion = episode.question.id !== snapshot.episode.question.id || episode.role !== snapshot.episode.role;
  return { ...snapshot, episode, draft: [], presentation: changedQuestion ? {} : snapshot.presentation, delivery: changedQuestion ? "not_played" : snapshot.delivery };
}

// A component boundary keeps the custom renderer separate from the response
// owner. It receives an event handler; rendering never invokes that handler.
function PracticeSceneControl({ renderControl, ...props }) { return renderControl(props); }

function PracticeChoiceControl({ renderControl, fallback, ...props }) {
  return renderControl(props) || fallback;
}

/** Native practice adapters share an immutable response, saved cursor and bounded
 * teaching loop. Their completion callback closes ONE original curriculum slot. */
export default function LearningPracticeTask({ id, instrument, question, expected, transfer, checkpoint, initialResponse, modelFirst = false, modelFirstReason = "previous_transfer_unresolved",
  onCheckpoint, onComplete, onReplay, onModelReplay = onReplay, initialPlayback, explanation, paused = false, supportUsed = [], word, image, renderWorkedExample, renderChoiceControl, renderPractice, allowQuestionReview = false }) {
  const [recoveryIssue] = useState(() => checkpoint?.episode ? learningResponseRecoveryIssue(checkpoint.episode) || (checkpoint.episode.id !== id ? "content_changed" : "") : "");
  const [saved, setSaved] = useState(() => {
    if (!recoveryIssue && checkpoint?.episode?.id === id) {
      // An older cursor can already contain the child's final modeled tap.
      // Close that active action rather than reopening an all-disabled model.
      return learningGuidedModelIsPlaced(checkpoint.episode)
        ? guidedSnapshot(checkpoint, recordLearningGuidedAction(checkpoint.episode, checkpoint.episode.expected))
        : checkpoint;
    }
    const preparedQuestion = shuffleLearningQuestionChoices(question, `${id}:first-choices`);
    const preparedTransfer = transfer ? { ...transfer, question: shuffleLearningQuestionChoices(transfer.question, `${id}:transfer:${transfer.question.id}`) } : null;
    let episode = createLearningResponseEpisode({ id, instrument, slotId: id, question: preparedQuestion, expected, transfer: preparedTransfer });
    if (modelFirst) episode = startLearningWithModel(episode, modelFirstReason);
    if (initialResponse) episode = commitLearningResponse(episode, { ...initialResponse, supported: true, supportUsed });
    return { episode, draft: [], delivery: "not_played", encodingMistakes: episode.firstResponse?.observedCorrect === false ? 1 : 0 };
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
      onAdvance: () => {
        const current = owner.current, nextEpisode = advanceLearningResponseReceipt(current.episode);
        const keepPrefix = concealsTarget(current.episode.question, instrument) && current.episode.responses.at(-1)?.observedCorrect === false;
        persist({ ...current, episode: nextEpisode, draft: keepPrefix ? current.draft : [] });
      } });
    dwell.current.waitFor(episode.role === "first_probe" && episode.responses.length === 1 ? initialPlayback || playback.current : playback.current);
    if (pausedRef.current || document.hidden) dwell.current.pause();
    return () => dwell.current?.cancel();
  }, [episode.id, episode.phase, episode.question.sentence, saveFailed, recoveryIssue, persist, instrument, initialPlayback, episode.role, episode.responses.length]);
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
    const encoding = concealsTarget(current.episode.question, instrument);
    const guidedEncoding = encoding && ["teaching", "finish_teaching"].includes(current.episode.phase);
    if (paused || saveFailed || current.episode.phase !== "answer" && !guidedEncoding) return;
    const answer = current.episode.expected;
    const multiple = Array.isArray(answer), selected = multiple ? [...current.draft, value] : value;
    const correct = multiple ? String(value) === String(answer[current.draft.length]) : String(value) === String(answer);
    if (multiple && correct && selected.length < answer.length) { persist({ ...current, draft: selected }); return; }
    if (guidedEncoding) {
      if (!correct) { persist({ ...current, encodingMistakes: (current.encodingMistakes || 1) + 1 }); return; }
      const nextEpisode = recordLearningGuidedAction(current.episode, answer);
      persist({ ...guidedSnapshot(current, nextEpisode), draft: nextEpisode.phase === "complete" ? selected : [], encodingMistakes: 0 }); return;
    }
    if (encoding && !correct) {
      persist({ ...current, episode: commitLearningResponse(current.episode, { selected, correct: false, supported: true, supportUsed,
        media: { targetDelivery: current.delivery } }), draft: current.draft, encodingMistakes: (current.encodingMistakes || 0) + 1 }); return;
    }
    persist({ ...current, episode: commitLearningResponse(current.episode, { selected, correct, supported: true,
      supportUsed: current.episode.role === "transfer" ? [...supportUsed, "after_teaching"] : supportUsed,
      media: { targetDelivery: current.delivery } }), draft: selected });
  }
  const task = episode.question, answers = Array.isArray(episode.expected) ? episode.expected : [episode.expected];
  const options = task.answerOptions || task.options || task.choices || task.letterTiles || [];
  const teaching = ["teaching", "finish_teaching"].includes(episode.phase);
  const encoding = concealsTarget(task, instrument);
  const encodingHint = encoding ? phonicsTargetHint(task.target || task.word, saved.encodingMistakes || 0) : "";
  const reviewing = teaching && allowQuestionReview && questionReview;
  if (recoveryIssue) return <section role="alert" data-learning-recovery={recoveryIssue}><h2>Your saved practice is kept safe.</h2><p>This version cannot open that saved question. Ask a grown-up to update the app, then carry on.</p></section>;
  if (renderPractice && !saveFailed) return <section className="learning-scene-owner" data-sibling-learning-task={instrument} data-learning-episode={episode.id} data-learning-phase={episode.phase} data-practice-question={task.id} data-audio-delivery={saved.delivery}>
    <PracticeSceneControl renderControl={renderPractice} question={task} phase={episode.phase} role={episode.role} draft={saved.draft} paused={paused}
      presentation={saved.presentation || {}} onPresentationChange={next => {
        if (!paused && !saveFailed && !['receipt', 'complete'].includes(owner.current.episode.phase)) persist({ ...owner.current, presentation: next });
      }}
      response={episode.responses.at(-1)} explanation={typeof explanation === "function" ? explanation(task) : explanation}
      encodingHint={encodingHint} modelValues={teaching ? answers : []} guidedCursor={teaching ? episode.guidedCursor || 0 : null}
      onReplay={() => { const played = replay(teaching); dwell.current?.waitFor(played); return played; }}
      onChoose={value => {
        if (teaching && !encoding) {
          const held = owner.current, expected = held.episode.expected;
          if (paused) return;
          if (Array.isArray(expected)) {
            const cursor = Number(held.episode.guidedCursor || 0);
            if (String(value) !== String(expected[cursor])) return;
            const stepped = recordLearningGuidedStep(held.episode, cursor);
            if (learningGuidedModelIsPlaced(stepped)) persist(guidedSnapshot(held, recordLearningGuidedAction(stepped, expected)));
            else persist({ ...held, episode: stepped, draft: expected.slice(0, cursor + 1) });
          } else if (String(value) === String(expected)) persist(guidedSnapshot(held, recordLearningGuidedAction(held.episode, value)));
        } else choose(value);
      }} />
  </section>;
  return <section data-sibling-learning-task={instrument} data-learning-episode={episode.id} data-learning-phase={episode.phase} data-practice-question={task.id} data-audio-delivery={saved.delivery} data-practice-mode={task.mode} data-question-review={reviewing || undefined}>
    {saveFailed && <div role="alert"><p>Your answer is kept here. Retry saving before continuing.</p><button type="button" disabled={paused} onClick={() => { if (!paused && !document.hidden) persist(owner.current); }}>Retry save</button></div>}
    {teaching && !reviewing && !encoding ? <>{renderWorkedExample?.(task, episode.expected)}<LearningTeachingCard key={`${id}:${episode.phase}`} episode={episode} explanation={typeof explanation === "function" ? explanation(task) : explanation}
      word={task.word || task.targetWord?.word || word} image={task.image || task.targetWord?.image || image} passage={task.passage || task.sentence}
      disabled={paused || saveFailed} onReplay={() => replay(true)}
      onGuidedStep={index => {
        const stepped = recordLearningGuidedStep(owner.current.episode, index);
        const nextEpisode = learningGuidedModelIsPlaced(stepped) ? recordLearningGuidedAction(stepped, stepped.expected) : stepped;
        // The last part and its bounded transition are one held save. A failed
        // save cannot strand a fully placed model before transfer/completion.
        return persist(guidedSnapshot(owner.current, nextEpisode));
      }}
      onGuided={selected => persist(guidedSnapshot(owner.current, recordLearningGuidedAction(owner.current.episode, selected)))} /></>
      : <div className="learning-teaching-card">
        <p className={`learning-teaching-kicker ${!reviewing && episode.role !== "transfer" ? "is-first-turn" : ""}`}>{reviewing ? "Your saved answer" : episode.role === "transfer" ? "Try a new one" : "Your turn"}</p>
        <h2>{encoding ? task.baseWord ? `Change a letter in ${task.baseWord}.` : Array.isArray(episode.expected) ? "Build the word you hear." : "Find the word you hear." : task.prompt || task.instruction || "Choose the answer"}</h2>
        <div className="learning-practice-stimulus">
        {(!task.hideStimulusModel || saved.delivery === "unavailable") && (task.image || task.targetWord?.image || image) && <img className="learning-teaching-picture" src={task.image || task.targetWord?.image || image} alt={encoding ? "Word picture. Listen for its name." : task.word || task.targetWord?.word || word || "Question picture"} />}
        {!encoding && (!task.hideStimulusModel || saved.delivery === "unavailable") && (task.sentence || task.passage || task.display || task.targetDisplay) && <p className="learning-teaching-passage">{task.sentence || task.passage || task.display || task.targetDisplay}</p>}
        {encoding && task.baseWord && <p className="learning-teaching-passage">{task.baseWord}</p>}
        {encodingHint && <p className="phonics-target-hint" role="status">Hint: <strong data-phonics-hint="">{encodingHint}</strong></p>}
        </div>
        {onReplay && <button type="button" className="learning-teaching-replay" aria-label="Listen again" onClick={() => { const playback = replay(false); dwell.current?.waitFor(playback); }} disabled={paused}>
          {["letter_practice", "printed_letter_matching"].includes(instrument) && <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Zm4 3a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" /></svg>}<span>Listen again</span>
        </button>}
        {Array.isArray(episode.expected) && <p aria-label="Built parts">{answers.map((part, index) => <span key={index}>{saved.draft[index] ? learningModelPart(saved.draft[index], task).label : "□"} </span>)}</p>}
        <div className="learning-guided-parts">{options.map((option, index) => {
          const value = typeof option === "object" ? option.value ?? option.id ?? option.word ?? option.letter : option;
          const part = typeof option === "object" ? learningModelPart(option, task) : learningModelPart(value, task);
          const fallback = <button type="button" className={`learning-guided-action ${part.image ? "has-picture" : /^[a-z]$/i.test(part.label) ? "has-letter" : "has-word"}`} key={`${value}:${index}`} disabled={paused || saveFailed || episode.phase !== "answer" && !(encoding && teaching)}
            onClick={() => choose(value)} aria-label={`Choose ${part.label}`} aria-pressed={reviewing ? String(episode.responses.at(-1)?.selected) === String(value) : undefined}>{part.image && <img src={part.image} alt="" />}<span>{part.label}</span></button>;
          return renderChoiceControl ? <PracticeChoiceControl key={`${task.id}:${value}:${index}`} renderControl={renderChoiceControl} fallback={fallback}
            question={task} option={option} value={value} disabled={paused || saveFailed || episode.phase !== "answer" && !(encoding && teaching)} onChoose={() => choose(value)} /> : fallback;
        })}</div>
        {episode.phase === "receipt" && <p role="status">{episode.responses.at(-1)?.observedCorrect ? "Correct. You found it." : encoding ? "Listen again and try another piece." : episode.responses.at(-1)?.observedCorrect === false ? "Not yet. Let's look together." : "Let's look together."}</p>}
      </div>}
    {teaching && allowQuestionReview && <div className="learning-practice-navigation">
      <button type="button" className="learning-teaching-leave" disabled={paused} onClick={() => setQuestionReview(!reviewing)}>
        {reviewing ? "Learn together →" : "← Back to question"}
      </button>
      <p>{reviewing ? "Your answer is saved. Let's learn, then try a new one." : "Match the example to carry on."}</p>
    </div>}
  </section>;
}

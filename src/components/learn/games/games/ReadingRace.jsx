import { useEffect, useMemo, useRef, useState } from "react";
import { ArcadePracticeGame } from "./ArcadePracticeGame.jsx";
import LearningPracticeTask from "../../phonics/LearningPracticeTask.jsx";
import { CAST } from "../../../../features/soundSeekers/v3/content/cast.js";
import { useLearningResult } from "../../../../hooks/useLearningResult.js";
import { LEARNING_PACE } from "../../../../utils/learningPace.js";
import { hasRecordedSpeech, speak } from "../../../../utils/learnGamesAudio.js";
import { completeRepairDisplay } from "../../../../utils/repairSentence.js";
import { practiceEvidence } from "./phonicsPlayModel.js";
import { useResumeTransition, useStageSnapshot } from "./phonicsSession.js";
import { REPAIR_MARK_NAMES, repairFeedback, repairLearningTask, repairMeaningClue, repairPieces, repairReplayText } from "./sentenceWorkshopModel.js";
import "./phonics-sentence-worlds.css";

function SentenceRepairStage({ state, round, setRound, correct, setCorrect, addScore, miss, finish, isSoundEnabled, schedule, recordFirstResponse, recordAssistedRetry, paused, onDiscover, resume, onSnapshot, modelFirst = false, onModelNext }) {
  const fix = state.fixes[round];
  const [answer, setAnswer] = useState(resume?.answer || "");
  const [wrong, setWrong] = useState("");
  const [feedback, setFeedback] = useState(resume?.feedback || "Tap a repair piece to put it in the gap.");
  const [recovery, setRecovery] = useState(() => resume?.recovery || (modelFirst && !resume?.answer ? { id: crypto.randomUUID(), modelFirst: true } : null));
  const recoveryRef = useRef(recovery), learningEpisode = useRef(resume?.learningEpisode || null);
  const [pending, setPending] = useState(null);
  const pendingRef = useRef(null);
  const learningWorld = useRef(null);
  const solved = useRef(Boolean(resume?.answer) || Boolean(recovery));
  const attempts = useRef(resume?.attempts || 0);
  const { begin: holdResult, waitFor: ownReplay } = useLearningResult(paused);
  const options = useMemo(() => repairPieces(fix, `${state.sessionSeed}:${state.rerollKey}`, resume?.options), [fix, resume, state.rerollKey, state.sessionSeed]);
  function advance(nextCorrect) {
    if (round + 1 >= state.fixes.length) finish(nextCorrect);
    else setRound(round + 1);
  }
  function updateRecovery(next) { recoveryRef.current = next; setRecovery(next); }
  function snapshot(overrides = {}) { return { answer, feedback, options, attempts: attempts.current, recovery: recoveryRef.current, learningEpisode: learningEpisode.current, ...overrides }; }
  function acceptPiece(piece) {
    setAnswer(piece); setWrong(""); setFeedback(repairFeedback(fix, piece, true)); setCorrect(correct + 1); addScore(25);
    const repaired = completeRepairDisplay(fix.display, piece);
    onDiscover({ id: `repair-${round}`, sentence: repaired, index: round });
    holdResult(() => advance(correct + 1), LEARNING_PACE.sentence, () => isSoundEnabled && hasRecordedSpeech(repaired) ? speak(repaired) : undefined);
  }
  function apply(piece) {
    if (paused || solved.current) return;
    const accepted = (fix.acceptedAnswers || [fix.answer]).includes(piece);
    recordFirstResponse({ ...practiceEvidence("sentence_repair", ["sentence_context", "repair_intent"]), game: "sentence-fix-it", round, repairCategory: fix.kind, target: fix.answer, response: piece, correct: accepted });
    solved.current = true;
    if (!accepted) { attempts.current += 1; setWrong(piece); miss(); setFeedback(`You chose ${piece}. Let’s learn this repair together.`); updateRecovery({ id: crypto.randomUUID(), selected: piece }); return; }
    const saved = snapshot({ answer: piece, feedback: repairFeedback(fix, piece, true) });
    if (onSnapshot?.(saved) === false) { pendingRef.current = { piece, snapshot: saved }; setPending(pendingRef.current); return; }
    acceptPiece(piece);
  }
  useStageSnapshot(() => pending?.snapshot || snapshot(), onSnapshot);
  useResumeTransition(Boolean(resume?.answer), () => advance(correct), schedule, LEARNING_PACE.sentence);
  useEffect(() => { if (learningWorld.current) learningWorld.current.scrollTop = 0; }, [recovery?.task?.episode.question.id, recovery?.task?.episode.phase]);
  const parts = fix.display.split("___");
  const replayText = repairReplayText(fix, answer);
  const recordedReplay = hasRecordedSpeech(replayText);
  const canReplay = isSoundEnabled && !paused && recordedReplay;
  const task = recovery ? repairLearningTask(state, round, options) : null;
  return <section className={`psw-game psw-repair${answer ? " is-repaired" : ""}${paused ? " is-paused" : ""}`} data-phonics-mode="quiz" data-repair-index={round} aria-label="Sentence Fix-It sign workshop">
    <header className="psw-hud"><div><strong>Fix the forest sign</strong><span>{recovery ? "Learn the repair, then try a new sign." : fix.prompt}</span></div><span className="psw-progress">Sign {round + 1}/{state.fixes.length}</span>{!recovery && <button type="button" className="psw-replay" aria-label={recordedReplay ? answer ? "Hear the fixed sentence" : "Hear the repair instruction" : answer ? "Read the fixed sentence" : "Read the sign"} disabled={!canReplay} onClick={() => ownReplay(speak(replayText))}>{recordedReplay ? "♪" : "▤"}<span>{recordedReplay ? "Hear" : "Read text"}</span></button>}</header>
    <div className={`psw-repair-clearing${recovery ? " psw-learning-clearing" : ""}`}>
      {pending && <div className="psw-save-alert" role="alert"><p>Your answer is kept here. Retry saving before continuing.</p><button type="button" disabled={paused} onClick={() => { const held = pendingRef.current; if (!held || onSnapshot?.(held.snapshot) === false) return; pendingRef.current = null; setPending(null); acceptPiece(held.piece); }}>Retry save</button></div>}
      {recovery ? <div className="psw-learning-world" ref={learningWorld}>
        <img className="psw-learning-pal" src={CAST.luna.sprite} alt="Luna the owl" draggable="false" />
        <LearningPracticeTask id={recovery.id || recovery.task?.episode.id || task.question.id} instrument="recognition_repair" {...task}
          checkpoint={recovery.task} modelFirst={recovery.modelFirst} initialResponse={recovery.modelFirst ? null : { selected: recovery.selected, correct: false }} supportUsed={["repair_context"]} paused={paused}
          explanation={question => `${question.prompt} ${repairFeedback({ ...question, kind: question.construct }, question.answer, true)} ${completeRepairDisplay(question.display, question.answer)}`}
          onReplay={question => {
            const episode = recoveryRef.current?.task?.episode;
            const line = episode?.phase === "receipt" && episode.responses.at(-1)?.observedCorrect
              ? completeRepairDisplay(question.display, episode.expected) : question.instructionCue || question.prompt;
            return isSoundEnabled && hasRecordedSpeech(line) ? speak(line) : undefined;
          }}
          onModelReplay={question => { const line = completeRepairDisplay(question.display, question.answer); return isSoundEnabled && hasRecordedSpeech(line) ? speak(line) : undefined; }}
          onCheckpoint={savedTask => { const next = { ...recoveryRef.current, task: savedTask }; updateRecovery(next); return onSnapshot?.(snapshot({ recovery: next })); }}
          onComplete={episode => {
            const saved = snapshot({ answer: fix.answer, feedback: repairFeedback(fix, fix.answer, true), recovery: null, learningEpisode: episode });
            if (onSnapshot?.(saved) === false) return false;
            learningEpisode.current = episode; updateRecovery(null); onModelNext?.(episode.completion.unresolved === true);
            recordAssistedRetry({ game: "sentence-fix-it", round, target: fix.answer, attempts: episode.firstResponse ? 1 : 0, supportUsed: ["worked_repair_model", ...(episode.transfer ? ["fresh_transfer"] : [])], learningEpisode: episode });
            acceptPiece(fix.answer);
          }} />
      </div> : <>
      <img className="psw-repair-guide" src={CAST.luna.sprite} alt="Luna the owl" draggable="false" />
      <div className="psw-sign-post" aria-hidden="true" />
      <div className="psw-repair-sign" aria-label={answer ? completeRepairDisplay(fix.display, answer) : fix.display.replace("___", "gap")}>
        <span className="psw-sign-tag">{answer ? "✓ Repaired" : "Read the sign · One piece is missing"}</span>
        <p>{parts.map((part, index) => <span key={index}>{part}{index < parts.length - 1 && <span className={`psw-repair-gap${answer ? " is-filled" : ""}`} aria-label={answer || "Missing piece"}>{answer || "…"}</span>}</span>)}</p>
      </div>
      <div className="psw-repair-rack" role="group" aria-label="Choose the missing piece"><p className={repairMeaningClue(fix) ? "psw-story-clue" : ""}>{repairMeaningClue(fix) || "Tap a piece to repair the sign."}</p><div>{options.map(piece => <button type="button" className={`psw-repair-piece${wrong === piece ? " is-wrong" : ""}`} key={piece} aria-label={`Use ${REPAIR_MARK_NAMES[piece] || piece}`} disabled={paused || Boolean(pending) || Boolean(answer)} onClick={() => apply(piece)}>{piece}</button>)}</div></div>
      </>}
    </div>
    <footer className="psw-feedback" role="status" data-feedback-kind={wrong ? "retry" : answer ? "success" : "guide"}>{recovery?.task?.episode.role === "transfer"
      ? recovery.task.episode.phase === "receipt" && recovery.task.episode.responses.at(-1)?.observedCorrect
        ? `You repaired: ${completeRepairDisplay(recovery.task.episode.question.display, recovery.task.episode.expected)}` : "Read this new sign. Choose its missing piece." : feedback}</footer>
  </section>;
}

export default function ReadingRace(props) {
  return <ArcadePracticeGame {...props} title="Sentence Fix-It" mode="quiz" stageComponents={{ quiz: SentenceRepairStage }} />;
}

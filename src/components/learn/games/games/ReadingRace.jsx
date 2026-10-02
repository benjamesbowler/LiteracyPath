import { useMemo, useRef, useState } from "react";
import { ArcadePracticeGame } from "./ArcadePracticeGame.jsx";
import { CAST } from "../../../../features/soundSeekers/v3/content/cast.js";
import { useLearningResult } from "../../../../hooks/useLearningResult.js";
import { LEARNING_PACE } from "../../../../utils/learningPace.js";
import { hasRecordedSpeech, speak } from "../../../../utils/learnGamesAudio.js";
import { completeRepairDisplay } from "../../../../utils/repairSentence.js";
import { practiceEvidence } from "./phonicsPlayModel.js";
import { useResumeTransition, useStageSnapshot } from "./phonicsSession.js";
import { REPAIR_MARK_NAMES, repairFeedback, repairMeaningClue, repairPieces, repairReplayText } from "./sentenceWorkshopModel.js";
import "./phonics-sentence-worlds.css";

function SentenceRepairStage({ state, round, setRound, correct, setCorrect, addScore, miss, finish, isSoundEnabled, schedule, recordFirstResponse, recordAssistedRetry, paused, onDiscover, resume, onSnapshot }) {
  const fix = state.fixes[round];
  const [answer, setAnswer] = useState(resume?.answer || "");
  const [wrong, setWrong] = useState("");
  const [feedback, setFeedback] = useState(resume?.feedback || "Tap a repair piece to put it in the gap.");
  const solved = useRef(Boolean(resume?.answer));
  const attempts = useRef(resume?.attempts || 0);
  const { begin: holdResult, waitFor: ownReplay } = useLearningResult(paused);
  const options = useMemo(() => repairPieces(fix, `${state.sessionSeed}:${state.rerollKey}`, resume?.options), [fix, resume, state.rerollKey, state.sessionSeed]);
  function advance(nextCorrect) {
    if (round + 1 >= state.fixes.length) finish(nextCorrect);
    else setRound(round + 1);
  }
  function apply(piece) {
    if (paused || solved.current) return;
    const accepted = (fix.acceptedAnswers || [fix.answer]).includes(piece);
    recordFirstResponse({ ...practiceEvidence("sentence_repair", ["sentence_context", "repair_intent"]), game: "sentence-fix-it", round, repairCategory: fix.kind, target: fix.answer, response: piece, correct: accepted });
    setFeedback(repairFeedback(fix, piece, accepted));
    if (!accepted) { attempts.current += 1; setWrong(piece); miss(); return; }
    solved.current = true;
    setAnswer(piece);
    setWrong("");
    setCorrect(correct + 1);
    addScore(25);
    const repaired = completeRepairDisplay(fix.display, piece);
    onDiscover({ id: `repair-${round}`, sentence: repaired, index: round });
    if (attempts.current) recordAssistedRetry({ game: "sentence-fix-it", round, target: piece, attempts: attempts.current, supportUsed: ["repair_category_feedback", "sentence_context"] });
    holdResult(() => advance(correct + 1), LEARNING_PACE.sentence, () => isSoundEnabled && hasRecordedSpeech(repaired) ? speak(repaired) : undefined);
  }
  useStageSnapshot(() => ({ answer, feedback, options, attempts: attempts.current }), onSnapshot);
  useResumeTransition(Boolean(resume?.answer), () => advance(correct), schedule, LEARNING_PACE.sentence);
  const parts = fix.display.split("___");
  const replayText = repairReplayText(fix, answer);
  const recordedReplay = hasRecordedSpeech(replayText);
  const canReplay = isSoundEnabled && !paused && recordedReplay;
  return <section className={`psw-game psw-repair${answer ? " is-repaired" : ""}${paused ? " is-paused" : ""}`} data-phonics-mode="quiz" data-repair-index={round} aria-label="Sentence Fix-It sign workshop">
    <header className="psw-hud"><div><strong>Fix the forest sign</strong><span>{fix.prompt}</span></div><span className="psw-progress">Sign {round + 1}/{state.fixes.length}</span><button type="button" className="psw-replay" aria-label={recordedReplay ? answer ? "Hear the fixed sentence" : "Hear the repair instruction" : answer ? "Read the fixed sentence" : "Read the sign"} disabled={!canReplay} onClick={() => ownReplay(speak(replayText))}>{recordedReplay ? "♪" : "▤"}<span>{recordedReplay ? "Hear" : "Read text"}</span></button></header>
    <div className="psw-repair-clearing">
      <img className="psw-repair-guide" src={CAST.luna.sprite} alt="Luna the owl" draggable="false" />
      <div className="psw-sign-post" aria-hidden="true" />
      <div className="psw-repair-sign" aria-label={answer ? completeRepairDisplay(fix.display, answer) : fix.display.replace("___", "gap")}>
        <span className="psw-sign-tag">{answer ? "✓ Repaired" : "Read the sign · One piece is missing"}</span>
        <p>{parts.map((part, index) => <span key={index}>{part}{index < parts.length - 1 && <span className={`psw-repair-gap${answer ? " is-filled" : ""}`} aria-label={answer || "Missing piece"}>{answer || "…"}</span>}</span>)}</p>
      </div>
      <div className="psw-repair-rack" role="group" aria-label="Choose the missing piece"><p className={repairMeaningClue(fix) ? "psw-story-clue" : ""}>{repairMeaningClue(fix) || "Tap a piece to repair the sign."}</p><div>{options.map(piece => <button type="button" className={`psw-repair-piece${wrong === piece ? " is-wrong" : ""}`} key={piece} aria-label={`Use ${REPAIR_MARK_NAMES[piece] || piece}`} disabled={paused || Boolean(answer)} onClick={() => apply(piece)}>{piece}</button>)}</div></div>
    </div>
    <footer className="psw-feedback" role="status" data-feedback-kind={wrong ? "retry" : answer ? "success" : "guide"}>{feedback}</footer>
  </section>;
}

export default function ReadingRace(props) {
  return <ArcadePracticeGame {...props} title="Sentence Fix-It" mode="quiz" stageComponents={{ quiz: SentenceRepairStage }} />;
}

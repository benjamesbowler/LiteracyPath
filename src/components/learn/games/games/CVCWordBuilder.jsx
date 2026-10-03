import { ArcadePracticeGame } from "./ArcadePracticeGame.jsx";
import { useMemo, useRef, useState } from "react";
import { useLearningResult } from "../../../../hooks/useLearningResult.js";
import { LEARNING_PACE } from "../../../../utils/learningPace.js";
import { gameRandom } from "../../../../utils/gameReplay.js";
import { speakPhoneme, speakWord } from "../../../../utils/learnGamesAudio.js";
import { useRecordedPracticeCue } from "../shared/useRecordedPracticeCue.js";
import { WorkshopObjectAction } from "../shared/WorkshopObjectAction.jsx";
import { PlayHero, WordPicture, PhonicsTargetHint } from "./PhonicsPlayShared.jsx";
import { useStageSnapshot, useResumeTransition } from "./phonicsSession.js";
import { practiceEvidence } from "./phonicsPlayModel.js";
import { shuffleBuildingChoices } from "./phonicsBuildingRounds.js";
import "./phonics-building.css";

export function BuildingScene({ kind, difficulty = "easy", prompt, instruction, progress, total, target, paused, children, feedback, replay, canHear, collection = [], solved = false, mistakes = 0 }) {
  return <section className={`pb-stage pb-${kind}${paused ? " is-paused" : ""}`} data-building-game={kind} data-target={target} data-pal-world={difficulty === "hard" ? "moonwood" : difficulty === "medium" ? "dino" : "meadow"}>
    <header className="pb-hud">
      <div><strong>{prompt}</strong><p>{instruction}</p></div>
      <span className="pb-progress" aria-label={`${progress} of ${total} completed`}>{progress}/{total}</span>
      <button type="button" className="pb-replay" disabled={paused || !canHear} onClick={replay} aria-label="Hear target word"><span aria-hidden="true">♪</span></button>
    </header>
    <div className="pb-world">
      <div className="pb-picture-card"><WordPicture key={target} word={target} answerNeutral={!solved} />{solved && <strong>{target}</strong>}<PhonicsTargetHint word={target} mistakes={mistakes} solved={solved} /></div>
      <PlayHero difficulty={difficulty} className="pb-host" />
      {children}
    </div>
    <p className="pb-feedback" role="status" aria-live="polite">{feedback}</p>
    {collection.length > 0 && <div className="pb-collection" aria-label="Completed creations">{collection.filter(item => solved || item.word !== target).slice(-6).map(item => <span key={item.id}><WordPicture word={item.word} /><small>{item.word}</small></span>)}</div>}
  </section>;
}

// A tap places a tile in the next open sound slot. Undo retains reversible
// construction; spelling correctness never depends on a drag or confirmation.
export function CvcWorkshopStage({ state, round, setRound, correct, setCorrect, addScore, miss, finish, isSoundEnabled, totalRounds, schedule, recordFirstResponse, recordAssistedRetry, paused, discovered, onDiscover, difficulty, resume, onSnapshot }) {
  const target = state.rounds[round];
  const { begin: holdResult, waitFor: ownReplay } = useLearningResult(paused);
  const [placed, setPlaced] = useState(() => target.units.map((unit, index) => resume?.placed?.[index]?.grapheme === unit.grapheme ? resume.placed[index] : null));
  const [wrong, setWrong] = useState(resume?.wrong || null);
  const [hintMistakes, setHintMistakes] = useState(resume?.attempts || 0);
  const [done, setDone] = useState(Boolean(resume?.done));
  const placedRef = useRef(placed), solvedRef = useRef(Boolean(resume?.done)), attempts = useRef(resume?.attempts || 0);
  const [bankSeed] = useState(() => resume?.bankSeed ?? Math.random());
  const nextSlot = placed.findIndex(piece => !piece);
  const tiles = useMemo(() => {
    if (nextSlot < 0) return [];
    const candidates = [...new Set(state.rounds.flatMap(item => item.units.map(unit => unit.grapheme)))];
    const random = gameRandom(`${target.id}:${state.rerollKey || 0}:${bankSeed}:${nextSlot}:tile-bank`);
    const shuffle = values => shuffleBuildingChoices(values, random);
    const expected = target.units[nextSlot].grapheme;
    const decoys = shuffle(candidates.filter(grapheme => grapheme !== expected)).slice(0, 2);
    return shuffle([expected, ...decoys]);
  }, [target, state, bankSeed, nextSlot]);
  const { canHear, replay } = useRecordedPracticeCue(target.word, isSoundEnabled && !paused, true, ownReplay);
  function place(grapheme) {
    const index = placedRef.current.findIndex(piece => !piece);
    if (paused || solvedRef.current || index < 0) return;
    const unit = target.units[index], accepted = grapheme === unit.grapheme;
    recordFirstResponse({ ...practiceEvidence("ordered_grapheme_construction", ["picture_cue", "recorded_word_cue", "movable_graphemes"]), game: "building-workshop", round: `${round}:${index}`, target: unit.grapheme, word: target.word, response: grapheme, correct: accepted, soundEnabled: isSoundEnabled });
    if (!accepted) {
      attempts.current += 1; setHintMistakes(attempts.current); miss(); setWrong({ index, grapheme });
      if (isSoundEnabled) void speakWord(target.word);
      return;
    }
    const next = [...placedRef.current]; next[index] = { ...unit };
    placedRef.current = next; setPlaced(next); setWrong(null);
    if (!next.every(Boolean)) { if (isSoundEnabled) void speakPhoneme(unit.phoneme || grapheme); return; }
    solvedRef.current = true; setDone(true); addScore(25); setCorrect(correct + 1);
    onDiscover({ id: `build-${round}`, word: target.word });
    if (attempts.current) recordAssistedRetry({ game: "building-workshop", round, target: target.word, attempts: attempts.current, supportUsed: ["specific_grapheme_feedback", "preserved_correct_pieces"] });
    holdResult(() => round + 1 >= totalRounds ? finish(correct + 1) : setRound(round + 1), LEARNING_PACE.word, () => isSoundEnabled ? speakWord(target.word) : undefined);
  }
  function removeLast() {
    const index = placedRef.current.findLastIndex(Boolean);
    if (paused || solvedRef.current || index < 0) return;
    const next = [...placedRef.current]; next[index] = null; placedRef.current = next; setPlaced(next); setWrong(null);
  }
  useStageSnapshot(() => ({ placed, wrong, done, usedObject: done, tiles, bankSeed, attempts: attempts.current }), onSnapshot);
  useResumeTransition(resume?.done, () => round + 1 >= totalRounds ? finish(correct) : setRound(round + 1), schedule, LEARNING_PACE.word);
  const feedback = done ? `${target.word}! ${target.useResult}` : wrong ? `${wrong.grapheme} does not match the next sound. Try another tile for sound ${wrong.index + 1}.` : `Tap a tile for sound ${nextSlot + 1}. Undo puts your last tile back.`;
  return <BuildingScene kind="workshop" difficulty={difficulty} prompt={done ? `${target.word} built!` : "Build the word"} instruction="Tap the sound tiles in order." target={target.word} paused={paused} progress={correct} total={totalRounds} canHear={canHear} replay={replay} feedback={feedback} collection={discovered} solved={done} mistakes={hintMistakes}>
    <div className={`pb-workbench${done ? " is-complete" : ""}`}>
      <div className="pb-slot-row" role="group" aria-label="Word assembly slots">{target.units.map((unit, index) => <span key={unit.id} className={`pb-slot${placed[index] ? " is-filled" : ""}${index === nextSlot ? " is-next" : ""}`} data-slot-index={index} aria-label={placed[index] ? `${placed[index].grapheme} in position ${index + 1}` : `Sound space ${index + 1}`}>{placed[index]?.grapheme || <span aria-hidden="true">{index === nextSlot ? "?" : "·"}</span>}</span>)}</div>
      {done && <div className="pb-object-result"><WorkshopObjectAction target={target} active /></div>}
      <div className="pb-piece-bank" role="group" aria-label="Sound tiles">{tiles.map(grapheme => <button type="button" className="pb-tile" key={grapheme} data-grapheme={grapheme} disabled={paused || done} onClick={() => place(grapheme)} aria-label={`Place ${grapheme}`}>{grapheme}</button>)}{!done && <button type="button" className="pb-tile pb-undo" disabled={paused || !placed.some(Boolean)} onClick={removeLast} aria-label="Undo last sound"><span aria-hidden="true">↶</span><small>Undo</small></button>}</div>
    </div>
  </BuildingScene>;
}

export default function CVCWordBuilder(props) {
  return <ArcadePracticeGame {...props} title="CVC Word Builder" mode="build" stageComponents={{ build: CvcWorkshopStage }} />;
}

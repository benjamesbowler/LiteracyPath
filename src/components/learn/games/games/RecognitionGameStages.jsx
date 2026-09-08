import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getChildWordAsset } from "../../../../data/childAssets.js";
import { hasRecordedSpeech, speakWord } from "../../../../utils/learnGamesAudio.js";
import { getLedaInstructionAudioPath, getLedaWordAudioPath } from "../../../../data/ledaProductionAudio.js";
import { playCueAudio, stopCueAudio } from "../../../../utils/audio/cuePlayer.js";
import { playPopSound } from "../../../../utils/audio/gameSfx.js";
import { hfwOptions, sentenceTiles, shuffled } from "../../../../utils/recognitionPractice.js";
import { completeRepairDisplay } from "../../../../utils/repairSentence.js";
import { IllustratedGameScene } from "../shared/IllustratedGameScene.jsx";
import { GameMeter } from "../shared/PracticeGameMeter.jsx";

const practice = (construct, supportUsed) => ({ construct, practiceOnly: true, independent: false, supportUsed, audioDelivery: "not_measured" });

// Use the shared cue session so failed playback has a visible fallback, and
// mute, replay, pause and leaving the stage cannot leak a stale sentence.
function useRecognitionCue(text, enabled, autoPlay = true) {
  const [failedText, setFailedText] = useState("");
  const canHear = enabled && hasRecordedSpeech(text) && failedText !== text;
  const replay = useCallback(() => {
    if (!canHear) return;
    const src = /^[a-z]+$/i.test(text) ? getLedaWordAudioPath(text) : getLedaInstructionAudioPath(text);
    playCueAudio(src, { onUnavailable: () => setFailedText(text) });
  }, [canHear, text]);
  useEffect(() => {
    if (autoPlay) replay();
    return stopCueAudio;
  }, [autoPlay, replay]);
  return { canHear, replay };
}

function CollectedPicture({ word }) {
  const [failed, setFailed] = useState(false);
  const src = getChildWordAsset(word)?.image;
  return src && !failed ? <img src={src} alt={`Collected ${word}`} onError={() => setFailed(true)} /> : <span>{word}</span>;
}

export function MatchGame({ state, isSoundEnabled, correct, setCorrect, addScore, miss, finish, resultReady, schedule, recordFirstResponse, recordAssistedRetry }) {
  const [boardIndex, setBoardIndex] = useState(0);
  const [selected, setSelected] = useState([]);
  const [matchedIds, setMatchedIds] = useState([]);
  const selectedRef = useRef([]);
  const matchedRef = useRef(new Set());
  const pairAttemptsRef = useRef(new Map());
  const cards = state.boards[boardIndex];
  const total = state.cards.length / 2;
  const boardComplete = cards.every(card => matchedIds.includes(card.id));

  function choose(card) {
    if (selectedRef.current.length >= 2 || matchedRef.current.has(card.id) || selectedRef.current.some(item => item.id === card.id)) return;
    if (isSoundEnabled) speakWord(card.word);
    const next = [...selectedRef.current, card];
    selectedRef.current = next;
    setSelected(next);
    if (next.length !== 2) return;
    const matched = next[0].pairId === next[1].pairId;
    recordFirstResponse({ ...practice("visual_memory", ["spatial_pairing"]), game: "sight-word-memory", round: next[0].pairId, target: next[0].word, response: card.word, correct: matched });
    if (matched) {
      const attempts = pairAttemptsRef.current.get(next[0].pairId) || 0;
      if (attempts) recordAssistedRetry({ game: "sight-word-memory", round: next[0].pairId, attempts, supportUsed: ["revealed_cards", "spatial_pairing"] });
      next.forEach(item => matchedRef.current.add(item.id));
      setMatchedIds([...matchedRef.current]);
      selectedRef.current = [];
      setSelected([]);
      addScore(12);
      const nextCorrect = matchedRef.current.size / 2;
      setCorrect(nextCorrect);
      if (nextCorrect === total) resultReady(nextCorrect);
    } else {
      pairAttemptsRef.current.set(next[0].pairId, (pairAttemptsRef.current.get(next[0].pairId) || 0) + 1);
      miss();
      schedule(() => { selectedRef.current = []; setSelected([]); }, 650);
    }
  }

  return <IllustratedGameScene mode="memory" stageClassName="lg-memory-stage">
    <p>Match the words to collect pictures. This is memory practice.</p>
    <div className="lg-memory-collection" style={{ "--collection-columns": total <= 3 ? total : Math.ceil(total / 2) }} aria-label={`${correct} pictures collected`}>
      {state.cards.filter(card => card.id.endsWith("-a")).map(card => <span key={card.pairId} className={matchedIds.includes(card.id) ? "collected" : ""}>
        {matchedIds.includes(card.id) ? <CollectedPicture word={card.object} /> : <span aria-hidden="true">?</span>}
      </span>)}
    </div>
    <div className="lg-card-grid memory" data-card-count={cards.length}>
      {cards.map((card, index) => {
        const matched = matchedIds.includes(card.id);
        const visible = matched || selected.some(item => item.id === card.id);
        const position = `${index + 1} of ${cards.length}`;
        return <button key={card.id} type="button" data-pair-id={card.pairId} disabled={matched} className={`lg-match-card${matched ? " matched" : ""}${visible ? " revealed" : ""}`} onClick={() => choose(card)} aria-label={matched ? `Matched card ${position}: ${card.word}` : visible ? `Revealed card ${position}: ${card.word}` : `Hidden card ${position}`}>
          <span className="lg-card-inner"><span className="lg-card-face lg-card-back" aria-hidden="true">?</span><span className="lg-card-face lg-card-front" aria-hidden={!visible}>{card.word}</span></span>
        </button>;
      })}
    </div>
    {boardComplete && <div className="lg-practice-set-complete" role="status"><span>Pictures collected!</span><button type="button" onClick={() => boardIndex + 1 < state.boards.length ? setBoardIndex(boardIndex + 1) : finish(correct)}>{boardIndex + 1 < state.boards.length ? "Next card set" : "Finish collection"}</button></div>}
    <GameMeter current={correct} total={total} />
  </IllustratedGameScene>;
}

export function TargetGame({ state, round, setRound, correct, setCorrect, addScore, miss, finish, resultReady, isSoundEnabled, totalRounds, recordFirstResponse, recordAssistedRetry }) {
  const target = state.words[round];
  const options = useMemo(() => hfwOptions(target, state.pool), [target, state.pool]);
  const [popped, setPopped] = useState(false);
  const { canHear, replay } = useRecognitionCue(target, isSoundEnabled, !popped);
  const [wrong, setWrong] = useState("");
  const [pressed, setPressed] = useState(false);
  const solvedRef = useRef(false);
  const attemptsRef = useRef(0);

  function choose(word) {
    if (solvedRef.current) return;
    recordFirstResponse({ ...practice("high_frequency_word_recognition", [canHear ? "recorded_word_cue" : "printed_target"]), game: "pop-the-word", round, target, response: word, correct: word === target });
    setPressed(false);
    if (word !== target) { attemptsRef.current += 1; setWrong(word); miss(); return; }
    solvedRef.current = true;
    setWrong("");
    setPopped(true);
    if (attemptsRef.current) recordAssistedRetry({ game: "pop-the-word", round, target, attempts: attemptsRef.current, supportUsed: ["choice_feedback"] });
    addScore(18, playPopSound);
    setCorrect(correct + 1);
    if (round + 1 === totalRounds) resultReady(correct + 1);
  }

  return <IllustratedGameScene mode="target" stageClassName={`lg-target-stage lg-pop-stage${pressed || popped ? " lg-target-frozen" : ""}`}>
    <p>{canHear ? "Listen, then pop the matching word." : "Match the printed word. Sound is off or unavailable."}</p>
    {!popped && <>{canHear ? <button type="button" className="lg-game-audio" onClick={replay}>Hear word</button> : <div className="lg-game-picture lg-game-picture-text"><span>{target}</span></div>}
      <div className="lg-floating-options">{options.map(word => <button type="button" key={word} onPointerDown={() => setPressed(true)} onPointerUp={() => setPressed(false)} onPointerCancel={() => setPressed(false)} onKeyDown={event => { if (["Enter", " "].includes(event.key)) setPressed(true); }} onKeyUp={() => setPressed(false)} onBlur={() => setPressed(false)} onClick={() => choose(word)} className={wrong === word ? "wrong" : ""}>{word}</button>)}</div>
      {wrong && <div className="lg-pop-feedback" role="status">That word is {wrong}. {canHear ? "Hear the target again, then choose." : `Look for ${target}.`}</div>}
    </>}
    {popped && <div className="lg-pop-discovery" role="status">
      <div className="lg-pop-world" aria-label="A friend discovered in the meadow"><img className="lg-pop-meadow" src="/images/backdrops/activity-bg-meadow.webp" alt="A meadow with a path" /><img className="lg-pop-friend" src="/images/pals/poses/meadow-celebrate.webp" alt="Meadow Pal celebrating" /><span className="lg-pop-found-word">{target}</span></div>
      <div><strong>You found {target}!</strong><span>Your word opened a window into the meadow.</span><button type="button" onClick={() => round + 1 >= totalRounds ? finish(correct) : setRound(round + 1)}>{round + 1 >= totalRounds ? "Finish" : "Next word"}</button></div>
    </div>}
    <GameMeter current={round + 1} total={totalRounds} />
  </IllustratedGameScene>;
}

export function SentenceGame({ state, round, setRound, correct, setCorrect, addScore, miss, finish, resultReady, isSoundEnabled, recordFirstResponse, recordAssistedRetry }) {
  const sentence = state.sentences[round];
  const tiles = useMemo(() => sentenceTiles(sentence), [sentence]);
  const choices = useMemo(() => shuffled(tiles), [tiles]);
  const [phase, setPhase] = useState(round === 0 ? "teach" : "build");
  const [placed, setPlaced] = useState([]);
  const [wrong, setWrong] = useState("");
  const positionRef = useRef(0);
  const consumedRef = useRef(new Set());
  const attemptsRef = useRef(0);
  const modeledRef = useRef(false);
  const { canHear, replay } = useRecognitionCue(sentence, isSoundEnabled, phase === "build");
  useEffect(() => {
    if (phase !== "build") return;
    if (!canHear) modeledRef.current = true;
  }, [phase, canHear, sentence]);

  function choose(tile) {
    const index = positionRef.current;
    if (phase !== "build" || index >= tiles.length || consumedRef.current.has(tile.id)) return;
    const expected = tiles[index].word;
    const accepted = tile.word === expected;
    recordFirstResponse({ ...practice("sentence_word_order", modeledRef.current || !canHear ? ["printed_sentence_model"] : ["recorded_sentence_cue"]), game: "word-hopscotch", round: `${round}:${index}`, sentence, target: expected, response: tile.word, tileId: tile.id, correct: accepted });
    if (!accepted) { attemptsRef.current += 1; setWrong(tile.id); miss(); return; }
    if (attemptsRef.current) recordAssistedRetry({ game: "word-hopscotch", round: `${round}:${index}`, target: expected, attempts: attemptsRef.current, supportUsed: ["order_feedback"] });
    attemptsRef.current = 0;
    consumedRef.current.add(tile.id);
    positionRef.current += 1;
    setWrong("");
    setPlaced(current => [...current, tile]);
    addScore(10);
    if (positionRef.current === tiles.length) {
      setPhase("complete");
      setCorrect(correct + 1);
      if (round + 1 === state.sentences.length) resultReady(correct + 1);
    }
  }

  return <IllustratedGameScene mode="sentence" stageClassName={`lg-hop-stage lg-hop-phase-${phase}`}>
    <p>{phase === "teach" ? "First, see how a sentence path works." : "Build the new sentence, one word at a time."}</p>
    {phase === "teach" ? <div className="lg-sentence-model" role="group" aria-label="Worked example"><strong>Follow this example</strong><span>{state.modelSentence}</span><button type="button" onClick={() => setPhase("build")}>Try a new sentence</button></div> : <>
      {canHear ? <button type="button" className="lg-game-audio" onClick={replay}>Hear sentence</button> : phase !== "complete" && <div className="lg-hop-model"><strong>Guided ordering</strong><span>{sentence}</span></div>}
      <div className="lg-hop-route" aria-label={`${placed.length} of ${tiles.length} sentence stones reached`}>
        <div className="lg-hop-river" />
        <img className="lg-hop-pal" src="/images/pals/poses/meadow-wave.webp" alt="Meadow Pal on the sentence path" key={placed.length} style={{ "--hop-position": placed.length / tiles.length, "--hop-from": Math.max(0, placed.length - 1) / tiles.length }} />
        <div className="lg-sentence-path">{tiles.map((tile, index) => <span key={tile.id} data-word={tile.word} style={{ "--stone-position": (index + 1) / tiles.length }} className={index < placed.length ? "done" : ""}>{index < placed.length ? tile.word : index + 1}</span>)}</div>
      </div>
      {phase === "build" ? <div className="lg-hop-grid">{choices.map(tile => <button key={tile.id} type="button" data-word-id={tile.id} disabled={placed.some(item => item.id === tile.id)} className={wrong === tile.id ? "wrong" : ""} onClick={() => choose(tile)}>{tile.word}</button>)}</div> : <div className="lg-sentence-complete" role="status"><strong>Sentence built!</strong><span>{sentence}</span><button type="button" onClick={() => round + 1 >= state.sentences.length ? finish(correct) : setRound(round + 1)}>{round + 1 >= state.sentences.length ? "Finish" : "Next sentence"}</button></div>}
      {wrong && <div className="lg-order-feedback" role="status">Try another word for this stone.</div>}
    </>}
    <GameMeter current={round + 1} total={state.sentences.length} />
  </IllustratedGameScene>;
}

export function FixGame({ state, round, setRound, correct, setCorrect, addScore, miss, finish, resultReady, isSoundEnabled, recordFirstResponse, recordAssistedRetry }) {
  const fix = state.fixes[round];
  const [answer, setAnswer] = useState("");
  const [wrong, setWrong] = useState("");
  const solvedRef = useRef(false);
  const attemptsRef = useRef(0);
  const options = useMemo(() => shuffled(fix.options), [fix]);
  const completedSentence = completeRepairDisplay(fix.display, answer);
  const spokenText = answer ? completedSentence : fix.prompt;
  const { canHear, replay } = useRecognitionCue(spokenText, isSoundEnabled);

  function choose(option) {
    if (solvedRef.current) return;
    const accepted = (fix.acceptedAnswers || [fix.answer]).includes(option);
    recordFirstResponse({ ...practice("sentence_repair", ["sentence_context"]), game: "sentence-fix-it", round, repairCategory: fix.kind, target: fix.answer, response: option, correct: accepted });
    if (!accepted) { attemptsRef.current += 1; setWrong(option); miss(); return; }
    solvedRef.current = true;
    setWrong("");
    setAnswer(option);
    if (attemptsRef.current) recordAssistedRetry({ game: "sentence-fix-it", round, target: fix.answer, attempts: attemptsRef.current, supportUsed: ["repair_category_feedback"] });
    addScore(25);
    setCorrect(correct + 1);
    if (round + 1 === state.fixes.length) resultReady(correct + 1);
  }

  const parts = fix.display.split("___");
  return <IllustratedGameScene mode="quiz" stageClassName="lg-repair-stage">
    <p>{fix.prompt}</p>
    {canHear && <button type="button" className="lg-game-audio" onClick={replay}>{answer ? "Hear repaired sentence" : "Hear instruction"}</button>}
    <div className={`lg-repair-bench${answer ? " repaired" : ""}`} aria-label={answer ? "Sentence repaired" : "Repair bench"}>
      <div className="lg-reading-sentence lg-fix-sentence">{parts.map((part, index) => <span key={index}>{part}{index < parts.length - 1 && <strong className="lg-repair-piece">{answer || "___"}</strong>}</span>)}</div>
      <span className="lg-repair-clamp" aria-hidden="true" />
    </div>
    {!answer ? <div className="lg-hop-grid">{options.map(option => <button key={option} type="button" className={wrong === option ? "wrong" : ""} onClick={() => choose(option)}>{option}</button>)}</div> : <div className="lg-fix-complete" role="status"><strong>Your message is repaired.</strong><button type="button" onClick={() => round + 1 === state.fixes.length ? finish(correct) : setRound(round + 1)}>{round + 1 === state.fixes.length ? "Finish" : "Next message"}</button></div>}
    {wrong && <div className="lg-fix-feedback" role="status">{fix.kind === "capital" ? "Names and sentence starts need a capital." : fix.kind === "end" ? "Check whether it tells, asks, or shows strong feeling." : "Read the whole sentence and choose the word that makes sense."}</div>}
    <GameMeter current={round + 1} total={state.fixes.length} />
  </IllustratedGameScene>;
}

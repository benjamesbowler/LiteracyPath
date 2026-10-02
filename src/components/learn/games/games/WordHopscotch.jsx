import { useEffect, useMemo, useRef, useState } from "react";
import { ArcadePracticeGame } from "./ArcadePracticeGame.jsx";
import { PlayHero } from "./PhonicsPlayShared.jsx";
import { useLearningResult } from "../../../../hooks/useLearningResult.js";
import { LEARNING_PACE } from "../../../../utils/learningPace.js";
import { sentenceTiles } from "../../../../utils/recognitionPractice.js";
import { buildRecordedHopOuting, nextHopWords } from "./sentenceWorkshopModel.js";
import { hasRecordedSpeech, speak } from "../../../../utils/learnGamesAudio.js";
import { useRecordedPracticeCue } from "../shared/useRecordedPracticeCue.js";
import { practiceEvidence } from "./phonicsPlayModel.js";
import { useResumeTransition, useStageSnapshot } from "./phonicsSession.js";
import "./phonics-sentence-worlds.css";

// Only the next jump is a choice. Earlier stones show the sentence the child
// made; distant words and repeated disabled decoys cannot obscure that action.
function HopscotchStage({ state, round, setRound, correct, setCorrect, addScore, miss, finish, isSoundEnabled, schedule, recordFirstResponse, recordAssistedRetry, paused, onDiscover, difficulty, resume, onSnapshot }) {
  const sentence = state.sentences[round];
  const tiles = useMemo(() => sentenceTiles(sentence), [sentence]);
  const [index, setIndex] = useState(Math.min(resume?.index || 0, tiles.length));
  const [feedback, setFeedback] = useState(resume?.feedback || "Tap the word that comes next.");
  const [wrong, setWrong] = useState("");
  const [hopping, setHopping] = useState(false);
  const attempts = useRef(resume?.attempts || 0);
  const locked = useRef(index === tiles.length);
  const choicesRef = useRef(null);
  const returnFocus = useRef(false);
  const { begin: holdResult, waitFor: ownReplay } = useLearningResult(paused);
  const { canHear, replay, unavailable } = useRecordedPracticeCue(sentence, isSoundEnabled && !paused, true, ownReplay);
  // Identical repeated words are one choice, never competing physical copies.
  const options = useMemo(() => nextHopWords(sentence, index, `${state.sessionSeed}:${state.rerollKey}`), [index, sentence, state.rerollKey, state.sessionSeed]);
  function advance(nextCorrect) {
    if (round + 1 >= state.sentences.length) finish(nextCorrect);
    else setRound(round + 1);
  }
  function choose(word) {
    if (paused || locked.current || !tiles[index]) return;
    const accepted = word === tiles[index].word;
    recordFirstResponse({ ...practiceEvidence("sentence_word_order", ["printed_sentence_model"]), game: "word-hopscotch", round: `${round}:${index}`, sentence, target: tiles[index].word, response: word, correct: accepted });
    if (!accepted) {
      attempts.current += 1;
      miss();
      setWrong(word);
      const built = tiles.slice(0, index).map(tile => tile.word).join(" ");
      setFeedback(`You chose ${word}. ${built ? `Read from “${built}”.` : "Read the sentence from the start."} Which word comes next?`);
      return;
    }
    locked.current = true;
    returnFocus.current = choicesRef.current?.contains(document.activeElement);
    setWrong("");
    setHopping(true);
    setIndex(index + 1);
    addScore(10);
    setFeedback(index + 1 === tiles.length ? `You built: ${sentence}` : `${word} fits next. Keep the sentence in order.`);
    if (attempts.current) recordAssistedRetry({ game: "word-hopscotch", round: `${round}:${index}`, target: word, attempts: attempts.current, supportUsed: ["printed_sentence_model", "sentence_order_feedback"] });
    attempts.current = 0;
    if (index + 1 === tiles.length) {
      setCorrect(correct + 1);
      onDiscover({ id: `sentence-${round}`, sentence });
      holdResult(() => advance(correct + 1), LEARNING_PACE.sentence, () => isSoundEnabled ? speak(sentence) : undefined);
    } else schedule(() => { locked.current = false; setHopping(false); }, 350);
  }
  useStageSnapshot(() => ({ index, feedback, attempts: attempts.current }), onSnapshot);
  useResumeTransition(resume?.index === tiles.length, () => advance(correct), schedule, LEARNING_PACE.sentence);
  useEffect(() => {
    if (!paused && !hopping && returnFocus.current) {
      returnFocus.current = false;
      choicesRef.current?.querySelector("button:not(:disabled)")?.focus({ preventScroll: true });
    }
  }, [hopping, paused]);
  const land = difficulty === "hard" ? "moonwood" : difficulty === "medium" ? "dino" : "meadow";
  const reached = tiles.slice(Math.max(0, index - 4), index);
  return <section className={`psw-game psw-hop psw-land-${land}${paused ? " is-paused" : ""}`} data-phonics-mode="sentence" data-hop-index={index} aria-label="Word Hopscotch sentence trail">
    <header className="psw-hud">
      <div><strong>Hop to build the sentence</strong><span>{isSoundEnabled && !hasRecordedSpeech(sentence) ? "Read the printed sentence. Tap the next word." : unavailable ? "Read the sentence, or tap Hear to try its voice again." : "Tap the word that comes next."}</span></div>
      <span className="psw-progress">Sentence {round + 1}/{state.sentences.length}</span>
      <button type="button" className="psw-replay" aria-label="Hear the sentence" disabled={!canHear || paused} onClick={() => ownReplay(replay())}>♪<span>Hear</span></button>
    </header>
    <div className="psw-hop-clearing">
      <div className="psw-sentence-model"><small>Build this sentence</small><p>{sentence}</p></div>
      <div className="psw-hop-trail" aria-label="Your sentence so far">
        <div className="psw-trail-line" aria-hidden="true" />
        <span className="psw-start-stone">Start{index === 0 && <PlayHero difficulty={difficulty} className="psw-hop-hero" />}</span>
        {reached.map(tile => <span className="psw-reached-stone" data-word={tile.word} data-word-index={tile.index} key={tile.id}><small>{tile.index + 1}</small>{tile.word}<span className="psw-stone-tick" aria-label="Reached">✓</span>{tile.index === index - 1 && <PlayHero difficulty={difficulty} className={`psw-hop-hero${hopping ? " is-hopping" : ""}`} />}</span>)}
        <span className="psw-next-stone" aria-label={index === tiles.length ? "Sentence complete" : `Next word ${index + 1} of ${tiles.length}`}>{index === tiles.length ? "✓" : "?"}</span>
      </div>
      <div className="psw-hop-choice-group" role="group" aria-label="Choose the next word">
        <p>{index === tiles.length ? "Sentence complete!" : `Hop ${index + 1} of ${tiles.length} · Choose the next word`}</p>
        <div className="psw-hop-choices" ref={choicesRef}>{options.map(word => <button type="button" key={`${index}:${word}`} className={`psw-word-stone${word === wrong ? " is-wrong" : ""}`} disabled={paused || hopping || index === tiles.length} aria-label={`Hop to ${word}`} onClick={() => choose(word)}>{word}</button>)}</div>
      </div>
    </div>
    <footer className="psw-feedback" role="status" data-feedback-kind={wrong ? "retry" : "guide"}>{feedback}</footer>
  </section>;
}

export default function WordHopscotch(props) {
  return <ArcadePracticeGame {...props} title="Word Hopscotch" mode="sentence" stageComponents={{ sentence: HopscotchStage }} roundBuilders={{ sentence: buildRecordedHopOuting }} />;
}

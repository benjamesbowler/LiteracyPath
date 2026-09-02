import { useMemo, useState } from "react";
import {
  addHeartGrapheme,
  choosePatternTransfer,
  choosePhraseBoundary,
  completePhraseEcho,
  completePhraseModel,
  createHeartWordState,
  createPatternSortState,
  createPhraseFlowState,
  createWordChainState,
  heartSlotLabel,
  hideHeartWord,
  placePatternTile,
  removeHeartGrapheme,
  repairHeartWord,
  replaceChainGrapheme,
  revealHeartAttempt,
  selectChainPosition,
  selectPatternTile,
  wordChainPositionLabel
} from "./fluencyMechanicState.js";

function applyTransition(setState, transition, onCommit) {
  setState(transition.state);
  if (transition.outcome) onCommit?.(transition.outcome);
}

function patternNeedle(round) {
  if (round.targetGrapheme) return round.targetGrapheme;
  const match = String(round.patternLabel || "").match(
    /(?:start with|has|have|end with)\s+-?([a-z]+)$/i
  );
  return match?.[1] || "";
}

function MarkedWord({ word, round }) {
  const needle = patternNeedle(round);
  const index = String(word).toLowerCase().indexOf(needle.toLowerCase());
  if (!needle || index < 0) return <>{word}</>;
  return (
    <>
      {word.slice(0, index)}
      <mark>{word.slice(index, index + needle.length)}</mark>
      {word.slice(index + needle.length)}
    </>
  );
}

export function PatternSortMechanic({
  round,
  disabled = false,
  supportLevel = 0,
  onCommit,
  reducedMotion = false
}) {
  const [state, setState] = useState(() => createPatternSortState(round));
  const activeItem = round.items[state.activeIndex];
  const visiblePlacements = state.transferPlacement
    ? [...state.placements, state.transferPlacement]
    : state.placements;

  function selectTile() {
    applyTransition(setState, selectPatternTile(state, round), onCommit);
  }

  function placeTile(binId) {
    applyTransition(
      setState,
      placePatternTile(state, round, binId, supportLevel),
      onCommit
    );
  }

  function transfer(binId) {
    applyTransition(
      setState,
      choosePatternTransfer(state, round, binId, supportLevel),
      onCommit
    );
  }

  return (
    <div
      className="sbq-fluency-mechanic sbq-pattern-sort"
      data-mechanic-stage="pattern-sort"
      data-reduced-motion={reducedMotion ? "true" : "false"}
    >
      <p className="sbq-mechanic-status" role="status" aria-live="polite">
        {state.feedback}
      </p>
      <div className="sbq-pattern-bins" aria-label="Pattern bins">
        {round.bins.map(bin => (
          <section className="sbq-pattern-bin" key={bin.id} aria-labelledby={"pattern-bin-" + bin.id}>
            <h3 id={"pattern-bin-" + bin.id}>{bin.label}</h3>
            <ul aria-label={"Words that " + bin.label}>
              {visiblePlacements
                .filter(placement => placement.binId === bin.id)
                .map(placement => (
                  <li key={placement.word}>
                    <MarkedWord word={placement.word} round={round} />
                  </li>
                ))}
            </ul>
            {state.stage === "sort" && (
              <button
                type="button"
                disabled={disabled || !state.tileSelected}
                onClick={() => placeTile(bin.id)}
              >
                Put word in {bin.label}
              </button>
            )}
          </section>
        ))}
      </div>
      {state.stage === "sort" && activeItem && (
        <button
          className="sbq-pattern-active-tile"
          type="button"
          aria-pressed={state.tileSelected}
          disabled={disabled}
          onClick={selectTile}
        >
          {activeItem.word}
        </button>
      )}
      {state.stage === "transfer" && (
        <div className="sbq-pattern-transfer" role="group" aria-label="Transfer the pattern to a new word">
          <p>
            Put the new word <strong>{round.transferWord}</strong> in its bin.
          </p>
          {round.bins.map(bin => (
            <button
              key={bin.id}
              type="button"
              disabled={disabled}
              onClick={() => transfer(bin.id)}
            >
              {bin.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function WordChainMechanic({
  round,
  disabled = false,
  supportLevel = 0,
  onCommit,
  reducedMotion = false
}) {
  const [state, setState] = useState(() => createWordChainState(round));

  function selectPosition(index) {
    applyTransition(
      setState,
      selectChainPosition(state, round, index, supportLevel),
      onCommit
    );
  }

  function replaceGrapheme(grapheme) {
    applyTransition(
      setState,
      replaceChainGrapheme(state, round, grapheme, supportLevel),
      onCommit
    );
  }

  return (
    <div
      className="sbq-fluency-mechanic sbq-word-chain"
      data-mechanic-stage="word-chain"
      data-reduced-motion={reducedMotion ? "true" : "false"}
    >
      <p className="sbq-mechanic-status" role="status" aria-live="polite">
        {state.feedback}
      </p>
      <ol className="sbq-visible-word-chain" aria-label="Completed word chain">
        {state.chain.map((word, index) => <li key={word + "-" + index}>{word}</li>)}
      </ol>
      <div className="sbq-chain-graphemes" role="group" aria-label="Choose the changing grapheme position">
        {state.currentGraphemes.map((grapheme, index) => (
          <button
            className={state.selectedIndex === index ? "selected" : ""}
            key={index}
            type="button"
            aria-pressed={state.selectedIndex === index}
            disabled={disabled || state.stage !== "position"}
            onClick={() => selectPosition(index)}
          >
            <span aria-hidden="true">{grapheme}</span>
            <span className="sbq-sr-only">{wordChainPositionLabel(grapheme, index)}</span>
          </button>
        ))}
      </div>
      {state.stage === "replacement" && (
        <div className="sbq-chain-replacements" role="group" aria-label="Replacement graphemes">
          {round.choices.map(grapheme => (
            <button
              key={grapheme}
              type="button"
              disabled={disabled}
              onClick={() => replaceGrapheme(grapheme)}
            >
              {grapheme}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function PhraseFlowMechanic({
  round,
  disabled = false,
  supportLevel = 0,
  onCommit,
  onRequestReplay,
  reducedMotion = false
}) {
  const [state, setState] = useState(() => createPhraseFlowState(round));
  const [modelPlayback, setModelPlayback] = useState("idle");
  const boundaryChoices = round.boundaryChoices || [];

  function chooseBoundary(boundary) {
    applyTransition(
      setState,
      choosePhraseBoundary(state, round, boundary, supportLevel),
      onCommit
    );
  }

  function completeModel() {
    applyTransition(setState, completePhraseModel(state), onCommit);
  }

  function followModel() {
    if (state.stage !== "model" || modelPlayback === "playing") return;
    if (!onRequestReplay) {
      setModelPlayback("unavailable");
      return;
    }
    setModelPlayback("playing");
    onRequestReplay({
      onEnded: () => {
        setModelPlayback("complete");
        completeModel();
      },
      onUnavailable: () => setModelPlayback("unavailable")
    });
  }

  function finishEcho() {
    applyTransition(
      setState,
      completePhraseEcho(state, round, supportLevel),
      onCommit
    );
  }

  return (
    <div
      className="sbq-fluency-mechanic sbq-phrase-flow"
      data-mechanic-stage="phrase-flow"
      data-reduced-motion={reducedMotion ? "true" : "false"}
    >
      <p className="sbq-mechanic-status" role="status" aria-live="polite">
        {state.feedback}
      </p>
      <p className="sbq-phrase-trail" aria-label="Continuous poetry word trail">
        {(round.displayTrailWords || round.trailWords).map((word, index) => (
          <span className="sbq-phrase-word" key={word + "-" + index}>
            {index > 0 ? " " : ""}{word}
          </span>
        ))}
      </p>
      {state.stage === "boundary" && (
        <div className="sbq-phrase-boundaries" role="group" aria-label="Choose where the first poetry line ends">
          {boundaryChoices.map(choice => (
            <button
              key={choice.position}
              type="button"
              aria-pressed={state.chosenBoundary === choice.position}
              disabled={disabled}
              onClick={() => chooseBoundary(choice.position)}
            >
              {choice.label || `Pause after “${choice.afterWord}”`}
            </button>
          ))}
        </div>
      )}
      {state.stage === "model" && (
        <div className="sbq-phrase-model" data-model-playback={modelPlayback}>
          <div aria-label="Visible phrase model">
            {(round.phraseChunks || []).map((chunk, index) => (
              <p key={`${chunk}-${index}`}>{chunk}</p>
            ))}
          </div>
          {modelPlayback === "unavailable" ? (
            <button type="button" disabled={disabled} onClick={completeModel}>
              I followed the visible model
            </button>
          ) : (
            <button
              type="button"
              disabled={disabled || modelPlayback === "playing"}
              onClick={followModel}
            >
              {modelPlayback === "playing" ? "Phrase model playing…" : "Play and follow the phrase model"}
            </button>
          )}
        </div>
      )}
      {state.stage === "echo" && (
        <button type="button" disabled={disabled} onClick={finishEcho}>
          I echo-read the phrase
        </button>
      )}
    </div>
  );
}

function stableHash(value) {
  let hash = 2166136261;
  for (const character of String(value || "")) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function heartWordBank(round) {
  const tiles = round.graphemes.map((grapheme, index) => ({ grapheme, id: index }));
  let seed = stableHash(round.roundKey || `${round.word}:${round.graphemes.join("|")}`);
  for (let index = tiles.length - 1; index > 0; index -= 1) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const swapIndex = seed % (index + 1);
    [tiles[index], tiles[swapIndex]] = [tiles[swapIndex], tiles[index]];
  }
  return tiles;
}

export function HeartWordMechanic({
  round,
  disabled = false,
  supportLevel = 0,
  onCommit,
  reducedMotion = false
}) {
  const [state, setState] = useState(() => createHeartWordState(round));
  const [chosenTileIds, setChosenTileIds] = useState([]);
  const bank = useMemo(() => heartWordBank(round), [round]);
  const attemptFull = state.attempt.length === round.graphemes.length;

  function hideModel() {
    applyTransition(setState, hideHeartWord(state), onCommit);
  }

  function chooseTile(tile) {
    if (state.phase === "spell" && chosenTileIds.includes(tile.id)) return;
    const transition = state.phase === "repair"
      ? repairHeartWord(state, round, tile.grapheme, supportLevel)
      : addHeartGrapheme(state, round, tile.grapheme);
    if (state.phase === "spell" && transition.state.attempt.length > state.attempt.length) {
      setChosenTileIds(current => [...current, tile.id]);
    }
    applyTransition(setState, transition, onCommit);
  }

  function removeLast() {
    const transition = removeHeartGrapheme(state);
    if (transition.state.attempt.length < state.attempt.length) {
      setChosenTileIds(current => current.slice(0, -1));
    }
    applyTransition(setState, transition, onCommit);
  }

  function revealAttempt() {
    applyTransition(
      setState,
      revealHeartAttempt(state, round, supportLevel),
      onCommit
    );
  }

  return (
    <div
      className="sbq-fluency-mechanic sbq-heart-word"
      data-mechanic-stage="heart-word-studio"
      data-reduced-motion={reducedMotion ? "true" : "false"}
      data-phase={state.phase}
    >
      <p className="sbq-mechanic-status" role="status" aria-live="polite">
        {state.feedback}
      </p>
      {state.modelVisible && (
        <div className="sbq-heart-model" aria-label="Heart word model">
          {round.graphemes.map((grapheme, index) => (
            <span key={grapheme + "-" + index}>{grapheme}</span>
          ))}
        </div>
      )}
      {state.phase === "study" && (
        <button type="button" disabled={disabled} onClick={hideModel}>
          Hide the word and spell it
        </button>
      )}
      {state.phase !== "study" && (
        <>
          <div className="sbq-heart-slots" aria-label="Your grapheme spelling">
            {round.graphemes.map((grapheme, index) => {
              const isDifference = state.phase === "repair" && state.differingIndex === index;
              const shown = state.attempt[index]
                || (isDifference ? state.revealedDifference?.expected : "");
              return (
                <span
                  className={isDifference ? "is-first-difference" : ""}
                  key={index}
                >
                  <span aria-hidden="true">{shown || "\u00a0"}</span>
                  <span className="sbq-sr-only">{heartSlotLabel(shown, index, isDifference)}</span>
                </span>
              );
            })}
          </div>
          {state.phase === "repair" && state.revealedDifference && (
            <p className="sbq-heart-repair-note">
              You chose {state.revealedDifference.actual}. Repair this spot with {state.revealedDifference.expected}.
            </p>
          )}
          {(state.phase === "spell" || state.phase === "repair") && (
            <div className="sbq-heart-bank" role="group" aria-label="Grapheme choices">
              {bank.map(tile => (
                <button
                  key={tile.id}
                  type="button"
                  data-heart-tile-id={tile.id}
                  disabled={disabled || (state.phase === "spell" && (attemptFull || chosenTileIds.includes(tile.id)))}
                  onClick={() => chooseTile(tile)}
                >
                  {tile.grapheme}
                </button>
              ))}
            </div>
          )}
          {state.phase === "spell" && (
            <div className="sbq-heart-actions">
              <button
                type="button"
                disabled={disabled || state.attempt.length === 0}
                onClick={removeLast}
              >
                Remove last grapheme
              </button>
              <button
                type="button"
                disabled={disabled || !attemptFull}
                onClick={revealAttempt}
              >
                Reveal and check
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

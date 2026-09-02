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
  hideHeartWord,
  placePatternTile,
  removeHeartGrapheme,
  repairHeartWord,
  replaceChainGrapheme,
  revealHeartAttempt,
  revealNextPhraseChunk,
  selectChainPosition,
  selectPatternTile
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
  onRequestReplay,
  reducedMotion = false
}) {
  const [state, setState] = useState(() => createPatternSortState(round));
  const activeItem = round.items[state.activeIndex];

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
              {state.placements
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
          <MarkedWord word={activeItem.word} round={round} />
        </button>
      )}
      {state.stage === "transfer" && (
        <div className="sbq-pattern-transfer" role="group" aria-label="Transfer the pattern to a new word">
          <p>
            Put the new word <strong><MarkedWord word={round.transferWord} round={round} /></strong> in its bin.
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
      <button
        className="sbq-ghost-button"
        type="button"
        disabled={disabled || !onRequestReplay}
        onClick={onRequestReplay}
      >
        Hear the instruction again
      </button>
    </div>
  );
}

export function WordChainMechanic({
  round,
  disabled = false,
  supportLevel = 0,
  onCommit,
  onRequestReplay,
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
            <span className="sr-only">Position {index + 1}: </span>
            {grapheme}
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
      <button
        className="sbq-ghost-button"
        type="button"
        disabled={disabled || !onRequestReplay}
        onClick={onRequestReplay}
      >
        Hear the next word again
      </button>
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
  const boundaryChoices = Array.from(
    { length: Math.max(0, round.phraseChunks.length - 1) },
    (_, index) => index + 1
  );

  function revealNext() {
    applyTransition(setState, revealNextPhraseChunk(state, round), onCommit);
  }

  function chooseBoundary(boundary) {
    applyTransition(
      setState,
      choosePhraseBoundary(state, round, boundary, supportLevel),
      onCommit
    );
  }

  function followModel() {
    onRequestReplay?.();
    applyTransition(setState, completePhraseModel(state), onCommit);
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
      <div className="sbq-phrase-trail" aria-label="Phrase trail">
        {round.phraseChunks.slice(0, state.revealedCount).map((chunk, index) => (
          <span className="sbq-phrase-chunk" key={chunk + "-" + index}>
            {chunk}
          </span>
        ))}
      </div>
      {state.stage === "reveal" && (
        <button type="button" disabled={disabled} onClick={revealNext}>
          Reveal the next phrase chunk
        </button>
      )}
      {state.stage === "boundary" && (
        <div className="sbq-phrase-boundaries" role="group" aria-label="Choose the natural phrase boundary">
          {boundaryChoices.map(boundary => (
            <button
              key={boundary}
              type="button"
              aria-pressed={state.chosenBoundary === boundary}
              disabled={disabled}
              onClick={() => chooseBoundary(boundary)}
            >
              Pause after chunk {boundary}
            </button>
          ))}
        </div>
      )}
      {state.stage === "model" && (
        <button
          type="button"
          disabled={disabled || !onRequestReplay}
          onClick={followModel}
        >
          Follow the phrase model
        </button>
      )}
      {state.stage === "echo" && (
        <button type="button" disabled={disabled} onClick={finishEcho}>
          I echo-read the phrase
        </button>
      )}
    </div>
  );
}

function heartWordBank(round) {
  return round.graphemes
    .map((grapheme, index) => ({ grapheme, id: index }))
    .reverse();
}

export function HeartWordMechanic({
  round,
  disabled = false,
  supportLevel = 0,
  onCommit,
  onRequestReplay,
  reducedMotion = false
}) {
  const [state, setState] = useState(() => createHeartWordState(round));
  const bank = useMemo(() => heartWordBank(round), [round]);
  const attemptFull = state.attempt.length === round.graphemes.length;

  function hideModel() {
    applyTransition(setState, hideHeartWord(state), onCommit);
  }

  function chooseGrapheme(grapheme) {
    const transition = state.phase === "repair"
      ? repairHeartWord(state, round, grapheme, supportLevel)
      : addHeartGrapheme(state, round, grapheme);
    applyTransition(setState, transition, onCommit);
  }

  function removeLast() {
    applyTransition(setState, removeHeartGrapheme(state), onCommit);
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
                  aria-label={isDifference ? "First differing position " + (index + 1) : "Position " + (index + 1)}
                >
                  {shown || "\u00a0"}
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
                  disabled={disabled || (state.phase === "spell" && attemptFull)}
                  onClick={() => chooseGrapheme(tile.grapheme)}
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
      <button
        className="sbq-ghost-button"
        type="button"
        disabled={disabled || !onRequestReplay}
        onClick={onRequestReplay}
      >
        Hear the heart word again
      </button>
    </div>
  );
}

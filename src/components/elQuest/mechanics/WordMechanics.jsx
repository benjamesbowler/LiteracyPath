import { useEffect, useReducer, useRef } from "react";
import {
  buildSoundBoxesOutcome,
  buildWordMachineOutcome,
  buildWordWindowOutcome,
  commitSoundBoxPlacement,
  createSoundBoxesState,
  createWordMachineState,
  createWordWindowState,
  machinePiecesForRound,
  reduceSoundBoxes,
  reduceWordMachine,
  reduceWordWindow,
  soundBoxesStateForRound,
  wordMachineStateForRound,
  wordWindowStateForRound
} from "./wordMechanicState.js";
import { ChildWordText } from "../../shared/ChildWordText.jsx";

const noop = () => {};
const CONTROL_CLASS = "adventure-mechanic-control adventure-mechanic-control--56";
const WORD_WINDOW_STUDY_SECONDS = 5;

// Counts a study window down from `seconds` to 0, then fires onComplete.
// Cleans itself up on unmount or when `active` goes false.
function useStudyCountdown(active, seconds, onComplete) {
  const [remaining, dispatch] = useReducer((state, action) => {
    if (action.type === "reset") return action.seconds;
    return Math.max(0, state - 1);
  }, seconds);
  const onCompleteRef = useRef(onComplete);
  const intervalRef = useRef(null);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    dispatch({ type: "reset", seconds });
    clearInterval(intervalRef.current);
    if (!active) {
      return undefined;
    }
    intervalRef.current = setInterval(() => {
      dispatch({ type: "tick" });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [active, seconds]);

  useEffect(() => {
    if (!active || remaining !== 0) return;
    clearInterval(intervalRef.current);
    onCompleteRef.current?.();
  }, [active, remaining]);

  return remaining;
}

function LiveStatus({ children }) {
  return (
    <p className="adventure-mechanic-status" role="status" aria-live="polite">
      {children}
    </p>
  );
}

function DifferenceSequence({ difference, kind }) {
  const changed = kind === "selected"
    ? difference.selectedDifference
    : difference.targetDifference;
  return (
    <span className={`adventure-word-window__difference adventure-word-window__difference--${kind}`}>
      <span>{difference.prefix}</span>
      <mark data-difference={kind} data-empty={changed ? "false" : "true"}>
        {changed || "—"}
      </mark>
      <span>{difference.suffix}</span>
    </span>
  );
}

export function WordWindowMechanic({
  round,
  disabled = false,
  supportLevel = 0,
  onCommit = noop,
  reducedMotion = false
}) {
  const [storedState, dispatch] = useReducer(
    (current, action) => reduceWordWindow(current, { supportLevel, ...action }, round),
    null,
    () => createWordWindowState(round, supportLevel)
  );
  const state = wordWindowStateForRound(storedState, round, supportLevel);
  const locked = disabled || ["committed", "revealed"].includes(state.phase);
  const revealedOutcome = buildWordWindowOutcome(round, state);

  // The study window closes itself after a 5-4-3-2-1 countdown instead of
  // waiting on a "Close study window" press - one fewer purposeless tap.
  const countdown = useStudyCountdown(
    !disabled && state.phase === "study",
    WORD_WINDOW_STUDY_SECONDS,
    () => dispatch({ type: "CLOSE" })
  );

  // A tap both selects the word and reveals/compares it in one action, so a
  // child never has to press "Reveal and compare" separately afterward.
  const choose = value => {
    if (locked || state.phase !== "choose") return;
    const selected = reduceWordWindow(state, { type: "SELECT", value }, round);
    if (selected === state) return;
    const revealed = reduceWordWindow(selected, { type: "REVEAL" }, round);
    dispatch({ type: "SELECT", value });
    dispatch({ type: "REVEAL" });
    const outcome = buildWordWindowOutcome(round, revealed);
    if (outcome) onCommit(outcome);
  };

  return (
    <section
      className="adventure-word-window"
      data-mechanic-stage="word-window"
      data-window-phase={state.phase}
      data-round-key={round.roundKey}
      data-reduced-motion={reducedMotion ? "true" : "false"}
    >
      <div
        className="adventure-word-window__shutter"
        role="group"
        aria-label="Word study window"
        aria-live="polite"
      >
        {state.phase === "study" && (
          <>
            <strong className="adventure-word-window__study-word">
              <ChildWordText word={round.studyWord} />
            </strong>
            <span className="adventure-word-window__countdown" aria-hidden="true">{countdown}</span>
            <span className="kg-visually-hidden" role="status" aria-live="polite">
              Choosing from memory in {countdown}.
            </span>
          </>
        )}
        {state.phase === "choose" && (
          <span className="adventure-word-window__closed">Study window closed</span>
        )}
        {["committed", "revealed"].includes(state.phase) && (
          <span className="adventure-word-window__committed">
            Choice locked: <ChildWordText word={state.selected} />
          </span>
        )}
        {state.phase === "revealed" && state.difference && (
          <div
            className="adventure-word-window__comparison"
            data-word-reveal="true"
            role="group"
            aria-label="Compare your choice with the study word"
          >
            <span>Your choice</span>
            <DifferenceSequence difference={state.difference} kind="selected" />
            <span>Study word</span>
            <DifferenceSequence difference={state.difference} kind="target" />
          </div>
        )}
      </div>

      {state.phase !== "study" && (
        <div className="adventure-word-window__choices" role="group" aria-label="Whole-word choices">
          {(round.choices || []).map((choice, index) => (
            <button
              type="button"
              className={CONTROL_CLASS}
              data-target-size="56"
              data-word-choice={choice}
              key={`${choice}-${index}`}
              disabled={disabled || state.phase !== "choose"}
              aria-pressed={state.selected === choice}
              onClick={() => choose(choice)}
            >
              <ChildWordText word={choice} />
            </button>
          ))}
        </div>
      )}

      <div className="adventure-word-window__controls">
        {state.phase === "revealed" && revealedOutcome?.correct === false && (
          <button
            type="button"
            className={CONTROL_CLASS}
            data-action="retry-word-window"
            data-target-size="56"
            disabled={disabled}
            onClick={() => dispatch({ type: "RETRY" })}
          >
            Try the word again
          </button>
        )}
      </div>
      <LiveStatus>{state.status}</LiveStatus>
    </section>
  );
}

export function SoundBoxesMechanic({
  round,
  disabled = false,
  supportLevel = 0,
  onCommit = noop,
  reducedMotion = false
}) {
  const [storedState, dispatch] = useReducer(
    (current, action) => reduceSoundBoxes(current, { supportLevel, ...action }, round),
    null,
    () => createSoundBoxesState(round, supportLevel)
  );
  const state = soundBoxesStateForRound(storedState, round, supportLevel);
  const locked = disabled || state.committed;
  const ready = state.slots.length > 0 && state.slots.every(Boolean);

  const check = () => {
    if (locked || !ready) return;
    const next = reduceSoundBoxes(state, { type: "CHECK" }, round);
    dispatch({ type: "CHECK" });
    const outcome = buildSoundBoxesOutcome(round, next);
    if (outcome) onCommit(outcome);
  };

  const place = tileId => {
    if (locked) return;
    const next = commitSoundBoxPlacement(state, tileId, round, onCommit);
    if (next === state) return;
    dispatch({ type: "PLACE_TILE", tileId });
  };

  return (
    <section
      className="adventure-sound-boxes"
      data-mechanic-stage="sound-boxes"
      data-round-key={round.roundKey}
      data-reduced-motion={reducedMotion ? "true" : "false"}
    >
      <div className="adventure-sound-boxes__slots" role="group" aria-label={`${state.slots.length} sound boxes`}>
        {state.slots.map((slot, index) => (
          <div
            className="adventure-sound-boxes__slot"
            data-sound-box={index + 1}
            key={`sound-box-${index + 1}`}
          >
            {slot ? (
              <button
                type="button"
                className={CONTROL_CLASS}
                data-action="remove-grapheme"
                data-target-size="56"
                disabled={locked}
                aria-label={`Remove ${slot.grapheme} from sound box ${index + 1}`}
                onClick={() => dispatch({ type: "REMOVE_SLOT", slotIndex: index })}
              >
                {slot.grapheme}
              </button>
            ) : (
              <span aria-label={`Empty sound box ${index + 1}`}>{index + 1}</span>
            )}
          </div>
        ))}
      </div>

      <div className="adventure-sound-boxes__tile-bank" role="group" aria-label="Reusable grapheme tile bank">
        {state.tiles.map(tile => {
          const used = state.usedTileIds.includes(tile.id);
          return (
            <button
              type="button"
              className={CONTROL_CLASS}
              data-target-size="56"
              data-tile-id={tile.id}
              data-grapheme={tile.grapheme}
              key={tile.id}
              disabled={locked || ready || used}
              aria-label={`Place grapheme ${tile.grapheme}`}
              onClick={() => place(tile.id)}
            >
              {tile.grapheme}
            </button>
          );
        })}
      </div>

      <div className="adventure-sound-boxes__controls">
        <button
          type="button"
          className={CONTROL_CLASS}
          data-action="blend-check"
          data-target-size="56"
          disabled={locked || !ready}
          onClick={check}
        >
          Blend and check
        </button>
      </div>
      <LiveStatus>{state.status}</LiveStatus>
    </section>
  );
}

function machineTrayName(operation) {
  if (operation === "substituteOnset") return "swap-onset";
  if (operation === "removeOnset") return "remove-onset";
  if (operation === "joinCompound") return "join-compound";
  return "unavailable";
}

function machineActionLabel(operation) {
  if (operation === "substituteOnset") return "Run onset swap";
  if (operation === "removeOnset") return "Remove onset";
  if (operation === "joinCompound") return "Join word parts";
  return "Run word machine";
}

export function WordMachineMechanic({
  round,
  disabled = false,
  supportLevel = 0,
  onCommit = noop,
  reducedMotion = false
}) {
  const pieces = machinePiecesForRound(round);
  const [storedState, dispatch] = useReducer(
    (current, action) => reduceWordMachine(current, { supportLevel, ...action }, round),
    null,
    () => createWordMachineState(round, supportLevel)
  );
  const state = wordMachineStateForRound(storedState, round, supportLevel);
  const locked = disabled || state.committed;
  const compoundTargetCount = pieces.filter(piece => Number.isInteger(piece.semanticIndex)).length;
  const ready = round.operation === "joinCompound"
    ? state.selectedPieceIds.length === compoundTargetCount && compoundTargetCount > 0
    : state.selectedPieceIds.length === 1;

  const commit = () => {
    if (locked || !ready) return;
    const next = reduceWordMachine(state, { type: "COMMIT" }, round);
    dispatch({ type: "COMMIT" });
    const outcome = buildWordMachineOutcome(round, next);
    if (outcome) onCommit(outcome);
  };

  return (
    <section
      className="adventure-word-machine"
      data-mechanic-stage="word-machine"
      data-machine-operation={round.operation}
      data-round-key={round.roundKey}
      data-reduced-motion={reducedMotion ? "true" : "false"}
    >
      <div className="adventure-word-machine__before" data-machine-before={round.beforeWord}>
        <span className="adventure-word-machine__label">Before</span>
        <div className="adventure-word-machine__graphemes">
          {(round.beforeGraphemes || []).map((grapheme, index) => (
            <span className="adventure-word-machine__grapheme" key={`before-${grapheme}-${index}`}>
              {grapheme}
            </span>
          ))}
        </div>
      </div>

      <div
        className={`adventure-word-machine__tray adventure-word-machine__tray--${machineTrayName(round.operation)}`}
        data-machine-tray={machineTrayName(round.operation)}
        role="group"
        aria-label={`${machineActionLabel(round.operation)} pieces`}
      >
        {pieces.map(piece => {
          const selected = state.selectedPieceIds.includes(piece.id);
          return (
            <button
              type="button"
              className={CONTROL_CLASS}
              data-target-size="56"
              data-machine-piece={piece.id}
              data-piece-action={piece.action}
              key={piece.id}
              disabled={locked || (
                round.operation === "joinCompound"
                && ready
                && !selected
              )}
              aria-pressed={selected}
              aria-label={`${piece.action} ${piece.label}${round.operation === "removeOnset" ? `, position ${piece.position + 1}` : ""}`}
              data-piece-position={Number.isInteger(piece.position) ? piece.position + 1 : undefined}
              onClick={() => dispatch({ type: "SELECT_PIECE", pieceId: piece.id })}
            >
              {piece.label}
            </button>
          );
        })}
      </div>

      {state.committed && (
        <div
          className={`adventure-word-machine__after${reducedMotion ? "" : " adventure-word-machine__after--transform"}`}
          data-machine-after={state.resultGraphemes.join("")}
        >
          <span className="adventure-word-machine__label">After</span>
          {state.resultGraphemes.map((grapheme, index) => (
            <span className="adventure-word-machine__grapheme" key={`after-${grapheme}-${index}`}>
              {grapheme}
            </span>
          ))}
        </div>
      )}

      <div className="adventure-word-machine__controls">
        <button
          type="button"
          className={CONTROL_CLASS}
          data-action="commit-machine"
          data-target-size="56"
          disabled={locked || !ready}
          onClick={commit}
        >
          {machineActionLabel(round.operation)}
        </button>
        {state.committed && state.correct === false && (
          <button
            type="button"
            className={CONTROL_CLASS}
            data-action="retry-machine"
            data-target-size="56"
            disabled={disabled}
            onClick={() => dispatch({ type: "RETRY" })}
          >
            Try the change again
          </button>
        )}
      </div>
      <LiveStatus>{state.status}</LiveStatus>
    </section>
  );
}

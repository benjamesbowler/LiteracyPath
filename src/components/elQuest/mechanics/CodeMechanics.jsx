import { useState } from "react";
import { SpeakerHigh } from "@phosphor-icons/react";
import {
  commitSceneHunt,
  commitSoundGate,
  createLetterPressState,
  createSceneHuntState,
  createSoundGateState,
  pressLetter,
  resolveScenePicture,
  selectSoundMagnet,
  toggleSceneHuntItem
} from "./codeMechanicState.js";

const CHILD_TARGET_STYLE = Object.freeze({ minWidth: 56, minHeight: 56 });

function useRoundState(round, createState) {
  const [stored, setStored] = useState(() => ({ round, value: createState() }));
  const value = stored.round === round ? stored.value : createState();
  function setValue(update) {
    setStored(previous => {
      const current = previous.round === round ? previous.value : createState();
      return {
        round,
        value: typeof update === "function" ? update(current) : update
      };
    });
  }
  return [value, setValue];
}

export function LetterPressMechanic({
  round,
  disabled,
  supportLevel,
  onCommit,
  reducedMotion
}) {
  const [pressState, setPressState] = useRoundState(round, createLetterPressState);

  function handlePress(choice) {
    if (disabled) return;
    const result = pressLetter(pressState, round, choice, supportLevel);
    setPressState(result.state);
    onCommit?.(result.outcome);
  }

  return (
    <section
      className="am-code-stage am-letter-press"
      data-mechanic-stage="letter-press"
      data-reduced-motion={reducedMotion ? "true" : "false"}
      aria-label="Letter Press"
    >
      <div className="am-letter-press-signs" aria-label="Letter pair signs">
        <div
          className="am-code-sign-slot"
          data-slot-state={pressState.paired ? "paired" : "model"}
        >
          <strong>{round.modelForm}</strong>
          <span>Model</span>
        </div>
        <div
          className="am-code-sign-slot"
          data-slot-state={pressState.paired ? "paired" : pressState.selected ? "mismatch" : "empty"}
          aria-live="polite"
        >
          <strong>{pressState.selected || "?"}</strong>
          <span>{pressState.paired ? "Paired" : pressState.selected ? "Not paired" : "Partner"}</span>
        </div>
      </div>
      <div className="am-letter-press-choices" aria-label="Choose the matching letter">
        {round.choices.map(choice => (
          <button
            key={choice}
            type="button"
            className="am-letter-press-button"
            style={CHILD_TARGET_STYLE}
            disabled={disabled}
            aria-pressed={pressState.selected === choice}
            onClick={() => handlePress(choice)}
          >
            {choice}
          </button>
        ))}
      </div>
    </section>
  );
}

export function SoundGateMechanic({
  round,
  disabled,
  supportLevel,
  onCommit,
  reducedMotion
}) {
  const [gateState, setGateState] = useRoundState(round, createSoundGateState);

  function handleSelect(choice) {
    if (disabled) return;
    setGateState(current => selectSoundMagnet(current, choice));
  }

  function handleGateCommit() {
    if (disabled || !gateState.selected) return;
    const result = commitSoundGate(gateState, round, supportLevel);
    setGateState(result.state);
    onCommit?.(result.outcome);
  }

  return (
    <section
      className="am-code-stage am-sound-gate"
      data-mechanic-stage="sound-gate"
      data-reduced-motion={reducedMotion ? "true" : "false"}
      aria-label="Sound Gate"
    >
      <div className="am-sound-gate-magnets" aria-label="Grapheme magnets">
        {round.choices.map(choice => (
          <button
            key={choice}
            type="button"
            className="am-sound-gate-magnet"
            style={CHILD_TARGET_STYLE}
            disabled={disabled}
            aria-pressed={gateState.selected === choice}
            onClick={() => handleSelect(choice)}
          >
            {choice}
          </button>
        ))}
      </div>
      <div
        className="am-sound-gate-slot"
        data-gate-state={gateState.gateOpen ? "open" : gateState.selected ? "loaded" : "waiting"}
        aria-live="polite"
      >
        <strong>{gateState.selected || "?"}</strong>
        <span>{gateState.gateOpen ? "Gate open" : gateState.selected ? "Magnet ready" : "Choose a magnet"}</span>
      </div>
      <button
        type="button"
        className="am-sound-gate-commit"
        style={CHILD_TARGET_STYLE}
        disabled={disabled || !gateState.selected}
        onClick={handleGateCommit}
      >
        Open sound gate
      </button>
    </section>
  );
}

export function SceneHuntMechanic({
  round,
  disabled,
  supportLevel,
  onCommit,
  onRequestObjectAudio,
  reducedMotion
}) {
  const [huntState, setHuntState] = useRoundState(round, createSceneHuntState);
  const matchingObjects = (round.objects || []).filter(object => object.matches === true);
  const singleAnswer = matchingObjects.length === 1;

  function handleObject(object) {
    if (disabled) return;
    if (singleAnswer) {
      const committedState = {
        ...huntState,
        selectedItems: [object.word],
        checked: false,
        complete: false
      };
      const result = commitSceneHunt(committedState, round, supportLevel);
      setHuntState(result.state);
      onCommit?.(result.outcome);
      return;
    }
    setHuntState(current => toggleSceneHuntItem(current, object.word));
  }

  function handleObjectAudio(event, object) {
    event.stopPropagation();
    if (disabled) return;
    onRequestObjectAudio?.(object.word);
  }

  function handleCheck() {
    if (disabled) return;
    const result = commitSceneHunt(huntState, round, supportLevel);
    setHuntState(result.state);
    onCommit?.(result.outcome);
  }

  return (
    <section
      className="am-code-stage am-scene-hunt"
      data-mechanic-stage="scene-hunt"
      data-hunt-state={huntState.complete ? "complete" : huntState.checked ? "checked" : "searching"}
      data-reduced-motion={reducedMotion ? "true" : "false"}
      aria-label="Scene Hunt"
    >
      <div
        className="am-scene-hunt-target"
        aria-label={round.variant === "soundSort"
          ? `Target ending pattern ${round.targetGrapheme}`
          : `Target starting sound ${round.targetGrapheme}`}
      >
        <span>{round.variant === "soundSort" ? "Target ending pattern" : "Target starting sound"}</span>
        <strong>{round.targetGrapheme || "?"}</strong>
      </div>
      <div className="am-scene-hunt-field" aria-label="Picture words">
        {round.objects.map(object => {
          const selected = huntState.selectedItems.includes(object.word);
          const picture = resolveScenePicture(object.word);
          return (
            <div className="am-scene-object-card" key={object.word}>
              <button
                type="button"
                className="am-scene-object"
                style={CHILD_TARGET_STYLE}
                disabled={disabled}
                aria-label={`${selected ? "Remove tag from" : "Tag"} ${object.word}`}
                aria-pressed={selected}
                data-tag-state={selected ? "tagged" : "not-tagged"}
                data-scene-word={object.word}
                onClick={() => handleObject(object)}
              >
                {picture
                  ? <img src={picture} alt="" draggable="false" />
                  : <span className="am-scene-picture-unavailable" aria-hidden="true">?</span>}
                <span className="am-scene-tag-state" aria-hidden="true">
                  {selected ? "Tagged" : "Tap to tag"}
                </span>
                {huntState.labelsVisible
                  ? <span className="am-scene-object-label">{object.word}</span>
                  : null}
              </button>
              <button
                type="button"
                className="am-scene-hear-name"
                style={CHILD_TARGET_STYLE}
                disabled={disabled}
                aria-label={`Hear ${object.word}`}
                onClick={event => handleObjectAudio(event, object)}
              >
                <SpeakerHigh size={20} weight="bold" aria-hidden="true" /> Hear name
              </button>
            </div>
          );
        })}
      </div>
      {!singleAnswer && (
        <div className="am-scene-hunt-actions">
          <button
            type="button"
            style={CHILD_TARGET_STYLE}
            disabled={disabled}
            onClick={handleCheck}
          >
            Check tags
          </button>
        </div>
      )}
    </section>
  );
}

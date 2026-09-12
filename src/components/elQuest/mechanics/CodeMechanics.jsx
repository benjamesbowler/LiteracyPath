import { useState } from "react";
import {
  commitSoundChoice,
  createLetterPressState,
  createSoundChoiceState,
  pressLetter,
  selectSoundChoice,
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
          <span>{round.modelForm === round.modelForm.toUpperCase() ? "Big letter" : "Small letter"}</span>
        </div>
        <div
          className="am-code-sign-slot"
          data-slot-state={pressState.paired ? "paired" : pressState.selected ? "mismatch" : "empty"}
          aria-live="polite"
        >
          <strong>{pressState.selected || "?"}</strong>
          <span>{pressState.paired ? "Paired" : pressState.selected ? "Try again" : "Match"}</span>
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

export function SoundChoiceMechanic({
  round,
  disabled,
  supportLevel,
  onCommit,
  reducedMotion
}) {
  const [soundState, setSoundState] = useRoundState(round, createSoundChoiceState);

  function handleSelect(choice) {
    if (disabled || soundState.committed) return;
    const selected = selectSoundChoice(soundState, choice);
    const result = commitSoundChoice(selected, round, supportLevel);
    setSoundState(result.state);
    onCommit?.({
      ...result.outcome,
      feedback: result.outcome.correct
        ? `${choice} matches the sound.`
        : `${choice} is not the sound. Listen again and choose another tile.`
    });
  }

  return (
    <section
      className="am-code-stage am-sound-choice"
      data-mechanic-stage="sound-choice"
      data-reduced-motion={reducedMotion ? "true" : "false"}
      aria-label="Choose the matching sound"
    >

      <div className="am-sound-choice__tiles" aria-label="Spelling choices">
        {round.choices.map(choice => (
          <button
            key={choice}
            type="button"
            className="am-sound-choice__tile"
            style={CHILD_TARGET_STYLE}
            disabled={disabled || soundState.committed}
            aria-pressed={soundState.selected === choice}
            onClick={() => handleSelect(choice)}
          >
            {choice}
          </button>
        ))}
      </div>
    </section>
  );
}

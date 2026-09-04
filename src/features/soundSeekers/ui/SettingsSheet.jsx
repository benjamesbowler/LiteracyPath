import { ModalSurface } from "./ModalSurface.jsx";

const MOTOR_OPTIONS = Object.freeze([
  Object.freeze({ key: "autoTravel", label: "Move for me", help: "Travel automatically between activities." }),
  Object.freeze({ key: "slowerMovement", label: "Slower movement", help: "Give the seeker more time to move and stop." }),
  Object.freeze({ key: "noDamageTravel", label: "Gentle travel", help: "Travel mistakes never set you back." }),
  Object.freeze({ key: "largerTargets", label: "Larger buttons", help: "Make game controls easier to reach." }),
  Object.freeze({ key: "extendedResponse", label: "Extra response time", help: "Keep activities ready for longer." })
]);

const PRESENTATION_OPTIONS = Object.freeze([
  Object.freeze({ key: "simplifiedScene", label: "Calmer scenes", help: "Show fewer decorative moving details." }),
  Object.freeze({ key: "reducedMotion", label: "Reduce motion", help: "Turn off non-essential animation." }),
  Object.freeze({ key: "highContrast", label: "Higher contrast", help: "Strengthen edges and text contrast." }),
  Object.freeze({ key: "music", label: "Music", help: "Play the world music behind the adventure." }),
  Object.freeze({ key: "soundEnabled", label: "Voices and sounds", help: "Play instructions, words, and game sounds." })
]);

function ToggleGroup({ title, description, options, settings, onChange }) {
  return (
    <fieldset className="ss-settings__group">
      <legend>{title}</legend>
      <p>{description}</p>
      {options.map(option => (
        <label className="ss-settings__toggle" key={option.key}>
          <span>
            <strong>{option.label}</strong>
            <small>{option.help}</small>
          </span>
          <input
            type="checkbox"
            checked={settings[option.key] === true}
            onChange={event => onChange({ ...settings, [option.key]: event.target.checked })}
          />
          <span className="ss-settings__switch" aria-hidden="true" />
        </label>
      ))}
    </fieldset>
  );
}

export function SettingsSheet({ settings, onChange, onClose }) {
  if (!settings || typeof settings !== "object" || typeof onChange !== "function"
    || typeof onClose !== "function") {
    throw new TypeError("Sound Seekers settings need a current value, change action, and close action");
  }
  return (
    <ModalSurface className="ss-sheet ss-settings" labelledBy="ss-settings-title" onClose={onClose}>
      <header className="ss-sheet__header">
        <div>
          <p className="ss-eyebrow">Play your way</p>
          <h1 id="ss-settings-title">Game settings</h1>
        </div>
        <button type="button" className="ss-icon-button" aria-label="Close game settings" data-ss-modal-initial-focus="" onClick={onClose}>×</button>
      </header>
      <p className="ss-settings__promise">These options change movement and presentation—not the reading target or what counts as learning.</p>
      <div className="ss-settings__columns">
        <ToggleGroup
          title="Movement help"
          description="Choose the controls that make play comfortable."
          options={MOTOR_OPTIONS}
          settings={settings}
          onChange={onChange}
        />
        <ToggleGroup
          title="Look and sound"
          description="Choose how busy, bright, and musical the worlds feel."
          options={PRESENTATION_OPTIONS}
          settings={settings}
          onChange={onChange}
        />
      </div>
      <button className="ss-primary-button ss-sheet__done" type="button" onClick={onClose}>Save and return</button>
    </ModalSurface>
  );
}

export default SettingsSheet;

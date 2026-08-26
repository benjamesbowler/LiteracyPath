export function SoundToggle({ enabled, onToggle, showLabel = false }) {
  const stateLabel = enabled ? "on" : "off";
  return (
    <button
      type="button"
      className={`lg-sound-toggle ${showLabel ? "lg-audio-toggle-labelled" : ""} ${enabled ? "enabled" : ""}`.trim()}
      onClick={onToggle}
      aria-label={enabled ? "Turn spoken audio and game sounds off" : "Turn spoken audio and game sounds on"}
      aria-pressed={enabled}
      title={`Spoken audio and game sounds ${stateLabel}`}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
        <path d="M4 9v6h4l5 4V5L8 9H4Z" />
        {enabled ? <path d="M16 8c1.4 1.1 2 2.4 2 4s-.6 2.9-2 4" /> : <path d="m17 9 4 6m0-6-4 6" />}
      </svg>
      {showLabel && <span>Voice &amp; sounds {stateLabel}</span>}
    </button>
  );
}

export default SoundToggle;

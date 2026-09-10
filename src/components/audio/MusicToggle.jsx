export function MusicToggle({ enabled, onToggle, className = "", showLabel = false }) {
  const stateLabel = enabled ? "on" : "off";
  return (
    <button
      type="button"
      className={`lp-music-toggle ${className} ${enabled ? "enabled" : ""}`.trim()}
      onClick={onToggle}
      aria-label={enabled ? "Turn music off; spoken audio stays on" : "Turn music on"}
      aria-pressed={enabled}
      title={`Music ${stateLabel}`}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
        <path d="M9 18V6l10-2v12" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="16" cy="16" r="3" />
        {!enabled && <path d="M3 3l18 18" />}
      </svg>
      {showLabel && <span>Music {stateLabel}</span>}
    </button>
  );
}

export default MusicToggle;

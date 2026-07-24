const LOADING_TIPS = Object.freeze([
  "Sound it out, then say it smoothly.",
  "Tricky words are just words you have not met yet.",
  "Five minutes of reading a day grows a mighty brain.",
  "Reading out loud to a pet still counts as reading out loud."
]);

const LOADING_TIP_INDEX = Math.floor(Date.now() / 20000) % LOADING_TIPS.length;

export function RouteLoadingFallback({ label = "Loading your next activity..." }) {
  const tip = LOADING_TIPS[LOADING_TIP_INDEX];

  return (
    <div
      className="lazy-page-fallback"
      role="status"
      aria-live="polite"
      data-route-loading=""
      data-loading-label={label}
    >
      <div className="lazy-page-fallback-card">
        <div className="lazy-letter-row" aria-hidden="true">
          <span className="lazy-letter">a</span>
          <span className="lazy-letter">b</span>
          <span className="lazy-letter">c</span>
        </div>
        <strong>{label}</strong>
        <p className="lazy-page-tip">{tip}</p>
      </div>
    </div>
  );
}

export { LOADING_TIPS };

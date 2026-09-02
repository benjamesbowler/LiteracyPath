function SpeakerIcon() {
  return (
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 5 6 9H3v6h3l5 4V5Z" fill="currentColor" stroke="none" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 6a9 9 0 0 1 0 12" />
    </svg>
  );
}

export function AdventureRoundFrame({
  stationTitle,
  roundNumber,
  roundTotal,
  mechanicId,
  instructionText,
  detailText = "",
  supportText = "",
  feedback = "",
  feedbackTone = "ready",
  disabled = false,
  hasTargetAudio = false,
  hasContentAudio = false,
  contentReplayLabel = "Hear the poem",
  onReplayInstruction,
  onReplayTarget,
  onReplayContent,
  onStop,
  children
}) {
  const current = Math.max(1, Number(roundNumber) || 1);
  const total = Math.max(current, Number(roundTotal) || current);
  const progress = Math.round(((current - 1) / total) * 100);

  return (
    <section
      className="adventure-round-frame"
      data-adventure-round-frame={mechanicId || "unknown"}
      data-feedback-tone={feedbackTone}
      aria-labelledby="adventure-round-title"
    >
      <header className="adventure-round-frame__header">
        <div className="adventure-round-frame__heading">
          <p className="adventure-round-frame__eyebrow">{stationTitle}</p>
          <h1 id="adventure-round-title">{current} of {total}</h1>
        </div>
        <div
          className="adventure-round-frame__progress"
          role="progressbar"
          aria-label="Station progress"
          aria-valuemin="0"
          aria-valuemax={total}
          aria-valuenow={current - 1}
        >
          <span style={{ width: `${progress}%` }} />
        </div>
        <button
          className="adventure-round-frame__stop"
          type="button"
          disabled={disabled}
          onClick={onStop}
        >
          Stop
        </button>
      </header>

      <div className="adventure-round-frame__body">
        <aside className="adventure-round-frame__plaque" aria-label="What to do">
          <div className="adventure-round-frame__instruction">
            <p>{instructionText}</p>
            {detailText && <small>{detailText}</small>}
            {supportText && <small className="adventure-round-frame__support">{supportText}</small>}
          </div>
          <div className="adventure-round-frame__audio-actions">
            <button type="button" disabled={disabled} onClick={onReplayInstruction}>
              <SpeakerIcon />
              Hear what to do
            </button>
            {hasTargetAudio && (
              <button type="button" disabled={disabled} onClick={onReplayTarget}>
                <SpeakerIcon />
                Listen
              </button>
            )}
            {hasContentAudio && (
              <button type="button" disabled={disabled} onClick={onReplayContent}>
                <SpeakerIcon />
                {contentReplayLabel}
              </button>
            )}
          </div>
        </aside>

        <div className="adventure-round-frame__stage" data-stage-state={feedbackTone}>
          {children}
          <div className="adventure-round-frame__world-reaction" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </div>

        <p
          className="adventure-round-frame__feedback"
          data-feedback-tone={feedbackTone}
          role="status"
          aria-live="polite"
        >
          {feedback}
        </p>
      </div>
    </section>
  );
}

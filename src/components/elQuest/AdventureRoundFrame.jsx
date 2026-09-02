import { useEffect, useRef } from "react";

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
  instructionAudio = "",
  detailText = "",
  supportText = "",
  feedback = "",
  feedbackTone = "ready",
  correctionModel = null,
  announceFeedback = true,
  shaking = false,
  sparkle = false,
  disabled = false,
  hasTargetAudio = false,
  hasContentAudio = false,
  contentReplayLabel = "Hear the poem",
  onReplayInstruction,
  onReplayTarget,
  onReplayContent,
  onStageInteraction,
  onShakeEnd,
  onStop,
  children
}) {
  const current = Math.max(1, Number(roundNumber) || 1);
  const total = Math.max(current, Number(roundTotal) || current);
  const progress = Math.round(((current - 1) / total) * 100);
  const correctionModelRef = useRef(null);
  const genericCorrectionActive = Boolean(correctionModel && correctionModel.mode !== "native-formation");
  const correctionReplayKey = correctionModel?.replayKey || "ready";

  useEffect(() => {
    if (!genericCorrectionActive) return undefined;
    const model = correctionModelRef.current;
    if (!model) return undefined;

    const frame = window.requestAnimationFrame(() => {
      const stage = model.closest(".adventure-round-frame__stage");
      if (stage) {
        const stageRect = stage.getBoundingClientRect();
        const modelRect = model.getBoundingClientRect();
        const inset = 8;
        let nextScrollTop = stage.scrollTop;
        if (modelRect.top < stageRect.top + inset) {
          nextScrollTop -= (stageRect.top + inset) - modelRect.top;
        } else if (modelRect.bottom > stageRect.bottom - inset) {
          nextScrollTop += modelRect.bottom - (stageRect.bottom - inset);
        }
        stage.scrollTop = Math.max(0, nextScrollTop);
      } else {
        model.scrollIntoView?.({ block: "nearest", inline: "nearest" });
      }
      model.focus({ preventScroll: true });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [correctionReplayKey, genericCorrectionActive]);

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
            <button
              type="button"
              aria-label="Hear instructions again"
              data-instruction-audio={instructionAudio}
              disabled={disabled}
              onClick={onReplayInstruction}
            >
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

        <div
          className={`adventure-round-frame__stage${shaking ? " sbq-shake" : ""}`}
          data-stage-state={feedbackTone}
          onClickCapture={onStageInteraction}
          onAnimationEnd={onShakeEnd}
        >
          {sparkle && <span className="sbq-sparkle" aria-hidden="true">✨</span>}
          {children}
          {correctionModel && correctionModel.mode !== "native-formation" && (
            <aside
              ref={correctionModelRef}
              className="adventure-round-frame__correction-model"
              data-correction-model="true"
              data-correction-model-key={correctionReplayKey}
              role="status"
              aria-live="assertive"
              aria-label={correctionModel.label || "Correct model"}
              tabIndex={-1}
            >
              <strong>{correctionModel.label || "Correct model"}</strong>
              <p>{correctionModel.instruction}</p>
              <div className="adventure-round-frame__correction-units">
                {correctionModel.units.map((unit, index) => (
                  <span
                    className={unit === "→" || unit === "|" ? "is-separator" : ""}
                    data-correction-unit={unit}
                    key={`${unit}:${index}`}
                  >
                    {unit}
                  </span>
                ))}
                {correctionModel.image?.src && (
                  <img
                    data-correction-target-image="true"
                    src={correctionModel.image.src}
                    alt={correctionModel.image.alt || ""}
                  />
                )}
              </div>
            </aside>
          )}
          <div className="adventure-round-frame__world-reaction" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </div>

        <p
          className="adventure-round-frame__feedback"
          data-feedback-tone={feedbackTone}
          role={announceFeedback ? "status" : undefined}
          aria-live={announceFeedback ? "polite" : undefined}
        >
          {feedback}
        </p>
      </div>
    </section>
  );
}

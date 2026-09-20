import "../activities/woodland-activity.css";
import "../../styles/adventure-woodland.css";
import { WoodlandIcon, WoodlandProgress } from "../activities/WoodlandActivity.jsx";
import ActivityButton from '../ActivityButton.jsx';
import { useEffect, useRef } from "react";
import { triggerTactileFeedback } from "../../utils/tactileFeedback.js";

export function SpeakerIcon() {
  return <WoodlandIcon name="sound" size={22} />;
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
  audioStatus = "ready",
  targetReplayLabel = "Hear the target",
  contentReplayLabel = "Hear the text",
  onReplayInstruction,
  onReplayTarget,
  onReplayContent,
  onStageInteraction,
  onShakeEnd,
  onStop,
  compact = false,
  children
}) {
  const current = Math.max(1, Number(roundNumber) || 1);
  const total = Math.max(current, Number(roundTotal) || current);
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
      className="adventure-round-frame woodland-activity woodland-adventure"
      data-adventure-round-frame={mechanicId || "unknown"}
      data-frame-layout={compact ? "compact" : "standard"}
      {...(compact ? { "data-child-choices": "" } : {})}
      data-feedback-tone={feedbackTone}
      {...(compact
        ? { "aria-label": `${stationTitle || "Activity"}, ${current} of ${total}` }
        : { "aria-labelledby": "adventure-round-title" })}
    >
      {!compact && <header className="adventure-round-frame__header">
        <div className="adventure-round-frame__heading">
          <p className="adventure-round-frame__eyebrow">Adventure Map</p>
          <h1 id="adventure-round-title" data-child-title="">{stationTitle}</h1>
        </div>
        <div className="adventure-round-frame__journey" data-child-progress="">
          <span className="adventure-round-frame__counter">{current}<small> / {total}</small></span>
          <WoodlandProgress className="adventure-round-frame__progress" current={current - 1} total={total} label="Station progress" />
        </div>
        <ActivityButton
          className="adventure-round-frame__stop"
          type="button"
          onClick={onStop}
        >
          Stop
        </ActivityButton>
      </header>}

      <div className={`adventure-round-frame__body${compact ? " adventure-round-frame__body--compact" : ""}`}>
        {!compact && <aside className="adventure-round-frame__plaque" aria-label="What to do">
          <div className="adventure-round-frame__instruction">
            <p data-child-instruction="">{instructionText}</p>
            {detailText && <small>{detailText}</small>}
            {supportText && <small className="adventure-round-frame__support">{supportText}</small>}
          </div>
          <div className="adventure-round-frame__audio-actions">
            <ActivityButton
              type="button"
              className="wa-audio"
              aria-label="Hear instructions again"
              data-instruction-audio={instructionAudio}
              data-audio-state={audioStatus}
              disabled={disabled}
              onClick={() => { triggerTactileFeedback(); onReplayInstruction?.(); }}
            >
              <SpeakerIcon />
              <span>Listen</span>
            </ActivityButton>
            {hasTargetAudio && (
              <ActivityButton
                type="button"
                className="wa-audio"
                aria-label={targetReplayLabel}
                data-audio-state={audioStatus}
                disabled={disabled}
                onClick={() => { triggerTactileFeedback(); onReplayTarget?.(); }}
              >
                <SpeakerIcon />
                <span>{targetReplayLabel}</span>
              </ActivityButton>
            )}
            {hasContentAudio && (
              <ActivityButton
                type="button"
                className="wa-audio"
                aria-label={contentReplayLabel}
                data-audio-state={audioStatus}
                disabled={disabled}
                onClick={() => { triggerTactileFeedback(); onReplayContent?.(); }}
              >
                <SpeakerIcon />
                <span>{contentReplayLabel}</span>
              </ActivityButton>
            )}
            <span
              className="adventure-round-frame__audio-status"
              data-audio-state={audioStatus}
              role="status"
              aria-live="polite"
            >
              {audioStatus === "playing" && "Playing audio"}
              {audioStatus === "unavailable" && "Tap Listen to try again."}
            </span>
          </div>
        </aside>}

        <div
          className={`adventure-round-frame__stage${shaking ? " sbq-shake" : ""}`}
          data-child-choices=""
          data-child-primary=""
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

        {!compact && <p
          className="adventure-round-frame__feedback"
          data-feedback-tone={feedbackTone}
          role={announceFeedback ? "status" : undefined}
          aria-live={announceFeedback ? "polite" : undefined}
        >
          {feedback}
        </p>}
      </div>
    </section>
  );
}

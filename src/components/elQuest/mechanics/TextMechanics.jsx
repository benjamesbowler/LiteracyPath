import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CHILD_COPY } from "../../../copy/childCopy.js";
import { LETTER_GUIDES, LETTER_STROKES } from "../../../data/letterStrokes.js";
import { scoreLetterTrace } from "../../../utils/traceLetterScoring.js";
import { LetterWriter } from "../../shared/LetterWriter.jsx";
import {
  createLetterTraceState,
  createPoemSpotlightState,
  updateLetterTraceState,
  updatePoemSpotlightState
} from "./textMechanicState.js";

function fallbackTokens(line, lineIndex) {
  return String(line || "")
    .split(/\s+/)
    .filter(Boolean)
    .map((text, tokenIndex) => ({
      text,
      normalized: text.toLowerCase().replace(/[^a-z']/g, ""),
      lineIndex,
      tokenIndex
    }));
}

export function PoemSpotlightMechanic({
  round,
  disabled = false,
  supportLevel = 0,
  onCommit,
  reducedMotion = false
}) {
  const completionLockRef = useRef(false);
  const [state, setState] = useState(createPoemSpotlightState);
  const [feedback, setFeedback] = useState("");
  const lines = Array.isArray(round?.lines) ? round.lines : [];

  function chooseToken(token) {
    if (disabled || completionLockRef.current) return;
    const transition = updatePoemSpotlightState(state, round, token, supportLevel);
    setState(transition.state);
    if (!transition.outcome) return;
    if (transition.outcome.correct) completionLockRef.current = true;
    setFeedback(transition.outcome.feedback);
    onCommit?.(transition.outcome);
  }

  return (
    <div
      className="sbq-poem-spotlight"
      data-mechanic-stage="poem-spotlight"
      data-reduced-motion={reducedMotion ? "true" : "false"}
    >
      {round?.poemTitle && <p className="sbq-poem-title">{round.poemTitle}</p>}
      <div
        className="sbq-round-display sbq-poem"
        role="group"
        aria-label={round?.poemTitle || "Poem"}
      >
        {lines.map((line, lineIndex) => {
          const tokens = round?.tokens?.[lineIndex] || fallbackTokens(line, lineIndex);
          return (
            <p
              className="sbq-poem-line"
              data-poem-line={lineIndex}
              key={`line-${lineIndex}`}
              style={state.coordinatesVisible ? undefined : { gridTemplateColumns: "minmax(0, 1fr)" }}
            >
              {state.coordinatesVisible && (
                <>
                  <span className="kg-visually-hidden">Line {lineIndex + 1}: </span>
                  <span
                    aria-hidden="true"
                    className="sbq-poem-line-marker"
                    data-poem-line-marker={lineIndex}
                  >
                    <span>Line</span>
                    <strong>{lineIndex + 1}</strong>
                  </span>
                </>
              )}
              <span className="sbq-poem-line-words" data-poem-line-words={lineIndex}>
                {tokens.map((token, tokenIndex) => (
                  <span className="sbq-poem-word" key={`${lineIndex}-${tokenIndex}`}>
                    <span aria-hidden="true" className="sbq-poem-word-marker">{tokenIndex + 1}</span>
                    <button
                      className="sbq-poem-token sbq-ghost-button"
                      type="button"
                      disabled={disabled}
                      data-poem-token={`${lineIndex}:${tokenIndex}`}
                      onClick={() => chooseToken(token)}
                    >
                      {token.text}
                    </button>
                  </span>
                ))}
              </span>
            </p>
          );
        })}
      </div>
      <p className="sbq-trace-message" role="status" aria-live="polite">{feedback}</p>
    </div>
  );
}

function traceCharacters(letter) {
  return String(letter || "").split("").filter(char => LETTER_STROKES[char]);
}

function traceLayoutFor(chars) {
  const contentWidth = Math.max(1, chars.length) * LETTER_GUIDES.width;
  const scale = Math.min((460 - 72) / contentWidth, (300 - 34) / 140);
  return {
    contentWidth,
    offsetX: (460 - (contentWidth * scale)) / 2,
    offsetY: (300 - (140 * scale)) / 2,
    scale
  };
}

function strokeDirection(path) {
  const numbers = String(path).match(/-?\d+(?:\.\d+)?/g)?.map(Number) || [];
  if (numbers.length < 4) return null;
  const [x, y, nextX, nextY] = numbers;
  const angle = Math.atan2(nextY - y, nextX - x) * (180 / Math.PI);
  return { x, y, angle };
}

function TracePaths({
  chars,
  traceLayout,
  currentStroke = null,
  targetPaths = false,
  showStrokeOrder = false
}) {
  return (
    <g transform={`translate(${traceLayout.offsetX} ${traceLayout.offsetY}) scale(${traceLayout.scale})`}>
      {chars.map((char, charIndex) => (
        <g key={`${char}-${charIndex}`} transform={`translate(${charIndex * LETTER_GUIDES.width} 0)`}>
          {LETTER_STROKES[char].map((path, pathIndex) => {
            const thisStroke = chars.slice(0, charIndex).reduce(
              (total, priorChar) => total + LETTER_STROKES[priorChar].length,
              pathIndex
            );
            const direction = strokeDirection(path);
            return (
              <g key={`${char}-${pathIndex}`} data-stroke-order={showStrokeOrder ? thisStroke + 1 : undefined}>
                <path
                  d={path}
                  data-char-index={charIndex}
                  data-trace-target={targetPaths ? "" : undefined}
                  fill="none"
                  stroke={currentStroke === null || currentStroke === thisStroke ? "currentColor" : "rgba(15, 23, 42, 0.12)"}
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {showStrokeOrder && direction && (
                  <g
                    className="sbq-trace-order-marker"
                    transform={`translate(${direction.x} ${direction.y})`}
                    aria-hidden="true"
                  >
                    <circle r="11" />
                    <text x="0" y="4">{thisStroke + 1}</text>
                    <text
                      className="sbq-trace-direction-arrow"
                      x="15"
                      y="5"
                      transform={`rotate(${direction.angle} 15 5)`}
                    >
                      ➜
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>
      ))}
    </g>
  );
}

export function LetterTraceMechanic({
  round,
  disabled = false,
  correctionModel = null,
  supportLevel = 0,
  onCommit,
  onCorrectionModelAcknowledged,
  onRequestReplay,
  reducedMotion = false
}) {
  const canvasRef = useRef(null);
  const targetRef = useRef(null);
  const drawing = useRef(false);
  const currentStrokeRef = useRef([]);
  const drawnStrokesRef = useRef([]);
  const lastPointRef = useRef(null);
  const activePointerIdRef = useRef(null);
  const completionLockRef = useRef(false);
  const correctionModelRef = useRef(null);
  const [pointCount, setPointCount] = useState(0);
  const [traceMessage, setTraceMessage] = useState(CHILD_COPY.tracing.prompt);
  const [traceDimension, setTraceDimension] = useState("");
  const [demoKey, setDemoKey] = useState(0);
  const [completedModelKey, setCompletedModelKey] = useState("");
  const [traceState, setTraceState] = useState(createLetterTraceState);
  const [supportedMode, setSupportedMode] = useState(false);
  const [supportedStep, setSupportedStep] = useState(0);
  const chars = useMemo(() => traceCharacters(round?.letter), [round?.letter]);
  const traceLayout = useMemo(() => traceLayoutFor(chars), [chars]);
  const totalStrokes = useMemo(
    () => chars.reduce((total, char) => total + LETTER_STROKES[char].length, 0),
    [chars]
  );
  const nativeCorrectionActive = correctionModel?.mode === "native-formation";
  const correctionReplayKey = correctionModel?.replayKey || "ready";
  const nativeModelPending = nativeCorrectionActive
    && completedModelKey !== correctionReplayKey;
  const correctionStatusRef = useRef({ active: false, key: "ready", letter: "" });
  correctionStatusRef.current = {
    active: nativeCorrectionActive,
    key: correctionReplayKey,
    letter: round.letter
  };
  const handleModelDone = useCallback(() => {
    const currentCorrection = correctionStatusRef.current;
    setCompletedModelKey(currentCorrection.key);
    if (!currentCorrection.active) return;
    canvasRef.current?.getContext("2d")?.clearRect(0, 0, 460, 300);
    drawing.current = false;
    activePointerIdRef.current = null;
    currentStrokeRef.current = [];
    drawnStrokesRef.current = [];
    lastPointRef.current = null;
    setPointCount(0);
    setTraceDimension("");
    setTraceMessage(`Now trace ${currentCorrection.letter} again after the model.`);
  }, []);

  useEffect(() => {
    if (!nativeCorrectionActive) return undefined;
    const model = correctionModelRef.current;
    if (!model) return undefined;

    const frame = window.requestAnimationFrame(() => {
      const stage = model.closest(".adventure-round-frame__stage");
      if (stage) {
        const stageRect = stage.getBoundingClientRect();
        const modelRect = model.getBoundingClientRect();
        stage.scrollTop = Math.max(0, stage.scrollTop + modelRect.top - stageRect.top - 8);
      } else {
        model.scrollIntoView?.({ block: "nearest", inline: "nearest" });
      }
      model.focus({ preventScroll: true });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [correctionReplayKey, nativeCorrectionActive]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const keepTraceGestureInsideCanvas = event => {
      if (event.cancelable) event.preventDefault();
    };
    const listenerOptions = { passive: false };
    canvas.addEventListener("touchstart", keepTraceGestureInsideCanvas, listenerOptions);
    canvas.addEventListener("touchmove", keepTraceGestureInsideCanvas, listenerOptions);
    return () => {
      canvas.removeEventListener("touchstart", keepTraceGestureInsideCanvas, listenerOptions);
      canvas.removeEventListener("touchmove", keepTraceGestureInsideCanvas, listenerOptions);
    };
  }, [supportedMode]);

  function pointFrom(event) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return [
      ((event.clientX - rect.left) * canvas.width) / rect.width,
      ((event.clientY - rect.top) * canvas.height) / rect.height
    ];
  }

  function drawPoint(point) {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    context.strokeStyle = "#2F9E62";
    context.lineWidth = 20;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.beginPath();
    if (lastPointRef.current) {
      context.moveTo(lastPointRef.current[0], lastPointRef.current[1]);
    } else {
      context.moveTo(point[0], point[1]);
    }
    context.lineTo(point[0], point[1]);
    context.stroke();
    lastPointRef.current = point;
    currentStrokeRef.current.push(point);
    setPointCount(value => value + 1);
  }

  function beginStroke(event) {
    if (disabled || nativeModelPending || supportedMode || activePointerIdRef.current !== null) return;
    event.preventDefault();
    activePointerIdRef.current = event.pointerId;
    drawing.current = true;
    lastPointRef.current = null;
    currentStrokeRef.current = [];
    event.currentTarget.setPointerCapture?.(event.pointerId);
    drawPoint(pointFrom(event));
  }

  function paint(event) {
    if (!drawing.current || activePointerIdRef.current !== event.pointerId) return;
    event.preventDefault();
    drawPoint(pointFrom(event));
  }

  function finishStroke(event) {
    if (activePointerIdRef.current !== event.pointerId) return;
    event.preventDefault();
    activePointerIdRef.current = null;
    const wasDrawing = drawing.current;
    drawing.current = false;
    lastPointRef.current = null;
    if (wasDrawing && currentStrokeRef.current.length) {
      drawnStrokesRef.current.push(currentStrokeRef.current);
    }
    currentStrokeRef.current = [];
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function abandonStroke(event) {
    if (activePointerIdRef.current !== event.pointerId) return;
    if (event.cancelable) event.preventDefault();
    resetInk("The touch stopped. Start the letter again.");
  }

  function resetInk(message) {
    const canvas = canvasRef.current;
    canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    drawing.current = false;
    activePointerIdRef.current = null;
    currentStrokeRef.current = [];
    drawnStrokesRef.current = [];
    lastPointRef.current = null;
    setPointCount(0);
    setTraceDimension("");
    setTraceMessage(message);
  }

  function clearInk() {
    resetInk(
      traceState.phase === "faded"
        ? "Trace the faded letter model."
        : CHILD_COPY.tracing.prompt
    );
    if (nativeCorrectionActive && !nativeModelPending) {
      onCorrectionModelAcknowledged?.();
    }
  }

  function expectedStrokes() {
    const paths = Array.from(targetRef.current?.querySelectorAll("[data-trace-target]") || []);
    return paths.map(path => {
      const length = path.getTotalLength();
      const charIndex = Number(path.dataset.charIndex || 0);
      const points = [];
      for (let distance = 0; distance <= length; distance += 5) {
        const point = path.getPointAtLength(Math.min(distance, length));
        points.push([
          traceLayout.offsetX + ((point.x + (charIndex * LETTER_GUIDES.width)) * traceLayout.scale),
          traceLayout.offsetY + (point.y * traceLayout.scale)
        ]);
      }
      return points;
    });
  }

  function checkTrace() {
    if (completionLockRef.current) return;
    const result = scoreLetterTrace({
      drawnStrokes: drawnStrokesRef.current,
      expectedStrokes: expectedStrokes()
    });
    const transition = updateLetterTraceState(
      traceState,
      { type: "score", result },
      round,
      supportLevel
    );
    if (transition.state.phase !== traceState.phase) {
      setTraceState(transition.state);
      resetInk("Now trace again with the faded model.");
      return;
    }
    if (!transition.outcome) return;
    if (transition.outcome.correct) completionLockRef.current = true;
    setTraceState(transition.state);
    setTraceMessage(transition.outcome.feedback);
    setTraceDimension(transition.outcome.errorDimension || "");
    onCommit?.(transition.outcome);
  }

  function replayModel() {
    setTraceState(state => updateLetterTraceState(
      state,
      { type: "replayModel" },
      round,
      supportLevel
    ).state);
    setCompletedModelKey("");
    setDemoKey(key => key + 1);
    onRequestReplay?.();
  }

  function openSupportedPractice() {
    resetInk(CHILD_COPY.tracing.prompt);
    setSupportedStep(0);
    setSupportedMode(true);
  }

  function finishSupportedPractice() {
    if (completionLockRef.current) return;
    const transition = updateLetterTraceState(
      traceState,
      { type: "finishSupportedPractice" },
      round,
      supportLevel
    );
    setTraceState(transition.state);
    if (!transition.outcome) return;
    completionLockRef.current = true;
    setTraceMessage(transition.outcome.feedback);
    onCommit?.(transition.outcome);
  }

  return (
    <div
      className="sbq-trace"
      data-mechanic-stage="letter-trace"
      data-trace-phase={traceState.phase}
      data-reduced-motion={reducedMotion ? "true" : "false"}
    >
      {!supportedMode && (
        <>
          <div
            className="sbq-trace-demo"
            ref={nativeCorrectionActive ? correctionModelRef : null}
            role={nativeCorrectionActive ? "group" : undefined}
            aria-label={nativeCorrectionActive ? `Correct stroke model for ${round.letter}` : undefined}
            tabIndex={nativeCorrectionActive ? -1 : undefined}
            data-correction-model={nativeCorrectionActive ? "true" : undefined}
            data-correction-model-key={nativeCorrectionActive ? correctionReplayKey : undefined}
            data-correction-model-state={nativeCorrectionActive
              ? (nativeModelPending ? "playing" : "complete")
              : undefined}
          >
            {nativeCorrectionActive && (
              <p className="sbq-trace-correction-label" role="status" aria-live="assertive">
                Correct stroke model
              </p>
            )}
            {reducedMotion ? (
              <svg
                viewBox="0 0 460 300"
                height="130"
                role="img"
                aria-label={`Ordered formation model for ${round.letter}`}
                data-static-ordered-model={nativeCorrectionActive ? "true" : undefined}
              >
                <TracePaths
                  chars={chars}
                  traceLayout={traceLayout}
                  showStrokeOrder={nativeCorrectionActive}
                />
              </svg>
            ) : (
              <LetterWriter
                text={round.letter}
                height={130}
                playKey={`${demoKey}:${correctionReplayKey}`}
                onDone={handleModelDone}
              />
            )}
            {nativeCorrectionActive && reducedMotion && nativeModelPending && (
              <button
                className="sbq-ghost-button"
                type="button"
                disabled={disabled}
                onClick={handleModelDone}
              >
                I followed the numbered model
              </button>
            )}
            <button className="sbq-ghost-button" type="button" disabled={disabled} onClick={replayModel}>
              ✏️ {CHILD_COPY.tracing.watch}
            </button>
          </div>
          <p className="sbq-trace-phase-label">
            {traceState.phase === "guided" ? "Guided trace" : "Faded-model trace"}
          </p>
          <div className="sbq-trace-stage">
            <svg
              ref={targetRef}
              aria-hidden="true"
              className="sbq-trace-letter"
              viewBox="0 0 460 300"
              style={{ opacity: traceState.phase === "faded" ? 0.28 : 1 }}
            >
              <TracePaths chars={chars} traceLayout={traceLayout} targetPaths />
            </svg>
            <canvas
              ref={canvasRef}
              width={460}
              height={300}
              aria-label={`Trace the letter ${round.letter}${traceState.phase === "faded" ? " with the faded model" : ""}`}
              aria-disabled={disabled || nativeModelPending ? "true" : undefined}
              onPointerDown={beginStroke}
              onPointerMove={paint}
              onPointerUp={finishStroke}
              onPointerCancel={abandonStroke}
              onLostPointerCapture={abandonStroke}
            />
          </div>
          <p
            className="sbq-trace-message"
            role="status"
            data-trace-failure-dimension={traceDimension || undefined}
          >
            {traceMessage}
          </p>
          <div className="sbq-trace-actions">
            <button className="sbq-ghost-button" type="button" disabled={disabled || nativeModelPending} onClick={clearInk}>
              {CHILD_COPY.tracing.clear}
            </button>
            <button
              className="sbq-primary-button"
              type="button"
              disabled={disabled || nativeModelPending || pointCount < 20}
              onClick={checkTrace}
            >
              {CHILD_COPY.tracing.check}
            </button>
          </div>
          <button
            className="sbq-ghost-button"
            type="button"
            disabled={disabled || nativeModelPending}
            onClick={openSupportedPractice}
          >
            Use supported formation practice
          </button>
        </>
      )}

      {supportedMode && (
        <div data-support-route="formation-practice">
          <svg
            viewBox="0 0 460 300"
            width="460"
            height="300"
            role="img"
            aria-label={`Stroke ${supportedStep + 1} of ${totalStrokes} for ${round.letter}`}
            style={{ color: "#2F9E62", maxWidth: "100%", height: "auto" }}
          >
            <TracePaths
              chars={chars}
              traceLayout={traceLayout}
              currentStroke={supportedStep}
            />
          </svg>
          <p className="sbq-trace-message" role="status">
            Stroke {Math.min(supportedStep + 1, totalStrokes)} of {totalStrokes}. This records supported formation practice.
          </p>
          <div className="sbq-trace-actions">
            {supportedStep + 1 < totalStrokes ? (
              <button
                className="sbq-primary-button"
                type="button"
                disabled={disabled}
                onClick={() => setSupportedStep(step => step + 1)}
              >
                Next stroke
              </button>
            ) : (
              <button
                className="sbq-primary-button"
                type="button"
                disabled={disabled || totalStrokes === 0}
                onClick={finishSupportedPractice}
              >
                Finish supported practice
              </button>
            )}
            <button
              className="sbq-ghost-button"
              type="button"
              disabled={disabled}
              onClick={() => {
                setSupportedMode(false);
                setTraceMessage(CHILD_COPY.tracing.prompt);
              }}
            >
              Return to drawing
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

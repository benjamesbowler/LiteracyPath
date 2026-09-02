import { useEffect, useMemo, useRef, useState } from "react";

import { CHILD_COPY } from "../../../copy/childCopy.js";
import { LETTER_GUIDES, LETTER_STROKES } from "../../../data/letterStrokes.js";
import { scoreLetterTrace } from "../../../utils/traceLetterScoring.js";
import { LetterWriter } from "../../shared/LetterWriter.jsx";
import {
  createCoverClueState,
  createLetterTraceState,
  createPoemSpotlightOutcome,
  createSupportedFormationOutcome,
  updateCoverClueState,
  updateLetterTraceState
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
  const [feedback, setFeedback] = useState("");
  const lines = Array.isArray(round?.lines) ? round.lines : [];

  function chooseToken(token) {
    if (disabled) return;
    const outcome = createPoemSpotlightOutcome(round, token, supportLevel);
    setFeedback(outcome.feedback);
    onCommit?.(outcome);
  }

  return (
    <div
      className="sbq-poem-spotlight"
      data-mechanic-stage="poem-spotlight"
      data-reduced-motion={reducedMotion ? "true" : "false"}
    >
      {round?.poemTitle && <p className="sbq-poem-title">{round.poemTitle}</p>}
      <div className="sbq-round-display sbq-poem" aria-label={round?.poemTitle || "Poem"}>
        {lines.map((line, lineIndex) => {
          const tokens = round?.tokens?.[lineIndex] || fallbackTokens(line, lineIndex);
          return (
            <p className="sbq-poem-line" aria-label={line} key={`line-${lineIndex}`}>
              {tokens.map((token, tokenIndex) => (
                <span key={`${lineIndex}-${tokenIndex}`}>
                  {tokenIndex > 0 ? " " : ""}
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
            </p>
          );
        })}
      </div>
      <p className="sbq-trace-message" role="status" aria-live="polite">{feedback}</p>
    </div>
  );
}

export function CoverClueMechanic({
  round,
  disabled = false,
  supportLevel = 0,
  onCommit,
  reducedMotion = false
}) {
  const [state, setState] = useState(createCoverClueState);
  const [feedback, setFeedback] = useState("");
  const covers = Array.isArray(round?.covers) ? round.covers : [];
  const stripText = round?.strip?.text || "Story title";

  function act(action) {
    if (disabled) return;
    const transition = updateCoverClueState(state, action, round, supportLevel);
    setState(transition.state);
    if (transition.outcome) {
      setFeedback(transition.outcome.feedback);
      onCommit?.(transition.outcome);
    }
  }

  const status = feedback || (
    state.stripSelected
      ? "Now place the title strip on the matching cover."
      : "Pick up the title strip first."
  );

  return (
    <div
      className="sbq-cover-clue"
      data-mechanic-stage="cover-clue"
      data-reduced-motion={reducedMotion ? "true" : "false"}
    >
      <button
        className="sbq-cover-clue-strip"
        type="button"
        disabled={disabled}
        aria-pressed={state.stripSelected}
        data-cover-strip="title"
        onClick={() => act({ type: "selectStrip" })}
      >
        {stripText}
      </button>
      <p className="sbq-cover-clue-status" role="status" aria-live="polite">{status}</p>
      <div className="sbq-cover-clue-rack" aria-label="Book covers">
        {covers.map((cover, index) => (
          <button
            key={cover.cover || cover.id || `${cover.title}-${index}`}
            className="sbq-cover-clue-cover"
            type="button"
            disabled={disabled || !state.stripSelected}
            data-cover-piece={index}
            data-strip-selected={state.stripSelected ? "true" : "false"}
            aria-label={state.titlesRevealed
              ? `Book cover ${index + 1}: ${cover.title || "untitled"}`
              : `Book cover ${index + 1}`}
            onClick={() => act({ type: "placeCover", cover })}
          >
            {cover.cover ? (
              <img src={cover.cover} alt="" loading="lazy" />
            ) : (
              <span className="sbq-cover-clue-cover-art" aria-hidden="true">Book cover</span>
            )}
            <span
              className="sbq-cover-clue-cover-title"
              data-revealed={state.titlesRevealed ? "true" : "false"}
            >
              {state.titlesRevealed ? (cover.title || "Book title") : "?"}
            </span>
          </button>
        ))}
      </div>
      <button
        className="sbq-ghost-button"
        type="button"
        disabled={disabled}
        onClick={() => act({ type: "toggleTitles" })}
      >
        {state.titlesRevealed ? "Hide cover titles" : "Show cover titles"}
      </button>
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

function TracePaths({ chars, traceLayout, currentStroke = null, targetPaths = false }) {
  return (
    <g transform={`translate(${traceLayout.offsetX} ${traceLayout.offsetY}) scale(${traceLayout.scale})`}>
      {chars.map((char, charIndex) => (
        <g key={`${char}-${charIndex}`} transform={`translate(${charIndex * LETTER_GUIDES.width} 0)`}>
          {LETTER_STROKES[char].map((path, pathIndex) => {
            const thisStroke = chars.slice(0, charIndex).reduce(
              (total, priorChar) => total + LETTER_STROKES[priorChar].length,
              pathIndex
            );
            return (
              <path
                key={`${char}-${pathIndex}`}
                d={path}
                data-char-index={charIndex}
                data-trace-target={targetPaths ? "" : undefined}
                fill="none"
                stroke={currentStroke === null || currentStroke === thisStroke ? "currentColor" : "rgba(15, 23, 42, 0.12)"}
                strokeWidth="12"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
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
  supportLevel = 0,
  onCommit,
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
  const [pointCount, setPointCount] = useState(0);
  const [traceMessage, setTraceMessage] = useState(CHILD_COPY.tracing.prompt);
  const [traceDimension, setTraceDimension] = useState("");
  const [demoKey, setDemoKey] = useState(0);
  const [traceState, setTraceState] = useState(createLetterTraceState);
  const [supportedMode, setSupportedMode] = useState(false);
  const [supportedStep, setSupportedStep] = useState(0);
  const chars = useMemo(() => traceCharacters(round?.letter), [round?.letter]);
  const traceLayout = useMemo(() => traceLayoutFor(chars), [chars]);
  const totalStrokes = useMemo(
    () => chars.reduce((total, char) => total + LETTER_STROKES[char].length, 0),
    [chars]
  );

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
    if (disabled || supportedMode || activePointerIdRef.current !== null) return;
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
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    activePointerIdRef.current = null;
    if (!drawing.current) return;
    drawing.current = false;
    lastPointRef.current = null;
    if (currentStrokeRef.current.length) drawnStrokesRef.current.push(currentStrokeRef.current);
    currentStrokeRef.current = [];
  }

  function abandonStroke(event) {
    if (activePointerIdRef.current !== event.pointerId) return;
    activePointerIdRef.current = null;
    drawing.current = false;
    lastPointRef.current = null;
    if (currentStrokeRef.current.length) drawnStrokesRef.current.push(currentStrokeRef.current);
    currentStrokeRef.current = [];
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
    setTraceMessage(transition.outcome.feedback);
    setTraceDimension(transition.outcome.errorDimension || "");
    onCommit?.(transition.outcome);
  }

  function replayModel() {
    setDemoKey(key => key + 1);
    onRequestReplay?.();
  }

  function openSupportedPractice() {
    resetInk(CHILD_COPY.tracing.prompt);
    setSupportedStep(0);
    setSupportedMode(true);
  }

  function finishSupportedPractice() {
    const outcome = createSupportedFormationOutcome(round, supportLevel);
    setTraceMessage(outcome.feedback);
    onCommit?.(outcome);
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
          <div className="sbq-trace-demo">
            {reducedMotion ? (
              <svg viewBox="0 0 460 300" height="130" role="img" aria-label={`Formation model for ${round.letter}`}>
                <TracePaths chars={chars} traceLayout={traceLayout} />
              </svg>
            ) : (
              <LetterWriter text={round.letter} height={130} playKey={demoKey} />
            )}
            <button className="sbq-ghost-button" type="button" disabled={disabled} onClick={replayModel}>
              ✏️ {CHILD_COPY.tracing.watch}
            </button>
          </div>
          <p className="sbq-cover-clue-status">
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
              aria-disabled={disabled ? "true" : undefined}
              onPointerDown={beginStroke}
              onPointerMove={paint}
              onPointerUp={finishStroke}
              onPointerCancel={finishStroke}
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
            <button className="sbq-ghost-button" type="button" disabled={disabled} onClick={clearInk}>
              {CHILD_COPY.tracing.clear}
            </button>
            <button
              className="sbq-primary-button"
              type="button"
              disabled={disabled || pointCount < 20}
              onClick={checkTrace}
            >
              {CHILD_COPY.tracing.check}
            </button>
          </div>
          <button
            className="sbq-ghost-button"
            type="button"
            disabled={disabled}
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

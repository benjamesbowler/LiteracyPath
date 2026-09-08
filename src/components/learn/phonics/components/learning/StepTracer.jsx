import { memo, useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePhonicsAudio } from "../../../../../hooks/usePhonicsAudio";
import { playCueAudio, playCueSequence, stopCueAudio } from "../../../../../utils/audio/cuePlayer";
import AudioButton from "../AudioButton";
import PhonicsButton from "../PhonicsButton";
import { getLedaInstructionAudioPath } from "../../../../../data/ledaProductionAudio.js";

const SVG_NS = "http://www.w3.org/2000/svg";
// Tuned 2026-07-10: 90%/22 demanded pixel-perfect stroke tips and frustrated
// real kids; 8/22 (the pre-fix behaviour) accepted a single dot. 72% coverage
// with a slightly wider finger radius still requires genuinely tracing the
// whole stroke shape, but forgives wobbly starts and missed tail ends.
const THRESHOLD = 26;
const STROKE_COMPLETION_PERCENT = 72;
const TOTAL_TRACE_SAMPLES = 200;
const MIN_SAMPLES_PER_STROKE = 24;
const WATCH_ME_FIRST_AUDIO = getLedaInstructionAudioPath("Watch me first");
const START_AT_TOP_AUDIO = getLedaInstructionAudioPath("Start at the top");
const NOW_YOU_TRY_AUDIO = getLedaInstructionAudioPath("Now you try");
const DEMO_VOICE_MIN_MS = 3400;

function splitTraceSubpaths(tracePath = "") {
  return String(tracePath || "")
    .split(/(?=M)/)
    .map(path => path.trim())
    .filter(Boolean);
}

function sampleSubpath(pathData, sampleCount) {
  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute("d", pathData);
  const length = path.getTotalLength();
  const points = [];

  for (let index = 0; index <= sampleCount; index += 1) {
    const point = path.getPointAtLength((index / sampleCount) * length);
    points.push({ x: point.x, y: point.y });
  }

  return {
    length,
    points
  };
}

function calculateStrokeProgress(strokes, visitedSets) {
  if (!strokes.length) return { progress: 0, allComplete: false };

  const coverages = getStrokeCoverages(strokes, visitedSets);

  return {
    progress: Math.round(coverages.reduce((sum, coverage) => sum + coverage, 0) / coverages.length),
    allComplete: coverages.every(coverage => coverage >= STROKE_COMPLETION_PERCENT)
  };
}

function getStrokeCoverages(strokes, visitedSets) {
  return strokes.map((stroke, strokeIndex) => {
    const total = stroke.points.length || 1;
    return Math.min(100, (visitedSets[strokeIndex]?.size || 0) / total * 100);
  });
}

function getHintGeometry(stroke) {
  const points = stroke?.points || [];
  const start = points[0] || { x: 0, y: 0 };
  const arrowStart = points[Math.min(3, points.length - 1)] || start;
  const arrowEnd = points[Math.min(8, points.length - 1)] || arrowStart;
  const angle = Math.atan2(arrowEnd.y - arrowStart.y, arrowEnd.x - arrowStart.x) * 180 / Math.PI;
  return { start, arrowStart, angle };
}

const StepTracer = memo(function StepTracer({ lesson, onComplete }) {
  const svgRef = useRef(null);
  const canvasRef = useRef(null);
  const demoFrameRef = useRef(null);
  const visitedByStrokeRef = useRef([]);
  const strokesRef = useRef([]);
  const isDrawingRef = useRef(false);
  const activePointerIdRef = useRef(null);
  const lastCanvasPoint = useRef(null);
  const traceDonePlayedRef = useRef(false);
  const accessibleTraceUsedRef = useRef(false);
  const nextActionRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [strokeCoverages, setStrokeCoverages] = useState([]);
  const [renderStrokes, setRenderStrokes] = useState([]);
  const [demoActive, setDemoActive] = useState(false);
  const [demoDone, setDemoDone] = useState(false);
  const [demoStrokeIndex, setDemoStrokeIndex] = useState(0);
  const [demoStrokeProgress, setDemoStrokeProgress] = useState(0);
  const [demoMarker, setDemoMarker] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const { play: playTraceDone } = usePhonicsAudio(getLedaInstructionAudioPath("Amazing work"));
  const reduceMotion = useReducedMotion();
  const tracePath = lesson.traceSVG;

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  useEffect(() => {
    const subpaths = splitTraceSubpaths(tracePath);
    const sampledSubpaths = subpaths.map(pathData =>
      sampleSubpath(pathData, MIN_SAMPLES_PER_STROKE)
    );
    const totalLength = sampledSubpaths.reduce((sum, stroke) => sum + stroke.length, 0) || 1;
    const strokeCount = sampledSubpaths.length || 1;
    const remainingSamples = Math.max(0, TOTAL_TRACE_SAMPLES - (strokeCount * MIN_SAMPLES_PER_STROKE));
    const strokes = sampledSubpaths.map((stroke, index) => {
      const proportionalSamples = Math.round((stroke.length / totalLength) * remainingSamples);
      const sampleCount = MIN_SAMPLES_PER_STROKE + proportionalSamples;
      return {
        pathData: subpaths[index],
        ...sampleSubpath(subpaths[index], sampleCount)
      };
    });

    strokesRef.current = strokes;
    visitedByStrokeRef.current = strokes.map(() => new Set());
    setRenderStrokes(strokes);
    setStrokeCoverages(strokes.map(() => 0));
    setProgress(0);
    setIsComplete(false);
    setDemoDone(Boolean(reduceMotion));
    setDemoActive(!reduceMotion && strokes.length > 0);
    setDemoStrokeIndex(0);
    setDemoStrokeProgress(0);
    setDemoMarker(strokes[0]?.points?.[0] || null);
    traceDonePlayedRef.current = false;
    accessibleTraceUsedRef.current = false;
    clearCanvas();
    lastCanvasPoint.current = null;
    activePointerIdRef.current = null;
  }, [clearCanvas, reduceMotion, tracePath]);

  useEffect(() => () => stopCueAudio(), []);

  useEffect(() => {
    if (!demoActive || !renderStrokes.length) return undefined;

    const pauseDuration = 220;
    // Keep the visual demonstration present for the complete two-clip recorded
    // instruction; a one-stroke letter used to finish before the voice did.
    const strokeDuration = Math.max(
      900,
      Math.ceil(DEMO_VOICE_MIN_MS / renderStrokes.length) - pauseDuration
    );
    const perStrokeDuration = strokeDuration + pauseDuration;
    const startedAt = performance.now();
    playCueSequence([WATCH_ME_FIRST_AUDIO, START_AT_TOP_AUDIO], { gapMs: 150 });

    const animate = now => {
      const elapsed = now - startedAt;
      const rawStrokeIndex = Math.floor(elapsed / perStrokeDuration);
      // A browser may deliver the first rAF with a frame timestamp captured a
      // fraction before this effect's performance.now(). Never index -1.
      const nextStrokeIndex = Math.max(0, Math.min(rawStrokeIndex, renderStrokes.length - 1));
      const strokeElapsed = elapsed - rawStrokeIndex * perStrokeDuration;
      const nextProgress = Math.min(1, strokeElapsed / strokeDuration);
      const stroke = renderStrokes[nextStrokeIndex];
      const pointIndex = Math.min(stroke.points.length - 1, Math.round(nextProgress * (stroke.points.length - 1)));

      setDemoStrokeIndex(nextStrokeIndex);
      setDemoStrokeProgress(nextProgress);
      setDemoMarker(stroke.points[pointIndex] || stroke.points[0] || null);

      if (elapsed >= renderStrokes.length * perStrokeDuration) {
        setDemoActive(false);
        setDemoDone(true);
        setDemoStrokeProgress(1);
        playCueAudio(NOW_YOU_TRY_AUDIO);
        return;
      }

      demoFrameRef.current = requestAnimationFrame(animate);
    };

    demoFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (demoFrameRef.current) cancelAnimationFrame(demoFrameRef.current);
      demoFrameRef.current = null;
    };
  }, [demoActive, renderStrokes]);

  const toSVGCoords = useCallback((clientX, clientY) => {
    const svg = svgRef.current;
    if (!svg) return null;

    const rect = svg.getBoundingClientRect();
    const viewBox = svg.viewBox.baseVal;
    return {
      x: (clientX - rect.left) * (viewBox.width / rect.width),
      y: (clientY - rect.top) * (viewBox.height / rect.height)
    };
  }, []);

  const toCanvasCoords = useCallback((clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    };
  }, []);

  const markProgress = useCallback((svgX, svgY) => {
    const strokes = strokesRef.current;
    const visitedSets = visitedByStrokeRef.current;
    let hit = false;

    strokes.forEach((stroke, strokeIndex) => {
      const visitedSet = visitedSets[strokeIndex];
      if (!visitedSet) return;

      for (let index = 0; index < stroke.points.length; index += 1) {
        const dx = stroke.points[index].x - svgX;
        const dy = stroke.points[index].y - svgY;
        if (Math.sqrt(dx * dx + dy * dy) < THRESHOLD) {
          for (let offset = -1; offset <= 1; offset += 1) {
            const nearbyIndex = index + offset;
            if (nearbyIndex >= 0 && nearbyIndex < stroke.points.length) {
              visitedSet.add(nearbyIndex);
            }
          }
          hit = true;
        }
      }
    });

    if (hit) {
      const coverages = getStrokeCoverages(strokes, visitedSets);
      const { progress: nextProgress, allComplete } = calculateStrokeProgress(strokes, visitedSets);
      setStrokeCoverages(coverages);
      setProgress(nextProgress);
      if (allComplete) setIsComplete(true);
    }
  }, []);

  const completeNextStroke = useCallback(() => {
    const strokes = strokesRef.current;
    const visitedSets = visitedByStrokeRef.current;
    // A switch cannot draw a freehand pointer path. Advance the same sampled
    // subpaths, in the same order, and feed them through the same coverage
    // calculation instead of bypassing the trace with a separate completion
    // flag. Each activation therefore completes exactly one authored stroke.
    const strokeIndex = strokes.findIndex((stroke, index) => (
      ((visitedSets[index]?.size || 0) / Math.max(1, stroke.points.length)) * 100
    ) < STROKE_COMPLETION_PERCENT);
    if (strokeIndex < 0) return;
    accessibleTraceUsedRef.current = true;
    const visited = visitedSets[strokeIndex];
    strokes[strokeIndex].points.forEach((_, index) => visited.add(index));
    const coverages = getStrokeCoverages(strokes, visitedSets);
    const { progress: nextProgress, allComplete } = calculateStrokeProgress(strokes, visitedSets);
    setStrokeCoverages(coverages);
    setProgress(nextProgress);
    if (allComplete) setIsComplete(true);
  }, []);

  const drawOnCanvas = useCallback((clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    const point = toCanvasCoords(clientX, clientY);
    if (!point) return;

    context.lineWidth = 18;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "#4D96FF";
    context.globalAlpha = 0.92;

    if (lastCanvasPoint.current) {
      context.beginPath();
      context.moveTo(lastCanvasPoint.current.x, lastCanvasPoint.current.y);
      context.lineTo(point.x, point.y);
      context.stroke();
    } else {
      context.beginPath();
      context.arc(point.x, point.y, 9, 0, Math.PI * 2);
      context.fillStyle = "#4D96FF";
      context.fill();
    }

    lastCanvasPoint.current = point;
  }, [toCanvasCoords]);

  const handlePointerDown = useCallback((clientX, clientY) => {
    if (!demoDone || demoActive) return;
    isDrawingRef.current = true;
    lastCanvasPoint.current = null;
    const svgPoint = toSVGCoords(clientX, clientY);
    if (svgPoint) markProgress(svgPoint.x, svgPoint.y);
    drawOnCanvas(clientX, clientY);
  }, [demoActive, demoDone, drawOnCanvas, markProgress, toSVGCoords]);

  const handlePointerMove = useCallback((clientX, clientY) => {
    if (!isDrawingRef.current) return;
    const svgPoint = toSVGCoords(clientX, clientY);
    if (svgPoint) markProgress(svgPoint.x, svgPoint.y);
    drawOnCanvas(clientX, clientY);
  }, [drawOnCanvas, markProgress, toSVGCoords]);

  const handlePointerUp = useCallback(() => {
    isDrawingRef.current = false;
    lastCanvasPoint.current = null;
  }, []);

  const onPointerDown = useCallback(event => {
    if (!demoDone || demoActive || activePointerIdRef.current !== null) return;
    event.preventDefault();
    activePointerIdRef.current = event.pointerId;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    handlePointerDown(event.clientX, event.clientY);
  }, [demoActive, demoDone, handlePointerDown]);

  const onPointerMove = useCallback(event => {
    if (activePointerIdRef.current !== event.pointerId) return;
    event.preventDefault();
    handlePointerMove(event.clientX, event.clientY);
  }, [handlePointerMove]);

  const finishPointer = useCallback(event => {
    if (activePointerIdRef.current !== event.pointerId) return;
    event.preventDefault();
    activePointerIdRef.current = null;
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    handlePointerUp();
  }, [handlePointerUp]);

  const onLostPointerCapture = useCallback(event => {
    if (activePointerIdRef.current !== event.pointerId) return;
    activePointerIdRef.current = null;
    handlePointerUp();
  }, [handlePointerUp]);

  useEffect(() => {
    if (isComplete && !traceDonePlayedRef.current) {
      traceDonePlayedRef.current = true;
      playTraceDone();
    }
  }, [isComplete, playTraceDone]);

  useEffect(() => {
    if (!isComplete || !accessibleTraceUsedRef.current) return undefined;
    const frame = window.requestAnimationFrame(() => {
      nextActionRef.current?.querySelector("button:last-of-type")?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [isComplete]);

  const handleReset = useCallback(() => {
    visitedByStrokeRef.current = strokesRef.current.map(() => new Set());
    setProgress(0);
    setStrokeCoverages(strokesRef.current.map(() => 0));
    setIsComplete(false);
    traceDonePlayedRef.current = false;
    accessibleTraceUsedRef.current = false;
    isDrawingRef.current = false;
    activePointerIdRef.current = null;
    lastCanvasPoint.current = null;
    clearCanvas();
  }, [clearCanvas]);

  const handleReplayDemo = useCallback(() => {
    if (!renderStrokes.length) return;
    setDemoDone(false);
    setDemoActive(true);
    setDemoStrokeIndex(0);
    setDemoStrokeProgress(0);
    setDemoMarker(renderStrokes[0]?.points?.[0] || null);
  }, [renderStrokes]);

  const handleSkipDemo = useCallback(() => {
    if (demoFrameRef.current) cancelAnimationFrame(demoFrameRef.current);
    demoFrameRef.current = null;
    setDemoActive(false);
    setDemoDone(true);
    playCueAudio(NOW_YOU_TRY_AUDIO);
  }, []);

  const nextAccessibleStroke = strokeCoverages.findIndex(coverage => (
    coverage < STROKE_COMPLETION_PERCENT
  ));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.4 }}
      className="phonics-step phonics-step-tracer kg-child-flow__content"
    >
      <div className="phonics-step-heading">
        <h2>Trace the Letter</h2>
        <p>Start at the dot. Trace the big {lesson.letter}.</p>
      </div>

      <div className="phonics-trace-wrap">
        <svg className="phonics-trace-ring" viewBox="0 0 368 368" aria-hidden="true">
          <circle cx="184" cy="184" r="170" fill="none" stroke="#E0E0E0" strokeWidth="6" />
          <circle
            cx="184"
            cy="184"
            r="170"
            fill="none"
            stroke="#FFD93D"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 170}`}
            strokeDashoffset={2 * Math.PI * 170 * (1 - progress / 100)}
            transform="rotate(-90 184 184)"
            style={{ transition: "stroke-dashoffset 0.15s ease-out" }}
          />
        </svg>

        <div
          className={`phonics-trace-pad ${demoDone && !demoActive ? "" : "demo-active"}`}
          aria-label={`Trace the letter ${lesson.letter}. Start at the numbered dot and follow the arrow.`}
          data-learning-object="letter-trace"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={finishPointer}
          onPointerCancel={finishPointer}
          onLostPointerCapture={onLostPointerCapture}
        >
          <svg ref={svgRef} viewBox="0 0 400 400" className="phonics-trace-svg">
            <path
              d={tracePath}
              fill="none"
              stroke="#D0D8E0"
              strokeWidth="16"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="14 10"
            />
            <g className="phonics-trace-demo-layer" aria-hidden="true">
              {renderStrokes.map((stroke, index) => (
                <path
                  key={`demo-${stroke.pathData}-${index}`}
                  d={stroke.pathData}
                  fill="none"
                  stroke="#4D96FF"
                  strokeWidth="18"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={stroke.length}
                  strokeDashoffset={
                    index < demoStrokeIndex
                      ? 0
                      : index === demoStrokeIndex
                        ? stroke.length * (1 - demoStrokeProgress)
                        : stroke.length
                  }
                />
              ))}
              {demoActive && demoMarker && (
                <circle className="phonics-trace-demo-marker" cx={demoMarker.x} cy={demoMarker.y} r="15" />
              )}
            </g>
            <g className="phonics-trace-hints" aria-hidden="true">
              {renderStrokes.map((stroke, index) => {
                const { start, arrowStart, angle } = getHintGeometry(stroke);
                const faded = (strokeCoverages[index] || 0) >= 80;
                return (
                  <g className={faded ? "is-faded" : ""} key={`hint-${stroke.pathData}-${index}`}>
                    <circle cx={start.x} cy={start.y} r="17" />
                    <text x={start.x} y={start.y + 6}>{index + 1}</text>
                    <path
                      d="M -12 -8 L 12 0 L -12 8 Z"
                      transform={`translate(${arrowStart.x} ${arrowStart.y}) rotate(${angle})`}
                    />
                  </g>
                );
              })}
            </g>
          </svg>

          <canvas
            ref={canvasRef}
            width={400}
            height={400}
            className="phonics-trace-canvas"
          />

          <AnimatePresence>
            {isComplete && (
              <motion.div
                className="phonics-complete-flash"
                initial={{ opacity: 0.6 }}
                animate={{ opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="phonics-step-status">
        <AnimatePresence mode="wait">
          {isComplete ? (
            <motion.p key="done" className="success" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}>
              Great job!
            </motion.p>
          ) : demoActive ? (
            <motion.p key="demo" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              Watch first...
            </motion.p>
          ) : !demoDone ? (
            <motion.p key="demo-ready" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              Watch the strokes, then try.
            </motion.p>
          ) : (
            <motion.p key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              Trace the dotted lines! ({progress}%)
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div className="phonics-step-actions">
        <AudioButton src={lesson.letterNameAudio} fallbackText={`Letter ${lesson.letter}`} size={56} />
        {!demoDone && (
          <PhonicsButton variant="secondary" size="small" onClick={handleSkipDemo}>
            Skip
          </PhonicsButton>
        )}
        {demoDone && !isComplete && (
          <PhonicsButton variant="secondary" size="small" onClick={handleReplayDemo}>
            Show me
          </PhonicsButton>
        )}
        {demoDone && !isComplete && nextAccessibleStroke >= 0 && (
          <PhonicsButton variant="secondary" size="small" onClick={completeNextStroke}>
            Trace stroke {nextAccessibleStroke + 1} of {renderStrokes.length}
          </PhonicsButton>
        )}
        <AnimatePresence>
          {isComplete && (
            <motion.div
              ref={nextActionRef}
              className="phonics-inline-actions"
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
            >
              <PhonicsButton variant="secondary" size="small" onClick={handleReset}>
                Try Again
              </PhonicsButton>
              <PhonicsButton onClick={() => onComplete({ step: "trace", completionKind: "supported", audioDelivery: "not_required", firstResponse: null, attempts: 1, supportUsed: ["trace_model", ...(accessibleTraceUsedRef.current ? ["switch_trace"] : [])], independent: false, strokeCoverages })}>Next Step</PhonicsButton>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});

export default StepTracer;

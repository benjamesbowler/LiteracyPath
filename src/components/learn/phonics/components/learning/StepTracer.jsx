import { memo, useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePhonicsAudio } from "../../../../../hooks/usePhonicsAudio";
import AudioButton from "../AudioButton";
import PhonicsButton from "../PhonicsButton";

const SVG_NS = "http://www.w3.org/2000/svg";
const THRESHOLD = 22;
const STROKE_COMPLETION_PERCENT = 90;
const TOTAL_TRACE_SAMPLES = 200;
const MIN_SAMPLES_PER_STROKE = 24;

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

  const coverages = strokes.map((stroke, strokeIndex) => {
    const total = stroke.points.length || 1;
    return Math.min(100, (visitedSets[strokeIndex]?.size || 0) / total * 100);
  });

  return {
    progress: Math.round(coverages.reduce((sum, coverage) => sum + coverage, 0) / coverages.length),
    allComplete: coverages.every(coverage => coverage >= STROKE_COMPLETION_PERCENT)
  };
}

const StepTracer = memo(function StepTracer({ lesson, onComplete }) {
  const svgRef = useRef(null);
  const canvasRef = useRef(null);
  const visitedByStrokeRef = useRef([]);
  const strokesRef = useRef([]);
  const isDrawingRef = useRef(false);
  const lastCanvasPoint = useRef(null);
  const traceDonePlayedRef = useRef(false);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const { play: playTraceDone } = usePhonicsAudio("/audio/child-mode/clean-human/phrases/amazing-work.mp3", "Amazing work");
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
      return sampleSubpath(subpaths[index], sampleCount);
    });

    strokesRef.current = strokes;
    visitedByStrokeRef.current = strokes.map(() => new Set());
    setProgress(0);
    setIsComplete(false);
    traceDonePlayedRef.current = false;
    clearCanvas();
    lastCanvasPoint.current = null;
  }, [clearCanvas, tracePath]);

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
      const { progress: nextProgress, allComplete } = calculateStrokeProgress(strokes, visitedSets);
      setProgress(nextProgress);
      if (allComplete) setIsComplete(true);
    }
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
    isDrawingRef.current = true;
    lastCanvasPoint.current = null;
    const svgPoint = toSVGCoords(clientX, clientY);
    if (svgPoint) markProgress(svgPoint.x, svgPoint.y);
    drawOnCanvas(clientX, clientY);
  }, [drawOnCanvas, markProgress, toSVGCoords]);

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

  const onMouseDown = useCallback(event => {
    handlePointerDown(event.clientX, event.clientY);
  }, [handlePointerDown]);

  const onMouseMove = useCallback(event => {
    handlePointerMove(event.clientX, event.clientY);
  }, [handlePointerMove]);

  const onMouseUp = useCallback(() => {
    handlePointerUp();
  }, [handlePointerUp]);

  const onTouchStart = useCallback(event => {
    event.preventDefault();
    const touch = event.touches[0];
    if (touch) handlePointerDown(touch.clientX, touch.clientY);
  }, [handlePointerDown]);

  const onTouchMove = useCallback(event => {
    event.preventDefault();
    const touch = event.touches[0];
    if (touch) handlePointerMove(touch.clientX, touch.clientY);
  }, [handlePointerMove]);

  const onTouchEnd = useCallback(event => {
    event.preventDefault();
    handlePointerUp();
  }, [handlePointerUp]);

  useEffect(() => {
    if (isComplete && !traceDonePlayedRef.current) {
      traceDonePlayedRef.current = true;
      playTraceDone();
    }
  }, [isComplete, playTraceDone]);

  const handleReset = useCallback(() => {
    visitedByStrokeRef.current = strokesRef.current.map(() => new Set());
    setProgress(0);
    setIsComplete(false);
    traceDonePlayedRef.current = false;
    isDrawingRef.current = false;
    lastCanvasPoint.current = null;
    clearCanvas();
  }, [clearCanvas]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.4 }}
      className="phonics-step phonics-step-tracer"
    >
      <div className="phonics-step-heading">
        <h2>Trace the Letter</h2>
        <p>Use your finger to trace the letter {lesson.letter}</p>
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
          className="phonics-trace-pad"
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
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
          ) : (
            <motion.p key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              Trace the dotted lines! ({progress}%)
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div className="phonics-step-actions">
        <AudioButton src={lesson.letterNameAudio} fallbackText={`Letter ${lesson.letter}`} size={56} />
        <AnimatePresence>
          {isComplete && (
            <motion.div
              className="phonics-inline-actions"
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
            >
              <PhonicsButton variant="secondary" size="small" onClick={handleReset}>
                Try Again
              </PhonicsButton>
              <PhonicsButton onClick={onComplete}>Next Step</PhonicsButton>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});

export default StepTracer;

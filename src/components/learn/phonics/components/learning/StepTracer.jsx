import { memo, useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePhonicsAudio } from "../../../../../hooks/usePhonicsAudio";
import AudioButton from "../AudioButton";
import PhonicsButton from "../PhonicsButton";

const THRESHOLD = 30;
const COMPLETION_THRESHOLD = 85;

const StepTracer = memo(function StepTracer({ lesson, onComplete }) {
  const svgRef = useRef(null);
  const pathRef = useRef(null);
  const visitedRef = useRef(new Set());
  const pointsRef = useRef([]);
  const totalPointsRef = useRef(0);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isTracing, setIsTracing] = useState(false);
  const [pathLength, setPathLength] = useState(1000);
  const { play: playTraceDone } = usePhonicsAudio("/audio/trace-done.mp3", "Great tracing");
  const tracePath = lesson.traceSVG;

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;

    const length = path.getTotalLength();
    setPathLength(length);

    const samples = 200;
    const points = [];
    for (let i = 0; i <= samples; i += 1) {
      const point = path.getPointAtLength((i / samples) * length);
      points.push({ x: point.x, y: point.y });
    }

    pointsRef.current = points;
    totalPointsRef.current = points.length;
    visitedRef.current.clear();
    setProgress(0);
    setIsComplete(false);
  }, [tracePath]);

  const getSVGCoordinates = useCallback((clientX, clientY) => {
    const svg = svgRef.current;
    if (!svg) return null;

    const rect = svg.getBoundingClientRect();
    const viewBox = svg.viewBox.baseVal;
    return {
      x: (clientX - rect.left) * (viewBox.width / rect.width),
      y: (clientY - rect.top) * (viewBox.height / rect.height)
    };
  }, []);

  const findClosestSegment = useCallback((x, y) => {
    const points = pointsRef.current;
    let minDistance = Infinity;
    let closestIndex = -1;

    for (let i = 0; i < points.length; i += 1) {
      const dx = points[i].x - x;
      const dy = points[i].y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = i;
      }
    }

    return minDistance < THRESHOLD ? closestIndex : -1;
  }, []);

  const handlePointerMove = useCallback((clientX, clientY) => {
    const coordinates = getSVGCoordinates(clientX, clientY);
    if (!coordinates) return;

    const segmentIndex = findClosestSegment(coordinates.x, coordinates.y);
    if (segmentIndex < 0) return;

    visitedRef.current.add(segmentIndex);
    for (let i = -2; i <= 2; i += 1) {
      const nearbyIndex = segmentIndex + i;
      if (nearbyIndex >= 0 && nearbyIndex < totalPointsRef.current) {
        visitedRef.current.add(nearbyIndex);
      }
    }

    setProgress(Math.min(100, Math.round((visitedRef.current.size / totalPointsRef.current) * 100)));
  }, [findClosestSegment, getSVGCoordinates]);

  const handleMouseDown = useCallback((event) => {
    setIsTracing(true);
    handlePointerMove(event.clientX, event.clientY);
  }, [handlePointerMove]);

  const handleMouseMove = useCallback((event) => {
    if (!isTracing) return;
    handlePointerMove(event.clientX, event.clientY);
  }, [handlePointerMove, isTracing]);

  const handleMouseUp = useCallback(() => {
    setIsTracing(false);
  }, []);

  const handleTouchStart = useCallback((event) => {
    event.preventDefault();
    setIsTracing(true);
    const touch = event.touches[0];
    if (touch) handlePointerMove(touch.clientX, touch.clientY);
  }, [handlePointerMove]);

  const handleTouchMove = useCallback((event) => {
    event.preventDefault();
    if (!isTracing) return;
    const touch = event.touches[0];
    if (touch) handlePointerMove(touch.clientX, touch.clientY);
  }, [handlePointerMove, isTracing]);

  const handleTouchEnd = useCallback((event) => {
    event.preventDefault();
    setIsTracing(false);
  }, []);

  useEffect(() => {
    if (progress >= COMPLETION_THRESHOLD && !isComplete) {
      setIsComplete(true);
      playTraceDone();
    }
  }, [isComplete, playTraceDone, progress]);

  const handleReset = useCallback(() => {
    visitedRef.current.clear();
    setProgress(0);
    setIsComplete(false);
  }, []);

  const strokeDashoffset = pathLength - (pathLength * progress) / 100;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.4 }}
      className="phonics-step phonics-step-tracer"
    >
      <motion.div className="phonics-step-heading" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h2>Trace the Letter</h2>
        <p>Use your finger to trace the letter {lesson.letter}</p>
      </motion.div>

      <motion.div className="phonics-trace-wrap" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
        <svg className="phonics-trace-ring" width="368" height="368" viewBox="0 0 368 368" aria-hidden="true">
          <circle cx="184" cy="184" r="170" fill="none" stroke="#E0E0E0" strokeWidth="6" />
          <motion.circle
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
          />
        </svg>

        <div
          className="phonics-trace-pad"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <svg ref={svgRef} viewBox="0 0 400 400" className="phonics-trace-svg">
            <path d={tracePath} fill="none" stroke="#E0E0E0" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="12 8" />
            <path
              ref={pathRef}
              d={tracePath}
              fill="none"
              stroke="#4D96FF"
              strokeWidth="14"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={pathLength}
              strokeDashoffset={strokeDashoffset}
            />
          </svg>

          <AnimatePresence>
            {isComplete && (
              <motion.div className="phonics-complete-flash" initial={{ opacity: 0.8 }} animate={{ opacity: 0 }} exit={{ opacity: 0 }} />
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <div className="phonics-step-status">
        <AnimatePresence mode="wait">
          {isComplete ? (
            <motion.p key="complete" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}>
              Great job!
            </motion.p>
          ) : (
            <motion.p key="tracing" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              Trace the dotted lines! ({progress}%)
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div className="phonics-step-actions">
        <AudioButton src={lesson.letterNameAudio} fallbackText={`Letter ${lesson.letter}`} size={64} />
        <AnimatePresence>
          {isComplete && (
            <motion.div className="phonics-inline-actions" initial={{ opacity: 0, scale: 0.8, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}>
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

import CycleButton from "./CycleButton.jsx";
import { useEffect, useRef, useState } from "react";
import { ArrowCounterClockwise, Eye, HandTap, PencilLine, Sparkle } from "@phosphor-icons/react";
import { CYCLE_TRACE_RULES, createCycleTraceModel, cycleTraceCompletion, evaluateCycleTrace } from "./cycleTraceRules.js";
import "./cycle-trace.css";

const EMPTY_EVALUATION = { progress: 0, coverage: [], pass: false };

// Keyed internally as well as by the round renderer: a new letter always gets
// fresh ink, even if the parent reuses the component between question records.
export default function CycleTraceActivity(props) {
  const grapheme = props.round?.targetGrapheme || props.round?.letter || "";
  return <TraceRound key={`${props.round?.id || "trace"}:${grapheme}`} {...props} grapheme={grapheme} />;
}

function TraceRound({ round, grapheme, disabled = false, onCommit, supportLevel = 0,
  reducedMotion = false, onInteraction, onRetry, onSupport, onMediaFailure, mediaRevision = 0 }) {
  const [model] = useState(() => createCycleTraceModel(grapheme));
  const [ink, setInk] = useState([]);
  const [liveInk, setLiveInk] = useState([]);
  const [evaluation, setEvaluation] = useState(EMPTY_EVALUATION);
  const [assistedIndexes, setAssistedIndexes] = useState([]);
  const [demoRun, setDemoRun] = useState(0);
  const [message, setMessage] = useState("");
  const [isDone, setIsDone] = useState(false);
  const svgRef = useRef(null);
  const currentStroke = useRef([]);
  const activePointer = useRef(null);
  const inkRef = useRef([]);
  const assistedRef = useRef([]);
  const supportRef = useRef([]);
  const committed = useRef(false);
  const attempts = useRef(1);
  const releases = useRef(0);
  const firstResponse = useRef(null);
  const lastInteraction = useRef(-Infinity);

  useEffect(() => {
    if (!disabled) return undefined;
    const pointerId = activePointer.current;
    activePointer.current = null;
    currentStroke.current = [];
    if (pointerId !== null && svgRef.current?.hasPointerCapture?.(pointerId)) svgRef.current.releasePointerCapture(pointerId);
    // Pausing can make the pad inert before its release event arrives. Cancel
    // only the held gesture; accepted strokes remain available on resume.
    const frame = requestAnimationFrame(() => setLiveInk([]));
    return () => cancelAnimationFrame(frame);
  }, [disabled]);

  useEffect(() => {
    const cancel = () => {
      const pointerId = activePointer.current;
      activePointer.current = null;
      currentStroke.current = [];
      if (pointerId !== null && svgRef.current?.hasPointerCapture?.(pointerId)) svgRef.current.releasePointerCapture(pointerId);
      setLiveInk([]);
    };
    window.addEventListener("blur", cancel);
    return () => window.removeEventListener("blur", cancel);
  }, []);

  function activity(force = false) {
    const now = performance.now();
    if (force || now - lastInteraction.current >= 900) {
      lastInteraction.current = now;
      onInteraction?.();
    }
  }

  function pointFor(event) {
    const svg = svgRef.current;
    const inverse = svg?.getScreenCTM()?.inverse();
    if (!inverse) return null;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(inverse);
    return [point.x, point.y];
  }

  function finishIfComplete(next) {
    if (!next.pass || committed.current) return;
    committed.current = true;
    const accepted = onCommit?.(cycleTraceCompletion({ model, evaluation: next, supportLevel,
      supportUsed: supportRef.current, attempts: attempts.current,
      firstResponse: firstResponse.current, drawingReleases: releases.current }));
    if (accepted === false) {
      committed.current = false;
      return;
    }
    setIsDone(true);
    setMessage("You made it!");
  }

  function begin(event) {
    if (disabled || committed.current || !model || activePointer.current !== null || event.button > 0) return;
    const point = pointFor(event);
    if (!point) return;
    event.preventDefault();
    activePointer.current = event.pointerId;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    currentStroke.current = [point];
    setLiveInk([point]);
    setDemoRun(0);
    setMessage("");
    activity(true);
  }

  function move(event) {
    if (activePointer.current !== event.pointerId || disabled) return;
    event.preventDefault();
    const point = pointFor(event);
    if (!point) return;
    const previous = currentStroke.current.at(-1);
    if (previous && Math.hypot(point[0] - previous[0], point[1] - previous[1]) < 2) return;
    currentStroke.current = [...currentStroke.current, point];
    setLiveInk(currentStroke.current);
    activity();
  }

  function release(event, cancelled = false) {
    if (activePointer.current !== event.pointerId) return;
    activePointer.current = null;
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    const end = !cancelled && pointFor(event);
    const gesture = end ? [...currentStroke.current, end] : currentStroke.current;
    currentStroke.current = [];
    setLiveInk([]);
    if (disabled || cancelled) return;
    activity(true);
    releases.current += 1;
    const next = evaluateCycleTrace({ model, drawnStrokes: [...inkRef.current, gesture], assistedStrokeIndexes: assistedRef.current });
    // A partial genuine stroke is progress, not an incorrect letter response.
    // Keep first failed gesture separately without overwriting it on success.
    if (next.rejectedCount) {
      firstResponse.current ||= { correct: false, reason: next.reason, progress: next.progress };
      attempts.current += 1;
    } else if (next.pass) firstResponse.current ||= { correct: true, progress: next.progress };
    inkRef.current = next.acceptedStrokes;
    setInk(next.acceptedStrokes);
    setEvaluation(next);
    if (next.pass) finishIfComplete(next);
    else {
      setMessage(next.rejectedCount ? "Follow the trail" : "Keep going");
      onRetry?.({ reason: next.reason, progress: next.progress, attempts: attempts.current });
    }
  }

  function reset() {
    if (disabled || committed.current) return;
    currentStroke.current = [];
    activePointer.current = null;
    inkRef.current = [];
    assistedRef.current = [];
    setInk([]);
    setLiveInk([]);
    setAssistedIndexes([]);
    setEvaluation(EMPTY_EVALUATION);
    setMessage("");
    activity(true);
  }

  function showModel() {
    if (disabled || committed.current) return;
    supportRef.current = [...new Set([...supportRef.current, "trace_demo"])];
    setDemoRun(run => run + 1);
    onSupport?.("trace_demo");
    activity(true);
  }

  function helpTrace() {
    if (disabled || committed.current || !model) return;
    const before = evaluateCycleTrace({ model, drawnStrokes: inkRef.current, assistedStrokeIndexes: assistedRef.current });
    if (before.pass) { finishIfComplete(before); return; }
    let index = before.coverage.findIndex(value => value < CYCLE_TRACE_RULES.strokeCoverage);
    if (index < 0 && !before.pass) index = model.strokes.findIndex((_, strokeIndex) => !assistedRef.current.includes(strokeIndex));
    if (index < 0) return;
    assistedRef.current = [...assistedRef.current, index];
    supportRef.current = [...new Set([...supportRef.current, "switch_trace"])];
    setAssistedIndexes(assistedRef.current);
    setDemoRun(0);
    onSupport?.("switch_trace");
    activity(true);
    const next = evaluateCycleTrace({ model, drawnStrokes: inkRef.current, assistedStrokeIndexes: assistedRef.current });
    setEvaluation(next);
    setMessage(next.pass ? "" : "One more trail");
    finishIfComplete(next);
  }

  if (!model) return <div className="cycle-trace" role="status">This letter trail is unavailable.</div>;
  const picture = typeof round?.image === "string" ? round.image : round?.image?.src;
  const nextStroke = evaluation.coverage.findIndex(value => value < CYCLE_TRACE_RULES.strokeCoverage);
  const hintStroke = model.strokes[Math.max(0, nextStroke)];
  const start = hintStroke?.points[0];
  const hintEnd = hintStroke?.points[Math.min(5, hintStroke.points.length - 1)];
  const hintAngle = start && hintEnd ? Math.atan2(hintEnd[1] - start[1], hintEnd[0] - start[0]) * 180 / Math.PI : 0;
  const transform = `translate(${model.offsetX} ${model.offsetY}) scale(${model.scale})`;

  return (
    <section className={`cycle-trace${isDone ? " cycle-trace--complete" : ""}`}
      data-mechanic-stage="cycle-trace" data-reduced-motion={reducedMotion ? "true" : "false"}>
      <div className="cycle-trace__workspace">
        <aside className="cycle-trace__picture-card">
          {picture && <img key={`${picture}:${mediaRevision}`} src={picture} alt={round?.targetWord || round?.word || "Letter picture"} draggable="false" onError={onMediaFailure} />}
          <span className="cycle-trace__target">{grapheme}</span>
          <div className="cycle-trace__collect" aria-hidden="true">
            <PencilLine weight="fill" /><span /><Sparkle weight="fill" />
          </div>
        </aside>
        <div className="cycle-trace__drawing">
          <div className="cycle-trace__caption">
            <span>Trace <strong>{grapheme}</strong></span>
            <span className="cycle-trace__status" role="status" aria-live="polite">{message}</span>
          </div>
          <svg ref={svgRef} className="cycle-trace__pad" viewBox={`0 0 ${model.width} ${model.height}`}
            role="group" aria-label={`Trace ${grapheme}. Follow the wide trail with your finger, or use Help me trace.`}
            aria-disabled={disabled || isDone} data-child-primary onPointerDown={begin} onPointerMove={move}
            onPointerUp={event => release(event)} onPointerCancel={event => release(event, true)}
            onLostPointerCapture={event => release(event, true)}>
            <g aria-hidden="true">
              <path className="cycle-trace__guide" d="M30 292 H570" />
              {model.strokes.map((stroke, index) => (
                <g key={`target-${index}`} transform={`${transform} translate(${stroke.charIndex * 100} 0)`}>
                  <path d={stroke.path} className="cycle-trace__path-shadow" vectorEffect="non-scaling-stroke" />
                  <path d={stroke.path} className="cycle-trace__path" vectorEffect="non-scaling-stroke" data-cycle-trace-target data-stroke-index={index} />
                  <path d={stroke.path} className="cycle-trace__path-dots" vectorEffect="non-scaling-stroke" />
                </g>
              ))}
              {assistedIndexes.map(index => <polyline key={`assisted-${index}`} className="cycle-trace__assisted"
                points={model.strokes[index].points.map(point => point.join(",")).join(" ")} />)}
              {[...ink, ...(liveInk.length ? [liveInk] : [])].map((stroke, index) => stroke.length > 1
                ? <polyline className="cycle-trace__ink" key={`ink-${index}`} points={stroke.map(point => point.join(",")).join(" ")} />
                : <circle className="cycle-trace__ink-dot" key={`ink-${index}`} cx={stroke[0][0]} cy={stroke[0][1]} r="8" />)}
              {!isDone && start && <g className="cycle-trace__start" transform={`translate(${start[0]} ${start[1]})`}>
                <circle r="16" /><path d="M-4 -7 L5 0 L-4 7" transform={`rotate(${hintAngle})`} />
              </g>}
              {demoRun > 0 && <g key={`demo-${demoRun}`} className="cycle-trace__demo" data-trace-model>
                {model.strokes.map((stroke, index) => <polyline key={`demo-stroke-${index}`} points={stroke.points.map(point => point.join(",")).join(" ")}
                  pathLength="1" style={{ animationDelay: `${index * Math.min(0.65, 3 / model.strokes.length)}s` }} />)}
              </g>}
              {isDone && <g className="cycle-trace__finish-mark" transform="translate(548 48)"><circle r="28" /><path d="M-12 0 L-3 9 L14 -11" /></g>}
            </g>
          </svg>
          <div className="cycle-trace__progress" role="progressbar" aria-label="Letter trail filled"
            aria-valuemin={0} aria-valuemax={100} aria-valuenow={evaluation.progress}>
            <span style={{ width: `${evaluation.progress}%` }} />
          </div>
        </div>
      </div>
      <div className="cycle-trace__tools" role="group" aria-label="Tracing tools">
        <CycleButton type="button" disabled={disabled || isDone} onClick={reset} aria-label="Erase and start again"><ArrowCounterClockwise weight="bold" /><span>Again</span></CycleButton>
        <CycleButton type="button" disabled={disabled || isDone} onClick={showModel} aria-label="Show me the letter trail"><Eye weight="fill" /><span>Show me</span></CycleButton>
        <CycleButton type="button" disabled={disabled || isDone} onClick={helpTrace} aria-label="Help me trace one part"><HandTap weight="fill" /><span>Help me</span></CycleButton>
      </div>
    </section>
  );
}

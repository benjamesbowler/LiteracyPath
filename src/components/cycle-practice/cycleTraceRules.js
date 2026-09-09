import { LETTER_STROKES } from "../../data/letterStrokes.js";

// These are motor-practice rules, never handwriting proficiency thresholds.
// A broad corridor and partial endpoints forgive a young child's finger drift.
export const CYCLE_TRACE_RULES = Object.freeze({
  width: 600,
  height: 340,
  corridor: 23,
  strokeCoverage: 0.68,
  gesturePrecision: 0.55,
  minimumTravel: 10,
  minimumShapeTravel: 0.4,
  maximumTravelRatio: 4
});

const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const isPoint = p => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]);
const lengthOf = points => points.slice(1).reduce((length, point, i) => length + distance(points[i], point), 0);

function resample(points, spacing = 4) {
  if (points.length < 2) return points;
  const lengths = [0];
  for (let i = 1; i < points.length; i += 1) lengths.push(lengths[i - 1] + distance(points[i - 1], points[i]));
  const total = lengths.at(-1);
  if (total < 0.1) return [points[0]];
  const count = Math.min(1200, Math.max(2, Math.ceil(total / spacing) + 1));
  let segment = 1;
  return Array.from({ length: count }, (_, i) => {
    const offset = total * i / (count - 1);
    while (segment < lengths.length - 1 && lengths[segment] < offset) segment += 1;
    const ratio = (offset - lengths[segment - 1]) / (lengths[segment] - lengths[segment - 1] || 1);
    return [0, 1].map(axis => points[segment - 1][axis] + (points[segment][axis] - points[segment - 1][axis]) * ratio);
  });
}

// The current authored manuscript source uses absolute M/L/C paths. Sampling
// those exact curves here makes geometry identical in SVG and the pure scorer.
function sampleAuthoredPath(path) {
  const tokens = path.match(/[MLC]|-?\d+(?:\.\d+)?/g) || [];
  const points = [];
  let i = 0;
  while (i < tokens.length) {
    const command = tokens[i++];
    if (command === "M" || command === "L") {
      points.push([Number(tokens[i++]), Number(tokens[i++])]);
    } else if (command === "C") {
      const start = points.at(-1);
      const a = [Number(tokens[i++]), Number(tokens[i++])];
      const b = [Number(tokens[i++]), Number(tokens[i++])];
      const end = [Number(tokens[i++]), Number(tokens[i++])];
      for (let step = 1; step <= 32; step += 1) {
        const t = step / 32;
        points.push([0, 1].map(axis => (1 - t) ** 3 * start[axis]
          + 3 * (1 - t) ** 2 * t * a[axis]
          + 3 * (1 - t) * t ** 2 * b[axis]
          + t ** 3 * end[axis]));
      }
    } else {
      throw new Error(`Unsupported authored letter path: ${command}`);
    }
  }
  return points;
}

export function createCycleTraceModel(grapheme = "") {
  const chars = Array.from(String(grapheme).trim());
  if (!chars.length || chars.some(char => !LETTER_STROKES[char])) return null;
  const authored = chars.flatMap((char, charIndex) => LETTER_STROKES[char].map(path => ({
    charIndex, path, points: sampleAuthoredPath(path).map(([x, y]) => [x + charIndex * 100, y])
  })));
  const allPoints = authored.flatMap(stroke => stroke.points);
  const xs = allPoints.map(point => point[0]), ys = allPoints.map(point => point[1]);
  const bounds = { left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys) };
  const scale = Math.min(5.2, 488 / Math.max(1, bounds.right - bounds.left), 250 / Math.max(1, bounds.bottom - bounds.top));
  const offsetX = (CYCLE_TRACE_RULES.width - (bounds.right + bounds.left) * scale) / 2;
  const offsetY = (CYCLE_TRACE_RULES.height - (bounds.bottom + bounds.top) * scale) / 2;
  const strokes = authored.map(stroke => {
    const points = resample(stroke.points.map(([x, y]) => [offsetX + x * scale, offsetY + y * scale]));
    return { ...stroke, points, length: lengthOf(points), isDot: points.length === 1 };
  });
  return { grapheme: chars.join(""), chars, strokes, scale, offsetX, offsetY,
    width: CYCLE_TRACE_RULES.width, height: CYCLE_TRACE_RULES.height,
    length: strokes.reduce((total, stroke) => total + stroke.length, 0) };
}

function near(point, points, radius) {
  return points.some(candidate => distance(point, candidate) <= radius);
}

/**
 * Evaluate the visible shape without prescribing start, direction or order.
 * Invalid gestures contribute no coverage, so tapping along the model and
 * filling the pad with a scribble cannot turn into a successful trace. Valid
 * partial strokes survive retries and may be joined over any number of lifts.
 */
export function evaluateCycleTrace({ model, drawnStrokes = [], assistedStrokeIndexes = [] } = {}) {
  if (!model?.strokes?.length) return { pass: false, progress: 0, reason: "unavailable", coverage: [], acceptedStrokes: [], rejectedCount: 0 };
  const corridor = CYCLE_TRACE_RULES.corridor;
  const targetPoints = model.strokes.flatMap(stroke => stroke.points);
  const dotPoints = model.strokes.filter(stroke => stroke.isDot).flatMap(stroke => stroke.points);
  const acceptedStrokes = [];
  let rejectedCount = 0;
  for (const gesture of drawnStrokes) {
    const raw = Array.isArray(gesture) ? gesture.filter(isPoint) : [];
    if (!raw.length) continue;
    const points = resample(raw);
    const travel = lengthOf(points);
    const dot = travel < CYCLE_TRACE_RULES.minimumTravel && near(points[0], dotPoints, corridor);
    const precision = points.filter(point => near(point, targetPoints, corridor)).length / points.length;
    if (dot || (travel >= CYCLE_TRACE_RULES.minimumTravel
      && travel <= model.length * CYCLE_TRACE_RULES.maximumTravelRatio
      && precision >= CYCLE_TRACE_RULES.gesturePrecision)) acceptedStrokes.push(points);
    else rejectedCount += 1;
  }
  const evidence = acceptedStrokes.flat();
  const assisted = new Set(assistedStrokeIndexes);
  const coverage = model.strokes.map((stroke, index) => assisted.has(index) ? 1
    : stroke.points.filter(point => near(point, evidence, corridor)).length / stroke.points.length);
  const unassistedLength = model.strokes.reduce((total, stroke, index) => total + (assisted.has(index) ? 0 : stroke.length), 0);
  const hasTravel = acceptedStrokes.reduce((total, points) => total + lengthOf(points), 0)
    >= unassistedLength * CYCLE_TRACE_RULES.minimumShapeTravel;
  const pass = coverage.every(value => value >= CYCLE_TRACE_RULES.strokeCoverage) && hasTravel;
  return {
    pass,
    progress: Math.round(coverage.reduce((total, value) => total + Math.min(1, value / CYCLE_TRACE_RULES.strokeCoverage), 0) / coverage.length * 100),
    reason: pass ? "complete" : rejectedCount ? "follow-path" : "keep-going",
    coverage,
    acceptedStrokes,
    rejectedCount
  };
}

export function cycleTraceCompletion({ model, evaluation, supportLevel = 0, supportUsed = [], attempts = 1, firstResponse = null, drawingReleases = 0 } = {}) {
  if (!evaluation?.pass) return null;
  const evidence = {
    independent: false,
    measure: "support_only",
    completionKind: "supported",
    supportLevel,
    supportUsed: [...new Set(["trace_model", ...supportUsed])],
    firstResponse,
    attempts,
    drawingReleases,
    strokeCoverage: evaluation.coverage.map(coverage => Math.round(coverage * 100) / 100),
    directionScored: false,
    strokeOrderScored: false
  };
  return { correct: true, selected: model.grapheme, construct: "grapheme_formation_practice", evidence,
    completionKind: "supported", independent: false, supportUsed: evidence.supportUsed, attempts, firstResponse };
}

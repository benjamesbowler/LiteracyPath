import test from "node:test";
import assert from "node:assert/strict";
import { LETTER_STROKES } from "../../src/data/letterStrokes.js";
import { createCycleTraceModel, cycleTraceCompletion, evaluateCycleTrace } from "../../src/components/cycle-practice/cycleTraceRules.js";

const score = (model, drawnStrokes, extra = {}) => evaluateCycleTrace({ model, drawnStrokes, ...extra });
const line = (a, b, count = 30) => Array.from({ length: count }, (_, i) => [
  a[0] + (b[0] - a[0]) * i / (count - 1), a[1] + (b[1] - a[1]) * i / (count - 1)
]);

test("every current lowercase and uppercase manuscript glyph works with the exact authored shape", () => {
  for (const grapheme of Object.keys(LETTER_STROKES)) {
    const model = createCycleTraceModel(grapheme);
    assert.ok(model, grapheme);
    assert.ok(model.strokes.every(stroke => stroke.points.length > 0 && stroke.points.every(point => point.every(Number.isFinite))), grapheme);
    assert.equal(score(model, model.strokes.map(stroke => stroke.points)).pass, true, grapheme);
  }
});

test("letter teams use all the current letter forms and require both letters", () => {
  for (const grapheme of ["sh", "ch", "th", "ng", "ck", "qu", "ee", "igh", "tch"]) {
    const model = createCycleTraceModel(grapheme);
    assert.equal(score(model, model.strokes.map(stroke => stroke.points)).pass, true, grapheme);
    assert.equal(score(model, model.strokes.filter(stroke => stroke.charIndex === 0).map(stroke => stroke.points)).pass, false, `${grapheme}: missing letter`);
  }
});

test("a preschool wobbly trace passes in reverse stroke direction and reverse order", () => {
  for (const grapheme of ["a", "M", "s", "sh", "igh"]) {
    const model = createCycleTraceModel(grapheme);
    const strokes = model.strokes.map((stroke, si) => stroke.points.map(([x, y], pi) => [
      x + 12 * Math.sin(pi * 0.75 + si), y + 10 * Math.cos(pi * 0.7 + si)
    ]).reverse()).reverse();
    assert.equal(score(model, strokes).pass, true, grapheme);
  }
});

test("short starts and endings are forgiven without requiring a second faded-model attempt", () => {
  const model = createCycleTraceModel("A");
  const shortened = model.strokes.map(stroke => stroke.points.slice(5, -5));
  const result = score(model, shortened);
  assert.equal(result.pass, true);
  assert.equal(cycleTraceCompletion({ model, evaluation: result }).correct, true);
});

test("multiple lifts preserve partial strokes and automatically reach completion", () => {
  const model = createCycleTraceModel("m");
  let retained = [];
  let result;
  for (const stroke of model.strokes) {
    const middle = Math.floor(stroke.points.length / 2);
    for (const part of [stroke.points.slice(0, middle + 1), stroke.points.slice(middle)]) {
      result = score(model, [...retained, part]);
      retained = result.acceptedStrokes;
    }
  }
  assert.equal(result.pass, true);
  assert.equal(retained.length, model.strokes.length * 2);
});

test("a single long gesture may connect the letter strokes without enforcing lifts", () => {
  const model = createCycleTraceModel("A");
  assert.equal(score(model, [model.strokes.flatMap(stroke => stroke.points)]).pass, true);
});

test("one tap and repeated taps around the entire target cannot satisfy tracing", () => {
  for (const grapheme of ["l", "a", "i", "sh"]) {
    const model = createCycleTraceModel(grapheme);
    assert.equal(score(model, [[model.strokes[0].points[0]]]).pass, false, grapheme);
    assert.equal(score(model, model.strokes.flatMap(stroke => stroke.points.map(point => [point]))).pass, false, grapheme);
  }
});

test("tapping an actual i or j dot is accepted after the real stem is drawn", () => {
  for (const grapheme of ["i", "j"]) {
    const model = createCycleTraceModel(grapheme);
    const lineStrokes = model.strokes.filter(stroke => !stroke.isDot).map(stroke => stroke.points);
    assert.equal(score(model, lineStrokes).pass, false, grapheme);
    assert.equal(score(model, [...lineStrokes, ...model.strokes.filter(stroke => stroke.isDot).map(stroke => [stroke.points[0]])]).pass, true, grapheme);
  }
});

test("pad-filling box and crossing scribbles do not pass or erase prior useful tracing", () => {
  const model = createCycleTraceModel("A");
  const scribble = [
    ...line([10, 10], [580, 10]), ...line([580, 10], [580, 330]),
    ...line([580, 330], [10, 330]), ...line([10, 330], [10, 10]),
    ...line([10, 10], [580, 330]), ...line([580, 330], [580, 10]),
    ...line([580, 10], [10, 330])
  ];
  assert.equal(score(model, [scribble]).pass, false);
  const partial = model.strokes[0].points;
  const withMistake = score(model, [partial, scribble]);
  assert.equal(withMistake.pass, false);
  assert.equal(withMistake.acceptedStrokes.length, 1);
  assert.ok(withMistake.coverage[0] >= 0.9);
  assert.equal(withMistake.rejectedCount, 1);
  assert.equal(score(model, [...withMistake.acceptedStrokes, ...model.strokes.slice(1).map(stroke => stroke.points)]).pass, true);
});

test("a random zigzag lawnmower scribble over the pad is rejected", () => {
  for (const grapheme of ["a", "l", "m", "sh"]) {
    const model = createCycleTraceModel(grapheme);
    const scribble = Array.from({ length: 30 }, (_, row) => line(row % 2 ? [580, 12 + row * 10] : [20, 12 + row * 10], row % 2 ? [20, 12 + row * 10] : [580, 12 + row * 10])).flat();
    assert.equal(score(model, [scribble]).pass, false, grapheme);
  }
});

test("erasing produces an empty noncompletion and no arbitrary fallback letter exists", () => {
  assert.equal(score(createCycleTraceModel("e"), []).pass, false);
  assert.equal(createCycleTraceModel(""), null);
  assert.equal(createCycleTraceModel("a-"), null);
  assert.equal(evaluateCycleTrace({}).reason, "unavailable");
});

test("switch-assisted strokes advance automatically but always record modeled motor support", () => {
  const model = createCycleTraceModel("sh");
  const assistedStrokeIndexes = model.strokes.map((_, index) => index);
  const evaluation = score(model, [], { assistedStrokeIndexes });
  assert.equal(evaluation.pass, true);
  const firstResponse = { correct: false, reason: "follow-path", progress: 0 };
  const outcome = cycleTraceCompletion({ model, evaluation, supportUsed: ["switch_trace"], firstResponse, attempts: 2 });
  assert.equal(outcome.construct, "grapheme_formation_practice");
  assert.equal(outcome.evidence.independent, false);
  assert.equal(outcome.evidence.measure, "support_only");
  assert.deepEqual(outcome.evidence.supportUsed, ["trace_model", "switch_trace"]);
  assert.equal(outcome.evidence.firstResponse, firstResponse);
  assert.equal(outcome.evidence.attempts, 2);
  assert.equal(outcome.evidence.directionScored, false);
  assert.equal(outcome.evidence.strokeOrderScored, false);
  assert.equal(cycleTraceCompletion({ model, evaluation: score(model, []) }), null);
});

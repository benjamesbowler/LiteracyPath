import test from "node:test";
import assert from "node:assert/strict";

import { scoreLetterTrace } from "../../src/utils/traceLetterScoring.js";

function line(x1, y1, x2, y2, count = 30) {
  return Array.from({ length: count }, (_, index) => {
    const t = index / (count - 1);
    return [x1 + ((x2 - x1) * t), y1 + ((y2 - y1) * t)];
  });
}

const expectedA = [
  line(80, 250, 150, 40),
  line(150, 40, 220, 250),
  line(110, 160, 190, 160)
];

test("a close trace of the expected letter passes", () => {
  const drawn = expectedA.map(stroke => stroke.map(([x, y]) => [x + 3, y - 2]));
  const result = scoreLetterTrace({ drawnStrokes: drawn, expectedStrokes: expectedA });
  assert.equal(result.pass, true);
  assert.ok(result.coverage > 0.9);
  assert.ok(result.precision > 0.9);
  assert.equal(result.directionScore, 1);
  assert.equal(result.orderScore, 1);
});

test("a noisy child trace with one accidental lift still passes", () => {
  const noisy = expectedA.map((stroke, strokeIndex) => stroke.map(([x, y], pointIndex) => [
    x + Math.sin((pointIndex + 1) * (strokeIndex + 1)) * 5,
    y + Math.cos((pointIndex + 2) * (strokeIndex + 1)) * 4
  ]));
  const splitFirstStroke = [
    noisy[0].slice(0, 16),
    noisy[0].slice(15),
    noisy[1],
    noisy[2]
  ];
  const result = scoreLetterTrace({
    drawnStrokes: splitFirstStroke,
    expectedStrokes: expectedA
  });
  assert.equal(result.pass, true);
  assert.equal(result.strokeCoverage, 1);
  assert.equal(result.directionScore, 1);
  assert.equal(result.orderScore, 1);
});

test("the right shape drawn with every stroke backwards does not pass", () => {
  const reversed = expectedA.map(stroke => [...stroke].reverse());
  const result = scoreLetterTrace({
    drawnStrokes: reversed,
    expectedStrokes: expectedA
  });
  assert.equal(result.pass, false);
  assert.ok(result.directionScore < 1);
});

test("the right strokes in the wrong pedagogic order do not pass", () => {
  const wrongOrder = [expectedA[1], expectedA[0], expectedA[2]];
  const result = scoreLetterTrace({
    drawnStrokes: wrongOrder,
    expectedStrokes: expectedA
  });
  assert.equal(result.pass, false);
  assert.equal(result.directionScore, 1);
  assert.equal(result.orderScore, 0);
});

test("a correctly formed letter passes when the child keeps one finger down", () => {
  const continuousTrace = [expectedA.flat()];
  const result = scoreLetterTrace({
    drawnStrokes: continuousTrace,
    expectedStrokes: expectedA
  });
  assert.equal(result.pass, true);
  assert.equal(result.strokeCoverage, 1);
  assert.equal(result.directionScore, 1);
  assert.equal(result.orderScore, 1);
});

test("one continuous box-and-cross scribble is still rejected", () => {
  const continuousScribble = [[
    ...line(40, 30, 260, 30, 40),
    ...line(260, 30, 260, 270, 40),
    ...line(260, 270, 40, 270, 40),
    ...line(40, 270, 40, 30, 40),
    ...line(40, 30, 260, 270, 50),
    ...line(260, 270, 260, 30, 40),
    ...line(260, 30, 40, 270, 50)
  ]];
  const result = scoreLetterTrace({
    drawnStrokes: continuousScribble,
    expectedStrokes: expectedA
  });
  assert.equal(result.pass, false);
});

test("a backwards stroke hidden inside one continuous retrace is rejected", () => {
  const backwardsThenRetraced = [[
    ...[...expectedA[0]].reverse(),
    ...expectedA[1],
    ...expectedA[2]
  ]];
  const result = scoreLetterTrace({
    drawnStrokes: backwardsThenRetraced,
    expectedStrokes: expectedA
  });
  assert.equal(result.pass, false);
});

test("a different letter shape does not pass over the target", () => {
  const letterH = [
    line(85, 40, 85, 250),
    line(215, 40, 215, 250),
    line(85, 160, 215, 160)
  ];
  const result = scoreLetterTrace({
    drawnStrokes: letterH,
    expectedStrokes: expectedA
  });
  assert.equal(result.pass, false);
});

test("a high-coverage box scribble does not pass as the letter", () => {
  const scribble = [
    line(40, 30, 260, 30, 80),
    line(260, 30, 260, 270, 80),
    line(260, 270, 40, 270, 80),
    line(40, 270, 40, 30, 80),
    line(40, 30, 260, 270, 100),
    line(260, 30, 40, 270, 100)
  ];
  const result = scoreLetterTrace({ drawnStrokes: scribble, expectedStrokes: expectedA });
  assert.equal(result.pass, false);
  assert.ok(result.precision < 0.62);
});

test("filling over the whole letter area is not accepted as formation", () => {
  const fill = Array.from({ length: 13 }, (_, index) => (
    index % 2 === 0
      ? line(55, 45 + (index * 16), 245, 45 + (index * 16), 60)
      : line(245, 45 + (index * 16), 55, 45 + (index * 16), 60)
  ));
  const result = scoreLetterTrace({ drawnStrokes: fill, expectedStrokes: expectedA });
  assert.equal(result.pass, false);
  assert.ok(result.precision < 0.62 || result.unmatchedStrokeRatio > 0.12);
});

test("a short letter plus its dot can pass even after device-rate resampling", () => {
  const expectedI = [
    line(150, 100, 150, 230, 28),
    [[150, 65]]
  ];
  const drawnI = [
    line(153, 102, 152, 229, 24),
    [[151, 66]]
  ];
  const result = scoreLetterTrace({
    drawnStrokes: drawnI,
    expectedStrokes: expectedI
  });
  assert.equal(result.pass, true);
  assert.equal(result.strokeCoverage, 1);
});

test("a correct fast trace is not rejected for emitting fewer than twenty pointer events", () => {
  const expectedI = [
    line(150, 100, 150, 230, 28),
    [[150, 65]]
  ];
  const sparseDrawnI = [
    line(152, 102, 151, 228, 6),
    [[151, 66]]
  ];
  const result = scoreLetterTrace({
    drawnStrokes: sparseDrawnI,
    expectedStrokes: expectedI
  });
  assert.equal(result.pass, true);
  assert.equal(result.strokeCoverage, 1);
  assert.equal(result.directionScore, 1);
});

test("an incomplete trace does not pass", () => {
  const result = scoreLetterTrace({
    drawnStrokes: [expectedA[0]],
    expectedStrokes: expectedA
  });
  assert.equal(result.pass, false);
  assert.ok(result.strokeCoverage < 0.86);
});

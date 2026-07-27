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

test("an incomplete trace does not pass", () => {
  const result = scoreLetterTrace({
    drawnStrokes: [expectedA[0]],
    expectedStrokes: expectedA
  });
  assert.equal(result.pass, false);
  assert.ok(result.strokeCoverage < 0.86);
});

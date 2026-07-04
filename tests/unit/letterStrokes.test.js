import test from "node:test";
import assert from "node:assert/strict";
import { LETTER_STROKES, LETTER_GUIDES, strokesForChar } from "../../src/data/letterStrokes.js";

const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const LOWER = "abcdefghijklmnopqrstuvwxyz".split("");

test("every letter of the alphabet has stroke data, both cases", () => {
  for (const ch of [...UPPER, ...LOWER]) {
    assert.ok(Array.isArray(LETTER_STROKES[ch]) && LETTER_STROKES[ch].length > 0, `missing strokes for ${ch}`);
  }
});

test("every stroke is a valid path of M/L/C commands inside the letter box", () => {
  for (const [ch, strokes] of Object.entries(LETTER_STROKES)) {
    for (const d of strokes) {
      assert.match(d, /^M[\d\s.,LCM-]+$/, `${ch} stroke has unexpected commands: ${d}`);
      const nums = d.match(/-?\d+(?:\.\d+)?/g).map(Number);
      assert.ok(nums.length % 2 === 0, `${ch} stroke has an odd coordinate count`);
      for (let i = 0; i < nums.length; i += 2) {
        assert.ok(nums[i] >= 0 && nums[i] <= LETTER_GUIDES.width, `${ch} x out of box: ${nums[i]}`);
        assert.ok(nums[i + 1] >= 0 && nums[i + 1] <= 140, `${ch} y out of box: ${nums[i + 1]}`);
      }
    }
  }
});

test("letters sit on the handwriting guides", () => {
  // Capitals start at the cap line and reach the baseline.
  for (const ch of UPPER) {
    const ys = LETTER_STROKES[ch].flatMap(d => d.match(/-?\d+(?:\.\d+)?/g).map(Number).filter((_, i) => i % 2 === 1));
    assert.ok(Math.min(...ys) <= LETTER_GUIDES.top + 22, `${ch} does not reach near the cap line`);
    assert.ok(Math.max(...ys) >= LETTER_GUIDES.base - 12, `${ch} does not reach the baseline`);
  }
  // Descenders go below the baseline; other lowercase letters must not.
  for (const ch of LOWER) {
    const ys = LETTER_STROKES[ch].flatMap(d => d.match(/-?\d+(?:\.\d+)?/g).map(Number).filter((_, i) => i % 2 === 1));
    const hasDescender = "gjpqy".includes(ch);
    if (hasDescender) assert.ok(Math.max(...ys) > LETTER_GUIDES.base + 10, `${ch} should descend below the baseline`);
    // +8 tolerance: curve CONTROL points may sit slightly past the baseline
    // while the drawn line itself stays on it.
    else assert.ok(Math.max(...ys) <= LETTER_GUIDES.base + 8, `${ch} should not go below the baseline`);
  }
});

test("strokesForChar returns data for known letters and null otherwise", () => {
  assert.ok(strokesForChar("a"));
  assert.equal(strokesForChar("5"), null);
  assert.equal(strokesForChar(""), null);
});

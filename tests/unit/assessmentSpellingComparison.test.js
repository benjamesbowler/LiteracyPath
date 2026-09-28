import assert from "node:assert/strict";
import test from "node:test";
import { alignWrittenForms } from "../../src/utils/assessmentSpellingComparison.js";

test("written-form comparison preserves every observed letter without deciding a score", () => {
  for (const [expected, written] of [["ship", "sip"], ["cat", "caat"], ["train", "trane"], ["said", "sed"], ["shop", "shpo"], ["jumped", "jumpt"], ["Cat", " CAT "]]) {
    const comparison = alignWrittenForms(expected, written);
    assert.equal(comparison.map(part => part.expected).join(""), expected.trim().toLowerCase());
    assert.equal(comparison.map(part => part.written).join(""), written.trim().toLowerCase());
    assert.ok(comparison.every(part => Object.keys(part).sort().join(",") === "differs,expected,written"));
  }
});

test("omitted or added letters get a gap instead of shifting every following letter", () => {
  assert.deepEqual(alignWrittenForms("ship", "sip"), [
    { expected: "s", written: "s", differs: false },
    { expected: "h", written: "", differs: true },
    { expected: "i", written: "i", differs: false },
    { expected: "p", written: "p", differs: false }
  ]);
  assert.equal(alignWrittenForms("cat", "caat").filter(part => part.differs).length, 1);
  assert.ok(alignWrittenForms("cat", "cat").every(part => !part.differs));
});

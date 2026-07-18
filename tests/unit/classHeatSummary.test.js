import test from "node:test";
import assert from "node:assert/strict";
import { classHeatSummary } from "../../src/utils/questReport.js";

// Heat tiles in the exact shape questHeatTiles emits.
function tile(id, stopIndex, bucket) {
  return { id, label: id.split("_")[0], kind: "letter", stopIndex, stopName: `Stop ${stopIndex}`, bucket, seen: bucket === "unseen" ? 0 : 4, accuracy: 75 };
}

function student(name, buckets) {
  // buckets: { s: "got-it", a: "reteach", ... } over a fixed 4-sound curriculum
  return {
    name,
    report: {
      heat: [
        tile("s", 1, buckets.s || "unseen"),
        tile("a", 1, buckets.a || "unseen"),
        tile("t", 2, buckets.t || "unseen"),
        tile("sh", 6, buckets.sh || "unseen")
      ]
    }
  };
}

test("aggregates per-sound counts across the class in curriculum order", () => {
  const summary = classHeatSummary([
    student("Sam", { s: "got-it", a: "reteach", t: "almost" }),
    student("Maya", { s: "got-it", a: "reteach", t: "got-it", sh: "reteach" }),
    student("Leo", { s: "almost", a: "reteach" })
  ]);
  assert.equal(summary.studentsWithEvidence, 3);
  assert.deepEqual(summary.tiles.map(t => t.id), ["s", "a", "t", "sh"]);
  const a = summary.tiles.find(t => t.id === "a");
  assert.equal(a.reteach, 3);
  assert.deepEqual(a.strugglers, ["Sam", "Maya", "Leo"]);
  const s = summary.tiles.find(t => t.id === "s");
  assert.equal(s.gotIt, 2);
  assert.equal(s.almost, 1);
  assert.equal(s.reteach, 0);
});

test("grouping hints need at least two strugglers and rank by need", () => {
  const summary = classHeatSummary([
    student("Sam", { a: "reteach", t: "reteach" }),
    student("Maya", { a: "reteach", t: "reteach" }),
    student("Leo", { a: "reteach", sh: "reteach" })
  ]);
  assert.equal(summary.groups[0].id, "a");
  assert.equal(summary.groups[0].count, 3);
  assert.deepEqual(summary.groups[0].students, ["Sam", "Maya", "Leo"]);
  assert.ok(summary.groups.some(group => group.id === "t"));
  // sh has only one struggler - never a group
  assert.ok(!summary.groups.some(group => group.id === "sh"));
});

test("group pack stop is the LOWEST member's furthest stop (decodable for all)", () => {
  const summary = classHeatSummary([
    // Maya has reached stop 6; Leo only stop 1. A shared sheet must print at 1.
    student("Maya", { a: "reteach", sh: "got-it" }),
    student("Leo", { a: "reteach" })
  ]);
  const groupA = summary.groups.find(group => group.id === "a");
  assert.equal(groupA.stopIndex, 1);
});

test("students without evidence do not count toward the class view", () => {
  const summary = classHeatSummary([
    student("Sam", { s: "got-it" }),
    student("New", {}),
    { name: "NoReport", report: null }
  ]);
  assert.equal(summary.studentsWithEvidence, 1);
});

test("empty input yields an empty, render-safe summary", () => {
  const summary = classHeatSummary([]);
  assert.deepEqual(summary.tiles, []);
  assert.deepEqual(summary.groups, []);
  assert.equal(summary.studentsWithEvidence, 0);
});

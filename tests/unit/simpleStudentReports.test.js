import assert from "node:assert/strict";
import test from "node:test";

import {
  buildSimpleHfwRows,
  buildSimpleOverview,
  simpleAccuracyBand,
  simpleConceptRow
} from "../../src/data/simpleStudentReports.js";

// 2026-07-26: this test used to assert a bare accuracy cut (green at >=50%). That is the
// bug a teacher reported — a tile rendered GREEN at 100% while its own footer said
// "Developing" and the summary said "0 mastered". Colour now follows the five-state
// ladder, so it can never disagree with the status printed beside it.
test("tile colour follows the learning status, never raw accuracy", () => {
  assert.equal(simpleAccuracyBand({ attempts: 0, statusId: "not_checked" }), "unseen");
  assert.equal(simpleAccuracyBand({ attempts: 4, statusId: "secure" }), "green");
  assert.equal(simpleAccuracyBand({ attempts: 4, statusId: "developing" }), "orange");
  assert.equal(simpleAccuracyBand({ attempts: 4, statusId: "needs_teaching" }), "red");
  // Thin evidence is neutral, never red. "We have not seen enough yet" is not a failure.
  assert.equal(simpleAccuracyBand({ attempts: 2, statusId: "not_enough_evidence" }), "unseen");
  // The contradiction itself: 100% accurate but not yet secure must NOT be green.
  assert.equal(simpleAccuracyBand({ attempts: 3, statusId: "developing" }), "orange");
});

// 2026-07-26: expected sentence updated — "has been exposed to X 4 times" was research
// register and is now plain teacher language. Same numbers, readable wording.
test("simple skill copy states tries and correct answers without overstating mastery", () => {
  const row = simpleConceptRow({
    conceptId: "initial-a",
    domain: "phonological_awareness",
    construct: "initial_sound",
    key: "a",
    label: "Initial sound /a/",
    status: { id: "developing", label: "Developing" },
    evidenceBasis: {
      observations: 4,
      correct: 3,
      accuracy: 75
    }
  }, "Aaron");

  assert.equal(
    row.sentence,
    "Aaron answered initial sound “a” 4 times, right 3 times."
  );
  assert.equal(row.band, "orange");
  assert.equal(row.statusLabel, "Practising");
  // The teacher must be told WHY 75% is not yet secure, on the tile itself.
  assert.match(row.whyNotSecure, /more than one day/);
});

test("HFW report always contains the complete 100-word set and keeps unseen words grey", () => {
  const workspace = {
    wholeChild: {
      concepts: [{
        conceptId: "word-the",
        domain: "decoding",
        construct: "isolated_word_reading",
        key: "the",
        label: "Read “the” in isolation",
        status: { id: "secure", label: "Secure" },
        evidenceBasis: { observations: 5, correct: 4, accuracy: 80 }
      }]
    }
  };

  const rows = buildSimpleHfwRows(workspace, "Aaron");
  assert.equal(rows.length, 100);
  assert.equal(rows.find(row => row.key === "the").band, "green");
  assert.equal(rows.find(row => row.key === "the").statusLabel, "Secure");
  assert.equal(rows.find(row => row.key === "the").whyNotSecure, "");
  assert.equal(rows.find(row => row.key === "pretty").band, "unseen");
  assert.equal(rows.find(row => row.key === "pretty").statusLabel, "Yet to learn");
});

// 2026-07-26: "developing" no longer swallows "needs_teaching" — merging them hid the one
// group a teacher acts on, so the overview now has its own Needs teaching bucket.
test("overview separates every status into exactly one group", () => {
  const workspace = {
    wholeChild: {
      concepts: [
        {
          conceptId: "a",
          domain: "phonological_awareness",
          construct: "initial_sound",
          key: "a",
          status: { id: "secure", label: "Secure" },
          evidenceBasis: { observations: 4, correct: 4, accuracy: 100 }
        },
        {
          conceptId: "m",
          domain: "phonological_awareness",
          construct: "initial_sound",
          key: "m",
          status: { id: "needs_teaching", label: "Needs teaching" },
          evidenceBasis: { observations: 3, correct: 0, accuracy: 0 }
        },
        {
          conceptId: "s",
          domain: "phonological_awareness",
          construct: "initial_sound",
          key: "s",
          status: { id: "not_checked", label: "Not checked" },
          evidenceBasis: { observations: 0, correct: null, accuracy: null }
        }
      ]
    }
  };

  const overview = buildSimpleOverview(workspace, "Aaron");
  assert.deepEqual(overview.mastered.map(row => row.key), ["a"]);
  assert.deepEqual(overview.needsTeaching.map(row => row.key), ["m"]);
  assert.deepEqual(overview.practising.map(row => row.key), []);
  assert.deepEqual(overview.notEnoughYet.map(row => row.key), []);
  assert.deepEqual(overview.yetToLearn.map(row => row.key), ["s"]);

  // The headline counts must add up to what was actually checked.
  const grouped = [
    ...overview.needsTeaching,
    ...overview.practising,
    ...overview.mastered,
    ...overview.notEnoughYet,
    ...overview.yetToLearn
  ];
  assert.equal(grouped.length, overview.totalCount);
  assert.equal(new Set(grouped.map(row => row.id)).size, overview.totalCount);
  assert.equal(overview.checkedCount + overview.yetToLearn.length, overview.totalCount);
});

test("overview orders each group by severity within a domain, worst first", () => {
  const concept = (key, domain, statusId, observations, correct) => ({
    conceptId: `${domain}-${key}`,
    domain,
    construct: "grapheme_sound",
    key,
    label: `Sound ${key}`,
    status: { id: statusId },
    evidenceBasis: {
      observations,
      correct,
      accuracy: observations ? Math.round((correct / observations) * 100) : null
    }
  });
  const overview = buildSimpleOverview({
    wholeChild: {
      concepts: [
        concept("a", "decoding", "needs_teaching", 10, 4),
        concept("z", "decoding", "needs_teaching", 10, 1),
        concept("b", "blending", "needs_teaching", 10, 2)
      ]
    }
  }, "Aaron");

  // Domain groups stay together; inside each one the lowest accuracy leads.
  assert.deepEqual(overview.needsTeaching.map(row => row.key), ["b", "z", "a"]);
});

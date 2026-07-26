import assert from "node:assert/strict";
import test from "node:test";

import {
  buildSimpleHfwRows,
  buildSimpleOverview,
  simpleAccuracyBand,
  simpleConceptRow
} from "../../src/data/simpleStudentReports.js";

test("simple report accuracy colours follow the requested thresholds exactly", () => {
  assert.equal(simpleAccuracyBand({ attempts: 0, accuracy: null }), "unseen");
  assert.equal(simpleAccuracyBand({ attempts: 4, accuracy: 0 }), "red");
  assert.equal(simpleAccuracyBand({ attempts: 4, accuracy: 19.9 }), "red");
  assert.equal(simpleAccuracyBand({ attempts: 4, accuracy: 20 }), "orange");
  assert.equal(simpleAccuracyBand({ attempts: 4, accuracy: 49.9 }), "orange");
  assert.equal(simpleAccuracyBand({ attempts: 4, accuracy: 50 }), "green");
  assert.equal(simpleAccuracyBand({ attempts: 4, accuracy: 100 }), "green");
});

test("simple skill copy states exposures and correct answers without overstating mastery", () => {
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
    "Aaron has been exposed to initial sound “a” 4 times, with 3 correct answers."
  );
  assert.equal(row.band, "green");
  assert.equal(row.statusLabel, "Developing");
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
  assert.equal(rows.find(row => row.key === "the").statusLabel, "Mastered");
  assert.equal(rows.find(row => row.key === "pretty").band, "unseen");
  assert.equal(rows.find(row => row.key === "pretty").statusLabel, "Yet to learn");
});

test("overview separates mastery status from exposure status", () => {
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
  assert.deepEqual(overview.developing.map(row => row.key), ["m"]);
  assert.deepEqual(overview.yetToLearn.map(row => row.key), ["s"]);
});

import assert from "node:assert/strict";
import test from "node:test";

import {
  buildSimpleHfwRows,
  buildSimpleOverview,
  countSimpleRowsWithSavedResults,
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
      independentAttempts: 4,
      correct: 3,
      accuracy: 75
    }
  }, "Aaron");

  assert.equal(
    row.sentence,
    "Aaron answered initial sound “a” 4 times, with 3 correct answers."
  );
  assert.equal(row.band, "orange");
  assert.equal(row.statusLabel, "Developing");
  // The teacher must be told WHY 75% is not yet secure, without inventing a
  // requirement for evidence on different calendar days.
  assert.equal(
    row.whyNotSecure,
    "75% accuracy is below the Secure range of 85% or more."
  );
  assert.doesNotMatch(row.whyNotSecure, /\bday\b/i);
});

test("simple report explanations never compare correct answers with independent attempts", () => {
  const row = simpleConceptRow({
    conceptId: "initial-m",
    domain: "phonological_awareness",
    construct: "initial_sound",
    key: "m",
    status: { id: "needs_teaching", label: "Needs support" },
    evidenceBasis: {
      observations: 9,
      independentAttempts: 3,
      correct: 6,
      accuracy: 66.7
    }
  }, "Aaron");

  assert.equal(
    row.sentence,
    "Aaron answered initial sound “m” 9 times, with 6 correct answers."
  );
  assert.equal(
    row.whyNotSecure,
    "66.7% accuracy is below the Secure range of 85% or more."
  );
  assert.doesNotMatch(row.whyNotSecure, /right every time/i);
});

test("simple copy labels current and all-time windows instead of mixing them", () => {
  const row = simpleConceptRow({
    conceptId: "initial-m",
    domain: "phonological_awareness",
    construct: "initial_sound",
    key: "m",
    status: { id: "needs_teaching", label: "Needs support" },
    evidenceBasis: {
      observations: 3,
      independentAttempts: 3,
      correct: 0,
      accuracy: 0
    },
    lifetimeEvidenceBasis: {
      observations: 7,
      independentAttempts: 4,
      correct: 4,
      accuracy: 57.1
    }
  }, "Aaron");

  assert.equal(
    row.sentence,
    "Aaron answered initial sound “m” 3 times, with 0 correct answers."
  );
  assert.equal(
    row.historySentence,
    "All saved history: 7 times, 4 correct (57.1% accuracy)."
  );
  assert.equal(row.attempts, 3);
  assert.equal(row.accuracy, 0);
  assert.equal(row.lifetimeAttempts, 7);
  assert.equal(row.lifetimeAccuracy, 57.1);
  assert.equal(row.statusLabel, "Needs support");
  assert.equal(
    row.whyNotSecure,
    "0% accuracy is below the Secure range of 85% or more."
  );
});

test("saved-result headings include older-only evidence shown in the report", () => {
  const olderOnly = simpleConceptRow({
    conceptId: "older-initial-a",
    domain: "phonological_awareness",
    construct: "initial_sound",
    key: "a",
    status: { id: "not_enough_evidence", label: "Not enough results" },
    evidenceBasis: {
      observations: 0,
      independentAttempts: 0,
      correct: null,
      accuracy: null
    },
    lifetimeEvidenceBasis: {
      observations: 4,
      independentAttempts: 4,
      correct: 3,
      accuracy: 75
    }
  }, "Aaron");

  assert.equal(olderOnly.attempts, 0);
  assert.equal(olderOnly.hasAnyResults, true);
  assert.match(olderOnly.sentence, /older saved answers/);
  assert.equal(countSimpleRowsWithSavedResults([olderOnly]), 1);
});

test("not-enough explanations use the canonical policy reason", () => {
  const row = simpleConceptRow({
    conceptId: "letter-a",
    domain: "decoding",
    construct: "letter_sound",
    key: "a",
    status: { id: "not_enough_evidence", label: "Not enough results" },
    evidenceBasis: {
      observations: 4,
      independentAttempts: 1,
      correct: 4,
      accuracy: 100
    },
    policyConclusion: {
      reason: "1 of 3 required attempts"
    }
  }, "Aaron");

  assert.equal(row.whyNotSecure, "1 of 3 required attempts");
  assert.doesNotMatch(row.whyNotSecure, /\bday\b/i);
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
  assert.equal(rows.find(row => row.key === "number").band, "unseen");
  assert.equal(rows.find(row => row.key === "number").statusLabel, "Not checked");
  assert.match(rows.find(row => row.key === "number").sentence, /has not been checked/);
});

test("HFW sentence choice, spelling, and isolated reading never collapse into one score", () => {
  const workspace = {
    wholeChild: {
      concepts: [
        {
          conceptId: "context-the",
          domain: "literacy_skill",
          construct: "word_in_context",
          key: "the",
          status: { id: "secure", label: "Secure" },
          evidenceBasis: {
            observations: 3,
            independentAttempts: 3,
            correct: 3,
            accuracy: 100
          }
        },
        {
          conceptId: "spell-the",
          domain: "encoding",
          construct: "word_spelling",
          key: "the",
          status: { id: "needs_teaching", label: "Needs support" },
          evidenceBasis: {
            observations: 3,
            independentAttempts: 3,
            correct: 0,
            accuracy: 0
          }
        }
      ]
    }
  };

  const rows = buildSimpleHfwRows(workspace, "Aaron");
  assert.equal(rows.length, 200);
  const theRows = rows.filter(row => row.key === "the");
  assert.equal(theRows.length, 2);
  assert.deepEqual(
    theRows.map(row => [row.construct, row.statusId]).sort(),
    [["word_in_context", "secure"], ["word_spelling", "needs_teaching"]]
  );
});

// 2026-07-26: "developing" no longer swallows "needs_teaching" — merging them hid the one
// group a teacher acts on, so the overview now has its own Needs support bucket.
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
          status: { id: "needs_teaching", label: "Needs support" },
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

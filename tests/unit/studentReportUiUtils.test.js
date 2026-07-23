import assert from "node:assert/strict";
import test from "node:test";

import { buildGuidedReadingViewModel } from "../../src/components/reports/studentReportUiUtils.js";

test("Guided Reading notes keep recorded timestamps, sort newest first, and leave unknown dates honest", () => {
  const report = buildGuidedReadingViewModel([
    {
      bookId: "book-a",
      title: "Book A",
      lastReadAt: "2026-07-30T09:00:00.000Z",
      notes: [
        { note: "Older dated note", updatedAt: "2026-07-01T09:00:00.000Z" },
        { note: "Date was not recorded" },
        { note: "Newest dated note", occurredAt: "2026-07-03T09:00:00.000Z" }
      ]
    },
    {
      bookId: "book-b",
      title: "Book B",
      notes: [{ id: "saved-note", note: "Middle dated note", date: "2026-07-02T09:00:00.000Z" }]
    }
  ]);

  assert.deepEqual(report.notes.map(note => note.note), [
    "Newest dated note",
    "Middle dated note",
    "Older dated note",
    "Date was not recorded"
  ]);
  assert.equal(report.notes[0].date, "2026-07-03T09:00:00.000Z");
  assert.equal(report.notes[1].id, "saved-note");
  assert.equal(report.notes[3].date, "");
  assert.notEqual(report.notes[3].date, "2026-07-30T09:00:00.000Z");
});

test("Guided Reading words are case-insensitively unique and use conservative latest-mark rules", () => {
  const report = buildGuidedReadingViewModel([], [
    { word: "Cat", status: "Read Correctly", date: "2026-07-01T09:00:00.000Z" },
    { word: " cat ", status: "Needs Support", date: "2026-07-02T09:00:00.000Z" },
    { word: "DOG", status: "Needs Support", observedAt: "2026-07-03T09:00:00.000Z" },
    { word: "dog", statusLabel: "Read correctly in this book", observedAt: "2026-07-04T09:00:00.000Z" },
    { word: "Fish", status: "Read Correctly" },
    { word: "FISH", status: "Needs Support" },
    { word: "Owl", status: "Read Correctly", date: "2026-07-05T09:00:00.000Z" },
    { word: "OWL", status: "Needs Support", date: "2026-07-05T09:00:00.000Z" },
    { word: "Bee", status: "Read Correctly", date: "2026-07-06T09:00:00.000Z" },
    { word: "BEE", status: "Needs Support" }
  ]);

  const correctKeys = report.correctWords.map(row => row.word.toLowerCase());
  const supportKeys = report.supportWords.map(row => row.word.toLowerCase());

  assert.deepEqual(correctKeys, ["dog"]);
  assert.deepEqual(supportKeys, ["bee", "cat", "fish", "owl"]);
  assert.equal(new Set([...correctKeys, ...supportKeys]).size, correctKeys.length + supportKeys.length);
});

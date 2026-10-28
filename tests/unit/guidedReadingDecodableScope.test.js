import test from "node:test";
import assert from "node:assert/strict";
import { auditDecodableBook, auditDecodableCurriculum } from "../../src/utils/guidedReading/decodableScope.js";
import { fingerprintBookReadingText } from "../../src/utils/guidedReading/textMetrics.js";
import { classifyBookReadingPurpose, childBookReadingPurpose } from "../../src/policy/literacyExperiencePolicy.js";
import { getRuntimeGuidedReadingBooks } from "../../src/utils/guidedReading/runtimeBooks.js";
import { getGuidedReadingPageAudioPath } from "../../src/utils/guidedReading/readAloudPolicy.js";

const cat = { word: "cat", graphemes: ["c", "a", "t"], sounds: ["k", "æ", "t"], firstCycle: 10, type: "regular" };
const mat = { word: "mat", graphemes: ["m", "a", "t"], sounds: ["m", "æ", "t"], firstCycle: 2, type: "regular" };
const on = { word: "on", graphemes: ["o", "n"], sounds: ["ɑ", "n"], firstCycle: 5, type: "regular" };
const a = { word: "a", graphemes: ["a"], sounds: ["ə"], firstCycle: 2, type: "exception" };
function book() {
  const result = { id: "scope-test", title: "A Cat", readingMode: "decodable", pages: [{ pageNumber: 1, text: "A cat on a mat." }],
    decodableScope: { afterCycle: 10, exceptions: [{ word: "a", cycle: 2, reason: "Unstressed article /ə/." }], wordRecords: [cat, mat, on, a].map(row => ({ ...row })) } };
  result.decodableScope.reviewedTextFingerprint = fingerprintBookReadingText(result);
  return result;
}

test("the bounded spelling sequence still matches the current teaching curriculum", () => {
  assert.deepEqual(auditDecodableCurriculum(), []);
});

test("all twenty live Small Steps manuscripts have complete current title and page scope evidence", () => {
  const books = getRuntimeGuidedReadingBooks().filter(book => book.id.startsWith("small-steps-"));
  assert.equal(books.length, 20);
  assert.deepEqual(books.map(book => book.seriesOrder), Array.from({ length: 20 }, (_, index) => index + 1));
  for (const book of books) {
    assert.equal(book.readingMode, "decodable");
    const audit = auditDecodableBook(book);
    assert.deepEqual(audit.failures, [], book.id);
    assert.equal(audit.unsupportedTokens, 0, book.id);
    assert.equal(audit.regularTokens + audit.exceptionTokens, audit.tokenCount, book.id);
    assert.equal(book.decodableScope.reviewedTextFingerprint, fingerprintBookReadingText(book));
    assert.equal(classifyBookReadingPurpose(book, { anchorCycle: 24 }).id, "supported");
  }
});

test("authored line breaks stay in the print without reopening exact spoken narration", () => {
  const book = getRuntimeGuidedReadingBooks().find(book => book.id === "small-steps-08");
  const page = book.pages[0];
  assert.equal(page.text, "I get a red hat\nand a red cap.");
  assert.equal(page.narrationNeedsRebuild, false);
  assert.ok(getGuidedReadingPageAudioPath(page));
});

test("titles, narrative tokens and actual exception occurrences are audited separately", () => {
  const result = auditDecodableBook(book());
  assert.equal(result.valid, true);
  assert.equal(result.tokenCount, 7);
  assert.equal(result.regularTokens, 4);
  assert.equal(result.exceptionTokens, 3);
  assert.equal(result.unsupportedTokens, 0);
  assert.deepEqual(result.occurrences.find(row => row.word === "a").locations, ["title", "page-1", "page-1"]);
  const changed = book(); changed.title = "A Cake";
  const bad = auditDecodableBook(changed);
  assert.equal(bad.valid, false);
  assert.ok(bad.failures.some(message => message.includes("cake: no reviewed")));
  assert.ok(bad.failures.some(message => message.includes("fingerprint is stale")));
});

test("a global sight-word list never silently licenses an undeclared exception", () => {
  const changed = book(); changed.decodableScope.exceptions = [];
  assert.equal(auditDecodableBook(changed).exceptionTokens, 0);
  assert.equal(auditDecodableBook(changed).unsupportedTokens, 3);
  assert.ok(auditDecodableBook(changed).failures.some(message => message.includes("exception is undeclared")));
});

test("a taught exception still requires its reviewed pronunciation and alignment", () => {
  const changed = structuredClone(getRuntimeGuidedReadingBooks().find(book => book.id === "small-steps-01"));
  const the = changed.decodableScope.wordRecords.find(row => row.word === "the");
  the.sounds = ["z", "z"];
  let result = auditDecodableBook(changed);
  assert.equal(result.valid, false);
  assert.ok(result.unsupportedWords.includes("the"));
  assert.ok(result.failures.some(message => message.includes("the: exception pronunciation")));
  the.sounds = ["ð", "iː"];
  assert.equal(auditDecodableBook(changed).valid, true);
  the.graphemes = ["t", "he"];
  result = auditDecodableBook(changed);
  assert.ok(result.failures.some(message => message.includes("the: exception pronunciation")));
});

test("knowing component letters does not license a cluster or another vowel pronunciation", () => {
  const changed = book();
  changed.title = "A flat mat";
  changed.decodableScope.wordRecords.push({ word: "flat", graphemes: ["f", "l", "a", "t"], sounds: ["f", "l", "æ", "t"], firstCycle: 5, type: "regular" });
  changed.decodableScope.wordRecords.find(row => row.word === "cat").sounds = ["k", "eɪ", "t"];
  const result = auditDecodableBook(changed);
  assert.ok(result.failures.some(message => message.includes("flat: word shape exceeds")));
  assert.ok(result.failures.some(message => message.includes("a → eɪ")));
});

test("introduced digraphs and doubled endings cannot be pulled forward", () => {
  const changed = book(); changed.title = "A cat in a shell";
  changed.decodableScope.wordRecords.push(
    { word: "in", graphemes: ["i", "n"], sounds: ["ɪ", "n"], firstCycle: 3, type: "regular" },
    { word: "shell", graphemes: ["sh", "e", "ll"], sounds: ["ʃ", "ɛ", "l"], firstCycle: 24, type: "regular" }
  );
  const result = auditDecodableBook(changed);
  assert.ok(result.failures.some(message => message.includes("sh has not been taught")));
  assert.ok(result.failures.some(message => message.includes("ll has not been taught")));
});

test("cycle placement, book completion and age do not certify every Small Steps prerequisite", () => {
  const purpose = classifyBookReadingPurpose(book(), { anchorCycle: 24, age: 8, completed: true });
  assert.equal(purpose.id, "supported");
  assert.equal(purpose.decodablePractice, true);
  assert.equal(purpose.prerequisiteCycle, 10);
  assert.equal(childBookReadingPurpose(purpose).label, "Try the words");
  const changed = book(); changed.pages[0].text += " Surprise!";
  assert.equal(classifyBookReadingPurpose(changed, { anchorCycle: 24 }).decodablePractice, false);
});

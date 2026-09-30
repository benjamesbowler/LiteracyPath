import assert from "node:assert/strict";
import test from "node:test";
import { hollowNextAction } from "../../src/policy/hollowNextActionPolicy.js";
import { recommendLetterPractice } from "../../src/policy/letterPracticeRecommendation.js";
import { childBookReadingPurpose, classifyBookReadingPurpose } from "../../src/policy/literacyExperiencePolicy.js";
import { buildBookShelves } from "../../src/policy/childLibraryPolicy.js";

const letters = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"];
const suggest = extra => recommendLetterPractice({ letters, availableLetters: letters, ...extra });

test("empty Hollow inventory recommends the available gift, then the Market", () => {
  const empty = { spots: [{ spotId: "s1" }], slots: {}, placeable: [] };
  assert.equal(hollowNextAction({ ...empty, welcomeEggWaiting: true }).id, "gift");
  assert.equal(hollowNextAction(empty).id, "market");
  assert.equal(hollowNextAction(empty).spotId, undefined);
});

test("Hollow only recommends an empty spot when an owned item can be placed", () => {
  const owned = { placeable: [{ id: "hollow-glow-jar" }], spots: [{ spotId: "s1" }, { spotId: "s2" }], slots: { s1: "placed" } };
  assert.equal(hollowNextAction(owned).spotId, "s2");
  assert.equal(hollowNextAction({ ...owned, slots: { s1: "placed", s2: "placed-too" } }).id, "market");
});

test("Letters recommends current taught R/H rather than alphabetical A", () => {
  assert.equal(suggest({ teachingCycleId: "cycle-6" }).letter, "R");
  assert.equal(suggest({ teachingCycleId: "cycle-6", progress: { R: "completed" } }).letter, "H");
  assert.equal(suggest({ teachingCycleId: "cycle-6", progress: { R: "completed", H: "inprogress" } }).letter, "H");
  assert.equal(suggest({ teachingCycleId: "cycle-6", progress: { R: "completed", H: "completed" } }).source, "teaching-cycle");
});

test("confirmed EL placement supports practice without inferring proficiency from completion", () => {
  const placed = suggest({ confirmedPlacement: { anchorCycle: 6, sourceAttemptId: "confirmed" } });
  assert.equal(placed.letter, "R");
  assert.equal(placed.source, "confirmed-placement");
  const historyOnly = suggest({ progress: { H: "inprogress", R: "completed" } });
  assert.equal(historyOnly.letter, "H");
  assert.equal(historyOnly.source, "practice-resume");
  assert.equal("mastery" in placed, false);
});

test("digraph cycles never silently split a digraph into alphabet targets", () => {
  const result = suggest({ teachingCycleId: "cycle-15" });
  assert.equal(result.source, "exploration");
  const invalid = suggest({ teachingCycleId: "missing", confirmedPlacement: { anchorCycle: 999 } });
  assert.equal(invalid.source, "exploration");
});

test("Letters preserves all available choices and resumes one without teaching context", () => {
  assert.equal(suggest({ progress: { Z: "inprogress" } }).letter, "Z");
  assert.equal(suggest({ availableLetters: ["M"], teachingCycleId: "cycle-6" }).letter, "M");
});

test("child reading copy retains supported versus independently decodable purpose", () => {
  const book = { title: "Am", pages: [{ text: "am" }] };
  assert.deepEqual(childBookReadingPurpose(classifyBookReadingPurpose(book)), { label: "Listen and read", reason: "You can listen while you read." });
  assert.equal(childBookReadingPurpose(classifyBookReadingPurpose(book, { elPlacement: { anchorCycle: 1 } })).label, "Read it yourself");
  assert.equal(childBookReadingPurpose(classifyBookReadingPurpose({ ...book, readingBandProfile: "read-aloud" })).label, "Read together");
});

test("a level browsing shelf does not promise taught-code fit", () => {
  const books = [{ id: "richer-story", title: "Richer story", level: "A", pages: [{ text: "ship" }] }];
  assert.equal(classifyBookReadingPurpose(books[0], { elPlacement: { anchorCycle: 1 } }).id, "supported");
  const shelf = buildBookShelves({ books, level: "A" })[0];
  assert.equal(shelf.title, "Books to try");
  assert.equal(shelf.books.length, 1);
});

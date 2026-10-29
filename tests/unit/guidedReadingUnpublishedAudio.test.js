import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { findUnpublishedAudioCollisions, parseUnpublishedAudioManuscript } from "../../tools/guidedReadingUnpublishedAudioLib.mjs";

const book = { id: "draft-01", title: "A Cat", level: "A", pages: [{ text: "A cat can sit." }] };
const parse = (books, options = {}) => {
  const source = Buffer.from(JSON.stringify(books));
  return parseUnpublishedAudioManuscript(source, {
    sha256: createHash("sha256").update(source).digest("hex"), bookPrefix: "draft-", ...options
  });
};

test("unpublished narration requires an exact reviewed source and bounded unique new book IDs", () => {
  assert.deepEqual(parse([book]), [book]);
  assert.throws(() => parse([book], { sha256: "0".repeat(64) }), /reviewed SHA-256/u);
  assert.throws(() => parse([book], { bookPrefix: null }), /requires/u);
  assert.throws(() => parse([book], { publishedIds: [book.id] }), /unique, unpublished/u);
  assert.throws(() => parse([book, book]), /unique, unpublished/u);
  assert.throws(() => parse([book], { bookPrefix: "other-" }), /within --book-prefix/u);
});

test("unpublished narration rejects skipped, reordered, empty or mismatched page lines", () => {
  for (const page of [null, { text: "" }, { text: ["A cat."] }, { text: "A cat.", active: false },
    { text: "A cat.", pageNumber: 2 }, { text: "A cat.", pageAudioText: "A dog." }]) {
    assert.throws(() => parse([{ ...book, pages: [page] }]), /Invalid exact page narration/u);
  }
  assert.throws(() => parse([]), /nonempty/u);
  assert.throws(() => parse([{ ...book, pages: [] }]), /Invalid unpublished book/u);
});

test("draft/live punctuation collisions respect exact reuse and explicit exact overrides", () => {
  const row = (bookId, displayedText, normalizedText = "i am a cat") => ({ bookId, pageNumber: 1, displayedText, normalizedText, origin: "gap_generator" });
  const live = [row("small-steps-01", "I am a cat."), row("unrelated", "A dog.", "a dog"), row("unrelated", "A dog?", "a dog")];
  const draft = [row("draft-01", "I am a cat?")];
  const collisions = findUnpublishedAudioCollisions(draft, live, {});
  assert.equal(collisions.length, 1);
  assert.equal(collisions[0].resolved, false);
  assert.deepEqual(collisions[0].exactTexts, ["I am a cat.", "I am a cat?"]);
  assert.deepEqual(findUnpublishedAudioCollisions([row("draft-01", "I am a cat.")], live, {}), []);
  assert.equal(findUnpublishedAudioCollisions(draft, live, { "I am a cat?": "/exact-question.mp3" })[0].resolved, true);
  assert.equal(findUnpublishedAudioCollisions(draft, live, { "A dog?": "/unrelated.mp3" })[0].resolved, false);
  assert.equal(findUnpublishedAudioCollisions(draft, live, { "I am a cat.": "/exact-statement.mp3" })[0].resolved, false);
  assert.equal(findUnpublishedAudioCollisions([{ ...draft[0], origin: "unknown" }], live,
    { "I am a cat.": "/exact-statement.mp3" })[0].resolved, true);
});

test("unpublished generator rejects a live-map punctuation collision without modifying audio mappings", () => {
  const directory = mkdtempSync(path.join(tmpdir(), "guided-reading-draft-preflight-"));
  const file = path.join(directory, "draft.json");
  const mapping = "src/data/generated/guidedReadingLedaGaps.generated.js";
  const before = readFileSync(mapping, "utf8");
  function args(text) {
    const source = JSON.stringify([{ ...book, pages: [{ text }] }]);
    writeFileSync(file, source);
    return ["tools/generateGuidedReadingLedaGaps.mjs", "--dry-run", "--book-prefix", "draft-", "--manuscript-file", file,
      "--manuscript-sha256", createHash("sha256").update(source).digest("hex")];
  }
  try {
    const collision = spawnSync(process.execPath, args("I am a cat?"), { encoding: "utf8" });
    assert.equal(collision.status, 1);
    const failed = JSON.parse(collision.stdout);
    assert.equal(failed.preflightPassed, false);
    assert.equal(failed.unresolvedNormalizedCollisions, 1);
    assert.deepEqual(failed.normalizedCollisionInventory[0].exactTexts, ["I am a cat.", "I am a cat?"]);
    const reused = JSON.parse(execFileSync(process.execPath, args("I am a cat."), { encoding: "utf8" }));
    assert.equal(reused.preflightPassed, true);
    assert.equal(reused.activeBooks, 1);
    assert.equal(reused.pageGenerationInventory[0].fileExists, true);
    assert.equal(readFileSync(mapping, "utf8"), before);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

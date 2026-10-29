import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { getRuntimeGuidedReadingBooks } from "../../src/utils/guidedReading/runtimeBooks.js";
import { getPublicBookMetadata } from "../../src/utils/guidedReading/bookLevelMetadata.js";

const root = fileURLToPath(new URL("../../", import.meta.url));
const run = (file, args) => spawnSync(process.execPath, [path.join(root, file), ...args], { encoding: "utf8" });

test("visual scope uses the reviewed A-H bands, including the read-together H book", () => {
  const result = run("tools/checkGuidedReadingVisualAlignment.mjs", ["--level", "H"]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Pages: 12; approved: 12;/);
  const books = getRuntimeGuidedReadingBooks();
  const expectedPages = books.filter(book => getPublicBookMetadata(book).appReadingLevel === "A")
    .reduce((count, book) => count + book.pages.length, 0);
  const a = run("tools/checkGuidedReadingVisualAlignment.mjs", ["--level", "A"]);
  assert.equal(a.status, 0, a.stderr);
  assert.ok(a.stdout.includes(`Pages: ${expectedPages};`));
  const legacyPages = books.filter(book => book.level === "A").reduce((count, book) => count + book.pages.length, 0);
  assert.notEqual(expectedPages, legacyPages);
});

test("a book-only visual receipt updates that book and preserves every unrelated review", () => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "lp-book-review-scope-"));
  const auditRelative = "docs/guided-reading/guided_reading_story_bible_visual_alignment_audit_2026-08-01.json";
  const bookId = "first-facts-level-a-02-farm-animals";
  try {
    fs.mkdirSync(path.join(fixture, "tools"));
    fs.mkdirSync(path.dirname(path.join(fixture, auditRelative)), { recursive: true });
    fs.writeFileSync(path.join(fixture, "package.json"), '{"type":"module"}');
    fs.copyFileSync(path.join(root, "tools/recordGuidedReadingLevelVisualReview.mjs"), path.join(fixture, "tools/recordGuidedReadingLevelVisualReview.mjs"));
    fs.symlinkSync(path.join(root, "src"), path.join(fixture, "src"), "dir");
    fs.symlinkSync(path.join(root, "public"), path.join(fixture, "public"), "dir");
    fs.copyFileSync(path.join(root, auditRelative), path.join(fixture, auditRelative));
    const before = JSON.parse(fs.readFileSync(path.join(fixture, auditRelative)));
    const result = spawnSync(process.execPath, [path.join(fixture, "tools/recordGuidedReadingLevelVisualReview.mjs"), "--book", bookId, "--note", "Scoped fixture review"], { encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    const after = JSON.parse(fs.readFileSync(path.join(fixture, auditRelative)));
    assert.deepEqual(after.pages.filter(row => row.bookId !== bookId), before.pages.filter(row => row.bookId !== bookId));
    const selected = after.pages.filter(row => row.bookId === bookId);
    assert.equal(selected.length, 7);
    assert.ok(selected.every(row => row.level === "A" && row.regenerationBrief === "Scoped fixture review"));
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
});

test("an ambiguous or empty book selection cannot approve a whole level", () => {
  for (const args of [
    ["--book", "", "--note", "test"],
    ["--level", "A", "--book", "", "--note", "test"],
    ["--level", "A", "--book", "first-facts-level-a-02-farm-animals", "--note", "test"],
    ["--level", "I", "--note", "test"]
  ]) {
    assert.notEqual(run("tools/recordGuidedReadingLevelVisualReview.mjs", args).status, 0);
  }
});

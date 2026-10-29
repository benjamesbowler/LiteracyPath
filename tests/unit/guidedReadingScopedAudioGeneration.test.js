import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { getRuntimeGuidedReadingBooks } from "../../src/utils/guidedReading/runtimeBooks.js";
import { decodableTextTokens } from "../../src/utils/guidedReading/decodableScope.js";

test("a series audio run includes only its visible pages and words and leaves mappings untouched in dry-run", () => {
  const prefix = "gr-a-26";
  const source = "src/data/generated/guidedReadingLedaGaps.generated.js";
  const before = readFileSync(source, "utf8");
  const result = JSON.parse(execFileSync(process.execPath, ["tools/generateGuidedReadingLedaGaps.mjs", "--dry-run", "--book-prefix", prefix], { encoding: "utf8" }));
  const book = getRuntimeGuidedReadingBooks().find(row => row.id === prefix);
  const text = new Set(book.pages.map(page => page.text));
  const words = new Set(book.pages.flatMap(page => decodableTextTokens(page.text)));
  assert.equal(result.activeBooks, 1);
  assert.equal(result.activePages, book.pages.length);
  assert.equal(result.bookPrefix, prefix);
  assert.ok(result.pageGenerationInventory.length > 0);
  for (const row of result.pageGenerationInventory) assert.ok(text.has(row.lookupText), row.lookupText);
  for (const row of result.wordGenerationInventory) assert.ok(words.has(row.lookupText.toLowerCase()), row.lookupText);
  assert.equal(readFileSync(source, "utf8"), before);
});

test("an empty or unknown series selection cannot fall back to generating the whole library", () => {
  for (const args of [["--book-prefix"], ["--book-prefix", "--dry-run"], ["--book-prefix", "not-a-real-series-"]]) {
    const result = spawnSync(process.execPath, ["tools/generateGuidedReadingLedaGaps.mjs", "--dry-run", ...args], { encoding: "utf8" });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Expected --book-prefix|selection contains no books/u);
  }
});

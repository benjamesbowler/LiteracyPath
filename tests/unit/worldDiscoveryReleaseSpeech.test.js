import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateRelease } from "../../tools/worldDiscoveryValidationLib.mjs";
import { WORLD_DISCOVERY_REGISTERED_COHORTS } from "../../src/data/generated/worldDiscoveryCohorts.generated.js";
import { getRuntimeGuidedReadingBooks } from "../../src/utils/guidedReading/runtimeBooks.js";
import { getGuidedReadingPageAudioPath, getGuidedReadingWordProductionAudioPath } from "../../src/utils/guidedReading/readAloudPolicy.js";

const root = fileURLToPath(new URL("../../", import.meta.url));
const tokens = text => text.match(/[A-Za-z0-9]+(?:[’'-][A-Za-z0-9]+)*/g) || [];
const sources = new Map(WORLD_DISCOVERY_REGISTERED_COHORTS.flatMap(cohort => cohort.books).map(book => [book.id, book]));
const reviews = Object.assign({}, ...WORLD_DISCOVERY_REGISTERED_COHORTS.map(cohort => cohort.reviews));
// Select a real title-only word so a page's word check cannot accidentally
// satisfy the title-word assertion. Nothing on disk is changed by these tests.
const fixture = getRuntimeGuidedReadingBooks().filter(book => sources.has(book.id)).map(book => {
  const title = { pageNumber: "title", text: book.title, narrationNeedsRebuild: true };
  const pageWords = new Set(book.pages.flatMap(page => tokens(page.text).map(word => getGuidedReadingWordProductionAudioPath(word, { bookId: book.id, page }))));
  const titleWordPath = tokens(book.title).map(word => getGuidedReadingWordProductionAudioPath(word, { bookId: book.id, page: title })).find(audioPath => audioPath && !pageWords.has(audioPath));
  return { book, titlePath: getGuidedReadingPageAudioPath(title), titleWordPath };
}).find(row => row.titlePath && row.titleWordPath);
assert.ok(fixture, "registered books provide a title-only word-audio fixture");

const check = () => validateRelease([sources.get(fixture.book.id)], { [fixture.book.id]: reviews[fixture.book.id] }, []);

test("release speech validation checks a synthetic title without requiring a page image or page clearance", async () => {
  const { failures } = await check();
  assert.deepEqual(failures.filter(message => message.startsWith(`${fixture.book.id}:title:`)), []);
  // With no screening report supplied, the exact title must still be required.
  assert.ok(failures.includes(`World Discovery: current title/page lacks narration screening: ${fixture.titlePath}`));
});

test("missing exact title narration and title-only word audio still block release", async t => {
  const missing = new Set([fixture.titlePath, fixture.titleWordPath].map(audioPath => path.join(root, "public", audioPath.slice(1))));
  const read = fs.readFileSync;
  t.mock.method(fs, "readFileSync", (file, options) => {
    if (missing.has(String(file))) throw new Error("Synthetic missing title media");
    return read(file, options);
  });
  const { failures } = await check();
  for (const audioPath of [fixture.titlePath, fixture.titleWordPath]) {
    assert.ok(failures.some(message => message.endsWith(`absent or empty media ${audioPath}`)), `missing title media was not rejected: ${audioPath}`);
  }
});

test("real pages retain exact narration-clearance and current visual-alignment checks", async t => {
  const page = fixture.book.pages[0];
  const originalFlag = page.narrationNeedsRebuild;
  t.after(() => { page.narrationNeedsRebuild = originalFlag; });
  page.narrationNeedsRebuild = true;
  const auditPath = path.join(root, "docs/guided-reading/guided_reading_story_bible_visual_alignment_audit_2026-08-01.json");
  const read = fs.readFileSync;
  t.mock.method(fs, "readFileSync", (file, options) => {
    const bytes = read(file, options);
    if (String(file) !== auditPath) return bytes;
    const audit = JSON.parse(bytes);
    audit.pages = audit.pages.filter(row => row.bookId !== fixture.book.id || row.pageNumber !== page.pageNumber);
    return JSON.stringify(audit);
  });
  const { failures } = await check();
  assert.ok(failures.includes(`${fixture.book.id}:${page.pageNumber}: exact narration clearance remains open`));
  assert.ok(failures.includes(`${fixture.book.id}:${page.pageNumber}: canonical page visual alignment review missing or stale`));
});

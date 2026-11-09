import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fingerprintBookReadingText } from "../../src/utils/guidedReading/textMetrics.js";
import { validateWorldDiscoveryDrafts, validateWorldDiscoveryDraftBatch } from "../../tools/checkWorldDiscoveryBooks.mjs";
import { readWorldDiscoverySource, parseWorldDiscoverySourceArgs } from "../../tools/worldDiscoverySourceLib.mjs";
import { prepareWorldDiscoveryNarration } from "../../tools/prepareWorldDiscoveryNarration.mjs";
import { buildWorldDiscoveryImagePrompt, imageJob, install } from "../../tools/worldDiscoveryImageJobs.mjs";
import { parseUnpublishedAudioManuscript } from "../../tools/guidedReadingUnpublishedAudioLib.mjs";
import { WORLD_DISCOVERY_TOPIC_PROFILES } from "../../src/data/worldDiscoveryTopicProfiles.js";
import { validateWorldDiscoveryCohortDrafts } from "../../tools/worldDiscoveryValidationLib.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const original = readWorldDiscoverySource().books;
function draftBooks() {
  return original.map(book => ({ ...structuredClone(book),
    id: `world-discovery-${book.appLevel.toLowerCase()}-${book.number + 10}`,
    number: book.number + 10, title: `${book.title} Draft`
  }));
}
function sourceDirectory(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "world-discovery-draft-test-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const books = draftBooks();
  const save = () => {
    for (const level of "abcde") fs.writeFileSync(path.join(dir, `level-${level}.json`), JSON.stringify(books.filter(book => book.appLevel.toLowerCase() === level)));
    fs.writeFileSync(path.join(dir, "reviews.json"), JSON.stringify(Object.fromEntries(books.map(book => [book.id, {
      appReadingLevel: book.appLevel, rationale: "Synthetic test review only; never a production approval.", reviewedAt: "2026-11-07",
      reviewMethod: "codex-full-manuscript-editorial-review", reviewedTextFingerprint: fingerprintBookReadingText(book)
    }]))));
  };
  save();
  return { dir, books, save, options: { sourceDir: dir, firstNumber: 11, lastNumber: 20 } };
}

function nonfictionDraftBooks() {
  return [..."ABCDE"].flatMap(level => Array.from({ length: 10 }, (_, index) => {
    const book = structuredClone(original.find(row => row.appLevel === level && row.type === "nonfiction"));
    book.number = index + 21;
    book.id = `world-discovery-${level.toLowerCase()}-${book.number}`;
    book.title = `Synthetic ${level} ${book.number}`;
    book.topic = WORLD_DISCOVERY_TOPIC_PROFILES["nonfiction-discovery"].topics[index];
    // Structural test fixture, never authored or approved production content.
    book.pages[0].text = `Page ${book.number} in ${level}.`;
    return book;
  }));
}

test("the explicit next cohort requires nonfiction and exact new strands without weakening legacy or factual gates", () => {
  const books = nonfictionDraftBooks();
  const options = { firstNumber: 21, lastNumber: 30, topicProfile: "nonfiction-discovery" };
  assert.deepEqual(validateWorldDiscoveryDraftBatch(books, options).failures, []);
  assert.match(validateWorldDiscoveryDraftBatch(books, { firstNumber: 21, lastNumber: 30 }).failures.join("\n"), /requires explicit topicProfile/);
  assert.match(validateWorldDiscoveryDraftBatch(draftBooks(), { firstNumber: 11, lastNumber: 20, topicProfile: "nonfiction-discovery" }).failures.join("\n"), /must retain the original/);
  assert.match(validateWorldDiscoveryDrafts(original, { topicProfile: "nonfiction-discovery" }).failures.join("\n"), /must retain the original/);
  for (const [edit, error] of [
    [rows => { rows[0].type = "fiction"; }, /every book to be nonfiction/],
    [rows => { rows[0].topic = "identity"; }, /topic does not match strand/],
    [rows => { rows[0].storyBibleReview.scienceSources = []; }, /nonfiction requires factual evidence/],
    [rows => { rows[0].pages[0].text = "This new page contains far too many words."; }, /exceeds A limit/]
  ]) {
    const changed = structuredClone(books);
    edit(changed);
    assert.match(validateWorldDiscoveryDraftBatch(changed, options).failures.join("\n"), error);
  }
  const entries = [
    { cohort: { index: 0, expectedBooks: 50, expectedPages: 440 }, books: original },
    { cohort: { index: 2, expectedBooks: 50, expectedPages: 440, ...options }, books }
  ];
  assert.deepEqual(validateWorldDiscoveryCohortDrafts(entries).failures, []);
  books[0].pages = structuredClone(original.find(row => row.appLevel === "A" && row.type === "nonfiction").pages);
  assert.match(validateWorldDiscoveryCohortDrafts(entries).failures.join("\n"), /duplicates the manuscript/);
});

test("new-profile source selection propagates through image and reviewed narration jobs", t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "world-discovery-nonfiction-test-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const books = nonfictionDraftBooks();
  for (const level of "abcde") fs.writeFileSync(path.join(dir, `level-${level}.json`), JSON.stringify(books.filter(book => book.appLevel.toLowerCase() === level)));
  fs.writeFileSync(path.join(dir, "reviews.json"), JSON.stringify(Object.fromEntries(books.map(book => [book.id, {
    appReadingLevel: book.appLevel, rationale: "Synthetic test review; never production approval.", reviewedAt: "2026-11-09",
    reviewMethod: "codex-full-manuscript-editorial-review", reviewedTextFingerprint: fingerprintBookReadingText(book)
  }]))));
  const options = { sourceDir: dir, firstNumber: 21, lastNumber: 30, topicProfile: "nonfiction-discovery" };
  assert.deepEqual(parseWorldDiscoverySourceArgs(["--topic-profile", "nonfiction-discovery"]).options, { topicProfile: "nonfiction-discovery" });
  assert.equal(readWorldDiscoverySource(options).books.length, 50);
  const job = imageJob("world-discovery-a-21", "reference", options);
  assert.equal(job.manuscriptSource.topicProfile, "nonfiction-discovery");
  assert.ok(job.target.endsWith("source-art/world-discovery/a-21-reference.webp"));
  const prepared = prepareWorldDiscoveryNarration({ ...options, outputDir: path.join(dir, "audio") });
  assert.equal(prepared.topicProfile, "nonfiction-discovery");
  assert.equal(prepared.books, 50);
  assert.equal(prepared.pages, 440);
  assert.equal(prepared.titleClips, 50);
});

test("explicit draft ranges preserve the default fifty-book contract and reject omissions, duplicate IDs and wrong ranges", () => {
  const books = draftBooks(), range = { firstNumber: 11, lastNumber: 20 };
  assert.deepEqual(validateWorldDiscoveryDrafts(original).failures, []);
  assert.match(validateWorldDiscoveryDrafts(books).failures.join("\n"), /number must be 1–10/);
  assert.deepEqual(validateWorldDiscoveryDraftBatch(books, range).failures, []);
  assert.match(validateWorldDiscoveryDraftBatch(books).failures.join("\n"), /explicit ten-book range/);
  assert.match(validateWorldDiscoveryDraftBatch(books.slice(1), range).failures.join("\n"), /Missing required manuscript world-discovery-a-11/);
  assert.match(validateWorldDiscoveryDraftBatch([...books, books[0]], range).failures.join("\n"), /duplicate book ID/);
  const wrong = structuredClone(books);
  wrong[0].number = 21;
  wrong[0].id = "world-discovery-a-21";
  assert.match(validateWorldDiscoveryDraftBatch(wrong, range).failures.join("\n"), /number must be 11–20/);
  wrong[0].number = 11;
  wrong[0].id = "world-discovery-a-11";
  wrong[3].type = "nonfiction";
  assert.match(validateWorldDiscoveryDraftBatch(wrong, range).failures.join("\n"), /fantasy must be fiction/);
});

test("source flags require values, cannot repeat, and never reinterpret the default source as a draft", () => {
  assert.deepEqual(parseWorldDiscoverySourceArgs(["job", "id", "reference", "--source-dir", "drafts", "--first-number", "11", "--last-number", "20"]), {
    options: { sourceDir: "drafts", firstNumber: 11, lastNumber: 20 }, remaining: ["job", "id", "reference"]
  });
  assert.throws(() => parseWorldDiscoverySourceArgs(["--source-dir"]), /Missing value/);
  assert.throws(() => parseWorldDiscoverySourceArgs(["--first-number", "11", "--first-number", "21"]), /Duplicate/);
  assert.throws(() => readWorldDiscoverySource({ firstNumber: 11, lastNumber: 20 }), /explicit isolated/);
});

test("image layout declarations allow only authored diagrams and exact labels while ordinary scenes retain their restrictions", () => {
  const book = structuredClone(original[0]), page = book.pages[0];
  const scene = buildWorldDiscoveryImagePrompt(book, "page-01");
  assert.match(scene, /one coherent scene and moment, no panels or contact sheet/);
  assert.match(scene, /No logos, text, letters, numbers, pseudo-writing/);
  assert.match(scene, /Do not add later events, duplicate props or a separate inset/);
  page.imageLayout = "scene";
  assert.equal(buildWorldDiscoveryImagePrompt(book, "page-01"), scene);

  page.imageLayout = "integrated-diagram";
  page.imageBrief = "One soil cutaway beneath the same tree with one magnified root inset linked by an arrow.";
  const integrated = buildWorldDiscoveryImagePrompt(book, "page-01");
  assert.match(integrated, /only the cutaways, insets, schematic elements or arrows explicitly authored/);
  assert.ok(integrated.includes(page.imageBrief));
  assert.match(integrated, /No unrequested panels, insets, annotations or contact sheet/);
  assert.match(integrated, /No logos, text, letters, numbers, pseudo-writing/);
  assert.doesNotMatch(integrated, /or a separate inset/);

  page.imageLayout = "comparison-diagram";
  page.embeddedImageText = "A B C\n1 2 3";
  const comparison = buildWorldDiscoveryImagePrompt(book, "page-01");
  assert.match(comparison, /only the distinct views, stages or comparison panels explicitly authored/);
  assert.match(comparison, /No unrequested panels, insets, annotations or contact sheet/);
  assert.ok(comparison.includes(`ONLY permitted written content is the exact authored embeddedImageText: ${JSON.stringify(page.embeddedImageText)}`));
  assert.match(comparison, /No additional text, letters, numbers, captions, pseudo-writing, legends or written title/);
  assert.doesNotMatch(comparison, /No logos, text, letters, numbers/);
  for (const slot of ["cover", "reference"]) {
    const prompt = buildWorldDiscoveryImagePrompt(book, slot);
    assert.match(prompt, /No logos, text, letters, numbers, pseudo-writing/);
    assert.doesNotMatch(prompt, /ONLY permitted written content|one explanatory comparison diagram/);
  }
  page.embeddedImageText = " \n ";
  assert.match(buildWorldDiscoveryImagePrompt(book, "page-01"), /No logos, text, letters, numbers, pseudo-writing/);
  page.imageLayout = "contact-sheet";
  assert.throws(() => buildWorldDiscoveryImagePrompt(book, "page-01"), /Invalid imageLayout/);
  assert.match(validateWorldDiscoveryDrafts([book], { requireComplete: false }).failures.join("\n"), /imageLayout must be scene, integrated-diagram or comparison-diagram/);
});

test("isolated image jobs select draft content without runtime activation or writes, and block published-ID collisions", t => {
  const batch = sourceDirectory(t);
  const job = imageJob("world-discovery-a-11", "reference", batch.options);
  assert.equal(job.bookId, "world-discovery-a-11");
  assert.ok(job.prompt.includes(batch.books[0].title));
  assert.equal(job.manuscriptSource.isolated, true);
  assert.ok(job.target.endsWith("source-art/world-discovery/a-11-reference.webp"));
  assert.equal(original.some(book => book.id === job.bookId), false);
  batch.books[0] = structuredClone(original[0]);
  batch.save();
  assert.throws(() => imageJob(original[0].id, "reference", batch.options), /collides with the published first fifty/);
});

test("cover diagrams require explicit declarations while covers and references remain unlettered", () => {
  const book = structuredClone(original[0]);
  const ordinary = buildWorldDiscoveryImagePrompt(book, "cover");
  assert.match(ordinary, /one coherent scene and moment, no panels/);
  assert.match(ordinary, /No logos, text, letters, numbers/);
  book.coverImageLayout = "integrated-diagram";
  book.coverBrief = "An unlettered compass diagram with its red needle pointing toward the tree.";
  const diagram = buildWorldDiscoveryImagePrompt(book, "cover");
  assert.match(diagram, /one integrated explanatory diagram/);
  assert.match(diagram, /No logos, text, letters, numbers/);
  assert.doesNotMatch(diagram, /or a separate inset/);
  const reference = buildWorldDiscoveryImagePrompt(book, "reference");
  assert.match(reference, /Reference-sheet override/);
  assert.doesNotMatch(reference, /ONLY permitted written content/);
  assert.deepEqual(validateWorldDiscoveryDrafts([book], { requireComplete: false }).failures, []);
  book.coverImageLayout = "contact-sheet";
  assert.throws(() => buildWorldDiscoveryImagePrompt(book, "cover"), /Invalid imageLayout/);
  assert.match(validateWorldDiscoveryDrafts([book], { requireComplete: false }).failures.join("\n"), /coverImageLayout must be/);
  book.coverImageLayout = "scene";
  book.coverEmbeddedImageText = "N";
  assert.match(validateWorldDiscoveryDrafts([book], { requireComplete: false }).failures.join("\n"), /cover lettering is prohibited/);
  assert.doesNotMatch(buildWorldDiscoveryImagePrompt(book, "cover"), /ONLY permitted written content/);
});

test("isolated image installation refuses stale manuscript or prompt evidence before touching output", async t => {
  const batch = sourceDirectory(t), id = "world-discovery-a-11";
  const job = imageJob(id, "reference", batch.options);
  const prior = [job.target, job.receipt].map(file => fs.existsSync(file) ? fs.readFileSync(file) : null);
  const prompt = path.join(batch.dir, "job.txt");
  fs.writeFileSync(prompt, job.prompt);
  fs.writeFileSync(prompt.replace(/\.txt$/, ".json"), JSON.stringify({ ...job, references: [] }));
  batch.books[0].pages[0].imageBrief += " Changed state.";
  batch.save();
  await assert.rejects(install(id, "reference", path.join(batch.dir, "never-read.png"), prompt, true, batch.options), /does not match the current manuscript/);
  await assert.rejects(install(id, "../bad", path.join(batch.dir, "never-read.png"), prompt, true, batch.options), /Invalid image slot/);
  assert.deepEqual([job.target, job.receipt].map(file => fs.existsSync(file) ? fs.readFileSync(file) : null), prior);
});

test("reviewed draft narration writes a separate hash-bound unpublished snapshot and retains existing collision protections", t => {
  const batch = sourceDirectory(t);
  assert.throws(() => prepareWorldDiscoveryNarration(batch.options), /separate explicit --output-dir/);
  assert.throws(() => prepareWorldDiscoveryNarration({ ...batch.options, outputDir: ".artifacts/world-discovery/audio" }), /original production evidence is preserved/);
  const result = prepareWorldDiscoveryNarration({ ...batch.options, outputDir: path.join(batch.dir, "audio") });
  assert.equal(result.books, 50);
  assert.equal(result.pages, 440);
  assert.equal(result.titleClips, 50);
  assert.match(result.file, new RegExp(`reviewed-manuscript-${result.sha256}\\.json$`));
  const bytes = fs.readFileSync(path.resolve(root, result.file));
  const parsed = parseUnpublishedAudioManuscript(bytes, { sha256: result.sha256, bookPrefix: result.bookPrefix, publishedIds: original.map(book => book.id) });
  assert.equal(parsed.length, 100);
  assert.equal(parsed.reduce((count, book) => count + book.pages.length, 0), 490);
  assert.throws(() => parseUnpublishedAudioManuscript(Buffer.concat([bytes, Buffer.from(" ")]), { sha256: result.sha256, bookPrefix: result.bookPrefix }), /does not match its reviewed SHA/);
  assert.throws(() => parseUnpublishedAudioManuscript(bytes, { sha256: result.sha256, bookPrefix: result.bookPrefix, publishedIds: [parsed[0].id] }), /unique, unpublished/);
});

test("unreviewed or changed draft text cannot produce a narration snapshot", t => {
  const batch = sourceDirectory(t), outputDir = path.join(batch.dir, "audio");
  const file = path.join(batch.dir, "level-a.json");
  const rows = JSON.parse(fs.readFileSync(file));
  rows[0].pages[0].text = "Zoe has a book.";
  fs.writeFileSync(file, JSON.stringify(rows));
  assert.throws(() => prepareWorldDiscoveryNarration({ ...batch.options, outputDir }), /fingerprint is stale/);
  assert.equal(fs.existsSync(outputDir), false);
});

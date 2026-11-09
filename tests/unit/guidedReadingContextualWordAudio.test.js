import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { getContextualGuidedReadingWordAudioPath, GUIDED_READING_CONTEXTUAL_WORD_AUDIO } from "../../src/data/guidedReadingContextualWordAudio.js";
import { getGuidedReadingWordProductionAudioPath } from "../../src/utils/guidedReading/readAloudPolicy.js";
import { validateContextualWordAudioEntries } from "../../tools/guidedReadingContextualWordAudioLib.mjs";
import { readingSessionMediaUrls } from "../../src/data/readingSession.js";
import { collectWorldDiscoveryCohortAudio } from "../../tools/worldDiscoveryCohortReleaseLib.mjs";

const contexts = [
  { bookId: "world-discovery-c-12", pageNumber: 8, pageText: "Zoe holds the knot while Kit pulls the bow. Their parcel stays shut, with two red loops on top.", word: "bow", pronunciation: "boʊ" },
  { bookId: "world-discovery-d-14", pageNumber: 10, pageText: "Zoe waves back with both hands. Kit bows, and a giant bow carries the shadow fan almost to the floor.", word: "bow", pronunciation: "baʊ" }
].map((row, index) => ({ ...row, status: "reviewed", voiceName: "en-US-Chirp3-HD-Leda", pronunciationEncoding: "PHONETIC_ENCODING_IPA",
  audioPath: `/audio/production/en-US/isolated_word/bow-${String(index + 1).repeat(10)}.mp3`, audioSha256: String(index + 1).repeat(64), reviewNote: "Synthetic test evidence only." }));
const context = row => ({ bookId: row.bookId, page: { pageNumber: row.pageNumber, text: row.pageText } });

test("the ribbon bow and bending bow select distinct exact-context pronunciations without changing unrelated fallback", () => {
  assert.notEqual(contexts[0].audioPath, contexts[1].audioPath);
  for (const row of contexts) assert.equal(getContextualGuidedReadingWordAudioPath("Bow", context(row), contexts), row.audioPath);
  assert.equal(getContextualGuidedReadingWordAudioPath("bow", {}, contexts), undefined);
  assert.equal(getContextualGuidedReadingWordAudioPath("bow", { ...context(contexts[0]), bookId: "other-book" }, contexts), undefined);
  assert.equal(getGuidedReadingWordProductionAudioPath("bow", { bookId: "other-book", page: context(contexts[0]).page }), getGuidedReadingWordProductionAudioPath("bow"));
});

test("stale page text, unreviewed context and duplicate selectors cannot silently select the other pronunciation", () => {
  const changed = context(contexts[0]);
  changed.page.text += " Changed.";
  assert.equal(getContextualGuidedReadingWordAudioPath("bow", changed, contexts), "");
  assert.equal(getContextualGuidedReadingWordAudioPath("bow", context(contexts[0]), [{ ...contexts[0], status: "pending" }]), "");
  assert.throws(() => getContextualGuidedReadingWordAudioPath("bow", context(contexts[0]), [contexts[0], contexts[0]]), /Duplicate contextual/);
  const books = contexts.map(row => ({ id: row.bookId, pages: [{ pageNumber: row.pageNumber, text: row.pageText }] }));
  assert.deepEqual(validateContextualWordAudioEntries(books, { entries: contexts, verifyFiles: false }), []);
  assert.match(validateContextualWordAudioEntries(books, { entries: [{ ...contexts[0], pageText: "Wrong text." }], verifyFiles: false }).join("\n"), /exact source page/);
});

test("current context clips bind real source pages and bytes and share resolution with preload and release inventory", () => {
  const books = [..."abcde"].flatMap(level => JSON.parse(fs.readFileSync(new URL(`../../src/content/world-discovery/cohorts/11-20/level-${level}.json`, import.meta.url))));
  assert.deepEqual(validateContextualWordAudioEntries(books), []);
  const inventory = collectWorldDiscoveryCohortAudio(books);
  for (const row of GUIDED_READING_CONTEXTUAL_WORD_AUDIO) {
    const book = books.find(book => book.id === row.bookId);
    const page = book.pages.find(page => page.pageNumber === row.pageNumber);
    assert.equal(getGuidedReadingWordProductionAudioPath(row.word, { bookId: book.id, page }), row.audioPath);
    assert.equal(inventory.get(row.audioPath)?.audioSha256, row.audioSha256);
    assert.ok(readingSessionMediaUrls({ ...book, pages: [{ ...page, words: [{ text: row.word }] }] }, [page.pageNumber]).includes(row.audioPath));
  }
  const bow = GUIDED_READING_CONTEXTUAL_WORD_AUDIO.filter(row => row.word === "bow");
  assert.deepEqual(bow, [], "repaired ribbon/body-bow pages no longer consume either contextual selector");
  const remainingBowUses = books.flatMap(book => [...book.pages, { text: book.title, pageNumber: "title" }]
    .filter(page => (page.text.toLowerCase().match(/[a-z0-9]+(?:['’][a-z0-9]+)*(?:-[a-z0-9]+(?:['’][a-z0-9]+)*)*/g) || []).includes("bow"))
    .map(page => `${book.id}:${page.pageNumber}`));
  assert.deepEqual(remainingBowUses, [], "an actual bow use would still need its exact pronunciation review");
});

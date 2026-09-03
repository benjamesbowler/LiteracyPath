import assert from "node:assert/strict";
import test from "node:test";

import { GUIDED_READING_BRIDGE_BOOKS } from "../../src/data/guidedReadingBridgeBooks.js";
import { WILLOW_STREET_BOOK_MANIFEST } from "../../src/data/guidedReadingBridgeBooks.manifest.js";

const APPROVED_TITLES = Object.freeze([
  "The Lunchbox Mix-Up",
  "The Lost Library Book",
  "The Windy Picnic",
  "The Puddle Plan",
  "The Squeaky Wheel",
  "The Garden Gate",
  "Nani's Chapati Lunch",
  "Dumplings for New Year",
  "Drums for Carnival",
  "Eid Morning with Samir",
  "Grow a Bean in a Jar",
  "Make a Paper Kite",
  "Build a Cardboard Ramp",
  "Make Fruit and Yoghurt Cups",
  "From Wheat to Bread",
  "Where Rainwater Goes",
  "Inside a Fire Station",
  "How Paper Is Recycled",
  "A Snail Comes Out at Night",
  "How a Book Is Made"
]);

const countWords = text => text.trim().split(/\s+/u).filter(Boolean).length;

const collectKeys = value => {
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, nested]) => [key, ...collectKeys(nested)]);
};

test("Willow Street has the approved 20-title genre mix", () => {
  assert.equal(GUIDED_READING_BRIDGE_BOOKS.length, 20);
  assert.deepEqual(GUIDED_READING_BRIDGE_BOOKS.map(book => book.title), APPROVED_TITLES);
  const genreCounts = GUIDED_READING_BRIDGE_BOOKS.reduce((counts, book) => ({
    ...counts,
    [book.bridgeGenre]: (counts[book.bridgeGenre] || 0) + 1
  }), {});
  assert.deepEqual(genreCounts, {
    "everyday-fiction": 6,
    "culture-community": 4,
    procedure: 4,
    "photorealistic-nonfiction": 6
  });
});

test("each bridge manuscript keeps compact stable print and exact narration text", () => {
  for (const book of GUIDED_READING_BRIDGE_BOOKS) {
    assert.equal(book.level, "C");
    assert.equal(book.readingBandProfile, "standard");
    assert.equal(book.readingMode, "predictable-levelled");
    assert.equal(book.collection, "Willow Street Readers");
    assert.equal(book.pages.length, 8);
    assert.equal(new Set(book.pages.map(page => page.text)).size, 8, `${book.id}: duplicate reading page text`);
    for (const [index, page] of book.pages.entries()) {
      assert.equal(page.pageNumber, index + 1, `${book.id}: stable page order`);
      assert.equal(page.pageAudioText, page.text, `${book.id} page ${page.pageNumber}: exact audio text`);
      assert.ok(countWords(page.text) >= 6 && countWords(page.text) <= 12, `${book.id} page ${page.pageNumber}: ${countWords(page.text)} words`);
      assert.match(page.text, /[.!?]$/u, `${book.id} page ${page.pageNumber}: final punctuation`);
      assert.ok(page.imageBrief.trim().length >= 80, `${book.id} page ${page.pageNumber}: detailed page-specific brief`);
    }
  }
});

test("legacy types and visual treatments follow the approved 10/10 and 14/6 split", () => {
  const count = (field, value) => GUIDED_READING_BRIDGE_BOOKS.filter(book => book[field] === value).length;
  assert.equal(count("type", "fiction"), 10);
  assert.equal(count("type", "nonfiction"), 10);
  assert.equal(count("visualTreatment", "willow-street-illustrated"), 14);
  assert.equal(count("visualTreatment", "self-created-photorealistic"), 6);
});

test("all cover, page image, and page audio paths are final and unique", () => {
  const images = [];
  const audio = [];
  const ids = new Set();
  for (const book of GUIDED_READING_BRIDGE_BOOKS) {
    assert.match(book.id, /^willow-street-[a-z0-9-]+$/u);
    assert.equal(ids.has(book.id), false, `${book.id}: duplicate ID`);
    ids.add(book.id);
    assert.match(book.coverImage, /^\/guided-reading\/willow-street\/[a-z0-9-]+\/cover\.webp$/u);
    assert.ok(book.coverBrief.trim().length >= 80, `${book.id}: detailed cover brief`);
    images.push(book.coverImage);
    for (const page of book.pages) {
      assert.match(page.image, new RegExp(`^/guided-reading/willow-street/[a-z0-9-]+/page-${String(page.pageNumber).padStart(2, "0")}\\.webp$`, "u"));
      assert.match(page.audio, new RegExp(`^/guided-reading/audio/willow-street/[a-z0-9-]+/page-${String(page.pageNumber).padStart(2, "0")}\\.mp3$`, "u"));
      images.push(page.image);
      audio.push(page.audio);
    }
  }
  assert.equal(new Set(images).size, images.length, "every cover and page image path must be unique");
  assert.equal(new Set(audio).size, audio.length, "every narration path must be unique");
});

test("manuscripts contain meaningful reviewed repetition and no quiz material", () => {
  const forbiddenKeys = /^(answers?|choices?|correctAnswer|question|questions|quiz|score|stars)$/iu;
  for (const book of GUIDED_READING_BRIDGE_BOOKS) {
    assert.match(book.repeatedLanguage, /\S/u, `${book.id}: named repeated language`);
    const normalizedPages = book.pages.map(page => page.text.toLowerCase());
    assert.ok(
      normalizedPages.filter(text => text.includes(book.repeatedLanguage.toLowerCase())).length >= 2,
      `${book.id}: repeated language must support prediction on at least two pages`
    );
    assert.equal(
      collectKeys(book).some(key => forbiddenKeys.test(key)),
      false,
      `${book.id}: no quiz or question fields`
    );
    assert.ok(book.storyBibleReview && typeof book.storyBibleReview === "object", `${book.id}: Story Bible evidence`);
  }
});

test("procedures publish a complete safe order", () => {
  for (const book of GUIDED_READING_BRIDGE_BOOKS.filter(entry => entry.bridgeGenre === "procedure")) {
    assert.deepEqual(book.pages.map(page => page.procedureStep), [1, 2, 3, 4, 5, 6, 7, 8], `${book.id}: ordered steps`);
    assert.match(book.safetyNote, /adult|grown-up|wash|safe/iu, `${book.id}: concrete safety note`);
  }
});

test("food and ramp procedures expose every safety and comparison step to readers", () => {
  const fruit = GUIDED_READING_BRIDGE_BOOKS.find(book => book.title === "Make Fruit and Yoghurt Cups");
  assert.match(fruit.pages[0].text, /adult.*check.*allerg/iu);
  assert.match(fruit.pages[1].text, /wash.*hands.*fruit/iu);
  assert.match(fruit.pages[2].text, /adult.*cut/iu);
  assert.doesNotMatch(fruit.pages.map(page => page.text).join(" "), /yoghurt/iu);

  const ramp = GUIDED_READING_BRIDGE_BOOKS.find(book => book.title === "Build a Cardboard Ramp");
  assert.match(ramp.pages[5].text, /release.*mark.*stop/iu);
  assert.match(ramp.pages[6].text, /raise.*release.*again.*mark/iu);
  assert.match(ramp.pages[7].text, /compare.*both marks/iu);
});

test("fiction review evidence matches reader-visible setbacks and resolutions", () => {
  const eid = GUIDED_READING_BRIDGE_BOOKS.find(book => book.title === "Eid Morning with Samir");
  assert.match(eid.pages[3].text, /hopes.*Maya/iu);
  assert.match(eid.pages[4].text, /doorway.*hides Maya/iu);
  assert.match(eid.pages[6].text, /finds Maya/iu);
  assert.match(eid.storyBibleReview.storySpine, /hopes.*Maya/iu);
  assert.match(eid.storyBibleReview.failedAttempt, /doorway.*hide/iu);
  assert.match(eid.storyBibleReview.resolution, /finds Maya/iu);

  const puddle = GUIDED_READING_BRIDGE_BOOKS.find(book => book.title === "The Puddle Plan");
  assert.doesNotMatch(puddle.pages[7].text, /clean.*feet/iu);
  assert.match(puddle.pages[7].text, /safe.*dry (?:way|path|route)/iu);
  assert.match(puddle.pages[7].imageBrief, /Leo.*muddy boot/iu);
});

test("child-visible Willow page fields use U.S. English", () => {
  const nonUs = /\b(?:neighbours?|centres?|centred|vapour|yoghurt|grey|colours?|colourful|organised|organising|fibres?|behaviour)\b/iu;
  for (const book of GUIDED_READING_BRIDGE_BOOKS) {
    for (const page of book.pages) {
      for (const field of ["text", "pageAudioText", "imageAlt", "pageDescription"]) {
        assert.doesNotMatch(String(page[field] || ""), nonUs, `${book.id} page ${page.pageNumber} ${field}`);
      }
    }
  }
});

test("product records exclude prohibited topics and outside programme copy", () => {
  const productCopy = JSON.stringify(GUIDED_READING_BRIDGE_BOOKS);
  assert.doesNotMatch(productCopy, /romance|sexuality|gender identity|political|fountas|pinnell|reading recovery|crosswalk/iu);
});

test("the static manifest exactly mirrors the authored collection", () => {
  assert.equal(WILLOW_STREET_BOOK_MANIFEST.length, 20);
  assert.deepEqual(
    WILLOW_STREET_BOOK_MANIFEST.map(({ id, title, bridgeGenre, visualTreatment, pageCount }) => ({ id, title, bridgeGenre, visualTreatment, pageCount })),
    GUIDED_READING_BRIDGE_BOOKS.map(({ id, title, bridgeGenre, visualTreatment, pages }) => ({
      id,
      title,
      bridgeGenre,
      visualTreatment,
      pageCount: pages.length
    }))
  );
});

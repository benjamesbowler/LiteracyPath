import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { GUIDED_READING_NEXT_STEPS_BOOKS as next, GUIDED_READING_NEXT_STEPS_LEVEL_REVIEWS as nextReviews } from '../../src/data/guidedReadingNextStepsBooks.js';
import { GUIDED_READING_BRIGHT_IDEAS_BOOKS as bright, GUIDED_READING_BRIGHT_IDEAS_LEVEL_REVIEWS as brightReviews } from '../../src/data/guidedReadingBrightIdeasBooks.js';
import { auditDecodableBook } from '../../src/utils/guidedReading/decodableScope.js';
import { fingerprintBookReadingText, tokenizeReadingText } from '../../src/utils/guidedReading/textMetrics.js';
import { requiredNextStepsLessons, declaredNextStepsLessons } from '../../src/data/nextStepsPhonicsLessons.js';
import { validateSharedReadAloudManuscript } from '../../tools/sharedReadAloudGateLib.mjs';

const books = [...next, ...bright];
const countBy = (rows, key) => rows.reduce((counts, row) => {
  counts[row[key]] = (counts[row[key]] || 0) + 1;
  return counts;
}, {});

test('all fifty titles and ordered manuscripts match the independently frozen review', () => {
  assert.equal(next.length, 30);
  assert.equal(bright.length, 20);
  assert.equal(new Set(books.map(book => book.id)).size, 50);
  assert.equal(next.reduce((sum, book) => sum + book.pages.length, 0), 220);
  assert.equal(bright.reduce((sum, book) => sum + book.pages.length, 0), 220);
  const readingText = books.map(book => ({id: book.id, title: book.title, pages: book.pages.map(page => page.text)}));
  // Taken from all three SHA-verified source manuscripts in the independent text freeze.
  assert.equal(createHash('sha256').update(JSON.stringify(readingText)).digest('hex'), 'e55be4a1abcd87071fb78990487fc9c335bf307b8fa289ef622e3e9b109ac49e');
  for (const book of books) {
    assert.equal(fingerprintBookReadingText(book), book.reviewedTextFingerprint, book.id);
    assert.equal(createHash('sha256').update(JSON.stringify(book.pages.map(page => page.text))).digest('hex'), book.reviewedManuscriptSha256, book.id);
    assert.deepEqual(book.pages.map(page => page.pageNumber), Array.from({length:book.pages.length}, (_,i) => i+1), book.id);
  }
});

test('app bands, print envelopes and reading purposes remain separate editorial claims', () => {
  assert.deepEqual(countBy(next, 'appLevel'), {A:8, B:15, C:7});
  assert.deepEqual(countBy(next, 'readingMode'), {decodable:30});
  assert.deepEqual(countBy(bright, 'appLevel'), {A:2, B:2, C:3, D:4, E:3, F:3, G:2, H:1});
  assert.deepEqual(countBy(bright, 'readingMode'), {'predictable-levelled':17, 'supported-read-together':3});
  for (const book of books) {
    const review = {...nextReviews, ...brightReviews}[book.id];
    assert.equal(review.appReadingLevel, book.appLevel, book.id);
    assert.equal(review.reviewedTextFingerprint, book.reviewedTextFingerprint, book.id);
    assert.ok(review.rationale.length > 30, book.id);
  }
  assert.equal(bright[4].appLevel, 'C');
  assert.equal(bright[4].level, 'B');
  for (const book of bright.slice(17,19)) {
    assert.equal(book.appLevel, 'G');
    assert.equal(book.level, 'C');
    assert.equal(book.readingBandProfile, 'extended');
  }
  assert.deepEqual(validateSharedReadAloudManuscript(bright[19]), []);
  assert.equal(bright[19].independentReadingLevel, null);
  assert.ok(bright.every(book => !book.decodableScope && !book.fullTextDecodingEvidence));
});

test('every decodable title and page passes exact correspondence, exception and blend prerequisites', () => {
  for (const book of next) {
    const audit = auditDecodableBook(book);
    assert.equal(audit.valid, true, `${book.id}: ${audit.failures.join('; ')}`);
    assert.equal(audit.unsupportedTokens, 0, book.id);
    assert.deepEqual(declaredNextStepsLessons(book).map(lesson => lesson.id), requiredNextStepsLessons(book).map(lesson => lesson.id), book.id);
    assert.equal(book.decodableScope.reviewedTextFingerprint, book.reviewedTextFingerprint);
  }
  assert.equal(next[0].decodableScope.afterCycle, 6);
  assert.equal(next[1].decodableScope.afterCycle, 9);
  const noBlendingLesson = structuredClone(next[15]);
  noBlendingLesson.decodableScope.additionalPrerequisites = [];
  assert.equal(auditDecodableBook(noBlendingLesson).valid, false);
  const untaughtWord = structuredClone(next[0]);
  untaughtWord.pages[0].text += ' Sheep.';
  assert.equal(auditDecodableBook(untaughtWord).valid, false);
});

test('all teaching routines use actual book words and distinct oral and visual teacher moves', () => {
  for (const book of books) {
    const guide = book.foundationsGuide;
    const words = new Set(tokenizeReadingText(book.title + ' ' + book.pages.map(page => page.text).join(' ')).map(word => word.toLowerCase()));
    assert.ok(guide.soundLetter.grapheme && guide.soundLetter.sound && guide.soundLetter.model, book.id);
    assert.ok(words.has(guide.soundLetter.word.toLowerCase()), book.id);
    assert.ok(guide.decoding.words.length >= 2, book.id);
    for (const word of guide.decoding.words) assert.ok(words.has(word.toLowerCase()), `${book.id}: ${word}`);
    assert.ok(guide.decoding.model && guide.connectedReading && guide.fluency, book.id);
    assert.ok(book.discussion.oral.prompt && book.discussion.oral.listenFor, book.id);
    assert.ok(book.discussion.visual.prompt && book.discussion.visual.lookFor, book.id);
    assert.ok(book.pages.some(page => page.pageNumber === book.discussion.visual.page), book.id);
    assert.notEqual(book.discussion.oral.prompt, book.discussion.visual.prompt, book.id);
  }
});

test('page text stays exact for narration, while accepted descriptions and media paths stay separate', () => {
  for (const book of books) {
    assert.ok(Object.isFrozen(book) && Object.isFrozen(book.pages), book.id);
    const folder = `/guided-reading/${book.seriesId}/book-${String(book.number).padStart(2,'0')}`;
    assert.equal(book.coverImage, `${folder}/cover.webp`);
    for (const page of book.pages) {
      assert.equal(page.pageAudioText, page.text, `${book.id}:${page.pageNumber}`);
      assert.equal(page.image, `${folder}/page-${String(page.pageNumber).padStart(2,'0')}.webp`);
      assert.ok(page.imageAlt.length > 12, book.id);
      assert.equal(page.imageAlt, page.pageDescription, book.id);
      assert.equal(page.narrationProfile, 'leda');
    }
  }
});

test('physical art corrections do not alter the frozen narration', () => {
  const mat = next[8];
  assert.match(mat.foundationsGuide.languagePrep.find(item => item.word === 'mat').meaning, /reusable work mat/);
  assert.doesNotMatch(JSON.stringify({setting:mat.setting,props:mat.props,pages:mat.pages.map(page=>page.imageBrief)}), /paper work mat/);
  assert.match(next[16].props[0], /rim-down, rim-up, rim-down/);
  assert.match(next[15].pages[5].imageBrief, /returning to the log/);
  assert.match(bright[8].props[0], /zero meets the inner floor/);
  assert.match(bright[8].pages[4].state, /gauge alone/);
  assert.match(bright[16].pages[11].imageAlt, /face down/);
  assert.match(bright[17].pages[10].imageAlt, /face down/);
});

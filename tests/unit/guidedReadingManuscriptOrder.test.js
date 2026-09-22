import assert from 'node:assert/strict';
import test from 'node:test';
import { guidedReadingBooks } from '../../src/data/guidedReadingBooks.js';
import { GUIDED_READING_HUMAN_FICTION_REWRITES } from '../../src/content/guidedReadingHumanFictionRewrites.js';
import { GUIDED_READING_WORLD_FICTION_REWRITES } from '../../src/content/guidedReadingWorldFictionRewrites.js';
import { GUIDED_READING_STORY_BIBLE_REWRITES } from '../../src/content/guidedReadingStoryBibleRewrites.js';

test('selected manuscripts preserve source image identities in the requested reading order', () => {
  const selected = Object.entries({ ...GUIDED_READING_STORY_BIBLE_REWRITES, ...GUIDED_READING_HUMAN_FICTION_REWRITES, ...GUIDED_READING_WORLD_FICTION_REWRITES })
    .filter(([, rewrite]) => rewrite.sourcePageNumbers);
  assert.ok(selected.length > 0);
  for (const [id, rewrite] of selected) {
    const book = guidedReadingBooks.find(candidate => candidate.id === id);
    const pages = book.pages.filter(page => page.active !== false && page.qaStatus === 'approved');
    assert.deepEqual(pages.map(page => page.pageNumber), rewrite.sourcePageNumbers, id);
    assert.deepEqual(pages.map(page => page.text), rewrite.pages, id);
    for (const page of pages) {
      assert.match(page.image, new RegExp(`page-${String(page.pageNumber).padStart(3, '0')}\\.webp$`), `${id}: image follows source page ${page.pageNumber}`);
      assert.equal(page.pageAudioText, page.text, `${id}: narration follows displayed text`);
    }
  }
});

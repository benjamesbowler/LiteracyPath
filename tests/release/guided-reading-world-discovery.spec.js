import { expect, test } from '@playwright/test';
import { GUIDED_READING_WORLD_DISCOVERY_BOOKS as books, GUIDED_READING_WORLD_DISCOVERY_LEVEL_REVIEWS as levelReviews } from '../../src/data/guidedReadingWorldDiscoveryBooks.js';
import { getRuntimeGuidedReadingBooks } from '../../src/utils/guidedReading/runtimeBooks.js';
import { guidedReadingProgressKey } from '../../src/utils/guidedReading/editions.js';
import { getGuidedReadingPageAudioPath, getGuidedReadingWordProductionAudioPath } from '../../src/utils/guidedReading/readAloudPolicy.js';
import { appReadingLevelLabel } from '../../src/utils/guidedReading/bookTextAnalysis.js';
import { STUDENT_DEVICE_PROFILES, STUDENT_MINIMUM_TARGET_PX } from '../../src/policy/studentDeviceMatrix.js';
import { expectPrintedWordsVisible } from './helpers/guidedReadingGeometry.js';
import cohortManifest from '../../src/content/world-discovery/cohorts.json' with { type: 'json' };
import { GUIDED_READING_CONTEXTUAL_WORD_AUDIO } from '../../src/data/guidedReadingContextualWordAudio.js';

const words = text => String(text).match(/[A-Za-z0-9]+(?:['’][A-Za-z0-9]+)*(?:-[A-Za-z0-9]+(?:['’][A-Za-z0-9]+)*)*/g) || [];
const portrait = STUDENT_DEVICE_PROFILES.find(profile => profile.id === 'tablet-portrait');
const selectedIds = process.env.LP_WORLD_DISCOVERY_BOOK_IDS?.split(',').filter(Boolean);
if (selectedIds?.some(id => !books.some(book => book.id === id))) throw Error('Unknown LP_WORLD_DISCOVERY_BOOK_IDS value');
const selected = selectedIds ? books.filter(book => selectedIds.includes(book.id)) : books;
const activeCohorts = cohortManifest.cohorts.filter(cohort => cohort.active);
const expectedBooks = activeCohorts.reduce((total, cohort) => total + cohort.expectedBooks, 0);
const publicLevelBooks = level => books.filter(book => levelReviews[book.id].appReadingLevel === level);

function observeRealAudio() {
  window.__worldDiscoveryAudio = [];
  const original = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function(...args) {
    window.__worldDiscoveryAudio.push(this);
    return original.apply(this, args);
  };
}

async function expectAudioStarted(page, source) {
  expect(source).toBeTruthy();
  await expect.poll(() => page.evaluate(path => window.__worldDiscoveryAudio.some(audio =>
    new URL(audio.currentSrc || audio.src).pathname === path && audio.currentTime > 0 && !audio.error
  ), source.split('?')[0])).toBe(true);
}

async function expectPage(reader, book, index) {
  await expect(reader.getByRole('status', { name: 'Reading progress' })).toHaveText(`Page ${index + 1} of ${book.pages.length}`);
  const text = reader.locator('.guided-page-text');
  await expect(text).toHaveClass(/is-ready/);
  await expect.poll(async () => words(await text.innerText())).toEqual(words(book.pages[index].text));
  const image = reader.locator('.guided-page-image');
  await expect.poll(() => image.getAttribute('src')).toContain(book.pages[index].image);
  await expect.poll(() => image.evaluate(node => node.complete && node.naturalWidth >= 1000 && node.naturalHeight >= 650)).toBe(true);
  await expect(image).toHaveAttribute('alt', book.pages[index].imageAlt);
  await expectPrintedWordsVisible(reader);
  expect(await image.evaluate(node => getComputedStyle(node).objectFit)).toBe('contain');
  expect(await reader.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  for (const button of await reader.locator('.guided-transport button:visible').all()) {
    await expect(button).toBeInViewport({ ratio: 1 });
    const bounds = await button.boundingBox();
    expect(bounds.width).toBeGreaterThanOrEqual(STUDENT_MINIMUM_TARGET_PX);
    expect(bounds.height).toBeGreaterThanOrEqual(STUDENT_MINIMUM_TARGET_PX);
  }
}

test('all declared registered books are in the real runtime at current public levels A–E', () => {
  const live = getRuntimeGuidedReadingBooks().filter(book => book.seriesId === 'world-discovery');
  expect(live).toHaveLength(expectedBooks);
  for (const level of ['A', 'B', 'C', 'D', 'E']) {
    expect(live.filter(book => book.appReadingLevel === level && book.appReadingLevelStatus === 'current')).toHaveLength(publicLevelBooks(level).length);
  }
  for (const book of books) expect(live.find(row => row.id === book.id)?.pages.map(page => page.text)).toEqual(book.pages.map(page => page.text));
});

for (const book of selected) test(`${book.id} every page, real narration, word help and completion`, async ({ page }, info) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: portrait.width, height: portrait.height });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.addInitScript(observeRealAudio);
  await page.goto(`/preview/guided-reading-preview.html?book=${book.id}`);
  const reader = page.getByRole('region', { name: `${book.title} full-screen reader` });
  await expect(reader).toBeVisible();
  for (const [index, readingPage] of book.pages.entries()) {
    await expectPage(reader, book, index);
    await page.evaluate(() => { window.__worldDiscoveryAudio = []; });
    await reader.getByRole('button', { name: 'Hear this page', exact: true }).click();
    await expectAudioStarted(page, getGuidedReadingPageAudioPath(readingPage));
    const pageWords = words(readingPage.text);
    const contextualWords = GUIDED_READING_CONTEXTUAL_WORD_AUDIO
      .filter(row => row.bookId === book.id && row.pageNumber === readingPage.pageNumber)
      .map(row => pageWords.find(word => word.toLowerCase() === row.word));
    for (const word of new Set([pageWords.at(-1), ...contextualWords])) {
      expect(word).toBeTruthy();
      await page.evaluate(() => { window.__worldDiscoveryAudio = []; });
      await reader.getByRole('button', { name: `Get reading help for ${word}`, exact: true }).last().click();
      await expectAudioStarted(page, getGuidedReadingWordProductionAudioPath(word, { bookId: book.id, page: readingPage }));
    }
    await expectPrintedWordsVisible(reader);
    await page.screenshot({ path: info.outputPath(`page-${String(index + 1).padStart(2, '0')}.png`) });
    if (index === 0) {
      await page.keyboard.press('ArrowRight');
      await expectPage(reader, book, 1);
      await page.keyboard.press('ArrowLeft');
      await expectPage(reader, book, 0);
    }
    await reader.getByRole('button', { name: index + 1 === book.pages.length ? 'Finish book' : 'Next page', exact: true }).click();
  }
  await expect(reader).not.toBeVisible();
  await expect.poll(() => page.evaluate(id => window.__guidedReadingPreviewRecords[id]?.completed, guidedReadingProgressKey(book))).toBe(true);
  expect(errors).toEqual([]);
});

for (const viewport of STUDENT_DEVICE_PROFILES.filter(profile => profile.id !== portrait.id)) {
  for (const level of ['A', 'B', 'C', 'D', 'E']) {
    const book = publicLevelBooks(level).sort((a, b) => Math.max(...b.pages.map(page => page.text.length)) - Math.max(...a.pages.map(page => page.text.length)))[0];
    test(`${level} longest reader at ${viewport.id}`, async ({ page }, info) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.goto(`/preview/guided-reading-preview.html?book=${book.id}`);
      const reader = page.getByRole('region', { name: `${book.title} full-screen reader` });
      for (const index of book.pages.keys()) {
        await expectPage(reader, book, index);
        await page.screenshot({ path: info.outputPath(`page-${index + 1}.png`) });
        if (index + 1 < book.pages.length) await reader.getByRole('button', { name: 'Next page', exact: true }).click();
      }
    });
  }
}

// This short page exposed a clipped final word in the small-phone word-target
// layout. The longest-book matrix alone does not exercise every wrapping shape.
for (const viewport of STUDENT_DEVICE_PROFILES.filter(profile => profile.family === 'small-phone')) {
  for (const reducedMotion of ['no-preference', 'reduce']) {
    test(`B19 page 7 word help and replay at ${viewport.id}, motion ${reducedMotion}`, async ({ page }, info) => {
      const book = books.find(row => row.id === 'world-discovery-b-19');
      const index = 6, readingPage = book.pages[index];
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.emulateMedia({ reducedMotion });
      await page.addInitScript(observeRealAudio);
      await page.goto(`/preview/guided-reading-preview.html?book=${book.id}`);
      const reader = page.getByRole('region', { name: `${book.title} full-screen reader` });
      await expect(reader).toBeVisible();
      for (let current = 0; current < index; current += 1) {
        await reader.getByRole('button', { name: 'Next page', exact: true }).click();
        await expect(reader.getByRole('status', { name: 'Reading progress' }))
          .toHaveText(`Page ${current + 2} of ${book.pages.length}`);
      }
      await expectPage(reader, book, index);
      await expect(reader.locator('.guided-page-text .guided-word')).toHaveCount(words(readingPage.text).length);

      const word = words(readingPage.text).at(-1);
      await page.evaluate(() => { window.__worldDiscoveryAudio = []; });
      await reader.getByRole('button', { name: `Get reading help for ${word}`, exact: true }).click();
      await expectAudioStarted(page, getGuidedReadingWordProductionAudioPath(word, { bookId: book.id, page: readingPage }));
      await expect(reader.locator('.guided-decoding-support')).toBeVisible();
      await expectPrintedWordsVisible(reader);
      await page.screenshot({ path: info.outputPath('page-7-word-help.png') });
      for (const step of [2, 3]) {
        await reader.getByRole('button', { name: `Get reading help for ${word}`, exact: true }).click();
        await expect(reader.locator('.guided-decoding-support')).toContainText(`Reading help ${step} of 3`);
        await expectPrintedWordsVisible(reader);
        await page.screenshot({ path: info.outputPath(`page-7-help-step-${step}.png`) });
      }

      // Start, stop and replay actual page audio while checking the resulting
      // text layout; no mocked audio success or forced clicks are used.
      for (let play = 0; play < 2; play += 1) {
        await page.evaluate(() => { window.__worldDiscoveryAudio = []; });
        await reader.getByRole('button', { name: 'Hear this page', exact: true }).click();
        await expectAudioStarted(page, getGuidedReadingPageAudioPath(readingPage));
        await expectPrintedWordsVisible(reader);
        await reader.getByRole('button', { name: 'Stop page audio', exact: true }).click();
        await expect(reader.getByRole('button', { name: 'Hear this page', exact: true })).toBeVisible();
      }
      await expectPage(reader, book, index);
      await page.screenshot({ path: info.outputPath('page-7-replayed.png') });
      await reader.getByRole('button', { name: 'Next page', exact: true }).click();
      await expectPage(reader, book, index + 1);
      await reader.getByRole('button', { name: 'Previous page', exact: true }).click();
      await expectPage(reader, book, index);
      await page.screenshot({ path: info.outputPath('page-7-returned.png') });
      expect(errors).toEqual([]);
    });
  }
}

test('World Discovery child library has every declared ordered cover and public shelf', async ({ page }, info) => {
  await page.setViewportSize({ width: portrait.width, height: portrait.height });
  await page.goto('/preview/child-surfaces.html?surface=reading-library');
  await page.getByRole('button', { name: 'Find a book', exact: true }).click();
  await page.getByLabel('Friends or topic', { exact: true }).selectOption('world-discovery');
  await page.getByRole('button', { name: 'Back to shelf', exact: true }).click();
  const cards = page.locator("button[data-book-id^='world-discovery-']");
  await expect(cards).toHaveCount(expectedBooks);
  expect(await cards.evaluateAll(nodes => nodes.map(node => node.dataset.bookId))).toEqual(books.map(book => book.id));
  for (const level of ['A', 'B', 'C', 'D', 'E']) {
    await page.getByRole('navigation', { name: 'Book levels' }).getByRole('button', { name: appReadingLevelLabel(level), exact: true }).click();
    await expect(cards).toHaveCount(publicLevelBooks(level).length);
    expect(await cards.evaluateAll(nodes => nodes.map(node => node.dataset.bookId))).toEqual(publicLevelBooks(level).map(book => book.id));
    for (const card of await cards.all()) {
      await card.scrollIntoViewIfNeeded();
      await expect.poll(() => card.locator('img').first().evaluate(node => node.complete && node.naturalWidth > 0)).toBe(true);
      await expect(card).toBeInViewport();
    }
    await cards.first().scrollIntoViewIfNeeded();
    await page.screenshot({ path: info.outputPath(`shelf-${level}.png`) });
  }
});

for (const cohort of activeCohorts) for (const level of ['A', 'B', 'C', 'D', 'E']) test(`${cohort.id} ${level} class preview, real audio and audience actions`, async ({ page }, info) => {
  const book = books.find(row => row.appLevel === level && row.number === cohort.firstNumber);
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.addInitScript(observeRealAudio);
  await page.goto(`/preview/guided-reading-preview.html?book=${book.id}&mode=class&audience-actions&assignment`);
  const reader = page.locator('.guided-reader-shell');
  const card = reader.locator(':scope > .guided-reader-card');
  await card.scrollIntoViewIfNeeded();
  await expectPrintedWordsVisible(reader);
  await reader.getByRole('button', { name: 'Read page', exact: true }).click();
  await expectAudioStarted(page, getGuidedReadingPageAudioPath(book.pages[0]));
  await reader.getByRole('button', { name: 'Next page', exact: true }).click();
  await expect(reader.getByRole('status', { name: 'Reading progress' })).toHaveText(`Page 2 of ${book.pages.length}`);
  await card.scrollIntoViewIfNeeded();
  await expectPrintedWordsVisible(reader);
  await page.screenshot({ path: info.outputPath('class-reader.png') });
  const audience = reader.getByRole('region', { name: 'Use this book' });
  for (const [label, key] of [['Read with a student', '__guidedReadingStudentBookId'], ['Read together', '__guidedReadingTogetherBookId'], ['Assign independently', '__guidedReadingAssignedBookId']]) {
    await audience.getByRole('button', { name: label, exact: true }).click();
    expect(await page.evaluate(name => window[name], key)).toBe(book.id);
  }
  expect(await page.evaluate(() => window.__guidedReadingPreviewRecords)).toEqual({});
});

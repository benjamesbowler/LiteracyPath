import { expect, test } from '@playwright/test';
import { getRuntimeGuidedReadingBooks } from '../../src/utils/guidedReading/runtimeBooks.js';
import { getGuidedReadingPageAudioPath, getGuidedReadingWordProductionAudioPath } from '../../src/utils/guidedReading/readAloudPolicy.js';
import { expectPrintedWordsVisible } from './helpers/guidedReadingGeometry.js';

const books = getRuntimeGuidedReadingBooks();
const words = text => String(text).match(/[A-Za-z0-9]+(?:['’][A-Za-z0-9]+)*(?:-[A-Za-z0-9]+(?:['’][A-Za-z0-9]+)*)*/g) || [];

// These longer prose books exposed a sibling defect to beginner word targets:
// the help card consumed the right-hand text column on a 568x320 phone.
for (const bookId of ['moonwood-tales-c-15', 'moonwood-tales-c-24', 'bright-ideas-18']) {
  for (const reducedMotion of ['no-preference', 'reduce']) {
    test(`${bookId} keeps the whole page visible through all word-help stages (${reducedMotion})`, async ({ page }, info) => {
      const book = books.find(row => row.id === bookId);
      expect(book).toBeTruthy();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.setViewportSize({ width: 568, height: 320 });
      await page.emulateMedia({ reducedMotion });
      await page.addInitScript(() => {
        window.__longPageAudio = [];
        const play = HTMLMediaElement.prototype.play;
        HTMLMediaElement.prototype.play = function (...args) {
          window.__longPageAudio.push(this);
          return play.apply(this, args);
        };
      });
      await page.goto(`/preview/guided-reading-preview.html?book=${book.id}`);
      const reader = page.getByRole('region', { name: `${book.title} full-screen reader` });
      await expect(reader).toBeVisible();
      const longest = book.pages.reduce((best, current, index) => current.text.length > book.pages[best].text.length ? index : best, 0);
      const expectAudio = async source => {
        expect(source).toBeTruthy();
        await expect.poll(() => page.evaluate(path => window.__longPageAudio.some(audio =>
          new URL(audio.currentSrc || audio.src).pathname === path && audio.currentTime > 0 && !audio.error
        ), source.split('?')[0])).toBe(true);
      };
      for (let index = 0; index <= longest; index += 1) {
        const readingPage = book.pages[index];
        await expect(reader.getByRole('status', { name: 'Reading progress' })).toHaveText(`Page ${index + 1} of ${book.pages.length}`);
        await expect.poll(async () => words(await reader.locator('.guided-page-text').innerText())).toEqual(words(readingPage.text));
        if (index === 0 || index === longest) {
          await expectPrintedWordsVisible(reader);
          const word = words(readingPage.text).at(-1);
          const target = reader.getByRole('button', { name: `Get reading help for ${word}`, exact: true }).last();
          for (const stage of [1, 2, 3]) {
            await target.click();
            await expect(reader.locator('.guided-decoding-support')).toContainText(`Reading help ${stage} of 3`);
            if (stage === 1) await expectAudio(getGuidedReadingWordProductionAudioPath(word, { bookId: book.id, page: readingPage }));
            await expectPrintedWordsVisible(reader);
            await page.screenshot({ path: info.outputPath(`page-${index + 1}-help-${stage}.png`) });
          }
          await reader.getByRole('button', { name: 'Hear this page', exact: true }).click();
          await expectAudio(getGuidedReadingPageAudioPath(readingPage));
          await expectPrintedWordsVisible(reader);
          await reader.getByRole('button', { name: 'Stop page audio', exact: true }).click();
        }
        if (index < longest) await reader.getByRole('button', { name: 'Next page', exact: true }).click();
      }
      expect(errors).toEqual([]);
    });
  }
}

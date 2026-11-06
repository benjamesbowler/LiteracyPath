import { expect, test } from '@playwright/test';
import { STUDENT_DEVICE_PROFILES, STUDENT_MINIMUM_TARGET_PX } from '../../src/policy/studentDeviceMatrix.js';

const url = '/tests/fixtures/map-question-layout.html';
async function answerFit(page, selector) {
  return page.locator(selector).evaluateAll((buttons, minimum) => buttons.flatMap(button => {
    const box = button.getBoundingClientRect();
    if (!box.width || !box.height) return [];
    const problems = [];
    if (box.width < minimum - 1 || box.height < minimum - 1) problems.push(`Small touch target: ${button.textContent}`);
    if (box.left < -1 || box.right > innerWidth + 1) problems.push(`Off-screen answer: ${button.textContent}`);
    const walker = document.createTreeWalker(button, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (!node.textContent.trim() || node.parentElement.closest('svg, .sr-only')) continue;
      const range = document.createRange(); range.selectNodeContents(node);
      if ([...range.getClientRects()].some(rect => rect.width && (rect.left < box.left - 1 || rect.right > box.right + 1 || rect.top < box.top - 1 || rect.bottom > box.bottom + 1))) problems.push(`Text outside its answer: ${node.textContent}`);
    }
    return problems;
  }), STUDENT_MINIMUM_TARGET_PX);
}

for (const profile of STUDENT_DEVICE_PROFILES) {
  test(`friendly sentence answers show only the answer and clear button states: ${profile.id}`, async ({ page }, info) => {
    await page.setViewportSize({ width: profile.width, height: profile.height });
    for (const [id, sentence, answer] of [
      ['words-2', 'I like to play with my friends.', '7'],
      ['words-3', 'Would you like some ice cream with me?', '8']
    ]) {
      await page.goto(`${url}?item=literacy.print_concepts.reference-${id}`);
      await page.waitForFunction(() => window.__mapLayout);
      await expect(page.locator('.passage')).toHaveText(sentence);
      const choices = page.locator('.choice-button');
      const labels = await choices.allTextContents();
      expect(labels.map(label => label.trim())).toEqual([String(Number(answer) - 1), answer, String(Number(answer) + 1)]);
      expect(await answerFit(page, '.choice-button')).toEqual([]);
      const button = choices.filter({ hasText: new RegExp(`^${answer}$`) });
      const appearance = () => button.evaluate(element => {
        const css = getComputedStyle(element);
        return { background: css.backgroundColor, border: css.borderColor, shadow: css.boxShadow };
      });
      const idle = await appearance();
      expect(idle.background).not.toBe('rgb(255, 255, 255)');
      expect(idle.border).toBe('rgb(82, 106, 166)');
      expect(idle.shadow).not.toBe('none');
      await button.focus();
      await expect(button).toBeFocused();
      await button.press('Enter');
      await expect(button).toHaveAttribute('aria-pressed', 'true');
      expect((await appearance()).background).not.toBe(idle.background);
      expect(await page.evaluate(() => window.__mapLayout.answer)).toBeNull();
      await page.getByRole('button', { name: 'Check answer', exact: true }).click();
      await expect.poll(() => page.evaluate(() => window.__mapLayout.answer)).toBe(answer);
      if (id === 'words-2' && profile.id === 'tablet-landscape') await page.screenshot({ path: info.outputPath('friendly-answer-buttons.png') });
    }
  });
  test(`the photographed missing-dog answers fit and remain selectable: ${profile.id}`, async ({ page }, info) => {
    await page.setViewportSize({ width: profile.width, height: profile.height });
    await page.goto(url);
    await page.waitForFunction(() => window.__mapLayout);
    await page.evaluate(() => document.fonts.ready);
    const choices = page.locator('.choice-button');
    await expect(choices).toHaveCount(3);
    expect(await answerFit(page, '.choice-button')).toEqual([]);
    await choices.filter({ hasText: 'Small brown dog with one white ear.' }).click();
    await expect(choices.filter({ hasText: 'Small brown dog with one white ear.' })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('button', { name: 'Check answer', exact: true })).toBeEnabled();
    expect(await page.evaluate(() => window.__mapLayout.answer)).toBeNull();
    await page.getByRole('button', { name: 'Check answer', exact: true }).click();
    await expect.poll(() => page.evaluate(() => window.__mapLayout.answer)).toBe('Small brown dog with one white ear.');
    if (profile.id === 'tablet-landscape') await page.screenshot({ path: info.outputPath('missing-dog-fixed.png') });
  });
}

test('selecting a one-letter word has a full touch target', async ({ page }) => {
  await page.goto(`${url}?bank=mock&item=mock.text.capital-i`);
  await page.waitForFunction(() => window.__mapLayout);
  expect(await answerFit(page, '.literacy-mock-text-selection button')).toEqual([]);
  const word = page.locator('.literacy-mock-text-selection button').filter({ hasText: /^i$/ });
  await word.click();
  await expect(word).toHaveAttribute('aria-pressed', 'true');
});

test('mock picture answers keep their pictures and selected state without position badges', async ({ page }) => {
  await page.goto(`${url}?bank=mock&item=lp3.initial_sounds.l1.C.a.v3`);
  const choices = page.locator('.literacy-mock-choice');
  await expect(choices).toHaveCount(4);
  await expect(page.locator('.literacy-mock-choice img')).toHaveCount(4);
  await expect(page.locator('.literacy-mock-answer-number')).toHaveCount(0);
  expect((await choices.allTextContents()).every(label => label.trim() === '')).toBe(true);
  await expect(choices.first()).toHaveCSS('background-color', 'rgb(238, 243, 255)');
  await choices.first().click();
  await expect(choices.first()).toHaveAttribute('aria-pressed', 'true');
  await expect(choices.first()).toHaveCSS('background-color', 'rgb(220, 231, 255)');
});

for (const item of ['literacy.print_concepts.interactive-text.first-clouds', 'literacy.writing_purpose.invite']) {
  test(`the passage Listen label stays inside its control: ${item}`, async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 700 });
    await page.goto(`${url}?item=${item}`);
    await page.waitForFunction(() => window.__mapLayout);
    await page.evaluate(() => document.fonts.ready);
    expect(await answerFit(page, '.assessment-question-layout button')).toEqual([]);
  });
}

for (const item of ['lp3.final_sounds.l2.A.sh.v1', 'literacy.adjectives.reference-chewy', 'literacy.prepositions.reference-train-tunnel']) {
  test(`phonics and picture labels fit a sideways phone: ${item}`, async ({ page }) => {
    await page.setViewportSize({ width: 568, height: 320 });
    await page.goto(`${url}?item=${item}`);
    await page.waitForFunction(() => window.__mapLayout);
    await page.evaluate(() => document.fonts.ready);
    expect(await answerFit(page, '.assessment-question-layout button')).toEqual([]);
    const choice = page.locator('.assessment-answer-card, .ixl-answer-button').last();
    await choice.click();
    await expect(choice).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: 'Check answer', exact: true }).click();
    await expect.poll(() => page.evaluate(() => window.__mapLayout.answer)).not.toBeNull();
  });
}

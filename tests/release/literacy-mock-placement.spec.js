import { test, expect } from '@playwright/test';
import { LITERACY_MOCK_RUNTIME_V12 as bank } from '../../src/data/generated/literacyMockRuntimeV12.generated.js';

test.describe.configure({ timeout: 90000 });
test.use({ hasTouch:true });
const root = '/tests/fixtures/literacy-mock.html';
async function openItem(page, id) {
  await page.goto(`${root}?case=${encodeURIComponent(test.info().testId)}&mode=format&version=literacy-mock-v12&item=${encodeURIComponent(id)}`);
  await expect(page.getByRole('region', { name:'Question 1', exact:true })).toBeVisible({ timeout:60000 });
  await page.getByRole('button', { name:'Listen to the question', exact:true }).click();
  return bank.find(item => item.id === id);
}

test('the letter case comparison shows a large reference letter and clear alternatives', async ({ page }, info) => {
  await page.setViewportSize({ width:1024, height:768 });
  await openItem(page, 'literacy.letter_knowledge.case-k.v11');
  await expect(page.getByRole('region', { name:'Letter to match', exact:true })).toBeVisible();
  await expect(page.locator('.literacy-mock-reference-glyph')).toHaveText('k');
  await expect(page.locator('.literacy-mock-reading-text')).toHaveCount(0);
  await expect(page.getByText('The passage', { exact:true })).toHaveCount(0);
  await expect(page.locator('.literacy-mock-choice')).toHaveCount(4);
  const boxes = await page.locator('.literacy-mock-reference-glyph, .literacy-mock-choice').evaluateAll(nodes => nodes.map(node => {
    const rect = node.getBoundingClientRect(); return { x:rect.x, y:rect.y, right:rect.right, bottom:rect.bottom, font:parseFloat(getComputedStyle(node).fontSize) };
  }));
  for (const box of boxes) { expect(box.x).toBeGreaterThanOrEqual(0); expect(box.right).toBeLessThanOrEqual(1024); expect(box.bottom).toBeLessThanOrEqual(768); expect(box.font).toBeGreaterThanOrEqual(32); }
  await page.getByRole('group', { name:'Tiles to place', exact:true }).getByRole('button', { name:'K', exact:true }).click();
  const space = page.getByRole('button', { name:/^Space 1 for k/ });
  await expect(space).toHaveText('Place here');
  await space.click(); await expect(space).toHaveText('K');
  await page.screenshot({ path:info.outputPath('letter-case-reference.png') });
});

test('pupil setup sends each selected question maximum to the session service', async ({ page }) => {
  for (const count of [15,25,40]) {
    await page.goto(`${root}?case=${encodeURIComponent(test.info().testId)}-${count}&mode=teacher&version=literacy-mock-v12`);
    await page.getByRole('button', { name:'Prepare', exact:true }).click();
    const setup = page.locator('.literacy-mock-setup');
    if (!await setup.evaluate(node => node.open)) await setup.locator(':scope > summary').click();
    const selector = page.getByRole('combobox', { name:'Questions', exact:true });
    await expect(selector.locator('option')).toHaveText(['Up to 15 questions','Up to 25 questions','Up to 40 questions']);
    await selector.selectOption(String(count));
    await page.getByRole('button', { name:'Prepare for 2 students', exact:true }).click();
    await expect.poll(() => page.evaluate(() => window.__literacyMock.state().session.mock.item_count)).toBe(count);
    const args = await page.evaluate(() => window.__literacyMock.state().calls.find(call => call.name === 'teacher_prepare_literacy_mock_session_v12').args);
    expect(args.p_item_count).toBe(count);
  }
});

test('matching supports pickup then placement, return, replacement and keyboard input', async ({ page }, info) => {
  await page.setViewportSize({ width:1024, height:768 });
  await openItem(page, 'mock.relations.same-everyday');
  const toolbar = page.getByRole('group', { name:'Tiles to place', exact:true });
  const little = toolbar.getByRole('button', { name:'little', exact:true });
  const quick = toolbar.getByRole('button', { name:'quick', exact:true });
  const happy = toolbar.getByRole('button', { name:'happy', exact:true });
  const first = page.getByRole('button', { name:/^Space 1 for small/ });
  const second = page.getByRole('button', { name:/^Space 2 for fast/ });
  const third = page.getByRole('button', { name:/^Space 3 for glad/ });
  await little.click();
  await expect(little).toHaveAttribute('aria-pressed', 'true');
  await expect(first).toHaveText('Place here');
  await first.click(); await expect(first).toHaveText('little'); await expect(little).toBeDisabled();
  await first.click(); await expect(first).toHaveText('Place here'); await expect(little).toBeEnabled();
  await quick.dragTo(first); await expect(first).toHaveText('quick');
  await little.click(); await first.click(); await expect(first).toHaveText('little'); await expect(quick).toBeEnabled();
  await quick.focus(); await page.keyboard.press('Enter'); await second.focus(); await page.keyboard.press('Space');
  await expect(second).toHaveText('quick');
  await happy.click(); await page.keyboard.press('Escape'); await expect(happy).toHaveAttribute('aria-pressed', 'false');
  await happy.click(); await third.click(); await expect(third).toHaveText('happy');
  const next = page.getByRole('button', { name:/^(Next question|Finish test)$/ });
  await expect(next).toBeEnabled({ timeout:60000 });
  await page.screenshot({ path:info.outputPath('matching-click-and-click.png') });
  await next.click();
  expect(await page.evaluate(() => window.__literacyMock.state().lastSubmission.selected)).toEqual(['c0','c1','c2']);
});

test('word construction requires an explicit destination and every box before submission', async ({ page }, info) => {
  await page.setViewportSize({ width:768, height:1024 });
  const item = await openItem(page, 'lp3.cvc_short_vowels.l2.B.short_a.v5');
  expect(item.answer).toBe('flag');
  const toolbar = page.getByRole('group', { name:'Tiles to place', exact:true });
  const slots = page.locator('.literacy-mock-construction .literacy-mock-slot');
  await toolbar.getByRole('button', { name:'g', exact:true }).tap();
  await expect(slots.last()).toHaveText('Place here');
  await slots.last().tap(); await expect(slots.last()).toHaveText('g');
  await expect(page.getByRole('button', { name:/^(Next question|Finish test)$/ })).toBeDisabled();
  for (const [i, letter] of [...'fla'].entries()) { await toolbar.getByRole('button', { name:letter, exact:true }).tap(); await slots.nth(i).tap(); }
  await expect(slots).toHaveText(['f','l','a','g']);
  const next = page.getByRole('button', { name:/^(Next question|Finish test)$/ });
  await expect(next).toBeEnabled({ timeout:60000 });
  await slots.nth(1).tap(); await expect(toolbar.getByRole('button', { name:'l', exact:true })).toBeEnabled();
  await expect(page.getByRole('button', { name:/^(Next question|Finish test)$/ })).toBeDisabled();
  await toolbar.getByRole('button', { name:'l', exact:true }).tap(); await slots.nth(1).tap();
  await page.screenshot({ path:info.outputPath('construction-touch-placement.png') });
  await next.click();
  expect(await page.evaluate(() => window.__literacyMock.state().lastSubmission.selected)).toBe('flag');
});

test('class practice offers and starts 15, 25 and 40 question rounds', async ({ page }) => {
  await page.goto('/preview/teacher-a11y.html?surface=resources');
  await page.getByRole('button', { name:'Open MAP Mock practice', exact:true }).click();
  const selector = page.getByRole('combobox', { name:'Questions', exact:true });
  await expect(selector.locator('option')).toHaveText(['15 questions','25 questions','40 questions']);
  for (const count of [15,25,40]) {
    await selector.selectOption(String(count));
    await page.getByRole('button', { name:'Start class practice', exact:true }).click();
    await expect(page.getByRole('heading', { name:`Practice question 1 of ${count}`, exact:true })).toBeVisible();
    await page.getByRole('button', { name:'Change practice', exact:true }).click();
  }
});

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
    await page.goto(`${root}?case=${encodeURIComponent(test.info().testId)}-${count}&mode=teacher&version=literacy-mock-v14`);
    await page.getByRole('button', { name:'Prepare', exact:true }).click();
    const setup = page.locator('.literacy-mock-setup');
    if (!await setup.evaluate(node => node.open)) await setup.locator(':scope > summary').click();
    const selector = page.getByRole('combobox', { name:'Questions', exact:true });
    await expect(selector.locator('option')).toHaveText(['Up to 15 questions','Up to 25 questions','Up to 40 questions']);
    await selector.selectOption(String(count));
    await page.getByRole('button', { name:'Prepare for 2 students', exact:true }).click();
    await expect.poll(() => page.evaluate(() => window.__literacyMock.state().session.mock.item_count)).toBe(count);
    const args = await page.evaluate(() => window.__literacyMock.state().calls.find(call => call.name === 'teacher_prepare_literacy_mock_continuous_session').args);
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
  await page.getByRole('button', { name:'Open Mock MAP class test', exact:true }).click();
  const selector = page.getByRole('combobox', { name:'Questions', exact:true });
  await expect(selector.locator('option')).toHaveText(['Up to 15 questions','Up to 25 questions','Up to 40 questions']);
  for (const count of [15,25,40]) {
    await selector.selectOption(String(count));
    await page.getByRole('button', { name:'Start class test', exact:true }).click();
    await expect(page.locator('[data-child-progress]')).toHaveText(`Question 1 of ${count}`);
    await page.getByRole('button', { name:'End class test', exact:true }).click();
  }
});


test('a spelling response accepts physical keyboard input and correction before submission', async ({ page }) => {
  await openItem(page, 'lp3.cvc_short_vowels.l2.B.short_a.v5');
  const slots = page.locator('.literacy-mock-construction .literacy-mock-slot');
  await slots.first().focus();
  await page.keyboard.type('flg');
  await page.keyboard.press('Backspace');
  await expect(slots.nth(2)).toBeFocused();
  await page.keyboard.type('ag');
  await expect(slots).toHaveText(['f','l','a','g']);
  const next = page.getByRole('button', { name:'Next question', exact:true });
  await expect(next).toBeEnabled({ timeout:60000 });
  await next.click();
  expect(await page.evaluate(() => window.__literacyMock.state().lastSubmission.selected)).toBe('flag');
});

test('dragging a tile with a finger submits the tile in its destination', async ({ page, context }) => {
  await page.setViewportSize({ width:768, height:1024 });
  await openItem(page, 'lp3.cvc_short_vowels.l2.B.short_a.v5');
  const tile = page.getByRole('group', { name:'Tiles to place' }).getByRole('button', { name:'f', exact:true });
  const slot = page.locator('.literacy-mock-construction .literacy-mock-slot').first();
  const source = await tile.boundingBox(), target = await slot.boundingBox();
  const start = { x:source.x + source.width / 2, y:source.y + source.height / 2 };
  const end = { x:target.x + target.width / 2, y:target.y + target.height / 2 };
  const touch = await context.newCDPSession(page);
  await touch.send('Input.dispatchTouchEvent',{ type:'touchStart', touchPoints:[start] });
  for (let n = 1; n <= 5; n++)
    await touch.send('Input.dispatchTouchEvent',{ type:'touchMove', touchPoints:[{ x:start.x+(end.x-start.x)*n/5, y:start.y+(end.y-start.y)*n/5 }] });
  await touch.send('Input.dispatchTouchEvent',{ type:'touchEnd', touchPoints:[] });
  await expect(slot).toHaveText('f');
  await expect(tile).toBeDisabled();
});

test('dictation offers every alphabet letter and accepts a spelling without a length cue', async ({ page }, info) => {
  await page.setViewportSize({ width:768,height:1024 });
  const id='lp3.cvc_short_vowels.l2.B.short_a.v5';
  await page.goto(`${root}?case=${encodeURIComponent(test.info().testId)}&mode=format&version=literacy-mock-v14&item=${id}`);
  const alphabet = page.getByRole('group', { name:'Alphabet' });
  await expect(alphabet.getByRole('button')).toHaveText([...'abcdefghijklmnopqrstuvwxyz']);
  const input = page.getByRole('textbox', { name:'Your spelling' });
  for (const letter of 'bell') await alphabet.getByRole('button',{name:letter,exact:true}).tap();
  await expect(input).toHaveValue('bell');
  await page.getByRole('button',{name:'Erase a letter'}).tap();
  await expect(input).toHaveValue('bel');
  await input.fill('fb');
  await input.evaluate(el => {el.setSelectionRange(1,2);el.dispatchEvent(new Event('select', {bubbles:true}));});
  await alphabet.getByRole('button',{name:'l',exact:true}).click();
  await expect(input).toHaveValue('fl');
  await input.press('End'); await input.pressSequentially('ag');
  await expect(input).toHaveValue('flag');
  await page.getByRole('button',{name:'Reset',exact:true}).click();
  await expect(input).toHaveValue('');
  await input.fill('f');
  await page.getByRole('button',{name:'Listen to the question',exact:true}).click();
  const next = page.getByRole('button', { name:'Next question',exact:true });
  await expect(next).toBeEnabled({timeout:60000});
  await page.screenshot({path:info.outputPath('alphabet-spelling.png')});
  await next.click();
  expect(await page.evaluate(()=>window.__literacyMock.state().lastSubmission.selected)).toBe('f');
});

test('select-all accepts an independent subset without revealing the answer count', async ({ page }, info) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto(`${root}?case=${encodeURIComponent(test.info().testId)}&mode=format&version=literacy-mock-v14&item=mock.v14.read.pond-rail`);
  await expect(page.getByText('Select all that apply',{exact:true})).toBeVisible({timeout:60000});
  await page.getByRole('button',{name:'Listen to the question',exact:true}).click();
  const options = page.locator('.literacy-mock-choice');
  for (let i=0;i<4;i++) await options.nth(i).click();
  await expect(page.locator('.literacy-mock-selection-count')).toHaveText('4 selected.');
  for (let i=0;i<3;i++) await options.nth(i).click();
  const next = page.getByRole('button',{name:'Next question',exact:true});
  await expect(next).toBeEnabled({timeout:60000});
  await page.screenshot({path:info.outputPath('select-all-mobile.png')});
  await next.click();
  expect(await page.evaluate(()=>window.__literacyMock.state().lastSubmission.selected)).toHaveLength(1);
});

for (const width of [390,1024]) {
  test(`contextual matching keeps full meanings draggable and independently editable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({width,height:width===390 ? 844 : 768});
    const id = 'mock.v4.context.bank.l2.v11';
    await page.goto(`${root}?case=context-matching-${width}&mode=format&version=literacy-mock-v15&item=${id}`);
    await page.getByRole('button',{name:'Listen to the question'}).click();
    const bank = page.getByRole('group',{name:'Tiles to place'});
    const meaning = label => bank.getByRole('button',{name:label,exact:true});
    const next = page.getByRole('button',{name:'Next question',exact:true});
    const first = page.getByRole('button',{name:/^Space 1 for First use/});
    const second = page.getByRole('button',{name:/^Space 2 for Second use/});
    const edge = meaning('the edge of a river'), money = meaning('a place that keeps money');
    const distractor = meaning('a deep part of a river');
    await expect(bank.locator('[draggable=true]')).toHaveCount(4);
    await expect(bank.getByRole('button',{name:/Hear answer/})).toHaveCount(4);
    await distractor.tap(); await first.tap();
    await expect(first).toHaveText('a deep part of a river');
    await expect(next).toBeDisabled();
    await edge.dragTo(first);
    await expect(first).toHaveText('the edge of a river');
    await expect(distractor).toBeEnabled();
    await money.focus(); await page.keyboard.press('Enter');
    await second.focus(); await page.keyboard.press('Space');
    await expect(second).toHaveText('a place that keeps money');
    await expect(next).toBeEnabled({timeout:60000});
    await next.click();
    const saved = await page.evaluate(()=>window.__literacyMock.state().lastSubmission);
    expect(saved.selected).toEqual(['c0','c1']);
    expect(Object.keys(saved.audioDelivery)).toHaveLength(7);
    expect(Object.values(saved.audioDelivery).every(state=>state==='completed')).toBe(true);
  });
}

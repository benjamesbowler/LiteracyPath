import { test, expect } from '@playwright/test';
import { LITERACY_MOCK_TUTORIAL_IDS } from '../../src/data/literacyMockItems.js';

const fixture = '/tests/fixtures/literacy-mock.html';
async function audio(page) {
  await page.addInitScript(() => {
    window.__clarityAudio = [];
    window.Audio = class {
      constructor() { this.src = ''; this.currentTime = 0; }
      play() { window.__clarityAudio.push(this.src); this.onplaying?.(); this.timer = setTimeout(() => this.onended?.(), 5); return Promise.resolve(); }
      pause() { clearTimeout(this.timer); }
    };
  });
}
async function fitQuestion(page) {
  const question = page.locator('.literacy-mock-question');
  await page.screenshot({ path:test.info().outputPath('fit-check.png') });
  const geometry = await question.evaluate(node => {
    const bounds = node.getBoundingClientRect();
    return { scroll: node.scrollHeight - node.clientHeight, hidden: [...node.querySelectorAll('.literacy-mock-choice, .literacy-mock-slot, .literacy-mock-construction, .literacy-mock-stem')].filter(el => {
      const r = el.getBoundingClientRect(); return r.bottom > bounds.bottom + 1 || r.top < bounds.top - 1 || r.left < bounds.left - 1 || r.right > bounds.right + 1;
    }).map(el => el.className) };
  });
  expect(geometry).toEqual({ scroll: 0, hidden: [] });
  await expect(page.locator('.literacy-mock-next')).toBeInViewport({ ratio: 1 });
}
for (const size of [{ width:1024,height:724 }, { width:1024,height:650 }, { width:768,height:1004 }, { width:1194,height:834 }]) {
  test(`Home fits all eight destinations without scrolling at ${size.width}x${size.height}`, async ({ page }, info) => {
    await page.setViewportSize(size);
    await page.goto('/preview/student-home-preview.html');
    const home = page.locator('.kg-home');
    await expect(home.locator('.kg-home-door')).toHaveCount(8);
    await page.evaluate(() => document.fonts.ready);
    await expect.poll(() => home.evaluate(node => node.scrollHeight - node.clientHeight)).toBe(0);
    const cards = home.locator('.kg-home-door');
    for (const card of await cards.all()) await expect(card).toBeInViewport({ ratio:1 });
    const clipped = await home.locator('.kg-card-title, .kg-home-door img').evaluateAll(nodes => nodes.filter(node => {
      const rect = node.getBoundingClientRect(), card = node.closest('.kg-home-door').getBoundingClientRect();
      return rect.top < card.top || rect.bottom > card.bottom + 1 || rect.left < card.left || rect.right > card.right + 1;
    }).map(node => node.textContent));
    expect(clipped).toEqual([]);
    await home.screenshot({ path:info.outputPath('home.png') });
  });
}
for (const height of [724,650]) {
  for (const format of ['choice','multi_select','order','match','select_text','build_word']) {
    test(`${format} answers fit the iPad at 1024x${height}`, async ({ page }, info) => {
      await page.setViewportSize({ width:1024,height }); await audio(page);
      await page.goto(`${fixture}?case=${info.testId}&mode=format&format=${format}`);
      await expect(page.locator('.literacy-mock-question')).toBeVisible();
      await fitQuestion(page);
      await page.screenshot({ path:info.outputPath('question.png') });
    });
  }
  for (const [format,id] of Object.entries(LITERACY_MOCK_TUTORIAL_IDS)) {
    test(`${format} button practice fits the iPad at 1024x${height}`, async ({ page }, info) => {
      await page.setViewportSize({ width:1024,height }); await audio(page);
      await page.goto(`${fixture}?case=${info.testId}&mode=format&item=${encodeURIComponent(id)}&demo=1`);
      await expect(page.getByRole('complementary',{name:'Worked example'})).toBeVisible();
      await fitQuestion(page);
      await page.screenshot({ path:info.outputPath('practice.png') });
    });
  }
  test(`long reading text stays separate and all passage parts remain available at 1024x${height}`, async ({ page }, info) => {
    await page.setViewportSize({ width:1024,height }); await audio(page);
    await page.goto(`${fixture}?case=${info.testId}&mode=format&item=lp3.theme_higher_comprehension.l2.A.theme_among_rivals.v22`);
    const passage = page.getByRole('region',{name:'Passage',exact:true});
    await expect(passage.getByRole('heading',{name:'Read this',exact:true})).toBeVisible();
    await expect(page.getByRole('group',{name:'Answer choices',exact:true})).toBeVisible();
    await expect.poll(() => page.evaluate(() => window.__clarityAudio.length)).toBeGreaterThan(1);
    expect(await page.evaluate(() => window.__clarityAudio[0])).toContain('read-the-passage-in-the-box-then-answer-this-question');
    const original = await page.evaluate(() => window.__literacyMock.item().passage);
    const parts = [await passage.locator('.literacy-mock-passage').textContent()];
    const next = passage.getByRole('button',{name:'Read next part',exact:true});
    for (let n=0;n<20 && await next.count() && await next.isEnabled();n++) {
      await next.click(); parts.push(await passage.locator('.literacy-mock-passage').textContent());
    }
    expect(parts.join('')).toBe(original);
    await fitQuestion(page);
    await page.screenshot({ path:info.outputPath('reading.png') });
  });
}

// Exercise the longest authored option/prompt combination for each mechanic,
// rather than treating the first fixture item as representative of the bank.
for (const format of ['choice','multi_select','order','match','select_text','build_word']) {
 test(`the densest authored ${format} still exposes every answer at 1024x650`,async({page},info)=>{
  await page.setViewportSize({width:1024,height:650});await audio(page);
  await page.goto(`${fixture}?case=${info.testId}&mode=format&format=${format}`);
  const id=await page.evaluate(async format=>{
    const {loadLiteracyMockBank}=await import('/src/data/literacyMockBank.js');
    const bank=await loadLiteracyMockBank();
    const weight=item=>(item.prompt?.length || 0)+item.choices.reduce((total,row)=>total+(row.label?.length || 0),0)+item.choices.length*40;
    return bank.filter(row=>row.format===format && !row.tutorialOnly).sort((a,b)=>weight(b)-weight(a))[0].id;
  },format);
  await page.goto(`${fixture}?case=${info.testId}-dense&mode=format&item=${encodeURIComponent(id)}`);
  await expect(page.locator('.literacy-mock-question')).toBeVisible();await fitQuestion(page);
  const clipped=await page.locator('.literacy-mock-choice').evaluateAll(nodes=>nodes.filter(node=>node.scrollHeight>node.clientHeight+1 || node.scrollWidth>node.clientWidth+1).map(node=>node.textContent));
  expect(clipped).toEqual([]);await page.screenshot({path:info.outputPath('densest-question.png')});
 });
}

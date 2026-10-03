import { test, expect } from '@playwright/test';
import { WORKSHOP_OBJECTS } from '../../src/utils/workshopObjects.js';
import { phonicsTargetHint } from '../../src/utils/phonicsTargetPresentation.js';

const noTarget = async (stage,target) => expect(await stage.innerText()).not.toMatch(new RegExp(`\\b${target}\\b`,'i'));
for(const game of ['cvc-word-builder','blend-and-build','letter-garden']) {
  test(`${game}: picture/audio prompt, two mistakes earn partial help and survive reload`,async({page})=>{
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.goto(`/preview/game-overlay.html?game=${game}&difficulty=easy&sound=0`);
    const stage=page.locator('.pb-stage');await expect(stage).toBeVisible();
    const target=await stage.getAttribute('data-target');
    await noTarget(stage,target);await expect(stage.locator('[data-phonics-hint]')).toHaveCount(0);
    let wrong;
    if(game==='cvc-word-builder') {
      const next=WORKSHOP_OBJECTS[target].units[0].grapheme;
      const words=await stage.locator('.pb-piece-bank button').allTextContents();
      const choice=words.map(word=>word.trim()).find(word=>word!==next);
      wrong=page.getByRole('button',{name:`Place ${choice}`,exact:true});
    }else if(game==='blend-and-build') {
      const rime=await stage.locator('[data-rime]').getAttribute('data-rime');
      const buttons=stage.locator('.pb-piece-bank button');
      wrong=buttons.filter({hasNotText:target.slice(0,-rime.length)}).first();
    }else{
      const index=Number(await stage.getAttribute('data-change-index'));
      const choice=(await stage.locator('[data-seed]').evaluateAll(nodes=>nodes.map(node=>node.dataset.seed))).find(letter=>letter!==target[index]);
      wrong=page.getByRole('button',{name:`Plant ${choice}`,exact:true});
    }
    await wrong.click();await noTarget(stage,target);await expect(stage.locator('[data-phonics-hint]')).toHaveCount(0);
    await wrong.click();await noTarget(stage,target);
    await expect(stage.locator('[data-phonics-hint]')).toHaveText(phonicsTargetHint(target,2));
    await page.reload();await page.getByRole('button',{name:'Continue',exact:true}).click();
    await expect(stage).toHaveAttribute('data-target',target);
    await noTarget(stage,target);await expect(stage.locator('[data-phonics-hint]')).toHaveText(phonicsTargetHint(target,2));
  });
}

for(const [name,width,height] of [['desktop',1366,900],['tablet',1024,768],['phone',390,844],['small-phone',320,568]]) {
  test(`${name}: all letters and word families are freely available, menu has aligned sections`,async({page})=>{
    test.setTimeout(90000);
    await page.setViewportSize({width,height});
    await page.goto('/preview/child-surfaces.html?surface=phonics');
    const letters=page.locator('.phonics-letter-grid button');
    await expect(letters).toHaveCount(26);
    for(const letter of await letters.all()) await expect(letter).toBeEnabled();
    const letterBoxes=await letters.evaluateAll(nodes=>nodes.map(n=>n.getBoundingClientRect().toJSON()));
    if(width>500) for(const box of letterBoxes) {expect(box.y).toBeGreaterThanOrEqual(0);expect(box.y+box.height).toBeLessThanOrEqual(height);}
    const progressBox=await page.locator('.phonics-alphabet-progress').boundingBox();
    expect(progressBox.y).toBeGreaterThanOrEqual(Math.max(...letterBoxes.map(box=>box.y+box.height))-1);
    await letters.last().click();await expect(page.locator('.phonics-learning-flow')).toBeVisible();
    await page.goto('/preview/child-surfaces.html?surface=phonics&island=words');
    const families=page.locator('.cvc-family-card');await expect(families).toHaveCount(8);
    for(const card of await families.all()) await expect(card).toBeEnabled();
    await families.last().click();await expect(page.locator('.cvc-learning-flow')).toBeVisible();
    await page.goto('/preview/child-surfaces.html?surface=arcade');
    await expect(page.getByRole('heading',{name:'Arcade',exact:true}).last()).toBeVisible();
    await expect(page.getByRole('heading',{name:'Phonics games',exact:true})).toBeVisible();
    const icons=page.locator('.lg-game-section-grid img');await expect(icons).toHaveCount(24);
    await expect.poll(()=>icons.evaluateAll(nodes=>nodes.filter(img=>img.complete&&img.naturalWidth>0).length)).toBe(24);
    await expect(page.locator('[data-game-section="arcade"]')).toHaveCount(15);
    await expect(page.locator('[data-game-section="phonics"]')).toHaveCount(9);
    await page.screenshot({path:`.artifacts/phonics-menu/menu-${name}.png`,fullPage:true});
  });
}

// Reproduce the real menu at normal viewport heights: a tall screenshot can
// conceal a scrolling catalogue even when every button exists in the DOM.
for (const [name, width, height] of [
  ['compact-laptop', 1280, 720], ['laptop', 1366, 768],
  ['desktop', 1440, 900], ['large-desktop', 1920, 1080],
  ['tablet-landscape', 1024, 768], ['tablet-portrait', 768, 1024],
]) {
  test(`${name}: all 24 games fit on one screen without scrolling`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/preview/child-surfaces.html?surface=arcade');
    const tiles = page.locator('.lg-game-tile');
    await expect(tiles).toHaveCount(24);
    await expect.poll(() => tiles.locator('img').evaluateAll(images =>
      images.every(image => image.complete && image.naturalWidth > 0))).toBe(true);
    await page.evaluate(() => document.fonts.ready);
    const layout = await page.locator('.lg-game-choice-area').evaluate(area => {
      const bounds = area.getBoundingClientRect();
      const cards = [...area.querySelectorAll('.lg-game-tile')].map(card => {
        const box = card.getBoundingClientRect();
        const label = card.querySelector('.lg-game-tile-name');
        const range = document.createRange(); range.selectNodeContents(label);
        return {
          name: label.textContent,
          size: box.width >= 56 && box.height >= 56,
          inside: box.left >= bounds.left && box.right <= bounds.right
            && box.top >= bounds.top && box.bottom <= bounds.bottom,
          title: [...range.getClientRects()].every(rect =>
            rect.left >= box.left && rect.right <= box.right
            && rect.top >= box.top && rect.bottom <= box.bottom),
          complete: label.scrollWidth <= label.clientWidth + 1,
        };
      });
      return { cards, scroll: area.scrollHeight - area.clientHeight,
        bodyScroll: document.documentElement.scrollHeight - innerHeight,
        headings: [...area.querySelectorAll('h2')].every(heading => {
          const box = heading.getBoundingClientRect();
          return box.top >= bounds.top && box.bottom <= bounds.bottom;
        }) };
    });
    expect(layout.scroll, 'the game chooser must not scroll').toBeLessThanOrEqual(1);
    expect(layout.bodyScroll, 'the page must not scroll').toBeLessThanOrEqual(1);
    expect(layout.headings, 'both section headings fit').toBe(true);
    for (const card of layout.cards) {
      expect(card.size, `${card.name} keeps its touch target`).toBe(true);
      expect(card.inside, `${card.name} fits in the visible chooser`).toBe(true);
      expect(card.title && card.complete, `${card.name} shows its complete title`).toBe(true);
    }
    await page.screenshot({ path: `.artifacts/compact-games/menu-${name}.png` });
    await tiles.last().focus();
    await expect(tiles.last()).toBeFocused();
    expect(await page.locator('.lg-game-choice-area').evaluate(area => area.scrollTop)).toBe(0);
  });
}

import { test, expect } from '@playwright/test';
import fs from 'node:fs';

test.use({ hasTouch: true });

const route = '/preview/child-surfaces?surface=adventure-map';
const out = '.artifacts/phonics-overhaul/map';
fs.mkdirSync(out, { recursive: true });

for (const [world, cycle] of [['meadow',1],['dino',10],['moonwood',19]]) {
  test(`${world} atlas has nine inspectable places and only the assigned practice action`, async ({ page }) => {
    const errors=[];
    page.on('pageerror', error=>errors.push(error.message));
    await page.goto(`${route}&lockedCycle=cycle-${cycle}`);
    // The preview's exact classroom assignment chooses the corresponding world.
    const surface=page.locator('[data-child-surface="adventure-map"]');
    await expect(surface).toBeVisible();
    await expect(surface.locator('.kg-atlas-art')).toHaveAttribute('src', new RegExp(`${world}-atlas-v2`));
    const places=surface.locator('[data-stop]');
    await expect(places).toHaveCount(9);
    await expect(surface.locator('[data-child-primary]')).toHaveCount(1);
    await places.last().hover();
    await expect(surface.locator('.kg-atlas-details')).toBeVisible();
    await expect(surface.locator('.kg-atlas-details p').first()).not.toContainText('Explore this place');
    await expect(places.last()).toHaveAttribute('aria-expanded','true');
    await expect(surface.locator('[data-child-primary]')).toHaveAttribute('data-cycle-id',`cycle-${cycle}`);
    await page.keyboard.press('Escape');
    await expect(surface.locator('.kg-atlas-details')).toHaveCount(0);
    await places.nth(2).focus();
    await expect(places.nth(2)).toHaveAttribute('aria-expanded','true');
    await expect(surface.locator('.kg-atlas-details h2')).not.toBeEmpty();
    await surface.locator('.kg-atlas-details-close').click();
    await expect(surface.locator('.kg-atlas-details')).toHaveCount(0);
    await page.screenshot({ path:`${out}/${world}-desktop.png` });
    expect(errors).toEqual([]);
  });
}

for(const viewport of [{width:320,height:568},{width:390,height:844},{width:568,height:320},{width:768,height:1024},{width:1024,height:768},{width:1440,height:900}]) {
  test(`atlas native viewport and touch details ${viewport.width}x${viewport.height}`,async({page})=>{
    await page.setViewportSize(viewport);
    await page.goto(route);
    const surface=page.locator('.kg-map--atlas');
    await expect(surface).toBeVisible();
    const geometry=await surface.evaluate(el=>{
      const rect=el.getBoundingClientRect();
      const main=el.closest('.kg-main').getBoundingClientRect();
      const art=el.querySelector('.kg-atlas-art').getBoundingClientRect();
      return {width:rect.width,height:rect.height,mainWidth:main.width,mainHeight:main.height,ratio:art.width/art.height,overflow:document.documentElement.scrollWidth-innerWidth};
    });
    expect(geometry.width).toBeCloseTo(geometry.mainWidth,0);
    expect(geometry.height).toBeCloseTo(geometry.mainHeight,0);
    expect(geometry.ratio).toBeCloseTo(2752/1536,2);
    expect(geometry.overflow).toBe(0);
    const marker=surface.locator('[data-stop]').last();
    await marker.scrollIntoViewIfNeeded();
    await marker.tap();
    await expect(surface.locator('.kg-atlas-details')).toBeVisible();
    for(const selector of ['.kg-atlas-details-close','[data-child-primary]','.kg-atlas-browse']) {
      const button=surface.locator(selector);
      const box=await button.boundingBox();
      expect(box.width).toBeGreaterThanOrEqual(56);
      expect(box.height).toBeGreaterThanOrEqual(56);
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x+box.width).toBeLessThanOrEqual(viewport.width+1);
      expect(box.y+box.height).toBeLessThanOrEqual(viewport.height+1);
    }
    await page.screenshot({path:`${out}/details-${viewport.width}x${viewport.height}.png`});
  });
}

test('failed atlas artwork leaves the whole progression and details usable',async({page})=>{
  await page.route('**/*-atlas-v2.webp',route=>route.abort());
  await page.goto(route);
  const surface=page.locator('.kg-map--atlas');
  await expect(surface.locator('[data-stop]')).toHaveCount(9);
  await surface.locator('[data-stop]').nth(4).click();
  await expect(surface.locator('.kg-atlas-details h2')).toHaveText('Wildflower Field');
  await expect(surface.locator('[data-child-primary]')).toBeEnabled();
});

import { test, expect } from '@playwright/test';

const games = [
  { id:'word-bridge', selector:'.word-bridge-world', control:'[data-wb=left]', opposite:'[data-wb=right]', read: el => el.bridgeSnapshot().builder.x },
  { id:'grammar-grind', selector:'[data-skater-heading]', control:'[data-gg-btn=left]', opposite:'[data-gg-btn=right]', read: el => Number(el.dataset.skaterHeading) },
  { id:'star-gallery', selector:'canvas[data-player-x]', control:'[data-role=turn-left]', opposite:'[data-role=turn-right]', read: () => window.__sentenceGroveSnapshot().player.yaw }
];
for (const game of games) test(`${game.id}: focused pad, arrows, brief taps and pause all retain movement`, async ({page},info) => {
  test.setTimeout(60000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  // Exercise the real fallback directly so software WebGL cannot replace the
  // focused pad halfway through a key hold on the test runner.
  if (game.id === 'grammar-grind') {
    await page.addInitScript(() => {
      const getContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (kind, ...args) {
        if (kind === 'webgl' || kind === 'webgl2') return null;
        return getContext.call(this, kind, ...args);
      };
    });
  }
  await page.goto(`/preview/game-overlay.html?game=${game.id}&sound=0&music=0`);
  const world=page.locator(game.selector);
  await expect(world).toBeVisible({timeout:20000});
  const read=()=>world.evaluate(game.read);
  const left=page.locator(game.control);
  await expect(left).toBeEnabled({ timeout: 30000 });
  await left.focus();
  let before=await read();
  await page.keyboard.down('ArrowLeft');
  await expect.poll(read).not.toBe(before);
  const nudged=await read();
  await page.waitForTimeout(180);
  expect(await read()).not.toBe(nudged);
  await page.keyboard.up('ArrowLeft');
  before=await read();
  await left.press('Enter');
  await expect.poll(read).not.toBe(before);
  before=await read();
  const right=page.locator(game.opposite);
  await right.click();
  await expect.poll(read).not.toBe(before);
  const help=page.getByRole('button',{name:/Open .* mission guide/});
  const tools=page.getByRole('button',{name:'Open game controls',exact:true});
  if (await tools.isVisible()) await tools.click();
  await help.click();
  before=await read();
  await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(160);
  expect(await read()).toBe(before);
  await page.getByRole('button',{name:'Keep playing',exact:true}).click();
  await page.keyboard.down('ArrowRight');
  await expect.poll(read).not.toBe(before);
  await page.keyboard.up('ArrowRight');
  await page.getByRole('button', { name: /^Pause / }).click();
  const paused = page.getByRole('dialog', { name: /paused/ });
  await expect(paused).toBeVisible();
  await expect(paused.getByRole('button', { name: /Turn spoken audio and game sounds on/ })).toBeVisible();
  await expect(paused.getByRole('button', { name: /Turn music on/ })).toBeVisible();
  await expect(paused.getByRole('button', { name: 'Resume game', exact: true })).toBeFocused();
  before = await read();
  await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(160);
  expect(await read()).toBe(before);
  await paused.getByRole('button', { name: 'Resume game', exact: true }).click();
  await page.keyboard.down('ArrowLeft');
  await expect.poll(read).not.toBe(before);
  await page.keyboard.up('ArrowLeft');
  await page.screenshot({path:info.outputPath(`${game.id}-controls.png`)});
});

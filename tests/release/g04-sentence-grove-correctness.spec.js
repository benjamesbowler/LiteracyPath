import { expect, test } from '@playwright/test';

const snapshot = page => page.evaluate(() => window.__sentenceGroveSnapshot?.());

test('Sentence Grove shows the actual cat and keeps movement live with sound off', async ({ page }) => {
  await page.goto('/preview/game-overlay.html?game=star-gallery&sound=0&music=0');
  const picture = page.locator('[data-role="picture-image"]');
  await expect(picture).toHaveAttribute('alt', 'A cat');
  await expect.poll(() => picture.evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
  await expect(page.locator('[data-role="display"]')).toHaveText('__ cat sat on the mat.');
  await expect(page.getByText(/Picture cue:/)).toHaveCount(0);
  const before = await snapshot(page);
  await page.keyboard.down('ArrowUp');
  await expect.poll(async () => (await snapshot(page)).player.z).not.toBe(before.player.z);
  await page.keyboard.up('ArrowUp');
  const moved = await snapshot(page);
  expect(Math.abs(-Math.sin(moved.vehicleYaw) - Math.sin(moved.player.yaw))).toBeLessThan(0.001);
  expect(Math.abs(-Math.cos(moved.vehicleYaw) - Math.cos(moved.player.yaw))).toBeLessThan(0.001);
});

test('a physically driven nearby tree always accepts the advertised cut', async ({ page }) => {
  test.setTimeout(90000);
  await page.clock.install();
  await page.goto('/preview/game-overlay.html?game=star-gallery&sound=0&music=0');
  await expect(page.locator('[data-role="cut"]')).toBeVisible();
  let state = await snapshot(page);
  const target = state.tokens.filter(t => t.isCorrect).sort((a,b) => Math.hypot(a.position.x-state.player.x,a.position.z-state.player.z)-Math.hypot(b.position.x-state.player.x,b.position.z-state.player.z))[0];
  const held = new Set();
  for (let step=0; step<700 && state.nearTreeLabel !== target.label; step++) {
    const dx=target.position.x-state.player.x,dz=target.position.z-state.player.z;
    const angle=Math.atan2(Math.sin(Math.atan2(dx,dz)-state.player.yaw),Math.cos(Math.atan2(dx,dz)-state.player.yaw));
    const next=new Set(Math.abs(angle)>0.09?[angle>0?'ArrowLeft':'ArrowRight']:[]);
    if(Math.abs(angle)<0.65)next.add('ArrowUp');
    for(const key of held)if(!next.has(key)){await page.keyboard.up(key);held.delete(key);}
    for(const key of next)if(!held.has(key)){await page.keyboard.down(key);held.add(key);}
    await page.clock.runFor(80);
    state=await snapshot(page);
  }
  for(const key of held)await page.keyboard.up(key);
  expect(state.nearTreeLabel).toBe(target.label);
  const before=state.correct+state.mistakes;
  await page.getByRole('button',{name:'Cut the nearby answer tree',exact:true}).click();
  await page.clock.runFor(20);
  state=await snapshot(page);
  expect(state.correct+state.mistakes).toBe(before+1);
  expect(state.correct).toBe(1);
});

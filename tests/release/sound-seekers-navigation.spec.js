import { test, expect } from '@playwright/test';

const GAME = '[data-sound-seekers-game="rounded-campaign"]';
const CANVAS = '.rc-landscape canvas';
async function open(page, stage = 'meadow-01') {
  await page.goto(`/preview/rounded-campaign.html?stage=${stage}&scope=nav-${stage}&simple=1`);
  await page.getByRole('button', {name:'Start exploring',exact:true}).click();
  await expect(page.locator(GAME)).toHaveAttribute('data-scene-ready','true');
}
async function chooseObject(page, text) {
  await page.getByRole('button',{name:'Places',exact:true}).click();
  await page.getByText('Explore objects',{exact:true}).click();
  await page.locator('.rc-discovery-list button').filter({hasText:text}).click();
}

test('selected journey shows route, stops safely, and arrives without opening or completing a mission', async ({page},info) => {
  test.setTimeout(180000);
  await open(page);
  await chooseObject(page,'Find the oak seed');
  await expect(page.locator('.rc-route-status')).toContainText('Find the oak seed');
  await expect.poll(async()=>Number(await page.locator(CANVAS).getAttribute('data-route-breadcrumbs'))).toBeGreaterThan(0);
  await page.getByRole('button',{name:'Stop walking',exact:true}).click();
  await expect(page.locator(CANVAS)).toHaveAttribute('data-navigation','');
  await expect(page.locator(CANVAS)).toHaveAttribute('data-route-breadcrumbs','0');
  await chooseObject(page,'Find the oak seed');
  await page.getByRole('button',{name:'Pause',exact:true}).click();
  await page.getByRole('button',{name:'Keep playing',exact:true}).click();
  await expect(page.locator(CANVAS)).toHaveAttribute('data-navigation','');
  await page.getByRole('button',{name:'Walk to Muddy',exact:true}).click();
  await expect(page.locator('.rc-route-status')).toHaveAttribute('data-arrived','true',{timeout:35000});
  await expect(page.locator('.rc-route-status')).toContainText('Muddy is here. Choose Help.');
  await expect(page.locator(GAME)).toHaveAttribute('data-mode','explore');
  await expect(page.getByRole('button',{name:'Help Muddy',exact:true})).toBeVisible();
  await expect(page.locator(CANVAS)).toHaveAttribute('data-route-breadcrumbs','0');
  await page.screenshot({path:info.outputPath('mission-arrival.png')});
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator(CANVAS)).toHaveAttribute('data-navigation','');
});

test('painted optional-object directions require explicit pickup and delivery, including phone layout', async ({page},info) => {
  test.setTimeout(150000);
  await page.setViewportSize({width:390,height:844});
  await open(page);
  await chooseObject(page,'Find the oak seed');
  await expect(page.locator('.rc-route-status')).toContainText('Find the oak seed');
  const status = await page.locator('.rc-route-status').boundingBox();
  expect(status.x).toBeGreaterThanOrEqual(0);expect(status.x+status.width).toBeLessThanOrEqual(390);
  await page.screenshot({path:info.outputPath('phone-object-travel.png')});
  await expect(page.locator('.rc-route-status')).toHaveAttribute('data-arrived','true',{timeout:55000});
  await expect(page.getByRole('button',{name:'Pick it up',exact:true})).toBeVisible();
  await expect(page.locator(GAME)).toHaveAttribute('data-mode','explore');
  await page.getByRole('button',{name:'Pick it up',exact:true}).click();
  await expect(page.locator('.rc-route-status')).toHaveCount(0);
  await chooseObject(page,'Bring oak seed to the entrance');
  await expect(page.locator('.rc-route-status')).toHaveAttribute('data-arrived','true',{timeout:55000});
  await expect(page.getByRole('button',{name:'Put it here',exact:true})).toBeVisible();
  await page.screenshot({path:info.outputPath('phone-object-arrival.png')});
  await page.getByRole('button',{name:'Put it here',exact:true}).click();
  await page.getByRole('button',{name:'Places',exact:true}).click();
  await page.getByText('Explore objects',{exact:true}).click();
  await expect(page.locator('.rc-discovery-list button')).toHaveCount(1);
  await expect(page.locator('.rc-mission-list').first()).toContainText('Help Muddy');
});

for (const stage of ['dino-14','moonwood-25']) test(`${stage} keeps optional cues and low-tier gentle travel usable`, async ({page},info) => {
  test.setTimeout(180000);
  await page.setViewportSize({width:844,height:390});
  await open(page,stage);
  await page.getByRole('button',{name:'Places',exact:true}).click();
  await page.getByText('Explore objects',{exact:true}).click();
  await page.locator('.rc-discovery-list button').last().click();
  await expect(page.locator('.rc-route-status')).toBeVisible();
  await expect.poll(async()=>Number(await page.locator(CANVAS).getAttribute('data-route-breadcrumbs'))).toBeGreaterThan(0);
  await page.screenshot({path:info.outputPath(`${stage}-landscape-travel.png`)});
  await page.getByRole('button',{name:'Pause',exact:true}).click();
  await expect(page.locator(CANVAS)).toHaveAttribute('data-paused','true');
  const frames=await page.locator(CANVAS).getAttribute('data-rendered-frames');
  await page.waitForTimeout(250);
  expect(await page.locator(CANVAS).getAttribute('data-rendered-frames')).toBe(frames);
  await page.getByRole('button',{name:'Keep playing',exact:true}).click();
  await expect(page.locator(CANVAS)).toHaveAttribute('data-navigation','');
});

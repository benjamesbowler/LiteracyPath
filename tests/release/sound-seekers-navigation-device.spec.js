import { test, expect } from '@playwright/test';
import { STUDENT_DEVICE_PROFILES } from '../../src/policy/studentDeviceMatrix.js';
import { createCampaignPreviewProgress } from '../../src/features/soundSeekers/preview/campaignPreview.js';
import { campaignStorageKey } from '../../src/features/soundSeekers/v3/campaignStorage.js';

test.use({ hasTouch: true });

const profiles = STUDENT_DEVICE_PROFILES.filter(profile => ['small-phone-portrait', 'small-phone-landscape', 'tablet-portrait'].includes(profile.id));
const GAME = '[data-sound-seekers-game="rounded-campaign"]';
const CANVAS = '.rc-landscape canvas';

async function walkToSeed(page) {
  await page.getByRole('button', { name: 'Places', exact: true }).click();
  await page.getByText('Explore objects', { exact: true }).click();
  await page.locator('.rc-discovery-list button').filter({ hasText: 'Find the oak seed' }).click();
  await expect(page.locator(CANVAS)).toHaveAttribute('data-navigation-target', 'carry');
  await expect(page.locator('.rc-route-status')).toBeVisible();
}

async function checkNavigationGeometry(page, profile, state, includeObjectiveControls = true) {
  const geometry = await page.locator('.rc-explore-footer').evaluate((footer, includeObjective) => {
    const box = element => {
      const rect = element.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height, right: rect.right, bottom: rect.bottom };
    };
    const status = footer.querySelector('.rc-route-status');
    const statusBox = box(status);
    const controls = [...footer.querySelectorAll('.rc-movement button, :scope > .rc-primary'), ...(includeObjective ? document.querySelectorAll('.rc-objective button') : [])].filter(button => button.getBoundingClientRect().width > 0).map(button => {
      const rect = box(button), hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
      return { ...rect, name: button.getAttribute('aria-label') || button.textContent.trim(), uncovered: hit?.closest('button') === button };
    });
    const stop = status.querySelector('button');
    const statusHit = document.elementFromPoint(statusBox.x + statusBox.width / 2, statusBox.y + statusBox.height / 2);
    return { status: statusBox, objective: box(document.querySelector('.rc-objective')), controls, stop: stop ? box(stop) : null,
      statusUncovered: statusHit?.closest('.rc-route-status') === status,
      textFits: status.scrollWidth <= status.clientWidth + 1 && status.scrollHeight <= status.clientHeight + 1 };
  }, includeObjectiveControls);
  const inside = (box, name) => {
    expect(box.x, `${state} ${name} left`).toBeGreaterThanOrEqual(-0.5);
    expect(box.y, `${state} ${name} top`).toBeGreaterThanOrEqual(-0.5);
    expect(box.right, `${state} ${name} right`).toBeLessThanOrEqual(profile.width + 0.5);
    expect(box.bottom, `${state} ${name} bottom`).toBeLessThanOrEqual(profile.height + 0.5);
  };
  const overlaps = (a, b) => Math.min(a.right, b.right) - Math.max(a.x, b.x) > 0.5
    && Math.min(a.bottom, b.bottom) - Math.max(a.y, b.y) > 0.5;
  inside(geometry.status, 'status');
  expect(overlaps(geometry.status, geometry.objective), `${state} status clears the full mission panel`).toBe(false);
  expect(geometry.statusUncovered, `${state} status remains visible above other UI`).toBe(true);
  expect(geometry.textFits, `${state} status text stays inside its card`).toBe(true);
  expect(geometry.controls.length).toBeGreaterThanOrEqual(4);
  for (const [index, control] of geometry.controls.entries()) {
    inside(control, control.name);
    expect(control.width, `${state} ${control.name} width`).toBeGreaterThanOrEqual(56);
    expect(control.height, `${state} ${control.name} height`).toBeGreaterThanOrEqual(56);
    expect(control.uncovered, `${state} ${control.name} receives input`).toBe(true);
    expect(overlaps(geometry.status, control), `${state} status clears ${control.name}: ${JSON.stringify({ status: geometry.status, control })}`).toBe(false);
    for (const other of geometry.controls.slice(index + 1)) expect(overlaps(control, other), `${state} ${control.name} clears ${other.name}`).toBe(false);
  }
  if (geometry.stop) {
    inside(geometry.stop, 'Stop walking');
    expect(geometry.stop.width).toBeGreaterThanOrEqual(56);
    expect(geometry.stop.height).toBeGreaterThanOrEqual(56);
  }
}

for (const profile of profiles) test(`navigation travel and arrival preserve controls on ${profile.id}`, async ({ page }, info) => {
  test.setTimeout(180000);
  await page.setViewportSize({ width: profile.width, height: profile.height });
  await page.goto(`/preview/rounded-campaign.html?stage=meadow-01&scope=navigation-${profile.id}&simple=1`);
  await page.getByRole('button', { name: 'Start exploring', exact: true }).click();
  await expect(page.locator(GAME)).toHaveAttribute('data-scene-ready', 'true');
  await walkToSeed(page);
  await checkNavigationGeometry(page, profile, `${profile.id} travel`);
  await page.getByRole('button', { name: 'Stop walking', exact: true }).tap();
  await expect(page.locator(CANVAS)).toHaveAttribute('data-navigation', '');
  await expect(page.locator(CANVAS)).toHaveAttribute('data-route-breadcrumbs', '0');
  await expect(page.locator('.rc-route-status')).toHaveCount(0);
  await walkToSeed(page);
  await page.screenshot({ path: info.outputPath(`${profile.id}-travel.png`) });
  await expect(page.locator('.rc-route-status')).toHaveAttribute('data-arrived', 'true', { timeout: 55000 });
  await expect(page.getByRole('button', { name: 'Pick it up', exact: true })).toBeVisible();
  await checkNavigationGeometry(page, profile, `${profile.id} arrival`);
  await page.screenshot({ path: info.outputPath(`${profile.id}-arrival.png`) });
  await expect(page.locator(GAME)).toHaveAttribute('data-mode', 'explore');
});

test('missing object artwork keeps the small landscape destination and stop control readable', async ({ page }, info) => {
  test.setTimeout(180000);
  const profile = profiles.find(candidate => candidate.id === 'small-phone-landscape');
  await page.setViewportSize({ width: profile.width, height: profile.height });
  await page.route('**/images/sound-seekers/questions/seed-*.webp', route => route.abort());
  await page.goto('/preview/rounded-campaign.html?stage=meadow-01&scope=navigation-missing-art&simple=1');
  await page.getByRole('button', { name: 'Start exploring', exact: true }).click();
  await expect(page.locator(GAME)).toHaveAttribute('data-scene-ready', 'true');
  await walkToSeed(page);
  await expect(page.locator('.rc-route-status > img')).toHaveJSProperty('naturalWidth', 0);
  await expect(page.locator('.rc-route-status > img')).toHaveCSS('visibility', 'hidden');
  const destination = await page.locator('.rc-route-status > span').boundingBox();
  expect(destination.width, 'destination keeps enough space to read beside the missing artwork').toBeGreaterThanOrEqual(80);
  await checkNavigationGeometry(page, profile, 'missing artwork travel');
  await page.getByRole('button', { name: 'Stop walking', exact: true }).tap();
  await expect(page.locator(CANVAS)).toHaveAttribute('data-navigation', '');
  await expect(page.locator(CANVAS)).toHaveAttribute('data-route-breadcrumbs', '0');
  await expect(page.locator('.rc-route-status')).toHaveCount(0);
  await walkToSeed(page);
  await expect(page.locator('.rc-route-status > img')).toHaveCSS('visibility', 'hidden');
  await page.screenshot({ path: info.outputPath('missing-object-art-travel.png') });
  await page.getByRole('button', { name: 'Walk to Muddy', exact: true }).click();
  await expect(page.locator('.rc-route-status > img')).toHaveAttribute('src', /\/muddy\.webp$/);
  await expect.poll(() => page.locator('.rc-route-status > img').evaluate(image => image.naturalWidth)).toBeGreaterThan(0);
  await expect(page.locator('.rc-route-status > img')).toHaveCSS('visibility', 'visible');
  await page.screenshot({ path: info.outputPath('recovered-portrait-travel.png') });
  await expect(page.locator(GAME)).toHaveAttribute('data-mode', 'explore');
});

test('a repaired place keeps its extra adventure and next-place actions clear of navigation on a small phone', async ({ page }, info) => {
  test.setTimeout(180000);
  const profile = profiles.find(candidate => candidate.id === 'small-phone-portrait');
  const scope = 'sound-seekers-preview:rounded:navigation-repaired-place';
  const progress = createCampaignPreviewProgress('meadow-02');
  progress.campaign.currentStageId = 'meadow-01';
  progress.campaign.visitedStageIds = ['meadow-01', 'meadow-02'];
  await page.addInitScript(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key: campaignStorageKey(scope), value: progress });
  await page.setViewportSize({ width: profile.width, height: profile.height });
  await page.goto('/preview/rounded-campaign.html?stage=meadow-01&scope=navigation-repaired-place&resume=1&simple=1');
  await page.getByRole('button', { name: 'Start exploring', exact: true }).click();
  await expect(page.locator(GAME)).toHaveAttribute('data-scene-ready', 'true');
  await walkToSeed(page);
  await expect(page.locator('.rc-objective').getByRole('button', { name: /^Walk to / })).toBeVisible();
  await expect(page.locator('.rc-objective').getByRole('button', { name: /^Explore / })).toBeVisible();
  await checkNavigationGeometry(page, profile, 'repaired place travel');
  await page.screenshot({ path: info.outputPath('repaired-place-travel.png') });
  await expect(page.locator('.rc-route-status')).toHaveAttribute('data-arrived', 'true', { timeout: 55000 });
  await checkNavigationGeometry(page, profile, 'repaired place arrival');
  await page.screenshot({ path: info.outputPath('repaired-place-arrival.png') });
  await expect(page.locator(GAME)).toHaveAttribute('data-mode', 'explore');
});

test('long repaired-place text scrolls inside its panel without covering navigation on a small phone', async ({ page }, info) => {
  test.setTimeout(180000);
  const profile = profiles.find(candidate => candidate.id === 'small-phone-portrait');
  const scope = 'sound-seekers-preview:rounded:navigation-long-repaired-place';
  const progress = createCampaignPreviewProgress('moonwood-29');
  progress.campaign.currentStageId = 'moonwood-28';
  progress.campaign.visitedStageIds = ['moonwood-28', 'moonwood-29'];
  await page.addInitScript(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key: campaignStorageKey(scope), value: progress });
  await page.setViewportSize({ width: profile.width, height: profile.height });
  await page.goto('/preview/rounded-campaign.html?stage=moonwood-28&scope=navigation-long-repaired-place&resume=1&simple=1');
  await page.getByRole('button', { name: 'Start exploring', exact: true }).click();
  await expect(page.locator(GAME)).toHaveAttribute('data-scene-ready', 'true');
  await page.getByRole('button', { name: 'Places', exact: true }).click();
  await page.getByText('Explore objects', { exact: true }).click();
  await page.locator('.rc-discovery-list button').first().click();
  await expect(page.locator('.rc-route-status')).toBeVisible();
  await checkNavigationGeometry(page, profile, 'long repaired place travel', false);
  await expect(page.locator('.rc-route-status')).toHaveAttribute('data-arrived', 'true', { timeout: 55000 });
  await checkNavigationGeometry(page, profile, 'long repaired place arrival', false);
  const objective = page.locator('.rc-objective');
  await expect(objective).toContainText('Sleeping Observatory');
  await expect(objective).toContainText('Try an extra adventure, or explore the next place.');
  expect(await objective.evaluate(panel => panel.scrollHeight > panel.clientHeight), 'long mission panel has its own scroll space').toBe(true);
  await page.screenshot({ path: info.outputPath('long-repaired-place-arrival.png') });
  const actions = objective.getByRole('button');
  expect(await actions.count()).toBe(3);
  for (const action of await actions.all()) {
    await action.scrollIntoViewIfNeeded();
    const geometry = await action.evaluate(button => {
      const rect = button.getBoundingClientRect(), panel = button.closest('.rc-objective').getBoundingClientRect();
      return { width: rect.width, height: rect.height, contained: rect.top >= panel.top && rect.bottom <= panel.bottom,
        uncovered: document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2)?.closest('button') === button };
    });
    expect(geometry.width).toBeGreaterThanOrEqual(56);
    expect(geometry.height).toBeGreaterThanOrEqual(56);
    expect(geometry.contained, 'each mission action can be scrolled fully into its own panel').toBe(true);
    expect(geometry.uncovered, 'each mission action receives native input after scrolling').toBe(true);
    await checkNavigationGeometry(page, profile, 'scrolled long repaired place', false);
  }
  await page.screenshot({ path: info.outputPath('long-repaired-place-scrolled.png') });
  await expect(page.locator(GAME)).toHaveAttribute('data-mode', 'explore');
});

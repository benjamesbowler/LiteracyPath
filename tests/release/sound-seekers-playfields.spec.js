import { test, expect } from '@playwright/test';
import { CAMPAIGN_MISSIONS } from '../../src/features/soundSeekers/v3/content/campaign.js';
import { CAMPAIGN_PLAY } from '../../src/features/soundSeekers/rounded/campaignPlayfield.js';

test('all 210 authored entrances and first decisions render their playfields with usable native controls', async ({ page }, info) => {
  test.setTimeout(180_000);
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/tests/fixtures/sound-seekers-playfields.html');
  const families = new Set();
  for (const mission of CAMPAIGN_MISSIONS) {
    await page.getByLabel('Synthetic mission').selectOption(mission.id);
    await expect(page.locator('[data-rendered-mission]')).toHaveAttribute('data-rendered-mission', mission.id);
    for (const surface of ['entrance', 'first decision']) {
      if (surface === 'first decision') await page.getByRole('button', { name: 'First decision', exact: true }).click();
      const family = await page.locator('.rounded-activity').getAttribute('data-family');
      // Mixed oral-scene packs choose their authored scenario family; the
      // mission's primary-family label is not an authority for every beat.
      expect(Object.keys(CAMPAIGN_PLAY), `${mission.id}: ${surface}`).toContain(family);
      await page.waitForFunction(() => [...document.querySelectorAll('.rounded-activity img')].every(img => img.complete && img.naturalWidth));
      const failed = await page.locator('.rounded-activity button').evaluateAll(nodes => nodes.filter(node => {
        const r = node.getBoundingClientRect(); return r.width < 56 || r.height < 56 || r.left < 0 || r.right > innerWidth || r.top < 0 || r.bottom > innerHeight;
      }).map(node => node.getAttribute('aria-label') || node.textContent));
      expect(failed, `${mission.id}: ${surface}`).toEqual([]);
      families.add(family);
    }
  }
  expect(families.size).toBe(12); expect(errors).toEqual([]);
  await info.attach('210-entrances', { contentType: 'application/json', body: JSON.stringify({
    missionIds: CAMPAIGN_MISSIONS.map(item => item.id), families: [...families], evidence: 'Synthetic entrances and first decisions in the production activity renderer', earnedCompletion: false, hostedWrites: false
  }) });
});

test('a cancelled native drag makes no mistake; a deliberate bridge drop places one exact piece', async ({ page }) => {
  await page.goto('/tests/fixtures/sound-seekers-playfields.html');
  await page.getByLabel('Synthetic mission').selectOption('meadow-01-3');
  await page.getByRole('button', { name: 'First decision', exact: true }).click();
  const source = page.locator('.rounded-piece').first();
  const box = await source.boundingBox(), slots = await page.locator('[data-drop-zone=assembly]').boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down();
  await page.mouse.move(12, 18, { steps: 5 }); await page.mouse.up();
  await expect(page.locator('[data-rendered-mission]')).toHaveAttribute('data-errors', '0');
  await expect(page.locator('[data-settled=true]')).toHaveCount(0);
  // The first piece is chosen by its visible letter label, not a hidden answer.
  const letter = (await source.innerText()).trim();
  if (letter !== 'm') await page.getByRole('button', { name: /^Place m, piece/ }).first().focus();
  const tile = page.getByRole('button', { name: /^Place m, piece/ }).first();
  const rect = await tile.boundingBox();
  await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2); await page.mouse.down();
  await page.mouse.move(slots.x + slots.width / 2, slots.y + slots.height / 2, { steps: 6 }); await page.mouse.up();
  await expect(page.locator('[data-settled=true]')).toHaveCount(1);
  await expect(page.locator('[data-rendered-mission]')).toHaveAttribute('data-errors', '0');
});

test('a native drag opens a closed lantern before it can count as a literacy response', async ({ page }) => {
  await page.goto('/tests/fixtures/sound-seekers-playfields.html');
  const mission = CAMPAIGN_MISSIONS.find(item => item.familyId === 'lantern-search');
  await page.getByLabel('Synthetic mission').selectOption(mission.id);
  await page.getByRole('button', { name: 'First decision', exact: true }).click();
  const lantern = page.getByRole('button', { name: 'Look inside lantern 1', exact: true });
  const r = await lantern.boundingBox();
  await page.mouse.move(r.x + r.width / 2, r.y + r.height / 2); await page.mouse.down();
  await page.mouse.move(r.x + r.width / 2 + 18, r.y + r.height / 2, { steps: 4 }); await page.mouse.up();
  await expect(page.locator('.rounded-choice-pair.is-open')).toHaveCount(1);
  await expect(page.locator('.rounded-family-scene')).toHaveAttribute('data-motion', 'idle');
  await expect(page.locator('[data-rendered-mission]')).toHaveAttribute('data-errors', '0');
  await expect(page.locator('.rounded-physical-choice').first()).toBeEnabled();
});

test('leaving the playfield cancels a held drag without accepting its later release', async ({ page }) => {
  await page.goto('/tests/fixtures/sound-seekers-playfields.html');
  await page.getByLabel('Synthetic mission').selectOption('meadow-01-3');
  await page.getByRole('button', { name: 'First decision', exact: true }).click();
  const source = await page.locator('.rounded-piece').first().boundingBox();
  const target = await page.locator('[data-drop-zone=assembly]').boundingBox();
  await page.mouse.move(source.x + source.width / 2, source.y + source.height / 2); await page.mouse.down();
  await page.mouse.move(target.x + target.width / 2, target.y + target.height / 2, { steps: 6 });
  await expect(page.locator('.campaign-drag-ghost')).toBeVisible();
  await page.getByLabel('Synthetic mission').focus();
  await expect(page.locator('.campaign-drag-ghost')).toHaveCount(0);
  await page.mouse.up();
  await expect(page.locator('[data-settled=true]')).toHaveCount(0);
  await expect(page.locator('[data-rendered-mission]')).toHaveAttribute('data-errors', '0');
});

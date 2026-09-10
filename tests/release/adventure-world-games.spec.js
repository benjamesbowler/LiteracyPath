import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { buildSortRounds } from '../../src/utils/adventureRounds.js';
test.describe.configure({
  mode: 'parallel'
});
test.use({
  hasTouch: true,
  actionTimeout: 10000
});
const out = '.artifacts/adventure-world-repair';
const simulatedClock = process.env.LP_ADVENTURE_CLOCK === '1';
const advanceTime = (page, ms) => simulatedClock ? page.clock.runFor(ms) : page.waitForTimeout(ms);
async function open(page, game, difficulty) {
  await page.goto(`/preview/game-overlay.html?game=${game}&difficulty=${difficulty}&sound=0&music=0`);
  await expect(page.locator('.aw-stage')).toBeVisible();
}
async function reachable(page, button) {
  const stage = page.locator('.aw-stage');
  for (let i = 0; i < 25; i++) {
    const b = await button.boundingBox();
    const r = await page.locator('[data-aw="world"]').boundingBox();
    if (b && b.x >= r.x + 8 && b.x + b.width <= r.x + r.width - 8) {
      await advanceTime(page, 180);
      return;
    }
    await stage.focus();
    await page.keyboard.down(b && b.x < r.x ? 'ArrowLeft' : 'ArrowRight');
    await advanceTime(page, 250);
    await page.keyboard.up('ArrowLeft');
    await page.keyboard.up('ArrowRight');
  }
  throw Error('pickup never reachable');
}
async function carry(page, value) {
  const pickup = page.locator(`[data-aw="pickup"][data-value="${value}"]`);
  await reachable(page, pickup);
  await pickup.click();
  if (simulatedClock) await page.clock.runFor(3000);
  await expect(page.locator('.aw-stage')).toHaveAttribute('data-carry', value);
  await page.getByRole('button', {
    name: /Carry (plank to bridge|seed to bed)/
  }).click();
  if (simulatedClock) {
    const mode = await page.locator(".aw-stage").getAttribute("data-aw-mode");
    await page.clock.runFor(mode === "garden" ? 5500 : 4500);
  }
  if (!await page.locator(".aw-stage").count()) {
    await expect(page.getByRole("button", { name: "Replay level", exact: true })).toBeVisible();
    return;
  }
  await expect(page.locator('.aw-stage')).toHaveAttribute('data-carry', '', {
    timeout: 15000
  });
}
for (const difficulty of ['easy', 'medium', 'hard']) for (const [game, mode, total] of [['word-rescue', 'rescue', 36], ['sound-sort-factory', 'sort', buildSortRounds(difficulty).items.length], ['letter-garden', 'garden', 26]]) test(`${game} ${difficulty} entire playable route`, async ({
  page
}) => {
  test.setTimeout(300000);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await open(page, game, difficulty);
  if (simulatedClock) {
    await page.clock.install();
    await page.clock.pauseAt(new Date(Date.now() + 1000));
  }
  fs.mkdirSync(out, {
    recursive: true
  });
  await page.screenshot({
    path: `${out}/${game}-${difficulty}-start.png`
  });
  for (let i = 0; i < total; i++) {
    await expect(page.locator('.aw-stage')).toHaveAttribute('data-aw-index', String(i));
    if (mode === 'sort') {
      const word = await page.locator('[data-aw="parcel"] strong').innerText();
      const bins = await page.locator('[data-aw="chute"]').evaluateAll(ns => ns.map(n => n.dataset.bin));
      const correct = bins.filter(b => word.startsWith(b)).sort((a, b) => b.length - a.length)[0];
      await page.locator(`[data-bin="${correct}"]`).click();
      if (simulatedClock) await page.clock.runFor(2600);
    } else {
      let value;
      if (mode === 'rescue') value = await page.locator('[data-aw="target"]').innerText();else {
        const target = (await page.locator('.aw-objective strong img').getAttribute('alt').catch(() => null)) || (await page.locator('.aw-objective strong b').innerText());
        const source = await page.locator('.aw-objective strong>span').innerText();
        value = [...target.replace(/^(?:a|the) /i, '').toLowerCase()].find((c, j) => c !== source[j]);
      }
      await carry(page, value, i);
    }
    if (i === Math.floor(total / 2)) await page.screenshot({
      path: `${out}/${game}-${difficulty}-middle.png`
    });
    if (i < total - 1) await expect(page.locator('.aw-stage')).toHaveAttribute('data-aw-index', String(i + 1), {
      timeout: 15000
    });
  }
  await expect(page.getByRole('button', {
    name: 'Replay level',
    exact: true
  })).toBeVisible({
    timeout: 15000
  });
  if (game === "word-rescue" && difficulty === "easy") {
    const replay = page.getByRole("button", { name: "Replay level", exact: true });
    const next = page.getByRole("button", { name: "Next level", exact: true });
    await expect(next).toBeFocused();
    await expect(page.locator(".lg-game-player-header")).toHaveAttribute("inert", "");
    await page.keyboard.press("Tab");
    await expect(replay).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(next).toBeFocused();
  }
  await page.screenshot({
    path: `${out}/${game}-${difficulty}-complete.png`
  });
  expect(errors).toEqual([]);
});
test('rescue wrong tool preserves bridge, carrying freezes on quit and resumes', async ({
  page
}) => {
  test.setTimeout(60000);
  await open(page, 'word-rescue', 'easy');
  const target = await page.locator('[data-aw="target"]').innerText();
  const wrong = await page.locator('[data-aw="pickup"]').evaluateAll((ns, t) => ns.find(n => n.dataset.value !== t).dataset.value, target);
  await carry(page, wrong);
  await expect(page.locator('.aw-stage')).toHaveAttribute('data-built', '0');
  await expect(page.locator('[data-aw="feedback"]')).toContainText('does not match');
  const pick = page.locator(`[data-value="${target}"]`);
  await reachable(page, pick);
  await pick.click();
  await expect(page.locator('.aw-stage')).toHaveAttribute('data-carry', target);
  await page.locator('.aw-stage').focus();
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(150);
  await page.getByRole('button', {
    name: 'Close Word Rescue',
    exact: true
  }).click();
  await page.keyboard.up('ArrowRight');
  const x = await page.locator('.aw-stage').getAttribute('data-hero-x');
  await page.waitForTimeout(300);
  expect(await page.locator('.aw-stage').getAttribute('data-hero-x')).toBe(x);
  await page.getByRole('button', {
    name: /Keep playing/i
  }).click();
  await expect(page.locator('.aw-stage')).toHaveAttribute('data-carry', target);
  await page.getByRole('button', {
    name: 'Carry plank to bridge'
  }).click();
  await expect(page.locator('.aw-stage')).toHaveAttribute('data-built', '1', {
    timeout: 10000
  });
});
test('factory wrong chute returns same parcel; drag cancel and manual feed do not score', async ({
  page
}) => {
  await open(page, 'sound-sort-factory', 'medium');
  const parcel = page.locator('[data-aw="parcel"]');
  const word = await parcel.innerText();
  const bins = await page.locator('[data-aw="chute"]').evaluateAll(ns => ns.map(n => n.dataset.bin));
  const right = bins.filter(b => word.startsWith(b)).sort((a, b) => b.length - a.length)[0];
  await page.locator(`[data-bin="${bins.find(b => b !== right)}"]`).click();
  await expect(page.locator('.aw-stage')).toHaveAttribute('data-belt-phase', 'returning');
  await expect(page.locator('.aw-stage')).toHaveAttribute('data-belt-phase', 'ready');
  expect(await parcel.innerText()).toBe(word);
  await expect(page.locator('.aw-stage')).toHaveAttribute('data-aw-index', '0');
  const box = await parcel.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + 30, box.y - 100);
  await page.mouse.up();
  await expect(page.locator('.aw-stage')).toHaveAttribute('data-belt-phase', 'ready');
  await page.getByRole('button', {
    name: 'Manual feed',
    exact: true
  }).click();
  await page.locator(`[data-bin="${right}"]`).press('Enter');
  await expect(page.locator('.aw-stage')).toHaveAttribute('data-aw-index', '1');
  await expect(page.locator('.aw-stage')).toHaveAttribute('data-belt-phase', 'waiting');
  await page.waitForTimeout(600);
  await expect(page.locator('.aw-stage')).toHaveAttribute('data-aw-index', '1');
  await page.getByRole('button', {
    name: 'Feed parcel',
    exact: true
  }).click();
  await expect(page.locator('.aw-stage')).toHaveAttribute('data-belt-phase', /feeding|ready/);
});
for (const game of ['word-rescue', 'sound-sort-factory', 'letter-garden']) test(`${game} touch portrait and short landscape keep controls visible`, async ({
  page
}) => {
  await page.setViewportSize({
    width: 390,
    height: 844
  });
  await open(page, game, 'hard');
  await page.screenshot({
    path: `${out}/${game}-portrait.png`
  });
  if (game === 'sound-sort-factory') {
    await page.locator('[data-aw=chute]').first().tap();
  } else {
    const pickup = page.locator('[data-aw=pickup]').first();
    const value = await pickup.getAttribute('data-value');
    await pickup.tap();
    await expect(page.locator('.aw-stage')).toHaveAttribute('data-carry', value);
    await page.getByRole('button', {
      name: /Carry (plank to bridge|seed to bed)/
    }).tap();
  }
  for (const button of await page.locator('.aw-controls button').all()) {
    const b = await button.boundingBox();
    expect(b.width).toBeGreaterThanOrEqual(56);
    expect(b.height).toBeGreaterThanOrEqual(56);
    expect(b.y + b.height).toBeLessThanOrEqual(844);
  }
  await page.setViewportSize({
    width: 844,
    height: 390
  });
  await page.screenshot({
    path: `${out}/${game}-short.png`
  });
  const w = await page.locator('.aw-landscape,.aw-machine').boundingBox();
  expect(w.height).toBeGreaterThan(100);
  for (const button of await page.locator('.aw-controls button').all()) {
    const b = await button.boundingBox();
    expect(b.y + b.height).toBeLessThanOrEqual(390);
  }
});
test('garden wrong seed leaves stable letters and reload resumes exact beds, target and score', async ({
  page
}) => {
  test.setTimeout(90000);
  await open(page, 'letter-garden', 'easy');
  const letter = async () => {
    const source = await page.locator('.aw-objective strong>span').innerText();
    const target = (await page.locator('.aw-objective img').getAttribute('alt')).replace(/^(?:a|the) /i, '').toLowerCase();
    return [...target].find((c, i) => c !== source[i]);
  };
  await carry(page, await letter());
  await expect(page.locator('.aw-stage')).toHaveAttribute('data-aw-index', '1');
  const target = await page.locator('.aw-objective img').getAttribute('alt');
  const right = await letter();
  const wrong = await page.locator('[data-aw=pickup]').evaluateAll((ns, r) => ns.find(n => n.dataset.value !== r).dataset.value, right);
  await carry(page, wrong);
  await expect(page.locator('.aw-stage')).toHaveAttribute('data-aw-index', '1');
  await expect(page.locator('.aw-stage')).toHaveAttribute('data-built', '1');
  await page.waitForTimeout(800);
  await page.reload();
  await page.getByRole('button', {
    name: 'Continue',
    exact: true
  }).click();
  await expect(page.locator('.aw-stage')).toHaveAttribute('data-aw-index', '1');
  await expect(page.locator('.aw-stage')).toHaveAttribute('data-built', '1');
  expect(await page.locator('.aw-objective img').getAttribute('alt')).toBe(target);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('literacy-guide-adventure-world:fullscreen-overlay-preview:garden:easy')));
  expect(saved.score).toBe(16);
  expect(saved.wrongs).toBe(1);
  expect(saved.grown).toHaveLength(1);
  expect(saved.evidence.firstResponses).toHaveLength(2);
  await carry(page, right);
  await expect(page.locator('.aw-stage')).toHaveAttribute('data-aw-index', '2');
});

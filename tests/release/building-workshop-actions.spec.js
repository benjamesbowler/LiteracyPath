import { mkdir, writeFile, rm } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { test, expect } from "@playwright/test";
import { WORKSHOP_OBJECTS } from "../../src/utils/workshopObjects.js";

async function solveBuild(page, word) {
  for (const unit of WORKSHOP_OBJECTS[word].units) {
    await page.locator('.lg-workshop-bank button:not([disabled])').getByText(unit.grapheme, { exact: true }).first().click();
  }
  await page.getByRole("button", { name: `Blend ${word}`, exact: true }).click();
}

const harnessFiles = new Set();
test.afterEach(async () => {
  for (const file of harnessFiles) await rm(file, { force: true });
  harnessFiles.clear();
});

async function loadHarness(page, body) {
  const file = `.artifacts/g08-component-${randomUUID()}.jsx`;
  await mkdir('.artifacts', { recursive: true });
  await writeFile(file, `
import '/src/index.css';
import '/src/styles/learn-games.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { WorkshopObjectAction } from '/src/components/learn/games/shared/WorkshopObjectAction.jsx';
import { ArcadePracticeGame } from '/src/components/learn/games/games/ArcadePracticeGame.jsx';
import { WORKSHOP_OBJECTS } from '/src/utils/workshopObjects.js';
${body}`);
  harnessFiles.add(file);
  await page.route("**/g08-component-check", async route => {
    const response = await page.request.get('/preview/game-overlay.html');
    const html = (await response.text()).replace('/src/game-overlay-preview.jsx', `/${file}`);
    await route.fulfill({ contentType: 'text/html', body: html });
  });
  await page.goto("/g08-component-check");
}

for (const [difficulty, count] of [["easy", 6], ["medium", 8], ["hard", 10]]) {
test(`workshop completes ${difficulty} build, blend, object-use and next actions`, async ({ page }) => {
  await page.goto(`/preview/game-overlay.html?game=cvc-word-builder&sound=0&music=0&difficulty=${difficulty}`);
  for (let round = 0; round < count; round += 1) {
    const word = (await page.locator('.lg-game-build > .lg-game-picture img').getAttribute('alt')).replace(/^A |^The /, '').toLowerCase();
    await solveBuild(page, word);
    await expect(page.locator('.lg-object-scene')).toHaveAttribute('data-state', 'ready');
    const before = await page.locator('.lg-object-actor').evaluate(el => el.getBoundingClientRect().x);
    await page.getByRole('button', { name: 'Use object', exact: true }).click();
    await expect(page.locator('.lg-object-scene')).toHaveAttribute('data-state', 'used');
    if(round===count-1) expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('literacy-guide-learn-games:fullscreen-overlay-preview')).games['cvc-word-builder'].plays)).toBe(1);
    await expect.poll(() => page.locator('.lg-object-actor').evaluate(el => el.getBoundingClientRect().x)).not.toBe(before);
    const next = page.getByRole('button', { name: round === count - 1 ? 'Finish' : 'Next build', exact: true });
    await expect(next).toBeVisible();
    const rect = await next.boundingBox();
    expect(rect.height).toBeGreaterThanOrEqual(56);
    expect(rect.width).toBeGreaterThanOrEqual(56);
    await next.click();
  }
  await expect(page.getByRole('heading', { name: 'CVC Word Builder complete!', exact: true })).toBeVisible();
});
}

test("object effects change their destinations and reduced motion retains every settled result", async ({ page }) => {
  await loadHarness(page, `
function App() {
  const [active, setActive] = React.useState(false);
  return React.createElement('main', null,
    React.createElement('button', {onClick: () => setActive(true)}, 'Use all objects'),
    React.createElement('div', {style: {display:'grid',gridTemplateColumns:'repeat(3, 400px)',gap:12}},
      Object.entries(WORKSHOP_OBJECTS).map(([word, recipe]) => React.createElement('section', {key:word},
        React.createElement('h2', null, word),
        React.createElement(WorkshopObjectAction, {target:{word,label:'A '+word,...recipe},active})))));
}
createRoot(document.getElementById('root')).render(React.createElement(App));`);
  await expect(page.locator('.lg-object-scene')).toHaveCount(Object.keys(WORKSHOP_OBJECTS).length);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('button', { name: 'Use all objects' }).click();
  await expect(page.locator('.lg-object-scene[data-state="used"]')).toHaveCount(Object.keys(WORKSHOP_OBJECTS).length);
  await expect(page.locator('.lg-object-puddle')).toHaveCSS('opacity', '0');
  await expect(page.locator('.lg-object-glow')).toHaveCSS('opacity', '1');
  await expect(page.locator('.lg-object-smooth')).toHaveCSS('opacity', '1');
  await expect(page.locator('.lg-object-tangles')).toHaveCSS('opacity', '0');
  await expect(page.locator('.lg-object-ink').first()).toHaveCSS('stroke-dashoffset', '0px');
  expect(await page.locator('.lg-object-paper').evaluate(el => getComputedStyle(el).transform)).not.toBe('none');
  const screenshots = process.env.LP_G08_SCREENSHOTS;
  if (screenshots) await page.screenshot({ path: `${screenshots}/all-object-results.png`, fullPage: true });
});

test("small landscape preserves the complete object result and next control", async ({ page }) => {
  await page.setViewportSize({ width: 568, height: 320 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/preview/game-overlay.html?game=cvc-word-builder&sound=0&music=0');
  const word = (await page.locator('.lg-game-build > .lg-game-picture img').getAttribute('alt')).replace(/^A |^The /, '').toLowerCase();
  await solveBuild(page, word);
  await page.getByRole('button', { name: 'Use object', exact: true }).click();
  const scene = await page.locator('.lg-object-scene').boundingBox();
  const next = await page.getByRole('button', { name: 'Next build', exact: true }).boundingBox();
  expect(scene.width).toBeGreaterThanOrEqual(240);
  expect(scene.height).toBeGreaterThanOrEqual(110);
  expect(scene.x).toBeGreaterThanOrEqual(0);
  expect(scene.y).toBeGreaterThanOrEqual(0);
  expect(scene.y + scene.height).toBeLessThanOrEqual(320);
  expect(next.y + next.height).toBeLessThanOrEqual(320);
  expect(next.height).toBeGreaterThanOrEqual(56);
  expect(next.width).toBeGreaterThanOrEqual(56);
  expect(next.x - (scene.x + scene.width)).toBeGreaterThanOrEqual(8);
  const screenshots = process.env.LP_G08_SCREENSHOTS;
  if (screenshots) await page.screenshot({ path: `${screenshots}/workshop-small-landscape.png` });
});

test("Family keeps first wrong and assisted retry across a sound change as supported practice", async ({ page }) => {
  await loadHarness(page, `
function App() {
  const [sound, setSound] = React.useState(false);
  return React.createElement('div', {className:'lg-game-player'},
    React.createElement('header', {className:'lg-game-player-header'}, React.createElement('button', {onClick:()=>setSound(value=>!value)}, 'Toggle sound')),
    React.createElement('main', {className:'lg-game-player-main'}, React.createElement(ArcadePracticeGame, {title:'Blend & Build',mode:'family',difficulty:'easy',isSoundEnabled:sound,
      onComplete:(stars,score,count,evidence)=>{window.result={stars,score,count,evidence};}})));
}
createRoot(document.getElementById('root')).render(React.createElement(App));`);
  for (let round = 0; round < 4; round += 1) {
    const target = await page.locator('.lg-blend-target strong').textContent();
    if (round === 0) {
      await page.locator('.lg-family-board button').filter({ hasText: new RegExp(`^[^${target[0]}]$`) }).first().click();
      await page.getByRole('button', { name: 'Toggle sound' }).click();
    }
    await page.locator('.lg-family-board').getByRole('button', { name: target[0], exact: true }).click();
    await page.locator('.lg-blend-reuse').click();
    await page.locator('.lg-blend-reuse-onsets button').first().click();
    await page.locator('.lg-blend-reuse-rime').click();
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
  }
  const result = await page.evaluate(() => window.result);
  expect(result.evidence.firstResponses[0]).toMatchObject({ correct:false, practiceOnly:true, independent:false, audioDelivery:'not_measured' });
  expect(result.evidence.firstResponses[0].supportUsed).toContain('printed_target');
  expect(result.evidence.assistedRetries[0]).toMatchObject({ round:0, attempts:1, independent:false });
});

async function expectReachableControls(page, selector) {
  const controls = page.locator(selector);
  for (const control of await controls.all()) {
    await expect(control).toBeVisible();
    const rect = await control.boundingBox();
    const viewport = page.viewportSize();
    expect(rect.width).toBeGreaterThanOrEqual(56);
    expect(rect.height).toBeGreaterThanOrEqual(56);
    expect(rect.x).toBeGreaterThanOrEqual(0);
    expect(rect.y).toBeGreaterThanOrEqual(0);
    expect(rect.x + rect.width).toBeLessThanOrEqual(viewport.width);
    expect(rect.y + rect.height).toBeLessThanOrEqual(viewport.height);
    expect(await control.evaluate(el => {
      const r = el.getBoundingClientRect();
      return el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
    })).toBe(true);
  }
}

for (const viewport of [{ width: 568, height: 320 }, { width: 390, height: 844 }, { width: 1024, height: 768 }, { width: 768, height: 1024 }, { width: 1366, height: 768 }, { width: 1280, height: 720 }]) {
  for (const [difficulty, count] of [["easy", 6], ["medium", 8], ["hard", 10]]) {
    test(`workshop ${difficulty} tiles, repairs and blending fit ${viewport.width}x${viewport.height}`, async ({ page }) => {
      test.setTimeout(60000);
      await page.setViewportSize(viewport);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(`/preview/game-overlay.html?game=cvc-word-builder&sound=1&music=0&difficulty=${difficulty}`);
      for (let round = 0; round < count; round += 1) {
        const word = (await page.locator('.lg-game-build > .lg-game-picture img').getAttribute('alt')).replace(/^A |^The /, '').toLowerCase();
        await expectReachableControls(page, '.lg-workshop-bank button:not([disabled]), .lg-game-build .lg-game-audio');
        if (round === 0) {
          // Two mistakes expose both correction controls and the printed hint.
          for (let attempt = 0; attempt < 2; attempt += 1) {
            await page.locator('.lg-workshop-bank button').filter({ hasText: new RegExp(`^(?!${WORKSHOP_OBJECTS[word].units[0].grapheme}$).+`) }).first().click();
            for (let index = 1; index < WORKSHOP_OBJECTS[word].units.length; index += 1) await page.locator('.lg-workshop-bank button:not([disabled])').first().click();
            await expect(page.locator('.lg-workshop-slots button')).toHaveCount(0);
            await expectReachableControls(page, '.lg-build-compare, .lg-workshop-bank button:not([disabled])');
          }
          await expect(page.locator('.lg-build-hint')).toBeVisible();
          await page.getByRole('button', { name: 'Compare sounds', exact: true }).click();
          await expectReachableControls(page, '.lg-build-comparison button');
          await page.getByRole('button', { name: 'Hear target sound', exact: true }).click();
          if (process.env.LP_G08_SCREENSHOTS) await page.screenshot({ path: `${process.env.LP_G08_SCREENSHOTS}/repair-${difficulty}-${viewport.width}.png` });
        }
        for (const unit of WORKSHOP_OBJECTS[word].units) await page.locator('.lg-workshop-bank button:not([disabled])').getByText(unit.grapheme, { exact: true }).first().click();
        await expectReachableControls(page, '.lg-build-blend');
        await page.getByRole('button', { name: `Blend ${word}`, exact: true }).click();
        await page.getByRole('button', { name: 'Use object', exact: true }).click();
        await page.getByRole('button', { name: round === count - 1 ? 'Finish' : 'Next build', exact: true }).click();
      }
      await expect(page.getByRole('heading', { name: 'CVC Word Builder complete!', exact: true })).toBeVisible();
    });
  }
}

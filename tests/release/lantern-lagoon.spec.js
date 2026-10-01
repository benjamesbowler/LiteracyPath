import { expect, test } from '@playwright/test';
import { LANTERN_READING_SCENES, LANTERN_SUPPORTED_SCENES } from '../../src/data/lanternLagoonContent.js';
import { buildLanternLagoonDeck, lanternChoiceDescription, newLanternEvidence } from '../../src/utils/lanternLagoonModel.js';

const fixture = '/tests/fixtures/lantern-lagoon.html';
async function open(page, query = 'cycle=12&sound=off', viewport) {
  if (viewport) await page.setViewportSize(viewport);
  await page.goto(`${fixture}?${query}`);
  await expect(page.locator('.lantern-lagoon')).toBeVisible();
  await expect(page.locator('.lantern-actor')).toHaveCount(3);
  await page.locator('.lantern-actor img').evaluateAll(images => Promise.all(images.map(image => image.decode().catch(() => {}))));
}
async function openWithStoppedClock(page, query) {
  // Freeze before mounting the scene. A host new Date() can already be behind
  // the installed clock by the time pauseAt executes, before any game assertion.
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await page.clock.pauseAt(new Date('2026-01-02T00:00:00Z'));
  await open(page, query);
}
const snapshot = page => page.evaluate(() => window.__lanternEngine.debugSnapshot());
async function correct(page) { const state = await snapshot(page); await page.locator(`[data-choice-id="${state.deck.rounds[state.round].answerId}"]`).click(); }
async function headerInk(page) {
  return page.locator('.lg-game-title-chip').evaluate(node => {
    const chip = node.getBoundingClientRect(), header = node.closest('header').getBoundingClientRect();
    const clip = { left: Math.max(chip.left, header.left, 0), right: Math.min(chip.right, header.right, innerWidth), top: Math.max(chip.top, header.top, 0), bottom: Math.min(chip.bottom, header.bottom, innerHeight) };
    const context = document.createElement('canvas').getContext('2d'), walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    const glyphs = [], range = document.createRange(); let text;
    while ((text = walker.nextNode())) {
      const style = getComputedStyle(text.parentElement);
      context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      for (let index = 0; index < text.length; index++) {
        let character = text.data[index]; if (!character.trim()) continue;
        if (style.textTransform === 'uppercase') character = character.toUpperCase();
        else if (style.textTransform === 'lowercase') character = character.toLowerCase();
        range.setStart(text, index); range.setEnd(text, index + 1);
        const rect = range.getBoundingClientRect(), metrics = context.measureText(character), baseline = rect.top + metrics.fontBoundingBoxAscent;
        const ink = { left: rect.left - metrics.actualBoundingBoxLeft, right: rect.left + metrics.actualBoundingBoxRight,
          top: baseline - metrics.actualBoundingBoxAscent, bottom: baseline + metrics.actualBoundingBoxDescent };
        glyphs.push({ character, ink, valid: Object.values(ink).every(Number.isFinite), inside: ink.left >= clip.left - .1 && ink.right <= clip.right + .1 && ink.top >= clip.top - .1 && ink.bottom <= clip.bottom + .1 });
      }
    }
    // Range line boxes include unpainted font ascender space. Actual font ink
    // is measured separately so visible capitals pass and clipped letters fail.
    return { glyphCount: glyphs.length, measurementsValid: glyphs.every(glyph => glyph.valid), clipped: glyphs.filter(glyph => !glyph.inside), clip };
  });
}
async function contained(page) {
  await page.locator('.lantern-actor img').evaluateAll(images => Promise.all(images.map(image => image.decode().catch(() => {}))));
  const problems = await page.locator('.lantern-actor').evaluateAll(nodes => {
    const world = document.querySelector('.lantern-world').getBoundingClientRect();
    const boxes = nodes.map(node => node.getBoundingClientRect());
    const issues = [];
    boxes.forEach((box, index) => {
      if (box.width < 55.9 || box.height < 55.9) issues.push({ index, kind: 'small', width: box.width, height: box.height });
      if (box.left < world.left - .1 || box.top < world.top - .1 || box.right > world.right + .1 || box.bottom > world.bottom + .1) issues.push({ index, kind: 'outside', box: box.toJSON(), world: world.toJSON() });
      const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
      if (!(hit === nodes[index] || nodes[index].contains(hit))) issues.push({ index, kind: 'occluded', hit: hit?.className });
      const art = nodes[index].querySelector('img,svg');
      if (!art || (art.tagName === 'IMG' && (!art.complete || art.naturalWidth === 0))) issues.push({ index, kind: 'missing-art' });
    });
    for (let left = 0; left < boxes.length; left++) for (let right = left + 1; right < boxes.length; right++) {
      const a = boxes[left], b = boxes[right];
      const gapX = Math.max(b.left - a.right, a.left - b.right), gapY = Math.max(b.top - a.bottom, a.top - b.bottom);
      if (gapX < 7.9 && gapY < 7.9) issues.push({ left, right, kind: 'gap', gapX, gapY });
    }
    return issues;
  });
  expect(problems).toEqual([]);
  const contact = await page.locator('.lantern-island.relation-on:not(.has-companion):not([data-object="grass"])').evaluateAll(async nodes => {
    return Promise.all(nodes.map(async node => {
      const landmark = node.querySelector('.lantern-landmark'), svg = landmark.querySelector('svg'), animal = node.querySelector('.lantern-actor > img, .lantern-actor > svg');
      const land = landmark.getBoundingClientRect(), art = animal.getBoundingClientRect();
      const [,, width, height] = svg.getAttribute('viewBox').split(/\s+/u).map(Number);
      const surface = land.top + land.height * Number(getComputedStyle(node).getPropertyValue('--surface-y'));
      let foot;
      if (animal.tagName === 'IMG') {
        await animal.decode();
        const canvas = document.createElement('canvas'); canvas.width = animal.naturalWidth; canvas.height = animal.naturalHeight;
        const context = canvas.getContext('2d'); context.drawImage(animal, 0, 0);
        const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
        let painted = canvas.height;
        for (let y = canvas.height - 1; y >= 0; y--) {
          let opaque = 0; for (let x = 0; x < canvas.width; x++) if (pixels[(y * canvas.width + x) * 4 + 3] > 190) opaque++;
          if (opaque >= 3) { painted = y + 1; break; }
        }
        const scale = Math.min(art.width / canvas.width, art.height / canvas.height);
        foot = art.bottom - (canvas.height - painted) * scale;
      } else foot = art.top + art.height * 109 / 120;
      return { object: node.dataset.object, unletterboxed: Math.abs(land.height / land.width - height / width) < .001, footGap: surface - foot };
    }));
  });
  // Paint and authored contact surface must coincide; a fitting square box
  // with a letterboxed log or mat previously left the paws 15–17px airborne.
  expect(contact.filter(item => !item.unletterboxed || Math.abs(item.footGap) > 3)).toEqual([]);
  const sentence = page.locator('.lantern-sentence'); await expect(sentence).toBeVisible();
  const glyphs = await sentence.evaluate(node => {
    const range = document.createRange(); range.selectNodeContents(node); const clip = document.querySelector('.lantern-message').getBoundingClientRect();
    return Array.from(range.getClientRects()).filter(rect => rect.width > 0).every(rect => rect.left >= clip.left && rect.right <= clip.right && rect.top >= clip.top && rect.bottom <= clip.bottom);
  }); expect(glyphs).toBe(true);
  const feedbackGlyphs = await page.locator('.lantern-feedback').evaluate(node => {
    const range = document.createRange(); range.selectNodeContents(node);
    const frame = document.querySelector('.lantern-lagoon').getBoundingClientRect(), clip = node.getBoundingClientRect();
    const rects = Array.from(range.getClientRects()).filter(rect => rect.width > 0);
    return rects.length > 0 && rects.every(rect => rect.left >= Math.max(frame.left, clip.left) && rect.right <= Math.min(frame.right, clip.right) && rect.top >= Math.max(frame.top, clip.top) && rect.bottom <= Math.min(frame.bottom, clip.bottom));
  }); expect(feedbackGlyphs).toBe(true);
  const targetSizes = await page.locator('.lantern-message-actions button:visible').evaluateAll(buttons => buttons.map(button => ({ w: button.getBoundingClientRect().width, h: button.getBoundingClientRect().height })));
  expect(targetSizes.length).toBeGreaterThan(0); expect(targetSizes.every(size => size.w >= 55.9 && size.h >= 55.9)).toBe(true);
  const companionGeometry = await page.locator('.lantern-companion').evaluateAll(nodes => nodes.map(node => {
    const actor = node.querySelector(':scope > .lantern-animal-art,:scope > .lantern-animal-fallback'), mat = node.querySelector(':scope > .lantern-object-art');
    const art = actor.getBoundingClientRect(), object = mat.getBoundingClientRect();
    const feet = actor.tagName === 'svg' ? art.top + art.height * 109 / 120 : art.bottom;
    const beside = node.classList.contains('relation-beside');
    return { width: art.width, relation: beside ? 'beside' : 'on', valid: beside ? art.left >= object.right - .1 && Math.abs(feet - object.bottom) < .2
      : Math.abs(feet - (object.top + object.height * .14)) < .2 && Math.abs((art.left + art.right) - (object.left + object.right)) < .2 };
  }));
  expect(companionGeometry.filter(item => !item.valid)).toEqual([]);
  if (companionGeometry.length) {
    expect(companionGeometry).toHaveLength(3);
    expect(Math.max(...companionGeometry.map(item => item.width)) - Math.min(...companionGeometry.map(item => item.width))).toBeLessThan(.2);
  }
}

for (const [name, viewport] of Object.entries({ 'phone-portrait': { width: 320, height: 667 }, 'phone-landscape': { width: 568, height: 320 }, 'tablet': { width: 1194, height: 834 } })) {
  for (const mode of ['reading', 'together']) test(`Lantern Lagoon ${name} ${mode} keeps all choices, glyphs and true spatial relations visible`, async ({ page }) => {
    await open(page, `cycle=12&sound=off&mode=${mode}`, viewport);
    await contained(page);
    const state = await snapshot(page);
    expect(state.evidence.firstResponses).toHaveLength(0);
    expect(await page.locator('.is-lit,.is-modelled').count()).toBe(0);
    if (mode === 'together') {
      const spatial = await page.evaluate(() => {
        const get = selector => document.querySelector(selector).getBoundingClientRect().toJSON();
        return { on: get('.at-on'), under: get('.at-under'), beside: get('.at-beside'), bridge: get('.lantern-bridge'), bank: get('.lantern-right-bank') };
      });
      expect(spatial.on.bottom).toBeLessThan(spatial.under.top);
      expect(spatial.under.x).toBe(spatial.on.x);
      // No near-size or style difference announces the requested duck.
      expect(spatial.on.width).toBe(spatial.under.width); expect(spatial.on.width).toBe(spatial.beside.width);
    }
    await page.screenshot({ path: `.artifacts/child-redesign-review/lantern-lagoon-${name}-${mode}.png` });
  });
}

test('Lantern retains wrong-answer scene, names selected meaning, models only after errors, and freezes sentence dwell on pause', async ({ page }) => {
  await openWithStoppedClock(page, 'cycle=10&sound=off');
  const initial = await snapshot(page), round = initial.deck.rounds[0], wrong = round.choices.find(choice => choice.id !== round.answerId);
  const sentence = await page.locator('.lantern-sentence').innerText();
  await page.locator(`[data-choice-id="${wrong.id}"]`).click();
  await expect(page.locator('.lantern-feedback')).toContainText(`The ${wrong.species} is ${wrong.relation} the ${wrong.object}.`);
  await expect(page.locator('.lantern-sentence')).toHaveText(sentence);
  expect((await snapshot(page)).evidence.firstResponses[0].correct).toBe(false);
  await page.locator(`[data-choice-id="${wrong.id}"]`).click();
  await expect(page.locator('.lantern-lagoon')).toHaveAttribute('data-phase', 'model');
  await expect(page.locator('.is-modelled')).toHaveCount(1);
  await page.clock.runFor(2500);
  await expect(page.locator('.lantern-lagoon')).toHaveAttribute('data-phase', 'active');
  await correct(page); await page.clock.runFor(800);
  await page.getByRole('button', { name: 'Pause game', exact: true }).click();
  await page.clock.runFor(6000);
  expect((await snapshot(page)).round).toBe(0);
  await expect(page.locator('.lantern-sentence')).toHaveText(sentence);
  await expect(page.locator('.lantern-actor').first()).toBeDisabled();
  await page.getByRole('button', { name: 'Resume game', exact: true }).click();
  await page.clock.runFor(1500); expect((await snapshot(page)).round).toBe(0);
  await page.clock.runFor(200); expect((await snapshot(page)).round).toBe(1);
  const after = await snapshot(page);
  expect(after.evidence.firstResponses).toHaveLength(1);
  expect(after.evidence.assistedRetries).toHaveLength(2);
  expect(after.evidence.assistedRetries.every(response => !response.independent)).toBe(true);
});

test('keyboard aims the same full-scene targets and completion reports one immutable participation receipt', async ({ page }) => {
  await openWithStoppedClock(page, 'cycle=10&sound=off&difficulty=medium');
  const total = (await snapshot(page)).deck.rounds.length;
  for (let roundIndex = 0; roundIndex < total; roundIndex++) {
    const state = await snapshot(page), round = state.deck.rounds[state.round];
    const target = round.choices.findIndex(choice => choice.id === round.answerId);
    await page.locator('.lantern-actor').first().focus();
    for (let move = 0; move < target; move++) await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    await expect(page.locator('.lantern-lagoon')).toHaveAttribute('data-phase', 'correct');
    // Duplicate activation cannot create another response, score or receipt.
    await page.evaluate(() => document.querySelector('.is-lit')?.click());
    await page.clock.runFor(2500);
  }
  await expect(page.locator('.lantern-lagoon')).toHaveAttribute('data-phase', 'complete');
  const receipts = await page.evaluate(() => window.__lanternReceipts);
  expect(receipts).toHaveLength(1); expect(receipts[0][2]).toBe(total);
  expect(receipts[0][3].firstResponses).toHaveLength(total);
  expect(receipts[0][3].firstResponses.every(response => response.independent)).toBe(true);
  expect(receipts[0][3].masteryClaim).toBe(false);
  await expect(page.locator('.lantern-feedback > p')).toHaveText('Your lagoon trail is lit!');
  await expect(page.locator('.lantern-feedback')).not.toContainText('Try the message again');
  await page.screenshot({ path: '.artifacts/child-redesign-review/lantern-lagoon-complete.png' });
});

test('real existing sentence audio resolves through actual delivery, and replay-supported reading remains supported', async ({ page }) => {
  await open(page, 'cycle=10&seed=9&sound=on&difficulty=medium');
  // Select a deterministic seed whose first reading message has an exact clip.
  let state = await snapshot(page);
  if (!state.deck.rounds[0].audioPath) {
    await page.goto(`${fixture}?cycle=10&seed=19&sound=on&difficulty=easy`);
    state = await snapshot(page);
  }
  if (!state.deck.rounds[0].audioPath) {
    await page.goto(`${fixture}?mode=listening&sound=on`);
  } else await page.getByRole('button', { name: 'Hear the whole sentence again', exact: true }).click();
  await expect.poll(async () => (await snapshot(page)).audioDelivery).toBe('ended');
  await correct(page);
  expect((await snapshot(page)).evidence.firstResponses[0].independent).toBe(false);
  expect((await snapshot(page)).evidence.firstResponses[0].audioDelivery).toBe('ended');
});

test('sound-off unknown placement and failed assets keep supported evidence and complete semantic vector fallback', async ({ page }) => {
  await page.route('**/images/arcade/lantern-lagoon/*.webp', route => route.abort());
  await open(page, 'sound=off');
  await expect(page.locator('.lantern-lagoon')).toHaveAttribute('data-mode', 'listening');
  await expect(page.locator('.lantern-audio-notice')).toContainText('Sound is off');
  await expect(page.locator('.lantern-animal-fallback')).toHaveCount(3);
  await expect(page.locator('.lantern-traveller > .lantern-prop-fallback')).toBeVisible();
  expect(await page.locator('.lantern-lagoon img').count()).toBe(0);
  await contained(page); await correct(page);
  expect((await snapshot(page)).evidence.firstResponses[0].independent).toBe(false);
  expect((await snapshot(page)).evidence.firstResponses[0].audioDelivery).toBe('sound_off');
  await page.screenshot({ path: '.artifacts/child-redesign-review/lantern-lagoon-fallback.png' });
});

test('reload retains seed, choices, first error and support; missing local host support stays explicitly supported', async ({ page }) => {
  await open(page, 'cycle=10&sound=off');
  const before = await snapshot(page), round = before.deck.rounds[0];
  await page.locator(`[data-choice-id="${round.choices.find(choice => choice.id !== round.answerId).id}"]`).click();
  await page.evaluate(() => window.__lanternEngine.markSupported('mission-help'));
  await page.reload(); await expect(page.locator('.lantern-actor')).toHaveCount(3);
  const restored = await snapshot(page);
  expect(restored.deck).toEqual(before.deck); expect(restored.attempts).toBe(1);
  expect(restored.support).toContain('mission-help'); expect(restored.evidence.firstResponses).toHaveLength(1);
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${fixture}?cycle=10&sound=off&start=1`);
  const remote = await snapshot(page); expect(remote.round).toBe(1);
  expect(remote.evidence.firstResponses).toHaveLength(0);
  await correct(page); expect((await snapshot(page)).evidence.firstResponses[0].supportUsed).toContain('resume_without_support_record');
  expect((await snapshot(page)).evidence.firstResponses[0].independent).toBe(false);
});

test('mode change opens approved bridge support without crediting an unfinished reading response', async ({ page }) => {
  await open(page, 'cycle=10&sound=off');
  await page.getByRole('button', { name: 'Read richer messages with a grown-up', exact: true }).click();
  const state = await snapshot(page); expect(state.round).toBe(0); expect(state.score).toBe(0);
  expect(state.deck.rounds[0].id).toBe('duck-under-bridge');
  expect(state.evidence.firstResponses).toHaveLength(0); await contained(page);
  await correct(page); expect((await snapshot(page)).evidence.firstResponses[0].responseMode).toBe('adult_supported');
});

test('checkpoint zero without local support history cannot recreate an independent first response', async ({ page }) => {
  await open(page, 'cycle=10&sound=off&resumed=true');
  const state = await snapshot(page); expect(state.round).toBe(0); expect(state.evidence.firstResponses).toHaveLength(0);
  expect(state.support).toContain('resume_without_support_record'); await correct(page);
  expect((await snapshot(page)).evidence.firstResponses[0].independent).toBe(false);
  expect((await snapshot(page)).evidence.firstResponses[0].supportUsed).toContain('resume_without_support_record');
});
test('malformed matching-version local support cannot crash or recreate an independent checkpoint-zero response', async ({ page }) => {
  await open(page, 'cycle=10&sound=off');
  // Corrupt after the previous page's owned unmount persistence and before
  // the new engine reads storage, matching a damaged on-device snapshot.
  await page.addInitScript(() => {
    const key = Object.keys(localStorage).find(value => value.includes(':lantern-lagoon:easy'));
    const snapshot = JSON.parse(localStorage.getItem(key)); delete snapshot.gameState.evidence.supportEvents;
    localStorage.setItem(key, JSON.stringify(snapshot));
  });
  await page.goto(`${fixture}?cycle=10&sound=off&resumed=true`);
  await expect(page.locator('.lantern-actor')).toHaveCount(3); const value = await snapshot(page);
  expect(value.support).toContain('resume_without_support_record'); expect(value.evidence.firstResponses).toHaveLength(0);
  await correct(page); expect((await snapshot(page)).evidence.firstResponses[0].independent).toBe(false);
});

test('held speech, replay replacement, hidden tab and pause preserve the exact result, traveller and support truth', async ({ page }) => {
  await page.addInitScript(() => {
    window.__lagoonAudio = [];
    window.Audio = class extends EventTarget {
      constructor(src) { super(); this.src = src; this.duration = 12; this.currentTime = 0; this.playbackRate = 1; this.plays = 0; this.paused = true; window.__lagoonAudio.push(this); }
      play() { this.paused = false; this.plays++; this.dispatchEvent(new Event('playing')); return Promise.resolve(); }
      pause() { this.paused = true; }
    };
    window.__setLagoonHidden = hidden => { Object.defineProperty(document, 'hidden', { configurable: true, value: hidden }); document.dispatchEvent(new Event('visibilitychange')); };
  });
  await openWithStoppedClock(page, 'cycle=10&sound=on');
  await page.getByRole('button', { name: 'Hear the whole sentence again', exact: true }).click();
  await page.getByRole('button', { name: 'Hear the whole sentence again', exact: true }).click();
  await page.evaluate(() => window.__lagoonAudio[0].dispatchEvent(new Event('ended')));
  expect((await snapshot(page)).audioDelivery).toBe('playing');
  await correct(page); await page.clock.runFor(4000); expect((await snapshot(page)).round).toBe(0);
  expect((await snapshot(page)).evidence.firstResponses[0].independent).toBe(false);
  await page.evaluate(() => { window.__setLagoonHidden(true); window.__lanternEngine.pause(); });
  await expect(page.locator('.lantern-lagoon')).toHaveClass(/is-paused/u);
  const travel = await page.locator('.lantern-traveller').evaluate(async node => {
    const animations = node.getAnimations();
    // CSS pause has a pending animation task until the browser's next paint.
    // Capture its held time after that request settles, then require exact freeze.
    await Promise.all(animations.map(animation => animation.ready));
    return animations.map(animation => ({ time: animation.currentTime, state: animation.playState }));
  });
  expect(travel).toHaveLength(1); expect(travel[0].state).toBe('paused');
  await page.clock.runFor(60000); expect((await snapshot(page)).round).toBe(0);
  expect(await page.locator('.lantern-traveller').evaluate(node => node.getAnimations()[0].currentTime)).toBe(travel[0].time);
  await page.evaluate(() => window.__lanternEngine.resume()); expect((await snapshot(page)).paused).toBe(true);
  await page.evaluate(() => window.__setLagoonHidden(false));
  await expect(page.locator('.lantern-lagoon')).not.toHaveClass(/is-paused/u);
  expect(await page.evaluate(() => window.__lagoonAudio.at(-1).paused)).toBe(false);
  await page.evaluate(() => window.__lagoonAudio.at(-1).dispatchEvent(new Event('ended')));
  await page.clock.runFor(499); expect((await snapshot(page)).round).toBe(0);
  await page.clock.runFor(1); expect((await snapshot(page)).round).toBe(1);
});

const curatedPlans = [...LANTERN_READING_SCENES, ...LANTERN_SUPPORTED_SCENES].map(scene => {
  for (let seed = 1; seed <= 256; seed++) {
    const deck = buildLanternLagoonDeck({ mode: 'together', difficulty: 'hard', taughtCycle: 12, sessionSeed: seed });
    const index = deck.rounds.findIndex(round => round.id === scene.id);
    if (index !== -1) return { scene, seed, index };
  }
  throw new Error(`No seeded real outing contains ${scene.id}`);
});
test('reduced motion removes travel without shortening the whole-sentence dwell', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openWithStoppedClock(page, 'cycle=10&sound=off');
  const sentence = await page.locator('.lantern-sentence').innerText();
  await correct(page); await contained(page);
  expect(await page.locator('.lantern-traveller').evaluate(node => node.getAnimations().length)).toBe(0);
  await page.clock.runFor(2399); expect((await snapshot(page)).round).toBe(0);
  await expect(page.locator('.lantern-sentence')).toHaveText(sentence);
  await page.clock.runFor(1); expect((await snapshot(page)).round).toBe(1);
});
for (const [name, viewport] of Object.entries({ portrait: { width: 320, height: 667 }, landscape: { width: 568, height: 320 }, tablet: { width: 1194, height: 834 } })) {
  for (const { scene, seed, index } of curatedPlans) test(`curated ${scene.id} ${name}: full meaning and all actual targets remain visible`, async ({ page }) => {
    await open(page, `cycle=12&sound=off&mode=together&difficulty=hard&seed=${seed}&start=${index}`, viewport);
    expect((await snapshot(page)).deck.rounds[index].id).toBe(scene.id);
    await contained(page);
    expect(await page.locator('.lantern-sentence').innerText()).toBe((scene.clauses || [scene.sentence]).join('\n'));
    if (scene.band === 4 || scene.id === 'who-duck-under') await page.screenshot({ path: `.artifacts/child-redesign-review/lantern-lagoon-${scene.id}-${name}.png` });
    const state = await snapshot(page), round = state.deck.rounds[index], wrong = round.choices.find(choice => choice.id !== round.answerId);
    await page.locator(`[data-choice-id="${wrong.id}"]`).click();
    await expect(page.locator('.lantern-feedback > p')).toHaveText(`${lanternChoiceDescription(wrong)} Try the message again.`);
    expect(await page.locator('.lantern-sentence').innerText()).toBe((scene.clauses || [scene.sentence]).join('\n'));
    await contained(page);
    if (scene.id === 'duck-two-clauses' && name === 'portrait') await page.screenshot({ path: '.artifacts/child-redesign-review/lantern-lagoon-compound-feedback-portrait.png' });
  });
}

for (const [name, viewport] of Object.entries({ portrait: { width: 320, height: 667 }, landscape: { width: 568, height: 320 } })) {
  for (const sceneId of ['cat-mat', 'duck-two-clauses']) test(`actual GamePlayer ${sceneId} ${name}: shared header and wrong feedback retain every painted choice`, async ({ page }) => {
    const mode = sceneId === 'duck-two-clauses' ? 'together' : 'reading';
    let plan;
    for (let seed = 1; seed <= 256; seed++) {
      const deck = buildLanternLagoonDeck({ mode, difficulty: 'hard', taughtCycle: 12, sessionSeed: seed, journey: { index: 0 } });
      const index = deck.rounds.findIndex(round => round.id === sceneId);
      if (index !== -1) { plan = { deck, seed, index }; break; }
    }
    expect(plan).toBeTruthy();
    // The real host resumes its genuine validated authored state. No scene
    // override or mocked parent layout can bypass GamePlayer geometry here.
    const saved = { deck: plan.deck, seed: plan.seed, journeyIndex: 0, round: plan.index, phase: 'active', attempts: 0, selectedId: null,
      support: [], modelled: false, audioDelivery: 'not_requested', evidence: newLanternEvidence(plan.deck, plan.seed, plan.index), score: 0 };
    await page.addInitScript(({ savedState, index, seed, total }) => {
      localStorage.setItem('literacy-guide-learn-games:fullscreen-overlay-preview', JSON.stringify({ v: 1, games: {
        'lantern-lagoon': { checkpoints: { hard: { level: index, totalLevels: total, sessionSeed: seed, chapter: 0 } } }
      } }));
      localStorage.setItem('literacy-guide-phonics-play:fullscreen-overlay-preview:lantern-lagoon:hard', JSON.stringify({ v: 1, round: index, gameState: savedState }));
    }, { savedState: saved, index: plan.index, seed: plan.seed, total: plan.deck.rounds.length });
    if (sceneId === 'duck-two-clauses') await page.route('**/images/arcade/lantern-lagoon/lantern.webp', route => route.abort());
    await page.setViewportSize(viewport);
    await page.goto('/preview/game-overlay.html?game=lantern-lagoon&difficulty=hard&sound=0&taughtCycle=12');
    await expect(page.getByRole('button', { name: 'Continue', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await expect(page.locator('.lantern-actor')).toHaveCount(3);
    await page.evaluate(() => document.fonts.ready);
    await expect.poll(() => page.evaluate(() => window.__arcadePreviewSnapshot?.()?.deck.rounds[window.__arcadePreviewSnapshot().round]?.id)).toBe(sceneId);
    const state = await page.evaluate(() => window.__arcadePreviewSnapshot()), round = state.deck.rounds[state.round];
    const sentence = await page.locator('.lantern-sentence').innerText();
    await contained(page);
    const wrong = round.choices.find(choice => choice.id !== round.answerId);
    if (sceneId === 'duck-two-clauses') {
      // Either part of the supplied compound meaning selects the same scene.
      // Tapping the companion used to hit a decorative, inert 25px animal.
      const companion = page.locator(`.lantern-island:has([data-choice-id="${wrong.id}"]) .lantern-companion > :is(.lantern-animal-art,.lantern-animal-fallback)`);
      const box = await companion.boundingBox(); expect(box).toBeTruthy();
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    } else await page.locator(`[data-choice-id="${wrong.id}"]`).click();
    await expect(page.locator('.lantern-feedback > p')).toHaveText(`${lanternChoiceDescription(wrong)} Try the message again.`);
    await expect(page.locator('.lantern-sentence')).toHaveText(sentence);
    await contained(page);
    const painted = await page.locator('.lantern-lagoon').evaluate(node => {
      const main = node.closest('.lg-game-player-main').getBoundingClientRect(), frame = node.getBoundingClientRect();
      const world = node.querySelector('.lantern-world').getBoundingClientRect();
      const inside = box => box.left >= Math.max(0, main.left) - .1 && box.right <= Math.min(innerWidth, main.right) + .1
        && box.top >= Math.max(0, main.top) - .1 && box.bottom <= Math.min(innerHeight, main.bottom) + .1;
      const glyphs = [...node.querySelectorAll('.lantern-sentence,.lantern-feedback > p')].flatMap(element => {
        const range = document.createRange(); range.selectNodeContents(element); return [...range.getClientRects()].filter(rect => rect.width > 0);
      });
      return { frameInside: inside(frame), worldInside: inside(world), glyphCount: glyphs.length, glyphsInside: glyphs.every(inside) };
    });
    expect(painted).toEqual({ frameInside: true, worldInside: true, glyphCount: expect.any(Number), glyphsInside: true });
    expect(painted.glyphCount).toBeGreaterThan(0);
    const headerPaint = await headerInk(page);
    expect(headerPaint.glyphCount).toBeGreaterThan(0); expect(headerPaint.measurementsValid).toBe(true); expect(headerPaint.clipped).toEqual([]);
    if (sceneId === 'cat-mat' && name === 'landscape') {
      const previousStyle = await page.locator('.lg-game-title-chip').getAttribute('style');
      await page.locator('.lg-game-title-chip').evaluate(node => { node.style.width = '20px'; });
      expect((await headerInk(page)).clipped.length).toBeGreaterThan(0);
      await page.locator('.lg-game-title-chip').evaluate((node, style) => { if (style === null) node.removeAttribute('style'); else node.setAttribute('style', style); }, previousStyle);
      expect((await headerInk(page)).clipped).toEqual([]);
    }
    if (sceneId === 'duck-two-clauses') await expect(page.locator('.lantern-traveller > .lantern-prop-fallback')).toBeVisible();
    await page.screenshot({ path: `.artifacts/child-redesign-review/lantern-lagoon-actual-${sceneId}-${name}.png` });
  });
}

for (const [name, viewport] of Object.entries({ portrait: { width: 320, height: 667 }, landscape: { width: 568, height: 320 }, tablet: { width: 1194, height: 834 } })) {
  test(`blocked compound art ${name}: both meanings retain complete fallback geometry`, async ({ page }) => {
    await page.route('**/images/arcade/lantern-lagoon/*.webp', route => route.abort());
    const { seed, index } = curatedPlans.find(item => item.scene.id === 'duck-two-clauses');
    await open(page, `cycle=12&sound=off&mode=together&difficulty=hard&seed=${seed}&start=${index}`, viewport);
    await expect(page.locator('.lantern-animal-fallback')).toHaveCount(6);
    await expect(page.locator('.lantern-traveller > .lantern-prop-fallback')).toBeVisible();
    expect(await page.locator('.lantern-lagoon img').count()).toBe(0);
    await contained(page);
    await page.screenshot({ path: `.artifacts/child-redesign-review/lantern-lagoon-compound-fallback-${name}.png` });
  });
}

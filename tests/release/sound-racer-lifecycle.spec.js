import { expect, test } from '@playwright/test';

test.describe.configure({ timeout: 60_000 });
const snapshot = page => page.evaluate(() => window.__SOUND_RACER__.snapshot());
async function diagnosticsInOverlay(page) {
  // Test-only module response enables the existing read-only development
  // snapshot on the actual GamePlayer entry. No runtime mutation commands.
  await page.route('**/src/features/soundRacer/RacerSession.jsx*', async route => {
    const response = await route.fetch();
    const body = (await response.text()).replace('props.diagnostics', "({ seed: 'overlay-lifecycle', fallback: true })");
    await route.fulfill({ response, body });
  });
}
async function hiddenRoundTrip(page) {
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    document.dispatchEvent(new Event('visibilitychange'));
    delete document.hidden;
  });
}
async function assertHeld(page, before) {
  await page.waitForTimeout(250);
  const after = await snapshot(page);
  expect(after.state.paused).toBe(true);
  expect(after.simulation.distance).toBe(before.simulation.distance);
  expect(after.state.index).toBe(before.state.index);
  expect(after.state.evidence).toEqual(before.state.evidence);
}
async function blockedInstructionAndPendingTarget(page) {
  await page.addInitScript(() => {
    window.__racerTestMedia = [];
    const observed = new Set();
    window.__racerEndedCallbacks = [];
    const addListener = HTMLMediaElement.prototype.addEventListener;
    HTMLMediaElement.prototype.addEventListener = function(type, listener, options) {
      if (type === 'ended') window.__racerEndedCallbacks.push(listener);
      return addListener.call(this, type, listener, options);
    };
    Object.defineProperty(HTMLMediaElement.prototype, 'readyState', { configurable: true, get: () => 4 });
    HTMLMediaElement.prototype.play = function play() {
      if (!observed.has(this)) { observed.add(this); window.__racerTestMedia.push({ audio: this, active: false, plays: 0, pauses: 0 }); }
      const item = window.__racerTestMedia.find(entry => entry.audio === this);
      item.plays += 1;
      if (this.src.includes('choose-road.mp3')) throw new DOMException('Blocked instruction', 'NotAllowedError');
      item.active = true;
      return new Promise(() => {});
    };
    HTMLMediaElement.prototype.pause = function pause() {
      const item = window.__racerTestMedia.find(entry => entry.audio === this);
      if (item) { item.active = false; item.pauses += 1; }
    };
  });
}

for (const overlay of ['quit', 'guide']) {
  test(`GamePlayer ${overlay} keeps ownership through visibility return and local resume`, async ({ page }) => {
    await diagnosticsInOverlay(page);
    await page.addInitScript(() => localStorage.setItem('lp-arcade-onboarded-v1:sound-racer', '1'));
    await page.goto('/preview/game-overlay.html?game=sound-racer&sound=0&music=0');
    await expect.poll(() => page.evaluate(() => Boolean(window.__SOUND_RACER__))).toBe(true);
    if (await page.getByRole('button', { name: 'Tap to play', exact: true }).isVisible()) await page.getByRole('button', { name: 'Tap to play', exact: true }).click();
    if (overlay === 'quit') await page.getByRole('button', { name: 'Pause driving', exact: true }).click();
    if (overlay === 'quit') await page.keyboard.press('Escape');
    else await page.getByRole('button', { name: 'Open Sound Racer mission guide', exact: true }).click();
    const dialog = overlay === 'quit' ? page.getByRole('alertdialog') : page.getByRole('dialog', { name: 'Sound Racer mission guide', exact: true });
    await expect(dialog).toBeVisible();
    const held = await snapshot(page);
    await hiddenRoundTrip(page);
    await assertHeld(page, held);
    await dialog.getByRole('button', { name: 'Keep playing', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Rally paused', exact: true })).toBeVisible();
    await assertHeld(page, held);
    await page.getByRole('button', { name: 'Keep driving', exact: true }).click();
    await expect.poll(async () => (await snapshot(page)).state.paused).toBe(false);
  });
}

test('synchronously blocked instruction hands off one target whose playback cancels on pause', async ({ page }) => {
  await blockedInstructionAndPendingTarget(page);
  await page.goto('/preview/sound-racer-preview.html?difficulty=easy&sound=1&music=0&fallback=1&seed=blocked-instruction');
  await page.getByRole('button', { name: 'Tap to play', exact: true }).click();
  await expect.poll(async () => (await snapshot(page)).state.cue.id).not.toBeNull();
  const playback = await page.evaluate(() => window.__racerTestMedia.map(({ audio, active, plays }) => ({ src: audio.src, active, plays })));
  expect(playback.filter(item => item.src.includes('choose-road.mp3'))).toHaveLength(1);
  expect(playback.filter(item => item.active)).toHaveLength(1);
  const before = await snapshot(page);
  await page.getByRole('button', { name: 'Pause driving', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__racerTestMedia.some(item => item.active))).toBe(false);
  await page.evaluate(() => window.__racerTestMedia.forEach(({ audio }) => audio.dispatchEvent(new Event('ended'))));
  await hiddenRoundTrip(page);
  const after = await snapshot(page);
  expect(after.state.paused).toBe(true);
  expect(after.state.evidence).toEqual(before.state.evidence);
  expect(after.state.cue.status).toBe('interrupted');
});

test('learner scope remount cancels pending voice and rejects its delayed completion', async ({ page }) => {
  await blockedInstructionAndPendingTarget(page);
  await page.route('**/src/sound-racer-preview.jsx*', async route => {
    const original = await route.fetch();
    const source = await original.text();
    const reactUrl = source.match(/["'](\/node_modules\/\.vite\/deps\/react\.js[^"']*)/)[1];
    const domUrl = source.match(/["'](\/node_modules\/\.vite\/deps\/react-dom_client\.js[^"']*)/)[1];
    await route.fulfill({ contentType: 'application/javascript', body: `
    import React from '${reactUrl}';
    import ReactDOM from '${domUrl}';
    import SoundRacerGame from '/src/components/learn/games/games/SoundRacerGame.jsx';
    import '/src/styles/learn-games.css';
    function Fixture(){const [scope,setScope]=React.useState('learner-a');return React.createElement('div',{style:{width:'100vw',height:'100vh'}},
      React.createElement('button',{style:{position:'fixed',top:0,right:0,zIndex:9999},onClick:()=>setScope('learner-b')},'Switch learner'),
      React.createElement(SoundRacerGame,{progressScopeKey:scope,difficulty:'easy',startLevel:0,isSoundEnabled:true,diagnostics:{seed:'learner-remount',fallback:true}}));}
    ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(Fixture));
  ` });
  });
  await page.goto('/preview/sound-racer-preview.html');
  await page.getByRole('button', { name: 'Tap to play', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__racerTestMedia.some(item => item.active))).toBe(true);
  await page.evaluate(() => { window.__racerOldMedia = window.__racerTestMedia.filter(item => item.active).map(item => ({ audio: item.audio, pauses: item.pauses })); window.__racerOldEnded = [...window.__racerEndedCallbacks]; });
  await page.getByRole('button', { name: 'Switch learner', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__racerOldMedia.every(old => window.__racerTestMedia.find(item => item.audio === old.audio)?.pauses > old.pauses))).toBe(true);
  const before = await snapshot(page);
  await page.evaluate(() => window.__racerOldEnded.forEach(callback => callback(new Event('ended'))));
  const after = await snapshot(page);
  expect(after.state.evidence).toEqual([]);
  expect(after.state.cue).toEqual(before.state.cue);
  expect(after.state.index).toBe(0);
});

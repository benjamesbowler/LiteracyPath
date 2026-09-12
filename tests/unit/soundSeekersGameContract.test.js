import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { CAST } from '../../src/features/soundSeekers/v3/content/cast.js';
import { createProgress } from '../../src/features/soundSeekers/v3/engine/progress.js';

let SoundSeekersCampaign, storage, vite;
const originalWindow = globalThis.window;
const values = new Map();
test.before(async () => {
  globalThis.window = { localStorage: { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) }, addEventListener() {}, removeEventListener() {} };
  vite = await createServer({ appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } });
  ({ default: SoundSeekersCampaign } = await vite.ssrLoadModule('/src/features/soundSeekers/v3/SoundSeekersCampaign.jsx'));
  storage = await vite.ssrLoadModule('/src/features/soundSeekers/v3/campaignStorage.js');
});
test.after(async () => { await vite?.close(); if (originalWindow === undefined) delete globalThis.window; else globalThis.window = originalWindow; });
function renderGame(progress, scope) {
  values.set(storage.campaignStorageKey(scope), JSON.stringify(progress));
  return renderToStaticMarkup(React.createElement(SoundSeekersCampaign, { progressScopeKey: scope, isSoundEnabled: false, onExit() {}, accessibilitySettings: {} }));
}

test('current campaign presents eight canonical playable Pals in one accessible chooser', () => {
  const html = renderGame(createProgress(), 'contract-hero');
  assert.match(html, /data-sound-seekers-game/);
  assert.match(html, /aria-label="Sound Seekers adventure"/);
  assert.match(html, /Who will you be\?/);
  assert.match(html, /role="dialog" aria-modal="true" aria-label="Choose your Pal"/);
  const chooser = html.split('class="ss-hero-grid"')[1].split('</section>')[0];
  assert.equal((chooser.match(/<button/g) || []).length, 8);
  for (const id of ['speedy','bouncy','woolly','splashy','clucky','muddy','chompy','pip']) assert.ok(chooser.includes(CAST[id].name), id);
  assert.match(html, /<canvas inert=""/);
  assert.doesNotMatch(html, /aria-label="Movement"/);
});

test('current campaign hub exposes movement, map, pause and accessible object actions', () => {
  const html = renderGame({ ...createProgress(), heroChosen: true }, 'contract-hub');
  assert.match(html, /data-sound-seekers-game/);
  assert.match(html, /Hollow Tree/);
  assert.match(html, /Sunny Meadow Farm/);
  for (const label of ['World map','Pause adventure','Movement','Move left','Move right','Jump','Interact with nearby object']) assert.ok(html.includes(`aria-label="${label}"`), label);
  assert.match(html, /aria-label="Adventure help"/);
  assert.match(html, /aria-label="Movement stick"/);
  assert.match(html, /role="status" aria-live="polite"/);
  assert.doesNotMatch(html, /role="dialog"/);
  assert.doesNotMatch(html, /<canvas inert/);
});

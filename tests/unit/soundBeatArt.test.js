import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { SOUND_BEAT_ART } from '../../src/components/learn/games/games/soundBeatArtData.js';
import { SOUND_BEAT_POSES } from '../../src/components/learn/games/games/soundBeatPerformanceArt.js';
import { createSoundBeatWorld } from '../../src/components/learn/games/games/soundBeatWorld.js';
import { withRepairedImageVersion } from '../../src/utils/repairedImageVersion.js';
const digest = path => crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
const manifest = JSON.parse(fs.readFileSync('source-art/arcade/physical-worlds/sound-beat/scene-kit-clean-cartoon.json'));

test('current musical authority seals history, exact measured pose selection, and author-filtered runtime', () => {
  for (const lineage of [manifest.historicalManifest, manifest.historicalRegistration, manifest.registration]) assert.equal(digest(lineage.path), lineage.sha256);
  const registration = JSON.parse(fs.readFileSync(manifest.registration.path));
  assert.deepEqual(SOUND_BEAT_POSES, registration.currentPoseSelection);
  for (const [id, spec] of Object.entries(registration.currentSources)) for (const [key, value] of Object.entries(spec)) assert.deepEqual(manifest.assets[id][key], value);
  const authorOnly = new Set(['packing', 'generation', 'supersedes', 'originalOutput', 'references']);
  assert.deepEqual(SOUND_BEAT_ART, Object.fromEntries(Object.entries(manifest.assets).filter(([, a]) => !a.sourceOnly).map(([id, a]) =>
    [id, Object.fromEntries(Object.entries(a).filter(([key]) => !authorOnly.has(key)))])));
  assert.ok(!JSON.stringify(SOUND_BEAT_ART).includes('/Users/'));
});

test('whole current performers retain actual opaque native and delivered contacts, with hidden grips explicitly unselected', async () => {
  for (const [id, asset] of Object.entries(manifest.assets)) {
    assert.equal(digest(asset.source), asset.sourceSha256);
    if (asset.sourceOnly) continue;
    assert.equal(digest(`public${asset.runtime}`), asset.runtimeSha256);
    const { data, info } = await sharp(`public${asset.runtime}`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    assert.deepEqual([info.width, info.height], [asset.width, asset.height]);
    const alpha = point => data[(Math.round(point[1]) * info.width + Math.round(point[0])) * 4 + 3];
    for (const frame of asset.frames || []) {
      for (const point of Object.values(frame.sockets || {})) assert.ok(alpha(point) >= 192);
      for (const key of ['leftHandPixel', 'rightHandPixel', 'membraneCentre']) if (frame[key]) assert.ok(alpha(frame[key]) >= 192);
    }
    if (!asset.generation?.packingRecipes) continue;
    assert.equal(digest(asset.generation.acceptedNativeSource), asset.generation.acceptedNativeSHA);
    assert.equal(asset.packing.wholeGeneratedBodiesRetained, true);
    assert.equal(asset.frames.length, id.includes('performance') ? 16 : 12);
    const { data: native, info: ni } = await sharp(asset.generation.acceptedNativeSource).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    for (const recipe of asset.generation.packingRecipes) for (const point of Object.values(recipe.nativeAnatomicalContacts || {})) assert.ok(native[(point[1] * ni.width + point[0]) * 4 + 3] >= 192);
    if (id.includes('performance')) {
      const poses = SOUND_BEAT_POSES[id.split('-')[0]], selected = new Set([poses.ready, ...Object.values(poses.contact), ...Object.values(poses.preparation).flat(), ...poses.recovery, ...poses.finale]);
      for (const frame of asset.frames) {
        assert.ok(frame.bounds[0] >= 38 && frame.bounds[1] >= 38 && frame.bounds[2] <= 346 && frame.bounds[3] <= 346);
        if (frame.excluded) { assert.ok(!selected.has(frame.id)); assert.equal(frame.leftHandPixel, undefined); assert.equal(frame.rightHandPixel, undefined); }
      }
    }
  }
});

test('all four native input lanes meet actual painted drum membrane landmarks during compression in each world', async t => {
  const previous = globalThis.Image; t.after(() => { globalThis.Image = previous; });
  globalThis.Image = class {
    set src(url) {
      if (!url) return;
      const asset = Object.values(SOUND_BEAT_ART).find(a => withRepairedImageVersion(a.runtime) === url);
      assert.ok(asset); this.url = url; this.naturalWidth = asset.width; this.naturalHeight = asset.height;
      queueMicrotask(() => this.onload?.());
    }
    decode() { return Promise.resolve(); }
  };
  for (const [row, world] of ['meadow', 'dino', 'moonwood'].entries()) {
    const bank = createSoundBeatWorld(world);
    for (let turn = 0; turn < 12; turn++) await Promise.resolve();
    try {
      for (const [width, height] of [[1040, 740], [390, 650]]) for (let lane = 0; lane < 4; lane++) {
        const draws = [], ctx = new Proxy({ drawImage: (...args) => draws.push(args) }, { get: (target, key) => target[key] ?? (() => {}) });
        bank.draw(ctx, { stage: 0, roundBpm: 90, level: { bpm: 90 }, noteStart: 10, beatIndex: 0,
          currentTask: { item: { lanes: [lane] } }, lastPadEvent: { lane, at: 10 }, lastMissAt: -99,
          phraseActionAt: null, roundStartAt: 0, musicEnabled: false }, width, height, 10, false);
        const scene = bank.inspect(), contact = scene.contacts.find(c => c.contact);
        assert.ok(contact); assert.ok(contact.separation < 1e-8);
        const frame = SOUND_BEAT_ART['instrument-kit-v1'].frames[row * 4], [left, top, right, bottom] = frame.cell;
        const centres = draws.filter(args => args.length === 9 && args[0].url === withRepairedImageVersion(SOUND_BEAT_ART['instrument-kit-v1'].runtime)
          && args.slice(1, 5).every((value, i) => Math.abs(value - [left, top, right - left, bottom - top][i]) < 1e-6))
          .map(args => ({ x: args[5] + (frame.membraneCentre[0] - left) / (right - left) * args[7],
            y: args[6] + (frame.membraneCentre[1] - top) / (bottom - top) * args[8] }));
        assert.ok(centres.some(p => Math.hypot(p.x - contact.tip.x, p.y - contact.tip.y) < 1e-6), `${world}/${lane} source membrane meets the live tip`);
      }
    } finally { bank.dispose(); }
  }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { collectQuestionMedia } from '../../src/utils/preloadQuestionMedia.js';

test('picture warmup covers changing words, sorting objects and compound parts', () => {
  const media = collectQuestionMedia({
    image: '/target.webp', beforeImage: '/before.webp',
    choices: [{ image: '/choice.webp', audio: '/choice.mp3' }],
    objects: [{ image: '/sort.webp', audio: '/sort.mp3' }],
    parts: [{ image: '/part.webp', audio: '/part.mp3' }],
  });
  assert.deepEqual(new Set(media.images), new Set(['/target.webp', '/before.webp', '/choice.webp', '/sort.webp', '/part.webp']));
  assert.deepEqual(new Set(media.audio), new Set(['/choice.mp3', '/sort.mp3', '/part.mp3']));
});

async function withImages(run) {
  const originalImage = globalThis.Image;
  const images = [];
  class ImageDouble {
    constructor() { images.push(this); }
    decode() { return Promise.resolve(); }
  }
  globalThis.Image = ImageDouble;
  const module = await import(`../../src/utils/preloadMedia.js?images=${Date.now()}-${Math.random()}`);
  try { await run({ ...module, images }); }
  finally { globalThis.Image = originalImage; }
}

test('a failed picture warmup can retry instead of caching failure for the whole session', () => withImages(async ({ preloadImage, images }) => {
  const failed = preloadImage('/retry.webp');
  images[0].onerror();
  assert.equal(await failed, false);
  const retry = preloadImage('/retry.webp');
  assert.equal(images.length, 2);
  images[1].onload();
  assert.equal(await retry, true);
  assert.equal(await preloadImage('/retry.webp'), true);
  assert.equal(images.length, 2);
}));

test('one stalled picture cannot leave a warmup pending forever', () => withImages(async ({ preloadImage, images }) => {
  const result = await preloadImage('/stalled.webp', { timeoutMs: 10 });
  assert.equal(result, false);
  assert.equal(images[0].onload, null);
  assert.equal(images[0].onerror, null);
  const retry = preloadImage('/stalled.webp');
  images[1].onload();
  assert.equal(await retry, true);
}));

test('ready pictures stay decoded only in a bounded recent window', () => withImages(async ({ preloadImage, images }) => {
  for (let index = 0; index < 100; index += 1) {
    const ready = preloadImage(`/image-${index}.webp`);
    images.at(-1).onload();
    assert.equal(await ready, true);
  }
  const retry = preloadImage('/image-0.webp');
  assert.equal(images.length, 101);
  images.at(-1).onload();
  assert.equal(await retry, true);
}));

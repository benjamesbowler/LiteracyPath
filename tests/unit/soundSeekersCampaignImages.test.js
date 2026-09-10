import test from 'node:test';
import assert from 'node:assert/strict';
import { preload, imageState, retryFailedImages } from '../../src/features/soundSeekers/v3/render/sprites.js';

test('picture recovery retries failed exact assets while preserving successfully loaded pictures', async () => {
  const original = globalThis.Image;
  const calls = [];
  let fail = true;
  globalThis.Image = class {
    set src(value) {
      calls.push(value);
      queueMicrotask(() => value === '/retry-target.png' && fail ? this.onerror() : this.onload());
    }
  };
  try {
    await preload(['/retry-target.png', '/ready-world.png']);
    assert.equal(imageState('/retry-target.png'), 'failed');
    assert.equal(imageState('/ready-world.png'), 'ready');
    fail = false;
    retryFailedImages(['/retry-target.png', '/ready-world.png']);
    const images = await preload(['/retry-target.png', '/ready-world.png']);
    assert.equal(images.every(Boolean), true);
    assert.deepEqual(calls, ['/retry-target.png', '/ready-world.png', '/retry-target.png']);
  } finally { globalThis.Image = original; }
});

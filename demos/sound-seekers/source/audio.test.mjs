import test from 'node:test';
import assert from 'node:assert/strict';
import { createAudio } from '../src/audio.js';

class FakeAudioContext {
  state = 'running';
  sampleRate = 44100;
  destination = {};
  createGain() { return { gain: { value: 1 }, connect() {}, disconnect() {} }; }
  createBuffer() { return { duration: 0.01, length: 441 }; }
  createBufferSource() {
    return {
      connect() {}, disconnect() {}, stop() {},
      start() { queueMicrotask(() => this.onended?.()); },
    };
  }
  async decodeAudioData(bytes) {
    if (new Uint8Array(bytes)[0] !== 1) throw new Error('Cached HTML is not audio.');
    return this.createBuffer();
  }
  async close() { this.state = 'closed'; }
}

for (const failure of ['HTTP error', 'cached HTML fallback']) {
  test(`replay fetches a restored recording after ${failure}`, async () => {
    const requests = [], errors = [];
    const audio = createAudio({
      catalog: { instruction: '/assets/audio/chapter/instruction.mp3' },
      AudioContextClass: FakeAudioContext,
      onError: error => errors.push(error.code),
      fetcher: async (path, options) => {
        requests.push({ path, cache: options.cache });
        const restored = requests.length > 1;
        return {
          ok: restored || failure === 'cached HTML fallback',
          status: restored ? 200 : 404,
          arrayBuffer: async () => new Uint8Array([restored ? 1 : 0]).buffer,
        };
      },
    });
    try {
      assert.equal(await audio.unlock(), true);
      assert.equal(await audio.play('instruction'), false);
      assert.deepEqual(errors, ['media-unavailable']);
      assert.equal(await audio.play('instruction'), true);
      assert.equal(await audio.play('instruction'), true);
      assert.deepEqual(requests.map(request => request.cache), ['force-cache', 'reload']);
    } finally { audio.dispose(); }
  });
}

test('a long campaign bounds decoded audio while keeping recently used clips and complete sequences', async () => {
  const requests = [];
  const catalog = Object.fromEntries(Array.from({ length: 12 }, (_, i) => [`clip-${i}`, `/audio/sound-seekers/campaign/clip-${i}.mp3`]));
  const owner = createAudio({ catalog, AudioContextClass: FakeAudioContext, maxDecodedClips: 8,
    fetcher: async path => { requests.push(path); return { ok: true, arrayBuffer: async () => new Uint8Array([1]).buffer }; } });
  try {
    await owner.unlock();
    assert.equal(await owner.sequence(Object.keys(catalog).slice(0, 8)), true);
    assert.equal(await owner.play('clip-0'), true, 'touch the oldest clip before loading a new one');
    assert.equal(await owner.play('clip-8'), true);
    assert.equal(await owner.play('clip-0'), true, 'recently heard clip stays decoded');
    assert.equal(requests.filter(path => path === catalog['clip-0']).length, 1);
    assert.equal(await owner.play('clip-1'), true);
    assert.equal(requests.filter(path => path === catalog['clip-1']).length, 2, 'least recently used clip is fetched again');
    assert.equal(await owner.sequence(Object.keys(catalog)), true, 'eviction cannot truncate an already loaded sequence');
  } finally { owner.dispose(); }
});

test('cancelling a pending recording never reports that it was heard', async () => {
  let deliver;
  const owner = createAudio({ catalog: { slow: '/audio/sound-seekers/campaign/slow.mp3' }, AudioContextClass: FakeAudioContext,
    fetcher: () => new Promise(resolve => { deliver = resolve; }) });
  try {
    await owner.unlock();
    const playing = owner.play('slow');
    owner.stop();
    assert.equal(await playing, false);
    deliver({ ok: true, arrayBuffer: async () => new Uint8Array([1]).buffer });
    assert.equal(await owner.play('slow'), true, 'a deliberate new replay can use the delivered recording');
    owner.setMuted(true);
    assert.equal(await owner.play('slow'), false);
  } finally { owner.dispose(); }
});

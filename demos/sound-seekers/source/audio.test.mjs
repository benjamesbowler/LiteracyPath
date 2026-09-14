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

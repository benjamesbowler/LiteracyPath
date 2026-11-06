import test from 'node:test';
import assert from 'node:assert/strict';
import { mockSpeechBounds, mockSpeechWav, prepareMockAudio } from '../../src/utils/mockAudioPreparation.js';

const buffer = channels => ({ numberOfChannels: channels.length, length: channels[0].length,
  sampleRate: 1000, getChannelData: i => channels[i] });

test('outer silence is removed while quiet consonants and internal speech pauses remain', async () => {
  const samples = new Float32Array(6000);
  samples.fill(0.002, 2000, 2100); // a quiet consonant, above -60 dB
  samples.fill(0.7, 2200, 2500);
  samples.fill(-0.2, 3500, 4000); // preserve the internal one-second pause
  const speech = buffer([samples]);
  assert.deepEqual(mockSpeechBounds(speech), { start: 1985, end: 4030 });
  const wav = new DataView(await mockSpeechWav(speech).arrayBuffer());
  assert.equal(wav.getUint32(40, true), 2045 * 2);
  assert.equal(wav.getInt16(44 + 15 * 2, true), 66);
  assert.equal(wav.getInt16(44 + (3000 - 1985) * 2, true), 0);
  assert.equal(wav.getInt16(44 + (3500 - 1985) * 2, true), -6554);
});

test('sound in either stereo channel counts and a fully silent recording fails closed', () => {
  const left = new Float32Array(1000), right = new Float32Array(1000);
  right[500] = 0.1;
  assert.deepEqual(mockSpeechBounds(buffer([left, right])), { start: 485, end: 531 });
  assert.throws(() => mockSpeechBounds(buffer([left])), /no audible sound/);
});

test('speech reaching clip boundaries is preserved without extending the buffer', () => {
  assert.deepEqual(mockSpeechBounds(buffer([new Float32Array([0.4, -0.3])])), { start: 0, end: 2 });
});

test('preparation resolves offline sources once, reports failed media and releases every temporary URL', async t => {
  const original = { fetch: globalThis.fetch, OfflineAudioContext: globalThis.OfflineAudioContext };
  const resolved = [], revoked = [], signal = [];
  const originalCreate = URL.createObjectURL, originalRevoke = URL.revokeObjectURL;
  globalThis.OfflineAudioContext = class { async decodeAudioData() { return buffer([new Float32Array([0.2, 0.3])]); } };
  globalThis.fetch = async (path, options) => { resolved.push(path); signal.push(options.signal); return {
    ok: path !== 'offline:/broken', status: 404, arrayBuffer: async () => new ArrayBuffer(1) }; };
  URL.createObjectURL = () => 'blob:test-prepared'; URL.revokeObjectURL = url => revoked.push(url);
  t.after(() => { Object.assign(globalThis, original); URL.createObjectURL = originalCreate; URL.revokeObjectURL = originalRevoke; });
  const preparation = prepareMockAudio([{ path: '/word' }, { path: '/word' }, { path: '/broken' }], path => `offline:${path}`);
  const sources = await preparation.ready;
  assert.deepEqual(resolved, ['offline:/word', 'offline:/broken']);
  assert.equal(sources.get('/word').src, 'blob:test-prepared#%2Fword');
  assert.ok(sources.get('/broken').error);
  preparation.dispose(); preparation.dispose();
  assert.deepEqual(revoked, ['blob:test-prepared']);
  assert.ok(signal.every(value => value.aborted));
});

test('offline audio is decoded from retained bytes without a CSP-blocked blob fetch', async t => {
  const original = { fetch: globalThis.fetch, OfflineAudioContext: globalThis.OfflineAudioContext };
  let decoded = false;
  globalThis.fetch = async () => { throw new Error('No network/blob fetch is allowed'); };
  globalThis.OfflineAudioContext = class { async decodeAudioData(bytes) { decoded = bytes.byteLength === 3; return buffer([new Float32Array([0.2])]); } };
  t.after(() => Object.assign(globalThis, original));
  const resolve = () => 'blob:cached-audio';
  resolve.readBlob = () => new Blob([new Uint8Array([1, 2, 3])]);
  const preparation = prepareMockAudio([{ path: '/cached.mp3' }], resolve);
  const sources = await preparation.ready;
  assert.equal(decoded, true); assert.ok(sources.get('/cached.mp3').src.startsWith('blob:'));
  preparation.dispose();
});

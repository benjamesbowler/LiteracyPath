#!/usr/bin/env node
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { COMPREHENSION_PASSAGES } from '../src/content/comprehension/passages.js';
import { comprehensionNarrationRecords } from './generateComprehensionLedaAudio.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(await readFile(path.join(root, 'src/content/comprehension/audioManifest.generated.json'), 'utf8'));
const records = comprehensionNarrationRecords(COMPREHENSION_PASSAGES);
assert.equal(manifest.clips.length, records.length);
const results = [];
const pacingOutliers = [];
for (const record of records) {
  const clip = manifest.clips.find(item => item.text === record.text);
  assert.ok(clip, `Missing current text: ${record.references[0].sourceId}`);
  assert.equal(clip.audioPath, record.audioPath);
  const filename = path.join(root, 'public', clip.audioPath);
  assert.equal(createHash('sha256').update(await readFile(filename)).digest('hex'), clip.audioSha256);
  // Decode every sample, including the ending, so damaged/truncated MP3 frames fail.
  const pcm = execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-xerror', '-i', filename, '-f', 'f32le', '-ac', '1', '-ar', '24000', 'pipe:1'], { maxBuffer: 32 * 1024 * 1024 });
  const count = pcm.length / 4;
  const threshold = 10 ** (-55 / 20);
  let peak = 0, square = 0, active = 0, first = -1, quiet = 0, maxQuiet = 0, pauses = 0;
  for (let i = 0; i < count; i += 1) {
    const value = Math.abs(pcm.readFloatLE(i * 4));
    assert.ok(Number.isFinite(value), 'Non-finite decoded sample');
    peak = Math.max(peak, value); square += value * value;
    if (value > threshold) {
      if (first < 0) first = i;
      active += 1;
      if (quiet >= 0.3 * 24000 && first !== i) pauses += 1;
      maxQuiet = Math.max(maxQuiet, quiet); quiet = 0;
    } else quiet += 1;
  }
  const duration = count / 24000;
  const rmsDb = 20 * Math.log10(Math.sqrt(square / count));
  // Provider room-tone tails can exceed the individual-sample activity floor.
  // Measure speech boundaries using 20ms RMS envelopes, rather than treating a
  // single quiet codec/noise sample as a clipped spoken phoneme.
  let firstSpeechFrame = -1, lastSpeechFrame = -1;
  const frameSamples = 480;
  for (let offset = 0; offset < count; offset += frameSamples) {
    let energy = 0;
    const length = Math.min(frameSamples, count - offset);
    for (let i = offset; i < offset + length; i += 1) energy += pcm.readFloatLE(i * 4) ** 2;
    if (20 * Math.log10(Math.sqrt(energy / length)) > -45) {
      if (firstSpeechFrame < 0) firstSpeechFrame = offset;
      lastSpeechFrame = offset + length;
    }
  }
  const leadingSilence = firstSpeechFrame / 24000, trailingSilence = (count - lastSpeechFrame) / 24000;
  const words = record.text.match(/\b[\w']+\b/g).length;
  const wordsPerMinute = words / ((duration - (record.segments.length - 1) * 0.45) / 60);
  assert.ok(first >= 0 && duration > 0.2, `${clip.audioPath}: silent or too short`);
  assert.ok(peak > 0.03 && peak < 0.99, `${clip.audioPath}: inaudible peak or clipping (${peak})`);
  assert.ok(rmsDb > -36 && rmsDb < -15, `${clip.audioPath}: abnormal average signal (${rmsDb}dB)`);
  assert.ok(active / count > 0.12, `${clip.audioPath}: too little speech signal`);
  assert.ok(leadingSilence < 2 && trailingSilence >= 0.015 && trailingSilence < 2, `${clip.audioPath}: onset/end padding inconsistent with intact speech`);
  assert.ok(maxQuiet / 24000 < 2.5, `${clip.audioPath}: excessive internal silence`);
  assert.ok(pauses >= record.segments.length - 1, `${clip.audioPath}: missing question/option pause`);
  // Words/minute is unstable for one-word answers and the two-word labels;
  // use it for complete phrases, alongside every clip's full signal envelope.
  if (words >= 6 && !(wordsPerMinute > 60 && wordsPerMinute < 300)) pacingOutliers.push({ text: record.text, audioPath: clip.audioPath, wordsPerMinute });
  results.push({ audioPath: clip.audioPath, duration, rmsDb, peak, activeFraction: active / count, leadingSilence, trailingSilence, pauses, wordsPerMinute });
  if (results.length % 100 === 0) console.log(`Decoded comprehension Leda ${results.length}/${records.length}`);
}
const receipt = { generatedAt: new Date().toISOString(), passages: COMPREHENSION_PASSAGES.length, checkedClips: results.length,
  evidence: 'Full MP3 decode, source/byte hashes, complete-signal envelope, pauses, clipping and duration checks. No human listening or semantic transcription claim.', results };
await mkdir(path.join(root, '.artifacts/comprehension'), { recursive: true });
if (pacingOutliers.length) {
  await writeFile(path.join(root, '.artifacts/comprehension/leda-audio-pacing.json'), JSON.stringify(pacingOutliers, null, 2) + '\n');
  console.log(JSON.stringify({ pacingOutliers }, null, 2));
  throw new Error(`${pacingOutliers.length} comprehension clips have inconsistent narration pace`);
}
await writeFile(path.join(root, '.artifacts/comprehension/leda-audio-signal.json'), JSON.stringify(receipt, null, 2) + '\n');
console.log(JSON.stringify({ passages: receipt.passages, checkedClips: receipt.checkedClips, totalSeconds: results.reduce((sum, item) => sum + item.duration, 0) }, null, 2));

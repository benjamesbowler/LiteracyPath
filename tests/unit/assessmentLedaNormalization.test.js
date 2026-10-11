import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { assessmentLedaDeliveryBitrate, normalizeAssessmentLedaMp3 } from '../../tools/assessmentLedaNormalization.mjs';

const audioToolsAvailable = ['ffmpeg', 'ffprobe'].every(command => spawnSync(command, ['-version'], { stdio: 'ignore' }).status === 0);
const run = args => {
  const result = spawnSync('ffmpeg', ['-hide_banner', '-nostats', ...args], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  return result;
};

test('delivery budgeting preserves short-clip quality and refuses to cut speech to fit', () => {
  assert.equal(assessmentLedaDeliveryBitrate(1, '128k', 350 * 1024), '128k');
  assert.equal(assessmentLedaDeliveryBitrate(23, '128k', 350 * 1024), '112k');
  assert.equal(assessmentLedaDeliveryBitrate(26, '128k', 350 * 1024), '96k');
  assert.equal(assessmentLedaDeliveryBitrate(26, '48k', 350 * 1024), '48k');
  assert.equal(assessmentLedaDeliveryBitrate(26, '128k'), '128k');
  assert.throws(() => assessmentLedaDeliveryBitrate(70, '128k', 350 * 1024), /cannot fit/);
  assert.throws(() => assessmentLedaDeliveryBitrate(0, '128k', 350 * 1024), /Invalid/);
});

test('a long recording fits the delivery budget while retaining every decoded sample', { skip: !audioToolsAvailable }, () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'leda-size-normalization-'));
  try {
    const input = path.join(directory, 'input.wav');
    const output = path.join(directory, 'output.mp3');
    run(['-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=44100:duration=26', '-c:a', 'pcm_s16le', input]);
    normalizeAssessmentLedaMp3(input, output, { maxBytes: 350 * 1024 });
    assert.ok(fs.statSync(output).size <= 350 * 1024);
    const decoded = spawnSync('ffmpeg', ['-v', 'error', '-i', output, '-ar', '44100', '-ac', '1', '-f', 's16le', '-'], { maxBuffer: 8 * 1024 * 1024 });
    assert.equal(decoded.status, 0, String(decoded.stderr));
    assert.equal(decoded.stdout.length / 2, 26 * 44100);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('sub-400ms audio reaches the existing loudness target without keeping measurement silence or losing duration', { skip: !audioToolsAvailable }, () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'leda-short-normalization-'));
  try {
    for (const [sampleRate, samples] of [[44100, 8820], [44100, 14000], [44100, 17611], [24000, 9584], [24000, 9560]]) {
      const input = path.join(directory, `${sampleRate}-${samples}.wav`);
      const output = path.join(directory, `${sampleRate}-${samples}.mp3`);
      run(['-f', 'lavfi', '-i', `sine=frequency=440:sample_rate=${sampleRate}`, '-af', `volume=4,atrim=end_sample=${samples}`, '-c:a', 'pcm_s16le', input]);
      normalizeAssessmentLedaMp3(input, output);
      const decoded = spawnSync('ffmpeg', ['-v', 'error', '-i', output, '-ar', '44100', '-ac', '1', '-f', 'f32le', '-']);
      assert.equal(decoded.status, 0, String(decoded.stderr));
      assert.equal(decoded.stdout.length / 4, Math.round(samples * 44100 / sampleRate), 'measurement padding must not alter delivered duration');
      const measured = run(['-i', output, '-af', 'apad=whole_dur=0.4,loudnorm=I=-24:TP=-2:LRA=7:print_format=json', '-f', 'null', '-']);
      const loudness = JSON.parse(measured.stderr.match(/\{\s*"input_i"[\s\S]*?\}/)[0]);
      // Keep normal MP3 encoding tolerance around the existing -24 target;
      // a provider-level short clip near -15 must not pass unchanged.
      assert.ok(Math.abs(Number(loudness.input_i) - (-24)) < 1, JSON.stringify(loudness));
      assert.ok(Number(loudness.input_tp) <= -2, 'retain the existing true-peak ceiling');
    }
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('normal-length audio retains the existing normalization, onset trim, fades, and bitrate', { skip: !audioToolsAvailable }, () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'leda-normal-normalization-'));
  try {
    const input = path.join(directory, 'input.wav');
    const actual = path.join(directory, 'actual.mp3');
    const expected = path.join(directory, 'expected.mp3');
    run(['-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=24000:duration=1', '-c:a', 'pcm_s16le', input]);
    normalizeAssessmentLedaMp3(input, actual, { startSeconds: 0.1, bitrate: '48k' });
    run(['-i', input, '-af', 'highpass=f=60,loudnorm=I=-24:TP=-2:LRA=7,atrim=start=0.1000,asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.015,areverse,afade=t=in:st=0:d=0.025,areverse',
      '-ar', '44100', '-ac', '1', '-codec:a', 'libmp3lame', '-b:a', '48k', expected]);
    assert.deepEqual(fs.readFileSync(actual), fs.readFileSync(expected));
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

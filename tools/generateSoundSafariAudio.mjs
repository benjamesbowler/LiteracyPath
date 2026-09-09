#!/usr/bin/env node
// Approved Google Leda ADC path and measured-end normalization, following
// generateRhymePopAudio.mjs. Synthesize only the five static instructions.
// Existing exact word and phoneme recordings stay in their own banks.
import childProcess from 'node:child_process';
import { createHash } from 'node:crypto';
import { constants } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { SAFARI_AUDIO_SCRIPTS, safariInstructionPath } from '../src/components/learn/games/games/soundSafariAudio.js';
import { LEDA_PRODUCTION_VOICE } from '../src/data/ledaProductionVoice.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const destination = path.join(root, 'public/audio/sound-safari');
const provenancePath = path.join(destination, 'provenance.json');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const synthesis = Object.freeze({ audioEncoding: 'LINEAR16', sampleRateHertz: 24000, speakingRate: 0.94, pitch: 0 });
const normalization = Object.freeze({ highpassHz: 60, integratedLufs: -24, truePeakDb: -2, loudnessRange: 7,
  fadeInSeconds: 0.015, fadeOutSeconds: 0.025, sampleRateHertz: 44100, channels: 1, bitRate: '128k' });
const source = Object.freeze({ version: 3, provider: 'Google Cloud Text-to-Speech', voice: LEDA_PRODUCTION_VOICE,
  aiGenerated: true, languageCode: 'en-US', synthesis, normalization });

async function readOptional(file) {
  try { return await fs.readFile(file); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

function sourceMismatch(id = '') {
  return new Error(`Safari audio ${id} provenance differs; use a new versioned path instead of overwriting`);
}

function inspectAudio(file) {
  const info = JSON.parse(childProcess.execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'a:0',
    '-show_entries', 'format=duration:stream=codec_name,sample_rate,channels', '-of', 'json', file], { encoding: 'utf8' }));
  const durationSeconds = Number(info.format?.duration);
  const stream = info.streams?.[0];
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0 || stream?.codec_name !== 'mp3' ||
      Number(stream.sample_rate) !== normalization.sampleRateHertz || stream.channels !== normalization.channels) {
    throw new Error(`Invalid Safari recording format or duration: ${path.basename(file)}`);
  }
  childProcess.execFileSync('ffmpeg', ['-v', 'error', '-xerror', '-i', file, '-f', 'null', '-']);
  return durationSeconds;
}

function normalizeMp3(wav, mp3) {
  const duration = Number(childProcess.execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1', wav], { encoding: 'utf8' }).trim());
  if (!Number.isFinite(duration) || duration <= 0) throw new Error('Invalid generated Safari duration');
  const n = normalization;
  childProcess.execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', wav, '-af',
    `highpass=f=${n.highpassHz},loudnorm=I=${n.integratedLufs}:TP=${n.truePeakDb}:LRA=${n.loudnessRange},` +
    `afade=t=in:st=0:d=${n.fadeInSeconds},afade=t=out:st=${Math.max(0, duration - n.fadeOutSeconds)}:d=${n.fadeOutSeconds}`,
    '-ar', String(n.sampleRateHertz), '-ac', String(n.channels), '-codec:a', 'libmp3lame', '-b:a', n.bitRate, mp3]);
}

export async function runSoundSafariAudio({ verify = false, dryRun = false } = {}) {
  const rows = Object.entries(SAFARI_AUDIO_SCRIPTS).map(([id, text]) =>
    ({ id, text, role: 'instruction', audio: safariInstructionPath(id) }));
  if (dryRun) { console.log(rows); return; }
  const priorBytes = await readOptional(provenancePath);
  let prior = null;
  if (priorBytes !== null) {
    try { prior = JSON.parse(priorBytes.toString()); }
    catch { throw new Error('Invalid Safari audio provenance JSON'); }
    if (!prior || typeof prior !== 'object') throw sourceMismatch();
    const { assets, ...previousSource } = prior;
    if (!isDeepStrictEqual(previousSource, source) ||
        !isDeepStrictEqual(Object.keys(assets || {}).sort(), rows.map(row => row.id).sort())) throw sourceMismatch();
  }

  // Complete the immutable-source check before requesting credentials or
  // creating files. --verify is strictly read-only, including on failure.
  const missing = [];
  const assets = {};
  for (const row of rows) {
    const output = path.join(root, 'public', row.audio);
    const bytes = await readOptional(output);
    const previous = prior?.assets[row.id];
    if (bytes === null) {
      if (verify || previous) throw new Error(`Missing ${row.audio}; restore original bytes if provenance already exists`);
      missing.push(row);
      continue;
    }
    if (!previous || previous.sha256 !== hash(bytes) || previous.id !== row.id ||
        previous.text !== row.text || previous.role !== row.role || previous.audio !== row.audio) throw sourceMismatch(row.id);
    const durationSeconds = inspectAudio(output);
    assets[row.id] = { ...row, sha256: hash(bytes), durationSeconds, humanListening: 'unknown' };
    if (!isDeepStrictEqual(previous, assets[row.id])) throw sourceMismatch(row.id);
    console.log(`${row.id}: ${durationSeconds.toFixed(2)}s, decoded`);
  }
  if (verify || !missing.length) return;

  let token;
  try {
    token = childProcess.execFileSync('gcloud', ['auth', 'application-default', 'print-access-token'], { encoding: 'utf8' }).trim();
  } catch { throw new Error('Google Leda ADC access token is unavailable'); }
  if (!token) throw new Error('Google Leda ADC returned no access token');
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'sound-safari-audio-'));
  const installed = [];
  try {
    for (const row of missing) {
      const response = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
        method: 'POST', signal: AbortSignal.timeout(60000),
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json',
          'x-goog-user-project': process.env.GOOGLE_CLOUD_PROJECT || 'project-3c66c1c8-cc9e-4d6d-bdf' },
        body: JSON.stringify({ input: { text: row.text },
          voice: { languageCode: source.languageCode, name: source.voice }, audioConfig: synthesis })
      });
      if (!response.ok) throw new Error(`Leda generation failed with HTTP ${response.status}`);
      const encoded = (await response.json()).audioContent;
      if (!encoded) throw new Error('Leda returned no audio');
      const wav = path.join(temp, `${row.id}.wav`), mp3 = path.join(temp, `${row.id}.mp3`);
      await fs.writeFile(wav, Buffer.from(encoded, 'base64'));
      normalizeMp3(wav, mp3);
      const durationSeconds = inspectAudio(mp3);
      assets[row.id] = { ...row, sha256: hash(await fs.readFile(mp3)), durationSeconds, humanListening: 'unknown' };
      console.log(`${row.id}: ${durationSeconds.toFixed(2)}s, decoded`);
    }
    await fs.mkdir(destination, { recursive: true });
    for (const row of missing) {
      const output = path.join(root, 'public', row.audio);
      await fs.copyFile(path.join(temp, `${row.id}.mp3`), output, constants.COPYFILE_EXCL);
      installed.push(output);
    }
    await fs.writeFile(provenancePath, JSON.stringify({ ...source, assets }, null, 2) + '\n', { flag: 'wx' });
  } catch (error) {
    // Remove only files installed by this failed invocation, preserving every
    // pre-existing recording and provenance file. Staging is always disposable.
    for (const output of installed) await fs.rm(output, { force: true });
    throw error;
  } finally {
    await fs.rm(temp, { recursive: true, force: true });
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    if (args.some(arg => !['--verify', '--dry-run'].includes(arg))) throw new Error('Use --verify, --dry-run, or no arguments');
    await runSoundSafariAudio({ verify: args.includes('--verify'), dryRun: args.includes('--dry-run') });
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

#!/usr/bin/env node
// Same approved Google Leda build-time path and measured-end normalization as
// generateCyclePracticeAudio.mjs. Only these four static, non-personal scripts.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, writeFile, copyFile, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { ROCKET_AUDIO_SCRIPTS, rocketInstructionPath } from '../src/components/learn/games/games/rocketRunAudio.js';
import { LEDA_PRODUCTION_VOICE } from '../src/data/ledaProductionVoice.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const destination = path.join(root, 'public/audio/rocket-run');
const verify = process.argv.includes('--verify');
const dryRun = process.argv.includes('--dry-run');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const prior = JSON.parse(await readFile(path.join(destination, 'provenance.json'), 'utf8').catch(() => '{}'));
const rows = Object.entries(ROCKET_AUDIO_SCRIPTS).map(([id, text]) => ({ id, text, audio: rocketInstructionPath(id) }));
if (dryRun) { console.log(rows); process.exit(0); }
let token;
const temp = await mkdtemp(path.join(os.tmpdir(), 'rocket-run-audio-'));
const assets = {};
try {
  await mkdir(destination, { recursive: true });
  for (const row of rows) {
    const output = path.join(root, 'public', row.audio);
    let bytes = await readFile(output).catch(() => null);
    const previous = prior.assets?.[row.id];
    if (bytes && (!previous || previous.sha256 !== hash(bytes) || previous.text !== row.text || prior.voice !== LEDA_PRODUCTION_VOICE)) {
      throw new Error(`Existing ${row.id} differs from its source; use a new versioned path instead of overwriting`);
    }
    if (!bytes) {
      if (verify) throw new Error(`Missing ${row.audio}`);
      token ||= execFileSync('gcloud', ['auth', 'application-default', 'print-access-token'], { encoding: 'utf8' }).trim();
      const response = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
        method: 'POST', signal: AbortSignal.timeout(60000),
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json',
          'x-goog-user-project': process.env.GOOGLE_CLOUD_PROJECT || 'project-3c66c1c8-cc9e-4d6d-bdf' },
        body: JSON.stringify({ input: { text: row.text }, voice: { languageCode: 'en-US', name: LEDA_PRODUCTION_VOICE },
          audioConfig: { audioEncoding: 'LINEAR16', sampleRateHertz: 24000, speakingRate: 0.94, pitch: 0 } })
      });
      if (!response.ok) throw new Error(`Leda generation failed with HTTP ${response.status}`);
      const encoded = (await response.json()).audioContent;
      if (!encoded) throw new Error('Leda returned no audio');
      const wav = path.join(temp, `${row.id}.wav`), mp3 = path.join(temp, `${row.id}.mp3`);
      await writeFile(wav, Buffer.from(encoded, 'base64'));
      const duration = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', wav], { encoding: 'utf8' }).trim());
      if (!Number.isFinite(duration) || duration <= 0) throw new Error('Invalid generated duration');
      execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', wav, '-af',
        `highpass=f=60,loudnorm=I=-24:TP=-2:LRA=7,afade=t=in:st=0:d=0.015,afade=t=out:st=${Math.max(0, duration - 0.025)}:d=0.025`,
        '-ar', '44100', '-ac', '1', '-codec:a', 'libmp3lame', '-b:a', '128k', mp3]);
      await copyFile(mp3, output); bytes = await readFile(output);
    }
    const inspection = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration:stream=codec_name,sample_rate,channels', '-of', 'json', output], { encoding: 'utf8' }));
    execFileSync('ffmpeg', ['-v', 'error', '-i', output, '-f', 'null', '-']);
    assets[row.id] = { ...row, sha256: hash(bytes), durationSeconds: Number(inspection.format.duration), humanListening: 'unknown' };
    console.log(`${row.id}: ${assets[row.id].durationSeconds.toFixed(2)}s, decoded`);
  }
  const provenance = { provider: 'Google Cloud Text-to-Speech', voice: LEDA_PRODUCTION_VOICE, aiGenerated: true, assets };
  const text = JSON.stringify(provenance, null, 2) + '\n';
  if (verify) {
    if (JSON.stringify(prior) !== JSON.stringify(provenance)) throw new Error('Rocket audio provenance differs');
  } else await writeFile(path.join(destination, 'provenance.json'), text);
} finally { await rm(temp, { recursive: true, force: true }); }

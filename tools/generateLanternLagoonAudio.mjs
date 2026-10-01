import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { LANTERN_READING_SCENES, LANTERN_SUPPORTED_SCENES } from '../src/data/lanternLagoonContent.js';
import { getLedaInstructionAudioPath } from '../src/data/ledaProductionAudio.js';
import { LEDA_PRODUCTION_VOICE } from '../src/data/ledaProductionVoice.js';
import { normalizeLedaAudioText } from '../src/data/normalizeLedaAudioText.js';
import { AUDIO_QUEST_PATHS } from '../src/data/generated/audioQuestPaths.generated.js';
import { isKnownBadAudioPath } from '../src/data/knownBadWordAudio.js';

// Exact authored sentences only. Never generate instructions or answer labels
// from a runtime template, or overwrite another production recording.
const root = path.resolve(import.meta.dirname, '..');
const voice = LEDA_PRODUCTION_VOICE;
const verify = process.argv.includes('--verify');
const dryRun = process.argv.includes('--dry-run');
const scenes = [...LANTERN_READING_SCENES, ...LANTERN_SUPPORTED_SCENES];
const texts = [...new Set(scenes.map(scene => scene.sentence))];
const rows = texts.map(text => {
  const existing = getLedaInstructionAudioPath(text);
  const reuse = existing && AUDIO_QUEST_PATHS.has(existing) && !isKnownBadAudioPath(existing);
  const id = createHash('sha256').update(`${voice}|instruction|${text}|lantern-lagoon-v1`).digest('hex').slice(0, 12);
  const slug = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 72);
  const audio = reuse ? existing : `/audio/production/en-US/instruction/${slug}-${id}.mp3`;
  return { text, audio, reusedExisting: !!reuse, target: path.join(root, 'public', audio) };
});
const missing = [];
for (const row of rows) {
  if (!(await fs.stat(row.target).catch(() => null))?.size) {
    if (row.reusedExisting) throw new Error(`Existing production recording missing: ${row.text}`);
    missing.push(row);
  }
}
if (dryRun) {
  console.log(JSON.stringify({ voice, scenes: scenes.length, uniqueSentences: rows.length, reused: rows.filter(row => row.reusedExisting).length, missing: missing.map(({ text, audio }) => ({ text, audio })) }, null, 2));
  process.exit(0);
}
if (verify && missing.length) throw new Error(`${missing.length} Lantern Lagoon recordings missing`);
const token = missing.length ? execFileSync('gcloud', ['auth', 'application-default', 'print-access-token'], { encoding: 'utf8' }).trim() : '';
const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'lantern-lagoon-audio-'));
const metadata = {}, lookup = {};
try {
  for (const [index, row] of rows.entries()) {
    if (missing.includes(row)) {
      let encoded;
      for (let attempt = 0; attempt < 3; attempt++) {
        const response = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'x-goog-user-project': process.env.GOOGLE_CLOUD_PROJECT || 'project-3c66c1c8-cc9e-4d6d-bdf' },
          body: JSON.stringify({ input: { text: row.text }, voice: { languageCode: 'en-US', name: voice }, audioConfig: { audioEncoding: 'LINEAR16', sampleRateHertz: 24000, speakingRate: 0.94 } }),
        });
        if (response.ok) { encoded = (await response.json()).audioContent; break; }
        if (![429, 500, 502, 503, 504].includes(response.status) || attempt === 2) throw new Error(`Lantern Lagoon speech generation failed HTTP ${response.status}`);
        await new Promise(resolve => setTimeout(resolve, 1500 * (attempt + 1)));
      }
      if (!encoded) throw new Error('Lantern Lagoon speech generation returned no audio');
      const wav = path.join(temporary, `${index}.wav`);
      await fs.writeFile(wav, Buffer.from(encoded, 'base64'));
      const duration = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', wav], { encoding: 'utf8' }).trim());
      if (!Number.isFinite(duration) || duration <= 0) throw new Error(`Invalid speech response: ${row.text}`);
      await fs.mkdir(path.dirname(row.target), { recursive: true });
      const result = spawnSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', wav, '-af', `highpass=f=60,loudnorm=I=-24:TP=-2:LRA=7,afade=t=in:st=0:d=0.015,afade=t=out:st=${Math.max(0, duration - 0.025)}:d=0.025`, '-ar', '44100', '-ac', '1', '-codec:a', 'libmp3lame', '-b:a', '128k', row.target], { encoding: 'utf8' });
      if (result.status !== 0) throw new Error(`Speech normalization failed: ${row.text}`);
      console.log(`Generated: ${row.text}`);
    }
    const decoded = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', row.target, '-af', 'volumedetect', '-f', 'null', '-'], { encoding: 'utf8' });
    const peak = Number(decoded.stderr.match(/max_volume:\s*(-?[\d.]+) dB/)?.[1]);
    const duration = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', row.target], { encoding: 'utf8' }).trim());
    if (decoded.status !== 0 || !Number.isFinite(peak) || peak <= -40 || !Number.isFinite(duration) || duration <= 0) throw new Error(`Invalid Lantern Lagoon recording: ${row.text}`);
    const normalized = normalizeLedaAudioText(row.text);
    lookup[normalized] = row.audio;
    metadata[normalized] = { text: row.text, audio: row.audio, voice, provider: 'Google Cloud Text-to-Speech', aiGenerated: true, reusedExisting: row.reusedExisting, sha256: createHash('sha256').update(await fs.readFile(row.target)).digest('hex'), durationSeconds: duration, peakDb: peak, humanListening: 'unknown' };
  }
} finally {
  await fs.rm(temporary, { recursive: true, force: true });
}
const output = path.join(root, 'src/data/generated/lanternLagoonAudio.generated.js');
const source = `// Generated by tools/generateLanternLagoonAudio.mjs. Do not edit.\nexport const LANTERN_LAGOON_AUDIO = Object.freeze(${JSON.stringify(lookup, null, 2)});\nexport const LANTERN_LAGOON_AUDIO_METADATA = Object.freeze(${JSON.stringify(metadata, null, 2)});\n`;
if (verify) {
  if (await fs.readFile(output, 'utf8') !== source) throw new Error('Lantern Lagoon audio manifest stale');
} else await fs.writeFile(output, source);
console.log(`Lantern Lagoon audio: ${rows.length} clips decoded; ${missing.length} new recordings.`);

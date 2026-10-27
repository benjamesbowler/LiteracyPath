#!/usr/bin/env node
import { execFileSync, spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { COMPREHENSION_PASSAGES } from '../src/content/comprehension/passages.js';
import { LEDA_PRODUCTION_VOICE as voice } from '../src/data/ledaProductionVoice.js';
import {
  COMPREHENSION_AUDIO_PAUSE_MS as pauseMs, COMPREHENSION_AUDIO_RECIPE as recipe,
  comprehensionPassageAudioSegments, comprehensionAudioText
} from '../src/content/comprehension/audio.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(root, 'public/audio/production/en-US/comprehension');
const scratchDir = path.join(root, '.artifacts/comprehension/leda-generation');
const cacheDir = path.join(root, '.artifacts/comprehension/leda-source-cache');
const manifestPath = path.join(root, 'src/content/comprehension/audioManifest.generated.json');
const modulePath = path.join(root, 'src/content/comprehension/audio.generated.js');
const projectId = 'project-3c66c1c8-cc9e-4d6d-bdf';
const endpoint = 'https://texttospeech.googleapis.com/v1/text:synthesize';
const sha256 = value => createHash('sha256').update(value).digest('hex');
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const nonempty = async file => (await stat(file).catch(() => null))?.size > 0;
const pacingRepairs = JSON.parse(await readFile(new URL('./comprehensionLedaPacing.json', import.meta.url), 'utf8'));

export function comprehensionNarrationRecords(passages) {
  const records = new Map();
  function add(item, reference) {
    if (!item.segments.length) throw new Error(`Invalid narration source: ${reference.sourceId}`);
    const text = comprehensionAudioText(item.segments);
    const existing = records.get(text);
    if (existing) existing.references.push(reference);
    else {
      const textSha256 = sha256(text);
      const tempo = pacingRepairs[text] || 1;
      if (!Number.isFinite(tempo) || tempo < 0.5 || tempo > 2) throw new Error(`Invalid narration tempo for ${reference.sourceId}`);
      const clipRecipe = tempo === 1 ? recipe : `${recipe}-tempo${tempo}`;
      const filename = `${sha256(`${voice}|${clipRecipe}|${text}`).slice(0, 20)}.mp3`;
      records.set(text, { text, textSha256, segments: item.segments, recipe: clipRecipe, tempo,
        audioPath: `/audio/production/en-US/comprehension/${filename}`, references: [reference] });
    }
  }
  for (const passage of passages) {
    add({ segments: comprehensionPassageAudioSegments(passage) }, { passageId: passage.id, sourceId: passage.id, role: 'passage' });
    for (const question of passage.questions) {
      add({ segments: [question.prompt] }, { passageId: passage.id, sourceId: question.id, role: 'question-prompt' });
      question.options.forEach((option, index) => add({ segments: [option] }, { passageId: passage.id, sourceId: question.id, role: 'question-option', authoredIndex: index }));
    }
  }
  for (const label of 'ABCD') add({ segments: [`Option ${label}.`] }, { sourceId: `option-label-${label.toLowerCase()}`, role: 'choice-label' });
  return [...records.values()];
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', chunk => { stderr = (stderr + chunk).slice(-2000); });
    child.once('error', reject);
    child.once('close', code => code === 0 ? resolve() : reject(new Error(`${command} failed: ${stderr}`)));
  });
}

async function synthesize(token, text, filename) {
  if (await nonempty(filename)) return;
  for (let attempt = 0; attempt < 7; attempt += 1) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json; charset=utf-8', 'x-goog-user-project': projectId },
      body: JSON.stringify({ input: { text }, voice: { languageCode: 'en-US', name: voice }, audioConfig: { audioEncoding: 'LINEAR16', sampleRateHertz: 24000 } })
    });
    if (response.ok) {
      const content = (await response.json()).audioContent;
      if (!content) throw new Error('Google Leda returned no audio');
      await writeFile(filename, Buffer.from(content, 'base64'));
      return;
    }
    // Do not log provider response bodies: authorization details can occur there.
    if (![429, 500, 502, 503, 504].includes(response.status) || attempt === 6) throw new Error(`Google Leda synthesis failed (${response.status})`);
    await wait(Math.min(30000, Math.max(Number(response.headers.get('retry-after') || 0) * 1000, 1500 * 2 ** attempt)));
  }
}

async function assemble(record, segmentFiles) {
  const target = path.join(root, 'public', record.audioPath);
  const args = ['-y', '-hide_banner', '-loglevel', 'error'];
  for (const segment of record.segments) args.push('-i', segmentFiles.get(segment));
  const filters = record.segments.map((_, i) => `[${i}:a]aformat=sample_fmts=fltp:sample_rates=24000:channel_layouts=mono${i < record.segments.length - 1 ? `,apad=pad_dur=${pauseMs / 1000}` : ''}[s${i}]`);
  filters.push(`${record.segments.map((_, i) => `[s${i}]`).join('')}concat=n=${record.segments.length}:v=0:a=1,atempo=${record.tempo},loudnorm=I=-24:TP=-2:LRA=7,afade=t=in:st=0:d=0.015,apad=pad_dur=0.15[out]`);
  args.push('-filter_complex', filters.join(';'), '-map', '[out]', '-codec:a', 'libmp3lame', '-b:a', '128k', target);
  await run('ffmpeg', args);
}

export async function generateComprehensionLedaAudio() {
  const records = comprehensionNarrationRecords(COMPREHENSION_PASSAGES);
  const previous = JSON.parse(await readFile(manifestPath, 'utf8').catch(() => '{"clips":[]}'));
  const previousByPath = new Map(previous.clips.map(clip => [clip.audioPath, clip]));
  const missing = [];
  for (const record of records) {
    const filename = path.join(root, 'public', record.audioPath);
    const old = previousByPath.get(record.audioPath);
    const valid = old?.textSha256 === record.textSha256 && old?.recipe === record.recipe && await nonempty(filename)
      && old.audioSha256 === sha256(await readFile(filename));
    if (!valid) missing.push(record);
  }
  const segments = [...new Set(missing.flatMap(record => record.segments))];
  const cachedSegments = new Set();
  for (const text of segments) if (await nonempty(path.join(cacheDir, `${sha256(text)}.wav`))) cachedSegments.add(text);
  // Reuse only exact-text canonical Leda records whose recorded bytes still
  // match. Normalized filename guesses and browser speech are never sources.
  const canonicalManifest = JSON.parse(await readFile(path.join(root, 'src/content/storyQuestNarrationManifest.generated.json'), 'utf8'));
  const canonicalSegments = new Map();
  for (const text of segments.filter(text => !cachedSegments.has(text))) {
    const source = canonicalManifest.clips.find(clip => clip.text === text && clip.voice === voice);
    if (!source) continue;
    const filename = path.join(root, 'public', source.audioPath);
    if (await nonempty(filename) && sha256(await readFile(filename)) === source.audioSha256) canonicalSegments.set(text, source);
  }
  const providerSegments = segments.filter(text => !cachedSegments.has(text) && !canonicalSegments.has(text));
  const plan = { passages: COMPREHENSION_PASSAGES.length, finalClips: records.length, missingClips: missing.length,
    cachedUtterances: cachedSegments.size, reusedCanonicalUtterances: canonicalSegments.size, providerRequests: providerSegments.length,
    providerCharacters: providerSegments.reduce((sum, text) => sum + text.length, 0), voice, recipe };
  console.log(JSON.stringify(plan, null, 2));
  if (process.argv.includes('--plan')) return plan;
  if (process.argv.includes('--check')) {
    if (missing.length || previous.clips.length !== records.length) throw new Error(`Comprehension narration stale or missing: ${missing.length}`);
    return plan;
  }
  await mkdir(outputDir, { recursive: true });
  await mkdir(scratchDir, { recursive: true });
  const segmentFiles = new Map(segments.map(text => [text, path.join(scratchDir, `${sha256(text)}.wav`)]));
  for (const text of cachedSegments) segmentFiles.set(text, path.join(cacheDir, `${sha256(text)}.wav`));
  for (const [text, source] of canonicalSegments) segmentFiles.set(text, path.join(root, 'public', source.audioPath));
  if (providerSegments.length) {
    const token = execFileSync('gcloud', ['auth', 'application-default', 'print-access-token'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
    if (!token) throw new Error('Google ADC returned no access token');
    for (let offset = 0; offset < providerSegments.length; offset += 5) {
      await Promise.all(providerSegments.slice(offset, offset + 5).map(text => synthesize(token, text, segmentFiles.get(text))));
      console.log(`Leda segments ${Math.min(offset + 5, providerSegments.length)}/${providerSegments.length}`);
      if (offset + 5 < providerSegments.length) await wait(700);
    }
  }
  if (process.argv.includes('--keep-cache')) {
    await mkdir(cacheDir, { recursive: true });
    for (const text of providerSegments) await copyFile(segmentFiles.get(text), path.join(cacheDir, `${sha256(text)}.wav`));
  }
  for (const record of missing) await assemble(record, segmentFiles);
  const regeneratedPaths = new Set(missing.map(record => record.audioPath));
  const clips = await Promise.all(records.map(async record => ({ ...record, voice, engine: 'Google Cloud Text-to-Speech v1',
    generatedAt: regeneratedPaths.has(record.audioPath) ? new Date().toISOString() : previousByPath.get(record.audioPath)?.generatedAt || new Date().toISOString(),
    pauseBetweenSegmentsMs: pauseMs, finalPaddingMs: 150,
    ...(previousByPath.get(record.audioPath)?.paddingUpgradeSourceSha256
      ? { paddingUpgradeSourceSha256: previousByPath.get(record.audioPath).paddingUpgradeSourceSha256 } : {}),
    ...(canonicalSegments.has(record.text) ? { sourceAudioPath: canonicalSegments.get(record.text).audioPath,
      sourceAudioSha256: canonicalSegments.get(record.text).audioSha256 } : previousByPath.get(record.audioPath)?.sourceAudioPath ? {
      sourceAudioPath: previousByPath.get(record.audioPath).sourceAudioPath, sourceAudioSha256: previousByPath.get(record.audioPath).sourceAudioSha256 } : {}),
    audioSha256: sha256(await readFile(path.join(root, 'public', record.audioPath)))
  })));
  await writeFile(manifestPath, JSON.stringify({ generator: 'tools/generateComprehensionLedaAudio.mjs', language: 'en-US', voice,
    reviewMode: 'continuous-pass-by-exception', observation: 'Exact text and byte provenance. Automated decoding and signal checks are separate from human listening.', clips }, null, 2) + '\n');
  const mapping = Object.fromEntries(clips.map(record => [record.text, record.audioPath]));
  await writeFile(modulePath, '// AUTO-GENERATED by tools/generateComprehensionLedaAudio.mjs - do not edit.\n' + `export const COMPREHENSION_LEDA_AUDIO = Object.freeze(${JSON.stringify(mapping, null, 2)});\n`);
  const activePaths = new Set(clips.map(clip => clip.audioPath));
  // Remove only this generator's previously registered, now superseded clips.
  // Unknown files and every other production family remain outside this scope.
  for (const old of previous.clips) {
    if (activePaths.has(old.audioPath)) continue;
    const filename = path.join(root, 'public', old.audioPath);
    if (path.dirname(filename) === outputDir) await rm(filename, { force: true });
  }
  await rm(scratchDir, { recursive: true, force: true });
  if (!process.argv.includes('--keep-cache')) await rm(cacheDir, { recursive: true, force: true });
  return plan;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await generateComprehensionLedaAudio();
}

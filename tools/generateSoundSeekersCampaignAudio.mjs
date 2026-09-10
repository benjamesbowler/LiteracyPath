#!/usr/bin/env node
// Exact spoken directions only. Isolated phonemes remain in the reviewed bank.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { lstat, mkdir, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CAMPAIGN_LANGUAGE, CAMPAIGN_HELP_LINES } from '../src/features/soundSeekers/v3/content/campaignLanguage.js';
import { CAMPAIGN_NARRATION_AUDIO } from '../src/features/soundSeekers/v3/content/campaignNarration.js';
import { CAMPAIGN_SENTENCE_TRANSFER_AUDIO } from '../src/features/soundSeekers/v3/content/campaignSentenceTransfer.js';
import { CAMPAIGN_TRANSFER_AUDIO } from '../src/features/soundSeekers/v3/content/campaignTransferPacks.js';
import { CAMPAIGN_LEARNING_AUDIO } from '../src/features/soundSeekers/v3/content/campaignLearningPacks.js';
import { probeSoundSeekersAudio } from './checkSoundSeekersSceneAudio.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputRoot = path.join(root, 'public/audio/sound-seekers/campaign');
const manifestPath = path.join(outputRoot, 'manifest.json');
const sourceFile = 'src/features/soundSeekers/v3/content/campaignLanguage.js';
const sha256 = value => createHash('sha256').update(value).digest('hex');
const voice = 'en-US-Chirp3-HD-Leda';
const locale = 'en-US';
const model = 'Google Cloud Text-to-Speech Chirp3 HD';
const endpoint = 'https://texttospeech.googleapis.com/v1/text:synthesize';
const project = process.env.GOOGLE_CLOUD_PROJECT || 'project-3c66c1c8-cc9e-4d6d-bdf';
const generatorVersion = '1.0.0';
const args = process.argv.slice(2);
let generate = false;
let dryRun = false;
let replace = false;
let narrationOnly = false;
let transferOnly = false;
let selectedId = null;
const seen = new Set();
for (let i = 0; i < args.length; i += 1) {
  const argument = args[i];
  if (seen.has(argument)) throw new Error(`Repeated option: ${argument}`);
  seen.add(argument);
  if (argument === '--generate') generate = true;
  else if (argument === '--dry-run') dryRun = true;
  else if (argument === '--replace') replace = true;
  else if (argument === '--narration-only') narrationOnly = true;
  else if (argument === '--transfer-only') transferOnly = true;
  else if (argument === '--id' && args[i + 1] && !args[i + 1].startsWith('--')) selectedId = args[++i];
  else throw new Error('Usage: generateSoundSeekersCampaignAudio.mjs [--dry-run | --generate] [--id ID | --narration-only | --transfer-only] [--replace]');
}
if ([narrationOnly, transferOnly, Boolean(selectedId)].filter(Boolean).length > 1) throw new Error('Select only one of --narration-only, --transfer-only or --id');
if (replace && (!generate || !selectedId)) throw new Error('--replace requires --generate and a single --id');
if (generate && dryRun) throw new Error('--generate and --dry-run cannot be combined');

const learningSourceFile = 'src/features/soundSeekers/v3/content/campaignLearningPacks.js';
const sentenceSourceFile = 'src/features/soundSeekers/v3/content/campaignSentenceTransfer.js';
const transferSourceFile = 'src/features/soundSeekers/v3/content/campaignTransferPacks.js';
const narrationSourceFile = 'src/features/soundSeekers/v3/content/campaignNarration.js';
const scripts = [
  ...CAMPAIGN_SENTENCE_TRANSFER_AUDIO.map(line => ({assetId:line.id,ownerId:line.ownerId || 'campaign-sentence-transfer',kind:line.construct || 'spoken-sentence-transfer',text:line.text,path:line.audio,sourceFile:sentenceSourceFile})),
  ...CAMPAIGN_TRANSFER_AUDIO.map(line => ({assetId:line.id,ownerId:line.ownerId || 'campaign-transfer-labels',kind:line.construct,text:line.text,path:line.audio,sourceFile:transferSourceFile})),
  ...CAMPAIGN_NARRATION_AUDIO.map(line => ({assetId:line.id,ownerId:line.ownerId,kind:line.kind,text:line.text,path:line.audio,sourceFile:narrationSourceFile})),
  ...CAMPAIGN_LEARNING_AUDIO.map(line => ({ assetId: line.id, ownerId: line.ownerId, kind: line.construct === 'isolated_word' ? 'canonical-whole-word' : 'spoken-learning-instruction', text: line.text, path: line.audio, sourceFile: learningSourceFile })),
  ...Object.entries(CAMPAIGN_LANGUAGE).flatMap(([ownerId, lines]) => lines.map(line => ({
    assetId: line.id, ownerId, kind: 'spoken-language-instruction', text: line.text, path: line.audio
  }))),
  ...Object.entries(CAMPAIGN_HELP_LINES).map(([assetId, line]) => ({
    assetId, ownerId: 'campaign-help', kind: 'spoken-control-instruction', text: line.text, path: line.audio
  }))
].sort((a, b) => a.assetId.localeCompare(b.assetId));
const ids = new Set();
for (const script of scripts) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(script.assetId) || ids.has(script.assetId)
    || script.path !== `/audio/sound-seekers/campaign/${script.assetId}.mp3`
    || typeof script.text !== 'string' || script.text.trim() !== script.text || !script.text) {
    throw new Error('Campaign language scripts have an invalid ID, path or exact text');
  }
  ids.add(script.assetId);
}
if (selectedId && !ids.has(selectedId)) throw new Error(`Unknown campaign audio ID: ${selectedId}`);
const replacing = new Map();
const selected = scripts.filter(script => (!selectedId || selectedId === script.assetId) && (!narrationOnly || script.sourceFile === narrationSourceFile) && (!transferOnly || [transferSourceFile,sentenceSourceFile].includes(script.sourceFile)));
let manifest;
try {
  manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
  manifest = { schemaVersion: 1, assets: [] };
}
if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.assets)) throw new Error('Invalid campaign audio manifest');
const records = new Map(manifest.assets.map(record => [record.assetId, record]));
if (records.size !== manifest.assets.length || [...records.keys()].some(id => !ids.has(id))) {
  throw new Error('Campaign audio manifest has duplicate or obsolete script IDs; reconcile exact references first');
}

async function synthesizeScript(script, token) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST', signal: AbortSignal.timeout(60000),
        headers: { 'Content-Type': 'application/json; charset=utf-8', Authorization: `Bearer ${token}`, 'x-goog-user-project': project },
        body: JSON.stringify({ input: { text: script.text }, voice: { languageCode: locale, name: voice },
          audioConfig: { audioEncoding: 'MP3', speakingRate: 0.94, pitch: 0 } })
      });
      if (!response.ok) {
        const error = new Error(`Google speech generation failed with status ${response.status}`);
        error.retryable = response.status === 429 || response.status >= 500;
        throw error;
      }
      const body = await response.json();
      if (typeof body.audioContent !== 'string' || !body.audioContent) {
        const error = new Error('Google speech generation returned no audio');
        error.retryable = false;throw error;
      }
      return Buffer.from(body.audioContent, 'base64');
    } catch (error) {
      if (error.retryable === false || attempt === 2) throw error;
      console.log(`Retrying interrupted speech request ${script.assetId}`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
  throw new Error('Speech retry loop ended without audio');
}

async function assertSafePath(destination) {
  const relative = path.relative(root, destination);
  if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('Audio destination escaped repository');
  let cursor = root;
  for (const segment of relative.split(path.sep)) {
    cursor = path.join(cursor, segment);
    const entry = await lstat(cursor).catch(error => {
      if (error.code !== 'ENOENT') throw error;
      return null;
    });
    if (entry?.isSymbolicLink()) throw new Error('Audio destinations cannot contain symlinks');
  }
}

async function verifyExisting(script) {
  const file = path.join(root, 'public', script.path.slice(1));
  await assertSafePath(file);
  let bytes;
  try { bytes = await readFile(file); }
  catch (error) {
    if (error.code !== 'ENOENT') throw error;
    if (records.has(script.assetId)) throw new Error(`${script.assetId}: manifest references missing bytes`, { cause: error });
    return false;
  }
  const record = records.get(script.assetId);
  if (replace && record && record.path === script.path && record.sha256 === sha256(bytes)
    && record.byteLength === bytes.length && record.text !== script.text) {
    replacing.set(script.assetId, record.sha256);return false;
  }
  if (!record || record.text !== script.text || record.path !== script.path
    || record.textSha256 !== sha256(script.text) || record.sha256 !== sha256(bytes)
    || record.byteLength !== bytes.length || record.voice !== voice || record.locale !== locale) {
    throw new Error(`${script.assetId}: existing bytes or source changed; explicit source reconciliation required before replacing`);
  }
  const probe = probeSoundSeekersAudio(file);
  for (const [key, value] of Object.entries(probe)) {
    if (record[key] !== value) throw new Error(`${script.assetId}: technical manifest mismatch for ${key}`);
  }
  return true;
}
const jobs = [];
for (const script of selected) {
  if (!await verifyExisting(script)) jobs.push(script);
}
if (!generate) {
  console.log(JSON.stringify({ mode: 'dry-run', selected: selected.length, verifiedExisting: selected.length - jobs.length,
    missing: jobs.map(script => ({ id: script.assetId, text: script.text, path: script.path })),
    voice, humanListening: 'not-established-by-this-check' }, null, 2));
} else {
  // Never put credentials in shell text, process arguments, output or provenance.
  let token;
  if (jobs.length) {
    try {
      token = execFileSync('gcloud', ['auth', 'application-default', 'print-access-token'], {
        encoding: 'utf8', timeout: 30000, stdio: ['ignore', 'pipe', 'ignore']
      }).trim();
    } catch {
      throw new Error('Existing Google Cloud application-default authentication is unavailable');
    }
    if (!token) throw new Error('Existing Google Cloud authentication returned no token');
  }
  await assertSafePath(outputRoot);
  await mkdir(outputRoot, { recursive: true });
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), 'sound-seekers-campaign-audio-'));
  const sourceHashes = new Map(await Promise.all([sourceFile, learningSourceFile, narrationSourceFile, transferSourceFile, sentenceSourceFile].map(async file => [file, sha256(await readFile(path.join(root, file)))])));
  let persist = Promise.resolve();
  let jobIndex = 0;
  try {
    const generateScript = async script => {
      const audioBytes = await synthesizeScript(script, token);
      const source = path.join(temporaryRoot, `${script.assetId}.source.mp3`);
      const normalized = path.join(temporaryRoot, `${script.assetId}.mp3`);
      await writeFile(source, audioBytes, { flag: 'wx' });
      execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', source,
        '-threads', '1', '-ar', '44100', '-ac', '1', '-codec:a', 'libmp3lame', '-b:a', '128k', normalized], { stdio: 'pipe' });
      const probe = probeSoundSeekersAudio(normalized);
      const bytes = await readFile(normalized);
      const destination = path.join(outputRoot, `${script.assetId}.mp3`);
      await assertSafePath(destination);
      // Refuse a concurrent writer rather than overwriting its output.
      if (replacing.has(script.assetId)) {
        if (sha256(await readFile(destination)) !== replacing.get(script.assetId)) throw new Error('Audio replacement raced with another writer');
        const pending = `${destination}.tmp-${process.pid}`;
        try { await writeFile(pending, bytes, {flag:'wx'});await rename(pending,destination); }
        finally { await rm(pending,{force:true}); }
      } else await writeFile(destination, bytes, { flag: 'wx' });
      records.set(script.assetId, {
        ...script, sourceFile: script.sourceFile || sourceFile, sourceSha256: sourceHashes.get(script.sourceFile || sourceFile), textSha256: sha256(script.text),
        voice, model, locale, generatorVersion, speakingRate: 0.94,
        generatedAt: new Date().toISOString(), byteLength: bytes.length,
        ...probe, sha256: sha256(bytes), humanListeningApproved: false, humanListeningReview: null
      });
      persist = persist.then(async () => {
      const temporaryManifest = `${manifestPath}.tmp-${process.pid}`;
      try {
        await writeFile(temporaryManifest, JSON.stringify({ schemaVersion: 1,
          assets: [...records.values()].sort((a, b) => a.assetId.localeCompare(b.assetId)) }, null, 2) + '\n', { flag: 'wx' });
        await rename(temporaryManifest, manifestPath);
      } finally {
        await rm(temporaryManifest, { force: true });
      }
      });
      await persist;
      console.log(`Generated and mechanically verified ${script.assetId}`);
    };
    // Four bounded provider requests; manifest writes remain serialized.
    const worker = async () => { while (jobIndex < jobs.length) { const script = jobs[jobIndex++]; await generateScript(script); } };
    const results = await Promise.allSettled(Array.from({ length: Math.min(4, jobs.length) }, worker));
    const failed = results.find(result => result.status === 'rejected');
    if (failed) throw failed.reason;
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
  for (const script of selected) await verifyExisting(script);
  console.log(`${selected.length} selected clips verified; human listening remains unreviewed.`);
}

import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import {pictureColourStats} from './comprehensionPicturePixels.mjs';
import {COMPREHENSION_PICTURES as runtimePictures} from '../src/content/comprehension/pictures.js';
import { COMPREHENSION_PASSAGES } from '../src/content/comprehension/passages.js';
import { COMPREHENSION_PICTURES } from './authoring/comprehensionPictures.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const digest = value => createHash('sha256').update(value).digest('hex');
const sha256 = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const date = value => typeof value === 'string' && Number.isFinite(Date.parse(value));

export function validateComprehensionPicturePlans(passages = COMPREHENSION_PASSAGES, pictures = COMPREHENSION_PICTURES) {
  const failures = [];
  const ids = new Set(passages.map(p => p.id));
  for (const id of Object.keys(pictures)) if (!ids.has(id)) failures.push(`${id}: orphan picture plan`);
  const prompts = new Set();
  const panelScenes = new Set();
  for (const passage of passages) {
    const record = pictures[passage.id];
    const fail = message => failures.push(`${passage.id}: ${message}`);
    if (!record) { fail('missing picture plan'); continue; }
    if (record.sourceText !== passage.text || record.textSha256 !== digest(passage.text)) fail('source text/hash differs from the current passage');
    if (!['scene','comic'].includes(record.kind)) fail('kind must be scene or comic');
    const count = record.kind === 'scene' ? 1 : 3;
    if (!Array.isArray(record.panels) || record.panels.length !== count) fail(`expected ${count} authored panels`);
    for (const panel of record.panels || []) {
      if (typeof panel.scene !== 'string' || panel.scene.trim().length < 35) fail('panel needs a concrete authored scene');
      if (typeof panel.alt !== 'string' || panel.alt.trim().length < 15) fail('panel needs concrete alternative text');
      if (panelScenes.has(panel.scene)) fail('panel scene duplicates another assignment');
      panelScenes.add(panel.scene);
    }
    if (typeof record.alt !== 'string' || record.alt.length < 20) fail('missing overall alternative text');
    if (record.src !== `/images/comprehension/passages/${passage.id}.webp`) fail('incorrect local image path');
    if (record.referencePath !== `/images/worksheets/${passage.character}-colouring.webp`) fail('incorrect Guide reference path');
    if (typeof record.prompt !== 'string' || !record.prompt.includes(passage.text)) fail('prompt must contain the exact passage');
    if (/IDENTITY UNRESOLVED/.test(record.prompt)) fail('Guide identity remains unresolved');
    if (prompts.has(record.prompt)) fail('prompt duplicates another assignment');
    prompts.add(record.prompt);
  }
  return failures;
}

export async function checkComprehensionPictures({ root = ROOT, passages = COMPREHENSION_PASSAGES, pictures = COMPREHENSION_PICTURES, planOnly = false } = {}) {
  const failures = validateComprehensionPicturePlans(passages, pictures);
  const output = { mode: planOnly ? 'plan-only' : 'release-assets', passages: passages.length, scenes: 0, comics: 0, decoded: 0, failures };
  let provenance = null;
  if (!planOnly) {
    try {
      provenance = JSON.parse(await fs.readFile(path.join(root,'docs/content/comprehension-images/provenance.json'),'utf8'));
      if (provenance.version !== 1 || !Array.isArray(provenance.images)) throw Error('expected version 1 images array');
    } catch (error) { failures.push(`provenance: ${error.message}`); }
  }
  const entries = new Map();
  for (const row of provenance?.images || []) {
    if (entries.has(row.id)) failures.push(`${row.id}: duplicate provenance`);
    entries.set(row.id,row);
  }
  const ids = new Set(passages.map(p => p.id));
  for (const id of entries.keys()) if (!ids.has(id)) failures.push(`${id}: orphan provenance`);
  for (const passage of passages) {
    const record = pictures[passage.id];
    if (!record) continue;
    if(pictures===COMPREHENSION_PICTURES){const metadata={...record};delete metadata.prompt;if(JSON.stringify(runtimePictures[passage.id])!==JSON.stringify(metadata))fail('generated runtime picture metadata differs from authoring');}
    output[record.kind === 'comic' ? 'comics' : 'scenes']++;
    const fail = message => failures.push(`${passage.id}: ${message}`);
    let reference;
    try {
      reference = await fs.readFile(path.join(root,'public',record.referencePath));
      await sharp(reference).raw().toBuffer();
    } catch (error) { fail(`reference does not decode: ${error.message}`); }
    if (planOnly) continue;
    const row = entries.get(passage.id);
    if (!row) fail('missing generation and visual-review provenance');
    try {
      const bytes = await fs.readFile(path.join(root,'public',record.src));
      const metadata = await sharp(bytes).metadata();
      await sharp(bytes).raw().toBuffer();
      if(!(await pictureColourStats(bytes)).blackAndWhite)fail('illustration contains coloured pixels; black-and-white colouring art is required');
      output.decoded++;
      if (metadata.format !== 'webp' || metadata.width < 1024 || metadata.height < 512) fail('expected a real WebP raster of at least 1024×512');
      if (record.kind === 'comic' && metadata.width / metadata.height < 2) fail('three-panel comic must be a wide left-to-right composition');
      if (row) {
        if (row.src !== record.src || row.textSha256 !== record.textSha256) fail('provenance source differs from the current story');
        if (row.imageSha256 !== digest(bytes)) fail('image byte hash differs from provenance');
        if (row.promptSha256 !== digest(record.prompt) || row.prompt !== record.prompt) fail('generation prompt differs from the authored plan');
        if (!reference || row.referenceSha256 !== digest(reference)) fail('Guide reference hash differs from provenance');
        if (row.width !== metadata.width || row.height !== metadata.height) fail('provenance dimensions differ from decoded image');
        if (row.engine !== 'image_gen' || !date(row.generatedAt) || !sha256(row.sourceImageSha256)) fail('missing built-in generation provenance');
        if (row.visualReview?.status !== 'passed' || !date(row.visualReview.reviewedAt) || typeof row.visualReview.notes !== 'string' || row.visualReview.notes.trim().length < 25) fail('missing actual exact-story and Guide visual review');
      }
    } catch (error) { fail(`raster does not decode: ${error.message}`); }
  }
  if (!planOnly) {
    try {
      const expected = new Set(passages.map(p => `${p.id}.webp`));
      const files = await fs.readdir(path.join(root,'public/images/comprehension/passages'));
      for (const filename of files) if (filename !== 'provenance.json' && !expected.has(filename)) failures.push(`${filename}: orphan picture asset`);
    } catch (error) { failures.push(`picture directory: ${error.message}`); }
  }
  return output;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await checkComprehensionPictures({ planOnly: process.argv.includes('--plan') });
  console.log(JSON.stringify(result,null,2));
  if (result.failures.length) process.exitCode = 1;
}

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(root, 'source-art/arcade/physical-worlds/sound-beat/scene-kit-clean-cartoon.json');
const dataPath = path.join(root, 'src/components/learn/games/games/soundBeatArtData.js');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const digest = filename => hash(fs.readFileSync(filename));
const absolute = relative => path.join(root, relative);
const venueIds = new Set(['dino', 'meadow', 'moonwood'].flatMap(world =>
  [`${world}-concert-venue-v1`]));

export function runtimeAssets(assets) {
  const authorOnly = new Set(['packing', 'generation', 'supersedes', 'originalOutput', 'references']);
  return Object.fromEntries(Object.entries(assets).filter(([, asset]) => !asset.sourceOnly).map(([name, asset]) =>
    [name, Object.fromEntries(Object.entries(asset).filter(([key]) => !authorOnly.has(key)))]));
}

export async function buildSoundBeatVenues({ write = false, selectedIds = venueIds } = {}) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath));
  for (const lineage of [manifest.historicalManifest, manifest.historicalRegistration, manifest.registration]) {
    if (digest(absolute(lineage.path)) !== lineage.sha256) throw new Error(`Historical Sound Beat input changed: ${lineage.path}`);
  }
  const registration = JSON.parse(fs.readFileSync(absolute(manifest.registration.path))).currentSources;
  for (const [id, spec] of Object.entries(registration)) {
    for (const key of ['source', 'sourceSha256', 'parts', 'frames', 'pixelsPerUnit', 'deliveryRecipe']) {
      if (JSON.stringify(manifest.assets[id][key]) !== JSON.stringify(spec[key])) throw new Error(`Current Sound Beat registration changed: ${id}/${key}`);
    }
  }
  for (const id of selectedIds) if (!venueIds.has(id)) throw new Error(`Not a venue delivery: ${id}`);
  const pending = [];
  for (const [id, asset] of Object.entries(manifest.assets)) {
    const source = absolute(asset.source), output = absolute(`public${asset.runtime}`);
    if (digest(source) !== asset.sourceSha256) throw new Error(`Sound Beat source changed: ${id}`);
    if (asset.sourceOnly) continue;
    if (asset.productionRevision && venueIds.has(id)) {
      if (digest(absolute(asset.prompt)) !== asset.promptSha256) throw new Error(`Sound Beat prompt changed: ${id}`);
      if (write && selectedIds.has(id)) {
        const { resize, ...encoding } = asset.encoding;
        const input = asset.deliveryRecipe.kind === 'scene-thumbnail'
          ? pending.find(row => row.runtime === asset.source)?.bytes ?? fs.readFileSync(source)
          : fs.readFileSync(source);
        const bytes = await sharp(input).resize(resize.width, resize.height, { fit: resize.fit }).webp(encoding).toBuffer();
        if (hash(bytes) !== asset.runtimeSha256) throw new Error(`Reviewed Sound Beat recipe no longer reproduces: ${id}`);
        pending.push({ output, runtime: `public${asset.runtime}`, bytes });
      }
    }
    if (digest(output) !== asset.runtimeSha256) throw new Error(`Sound Beat delivery changed: ${id}`);
    const meta = await sharp(output).metadata();
    if (meta.width !== asset.width || meta.height !== asset.height) throw new Error(`Sound Beat dimensions changed: ${id}`);
  }
  const moduleText = '// Generated current musical art; authoring receipts and sealed history stay in the source manifest.\nexport const SOUND_BEAT_ART = ' + JSON.stringify(runtimeAssets(manifest.assets), null, 2) + ';\n';
  if (write) {
    for (const { output, bytes } of pending) {
      fs.writeFileSync(`${output}.tmp`, bytes);
      fs.renameSync(`${output}.tmp`, output);
    }
    fs.writeFileSync(dataPath, moduleText);
  } else if (fs.readFileSync(dataPath, 'utf8') !== moduleText) {
    throw new Error('Current Sound Beat runtime metadata differs; run an explicit selected write after reviewing the source manifest.');
  }
  return { assets: Object.keys(manifest.assets).length, checkedVenues: venueIds.size, rewritten: pending.length, metadataOnly: !write, historicalInputsUnchanged: true };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const index = process.argv.indexOf('--asset-ids');
  const selectedIds = index < 0 ? venueIds : new Set(process.argv[index + 1].split(','));
  console.log(JSON.stringify(await buildSoundBeatVenues({ write: process.argv.includes('--write'), selectedIds })));
}

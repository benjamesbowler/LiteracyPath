import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';

// The retained manifest owns measured crop/foot registration. This compiler
// converts coordinates only; it never paints over or substitutes source art.
const root = path.resolve(import.meta.dirname, '../..');
const manifestPath = path.join(root, 'source-art/arcade/physical-worlds/letter-leap/clean-cartoon-manifest.json');
const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const metadataOnly = process.argv.includes('--metadata-only');
// Old source, prompt and manifest bytes remain historical provenance. Only
// explicitly replaced current rows are encoded; future family batches cannot
// silently re-encode an unrelated source or a frozen accepted derivative.
if (hash(await fs.readFile(path.join(root, manifest.historicalManifest.path))) !== manifest.historicalManifest.sha256) {
  throw new Error('Historical Letter Leap manifest changed');
}
const selectedArgument = process.argv.find(value => value.startsWith('--asset-ids='));
const selectedIds = selectedArgument ? new Set(selectedArgument.slice('--asset-ids='.length).split(',')) : null;
if (selectedIds && [...selectedIds].some(id => !manifest.assets.some(asset => asset.id === id && asset.productionRevision))) {
  throw new Error('Scoped Letter Leap build names an unregistered current source');
}
const atlases = {}, foes = {}, scenes = {};
// Measured retained input identity, independent of the original authoring
// checkout name. Absolute raw provenance stays unchanged in the source file.
const retainedAbsoluteReferences = new Map([
  ['docs/design/arcade-concepts-2026-10-03/tower-tumble.png', '1eb5f3202fb99b770a5127513a967411623199605cf22d3a2e73647116813013']
]);
async function publicSceneMetadata(asset) {
  const metadata = { ...asset };
  // Full authoring lineage stays in the checked-in source manifest.
  delete metadata.supersedes;
  delete metadata.generation;
  // Original authoring names and absolute reference paths stay in the retained
  // source manifest. The browser package uses today's product name and exact
  // repository-relative input references, without changing its art contract.
  if (metadata.creator) metadata.creator = metadata.creator.replace(/Literacy(?:\s+)?Path/g, 'Literacy Guide');
  if (metadata.referenceSources) metadata.referenceSources = await Promise.all(metadata.referenceSources.map(async reference => {
    if (!path.isAbsolute(reference)) return reference;
    const verified = [...retainedAbsoluteReferences].find(([relative]) => reference.endsWith('/' + relative));
    if (!verified) throw new Error('Absolute reference has no retained repository identity: ' + asset.id);
    const [relative, expectedHash] = verified;
    const targetBytes = await fs.readFile(path.join(root, relative));
    if (hash(targetBytes) !== expectedHash) throw new Error('Retained reference identity changed: ' + asset.id);
    return relative;
  }));
  return metadata;
}
function measureHead(raw, info, frame) {
  const [left, top, right, bottom] = frame.measurement.bodyBounds;
  const bandBottom = top + Math.ceil((bottom - top) * 0.28);
  const points = [], crown = [];
  for (let y = top; y < bandBottom; y += 1) for (let x = left; x < right; x += 1) {
    if (raw[(y * info.width + x) * info.channels + 3] < 160) continue;
    points.push([x, y]);
    if (y < top + 3) crown.push([x, y]);
  }
  if (!crown.length || !points.length) throw new Error('No opaque head contact: ' + frame.id);
  const [cellX, cellY] = frame.rect;
  const local = point => [point[0] - cellX, point[1] - cellY];
  const leftPoint = points.reduce((a, b) => b[0] < a[0] ? b : a);
  const rightPoint = points.reduce((a, b) => b[0] > a[0] ? b : a);
  const crownCenter = crown.reduce((sum, point) => sum + point[0], 0) / crown.length;
  const crownPoint = crown.filter(point => point[1] === top)
    .reduce((a, b) => Math.abs(b[0] - crownCenter) < Math.abs(a[0] - crownCenter) ? b : a);
  frame.contacts.crown = local(crownPoint);
  frame.contacts.headLeft = local(leftPoint);
  frame.contacts.headRight = local(rightPoint);
  frame.measurement.headContactMethod = 'alpha>=160 actual opaque crown in first 3 body rows and outermost upper 28 percent body pixels';
  frame.measurement.headContactSource = { crown: crownPoint, left: leftPoint, right: rightPoint };
}
for (const asset of manifest.assets) {
  const sourcePath = path.join(root, asset.source);
  const source = await fs.readFile(sourcePath);
  const prompt = await fs.readFile(path.join(path.dirname(manifestPath), asset.prompt));
  const metadata = await sharp(source).metadata();
  if (metadata.width !== asset.sourceSize[0] || metadata.height !== asset.sourceSize[1]) throw new Error('Source dimensions changed: ' + asset.id);
  const runtimePath = path.join(root, 'public', asset.runtime);
  await fs.mkdir(path.dirname(runtimePath), { recursive: true });
  const encode = !metadataOnly && asset.productionRevision && (!selectedIds || selectedIds.has(asset.id));
  const output = !encode ? await fs.readFile(runtimePath)
    : await sharp(source).resize(...asset.runtimeSize, { fit: 'fill' }).webp({ lossless: asset.kind !== 'horizon', quality: 92 }).toBuffer();
  if (!encode) {
    const runtimeInfo = await sharp(output).metadata();
    if (runtimeInfo.width !== asset.runtimeSize[0] || runtimeInfo.height !== asset.runtimeSize[1]
      || hash(output) !== asset.runtimeSha256 || hash(source) !== asset.sourceSha256) throw new Error('Metadata-only source/runtime identity changed: ' + asset.id);
  } else {
    const decoded = await sharp(output).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    if (decoded.info.width !== asset.runtimeSize[0] || decoded.info.height !== asset.runtimeSize[1]) throw new Error('Encoded delivery dimensions changed: ' + asset.id);
    if (asset.kind !== 'horizon' && asset.runtimeSize.every((value, index) => value === asset.sourceSize[index])) {
      const original = await sharp(source).ensureAlpha().raw().toBuffer();
      for (let index = 3; index < original.length; index += 4) if (original[index] !== decoded.data[index]) throw new Error('Encoded silhouette changed: ' + asset.id);
    }
    await fs.writeFile(runtimePath, output);
  }
  asset.sourceSha256 = hash(source);
  asset.promptSha256 = hash(prompt);
  asset.runtimeSha256 = hash(output);
  const [width, height] = asset.runtimeSize;
  const ratioX = width / metadata.width, ratioY = height / metadata.height;
  if (asset.kind === 'character') {
    const { data: raw, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    for (const frame of asset.frames) measureHead(raw, info, frame);
    const heroes = [...new Set(asset.frames.map(frame => frame.hero))];
    for (const hero of heroes) {
      const frames = asset.frames.filter(frame => frame.hero === hero).map(frame => {
        const [left, top, w, h] = frame.rect;
        return {
          id: frame.id, action: frame.action, direction: frame.direction,
          cell: [left * ratioX, top * ratioY, (left + w) * ratioX, (top + h) * ratioY],
          anchor: [frame.anchor[0] * ratioX, frame.anchor[1] * ratioY],
          sockets: Object.fromEntries(Object.entries(frame.contacts).filter(([, point]) => point != null)
            .map(([name, point]) => [name, [(left + point[0]) * ratioX, (top + point[1]) * ratioY]]))
        };
      });
      atlases[`${hero}-${asset.id}`] = {
        width, height, nominalHeight: asset.nominalHeight,
        pixelsPerUnit: (asset.pixelsPerUnitByHero?.[hero] || asset.pixelsPerUnit) * ratioY,
        runtime: asset.runtime, sourceSha256: asset.sourceSha256, frames
      };
    }
  } else {
    scenes[asset.id] = { ...await publicSceneMetadata(asset), width, height };
    if (asset.kind === 'foe') for (const type of Object.keys(asset.pixelsPerUnitByType)) {
      foes[asset.world + '-' + type] = {
        width, height, nominalHeight: asset.nominalHeight,
        pixelsPerUnit: asset.pixelsPerUnitByType[type] * ratioY, runtime: asset.runtime,
        frames: asset.frames.filter(frame => frame.type === type).map(frame => {
          const [left, top, w, h] = frame.rect;
          return { id: frame.id, action: frame.action,
            cell: [left * ratioX, top * ratioY, (left + w) * ratioX, (top + h) * ratioY],
            anchor: [frame.anchor[0] * ratioX, frame.anchor[1] * ratioY],
            sockets: Object.fromEntries(Object.entries(frame.contacts).filter(([, point]) => point != null)
              .map(([name, point]) => [name, [(left + point[0]) * ratioX, (top + point[1]) * ratioY]])) };
        })
      };
    }
  }
}
if (!metadataOnly) await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
await fs.writeFile(path.join(root, 'src/components/learn/games/games/letterLeapArt.generated.js'),
  '// Generated by scripts/art/build-letter-leap-art.mjs from the retained source manifest.\n'
  + `export const LETTER_LEAP_ATLASES = ${JSON.stringify(atlases, null, 2)};\n`
  + `export const LETTER_LEAP_FOE_ATLASES = ${JSON.stringify(foes, null, 2)};\n`
  + `export const LETTER_LEAP_SCENE_ART = ${JSON.stringify(scenes, null, 2)};\n`);
console.log(`Compiled ${Object.keys(atlases).length} registered pose banks and ${Object.keys(scenes).length} scene assets${metadataOnly ? ' without encoding or changing any source/runtime pixels' : ''}.`);

import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
const root = path.resolve(import.meta.dirname, '../..');
const directory = 'source-art/arcade/physical-worlds/word-bridge';
const manifestPath = path.join(root, directory, 'scenery-clean-cartoon-manifest.json');
const destination = path.join(root, 'src/components/learn/games/games/wordBridgeScenery.generated.js');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const read = relative => fs.readFile(path.join(root, relative));
export async function buildWordBridgeHorizons({ metadataOnly = false, registerOnly = false, selectedIds } = {}) {
  const manifest = JSON.parse(await fs.readFile(manifestPath)), atlases = {}, layers = {}, pending = [];
  if (hash(await read(manifest.historicalManifest.path)) !== manifest.historicalManifest.sha256) throw Error('Historical Bridge scenery changed');
  if (hash(await read(`${directory}/${manifest.registration}`)) !== manifest.registrationSha256) throw Error('Current Bridge kit registration changed');
  const horizonIds = new Set(manifest.assets.filter(a => a.kind === 'authored-river-worksite-background-layer').map(a => a.id));
  if (selectedIds && [...selectedIds].some(id => !horizonIds.has(id))) throw Error('Selected horizon build may only encode current horizon IDs; use --kits-only for registered props');
  for (const asset of manifest.assets) {
    const source = await read(asset.source), output = await read(`public${asset.runtime}`), meta = await sharp(output).metadata();
    if (hash(source) !== asset.sourceSha256 || hash(output) !== asset.runtimeSha256 || output.length !== asset.runtimeBytes) throw Error(`Bridge source/delivery changed: ${asset.id}`);
    if (meta.width !== asset.runtimeSize[0] || meta.height !== asset.runtimeSize[1]) throw Error(`Bridge delivered geometry changed: ${asset.id}`);
    if (horizonIds.has(asset.id) && asset.productionRevision) {
      if (hash(await read(`${directory}/${asset.prompt}`)) !== asset.promptSha256) throw Error(`Bridge horizon prompt changed: ${asset.id}`);
      if (!metadataOnly && !registerOnly && (!selectedIds || selectedIds.has(asset.id))) {
        const bytes = await sharp(source).resize(...asset.runtimeSize, { fit: 'fill' }).webp(asset.encoding).toBuffer();
        if (hash(bytes) !== asset.runtimeSha256) throw Error(`Reviewed Bridge horizon recipe no longer reproduces: ${asset.id}`);
        pending.push({ path: path.join(root, `public${asset.runtime}`), bytes });
      }
    }
    if (asset.frames) atlases[asset.id] = { width: asset.sourceSize[0], height: asset.sourceSize[1], nominalHeight: asset.nominalHeight,
      pixelsPerUnit: asset.pixelsPerUnit, runtime: asset.runtime,
      frames: asset.frames.map(({ id, action, direction, cell, anchor, sockets }) => ({ id, action, direction, cell, anchor, sockets })) };
    else layers[asset.world] = asset.runtime;
  }
  if (registerOnly) return { checked: manifest.assets.length, encoded: false, metadataWritten: false };
  const text = '// Generated from original Word Bridge materials/river horizons by scripts/art/build-word-bridge-scenery.mjs.\n'
    + `export const WORD_BRIDGE_SCENERY = ${JSON.stringify(atlases, null, 2)};\nexport const WORD_BRIDGE_HORIZONS = ${JSON.stringify(layers, null, 2)};\n`;
  if (metadataOnly) {
    if (await fs.readFile(destination, 'utf8') !== text) throw Error('Current Bridge metadata differs; explicitly build selected horizons after source review');
  } else {
    for (const row of pending) await fs.writeFile(row.path, row.bytes);
    await fs.writeFile(destination, text);
  }
  return { checked: manifest.assets.length, rewrittenHorizons: pending.length, rewrittenKits: 0, metadataOnly, historicalInputsUnchanged: true };
}

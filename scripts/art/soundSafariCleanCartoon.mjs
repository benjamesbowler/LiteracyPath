import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
const root = path.resolve(import.meta.dirname, '../..');
const manifestPath = path.join(root, 'source-art/arcade/physical-worlds/sound-safari/clean-cartoon-manifest.json');
const destination = path.join(root, 'src/components/learn/games/games/soundSafariArt.generated.js');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const read = relative => fs.readFile(path.join(root, relative));
const alphaAt = ({ data, info }, point) => data[(Math.round(point[1]) * info.width + Math.round(point[0])) * 4 + 3];
export async function buildSoundSafariCleanCartoon({ metadataOnly = false, registerOnly = false, selectedIds } = {}) {
  const manifest = JSON.parse(await fs.readFile(manifestPath));
  for (const lineage of [manifest.historicalManifest, manifest.historicalRegistration, manifest.registration]) {
    if (hash(await read(lineage.path)) !== lineage.sha256) throw Error(`Safari source authority changed: ${lineage.path}`);
  }
  const specs = JSON.parse(await read(manifest.registration.path)).currentSources;
  const assets = new Map(manifest.assets.map(asset => [asset.id, asset]));
  for (const [id, spec] of Object.entries(specs)) for (const [key, value] of Object.entries(spec)) {
    if (JSON.stringify(assets.get(id)?.[key]) !== JSON.stringify(value)) throw Error(`Safari current registration differs: ${id}/${key}`);
  }
  if (selectedIds && [...selectedIds].some(id => !specs[id])) throw Error('Safari selected build names an unregistered current source');
  const atlases = {}, horizons = {}, sizes = {};
  for (const asset of manifest.assets) {
    const bytes = await read(asset.source);
    if (hash(bytes) !== asset.sourceSha256) throw Error(`Safari source changed: ${asset.id}`);
    if (specs[asset.id]) {
      if (hash(await read(asset.prompt)) !== asset.promptSha256) throw Error(`Safari prompt changed: ${asset.id}`);
      const original = await sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      if (original.info.width !== asset.sourceSize[0] || original.info.height !== asset.sourceSize[1]) throw Error(`Safari registered source size differs: ${asset.id}`);
      for (const frame of asset.frames || []) for (const [name, point] of Object.entries(frame.sockets)) {
        if (name !== 'captureCenter' && alphaAt(original, point) < 160) throw Error(`Safari actual source contact missing: ${frame.id}/${name}`);
      }
      if (registerOnly) continue;
      if (!metadataOnly && (!selectedIds || selectedIds.has(asset.id))) {
        const output = await sharp(bytes).webp(asset.encoding).toBuffer();
        const decoded = await sharp(output).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
        for (let i = 3; i < original.data.length; i += 4) if (decoded.data[i] !== original.data[i]) throw Error(`Safari delivered alpha changed: ${asset.id}/${i}`);
        await fs.writeFile(path.join(root, 'public', asset.runtime), output);
        asset.runtimeSize = [...asset.sourceSize]; asset.runtimeSha256 = hash(output); asset.runtimeBytes = output.length;
      }
    }
    if (registerOnly) continue;
    const output = await read(`public${asset.runtime}`), dimensions = await sharp(output).metadata();
    if (hash(output) !== asset.runtimeSha256 || output.length !== asset.runtimeBytes) throw Error(`Safari delivery changed: ${asset.id}`);
    if (dimensions.width !== asset.sourceSize[0] || dimensions.height !== asset.sourceSize[1]) throw Error(`Safari delivered size differs: ${asset.id}`);
    if (asset.frames) atlases[asset.id] = { width: asset.sourceSize[0], height: asset.sourceSize[1], runtime: asset.runtime,
      nominalHeight: asset.nominalHeight, pixelsPerUnit: asset.pixelsPerUnit,
      frames: asset.frames.map(({ id, action, species, direction, cell, anchor, sockets, captureRadius }) =>
        ({ id, action, species, direction, cell, anchor, sockets, captureRadius })) };
    else if (asset.kind === 'authored-background-layer') { horizons[asset.world] = asset.runtime; sizes[asset.world] = asset.sourceSize; }
  }
  if (registerOnly) return { registered: Object.keys(specs).length, encoded: false, metadataWritten: false };
  const text = '// Generated current registered Safari art; authoring receipts and sealed history remain in the source manifest.\n'
    + `export const SOUND_SAFARI_ATLASES = ${JSON.stringify(atlases, null, 2)};\n`
    + `export const SOUND_SAFARI_HORIZONS = ${JSON.stringify(horizons, null, 2)};\n`
    + `export const SOUND_SAFARI_HORIZON_SIZES = ${JSON.stringify(sizes, null, 2)};\n`;
  if (metadataOnly) {
    if (await fs.readFile(destination, 'utf8') !== text) throw Error('Current Safari runtime differs; run an explicit selected build after review');
  } else { await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n'); await fs.writeFile(destination, text); }
  return { assets: assets.size, currentSources: Object.keys(specs).length, metadataOnly, untouchedHistoricalInputs: true };
}

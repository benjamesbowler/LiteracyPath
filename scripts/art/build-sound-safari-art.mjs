import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';

// Measure original source pixels before compilation. --register-only performs
// no encoding and never writes a runtime delivery claim or runtime module.
const root = path.resolve(import.meta.dirname, '../..');
const directory = 'source-art/arcade/physical-worlds/sound-safari';
const configurationPath = path.join(root, directory, 'registration.json');
const configuration = JSON.parse(await fs.readFile(configurationPath, 'utf8'));
const manifestPath = path.join(root, directory, 'manifest.json');
const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
const registerOnly = process.argv.includes('--register-only');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const atlases = {};
const compilationStart = performance.now();
const timed = (asset, stage, start) => console.log(JSON.stringify({ event: 'asset-stage', asset, stage,
  durationMs: performance.now() - start, elapsedMs: performance.now() - compilationStart }));

// Source-only controller preparation. Verify retained bytes, but do not encode
// pixels or change the source manifest's still-pending delivery status.
if (process.argv.includes('--metadata-only')) {
  const horizons = {}, sizes = {};
  for (const asset of manifest.assets) {
    const bytes = await fs.readFile(path.join(root, asset.source));
    if (hash(bytes) !== asset.sourceSha256) throw Error(`${asset.id}: retained source identity changed`);
    const kind = asset.kind === 'authored-background-layer' || asset.id === 'nets-v2' ? 'scenery' : 'characters';
    const runtime = `/game-assets/physical-arcade/sound-safari/${kind}/${path.basename(asset.source, '.png')}.webp`;
    if (asset.frames) atlases[asset.id] = { width: asset.sourceSize[0], height: asset.sourceSize[1], runtime,
      nominalHeight: asset.nominalHeight, pixelsPerUnit: asset.pixelsPerUnit,
      frames: asset.frames.map(({ id, action, species, direction, cell, anchor, sockets, captureRadius }) =>
        ({ id, action, species, direction, cell, anchor, sockets, captureRadius })) };
    else if (asset.kind === 'authored-background-layer') { horizons[asset.world] = runtime; sizes[asset.world] = asset.sourceSize; }
  }
  await fs.writeFile(path.join(root, 'src/components/learn/games/games/soundSafariArt.generated.js'),
    '// Generated registered source metadata; planned runtime URLs remain unavailable until owned encoding.\n' +
    `export const SOUND_SAFARI_ATLASES = ${JSON.stringify(atlases, null, 2)};\n` +
    `export const SOUND_SAFARI_HORIZONS = ${JSON.stringify(horizons, null, 2)};\n` +
    `export const SOUND_SAFARI_HORIZON_SIZES = ${JSON.stringify(sizes, null, 2)};\n`);
  console.log(JSON.stringify({ compiled: false, metadataOnly: true, runtimeAcceptance: 'PENDING' }));
  process.exit(0);
}

function alpha(data, info, [x, y]) {
  const px = Math.round(x), py = Math.round(y);
  return px >= 0 && py >= 0 && px < info.width && py < info.height ? data[(py * info.width + px) * 4 + 3] : 0;
}

function bodies(data, info) {
  const seen = new Uint8Array(info.width * info.height), components = [];
  for (let seed = 0; seed < seen.length; seed++) {
    if (seen[seed] || data[seed * 4 + 3] < 160) continue;
    const queue = [seed]; seen[seed] = 1;
    let left = info.width, top = info.height, right = 0, bottom = 0;
    for (let i = 0; i < queue.length; i++) {
      const point = queue[i], x = point % info.width, y = Math.floor(point / info.width);
      left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x + 1); bottom = Math.max(bottom, y + 1);
      for (const next of [x > 0 ? point - 1 : -1, x < info.width - 1 ? point + 1 : -1, y > 0 ? point - info.width : -1, y < info.height - 1 ? point + info.width : -1]) {
        if (next >= 0 && !seen[next] && data[next * 4 + 3] >= 160) { seen[next] = 1; queue.push(next); }
      }
    }
    if (queue.length > 3000) components.push({ left, top, right, bottom, area: queue.length, pixels: queue });
  }
  if (components.length !== 6) throw Error(`Expected six independent whole bodies; found ${components.length}`);
  components.sort((a, b) => (a.top + a.bottom) - (b.top + b.bottom));
  return [0, 2, 4].flatMap(index => components.slice(index, index + 2).sort((a, b) => a.left - b.left));
}

function cropFor(body, others, info) {
  const cell = [Math.max(0, body.left - 7), Math.max(0, body.top - 7), Math.min(info.width, body.right + 7), Math.min(info.height, body.bottom + 7)];
  const intrusion = others.reduce((sum, other) => sum + (other === body ? 0 : other.pixels.filter(point => {
    const x = point % info.width, y = Math.floor(point / info.width);
    return x >= cell[0] && x < cell[2] && y >= cell[1] && y < cell[3];
  }).length), 0);
  if (intrusion) throw Error(`Measured crop contains ${intrusion} opaque pixels from another body`);
  return cell;
}

function sole(data, info, region) {
  const [left, right, top, bottom] = region;
  let low = -1; const pixels = [];
  for (let y = top; y < Math.min(bottom, info.height); y++) for (let x = left; x < Math.min(right, info.width); x++) {
    if (alpha(data, info, [x, y]) >= 160) { low = Math.max(low, y); pixels.push([x, y]); }
  }
  if (low < 0) throw Error('Inspected sole region has no actual opaque boot');
  const band = pixels.filter(([, y]) => y >= low - 2);
  const centroid = band.reduce((sum, [x]) => sum + x, 0) / band.length;
  return pixels.filter(([, y]) => y === low).sort((a, b) => Math.abs(a[0] - centroid) - Math.abs(b[0] - centroid))[0];
}

async function original(file, kind) {
  let stage = performance.now();
  const source = `${directory}/${kind}/${file}.png`, bytes = await fs.readFile(path.join(root, source));
  timed(file, 'source-read', stage); stage = performance.now();
  const { data, info } = await sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  timed(file, 'PNG-decode', stage);
  if (data[3] > 1) throw Error(`${file}: source requires genuine transparent alpha`);
  return { source, bytes, data, info };
}

async function admit(id, originalSource, frames, pixelsPerUnit, kind) {
  const { bytes, info } = originalSource;
  const asset = manifest.assets.find(row => row.id === id);
  if (!asset || asset.sourceSha256 !== hash(bytes)) throw Error(`${id}: original source does not match retained provenance`);
  asset.frames = frames;
  asset.nominalHeight = 2.2;
  asset.pixelsPerUnit = pixelsPerUnit;
  asset.registration = 'registration.json';
  asset.registrationSha256 = hash(await fs.readFile(configurationPath));
  asset.sourceRegistration = { method: 'Whole-body alpha>=160 bounds with 7px filtering gutter; directly inspected visible contacts; no hidden hand or flying-foot invention', frames: frames.length, foreignOpaqueCropPixels: 0 };
  if (registerOnly) return;
  const runtime = `/game-assets/physical-arcade/sound-safari/${kind}/${path.basename(originalSource.source, '.png')}.webp`;
  let stage = performance.now();
  const output = await sharp(bytes).webp({ quality: 90, alphaQuality: 100, effort: 6 }).toBuffer();
  timed(id, 'WebP-encode-q90-alpha100-effort6', stage); stage = performance.now();
  const delivered = await sharp(output).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (delivered.info.width !== info.width || delivered.info.height !== info.height || delivered.data[3] > 1) {
    throw Error(`${id}: delivered dimensions or transparent corner differ from registered source`);
  }
  for (let pixel = 3; pixel < originalSource.data.length; pixel += 4) {
    if (delivered.data[pixel] !== originalSource.data[pixel]) throw Error(`${id}: original silhouette alpha changed at pixel ${(pixel - 3) / 4}`);
  }
  for (const frame of frames) for (const [name, point] of Object.entries(frame.sockets)) {
    if (name === 'captureCenter') continue; // A geometric rim/silhouette centre may be transparent.
    if (alpha(delivered.data, delivered.info, point) < 160) throw Error(`${frame.id}/${name}: delivered contact is not the registered visible opaque source`);
  }
  timed(id, 'decoded-runtime-dimensions-alpha-contacts', stage); stage = performance.now();
  const runtimePath = path.join(root, 'public', runtime);
  await fs.mkdir(path.dirname(runtimePath), { recursive: true });
  await fs.writeFile(runtimePath, output);
  timed(id, 'runtime-write', stage);
  asset.runtime = runtime;
  asset.runtimeSize = [info.width, info.height];
  asset.runtimeSha256 = hash(output);
  asset.runtimeBytes = output.length;
  asset.derivative = 'Same dimensions; exact every-pixel source alpha; RGB WebP quality90/alphaQuality100; original PNG and source-pixel registration retained';
  atlases[id] = { width: info.width, height: info.height, runtime, nominalHeight: 2.2, pixelsPerUnit,
    frames: frames.map(({ id: frameId, action, species, direction, cell, anchor, sockets, captureRadius }) => ({ id: frameId, action, species, direction, cell, anchor, sockets, captureRadius })) };
}

for (const spec of configuration.operators) {
  const assetStart = performance.now();
  const input = await original(spec.file, 'characters');
  const registrationStart = performance.now();
  const rows = bodies(input.data, input.info);
  const frames = spec.frames.map((measurement, index) => {
    const body = rows[index], cell = cropFor(body, rows, input.info);
    const bootLeft = sole(input.data, input.info, measurement.boots[0]);
    const bootRight = sole(input.data, input.info, measurement.boots[1]);
    const sockets = { feet: bootLeft[1] >= bootRight[1] ? bootLeft : bootRight, bootLeft, bootRight,
      nearHand: measurement.hands[0], farHand: measurement.hands[1] };
    for (const [name, point] of Object.entries(sockets)) {
      if (alpha(input.data, input.info, point) < 160 || point[0] < cell[0] || point[0] >= cell[2] || point[1] < cell[1] || point[1] >= cell[3]) {
        throw Error(`${spec.file}/${measurement.action}: ${name} must be an actual opaque contact inside its own body`);
      }
    }
    return { id: `${spec.hero}-${measurement.action}`, action: measurement.action, direction: 'right', cell,
      anchor: [measurement.axis - cell[0], Math.max(bootLeft[1], bootRight[1]) - cell[1]], sockets,
      measurement: { opaqueBodyBounds: [body.left, body.top, body.right, body.bottom], bootRegions: measurement.boots, torsoAxisSourceX: measurement.axis,
        method: 'Visible brown hoof/palm pixels directly inspected; last opaque sole row nearest lower3-row centroid' } };
  });
  timed(spec.id, 'whole-body-crop-sole-palm-registration', registrationStart);
  await admit(spec.id, input, frames, (rows[0].bottom - rows[0].top) / spec.nominalHeight, 'characters');
  timed(spec.id, 'asset-total', assetStart);
}

for (const spec of configuration.wildlife) {
  const assetStart = performance.now();
  const input = await original(spec.file, 'characters');
  const registrationStart = performance.now();
  const rows = bodies(input.data, input.info);
  const frames = rows.map((body, index) => {
    const cell = cropFor(body, rows, input.info), species = spec.species[Math.floor(index / 2)];
    const captureCenter = [(body.left + body.right) / 2, (body.top + body.bottom) / 2];
    return { id: `${species}-${index % 2 ? 'travel' : 'idle'}`, species, action: index % 2 ? 'travel' : 'idle', direction: 'right', cell,
      anchor: [captureCenter[0] - cell[0], captureCenter[1] - cell[1]], sockets: { captureCenter },
      captureRadius: Math.max(body.right - body.left, body.bottom - body.top) / 2,
      measurement: { opaqueBodyBounds: [body.left, body.top, body.right, body.bottom], method: 'Actual whole silhouette capture centre, including flight wings; no sole or hand sockets invented' } };
  });
  timed(spec.id, 'whole-silhouette-crop-capture-registration', registrationStart);
  await admit(spec.id, input, frames, 200, 'characters');
  timed(spec.id, 'asset-total', assetStart);
}

{
  const assetStart = performance.now();
  const spec = configuration.nets, input = await original(spec.file, 'scenery');
  const registrationStart = performance.now();
  const frames = spec.frames.map(row => {
    const [x, y, width, height] = row.region;
    if (alpha(input.data, input.info, row.connector) < 160) throw Error(`${row.world}: connector must be an inspected actual opaque tool pixel`);
    return { id: `${row.world}-net`, world: row.world, action: 'rim', cell: [x, y, x + width, y + height],
      anchor: [row.captureCenter[0] - x, row.captureCenter[1] - y], sockets: { captureCenter: row.captureCenter, connector: row.connector }, captureRadius: row.outerRadius,
      measurement: { method: 'Source-inspected circular outer rim, transparent capture interior and opaque lower connector; connector is separate from centre' } };
  });
  timed(spec.id, 'rim-centre-opaque-connector-registration', registrationStart);
  await admit(spec.id, input, frames, 292 / 1.1, 'scenery');
  timed(spec.id, 'asset-total', assetStart);
}

if (!registerOnly) {
  for (const asset of manifest.assets.filter(row => row.kind === 'authored-background-layer')) {
    const assetStart = performance.now(); let stage = assetStart;
    const bytes = await fs.readFile(path.join(root, asset.source));
    if (hash(bytes) !== asset.sourceSha256) throw Error(`${asset.id}: retained background source identity changed`);
    timed(asset.id, 'source-read-and-SHA', stage); stage = performance.now();
    const output = await sharp(bytes).webp({ quality: 90, effort: 6 }).toBuffer();
    timed(asset.id, 'horizon-WebP-q90-effort6', stage); stage = performance.now();
    const dimensions = await sharp(output).metadata();
    if (dimensions.width !== asset.sourceSize[0] || dimensions.height !== asset.sourceSize[1]) throw Error(`${asset.id}: horizon dimensions differ from authored layer`);
    timed(asset.id, 'decoded-runtime-dimensions', stage); stage = performance.now();
    const runtime = `/game-assets/physical-arcade/sound-safari/scenery/${path.basename(asset.source, '.png')}.webp`;
    await fs.mkdir(path.dirname(path.join(root, 'public', runtime)), { recursive: true });
    await fs.writeFile(path.join(root, 'public', runtime), output);
    timed(asset.id, 'runtime-write', stage);
    asset.runtime = runtime; asset.runtimeSize = asset.sourceSize; asset.runtimeBytes = output.length; asset.runtimeSha256 = hash(output);
    timed(asset.id, 'asset-total', assetStart);
  }
  await fs.writeFile(path.join(root, 'src/components/learn/games/games/soundSafariArt.generated.js'),
    '// Generated from original registered Safari sources by scripts/art/build-sound-safari-art.mjs.\n' +
    `export const SOUND_SAFARI_ATLASES = ${JSON.stringify(atlases, null, 2)};\n` +
    `export const SOUND_SAFARI_HORIZONS = ${JSON.stringify(Object.fromEntries(manifest.assets.filter(row => row.kind === 'authored-background-layer').map(row => [row.world, row.runtime])), null, 2)};\n` +
    `export const SOUND_SAFARI_HORIZON_SIZES = ${JSON.stringify(Object.fromEntries(manifest.assets.filter(row => row.kind === 'authored-background-layer').map(row => [row.world, row.sourceSize])), null, 2)};\n`);
}
manifest.registration = 'registration.json';
manifest.registrationSha256 = hash(await fs.readFile(configurationPath));
await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify({ compiled: !registerOnly, registeredFrames: Object.values(manifest.assets).reduce((sum, asset) => sum + (asset.frames?.length || 0), 0), runtimeAcceptance: manifest.review.runtimeAcceptance }));

import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';

const root = path.resolve(import.meta.dirname, '../..');
const directory = 'source-art/arcade/physical-worlds/sentence-express';
const configurationBytes = await fs.readFile(path.join(root, directory, 'registration.json'));
const configuration = JSON.parse(configurationBytes);
const manifestPath = path.join(root, directory, 'manifest.json');
const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
const registerOnly = process.argv.includes('--register-only');
const profileOne = process.argv.find(argument => argument.startsWith('--profile-one='))?.slice('--profile-one='.length);
if (profileOne && !manifest.assets.some(asset => asset.id === profileOne)) throw Error(`Unknown actual source asset ${profileOne}`);
const compilationStart = performance.now();
const timed = (asset, stage, started) => console.log(JSON.stringify({ event: 'asset-stage', asset, stage,
  durationMs: performance.now() - started, elapsedMs: performance.now() - compilationStart }));
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const atlases = {};
const yards = {};
const alpha = (data, info, [x, y]) => x >= 0 && y >= 0 && x < info.width && y < info.height ? data[(Math.round(y) * info.width + Math.round(x)) * 4 + 3] : 0;

async function original(file, kind, assetId) {
  const started = performance.now();
  const source = `${directory}/${kind}/${file}.png`, bytes = await fs.readFile(path.join(root, source));
  const { data, info } = await sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (data[3] > 1) throw Error(`${file}: original background is not genuine alpha`);
  timed(assetId, 'source-read-and-PNG-decode', started);
  return { source, bytes, data, info };
}

function bodies(input, expected) {
  const { data, info } = input, seen = new Uint8Array(info.width * info.height), components = [];
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
    if (queue.length > 3000) components.push({ left, top, right, bottom, pixels: queue });
  }
  if (components.length !== expected) throw Error(`${input.source}: expected ${expected} independent whole bodies/locations, found ${components.length}`);
  components.sort((a, b) => (a.top + a.bottom) - (b.top + b.bottom));
  return Array.from({ length: expected / 2 }, (_, row) => components.slice(row * 2, row * 2 + 2).sort((a, b) => a.left - b.left)).flat();
}

function completeCrop(body, others, info) {
  // Keep whole real source bodies. Filtering padding may overlap transparent
  // gutters, but it must never import pixels from a neighbouring sprite.
  for (let gutter = 7; gutter >= 0; gutter--) {
    const cell = [Math.max(0, body.left - gutter), Math.max(0, body.top - gutter), Math.min(info.width, body.right + gutter), Math.min(info.height, body.bottom + gutter)];
    const foreign = others.some(other => other !== body && other.pixels.some(point => {
      const x = point % info.width, y = Math.floor(point / info.width);
      return x >= cell[0] && x < cell[2] && y >= cell[1] && y < cell[3];
    }));
    if (!foreign) return { cell, gutter };
  }
  throw Error('Complete source silhouettes overlap; original spacing must be repaired before runtime admission');
}

function sole(input, [left, right, top, bottom]) {
  let low = -1; const pixels = [];
  for (let y = top; y < Math.min(bottom, input.info.height); y++) for (let x = left; x < Math.min(right, input.info.width); x++) {
    if (alpha(input.data, input.info, [x, y]) >= 160) { low = Math.max(low, y); pixels.push([x, y]); }
  }
  if (low < 0) throw Error('Inspected boot has no actual opaque sole');
  const band = pixels.filter(([, y]) => y >= low - 2), centroid = band.reduce((sum, [x]) => sum + x, 0) / band.length;
  return pixels.filter(([, y]) => y === low).sort((a, b) => Math.abs(a[0] - centroid) - Math.abs(b[0] - centroid))[0];
}

function requireContacts(input, frame) {
  for (const [name, point] of Object.entries(frame.sockets)) {
    if (alpha(input.data, input.info, point) < 160 || point[0] < frame.cell[0] || point[0] >= frame.cell[2] || point[1] < frame.cell[1] || point[1] >= frame.cell[3]) {
      throw Error(`${frame.id}/${name}: requires actual opaque original contact inside its own crop`);
    }
  }
}

async function admit(spec, input, frames, nominalHeight, pixelsPerUnit, kind) {
  const asset = manifest.assets.find(row => row.id === spec.id);
  if (!asset || hash(input.bytes) !== asset.sourceSha256
    || input.info.width !== asset.sourceSize[0] || input.info.height !== asset.sourceSize[1]) {
    throw Error(`${spec.id}: original differs from retained provenance`);
  }
  asset.frames = frames; asset.nominalHeight = nominalHeight; asset.pixelsPerUnit = pixelsPerUnit;
  asset.registration = 'registration.json'; asset.registrationSha256 = hash(configurationBytes);
  if (registerOnly) return;
  const runtime = `/game-assets/physical-arcade/sentence-express/${kind}/${spec.file}.webp`;
  const encodingStart = performance.now();
  const output = await sharp(input.bytes).webp({ quality: 90, alphaQuality: 100, effort: 6 }).toBuffer();
  timed(spec.id, 'WebP-quality90-alpha100-effort6-encode', encodingStart);
  const writeStart = performance.now();
  await fs.mkdir(path.dirname(path.join(root, 'public', runtime)), { recursive: true });
  await fs.writeFile(path.join(root, 'public', runtime), output);
  timed(spec.id, 'runtime-write', writeStart);
  asset.runtime = runtime; asset.runtimeSize = [input.info.width, input.info.height]; asset.runtimeSha256 = hash(output); asset.runtimeBytes = output.length;
  asset.derivative = 'Same dimensions WebP quality90/alphaQuality100; original PNG, prompts and measured source registration retained';
  atlases[spec.id] = { width: input.info.width, height: input.info.height, runtime, nominalHeight, pixelsPerUnit,
    frames: frames.map(({ id, action, direction, cell, anchor, sockets }) => ({ id, action, direction, cell, anchor, sockets })) };
}

for (const spec of configuration.conductors) {
  if (profileOne && spec.id !== profileOne) continue;
  const input = await original(spec.file, 'characters', spec.id), scanStart = performance.now(), rows = bodies(input, 6);
  timed(spec.id, 'whole-body-component-scan', scanStart);
  const registrationStart = performance.now();
  const frames = spec.frames.map((measurement, index) => {
    const body = rows[index], { cell, gutter } = completeCrop(body, rows, input.info);
    const bootLeft = sole(input, measurement.boots[0]), bootRight = sole(input, measurement.boots[1]);
    const frame = { id: `${spec.hero}-${measurement.action}`, action: measurement.action, direction: 'right', cell,
      anchor: [measurement.axis - cell[0], Math.max(bootLeft[1], bootRight[1]) - cell[1]],
      sockets: { feet: bootLeft[1] >= bootRight[1] ? bootLeft : bootRight, bootLeft, bootRight, nearHand: measurement.hands[0], farHand: measurement.hands[1] },
      measurement: { opaqueBodyBounds: [body.left, body.top, body.right, body.bottom], gutter, foreignOpaqueCropPixels: 0,
        method: 'Actual visible palms and two boot soles; whole independent original pose; source forearm/coupling contact calibration remains native-pending' } };
    requireContacts(input, frame); return frame;
  });
  timed(spec.id, 'complete-crop-sole-and-palm-validation', registrationStart);
  await admit(spec, input, frames, spec.nominalHeight, (rows[0].bottom - rows[0].top) / spec.nominalHeight, 'characters');
}

for (const spec of configuration.stops) {
  if (profileOne && spec.id !== profileOne) continue;
  const input = await original(spec.file, 'scenery', spec.id), scanStart = performance.now(), rows = bodies(input, 4);
  timed(spec.id, 'whole-location-component-scan', scanStart);
  const registrationStart = performance.now();
  const frames = rows.map((body, index) => {
    if (body.left <= 0 || body.top <= 0 || body.right >= input.info.width || body.bottom >= input.info.height) throw Error(`${spec.file}/${spec.names[index]}: original silhouette touches source edge`);
    const { cell, gutter } = completeCrop(body, rows, input.info), axis = (body.left + body.right) / 2;
    const ground = body.pixels.map(point => [point % input.info.width, Math.floor(point / input.info.width)])
      .filter(([, y]) => y === body.bottom - 1).sort((a, b) => Math.abs(a[0] - axis) - Math.abs(b[0] - axis))[0];
    const frame = { id: spec.names[index], action: spec.names[index], direction: 'side-three-quarter', cell,
      anchor: [ground[0] - cell[0], ground[1] - cell[1]], sockets: { ground },
      measurement: { opaqueBodyBounds: [body.left, body.top, body.right, body.bottom], gutter, foreignOpaqueCropPixels: 0,
        method: 'Complete isolated actual location alpha body; decorative ground attachment only, no guessed live rail/deck contact' } };
    requireContacts(input, frame); return frame;
  });
  timed(spec.id, 'complete-location-crop-and-ground-validation', registrationStart);
  await admit(spec, input, frames, 4.5, (rows[0].bottom - rows[0].top) / 4.5, 'scenery');
}

// These whole railway landscapes have their own original composition. The
// independent station layers above provide foreground depth during the real
// train journey; a panorama never supplies an invented live rail/coupler.
for (const asset of manifest.assets.filter(row => row.kind === 'authored-railway-yard-layer')) {
  if (profileOne && asset.id !== profileOne) continue;
  const validationStart = performance.now();
  const bytes = await fs.readFile(path.join(root, asset.source));
  const promptBytes = await fs.readFile(path.join(root, asset.prompt));
  const info = await sharp(bytes).metadata();
  if (hash(bytes) !== asset.sourceSha256 || hash(promptBytes) !== asset.promptSha256
    || info.width !== asset.sourceSize[0] || info.height !== asset.sourceSize[1]) {
    throw Error(`${asset.id}: whole original railway layer or prompt differs from retained provenance`);
  }
  timed(asset.id, 'whole-source-and-prompt-identity-validation', validationStart);
  if (registerOnly) continue;
  const runtime = `/game-assets/physical-arcade/sentence-express/scenery/${path.basename(asset.source, '.png')}.webp`;
  const encodingStart = performance.now();
  const output = await sharp(bytes).webp({ quality: 88, effort: 6 }).toBuffer();
  timed(asset.id, 'whole-PNG-decode-and-WebP-quality88-effort6-encode', encodingStart);
  const writeStart = performance.now();
  await fs.mkdir(path.dirname(path.join(root, 'public', runtime)), { recursive: true });
  await fs.writeFile(path.join(root, 'public', runtime), output);
  timed(asset.id, 'runtime-write', writeStart);
  asset.runtime = runtime; asset.runtimeSize = [info.width, info.height];
  asset.runtimeSha256 = hash(output); asset.runtimeBytes = output.length;
  asset.derivative = 'Whole same-dimensions WebP quality88; original composition, PNG and prompt retained';
  yards[asset.world] = { runtime, width: info.width, height: info.height, sourceSha256: asset.sourceSha256 };
}

if (!registerOnly && !profileOne) await fs.writeFile(path.join(root, 'src/components/learn/games/games/sentenceExpressArt.generated.js'),
  '// Generated from original conductor/location sources by scripts/art/build-sentence-express-art.mjs.\n' +
  `export const SENTENCE_EXPRESS_ATLASES = ${JSON.stringify(atlases, null, 2)};\n` +
  `export const SENTENCE_EXPRESS_YARDS = ${JSON.stringify(yards, null, 2)};\n`);
manifest.registration = 'registration.json'; manifest.registrationSha256 = hash(configurationBytes);
// A diagnostic single-asset encode cannot admit a partial catalogue or stamp
// the complete nine-file manifest. All source/alpha/contact checks stay active.
if (!profileOne) await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify({ compiled: !registerOnly && !profileOne, diagnosticAsset: profileOne || null,
  registeredFrames: manifest.assets.reduce((sum, asset) => sum + (asset.frames?.length || 0), 0), runtimeAcceptance: manifest.review.runtimeAcceptance }));

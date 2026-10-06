import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';

const root = path.resolve(import.meta.dirname, '../..');
const directory = 'source-art/arcade/physical-worlds/star-gallery';
const configurationPath = path.join(root, directory, 'registration.json');
const configurationBytes = await fs.readFile(configurationPath);
const configuration = JSON.parse(configurationBytes);
const manifestPath = path.join(root, directory, 'manifest.json');
const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
const registerOnly = process.argv.includes('--register-only');
const metadataOnly = process.argv.includes('--metadata-only');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const atlases = {};
const compilationStart = performance.now();
const timed = (asset, stage, start) => console.log(JSON.stringify({ event: 'asset-stage', asset, stage,
  durationMs: performance.now() - start, elapsedMs: performance.now() - compilationStart }));
const alpha = (data, info, [x, y]) => x >= 0 && y >= 0 && x < info.width && y < info.height ? data[(Math.round(y) * info.width + Math.round(x)) * 4 + 3] : 0;

function metadata(asset, frames, runtime) {
  return { width: asset.sourceSize[0], height: asset.sourceSize[1], nominalHeight: asset.nominalHeight,
    pixelsPerUnit: asset.pixelsPerUnit, runtime,
    frames: frames.map(({ id, action, direction, cell, anchor, sockets }) => ({ id, action, direction, cell, anchor, sockets })) };
}

async function writeMetadata() {
  await fs.writeFile(path.join(root, 'src/components/learn/games/games/starGalleryArt.generated.js'),
    '// Generated from retained original garden driver/cut/regrowth registration by scripts/art/build-star-gallery-art.mjs.\n' +
    '// Runtime URLs identify owned derivatives; only actual decoded delivery admits their rendered use.\n' +
    `export const STAR_GALLERY_ATLASES = ${JSON.stringify(atlases, null, 2)};\n`);
}

// Prepare the real controller seam without encoding pixels or changing source
// registration/admission. The full build below independently remeasures every
// crop/contact and validates the delivered WebP before admitting its identity.
if (metadataOnly) {
  if (registerOnly) throw Error('Choose metadata-only or register-only, not both');
  const registrationSha256 = hash(configurationBytes);
  if (manifest.registration !== 'registration.json' || manifest.registrationSha256 !== registrationSha256) {
    throw Error('Retained Grove registration does not match its source manifest');
  }
  const specifications = [
    ...configuration.drivers.map(spec => ({ ...spec, kind: 'characters', frameCount: 6 })),
    ...configuration.kits.map(spec => ({ ...spec, kind: 'scenery', frameCount: 4 }))
  ];
  for (const spec of specifications) {
    const asset = manifest.assets.find(row => row.id === spec.id);
    if (!asset || asset.registrationSha256 !== registrationSha256 || asset.frames?.length !== spec.frameCount
      || !Number.isFinite(asset.pixelsPerUnit) || asset.pixelsPerUnit <= 0 || asset.nominalHeight !== (spec.nominalHeight || 4.7)) {
      throw Error(`${spec.id}: retained registered metadata is missing or inconsistent`);
    }
    for (const [reference, expected] of [[asset.source, asset.sourceSha256], [asset.prompt, asset.promptSha256]]) {
      if (!reference?.startsWith(`${directory}/`) || hash(await fs.readFile(path.join(root, reference))) !== expected) {
        throw Error(`${spec.id}: retained source or prompt identity changed`);
      }
    }
    const runtime = `/game-assets/physical-arcade/star-gallery/${spec.kind}/${spec.file}.webp`;
    atlases[spec.id] = metadata(asset, asset.frames, runtime);
  }
  await writeMetadata();
  console.log(JSON.stringify({ compiled: false, metadataOnly: true, runtimeAcceptance: manifest.review.runtimeAcceptance,
    registeredFrames: Object.values(atlases).reduce((sum, atlas) => sum + atlas.frames.length, 0) }));
  process.exit(0);
}

async function original(file, kind) {
  let stage = performance.now();
  const source = `${directory}/${kind}/${file}.png`, bytes = await fs.readFile(path.join(root, source));
  timed(file, 'source-read', stage); stage = performance.now();
  const { data, info } = await sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  timed(file, 'PNG-decode', stage);
  if (data[3] > 1) throw Error(`${file}: source has no genuine corner alpha`);
  return { source, bytes, data, info };
}

function connectedBodies(data, info) {
  const seen = new Uint8Array(info.width * info.height), rows = [];
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
    if (queue.length > 3000) rows.push({ left, top, right, bottom, pixels: queue });
  }
  if (rows.length !== 6) throw Error(`Expected six complete driver bodies; found ${rows.length}`);
  rows.sort((a, b) => (a.top + a.bottom) - (b.top + b.bottom));
  return [0, 2, 4].flatMap(index => rows.slice(index, index + 2).sort((a, b) => a.left - b.left));
}

function requireContacts(input, frame) {
  for (const [name, point] of Object.entries(frame.sockets)) {
    if (alpha(input.data, input.info, point) < 160 || point[0] < frame.cell[0] || point[0] >= frame.cell[2] || point[1] < frame.cell[1] || point[1] >= frame.cell[3]) {
      throw Error(`${frame.id}/${name}: contact must be inspected opaque source anatomy/geometry within its own crop`);
    }
  }
}

async function admit(spec, input, frames, nominalHeight, pixelsPerUnit, kind) {
  const asset = manifest.assets.find(row => row.id === spec.id);
  if (!asset || asset.sourceSha256 !== hash(input.bytes)) throw Error(`${spec.id}: original source identity does not match provenance`);
  if (asset.sourceSize?.[0] !== input.info.width || asset.sourceSize?.[1] !== input.info.height) {
    throw Error(`${spec.id}: retained source dimensions differ from decoded original`);
  }
  asset.frames = frames; asset.nominalHeight = nominalHeight; asset.pixelsPerUnit = pixelsPerUnit;
  asset.registration = 'registration.json'; asset.registrationSha256 = hash(configurationBytes);
  asset.attachment = kind === 'characters' ? 'Actual source seat/belt anchor and visible measured hands; no invented lower body or foot contacts' : 'Actual ground attachment and tree-bark cut contact; live text and cutter remain separate';
  if (registerOnly) return;
  const runtime = `/game-assets/physical-arcade/star-gallery/${kind}/${spec.file}.webp`;
  let stage = performance.now();
  const output = await sharp(input.bytes).webp({ quality: 90, alphaQuality: 100, effort: 6 }).toBuffer();
  timed(spec.id, 'WebP-encode-q90-alpha100-effort6', stage); stage = performance.now();
  const delivered = await sharp(output).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (delivered.info.width !== input.info.width || delivered.info.height !== input.info.height || delivered.data[3] > 1) {
    throw Error(`${spec.id}: delivered dimensions or transparent corner differ from registered source`);
  }
  for (let pixel = 3; pixel < input.data.length; pixel += 4) {
    if (delivered.data[pixel] !== input.data[pixel]) throw Error(`${spec.id}: original silhouette alpha changed at pixel ${(pixel - 3) / 4}`);
  }
  for (const frame of frames) requireContacts(delivered, frame);
  timed(spec.id, 'decoded-runtime-dimensions-alpha-contacts', stage); stage = performance.now();
  await fs.mkdir(path.dirname(path.join(root, 'public', runtime)), { recursive: true });
  await fs.writeFile(path.join(root, 'public', runtime), output);
  timed(spec.id, 'runtime-write', stage);
  asset.runtime = runtime; asset.runtimeSize = [input.info.width, input.info.height]; asset.runtimeSha256 = hash(output); asset.runtimeBytes = output.length;
  asset.derivative = 'Same dimensions; exact every-pixel source alpha; RGB WebP quality90/alphaQuality100; original PNG, prompt and source-pixel registration retained';
  atlases[spec.id] = metadata(asset, frames, runtime);
}

for (const spec of configuration.drivers) {
  const assetStart = performance.now();
  const input = await original(spec.file, 'characters');
  const registrationStart = performance.now();
  const bodies = connectedBodies(input.data, input.info);
  const frames = spec.frames.map((measurement, index) => {
    const body = bodies[index], cell = [Math.max(0, body.left - 7), Math.max(0, body.top - 7), Math.min(input.info.width, body.right + 7), Math.min(input.info.height, body.bottom + 7)];
    for (const other of bodies.filter(row => row !== body)) {
      if (other.pixels.some(point => { const x = point % input.info.width, y = Math.floor(point / input.info.width); return x >= cell[0] && x < cell[2] && y >= cell[1] && y < cell[3]; })) {
        throw Error(`${spec.file}/${measurement.action}: crop includes foreign driver anatomy`);
      }
    }
    const frame = { id: `${spec.hero}-${measurement.action}`, action: measurement.action, direction: 'rear', cell,
      anchor: [measurement.seat[0] - cell[0], measurement.seat[1] - cell[1]],
      sockets: { seat: measurement.seat, leftHand: measurement.hands[0], rightHand: measurement.hands[1] },
      measurement: { opaqueBodyBounds: [body.left, body.top, body.right, body.bottom], method: 'Source-inspected visible rear hands and seat/belt; genuine rover occlusion, no guessed feet' } };
    requireContacts(input, frame);
    return frame;
  });
  timed(spec.id, 'whole-body-crop-seat-palm-registration', registrationStart);
  await admit(spec, input, frames, spec.nominalHeight, (bodies[0].bottom - bodies[0].top) / spec.nominalHeight, 'characters');
  timed(spec.id, 'asset-total', assetStart);
}

for (const spec of configuration.kits) {
  const assetStart = performance.now();
  const input = await original(spec.file, 'scenery');
  const registrationStart = performance.now();
  const frames = spec.objects.map(measurement => {
    const [regionX, regionY, regionWidth, regionHeight] = measurement.region;
    let left = input.info.width, top = input.info.height, right = 0, bottom = 0;
    for (let y = regionY; y < regionY + regionHeight; y++) for (let x = regionX; x < regionX + regionWidth; x++) {
      if (alpha(input.data, input.info, [x, y]) < 8) continue;
      left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x + 1); bottom = Math.max(bottom, y + 1);
    }
    if (left >= right) throw Error(`${spec.file}/${measurement.action}: source semantic region is empty`);
    // A semantic region includes all detached leaves/flowers belonging to the
    // object; rigid quadrants would clip the tall trees beneath the midpoint.
    for (let y = regionY; y < regionY + regionHeight; y++) for (let x = regionX; x < regionX + regionWidth; x++) {
      if ((x === regionX || x === regionX + regionWidth - 1 || y === regionY || y === regionY + regionHeight - 1) && alpha(input.data, input.info, [x, y]) >= 160) {
        throw Error(`${spec.file}/${measurement.action}: semantic region cuts actual opaque object anatomy`);
      }
    }
    const cell = [Math.max(regionX, left - 7), Math.max(regionY, top - 7), Math.min(regionX + regionWidth, right + 7), Math.min(regionY + regionHeight, bottom + 7)];
    let ground = null;
    for (let y = bottom - 1; y >= top && !ground; y--) {
      const points = [];
      for (let x = Math.max(left, measurement.axis - 50); x < Math.min(right, measurement.axis + 50); x++) if (alpha(input.data, input.info, [x, y]) >= 160) points.push([x, y]);
      if (points.length) ground = points.sort((a, b) => Math.abs(a[0] - measurement.axis) - Math.abs(b[0] - measurement.axis))[0];
    }
    if (!ground) throw Error(`${spec.file}/${measurement.action}: no actual ground root contact near inspected trunk axis`);
    const frame = { id: `${spec.world}-${measurement.action}`, action: measurement.action, direction: 'front', cell,
      anchor: [ground[0] - cell[0], ground[1] - cell[1]], sockets: { ground, ...(measurement.cut ? { cut: measurement.cut } : {}) },
      measurement: { semanticRegion: measurement.region, alphaBounds: [left, top, right, bottom], method: 'Complete semantic alpha>=8 object with 7px gutter; no opaque boundary cuts; actual opaque ground/root and inspected bark contact' } };
    requireContacts(input, frame);
    return frame;
  });
  timed(spec.id, 'semantic-alpha-crop-root-bark-registration', registrationStart);
  await admit(spec, input, frames, 4.7, (frames[0].cell[3] - frames[0].cell[1]) / 4.7, 'scenery');
  timed(spec.id, 'asset-total', assetStart);
}

if (!registerOnly) await writeMetadata();
manifest.registration = 'registration.json'; manifest.registrationSha256 = hash(configurationBytes);
await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify({ compiled: !registerOnly, registeredFrames: manifest.assets.reduce((sum, asset) => sum + (asset.frames?.length || 0), 0), runtimeAcceptance: manifest.review.runtimeAcceptance }));

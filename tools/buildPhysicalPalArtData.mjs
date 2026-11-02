import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const source = 'source-art/arcade/physical-worlds/pals/clean-cartoon-manifest.json';
const target = 'src/components/learn/games/shared/physicalPalArtData.js';
const manifest = JSON.parse(readFileSync(source, 'utf8'));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
if (hash(readFileSync(manifest.historicalManifest.path)) !== manifest.historicalManifest.sha256) throw new Error('Historical Pal source lineage changed');
if (process.argv.includes('--images')) {
  if (process.argv.includes('--check')) throw new Error('--check cannot encode images');
  for (const character of Object.values(manifest.characters)) for (const atlas of [character, ...Object.values(character.actionAtlases)]) {
    // Legacy sheets remain exact historical delivery inputs until their own
    // replacement is accepted. Never silently re-encode unrelated old art.
    if (atlas.productionRevision !== 'clean-cartoon-2026-10-31') continue;
    const bytes = readFileSync(atlas.source);
    if (hash(bytes) !== atlas.sourceSha256) throw new Error(`Current Pal source changed: ${atlas.source}`);
    const decoded = await sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    if (decoded.info.width !== atlas.width || decoded.info.height !== atlas.height) throw new Error(`Pal source dimensions changed: ${atlas.source}`);
    const runtime = await sharp(bytes).webp({ quality: 90, alphaQuality: 100, effort: 6 }).toBuffer();
    const delivered = await sharp(runtime).ensureAlpha().raw().toBuffer();
    const alpha = Buffer.alloc(atlas.width * atlas.height);
    for (let pixel = 0; pixel < alpha.length; pixel++) {
      alpha[pixel] = decoded.data[pixel * 4 + 3];
      if (alpha[pixel] !== delivered[pixel * 4 + 3]) throw new Error(`Pal delivery alpha changed: ${atlas.runtime}`);
    }
    const file = `public${atlas.runtime}`;
    mkdirSync(path.dirname(file), { recursive: true }); writeFileSync(file, runtime);
    atlas.runtimeSha256 = hash(runtime); atlas.bytes = runtime.length;
    atlas.delivery = { recipe: 'WebP quality90 alphaQuality100 effort6; every packed source alpha value preserved', alphaSha256: hash(alpha) };
  }
  writeFileSync(source, JSON.stringify(manifest, null, 2) + '\n');
}
function runtimeAtlas(atlas) {
  const { character, width, height, columns, rows, runtime, pixelsPerUnit, frames } = atlas;
  if (!pixelsPerUnit || frames.length !== columns * rows) throw new Error(`Incomplete frame registration: ${runtime}`);
  for (const frame of frames) {
    const [x, y, right, bottom] = frame.cell;
    if (x < 0 || y < 0 || right > width || bottom > height || right <= x || bottom <= y || !frame.anchor) throw new Error(`Invalid frame: ${runtime}`);
    if (frame.rightHandPixel && (frame.rightHandPixel[0] < x || frame.rightHandPixel[0] >= right || frame.rightHandPixel[1] < y || frame.rightHandPixel[1] >= bottom)) throw new Error(`Hand outside registered frame: ${runtime}`);
  }
  const registeredFrames = frames.map(frame => frame.rightHandPixel ? { ...frame, rightHand: [
    (frame.rightHandPixel[0] - frame.cell[0] - frame.anchor[0]) / pixelsPerUnit,
    (frame.cell[1] + frame.anchor[1] - frame.rightHandPixel[1]) / pixelsPerUnit,
    .08
  ] } : frame);
  return { character, width, height, columns, rows, runtime, pixelsPerUnit, frames: registeredFrames };
}
const characters = Object.fromEntries(Object.entries(manifest.characters).map(([name, data]) => [name, {
  ...runtimeAtlas(data), actionAtlases: Object.fromEntries(Object.entries(data.actionAtlases).map(([kind, atlas]) => [kind, runtimeAtlas(atlas)]))
}]));
const output = `// Generated from ${source} by tools/buildPhysicalPalArtData.mjs.\nexport const PHYSICAL_PAL_ART = Object.freeze(${JSON.stringify(characters, null, 2)});\n`;
const previousRecoveryPath = 'source-art/arcade/physical-worlds/word-climb/recovery-manifest.json';
const recoveryPath = 'source-art/arcade/physical-worlds/word-climb/recovery-clean-cartoon-manifest.json';
const previousRecoveryBytes = readFileSync(previousRecoveryPath), previousRecovery = JSON.parse(previousRecoveryBytes);
const registrationAuthority = 'src/components/learn/games/games/wordClimbRecoveryArt.js';
const recovery = {
  schemaVersion: 1,
  purpose: 'Current shared-source bindings for Climb recovery; visual acceptance is separate per-asset evidence, never inherited from historical status.',
  historicalManifest: { path: previousRecoveryPath, sha256: hash(previousRecoveryBytes), immutable: true },
  sourceManifest: source, sourceManifestSha256: hash(readFileSync(source)),
  registrationAuthority, registrationAuthoritySha256: hash(readFileSync(registrationAuthority)),
  assets: previousRecovery.assets.map(previous => {
    const character = manifest.characters[previous.hero], atlas = previous.family === 'locomotion' ? character : character.actionAtlases[previous.family];
    return { ...previous, source: atlas.source, sourceSize: [atlas.width, atlas.height], sourceSha256: atlas.sourceSha256,
      runtime: atlas.runtime, runtimeSize: [atlas.width, atlas.height], runtimeSha256: atlas.runtimeSha256, supersedes: previous };
  }),
  legacyPip: previousRecovery.legacyPip
};
const recoveryOutput = JSON.stringify(recovery, null, 2) + '\n';
const carryRecoveries = ['word-bridge', 'sound-safari'].map(game => {
  const bridge = game === 'word-bridge';
  const historicalPath = `source-art/arcade/physical-worlds/${game}/${bridge ? 'recovery-manifest' : 'manifest'}.json`;
  const historicalBytes = readFileSync(historicalPath), historical = JSON.parse(historicalBytes);
  const registrationPath = `src/components/learn/games/games/${bridge ? 'wordBridge' : 'soundSafari'}RecoveryArt.js`;
  const binding = {
    schemaVersion: 1, game,
    purpose: 'Current recovery-only shared carry bindings; historical visual status is not inherited.',
    historicalManifest: { path: historicalPath, sha256: hash(historicalBytes), immutable: true },
    sharedAuthority: source, sharedAuthoritySha256: hash(readFileSync(source)),
    registrationAuthority: registrationPath, registrationAuthoritySha256: hash(readFileSync(registrationPath)),
    assets: Object.entries(manifest.characters).map(([hero, character]) => {
      const atlas = character.actionAtlases.tools;
      return { hero, source: atlas.source, sourceSha256: atlas.sourceSha256,
        runtime: atlas.runtime, runtimeSha256: atlas.runtimeSha256,
        sourceSize: [atlas.width, atlas.height],
        ...(bridge ? { supersedes: historical.assets.find(asset => asset.hero === hero) } : {}),
        frames: [6, 7].map(index => {
          const frame = atlas.frames[index];
          return { sharedIndex: index, cell: frame.cell, sharedAnchor: frame.anchor,
            contacts: { [bridge ? 'forehand' : 'nearHand']: frame.rightHandPixel,
              feet: [frame.cell[0] + frame.anchor[0], frame.cell[1] + frame.anchor[1]] } };
        }) };
    })
  };
  return { path: `source-art/arcade/physical-worlds/${game}/recovery-clean-cartoon-manifest.json`,
    output: JSON.stringify(binding, null, 2) + '\n' };
});
if (process.argv.includes('--check')) {
  if (readFileSync(target, 'utf8') !== output) throw new Error('Physical Pal runtime metadata is stale; run node tools/buildPhysicalPalArtData.mjs');
  if (readFileSync(recoveryPath, 'utf8') !== recoveryOutput) throw new Error('Climb shared-source bindings are stale; run node tools/buildPhysicalPalArtData.mjs');
  for (const binding of carryRecoveries) if (readFileSync(binding.path, 'utf8') !== binding.output) throw new Error(`Shared carry bindings stale: ${binding.path}`);
} else {
  writeFileSync(target, output); writeFileSync(recoveryPath, recoveryOutput);
  for (const binding of carryRecoveries) writeFileSync(binding.path, binding.output);
}

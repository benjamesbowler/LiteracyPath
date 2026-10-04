import { readFileSync, writeFileSync } from 'node:fs';

const source = 'source-art/arcade/physical-worlds/pals/manifest.json';
const target = 'src/components/learn/games/shared/physicalPalArtData.js';
const manifest = JSON.parse(readFileSync(source, 'utf8'));
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
if (process.argv.includes('--check')) {
  if (readFileSync(target, 'utf8') !== output) throw new Error('Physical Pal runtime metadata is stale; run node tools/buildPhysicalPalArtData.mjs');
} else writeFileSync(target, output);

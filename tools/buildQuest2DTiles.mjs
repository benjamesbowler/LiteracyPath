#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT = path.join(ROOT, "public/game-assets/quest-pixel/fallback");
const tiles = [
  { id: "meadow", source: "seedwake/tiles/field.png", frame: 21 },
  { id: "dino", source: "dino/tiles/field.png", frame: 6 },
  { id: "moonwood", source: "moonwood/tiles/field.png", frame: 36 }
];

await fs.mkdir(OUTPUT, { recursive: true });
for (const tile of tiles) {
  const left = (tile.frame % 5) * 16;
  const top = Math.floor(tile.frame / 5) * 16;
  await sharp(path.join(ROOT, "public/game-assets/quest-pixel", tile.source))
    .extract({ left, top, width: 16, height: 16 })
    .png({ compressionLevel: 9, palette: true })
    .toFile(path.join(OUTPUT, `${tile.id}-ground.png`));
}

console.log(`Built ${tiles.length} accessible quest ground tiles.`);

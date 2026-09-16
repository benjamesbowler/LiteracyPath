import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { gzipSync } from "node:zlib";

const root = new URL("../", import.meta.url);
const sources = [
  ["sound-racer/models/pip-kart", "pip-kart"],
  ["spell-skate/spell-skater", "spell-skater"],
  ["word-climb/pip-climber", "pip-climber"]
];
mkdirSync(new URL("src/assets/game-recovery/", root), { recursive: true });
for (const [source, name] of sources) {
  const bytes = readFileSync(new URL(`public/game-assets/${source}.glb`, root));
  writeFileSync(new URL(`src/assets/game-recovery/${name}.glb.gz`, root), gzipSync(bytes, { level: 9 }));
}
console.log(`Generated ${sources.length} compressed, byte-identical game recovery assets.`);

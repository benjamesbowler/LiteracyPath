import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const analysisPath = path.join(ROOT, "dist", "bundle-analysis.json");
const fail = message => {
  console.error(`PIXEL BUNDLE CHECK FAILED: ${message}`);
  process.exitCode = 1;
};
if (!fs.existsSync(analysisPath)) {
  fail("dist/bundle-analysis.json is missing; run npm run check:quest-pixel-bundle");
  process.exit();
}

const analysis = JSON.parse(fs.readFileSync(analysisPath, "utf8"));
const chunks = Array.isArray(analysis.chunks) ? analysis.chunks : [];
const pixelChunks = chunks.filter(chunk =>
  String(chunk.fileName || "").includes("QuestPixelWorld") ||
  chunk.modules?.some(module => String(module.id || "").includes("/QuestPixelWorld.jsx"))
);

if (pixelChunks.length !== 1) {
  fail(`expected one QuestPixelWorld chunk, found ${pixelChunks.length}`);
  process.exit();
}

const chunk = pixelChunks[0];
const bundlePath = path.join(ROOT, "dist", chunk.fileName);
if (!fs.existsSync(bundlePath)) {
  fail(`analysed chunk does not exist: ${chunk.fileName}`);
  process.exit();
}

const modules = chunks.flatMap(candidate =>
  Array.isArray(candidate.modules) ? candidate.modules : []
);
const moduleIds = modules.map(module => String(module.id || ""));

const requiredModules = [
  "/src/vendor/phaserSoundSeekers.cjs",
  "/physics/arcade/ArcadePhysics.js",
  "/renderer/canvas/CanvasRenderer.js",
  "/gameobjects/container/ContainerFactory.js",
  "/gameobjects/shape/arc/ArcFactory.js",
  "/gameobjects/shape/ellipse/EllipseFactory.js",
  "/gameobjects/shape/rectangle/RectangleFactory.js",
  "/gameobjects/zone/ZoneFactory.js"
];
for (const required of requiredModules) {
  if (!moduleIds.some(id => id.includes(required))) fail(`required module is missing: ${required}`);
}

const forbiddenModules = [
  "/phaser-arcade-physics.js",
  "/gameobjects/video/",
  "/gameobjects/particles/",
  "/gameobjects/rope/",
  "/gameobjects/domelement/",
  "/gameobjects/bitmaptext/",
  "/tilemaps/Tilemap.js",
  "/tilemaps/TilemapFactory.js"
];
for (const forbidden of forbiddenModules) {
  const matches = moduleIds.filter(id => id.includes(forbidden));
  if (matches.length) fail(`forbidden subsystem returned: ${forbidden}`);
}

if (!process.exitCode) {
  console.log(`Pixel bundle architecture check passed: one quest entry chunk, ${modules.length} analysed modules across the current split graph, required subsystems present, forbidden subsystems absent.`);
}

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const ROOT = process.cwd();
const analysisPath = path.join(ROOT, "dist", "bundle-analysis.json");
const limits = Object.freeze({
  minifiedBytes: 870_000,
  gzipBytes: 235_000,
  chunkedGzipBytes: 238_000,
  moduleCount: 1_050,
  renderedBytes: 1_730_000,
  phaserRenderedBytes: 1_450_000
});
const baseline = Object.freeze({
  minifiedBytes: 1_084_070,
  gzipBytes: 287_960,
  moduleCount: 1_434
});

const fail = message => {
  console.error(`PIXEL BUNDLE CHECK FAILED: ${message}`);
  process.exitCode = 1;
};
const formatKb = bytes => `${(bytes / 1_000).toFixed(2)} KB`;

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

const chunkByFileName = new Map(chunks.map(chunk => [String(chunk.fileName || ""), chunk]));
const runtimeChunks = [];
const pendingChunks = [...pixelChunks];
const seenChunkNames = new Set();

while (pendingChunks.length) {
  const current = pendingChunks.shift();
  const fileName = String(current?.fileName || "");
  if (!current || seenChunkNames.has(fileName)) continue;
  seenChunkNames.add(fileName);
  runtimeChunks.push(current);

  for (const importedName of current.imports || []) {
    const imported = chunkByFileName.get(String(importedName));
    if (!imported) continue;
    const isPixelRuntimeDependency =
      String(imported.fileName || "").includes("vendor-phaser-") ||
      imported.modules?.some(module =>
        String(module.id || "").includes("/questPixelAvatar.js")
      );
    if (isPixelRuntimeDependency) pendingChunks.push(imported);
  }
}

const bundles = runtimeChunks.map(runtimeChunk => {
  const bundlePath = path.join(ROOT, "dist", runtimeChunk.fileName);
  if (!fs.existsSync(bundlePath)) {
    fail(`analysed chunk does not exist: ${runtimeChunk.fileName}`);
    return Buffer.alloc(0);
  }
  return fs.readFileSync(bundlePath);
});
const bundle = Buffer.concat(bundles);
const modules = runtimeChunks.flatMap(runtimeChunk =>
  Array.isArray(runtimeChunk.modules) ? runtimeChunk.modules : []
);
const moduleIds = modules.map(module => String(module.id || ""));
const metrics = Object.freeze({
  minifiedBytes: bundle.length,
  gzipBytes: zlib.gzipSync(bundle).length,
  chunkedGzipBytes: bundles.reduce(
    (total, runtimeBundle) => total + zlib.gzipSync(runtimeBundle).length,
    0
  ),
  moduleCount: modules.length,
  renderedBytes: runtimeChunks.reduce(
    (total, runtimeChunk) => total + Number(runtimeChunk.renderedLength || 0),
    0
  ),
  phaserRenderedBytes: modules
    .filter(module => String(module.id || "").includes("/node_modules/phaser/"))
    .reduce((total, module) => total + Number(module.renderedLength || 0), 0)
});

for (const [metric, maximum] of Object.entries(limits)) {
  if (metrics[metric] > maximum) {
    const actual = metric.endsWith("Bytes") ? formatKb(metrics[metric]) : metrics[metric];
    const budget = metric.endsWith("Bytes") ? formatKb(maximum) : maximum;
    fail(`${metric} is ${actual}; budget is ${budget}`);
  }
}

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

const reduction = Object.freeze({
  minifiedPercent: ((baseline.minifiedBytes - metrics.minifiedBytes) / baseline.minifiedBytes) * 100,
  gzipPercent: ((baseline.gzipBytes - metrics.gzipBytes) / baseline.gzipBytes) * 100,
  modulesRemoved: baseline.moduleCount - metrics.moduleCount
});

if (reduction.minifiedPercent < 19 || reduction.gzipPercent < 18 || reduction.modulesRemoved < 350) {
  fail("the measured custom-build reduction has fallen below its release floor");
}

if (!process.exitCode) {
  console.log([
    "Pixel bundle check passed:",
    `${formatKb(metrics.minifiedBytes)} minified`,
    `${formatKb(metrics.gzipBytes)} gzip`,
    `${formatKb(metrics.chunkedGzipBytes)} chunked transfer`,
    `${runtimeChunks.length} runtime chunks`,
    `${metrics.moduleCount} modules`,
    `${reduction.minifiedPercent.toFixed(1)}% less minified code`,
    `${reduction.gzipPercent.toFixed(1)}% less gzip transfer`,
    `${reduction.modulesRemoved} modules removed`
  ].join(" "));
}

#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FIELD_OBJECT_MODELS } from "../src/data/threeAssetLibrary.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC_ROOT = path.join(ROOT, "public");
const LIBRARY_ROOT = path.join(PUBLIC_ROOT, "models/library");
const MANIFEST_PATH = path.join(LIBRARY_ROOT, "manifest.json");
const MAX_MODEL_BYTES = 6 * 1024 * 1024;
const MAX_LIBRARY_BYTES = 75 * 1024 * 1024;
const errors = [];

function fail(message) {
  errors.push(message);
}

function parseGlb(buffer, filename) {
  if (buffer.length < 20 || buffer.toString("ascii", 0, 4) !== "glTF") {
    throw new Error(`${filename}: invalid GLB header`);
  }
  if (buffer.readUInt32LE(4) !== 2) throw new Error(`${filename}: expected glTF 2.0`);
  if (buffer.readUInt32LE(8) !== buffer.length) throw new Error(`${filename}: GLB byte length does not match its header`);
  const jsonLength = buffer.readUInt32LE(12);
  if (buffer.toString("ascii", 16, 20) !== "JSON") throw new Error(`${filename}: first GLB chunk is not JSON`);
  return JSON.parse(buffer.toString("utf8", 20, 20 + jsonLength).replace(/\0+$/u, ""));
}

function readDocument(filename) {
  if (filename.endsWith(".glb")) return parseGlb(fs.readFileSync(filename), filename);
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

function allFiles(root) {
  const files = [];
  const walk = folder => {
    for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
      const absolute = path.join(folder, entry.name);
      if (entry.isDirectory()) walk(absolute);
      else files.push(absolute);
    }
  };
  walk(root);
  return files;
}

if (!fs.existsSync(MANIFEST_PATH)) fail("manifest.json is missing; run npm run build:3d-library");
const manifest = fs.existsSync(MANIFEST_PATH)
  ? JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"))
  : { packs: [], models: [], totals: {} };

if (manifest.schemaVersion !== 1) fail("manifest schemaVersion must be 1");
if ((manifest.models?.length || 0) < 900) fail("library must contain at least 900 web-ready models");
if (manifest.totals?.models !== manifest.models?.length) fail("manifest total model count is stale");

const packById = new Map();
for (const pack of manifest.packs || []) {
  if (packById.has(pack.id)) fail(`duplicate pack id: ${pack.id}`);
  packById.set(pack.id, pack);
  if (pack.license !== "CC0-1.0") fail(`${pack.id}: shipped packs must be CC0-1.0`);
  if (!/^https:\/\//u.test(pack.source || "")) fail(`${pack.id}: official HTTPS source is missing`);
  const licenseFile = path.join(PUBLIC_ROOT, String(pack.licensePath || "").replace(/^\//u, ""));
  if (!fs.existsSync(licenseFile)) fail(`${pack.id}: license file is missing`);
  else if (!/CC0|Creative Commons Zero|publicdomain\/zero/iu.test(fs.readFileSync(licenseFile, "utf8"))) {
    fail(`${pack.id}: CC0 grant was not found in its license file`);
  }
}

const listedPaths = new Set();
const ids = new Set();
let modelBytes = 0;
for (const model of manifest.models || []) {
  if (ids.has(model.id)) fail(`duplicate model id: ${model.id}`);
  ids.add(model.id);
  if (listedPaths.has(model.path)) fail(`duplicate model path: ${model.path}`);
  listedPaths.add(model.path);
  if (!packById.has(model.packId)) fail(`${model.id}: unknown pack ${model.packId}`);
  if (!String(model.path).startsWith("/models/library/")) {
    fail(`${model.id}: path is outside the runtime library`);
    continue;
  }
  const filename = path.resolve(PUBLIC_ROOT, model.path.slice(1));
  if (!filename.startsWith(`${LIBRARY_ROOT}${path.sep}`)) {
    fail(`${model.id}: resolved path escapes the library`);
    continue;
  }
  if (!fs.existsSync(filename)) {
    fail(`${model.id}: model file is missing`);
    continue;
  }
  const bytes = fs.statSync(filename).size;
  modelBytes += bytes;
  if (bytes !== model.bytes) fail(`${model.id}: manifest byte count is stale`);
  if (bytes > MAX_MODEL_BYTES) fail(`${model.id}: exceeds the 6MB per-model budget`);
  try {
    const document = readDocument(filename);
    if (!(document.meshes?.length >= 1)) fail(`${model.id}: contains no mesh`);
    if ((document.meshes?.length || 0) !== model.meshCount) fail(`${model.id}: mesh metadata is stale`);
    if ((document.animations?.length || 0) !== model.animationCount) fail(`${model.id}: animation metadata is stale`);
    if ((document.skins?.length || 0) !== model.skinCount) fail(`${model.id}: rig metadata is stale`);
    for (const entry of [...(document.buffers || []), ...(document.images || [])]) {
      if (!entry.uri || entry.uri.startsWith("data:")) continue;
      if (/^https?:/iu.test(entry.uri)) {
        fail(`${model.id}: runtime dependency must be local (${entry.uri})`);
        continue;
      }
      const dependency = path.resolve(path.dirname(filename), decodeURIComponent(entry.uri));
      if (!dependency.startsWith(`${LIBRARY_ROOT}${path.sep}`)) fail(`${model.id}: dependency escapes the library (${entry.uri})`);
      else if (!fs.existsSync(dependency)) fail(`${model.id}: dependency is missing (${entry.uri})`);
    }
  } catch (error) {
    fail(`${model.id}: ${error.message}`);
  }
}

const files = allFiles(LIBRARY_ROOT);
const libraryBytes = files.reduce((total, filename) => total + fs.statSync(filename).size, 0);
const actualModels = files
  .filter(filename => /\.(gltf|glb)$/iu.test(filename))
  .map(filename => `/${path.relative(PUBLIC_ROOT, filename).split(path.sep).join("/")}`);
for (const modelPath of actualModels) {
  if (!listedPaths.has(modelPath)) fail(`unlisted model file: ${modelPath}`);
}
for (const filename of files) {
  if (/\.(fbx|obj|blend|mtl)$/iu.test(filename)) fail(`source format leaked into runtime library: ${path.relative(ROOT, filename)}`);
}
if (actualModels.length !== listedPaths.size) fail("manifest and runtime model counts differ");
if (libraryBytes > MAX_LIBRARY_BYTES) fail("complete runtime library exceeds the 75MB budget");

for (const [kind, spec] of Object.entries(FIELD_OBJECT_MODELS)) {
  if (!listedPaths.has(spec.url)) fail(`field object ${kind} is not represented in the manifest`);
}
const fish = manifest.models?.find(model => model.path === FIELD_OBJECT_MODELS.fish.url);
if (!fish?.animated || !fish?.rigged) fail("field fish must remain rigged and animated");

if (errors.length) {
  console.error(`check:3d-library found ${errors.length} problem${errors.length === 1 ? "" : "s"}:`);
  errors.forEach(error => console.error(`  FAIL  ${error}`));
  process.exit(1);
}

console.log(
  `check:3d-library OK - ${manifest.models.length} models, ${manifest.totals.animated} animated, `
  + `${manifest.packs.length} CC0 packs, ${(libraryBytes / 1024 / 1024).toFixed(1)}MB complete runtime library`
);

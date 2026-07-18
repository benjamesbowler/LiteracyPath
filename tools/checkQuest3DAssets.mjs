#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ASSET_ROOT = path.join(ROOT, "public/models/quest");
const errors = [];
const checkedUris = new Set();
const questHubSource = fs.readFileSync(path.join(ROOT, "src/components/quest/world/QuestHub.jsx"), "utf8");

const MONSTERS = [
  "Bunny.gltf",
  "Dino.gltf",
  "Frog.gltf",
  "Glub.gltf",
  "GreenBlob.gltf",
  "GreenSpikyBlob.gltf",
  "Mushnub.gltf",
  "Mushnub_Evolved.gltf",
  "MushroomKing.gltf",
  "PinkBlob.gltf",
  "Wizard.gltf",
  "Yeti.gltf"
];

const NATURE = [
  "BirchTree_1.gltf",
  "DeadTree_1.gltf",
  "DeadTree_4.gltf",
  "DeadTree_7.gltf",
  "Bush_Flowers.gltf",
  "Bush_Large.gltf",
  "Flower_1_Clump.gltf"
];

if (!/createRiggedTrailCharacters\s*\(/.test(questHubSource)) {
  fail("QuestHub does not instantiate the verified rigged character cast");
}

function fail(message) {
  errors.push(message);
}

function readGltf(folder, filename) {
  const file = path.join(ASSET_ROOT, folder, filename);
  if (!fs.existsSync(file)) {
    fail(`${folder}/${filename}: missing`);
    return null;
  }
  try {
    return { file, json: JSON.parse(fs.readFileSync(file, "utf8")) };
  } catch (error) {
    fail(`${folder}/${filename}: invalid JSON (${error.message})`);
    return null;
  }
}

function checkExternalUris(folder, filename, json) {
  const entries = [...(json.buffers || []), ...(json.images || [])];
  for (const entry of entries) {
    if (!entry.uri || entry.uri.startsWith("data:")) continue;
    const decoded = decodeURIComponent(entry.uri);
    const absolute = path.resolve(ASSET_ROOT, folder, decoded);
    const base = path.resolve(ASSET_ROOT, folder);
    if (!absolute.startsWith(`${base}${path.sep}`)) {
      fail(`${folder}/${filename}: URI escapes its asset folder (${entry.uri})`);
      continue;
    }
    if (!fs.existsSync(absolute)) fail(`${folder}/${filename}: referenced file is missing (${entry.uri})`);
    else checkedUris.add(absolute);
  }
}

for (const filename of MONSTERS) {
  const asset = readGltf("monsters", filename);
  if (!asset) continue;
  const { json, file } = asset;
  checkExternalUris("monsters", filename, json);
  if (!(json.skins?.length >= 1)) fail(`monsters/${filename}: no skeleton/skin`);
  if (!(json.animations?.length >= 8)) fail(`monsters/${filename}: fewer than 8 animation clips`);
  const clips = (json.animations || []).map(animation => animation.name?.toLowerCase() || "");
  if (!clips.some(name => name.includes("idle"))) fail(`monsters/${filename}: no idle animation`);
  if (!clips.some(name => name.includes("walk") || name.includes("flying"))) {
    fail(`monsters/${filename}: no locomotion animation`);
  }
  if (fs.statSync(file).size > 2 * 1024 * 1024) fail(`monsters/${filename}: exceeds the 2MB per-character budget`);
}

for (const filename of NATURE) {
  const asset = readGltf("nature", filename);
  if (!asset) continue;
  checkExternalUris("nature", filename, asset.json);
  if (!(asset.json.meshes?.length >= 1)) fail(`nature/${filename}: no mesh`);
  if (!(asset.json.materials?.length >= 1)) fail(`nature/${filename}: no materials`);
}

for (const absolute of checkedUris) {
  if (!/\.(png|jpe?g|webp)$/i.test(absolute)) continue;
  const metadata = await sharp(absolute).metadata();
  if ((metadata.width || 0) > 1024 || (metadata.height || 0) > 1024) {
    fail(`${path.relative(ROOT, absolute)}: texture exceeds 1024px`);
  }
  if (fs.statSync(absolute).size > 300 * 1024) {
    fail(`${path.relative(ROOT, absolute)}: texture exceeds 300KB`);
  }
}

for (const folder of ["monsters", "nature"]) {
  const license = path.join(ASSET_ROOT, folder, "LICENSE.txt");
  if (!fs.existsSync(license)) fail(`${folder}/LICENSE.txt: missing`);
  else if (!/CC0 1\.0/i.test(fs.readFileSync(license, "utf8"))) fail(`${folder}/LICENSE.txt: CC0 grant not found`);
}

const notices = path.join(ROOT, "docs/SOUND_SEEKERS_3D_ASSET_NOTICES.md");
if (!fs.existsSync(notices)) fail("docs/SOUND_SEEKERS_3D_ASSET_NOTICES.md: missing");

const totalBytes = MONSTERS.reduce((sum, filename) => {
  const file = path.join(ASSET_ROOT, "monsters", filename);
  return sum + (fs.existsSync(file) ? fs.statSync(file).size : 0);
}, 0);
if (totalBytes > 9 * 1024 * 1024) fail("monster cast exceeds the 9MB source budget");

if (errors.length) {
  console.error(`check:quest-3d found ${errors.length} problem${errors.length === 1 ? "" : "s"}:`);
  errors.forEach(error => console.error(`  FAIL  ${error}`));
  process.exit(1);
}

console.log(`check:quest-3d OK - ${MONSTERS.length} rigged characters, ${NATURE.length} scenery models, ${(totalBytes / 1024 / 1024).toFixed(1)}MB character source`);

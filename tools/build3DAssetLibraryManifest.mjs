#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC_ROOT = path.join(ROOT, "public");
const LIBRARY_ROOT = path.join(PUBLIC_ROOT, "models/library");
const MANIFEST_PATH = path.join(LIBRARY_ROOT, "manifest.json");

const PACKS = [
  {
    id: "kaykit-adventurers",
    name: "KayKit Character Pack: Adventurers",
    root: "kaykit/adventurers",
    creator: "Kay Lousberg",
    source: "https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0",
    revision: "672074b73ba276876a19e8816ecdc5241817ab47",
    categories: ["characters", "fantasy", "animated", "equipment"]
  },
  {
    id: "kaykit-skeletons",
    name: "KayKit Character Pack: Skeletons",
    root: "kaykit/skeletons",
    creator: "Kay Lousberg",
    source: "https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Skeletons-1.0",
    revision: "15b62b9bad122f72926c10fb14d622c73819fa54",
    categories: ["characters", "fantasy", "animated", "equipment"]
  },
  {
    id: "kaykit-city",
    name: "KayKit City Builder Bits",
    root: "kaykit/city",
    creator: "Kay Lousberg",
    source: "https://github.com/KayKit-Game-Assets/KayKit-City-Builder-Bits-1.0",
    revision: "63976910ca04d16f0fc531b9c614244be8128713",
    categories: ["city", "buildings", "vehicles", "street-props"]
  },
  {
    id: "kaykit-dungeon",
    name: "KayKit Dungeon Remastered",
    root: "kaykit/dungeon",
    creator: "Kay Lousberg",
    source: "https://github.com/KayKit-Game-Assets/KayKit-Dungeon-Remastered-1.0",
    revision: "b0ca9bd96a8072ab36a3a5464f00ed1e06a16d07",
    categories: ["dungeon", "fantasy", "architecture", "props"]
  },
  {
    id: "kaykit-furniture",
    name: "KayKit Furniture Bits",
    root: "kaykit/furniture",
    creator: "Kay Lousberg",
    source: "https://github.com/KayKit-Game-Assets/KayKit-Furniture-Bits-1.0",
    revision: "96d5930a8dbdb363409bbc2d3341718b00e17c9c",
    categories: ["furniture", "interiors", "props"]
  },
  {
    id: "kaykit-halloween",
    name: "KayKit Halloween Bits",
    root: "kaykit/halloween",
    creator: "Kay Lousberg",
    source: "https://github.com/KayKit-Game-Assets/KayKit-Halloween-Bits-1.0",
    revision: "6dc69bf6b2fa766a985754f35ec6a0324090e6c6",
    categories: ["halloween", "fantasy", "props", "scenery"]
  },
  {
    id: "kaykit-medieval",
    name: "KayKit Medieval Hexagon Pack",
    root: "kaykit/medieval",
    creator: "Kay Lousberg",
    source: "https://github.com/KayKit-Game-Assets/KayKit-Medieval-Hexagon-Pack-1.0",
    revision: "84fa4e91af6a88989be7c99e0891cede11f2ca38",
    categories: ["medieval", "buildings", "terrain", "props"]
  },
  {
    id: "kaykit-prototype",
    name: "KayKit Prototype Bits",
    root: "kaykit/prototype",
    creator: "Kay Lousberg",
    source: "https://github.com/KayKit-Game-Assets/KayKit-Prototype-Bits-1.0",
    revision: "bb159596f4f5106b663741d002c8eb45c80c0f41",
    categories: ["prototype", "platformer", "terrain", "gameplay"]
  },
  {
    id: "kaykit-restaurant",
    name: "KayKit Restaurant Bits",
    root: "kaykit/restaurant",
    creator: "Kay Lousberg",
    source: "https://github.com/KayKit-Game-Assets/KayKit-Restaurant-Bits-1.0",
    revision: "153c8a7535b48237854cb54ff6890679f8c574d1",
    categories: ["food", "restaurant", "kitchen", "interiors", "props"]
  },
  {
    id: "kaykit-space",
    name: "KayKit Space Base Bits",
    root: "kaykit/space",
    creator: "Kay Lousberg",
    source: "https://github.com/KayKit-Game-Assets/KayKit-Space-Base-Bits-1.0",
    revision: "6dfbcac9927d06283752c4defd4882cfe0d29666",
    categories: ["space", "science-fiction", "architecture", "props"]
  },
  {
    id: "poly-pizza-objectives",
    name: "CC0 Field Objectives",
    root: "poly-pizza/objectives",
    creator: "Quaternius and Isa Lousberg",
    source: "https://poly.pizza/",
    revision: null,
    categories: ["objectives", "food", "animals", "equipment"],
    modelSources: {
      "Boots.glb": { creator: "Isa Lousberg", source: "https://poly.pizza/m/7XCvej7wZU" },
      "Cupcake.glb": { creator: "Quaternius", source: "https://poly.pizza/m/XL70IUDIrZ" },
      "Fish.glb": { creator: "Quaternius", source: "https://poly.pizza/m/ypEYhCImAB" }
    }
  }
];

function modelFiles(root) {
  const files = [];
  const walk = folder => {
    for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
      const absolute = path.join(folder, entry.name);
      if (entry.isDirectory()) walk(absolute);
      else if (/\.(gltf|glb)$/i.test(entry.name)) files.push(absolute);
    }
  };
  walk(root);
  return files.sort((a, b) => a.localeCompare(b));
}

function parseGlb(buffer, filename) {
  if (buffer.length < 20 || buffer.toString("ascii", 0, 4) !== "glTF") {
    throw new Error(`${filename}: invalid GLB header`);
  }
  if (buffer.readUInt32LE(4) !== 2) throw new Error(`${filename}: expected glTF 2.0`);
  const jsonLength = buffer.readUInt32LE(12);
  const jsonType = buffer.toString("ascii", 16, 20);
  if (jsonType !== "JSON") throw new Error(`${filename}: first GLB chunk is not JSON`);
  return JSON.parse(buffer.toString("utf8", 20, 20 + jsonLength).replace(/\0+$/u, ""));
}

function readDocument(filename) {
  if (filename.endsWith(".glb")) return parseGlb(fs.readFileSync(filename), filename);
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

function wordsFor(filename) {
  const stem = path.basename(filename, path.extname(filename))
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase();
  return [...new Set(stem.split(/[^a-z0-9]+/).filter(Boolean))];
}

function displayName(filename) {
  return wordsFor(filename).map(word => word[0].toUpperCase() + word.slice(1)).join(" ");
}

const models = [];
const packs = PACKS.map(pack => {
  const packRoot = path.join(LIBRARY_ROOT, pack.root);
  const licenseFile = path.join(packRoot, "LICENSE.txt");
  if (!fs.existsSync(licenseFile)) throw new Error(`${pack.id}: LICENSE.txt is missing`);
  const entries = modelFiles(packRoot).map(filename => {
    const document = readDocument(filename);
    const publicPath = `/${path.relative(PUBLIC_ROOT, filename).split(path.sep).join("/")}`;
    const sourceOverride = pack.modelSources?.[path.basename(filename)] || null;
    const entry = {
      id: `${pack.id}:${path.basename(filename, path.extname(filename)).toLowerCase()}`,
      name: displayName(filename),
      packId: pack.id,
      path: publicPath,
      format: path.extname(filename).slice(1).toLowerCase(),
      bytes: fs.statSync(filename).size,
      meshCount: document.meshes?.length || 0,
      materialCount: document.materials?.length || 0,
      animationCount: document.animations?.length || 0,
      skinCount: document.skins?.length || 0,
      animated: Boolean(document.animations?.length),
      rigged: Boolean(document.skins?.length),
      categories: pack.categories,
      tags: wordsFor(filename),
      creator: sourceOverride?.creator || pack.creator,
      source: sourceOverride?.source || pack.source
    };
    models.push(entry);
    return entry;
  });
  return {
    id: pack.id,
    name: pack.name,
    creator: pack.creator,
    source: pack.source,
    sourceRevision: pack.revision,
    license: "CC0-1.0",
    licensePath: `/${path.relative(PUBLIC_ROOT, licenseFile).split(path.sep).join("/")}`,
    categories: pack.categories,
    modelCount: entries.length,
    bytes: entries.reduce((sum, model) => sum + model.bytes, 0)
  };
});

const manifest = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  policy: {
    shippedLicense: "CC0-1.0",
    runtimeFormat: ["gltf", "glb"],
    note: "Source formats stay outside the runtime tree; every shipped model is traceable to an official page or repository."
  },
  totals: {
    packs: packs.length,
    models: models.length,
    animated: models.filter(model => model.animated).length,
    rigged: models.filter(model => model.rigged).length,
    bytes: packs.reduce((sum, pack) => sum + pack.bytes, 0)
  },
  packs,
  models: models.sort((a, b) => a.id.localeCompare(b.id) || a.path.localeCompare(b.path))
};

fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`3D manifest built: ${manifest.totals.models} models across ${manifest.totals.packs} packs`);

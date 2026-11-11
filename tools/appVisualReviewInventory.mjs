import fs from "node:fs";
import path from "node:path";

import { mediaQaReviewItems } from "../src/data/generated/mediaQaReviewItems.generated.js";
import { storyQuests } from "../src/data/storyQuests.js";
import { getRuntimeGuidedReadingBooks } from "../src/utils/guidedReading/runtimeBooks.js";
import { withRepairedGuidedReadingImageVersion } from "../src/utils/guidedReading/mediaVersion.js";
import {buildCyclePresentation,presentationCycleOptions,PRESENTATION_DAYS} from '../src/utils/present/presentationBuilder.js';
import {GAME_LIST} from '../src/data/learnGamesData.js';
import {LEARN_GAMES} from '../src/components/learn/games/games/index.js';
import {BUILD_PARTS} from '../src/utils/burrowBuildersRules.js';
import {HOP_AND_STOP_PAGES,HOP_AND_STOP_ACTIONS,hopAndStopActionImage} from '../src/data/hopAndStop.js';

export const IMAGE_PATTERN = /\.(?:png|jpe?g|webp|gif|svg)$/i;
const SOURCE_PATTERN = /\.(?:js|jsx|mjs|css|json|html)$/i;

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

function cleanAssetPath(value = "") {
  return String(value).split("?")[0].split("#")[0];
}

function collectRegistryRows(root) {
  const publicRoot = path.join(root, "public");
  const byPath = new Map();
  for (const item of mediaQaReviewItems) {
    const publicPath = cleanAssetPath(item.imagePath);
    if (!publicPath.startsWith("/") || !IMAGE_PATTERN.test(publicPath)) continue;
    const absolutePath = path.join(publicRoot, publicPath.slice(1));
    if (!fs.existsSync(absolutePath)) continue;
    const existing = byPath.get(publicPath) || {
      publicPath,
      absolutePath,
      sources: new Set(),
      areas: new Set()
    };
    // Historical tag retained for compatibility. Membership in the QA registry
    // is not proof of display: a held-source disposition must separately prove
    // its exact current selector and consumer boundary.
    existing.sources.add("runtime-media-registry");
    existing.areas.add(item.area || "unknown");
    byPath.set(publicPath, existing);
  }
  return byPath;
}

function addSourceLiterals(root, byPath) {
  const publicRoot = path.join(root, "public");
  const sourceFiles = walk(path.join(root, "src")).filter(file => SOURCE_PATTERN.test(file));
  const literalPattern = /["'`]((?:\/)[^"'`\n\r]*?\.(?:png|jpe?g|webp|gif|svg)(?:[?#][^"'`\n\r]*)?)["'`]/gi;
  for (const sourceFile of sourceFiles) {
    const source = fs.readFileSync(sourceFile, "utf8");
    for (const match of source.matchAll(literalPattern)) {
      const publicPath = cleanAssetPath(match[1]);
      const absolutePath = path.join(publicRoot, publicPath.slice(1));
      if (!fs.existsSync(absolutePath)) continue;
      const existing = byPath.get(publicPath) || {
        publicPath,
        absolutePath,
        sources: new Set(),
        areas: new Set()
      };
      existing.sources.add(`source-literal:${path.relative(root, sourceFile).split(path.sep).join("/")}`);
      byPath.set(publicPath, existing);
    }
  }
}

function addImportedSourceAssets(root, byPath) {
  for (const absolutePath of walk(path.join(root, "src")).filter(file => IMAGE_PATTERN.test(file))) {
    const sourcePath = path.relative(root, absolutePath).split(path.sep).join("/");
    const publicPath = `/${sourcePath}`;
    const existing = byPath.get(publicPath) || {
      publicPath,
      absolutePath,
      sources: new Set(),
      areas: new Set()
    };
    existing.sources.add("source-image-file");
    byPath.set(publicPath, existing);
  }
}

function imageStrings(value, results = new Set()) {
  if (typeof value === "string") {
    const publicPath = cleanAssetPath(value);
    if (publicPath.startsWith("/") && IMAGE_PATTERN.test(publicPath)) results.add(publicPath);
    return results;
  }
  if (Array.isArray(value)) {
    for (const item of value) imageStrings(item, results);
    return results;
  }
  if (value && typeof value === "object") {
    for (const item of Object.values(value)) imageStrings(item, results);
  }
  return results;
}

function addRuntimeObjectImages(root, byPath, value, source) {
  const publicRoot = path.join(root, "public");
  for (const publicPath of imageStrings(value)) {
    const absolutePath = path.join(publicRoot, publicPath.slice(1));
    if (!fs.existsSync(absolutePath)) continue;
    const existing = byPath.get(publicPath) || {
      publicPath,
      absolutePath,
      sources: new Set(),
      areas: new Set()
    };
    existing.sources.add(source);
    byPath.set(publicPath, existing);
  }
}

// Present combines character roots and pose names, which source-literal
// scanning cannot discover. Inventory only actual offered document outputs,
// rather than assuming every export of an imported helper is displayed.
export function collectPresentRuntimeImageBindings(){
  const bindings=[];
  for(const cycle of presentationCycleOptions())for(const day of ['',...PRESENTATION_DAYS.map(row=>row.value)]){
    const document=buildCyclePresentation(cycle.id,{day,format:'core'});
    for(const match of (document.html||'').matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["']/g)){
      const image=match[1].replace(/^https?:\/\/[^/]+/,'');
      if(image.startsWith('/'))bindings.push({cycleId:cycle.id,day,path:cleanAssetPath(image)});
    }
  }
  return bindings;
}

export function collectAppVisualReviewInventory(
  root,
  { includeSourceLiterals = true, includeRuntimeObjects = true } = {}
) {
  const byPath = collectRegistryRows(root);
  if (includeSourceLiterals) addSourceLiterals(root, byPath);
  if (includeRuntimeObjects) {
    const guidedBooks = getRuntimeGuidedReadingBooks();
    addRuntimeObjectImages(root, byPath, guidedBooks, "runtime-guided-reading");
    // Catalogue paths retain their canonical QA identity. Include the actual
    // immutable delivery copies too, so serving a new pathname cannot escape
    // the same strict byte-bound visual inventory.
    const guidedDeliveries = [...imageStrings(guidedBooks)]
      .map(canonical => ({ canonical, delivery: cleanAssetPath(withRepairedGuidedReadingImageVersion(canonical)) }))
      .filter(({ canonical, delivery }) => delivery !== canonical)
      .map(({ delivery }) => delivery);
    addRuntimeObjectImages(root, byPath, guidedDeliveries, "runtime-guided-reading-delivery");
    addRuntimeObjectImages(root, byPath, storyQuests, "runtime-story-quests");
    addRuntimeObjectImages(root, byPath, [HOP_AND_STOP_PAGES.map(page=>page.image),Object.keys(HOP_AND_STOP_ACTIONS).map(hopAndStopActionImage)], "runtime-hop-and-stop");
    addRuntimeObjectImages(root, byPath, collectPresentRuntimeImageBindings().map(row=>row.path), "runtime-present-document");
    addRuntimeObjectImages(root, byPath, GAME_LIST.filter(game=>!game.hidden&&LEARN_GAMES[game.id]).map(game=>game.menuArt), 'runtime-game-menu');
    addRuntimeObjectImages(root, byPath, ['meadow','dino','moonwood'].flatMap(world=>BUILD_PARTS.map(part=>`/game-assets/physical-arcade/burrow-builders/thumbnails/${world}-${part}-v1.png`)), 'runtime-burrow-model-thumbnails');
    addRuntimeObjectImages(root, byPath, ['engine','wagon','caboose'].map(kind=>`/game-assets/arcade-worlds/trains/${kind}.webp`), 'runtime-sentence-express-model-frames');
  }
  addImportedSourceAssets(root, byPath);

  return [...byPath.values()]
    .sort((left, right) => left.publicPath.localeCompare(right.publicPath))
    .map(row => ({
      path: row.publicPath,
      absolutePath: row.absolutePath,
      areas: [...row.areas].sort(),
      sources: [...row.sources].sort()
    }));
}

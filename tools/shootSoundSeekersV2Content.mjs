#!/usr/bin/env node
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import {
  closeSync,
  existsSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  readFileSync,
  realpathSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { get } from "node:http";
import { fileURLToPath } from "node:url";

import { parse } from "@babel/parser";
import { chromium } from "playwright";

import { SOUND_SEEKERS_EXPEDITIONS } from "../src/features/soundSeekers/content/expeditions.js";
import { SOUND_SEEKERS_REVIEW_SOURCE_ID } from "../src/features/soundSeekers/content/reviewSequences.js";
import {
  PRONUNCIATION_CORPUS_CONTENT_HASH,
  PRONUNCIATION_CORPUS_RECORD_COUNT,
  PRONUNCIATION_CORPUS_RECORD_IDS
} from "../src/features/soundSeekers/content/pronunciationCorpusInvariant.generated.js";
import { SOUND_SEEKERS_CONTENT_DECK_CATALOGS } from "../src/features/soundSeekers/content/contentDeckCatalogs.js";
import { CONTENT_DECK_BINDINGS, CONTENT_DECK_PLACEMENTS } from "../src/features/soundSeekers/content/contentDeckBindings.js";
import {
  SOUND_SEEKERS_CONNECTED_TEXT,
  toChildConnectedTextScene
} from "../src/features/soundSeekers/content/connectedText.js";
import {
  SOUND_SEEKERS_MEANING_VISUAL_OWNERS,
  SOUND_SEEKERS_NARRATIVE_BRANCH_OUTCOMES,
  SOUND_SEEKERS_VISUAL_SEMANTIC_REGISTRY
} from "../src/features/soundSeekers/content/sceneVisualSemantics.js";
import { SOUND_SEEKERS_CHAPTERS } from "../src/features/soundSeekers/content/chapters/index.js";
import { SOUND_SEEKERS_BIOME_KITS } from "../src/features/soundSeekers/content/biomeKits.js";
import {
  SOUND_SEEKERS_LANDMARK_BINDINGS,
  SOUND_SEEKERS_MEANING_VISUALS,
  SOUND_SEEKERS_OPTION_VISUALS,
  SOUND_SEEKERS_ROUTE_SPECS,
  SOUND_SEEKERS_SCENE_RENDER_SPECS
} from "../src/features/soundSeekers/visual/sceneVisualCatalog.js";
import {
  SOUND_SEEKERS_CHARACTER_VISUALS,
  SOUND_SEEKERS_PLAYER_VISUAL,
  SOUND_SEEKERS_POSE_IDS
} from "../src/features/soundSeekers/visual/characterCatalog.js";
import { SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS } from "../src/features/soundSeekers/visual/characterCustomization.js";
import { readSoundSeekersV2AssetManifest } from "./lib/soundSeekersV2AssetManifest.mjs";
import {
  SOUND_SEEKERS_V2_GALLERY_SHOT_MATRIX,
  assertSoundSeekersV2GalleryManifest,
  buildSoundSeekersV2GalleryManifest,
  canonicalJson,
  sha256Canonical,
  soundSeekersV2GalleryRunId
} from "./lib/soundSeekersV2GalleryManifest.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ARTIFACT_ROOT = path.join(ROOT, ".artifacts/sound-seekers-v2/content-gallery");
const BUILD_PREFIX = "literacypath-sound-seekers-task6-build-";
const MARKER_NAME = ".sound-seekers-task6-owned.json";
const GALLERY_ROOTS = [
  "tools/shootSoundSeekersV2Content.mjs",
  "tools/lib/soundSeekersV2GalleryManifest.mjs",
  "preview/sound-seekers-v2-content.html",
  "preview/sound-seekers-v2-content.jsx",
  "src/features/soundSeekers/preview/galleryReplayRecipes.js",
  "src/features/soundSeekers/preview/ContentArtGallery.jsx",
  "src/features/soundSeekers/preview/content-art-gallery.css"
];
const CONSTRAINED_PROFILE_IDS = new Set([
  "portrait-320x568", "landscape-568x320", "tablet-1194x834",
  "zoom-200-effective-320x568"
]);
const GALLERY_SOURCE_EXTENSIONS = Object.freeze([".js", ".jsx", ".mjs", ".ts", ".tsx", ".html", ".css"]);
const GALLERY_SOURCE_INDEXES = Object.freeze(GALLERY_SOURCE_EXTENSIONS.map(extension => `index${extension}`));

function sha256Bytes(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function withTimeout(promise, milliseconds, label) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${label} exceeded ${milliseconds}ms`)), milliseconds);
    })
  ]).finally(() => clearTimeout(timer));
}

function directoryFsync(directory) {
  const descriptor = openSync(directory, "r");
  try { fsyncSync(descriptor); } finally { closeSync(descriptor); }
}

function createBuildRoot() {
  const tempRealpath = realpathSync(os.tmpdir());
  const created = mkdtempSync(path.join(tempRealpath, BUILD_PREFIX));
  const rootRealpath = realpathSync(created);
  const stat = lstatSync(rootRealpath);
  if (!stat.isDirectory() || stat.isSymbolicLink() || readdirSync(rootRealpath).length !== 0) {
    throw new Error("fresh Task 6 build root is not one empty real directory");
  }
  const marker = { schemaVersion: 1, kind: "sound_seekers_task6_build_root", rootRealpath, device: stat.dev, inode: stat.ino };
  const markerPath = path.join(rootRealpath, MARKER_NAME);
  writeFileSync(markerPath, `${JSON.stringify(marker)}\n`, { encoding: "utf8", mode: 0o600, flag: "wx" });
  const descriptor = openSync(markerPath, "r");
  try { fsyncSync(descriptor); } finally { closeSync(descriptor); }
  directoryFsync(rootRealpath);
  return rootRealpath;
}

function validateOwnedBuildRoot(value) {
  if (typeof value !== "string" || !path.isAbsolute(value)) throw new TypeError("build root must be absolute");
  const root = path.resolve(value);
  const tempRoot = realpathSync(os.tmpdir());
  if (path.dirname(root) !== tempRoot || !path.basename(root).startsWith(BUILD_PREFIX)) {
    throw new TypeError("build root is outside the Task 6 OS-temporary namespace");
  }
  const stat = lstatSync(root);
  if (!stat.isDirectory() || stat.isSymbolicLink() || realpathSync(root) !== root) {
    throw new TypeError("build root is not one real directory");
  }
  const markerPath = path.join(root, MARKER_NAME);
  const markerStat = lstatSync(markerPath);
  if (!markerStat.isFile() || markerStat.isSymbolicLink() || (markerStat.mode & 0o777) !== 0o600) {
    throw new TypeError("build root ownership marker is unsafe");
  }
  const marker = JSON.parse(readFileSync(markerPath, "utf8"));
  if (Object.keys(marker).join(",") !== "schemaVersion,kind,rootRealpath,device,inode"
    || marker.schemaVersion !== 1 || marker.kind !== "sound_seekers_task6_build_root"
    || marker.rootRealpath !== root || marker.device !== stat.dev || marker.inode !== stat.ino) {
    throw new TypeError("build root ownership marker does not match the directory identity");
  }
  return root;
}

function cleanBuildRoot(value) {
  const root = validateOwnedBuildRoot(value);
  rmSync(root, { recursive: true });
  if (existsSync(root)) throw new Error("Task 6 build root cleanup did not complete");
}

function canonicalSourcePath(value) {
  if (typeof value !== "string" || value.length === 0 || value.includes("\\")) {
    throw new TypeError("gallery source path must be a non-empty POSIX path");
  }
  const normalized = path.posix.normalize(value.replace(/^\//u, ""));
  if (normalized === "." || normalized === ".." || normalized.startsWith("../") || path.posix.isAbsolute(normalized)) {
    throw new TypeError(`unsafe gallery source path ${value}`);
  }
  return normalized;
}

function staticImportSpecifier(node) {
  if (node?.type === "StringLiteral" || (node?.type === "Literal" && typeof node.value === "string")) {
    return node.value;
  }
  if (node?.type === "TemplateLiteral" && node.expressions.length === 0) {
    return node.quasis[0].value.cooked;
  }
  if (node?.type === "BinaryExpression" && node.operator === "+") {
    const left = staticImportSpecifier(node.left);
    const right = staticImportSpecifier(node.right);
    return typeof left === "string" && typeof right === "string" ? left + right : null;
  }
  return null;
}

function scriptSourceEdges(filePath, source) {
  const extension = path.posix.extname(filePath);
  const plugins = ["importAttributes", "topLevelAwait"];
  if (extension === ".jsx" || extension === ".tsx") plugins.push("jsx");
  if (extension === ".ts" || extension === ".tsx") plugins.push("typescript");
  let program;
  try {
    program = parse(source, { sourceType: "unambiguous", plugins });
  } catch (error) {
    throw new Error(`${filePath} could not be parsed for the gallery source graph: ${error.message}`, { cause: error });
  }
  const edges = [];
  const pending = [program];
  while (pending.length) {
    const node = pending.pop();
    if (!node || typeof node !== "object") continue;
    if ((node.type === "ImportDeclaration" || node.type === "ExportNamedDeclaration" || node.type === "ExportAllDeclaration")
      && node.source) {
      edges.push(node.source.value);
    }
    if (node.type === "CallExpression" && node.callee?.type === "Import") {
      const specifier = staticImportSpecifier(node.arguments?.[0]);
      if (typeof specifier !== "string") throw new Error(`${filePath} contains a non-literal dynamic import`);
      edges.push(specifier);
    }
    if (node.type === "ImportExpression") {
      const specifier = staticImportSpecifier(node.source);
      if (typeof specifier !== "string") throw new Error(`${filePath} contains a non-literal dynamic import`);
      edges.push(specifier);
    }
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) pending.push(...value);
      else if (value && typeof value === "object" && typeof value.type === "string") pending.push(value);
    }
  }
  return edges;
}

function gallerySourceEdges(filePath, source) {
  const extension = path.posix.extname(filePath);
  if (extension === ".html") {
    return [...source.matchAll(/<(?:script|link)\b[^>]*?\b(?:src|href)\s*=\s*["']([^"']+)["'][^>]*>/giu)]
      .map(match => match[1]);
  }
  if (extension === ".css") {
    return [...source.matchAll(/@import\s+(?:url\(\s*)?["']([^"']+)["']\s*\)?/giu)]
      .map(match => match[1]);
  }
  return scriptSourceEdges(filePath, source);
}

function resolveGallerySourceEdge(fromPath, specifier, sourcePaths) {
  if (typeof specifier !== "string" || (!specifier.startsWith(".") && !specifier.startsWith("/"))) return null;
  const withoutQuery = specifier.split(/[?#]/u)[0];
  const base = canonicalSourcePath(withoutQuery.startsWith("/")
    ? withoutQuery
    : path.posix.join(path.posix.dirname(fromPath), withoutQuery));
  const candidates = [
    base,
    ...GALLERY_SOURCE_EXTENSIONS.map(extension => `${base}${extension}`),
    ...GALLERY_SOURCE_INDEXES.map(index => path.posix.join(base, index))
  ];
  const resolved = candidates.find(candidate => sourcePaths.has(candidate));
  if (!resolved) throw new Error(`unresolved gallery source edge ${specifier} from ${fromPath}`);
  return resolved;
}

export function gallerySourceGraphFromSources({ rootPaths, sources }) {
  if (!Array.isArray(rootPaths) || !sources || typeof sources !== "object" || Array.isArray(sources)) {
    throw new TypeError("gallery source graph requires rootPaths and sources");
  }
  const normalizedSources = new Map();
  for (const [sourcePath, source] of Object.entries(sources)) {
    const canonicalPath = canonicalSourcePath(sourcePath);
    if (normalizedSources.has(canonicalPath) || typeof source !== "string") {
      throw new TypeError(`invalid or duplicate gallery source ${sourcePath}`);
    }
    normalizedSources.set(canonicalPath, source);
  }
  const pending = rootPaths.map(canonicalSourcePath);
  const visited = new Set();
  while (pending.length) {
    const filePath = pending.pop();
    if (visited.has(filePath)) continue;
    const source = normalizedSources.get(filePath);
    if (typeof source !== "string") throw new Error(`missing gallery source root ${filePath}`);
    visited.add(filePath);
    for (const specifier of gallerySourceEdges(filePath, source)) {
      const resolved = resolveGallerySourceEdge(filePath, specifier, normalizedSources);
      if (resolved) pending.push(resolved);
    }
  }
  return [...visited].map(filePath => ({
    path: filePath,
    sha256: sha256Bytes(Buffer.from(normalizedSources.get(filePath), "utf8"))
  })).sort((left, right) => left.path.localeCompare(right.path));
}

function repositoryGallerySources() {
  const sources = {};
  const pending = ["preview", "src", "tools"];
  while (pending.length) {
    const relativePath = pending.pop();
    const absolutePath = path.join(ROOT, relativePath);
    for (const entry of readdirSync(absolutePath, { withFileTypes: true })) {
      const childRelative = path.posix.join(relativePath, entry.name);
      if (entry.isDirectory()) pending.push(childRelative);
      else if (entry.isFile() && GALLERY_SOURCE_EXTENSIONS.includes(path.posix.extname(entry.name))) {
        sources[childRelative] = readFileSync(path.join(ROOT, childRelative), "utf8");
      }
    }
  }
  return sources;
}

function gallerySourceGraph() {
  return gallerySourceGraphFromSources({ rootPaths: GALLERY_ROOTS, sources: repositoryGallerySources() });
}

function sourceHashInputs(browserVersion) {
  const assetManifest = readSoundSeekersV2AssetManifest();
  return {
    contentCatalogSha256: sha256Canonical({
      chapters: SOUND_SEEKERS_CHAPTERS,
      expeditions: SOUND_SEEKERS_EXPEDITIONS,
      reviewSourceId: SOUND_SEEKERS_REVIEW_SOURCE_ID,
      pronunciationInvariant: { ids: PRONUNCIATION_CORPUS_RECORD_IDS, count: PRONUNCIATION_CORPUS_RECORD_COUNT, hash: PRONUNCIATION_CORPUS_CONTENT_HASH },
      catalogs: SOUND_SEEKERS_CONTENT_DECK_CATALOGS,
      bindings: CONTENT_DECK_BINDINGS,
      placements: CONTENT_DECK_PLACEMENTS,
      scenes: SOUND_SEEKERS_CONNECTED_TEXT,
      semantics: SOUND_SEEKERS_VISUAL_SEMANTIC_REGISTRY,
      branches: SOUND_SEEKERS_NARRATIVE_BRANCH_OUTCOMES,
      meaningOwners: SOUND_SEEKERS_MEANING_VISUAL_OWNERS
    }),
    visualCatalogSha256: sha256Canonical({
      biomeKits: SOUND_SEEKERS_BIOME_KITS,
      sceneRenderSpecs: SOUND_SEEKERS_SCENE_RENDER_SPECS,
      optionVisuals: SOUND_SEEKERS_OPTION_VISUALS,
      routeSpecs: SOUND_SEEKERS_ROUTE_SPECS,
      landmarkBindings: SOUND_SEEKERS_LANDMARK_BINDINGS,
      characterVisuals: SOUND_SEEKERS_CHARACTER_VISUALS,
      playerVisual: SOUND_SEEKERS_PLAYER_VISUAL,
      poseIds: SOUND_SEEKERS_POSE_IDS,
      meaningVisuals: SOUND_SEEKERS_MEANING_VISUALS
    }),
    creatorOptionsSha256: sha256Canonical(SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS),
    assetManifestSha256: sha256Canonical(assetManifest),
    browserName: "chromium",
    browserVersion,
    gallerySourceGraphSha256: sha256Canonical(gallerySourceGraph())
  };
}

function pngFacts(filePath) {
  const bytes = readFileSync(filePath);
  if (bytes.length < 24 || bytes.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") throw new Error(`${filePath}: screenshot is not PNG`);
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
    byteLength: bytes.length,
    sha256: sha256Bytes(bytes)
  };
}

function verifyCompleteRun(runDirectory, expectedRunId) {
  const manifestPath = path.join(runDirectory, "manifest.json");
  if (!existsSync(manifestPath)) throw new Error("existing gallery run has no manifest");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  assertSoundSeekersV2GalleryManifest(manifest);
  if (manifest.runId !== expectedRunId) throw new Error("existing gallery run identity changed");
  const expectedFiles = new Set(["manifest.json", ...manifest.shots.map(shot => shot.relativePngPath)]);
  const actualFiles = ["manifest.json", ...readdirSync(path.join(runDirectory, "shots")).map(name => `shots/${name}`)];
  if (actualFiles.some(file => !expectedFiles.has(file)) || actualFiles.length !== expectedFiles.size) {
    throw new Error("existing gallery run has orphaned or missing files");
  }
  for (const record of manifest.shots) {
    const filePath = path.join(runDirectory, record.relativePngPath);
    const facts = pngFacts(filePath);
    if (canonicalJson(facts) !== canonicalJson(record.png)) throw new Error(`${record.relativePngPath}: screenshot facts changed`);
  }
  return manifest;
}

async function waitForServer(baseUrl, server) {
  const ready = () => new Promise(resolve => {
    const request = get(`${baseUrl}/preview/sound-seekers-v2-content.html`, response => {
      response.resume();
      resolve((response.statusCode || 500) < 400);
    });
    request.setTimeout(1_000, () => request.destroy());
    request.once("error", () => resolve(false));
  });
  await withTimeout((async () => {
    while (true) {
      if (server.exitCode !== null) throw new Error(`Vite exited before readiness (${server.exitCode})`);
      if (await ready()) return;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  })(), 45_000, "Vite readiness");
}

async function stopServer(server) {
  if (!server || server.exitCode !== null) return;
  try { process.kill(-server.pid, "SIGTERM"); } catch { void 0; }
  try {
    await withTimeout(new Promise(resolve => server.once("exit", resolve)), 10_000, "Vite termination");
  } catch {
    try { process.kill(-server.pid, "SIGKILL"); } catch { void 0; }
  }
}

async function captureShot(page, cdp, matrix, baseUrl, targetPath) {
  await page.setViewportSize({
    width: matrix.viewport.width / matrix.browserZoom,
    height: matrix.viewport.height / matrix.browserZoom
  });
  await cdp.send("Emulation.setPageScaleFactor", { pageScaleFactor: 1 });
  const consoleErrors = [];
  const pageErrors = [];
  const rawFailures = [];
  const onConsole = message => { if (message.type() === "error") consoleErrors.push(message.text()); };
  const onPageError = error => pageErrors.push(error.message);
  const onRequestFailed = request => rawFailures.push({ url: new URL(request.url()).pathname, method: request.method() });
  page.on("console", onConsole);
  page.on("pageerror", onPageError);
  page.on("requestfailed", onRequestFailed);
  let abortCount = 0;
  const routePattern = matrix.kind === "background-failure" ? `**${matrix.asset.path}` : null;
  if (routePattern) {
    await page.route(routePattern, async route => {
      abortCount += 1;
      await route.abort("failed");
    });
  }
  try {
    const navigateGallery = async relativeUrl => {
      await withTimeout(page.goto(`${baseUrl}${relativeUrl}`, { waitUntil: "domcontentloaded", timeout: 30_000 }), 30_000, "gallery navigation");
      await withTimeout(page.locator("[data-gallery-ready='true']").waitFor({ state: "visible" }), 15_000, "gallery ready");
      await withTimeout(page.evaluate(() => document.fonts.ready), 5_000, "gallery fonts");
      await withTimeout(page.waitForFunction(() => [...document.images].every(image => image.complete)), 10_000, "gallery images");
    };
    await navigateGallery(matrix.url);
    let bossPngBytes = null;
    let bossRenderedBase = null;
    let payoffComparison = null;
    if (matrix.kind === "boss-branch") {
      const variants = [];
      for (const mode of ["ordinary", "wonder", "boss-resolved"]) {
        const variantUrl = new URL(matrix.url, "http://gallery.invalid");
        variantUrl.searchParams.set("mode", mode === "ordinary"
          ? "route-landmark" : mode === "wonder" ? "wonder" : "scene");
        await navigateGallery(`${variantUrl.pathname}${variantUrl.search}`);
        const rendered = await page.locator("[data-task4-rendered-subtree]").evaluate(root => ({
          selectedOptionVisualId: root.querySelector('[data-option-visual-id][data-control-state="settled"]')
            ?.getAttribute("data-option-visual-id") || null,
          postDecisionSemanticId: root.querySelector('[data-semantic-kind="post_decision"]')
            ?.getAttribute("data-code-native-semantic") || null,
          resolvedVisualStateId: root.querySelector("[data-sound-seekers-scene]")
            ?.getAttribute("data-visual-state-id") || null,
          landmarkStateId: root.querySelector("[data-landmark-state]")
            ?.getAttribute("data-landmark-state") || null,
          compositionMode: root.querySelector("[data-world-composition]")
            ?.getAttribute("data-world-composition") || null,
          compositionSignature: root.querySelector("[data-world-composition-signature]")
            ?.getAttribute("data-world-composition-signature") || null
        }));
        const expectedSignature = matrix.expectedRenderedFacts[
          mode === "ordinary" ? "ordinaryCompositionSignature"
            : mode === "wonder" ? "wonderCompositionSignature" : "bossCompositionSignature"
        ];
        const expectedBase = {
          selectedOptionVisualId: matrix.expectedRenderedFacts.selectedOptionVisualId,
          postDecisionSemanticId: matrix.expectedRenderedFacts.postDecisionSemanticId,
          resolvedVisualStateId: matrix.expectedRenderedFacts.resolvedVisualStateId,
          landmarkStateId: matrix.expectedRenderedFacts.landmarkStateId,
          compositionMode: mode,
          compositionSignature: expectedSignature
        };
        if (canonicalJson(rendered) !== canonicalJson(expectedBase)) {
          throw new Error(`${matrix.id}: ${mode} selected-branch rendering drifted ${JSON.stringify({ rendered, expectedBase })}`);
        }
        const pngBytes = await withTimeout(
          page.screenshot({ fullPage: false, animations: "disabled" }),
          15_000,
          `${mode} boss comparison screenshot`
        );
        variants.push({ mode, compositionSignature: rendered.compositionSignature, pngSha256: sha256Bytes(pngBytes) });
        if (mode === "boss-resolved") {
          bossPngBytes = pngBytes;
          bossRenderedBase = rendered;
        }
      }
      payoffComparison = {
        selectedOptionVisualId: bossRenderedBase.selectedOptionVisualId,
        resolvedVisualStateId: bossRenderedBase.resolvedVisualStateId,
        variants
      };
    }
    const option = page.locator("[data-option-visual-id]").first();
    if (matrix.kind === "input-focus") {
      const box = await option.boundingBox();
      if (!box || box.width < 56 || box.height < 56) throw new Error("input target is smaller than 56 CSS px");
      if (matrix.inputKind === "pointer") {
        await page.mouse.click(box.x + (box.width / 2), box.y + (box.height / 2));
      } else if (matrix.inputKind === "touch") {
        await page.touchscreen.tap(box.x + (box.width / 2), box.y + (box.height / 2));
      } else {
        await option.focus();
        await page.keyboard.press(matrix.inputKind);
      }
    }
    const zoom = await page.evaluate(() => ({
      scale: window.visualViewport?.scale || 1,
      width: window.visualViewport?.width || window.innerWidth,
      height: window.visualViewport?.height || window.innerHeight,
      devicePixelRatio: window.devicePixelRatio
    }));
    if (matrix.browserZoom === 2 && (zoom.devicePixelRatio !== 2
      || Math.round(zoom.width) !== 320 || Math.round(zoom.height) !== 568)) {
      throw new Error(`CDP zoom evidence drifted: ${JSON.stringify(zoom)}`);
    }
    const observedCodeNative = await page.locator("[data-task4-rendered-subtree]").evaluate(root => {
      const attributes = [
        "data-semantic-id", "data-code-native-semantic", "data-route-id", "data-landmark-id",
        "data-visual-state-id", "data-option-visual-id", "data-choice-frame", "data-option-prop",
        "data-option-action", "data-meaning-semantic-id", "data-prop-family"
      ];
      const values = attributes.flatMap(attribute => [...root.querySelectorAll(`[${attribute}]`)]
        .map(node => node.getAttribute(attribute)));
      values.push(...[...root.querySelectorAll("[data-character-id]")]
        .map(node => `character:${node.getAttribute("data-character-id").toLocaleLowerCase("en-US")}`));
      return [...new Set(values.filter(Boolean))].sort();
    });
    const visibleControlIds = await page.locator("button:visible").evaluateAll(nodes => nodes.map((node, index) =>
      node.getAttribute("data-option-visual-id") || node.getAttribute("data-option-id") || node.getAttribute("aria-label") || `button-${index + 1}`));
    const focusTargetId = await page.evaluate(() => document.activeElement?.getAttribute("data-option-visual-id")
      || document.activeElement?.getAttribute("data-option-id") || null);
    const noAnswerLeak = await page.locator("[data-private-answer],[data-correct],[data-expected-token]").count() === 0
      && !await page.locator("[data-task4-rendered-subtree]").evaluate(root =>
        /expectedToken|private-answer|data-correct|correctness/iu.test(root.innerHTML));
    const activation = await page.locator("[data-gallery-root]").evaluate(root => ({
      count: Number(root.getAttribute("data-gallery-activation-count")),
      token: root.getAttribute("data-gallery-last-activation-token") || ""
    }));
    const expectedActivationToken = matrix.kind === "input-focus"
      ? toChildConnectedTextScene(matrix.sceneId, `gallery:${matrix.seed}`).choice.options[0].token
      : "";
    const renderedFacts = matrix.kind === "character-pose"
      ? await page.locator("[data-task4-rendered-subtree] [data-sound-seekers-character]").evaluate(node => ({
        kind: "character-pose",
        characterId: node.getAttribute("data-character-id"),
        poseId: node.getAttribute("data-pose-id"),
        poseRendererId: node.getAttribute("data-pose-renderer-id"),
        poseCompositionSignature: node.getAttribute("data-pose-composition-signature"),
        characterVisualSignature: node.getAttribute("data-character-visual-signature"),
        renderedPartIds: [...node.querySelectorAll("[data-character-part]")]
          .map(part => part.getAttribute("data-character-part"))
      }))
      : matrix.kind === "creator-option"
        ? await page.locator("[data-task4-rendered-subtree]").evaluate((root, selectedOptionId) => {
          const factsFor = context => {
            const node = root.querySelector(`[data-character-context="${context}"] [data-sound-seekers-character]`);
            return {
              signature: node?.getAttribute("data-appearance-signature") || null,
              parts: [...(node?.querySelectorAll("[data-character-part]") || [])]
                .map(part => part.getAttribute("data-character-part"))
            };
          };
          const selected = root.querySelector(`[data-option-id="${CSS.escape(selectedOptionId)}"][aria-pressed="true"]`);
          const preview = factsFor("creator-preview");
          const world = factsFor("gallery-world");
          return {
            kind: "creator-option",
            selectedOptionId: selected?.getAttribute("data-option-id") || null,
            serializedAppearance: root.getAttribute("data-creator-serialized"),
            appearanceSignature: root.getAttribute("data-creator-signature"),
            previewAppearanceSignature: preview.signature,
            worldAppearanceSignature: world.signature,
            previewRenderedPartIds: preview.parts,
            worldRenderedPartIds: world.parts
          };
        }, matrix.subjectId)
        : matrix.kind === "boss-branch"
          ? {
            kind: "boss-branch",
            selectedOptionVisualId: bossRenderedBase.selectedOptionVisualId,
            postDecisionSemanticId: bossRenderedBase.postDecisionSemanticId,
            resolvedVisualStateId: bossRenderedBase.resolvedVisualStateId,
            landmarkStateId: bossRenderedBase.landmarkStateId,
            ordinaryCompositionSignature: payoffComparison.variants[0].compositionSignature,
            wonderCompositionSignature: payoffComparison.variants[1].compositionSignature,
            bossCompositionSignature: payoffComparison.variants[2].compositionSignature
          }
          : null;
    const layout = matrix.kind === "profile-viewport-zoom"
      && CONSTRAINED_PROFILE_IDS.has(matrix.subjectId) ? await page.evaluate(() => {
      const round = value => Math.round(value * 100) / 100;
      const rectFacts = rect => ({
        x: round(rect.x),
        y: round(rect.y),
        width: round(rect.width),
        height: round(rect.height),
        right: round(rect.right),
        bottom: round(rect.bottom)
      });
      const visibleRects = selector => [...document.querySelectorAll(selector)]
        .map(node => node.getBoundingClientRect())
        .filter(rect => rect.width > 0 && rect.height > 0);
      const union = selector => {
        const rects = visibleRects(selector);
        if (!rects.length) return null;
        const x = Math.min(...rects.map(rect => rect.x));
        const y = Math.min(...rects.map(rect => rect.y));
        const right = Math.max(...rects.map(rect => rect.right));
        const bottom = Math.max(...rects.map(rect => rect.bottom));
        return rectFacts({ x, y, right, bottom, width: right - x, height: bottom - y });
      };
      const viewport = window.visualViewport;
      const viewportWidth = viewport?.width || window.innerWidth;
      const viewportHeight = viewport?.height || window.innerHeight;
      return {
        viewport: { width: round(viewportWidth), height: round(viewportHeight) },
        horizontalOverflow: round(Math.max(0,
          document.documentElement.scrollWidth - document.documentElement.clientWidth)),
        verticalOverflow: round(Math.max(0,
          document.documentElement.scrollHeight - viewportHeight)),
        goal: union("[data-scene-text], [data-scene-prompt]"),
        target: union(".sound-seekers-world__props"),
        actors: union(".sound-seekers-world__characters"),
        landmark: union(".sound-seekers-landmark"),
        controls: visibleRects("[data-option-visual-id]").map(rectFacts)
      };
    }) : null;
    if (bossPngBytes) writeFileSync(targetPath, bossPngBytes, { flag: "wx" });
    else await withTimeout(page.screenshot({ path: targetPath, fullPage: false, animations: "disabled" }), 15_000, "gallery screenshot");
    const failedRequests = matrix.kind === "background-failure" && abortCount === 1
      && rawFailures.length === 1 && rawFailures[0].url === matrix.asset.path && rawFailures[0].method === "GET"
      ? [{ url: matrix.asset.path, method: "GET", reason: "route_abort" }]
      : rawFailures.map(failure => ({ ...failure, reason: "unexpected" }));
    const expectedAbortConsole = matrix.kind === "background-failure"
      && consoleErrors.every(message => message === "Failed to load resource: net::ERR_FAILED");
    const normalizedConsoleErrors = expectedAbortConsole ? [] : consoleErrors;
    if (canonicalJson(observedCodeNative) !== canonicalJson(matrix.expectedCodeNativeSemanticIds)
      || canonicalJson(visibleControlIds) !== canonicalJson(matrix.expectedVisibleControlIds)
      || focusTargetId !== matrix.expectedFocusTargetId
      || activation.count !== (matrix.kind === "input-focus" ? 1 : 0)
      || activation.token !== expectedActivationToken
      || canonicalJson(renderedFacts) !== canonicalJson(matrix.expectedRenderedFacts)
      || normalizedConsoleErrors.length || pageErrors.length || !noAnswerLeak
      || (matrix.kind === "background-failure" ? failedRequests[0]?.reason !== "route_abort" : failedRequests.length)) {
      throw new Error(`${matrix.id}: gallery runtime evidence failed ${JSON.stringify({
        abortCount, consoleErrors, pageErrors, rawFailures, observedCodeNative,
        expectedCodeNative: matrix.expectedCodeNativeSemanticIds,
        visibleControlIds, expectedVisibleControlIds: matrix.expectedVisibleControlIds,
        focusTargetId, expectedFocusTargetId: matrix.expectedFocusTargetId,
        activation, expectedActivationToken, renderedFacts,
        expectedRenderedFacts: matrix.expectedRenderedFacts, noAnswerLeak
      })}`);
    }
    return {
      expectedCodeNativeSemanticIds: observedCodeNative,
      expectedRenderedFacts: renderedFacts,
      checks: {
        consoleErrors: normalizedConsoleErrors,
        pageErrors,
        failedRequests,
        visibleControlIds,
        focusTargetId,
        noAnswerLeak,
        layout,
        payoffComparison
      }
    };
  } finally {
    if (routePattern) await page.unroute(routePattern);
    page.off("console", onConsole);
    page.off("pageerror", onPageError);
    page.off("requestfailed", onRequestFailed);
  }
}

async function shoot() {
  mkdirSync(ARTIFACT_ROOT, { recursive: true });
  const port = 5192;
  const baseUrl = `http://127.0.0.1:${port}`;
  const server = spawn("npm", ["run", "dev", "--", "--host", "127.0.0.1", "--port", String(port), "--strictPort"], {
    cwd: ROOT,
    stdio: "ignore",
    detached: true,
    env: { ...process.env, VITE_SUPABASE_URL: baseUrl, VITE_SUPABASE_ANON_KEY: "sound-seekers-gallery-test-key" }
  });
  let browser;
  let context;
  let page;
  let partialDirectory = null;
  try {
    await waitForServer(baseUrl, server);
    browser = await chromium.launch();
    const sourceHashes = sourceHashInputs(browser.version());
    const runId = soundSeekersV2GalleryRunId({ sourceHashes });
    const runDirectory = path.join(ARTIFACT_ROOT, runId);
    partialDirectory = path.join(ARTIFACT_ROOT, `${runId}.partial`);
    if (existsSync(runDirectory)) {
      verifyCompleteRun(runDirectory, runId);
      console.log(runId);
      return;
    }
    if (existsSync(partialDirectory)) rmSync(partialDirectory, { recursive: true });
    mkdirSync(path.join(partialDirectory, "shots"), { recursive: true });
    const openContext = async (hasTouch, deviceScaleFactor) => {
      context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
        deviceScaleFactor,
        hasTouch,
        isMobile: hasTouch
      });
      page = await context.newPage();
      return context.newCDPSession(page);
    };
    let contextHasTouch = false;
    let contextDeviceScaleFactor = 1;
    let cdp = await openContext(contextHasTouch, contextDeviceScaleFactor);
    const records = [];
    for (const matrix of SOUND_SEEKERS_V2_GALLERY_SHOT_MATRIX) {
      const needsTouch = matrix.kind === "input-focus" && matrix.inputKind === "touch";
      const neededDeviceScaleFactor = matrix.browserZoom;
      if ((matrix.ordinal > 1 && (matrix.ordinal - 1) % 100 === 0)
        || needsTouch !== contextHasTouch || neededDeviceScaleFactor !== contextDeviceScaleFactor) {
        await withTimeout(page.close(), 10_000, "gallery page rotation");
        await withTimeout(context.close(), 10_000, "gallery context rotation");
        contextHasTouch = needsTouch;
        contextDeviceScaleFactor = neededDeviceScaleFactor;
        cdp = await openContext(contextHasTouch, contextDeviceScaleFactor);
      }
      await withTimeout((async () => {
        const relativePngPath = `shots/${String(matrix.ordinal).padStart(4, "0")}-${matrix.id}.png`;
        const targetPath = path.join(partialDirectory, relativePngPath);
        let observed;
        try {
          observed = await captureShot(page, cdp, matrix, baseUrl, targetPath);
        } catch (error) {
          throw new Error(`${matrix.ordinal} ${matrix.id}: ${error.message}`, { cause: error });
        }
        const png = pngFacts(targetPath);
        records.push({
          ordinal: matrix.ordinal, id: matrix.id, kind: matrix.kind, relativePngPath,
          url: matrix.url, seed: matrix.seed, fixtureId: matrix.fixtureId,
          chapterId: matrix.chapterId, stopId: matrix.stopId, sceneId: matrix.sceneId,
          subjectId: matrix.subjectId, cropProfileId: matrix.cropProfileId,
          densityProfile: matrix.densityProfile, motionProfile: matrix.motionProfile,
          viewport: matrix.viewport, browserZoom: matrix.browserZoom,
          expectedCodeNativeSemanticIds: observed.expectedCodeNativeSemanticIds,
          reviewBackdropSemanticIds: matrix.reviewBackdropSemanticIds,
          optionIds: matrix.optionIds,
          asset: matrix.asset || { path: null, sha256: null, cropRecordSha256: null },
          expectedRenderedFacts: observed.expectedRenderedFacts,
          png, checks: observed.checks, status: "passed"
        });
      })(), 45_000, `shot ${matrix.ordinal}`);
    }
    const manifest = buildSoundSeekersV2GalleryManifest({ sourceHashes, shots: records });
    assertSoundSeekersV2GalleryManifest(manifest);
    const manifestPath = path.join(partialDirectory, "manifest.json");
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
    const descriptor = openSync(manifestPath, "r");
    try { fsyncSync(descriptor); } finally { closeSync(descriptor); }
    directoryFsync(path.join(partialDirectory, "shots"));
    directoryFsync(partialDirectory);
    renameSync(partialDirectory, runDirectory);
    partialDirectory = null;
    directoryFsync(ARTIFACT_ROOT);
    verifyCompleteRun(runDirectory, runId);
    console.log(runId);
  } finally {
    if (page) await withTimeout(page.close(), 10_000, "page close").catch(() => {});
    if (context) await withTimeout(context.close(), 10_000, "context close").catch(() => {});
    if (browser) await withTimeout(browser.close(), 10_000, "browser close").catch(() => {});
    await stopServer(server);
    if (partialDirectory && existsSync(partialDirectory)) rmSync(partialDirectory, { recursive: true });
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args[0] === "--create-build-root") {
    if (args.length !== 1) throw new TypeError("--create-build-root accepts no other arguments");
    console.log(createBuildRoot());
    return;
  }
  if (args[0] === "--clean-build-root") {
    if (args.length !== 2) throw new TypeError("--clean-build-root requires one absolute path");
    cleanBuildRoot(args[1]);
    return;
  }
  if (args[0] === "--check") {
    if (args.length !== 2 || !/^[a-f0-9]{24}$/u.test(args[1])) throw new TypeError("--check requires one run ID");
    verifyCompleteRun(path.join(ARTIFACT_ROOT, args[1]), args[1]);
    console.log(args[1]);
    return;
  }
  if (args[0] === "--clean-partials") {
    if (args.length !== 2 || !/^[a-f0-9]{24}$/u.test(args[1])) throw new TypeError("--clean-partials requires one run ID");
    const target = path.join(ARTIFACT_ROOT, `${args[1]}.partial`);
    if (existsSync(target)) rmSync(target, { recursive: true });
    return;
  }
  if (args.length) throw new TypeError("unknown screenshot runner argument");
  await shoot();
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error(`Sound Seekers v2 screenshot runner failed: ${error.message}`);
    process.exitCode = 1;
  });
}

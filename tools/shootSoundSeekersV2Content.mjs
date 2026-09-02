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
import { SOUND_SEEKERS_CONNECTED_TEXT } from "../src/features/soundSeekers/content/connectedText.js";
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

function localEdges(filePath, source) {
  const edges = [];
  const extension = path.extname(filePath);
  const patterns = extension === ".html"
    ? [/(?:src|href)=["']([^"']+)["']/gu]
    : extension === ".css"
      ? [/@import\s+(?:url\()?\s*["']([^"']+)["']/gu]
      : [/(?:import|export)\s+(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']/gu, /import\(\s*["']([^"']+)["']\s*\)/gu];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      if (match[1].startsWith(".") || match[1].startsWith("/")) edges.push(match[1]);
    }
  }
  if (extension !== ".html" && extension !== ".css") {
    for (const match of source.matchAll(/import\(([^)]+)\)/gu)) {
      if (!/^\s*["']/u.test(match[1]) && /[./]/u.test(match[1])) {
        throw new Error(`${path.relative(ROOT, filePath)} contains a non-literal local dynamic import`);
      }
    }
  }
  return edges;
}

function resolveLocalImport(fromPath, specifier) {
  const withoutQuery = specifier.split(/[?#]/u)[0];
  const base = withoutQuery.startsWith("/")
    ? path.join(ROOT, withoutQuery.replace(/^\//u, ""))
    : path.resolve(path.dirname(fromPath), withoutQuery);
  const candidates = [base, ...[".js", ".jsx", ".mjs", ".css", ".html"].map(ext => `${base}${ext}`),
    ...["index.js", "index.jsx", "index.mjs"].map(name => path.join(base, name))];
  const resolved = candidates.find(candidate => existsSync(candidate) && lstatSync(candidate).isFile());
  if (!resolved || !path.relative(ROOT, resolved) || path.relative(ROOT, resolved).startsWith("..")) {
    throw new Error(`unresolved or unsafe gallery source edge ${specifier} from ${path.relative(ROOT, fromPath)}`);
  }
  return resolved;
}

function gallerySourceGraph() {
  const pending = GALLERY_ROOTS.map(relativePath => path.join(ROOT, relativePath));
  const visited = new Set();
  while (pending.length) {
    const filePath = pending.pop();
    const real = realpathSync(filePath);
    if (visited.has(real)) continue;
    visited.add(real);
    const source = readFileSync(real, "utf8");
    for (const edge of localEdges(real, source)) pending.push(resolveLocalImport(real, edge));
  }
  return [...visited].map(filePath => ({
    path: path.relative(ROOT, filePath).split(path.sep).join("/"),
    sha256: sha256Bytes(readFileSync(filePath))
  })).sort((left, right) => left.path.localeCompare(right.path));
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
  await page.setViewportSize(matrix.viewport);
  await cdp.send("Emulation.setPageScaleFactor", { pageScaleFactor: matrix.browserZoom });
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
    await withTimeout(page.goto(`${baseUrl}${matrix.url}`, { waitUntil: "domcontentloaded", timeout: 30_000 }), 30_000, "gallery navigation");
    await withTimeout(page.locator("[data-gallery-ready='true']").waitFor({ state: "visible" }), 15_000, "gallery ready");
    await withTimeout(page.evaluate(() => document.fonts.ready), 5_000, "gallery fonts");
    await withTimeout(page.waitForFunction(() => [...document.images].every(image => image.complete)), 10_000, "gallery images");
    const option = page.locator("[data-option-visual-id]").first();
    if (matrix.kind === "input-focus") {
      await option.focus();
      if (matrix.inputKind === "Enter" || matrix.inputKind === "Space") await option.press(matrix.inputKind);
      else await option.click();
    }
    const zoom = await page.evaluate(() => ({
      scale: window.visualViewport?.scale || 1,
      width: window.visualViewport?.width || window.innerWidth,
      height: window.visualViewport?.height || window.innerHeight
    }));
    if (matrix.browserZoom === 2 && (zoom.scale !== 2 || Math.round(zoom.width) !== 320 || Math.round(zoom.height) !== 568)) {
      throw new Error(`CDP zoom evidence drifted: ${JSON.stringify(zoom)}`);
    }
    const observedCodeNative = await page.locator("[data-code-native-semantic-id]")
      .evaluateAll(nodes => [...new Set(nodes.map(node => node.getAttribute("data-code-native-semantic-id")))].sort());
    const visibleControlIds = await page.locator("button:visible").evaluateAll(nodes => nodes.map((node, index) =>
      node.getAttribute("data-option-visual-id") || node.getAttribute("data-option-id") || node.getAttribute("aria-label") || `button-${index + 1}`));
    const focusTargetId = await page.evaluate(() => document.activeElement?.getAttribute("data-option-visual-id")
      || document.activeElement?.getAttribute("data-option-id") || null);
    const noAnswerLeak = await page.locator("[data-private-answer],[data-correct],[data-expected-token]").count() === 0;
    await withTimeout(page.screenshot({ path: targetPath, fullPage: false, animations: "disabled" }), 15_000, "gallery screenshot");
    const failedRequests = matrix.kind === "background-failure" && abortCount === 1
      && rawFailures.length === 1 && rawFailures[0].url === matrix.asset.path && rawFailures[0].method === "GET"
      ? [{ url: matrix.asset.path, method: "GET", reason: "route_abort" }]
      : rawFailures.map(failure => ({ ...failure, reason: "unexpected" }));
    const expectedAbortConsole = matrix.kind === "background-failure"
      && consoleErrors.every(message => message === "Failed to load resource: net::ERR_FAILED");
    const normalizedConsoleErrors = expectedAbortConsole ? [] : consoleErrors;
    if (normalizedConsoleErrors.length || pageErrors.length || !noAnswerLeak
      || (matrix.kind === "background-failure" ? failedRequests[0]?.reason !== "route_abort" : failedRequests.length)) {
      throw new Error(`${matrix.id}: gallery runtime evidence failed ${JSON.stringify({
        abortCount, consoleErrors, pageErrors, rawFailures, noAnswerLeak
      })}`);
    }
    return {
      expectedCodeNativeSemanticIds: observedCodeNative,
      checks: {
        consoleErrors: normalizedConsoleErrors,
        pageErrors,
        failedRequests,
        visibleControlIds,
        focusTargetId,
        noAnswerLeak
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
    context = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
    page = await context.newPage();
    let cdp = await context.newCDPSession(page);
    const records = [];
    for (const matrix of SOUND_SEEKERS_V2_GALLERY_SHOT_MATRIX) {
      if (matrix.ordinal > 1 && (matrix.ordinal - 1) % 100 === 0) {
        await withTimeout(page.close(), 10_000, "gallery page rotation");
        await withTimeout(context.close(), 10_000, "gallery context rotation");
        context = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
        page = await context.newPage();
        cdp = await context.newCDPSession(page);
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

import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  writeFileSync
} from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import sharp from "sharp";

import {
  SOUND_SEEKERS_BIOME_KITS,
  computeBackgroundCrop,
  validateSoundSeekersBiomeKits
} from "../src/features/soundSeekers/content/biomeKits.js";
import {
  SOUND_SEEKERS_V2_ACTION_LANE,
  SOUND_SEEKERS_V2_BACKGROUND_ORDER,
  SOUND_SEEKERS_V2_PROFILE_ORDER,
  canonicalStringify,
  sha256Bytes,
  sha256Canonical
} from "./lib/soundSeekersV2AssetManifest.mjs";

const SOURCE_SIZE = Object.freeze([1536, 864]);
const PNG_OPTIONS = Object.freeze({
  compressionLevel: 9,
  adaptiveFiltering: false,
  palette: false
});
const HASH_PATTERN = /^[a-f0-9]{64}$/u;
const PANEL_KEYS = Object.freeze([
  "callOrdinal",
  "chapterId",
  "profileId",
  "file",
  "targetSize",
  "sourceSha256",
  "finalSha256",
  "retainedRect",
  "focalPoint",
  "quietZone",
  "actionLane",
  "overlayPixels",
  "panelSha256"
]);
const COLORS = Object.freeze({
  retainedEdge: Object.freeze([0, 229, 255, 255]),
  quietZone: Object.freeze([255, 214, 10, 255]),
  actionLane: Object.freeze([255, 79, 216, 255]),
  focalPoint: Object.freeze([255, 255, 255, 255])
});

export const SOUND_SEEKERS_V2_CROP_REVIEW_RENDERER = Object.freeze({
  sharpVersion: sharp.versions.sharp,
  libvipsVersion: sharp.versions.vips,
  panelFormat: "png",
  pngOptions: PNG_OPTIONS,
  rounding: Object.freeze({
    positivePoint: "floor(value + 0.5)",
    rectangleStart: "floor",
    rectangleEnd: "ceil"
  }),
  overlayContract: Object.freeze({
    retainedEdge: Object.freeze({ inset: true, strokePixels: 3, rgba: COLORS.retainedEdge }),
    quietZone: Object.freeze({ strokePixels: 3, rgba: COLORS.quietZone }),
    actionLane: Object.freeze({
      normalized: SOUND_SEEKERS_V2_ACTION_LANE,
      strokePixels: 3,
      rgba: COLORS.actionLane
    }),
    focalPoint: Object.freeze({ axisLengthPixels: 9, strokePixels: 1, rgba: COLORS.focalPoint })
  })
});

function same(left, right) {
  return canonicalStringify(left) === canonicalStringify(right);
}

function assertExactKeys(value, expected, label) {
  if (value === null || typeof value !== "object" || Array.isArray(value)
    || Object.getPrototypeOf(value) !== Object.prototype) {
    throw new TypeError(`${label} must be an object`);
  }
  if (!same(Object.keys(value).sort(), [...expected].sort())) {
    throw new TypeError(`${label} has missing or extra keys`);
  }
}

function assertHash(value, label) {
  if (typeof value !== "string" || !HASH_PATTERN.test(value)) {
    throw new TypeError(`${label} must be a lowercase SHA-256 hash`);
  }
}

function resolveScopedPath(root, value, label) {
  if (typeof root !== "string" || root.length === 0 || !path.isAbsolute(root)) {
    throw new TypeError("crop-review root must be an absolute path");
  }
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new TypeError(`${label} must be a path`);
  }
  return path.isAbsolute(value) ? path.normalize(value) : path.resolve(root, value);
}

function isStrictDescendant(candidate, parent) {
  const relative = path.relative(parent, candidate);
  return relative.length > 0 && relative !== ".."
    && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

function assertRegularFile(filePath, parentRoot, label) {
  const stats = lstatSync(filePath);
  if (!stats.isFile() || stats.isSymbolicLink()) {
    throw new TypeError(`${label} must be a non-symlink regular file`);
  }
  const realParent = realpathSync(parentRoot);
  const realFile = realpathSync(filePath);
  if (!isStrictDescendant(realFile, realParent)) {
    throw new TypeError(`${label} escapes its candidate root`);
  }
}

function normalizedRectInside(inner, outer) {
  const epsilon = 1e-12;
  return inner.x + epsilon >= outer.x
    && inner.y + epsilon >= outer.y
    && inner.x + inner.width <= outer.x + outer.width + epsilon
    && inner.y + inner.height <= outer.y + outer.height + epsilon;
}

function mappedRectangle(rect, retainedRect, targetSize) {
  const [width, height] = targetSize;
  const left = Math.floor(((rect.x - retainedRect.x) / retainedRect.width) * width);
  const top = Math.floor(((rect.y - retainedRect.y) / retainedRect.height) * height);
  const right = Math.ceil(
    ((rect.x + rect.width - retainedRect.x) / retainedRect.width) * width
  );
  const bottom = Math.ceil(
    ((rect.y + rect.height - retainedRect.y) / retainedRect.height) * height
  );
  return { left, top, right, bottom };
}

function panelRectangle(rect, targetSize) {
  const [width, height] = targetSize;
  return {
    left: Math.floor(rect.x * width),
    top: Math.floor(rect.y * height),
    right: Math.ceil((rect.x + rect.width) * width),
    bottom: Math.ceil((rect.y + rect.height) * height)
  };
}

function mappedPoint(point, retainedRect, targetSize) {
  return {
    x: Math.floor((((point[0] - retainedRect.x) / retainedRect.width)
      * targetSize[0]) + 0.5),
    y: Math.floor((((point[1] - retainedRect.y) / retainedRect.height)
      * targetSize[1]) + 0.5)
  };
}

function buildOverlayPixels(profile, retainedRect) {
  if (!normalizedRectInside(profile.quietZone, retainedRect)) {
    throw new TypeError("crop-review quiet zone is not fully retained");
  }
  const actionLane = SOUND_SEEKERS_V2_ACTION_LANE;
  if (actionLane.x < 0 || actionLane.y < 0
    || actionLane.x + actionLane.width > 1
    || actionLane.y + actionLane.height > 1) {
    throw new TypeError("crop-review action lane is outside the panel");
  }
  return {
    retainedEdge: {
      left: 0,
      top: 0,
      right: profile.targetSize[0],
      bottom: profile.targetSize[1]
    },
    quietZone: mappedRectangle(profile.quietZone, retainedRect, profile.targetSize),
    actionLane: panelRectangle(actionLane, profile.targetSize),
    focal: mappedPoint(profile.focalPoint, retainedRect, profile.targetSize)
  };
}

function setPixel(buffer, width, height, x, y, rgba) {
  if (x < 0 || y < 0 || x >= width || y >= height) return;
  const offset = ((y * width) + x) * 4;
  buffer[offset] = rgba[0];
  buffer[offset + 1] = rgba[1];
  buffer[offset + 2] = rgba[2];
  buffer[offset + 3] = rgba[3];
}

function drawFrame(buffer, width, height, rectangle, stroke, rgba) {
  const left = Math.max(0, rectangle.left);
  const top = Math.max(0, rectangle.top);
  const right = Math.min(width, rectangle.right);
  const bottom = Math.min(height, rectangle.bottom);
  if (right <= left || bottom <= top) throw new TypeError("overlay rectangle is empty");
  for (let index = 0; index < stroke; index += 1) {
    const x1 = left + index;
    const x2 = right - 1 - index;
    const y1 = top + index;
    const y2 = bottom - 1 - index;
    for (let x = x1; x <= x2; x += 1) {
      setPixel(buffer, width, height, x, y1, rgba);
      setPixel(buffer, width, height, x, y2, rgba);
    }
    for (let y = y1; y <= y2; y += 1) {
      setPixel(buffer, width, height, x1, y, rgba);
      setPixel(buffer, width, height, x2, y, rgba);
    }
  }
}

function drawFocalMarker(buffer, width, height, point) {
  for (let offset = -4; offset <= 4; offset += 1) {
    setPixel(buffer, width, height, point.x + offset, point.y, COLORS.focalPoint);
    setPixel(buffer, width, height, point.x, point.y + offset, COLORS.focalPoint);
  }
}

function sourceExtract(retainedRect) {
  const left = Math.floor(retainedRect.x * SOURCE_SIZE[0]);
  const top = Math.floor(retainedRect.y * SOURCE_SIZE[1]);
  const right = Math.ceil((retainedRect.x + retainedRect.width) * SOURCE_SIZE[0]);
  const bottom = Math.ceil((retainedRect.y + retainedRect.height) * SOURCE_SIZE[1]);
  return {
    left,
    top,
    width: right - left,
    height: bottom - top
  };
}

async function assertPreparedRaster(filePath) {
  const metadata = await sharp(filePath, { failOn: "error", limitInputPixels: true })
    .metadata();
  if (metadata.format !== "webp" || metadata.width !== SOURCE_SIZE[0]
    || metadata.height !== SOURCE_SIZE[1] || (metadata.pages ?? 1) !== 1
    || metadata.hasAlpha !== false || metadata.space !== "srgb") {
    throw new TypeError("crop-review input must be one opaque 1536x864 sRGB WebP");
  }
}

async function renderPanel(sourcePath, outputPath, targetSize, retainedRect, overlayPixels) {
  const [width, height] = targetSize;
  const { data, info } = await sharp(sourcePath, {
    failOn: "error",
    limitInputPixels: true
  })
    .extract(sourceExtract(retainedRect))
    .resize(width, height, { fit: "fill", kernel: sharp.kernel.lanczos3 })
    .removeAlpha()
    .ensureAlpha(1)
    .raw()
    .toBuffer({ resolveWithObject: true });
  if (info.width !== width || info.height !== height || info.channels !== 4) {
    throw new TypeError("crop-review panel rasterization drifted");
  }
  drawFrame(data, width, height, overlayPixels.retainedEdge, 3, COLORS.retainedEdge);
  drawFrame(data, width, height, overlayPixels.quietZone, 3, COLORS.quietZone);
  drawFrame(data, width, height, overlayPixels.actionLane, 3, COLORS.actionLane);
  drawFocalMarker(data, width, height, overlayPixels.focal);
  await sharp(data, { raw: { width, height, channels: 4 } })
    .png(PNG_OPTIONS)
    .toFile(outputPath);
}

function expectedPanel(kit, profileId, index, sourceSha256, finalSha256) {
  const profile = kit.background.cropProfiles[profileId];
  const retainedRect = computeBackgroundCrop({
    sourceSize: SOURCE_SIZE,
    targetSize: profile.targetSize,
    focalPoint: profile.focalPoint
  });
  const overlayPixels = buildOverlayPixels(profile, retainedRect);
  return {
    callOrdinal: index + 1,
    chapterId: kit.id,
    profileId,
    file: `${String(index + 1).padStart(2, "0")}-${kit.id}--${profileId}--crop-review.png`,
    targetSize: [...profile.targetSize],
    sourceSha256,
    finalSha256,
    retainedRect,
    focalPoint: [...profile.focalPoint],
    quietZone: { ...profile.quietZone },
    actionLane: { ...SOUND_SEEKERS_V2_ACTION_LANE },
    overlayPixels,
    panelSha256: null
  };
}

function normalizeSourceHashes(value, kits) {
  if (value instanceof Map) value = Object.fromEntries(value);
  assertExactKeys(value, kits.map(kit => kit.id), "crop-review source hashes");
  for (const kit of kits) assertHash(value[kit.id], `${kit.id} source candidate hash`);
  return value;
}

async function sourceHashesForCandidates(candidateRoot, kits, supplied) {
  if (supplied !== undefined) return normalizeSourceHashes(supplied, kits);
  const generationRoot = path.dirname(candidateRoot);
  if (path.basename(generationRoot) !== "generation") {
    return null;
  }
  const preparationLedgerPath = path.join(generationRoot, "preparation.json");
  if (!existsSync(preparationLedgerPath)) {
    throw new TypeError("production crop review requires the preparation ledger");
  }
  const { readPreparationLedger } = await import("./prepareSoundSeekersV2Background.mjs");
  const ledger = readPreparationLedger({
    root: path.resolve(generationRoot, "../../.."),
    preparationLedgerPath
  });
  return normalizeSourceHashes(Object.fromEntries(ledger.entries.map(entry => {
    if (!entry.sourceCandidate || !entry.preparedCandidate) {
      throw new TypeError(`${entry.chapterId}: crop review requires source and final candidates`);
    }
    return [entry.chapterId, entry.sourceCandidate.sha256];
  })), kits);
}

export function assertSoundSeekersV2CropReviewManifest(manifest, {
  root = process.cwd(),
  kits = SOUND_SEEKERS_BIOME_KITS,
  panelRoot
} = {}) {
  validateSoundSeekersBiomeKits(kits);
  assertExactKeys(manifest, ["schemaVersion", "renderer", "panels"],
    "crop-review manifest");
  if (manifest.schemaVersion !== 1 || !same(
    manifest.renderer,
    SOUND_SEEKERS_V2_CROP_REVIEW_RENDERER
  )) {
    throw new TypeError("crop-review renderer contract drifted");
  }
  if (!Array.isArray(manifest.panels) || manifest.panels.length !== 24) {
    throw new TypeError("crop-review manifest must contain exactly 24 panels");
  }
  const resolvedPanelRoot = panelRoot === undefined
    ? null : resolveScopedPath(root, panelRoot, "panelRoot");
  const files = new Set();
  const chapterHashes = new Map();
  const sourceHashes = new Set();
  const finalHashes = new Set();
  for (const [panelIndex, panel] of manifest.panels.entries()) {
    assertExactKeys(panel, PANEL_KEYS, `crop-review panel ${panelIndex + 1}`);
    const kitIndex = Math.floor(panelIndex / SOUND_SEEKERS_V2_PROFILE_ORDER.length);
    const profileId = SOUND_SEEKERS_V2_PROFILE_ORDER[
      panelIndex % SOUND_SEEKERS_V2_PROFILE_ORDER.length
    ];
    const kit = kits[kitIndex];
    if (!kit || kit.id !== SOUND_SEEKERS_V2_BACKGROUND_ORDER[kitIndex]) {
      throw new TypeError("crop-review kits are out of canonical order");
    }
    assertHash(panel.sourceSha256, `${kit.id} panel source hash`);
    assertHash(panel.finalSha256, `${kit.id} panel final hash`);
    const hashes = chapterHashes.get(kit.id);
    if (hashes) {
      if (hashes.sourceSha256 !== panel.sourceSha256
        || hashes.finalSha256 !== panel.finalSha256) {
        throw new TypeError(`${kit.id} crop-review candidate hashes are inconsistent`);
      }
    } else {
      if (sourceHashes.has(panel.sourceSha256) || finalHashes.has(panel.finalSha256)) {
        throw new TypeError("crop-review candidates must be unique across biomes");
      }
      chapterHashes.set(kit.id, {
        sourceSha256: panel.sourceSha256,
        finalSha256: panel.finalSha256
      });
      sourceHashes.add(panel.sourceSha256);
      finalHashes.add(panel.finalSha256);
    }
    const expected = expectedPanel(
      kit,
      profileId,
      kitIndex,
      panel.sourceSha256,
      panel.finalSha256
    );
    if (!same({ ...panel, panelSha256: null }, expected)) {
      throw new TypeError(`${kit.id} ${profileId} crop-review panel drifted`);
    }
    assertHash(panel.panelSha256, `${kit.id} ${profileId} panel hash`);
    if (files.has(panel.file)) throw new TypeError("crop-review panel file is duplicated");
    files.add(panel.file);
    if (resolvedPanelRoot !== null) {
      const panelPath = path.join(resolvedPanelRoot, panel.file);
      assertRegularFile(panelPath, resolvedPanelRoot, `${kit.id} ${profileId} panel`);
      if (sha256Bytes(readFileSync(panelPath)) !== panel.panelSha256) {
        throw new TypeError(`${kit.id} ${profileId} panel bytes drifted`);
      }
    }
  }
  return true;
}

export function readSoundSeekersV2CropReviewManifest({
  root = process.cwd(),
  manifestPath = ".artifacts/sound-seekers-v2/crop-review/manifest.json",
  kits = SOUND_SEEKERS_BIOME_KITS
} = {}) {
  const resolvedManifestPath = resolveScopedPath(root, manifestPath, "manifestPath");
  const panelRoot = path.dirname(resolvedManifestPath);
  assertRegularFile(resolvedManifestPath, panelRoot, "crop-review manifest");
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(resolvedManifestPath, "utf8"));
  } catch {
    throw new TypeError("crop-review manifest must contain valid JSON");
  }
  assertSoundSeekersV2CropReviewManifest(manifest, { root, kits, panelRoot });
  const expectedNames = [
    path.basename(resolvedManifestPath),
    ...manifest.panels.map(panel => panel.file)
  ].sort();
  const entries = readdirSync(panelRoot, { withFileTypes: true });
  if (!same(entries.map(entry => entry.name).sort(), expectedNames)
    || entries.some(entry => entry.isSymbolicLink())) {
    throw new TypeError("crop-review root has missing, extra, or linked files");
  }
  return manifest;
}

export async function renderSoundSeekersV2CropReview({
  root = process.cwd(),
  candidateRoot = ".artifacts/sound-seekers-v2/generation/prepared",
  outputRoot = ".artifacts/sound-seekers-v2/crop-review",
  kits = SOUND_SEEKERS_BIOME_KITS,
  sourceSha256ByChapter
} = {}) {
  validateSoundSeekersBiomeKits(kits);
  const resolvedCandidateRoot = resolveScopedPath(root, candidateRoot, "candidateRoot");
  const resolvedOutputRoot = resolveScopedPath(root, outputRoot, "outputRoot");
  if (resolvedCandidateRoot === resolvedOutputRoot) {
    throw new TypeError("crop-review input and output roots must differ");
  }
  const candidateStats = lstatSync(resolvedCandidateRoot);
  if (!candidateStats.isDirectory() || candidateStats.isSymbolicLink()) {
    throw new TypeError("crop-review candidate root must be a non-symlink directory");
  }
  if (existsSync(resolvedOutputRoot)) {
    throw new TypeError("crop-review output root already exists");
  }
  const sourceHashes = await sourceHashesForCandidates(
    resolvedCandidateRoot,
    kits,
    sourceSha256ByChapter
  );
  let outputCreated = false;
  try {
    mkdirSync(resolvedOutputRoot, { recursive: false, mode: 0o700 });
    outputCreated = true;
    const panels = [];
    for (const [kitIndex, kit] of kits.entries()) {
      if (kit.id !== SOUND_SEEKERS_V2_BACKGROUND_ORDER[kitIndex]) {
        throw new TypeError("crop-review kits are out of canonical order");
      }
      const sourcePath = path.join(resolvedCandidateRoot, kit.id, "background.webp");
      assertRegularFile(sourcePath, resolvedCandidateRoot, `${kit.id} prepared candidate`);
      await assertPreparedRaster(sourcePath);
      const finalSha256 = sha256Bytes(readFileSync(sourcePath));
      const sourceSha256 = sourceHashes?.[kit.id] ?? finalSha256;
      for (const profileId of SOUND_SEEKERS_V2_PROFILE_ORDER) {
        const panel = expectedPanel(
          kit,
          profileId,
          kitIndex,
          sourceSha256,
          finalSha256
        );
        const outputPath = path.join(resolvedOutputRoot, panel.file);
        await renderPanel(
          sourcePath,
          outputPath,
          panel.targetSize,
          panel.retainedRect,
          panel.overlayPixels
        );
        panel.panelSha256 = sha256Bytes(readFileSync(outputPath));
        panels.push(panel);
      }
    }
    const manifest = {
      schemaVersion: 1,
      renderer: SOUND_SEEKERS_V2_CROP_REVIEW_RENDERER,
      panels
    };
    assertSoundSeekersV2CropReviewManifest(manifest, {
      root,
      kits,
      panelRoot: resolvedOutputRoot
    });
    const manifestPath = path.join(resolvedOutputRoot, "manifest.json");
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, {
      encoding: "utf8",
      mode: 0o600,
      flag: "wx"
    });
    return {
      manifest,
      manifestSha256: sha256Canonical(manifest),
      manifestPath,
      outputRoot: resolvedOutputRoot
    };
  } catch (error) {
    if (outputCreated) rmSync(resolvedOutputRoot, { recursive: true, force: true });
    throw error;
  }
}

function parseCliArguments(argv) {
  if (argv.length !== 2 || argv[0] !== "--candidate-root") {
    throw new TypeError("usage: buildSoundSeekersV2CropReview.mjs --candidate-root <path>");
  }
  return argv[1];
}

async function main() {
  const candidateRoot = parseCliArguments(process.argv.slice(2));
  const result = await renderSoundSeekersV2CropReview({ candidateRoot });
  process.stdout.write(`${result.manifestPath}\n`);
}

if (process.argv[1]
  && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  main().catch(error => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}

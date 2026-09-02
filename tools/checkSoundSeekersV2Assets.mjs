import {
  lstatSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

import sharp from "sharp";

import {
  SOUND_SEEKERS_BIOME_KITS,
  validateSoundSeekersBiomeKits
} from "../src/features/soundSeekers/content/biomeKits.js";
import {
  SOUND_SEEKERS_V2_BACKGROUND_ORDER,
  SOUND_SEEKERS_V2_PUBLIC_ROOT,
  assertSoundSeekersV2AssetManifest,
  canonicalStringify,
  parseSoundSeekersV2AssetManifestText,
  sha256Bytes,
  sha256Canonical
} from "./lib/soundSeekersV2AssetManifest.mjs";
import {
  assertSoundSeekersV2CropReviewManifest,
  renderSoundSeekersV2CropReview
} from "./buildSoundSeekersV2CropReview.mjs";

function same(left, right) {
  return canonicalStringify(left) === canonicalStringify(right);
}

function resolveAssetRoot(value) {
  if (typeof value !== "string" || value.length === 0 || !path.isAbsolute(value)) {
    throw new TypeError("Sound Seekers v2 asset root must be an absolute path");
  }
  return path.normalize(value);
}

function isStrictDescendant(candidate, parent) {
  const relative = path.relative(parent, candidate);
  return relative.length > 0 && relative !== ".."
    && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

function assertDirectory(directoryPath, parentRoot, label) {
  const stats = lstatSync(directoryPath);
  if (!stats.isDirectory() || stats.isSymbolicLink()) {
    throw new TypeError(`${label} must be a non-symlink directory`);
  }
  if (parentRoot !== null) {
    const realParent = realpathSync(parentRoot);
    const realDirectory = realpathSync(directoryPath);
    if (!isStrictDescendant(realDirectory, realParent)) {
      throw new TypeError(`${label} escapes the asset root`);
    }
  }
}

function assertRegularFile(filePath, assetRoot, label) {
  const stats = lstatSync(filePath);
  if (!stats.isFile() || stats.isSymbolicLink()) {
    throw new TypeError(`${label} must be a non-symlink regular file`);
  }
  const realRoot = realpathSync(assetRoot);
  const realFile = realpathSync(filePath);
  if (!isStrictDescendant(realFile, realRoot)) {
    throw new TypeError(`${label} escapes the asset root`);
  }
  return stats;
}

function assertExactNames(directoryPath, expected, label) {
  const entries = readdirSync(directoryPath, { withFileTypes: true });
  const actual = entries.map(entry => entry.name).sort();
  const wanted = [...expected].sort();
  if (!same(actual, wanted)) {
    throw new TypeError(`${label} has missing or extra entries`);
  }
  for (const entry of entries) {
    if (entry.isSymbolicLink()) throw new TypeError(`${label} contains a symlink`);
  }
}

function assertWebpMagic(bytes, label) {
  if (bytes.length < 12
    || bytes.subarray(0, 4).toString("ascii") !== "RIFF"
    || bytes.subarray(8, 12).toString("ascii") !== "WEBP") {
    throw new TypeError(`${label} does not have WebP magic bytes`);
  }
}

async function assertFinalRaster(filePath, asset, assetRoot) {
  const stats = assertRegularFile(filePath, assetRoot, `${asset.chapterId} background`);
  const bytes = readFileSync(filePath);
  assertWebpMagic(bytes, `${asset.chapterId} background`);
  if (stats.size !== asset.final.byteLength || bytes.length !== asset.final.byteLength
    || sha256Bytes(bytes) !== asset.final.sha256) {
    throw new TypeError(`${asset.chapterId} final bytes drifted from SOURCE`);
  }
  const metadata = await sharp(bytes, { failOn: "error", limitInputPixels: true }).metadata();
  if (metadata.format !== "webp" || metadata.width !== 1536 || metadata.height !== 864
    || (metadata.pages ?? 1) !== 1 || metadata.hasAlpha !== false
    || metadata.space !== "srgb") {
    throw new TypeError(`${asset.chapterId} final raster contract drifted`);
  }
  for (const metadataField of ["exif", "icc", "iptc", "xmp"]) {
    if (metadata[metadataField] !== undefined) {
      throw new TypeError(`${asset.chapterId} final raster retains ${metadataField} metadata`);
    }
  }
}

function readManifestAtAssetRoot(assetRoot, kits) {
  const sourcePath = path.join(assetRoot, "SOURCE.md");
  assertRegularFile(sourcePath, assetRoot, "Sound Seekers v2 SOURCE.md");
  const manifest = parseSoundSeekersV2AssetManifestText(readFileSync(sourcePath, "utf8"));
  assertSoundSeekersV2AssetManifest(manifest, kits);
  return manifest;
}

function assertManifestFileJoin(assetRoot, asset, kit) {
  const expectedRelative = `biomes/${kit.id}/background.webp`;
  const runtimePrefix = `/${SOUND_SEEKERS_V2_PUBLIC_ROOT.replace(/^public\//u, "")}/`;
  if (!asset.path.startsWith(runtimePrefix)
    || asset.path.slice(runtimePrefix.length) !== expectedRelative) {
    throw new TypeError(`${kit.id} manifest path does not join the exact public tree`);
  }
  return path.join(assetRoot, expectedRelative);
}

function compareCropEvidence(manifest, regenerated, kits) {
  assertSoundSeekersV2CropReviewManifest(regenerated.manifest, {
    root: regenerated.outputRoot,
    panelRoot: regenerated.outputRoot,
    kits
  });
  const manifestSha256 = sha256Canonical(regenerated.manifest);
  for (const [kitIndex, asset] of manifest.assets.entries()) {
    if (asset.cropReview.manifestSha256 !== manifestSha256) {
      throw new TypeError(`${asset.chapterId} crop-review manifest hash is stale`);
    }
    const panels = regenerated.manifest.panels.slice(kitIndex * 3, (kitIndex + 1) * 3);
    for (const [profileIndex, profile] of asset.cropReview.profiles.entries()) {
      const panel = panels[profileIndex];
      if (!panel || panel.chapterId !== asset.chapterId
        || panel.sourceSha256 !== asset.source.sha256
        || panel.finalSha256 !== asset.final.sha256
        || panel.panelSha256 !== profile.panelSha256
        || !same(panel.retainedRect, profile.retainedRect)
        || !same(panel.focalPoint, profile.focalPoint)
        || !same(panel.quietZone, profile.quietZone)
        || !same(panel.targetSize, profile.targetSize)) {
        throw new TypeError(`${asset.chapterId} ${profile.id} crop evidence is stale`);
      }
    }
  }
}

export async function assertSoundSeekersV2AssetTree({
  assetRoot,
  kits = SOUND_SEEKERS_BIOME_KITS
} = {}) {
  validateSoundSeekersBiomeKits(kits);
  const resolvedAssetRoot = resolveAssetRoot(assetRoot);
  assertDirectory(resolvedAssetRoot, null, "Sound Seekers v2 asset root");
  assertExactNames(resolvedAssetRoot, ["SOURCE.md", "biomes"],
    "Sound Seekers v2 asset root");
  const biomesRoot = path.join(resolvedAssetRoot, "biomes");
  assertDirectory(biomesRoot, resolvedAssetRoot, "Sound Seekers v2 biomes root");
  assertExactNames(biomesRoot, SOUND_SEEKERS_V2_BACKGROUND_ORDER,
    "Sound Seekers v2 biomes root");
  const manifest = readManifestAtAssetRoot(resolvedAssetRoot, kits);
  for (const [index, kit] of kits.entries()) {
    if (kit.id !== SOUND_SEEKERS_V2_BACKGROUND_ORDER[index]) {
      throw new TypeError("Sound Seekers v2 kits are out of canonical order");
    }
    const biomeRoot = path.join(biomesRoot, kit.id);
    assertDirectory(biomeRoot, resolvedAssetRoot, `${kit.id} biome directory`);
    assertExactNames(biomeRoot, ["background.webp"], `${kit.id} biome directory`);
    const filePath = assertManifestFileJoin(resolvedAssetRoot, manifest.assets[index], kit);
    await assertFinalRaster(filePath, manifest.assets[index], resolvedAssetRoot);
  }

  const temporaryRoot = mkdtempSync(path.join(tmpdir(), "sound-seekers-v2-check-"));
  const outputRoot = path.join(temporaryRoot, "crop-review");
  try {
    const regenerated = await renderSoundSeekersV2CropReview({
      root: resolvedAssetRoot,
      candidateRoot: biomesRoot,
      outputRoot,
      kits,
      sourceSha256ByChapter: Object.fromEntries(
        manifest.assets.map(asset => [asset.chapterId, asset.source.sha256])
      )
    });
    compareCropEvidence(manifest, regenerated, kits);
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
  return true;
}

export async function assertSoundSeekersV2Assets({
  root = process.cwd(),
  kits = SOUND_SEEKERS_BIOME_KITS
} = {}) {
  if (typeof root !== "string" || root.length === 0 || !path.isAbsolute(root)) {
    throw new TypeError("Sound Seekers v2 repository root must be an absolute path");
  }
  return assertSoundSeekersV2AssetTree({
    assetRoot: path.join(root, SOUND_SEEKERS_V2_PUBLIC_ROOT),
    kits
  });
}

async function main() {
  if (process.argv.length !== 2) {
    throw new TypeError("checkSoundSeekersV2Assets.mjs does not accept arguments");
  }
  await assertSoundSeekersV2Assets();
  process.stdout.write("Sound Seekers v2 assets PASS\n");
}

if (process.argv[1]
  && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  main().catch(error => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}

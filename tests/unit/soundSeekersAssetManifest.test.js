import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  chmodSync,
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import sharp from "sharp";

import {
  SOUND_SEEKERS_BIOME_KITS,
  computeBackgroundCrop
} from "../../src/features/soundSeekers/content/biomeKits.js";
import {
  SOUND_SEEKERS_V2_BACKGROUND_ORDER,
  SOUND_SEEKERS_V2_SHARED_BACKGROUND_POLICY,
  assertSoundSeekersV2AssetManifest,
  buildSoundSeekersV2BackgroundPrompt,
  canonicalStringify,
  parseSoundSeekersV2AssetManifestText,
  readSoundSeekersV2AssetManifest,
  sha256Bytes,
  sha256Canonical,
  sha256Text,
  task4BriefSetSha256,
  task4BriefSha256
} from "../../tools/lib/soundSeekersV2AssetManifest.mjs";
import {
  captureCallResult,
  cleanupCandidates,
  finalizeSoundSeekersV2Assets,
  initCallsLedger,
  initPreparationLedger,
  prepareBackground,
  readCallsLedger,
  readPreparationLedger,
  recordAgentInspection,
  recordCallFailure,
  recordCropReview,
  reserveCall,
  resumeCallsLedger,
  validateCallsLedger,
  validatePreparationLedger
} from "../../tools/prepareSoundSeekersV2Background.mjs";
import {
  SOUND_SEEKERS_V2_CROP_REVIEW_RENDERER,
  assertSoundSeekersV2CropReviewManifest,
  renderSoundSeekersV2CropReview
} from "../../tools/buildSoundSeekersV2CropReview.mjs";
import { assertSoundSeekersV2Assets }
  from "../../tools/checkSoundSeekersV2Assets.mjs";

const REPOSITORY_ROOT = resolve(new URL("../..", import.meta.url).pathname);
const TASK4_COMMIT = "8b0f0fcee0d6d5be33e39ded2dbf46b7323d86af";
const PREPARE_SCRIPT = join(REPOSITORY_ROOT, "tools/prepareSoundSeekersV2Background.mjs");
const CALLS_LEDGER_RELATIVE = ".artifacts/sound-seekers-v2/generation/calls.json";
const PREPARATION_LEDGER_RELATIVE =
  ".artifacts/sound-seekers-v2/generation/preparation.json";
const CROP_REVIEW_MANIFEST_RELATIVE =
  ".artifacts/sound-seekers-v2/crop-review/manifest.json";
const HASH = /^[a-f0-9]{64}$/u;
const UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u;
const CALL_KEYS = Object.freeze([
  "ordinal", "chapterId", "promptSha256", "state", "requestedAt", "completedAt",
  "resultMetadata", "resultMetadataSha256", "sourcePath", "sourceSha256", "errorCode"
]);
const PREPARATION_KEYS = Object.freeze([
  "ordinal", "chapterId", "terminalCallEntrySha256", "stage", "sourceCandidate",
  "preparedCandidate", "agentInspection", "cropReview", "humanReviews", "cleanup"
]);
const INSPECTION_CHECKS = Object.freeze({
  textGlyphNumberSign: "none_observed",
  logoWatermarkBorder: "none_observed",
  unsafeImagery: "none_observed",
  codeNativeObjectLeak: "none_observed",
  answerOrChoiceCue: "none_observed",
  styleLighting: "matches_contract",
  backdropSemantics: "recognizable",
  crossBiomeDistinctness: "distinct",
  lowerMiddleLane: "clear"
});
const EXPECTED_COMPLETE_PROHIBITIONS = Object.freeze([
  "characters", "residents", "route", "landmark", "state", "reward", "meaning",
  "option", "choice", "interactable", "interactive objects", "collectible",
  "grapheme plate", "focus", "feedback", "interface", "interface object",
  "foreground action", "isolated or highlighted choice",
  "correctness cue", "answer cue", "text", "letters", "words", "glyphs", "numerals",
  "signs", "labels", "alphabet-like marks", "runes", "logos", "watermarks", "borders",
  "third-party characters", "unsafe imagery", "high-contrast clutter in the play lane"
]);
const EXPECTED_SHARED_PROMPT_LINES = Object.freeze({
  beforeScene: Object.freeze([
    "Use case: stylized-concept",
    "Asset type: decorative early-literacy 2D game background",
    "Primary request: Create one answer-neutral Sound Seekers biome backdrop from the immutable scene description and required backdrop elements only."
  ]),
  afterScene: Object.freeze([
    "Style/medium: Shape-led hand-painted storybook environment; restrained paper and gouache texture; rounded readable environmental silhouettes; no extra objects.",
    "Composition/framing: Wide landscape source with one full-bleed 16:9 crop of at least 1536x864 usable pixels; clear lower-middle play lane; quiet depth; subdued play-space contrast.",
    "Lighting/mood: Consistent upper-left lighting; welcoming, calm, adventurous.",
    "Constraints: Decorative backdrop only; include exactly the required backdrop elements; preserve a clear lower-middle lane; no characters, residents, route, landmark, state, reward, meaning, option, choice, interactable, interactive objects, collectible, grapheme plate, focus, feedback, interface, interface object, foreground action, isolated or highlighted choice, correctness cue, answer cue, text, letters, words, glyphs, numerals, signs, labels, alphabet-like marks, runes, logos, watermarks, borders, third-party characters, unsafe imagery, or high-contrast clutter in the play lane.",
    "Avoid: Do not add, translate, embellish, label, or restate any biome-specific object beyond the exact scene description and ordered required backdrop elements."
  ])
});
const EXPECTED_BACKGROUND_PROMPT_SNAPSHOTS = Object.freeze([
  Object.freeze({
    chapterId: "seedwake-meadow",
    sceneLine: "Scene/backdrop: Dawn pasture, living hedges, warm wood, distant seed-lantern glow, pale gold and fresh green; quiet lower-middle lane. Required backdrop elements, in this exact order: dawn pasture; living hedges; distant windmill lantern silhouette.",
    sha256: "566773a2c3683bad5f99af4f98b7838526737a4563dcacb1e6c5d0fd779a7cc7"
  }),
  Object.freeze({
    chapterId: "river-gardens",
    sceneLine: "Scene/backdrop: Terraced water channels, reeds, ceramic garden markers, turquoise and terracotta; quiet lower-middle lane. Required backdrop elements, in this exact order: terraced water channels; reed banks; distant ceramic terrace markers.",
    sha256: "c391e87edf00f683e5b8cecc5b2511b33821239503ebe933e102954c60a99c90"
  }),
  Object.freeze({
    chapterId: "fossil-canyon",
    sceneLine: "Scene/backdrop: Layered sandstone shelves, ancient tracks, bone arches and amber afternoon depth; quiet lower-middle lane. Required backdrop elements, in this exact order: layered sandstone shelves; ancient track bed; distant bone arch.",
    sha256: "abfb8de7cbb3c5331357cf5090243c004761942cfa188d67c462f8168d7f5298"
  }),
  Object.freeze({
    chapterId: "forge-settlement",
    sceneLine: "Scene/backdrop: Dark-stone workshops, distant furnace architecture, copper-and-iron depth and controlled ember light; quiet lower-middle lane. Required backdrop elements, in this exact order: distant furnace architecture; dark-stone workshops; copper rail depth.",
    sha256: "9c3f062a07998fc6dc458c32684fd763e11fbba8708aaccae2c5df4c03f3ad8d"
  }),
  Object.freeze({
    chapterId: "glass-marsh",
    sceneLine: "Scene/backdrop: Reflective jade pools, glass-reed depth, mist and refracted distant paths; quiet lower-middle lane. Required backdrop elements, in this exact order: reflective jade pools; distant glass reeds; mist path depth.",
    sha256: "7ef99218166110aa666a4c6ce53b4a161ae3498853a72fcf4b70801b285e57ab"
  }),
  Object.freeze({
    chapterId: "storm-coast",
    sceneLine: "Scene/backdrop: Sea cliffs, spray, distant timber shelters and a storm clearing toward warm light; quiet lower-middle lane. Required backdrop elements, in this exact order: sea cliffs; distant timber shelters; storm clearing toward warm light.",
    sha256: "5bea204b8f6933d2c293be6b5d26d910b885875c24078aa50d14b5ccf4688fb6"
  }),
  Object.freeze({
    chapterId: "lantern-forest",
    sceneLine: "Scene/backdrop: Deep layered woods, root-bridge depth, distant hanging lantern path, moss and muted gold; quiet lower-middle lane. Required backdrop elements, in this exact order: deep layered woods; distant root bridges; distant hanging lantern path.",
    sha256: "7055cee9cb3bc4bd0b978dad5d4170036b117944efa7efc5958ead23a021bedb"
  }),
  Object.freeze({
    chapterId: "star-reach",
    sceneLine: "Scene/backdrop: High observatory terraces, distant comet stairs, night sky, indigo and warm starlight; quiet lower-middle lane. Required backdrop elements, in this exact order: high observatory terraces; distant comet stairs; night sky.",
    sha256: "bb66a888724708abff0be3c38a16ff89b30a8eb117acef437de882a3d746e85a"
  })
]);

function testCanonical(value) {
  if (Array.isArray(value)) return `[${value.map(testCanonical).join(",")}]`;
  if (value !== null && typeof value === "object") {
    return `{${Object.keys(value).sort().map(key => (
      `${JSON.stringify(key)}:${testCanonical(value[key])}`
    )).join(",")}}`;
  }
  return JSON.stringify(value);
}

function testHash(value) {
  return createHash("sha256").update(value).digest("hex");
}

function testCanonicalHash(value) {
  return testHash(testCanonical(value));
}

function clone(value) {
  return structuredClone(value);
}

function temporaryRoot(t, prefix = "sound-seekers-task5-test-") {
  const root = mkdtempSync(join(tmpdir(), prefix));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

function assertExactKeys(value, keys) {
  assert.deepEqual(Reflect.ownKeys(value), keys);
  const descriptors = Object.getOwnPropertyDescriptors(value);
  for (const key of keys) {
    assert.equal(Object.hasOwn(descriptors[key], "value"), true);
    assert.equal(descriptors[key].enumerable, true);
  }
}

function ledgerPaths(root) {
  return {
    callsLedgerPath: join(root, CALLS_LEDGER_RELATIVE),
    preparationLedgerPath: join(root, PREPARATION_LEDGER_RELATIVE)
  };
}

function relativeFileInventory(root, current = root) {
  return readdirSync(current, { withFileTypes: true })
    .flatMap(entry => {
      const absolute = join(current, entry.name);
      if (entry.isDirectory()) return relativeFileInventory(root, absolute);
      return [absolute.slice(root.length + 1)];
    })
    .toSorted();
}

function fixedNow(second = 0) {
  return `2026-09-02T12:00:${String(second).padStart(2, "0")}.000Z`;
}

function runPrepareCli(root, args, input) {
  return spawnSync(process.execPath, [PREPARE_SCRIPT, ...args], {
    cwd: root,
    input: input === undefined ? undefined : `${JSON.stringify(input)}\n`,
    encoding: "utf8"
  });
}

function inspectRecord(scope, candidateSha256, second) {
  return {
    scope,
    candidateSha256,
    inspectedAt: fixedNow(second),
    method: `view_image:original-${scope}`,
    decision: "accepted",
    checks: { ...INSPECTION_CHECKS }
  };
}

async function sourceResult(index, {
  width = 1600,
  height = 900,
  alpha = false
} = {}) {
  const bytes = await sharp({
    create: {
      width,
      height,
      channels: alpha ? 4 : 3,
      background: {
        r: 28 + (index * 19),
        g: 64 + (index * 13),
        b: 92 + (index * 11),
        ...(alpha ? { alpha: 0.75 } : {})
      }
    }
  }).png().toBuffer();
  return {
    bytes,
    result: {
      image_url: `data:image/png;base64,${bytes.toString("base64")}`,
      output_hint: `synthetic-output-${index}`,
      returnedModel: "synthetic-image-model"
    }
  };
}

function validManifestFixture() {
  const cropManifestSha256 = testHash("synthetic-crop-manifest");
  return {
    schemaVersion: 2,
    project: "Sound Seekers v2",
    generatorContract: "task4-immutable-background-brief-v1",
    assets: SOUND_SEEKERS_BIOME_KITS.map((kit, index) => {
      const prompt = [
        ...EXPECTED_SHARED_PROMPT_LINES.beforeScene,
        EXPECTED_BACKGROUND_PROMPT_SNAPSHOTS[index].sceneLine,
        ...EXPECTED_SHARED_PROMPT_LINES.afterScene
      ].join("\n");
      const sourceSha256 = testHash(`source-${index}`);
      const finalSha256 = testHash(`final-${index}`);
      const resultMetadata = {
        returnedModel: "synthetic-image-model",
        outputHintSha256: testHash(`synthetic-output-${index}`)
      };
      return {
        id: kit.background.provenanceId,
        chapterId: kit.id,
        path: kit.background.src,
        task4: {
          briefSha256: testCanonicalHash(kit.backgroundGenerationBrief),
          styleId: kit.backgroundGenerationBrief.styleId,
          requiredBackdropElements: [...kit.backgroundGenerationBrief.requiredBackdropElements],
          backdropReviewSemanticIds: [...kit.backdropReviewSemanticIds],
          forbiddenSemanticIds: [...kit.codeNativeSemanticIds]
        },
        generation: {
          mode: "builtin_image_gen",
          tool: "image_gen.imagegen",
          callOrdinal: index + 1,
          requestedAt: `2026-09-02T10:${String(index).padStart(2, "0")}:00.000Z`,
          completedAt: `2026-09-02T10:${String(index).padStart(2, "0")}:01.000Z`,
          prompt,
          promptSha256: testHash(prompt),
          resultMetadata,
          resultMetadataSha256: testCanonicalHash(resultMetadata)
        },
        source: { format: "png", width: 1600, height: 900, sha256: sourceSha256 },
        transform: {
          orientation: "auto",
          crop: { left: 0, top: 0, width: 1600, height: 900, anchorProfile: "landscape" },
          resize: {
            width: 1536, height: 864, kernel: "lanczos3", withoutEnlargement: true
          },
          encode: {
            format: "webp", quality: 82, effort: 6, smartSubsample: true,
            metadata: "stripped", colourspace: "srgb",
            sharpVersion: sharp.versions.sharp,
            libvipsVersion: sharp.versions.vips,
            doubleEncodeSha256: finalSha256
          }
        },
        final: {
          format: "webp", width: 1536, height: 864,
          byteLength: 4096 + index, sha256: finalSha256,
          opaque: true, pages: 1
        },
        agentInspection: {
          sourceSha256,
          finalSha256,
          inspectedAt: {
            source: `2026-09-02T11:${String(index).padStart(2, "0")}:00.000Z`,
            final: `2026-09-02T11:${String(index).padStart(2, "0")}:01.000Z`,
            crops: `2026-09-02T11:${String(index).padStart(2, "0")}:02.000Z`
          },
          methods: [
            "view_image:original-source",
            "view_image:original-final",
            "view_image:original-crops"
          ],
          decision: "accepted",
          checks: { ...INSPECTION_CHECKS, profileQuietZones: "retained" }
        },
        cropReview: {
          manifestSha256: cropManifestSha256,
          profiles: Object.entries(kit.background.cropProfiles).map(
            ([profileId, profile], profileIndex) => ({
              id: profileId,
              targetSize: [...profile.targetSize],
              focalPoint: [...profile.focalPoint],
              quietZone: { ...profile.quietZone },
              retainedRect: computeBackgroundCrop({
                sourceSize: [1536, 864],
                targetSize: profile.targetSize,
                focalPoint: profile.focalPoint
              }),
              panelSha256: testHash(`panel-${index}-${profileIndex}`),
              quietZoneRetained: true
            })
          )
        },
        humanReviews: { crop: null, semantic: null }
      };
    })
  };
}

async function initializeSyntheticLedgers(t) {
  const root = temporaryRoot(t);
  const paths = ledgerPaths(root);
  await initCallsLedger({
    root,
    callsLedgerPath: paths.callsLedgerPath,
    task4Commit: TASK4_COMMIT,
    runId: "synthetic-task5-run",
    now: fixedNow(0)
  });
  return { root, ...paths };
}

async function completeSyntheticRun(t) {
  const fixture = await initializeSyntheticLedgers(t);
  for (const [index] of SOUND_SEEKERS_BIOME_KITS.entries()) {
    await reserveCall({
      ...fixture,
      ordinal: index + 1,
      now: fixedNow(index)
    });
    const source = await sourceResult(index);
    await captureCallResult({
      ...fixture,
      ordinal: index + 1,
      now: fixedNow(index + 8),
      result: source.result
    });
  }
  await initPreparationLedger({ ...fixture, now: fixedNow(16) });
  const calls = readCallsLedger(fixture);
  for (const [index, kit] of SOUND_SEEKERS_BIOME_KITS.entries()) {
    let entry;
    await recordAgentInspection({
      ...fixture,
      chapterId: kit.id,
      scope: "source",
      inspection: inspectRecord("source", calls.entries[index].sourceSha256, 17 + index)
    });
    await prepareBackground({
      ...fixture,
      chapterId: kit.id,
      now: fixedNow(25 + index)
    });
    entry = readPreparationLedger(fixture).entries[index];
    await recordAgentInspection({
      ...fixture,
      chapterId: kit.id,
      scope: "final",
      inspection: inspectRecord("final", entry.preparedCandidate.sha256, 33 + index)
    });
  }
  const cropReviewRoot = join(
    fixture.root,
    ".artifacts/sound-seekers-v2/crop-review"
  );
  const review = await renderSoundSeekersV2CropReview({
    root: fixture.root,
    candidateRoot: join(
      fixture.root,
      ".artifacts/sound-seekers-v2/generation/prepared"
    ),
    outputRoot: cropReviewRoot
  });
  await recordCropReview({
    ...fixture,
    manifestPath: CROP_REVIEW_MANIFEST_RELATIVE,
    now: fixedNow(50)
  });
  const publicRoot = join(fixture.root, "public/game-assets/sound-seekers/v2");
  await finalizeSoundSeekersV2Assets({
    ...fixture,
    publicRoot
  });
  return { ...fixture, cropReviewRoot, publicRoot, review };
}

async function sourceAcceptedFixture(t, source) {
  const fixture = await initializeSyntheticLedgers(t);
  await reserveCall({ ...fixture, ordinal: 1, now: fixedNow(1) });
  await captureCallResult({
    ...fixture,
    ordinal: 1,
    now: fixedNow(2),
    result: source.result
  });
  await initPreparationLedger({ ...fixture, now: fixedNow(3) });
  const sourceSha256 = readCallsLedger(fixture).entries[0].sourceSha256;
  await recordAgentInspection({
    ...fixture,
    chapterId: SOUND_SEEKERS_V2_BACKGROUND_ORDER[0],
    scope: "source",
    inspection: inspectRecord("source", sourceSha256, 4)
  });
  return fixture;
}

test("[preflight] prompts equal eight independent literal snapshots", () => {
  assert.deepEqual(SOUND_SEEKERS_V2_BACKGROUND_ORDER, [
    "seedwake-meadow", "river-gardens", "fossil-canyon", "forge-settlement",
    "glass-marsh", "storm-coast", "lantern-forest", "star-reach"
  ]);
  assert.deepEqual(
    SOUND_SEEKERS_V2_SHARED_BACKGROUND_POLICY.prohibitions,
    EXPECTED_COMPLETE_PROHIBITIONS
  );
  assert.equal(Object.isFrozen(SOUND_SEEKERS_V2_SHARED_BACKGROUND_POLICY), true);
  assert.equal(task4BriefSetSha256(SOUND_SEEKERS_BIOME_KITS), testCanonicalHash(
    SOUND_SEEKERS_BIOME_KITS.map(kit => kit.backgroundGenerationBrief)
  ));
  for (const [index, kit] of SOUND_SEEKERS_BIOME_KITS.entries()) {
    const snapshot = EXPECTED_BACKGROUND_PROMPT_SNAPSHOTS[index];
    const expectedPrompt = [
      ...EXPECTED_SHARED_PROMPT_LINES.beforeScene,
      snapshot.sceneLine,
      ...EXPECTED_SHARED_PROMPT_LINES.afterScene
    ].join("\n");
    const prompt = buildSoundSeekersV2BackgroundPrompt(kit);
    assert.equal(prompt, expectedPrompt);
    assert.equal(testHash(expectedPrompt), snapshot.sha256);
    assert.equal(sha256Text(prompt), snapshot.sha256);
    assert.equal(task4BriefSha256(kit), testCanonicalHash(kit.backgroundGenerationBrief));
    for (const semanticId of kit.codeNativeSemanticIds) {
      assert.equal(prompt.includes(semanticId), false);
    }
    for (const prohibition of EXPECTED_COMPLETE_PROHIBITIONS) {
      assert.equal(prompt.includes(prohibition), true);
    }
  }
  assert.equal(canonicalStringify({ z: 1, a: [3, { y: 2, x: 1 }] }),
    '{"a":[3,{"x":1,"y":2}],"z":1}');
  assert.equal(sha256Canonical({ z: 1, a: 2 }), testCanonicalHash({ z: 1, a: 2 }));
  assert.equal(sha256Bytes(Buffer.from("bytes")), testHash(Buffer.from("bytes")));
});

test("[preflight] parser accepts exactly one JSON fence and rejects ambiguous source text", t => {
  const root = temporaryRoot(t);
  const sourceDirectory = join(root, "public/game-assets/sound-seekers/v2");
  mkdirSync(sourceDirectory, { recursive: true });
  const fixture = validManifestFixture();
  const text = `Candidate provenance.\n\n\`\`\`json\n${JSON.stringify(fixture, null, 2)}\n\`\`\`\n`;
  writeFileSync(join(sourceDirectory, "SOURCE.md"), text);
  assert.deepEqual(parseSoundSeekersV2AssetManifestText(text), fixture);
  assert.deepEqual(readSoundSeekersV2AssetManifest({ root }), fixture);
  for (const invalid of [
    JSON.stringify(fixture),
    `${text}\n\`\`\`json\n{}\n\`\`\`\n`,
    text.replace("```json", "```js")
  ]) assert.throws(() => parseSoundSeekersV2AssetManifestText(invalid));
  const parsedWithExtra = parseSoundSeekersV2AssetManifestText(
    text.replace('"schemaVersion": 2', '"schemaVersion": 2, "extra": true')
  );
  assert.throws(() => assertSoundSeekersV2AssetManifest(
    parsedWithExtra,
    SOUND_SEEKERS_BIOME_KITS
  ));
});

test("[preflight] manifest validation binds strict schema, hashes, ordering, crops, and reviews", () => {
  const fixture = validManifestFixture();
  assert.equal(assertSoundSeekersV2AssetManifest(fixture, SOUND_SEEKERS_BIOME_KITS), true);
  const mutations = [
    manifest => { manifest.assets = []; },
    manifest => { manifest.assets.pop(); },
    manifest => { manifest.assets.push(clone(manifest.assets[0])); },
    manifest => { manifest.assets.reverse(); },
    manifest => { manifest.assets[0].generation.callOrdinal = 2; },
    manifest => { manifest.assets[0].chapterId = "river-gardens"; },
    manifest => { manifest.assets[1].id = manifest.assets[0].id; },
    manifest => { manifest.assets[1].path = manifest.assets[0].path; },
    manifest => { manifest.assets[1].source.sha256 = manifest.assets[0].source.sha256; },
    manifest => { manifest.assets[1].final.sha256 = manifest.assets[0].final.sha256; },
    manifest => { manifest.extra = true; },
    manifest => { manifest.assets[0].extra = true; },
    manifest => { delete manifest.assets[0].source.format; },
    manifest => { delete manifest.assets[0].task4.styleId; },
    manifest => { manifest.assets[0].generation.requestedAt = "not-utc"; },
    manifest => { manifest.assets[0].generation.completedAt = "2026-09-02T09:00:00Z"; },
    manifest => { manifest.assets[0].generation.resultMetadata.returnedModel = ""; },
    manifest => { delete manifest.assets[0].generation.resultMetadata.outputHintSha256; },
    manifest => { manifest.assets[0].generation.resultMetadata.outputHintSha256 = "ABC"; },
    manifest => { manifest.assets[0].generation.resultMetadata.rawHint = "private"; },
    manifest => { manifest.assets[0].generation.resultMetadataSha256 = testHash("wrong"); },
    manifest => { manifest.assets[0].generation.prompt += " invented"; },
    manifest => {
      manifest.assets[0].generation.prompt = manifest.assets[0].generation.prompt
        .replace("characters", "figures");
      manifest.assets[0].generation.promptSha256 = testHash(
        manifest.assets[0].generation.prompt
      );
    },
    manifest => { manifest.assets[0].generation.promptSha256 = testHash("wrong"); },
    manifest => { manifest.assets[0].task4.briefSha256 = testHash("wrong"); },
    manifest => { manifest.assets[0].task4.requiredBackdropElements.reverse(); },
    manifest => { manifest.assets[0].source.format = "gif"; },
    manifest => { manifest.assets[0].source.sha256 = "not-a-hash"; },
    manifest => { manifest.assets[0].source.width = 1535; },
    manifest => { manifest.assets[0].transform.crop.width = 1535; },
    manifest => { manifest.assets[0].transform.crop.left = -1; },
    manifest => { manifest.assets[0].transform.resize.withoutEnlargement = false; },
    manifest => { manifest.assets[0].transform.resize.kernel = "nearest"; },
    manifest => { manifest.assets[0].transform.encode.quality = 80; },
    manifest => { manifest.assets[0].transform.encode.sharpVersion = ""; },
    manifest => { manifest.assets[0].transform.encode.libvipsVersion = ""; },
    manifest => { manifest.assets[0].transform.encode.doubleEncodeSha256 = testHash("wrong"); },
    manifest => { manifest.assets[0].final.format = "png"; },
    manifest => { manifest.assets[0].final.width = 1535; },
    manifest => { manifest.assets[0].final.byteLength = 0; },
    manifest => { manifest.assets[0].final.opaque = false; },
    manifest => { manifest.assets[0].final.pages = 2; },
    manifest => { manifest.assets[0].cropReview.profiles.pop(); },
    manifest => {
      manifest.assets[0].cropReview.profiles[1] = clone(
        manifest.assets[0].cropReview.profiles[0]
      );
    },
    manifest => { manifest.assets[0].cropReview.profiles[0].targetSize = [800, 600]; },
    manifest => { manifest.assets[0].cropReview.profiles[0].quietZone = [0, 0, 1, 1]; },
    manifest => { manifest.assets[0].cropReview.profiles[0].retainedRect.x = 0.2; },
    manifest => { manifest.assets[0].cropReview.profiles[0].panelSha256 = "bad"; },
    manifest => { manifest.assets[0].cropReview.profiles[0].quietZoneRetained = false; },
    manifest => { manifest.assets[0].agentInspection.finalSha256 = testHash("stale"); },
    manifest => { manifest.assets[0].agentInspection.methods.reverse(); },
    manifest => { manifest.assets[0].agentInspection.checks.profileQuietZones = "unknown"; },
    manifest => { manifest.assets[0].humanReviews.crop = true; },
    manifest => { manifest.assets[0].humanReviews.semantic = { decision: "approved" }; },
    manifest => {
      manifest.assets[0].humanReviews.crop = {
        finalSha256: manifest.assets[0].final.sha256,
        reviewedAt: fixedNow(9),
        reviewerRole: "reviewer",
        environment: "desktop",
        decision: "approved",
        evidenceRefs: ["crop-proof"],
        cropProfiles: ["landscape", "tablet"]
      };
    }
  ];
  for (const mutate of mutations) {
    const changed = clone(fixture);
    mutate(changed);
    assert.throws(() => assertSoundSeekersV2AssetManifest(changed, SOUND_SEEKERS_BIOME_KITS));
  }

  const hiddenExtra = clone(fixture);
  Object.defineProperty(hiddenExtra.assets[0], "hidden", {
    value: true,
    enumerable: false
  });
  assert.throws(() => assertSoundSeekersV2AssetManifest(
    hiddenExtra,
    SOUND_SEEKERS_BIOME_KITS
  ));
  const symbolExtra = clone(fixture);
  symbolExtra.assets[0][Symbol("hidden")] = true;
  assert.throws(() => assertSoundSeekersV2AssetManifest(
    symbolExtra,
    SOUND_SEEKERS_BIOME_KITS
  ));
  const accessor = clone(fixture);
  Object.defineProperty(accessor.assets[0], "id", {
    get: () => fixture.assets[0].id,
    enumerable: true
  });
  assert.throws(() => assertSoundSeekersV2AssetManifest(
    accessor,
    SOUND_SEEKERS_BIOME_KITS
  ));
});

test("[preflight] call ledger reservations are atomic and interruption is terminal", async t => {
  const fixture = await initializeSyntheticLedgers(t);
  const initial = readCallsLedger({
    root: fixture.root,
    callsLedgerPath: fixture.callsLedgerPath
  });
  assertExactKeys(initial, ["schemaVersion", "runId", "task4Commit", "task4BriefSetSha256", "entries"]);
  assert.deepEqual(initial.entries.map(entry => entry.ordinal), [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.deepEqual(initial.entries.map(entry => entry.chapterId), SOUND_SEEKERS_V2_BACKGROUND_ORDER);
  assert.deepEqual(initial.entries.map(entry => entry.state), Array(8).fill("planned"));
  initial.entries.forEach(entry => assertExactKeys(entry, CALL_KEYS));
  initial.entries.forEach(entry => assert.deepEqual({
    requestedAt: entry.requestedAt,
    completedAt: entry.completedAt,
    resultMetadata: entry.resultMetadata,
    resultMetadataSha256: entry.resultMetadataSha256,
    sourcePath: entry.sourcePath,
    sourceSha256: entry.sourceSha256,
    errorCode: entry.errorCode
  }, {
    requestedAt: null,
    completedAt: null,
    resultMetadata: null,
    resultMetadataSha256: null,
    sourcePath: null,
    sourceSha256: null,
    errorCode: null
  }));
  assert.equal(lstatSync(fixture.callsLedgerPath).mode & 0o777, 0o600);
  await assert.rejects(() => initCallsLedger({
    root: fixture.root,
    callsLedgerPath: fixture.callsLedgerPath,
    task4Commit: TASK4_COMMIT,
    runId: "replacement-run"
  }));
  await assert.rejects(() => reserveCall({
    ...fixture,
    ordinal: 2,
    now: fixedNow(1)
  }));

  const invalidLedgers = [
    ledger => { ledger.entries.pop(); },
    ledger => { ledger.entries.push(clone(ledger.entries[0])); },
    ledger => { ledger.entries.reverse(); },
    ledger => { ledger.entries[1].ordinal = 1; },
    ledger => { ledger.entries[1].chapterId = ledger.entries[0].chapterId; },
    ledger => { ledger.task4BriefSetSha256 = testHash("drift"); },
    ledger => { ledger.entries[0].state = "reserved"; },
    ledger => { ledger.entries[0].preparation = {}; },
    ledger => { ledger.entries[0].errorCode = "raw tool output /tmp/secret"; }
  ];
  for (const mutate of invalidLedgers) {
    const changed = clone(initial);
    mutate(changed);
    assert.throws(() => validateCallsLedger(changed, { root: fixture.root }));
  }

  await reserveCall({ ...fixture, ordinal: 1, now: fixedNow(1) });
  assert.equal(readCallsLedger(fixture).entries[0].state, "reserved");
  await assert.rejects(() => reserveCall({ ...fixture, ordinal: 1, now: fixedNow(2) }));
  await resumeCallsLedger({ ...fixture, now: fixedNow(3) });
  const recovered = readCallsLedger(fixture);
  assert.equal(recovered.entries[0].state, "unknown");
  assert.equal(recovered.entries[0].errorCode, "INTERRUPTED_AFTER_RESERVATION");
  assert.deepEqual(recovered.entries.slice(1).map(entry => entry.state), Array(7).fill("planned"));
  assert.equal(validateCallsLedger(recovered, { root: fixture.root }), true);
  await assert.rejects(() => reserveCall({ ...fixture, ordinal: 1, now: fixedNow(4) }));
  assert.deepEqual(
    readdirSync(dirname(fixture.callsLedgerPath)).filter(name => name.includes(".tmp")),
    []
  );
});

test("[preflight] result capture accepts one strict returned data URL and freezes terminal facts", async t => {
  const fixture = await initializeSyntheticLedgers(t);
  await reserveCall({ ...fixture, ordinal: 1, now: fixedNow(1) });
  const source = await sourceResult(0);
  await captureCallResult({
    ...fixture,
    ordinal: 1,
    now: fixedNow(2),
    result: source.result
  });
  const captured = readCallsLedger(fixture).entries[0];
  assert.equal(captured.state, "succeeded");
  assert.match(captured.sourceSha256, HASH);
  assert.equal(captured.sourceSha256, testHash(readFileSync(join(fixture.root, captured.sourcePath))));
  assert.deepEqual(captured.resultMetadata, {
    returnedModel: "synthetic-image-model",
    outputHintSha256: testHash("synthetic-output-0")
  });
  assert.equal(captured.resultMetadataSha256, testCanonicalHash(captured.resultMetadata));
  assert.equal(JSON.stringify(captured).includes("synthetic-output-0"), false);
  assert.equal(JSON.stringify(captured).includes("data:image"), false);
  const terminalBytes = readFileSync(fixture.callsLedgerPath);
  await assert.rejects(() => captureCallResult({
    ...fixture,
    ordinal: 1,
    now: fixedNow(3),
    result: source.result
  }));
  assert.deepEqual(readFileSync(fixture.callsLedgerPath), terminalBytes);

  for (const result of [
    { image_url: null, output_hint: null, returnedModel: null },
    { image_url: "https://example.test/image.png", output_hint: null, returnedModel: null },
    { image_url: "/tmp/image.png", output_hint: null, returnedModel: null },
    { image_url: "data:image/png;base64,%%%%", output_hint: null, returnedModel: null },
    { image_url: "data:image/jpeg;base64,iVBORw0KGgo=", output_hint: null, returnedModel: null },
    { image_url: source.result.image_url, image_urls: [source.result.image_url],
      output_hint: null, returnedModel: null }
  ]) {
    const rejected = await initializeSyntheticLedgers(t);
    await reserveCall({ ...rejected, ordinal: 1, now: fixedNow(1) });
    await assert.rejects(() => captureCallResult({
      ...rejected, ordinal: 1, now: fixedNow(2), result
    }));
  }

  const interrupted = await initializeSyntheticLedgers(t);
  await reserveCall({ ...interrupted, ordinal: 1, now: fixedNow(1) });
  await assert.rejects(() => captureCallResult({
    ...interrupted,
    ordinal: 1,
    now: fixedNow(2),
    result: source.result,
    afterSourceRename() {
      throw new Error("synthetic interruption after durable source rename");
    }
  }));
  assert.equal(readCallsLedger(interrupted).entries[0].state, "reserved");
  const interruptedSources = readdirSync(join(
    interrupted.root,
    ".artifacts/sound-seekers-v2/generation/source"
  ));
  assert.equal(interruptedSources.length, 1);
  await resumeCallsLedger({ ...interrupted, now: fixedNow(3) });
  assert.equal(readCallsLedger(interrupted).entries[0].state, "unknown");
  await assert.rejects(() => captureCallResult({
    ...interrupted,
    ordinal: 1,
    now: fixedNow(4),
    result: source.result
  }));

  const nonAtomic = await initializeSyntheticLedgers(t);
  await assert.rejects(() => reserveCall({
    ...nonAtomic,
    ordinal: 1,
    now: fixedNow(1),
    atomicWriter() {}
  }));
  await assert.rejects(() => reserveCall({
    ...nonAtomic,
    ordinal: 1,
    now: fixedNow(1),
    writeLedger() {}
  }));
});

test("[preflight] capture and inspection CLIs read one exact JSON object from stdin", async t => {
  const fixture = await initializeSyntheticLedgers(t);
  await reserveCall({ ...fixture, ordinal: 1, now: fixedNow(1) });
  const source = await sourceResult(0);
  const captured = runPrepareCli(fixture.root, [
    "--capture-call-result",
    "--ordinal", "1",
    "--calls-ledger", CALLS_LEDGER_RELATIVE
  ], source.result);
  assert.equal(captured.status, 0, captured.stderr);
  assert.equal(readCallsLedger(fixture).entries[0].state, "succeeded");

  await initPreparationLedger({ ...fixture, now: fixedNow(3) });
  const sourceCandidateSha256 = readCallsLedger(fixture).entries[0].sourceSha256;
  const inspected = runPrepareCli(fixture.root, [
    "--record-agent-inspection",
    "--chapter", SOUND_SEEKERS_V2_BACKGROUND_ORDER[0],
    "--scope", "source",
    "--preparation-ledger", PREPARATION_LEDGER_RELATIVE
  ], inspectRecord("source", sourceCandidateSha256, 4));
  assert.equal(inspected.status, 0, inspected.stderr);
  assert.equal(readPreparationLedger(fixture).entries[0].stage, "source_accepted");

  for (const invalid of [
    { ...source.result, extra: true },
    { image_url: source.result.image_url, output_hint: null },
    [source.result],
    null
  ]) {
    const rejected = await initializeSyntheticLedgers(t);
    await reserveCall({ ...rejected, ordinal: 1, now: fixedNow(1) });
    const result = runPrepareCli(rejected.root, [
      "--capture-call-result",
      "--ordinal", "1",
      "--calls-ledger", CALLS_LEDGER_RELATIVE
    ], invalid);
    assert.notEqual(result.status, 0);
  }

  for (const args of [
    ["--capture", "--ordinal", "1", "--calls-ledger", CALLS_LEDGER_RELATIVE],
    ["--capture-call-result", "--reserve-call", "--ordinal", "1",
      "--calls-ledger", CALLS_LEDGER_RELATIVE],
    ["--capture-call-result", "--ordinal", "1", "--root", fixture.root,
      "--calls-ledger", CALLS_LEDGER_RELATIVE]
  ]) {
    const result = runPrepareCli(fixture.root, args, source.result);
    assert.notEqual(result.status, 0);
  }
});

test("[preflight] call failures and preparation stages cannot rewrite terminal receipts", async t => {
  const fixture = await initializeSyntheticLedgers(t);
  await reserveCall({ ...fixture, ordinal: 1, now: fixedNow(1) });
  await recordCallFailure({
    ...fixture,
    ordinal: 1,
    code: "TOOL_CALL_FAILED",
    now: fixedNow(2)
  });
  const failed = readCallsLedger(fixture);
  assert.equal(failed.entries[0].state, "failed");
  assert.equal(failed.entries[0].errorCode, "TOOL_CALL_FAILED");
  const terminalBytes = readFileSync(fixture.callsLedgerPath);
  await initPreparationLedger({
    ...fixture,
    preparationLedgerPath: fixture.preparationLedgerPath,
    now: fixedNow(3)
  });
  const preparation = readPreparationLedger(fixture);
  await assert.rejects(() => initPreparationLedger({ ...fixture }));
  assertExactKeys(preparation, [
    "schemaVersion", "runId", "task4Commit", "task4BriefSetSha256", "entries"
  ]);
  preparation.entries.forEach(entry => assertExactKeys(entry, PREPARATION_KEYS));
  assert.equal(preparation.entries[0].terminalCallEntrySha256,
    testCanonicalHash(failed.entries[0]));
  assert.equal(preparation.entries[0].stage, "awaiting_call");
  assert.deepEqual(preparation.entries[0].humanReviews, { crop: null, semantic: null });
  assert.equal(validatePreparationLedger(preparation, {
    root: fixture.root,
    callsLedger: failed
  }), true);
  const tamperedCalls = clone(failed);
  tamperedCalls.entries[0].completedAt = fixedNow(5);
  writeFileSync(fixture.callsLedgerPath, `${JSON.stringify(tamperedCalls, null, 2)}\n`, {
    mode: 0o600
  });
  assert.throws(() => readPreparationLedger(fixture));
  writeFileSync(fixture.callsLedgerPath, terminalBytes, { mode: 0o600 });
  const invalidPreparations = [
    ledger => { ledger.entries.pop(); },
    ledger => { ledger.entries.push(clone(ledger.entries[0])); },
    ledger => { ledger.entries.reverse(); },
    ledger => { ledger.task4BriefSetSha256 = testHash("drift"); },
    ledger => { ledger.entries[0].state = "failed"; },
    ledger => { ledger.entries[0].terminalCallEntrySha256 = testHash("stale"); },
    ledger => { ledger.entries[0].stage = "source_ready"; },
    ledger => { ledger.entries[0].stage = "prepared"; },
    ledger => { ledger.entries[0].agentInspection.source = inspectRecord(
      "source",
      testHash("missing-candidate"),
      4
    ); },
    ledger => { ledger.entries[0].humanReviews.crop = true; },
    ledger => { ledger.entries[0].cleanup.completedAt = "not-utc"; },
    ledger => { ledger.entries[0].cleanup.removedCandidatePaths = ["same", "same"]; }
  ];
  for (const mutate of invalidPreparations) {
    const changed = clone(preparation);
    mutate(changed);
    assert.throws(() => validatePreparationLedger(changed, {
      root: fixture.root,
      callsLedger: failed
    }));
  }
  assert.deepEqual(readFileSync(fixture.callsLedgerPath), terminalBytes);
  await assert.rejects(() => prepareBackground({
    ...fixture,
    chapterId: SOUND_SEEKERS_V2_BACKGROUND_ORDER[0]
  }));
  await assert.rejects(() => recordAgentInspection({
    ...fixture,
    chapterId: SOUND_SEEKERS_V2_BACKGROUND_ORDER[0],
    scope: "source",
    inspection: inspectRecord("source", testHash("not-usable"), 4)
  }));
  const synchronized = readPreparationLedger(fixture).entries[0];
  assert.equal(synchronized.stage, "rejected");
  assert.equal(synchronized.terminalCallEntrySha256,
    testCanonicalHash(failed.entries[0]));
  assert.deepEqual(readFileSync(fixture.callsLedgerPath), terminalBytes);
});

test("[preflight] deterministic preparation uses focal largest-16:9 crop and byte-identical double encode", async t => {
  const preparedHashes = [];
  for (let run = 0; run < 2; run += 1) {
    const fixture = await initializeSyntheticLedgers(t);
    const source = await sourceResult(0, { width: 1703, height: 1031 });
    await reserveCall({ ...fixture, ordinal: 1, now: fixedNow(1) });
    await captureCallResult({
      ...fixture, ordinal: 1, now: fixedNow(2), result: source.result
    });
    await initPreparationLedger({ ...fixture, now: fixedNow(3) });
    const sourceEntry = readCallsLedger(fixture).entries[0];
    await recordAgentInspection({
      ...fixture,
      chapterId: sourceEntry.chapterId,
      scope: "source",
      inspection: inspectRecord("source", sourceEntry.sourceSha256, 4)
    });
    const preparationResult = await prepareBackground({
      ...fixture,
      chapterId: sourceEntry.chapterId,
      now: fixedNow(5)
    });
    const preparedEntry = readPreparationLedger(fixture).entries[0];
    const preparedPath = join(fixture.root, preparedEntry.preparedCandidate.path);
    const metadata = await sharp(preparedPath).metadata();
    assert.deepEqual({
      format: metadata.format,
      width: metadata.width,
      height: metadata.height,
      pages: metadata.pages ?? 1,
      hasAlpha: metadata.hasAlpha,
      space: metadata.space
    }, {
      format: "webp", width: 1536, height: 864, pages: 1,
      hasAlpha: false, space: "srgb"
    });
    assert.equal(preparedEntry.preparedCandidate.sha256, testHash(readFileSync(preparedPath)));
    assertExactKeys(preparedEntry.preparedCandidate,
      ["path", "format", "width", "height", "byteLength", "sha256"]);
    assert.deepEqual(preparationResult.transform.crop, {
      left: 4,
      top: 77,
      width: 1696,
      height: 954,
      anchorProfile: "landscape"
    });
    assert.deepEqual(preparationResult.transform.resize, {
      width: 1536,
      height: 864,
      kernel: "lanczos3",
      withoutEnlargement: true
    });
    assert.deepEqual({
      format: preparationResult.transform.encode.format,
      quality: preparationResult.transform.encode.quality,
      effort: preparationResult.transform.encode.effort,
      smartSubsample: preparationResult.transform.encode.smartSubsample,
      metadata: preparationResult.transform.encode.metadata,
      colourspace: preparationResult.transform.encode.colourspace,
      doubleEncodeSha256: preparationResult.transform.encode.doubleEncodeSha256
    }, {
      format: "webp",
      quality: 82,
      effort: 6,
      smartSubsample: true,
      metadata: "stripped",
      colourspace: "srgb",
      doubleEncodeSha256: preparedEntry.preparedCandidate.sha256
    });
    assert.equal(preparationResult.ledger.entries[0].preparedCandidate.sha256,
      preparedEntry.preparedCandidate.sha256);
    preparedHashes.push(preparedEntry.preparedCandidate.sha256);
  }
  assert.equal(preparedHashes[0], preparedHashes[1]);
});

test("[preflight] preparation rejects unusable, changed, linked, and rejected candidates", async t => {
  for (const source of [
    await sourceResult(0, { width: 1535, height: 864 }),
    await sourceResult(0, { alpha: true })
  ]) {
    const fixture = await sourceAcceptedFixture(t, source);
    await assert.rejects(() => prepareBackground({
      ...fixture,
      chapterId: SOUND_SEEKERS_V2_BACKGROUND_ORDER[0],
      now: fixedNow(5)
    }));
    assert.equal(readPreparationLedger(fixture).entries[0].stage, "source_accepted");
  }

  const tampered = await sourceAcceptedFixture(t, await sourceResult(0));
  const tamperedCall = readCallsLedger(tampered).entries[0];
  writeFileSync(join(tampered.root, tamperedCall.sourcePath), "changed bytes");
  await assert.rejects(() => prepareBackground({
    ...tampered,
    chapterId: SOUND_SEEKERS_V2_BACKGROUND_ORDER[0],
    now: fixedNow(5)
  }));

  const linked = await sourceAcceptedFixture(t, await sourceResult(0));
  const linkedCall = readCallsLedger(linked).entries[0];
  const linkedSource = join(linked.root, linkedCall.sourcePath);
  const outside = join(linked.root, "outside.png");
  writeFileSync(outside, readFileSync(linkedSource));
  rmSync(linkedSource);
  symlinkSync(outside, linkedSource);
  await assert.rejects(() => prepareBackground({
    ...linked,
    chapterId: SOUND_SEEKERS_V2_BACKGROUND_ORDER[0],
    now: fixedNow(5)
  }));

  const rejected = await initializeSyntheticLedgers(t);
  await reserveCall({ ...rejected, ordinal: 1, now: fixedNow(1) });
  await captureCallResult({
    ...rejected,
    ordinal: 1,
    now: fixedNow(2),
    result: (await sourceResult(0)).result
  });
  await initPreparationLedger({ ...rejected, now: fixedNow(3) });
  const rejectedSha = readCallsLedger(rejected).entries[0].sourceSha256;
  const rejectedInspection = inspectRecord("source", rejectedSha, 4);
  rejectedInspection.decision = "rejected";
  rejectedInspection.checks.unsafeImagery = "observed";
  await recordAgentInspection({
    ...rejected,
    chapterId: SOUND_SEEKERS_V2_BACKGROUND_ORDER[0],
    scope: "source",
    inspection: rejectedInspection
  });
  assert.equal(readPreparationLedger(rejected).entries[0].stage, "rejected");
  await assert.rejects(() => prepareBackground({
    ...rejected,
    chapterId: SOUND_SEEKERS_V2_BACKGROUND_ORDER[0],
    now: fixedNow(5)
  }));

  const finalRejected = await sourceAcceptedFixture(t, await sourceResult(0));
  await prepareBackground({
    ...finalRejected,
    chapterId: SOUND_SEEKERS_V2_BACKGROUND_ORDER[0],
    now: fixedNow(5)
  });
  const preparedEntry = readPreparationLedger(finalRejected).entries[0];
  const finalInspection = inspectRecord(
    "final",
    preparedEntry.preparedCandidate.sha256,
    6
  );
  finalInspection.decision = "rejected";
  finalInspection.checks.styleLighting = "does_not_match";
  await recordAgentInspection({
    ...finalRejected,
    chapterId: SOUND_SEEKERS_V2_BACKGROUND_ORDER[0],
    scope: "final",
    inspection: finalInspection
  });
  assert.equal(readPreparationLedger(finalRejected).entries[0].stage, "rejected");
});

test("[preflight] crop review locks 24 solver-derived panels and exact overlay geometry", async t => {
  const fixture = await completeSyntheticRun(t);
  const { review } = fixture;
  assert.equal(assertSoundSeekersV2CropReviewManifest(review.manifest, {
    root: fixture.root,
    kits: SOUND_SEEKERS_BIOME_KITS,
    panelRoot: review.outputRoot
  }), true);
  assert.equal(review.manifest.panels.length, 24);
  assert.deepEqual(review.manifest.panels.map(panel => panel.profileId),
    SOUND_SEEKERS_BIOME_KITS.flatMap(() => ["landscape", "tablet", "portrait"]));
  assert.deepEqual(review.manifest.renderer.pngOptions, {
    compressionLevel: 9, adaptiveFiltering: false, palette: false
  });
  assert.deepEqual(review.manifest.renderer.overlayContract, {
    retainedEdge: { inset: true, strokePixels: 3, rgba: [0, 229, 255, 255] },
    quietZone: { strokePixels: 3, rgba: [255, 214, 10, 255] },
    actionLane: {
      normalized: { x: 0.2, y: 0.58, width: 0.6, height: 0.3 },
      strokePixels: 3,
      rgba: [255, 79, 216, 255]
    },
    focalPoint: {
      axisLengthPixels: 9,
      strokePixels: 1,
      rgba: [255, 255, 255, 255]
    }
  });
  assert.deepEqual(review.manifest.renderer, SOUND_SEEKERS_V2_CROP_REVIEW_RENDERER);
  for (const [index, panel] of review.manifest.panels.entries()) {
    const kit = SOUND_SEEKERS_BIOME_KITS[Math.floor(index / 3)];
    const profile = kit.background.cropProfiles[panel.profileId];
    assert.equal(panel.file,
      `${String(Math.floor(index / 3) + 1).padStart(2, "0")}-${kit.id}--${panel.profileId}--crop-review.png`);
    assert.deepEqual(panel.quietZone, profile.quietZone);
    assert.deepEqual(panel.retainedRect, computeBackgroundCrop({
      sourceSize: [1536, 864],
      targetSize: profile.targetSize,
      focalPoint: profile.focalPoint
    }));
    assert.equal(testHash(readFileSync(join(review.outputRoot, panel.file))), panel.panelSha256);
  }
  const mutations = [
    manifest => { manifest.panels.pop(); },
    manifest => { manifest.panels.push(clone(manifest.panels[0])); },
    manifest => { manifest.panels[1] = clone(manifest.panels[0]); },
    manifest => { manifest.renderer.pngOptions.compressionLevel = 8; },
    manifest => { manifest.renderer.rounding = "Math.round"; },
    manifest => { manifest.renderer.overlayContract.actionLane.x = 0.21; },
    manifest => { manifest.panels[0].profileId = "wide"; },
    manifest => { manifest.panels[0].file = "wrong.png"; },
    manifest => { manifest.panels[0].targetSize = [567, 320]; },
    manifest => { manifest.panels[0].sourceSha256 = testHash("wrong-source"); },
    manifest => { manifest.panels[0].finalSha256 = testHash("wrong-final"); },
    manifest => { manifest.panels[0].retainedRect.x += 1; },
    manifest => { manifest.panels[0].quietZone.x += 0.01; },
    manifest => { manifest.panels[0].actionLane.x += 0.01; },
    manifest => { manifest.panels[0].overlayPixels.quietZone.left += 1; },
    manifest => { manifest.panels[0].overlayPixels.focal.x += 1; },
    manifest => { manifest.panels[0].panelSha256 = testHash("wrong-panel"); }
  ];
  for (const [mutationIndex, mutate] of mutations.entries()) {
    const changed = clone(review.manifest);
    mutate(changed);
    assert.throws(() => assertSoundSeekersV2CropReviewManifest(changed, {
      root: fixture.root,
      kits: SOUND_SEEKERS_BIOME_KITS,
      panelRoot: review.outputRoot
    }), `crop manifest mutation ${mutationIndex + 1} must be rejected`);
  }
  const firstPanel = join(review.outputRoot, review.manifest.panels[0].file);
  const firstPanelBytes = readFileSync(firstPanel);
  writeFileSync(firstPanel, Buffer.from(firstPanelBytes).fill(0, 0, 1));
  assert.throws(() => assertSoundSeekersV2CropReviewManifest(review.manifest, {
    root: fixture.root,
    kits: SOUND_SEEKERS_BIOME_KITS,
    panelRoot: review.outputRoot
  }));
  writeFileSync(firstPanel, firstPanelBytes);

  const incomplete = clone(readPreparationLedger(fixture));
  for (const entry of incomplete.entries) {
    entry.cropReview = null;
    entry.stage = "final_accepted";
  }
  incomplete.entries[0].agentInspection.final = null;
  incomplete.entries[0].stage = "prepared";
  writeFileSync(fixture.preparationLedgerPath,
    `${JSON.stringify(incomplete, null, 2)}\n`, { mode: 0o600 });
  await assert.rejects(() => recordCropReview({
    root: fixture.root,
    callsLedgerPath: fixture.callsLedgerPath,
    preparationLedgerPath: fixture.preparationLedgerPath,
    manifestPath: CROP_REVIEW_MANIFEST_RELATIVE,
    now: fixedNow(54)
  }));
});

test("[preflight] accepted ledgers finalize atomically to one exact public inventory", async t => {
  const fixture = await completeSyntheticRun(t);
  const preparation = readPreparationLedger(fixture);
  assert.deepEqual(preparation.entries.map(entry => entry.stage),
    Array(8).fill("crop_accepted"));
  assert.deepEqual(preparation.entries.map(entry => entry.humanReviews),
    Array.from({ length: 8 }, () => ({ crop: null, semantic: null })));
  assert.deepEqual(relativeFileInventory(fixture.publicRoot), [
    "SOURCE.md",
    ...SOUND_SEEKERS_V2_BACKGROUND_ORDER.map(
      chapterId => `biomes/${chapterId}/background.webp`
    )
  ].toSorted());
  const manifest = readSoundSeekersV2AssetManifest({ root: fixture.root });
  assert.equal(assertSoundSeekersV2AssetManifest(
    manifest,
    SOUND_SEEKERS_BIOME_KITS
  ), true);
  await assertSoundSeekersV2Assets({
    root: fixture.root,
    kits: SOUND_SEEKERS_BIOME_KITS
  });
  const publicBytes = relativeFileInventory(fixture.publicRoot).map(file => ({
    file,
    bytes: readFileSync(join(fixture.publicRoot, file))
  }));
  await assert.rejects(() => finalizeSoundSeekersV2Assets({
    root: fixture.root,
    callsLedgerPath: fixture.callsLedgerPath,
    preparationLedgerPath: fixture.preparationLedgerPath,
    publicRoot: fixture.publicRoot
  }));
  for (const item of publicBytes) {
    assert.deepEqual(readFileSync(join(fixture.publicRoot, item.file)), item.bytes);
  }

  const checkerMutations = [
    publicRoot => {
      rmSync(join(publicRoot, "biomes/seedwake-meadow/background.webp"));
    },
    publicRoot => {
      writeFileSync(join(publicRoot, "extra.webp"), "orphan");
    },
    publicRoot => {
      writeFileSync(join(publicRoot, "biomes/seedwake-meadow/background.webp"), "tampered");
    },
    publicRoot => {
      const target = join(publicRoot, "biomes/seedwake-meadow/background.webp");
      rmSync(target);
      symlinkSync(join(publicRoot, "biomes/river-gardens/background.webp"), target);
    },
    publicRoot => {
      const sourcePath = join(publicRoot, "SOURCE.md");
      writeFileSync(sourcePath, `${readFileSync(sourcePath, "utf8")}\n\`\`\`json\n{}\n\`\`\`\n`);
    }
  ];
  for (const mutate of checkerMutations) {
    const changedRoot = temporaryRoot(t, "sound-seekers-checker-mutation-");
    const changedPublicRoot = join(
      changedRoot,
      "public/game-assets/sound-seekers/v2"
    );
    mkdirSync(dirname(changedPublicRoot), { recursive: true });
    cpSync(fixture.publicRoot, changedPublicRoot, { recursive: true });
    mutate(changedPublicRoot);
    await assert.rejects(() => assertSoundSeekersV2Assets({
      root: changedRoot,
      kits: SOUND_SEEKERS_BIOME_KITS
    }));
  }
});

test("[preflight] finalization and checker reject partial, extra, linked, and tampered public roots", async t => {
  const root = temporaryRoot(t);
  const publicRoot = join(root, "public/game-assets/sound-seekers/v2");
  mkdirSync(publicRoot, { recursive: true });
  writeFileSync(join(publicRoot, "partial.tmp"), "partial");
  await assert.rejects(() => assertSoundSeekersV2Assets({
    root, kits: SOUND_SEEKERS_BIOME_KITS
  }));
  rmSync(publicRoot, { recursive: true, force: true });
  mkdirSync(dirname(publicRoot), { recursive: true });
  const outside = join(root, "outside.webp");
  writeFileSync(outside, "outside");
  symlinkSync(outside, publicRoot);
  await assert.rejects(() => assertSoundSeekersV2Assets({
    root, kits: SOUND_SEEKERS_BIOME_KITS
  }));
  rmSync(publicRoot, { force: true });

  const fixture = await initializeSyntheticLedgers(t);
  await assert.rejects(() => finalizeSoundSeekersV2Assets({
    ...fixture,
    publicRoot: join(fixture.root, "public/game-assets/sound-seekers/v2")
  }));
  assert.equal(existsSync(join(fixture.root, "public/game-assets/sound-seekers/v2")), false);
});

test("[preflight] fail-closed cleanup preserves ledgers, tombstones, public output, and neighbors", async t => {
  const fixture = await initializeSyntheticLedgers(t);
  await reserveCall({ ...fixture, ordinal: 1, now: fixedNow(1) });
  await recordCallFailure({
    ...fixture, ordinal: 1, code: "TOOL_CALL_FAILED", now: fixedNow(2)
  });
  await initPreparationLedger({ ...fixture, now: fixedNow(3) });
  const neighbor = join(fixture.root, ".artifacts/sound-seekers-v2/neighbor.txt");
  writeFileSync(neighbor, "keep");
  const callsBefore = readFileSync(fixture.callsLedgerPath);
  await cleanupCandidates({ ...fixture, expectPublic: "absent", now: fixedNow(4) });
  assert.deepEqual(readFileSync(fixture.callsLedgerPath), callsBefore);
  assert.equal(readCallsLedger(fixture).entries[0].state, "failed");
  assert.equal(existsSync(fixture.preparationLedgerPath), true);
  assert.equal(readFileSync(neighbor, "utf8"), "keep");

  const uncertain = join(fixture.root, ".artifacts/sound-seekers-v2/generation/source/uncertain.png");
  mkdirSync(dirname(uncertain), { recursive: true });
  writeFileSync(uncertain, "uncertain");
  chmodSync(uncertain, 0o600);
  await assert.rejects(() => cleanupCandidates({
    ...fixture, expectPublic: "absent", now: fixedNow(5)
  }));
  assert.equal(readFileSync(uncertain, "utf8"), "uncertain");
  assert.equal(readFileSync(neighbor, "utf8"), "keep");
});

test("[preflight] successful cleanup removes only hash-bound transient evidence", async t => {
  const fixture = await completeSyntheticRun(t);
  const callsBefore = readFileSync(fixture.callsLedgerPath);
  const publicBefore = relativeFileInventory(fixture.publicRoot).map(file => ({
    file,
    sha256: testHash(readFileSync(join(fixture.publicRoot, file)))
  }));
  const neighbor = join(fixture.root, ".artifacts/sound-seekers-v2/neighbor.txt");
  writeFileSync(neighbor, "keep");
  const before = readPreparationLedger(fixture);
  const candidatePaths = before.entries.flatMap(entry => [
    entry.sourceCandidate?.path,
    entry.preparedCandidate?.path
  ].filter(Boolean));
  assert.equal(candidatePaths.length, 16);
  await cleanupCandidates({
    root: fixture.root,
    callsLedgerPath: fixture.callsLedgerPath,
    preparationLedgerPath: fixture.preparationLedgerPath,
    expectPublic: "complete",
    now: fixedNow(53)
  });
  assert.deepEqual(readFileSync(fixture.callsLedgerPath), callsBefore);
  assert.equal(existsSync(fixture.preparationLedgerPath), true);
  assert.equal(readFileSync(neighbor, "utf8"), "keep");
  assert.deepEqual(relativeFileInventory(fixture.publicRoot).map(file => ({
    file,
    sha256: testHash(readFileSync(join(fixture.publicRoot, file)))
  })), publicBefore);
  const after = readPreparationLedger(fixture);
  assert.deepEqual(after.entries.map(entry => entry.stage), Array(8).fill("cleaned"));
  for (const entry of after.entries) {
    assert.match(entry.cleanup.completedAt, UTC);
    assert.ok(entry.cleanup.removedCandidatePaths.length >= 2);
  }
  for (const candidatePath of candidatePaths) {
    assert.equal(existsSync(join(fixture.root, candidatePath)), false);
  }
  await assertSoundSeekersV2Assets({
    root: fixture.root,
    kits: SOUND_SEEKERS_BIOME_KITS
  });
});

test("[real-root] every v2 background is exact, deterministic, bounded, and provenance locked", async () => {
  const manifest = readSoundSeekersV2AssetManifest({ root: REPOSITORY_ROOT });
  assert.equal(manifest.schemaVersion, 2);
  assert.deepEqual(manifest.assets.map(item => item.chapterId), SOUND_SEEKERS_V2_BACKGROUND_ORDER);
  assert.deepEqual(manifest.assets.map(item => item.generation.callOrdinal), [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.equal(new Set(manifest.assets.map(item => item.final.sha256)).size, 8);
  assert.equal(assertSoundSeekersV2AssetManifest(manifest, SOUND_SEEKERS_BIOME_KITS), true);
  for (const [index, kit] of SOUND_SEEKERS_BIOME_KITS.entries()) {
    const asset = manifest.assets[index];
    assert.equal(asset.id, kit.background.provenanceId);
    assert.equal(asset.path, kit.background.src);
    assert.equal(asset.generation.prompt, buildSoundSeekersV2BackgroundPrompt(kit));
    assert.match(asset.generation.requestedAt, UTC);
    assert.match(asset.generation.completedAt, UTC);
    assert.equal(asset.generation.resultMetadataSha256,
      testCanonicalHash(asset.generation.resultMetadata));
    assert.equal(asset.transform.encode.quality, 82);
    assert.equal(asset.transform.encode.doubleEncodeSha256, asset.final.sha256);
    assert.equal(Number.isSafeInteger(asset.final.byteLength), true);
    assert.ok(asset.final.byteLength > 0);
    assert.deepEqual(asset.cropReview.profiles.map(item => [item.id, item.targetSize]), [
      ["landscape", [568, 320]], ["tablet", [1194, 834]], ["portrait", [320, 568]]
    ]);
    assert.deepEqual(asset.humanReviews, { crop: null, semantic: null });
  }
  await assertSoundSeekersV2Assets({
    root: REPOSITORY_ROOT,
    kits: SOUND_SEEKERS_BIOME_KITS
  });
});

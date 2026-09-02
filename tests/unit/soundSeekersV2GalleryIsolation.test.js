import assert from "node:assert/strict";
import {
  chmodSync,
  existsSync,
  lstatSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  symlinkSync,
  writeFileSync
} from "node:fs";
import { EventEmitter, once } from "node:events";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  assertSoundSeekersV2Content,
  scanSoundSeekersV2SourcePolicy
} from "../../tools/checkSoundSeekersV2Content.mjs";
import * as questOfflineServer from "../../tools/serveQuestOfflineRangeTest.mjs";
import { selectQuestExecutablePolicy } from "../../tools/checkQuestOffline.mjs";

const {
  createQuestOfflineControlServer,
  createQuestOfflineRangeServer,
  createQuestOfflineTemporaryBuildRoot,
  cleanupQuestOfflineTemporaryBuildRoot,
  parseSingleRange,
  runQuestOfflineRangeServerLifecycle,
  validateQuestOfflineRoot,
  validateQuestOfflineTemporaryBuildRoot
} = questOfflineServer;

const scanVirtualPolicy = options => scanSoundSeekersV2SourcePolicy(options);

function realBundleAnalysis({ mutate = value => value, emitted = {} } = {}) {
  const root = realpathSync(mkdtempSync(path.join(os.tmpdir(), "ssv2-bundle-analysis-")));
  const analysis = mutate({
    generatedAt: "2026-09-03T00:00:00.000Z",
    chunks: [{
      fileName: "assets/main-clean.js",
      isEntry: true,
      isDynamicEntry: false,
      imports: ["assets/shared-clean.js"],
      dynamicImports: ["assets/lazy-clean.js"],
      renderedLength: 20,
      modules: [{ id: "/repo/src/main.jsx", renderedLength: 20, originalLength: 25 }]
    }, {
      fileName: "assets/shared-clean.js",
      isEntry: false,
      isDynamicEntry: false,
      imports: [],
      dynamicImports: [],
      renderedLength: 12,
      modules: [{ id: "/repo/src/shared.js", renderedLength: 12, originalLength: 14 }]
    }, {
      fileName: "assets/lazy-clean.js",
      isEntry: false,
      isDynamicEntry: true,
      imports: [],
      dynamicImports: [],
      renderedLength: 10,
      modules: [{ id: "/repo/src/lazy.js", renderedLength: 10, originalLength: 12 }]
    }, {
      fileName: "assets/css-only-empty.js",
      isEntry: false,
      isDynamicEntry: false,
      imports: [],
      dynamicImports: [],
      renderedLength: 0,
      modules: [{ id: "/repo/src/styles.css", renderedLength: 0, originalLength: 0 }]
    }]
  });
  for (const [relativePath, contents] of Object.entries({
    "assets/main-clean.js": "import './shared-clean.js'; import('./lazy-clean.js');",
    "assets/shared-clean.js": "export const shared = true;",
    "assets/lazy-clean.js": "export const lazy = true;",
    "index.html": "<script src=\"/assets/main-clean.js\"></script>",
    ...emitted
  })) {
    const target = path.join(root, relativePath);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, contents);
  }
  const analysisPath = path.join(root, "bundle-analysis.json");
  writeFileSync(analysisPath, JSON.stringify(analysis));
  return { root, analysisPath };
}

test("production bundle analysis requires the exact real Vite schema", () => {
  const valid = realBundleAnalysis();
  try {
    assert.doesNotThrow(() => assertSoundSeekersV2Content({ productionBundlePath: valid.analysisPath }));
  } finally {
    rmSync(valid.root, { recursive: true, force: true });
  }

  const mutations = [
    ["fabricated input/output schema", () => ({ inputs: {}, outputs: {} })],
    ["unknown root field", value => ({ ...value, extra: true })],
    ["invalid generatedAt", value => ({ ...value, generatedAt: "today" })],
    ["non-ISO generatedAt", value => ({ ...value, generatedAt: "123" })],
    ["unknown chunk field", value => ({ ...value, chunks: [{ ...value.chunks[0], extra: true }, ...value.chunks.slice(1)] })],
    ["missing chunk field", value => ({ ...value, chunks: [{ ...value.chunks[0], modules: undefined }, ...value.chunks.slice(1)] })],
    ["unknown module field", value => ({ ...value, chunks: [{ ...value.chunks[0], modules: [{ ...value.chunks[0].modules[0], extra: true }] }, ...value.chunks.slice(1)] })],
    ["malformed static import", value => ({ ...value, chunks: [{ ...value.chunks[0], imports: [null] }, ...value.chunks.slice(1)] })],
    ["malformed dynamic import", value => ({ ...value, chunks: [{ ...value.chunks[0], dynamicImports: [{}] }, ...value.chunks.slice(1)] })]
  ];
  for (const [label, mutate] of mutations) {
    const fixture = realBundleAnalysis({ mutate });
    try {
      assert.throws(() => assertSoundSeekersV2Content({ productionBundlePath: fixture.analysisPath }), undefined, label);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  }
});

test("production bundle isolation inspects chunks, modules, imports, and emitted text", () => {
  const marker = "preview/sound-seekers-v2-content.jsx";
  const mutations = [
    ["chunk filename", value => ({ ...value, chunks: [{ ...value.chunks[0], fileName: marker }, ...value.chunks.slice(1)] }), { [marker]: "export {};" }],
    ["module id", value => ({ ...value, chunks: [{ ...value.chunks[0], modules: [{ ...value.chunks[0].modules[0], id: `/repo/${marker}` }] }, ...value.chunks.slice(1)] }), {}],
    ["static import", value => ({ ...value, chunks: [{ ...value.chunks[0], imports: [marker] }, ...value.chunks.slice(1)] }), {}],
    ["dynamic import", value => ({ ...value, chunks: [{ ...value.chunks[0], dynamicImports: [marker] }, ...value.chunks.slice(1)] }), {}],
    ["emitted JavaScript", value => value, { "assets/marker.js": `import "/${marker}";` }],
    ["emitted CSS", value => value, { "assets/marker.css": "@import '/src/features/soundSeekers/preview/content-art-gallery.css';" }],
    ["emitted HTML", value => value, { "marker.html": "<script src='/preview/sound-seekers-v2-content.jsx'></script>" }]
  ];
  for (const [label, mutate, emitted] of mutations) {
    const fixture = realBundleAnalysis({ mutate, emitted });
    try {
      assert.throws(() => assertSoundSeekersV2Content({ productionBundlePath: fixture.analysisPath }), undefined, label);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  }
});

test("legacy fabricated production bundle fixtures are rejected", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "ssv2-gallery-isolation-"));
  try {
    const clean = path.join(root, "clean.json");
    writeFileSync(clean, JSON.stringify({ inputs: { "src/main.jsx": {} }, outputs: {} }));
    assert.throws(() => assertSoundSeekersV2Content({ productionBundlePath: clean }));
    const leaked = path.join(root, "leaked.json");
    writeFileSync(leaked, JSON.stringify({ inputs: { "preview/sound-seekers-v2-content.jsx": {} } }));
    assert.throws(() => assertSoundSeekersV2Content({ productionBundlePath: leaked }));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("gallery reference scanning covers HTML, CSS, and JSX references outside imports", () => {
  const cases = [
    ["HTML spaced double-quoted src", "index.html", "<script src = \"/preview/sound-seekers-v2-content.jsx\"></script>"],
    ["HTML single-quoted href", "index.html", "<link href = '/src/features/soundSeekers/preview/content-art-gallery.css'>"],
    ["HTML unquoted src", "index.html", "<script src=/preview/sound-seekers-v2-content.jsx></script>"],
    ["CSS quoted import", "src/index.css", "@import '/src/features/soundSeekers/preview/content-art-gallery.css';"],
    ["CSS unquoted import URL", "src/index.css", "@import url(/src/features/soundSeekers/preview/content-art-gallery.css);"],
    ["CSS quoted URL", "src/index.css", "body { background: url(\"/preview/sound-seekers-v2-content.html\"); }"],
    ["CSS unquoted URL", "src/index.css", "body { background: url(/preview/sound-seekers-v2-content.html); }"],
    ["JSX link href", "src/main.jsx", "export const Leak = () => <link href=\"/preview/sound-seekers-v2-content.html\" />;"],
    ["JSX script src string expression", "src/main.jsx", "export const Leak = () => <script src={'/preview/sound-seekers-v2-content.jsx'} />;"],
    ["JSX dynamic gallery href", "src/main.jsx", "export const Leak = ({ kind }) => <a href={`/preview/sound-seekers-v2-${kind}.html`}>Leak</a>;"],
    ["JSX unresolved gallery href", "src/main.jsx", "export const Leak = () => <a href=\"/preview/sound-seekers-v2-content-missing.html\">Leak</a>;"],
    ["HTML numeric-entity path", "index.html", "<script src=\"&#47;preview&#47;sound-seekers-v2-content.jsx\"></script>"],
    ["HTML named-entity anchor path", "index.html", "<a href=\"&sol;preview&sol;sound&hyphen;seekers-v2-content&period;html\">Leak</a>"],
    ["HTML encoded anchor fragment", "index.html", "<a href=\"&#35;&sol;preview&sol;sound-seekers-v2-content.html\">Leak</a>"],
    ["CSS hex-escaped URL", "src/index.css", String.raw`body { background: url(\2f preview\2f sound-seekers-v2-content\2e html); }`],
    ["CSS escaped quoted import", "src/index.css", String.raw`@import "\2f preview\2f sound-seekers-v2-content\2e html";`],
    ["JSX constant reference", "src/main.jsx", "const gallery = '/preview/sound-seekers-v2-content.html'; export const Leak = () => <a href={gallery}>Leak</a>;"],
    ["JSX constant template reference", "src/main.jsx", "const root = '/preview/sound-seekers-v2'; const leaf = 'content'; export const Leak = () => <a href={`${root}-${leaf}.html`}>Leak</a>;"],
    ["JSX concatenated fragments", "src/main.jsx", "const first = '/preview/sound-'; const second = 'seekers-v2-content.html'; export const Leak = () => <a href={first + second}>Leak</a>;"],
    ["JSX unresolved indirect gallery reference", "src/main.jsx", "const root = '/preview/sound-seekers-v2-'; const leaf = chooseAtRuntime(); export const Leak = () => <a href={root + leaf}>Leak</a>;" ]
  ];
  for (const [label, relativePath, source] of cases) {
    assert.throws(() => scanVirtualPolicy({ virtualSources: { [relativePath]: source } }), undefined, label);
  }
});

test("gallery references normalize percent encoding and preserve HTML quoted-attribute boundaries", () => {
  for (const [label, relativePath, source] of [
    ["percent-encoded HTML path", "index.html", "<a href='/%70review/sound-%73eekers-v2-content.html'>Leak</a>"],
    ["percent-encoded CSS path", "src/index.css", "body { background: url('/%70review/sound-%73eekers-v2-content.html'); }"],
    ["percent-encoded JSX path", "src/main.jsx", "export const Leak = () => <a href='/%70review/sound-%73eekers-v2-content.html'>Leak</a>;"],
    ["greater-than inside quoted attribute", "index.html", "<a title='1 > 0' href='/preview/sound-seekers-v2-content.html'>Leak</a>"]
  ]) {
    assert.throws(
      () => scanVirtualPolicy({ virtualSources: { [relativePath]: source } }),
      undefined,
      label
    );
  }
});

test("JSX gallery resolution follows lexical bindings without crossing duplicate scopes or parameters", () => {
  assert.throws(() => scanVirtualPolicy({
    virtualSources: {
      "src/main.jsx": [
        "const target = '/safe.html';",
        "export function Leak() {",
        "  const target = '/preview/sound-seekers-v2-content.html';",
        "  return <a href={target}>Leak</a>;",
        "}"
      ].join("\n")
    }
  }), undefined, "inner lexical gallery binding");

  assert.doesNotThrow(() => scanVirtualPolicy({
    virtualSources: {
      "src/main.jsx": [
        "const target = '/preview/sound-seekers-v2-content.html';",
        "export function Safe({ target }) {",
        "  return <a href={target}>Safe parameter</a>;",
        "}"
      ].join("\n")
    }
  }), "shadowed parameter must not resolve to the outer gallery constant");

  assert.throws(() => scanVirtualPolicy({
    virtualSources: {
      "src/main.jsx": [
        "const prefix = '/preview/sound-seekers-v2-content.html';",
        "const target = prefix;",
        "export function Leak() {",
        "  const prefix = '/safe.html';",
        "  return <a href={target}>Leak</a>;",
        "}"
      ].join("\n")
    }
  }), undefined, "constant initializers resolve in their declaration scope");
});

test("gallery isolation follows static, re-export, dynamic, HTML, and CSS edges", () => {
  const cases = [
    ["static import", "src/main.jsx", "import './features/soundSeekers/preview/ContentArtGallery.jsx';"],
    ["named re-export", "src/main.jsx", "export { ContentArtGallery } from './features/soundSeekers/preview/ContentArtGallery.jsx';"],
    ["star re-export", "src/main.jsx", "export * from './features/soundSeekers/preview/galleryReplayRecipes.js';"],
    ["literal dynamic import", "src/main.jsx", "export const load = () => import('./features/soundSeekers/preview/ContentArtGallery.jsx');"],
    ["nonliteral dynamic import", "src/main.jsx", "export const load = () => import('./features/' + 'soundSeekers/preview/ContentArtGallery.jsx');"],
    ["unprovable JavaScript dynamic import", "src/main.js", "const localPath = chooseAtRuntime(); export const load = () => import(localPath);"],
    ["unprovable TypeScript dynamic import", "src/main.ts", "const localPath: string = chooseAtRuntime(); export const load = () => import(localPath);"],
    ["unprovable TSX dynamic import", "src/main.tsx", "const localPath: string = chooseAtRuntime(); export const App = () => <button onClick={() => import(localPath)}>Load</button>;"],
    ["HTML module", "index.html", "<script type=\"module\" src=\"/preview/sound-seekers-v2-content.jsx\"></script>"],
    ["CSS import", "src/index.css", "@import './features/soundSeekers/preview/content-art-gallery.css';"]
  ];
  for (const [label, relativePath, source] of cases) {
    assert.throws(() => scanVirtualPolicy({
      virtualSources: { [relativePath]: source }
    }), undefined, label);
  }
});

test("gallery graph rejects unresolved edges and permits only the exact evidence consumers", () => {
  assert.throws(() => scanVirtualPolicy({
    virtualSources: {
      "preview/sound-seekers-v2-content.jsx": "import '../src/features/soundSeekers/preview/ContentArtGalleryMissing.jsx';"
    }
  }));
  assert.throws(() => scanVirtualPolicy({
    virtualSources: {
      "tests/unit/not-an-authorized-gallery-consumer.test.js":
        "import '../../src/features/soundSeekers/preview/galleryReplayRecipes.js';"
    }
  }));
  assert.throws(() => scanVirtualPolicy({
    removedSources: ["src/features/soundSeekers/preview/ContentArtGallery.jsx"]
  }));
  assert.throws(() => scanVirtualPolicy({
    virtualSources: {
      "src/main.tsx": "export { ContentArtGallery } from './features/soundSeekers/preview/ContentArtGallery.jsx';"
    }
  }));
});

test("preview policy rejects authored transition, evidence, correctness, phase, challenge, and response authority", () => {
  for (const [label, source] of [
    ["transition", "export const x = { presentationTransition: { reducerRevision: 1 } };"],
    ["evidence", "export const x = { evidenceEvent: { domain: 'novel_decoding' } };"],
    ["correctness", "export const x = { correct: true };"],
    ["phase prop", "export const x = <SceneVisual phase=\"resolved\" />;"],
    ["challenge", "export const x = { challenge: { expectedToken: 'x' } };"],
    ["response", "export const x = { response: { token: 'x' } };"],
    ["direct access", "import { issueSceneVisualAccess } from '../engine/sceneVisualAccess.js'; issueSceneVisualAccess({}, {});"]
  ]) {
    assert.throws(() => scanVirtualPolicy({
      virtualSources: { "src/features/soundSeekers/preview/bad.jsx": source }
    }), undefined, label);
  }
  for (const [label, source] of [
    ["replay transition lookalike", "export function replaySoundSeekersGalleryFixture() { return { presentationTransition: { reducerRevision: 1 } }; }"],
    ["replay evidence lookalike", "export function replaySoundSeekersGalleryFixture() { return { evidenceEvent: { domain: 'novel_decoding' } }; }"],
    ["replay phase literal", "export function replaySoundSeekersGalleryFixture() { return { phase: 'resolved' }; }"],
    ["replay direct access lookalike", "export function replaySoundSeekersGalleryFixture() { return issueSceneVisualAccess({}, {}); }"],
    ["replay caller-authored transaction", "export function replaySoundSeekersGalleryFixture() { return completeStoryTransferTransaction(state, { challenge: { expectedToken: 'x' }, response: { kind: 'literacy-answer', token: 'x' } }); }"]
  ]) {
    assert.throws(() => scanVirtualPolicy({
      virtualSources: { "src/features/soundSeekers/preview/galleryReplayRecipes.js": source }
    }), undefined, label);
  }
});

test("the offline range server rejects unsafe roots and implements one standards-compliant range", () => {
  assert.throws(() => validateQuestOfflineRoot("."));
  assert.throws(() => validateQuestOfflineRoot(os.homedir()));
  assert.deepEqual(parseSingleRange("bytes=2-5", 10), { start: 2, end: 5 });
  assert.deepEqual(parseSingleRange("bytes=-3", 10), { start: 7, end: 9 });
  assert.deepEqual(parseSingleRange("bytes=7-", 10), { start: 7, end: 9 });
  assert.throws(() => parseSingleRange("bytes=11-12", 10));
  assert.throws(() => parseSingleRange("bytes=0-1,3-4", 10));
});

test("standalone offline builds use an identity-bound OS-temp root and only validated cleanup can remove it", () => {
  assert.equal(typeof createQuestOfflineTemporaryBuildRoot, "function");
  const temporary = createQuestOfflineTemporaryBuildRoot();
  try {
    assert.equal(path.isAbsolute(temporary.outputDir), true);
    assert.equal(path.relative(realpathSync(os.tmpdir()), temporary.container).startsWith(".."), false);
    assert.equal(validateQuestOfflineTemporaryBuildRoot(temporary), temporary.outputDir);
    assert.throws(() => cleanupQuestOfflineTemporaryBuildRoot(realpathSync(os.tmpdir())));
    const markerPath = path.join(temporary.container, ".quest-offline-test-root.json");
    const marker = JSON.parse(readFileSync(markerPath, "utf8"));
    assert.deepEqual(Object.keys(marker), ["schemaVersion", "purpose", "rootRealpath", "device", "inode", "ownershipDigest"]);
    assert.equal(marker.rootRealpath, temporary.container);
    assert.equal(marker.device, lstatSync(temporary.container).dev);
    assert.equal(marker.inode, lstatSync(temporary.container).ino);
    assert.equal(lstatSync(markerPath).mode & 0o777, 0o600);
  } finally {
    cleanupQuestOfflineTemporaryBuildRoot(temporary);
  }
  assert.equal(existsSync(temporary.container), false);
  const config = readFileSync("playwright.quest.offline.config.js", "utf8");
  assert.match(config, /--temporary-build/u);
  assert.doesNotMatch(config, /QUEST_OFFLINE_DIST=dist-quest-offline/u);
  assert.match(config, /gracefulShutdown:\s*\{\s*signal:\s*"SIGTERM"/u);
});

test("temporary-root validation rejects forged, tampered, replaced, and swapped ownership", () => {
  const temporaryParent = realpathSync(os.tmpdir());
  const forgedContainer = realpathSync(mkdtempSync(path.join(temporaryParent, "literacy-path-quest-offline-")));
  const forgedOutput = path.join(forgedContainer, "dist");
  mkdirSync(forgedOutput);
  const forgedStat = lstatSync(forgedContainer);
  writeFileSync(path.join(forgedContainer, ".quest-offline-test-root.json"), `${JSON.stringify({
    schemaVersion: 1,
    purpose: "quest-offline-temporary-build-v1",
    rootRealpath: forgedContainer,
    device: forgedStat.dev,
    inode: forgedStat.ino,
    ownershipDigest: "a".repeat(64)
  })}\n`, { mode: 0o600 });
  try {
    assert.throws(() => validateQuestOfflineTemporaryBuildRoot(Object.freeze({
      container: forgedContainer,
      outputDir: forgedOutput
    })));
  } finally {
    rmSync(forgedContainer, { recursive: true, force: true });
  }

  for (const [label, mutate] of [
    ["marker contents", temporary => writeFileSync(
      path.join(temporary.container, ".quest-offline-test-root.json"),
      "{}\n"
    )],
    ["marker permissions", temporary => chmodSync(
      path.join(temporary.container, ".quest-offline-test-root.json"),
      0o644
    )],
    ["marker replacement", temporary => {
      const markerPath = path.join(temporary.container, ".quest-offline-test-root.json");
      const replacement = `${markerPath}.replacement`;
      writeFileSync(replacement, readFileSync(markerPath), { mode: 0o600 });
      renameSync(replacement, markerPath);
    }]
  ]) {
    const temporary = createQuestOfflineTemporaryBuildRoot();
    try {
      mutate(temporary);
      assert.throws(() => validateQuestOfflineTemporaryBuildRoot(temporary), undefined, label);
      assert.throws(() => cleanupQuestOfflineTemporaryBuildRoot(temporary), undefined, label);
    } finally {
      rmSync(temporary.container, { recursive: true, force: true });
    }
  }

  const swapped = createQuestOfflineTemporaryBuildRoot();
  const originalContainer = `${swapped.container}-original`;
  renameSync(swapped.container, originalContainer);
  symlinkSync(originalContainer, swapped.container, "dir");
  assert.throws(() => validateQuestOfflineTemporaryBuildRoot(swapped));
  assert.throws(() => cleanupQuestOfflineTemporaryBuildRoot(swapped));
  rmSync(swapped.container);
  mkdirSync(swapped.container);
  mkdirSync(swapped.outputDir);
  writeFileSync(
    path.join(swapped.container, ".quest-offline-test-root.json"),
    readFileSync(path.join(originalContainer, ".quest-offline-test-root.json")),
    { mode: 0o600 }
  );
  try {
    assert.throws(() => validateQuestOfflineTemporaryBuildRoot(swapped));
    assert.throws(() => cleanupQuestOfflineTemporaryBuildRoot(swapped));
  } finally {
    rmSync(swapped.container, { recursive: true, force: true });
    renameSync(originalContainer, swapped.container);
    cleanupQuestOfflineTemporaryBuildRoot(swapped);
  }
});

test("temporary cleanup quarantines atomically and preserves a replacement swapped after validation", () => {
  const temporary = createQuestOfflineTemporaryBuildRoot();
  const ownedBackup = `${temporary.container}-owned-backup`;
  let injected = false;
  try {
    assert.throws(() => cleanupQuestOfflineTemporaryBuildRoot(temporary, {
      beforeQuarantine: () => {
        injected = true;
        renameSync(temporary.container, ownedBackup);
        mkdirSync(temporary.container);
        writeFileSync(path.join(temporary.container, "unrelated.txt"), "must survive");
      }
    }));
    assert.equal(injected, true);
    assert.equal(readFileSync(path.join(temporary.container, "unrelated.txt"), "utf8"), "must survive");
    assert.equal(existsSync(ownedBackup), true);
  } finally {
    if (existsSync(temporary.container)) rmSync(temporary.container, { recursive: true, force: true });
    if (existsSync(ownedBackup)) rmSync(ownedBackup, { recursive: true, force: true });
  }
});

function lifecycleFixture({
  spawnFailure = false,
  buildNeverCloses = false,
  bindFailure = null,
  stalledListen = null,
  stalledClose = null,
  closeFailure = null,
  closeDelay = {}
} = {}) {
  const events = [];
  const processLike = new EventEmitter();
  const temporary = Object.freeze({ container: "/virtual/owned", outputDir: "/virtual/owned/dist" });
  class FakeChild extends EventEmitter {
    pid = 42_424;
    exitCode = null;
    signalCode = null;
    kill(signal) {
      events.push(`child-kill:${signal}`);
      queueMicrotask(() => {
        this.signalCode = signal;
        events.push("child-close");
        this.emit("close", null, signal);
      });
      return true;
    }
  }
  class FakeListener extends EventEmitter {
    constructor(name) {
      super();
      this.name = name;
      this.listening = false;
      this.listenTimer = null;
    }
    listen() {
      events.push(`${this.name}-listen`);
      const finish = () => {
        if (bindFailure === this.name) {
          events.push(`${this.name}-bind-error`);
          this.emit("error", new Error(`${this.name} bind failed`));
          return;
        }
        this.listening = true;
        events.push(`${this.name}-listening`);
        this.emit("listening");
      };
      if (stalledListen === this.name) this.listenTimer = setTimeout(finish, 40);
      else queueMicrotask(finish);
    }
    close(callback) {
      events.push(`${this.name}-close-start`);
      if (this.listenTimer) {
        clearTimeout(this.listenTimer);
        this.listenTimer = null;
      }
      const finish = () => {
        this.listening = false;
        events.push(`${this.name}-close-done`);
        this.emit("close");
        callback(closeFailure === this.name ? new Error(`${this.name} close failed`) : undefined);
      };
      const delay = stalledClose === this.name ? 40 : closeDelay[this.name] || 0;
      if (delay) setTimeout(finish, delay);
      else queueMicrotask(finish);
    }
  }
  const child = new FakeChild();
  const assetServer = new FakeListener("asset");
  const controlServer = new FakeListener("control");
  const dependencies = {
    processLike,
    createTemporaryBuildRoot: () => {
      events.push("temporary-create");
      return temporary;
    },
    validateTemporaryBuildRoot: value => {
      assert.equal(value, temporary);
      events.push("temporary-validate");
      return temporary.outputDir;
    },
    cleanupTemporaryBuildRoot: value => {
      assert.equal(value, temporary);
      events.push("temporary-cleanup");
    },
    killProcessGroup: () => {
      const error = new Error("test process group is absent");
      error.code = "ESRCH";
      throw error;
    },
    spawnProcess: (command, args, options) => {
      assert.equal(command, "npm");
      assert.ok(args.includes("build:quest-offline-test"));
      events.push("build-spawn");
      events.push(`build-detached:${String(options.detached)}`);
      assert.equal(processLike.listenerCount("SIGINT"), 1);
      assert.equal(processLike.listenerCount("SIGTERM"), 1);
      queueMicrotask(() => {
        if (spawnFailure) {
          events.push("build-spawn-error");
          child.emit("error", new Error("spawn failed"));
        } else if (!buildNeverCloses) {
          child.exitCode = 0;
          events.push("build-close");
          child.emit("close", 0, null);
        }
      });
      return child;
    },
    assertOfflineBuild: outputDir => {
      assert.equal(outputDir, temporary.outputDir);
      events.push("build-assert");
    },
    createRangeServer: () => assetServer,
    createControlServer: ({ assetServer: received }) => {
      assert.equal(received, assetServer);
      return controlServer;
    }
  };
  return { assetServer, child, controlServer, dependencies, events, processLike };
}

const lifecycleOptions = Object.freeze({
  temporaryBuild: true,
  host: "127.0.0.1",
  port: 5191,
  controlPort: 5193,
  buildTimeoutMs: 50,
  startupTimeoutMs: 50,
  shutdownTimeoutMs: 50,
  terminationTimeoutMs: 50
});

test("offline lifecycle installs signals before spawn and awaits child/listener shutdown before cleanup", async () => {
  assert.equal(typeof runQuestOfflineRangeServerLifecycle, "function");
  const fixture = lifecycleFixture();
  fixture.dependencies.onReady = () => fixture.processLike.emit("SIGTERM");
  await runQuestOfflineRangeServerLifecycle(lifecycleOptions, fixture.dependencies);
  assert.deepEqual(fixture.events.filter(event => event.includes("close-done") || event === "temporary-cleanup"), [
    "asset-close-done",
    "control-close-done",
    "temporary-cleanup"
  ]);
  assert.equal(fixture.processLike.listenerCount("SIGINT"), 0);
  assert.equal(fixture.processLike.listenerCount("SIGTERM"), 0);
});

test("offline lifecycle bounds a stuck build, terminates it, awaits it, and cleans once", async () => {
  const fixture = lifecycleFixture({ buildNeverCloses: true });
  await assert.rejects(
    () => runQuestOfflineRangeServerLifecycle(
      { ...lifecycleOptions, buildTimeoutMs: 5 },
      fixture.dependencies
    ),
    /build exceeded 5ms/u
  );
  assert.equal(fixture.events.filter(event => event === "temporary-cleanup").length, 1);
  assert.ok(fixture.events.indexOf("child-close") < fixture.events.indexOf("temporary-cleanup"));
  assert.deepEqual(fixture.events.filter(event => event.startsWith("child-kill")), ["child-kill:SIGTERM"]);
});

test("offline lifecycle cleans after spawn failure", async () => {
  const fixture = lifecycleFixture({ spawnFailure: true });
  await assert.rejects(
    () => runQuestOfflineRangeServerLifecycle(lifecycleOptions, fixture.dependencies),
    /spawn failed/u
  );
  assert.equal(fixture.events.filter(event => event === "temporary-cleanup").length, 1);
  assert.equal(fixture.processLike.listenerCount("SIGTERM"), 0);
});

test("offline lifecycle handles either port bind failure and awaits the peer listener", async () => {
  for (const failedListener of ["asset", "control"]) {
    const fixture = lifecycleFixture({ bindFailure: failedListener });
    await assert.rejects(
      () => runQuestOfflineRangeServerLifecycle(lifecycleOptions, fixture.dependencies),
      new RegExp(`${failedListener} bind failed`, "u")
    );
    assert.equal(fixture.assetServer.listening, false, failedListener);
    assert.equal(fixture.controlServer.listening, false, failedListener);
    assert.equal(fixture.events.filter(event => event === "temporary-cleanup").length, 1, failedListener);
    const peer = failedListener === "asset" ? "control" : "asset";
    assert.ok(fixture.events.indexOf(`${peer}-close-done`) < fixture.events.indexOf("temporary-cleanup"), failedListener);
  }
});

test("offline lifecycle bounds stalled listener startup", async () => {
  const fixture = lifecycleFixture({ stalledListen: "asset" });
  fixture.dependencies.onReady = () => fixture.processLike.emit("SIGTERM");
  await assert.rejects(
    () => runQuestOfflineRangeServerLifecycle(
      { ...lifecycleOptions, startupTimeoutMs: 5 },
      fixture.dependencies
    ),
    /listener startup exceeded 5ms/u
  );
  assert.ok(fixture.events.indexOf("control-close-done") < fixture.events.indexOf("temporary-cleanup"));
});

test("offline lifecycle races a signal during startup and cancels a pending listener", async () => {
  const fixture = lifecycleFixture({ stalledListen: "asset" });
  const originalListen = fixture.controlServer.listen.bind(fixture.controlServer);
  fixture.controlServer.listen = options => {
    originalListen(options);
    queueMicrotask(() => fixture.processLike.emit("SIGTERM"));
  };
  await runQuestOfflineRangeServerLifecycle(lifecycleOptions, fixture.dependencies);
  assert.equal(fixture.events.includes("asset-listening"), false);
  assert.ok(fixture.events.indexOf("asset-close-start") < fixture.events.indexOf("temporary-cleanup"));
});

test("offline lifecycle bounds stalled shutdown while still settling the peer close", async () => {
  const fixture = lifecycleFixture({ stalledClose: "asset" });
  fixture.dependencies.onReady = () => fixture.processLike.emit("SIGTERM");
  await assert.rejects(
    () => runQuestOfflineRangeServerLifecycle(
      { ...lifecycleOptions, shutdownTimeoutMs: 5 },
      fixture.dependencies
    ),
    /listener shutdown exceeded 5ms/u
  );
  assert.ok(fixture.events.indexOf("control-close-done") < fixture.events.indexOf("temporary-cleanup"));
});

test("offline lifecycle waits for both closes when one listener reports an error", async () => {
  const fixture = lifecycleFixture({ closeFailure: "asset", closeDelay: { control: 5 } });
  fixture.dependencies.onReady = () => fixture.processLike.emit("SIGTERM");
  await assert.rejects(
    () => runQuestOfflineRangeServerLifecycle(lifecycleOptions, fixture.dependencies),
    /asset close failed/u
  );
  assert.notEqual(fixture.events.indexOf("control-close-done"), -1);
  assert.ok(fixture.events.indexOf("control-close-done") < fixture.events.indexOf("temporary-cleanup"));
});

test("offline lifecycle routes post-listen errors through shared shutdown", async () => {
  const fixture = lifecycleFixture();
  fixture.assetServer.on("error", error => fixture.events.push(`observed:${error.message}`));
  fixture.dependencies.onReady = () => {
    setTimeout(() => fixture.processLike.emit("SIGTERM"), 20);
    queueMicrotask(() => fixture.assetServer.emit("error", new Error("asset runtime exploded")));
  };
  await assert.rejects(
    () => runQuestOfflineRangeServerLifecycle(lifecycleOptions, fixture.dependencies),
    /asset runtime exploded/u
  );
  assert.ok(fixture.events.indexOf("asset-close-done") < fixture.events.indexOf("temporary-cleanup"));
  assert.ok(fixture.events.indexOf("control-close-done") < fixture.events.indexOf("temporary-cleanup"));
});

test("offline lifecycle terminates the detached build process group including descendants", async () => {
  const fixture = lifecycleFixture({ buildNeverCloses: true });
  fixture.dependencies.killProcessGroup = (pid, signal) => {
    fixture.events.push(`group-kill:${pid}:${signal}`);
    queueMicrotask(() => {
      fixture.events.push("descendant-close");
      fixture.child.signalCode = signal;
      fixture.child.emit("close", null, signal);
    });
  };
  await assert.rejects(
    () => runQuestOfflineRangeServerLifecycle(
      { ...lifecycleOptions, buildTimeoutMs: 5 },
      fixture.dependencies
    ),
    /build exceeded 5ms/u
  );
  assert.deepEqual(fixture.events.filter(event => event.startsWith("group-kill")), [
    "group-kill:42424:SIGTERM"
  ]);
  assert.equal(fixture.events.includes("build-detached:true"), true);
  assert.equal(fixture.events.some(event => event.startsWith("child-kill")), false);
  assert.ok(fixture.events.indexOf("descendant-close") < fixture.events.indexOf("temporary-cleanup"));
});

test("the offline range server rejects symlink components and unauthenticated shutdown", async () => {
  const root = realpathSync(mkdtempSync(path.join(os.tmpdir(), "ssv2-range-server-")));
  const previousToken = process.env.QUEST_OFFLINE_SHUTDOWN_TOKEN;
  process.env.QUEST_OFFLINE_SHUTDOWN_TOKEN = "a".repeat(64);
  let server = null;
  try {
    const actual = path.join(root, "actual");
    mkdirSync(actual);
    writeFileSync(path.join(actual, "asset.txt"), "not reachable through a symlink");
    symlinkSync(actual, path.join(root, "linked"), "dir");
    server = createQuestOfflineRangeServer({ root });
    server.listen({ host: "127.0.0.1", port: 0, exclusive: true });
    await once(server, "listening");
    const { port } = server.address();
    const base = `http://127.0.0.1:${port}`;
    assert.equal((await fetch(`${base}/linked/asset.txt`)).status, 404);
    assert.equal((await fetch(`${base}/.quest-offline-test/shutdown`, { method: "POST" })).status, 404);
    assert.equal((await fetch(`${base}/.quest-offline-test/shutdown`, {
      method: "POST", headers: { "X-Quest-Offline-Shutdown-Token": "b".repeat(64) }
    })).status, 404);
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    server = null;
  } finally {
    if (server?.listening) await new Promise(resolve => server.close(() => resolve()));
    if (previousToken === undefined) delete process.env.QUEST_OFFLINE_SHUTDOWN_TOKEN;
    else process.env.QUEST_OFFLINE_SHUTDOWN_TOKEN = previousToken;
    rmSync(root, { recursive: true, force: true });
  }
});

test("the offline range listener stays closed until an explicit authenticated restart", async () => {
  const root = realpathSync(mkdtempSync(path.join(os.tmpdir(), "ssv2-range-lifecycle-")));
  const previousToken = process.env.QUEST_OFFLINE_SHUTDOWN_TOKEN;
  process.env.QUEST_OFFLINE_SHUTDOWN_TOKEN = "c".repeat(64);
  let server = null;
  let controlServer = null;
  try {
    writeFileSync(path.join(root, "index.html"), "listener lifecycle");
    server = createQuestOfflineRangeServer({ root });
    server.listen({ host: "127.0.0.1", port: 0, exclusive: true });
    await once(server, "listening");
    const { port } = server.address();
    const base = `http://127.0.0.1:${port}`;
    controlServer = createQuestOfflineControlServer({ assetServer: server });
    controlServer.listen({ host: "127.0.0.1", port: 0, exclusive: true });
    await once(controlServer, "listening");
    const controlBase = `http://127.0.0.1:${controlServer.address().port}`;
    assert.equal((await fetch(base)).status, 200);
    assert.equal((await fetch(`${controlBase}/.quest-offline-test/restart`, { method: "POST" })).status, 404);
    assert.equal((await fetch(`${controlBase}/.quest-offline-test/restart`, {
      method: "POST", headers: { "X-Quest-Offline-Shutdown-Token": "d".repeat(64) }
    })).status, 404);
    const closed = once(server, "close");
    assert.equal((await fetch(`${base}/.quest-offline-test/shutdown`, {
      method: "POST", headers: { "X-Quest-Offline-Shutdown-Token": "c".repeat(64) }
    })).status, 202);
    await closed;
    await new Promise(resolve => setTimeout(resolve, 3_250));
    assert.equal(server.listening, false);
    await assert.rejects(() => fetch(base));
    const restart = await fetch(`${controlBase}/.quest-offline-test/restart`, {
      method: "POST", headers: { "X-Quest-Offline-Shutdown-Token": "c".repeat(64) }
    });
    assert.equal(restart.status, 202);
    assert.equal((await fetch(base)).status, 200);
  } finally {
    if (controlServer?.listening) await new Promise(resolve => controlServer.close(() => resolve()));
    if (server?.listening) await new Promise(resolve => server.close(() => resolve()));
    if (previousToken === undefined) delete process.env.QUEST_OFFLINE_SHUTDOWN_TOKEN;
    else process.env.QUEST_OFFLINE_SHUTDOWN_TOKEN = previousToken;
    rmSync(root, { recursive: true, force: true });
  }
});

test("offline executable checks are transition-safe and never accept a mixed legacy/v2 shell", () => {
  assert.deepEqual(selectQuestExecutablePolicy([
    "/assets/QuestRoot-old.js", "/assets/QuestPixelWorld-old.js", "/assets/shared.js"
  ], {
    mode: "legacy",
    roots: ["/assets/QuestRoot-old.js", "/assets/QuestPixelWorld-old.js"],
    graph: [
      { url: "/assets/QuestRoot-old.js", imports: ["/assets/shared.js"] },
      { url: "/assets/QuestPixelWorld-old.js", imports: ["/assets/shared.js"] },
      { url: "/assets/shared.js", imports: [] }
    ]
  }), { mode: "legacy", roots: ["/assets/QuestRoot-old.js", "/assets/QuestPixelWorld-old.js"], closure: [
    "/assets/QuestPixelWorld-old.js", "/assets/QuestRoot-old.js", "/assets/shared.js"
  ] });
  assert.deepEqual(selectQuestExecutablePolicy([
    "/assets/SoundSeekersRoute-new.js", "/assets/Game-new.js", "/assets/Stage-new.js"
  ], {
    mode: "v2",
    roots: ["/assets/SoundSeekersRoute-new.js"],
    graph: [
      { url: "/assets/SoundSeekersRoute-new.js", imports: ["/assets/Game-new.js"] },
      { url: "/assets/Game-new.js", imports: ["/assets/Stage-new.js"] },
      { url: "/assets/Stage-new.js", imports: [] }
    ]
  }), { mode: "v2", roots: ["/assets/SoundSeekersRoute-new.js"], closure: [
    "/assets/Game-new.js", "/assets/SoundSeekersRoute-new.js", "/assets/Stage-new.js"
  ] });
  assert.throws(() => selectQuestExecutablePolicy([
    "/assets/SoundSeekersRoute-new.js", "/assets/Game-new.js",
    "/assets/QuestRoot-old.js", "/assets/QuestPixelWorld-old.js"
  ], {
    mode: "v2", roots: ["/assets/SoundSeekersRoute-new.js"],
    graph: [{ url: "/assets/SoundSeekersRoute-new.js", imports: ["/assets/Game-new.js"] }, { url: "/assets/Game-new.js", imports: [] }]
  }));
  assert.throws(() => selectQuestExecutablePolicy(["/assets/SoundSeekersRoute-new.js"], {
    mode: "v2", roots: ["/assets/SoundSeekersRoute-new.js"],
    graph: [{ url: "/assets/SoundSeekersRoute-new.js", imports: ["/assets/missing.js"] }]
  }));
  assert.throws(() => selectQuestExecutablePolicy([
    "/assets/QuestRoot-old.js", "/assets/QuestPixelWorld-old.js", "/assets/shared.js"
  ], {
    mode: "legacy",
    roots: ["/assets/QuestPixelWorld-old.js"],
    graph: [
      { url: "/assets/QuestPixelWorld-old.js", imports: ["/assets/shared.js"] },
      { url: "/assets/shared.js", imports: [] }
    ]
  }));
  assert.throws(() => selectQuestExecutablePolicy([
    "/assets/SoundSeekersRoute-a.js", "/assets/SoundSeekersRoute-b.js", "/assets/shared.js"
  ], {
    mode: "v2",
    roots: ["/assets/SoundSeekersRoute-a.js"],
    graph: [
      { url: "/assets/SoundSeekersRoute-a.js", imports: ["/assets/shared.js"] },
      { url: "/assets/shared.js", imports: [] }
    ]
  }));
  assert.throws(() => selectQuestExecutablePolicy([
    "/assets/QuestRoot-a.js", "/assets/QuestRoot-b.js", "/assets/QuestPixelWorld-a.js"
  ], {
    mode: "legacy",
    roots: ["/assets/QuestRoot-a.js", "/assets/QuestRoot-b.js", "/assets/QuestPixelWorld-a.js"],
    graph: [
      { url: "/assets/QuestRoot-a.js", imports: [] },
      { url: "/assets/QuestRoot-b.js", imports: [] },
      { url: "/assets/QuestPixelWorld-a.js", imports: [] }
    ]
  }));
});

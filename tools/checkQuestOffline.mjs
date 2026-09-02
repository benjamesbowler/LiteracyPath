import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function selectQuestExecutablePolicy(precache, executable) {
  if (!Array.isArray(precache)) throw new TypeError("offline precache is required");
  const legacyRoutes = precache.filter(url => /\/QuestRoot-[\w-]+\.js$/u.test(url));
  const legacyRuntimes = precache.filter(url => /\/QuestPixelWorld-[\w-]+\.js$/u.test(url));
  const v2Routes = precache.filter(url => /\/SoundSeekersRoute-[\w-]+\.js$/u.test(url));
  if (!executable || !["legacy", "v2"].includes(executable.mode)
    || !Array.isArray(executable.roots) || !Array.isArray(executable.graph)) {
    throw new Error("offline executable graph is missing or malformed");
  }
  if (new Set(executable.roots).size !== executable.roots.length
    || new Set(executable.graph.map(record => record?.url)).size !== executable.graph.length) {
    throw new Error("offline executable graph contains duplicate identities");
  }
  const graph = new Map(executable.graph.map(record => {
    if (!record || Object.keys(record).join(",") !== "url,imports" || typeof record.url !== "string"
      || !Array.isArray(record.imports) || record.imports.some(value => typeof value !== "string")) {
      throw new Error("offline executable graph record is malformed");
    }
    return [record.url, record.imports];
  }));
  const closure = new Set();
  const visit = url => {
    if (closure.has(url)) return;
    if (!precache.includes(url) || !graph.has(url)) throw new Error(`offline executable closure is missing ${url}`);
    closure.add(url);
    for (const imported of graph.get(url)) visit(imported);
  };
  for (const root of executable.roots) visit(root);
  if (closure.size !== graph.size) throw new Error("offline executable graph contains an unreachable chunk");
  if (executable.mode === "v2") {
    if (!v2Routes.length
      || [...v2Routes].sort().join("\n") !== [...executable.roots].sort().join("\n")) {
      throw new Error("v2 offline executable graph is not rooted at SoundSeekersRoute");
    }
    if (legacyRoutes.length || legacyRuntimes.length) throw new Error("v2 offline shell contains legacy QuestRoot/QuestPixelWorld chunks");
  } else {
    const expectedRoots = [...legacyRoutes, ...legacyRuntimes].sort();
    if (!legacyRoutes.length || !legacyRuntimes.length
      || expectedRoots.join("\n") !== [...executable.roots].sort().join("\n")) {
      throw new Error("legacy offline executable graph is incomplete");
    }
  }
  return { mode: executable.mode, roots: [...executable.roots], closure: [...closure].sort() };
}

export function assertQuestOfflineBuild({ outputDir = path.resolve(process.env.QUEST_OFFLINE_DIST || "dist") } = {}) {
const failures = [];

function fail(message) {
  failures.push(message);
}

function readJson(fileName) {
  const filePath = path.join(outputDir, fileName);
  if (!fs.existsSync(filePath)) {
    fail(`${fileName} was not emitted`);
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    fail(`${fileName} is not valid JSON: ${error.message}`);
    return {};
  }
}

function readText(fileName) {
  const filePath = path.join(outputDir, fileName);
  if (!fs.existsSync(filePath)) {
    fail(`${fileName} was not emitted`);
    return "";
  }
  return fs.readFileSync(filePath, "utf8");
}

const build = readJson("offline-build.json");
const manifest = readJson("manifest.webmanifest");
const worker = readText("sw.js");
const indexHtml = readText("index.html");
const precache = Array.isArray(build.precache) ? build.precache : [];
const evidenceEntryExists = fs.existsSync(path.join(outputDir, "preview/quest-evidence.html"));

if (!/^[a-f0-9]{16}$/.test(build.buildId || "")) fail("offline build id must be a 16-character content fingerprint");
if (build.executablePolicy !== "build-versioned") fail("executable cache policy is not build-versioned");
if (build.questMediaPolicy !== "cache-while-revalidate") fail("quest media cache policy changed");
if (build.updatePolicy !== "activate-after-existing-clients-close") fail("worker update policy can mix executable builds");
if (!precache.length) fail("offline shell precache is empty");
if (new Set(precache).size !== precache.length) fail("offline shell precache contains duplicate URLs");
if (precache.join("\n") !== [...precache].sort().join("\n")) fail("offline shell precache is not deterministic");

for (const required of ["/index.html", "/manifest.webmanifest", "/favicon.svg", "/icons.svg"]) {
  if (!precache.includes(required)) fail(`${required} is missing from the offline shell`);
}
let executablePolicy = null;
try {
  executablePolicy = selectQuestExecutablePolicy(precache, build.questExecutable);
} catch (error) {
  fail(error.message);
}
if (!precache.some(url => url.endsWith(".css"))) fail("compiled styles are missing from the offline shell");
if (evidenceEntryExists) {
  if (!precache.includes("/preview/quest-evidence.html")) fail("field-console navigation is missing from the offline shell");
  if (!precache.some(url => /\/questEvidence-[\w-]+\.js$/.test(url))) fail("field-console executable is missing from the offline shell");
  if (!precache.some(url => /\/questEvidence-[\w-]+\.css$/.test(url))) fail("field-console styles are missing from the offline shell");
}
if (precache.some(url => url.startsWith("/game-assets/") || url.startsWith("/audio/"))) {
  fail("quest media leaked into the build-versioned executable cache");
}
if (!worker.includes('"/game-assets/sound-seekers/v2/"') || !worker.includes('"/audio/quest-v2/"')) {
  fail("Sound Seekers v2 media prefixes are missing from the warmable media policy");
}
if (precache.some(url => /sound-seekers-v2-content|ContentArtGallery|galleryReplayRecipes/u.test(url))
  || fs.existsSync(path.join(outputDir, "preview/sound-seekers-v2-content.html"))) {
  fail("dev-only Sound Seekers content gallery leaked into the offline build or precache");
}

for (const url of precache) {
  const filePath = path.join(outputDir, url.replace(/^\//, ""));
  if (!fs.existsSync(filePath)) fail(`precache URL does not exist in the build: ${url}`);
}

const workerRequirements = [
  [new RegExp(`const BUILD_ID = ["']${build.buildId || "missing"}["']`), "worker build id does not match offline-build.json"],
  [/const SHELL_PREFIX = "lp-shell-"/, "versioned shell cache is missing"],
  [/const QUEST_MEDIA_CACHE = "lp-quest-media-v1"/, "persistent quest media cache is missing"],
  [/name\.startsWith\(SHELL_PREFIX\) && name !== SHELL_CACHE/, "old executable caches are not removed on activation"],
  [/self\.clients\.claim\(\)/, "new worker does not claim clients after safe activation"],
  [/request\.mode === "navigate"/, "offline navigation fallback is missing"],
  [/LP_WARM_QUEST_ASSETS/, "active chapter cache warm-up is missing"],
  [/LP_QUEST_WARM_COMPLETE/, "chapter cache completion evidence is missing"],
  [/LP_OFFLINE_SHELL_READY/, "offline shell readiness evidence is missing"],
  [/LP_OFFLINE_UPDATE_STATUS/, "waiting update status protocol is missing"],
  [/LP_OFFLINE_UPDATE_READY/, "waiting update identity evidence is missing"]
];
for (const [pattern, message] of workerRequirements) {
  if (!pattern.test(worker)) fail(message);
}
const skipWaitingCalls = [...worker.matchAll(/self\.skipWaiting\s*\(/gu)];
if (skipWaitingCalls.length > 1 || (skipWaitingCalls.length === 1
  && !/if \(data\.type === "LP_ACTIVATE_UPDATE"\) \{[\s\S]{0,180}self\.skipWaiting\s*\(\)/u.test(worker))) {
  fail("worker forces activation outside the explicit recovery protocol and can mix executable builds");
}
if (Buffer.byteLength(worker) > 16_000) fail("generated service worker exceeds the 16 KB release budget");

const shellRuntimePath = path.resolve("src/utils/offlineShell.js");
const shellRuntime = fs.existsSync(shellRuntimePath) ? fs.readFileSync(shellRuntimePath, "utf8") : "";
for (const [pattern, message] of [
  [/OFFLINE_BUILD_KEY/, "active offline build identity is not persisted across tabs"],
  [/previousBuildId && previousBuildId !== data\.buildId/, "applied updates are not distinguished from ordinary starts"],
  [/recordOfflineState\("update-applied"|\? "update-applied"/, "safe update activation evidence is missing"],
  [/LP_OFFLINE_UPDATE_STATUS/, "the browser does not request waiting worker identity"]
]) {
  if (!pattern.test(shellRuntime)) fail(message);
}

if (manifest.display !== "fullscreen") fail("web app manifest does not launch in fullscreen mode");
if (!Array.isArray(manifest.display_override) || !manifest.display_override.includes("standalone")) {
  fail("web app manifest has no standalone fallback");
}
if (manifest.start_url !== "/" || manifest.scope !== "/") fail("web app manifest start URL or scope changed");
if (!Array.isArray(manifest.icons) || !manifest.icons.length) fail("web app manifest has no icon");
if (!/<link\s+rel="manifest"\s+href="\/manifest\.webmanifest"\s*\/?\s*>/.test(indexHtml)) {
  fail("built app does not link its web app manifest");
}

for (const url of precache.filter(value => /\.(?:js|css|html)$/u.test(value))) {
  const source = fs.readFileSync(path.join(outputDir, url.replace(/^\//u, "")), "utf8");
  if (/sound-seekers-v2-content|ContentArtGallery|galleryReplayRecipes|data-gallery-root/u.test(source)) {
    fail(`${url} contains the dev-only Sound Seekers content gallery`);
  }
}

if (failures.length) {
  throw new Error(`Sound Seekers offline release check failed:\n${failures.map(message => `- ${message}`).join("\n")}`);
}

console.log(`Sound Seekers offline release check passed (${build.buildId}, ${precache.length} shell files, ${Buffer.byteLength(worker)} byte worker).`);
return { buildId: build.buildId, precacheCount: precache.length, workerBytes: Buffer.byteLength(worker), executablePolicy };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    assertQuestOfflineBuild();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

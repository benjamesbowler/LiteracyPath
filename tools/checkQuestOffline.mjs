import fs from "node:fs";
import path from "node:path";

const outputDir = path.resolve(process.env.QUEST_OFFLINE_DIST || "dist");
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
if (!precache.some(url => /\/QuestRoot-[\w-]+\.js$/.test(url))) fail("QuestRoot executable is missing from the offline shell");
if (!precache.some(url => /\/QuestPixelWorld-[\w-]+\.js$/.test(url))) fail("QuestPixelWorld executable is missing from the offline shell");
if (!precache.some(url => url.endsWith(".css"))) fail("compiled styles are missing from the offline shell");
if (evidenceEntryExists) {
  if (!precache.includes("/preview/quest-evidence.html")) fail("field-console navigation is missing from the offline shell");
  if (!precache.some(url => /\/questEvidence-[\w-]+\.js$/.test(url))) fail("field-console executable is missing from the offline shell");
  if (!precache.some(url => /\/questEvidence-[\w-]+\.css$/.test(url))) fail("field-console styles are missing from the offline shell");
}
if (precache.some(url => url.startsWith("/game-assets/") || url.startsWith("/audio/"))) {
  fail("quest media leaked into the build-versioned executable cache");
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
if (/skipWaiting\s*\(/.test(worker)) fail("worker forces activation and can mix old runtime code with new chunks");
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

if (manifest.display !== "standalone") fail("web app manifest is not installable in standalone mode");
if (manifest.start_url !== "/" || manifest.scope !== "/") fail("web app manifest start URL or scope changed");
if (!Array.isArray(manifest.icons) || !manifest.icons.length) fail("web app manifest has no icon");
if (!/<link\s+rel="manifest"\s+href="\/manifest\.webmanifest"\s*\/?\s*>/.test(indexHtml)) {
  fail("built app does not link its web app manifest");
}

if (failures.length) {
  console.error("Sound Seekers offline release check failed:\n");
  for (const message of failures) console.error(`- ${message}`);
  process.exit(1);
}

console.log(`Sound Seekers offline release check passed (${build.buildId}, ${precache.length} shell files, ${Buffer.byteLength(worker)} byte worker).`);

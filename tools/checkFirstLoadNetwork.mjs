import { chromium } from "playwright";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(repoRoot, "dist");
const analysisPath = path.join(distDir, "bundle-analysis.json");
const artifactDir = path.join(repoRoot, ".artifacts", "audits");
const shellBudgets = Object.freeze({
  requests: 70,
  javascriptRequests: 45,
  javascriptBytes: 2_500_000,
  totalBytes: 6_000_000
});
const mimeTypes = Object.freeze({
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mp3": "audio/mpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".woff2": "font/woff2"
});
const forbiddenModuleFragments = Object.freeze([
  "/src/data/generated/runtimeShards/",
  "/src/data/generated/languageSkillQuestions.generated.js",
  "/src/data/generated/skillLevelGapQuestions.generated.js",
  "/src/data/generated/rhyming.generated.js",
  "/src/data/generated/hfwAssessmentQuestions.generated.js",
  "/src/data/generated/hfwLevel2Questions.generated.js",
  "/src/data/loadAssessmentSkillBank.js",
  "/src/data/guidedReading",
  "/src/data/firstFacts",
  "/src/data/moonwood",
  "/src/appState/elBenchmarkEngine.js",
  "/src/data/elBenchmarkAssessmentCatalog.js",
  "/src/data/elBenchmarkAssessments.js",
  "/src/data/elBenchmarkParallelFormContent.js",
  "/src/data/elBenchmarkSession.js",
  "/src/utils/elBenchmarkAssessmentScoring.js",
  "/node_modules/phaser/",
  "/node_modules/framer-motion/",
  "/node_modules/motion-dom/",
  "/node_modules/motion-utils/",
  "/node_modules/three/",
  "/node_modules/xlsx/",
  "/node_modules/exceljs/",
  "/src/features/soundkeys/SoundKeysApp.jsx",
  "/src/features/soundkeys/content.js",
  "/src/data/childAssets.js",
  "/src/data/audioPreferenceManifest.js"
]);

function safeBuiltPath(requestUrl) {
  const pathname = decodeURIComponent(new URL(requestUrl, "http://127.0.0.1").pathname);
  const relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const candidate = path.resolve(distDir, relative);
  if (!candidate.startsWith(`${distDir}${path.sep}`) && candidate !== distDir) return null;
  if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  return path.join(distDir, "index.html");
}

function startServer() {
  const server = http.createServer((request, response) => {
    const filePath = safeBuiltPath(request.url || "/");
    if (!filePath || !fs.existsSync(filePath)) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }
    const extension = path.extname(filePath).toLowerCase();
    response.writeHead(200, {
      "Cache-Control": "no-store",
      "Content-Type": mimeTypes[extension] || "application/octet-stream"
    });
    fs.createReadStream(filePath).pipe(response);
  });
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolve({
        origin: `http://127.0.0.1:${address.port}`,
        close: () => new Promise(closeResolve => server.close(closeResolve))
      });
    });
  });
}

function forbiddenChunkFiles(analysis) {
  return new Set(analysis.chunks
    .filter(chunk => chunk.modules.some(module => {
      const id = module.id.replaceAll("\\", "/");
      return forbiddenModuleFragments.some(fragment => id.includes(fragment));
    }))
    .map(chunk => path.basename(chunk.fileName)));
}

function soundKeysEntryFiles(analysis) {
  return new Set(analysis.chunks
    .filter(chunk => chunk.modules.some(module =>
      module.id.replaceAll("\\", "/").includes("/src/features/soundkeys/SoundKeysApp.jsx")
    ))
    .map(chunk => path.basename(chunk.fileName)));
}

async function captureShell(browser, origin, surface) {
  const context = await browser.newContext({ serviceWorkers: "block" });
  const page = await context.newPage();
  const requests = [];
  page.on("response", response => {
    const url = new URL(response.url());
    if (url.origin !== origin) return;
    requests.push({
      bytes: (() => {
        const builtPath = safeBuiltPath(url.pathname);
        return builtPath && fs.existsSync(builtPath) ? fs.statSync(builtPath).size : 0;
      })(),
      path: url.pathname,
      status: response.status(),
      type: response.request().resourceType()
    });
  });
  await page.goto(origin, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Choose your space" }).waitFor();
  if (surface === "student") {
    await page.getByRole("button", { name: "Children: Little Literacy Guides" }).click();
    await page.getByRole("heading", { name: "Enter your class code" }).waitFor();
  } else {
    await page.getByRole("button", { name: "Teachers: Literacy Guide Teacher Tools" }).click();
    await page.getByRole("heading", { name: "Teacher sign-in" }).waitFor();
  }
  await page.waitForTimeout(250);
  await context.close();
  return requests;
}

async function captureSoundKeys(browser, origin) {
  const context = await browser.newContext({ serviceWorkers: "block" });
  const page = await context.newPage();
  const requests = [];
  page.on("response", response => {
    const url = new URL(response.url());
    if (url.origin !== origin) return;
    requests.push({
      bytes: (() => {
        const builtPath = safeBuiltPath(url.pathname);
        return builtPath && fs.existsSync(builtPath) ? fs.statSync(builtPath).size : 0;
      })(),
      path: url.pathname,
      status: response.status(),
      type: response.request().resourceType()
    });
  });
  await page.goto(`${origin}/soundkeys`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Connect MIDI", exact: true }).waitFor();
  await page.waitForTimeout(250);
  await context.close();
  return requests;
}

async function verifyOfflineStartup(browser, origin, forbiddenFiles) {
  const build = JSON.parse(fs.readFileSync(path.join(distDir, "offline-build.json"), "utf8"));
  const context = await browser.newContext({ serviceWorkers: "allow" });
  const page = await context.newPage();
  const failures = [];
  try {
    await page.goto(origin);
    await page.getByRole("heading", { name: "Choose your space" }).waitFor();
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.waitForFunction(() => navigator.serviceWorker.controller);
    const readCache = () => page.evaluate(async buildId => {
      const cache = await caches.open(`lp-shell-${buildId}`);
      return (await cache.keys()).map(request => new URL(request.url).pathname);
    }, build.buildId);
    const installed = await readCache();
    for (const url of build.precache) {
      if (!installed.includes(url)) failures.push(`offline installation missed ${url}`);
    }
    for (const url of installed) {
      if (forbiddenFiles.has(path.basename(url))) failures.push(`offline install eagerly downloaded ${url}`);
    }
    if (build.questExecutable.cachePolicy !== "on-demand") failures.push("production Quest code is not deferred until a visit");
    for (const url of build.questExecutable.roots) {
      if (installed.includes(url)) failures.push(`offline installation eagerly downloaded Quest: ${url}`);
    }

    // The first installation must still support sign-in after losing Wi-Fi.
    await context.setOffline(true);
    await page.reload();
    await page.getByRole("button", { name: "Children: Little Literacy Guides" }).click();
    await page.getByRole("heading", { name: "Enter your class code" }).waitFor();
    await context.setOffline(false);

    // Exercise the real worker protocol, then prove the deferred executable
    // graph imports with the network unavailable. Media readiness is separate.
    const warm = await page.evaluate(() => new Promise((resolve, reject) => {
      const timer = setTimeout(() => { navigator.serviceWorker.removeEventListener("message", receive); reject(new Error("Quest executable warmup timed out")); }, 30_000);
      function receive(event) {
        if (event.data?.type !== "LP_QUEST_EXECUTABLE_READY") return;
        clearTimeout(timer);
        navigator.serviceWorker.removeEventListener("message", receive);
        resolve(event.data);
      }
      navigator.serviceWorker.addEventListener("message", receive);
      navigator.serviceWorker.controller.postMessage({ type: "LP_WARM_QUEST_EXECUTABLE" });
    }));
    if (warm.failed || warm.buildId !== build.buildId) failures.push("Quest warmup did not preserve the complete current executable pack");
    const warmed = await readCache();
    for (const url of build.questExecutable.assets) {
      if (!warmed.includes(url)) failures.push(`Quest warmup missed ${url}`);
    }
    await context.setOffline(true);
    for (const url of build.questExecutable.roots) await page.evaluate(url => import(url), url);
    return {
      failures,
      precacheFiles: build.precache.length,
      precacheBytes: build.precache.reduce((total, url) => total + fs.statSync(path.join(distDir, url)).size, 0),
      questFilesWarmedOnDemand: build.questExecutable.assets.length,
      offlineSignIn: true,
      offlineQuestImport: true
    };
  } finally {
    await context.close();
  }
}

if (!fs.existsSync(analysisPath)) {
  console.error("First-load network check needs an analysed production build.");
  process.exit(1);
}

const analysis = JSON.parse(fs.readFileSync(analysisPath, "utf8"));
const forbiddenFiles = forbiddenChunkFiles(analysis);
const soundKeysFiles = soundKeysEntryFiles(analysis);
const server = await startServer();
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const student = await captureShell(browser, server.origin, "student");
  const teacher = await captureShell(browser, server.origin, "teacher");
  const soundkeys = await captureSoundKeys(browser, server.origin);
  const offline = await verifyOfflineStartup(browser, server.origin, forbiddenFiles);
  const failures = [...offline.failures];
  for (const [surface, requests] of Object.entries({ student, teacher })) {
    const badRequests = requests.filter(request =>
      forbiddenFiles.has(path.basename(request.path))
    );
    if (badRequests.length) {
      failures.push(
        `${surface} shell loaded deferred chunks: ${badRequests.map(item => item.path).join(", ")}`
      );
    }
    const failedRequests = requests.filter(request => request.status >= 400);
    if (failedRequests.length) {
      failures.push(
        `${surface} shell returned HTTP failures: ${failedRequests
          .map(item => `${item.status} ${item.path}`)
          .join(", ")}`
      );
    }
    const javascriptRequests = requests.filter(request => request.path.endsWith(".js"));
    const javascriptBytes = javascriptRequests.reduce((total, request) => total + request.bytes, 0);
    const totalBytes = requests.reduce((total, request) => total + request.bytes, 0);
    if (requests.length > shellBudgets.requests) {
      failures.push(`${surface} shell made ${requests.length} requests; budget is ${shellBudgets.requests}`);
    }
    if (javascriptRequests.length > shellBudgets.javascriptRequests) {
      failures.push(
        `${surface} shell loaded ${javascriptRequests.length} JavaScript files; budget is ${shellBudgets.javascriptRequests}`
      );
    }
    if (javascriptBytes > shellBudgets.javascriptBytes) {
      failures.push(
        `${surface} shell loaded ${javascriptBytes} raw JavaScript bytes; budget is ${shellBudgets.javascriptBytes}`
      );
    }
    if (totalBytes > shellBudgets.totalBytes) {
      failures.push(`${surface} shell loaded ${totalBytes} raw bytes; budget is ${shellBudgets.totalBytes}`);
    }
  }
  const soundKeysLoadedFiles = soundkeys
    .map(request => path.basename(request.path))
    .filter(file => soundKeysFiles.has(file));
  if (soundKeysFiles.size === 0) {
    failures.push("SoundKeys is absent from the built production chunk graph");
  } else if (soundKeysLoadedFiles.length === 0) {
    failures.push("/soundkeys did not request its built SoundKeys entry chunk");
  }
  const soundKeysFailures = soundkeys.filter(request => request.status >= 400);
  if (soundKeysFailures.length) {
    failures.push(`/soundkeys returned HTTP failures: ${soundKeysFailures
      .map(item => `${item.status} ${item.path}`)
      .join(", ")}`);
  }

  const generatedAt = new Date().toISOString();
  const payload = {
    schemaVersion: 1,
    generatedAt,
    result: failures.length ? "FAIL" : "PASS",
    budgets: shellBudgets,
    forbiddenDeferredChunkCount: forbiddenFiles.size,
    failures,
    offline,
    surfaces: { student, teacher, soundkeys }
  };
  fs.mkdirSync(artifactDir, { recursive: true });
  fs.writeFileSync(
    path.join(artifactDir, "first-load-network.json"),
    `${JSON.stringify(payload, null, 2)}\n`
  );

  const summary = [
    "# First-load production network",
    "",
    `Generated: ${generatedAt}`,
    "",
    "| Surface | Requests | JavaScript | JS raw | Total raw | Deferred bank/route violations | HTTP failures |",
    "|---|---:|---:|---:|---:|---:|---:|",
    ...Object.entries({ student, teacher, soundkeys }).map(([surface, requests]) => {
      const javascript = requests.filter(request => request.path.endsWith(".js")).length;
      const javascriptBytes = requests
        .filter(request => request.path.endsWith(".js"))
        .reduce((total, request) => total + request.bytes, 0);
      const totalBytes = requests.reduce((total, request) => total + request.bytes, 0);
      const deferred = surface === "soundkeys"
        ? 0
        : requests.filter(request => forbiddenFiles.has(path.basename(request.path))).length;
      const httpFailures = requests.filter(request => request.status >= 400).length;
      return `| ${surface} | ${requests.length} | ${javascript} | ${(javascriptBytes / 1_000_000).toFixed(2)} MB | ${(totalBytes / 1_000_000).toFixed(2)} MB | ${deferred} | ${httpFailures} |`;
    }),
    "",
    `SoundKeys route trigger: ${soundKeysLoadedFiles.length ? soundKeysLoadedFiles.join(", ") : "none"}.`,
    `Offline installation: ${offline.precacheFiles} shell/Home files, ${(offline.precacheBytes / 1_000_000).toFixed(2)} MB raw. Offline sign-in and on-demand Quest executable recovery passed.`,
    failures.length
      ? `Result: FAIL — ${failures.join("; ")}`
      : "Result: PASS — both production shells stay inside request and raw-byte budgets, avoid deferred chunks, and /soundkeys loads its deferred entry."
  ].join("\n");
  fs.writeFileSync(path.join(artifactDir, "first-load-network.md"), `${summary}\n`);
  console.log(summary);
  if (failures.length) process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  await server.close();
}
